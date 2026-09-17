(() => {
  if (window.__GEARPC_PROGRAMMING_PIONEER_CONDUCTOR_V59__) return;
  window.__GEARPC_PROGRAMMING_PIONEER_CONDUCTOR_V59__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let pilot = false;
  let savingYouth = false;
  let cachedYouth = [];
  let currentSectionId = null;
  let currentProgramId = null;

  const splitLines = (value) => String(value || '').split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
  const getAreas = () => [...(document.querySelectorAll('#programItemAreas input[type="checkbox"]:checked') || [])].map((i) => i.value);
  const getRamos = () => [...(document.querySelectorAll('#programItemRamos input[value]:checked') || [])].map((i) => i.value);

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

  async function resolveCurrentProgram() {
    const sectionId = Number($('programEditorSection')?.value || 0);
    const date = $('programEditorDate')?.value || '';
    currentSectionId = sectionId || null;
    if (!sectionId || !date) return null;
    const { data } = await rt.client.from('programacoes').select('id').eq('secao_id', sectionId).eq('data_atividade', date).maybeSingle();
    currentProgramId = Number(data?.id || 0) || null;
    return currentProgramId;
  }

  async function isPioneerSection(sectionId) {
    if (!sectionId) return false;
    const { data, error } = await rt.client.from('secoes').select('id,nome,ramo_id,ramos(nome)').eq('id', sectionId).maybeSingle();
    if (error || !data) return false;
    const ramoName = data.ramos?.nome || '';
    return /pioneir/i.test(ramoName) || /caixa preta/i.test(data.nome || '');
  }

  async function loadYouth(sectionId) {
    const { data, error } = await rt.client.from('jovens').select('id,nome_completo,secao_id,ativo').eq('secao_id', sectionId).eq('ativo', true).order('nome_completo');
    if (error) return [];
    cachedYouth = data || [];
    return cachedYouth;
  }

  async function enhanceConductorSelect() {
    const select = $('programItemConductor');
    if (!select) return;
    await resolveCurrentProgram();
    if (!(await isPioneerSection(currentSectionId))) {
      select.querySelectorAll('option[data-pioneer-youth="1"]').forEach((o) => o.remove());
      return;
    }
    const youth = await loadYouth(currentSectionId);
    select.querySelectorAll('option[data-pioneer-youth="1"]').forEach((o) => o.remove());
    if (!youth.length) return;
    const group = document.createElement('optgroup');
    group.label = 'Pioneiros';
    group.dataset.pioneerYouth = '1';
    youth.forEach((j) => {
      const option = document.createElement('option');
      option.value = `jovem:${j.id}`;
      option.textContent = `${j.nome_completo} — Pioneiro`;
      option.dataset.pioneerYouth = '1';
      group.appendChild(option);
    });
    select.appendChild(group);

    const itemId = Number($('programItemId')?.value || 0);
    if (itemId) {
      const { data } = await rt.client.from('programacao_itens').select('condutor_jovem_id').eq('id', itemId).maybeSingle();
      if (data?.condutor_jovem_id) select.value = `jovem:${data.condutor_jovem_id}`;
    }
  }

  function field(id) { return $(id)?.value?.trim?.() ?? String($(id)?.value || '').trim(); }

  async function saveYouthResponsible(event) {
    const select = $('programItemConductor');
    const raw = String(select?.value || '');
    if (!raw.startsWith('jovem:')) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (savingYouth) return true;
    savingYouth = true;
    const youthId = Number(raw.split(':')[1] || 0);
    const msg = $('programItemMessage');
    const development = field('programItemDevelopment');
    if (!youthId) {
      if (msg) msg.textContent = 'Selecione um pioneiro válido.';
      savingYouth = false;
      return true;
    }
    if (!development) {
      if (msg) msg.textContent = 'Preencha o Desenvolvimento da atividade antes de salvar.';
      $('programItemDevelopment')?.focus();
      savingYouth = false;
      return true;
    }
    await resolveCurrentProgram();
    if (!currentProgramId) {
      if (msg) msg.textContent = 'Não foi possível identificar a programação atual.';
      savingYouth = false;
      return true;
    }

    const payload = {
      hora_inicio: field('programItemStart'),
      duracao_min: Number($('programItemDuration')?.value || 15),
      nome: field('programItemName'),
      condutor_chefe_id: null,
      condutor_jovem_id: youthId,
      objetivo: field('programItemObjective') || null,
      areas_desenvolvimento: getAreas(),
      eixo: field('programItemAxis') || null,
      bloco: field('programItemBlock') || null,
      itens_progressao: splitLines(field('programItemProgressItems')),
      materiais: field('programItemMaterials') || null,
      preparacao: field('programItemPreparation') || null,
      desenvolvimento: development,
      regras: field('programItemRules') || null,
      seguranca: field('programItemSafety') || null,
      plano_b: field('programItemPlanB') || null,
      tipo: 'atividade',
      origem: $('programItemOrigin')?.value || 'manual',
      atualizado_em: new Date().toISOString()
    };

    if (!payload.hora_inicio || !payload.nome) {
      if (msg) msg.textContent = 'Informe o horário e o nome da atividade.';
      savingYouth = false;
      return true;
    }

    const itemId = Number($('programItemId')?.value || 0);
    let result;
    if (itemId) {
      result = await rt.client.from('programacao_itens').update(payload).eq('id', itemId);
    } else {
      result = await rt.client.from('programacao_itens').insert({
        ...payload,
        programacao_id: currentProgramId,
        ordem: 40,
        criado_por: rt.state.user.id
      });
    }
    if (result.error) {
      if (msg) msg.textContent = `Não foi possível salvar a atividade: ${result.error.message || 'erro'}`;
      savingYouth = false;
      return true;
    }

    const saveToBank = !itemId && $('programItemSaveToBank')?.checked;
    if (saveToBank) {
      const ramos = getRamos();
      if (ramos.length) {
        await rt.client.from('biblioteca_atividades').insert({
          nome: payload.nome,
          ramo: ramos[0],
          ramos,
          objetivo: payload.objetivo,
          areas_desenvolvimento: payload.areas_desenvolvimento,
          eixo: payload.eixo,
          bloco: payload.bloco,
          itens_progressao: payload.itens_progressao,
          materiais: payload.materiais,
          duracao_min: payload.duracao_min,
          preparacao: payload.preparacao,
          desenvolvimento: payload.desenvolvimento,
          regras: payload.regras,
          seguranca: payload.seguranca,
          plano_b: payload.plano_b,
          criado_por_chefe_id: rt.state.profile?.chefe_id || null
        });
      }
    }

    try { $('programItemDialog')?.close(); } catch (_) {}
    await returnToCurrentProgram();
    savingYouth = false;
    return true;
  }

  async function returnToCurrentProgram() {
    const id = currentProgramId;
    $('programEditorBackButton')?.click();
    for (let i = 0; i < 25; i += 1) {
      await sleep(120);
      const card = document.querySelector(`[data-program-id="${id}"]`);
      if (!card) continue;
      card.click();
      for (let j = 0; j < 20; j += 1) {
        await sleep(100);
        const edit = $('editProgramFromPreviewButton');
        if (edit && !edit.classList.contains('hidden')) {
          edit.click();
          return;
        }
      }
      return;
    }
  }

  function decorateYouthNames() {
    document.querySelectorAll('#programTimeline .program-timeline-item').forEach(async (card) => {
      const itemId = Number(card.querySelector('[data-edit-program-item]')?.dataset?.editProgramItem || 0);
      if (!itemId) return;
      const { data } = await rt.client.from('programacao_itens').select('condutor_jovem_id').eq('id', itemId).maybeSingle();
      if (!data?.condutor_jovem_id) return;
      let youth = cachedYouth.find((j) => Number(j.id) === Number(data.condutor_jovem_id));
      if (!youth) {
        const { data: j } = await rt.client.from('jovens').select('id,nome_completo').eq('id', data.condutor_jovem_id).maybeSingle();
        youth = j || null;
      }
      if (!youth) return;
      let p = card.querySelector('.program-conductor');
      if (!p) {
        p = document.createElement('p');
        p.className = 'program-conductor';
        card.querySelector('.program-item-heading')?.insertAdjacentElement('afterend', p);
      }
      if (p) p.innerHTML = `Responsável: <strong>${String(youth.nome_completo || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</strong> <small>(Pioneiro)</small>`;
      card.classList.remove('program-incomplete-v58');
    });
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt) return;
    pilot = await resolvePilot();
    if (!pilot) return;

    document.addEventListener('submit', (event) => {
      if (event.target?.id === 'programItemForm') void saveYouthResponsible(event);
    }, true);

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('#programAddManualButton,[data-edit-program-item]')) {
        setTimeout(() => { void enhanceConductorSelect(); }, 120);
      }
      if (event.target.closest('#programmingButton,[data-program-id],#editProgramFromPreviewButton')) {
        setTimeout(decorateYouthNames, 500);
      }
    }, true);

    const dialog = $('programItemDialog');
    if (dialog) {
      new MutationObserver(() => {
        if (dialog.open) setTimeout(() => { void enhanceConductorSelect(); }, 60);
      }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
    }
    const timeline = $('programTimeline');
    if (timeline) new MutationObserver(() => setTimeout(decorateYouthNames, 80)).observe(timeline, { childList: true, subtree: true });
  }

  void boot();
})();