-- Datas previstas de acordo com o ramo atual. O início efetivo continua na ficha.
create or replace function private.previsao_caminho_passagem(p_nascimento date, p_ramo text)
returns table (inicio date, limite date)
language sql immutable set search_path = ''
as $$
  with regra as (
    select case translate(lower(btrim(p_ramo)), 'ê', 'e')
      when 'filhotes' then 7
      when 'lobinho' then 11
      when 'escoteiro' then 15
      when 'senior' then 18
      when 'pioneiro' then 22
    end as idade_limite
  ), prazo as (
    select (p_nascimento + make_interval(years => idade_limite))::date as limite,
      case when idade_limite = 18 then interval '4 months' else interval '1 year' end as antecedencia
    from regra
  )
  select (limite - antecedencia)::date, limite from prazo;
$$;

create or replace function private.preencher_previsao_caminho_passagem()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if (new.ramo_id, new.data_nascimento) is not distinct from (old.ramo_id, old.data_nascimento) then
      return new;
    end if;
  end if;
  select p.inicio, p.limite into new.data_pode_iniciar_caminho, new.data_limite_passagem_ramo
  from public.ramos r
  cross join lateral private.previsao_caminho_passagem(new.data_nascimento, r.nome) p
  where r.id = new.ramo_id;
  return new;
end;
$$;

revoke all on function private.previsao_caminho_passagem(date, text),
  private.preencher_previsao_caminho_passagem() from public, anon, authenticated;

drop trigger if exists trg_previsao_caminho_passagem on public.jovens;
create trigger trg_previsao_caminho_passagem
before insert or update of ramo_id, data_nascimento on public.jovens
for each row execute function private.preencher_previsao_caminho_passagem();

with previsoes as (
  select j.id, p.inicio, p.limite
  from public.jovens j
  join public.ramos r on r.id = j.ramo_id
  cross join lateral private.previsao_caminho_passagem(j.data_nascimento, r.nome) p
  where p.limite is not null
)
update public.jovens j set
  data_pode_iniciar_caminho = p.inicio,
  data_limite_passagem_ramo = p.limite
from previsoes p
where j.id = p.id
  and (j.data_pode_iniciar_caminho, j.data_limite_passagem_ramo)
    is distinct from (p.inicio, p.limite);
