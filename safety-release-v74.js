(() => {
  if (window.__GEARPC_SAFETY_RELEASE_V74__) return;
  window.__GEARPC_SAFETY_RELEASE_V74__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let observer = null;
  let applying = false;

  const productionHtml = '<strong>🛡️ Segurança de Atividades</strong>O preenchimento pode ser feito offline. Para enviar ao DME, acompanhar a análise ou receber retorno, conecte-se à internet.';

  function applyProductionBanner() {
    const banner = document.querySelector('.safety-test-banner-v63');
    if (!banner || applying) return false;
    if (banner.innerHTML === productionHtml) return true;
    applying = true;
    banner.innerHTML = productionHtml;
    applying = false;
    return true;
  }

  async function boot() {
    for (let i = 0; i < 160; i += 1) {
      if (applyProductionBanner()) break;
      await sleep(250);
    }

    const banner = document.querySelector('.safety-test-banner-v63');
    if (banner) {
      observer = new MutationObserver(() => applyProductionBanner());
      observer.observe(banner, { childList: true, subtree: true, characterData: true });
    }

    document.addEventListener('click', (event) => {
      if (event.target.closest('#safetyButtonV63')) window.setTimeout(applyProductionBanner, 120);
    }, true);
  }

  void boot();
})();