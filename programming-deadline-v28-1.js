(() => {
  const runtime = window.GEARPC_RUNTIME;
  if (!runtime?.client || !runtime?.state) return;

  const { client, state } = runtime;
  const $ = (id) => document.getElementById(id);
  const CANCEL_TYPE = 'cancelamento_programacao';
  let refreshTimer = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function isChief() {
    return state.profile?.tipo === 'chefia';
  }

  function isAdmin() {
    return state.profile?.tipo === 'administrador';
  }

  function injectStyles() {
    if ($('programDeadlineV281Styles')) return;
    const style = document.createElement('style');
    style.id = 'programDeadlineV281Styles';
    style.textContent = `
      .weekly-program-cancellations{margin:14px 0 18px;display:grid;gap:10px}
      .weekly-program-cancellation{background:#fff0ee;border:1px solid #e3aaa5;border-radius:14px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;justify-content:space-between;box-shadow:0 4px 14px rgba(0,0,0,.05)}
      .weekly-program-cancellation strong{display:block;color:#8f2d25;margin-bottom:4px}.weekly-program-cancellation p{margin:0;color:#6f3b36;line-height:1.4}.weekly-program-cancellation button{border:0;border-radius:10px;padding:9px 12px;background:#8f2d25;color:#fff;font-weight:700;cursor:pointer;white-space:nowrap}
      .program-auto-cancel-note{display:inline-flex;align-items:center;padding:8px 10px;border-radius:10px;background:#f4f6f8;color:#5d6874;font-size:.86rem;font-weight:700}
      @media(max-width:640px){.weekly-program-cancellation{flex-direction:column}.weekly-program-cancellation button{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function cancellationHost() {
    const dashboard = $('dashboardView');
    if (!dashboard) return null;
    let host = $('weeklyProgrammingCancellations');
    if (!host) {
      host = document.createElement('section');
      host.id = 'weeklyProgrammingCancellations';
      host.className = 'weekly-program-cancellations';
      const reminderHost = $('weeklyProgrammingReminders');
      if (reminderHost) reminderHost.insertAdjacentElement('afterend', host);
      else dashboard.querySelector('.launch-header')?.insertAdjacentElement('afterend', host);
    }
    return host;
  }

  async function loadCancellationNotices() {
    if (!state.user?.id || !isChief()) {
      const host = $('weeklyProgrammingCancellations');
      if (host) host.innerHTML = '';
      return;
    }

    const { data, error } = await client
      .from('notificacoes')
      .select('id,titulo,mensagem,secao_id,data_referencia,lida,criado_em')
      .eq('user_id', state.user.id)
      .eq('tipo', CANCEL_TYPE)
      .eq('lida', false)
      .order('criado_em', { ascending: false });

    const host = cancellationHost();
    if (!host) return;
    if (error || !data?.length) {
      host.innerHTML = '';
      return;
    }

    host.innerHTML = data.map((notice) => `
      <article class="weekly-program-cancellation" data-cancel-notice-id="${Number(notice.id)}">
        <div><strong>⛔ ${escapeHtml(notice.titulo || 'Atividade cancelada')}</strong><p>${escapeHtml(notice.mensagem || '')}</p></div>
        <button type="button" data-dismiss-cancel-notice="${Number(notice.id)}">Entendi</button>
      </article>
    `).join('');
  }

  async function dismissCancellation(id) {
    if (!state.user?.id) return;
    await client.from('notificacoes')
      .update({ lida: true })
      .eq('id', Number(id))
      .eq('user_id', state.user.id);
    document.querySelector(`[data-cancel-notice-id="${Number(id)}"]`)?.remove();
  }

  function patchProgrammingUi() {
    document.querySelectorAll('.program-deadline-note').forEach((note) => {
      if (note.textContent.includes('quinta-feira')) {
        note.innerHTML = 'Programações das atividades regulares de sábado devem ser lançadas até <strong>quinta-feira, às 20:00</strong>.';
      }
    });

    if (!isAdmin()) return;

    document.querySelectorAll('.program-review-card').forEach((card) => {
      const stateText = card.querySelector('.program-review-state')?.textContent?.trim() || '';
      const cancelled = stateText.includes('cancelada por falta de programação');
      const cancelButton = card.querySelector('[data-review-action="cancel"]');

      if (cancelButton) {
        if (cancelled) {
          cancelButton.remove();
        } else {
          const note = document.createElement('span');
          note.className = 'program-auto-cancel-note';
          note.textContent = 'Cancelamento automático quinta-feira às 20:00 se a programação não for lançada.';
          cancelButton.replaceWith(note);
        }
      }

      const clearButton = card.querySelector('[data-review-action="clear"]');
      if (clearButton && cancelled) {
        clearButton.textContent = 'Liberar após justificativa';
        clearButton.dataset.lateRelease = 'true';
      } else if (clearButton) {
        delete clearButton.dataset.lateRelease;
      }
    });
  }

  async function releaseAfterJustification(button) {
    if (!isAdmin()) return;
    const sectionId = Number(button.dataset.sectionId || 0);
    const date = button.dataset.date || '';
    if (!sectionId || !date) return;

    const ok = window.confirm('Liberar esta atividade após justificativa da chefia? Ela voltará a ficar aguardando programação/conferência.');
    if (!ok) return;

    button.disabled = true;
    try {
      const { error } = await client.from('programacao_revisoes')
        .delete()
        .eq('secao_id', sectionId)
        .eq('data_atividade', date)
        .eq('status', 'cancelada_sem_programacao');
      if (error) throw error;

      await client.from('notificacoes')
        .update({ lida: true })
        .eq('tipo', CANCEL_TYPE)
        .eq('secao_id', sectionId)
        .eq('data_referencia', date);

      $('programmingRefreshButton')?.click();
      window.setTimeout(patchProgrammingUi, 500);
    } catch (error) {
      console.error(error);
      window.alert('Não foi possível liberar a atividade após a justificativa.');
      button.disabled = false;
    }
  }

  function schedulePatch() {
    clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(patchProgrammingUi, 450);
  }

  function bindEvents() {
    document.addEventListener('click', async (event) => {
      const dismiss = event.target.closest('[data-dismiss-cancel-notice]');
      if (dismiss) {
        await dismissCancellation(dismiss.dataset.dismissCancelNotice);
        return;
      }

      const release = event.target.closest('[data-late-release="true"]');
      if (release) {
        event.preventDefault();
        event.stopImmediatePropagation();
        await releaseAfterJustification(release);
        return;
      }

      if (event.target.closest('#programmingButton, #programmingRefreshButton, #programEditorBackButton, .program-list-card, [data-review-action]')) {
        schedulePatch();
      }
    }, true);

    const panel = $('programmingView');
    if (panel) {
      const observer = new MutationObserver(schedulePatch);
      observer.observe(panel, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }
  }

  async function initializeForSession() {
    injectStyles();
    await loadCancellationNotices();
    schedulePatch();
  }

  injectStyles();
  bindEvents();
  client.auth.onAuthStateChange((_event, session) => {
    if (session) window.setTimeout(initializeForSession, 1150);
    else {
      const host = $('weeklyProgrammingCancellations');
      if (host) host.innerHTML = '';
    }
  });

  client.auth.getSession().then(({ data }) => {
    if (data?.session) window.setTimeout(initializeForSession, 1150);
  }).catch(() => {});
})();