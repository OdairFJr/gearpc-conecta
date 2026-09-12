(() => {
  'use strict';

  if (window.GEARPC_PURCHASE_LABELS_V40) return;
  window.GEARPC_PURCHASE_LABELS_V40 = true;

  function setText(selector, text) {
    const el = document.querySelector(selector);
    if (el && el.textContent !== text) el.textContent = text;
  }

  function applyLabels() {
    const moduleButton = document.getElementById('purchaseRequestsButton');
    if (moduleButton) {
      const title = moduleButton.querySelector('.launch-module-copy strong');
      const helper = moduleButton.querySelector('.launch-module-copy small');
      if (title) title.textContent = 'Requisição de Distintivos';
      if (helper) helper.textContent = 'Requisições, entregas e histórico dos distintivos.';
    }

    const view = document.getElementById('purchaseRequestsView');
    if (view) {
      setText('#purchaseRequestsView .subpage-brand strong', 'Distintivos');

      const hero = view.querySelector('.members-hero');
      if (hero) {
        const eyebrow = hero.querySelector('.eyebrow');
        const heading = hero.querySelector('h2');
        const paragraph = hero.querySelector('p');
        if (eyebrow) eyebrow.textContent = 'REQUISIÇÃO DE DISTINTIVOS';
        if (heading) heading.textContent = 'Controle de distintivos';
        if (paragraph) paragraph.textContent = 'Solicite, acompanhe a compra e registre a entrega dos distintivos.';
      }

      setText('#newPurchaseRequestButton', '＋ Nova requisição');

      const requestsTab = view.querySelector('[data-purchase-tab="requests"]');
      if (requestsTab) requestsTab.textContent = 'Requisições';

      const requestCount = document.getElementById('purchaseRequestCount');
      if (requestCount?.parentElement) {
        const count = requestCount.textContent || '0';
        requestCount.parentElement.innerHTML = `<strong id="purchaseRequestCount">${count}</strong> requisição(ões) aguardando compra`;
      }
    }

    const requestDialog = document.getElementById('purchaseRequestDialog');
    if (requestDialog) {
      const eyebrow = requestDialog.querySelector('.eyebrow');
      const heading = requestDialog.querySelector('h2');
      const save = document.getElementById('savePurchaseRequestButton');
      if (eyebrow) eyebrow.textContent = 'REQUISIÇÃO DE DISTINTIVOS';
      if (heading) heading.textContent = 'Nova requisição';
      if (save) save.textContent = 'Enviar requisição';
    }

    document.querySelectorAll('.purchase-delete-button, .purchase-delete-delivery-v39').forEach((button) => {
      if (button.textContent !== 'Apagar requisição') button.textContent = 'Apagar requisição';
    });
  }

  const observer = new MutationObserver(() => applyLabels());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLabels, { once: true });
  } else {
    applyLabels();
  }
})();
