// Cole aqui os dois dados copiados do Supabase.
// A Publishable Key pode ficar no app; NÃO use Secret Key/service_role aqui.
window.GEARPC_CONFIG = {
  SUPABASE_URL: 'https://wewbwrdqubypuwuyvwmv.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_deqHEsvtUheOU-IhRpxgdw_K6qNiVmu'
};

// Módulos incrementais do GEArPC Conecta.
(() => {
  if (document.querySelector('script[data-gearpc-module="compras-v36"]')) return;
  const script = document.createElement('script');
  script.src = 'compras-v36.js?v=36.0';
  script.async = false;
  script.dataset.gearpcModule = 'compras-v36';
  document.head.appendChild(script);
})();
