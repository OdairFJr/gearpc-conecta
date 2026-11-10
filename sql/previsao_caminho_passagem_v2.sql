alter table public.jovens add column if not exists data_pode_realizar_passagem date;

create or replace function private.previsao_caminho_passagem_v2(p_nascimento date, p_ramo text)
returns table (inicio date, primeira_passagem date, limite date)
language sql immutable set search_path = ''
as $$
  with regra as (
    select case translate(lower(btrim(p_ramo)), 'ê', 'e')
      when 'filhotes' then 7
      when 'lobinho' then 11
      when 'escoteiro' then 15
      when 'senior' then 18
      when 'pioneiro' then 22
    end as idade
  ), prazo as (
    select idade, (p_nascimento + make_interval(years => idade))::date as limite
    from regra
  )
  select case idade
      when 22 then null
      when 18 then (limite - interval '4 months')::date
      else (limite - interval '1 year')::date
    end,
    case idade
      when 22 then null
      when 18 then limite
      else (limite - interval '6 months')::date
    end,
    limite
  from prazo;
$$;

create or replace function private.preencher_previsao_caminho_passagem()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_ramo text;
  v_limite date;
begin
  select nome into v_ramo from public.ramos where id = new.ramo_id;
  if tg_op = 'UPDATE' then
    if (new.ramo_id, new.data_nascimento) is not distinct from (old.ramo_id, old.data_nascimento) then
      -- Permite ajustar os alertas existentes, mas Pioneiro não tem Caminho.
      select p.primeira_passagem, p.limite into new.data_pode_realizar_passagem, v_limite
      from private.previsao_caminho_passagem_v2(new.data_nascimento, v_ramo) p;
      if lower(btrim(v_ramo)) = 'pioneiro' then
        new.data_pode_iniciar_caminho := null;
        new.data_limite_passagem_ramo := v_limite;
      end if;
      return new;
    end if;
  end if;
  select p.inicio, p.primeira_passagem, p.limite
    into new.data_pode_iniciar_caminho, new.data_pode_realizar_passagem, new.data_limite_passagem_ramo
  from private.previsao_caminho_passagem_v2(new.data_nascimento, v_ramo) p;
  return new;
end;
$$;

revoke all on function private.previsao_caminho_passagem_v2(date,text),
  private.preencher_previsao_caminho_passagem() from public, anon, authenticated;

drop trigger if exists trg_previsao_caminho_passagem on public.jovens;
create trigger trg_previsao_caminho_passagem
before insert or update of ramo_id, data_nascimento, data_pode_iniciar_caminho, data_pode_realizar_passagem, data_limite_passagem_ramo
on public.jovens for each row execute function private.preencher_previsao_caminho_passagem();

with previsoes as (
  select j.id,
    case when p.primeira_passagem is null then p.inicio
      else coalesce(j.data_pode_iniciar_caminho, p.inicio) end as inicio,
    p.primeira_passagem,
    case when p.primeira_passagem is null then p.limite
      else coalesce(j.data_limite_passagem_ramo, p.limite) end as limite
  from public.jovens j
  join public.ramos r on r.id = j.ramo_id
  cross join lateral private.previsao_caminho_passagem_v2(j.data_nascimento, r.nome) p
  where p.limite is not null
)
update public.jovens j set
  data_pode_iniciar_caminho = p.inicio,
  data_pode_realizar_passagem = p.primeira_passagem,
  data_limite_passagem_ramo = p.limite
from previsoes p
where j.id = p.id
  and (j.data_pode_iniciar_caminho, j.data_pode_realizar_passagem, j.data_limite_passagem_ramo)
    is distinct from (p.inicio, p.primeira_passagem, p.limite);

drop function if exists private.previsao_caminho_passagem(date,text);
