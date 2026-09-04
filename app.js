(() => {
  const cfg = window.GEARPC_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const loginView = $('loginView');
  const dashboardView = $('dashboardView');
  const membersView = $('membersView');
  const loginForm = $('loginForm');
  const loginButton = $('loginButton');
  const loginMessage = $('loginMessage');
  const forgotPasswordButton = $('forgotPasswordButton');
  const passwordButton = $('passwordButton');
  const passwordDialog = $('passwordDialog');
  const passwordForm = $('passwordForm');
  const passwordDialogTitle = $('passwordDialogTitle');
  const passwordDialogHelper = $('passwordDialogHelper');
  const newPassword = $('newPassword');
  const confirmPassword = $('confirmPassword');
  const passwordFormMessage = $('passwordFormMessage');
  const savePasswordButton = $('savePasswordButton');
  const closePasswordDialog = $('closePasswordDialog');
  const cancelPasswordButton = $('cancelPasswordButton');
  const logoutButton = $('logoutButton');
  const membersLogoutButton = $('membersLogoutButton');
  const welcomeName = $('welcomeName');
  const profileType = $('profileType');
  const adminCard = $('adminCard');
  const statusLine = $('statusLine');
  const nextActivityTitle = $('nextActivityTitle');
  const nextActivityMeta = $('nextActivityMeta');
  const nextActivityHint = $('nextActivityHint');
  const activityVisualTag = $('activityVisualTag');
  const membersButton = $('membersButton');
  const membersBackButton = $('membersBackButton');
  const newMemberButton = $('newMemberButton');
  const memberSearch = $('memberSearch');
  const memberSecaoFilter = $('memberSecaoFilter');
  const membersList = $('membersList');
  const membersCount = $('membersCount');
  const membersRoleNote = $('membersRoleNote');
  const membersMessage = $('membersMessage');
  const memberDialog = $('memberDialog');
  const memberForm = $('memberForm');
  const memberDialogTitle = $('memberDialogTitle');
  const memberId = $('memberId');
  const memberName = $('memberName');
  const memberRegistration = $('memberRegistration');
  const memberBirth = $('memberBirth');
  const memberRegistrationValidity = $('memberRegistrationValidity');
  const memberSecao = $('memberSecao');
  const responsibleName = $('responsibleName');
  const responsibleRegistration = $('responsibleRegistration');
  const responsiblePhone = $('responsiblePhone');
  const memberActive = $('memberActive');
  const memberFormMessage = $('memberFormMessage');
  const saveMemberButton = $('saveMemberButton');
  const closeMemberDialog = $('closeMemberDialog');
  const cancelMemberButton = $('cancelMemberButton');
  const removeMemberButton = $('removeMemberButton');
  const memberInactiveToggleWrap = $('memberInactiveToggleWrap');
  const memberShowInactive = $('memberShowInactive');
  const teamManagerButton = $('teamManagerButton');
  const memberEquipeWrap = $('memberEquipeWrap');
  const memberEquipeLabel = $('memberEquipeLabel');
  const memberEquipe = $('memberEquipe');
  const memberAcolhida = $('memberAcolhida');
  const memberPromiseLobinho = $('memberPromiseLobinho');
  const memberPromiseEscoteira = $('memberPromiseEscoteira');
  const memberPromiseAdulta = $('memberPromiseAdulta');
  const memberDetailDialog = $('memberDetailDialog');
  const memberDetailTitle = $('memberDetailTitle');
  const memberDetailBody = $('memberDetailBody');
  const memberDetailAdminActions = $('memberDetailAdminActions');
  const memberDetailEditButton = $('memberDetailEditButton');
  const closeMemberDetailDialog = $('closeMemberDetailDialog');
  const medicalDialog = $('medicalDialog');
  const medicalForm = $('medicalForm');
  const medicalMemberId = $('medicalMemberId');
  const medicalMemberName = $('medicalMemberName');
  const medicalBloodType = $('medicalBloodType');
  const medicalAllergies = $('medicalAllergies');
  const medicalContinuousMedication = $('medicalContinuousMedication');
  const medicalFoodRestrictions = $('medicalFoodRestrictions');
  const medicalRelevantConditions = $('medicalRelevantConditions');
  const medicalSpecialNeeds = $('medicalSpecialNeeds');
  const medicalHealthPlan = $('medicalHealthPlan');
  const medicalCardNumber = $('medicalCardNumber');
  const medicalEmergencyName = $('medicalEmergencyName');
  const medicalEmergencyPhone = $('medicalEmergencyPhone');
  const medicalObservations = $('medicalObservations');
  const medicalFormMessage = $('medicalFormMessage');
  const saveMedicalButton = $('saveMedicalButton');
  const deleteMedicalButton = $('deleteMedicalButton');
  const closeMedicalDialog = $('closeMedicalDialog');
  const cancelMedicalButton = $('cancelMedicalButton');
  const journeyDialog = $('journeyDialog');
  const journeyForm = $('journeyForm');
  const journeyMemberId = $('journeyMemberId');
  const journeyMemberName = $('journeyMemberName');
  const journeyCanStart = $('journeyCanStart');
  const journeyStart = $('journeyStart');
  const journeyPassage = $('journeyPassage');
  const journeyLimit = $('journeyLimit');
  const journeyMessage = $('journeyMessage');
  const saveJourneyButton = $('saveJourneyButton');
  const clearJourneyButton = $('clearJourneyButton');
  const closeJourneyDialog = $('closeJourneyDialog');
  const cancelJourneyButton = $('cancelJourneyButton');
  const visitDialog = $('visitDialog');
  const visitForm = $('visitForm');
  const visitId = $('visitId');
  const visitMemberId = $('visitMemberId');
  const visitDialogTitle = $('visitDialogTitle');
  const visitDate = $('visitDate');
  const visitDestination = $('visitDestination');
  const visitObservation = $('visitObservation');
  const visitMessage = $('visitMessage');
  const saveVisitButton = $('saveVisitButton');
  const deleteVisitButton = $('deleteVisitButton');
  const closeVisitDialog = $('closeVisitDialog');
  const cancelVisitButton = $('cancelVisitButton');
  const teamDialog = $('teamDialog');
  const teamForm = $('teamForm');
  const teamId = $('teamId');
  const teamSection = $('teamSection');
  const teamName = $('teamName');
  const teamChiefOptions = $('teamChiefOptions');
  const teamFormMessage = $('teamFormMessage');
  const saveTeamButton = $('saveTeamButton');
  const deleteTeamButton = $('deleteTeamButton');
  const resetTeamButton = $('resetTeamButton');
  const closeTeamDialog = $('closeTeamDialog');
  const teamList = $('teamList');
  const chiefsView = $('chiefsView');
  const chiefsButton = $('chiefsButton');
  const chiefsBackButton = $('chiefsBackButton');
  const chiefsLogoutButton = $('chiefsLogoutButton');
  const newChiefButton = $('newChiefButton');
  const chiefSearch = $('chiefSearch');
  const chiefSecaoFilter = $('chiefSecaoFilter');
  const chiefsList = $('chiefsList');
  const chiefsCount = $('chiefsCount');
  const chiefsRoleNote = $('chiefsRoleNote');
  const chiefsMessage = $('chiefsMessage');
  const chiefsIntroText = $('chiefsIntroText');
  const chiefDialog = $('chiefDialog');
  const chiefForm = $('chiefForm');
  const chiefDialogTitle = $('chiefDialogTitle');
  const chiefId = $('chiefId');
  const chiefName = $('chiefName');
  const chiefRegistration = $('chiefRegistration');
  const chiefRegistrationValidity = $('chiefRegistrationValidity');
  const chiefBirth = $('chiefBirth');
  const chiefPhone = $('chiefPhone');
  const chiefFunctions = $('chiefFunctions');
  const chiefSectionsOptions = $('chiefSectionsOptions');
  const chiefActive = $('chiefActive');
  const chiefFormMessage = $('chiefFormMessage');
  const saveChiefButton = $('saveChiefButton');
  const closeChiefDialog = $('closeChiefDialog');
  const cancelChiefButton = $('cancelChiefButton');
  const removeChiefButton = $('removeChiefButton');
  const chiefInactiveToggleWrap = $('chiefInactiveToggleWrap');
  const chiefShowInactive = $('chiefShowInactive');
  const chiefPromiseLobinho = $('chiefPromiseLobinho');
  const chiefPromiseEscoteira = $('chiefPromiseEscoteira');
  const chiefPromiseAdulta = $('chiefPromiseAdulta');
  const chiefDetailDialog = $('chiefDetailDialog');
  const chiefDetailTitle = $('chiefDetailTitle');
  const chiefDetailBody = $('chiefDetailBody');
  const chiefDetailAdminActions = $('chiefDetailAdminActions');
  const chiefDetailEditButton = $('chiefDetailEditButton');
  const closeChiefDetailDialog = $('closeChiefDetailDialog');
  const chiefMedicalDialog = $('chiefMedicalDialog');
  const chiefMedicalForm = $('chiefMedicalForm');
  const chiefMedicalChiefId = $('chiefMedicalChiefId');
  const chiefMedicalChiefName = $('chiefMedicalChiefName');
  const chiefMedicalBloodType = $('chiefMedicalBloodType');
  const chiefMedicalAllergies = $('chiefMedicalAllergies');
  const chiefMedicalContinuousMedication = $('chiefMedicalContinuousMedication');
  const chiefMedicalFoodRestrictions = $('chiefMedicalFoodRestrictions');
  const chiefMedicalRelevantConditions = $('chiefMedicalRelevantConditions');
  const chiefMedicalSpecialNeeds = $('chiefMedicalSpecialNeeds');
  const chiefMedicalHealthPlan = $('chiefMedicalHealthPlan');
  const chiefMedicalCardNumber = $('chiefMedicalCardNumber');
  const chiefMedicalEmergencyName = $('chiefMedicalEmergencyName');
  const chiefMedicalEmergencyPhone = $('chiefMedicalEmergencyPhone');
  const chiefMedicalObservations = $('chiefMedicalObservations');
  const chiefMedicalFormMessage = $('chiefMedicalFormMessage');
  const saveChiefMedicalButton = $('saveChiefMedicalButton');
  const deleteChiefMedicalButton = $('deleteChiefMedicalButton');
  const closeChiefMedicalDialog = $('closeChiefMedicalDialog');
  const cancelChiefMedicalButton = $('cancelChiefMedicalButton');
  const attendanceView = $('attendanceView');
  const attendanceButton = $('attendanceButton');
  const attendanceBackButton = $('attendanceBackButton');
  const attendanceLogoutButton = $('attendanceLogoutButton');
  const attendanceSection = $('attendanceSection');
  const attendanceDate = $('attendanceDate');
  const attendanceIntroText = $('attendanceIntroText');
  const attendancePresentCount = $('attendancePresentCount');
  const attendanceAbsentCount = $('attendanceAbsentCount');
  const attendancePendingCount = $('attendancePendingCount');
  const attendanceRoleNote = $('attendanceRoleNote');
  const attendanceList = $('attendanceList');
  const attendanceMessage = $('attendanceMessage');
  const attendanceDeleteCallButton = $('attendanceDeleteCallButton');
  const accessView = $('accessView');
  const accessButton = $('accessButton');
  const accessBackButton = $('accessBackButton');
  const accessLogoutButton = $('accessLogoutButton');
  const accessRefreshButton = $('accessRefreshButton');
  const accessSearch = $('accessSearch');
  const accessList = $('accessList');
  const accessMessage = $('accessMessage');
  const accessTotalCount = $('accessTotalCount');
  const accessEnteredCount = $('accessEnteredCount');
  const accessPendingCount = $('accessPendingCount');
  const accessInstalledCount = $('accessInstalledCount');

  const state = {
    user: null,
    profile: null,
    ramos: [],
    secoes: [],
    jovens: [],
    responsaveis: [],
    vinculos: [],
    chefes: [],
    chefeFuncoes: [],
    chefeSecoes: [],
    equipes: [],
    equipeChefes: [],
    fichasMedicas: [],
    fichasMedicasChefes: [],
    visitasProximoRamo: [],
    ownChiefSectionIds: [],
    selectedMemberDetailId: null,
    selectedChiefDetailId: null,
    attendanceOwnSectionIds: [],
    attendanceCall: null,
    attendanceRows: [],
    accessRows: []
  };

  function authActionFromUrl() {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const search = new URLSearchParams(window.location.search);
    return hash.get('type') || search.get('type') || '';
  }

  const initialAuthAction = authActionFromUrl();
  let autoPasswordDialogOpened = false;

  function configOk() {
    return cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY &&
      !cfg.SUPABASE_URL.includes('COLE_AQUI') &&
      !cfg.SUPABASE_PUBLISHABLE_KEY.includes('COLE_AQUI');
  }

  if (!configOk()) {
    loginMessage.textContent = 'Primeiro preencha o arquivo config.js com o Project URL e a Publishable Key.';
    loginButton.disabled = true;
    return;
  }

  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);

  function hideAllViews() {
    loginView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    membersView.classList.add('hidden');
    chiefsView.classList.add('hidden');
    attendanceView.classList.add('hidden');
    accessView.classList.add('hidden');
  }
  function showLogin() { hideAllViews(); loginView.classList.remove('hidden'); }
  function showDashboard() { hideAllViews(); dashboardView.classList.remove('hidden'); }
  function showMembers() { hideAllViews(); membersView.classList.remove('hidden'); }
  function showChiefs() { hideAllViews(); chiefsView.classList.remove('hidden'); }
  function showAttendance() { hideAllViews(); attendanceView.classList.remove('hidden'); }
  function showAccess() { hideAllViews(); accessView.classList.remove('hidden'); }

  function prettyProfile(profile) {
    if (!profile) return 'Usuário';
    if (profile.tipo === 'administrador') return 'Administrador';
    if (profile.acesso_geral_consulta) return 'Dirigente';
    return ({ chefia: 'Chefia', responsavel: 'Responsável' })[profile.tipo] || profile.tipo || 'Usuário';
  }

  async function loadProfile(user) {
    const { data, error } = await client.from('perfis_usuarios').select('nome_completo,tipo,ativo,acesso_geral_consulta,chefe_id').eq('user_id', user.id).single();
    if (error || !data) {
      await client.auth.signOut();
      loginMessage.textContent = 'Seu acesso existe, mas ainda não possui um perfil autorizado no GEArPC Conecta.';
      showLogin();
      return false;
    }
    if (!data.ativo) {
      await client.auth.signOut();
      loginMessage.textContent = 'Este acesso está desativado. Procure o administrador do grupo.';
      showLogin();
      return false;
    }
    state.user = user;
    state.profile = data;
    welcomeName.textContent = `Olá, ${data.nome_completo}`;
    profileType.textContent = prettyProfile(data);
    adminCard.classList.toggle('hidden', data.tipo !== 'administrador');
    membersButton.classList.toggle('hidden', data.tipo === 'responsavel');
    chiefsButton.classList.remove('hidden');
    attendanceButton.classList.toggle('hidden', data.tipo === 'responsavel');
    accessButton.classList.toggle('hidden', data.tipo !== 'administrador');
    newChiefButton.classList.toggle('hidden', data.tipo !== 'administrador');
    newMemberButton.classList.toggle('hidden', data.tipo !== 'administrador');
    teamManagerButton.classList.toggle('hidden', data.tipo !== 'administrador');
    memberInactiveToggleWrap.classList.toggle('hidden', data.tipo !== 'administrador');
    chiefInactiveToggleWrap.classList.toggle('hidden', data.tipo !== 'administrador');
    if (data.tipo !== 'administrador') {
      memberShowInactive.checked = false;
      chiefShowInactive.checked = false;
    }
    membersRoleNote.textContent = data.tipo === 'administrador'
      ? 'Administrador: consulta e edição dos jovens.'
      : data.acesso_geral_consulta
        ? 'Dirigente: consulta geral dos jovens do grupo.'
        : data.tipo === 'responsavel'
          ? 'Consulta dos jovens vinculados ao seu acesso.'
          : 'Chefia: consulta dos jovens das suas seções.';
    chiefsRoleNote.textContent = data.tipo === 'administrador'
      ? 'Administrador: consulta e edição da equipe adulta.'
      : data.tipo === 'responsavel'
        ? 'Você vê apenas a chefia das seções dos seus filhos.'
        : data.acesso_geral_consulta
          ? 'Dirigente: consulta da equipe adulta do grupo.'
          : 'Consulta da equipe adulta do grupo.';
    chiefsIntroText.textContent = data.tipo === 'responsavel'
      ? 'Aqui aparecem somente os chefes vinculados às seções dos seus filhos.'
      : 'Consulte a equipe adulta, suas funções, seções e contatos.';
    attendanceRoleNote.textContent = data.tipo === 'administrador'
      ? 'Administrador: pode registrar e corrigir a presença de qualquer seção.'
      : data.acesso_geral_consulta
        ? 'Dirigente: consulta as listas de todas as seções. A marcação é feita pela chefia da seção.'
        : 'Chefia: registre a presença somente dos jovens da sua seção.';
    attendanceIntroText.textContent = data.acesso_geral_consulta && data.tipo !== 'administrador'
      ? 'Selecione a seção e a data para consultar a chamada.'
      : 'Selecione a seção e a data da reunião para registrar a presença.';
    statusLine.textContent = 'Ambiente seguro • acesso restrito a usuários autorizados';
    return true;
  }

  function formatDateRange(startIso, endIso, local) {
    const start = new Date(startIso);
    const dateText = start.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStart = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    let text = `${dateText} • ${timeStart}`;
    if (endIso) {
      const end = new Date(endIso);
      text += ` às ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (local) text += ` • ${local}`;
    return text;
  }

  function showDemoActivity() {
    nextActivityTitle.textContent = 'Reunião semanal';
    nextActivityMeta.textContent = 'sábado, 05/09/2026 • 14:00 às 17:00 • Sede do grupo';
    nextActivityHint.textContent = 'Prévia visual para apresentação do aplicativo ao grupo.';
    activityVisualTag.classList.remove('hidden');
  }

  async function loadNextActivity() {
    const now = new Date().toISOString();
    const { data, error } = await client.from('atividades').select('titulo,data_inicio,data_fim,local').gte('data_inicio', now).order('data_inicio', { ascending: true }).limit(1);
    if (!error && data && data.length) {
      nextActivityTitle.textContent = data[0].titulo;
      nextActivityMeta.textContent = formatDateRange(data[0].data_inicio, data[0].data_fim, data[0].local);
      nextActivityHint.textContent = '';
      activityVisualTag.classList.add('hidden');
    } else {
      showDemoActivity();
    }
  }

  function formatDateBR(value) {
    if (!value) return '—';
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }

  function formatBirth(value) {
    return formatDateBR(value);
  }

  function registrationStatus(value) {
    if (!value) return { label: 'Validade não informada', cls: 'unknown' };
    const [y, m, d] = value.split('-').map(Number);
    const expiry = Date.UTC(y, m - 1, d);
    const now = new Date();
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const days = Math.ceil((expiry - today) / 86400000);
    if (days < 0) return { label: `Registro vencido em ${formatDateBR(value)}`, cls: 'expired' };
    if (days === 0) return { label: 'Registro vence hoje', cls: 'warning' };
    if (days <= 30) return { label: `Registro vence em ${days} dia${days === 1 ? '' : 's'}`, cls: 'warning' };
    return { label: `Registro válido até ${formatDateBR(value)}`, cls: 'valid' };
  }

  function normalizePhone(value) {
    return (value || '').replace(/\D/g, '');
  }

  function normalizeText(value) {
    return (value || '').trim().toLocaleLowerCase('pt-BR');
  }

  function principalLink(jovemId) {
    const links = state.vinculos.filter((v) => Number(v.jovem_id) === Number(jovemId));
    return links.find((v) => v.responsavel_principal) || links[0] || null;
  }

  function memberRows() {
    const ramoMap = new Map(state.ramos.map((r) => [Number(r.id), r]));
    const secaoMap = new Map(state.secoes.map((s) => [Number(s.id), s]));
    const respMap = new Map(state.responsaveis.map((r) => [Number(r.id), r]));
    return state.jovens.map((j) => {
      const link = principalLink(j.id);
      const resp = link ? respMap.get(Number(link.responsavel_id)) : null;
      const ramo = ramoMap.get(Number(j.ramo_id)) || null;
      let secao = secaoMap.get(Number(j.secao_id)) || null;
      if (!secao && ramo) secao = state.secoes.find((s) => Number(s.ramo_id) === Number(ramo.id)) || null;
      return {
        ...j,
        ramo,
        secao,
        responsavel: resp || null,
        responsavel_id: resp?.id || null
      };
    });
  }

  function sortedSections() {
    const ramoMap = new Map(state.ramos.map((r) => [Number(r.id), r]));
    return [...state.secoes].sort((a, b) => {
      const ra = ramoMap.get(Number(a.ramo_id));
      const rb = ramoMap.get(Number(b.ramo_id));
      return (ra?.ordem || 99) - (rb?.ordem || 99) || a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }

  function renderSecaoOptions() {
    const ramoMap = new Map(state.ramos.map((r) => [Number(r.id), r]));
    const options = sortedSections().map((s) => {
      const ramo = ramoMap.get(Number(s.ramo_id));
      return `<option value="${s.id}">${escapeHtml(s.nome)}${ramo ? ` — ${escapeHtml(ramo.nome)}` : ''}</option>`;
    }).join('');
    memberSecao.innerHTML = `<option value="">Selecione</option>${options}`;
    memberSecaoFilter.innerHTML = `<option value="">Todas</option>${options}`;
  }

  function escapeHtml(text) {
    return String(text ?? '').replace(/[&<>'"]/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[ch]);
  }

  function ramoForSectionId(secaoId) {
    const secao = state.secoes.find((s) => Number(s.id) === Number(secaoId));
    return state.ramos.find((r) => Number(r.id) === Number(secao?.ramo_id)) || null;
  }

  function teamLabelForSection(secaoId) {
    const ramo = normalizeText(ramoForSectionId(secaoId)?.nome);
    if (ramo === 'lobinho') return 'Matilha';
    if (ramo === 'escoteiro' || ramo === 'sênior' || ramo === 'senior') return 'Patrulha';
    return 'Equipe';
  }

  function sectionSupportsTeam(secaoId) {
    const label = teamLabelForSection(secaoId);
    return label === 'Matilha' || label === 'Patrulha';
  }

  function teamForMember(member) {
    return state.equipes.find((e) => Number(e.id) === Number(member?.equipe_id)) || null;
  }

  function teamChiefsFor(equipeId) {
    const chiefIds = state.equipeChefes
      .filter((row) => Number(row.equipe_id) === Number(equipeId))
      .map((row) => Number(row.chefe_id));
    return state.chefes.filter((c) => chiefIds.includes(Number(c.id)));
  }

  function teamsForChief(chefeId) {
    const ids = state.equipeChefes
      .filter((row) => Number(row.chefe_id) === Number(chefeId))
      .map((row) => Number(row.equipe_id));
    return state.equipes.filter((e) => ids.includes(Number(e.id)));
  }

  function medicalForMember(jovemId) {
    return state.fichasMedicas.find((m) => Number(m.jovem_id) === Number(jovemId)) || null;
  }

  function medicalForChief(chefeId) {
    return state.fichasMedicasChefes.find((m) => Number(m.chefe_id) === Number(chefeId)) || null;
  }

  function visitsForMember(jovemId) {
    return state.visitasProximoRamo
      .filter((v) => Number(v.jovem_id) === Number(jovemId))
      .sort((a, b) => String(a.data_visita).localeCompare(String(b.data_visita)));
  }

  function canManageJourney(member) {
    if (!member || !state.profile) return false;
    if (state.profile.tipo === 'administrador') return true;
    if (state.profile.acesso_geral_consulta || state.profile.tipo !== 'chefia') return false;
    return state.ownChiefSectionIds.includes(Number(member.secao?.id || member.secao_id));
  }

  function renderMemberTeamOptions(selectedId = '') {
    const secaoId = Number(memberSecao.value || 0);
    if (!sectionSupportsTeam(secaoId)) {
      memberEquipeWrap.classList.add('hidden');
      memberEquipe.innerHTML = '<option value="">Sem equipe definida</option>';
      return;
    }
    const label = teamLabelForSection(secaoId);
    memberEquipeLabel.textContent = label;
    memberEquipeWrap.classList.remove('hidden');
    const teams = state.equipes.filter((e) => Number(e.secao_id) === secaoId && e.ativo !== false);
    memberEquipe.innerHTML = `<option value="">Sem ${label.toLocaleLowerCase('pt-BR')} definida</option>${teams.map((e) => `<option value="${e.id}">${escapeHtml(e.nome)}</option>`).join('')}`;
    if (selectedId) memberEquipe.value = String(selectedId);
  }

  function detailValue(label, value, extraClass = '') {
    return `<div class="detail-value ${extraClass}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || '—')}</strong></div>`;
  }

  function renderMembers() {
    const search = normalizeText(memberSearch.value);
    const secaoId = memberSecaoFilter.value;
    let rows = memberRows();
    const canShowInactive = state.profile?.tipo === 'administrador' && memberShowInactive.checked;
    if (!canShowInactive) rows = rows.filter((m) => m.ativo !== false);
    if (secaoId) rows = rows.filter((m) => String(m.secao?.id || m.secao_id || '') === String(secaoId));
    if (search) rows = rows.filter((m) => normalizeText(m.nome_completo).includes(search));
    rows.sort((a, b) => (a.ramo?.ordem || 99) - (b.ramo?.ordem || 99) || (a.secao?.nome || '').localeCompare(b.secao?.nome || '', 'pt-BR') || a.nome_completo.localeCompare(b.nome_completo, 'pt-BR'));
    membersCount.textContent = String(rows.length);

    if (!rows.length) {
      membersList.innerHTML = `<div class="empty-members"><div>👥</div><strong>Nenhum jovem encontrado</strong><span>Altere os filtros ou cadastre um novo jovem.</span></div>`;
      return;
    }

    const groups = new Map();
    rows.forEach((m) => {
      const key = m.secao?.nome || 'Sem seção';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(m);
    });

    membersList.innerHTML = [...groups.entries()].map(([sectionName, members]) => `
      <section class="directory-group">
        <h3 class="directory-group-title">${escapeHtml(sectionName)}</h3>
        <div class="directory-list">
          ${members.map((m) => `<button class="directory-row ${m.ativo === false ? 'directory-row-inactive' : ''}" type="button" data-view-member="${m.id}"><span>${escapeHtml(m.nome_completo)}</span><span class="directory-arrow">›</span></button>`).join('')}
        </div>
      </section>`).join('');

    membersList.querySelectorAll('[data-view-member]').forEach((button) => {
      button.addEventListener('click', () => openMemberDetail(Number(button.dataset.viewMember)));
    });
  }

  async function loadMembersData() {
    membersMessage.textContent = 'Carregando jovens...';
    const [ramosRes, secoesRes, jovensRes, vinculosRes, responsaveisRes, equipesRes, equipeChefesRes, chefesRes, chefeSecoesRes, fichasRes, visitasRes] = await Promise.all([
      client.from('ramos').select('id,nome,ordem,ativo').eq('ativo', true).order('ordem'),
      client.from('secoes').select('id,nome,ramo_id,ativo').eq('ativo', true),
      client.from('jovens').select('id,nome_completo,registro_paxtu,validade_registro,data_nascimento,ramo_id,secao_id,ativo,data_acolhida,data_promessa_lobinho,data_promessa_escoteira,data_promessa_adulta,equipe_id,data_pode_iniciar_caminho,data_inicio_caminho,data_passagem_ramo,data_limite_passagem_ramo').order('nome_completo'),
      client.from('jovem_responsaveis').select('jovem_id,responsavel_id,parentesco,responsavel_principal'),
      client.from('responsaveis').select('id,nome_completo,registro_paxtu,telefone'),
      client.from('equipes').select('id,secao_id,nome,tipo,ativo').eq('ativo', true).order('nome'),
      client.from('equipe_chefes').select('equipe_id,chefe_id,papel'),
      client.from('chefes').select('id,nome_completo,registro_paxtu,data_nascimento,validade_registro,telefone,ativo,data_promessa_lobinho,data_promessa_escoteira,data_promessa_adulta').order('nome_completo'),
      client.from('chefe_secoes').select('chefe_id,secao_id'),
      client.from('fichas_medicas').select('id,jovem_id,tipo_sanguineo,alergias,medicamentos_uso_continuo,restricoes_alimentares,condicoes_relevantes,necessidades_especiais,plano_saude,numero_carteirinha,contato_emergencia_nome,contato_emergencia_telefone,observacoes,responsavel_confirmou,confirmado_em,atualizado_em'),
      client.from('visitas_proximo_ramo').select('id,jovem_id,secao_destino_id,data_visita,observacao,criado_em').order('data_visita')
    ]);
    const responses = [ramosRes, secoesRes, jovensRes, vinculosRes, responsaveisRes, equipesRes, equipeChefesRes, chefesRes, chefeSecoesRes, fichasRes, visitasRes];
    const firstError = responses.find((r) => r.error)?.error;
    if (firstError) {
      membersMessage.textContent = `Não foi possível carregar os jovens: ${firstError.message}`;
      return false;
    }
    state.ramos = ramosRes.data || [];
    state.secoes = secoesRes.data || [];
    state.jovens = jovensRes.data || [];
    state.vinculos = vinculosRes.data || [];
    state.responsaveis = responsaveisRes.data || [];
    state.equipes = equipesRes.data || [];
    state.equipeChefes = equipeChefesRes.data || [];
    state.chefes = chefesRes.data || [];
    state.chefeSecoes = chefeSecoesRes.data || [];
    state.fichasMedicas = fichasRes.data || [];
    state.visitasProximoRamo = visitasRes.data || [];
    state.ownChiefSectionIds = state.profile?.chefe_id
      ? state.chefeSecoes.filter((row) => Number(row.chefe_id) === Number(state.profile.chefe_id)).map((row) => Number(row.secao_id))
      : [];
    renderSecaoOptions();
    renderMembers();
    membersMessage.textContent = '';
    return true;
  }

  async function openMembersView() {
    showMembers();
    await loadMembersData();
  }

  function openMemberDialog(jovemId = null) {
    if (state.profile?.tipo !== 'administrador') return;
    memberForm.reset();
    memberFormMessage.textContent = '';
    memberActive.checked = true;
    memberId.value = '';
    memberDialogTitle.textContent = 'Novo jovem';
    removeMemberButton.classList.add('hidden');
    renderMemberTeamOptions('');
    if (jovemId) {
      const m = memberRows().find((item) => Number(item.id) === Number(jovemId));
      if (!m) return;
      memberDialogTitle.textContent = 'Editar jovem';
      memberId.value = String(m.id);
      memberName.value = m.nome_completo || '';
      memberRegistration.value = m.registro_paxtu || '';
      memberBirth.value = m.data_nascimento || '';
      memberRegistrationValidity.value = m.validade_registro || '';
      memberSecao.value = String(m.secao?.id || m.secao_id || '');
      renderMemberTeamOptions(m.equipe_id || '');
      memberAcolhida.value = m.data_acolhida || '';
      memberPromiseLobinho.value = m.data_promessa_lobinho || '';
      memberPromiseEscoteira.value = m.data_promessa_escoteira || '';
      memberPromiseAdulta.value = m.data_promessa_adulta || '';
      responsibleName.value = m.responsavel?.nome_completo || '';
      responsibleRegistration.value = m.responsavel?.registro_paxtu || '';
      responsiblePhone.value = m.responsavel?.telefone || '';
      memberActive.checked = Boolean(m.ativo);
      removeMemberButton.classList.remove('hidden');
      removeMemberButton.textContent = m.ativo ? 'Remover jovem' : 'Restaurar jovem';
      removeMemberButton.classList.toggle('restore-button', !m.ativo);
      removeMemberButton.classList.toggle('danger-button', Boolean(m.ativo));
    }
    memberDialog.showModal();
  }

  function closeMemberForm() {
    if (memberDialog.open) memberDialog.close();
  }

  async function insertResponsible(name, phone, registration) {
    const cleanName = (name || '').trim();
    const cleanPhone = (phone || '').trim();
    const phoneDigits = normalizePhone(cleanPhone);
    const reg = (registration || '').trim();

    const existing = state.responsaveis.find((r) =>
      (reg && normalizeText(r.registro_paxtu) === normalizeText(reg)) ||
      (normalizePhone(r.telefone) === phoneDigits && normalizeText(r.nome_completo) === normalizeText(cleanName))
    );

    if (existing) {
      const needsUpdate =
        normalizeText(existing.nome_completo) !== normalizeText(cleanName) ||
        normalizePhone(existing.telefone) !== phoneDigits ||
        normalizeText(existing.registro_paxtu) !== normalizeText(reg);

      if (needsUpdate) {
        const { error } = await client.from('responsaveis').update({
          nome_completo: cleanName,
          registro_paxtu: reg || null,
          telefone: cleanPhone
        }).eq('id', existing.id);
        if (error) throw error;

        existing.nome_completo = cleanName;
        existing.registro_paxtu = reg || null;
        existing.telefone = cleanPhone;
      }

      return { id: existing.id, created: false };
    }

    const { data, error } = await client.from('responsaveis').insert({
      nome_completo: cleanName,
      registro_paxtu: reg || null,
      telefone: cleanPhone
    }).select('id').single();
    if (error) throw error;
    return { id: data.id, created: true };
  }

  async function createMember(payload) {
    const responsible = await insertResponsible(payload.responsibleName, payload.responsiblePhone, payload.responsibleRegistration);
    const { data: young, error: youngError } = await client.from('jovens').insert({
      nome_completo: payload.name,
      registro_paxtu: payload.memberRegistration || null,
      validade_registro: payload.registrationValidity || null,
      data_nascimento: payload.birth,
      ramo_id: payload.ramoId,
      secao_id: payload.secaoId,
      equipe_id: payload.equipeId || null,
      data_acolhida: payload.acolhida || null,
      data_promessa_lobinho: payload.promiseLobinho || null,
      data_promessa_escoteira: payload.promiseEscoteira || null,
      data_promessa_adulta: payload.promiseAdulta || null,
      ativo: payload.active
    }).select('id').single();
    if (youngError) {
      if (responsible.created) await client.from('responsaveis').delete().eq('id', responsible.id);
      throw youngError;
    }
    const { error: linkError } = await client.from('jovem_responsaveis').insert({
      jovem_id: young.id,
      responsavel_id: responsible.id,
      parentesco: 'responsável',
      responsavel_principal: true
    });
    if (linkError) {
      await client.from('jovens').delete().eq('id', young.id);
      if (responsible.created) await client.from('responsaveis').delete().eq('id', responsible.id);
      throw linkError;
    }
  }

  async function updateMember(jovemId, payload) {
    const row = memberRows().find((m) => Number(m.id) === Number(jovemId));
    if (!row) throw new Error('Membro não encontrado.');
    const { error: youngError } = await client.from('jovens').update({
      nome_completo: payload.name,
      registro_paxtu: payload.memberRegistration || null,
      validade_registro: payload.registrationValidity || null,
      data_nascimento: payload.birth,
      ramo_id: payload.ramoId,
      secao_id: payload.secaoId,
      equipe_id: payload.equipeId || null,
      data_acolhida: payload.acolhida || null,
      data_promessa_lobinho: payload.promiseLobinho || null,
      data_promessa_escoteira: payload.promiseEscoteira || null,
      data_promessa_adulta: payload.promiseAdulta || null,
      ativo: payload.active
    }).eq('id', jovemId);
    if (youngError) throw youngError;

    const link = principalLink(jovemId);
    if (!link) {
      const responsible = await insertResponsible(payload.responsibleName, payload.responsiblePhone, payload.responsibleRegistration);
      const { error } = await client.from('jovem_responsaveis').insert({ jovem_id: jovemId, responsavel_id: responsible.id, parentesco: 'responsável', responsavel_principal: true });
      if (error) throw error;
      return;
    }

    const currentResp = state.responsaveis.find((r) => Number(r.id) === Number(link.responsavel_id));
    const changed = normalizeText(currentResp?.nome_completo) !== normalizeText(payload.responsibleName) || normalizePhone(currentResp?.telefone) !== normalizePhone(payload.responsiblePhone) || normalizeText(currentResp?.registro_paxtu) !== normalizeText(payload.responsibleRegistration);
    if (!changed) return;

    const sharedCount = state.vinculos.filter((v) => Number(v.responsavel_id) === Number(link.responsavel_id)).length;
    if (sharedCount > 1) {
      const nextResp = await insertResponsible(payload.responsibleName, payload.responsiblePhone, payload.responsibleRegistration);
      if (Number(nextResp.id) !== Number(link.responsavel_id)) {
        const { error: deleteError } = await client.from('jovem_responsaveis').delete().eq('jovem_id', jovemId).eq('responsavel_id', link.responsavel_id);
        if (deleteError) throw deleteError;
        const { error: insertError } = await client.from('jovem_responsaveis').insert({ jovem_id: jovemId, responsavel_id: nextResp.id, parentesco: link.parentesco || 'responsável', responsavel_principal: true });
        if (insertError) throw insertError;
      }
    } else {
      const { error } = await client.from('responsaveis').update({ nome_completo: payload.responsibleName, registro_paxtu: payload.responsibleRegistration || null, telefone: payload.responsiblePhone }).eq('id', link.responsavel_id);
      if (error) throw error;
    }
  }

  async function setMemberActive(jovemId, active) {
    const row = memberRows().find((m) => Number(m.id) === Number(jovemId));
    if (!row) throw new Error('Jovem não encontrado.');
    const { error } = await client.from('jovens').update({ ativo: active }).eq('id', jovemId);
    if (error) throw error;
  }

  async function toggleMemberRemoved() {
    if (state.profile?.tipo !== 'administrador' || !memberId.value) return;
    const id = Number(memberId.value);
    const row = memberRows().find((m) => Number(m.id) === id);
    if (!row) return;
    const nextActive = !row.ativo;
    const ok = window.confirm(nextActive
      ? `Restaurar ${row.nome_completo} na relação de jovens?`
      : `Remover ${row.nome_completo} do app?\n\nO histórico não será apagado e você poderá restaurar depois.`);
    if (!ok) return;
    removeMemberButton.disabled = true;
    try {
      await setMemberActive(id, nextActive);
      closeMemberForm();
      await loadMembersData();
      membersMessage.textContent = nextActive ? 'Jovem restaurado com sucesso.' : 'Jovem removido do app com sucesso.';
      window.setTimeout(() => { if (membersMessage.textContent.includes('sucesso')) membersMessage.textContent = ''; }, 3500);
    } catch (error) {
      memberFormMessage.textContent = `Não foi possível alterar o cadastro: ${error.message}`;
    } finally {
      removeMemberButton.disabled = false;
    }
  }

  memberForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.profile?.tipo !== 'administrador') return;
    memberFormMessage.textContent = '';
    const payload = {
      name: memberName.value.trim(),
      memberRegistration: memberRegistration.value.trim(),
      registrationValidity: memberRegistrationValidity.value,
      birth: memberBirth.value,
      secaoId: Number(memberSecao.value),
      ramoId: Number(state.secoes.find((s) => Number(s.id) === Number(memberSecao.value))?.ramo_id || 0),
      equipeId: Number(memberEquipe.value || 0) || null,
      acolhida: memberAcolhida.value,
      promiseLobinho: memberPromiseLobinho.value,
      promiseEscoteira: memberPromiseEscoteira.value,
      promiseAdulta: memberPromiseAdulta.value,
      responsibleName: responsibleName.value.trim(),
      responsibleRegistration: responsibleRegistration.value.trim(),
      responsiblePhone: responsiblePhone.value.trim(),
      active: memberActive.checked
    };
    if (!payload.name || !payload.birth || !payload.secaoId || !payload.ramoId || !payload.responsibleName || !normalizePhone(payload.responsiblePhone)) {
      memberFormMessage.textContent = 'Preencha todos os campos obrigatórios.';
      return;
    }
    saveMemberButton.disabled = true;
    saveMemberButton.textContent = 'Salvando...';
    try {
      if (memberId.value) await updateMember(Number(memberId.value), payload);
      else await createMember(payload);
      closeMemberForm();
      await loadMembersData();
      membersMessage.textContent = memberId.value ? 'Cadastro atualizado com sucesso.' : 'Jovem cadastrado com sucesso.';
      window.setTimeout(() => { if (membersMessage.textContent.includes('sucesso')) membersMessage.textContent = ''; }, 3500);
    } catch (error) {
      memberFormMessage.textContent = `Não foi possível salvar: ${error.message}`;
    } finally {
      saveMemberButton.disabled = false;
      saveMemberButton.textContent = 'Salvar jovem';
    }
  });

  function closeMemberDetail() {
    if (memberDetailDialog.open) memberDetailDialog.close();
  }

  function openMemberDetail(jovemId) {
    const m = memberRows().find((item) => Number(item.id) === Number(jovemId));
    if (!m) return;
    state.selectedMemberDetailId = Number(jovemId);
    memberDetailTitle.textContent = m.nome_completo;
    const regStatus = registrationStatus(m.validade_registro);
    const team = teamForMember(m);
    const teamLabel = teamLabelForSection(m.secao?.id || m.secao_id);
    const teamChiefs = team ? teamChiefsFor(team.id) : [];
    const med = medicalForMember(m.id);
    const visits = visitsForMember(m.id);
    const canManage = canManageJourney(m);
    const phone = m.responsavel?.telefone || '';
    const phoneHref = normalizePhone(phone);

    const medItems = [];
    if (med?.tipo_sanguineo) medItems.push(detailValue('Tipo sanguíneo', med.tipo_sanguineo));
    if (med?.alergias) medItems.push(detailValue('Alergias', med.alergias, 'wide'));
    if (med?.medicamentos_uso_continuo) medItems.push(detailValue('Medicamentos de uso contínuo', med.medicamentos_uso_continuo, 'wide'));
    if (med?.restricoes_alimentares) medItems.push(detailValue('Restrições alimentares', med.restricoes_alimentares, 'wide'));
    if (med?.condicoes_relevantes) medItems.push(detailValue('Condições relevantes', med.condicoes_relevantes, 'wide'));
    if (med?.necessidades_especiais) medItems.push(detailValue('Necessidades especiais', med.necessidades_especiais, 'wide'));
    if (med?.plano_saude) medItems.push(detailValue('Plano de saúde', med.plano_saude));
    if (med?.numero_carteirinha) medItems.push(detailValue('Carteirinha', med.numero_carteirinha));
    if (med?.contato_emergencia_nome || med?.contato_emergencia_telefone) medItems.push(detailValue('Contato de emergência', [med.contato_emergencia_nome, med.contato_emergencia_telefone].filter(Boolean).join(' • '), 'wide'));
    if (med?.observacoes) medItems.push(detailValue('Observações', med.observacoes, 'wide'));

    const visitHtml = visits.length
      ? visits.map((v) => {
          const destino = state.secoes.find((secao) => Number(secao.id) === Number(v.secao_destino_id));
          return `<div class="visit-row"><div><strong>${formatDateBR(v.data_visita)}</strong><span>${escapeHtml(destino?.nome || 'Próximo ramo')}</span>${v.observacao ? `<small>${escapeHtml(v.observacao)}</small>` : ''}</div>${canManage ? `<div class="mini-actions"><button type="button" data-edit-visit="${v.id}">Editar</button><button type="button" class="danger-text" data-delete-visit="${v.id}">Apagar</button></div>` : ''}</div>`;
        }).join('')
      : '<p class="detail-empty">Nenhuma visita registrada.</p>';

    memberDetailBody.innerHTML = `
      <div class="detail-status-row"><span class="registration-badge ${regStatus.cls}">${escapeHtml(regStatus.label)}</span>${m.ativo === false ? '<span class="status-badge inactive">Inativo</span>' : ''}</div>

      <section class="detail-card">
        <h3>Dados pessoais</h3>
        <div class="detail-grid">
          ${detailValue('Nascimento', formatDateBR(m.data_nascimento))}
          ${detailValue('Nº de registro', m.registro_paxtu || '—')}
          ${detailValue('Seção', m.secao?.nome || '—')}
          ${detailValue(teamLabel, team?.nome || 'Não definida')}
          ${detailValue('Data da acolhida', formatDateBR(m.data_acolhida))}
        </div>
        ${team ? `<div class="detail-subline"><span>Responsável(is) pela ${escapeHtml(teamLabel.toLocaleLowerCase('pt-BR'))}:</span><strong>${escapeHtml(teamChiefs.length ? teamChiefs.map((c) => c.nome_completo).join(', ') : 'Não definido')}</strong></div>` : ''}
      </section>

      <section class="detail-card">
        <h3>Histórico de promessas</h3>
        <div class="detail-grid">
          ${detailValue('Promessa de Lobinho', formatDateBR(m.data_promessa_lobinho))}
          ${detailValue('Promessa Escoteira', formatDateBR(m.data_promessa_escoteira))}
          ${detailValue('Promessa Adulta', formatDateBR(m.data_promessa_adulta))}
        </div>
      </section>

      <section class="detail-card">
        <h3>Responsável</h3>
        <div class="detail-grid">
          ${detailValue('Nome', m.responsavel?.nome_completo || '—', 'wide')}
          ${detailValue('Nº de registro', m.responsavel?.registro_paxtu || '—')}
          <div class="detail-value"><span>Telefone</span><strong>${phone ? `<a href="tel:${phoneHref}">${escapeHtml(phone)}</a>` : '—'}</strong></div>
        </div>
      </section>

      <section class="detail-card">
        <div class="detail-card-heading"><h3>Caminho e passagem de ramo</h3>${canManage ? '<button type="button" class="mini-primary" data-edit-journey="1">Editar / limpar datas</button>' : ''}</div>
        <div class="detail-grid">
          ${detailValue('Pode iniciar o Caminho', formatDateBR(m.data_pode_iniciar_caminho))}
          ${detailValue('Início do Caminho', formatDateBR(m.data_inicio_caminho))}
          ${detailValue('Passagem de ramo', formatDateBR(m.data_passagem_ramo))}
          ${detailValue('Data limite para passagem', formatDateBR(m.data_limite_passagem_ramo))}
        </div>
        <div class="detail-card-heading visits-heading"><h4>Visitas ao próximo ramo</h4>${canManage ? '<button type="button" class="mini-primary" data-add-visit="1">＋ Registrar visita</button>' : ''}</div>
        <div class="visits-list">${visitHtml}</div>
      </section>

      <section class="detail-card medical-card">
        <div class="detail-card-heading"><h3>Ficha médica</h3>${state.profile?.tipo === 'administrador' ? '<button type="button" class="mini-primary medical-edit-button" data-edit-medical="1">Editar ficha médica</button>' : ''}</div>
        <p class="medical-note">Dados sensíveis • consulta conforme as permissões do seu perfil.</p>
        ${medItems.length ? `<div class="detail-grid">${medItems.join('')}</div>${med?.atualizado_em ? `<p class="medical-updated">Última atualização: ${escapeHtml(formatDateTimeBR(med.atualizado_em))}</p>` : ''}` : '<p class="detail-empty">Ficha médica ainda não cadastrada.</p>'}
      </section>
    `;

    memberDetailAdminActions.classList.toggle('hidden', state.profile?.tipo !== 'administrador');
    memberDetailBody.querySelector('[data-edit-journey]')?.addEventListener('click', () => openJourneyDialog(m.id));
    memberDetailBody.querySelector('[data-add-visit]')?.addEventListener('click', () => openVisitDialog(m.id));
    memberDetailBody.querySelectorAll('[data-edit-visit]').forEach((button) => button.addEventListener('click', () => openVisitDialog(m.id, Number(button.dataset.editVisit))));
    memberDetailBody.querySelectorAll('[data-delete-visit]').forEach((button) => button.addEventListener('click', () => deleteVisit(Number(button.dataset.deleteVisit), m.id)));
    memberDetailBody.querySelector('[data-edit-medical]')?.addEventListener('click', () => openMedicalDialog(m.id));
    if (!memberDetailDialog.open) memberDetailDialog.showModal();
  }

  function openMedicalDialog(jovemId) {
    if (state.profile?.tipo !== 'administrador') return;
    const member = memberRows().find((item) => Number(item.id) === Number(jovemId));
    if (!member) return;
    const med = medicalForMember(jovemId);
    medicalMemberId.value = String(jovemId);
    medicalMemberName.textContent = member.nome_completo;
    medicalBloodType.value = med?.tipo_sanguineo || '';
    medicalAllergies.value = med?.alergias || '';
    medicalContinuousMedication.value = med?.medicamentos_uso_continuo || '';
    medicalFoodRestrictions.value = med?.restricoes_alimentares || '';
    medicalRelevantConditions.value = med?.condicoes_relevantes || '';
    medicalSpecialNeeds.value = med?.necessidades_especiais || '';
    medicalHealthPlan.value = med?.plano_saude || '';
    medicalCardNumber.value = med?.numero_carteirinha || '';
    medicalEmergencyName.value = med?.contato_emergencia_nome || '';
    medicalEmergencyPhone.value = med?.contato_emergencia_telefone || '';
    medicalObservations.value = med?.observacoes || '';
    medicalFormMessage.textContent = '';
    deleteMedicalButton.classList.toggle('hidden', !med);
    if (!medicalDialog.open) medicalDialog.showModal();
  }

  function closeMedicalForm() {
    if (medicalDialog.open) medicalDialog.close();
  }

  async function refreshMedicalMember(jovemId) {
    await loadMembersData();
    if (state.selectedMemberDetailId === Number(jovemId)) openMemberDetail(jovemId);
  }

  async function deleteMedicalRecord() {
    const jovemId = Number(medicalMemberId.value || 0);
    if (!jovemId || state.profile?.tipo !== 'administrador') return;
    const member = memberRows().find((item) => Number(item.id) === jovemId);
    if (!window.confirm(`Apagar toda a ficha médica de ${member?.nome_completo || 'este jovem'}?\n\nEsta ação removerá os dados médicos cadastrados. Para vídeos de demonstração, você poderá cadastrar novamente depois.`)) return;
    deleteMedicalButton.disabled = true;
    medicalFormMessage.textContent = 'Apagando...';
    try {
      const { error } = await client.from('fichas_medicas').delete().eq('jovem_id', jovemId);
      if (error) throw error;
      closeMedicalForm();
      await refreshMedicalMember(jovemId);
      membersMessage.textContent = 'Ficha médica apagada com sucesso.';
      window.setTimeout(() => { if (membersMessage.textContent.includes('apagada')) membersMessage.textContent = ''; }, 3500);
    } catch (error) {
      medicalFormMessage.textContent = `Não foi possível apagar: ${error.message}`;
    } finally {
      deleteMedicalButton.disabled = false;
    }
  }

  function closeChiefDetail() {
    if (chiefDetailDialog.open) chiefDetailDialog.close();
  }

  function openChiefDetail(chefeId) {
    const c = chiefRows().find((item) => Number(item.id) === Number(chefeId));
    if (!c) return;
    state.selectedChiefDetailId = Number(chefeId);
    chiefDetailTitle.textContent = c.nome_completo;
    const limited = state.profile?.tipo === 'responsavel';
    const regStatus = registrationStatus(c.validade_registro);
    const teams = teamsForChief(c.id);
    const phoneHref = normalizePhone(c.telefone);
    const functions = c.funcoes.length ? c.funcoes.map((f) => `<span class="detail-chip">${escapeHtml(f)}</span>`).join('') : '<span class="detail-chip muted">Função não informada</span>';
    const sections = c.secoes.length ? c.secoes.map((secao) => `<span class="detail-chip">${escapeHtml(secao.nome)}</span>`).join('') : '<span class="detail-chip muted">Sem seção</span>';
    const teamRows = teams.length ? teams.map((team) => {
      const secao = state.secoes.find((s) => Number(s.id) === Number(team.secao_id));
      return `<div class="detail-subline"><span>${escapeHtml(teamLabelForSection(team.secao_id))}</span><strong>${escapeHtml(team.nome)}${secao ? ` • ${escapeHtml(secao.nome)}` : ''}</strong></div>`;
    }).join('') : '<p class="detail-empty">Nenhuma matilha/patrulha vinculada.</p>';
    const med = medicalForChief(c.id);
    const medItems = [];
    if (med?.tipo_sanguineo) medItems.push(detailValue('Tipo sanguíneo', med.tipo_sanguineo));
    if (med?.alergias) medItems.push(detailValue('Alergias', med.alergias, 'wide'));
    if (med?.medicamentos_uso_continuo) medItems.push(detailValue('Medicamentos', med.medicamentos_uso_continuo, 'wide'));
    if (med?.restricoes_alimentares) medItems.push(detailValue('Restrições alimentares', med.restricoes_alimentares, 'wide'));
    if (med?.condicoes_relevantes) medItems.push(detailValue('Condições relevantes', med.condicoes_relevantes, 'wide'));
    if (med?.necessidades_especiais) medItems.push(detailValue('Necessidades especiais / equipamentos', med.necessidades_especiais, 'wide'));
    if (med?.plano_saude) medItems.push(detailValue('Plano / médico de preferência', med.plano_saude, 'wide'));
    if (med?.numero_carteirinha) medItems.push(detailValue('Carteirinha / documento', med.numero_carteirinha));
    if (med?.contato_emergencia_nome || med?.contato_emergencia_telefone) medItems.push(detailValue('Contato de emergência', [med.contato_emergencia_nome, med.contato_emergencia_telefone].filter(Boolean).join(' • '), 'wide'));
    if (med?.observacoes) medItems.push(detailValue('Observações', med.observacoes, 'wide'));

    chiefDetailBody.innerHTML = `
      ${limited ? '' : `<div class="detail-status-row"><span class="registration-badge ${regStatus.cls}">${escapeHtml(regStatus.label)}</span>${c.ativo === false ? '<span class="status-badge inactive">Inativo</span>' : ''}</div>`}
      <section class="detail-card">
        <h3>Funções e seções</h3>
        <div class="detail-chip-row">${functions}</div>
        <div class="detail-chip-row">${sections}</div>
      </section>
      <section class="detail-card">
        <h3>Contato</h3>
        <div class="detail-grid">
          <div class="detail-value wide"><span>Telefone</span><strong>${c.telefone ? `<a href="tel:${phoneHref}">${escapeHtml(c.telefone)}</a>` : '—'}</strong></div>
          ${limited ? '' : `${detailValue('Nascimento', formatDateBR(c.data_nascimento))}${detailValue('Nº de registro', c.registro_paxtu || '—')}`}
        </div>
      </section>
      ${limited ? '' : `<section class="detail-card"><h3>Histórico de promessas</h3><div class="detail-grid">${detailValue('Promessa de Lobinho', formatDateBR(c.data_promessa_lobinho))}${detailValue('Promessa Escoteira', formatDateBR(c.data_promessa_escoteira))}${detailValue('Promessa Adulta', formatDateBR(c.data_promessa_adulta))}</div></section>`}
      ${limited ? '' : `<section class="detail-card"><h3>Matilhas / Patrulhas sob responsabilidade</h3>${teamRows}</section>`}
      ${limited ? '' : `<section class="detail-card medical-card"><div class="detail-card-heading"><h3>Ficha médica</h3>${state.profile?.tipo === 'administrador' ? '<button type="button" class="mini-primary medical-edit-button" data-edit-chief-medical="1">Editar ficha médica</button>' : ''}</div><p class="medical-note">Dados sensíveis • disponíveis apenas para a equipe interna autorizada. Responsáveis não visualizam estes dados.</p>${medItems.length ? `<div class="detail-grid">${medItems.join('')}</div>${med?.atualizado_em ? `<p class="medical-updated">Última atualização: ${escapeHtml(formatDateTimeBR(med.atualizado_em))}</p>` : ''}` : '<p class="detail-empty">Ficha médica ainda não cadastrada.</p>'}</section>`}
    `;
    chiefDetailAdminActions.classList.toggle('hidden', state.profile?.tipo !== 'administrador');
    chiefDetailBody.querySelector('[data-edit-chief-medical]')?.addEventListener('click', () => openChiefMedicalDialog(c.id));
    if (!chiefDetailDialog.open) chiefDetailDialog.showModal();
  }

  function openChiefMedicalDialog(chefeId) {
    if (state.profile?.tipo !== 'administrador') return;
    const chief = chiefRows().find((item) => Number(item.id) === Number(chefeId));
    if (!chief) return;
    const med = medicalForChief(chefeId);
    chiefMedicalChiefId.value = String(chefeId);
    chiefMedicalChiefName.textContent = chief.nome_completo;
    chiefMedicalBloodType.value = med?.tipo_sanguineo || '';
    chiefMedicalAllergies.value = med?.alergias || '';
    chiefMedicalContinuousMedication.value = med?.medicamentos_uso_continuo || '';
    chiefMedicalFoodRestrictions.value = med?.restricoes_alimentares || '';
    chiefMedicalRelevantConditions.value = med?.condicoes_relevantes || '';
    chiefMedicalSpecialNeeds.value = med?.necessidades_especiais || '';
    chiefMedicalHealthPlan.value = med?.plano_saude || '';
    chiefMedicalCardNumber.value = med?.numero_carteirinha || '';
    chiefMedicalEmergencyName.value = med?.contato_emergencia_nome || '';
    chiefMedicalEmergencyPhone.value = med?.contato_emergencia_telefone || '';
    chiefMedicalObservations.value = med?.observacoes || '';
    chiefMedicalFormMessage.textContent = '';
    deleteChiefMedicalButton.classList.toggle('hidden', !med);
    if (!chiefMedicalDialog.open) chiefMedicalDialog.showModal();
  }

  function closeChiefMedicalForm() {
    if (chiefMedicalDialog.open) chiefMedicalDialog.close();
  }

  async function refreshChiefMedical(chefeId) {
    await loadChiefsData();
    if (state.selectedChiefDetailId === Number(chefeId)) openChiefDetail(chefeId);
  }

  async function deleteChiefMedicalRecord() {
    const chefeId = Number(chiefMedicalChiefId.value || 0);
    if (!chefeId || state.profile?.tipo !== 'administrador') return;
    const chief = chiefRows().find((item) => Number(item.id) === chefeId);
    if (!window.confirm(`Apagar toda a ficha médica de ${chief?.nome_completo || 'este adulto'}?

Esta ação removerá os dados médicos cadastrados.`)) return;
    deleteChiefMedicalButton.disabled = true;
    chiefMedicalFormMessage.textContent = 'Apagando...';
    try {
      const { error } = await client.from('fichas_medicas_chefes').delete().eq('chefe_id', chefeId);
      if (error) throw error;
      closeChiefMedicalForm();
      await refreshChiefMedical(chefeId);
      chiefsMessage.textContent = 'Ficha médica do adulto apagada com sucesso.';
      window.setTimeout(() => { if (chiefsMessage.textContent.includes('apagada')) chiefsMessage.textContent = ''; }, 3500);
    } catch (error) {
      chiefMedicalFormMessage.textContent = `Não foi possível apagar: ${error.message}`;
    } finally {
      deleteChiefMedicalButton.disabled = false;
    }
  }

  function openJourneyDialog(jovemId) {
    const m = memberRows().find((item) => Number(item.id) === Number(jovemId));
    if (!m || !canManageJourney(m)) return;
    journeyForm.reset();
    journeyMessage.textContent = '';
    journeyMemberId.value = String(m.id);
    journeyMemberName.textContent = m.nome_completo;
    journeyCanStart.value = m.data_pode_iniciar_caminho || '';
    journeyStart.value = m.data_inicio_caminho || '';
    journeyPassage.value = m.data_passagem_ramo || '';
    journeyLimit.value = m.data_limite_passagem_ramo || '';
    journeyDialog.showModal();
  }

  function closeJourneyForm() {
    if (journeyDialog.open) journeyDialog.close();
  }

  async function saveJourneyValues(jovemId, values) {
    const { error } = await client.rpc('salvar_caminho_passagem', {
      p_jovem_id: jovemId,
      p_data_pode_iniciar_caminho: values.canStart || null,
      p_data_inicio_caminho: values.start || null,
      p_data_passagem_ramo: values.passage || null,
      p_data_limite_passagem_ramo: values.limit || null
    });
    if (error) throw error;
  }

  async function refreshMemberDetail(jovemId) {
    await loadMembersData();
    if (memberDetailDialog.open) openMemberDetail(jovemId);
  }

  async function clearJourneyDates() {
    const jovemId = Number(journeyMemberId.value || 0);
    if (!jovemId) return;
    if (!window.confirm('Apagar todas as datas de Caminho e passagem deste jovem?')) return;
    clearJourneyButton.disabled = true;
    try {
      await saveJourneyValues(jovemId, { canStart: '', start: '', passage: '', limit: '' });
      closeJourneyForm();
      await refreshMemberDetail(jovemId);
    } catch (error) {
      journeyMessage.textContent = `Não foi possível apagar as datas: ${error.message}`;
    } finally {
      clearJourneyButton.disabled = false;
    }
  }

  function renderVisitDestinations(selected = '') {
    visitDestination.innerHTML = `<option value="">Selecione</option>${sortedSections().map((s) => `<option value="${s.id}">${escapeHtml(s.nome)}</option>`).join('')}`;
    if (selected) visitDestination.value = String(selected);
  }

  function openVisitDialog(jovemId, visitaId = null) {
    const m = memberRows().find((item) => Number(item.id) === Number(jovemId));
    if (!m || !canManageJourney(m)) return;
    visitForm.reset();
    visitMessage.textContent = '';
    visitMemberId.value = String(jovemId);
    visitId.value = '';
    visitDialogTitle.textContent = 'Nova visita';
    deleteVisitButton.classList.add('hidden');
    renderVisitDestinations('');
    if (visitaId) {
      const visita = state.visitasProximoRamo.find((v) => Number(v.id) === Number(visitaId));
      if (!visita) return;
      visitId.value = String(visita.id);
      visitDialogTitle.textContent = 'Editar visita';
      visitDate.value = visita.data_visita || '';
      renderVisitDestinations(visita.secao_destino_id || '');
      visitObservation.value = visita.observacao || '';
      deleteVisitButton.classList.remove('hidden');
    }
    visitDialog.showModal();
  }

  function closeVisitForm() {
    if (visitDialog.open) visitDialog.close();
  }

  async function deleteVisit(visitaId, jovemId = null) {
    const visita = state.visitasProximoRamo.find((v) => Number(v.id) === Number(visitaId));
    const targetMemberId = Number(jovemId || visita?.jovem_id || visitMemberId.value || 0);
    if (!visitaId || !targetMemberId) return;
    if (!window.confirm('Apagar este registro de visita ao próximo ramo?')) return;
    const { error } = await client.rpc('excluir_visita_proximo_ramo', { p_visita_id: Number(visitaId) });
    if (error) {
      visitMessage.textContent = `Não foi possível apagar a visita: ${error.message}`;
      return;
    }
    closeVisitForm();
    await refreshMemberDetail(targetMemberId);
  }

  function eligibleTeamSections() {
    return sortedSections().filter((s) => sectionSupportsTeam(s.id));
  }

  function resetTeamForm() {
    teamForm.reset();
    teamId.value = '';
    teamFormMessage.textContent = '';
    deleteTeamButton.classList.add('hidden');
    teamSection.innerHTML = `<option value="">Selecione</option>${eligibleTeamSections().map((s) => `<option value="${s.id}">${escapeHtml(s.nome)} — ${escapeHtml(teamLabelForSection(s.id))}</option>`).join('')}`;
    renderTeamChiefOptions();
  }

  function renderTeamChiefOptions(selectedIds = []) {
    const secaoId = Number(teamSection.value || 0);
    const allowedChiefIds = state.chefeSecoes.filter((row) => Number(row.secao_id) === secaoId).map((row) => Number(row.chefe_id));
    const chiefs = state.chefes.filter((c) => c.ativo !== false && allowedChiefIds.includes(Number(c.id)));
    const selected = new Set(selectedIds.map(Number));
    teamChiefOptions.innerHTML = chiefs.length
      ? chiefs.map((c) => `<label class="section-check"><input type="checkbox" value="${c.id}" ${selected.has(Number(c.id)) ? 'checked' : ''}/><span><strong>${escapeHtml(c.nome_completo)}</strong><small>Chefia da seção</small></span></label>`).join('')
      : '<p class="detail-empty">Nenhum chefe/assistente está vinculado a esta seção.</p>';
  }

  function renderTeamList() {
    const teams = [...state.equipes].sort((a, b) => {
      const sa = state.secoes.find((s) => Number(s.id) === Number(a.secao_id));
      const sb = state.secoes.find((s) => Number(s.id) === Number(b.secao_id));
      return (sa?.nome || '').localeCompare(sb?.nome || '', 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR');
    });
    teamList.innerHTML = teams.length ? teams.map((team) => {
      const secao = state.secoes.find((s) => Number(s.id) === Number(team.secao_id));
      const chiefs = teamChiefsFor(team.id);
      return `<button class="team-list-row" type="button" data-edit-team="${team.id}"><div><strong>${escapeHtml(team.nome)}</strong><span>${escapeHtml(teamLabelForSection(team.secao_id))} • ${escapeHtml(secao?.nome || '')}</span><small>${escapeHtml(chiefs.length ? chiefs.map((c) => c.nome_completo).join(', ') : 'Sem responsável definido')}</small></div><span>›</span></button>`;
    }).join('') : '<p class="detail-empty">Nenhuma matilha ou patrulha cadastrada.</p>';
    teamList.querySelectorAll('[data-edit-team]').forEach((button) => button.addEventListener('click', () => editTeam(Number(button.dataset.editTeam))));
  }

  function openTeamManager() {
    if (state.profile?.tipo !== 'administrador') return;
    resetTeamForm();
    renderTeamList();
    teamDialog.showModal();
  }

  function closeTeamManager() {
    if (teamDialog.open) teamDialog.close();
  }

  function editTeam(id) {
    const team = state.equipes.find((e) => Number(e.id) === Number(id));
    if (!team) return;
    teamId.value = String(team.id);
    teamSection.value = String(team.secao_id);
    teamName.value = team.nome || '';
    const selectedChiefIds = state.equipeChefes.filter((row) => Number(row.equipe_id) === Number(team.id)).map((row) => Number(row.chefe_id));
    renderTeamChiefOptions(selectedChiefIds);
    deleteTeamButton.classList.remove('hidden');
    teamFormMessage.textContent = '';
  }

  async function reloadTeamManagerData() {
    const [equipesRes, equipeChefesRes] = await Promise.all([
      client.from('equipes').select('id,secao_id,nome,tipo,ativo').eq('ativo', true).order('nome'),
      client.from('equipe_chefes').select('equipe_id,chefe_id,papel')
    ]);
    if (equipesRes.error) throw equipesRes.error;
    if (equipeChefesRes.error) throw equipeChefesRes.error;
    state.equipes = equipesRes.data || [];
    state.equipeChefes = equipeChefesRes.data || [];
    renderTeamList();
  }

  function chiefFunctionsFor(chefeId) {
    return state.chefeFuncoes
      .filter((row) => Number(row.chefe_id) === Number(chefeId))
      .map((row) => row.funcao)
      .filter(Boolean);
  }

  function chiefSectionsFor(chefeId) {
    const ids = state.chefeSecoes
      .filter((row) => Number(row.chefe_id) === Number(chefeId))
      .map((row) => Number(row.secao_id));
    return state.secoes.filter((s) => ids.includes(Number(s.id)));
  }

  function chiefRows() {
    const ramoMap = new Map(state.ramos.map((r) => [Number(r.id), r]));
    return state.chefes.map((c) => ({
      ...c,
      funcoes: chiefFunctionsFor(c.id),
      secoes: chiefSectionsFor(c.id).map((secao) => ({ ...secao, ramo: ramoMap.get(Number(secao.ramo_id)) || null }))
    }));
  }

  function renderChiefSectionSelectors() {
    let available = state.secoes.filter((s) => s.ativo !== false);
    if (state.profile?.tipo === 'responsavel') {
      const allowedIds = new Set(state.chefeSecoes.map((row) => Number(row.secao_id)));
      available = available.filter((s) => allowedIds.has(Number(s.id)));
    }
    available.sort((a, b) => {
      const ra = state.ramos.find((r) => Number(r.id) === Number(a.ramo_id));
      const rb = state.ramos.find((r) => Number(r.id) === Number(b.ramo_id));
      return (ra?.ordem || 99) - (rb?.ordem || 99) || a.nome.localeCompare(b.nome, 'pt-BR');
    });
    chiefSecaoFilter.innerHTML = `<option value="">Todas</option>${available.map((s) => `<option value="${s.id}">${escapeHtml(s.nome)}</option>`).join('')}`;
    chiefSectionsOptions.innerHTML = state.secoes.filter((s) => s.ativo !== false).map((s) => {
      const ramo = state.ramos.find((r) => Number(r.id) === Number(s.ramo_id));
      return `<label class="section-check"><input type="checkbox" value="${s.id}" /> <span><strong>${escapeHtml(s.nome)}</strong><small>${escapeHtml(ramo?.nome || '')}</small></span></label>`;
    }).join('');
  }

  function renderChiefs() {
    const search = normalizeText(chiefSearch.value);
    const secaoId = chiefSecaoFilter.value;
    let rows = chiefRows();
    const canShowInactive = state.profile?.tipo === 'administrador' && chiefShowInactive.checked;
    if (!canShowInactive) rows = rows.filter((c) => c.ativo !== false);
    if (secaoId) rows = rows.filter((c) => c.secoes.some((s) => String(s.id) === String(secaoId)));
    if (search) rows = rows.filter((c) => normalizeText(c.nome_completo).includes(search));
    rows.sort((a, b) => a.nome_completo.localeCompare(b.nome_completo, 'pt-BR'));
    chiefsCount.textContent = String(rows.length);

    if (!rows.length) {
      chiefsList.innerHTML = `<div class="empty-members"><div>🧑‍🏫</div><strong>Nenhum chefe encontrado</strong><span>Altere os filtros ou cadastre um novo chefe.</span></div>`;
      return;
    }

    chiefsList.innerHTML = `<div class="directory-list">${rows.map((c) => `<button class="directory-row ${c.ativo === false ? 'directory-row-inactive' : ''}" type="button" data-view-chief="${c.id}"><span>${escapeHtml(c.nome_completo)}</span><span class="directory-arrow">›</span></button>`).join('')}</div>`;
    chiefsList.querySelectorAll('[data-view-chief]').forEach((button) => {
      button.addEventListener('click', () => openChiefDetail(Number(button.dataset.viewChief)));
    });
  }

  async function loadChiefsData() {
    chiefsMessage.textContent = 'Carregando chefia...';
    const [ramosRes, secoesRes, chefesRes, funcoesRes, secoesChefesRes, equipesRes, equipeChefesRes, fichasChefesRes] = await Promise.all([
      client.from('ramos').select('id,nome,ordem,ativo').order('ordem'),
      client.from('secoes').select('id,nome,ramo_id,ativo').order('nome'),
      client.from('chefes').select('id,nome_completo,registro_paxtu,data_nascimento,validade_registro,telefone,ativo,data_promessa_lobinho,data_promessa_escoteira,data_promessa_adulta').order('nome_completo'),
      client.from('chefe_funcoes').select('id,chefe_id,funcao'),
      client.from('chefe_secoes').select('chefe_id,secao_id'),
      client.from('equipes').select('id,secao_id,nome,tipo,ativo').eq('ativo', true).order('nome'),
      client.from('equipe_chefes').select('equipe_id,chefe_id,papel'),
      client.from('fichas_medicas_chefes').select('id,chefe_id,tipo_sanguineo,alergias,medicamentos_uso_continuo,restricoes_alimentares,condicoes_relevantes,necessidades_especiais,plano_saude,numero_carteirinha,contato_emergencia_nome,contato_emergencia_telefone,observacoes,atualizado_em')
    ]);
    const firstError = [ramosRes, secoesRes, chefesRes, funcoesRes, secoesChefesRes, equipesRes, equipeChefesRes, fichasChefesRes].find((r) => r.error)?.error;
    if (firstError) {
      chiefsMessage.textContent = `Não foi possível carregar a chefia: ${firstError.message}`;
      return;
    }
    state.ramos = ramosRes.data || [];
    state.secoes = secoesRes.data || [];
    state.chefes = chefesRes.data || [];
    state.chefeFuncoes = funcoesRes.data || [];
    state.chefeSecoes = secoesChefesRes.data || [];
    state.equipes = equipesRes.data || [];
    state.equipeChefes = equipeChefesRes.data || [];
    state.fichasMedicasChefes = fichasChefesRes.data || [];
    renderChiefSectionSelectors();
    renderChiefs();
    chiefsMessage.textContent = '';
  }

  async function openChiefsView() {
    showChiefs();
    await loadChiefsData();
  }

  function selectedChiefSectionIds() {
    return [...chiefSectionsOptions.querySelectorAll('input[type="checkbox"]:checked')].map((el) => Number(el.value));
  }

  function parsedChiefFunctions() {
    const seen = new Set();
    return chiefFunctions.value.split(/\n|;/).map((v) => v.trim()).filter((v) => {
      const key = normalizeText(v);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function openChiefDialog(chefeId = null) {
    if (state.profile?.tipo !== 'administrador') return;
    chiefForm.reset();
    chiefFormMessage.textContent = '';
    chiefActive.checked = true;
    chiefId.value = '';
    chiefDialogTitle.textContent = 'Novo chefe';
    removeChiefButton.classList.add('hidden');
    removeChiefButton.classList.remove('restore-button');
    removeChiefButton.classList.add('danger-button');
    renderChiefSectionSelectors();

    if (chefeId) {
      const c = chiefRows().find((item) => Number(item.id) === Number(chefeId));
      if (!c) return;
      chiefDialogTitle.textContent = 'Editar chefe';
      chiefId.value = String(c.id);
      chiefName.value = c.nome_completo || '';
      chiefRegistration.value = c.registro_paxtu || '';
      chiefRegistrationValidity.value = c.validade_registro || '';
      chiefBirth.value = c.data_nascimento || '';
      chiefPhone.value = c.telefone || '';
      chiefPromiseLobinho.value = c.data_promessa_lobinho || '';
      chiefPromiseEscoteira.value = c.data_promessa_escoteira || '';
      chiefPromiseAdulta.value = c.data_promessa_adulta || '';
      chiefFunctions.value = c.funcoes.join('\n');
      chiefActive.checked = Boolean(c.ativo);
      const selected = new Set(c.secoes.map((s) => Number(s.id)));
      chiefSectionsOptions.querySelectorAll('input[type="checkbox"]').forEach((el) => {
        el.checked = selected.has(Number(el.value));
      });
      const isSelfAdmin = state.profile?.tipo === 'administrador' && Number(state.profile?.chefe_id) === Number(c.id);
      if (!isSelfAdmin) {
        removeChiefButton.classList.remove('hidden');
        removeChiefButton.textContent = c.ativo ? 'Remover chefe' : 'Restaurar chefe';
        removeChiefButton.classList.toggle('restore-button', !c.ativo);
        removeChiefButton.classList.toggle('danger-button', Boolean(c.ativo));
      }
    }
    chiefDialog.showModal();
  }

  function closeChiefForm() {
    if (chiefDialog.open) chiefDialog.close();
  }

  async function createChief(payload) {
    const { data, error } = await client.from('chefes').insert({
      nome_completo: payload.name,
      registro_paxtu: payload.registration || null,
      data_nascimento: payload.birth,
      validade_registro: payload.validity,
      telefone: payload.phone,
      data_promessa_lobinho: payload.promiseLobinho || null,
      data_promessa_escoteira: payload.promiseEscoteira || null,
      data_promessa_adulta: payload.promiseAdulta || null,
      ativo: payload.active
    }).select('id').single();
    if (error) throw error;
    try {
      if (payload.functions.length) {
        const { error: fnError } = await client.from('chefe_funcoes').insert(payload.functions.map((funcao) => ({ chefe_id: data.id, funcao })));
        if (fnError) throw fnError;
      }
      if (payload.sectionIds.length) {
        const { error: secError } = await client.from('chefe_secoes').insert(payload.sectionIds.map((secao_id) => ({ chefe_id: data.id, secao_id })));
        if (secError) throw secError;
      }
    } catch (err) {
      await client.from('chefes').delete().eq('id', data.id);
      throw err;
    }
  }

  async function updateChief(id, payload) {
    const { error } = await client.from('chefes').update({
      nome_completo: payload.name,
      registro_paxtu: payload.registration || null,
      data_nascimento: payload.birth,
      validade_registro: payload.validity,
      telefone: payload.phone,
      data_promessa_lobinho: payload.promiseLobinho || null,
      data_promessa_escoteira: payload.promiseEscoteira || null,
      data_promessa_adulta: payload.promiseAdulta || null,
      ativo: payload.active,
      atualizado_em: new Date().toISOString()
    }).eq('id', id);
    if (error) throw error;

    const { error: delFnError } = await client.from('chefe_funcoes').delete().eq('chefe_id', id);
    if (delFnError) throw delFnError;
    const { error: delSecError } = await client.from('chefe_secoes').delete().eq('chefe_id', id);
    if (delSecError) throw delSecError;

    if (payload.functions.length) {
      const { error: fnError } = await client.from('chefe_funcoes').insert(payload.functions.map((funcao) => ({ chefe_id: id, funcao })));
      if (fnError) throw fnError;
    }
    if (payload.sectionIds.length) {
      const { error: secError } = await client.from('chefe_secoes').insert(payload.sectionIds.map((secao_id) => ({ chefe_id: id, secao_id })));
      if (secError) throw secError;
    }
  }

  async function toggleChiefRemoved() {
    if (state.profile?.tipo !== 'administrador' || !chiefId.value) return;
    const id = Number(chiefId.value);
    const row = chiefRows().find((c) => Number(c.id) === id);
    if (!row) return;
    if (Number(state.profile?.chefe_id) === id) {
      chiefFormMessage.textContent = 'Seu próprio cadastro de administrador não pode ser removido por esta tela.';
      return;
    }
    const nextActive = !row.ativo;
    const ok = window.confirm(nextActive
      ? `Restaurar ${row.nome_completo} na relação da chefia?`
      : `Remover ${row.nome_completo} do app?\n\nO cadastro e o histórico serão preservados. Se essa pessoa possuir login, o acesso também será bloqueado.`);
    if (!ok) return;
    removeChiefButton.disabled = true;
    try {
      const { error } = await client.rpc('admin_definir_chefe_ativo', { p_chefe_id: id, p_ativo: nextActive });
      if (error) throw error;
      closeChiefForm();
      await loadChiefsData();
      chiefsMessage.textContent = nextActive ? 'Chefe restaurado com sucesso.' : 'Chefe removido do app com sucesso.';
      window.setTimeout(() => { if (chiefsMessage.textContent.includes('sucesso')) chiefsMessage.textContent = ''; }, 3500);
    } catch (error) {
      chiefFormMessage.textContent = `Não foi possível alterar o cadastro: ${error.message}`;
    } finally {
      removeChiefButton.disabled = false;
    }
  }

  chiefForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.profile?.tipo !== 'administrador') return;
    chiefFormMessage.textContent = '';
    const payload = {
      name: chiefName.value.trim(),
      registration: chiefRegistration.value.trim(),
      validity: chiefRegistrationValidity.value,
      birth: chiefBirth.value,
      phone: chiefPhone.value.trim(),
      promiseLobinho: chiefPromiseLobinho.value,
      promiseEscoteira: chiefPromiseEscoteira.value,
      promiseAdulta: chiefPromiseAdulta.value,
      functions: parsedChiefFunctions(),
      sectionIds: selectedChiefSectionIds(),
      active: chiefActive.checked
    };
    if (!payload.name || !payload.registration || !payload.validity || !payload.birth || !normalizePhone(payload.phone) || !payload.functions.length) {
      chiefFormMessage.textContent = 'Preencha nome, registro, validade, nascimento, telefone e ao menos uma função.';
      return;
    }
    saveChiefButton.disabled = true;
    saveChiefButton.textContent = 'Salvando...';
    try {
      if (chiefId.value) await updateChief(Number(chiefId.value), payload);
      else await createChief(payload);
      const wasEditing = Boolean(chiefId.value);
      closeChiefForm();
      await loadChiefsData();
      chiefsMessage.textContent = wasEditing ? 'Cadastro da chefia atualizado com sucesso.' : 'Chefe cadastrado com sucesso.';
      window.setTimeout(() => { if (chiefsMessage.textContent.includes('sucesso')) chiefsMessage.textContent = ''; }, 3500);
    } catch (error) {
      chiefFormMessage.textContent = `Não foi possível salvar: ${error.message}`;
    } finally {
      saveChiefButton.disabled = false;
      saveChiefButton.textContent = 'Salvar chefe';
    }
  });

  medicalForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.profile?.tipo !== 'administrador') return;
    const jovemId = Number(medicalMemberId.value || 0);
    if (!jovemId) return;
    medicalFormMessage.textContent = '';
    saveMedicalButton.disabled = true;
    saveMedicalButton.textContent = 'Salvando...';
    try {
      const payload = {
        jovem_id: jovemId,
        tipo_sanguineo: medicalBloodType.value.trim() || null,
        alergias: medicalAllergies.value.trim() || null,
        medicamentos_uso_continuo: medicalContinuousMedication.value.trim() || null,
        restricoes_alimentares: medicalFoodRestrictions.value.trim() || null,
        condicoes_relevantes: medicalRelevantConditions.value.trim() || null,
        necessidades_especiais: medicalSpecialNeeds.value.trim() || null,
        plano_saude: medicalHealthPlan.value.trim() || null,
        numero_carteirinha: medicalCardNumber.value.trim() || null,
        contato_emergencia_nome: medicalEmergencyName.value.trim() || null,
        contato_emergencia_telefone: medicalEmergencyPhone.value.trim() || null,
        observacoes: medicalObservations.value.trim() || null,
        atualizado_em: new Date().toISOString()
      };
      const { error } = await client.from('fichas_medicas').upsert(payload, { onConflict: 'jovem_id' });
      if (error) throw error;
      closeMedicalForm();
      await refreshMedicalMember(jovemId);
      membersMessage.textContent = 'Ficha médica salva com sucesso.';
      window.setTimeout(() => { if (membersMessage.textContent.includes('médica')) membersMessage.textContent = ''; }, 3500);
    } catch (error) {
      medicalFormMessage.textContent = `Não foi possível salvar: ${error.message}`;
    } finally {
      saveMedicalButton.disabled = false;
      saveMedicalButton.textContent = 'Salvar ficha médica';
    }
  });

  chiefMedicalForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.profile?.tipo !== 'administrador') return;
    const chefeId = Number(chiefMedicalChiefId.value || 0);
    if (!chefeId) return;
    chiefMedicalFormMessage.textContent = '';
    saveChiefMedicalButton.disabled = true;
    saveChiefMedicalButton.textContent = 'Salvando...';
    try {
      const payload = {
        chefe_id: chefeId,
        tipo_sanguineo: chiefMedicalBloodType.value.trim() || null,
        alergias: chiefMedicalAllergies.value.trim() || null,
        medicamentos_uso_continuo: chiefMedicalContinuousMedication.value.trim() || null,
        restricoes_alimentares: chiefMedicalFoodRestrictions.value.trim() || null,
        condicoes_relevantes: chiefMedicalRelevantConditions.value.trim() || null,
        necessidades_especiais: chiefMedicalSpecialNeeds.value.trim() || null,
        plano_saude: chiefMedicalHealthPlan.value.trim() || null,
        numero_carteirinha: chiefMedicalCardNumber.value.trim() || null,
        contato_emergencia_nome: chiefMedicalEmergencyName.value.trim() || null,
        contato_emergencia_telefone: chiefMedicalEmergencyPhone.value.trim() || null,
        observacoes: chiefMedicalObservations.value.trim() || null,
        atualizado_em: new Date().toISOString()
      };
      const { error } = await client.from('fichas_medicas_chefes').upsert(payload, { onConflict: 'chefe_id' });
      if (error) throw error;
      closeChiefMedicalForm();
      await refreshChiefMedical(chefeId);
      chiefsMessage.textContent = 'Ficha médica do adulto salva com sucesso.';
      window.setTimeout(() => { if (chiefsMessage.textContent.includes('médica')) chiefsMessage.textContent = ''; }, 3500);
    } catch (error) {
      chiefMedicalFormMessage.textContent = `Não foi possível salvar: ${error.message}`;
    } finally {
      saveChiefMedicalButton.disabled = false;
      saveChiefMedicalButton.textContent = 'Salvar ficha médica';
    }
  });

  journeyForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const jovemId = Number(journeyMemberId.value || 0);
    if (!jovemId) return;
    journeyMessage.textContent = '';
    saveJourneyButton.disabled = true;
    saveJourneyButton.textContent = 'Salvando...';
    try {
      await saveJourneyValues(jovemId, {
        canStart: journeyCanStart.value,
        start: journeyStart.value,
        passage: journeyPassage.value,
        limit: journeyLimit.value
      });
      closeJourneyForm();
      await refreshMemberDetail(jovemId);
    } catch (error) {
      journeyMessage.textContent = `Não foi possível salvar: ${error.message}`;
    } finally {
      saveJourneyButton.disabled = false;
      saveJourneyButton.textContent = 'Salvar';
    }
  });

  visitForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const jovemId = Number(visitMemberId.value || 0);
    const destinoId = Number(visitDestination.value || 0);
    if (!jovemId || !visitDate.value || !destinoId) {
      visitMessage.textContent = 'Informe a data e a seção de destino.';
      return;
    }
    visitMessage.textContent = '';
    saveVisitButton.disabled = true;
    saveVisitButton.textContent = 'Salvando...';
    try {
      if (visitId.value) {
        const { error } = await client.rpc('atualizar_visita_proximo_ramo', {
          p_visita_id: Number(visitId.value),
          p_secao_destino_id: destinoId,
          p_data_visita: visitDate.value,
          p_observacao: visitObservation.value.trim() || null
        });
        if (error) throw error;
      } else {
        const { error } = await client.rpc('registrar_visita_proximo_ramo', {
          p_jovem_id: jovemId,
          p_secao_destino_id: destinoId,
          p_data_visita: visitDate.value,
          p_observacao: visitObservation.value.trim() || null
        });
        if (error) throw error;
      }
      closeVisitForm();
      await refreshMemberDetail(jovemId);
    } catch (error) {
      visitMessage.textContent = `Não foi possível salvar: ${error.message}`;
    } finally {
      saveVisitButton.disabled = false;
      saveVisitButton.textContent = 'Salvar visita';
    }
  });

  teamForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.profile?.tipo !== 'administrador') return;
    const secaoId = Number(teamSection.value || 0);
    const nome = teamName.value.trim();
    const chiefIds = [...teamChiefOptions.querySelectorAll('input[type="checkbox"]:checked')].map((el) => Number(el.value));
    if (!secaoId || !nome) {
      teamFormMessage.textContent = 'Informe a seção e o nome da matilha/patrulha.';
      return;
    }
    if (!chiefIds.length) {
      teamFormMessage.textContent = 'Selecione ao menos um chefe/assistente responsável.';
      return;
    }
    const tipo = teamLabelForSection(secaoId) === 'Matilha' ? 'matilha' : 'patrulha';
    teamFormMessage.textContent = '';
    saveTeamButton.disabled = true;
    saveTeamButton.textContent = 'Salvando...';
    try {
      let id = Number(teamId.value || 0);
      if (id) {
        const { error } = await client.from('equipes').update({ secao_id: secaoId, nome, tipo, atualizado_em: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
        const { error: delError } = await client.from('equipe_chefes').delete().eq('equipe_id', id);
        if (delError) throw delError;
      } else {
        const { data, error } = await client.from('equipes').insert({ secao_id: secaoId, nome, tipo, ativo: true }).select('id').single();
        if (error) throw error;
        id = Number(data.id);
      }
      const { error: chiefError } = await client.from('equipe_chefes').insert(chiefIds.map((chefe_id) => ({ equipe_id: id, chefe_id, papel: 'Responsável' })));
      if (chiefError) throw chiefError;
      await loadMembersData();
      resetTeamForm();
      renderTeamList();
      teamFormMessage.textContent = 'Equipe salva com sucesso.';
    } catch (error) {
      teamFormMessage.textContent = `Não foi possível salvar: ${error.message}`;
    } finally {
      saveTeamButton.disabled = false;
      saveTeamButton.textContent = 'Salvar equipe';
    }
  });

  async function deleteSelectedTeam() {
    if (state.profile?.tipo !== 'administrador' || !teamId.value) return;
    const id = Number(teamId.value);
    const team = state.equipes.find((e) => Number(e.id) === id);
    if (!team) return;
    if (!window.confirm(`Apagar ${teamLabelForSection(team.secao_id).toLocaleLowerCase('pt-BR')} ${team.nome}?\n\nOs jovens vinculados ficarão sem matilha/patrulha definida.`)) return;
    deleteTeamButton.disabled = true;
    try {
      const { error } = await client.from('equipes').delete().eq('id', id);
      if (error) throw error;
      await loadMembersData();
      resetTeamForm();
      renderTeamList();
      teamFormMessage.textContent = 'Equipe apagada com sucesso.';
    } catch (error) {
      teamFormMessage.textContent = `Não foi possível apagar: ${error.message}`;
    } finally {
      deleteTeamButton.disabled = false;
    }
  }

  function localTodayValue() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function canManageAttendanceSection(secaoId) {
    if (state.profile?.tipo === 'administrador') return true;
    if (state.profile?.acesso_geral_consulta) return false;
    return state.attendanceOwnSectionIds.includes(Number(secaoId));
  }

  function attendanceAvailableSections() {
    let sections = sortedSections().filter((s) => s.ativo !== false);
    if (state.profile?.tipo === 'administrador' || state.profile?.acesso_geral_consulta) return sections;
    const allowed = new Set(state.attendanceOwnSectionIds.map(Number));
    return sections.filter((s) => allowed.has(Number(s.id)));
  }

  function renderAttendanceSectionOptions() {
    const ramoMap = new Map(state.ramos.map((r) => [Number(r.id), r]));
    const sections = attendanceAvailableSections();
    const current = attendanceSection.value;
    const options = sections.map((s) => {
      const ramo = ramoMap.get(Number(s.ramo_id));
      return `<option value="${s.id}">${escapeHtml(s.nome)}${ramo ? ` — ${escapeHtml(ramo.nome)}` : ''}</option>`;
    }).join('');
    attendanceSection.innerHTML = `<option value="">Selecione</option>${options}`;
    if (sections.some((s) => String(s.id) === String(current))) attendanceSection.value = current;
    else if (sections.length === 1) attendanceSection.value = String(sections[0].id);
  }

  function attendanceYouthRows() {
    const secaoId = Number(attendanceSection.value || 0);
    return state.jovens
      .filter((j) => j.ativo !== false && Number(j.secao_id) === secaoId)
      .sort((a, b) => a.nome_completo.localeCompare(b.nome_completo, 'pt-BR'));
  }

  function updateAttendanceAdminActions() {
    const canDeleteWholeCall = state.profile?.tipo === 'administrador' && Boolean(state.attendanceCall);
    attendanceDeleteCallButton.classList.toggle('hidden', !canDeleteWholeCall);
  }

  function renderAttendance() {
    updateAttendanceAdminActions();
    const secaoId = Number(attendanceSection.value || 0);
    const date = attendanceDate.value;
    if (!secaoId || !date) {
      attendanceList.innerHTML = `<div class="empty-members"><div>✅</div><strong>Selecione seção e data</strong><span>A lista de jovens aparecerá aqui.</span></div>`;
      attendancePresentCount.textContent = '0';
      attendanceAbsentCount.textContent = '0';
      attendancePendingCount.textContent = '0';
      return;
    }

    const young = attendanceYouthRows();
    const statusMap = new Map(state.attendanceRows.map((r) => [Number(r.jovem_id), r.status]));
    let present = 0;
    let absent = 0;
    for (const j of young) {
      const st = statusMap.get(Number(j.id));
      if (st === 'presente') present += 1;
      if (st === 'ausente') absent += 1;
    }
    const pending = Math.max(0, young.length - present - absent);
    attendancePresentCount.textContent = String(present);
    attendanceAbsentCount.textContent = String(absent);
    attendancePendingCount.textContent = String(pending);

    if (!young.length) {
      attendanceList.innerHTML = `<div class="empty-members"><div>👥</div><strong>Nenhum jovem ativo nesta seção</strong><span>Não há nomes disponíveis para esta chamada.</span></div>`;
      return;
    }

    const canManage = canManageAttendanceSection(secaoId);
    attendanceList.innerHTML = young.map((j) => {
      const st = statusMap.get(Number(j.id)) || 'pendente';
      const clearButton = st !== 'pendente'
        ? `<button type="button" class="attendance-mark clear" data-attendance-clear="${j.id}" aria-label="Limpar marcação de ${escapeHtml(j.nome_completo)}">↺ Limpar</button>`
        : '';
      const controls = canManage
        ? `<div class="attendance-actions">
            <button type="button" class="attendance-mark present ${st === 'presente' ? 'selected' : ''}" data-attendance-young="${j.id}" data-attendance-status="presente">✓ Presente</button>
            <button type="button" class="attendance-mark absent ${st === 'ausente' ? 'selected' : ''}" data-attendance-young="${j.id}" data-attendance-status="ausente">✕ Ausente</button>
            ${clearButton}
          </div>`
        : `<span class="attendance-readonly-badge ${st}">${st === 'presente' ? '✓ Presente' : st === 'ausente' ? '✕ Ausente' : '• Não marcado'}</span>`;
      return `<article class="attendance-card ${st}">
        <div class="attendance-person">
          <div class="member-avatar">${escapeHtml(j.nome_completo.charAt(0).toUpperCase())}</div>
          <div><h3>${escapeHtml(j.nome_completo)}</h3><span>${escapeHtml(state.secoes.find((s) => Number(s.id) === Number(j.secao_id))?.nome || 'Seção')}</span></div>
        </div>
        ${controls}
      </article>`;
    }).join('');

    attendanceList.querySelectorAll('[data-attendance-young]').forEach((button) => {
      button.addEventListener('click', () => markAttendance(Number(button.dataset.attendanceYoung), button.dataset.attendanceStatus));
    });
    attendanceList.querySelectorAll('[data-attendance-clear]').forEach((button) => {
      button.addEventListener('click', () => clearAttendance(Number(button.dataset.attendanceClear)));
    });
  }

  async function loadAttendanceBaseData() {
    attendanceMessage.textContent = 'Carregando lista de presença...';
    const promises = [
      client.from('ramos').select('id,nome,ordem,ativo').eq('ativo', true).order('ordem'),
      client.from('secoes').select('id,nome,ramo_id,ativo').eq('ativo', true),
      client.from('jovens').select('id,nome_completo,ramo_id,secao_id,ativo').eq('ativo', true).order('nome_completo')
    ];
    if (state.profile?.chefe_id) {
      promises.push(client.from('chefe_secoes').select('secao_id').eq('chefe_id', state.profile.chefe_id));
    }
    const results = await Promise.all(promises);
    const firstError = results.find((r) => r.error)?.error;
    if (firstError) {
      attendanceMessage.textContent = `Não foi possível carregar a presença: ${firstError.message}`;
      return false;
    }
    state.ramos = results[0].data || [];
    state.secoes = results[1].data || [];
    state.jovens = results[2].data || [];
    state.attendanceOwnSectionIds = state.profile?.chefe_id ? (results[3]?.data || []).map((r) => Number(r.secao_id)) : [];
    renderAttendanceSectionOptions();
    attendanceMessage.textContent = '';
    return true;
  }

  async function loadAttendanceForSelection() {
    state.attendanceCall = null;
    state.attendanceRows = [];
    const secaoId = Number(attendanceSection.value || 0);
    const date = attendanceDate.value;
    if (!secaoId || !date) {
      renderAttendance();
      return;
    }
    attendanceMessage.textContent = 'Carregando chamada...';
    const { data: calls, error: callError } = await client.from('chamadas')
      .select('id,secao_id,data_reuniao,titulo,criado_por,criado_em,atualizado_em')
      .eq('secao_id', secaoId)
      .eq('data_reuniao', date)
      .limit(1);
    if (callError) {
      attendanceMessage.textContent = `Não foi possível abrir a chamada: ${callError.message}`;
      renderAttendance();
      return;
    }
    state.attendanceCall = calls?.[0] || null;
    if (state.attendanceCall) {
      const { data: rows, error: presenceError } = await client.from('presencas_chamada')
        .select('id,chamada_id,jovem_id,status,observacao,registrado_por,atualizado_em')
        .eq('chamada_id', state.attendanceCall.id);
      if (presenceError) {
        attendanceMessage.textContent = `Não foi possível carregar as marcações: ${presenceError.message}`;
        renderAttendance();
        return;
      }
      state.attendanceRows = rows || [];
      attendanceMessage.textContent = '';
    } else {
      attendanceMessage.textContent = canManageAttendanceSection(secaoId)
        ? 'Chamada ainda não iniciada. Toque em Presente ou Ausente para começar.'
        : 'Ainda não há chamada registrada para esta seção nesta data.';
    }
    renderAttendance();
  }

  async function ensureAttendanceCall() {
    if (state.attendanceCall) return state.attendanceCall;
    const secaoId = Number(attendanceSection.value || 0);
    const date = attendanceDate.value;
    if (!canManageAttendanceSection(secaoId)) throw new Error('Seu perfil possui somente consulta nesta seção.');
    const { data, error } = await client.from('chamadas').insert({
      secao_id: secaoId,
      data_reuniao: date,
      titulo: 'Reunião semanal',
      criado_por: state.user.id
    }).select('id,secao_id,data_reuniao,titulo,criado_por,criado_em,atualizado_em').single();
    if (!error) {
      state.attendanceCall = data;
      return data;
    }
    // Se outro usuário iniciou a mesma chamada ao mesmo tempo, recupera a já criada.
    if (error.code === '23505') {
      const { data: existing, error: existingError } = await client.from('chamadas')
        .select('id,secao_id,data_reuniao,titulo,criado_por,criado_em,atualizado_em')
        .eq('secao_id', secaoId).eq('data_reuniao', date).single();
      if (existingError) throw existingError;
      state.attendanceCall = existing;
      return existing;
    }
    throw error;
  }

  async function markAttendance(jovemId, status) {
    const secaoId = Number(attendanceSection.value || 0);
    if (!canManageAttendanceSection(secaoId)) return;
    attendanceMessage.textContent = 'Salvando presença...';
    attendanceList.querySelectorAll('[data-attendance-young]').forEach((el) => { el.disabled = true; });
    try {
      const call = await ensureAttendanceCall();
      const payload = {
        chamada_id: call.id,
        jovem_id: jovemId,
        status,
        registrado_por: state.user.id,
        atualizado_em: new Date().toISOString()
      };
      const { data, error } = await client.from('presencas_chamada')
        .upsert(payload, { onConflict: 'chamada_id,jovem_id' })
        .select('id,chamada_id,jovem_id,status,observacao,registrado_por,atualizado_em')
        .single();
      if (error) throw error;
      const idx = state.attendanceRows.findIndex((r) => Number(r.jovem_id) === Number(jovemId));
      if (idx >= 0) state.attendanceRows[idx] = data;
      else state.attendanceRows.push(data);
      attendanceMessage.textContent = 'Presença salva.';
      renderAttendance();
      window.setTimeout(() => { if (attendanceMessage.textContent === 'Presença salva.') attendanceMessage.textContent = ''; }, 1800);
    } catch (error) {
      attendanceMessage.textContent = `Não foi possível salvar a presença: ${error.message}`;
      renderAttendance();
    }
  }

  async function clearAttendance(jovemId) {
    const secaoId = Number(attendanceSection.value || 0);
    if (!canManageAttendanceSection(secaoId) || !state.attendanceCall) return;
    const row = state.attendanceRows.find((r) => Number(r.jovem_id) === Number(jovemId));
    if (!row) return;

    attendanceMessage.textContent = 'Limpando marcação...';
    attendanceList.querySelectorAll('button').forEach((el) => { el.disabled = true; });
    try {
      const { error } = await client.from('presencas_chamada')
        .delete()
        .eq('chamada_id', state.attendanceCall.id)
        .eq('jovem_id', jovemId);
      if (error) throw error;
      state.attendanceRows = state.attendanceRows.filter((r) => Number(r.jovem_id) !== Number(jovemId));
      attendanceMessage.textContent = 'Marcação removida. O jovem voltou para não marcado.';
      renderAttendance();
      window.setTimeout(() => {
        if (attendanceMessage.textContent.startsWith('Marcação removida')) attendanceMessage.textContent = '';
      }, 2200);
    } catch (error) {
      attendanceMessage.textContent = `Não foi possível limpar a marcação: ${error.message}`;
      renderAttendance();
    }
  }

  async function deleteAttendanceCall() {
    if (state.profile?.tipo !== 'administrador' || !state.attendanceCall) return;
    const sectionName = state.secoes.find((s) => Number(s.id) === Number(state.attendanceCall.secao_id))?.nome || 'esta seção';
    const dateText = attendanceDate.value ? new Date(`${attendanceDate.value}T12:00:00`).toLocaleDateString('pt-BR') : 'esta data';
    const confirmed = window.confirm(`Apagar toda a chamada de ${sectionName} em ${dateText}? Todas as marcações desse dia serão removidas.`);
    if (!confirmed) return;

    attendanceDeleteCallButton.disabled = true;
    attendanceMessage.textContent = 'Apagando chamada...';
    try {
      const callId = state.attendanceCall.id;
      const { error } = await client.from('chamadas').delete().eq('id', callId);
      if (error) throw error;
      state.attendanceCall = null;
      state.attendanceRows = [];
      attendanceMessage.textContent = 'Chamada apagada. A lista desta data voltou ao estado inicial.';
      renderAttendance();
      window.setTimeout(() => {
        if (attendanceMessage.textContent.startsWith('Chamada apagada')) attendanceMessage.textContent = '';
      }, 2600);
    } catch (error) {
      attendanceMessage.textContent = `Não foi possível apagar a chamada: ${error.message}`;
      renderAttendance();
    } finally {
      attendanceDeleteCallButton.disabled = false;
    }
  }

  async function openAttendanceView() {
    showAttendance();
    if (!attendanceDate.value) attendanceDate.value = localTodayValue();
    const ok = await loadAttendanceBaseData();
    if (!ok) return;
    if (!attendanceSection.value) {
      const sections = attendanceAvailableSections();
      if (sections.length) attendanceSection.value = String(sections[0].id);
    }
    await loadAttendanceForSelection();
  }

  function appRedirectUrl() {
    return `${window.location.origin}${window.location.pathname}`;
  }

  function cleanAuthUrl() {
    if (window.location.search || window.location.hash) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  function isStandaloneApp() {
    return window.matchMedia?.('(display-mode: standalone)').matches === true ||
      window.navigator.standalone === true;
  }

  let accessRegisteredThisLoad = false;
  async function registerAppAccess() {
    if (accessRegisteredThisLoad || !state.user) return;
    accessRegisteredThisLoad = true;
    try {
      await client.rpc('registrar_acesso_app', { p_como_app: isStandaloneApp() });
    } catch (_) {
      // O registro de telemetria de acesso não deve impedir o uso do aplicativo.
    }
  }

  function formatDateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function renderAccessRows() {
    const term = (accessSearch.value || '').trim().toLowerCase();
    const rows = state.accessRows.filter(r => {
      const hay = `${r.nome_completo || ''} ${r.email || ''}`.toLowerCase();
      return !term || hay.includes(term);
    });

    accessList.innerHTML = '';
    if (!rows.length) {
      accessList.innerHTML = '<div class="empty-state">Nenhum usuário encontrado.</div>';
      return;
    }

    for (const r of rows) {
      const entered = !!r.ultimo_login_em;
      const appSeen = !!r.abriu_como_app;
      const card = document.createElement('article');
      card.className = 'access-card';
      card.innerHTML = `
        <div class="access-card-head">
          <div>
            <strong>${escapeHtml(r.nome_completo || r.email || 'Usuário')}</strong>
            <span>${escapeHtml(r.email || '')}</span>
          </div>
          <span class="access-status ${entered ? 'ok' : 'pending'}">${entered ? '✓ Já acessou' : '⏳ Ainda não acessou'}</span>
        </div>
        <div class="access-grid">
          <div><span>Último login</span><strong>${formatDateTime(r.ultimo_login_em)}</strong></div>
          <div><span>Primeiro acesso ao app</span><strong>${formatDateTime(r.primeiro_acesso_app)}</strong></div>
          <div><span>Última abertura</span><strong>${formatDateTime(r.ultimo_acesso_app)}</strong></div>
          <div><span>Como app instalado</span><strong>${appSeen ? '✓ Detectado' : '— Não detectado'}</strong></div>
        </div>`;
      accessList.appendChild(card);
    }
  }

  async function loadAccessReport() {
    if (state.profile?.tipo !== 'administrador') return;
    accessMessage.textContent = 'Atualizando acessos...';
    accessRefreshButton.disabled = true;
    const { data, error } = await client.rpc('relatorio_acessos_usuarios');
    accessRefreshButton.disabled = false;
    if (error) {
      accessMessage.textContent = `Não foi possível carregar os acessos: ${error.message}`;
      return;
    }
    state.accessRows = data || [];
    const total = state.accessRows.length;
    const entered = state.accessRows.filter(r => !!r.ultimo_login_em).length;
    const installed = state.accessRows.filter(r => !!r.abriu_como_app).length;
    accessTotalCount.textContent = String(total);
    accessEnteredCount.textContent = String(entered);
    accessPendingCount.textContent = String(Math.max(0, total - entered));
    accessInstalledCount.textContent = String(installed);
    accessMessage.textContent = 'Atualizado agora.';
    renderAccessRows();
  }

  async function openAccessView() {
    if (state.profile?.tipo !== 'administrador') return;
    showAccess();
    await loadAccessReport();
  }

  function openPasswordDialog(mode = 'change') {
    if (!state.user) return;
    passwordForm.reset();
    passwordFormMessage.textContent = '';
    if (mode === 'recovery') {
      passwordDialogTitle.textContent = 'Redefinir senha';
      passwordDialogHelper.textContent = 'Crie uma nova senha para voltar a acessar o GEArPC Conecta normalmente.';
    } else if (mode === 'invite') {
      passwordDialogTitle.textContent = 'Crie sua senha';
      passwordDialogHelper.textContent = 'Este é o seu primeiro acesso. Crie uma senha para conseguir entrar novamente depois que sair do aplicativo.';
    } else {
      passwordDialogTitle.textContent = 'Alterar senha';
      passwordDialogHelper.textContent = 'Defina uma nova senha para sua conta do GEArPC Conecta.';
    }
    if (!passwordDialog.open) passwordDialog.showModal();
    window.setTimeout(() => newPassword.focus(), 50);
  }

  function closePasswordForm() {
    passwordFormMessage.textContent = '';
    if (passwordDialog.open) passwordDialog.close();
  }

  async function requestPasswordRecovery() {
    const email = $('email').value.trim();
    loginMessage.textContent = '';
    loginMessage.classList.remove('success-message');
    if (!email) {
      loginMessage.textContent = 'Digite seu e-mail acima para receber o link de criação ou recuperação de senha.';
      $('email').focus();
      return;
    }
    forgotPasswordButton.disabled = true;
    forgotPasswordButton.textContent = 'Enviando link...';
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: appRedirectUrl() });
    forgotPasswordButton.disabled = false;
    forgotPasswordButton.textContent = 'Primeiro acesso ou esqueci minha senha';
    if (error) {
      loginMessage.textContent = 'Não foi possível enviar o link agora. Confira o e-mail e tente novamente.';
      return;
    }
    loginMessage.textContent = 'Link enviado. Abra o e-mail e toque no link para criar ou redefinir sua senha.';
    loginMessage.classList.add('success-message');
  }

  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    passwordFormMessage.textContent = '';
    const password = newPassword.value;
    const confirmation = confirmPassword.value;
    if (password.length < 8) {
      passwordFormMessage.textContent = 'A senha deve ter pelo menos 8 caracteres.';
      return;
    }
    if (password !== confirmation) {
      passwordFormMessage.textContent = 'As duas senhas não são iguais.';
      return;
    }
    savePasswordButton.disabled = true;
    savePasswordButton.textContent = 'Salvando...';
    const { error } = await client.auth.updateUser({ password });
    savePasswordButton.disabled = false;
    savePasswordButton.textContent = 'Salvar senha';
    if (error) {
      passwordFormMessage.textContent = `Não foi possível salvar a senha: ${error.message}`;
      return;
    }
    cleanAuthUrl();
    closePasswordForm();
    statusLine.textContent = 'Senha salva com sucesso. Você já pode sair e entrar novamente com e-mail e senha.';
  });

  forgotPasswordButton.addEventListener('click', requestPasswordRecovery);
  passwordButton.addEventListener('click', () => openPasswordDialog('change'));
  closePasswordDialog.addEventListener('click', closePasswordForm);
  cancelPasswordButton.addEventListener('click', closePasswordForm);
  passwordDialog.addEventListener('click', (event) => {
    if (event.target === passwordDialog) closePasswordForm();
  });

  async function maybeOpenPasswordDialog(event, session) {
    if (!session?.user || autoPasswordDialogOpened) return;
    const mode = event === 'PASSWORD_RECOVERY' || initialAuthAction === 'recovery'
      ? 'recovery'
      : initialAuthAction === 'invite'
        ? 'invite'
        : '';
    if (!mode) return;
    autoPasswordDialogOpened = true;
    await enterApp(session);
    openPasswordDialog(mode);
  }

  async function doLogout() {
    await client.auth.signOut();
    accessRegisteredThisLoad = false;
    loginForm.reset();
    loginMessage.textContent = '';
    showLogin();
  }

  async function enterApp(session) {
    if (!session?.user) { showLogin(); return; }
    const allowed = await loadProfile(session.user);
    if (!allowed) return;
    await registerAppAccess();
    showDashboard();
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginMessage.textContent = '';
    loginMessage.classList.remove('success-message');
    loginButton.disabled = true;
    loginButton.textContent = 'Entrando...';
    const email = $('email').value.trim();
    const password = $('password').value;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    loginButton.disabled = false;
    loginButton.textContent = 'Entrar';
    if (error) { loginMessage.textContent = 'E-mail ou senha inválidos, ou acesso não autorizado.'; return; }
    await enterApp(data.session);
  });

  logoutButton.addEventListener('click', doLogout);
  membersLogoutButton.addEventListener('click', doLogout);
  chiefsLogoutButton.addEventListener('click', doLogout);
  attendanceLogoutButton.addEventListener('click', doLogout);
  accessLogoutButton.addEventListener('click', doLogout);
  membersButton.addEventListener('click', openMembersView);
  chiefsButton.addEventListener('click', openChiefsView);
  attendanceButton.addEventListener('click', openAttendanceView);
  accessButton.addEventListener('click', openAccessView);
  membersBackButton.addEventListener('click', showDashboard);
  chiefsBackButton.addEventListener('click', showDashboard);
  attendanceBackButton.addEventListener('click', showDashboard);
  accessBackButton.addEventListener('click', showDashboard);
  attendanceSection.addEventListener('change', loadAttendanceForSelection);
  attendanceDate.addEventListener('change', loadAttendanceForSelection);
  attendanceDeleteCallButton.addEventListener('click', deleteAttendanceCall);
  accessRefreshButton.addEventListener('click', loadAccessReport);
  accessSearch.addEventListener('input', renderAccessRows);
  newMemberButton.addEventListener('click', () => openMemberDialog());
  teamManagerButton.addEventListener('click', openTeamManager);
  memberSecao.addEventListener('change', () => renderMemberTeamOptions(''));
  closeMemberDialog.addEventListener('click', closeMemberForm);
  cancelMemberButton.addEventListener('click', closeMemberForm);
  removeMemberButton.addEventListener('click', toggleMemberRemoved);
  memberShowInactive.addEventListener('change', renderMembers);
  newChiefButton.addEventListener('click', () => openChiefDialog());
  closeChiefDialog.addEventListener('click', closeChiefForm);
  cancelChiefButton.addEventListener('click', closeChiefForm);
  removeChiefButton.addEventListener('click', toggleChiefRemoved);
  chiefShowInactive.addEventListener('change', renderChiefs);
  chiefSearch.addEventListener('input', renderChiefs);
  chiefSecaoFilter.addEventListener('change', renderChiefs);
  chiefDialog.addEventListener('click', (event) => { if (event.target === chiefDialog) closeChiefForm(); });
  memberSearch.addEventListener('input', renderMembers);
  memberSecaoFilter.addEventListener('change', renderMembers);
  memberDialog.addEventListener('click', (event) => {
    if (event.target === memberDialog) closeMemberForm();
  });

  closeMemberDetailDialog.addEventListener('click', closeMemberDetail);
  memberDetailDialog.addEventListener('click', (event) => { if (event.target === memberDetailDialog) closeMemberDetail(); });
  memberDetailEditButton.addEventListener('click', () => {
    const id = state.selectedMemberDetailId;
    closeMemberDetail();
    if (id) openMemberDialog(id);
  });

  closeMedicalDialog.addEventListener('click', closeMedicalForm);
  cancelMedicalButton.addEventListener('click', closeMedicalForm);
  deleteMedicalButton.addEventListener('click', deleteMedicalRecord);
  medicalDialog.addEventListener('click', (event) => { if (event.target === medicalDialog) closeMedicalForm(); });

  closeChiefDetailDialog.addEventListener('click', closeChiefDetail);
  chiefDetailDialog.addEventListener('click', (event) => { if (event.target === chiefDetailDialog) closeChiefDetail(); });
  chiefDetailEditButton.addEventListener('click', () => {
    const id = state.selectedChiefDetailId;
    closeChiefDetail();
    if (id) openChiefDialog(id);
  });

  closeChiefMedicalDialog.addEventListener('click', closeChiefMedicalForm);
  cancelChiefMedicalButton.addEventListener('click', closeChiefMedicalForm);
  deleteChiefMedicalButton.addEventListener('click', deleteChiefMedicalRecord);
  chiefMedicalDialog.addEventListener('click', (event) => { if (event.target === chiefMedicalDialog) closeChiefMedicalForm(); });

  closeJourneyDialog.addEventListener('click', closeJourneyForm);
  cancelJourneyButton.addEventListener('click', closeJourneyForm);
  clearJourneyButton.addEventListener('click', clearJourneyDates);
  journeyDialog.addEventListener('click', (event) => { if (event.target === journeyDialog) closeJourneyForm(); });

  closeVisitDialog.addEventListener('click', closeVisitForm);
  cancelVisitButton.addEventListener('click', closeVisitForm);
  deleteVisitButton.addEventListener('click', () => deleteVisit(Number(visitId.value || 0), Number(visitMemberId.value || 0)));
  visitDialog.addEventListener('click', (event) => { if (event.target === visitDialog) closeVisitForm(); });

  closeTeamDialog.addEventListener('click', closeTeamManager);
  resetTeamButton.addEventListener('click', resetTeamForm);
  deleteTeamButton.addEventListener('click', deleteSelectedTeam);
  teamSection.addEventListener('change', () => renderTeamChiefOptions());
  teamDialog.addEventListener('click', (event) => { if (event.target === teamDialog) closeTeamManager(); });

  document.querySelectorAll('[data-clear-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = $(button.dataset.clearTarget);
      if (target) target.value = '';
    });
  });

  client.auth.onAuthStateChange((event, session) => {
    window.setTimeout(async () => {
      if (!session) {
        showLogin();
        return;
      }

      const isPasswordFlow = event === 'PASSWORD_RECOVERY' ||
        initialAuthAction === 'recovery' ||
        initialAuthAction === 'invite';

      if (isPasswordFlow) {
        await maybeOpenPasswordDialog(event, session);
        return;
      }

      await enterApp(session);
    }, 0);
  });

  client.auth.getSession().then(async ({ data }) => {
    await enterApp(data.session);
    if (data.session && (initialAuthAction === 'invite' || initialAuthAction === 'recovery')) {
      await maybeOpenPasswordDialog(initialAuthAction === 'recovery' ? 'PASSWORD_RECOVERY' : 'SIGNED_IN', data.session);
    }
  });
})();
