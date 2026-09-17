(() => {
  if (window.__GEARPC_SAFETY_COORDINATOR_V69__) return;
  window.__GEARPC_SAFETY_COORDINATOR_V69__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let currentVisitId = null;
  let adultNames = [];

  function storageKey() {
    return `gearpc-safety-test-v63:${rt?.state?.user?.id || 'local'}`;
  }

  function adultsCacheKey() {
    return 'gearpc-safety-active-adults-v69';
  }

  function readStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey()) || '{}');
      return {
        visits: Array.isArray(parsed.visits) ? parsed.visits : [],
        plans: Array.isArray(parsed.plans) ? parsed.plans : []
      };
    } catch (_) {
      return { visits: [], plans: [] };
    }
  }

  function writeStore(store) {
    localStorage.setItem(storageKey(), JSON.stringify(store));
  }

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  async function waitReady() {
    for (let i = 0; i < 160; i += 1) {
      const current = window.GEARPC_RUNTIME;
      if (current?.client && current?.state?.user && $('safetyVisitFormV63') && $('svActivityTypeV63')) return current;
      await sleep(250);
    }
    return null;
  }

  function cachedAdults() {
    try {
      const list = JSON.parse(localStorage.getItem(adultsCacheKey()) || '[]');
      return Array.isArray(list) ? list.filter(Boolean) : [];
    } catch (_) {
      return [];
    }
  }

  function stateAdults() {
    const names = (rt?.state?.chefes || [])
      .filter((chief) => chief.ativo !== false)
      .map((chief) => String(chief.nome_completo || '').trim())
      .filter(Boolean);
    const me = String(rt?.state?.profile?.nome_completo || '').trim();
    if (me) names.push(me);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  async function loadAdults() {
    const fallback = [...new Set([...stateAdults(), ...cachedAdults()])]
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    adultNames = fallback;
    renderCoordinatorOptions($('svCoordinatorV69')?.value || '');

    if (!navigator.onLine) return;
    try {
      const { data, error } = await rt.client
        .from('chefes')
        .select('nome_completo,ativo')
        .eq('ativo', true)
        .order('nome_completo');
      if (error) throw error;
      const fetched = (data || [])
        .map((row) => String(row.nome_completo || '').trim())
        .filter(Boolean);
      const me = String(rt?.state?.profile?.nome_completo || '').trim();
      if (me) fetched.push(me);
      adultNames = [...new Set(fetched)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      localStorage.setItem(adultsCacheKey(), JSON.stringify(adultNames));
      renderCoordinatorOptions($('svCoordinatorV69')?.value || '');
    } catch (_) {}
  }

  function renderCoordinatorOptions(selected = '') {
    const select = $('svCoordinatorV69');
    if (!select) return;
    const previous = selected || select.value || '';
    const extra = previous && !adultNames.includes(previous) ? [previous] : [];
    select.innerHTML = [
      '<option value="">Selecione</option>',
      ...[...extra, ...adultNames].map((name) => `<option value="${esc(name)}">${esc(name)}</option>`)
    ].join('');
    if (previous) select.value = previous;
  }

  function installField() {
    if ($('svCoordinatorV69')) return;
    const activityTypeLabel = $('svActivityTypeV63')?.closest('label');
    if (!activityTypeLabel) return;
    activityTypeLabel.insertAdjacentHTML('afterend', `
      <label>Coordenador da atividade
        <select id="svCoordinatorV69"><option value="">Selecione</option></select>
      </label>`);
  }

  function visitById(id) {
    return readStore().visits.find((visit) => visit.id === id) || null;
  }

  function hydrateVisit(id = null) {
    currentVisitId = id || null;
    const visit = id ? visitById(id) : null;
    renderCoordinatorOptions(visit?.coordinator || '');
  }

  function saveCoordinatorAfterVisitSubmit(beforeIds, coordinator) {
    window.setTimeout(() => {
      const store = readStore();
      let visit = currentVisitId ? store.visits.find((item) => item.id === currentVisitId) : null;
      if (!visit) visit = store.visits.find((item) => !beforeIds.has(item.id));
      if (!visit) visit = [...store.visits].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))[0];
      if (!visit) return;
      visit.coordinator = coordinator;
      writeStore(store);
      currentVisitId = visit.id;
    }, 10);
  }

  function applyCoordinatorToPlan(visitId) {
    const visit = visitById(visitId);
    const coordinator = String(visit?.coordinator || '').trim();
    if (!coordinator) return;
    window.setTimeout(() => {
      const select = $('spCoordinatorV63');
      if (!select) return;
      if (![...select.options].some((option) => option.value === coordinator)) {
        select.insertAdjacentHTML('beforeend', `<option value="${esc(coordinator)}">${esc(coordinator)}</option>`);
      }
      select.value = coordinator;
    }, 80);
  }

  function wire() {
    document.addEventListener('click', (event) => {
      const newVisit = event.target.closest('#newSafetyVisitV63');
      const editVisit = event.target.closest('[data-edit-visit]');
      const planFromVisit = event.target.closest('[data-plan-from-visit]');

      if (newVisit) {
        currentVisitId = null;
        window.setTimeout(() => hydrateVisit(null), 0);
      }
      if (editVisit) {
        currentVisitId = editVisit.dataset.editVisit || null;
        window.setTimeout(() => hydrateVisit(currentVisitId), 0);
      }
      if (planFromVisit) applyCoordinatorToPlan(planFromVisit.dataset.planFromVisit);
    }, true);

    $('safetyVisitFormV63')?.addEventListener('submit', () => {
      const beforeIds = new Set(readStore().visits.map((visit) => visit.id));
      const coordinator = String($('svCoordinatorV69')?.value || '').trim();
      saveCoordinatorAfterVisitSubmit(beforeIds, coordinator);
    }, true);
  }

  async function boot() {
    rt = await waitReady();
    if (!rt) return;
    installField();
    renderCoordinatorOptions('');
    wire();
    await loadAdults();
  }

  void boot();
})();