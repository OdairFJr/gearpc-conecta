(() => {
  if (window.__GEARPC_SAFETY_VISITORS_FIX_V68__) return;
  window.__GEARPC_SAFETY_VISITORS_FIX_V68__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let adultNames = [];
  let loading = false;

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  async function waitReady() {
    for (let i = 0; i < 160; i += 1) {
      const current = window.GEARPC_RUNTIME;
      if (current?.client && current?.state?.user && $('svVisitorsChoicesV64') && $('svVisitorsV63')) return current;
      await sleep(250);
    }
    return null;
  }

  function currentSelected() {
    const checked = [...($('svVisitorsChoicesV64')?.querySelectorAll('input[type="checkbox"]:checked') || [])]
      .map((input) => String(input.value || '').trim())
      .filter(Boolean);
    if (checked.length) return checked;
    return String($('svVisitorsV63')?.value || '')
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
  }

  function syncHidden() {
    const hidden = $('svVisitorsV63');
    if (!hidden) return;
    hidden.value = [...($('svVisitorsChoicesV64')?.querySelectorAll('input[type="checkbox"]:checked') || [])]
      .map((input) => input.value)
      .join(', ');
  }

  function render(selected = currentSelected()) {
    const box = $('svVisitorsChoicesV64');
    if (!box) return;
    const selectedSet = new Set(selected || []);
    if (!adultNames.length) {
      box.innerHTML = '<div class="safety-visitors-empty-v68">Nenhum adulto ativo encontrado.</div>';
      return;
    }
    box.innerHTML = adultNames.map((name) => `
      <label class="safety-check-option-v63">
        <input type="checkbox" value="${esc(name)}" ${selectedSet.has(name) ? 'checked' : ''}/>
        <span>${esc(name)}</span>
      </label>`).join('');
    syncHidden();
  }

  async function loadAdults(force = false) {
    if (loading) return;
    if (adultNames.length && !force) {
      render();
      return;
    }
    loading = true;
    const box = $('svVisitorsChoicesV64');
    if (box) box.innerHTML = '<div class="safety-visitors-loading-v68">Carregando adultos...</div>';
    try {
      const { data, error } = await rt.client
        .from('chefes')
        .select('nome_completo,ativo')
        .eq('ativo', true)
        .order('nome_completo');
      if (error) throw error;
      const names = (data || [])
        .map((row) => String(row.nome_completo || '').trim())
        .filter(Boolean);
      const me = String(rt?.state?.profile?.nome_completo || '').trim();
      if (me) names.push(me);
      adultNames = [...new Set(names)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      if (rt?.state) {
        const existing = Array.isArray(rt.state.chefes) ? rt.state.chefes : [];
        const byName = new Map(existing.map((row) => [String(row.nome_completo || '').trim(), row]));
        adultNames.forEach((name) => {
          if (!byName.has(name)) existing.push({ nome_completo: name, ativo: true });
        });
        rt.state.chefes = existing;
      }
      render();
    } catch (error) {
      if (box) box.innerHTML = `<div class="safety-visitors-error-v68">Não foi possível carregar a lista de adultos. ${esc(error?.message || '')}</div>`;
    } finally {
      loading = false;
    }
  }

  function injectStyles() {
    if ($('safetyVisitorsStylesV68')) return;
    const style = document.createElement('style');
    style.id = 'safetyVisitorsStylesV68';
    style.textContent = `
      #svVisitorsChoicesV64{margin-top:8px}
      .safety-visitors-loading-v68,.safety-visitors-empty-v68,.safety-visitors-error-v68{grid-column:1/-1;padding:10px 12px;border:1px solid #dce6ee;border-radius:10px;background:#fff;color:#61778a;font-size:.84rem}
      .safety-visitors-error-v68{border-color:#efcaca;background:#fff8f8;color:#8a3333}
    `;
    document.head.appendChild(style);
  }

  function wire() {
    $('svVisitorsChoicesV64')?.addEventListener('change', syncHidden);

    document.addEventListener('click', (event) => {
      if (!event.target.closest('#newSafetyVisitV63,[data-edit-visit]')) return;
      window.setTimeout(() => { void loadAdults(true); }, 180);
    }, true);

    const dialog = $('safetyVisitDialogV63');
    if (dialog) {
      const observer = new MutationObserver(() => {
        if (dialog.hasAttribute('open')) window.setTimeout(() => { void loadAdults(false); }, 80);
      });
      observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    }
  }

  async function boot() {
    rt = await waitReady();
    if (!rt) return;
    injectStyles();
    wire();
    await loadAdults(true);
  }

  void boot();
})();