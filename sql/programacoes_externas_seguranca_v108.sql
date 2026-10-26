-- GEArPC Conecta v108: somente publicar atividade externa com segurança aprovada
-- no fluxo institucional de Segurança em Atividades.
alter table public.programacoes_externas
 add column if not exists plano_seguranca_visit_id text
  references public.safety_approval_test_v67(visit_id) on delete restrict,
 add column if not exists plano_seguranca_vinculado_por uuid references auth.users(id),
 add column if not exists plano_seguranca_vinculado_em timestamptz;
create unique index if not exists programacoes_externas_safety_unique_v108
 on public.programacoes_externas(plano_seguranca_visit_id)
 where plano_seguranca_visit_id is not null;

-- Plano aprovado deve corresponder à data da atividade e ao(s) ramo(s)
-- declarado(s). Atividade geral exige todas as seções ativas na abrangência.
create or replace function private.plano_seguranca_externa_valido_v108(
  p_visit_id text,p_secao_id bigint,p_inicio timestamptz,p_geral boolean
) returns boolean language sql stable security definer set search_path=''
as $fn$
 select exists(
  select 1 from public.safety_approval_test_v67 a
  where a.visit_id=p_visit_id and a.status='aprovado'
    and (a.document_payload->'plan'->>'date')=
      ((p_inicio at time zone 'America/Sao_Paulo')::date)::text
    and (
      (coalesce(p_geral,false)=false and exists(
       select 1 from public.secoes s
       where s.id=p_secao_id
         and coalesce(a.document_payload->'plan'->'sections','[]'::jsonb) ? s.nome))
      or (coalesce(p_geral,false)=true and not exists(
       select 1 from public.secoes s
       where s.ativo=true
         and not (coalesce(a.document_payload->'plan'->'sections','[]'::jsonb) ? s.nome)))
    )
 );
$fn$;

create or replace function public.listar_planos_seguranca_externa_v108()
returns table(visit_id text,atividade text,data_plano text,secoes jsonb,revisado_em timestamptz)
language plpgsql stable security definer set search_path=''
as $fn$
begin
 if auth.uid() is null or not private.sou_admin() then
  raise exception 'Consulta reservada à administração' using errcode='42501';
 end if;
 return query
 select a.visit_id,a.activity_name,
  (a.document_payload->'plan'->>'date')::text,
  coalesce(a.document_payload->'plan'->'sections','[]'::jsonb),a.reviewed_at
 from public.safety_approval_test_v67 a
 where a.status='aprovado' order by a.reviewed_at desc;
end $fn$;
revoke all on function public.listar_planos_seguranca_externa_v108() from public,anon,authenticated;
grant execute on function public.listar_planos_seguranca_externa_v108() to authenticated;

create or replace function public.vincular_plano_seguranca_externa_v108(
 p_programacao_id bigint,p_visit_id text
) returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v public.programacoes_externas%rowtype;
begin
 if auth.uid() is null or not private.sou_admin() then
  raise exception 'Somente administrador pode vincular o plano de segurança'
    using errcode='42501';
 end if;
 select * into v from public.programacoes_externas where id=p_programacao_id for update;
 if not found then raise exception 'Programação externa não encontrada';end if;
 if v.status not in ('aprovada','em_analise') then
  raise exception 'Envie e aprove o planejamento antes de vincular a segurança';
 end if;
 if nullif(btrim(coalesce(p_visit_id,'')),'') is null or
  not private.plano_seguranca_externa_valido_v108(
   p_visit_id,v.secao_id,v.data_inicio,v.atividade_geral) then
   raise exception 'Plano não aprovado ou incompatível com data/seções desta programação';
 end if;
 update public.programacoes_externas
 set plano_seguranca_visit_id=p_visit_id,
     plano_seguranca_vinculado_por=auth.uid(),
     plano_seguranca_vinculado_em=clock_timestamp(),
     atualizado_em=clock_timestamp()
 where id=p_programacao_id;
 return jsonb_build_object('ok',true,'plano_seguranca_visit_id',p_visit_id);
end $fn$;
revoke all on function public.vincular_plano_seguranca_externa_v108(bigint,text)
 from public,anon,authenticated;
grant execute on function public.vincular_plano_seguranca_externa_v108(bigint,text)
 to authenticated;

