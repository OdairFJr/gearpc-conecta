(() => {
  if (window.__GEARPC_SAFETY_UNIFIED_FLOW_V66__) return;
  window.__GEARPC_SAFETY_UNIFIED_FLOW_V66__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let pendingNewPlanning = false;

  async function waitReady() {
    for (let i = 0; i < 160; i += 1) {
      if ($('safetyViewV63') && $('safetyVisitsPanelV63') && $('safetyPlansPanelV63') && $('safetyVisitFormV63') && $('safetyPlanFormV63')) return true;
      await sleep(250);
    }
    return false;
  }

  function readStore() {
    const rt = window.GEARPC_RUNTIME;
    const key = `gearpc-safety-test-v63:${rt?.state?.user?.id || 'local'}`;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '{}');
      return {
        visits: Array.isArray(parsed.visits) ? parsed.visits : [],
        plans: Array.isArray(parsed.plans) ? parsed.plans : []
      };
    } catch (_) {
      return { visits: [], plans: [] };
    }
  }

  function newestVisitId(previousIds) {
    const store = readStore();
    const added = store.visits.filter((visit) => !previousIds.has(visit.id));
    if (added.length) return [...added].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))[0]?.id || null;
    return [...store.visits].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))[0]?.id || null;
  }

  function refreshUnifiedUi() {
    const tabs = document.querySelector('.safety-tabs-v63');
    if (tabs) tabs.style.display = 'none';
    $('safetyPlansPanelV63')?.classList.add('hidden');
    $('safetyVisitsPanelV63')?.classList.remove('hidden');

    const heroTitle = document.querySelector('#safetyViewV63 .members-hero h2');
    const heroText = document.querySelector('#safetyViewV63 .members-hero p');
    if (heroTitle) heroTitle.textContent = 'Planejamento de segurança da atividade';
    if (heroText) heroText.textContent = 'Cada atividade reúne obrigatoriamente a visita técnica do local e o respectivo plano de segurança.';

    const panelTitle = document.querySelector('#safetyVisitsPanelV63 .safety-panel-head-v63 h3');
    const panelText = document.querySelector('#safetyVisitsPanelV63 .safety-panel-head-v63 p');
    if (panelTitle) panelTitle.textContent = 'Planejamentos de segurança';
    if (panelText) panelText.textContent = 'A visita técnica é obrigatória e, ao ser salva, o aplicativo segue para o plano de segurança da mesma atividade.';

    const newVisit = $('newSafetyVisitV63');
    if (newVisit) newVisit.textContent = '＋ Novo planejamento';

    const newPlan = $('newSafetyPlanV63');
    if (newPlan) newPlan.style.display = 'none';

    document.querySelectorAll('[data-plan-from-visit]').forEach((button) => {
      button.textContent = 'Abrir plano';
    });

    const baseSection = $('spBaseVisitV63')?.closest('.safety-section-v63');
    if (baseSection) baseSection.style.display = 'none';
  }

  function pairedPlanForVisit(visitId) {
    return readStore().plans.find((plan) => plan.baseVisitId === visitId) || null;
  }

  function openPlanForVisit(visitId) {
    if (!visitId) return;
    const paired = pairedPlanForVisit(visitId);
    const createButton = document.querySelector(`[data-plan-from-visit="${CSS.escape(visitId)}"]`);
    if (paired) {
      const planEdit = document.querySelector(`[data-edit-plan="${CSS.escape(paired.id)}"]`);
      if (planEdit) return planEdit.click();
    }
    if (createButton) return createButton.click();

    const select = $('spBaseVisitV63');
    const planButton = $('newSafetyPlanV63');
    if (select && planButton) {
      planButton.click();
      window.setTimeout(() => {
        select.value = visitId;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }, 30);
    }
  }

  function decorateCards() {
    const cards = [...document.querySelectorAll('#safetyVisitsListV63 .safety-card-v63')];
    cards.forEach((card) => {
      const edit = card.querySelector('[data-edit-visit]');
      if (!edit) return;
      const visitId = edit.dataset.editVisit;
      const paired = pairedPlanForVisit(visitId);
      let badge = card.querySelector('.safety-pair-status-v66');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'safety-pill-v63 safety-pair-status-v66';
        card.querySelector('.safety-counts-v63')?.appendChild(badge);
        if (!badge.parentElement || !badge.parentElement.classList.contains('safety-counts-v63')) {
          card.querySelector('.meta')?.insertAdjacentElement('afterend', badge);
        }
      }
      badge.classList.toggle('ok', Boolean(paired));
      badge.classList.toggle('warn', !paired);
      badge.textContent = paired ? 'Plano vinculado' : 'Plano pendente';

      const planButton = card.querySelector('[data-plan-from-visit]');
      if (planButton) planButton.textContent = paired ? 'Abrir plano' : 'Completar plano';
    });
  }

  function installObserver() {
    const list = $('safetyVisitsListV63');
    if (!list) return;
    const observer = new MutationObserver(() => {
      refreshUnifiedUi();
      decorateCards();
    });
    observer.observe(list, { childList: true, subtree: true });
  }

  function wire() {
    document.addEventListener('click', (event) => {
      const newPlanning = event.target.closest('#newSafetyVisitV63');
      if (newPlanning) pendingNewPlanning = true;

      const openPaired = event.target.closest('[data-plan-from-visit]');
      if (openPaired) {
        const visitId = openPaired.dataset.planFromVisit;
        const paired = pairedPlanForVisit(visitId);
        if (paired) {
          event.preventDefault();
          event.stopImmediatePropagation();
          const editButton = document.querySelector(`[data-edit-plan="${CSS.escape(paired.id)}"]`);
          if (editButton) editButton.click();
        }
      }
    }, true);

    $('safetyVisitFormV63')?.addEventListener('submit', () => {
      if (!pendingNewPlanning) return;
      const before = new Set(readStore().visits.map((visit) => visit.id));
      window.setTimeout(() => {
        const visitId = newestVisitId(before);
        pendingNewPlanning = false;
        if (visitId) openPlanForVisit(visitId);
      }, 80);
    }, true);

    $('safetyPlanFormV63')?.addEventListener('submit', () => {
      window.setTimeout(() => {
        refreshUnifiedUi();
        decorateCards();
      }, 100);
    }, true);
  }

  function injectStyles() {
    if ($('safetyUnifiedStylesV66')) return;
    const style = document.createElement('style');
    style.id = 'safetyUnifiedStylesV66';
    style.textContent = `
      .safety-pair-status-v66{display:inline-flex;margin-top:8px}
    `;
    document.head.appendChild(style);
  }

  async function boot() {
    if (!(await waitReady())) return;
    injectStyles();
    refreshUnifiedUi();
    decorateCards();
    installObserver();
    wire();
  }

  void boot();
})();