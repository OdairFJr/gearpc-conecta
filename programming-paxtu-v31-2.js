(() => {
  const runtime = window.GEARPC_RUNTIME;
  if (!runtime?.client || !runtime?.state) return;

  const { client, state } = runtime;
  const $ = (id) => document.getElementById(id);
  const PAXTU_OK = 'conferida_paxtu';
  const PAXTU_ADJUST = 'conferida_paxtu_ajustes';
  const PAXTU_MISSING = 'nao_lancada_paxtu';
  const PAXTU_STATES = [PAXTU_OK, PAXTU_ADJUST, PAXTU_MISSING];
  let refreshTimer = null;
  let refreshing = false;

  function isAdmin() { return state.profile?.tipo === 'administrador'; }
  function isChief() { return state.profile?.tipo === 'chefia'; }
  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function saoPauloDateParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const get = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
    return { year: get('year'), month: get('month'), day: get('day') };
  }

  function nextSaturdayYmd() {
    const p = saoPauloDateParts();
    const base = new Date(Date.UTC(p.year, p.month - 1, p.day, 12));
    base.setUTCDate(base.getUTCDate() + ((6 - base.getUTCDay() + 7) % 7));
    return base.toISOString().slice(0, 10);
  }

  function formatDate(iso) {
    const [y, m, d] = String(iso || '').split('-');
    return y && m && d ? `${d}/${m}/${y}` : String(iso || '');
  }

  function injectStyles() {
    if ($('programPaxtuStylesV312')) return;
    const style = document.createElement('style');
    style.id = 'programPaxtuStylesV312';
    style.textContent = `
      .program-paxtu-panel-v312{margin:14px 0 18px;padding:15px;border:1px solid #d8e1eb;border-radius:16px;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.04)}
      .program-paxtu-panel-v312 h3{margin:0 0 4px;color:#173f70}.program-paxtu-panel-v312>p{margin:0 0 12px;color:#5b6978;font-size:.92rem}
      .program-paxtu-list-v312{display:grid;gap:10px}.program-paxtu-row-v312{border:1px solid #e1e7ee;border-radius:13px;padding:12px;background:#fafbfd}
      .program-paxtu-head-v312{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.program-paxtu-head-v312 strong{color:#26394c}
      .program-paxtu-status-v312{display:inline-flex;border-radius:999px;padding:5px 9px;font-size:.78rem;font-weight:800;background:#eef2f6;color:#526476;white-space:nowrap}
      .program-paxtu-status-v312.ok{background:#e8f6ed;color:#176b38}.program-paxtu-status-v312.adjust{background:#fff6d9;color:#7b5b00}.program-paxtu-status-v312.missing{background:#fff1df;color:#86510b}
      .program-paxtu-actions-v312{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.program-paxtu-actions-v312 button{border:0;border-radius:10px;padding:9px 11px;font-weight:800;cursor:pointer}
      .program-paxtu-ok-v312{background:#1f7a45;color:#fff}.program-paxtu-adjust-v312{background:#b18412;color:#fff}.program-paxtu-missing-v312{background:#a86412;color:#fff}.program-paxtu-clear-v312{background:#e8edf3;color:#33485d}
      .program-paxtu-actions-v312 button:disabled{opacity:.55;cursor:default}.program-paxtu-note-v312{margin:7px 0 0;color:#667788;font-size:.86rem}.program-paxtu-observation-v312{margin:8px 0 0;padding:9px 10px;border-radius:10px;background:#fff9e8;color:#6e5710;font-size:.88rem}
      @media(max-width:640px){.program-paxtu-head-v312{flex-direction:column}.program-paxtu-actions-v312 button{flex:1 1 100%}}
    `;
    document.head.appendChild(style);
  }

  function ensurePanel() {
    const view = $('programmingView');
    if (!view) return null;
    let panel = $('programPaxtuPanelV312');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'programPaxtuPanelV312';
      panel.className = 'program-paxtu-panel-v312 hidden';
      const weekly = $('programWeeklyReviewPanel');
      const roleNote = $('programmingRoleNote');
      if (weekly) weekly.insertAdjacentElement('afterend', panel);
      else roleNote?.insertAdjacentElement('afterend', panel);
    }
    return panel;
  }

  async function ownSectionIds() {
    const direct = (state.ownChiefSectionIds || []).map(Number).filter(Boolean);
    if (direct.length) return [...new Set(direct)];
    const chiefId = Number(state.profile?.chefe_id || 0);
    if (!chiefId) return [];
    const { data, error } = await client.from('chefe_secoes').select('secao_id').eq('chefe_id', chiefId);
    if (error) return [];
    return [...new Set((data || []).map((row) => Number(row.secao_id)).filter(Boolean))];
  }

  async function loadData(date) {
    const [sectionsRes, programsRes, reviewsRes] = await Promise.all([
      client.from('secoes').select('id,nome,ativo').eq('ativo', true).order('id'),
      client.from('programacoes').select('id,secao_id,data_atividade').eq('data_atividade', date),
      client.from('programacao_revisoes').select('id,secao_id,data_atividade,status,observacao,revisado_em').eq('data_atividade', date)
    ]);
    const firstError = [sectionsRes, programsRes, reviewsRes].find((res) => res.error)?.error;
    if (firstError) throw firstError;
    return { sections: sectionsRes.data || [], programs: programsRes.data || [], reviews: reviewsRes.data || [] };
  }

  function statusInfo(status) {
    if (status === PAXTU_OK) return { label: '✓ Conferida no Paxtu', cls: 'ok' };
    if (status === PAXTU_ADJUST) return { label: '✎ Conferida no Paxtu — precisa de ajustes', cls: 'adjust' };
    if (status === PAXTU_MISSING) return { label: '⚠ Não lançada no Paxtu', cls: 'missing' };
    return { label: 'Sem marcação do Paxtu', cls: '' };
  }

  function adminRow(section, review, date, hasInternalProgram) {
    const info = statusInfo(review?.status);
    const paxtuMarked = PAXTU_STATES.includes(review?.status);
    const helper = hasInternalProgram
      ? 'Existe programação lançada no GEArPC Conecta. A marcação do Paxtu pode ser limpa se não for mais necessária.'
      : 'Use estes botões quando a programação desta seção estiver sendo controlada pelo Paxtu.';
    const observation = review?.status === PAXTU_ADJUST && review?.observacao
      ? `<p class="program-paxtu-observation-v312"><strong>Ajustes solicitados:</strong> ${escapeHtml(review.observacao)}</p>` : '';
    return `<article class="program-paxtu-row-v312">
      <div class="program-paxtu-head-v312"><strong>${escapeHtml(section.nome)}</strong><span class="program-paxtu-status-v312 ${info.cls}">${escapeHtml(info.label)}</span></div>
      <p class="program-paxtu-note-v312">${escapeHtml(helper)}</p>${observation}
      <div class="program-paxtu-actions-v312">
        <button type="button" class="program-paxtu-ok-v312" data-paxtu-action="ok" data-section-id="${section.id}" data-date="${date}" ${review?.status === PAXTU_OK ? 'disabled' : ''}>✓ Conferida no Paxtu</button>
        <button type="button" class="program-paxtu-adjust-v312" data-paxtu-action="adjust" data-section-id="${section.id}" data-date="${date}" ${review?.status === PAXTU_ADJUST ? 'disabled' : ''}>✎ Conferida — precisa de ajustes</button>
        <button type="button" class="program-paxtu-missing-v312" data-paxtu-action="missing" data-section-id="${section.id}" data-date="${date}" ${review?.status === PAXTU_MISSING ? 'disabled' : ''}>⚠ Não lançada no Paxtu</button>
        ${paxtuMarked ? `<button type="button" class="program-paxtu-clear-v312" data-paxtu-action="clear" data-section-id="${section.id}" data-date="${date}">Limpar marcação Paxtu</button>` : ''}
      </div>
    </article>`;
  }

  function chiefRow(section, review) {
    const info = statusInfo(review?.status);
    let helper = 'A administração verificou esta programação diretamente no Paxtu.';
    if (review?.status === PAXTU_OK) helper = 'A administração conferiu esta programação diretamente no Paxtu.';
    if (review?.status === PAXTU_ADJUST) helper = 'A administração conferiu a programação no Paxtu e identificou ajustes necessários.';
    if (review?.status === PAXTU_MISSING) helper = 'A administração verificou o Paxtu e a programação ainda não estava lançada.';
    const observation = review?.status === PAXTU_ADJUST && review?.observacao
      ? `<p class="program-paxtu-observation-v312"><strong>Ajustes solicitados:</strong> ${escapeHtml(review.observacao)}</p>` : '';
    return `<article class="program-paxtu-row-v312">
      <div class="program-paxtu-head-v312"><strong>${escapeHtml(section.nome)}</strong><span class="program-paxtu-status-v312 ${info.cls}">${escapeHtml(info.label)}</span></div>
      <p class="program-paxtu-note-v312">${escapeHtml(helper)}</p>${observation}
    </article>`;
  }

  async function refreshPanel() {
    if (refreshing || (!isAdmin() && !isChief())) return;
    const view = $('programmingView');
    if (!view || view.classList.contains('hidden')) return;
    refreshing = true;
    try {
      injectStyles();
      const panel = ensurePanel();
      if (!panel) return;
      const date = nextSaturdayYmd();
      const { sections, programs, reviews } = await loadData(date);
      const reviewBySection = new Map(reviews.map((row) => [Number(row.secao_id), row]));
      const programSectionIds = new Set(programs.map((row) => Number(row.secao_id)));

      if (isAdmin()) {
        const relevant = sections.filter((section) => {
          const review = reviewBySection.get(Number(section.id));
          return !programSectionIds.has(Number(section.id)) || PAXTU_STATES.includes(review?.status);
        });
        if (!relevant.length) {
          panel.classList.add('hidden'); panel.innerHTML = ''; return;
        }
        panel.classList.remove('hidden');
        panel.innerHTML = `<h3>Controle pelo Paxtu</h3><p>Programações de sábado ${escapeHtml(formatDate(date))} que podem ser acompanhadas diretamente no Paxtu.</p><div class="program-paxtu-list-v312">${relevant.map((section) => adminRow(section, reviewBySection.get(Number(section.id)), date, programSectionIds.has(Number(section.id)))).join('')}</div>`;
        return;
      }

      const ownIds = new Set(await ownSectionIds());
      const visible = sections.filter((section) => ownIds.has(Number(section.id)) && PAXTU_STATES.includes(reviewBySection.get(Number(section.id))?.status));
      if (!visible.length) {
        panel.classList.add('hidden'); panel.innerHTML = ''; return;
      }
      panel.classList.remove('hidden');
      panel.innerHTML = `<h3>Status da programação no Paxtu</h3><p>Sábado ${escapeHtml(formatDate(date))}.</p><div class="program-paxtu-list-v312">${visible.map((section) => chiefRow(section, reviewBySection.get(Number(section.id)))).join('')}</div>`;
    } catch (error) {
      console.error('GEArPC: falha ao carregar status Paxtu', error);
    } finally {
      refreshing = false;
    }
  }

  function scheduleRefresh(delay = 250) {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refreshPanel, delay);
  }

  async function savePaxtuStatus(button, status) {
    if (!isAdmin() || !state.user?.id) return;
    const sectionId = Number(button.dataset.sectionId || 0);
    const date = button.dataset.date || '';
    if (!sectionId || !date) return;
    let observation = '';
    if (status === PAXTU_ADJUST) {
      const reason = window.prompt('Informe quais ajustes a chefia precisa fazer na programação do Paxtu:');
      if (reason === null) return;
      if (!reason.trim()) return window.alert('Informe os ajustes necessários antes de salvar.');
      observation = reason.trim();
    } else if (status === PAXTU_OK) observation = 'Programação conferida pelo administrador diretamente no Paxtu.';
    else observation = 'Programação não localizada no Paxtu na conferência da administração.';

    button.disabled = true;
    const now = new Date().toISOString();
    const { error } = await client.from('programacao_revisoes').upsert({
      secao_id: sectionId, data_atividade: date, status, observacao: observation,
      revisado_por: state.user.id, revisado_em: now, atualizado_em: now
    }, { onConflict: 'secao_id,data_atividade' });
    if (error) {
      button.disabled = false;
      return window.alert('Não foi possível salvar o status do Paxtu.');
    }
    await client.from('notificacoes').update({ lida: true })
      .eq('tipo', 'cancelamento_programacao').eq('secao_id', sectionId).eq('data_referencia', date);
    scheduleRefresh(50);
  }

  async function clearPaxtuStatus(button) {
    if (!isAdmin()) return;
    const sectionId = Number(button.dataset.sectionId || 0);
    const date = button.dataset.date || '';
    if (!sectionId || !date) return;
    if (!window.confirm('Limpar a marcação do Paxtu para esta seção?')) return;
    button.disabled = true;
    const { error } = await client.from('programacao_revisoes').delete()
      .eq('secao_id', sectionId).eq('data_atividade', date).in('status', PAXTU_STATES);
    if (error) {
      button.disabled = false;
      return window.alert('Não foi possível limpar a marcação do Paxtu.');
    }
    scheduleRefresh(50);
  }

  document.addEventListener('click', async (event) => {
    const paxtu = event.target.closest('[data-paxtu-action]');
    if (paxtu) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const action = paxtu.dataset.paxtuAction;
      if (action === 'ok') await savePaxtuStatus(paxtu, PAXTU_OK);
      else if (action === 'adjust') await savePaxtuStatus(paxtu, PAXTU_ADJUST);
      else if (action === 'missing') await savePaxtuStatus(paxtu, PAXTU_MISSING);
      else if (action === 'clear') await clearPaxtuStatus(paxtu);
      return;
    }

    if (event.target.closest('#programmingButton, #programmingRefreshButton, #programEditorBackButton')) {
      scheduleRefresh(400);
    }
  }, true);

  const programmingView = $('programmingView');
  if (programmingView) {
    const viewObserver = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.attributeName === 'class') && !programmingView.classList.contains('hidden')) {
        scheduleRefresh(250);
      }
    });
    viewObserver.observe(programmingView, { attributes: true, attributeFilter: ['class'] });
  }

  runtime.client.auth.onAuthStateChange((_event, session) => {
    if (session) scheduleRefresh(700);
    else $('programPaxtuPanelV312')?.remove();
  });

  injectStyles();
  scheduleRefresh(700);
})();