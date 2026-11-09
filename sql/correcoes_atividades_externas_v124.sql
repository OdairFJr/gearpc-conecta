begin;

-- O CPF pertence à assinatura, nunca ao cadastro do jovem ou do responsável.
create table private.autorizacao_cpf_v124 (
  evento_id bigint primary key references public.autorizacao_eventos_v109(id) on delete cascade,
  cpf text not null check (cpf ~ '^[0-9]{11}$')
);
alter table private.autorizacao_cpf_v124 enable row level security;
revoke all on private.autorizacao_cpf_v124 from public, anon, authenticated;

create function public.assinar_autorizacao_eletronica_v124(
  p_atividade_id bigint, p_jovem_id bigint, p_status text, p_nome_digitado text,
  p_tipo_documento text, p_numero_documento text, p_termo_aceito boolean, p_versao integer
) returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare
  v_versao integer;
  v_resultado jsonb;
  v_evento bigint;
begin
  if auth.uid() is null or not private.sou_responsavel_jovem(p_jovem_id) then
    raise exception 'Acesso restrito ao responsável por este jovem' using errcode='42501';
  end if;
  select autorizacao_versao into v_versao
  from public.atividades where id=p_atividade_id for update;
  if not found or p_versao is distinct from v_versao then
    raise exception 'A atividade foi alterada ou retirada. Atualize as autorizações.';
  end if;
  v_resultado := public.assinar_autorizacao_eletronica_v118(
    p_atividade_id,p_jovem_id,p_status,p_nome_digitado,
    p_tipo_documento,p_numero_documento,p_termo_aceito
  );
  if v_resultado->>'ok' is distinct from 'true' then
    raise exception 'O servidor não confirmou a assinatura';
  end if;
  if v_resultado->>'documento_tipo'='CPF' then
    select id into strict v_evento from public.autorizacao_eventos_v109
    where atividade_id=p_atividade_id and jovem_id=p_jovem_id
      and versao_atividade=v_versao and registro_por=auth.uid() and meio='eletronica'
    order by id desc limit 1;
    insert into private.autorizacao_cpf_v124(evento_id,cpf)
    values (v_evento,regexp_replace(p_numero_documento,'[^0-9]','','g'));
  end if;
  return v_resultado;
end
$fn$;

create function public.obter_documento_autorizacao_externa_v124(
  p_atividade_id bigint, p_jovem_id bigint, p_simulacao boolean default false
) returns jsonb language plpgsql stable security definer set search_path=''
as $fn$
declare
  v_documento jsonb;
  v_cpf text;
begin
  -- A consulta existente valida atividade publicada, versão e perfil de chefia/admin.
  v_documento := public.obter_documento_autorizacao_externa_v122(
    p_atividade_id,p_jovem_id,p_simulacao
  );
  if v_documento->>'simulado'='false' then
    select cpf into v_cpf from private.autorizacao_cpf_v124
    where evento_id=(v_documento->>'evento_id')::bigint;
    if v_cpf is not null then
      v_documento := v_documento || jsonb_build_object(
        'documento_completo', regexp_replace(v_cpf,'^([0-9]{3})([0-9]{3})([0-9]{3})([0-9]{2})$','\1.\2.\3-\4')
      );
    end if;
  end if;
  return v_documento;
end
$fn$;

create function public.corrigir_atividade_externa_publicada_v124(
  p_id bigint, p_atualizado_em timestamptz, p_inicio timestamptz, p_fim timestamptz, p_local text
) returns void language plpgsql security definer set search_path=''
as $fn$
declare v public.programacoes_externas%rowtype;
begin
  if auth.uid() is null or not private.sou_admin() then
    raise exception 'Alteração reservada à administração' using errcode='42501';
  end if;
  select * into v from public.programacoes_externas where id=p_id for update;
  if not found or v.status<>'publicada' or v.atividade_id is null then
    raise exception 'A programação não está publicada';
  end if;
  if v.atualizado_em is distinct from p_atualizado_em then
    raise exception 'A programação foi atualizada. Reabra antes de corrigir.';
  end if;
  p_local := nullif(btrim(p_local),'');
  if p_inicio is null or p_fim is null or not isfinite(p_inicio) or not isfinite(p_fim)
      or p_fim<=p_inicio or p_local is null then
    raise exception 'Informe início, término e local válidos';
  end if;
  if (p_inicio,p_fim,p_local) is not distinct from (v.data_inicio,v.data_fim,v.local) then
    raise exception 'Nenhuma alteração de data, horário ou local foi informada';
  end if;
  -- Preserva o roteiro e participantes. A publicação antiga e suas respostas são removidas.
  update public.programacoes_externas set
    data_inicio=p_inicio, data_fim=p_fim, local=p_local, status='ajustes',
    atividade_id=null, parecer_dme=null, revisado_por=null, revisado_em=null,
    plano_seguranca_visit_id=null, plano_seguranca_vinculado_por=null,
    plano_seguranca_vinculado_em=null, atualizado_em=clock_timestamp()
  where id=p_id;
  delete from public.atividades where id=v.atividade_id;
