(() => {
  if (window.__GEARPC_OFFLINE_ACCESS_MARKER_V24__) return;
  window.__GEARPC_OFFLINE_ACCESS_MARKER_V24__ = true;

  let tries = 0;
  const timer = window.setInterval(() => {
    tries += 1;
    const runtime = window.GEARPC_RUNTIME;
    const state = runtime?.state;
    const user = state?.user;
    const profile = state?.profile;
    if (user?.id && profile) {
      try {
        localStorage.setItem(`gearpc-offline-access-v24:${user.id}`, JSON.stringify({
          userId: user.id,
          nome: profile.nome_completo || '',
          tipo: profile.tipo || '',
          isAdmin: profile.tipo === 'administrador',
          chefeId: profile.chefe_id || null,
          acessoGeral: Boolean(profile.acesso_geral_consulta),
          ativo: profile.ativo !== false,
          savedAt: new Date().toISOString()
        }));
      } catch (_) {}
      window.clearInterval(timer);
      return;
    }
    if (tries >= 60) window.clearInterval(timer);
  }, 500);
})();
