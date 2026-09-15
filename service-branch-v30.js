(() => {
  const cfg = window.GEARPC_CONFIG || {};
  const SERVICE_TITLE = 'Ramo de serviço do próximo sábado';
  const CACHE_KEY = 'gearpc_service_branch_calendar_v50';
  let client = null;
  let currentNotice = null;
  let noticesByDate = new Map();
  let currentProfile = null;
  let ramos = [];
  let loading = false;
  let editorDate = null;

  function nextSaturdayDate(base = new Date()) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0, 0);
    const days = (6 - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + days);
    return d;
  }

  function addDays(date, amount) {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
    copy.setDate(copy.getDate() + amount);
    return copy;
  }

  function calendarSaturdays(total = 26) {
    const first = nextSaturdayDate();
    return Array.from({ length: total }, (_, index) => addDays(first, index * 7));
  }

  function isSaturday(base = new Date()) {
    return base.getDay() === 6;
  }

  function serviceHeading(base = new Date()) {
    return isSaturday(base) ? 'Ramo de serviço de hoje' : SERVICE_TITLE;
  }

  function isoDateLocal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDateBR(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  function saturdayExpiryIso(isoDate) {
    const [y, m, d] = isoDate.split('-').map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
  }

  function safeParseMessage(message) {
    try {
      const parsed = JSON.parse(message || '{}');
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function responsaveisFromParsed(parsed) {
    if (!parsed) return [];
    if (Array.isArray(parsed.responsaveis) && parsed.responsaveis.length) {
      return parsed.responsaveis
        .filter((item) => item && item.nome)
        .map((item) => ({
          tipo: item.tipo === 'diretoria' ? 'diretoria' : 'ramo',
          id: item.tipo === 'diretoria' ? 'diretoria' : Number(item.id),
          nome: String(item.nome)
        }));
    }
    if (Array.isArray(parsed.ramo_nomes) && parsed.ramo_nomes.length) {
      return parsed.ramo_nomes.map((nome, index) => ({
        tipo: 'ramo', id: Number(parsed.ramo_ids?.[index] || 0), nome: String(nome)
      }));
    }
    if (parsed.ramo_nome) {
      return [{ tipo: 'ramo', id: Number(parsed.ramo_id || 0), nome: String(parsed.ramo_nome) }];
    }
    return [];
  }

  function responsibleKey(item) {
    return item.tipo === 'diretoria' ? 'diretoria' : `ramo:${Number(item.id)}`;
  }

  function displayResponsaveis(items) {
    return items.map((item) => item.nome).join(' • ');
  }

  function cacheNotices(notices) {
    try {
      if (notices?.length) localStorage.setItem(CACHE_KEY, JSON.stringify(notices));
      else localStorage.removeItem(CACHE_KEY);
    } catch (_) {}
  }

  function cachedNotices() {
    try {
      const value = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }

  function indexNotices(notices = []) {
    noticesByDate = new Map();
    notices.forEach((notice) => {
      const parsed = safeParseMessage(notice?.mensagem);
      if (parsed?.data && !noticesByDate.has(parsed.data)) noticesByDate.set(parsed.data, notice);
    });
    currentNotice = noticesByDate.get(isoDateLocal(nextSaturdayDate())) || null;
  }

  function injectStyles() {
    if (document.getElementById('serviceBranchStylesV30')) return;
    const style = document.createElement('style');
    style.id = 'serviceBranchStylesV30';
    style.textContent = `
      .service-branch-card-v30{margin:16px 0 18px;padding:18px;border:2px solid #f3b61f;border-radius:18px;background:linear-gradient(135deg,#fff8db 0%,#fff 72%);box-shadow:0 10px 26px rgba(10,55,108,.14)}
      .service-branch-top-v30{display:flex;gap:12px;align-items:flex-start}.service-branch-icon-v30{flex:0 0 46px;height:46px;border-radius:14px;display:grid;place-items:center;background:#0a376c;color:#fff;font-size:24px;box-shadow:0 5px 12px rgba(10,55,108,.18)}
      .service-branch-copy-v30{min-width:0;flex:1}.service-branch-kicker-v30{font-size:11px;font-weight:900;letter-spacing:.11em;color:#8a6200;text-transform:uppercase}.service-branch-card-v30 h3{margin:3px 0 8px;color:#0a376c;font-size:20px;line-height:1.2}.service-branch-date-v30{margin:0;font-size:13px;color:#5c6571;text-transform:capitalize}
      .service-branch-name-v30{margin-top:13px;padding:13px 14px;border-radius:14px;background:#0a376c;color:#fff;font-weight:900;font-size:19px;text-align:center;line-height:1.35}.service-branch-pending-v30{background:#eef2f6;color:#59636e}.service-branch-admin-v30{display:flex;justify-content:flex-end;gap:8px;margin-top:12px;flex-wrap:wrap}
      .service-branch-button-v30{border:0;border-radius:11px;padding:10px 13px;font-weight:800;cursor:pointer;background:#0a376c;color:#fff}.service-branch-button-v30.secondary{background:#e9eef5;color:#0a376c}.service-branch-dialog-v30{border:0;border-radius:20px;padding:0;width:min(92vw,500px);box-shadow:0 22px 60px rgba(0,0,0,.28)}.service-branch-dialog-v30::backdrop{background:rgba(4,20,38,.62)}
      .service-branch-dialog-body-v30{padding:22px}.service-branch-dialog-body-v30 h2{margin:4px 0 6px;color:#0a376c}.service-branch-dialog-body-v30 p{color:#626b75;margin:0 0 18px}.service-branch-field-v30{display:grid;gap:7px;font-weight:800;color:#26394d;margin-top:14px}.service-branch-field-v30 input{width:100%;box-sizing:border-box;border:1px solid #cbd4df;border-radius:11px;padding:12px;font:inherit;background:#fff}
      .service-branch-choice-list-v30{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:8px}.service-branch-choice-v30{display:flex;align-items:center;gap:9px;padding:11px 12px;border:1px solid #cbd4df;border-radius:12px;background:#fff;font-weight:800;color:#26394d;cursor:pointer}.service-branch-choice-v30:has(input:checked){border-color:#0a376c;background:#edf4fc;color:#0a376c}.service-branch-choice-v30 input{width:18px;height:18px;margin:0;accent-color:#0a376c}
      .service-branch-choice-help-v30{font-size:12px;color:#697888;font-weight:600;margin-top:7px}.service-branch-actions-v30{display:flex;justify-content:space-between;gap:10px;margin-top:22px;flex-wrap:wrap}.service-branch-actions-right-v30{display:flex;gap:8px;margin-left:auto}.service-branch-danger-v30{border:0;border-radius:11px;padding:10px 12px;background:#b3261e;color:#fff;font-weight:800;cursor:pointer}.service-branch-message-v30{min-height:18px;margin-top:10px!important;font-size:13px;font-weight:700}
      .service-calendar-v50{display:grid;gap:8px;max-height:52vh;overflow:auto;margin-top:14px;padding-right:3px}.service-calendar-row-v50{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:11px;border:1px solid #d5dde7;border-radius:12px;background:#fff}.service-calendar-date-v50{font-weight:900;color:#0a376c;text-transform:capitalize}.service-calendar-name-v50{font-size:13px;color:#616d79;margin-top:3px}.service-calendar-edit-v50{border:0;border-radius:10px;padding:9px 11px;background:#e9eef5;color:#0a376c;font-weight:800;cursor:pointer}.service-calendar-row-v50.current{border-color:#f3b61f;background:#fff8db}
      @media(max-width:540px){.service-branch-card-v30{margin:13px 0 16px;padding:15px}.service-branch-card-v30 h3{font-size:18px}.service-branch-name-v30{font-size:17px}.service-branch-choice-list-v30{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureCard() {
    let card = document.getElementById('serviceBranchCardV30');
    if (card) return card;
    const dashboard = document.getElementById('dashboardView');
    if (!dashboard) return null;
    card = document.createElement('section');
    card.id = 'serviceBranchCardV30';
    card.className = 'service-branch-card-v30';
    card.setAttribute('aria-live', 'polite');
    card.innerHTML = `
      <div class="service-branch-top-v30"><div class="service-branch-icon-v30" aria-hidden="true">📣</div><div class="service-branch-copy-v30"><div class="service-branch-kicker-v30">AVISO IMPORTANTE</div><h3 id="serviceBranchTitleV30">Ramo de serviço do próximo sábado</h3><p id="serviceBranchDateV30" class="service-branch-date-v30"></p></div></div>
      <div id="serviceBranchNameV30" class="service-branch-name-v30 service-branch-pending-v30">Aguardando definição</div>
      <div id="serviceBranchAdminV30" class="service-branch-admin-v30" hidden><button id="serviceBranchEditV30" class="service-branch-button-v30" type="button">Gerenciar calendário</button></div>`;
    const header = dashboard.querySelector('.launch-header');
    if (header) header.insertAdjacentElement('afterend', card); else dashboard.prepend(card);
    card.querySelector('#serviceBranchEditV30')?.addEventListener('click', openEditor);
    return card;
  }

  function ensureCalendarDialog() {
    let dialog = document.getElementById('serviceCalendarDialogV50');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'serviceCalendarDialogV50';
    dialog.className = 'service-branch-dialog-v30';
    dialog.innerHTML = `
      <div class="service-branch-dialog-body-v30">
        <div class="service-branch-kicker-v30">ADMINISTRADOR</div><h2>Calendário do ramo de serviço</h2>
        <p>Programe os próximos sábados. O aviso da tela inicial mudará sozinho na data correta.</p>
        <div id="serviceCalendarListV50" class="service-calendar-v50"></div>
        <div class="service-branch-actions-v30"><div class="service-branch-actions-right-v30"><button id="serviceCalendarCloseV50" class="service-branch-button-v30 secondary" type="button">Fechar</button></div></div>
      </div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('#serviceCalendarCloseV50')?.addEventListener('click', () => dialog.close());
    return dialog;
  }

  function renderCalendar() {
    const wrap = document.getElementById('serviceCalendarListV50');
    if (!wrap) return;
    const expectedDate = isoDateLocal(nextSaturdayDate());
    wrap.innerHTML = '';
    calendarSaturdays().forEach((saturday) => {
      const date = isoDateLocal(saturday);
      const notice = noticesByDate.get(date);
      const responsaveis = responsaveisFromParsed(safeParseMessage(notice?.mensagem));
      const row = document.createElement('div');
      row.className = `service-calendar-row-v50${date === expectedDate ? ' current' : ''}`;
      row.innerHTML = `<div><div class="service-calendar-date-v50"></div><div class="service-calendar-name-v50"></div></div><button class="service-calendar-edit-v50" type="button"></button>`;
      row.querySelector('.service-calendar-date-v50').textContent = formatDateBR(date);
      row.querySelector('.service-calendar-name-v50').textContent = responsaveis.length ? displayResponsaveis(responsaveis) : 'Sem definição';
      const button = row.querySelector('button');
      button.textContent = responsaveis.length ? 'Trocar' : 'Definir';
      button.addEventListener('click', () => openDateEditor(date));
      wrap.appendChild(row);
    });
  }

  function ensureDialog() {
    let dialog = document.getElementById('serviceBranchDialogV30');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'serviceBranchDialogV30';
    dialog.className = 'service-branch-dialog-v30';
    dialog.innerHTML = `
      <form id="serviceBranchFormV30" method="dialog" class="service-branch-dialog-body-v30">
        <div class="service-branch-kicker-v30">ADMINISTRADOR</div><h2>Ramo de serviço</h2>
        <p id="serviceBranchDialogHelpV30">Escolha um ou mais responsáveis pelo serviço do próximo sábado.</p>
        <label class="service-branch-field-v30"><span id="serviceBranchDateLabelV30">Data do próximo sábado</span><input id="serviceBranchDateInputV30" type="text" readonly /></label>
        <div class="service-branch-field-v30"><span>Responsáveis pelo serviço</span><div id="serviceBranchChoicesV30" class="service-branch-choice-list-v30"></div><div class="service-branch-choice-help-v30">Você pode marcar mais de um ramo e também a Diretoria.</div></div>
        <p id="serviceBranchFormMessageV30" class="service-branch-message-v30" role="status"></p>
        <div class="service-branch-actions-v30"><button id="serviceBranchDeleteV30" class="service-branch-danger-v30" type="button" hidden>Apagar aviso</button><div class="service-branch-actions-right-v30"><button id="serviceBranchCancelV30" class="service-branch-button-v30 secondary" type="button">Cancelar</button><button id="serviceBranchSaveV30" class="service-branch-button-v30" type="submit">Salvar aviso</button></div></div>
      </form>`;
    document.body.appendChild(dialog);
    dialog.querySelector('#serviceBranchCancelV30')?.addEventListener('click', () => dialog.close());
    dialog.querySelector('#serviceBranchDeleteV30')?.addEventListener('click', deleteNotice);
    dialog.querySelector('#serviceBranchFormV30')?.addEventListener('submit', async (event) => { event.preventDefault(); await saveNotice(); });
    return dialog;
  }

  function render() {
    const card = ensureCard();
    if (!card) return;
    const expectedDate = isoDateLocal(nextSaturdayDate());
    const parsed = currentNotice ? safeParseMessage(currentNotice.mensagem) : null;
    const responsaveis = responsaveisFromParsed(parsed);
    const valid = parsed && parsed.data === expectedDate && responsaveis.length > 0;
    const titleEl = document.getElementById('serviceBranchTitleV30');
    const dateEl = document.getElementById('serviceBranchDateV30');
    const nameEl = document.getElementById('serviceBranchNameV30');
    const adminWrap = document.getElementById('serviceBranchAdminV30');
    const editButton = document.getElementById('serviceBranchEditV30');
    if (titleEl) titleEl.textContent = serviceHeading();
    if (dateEl) dateEl.textContent = formatDateBR(expectedDate);
    if (nameEl) {
      nameEl.textContent = valid ? displayResponsaveis(responsaveis) : 'Aguardando definição';
      nameEl.classList.toggle('service-branch-pending-v30', !valid);
    }
    const isAdmin = currentProfile?.tipo === 'administrador';
    if (adminWrap) adminWrap.hidden = !isAdmin;
    if (editButton) editButton.textContent = 'Gerenciar calendário';
  }

  async function loadProfile() {
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) { currentProfile = null; render(); return false; }
    const { data } = await client.from('perfis_usuarios').select('tipo,ativo').eq('user_id', session.user.id).maybeSingle();
    currentProfile = data?.ativo ? data : null;
    render();
    return !!currentProfile;
  }

  async function loadRamos() {
    if (ramos.length) return ramos;
    const { data, error } = await client.from('ramos').select('id,nome').order('id');
    if (!error && Array.isArray(data)) ramos = data;
    return ramos;
  }

  async function loadNotice() {
    if (loading) return;
    loading = true;
    try {
      const { data, error } = await client.from('avisos').select('id,titulo,mensagem,aviso_geral,destaque,publicado_em,expira_em,ativo').eq('titulo', SERVICE_TITLE).eq('aviso_geral', true).eq('ativo', true).order('id', { ascending: false }).limit(200);
      if (error) indexNotices(cachedNotices());
      else {
        const notices = Array.isArray(data) ? data : [];
        indexNotices(notices);
        cacheNotices(notices);
      }
    } catch (_) { indexNotices(cachedNotices()); }
    finally { loading = false; render(); renderCalendar(); }
  }

  function renderChoices(selectedKeys = new Set()) {
    const wrap = document.getElementById('serviceBranchChoicesV30');
    if (!wrap) return;
    const choices = [
      ...ramos.map((ramo) => ({ tipo: 'ramo', id: Number(ramo.id), nome: ramo.nome })),
      { tipo: 'diretoria', id: 'diretoria', nome: 'Diretoria' }
    ];
    wrap.innerHTML = '';
    choices.forEach((item) => {
      const key = responsibleKey(item);
      const label = document.createElement('label');
      label.className = 'service-branch-choice-v30';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = key;
      input.dataset.tipo = item.tipo;
      input.dataset.id = String(item.id);
      input.dataset.nome = item.nome;
      input.checked = selectedKeys.has(key);
      const span = document.createElement('span');
      span.textContent = item.nome;
      label.append(input, span);
      wrap.appendChild(label);
    });
  }

  async function openEditor() {
    if (currentProfile?.tipo !== 'administrador') return;
    await loadRamos();
    ensureCalendarDialog();
    renderCalendar();
    document.getElementById('serviceCalendarDialogV50')?.showModal();
  }

  function openDateEditor(date) {
    editorDate = date;
    const dialog = ensureDialog();
    const notice = noticesByDate.get(date) || null;
    const parsed = safeParseMessage(notice?.mensagem);
    const selected = new Set(responsaveisFromParsed(parsed).map(responsibleKey));
    renderChoices(selected);
    const dateInput = document.getElementById('serviceBranchDateInputV30');
    const help = document.getElementById('serviceBranchDialogHelpV30');
    const dateLabel = document.getElementById('serviceBranchDateLabelV30');
    const message = document.getElementById('serviceBranchFormMessageV30');
    const deleteButton = document.getElementById('serviceBranchDeleteV30');
    if (dateInput) dateInput.value = formatDateBR(date);
    if (help) help.textContent = 'Escolha um ou mais ramos e/ou a Diretoria para esta data.';
    if (dateLabel) dateLabel.textContent = 'Sábado selecionado';
    if (message) message.textContent = '';
    if (deleteButton) deleteButton.hidden = !notice;
    dialog.showModal();
  }

  function selectedResponsaveis() {
    return [...document.querySelectorAll('#serviceBranchChoicesV30 input[type="checkbox"]:checked')].map((input) => ({
      tipo: input.dataset.tipo === 'diretoria' ? 'diretoria' : 'ramo',
      id: input.dataset.tipo === 'diretoria' ? 'diretoria' : Number(input.dataset.id),
      nome: input.dataset.nome || ''
    })).filter((item) => item.nome);
  }

  async function saveNotice() {
    if (currentProfile?.tipo !== 'administrador') return;
    const message = document.getElementById('serviceBranchFormMessageV30');
    const saveButton = document.getElementById('serviceBranchSaveV30');
    const responsaveis = selectedResponsaveis();
    if (!responsaveis.length) { if (message) message.textContent = 'Selecione pelo menos um responsável.'; return; }
    const data = editorDate || isoDateLocal(nextSaturdayDate());
    const ramosSelecionados = responsaveis.filter((item) => item.tipo === 'ramo');
    const payloadMessage = JSON.stringify({
      tipo: 'ramo_servico_sabado', data, responsaveis,
      ramo_ids: ramosSelecionados.map((item) => item.id),
      ramo_nomes: ramosSelecionados.map((item) => item.nome),
      inclui_diretoria: responsaveis.some((item) => item.tipo === 'diretoria'),
      ramo_id: ramosSelecionados[0]?.id || null,
      ramo_nome: displayResponsaveis(responsaveis)
    });
    const payload = { titulo: SERVICE_TITLE, mensagem: payloadMessage, aviso_geral: true, destaque: true, publicado_em: new Date().toISOString(), expira_em: saturdayExpiryIso(data), ativo: true };
    if (saveButton) saveButton.disabled = true;
    if (message) message.textContent = 'Salvando...';
    const existingNotice = noticesByDate.get(data);
    const response = existingNotice?.id
      ? await client.from('avisos').update(payload).eq('id', existingNotice.id).select().single()
      : await client.from('avisos').insert(payload).select().single();
    if (saveButton) saveButton.disabled = false;
    if (response.error) { if (message) message.textContent = `Não foi possível salvar: ${response.error.message}`; return; }
    noticesByDate.set(data, response.data);
    currentNotice = noticesByDate.get(isoDateLocal(nextSaturdayDate())) || null;
    cacheNotices([...noticesByDate.values()]);
    render();
    renderCalendar();
    document.getElementById('serviceBranchDialogV30')?.close();
  }

  async function deleteNotice() {
    const notice = noticesByDate.get(editorDate);
    if (currentProfile?.tipo !== 'administrador' || !notice?.id) return;
    const message = document.getElementById('serviceBranchFormMessageV30');
    const button = document.getElementById('serviceBranchDeleteV30');
    if (button) button.disabled = true;
    if (message) message.textContent = 'Apagando...';
    const { error } = await client.from('avisos').delete().eq('id', notice.id);
    if (button) button.disabled = false;
    if (error) { if (message) message.textContent = `Não foi possível apagar: ${error.message}`; return; }
    noticesByDate.delete(editorDate);
    currentNotice = noticesByDate.get(isoDateLocal(nextSaturdayDate())) || null;
    cacheNotices([...noticesByDate.values()]);
    render();
    renderCalendar();
    document.getElementById('serviceBranchDialogV30')?.close();
  }

  async function refreshAll() {
    if (!client) return;
    const hasProfile = await loadProfile();
    if (!hasProfile) return;
    await loadNotice();
  }

  function observeDashboard() {
    const dashboard = document.getElementById('dashboardView');
    if (!dashboard) return;
    let wasVisible = !dashboard.classList.contains('hidden');
    const observer = new MutationObserver(() => {
      const visible = !dashboard.classList.contains('hidden');
      if (visible && !wasVisible) refreshAll();
      wasVisible = visible;
    });
    observer.observe(dashboard, { attributes: true, attributeFilter: ['class'] });
  }

  async function init() {
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY || !window.supabase) return;
    injectStyles(); ensureCard(); ensureDialog(); ensureCalendarDialog();
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
    observeDashboard();
    client.auth.onAuthStateChange(() => setTimeout(refreshAll, 0));
    await refreshAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
