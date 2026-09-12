(() => {
  'use strict';

  if (window.GEARPC_PURCHASES_MODULE_LOADED) return;
  window.GEARPC_PURCHASES_MODULE_LOADED = true;

  const cfg = window.GEARPC_CONFIG || {};
  if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) return;

  const $ = (id) => document.getElementById(id);
  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);

  const state = {
    user: null,
    profile: null,
    sections: [],
    allowedSectionIds: [],
    requests: [],
    deliveries: [],
    history: [],
    resultRequestId: null,
    deliveryRequestId: null,
    activeTab: 'requests'
  };

  const css = document.createElement('style');
  css.textContent = `
    .purchase-icon{background:linear-gradient(135deg,#fff3d6,#ffe1a3)}
    .purchase-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}
    .purchase-tab{border:1px solid #d7e1eb;background:#fff;color:#33516d;border-radius:12px;padding:10px 8px;font-weight:800;cursor:pointer}
    .purchase-tab.active{background:#0a376c;color:#fff;border-color:#0a376c}
    .purchase-panel.hidden{display:none!important}
    .purchase-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:12px 0}
    .purchase-list{display:grid;gap:12px;padding-bottom:24px}
    .purchase-card{background:#fff;border:1px solid #dde5ee;border-radius:18px;padding:16px;box-shadow:0 8px 24px rgba(17,50,82,.07)}
    .purchase-card-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
    .purchase-card h3{margin:7px 0 6px;font-size:1.06rem;color:#17324d}
    .purchase-section-chip{display:inline-flex;border-radius:999px;padding:5px 9px;font-size:.76rem;font-weight:800;color:#0a376c;background:#e9f2fb}
    .purchase-status{flex:0 0 auto;border-radius:999px;padding:5px 9px;font-size:.72rem;font-weight:800;background:#fff6d8;color:#7a5700}
    .purchase-status.not-bought{background:#fff0f0;color:#8c2e2e}
    .purchase-status.bought{background:#e7f5ea;color:#176a31}
    .purchase-status.delivered{background:#e9f1fb;color:#26588a}
    .purchase-meta{display:flex;flex-wrap:wrap;gap:6px 12px;color:#627488;font-size:.82rem;margin-top:8px}
    .purchase-cycle{margin-top:10px;border-radius:12px;padding:9px 11px;background:#f4f8fc;color:#36526d;font-size:.82rem;line-height:1.4}
    .purchase-detail{margin-top:10px;padding-top:10px;border-top:1px solid #edf1f5;color:#41566b;font-size:.88rem;line-height:1.45}
    .purchase-pending-reason{margin-top:10px;border-left:4px solid #d98b35;background:#fff8ef;padding:10px 12px;border-radius:10px;color:#63431d;font-size:.87rem;line-height:1.45}
    .purchase-delivery-info{margin-top:10px;border-left:4px solid #2e6da4;background:#eef6ff;padding:10px 12px;border-radius:10px;color:#31516f;font-size:.87rem;line-height:1.45}
    .purchase-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-top:12px}
    .purchase-action{border:0;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer}
    .purchase-action.bought{background:#e4f5e8;color:#176a31}.purchase-action.not-bought{background:#fff0e5;color:#8b4c12}.purchase-action.deliver{background:#e9f1fb;color:#26588a}
    .purchase-empty{background:#fff;border:1px dashed #cbd6e1;border-radius:16px;padding:22px;text-align:center;color:#65778a}
    .purchase-count{margin:8px 0 14px;color:#5b6f83;font-size:.88rem}.purchase-count strong{color:#153653;font-size:1.05rem}
    .purchase-cycle-banner{margin:12px 0 0;border-radius:14px;padding:11px 13px;background:#eaf3fb;color:#244b70;font-size:.88rem;line-height:1.45}
    .purchase-result-summary{border-radius:12px;background:#f4f8fc;padding:11px 12px;margin:4px 0 10px;color:#3b536b;font-size:.9rem}
    .purchase-report-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 16px}
    .purchase-form-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(120px,.5fr);gap:12px}
    .purchase-history-filters{display:grid;grid-template-columns:1.1fr 1fr 1fr 1.3fr;gap:10px;align-items:end}
    @media(max-width:700px){.purchase-tabs{grid-template-columns:1fr}.purchase-card-top{flex-direction:column}.purchase-form-grid,.purchase-history-filters{grid-template-columns:1fr}.purchase-actions{justify-content:stretch}.purchase-actions button{flex:1 1 145px}}
  `;
  document.head.appendChild(css);

  function injectUi() {
    const modules = document.querySelector('.launch-modules');
    if (modules && !$('purchaseRequestsButton')) {
      const button = document.createElement('button');
      button.id = 'purchaseRequestsButton';
      button.className = 'launch-module hidden';
      button.type = 'button';
      button.innerHTML = `<span class="launch-module-icon purchase-icon" aria-hidden="true">🛒</span><span class="launch-module-copy"><strong>Compras da Loja Escoteira</strong><small>Solicitações, entregas e histórico dos materiais.</small></span><span class="launch-module-arrow" aria-hidden="true">›</span>`;
      const accessButton = $('accessButton');
      if (accessButton) modules.insertBefore(button, accessButton); else modules.appendChild(button);
    }

    const appShell = document.querySelector('.app-shell');
    if (appShell && !$('purchaseRequestsView')) {
      const section = document.createElement('section');
      section.id = 'purchaseRequestsView';
      section.className = 'members-view hidden';
      section.innerHTML = `
        <header class="subpage-header">
          <button id="purchaseBackButton" class="back-button" type="button" aria-label="Voltar">←</button>
          <div class="subpage-brand"><img src="logo-grupo.jpeg" alt="" /><div><span>GEArPC Conecta</span><strong>Compras</strong></div></div>
          <button id="purchaseLogoutButton" class="secondary-button" type="button">Sair</button>
        </header>

        <section class="members-hero">
          <div><div class="eyebrow dark">LOJA ESCOTEIRA</div><h2>Controle de compras</h2><p>O pedido passa por solicitação, compra, entrega e depois fica registrado no histórico.</p><div id="purchaseCycleBanner" class="purchase-cycle-banner"></div></div>
          <button id="newPurchaseRequestButton" class="new-member-button" type="button">＋ Nova solicitação</button>
        </section>

        <nav class="purchase-tabs" aria-label="Etapas das compras">
          <button type="button" class="purchase-tab active" data-purchase-tab="requests">Solicitações</button>
          <button type="button" class="purchase-tab" data-purchase-tab="deliveries">Entregas</button>
          <button type="button" class="purchase-tab" data-purchase-tab="history">Consultas / histórico</button>
        </nav>

        <section id="purchaseRequestsPanel" class="purchase-panel">
          <div class="purchase-toolbar"><label class="filter-field"><span>Seção</span><select id="purchaseSectionFilter"><option value="">Todas</option></select></label><button id="purchaseRefreshButton" class="secondary-action-button" type="button">↻ Atualizar</button></div>
          <div id="purchaseRoleNote" class="role-note"></div>
          <div class="purchase-count"><strong id="purchaseRequestCount">0</strong> pedido(s) aguardando compra</div>
          <section id="purchaseRequestList" class="purchase-list" aria-live="polite"></section>
        </section>

        <section id="purchaseDeliveriesPanel" class="purchase-panel hidden">
          <div class="purchase-toolbar"><label class="filter-field"><span>Seção</span><select id="deliverySectionFilter"><option value="">Todas</option></select></label><button id="deliveryRefreshButton" class="secondary-action-button" type="button">↻ Atualizar</button></div>
          <div class="role-note">Aqui ficam somente os itens já comprados e ainda não entregues.</div>
          <div class="purchase-count"><strong id="purchaseDeliveryCount">0</strong> item(ns) aguardando entrega</div>
          <section id="purchaseDeliveryList" class="purchase-list" aria-live="polite"></section>
        </section>

        <section id="purchaseHistoryPanel" class="purchase-panel hidden">
          <div class="purchase-history-filters">
            <label class="filter-field"><span>Seção</span><select id="historySectionFilter"><option value="">Todas</option></select></label>
            <label class="filter-field"><span>De</span><input id="historyDateFrom" type="date" /></label>
            <label class="filter-field"><span>Até</span><input id="historyDateTo" type="date" /></label>
            <label class="search-field"><span>🔎</span><input id="historySearch" type="search" placeholder="Item, solicitante ou recebedor" /></label>
          </div>
          <div class="purchase-report-actions"><button id="downloadPurchaseReportButton" class="secondary-action-button" type="button">⬇ Baixar relatório CSV</button><button id="clearPurchaseHistoryButton" class="danger-button hidden" type="button">Apagar histórico exibido</button></div>
          <div class="purchase-count"><strong id="purchaseHistoryCount">0</strong> entrega(s) encontrada(s)</div>
          <section id="purchaseHistoryList" class="purchase-list" aria-live="polite"></section>
        </section>

        <p id="purchaseMessage" class="members-message" role="status"></p>
      `;
      appShell.appendChild(section);
    }

    if (!$('purchaseRequestDialog')) {
      const dialog = document.createElement('dialog');
      dialog.id = 'purchaseRequestDialog';
      dialog.className = 'member-dialog';
      dialog.innerHTML = `<form id="purchaseRequestForm" method="dialog" class="member-form"><div class="dialog-title-row"><div><div class="eyebrow dark">LOJA ESCOTEIRA</div><h2>Nova solicitação</h2></div><button id="closePurchaseRequestDialog" type="button" class="dialog-close">×</button></div><div id="purchaseDialogCycle" class="purchase-result-summary"></div><label>Seção / origem<select id="purchaseRequestSection" required></select></label><div class="purchase-form-grid"><label>Item<input id="purchaseRequestItem" type="text" maxlength="180" required /></label><label>Quantidade<input id="purchaseRequestQuantity" type="number" min="1" max="999" value="1" required /></label></div><label>Tamanho, modelo ou código<input id="purchaseRequestDetails" type="text" maxlength="240" /></label><label>Observações<textarea id="purchaseRequestObservation" rows="3" maxlength="700"></textarea></label><p id="purchaseRequestFormMessage" class="form-message"></p><div class="dialog-actions"><button id="cancelPurchaseRequestButton" type="button" class="cancel-button">Cancelar</button><button id="savePurchaseRequestButton" type="submit" class="save-button">Enviar solicitação</button></div></form>`;
      document.body.appendChild(dialog);
    }

    if (!$('purchaseNotBoughtDialog')) {
      const dialog = document.createElement('dialog');
      dialog.id = 'purchaseNotBoughtDialog';
      dialog.className = 'member-dialog';
      dialog.innerHTML = `<form id="purchaseNotBoughtForm" method="dialog" class="member-form"><div class="dialog-title-row"><div><div class="eyebrow dark">RESULTADO DA COMPRA</div><h2>Item não comprado</h2></div><button id="closePurchaseNotBoughtDialog" type="button" class="dialog-close">×</button></div><div id="purchaseNotBoughtSummary" class="purchase-result-summary"></div><label>Motivo<textarea id="purchaseNotBoughtReason" rows="4" maxlength="700" required placeholder="Ex.: Produto em falta na loja"></textarea></label><p id="purchaseNotBoughtMessage" class="form-message"></p><div class="dialog-actions"><button id="cancelPurchaseNotBoughtButton" type="button" class="cancel-button">Cancelar</button><button id="savePurchaseNotBoughtButton" type="submit" class="save-button">Registrar e manter pendente</button></div></form>`;
      document.body.appendChild(dialog);
    }

    if (!$('purchaseDeliveryDialog')) {
      const dialog = document.createElement('dialog');
      dialog.id = 'purchaseDeliveryDialog';
      dialog.className = 'member-dialog';
      dialog.innerHTML = `<form id="purchaseDeliveryForm" method="dialog" class="member-form"><div class="dialog-title-row"><div><div class="eyebrow dark">ENTREGA</div><h2>Registrar entrega</h2></div><button id="closePurchaseDeliveryDialog" type="button" class="dialog-close">×</button></div><div id="purchaseDeliverySummary" class="purchase-result-summary"></div><label>Entregue para<input id="purchaseDeliveredTo" type="text" maxlength="180" required placeholder="Nome de quem recebeu" /></label><label>Data e hora da entrega<input id="purchaseDeliveredAt" type="datetime-local" required /></label><label>Observação da entrega<textarea id="purchaseDeliveryObservation" rows="3" maxlength="700" placeholder="Opcional"></textarea></label><p id="purchaseDeliveryMessage" class="form-message"></p><div class="dialog-actions"><button id="cancelPurchaseDeliveryButton" type="button" class="cancel-button">Cancelar</button><button id="savePurchaseDeliveryButton" type="submit" class="save-button">Confirmar entrega</button></div></form>`;
      document.body.appendChild(dialog);
    }
  }

  const escapeHtml = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const isInternal = (p) => !!p?.ativo && (p.tipo === 'administrador' || p.tipo === 'chefia' || p.acesso_geral_consulta === true);
  const isManager = (p) => p?.tipo === 'administrador' || p?.acesso_geral_consulta === true;
  const isAdmin = (p) => p?.tipo === 'administrador';
  const pad2 = (v) => String(v).padStart(2,'0');

  function saoPauloDateParts(value = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value instanceof Date ? value : new Date(value));
    const get = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
    return {year:get('year'),month:get('month'),day:get('day')};
  }

  function shiftMonth(year, month, delta) {
    const index = year * 12 + month - 1 + delta;
    return {year:Math.floor(index/12),month:((index%12)+12)%12+1};
  }

  function cycleFor(value = new Date()) {
    const p = saoPauloDateParts(value);
    let start, end;
    if (p.day <= 10) { start = shiftMonth(p.year,p.month,-1); end = {year:p.year,month:p.month}; }
    else { start = {year:p.year,month:p.month}; end = shiftMonth(p.year,p.month,1); }
    return {label:`11/${pad2(start.month)}/${start.year} a 10/${pad2(end.month)}/${end.year}`,purchaseLabel:`10/${pad2(end.month)}/${end.year}`};
  }

  function formatDate(value) {
    if (!value) return '';
    const d = new Date(value); if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}).format(d);
  }

  function toDatetimeLocal(date = new Date()) {
    const fmt = new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
    return fmt.format(date).replace(' ','T');
  }

  function sectionName(row) {
    if (!row.secao_id) return 'Diretoria';
    return row.secoes?.nome || state.sections.find((s) => Number(s.id) === Number(row.secao_id))?.nome || 'Seção';
  }

  function updateCycleLabels() {
    const c = cycleFor(new Date());
    if ($('purchaseCycleBanner')) $('purchaseCycleBanner').innerHTML = `<strong>Ciclo atual:</strong> ${c.label} • compra prevista em <strong>${c.purchaseLabel}</strong>.`;
    if ($('purchaseDialogCycle')) $('purchaseDialogCycle').innerHTML = `Este pedido entra no ciclo <strong>${c.label}</strong>, com compra prevista para <strong>${c.purchaseLabel}</strong>.`;
  }

  function hideKnownViews() {
    ['loginView','dashboardView','membersView','chiefsView','attendanceView','programmingView','programEditorView','accessView','purchaseRequestsView'].forEach((id)=>$(id)?.classList.add('hidden'));
  }

  function showDashboard(){ $('purchaseRequestsView')?.classList.add('hidden'); $('dashboardView')?.classList.remove('hidden'); }

  async function loadContext() {
    const {data:sessionData} = await client.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) { $('purchaseRequestsButton')?.classList.add('hidden'); return false; }
    const {data:profile,error} = await client.from('perfis_usuarios').select('nome_completo,tipo,ativo,acesso_geral_consulta,chefe_id').eq('user_id',user.id).single();
    if (error || !isInternal(profile)) { $('purchaseRequestsButton')?.classList.add('hidden'); return false; }
    state.user = user; state.profile = profile; $('purchaseRequestsButton')?.classList.remove('hidden');
    const {data:sections} = await client.from('secoes').select('id,nome,ativo').eq('ativo',true).order('id'); state.sections = sections || [];
    if (isManager(profile)) state.allowedSectionIds = state.sections.map((s)=>Number(s.id));
    else if (profile.chefe_id) { const {data:links} = await client.from('chefe_secoes').select('secao_id').eq('chefe_id',profile.chefe_id); state.allowedSectionIds=(links||[]).map((r)=>Number(r.secao_id)); }
    else state.allowedSectionIds=[];
    fillSectionSelects(); updateCycleLabels(); $('clearPurchaseHistoryButton')?.classList.toggle('hidden',!isAdmin(profile));
    return true;
  }

  function fillSectionSelects() {
    const allOptions = '<option value="">Todas</option><option value="diretoria">Diretoria</option>' + state.sections.map((s)=>`<option value="${s.id}">${escapeHtml(s.nome)}</option>`).join('');
    ['purchaseSectionFilter','deliverySectionFilter','historySectionFilter'].forEach((id)=>{ const el=$(id); if(el){const old=el.value; el.innerHTML=allOptions; if([...el.options].some(o=>o.value===old)) el.value=old;} });
    const requestSelect = $('purchaseRequestSection');
    if (requestSelect) {
      const opts=[]; if(isManager(state.profile)) opts.push('<option value="diretoria">Diretoria</option>');
      state.sections.filter((s)=>state.allowedSectionIds.includes(Number(s.id))).forEach((s)=>opts.push(`<option value="${s.id}">${escapeHtml(s.nome)}</option>`));
      requestSelect.innerHTML=opts.join(''); requestSelect.disabled=opts.length<=1;
    }
  }

  async function loadAll() {
    const select = 'id,user_id,solicitante_nome,secao_id,item,quantidade,detalhes,observacao,status,motivo_nao_compra,ultima_tentativa_em,comprado_em,resultado_atualizado_por_nome,entregue_em,entregue_para,entrega_observacao,entregue_por_nome,criado_em,secoes(nome)';
    const [r,d,h] = await Promise.all([
      client.from('solicitacoes_compras').select(select).in('status',['solicitado','nao_comprado']).order('criado_em',{ascending:true}),
      client.from('solicitacoes_compras').select(select).eq('status','comprado').order('comprado_em',{ascending:true}),
      client.from('solicitacoes_compras').select(select).eq('status','entregue').order('entregue_em',{ascending:false})
    ]);
    const firstError = r.error || d.error || h.error;
    if (firstError) { $('purchaseMessage').textContent=`Não foi possível carregar as compras: ${firstError.message}`; return; }
    state.requests=r.data||[]; state.deliveries=d.data||[]; state.history=h.data||[]; $('purchaseMessage').textContent=''; renderAll();
  }

  function sectionMatches(row, value) { if(!value) return true; if(value==='diretoria') return !row.secao_id; return Number(row.secao_id)===Number(value); }
  function detailHtml(row){ const bits=[]; if(row.detalhes) bits.push(`<div><strong>Detalhes:</strong> ${escapeHtml(row.detalhes)}</div>`); if(row.observacao) bits.push(`<div><strong>Observação:</strong> ${escapeHtml(row.observacao)}</div>`); return bits.length?`<div class="purchase-detail">${bits.join('')}</div>`:''; }

  function renderRequests() {
    const filter=$('purchaseSectionFilter')?.value||''; const rows=state.requests.filter((r)=>sectionMatches(r,filter)); $('purchaseRequestCount').textContent=rows.length;
    $('purchaseRequestList').innerHTML = rows.length ? rows.map((row)=>{
      const canDelete=row.user_id===state.user?.id||isAdmin(state.profile); const c=cycleFor(row.criado_em);
      const pending=row.status==='nao_comprado'?`<div class="purchase-pending-reason"><strong>Não comprado:</strong> ${escapeHtml(row.motivo_nao_compra||'')}<br><small>${escapeHtml(formatDate(row.ultima_tentativa_em))}</small><br><strong>Permanece pendente.</strong></div>`:'';
      const manager=isManager(state.profile)?`<button type="button" class="purchase-action bought purchase-bought-button" data-id="${row.id}">✓ Compra realizada</button><button type="button" class="purchase-action not-bought purchase-not-bought-button" data-id="${row.id}">Não comprado</button>`:'';
      return `<article class="purchase-card"><div class="purchase-card-top"><div><span class="purchase-section-chip">⚜ ${escapeHtml(sectionName(row))}</span><h3>${escapeHtml(row.item)}</h3></div><span class="purchase-status ${row.status==='nao_comprado'?'not-bought':''}">${row.status==='nao_comprado'?'Não comprado':'Aguardando compra'}</span></div><div class="purchase-meta"><span><strong>Qtd.:</strong> ${row.quantidade}</span><span><strong>Solicitante:</strong> ${escapeHtml(row.solicitante_nome)}</span><span><strong>Pedido:</strong> ${escapeHtml(formatDate(row.criado_em))}</span></div><div class="purchase-cycle"><strong>Ciclo:</strong> ${c.label}</div>${detailHtml(row)}${pending}<div class="purchase-actions">${manager}${canDelete?`<button type="button" class="danger-button purchase-delete-button" data-id="${row.id}">Apagar solicitação</button>`:''}</div></article>`;
    }).join('') : '<div class="purchase-empty">Nenhum pedido aguardando compra neste filtro.</div>';
  }

  function renderDeliveries() {
    const filter=$('deliverySectionFilter')?.value||''; const rows=state.deliveries.filter((r)=>sectionMatches(r,filter)); $('purchaseDeliveryCount').textContent=rows.length;
    $('purchaseDeliveryList').innerHTML = rows.length ? rows.map((row)=>`<article class="purchase-card"><div class="purchase-card-top"><div><span class="purchase-section-chip">⚜ ${escapeHtml(sectionName(row))}</span><h3>${escapeHtml(row.item)}</h3></div><span class="purchase-status bought">Comprado</span></div><div class="purchase-meta"><span><strong>Qtd.:</strong> ${row.quantidade}</span><span><strong>Solicitante:</strong> ${escapeHtml(row.solicitante_nome)}</span><span><strong>Comprado:</strong> ${escapeHtml(formatDate(row.comprado_em))}</span></div>${detailHtml(row)}${isManager(state.profile)?`<div class="purchase-actions"><button type="button" class="purchase-action deliver purchase-deliver-button" data-id="${row.id}">Registrar entrega</button></div>`:''}</article>`).join('') : '<div class="purchase-empty">Nenhum item aguardando entrega.</div>';
  }

  function filteredHistory() {
    const section=$('historySectionFilter')?.value||''; const from=$('historyDateFrom')?.value||''; const to=$('historyDateTo')?.value||''; const q=($('historySearch')?.value||'').trim().toLowerCase();
    return state.history.filter((row)=>{ if(!sectionMatches(row,section)) return false; const day=row.entregue_em?new Date(row.entregue_em).toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}):''; if(from&&day<from) return false; if(to&&day>to) return false; if(q){const hay=[row.item,row.solicitante_nome,row.entregue_para,row.secoes?.nome,row.detalhes].join(' ').toLowerCase(); if(!hay.includes(q)) return false;} return true; });
  }

  function renderHistory() {
    const rows=filteredHistory(); $('purchaseHistoryCount').textContent=rows.length;
    $('purchaseHistoryList').innerHTML = rows.length ? rows.map((row)=>`<article class="purchase-card"><div class="purchase-card-top"><div><span class="purchase-section-chip">⚜ ${escapeHtml(sectionName(row))}</span><h3>${escapeHtml(row.item)}</h3></div><span class="purchase-status delivered">Entregue</span></div><div class="purchase-meta"><span><strong>Qtd.:</strong> ${row.quantidade}</span><span><strong>Solicitante:</strong> ${escapeHtml(row.solicitante_nome)}</span><span><strong>Comprado:</strong> ${escapeHtml(formatDate(row.comprado_em))}</span></div><div class="purchase-delivery-info"><strong>Entregue para:</strong> ${escapeHtml(row.entregue_para)}<br><strong>Data:</strong> ${escapeHtml(formatDate(row.entregue_em))}${row.entregue_por_nome?`<br><strong>Registrado por:</strong> ${escapeHtml(row.entregue_por_nome)}`:''}${row.entrega_observacao?`<br><strong>Observação:</strong> ${escapeHtml(row.entrega_observacao)}`:''}</div>${detailHtml(row)}${isAdmin(state.profile)?`<div class="purchase-actions"><button type="button" class="danger-button purchase-delete-history-button" data-id="${row.id}">Apagar registro</button></div>`:''}</article>`).join('') : '<div class="purchase-empty">Nenhuma entrega encontrada nos filtros.</div>';
  }

  function renderAll(){ renderRequests(); renderDeliveries(); renderHistory(); }

  function switchTab(tab) {
    state.activeTab=tab; document.querySelectorAll('.purchase-tab').forEach((b)=>b.classList.toggle('active',b.dataset.purchaseTab===tab));
    $('purchaseRequestsPanel').classList.toggle('hidden',tab!=='requests'); $('purchaseDeliveriesPanel').classList.toggle('hidden',tab!=='deliveries'); $('purchaseHistoryPanel').classList.toggle('hidden',tab!=='history');
    $('newPurchaseRequestButton').classList.toggle('hidden',tab!=='requests');
  }

  async function openView(){ if(!await loadContext()) return; hideKnownViews(); $('purchaseRequestsView').classList.remove('hidden'); $('purchaseRoleNote').textContent=isManager(state.profile)?'Marque o resultado da compra. Itens comprados seguem para a aba Entregas; itens não comprados permanecem aqui com a justificativa.':'Faça a solicitação e acompanhe o andamento. Itens não comprados permanecem pendentes para nova tentativa.'; switchTab('requests'); await loadAll(); }

  function openRequestDialog(){ if(!$('purchaseRequestSection')?.options.length){$('purchaseMessage').textContent='Seu perfil não possui seção disponível para solicitar.';return;} $('purchaseRequestForm').reset(); $('purchaseRequestQuantity').value='1'; fillSectionSelects(); updateCycleLabels(); $('purchaseRequestFormMessage').textContent=''; $('purchaseRequestDialog').showModal(); }
  const closeRequestDialog=()=> $('purchaseRequestDialog')?.close();

  async function saveRequest(e){ e.preventDefault(); const section=$('purchaseRequestSection').value; const item=$('purchaseRequestItem').value.trim(); const quantidade=Number($('purchaseRequestQuantity').value); if(!section||!item||!Number.isInteger(quantidade)||quantidade<1){$('purchaseRequestFormMessage').textContent='Preencha seção, item e quantidade.';return;} const secao_id=section==='diretoria'?null:Number(section); const {error}=await client.from('solicitacoes_compras').insert({user_id:state.user.id,solicitante_nome:state.profile.nome_completo,secao_id,item,quantidade,detalhes:$('purchaseRequestDetails').value.trim()||null,observacao:$('purchaseRequestObservation').value.trim()||null,status:'solicitado'}); if(error){$('purchaseRequestFormMessage').textContent=error.message;return;} closeRequestDialog(); await loadAll(); }

  async function markPurchased(id){ if(!isManager(state.profile)) return; const row=state.requests.find((r)=>Number(r.id)===Number(id)); if(!row||!confirm(`Confirmar compra de ${row.quantidade} × “${row.item}”? O item irá para a aba Entregas.`)) return; const now=new Date().toISOString(); const {error}=await client.from('solicitacoes_compras').update({status:'comprado',motivo_nao_compra:null,ultima_tentativa_em:now,comprado_em:now,resultado_atualizado_por:state.user.id,resultado_atualizado_por_nome:state.profile.nome_completo,atualizado_em:now}).eq('id',row.id); if(error){$('purchaseMessage').textContent=error.message;return;} await loadAll(); }

  function openNotBought(id){ const row=state.requests.find((r)=>Number(r.id)===Number(id)); if(!row||!isManager(state.profile)) return; state.resultRequestId=row.id; $('purchaseNotBoughtSummary').innerHTML=`<strong>${escapeHtml(sectionName(row))}</strong> • ${row.quantidade} × ${escapeHtml(row.item)}`; $('purchaseNotBoughtReason').value=row.motivo_nao_compra||''; $('purchaseNotBoughtMessage').textContent=''; $('purchaseNotBoughtDialog').showModal(); }
  function closeNotBought(){ state.resultRequestId=null; $('purchaseNotBoughtDialog')?.close(); }
  async function saveNotBought(e){ e.preventDefault(); const reason=$('purchaseNotBoughtReason').value.trim(); if(!reason){$('purchaseNotBoughtMessage').textContent='Informe o motivo.';return;} const now=new Date().toISOString(); const {error}=await client.from('solicitacoes_compras').update({status:'nao_comprado',motivo_nao_compra:reason,ultima_tentativa_em:now,comprado_em:null,resultado_atualizado_por:state.user.id,resultado_atualizado_por_nome:state.profile.nome_completo,atualizado_em:now}).eq('id',state.resultRequestId); if(error){$('purchaseNotBoughtMessage').textContent=error.message;return;} closeNotBought(); await loadAll(); }

  function openDelivery(id){ const row=state.deliveries.find((r)=>Number(r.id)===Number(id)); if(!row||!isManager(state.profile)) return; state.deliveryRequestId=row.id; $('purchaseDeliverySummary').innerHTML=`<strong>${escapeHtml(sectionName(row))}</strong> • ${row.quantidade} × ${escapeHtml(row.item)}`; $('purchaseDeliveredTo').value=''; $('purchaseDeliveredAt').value=toDatetimeLocal(new Date()); $('purchaseDeliveryObservation').value=''; $('purchaseDeliveryMessage').textContent=''; $('purchaseDeliveryDialog').showModal(); }
  function closeDelivery(){ state.deliveryRequestId=null; $('purchaseDeliveryDialog')?.close(); }
  async function saveDelivery(e){ e.preventDefault(); const to=$('purchaseDeliveredTo').value.trim(); const local=$('purchaseDeliveredAt').value; if(!to||!local){$('purchaseDeliveryMessage').textContent='Informe quem recebeu e a data/hora da entrega.';return;} const deliveredAt=new Date(local).toISOString(); const now=new Date().toISOString(); const {error}=await client.from('solicitacoes_compras').update({status:'entregue',entregue_para:to,entregue_em:deliveredAt,entrega_observacao:$('purchaseDeliveryObservation').value.trim()||null,entregue_por:state.user.id,entregue_por_nome:state.profile.nome_completo,atualizado_em:now}).eq('id',state.deliveryRequestId); if(error){$('purchaseDeliveryMessage').textContent=error.message;return;} closeDelivery(); await loadAll(); switchTab('history'); }

  async function deleteRequest(id){ const row=state.requests.find((r)=>Number(r.id)===Number(id)); if(!row) return; if(!(row.user_id===state.user?.id||isAdmin(state.profile))) return; if(!confirm(`Apagar definitivamente a solicitação “${row.item}”?`)) return; const {error}=await client.from('solicitacoes_compras').delete().eq('id',row.id); if(error){$('purchaseMessage').textContent=error.message;return;} await loadAll(); }
  async function deleteHistory(id){ if(!isAdmin(state.profile)||!confirm('Apagar definitivamente este registro de entrega?')) return; const {error}=await client.from('solicitacoes_compras').delete().eq('id',id).eq('status','entregue'); if(error){$('purchaseMessage').textContent=error.message;return;} await loadAll(); }

  function csvCell(value){ const s=String(value??'').replaceAll('"','""'); return `"${s}"`; }
  function downloadReport(){ const rows=filteredHistory(); if(!rows.length){$('purchaseMessage').textContent='Não há entregas nos filtros atuais para gerar relatório.';return;} const header=['Seção','Item','Quantidade','Solicitante','Data do pedido','Data da compra','Entregue para','Data da entrega','Registrado por','Detalhes','Observações do pedido','Observação da entrega']; const lines=[header.map(csvCell).join(';')]; rows.forEach((r)=>lines.push([sectionName(r),r.item,r.quantidade,r.solicitante_nome,formatDate(r.criado_em),formatDate(r.comprado_em),r.entregue_para,formatDate(r.entregue_em),r.entregue_por_nome,r.detalhes,r.observacao,r.entrega_observacao].map(csvCell).join(';'))); const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`gearpc-compras-entregas-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000); }

  async function clearShownHistory(){ if(!isAdmin(state.profile)) return; const rows=filteredHistory(); if(!rows.length) return; if(!confirm(`Apagar definitivamente ${rows.length} registro(s) de entrega exibido(s)? Faça isso somente depois de salvar o relatório.`)) return; const ids=rows.map((r)=>r.id); const {error}=await client.from('solicitacoes_compras').delete().in('id',ids).eq('status','entregue'); if(error){$('purchaseMessage').textContent=error.message;return;} await loadAll(); }

  function bindEvents(){
    $('purchaseRequestsButton')?.addEventListener('click',openView); $('purchaseBackButton')?.addEventListener('click',showDashboard); $('purchaseLogoutButton')?.addEventListener('click',()=> $('logoutButton')?.click());
    document.querySelectorAll('.purchase-tab').forEach((b)=>b.addEventListener('click',()=>switchTab(b.dataset.purchaseTab)));
    $('newPurchaseRequestButton')?.addEventListener('click',openRequestDialog); $('purchaseRequestForm')?.addEventListener('submit',saveRequest); $('closePurchaseRequestDialog')?.addEventListener('click',closeRequestDialog); $('cancelPurchaseRequestButton')?.addEventListener('click',closeRequestDialog);
    $('purchaseNotBoughtForm')?.addEventListener('submit',saveNotBought); $('closePurchaseNotBoughtDialog')?.addEventListener('click',closeNotBought); $('cancelPurchaseNotBoughtButton')?.addEventListener('click',closeNotBought);
    $('purchaseDeliveryForm')?.addEventListener('submit',saveDelivery); $('closePurchaseDeliveryDialog')?.addEventListener('click',closeDelivery); $('cancelPurchaseDeliveryButton')?.addEventListener('click',closeDelivery);
    $('purchaseRefreshButton')?.addEventListener('click',loadAll); $('deliveryRefreshButton')?.addEventListener('click',loadAll);
    $('purchaseSectionFilter')?.addEventListener('change',renderRequests); $('deliverySectionFilter')?.addEventListener('change',renderDeliveries); ['historySectionFilter','historyDateFrom','historyDateTo','historySearch'].forEach((id)=>$(id)?.addEventListener(id==='historySearch'?'input':'change',renderHistory));
    $('downloadPurchaseReportButton')?.addEventListener('click',downloadReport); $('clearPurchaseHistoryButton')?.addEventListener('click',clearShownHistory);
    $('purchaseRequestList')?.addEventListener('click',(e)=>{const b=e.target.closest('.purchase-bought-button');if(b){markPurchased(b.dataset.id);return;}const n=e.target.closest('.purchase-not-bought-button');if(n){openNotBought(n.dataset.id);return;}const d=e.target.closest('.purchase-delete-button');if(d)deleteRequest(d.dataset.id);});
    $('purchaseDeliveryList')?.addEventListener('click',(e)=>{const b=e.target.closest('.purchase-deliver-button');if(b)openDelivery(b.dataset.id);});
    $('purchaseHistoryList')?.addEventListener('click',(e)=>{const b=e.target.closest('.purchase-delete-history-button');if(b)deleteHistory(b.dataset.id);});
    client.auth.onAuthStateChange((_event,session)=>setTimeout(async()=>{if(!session?.user){$('purchaseRequestsButton')?.classList.add('hidden');$('purchaseRequestsView')?.classList.add('hidden');return;}await loadContext();},0));
  }

  injectUi(); bindEvents(); loadContext().catch(()=>{});
})();
