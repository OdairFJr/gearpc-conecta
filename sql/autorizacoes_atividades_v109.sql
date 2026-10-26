-- GEArPC v109: autorização por jovem e atividade, eletrônica ou papel.
-- Reaproveita autorizacoes_atividade e a regra de acesso do app.
alter table public.autorizacoes_atividade
 add column if not exists meio_assinatura text
  check (meio_assinatura in ('eletronica','papel')),
 add column if not exists nome_assinante text,
 add column if not exists assinante_user_id uuid references auth.users(id),
 add column if not exists confirmado_por_chefia uuid references auth.users(id),
 add column if not exists recebido_pela_chefia_em timestamptz;

create table if not exists public.autorizacao_eventos_v109 (
 id bigint generated always as identity primary key,
 atividade_id bigint not null references public.atividades(id) on delete cascade,
 jovem_id bigint not null references public.jovens(id) on delete cascade,
 responsavel_id bigint not null references public.responsaveis(id),
 resposta text not null check (resposta in ('autorizado','nao_autorizado')),
 meio text not null check (meio in ('eletronica','papel')),
 nome_assinante text not null,
 registro_por uuid not null references auth.users(id),
 registrado_em timestamptz not null default now(),
 versao_atividade integer not null,
 dados_autorizados jsonb not null,
 termo_aceito boolean not null,
 constraint assinatura_explicita check (
  meio='papel' or termo_aceito=true
 )
);
create index if not exists autorizacao_eventos_v109_jovem_idx
 on public.autorizacao_eventos_v109(jovem_id,atividade_id,registrado_em desc);
alter table public.autorizacao_eventos_v109 enable row level security;
revoke all on public.autorizacao_eventos_v109 from public,anon,authenticated;
grant select on public.autorizacao_eventos_v109 to authenticated;

-- Visibilidade estrita à seção (além de admin, família e dirigentes já
-- contemplados por suas políticas próprias de consulta geral).
drop policy if exists "autorizacoes_ver" on public.autorizacoes_atividade;
create policy "autorizacoes_ver" on public.autorizacoes_atividade
 for select to authenticated using(
 private.sou_admin() or private.sou_responsavel_jovem(jovem_id)
 or exists(select 1 from public.jovens j
   where j.id=jovem_id and private.sou_chefia_secao(j.secao_id))
);
drop policy if exists "autorizacao_eventos_v109_ver" on public.autorizacao_eventos_v109;
create policy "autorizacao_eventos_v109_ver" on public.autorizacao_eventos_v109
 for select to authenticated using(
 private.sou_admin() or private.sou_responsavel_jovem(jovem_id)
 or exists(select 1 from public.jovens j
   where j.id=jovem_id and private.sou_chefia_secao(j.secao_id))
);

create or replace function public.assinar_autorizacao_eletronica_v109(
 p_atividade_id bigint,p_jovem_id bigint,p_status text,
 p_nome_digitado text,p_termo_aceito boolean
) returns jsonb language plpgsql security definer set search_path=''
as $body$
declare
 v_atividade public.atividades%rowtype;
 v_responsavel_id bigint;
 v_nome text;
 v_aut public.autorizacoes_atividade%rowtype;
