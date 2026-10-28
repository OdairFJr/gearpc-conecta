-- GEArPC Conecta v112 — Roteiro externo existente em PDF/Word.
-- Anexo interno, privado, separado do Plano de Segurança e das autorizações.
alter table public.programacoes_externas
 add column if not exists roteiro_arquivo_path text,
 add column if not exists roteiro_arquivo_nome text,
 add column if not exists roteiro_arquivo_mime text,
 add column if not exists roteiro_arquivo_tamanho bigint,
 add column if not exists roteiro_arquivo_atualizado_em timestamptz;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'gearpc-roteiros-externos','gearpc-roteiros-externos',false,15728640,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
) on conflict (id) do update
  set public=false,file_size_limit=excluded.file_size_limit,
      allowed_mime_types=excluded.allowed_mime_types;

-- Requisito da estrutura: <id de programação>/<UUID>.<pdf|doc|docx>.
-- Helpers executados com privilégios do esquema, verificando SEMPRE o perfil,
-- a seção organizadora, o status e a existência do registro.
create or replace function private.pode_gravar_roteiro_externo_v112(p_path text)
returns boolean language sql stable security definer set search_path=''
as $fn$
 select auth.uid() is not null
  and coalesce(p_path ~ '^[0-9]{1,15}/[0-9a-f-]{36}\.(pdf|doc|docx)$',false)
  and exists(
    select 1 from public.programacoes_externas e
    where e.id=split_part(p_path,'/',1)::bigint
      and e.status in ('rascunho','ajustes')
      and (private.sou_admin() or
           (not e.atividade_geral and private.sou_chefia_secao(e.secao_id)))
  );
$fn$;
create or replace function private.pode_ler_roteiro_externo_v112(p_path text)
returns boolean language sql stable security definer set search_path=''
as $fn$
 select auth.uid() is not null and exists(
  select 1 from public.programacoes_externas e
  where e.roteiro_arquivo_path=p_path
    and (private.sou_admin() or private.sou_dirigente()
      or (not e.atividade_geral and (
         private.sou_chefia_secao(e.secao_id)
         or private.sou_chefia_participante_externa_v111(e.id))))
 );
$fn$;
create or replace function private.pode_excluir_roteiro_orfao_v112(p_path text)
returns boolean language sql stable security definer set search_path=''
as $fn$
 select private.pode_gravar_roteiro_externo_v112(p_path) and
   not exists(select 1 from public.programacoes_externas e
      where e.roteiro_arquivo_path=p_path);
$fn$;

drop policy if exists "gearpcc_v112_roteiro_upload" on storage.objects;
create policy "gearpcc_v112_roteiro_upload"
on storage.objects for insert to authenticated with check(
 bucket_id='gearpc-roteiros-externos'
 and owner_id=auth.uid()::text
 and private.pode_gravar_roteiro_externo_v112(name)
);
drop policy if exists "gearpcc_v112_roteiro_download" on storage.objects;
create policy "gearpcc_v112_roteiro_download"
on storage.objects for select to authenticated using(
 bucket_id='gearpc-roteiros-externos'
 and private.pode_ler_roteiro_externo_v112(name)
);
drop policy if exists "gearpcc_v112_roteiro_limpar_orfao" on storage.objects;
create policy "gearpcc_v112_roteiro_limpar_orfao"
on storage.objects for delete to authenticated using(
 bucket_id='gearpc-roteiros-externos'
 and owner_id=auth.uid()::text
 and private.pode_excluir_roteiro_orfao_v112(name)
);

create or replace function public.vincular_roteiro_documento_externo_v112(
 p_id bigint,p_path text,p_nome text,p_atualizado_em timestamptz
) returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare
 v public.programacoes_externas%rowtype;
 o storage.objects%rowtype;
 v_type text;
 v_tamanho bigint;
