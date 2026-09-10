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

  const releaseObserver = new MutationObserver(applyRelease);
  releaseObserver.observe(button, { attributes: true, attributeFilter: ['class'] });
  window.setTimeout(applyRelease, 700);

  // v31 — O responsável pertence somente ao item lançado na programação,
  // nunca à ficha-base da atividade.
  const conductorField = document.getElementById('programItemConductor');
  conductorField?.closest('label')?.remove();

  // O código principal ainda mantém esse campo internamente por compatibilidade.
  // Antes de salvar a ficha, sincronizamos o valor com a programação geral para
  // impedir que a edição da ficha altere o responsável escolhido fora dela.
  document.getElementById('programItemForm')?.addEventListener('submit', () => {
    if (!conductorField) return;
    const itemId = Number(document.getElementById('programItemId')?.value || 0);
    const liveSelect = itemId
      ? document.querySelector(`[data-program-conductor-v31][data-item-id="${itemId}"]`)
      : null;
    conductorField.value = liveSelect?.value || '';
  }, true);

  function injectConductorStyles() {
    if (document.getElementById('programConductorStylesV31')) return;
    const style = document.createElement('style');
    style.id = 'programConductorStylesV31';
    style.textContent = `
      .program-conductor-assignment-v31 {
        display: grid;
        gap: 5px;
        margin: 10px 0 4px;
        max-width: 360px;
        font-size: 12px;
        font-weight: 800;
        color: #31465c;
      }
      .program-conductor-assignment-v31 select {
        width: 100%;
        min-height: 40px;
        box-sizing: border-box;
        border: 1px solid #c7d2df;
        border-radius: 10px;
        padding: 8px 10px;
        background: #fff;
        color: #17324d;
        font: inherit;
        font-weight: 700;
      }
      .program-conductor-assignment-v31 select:disabled {
        background: #eef2f6;
        color: #5d6875;
        opacity: 1;
      }
      .program-conductor-saving-v31 select {
        opacity: .65;
      }
    `;
    document.head.appendChild(style);
  }

  function setEditorMessage(text, ok = false) {
    const message = document.getElementById('programEditorMessage');
    if (!message) return;
    message.textContent = text || '';
    message.classList.toggle('success-message', Boolean(ok));
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function currentSectionId() {
    return Number(document.getElementById('programEditorSection')?.value || 0);
  }

  function canManageTimeline(timeline) {
    return [...timeline.querySelectorAll('[data-edit-program-item]')]
      .some((control) => !/^\s*Ver ficha\s*$/i.test(control.textContent || ''));
  }

  async function loadSectionChiefs(sectionId) {
    if (!sectionId) return [];
    const { data: links, error: linksError } = await client
      .from('chefe_secoes')
      .select('chefe_id')
      .eq('secao_id', sectionId);
    if (linksError) throw linksError;

    const ids = [...new Set((links || []).map((row) => Number(row.chefe_id)).filter(Boolean))];
    if (!ids.length) return [];

    const { data: chiefs, error: chiefsError } = await client
      .from('chefes')
      .select('id,nome_completo,ativo')
      .in('id', ids)
      .eq('ativo', true)
      .order('nome_completo');
    if (chiefsError) throw chiefsError;
    return chiefs || [];
  }

  async function loadItemConductors(itemIds) {
    if (!itemIds.length) return new Map();
    const { data, error } = await client
      .from('programacao_itens')
      .select('id,condutor_chefe_id')
      .in('id', itemIds);
    if (error) throw error;
    return new Map((data || []).map((row) => [Number(row.id), row.condutor_chefe_id ? Number(row.condutor_chefe_id) : null]));
  }

  function buildOptions(chiefs, selectedId) {
    return `<option value="">A definir</option>${chiefs.map((chief) =>
      `<option value="${chief.id}"${Number(selectedId) === Number(chief.id) ? ' selected' : ''}>${escapeHtml(chief.nome_completo)}</option>`
    ).join('')}`;
  }

  async function saveConductor(select) {
    const itemId = Number(select.dataset.itemId || 0);
    if (!itemId) return;
    const previous = select.dataset.savedValue || '';
    const nextValue = select.value;
    const wrap = select.closest('.program-conductor-assignment-v31');
    select.disabled = true;
    wrap?.classList.add('program-conductor-saving-v31');
    setEditorMessage('Salvando chefe responsável...');

    const { error } = await client
      .from('programacao_itens')
      .update({
        condutor_chefe_id: nextValue ? Number(nextValue) : null,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', itemId);

    wrap?.classList.remove('program-conductor-saving-v31');
    if (error) {
      select.value = previous;
      select.disabled = false;
      setEditorMessage('Não foi possível salvar o chefe responsável.');
      return;
    }

    select.dataset.savedValue = nextValue;
    select.disabled = false;
    setEditorMessage('Chefe responsável atualizado nesta programação.', true);
  }

  let enhancing = false;
  async function enhanceTimeline() {
    const timeline = document.getElementById('programTimeline');
    if (!timeline || enhancing) return;

    const activityCards = [...timeline.querySelectorAll('.program-timeline-item.activity-item')]
      .filter((card) => !card.dataset.conductorEnhancedV31);
    if (!activityCards.length) return;

    const sectionId = currentSectionId();
    if (!sectionId) return;

    enhancing = true;
    try {
      injectConductorStyles();
      const manageable = canManageTimeline(timeline);
      const itemIds = activityCards
        .map((card) => Number(card.querySelector('[data-edit-program-item]')?.dataset.editProgramItem || 0))
        .filter(Boolean);
      const [chiefs, conductors] = await Promise.all([
        loadSectionChiefs(sectionId),
        loadItemConductors(itemIds)
      ]);

      activityCards.forEach((card) => {
        const edit = card.querySelector('[data-edit-program-item]');
        const itemId = Number(edit?.dataset.editProgramItem || 0);
        const main = card.querySelector('.program-item-main');
        if (!itemId || !main) return;

        card.querySelector('.program-conductor')?.remove();
        const selectedId = conductors.get(itemId) || '';
        const label = document.createElement('label');
        label.className = 'program-conductor-assignment-v31';
        label.innerHTML = `Chefe responsável nesta programação
          <select data-program-conductor-v31 data-item-id="${itemId}" data-saved-value="${selectedId || ''}" ${manageable ? '' : 'disabled'}>
            ${buildOptions(chiefs, selectedId)}
          </select>`;

        const heading = main.querySelector('.program-item-heading');
        if (heading) heading.insertAdjacentElement('afterend', label);
        else main.prepend(label);

        const select = label.querySelector('select');
        if (manageable) select?.addEventListener('change', () => saveConductor(select));
        card.dataset.conductorEnhancedV31 = '1';
      });
    } catch (error) {
      console.error('GEArPC: falha ao preparar responsáveis da programação', error);
      setEditorMessage('Não foi possível carregar os chefes responsáveis.');
    } finally {
      enhancing = false;
    }
  }

  const timeline = document.getElementById('programTimeline');
  if (timeline) {
    let timer = null;
    const scheduleEnhance = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(enhanceTimeline, 40);
    };
    const timelineObserver = new MutationObserver(scheduleEnhance);
    timelineObserver.observe(timeline, { childList: true, subtree: true });
    scheduleEnhance();
  }

  document.getElementById('programEditorSection')?.addEventListener('change', () => {
    const timelineEl = document.getElementById('programTimeline');
    timelineEl?.querySelectorAll('.program-timeline-item.activity-item').forEach((card) => {
      delete card.dataset.conductorEnhancedV31;
      card.querySelector('.program-conductor-assignment-v31')?.remove();
    });
    window.setTimeout(enhanceTimeline, 50);
  });
})();
