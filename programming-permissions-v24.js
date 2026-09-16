(() => {
  if (window.__GEARPC_PROGRAMMING_PERMISSIONS_24__) return;
  window.__GEARPC_PROGRAMMING_PERMISSIONS_24__ = true;

  const rt = window.GEARPC_RUNTIME;
  if (!rt?.state || !rt?.client) return;
  const { state, client } = rt;
  const $ = (id) => document.getElementById(id);

  let originalGeneralAccess = null;
  let hasLinkedSection = false;
  let linkCheckDone = false;
  let linkCheckPromise = null;

  function loadHomeReviewModule() {
    if (document.getElementById('programReviewHomeV55Script')) return;
    const script = document.createElement('script');
    script.id = 'programReviewHomeV55Script';
    script.src = 'programming-review-home-v55.js?v=55.0';
    script.async = false;
    document.body.appendChild(script);
  }

  async function waitForProfile() {
    for (let i = 0; i < 80; i += 1) {
      if (state.profile) return state.profile;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return null;
  }

  async function refreshLinkedSectionState() {
    if (linkCheckPromise) return linkCheckPromise;
    linkCheckPromise = (async () => {
      const profile = await waitForProfile();
      linkCheckDone = true;
      hasLinkedSection = false;
      if (!profile || profile.tipo === 'administrador' || !profile.chefe_id) return false;

      const { data, error } = await client
        .from('chefe_secoes')
        .select('secao_id')
        .eq('chefe_id', Number(profile.chefe_id))
        .limit(1);

      if (!error) hasLinkedSection = Boolean(data?.length);
      return hasLinkedSection;
    })().finally(() => { linkCheckPromise = null; });
    return linkCheckPromise;
  }

  function enterProgrammingMode() {
    if (!state.profile || state.profile.tipo === 'administrador') return;
    if (!linkCheckDone) {
      refreshLinkedSectionState().then((linked) => {
        if (linked && programmingSurfaceActive()) enterProgrammingMode();
      }).catch(() => {});
      return;
    }
    if (!hasLinkedSection) return;
    if (originalGeneralAccess === null) originalGeneralAccess = Boolean(state.profile.acesso_geral_consulta);

    // Dentro da programação, um adulto vinculado a uma seção deve poder gerir essa
    // seção mesmo que também seja dirigente com acesso geral de consulta.
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

  function shouldEnterFromClick(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest(
      '#programmingButton, .program-list-card, #editProgramFromPreviewButton, [data-open-program-feedback], [data-review-home-open]'
    ));
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (shouldEnterFromClick(target)) enterProgrammingMode();

    const button = target instanceof Element ? target.closest('button') : null;
    if (!button) return;
    if (button === $('programmingBackButton') || button === $('programmingLogoutButton') || button === $('logoutButton')) {
      window.setTimeout(leaveProgrammingMode, 0);
    }
  }, true);

  const preview = $('programPreviewDialog');
  preview?.addEventListener('close', () => {
    window.setTimeout(() => {
      if (!programmingSurfaceActive()) leaveProgrammingMode();
    }, 0);
  });

  const list = $('programmingView');
  const editor = $('programEditorView');
  const observer = new MutationObserver(() => {
    if (programmingSurfaceActive()) enterProgrammingMode();
  });
  if (list) observer.observe(list, { attributes: true, attributeFilter: ['class'] });
  if (editor) observer.observe(editor, { attributes: true, attributeFilter: ['class'] });

  client.auth.onAuthStateChange((_event, session) => {
    if (session) {
      linkCheckDone = false;
      hasLinkedSection = false;
      window.setTimeout(() => { void refreshLinkedSectionState(); }, 450);
    } else {
      leaveProgrammingMode();
      linkCheckDone = false;
      hasLinkedSection = false;
    }
  });

  client.auth.getSession().then(({ data }) => {
    if (data?.session) window.setTimeout(() => { void refreshLinkedSectionState(); }, 450);
  }).catch(() => {});

  window.addEventListener('pagehide', leaveProgrammingMode);
  loadHomeReviewModule();
})();