-- A publicação existente passa a verificar novamente a aprovação do plano,
-- mesmo que o status do documento tenha mudado após o vínculo.
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
      where programacao_id=p_id) then
      raise exception 'Inclua pelo menos uma etapa no roteiro antes de enviar ao DME';
   end if;
   if nullif(btrim(coalesce(v.responsavel_nome,'')),'') is null then
     raise exception 'Informe o chefe responsável antes de enviar ao DME';
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
   if not private.plano_seguranca_externa_valido_v108(
     v.plano_seguranca_visit_id,v.secao_id,v.data_inicio,v.atividade_geral
   ) then
     raise exception 'O plano de segurança vinculado não está aprovado ou não corresponde à data e às seções da atividade';
   end if;
   if v.tipo in('acampamento','acantonamento') and not v.exige_autorizacao then
     raise exception 'Atividades com pernoite exigem autorização dos responsáveis';
   end if;
   if v.exige_autorizacao and nullif(btrim(coalesce(v.texto_autorizacao,'')),'') is null then
     raise exception 'Preencha o texto da autorização dos responsáveis';
   end if;
   select ramo_id into v_ramo_id from public.secoes where id=v.secao_id;
   if v_ramo_id is null then raise exception 'Seção sem ramo válido';end if;
   insert into public.atividades
    (titulo,descricao,data_inicio,data_fim,local,atividade_geral,
     exige_autorizacao,texto_autorizacao)
   values (v.titulo,concat_ws(E'\n',
       nullif(v.objetivo,''),
       case when nullif(v.ponto_encontro,'') is not null then 'Encontro e retorno: '||v.ponto_encontro end,
       case when nullif(v.transporte,'') is not null then 'Transporte: '||v.transporte end,
       case when nullif(v.alimentacao,'') is not null then 'Alimentação e água: '||v.alimentacao end,
       case when nullif(v.materiais,'') is not null then 'Materiais necessários: '||v.materiais end,
       case when v.custo_estimado is not null then 'Custo estimado por participante: R$ '||to_char(v.custo_estimado,'FM999999990D00') end,
       nullif(v.observacoes,'')),
     v.data_inicio,v.data_fim,v.local,v.atividade_geral,v.exige_autorizacao,v.texto_autorizacao)
   returning id into v_atividade_id;
   if not v.atividade_geral then
      insert into public.atividade_ramos(atividade_id,ramo_id)
      values(v_atividade_id,v_ramo_id);
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

