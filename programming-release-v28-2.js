(() => {
  const runtime = window.GEARPC_RUNTIME;
  if (!runtime?.client || !runtime?.state) return;

  const { client, state } = runtime;
  const button = document.getElementById('programmingButton');
  if (!button) return;

  function applyRelease() {
    const profile = state.profile;
    const adultAuthorized = Boolean(profile?.ativo !== false && ['administrador', 'chefia'].includes(profile?.tipo));
    button.classList.toggle('hidden', !adultAuthorized);
  }

  client.auth.onAuthStateChange((_event, session) => {
    if (session) window.setTimeout(applyRelease, 500);
    else button.classList.add('hidden');
  });

  const observer = new MutationObserver(applyRelease);
  observer.observe(button, { attributes: true, attributeFilter: ['class'] });

  window.setTimeout(applyRelease, 700);
})();
