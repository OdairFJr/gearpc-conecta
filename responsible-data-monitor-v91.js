(() => {
  if (window.__GEARPC_RESPONSIBLE_DATA_MONITOR_V91__) return;
  window.__GEARPC_RESPONSIBLE_DATA_MONITOR_V91__ = true;

  const $ = (id) => document.getElementById(id);
  const state = { rt:null, adminRows:[], history:[], reviewRows:[], confirmations:new Map(), correctionPending:false };

  function client(){ return state.rt && state.rt.client; }
  function profile(){ return state.rt && state.rt.state && state.rt.state.profile; }
  function user(){ return state.rt && state.rt.state && state.rt.state.user; }
  function isAdmin(){ return profile() && profile().tipo === 'administrador'; }
  function isTestResponsible(){
    const p = profile();
    return !!(p && p.tipo === 'responsavel' && p.eh_teste === true && p.responsavel_id);
  }
  function esc(v){
    return String(v == null ? '' : v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
  }
  function fmtDate(v){
    if(!v) return '—';
    const d = new Date(v + 'T12:00:00');
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
  }
  function fmtDateTime(v){
    if(!v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }

  function styles(){
    if($('responsibleDataMonitorStylesV91')) return;
    const s=document.createElement('style');
    s.id='responsibleDataMonitorStylesV91';
    s.textContent=
      '.rdm-overlay-v91{position:fixed;inset:0;z-index:100050;background:#eef3f7;overflow:auto;padding:14px 12px 30px;box-sizing:border-box}.rdm-overlay-v91.hidden{display:none!important}.rdm-shell-v91{width:min(900px,100%);margin:0 auto}.rdm-head-v91{background:#0a376c;color:#fff;border-radius:18px;padding:17px 16px}.rdm-head-row-v91{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.rdm-head-v91 h2{margin:2px 0 0;font-size:1.3rem}.rdm-head-v91 p{margin:8px 0 0;line-height:1.45;font-size:.84rem;opacity:.92}.rdm-head-actions-v91{display:flex;gap:8px}.rdm-head-actions-v91 button{border:1px solid rgba(255,255,255,.45);border-radius:9px;padding:8px 10px;background:rgba(255,255,255,.1);color:#fff;font-weight:850}.rdm-summary-v91{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:12px 0}.rdm-summary-card-v91{background:#fff;border:1px solid #d8e2ec;border-radius:14px;padding:12px}.rdm-summary-card-v91 span{display:block;color:#718294;font-size:.7rem;font-weight:850;text-transform:uppercase}.rdm-summary-card-v91 strong{display:block;color:#17324d;font-size:1.45rem;margin-top:3px}.rdm-section-v91{background:#fff;border:1px solid #d8e2ec;border-radius:16px;margin-top:12px;overflow:hidden}.rdm-section-head-v91{padding:12px 14px;background:#f5f8fb;border-bottom:1px solid #dfe7ee}.rdm-section-head-v91 h3{margin:0;color:#17324d}.rdm-section-head-v91 p{margin:4px 0 0;color:#687b8e;font-size:.77rem}.rdm-row-v91{padding:12px 14px;border-top:1px solid #edf1f5}.rdm-row-v91:first-child{border-top:0}.rdm-row-head-v91{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.rdm-row-head-v91 strong{color:#17324d}.rdm-meta-v91{display:flex;gap:8px;flex-wrap:wrap;margin-top:5px;color:#65798c;font-size:.76rem}.rdm-status-v91{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:.66rem;font-weight:950;text-transform:uppercase;background:#edf2f7;color:#51667a}.rdm-status-v91.ok{background:#e5f5ea;color:#22633a}.rdm-status-v91.warn{background:#fff0c7;color:#775900}.rdm-note-v91{margin-top:8px;padding:9px 10px;border-radius:10px;background:#fff7de;color:#6c5619;font-size:.78rem;line-height:1.4}.rdm-history-v91{display:grid;gap:8px;padding:12px 14px}.rdm-history-item-v91{border-left:3px solid #9fb3c7;padding:5px 0 5px 10px}.rdm-history-item-v91 strong{color:#17324d;font-size:.84rem}.rdm-history-item-v91 span{display:block;color:#687b8e;font-size:.73rem;margin-top:2px}.rdm-review-card-v91{background:#fff;border:1px solid #d8e2ec;border-radius:15px;padding:14px;margin-top:11px}.rdm-review-card-v91 h3{margin:0;color:#17324d}.rdm-grid-v91{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.rdm-field-v91{padding:9px 10px;border-radius:10px;background:#f6f8fa}.rdm-field-v91 span{display:block;color:#718294;font-size:.67rem;font-weight:850;text-transform:uppercase}.rdm-field-v91 strong{display:block;margin-top:3px;color:#243c53;font-size:.84rem}.rdm-review-actions-v91{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.rdm-review-actions-v91 button,.rdm-correction-box-v91 button{border-radius:9px;padding:9px 11px;font-weight:900}.rdm-correct-v91{border:1px solid #d4b65c;background:#fff8e2;color:#725400}.rdm-correction-box-v91{margin-top:10px}.rdm-correction-box-v91 textarea{width:100%;box-sizing:border-box;min-height:82px;border:1px solid #c8b267;border-radius:10px;padding:9px;font:inherit}.rdm-correction-box-v91 button{margin-top:7px;border:0;background:#0a376c;color:#fff}.rdm-message-v91{min-height:18px;margin:9px 2px 0;color:#9b3f31;font-size:.79rem;font-weight:750}.rdm-badge-v91{display:inline-flex;min-width:22px;height:22px;padding:0 6px;border-radius:999px;align-items:center;justify-content:center;background:#b83b32;color:#fff;font-size:.7rem;font-weight:950;margin-left:8px}.rdm-empty-v91{padding:22px;text-align:center;color:#687b8e}body.rdm-locked-v91{overflow:hidden!important}@media(max-width:620px){.rdm-summary-v91,.rdm-grid-v91{grid-template-columns:1fr}.rdm-head-row-v91{flex-direction:column}.rdm-head-actions-v91{width:100%}.rdm-head-actions-v91 button{flex:1}}';
    document.head.appendChild(s);
  }

  function ensureAdminOverlay(){
    let el=$('responsibleAdminMonitorV91');
    if(el) return el;
    el=document.createElement('section');
    el.id='responsibleAdminMonitorV91';
    el.className='rdm-overlay-v91 hidden';
    el.innerHTML='<div class="rdm-shell-v91"><header class="rdm-head-v91"><div class="rdm-head-row-v91"><div><div style="font-size:.7rem;font-weight:900;letter-spacing:.08em;opacity:.8">RESPONSÁVEIS • TESTE</div><h2>Conferência dos dados dos jovens</h2><p>Acompanhe quem já conferiu, quem está pendente e quem solicitou correção.</p></div><div class="rdm-head-actions-v91"><button id="responsibleAdminRefreshV91" type="button">↻ Atualizar</button><button id="responsibleAdminCloseV91" type="button">Voltar</button></div></div></header><div id="responsibleAdminSummaryV91" class="rdm-summary-v91"></div><section class="rdm-section-v91"><div class="rdm-section-head-v91"><h3>Situação atual</h3><p>Um registro por jovem vinculado.</p></div><div id="responsibleAdminRowsV91"></div></section><section class="rdm-section-v91"><div class="rdm-section-head-v91"><h3>Histórico de movimentações</h3><p>Confirmações, pedidos de correção e reconfirmações.</p></div><div id="responsibleAdminHistoryV91" class="rdm-history-v91"></div></section><p id="responsibleAdminMessageV91" class="rdm-message-v91"></p></div>';
    document.body.appendChild(el);
    $('responsibleAdminCloseV91').addEventListener('click',()=>{el.classList.add('hidden');document.body.classList.remove('rdm-locked-v91');});
    $('responsibleAdminRefreshV91').addEventListener('click',()=>void openAdmin(false));
    return el;
  }

  function ensureReviewOverlay(){
    let el=$('responsibleReviewDataV91');
    if(el) return el;
    el=document.createElement('section');
    el.id='responsibleReviewDataV91';
    el.className='rdm-overlay-v91 hidden';
    el.innerHTML='<div class="rdm-shell-v91"><header class="rdm-head-v91"><div class="rdm-head-row-v91"><div><div style="font-size:.7rem;font-weight:900;letter-spacing:.08em;opacity:.8">MEUS JOVENS</div><h2>Revisar dados dos jovens</h2><p>Confira novamente e solicite correção se encontrar algo incorreto.</p></div><div class="rdm-head-actions-v91"><button id="responsibleReviewRefreshV91" type="button">↻ Atualizar</button><button id="responsibleReviewCloseV91" type="button">Voltar</button></div></div></header><div id="responsibleReviewRowsV91"></div><p id="responsibleReviewMessageV91" class="rdm-message-v91"></p></div>';
    document.body.appendChild(el);
    $('responsibleReviewCloseV91').addEventListener('click',()=>{if(state.correctionPending)return;el.classList.add('hidden');document.body.classList.remove('rdm-locked-v91');});
    $('responsibleReviewRefreshV91').addEventListener('click',()=>void openReview());
    el.addEventListener('click',(ev)=>{
      const open=ev.target.closest('[data-rdm-open-correction]');
      if(open){ const id=Number(open.dataset.rdmOpenCorrection); el.querySelector('[data-rdm-correction-box="'+id+'"]').classList.toggle('hidden'); return; }
      const send=ev.target.closest('[data-rdm-send-correction]');
      if(send){
        const id=Number(send.dataset.rdmSendCorrection);
        const box=el.querySelector('[data-rdm-correction-box="'+id+'"]');
        const text=(box.querySelector('textarea').value||'').trim();
        if(text.length<3){ setReviewMessage('Explique brevemente o que precisa ser corrigido.'); return; }
        send.disabled=true; void requestCorrection(id,text).finally(()=>{send.disabled=false;});
      }
    });
    return el;
  }

  function setReviewMessage(text,ok){
    const el=$('responsibleReviewMessageV91'); if(!el)return; el.textContent=text||''; el.style.color=ok?'#176b3a':'#9b3f31';
  }

  async function unreadCount(){
    if(!isAdmin()) return 0;
    const r=await client().from('notificacoes').select('id',{count:'exact',head:true}).eq('user_id',user().id).eq('tipo','responsavel_dados_jovem').eq('lida',false);
    return r.error?0:(r.count||0);
  }

  async function refreshAdminButton(){
    const b=$('responsibleConfirmationAdminButtonV91'); if(!b||!isAdmin()) return;
    const n=await unreadCount(); let badge=b.querySelector('.rdm-badge-v91');
    if(n>0){
      if(!badge){badge=document.createElement('span');badge.className='rdm-badge-v91';b.querySelector('strong').appendChild(badge);}
      badge.textContent=String(n); b.querySelector('small').textContent=n+' nova(s) movimentação(ões) de responsáveis.';
    }else{
      if(badge)badge.remove(); b.querySelector('small').textContent='Confirmados, pendentes e correções solicitadas.';
    }
  }

  function ensureButtons(){
    const modules=document.querySelector('#dashboardView .launch-modules'); if(!modules)return;
    if(isAdmin()&&!$('responsibleConfirmationAdminButtonV91')){
      const b=document.createElement('button'); b.id='responsibleConfirmationAdminButtonV91'; b.className='launch-module'; b.type='button';
      b.innerHTML='<span class="launch-module-icon" aria-hidden="true">👨‍👩‍👧</span><span class="launch-module-copy"><strong>Conferência dos responsáveis</strong><small>Confirmados, pendentes e correções solicitadas.</small></span><span class="launch-module-arrow" aria-hidden="true">›</span>';
      b.addEventListener('click',()=>void openAdmin(true)); modules.appendChild(b); void refreshAdminButton();
    }
    if(isTestResponsible()&&!$('responsibleDataReviewButtonV91')){
      const b=document.createElement('button'); b.id='responsibleDataReviewButtonV91'; b.className='launch-module'; b.type='button';
      b.innerHTML='<span class="launch-module-icon" aria-hidden="true">📝</span><span class="launch-module-copy"><strong>Revisar dados dos jovens</strong><small>Confira novamente ou solicite uma correção.</small></span><span class="launch-module-arrow" aria-hidden="true">›</span>';
      b.addEventListener('click',()=>void openReview()); modules.appendChild(b);
    }
  }

  async function loadAdmin(){
    const c=client();
    const a=await Promise.all([
      c.from('perfis_usuarios').select('user_id,nome_completo,responsavel_id,ativo,eh_teste').eq('tipo','responsavel').eq('eh_teste',true).eq('ativo',true).order('nome_completo'),
      c.from('jovem_responsaveis').select('jovem_id,responsavel_id,parentesco,responsavel_principal'),
      c.from('jovens').select('id,nome_completo,ativo,eh_teste').eq('ativo',true),
      c.from('responsavel_confirmacoes_jovens').select('responsavel_id,jovem_id,status,observacao,confirmado_em,solicitado_em,atualizado_em'),
      c.from('responsavel_confirmacoes_historico').select('responsavel_id,jovem_id,acao,observacao,criado_em').order('criado_em',{ascending:false}).limit(100)
    ]);
    const err=a.find(x=>x.error); if(err) throw err.error;
    const profiles=a[0].data||[], links=a[1].data||[], jovens=a[2].data||[], conf=a[3].data||[], hist=a[4].data||[];
    const byResp=new Map(profiles.map(x=>[Number(x.responsavel_id),x])), allowed=new Set(byResp.keys()), byJovem=new Map(jovens.map(x=>[Number(x.id),x])), byConf=new Map(conf.map(x=>[Number(x.responsavel_id)+':'+Number(x.jovem_id),x]));
    state.adminRows=links.filter(x=>allowed.has(Number(x.responsavel_id))).map(x=>{
      const p=byResp.get(Number(x.responsavel_id)),j=byJovem.get(Number(x.jovem_id)); if(!p||!j)return null;
      return {responsavel:p,jovem:j,link:x,confirmation:byConf.get(Number(x.responsavel_id)+':'+Number(x.jovem_id))||null};
    }).filter(Boolean);
    state.history=hist.filter(x=>allowed.has(Number(x.responsavel_id))).map(x=>Object.assign({},x,{responsavel:byResp.get(Number(x.responsavel_id)),jovem:byJovem.get(Number(x.jovem_id))}));
  }

  function renderAdmin(){
    const ok=state.adminRows.filter(x=>x.confirmation&&x.confirmation.status==='confirmado').length;
    const corr=state.adminRows.filter(x=>x.confirmation&&x.confirmation.status==='correcao_solicitada').length;
    const pend=state.adminRows.length-ok-corr;
    $('responsibleAdminSummaryV91').innerHTML='<div class="rdm-summary-card-v91"><span>Confirmados</span><strong>'+ok+'</strong></div><div class="rdm-summary-card-v91"><span>Pendentes</span><strong>'+pend+'</strong></div><div class="rdm-summary-card-v91"><span>Correção solicitada</span><strong>'+corr+'</strong></div>';
    $('responsibleAdminRowsV91').innerHTML=state.adminRows.length?state.adminRows.map(x=>{
      const c=x.confirmation, status=!c?'Pendente':c.status==='confirmado'?'Confirmado':'Correção solicitada', cls=!c?'':c.status==='confirmado'?'ok':'warn', when=c&&(c.confirmado_em||c.solicitado_em||c.atualizado_em);
      return '<div class="rdm-row-v91"><div class="rdm-row-head-v91"><div><strong>'+esc(x.jovem.nome_completo)+'</strong><div class="rdm-meta-v91"><span>Responsável: '+esc(x.responsavel.nome_completo)+'</span><span>Vínculo: '+esc(x.link.parentesco||'responsável')+'</span>'+(when?'<span>Atualizado: '+esc(fmtDateTime(when))+'</span>':'')+'</div></div><span class="rdm-status-v91 '+cls+'">'+esc(status)+'</span></div>'+(c&&c.status==='correcao_solicitada'&&c.observacao?'<div class="rdm-note-v91"><strong>Correção solicitada:</strong> '+esc(c.observacao)+'</div>':'')+'</div>';
    }).join(''):'<div class="rdm-empty-v91">Nenhum responsável de teste com jovem vinculado.</div>';
    const labels={confirmado:'Dados confirmados',correcao_solicitada:'Correção solicitada',reconfirmado:'Dados reconfirmados'};
    $('responsibleAdminHistoryV91').innerHTML=state.history.length?state.history.map(h=>'<div class="rdm-history-item-v91"><strong>'+esc(labels[h.acao]||h.acao)+' • '+esc(h.jovem&&h.jovem.nome_completo||'Jovem')+'</strong><span>'+esc(h.responsavel&&h.responsavel.nome_completo||'Responsável')+' • '+esc(fmtDateTime(h.criado_em))+(h.observacao?' • '+esc(h.observacao):'')+'</span></div>').join(''):'<div class="rdm-empty-v91">Nenhuma movimentação registrada ainda.</div>';
  }

  async function openAdmin(markRead){
    if(!isAdmin())return; styles(); ensureAdminOverlay(); $('responsibleAdminMonitorV91').classList.remove('hidden'); document.body.classList.add('rdm-locked-v91'); $('responsibleAdminMessageV91').textContent='Carregando…';
    try{
      await loadAdmin(); renderAdmin(); $('responsibleAdminMessageV91').textContent='';
      if(markRead){ await client().from('notificacoes').update({lida:true}).eq('user_id',user().id).eq('tipo','responsavel_dados_jovem').eq('lida',false); await refreshAdminButton(); }
    }catch(e){ $('responsibleAdminMessageV91').textContent='Não foi possível carregar: '+(e.message||e); }
  }

  async function loadReview(){
    const p=profile(),c=client();
    const a=await Promise.all([
      c.from('jovem_responsaveis').select('jovem_id,responsavel_id,parentesco').eq('responsavel_id',Number(p.responsavel_id)),
      c.from('jovens').select('id,nome_completo,data_nascimento,registro_paxtu,validade_registro,data_acolhida,ramo_id,secao_id,equipe_id,ativo').eq('ativo',true).order('nome_completo'),
      c.from('ramos').select('id,nome'),c.from('secoes').select('id,nome'),c.from('equipes').select('id,nome,ativo').eq('ativo',true),
      c.from('responsavel_confirmacoes_jovens').select('jovem_id,status,observacao,confirmado_em,solicitado_em,atualizado_em').eq('responsavel_id',Number(p.responsavel_id))
    ]);
    const err=a.find(x=>x.error); if(err)throw err.error;
    const ids=new Set((a[0].data||[]).map(x=>Number(x.jovem_id))), links=new Map((a[0].data||[]).map(x=>[Number(x.jovem_id),x])), ramos=new Map((a[2].data||[]).map(x=>[Number(x.id),x])), secoes=new Map((a[3].data||[]).map(x=>[Number(x.id),x])), equipes=new Map((a[4].data||[]).map(x=>[Number(x.id),x]));
    state.confirmations=new Map((a[5].data||[]).map(x=>[Number(x.jovem_id),x]));
    state.reviewRows=(a[1].data||[]).filter(x=>ids.has(Number(x.id))).map(x=>Object.assign({},x,{link:links.get(Number(x.id)),ramo:ramos.get(Number(x.ramo_id)),secao:secoes.get(Number(x.secao_id)),equipe:equipes.get(Number(x.equipe_id))}));
  }

  function teamLabel(row){ const n=String(row.ramo&&row.ramo.nome||'').toLowerCase(); if(n.includes('lobinho'))return'Matilha'; if(n.includes('escoteiro')||n.includes('sênior')||n.includes('senior'))return'Patrulha'; return'Equipe'; }
  function renderReview(){
    const host=$('responsibleReviewRowsV91');
    host.innerHTML=state.reviewRows.length?state.reviewRows.map(row=>{
      const c=state.confirmations.get(Number(row.id)), confirmed=c&&c.status==='confirmado', correction=c&&c.status==='correcao_solicitada';
      return '<article class="rdm-review-card-v91"><div class="rdm-row-head-v91"><h3>'+esc(row.nome_completo)+'</h3><span class="rdm-status-v91 '+(confirmed?'ok':correction?'warn':'')+'">'+(confirmed?'Confirmado':correction?'Correção solicitada':'Pendente')+'</span></div><div class="rdm-grid-v91"><div class="rdm-field-v91"><span>Nascimento</span><strong>'+esc(fmtDate(row.data_nascimento))+'</strong></div><div class="rdm-field-v91"><span>Ramo</span><strong>'+esc(row.ramo&&row.ramo.nome||'Não informado')+'</strong></div><div class="rdm-field-v91"><span>Seção</span><strong>'+esc(row.secao&&row.secao.nome||'Não informado')+'</strong></div><div class="rdm-field-v91"><span>'+esc(teamLabel(row))+'</span><strong>'+esc(row.equipe&&row.equipe.nome||'Não informado')+'</strong></div><div class="rdm-field-v91"><span>Nº de registro</span><strong>'+esc(row.registro_paxtu||'Não informado')+'</strong></div><div class="rdm-field-v91"><span>Validade do registro</span><strong>'+esc(fmtDate(row.validade_registro))+'</strong></div><div class="rdm-field-v91"><span>Data de acolhida</span><strong>'+esc(fmtDate(row.data_acolhida))+'</strong></div><div class="rdm-field-v91"><span>Vínculo</span><strong>'+esc(row.link&&row.link.parentesco||'responsável')+'</strong></div></div>'+(correction&&c.observacao?'<div class="rdm-note-v91"><strong>Correção já solicitada:</strong> '+esc(c.observacao)+'</div>':'')+(confirmed?'<div class="rdm-review-actions-v91"><button class="rdm-correct-v91" type="button" data-rdm-open-correction="'+Number(row.id)+'">✎ Solicitar correção</button></div><div class="rdm-correction-box-v91 hidden" data-rdm-correction-box="'+Number(row.id)+'"><textarea maxlength="700" placeholder="Explique o que precisa ser corrigido."></textarea><button type="button" data-rdm-send-correction="'+Number(row.id)+'">Enviar solicitação</button></div>':'')+'</article>';
    }).join(''):'<div class="rdm-empty-v91">Nenhum jovem vinculado ao seu acesso.</div>';
  }

  async function openReview(){
    if(!isTestResponsible())return; styles(); ensureReviewOverlay(); state.correctionPending=false; $('responsibleReviewCloseV91').classList.remove('hidden'); $('responsibleReviewDataV91').classList.remove('hidden'); document.body.classList.add('rdm-locked-v91'); setReviewMessage('Carregando…');
    try{await loadReview();renderReview();setReviewMessage('');}catch(e){setReviewMessage('Não foi possível carregar: '+(e.message||e));}
  }

  async function requestCorrection(jovemId,obs){
    const p=profile(),u=user(),now=new Date().toISOString(); setReviewMessage('Registrando solicitação…');
    const r=await client().from('responsavel_confirmacoes_jovens').upsert({responsavel_id:Number(p.responsavel_id),jovem_id:Number(jovemId),status:'correcao_solicitada',observacao:obs,confirmado_em:null,solicitado_em:now,confirmado_por:u.id,atualizado_em:now},{onConflict:'responsavel_id,jovem_id'});
    if(r.error){setReviewMessage('Não foi possível salvar: '+r.error.message);return;}
    state.correctionPending=true; $('responsibleReviewCloseV91').classList.add('hidden'); await loadReview();renderReview();setReviewMessage('Solicitação registrada e administrador avisado. O acesso ficará aguardando a correção e uma nova confirmação.',true);
  }

  async function waitRuntime(){
    for(let i=0;i<120;i++){const r=window.GEARPC_RUNTIME;if(r&&r.client&&r.state&&r.state.profile&&r.state.user){state.rt=r;return r;}await new Promise(resolve=>setTimeout(resolve,50));}return null;
  }
  const prepare=async()=>{const r=await waitRuntime();if(!r)return;styles();ensureButtons();if(isAdmin())await refreshAdminButton();};
  window.GEARPC_DASHBOARD_PREPARE_TASKS=window.GEARPC_DASHBOARD_PREPARE_TASKS||[];window.GEARPC_DASHBOARD_PREPARE_TASKS.push(prepare);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isAdmin())void refreshAdminButton();});
})();