-- Evita que a confirmação anterior libere acesso enquanto
-- há uma alteração médica aguardando aprovação do administrador.
create or replace function private.bloquear_confirmacao_medica_em_analise()
returns trigger
language plpgsql security definer set search_path = ''
as $body$
begin
  if new.status = 'confirmado'
     and not private.sou_admin()
     and exists (
       select 1 from public.responsavel_propostas_ficha_medica proposta
       where proposta.responsavel_id=new.responsavel_id
         and proposta.jovem_id=new.jovem_id
         and proposta.status='pendente'
     )
  then
    raise exception 'A ficha médica tem alterações aguardando aprovação da administração'
      using errcode='23514';
  end if;
  return new;
end
$body$;
revoke all on function private.bloquear_confirmacao_medica_em_analise()
  from public,anon,authenticated;
create trigger bloquear_confirmacao_enquanto_medica_pendente
before insert or update of status on public.responsavel_confirmacoes_jovens
for each row execute function private.bloquear_confirmacao_medica_em_analise();