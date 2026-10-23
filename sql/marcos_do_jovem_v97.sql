-- GEArPC Conecta / Marcos do Jovem v97
-- Todas as datas de acontecimentos são editáveis pelo administrador e pelos chefes
-- efetivamente vinculados à seção. Os dois prazos de planejamento são exclusivos
-- do administrador, inclusive na API. Não permite acesso anônimo.
create or replace function public.salvar_marcos_jovem(
  p_jovem_id bigint,
  p_data_acolhida date,
  p_data_promessa date,
  p_data_inicio_caminho date,
  p_data_passagem_ramo date,
  p_data_pode_iniciar_caminho date default null,
  p_data_limite_passagem_ramo date default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $body$
declare
  v_secao_id bigint;
  v_ramo_id bigint;
  v_admin boolean;
  v_chefia_da_secao boolean;
begin
  if auth.uid() is null then
    raise exception 'Faça login antes de registrar marcos do jovem'
      using errcode='42501';
  end if;

  select j.secao_id,j.ramo_id
  into v_secao_id,v_ramo_id
  from public.jovens j
  where j.id=p_jovem_id
  for update;

  if not found or v_secao_id is null then
    raise exception 'Jovem inexistente ou sem seção'
      using errcode='42501';
  end if;

  v_admin:=private.sou_admin();
  select exists (
    select 1
    from public.perfis_usuarios p
    join public.chefe_secoes cs on cs.chefe_id=p.chefe_id
    where p.user_id=auth.uid()
      and p.ativo=true
      and p.tipo='chefia'
      and cs.secao_id=v_secao_id
  ) into v_chefia_da_secao;

  if not (v_admin or v_chefia_da_secao) then
    raise exception 'Sem permissão para registrar marcos deste jovem'
      using errcode='42501';
  end if;

  if not v_admin and
    (p_data_pode_iniciar_caminho is not null or p_data_limite_passagem_ramo is not null)
  then
    raise exception 'Somente a administração pode definir datas de alerta'
      using errcode='42501';
  end if;

  if v_ramo_id not in (2,3,4,5) and p_data_promessa is not null then
    raise exception 'Ramo sem campo de promessa correspondente';
  end if;

  update public.jovens j
  set
    data_acolhida=p_data_acolhida,
    data_promessa_lobinho=case when v_ramo_id=2
      then p_data_promessa else j.data_promessa_lobinho end,
    data_promessa_escoteira=case when v_ramo_id in (3,4,5)
      then p_data_promessa else j.data_promessa_escoteira end,
    data_inicio_caminho=p_data_inicio_caminho,
    data_passagem_ramo=p_data_passagem_ramo,
    data_pode_iniciar_caminho=case when v_admin
      then p_data_pode_iniciar_caminho else j.data_pode_iniciar_caminho end,
    data_limite_passagem_ramo=case when v_admin
      then p_data_limite_passagem_ramo else j.data_limite_passagem_ramo end
  where j.id=p_jovem_id;
end;
$body$;

revoke all on function public.salvar_marcos_jovem(bigint,date,date,date,date,date,date)
  from public,anon,authenticated;
grant execute on function public.salvar_marcos_jovem(bigint,date,date,date,date,date,date)
  to authenticated;

-- Protege chamadas antigas ao RPC de passagem. Elas podem registrar somente
-- marcos reais; uma tentativa de alterar os prazos pelo perfil de chefia é negada.
create or replace function public.salvar_caminho_passagem(
  p_jovem_id bigint,
  p_data_pode_iniciar_caminho date,
  p_data_inicio_caminho date,
  p_data_passagem_ramo date,
  p_data_limite_passagem_ramo date
)
returns void
language plpgsql
security definer
set search_path = ''
as $body$
declare
  v_jovem public.jovens%rowtype;
  v_admin boolean;
  v_promessa date;
begin
  if auth.uid() is null then
    raise exception 'Autenticação obrigatória'
      using errcode='42501';
  end if;

  select * into v_jovem from public.jovens
    where id=p_jovem_id for update;
  if not found then
    raise exception 'Jovem inexistente';
  end if;

  v_admin:=private.sou_admin();
  if not v_admin and (
    p_data_pode_iniciar_caminho is distinct from v_jovem.data_pode_iniciar_caminho
    or p_data_limite_passagem_ramo is distinct from v_jovem.data_limite_passagem_ramo
  ) then
    raise exception 'Datas de alerta são exclusivas da administração'
      using errcode='42501';
  end if;

  v_promessa:=case when v_jovem.ramo_id=2 then v_jovem.data_promessa_lobinho
    when v_jovem.ramo_id in (3,4,5) then v_jovem.data_promessa_escoteira
    else null end;

  perform public.salvar_marcos_jovem(
    p_jovem_id,v_jovem.data_acolhida,v_promessa,
    p_data_inicio_caminho,p_data_passagem_ramo,
    case when v_admin then p_data_pode_iniciar_caminho else null end,
    case when v_admin then p_data_limite_passagem_ramo else null end
  );
end;
$body$;

revoke all on function public.salvar_caminho_passagem(bigint,date,date,date,date)
  from public,anon,authenticated;
grant execute on function public.salvar_caminho_passagem(bigint,date,date,date,date)
  to authenticated;

-- Corrige o RPC anterior: Ramo Lobinho é 2, não 1, e mantém autenticação.
-- Mantém a semântica antiga (nulos não apagam datas).
create or replace function public.chefe_secao_registrar_marcos_jovem(
  p_jovem_id bigint,
  p_data_acolhida date default null,
  p_data_promessa date default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $body$
declare
  v_jovem public.jovens%rowtype;
  v_promessa date;
begin
  if auth.uid() is null then
    raise exception 'Autenticação obrigatória'
      using errcode='42501';
  end if;

  select * into v_jovem from public.jovens
    where id=p_jovem_id for update;
  if not found then raise exception 'Jovem inexistente'; end if;

  v_promessa:=case
    when v_jovem.ramo_id=2 then v_jovem.data_promessa_lobinho
    when v_jovem.ramo_id in (3,4,5) then v_jovem.data_promessa_escoteira
    else null end;

  perform public.salvar_marcos_jovem(
    p_jovem_id,
    coalesce(p_data_acolhida,v_jovem.data_acolhida),
    coalesce(p_data_promessa,v_promessa),
    v_jovem.data_inicio_caminho,
    v_jovem.data_passagem_ramo,
    null,null
  );
end;
$body$;

revoke all on function public.chefe_secao_registrar_marcos_jovem(bigint,date,date)
  from public,anon,authenticated;
grant execute on function public.chefe_secao_registrar_marcos_jovem(bigint,date,date)
  to authenticated;
