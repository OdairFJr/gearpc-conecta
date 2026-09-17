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
        return;
      }

      if (profile.tipo === 'chefia' || profile.tipo === 'dirigente') {
        // Chefes e dirigentes recebem a consulta aprovada; controles administrativos continuam ocultos.
        document.getElementById('apfManageV52')?.setAttribute('hidden', '');
        loadApprovedDisplayModule();
        return;
      }

      // Responsáveis e demais perfis não recebem a área de APFs.
      document.getElementById('apfButtonV52')?.remove();
      document.getElementById('apfViewV52')?.remove();
      document.getElementById('apfManagerDialogV52')?.remove();
      document.getElementById('apfAssessDialogV54')?.remove();
      return;
    }
  }

  void enforceRelease();
})();
