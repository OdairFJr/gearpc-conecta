-- GEArPC v111: seções e participantes explícitos, separados do cadastro juvenil;
-- nomes são consultados só por chefias ativas e administradores.
alter table public.programacoes_externas
 add column if not exists tipo_paxtu text,
 add column if not exists responsavel_chefe_id bigint references public.chefes(id),
 add column if not exists local_saida text,
 add column if not exists local_chegada text,
 add column if not exists descricao_breve text,
 add column if not exists transporte_detalhes text,
 add column if not exists online boolean not null default false,
 add column if not exists noites_acampadas boolean not null default false,
 add column if not exists indaba boolean not null default false,
 add column if not exists incluir_diretoria boolean not null default false;

create table if not exists public.programacao_externa_secoes_v111 (
 programacao_id bigint not null references public.programacoes_externas(id) on delete cascade,
 secao_id bigint not null references public.secoes(id),
 primary key(programacao_id,secao_id)
);
create table if not exists public.programacao_externa_jovens_v111 (
 programacao_id bigint not null references public.programacoes_externas(id) on delete cascade,
 jovem_id bigint not null references public.jovens(id),
 primary key(programacao_id,jovem_id)
);
create table if not exists public.programacao_externa_chefes_v111 (
 programacao_id bigint not null references public.programacoes_externas(id) on delete cascade,
 chefe_id bigint not null references public.chefes(id),
 primary key(programacao_id,chefe_id)
);

