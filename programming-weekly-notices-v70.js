(() => {
  if (window.__GEARPC_WEEKLY_PROGRAM_NOTICES_V70__) return;
  window.__GEARPC_WEEKLY_PROGRAM_NOTICES_V70__ = true;

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let rt = null;
  let refreshTimer = null;
  let intervalId = null;

  const esc = (value) => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'","&#039;");

  async function waitRuntime() {
    for (let i = 0; i < 160; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state) return x;
      await sleep(100);
    }
    return null;
  }

  function todayIso() {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function injectStyles() {
    if ($('weeklyProgramNoticesV70Styles')) return;
    const style = document.createElement('style');
    style.id = 'weeklyProgramNoticesV70Styles';
    style.textContent = `
      .weekly-program-notices-v70{margin:14px 0 18px;display:grid;gap:10px}
      .weekly-program-notice-v70{border-radius:14px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;justify-content:space-between;box-shadow:0 4px 14px rgba(0,0,0,.05)}
      .weekly-program-notice-v70.reminder{background:#fff8dc;border:1px solid #e6cb76}
      .weekly-program-notice-v70.overdue{background:#fff0ed;border:1px solid #dfa39a}
      .weekly-program-notice-v70 strong{display:block;margin-bottom:4px;color:#594a13}
      .weekly-program-notice-v70.overdue strong{color:#8b2e25}
      .weekly-program-notice-v70 p{margin:0;color:#5d5844;line-height:1.4}
      .weekly-program-notice-v70 button{border:0;border-radius:10px;padding:9px 12px;background:#0a376c;color:#fff;font-weight:800;cursor:pointer;white-space:nowrap}
      @media(max-width:640px){.weekly-program-notice-v70{flex-direction:column}.weekly-program-notice-v70 button{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function host() {
    const dashboard = $('dashboardView');
    if (!dashboard) return null;
    let el = $('weeklyProgrammingRemindersV70');
    if (!el) {
      el = document.createElement('section');
      el.id = 'weeklyProgrammingRemindersV70';
      el.className = 'weekly-program-notices-v70';
      const serviceCard = $('serviceBranchCardV30');
      if (serviceCard) serviceCard.insertAdjacentElement('afterend', el);
      else dashboard.querySelector('.launch-header')?.insertAdjacentElement('afterend', el);
    }
    return el;
  }

  async function currentSectionIds() {
    const chiefId = Number(rt?.state?.profile?.chefe_id || 0);
    if (!chiefId) return new Set();
    const { data, error } = await rt.client.from('chefe_secoes')
      .select('secao_id')
      .eq('chefe_id', chiefId);
    if (error) throw error;
    return new Set((data || []).map((row) => Number(row.secao_id)).filter(Boolean));
  }

  async function markRead(ids) {
    if (!ids.length || !rt?.state?.user?.id) return;
    await rt.client.from('notificacoes')
      .update({ lida:true })
      .in('id', ids)
      .eq('user_id', rt.state.user.id);
  }

  async function loadNotices() {
    const el = host();
    if (!el) return;

    const profile = rt?.state?.profile;
    const userId = rt?.state?.user?.id;
    if (!userId || profile?.tipo !== 'chefia' || !profile?.chefe_id) {
      el.innerHTML = '';
      return;
    }

    try {
      const sectionIds = await currentSectionIds();
      if (!sectionIds.size) {
        el.innerHTML = '';
        return;
      }

      const { data, error } = await rt.client.from('notificacoes')
        .select('id,tipo,titulo,mensagem,secao_id,data_referencia,lida,criado_em')
        .eq('user_id', userId)
        .in('tipo', ['lembrete_programacao','cancelamento_programacao'])
        .eq('lida', false)
        .gte('data_referencia', todayIso())
        .order('data_referencia', { ascending:true })
        .order('criado_em', { ascending:false });

      if (error) throw error;

      const rows = data || [];
      const stale = rows.filter((n) => !sectionIds.has(Number(n.secao_id))).map((n) => Number(n.id)).filter(Boolean);
      const active = rows.filter((n) => sectionIds.has(Number(n.secao_id)));

      if (stale.length) void markRead(stale);

      el.innerHTML = active.map((notice) => {
        const overdue = notice.tipo === 'cancelamento_programacao';
        return `
          <article class="weekly-program-notice-v70 ${overdue ? 'overdue' : 'reminder'}" data-weekly-notice-v70="${Number(notice.id)}">
            <div>
              <strong>${overdue ? '⏰' : '📅'} ${esc(notice.titulo || (overdue ? 'Programação não lançada no prazo' : 'Programação pendente'))}</strong>
              <p>${esc(notice.mensagem || '')}</p>
            </div>
            <button type="button" data-weekly-notice-dismiss-v70="${Number(notice.id)}">Entendi</button>
          </article>`;
      }).join('');
    } catch (error) {
      console.error('GEArPC avisos semanais:', error);
      el.innerHTML = '';
    }
  }

  async function dismiss(id) {
    if (!rt?.state?.user?.id) return;
    const { error } = await rt.client.from('notificacoes')
      .update({ lida:true })
      .eq('id', Number(id))
      .eq('user_id', rt.state.user.id);
    if (!error) document.querySelector(`[data-weekly-notice-v70="${Number(id)}"]`)?.remove();
  }

  function scheduleRefresh(delay = 100) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => { void loadNotices(); }, delay);
  }

  function bind() {
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const dismissButton = event.target.closest('[data-weekly-notice-dismiss-v70]');
      if (dismissButton) {
        event.preventDefault();
        void dismiss(dismissButton.dataset.weeklyNoticeDismissV70);
        return;
      }
      if (event.target.closest('#dashboardButton,#programmingBackButton,#programEditorBackButton,#serviceBranchCardV30')) {
        scheduleRefresh(150);
      }
    }, true);

    window.addEventListener('focus', () => scheduleRefresh(100));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) scheduleRefresh(100);
    });

    const dashboard = $('dashboardView');
    if (dashboard) {
      new MutationObserver(() => {
        if (!dashboard.classList.contains('hidden')) scheduleRefresh(120);
      }).observe(dashboard, { attributes:true, attributeFilter:['class'] });
    }

    rt.client.auth.onAuthStateChange((_event, session) => {
      if (session) scheduleRefresh(700);
      else {
        const el = $('weeklyProgrammingRemindersV70');
        if (el) el.innerHTML = '';
      }
    });

    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      if (!document.hidden) scheduleRefresh(0);
    }, 60000);
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt) return;
    injectStyles();
    bind();
    const { data } = await rt.client.auth.getSession();
    if (data?.session) scheduleRefresh(700);
  }

  void boot();
})();