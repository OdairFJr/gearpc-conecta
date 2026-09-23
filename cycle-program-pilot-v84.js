(() => {
  if (window.__GEARPC_CYCLE_PROGRAM_PILOT_V84__) return;
  window.__GEARPC_CYCLE_PROGRAM_PILOT_V84__ = true;

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let rt = null;
  let isEnabled = false;
  let isAdmin = false;
  let currentCycleId = null;
  let currentPredictionId = null;
  let generatedActivity = null;
  let generatedContext = null;
  let pendingInsert = null;

  const dataState = {
    ramos: [],
    secoes: [],
    ownSectionIds: [],
    allowedRamoIds: [],
    cycles: [],
    predictions: []
  };

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function fmtDate(value) {
    if (!value) return '';
    const [y, m, d] = String(value).split('-');
    return y && m && d ? `${d}/${m}/${y}` : String(value);
  }

  function toMinutes(time) {
    if (!time || !/^\d{2}:\d{2}/.test(String(time))) return null;
    const [h, m] = String(time).slice(0, 5).split(':').map(Number);
    return h * 60 + m;
  }

  function fromMinutes(total) {
    const n = ((Math.round(total) % 1440) + 1440) % 1440;
    return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  }

  function ramoName(id) {
    return dataState.ramos.find((r) => Number(r.id) === Number(id))?.nome || 'Ramo';
  }

  function cycleById(id) {
    return dataState.cycles.find((c) => Number(c.id) === Number(id)) || null;
  }

  function predictionById(id) {
    return dataState.predictions.find((p) => Number(p.id) === Number(id)) || null;
  }

  async function waitRuntime() {
    for (let i = 0; i < 120; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.profile && x?.state?.user?.id) return x;
      await sleep(250);
    }
    return null;
  }

  async function resolveEnabled() {
    const tipo = rt.state.profile?.tipo;
    isAdmin = tipo === 'administrador';
    return isAdmin || tipo === 'chefia' || tipo === 'dirigente';
  }

  function installStyles() {
    if ($('cycleProgramStylesV80')) return;
    const style = document.createElement('style');
    style.id = 'cycleProgramStylesV80';
    style.textContent = `
      .cycle-v80-toolbar{display:flex;gap:10px;align-items:end;flex-wrap:wrap;margin:18px 0}.cycle-v80-toolbar label{display:flex;flex-direction:column;gap:6px;font-weight:800;color:#425466;flex:1;min-width:190px}.cycle-v80-toolbar select{border:1px solid #c9d2dc;border-radius:10px;padding:11px 12px;background:#fff;font:inherit}.cycle-v80-list{display:grid;gap:14px}.cycle-v80-card{background:#fff;border:1px solid #dce3ea;border-radius:18px;padding:16px;box-shadow:0 4px 14px rgba(24,54,82,.05)}.cycle-v80-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.cycle-v80-head h3{margin:0;color:#173a63}.cycle-v80-meta{margin-top:5px;color:#617284;font-size:.9rem}.cycle-v80-objective{margin:12px 0;padding:12px 14px;background:#f5f8fb;border-radius:12px;line-height:1.45}.cycle-v80-objective strong{color:#173a63}.cycle-v80-actions,.cycle-v80-pred-actions{display:flex;gap:8px;flex-wrap:wrap}.cycle-v80-actions button,.cycle-v80-pred-actions button{border:1px solid #cbd5df;background:#fff;border-radius:10px;padding:9px 11px;font:inherit;font-weight:800;cursor:pointer;color:#234}.cycle-v80-actions .danger,.cycle-v80-pred-actions .danger{color:#9e2b25;border-color:#e0b7b4}.cycle-v80-add{border:none;background:#0a376c;color:#fff;border-radius:11px;padding:11px 14px;font:inherit;font-weight:900;cursor:pointer}.cycle-v80-predictions{display:grid;gap:9px;margin-top:14px}.cycle-v80-pred{border:1px solid #e0e6ec;border-radius:14px;padding:12px;background:#fbfcfd}.cycle-v80-pred-main{display:flex;gap:12px;align-items:flex-start}.cycle-v80-date{min-width:68px;text-align:center;background:#eaf1f8;color:#173a63;border-radius:10px;padding:8px;font-weight:900}.cycle-v80-copy{flex:1}.cycle-v80-copy strong{display:block;color:#173a63}.cycle-v80-copy small{display:block;margin-top:4px;color:#627384;line-height:1.4}.cycle-v80-pred-actions{margin-top:10px}.cycle-v80-ai{background:#f3effb!important;border-color:#cabee7!important;color:#4d347f!important}.cycle-v80-program{background:#edf6ff!important;border-color:#b8d4ef!important;color:#174d78!important}.cycle-v80-empty{padding:24px;text-align:center;border:1px dashed #cdd7e1;border-radius:16px;color:#667788;background:#fff}.cycle-v80-badge{display:inline-flex;padding:5px 8px;border-radius:999px;background:#e8f5ec;color:#24663a;font-size:.75rem;font-weight:900}.cycle-v80-badge.history{background:#eef1f4;color:#5a6672}.cycle-v80-dialog-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cycle-v80-dialog-grid label,.cycle-v80-stack label{display:flex;flex-direction:column;gap:6px;font-weight:800;color:#425466}.cycle-v80-dialog-grid input,.cycle-v80-dialog-grid select,.cycle-v80-stack input,.cycle-v80-stack textarea{width:100%;box-sizing:border-box;border:1px solid #c9d2dc;border-radius:10px;padding:11px 12px;background:#fff;font:inherit}.cycle-v80-stack{display:grid;gap:12px;margin-top:12px}.cycle-v80-required{color:#a22520;font-size:.75rem;font-weight:900}.cycle-v80-ai-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.cycle-v80-ai-field{padding:12px;border-radius:12px;background:#f6f8fb;border:1px solid #e1e6ec}.cycle-v80-ai-field.wide{grid-column:1/-1}.cycle-v80-ai-field span{display:block;color:#68798a;font-size:.76rem;font-weight:900;text-transform:uppercase;margin-bottom:5px}.cycle-v80-ai-field strong{display:block;white-space:pre-wrap;line-height:1.45;color:#173a63}.cycle-v80-note{font-size:.9rem;color:#617284;line-height:1.45}.cycle-v80-message{min-height:20px;color:#9e2b25;font-weight:700}.cycle-v80-message.ok{color:#24663a}.cycle-v84-branch{background:#fff;border:1px solid #dce3ea;border-radius:18px;overflow:hidden;box-shadow:0 4px 14px rgba(24,54,82,.05)}.cycle-v84-branch summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 16px;cursor:pointer;font-weight:900;color:#173a63}.cycle-v84-branch summary::-webkit-details-marker{display:none}.cycle-v84-branch summary::after{content:'›';font-size:1.6rem;line-height:1;transition:transform .18s ease}.cycle-v84-branch[open] summary::after{transform:rotate(90deg)}.cycle-v84-branch-title{display:flex;flex-direction:column;gap:3px}.cycle-v84-branch-title small{font-weight:600;color:#68798a}.cycle-v84-branch-body{display:grid;gap:12px;padding:0 12px 12px}.cycle-v84-branch-body .cycle-v80-card{box-shadow:none}
      @media(max-width:680px){.cycle-v80-dialog-grid,.cycle-v80-ai-grid{grid-template-columns:1fr}.cycle-v80-head,.cycle-v80-pred-main{flex-direction:column}.cycle-v80-date{text-align:left;min-width:0}.cycle-v80-actions button,.cycle-v80-pred-actions button,.cycle-v80-add{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function installUi() {
    if (!$('cycleProgramButtonV80')) {
      const button = document.createElement('button');
      button.id = 'cycleProgramButtonV80';
      button.type = 'button';
      button.className = 'launch-module';
      button.innerHTML = `<span class="launch-module-icon programming-icon" aria-hidden="true">🧭</span><span class="launch-module-copy"><strong>Ciclo de Programa</strong><small>Consulte o planejamento macro do período e as previsões do ramo.</small></span><span class="launch-module-arrow" aria-hidden="true">›</span>`;
      const host = document.querySelector('.launch-modules');
      const programming = $('programmingButton');
      if (programming) programming.insertAdjacentElement('afterend', button);
      else host?.appendChild(button);
    }

    if (!$('cycleProgramViewV80')) {
      document.querySelector('.app-shell')?.insertAdjacentHTML('beforeend', `
        <section id="cycleProgramViewV80" class="members-view hidden">
          <header class="subpage-header">
            <button id="cycleProgramBackV80" class="back-button" type="button" aria-label="Voltar">←</button>
            <div class="subpage-brand"><img src="logo-grupo.jpeg" alt="" /><div><span>GEArPC Conecta</span><strong>Ciclo de Programa</strong></div></div>
            <button id="cycleProgramLogoutV80" class="secondary-button" type="button">Sair</button>
          </header>
          <section class="members-hero">
            <div><div class="eyebrow dark">PLANEJAMENTO DO PERÍODO</div><h2>Ciclo de Programa</h2><p>Registre o ciclo do ramo com seu período, objetivo e as previsões de datas especiais. Esta área é uma referência para consulta ao longo do ciclo.</p></div>
            <button id="cycleNewV80" class="new-member-button" type="button">＋ Novo ciclo</button>
          </section>
          <section class="cycle-v80-toolbar">
            <label>Ramo<select id="cycleRamoFilterV80"></select></label>
            <button id="cycleRefreshV80" class="secondary-action-button" type="button">↻ Atualizar</button>
          </section>
          <p id="cycleMessageV80" class="cycle-v80-message" role="status"></p>
          <section id="cycleListV80" class="cycle-v80-list"></section>
        </section>
      `);
    }

    if (!$('cycleDialogV80')) {
      document.body.insertAdjacentHTML('beforeend', `
        <dialog id="cycleDialogV80" class="member-dialog">
          <form id="cycleFormV80" class="member-form">
            <div class="dialog-title-row sticky-dialog-header"><div><div class="eyebrow dark">CICLO DE PROGRAMA</div><h2 id="cycleDialogTitleV80">Novo ciclo</h2></div><button id="cycleCloseV80" type="button" class="dialog-close">×</button></div>
            <input id="cycleIdV80" type="hidden" />
            <div class="cycle-v80-dialog-grid">
              <label>Ramo <span class="cycle-v80-required">obrigatório</span><select id="cycleRamoV80" required></select></label>
              <label>Nome do ciclo <span class="cycle-v80-required">obrigatório</span><input id="cycleNameV80" required maxlength="140" placeholder="Ex.: 2º Ciclo de 2026" /></label>
              <label>Data de início <span class="cycle-v80-required">obrigatório</span><input id="cycleStartV80" type="date" required /></label>
              <label>Data de encerramento <span class="cycle-v80-required">obrigatório</span><input id="cycleEndV80" type="date" required /></label>
            </div>
            <div class="cycle-v80-stack">
              <label>Diagnóstico <span class="cycle-v80-note">opcional</span><textarea id="cycleDiagnosisV84" rows="5" maxlength="8000" placeholder="Registre o diagnóstico levantado pela seção para este ciclo."></textarea></label>
              <label>Ênfase <span class="cycle-v80-note">opcional</span><textarea id="cycleEmphasisV84" rows="4" maxlength="4000" placeholder="Registre a prioridade ou ênfase definida para este ciclo."></textarea></label>
              <label>Objetivo do ciclo <span class="cycle-v80-required">obrigatório</span><textarea id="cycleObjectiveV80" rows="4" required maxlength="2400" placeholder="Descreva o objetivo que orientará o ciclo."></textarea></label>
            </div>
            <p id="cycleFormMessageV80" class="cycle-v80-message" role="status"></p>
            <div class="dialog-actions sticky-dialog-actions"><button id="cycleCancelV80" type="button" class="cancel-button">Cancelar</button><button id="cycleSaveV80" type="submit" class="save-button">Salvar ciclo</button></div>
          </form>
        </dialog>

        <dialog id="cyclePredictionDialogV80" class="member-dialog">
          <form id="cyclePredictionFormV80" class="member-form">
            <div class="dialog-title-row sticky-dialog-header"><div><div class="eyebrow dark">PREVISÃO DO CICLO</div><h2 id="cyclePredictionTitleV80">Nova previsão</h2></div><button id="cyclePredictionCloseV80" type="button" class="dialog-close">×</button></div>
            <input id="cyclePredictionIdV80" type="hidden" />
            <div class="cycle-v80-stack">
              <label>Data <span class="cycle-v80-required">obrigatório</span><input id="cyclePredictionDateV80" type="date" required /></label>
              <label>Atividade / evento previsto <span class="cycle-v80-required">obrigatório</span><input id="cyclePredictionNameV80" required maxlength="220" placeholder="Ex.: Acampamento geral do grupo" /></label>
              <label>Observação <span class="cycle-v80-note">opcional</span><textarea id="cyclePredictionObsV80" rows="4" maxlength="1800" placeholder="Detalhes que ajudem na preparação futura."></textarea></label>
            </div>
            <p id="cyclePredictionMessageV80" class="cycle-v80-message" role="status"></p>
            <div class="dialog-actions sticky-dialog-actions"><button id="cyclePredictionCancelV80" type="button" class="cancel-button">Cancelar</button><button id="cyclePredictionSaveV80" type="submit" class="save-button">Salvar previsão</button></div>
          </form>
        </dialog>

        <dialog id="cycleAiDialogV80" class="member-dialog program-activity-dialog">
          <div class="detail-shell">
            <div class="dialog-title-row sticky-dialog-header"><div><div class="eyebrow dark">SUGESTÃO PARA A DATA</div><h2 id="cycleAiTitleV80">Atividade sugerida</h2><p id="cycleAiContextV80" class="dialog-helper"></p></div><button id="cycleAiCloseV80" type="button" class="dialog-close">×</button></div>
            <div id="cycleAiBodyV80"></div>
            <p class="cycle-v80-note">A sugestão usa o ramo, o objetivo geral do ciclo e a previsão registrada para esta data como contexto. Revise e adapte antes de aplicar.</p>
            <p id="cycleAiMessageV80" class="cycle-v80-message" role="status"></p>
            <div class="dialog-actions sticky-dialog-actions">
              <button id="cycleAiAgainV80" type="button" class="secondary-action-button">✨ Gerar outra</button>
              <button id="cycleAiSaveBankV80" type="button" class="secondary-action-button">☁️ Salvar no banco</button>
              <button id="cycleAiUseV80" type="button" class="save-button">Usar na programação</button>
            </div>
          </div>
        </dialog>
      `);
    }
  }

  function setMessage(id, text, ok = false) {
    const el = $(id);
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('ok', Boolean(ok));
  }

  function hideAllAppViews() {
    document.querySelectorAll('.app-shell > section').forEach((section) => section.classList.add('hidden'));
  }

  function showCycleView() {
    hideAllAppViews();
    $('cycleProgramViewV80')?.classList.remove('hidden');
  }

  async function loadBaseData() {
    const requests = [
      rt.client.from('ramos').select('id,nome,ordem,ativo').eq('ativo', true).order('ordem'),
      rt.client.from('secoes').select('id,nome,ramo_id,ativo').eq('ativo', true).order('nome')
    ];
    const [ramosRes, secoesRes] = await Promise.all(requests);
    if (ramosRes.error) throw ramosRes.error;
    if (secoesRes.error) throw secoesRes.error;
    dataState.ramos = ramosRes.data || [];
    dataState.secoes = secoesRes.data || [];

    if (isAdmin) {
      dataState.ownSectionIds = dataState.secoes.map((s) => Number(s.id));
      dataState.allowedRamoIds = dataState.ramos.map((r) => Number(r.id));
    } else {
      const chefeId = Number(rt.state.profile?.chefe_id || 0);
      const { data, error } = await rt.client.from('chefe_secoes').select('secao_id').eq('chefe_id', chefeId);
      if (error) throw error;
      dataState.ownSectionIds = (data || []).map((x) => Number(x.secao_id));
      const allowed = new Set(dataState.secoes.filter((s) => dataState.ownSectionIds.includes(Number(s.id))).map((s) => Number(s.ramo_id)));
      dataState.allowedRamoIds = [...allowed];
    }

    const allowedRamos = dataState.ramos.filter((r) => dataState.allowedRamoIds.includes(Number(r.id)));
    const options = allowedRamos.map((r) => `<option value="${r.id}">${esc(r.nome)}</option>`).join('');
    $('cycleRamoFilterV80').innerHTML = `<option value="">Todos os ramos disponíveis</option>${options}`;
    $('cycleRamoV80').innerHTML = options;
    if (allowedRamos.length === 1) {
      $('cycleRamoFilterV80').value = String(allowedRamos[0].id);
      $('cycleRamoV80').value = String(allowedRamos[0].id);
    }
  }

  async function loadCycles() {
    setMessage('cycleMessageV80', 'Carregando ciclos...');
    const { data: cycles, error } = await rt.client
      .from('ciclos_programa')
      .select('id,ramo_id,nome,data_inicio,data_fim,diagnostico,enfase,objetivo,criado_por,criado_em,atualizado_em')
      .order('data_inicio', { ascending: false });
    if (error) throw error;
    dataState.cycles = cycles || [];

    const ids = dataState.cycles.map((c) => Number(c.id));
    if (!ids.length) {
      dataState.predictions = [];
    } else {
      const { data: predictions, error: predError } = await rt.client
        .from('ciclo_programa_previsoes')
        .select('id,ciclo_id,data,titulo,observacao,criado_em,atualizado_em')
        .in('ciclo_id', ids)
        .order('data', { ascending: true });
      if (predError) throw predError;
      dataState.predictions = predictions || [];
    }
    renderCycles();
    setMessage('cycleMessageV80', '');
  }

  function cycleStatus(cycle) {
    const today = new Date();
    const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    if (local < cycle.data_inicio) return { label: 'Próximo ciclo', cls: '' };
    if (local > cycle.data_fim) return { label: 'Histórico', cls: 'history' };
    return { label: 'Ciclo atual', cls: '' };
  }

  function renderCycleCard(cycle) {
    const status = cycleStatus(cycle);
    const predictions = dataState.predictions
      .filter((p) => Number(p.ciclo_id) === Number(cycle.id))
      .sort((a, b) => String(a.data).localeCompare(String(b.data)));

    const predHtml = predictions.length ? predictions.map((p) => `
      <article class="cycle-v80-pred">
        <div class="cycle-v80-pred-main">
          <div class="cycle-v80-date">${esc(fmtDate(p.data).slice(0,5))}</div>
          <div class="cycle-v80-copy">
            <strong>${esc(p.titulo)}</strong>
            ${p.observacao ? `<small>${esc(p.observacao)}</small>` : ''}
          </div>
        </div>
        <div class="cycle-v80-pred-actions">
          <button type="button" data-cycle-edit-pred="${p.id}">Editar</button>
          <button type="button" class="danger" data-cycle-delete-pred="${p.id}">Apagar</button>
        </div>
      </article>`).join('') : '<div class="cycle-v80-empty">Nenhuma previsão de data lançada neste ciclo.</div>';

    return `
      <article class="cycle-v80-card">
        <div class="cycle-v80-head">
          <div>
            <h3>${esc(cycle.nome)}</h3>
            <div class="cycle-v80-meta">${esc(ramoName(cycle.ramo_id))} • ${esc(fmtDate(cycle.data_inicio))} a ${esc(fmtDate(cycle.data_fim))}</div>
          </div>
          <span class="cycle-v80-badge ${status.cls}">${status.label}</span>
        </div>
        ${cycle.diagnostico ? `<div class="cycle-v80-objective"><strong>Diagnóstico:</strong> ${esc(cycle.diagnostico)}</div>` : ''}
        ${cycle.enfase ? `<div class="cycle-v80-objective"><strong>Ênfase:</strong> ${esc(cycle.enfase)}</div>` : ''}
        <div class="cycle-v80-objective"><strong>Objetivo:</strong> ${esc(cycle.objetivo)}</div>
        <div class="cycle-v80-actions">
          <button type="button" data-cycle-add-pred="${cycle.id}">＋ Adicionar previsão</button>
          <button type="button" data-cycle-edit="${cycle.id}">Editar ciclo</button>
          <button type="button" class="danger" data-cycle-delete="${cycle.id}">Apagar ciclo</button>
        </div>
        <div class="cycle-v80-predictions">${predHtml}</div>
      </article>`;
  }

  function renderCycles() {
    const list = $('cycleListV80');
    const ramoFilter = Number($('cycleRamoFilterV80')?.value || 0);
    let rows = [...dataState.cycles];
    if (ramoFilter) rows = rows.filter((cycle) => Number(cycle.ramo_id) === ramoFilter);

    if (!rows.length) {
      list.innerHTML = '<div class="cycle-v80-empty"><strong>Nenhum ciclo cadastrado.</strong><br>Use “Novo ciclo” para registrar o planejamento do período.</div>';
      return;
    }

    if (!isAdmin) {
      list.innerHTML = rows.map(renderCycleCard).join('');
      return;
    }

    const groups = new Map();
    rows.forEach((cycle) => {
      const ramoId = Number(cycle.ramo_id);
      if (!groups.has(ramoId)) groups.set(ramoId, []);
      groups.get(ramoId).push(cycle);
    });

    const ramoOrder = dataState.ramos
      .map((ramo) => Number(ramo.id))
      .filter((id) => groups.has(id));

    groups.forEach((_, id) => {
      if (!ramoOrder.includes(Number(id))) ramoOrder.push(Number(id));
    });

    list.innerHTML = ramoOrder.map((ramoId) => {
      const cycles = groups.get(ramoId) || [];
      const currentCount = cycles.filter((cycle) => cycleStatus(cycle).label === 'Ciclo atual').length;
      const countText = cycles.length === 1 ? '1 ciclo' : `${cycles.length} ciclos`;
      const currentText = currentCount ? ` • ${currentCount} atual${currentCount > 1 ? 'is' : ''}` : '';

      return `
        <details class="cycle-v84-branch">
          <summary>
            <span class="cycle-v84-branch-title">
              <strong>${esc(ramoName(ramoId))}</strong>
              <small>${countText}${currentText}</small>
            </span>
          </summary>
          <div class="cycle-v84-branch-body">
            ${cycles.map(renderCycleCard).join('')}
          </div>
        </details>`;
    }).join('');
  }

  function openCycleDialog(id = null) {
    const cycle = id ? cycleById(id) : null;
    currentCycleId = cycle?.id || null;
    $('cycleIdV80').value = cycle?.id || '';
    $('cycleDialogTitleV80').textContent = cycle ? 'Editar ciclo' : 'Novo ciclo';
    if (!cycle) $('cycleFormV80').reset();
    const allowedRamos = dataState.ramos.filter((r) => dataState.allowedRamoIds.includes(Number(r.id)));
    $('cycleRamoV80').innerHTML = allowedRamos.map((r) => `<option value="${r.id}">${esc(r.nome)}</option>`).join('');
    $('cycleRamoV80').value = String(cycle?.ramo_id || allowedRamos[0]?.id || '');
    $('cycleNameV80').value = cycle?.nome || '';
    $('cycleStartV80').value = cycle?.data_inicio || '';
    $('cycleEndV80').value = cycle?.data_fim || '';
    $('cycleDiagnosisV84').value = cycle?.diagnostico || '';
    $('cycleEmphasisV84').value = cycle?.enfase || '';
    $('cycleObjectiveV80').value = cycle?.objetivo || '';
    setMessage('cycleFormMessageV80', '');
    $('cycleDialogV80').showModal();
  }

  async function saveCycle(event) {
    event.preventDefault();
    const id = Number($('cycleIdV80').value || 0);
    const ramoId = Number($('cycleRamoV80').value || 0);
    const nome = $('cycleNameV80').value.trim();
    const start = $('cycleStartV80').value;
    const end = $('cycleEndV80').value;
    const diagnostico = $('cycleDiagnosisV84').value.trim();
    const enfase = $('cycleEmphasisV84').value.trim();
    const objetivo = $('cycleObjectiveV80').value.trim();
    if (!ramoId || !nome || !start || !end || !objetivo) {
      setMessage('cycleFormMessageV80', 'Preencha ramo, nome, início, encerramento e objetivo do ciclo.');
      return;
    }
    if (end < start) {
      setMessage('cycleFormMessageV80', 'A data de encerramento não pode ser anterior ao início.');
      return;
    }
    const button = $('cycleSaveV80');
    button.disabled = true;
    try {
      const payload = { ramo_id: ramoId, nome, data_inicio: start, data_fim: end, diagnostico: diagnostico || null, enfase: enfase || null, objetivo, atualizado_em: new Date().toISOString() };
      let error;
      if (id) ({ error } = await rt.client.from('ciclos_programa').update(payload).eq('id', id));
      else ({ error } = await rt.client.from('ciclos_programa').insert({ ...payload, criado_por: rt.state.user.id }));
      if (error) throw error;
      $('cycleDialogV80').close();
      await loadCycles();
      setMessage('cycleMessageV80', 'Ciclo salvo.', true);
    } catch (error) {
      console.error(error);
      setMessage('cycleFormMessageV80', 'Não foi possível salvar o ciclo.');
    } finally {
      button.disabled = false;
    }
  }

  async function deleteCycle(id) {
    const cycle = cycleById(id);
    if (!cycle) return;
    if (!window.confirm(`Apagar o ciclo “${cycle.nome}”?\n\nAs previsões de datas deste ciclo também serão apagadas.`)) return;
    const { error } = await rt.client.from('ciclos_programa').delete().eq('id', Number(id));
    if (error) {
      setMessage('cycleMessageV80', 'Não foi possível apagar o ciclo.');
      return;
    }
    await loadCycles();
    setMessage('cycleMessageV80', 'Ciclo apagado.', true);
  }

  function openPredictionDialog(cycleId, predictionId = null) {
    const cycle = cycleById(cycleId);
    const prediction = predictionId ? predictionById(predictionId) : null;
    if (!cycle) return;
    currentCycleId = Number(cycle.id);
    currentPredictionId = prediction ? Number(prediction.id) : null;
    $('cyclePredictionIdV80').value = prediction?.id || '';
    $('cyclePredictionTitleV80').textContent = prediction ? 'Editar previsão' : 'Nova previsão';
    $('cyclePredictionDateV80').min = cycle.data_inicio;
    $('cyclePredictionDateV80').max = cycle.data_fim;
    $('cyclePredictionDateV80').value = prediction?.data || '';
    $('cyclePredictionNameV80').value = prediction?.titulo || '';
    $('cyclePredictionObsV80').value = prediction?.observacao || '';
    setMessage('cyclePredictionMessageV80', `Período do ciclo: ${fmtDate(cycle.data_inicio)} a ${fmtDate(cycle.data_fim)}.`);
    $('cyclePredictionDialogV80').showModal();
  }

  async function savePrediction(event) {
    event.preventDefault();
    const cycle = cycleById(currentCycleId);
    if (!cycle) return;
    const id = Number($('cyclePredictionIdV80').value || 0);
    const date = $('cyclePredictionDateV80').value;
    const title = $('cyclePredictionNameV80').value.trim();
    const obs = $('cyclePredictionObsV80').value.trim();
    if (!date || !title) {
      setMessage('cyclePredictionMessageV80', 'Preencha a data e a atividade/evento previsto.');
      return;
    }
    if (date < cycle.data_inicio || date > cycle.data_fim) {
      setMessage('cyclePredictionMessageV80', 'A data precisa estar dentro do período do ciclo.');
      return;
    }
    const button = $('cyclePredictionSaveV80');
    button.disabled = true;
    try {
      const payload = { ciclo_id: Number(cycle.id), data: date, titulo: title, observacao: obs || null, atualizado_em: new Date().toISOString() };
      let error;
      if (id) ({ error } = await rt.client.from('ciclo_programa_previsoes').update(payload).eq('id', id));
      else ({ error } = await rt.client.from('ciclo_programa_previsoes').insert({ ...payload, criado_por: rt.state.user.id }));
      if (error) throw error;
      $('cyclePredictionDialogV80').close();
      await loadCycles();
      setMessage('cycleMessageV80', 'Previsão salva.', true);
    } catch (error) {
      console.error(error);
      setMessage('cyclePredictionMessageV80', 'Não foi possível salvar a previsão.');
    } finally {
      button.disabled = false;
    }
  }

  async function deletePrediction(id) {
    const prediction = predictionById(id);
    if (!prediction) return;
    if (!window.confirm(`Apagar a previsão de ${fmtDate(prediction.data)} — ${prediction.titulo}?`)) return;
    const { error } = await rt.client.from('ciclo_programa_previsoes').delete().eq('id', Number(id));
    if (error) {
      setMessage('cycleMessageV80', 'Não foi possível apagar a previsão.');
      return;
    }
    await loadCycles();
    setMessage('cycleMessageV80', 'Previsão apagada.', true);
  }

  function referencesForRamo(ramo) {
    return (window.GEARPC_IDEAS || [])
      .filter((idea) => idea.ramo === ramo)
      .slice(0, 10)
      .map((idea) => ({ eixo: idea.eixo, bloco: idea.bloco, item: idea.item, objetivo: idea.objetivo, areas: idea.areas || [] }));
  }

  function renderGenerated(activity, cycle, prediction) {
    const fields = [];
    const add = (label, value, wide = false) => {
      if (value == null || value === '' || (Array.isArray(value) && !value.length)) return;
      const display = Array.isArray(value) ? value.join(' • ') : value;
      fields.push(`<div class="cycle-v80-ai-field ${wide ? 'wide' : ''}"><span>${esc(label)}</span><strong>${esc(display)}</strong></div>`);
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
    $('cycleAiTitleV80').textContent = activity.nome || 'Atividade sugerida';
    $('cycleAiContextV80').textContent = `${fmtDate(prediction.data)} • ${prediction.titulo} • ${cycle.nome}`;
    $('cycleAiBodyV80').innerHTML = `<div class="cycle-v80-ai-grid">${fields.join('')}</div>`;
    $('cycleAiSaveBankV80').classList.toggle('hidden', !isAdmin && rt.state.profile?.acesso_geral_consulta === true);
    setMessage('cycleAiMessageV80', '');
  }

  async function generateSuggestion(predictionId) {
    const prediction = predictionById(predictionId);
    const cycle = prediction ? cycleById(prediction.ciclo_id) : null;
    if (!prediction || !cycle) return;
    generatedContext = { cycle, prediction };
    generatedActivity = null;
    $('cycleAiDialogV80').showModal();
    $('cycleAiTitleV80').textContent = 'Criando sugestão...';
    $('cycleAiContextV80').textContent = `${fmtDate(prediction.data)} • ${prediction.titulo}`;
    $('cycleAiBodyV80').innerHTML = '<div class="cycle-v80-empty">A IA está preparando uma ficha de atividade completa para esta previsão.</div>';
    setMessage('cycleAiMessageV80', '');
    $('cycleAiAgainV80').disabled = true;
    $('cycleAiSaveBankV80').disabled = true;
    $('cycleAiUseV80').disabled = true;
    try {
      const ramo = ramoName(cycle.ramo_id);
      const contextParts = [
        `Objetivo geral do ciclo: ${cycle.objetivo}`,
        `Data prevista: ${fmtDate(prediction.data)}`,
        `Previsão registrada: ${prediction.titulo}`,
        prediction.observacao ? `Observação: ${prediction.observacao}` : '',
        'Sugira uma atividade prática que ajude a chefia a montar a programação desta data e entregue a ficha completa.'
      ].filter(Boolean);
      const body = {
        ramo,
        eixo: '',
        bloco: '',
        area: '',
        duracao: 30,
        participantes: '',
        local: '',
        materiais: '',
        pedido: contextParts.join('\n'),
        referencias: referencesForRamo(ramo)
      };
      const { data, error } = await rt.client.functions.invoke('gerar-atividade-ia', { body });
      if (error) throw error;
      if (!data?.activity) throw new Error('A IA não retornou uma ficha válida.');
      generatedActivity = data.activity;
      generatedActivity.ramo = ramo;
      renderGenerated(generatedActivity, cycle, prediction);
    } catch (error) {
      console.error(error);
      $('cycleAiBodyV80').innerHTML = '<div class="cycle-v80-empty">Não foi possível gerar a sugestão agora.</div>';
      setMessage('cycleAiMessageV80', 'Tente novamente em instantes.');
    } finally {
      $('cycleAiAgainV80').disabled = false;
      $('cycleAiSaveBankV80').disabled = false;
      $('cycleAiUseV80').disabled = false;
    }
  }

  async function saveGeneratedToBank() {
    if (!generatedActivity) return;
    const button = $('cycleAiSaveBankV80');
    button.disabled = true;
    setMessage('cycleAiMessageV80', 'Salvando no banco de atividades...');
    try {
      const a = generatedActivity;
      const payload = {
        nome: a.nome || 'Atividade sugerida', ramo: a.ramo || null, ramos: [a.ramo].filter(Boolean),
        objetivo: a.objetivo || null, areas_desenvolvimento: a.areas_desenvolvimento || [], eixo: a.eixo || null,
        bloco: a.bloco || null, itens_progressao: a.itens_progressao || [], materiais: a.materiais || null,
        duracao_min: Number(a.duracao_min || 30), participantes: a.participantes || null, local_sugerido: a.local_sugerido || null,
        preparacao: a.preparacao || null, desenvolvimento: a.desenvolvimento || null, regras: a.regras || null,
        seguranca: a.seguranca || null, plano_b: a.plano_b || null, tags: a.tags || [], visibilidade: 'grupo', origem: 'ia',
        criado_por: rt.state.user.id, criado_por_chefe_id: rt.state.profile?.chefe_id || null, ativo: true, atualizado_em: new Date().toISOString()
      };
      const { error } = await rt.client.from('biblioteca_atividades').insert(payload);
      if (error) throw error;
      setMessage('cycleAiMessageV80', 'Atividade salva no banco do grupo.', true);
    } catch (error) {
      console.error(error);
      setMessage('cycleAiMessageV80', 'Não foi possível salvar esta atividade no banco.');
    } finally {
      button.disabled = false;
    }
  }

  function targetSections(cycle) {
    return dataState.secoes.filter((s) => Number(s.ramo_id) === Number(cycle.ramo_id) && (isAdmin || dataState.ownSectionIds.includes(Number(s.id))));
  }

  async function openProgrammingListAndPrefill(prediction, cycle, useGenerated = false) {
    const sections = targetSections(cycle);
    if (!sections.length) {
      setMessage('cycleMessageV80', 'Não encontrei uma seção disponível deste ramo para montar a programação.');
      return;
    }
    const section = sections[0];
    $('cycleProgramViewV80')?.classList.add('hidden');
    $('cycleAiDialogV80')?.close();
    $('programmingButton')?.click();

    for (let i = 0; i < 30; i += 1) {
      await sleep(150);
      if (!$('programmingView')?.classList.contains('hidden')) break;
    }

    const { data: existing, error } = await rt.client.from('programacoes')
      .select('id,secao_id,data_atividade,horario_inicio,horario_termino')
      .eq('secao_id', Number(section.id))
      .eq('data_atividade', prediction.data)
      .order('id', { ascending: false })
      .limit(1);
    if (error) console.error(error);
    const program = existing?.[0] || null;

    if (program) {
      if (useGenerated && generatedActivity) await insertGeneratedInProgram(program);
      await openExistingProgramEditor(program.id);
      return;
    }

    const newButton = $('newProgrammingButton');
    if (!newButton || newButton.classList.contains('hidden')) {
      setMessage('cycleMessageV80', 'Seu perfil não pode criar programação para esta seção.');
      rt.showDashboard();
      return;
    }

    if (useGenerated && generatedActivity) {
      pendingInsert = { activity: generatedActivity, secaoId: Number(section.id), date: prediction.data };
    }

    newButton.click();
    await sleep(100);
    if ($('newProgrammingSection')) $('newProgrammingSection').value = String(section.id);
    if ($('newProgrammingDate')) $('newProgrammingDate').value = prediction.data;
    if ($('newProgrammingMessage')) $('newProgrammingMessage').textContent = useGenerated
      ? 'Data preenchida pelo Ciclo de Programa. Ao criar, a atividade sugerida será incluída automaticamente.'
      : 'Data preenchida pelo Ciclo de Programa. Confira os horários e crie a programação.';
  }

  async function nextAvailableStart(program, duration) {
    const { data, error } = await rt.client.from('programacao_itens').select('hora_inicio,duracao_min').eq('programacao_id', Number(program.id));
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

  async function insertGeneratedInProgram(program) {
    if (!generatedActivity) return;
    const a = generatedActivity;
    const duration = Math.max(5, Math.min(240, Number(a.duracao_min || 30)));
    const start = await nextAvailableStart(program, duration);
    const payload = {
      programacao_id: Number(program.id), ordem: 40, tipo: 'atividade', hora_inicio: start, duracao_min: duration,
      nome: a.nome || 'Atividade sugerida', condutor_chefe_id: null, objetivo: a.objetivo || null,
      areas_desenvolvimento: a.areas_desenvolvimento || [], eixo: a.eixo || null, bloco: a.bloco || null,
      itens_progressao: a.itens_progressao || [], materiais: a.materiais || null, preparacao: a.preparacao || null,
      desenvolvimento: a.desenvolvimento || null, regras: a.regras || null, seguranca: a.seguranca || null,
      plano_b: a.plano_b || null, origem: 'ia', criado_por: rt.state.user.id
    };
    const { error } = await rt.client.from('programacao_itens').insert(payload);
    if (error) throw error;
  }

  async function openExistingProgramEditor(programId) {
    for (let i = 0; i < 30; i += 1) {
      await sleep(150);
      const card = document.querySelector(`[data-program-id="${programId}"]`);
      if (!card) continue;
      card.click();
      for (let j = 0; j < 20; j += 1) {
        await sleep(100);
        const edit = $('editProgramFromPreviewButton');
        if (edit && !edit.classList.contains('hidden')) { edit.click(); return; }
      }
      return;
    }
  }

  async function useGenerated() {
    if (!generatedActivity || !generatedContext) return;
    const { cycle, prediction } = generatedContext;
    try {
      $('cycleAiUseV80').disabled = true;
      setMessage('cycleAiMessageV80', 'Abrindo a programação desta data...');
      await openProgrammingListAndPrefill(prediction, cycle, true);
    } catch (error) {
      console.error(error);
      setMessage('cycleAiMessageV80', 'Não foi possível levar a sugestão para a programação.');
    } finally {
      $('cycleAiUseV80').disabled = false;
    }
  }

  async function handlePendingAfterCreate() {
    if (!pendingInsert) return;
    const pending = pendingInsert;
    for (let i = 0; i < 40; i += 1) {
      await sleep(250);
      const { data, error } = await rt.client.from('programacoes')
        .select('id,secao_id,data_atividade,horario_inicio,horario_termino')
        .eq('secao_id', pending.secaoId)
        .eq('data_atividade', pending.date)
        .order('id', { ascending: false })
        .limit(1);
      if (!error && data?.[0]) {
        generatedActivity = pending.activity;
        pendingInsert = null;
        try {
          await insertGeneratedInProgram(data[0]);
          setMessage('programEditorMessage', 'Atividade sugerida pelo Ciclo de Programa adicionada. Defina o responsável e revise a ficha.', true);
          const back = $('programEditorBackButton');
          if (back && !$('programEditorView')?.classList.contains('hidden')) {
            back.click();
            await sleep(250);
            await openExistingProgramEditor(data[0].id);
          }
        } catch (insertError) {
          console.error(insertError);
          setMessage('programEditorMessage', 'A programação foi criada, mas não foi possível adicionar automaticamente a atividade sugerida.');
        }
        return;
      }
    }
  }

  function wireEvents() {
    $('cycleProgramButtonV80')?.addEventListener('click', async () => {
      showCycleView();
      try { await loadBaseData(); await loadCycles(); }
      catch (error) { console.error(error); setMessage('cycleMessageV80', 'Não foi possível carregar os ciclos.'); }
    });
    $('cycleProgramBackV80')?.addEventListener('click', () => { $('cycleProgramViewV80')?.classList.add('hidden'); rt.showDashboard(); });
    $('cycleProgramLogoutV80')?.addEventListener('click', () => $('logoutButton')?.click());
    $('cycleNewV80')?.addEventListener('click', () => openCycleDialog());
    $('cycleRefreshV80')?.addEventListener('click', () => void loadCycles());
    $('cycleRamoFilterV80')?.addEventListener('change', renderCycles);
    $('cycleFormV80')?.addEventListener('submit', saveCycle);
    $('cycleCloseV80')?.addEventListener('click', () => $('cycleDialogV80')?.close());
    $('cycleCancelV80')?.addEventListener('click', () => $('cycleDialogV80')?.close());
    $('cyclePredictionFormV80')?.addEventListener('submit', savePrediction);
    $('cyclePredictionCloseV80')?.addEventListener('click', () => $('cyclePredictionDialogV80')?.close());
    $('cyclePredictionCancelV80')?.addEventListener('click', () => $('cyclePredictionDialogV80')?.close());
    $('cycleAiCloseV80')?.addEventListener('click', () => $('cycleAiDialogV80')?.close());
    $('cycleAiAgainV80')?.addEventListener('click', () => generatedContext && void generateSuggestion(generatedContext.prediction.id));
    $('cycleAiSaveBankV80')?.addEventListener('click', () => void saveGeneratedToBank());
    $('cycleAiUseV80')?.addEventListener('click', () => void useGenerated());

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const btn = event.target.closest('button');
      if (!btn) return;
      if (btn.dataset.cycleEdit) openCycleDialog(Number(btn.dataset.cycleEdit));
      else if (btn.dataset.cycleDelete) void deleteCycle(Number(btn.dataset.cycleDelete));
      else if (btn.dataset.cycleAddPred) openPredictionDialog(Number(btn.dataset.cycleAddPred));
      else if (btn.dataset.cycleEditPred) {
        const p = predictionById(Number(btn.dataset.cycleEditPred));
        if (p) openPredictionDialog(Number(p.ciclo_id), Number(p.id));
      } else if (btn.dataset.cycleDeletePred) void deletePrediction(Number(btn.dataset.cycleDeletePred));
      else if (btn.dataset.cycleAi) void generateSuggestion(Number(btn.dataset.cycleAi));
      else if (btn.dataset.cycleProgram) {
        const p = predictionById(Number(btn.dataset.cycleProgram));
        const c = p ? cycleById(p.ciclo_id) : null;
        if (p && c) void openProgrammingListAndPrefill(p, c, false);
      }
    });

    $('newProgrammingForm')?.addEventListener('submit', () => {
      if (!pendingInsert) return;
      const secao = Number($('newProgrammingSection')?.value || 0);
      const date = $('newProgrammingDate')?.value || '';
      if (secao === pendingInsert.secaoId && date === pendingInsert.date) void handlePendingAfterCreate();
    });
    $('cancelNewProgrammingButton')?.addEventListener('click', () => { pendingInsert = null; });
    $('closeNewProgrammingDialog')?.addEventListener('click', () => { pendingInsert = null; });
  }

  async function verifyApi() {
    const [a, b] = await Promise.all([
      rt.client.from('ciclos_programa').select('id').limit(1),
      rt.client.from('ciclo_programa_previsoes').select('id').limit(1)
    ]);
    return !a.error && !b.error;
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt) return;
    isEnabled = await resolveEnabled();
    if (!isEnabled) return;
    installStyles();
    installUi();
    wireEvents();
    const ok = await verifyApi();
    if (!ok) setMessage('cycleMessageV80', 'O módulo foi carregado, mas o armazenamento do ciclo ainda não está disponível.');
  }

  void boot();
})();
