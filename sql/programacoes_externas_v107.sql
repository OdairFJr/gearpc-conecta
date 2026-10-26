-- GEArPC Conecta v107 - Programação externa e de acampamentos.
-- Rascunhos e pareceres internos nunca ficam visíveis aos responsáveis.
create table if not exists public.programacoes_externas (
 id bigint generated always as identity primary key,
 secao_id bigint not null references public.secoes(id),
 tipo text not null default 'externa'
   check(tipo in('externa','acampamento','acantonamento','jornada','visita','evento','especial')),
 titulo text not null check(char_length(btrim(titulo)) between 3 and 180),
 objetivo text,
 local text not null check(char_length(btrim(local)) between 2 and 250),
 ponto_encontro text,
 data_inicio timestamptz not null,
 data_fim timestamptz not null,
 transporte text,
 alimentacao text,
 materiais text,
 riscos text,
 prevencoes text,
 plano_b text,
 responsavel_nome text,
 custo_estimado numeric(12,2) check(custo_estimado>=0),
 exige_autorizacao boolean not null default true,
 texto_autorizacao text,
 observacoes text,
 status text not null default 'rascunho'
  check(status in('rascunho','em_analise','ajustes','aprovada','publicada')),
 parecer_dme text,
 revisado_por uuid references auth.users(id),
 revisado_em timestamptz,
 atividade_id bigint references public.atividades(id) on delete set null,
 criado_por uuid not null references auth.users(id),
 criado_em timestamptz not null default now(),
 atualizado_em timestamptz not null default now(),
 constraint programacoes_externas_periodo check(data_fim>data_inicio)
);
create index if not exists programacoes_externas_secao_periodo_idx
 on public.programacoes_externas(secao_id,data_inicio desc);
create table if not exists public.programacoes_externas_etapas (
 id bigint generated always as identity primary key,
 programacao_id bigint not null references public.programacoes_externas(id) on delete cascade,
 ordem integer not null check(ordem between 1 and 200),
 inicio timestamptz not null,
 fim timestamptz not null,
 titulo text not null check(char_length(btrim(titulo)) between 2 and 180),
 descricao text,
 condutor text,
 materiais text,
 cuidados text,
 constraint programacoes_externas_etapas_periodo check(fim>inicio)
);
create index if not exists programacoes_externas_etapas_ordem_idx
 on public.programacoes_externas_etapas(programacao_id,ordem);
alter table public.programacoes_externas enable row level security;
alter table public.programacoes_externas_etapas enable row level security;
revoke all on public.programacoes_externas from public,anon,authenticated;
revoke all on public.programacoes_externas_etapas from public,anon,authenticated;
grant select on public.programacoes_externas to authenticated;
grant select on public.programacoes_externas_etapas to authenticated;
drop policy if exists "programacao_externa_ver_equipe" on public.programacoes_externas;
create policy "programacao_externa_ver_equipe"
on public.programacoes_externas for select to authenticated
using(private.sou_admin() or private.sou_dirigente() or private.sou_chefia_secao(secao_id));
drop policy if exists "programacao_externa_etapa_ver_equipe" on public.programacoes_externas_etapas;
create policy "programacao_externa_etapa_ver_equipe"
on public.programacoes_externas_etapas for select to authenticated
using(exists(select 1 from public.programacoes_externas p
 where p.id=programacao_id));
