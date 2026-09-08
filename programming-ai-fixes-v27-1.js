(() => {
  if (window.__GEARPC_AI_FIXES_V27_1__) return;
  window.__GEARPC_AI_FIXES_V27_1__ = true;

  const runtime = window.GEARPC_RUNTIME;
  if (!runtime?.client || !runtime?.state) return;
  const { client, state } = runtime;
  const $ = (id) => document.getElementById(id);
  const AREAS = ['Físico', 'Afetivo', 'Caráter', 'Espiritual', 'Intelectual', 'Social'];
  let generatedActivity = null;
  let generatedContext = null;
  const ramoCache = new Map();

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const fmtTime = (value) => value ? String(value).slice(0, 5) : '';
  const toMinutes = (value) => {
    if (!value || !/^\d{2}:\d{2}/.test(String(value))) return null;
    const [h, m] = String(value).slice(0, 5).split(':').map(Number);
    return h * 60 + m;
  };
  const fromMinutes = (total) => {
    const n = ((Math.round(total) % 1440) + 1440) % 1440;
    return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  };
  const unique = (values) => [...new Set((values || []).filter(Boolean))];

  function setStatus(id, text, ok = false) {
    const el = $(id);
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('success-message', Boolean(ok));
  }

  function installStyles() {
    if ($('gearpcAiFixStylesV271')) return;
    const style = document.createElement('style');
    style.id = 'gearpcAiFixStylesV271';
    style.textContent = `
      .ai-action-button{border:1px solid #cabee7;background:#f3effb;color:#4d347f;border-radius:16px;padding:16px 18px;font:inherit;font-weight:800;cursor:pointer;min-height:54px}
      .ai-action-button:hover{background:#e9e3f8}.ai-action-button:disabled{opacity:.55;cursor:wait}
      .ai-helper{margin:0 0 14px;color:#5c6a78;line-height:1.45}.ai-privacy-note{margin:12px 0;padding:12px 14px;border-radius:14px;background:#f5f7fa;color:#4f5f70;font-size:.92rem;line-height:1.45}
      .ai-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ai-grid label,.ai-stack label{display:flex;flex-direction:column;gap:6px;font-weight:700;color:#425466}.ai-stack{display:grid;gap:12px;margin-top:12px}
      .ai-grid input,.ai-grid select,.ai-stack textarea,.ai-save-row select{width:100%;box-sizing:border-box;border:1px solid #c9d2dc;border-radius:10px;padding:11px 12px;background:#fff;color:#12263f;font:inherit}
      .ai-result-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.ai-result-field{padding:12px;border-radius:12px;background:#f6f8fb;border:1px solid #e1e6ec}.ai-result-field.wide{grid-column:1/-1}.ai-result-field span{display:block;color:#68798a;font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}.ai-result-field strong{display:block;color:#173a63;white-space:pre-wrap;line-height:1.45}
      .ai-save-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.ai-save-row select{width:auto;min-width:190px}.ai-result-actions{display:flex;gap:10px;justify-content:flex-end;align-items:center;flex-wrap:wrap;margin-top:16px}
      @media(max-width:720px){.ai-grid,.ai-result-grid{grid-template-columns:1fr}.ai-action-button{width:100%}.ai-result-actions>*{width:100%}.ai-save-row{width:100%}.ai-save-row select{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function installUi() {
    installStyles();
    const searchButton = $('programSearchIdeasButton');
    if (searchButton && !$('programGenerateAiButton')) {
      const button = document.createElement('button');
      button.id = 'programGenerateAiButton';
      button.type = 'button';
      button.className = 'ai-action-button';
      button.textContent = '✨ Gerar com IA';
      searchButton.insertAdjacentElement('afterend', button);
    }

    if (!$('aiActivityDialog')) {
      document.body.insertAdjacentHTML('beforeend', `
        <dialog id="aiActivityDialog" class="member-dialog program-activity-dialog">
          <form id="aiActivityForm" method="dialog" class="member-form">
            <div class="dialog-title-row sticky-dialog-header">
              <div><div class="eyebrow dark">GERAÇÃO DE ATIVIDADE</div><h2>✨ Criar com IA</h2><p id="aiActivityRamoLabel" class="dialog-helper"></p></div>
              <button id="closeAiActivityDialog" type="button" class="dialog-close" aria-label="Fechar">×</button>
            </div>
            <p class="ai-helper">Informe o que precisa. A IA monta uma ficha completa e vincula a atividade ao Programa Educativo usando as referências disponíveis para o ramo.</p>
            <div class="ai-grid">
              <label>Eixo<select id="aiActivityAxis"><option value="">A IA pode escolher</option></select></label>
              <label>Bloco de Aprendizagem<select id="aiActivityBlock"><option value="">A IA pode escolher</option></select></label>
              <label>Área de desenvolvimento<select id="aiActivityArea"><option value="">A IA pode escolher</option></select></label>
              <label>Duração desejada (min)<input id="aiActivityDuration" type="number" min="5" max="240" value="30" required></label>
              <label>Participantes<input id="aiActivityParticipants" type="text" maxlength="180" placeholder="Ex.: 24 jovens / 4 patrulhas"></label>
              <label>Local / ambiente<input id="aiActivityLocation" type="text" maxlength="220" placeholder="Ex.: sede, pátio, campo, sala"></label>
            </div>
            <div class="ai-stack">
              <label>Materiais disponíveis<textarea id="aiActivityMaterials" rows="3" placeholder="Ex.: cordas, bambus, bolas; ou escreva sem material"></textarea></label>
              <label>O que você deseja / tema da atividade<textarea id="aiActivityRequest" rows="4" maxlength="1600" placeholder="Ex.: jogo movimentado de cooperação, com competição entre patrulhas"></textarea></label>
            </div>
            <p class="ai-privacy-note">A ficha indica conteúdos trabalhados, mas não conclui automaticamente a progressão individual de nenhum jovem.</p>
            <p id="aiActivityMessage" class="form-message" role="status"></p>
            <div class="dialog-actions sticky-dialog-actions">
              <button id="cancelAiActivityButton" type="button" class="cancel-button">Cancelar</button>
              <button id="generateAiActivityButton" type="submit" class="ai-action-button">✨ Gerar ficha</button>
            </div>
          </form>
        </dialog>
        <dialog id="aiResultDialog" class="member-dialog program-activity-dialog">
          <div class="detail-shell">
            <div class="dialog-title-row sticky-dialog-header">
              <div><div class="eyebrow dark">FICHA GERADA POR IA</div><h2 id="aiResultTitle">Atividade</h2></div>
              <button id="closeAiResultDialog" type="button" class="dialog-close" aria-label="Fechar">×</button>
            </div>
            <div id="aiResultBody"></div>
            <p id="aiResultMessage" class="form-message" role="status"></p>
            <div class="ai-result-actions sticky-dialog-actions">
              <div class="ai-save-row">
                <select id="aiSaveVisibility" aria-label="Visibilidade ao salvar"><option value="grupo">Compartilhar com o grupo</option><option value="privado">Somente para mim</option></select>
                <button id="aiSaveCloudButton" type="button" class="secondary-action-button">☁️ Salvar na nuvem</button>
              </div>
              <button id="aiUseProgramButton" type="button" class="save-button">Usar nesta programação</button>
            </div>
          </div>
        </dialog>
      `);
    }
  }

  async function resolveCurrentProgram() {
    const sectionId = Number($('programEditorSection')?.value || 0);
    const date = $('programEditorDate')?.value || '';
    const start = $('programEditorStart')?.value || '';
    const end = $('programEditorEnd')?.value || '';
    if (!sectionId || !date) throw new Error('Programação atual não identificada.');

    const { data, error } = await client.from('programacoes')
      .select('id,secao_id,data_atividade,horario_inicio,horario_termino')
      .eq('secao_id', sectionId)
      .eq('data_atividade', date)
      .order('id', { ascending: false });
    if (error) throw error;
    const rows = data || [];
    const exact = rows.find((p) => fmtTime(p.horario_inicio) === start && fmtTime(p.horario_termino) === end);
    const program = exact || rows[0];
    if (!program) throw new Error('Programação atual não encontrada.');
    return program;
  }

  async function getRamoForSection(sectionId) {
    if (ramoCache.has(sectionId)) return ramoCache.get(sectionId);
    const { data: sec, error: secError } = await client.from('secoes').select('ramo_id').eq('id', Number(sectionId)).single();
    if (secError || !sec?.ramo_id) throw secError || new Error('Ramo não encontrado.');
    const { data: ramo, error: ramoError } = await client.from('ramos').select('nome').eq('id', Number(sec.ramo_id)).single();
    if (ramoError || !ramo?.nome) throw ramoError || new Error('Ramo não encontrado.');
    ramoCache.set(sectionId, ramo.nome);
    return ramo.nome;
  }

  function ideasFor(ramo, eixo = '', bloco = '') {
    let ideas = (window.GEARPC_IDEAS || []).filter((idea) => idea.ramo === ramo);
    if (eixo) ideas = ideas.filter((idea) => idea.eixo === eixo);
    if (bloco) ideas = ideas.filter((idea) => idea.bloco === bloco);
    return ideas;
  }

  function rebuildBlocks() {
    const ramo = $('aiActivityRamoLabel')?.dataset.ramo || '';
    const eixo = $('aiActivityAxis')?.value || '';
    const blocks = unique(ideasFor(ramo, eixo).map((i) => i.bloco)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const select = $('aiActivityBlock');
    if (!select) return;
    const old = select.value;
    select.innerHTML = `<option value="">A IA pode escolher</option>${blocks.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}`;
    if (blocks.includes(old)) select.value = old;
  }

  async function openAiDialog() {
    try {
      const program = await resolveCurrentProgram();
      const ramo = await getRamoForSection(program.secao_id);
      const label = $('aiActivityRamoLabel');
      label.textContent = `Ramo: ${ramo}`;
      label.dataset.ramo = ramo;
      const axes = unique(ideasFor(ramo).map((i) => i.eixo)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
      $('aiActivityAxis').innerHTML = `<option value="">A IA pode escolher</option>${axes.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}`;
      $('aiActivityArea').innerHTML = `<option value="">A IA pode escolher</option>${AREAS.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}`;
      $('aiActivityDuration').value = '30';
      $('aiActivityParticipants').value = '';
      $('aiActivityLocation').value = '';
      $('aiActivityMaterials').value = '';
      $('aiActivityRequest').value = '';
      setStatus('aiActivityMessage', '');
      rebuildBlocks();
      $('aiActivityDialog').showModal();
    } catch (error) {
      console.error(error);
      setStatus('programEditorMessage', 'Não foi possível abrir a geração por IA.');
    }
  }

  function referenceIdeas(ramo, eixo, bloco) {
    let refs = ideasFor(ramo, eixo, bloco);
    if (!refs.length) refs = ideasFor(ramo, eixo);
    if (!refs.length) refs = ideasFor(ramo);
    return refs.slice(0, 10).map((i) => ({ eixo: i.eixo, bloco: i.bloco, item: i.item, objetivo: i.objetivo, areas: i.areas || [] }));
  }

  function renderGenerated(activity) {
    const fields = [];
    const add = (label, value, wide = false) => {
      if (value == null || value === '' || (Array.isArray(value) && !value.length)) return;
      const display = Array.isArray(value) ? value.join(' • ') : value;
      fields.push(`<div class="ai-result-field ${wide ? 'wide' : ''}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(display)}</strong></div>`);
    };
    add('Ramo', activity.ramo);
    add('Tempo previsto', `${activity.duracao_min || 30} min`);
    add('Participantes', activity.participantes);
    add('Local sugerido', activity.local_sugerido);
    add('Área(s) de desenvolvimento', activity.areas_desenvolvimento);
    add('Eixo', activity.eixo);
    add('Bloco', activity.bloco);
    add('Objetivo', activity.objetivo, true);
    add('Item ou itens relacionados', activity.itens_progressao, true);
    add('Material a ser usado', activity.materiais, true);
    add('Preparação prévia', activity.preparacao, true);
    add('Desenvolvimento / passo a passo', activity.desenvolvimento, true);
    add('Regras', activity.regras, true);
    add('Segurança / cuidados', activity.seguranca, true);
    add('Plano B / adaptações', activity.plano_b, true);
    $('aiResultTitle').textContent = activity.nome || 'Atividade gerada por IA';
    $('aiResultBody').innerHTML = `<div class="ai-result-grid">${fields.join('')}</div>`;
    $('aiSaveVisibility').value = 'grupo';
    setStatus('aiResultMessage', '');
  }

  async function generateActivity(event) {
    event.preventDefault();
    const submit = $('generateAiActivityButton');
    try {
      submit.disabled = true;
      setStatus('aiActivityMessage', 'Criando uma ficha de atividade...');
      const program = await resolveCurrentProgram();
      const ramo = await getRamoForSection(program.secao_id);
      const eixo = $('aiActivityAxis').value || '';
      const bloco = $('aiActivityBlock').value || '';
      const body = {
        ramo,
        eixo,
        bloco,
        area: $('aiActivityArea').value || '',
        duracao: Number($('aiActivityDuration').value || 30),
        participantes: $('aiActivityParticipants').value.trim(),
        local: $('aiActivityLocation').value.trim(),
        materiais: $('aiActivityMaterials').value.trim(),
        pedido: $('aiActivityRequest').value.trim(),
        referencias: referenceIdeas(ramo, eixo, bloco)
      };
      const { data, error } = await client.functions.invoke('gerar-atividade-ia', { body });
      if (error) {
        let detail = '';
        try {
          if (error.context?.json) detail = (await error.context.json())?.error || '';
        } catch (_) {}
        throw new Error(detail || 'Não foi possível gerar a atividade agora.');
      }
      if (!data?.activity) throw new Error('A IA não retornou uma ficha válida.');
      generatedActivity = data.activity;
      generatedActivity.ramo = ramo;
      generatedContext = { program };
      $('aiActivityDialog').close();
      renderGenerated(generatedActivity);
      $('aiResultDialog').showModal();
    } catch (error) {
      console.error(error);
      setStatus('aiActivityMessage', error?.message || 'Não foi possível gerar a atividade agora.');
    } finally {
      submit.disabled = false;
    }
  }

  async function nextAvailableStart(program, duration) {
    const { data, error } = await client.from('programacao_itens')
      .select('hora_inicio,duracao_min')
      .eq('programacao_id', Number(program.id));
    if (error) throw error;
    const start = toMinutes(program.horario_inicio);
    const end = toMinutes(program.horario_termino);
    const occupied = (data || []).map((i) => [toMinutes(i.hora_inicio), toMinutes(i.hora_inicio) + Number(i.duracao_min || 0)])
      .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b)).sort((a, b) => a[0] - b[0]);
    for (let t = start; t + duration <= end; t += 5) {
      if (!occupied.some(([a, b]) => t < b && a < t + duration)) return fromMinutes(t);
    }
    return fromMinutes(Math.max(start, end - duration));
  }

  async function refreshCurrentProgram(programId) {
    const back = $('programEditorBackButton');
    if (!back) return;
    back.click();
    for (let i = 0; i < 20; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      const card = document.querySelector(`[data-program-id="${programId}"]`);
      if (card) { card.click(); return; }
    }
  }

  async function useGeneratedInProgram() {
    if (!generatedActivity) return;
    const button = $('aiUseProgramButton');
    try {
      button.disabled = true;
      setStatus('aiResultMessage', 'Adicionando à programação...');
      const program = generatedContext?.program || await resolveCurrentProgram();
      const duration = Math.max(5, Math.min(240, Number(generatedActivity.duracao_min || 30)));
      const start = await nextAvailableStart(program, duration);
      const payload = {
        programacao_id: Number(program.id), ordem: 40, tipo: 'atividade', hora_inicio: start, duracao_min: duration,
        nome: generatedActivity.nome || 'Atividade gerada por IA', condutor_chefe_id: null,
        objetivo: generatedActivity.objetivo || null, areas_desenvolvimento: generatedActivity.areas_desenvolvimento || [],
        eixo: generatedActivity.eixo || null, bloco: generatedActivity.bloco || null, itens_progressao: generatedActivity.itens_progressao || [],
        materiais: generatedActivity.materiais || null, preparacao: generatedActivity.preparacao || null,
        desenvolvimento: generatedActivity.desenvolvimento || null, regras: generatedActivity.regras || null,
        seguranca: generatedActivity.seguranca || null, plano_b: generatedActivity.plano_b || null,
        origem: 'ia', criado_por: state.user?.id
      };
      const { error } = await client.from('programacao_itens').insert(payload);
      if (error) throw error;
      $('aiResultDialog').close();
      await refreshCurrentProgram(program.id);
    } catch (error) {
      console.error(error);
      setStatus('aiResultMessage', 'Não foi possível adicionar esta atividade à programação.');
    } finally {
      button.disabled = false;
    }
  }

  async function saveGeneratedToCloud() {
    if (!generatedActivity) return;
    const button = $('aiSaveCloudButton');
    try {
      button.disabled = true;
      setStatus('aiResultMessage', 'Salvando no banco de atividades...');
      const payload = {
        nome: generatedActivity.nome || 'Atividade gerada por IA', ramo: generatedActivity.ramo || null,
        objetivo: generatedActivity.objetivo || null, areas_desenvolvimento: generatedActivity.areas_desenvolvimento || [],
        eixo: generatedActivity.eixo || null, bloco: generatedActivity.bloco || null, itens_progressao: generatedActivity.itens_progressao || [],
        materiais: generatedActivity.materiais || null, duracao_min: Number(generatedActivity.duracao_min || 30),
        participantes: generatedActivity.participantes || null, local_sugerido: generatedActivity.local_sugerido || null,
        preparacao: generatedActivity.preparacao || null, desenvolvimento: generatedActivity.desenvolvimento || null,
        regras: generatedActivity.regras || null, seguranca: generatedActivity.seguranca || null, plano_b: generatedActivity.plano_b || null,
        tags: generatedActivity.tags || [], visibilidade: $('aiSaveVisibility').value || 'grupo', origem: 'ia',
        criado_por: state.user?.id, criado_por_chefe_id: state.profile?.chefe_id || null, ativo: true,
        atualizado_em: new Date().toISOString()
      };
      const { error } = await client.from('biblioteca_atividades').insert(payload);
      if (error) throw error;
      setStatus('aiResultMessage', payload.visibilidade === 'grupo' ? 'Atividade salva e compartilhada com o grupo.' : 'Atividade salva somente para você.', true);
    } catch (error) {
      console.error(error);
      setStatus('aiResultMessage', 'Não foi possível salvar esta atividade na nuvem.');
    } finally {
      button.disabled = false;
    }
  }

  async function deleteProgrammingSecure() {
    const button = $('programDeleteButton');
    try {
      const program = await resolveCurrentProgram();
      const sectionName = $('programEditorSection')?.selectedOptions?.[0]?.textContent || 'esta seção';
      const date = $('programEditorDate')?.value ? $('programEditorDate').value.split('-').reverse().join('/') : '';
      if (!window.confirm(`Apagar toda a programação de ${sectionName}${date ? ` em ${date}` : ''}?\n\nTodos os itens desta programação também serão apagados.`)) return;
      button.disabled = true;
      setStatus('programEditorMessage', 'Apagando programação...');
      const { data, error } = await client.rpc('excluir_programacao', { p_programacao_id: Number(program.id) });
      if (error || data !== true) throw error || new Error('A programação não foi apagada.');
      const back = $('programEditorBackButton');
      back?.click();
      setTimeout(() => setStatus('programmingMessage', 'Programação apagada.', true), 400);
    } catch (error) {
      console.error(error);
      setStatus('programEditorMessage', 'Não foi possível apagar a programação. Tente novamente.');
    } finally {
      if (button) button.disabled = false;
    }
  }

  installUi();

  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    if (!button) return;
    if (button.id === 'programDeleteButton') {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      void deleteProgrammingSecure();
    }
  }, true);

  $('programGenerateAiButton')?.addEventListener('click', openAiDialog);
  $('aiActivityForm')?.addEventListener('submit', generateActivity);
  $('closeAiActivityDialog')?.addEventListener('click', () => $('aiActivityDialog')?.close());
  $('cancelAiActivityButton')?.addEventListener('click', () => $('aiActivityDialog')?.close());
  $('aiActivityAxis')?.addEventListener('change', rebuildBlocks);
  $('closeAiResultDialog')?.addEventListener('click', () => $('aiResultDialog')?.close());
  $('aiUseProgramButton')?.addEventListener('click', useGeneratedInProgram);
  $('aiSaveCloudButton')?.addEventListener('click', saveGeneratedToCloud);
})();
