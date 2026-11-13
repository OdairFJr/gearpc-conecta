create table private.acessos_pioneiros_atividades (
  user_id uuid primary key references auth.users(id) on delete cascade,
  jovem_id bigint unique not null references public.jovens(id) on delete cascade
);

alter table private.acessos_pioneiros_atividades enable row level security;
revoke all on private.acessos_pioneiros_atividades from public, anon, authenticated;

create function private.pode_consultar_como_pioneiro()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from private.acessos_pioneiros_atividades acesso
    join public.jovens jovem on jovem.id = acesso.jovem_id
    where acesso.user_id = (select auth.uid())
      and jovem.ativo and jovem.ramo_id = 5
  )
$$;
revoke all on function private.pode_consultar_como_pioneiro() from public, anon, authenticated;
grant execute on function private.pode_consultar_como_pioneiro() to authenticated;

create function public.pode_consultar_como_pioneiro()
returns boolean
language sql stable security invoker set search_path = ''
as $$ select private.pode_consultar_como_pioneiro() $$;
revoke all on function public.pode_consultar_como_pioneiro() from public, anon, authenticated;
grant execute on function public.pode_consultar_como_pioneiro() to authenticated;

create view public.atividades_consulta_pioneiros_v1
with (security_barrier = true)
as
select id, nome, tipo, data, inicio, fim, local, responsavel, maps_url, etapas
from public.atividades_adultos_pioneiros_v1
where (select private.pode_consultar_como_pioneiro());

revoke all on public.atividades_consulta_pioneiros_v1 from public, anon, authenticated;
grant select on public.atividades_consulta_pioneiros_v1 to authenticated;
