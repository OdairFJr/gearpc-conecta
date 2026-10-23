-- Marcos do Jovem: centraliza o historico de promessas em uma unica operacao atomica.
-- Apenas chefes da secao podem alterar os marcos atuais. A edicao das promessas
-- historicas e dos alertas continua exclusiva do administrador.
create or replace function public.salvar_marcos_jovem_unificado(
 p_jovem_id bigint,
 p_data_acolhida date,
 p_data_promessa date,
 p_data_inicio_caminho date,
 p_data_passagem_ramo date,
 p_data_pode_iniciar_caminho date,
 p_data_limite_passagem_ramo date,
 p_promessa_historica_lobinho date,
 p_promessa_historica_escoteira date,
 p_promessa_adulta date
)
returns void
language plpgsql
security definer
set search_path=''
as $function$
declare
 v_ramo bigint;
 v_admin boolean;
begin
 if auth.uid() is null then
   raise exception 'Autenticacao obrigatoria' using errcode='42501';
 end if;

 v_admin:=private.sou_admin();
 if not v_admin and (
   p_promessa_historica_lobinho is not null
   or p_promessa_historica_escoteira is not null
   or p_promessa_adulta is not null
 ) then
   raise exception 'Somente o administrador pode alterar promessas historicas'
     using errcode='42501';
 end if;

 -- Valida tambem o vinculo de chefia e protege os alertas.
 perform public.salvar_marcos_jovem(
   p_jovem_id,
   p_data_acolhida,
   p_data_promessa,
   p_data_inicio_caminho,
   p_data_passagem_ramo,
   p_data_pode_iniciar_caminho,
   p_data_limite_passagem_ramo
 );

 if v_admin then
   select ramo_id into v_ramo from public.jovens where id=p_jovem_id;
   update public.jovens
   set data_promessa_lobinho =
     case when v_ramo=2 then data_promessa_lobinho else p_promessa_historica_lobinho end,
     data_promessa_escoteira =
     case when v_ramo in (3,4,5) then data_promessa_escoteira else p_promessa_historica_escoteira end,
     data_promessa_adulta=p_promessa_adulta
   where id=p_jovem_id;
 end if;
end
$function$;
revoke all on function public.salvar_marcos_jovem_unificado(bigint,date,date,date,date,date,date,date,date,date)
 from public,anon,authenticated;
grant execute on function public.salvar_marcos_jovem_unificado(bigint,date,date,date,date,date,date,date,date,date)
 to authenticated;
