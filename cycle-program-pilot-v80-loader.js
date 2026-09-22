(() => {
  if (window.__GEARPC_CYCLE_PROGRAM_PILOT_LOADER_V80__) return;
  window.__GEARPC_CYCLE_PROGRAM_PILOT_LOADER_V80__ = true;

  function loadImportModule() {
    if (document.querySelector('script[data-gearpc-module="cycle-program-import-v81"]')) return;
    const script = document.createElement('script');
    script.src = 'cycle-program-import-v81.js?v=81.0';
    script.async = false;
    script.dataset.gearpcModule = 'cycle-program-import-v81';
    document.head.appendChild(script);
  }

  async function load() {
    try {
      const parts = [];
      for (let i = 0; i < 9; i += 1) {
        const suffix = String(i).padStart(2, '0');
        const response = await fetch(`cycle-program-pilot-v80.b64.${suffix}?v=80.0`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Parte ${suffix} indisponível`);
        parts.push((await response.text()).trim());
      }
      const binary = atob(parts.join(''));
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const source = new TextDecoder('utf-8').decode(bytes);
      new Function(source)();
      loadImportModule();
    } catch (error) {
      console.error('Falha ao carregar Ciclo de Programa (piloto v80):', error);
    }
  }

  void load();
})();