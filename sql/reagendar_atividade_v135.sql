-- Reagendamento atômico: preserva identidade, roteiro, participantes e assinaturas históricas.
create or replace function public.reagendar_atividade_v135(
 p_id bigint, p_visit_id text, p_inicio timestamptz, p_fim timestamptz,
 p_atualizado_em timestamptz, p_motivo text
) returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare
 e public.programacoes_externas%rowtype;
 a public.safety_approval_test_v67%rowtype;
 v_visit text; v_delta interval; v_patch jsonb; v_payload jsonb;
 v_start timestamp := p_inicio at time zone 'America/Sao_Paulo';
 v_end timestamp := p_fim at time zone 'America/Sao_Paulo';
begin
 if auth.uid() is null then raise exception 'Faça login novamente' using errcode='42501'; end if;
 if p_inicio is null or p_fim is null or p_fim<=p_inicio then raise exception 'O término deve ser posterior ao início'; end if;
 if char_length(btrim(coalesce(p_motivo,''))) not between 3 and 1000 then raise exception 'Informe o motivo (3 a 1000 caracteres)'; end if;
 -- Bloqueia primeiro a programação, inclusive quando a entrada é pelo plano.
 if p_id is null and p_visit_id is not null then
   select id into p_id from public.programacoes_externas where plano_seguranca_visit_id=p_visit_id;
 end if;
 if p_id is not null then
   select * into e from public.programacoes_externas where id=p_id for update;
   if not found then raise exception 'Programação não encontrada'; end if;
   if not (private.sou_admin() or (not e.atividade_geral and private.sou_chefia_secao(e.secao_id))) then raise exception 'Sem permissão nesta seção' using errcode='42501'; end if;
   if e.status='reprovada' then raise exception 'Atividade reprovada não pode ser reagendada'; end if;
   if p_visit_id is null and e.atualizado_em is distinct from p_atualizado_em then raise exception 'A programação mudou. Reabra antes de reagendar'; end if;
   v_visit:=e.plano_seguranca_visit_id;
   if p_visit_id is not null and p_visit_id is distinct from v_visit then raise exception 'Vínculo de segurança alterado. Atualize a tela'; end if;
 end if;
 if v_visit is null then v_visit:=p_visit_id; end if;
 if v_visit is not null then
   if (select count(*) from public.programacoes_externas where plano_seguranca_visit_id=v_visit)>1 then raise exception 'Este plano atende várias programações. Separe os vínculos antes de reagendar'; end if;
   select * into a from public.safety_approval_test_v67 where visit_id=v_visit for update;
   if not found then raise exception 'Plano de segurança não encontrado'; end if;
   if p_id is null and not (private.sou_admin() or a.submitted_by=auth.uid()) then raise exception 'Sem permissão neste plano' using errcode='42501'; end if;
   if p_visit_id is not null and a.updated_at is distinct from p_atualizado_em then raise exception 'O plano mudou. Atualize antes de reagendar'; end if;

 end if;
 if p_id is null and v_visit is null then raise exception 'Selecione uma atividade ou plano'; end if;
 if e.id is not null then
   if p_inicio=e.data_inicio and p_fim=e.data_fim then raise exception 'As datas e horários não foram alterados'; end if;
   v_delta:=p_inicio-e.data_inicio;
   if exists(select 1 from public.programacoes_externas_etapas where programacao_id=e.id and (inicio+v_delta<p_inicio or fim+v_delta>p_fim)) then raise exception 'O novo período não comporta as etapas do roteiro. Mantenha a duração ou ajuste as etapas primeiro'; end if;
   update public.programacoes_externas_etapas set inicio=inicio+v_delta,fim=fim+v_delta where programacao_id=e.id;
   update public.programacoes_externas set data_inicio=p_inicio,data_fim=p_fim,
     status=case when status in ('aprovada','publicada','em_analise') then 'ajustes' else status end,
     revisado_por=null,revisado_em=null,atualizado_em=clock_timestamp() where id=e.id;
   -- O gatilho existente incrementa a versão: assinaturas antigas não valem nas novas datas.
   if e.atividade_id is not null then
     update public.atividades set data_inicio=p_inicio,data_fim=p_fim where id=e.atividade_id;
   end if;
   insert into public.programacao_externa_pareceres_v114(programacao_id,acao,parecer,status_anterior,status_novo,registrado_por)
   select id,'comentar','Reagendamento de '||e.data_inicio||' / '||e.data_fim||' para '||p_inicio||' / '||p_fim||'. Motivo: '||btrim(p_motivo),e.status,status,auth.uid() from public.programacoes_externas where id=e.id;
 end if;
 if a.visit_id is not null then
   v_patch:=jsonb_build_object('activityStartDate',v_start::date::text,'activityStartTime',to_char(v_start,'HH24:MI'),'activityEndDate',v_end::date::text,'activityEndTime',to_char(v_end,'HH24:MI'),'updatedAt',clock_timestamp());
   v_payload:=a.document_payload || jsonb_build_object(
     'visit',coalesce(a.document_payload->'visit','{}')||v_patch||jsonb_build_object('activityDate',v_start::date::text),
     'plan',coalesce(a.document_payload->'plan','{}')||v_patch||jsonb_build_object('date',v_start::date::text),
     'reschedulingHistory',coalesce(a.document_payload->'reschedulingHistory','[]')||jsonb_build_array(jsonb_build_object('previousStart',a.document_payload->'visit'->>'activityStartDate','previousEnd',a.document_payload->'visit'->>'activityEndDate','previousStatus',a.status,'previousReview',a.dme_comment,'previousReviewedAt',a.reviewed_at,'reason',btrim(p_motivo),'changedBy',auth.uid(),'changedAt',clock_timestamp())));
   update public.safety_approval_test_v67 set document_payload=v_payload,status='ajustes_solicitados',reviewed_by=null,reviewed_at=null,dme_comment='Reagendamento: '||btrim(p_motivo),updated_at=clock_timestamp(),submitted_at=clock_timestamp() where visit_id=a.visit_id;
 end if;
 return jsonb_build_object('id',e.id,'visit_id',a.visit_id,'payload',v_payload);
end $fn$;
revoke all on function public.reagendar_atividade_v135(bigint,text,timestamptz,timestamptz,timestamptz,text) from public,anon,authenticated;
grant execute on function public.reagendar_atividade_v135(bigint,text,timestamptz,timestamptz,timestamptz,text) to authenticated;
