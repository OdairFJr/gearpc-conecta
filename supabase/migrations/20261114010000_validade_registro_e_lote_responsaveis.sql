create or replace function private.registro_permite_acesso(p_usuario uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((
   select case when p.eh_teste then true
     when p.tipo='responsavel' then exists (
       select 1 from public.jovem_responsaveis v join public.jovens j on j.id=v.jovem_id
       where v.responsavel_id=p.responsavel_id and j.ativo and not j.eh_teste
         and j.validade_registro >= (now() at time zone 'America/Sao_Paulo')::date
     )
     when p.chefe_id is not null then exists (
       select 1 from public.chefes c where c.id=p.chefe_id and c.ativo
         and c.validade_registro >= (now() at time zone 'America/Sao_Paulo')::date
     )
     else false end
   from public.perfis_usuarios p where p.user_id=p_usuario and p.ativo
 ), exists (
   select 1 from private.acessos_pioneiros_atividades a join public.jovens j on j.id=a.jovem_id
   where a.user_id=p_usuario and j.ativo and j.ramo_id=5
     and j.validade_registro >= (now() at time zone 'America/Sao_Paulo')::date
   and not exists(select 1 from public.perfis_usuarios p where p.user_id=p_usuario)
 ));
$$;
revoke all on function private.registro_permite_acesso(uuid) from public, anon, authenticated;

create or replace function public.verificar_registro_api()
returns void language plpgsql stable security definer set search_path='' as $$
begin
 if auth.role()='authenticated' and auth.uid() is not null and not private.registro_permite_acesso(auth.uid()) then
   raise exception 'Acesso bloqueado: registro UEB vencido, não informado ou acesso inativo. Procure a administração.' using errcode='42501';
 end if;
end $$;
revoke all on function public.verificar_registro_api() from public;
grant execute on function public.verificar_registro_api() to anon,authenticated,service_role;
alter role authenticator set pgrst.db_pre_request='public.verificar_registro_api';
notify pgrst, 'reload config';

create or replace function public.listar_lote_responsaveis()
returns table(id bigint,nome text,email text,filhos jsonb,situacao text)
language sql stable security definer set search_path='' as $$
 select r.id,r.nome_completo,btrim(r.email),
 coalesce(f.lista,'[]'::jsonb),
 case when p.user_id is not null and not private.registro_permite_acesso(p.user_id) then 'Acesso bloqueado'
      when p.user_id is not null and u.last_sign_in_at is not null then 'Já acessou'
      when p.user_id is not null then 'Convite pendente'
      when btrim(coalesce(r.email,'')) !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then 'E-mail ausente ou inválido'
      when exists(select 1 from public.responsaveis r2 where r2.id<>r.id and lower(btrim(r2.email))=lower(btrim(r.email))) then 'E-mail duplicado'
      when not coalesce(f.vigente,false) then 'Sem filho com registro vigente'
      when exists(select 1 from auth.users a where lower(a.email)=lower(btrim(r.email))) then 'E-mail já usado em outra conta'
      else 'Pronto para convidar' end
 from public.responsaveis r
 left join lateral (
  select jsonb_agg(jsonb_build_object('nome',j.nome_completo,'validade',j.validade_registro,'ativo',j.ativo) order by j.nome_completo) lista,
         bool_or(j.ativo and j.validade_registro >= (now() at time zone 'America/Sao_Paulo')::date and nullif(btrim(j.registro_paxtu),'') is not null) vigente
  from public.jovem_responsaveis v join public.jovens j on j.id=v.jovem_id where v.responsavel_id=r.id and not j.eh_teste
 ) f on true
 left join public.perfis_usuarios p on p.responsavel_id=r.id and p.tipo='responsavel' and not p.eh_teste
 left join auth.users u on u.id=p.user_id
 where private.sou_admin() and private.registro_permite_acesso(auth.uid()) and not r.eh_teste
 order by r.nome_completo;
$$;
revoke all on function public.listar_lote_responsaveis() from public,anon;
grant execute on function public.listar_lote_responsaveis() to authenticated;
