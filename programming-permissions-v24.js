(() => {
  if (window.__GEARPC_PROGRAMMING_PERMISSIONS_24__) return;
  window.__GEARPC_PROGRAMMING_PERMISSIONS_24__ = true;
  const rt = window.GEARPC_RUNTIME;
  if (!rt?.state) return;
  const state = rt.state;
  const $ = (id) => document.getElementById(id);
  let originalGeneralAccess = null;

  function enterProgrammingMode() {
    if (!state.profile || state.profile.tipo === 'administrador') return;
    if (originalGeneralAccess === null) originalGeneralAccess = Boolean(state.profile.acesso_geral_consulta);
    // Na programação, o acesso de gestão é definido pelo vínculo à seção.
    // Isso permite que dirigentes vinculados a uma seção atuem nela normalmente,
    // sem liberar outras seções.
    state.profile.acesso_geral_consulta = false;
  }

  function leaveProgrammingMode() {
    if (!state.profile || originalGeneralAccess === null) return;
    state.profile.acesso_geral_consulta = originalGeneralAccess;
    originalGeneralAccess = null;
  }

  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    if (!button) return;
    if (button === $('programmingButton')) enterProgrammingMode();
    if (button === $('programmingBackButton') || button === $('programmingLogoutButton') || button === $('logoutButton')) {
      window.setTimeout(leaveProgrammingMode, 0);
    }
  }, true);

  window.addEventListener('pagehide', leaveProgrammingMode);
})();
