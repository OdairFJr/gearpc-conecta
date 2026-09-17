(() => {
  if (window.__GEARPC_SAFETY_SECTIONS_V65__) return;
  window.__GEARPC_SAFETY_SECTIONS_V65__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);

  async function waitReady() {
    for (let i = 0; i < 160; i += 1) {
      if ($('svSectionsV63') && $('spSectionsV63')) return true;
      await sleep(250);
    }
    return false;
  }

  function installScope(containerId, prefix) {
    const grid = $(containerId);
    if (!grid || $(`${prefix}WholeGroupV65`)) return;
    const parent = grid.parentElement;
    const title = parent?.querySelector(':scope > label');
    if (title) title.textContent = 'Seções participantes';

    grid.insertAdjacentHTML('beforebegin', `
      <div class="safety-group-scope-v65">
        <label class="safety-check-option-v63 safety-whole-group-v65">
          <input id="${prefix}WholeGroupV65" type="checkbox" />
          <span><strong>Todo o grupo</strong><small>Marque quando a atividade envolver todas as seções.</small></span>
        </label>
        <p class="safety-note-v63">Para atividade conjunta, marque duas ou mais seções abaixo.</p>
      </div>`);
  }

  function realSectionInputs(containerId) {
    return [...($(containerId)?.querySelectorAll('input[type="checkbox"]') || [])];
  }

  function syncWholeGroup(containerId, wholeId) {
    const whole = $(wholeId);
    const inputs = realSectionInputs(containerId);
    if (!whole || !inputs.length) return;
    whole.checked = inputs.every((input) => input.checked);
  }

  function setWholeGroup(containerId, wholeId, enabled) {
    const whole = $(wholeId);
    const inputs = realSectionInputs(containerId);
    if (!whole) return;
    inputs.forEach((input) => {
      input.checked = enabled;
      input.disabled = enabled;
    });
    whole.checked = enabled;
  }

  function releaseSections(containerId) {
    realSectionInputs(containerId).forEach((input) => { input.disabled = false; });
  }

  function wireScope(containerId, wholeId) {
    const whole = $(wholeId);
    const grid = $(containerId);
    if (!whole || !grid) return;

    whole.addEventListener('change', () => {
      if (whole.checked) {
        setWholeGroup(containerId, wholeId, true);
      } else {
        releaseSections(containerId);
        realSectionInputs(containerId).forEach((input) => { input.checked = false; });
      }
    });

    grid.addEventListener('change', () => syncWholeGroup(containerId, wholeId));
  }

  function hydrateScope(containerId, wholeId) {
    window.setTimeout(() => {
      releaseSections(containerId);
      syncWholeGroup(containerId, wholeId);
      const whole = $(wholeId);
      if (whole?.checked) realSectionInputs(containerId).forEach((input) => { input.disabled = true; });
    }, 20);
  }

  function injectStyles() {
    if ($('safetySectionsStylesV65')) return;
    const style = document.createElement('style');
    style.id = 'safetySectionsStylesV65';
    style.textContent = `
      .safety-group-scope-v65{display:grid;gap:7px;margin:7px 0 9px}
      .safety-whole-group-v65{border-color:#9bb7ce;background:#f4f9fd}
      .safety-whole-group-v65 span{display:grid;gap:2px}
      .safety-whole-group-v65 strong{color:#17324d}
      .safety-whole-group-v65 small{font-weight:400;color:#60788c;line-height:1.3}
      .safety-check-option-v63 input:disabled + span{opacity:.68}
    `;
    document.head.appendChild(style);
  }

  function wireHydration() {
    document.addEventListener('click', (event) => {
      if (event.target.closest('#newSafetyVisitV63,[data-edit-visit]')) {
        hydrateScope('svSectionsV63', 'svWholeGroupV65');
      }
      if (event.target.closest('#newSafetyPlanV63,[data-edit-plan],[data-plan-from-visit]')) {
        hydrateScope('spSectionsV63', 'spWholeGroupV65');
      }
    }, true);

    $('spBaseVisitV63')?.addEventListener('change', () => hydrateScope('spSectionsV63', 'spWholeGroupV65'));
  }

  async function boot() {
    if (!(await waitReady())) return;
    injectStyles();
    installScope('svSectionsV63', 'sv');
    installScope('spSectionsV63', 'sp');
    wireScope('svSectionsV63', 'svWholeGroupV65');
    wireScope('spSectionsV63', 'spWholeGroupV65');
    wireHydration();
  }

  void boot();
})();