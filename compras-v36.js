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
    resultRequestId: null
  };

  const css = document.createElement('style');
  css.textContent = `
    .purchase-icon { background: linear-gradient(135deg, #fff3d6, #ffe1a3); }
    .purchase-toolbar { gap: 12px; align-items: end; }
    .purchase-list { display: grid; gap: 12px; padding-bottom: 24px; }
    .purchase-card { background: #fff; border: 1px solid #dde5ee; border-radius: 18px; padding: 16px; box-shadow: 0 8px 24px rgba(17, 50, 82, .07); }
    .purchase-card-top { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
    .purchase-card h3 { margin: 7px 0 6px; font-size: 1.06rem; color: #17324d; }
    .purchase-section-chip { display: inline-flex; align-items: center; gap: 5px; border-radius: 999px; padding: 5px 9px; font-size: .76rem; font-weight: 800; color: #0a376c; background: #e9f2fb; }
    .purchase-status { flex: 0 0 auto; border-radius: 999px; padding: 5px 9px; font-size: .72rem; font-weight: 800; background: #fff6d8; color: #7a5700; }
    .purchase-status.not-bought { background: #fff0f0; color: #8c2e2e; }
    .purchase-meta { display: flex; flex-wrap: wrap; gap: 6px 12px; color: #627488; font-size: .82rem; margin-top: 8px; }
    .purchase-cycle { margin-top: 10px; border-radius: 12px; padding: 9px 11px; background: #f4f8fc; color: #36526d; font-size: .82rem; line-height: 1.4; }
    .purchase-cycle strong { color: #173b5e; }
    .purchase-detail { margin-top: 10px; padding-top: 10px; border-top: 1px solid #edf1f5; color: #41566b; font-size: .88rem; line-height: 1.45; }
    .purchase-pending-reason { margin-top: 10px; border-left: 4px solid #d98b35; background: #fff8ef; padding: 10px 12px; border-radius: 10px; color: #63431d; font-size: .87rem; line-height: 1.45; }
    .purchase-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 12px; }
    .purchase-result-button { border: 0; border-radius: 10px; padding: 9px 12px; font-weight: 800; cursor: pointer; }
    .purchase-result-button.bought { background: #e4f5e8; color: #176a31; }
    .purchase-result-button.not-bought { background: #fff0e5; color: #8b4c12; }
    .purchase-empty { background: #fff; border: 1px dashed #cbd6e1; border-radius: 16px; padding: 22px; text-align: center; color: #65778a; }
    .purchase-count { margin: 8px 0 14px; color: #5b6f83; font-size: .88rem; }
    .purchase-count strong { color: #153653; font-size: 1.05rem; }
    .purchase-dialog-note { margin: 0 0 8px; color: #65778a; font-size: .88rem; line-height: 1.45; }
    .purchase-form-grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(120px, .5fr); gap: 12px; }
    .purchase-cycle-banner { margin: 12px 0 0; border-radius: 14px; padding: 11px 13px; background: #eaf3fb; color: #244b70; font-size: .88rem; line-height: 1.45; }
    .purchase-cycle-banner strong { color: #0a376c; }
    .purchase-result-summary { border-radius: 12px; background: #f4f8fc; padding: 11px 12px; margin: 4px 0 10px; color: #3b536b; font-size: .9rem; }
    @media (max-width: 640px) {
      .purchase-card-top { align-items: stretch; flex-direction: column; }
      .purchase-status { align-self: flex-start; }
      .purchase-form-grid { grid-template-columns: 1fr; }
      .purchase-actions { justify-content: stretch; }
      .purchase-actions button { flex: 1 1 150px; }
    }
  `;
  document.head.appendChild(css);

  function injectUi() {
    const modules = document.querySelector('.launch-modules');
    if (modules && !$('purchaseRequestsButton')) {
      const button = document.createElement('button');
      button.id = 'purchaseRequestsButton';
      button.className = 'launch-module hidden';
      button.type = 'button';
      button.innerHTML = `
        <span class="launch-module-icon purchase-icon" aria-hidden="true">🛒</span>
        <span class="launch-module-copy">
          <strong>Solicitações de compras</strong>
          <small>Peça itens da Loja Escoteira e acompanhe as pendências do grupo.</small>
        </span>
        <span class="launch-module-arrow" aria-hidden="true">›</span>
      `;
      const accessButton = $('accessButton');
      if (accessButton) modules.insertBefore(button, accessButton);
      else modules.appendChild(button);
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
          <div>
            <div class="eyebrow dark">LOJA ESCOTEIRA</div>
            <h2>Solicitações de compras</h2>
            <p>Pedidos ativos permanecem aqui até a compra ser realizada. Solicitações não atendidas continuam na relação para nova tentativa.</p>
            <div id="purchaseCycleBanner" class="purchase-cycle-banner"></div>
          </div>
          <button id="newPurchaseRequestButton" class="new-member-button" type="button">＋ Nova solicitação</button>
        </section>

        <section class="members-toolbar purchase-toolbar">
          <label class="filter-field"><span>Seção</span><select id="purchaseSectionFilter"><option value="">Todas</option></select></label>
          <button id="purchaseRefreshButton" class="secondary-action-button" type="button">↻ Atualizar</button>
        </section>

        <div id="purchaseRoleNote" class="role-note"></div>
        <div class="purchase-count"><strong id="purchaseRequestCount">0</strong> pedido(s) ativo(s)</div>
        <section id="purchaseRequestList" class="purchase-list" aria-live="polite"></section>
        <p id="purchaseMessage" class="members-message" role="status"></p>
      `;
      appShell.appendChild(section);
    }

    if (!$('purchaseRequestDialog')) {
      const dialog = document.createElement('dialog');
      dialog.id = 'purchaseRequestDialog';
      dialog.className = 'member-dialog';
      dialog.innerHTML = `
        <form id="purchaseRequestForm" method="dialog" class="member-form">
          <div class="dialog-title-row">
            <div><div class="eyebrow dark">LOJA ESCOTEIRA</div><h2>Nova solicitação</h2></div>
            <button id="closePurchaseRequestDialog" type="button" class="dialog-close" aria-label="Fechar">×</button>
          </div>
          <p class="purchase-dialog-note">Cada pedido entra no ciclo mensal que vai do dia 11 até o dia 10 seguinte, data prevista para a compra.</p>
          <div id="purchaseDialogCycle" class="purchase-result-summary"></div>
          <label>Seção / origem da solicitação<select id="purchaseRequestSection" required></select></label>
          <div class="purchase-form-grid">
            <label>Item<input id="purchaseRequestItem" type="text" maxlength="180" required placeholder="Ex.: Distintivo de especialidade de capoeira" /></label>
            <label>Quantidade<input id="purchaseRequestQuantity" type="number" min="1" max="999" value="1" required /></label>
          </div>
          <label>Tamanho, modelo ou código<input id="purchaseRequestDetails" type="text" maxlength="240" placeholder="Opcional" /></label>
          <label>Observações<textarea id="purchaseRequestObservation" rows="3" maxlength="700" placeholder="Opcional"></textarea></label>
          <p id="purchaseRequestFormMessage" class="form-message" role="status"></p>
          <div class="dialog-actions">
            <button id="cancelPurchaseRequestButton" type="button" class="cancel-button">Cancelar</button>
            <button id="savePurchaseRequestButton" type="submit" class="save-button">Enviar solicitação</button>
          </div>
        </form>
      `;
      document.body.appendChild(dialog);
    }

    if (!$('purchaseNotBoughtDialog')) {
      const dialog = document.createElement('dialog');
      dialog.id = 'purchaseNotBoughtDialog';
      dialog.className = 'member-dialog';
      dialog.innerHTML = `
        <form id="purchaseNotBoughtForm" method="dialog" class="member-form">
          <div class="dialog-title-row">
            <div><div class="eyebrow dark">RESULTADO DA COMPRA</div><h2>Item não comprado</h2></div>
            <button id="closePurchaseNotBoughtDialog" type="button" class="dialog-close" aria-label="Fechar">×</button>
          </div>
          <div id="purchaseNotBoughtSummary" class="purchase-result-summary"></div>
          <label>Motivo de não ter sido comprado<textarea id="purchaseNotBoughtReason" rows="4" maxlength="700" required placeholder="Ex.: Produto em falta na Loja Escoteira"></textarea></label>
          <p class="purchase-dialog-note">O pedido continuará na lista ativa para uma nova tentativa de compra posteriormente.</p>
          <p id="purchaseNotBoughtMessage" class="form-message" role="status"></p>
          <div class="dialog-actions">
            <button id="cancelPurchaseNotBoughtButton" type="button" class="cancel-button">Cancelar</button>
            <button id="savePurchaseNotBoughtButton" type="submit" class="save-button">Registrar e manter pendente</button>
          </div>
        </form>
      `;
      document.body.appendChild(dialog);
    }
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function isInternal(profile) {
    return !!profile?.ativo && (
      profile.tipo === 'administrador' ||
      profile.tipo === 'chefia' ||
      profile.acesso_geral_consulta === true
    );
  }

  function isManager(profile) {
    return profile?.tipo === 'administrador' || profile?.acesso_geral_consulta === true;
  }

  function saoPauloDateParts(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const get = (type) => Number(parts.find((part) => part.type === type)?.value || 0);
    return { year: get('year'), month: get('month'), day: get('day') };
  }

  function shiftMonth(year, month, delta) {
    const index = (year * 12 + (month - 1)) + delta;
    return { year: Math.floor(index / 12), month: (index % 12 + 12) % 12 + 1 };
  }

  function pad2(value) { return String(value).padStart(2, '0'); }

  function cycleFor(value = new Date()) {
    const p = saoPauloDateParts(value);
    let startYear;
    let startMonth;
    let endYear;
    let endMonth;

    if (p.day <= 10) {
      const previous = shiftMonth(p.year, p.month, -1);
      startYear = previous.year;
      startMonth = previous.month;
      endYear = p.year;
      endMonth = p.month;
    } else {
      const next = shiftMonth(p.year, p.month, 1);
      startYear = p.year;
      startMonth = p.month;
      endYear = next.year;
      endMonth = next.month;
    }

    return {
      startYear,
      startMonth,
      endYear,
      endMonth,
      label: `11/${pad2(startMonth)}/${startYear} a 10/${pad2(endMonth)}/${endYear}`,
      purchaseLabel: `10/${pad2(endMonth)}/${endYear}`
    };
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short'
    }).format(date);
  }

  function updateCycleLabels() {
    const cycle = cycleFor(new Date());
    const banner = $('purchaseCycleBanner');
    if (banner) banner.innerHTML = `<strong>Ciclo atual:</strong> ${escapeHtml(cycle.label)} • compra prevista em <strong>${escapeHtml(cycle.purchaseLabel)}</strong>.`;
    const dialogCycle = $('purchaseDialogCycle');
    if (dialogCycle) dialogCycle.innerHTML = `Este pedido entra no ciclo <strong>${escapeHtml(cycle.label)}</strong>, com compra prevista para <strong>${escapeHtml(cycle.purchaseLabel)}</strong>.`;
  }

  function hidePurchaseUi() {
    $('purchaseRequestsView')?.classList.add('hidden');
  }

  function hideKnownViews() {
    ['loginView', 'dashboardView', 'membersView', 'chiefsView', 'attendanceView', 'programmingView', 'programEditorView', 'accessView']
      .forEach((id) => $(id)?.classList.add('hidden'));
  }

  function showDashboard() {
    hidePurchaseUi();
    $('dashboardView')?.classList.remove('hidden');
  }

  function sectionNameById(id) {
    const found = state.sections.find((section) => Number(section.id) === Number(id));
    return found?.nome || 'Seção';
  }

  function requestSectionName(row) {
    if (!row.secao_id) return 'Diretoria';
    if (row.secoes?.nome) return row.secoes.nome;
    return sectionNameById(row.secao_id);
  }

  function statusLabel(status) {
    return status === 'nao_comprado' ? 'Não comprado' : 'Aguardando compra';
  }

  async function loadContext() {
    const { data: sessionData } = await client.auth.getSession();
    const session = sessionData?.session;
    if (!session?.user) {
      state.user = null;
      state.profile = null;
      $('purchaseRequestsButton')?.classList.add('hidden');
      hidePurchaseUi();
      return false;
    }

    const { data: profile, error: profileError } = await client
      .from('perfis_usuarios')
      .select('nome_completo,tipo,ativo,acesso_geral_consulta,chefe_id')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !isInternal(profile)) {
      state.user = session.user;
      state.profile = profile || null;
      $('purchaseRequestsButton')?.classList.add('hidden');
      hidePurchaseUi();
      return false;
    }

    state.user = session.user;
    state.profile = profile;
    $('purchaseRequestsButton')?.classList.remove('hidden');

    const { data: sections } = await client
      .from('secoes')
      .select('id,nome,ativo')
      .eq('ativo', true)
      .order('id', { ascending: true });
    state.sections = sections || [];

    if (isManager(profile)) {
      state.allowedSectionIds = state.sections.map((section) => Number(section.id));
    } else if (profile.chefe_id) {
      const { data: links } = await client
        .from('chefe_secoes')
        .select('secao_id')
        .eq('chefe_id', profile.chefe_id);
      state.allowedSectionIds = (links || []).map((row) => Number(row.secao_id));
    } else {
      state.allowedSectionIds = [];
    }

    fillFilters();
    updateCycleLabels();
    return true;
  }

  function fillFilters() {
    const filter = $('purchaseSectionFilter');
    if (filter) {
      const current = filter.value;
      filter.innerHTML = '<option value="">Todas</option><option value="diretoria">Diretoria</option>' +
        state.sections.map((section) => `<option value="${section.id}">${escapeHtml(section.nome)}</option>`).join('');
      if ([...filter.options].some((option) => option.value === current)) filter.value = current;
    }

    const select = $('purchaseRequestSection');
    if (!select) return;
    const options = [];
    if (isManager(state.profile)) options.push('<option value="diretoria">Diretoria</option>');
    state.sections
      .filter((section) => state.allowedSectionIds.includes(Number(section.id)))
      .forEach((section) => options.push(`<option value="${section.id}">${escapeHtml(section.nome)}</option>`));
    select.innerHTML = options.join('');
    select.disabled = options.length <= 1;
  }

  async function loadRequests() {
    const message = $('purchaseMessage');
    if (message) message.textContent = 'Carregando solicitações...';

    const { data, error } = await client
      .from('solicitacoes_compras')
      .select('id,user_id,solicitante_nome,secao_id,item,quantidade,detalhes,observacao,status,motivo_nao_compra,ultima_tentativa_em,resultado_atualizado_por_nome,criado_em,secoes(nome)')
      .in('status', ['solicitado', 'nao_comprado'])
      .order('criado_em', { ascending: true });

    if (error) {
      if (message) message.textContent = `Não foi possível carregar as solicitações: ${error.message}`;
      state.requests = [];
      renderRequests();
      return;
    }

    state.requests = data || [];
    if (message) message.textContent = '';
    renderRequests();
  }

  function renderRequests() {
    const list = $('purchaseRequestList');
    const count = $('purchaseRequestCount');
    if (!list || !count) return;

    const selected = $('purchaseSectionFilter')?.value || '';
    const filtered = state.requests.filter((row) => {
      if (!selected) return true;
      if (selected === 'diretoria') return !row.secao_id;
      return Number(row.secao_id) === Number(selected);
    });

    count.textContent = String(filtered.length);

    if (!filtered.length) {
      list.innerHTML = '<div class="purchase-empty">Nenhum pedido ativo neste filtro.</div>';
      return;
    }

    list.innerHTML = filtered.map((row) => {
      const canDelete = row.user_id === state.user?.id || state.profile?.tipo === 'administrador';
      const canManageResult = isManager(state.profile);
      const details = row.detalhes ? `<div><strong>Detalhes:</strong> ${escapeHtml(row.detalhes)}</div>` : '';
      const observation = row.observacao ? `<div><strong>Observação:</strong> ${escapeHtml(row.observacao)}</div>` : '';
      const extra = details || observation ? `<div class="purchase-detail">${details}${observation}</div>` : '';
      const cycle = cycleFor(row.criado_em);
      const pendingReason = row.status === 'nao_comprado'
        ? `<div class="purchase-pending-reason"><strong>Última tentativa sem compra:</strong> ${escapeHtml(row.motivo_nao_compra || 'Motivo não informado')}${row.ultima_tentativa_em ? `<br><small>${escapeHtml(formatDate(row.ultima_tentativa_em))}${row.resultado_atualizado_por_nome ? ` • registrado por ${escapeHtml(row.resultado_atualizado_por_nome)}` : ''}</small>` : ''}<br><strong>O pedido continua pendente para nova tentativa.</strong></div>`
        : '';
      const resultActions = canManageResult ? `
        <button type="button" class="purchase-result-button bought purchase-bought-button" data-request-id="${row.id}">✓ Compra realizada</button>
        <button type="button" class="purchase-result-button not-bought purchase-not-bought-button" data-request-id="${row.id}">Não comprado</button>
      ` : '';
      const deleteAction = canDelete ? `<button type="button" class="danger-button purchase-delete-button" data-request-id="${row.id}">Apagar solicitação</button>` : '';

      return `
        <article class="purchase-card">
          <div class="purchase-card-top">
            <div>
              <span class="purchase-section-chip">⚜ ${escapeHtml(requestSectionName(row))}</span>
              <h3>${escapeHtml(row.item)}</h3>
            </div>
            <span class="purchase-status ${row.status === 'nao_comprado' ? 'not-bought' : ''}">${escapeHtml(statusLabel(row.status))}</span>
          </div>
          <div class="purchase-meta">
            <span><strong>Qtd.:</strong> ${escapeHtml(row.quantidade)}</span>
            <span><strong>Solicitante:</strong> ${escapeHtml(row.solicitante_nome)}</span>
            <span><strong>Pedido:</strong> ${escapeHtml(formatDate(row.criado_em))}</span>
          </div>
          <div class="purchase-cycle"><strong>Ciclo de entrada:</strong> ${escapeHtml(cycle.label)} • compra prevista em ${escapeHtml(cycle.purchaseLabel)}</div>
          ${extra}
          ${pendingReason}
          ${(resultActions || deleteAction) ? `<div class="purchase-actions">${resultActions}${deleteAction}</div>` : ''}
        </article>
      `;
    }).join('');
  }

  async function openView() {
    const ok = await loadContext();
    if (!ok) return;

    hideKnownViews();
    $('purchaseRequestsView')?.classList.remove('hidden');

    const roleNote = $('purchaseRoleNote');
    if (roleNote) {
      roleNote.textContent = isManager(state.profile)
        ? 'Dirigência: registre o resultado de cada tentativa. “Compra realizada” retira o item da lista ativa; “Não comprado” mantém o pedido pendente com o motivo.'
        : 'Os pedidos comprados saem da lista. Se um item estiver em falta ou não puder ser comprado, ele continuará aparecendo para nova tentativa.';
    }

    await loadRequests();
  }

  function openRequestDialog() {
    const select = $('purchaseRequestSection');
    if (!select || !select.options.length) {
      $('purchaseMessage').textContent = 'Seu perfil ainda não possui uma seção disponível para fazer a solicitação.';
      return;
    }
    $('purchaseRequestForm')?.reset();
    $('purchaseRequestQuantity').value = '1';
    fillFilters();
    updateCycleLabels();
    $('purchaseRequestFormMessage').textContent = '';
    $('purchaseRequestDialog')?.showModal();
  }

  function closeRequestDialog() {
    $('purchaseRequestDialog')?.close();
  }

  async function saveRequest(event) {
    event.preventDefault();
    const message = $('purchaseRequestFormMessage');
    const saveButton = $('savePurchaseRequestButton');
    if (message) message.textContent = '';

    const sectionValue = $('purchaseRequestSection')?.value || '';
    const item = $('purchaseRequestItem')?.value.trim() || '';
    const quantity = Number($('purchaseRequestQuantity')?.value || 0);
    const details = $('purchaseRequestDetails')?.value.trim() || null;
    const observation = $('purchaseRequestObservation')?.value.trim() || null;

    if (!item || !sectionValue || !Number.isInteger(quantity) || quantity < 1) {
      if (message) message.textContent = 'Preencha a seção, o item e uma quantidade válida.';
      return;
    }

    const secaoId = sectionValue === 'diretoria' ? null : Number(sectionValue);
    if (secaoId && !state.allowedSectionIds.includes(secaoId) && !isManager(state.profile)) {
      if (message) message.textContent = 'Esta seção não está liberada para o seu perfil.';
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = 'Enviando...';

    const { error } = await client.from('solicitacoes_compras').insert({
      user_id: state.user.id,
      solicitante_nome: state.profile.nome_completo,
      secao_id: secaoId,
      item,
      quantidade: quantity,
      detalhes: details,
      observacao: observation,
      status: 'solicitado'
    });

    saveButton.disabled = false;
    saveButton.textContent = 'Enviar solicitação';

    if (error) {
      if (message) message.textContent = `Não foi possível registrar: ${error.message}`;
      return;
    }

    closeRequestDialog();
    await loadRequests();
  }

  async function markPurchased(id) {
    if (!isManager(state.profile)) return;
    const row = state.requests.find((request) => Number(request.id) === Number(id));
    if (!row) return;
    if (!window.confirm(`Confirmar compra realizada de ${row.quantidade} × “${row.item}”? O pedido sairá da lista ativa.`)) return;

    const now = new Date().toISOString();
    const { error } = await client.from('solicitacoes_compras').update({
      status: 'comprado',
      motivo_nao_compra: null,
      ultima_tentativa_em: now,
      comprado_em: now,
      resultado_atualizado_por: state.user.id,
      resultado_atualizado_por_nome: state.profile.nome_completo,
      atualizado_em: now
    }).eq('id', row.id);

    if (error) {
      $('purchaseMessage').textContent = `Não foi possível marcar como comprado: ${error.message}`;
      return;
    }

    await loadRequests();
  }

  function openNotBoughtDialog(id) {
    if (!isManager(state.profile)) return;
    const row = state.requests.find((request) => Number(request.id) === Number(id));
    if (!row) return;
    state.resultRequestId = row.id;
    $('purchaseNotBoughtReason').value = row.motivo_nao_compra || '';
    $('purchaseNotBoughtMessage').textContent = '';
    $('purchaseNotBoughtSummary').innerHTML = `<strong>${escapeHtml(requestSectionName(row))}</strong> • ${escapeHtml(row.quantidade)} × ${escapeHtml(row.item)}`;
    $('purchaseNotBoughtDialog')?.showModal();
  }

  function closeNotBoughtDialog() {
    state.resultRequestId = null;
    $('purchaseNotBoughtDialog')?.close();
  }

  async function saveNotBought(event) {
    event.preventDefault();
    if (!isManager(state.profile)) return;
    const row = state.requests.find((request) => Number(request.id) === Number(state.resultRequestId));
    if (!row) return;

    const reason = $('purchaseNotBoughtReason')?.value.trim() || '';
    const message = $('purchaseNotBoughtMessage');
    if (!reason) {
      if (message) message.textContent = 'Informe o motivo de não ter sido comprado.';
      return;
    }

    const button = $('savePurchaseNotBoughtButton');
    button.disabled = true;
    button.textContent = 'Registrando...';

    const now = new Date().toISOString();
    const { error } = await client.from('solicitacoes_compras').update({
      status: 'nao_comprado',
      motivo_nao_compra: reason,
      ultima_tentativa_em: now,
      comprado_em: null,
      resultado_atualizado_por: state.user.id,
      resultado_atualizado_por_nome: state.profile.nome_completo,
      atualizado_em: now
    }).eq('id', row.id);

    button.disabled = false;
    button.textContent = 'Registrar e manter pendente';

    if (error) {
      if (message) message.textContent = `Não foi possível registrar o resultado: ${error.message}`;
      return;
    }

    closeNotBoughtDialog();
    await loadRequests();
  }

  async function deleteRequest(id) {
    const row = state.requests.find((request) => Number(request.id) === Number(id));
    if (!row) return;
    const canDelete = row.user_id === state.user?.id || state.profile?.tipo === 'administrador';
    if (!canDelete) return;
    if (!window.confirm(`Apagar definitivamente a solicitação de “${row.item}”?`)) return;

    const { error } = await client.from('solicitacoes_compras').delete().eq('id', row.id);
    if (error) {
      $('purchaseMessage').textContent = `Não foi possível apagar: ${error.message}`;
      return;
    }
    await loadRequests();
  }

  function bindEvents() {
    $('purchaseRequestsButton')?.addEventListener('click', openView);
    $('purchaseBackButton')?.addEventListener('click', showDashboard);
    $('purchaseLogoutButton')?.addEventListener('click', () => {
      const mainLogout = $('logoutButton');
      if (mainLogout) mainLogout.click();
      else client.auth.signOut();
    });
    $('newPurchaseRequestButton')?.addEventListener('click', openRequestDialog);
    $('purchaseRefreshButton')?.addEventListener('click', loadRequests);
    $('purchaseSectionFilter')?.addEventListener('change', renderRequests);
    $('purchaseRequestForm')?.addEventListener('submit', saveRequest);
    $('closePurchaseRequestDialog')?.addEventListener('click', closeRequestDialog);
    $('cancelPurchaseRequestButton')?.addEventListener('click', closeRequestDialog);
    $('purchaseNotBoughtForm')?.addEventListener('submit', saveNotBought);
    $('closePurchaseNotBoughtDialog')?.addEventListener('click', closeNotBoughtDialog);
    $('cancelPurchaseNotBoughtButton')?.addEventListener('click', closeNotBoughtDialog);
    $('purchaseRequestList')?.addEventListener('click', (event) => {
      const bought = event.target.closest('.purchase-bought-button');
      if (bought) { markPurchased(bought.dataset.requestId); return; }
      const notBought = event.target.closest('.purchase-not-bought-button');
      if (notBought) { openNotBoughtDialog(notBought.dataset.requestId); return; }
      const remove = event.target.closest('.purchase-delete-button');
      if (remove) deleteRequest(remove.dataset.requestId);
    });

    window.addEventListener('online', () => {
      if (!$('purchaseRequestsView')?.classList.contains('hidden')) loadRequests();
    });

    client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(async () => {
        if (!session?.user) {
          state.user = null;
          state.profile = null;
          $('purchaseRequestsButton')?.classList.add('hidden');
          hidePurchaseUi();
          return;
        }
        await loadContext();
      }, 0);
    });
  }

  injectUi();
  bindEvents();
  loadContext().catch(() => {});
})();
