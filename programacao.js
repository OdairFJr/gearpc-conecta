(() => {
  const runtime = window.GEARPC_RUNTIME;
  if (!runtime?.client || !runtime?.state) return;

  const { client, state: appState, showDashboard } = runtime;
  const $ = (id) => document.getElementById(id);
  const AREAS = ['Físico', 'Afetivo', 'Caráter', 'Espiritual', 'Intelectual', 'Social'];

  const ui = {
    button: $('programmingButton'),
    view: $('programmingView'),
    back: $('programmingBackButton'),
    logout: $('programmingLogoutButton'),
    newButton: $('newProgrammingButton'),
    refresh: $('programmingRefreshButton'),
    sectionFilter: $('programmingSectionFilter'),
    roleNote: $('programmingRoleNote'),
    list: $('programmingList'),
    message: $('programmingMessage'),

    editorView: $('programEditorView'),
    editorBack: $('programEditorBackButton'),
    editorLogout: $('programEditorLogoutButton'),
    editorTitle: $('programEditorTitle'),
    editorPermission: $('programEditorPermissionNote'),
    editorSection: $('programEditorSection'),
    editorDate: $('programEditorDate'),
    editorStart: $('programEditorStart'),
    editorEnd: $('programEditorEnd'),
    saveBasic: $('programSaveBasicButton'),
    deleteProgram: $('programDeleteButton'),
    actionBar: $('programActionBar'),
    addManual: $('programAddManualButton'),
    searchIdeas: $('programSearchIdeasButton'),
    newLibrary: $('programNewLibraryButton'),
    timeline: $('programTimeline'),
    timelineTotal: $('programTimelineTotal'),
    editorMessage: $('programEditorMessage'),
    finalNotes: $('programFinalNotes'),
    saveNotes: $('programSaveNotesButton'),

    newDialog: $('newProgrammingDialog'),
    newForm: $('newProgrammingForm'),
    newSection: $('newProgrammingSection'),
    newDate: $('newProgrammingDate'),
    newStart: $('newProgrammingStart'),
    newEnd: $('newProgrammingEnd'),
    newMessage: $('newProgrammingMessage'),
    closeNew: $('closeNewProgrammingDialog'),
    cancelNew: $('cancelNewProgrammingButton'),
    saveNew: $('saveNewProgrammingButton'),

    itemDialog: $('programItemDialog'),
    itemForm: $('programItemForm'),
    itemTitle: $('programItemDialogTitle'),
    itemId: $('programItemId'),
    itemType: $('programItemType'),
    itemOrigin: $('programItemOrigin'),
    itemFixedNotice: $('programItemFixedNotice'),
    itemStart: $('programItemStart'),
    itemDuration: $('programItemDuration'),
    itemConductor: $('programItemConductor'),
    itemName: $('programItemName'),
    itemObjective: $('programItemObjective'),
    itemAreas: $('programItemAreas'),
    itemAxis: $('programItemAxis'),
    itemBlock: $('programItemBlock'),
    itemProgressItems: $('programItemProgressItems'),
    itemMaterials: $('programItemMaterials'),
    itemPreparation: $('programItemPreparation'),
    itemDevelopment: $('programItemDevelopment'),
    itemRules: $('programItemRules'),
    itemSafety: $('programItemSafety'),
    itemPlanB: $('programItemPlanB'),
    itemMessage: $('programItemMessage'),
    closeItem: $('closeProgramItemDialog'),
    cancelItem: $('cancelProgramItemButton'),
    saveItem: $('saveProgramItemButton'),
    deleteItem: $('deleteProgramItemButton'),

    ideaDialog: $('ideaSearchDialog'),
    ideaClose: $('closeIdeaSearchDialog'),
    ideaRamoLabel: $('ideaSearchRamoLabel'),
    ideaText: $('ideaSearchText'),
    ideaAxis: $('ideaSearchAxis'),
    ideaBlock: $('ideaSearchBlock'),
    ideaArea: $('ideaSearchArea'),
    ideaCount: $('ideaSearchCount'),
    ideaResults: $('ideaSearchResults'),
    ideaMessage: $('ideaSearchMessage'),
    ideaNewLibrary: $('ideaSearchNewLibraryButton'),

    ideaDetailDialog: $('ideaDetailDialog'),
    ideaDetailTitle: $('ideaDetailTitle'),
    ideaDetailBody: $('ideaDetailBody'),
    ideaDetailClose: $('closeIdeaDetailDialog'),
    ideaUse: $('ideaUseButton'),

    libraryDialog: $('libraryActivityDialog'),
    libraryForm: $('libraryActivityForm'),
    libraryTitle: $('libraryActivityDialogTitle'),
    libraryId: $('libraryActivityId'),
    libraryName: $('libraryActivityName'),
    libraryRamo: $('libraryActivityRamo'),
    libraryDuration: $('libraryActivityDuration'),
    libraryParticipants: $('libraryActivityParticipants'),
    libraryLocation: $('libraryActivityLocation'),
    libraryVisibility: $('libraryActivityVisibility'),
    libraryObjective: $('libraryActivityObjective'),
    libraryAreas: $('libraryActivityAreas'),
    libraryAxis: $('libraryActivityAxis'),
    libraryBlock: $('libraryActivityBlock'),
    libraryProgressItems: $('libraryActivityProgressItems'),
    libraryMaterials: $('libraryActivityMaterials'),
    libraryPreparation: $('libraryActivityPreparation'),
    libraryDevelopment: $('libraryActivityDevelopment'),
    libraryRules: $('libraryActivityRules'),
    librarySafety: $('libraryActivitySafety'),
    libraryPlanB: $('libraryActivityPlanB'),
    libraryTags: $('libraryActivityTags'),
    libraryMessage: $('libraryActivityMessage'),
    closeLibrary: $('closeLibraryActivityDialog'),
    cancelLibrary: $('cancelLibraryActivityButton'),
    saveLibrary: $('saveLibraryActivityButton'),
    saveAndUseLibrary: $('saveAndUseLibraryActivityButton'),
    deleteLibrary: $('deleteLibraryActivityButton')
  };

  const moduleState = {
    ramos: [],
    secoes: [],
    chefes: [],
    chefeSecoes: [],
    programs: [],
    currentProgram: null,
    items: [],
    library: [],
    selectedIdea: null,
    ownSectionIds: [],
    referencesLoaded: false
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function normalize(value) {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function setMessage(el, text, ok = false) {
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('success-message', Boolean(ok));
  }

  function toMinutes(time) {
    if (!time || !/^\d{2}:\d{2}/.test(time)) return null;
    const [h, m] = time.slice(0, 5).split(':').map(Number);
    return h * 60 + m;
  }

  function fromMinutes(total) {
    if (!Number.isFinite(total)) return '';
    const day = 24 * 60;
    const n = ((Math.round(total) % day) + day) % day;
    return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  }

  function formatTime(time) {
    return time ? String(time).slice(0, 5) : '--:--';
  }

  function formatDate(date) {
    if (!date) return '';
    const [y, m, d] = String(date).split('-');
    return y && m && d ? `${d}/${m}/${y}` : String(date);
  }

  function splitLines(value) {
    return String(value || '').split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
  }

  function splitTags(value) {
    return String(value || '').split(/[;,]/).map((v) => v.trim()).filter(Boolean);
  }

  function unique(values) {
    return [...new Set((values || []).filter(Boolean))];
  }

  function closeDialog(dialog) {
    if (dialog?.open) dialog.close();
  }

  function showOnly(view) {
    ['loginView', 'dashboardView', 'membersView', 'chiefsView', 'attendanceView', 'accessView', 'programmingView', 'programEditorView']
      .forEach((id) => $(id)?.classList.add('hidden'));
    view?.classList.remove('hidden');
  }

  function isAdmin() {
    return appState.profile?.tipo === 'administrador';
  }

  function isDirigente() {
    return Boolean(appState.profile?.acesso_geral_consulta);
  }

  function canCreateLibrary() {
    return isAdmin() || (!isDirigente() && moduleState.ownSectionIds.length > 0);
  }

  function canManageSection(sectionId) {
    if (isAdmin()) return true;
    if (isDirigente()) return false;
    return moduleState.ownSectionIds.includes(Number(sectionId));
  }

  function canManageCurrent() {
    return Boolean(moduleState.currentProgram && canManageSection(moduleState.currentProgram.secao_id));
  }

  function visibleSections() {
    if (isAdmin() || isDirigente()) return moduleState.secoes.filter((s) => s.ativo !== false);
    const allowed = new Set(moduleState.ownSectionIds);
    return moduleState.secoes.filter((s) => s.ativo !== false && allowed.has(Number(s.id)));
  }

  function manageableSections() {
    if (isAdmin()) return moduleState.secoes.filter((s) => s.ativo !== false);
    if (isDirigente()) return [];
    const allowed = new Set(moduleState.ownSectionIds);
    return moduleState.secoes.filter((s) => s.ativo !== false && allowed.has(Number(s.id)));
  }

  function sectionName(id) {
    return moduleState.secoes.find((s) => Number(s.id) === Number(id))?.nome || 'Seção';
  }

  function ramoNameForSection(sectionId) {
    const sec = moduleState.secoes.find((s) => Number(s.id) === Number(sectionId));
    const ramo = moduleState.ramos.find((r) => Number(r.id) === Number(sec?.ramo_id));
    return ramo?.nome || '';
  }

  function chiefName(id) {
    return moduleState.chefes.find((c) => Number(c.id) === Number(id))?.nome_completo || '';
  }

  function renderAreaCheckboxes(container, prefix) {
    if (!container) return;
    container.innerHTML = AREAS.map((area) => `
      <label class="development-area-option"><input type="checkbox" value="${escapeHtml(area)}" data-area-group="${escapeHtml(prefix)}" /> <span>${escapeHtml(area)}</span></label>
    `).join('');
  }

  function setAreas(container, selected = []) {
    const selectedSet = new Set(selected || []);
    container?.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = selectedSet.has(input.value);
    });
  }

  function getAreas(container) {
    return [...(container?.querySelectorAll('input[type="checkbox"]:checked') || [])].map((i) => i.value);
  }

  async function loadReferences(force = false) {
    if (moduleState.referencesLoaded && !force) return;
    const profile = appState.profile;
    const requests = [
      client.from('ramos').select('id,nome,ordem,ativo').eq('ativo', true).order('ordem'),
      client.from('secoes').select('id,nome,ramo_id,ativo').eq('ativo', true).order('nome'),
      client.from('chefes').select('id,nome_completo,ativo').eq('ativo', true).order('nome_completo'),
      client.from('chefe_secoes').select('chefe_id,secao_id')
    ];
    const results = await Promise.all(requests);
    const firstError = results.find((r) => r.error)?.error;
    if (firstError) throw firstError;
    moduleState.ramos = results[0].data || [];
    moduleState.secoes = results[1].data || [];
    moduleState.chefes = results[2].data || [];
    moduleState.chefeSecoes = results[3].data || [];
    moduleState.ownSectionIds = profile?.chefe_id
      ? moduleState.chefeSecoes.filter((r) => Number(r.chefe_id) === Number(profile.chefe_id)).map((r) => Number(r.secao_id))
      : [];
    moduleState.referencesLoaded = true;
    fillSectionControls();
    fillRamoControl();
  }

  function fillSectionControls() {
    const visible = visibleSections();
    const manageable = manageableSections();
    const options = visible.map((s) => `<option value="${s.id}">${escapeHtml(s.nome)}</option>`).join('');
    ui.sectionFilter.innerHTML = `<option value="">Todas</option>${options}`;
    ui.editorSection.innerHTML = options || '<option value="">Sem seção disponível</option>';
    ui.newSection.innerHTML = manageable.map((s) => `<option value="${s.id}">${escapeHtml(s.nome)}</option>`).join('') || '<option value="">Sem seção disponível</option>';
    ui.newButton.classList.toggle('hidden', manageable.length === 0);
  }

  function fillRamoControl() {
    ui.libraryRamo.innerHTML = moduleState.ramos.map((r) => `<option value="${escapeHtml(r.nome)}">${escapeHtml(r.nome)}</option>`).join('');
  }

  async function openProgrammingList() {
    try {
      await loadReferences();
      showOnly(ui.view);
      ui.roleNote.textContent = isAdmin()
        ? 'Administrador: pode criar e editar programações de todas as seções.'
        : isDirigente()
          ? 'Dirigente: consulta das programações do grupo.'
          : 'Chefia: pode preparar e editar as programações das suas seções.';
      await loadPrograms();
    } catch (error) {
      console.error(error);
      setMessage(ui.message, 'Não foi possível abrir o módulo de programação.');
    }
  }

  async function loadPrograms() {
    setMessage(ui.message, 'Carregando programações...');
    const { data, error } = await client
      .from('programacoes')
      .select('id,secao_id,data_atividade,horario_inicio,horario_termino,observacoes_finais,criado_em,atualizado_em')
      .order('data_atividade', { ascending: false })
      .order('horario_inicio', { ascending: false });
    if (error) {
      setMessage(ui.message, 'Não foi possível carregar as programações.');
      return;
    }
    moduleState.programs = data || [];
    renderPrograms();
    setMessage(ui.message, '');
  }

  function renderPrograms() {
    const sectionId = Number(ui.sectionFilter.value || 0);
    let rows = [...moduleState.programs];
    if (sectionId) rows = rows.filter((p) => Number(p.secao_id) === sectionId);
    if (!rows.length) {
      ui.list.innerHTML = '<div class="program-empty"><strong>Nenhuma programação encontrada.</strong><span>Crie uma nova programação para começar.</span></div>';
      return;
    }
    ui.list.innerHTML = rows.map((p) => {
      const manage = canManageSection(p.secao_id);
      return `<button type="button" class="program-list-card" data-program-id="${p.id}">
        <span class="program-list-date"><strong>${escapeHtml(formatDate(p.data_atividade))}</strong><small>${escapeHtml(formatTime(p.horario_inicio))}–${escapeHtml(formatTime(p.horario_termino))}</small></span>
        <span class="program-list-copy"><strong>${escapeHtml(sectionName(p.secao_id))}</strong><small>${manage ? 'Editar programação' : 'Consultar programação'}</small></span>
        <span class="program-list-arrow">›</span>
      </button>`;
    }).join('');
  }

  function openNewProgrammingDialog() {
    const sections = manageableSections();
    if (!sections.length) return;
    ui.newForm.reset();
    ui.newSection.innerHTML = sections.map((s) => `<option value="${s.id}">${escapeHtml(s.nome)}</option>`).join('');
    const today = new Date();
    const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    ui.newDate.value = local;
    ui.newStart.value = '14:00';
    ui.newEnd.value = '17:00';
    setMessage(ui.newMessage, '');
    ui.newDialog.showModal();
  }

  function computeDefaultFixedTimes(start, end) {
    const startMin = toMinutes(start);
    const endMin = toMinutes(end);
    const arriamento = endMin - 15;
    let intervalo = Math.round(((startMin + endMin) / 2 - 7.5) / 15) * 15;
    intervalo = Math.max(startMin + 30, Math.min(intervalo, endMin - 30));
    return {
      hasteamento: fromMinutes(startMin),
      intervalo: fromMinutes(intervalo),
      arriamento: fromMinutes(arriamento)
    };
  }

  async function createProgramming(event) {
    event.preventDefault();
    setMessage(ui.newMessage, '');
    const sectionId = Number(ui.newSection.value || 0);
    const date = ui.newDate.value;
    const start = ui.newStart.value;
    const end = ui.newEnd.value;
    if (!sectionId || !date || !start || !end) {
      setMessage(ui.newMessage, 'Preencha seção, data e horários.');
      return;
    }
    if (toMinutes(end) <= toMinutes(start)) {
      setMessage(ui.newMessage, 'O horário de término precisa ser posterior ao início.');
      return;
    }
    ui.saveNew.disabled = true;
    ui.saveNew.textContent = 'Criando...';
    const { data, error } = await client.from('programacoes').insert({
      secao_id: sectionId,
      data_atividade: date,
      horario_inicio: start,
      horario_termino: end,
      criado_por: appState.user?.id
    }).select('id,secao_id,data_atividade,horario_inicio,horario_termino,observacoes_finais').single();
    if (error) {
      ui.saveNew.disabled = false;
      ui.saveNew.textContent = 'Criar programação';
      setMessage(ui.newMessage, 'Não foi possível criar a programação.');
      return;
    }
    const fixed = computeDefaultFixedTimes(start, end);
    const items = [
      { programacao_id: data.id, ordem: 10, tipo: 'fixo', hora_inicio: fixed.hasteamento, duracao_min: 15, nome: 'IBOA – Hasteamento', origem: 'fixo', criado_por: appState.user?.id },
      { programacao_id: data.id, ordem: 50, tipo: 'intervalo', hora_inicio: fixed.intervalo, duracao_min: 15, nome: 'Intervalo', origem: 'fixo', criado_por: appState.user?.id },
      { programacao_id: data.id, ordem: 90, tipo: 'fixo', hora_inicio: fixed.arriamento, duracao_min: 15, nome: 'IBOA – Arriamento', origem: 'fixo', criado_por: appState.user?.id }
    ];
    const { error: itemError } = await client.from('programacao_itens').insert(items);
    ui.saveNew.disabled = false;
    ui.saveNew.textContent = 'Criar programação';
    if (itemError) {
      setMessage(ui.newMessage, 'A programação foi criada, mas os blocos fixos não puderam ser incluídos.');
      return;
    }
    closeDialog(ui.newDialog);
    await loadPrograms();
    await openProgramEditor(data.id);
  }

  async function openProgramEditor(id) {
    await loadReferences();
    const { data, error } = await client.from('programacoes')
      .select('id,secao_id,data_atividade,horario_inicio,horario_termino,observacoes_finais,criado_por,criado_em,atualizado_em')
      .eq('id', Number(id)).single();
    if (error || !data) {
      setMessage(ui.message, 'Não foi possível abrir a programação.');
      return;
    }
    moduleState.currentProgram = data;
    showOnly(ui.editorView);
    fillEditorHeader();
    await loadProgramItems();
  }

  function fillEditorHeader() {
    const p = moduleState.currentProgram;
    const manage = canManageCurrent();
    const sections = manage ? manageableSections() : visibleSections();
    ui.editorSection.innerHTML = sections.map((s) => `<option value="${s.id}">${escapeHtml(s.nome)}</option>`).join('');
    ui.editorSection.value = String(p.secao_id);
    ui.editorDate.value = p.data_atividade || '';
    ui.editorStart.value = formatTime(p.horario_inicio);
    ui.editorEnd.value = formatTime(p.horario_termino);
    ui.finalNotes.value = p.observacoes_finais || '';
    ui.editorTitle.textContent = `${sectionName(p.secao_id)} • ${formatDate(p.data_atividade)}`;
    ui.editorPermission.textContent = manage
      ? 'Você pode alterar esta programação.'
      : 'Modo de consulta: esta programação não pode ser alterada pelo seu perfil.';
    [ui.editorSection, ui.editorDate, ui.editorStart, ui.editorEnd, ui.finalNotes].forEach((el) => { if (el) el.disabled = !manage; });
    ui.saveBasic.classList.toggle('hidden', !manage);
    ui.saveNotes.classList.toggle('hidden', !manage);
    ui.deleteProgram.classList.toggle('hidden', !manage);
    ui.actionBar.classList.toggle('hidden', !manage);
    ui.newLibrary.classList.toggle('hidden', !canCreateLibrary());
  }

  async function saveProgramBasic() {
    if (!canManageCurrent()) return;
    const sectionId = Number(ui.editorSection.value || 0);
    const date = ui.editorDate.value;
    const start = ui.editorStart.value;
    const end = ui.editorEnd.value;
    if (!sectionId || !date || !start || !end) return setMessage(ui.editorMessage, 'Preencha os dados da programação.');
    if (toMinutes(end) <= toMinutes(start)) return setMessage(ui.editorMessage, 'O término precisa ser posterior ao início.');
    ui.saveBasic.disabled = true;
    const { data, error } = await client.from('programacoes').update({
      secao_id: sectionId,
      data_atividade: date,
      horario_inicio: start,
      horario_termino: end,
      atualizado_em: new Date().toISOString()
    }).eq('id', moduleState.currentProgram.id).select('id,secao_id,data_atividade,horario_inicio,horario_termino,observacoes_finais').single();
    ui.saveBasic.disabled = false;
    if (error) return setMessage(ui.editorMessage, 'Não foi possível salvar data e horários.');
    moduleState.currentProgram = { ...moduleState.currentProgram, ...data };
    fillEditorHeader();
    renderTimeline();
    setMessage(ui.editorMessage, 'Data e horários salvos.', true);
  }

  async function saveProgramNotes() {
    if (!canManageCurrent()) return;
    ui.saveNotes.disabled = true;
    const { data, error } = await client.from('programacoes').update({
      observacoes_finais: ui.finalNotes.value.trim() || null,
      atualizado_em: new Date().toISOString()
    }).eq('id', moduleState.currentProgram.id).select('observacoes_finais').single();
    ui.saveNotes.disabled = false;
    if (error) return setMessage(ui.editorMessage, 'Não foi possível salvar as observações.');
    moduleState.currentProgram.observacoes_finais = data?.observacoes_finais || '';
    setMessage(ui.editorMessage, 'Observações salvas.', true);
  }

  async function deleteProgram() {
    if (!canManageCurrent()) return;
    const p = moduleState.currentProgram;
    if (!window.confirm(`Apagar toda a programação de ${sectionName(p.secao_id)} em ${formatDate(p.data_atividade)}?\n\nTodos os itens desta programação também serão apagados.`)) return;
    const { error } = await client.from('programacoes').delete().eq('id', p.id);
    if (error) return setMessage(ui.editorMessage, 'Não foi possível apagar a programação.');
    moduleState.currentProgram = null;
    moduleState.items = [];
    await loadPrograms();
    showOnly(ui.view);
  }

  async function loadProgramItems() {
    const { data, error } = await client.from('programacao_itens')
      .select('id,programacao_id,ordem,tipo,hora_inicio,duracao_min,nome,condutor_chefe_id,objetivo,areas_desenvolvimento,eixo,bloco,itens_progressao,materiais,preparacao,desenvolvimento,regras,seguranca,plano_b,origem,biblioteca_atividade_id,ideia_progressao_id,criado_em,atualizado_em')
      .eq('programacao_id', moduleState.currentProgram.id)
      .order('hora_inicio', { ascending: true })
      .order('ordem', { ascending: true });
    if (error) {
      setMessage(ui.editorMessage, 'Não foi possível carregar os itens da programação.');
      return;
    }
    moduleState.items = data || [];
    renderTimeline();
  }

  function itemEnd(item) {
    const start = toMinutes(item.hora_inicio);
    return start == null ? null : start + Number(item.duracao_min || 0);
  }

  function hasConflict(item) {
    const a0 = toMinutes(item.hora_inicio);
    const a1 = itemEnd(item);
    if (a0 == null || a1 == null) return false;
    return moduleState.items.some((other) => {
      if (Number(other.id) === Number(item.id)) return false;
      const b0 = toMinutes(other.hora_inicio);
      const b1 = itemEnd(other);
      if (b0 == null || b1 == null) return false;
      return a0 < b1 && b0 < a1;
    });
  }

  function renderTimeline() {
    const rows = [...moduleState.items].sort((a, b) => {
      const ta = toMinutes(a.hora_inicio) ?? 99999;
      const tb = toMinutes(b.hora_inicio) ?? 99999;
      return ta - tb || Number(a.ordem || 0) - Number(b.ordem || 0);
    });
    const totalUsed = rows.reduce((sum, r) => sum + Number(r.duracao_min || 0), 0);
    const available = Math.max(0, (toMinutes(moduleState.currentProgram?.horario_termino) || 0) - (toMinutes(moduleState.currentProgram?.horario_inicio) || 0));
    ui.timelineTotal.textContent = `${totalUsed} de ${available} min`;
    if (!rows.length) {
      ui.timeline.innerHTML = '<div class="program-empty"><strong>Programação sem itens.</strong><span>Adicione uma atividade ou busque uma ideia.</span></div>';
      return;
    }
    const manage = canManageCurrent();
    ui.timeline.innerHTML = rows.map((item) => {
      const fixed = item.tipo !== 'atividade';
      const end = itemEnd(item);
      const conflict = hasConflict(item);
      const areas = (item.areas_desenvolvimento || []).map((a) => `<span class="program-chip area">${escapeHtml(a)}</span>`).join('');
      const educational = [item.eixo, item.bloco].filter(Boolean).map((v) => `<span class="program-chip">${escapeHtml(v)}</span>`).join('');
      const conductor = item.condutor_chefe_id ? chiefName(item.condutor_chefe_id) : '';
      return `<article class="program-timeline-item ${fixed ? 'fixed-item' : 'activity-item'} ${conflict ? 'has-conflict' : ''}">
        <div class="program-time-block"><strong>${escapeHtml(formatTime(item.hora_inicio))}</strong><span>${end != null ? escapeHtml(fromMinutes(end)) : '--:--'}</span><small>${Number(item.duracao_min || 0)} min</small></div>
        <div class="program-item-main">
          <div class="program-item-heading"><div><span class="program-item-kind">${fixed ? 'BLOCO FIXO' : 'ATIVIDADE'}</span><h3>${escapeHtml(item.nome)}</h3></div>${conflict ? '<span class="program-conflict">⚠ Horários sobrepostos</span>' : ''}</div>
          ${conductor ? `<p class="program-conductor">Condução: <strong>${escapeHtml(conductor)}</strong></p>` : ''}
          ${!fixed && (areas || educational) ? `<div class="program-chip-row">${areas}${educational}</div>` : ''}
          ${!fixed && (item.itens_progressao || []).length ? `<p class="program-progress-summary"><strong>Itens:</strong> ${escapeHtml((item.itens_progressao || []).slice(0, 2).join(' • '))}${(item.itens_progressao || []).length > 2 ? ` +${item.itens_progressao.length - 2}` : ''}</p>` : ''}
        </div>
        <button class="program-edit-button" type="button" data-edit-program-item="${item.id}">${manage ? (fixed ? 'Ajustar horário' : 'Editar ficha') : 'Ver ficha'}</button>
      </article>`;
    }).join('');
  }

  function fillConductorOptions(sectionId, selected = '') {
    const sectionChiefIds = new Set(moduleState.chefeSecoes.filter((r) => Number(r.secao_id) === Number(sectionId)).map((r) => Number(r.chefe_id)));
    const options = moduleState.chefes.filter((c) => sectionChiefIds.has(Number(c.id))).map((c) => `<option value="${c.id}">${escapeHtml(c.nome_completo)}</option>`).join('');
    ui.itemConductor.innerHTML = `<option value="">A definir</option>${options}`;
    ui.itemConductor.value = selected ? String(selected) : '';
  }

  function nextAvailableStart(duration = 20) {
    const p = moduleState.currentProgram;
    const start = toMinutes(p?.horario_inicio);
    const end = toMinutes(p?.horario_termino);
    if (start == null || end == null) return p?.horario_inicio || '14:00';
    const occupied = moduleState.items
      .filter((i) => i.hora_inicio)
      .map((i) => [toMinutes(i.hora_inicio), itemEnd(i)])
      .filter((r) => r[0] != null && r[1] != null)
      .sort((a, b) => a[0] - b[0]);
    for (let t = start; t + duration <= end; t += 5) {
      const overlap = occupied.some(([a, b]) => t < b && a < t + duration);
      if (!overlap) return fromMinutes(t);
    }
    return fromMinutes(Math.max(start, end - duration));
  }

  function setProgramItemReadOnly(readOnly) {
    const fixed = ui.itemType.value !== 'atividade';
    const allInputs = ui.itemForm.querySelectorAll('input, textarea, select');
    allInputs.forEach((el) => {
      if (el.type === 'hidden') return;
      el.disabled = readOnly;
    });
    if (fixed && !readOnly) {
      allInputs.forEach((el) => { if (el.type !== 'hidden') el.disabled = true; });
      ui.itemStart.disabled = false;
    }
    ui.saveItem.classList.toggle('hidden', readOnly);
    ui.deleteItem.classList.toggle('hidden', readOnly || !ui.itemId.value);
  }

  function openProgramItemDialog(item = null, preset = null) {
    const manage = canManageCurrent();
    ui.itemForm.reset();
    setMessage(ui.itemMessage, '');
    const data = item || preset || {};
    const fixed = data.tipo && data.tipo !== 'atividade';
    ui.itemId.value = item?.id || '';
    ui.itemType.value = data.tipo || 'atividade';
    ui.itemOrigin.value = data.origem || 'manual';
    ui.itemTitle.textContent = fixed ? data.nome || 'Bloco fixo' : (item ? 'Editar atividade' : 'Nova atividade');
    ui.itemFixedNotice.classList.toggle('hidden', !fixed);
    ui.itemForm.classList.toggle('fixed-mode', fixed);
    ui.itemStart.value = data.hora_inicio ? formatTime(data.hora_inicio) : nextAvailableStart(Number(data.duracao_min || 20));
    ui.itemDuration.value = Number(data.duracao_min || (fixed ? 15 : 20));
    ui.itemName.value = data.nome || '';
    ui.itemObjective.value = data.objetivo || '';
    ui.itemAxis.value = data.eixo || '';
    ui.itemBlock.value = data.bloco || '';
    ui.itemProgressItems.value = (data.itens_progressao || []).join('\n');
    ui.itemMaterials.value = data.materiais || '';
    ui.itemPreparation.value = data.preparacao || '';
    ui.itemDevelopment.value = data.desenvolvimento || '';
    ui.itemRules.value = data.regras || '';
    ui.itemSafety.value = data.seguranca || '';
    ui.itemPlanB.value = data.plano_b || '';
    setAreas(ui.itemAreas, data.areas_desenvolvimento || []);
    fillConductorOptions(moduleState.currentProgram.secao_id, data.condutor_chefe_id || '');
    setProgramItemReadOnly(!manage);
    ui.itemDialog.showModal();
  }

  async function saveProgramItem(event) {
    event.preventDefault();
    if (!canManageCurrent()) return;
    const fixed = ui.itemType.value !== 'atividade';
    const payload = {
      hora_inicio: ui.itemStart.value,
      duracao_min: Number(ui.itemDuration.value || 15),
      atualizado_em: new Date().toISOString()
    };
    if (!fixed) {
      payload.nome = ui.itemName.value.trim();
      payload.condutor_chefe_id = ui.itemConductor.value ? Number(ui.itemConductor.value) : null;
      payload.objetivo = ui.itemObjective.value.trim() || null;
      payload.areas_desenvolvimento = getAreas(ui.itemAreas);
      payload.eixo = ui.itemAxis.value.trim() || null;
      payload.bloco = ui.itemBlock.value.trim() || null;
      payload.itens_progressao = splitLines(ui.itemProgressItems.value);
      payload.materiais = ui.itemMaterials.value.trim() || null;
      payload.preparacao = ui.itemPreparation.value.trim() || null;
      payload.desenvolvimento = ui.itemDevelopment.value.trim() || null;
      payload.regras = ui.itemRules.value.trim() || null;
      payload.seguranca = ui.itemSafety.value.trim() || null;
      payload.plano_b = ui.itemPlanB.value.trim() || null;
      payload.tipo = 'atividade';
      payload.origem = ui.itemOrigin.value || 'manual';
    }
    if (!payload.hora_inicio || (!fixed && !payload.nome)) return setMessage(ui.itemMessage, 'Informe o horário e o nome da atividade.');
    ui.saveItem.disabled = true;
    let result;
    if (ui.itemId.value) {
      result = await client.from('programacao_itens').update(payload).eq('id', Number(ui.itemId.value));
    } else {
      result = await client.from('programacao_itens').insert({
        ...payload,
        programacao_id: moduleState.currentProgram.id,
        ordem: 40,
        criado_por: appState.user?.id
      });
    }
    ui.saveItem.disabled = false;
    if (result.error) return setMessage(ui.itemMessage, 'Não foi possível salvar este item.');
    closeDialog(ui.itemDialog);
    await loadProgramItems();
    setMessage(ui.editorMessage, 'Programação atualizada.', true);
  }

  async function deleteProgramItem() {
    const id = Number(ui.itemId.value || 0);
    if (!id || !canManageCurrent()) return;
    const item = moduleState.items.find((i) => Number(i.id) === id);
    if (!window.confirm(`Apagar “${item?.nome || 'este item'}” da programação?`)) return;
    const { error } = await client.from('programacao_itens').delete().eq('id', id);
    if (error) return setMessage(ui.itemMessage, 'Não foi possível apagar o item.');
    closeDialog(ui.itemDialog);
    await loadProgramItems();
  }

  function parseSuggestedDuration(text) {
    const numbers = String(text || '').match(/\d+/g)?.map(Number) || [];
    if (!numbers.length) return 30;
    return Math.max(5, Math.min(240, numbers[0]));
  }

  function localIdeasForCurrentRamo() {
    const ramo = ramoNameForSection(moduleState.currentProgram?.secao_id);
    return (window.GEARPC_IDEAS || []).filter((idea) => idea.ramo === ramo).map((idea) => ({
      source: 'base',
      key: `base:${idea.codigo}`,
      nome: idea.nome,
      ramo: idea.ramo,
      objetivo: idea.objetivo,
      areas_desenvolvimento: idea.areas || [],
      eixo: idea.eixo,
      bloco: idea.bloco,
      itens_progressao: [idea.item],
      materiais: idea.materiais,
      duracao_min: parseSuggestedDuration(idea.duracao),
      duracao_texto: idea.duracao,
      participantes: idea.participantes,
      local_sugerido: idea.ambiente,
      preparacao: '',
      desenvolvimento: `${idea.item || ''}${idea.orientacao ? `\n\nFormato recomendado: ${idea.orientacao}` : ''}`,
      regras: '',
      seguranca: 'Adequar a aplicação à faixa etária, ao local e às orientações de segurança da atividade.',
      plano_b: '',
      tags: idea.palavras || [],
      origem_label: 'Base de ideias GEArPC',
      codigo: idea.codigo,
      fonte: idea.fonte,
      categoria: idea.categoria,
      formato: idea.formato,
      complexidade: idea.complexidade
    }));
  }

  async function loadLibrary() {
    const { data, error } = await client.from('biblioteca_atividades')
      .select('id,nome,ramo,objetivo,areas_desenvolvimento,eixo,bloco,itens_progressao,materiais,duracao_min,participantes,local_sugerido,preparacao,desenvolvimento,regras,seguranca,plano_b,tags,visibilidade,origem,criado_por,criado_por_chefe_id,criado_em,atualizado_em')
      .eq('ativo', true)
      .order('atualizado_em', { ascending: false });
    if (error) {
      moduleState.library = [];
      return;
    }
    moduleState.library = data || [];
  }

  function cloudIdeasForCurrentRamo() {
    const ramo = ramoNameForSection(moduleState.currentProgram?.secao_id);
    return moduleState.library.filter((a) => !a.ramo || a.ramo === ramo).map((a) => ({
      source: 'library',
      key: `library:${a.id}`,
      ...a,
      origem_label: a.visibilidade === 'privado' ? 'Minha atividade' : 'Banco compartilhado GEArPC'
    }));
  }

  async function openIdeaSearch() {
    if (!canManageCurrent()) return;
    setMessage(ui.ideaMessage, 'Carregando banco de atividades...');
    await loadLibrary();
    const ramo = ramoNameForSection(moduleState.currentProgram.secao_id);
    ui.ideaRamoLabel.textContent = `Ramo: ${ramo}`;
    ui.ideaText.value = '';
    ui.ideaArea.innerHTML = `<option value="">Todas</option>${AREAS.map((a) => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('')}`;
    buildIdeaFilters();
    renderIdeaResults();
    ui.ideaNewLibrary.classList.toggle('hidden', !canCreateLibrary());
    setMessage(ui.ideaMessage, '');
    ui.ideaDialog.showModal();
  }

  function allSearchIdeas() {
    return [...localIdeasForCurrentRamo(), ...cloudIdeasForCurrentRamo()];
  }

  function buildIdeaFilters() {
    const all = allSearchIdeas();
    const axes = unique(all.map((i) => i.eixo)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const blocks = unique(all.map((i) => i.bloco)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const oldAxis = ui.ideaAxis.value;
    const oldBlock = ui.ideaBlock.value;
    ui.ideaAxis.innerHTML = `<option value="">Todos</option>${axes.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}`;
    ui.ideaBlock.innerHTML = `<option value="">Todos</option>${blocks.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}`;
    if (axes.includes(oldAxis)) ui.ideaAxis.value = oldAxis;
    if (blocks.includes(oldBlock)) ui.ideaBlock.value = oldBlock;
  }

  function ideaMatches(idea) {
    const q = normalize(ui.ideaText.value);
    const axis = ui.ideaAxis.value;
    const block = ui.ideaBlock.value;
    const area = ui.ideaArea.value;
    if (axis && idea.eixo !== axis) return false;
    if (block && idea.bloco !== block) return false;
    if (area && !(idea.areas_desenvolvimento || []).includes(area)) return false;
    if (!q) return true;
    const hay = normalize([
      idea.nome, idea.objetivo, idea.eixo, idea.bloco,
      ...(idea.itens_progressao || []), idea.materiais, idea.desenvolvimento,
      ...(idea.tags || []), idea.formato, idea.categoria
    ].join(' '));
    return hay.includes(q);
  }

  function renderIdeaResults() {
    const rows = allSearchIdeas().filter(ideaMatches).slice(0, 120);
    ui.ideaCount.textContent = String(rows.length);
    if (!rows.length) {
      ui.ideaResults.innerHTML = '<div class="program-empty"><strong>Nenhuma ideia encontrada.</strong><span>Tente outro bloco, eixo ou palavra-chave.</span></div>';
      return;
    }
    ui.ideaResults.innerHTML = rows.map((idea) => {
      const areas = (idea.areas_desenvolvimento || []).map((a) => `<span class="program-chip area">${escapeHtml(a)}</span>`).join('');
      const edu = [idea.eixo, idea.bloco].filter(Boolean).map((v) => `<span class="program-chip">${escapeHtml(v)}</span>`).join('');
      return `<article class="idea-result-card">
        <div class="idea-result-top"><span class="idea-source ${idea.source}">${escapeHtml(idea.origem_label)}</span><span class="idea-duration">⏱ ${escapeHtml(idea.duracao_texto || `${idea.duracao_min || 30} min`)}</span></div>
        <h3>${escapeHtml(idea.nome)}</h3>
        <p>${escapeHtml(idea.objetivo || '')}</p>
        <div class="program-chip-row">${areas}${edu}</div>
        <div class="idea-result-actions"><button type="button" class="secondary-action-button" data-view-idea="${escapeHtml(idea.key)}">Ver ficha</button><button type="button" class="new-member-button" data-use-idea="${escapeHtml(idea.key)}">Usar na programação</button></div>
      </article>`;
    }).join('');
  }

  function findIdea(key) {
    return allSearchIdeas().find((i) => i.key === key) || null;
  }

  function renderActivitySheet(idea) {
    const values = [];
    const add = (label, value, wide = false) => {
      if (value == null || value === '' || (Array.isArray(value) && !value.length)) return;
      const display = Array.isArray(value) ? value.join(' • ') : value;
      values.push(`<div class="activity-sheet-field ${wide ? 'wide' : ''}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(display)}</strong></div>`);
    };
    add('Ramo', idea.ramo);
    add('Tempo previsto', idea.duracao_texto || `${idea.duracao_min || 30} min`);
    add('Participantes', idea.participantes);
    add('Local sugerido', idea.local_sugerido);
    add('Área(s) de desenvolvimento', idea.areas_desenvolvimento);
    add('Eixo', idea.eixo);
    add('Bloco', idea.bloco);
    add('Objetivo', idea.objetivo, true);
    add('Item ou itens relacionados', idea.itens_progressao, true);
    add('Material a ser usado', idea.materiais, true);
    add('Preparação prévia', idea.preparacao, true);
    add('Desenvolvimento / passo a passo', idea.desenvolvimento, true);
    add('Regras', idea.regras, true);
    add('Segurança / cuidados', idea.seguranca, true);
    add('Plano B / adaptações', idea.plano_b, true);
    return `<div class="activity-sheet-grid">${values.join('')}</div><p class="activity-sheet-origin">${escapeHtml(idea.origem_label || '')}${idea.codigo ? ` • ${escapeHtml(idea.codigo)}` : ''}</p>`;
  }

  function openIdeaDetail(key) {
    const idea = findIdea(key);
    if (!idea) return;
    moduleState.selectedIdea = idea;
    ui.ideaDetailTitle.textContent = idea.nome;
    ui.ideaDetailBody.innerHTML = renderActivitySheet(idea);
    ui.ideaUse.classList.toggle('hidden', !canManageCurrent());
    ui.ideaDetailDialog.showModal();
  }

  async function addIdeaToProgram(idea) {
    if (!idea || !canManageCurrent()) return;
    const duration = Number(idea.duracao_min || 30);
    const payload = {
      programacao_id: moduleState.currentProgram.id,
      ordem: 40,
      tipo: 'atividade',
      hora_inicio: nextAvailableStart(duration),
      duracao_min: duration,
      nome: idea.nome,
      condutor_chefe_id: null,
      objetivo: idea.objetivo || null,
      areas_desenvolvimento: idea.areas_desenvolvimento || [],
      eixo: idea.eixo || null,
      bloco: idea.bloco || null,
      itens_progressao: idea.itens_progressao || [],
      materiais: idea.materiais || null,
      preparacao: idea.preparacao || null,
      desenvolvimento: idea.desenvolvimento || null,
      regras: idea.regras || null,
      seguranca: idea.seguranca || null,
      plano_b: idea.plano_b || null,
      origem: idea.source === 'library' ? 'biblioteca' : 'ideia_base',
      biblioteca_atividade_id: idea.source === 'library' ? Number(idea.id) : null,
      criado_por: appState.user?.id
    };
    const { error } = await client.from('programacao_itens').insert(payload);
    if (error) {
      setMessage(ui.ideaMessage, 'Não foi possível adicionar a ideia à programação.');
      return;
    }
    closeDialog(ui.ideaDetailDialog);
    closeDialog(ui.ideaDialog);
    await loadProgramItems();
    setMessage(ui.editorMessage, 'Ideia adicionada. Abra a ficha para escolher quem irá conduzir ou fazer ajustes.', true);
  }

  function openLibraryDialog() {
    if (!canCreateLibrary()) return;
    ui.libraryForm.reset();
    ui.libraryId.value = '';
    ui.libraryTitle.textContent = 'Nova ideia de atividade';
    ui.libraryDuration.value = '30';
    ui.libraryVisibility.value = 'grupo';
    const ramo = ramoNameForSection(moduleState.currentProgram?.secao_id);
    if (ramo) ui.libraryRamo.value = ramo;
    setAreas(ui.libraryAreas, []);
    setMessage(ui.libraryMessage, '');
    ui.deleteLibrary.classList.add('hidden');
    ui.saveAndUseLibrary.classList.toggle('hidden', !canManageCurrent());
    ui.libraryDialog.showModal();
  }

  function libraryPayload() {
    return {
      nome: ui.libraryName.value.trim(),
      ramo: ui.libraryRamo.value || null,
      objetivo: ui.libraryObjective.value.trim() || null,
      areas_desenvolvimento: getAreas(ui.libraryAreas),
      eixo: ui.libraryAxis.value.trim() || null,
      bloco: ui.libraryBlock.value.trim() || null,
      itens_progressao: splitLines(ui.libraryProgressItems.value),
      materiais: ui.libraryMaterials.value.trim() || null,
      duracao_min: Number(ui.libraryDuration.value || 30),
      participantes: ui.libraryParticipants.value.trim() || null,
      local_sugerido: ui.libraryLocation.value.trim() || null,
      preparacao: ui.libraryPreparation.value.trim() || null,
      desenvolvimento: ui.libraryDevelopment.value.trim() || null,
      regras: ui.libraryRules.value.trim() || null,
      seguranca: ui.librarySafety.value.trim() || null,
      plano_b: ui.libraryPlanB.value.trim() || null,
      tags: splitTags(ui.libraryTags.value),
      visibilidade: ui.libraryVisibility.value || 'grupo',
      origem: 'chefia',
      criado_por: appState.user?.id,
      criado_por_chefe_id: appState.profile?.chefe_id || null,
      ativo: true,
      atualizado_em: new Date().toISOString()
    };
  }

  async function saveLibraryActivity(useAfter = false) {
    if (!canCreateLibrary()) return;
    const payload = libraryPayload();
    if (!payload.nome || !payload.objetivo || !payload.desenvolvimento) {
      setMessage(ui.libraryMessage, 'Informe nome, objetivo e desenvolvimento da atividade.');
      return;
    }
    ui.saveLibrary.disabled = true;
    ui.saveAndUseLibrary.disabled = true;
    let result;
    if (ui.libraryId.value) {
      result = await client.from('biblioteca_atividades').update(payload).eq('id', Number(ui.libraryId.value)).select('*').single();
    } else {
      result = await client.from('biblioteca_atividades').insert(payload).select('*').single();
    }
    ui.saveLibrary.disabled = false;
    ui.saveAndUseLibrary.disabled = false;
    if (result.error) return setMessage(ui.libraryMessage, 'Não foi possível salvar a atividade no banco.');
    closeDialog(ui.libraryDialog);
    await loadLibrary();
    if (ui.ideaDialog.open) {
      buildIdeaFilters();
      renderIdeaResults();
    }
    if (useAfter && canManageCurrent()) {
      const a = result.data;
      await addIdeaToProgram({ source: 'library', key: `library:${a.id}`, origem_label: 'Banco compartilhado GEArPC', ...a });
    } else {
      setMessage(ui.editorMessage, 'Atividade salva no banco do grupo.', true);
    }
  }

  async function openLibraryEdit(id) {
    const a = moduleState.library.find((r) => Number(r.id) === Number(id));
    if (!a) return;
    const owner = a.criado_por === appState.user?.id || isAdmin();
    if (!owner) return;
    ui.libraryForm.reset();
    ui.libraryId.value = String(a.id);
    ui.libraryTitle.textContent = 'Editar atividade do banco';
    ui.libraryName.value = a.nome || '';
    ui.libraryRamo.value = a.ramo || '';
    ui.libraryDuration.value = Number(a.duracao_min || 30);
    ui.libraryParticipants.value = a.participantes || '';
    ui.libraryLocation.value = a.local_sugerido || '';
    ui.libraryVisibility.value = a.visibilidade || 'grupo';
    ui.libraryObjective.value = a.objetivo || '';
    ui.libraryAxis.value = a.eixo || '';
    ui.libraryBlock.value = a.bloco || '';
    ui.libraryProgressItems.value = (a.itens_progressao || []).join('\n');
    ui.libraryMaterials.value = a.materiais || '';
    ui.libraryPreparation.value = a.preparacao || '';
    ui.libraryDevelopment.value = a.desenvolvimento || '';
    ui.libraryRules.value = a.regras || '';
    ui.librarySafety.value = a.seguranca || '';
    ui.libraryPlanB.value = a.plano_b || '';
    ui.libraryTags.value = (a.tags || []).join('; ');
    setAreas(ui.libraryAreas, a.areas_desenvolvimento || []);
    ui.deleteLibrary.classList.remove('hidden');
    ui.saveAndUseLibrary.classList.toggle('hidden', !canManageCurrent());
    setMessage(ui.libraryMessage, '');
    ui.libraryDialog.showModal();
  }

  async function deleteLibraryActivity() {
    const id = Number(ui.libraryId.value || 0);
    if (!id || !canCreateLibrary()) return;
    if (!window.confirm('Apagar esta atividade do banco de ideias?')) return;
    const { error } = await client.from('biblioteca_atividades').delete().eq('id', id);
    if (error) return setMessage(ui.libraryMessage, 'Não foi possível apagar a atividade.');
    closeDialog(ui.libraryDialog);
    await loadLibrary();
    if (ui.ideaDialog.open) renderIdeaResults();
  }

  function onIdeaResultsClick(event) {
    const viewButton = event.target.closest('[data-view-idea]');
    if (viewButton) return openIdeaDetail(viewButton.dataset.viewIdea);
    const useButton = event.target.closest('[data-use-idea]');
    if (useButton) {
      const idea = findIdea(useButton.dataset.useIdea);
      if (idea) addIdeaToProgram(idea);
      return;
    }
    const editButton = event.target.closest('[data-edit-library]');
    if (editButton) openLibraryEdit(Number(editButton.dataset.editLibrary));
  }

  function onProgramListClick(event) {
    const card = event.target.closest('[data-program-id]');
    if (card) openProgramEditor(Number(card.dataset.programId));
  }

  function onTimelineClick(event) {
    const button = event.target.closest('[data-edit-program-item]');
    if (!button) return;
    const item = moduleState.items.find((i) => Number(i.id) === Number(button.dataset.editProgramItem));
    if (item) openProgramItemDialog(item);
  }

  function registerEvents() {
    ui.button?.addEventListener('click', openProgrammingList);
    ui.back?.addEventListener('click', showDashboard);
    ui.logout?.addEventListener('click', () => $('logoutButton')?.click());
    ui.editorLogout?.addEventListener('click', () => $('logoutButton')?.click());
    ui.editorBack?.addEventListener('click', async () => { await loadPrograms(); showOnly(ui.view); });
    ui.newButton?.addEventListener('click', openNewProgrammingDialog);
    ui.refresh?.addEventListener('click', () => loadPrograms());
    ui.sectionFilter?.addEventListener('change', renderPrograms);
    ui.list?.addEventListener('click', onProgramListClick);

    ui.newForm?.addEventListener('submit', createProgramming);
    ui.closeNew?.addEventListener('click', () => closeDialog(ui.newDialog));
    ui.cancelNew?.addEventListener('click', () => closeDialog(ui.newDialog));
    ui.newDialog?.addEventListener('click', (e) => { if (e.target === ui.newDialog) closeDialog(ui.newDialog); });

    ui.saveBasic?.addEventListener('click', saveProgramBasic);
    ui.saveNotes?.addEventListener('click', saveProgramNotes);
    ui.deleteProgram?.addEventListener('click', deleteProgram);
    ui.addManual?.addEventListener('click', () => openProgramItemDialog(null, {
      tipo: 'atividade', origem: 'manual', hora_inicio: nextAvailableStart(20), duracao_min: 20,
      areas_desenvolvimento: [], itens_progressao: []
    }));
    ui.searchIdeas?.addEventListener('click', openIdeaSearch);
    ui.newLibrary?.addEventListener('click', openLibraryDialog);
    ui.timeline?.addEventListener('click', onTimelineClick);

    ui.itemForm?.addEventListener('submit', saveProgramItem);
    ui.closeItem?.addEventListener('click', () => closeDialog(ui.itemDialog));
    ui.cancelItem?.addEventListener('click', () => closeDialog(ui.itemDialog));
    ui.deleteItem?.addEventListener('click', deleteProgramItem);
    ui.itemDialog?.addEventListener('click', (e) => { if (e.target === ui.itemDialog) closeDialog(ui.itemDialog); });

    [ui.ideaText, ui.ideaAxis, ui.ideaBlock, ui.ideaArea].forEach((el) => {
      el?.addEventListener(el === ui.ideaText ? 'input' : 'change', renderIdeaResults);
    });
    ui.ideaResults?.addEventListener('click', onIdeaResultsClick);
    ui.ideaClose?.addEventListener('click', () => closeDialog(ui.ideaDialog));
    ui.ideaDialog?.addEventListener('click', (e) => { if (e.target === ui.ideaDialog) closeDialog(ui.ideaDialog); });
    ui.ideaNewLibrary?.addEventListener('click', () => { closeDialog(ui.ideaDialog); openLibraryDialog(); });

    ui.ideaDetailClose?.addEventListener('click', () => closeDialog(ui.ideaDetailDialog));
    ui.ideaDetailDialog?.addEventListener('click', (e) => { if (e.target === ui.ideaDetailDialog) closeDialog(ui.ideaDetailDialog); });
    ui.ideaUse?.addEventListener('click', () => addIdeaToProgram(moduleState.selectedIdea));

    ui.libraryForm?.addEventListener('submit', (e) => { e.preventDefault(); saveLibraryActivity(false); });
    ui.saveAndUseLibrary?.addEventListener('click', () => saveLibraryActivity(true));
    ui.closeLibrary?.addEventListener('click', () => closeDialog(ui.libraryDialog));
    ui.cancelLibrary?.addEventListener('click', () => closeDialog(ui.libraryDialog));
    ui.deleteLibrary?.addEventListener('click', deleteLibraryActivity);
    ui.libraryDialog?.addEventListener('click', (e) => { if (e.target === ui.libraryDialog) closeDialog(ui.libraryDialog); });
  }

  renderAreaCheckboxes(ui.itemAreas, 'program-item');
  renderAreaCheckboxes(ui.libraryAreas, 'library-activity');
  registerEvents();
})();
