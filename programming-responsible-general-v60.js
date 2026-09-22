(() => {
  if (window.__GEARPC_PROGRAMMING_RESPONSIBLE_GENERAL_V60__) return;
  window.__GEARPC_PROGRAMMING_RESPONSIBLE_GENERAL_V60__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let pilot = false;
  let decorateTimer = null;
  let decorating = false;
  let adults = [];
  let pioneers = [];

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
      .program-conductor-assignment-v31{display:none!important}
      .program-responsible-v60{margin-top:10px;display:grid;gap:7px;max-width:520px}
      .program-responsible-v60 label{font-size:.76rem;font-weight:900;color:#30475d}
      .program-responsible-v60 label::after{content:' • obrigatório';color:#a22520;font-size:.7rem}
      .program-responsible-v60 select,.program-responsible-v60 input{width:100%;box-sizing:border-box;border:1px solid #bfcbd6;border-radius:9px;padding:9px 10px;background:#fff;color:#17324d;font:inherit}
      .program-responsible-v60 select.missing{border-color:#d88983;background:#fff7f6}
      .program-responsible-v60 select:disabled{background:#f1f4f7;color:#5e6d7c}
      .program-responsible-external-v60{display:grid;grid-template-columns:1fr auto;gap:8px}.program-responsible-external-v60.hidden{display:none}
      .program-responsible-external-v60 button{border:1px solid #bfcbd6;background:#fff;border-radius:9px;padding:9px 12px;font:inherit;font-weight:800;cursor:pointer}
      .program-responsible-status-v60{min-height:16px;font-size:.72rem;color:#577084}.program-responsible-status-v60.ok{color:#1f6d39}.program-responsible-status-v60.error{color:#a22520;font-weight:800}
    `;
    document.head.appendChild(style);
  }

  async function loadPeople() {
    const [chiefRes, ramoRes] = await Promise.all([
      rt.client.from('chefes').select('id,nome_completo,ativo').eq('ativo', true).order('nome_completo'),
      rt.client.from('ramos').select('id,nome,ativo').eq('ativo', true)
    ]);
    adults = chiefRes.error ? [] : (chiefRes.data || []);
    const pioneerRamo = (ramoRes.data || []).find((r) => /pioneir/i.test(r.nome || ''));
    if (!pioneerRamo) { pioneers = []; return; }
    const { data, error } = await rt.client.from('jovens')
      .select('id,nome_completo,ramo_id,ativo')
      .eq('ramo_id', pioneerRamo.id).eq('ativo', true).order('nome_completo');
    pioneers = error ? [] : (data || []);
  }

  function currentValue(item) {
    if (item.condutor_externo_nome) return 'externo';
    if (item.condutor_jovem_id) return `jovem:${item.condutor_jovem_id}`;
    if (item.condutor_chefe_id) return `chefe:${item.condutor_chefe_id}`;
    return '';
  }

  function optionHtml(item) {
    const current = currentValue(item);
    const chiefOptions = adults.map((c) => `<option value="chefe:${Number(c.id)}" ${current === `chefe:${c.id}` ? 'selected' : ''}>${esc(c.nome_completo)}</option>`).join('');
    const youthOptions = pioneers.map((j) => `<option value="jovem:${Number(j.id)}" ${current === `jovem:${j.id}` ? 'selected' : ''}>${esc(j.nome_completo)} — Pioneiro</option>`).join('');
    return `<option value="" ${!current ? 'selected' : ''}>Selecione o responsável</option>` +
      (chiefOptions ? `<optgroup label="Chefes do grupo">${chiefOptions}</optgroup>` : '') +
      (youthOptions ? `<optgroup label="Pioneiros">${youthOptions}</optgroup>` : '') +
      `<optgroup label="Outras pessoas"><option value="externo" ${current === 'externo' ? 'selected' : ''}>Outra pessoa — digitar nome</option></optgroup>`;
  }

  function canEditCard(button) {
    if (rt.state.profile?.tipo === 'administrador') return true;
    return !String(button?.textContent || '').toLowerCase().includes('ver ficha');
  }

  async function decorate() {
    if (decorating) return;
    decorating = true;
    try {
      document.querySelectorAll('.program-conductor-assignment-v31').forEach((el) => el.remove());
      document.querySelectorAll('#programTimeline .program-timeline-item.activity-item').forEach((card) => { card.dataset.conductorEnhancedV31 = '1'; });

      const buttons = [...document.querySelectorAll('#programTimeline [data-edit-program-item]')];
      const ids = buttons.map((b) => Number(b.dataset.editProgramItem || 0)).filter(Boolean);
      if (!ids.length) return;
      await loadPeople();
      const { data: items, error } = await rt.client.from('programacao_itens')
        .select('id,tipo,condutor_chefe_id,condutor_jovem_id,condutor_externo_nome,desenvolvimento')
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
          box.innerHTML = `<label>Responsável pela condução</label>
            <select data-program-responsible-v60="${id}"></select>
            <div class="program-responsible-external-v60 hidden">
              <input type="text" maxlength="180" placeholder="Nome da pessoa responsável" data-external-name-v60="${id}">
              <button type="button" data-save-external-v60="${id}">Salvar nome</button>
            </div>
            <span class="program-responsible-status-v60"></span>`;
          card.querySelector('.program-item-main')?.appendChild(box);
        }
        const select = box.querySelector('select');
        const extWrap = box.querySelector('.program-responsible-external-v60');
        const extInput = box.querySelector('[data-external-name-v60]');
        const desired = currentValue(item);
        select.innerHTML = optionHtml(item);
        select.value = desired;
        select.dataset.loadedValue = desired;
        select.disabled = !canEditCard(button);
        select.classList.toggle('missing', !desired);
        extWrap?.classList.toggle('hidden', desired !== 'externo');
        if (extInput) extInput.value = item.condutor_externo_nome || '';
        if (extInput) extInput.disabled = !canEditCard(button);
        box.querySelector('[data-save-external-v60]')?.toggleAttribute('disabled', !canEditCard(button));
        const incomplete = (!item.condutor_chefe_id && !item.condutor_jovem_id && !String(item.condutor_externo_nome || '').trim()) || !String(item.desenvolvimento || '').trim();
        card.classList.toggle('program-incomplete-v58', incomplete);
      });
    } finally { decorating = false; }
  }

  function scheduleDecorate() {
    clearTimeout(decorateTimer);
    decorateTimer = setTimeout(() => { void decorate(); }, 120);
  }

  async function saveResponsible(select) {
    const itemId = Number(select.dataset.programResponsibleV60 || 0);
    if (!itemId) return;
    const box = select.closest('.program-responsible-v60');
    const status = box?.querySelector('.program-responsible-status-v60');
    const raw = String(select.value || '');
    const extWrap = box?.querySelector('.program-responsible-external-v60');
    const extInput = box?.querySelector('[data-external-name-v60]');

    if (raw === 'externo') {
      extWrap?.classList.remove('hidden');
      select.classList.add('missing');
      if (status) { status.textContent = 'Digite o nome da pessoa e toque em “Salvar nome”.'; status.className = 'program-responsible-status-v60'; }
      extInput?.focus();
      return;
    }
    extWrap?.classList.add('hidden');

    const previous = select.dataset.loadedValue || '';
    const payload = { condutor_chefe_id:null, condutor_jovem_id:null, condutor_externo_nome:null, atualizado_em:new Date().toISOString() };
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
    window.dispatchEvent(new CustomEvent('gearpc:program-responsible-updated', { detail:{ itemId } }));
    setTimeout(scheduleDecorate, 150);
  }

  async function saveExternal(button) {
    const itemId = Number(button.dataset.saveExternalV60 || 0);
    const box = button.closest('.program-responsible-v60');
    const input = box?.querySelector('[data-external-name-v60]');
    const select = box?.querySelector('select');
    const status = box?.querySelector('.program-responsible-status-v60');
    const name = String(input?.value || '').trim();
    if (name.length < 2) {
      if (status) { status.textContent = 'Digite o nome da pessoa responsável.'; status.className = 'program-responsible-status-v60 error'; }
      input?.focus();
      return;
    }
    button.disabled = true;
    const { error } = await rt.client.from('programacao_itens').update({
      condutor_chefe_id:null, condutor_jovem_id:null, condutor_externo_nome:name, atualizado_em:new Date().toISOString()
    }).eq('id', itemId);
    button.disabled = false;
    if (error) {
      if (status) { status.textContent = 'Não foi possível salvar o nome.'; status.className = 'program-responsible-status-v60 error'; }
      return;
    }
    if (select) { select.dataset.loadedValue = 'externo'; select.classList.remove('missing'); }
    if (status) { status.textContent = 'Responsável externo salvo.'; status.className = 'program-responsible-status-v60 ok'; }
    window.dispatchEvent(new CustomEvent('gearpc:program-responsible-updated', { detail:{ itemId } }));
    setTimeout(scheduleDecorate, 150);
  }

  function bind() {
    document.addEventListener('change', (event) => {
      const select = event.target instanceof Element ? event.target.closest('[data-program-responsible-v60]') : null;
      if (select) void saveResponsible(select);
    }, true);

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const ext = event.target.closest('[data-save-external-v60]');
      if (ext) { event.preventDefault(); event.stopPropagation(); void saveExternal(ext); return; }
      if (event.target.closest('#programmingButton,[data-program-id],#editProgramFromPreviewButton,#programEditorBackButton,[data-edit-program-item],#programAddManualButton')) {
        setTimeout(scheduleDecorate, 180);
      }
    }, true);

    const timeline = $('programTimeline');
    if (timeline) new MutationObserver(scheduleDecorate).observe(timeline, { childList:true, subtree:true });
    const editor = $('programEditorView');
    if (editor) new MutationObserver(() => { if (!editor.classList.contains('hidden')) scheduleDecorate(); }).observe(editor, { attributes:true, attributeFilter:['class'] });
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