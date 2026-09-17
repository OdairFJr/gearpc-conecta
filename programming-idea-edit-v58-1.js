(() => {
  if (window.__GEARPC_PROGRAMMING_IDEA_EDIT_V58_1__) return;
  window.__GEARPC_PROGRAMMING_IDEA_EDIT_V58_1__ = true;

  const $ = (id) => document.getElementById(id);

  function collectIdeaFields() {
    const out = new Map();
    document.querySelectorAll('#ideaDetailBody .activity-sheet-field').forEach((field) => {
      const label = field.querySelector('span')?.textContent?.trim() || '';
      const value = field.querySelector('strong')?.textContent?.trim() || '';
      if (label) out.set(label, value);
    });
    return out;
  }

  function firstValue(map, labels) {
    for (const label of labels) {
      if (map.has(label)) return map.get(label) || '';
    }
    return '';
  }

  function setValue(id, value) {
    const el = $(id);
    if (!el || value == null || value === '') return;
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function splitBullets(value) {
    return String(value || '').split(' • ').map((v) => v.trim()).filter(Boolean).join('\n');
  }

  function fillActivityForm(title, fields) {
    setValue('programItemName', title);
    setValue('programItemObjective', firstValue(fields, ['Objetivo']));
    setValue('programItemAxis', firstValue(fields, ['Eixo']));
    setValue('programItemBlock', firstValue(fields, ['Bloco']));
    setValue('programItemProgressItems', splitBullets(firstValue(fields, ['Item ou itens relacionados', 'Itens relacionados'])));
    setValue('programItemMaterials', firstValue(fields, ['Material a ser usado', 'Materiais']));
    setValue('programItemPreparation', firstValue(fields, ['Preparação prévia', 'Preparação']));
    setValue('programItemDevelopment', firstValue(fields, ['Desenvolvimento / passo a passo', 'Desenvolvimento']));
    setValue('programItemRules', firstValue(fields, ['Regras']));
    setValue('programItemSafety', firstValue(fields, ['Segurança / cuidados', 'Segurança']));
    setValue('programItemPlanB', firstValue(fields, ['Plano B / adaptações', 'Plano B']));

    const durationText = firstValue(fields, ['Duração', 'Duração estimada', 'Tempo estimado']);
    const duration = Number(String(durationText).match(/\d+/)?.[0] || 0);
    if (duration > 0) setValue('programItemDuration', String(duration));

    const saveToBank = $('programItemSaveToBank');
    if (saveToBank) {
      saveToBank.checked = false;
      saveToBank.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const msg = $('programItemMessage');
    if (msg) {
      msg.textContent = 'Ideia carregada. Confira o Desenvolvimento e salve a ficha. O responsável será definido na tela geral da programação.';
      msg.classList.remove('success-message');
    }
    $('programItemDevelopment')?.focus();
  }

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('#ideaUseButton');
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const title = $('ideaDetailTitle')?.textContent?.trim() || 'Atividade';
    const fields = collectIdeaFields();

    try { $('ideaDetailDialog')?.close(); } catch (_) {}
    try { $('ideaSearchDialog')?.close(); } catch (_) {}

    const addManual = $('programAddManualButton');
    if (!addManual) return;
    addManual.click();
    window.setTimeout(() => fillActivityForm(title, fields), 120);
  }, true);
})();
