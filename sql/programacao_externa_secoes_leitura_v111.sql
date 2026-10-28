-- Consulta de programação multi-seção pela chefia participante.
create or replace function private.sou_chefia_participante_externa_v111(p_programacao bigint)
returns boolean language sql stable security definer set search_path=''
as $fn$
 select exists(
   select 1 from public.programacao_externa_secoes_v111 s
   where s.programacao_id=p_programacao and private.sou_chefia_secao(s.secao_id)
 );
$fn$;
drop policy if exists "programacao_externa_ver_equipe" on public.programacoes_externas;
create policy "programacao_externa_ver_equipe"
 on public.programacoes_externas for select to authenticated
 using (
   private.sou_admin() or private.sou_dirigente() or
   (not atividade_geral and (private.sou_chefia_secao(secao_id)
      or private.sou_chefia_participante_externa_v111(id)))
 );
