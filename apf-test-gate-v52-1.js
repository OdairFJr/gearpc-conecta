(() => {
  if (window.__GEARPC_APF_TEST_GATE_V52_1__) return;
  window.__GEARPC_APF_TEST_GATE_V52_1__ = true;

  // Impede a versão anterior de formação/APF de iniciar automaticamente.
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

  async function isTestProfile(rt) {
    if (!rt?.state?.user?.id) return false;
    const { data, error } = await rt.client
      .from('perfis_usuarios')
      .select('eh_teste')
      .eq('user_id', rt.state.user.id)
      .maybeSingle();
    return !error && data?.eh_teste === true;
  }

  async function enforceTestGate() {
    for (let i = 0; i < 120; i += 1) {
      const rt = window.GEARPC_RUNTIME;
      const profile = rt?.state?.profile;
      if (!profile || !rt?.client) {
        await sleep(250);
        continue;
      }

      if (profile.tipo === 'administrador') {
        loadAdminFormationModule();
        return;
      }

      if (await isTestProfile(rt)) {
        // Perfil fake vê a aba como um chefe comum, mas não recebe controles administrativos.
        document.getElementById('apfManageV52')?.setAttribute('hidden', '');
        return;
      }

      // Demais chefes ainda não recebem a função enquanto estiver em testes.
      document.getElementById('apfButtonV52')?.remove();
      document.getElementById('apfViewV52')?.remove();
      document.getElementById('apfManagerDialogV52')?.remove();
      document.getElementById('apfAssessDialogV54')?.remove();
      return;
    }
  }

  void enforceTestGate();
})();
