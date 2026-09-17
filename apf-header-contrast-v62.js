(() => {
  if (window.__GEARPC_APF_HEADER_CONTRAST_V62__) return;
  window.__GEARPC_APF_HEADER_CONTRAST_V62__ = true;

  const style = document.createElement('style');
  style.id = 'apfHeaderContrastV62Styles';
  style.textContent = `
    #apfViewV52 > .subpage-header {
      background: linear-gradient(180deg, #0a376c 0%, #0d4b88 100%) !important;
      color: #fff !important;
      padding: 12px 14px !important;
      border-radius: 16px !important;
      border: 1px solid rgba(255,255,255,.16) !important;
      box-shadow: 0 8px 18px rgba(3,30,62,.18) !important;
      margin-bottom: 0 !important;
    }
    #apfViewV52 > .subpage-header .subpage-brand,
    #apfViewV52 > .subpage-header .subpage-brand span,
    #apfViewV52 > .subpage-header .subpage-brand strong {
      color: #fff !important;
      opacity: 1 !important;
    }
    #apfViewV52 > .subpage-header .back-button,
    #apfViewV52 > .subpage-header #apfLogoutV52 {
      color: #fff !important;
      border-color: rgba(255,255,255,.55) !important;
      background: rgba(255,255,255,.10) !important;
      opacity: 1 !important;
    }
    #apfViewV52 > .subpage-header .back-button:active,
    #apfViewV52 > .subpage-header #apfLogoutV52:active {
      background: rgba(255,255,255,.18) !important;
    }
  `;
  document.head.appendChild(style);
})();
