(() => {
  if (window.__GEARPC_PROGRAMMING_REQUIRED_V58__) return;
  window.__GEARPC_PROGRAMMING_REQUIRED_V58__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let pilot = false;
  let bypassButton = null;
  let decorateTimer = null;
  let decorating = false;

  async function waitRuntime() {
    for (let i = 0; i < 120; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.profile && x?.state?.user?.id) return x;
      await sleep(250);
    }
    return null;
  }

  async function resolvePilot() {
    if (rt.state.profile?.tipo === 'administrador') return true;
    const { data, error } = await rt.client.from('perfis_usuarios').select('eh_teste').eq('user_id', rt.state.user.id).maybeSingle();
    return !error && data?.eh_teste === true;
  }

  function injectStyles() {
    if ($('programmingRequiredStylesV58')) return;
    const style = document.createElement('style');
    style.id = 'programmingRequiredStylesV58';
    style.textContent = `
      .program-required-v58{display:inline-flex;align-items:center;gap:5px;margin-left:6px;font-size:.72rem;font-weight:900;color:#a22520}
      .program-timeline-item.program-incomplete-v58{border-color:#d88983!important;box-shadow:0 0 0 2px rgba(162,37,32,.08)}
      #programTimeline .program-conductor{display:none!important}
    `;
    document.head.appendChild(style);
  }

  function isActivityForm() {
    return String($('programItemType')?.value || '') === 'atividade';
  }

  function markFieldRequired(control, key) {
    if (!control) return;
    control.required = true;
    const label = control.closest('label');
    if (!label || label.querySelector(`[data-required-v58="${key}"]`)) return;
    const badge = document.createElement('span');
    badge.className = 'program-required-v58';
    badge.dataset.requiredV58 = key;
    badge.textContent = '• obrigatório';
    label.insertBefore(badge, control);
  }

  function clearFieldRequired(control, key) {
    if (!control) return;
    control.required = false;
    control.closest('label')?.querySelector(`[data-required-v58="${key}"]`)?.remove();
  }

  function hideConductorFromActivitySheet() {
    const conductor = $('programItemConductor');
    if (!conductor) return;
    clearFieldRequired(conductor, 'responsavel');
    const label = conductor.closest('label');
    if (label) label.style.display = 'none';
  }

  function refreshRequiredUi() {
    hideConductorFromActivitySheet();
    const development = $('programItemDevelopment');
    if (isActivityForm()) markFieldRequired(development, 'desenvolvimento');
    else clearFieldRequired(development, 'desenvolvimento');
  }

  function showItemError(text, focusEl) {
    const msg = $('programItemMessage');
    if (msg) {
      msg.textContent = text;
      msg.classList.remove('success-message');
    }
    try { focusEl?.focus(); } catch (_) {}
  }

  function validateItemForm() {
    if (!isActivityForm()) return true;
    const development = $('programItemDevelopment');
    if (!String(development?.value || '').trim()) {
      showItemError('Preencha o Desenvolvimento da atividade antes de salvar.', development);
      return false;
    }
    return true;
  }

  async function currentProgramIdFromScreen() {
    const itemButton = document.querySelector('#programTimeline [data-edit-program-item]');
    const itemId = Number(itemButton?.dataset?.editProgramItem || 0);
    if (itemId) {
      const { data, error } = await rt.client.from('programacao_itens').select('programacao_id').eq('id', itemId).maybeSingle();
      if (!error && data?.programacao_id) return Number(data.programacao_id);
    }
    const sectionId = Number($('programEditorSection')?.value || 0);
    const date = $('programEditorDate')?.value || '';
    if (!sectionId || !date) return null;
    const { data, error } = await rt.client.from('programacoes').select('id').eq('secao_id', sectionId).eq('data_atividade', date).maybeSingle();
    return error ? null : Number(data?.id || 0) || null;
  }

  async function incompleteItemsForCurrentProgram() {
    const programId = await currentProgramIdFromScreen();
    if (!programId) return [];
    const { data, error } = await rt.client
      .from('programacao_itens')
      .select('id,nome,condutor_chefe_id,condutor_jovem_id,condutor_externo_nome,desenvolvimento,tipo')
      .eq('programacao_id', programId)
      .eq('tipo', 'atividade');
    if (error) return [];
    return (data || []).filter((item) =>
      (!item.condutor_chefe_id && !item.condutor_jovem_id && !String(item.condutor_externo_nome || '').trim()) || !String(item.desenvolvimento || '').trim()
    );
  }

  async function validateProgrammingBeforeSave() {
    const incomplete = await incompleteItemsForCurrentProgram();
    const ids = new Set(incomplete.map((i) => Number(i.id)));
    document.querySelectorAll('#programTimeline .program-timeline-item').forEach((card) => {
      const id = Number(card.querySelector('[data-edit-program-item]')?.dataset?.editProgramItem || 0);
      card.classList.toggle('program-incomplete-v58', ids.has(id));
    });
    if (!incomplete.length) return true;
    const first = incomplete[0];
    const missing = [];
    if (!first.condutor_chefe_id && !first.condutor_jovem_id && !String(first.condutor_externo_nome || '').trim()) missing.push('responsável pela condução');
    if (!String(first.desenvolvimento || '').trim()) missing.push('desenvolvimento');
    const msg = $('programEditorMessage');
    if (msg) {
      msg.textContent = `Não é possível concluir a programação: “${first.nome || 'atividade'}” está sem ${missing.join(' e ')}.`;
      msg.classList.remove('success-message');
    }
    document.querySelector(`#programTimeline [data-edit-program-item="${first.id}"]`)?.closest('.program-timeline-item')?.scrollIntoView?.({ behavior:'smooth', block:'center' });
    return false;
  }

  function scheduleDecorate() {
    clearTimeout(decorateTimer);
    decorateTimer = setTimeout(() => { void decorateTimeline(); }, 80);
  }

  async function decorateTimeline() {
    if (decorating) return;
    decorating = true;
    try {
      const buttons = [...document.querySelectorAll('#programTimeline [data-edit-program-item]')];
      const ids = buttons.map((b) => Number(b.dataset.editProgramItem || 0)).filter(Boolean);
      if (!ids.length) return;
      const { data: items, error } = await rt.client
        .from('programacao_itens')
        .select('id,tipo,condutor_chefe_id,condutor_jovem_id,desenvolvimento')
        .in('id', ids);
      if (error) return;
      const itemMap = new Map((items || []).map((i) => [Number(i.id), i]));
      buttons.forEach((button) => {
        const item = itemMap.get(Number(button.dataset.editProgramItem || 0));
        if (!item || item.tipo !== 'atividade') return;
        const card = button.closest('.program-timeline-item');
        if (!card) return;
        const incomplete = (!item.condutor_chefe_id && !item.condutor_jovem_id && !String(item.condutor_externo_nome || '').trim()) || !String(item.desenvolvimento || '').trim();
        card.classList.toggle('program-incomplete-v58', incomplete);
      });
    } finally {
      decorating = false;
    }
  }

  function installValidation() {
    document.addEventListener('submit', (event) => {
      if (!pilot || event.target?.id !== 'programItemForm') return;
      refreshRequiredUi();
      if (validateItemForm()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    document.addEventListener('click', (event) => {
      if (!pilot || !(event.target instanceof Element)) return;
      const button = event.target.closest('button');
      if (!button) return;
      if (button.id === 'programAddManualButton' || button.matches('[data-edit-program-item]')) {
        setTimeout(refreshRequiredUi, 80);
        setTimeout(scheduleDecorate, 140);
      }
      if (!['programSaveBasicButton','programSaveNotesButton'].includes(button.id)) return;
      if (bypassButton === button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void (async () => {
        const ok = await validateProgrammingBeforeSave();
        if (!ok) return;
        bypassButton = button;
        try { button.click(); } finally { setTimeout(() => { if (bypassButton === button) bypassButton = null; }, 0); }
      })();
    }, true);

    $('programItemType')?.addEventListener('change', refreshRequiredUi);
    const dialog = $('programItemDialog');
    if (dialog) new MutationObserver(() => { if (dialog.open) setTimeout(refreshRequiredUi, 0); }).observe(dialog, {attributes:true, attributeFilter:['open']});
    const timeline = $('programTimeline');
    if (timeline) new MutationObserver(scheduleDecorate).observe(timeline, {childList:true, subtree:true});
    window.addEventListener('gearpc:program-responsible-updated', scheduleDecorate);
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt) return;
    pilot = await resolvePilot();
    if (!pilot) return;
    injectStyles();
    installValidation();
    refreshRequiredUi();
    scheduleDecorate();
  }

  void boot();
})();