do $do$
declare t text;
begin
 foreach t in array array['programacao_externa_secoes_v111','programacao_externa_jovens_v111','programacao_externa_chefes_v111'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('drop policy if exists v111_equipe_select on public.%I',t);
  execute format('create policy v111_equipe_select on public.%I for select to authenticated
    using (exists(select 1 from public.programacoes_externas e where e.id=programacao_id))',t);
 end loop;
end $do$;

create or replace function public.candidatos_programacao_externa_v111()
returns jsonb language plpgsql stable security definer set search_path=''
as $fn$
declare v jsonb;
begin
 if auth.uid() is null or not (private.sou_admin() or exists(
   select 1 from public.perfis_usuarios p
     join public.chefe_secoes cs on cs.chefe_id=p.chefe_id
   where p.user_id=auth.uid() and p.ativo and p.tipo='chefia')) then
   raise exception 'Acesso exclusivo à chefia e administração' using errcode='42501';
 end if;
 select jsonb_build_object(
   'jovens',coalesce((select jsonb_agg(jsonb_build_object(
       'id',id,'nome',nome_completo,'secao_id',secao_id,'registro_paxtu',registro_paxtu,
       'eh_teste',eh_teste) order by nome_completo)
     from public.jovens where ativo and secao_id is not null),'[]'::jsonb),
   'chefes',coalesce((select jsonb_agg(jsonb_build_object(
       'id',id,'nome',nome_completo,'registro_paxtu',registro_paxtu,'eh_teste',eh_teste)
     order by nome_completo) from public.chefes where ativo),'[]'::jsonb),
   'chefes_secoes',coalesce((select jsonb_agg(jsonb_build_object('chefe_id',cs.chefe_id,
      'secao_id',cs.secao_id))
     from public.chefe_secoes cs
     join public.chefes c on c.id=cs.chefe_id and c.ativo),'[]'::jsonb)
 ) into v;
 return v;
end $fn$;
revoke all on function public.candidatos_programacao_externa_v111() from public,anon,authenticated;
grant execute on function public.candidatos_programacao_externa_v111() to authenticated;

-- Todos os controles são revalidados no servidor, inclusive se a interface
-- for manipulada. Um chefe só pode editar uma programação sob sua seção de referência.
create or replace function public.salvar_programacao_externa_v111(p_dados jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare
 v_id bigint;
 v_secao bigint := nullif(p_dados->>'secao_id','')::bigint;
 v_chefe bigint := nullif(p_dados->>'responsavel_chefe_id','')::bigint;
 v_secoes jsonb := coalesce(p_dados->'secoes_participantes',jsonb_build_array(v_secao));
 v_jovens jsonb := coalesce(p_dados->'jovens_participantes','[]'::jsonb);
 v_chefes jsonb := coalesce(p_dados->'chefes_participantes','[]'::jsonb);
 v_result jsonb;
 v_nome text;
 v_sid bigint;
 v_jid bigint;
 v_cid bigint;
 v_geral boolean := coalesce((p_dados->>'atividade_geral')::boolean,false);
 v_atualizado timestamptz;
begin
 if auth.uid() is null then raise exception 'Faça login novamente' using errcode='42501';end if;
 if not(private.sou_admin() or private.sou_chefia_secao(v_secao)) then
   raise exception 'Você não pode criar atividades nessa seção' using errcode='42501';
 end if;
 if v_geral and not private.sou_admin() then
   raise exception 'Somente administração pode criar atividade geral' using errcode='42501';
 end if;
 if v_secoes is null or jsonb_typeof(v_secoes)<>'array' or jsonb_array_length(v_secoes)<1
   or jsonb_array_length(v_secoes)>30 or
   jsonb_typeof(v_jovens)<>'array' or jsonb_array_length(v_jovens)>1000
   or jsonb_typeof(v_chefes)<>'array' or jsonb_array_length(v_chefes)>500 then
   raise exception 'Listas de seções/participantes inválidas';
 end if;
 if v_chefe is null then raise exception 'Selecione um chefe responsável';end if;
 select nome_completo into v_nome from public.chefes where id=v_chefe and ativo;
 if v_nome is null then raise exception 'O chefe responsável deve estar ativo';end if;
 if char_length(coalesce(p_dados->>'tipo_paxtu',''))>120
    or char_length(coalesce(p_dados->>'descricao_breve',''))>1500 then
   raise exception 'Tipo ou descrição excede o limite';
 end if;
 if (p_dados->>'transporte') is not null and p_dados->>'transporte'
   not in('A pé','Avião','Barco','Bicicleta','Carro','Metrô','Ônibus','Outros','Trem','') then
   raise exception 'Meio de transporte inválido';
 end if;
 if (p_dados->>'tipo')='acampamento' or (p_dados->>'tipo')='acantonamento' then
   if coalesce((p_dados->>'noites_acampadas')::boolean,false)=false then
     raise exception 'Atividades com pernoite devem ser marcadas como noites acampadas';
   end if;
 end if;
 if not exists(select 1 from jsonb_array_elements_text(v_secoes) x where x::bigint=v_secao) then
   raise exception 'A seção de referência deve estar entre as participantes';
 end if;
 for v_sid in select distinct x::bigint from jsonb_array_elements_text(v_secoes) x loop
   if not exists(select 1 from public.secoes s where s.id=v_sid and s.ativo) then
     raise exception 'Seção participante inativa ou inválida';
   end if;
 end loop;
 for v_jid in select distinct x::bigint from jsonb_array_elements_text(v_jovens) x loop
   if not exists (select 1 from public.jovens j where j.id=v_jid and j.ativo
       and j.secao_id in (select x::bigint from jsonb_array_elements_text(v_secoes) x)) then
      raise exception 'Jovem selecionado não pertence às seções participantes ou está inativo';
   end if;
 end loop;
 for v_cid in select distinct x::bigint from jsonb_array_elements_text(v_chefes) x loop
   if not exists(select 1 from public.chefes c where c.id=v_cid and c.ativo) then
     raise exception 'Escotista selecionado não está ativo';
   end if;
 end loop;
 v_result:=public.salvar_programacao_externa_v107(
   jsonb_set(p_dados,'{responsavel_nome}',to_jsonb(v_nome),true));
 v_id:=(v_result->>'id')::bigint;
 -- Cadastro e relacionamentos são modificados na mesma transação.
 update public.programacoes_externas
 set tipo_paxtu=nullif(btrim(p_dados->>'tipo_paxtu'),''),
     responsavel_chefe_id=v_chefe,
     local_saida=nullif(btrim(p_dados->>'local_saida'),''),
     local_chegada=nullif(btrim(p_dados->>'local_chegada'),''),
     descricao_breve=nullif(btrim(p_dados->>'descricao_breve'),''),
     transporte_detalhes=nullif(btrim(p_dados->>'transporte_detalhes'),''),
     online=coalesce((p_dados->>'online')::boolean,false),
     noites_acampadas=coalesce((p_dados->>'noites_acampadas')::boolean,false),
     indaba=coalesce((p_dados->>'indaba')::boolean,false),
     incluir_diretoria=coalesce((p_dados->>'incluir_diretoria')::boolean,false),
     atualizado_em=clock_timestamp()
 where id=v_id returning atualizado_em into v_atualizado;
 delete from public.programacao_externa_secoes_v111 where programacao_id=v_id;
 delete from public.programacao_externa_jovens_v111 where programacao_id=v_id;
 delete from public.programacao_externa_chefes_v111 where programacao_id=v_id;
 insert into public.programacao_externa_secoes_v111(programacao_id,secao_id)
 select v_id,x::bigint from (select distinct x from jsonb_array_elements_text(v_secoes) x) z;
 insert into public.programacao_externa_jovens_v111(programacao_id,jovem_id)
 select v_id,x::bigint from (select distinct x from jsonb_array_elements_text(v_jovens) x) z;
 insert into public.programacao_externa_chefes_v111(programacao_id,chefe_id)
 select v_id,x::bigint from (select distinct x from jsonb_array_elements_text(v_chefes) x) z;
 return jsonb_build_object('id',v_id,'atualizado_em',v_atualizado,'status',v_result->>'status');
end $fn$;
revoke all on function public.salvar_programacao_externa_v111(jsonb) from public,anon,authenticated;
grant execute on function public.salvar_programacao_externa_v111(jsonb) to authenticated;
-- Restrict legacy write RPC: all edits must use the reviewed v111 path,
-- but v111 may still call the legacy function internally. We cannot revoke
-- EXECUTE from authenticated alone without using a separate helper signature,
-- so harden status/publication and read filters independently.
create or replace function private.plano_seguranca_externa_multi_v111(p_id bigint)
returns boolean language sql stable security definer set search_path=''
as $fn$
 select exists(select 1 from public.programacoes_externas e
 join public.safety_approval_test_v67 a on a.visit_id=e.plano_seguranca_visit_id and a.status='aprovado'
 where e.id=p_id and (a.document_payload->'plan'->>'date')=
   ((e.data_inicio at time zone 'America/Sao_Paulo')::date)::text
   and not exists(
     select 1 from public.programacao_externa_secoes_v111 es
     join public.secoes s on s.id=es.secao_id
     where es.programacao_id=e.id and not
       (coalesce(a.document_payload->'plan'->'sections','[]'::jsonb) ? s.nome)
   )
   and exists(select 1 from public.programacao_externa_secoes_v111 es where es.programacao_id=e.id));
$fn$;

create or replace function private.jovem_inscrito_programacao_externa_v111(
 p_atividade_id bigint,p_jovem_id bigint
) returns boolean language sql stable security definer set search_path=''
as $fn$
 select exists(
  select 1 from public.programacoes_externas e
  where e.atividade_id=p_atividade_id and e.status='publicada'
   and (not exists(select 1 from public.programacao_externa_jovens_v111 ej0
           where ej0.programacao_id=e.id)
     or exists(select 1 from public.programacao_externa_jovens_v111 ej
           where ej.programacao_id=e.id and ej.jovem_id=p_jovem_id))
 );
$fn$;


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
revoke all on function public.mudar_status_programacao_externa_v107(bigint,text,text) from public,anon,authenticated;
grant execute on function public.mudar_status_programacao_externa_v107(bigint,text,text) to authenticated;
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
 if exists(
   select 1 from public.programacao_externa_secoes_v111 x
   join public.secoes s on s.id=x.secao_id
   join public.safety_approval_test_v67 a on a.visit_id=p_visit_id
   where x.programacao_id=p_programacao_id
     and not (coalesce(a.document_payload->'plan'->'sections','[]'::jsonb) ? s.nome)
 ) then raise exception 'O Plano de Segurança não contempla todas as seções participantes';end if;
 update public.programacoes_externas
 set plano_seguranca_visit_id=p_visit_id,
     plano_seguranca_vinculado_por=auth.uid(),
     plano_seguranca_vinculado_em=clock_timestamp(),
     atualizado_em=clock_timestamp()
 where id=p_programacao_id;
 return jsonb_build_object('ok',true,'plano_seguranca_visit_id',p_visit_id);
end $fn$;
revoke all on function public.vincular_plano_seguranca_externa_v108(bigint,text) from public,anon,authenticated;
grant execute on function public.vincular_plano_seguranca_externa_v108(bigint,text) to authenticated;

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
     where ar.atividade_id=a.id and ar.ramo_id=j.ramo_id))
   and (not exists(select 1 from public.programacao_externa_jovens_v111 ep0 where ep0.programacao_id=e.id)
        or exists(select 1 from public.programacao_externa_jovens_v111 ep
           where ep.programacao_id=e.id and ep.jovem_id=j.id));
 return coalesce(result,'[]'::jsonb);
end $fn$;
revoke all on function public.listar_autorizacoes_familia_v109() from public,anon,authenticated;
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
     where ar.atividade_id=a.id and ar.ramo_id=j.ramo_id))
   and (not exists(select 1 from public.programacao_externa_jovens_v111 ep0 where ep0.programacao_id=e.id)
        or exists(select 1 from public.programacao_externa_jovens_v111 ep
           where ep.programacao_id=e.id and ep.jovem_id=j.id));
 return coalesce(result,'[]'::jsonb);
