(() => {
  if (window.__GEARPC_SAFETY_OFFLINE_FIX_V65__) return;
  window.__GEARPC_SAFETY_OFFLINE_FIX_V65__ = true;
  const apply = () => {
    const oldPlanDate = document.getElementById('spDateV63');
    if (oldPlanDate) oldPlanDate.removeAttribute('required');
  };
  apply();
  let tries = 0;
  const timer = window.setInterval(() => {
    apply();
    tries += 1;
    if (document.getElementById('spStartDateV64') || tries > 80) window.clearInterval(timer);
  }, 250);
})();