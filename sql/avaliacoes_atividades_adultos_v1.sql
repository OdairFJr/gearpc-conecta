create table public.avaliacoes_atividades_adultos_v1 (
  id uuid primary key,
  atividade_id uuid not null references public.atividades_adultos_pioneiros_v1(id) on delete cascade,
  organizacao smallint not null check (organizacao between 1 and 5),
  conteudo smallint not null check (conteudo between 1 and 5),
  formadores smallint not null check (formadores between 1 and 5),
  aproveitamento smallint not null check (aproveitamento between 1 and 5),
  estrutura smallint not null check (estrutura between 1 and 5),
  positivo text check (length(positivo) <= 2000),
  melhorias text check (length(melhorias) <= 2000)
);

create index avaliacoes_atividades_adultos_atividade_idx
  on public.avaliacoes_atividades_adultos_v1 (atividade_id);

alter table public.avaliacoes_atividades_adultos_v1 enable row level security;

revoke all on public.avaliacoes_atividades_adultos_v1 from public, anon, authenticated;
grant select, insert on public.avaliacoes_atividades_adultos_v1 to authenticated;

create policy equipe_consulta_avaliacoes_adultos
  on public.avaliacoes_atividades_adultos_v1 for select to authenticated
  using (exists (
    select 1 from public.perfis_usuarios p
    where p.user_id = (select auth.uid())
      and p.ativo and p.tipo in ('administrador', 'chefia')
  ));

create policy equipe_insere_avaliacoes_adultos
  on public.avaliacoes_atividades_adultos_v1 for insert to authenticated
  with check (
    exists (
      select 1 from public.perfis_usuarios p
      where p.user_id = (select auth.uid())
        and p.ativo and p.tipo in ('administrador', 'chefia')
    )
    and exists (
      select 1 from public.atividades_adultos_pioneiros_v1 a
      where a.id = atividade_id
        and ((a.data + a.fim) at time zone 'America/Sao_Paulo') <= now()
    )
  );
