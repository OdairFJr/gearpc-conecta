(() => {
  if (window.__GEARPC_CYCLE_PROGRAM_PILOT_LOADER_V84__) return;
  window.__GEARPC_CYCLE_PROGRAM_PILOT_LOADER_V84__ = true;

  function loadModule(id, src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-gearpc-module="${id}"]`);
      if (existing) {
        if (existing.dataset.loaded === '1') return resolve();
        existing.addEventListener('load', resolve, { once:true });
        existing.addEventListener('error', reject, { once:true });
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.dataset.gearpcModule = id;
      script.addEventListener('load', () => {
        script.dataset.loaded = '1';
        resolve();
      }, { once:true });
      script.addEventListener('error', () => reject(new Error(`Falha ao carregar ${src}`)), { once:true });
      document.head.appendChild(script);
    });
  }

  async function load() {
    try {
      await loadModule('cycle-program-pilot-v84', 'cycle-program-pilot-v84.js?v=84.0');
      await loadModule('cycle-program-import-v84', 'cycle-program-import-v84.js?v=84.3');
    } catch (error) {
      console.error('Falha ao carregar Ciclo de Programa v84:', error);
    }
  }

  void load();
})();