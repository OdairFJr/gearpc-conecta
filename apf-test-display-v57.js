(() => {
  if (window.__GEARPC_APF_TEST_DISPLAY_V57__) return;
  window.__GEARPC_APF_TEST_DISPLAY_V57__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let configs = [];
  let assessments = [];
  let chiefs = [];
  let observer = null;
  let decorating = false;

  const esc = (value) => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  async function waitRuntime() {
    for (let i = 0; i < 120; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.profile && x?.state?.user) return x;
      await sleep(250);
    }
    return null;
  }

  async function isTestProfile() {
    const { data, error } = await rt.client
      .from('perfis_usuarios')
      .select('eh_teste')
      .eq('user_id', rt.state.user.id)
      .maybeSingle();
    return !error && data?.eh_teste === true;
  }

  function levelLabel(value) {
    if (value === 'avancado') return 'Avançado';
    if (value === 'intermediario') return 'Intermediário';
    return '';
  }

  function activeCount(chiefId) {
    return assessments.filter((a) => Number(a.apf_chefe_id) === Number(chiefId) && a.status === 'ativo').length;
  }

  function configFor(chiefId) {
    return configs.find((c) => Number(c.chefe_id) === Number(chiefId)) || null;
  }

  function chiefByName(name) {
    return chiefs.find((c) => String(c.nome_completo || '').trim() === String(name || '').trim()) || null;
  }

  async function loadData() {
    const [configRes, assessRes, chiefsRes] = await Promise.all([
      rt.client.from('apfs_disponiveis')
        .select('chefe_id,disponivel,preliminar_concluido,nivel_escotista,nivel_dirigente'),
      rt.client.from('apf_assessoramentos')
        .select('apf_chefe_id,status'),
      rt.client.from('chefes')
        .select('id,nome_completo,ativo')
        .eq('ativo', true)
    ]);
    const error = configRes.error || assessRes.error || chiefsRes.error;
    if (error) throw error;
    configs = configRes.data || [];
    assessments = assessRes.data || [];
    chiefs = chiefsRes.data || [];
  }

  function injectStyles() {
    if ($('apfTestDisplayStylesV57')) return;
    const style = document.createElement('style');
    style.id = 'apfTestDisplayStylesV57';
    style.textContent = `
      .apf-test-training-v57{display:grid;gap:6px;margin-top:11px;padding:10px 11px;border-radius:11px;background:#f4f8fc;border:1px solid #dce7f0;font-size:.82rem;color:#536a7e}
      .apf-test-training-v57 strong{color:#17324d}.apf-test-training-v57 .none{color:#7c8995}
      .apf-badge-v52.apf-test-lotado-v57{background:#f1f2f4;color:#68727b}
    `;
    document.head.appendChild(style);
  }

  function observeList(list) {
    if (!observer) observer = new MutationObserver(() => window.setTimeout(decorateCards, 0));
    observer.observe(list, { childList: true, subtree: true });
  }

  function decorateCards() {
    if (decorating) return;
    const list = $('apfListV52');
    if (!list) return;
    decorating = true;
    observer?.disconnect();
    try {
      let availableNow = 0;
      let totalShown = 0;

      list.querySelectorAll('.apf-card-v52').forEach((card) => {
        const name = card.querySelector('.apf-card-head-v52 strong')?.textContent?.trim() || '';
        const chief = chiefByName(name);
        if (!chief) return;
        const config = configFor(chief.id);
        if (!config?.disponivel) return;

        totalShown += 1;
        const used = activeCount(chief.id);
        const vacancies = Math.max(0, 4 - used);
        if (vacancies > 0) availableNow += 1;

        const badge = card.querySelector('.apf-badge-v52');
        if (badge) {
          badge.classList.toggle('full', vacancies === 0);
          badge.classList.toggle('apf-test-lotado-v57', vacancies === 0);
          const badgeText = vacancies === 0
            ? 'Lotado • 0 vagas'
            : `${vacancies} vaga${vacancies === 1 ? '' : 's'}`;
          if (badge.textContent !== badgeText) badge.textContent = badgeText;
        }

        let box = card.querySelector('.apf-test-training-v57');
        if (!box) {
          box = document.createElement('div');
          box.className = 'apf-test-training-v57';
          const meta = card.querySelector('.apf-meta-v52');
          if (meta) meta.insertAdjacentElement('afterend', box);
          else card.appendChild(box);
        }

        const training = [];
        if (config.preliminar_concluido) training.push('<div><strong>Preliminar:</strong> pode assessorar</div>');
        const escLevel = levelLabel(config.nivel_escotista);
        const dirLevel = levelLabel(config.nivel_dirigente);
        if (escLevel) training.push(`<div><strong>Linha Escotista:</strong> até ${esc(escLevel)}</div>`);
        if (dirLevel) training.push(`<div><strong>Linha Dirigente:</strong> até ${esc(dirLevel)}</div>`);
        if (!training.length) training.push('<div class="none">Formação habilitante ainda não informada.</div>');
        const trainingHtml = training.join('');
        if (box.innerHTML !== trainingHtml) box.innerHTML = trainingHtml;
      });

      const summary = $('apfSummaryV52');
      if (summary && totalShown) {
        const lotados = Math.max(0, totalShown - availableNow);
        const summaryText = lotados
          ? `${availableNow} APF${availableNow === 1 ? '' : 's'} com vaga no momento • ${lotados} lotado${lotados === 1 ? '' : 's'}.`
          : `${availableNow} APF${availableNow === 1 ? '' : 's'} com vaga no momento.`;
        if (summary.textContent !== summaryText) summary.textContent = summaryText;
      }
    } finally {
      decorating = false;
      observeList(list);
    }
  }

  async function refresh() {
    try {
      await loadData();
      decorateCards();
    } catch (error) {
      console.warn('GEArPC APF test display v57', error);
    }
  }

  function watchList() {
    const list = $('apfListV52');
    if (!list) return;
    observeList(list);
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt || !(await isTestProfile())) return;
    injectStyles();
    watchList();

    document.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('#apfButtonV52')) {
        window.setTimeout(refresh, 250);
      }
    });

    await refresh();
    window.setTimeout(() => { watchList(); decorateCards(); }, 700);
  }

  void boot();
})();
