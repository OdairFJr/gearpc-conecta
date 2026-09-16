(() => {
  if (window.__GEARPC_APF_TEST_GATE_V52_1__) return;
  window.__GEARPC_APF_TEST_GATE_V52_1__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      }
      return;
    }
  }

  void enforceAdminOnly();
})();
