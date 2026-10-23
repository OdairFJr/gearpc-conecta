/* GEArPC Conecta v100
 * Módulo experimental "Gestão da seção — TESTE" desativado.
 * Mantém o caminho do arquivo antigo para limpar instalações e páginas em cache.
 * Os marcos reais são editados diretamente na ficha do jovem.
 */
(() => {
  window.__GEARPC_SECTION_CHIEF_PERMS_TEST_V94__ = true;

  const cleanup = () => {
    document.getElementById('sectionChiefPermsTestV94')?.remove();
    document.getElementById('scpv94')?.remove();
    document.getElementById('scpv94css')?.remove();
  };

  // Versões antigas do PWA podem tentar recriar a aba depois do login.
  // A ocultação imediata evita que ela pisque na interface.
  if (!document.getElementById('legacySectionManagementOffV100')) {
    const style = document.createElement('style');
    style.id = 'legacySectionManagementOffV100';
    style.textContent = '#sectionChiefPermsTestV94,#scpv94{display:none!important}';
    document.head.appendChild(style);
  }

  cleanup();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanup, { once: true });
  }

  const start = () => {
    cleanup();
    const modules = document.querySelector('#dashboardView .launch-modules');
    const body = document.body;
    if (!body || !modules || typeof MutationObserver !== 'function') return;
    const observer = new MutationObserver(() => {
      if (document.getElementById('sectionChiefPermsTestV94') ||
          document.getElementById('scpv94')) cleanup();
    });
    observer.observe(modules, { childList: true });
    observer.observe(body, { childList: true });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else start();
})();