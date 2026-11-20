do $migration$
declare r record; v_sql text;
begin
 for r in select * from pg_policies where schemaname='public' and tablename in ('confirmacoes_presenca_responsavel','responsavel_propostas_ficha_medica')
 loop
   v_sql:=format('alter policy %I on %I.%I',r.policyname,r.schemaname,r.tablename);
   if r.qual is not null then v_sql:=v_sql||' using ('||replace(r.qual,'ARRAY[''responsavel''::text, ''chefia''::text]','ARRAY[''responsavel''::text, ''chefia''::text, ''administrador''::text]')||')'; end if;
   if r.with_check is not null then v_sql:=v_sql||' with check ('||replace(r.with_check,'ARRAY[''responsavel''::text, ''chefia''::text]','ARRAY[''responsavel''::text, ''chefia''::text, ''administrador''::text]')||')'; end if;
   execute v_sql;
 end loop;
end $migration$;
-- Vínculos confirmados pelo usuário e já existentes em jovem_responsaveis.
update public.perfis_usuarios set responsavel_id=20 where user_id='5a8687b8-25ba-468d-a2af-a61dcc1762f0' and tipo='administrador' and responsavel_id is null;
update public.perfis_usuarios set responsavel_id=19 where user_id='92f6a434-2919-428b-9166-f94d5209ac95' and tipo='administrador' and responsavel_id is null;
