(() => {
  if (window.__GEARPC_OFFLINE_BOOTSTRAP_V24__) return;
  window.__GEARPC_OFFLINE_BOOTSTRAP_V24__ = true;

  const supabaseGlobal = window.supabase;
  if (!supabaseGlobal?.createClient) return;

  const originalCreateClient = supabaseGlobal.createClient.bind(supabaseGlobal);

  supabaseGlobal.createClient = (url, key, options = {}) => {
    const auth = {
      ...(options.auth || {}),
      persistSession: options.auth?.persistSession ?? true,
      autoRefreshToken: navigator.onLine ? (options.auth?.autoRefreshToken ?? true) : false
    };

    const client = originalCreateClient(url, key, { ...options, auth });

    const updateRefreshMode = () => {
      try {
        if (navigator.onLine) client.auth.startAutoRefresh?.();
        else client.auth.stopAutoRefresh?.();
      } catch (_) {}
    };

    window.addEventListener('online', updateRefreshMode);
    window.addEventListener('offline', updateRefreshMode);
    updateRefreshMode();

    return client;
  };
})();
