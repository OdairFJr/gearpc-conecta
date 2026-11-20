-- Fila privada de convites autorizados; não contém credenciais permanentes.
create extension if not exists pg_net with schema extensions;
create table if not exists private.invite_queue_runs_v138(id uuid primary key default gen_random_uuid(),token_hash text not null,authorized_by uuid not null references auth.users(id),created_at timestamptz not null default now(),claimed_at timestamptz,request_id bigint);
create table if not exists private.invite_queue_items_v138(responsavel_id bigint primary key references public.responsaveis(id),email text not null,run_id uuid references private.invite_queue_runs_v138(id),status text not null default 'queued' check(status in ('queued','sending','sent','error','skipped')),attempted_at timestamptz,sent_at timestamptz,last_error text,attempts integer not null default 0);
alter table private.invite_queue_runs_v138 enable row level security;
alter table private.invite_queue_items_v138 enable row level security;
revoke all on private.invite_queue_runs_v138,private.invite_queue_items_v138 from public,anon,authenticated;
alter table private.invite_queue_runs_v138 add column if not exists dry_run boolean not null default false;
create or replace function private.dispatch_invites_v138(p_dry boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare v_token text; v_id uuid; v_request bigint; v_admin uuid; v_count integer;
begin
 perform pg_advisory_xact_lock(1382026);
 if exists(select 1 from private.invite_queue_runs_v138 where created_at>now()-interval '5 minutes' and not dry_run) and not p_dry then return jsonb_build_object('status','in_progress'); end if;
 select count(*) into v_count from private.invite_queue_items_v138 where status='queued';
 if v_count=0 then return jsonb_build_object('status','finished','queued',0); end if;
 if not p_dry and (select count(*) from private.invite_queue_items_v138 where attempted_at>clock_timestamp()-interval '1 hour')>=2 then return jsonb_build_object('status','hourly_limit'); end if;
 select user_id into v_admin from public.perfis_usuarios where tipo='administrador' and ativo and private.registro_permite_acesso(user_id) order by user_id limit 1;
 if v_admin is null then raise exception 'Sem administrador autorizado'; end if;
 v_token:=encode(extensions.gen_random_bytes(32),'hex');
 insert into private.invite_queue_runs_v138(token_hash,authorized_by,dry_run) values(encode(extensions.digest(v_token,'sha256'),'hex'),v_admin,p_dry) returning id into v_id;
 select net.http_post(url:='https://wewbwrdqubypuwuyvwmv.supabase.co/functions/v1/invite-responsible-queue',headers:='{"Content-Type":"application/json"}'::jsonb,body:=jsonb_build_object('token',v_token),timeout_milliseconds:=60000) into v_request;
 update private.invite_queue_runs_v138 set request_id=v_request where id=v_id;
 return jsonb_build_object('status','dispatched','request_id',v_request,'queued',v_count,'dry_run',p_dry);
end $fn$;
revoke all on function private.dispatch_invites_v138(boolean) from public,anon,authenticated,service_role;

create or replace function public.claim_invites_v138(p_token text)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare r private.invite_queue_runs_v138%rowtype; q record; v_result jsonb:='[]'; v_slots integer;
begin
 perform pg_advisory_xact_lock(1382026);
 select * into r from private.invite_queue_runs_v138 where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and created_at>now()-interval '5 minutes' and claimed_at is null for update;
 if not found then raise exception 'Token inválido ou expirado' using errcode='42501'; end if;
 update private.invite_queue_runs_v138 set claimed_at=clock_timestamp() where id=r.id;
 perform set_config('request.jwt.claim.sub',r.authorized_by::text,true);
 v_slots:=greatest(0,2-(select count(*) from private.invite_queue_items_v138 where attempted_at>clock_timestamp()-interval '1 hour'));
 for q in select i.responsavel_id,i.email,l.nome from private.invite_queue_items_v138 i join public.listar_lote_responsaveis() l on l.id=i.responsavel_id and l.situacao='Pronto para convidar' and lower(l.email)=lower(i.email) where i.status='queued' order by i.responsavel_id limit v_slots
 loop
   if not r.dry_run then update private.invite_queue_items_v138 set status='sending',run_id=r.id,attempted_at=clock_timestamp(),attempts=attempts+1 where responsavel_id=q.responsavel_id; end if;
   v_result:=v_result||jsonb_build_array(jsonb_build_object('id',q.responsavel_id,'email',q.email,'nome',q.nome));
 end loop;
 if not r.dry_run then
   update private.invite_queue_items_v138 i set status='skipped',last_error='Cadastro alterado, já convidado ou sem requisitos de acesso' where i.status='queued' and not exists(select 1 from public.listar_lote_responsaveis() l where l.id=i.responsavel_id and l.situacao='Pronto para convidar' and lower(l.email)=lower(i.email));
 end if;
 return jsonb_build_object('dry_run',r.dry_run,'items',v_result);
end $fn$;
revoke all on function public.claim_invites_v138(text) from public,anon,authenticated;
grant execute on function public.claim_invites_v138(text) to service_role;

create or replace function public.finish_invite_v138(p_token text,p_id bigint,p_status text,p_error text default null)
returns void language plpgsql security definer set search_path='' as $fn$
begin
 if p_status not in ('sent','error','queued') then raise exception 'Status inválido'; end if;
 update private.invite_queue_items_v138 i set status=p_status,sent_at=case when p_status='sent' then clock_timestamp() else null end,last_error=left(p_error,500)
 from private.invite_queue_runs_v138 r where r.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and r.id=i.run_id and i.responsavel_id=p_id and i.status='sending' and r.created_at>now()-interval '10 minutes';
 if not found then raise exception 'Execução não encontrada'; end if;
end $fn$;
revoke all on function public.finish_invite_v138(text,bigint,text,text) from public,anon,authenticated;
grant execute on function public.finish_invite_v138(text,bigint,text,text) to service_role;
