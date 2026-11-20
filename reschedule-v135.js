/* Reagenda programação e segurança no mesmo salvamento, sem duplicar a atividade. */
(() => {
 const $=id=>document.getElementById(id);
 const local=iso=>{
  if(!iso)return '';
  const p=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(iso));
  return p.replace(' ','T');
 };
 const stamp=v=>new Date(v+':00-03:00').toISOString();
 window.GEARPC_RESCHEDULE_V135=async function(row,fromSafety=false){
  const rt=window.GEARPC_RUNTIME;
  if(!rt?.client||$('rescheduleDialogV135'))return;
  const d=document.createElement('dialog');d.id='rescheduleDialogV135';
  d.style.cssText='max-width:520px;width:calc(100% - 48px);border:1px solid #aebfd0;border-radius:14px;padding:20px;color:#183e60';
  d.innerHTML='<form><h3>Alterar datas e horários</h3><p>O reagendamento atualiza a programação e a segurança vinculada juntas. Confira as duas antes de reenviar ao DME. Autorizações anteriores precisarão ser renovadas.</p><label style="display:grid;margin:12px 0">Início<input name="inicio" type="datetime-local" required></label><label style="display:grid;margin:12px 0">Término<input name="fim" type="datetime-local" required></label><label style="display:grid;margin:12px 0">Motivo<textarea name="motivo" required minlength="3" maxlength="1000"></textarea></label><p role="status"></p><button type="submit">Salvar novas datas</button> <button type="button" data-close>Cancelar</button></form>';
  document.body.appendChild(d);
  const f=d.querySelector('form'),msg=d.querySelector('[role=status]');
  const v=row.document_payload?.visit||{},p=row.document_payload?.plan||{};
  f.elements.inicio.value=fromSafety?(v.activityStartDate||p.date||'')+'T'+(v.activityStartTime||p.activityStartTime||'00:00'):local(row.data_inicio);
  f.elements.fim.value=fromSafety?(v.activityEndDate||p.activityEndDate||v.activityStartDate||p.date||'')+'T'+(v.activityEndTime||p.activityEndTime||'23:59'):local(row.data_fim);
  d.querySelector('[data-close]').onclick=()=>d.close();d.onclose=()=>d.remove();d.showModal();
  f.onsubmit=async event=>{
   event.preventDefault();
   if(f.elements.inicio.value>=f.elements.fim.value){msg.textContent='O término deve ser posterior ao início.';return;}
   f.querySelector('[type=submit]').disabled=true;msg.textContent='Salvando programação e segurança...';
   try{
    const {data,error}=await rt.client.rpc('reagendar_atividade_v135',{
     p_id:fromSafety?null:row.id,p_visit_id:fromSafety?row.visit_id:null,
     p_inicio:stamp(f.elements.inicio.value),p_fim:stamp(f.elements.fim.value),
     p_atualizado_em:fromSafety?row.updated_at:row.atualizado_em,p_motivo:f.elements.motivo.value.trim()
    });
    if(error)throw error;
    if(data?.payload){
     const key='gearpc-safety-test-v63:'+rt.state.user.id;
     const store=JSON.parse(localStorage.getItem(key)||'{"visits":[],"plans":[]}');
     store.visits=(store.visits||[]).map(x=>x.id===data.visit_id?{...x,...data.payload.visit}:x);
     store.plans=(store.plans||[]).map(x=>x.baseVisitId===data.visit_id?{...x,...data.payload.plan}:x);
     localStorage.setItem(key,JSON.stringify(store));
    }
    alert('Datas atualizadas na programação e na segurança vinculada. Confira os dois documentos e reenvie ao DME. Se houver roteiro em PDF/Word com datas antigas, substitua o arquivo.');
    location.reload();
   }catch(error){msg.textContent='Não foi possível reagendar: '+error.message;f.querySelector('[type=submit]').disabled=false;}
  };
 };
 function decorate(){
  const rt=window.GEARPC_RUNTIME;if(!['administrador','chefia'].includes(rt?.state?.profile?.tipo))return;
  document.querySelectorAll('[data-edit-visit],[data-review-v67]').forEach(edit=>{
   const host=edit.closest('.safety-card-actions-v63,.safety-dme-actions-v67');
   if(!host||host.querySelector('[data-reschedule-v135]'))return;
   const visit=edit.dataset.editVisit||edit.dataset.reviewV67;
   const b=document.createElement('button');b.type='button';b.className='safety-mini-btn-v63';b.dataset.rescheduleV135=visit;b.textContent='Alterar datas e horários';
   b.onclick=async()=>{
    b.disabled=true;
    try{
     const {data,error}=await rt.client.from('safety_approval_test_v67').select('visit_id,updated_at,document_payload').eq('visit_id',visit).maybeSingle();
     if(error)throw error;
     if(!data){alert('Use “Ver / editar planejamento” para alterar as datas deste rascunho ainda não enviado.');return;}
     await window.GEARPC_RESCHEDULE_V135(data,true);
    }catch(error){alert(error.message);}finally{b.disabled=false;}
   };host.appendChild(b);
  });
 }
 const observer=new MutationObserver(decorate);observer.observe(document.body,{childList:true,subtree:true});decorate();
})();