begin
 if auth.uid() is null or not private.sou_responsavel_jovem(p_jovem_id) then
   raise exception 'Acesso restrito ao responsável por este jovem' using errcode='42501';
 end if;
 if p_status not in('autorizado','nao_autorizado') then
   raise exception 'Resposta inválida';
 end if;
 if p_termo_aceito is distinct from true then
   raise exception 'Confirme a declaração antes de assinar eletronicamente';
 end if;
 v_nome:=nullif(btrim(coalesce(p_nome_digitado,'')),'');
 if v_nome is null or char_length(v_nome)<5 or char_length(v_nome)>200 then
   raise exception 'Digite seu nome completo para a assinatura eletrônica';
 end if;
 v_responsavel_id:=private.meu_responsavel_id();
 if v_responsavel_id is null then
   raise exception 'Sua conta não está vinculada a um responsável' using errcode='42501';
 end if;
 if not exists (select 1 from public.responsaveis r
   where r.id=v_responsavel_id and lower(btrim(r.nome_completo))=lower(v_nome)) then
   raise exception 'O nome digitado deve corresponder ao nome completo do responsável cadastrado';
 end if;
 if not private.atividade_aplica_ao_jovem(p_atividade_id,p_jovem_id) then
   raise exception 'A atividade não corresponde a este jovem';
 end if;
 select * into v_atividade from public.atividades where id=p_atividade_id for update;
 if not found or not v_atividade.exige_autorizacao then
   raise exception 'Esta atividade não exige autorização';
 end if;
 if not exists(select 1 from public.programacoes_externas e
   where e.atividade_id=p_atividade_id and e.status='publicada') then
   raise exception 'A autorização eletrônica está disponível somente para atividades externas publicadas';
 end if;

 insert into public.autorizacoes_atividade(
   atividade_id,jovem_id,responsavel_id,status,versao_atividade,
   titulo_snapshot,data_inicio_snapshot,data_fim_snapshot,
   local_snapshot,texto_autorizacao_snapshot,assinado_em,atualizado_em,
   meio_assinatura,nome_assinante,assinante_user_id,confirmado_por_chefia,
   recebido_pela_chefia_em
 ) values (
   p_atividade_id,p_jovem_id,v_responsavel_id,p_status,
   v_atividade.autorizacao_versao,v_atividade.titulo,
   v_atividade.data_inicio,v_atividade.data_fim,v_atividade.local,
   v_atividade.texto_autorizacao,clock_timestamp(),clock_timestamp(),
   'eletronica',v_nome,auth.uid(),null,null
 )
 on conflict (atividade_id,jovem_id) do update set
   responsavel_id=excluded.responsavel_id,status=excluded.status,
   versao_atividade=excluded.versao_atividade,
   titulo_snapshot=excluded.titulo_snapshot,
   data_inicio_snapshot=excluded.data_inicio_snapshot,
   data_fim_snapshot=excluded.data_fim_snapshot,
   local_snapshot=excluded.local_snapshot,
   texto_autorizacao_snapshot=excluded.texto_autorizacao_snapshot,
   assinado_em=excluded.assinado_em,atualizado_em=excluded.atualizado_em,
   meio_assinatura='eletronica',nome_assinante=excluded.nome_assinante,
   assinante_user_id=excluded.assinante_user_id,confirmado_por_chefia=null,
   recebido_pela_chefia_em=null
 returning * into v_aut;

 insert into public.autorizacao_eventos_v109(
   atividade_id,jovem_id,responsavel_id,resposta,meio,nome_assinante,
   registro_por,versao_atividade,dados_autorizados,termo_aceito
 ) values (
   p_atividade_id,p_jovem_id,v_responsavel_id,p_status,'eletronica',
   v_nome,auth.uid(),v_atividade.autorizacao_versao,
   jsonb_build_object('titulo',v_atividade.titulo,
     'inicio',v_atividade.data_inicio,'fim',v_atividade.data_fim,
     'local',v_atividade.local,'texto_autorizacao',v_atividade.texto_autorizacao,
     'status',p_status),true
 );
 return jsonb_build_object('ok',true,'autorizacao_id',v_aut.id,
   'status',v_aut.status,'assinado_em',v_aut.assinado_em);
end $body$;
revoke all on function public.assinar_autorizacao_eletronica_v109(
 bigint,bigint,text,text,boolean) from public,anon,authenticated;
grant execute on function public.assinar_autorizacao_eletronica_v109(
 bigint,bigint,text,text,boolean) to authenticated;

-- Recebimento de formulário impresso e assinado: registro feito pela chefia
-- após conferir fisicamente o papel. Não equivale a captura digital do original.
create or replace function public.receber_autorizacao_papel_v109(
 p_atividade_id bigint,p_jovem_id bigint,p_responsavel_id bigint
) returns jsonb language plpgsql security definer set search_path=''
as $body$
declare
 v_atividade public.atividades%rowtype;
 v_nome text;
 v_aut public.autorizacoes_atividade%rowtype;
 v_secao_id bigint;
