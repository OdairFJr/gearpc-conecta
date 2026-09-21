(() => {
  if (window.__GEARPC_ACTIVITY_MATERIALS_V63__) return;
  window.__GEARPC_ACTIVITY_MATERIALS_V63__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let isAdmin = false;
  let rows = [];
  let chiefs = [];

  const esc = (value) => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'","&#039;");

  async function waitRuntime() {
    for (let i = 0; i < 100; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.profile && x?.state?.user?.id) return x;
      await sleep(150);
    }
    return null;
  }

  async function resolvePilot() {
    if (rt.state.profile?.tipo === 'administrador') return true;
    const { data, error } = await rt.client
      .from('perfis_usuarios')
      .select('eh_teste')
      .eq('user_id', rt.state.user.id)
      .maybeSingle();
    return !error && data?.eh_teste === true;
  }

  function injectStyles() {
    if ($('activityMaterialsStylesV63')) return;
    const style = document.createElement('style');
    style.id = 'activityMaterialsStylesV63';
    style.textContent = `
      .materials-v63{min-height:100vh;color:#17324d}
      .materials-hero-v63{background:#fff;border:1px solid #dfe7ee;border-radius:18px;padding:18px;margin-top:12px}
      .materials-hero-v63 h2{margin:4px 0 6px;color:#0a376c}
      .materials-hero-v63 p{margin:0;color:#657789;line-height:1.45}
      .materials-actions-v63{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
      .materials-new-v63{border:0;border-radius:11px;padding:10px 13px;background:#0a376c;color:#fff;font-weight:850}
      .materials-toolbar-v63{display:flex;gap:10px;align-items:center;margin-top:12px}
      .materials-search-v63{flex:1;display:flex;gap:8px;align-items:center;background:#fff;border:1px solid #d4dee7;border-radius:12px;padding:10px 12px}
      .materials-search-v63 input{border:0;outline:0;width:100%;font:inherit;background:transparent}
      .materials-summary-v63{font-size:.84rem;color:#617487;margin:10px 2px 6px}
      .materials-list-v63{display:grid;gap:10px;padding-bottom:22px}
      .materials-card-v63{background:#fff;border:1px solid #dfe7ee;border-radius:15px;padding:14px;box-shadow:0 5px 15px rgba(10,55,108,.05)}
      .materials-card-top-v63{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .materials-name-v63{font-weight:900;color:#17324d;font-size:1rem}
      .materials-holder-v63{margin-top:7px;color:#5d7184;font-size:.88rem}
      .materials-holder-v63 b{color:#30475d}
      .materials-card-actions-v63{display:flex;gap:7px;flex-wrap:wrap}
      .materials-edit-v63,.materials-delete-v63{border:0;border-radius:9px;padding:7px 9px;font-size:.78rem;font-weight:800}
      .materials-edit-v63{background:#e9f1f8;color:#0a376c}.materials-delete-v63{background:#fff0ef;color:#a22520}
      .materials-empty-v63{background:#fff;border:1px dashed #cbd7e1;border-radius:14px;padding:22px;text-align:center;color:#697a8a}
      .materials-dialog-v63{border:0;border-radius:18px;padding:0;width:min(92vw,520px);box-shadow:0 22px 60px rgba(0,0,0,.28)}
      .materials-dialog-v63::backdrop{background:rgba(4,20,38,.62)}
      .materials-dialog-body-v63{padding:20px}.materials-dialog-body-v63 h2{margin:3px 0 15px;color:#0a376c}
      .materials-form-v63{display:grid;gap:12px}.materials-form-v63 label{display:grid;gap:6px;font-size:.82rem;font-weight:850;color:#40576c}
      .materials-form-v63 input,.materials-form-v63 select{width:100%;box-sizing:border-box;border:1px solid #cbd7e0;border-radius:10px;padding:10px 11px;font:inherit;background:#fff}
      .materials-dialog-actions-v63{display:flex;justify-content:flex-end;gap:8px;margin-top:5px}
      .materials-cancel-v63,.materials-save-v63{border:0;border-radius:10px;padding:10px 13px;font-weight:850}
      .materials-cancel-v63{background:#e9eef3;color:#17324d}.materials-save-v63{background:#0a376c;color:#fff}
      .materials-message-v63{min-height:18px;margin:0;font-size:.8rem;font-weight:750;color:#a22520}
      #materialsViewV63>.subpage-header{background:linear-gradient(180deg,#0a376c,#0d4b88);padding:12px 14px;border-radius:16px}
      @media(max-width:560px){.materials-card-top-v63{flex-direction:column}.materials-card-actions-v63{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function ensureDashboardButton() {
    if ($('activityMaterialsButtonV63')) return;
    const modules = document.querySelector('.launch-modules');
    if (!modules) return;
    const button = document.createElement('button');
    button.id = 'activityMaterialsButtonV63';
    button.className = 'launch-module';
    button.type = 'button';
    button.innerHTML = `
      <span class="launch-module-icon" aria-hidden="true">📦</span>
      <span class="launch-module-copy">
        <strong>Materiais de atividades</strong>
        <small>Veja o que o grupo possui e com quem está cada material.</small>
      </span>
      <span class="launch-module-arrow" aria-hidden="true">›</span>`;
    modules.appendChild(button);
    button.addEventListener('click', openView);
  }

  function ensureView() {
    let view = $('materialsViewV63');
    if (view) return view;
    const main = document.querySelector('main.app-shell') || document.querySelector('main') || document.body;
    view = document.createElement('section');
    view.id = 'materialsViewV63';
    view.className = 'materials-v63 hidden';
    view.innerHTML = `
      <header class="subpage-header">
        <button id="materialsBackV63" class="back-button" type="button" aria-label="Voltar">←</button>
        <div class="subpage-brand"><img src="logo-grupo.jpeg" alt="" /><div><span>GEArPC Conecta</span><strong>Materiais de atividades</strong></div></div>
        <button id="materialsLogoutV63" class="secondary-button" type="button">Sair</button>
      </header>
      <section class="materials-hero-v63">
        <div class="eyebrow dark">MATERIAIS DO GRUPO</div>
        <h2>Onde estão nossos materiais?</h2>
        <p>Relação simples dos materiais de atividade e da pessoa que está guardando cada um.</p>
        <div class="materials-actions-v63">
          <button id="materialsNewV63" class="materials-new-v63" type="button" hidden>＋ Novo material</button>
        </div>
      </section>
      <section class="materials-toolbar-v63">
        <label class="materials-search-v63"><span>🔎</span><input id="materialsSearchV63" type="search" placeholder="Buscar material ou pessoa" /></label>
      </section>
      <div id="materialsSummaryV63" class="materials-summary-v63"></div>
      <section id="materialsListV63" class="materials-list-v63" aria-live="polite"></section>`;
    main.appendChild(view);
    $('materialsBackV63')?.addEventListener('click', closeView);
    $('materialsLogoutV63')?.addEventListener('click', async () => {
      try { await rt.client.auth.signOut(); } catch (_) {}
      location.reload();
    });
    $('materialsSearchV63')?.addEventListener('input', renderList);
    $('materialsNewV63')?.addEventListener('click', () => openForm());
    return view;
  }

  function ensureDialog() {
    let dialog = $('materialsDialogV63');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'materialsDialogV63';
    dialog.className = 'materials-dialog-v63';
    dialog.innerHTML = `
      <div class="materials-dialog-body-v63">
        <div class="eyebrow dark">MATERIAL</div>
        <h2 id="materialsDialogTitleV63">Novo material</h2>
        <form id="materialsFormV63" class="materials-form-v63">
          <input id="materialsIdV63" type="hidden" />
          <label>Material
            <input id="materialsNameV63" type="text" maxlength="120" required placeholder="Ex.: Caixa de cordas" />
          </label>
          <label>Com quem está
            <select id="materialsHolderV63"><option value="">Local a definir</option></select>
          </label>
          <p id="materialsMessageV63" class="materials-message-v63" role="status"></p>
          <div class="materials-dialog-actions-v63">
            <button id="materialsCancelV63" class="materials-cancel-v63" type="button">Cancelar</button>
            <button class="materials-save-v63" type="submit">Salvar</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(dialog);
    $('materialsCancelV63')?.addEventListener('click', () => dialog.close());
    $('materialsFormV63')?.addEventListener('submit', saveForm);
    return dialog;
  }

  function hideCoreViews() {
    document.querySelectorAll('main.app-shell > section').forEach((section) => section.classList.add('hidden'));
  }

  function closeView() {
    $('materialsViewV63')?.classList.add('hidden');
    rt.showDashboard?.();
  }

  async function openView() {
    hideCoreViews();
    const view = ensureView();
    view.classList.remove('hidden');
    $('materialsNewV63').hidden = !isAdmin;
    await loadData();
  }

  async function loadData() {
    const list = $('materialsListV63');
    if (list) list.innerHTML = '<div class="materials-empty-v63">Carregando materiais...</div>';
    const [materialsRes, chiefsRes] = await Promise.all([
      rt.client.from('materiais_atividade').select('id,material,com_chefe_id,criado_em,atualizado_em').order('material'),
      rt.client.from('chefes').select('id,nome_completo,ativo').eq('ativo', true).order('nome_completo')
    ]);
    if (materialsRes.error) {
      if (list) list.innerHTML = '<div class="materials-empty-v63">Não foi possível carregar os materiais.</div>';
      return;
    }
    rows = materialsRes.data || [];
    chiefs = chiefsRes.data || [];
    renderList();
  }

  function renderList() {
    const list = $('materialsListV63');
    const summary = $('materialsSummaryV63');
    if (!list) return;
    const term = String($('materialsSearchV63')?.value || '').trim().toLowerCase();
    const chiefMap = new Map(chiefs.map((c) => [Number(c.id), c.nome_completo]));
    const filtered = rows.filter((r) => {
      const holder = chiefMap.get(Number(r.com_chefe_id || 0)) || 'Local a definir';
      const hay = `${r.material || ''} ${holder}`.toLowerCase();
      return !term || hay.includes(term);
    });
    if (summary) summary.textContent = `${rows.length} material${rows.length === 1 ? '' : 'is'} registrado${rows.length === 1 ? '' : 's'}.`;
    list.innerHTML = '';
    if (!filtered.length) {
      list.innerHTML = '<div class="materials-empty-v63">Nenhum material encontrado.</div>';
      return;
    }
    filtered.forEach((r) => {
      const holder = chiefMap.get(Number(r.com_chefe_id || 0)) || 'Local a definir';
      const card = document.createElement('article');
      card.className = 'materials-card-v63';
      card.innerHTML = `
        <div class="materials-card-top-v63">
          <div>
            <div class="materials-name-v63">${esc(r.material)}</div>
            <div class="materials-holder-v63"><b>Com quem está:</b> ${esc(holder)}</div>
          </div>
          ${isAdmin ? `<div class="materials-card-actions-v63">
            <button class="materials-edit-v63" type="button" data-material-edit="${r.id}">Editar</button>
            <button class="materials-delete-v63" type="button" data-material-delete="${r.id}">Apagar</button>
          </div>` : ''}
        </div>`;
      list.appendChild(card);
    });
  }

  function fillHolderOptions(selected = '') {
    const select = $('materialsHolderV63');
    if (!select) return;
    select.innerHTML = '<option value="">Local a definir</option>' +
      chiefs.map((c) => `<option value="${Number(c.id)}">${esc(c.nome_completo)}</option>`).join('');
    select.value = selected ? String(selected) : '';
  }

  function openForm(row = null) {
    if (!isAdmin) return;
    ensureDialog();
    $('materialsIdV63').value = row?.id ? String(row.id) : '';
    $('materialsNameV63').value = row?.material || '';
    fillHolderOptions(row?.com_chefe_id || '');
    $('materialsDialogTitleV63').textContent = row ? 'Editar material' : 'Novo material';
    $('materialsMessageV63').textContent = '';
    $('materialsDialogV63').showModal();
    setTimeout(() => $('materialsNameV63')?.focus(), 50);
  }

  async function saveForm(event) {
    event.preventDefault();
    if (!isAdmin) return;
    const id = Number($('materialsIdV63')?.value || 0);
    const material = String($('materialsNameV63')?.value || '').trim();
    const holderId = Number($('materialsHolderV63')?.value || 0) || null;
    const msg = $('materialsMessageV63');
    if (!material) {
      if (msg) msg.textContent = 'Informe o material.';
      return;
    }
    const payload = {
      material,
      com_chefe_id: holderId,
      atualizado_em: new Date().toISOString()
    };
    let res;
    if (id) {
      res = await rt.client.from('materiais_atividade').update(payload).eq('id', id);
    } else {
      res = await rt.client.from('materiais_atividade').insert({
        ...payload,
        criado_por: rt.state.user.id
      });
    }
    if (res.error) {
      if (msg) msg.textContent = 'Não foi possível salvar o material.';
      return;
    }
    $('materialsDialogV63').close();
    await loadData();
  }

  async function deleteRow(id) {
    if (!isAdmin) return;
    const row = rows.find((r) => Number(r.id) === Number(id));
    if (!row) return;
    if (!confirm(`Apagar o material “${row.material}”?`)) return;
    const { error } = await rt.client.from('materiais_atividade').delete().eq('id', id);
    if (error) {
      alert('Não foi possível apagar o material.');
      return;
    }
    await loadData();
  }

  function bind() {
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const edit = target.closest('[data-material-edit]');
      if (edit) {
        const row = rows.find((r) => Number(r.id) === Number(edit.dataset.materialEdit));
        if (row) openForm(row);
        return;
      }
      const del = target.closest('[data-material-delete]');
      if (del) void deleteRow(Number(del.dataset.materialDelete));
    });
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt) return;
    const pilot = await resolvePilot();
    if (!pilot) return;
    isAdmin = rt.state.profile?.tipo === 'administrador';
    injectStyles();
    ensureDashboardButton();
    ensureView();
    ensureDialog();
    bind();
  }

  void boot();
})();