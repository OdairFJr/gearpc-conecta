-- O Storage API remove os objetos e o arquivo físico. SQL só verifica se a pasta esvaziou.
create function private.pode_limpar_roteiro_externo_v124(p_path text)
returns boolean language sql stable security definer set search_path=''
as $fn$
  select auth.uid() is not null and private.sou_admin() and exists (
    select 1 from public.programacoes_externas e
    where e.id::text=split_part(p_path,'/',1)
  );
$fn$;
revoke all on function private.pode_limpar_roteiro_externo_v124(text) from public, anon;
grant execute on function private.pode_limpar_roteiro_externo_v124(text) to authenticated;

create policy roteiro_admin_limpeza_leitura_v124 on storage.objects
  for select to authenticated using (
    bucket_id='gearpc-roteiros-externos' and private.pode_limpar_roteiro_externo_v124(name)
  );
create policy roteiro_admin_limpeza_exclusao_v124 on storage.objects
  for delete to authenticated using (
    bucket_id='gearpc-roteiros-externos' and private.pode_limpar_roteiro_externo_v124(name)
  );

create function public.excluir_programacao_externa_v124(p_id bigint, p_atualizado_em timestamptz, p_confirmar boolean default true)
returns text[] language plpgsql security definer set search_path=''
as $fn$
declare
  v public.programacoes_externas%rowtype;
  v_arquivos text[];
begin
  if auth.uid() is null or not private.sou_admin() then
    raise exception 'Exclusão reservada à administração' using errcode='42501';
  end if;
  select * into v from public.programacoes_externas where id=p_id for update;
  if not found then return array[]::text[]; end if;
  if v.atualizado_em is distinct from p_atualizado_em then
    raise exception 'A programação foi atualizada. Reabra antes de excluir.';
  end if;
  select coalesce(array_agg(name order by name),array[]::text[]) into v_arquivos
  from storage.objects where bucket_id='gearpc-roteiros-externos' and name like p_id::text||'/%';
  if p_confirmar is distinct from true then return v_arquivos; end if;
  if cardinality(v_arquivos)>0 then
    raise exception 'Ainda há arquivos no roteiro. Tente a exclusão novamente.';
  end if;
  if v.atividade_id is not null and exists (
    select 1 from public.programacoes_externas
    where atividade_id=v.atividade_id and id<>p_id
  ) then
    raise exception 'Esta publicação está vinculada a outra programação.';
  end if;
  delete from public.programacoes_externas where id=p_id;
  if v.atividade_id is not null then
    delete from public.atividades where id=v.atividade_id;
  end if;
  return array[]::text[];
end
$fn$;

revoke all on function public.excluir_programacao_externa_v124(bigint,timestamptz,boolean) from public, anon, authenticated;
grant execute on function public.excluir_programacao_externa_v124(bigint,timestamptz,boolean) to authenticated;