begin
 if auth.uid() is null then raise exception 'É necessário entrar no aplicativo' using errcode='42501';end if;
 select secao_id into v_secao_id from public.jovens where id=p_jovem_id;
 if v_secao_id is null or not(private.sou_admin() or private.sou_chefia_secao(v_secao_id)) then
   raise exception 'Sem permissão para receber autorizações desta seção' using errcode='42501';
 end if;
 if not exists(select 1 from public.jovem_responsaveis jr
   where jr.jovem_id=p_jovem_id and jr.responsavel_id=p_responsavel_id) then
   raise exception 'Responsável não vinculado a este jovem';
 end if;
 select nome_completo into v_nome from public.responsaveis where id=p_responsavel_id;
 if not private.atividade_aplica_ao_jovem(p_atividade_id,p_jovem_id) then
   raise exception 'Atividade não se aplica ao jovem';
 end if;
 select * into v_atividade from public.atividades where id=p_atividade_id for update;
 if not found or not v_atividade.exige_autorizacao then
   raise exception 'Esta atividade não exige autorização';
 end if;
 if not exists(select 1 from public.programacoes_externas e
   where e.atividade_id=p_atividade_id and e.status='publicada') then
   raise exception 'Só é possível registrar a via impressa de uma atividade externa publicada';
 end if;
 insert into public.autorizacoes_atividade (
   atividade_id,jovem_id,responsavel_id,status,versao_atividade,
   titulo_snapshot,data_inicio_snapshot,data_fim_snapshot,
   local_snapshot,texto_autorizacao_snapshot,assinado_em,atualizado_em,
   meio_assinatura,nome_assinante,assinante_user_id,confirmado_por_chefia,
   recebido_pela_chefia_em
 ) values (
   p_atividade_id,p_jovem_id,p_responsavel_id,'autorizado',
   v_atividade.autorizacao_versao,v_atividade.titulo,v_atividade.data_inicio,
   v_atividade.data_fim,v_atividade.local,v_atividade.texto_autorizacao,
   clock_timestamp(),clock_timestamp(),
   'papel',v_nome,null,auth.uid(),clock_timestamp()
 )
 on conflict(atividade_id,jovem_id) do update set
   responsavel_id=excluded.responsavel_id,status='autorizado',
   versao_atividade=excluded.versao_atividade,
   titulo_snapshot=excluded.titulo_snapshot,
   data_inicio_snapshot=excluded.data_inicio_snapshot,
   data_fim_snapshot=excluded.data_fim_snapshot,
   local_snapshot=excluded.local_snapshot,
   texto_autorizacao_snapshot=excluded.texto_autorizacao_snapshot,
   assinado_em=excluded.assinado_em,atualizado_em=excluded.atualizado_em,
   meio_assinatura='papel',nome_assinante=excluded.nome_assinante,
   assinante_user_id=null,confirmado_por_chefia=auth.uid(),
   recebido_pela_chefia_em=excluded.recebido_pela_chefia_em
 returning * into v_aut;

 insert into public.autorizacao_eventos_v109 (
   atividade_id,jovem_id,responsavel_id,resposta,meio,nome_assinante,
   registro_por,versao_atividade,dados_autorizados,termo_aceito
 ) values(
   p_atividade_id,p_jovem_id,p_responsavel_id,'autorizado','papel',v_nome,
   auth.uid(),v_atividade.autorizacao_versao,
   jsonb_build_object('titulo',v_atividade.titulo,
      'inicio',v_atividade.data_inicio,'fim',v_atividade.data_fim,
      'local',v_atividade.local,'texto_autorizacao',v_atividade.texto_autorizacao,
      'recebimento','Confirmado pela chefia após conferir documento físico'),
   false
 );
 return jsonb_build_object('ok',true,'status','autorizado','meio','papel');
end $body$;
revoke all on function public.receber_autorizacao_papel_v109(bigint,bigint,bigint)
 from public,anon,authenticated;
grant execute on function public.receber_autorizacao_papel_v109(bigint,bigint,bigint)
 to authenticated;


