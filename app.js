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
  const cancelMemberButton = $('cancelMemberDialog');
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
  const cancelVisitButton = $('cancelVisitDialog');
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
  const cancelChiefButton = $('cancelChiefDialog');
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
  const cancelChiefMedicalButton = $('cancelChiefMedicalDialog');
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
    $('programmingView')?.classList.add('hidden');
    $('programEditorView')?.classList.add('hidden');
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
    const base = profile.acesso_geral_consulta
      ? 'Dirigente'
      : ({ chefia: 'Chefia', responsavel: 'Responsável' })[profile.tipo] || profile.tipo || 'Usuário';
    return profile.eh_teste ? `${base} • TESTE` : base;
  }

  async function loadProfile(user) {
    const { data, error } = await client.from('perfis_usuarios').select('nome_completo,tipo,ativo,acesso_geral_consulta,chefe_id,eh_teste').eq('user_id', user.id).single();
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
    $('programmingButton')?.classList.toggle('hidden', data.tipo === 'responsavel');
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
    statusLine.textContent = data.eh_teste
      ? '🧪 Perfil de teste • alterações em validação antes da publicação para a chefia'
      : 'Ambiente seguro • acesso restrito a usuários autorizados';
    return true;
  }

  // Restante do arquivo preservado na versão publicada.
})();