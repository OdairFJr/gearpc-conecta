(() => {
  if (window.__GEARPC_APF_TEST_GATE_V52_1__) return;
  window.__GEARPC_APF_TEST_GATE_V52_1__ = true;

  // Mantém a versão anterior de formação/APF desativada; a versão aprovada é carregada abaixo.
  window.__GEARPC_APF_FORMACAO_V53__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function loadAdminFormationModule() {
    if (document.getElementById('apfFormationV54Script')) return;
    const script = document.createElement('script');
    script.id = 'apfFormationV54Script';
    script.src = 'apf-formacao-v54.js?v=54.0';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadApprovedDisplayModule() {
    if (document.getElementById('apfTestDisplayV57Script')) return;
    const script = document.createElement('script');
    script.id = 'apfTestDisplayV57Script';
    script.src = 'apf-test-display-v57.js?v=57.1';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadHeaderContrastModule() {
    if (document.getElementById('apfHeaderContrastV62Script')) return;
    const script = document.createElement('script');
    script.id = 'apfHeaderContrastV62Script';
    script.src = 'apf-header-contrast-v62.js?v=62.1';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadSafetyTestModule() {
    if (document.getElementById('safetyTestV63Script')) return;
    const script = document.createElement('script');
    script.id = 'safetyTestV63Script';
    script.src = 'safety-test-v63.js?v=63.2';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadSafetyAdjustmentsModule() {
    if (document.getElementById('safetyAdjustmentsV64Script')) return;
    const script = document.createElement('script');
    script.id = 'safetyAdjustmentsV64Script';
    script.src = 'safety-test-adjustments-v64.js?v=64.0';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadSafetyOfflineFixModule() {
    if (document.getElementById('safetyOfflineFixV65Script')) return;
    const script = document.createElement('script');
    script.id = 'safetyOfflineFixV65Script';
    script.src = 'safety-test-offline-fix-v65.js?v=65.0';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadSafetySectionsModule() {
    if (document.getElementById('safetySectionsV65Script')) return;
    const script = document.createElement('script');
    script.id = 'safetySectionsV65Script';
    script.src = 'safety-sections-v65.js?v=65.0';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadSafetyUnifiedFlowModule() {
    if (document.getElementById('safetyUnifiedFlowV66Script')) return;
    const script = document.createElement('script');
    script.id = 'safetyUnifiedFlowV66Script';
    script.src = 'safety-unified-flow-v66.js?v=66.3';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadSafetyApprovalModule() {
    if (document.getElementById('safetyApprovalV67Script')) return;
    const script = document.createElement('script');
    script.id = 'safetyApprovalV67Script';
    script.src = 'safety-approval-v67.js?v=67.2';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadSafetyVisitorsFixModule() {
    if (document.getElementById('safetyVisitorsFixV68Script')) return;
    const script = document.createElement('script');
    script.id = 'safetyVisitorsFixV68Script';
    script.src = 'safety-visitors-fix-v68.js?v=68.0';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadSafetyCoordinatorModule() {
    if (document.getElementById('safetyCoordinatorV69Script')) return;
    const script = document.createElement('script');
    script.id = 'safetyCoordinatorV69Script';
    script.src = 'safety-coordinator-v69.js?v=69.0';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadSafetyMapsLocationModule() {
    if (document.getElementById('safetyMapsLocationV70Script')) return;
    const script = document.createElement('script');
    script.id = 'safetyMapsLocationV70Script';
    script.src = 'safety-maps-location-v70.js?v=70.0';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadSafetyAutoSubmitModule() {
    if (document.getElementById('safetyAutoSubmitV71Script')) return;
    const script = document.createElement('script');
    script.id = 'safetyAutoSubmitV71Script';
    script.src = 'safety-auto-submit-v71.js?v=71.0';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadSafetySimplifyModule() {
    if (document.getElementById('safetySimplifyV73Script')) return;
    const script = document.createElement('script');
    script.id = 'safetySimplifyV73Script';
    script.src = 'safety-simplify-v73.js?v=73.0';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadSafetyReleaseModule() {
    if (document.getElementById('safetyReleaseV74Script')) return;
    const script = document.createElement('script');
    script.id = 'safetyReleaseV74Script';
    script.src = 'safety-release-v74.js?v=74.0';
    script.async = false;
    document.body.appendChild(script);
  }

  async function enforceRelease() {
    for (let i = 0; i < 120; i += 1) {
      const rt = window.GEARPC_RUNTIME;
      const profile = rt?.state?.profile;
      if (!profile || !rt?.client) {
        await sleep(250);
        continue;
      }

      if (profile.tipo === 'administrador') {
        loadAdminFormationModule();
        loadApprovedDisplayModule();
        loadHeaderContrastModule();
        loadSafetyTestModule();
        loadSafetyAdjustmentsModule();
        loadSafetyOfflineFixModule();
        loadSafetySectionsModule();
        loadSafetyUnifiedFlowModule();
        loadSafetyApprovalModule();
        loadSafetyVisitorsFixModule();
        loadSafetyCoordinatorModule();
        loadSafetyMapsLocationModule();
        loadSafetyAutoSubmitModule();
        loadSafetySimplifyModule();
        loadSafetyReleaseModule();
        return;
      }

      if (profile.tipo === 'chefia' || profile.tipo === 'dirigente') {
        document.getElementById('apfManageV52')?.setAttribute('hidden', '');
        loadApprovedDisplayModule();
        loadHeaderContrastModule();
        loadSafetyTestModule();
        loadSafetyAdjustmentsModule();
        loadSafetyOfflineFixModule();
        loadSafetySectionsModule();
        loadSafetyUnifiedFlowModule();
        loadSafetyApprovalModule();
        loadSafetyVisitorsFixModule();
        loadSafetyCoordinatorModule();
        loadSafetyMapsLocationModule();
        loadSafetyAutoSubmitModule();
        loadSafetySimplifyModule();
        loadSafetyReleaseModule();
        return;
      }

      // Responsáveis e demais perfis não recebem as áreas administrativas/operacionais.
      document.getElementById('apfButtonV52')?.remove();
      document.getElementById('apfViewV52')?.remove();
      document.getElementById('apfManagerDialogV52')?.remove();
      document.getElementById('apfAssessDialogV54')?.remove();
      return;
    }
  }

  void enforceRelease();
})();