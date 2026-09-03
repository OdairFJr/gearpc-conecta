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
    chefeSecoes: []
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
  }
  function showLogin() { hideAllViews(); loginView.classList.remove('hidden'); }
  function showDashboard() { hideAllViews(); dashboardView.classList.remove('hidden'); }
  function showMembers() { hideAllViews(); membersView.classList.remove('hidden'); }
  function showChiefs() { hideAllViews(); chiefsView.classList.remove('hidden'); }

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
    newChiefButton.classList.toggle('hidden', data.tipo !== 'administrador');
    newMemberButton.classList.toggle('hidden', data.tipo !== 'administrador');
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

  function renderMembers() {
    const search = normalizeText(memberSearch.value);
    const secaoId = memberSecaoFilter.value;
    let rows = memberRows();
    const canShowInactive = state.profile?.tipo === 'administrador' && memberShowInactive.checked;
    if (!canShowInactive) rows = rows.filter((m) => m.ativo !== false);
    if (secaoId) rows = rows.filter((m) => String(m.secao?.id || m.secao_id || '') === String(secaoId));
    if (search) {
      rows = rows.filter((m) => normalizeText(m.nome_completo).includes(search) || normalizeText(m.registro_paxtu).includes(search) || normalizeText(m.responsavel?.nome_completo).includes(search) || normalizeText(m.responsavel?.registro_paxtu).includes(search));
    }
    rows.sort((a, b) => (a.ramo?.ordem || 99) - (b.ramo?.ordem || 99) || (a.secao?.nome || '').localeCompare(b.secao?.nome || '', 'pt-BR') || a.nome_completo.localeCompare(b.nome_completo, 'pt-BR'));
    membersCount.textContent = String(rows.length);

    if (!rows.length) {
      membersList.innerHTML = `<div class="empty-members"><div>👥</div><strong>Nenhum jovem encontrado</strong><span>Cadastre o primeiro jovem ou altere os filtros.</span></div>`;
      return;
    }

    membersList.innerHTML = rows.map((m) => {
      const phone = m.responsavel?.telefone || '';
      const phoneHref = normalizePhone(phone);
      const edit = state.profile?.tipo === 'administrador'
        ? `<button class="edit-member-button" type="button" data-edit-member="${m.id}">Editar</button>` : '';
      const regStatus = registrationStatus(m.validade_registro);
      return `<article class="member-card ${m.ativo ? '' : 'member-inactive'}">
        <div class="member-main">
          <div class="member-avatar">${escapeHtml(m.nome_completo.charAt(0).toUpperCase())}</div>
          <div class="member-copy">
            <div class="member-name-row"><h3>${escapeHtml(m.nome_completo)}</h3><span class="member-ramo">${escapeHtml(m.secao?.nome || 'Sem seção')}</span></div>
            <div class="member-details"><span>🪪 Reg. membro: ${escapeHtml(m.registro_paxtu || '—')}</span><span>📆 Validade: ${formatDateBR(m.validade_registro)}</span><span>🎂 ${formatBirth(m.data_nascimento)}</span><span>⚜ Ramo: ${escapeHtml(m.ramo?.nome || '—')}</span><span>👤 ${escapeHtml(m.responsavel?.nome_completo || 'Responsável não informado')}</span><span>🪪 Reg. responsável: ${escapeHtml(m.responsavel?.registro_paxtu || '—')}</span>${phone ? `<a href="tel:${phoneHref}">☎ ${escapeHtml(phone)}</a>` : '<span>☎ —</span>'}</div>
          </div>
        </div>
        <div class="member-side"><span class="registration-badge ${regStatus.cls}">${escapeHtml(regStatus.label)}</span><span class="status-badge ${m.ativo ? 'active' : 'inactive'}">${m.ativo ? 'Ativo' : 'Inativo'}</span>${edit}</div>
      </article>`;
    }).join('');

    membersList.querySelectorAll('[data-edit-member]').forEach((button) => {
      button.addEventListener('click', () => openMemberDialog(Number(button.dataset.editMember)));
    });
  }

  async function loadMembersData() {
    membersMessage.textContent = 'Carregando jovens...';
    const [ramosRes, secoesRes, jovensRes, vinculosRes, responsaveisRes] = await Promise.all([
      client.from('ramos').select('id,nome,ordem,ativo').eq('ativo', true).order('ordem'),
      client.from('secoes').select('id,nome,ramo_id,ativo').eq('ativo', true),
      client.from('jovens').select('id,nome_completo,registro_paxtu,validade_registro,data_nascimento,ramo_id,secao_id,ativo').order('nome_completo'),
      client.from('jovem_responsaveis').select('jovem_id,responsavel_id,parentesco,responsavel_principal'),
      client.from('responsaveis').select('id,nome_completo,registro_paxtu,telefone')
    ]);
    const firstError = [ramosRes, secoesRes, jovensRes, vinculosRes, responsaveisRes].find((r) => r.error)?.error;
    if (firstError) {
      membersMessage.textContent = `Não foi possível carregar os jovens: ${firstError.message}`;
      return false;
    }
    state.ramos = ramosRes.data || [];
    state.secoes = secoesRes.data || [];
    state.jovens = jovensRes.data || [];
    state.vinculos = vinculosRes.data || [];
    state.responsaveis = responsaveisRes.data || [];
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
    if (search) {
      rows = rows.filter((c) => {
        const haystack = [c.nome_completo, c.registro_paxtu, c.telefone, ...c.funcoes, ...c.secoes.map((s) => s.nome), ...c.secoes.map((s) => s.ramo?.nome || '')].join(' ');
        return normalizeText(haystack).includes(search);
      });
    }
    rows.sort((a, b) => a.nome_completo.localeCompare(b.nome_completo, 'pt-BR'));
    chiefsCount.textContent = String(rows.length);

    if (!rows.length) {
      chiefsList.innerHTML = `<div class="empty-members"><div>🧑‍🏫</div><strong>Nenhum chefe encontrado</strong><span>${state.profile?.tipo === 'administrador' ? 'Cadastre o primeiro chefe ou altere os filtros.' : 'Não há chefia disponível para este filtro.'}</span></div>`;
      return;
    }

    const adminOrChief = state.profile?.tipo !== 'responsavel';
    chiefsList.innerHTML = rows.map((c) => {
      const regStatus = registrationStatus(c.validade_registro);
      const phoneHref = normalizePhone(c.telefone);
      const functions = c.funcoes.length ? c.funcoes.map((f) => `<span class="function-chip">${escapeHtml(f)}</span>`).join('') : '<span class="function-chip muted">Função não informada</span>';
      const sections = c.secoes.length ? c.secoes.map((secao) => `<span class="section-chip">${escapeHtml(secao.nome)}${secao.ramo?.nome ? `<small>${escapeHtml(secao.ramo.nome)}</small>` : ''}</span>`).join('') : '<span class="section-chip">Sem seção</span>';
      const adminDetails = adminOrChief ? `<div class="member-details"><span>🪪 Reg.: ${escapeHtml(c.registro_paxtu || '—')}</span><span>📆 Validade: ${formatDateBR(c.validade_registro)}</span><span>🎂 Nascimento: ${formatBirth(c.data_nascimento)}</span></div>` : '';
      const edit = state.profile?.tipo === 'administrador' ? `<button class="edit-member-button" type="button" data-edit-chief="${c.id}">Editar</button>` : '';
      return `<article class="member-card chief-card ${c.ativo ? '' : 'member-inactive'}">
        <div class="member-main">
          <div class="member-avatar chief-avatar">${escapeHtml(c.nome_completo.charAt(0).toUpperCase())}</div>
          <div class="member-copy">
            <div class="member-name-row"><h3>${escapeHtml(c.nome_completo)}</h3></div>
            <div class="chief-chip-row">${functions}</div>
            <div class="chief-chip-row">${sections}</div>
            ${adminDetails}
            <div class="chief-contact">${c.telefone ? `<a href="tel:${phoneHref}">☎ ${escapeHtml(c.telefone)}</a>` : '<span>☎ Telefone não informado</span>'}</div>
          </div>
        </div>
        <div class="member-side">${adminOrChief ? `<span class="registration-badge ${regStatus.cls}">${escapeHtml(regStatus.label)}</span>` : ''}<span class="status-badge ${c.ativo ? 'active' : 'inactive'}">${c.ativo ? 'Ativo' : 'Inativo'}</span>${edit}</div>
      </article>`;
    }).join('');

    chiefsList.querySelectorAll('[data-edit-chief]').forEach((button) => {
      button.addEventListener('click', () => openChiefDialog(Number(button.dataset.editChief)));
    });
  }

  async function loadChiefsData() {
    chiefsMessage.textContent = 'Carregando chefia...';
    const [ramosRes, secoesRes, chefesRes, funcoesRes, secoesChefesRes] = await Promise.all([
      client.from('ramos').select('id,nome,ordem,ativo').order('ordem'),
      client.from('secoes').select('id,nome,ramo_id,ativo').order('nome'),
      client.from('chefes').select('id,nome_completo,registro_paxtu,data_nascimento,validade_registro,telefone,ativo').order('nome_completo'),
      client.from('chefe_funcoes').select('id,chefe_id,funcao'),
      client.from('chefe_secoes').select('chefe_id,secao_id')
    ]);
    const firstError = [ramosRes, secoesRes, chefesRes, funcoesRes, secoesChefesRes].find((r) => r.error)?.error;
    if (firstError) {
      chiefsMessage.textContent = `Não foi possível carregar a chefia: ${firstError.message}`;
      return;
    }
    state.ramos = ramosRes.data || [];
    state.secoes = secoesRes.data || [];
    state.chefes = chefesRes.data || [];
    state.chefeFuncoes = funcoesRes.data || [];
    state.chefeSecoes = secoesChefesRes.data || [];
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
      functions: parsedChiefFunctions(),
      sectionIds: selectedChiefSectionIds(),
      active: chiefActive.checked
    };
    if (!payload.name || !payload.registration || !payload.validity || !payload.birth || !normalizePhone(payload.phone) || !payload.functions.length || !payload.sectionIds.length) {
      chiefFormMessage.textContent = 'Preencha nome, registro, validade, nascimento, telefone, ao menos uma função e uma seção.';
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

  function appRedirectUrl() {
    return `${window.location.origin}${window.location.pathname}`;
  }

  function cleanAuthUrl() {
    if (window.location.search || window.location.hash) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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
    loginForm.reset();
    loginMessage.textContent = '';
    showLogin();
  }

  async function enterApp(session) {
    if (!session?.user) { showLogin(); return; }
    const allowed = await loadProfile(session.user);
    if (!allowed) return;
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
  membersButton.addEventListener('click', openMembersView);
  chiefsButton.addEventListener('click', openChiefsView);
  membersBackButton.addEventListener('click', showDashboard);
  chiefsBackButton.addEventListener('click', showDashboard);
  newMemberButton.addEventListener('click', () => openMemberDialog());
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
