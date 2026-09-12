// Cole aqui os dois dados copiados do Supabase.
// A Publishable Key pode ficar no app; NÃO use Secret Key/service_role aqui.
window.GEARPC_CONFIG = {
  SUPABASE_URL: 'https://wewbwrdqubypuwuyvwmv.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_deqHEsvtUheOU-IhRpxgdw_K6qNiVmu'
};

// Módulos incrementais do GEArPC Conecta.
(() => {
  function loadModule(id, src) {
    if (document.querySelector(`script[data-gearpc-module="${id}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.gearpcModule = id;
    document.head.appendChild(script);
  }

  loadModule('compras-v37', 'compras-v37.js?v=37.0');
  loadModule('compras-fixes-v39', 'compras-fixes-v39.js?v=39.0');
  loadModule('compras-labels-v40', 'compras-labels-v40.js?v=40.0');
})();