begin
 if auth.uid() is null then raise exception 'Faça login novamente' using errcode='42501';end if;
 select * into v from public.programacoes_externas where id=p_id for update;
 if not found then raise exception 'Programação não encontrada';end if;
 if not(private.sou_admin() or
   (not v.atividade_geral and private.sou_chefia_secao(v.secao_id))) then
    raise exception 'Sem permissão para anexar roteiro nesta seção' using errcode='42501';
 end if;
 if v.status not in ('rascunho','ajustes') then
   raise exception 'Somente rascunhos ou programações em ajustes aceitam documentos';
 end if;
 if p_atualizado_em is distinct from v.atualizado_em then
   raise exception 'A programação foi modificada. Atualize e tente novamente' using errcode='40001';
 end if;
 if nullif(btrim(coalesce(p_nome,'')),'') is null
   or char_length(p_nome)>180
   or p_nome !~* '\.(pdf|doc|docx)$' then
   raise exception 'Selecione um documento PDF, DOC ou DOCX válido';
 end if;
 if lower(regexp_replace(p_nome,'^.*\\.','')) <>
    lower(regexp_replace(p_path,'^.*\\.','')) then
    raise exception 'A extensão do documento não corresponde ao arquivo armazenado';
 end if;
 if p_path is null or not private.pode_gravar_roteiro_externo_v112(p_path)
  or split_part(p_path,'/',1)<>p_id::text then
   raise exception 'Caminho do anexo inválido';
 end if;
 select * into o from storage.objects
  where bucket_id='gearpc-roteiros-externos'
   and name=p_path and owner_id=auth.uid()::text
  for update;
 if not found then raise exception 'Arquivo não localizado no armazenamento privado';end if;
 v_type:=case
  when lower(p_path) like '%.pdf' then 'application/pdf'
  when lower(p_path) like '%.docx' then 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  else 'application/msword' end;
 v_tamanho:=coalesce(nullif(o.metadata->>'size','')::bigint,0);
 if v_tamanho<1 or v_tamanho>15728640 then
   raise exception 'O arquivo deve ter até 15 MB e não pode estar vazio';
 end if;
 if o.metadata->>'mimetype' is distinct from v_type then
   raise exception 'O tipo do arquivo no armazenamento não corresponde à extensão';
 end if;
 update public.programacoes_externas set
   roteiro_arquivo_path=p_path,roteiro_arquivo_nome=btrim(p_nome),
   roteiro_arquivo_mime=v_type,roteiro_arquivo_tamanho=v_tamanho,
   roteiro_arquivo_atualizado_em=clock_timestamp(),
   atualizado_em=clock_timestamp()
 where id=p_id;
 return (select jsonb_build_object(
  'ok',true,'id',id,'nome',roteiro_arquivo_nome,'tamanho',roteiro_arquivo_tamanho,
  'path',roteiro_arquivo_path,'atualizado_em',atualizado_em)
  from public.programacoes_externas where id=p_id);
end $fn$;
revoke all on function public.vincular_roteiro_documento_externo_v112(bigint,text,text,timestamptz)
 from public,anon,authenticated;
grant execute on function public.vincular_roteiro_documento_externo_v112(bigint,text,text,timestamptz)
 to authenticated;

create or replace function public.desvincular_roteiro_documento_externo_v112(
 p_id bigint
) returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v public.programacoes_externas%rowtype;
begin
 if auth.uid() is null then raise exception 'Faça login' using errcode='42501';end if;
 select * into v from public.programacoes_externas where id=p_id for update;
 if not found then raise exception 'Programação não encontrada';end if;
 if not(private.sou_admin() or
  (not v.atividade_geral and private.sou_chefia_secao(v.secao_id))) or
  v.status not in ('rascunho','ajustes') then
    raise exception 'Não é possível remover o documento desta programação' using errcode='42501';
 end if;
 update public.programacoes_externas set
  roteiro_arquivo_path=null,roteiro_arquivo_nome=null,
  roteiro_arquivo_mime=null,roteiro_arquivo_tamanho=null,
  roteiro_arquivo_atualizado_em=null,atualizado_em=clock_timestamp()
 where id=p_id;
 return jsonb_build_object('ok',true,'path_anterior',v.roteiro_arquivo_path);
end $fn$;
revoke all on function public.desvincular_roteiro_documento_externo_v112(bigint)
 from public,anon,authenticated;
grant execute on function public.desvincular_roteiro_documento_externo_v112(bigint)
 to authenticated;

-- Aceita roteiro estruturado OU anexo. O PDF/Word nunca dispensa
-- dados mínimos de cadastro, participantes e a aprovação do Plano de Segurança.
create or replace function public.mudar_status_programacao_externa_v107(
 p_id bigint,p_acao text,p_parecer text default null
) returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v public.programacoes_externas%rowtype;
 v_atividade_id bigint;v_ramo_id bigint;
