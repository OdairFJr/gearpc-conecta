-- GEArPC v110: autorização padrão baseada no modelo entregue do Paxtu.
-- Não duplica ficha médica nem dados sensíveis do Paxtu em um documento público.
create or replace function private.termo_autorizacao_externa_v110(p_chefe text)
returns text language sql immutable set search_path=''
as $fn$
 select 'Tendo total ciência de que o Grupo Escoteiro, na figura do/a Chefe ' ||
 coalesce(nullif(btrim(p_chefe),''),'responsável pela atividade') ||
 ', é responsável pelo(a) associado(a) apenas durante a realização da referida atividade, ficando isento de responsabilidades pelo deslocamento do(a) associado(a) de sua residência até o local de saída da atividade, como seu retorno do local de chegada da atividade até sua residência, subscrevo-me.';
$fn$;
revoke all on function private.termo_autorizacao_externa_v110(text)
 from public,anon,authenticated;

-- Rascunhos não aceitam mais texto próprio; autorização é gerada pelo
-- servidor somente após publicação, do modelo versionado.
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
 v_autorizacao boolean := true;
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
    texto_autorizacao=null,
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
    null,
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
  'chefe_responsavel',e.responsavel_nome,
  'tipo_externo',e.tipo,'transporte',e.transporte,
  'ponto_encontro',e.ponto_encontro,'custo_individual',e.custo_estimado,
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
grant execute on function public.listar_autorizacoes_familia_v109()
 to authenticated;
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
     'modelo','gearpcc-paxtu-v110',
     'status',p_status),true
 );
 return jsonb_build_object('ok',true,'autorizacao_id',v_aut.id,
   'status',v_aut.status,'assinado_em',v_aut.assinado_em);
end $body$;
revoke all on function public.assinar_autorizacao_eletronica_v109(bigint,bigint,text,text,boolean)
 from public,anon,authenticated;
grant execute on function public.assinar_autorizacao_eletronica_v109(bigint,bigint,text,text,boolean)
 to authenticated;
