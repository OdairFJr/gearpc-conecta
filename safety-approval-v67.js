(() => {
  if (window.__GEARPC_SAFETY_APPROVAL_V67__) return;
  window.__GEARPC_SAFETY_APPROVAL_V67__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let approvals = [];
  let isDme = false;
  let decorating = false;
  let observer = null;

  const STATUS = {
    aguardando_dme: ['Aguardando DME', 'warn'],
    ajustes_solicitados: ['Ajustes solicitados', 'warn'],
    reprovado: ['Reprovado', 'bad'],
    aprovado: ['Aprovado', 'ok']
  };

  function esc(v) {
    return String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function storageKey() {
    return `gearpc-safety-test-v63:${rt?.state?.user?.id || 'local'}`;
  }

  function readStore() {
    try {
      const p = JSON.parse(localStorage.getItem(storageKey()) || '{}');
      return { visits: Array.isArray(p.visits) ? p.visits : [], plans: Array.isArray(p.plans) ? p.plans : [] };
    } catch (_) { return { visits: [], plans: [] }; }
  }

  async function waitReady() {
    for (let i = 0; i < 160; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.user && x?.state?.profile && $('safetyViewV63') && $('safetyVisitsListV63')) return x;
      await sleep(250);
    }
    return null;
  }

  async function detectDme() {
    const chiefId = rt?.state?.profile?.chefe_id;
    if (!chiefId) return false;
    const fromState = (rt?.state?.chefeFuncoes || []).some((f) => Number(f.chefe_id) === Number(chiefId) && String(f.funcao || '').trim().toLowerCase() === 'diretor de metodos educativos');
    if (fromState) return true;
    try {
      const { data, error } = await rt.client.from('chefe_funcoes').select('funcao').eq('chefe_id', chiefId);
      if (error) return false;
      return (data || []).some((f) => String(f.funcao || '').trim().toLowerCase() === 'diretor de metodos educativos');
    } catch (_) { return false; }
  }

  function openPhotoDb() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB indisponível'));
      const req = indexedDB.open('gearpc-safety-test-v64', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('visitPhotos')) db.createObjectStore('visitPhotos', { keyPath: 'visitId' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function loadPhotos(visitId) {
    try {
      const db = await openPhotoDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('visitPhotos', 'readonly');
        const req = tx.objectStore('visitPhotos').get(visitId);
        req.onsuccess = () => resolve(Array.isArray(req.result?.photos) ? req.result.photos : []);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      });
    } catch (_) { return []; }
  }

  function pairedPlan(visitId) {
    return readStore().plans.find((p) => p.baseVisitId === visitId) || null;
  }

  function approvalFor(visitId) {
    return approvals.find((a) => a.visit_id === visitId) || null;
  }

  async function loadApprovals() {
    if (!navigator.onLine) return;
    const { data, error } = await rt.client
      .from('safety_approval_test_v67')
      .select('visit_id,submitted_by,submitted_by_name,activity_name,status,dme_comment,reviewed_by,reviewed_at,submitted_at,updated_at,document_payload')
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    approvals = data || [];
  }

  function injectStyles() {
    if ($('safetyApprovalStylesV67')) return;
    const s = document.createElement('style');
    s.id = 'safetyApprovalStylesV67';
    s.textContent = `
      .safety-approval-note-v67{margin-top:9px;padding:9px 10px;border-radius:10px;background:#f4f7fa;color:#486176;font-size:.82rem;line-height:1.4}
      .safety-dme-panel-v67{margin:16px 18px;padding:14px;border:1px solid #cad9e5;border-radius:15px;background:#f8fbfd}
      .safety-dme-panel-v67 h3{margin:0;color:#17324d}.safety-dme-panel-v67 p{margin:4px 0 12px;color:#637a8e;font-size:.88rem}
      .safety-dme-list-v67{display:grid;gap:9px}.safety-dme-card-v67{background:#fff;border:1px solid #dbe5ed;border-radius:12px;padding:12px}
      .safety-dme-card-v67 strong{color:#17324d}.safety-dme-meta-v67{margin-top:5px;font-size:.8rem;color:#61788c;display:flex;gap:8px;flex-wrap:wrap}
      .safety-dme-actions-v67{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .safety-review-dialog-v67{width:min(960px,calc(100vw - 18px));max-height:94vh;border:0;border-radius:18px;padding:0;box-shadow:0 22px 70px rgba(5,25,45,.28)}
      .safety-review-dialog-v67::backdrop{background:rgba(5,23,38,.58)}.safety-review-shell-v67{padding:18px;background:#fff}
      .safety-review-body-v67{display:grid;gap:12px;max-height:62vh;overflow:auto;padding:12px 0}.safety-review-section-v67{border:1px solid #dfe7ee;border-radius:12px;padding:12px;background:#fbfdff}
      .safety-review-section-v67 h4{margin:0 0 8px;color:#17324d}.safety-review-grid-v67{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;font-size:.84rem}
      .safety-review-grid-v67 div{padding:7px 8px;border-radius:8px;background:#fff}.safety-review-photos-v67{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.safety-review-photos-v67 img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px}
      .safety-review-comment-v67{display:grid;gap:6px;font-size:.85rem;font-weight:700;color:#3e576d}.safety-review-comment-v67 textarea{width:100%;box-sizing:border-box;border:1px solid #cbd8e3;border-radius:10px;padding:10px;min-height:90px;font:inherit;font-weight:400}
      @media(max-width:720px){.safety-review-grid-v67,.safety-review-photos-v67{grid-template-columns:1fr}.safety-dme-panel-v67{margin:12px 10px}}
    `;
    document.head.appendChild(s);
  }

  function injectReviewDialog() {
    if ($('safetyReviewDialogV67')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <dialog id="safetyReviewDialogV67" class="safety-review-dialog-v67">
        <div class="safety-review-shell-v67">
          <div class="safety-dialog-head-v63"><div><div class="eyebrow dark">ANÁLISE DO DME</div><h2 id="safetyReviewTitleV67">Planejamento de segurança</h2><p id="safetyReviewSubtitleV67"></p></div><button id="closeSafetyReviewV67" class="safety-close-v63" type="button">×</button></div>
          <div id="safetyReviewBodyV67" class="safety-review-body-v67"></div>
          <label class="safety-review-comment-v67">Parecer / orientações do DME<textarea id="safetyReviewCommentV67" placeholder="Registre aqui as orientações, principalmente quando solicitar ajustes ou reprovar."></textarea></label>
          <div class="safety-dialog-actions-v63"><button id="safetyAskAdjustV67" class="safety-secondary-v63" type="button">Solicitar ajustes</button><button id="safetyRejectV67" class="danger-button" type="button">Reprovar</button><button id="safetyApproveV67" class="safety-primary-v63" type="button">Aprovar</button></div>
        </div>
      </dialog>`);
  }

  function formatDate(v) {
    if (!v) return '—';
    try { return new Date(v).toLocaleString('pt-BR'); } catch (_) { return String(v); }
  }

  function payloadSummary(payload) {
    const v = payload?.visit || {};
    const p = payload?.plan || {};
    const evalRows = (v.evaluation || []).map((e) => `<div><strong>${esc(e.item)}</strong><br>${esc(e.status || '—')}${e.note ? ` — ${esc(e.note)}` : ''}</div>`).join('');
    const risks = (p.risks || []).map((r) => `<div><strong>${esc(r.name || 'Risco')}</strong><br>Prob.: ${esc(r.prob || '—')} • Grav.: ${esc(r.severity || '—')}<br>${esc(r.prevention || '')}${r.responsible ? `<br>Responsável: ${esc(r.responsible)}` : ''}</div>`).join('');
    const photos = (payload?.photos || []).map((ph) => `<img src="${ph.dataUrl}" alt="Foto do local">`).join('');
    return `
      <section class="safety-review-section-v67"><h4>Identificação</h4><div class="safety-review-grid-v67"><div><strong>Atividade</strong><br>${esc(v.activityName || p.activityName || '—')}</div><div><strong>Local</strong><br>${esc(v.location || p.location || '—')}</div><div><strong>Início</strong><br>${esc(v.activityStartDate || v.activityDate || p.activityStartDate || p.date || '—')} ${esc(v.activityStartTime || p.activityStartTime || '')}</div><div><strong>Término</strong><br>${esc(v.activityEndDate || p.activityEndDate || '—')} ${esc(v.activityEndTime || p.activityEndTime || '')}</div><div><strong>Seções</strong><br>${esc((v.sections || p.sections || []).join(', ') || '—')}</div><div><strong>Adultos na visita</strong><br>${esc((v.visitorsList || []).join(', ') || v.visitors || '—')}</div></div></section>
      <section class="safety-review-section-v67"><h4>Avaliação da visita técnica</h4><div class="safety-review-grid-v67">${evalRows || '<div>Sem itens registrados.</div>'}</div></section>
      <section class="safety-review-section-v67"><h4>Emergência e conclusão</h4><div class="safety-review-grid-v67"><div><strong>Hospital / UPA</strong><br>${esc(v.hospital || p.hospital || '—')}</div><div><strong>Ponto de encontro</strong><br>${esc(v.meetingPoint || p.meetingPoint || '—')}</div><div><strong>Evacuação</strong><br>${esc(v.evacuationRoute || '—')}</div><div><strong>Providências</strong><br>${esc(v.measures || '—')}</div></div></section>
      <section class="safety-review-section-v67"><h4>Plano de segurança — riscos</h4><div class="safety-review-grid-v67">${risks || '<div>Nenhum risco registrado.</div>'}</div></section>
      <section class="safety-review-section-v67"><h4>Responsáveis e comunicação</h4><div class="safety-review-grid-v67"><div><strong>Coordenador</strong><br>${esc(p.coordinator || '—')}</div><div><strong>Segurança</strong><br>${esc(p.safetyLead || '—')}</div><div><strong>Primeiros socorros</strong><br>${esc(p.firstAidLead || '—')}</div><div><strong>Transporte</strong><br>${esc(p.transport || '—')}</div><div><strong>Rota</strong><br>${esc(p.route || '—')}</div><div><strong>Outro meio de comunicação</strong><br>${esc(p.otherCommunication || '—')}</div></div></section>
      ${photos ? `<section class="safety-review-section-v67"><h4>Fotos da visita</h4><div class="safety-review-photos-v67">${photos}</div></section>` : ''}`;
  }

  function injectDmePanel() {
    if (!isDme || $('safetyDmePanelV67')) return;
    const panel = document.createElement('section');
    panel.id = 'safetyDmePanelV67';
    panel.className = 'safety-dme-panel-v67';
    panel.innerHTML = '<h3>📥 Análise do DME</h3><p>Planejamentos enviados pela chefia para aprovação.</p><div id="safetyDmeListV67" class="safety-dme-list-v67"></div>';
    $('safetyVisitsPanelV63')?.insertAdjacentElement('beforebegin', panel);
  }

  function renderDmePanel() {
    if (!isDme) return;
    injectDmePanel();
    const box = $('safetyDmeListV67');
    if (!box) return;
    const rows = approvals;
    box.innerHTML = rows.length ? rows.map((a) => {
      const [label, cls] = STATUS[a.status] || [a.status, ''];
      return `<article class="safety-dme-card-v67"><div><strong>${esc(a.activity_name || 'Planejamento')}</strong><span class="safety-pill-v63 ${cls}" style="float:right">${esc(label)}</span></div><div class="safety-dme-meta-v67"><span>Enviado por: ${esc(a.submitted_by_name || '—')}</span><span>${esc(formatDate(a.submitted_at))}</span></div>${a.dme_comment ? `<div class="safety-approval-note-v67"><strong>Parecer:</strong> ${esc(a.dme_comment)}</div>` : ''}<div class="safety-dme-actions-v67"><button type="button" class="safety-mini-btn-v63" data-review-v67="${esc(a.visit_id)}">Analisar</button>${a.status === 'aprovado' ? `<button type="button" class="safety-mini-btn-v63" data-print-v67="${esc(a.visit_id)}">Imprimir / salvar PDF</button>` : ''}</div></article>`;
    }).join('') : '<div class="safety-empty-v63">Nenhum planejamento enviado ao DME.</div>';
  }

  function setCardApproval(card, visitId) {
    const plan = pairedPlan(visitId);
    const approval = approvalFor(visitId);
    let status = card.querySelector('.safety-approval-status-v67');
    if (!status) {
      status = document.createElement('span');
      status.className = 'safety-pill-v63 safety-approval-status-v67';
      card.querySelector('.meta')?.insertAdjacentElement('afterend', status);
    }
    let label = !plan ? 'Plano pendente' : plan.status === 'pronto' ? 'Pronto para enviar ao DME' : 'Plano em rascunho';
    let cls = !plan || plan.status !== 'pronto' ? 'warn' : '';
    if (approval) [label, cls] = STATUS[approval.status] || [approval.status, ''];
    status.className = `safety-pill-v63 safety-approval-status-v67 ${cls}`;
    status.textContent = label;

    card.querySelector('.safety-approval-note-v67')?.remove();
    card.querySelectorAll('[data-send-dme-v67],[data-print-v67]').forEach((n) => n.remove());
    if (approval?.dme_comment) {
      const note = document.createElement('div');
      note.className = 'safety-approval-note-v67';
      note.innerHTML = `<strong>Retorno do DME:</strong> ${esc(approval.dme_comment)}`;
      card.querySelector('.safety-card-actions-v63')?.insertAdjacentElement('beforebegin', note);
    }
    const actions = card.querySelector('.safety-card-actions-v63');
    if (!actions) return;
    if ((!approval && plan?.status === 'pronto') || ['ajustes_solicitados','reprovado'].includes(approval?.status)) {
      actions.insertAdjacentHTML('beforeend', `<button type="button" class="safety-mini-btn-v63" data-send-dme-v67="${esc(visitId)}">${approval ? 'Reenviar ao DME' : 'Enviar ao DME'}</button>`);
    }
    if (approval?.status === 'aprovado') {
      actions.insertAdjacentHTML('beforeend', `<button type="button" class="safety-mini-btn-v63" data-print-v67="${esc(visitId)}">Imprimir / salvar PDF</button>`);
    }
  }

  function decorateCards() {
    if (decorating) return;
    const list = $('safetyVisitsListV63');
    if (!list) return;
    decorating = true;
    observer?.disconnect();
    try {
      list.querySelectorAll('.safety-card-v63').forEach((card) => {
        const edit = card.querySelector('[data-edit-visit]');
        if (edit?.dataset.editVisit) setCardApproval(card, edit.dataset.editVisit);
      });
    } finally {
      decorating = false;
      if (observer) observer.observe(list, { childList: true, subtree: true });
    }
  }

  async function sendToDme(visitId) {
    if (!navigator.onLine) return alert('O preenchimento pode ser feito offline, mas o envio ao DME precisa de conexão com a internet.');
    const store = readStore();
    const visit = store.visits.find((v) => v.id === visitId);
    const plan = store.plans.find((p) => p.baseVisitId === visitId);
    if (!visit || !plan) return alert('Conclua a visita técnica e o plano de segurança antes de enviar.');
    if (plan.status !== 'pronto') return alert('No plano de segurança, altere o status para “Pronto para a atividade” antes de enviar ao DME.');
    const photos = await loadPhotos(visitId);
    const payload = { schemaVersion: 67, visit, plan, photos };
    const existing = approvalFor(visitId);
    const now = new Date().toISOString();
    const values = {
      submitted_by: rt.state.user.id,
      submitted_by_name: rt.state.profile.nome_completo || '',
      activity_name: visit.activityName || plan.activityName || '',
      status: 'aguardando_dme',
      dme_comment: '',
      reviewed_by: null,
      reviewed_at: null,
      submitted_at: now,
      updated_at: now,
      document_payload: payload
    };
    let result;
    if (existing) result = await rt.client.from('safety_approval_test_v67').update(values).eq('visit_id', visitId);
    else result = await rt.client.from('safety_approval_test_v67').insert({ visit_id: visitId, ...values });
    if (result.error) return alert(`Não foi possível enviar ao DME: ${result.error.message}`);
    await refresh();
    alert('Planejamento enviado ao DME para análise.');
  }

  function openReview(visitId) {
    const a = approvalFor(visitId);
    if (!a) return;
    $('safetyReviewDialogV67').dataset.visitId = visitId;
    $('safetyReviewTitleV67').textContent = a.activity_name || 'Planejamento de segurança';
    $('safetyReviewSubtitleV67').textContent = `Enviado por ${a.submitted_by_name || '—'} em ${formatDate(a.submitted_at)}`;
    $('safetyReviewBodyV67').innerHTML = payloadSummary(a.document_payload || {});
    $('safetyReviewCommentV67').value = a.dme_comment || '';
    $('safetyReviewDialogV67').showModal();
  }

  async function reviewDecision(status) {
    const dlg = $('safetyReviewDialogV67');
    const visitId = dlg?.dataset.visitId;
    if (!visitId) return;
    const comment = $('safetyReviewCommentV67').value.trim();
    if (['ajustes_solicitados','reprovado'].includes(status) && !comment) return alert('Registre a orientação do DME antes de solicitar ajustes ou reprovar.');
    const { error } = await rt.client.from('safety_approval_test_v67').update({
      status,
      dme_comment: comment,
      reviewed_by: rt.state.user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('visit_id', visitId);
    if (error) return alert(`Não foi possível registrar a decisão: ${error.message}`);
    dlg.close();
    await refresh();
  }

  function printDocument(visitId) {
    const a = approvalFor(visitId);
    if (!a || a.status !== 'aprovado') return alert('A impressão só é liberada depois da aprovação do DME.');
    const payload = a.document_payload || {};
    const v = payload.visit || {};
    const p = payload.plan || {};
    const photos = (payload.photos || []).map((ph) => `<img src="${ph.dataUrl}" alt="Foto do local">`).join('');
    const evals = (v.evaluation || []).map((e) => `<tr><td>${esc(e.item)}</td><td>${esc(e.status || '—')}</td><td>${esc(e.note || '')}</td></tr>`).join('');
    const risks = (p.risks || []).map((r) => `<tr><td>${esc(r.name || '')}</td><td>${esc(r.prob || '')}</td><td>${esc(r.severity || '')}</td><td>${esc(r.prevention || '')}</td><td>${esc(r.responsible || '')}</td></tr>`).join('');
    const w = window.open('', '_blank');
    if (!w) return alert('O navegador bloqueou a janela de impressão. Permita pop-ups para o GEArPC Conecta.');
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(a.activity_name)} - Segurança</title><style>@page{size:A4;margin:12mm}body{font-family:Arial,sans-serif;color:#1f3447;font-size:11px;line-height:1.35}h1{font-size:18px;margin:0}h2{font-size:14px;border-bottom:1px solid #9fb0bf;padding-bottom:4px;margin-top:18px}table{width:100%;border-collapse:collapse;margin:7px 0}td,th{border:1px solid #bdc9d3;padding:5px;vertical-align:top}th{background:#eef3f7;text-align:left}.head{display:flex;align-items:center;gap:12px;border-bottom:2px solid #17324d;padding-bottom:10px}.head img{width:58px;height:58px;object-fit:contain}.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.box{border:1px solid #c9d3dc;border-radius:5px;padding:7px;break-inside:avoid}.approved{border:2px solid #3f7d50;background:#eef8f0;padding:10px;border-radius:7px;margin:14px 0;break-inside:avoid}.photos{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.photos img{width:100%;max-height:220px;object-fit:cover;break-inside:avoid}section{break-inside:auto}.no-break{break-inside:avoid}.footer{margin-top:18px;border-top:1px solid #aaa;padding-top:7px;font-size:9px;color:#657383}@media print{button{display:none}}</style></head><body><div class="head"><img src="logo-grupo.jpeg"><div><h1>Relatório de Visita Técnica e Plano de Segurança</h1><div>Grupo Escoteiro do Ar Paulo Carzino — GEArPC</div></div></div><div class="approved"><strong>APROVADO PELO DIRETOR DE MÉTODOS EDUCATIVOS</strong><br>Data da análise: ${esc(formatDate(a.reviewed_at))}${a.dme_comment ? `<br>Parecer: ${esc(a.dme_comment)}` : ''}</div><h2>1. Identificação</h2><div class="grid"><div class="box"><strong>Atividade</strong><br>${esc(v.activityName || p.activityName || '—')}</div><div class="box"><strong>Local</strong><br>${esc(v.location || p.location || '—')}<br>${esc(v.address || p.address || '')}</div><div class="box"><strong>Início</strong><br>${esc(v.activityStartDate || v.activityDate || p.activityStartDate || p.date || '—')} ${esc(v.activityStartTime || p.activityStartTime || '')}</div><div class="box"><strong>Término</strong><br>${esc(v.activityEndDate || p.activityEndDate || '—')} ${esc(v.activityEndTime || p.activityEndTime || '')}</div><div class="box"><strong>Seções participantes</strong><br>${esc((v.sections || p.sections || []).join(', ') || '—')}</div><div class="box"><strong>Adultos na visita</strong><br>${esc((v.visitorsList || []).join(', ') || v.visitors || '—')}</div></div><h2>2. Visita técnica</h2><table><thead><tr><th>Item</th><th>Situação</th><th>Observação</th></tr></thead><tbody>${evals}</tbody></table><div class="grid"><div class="box"><strong>Hospital / UPA</strong><br>${esc(v.hospital || '—')}<br>${esc(v.hospitalAddress || '')}</div><div class="box"><strong>Evacuação</strong><br>${esc(v.evacuationRoute || '—')}</div><div class="box"><strong>Providências / observações</strong><br>${esc(v.measures || '—')}</div><div class="box"><strong>Mapa</strong><br>${esc(v.mapsLink || '—')}</div></div><h2>3. Plano de segurança</h2><div class="grid"><div class="box"><strong>Coordenador</strong><br>${esc(p.coordinator || '—')}</div><div class="box"><strong>Responsável pela segurança</strong><br>${esc(p.safetyLead || '—')}</div><div class="box"><strong>Primeiros socorros</strong><br>${esc(p.firstAidLead || '—')}</div><div class="box"><strong>Transporte / rota</strong><br>${esc(p.transport || '—')}<br>${esc(p.route || '')}</div></div><h2>4. Análise de riscos</h2><table><thead><tr><th>Risco</th><th>Prob.</th><th>Grav.</th><th>Prevenção</th><th>Responsável</th></tr></thead><tbody>${risks}</tbody></table><h2>5. Procedimentos de emergência</h2><div class="grid">${Object.entries(p.emergency || {}).map(([k,val]) => `<div class="box"><strong>${esc(k)}</strong><br>${esc(val || '—')}</div>`).join('')}</div>${photos ? `<h2>6. Fotos da visita</h2><div class="photos">${photos}</div>` : ''}<div class="footer">Documento correspondente à versão aprovada pelo DME no GEArPC Conecta. Manter uma cópia disponível durante a atividade. A opção de impressão do navegador também permite salvar este documento em PDF para posterior anexação no Paxtu.</div><script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`);
    w.document.close();
  }

  async function refresh() {
    try { await loadApprovals(); } catch (e) { console.warn('GEArPC safety approval v67', e); }
    decorateCards();
    renderDmePanel();
  }

  function wire() {
    document.addEventListener('click', (event) => {
      const send = event.target.closest('[data-send-dme-v67]');
      if (send) { event.preventDefault(); return void sendToDme(send.dataset.sendDmeV67); }
      const review = event.target.closest('[data-review-v67]');
      if (review) { event.preventDefault(); return openReview(review.dataset.reviewV67); }
      const print = event.target.closest('[data-print-v67]');
      if (print) { event.preventDefault(); return printDocument(print.dataset.printV67); }
      if (event.target.closest('#safetyButtonV63')) window.setTimeout(refresh, 250);
    }, true);
    $('closeSafetyReviewV67')?.addEventListener('click', () => $('safetyReviewDialogV67')?.close());
    $('safetyAskAdjustV67')?.addEventListener('click', () => reviewDecision('ajustes_solicitados'));
    $('safetyRejectV67')?.addEventListener('click', () => reviewDecision('reprovado'));
    $('safetyApproveV67')?.addEventListener('click', () => reviewDecision('aprovado'));
    window.addEventListener('online', refresh);
  }

  function installObserver() {
    const list = $('safetyVisitsListV63');
    if (!list) return;
    observer = new MutationObserver(() => window.setTimeout(decorateCards, 0));
    observer.observe(list, { childList: true, subtree: true });
  }

  async function boot() {
    rt = await waitReady();
    if (!rt) return;
    isDme = await detectDme();
    injectStyles();
    injectReviewDialog();
    injectDmePanel();
    wire();
    installObserver();
    const banner = document.querySelector('.safety-test-banner-v63');
    if (banner && !banner.dataset.approvalV67) {
      banner.dataset.approvalV67 = '1';
      banner.insertAdjacentHTML('beforeend', '<div style="margin-top:6px">📤 O preenchimento pode ser feito offline. O envio ao DME, a análise e a atualização do retorno precisam de internet.</div>');
    }
    await refresh();
  }

  void boot();
})();