-- Único endpoint para cadastrar/alterar roteiro. Etapas são substituídas
-- atomicamente; a versão evita sobrescrever alterações de outro chefe.
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
 if jsonb_typeof(v_etapas)<>'array' or jsonb_array_length(v_etapas)>100 then
   raise exception 'Informe no máximo 100 etapas';
 end if;
 if v_id is not null then
   select * into v_antiga from public.programacoes_externas where id=v_id for update;
   if not found then raise exception 'Programação não encontrada';end if;
   if not (private.sou_admin() or private.sou_chefia_secao(v_antiga.secao_id)) then
     raise exception 'Sem permissão para alterar a programação' using errcode='42501';
   end if;
   if v_antiga.secao_id is distinct from v_secao then raise exception 'Não é permitido trocar a seção de uma programação já criada';end if;
   if v_antiga.status not in('rascunho','ajustes') then
     raise exception 'Programação em conferência, aprovada ou publicada: não editável';
   end if;
   if v_esperado is distinct from v_antiga.atualizado_em then
     raise exception 'A programação foi alterada por outra pessoa. Atualize antes de salvar' using errcode='40001';
   end if;
   update public.programacoes_externas set
    tipo=p_dados->>'tipo',titulo=btrim(p_dados->>'titulo'),
    objetivo=nullif(btrim(p_dados->>'objetivo'),''),
    local=btrim(p_dados->>'local'),
    ponto_encontro=nullif(btrim(p_dados->>'ponto_encontro'),''),
    data_inicio=v_inicio,data_fim=v_fim,
    transporte=nullif(btrim(p_dados->>'transporte'),''),
    alimentacao=nullif(btrim(p_dados->>'alimentacao'),''),
    materiais=nullif(btrim(p_dados->>'materiais'),''),
    riscos=nullif(btrim(p_dados->>'riscos'),''),
    prevencoes=nullif(btrim(p_dados->>'prevencoes'),''),
    plano_b=nullif(btrim(p_dados->>'plano_b'),''),
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
    (secao_id,tipo,titulo,objetivo,local,ponto_encontro,data_inicio,data_fim,
     transporte,alimentacao,materiais,riscos,prevencoes,plano_b,responsavel_nome,
     custo_estimado,exige_autorizacao,texto_autorizacao,observacoes,criado_por)
   values
    (v_secao,p_dados->>'tipo',btrim(p_dados->>'titulo'),
    nullif(btrim(p_dados->>'objetivo'),''),btrim(p_dados->>'local'),
    nullif(btrim(p_dados->>'ponto_encontro'),''),v_inicio,v_fim,
    nullif(btrim(p_dados->>'transporte'),''),nullif(btrim(p_dados->>'alimentacao'),''),
    nullif(btrim(p_dados->>'materiais'),''),nullif(btrim(p_dados->>'riscos'),''),
    nullif(btrim(p_dados->>'prevencoes'),''),nullif(btrim(p_dados->>'plano_b'),''),
    nullif(btrim(p_dados->>'responsavel_nome'),''),
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
    (programacao_id,ordem,inicio,fim,titulo,descricao,condutor,materiais,cuidados)
   values(v_nova.id,v_pos,v_e_inicio,v_e_fim,btrim(v_etapa->>'titulo'),
    nullif(btrim(v_etapa->>'descricao'),''),
    nullif(btrim(v_etapa->>'condutor'),''),
    nullif(btrim(v_etapa->>'materiais'),''),
    nullif(btrim(v_etapa->>'cuidados'),''));
 end loop;
 return jsonb_build_object('id',v_nova.id,'atualizado_em',v_nova.atualizado_em,'status',v_nova.status);
end $fn$;
revoke all on function public.salvar_programacao_externa_v107(jsonb) from public,anon,authenticated;
grant execute on function public.salvar_programacao_externa_v107(jsonb) to authenticated;

-- Envio para conferência, parecer do DME e publicação são ações separadas.
-- A publicação cria a atividade que já alimenta o calendário/autorização
-- existente para os responsáveis, sem tornar públicos os rascunhos internos.
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
 if p_acao='enviar' then
   if not (private.sou_admin() or private.sou_chefia_secao(v.secao_id)) then
     raise exception 'Sem permissão nesta seção' using errcode='42501';
   end if;
   if v.status not in ('rascunho','ajustes') then raise exception 'Somente rascunhos ou ajustes podem ser enviados';end if;
   if not exists (select 1 from public.programacoes_externas_etapas
      where programacao_id=p_id) then
      raise exception 'Inclua pelo menos uma etapa no roteiro antes de enviar ao DME';
   end if;
   if nullif(btrim(coalesce(v.riscos,'')),'') is null or
      nullif(btrim(coalesce(v.prevencoes,'')),'') is null or
      nullif(btrim(coalesce(v.responsavel_nome,'')),'') is null then
      raise exception 'Complete responsável, riscos e medidas preventivas antes de enviar ao DME';
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
   if nullif(btrim(coalesce(v.riscos,'')),'') is null or
      nullif(btrim(coalesce(v.prevencoes,'')),'') is null then
      raise exception 'Programação sem medidas de segurança registradas';
   end if;
   if v.exige_autorizacao and nullif(btrim(coalesce(v.texto_autorizacao,'')),'') is null then
     raise exception 'Preencha o texto da autorização dos responsáveis';
   end if;
   select ramo_id into v_ramo_id from public.secoes where id=v.secao_id;
   if v_ramo_id is null then raise exception 'Seção sem ramo válido';end if;
   insert into public.atividades
    (titulo,descricao,data_inicio,data_fim,local,atividade_geral,
     exige_autorizacao,texto_autorizacao)
   values (v.titulo,coalesce(v.objetivo,'')||E'\n'||coalesce(v.observacoes,''),
     v.data_inicio,v.data_fim,v.local,false,v.exige_autorizacao,v.texto_autorizacao)
   returning id into v_atividade_id;
   insert into public.atividade_ramos(atividade_id,ramo_id)
   values(v_atividade_id,v_ramo_id);
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
