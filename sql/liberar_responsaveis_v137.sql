-- Libera as funcionalidades familiares sem mudar os vínculos ou as permissões administrativas.
do $migration$
declare r record; v_sql text;
begin
 for r in select * from pg_policies where schemaname='public' and
   tablename in ('confirmacoes_presenca_responsavel','responsavel_propostas_ficha_medica')
   and concat(qual,with_check) like '%(p.eh_teste OR p.ensaio_responsavel)%'
 loop
   v_sql:=format('alter policy %I on %I.%I',r.policyname,r.schemaname,r.tablename);
   if r.qual is not null then v_sql:=v_sql||' using ('||replace(r.qual,'(p.eh_teste OR p.ensaio_responsavel)','true')||')'; end if;
   if r.with_check is not null then v_sql:=v_sql||' with check ('||replace(r.with_check,'(p.eh_teste OR p.ensaio_responsavel)','true')||')'; end if;
   execute v_sql;
 end loop;
end $migration$;
