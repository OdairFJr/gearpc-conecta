(() => {
  if (window.__GEARPC_TUTORIAL_GENERAL_V81__) return;
  window.__GEARPC_TUTORIAL_GENERAL_V81__ = true;

  const TEST_EMAIL = 'chefe.teste@gearpc.test';
  const ALLOWED_MODULE_IDS = new Set(['chiefsButton', 'annualCalendarButton']);
  let isTestUser = false;
  let observer = null;

  function applyGeneralOnlyView() {
    if (!isTestUser) return;

    document.querySelectorAll('#dashboardView .launch-modules .launch-module').forEach((button) => {
      button.classList.toggle('hidden', !ALLOWED_MODULE_IDS.has(button.id));
    });

    document.getElementById('adminCard')?.classList.add('hidden');

    const releaseCard = document.querySelector('#dashboardView .release-card');
    if (releaseCard) releaseCard.classList.add('hidden');

    const profileType = document.getElementById('profileType');
    if (profileType) profileType.textContent = 'Perfil de teste';
  }

  function observeDashboard() {
    if (observer) return;
    const dashboard = document.getElementById('dashboardView');
    if (!dashboard) return;

    observer = new MutationObserver(() => applyGeneralOnlyView());
    observer.observe(dashboard, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  async function refreshSessionMode() {
    const rt = window.GEARPC_RUNTIME;
    if (!rt?.client) return false;

    const { data } = await rt.client.auth.getSession();
    const email = String(data?.session?.user?.email || '').trim().toLowerCase();
    isTestUser = email === TEST_EMAIL;

    if (isTestUser) {
      observeDashboard();
      applyGeneralOnlyView();
      window.GEARPC_TUTORIAL_GENERAL_ONLY = true;
    } else {
      window.GEARPC_TUTORIAL_GENERAL_ONLY = false;
    }

    return true;
  }

  async function boot() {
    for (let i = 0; i < 80; i += 1) {
      if (await refreshSessionMode()) break;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    const rt = window.GEARPC_RUNTIME;
    rt?.client?.auth?.onAuthStateChange?.(() => {
      window.setTimeout(() => {
        refreshSessionMode().catch(() => {});
      }, 0);
    });
  }

  void boot();
})();