end $fn$;
revoke all on function public.listar_autorizacoes_chefia_v109(bigint) from public,anon,authenticated;
grant execute on function public.listar_autorizacoes_chefia_v109(bigint) to authenticated;

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
 if not private.jovem_inscrito_programacao_externa_v111(p_atividade_id,p_jovem_id) then
   raise exception 'Jovem não consta da lista final da atividade externa';
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
revoke all on function public.assinar_autorizacao_eletronica_v109(bigint,bigint,text,text,boolean) from public,anon,authenticated;
grant execute on function public.assinar_autorizacao_eletronica_v109(bigint,bigint,text,text,boolean) to authenticated;

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
 if not private.jovem_inscrito_programacao_externa_v111(p_atividade_id,p_jovem_id) then
   raise exception 'Jovem não consta da lista final da atividade externa';
 end if;
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
 if exists(select 1 from public.autorizacoes_atividade aut
  where aut.atividade_id=p_atividade_id and aut.jovem_id=p_jovem_id
    and aut.meio_assinatura='eletronica') then
   raise exception 'A resposta eletrônica do responsável já foi registrada; o papel não pode substituí-la pela chefia';
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
revoke all on function public.receber_autorizacao_papel_v109(bigint,bigint,bigint) from public,anon,authenticated;
grant execute on function public.receber_autorizacao_papel_v109(bigint,bigint,bigint) to authenticated;
