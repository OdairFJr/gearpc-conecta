-- GEArPC v114: decisão formal do DME para programações externas.
alter table public.programacoes_externas
 drop constraint if exists programacoes_externas_status_check;
alter table public.programacoes_externas
 add constraint programacoes_externas_status_check check(
  status in ('rascunho','em_analise','ajustes','aprovada','publicada','reprovada')
 );

create table if not exists public.programacao_externa_pareceres_v114 (
 id bigint generated always as identity primary key,
 programacao_id bigint not null references public.programacoes_externas(id) on delete cascade,
 acao text not null check(acao in('enviar','aprovar','ajustar','comentar','reprovar','publicar')),
 parecer text,
 status_anterior text not null,
 status_novo text not null,
 registrado_por uuid not null references auth.users(id),
 registrado_em timestamptz not null default clock_timestamp()
);
create index if not exists idx_pareceres_ext_v114_programacao
  on public.programacao_externa_pareceres_v114(programacao_id,registrado_em);
alter table public.programacao_externa_pareceres_v114 enable row level security;
revoke all on public.programacao_externa_pareceres_v114 from public,anon,authenticated;
grant select on public.programacao_externa_pareceres_v114 to authenticated;
drop policy if exists "v114_pareceres_ler_equipe" on public.programacao_externa_pareceres_v114;
create policy "v114_pareceres_ler_equipe" on public.programacao_externa_pareceres_v114
for select to authenticated using(
 exists(select 1 from public.programacoes_externas e where e.id=programacao_id)
);

create or replace function public.mudar_status_programacao_externa_v107(
 p_id bigint,p_acao text,p_parecer text default null
) returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v public.programacoes_externas%rowtype;
 v_atividade_id bigint;v_ramo_id bigint;
 v_status_anterior text;
begin
 if auth.uid() is null then raise exception 'Faça login novamente' using errcode='42501';end if;
 select * into v from public.programacoes_externas where id=p_id for update;
 if not found then raise exception 'Programação não encontrada';end if;
 v_status_anterior:=v.status;
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
 elsif p_acao in('aprovar','ajustar','reprovar','comentar') then
   if not private.sou_admin() then
     raise exception 'Parecer reservado à administração/DME' using errcode='42501';
   end if;
   if p_acao in('aprovar','reprovar') and v.status<>'em_analise' then
     raise exception 'Só é possível aprovar ou reprovar uma atividade aguardando DME';
   end if;
   if p_acao in('ajustar','comentar') and v.status not in ('em_analise','aprovada') then
     raise exception 'A atividade não está disponível para orientações do DME';
   end if;
   if p_acao in('ajustar','reprovar','comentar') and
     (nullif(btrim(coalesce(p_parecer,'')),'') is null or char_length(btrim(p_parecer))<3) then
     raise exception 'Informe um parecer do DME com pelo menos 3 caracteres';
   end if;
   if p_parecer is not null and char_length(p_parecer)>4000 then
     raise exception 'O parecer pode conter no máximo 4000 caracteres';
   end if;
   update public.programacoes_externas set
     status=case p_acao when 'aprovar' then 'aprovada'
            when 'ajustar' then 'ajustes'
            when 'reprovar' then 'reprovada'
            else status end,
     parecer_dme=coalesce(nullif(btrim(p_parecer),''),parecer_dme),
     revisado_por=auth.uid(),revisado_em=clock_timestamp(),
     atualizado_em=clock_timestamp()
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
 if p_acao in ('enviar','aprovar','ajustar','reprovar','comentar','publicar') then
   insert into public.programacao_externa_pareceres_v114
      (programacao_id,acao,parecer,status_anterior,status_novo,registrado_por)
   select id,p_acao,
      case when p_acao in('aprovar','ajustar','reprovar','comentar')
           then nullif(btrim(p_parecer),'') else null end,
      v_status_anterior,status,auth.uid()
   from public.programacoes_externas where id=p_id;
 end if;
 return (select jsonb_build_object('id',id,'status',status,
    'parecer_dme',parecer_dme,'atividade_id',atividade_id)
   from public.programacoes_externas where id=p_id);
end $fn$;
revoke all on function public.mudar_status_programacao_externa_v107(bigint,text,text) from public,anon,authenticated;
grant execute on function public.mudar_status_programacao_externa_v107(bigint,text,text) to authenticated;
