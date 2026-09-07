(() => {
  if (window.__GEARPC_ATTENDANCE_OFFLINE_24_1__) return;
  window.__GEARPC_ATTENDANCE_OFFLINE_24_1__ = true;
  const rt = window.GEARPC_RUNTIME;
  if (!rt?.client || !rt?.state) return;
  const { client, state, escapeHtml } = rt;
  const $ = (id) => document.getElementById(id);
  const ui = {
    button: $('attendanceButton'), view: $('attendanceView'), section: $('attendanceSection'), date: $('attendanceDate'),
    present: $('attendancePresentCount'), absent: $('attendanceAbsentCount'), pending: $('attendancePendingCount'),
    role: $('attendanceRoleNote'), list: $('attendanceList'), message: $('attendanceMessage'), deleteCall: $('attendanceDeleteCallButton')
  };
  if (!ui.button || !ui.view || !ui.section || !ui.date || !ui.list) return;

  const m = { ramos: [], secoes: [], jovens: [], own: [], call: null, rows: [], offline: false, syncing: false };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const uid = () => state.user?.id || 'anon';
  const storeKey = () => `gearpc-presenca-offline-v24:${uid()}`;
  const emptyStore = () => ({ base: null, calls: {}, queue: [] });
  const readStore = () => { try { return { ...emptyStore(), ...(JSON.parse(localStorage.getItem(storeKey()) || 'null') || {}) }; } catch { return emptyStore(); } };
  const writeStore = (s) => { try { localStorage.setItem(storeKey(), JSON.stringify(s)); } catch {} };
  const selKey = (secaoId = Number(ui.section.value || 0), date = ui.date.value) => `${secaoId}|${date || ''}`;
  const isAdmin = () => state.profile?.tipo === 'administrador';
  const canManage = (secaoId) => isAdmin() || m.own.includes(Number(secaoId));

  function showAttendance() {
    ['loginView','dashboardView','membersView','chiefsView','accessView','programmingView','programEditorView'].forEach(id => $(id)?.classList.add('hidden'));
    ui.view.classList.remove('hidden');
  }
  function msg(text, ok=false) { ui.message.textContent = text || ''; ui.message.classList.toggle('success-message', ok); }
  function syncRuntime() {
    state.ramos = m.ramos; state.secoes = m.secoes; state.jovens = m.jovens; state.attendanceOwnSectionIds = m.own;
    state.attendanceCall = m.call; state.attendanceRows = m.rows;
  }
  function saveBase() {
    const s = readStore(); s.base = { ramos:m.ramos, secoes:m.secoes, jovens:m.jovens, own:m.own, at:new Date().toISOString() }; writeStore(s);
  }
  function loadBaseLocal() {
    const b = readStore().base; if (!b?.secoes?.length || !b?.jovens?.length) return false;
    m.ramos=b.ramos||[]; m.secoes=b.secoes||[]; m.jovens=b.jovens||[]; m.own=(b.own||[]).map(Number); m.offline=true; syncRuntime(); return true;
  }
  async function loadBaseOnline() {
    const qs = [
      client.from('ramos').select('id,nome,ordem,ativo').eq('ativo',true).order('ordem'),
      client.from('secoes').select('id,nome,ramo_id,ativo').eq('ativo',true),
      client.from('jovens').select('id,nome_completo,ramo_id,secao_id,ativo').eq('ativo',true).order('nome_completo')
    ];
    if (state.profile?.chefe_id) qs.push(client.from('chefe_secoes').select('secao_id').eq('chefe_id',state.profile.chefe_id));
    const r = await Promise.all(qs); const e=r.find(x=>x.error)?.error; if(e) throw e;
    m.ramos=r[0].data||[]; m.secoes=r[1].data||[]; m.jovens=r[2].data||[];
    m.own=state.profile?.chefe_id ? (r[3]?.data||[]).map(x=>Number(x.secao_id)) : [];
    m.offline=false; saveBase(); syncRuntime(); return true;
  }
  async function ensureBase() {
    if (navigator.onLine) { try { return await loadBaseOnline(); } catch {} }
    if (loadBaseLocal()) return true;
    msg('📴 Sem internet e ainda não há lista salva neste aparelho. Abra a Presença uma vez com internet para preparar o modo offline.'); return false;
  }
  function sectionsAvailable() {
    const active=m.secoes.filter(s=>s.ativo!==false);
    if(isAdmin()) return active;
    const allowed=new Set(m.own); return active.filter(s=>allowed.has(Number(s.id)));
  }
  function renderSections() {
    const rm=new Map(m.ramos.map(r=>[Number(r.id),r])); const current=ui.section.value; const secs=sectionsAvailable();
    ui.section.innerHTML='<option value="">Selecione</option>'+secs.map(s=>`<option value="${s.id}">${escapeHtml(s.nome)}${rm.get(Number(s.ramo_id))?` — ${escapeHtml(rm.get(Number(s.ramo_id)).nome)}`:''}</option>`).join('');
    if(secs.some(s=>String(s.id)===String(current))) ui.section.value=current; else if(secs[0]) ui.section.value=String(secs[0].id);
  }
  function localSelection(secaoId,date) { return readStore().calls[selKey(secaoId,date)] || {call:null,rows:[]}; }
  function saveSelection(secaoId,date,call,rows) { const s=readStore(); s.calls[selKey(secaoId,date)]={call,rows,at:new Date().toISOString()}; writeStore(s); }
  function applyQueue(secaoId,date,rows) {
    const key=selKey(secaoId,date), map=new Map((rows||[]).map(r=>[Number(r.jovem_id),{...r}]));
    for(const q of readStore().queue.filter(q=>q.key===key)) {
      if(q.type==='delete') map.delete(Number(q.jovemId));
      else if(q.type==='upsert') map.set(Number(q.jovemId),{id:`local:${key}:${q.jovemId}`,chamada_id:m.call?.id||`local:${key}`,jovem_id:Number(q.jovemId),status:q.status,registrado_por:state.user?.id,atualizado_em:q.at,_local:true});
    }
    return [...map.values()];
  }
  async function loadSelectionOnline(secaoId,date) {
    const {data:calls,error}=await client.from('chamadas').select('id,secao_id,data_reuniao,titulo,criado_por,criado_em,atualizado_em').eq('secao_id',secaoId).eq('data_reuniao',date).limit(1); if(error) throw error;
    const call=calls?.[0]||null; let rows=[];
    if(call){ const r=await client.from('presencas_chamada').select('id,chamada_id,jovem_id,status,observacao,registrado_por,atualizado_em').eq('chamada_id',call.id); if(r.error) throw r.error; rows=r.data||[]; }
    saveSelection(secaoId,date,call,rows); return {call,rows};
  }
  async function loadSelection() {
    const sid=Number(ui.section.value||0), date=ui.date.value; m.call=null; m.rows=[];
    if(!sid||!date){syncRuntime();render();return;}
    let x;
    if(navigator.onLine){try{x=await loadSelectionOnline(sid,date);m.offline=false;}catch{x=localSelection(sid,date);m.offline=true;}}
    else {x=localSelection(sid,date);m.offline=true;}
    m.call=x.call; m.rows=applyQueue(sid,date,x.rows||[]); syncRuntime(); render();
  }
  function queueCount(){const key=selKey();return readStore().queue.filter(q=>q.key===key).length;}
  function render() {
    const sid=Number(ui.section.value||0), date=ui.date.value;
    if(!sid||!date){ui.list.innerHTML='<div class="empty-members"><div>✅</div><strong>Selecione seção e data</strong><span>A lista de jovens aparecerá aqui.</span></div>';ui.present.textContent='0';ui.absent.textContent='0';ui.pending.textContent='0';return;}
    const young=m.jovens.filter(j=>j.ativo!==false&&Number(j.secao_id)===sid).sort((a,b)=>a.nome_completo.localeCompare(b.nome_completo,'pt-BR'));
    const sm=new Map(m.rows.map(r=>[Number(r.jovem_id),r.status])); let p=0,a=0; for(const j of young){if(sm.get(Number(j.id))==='presente')p++;if(sm.get(Number(j.id))==='ausente')a++;}
    ui.present.textContent=String(p);ui.absent.textContent=String(a);ui.pending.textContent=String(Math.max(0,young.length-p-a));
    const manage=canManage(sid); if(ui.role) ui.role.textContent=manage?'Você pode registrar a presença desta seção.':'Seu perfil possui somente consulta nesta seção.';
    ui.list.innerHTML=young.map(j=>{const st=sm.get(Number(j.id))||'pendente';const clear=st!=='pendente'?`<button type="button" class="attendance-mark clear" data-aoc="${j.id}">↺ Limpar</button>`:'';const ctr=manage?`<div class="attendance-actions"><button type="button" class="attendance-mark present ${st==='presente'?'selected':''}" data-ao="${j.id}" data-st="presente">✓ Presente</button><button type="button" class="attendance-mark absent ${st==='ausente'?'selected':''}" data-ao="${j.id}" data-st="ausente">✕ Ausente</button>${clear}</div>`:`<span class="attendance-readonly-badge ${st}">${st==='presente'?'✓ Presente':st==='ausente'?'✕ Ausente':'• Não marcado'}</span>`;return `<article class="attendance-card ${st}"><div class="attendance-person"><div class="member-avatar">${escapeHtml(j.nome_completo.charAt(0).toUpperCase())}</div><div><h3>${escapeHtml(j.nome_completo)}</h3><span>${escapeHtml(m.secoes.find(s=>Number(s.id)===sid)?.nome||'Seção')}</span></div></div>${ctr}</article>`;}).join('');
    const q=queueCount(); if(!navigator.onLine||m.offline) msg(q?`📴 Modo offline — ${q} alteração(ões) aguardando sincronização.`:'📴 Modo offline — faça a chamada normalmente; ela será sincronizada quando a internet voltar.'); else if(q) msg(`⏳ ${q} alteração(ões) aguardando sincronização.`); else msg('');
  }
  function queueOp(op){const s=readStore();s.queue=s.queue.filter(q=>!(q.key===op.key&&Number(q.jovemId)===Number(op.jovemId)));s.queue.push(op);writeStore(s);}
  async function mark(jovemId,status){const sid=Number(ui.section.value||0),date=ui.date.value;if(!canManage(sid))return;const at=new Date().toISOString();queueOp({type:'upsert',key:selKey(sid,date),secaoId:sid,date,jovemId:Number(jovemId),status,at});const i=m.rows.findIndex(r=>Number(r.jovem_id)===Number(jovemId));const row={id:`local:${sid}:${date}:${jovemId}`,jovem_id:Number(jovemId),status,registrado_por:state.user.id,atualizado_em:at,_local:true};if(i>=0)m.rows[i]=row;else m.rows.push(row);syncRuntime();render();if(navigator.onLine)await syncQueue();}
  async function clear(jovemId){const sid=Number(ui.section.value||0),date=ui.date.value;if(!canManage(sid))return;queueOp({type:'delete',key:selKey(sid,date),secaoId:sid,date,jovemId:Number(jovemId),at:new Date().toISOString()});m.rows=m.rows.filter(r=>Number(r.jovem_id)!==Number(jovemId));syncRuntime();render();if(navigator.onLine)await syncQueue();}
  async function remoteCall(secaoId,date,create){const q=await client.from('chamadas').select('id,secao_id,data_reuniao,titulo,criado_por,criado_em,atualizado_em').eq('secao_id',secaoId).eq('data_reuniao',date).limit(1);if(q.error)throw q.error;if(q.data?.[0])return q.data[0];if(!create)return null;const ins=await client.from('chamadas').insert({secao_id:secaoId,data_reuniao:date,titulo:'Reunião semanal',criado_por:state.user.id}).select('id,secao_id,data_reuniao,titulo,criado_por,criado_em,atualizado_em').single();if(!ins.error)return ins.data;if(ins.error.code==='23505'){const ex=await client.from('chamadas').select('id,secao_id,data_reuniao,titulo,criado_por,criado_em,atualizado_em').eq('secao_id',secaoId).eq('data_reuniao',date).single();if(ex.error)throw ex.error;return ex.data;}throw ins.error;}
  async function syncQueue(){if(m.syncing||!navigator.onLine||!state.user)return;m.syncing=true;try{let s=readStore();for(const op of [...s.queue]){try{const call=await remoteCall(op.secaoId,op.date,op.type==='upsert');if(op.type==='upsert'){const r=await client.from('presencas_chamada').upsert({chamada_id:call.id,jovem_id:op.jovemId,status:op.status,registrado_por:state.user.id,atualizado_em:op.at},{onConflict:'chamada_id,jovem_id'});if(r.error)throw r.error;}else if(op.type==='delete'&&call){const r=await client.from('presencas_chamada').delete().eq('chamada_id',call.id).eq('jovem_id',op.jovemId);if(r.error)throw r.error;}s=readStore();s.queue=s.queue.filter(q=>!(q.key===op.key&&Number(q.jovemId)===Number(op.jovemId)&&q.at===op.at));writeStore(s);}catch{}}}finally{m.syncing=false;}if(ui.view&&!ui.view.classList.contains('hidden')){await loadSelection();if(queueCount()===0)msg('✓ Presença sincronizada com sucesso.',true);}}
  async function open(){showAttendance();if(!ui.date.value)ui.date.value=today();msg('Preparando lista de presença...');if(!await ensureBase()){render();return;}renderSections();await syncQueue();await loadSelection();}

  document.addEventListener('click',e=>{const b=e.target instanceof Element?e.target.closest('button'):null;if(!b)return;if(b===ui.button){e.preventDefault();e.stopImmediatePropagation();void open();return;}if(b.matches('[data-ao]')){e.preventDefault();e.stopImmediatePropagation();void mark(Number(b.dataset.ao),b.dataset.st);return;}if(b.matches('[data-aoc]')){e.preventDefault();e.stopImmediatePropagation();void clear(Number(b.dataset.aoc));}},true);
  document.addEventListener('change',e=>{if(e.target!==ui.section&&e.target!==ui.date)return;e.stopImmediatePropagation();void loadSelection();},true);
  window.addEventListener('online',()=>void(async()=>{try{await loadBaseOnline();renderSections();}catch{}await syncQueue();})());
  window.addEventListener('offline',()=>{m.offline=true;if(!ui.view.classList.contains('hidden'))render();});
  let tries=0;const timer=setInterval(()=>{tries++;if(state.user&&state.profile){clearInterval(timer);if(navigator.onLine)void loadBaseOnline().then(()=>syncQueue()).catch(()=>{});}else if(tries>30)clearInterval(timer);},500);
})();