-- Consulta concentrada com recorte autenticado. Família enxerga exclusivamente
-- jovens vinculados; chefia enxerga exclusivamente sua seção.
create or replace function public.listar_autorizacoes_familia_v109()
returns jsonb language plpgsql stable security definer set search_path=''
as $fn$
declare result jsonb;
begin
 if auth.uid() is null or not exists(
   select 1 from public.perfis_usuarios p
   where p.user_id=auth.uid() and p.ativo and p.responsavel_id is not null
 ) then
   raise exception 'Acesso reservado aos responsáveis vinculados' using errcode='42501';
 end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'atividade_id',a.id,'titulo',a.titulo,'descricao',a.descricao,
  'local',a.local,'inicio',a.data_inicio,'fim',a.data_fim,
  'texto_autorizacao',a.texto_autorizacao,'versao',a.autorizacao_versao,
  'jovem_id',j.id,'jovem_nome',j.nome_completo,'secao_nome',s.nome,
  'responsavel_nome',r.nome_completo,
  'status',aut.status,'meio',aut.meio_assinatura,
  'nome_assinante',aut.nome_assinante,'assinado_em',aut.assinado_em,
  'versao_assinada',aut.versao_atividade
  ) order by a.data_inicio,j.nome_completo),'[]'::jsonb) into result
 from public.perfis_usuarios p
 join public.responsaveis r on r.id=p.responsavel_id
 join public.jovem_responsaveis jr on jr.responsavel_id=p.responsavel_id
 join public.jovens j on j.id=jr.jovem_id and j.ativo
 join public.secoes s on s.id=j.secao_id
 join public.programacoes_externas e on e.status='publicada'
 join public.atividades a on a.id=e.atividade_id
   and a.exige_autorizacao=true
   and a.data_inicio::date >= current_date-30
 left join public.autorizacoes_atividade aut
   on aut.atividade_id=a.id and aut.jovem_id=j.id
 where p.user_id=auth.uid() and p.ativo
   and (a.atividade_geral or exists(select 1 from public.atividade_ramos ar
     where ar.atividade_id=a.id and ar.ramo_id=j.ramo_id));
 return coalesce(result,'[]'::jsonb);
end $fn$;
revoke all on function public.listar_autorizacoes_familia_v109()
 from public,anon,authenticated;
grant execute on function public.listar_autorizacoes_familia_v109() to authenticated;

create or replace function public.listar_autorizacoes_chefia_v109(
 p_secao_id bigint default null
) returns jsonb language plpgsql stable security definer set search_path=''
as $fn$
declare result jsonb;
begin
 if auth.uid() is null or not(private.sou_admin() or exists(
    select 1 from public.chefes c
    join public.perfis_usuarios p on p.chefe_id=c.id
    where p.user_id=auth.uid() and p.ativo
 )) then
   raise exception 'Acesso reservado à administração e chefia' using errcode='42501';
 end if;
 if p_secao_id is not null and not(private.sou_admin()
    or private.sou_chefia_secao(p_secao_id)) then
   raise exception 'Sem permissão para consultar esta seção' using errcode='42501';
 end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'atividade_id',a.id,'titulo',a.titulo,'inicio',a.data_inicio,
  'fim',a.data_fim,'local',a.local,'versao',a.autorizacao_versao,
  'jovem_id',j.id,'jovem_nome',j.nome_completo,
  'secao_id',j.secao_id,'secao_nome',s.nome,
  'status',aut.status,'meio',aut.meio_assinatura,
  'nome_assinante',aut.nome_assinante,
  'assinado_em',aut.assinado_em,'versao_assinada',aut.versao_atividade,
  'confirmado_por_chefia',aut.confirmado_por_chefia,
  'responsaveis',coalesce((select jsonb_agg(jsonb_build_object(
    'id',r.id,'nome',r.nome_completo) order by r.nome_completo)
    from public.jovem_responsaveis jr
    join public.responsaveis r on r.id=jr.responsavel_id
    where jr.jovem_id=j.id),'[]'::jsonb)
  ) order by a.data_inicio,j.nome_completo),'[]'::jsonb) into result
 from public.jovens j
 join public.secoes s on s.id=j.secao_id
 join public.programacoes_externas e on e.status='publicada'
 join public.atividades a on a.id=e.atividade_id
    and a.exige_autorizacao=true
    and a.data_inicio::date >= current_date-30
 left join public.autorizacoes_atividade aut
   on aut.jovem_id=j.id and aut.atividade_id=a.id
 where j.ativo
   and (p_secao_id is null or j.secao_id=p_secao_id)
   and (private.sou_admin() or private.sou_chefia_secao(j.secao_id))
   and (a.atividade_geral or exists(select 1 from public.atividade_ramos ar
     where ar.atividade_id=a.id and ar.ramo_id=j.ramo_id));
 return coalesce(result,'[]'::jsonb);
end $fn$;
revoke all on function public.listar_autorizacoes_chefia_v109(bigint)
 from public,anon,authenticated;
grant execute on function public.listar_autorizacoes_chefia_v109(bigint) to authenticated;
