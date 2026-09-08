(() => {
  const runtime = window.GEARPC_RUNTIME;
  if (!runtime?.client || !runtime?.state) return;

  const { client, state } = runtime;
  const $ = (id) => document.getElementById(id);
  const REMINDER_TYPE = 'lembrete_programacao';
  const REVIEW_STATES = {
    autorizada: { label: 'Atividade conferida e autorizada', cls: 'ok' },
    nao_autorizada: { label: 'Atividade conferida e não autorizada', cls: 'no' },
    cancelada_sem_programacao: { label: 'Atividade cancelada por falta de programação', cls: 'cancel' }
  };

  let refreshTimer = null;
  let authTimer = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function isAdmin() {
    return state.profile?.tipo === 'administrador';
  }

  function isChief() {
    return state.profile?.tipo === 'chefia';
  }

  function saoPauloDateParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const get = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
    return { year: get('year'), month: get('month'), day: get('day') };
  }

  function localTodayDate() {
    const p = saoPauloDateParts();
    return new Date(Date.UTC(p.year, p.month - 1, p.day, 12, 0, 0));
  }

  function formatYmd(date) {
    return date.toISOString().slice(0, 10);
  }

  function nextSaturdayYmd() {
    const base = localTodayDate();
    const dow = base.getUTCDay();
    const diff = (6 - dow + 7) % 7;
    base.setUTCDate(base.getUTCDate() + diff);
    return formatYmd(base);
  }

  function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = String(iso).split('-');
    return y && m && d ? `${d}/${m}/${y}` : String(iso);
  }

  function injectStyles() {
    if ($('programReviewV28Styles')) return;
    const style = document.createElement('style');
    style.id = 'programReviewV28Styles';
    style.textContent = `
      .weekly-program-reminders{margin:14px 0 18px;display:grid;gap:10px}.weekly-program-reminder{background:#fff7d6;border:1px solid #e7c96a;border-radius:14px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;justify-content:space-between;box-shadow:0 4px 14px rgba(0,0,0,.05)}.weekly-program-reminder strong{display:block;color:#6d5200;margin-bottom:4px}.weekly-program-reminder p{margin:0;color:#5f532d;line-height:1.4}.weekly-program-reminder button{border:0;border-radius:10px;padding:9px 12px;background:#0a376c;color:#fff;font-weight:700;cursor:pointer;white-space:nowrap}
      .program-weekly-review{margin:16px 0 20px;background:#fff;border:1px solid #d7e0eb;border-radius:18px;padding:16px;box-shadow:0 5px 18px rgba(10,55,108,.06)}.program-weekly-review h3{margin:0 0 5px;color:#0a376c}.program-weekly-review .review-intro{margin:0 0 14px;color:#546579}.program-weekly-grid{display:grid;gap:12px}.program-review-card{border:1px solid #dfe6ee;border-radius:14px;padding:14px;background:#fbfcfe}.program-review-card-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:9px}.program-review-card-head strong{font-size:1rem}.program-review-card-head small{display:block;color:#66788b;margin-top:3px}.program-review-state{font-size:.78rem;font-weight:800;border-radius:999px;padding:5px 9px;background:#eef2f6;color:#556575}.program-review-state.ok{background:#e6f6ec;color:#176b38}.program-review-state.no{background:#ffe9e7;color:#9d2c24}.program-review-state.cancel{background:#f4ece7;color:#7a4930}.program-review-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.program-review-actions button{border:0;border-radius:10px;padding:9px 11px;font-weight:700;cursor:pointer}.review-authorize{background:#1f7a45;color:#fff}.review-deny{background:#a5322a;color:#fff}.review-cancel{background:#6b4b38;color:#fff}.review-clear{background:#e9eef4;color:#31475e}.program-review-note{margin:8px 0 0;color:#77443e;font-size:.9rem}.program-deadline-note{margin:14px 0;padding:12px 14px;border-radius:12px;background:#eef5ff;border:1px solid #c8dcf7;color:#173f70;font-weight:700}.program-editor-review-status{margin:12px 0 4px;padding:12px 14px;border-radius:12px;border:1px solid #d9e1ea;background:#f7f9fb}.program-editor-review-status.ok{border-color:#b8dfc6;background:#edf8f1;color:#176b38}.program-editor-review-status.no{border-color:#f0c3bf;background:#fff0ee;color:#8f2d25}.program-editor-review-status.cancel{border-color:#d9c7bb;background:#f8f1ec;color:#724631}.program-editor-review-status.pending{color:#4f6173}
      @media(max-width:640px){.weekly-program-reminder{flex-direction:column}.weekly-program-reminder button{width:100%}.program-review-card-head{flex-direction:column}.program-review-actions button{flex:1 1 100%}}
    `;
    document.head.appendChild(style);
  }

  function dashboardReminderHost() {
    const dashboard = $('dashboardView');
    if (!dashboard) return null;
    let host = $('weeklyProgrammingReminders');
    if (!host) {
      host = document.createElement('section');
      host.id = 'weeklyProgrammingReminders';
      host.className = 'weekly-program-reminders';
      const header = dashboard.querySelector('.launch-header');
      header?.insertAdjacentElement('afterend', host);
    }
    return host;
  }

  async function loadReminders() {
    if (!state.user?.id || !isChief()) {
      const host = $('weeklyProgrammingReminders');
      if (host) host.innerHTML = '';
      return;
    }

    const { data: notices, error } = await client
      .from('notificacoes')
      .select('id,titulo,mensagem,secao_id,data_referencia,lida,criado_em')
      .eq('user_id', state.user.id)
      .eq('tipo', REMINDER_TYPE)
      .eq('lida', false)
      .order('criado_em', { ascending: false });
    if (error || !notices?.length) {
      const host = $('weeklyProgrammingReminders');
      if (host) host.innerHTML = '';
      return;
    }

    const sectionIds = [...new Set(notices.map((n) => Number(n.secao_id)).filter(Boolean))];
    const dates = [...new Set(notices.map((n) => n.data_referencia).filter(Boolean))];
    let launched = [];
    if (sectionIds.length && dates.length) {
      const { data } = await client.from('programacoes')
        .select('secao_id,data_atividade')
        .in('secao_id', sectionIds)
        .in('data_atividade', dates);
      launched = data || [];
    }

    const obsolete = [];
    const active = notices.filter((notice) => {
      const alreadyDone = launched.some((p) => Number(p.secao_id) === Number(notice.secao_id) && p.data_atividade === notice.data_referencia);
      if (alreadyDone) obsolete.push(notice.id);
      return !alreadyDone;
    });

    if (obsolete.length) {
      await client.from('notificacoes').update({ lida: true }).in('id', obsolete).eq('user_id', state.user.id);
    }

    const host = dashboardReminderHost();
    if (!host) return;
    host.innerHTML = active.map((notice) => `
      <article class="weekly-program-reminder" data-notice-id="${Number(notice.id)}">
        <div><strong>⏰ ${escapeHtml(notice.titulo || 'Programação pendente')}</strong><p>${escapeHtml(notice.mensagem || '')}</p></div>
        <button type="button" data-dismiss-notice="${Number(notice.id)}">Entendi</button>
      </article>
    `).join('');
  }

  async function dismissReminder(id) {
    if (!state.user?.id) return;
    await client.from('notificacoes').update({ lida: true }).eq('id', Number(id)).eq('user_id', state.user.id);
    document.querySelector(`[data-notice-id="${Number(id)}"]`)?.remove();
  }

  function ensureProgrammingPanel() {
    const view = $('programmingView');
    if (!view) return null;
    let panel = $('programWeeklyReviewPanel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'programWeeklyReviewPanel';
      const roleNote = $('programmingRoleNote');
      roleNote?.insertAdjacentElement('afterend', panel);
    }
    return panel;
  }

  async function fetchWeeklyData(date) {
    const [sectionsRes, programsRes, reviewsRes] = await Promise.all([
      client.from('secoes').select('id,nome,ramo_id,ativo').eq('ativo', true).order('id'),
      client.from('programacoes').select('id,secao_id,data_atividade,horario_inicio,horario_termino,atualizado_em').eq('data_atividade', date),
      client.from('programacao_revisoes').select('id,secao_id,data_atividade,status,observacao,revisado_por,revisado_em,atualizado_em').eq('data_atividade', date)
    ]);
    const firstError = [sectionsRes, programsRes, reviewsRes].find((r) => r.error)?.error;
    if (firstError) throw firstError;
    return {
      sections: sectionsRes.data || [],
      programs: programsRes.data || [],
      reviews: reviewsRes.data || []
    };
  }

  async function refreshWeeklyPanel() {
    const panel = ensureProgrammingPanel();
    if (!panel || !state.profile) return;
    const saturday = nextSaturdayYmd();

    if (!isAdmin()) {
      panel.className = 'program-deadline-note';
      panel.innerHTML = `Programações das atividades regulares de sábado devem ser lançadas até <strong>quinta-feira, às 18:00</strong>.`;
      return;
    }

    panel.className = 'program-weekly-review';
    panel.innerHTML = `<h3>Conferência semanal</h3><p class="review-intro">Atividades regulares de sábado ${escapeHtml(formatDate(saturday))}. Confira as programações antes da reunião.</p><div class="program-weekly-grid"><div>Carregando…</div></div>`;

    try {
      const { sections, programs, reviews } = await fetchWeeklyData(saturday);
      const grid = panel.querySelector('.program-weekly-grid');
      grid.innerHTML = sections.map((section) => {
        const program = programs.find((p) => Number(p.secao_id) === Number(section.id));
        const review = reviews.find((r) => Number(r.secao_id) === Number(section.id));
        const reviewState = review ? REVIEW_STATES[review.status] : null;
        const stateHtml = reviewState
          ? `<span class="program-review-state ${reviewState.cls}">${escapeHtml(reviewState.label)}</span>`
          : `<span class="program-review-state">Aguardando conferência</span>`;
        const meta = program
          ? `Programação lançada • ${String(program.horario_inicio || '').slice(0,5)}–${String(program.horario_termino || '').slice(0,5)}`
          : 'Programação ainda não lançada';
        const actions = program
          ? `<button class="review-authorize" data-review-action="authorize" data-section-id="${section.id}" data-date="${saturday}">✓ Conferida e autorizada</button>
             <button class="review-deny" data-review-action="deny" data-section-id="${section.id}" data-date="${saturday}">✕ Conferida e não autorizada</button>`
          : `<button class="review-cancel" data-review-action="cancel" data-section-id="${section.id}" data-date="${saturday}">Cancelar por falta de programação</button>`;
        const clear = review ? `<button class="review-clear" data-review-action="clear" data-section-id="${section.id}" data-date="${saturday}">Desfazer decisão</button>` : '';
        const note = review?.observacao ? `<p class="program-review-note"><strong>Observação:</strong> ${escapeHtml(review.observacao)}</p>` : '';
        return `<article class="program-review-card">
          <div class="program-review-card-head"><div><strong>${escapeHtml(section.nome)}</strong><small>${escapeHtml(meta)}</small></div>${stateHtml}</div>
          ${note}
          <div class="program-review-actions">${actions}${clear}</div>
        </article>`;
      }).join('');
    } catch (error) {
      console.error('Falha na conferência semanal:', error);
      const grid = panel.querySelector('.program-weekly-grid');
      if (grid) grid.innerHTML = '<div>Não foi possível carregar a conferência semanal.</div>';
    }
  }

  async function saveReview(sectionId, date, status, observation = null) {
    if (!isAdmin() || !state.user?.id) return;
    const payload = {
      secao_id: Number(sectionId),
      data_atividade: date,
      status,
      observacao: observation || null,
      revisado_por: state.user.id,
      revisado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    };
    const { error } = await client.from('programacao_revisoes').upsert(payload, { onConflict: 'secao_id,data_atividade' });
    if (error) {
      window.alert('Não foi possível salvar a conferência da atividade.');
      console.error(error);
      return;
    }
    await refreshWeeklyPanel();
    await refreshEditorReviewStatus();
  }

  async function clearReview(sectionId, date) {
    if (!isAdmin()) return;
    const ok = window.confirm('Desfazer esta decisão e deixar a atividade aguardando conferência novamente?');
    if (!ok) return;
    const { error } = await client.from('programacao_revisoes').delete().eq('secao_id', Number(sectionId)).eq('data_atividade', date);
    if (error) {
      window.alert('Não foi possível desfazer a decisão.');
      return;
    }
    await refreshWeeklyPanel();
    await refreshEditorReviewStatus();
  }

  async function handleReviewAction(button) {
    const action = button.dataset.reviewAction;
    const sectionId = Number(button.dataset.sectionId);
    const date = button.dataset.date;
    if (!action || !sectionId || !date) return;
    if (action === 'authorize') {
      await saveReview(sectionId, date, 'autorizada');
      return;
    }
    if (action === 'deny') {
      const reason = window.prompt('Informe por que a atividade não foi autorizada:');
      if (reason === null) return;
      if (!reason.trim()) {
        window.alert('A observação é obrigatória quando a atividade não é autorizada.');
        return;
      }
      await saveReview(sectionId, date, 'nao_autorizada', reason.trim());
      return;
    }
    if (action === 'cancel') {
      const ok = window.confirm('Confirmar o cancelamento desta atividade por falta de programação?');
      if (!ok) return;
      await saveReview(sectionId, date, 'cancelada_sem_programacao', 'Atividade cancelada por falta de programação dentro do prazo.');
      return;
    }
    if (action === 'clear') {
      await clearReview(sectionId, date);
    }
  }

  function ensureEditorStatus() {
    const card = $('programEditorView')?.querySelector('.program-editor-card');
    if (!card) return null;
    let box = $('programEditorReviewStatus');
    if (!box) {
      box = document.createElement('div');
      box.id = 'programEditorReviewStatus';
      box.className = 'program-editor-review-status pending';
      const titleRow = card.querySelector('.program-editor-title-row');
      titleRow?.insertAdjacentElement('afterend', box);
    }
    return box;
  }

  async function refreshEditorReviewStatus() {
    const view = $('programEditorView');
    if (!view || view.classList.contains('hidden')) return;
    const box = ensureEditorStatus();
    const sectionId = Number($('programEditorSection')?.value || 0);
    const date = $('programEditorDate')?.value || '';
    if (!box || !sectionId || !date) return;

    const { data, error } = await client.from('programacao_revisoes')
      .select('status,observacao,revisado_em')
      .eq('secao_id', sectionId)
      .eq('data_atividade', date)
      .maybeSingle();
    if (error || !data) {
      box.className = 'program-editor-review-status pending';
      box.innerHTML = '<strong>Status da conferência:</strong> aguardando revisão da administração.';
      return;
    }
    const info = REVIEW_STATES[data.status] || { label: data.status, cls: 'pending' };
    box.className = `program-editor-review-status ${info.cls}`;
    box.innerHTML = `<strong>Status da conferência:</strong> ${escapeHtml(info.label)}${data.observacao ? `<br><span>${escapeHtml(data.observacao)}</span>` : ''}`;
  }

  function scheduleProgrammingRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
      await refreshWeeklyPanel();
      await refreshEditorReviewStatus();
    }, 350);
  }

  function bindEvents() {
    document.addEventListener('click', async (event) => {
      const dismiss = event.target.closest('[data-dismiss-notice]');
      if (dismiss) {
        await dismissReminder(dismiss.dataset.dismissNotice);
        return;
      }
      const review = event.target.closest('[data-review-action]');
      if (review) {
        review.disabled = true;
        try { await handleReviewAction(review); } finally { review.disabled = false; }
        return;
      }
      if (event.target.closest('#programmingButton, #programmingRefreshButton, #programEditorBackButton, .program-list-card')) {
        scheduleProgrammingRefresh();
      }
    });

    $('programEditorSection')?.addEventListener('change', scheduleProgrammingRefresh);
    $('programEditorDate')?.addEventListener('change', scheduleProgrammingRefresh);

    const programmingView = $('programmingView');
    const editorView = $('programEditorView');
    if (programmingView || editorView) {
      const observer = new MutationObserver(() => scheduleProgrammingRefresh());
      if (programmingView) observer.observe(programmingView, { attributes: true, attributeFilter: ['class'] });
      if (editorView) observer.observe(editorView, { attributes: true, attributeFilter: ['class'] });
    }
  }

  async function initializeForSession() {
    clearTimeout(authTimer);
    authTimer = setTimeout(async () => {
      injectStyles();
      await loadReminders();
      scheduleProgrammingRefresh();
    }, 900);
  }

  injectStyles();
  bindEvents();
  client.auth.onAuthStateChange((_event, session) => {
    if (session) initializeForSession();
    else {
      const host = $('weeklyProgrammingReminders');
      if (host) host.innerHTML = '';
    }
  });

  client.auth.getSession().then(({ data }) => {
    if (data?.session) initializeForSession();
  }).catch(() => {});
})();