begin
 if auth.uid() is null then raise exception 'Faça login novamente' using errcode='42501';end if;
 select * into v from public.programacoes_externas where id=p_id for update;
 if not found then raise exception 'Programação não encontrada';end if;
 if v.atividade_geral and not private.sou_admin() then
   raise exception 'Somente a administração pode controlar atividades gerais' using errcode='42501';
 end if;
 if p_acao='enviar' then
   if not (private.sou_admin() or private.sou_chefia_secao(v.secao_id)) then
     raise exception 'Sem permissão nesta seção' using errcode='42501';
   end if;
   if v.status not in ('rascunho','ajustes') then raise exception 'Somente rascunhos ou ajustes podem ser enviados';end if;
   if not exists (select 1 from public.programacoes_externas_etapas
      where programacao_id=p_id)
     and nullif(btrim(coalesce(v.roteiro_arquivo_path,'')),'') is null then
      raise exception 'Inclua as etapas do roteiro ou anexe um arquivo PDF/Word antes de enviar ao DME';
   end if;
   if nullif(btrim(coalesce(v.responsavel_nome,'')),'') is null then
     raise exception 'Informe o chefe responsável antes de enviar ao DME';
   end if;
   if not exists (select 1 from public.programacao_externa_secoes_v111 where programacao_id=p_id)
      or not exists (select 1 from public.programacao_externa_jovens_v111 where programacao_id=p_id)
        and not exists (select 1 from public.programacao_externa_chefes_v111 where programacao_id=p_id) then
     raise exception 'Selecione as seções e pelo menos um participante antes de enviar ao DME';
   end if;
   update public.programacoes_externas set status='em_analise',atualizado_em=clock_timestamp()
   where id=p_id;
 elsif p_acao in('aprovar','ajustar') then
   if not private.sou_admin() then raise exception 'Parecer reservado à administração/DME' using errcode='42501';end if;
   if v.status not in('em_analise','aprovada') then raise exception 'Esta atividade não está em conferência';end if;
   if p_acao='ajustar' and nullif(btrim(coalesce(p_parecer,'')),'') is null then
     raise exception 'Informe as orientações para os ajustes';
   end if;
   update public.programacoes_externas set
     status=case when p_acao='aprovar' then 'aprovada' else 'ajustes' end,
     parecer_dme=nullif(btrim(p_parecer),''),
     revisado_por=auth.uid(),revisado_em=now(),atualizado_em=clock_timestamp()
   where id=p_id;
 elsif p_acao='publicar' then
   if not private.sou_admin() then raise exception 'Publicação reservada à administração' using errcode='42501';end if;
   if v.status<>'aprovada' then raise exception 'Somente programações aprovadas podem ser publicadas';end if;
   if v.plano_seguranca_visit_id is null then
     raise exception 'Vincule um plano de segurança aprovado pelo DME antes de publicar';
   end if;
   if not private.plano_seguranca_externa_multi_v111(p_id) then
     raise exception 'O plano de segurança vinculado não está aprovado ou não corresponde à data e às seções da atividade';
   end if;
   if v.tipo in('acampamento','acantonamento') and not v.exige_autorizacao then
     raise exception 'Atividades com pernoite exigem autorização dos responsáveis';
   end if;

   if nullif(btrim(coalesce(v.responsavel_nome,'')),'') is null then
     raise exception 'Informe o chefe responsável para gerar a autorização padronizada';
   end if;
   select ramo_id into v_ramo_id from public.secoes where id=v.secao_id;
   if v_ramo_id is null then raise exception 'Seção sem ramo válido';end if;
   insert into public.atividades
    (titulo,descricao,data_inicio,data_fim,local,atividade_geral,
     exige_autorizacao,texto_autorizacao)
   values (v.titulo,concat_ws(E'\n',
       nullif(v.objetivo,''),
       case when nullif(v.ponto_encontro,'') is not null then 'Encontro e retorno: '||v.ponto_encontro end,
       case when nullif(v.link_mapa,'') is not null then 'Mapa: '||v.link_mapa end,
       case when nullif(v.transporte,'') is not null then 'Transporte: '||v.transporte end,
       case when nullif(v.alimentacao,'') is not null then 'Alimentação e água: '||v.alimentacao end,
       case when nullif(v.materiais,'') is not null then 'Materiais necessários: '||v.materiais end,
       case when v.custo_estimado is not null then 'Custo estimado por participante: R$ '||to_char(v.custo_estimado,'FM999999990D00') end,
       nullif(v.observacoes,'')),
     v.data_inicio,v.data_fim,v.local,v.atividade_geral,true,
        private.termo_autorizacao_externa_v110(v.responsavel_nome))
   returning id into v_atividade_id;
   if not v.atividade_geral then
     insert into public.atividade_ramos(atividade_id,ramo_id)
     select distinct v_atividade_id,s.ramo_id
       from public.programacao_externa_secoes_v111 es
       join public.secoes s on s.id=es.secao_id
       where es.programacao_id=p_id;
   end if;
   update public.programacoes_externas set
     status='publicada',atividade_id=v_atividade_id,atualizado_em=clock_timestamp()
   where id=p_id;
 else raise exception 'Ação inválida';
 end if;
 return (select jsonb_build_object('id',id,'status',status,
    'parecer_dme',parecer_dme,'atividade_id',atividade_id)
   from public.programacoes_externas where id=p_id);
end $fn$;
revoke all on function public.mudar_status_programacao_externa_v107(bigint,text,text)
 from public,anon,authenticated;
grant execute on function public.mudar_status_programacao_externa_v107(bigint,text,text)
 to authenticated;


-- A limpeza de anexos substituídos precisa de SELECT + DELETE do próprio objeto
-- órfão; os documentos já vinculados seguem acessíveis apenas à equipe autorizada.
drop policy if exists "gearpcc_v112_roteiro_orfao_proprio" on storage.objects;
create policy "gearpcc_v112_roteiro_orfao_proprio"
 on storage.objects for select to authenticated using (
  bucket_id='gearpc-roteiros-externos'
  and owner_id=auth.uid()::text
  and private.pode_excluir_roteiro_orfao_v112(name)
 );
