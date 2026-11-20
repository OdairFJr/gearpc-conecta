-- Mantém a checagem de autoria e vínculo familiar em todas as políticas.
do $migration$
declare r record; v_sql text;
begin
 for r in select * from pg_policies where schemaname='public' and tablename in ('confirmacoes_presenca_responsavel','responsavel_propostas_ficha_medica') and concat(qual,with_check) like '%(p.tipo = ''responsavel''::text)%'
 loop
   v_sql:=format('alter policy %I on %I.%I',r.policyname,r.schemaname,r.tablename);
   if r.qual is not null then v_sql:=v_sql||' using ('||replace(r.qual,'(p.tipo = ''responsavel''::text)','(p.tipo in (''responsavel'',''chefia''))')||')'; end if;
   if r.with_check is not null then v_sql:=v_sql||' with check ('||replace(r.with_check,'(p.tipo = ''responsavel''::text)','(p.tipo in (''responsavel'',''chefia''))')||')'; end if;
   execute v_sql;
 end loop;
end $migration$;
-- Vincula apenas um cadastro único com o mesmo e-mail e jovens já relacionados.
update public.perfis_usuarios p set responsavel_id=r.id
from auth.users u,public.responsaveis r
where u.id=p.user_id and p.tipo='chefia' and p.ativo and not p.eh_teste and p.responsavel_id is null
 and not r.eh_teste and lower(btrim(r.email))=lower(u.email)
 and (select count(*) from public.responsaveis x where not x.eh_teste and lower(btrim(x.email))=lower(u.email))=1
 and exists(select 1 from public.jovem_responsaveis jr where jr.responsavel_id=r.id);