-- Programação externa trata de objetivos, roteiro e logística. Riscos e prevenção
-- devem constar apenas do documento de Segurança em Atividades vinculado.
create or replace function public.salvar_programacao_externa_v107(p_dados jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare
 v_id bigint := nullif(p_dados->>'id','')::bigint;
 v_secao bigint := nullif(p_dados->>'secao_id','')::bigint;
 v_inicio timestamptz := nullif(p_dados->>'data_inicio','')::timestamptz;
 v_fim timestamptz := nullif(p_dados->>'data_fim','')::timestamptz;
 v_antiga public.programacoes_externas%rowtype;
 v_nova public.programacoes_externas%rowtype;
 v_etapas jsonb := coalesce(p_dados->'etapas','[]'::jsonb);
 v_etapa jsonb; v_pos integer := 0;
 v_e_inicio timestamptz;v_e_fim timestamptz;
 v_esperado timestamptz := nullif(p_dados->>'atualizado_em','')::timestamptz;
 v_autorizacao boolean := coalesce((p_dados->>'exige_autorizacao')::boolean,true);
 v_geral boolean := coalesce((p_dados->>'atividade_geral')::boolean,false);
begin
 if auth.uid() is null then raise exception 'Faça login novamente' using errcode='42501';end if;
 if v_secao is null or not (private.sou_admin() or private.sou_chefia_secao(v_secao)) then
   raise exception 'Você não pode programar esta seção' using errcode='42501';
 end if;
 if nullif(btrim(p_dados->>'titulo'),'') is null or char_length(btrim(p_dados->>'titulo'))<3
   or nullif(btrim(p_dados->>'local'),'') is null then
   raise exception 'Preencha o nome da atividade e o local';
 end if;
 if v_inicio is null or v_fim is null or v_fim<=v_inicio then
   raise exception 'O término deve ser posterior ao início';
 end if;
 if p_dados->>'tipo' not in ('externa','acampamento','acantonamento','jornada','visita','evento','especial') then
   raise exception 'Tipo de atividade inválido';
 end if;
 if v_geral and not private.sou_admin() then
   raise exception 'Somente a administração pode programar atividades gerais do grupo' using errcode='42501';
 end if;
 if jsonb_typeof(v_etapas)<>'array' or jsonb_array_length(v_etapas)>100 then
   raise exception 'Informe no máximo 100 etapas';
 end if;
 if v_id is not null then
   select * into v_antiga from public.programacoes_externas where id=v_id for update;
   if not found then raise exception 'Programação não encontrada';end if;
   if not (private.sou_admin() or private.sou_chefia_secao(v_antiga.secao_id)) then
     raise exception 'Sem permissão para alterar a programação' using errcode='42501';
   end if;
   if v_antiga.atividade_geral and not private.sou_admin() then
     raise exception 'Somente a administração pode alterar atividades gerais' using errcode='42501';
   end if;
   if v_antiga.secao_id is distinct from v_secao then raise exception 'Não é permitido trocar a seção de uma programação já criada';end if;
   if v_antiga.status not in('rascunho','ajustes') then
     raise exception 'Programação em conferência, aprovada ou publicada: não editável';
   end if;
   if v_esperado is distinct from v_antiga.atualizado_em then
     raise exception 'A programação foi alterada por outra pessoa. Atualize antes de salvar' using errcode='40001';
   end if;
   update public.programacoes_externas set
    atividade_geral=v_geral,tipo=p_dados->>'tipo',titulo=btrim(p_dados->>'titulo'),
    objetivo=nullif(btrim(p_dados->>'objetivo'),''),
    local=btrim(p_dados->>'local'),
    ponto_encontro=nullif(btrim(p_dados->>'ponto_encontro'),''),
    data_inicio=v_inicio,data_fim=v_fim,
    transporte=nullif(btrim(p_dados->>'transporte'),''),
    alimentacao=nullif(btrim(p_dados->>'alimentacao'),''),
    materiais=nullif(btrim(p_dados->>'materiais'),''),
    riscos=null,
    prevencoes=null,
    plano_b=null,
    responsavel_nome=nullif(btrim(p_dados->>'responsavel_nome'),''),
    custo_estimado=nullif(p_dados->>'custo_estimado','')::numeric,
    exige_autorizacao=v_autorizacao,
    texto_autorizacao=nullif(btrim(p_dados->>'texto_autorizacao'),''),
    observacoes=nullif(btrim(p_dados->>'observacoes'),''),
    atualizado_em=clock_timestamp()
   where id=v_id returning * into v_nova;
   delete from public.programacoes_externas_etapas where programacao_id=v_id;
 else
   insert into public.programacoes_externas
    (secao_id,atividade_geral,tipo,titulo,objetivo,local,ponto_encontro,data_inicio,data_fim,
     transporte,alimentacao,materiais,responsavel_nome,
     custo_estimado,exige_autorizacao,texto_autorizacao,observacoes,criado_por)
   values
    (v_secao,v_geral,p_dados->>'tipo',btrim(p_dados->>'titulo'),
    nullif(btrim(p_dados->>'objetivo'),''),btrim(p_dados->>'local'),
    nullif(btrim(p_dados->>'ponto_encontro'),''),v_inicio,v_fim,
    nullif(btrim(p_dados->>'transporte'),''),nullif(btrim(p_dados->>'alimentacao'),''),
    nullif(btrim(p_dados->>'materiais'),''),nullif(btrim(p_dados->>'responsavel_nome'),''),
    nullif(p_dados->>'custo_estimado','')::numeric,v_autorizacao,
    nullif(btrim(p_dados->>'texto_autorizacao'),''),
    nullif(btrim(p_dados->>'observacoes'),''),auth.uid())
   returning * into v_nova;
 end if;
 for v_etapa in select value from jsonb_array_elements(v_etapas) loop
   v_pos:=v_pos+1;
   v_e_inicio:=nullif(v_etapa->>'inicio','')::timestamptz;
   v_e_fim:=nullif(v_etapa->>'fim','')::timestamptz;
   if v_e_inicio is null or v_e_fim is null or v_e_fim<=v_e_inicio
     or v_e_inicio<v_inicio or v_e_fim>v_fim
     or char_length(btrim(coalesce(v_etapa->>'titulo','')))<2 then
     raise exception 'Etapa % inválida: confira horários, título e limites da atividade',v_pos;
   end if;
   insert into public.programacoes_externas_etapas
    (programacao_id,ordem,inicio,fim,titulo,descricao,condutor,materiais)
   values(v_nova.id,v_pos,v_e_inicio,v_e_fim,btrim(v_etapa->>'titulo'),
    nullif(btrim(v_etapa->>'descricao'),''),
    nullif(btrim(v_etapa->>'condutor'),''),
    nullif(btrim(v_etapa->>'materiais'),''));
 end loop;
 return jsonb_build_object('id',v_nova.id,'atualizado_em',v_nova.atualizado_em,'status',v_nova.status);
end $fn$;
revoke all on function public.salvar_programacao_externa_v107(jsonb)
 from public,anon,authenticated;
grant execute on function public.salvar_programacao_externa_v107(jsonb)
 to authenticated;
