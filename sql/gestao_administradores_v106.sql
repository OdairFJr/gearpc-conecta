-- GEArPC Conecta v106 • identificação, concessão e retirada auditada de administradores.
-- Ações antigas não são atribuídas retroativamente a nenhum usuário.
create table if not exists public.administradores_historico (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.perfis_usuarios(user_id) on delete restrict,
  acao text not null check (acao in ('identificado','concedido','revogado')),
  tipo_anterior text,
  tipo_novo text not null,
  alterado_por uuid references public.perfis_usuarios(user_id) on delete set null,
  motivo text check (motivo is null or char_length(motivo) <= 500),
  realizado_em timestamptz not null default now()
);
create index if not exists administradores_historico_user_data_idx
  on public.administradores_historico(user_id,realizado_em desc,id desc);
create unique index if not exists administradores_historico_inicial_unico
  on public.administradores_historico(user_id)
  where acao='identificado';

alter table public.administradores_historico enable row level security;
revoke all on public.administradores_historico from public,anon,authenticated;
grant select on public.administradores_historico to authenticated;
drop policy if exists "administradores_historico_consulta_admin" on public.administradores_historico;
create policy "administradores_historico_consulta_admin"
on public.administradores_historico for select to authenticated
using (private.sou_admin());

-- Fotografia inicial do perfil atual. A data é a da implantação do recurso,
-- NÃO a da concessão original da permissão.
insert into public.administradores_historico
  (user_id,acao,tipo_anterior,tipo_novo,alterado_por,motivo)
select p.user_id,'identificado',null,'administrador',null,
  'Administrador já existente ao ativar o controle; data e autor originais não registrados.'
from public.perfis_usuarios p
where p.tipo='administrador'
on conflict (user_id) where acao='identificado' do nothing;

-- Único canal de alteração de permissões. Não há UPDATE direto liberado aos
-- usuários autenticados. A autorização é checada no banco a cada chamada.
create or replace function public.gerenciar_administrador_v106(
  p_usuario_id uuid,
  p_tornar_admin boolean,
  p_motivo text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $body$
declare
  v_alvo public.perfis_usuarios%rowtype;
  v_antigo text;
  v_novo text;
  v_motivo text := nullif(btrim(coalesce(p_motivo,'')),'');
  v_admins integer;
begin
  if auth.uid() is null or not private.sou_admin() then
    raise exception 'Acesso restrito a administradores ativos'
      using errcode='42501';
  end if;
  if p_usuario_id is null or p_tornar_admin is null then
    raise exception 'Informe usuário e operação';
  end if;
  if char_length(coalesce(v_motivo,''))>500 then
    raise exception 'A observação deve ter até 500 caracteres';
  end if;

  -- Serializa alterações concorrentes de privilégio para impedir a remoção
  -- simultânea dos dois últimos administradores.
  perform pg_advisory_xact_lock(1062026,1);

  select * into v_alvo from public.perfis_usuarios
  where user_id=p_usuario_id for update;
  if not found then raise exception 'Usuário não encontrado';end if;
  -- Contas inativas não podem receber poderes administrativos, mas é
  -- permitido revogá-los para evitar restauração de acesso ao reativar a conta.
  if not v_alvo.ativo and p_tornar_admin then
    raise exception 'Não é possível conceder acesso a uma conta inativa';
  end if;

  v_antigo:=v_alvo.tipo;
  if p_tornar_admin then
    if v_antigo='administrador' then
      raise exception 'Esta pessoa já é administradora';
    end if;
    if v_alvo.eh_teste then
      raise exception 'Contas de teste não podem receber acesso administrativo';
    end if;
    if v_antigo<>'chefia' or v_alvo.chefe_id is null then
      raise exception 'A concessão administrativa está limitada a chefes cadastrados';
    end if;
    v_novo:='administrador';
  else
    if v_antigo<>'administrador' then
      raise exception 'Esta pessoa não possui acesso administrativo';
    end if;
    if p_usuario_id=auth.uid() then
      raise exception 'Você não pode retirar seu próprio acesso de administrador';
    end if;
    select count(*) into v_admins
    from public.perfis_usuarios where tipo='administrador' and ativo;
    if v_admins<=1 then
      raise exception 'É necessário manter pelo menos um administrador ativo';
    end if;

    -- Restaura a função anterior da última concessão registrada. As contas
    -- anteriores à implantação, se vinculadas a uma ficha de chefe, voltam a
    -- chefia. Caso contrário, a operação exige regularizar o vínculo.
    select h.tipo_anterior into v_novo
    from public.administradores_historico h
    where h.user_id=p_usuario_id and h.acao='concedido'
    order by h.realizado_em desc,h.id desc limit 1;
    if v_novo is null then
      if v_alvo.chefe_id is not null then v_novo:='chefia';
      elsif v_alvo.responsavel_id is not null then v_novo:='responsavel';
      else
        raise exception 'Não foi possível determinar o perfil anterior. Regularize o cadastro antes de retirar o acesso';
      end if;
    end if;
    if v_novo not in ('chefia','responsavel') then
      raise exception 'Perfil anterior inválido. Procure a administração do sistema';
    end if;
  end if;

  update public.perfis_usuarios
    set tipo=v_novo,atualizado_em=clock_timestamp()
  where user_id=p_usuario_id;

  insert into public.administradores_historico
    (user_id,acao,tipo_anterior,tipo_novo,alterado_por,motivo)
  values
    (p_usuario_id,case when p_tornar_admin then 'concedido' else 'revogado' end,
     v_antigo,v_novo,auth.uid(),v_motivo);

  return jsonb_build_object('user_id',p_usuario_id,'tipo_anterior',v_antigo,
    'tipo_novo',v_novo,'ok',true);
end
$body$;

revoke all on function public.gerenciar_administrador_v106(uuid,boolean,text)
  from public,anon,authenticated;
grant execute on function public.gerenciar_administrador_v106(uuid,boolean,text)
  to authenticated;
