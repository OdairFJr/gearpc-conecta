(() => {
  if (window.__GEARPC_APF_FORMACAO_V54__) return;
  window.__GEARPC_APF_FORMACAO_V54__ = true;
  window.__GEARPC_APF_FORMACAO_V53__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let configs = [];
  let assessoramentos = [];
  let chiefs = [];
  let pioneers = [];
  let currentApfId = null;

  const esc = (value) => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function dateBR(value) {
    if (!value) return '—';
    const [y,m,d] = String(value).split('-').map(Number);
    return y && m && d ? new Date(y,m-1,d,12).toLocaleDateString('pt-BR') : value;
  }
  const chief = (id) => chiefs.find((c) => Number(c.id) === Number(id)) || null;
  const pioneer = (id) => pioneers.find((p) => Number(p.id) === Number(id)) || null;
  const cfg = (id) => configs.find((c) => Number(c.chefe_id) === Number(id)) || null;
  const activeFor = (id) => assessoramentos.filter((a) => Number(a.apf_chefe_id) === Number(id) && a.status === 'ativo');

  function formationLabel(a) {
    if (a.formacao === 'preliminar') return 'Preliminar';
    return `${a.formacao === 'avancado' ? 'Avançado' : 'Intermediário'} ${a.linha === 'dirigente' ? 'Dirigente' : 'Escotista'}`;
  }
  function levelLabel(value) {
    return value === 'avancado' ? 'Avançado' : value === 'intermediario' ? 'Intermediário' : 'Não possui';
  }
  function allowedOptions(config) {
    const out = [];
    if (config?.preliminar_concluido) out.push(['preliminar:','Preliminar']);
    if (['intermediario','avancado'].includes(config?.nivel_escotista)) out.push(['intermediario:escotista','Intermediário — Escotista']);
    if (config?.nivel_escotista === 'avancado') out.push(['avancado:escotista','Avançado — Escotista']);
    if (['intermediario','avancado'].includes(config?.nivel_dirigente)) out.push(['intermediario:dirigente','Intermediário — Dirigente']);
    if (config?.nivel_dirigente === 'avancado') out.push(['avancado:dirigente','Avançado — Dirigente']);
    return out;
  }

  async function waitRuntime() {
    for (let i=0;i<120;i++) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.profile) return x;
      await sleep(250);
    }
    return null;
  }

  function injectStyles() {
    if ($('apfFormationStylesV54')) return;
    const style = document.createElement('style');
    style.id = 'apfFormationStylesV54';
    style.textContent = `
      .apf-training-v54{display:grid;gap:7px;margin-top:11px;padding:11px;border-radius:11px;background:#f4f8fc;border:1px solid #dce7f0;font-size:.82rem;color:#4e6377}.apf-training-v54 strong{color:#17324d}
      .apf-assignees-v54{margin-top:11px;padding-top:11px;border-top:1px solid #e0e7ed}.apf-assignees-v54 h4{margin:0 0 7px;color:#17324d;font-size:.86rem}.apf-assignees-v54 ul{margin:0;padding-left:18px;color:#586d80;font-size:.81rem;line-height:1.5}
      .apf-assignees-btn-v54{margin-top:11px;width:100%;border:0;border-radius:10px;padding:10px 12px;background:#0a376c;color:#fff;font-weight:800;cursor:pointer}.apf-cap-v54{font-weight:900;color:#177245}.apf-cap-v54.full{color:#9b2c2c}
      .apf-level-grid-v54{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid #e3e9ef}.apf-level-grid-v54 label{display:grid;gap:5px;font-size:.76rem;font-weight:800;color:#52687b}.apf-level-grid-v54 select{width:100%;border:1px solid #ccd7e0;border-radius:9px;padding:9px;background:#fff}.apf-prelim-v54{display:flex!important;align-items:center;gap:8px}.apf-prelim-v54 input{width:18px!important;height:18px!important;accent-color:#0a376c}
      .apf-assess-dialog-v54{border:0;border-radius:18px;padding:0;width:min(94vw,650px);max-height:90vh;box-shadow:0 22px 60px rgba(0,0,0,.3)}.apf-assess-dialog-v54::backdrop{background:rgba(4,20,38,.64)}.apf-assess-body-v54{padding:20px}.apf-assess-body-v54 h2{margin:3px 0 4px;color:#0a376c}.apf-assess-sub-v54{margin:0 0 15px;color:#64788a}.apf-assess-summary-v54{display:flex;justify-content:space-between;gap:10px;background:#f4f8fc;border-radius:11px;padding:10px 12px;margin-bottom:14px}
      .apf-assess-form-v54{display:grid;gap:10px;padding:13px;border:1px solid #dce5ed;border-radius:13px}.apf-assess-form-v54 label{display:grid;gap:5px;font-size:.8rem;font-weight:800;color:#4f6579}.apf-assess-form-v54 select,.apf-assess-form-v54 input,.apf-assess-form-v54 textarea{width:100%;box-sizing:border-box;border:1px solid #cbd7e1;border-radius:9px;padding:10px;background:#fff;font:inherit}.apf-assess-grid-v54{display:grid;grid-template-columns:1fr 1fr;gap:9px}.apf-assess-add-v54{border:0;border-radius:10px;padding:10px;background:#0a376c;color:#fff;font-weight:800}.apf-assess-add-v54:disabled{background:#9ba9b5}
      .apf-assess-list-v54{display:grid;gap:9px;margin-top:15px}.apf-assess-row-v54{border:1px solid #dce5ed;border-radius:12px;padding:11px}.apf-assess-meta-v54{font-size:.8rem;color:#627587;margin-top:4px}.apf-assess-actions-v54{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.apf-assess-actions-v54 button{border:0;border-radius:8px;padding:7px 9px;font-weight:800;font-size:.76rem}.apf-done-v54{background:#e5f4e9;color:#176a37}.apf-end-v54{background:#edf0f3;color:#4f6171}.apf-delete-v54{background:#fdeceb;color:#a22520}.apf-close-v54{width:100%;border:0;border-radius:10px;padding:10px;margin-top:15px;background:#e9eef3;color:#17324d;font-weight:800}.apf-msg-v54{min-height:20px;font-size:.82rem;font-weight:700;margin:8px 0 0}.apf-hist-v54{margin:15px 0 5px;font-size:.85rem;color:#53687b}
      @media(max-width:560px){.apf-level-grid-v54,.apf-assess-grid-v54{grid-template-columns:1fr}.apf-assess-body-v54{padding:16px}}
    `;
    document.head.appendChild(style);
  }

  async function loadAll() {
    const [c,a,h,r] = await Promise.all([
      rt.client.from('apfs_disponiveis').select('id,chefe_id,disponivel,observacoes,preliminar_concluido,nivel_escotista,nivel_dirigente').order('chefe_id'),
      rt.client.from('apf_assessoramentos').select('id,apf_chefe_id,assessorado_chefe_id,assessorado_jovem_id,formacao,linha,data_inicio,status,data_fim,observacoes,criado_em').order('criado_em',{ascending:false}),
      rt.client.from('chefes').select('id,nome_completo,ativo').eq('ativo',true).order('nome_completo'),
      rt.client.from('ramos').select('id,nome,ativo').eq('ativo',true)
    ]);
    if (c.error) throw c.error; if (a.error) throw a.error; if (h.error) throw h.error; if (r.error) throw r.error;
    const pioneerRamo = (r.data || []).find((x) => /pioneir/i.test(String(x.nome || '')));
    let youthRes = { data: [], error: null };
    if (pioneerRamo?.id) {
      youthRes = await rt.client.from('jovens').select('id,nome_completo,ramo_id,ativo').eq('ramo_id',pioneerRamo.id).eq('ativo',true).order('nome_completo');
      if (youthRes.error) throw youthRes.error;
    }
    configs = c.data || [];
    assessoramentos = a.data || [];
    chiefs = h.data || [];
    pioneers = youthRes.data || [];
  }

  async function refreshCards() {
    try { await loadAll(); } catch (e) { console.warn('APF v54',e); return; }
    decorateCards();
  }

  function findChiefByCard(card) {
    const name = card.querySelector('.apf-card-head-v52 strong')?.textContent?.trim();
    return chiefs.find((c) => c.nome_completo === name) || null;
  }

  function decorateCards() {
    document.querySelectorAll('#apfListV52 .apf-card-v52').forEach((card) => {
      const c = findChiefByCard(card); if (!c) return;
      const config = cfg(c.id); const active = activeFor(c.id);
      const badge = card.querySelector('.apf-badge-v52');
      if (badge) { badge.classList.toggle('full',active.length>=4); badge.textContent = active.length>=4 ? 'Lotado • 4/4' : `${active.length}/4 assessorados`; }
      let training = card.querySelector('.apf-training-v54');
      if (!training) { training = document.createElement('div'); training.className='apf-training-v54'; card.querySelector('.apf-meta-v52')?.insertAdjacentElement('afterend',training); }
      training.innerHTML = `<div><strong>Preliminar:</strong> ${config?.preliminar_concluido?'Concluído':'Não informado'}</div><div><strong>Linha Escotista:</strong> ${levelLabel(config?.nivel_escotista)}</div><div><strong>Linha Dirigente:</strong> ${levelLabel(config?.nivel_dirigente)}</div><div class="apf-cap-v54 ${active.length>=4?'full':''}">Capacidade: ${active.length} de 4 assessorados ativos</div>`;
      let block = card.querySelector('.apf-assignees-v54');
      if (!block) { block=document.createElement('div'); block.className='apf-assignees-v54'; card.appendChild(block); }
      const items = active.map((a)=>{const isPioneer=Boolean(a.assessorado_jovem_id);const p=isPioneer?pioneer(a.assessorado_jovem_id):chief(a.assessorado_chefe_id);return p?`<li>${esc(p.nome_completo)}${isPioneer?' — Pioneiro':''} — ${esc(formationLabel(a))}</li>`:'';}).filter(Boolean).join('');
      block.innerHTML = `<h4>Assessorados atuais</h4>${items?`<ul>${items}</ul>`:'<div style="font-size:.81rem;color:#718292">Nenhum assessorado ativo.</div>'}<button class="apf-assignees-btn-v54" type="button">${active.length>=4?'👥 Gerenciar assessorados (lotado)':'＋ Registrar / gerenciar assessorados'}</button>`;
      block.querySelector('button').addEventListener('click',()=>openAssessments(c.id));
    });
  }

  async function enhanceManager() {
    try { await loadAll(); } catch (_) {}
    const dialog = $('apfManagerDialogV52'); if (!dialog?.open) return;
    const intro = dialog.querySelector('.apf-dialog-body-v52 > p');
    if (intro) intro.textContent='Defina quem pode atuar como APF e o maior nível concluído em cada linha. A capacidade é automática: máximo de 4 assessorados ativos.';
    dialog.querySelectorAll('.apf-manager-row-v52').forEach((row)=>{
      if (row.querySelector('.apf-level-grid-v54')) return;
      const id=Number(row.dataset.chiefId); const config=cfg(id);
      const vagas=row.querySelector('.apf-vagas-v52')?.closest('label'); if(vagas) vagas.style.display='none';
      const grid=document.createElement('div'); grid.className='apf-level-grid-v54';
      grid.innerHTML=`<label class="apf-prelim-v54"><input class="apf-prelim-check-v54" type="checkbox" ${config?.preliminar_concluido?'checked':''}><span>Preliminar concluído</span></label><label>Linha Escotista<select class="apf-esc-v54"><option value="">Não possui</option><option value="intermediario" ${config?.nivel_escotista==='intermediario'?'selected':''}>Intermediário</option><option value="avancado" ${config?.nivel_escotista==='avancado'?'selected':''}>Avançado</option></select></label><label>Linha Dirigente<select class="apf-dir-v54"><option value="">Não possui</option><option value="intermediario" ${config?.nivel_dirigente==='intermediario'?'selected':''}>Intermediário</option><option value="avancado" ${config?.nivel_dirigente==='avancado'?'selected':''}>Avançado</option></select></label>`;
      row.appendChild(grid);
      const auto=()=>{if(grid.querySelector('.apf-esc-v54').value||grid.querySelector('.apf-dir-v54').value) grid.querySelector('.apf-prelim-check-v54').checked=true;};
      grid.querySelector('.apf-esc-v54').addEventListener('change',auto); grid.querySelector('.apf-dir-v54').addEventListener('change',auto);
    });
    const old=$('apfManagerSaveV52');
    if(old&&!old.dataset.v54){const fresh=old.cloneNode(true);fresh.dataset.v54='1';old.replaceWith(fresh);fresh.addEventListener('click',saveManager);}
  }

  async function saveManager() {
    const b=$('apfManagerSaveV52'), msg=$('apfManagerMessageV52'); b.disabled=true;b.textContent='Salvando...';msg.textContent='';
    try {
      for(const row of document.querySelectorAll('.apf-manager-row-v52')){
        const id=Number(row.dataset.chiefId); const escLv=row.querySelector('.apf-esc-v54')?.value||null; const dirLv=row.querySelector('.apf-dir-v54')?.value||null;
        const payload={chefe_id:id,disponivel:row.querySelector('.apf-enabled-v52')?.checked===true,vagas:4,observacoes:String(row.querySelector('.apf-obs-v52')?.value||'').trim()||null,preliminar_concluido:(row.querySelector('.apf-prelim-check-v54')?.checked===true)||Boolean(escLv||dirLv),nivel_escotista:escLv,nivel_dirigente:dirLv,atualizado_em:new Date().toISOString()};
        const {error}=await rt.client.from('apfs_disponiveis').upsert(payload,{onConflict:'chefe_id'}); if(error) throw error;
      }
      msg.style.color='#177245';msg.textContent='✓ APFs e níveis de formação atualizados.';await loadAll();$('apfManagerDialogV52')?.close();
      $('apfBackV52')?.click(); setTimeout(()=>$('apfButtonV52')?.click(),100);
    } catch(e){msg.style.color='#9b2c2c';msg.textContent=`Não foi possível salvar: ${e.message||e}`;} finally{b.disabled=false;b.textContent='Salvar';}
  }

  function ensureDialog(){
    let d=$('apfAssessDialogV54'); if(d) return d;
    d=document.createElement('dialog');d.id='apfAssessDialogV54';d.className='apf-assess-dialog-v54';
    d.innerHTML=`<div class="apf-assess-body-v54"><div class="eyebrow dark">ASSESSORIA PESSOAL DE FORMAÇÃO</div><h2 id="apfAssessTitleV54">Assessorados</h2><p class="apf-assess-sub-v54">Selecione os adultos ou Pioneiros cadastrados no grupo.</p><div id="apfAssessSummaryV54" class="apf-assess-summary-v54"></div><form id="apfAssessFormV54" class="apf-assess-form-v54"><label>Assessorado<select id="apfAssessPersonV54" required></select></label><div class="apf-assess-grid-v54"><label>Formação / linha<select id="apfAssessFormationV54" required></select></label><label>Data de início<input id="apfAssessStartV54" type="date" required></label></div><label>Observação<textarea id="apfAssessObsV54" rows="2" placeholder="Opcional"></textarea></label><button id="apfAssessAddV54" class="apf-assess-add-v54" type="submit">＋ Registrar assessorado</button><p id="apfAssessMsgV54" class="apf-msg-v54"></p></form><div id="apfAssessListV54" class="apf-assess-list-v54"></div><button id="apfAssessCloseV54" class="apf-close-v54" type="button">Fechar</button></div>`;
    document.body.appendChild(d);$('apfAssessCloseV54').addEventListener('click',()=>d.close());$('apfAssessFormV54').addEventListener('submit',addAssessment);return d;
  }

  async function openAssessments(id){currentApfId=Number(id);await loadAll();const d=ensureDialog();$('apfAssessTitleV54').textContent=chief(id)?.nome_completo||'APF';$('apfAssessStartV54').value=today();$('apfAssessObsV54').value='';renderDialog();d.showModal();}

  function renderDialog(){
    const config=cfg(currentApfId), active=activeFor(currentApfId), rem=Math.max(0,4-active.length);
    $('apfAssessSummaryV54').innerHTML=`<strong>${active.length} de 4 assessorados ativos</strong><span>${rem?`${rem} vaga${rem===1?'':'s'} disponível${rem===1?'':'is'}`:'Lotado'}</span>`;
    $('apfAssessPersonV54').innerHTML='<option value="">Selecione o assessorado</option><optgroup label="Adultos">'+chiefs.filter((c)=>Number(c.id)!==currentApfId).map((c)=>`<option value="chefe:${c.id}">${esc(c.nome_completo)}</option>`).join('')+'</optgroup><optgroup label="Pioneiros">'+pioneers.map((p)=>`<option value="jovem:${p.id}">${esc(p.nome_completo)} — Pioneiro</option>`).join('')+'</optgroup>';
    const opts=allowedOptions(config);$('apfAssessFormationV54').innerHTML=opts.length?'<option value="">Selecione</option>'+opts.map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join(''):'<option value="">Cadastre primeiro a formação deste APF</option>';
    const add=$('apfAssessAddV54');add.disabled=active.length>=4||!opts.length;add.textContent=active.length>=4?'Limite de 4 assessorados atingido':'＋ Registrar assessorado';
    const list=$('apfAssessListV54');const all=assessoramentos.filter((a)=>Number(a.apf_chefe_id)===currentApfId), act=all.filter((a)=>a.status==='ativo'), hist=all.filter((a)=>a.status!=='ativo');list.innerHTML='';
    if(!act.length)list.innerHTML='<div style="font-size:.84rem;color:#718292">Nenhum assessoramento ativo.</div>';act.forEach((a)=>list.appendChild(rowForAssessment(a,true)));if(hist.length){const t=document.createElement('div');t.className='apf-hist-v54';t.textContent='Histórico';list.appendChild(t);hist.forEach((a)=>list.appendChild(rowForAssessment(a,false)));}
  }

  function rowForAssessment(a,active){
    const isPioneer=Boolean(a.assessorado_jovem_id),p=isPioneer?pioneer(a.assessorado_jovem_id):chief(a.assessorado_chefe_id),row=document.createElement('div');row.className='apf-assess-row-v54';row.innerHTML=`<strong>${esc(p?.nome_completo||(isPioneer?'Pioneiro':'Adulto'))}</strong>${isPioneer?'<div class="apf-assess-meta-v54">Pioneiro</div>':''}<div class="apf-assess-meta-v54">${esc(formationLabel(a))} • início ${esc(dateBR(a.data_inicio))}${a.data_fim?` • fim ${esc(dateBR(a.data_fim))}`:''}${a.status!=='ativo'?` • ${a.status==='concluido'?'Concluído':'Encerrado'}`:''}</div>${a.observacoes?`<div class="apf-assess-meta-v54">${esc(a.observacoes)}</div>`:''}<div class="apf-assess-actions-v54">${active?'<button class="apf-done-v54" type="button">✓ Concluir</button><button class="apf-end-v54" type="button">Encerrar</button>':''}<button class="apf-delete-v54" type="button">Apagar</button></div>`;
    if(active){row.querySelector('.apf-done-v54').addEventListener('click',()=>finish(a.id,'concluido'));row.querySelector('.apf-end-v54').addEventListener('click',()=>finish(a.id,'encerrado'));}row.querySelector('.apf-delete-v54').addEventListener('click',()=>removeAssessment(a.id,p?.nome_completo||'este assessorado'));return row;
  }

  async function addAssessment(e){
    e.preventDefault();const msg=$('apfAssessMsgV54');msg.style.color='#9b2c2c';msg.textContent='';const person=String($('apfAssessPersonV54').value||''),[personType,personIdRaw]=person.split(':'),assessorado=Number(personIdRaw||0),[formacao,linhaRaw]=String($('apfAssessFormationV54').value||'').split(':');if(!assessorado||!['chefe','jovem'].includes(personType)||!formacao){msg.textContent='Selecione o assessorado e a formação.';return;}const b=$('apfAssessAddV54');b.disabled=true;b.textContent='Salvando...';
    const payload={apf_chefe_id:currentApfId,assessorado_chefe_id:personType==='chefe'?assessorado:null,assessorado_jovem_id:personType==='jovem'?assessorado:null,formacao,linha:linhaRaw||null,data_inicio:$('apfAssessStartV54').value||today(),status:'ativo',observacoes:String($('apfAssessObsV54').value||'').trim()||null};
    const {error}=await rt.client.from('apf_assessoramentos').insert(payload);
    if(error){msg.textContent=error.message||'Não foi possível registrar.';b.disabled=false;b.textContent='＋ Registrar assessorado';return;}msg.style.color='#177245';msg.textContent='✓ Assessorado registrado.';$('apfAssessPersonV54').value='';$('apfAssessFormationV54').value='';$('apfAssessObsV54').value='';await loadAll();renderDialog();decorateCards();
  }

  async function finish(id,status){if(!confirm(`${status==='concluido'?'Concluir':'Encerrar'} este assessoramento? A vaga será liberada.`))return;const {error}=await rt.client.from('apf_assessoramentos').update({status,data_fim:today(),atualizado_em:new Date().toISOString()}).eq('id',id);if(error){$('apfAssessMsgV54').textContent=error.message;return;}await loadAll();renderDialog();decorateCards();}
  async function removeAssessment(id,name){if(!confirm(`Apagar o registro de assessoramento de ${name}?`))return;const {error}=await rt.client.from('apf_assessoramentos').delete().eq('id',id);if(error){$('apfAssessMsgV54').textContent=error.message;return;}await loadAll();renderDialog();decorateCards();}

  function installEvents(){
    document.addEventListener('click',(e)=>{const el=e.target instanceof Element?e.target:null;if(el?.closest('#apfButtonV52'))setTimeout(refreshCards,450);if(el?.closest('#apfManageV52'))setTimeout(enhanceManager,100);});
    document.addEventListener('input',(e)=>{if(e.target?.id==='apfSearchV52')setTimeout(decorateCards,30);});
  }

  async function boot(){rt=await waitRuntime();if(!rt||rt.state.profile?.tipo!=='administrador')return;injectStyles();installEvents();try{await loadAll();}catch(e){console.warn('GEArPC APF v54',e)}setTimeout(decorateCards,500);}
  void boot();
})();
