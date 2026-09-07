(() => {
  if (window.__GEARPC_ATTENDANCE_OFFLINE_V24__) return;
  window.__GEARPC_ATTENDANCE_OFFLINE_V24__ = true;

  const runtime = window.GEARPC_RUNTIME;
  if (!runtime?.client || !runtime?.state) return;

  const { client, state, escapeHtml } = runtime;
  const $ = (id) => document.getElementById(id);
  const ui = {
    button: $('attendanceButton'),
    view: $('attendanceView'),
    section: $('attendanceSection'),
    date: $('attendanceDate'),
    intro: $('attendanceIntroText'),
    present: $('attendancePresentCount'),
    absent: $('attendanceAbsentCount'),
    pending: $('attendancePendingCount'),
    role: $('attendanceRoleNote'),
    list: $('attendanceList'),
    message: $('attendanceMessage'),
    deleteCall: $('attendanceDeleteCallButton')
  };
  if (!ui.button || !ui.view || !ui.section || !ui.date || !ui.list) return;

  const VERSION = 1;
  const model = {
    ramos: [],
    secoes: [],
    jovens: [],
    ownSectionIds: [],
    functions: [],
    canOperate: false,
    call: null,
    rows: [],
    baseReady: false,
    usingOfflineData: false,
    syncing: false,
    lastMessageTimer: null
  };

  const normalize = (value) => String(value ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  function localToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function userId() {
    return state.user?.id || 'anon';
  }

  function cacheKey() {
    return `gearpc.attendance.v24.${userId()}`;
  }

  function blankCache() {
    return { version: VERSION, savedAt: null, ramos: [], secoes: [], jovens: [], ownSectionIds: [], functions: [], calls: {}, queue: [] };
  }

  function readCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(cacheKey()) || 'null');
      if (!parsed || parsed.version !== VERSION) return blankCache();
      parsed.calls ||= {};
      parsed.queue ||= [];
      parsed.ramos ||= [];
      parsed.secoes ||= [];
      parsed.jovens ||= [];
      parsed.ownSectionIds ||= [];
      parsed.functions ||= [];
      return parsed;
    } catch (_) {
      return blankCache();
    }
  }

  function writeCache(cache) {
    cache.version = VERSION;
    cache.savedAt = new Date().toISOString();
    try { localStorage.setItem(cacheKey(), JSON.stringify(cache)); } catch (_) {}
  }

  function selectionKey(sectionId = Number(ui.section.value || 0), date = ui.date.value) {
    return `${Number(sectionId) || 0}|${date || ''}`;
  }

  function showOnlyAttendance() {
    ['loginView', 'dashboardView', 'membersView', 'chiefsView', 'accessView', 'programmingView', 'programEditorView']
      .forEach((id) => $(id)?.classList.add('hidden'));
    ui.view.classList.remove('hidden');
  }

  function setMessage(text, tone = '') {
    if (!ui.message) return;
    window.clearTimeout(model.lastMessageTimer);
    ui.message.textContent = text || '';
    ui.message.classList.toggle('success-message', tone === 'ok');
    if (text && tone === 'ok') {
      model.lastMessageTimer = window.setTimeout(() => {
        if (ui.message.textContent === text) ui.message.textContent = '';
      }, 2200);
    }
  }

  function isAdmin() {
    return state.profile?.tipo === 'administrador';
  }

  function isDirigente() {
    return Boolean(state.profile?.acesso_geral_consulta);
  }

  function computeCanOperate(functions) {
    return (functions || []).some((f) => {
      const n = normalize(f.funcao ?? f);
      return n.includes('assistente') || n.includes('chefe de secao');
    });
  }

  function canManageSection(sectionId) {
    if (isAdmin()) return true;
    return model.canOperate && model.ownSectionIds.includes(Number(sectionId));
  }

  function availableSections() {
    const active = model.secoes.filter((s) => s.ativo !== false);
    if (isAdmin() || isDirigente()) return active;
    const allowed = new Set(model.ownSectionIds.map(Number));
    return active.filter((s) => allowed.has(Number(s.id)));
  }

  function youthForSection(sectionId) {
    return model.jovens
      .filter((j) => j.ativo !== false && Number(j.secao_id) === Number(sectionId))
      .sort((a, b) => String(a.nome_completo).localeCompare(String(b.nome_completo), 'pt-BR'));
  }

  function saveBaseToCache() {
    const cache = readCache();
    cache.ramos = model.ramos;
    cache.secoes = model.secoes;
    cache.jovens = model.jovens;
    cache.ownSectionIds = model.ownSectionIds;
    cache.functions = model.functions;
    writeCache(cache);
  }

  function loadBaseFromCache() {
    const cache = readCache();
    if (!cache.secoes.length || !cache.jovens.length) return false;
    model.ramos = cache.ramos;
    model.secoes = cache.secoes;
    model.jovens = cache.jovens;
    model.ownSectionIds = cache.ownSectionIds.map(Number);
    model.functions = cache.functions;
    model.canOperate = computeCanOperate(model.functions);
    model.baseReady = true;
    model.usingOfflineData = true;
    syncIntoRuntime();
    return true;
  }

  function syncIntoRuntime() {
    state.ramos = model.ramos;
    state.secoes = model.secoes;
    state.jovens = model.jovens;
    state.attendanceOwnSectionIds = model.ownSectionIds;
    state.attendanceCall = model.call;
    state.attendanceRows = model.rows;
  }

  async function fetchBaseOnline() {
    const promises = [
      client.from('ramos').select('id,nome,ordem,ativo').eq('ativo', true).order('ordem'),
      client.from('secoes').select('id,nome,ramo_id,ativo').eq('ativo', true),
      client.from('jovens').select('id,nome_completo,ramo_id,secao_id,ativo').eq('ativo', true).order('nome_completo')
    ];
    if (state.profile?.chefe_id) {
      promises.push(client.from('chefe_secoes').select('secao_id').eq('chefe_id', state.profile.chefe_id));
      promises.push(client.from('chefe_funcoes').select('funcao').eq('chefe_id', state.profile.chefe_id));
    }
    const results = await Promise.all(promises);
    const firstError = results.find((r) => r.error)?.error;
    if (firstError) throw firstError;
    model.ramos = results[0].data || [];
    model.secoes = results[1].data || [];
    model.jovens = results[2].data || [];
    model.ownSectionIds = state.profile?.chefe_id ? (results[3]?.data || []).map((r) => Number(r.secao_id)) : [];
    model.functions = state.profile?.chefe_id ? (results[4]?.data || []) : [];
    model.canOperate = computeCanOperate(model.functions);
    model.baseReady = true;
    model.usingOfflineData = false;
    saveBaseToCache();
    syncIntoRuntime();
    return true;
  }

  async function ensureBase({ quiet = false } = {}) {
    if (!state.user || !state.profile) return false;
    if (navigator.onLine) {
      try {
        await fetchBaseOnline();
        return true;
      } catch (error) {
        if (!quiet) setMessage('A conexão falhou. Abrindo a última lista salva neste aparelho.');
      }
    }
    const ok = loadBaseFromCache();
    if (!ok && !quiet) {
      setMessage('Sem internet e ainda não há uma lista salva neste aparelho. Abra a Presença uma vez com internet para preparar o modo offline.');
    }
    return ok;
  }

  function renderSectionOptions() {
    const ramoMap = new Map(model.ramos.map((r) => [Number(r.id), r]));
    const sections = availableSections();
    const current = ui.section.value;
    ui.section.innerHTML = '<option value="">Selecione</option>' + sections.map((s) => {
      const ramo = ramoMap.get(Number(s.ramo_id));
      return `<option value="${s.id}">${escapeHtml(s.nome)}${ramo ? ` — ${escapeHtml(ramo.nome)}` : ''}</option>`;
    }).join('');
    if (sections.some((s) => String(s.id) === String(current))) {
      ui.section.value = current;
    } else {
      const preferred = sections.find((s) => canManageSection(s.id)) || sections[0];
      ui.section.value = preferred ? String(preferred.id) : '';
    }
  }

  function cachedSelection(sectionId, date) {
    const cache = readCache();
    return cache.calls[selectionKey(sectionId, date)] || { call: null, rows: [] };
  }

  function saveSelection(sectionId, date, call, rows) {
    const cache = readCache();
    cache.calls[selectionKey(sectionId, date)] = { call: call || null, rows: rows || [], savedAt: new Date().toISOString() };
    writeCache(cache);
  }

  function overlayQueue(sectionId, date, rows) {
    const cache = readCache();
    const key = selectionKey(sectionId, date);
    const map = new Map((rows || []).map((r) => [Number(r.jovem_id), { ...r }]));
    for (const op of cache.queue.filter((q) => q.callKey === key)) {
      if (op.type === 'delete_call') {
        map.clear();
        continue;
      }
      if (op.type === 'delete') map.delete(Number(op.jovemId));
      if (op.type === 'upsert') {
        map.set(Number(op.jovemId), {
          id: `local:${key}:${op.jovemId}`,
          chamada_id: model.call?.id || `local:${key}`,
          jovem_id: Number(op.jovemId),
          status: op.status,
          observacao: null,
          registrado_por: state.user?.id,
          atualizado_em: op.at,
          _local: true
        });
      }
    }
    return [...map.values()];
  }

  async function fetchSelectionOnline(sectionId, date) {
    const { data: calls, error: callError } = await client.from('chamadas')
      .select('id,secao_id,data_reuniao,titulo,criado_por,criado_em,atualizado_em')
      .eq('secao_id', sectionId).eq('data_reuniao', date).limit(1);
    if (callError) throw callError;
    const call = calls?.[0] || null;
    let rows = [];
    if (call) {
      const { data, error } = await client.from('presencas_chamada')
        .select('id,chamada_id,jovem_id,status,observacao,registrado_por,atualizado_em')
        .eq('chamada_id', call.id);
      if (error) throw error;
      rows = data || [];
    }
    saveSelection(sectionId, date, call, rows);
    return { call, rows };
  }

  async function loadSelection() {
    const sectionId = Number(ui.section.value || 0);
    const date = ui.date.value;
    model.call = null;
    model.rows = [];
    if (!sectionId || !date) {
      syncIntoRuntime();
      render();
      return;
    }

    let selection = null;
    if (navigator.onLine) {
      try {
        selection = await fetchSelectionOnline(sectionId, date);
        model.usingOfflineData = false;
      } catch (_) {
        selection = cachedSelection(sectionId, date);
        model.usingOfflineData = true;
      }
    } else {
      selection = cachedSelection(sectionId, date);
      model.usingOfflineData = true;
    }
    model.call = selection.call;
    model.rows = overlayQueue(sectionId, date, selection.rows || []);
    syncIntoRuntime();
    render();
  }

  function queueCountForSelection(sectionId, date) {
    const key = selectionKey(sectionId, date);
    return readCache().queue.filter((q) => q.callKey === key).length;
  }

  function renderStatus() {
    const sectionId = Number(ui.section.value || 0);
    const date = ui.date.value;
    const queued = queueCountForSelection(sectionId, date);
    const canManage = canManageSection(sectionId);
    if (ui.role) {
      if (!sectionId) ui.role.textContent = '';
      else if (canManage) ui.role.textContent = 'Você pode registrar a presença desta seção.';
      else if (isDirigente()) ui.role.textContent = 'Consulta disponível. Para lançar presença, é necessário estar vinculado a esta seção como Chefe de Seção ou Assistente.';
      else ui.role.textContent = 'Seu perfil possui somente consulta nesta seção.';
    }
    if (ui.deleteCall) ui.deleteCall.classList.toggle('hidden', !(isAdmin() && (model.call || queued)));

    if (!navigator.onLine || model.usingOfflineData) {
      setMessage(queued
        ? `📴 Modo offline — ${queued} alteração(ões) salva(s) neste aparelho aguardando sincronização.`
        : '📴 Modo offline — você pode fazer a chamada normalmente. As alterações serão enviadas quando a internet voltar.');
    } else if (queued) {
      setMessage(`⏳ ${queued} alteração(ões) aguardando sincronização.`);
    }
  }

  function render() {
    const sectionId = Number(ui.section.value || 0);
    const date = ui.date.value;
    if (!sectionId || !date) {
      ui.list.innerHTML = '<div class="empty-members"><div>✅</div><strong>Selecione seção e data</strong><span>A lista de jovens aparecerá aqui.</span></div>';
      ui.present.textContent = '0'; ui.absent.textContent = '0'; ui.pending.textContent = '0';
      renderStatus();
      return;
    }

    const young = youthForSection(sectionId);
    const statusMap = new Map(model.rows.map((r) => [Number(r.jovem_id), r.status]));
    let present = 0, absent = 0;
    for (const j of young) {
      if (statusMap.get(Number(j.id)) === 'presente') present += 1;
      if (statusMap.get(Number(j.id)) === 'ausente') absent += 1;
    }
    ui.present.textContent = String(present);
    ui.absent.textContent = String(absent);
    ui.pending.textContent = String(Math.max(0, young.length - present - absent));

    if (!young.length) {
      ui.list.innerHTML = '<div class="empty-members"><div>👥</div><strong>Nenhum jovem ativo nesta seção</strong><span>Não há nomes disponíveis para esta chamada.</span></div>';
      renderStatus();
      return;
    }

    const canManage = canManageSection(sectionId);
    ui.list.innerHTML = young.map((j) => {
      const st = statusMap.get(Number(j.id)) || 'pendente';
      const clear = st !== 'pendente'
        ? `<button type="button" class="attendance-mark clear" data-offline-attendance-clear="${j.id}">↺ Limpar</button>` : '';
      const controls = canManage
        ? `<div class="attendance-actions">
            <button type="button" class="attendance-mark present ${st === 'presente' ? 'selected' : ''}" data-offline-attendance-young="${j.id}" data-offline-attendance-status="presente">✓ Presente</button>
            <button type="button" class="attendance-mark absent ${st === 'ausente' ? 'selected' : ''}" data-offline-attendance-young="${j.id}" data-offline-attendance-status="ausente">✕ Ausente</button>
            ${clear}
          </div>`
        : `<span class="attendance-readonly-badge ${st}">${st === 'presente' ? '✓ Presente' : st === 'ausente' ? '✕ Ausente' : '• Não marcado'}</span>`;
      const sectionName = model.secoes.find((s) => Number(s.id) === Number(j.secao_id))?.nome || 'Seção';
      return `<article class="attendance-card ${st}">
        <div class="attendance-person"><div class="member-avatar">${escapeHtml(String(j.nome_completo || '').charAt(0).toUpperCase())}</div>
        <div><h3>${escapeHtml(j.nome_completo)}</h3><span>${escapeHtml(sectionName)}</span></div></div>${controls}</article>`;
    }).join('');
    renderStatus();
  }

  function replaceQueuedOperation(op) {
    const cache = readCache();
    if (op.type === 'delete_call') {
      cache.queue = cache.queue.filter((q) => q.callKey !== op.callKey);
      cache.queue.push(op);
    } else {
      cache.queue = cache.queue.filter((q) => !(q.callKey === op.callKey && q.jovemId === op.jovemId) && !(q.callKey === op.callKey && q.type === 'delete_call'));
      cache.queue.push(op);
    }
    writeCache(cache);
  }

  async function markLocal(jovemId, status) {
    const sectionId = Number(ui.section.value || 0);
    const date = ui.date.value;
    if (!sectionId || !date || !canManageSection(sectionId)) return;
    const at = new Date().toISOString();
    replaceQueuedOperation({ type: 'upsert', callKey: selectionKey(sectionId, date), sectionId, date, jovemId: Number(jovemId), status, at });
    const idx = model.rows.findIndex((r) => Number(r.jovem_id) === Number(jovemId));
    const row = { id: `local:${sectionId}:${date}:${jovemId}`, chamada_id: model.call?.id || `local:${sectionId}|${date}`, jovem_id: Number(jovemId), status, observacao: null, registrado_por: state.user.id, atualizado_em: at, _local: true };
    if (idx >= 0) model.rows[idx] = row; else model.rows.push(row);
    syncIntoRuntime();
    render();
    if (navigator.onLine) await syncQueue({ refreshCurrent: true });
  }

  async function clearLocal(jovemId) {
    const sectionId = Number(ui.section.value || 0);
    const date = ui.date.value;
    if (!sectionId || !date || !canManageSection(sectionId)) return;
    const at = new Date().toISOString();
    replaceQueuedOperation({ type: 'delete', callKey: selectionKey(sectionId, date), sectionId, date, jovemId: Number(jovemId), at });
    model.rows = model.rows.filter((r) => Number(r.jovem_id) !== Number(jovemId));
    syncIntoRuntime();
    render();
    if (navigator.onLine) await syncQueue({ refreshCurrent: true });
  }

  async function findOrCreateRemoteCall(sectionId, date, createIfMissing) {
    const { data: calls, error } = await client.from('chamadas')
      .select('id,secao_id,data_reuniao,titulo,criado_por,criado_em,atualizado_em')
      .eq('secao_id', sectionId).eq('data_reuniao', date).limit(1);
    if (error) throw error;
    if (calls?.[0]) return calls[0];
    if (!createIfMissing) return null;
    const { data, error: insertError } = await client.from('chamadas').insert({ secao_id: sectionId, data_reuniao: date, titulo: 'Reunião semanal', criado_por: state.user.id })
      .select('id,secao_id,data_reuniao,titulo,criado_por,criado_em,atualizado_em').single();
    if (!insertError) return data;
    if (insertError.code === '23505') {
      const { data: existing, error: existingError } = await client.from('chamadas')
        .select('id,secao_id,data_reuniao,titulo,criado_por,criado_em,atualizado_em')
        .eq('secao_id', sectionId).eq('data_reuniao', date).single();
      if (existingError) throw existingError;
      return existing;
    }
    throw insertError;
  }

  async function syncQueue({ refreshCurrent = false, quiet = false } = {}) {
    if (model.syncing || !navigator.onLine || !state.user) return false;
    const initial = readCache();
    if (!initial.queue.length) return true;
    model.syncing = true;
    if (!quiet) setMessage(`Sincronizando ${initial.queue.length} alteração(ões)...`);
    let failed = false;
    try {
      const callKeys = [...new Set(readCache().queue.map((q) => q.callKey))];
      for (const callKey of callKeys) {
        let cache = readCache();
        let ops = cache.queue.filter((q) => q.callKey === callKey).sort((a, b) => String(a.at).localeCompare(String(b.at)));
        if (!ops.length) continue;
        const sectionId = Number(ops[0].sectionId);
        const date = ops[0].date;
        try {
          const deleteCallOp = ops.find((q) => q.type === 'delete_call');
          if (deleteCallOp) {
            const call = await findOrCreateRemoteCall(sectionId, date, false);
            if (call) {
              const { error } = await client.from('chamadas').delete().eq('id', call.id);
              if (error) throw error;
            }
            cache = readCache();
            cache.queue = cache.queue.filter((q) => q.callKey !== callKey);
            delete cache.calls[callKey];
            writeCache(cache);
            continue;
          }

          const needsCall = ops.some((q) => q.type === 'upsert');
          const call = await findOrCreateRemoteCall(sectionId, date, needsCall);
          if (!call && !needsCall) {
            cache = readCache();
            cache.queue = cache.queue.filter((q) => q.callKey !== callKey);
            writeCache(cache);
            continue;
          }

          for (const op of ops) {
            if (op.type === 'upsert') {
              const payload = { chamada_id: call.id, jovem_id: Number(op.jovemId), status: op.status, registrado_por: state.user.id, atualizado_em: op.at };
              const { error } = await client.from('presencas_chamada').upsert(payload, { onConflict: 'chamada_id,jovem_id' });
              if (error) throw error;
            } else if (op.type === 'delete' && call) {
              const { error } = await client.from('presencas_chamada').delete().eq('chamada_id', call.id).eq('jovem_id', Number(op.jovemId));
              if (error) throw error;
            }
            cache = readCache();
            cache.queue = cache.queue.filter((q) => !(q.callKey === op.callKey && q.type === op.type && Number(q.jovemId || 0) === Number(op.jovemId || 0) && q.at === op.at));
            writeCache(cache);
          }

          const refreshed = await fetchSelectionOnline(sectionId, date);
          if (selectionKey() === callKey) {
            model.call = refreshed.call;
            model.rows = overlayQueue(sectionId, date, refreshed.rows);
          }
        } catch (_) {
          failed = true;
        }
      }
    } finally {
      model.syncing = false;
    }

    const remaining = readCache().queue.length;
    if (!failed && remaining === 0) {
      if (!quiet) setMessage('✓ Presença sincronizada com sucesso.', 'ok');
    } else if (!quiet) {
      setMessage(`⏳ ${remaining} alteração(ões) continuam salvas no aparelho e serão reenviadas automaticamente.`);
    }
    if (refreshCurrent && ui.view && !ui.view.classList.contains('hidden')) {
      if (navigator.onLine) {
        try {
          const sectionId = Number(ui.section.value || 0);
          const date = ui.date.value;
          if (sectionId && date) {
            const current = await fetchSelectionOnline(sectionId, date);
            model.call = current.call;
            model.rows = overlayQueue(sectionId, date, current.rows);
          }
        } catch (_) {}
      }
      syncIntoRuntime();
      render();
    }
    return !failed && remaining === 0;
  }

  async function deleteWholeCall() {
    if (!isAdmin()) return;
    const sectionId = Number(ui.section.value || 0);
    const date = ui.date.value;
    if (!sectionId || !date) return;
    const sectionName = model.secoes.find((s) => Number(s.id) === sectionId)?.nome || 'esta seção';
    const prettyDate = new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');
    if (!window.confirm(`Apagar toda a chamada de ${sectionName} em ${prettyDate}? Todas as marcações desse dia serão removidas.`)) return;
    const at = new Date().toISOString();
    const key = selectionKey(sectionId, date);
    replaceQueuedOperation({ type: 'delete_call', callKey: key, sectionId, date, at });
    model.call = null;
    model.rows = [];
    const cache = readCache();
    delete cache.calls[key];
    writeCache(cache);
    syncIntoRuntime();
    render();
    if (navigator.onLine) await syncQueue({ refreshCurrent: true });
  }

  async function openAttendance() {
    showOnlyAttendance();
    if (!ui.date.value) ui.date.value = localToday();
    setMessage('Preparando lista de presença...');
    const ok = await ensureBase();
    if (!ok) {
      renderSectionOptions();
      render();
      return;
    }
    renderSectionOptions();
    if (navigator.onLine) await syncQueue({ quiet: true });
    await loadSelection();
  }

  async function warmCache() {
    if (!navigator.onLine || !state.user || !state.profile) return;
    try {
      await fetchBaseOnline();
      const own = isAdmin() ? model.secoes.map((s) => Number(s.id)) : model.ownSectionIds;
      const today = localToday();
      for (const sectionId of own.slice(0, 8)) {
        try { await fetchSelectionOnline(sectionId, today); } catch (_) {}
      }
      await syncQueue({ quiet: true });
    } catch (_) {}
  }

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('button') : null;
    if (!target) return;

    if (target === ui.button) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void openAttendance();
      return;
    }

    if (target === ui.deleteCall) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void deleteWholeCall();
      return;
    }

    const mark = target.closest('[data-offline-attendance-young]');
    if (mark) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void markLocal(Number(mark.dataset.offlineAttendanceYoung), mark.dataset.offlineAttendanceStatus);
      return;
    }

    const clear = target.closest('[data-offline-attendance-clear]');
    if (clear) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void clearLocal(Number(clear.dataset.offlineAttendanceClear));
    }
  }, true);

  document.addEventListener('change', (event) => {
    if (event.target !== ui.section && event.target !== ui.date) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void loadSelection();
  }, true);

  window.addEventListener('online', () => {
    void (async () => {
      await ensureBase({ quiet: true });
      await syncQueue({ refreshCurrent: !ui.view.classList.contains('hidden') });
      if (!ui.view.classList.contains('hidden')) await loadSelection();
    })();
  });

  window.addEventListener('offline', () => {
    if (!ui.view.classList.contains('hidden')) {
      model.usingOfflineData = true;
      renderStatus();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.onLine) void syncQueue({ refreshCurrent: !ui.view.classList.contains('hidden'), quiet: true });
  });

  // Prepara a lista em segundo plano depois que o usuário autenticado estiver disponível.
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (state.user && state.profile) {
      window.clearInterval(timer);
      void warmCache();
    } else if (attempts >= 30) {
      window.clearInterval(timer);
    }
  }, 500);
})();
