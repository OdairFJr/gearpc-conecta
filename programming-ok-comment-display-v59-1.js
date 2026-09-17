(() => {
  if (window.__GEARPC_PROGRAMMING_OK_COMMENT_DISPLAY_V59_1__) return;
  window.__GEARPC_PROGRAMMING_OK_COMMENT_DISPLAY_V59_1__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let timer = null;

  const esc = (value) => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  async function waitRuntime() {
    for (let i = 0; i < 120; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.profile && x?.state?.user?.id) return x;
      await sleep(250);
    }
    return null;
  }

  async function isTestProfile() {
    if (rt.state.profile?.tipo === 'administrador') return false;
    const { data, error } = await rt.client.from('perfis_usuarios')
      .select('eh_teste').eq('user_id', rt.state.user.id).maybeSingle();
    return !error && data?.eh_teste === true;
  }

  async function decorate() {
    const host = $('programReviewHomeV55');
    const rows = host?.__reviewRows;
    if (!host || !Array.isArray(rows) || !rows.length) return;

    const approved = rows
      .map((r, index) => ({ ...r, __index: index }))
      .filter((r) => r.status === 'autorizada');
    if (!approved.length) return;

    const sectionIds = [...new Set(approved.map((r) => Number(r.secao_id)).filter(Boolean))];
    const dates = [...new Set(approved.map((r) => r.data_atividade).filter(Boolean))];
    const { data, error } = await rt.client.from('programacao_revisoes')
      .select('secao_id,data_atividade,status,observacao_teste')
      .in('secao_id', sectionIds)
      .in('data_atividade', dates)
      .eq('status', 'autorizada');
    if (error) return;

    const map = new Map((data || []).map((r) => [`${Number(r.secao_id)}|${r.data_atividade}`, r.observacao_teste || '']));
    approved.forEach((r) => {
      const card = host.querySelector(`[data-review-home-card="${r.__index}"]`);
      if (!card) return;
      const copy = card.querySelector('.program-review-home-copy-v55');
      if (!copy) return;
      copy.querySelector('.program-ok-comment-home-v59')?.remove();
      const text = map.get(`${Number(r.secao_id)}|${r.data_atividade}`) || '';
      if (!text) return;
      const note = document.createElement('p');
      note.className = 'program-review-home-note-v55 program-ok-comment-home-v59';
      note.innerHTML = `Comentário/aviso: ${esc(text)}`;
      copy.appendChild(note);
    });
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => { void decorate(); }, 120);
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt || !(await isTestProfile())) return;
    document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
    window.addEventListener('focus', schedule);
    const dashboard = $('dashboardView');
    if (dashboard) {
      new MutationObserver(schedule).observe(dashboard, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }
    setTimeout(schedule, 900);
  }

  void boot();
})();
