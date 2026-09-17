(() => {
  if (window.__GEARPC_SAFETY_AUTO_SUBMIT_V71__) return;
  window.__GEARPC_SAFETY_AUTO_SUBMIT_V71__ = true;

  // A partir da v72 o envio ao DME é uma ação explícita do usuário.
  // Mantemos este arquivo como ponte porque ele já está carregado pelo gate atual.
  if (!document.getElementById('safetyExplicitDmeStyleV72')) {
    const style = document.createElement('style');
    style.id = 'safetyExplicitDmeStyleV72';
    style.textContent = '[data-send-dme-v67]{display:none!important}';
    document.head.appendChild(style);
  }

  if (document.getElementById('safetySendDmeV72Script')) return;
  const script = document.createElement('script');
  script.id = 'safetySendDmeV72Script';
  script.src = 'safety-send-dme-v72.js?v=72.0';
  script.async = false;
  document.body.appendChild(script);
})();