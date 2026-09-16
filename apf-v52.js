(() => {
  if (window.__GEARPC_APF_V52__) return;
  window.__GEARPC_APF_V52__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let runtime = null;
  let rows = [];
  let chiefs = [];
  let functions = [];
  let chiefSections = [];
  let sections = [];

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  async function waitForRuntime() {
    for (let i = 0; i < 80; i += 1) {
      const rt = window.GEARPC_RUNTIME;
      if (rt?.client && rt?.state?.profile) return rt;
      await sleep(250);
    }
    return null;
  }

  function injectStyles() {
    if ($('apfStylesV52')) return;
    const style = document.createElement('style');
    style.id = 'apfStylesV52';
    style.textContent = `
      .apf-view-v52{min-height:100vh;background:#f4f7fa;color:#17324d}
      .apf-hero-v52{padding:20px 18px 14px;background:#fff;border-bottom:1px solid #dfe7ee}
      .apf-hero-v52 h2{margin:3px 0 7px;color:#0a376c}.apf-hero-v52 p{margin:0;color:#657789;line-height:1.45}
      .apf-actions-v52{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.apf-manage-v52{border:0;border-radius:11px;padding:10px 13px;background:#0a376c;color:#fff;font-weight:800;cursor:pointer}
      .apf-toolbar-v52{padding:14px 18px;display:flex;gap:10px;align-items:center}.apf-search-v52{flex:1;display:flex;gap:8px;align-items:center;background:#fff;border:1px solid #d4dee7;border-radius:12px;padding:10px 12px}.apf-search-v52 input{border:0;outline:0;width:100%;font:inherit;background:transparent}
      .apf-summary-v52{padding:0 18px 8px;color:#607284;font-size:.86rem}.apf-list-v52{display:grid;gap:12px;padding:8px 18px 24px}.apf-card-v52{background:#fff;border:1px solid #dfe7ee;border-radius:16px;padding:15px;box-shadow:0 6px 18px rgba(10,55,108,.06)}
      .apf-card-head-v52{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.apf-card-head-v52 strong{font-size:1rem;color:#17324d}.apf-badge-v52{white-space:nowrap;background:#e8f5ec;color:#1f6d39;border-radius:999px;padding:6px 9px;font-size:.76rem;font-weight:900}.apf-badge-v52.full{background:#f1f2f4;color:#69727c}
      .apf-meta-v52{display:grid;gap:7px;margin-top:12px;font-size:.84rem;color:#5f7182}.apf-meta-v52 b{color:#30475d}.apf-note-v52{margin-top:10px;padding:9px 10px;border-radius:10px;background:#f5f8fb;font-size:.83rem;color:#586c7f}
      .apf-empty-v52{background:#fff;border:1px dashed #cbd7e1;border-radius:14px;padding:22px;text-align:center;color:#697a8a}
      .apf-dialog-v52{border:0;border-radius:18px;padding:0;width:min(94vw,720px);max-height:88vh;box-shadow:0 22px 60px rgba(0,0,0,.28)}.apf-dialog-v52::backdrop{background:rgba(4,20,38,.62)}
      .apf-dialog-body-v52{padding:20px}.apf-dialog-body-v52 h2{margin:3px 0 5px;color:#0a376c}.apf-dialog-body-v52>p{margin:0 0 15px;color:#657789}.apf-manager-list-v52{display:grid;gap:9px;max-height:58vh;overflow:auto;padding-right:3px}
      .apf-manager-row-v52{border:1px solid #dbe4ec;border-radius:13px;padding:12px;background:#fff}.apf-manager-top-v52{display:flex;align-items:center;gap:9px;font-weight:800}.apf-manager-top-v52 input{width:18px;height:18px;accent-color:#0a376c}.apf-manager-fields-v52{display:grid;grid-template-columns:120px 1fr;gap:9px;margin-top:10px}.apf-manager-fields-v52 label{display:grid;gap:5px;font-size:.78rem;font-weight:800;color:#52687b}.apf-manager-fields-v52 input{width:100%;box-sizing:border-box;border:1px solid #ccd7e0;border-radius:9px;padding:9px;font:inherit}
      .apf-dialog-actions-v52{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.apf-cancel-v52,.apf-save-v52{border:0;border-radius:10px;padding:10px 13px;font-weight:800;cursor:pointer}.apf-cancel-v52{background:#e9eef3;color:#17324d}.apf-save-v52{background:#0a376c;color:#fff}.apf-message-v52{min-height:20px;margin:10px 0 0;font-size:.84rem;font-weight:700}
      @media(max-width:560px){.apf-manager-fields-v52{grid-template-columns:1fr}.apf-toolbar-v52{padding:12px}.apf-list-v52{padding:8px 12px 22px}.apf-hero-v52{padding:17px 14px}.apf-summary-v52{padding:0 12px 6px}}
    `;
    document.head.appendChild(style);
  }

  function ensureDashboardButton() {
    if ($('apfButtonV52')) return;
    if (runtime.state.profile?.tipo === 'responsavel') return;
    const modules = document.querySelector('.launch-modules');
    if (!modules) return;
    const button = document.createElement('button');
    button.id = 'apfButtonV52';
    button.className = 'launch-module';
    button.type = 'button';
    button.innerHTML = `
      <span class="launch-module-icon chief-icon" aria-hidden="true">🎓</span>
      <span class="launch-module-copy"><strong>APFs disponíveis</strong><small>Consulte quem pode atuar como Assessor Pessoal de Formação.</small></span>
      <span class="launch-module-arrow" aria-hidden="true">›</span>`;
    const chiefsButton = $('chiefsButton');
    if (chiefsButton?.nextSibling) modules.insertBefore(button, chiefsButton.nextSibling); else modules.appendChild(button);
    button.addEventListener('click', openView);
  }

  function ensureView() {
    let view = $('apfViewV52');
    if (view) return view;
    const main = document.querySelector('main.app-shell') || document.querySelector('main') || document.body;
    view = document.createElement('section');
    view.id = 'apfViewV52';
    view.className = 'apf-view-v52 hidden';
    view.innerHTML = `
      <header class="subpage-header">
        <button id="apfBackV52" class="back-button" type="button" aria-label="Voltar">←</button>
        <div class="subpage-brand"><img src="logo-grupo.jpeg" alt="" /><div><span>GEArPC Conecta</span><strong>APFs disponíveis</strong></div></div>
        <button id="apfLogoutV52" class="secondary-button" type="button">Sair</button>
      </header>
      <section class="apf-hero-v52">
        <div class="eyebrow dark">FORMAÇÃO DE ADULTOS</div>
        <h2>Assessores Pessoais de Formação</h2>
        <p>Veja os adultos que estão disponíveis para acompanhar o desenvolvimento e o Plano Pessoal de Formação.</p>
        <div class="apf-actions-v52"><button id="apfManageV52" class="apf-manage-v52" type="button" hidden>⚙ Gerenciar APFs</button></div>
      </section>
      <section class="apf-toolbar-v52"><label class="apf-search-v52"><span>🔎</span><input id="apfSearchV52" type="search" placeholder="Buscar APF por nome" /></label></section>
      <div id="apfSummaryV52" class="apf-summary-v52"></div>
      <section id="apfListV52" class="apf-list-v52" aria-live="polite"></section>
    `;
    main.appendChild(view);
    $('apfBackV52')?.addEventListener('click', closeView);
    $('apfLogoutV52')?.addEventListener('click', async () => { try { await runtime.client.auth.signOut(); } catch (_) {} location.reload(); });
    $('apfManageV52')?.addEventListener('click', openManager);
    $('apfSearchV52')?.addEventListener('input', renderList);
    return view;
  }

  function ensureManagerDialog() {
    let dialog = $('apfManagerDialogV52');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'apfManagerDialogV52';
    dialog.className = 'apf-dialog-v52';
    dialog.innerHTML = `
      <div class="apf-dialog-body-v52">
        <div class="eyebrow dark">ADMINISTRADOR</div><h2>Gerenciar APFs disponíveis</h2>
        <p>Marque quem pode receber novos assessorados e informe quantas vagas estão disponíveis.</p>
        <div id="apfManagerListV52" class="apf-manager-list-v52"></div>
        <p id="apfManagerMessageV52" class="apf-message-v52" role="status"></p>
        <div class="apf-dialog-actions-v52"><button id="apfManagerCancelV52" class="apf-cancel-v52" type="button">Cancelar</button><button id="apfManagerSaveV52" class="apf-save-v52" type="button">Salvar</button></div>
      </div>`;
    document.body.appendChild(dialog);
    $('apfManagerCancelV52')?.addEventListener('click', () => dialog.close());
    $('apfManagerSaveV52')?.addEventListener('click', saveManager);
    return dialog;
  }

  function hideCoreViews() {
    document.querySelectorAll('main.app-shell > section').forEach((section) => section.classList.add('hidden'));
  }

  function closeView() {
    $('apfViewV52')?.classList.add('hidden');
    runtime.showDashboard?.();
  }

  async function openView() {
    hideCoreViews();
    const view = ensureView();
    view.classList.remove('hidden');
    $('apfManageV52').hidden = runtime.state.profile?.tipo !== 'administrador';
    await loadData();
  }

  function funcsFor(chiefId) {
    return functions.filter((f) => Number(f.chefe_id) === Number(chiefId)).map((f) => f.funcao).filter(Boolean);
  }

  function sectionsFor(chiefId) {
    const ids = chiefSections.filter((s) => Number(s.chefe_id) === Number(chiefId)).map((s) => Number(s.secao_id));
    return sections.filter((s) => ids.includes(Number(s.id))).map((s) => s.nome).filter(Boolean);
  }

  function rowForChief(chiefId) {
    return rows.find((r) => Number(r.chefe_id) === Number(chiefId)) || null;
  }

  function renderList() {
    const list = $('apfListV52');
    if (!list) return;
    const term = ($('apfSearchV52')?.value || '').trim().toLowerCase();
    const available = rows
      .filter((r) => r.disponivel)
      .map((r) => ({ r, c: chiefs.find((c) => Number(c.id) === Number(r.chefe_id)) }))
      .filter((x) => x.c?.ativo)
      .filter((x) => !term || String(x.c.nome_completo || '').toLowerCase().includes(term))
      .sort((a,b) => String(a.c.nome_completo).localeCompare(String(b.c.nome_completo), 'pt-BR'));

    $('apfSummaryV52').textContent = `${available.length} APF${available.length === 1 ? '' : 's'} disponível${available.length === 1 ? '' : 'is'} no momento.`;
    list.innerHTML = '';
    if (!available.length) {
      list.innerHTML = '<div class="apf-empty-v52">Nenhum APF foi marcado como disponível ainda.</div>';
      return;
    }

    available.forEach(({ r, c }) => {
      const funcs = funcsFor(c.id);
      const secs = sectionsFor(c.id);
      const vacancies = Number(r.vagas || 0);
      const card = document.createElement('article');
      card.className = 'apf-card-v52';
      card.innerHTML = `
        <div class="apf-card-head-v52"><strong>${escapeHtml(c.nome_completo)}</strong><span class="apf-badge-v52 ${vacancies <= 0 ? 'full' : ''}">${vacancies > 0 ? `${vacancies} vaga${vacancies === 1 ? '' : 's'}` : 'Sem vagas'}</span></div>
        <div class="apf-meta-v52">
          <div><b>Função:</b> ${escapeHtml(funcs.length ? funcs.join(' • ') : 'Não informada')}</div>
          <div><b>Seção:</b> ${escapeHtml(secs.length ? secs.join(' • ') : 'Sem seção vinculada')}</div>
          ${c.telefone ? `<div><b>Contato:</b> ${escapeHtml(c.telefone)}</div>` : ''}
        </div>
        ${r.observacoes ? `<div class="apf-note-v52">${escapeHtml(r.observacoes)}</div>` : ''}`;
      list.appendChild(card);
    });
  }

  async function loadData() {
    const list = $('apfListV52');
    if (list) list.innerHTML = '<div class="apf-empty-v52">Carregando APFs...</div>';
    const [apfRes, chiefsRes, funcsRes, linksRes, secsRes] = await Promise.all([
      runtime.client.from('apfs_disponiveis').select('id,chefe_id,disponivel,vagas,observacoes').order('chefe_id'),
      runtime.client.from('chefes').select('id,nome_completo,telefone,ativo').eq('ativo', true).order('nome_completo'),
      runtime.client.from('chefe_funcoes').select('chefe_id,funcao'),
      runtime.client.from('chefe_secoes').select('chefe_id,secao_id'),
      runtime.client.from('secoes').select('id,nome,ativo').eq('ativo', true)
    ]);
    const errors = [apfRes.error, chiefsRes.error, funcsRes.error, linksRes.error, secsRes.error].filter(Boolean);
    if (errors.length) {
      if (list) list.innerHTML = `<div class="apf-empty-v52">Não foi possível carregar os APFs: ${escapeHtml(errors[0].message || 'erro de acesso')}</div>`;
      return;
    }
    rows = apfRes.data || [];
    chiefs = chiefsRes.data || [];
    functions = funcsRes.data || [];
    chiefSections = linksRes.data || [];
    sections = secsRes.data || [];
    renderList();
  }

  function openManager() {
    if (runtime.state.profile?.tipo !== 'administrador') return;
    const dialog = ensureManagerDialog();
    const wrap = $('apfManagerListV52');
    wrap.innerHTML = '';
    chiefs.filter((c) => c.ativo).forEach((c) => {
      const current = rowForChief(c.id);
      const div = document.createElement('div');
      div.className = 'apf-manager-row-v52';
      div.dataset.chiefId = String(c.id);
      div.innerHTML = `
        <label class="apf-manager-top-v52"><input class="apf-enabled-v52" type="checkbox" ${current?.disponivel ? 'checked' : ''}/><span>${escapeHtml(c.nome_completo)}</span></label>
        <div class="apf-manager-fields-v52">
          <label>Vagas<input class="apf-vagas-v52" type="number" min="0" max="20" value="${Number(current?.vagas ?? 1)}" /></label>
          <label>Observação<input class="apf-obs-v52" type="text" maxlength="180" value="${escapeHtml(current?.observacoes || '')}" placeholder="Ex.: preferência por determinada linha de formação" /></label>
        </div>`;
      wrap.appendChild(div);
    });
    $('apfManagerMessageV52').textContent = '';
    dialog.showModal();
  }

  async function saveManager() {
    if (runtime.state.profile?.tipo !== 'administrador') return;
    const button = $('apfManagerSaveV52');
    const msg = $('apfManagerMessageV52');
    button.disabled = true;
    button.textContent = 'Salvando...';
    msg.textContent = '';
    try {
      const items = [...document.querySelectorAll('.apf-manager-row-v52')];
      for (const item of items) {
        const chefeId = Number(item.dataset.chiefId);
        const enabled = item.querySelector('.apf-enabled-v52')?.checked === true;
        const vagas = Math.max(0, Math.min(20, Number(item.querySelector('.apf-vagas-v52')?.value || 0)));
        const observacoes = String(item.querySelector('.apf-obs-v52')?.value || '').trim() || null;
        const existing = rowForChief(chefeId);
        if (!enabled && !existing) continue;
        const payload = { chefe_id: chefeId, disponivel: enabled, vagas, observacoes, atualizado_em: new Date().toISOString() };
        const { error } = await runtime.client.from('apfs_disponiveis').upsert(payload, { onConflict: 'chefe_id' });
        if (error) throw error;
      }
      msg.style.color = '#177245';
      msg.textContent = '✓ APFs atualizados.';
      await loadData();
      await sleep(500);
      $('apfManagerDialogV52')?.close();
    } catch (error) {
      msg.style.color = '#9b2c2c';
      msg.textContent = `Não foi possível salvar: ${error.message || error}`;
    } finally {
      button.disabled = false;
      button.textContent = 'Salvar';
    }
  }

  async function boot() {
    runtime = await waitForRuntime();
    if (!runtime) return;
    if (runtime.state.profile?.tipo === 'responsavel') return;
    injectStyles();
    ensureDashboardButton();
    ensureView();
    runtime.client.auth.onAuthStateChange((_event, session) => { if (!session) $('apfViewV52')?.classList.add('hidden'); });
  }

  void boot();
})();
