(() => {
  if (window.__GEARPC_PROGRAMMING_PERMISSIONS_24__) return;
  window.__GEARPC_PROGRAMMING_PERMISSIONS_24__ = true;

  const rt = window.GEARPC_RUNTIME;
  if (!rt?.state || !rt?.client) return;
  const { state, client } = rt;
  const $ = (id) => document.getElementById(id);

  let originalGeneralAccess = null;
  let pilotEnabled = false;
  let pilotResolved = false;

  function loadHomeReviewModule() {
    if (!pilotEnabled || document.getElementById('programReviewHomeV55Script')) return;
    const script = document.createElement('script');
    script.id = 'programReviewHomeV55Script';
    script.src = 'programming-review-home-v55.js?v=55.0';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadRequiredFieldsModule() {
    if (!pilotEnabled || document.getElementById('programmingRequiredV58Script')) return;
    const script = document.createElement('script');
    script.id = 'programmingRequiredV58Script';
    script.src = 'programming-required-v58.js?v=58.0';
    script.async = false;
    document.body.appendChild(script);
  }

  function loadPilotModules() {
    loadHomeReviewModule();
    loadRequiredFieldsModule();
  }

  async function waitForProfile() {
    for (let i = 0; i < 100; i += 1) {
      if (state.profile && state.user?.id) return state.profile;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return null;
  }

  async function resolvePilot() {
    const profile = await waitForProfile();
    if (!profile || !state.user?.id) {
      pilotResolved = true;
      pilotEnabled = false;
      return false;
    }
    if (profile.tipo === 'administrador') {
      pilotResolved = true;
      pilotEnabled = true;
      loadPilotModules();
      return true;
    }
    const { data, error } = await client
      .from('perfis_usuarios')
      .select('eh_teste')
      .eq('user_id', state.user.id)
      .maybeSingle();
    pilotResolved = true;
    pilotEnabled = !error && data?.eh_teste === true;
    if (pilotEnabled) loadPilotModules();
    return pilotEnabled;
  }

  function enterProgrammingMode() {
    if (!state.profile || state.profile.tipo === 'administrador') return;
    if (originalGeneralAccess === null) originalGeneralAccess = Boolean(state.profile.acesso_geral_consulta);
    // Comportamento estável já utilizado: dentro da Programação, um adulto que
    // também está vinculado a uma seção atua pela chefia daquela seção.
    state.profile.acesso_geral_consulta = false;
  }

  function leaveProgrammingMode() {
    if (!state.profile || originalGeneralAccess === null) return;
    state.profile.acesso_geral_consulta = originalGeneralAccess;
    originalGeneralAccess = null;
  }

  function programmingSurfaceActive() {
    const list = $('programmingView');
    const editor = $('programEditorView');
    const preview = $('programPreviewDialog');
    return Boolean(
      (list && !list.classList.contains('hidden')) ||
      (editor && !editor.classList.contains('hidden')) ||
      preview?.open
    );
  }

  function shouldEnterPilotFromClick(target) {
    if (!(target instanceof Element) || !pilotEnabled) return false;
    return Boolean(target.closest(
      '.program-list-card, #editProgramFromPreviewButton, [data-open-program-feedback], [data-review-home-open]'
    ));
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    const button = target instanceof Element ? target.closest('button') : null;

    // Canal estável: entrar pelo botão Programação mantém o comportamento já publicado.
    if (button === $('programmingButton')) enterProgrammingMode();

    // Canal de teste: também corrige entradas vindas de avisos, cards e prévia.
    if (shouldEnterPilotFromClick(target)) enterProgrammingMode();

    if (!button) return;
    if (button === $('programmingBackButton') || button === $('programmingLogoutButton') || button === $('logoutButton')) {
      window.setTimeout(leaveProgrammingMode, 0);
    }
  }, true);

  const preview = $('programPreviewDialog');
  preview?.addEventListener('close', () => {
    if (!pilotEnabled) return;
    window.setTimeout(() => {
      if (!programmingSurfaceActive()) leaveProgrammingMode();
    }, 0);
  });

  const list = $('programmingView');
  const editor = $('programEditorView');
  const observer = new MutationObserver(() => {
    if (pilotEnabled && programmingSurfaceActive()) enterProgrammingMode();
  });
  if (list) observer.observe(list, { attributes: true, attributeFilter: ['class'] });
  if (editor) observer.observe(editor, { attributes: true, attributeFilter: ['class'] });

  client.auth.onAuthStateChange((_event, session) => {
    if (session) {
      pilotResolved = false;
      pilotEnabled = false;
      window.setTimeout(() => { void resolvePilot(); }, 450);
    } else {
      leaveProgrammingMode();
      pilotResolved = false;
      pilotEnabled = false;
    }
  });

  client.auth.getSession().then(({ data }) => {
    if (data?.session) window.setTimeout(() => { void resolvePilot(); }, 450);
  }).catch(() => {});

  window.addEventListener('pagehide', leaveProgrammingMode);
  void resolvePilot();
})();
