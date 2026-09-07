(() => {
  if (window.__GEARPC_ADMIN_ACTIVITY_V27__) return;
  window.__GEARPC_ADMIN_ACTIVITY_V27__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let historyRows = [];
  let loading = false;
  let scheduled = null;

  function esc(value) {
    const rt = window.GEARPC_RUNTIME;
    if (rt?.escapeHtml) return rt.escapeHtml(String(value ?? ''));
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  function formatDateTime(value) {
    if (!value) return '—';
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(new Date(value));
    } catch (_) { return '—'; }
  }

  function categoryLabel(category) {
    return ({
      presenca: 'Presença',
      programacao: 'Programação',
      passagem: 'Caminho / passagem',
      biblioteca: 'Biblioteca',
      administracao: 'Administração'
    })[category] || category || 'Atividade';
  }

  function categoryIcon(category) {
    return ({ presenca: '✅', programacao: '🗓️', passagem: '🧭', biblioteca: '📚', administracao: '⚙️' })[category] || '•';
  }

  function installStyles() {
    if (document.getElementById('gearpcAdminActivityStyles')) return;
    const style = document.createElement('style');
    style.id = 'gearpcAdminActivityStyles';
    style.textContent = `
      .gearpc-activity-overview{margin:14px 0 18px;background:#fff;border:1px solid #d7e2eb;border-radius:16px;padding:15px;box-shadow:0 3px 12px #0000000d}
      .gearpc-activity-overview h3{margin:0 0 4px;color:#17324d;font-size:1rem}
      .gearpc-activity-overview p{margin:0 0 12px;color:#667b8e;font-size:.82rem}
      .gearpc-activity-overview-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      .gearpc-activity-overview-grid div{background:#f3f7fa;border-radius:11px;padding:10px 8px;text-align:center}
      .gearpc-activity-overview-grid strong{display:block;color:#0a376c;font-size:1.12rem}
      .gearpc-activity-overview-grid span{display:block;color:#687c8e;font-size:.7rem;margin-top:2px}
      .gearpc-activity-summary{border-top:1px solid #e2e9ef;margin-top:12px;padding-top:12px}
      .gearpc-activity-mini-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:9px}
      .gearpc-activity-mini-grid div{background:#f5f8fa;border-radius:9px;padding:8px 6px;text-align:center}
      .gearpc-activity-mini-grid strong{display:block;font-size:.95rem;color:#17324d}
      .gearpc-activity-mini-grid span{display:block;font-size:.66rem;color:#718495;margin-top:2px}
      .gearpc-activity-last{font-size:.76rem;color:#617589;line-height:1.35;margin:3px 0 9px}
      .gearpc-activity-history-btn{width:100%;border:1px solid #b9c9d5;background:#fff;color:#0a376c;border-radius:9px;padding:9px 10px;font-weight:800;cursor:pointer}
      .gearpc-activity-dialog{border:0;border-radius:18px;padding:0;width:min(94vw,720px);max-height:88vh;box-shadow:0 16px 50px #0005}
      .gearpc-activity-dialog::backdrop{background:#17324d88}
      .gearpc-activity-dialog-inner{padding:18px;background:#f7fafc;color:#17324d}
      .gearpc-activity-dialog-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;margin-bottom:12px}
      .gearpc-activity-dialog-head h3{margin:0 0 3px}.gearpc-activity-dialog-head p{margin:0;color:#687c8e;font-size:.8rem}
      .gearpc-activity-close{border:0;background:#e8eef3;border-radius:999px;width:36px;height:36px;font-size:1.1rem;cursor:pointer}
      .gearpc-activity-filter{width:100%;box-sizing:border-box;padding:10px;border:1px solid #c7d4de;border-radius:10px;background:#fff;margin-bottom:12px}
      .gearpc-activity-timeline{display:grid;gap:9px;max-height:58vh;overflow:auto;padding-right:2px}
      .gearpc-activity-event{background:#fff;border:1px solid #dce5ec;border-radius:12px;padding:11px}
      .gearpc-activity-event-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:5px}
      .gearpc-activity-event-head strong{font-size:.8rem}.gearpc-activity-event-head span{font-size:.7rem;color:#718495;white-space:nowrap}
      .gearpc-activity-event p{margin:0;color:#415a70;font-size:.82rem;line-height:1.4}
      .gearpc-activity-empty{background:#fff;border:1px dashed #cbd7e0;border-radius:12px;padding:18px;text-align:center;color:#718495;font-size:.82rem}
      @media (max-width:620px){.gearpc-activity-overview-grid,.gearpc-activity-mini-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);
  }

  function ensureDialog() {
    let dialog = document.getElementById('gearpcActivityDialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'gearpcActivityDialog';
    dialog.className = 'gearpc-activity-dialog';
    dialog.innerHTML = `
      <div class="gearpc-activity-dialog-inner">
        <div class="gearpc-activity-dialog-head">
          <div><h3 id="gearpcActivityDialogName">Histórico</h3><p id="gearpcActivityDialogEmail"></p></div>
          <button type="button" class="gearpc-activity-close" id="gearpcActivityDialogClose" aria-label="Fechar">×</button>
        </div>
        <select id="gearpcActivityFilter" class="gearpc-activity-filter">
          <option value="">Todas as atividades</option>
          <option value="presenca">Presença</option>
          <option value="programacao">Programação</option>
          <option value="passagem">Caminho / passagem</option>
          <option value="biblioteca">Biblioteca</option>
        </select>
        <div id="gearpcActivityTimeline" class="gearpc-activity-timeline"></div>
      </div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('#gearpcActivityDialogClose').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    return dialog;
  }

  function eventsFor(userId) {
    return historyRows.filter((row) => String(row.user_id || '') === String(userId || ''));
  }

  function summaryFor(userId) {
    const rows = eventsFor(userId);
    const presence = rows.filter((r) => r.categoria === 'presenca' && r.entidade === 'presencas_chamada' && r.acao !== 'excluir').length;
    const programs = new Set(rows.filter((r) => r.categoria === 'programacao' && r.programacao_id).map((r) => String(r.programacao_id))).size;
    const passage = rows.filter((r) => r.categoria === 'passagem').length;
    const library = rows.filter((r) => r.categoria === 'biblioteca').length;
    return { rows, presence, programs, passage, library, last: rows[0] || null };
  }

  function renderDialog(user) {
    const dialog = ensureDialog();
    const filter = dialog.querySelector('#gearpcActivityFilter');
    const timeline = dialog.querySelector('#gearpcActivityTimeline');
    dialog.querySelector('#gearpcActivityDialogName').textContent = user.nome_completo || user.email || 'Usuário';
    dialog.querySelector('#gearpcActivityDialogEmail').textContent = user.email || '';
    filter.value = '';

    const draw = () => {
      const rows = eventsFor(user.user_id).filter((r) => !filter.value || r.categoria === filter.value);
      timeline.innerHTML = rows.length ? rows.map((r) => `
        <article class="gearpc-activity-event">
          <div class="gearpc-activity-event-head"><strong>${categoryIcon(r.categoria)} ${esc(categoryLabel(r.categoria))}</strong><span>${esc(formatDateTime(r.criado_em))}</span></div>
          <p>${esc(r.descricao)}</p>
        </article>`).join('') : '<div class="gearpc-activity-empty">Nenhuma atividade registrada neste filtro.</div>';
    };
    filter.onchange = draw;
    draw();
    dialog.showModal();
  }

  function visibleAccessRows() {
    const rt = window.GEARPC_RUNTIME;
    const state = rt?.state;
    const input = document.getElementById('accessSearch');
    if (!state?.accessRows) return [];
    const term = (input?.value || '').trim().toLowerCase();
    return state.accessRows.filter((r) => {
      const hay = `${r.nome_completo || ''} ${r.email || ''}`.toLowerCase();
      return !term || hay.includes(term);
    });
  }

  function renderOverview() {
    const accessList = document.getElementById('accessList');
    if (!accessList?.parentNode) return;
    let box = document.getElementById('gearpcActivityOverview');
    if (!box) {
      box = document.createElement('section');
      box.id = 'gearpcActivityOverview';
      box.className = 'gearpc-activity-overview';
      accessList.parentNode.insertBefore(box, accessList);
    }
    const usersWithActions = new Set(historyRows.filter((r) => r.user_id).map((r) => String(r.user_id))).size;
    const presence = historyRows.filter((r) => r.categoria === 'presenca' && r.entidade === 'presencas_chamada' && r.acao !== 'excluir').length;
    const programs = new Set(historyRows.filter((r) => r.categoria === 'programacao' && r.programacao_id).map((r) => String(r.programacao_id))).size;
    const passage = historyRows.filter((r) => r.categoria === 'passagem').length;
    box.innerHTML = `<h3>Atividades registradas</h3><p>Histórico administrativo das ações realizadas no GEArPC Conecta.</p>
      <div class="gearpc-activity-overview-grid">
        <div><strong>${usersWithActions}</strong><span>pessoas com ações</span></div>
        <div><strong>${presence}</strong><span>presenças lançadas</span></div>
        <div><strong>${programs}</strong><span>programações</span></div>
        <div><strong>${passage}</strong><span>ações de caminho/passagem</span></div>
      </div>`;
  }

  function enhanceCards() {
    const list = document.getElementById('accessList');
    if (!list) return;
    const cards = [...list.querySelectorAll('.access-card')];
    const users = visibleAccessRows();
    cards.forEach((card, index) => {
      const user = users[index];
      if (!user || card.querySelector('.gearpc-activity-summary')) return;
      const s = summaryFor(user.user_id);
      const block = document.createElement('div');
      block.className = 'gearpc-activity-summary';
      block.innerHTML = `
        <div class="gearpc-activity-mini-grid">
          <div><strong>${s.presence}</strong><span>presenças</span></div>
          <div><strong>${s.programs}</strong><span>programações</span></div>
          <div><strong>${s.passage}</strong><span>caminho/passagem</span></div>
          <div><strong>${s.library}</strong><span>biblioteca</span></div>
        </div>
        <div class="gearpc-activity-last">${s.last ? `Última atividade: ${esc(s.last.descricao)} · ${esc(formatDateTime(s.last.criado_em))}` : 'Nenhuma atividade registrada ainda.'}</div>
        <button class="gearpc-activity-history-btn" type="button">Ver histórico detalhado</button>`;
      block.querySelector('button').addEventListener('click', () => renderDialog(user));
      card.appendChild(block);
    });
  }

  function scheduleEnhance() {
    clearTimeout(scheduled);
    scheduled = setTimeout(() => { renderOverview(); enhanceCards(); }, 80);
  }

  async function loadHistory() {
    if (loading) return;
    const rt = window.GEARPC_RUNTIME;
    if (!rt?.client || rt?.state?.profile?.tipo !== 'administrador') return;
    loading = true;
    try {
      const { data, error } = await rt.client
        .from('historico_atividades_app')
        .select('id,user_id,categoria,acao,descricao,secao_id,jovem_id,programacao_id,entidade,entidade_id,criado_em')
        .order('criado_em', { ascending: false })
        .limit(1000);
      if (error) throw error;
      historyRows = data || [];
      scheduleEnhance();
    } catch (error) {
      console.warn('GEArPC: não foi possível carregar o histórico administrativo.', error);
    } finally {
      loading = false;
    }
  }

  async function boot() {
    installStyles();
    for (let i = 0; i < 80; i += 1) {
      const rt = window.GEARPC_RUNTIME;
      if (rt?.client && rt?.state?.profile) break;
      await sleep(250);
    }
    const rt = window.GEARPC_RUNTIME;
    if (!rt?.client || rt?.state?.profile?.tipo !== 'administrador') return;

    const accessButton = document.getElementById('accessButton');
    const accessView = document.getElementById('accessView');
    const refresh = document.getElementById('accessRefreshButton');
    const search = document.getElementById('accessSearch');
    const list = document.getElementById('accessList');

    const strong = accessButton?.querySelector('strong');
    const small = accessButton?.querySelector('small');
    if (strong) strong.textContent = 'Acessos e atividades';
    if (small) small.textContent = 'Acompanhe acessos e ações realizadas no app.';
    const pageTitle = accessView?.querySelector('.subpage-brand strong');
    if (pageTitle) pageTitle.textContent = 'Acessos e atividades';
    const heroTitle = accessView?.querySelector('h2');
    if (heroTitle) heroTitle.textContent = 'Acessos e atividades da equipe';

    accessButton?.addEventListener('click', () => setTimeout(loadHistory, 250));
    refresh?.addEventListener('click', () => setTimeout(loadHistory, 250));
    search?.addEventListener('input', scheduleEnhance);

    if (list) {
      const observer = new MutationObserver(scheduleEnhance);
      observer.observe(list, { childList: true });
    }

    window.GEARPC_ADMIN_ACTIVITY = { refresh: loadHistory };
    await loadHistory();
  }

  void boot();
})();
