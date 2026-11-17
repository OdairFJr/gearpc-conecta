create or replace function public.salvar_email_proprio_pioneiro(p_jovem_id bigint, p_email text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_jovem public.jovens%rowtype;
  v_responsavel_id bigint;
  v_email text := nullif(lower(btrim(p_email)), '');
begin
  if not exists (select 1 from public.perfis_usuarios
    where user_id = auth.uid() and ativo and tipo = 'administrador') then
    raise exception 'Acesso reservado à administração.' using errcode = '42501';
  end if;
  select * into v_jovem from public.jovens where id = p_jovem_id for update;
  if not found or v_jovem.ramo_id is distinct from 5 or v_jovem.data_nascimento is null
     or v_jovem.data_nascimento + interval '18 years' > (now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'Campo disponível somente para pioneiros com 18 anos completos.';
  end if;
  if v_email is null or length(v_email) > 254
     or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    raise exception 'Informe um e-mail válido.';
  end if;

  select responsavel_id into v_responsavel_id from public.jovem_responsaveis
    where jovem_id = p_jovem_id and parentesco = 'proprio_pioneiro';
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_email, 0));
  if exists (select 1 from public.responsaveis
    where lower(btrim(email)) = v_email and id is distinct from v_responsavel_id) then
    raise exception 'Este e-mail já está cadastrado para outro responsável.';
  end if;

  if v_responsavel_id is null then
    insert into public.responsaveis (nome_completo, email, eh_teste)
      values (v_jovem.nome_completo, v_email, v_jovem.eh_teste) returning id into v_responsavel_id;
    insert into public.jovem_responsaveis (jovem_id, responsavel_id, parentesco, responsavel_principal)
      values (p_jovem_id, v_responsavel_id, 'proprio_pioneiro', false);
  else
    update public.responsaveis set nome_completo = v_jovem.nome_completo, email = v_email
      where id = v_responsavel_id;
  end if;
end;
$$;

revoke all on function public.salvar_email_proprio_pioneiro(bigint,text) from public, anon;
grant execute on function public.salvar_email_proprio_pioneiro(bigint,text) to authenticated;
