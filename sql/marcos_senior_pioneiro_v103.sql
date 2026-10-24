-- GEArPC Conecta v103 | Marcos próprios dos ramos Sênior e Pioneiro
-- Nenhuma data existente é modificada, nem datas faltantes são inferidas.
alter table public.jovem_historico_ramos
  add column if not exists data_compromisso_senior date,
  add column if not exists data_investidura_pioneira date,
  add column if not exists data_partida_pioneira date;

comment on column public.jovem_historico_ramos.data_compromisso_senior
  is 'Data do Compromisso Sênior, independente da promessa ou renovação';
comment on column public.jovem_historico_ramos.data_investidura_pioneira
  is 'Data da Investidura Pioneira, independente da promessa';
comment on column public.jovem_historico_ramos.data_partida_pioneira
  is 'Data da Partida Pioneira, marco de conclusão do ramo';

-- Segurança centralizada: a função anterior confere autenticação, vínculo da
-- chefia e versão do registro e atualiza somente os campos que já existiam.
-- A nova função grava os três novos acontecimentos na mesma transação.
create or replace function public.salvar_historico_ramo_jovem_v103(
  p_jovem_id bigint,
  p_ramo_id bigint,
  p_data_ingresso date,
  p_data_acolhida date,
  p_data_promessa date,
  p_data_inicio_caminho date,
  p_data_passagem date,
  p_versao_esperada timestamptz,
  p_data_compromisso_senior date,
  p_data_investidura_pioneira date,
  p_data_partida_pioneira date
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $body$
declare
  v_salvo jsonb;
  v_registro public.jovem_historico_ramos%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Autenticação obrigatória' using errcode='42501';
  end if;

  if p_ramo_id <> 4 and p_data_compromisso_senior is not null then
    raise exception 'Compromisso Sênior pertence exclusivamente ao ramo Sênior';
  end if;
  if p_ramo_id <> 5 and
    (p_data_investidura_pioneira is not null or p_data_partida_pioneira is not null) then
    raise exception 'Investidura e Partida pertencem exclusivamente ao ramo Pioneiro';
  end if;
  if p_data_ingresso is not null and p_data_compromisso_senior is not null
    and p_data_compromisso_senior < p_data_ingresso then
    raise exception 'O Compromisso Sênior não pode anteceder o ingresso no ramo';
  end if;
  if p_data_ingresso is not null and p_data_investidura_pioneira is not null
    and p_data_investidura_pioneira < p_data_ingresso then
    raise exception 'A Investidura não pode anteceder o ingresso no ramo Pioneiro';
  end if;
  if p_data_ingresso is not null and p_data_partida_pioneira is not null
    and p_data_partida_pioneira < p_data_ingresso then
    raise exception 'A Partida não pode anteceder o ingresso no ramo Pioneiro';
  end if;
  if p_data_investidura_pioneira is not null and p_data_partida_pioneira is not null
    and p_data_partida_pioneira < p_data_investidura_pioneira then
    raise exception 'A Partida não pode anteceder a Investidura';
  end if;

  -- A função v101 lança exceção em acesso indevido ou versão divergente.
  -- Uma falha reverte também qualquer gravação nesta função.
  v_salvo:=public.salvar_historico_ramo_jovem_v101(
    p_jovem_id,p_ramo_id,p_data_ingresso,p_data_acolhida,p_data_promessa,
    p_data_inicio_caminho,p_data_passagem,p_versao_esperada
  );

  update public.jovem_historico_ramos h
  set data_compromisso_senior = case when p_ramo_id=4
      then p_data_compromisso_senior else h.data_compromisso_senior end,
      data_investidura_pioneira = case when p_ramo_id=5
      then p_data_investidura_pioneira else h.data_investidura_pioneira end,
      data_partida_pioneira = case when p_ramo_id=5
      then p_data_partida_pioneira else h.data_partida_pioneira end
  where h.jovem_id=p_jovem_id and h.ramo_id=p_ramo_id
  returning * into v_registro;

  if not found then raise exception 'Histórico do ramo não encontrado'; end if;
  return to_jsonb(v_registro);
end
$body$;

revoke all on function public.salvar_historico_ramo_jovem_v103(
  bigint,bigint,date,date,date,date,date,timestamptz,date,date,date
) from public,anon,authenticated;
grant execute on function public.salvar_historico_ramo_jovem_v103(
  bigint,bigint,date,date,date,date,date,timestamptz,date,date,date
) to authenticated;
