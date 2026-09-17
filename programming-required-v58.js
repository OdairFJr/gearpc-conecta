(() => {
  if (window.__GEARPC_PROGRAMMING_REQUIRED_V58__) return;
  window.__GEARPC_PROGRAMMING_REQUIRED_V58__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let pilot = false;
  let bypassButton = null;
  let timelineObserver = null;
  let previewObserver = null;
  let decorateTimer = null;

  const esc = (value) => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

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
    const { data, error } = await rt.client
      .from('perfis_usuarios')
      .select('eh_teste')
      .eq('user_id', rt.state.user.id)
      .maybeSingle();
    return !error && data?.eh_teste === true;
  }

  function injectStyles() {
    if ($('programmingRequiredStylesV58')) return;
    const style = document.createElement('style');
    style.id = 'programmingRequiredStylesV58';
    style.textContent = `
      .program-required-v58{display:inline-flex;align-items:center;gap:5px;margin-left:6px;font-size:.72rem;font-weight:900;color:#a22520}
      .program-required-missing-v58{color:#a22520!important;background:#fff2f1;border:1px solid #f2c7c4;border-radius:8px;padding:6px 8px;width:max-content;max-width:100%}
      .program-timeline-item.program-incomplete-v58{border-color:#d88983!important;box-shadow:0 0 0 2px rgba(162,37,32,.08)}
      .program-required-hint-v58{margin:6px 0 0;color:#8d332e;font-size:.78rem;font-weight:800}
    `;
    document.head.appendChild(style);
  }

  function isActivityForm() {
    return String($('programItemType')?.value || '') === 'atividade';
  }

  function markFieldRequired(control, labelText) {
    if (!control) return;
    control.required = true;
    const label = control.closest('label');
    if (!label || label.querySelector(`[data-required-v58="${labelText}"]`)) return;
    const badge = document.createElement('span');
    badge.className = 'program-required-v58';
    badge.dataset.requiredV58 = labelText;
    badge.textContent = '• obrigatório';
    label.insertBefore(badge, control);
  }

  function clearFieldRequired(control, labelText) {
    if (!control) return;
    control.required = false;
    control.closest('label')?.querySelector(`[data-required-v58="${labelText}"]`)?.remove();
  }

  function refreshRequiredUi() {
    const conductor = $('programItemConductor');
    const development = $('programItemDevelopment');
    const activity = isActivityForm();
    if (activity) {
      markFieldRequired(conductor, 'responsavel');
      markFieldRequired(development, 'desenvolvimento');
    } else {
      clearFieldRequired(conductor, 'responsavel');
      clearFieldRequired(development, 'desenvolvimento');
    }
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
    const conductor = $('programItemConductor');
    const development = $('programItemDevelopment');
    if (!String(conductor?.value || '').trim()) {
      showItemError('Selecione o chefe responsável antes de salvar a atividade.', conductor);
      return false;
    }
    if (!String(development?.value || '').trim()) {
      showItemError('Preencha o Desenvolvimento da atividade antes de salvar.', development);
      return false;
    }
    return true;
  }

  async function currentProgramIdFromScreen() {
    const itemButton = document.querySelector('#programTimeline [data-edit-program-item]');
    const itemId = Number(itemButton?.dataset?.editProgramItem || 0);
    if (!itemId) return null;
    const { data, error } = await rt.client
      .from('programacao_itens')
      .select('programacao_id')
      .eq('id', itemId)
      .maybeSingle();
    if (error) return null;
    return Number(data?.programacao_id || 0) || null;
  }

  async function incompleteItemsForCurrentProgram() {
    const programId = await currentProgramIdFromScreen();
    if (!programId) return [];
    const { data, error } = await rt.client
      .from('programacao_itens')
      .select('id,nome,condutor_chefe_id,desenvolvimento,tipo')
      .eq('programacao_id', programId)
      .eq('tipo', 'atividade');
    if (error) return [];
    return (data || []).filter((item) => !item.condutor_chefe_id || !String(item.desenvolvimento || '').trim());
  }

  function markIncompleteCards(items) {
    const ids = new Set((items || []).map((i) => Number(i.id)));
    document.querySelectorAll('#programTimeline .program-timeline-item').forEach((card) => {
      const id = Number(card.querySelector('[data-edit-program-item]')?.dataset?.editProgramItem || 0);
      card.classList.toggle('program-incomplete-v58', ids.has(id));
    });
  }

  async function validateProgrammingBeforeSave() {
    const incomplete = await incompleteItemsForCurrentProgram();
    markIncompleteCards(incomplete);
    if (!incomplete.length) return true;
    const first = incomplete[0];
    const missing = [];
    if (!first.condutor_chefe_id) missing.push('chefe responsável');
    if (!String(first.desenvolvimento || '').trim()) missing.push('desenvolvimento');
    const msg = $('programEditorMessage');
    if (msg) {
      msg.textContent = `Não é possível salvar a programação: “${first.nome || 'atividade'}” está sem ${missing.join(' e ')}.`;
      msg.classList.remove('success-message');
    }
    const card = document.querySelector(`#programTimeline [data-edit-program-item="${first.id}"]`)?.closest('.program-timeline-item');
    card?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    return false;
  }

  function scheduleDecorate() {
    clearTimeout(decorateTimer);
    decorateTimer = setTimeout(() => { void decorateTimeline(); decoratePreview(); }, 40);
  }

  async function decorateTimeline() {
    const timeline = $('programTimeline');
    if (!timeline) return;
    const buttons = [...timeline.querySelectorAll('[data-edit-program-item]')];
    const ids = buttons.map((b) => Number(b.dataset.editProgramItem || 0)).filter(Boolean);
    if (!ids.length) return;

    const { data: items, error } = await rt.client
      .from('programacao_itens')
      .select('id,tipo,nome,condutor_chefe_id,desenvolvimento')
      .in('id', ids);
    if (error) return;
    const chiefIds = [...new Set((items || []).map((i) => Number(i.condutor_chefe_id || 0)).filter(Boolean))];
    let chiefMap = new Map();
    if (chiefIds.length) {
      const { data: chiefs } = await rt.client.from('chefes').select('id,nome_completo').in('id', chiefIds);
      chiefMap = new Map((chiefs || []).map((c) => [Number(c.id), c.nome_completo]));
    }
    const itemMap = new Map((items || []).map((i) => [Number(i.id), i]));

    buttons.forEach((button) => {
      const id = Number(button.dataset.editProgramItem || 0);
      const item = itemMap.get(id);
      if (!item || item.tipo !== 'atividade') return;
      const card = button.closest('.program-timeline-item');
      if (!card) return;
      const main = card.querySelector('.program-item-main');
      const name = chiefMap.get(Number(item.condutor_chefe_id || 0)) || '';
      let p = card.querySelector('.program-conductor');
      if (!p) {
        p = document.createElement('p');
        p.className = 'program-conductor';
        const heading = card.querySelector('.program-item-heading');
        if (heading) heading.insertAdjacentElement('afterend', p); else main?.prepend(p);
      }
      if (name) {
        p.classList.remove('program-required-missing-v58');
        p.innerHTML = `Responsável: <strong>${esc(name)}</strong>`;
      } else {
        p.classList.add('program-required-missing-v58');
        p.innerHTML = 'Responsável: <strong>Não informado</strong>';
      }
      const incomplete = !item.condutor_chefe_id || !String(item.desenvolvimento || '').trim();
      card.classList.toggle('program-incomplete-v58', incomplete);
    });
  }

  function decoratePreview() {
    const preview = $('programPreviewTimeline');
    if (!preview) return;
    preview.querySelectorAll('.program-preview-item').forEach((card) => {
      const main = card.querySelector('.program-preview-main');
      if (!main) return;
      const ps = [...main.querySelectorAll(':scope > p')];
      const responsible = ps.find((p) => String(p.textContent || '').trim().startsWith('Responsável:'));
      if (!responsible) {
        const p = document.createElement('p');
        p.className = 'program-required-missing-v58';
        p.innerHTML = 'Responsável: <strong>Não informado</strong>';
        main.querySelector('h3')?.insertAdjacentElement('afterend', p);
      }
    });
  }

  function installObservers() {
    const timeline = $('programTimeline');
    if (timeline && !timelineObserver) {
      timelineObserver = new MutationObserver(scheduleDecorate);
      timelineObserver.observe(timeline, { childList: true, subtree: true });
    }
    const preview = $('programPreviewTimeline');
    if (preview && !previewObserver) {
      previewObserver = new MutationObserver(scheduleDecorate);
      previewObserver.observe(preview, { childList: true, subtree: true });
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
        setTimeout(scheduleDecorate, 120);
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
    if (dialog) {
      const obs = new MutationObserver(() => { if (dialog.open) setTimeout(refreshRequiredUi, 0); });
      obs.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    }
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt) return;
    pilot = await resolvePilot();
    if (!pilot) return;
    injectStyles();
    installObservers();
    installValidation();
    refreshRequiredUi();
    scheduleDecorate();
  }

  void boot();
})();
