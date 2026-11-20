import { createClient } from "npm:@supabase/supabase-js@2.89.0";
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}});
Deno.serve(async req=>{
 if(req.method!=="POST")return reply({error:"Método inválido"},405);
 const body=await req.json().catch(()=>null);
 if(typeof body?.token!=="string"||!/^[a-f0-9]{64}$/.test(body.token))return reply({error:"Não autorizado"},401);
 const client=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:batch,error}=await client.rpc("claim_invites_v138",{p_token:body.token});
 if(error||!batch)return reply({error:"Não autorizado"},401);
 if(batch.dry_run)return reply({ok:true,dry_run:true,eligible:batch.items.length});
 const outcomes=[];
 for(const item of batch.items){
  try{
   const {data,error:inviteError}=await client.auth.admin.inviteUserByEmail(item.email,{redirectTo:"https://odairfjr.github.io/gearpc-conecta/"});
   if(inviteError||!data.user){
    const limited=inviteError?.status===429||/rate|limit/i.test(inviteError?.code||"");
    const {error:recordError}=await client.rpc("finish_invite_v138",{p_token:body.token,p_id:item.id,p_status:limited?"queued":"error",p_error:limited?"Limite de e-mail atingido; aguardar próxima execução":"Envio recusado pelo serviço: "+(inviteError?.code||"sem confirmação")});
    if(recordError)throw recordError;
    outcomes.push({id:item.id,status:limited?"rate_limited":"error"});
    if(limited){for(const rest of batch.items.slice(batch.items.indexOf(item)+1)){await client.rpc("finish_invite_v138",{p_token:body.token,p_id:rest.id,p_status:"queued",p_error:"Lote interrompido pelo limite de envio"});}break;}
    continue;
   }
   const {error:profileError}=await client.from("perfis_usuarios").insert({user_id:data.user.id,nome_completo:item.nome,responsavel_id:item.id,tipo:"responsavel",ativo:true,eh_teste:false,troca_senha_obrigatoria:false});
   const {error:recordError}=await client.rpc("finish_invite_v138",{p_token:body.token,p_id:item.id,p_status:profileError?"error":"sent",p_error:profileError?"Convite gerado; vínculo requer conferência administrativa. Não reenviar.":null});
   if(recordError)throw recordError;
   outcomes.push({id:item.id,status:profileError?"profile_error":"sent"});
  }catch(_){
   await client.rpc("finish_invite_v138",{p_token:body.token,p_id:item.id,p_status:"error",p_error:"Resultado incerto; conferir conta e histórico antes de reenviar"});
   outcomes.push({id:item.id,status:"uncertain"});
  }
 }
 return reply({ok:true,outcomes});
});
