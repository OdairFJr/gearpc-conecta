-- GEArPC Conecta v102 | Orientações do DME nas programações semanais.
-- Independentes da decisão de aprovação, guardadas em ordem cronológica.
create table if not exists public.programacao_orientacoes_dme (
  id bigint generated always as identity primary key,
  secao_id bigint not null references public.secoes(id),
  data_atividade date not null,
  mensagem text not null check (length(trim(mensagem)) between 1 and 2000),
  autor_id uuid not null default auth.uid() references auth.users(id),
  criado_em timestamptz not null default now()
);

create index if not exists programacao_orientacoes_dme_busca
  on public.programacao_orientacoes_dme(secao_id,data_atividade,criado_em desc);

alter table public.programacao_orientacoes_dme enable row level security;

revoke all on table public.programacao_orientacoes_dme from public,anon,authenticated;
revoke all on sequence public.programacao_orientacoes_dme_id_seq from public,anon,authenticated;
grant select,insert on table public.programacao_orientacoes_dme to authenticated;
grant usage on sequence public.programacao_orientacoes_dme_id_seq to authenticated;

drop policy if exists "programacao_orientacoes_dme_ver" on public.programacao_orientacoes_dme;
create policy "programacao_orientacoes_dme_ver"
on public.programacao_orientacoes_dme for select to authenticated
using (private.sou_admin() or private.sou_dirigente()
       or private.sou_chefia_secao(secao_id));

drop policy if exists "programacao_orientacoes_dme_inserir_dme" on public.programacao_orientacoes_dme;
create policy "programacao_orientacoes_dme_inserir_dme"
on public.programacao_orientacoes_dme for insert to authenticated
with check (private.sou_admin() and autor_id=(select auth.uid())
  and exists (
    select 1 from public.programacoes p
    where p.secao_id=programacao_orientacoes_dme.secao_id
      and p.data_atividade=programacao_orientacoes_dme.data_atividade
  ));

-- Preserva comentários experimentais anteriores de aprovações (se houver).
insert into public.programacao_orientacoes_dme
  (secao_id,data_atividade,mensagem,autor_id,criado_em)
select r.secao_id,r.data_atividade,trim(r.observacao_teste),r.revisado_por,
  coalesce(r.revisado_em,now())
from public.programacao_revisoes r
where r.observacao_teste is not null
  and length(trim(r.observacao_teste)) between 1 and 2000
  and r.revisado_por is not null
  and exists (select 1 from public.programacoes p
    where p.secao_id=r.secao_id and p.data_atividade=r.data_atividade)
  and not exists (select 1 from public.programacao_orientacoes_dme d
    where d.secao_id=r.secao_id and d.data_atividade=r.data_atividade
      and d.mensagem=trim(r.observacao_teste));

comment on table public.programacao_orientacoes_dme is
  'Orientações assinadas do DME, independentes do status de aprovação da programação.';
