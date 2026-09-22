(() => {
  if (window.__GEARPC_PROGRAM_RESPONSIBLE_FLEX_V82__) return;
  window.__GEARPC_PROGRAM_RESPONSIBLE_FLEX_V82__ = true;

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let rt = null;
  let pioneers = [];
  let pioneerRamoId = null;
  let refreshing = false;

  const esc = (value) => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  const splitLines = (value) => String(value || '').split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
  const getAreas = () => [...($('programItemAreas')?.querySelectorAll('input[type="checkbox"]:checked') || [])].map((i) => i.value);
  const getRamos = () => [...($('programItemRamos')?.querySelectorAll('input[value]:checked') || [])].map((i) => i.value);

  async function waitRuntime() {
    for (let i = 0; i < 120; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.profile && x?.state?.user?.id) return x;
      await sleep(250);
    }
    return null;
  }

  async function isPilot() {
    if (rt.state.profile?.tipo === 'administrador') return true;
    const { data, error } = await rt.client.from('perfis_usuarios')
      .select('eh_teste').eq('user_id', rt.state.user.id).maybeSingle();
    return !error && data?.eh_teste === true;
  }

  async function loadPioneers() {
    const { data:ramos, error:rErr } = await rt.client.from('ramos').select('id,nome,ativo').eq('ativo', true);
    if (rErr) return;
    const ramo = (ramos || []).find((r) => /pioneir/i.test(r.nome || ''));
    pioneerRamoId = Number(ramo?.id || 0) || null;
    if (!pioneerRamoId) { pioneers = []; return; }
    const { data, error } = await rt.client.from('jovens')
      .select('id,nome_completo,ramo_id,secao_id,ativo')
      .eq('ramo_id', pioneerRamoId).eq('ativo', true).order('nome_completo');
    pioneers = error ? [] : (data || []);
  }

  function installStyles() {
    if ($('programResponsibleFlexStylesV82')) return;
    const style = document.createElement('style');
    style.id = 'programResponsibleFlexStylesV82';
    style.textContent = `
      .program-responsible-extra-v82{display:grid;gap:5px;margin-top:7px}
      .program-responsible-extra-v82.hidden{display:none}
      .program-responsible-extra-v82 input{width:100%;box-sizing:border-box;border:1px solid #bfcbd6;border-radius:9px;padding:9px 10px;background:#fff;font:inherit}
      .program-responsible-hint-v82{display:block;margin-top:5px;color:#66798b;font-size:.74rem;line-height:1.35}
    `;
    document.head.appendChild(style);
  }

  function ensureExternalInput() {
    const select = $('programItemConductor');
    if (!select) return null;
    let wrap = $('programResponsibleExternalWrapV82');
    if (!wrap) {
      wrap = document.createElement('span');
      wrap.id = 'programResponsibleExternalWrapV82';
      wrap.className = 'program-responsible-extra-v82 hidden';
      wrap.innerHTML = `
        <input id="programResponsibleExternalNameV82" type="text" maxlength="180" placeholder="Nome da pessoa que irá conduzir" />
        <small class="program-responsible-hint-v82">Use para instrutor convidado, profissional, colaborador ou outra pessoa que não esteja cadastrada no grupo.</small>
      `;
      select.insertAdjacentElement('afterend', wrap);
    }
    return wrap;
  }

  function toggleExternal() {
    const external = $('programItemConductor')?.value === 'externo';
    $('programResponsibleExternalWrapV82')?.classList.toggle('hidden', !external);
    if (!external && $('programResponsibleExternalNameV82')) $('programResponsibleExternalNameV82').value = '';
  }

  async function enhanceDialog() {
    const select = $('programItemConductor');
    const dialog = $('programItemDialog');
    if (!select || !dialog?.open || $('programItemType')?.value !== 'atividade') return;

    await loadPioneers();

    select.querySelectorAll('[data-flex-v82="1"]').forEach((el) => el.remove());

    if (pioneers.length) {
      const group = document.createElement('optgroup');
      group.label = 'Pioneiros';
      group.dataset.flexV82 = '1';
      pioneers.forEach((j) => {
        const option = document.createElement('option');
        option.value = `jovem:${j.id}`;
        option.textContent = `${j.nome_completo} — Pioneiro`;
        group.appendChild(option);
      });
      select.appendChild(group);
    }

    const otherGroup = document.createElement('optgroup');
    otherGroup.label = 'Outras pessoas';
    otherGroup.dataset.flexV82 = '1';
    const option = document.createElement('option');
    option.value = 'externo';
    option.textContent = 'Outra pessoa — digitar nome';
    otherGroup.appendChild(option);
    select.appendChild(otherGroup);

    ensureExternalInput();

    const itemId = Number($('programItemId')?.value || 0);
    if (itemId) {
      const { data } = await rt.client.from('programacao_itens')
        .select('condutor_chefe_id,condutor_jovem_id,condutor_externo_nome')
        .eq('id', itemId).maybeSingle();
      if (data?.condutor_jovem_id) {
        select.value = `jovem:${data.condutor_jovem_id}`;
      } else if (data?.condutor_externo_nome) {
        select.value = 'externo';
        $('programResponsibleExternalNameV82').value = data.condutor_externo_nome;
      } else if (data?.condutor_chefe_id) {
        select.value = String(data.condutor_chefe_id);
      }
    }

    toggleExternal();
  }

  async function currentProgramId() {
    const sectionId = Number($('programEditorSection')?.value || 0);
    const date = $('programEditorDate')?.value || '';
    if (!sectionId || !date) return null;
    const { data } = await rt.client.from('programacoes')
      .select('id').eq('secao_id', sectionId).eq('data_atividade', date).maybeSingle();
    return Number(data?.id || 0) || null;
  }

  function setMessage(text, ok = false) {
    const el = $('programItemMessage');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('success-message', Boolean(ok));
  }

  async function saveActivity(event) {
    if (event.target?.id !== 'programItemForm' || $('programItemType')?.value !== 'atividade') return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const raw = String($('programItemConductor')?.value || '');
    const externalName = $('programResponsibleExternalNameV82')?.value.trim() || '';
    if (raw === 'externo' && externalName.length < 2) {
      setMessage('Digite o nome da pessoa que irá conduzir a atividade.');
      $('programResponsibleExternalNameV82')?.focus();
      return;
    }

    const programId = await currentProgramId();
    if (!programId) { setMessage('Não foi possível identificar a programação atual.'); return; }

    const payload = {
      hora_inicio: $('programItemStart')?.value || '',
      duracao_min: Number($('programItemDuration')?.value || 15),
      nome: $('programItemName')?.value.trim() || '',
      condutor_chefe_id: /^\d+$/.test(raw) ? Number(raw) : null,
      condutor_jovem_id: raw.startsWith('jovem:') ? Number(raw.split(':')[1] || 0) || null : null,
      condutor_externo_nome: raw === 'externo' ? externalName : null,
      objetivo: $('programItemObjective')?.value.trim() || null,
      areas_desenvolvimento: getAreas(),
      eixo: $('programItemAxis')?.value.trim() || null,
      bloco: $('programItemBlock')?.value.trim() || null,
      itens_progressao: splitLines($('programItemProgressItems')?.value),
      materiais: $('programItemMaterials')?.value.trim() || null,
      preparacao: $('programItemPreparation')?.value.trim() || null,
      desenvolvimento: $('programItemDevelopment')?.value.trim() || null,
      regras: $('programItemRules')?.value.trim() || null,
      seguranca: $('programItemSafety')?.value.trim() || null,
      plano_b: $('programItemPlanB')?.value.trim() || null,
      tipo: 'atividade',
      origem: $('programItemOrigin')?.value || 'manual',
      atualizado_em: new Date().toISOString()
    };

    if (!payload.hora_inicio || !payload.nome) {
      setMessage('Informe o horário e o nome da atividade.');
      return;
    }

    const itemId = Number($('programItemId')?.value || 0);
    const saveToBank = !itemId && Boolean($('programItemSaveToBank')?.checked);
    const selectedRamos = saveToBank ? getRamos() : [];
    if (saveToBank && !selectedRamos.length) {
      setMessage('Marque pelo menos um ramo para salvar no Banco de Ideias.');
      return;
    }

    const saveButton = $('saveProgramItemButton');
    if (saveButton) saveButton.disabled = true;

    try {
      let result;
      if (itemId) {
        result = await rt.client.from('programacao_itens').update(payload).eq('id', itemId);
      } else {
        result = await rt.client.from('programacao_itens').insert({
          ...payload, programacao_id: programId, ordem:40, criado_por:rt.state.user.id
        });
      }
      if (result.error) throw result.error;

      if (saveToBank) {
        const { error:libraryError } = await rt.client.from('biblioteca_atividades').insert({
          nome:payload.nome, ramo:selectedRamos[0], ramos:selectedRamos,
          objetivo:payload.objetivo, areas_desenvolvimento:payload.areas_desenvolvimento || [],
          eixo:payload.eixo, bloco:payload.bloco, itens_progressao:payload.itens_progressao || [],
          materiais:payload.materiais, duracao_min:payload.duracao_min,
          preparacao:payload.preparacao, desenvolvimento:payload.desenvolvimento,
          regras:payload.regras, seguranca:payload.seguranca, plano_b:payload.plano_b,
          tags:[], visibilidade:'grupo', origem:'chefia', criado_por:rt.state.user.id,
          criado_por_chefe_id:rt.state.profile?.chefe_id || null, ativo:true,
          atualizado_em:new Date().toISOString()
        });
        if (libraryError) console.warn('Atividade salva na programação, mas não no banco:', libraryError);
      }

      $('programItemDialog')?.close();
      await refreshProgram(programId);
    } catch (error) {
      console.error(error);
      setMessage('Não foi possível salvar esta atividade.');
    } finally {
      if (saveButton) saveButton.disabled = false;
    }
  }

  async function refreshProgram(programId) {
    if (refreshing) return;
    refreshing = true;
    try {
      $('programEditorBackButton')?.click();
      for (let i = 0; i < 25; i += 1) {
        await sleep(120);
        const card = document.querySelector(`[data-program-id="${programId}"]`);
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
    } finally {
      refreshing = false;
    }
  }

  function responsibleLabel(item) {
    if (item.condutor_externo_nome) return { name:item.condutor_externo_nome, suffix:'Convidado/externo' };
    if (item.condutor_jovem_id) {
      const youth = pioneers.find((j) => Number(j.id) === Number(item.condutor_jovem_id));
      return youth ? { name:youth.nome_completo, suffix:'Pioneiro' } : null;
    }
    return null;
  }

  async function decorateTimeline() {
    const buttons = [...document.querySelectorAll('#programTimeline [data-edit-program-item]')];
    const ids = buttons.map((b) => Number(b.dataset.editProgramItem || 0)).filter(Boolean);
    if (!ids.length) return;
    await loadPioneers();
    const { data, error } = await rt.client.from('programacao_itens')
      .select('id,condutor_chefe_id,condutor_jovem_id,condutor_externo_nome').in('id', ids);
    if (error) return;
    const map = new Map((data || []).map((x) => [Number(x.id), x]));
    buttons.forEach((button) => {
      const item = map.get(Number(button.dataset.editProgramItem || 0));
      const label = item ? responsibleLabel(item) : null;
      if (!label) return;
      const card = button.closest('.program-timeline-item');
      if (!card) return;
      let p = card.querySelector('.program-conductor');
      if (!p) {
        p = document.createElement('p');
        p.className = 'program-conductor';
        card.querySelector('.program-item-heading')?.insertAdjacentElement('afterend', p);
      }
      p.innerHTML = `Condução: <strong>${esc(label.name)}</strong> <small>(${esc(label.suffix)})</small>`;
    });
  }

  async function decoratePreview() {
    const dialog = $('programPreviewDialog');
    if (!dialog?.open) return;
    const programId = Number($('editProgramFromPreviewButton')?.dataset?.programId || 0);
    if (!programId) return;
    await loadPioneers();
    const { data, error } = await rt.client.from('programacao_itens')
      .select('id,ordem,hora_inicio,condutor_chefe_id,condutor_jovem_id,condutor_externo_nome')
      .eq('programacao_id', programId).order('hora_inicio',{ascending:true}).order('ordem',{ascending:true});
    if (error) return;
    const cards = [...dialog.querySelectorAll('.program-preview-item')];
    (data || []).forEach((item, index) => {
      const label = responsibleLabel(item);
      if (!label || !cards[index]) return;
      let p = cards[index].querySelector('.program-conductor');
      if (!p) {
        p = document.createElement('p');
        p.className = 'program-conductor';
        cards[index].querySelector('.program-preview-main h3')?.insertAdjacentElement('afterend', p);
      }
      p.innerHTML = `Responsável: <strong>${esc(label.name)}</strong> <small>(${esc(label.suffix)})</small>`;
    });
  }

  function bind() {
    $('programItemConductor')?.addEventListener('change', toggleExternal);

    document.addEventListener('submit', (event) => {
      if (event.target?.id === 'programItemForm') void saveActivity(event);
    }, true);

    const dialog = $('programItemDialog');
    if (dialog) new MutationObserver(() => {
      if (dialog.open) setTimeout(() => { void enhanceDialog(); }, 80);
    }).observe(dialog, { attributes:true, attributeFilter:['open'] });

    const timeline = $('programTimeline');
    if (timeline) new MutationObserver(() => setTimeout(() => { void decorateTimeline(); }, 100))
      .observe(timeline, { childList:true, subtree:true });

    const preview = $('programPreviewDialog');
    if (preview) new MutationObserver(() => {
      if (preview.open) setTimeout(() => { void decoratePreview(); }, 120);
    }).observe(preview, { attributes:true, childList:true, subtree:true });

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('#programAddManualButton,[data-edit-program-item]')) setTimeout(() => { void enhanceDialog(); }, 100);
      if (event.target.closest('[data-program-id],#editProgramFromPreviewButton,#programmingButton')) {
        setTimeout(() => { void decorateTimeline(); void decoratePreview(); }, 350);
      }
    }, true);
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt || !(await isPilot())) return;
    installStyles();
    await loadPioneers();
    ensureExternalInput();
    bind();
  }

  void boot();
})();