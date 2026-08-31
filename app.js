(() => {
  const cfg = window.GEARPC_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const loginView = $('loginView');
  const dashboardView = $('dashboardView');
  const membersView = $('membersView');
  const loginForm = $('loginForm');
  const loginButton = $('loginButton');
  const loginMessage = $('loginMessage');
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

  const state = {
    user: null,
    profile: null,
    ramos: [],
    secoes: [],
    jovens: [],
    responsaveis: [],
    vinculos: []
  };

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
  }
  function showLogin() { hideAllViews(); loginView.classList.remove('hidden'); }
  function showDashboard() { hideAllViews(); dashboardView.classList.remove('hidden'); }
  function showMembers() { hideAllViews(); membersView.classList.remove('hidden'); }

  function prettyProfile(tipo) {
    return ({ administrador: 'Administrador', chefia: 'Chefia', responsavel: 'Responsável' })[tipo] || tipo || 'Usuário';
  }

  async function loadProfile(user) {
    const { data, error } = await client.from('perfis_usuarios').select('nome_completo,tipo,ativo').eq('user_id', user.id).single();
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
    profileType.textContent = prettyProfile(data.tipo);
    adminCard.classList.toggle('hidden', data.tipo !== 'administrador');
    membersButton.classList.toggle('hidden', data.tipo === 'responsavel');
    newMemberButton.classList.toggle('hidden', data.tipo !== 'administrador');
    membersRoleNote.textContent = data.tipo === 'administrador'
      ? 'Você pode cadastrar e alterar membros.'
      : 'Consulta dos membros autorizados para sua chefia.';
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
    if (secaoId) rows = rows.filter((m) => String(m.secao?.id || m.secao_id || '') === String(secaoId));
    if (search) {
      rows = rows.filter((m) => normalizeText(m.nome_completo).includes(search) || normalizeText(m.registro_paxtu).includes(search) || normalizeText(m.responsavel?.nome_completo).includes(search) || normalizeText(m.responsavel?.registro_paxtu).includes(search));
    }
    rows.sort((a, b) => (a.ramo?.ordem || 99) - (b.ramo?.ordem || 99) || (a.secao?.nome || '').localeCompare(b.secao?.nome || '', 'pt-BR') || a.nome_completo.localeCompare(b.nome_completo, 'pt-BR'));
    membersCount.textContent = String(rows.length);

    if (!rows.length) {
      membersList.innerHTML = `<div class="empty-members"><div>👥</div><strong>Nenhum membro encontrado</strong><span>Cadastre o primeiro membro ou altere os filtros.</span></div>`;
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
    membersMessage.textContent = 'Carregando membros...';
    const [ramosRes, secoesRes, jovensRes, vinculosRes, responsaveisRes] = await Promise.all([
      client.from('ramos').select('id,nome,ordem,ativo').eq('ativo', true).order('ordem'),
      client.from('secoes').select('id,nome,ramo_id,ativo').eq('ativo', true),
      client.from('jovens').select('id,nome_completo,registro_paxtu,validade_registro,data_nascimento,ramo_id,secao_id,ativo').order('nome_completo'),
      client.from('jovem_responsaveis').select('jovem_id,responsavel_id,parentesco,responsavel_principal'),
      client.from('responsaveis').select('id,nome_completo,registro_paxtu,telefone')
    ]);
    const firstError = [ramosRes, secoesRes, jovensRes, vinculosRes, responsaveisRes].find((r) => r.error)?.error;
    if (firstError) {
      membersMessage.textContent = `Não foi possível carregar os membros: ${firstError.message}`;
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
    memberDialogTitle.textContent = 'Novo membro';
    if (jovemId) {
      const m = memberRows().find((item) => Number(item.id) === Number(jovemId));
      if (!m) return;
      memberDialogTitle.textContent = 'Editar membro';
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
    }
    memberDialog.showModal();
  }

  function closeMemberForm() {
    if (memberDialog.open) memberDialog.close();
  }

  async function insertResponsible(name, phone, registration) {
    const phoneDigits = normalizePhone(phone);
    const reg = (registration || '').trim();
    const existing = state.responsaveis.find((r) =>
      (reg && normalizeText(r.registro_paxtu) === normalizeText(reg)) ||
      (normalizePhone(r.telefone) === phoneDigits && normalizeText(r.nome_completo) === normalizeText(name))
    );
    if (existing) return { id: existing.id, created: false };
    const { data, error } = await client.from('responsaveis').insert({
      nome_completo: name.trim(),
      registro_paxtu: reg || null,
      telefone: phone.trim()
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
      membersMessage.textContent = memberId.value ? 'Cadastro atualizado com sucesso.' : 'Membro cadastrado com sucesso.';
      window.setTimeout(() => { if (membersMessage.textContent.includes('sucesso')) membersMessage.textContent = ''; }, 3500);
    } catch (error) {
      memberFormMessage.textContent = `Não foi possível salvar: ${error.message}`;
    } finally {
      saveMemberButton.disabled = false;
      saveMemberButton.textContent = 'Salvar membro';
    }
  });

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
    await loadNextActivity();
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginMessage.textContent = '';
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
  membersButton.addEventListener('click', openMembersView);
  membersBackButton.addEventListener('click', showDashboard);
  newMemberButton.addEventListener('click', () => openMemberDialog());
  closeMemberDialog.addEventListener('click', closeMemberForm);
  cancelMemberButton.addEventListener('click', closeMemberForm);
  memberSearch.addEventListener('input', renderMembers);
  memberSecaoFilter.addEventListener('change', renderMembers);
  memberDialog.addEventListener('click', (event) => {
    if (event.target === memberDialog) closeMemberForm();
  });

  client.auth.onAuthStateChange((_event, session) => { if (!session) showLogin(); });
  client.auth.getSession().then(({ data }) => enterApp(data.session));
})();