end
$fn$;

-- O cadastro genérico de atividades não pode contornar o fluxo das externas.
create function private.atividade_tem_programacao_externa_v124(p_id bigint)
returns boolean language sql stable security definer set search_path=''
as $fn$
  select exists (select 1 from public.programacoes_externas where atividade_id=p_id);
$fn$;
revoke all on function private.atividade_tem_programacao_externa_v124(bigint) from public, anon;
grant execute on function private.atividade_tem_programacao_externa_v124(bigint) to authenticated;

create policy atividade_externa_bloquear_edicao_direta_v124 on public.atividades
  as restrictive for update to authenticated
  using (not private.atividade_tem_programacao_externa_v124(id))
  with check (not private.atividade_tem_programacao_externa_v124(id));
create policy atividade_externa_bloquear_exclusao_direta_v124 on public.atividades
  as restrictive for delete to authenticated
  using (not private.atividade_tem_programacao_externa_v124(id));

-- O Storage API remove os objetos e o arquivo físico. SQL só verifica se a pasta esvaziou.
create function private.pode_limpar_roteiro_externo_v124(p_path text)
returns boolean language sql stable security definer set search_path=''
as $fn$
  select auth.uid() is not null and private.sou_admin() and exists (
    select 1 from public.programacoes_externas e
    where e.id::text=split_part(p_path,'/',1)
  );
$fn$;
revoke all on function private.pode_limpar_roteiro_externo_v124(text) from public, anon;
grant execute on function private.pode_limpar_roteiro_externo_v124(text) to authenticated;

create policy roteiro_admin_limpeza_leitura_v124 on storage.objects
  for select to authenticated using (
    bucket_id='gearpc-roteiros-externos' and private.pode_limpar_roteiro_externo_v124(name)
  );
create policy roteiro_admin_limpeza_exclusao_v124 on storage.objects
  for delete to authenticated using (
    bucket_id='gearpc-roteiros-externos' and private.pode_limpar_roteiro_externo_v124(name)
  );

create function public.excluir_programacao_externa_v124(p_id bigint, p_atualizado_em timestamptz, p_confirmar boolean default true)
returns text[] language plpgsql security definer set search_path=''
as $fn$
declare
  v public.programacoes_externas%rowtype;
  v_arquivos text[];
begin
  if auth.uid() is null or not private.sou_admin() then
    raise exception 'Exclusão reservada à administração' using errcode='42501';
  end if;
  select * into v from public.programacoes_externas where id=p_id for update;
  if not found then return array[]::text[]; end if;
  if v.atualizado_em is distinct from p_atualizado_em then
    raise exception 'A programação foi atualizada. Reabra antes de excluir.';
  end if;
  select coalesce(array_agg(name order by name),array[]::text[]) into v_arquivos
  from storage.objects where bucket_id='gearpc-roteiros-externos' and name like p_id::text||'/%';
  if p_confirmar is distinct from true then return v_arquivos; end if;
  if cardinality(v_arquivos)>0 then
    raise exception 'Ainda há arquivos no roteiro. Tente a exclusão novamente.';
  end if;
  delete from public.programacoes_externas where id=p_id;
  if v.atividade_id is not null then
    delete from public.atividades where id=v.atividade_id;
  end if;
  if v.plano_seguranca_visit_id is not null then
    delete from public.safety_approval_test_v67 where visit_id=v.plano_seguranca_visit_id;
  end if;
  return array[]::text[];
end
$fn$;

revoke all on function public.assinar_autorizacao_eletronica_v124(bigint,bigint,text,text,text,text,boolean,integer),
  public.obter_documento_autorizacao_externa_v124(bigint,bigint,boolean),
  public.corrigir_atividade_externa_publicada_v124(bigint,timestamptz,timestamptz,timestamptz,text),
  public.excluir_programacao_externa_v124(bigint,timestamptz,boolean) from public, anon;
grant execute on function public.assinar_autorizacao_eletronica_v124(bigint,bigint,text,text,text,text,boolean,integer),
  public.obter_documento_autorizacao_externa_v124(bigint,bigint,boolean),
  public.corrigir_atividade_externa_publicada_v124(bigint,timestamptz,timestamptz,timestamptz,text),
  public.excluir_programacao_externa_v124(bigint,timestamptz,boolean) to authenticated;

-- As funções antigas são usadas internamente pela nova RPC e não aceitam versão.
revoke execute on function public.assinar_autorizacao_eletronica_v109(bigint,bigint,text,text,boolean),
  public.assinar_autorizacao_eletronica_v117(bigint,bigint,text,text,text,boolean),
  public.assinar_autorizacao_eletronica_v118(bigint,bigint,text,text,text,text,boolean)
  from public, anon, authenticated;

commit;
