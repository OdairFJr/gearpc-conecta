(() => {
  if (window.__GEARPC_PROGRAMMING_RESPONSIBLE_GENERAL_V60__) return;
  window.__GEARPC_PROGRAMMING_RESPONSIBLE_GENERAL_V60__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let pilot = false;
  let decorateTimer = null;
  let decorating = false;
  let lastSectionId = null;
  let adults = [];
  let youths = [];
  let pioneerSection = false;

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
    const { data, error } = await rt.client.from('perfis_usuarios').select('eh_teste').eq('user_id', rt.state.user.id).maybeSingle();
    return !error && data?.eh_teste === true;
  }

  function injectStyles() {
    if ($('programResponsibleGeneralStylesV60')) return;
    const style = document.createElement('style');
    style.id = 'programResponsibleGeneralStylesV60';
    style.textContent = `
      .program-responsible-v60{margin-top:10px;display:grid;gap:5px;max-width:460px}
      .program-responsible-v60 label{font-size:.76rem;font-weight:900;color:#30475d}
      .program-responsible-v60 label::after{content:' • obrigatório';color:#a22520;font-size:.7rem}
      .program-responsible-v60 select{width:100%;box-sizing:border-box;border:1px solid #bfcbd6;border-radius:9px;padding:9px 10px;background:#fff;color:#17324d;font:inherit}
      .program-responsible-v60 select.missing{border-color:#d88983;background:#fff7f6}
      .program-responsible-v60 select:disabled{background:#f1f4f7;color:#5e6d7c}
      .program-responsible-status-v60{min-height:16px;font-size:.72rem;color:#577084}.program-responsible-status-v60.ok{color:#1f6d39}.program-responsible-status-v60.error{color:#a22520;font-weight:800}
    `;
    document.head.appendChild(style);
  }

  async function currentSectionId() {
    const direct = Number($('programEditorSection')?.value || 0);
    if (direct) return direct;
    const firstButton = document.querySelector('#programTimeline [data-edit-program-item]');
    const itemId = Number(firstButton?.dataset?.editProgramItem || 0);
    if (!itemId) return null;
    const { data: item } = await rt.client.from('programacao_itens').select('programacao_id').eq('id', itemId).maybeSingle();
    if (!item?.programacao_id) return null;
    const { data: program } = await rt.client.from('programacoes').select('secao_id').eq('id', item.programacao_id).maybeSingle();
    return Number(program?.secao_id || 0) || null;
  }

  async function loadPeople(sectionId) {
    if (!sectionId) return;
    if (Number(lastSectionId) === Number(sectionId) && adults.length) return;

    const [sectionRes, linksRes] = await Promise.all([
      rt.client.from('secoes').select('id,nome,ramo_id').eq('id', sectionId).maybeSingle(),
      rt.client.from('chefe_secoes').select('chefe_id').eq('secao_id', sectionId)
    ]);
    if (sectionRes.error || linksRes.error) return;

    const section = sectionRes.data;
    let ramoName = '';
    if (section?.ramo_id) {
      const { data: ramo } = await rt.client.from('ramos').select('nome').eq('id', section.ramo_id).maybeSingle();
      ramoName = ramo?.nome || '';
    }
    pioneerSection = /pioneir/i.test(ramoName) || /caixa preta/i.test(section?.nome || '');

    const chiefIds = [...new Set((linksRes.data || []).map((r) => Number(r.chefe_id)).filter(Boolean))];
    if (chiefIds.length) {
      const { data } = await rt.client.from('chefes').select('id,nome_completo,ativo').in('id', chiefIds).eq('ativo', true).order('nome_completo');
      adults = data || [];
    } else adults = [];

    if (pioneerSection) {
      const { data } = await rt.client.from('jovens').select('id,nome_completo,ativo,secao_id').eq('secao_id', sectionId).eq('ativo', true).order('nome_completo');
      youths = data || [];
    } else youths = [];

    lastSectionId = sectionId;
  }

  function optionHtml(item) {
    const current = item.condutor_jovem_id
      ? `jovem:${item.condutor_jovem_id}`
      : item.condutor_chefe_id
        ? `chefe:${item.condutor_chefe_id}`
        : '';
    const chiefOptions = adults.map((c) => `<option value="chefe:${Number(c.id)}" ${current === `chefe:${c.id}` ? 'selected' : ''}>${esc(c.nome_completo)}</option>`).join('');
    const youthOptions = pioneerSection
      ? youths.map((j) => `<option value="jovem:${Number(j.id)}" ${current === `jovem:${j.id}` ? 'selected' : ''}>${esc(j.nome_completo)} — Pioneiro</option>`).join('')
      : '';
    return `<option value="" ${!current ? 'selected' : ''}>Selecione o responsável</option>` +
      (chiefOptions ? `<optgroup label="Chefia">${chiefOptions}</optgroup>` : '') +
      (youthOptions ? `<optgroup label="Pioneiros">${youthOptions}</optgroup>` : '');
  }

  function canEditCard(button) {
    if (rt.state.profile?.tipo === 'administrador') return true;
    const text = String(button?.textContent || '').toLowerCase();
    return !text.includes('ver ficha');
  }

  async function decorate() {
    if (decorating) return;
    decorating = true;
    try {
      const timeline = $('programTimeline');
      if (!timeline) return;
      const buttons = [...timeline.querySelectorAll('[data-edit-program-item]')];
      const ids = buttons.map((b) => Number(b.dataset.editProgramItem || 0)).filter(Boolean);
      if (!ids.length) return;

      const sectionId = await currentSectionId();
      if (!sectionId) return;
      await loadPeople(sectionId);

      const { data: items, error } = await rt.client.from('programacao_itens')
        .select('id,tipo,condutor_chefe_id,condutor_jovem_id,desenvolvimento')
        .in('id', ids);
      if (error) return;
      const itemMap = new Map((items || []).map((i) => [Number(i.id), i]));

      buttons.forEach((button) => {
        const id = Number(button.dataset.editProgramItem || 0);
        const item = itemMap.get(id);
        if (!item || item.tipo !== 'atividade') return;
        const card = button.closest('.program-timeline-item');
        if (!card) return;

        let box = card.querySelector('.program-responsible-v60');
        if (!box) {
          box = document.createElement('div');
          box.className = 'program-responsible-v60';
          box.innerHTML = `<label>Responsável pela condução</label><select data-program-responsible-v60="${id}"></select><span class="program-responsible-status-v60"></span>`;
          const main = card.querySelector('.program-item-main');
          if (main) main.appendChild(box);
        }
        const select = box.querySelector('select');
        if (!select) return;
        const desired = item.condutor_jovem_id ? `jovem:${item.condutor_jovem_id}` : item.condutor_chefe_id ? `chefe:${item.condutor_chefe_id}` : '';
        if (select.dataset.loadedValue !== desired || select.options.length <= 1) {
          select.innerHTML = optionHtml(item);
          select.value = desired;
          select.dataset.loadedValue = desired;
        }
        select.disabled = !canEditCard(button);
        select.classList.toggle('missing', !desired);
      });
    } finally {
      decorating = false;
    }
  }

  function scheduleDecorate() {
    clearTimeout(decorateTimer);
    decorateTimer = setTimeout(() => { void decorate(); }, 100);
  }

  async function saveResponsible(select) {
    const itemId = Number(select.dataset.programResponsibleV60 || 0);
    if (!itemId) return;
    const status = select.closest('.program-responsible-v60')?.querySelector('.program-responsible-status-v60');
    const previous = select.dataset.loadedValue || '';
    const raw = String(select.value || '');
    let payload = { condutor_chefe_id: null, condutor_jovem_id: null, atualizado_em: new Date().toISOString() };
    if (raw.startsWith('chefe:')) payload.condutor_chefe_id = Number(raw.split(':')[1] || 0) || null;
    if (raw.startsWith('jovem:')) payload.condutor_jovem_id = Number(raw.split(':')[1] || 0) || null;

    select.disabled = true;
    if (status) { status.textContent = 'Salvando responsável...'; status.className = 'program-responsible-status-v60'; }
    const { error } = await rt.client.from('programacao_itens').update(payload).eq('id', itemId);
    select.disabled = false;
    if (error) {
      select.value = previous;
      if (status) { status.textContent = 'Não foi possível salvar o responsável.'; status.className = 'program-responsible-status-v60 error'; }
      return;
    }
    select.dataset.loadedValue = raw;
    select.classList.toggle('missing', !raw);
    if (status) { status.textContent = raw ? 'Responsável salvo.' : 'Responsável removido.'; status.className = 'program-responsible-status-v60 ok'; }
    window.dispatchEvent(new CustomEvent('gearpc:program-responsible-updated', { detail: { itemId } }));
    setTimeout(() => { if (status) status.textContent = ''; }, 1800);
  }

  function bind() {
    document.addEventListener('change', (event) => {
      const select = event.target instanceof Element ? event.target.closest('[data-program-responsible-v60]') : null;
      if (select) void saveResponsible(select);
    });

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('#programmingButton,[data-program-id],#editProgramFromPreviewButton,#programEditorBackButton,[data-edit-program-item],#programAddManualButton')) {
        setTimeout(scheduleDecorate, 180);
      }
    }, true);

    const timeline = $('programTimeline');
    if (timeline) new MutationObserver(scheduleDecorate).observe(timeline, { childList:true, subtree:true });
    const editor = $('programEditorView');
    if (editor) new MutationObserver(() => {
      if (!editor.classList.contains('hidden')) scheduleDecorate();
    }).observe(editor, { attributes:true, attributeFilter:['class'] });
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt) return;
    pilot = await resolvePilot();
    if (!pilot) return;
    injectStyles();
    bind();
    scheduleDecorate();
  }

  void boot();
})();
