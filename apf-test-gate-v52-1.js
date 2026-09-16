(() => {
  if (window.__GEARPC_APF_TEST_GATE_V52_1__) return;
  window.__GEARPC_APF_TEST_GATE_V52_1__ = true;

  // Impede a versão anterior de formação/APF de iniciar.
  window.__GEARPC_APF_FORMACAO_V53__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function loadStableAdminModule() {
    if (document.getElementById('apfFormationV54Script')) return;
    const script = document.createElement('script');
    script.id = 'apfFormationV54Script';
    script.src = 'apf-formacao-v54.js?v=54.0';
    script.async = false;
    document.body.appendChild(script);
  }

  async function enforceAdminOnly() {
    for (let i = 0; i < 120; i += 1) {
      const rt = window.GEARPC_RUNTIME;
      const profile = rt?.state?.profile;
      if (!profile) {
        await sleep(250);
        continue;
      }

      if (profile.tipo !== 'administrador') {
        document.getElementById('apfButtonV52')?.remove();
        document.getElementById('apfViewV52')?.remove();
        document.getElementById('apfManagerDialogV52')?.remove();
        document.getElementById('apfAssessDialogV54')?.remove();
        return;
      }

      loadStableAdminModule();
      return;
    }
  }

  void enforceAdminOnly();
})();
