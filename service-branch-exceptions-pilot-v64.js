(() => {
  if (window.__GEARPC_SERVICE_BRANCH_UNIFIED_V65__) return;
  window.__GEARPC_SERVICE_BRANCH_UNIFIED_V65__ = true;

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const SERVICE_TITLE = 'Ramo de serviço do próximo sábado';
  const EXCEPTION_CACHE = 'gearpc_service_branch_exceptions_v65';
  const BASE_CACHE = 'gearpc_service_branch_calendar_v50';

  let rt = null;
  let isAdmin = false;
  let activeDate = '';
  let exceptions = new Map();
  let saving = false;

  function nextSaturdayDate(base = new Date()) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0, 0);
    const days = (6 - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + days);
    return d;
  }

  function isoDateLocal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function dateFromBR(text) {
    const match = String(text || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
  }

  function saturdayExpiryIso(isoDate) {
    const [y,m,d] = String(isoDate).split('-').map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
  }

  function safeParse(value) {
    try {
      const parsed = JSON.parse(value || '{}');
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) { return null; }
  }

  function responsaveisFromParsed(parsed) {
    if (!parsed) return [];
    if (Array.isArray(parsed.responsaveis) && parsed.responsaveis.length) {
      return parsed.responsaveis.filter((x) => x?.nome).map((x) => ({
        tipo: x.tipo === 'diretoria' ? 'diretoria' : 'ramo',
        id: x.tipo === 'diretoria' ? 'diretoria' : Number(x.id),
        nome: String(x.nome)
      }));
    }
    if (Array.isArray(parsed.ramo_nomes) && parsed.ramo_nomes.length) {
      return parsed.ramo_nomes.map((nome, index) => ({
        tipo:'ramo', id:Number(parsed.ramo_ids?.[index] || 0), nome:String(nome)
      }));
    }
    if (parsed.ramo_nome) {
      return [{ tipo:'ramo', id:Number(parsed.ramo_id || 0), nome:String(parsed.ramo_nome) }];
    }
    return [];
  }

  function keyOf(item) {
    return item.tipo === 'diretoria' ? 'diretoria' : `ramo:${Number(item.id)}`;
  }

  function displayResponsaveis(items) {
    return (items || []).map((x) => x.nome).filter(Boolean).join(' • ');
  }

  async function waitRuntime() {
    for (let i = 0; i < 120; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.profile && x?.state?.user?.id) return x;
      await sleep(150);
    }
    return null;
  }

  async function pilotProfile() {
    if (rt.state.profile?.tipo === 'administrador') return true;
    const { data, error } = await rt.client.from('perfis_usuarios')
      .select('eh_teste').eq('user_id', rt.state.user.id).maybeSingle();
    return !error && data?.eh_teste === true;
  }

  function injectStyles() {
    if ($('serviceBranchUnifiedStylesV65')) return;
    const style = document.createElement('style');
    style.id = 'serviceBranchUnifiedStylesV65';
    style.textContent = `
      .service-branch-mode-v65{display:grid;gap:8px;margin-top:14px}
      .service-branch-mode-v65>span{font-weight:800;color:#26394d}
      .service-branch-mode-options-v65{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .service-branch-mode-option-v65{display:flex;align-items:center;gap:9px;border:1px solid #cbd4df;border-radius:12px;padding:11px;background:#fff;font-weight:800;color:#26394d;cursor:pointer}
      .service-branch-mode-option-v65:has(input:checked){border-color:#0a376c;background:#edf4fc;color:#0a376c}
      .service-branch-mode-option-v65 input{width:18px;height:18px;margin:0;accent-color:#0a376c}
      .service-branch-field-hidden-v65{display:none!important}
      .service-branch-special-v65{background:linear-gradient(135deg,#f3f5f7 0%,#fff 78%)!important;border-color:#8b98a6!important}
      .service-branch-special-v65 #serviceBranchNameV30{background:#44556a!important;color:#fff!important}
      @media(max-width:540px){.service-branch-mode-options-v65{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function removeOldExceptionUi() {
    $('serviceBranchExceptionsButtonV64')?.remove();
    $('serviceBranchExceptionsDialogV64')?.remove();
  }

  function ensureModeUi() {
    const form = $('serviceBranchFormV30');
    const choices = $('serviceBranchChoicesV30');
    if (!form || !choices) return;
    if (!$('serviceBranchModeV65')) {
      const wrap = document.createElement('div');
      wrap.id = 'serviceBranchModeV65';
      wrap.className = 'service-branch-mode-v65';
      wrap.innerHTML = `
        <span>Situação deste sábado</span>
        <div class="service-branch-mode-options-v65">
          <label class="service-branch-mode-option-v65"><input type="radio" name="serviceBranchModeV65" value="normal" checked><span>Ramo de serviço</span></label>
          <label class="service-branch-mode-option-v65"><input type="radio" name="serviceBranchModeV65" value="nenhuma_secao_sede"><span>Nenhuma seção na sede</span></label>
        </div>`;
      choices.closest('.service-branch-field-v30')?.insertAdjacentElement('beforebegin', wrap);
      wrap.addEventListener('change', applyModeVisibility);
    }
    applyModeVisibility();
  }

  function mode() {
    return document.querySelector('input[name="serviceBranchModeV65"]:checked')?.value || 'normal';
  }

  function applyModeVisibility() {
    const special = mode() === 'nenhuma_secao_sede';
    const field = $('serviceBranchChoicesV30')?.closest('.service-branch-field-v30');
    field?.classList.toggle('service-branch-field-hidden-v65', special);
    const help = $('serviceBranchDialogHelpV30');
    if (help) {
      help.textContent = special
        ? 'Neste sábado não haverá nenhuma seção na sede.'
        : 'Escolha um ou mais ramos e/ou a Diretoria para esta data.';
    }
  }

  function readExceptionCache() {
    try {
      const rows = JSON.parse(localStorage.getItem(EXCEPTION_CACHE) || '[]');
      if (Array.isArray(rows)) exceptions = new Map(rows.map((x) => [x.data, x]));
    } catch (_) {}
  }

  function writeExceptionCache() {
    try { localStorage.setItem(EXCEPTION_CACHE, JSON.stringify([...exceptions.values()])); } catch (_) {}
  }

  async function loadExceptions() {
    const { data, error } = await rt.client.from('ramo_servico_excecoes')
      .select('data,situacao,atualizado_em')
      .gte('data', isoDateLocal(nextSaturdayDate()))
      .order('data');
    if (!error) {
      exceptions = new Map((data || []).map((x) => [x.data, x]));
      writeExceptionCache();
    } else {
      readExceptionCache();
    }
    decorateCalendar();
    await refreshCard();
  }

  async function findNotice(date) {
    const { data, error } = await rt.client.from('avisos')
      .select('id,titulo,mensagem,aviso_geral,destaque,publicado_em,expira_em,ativo')
      .eq('titulo', SERVICE_TITLE)
      .eq('aviso_geral', true)
      .eq('ativo', true)
      .order('id', { ascending:false })
      .limit(200);
    if (error) throw error;
    return (data || []).find((n) => safeParse(n.mensagem)?.data === date) || null;
  }

  function setSelectedResponsaveis(responsaveis) {
    const keys = new Set((responsaveis || []).map(keyOf));
    document.querySelectorAll('#serviceBranchChoicesV30 input[type="checkbox"]').forEach((input) => {
      input.checked = keys.has(input.value);
    });
  }

  async function syncEditor(date) {
    if (!date) return;
    activeDate = date;
    ensureModeUi();
    const special = exceptions.get(date)?.situacao === 'nenhuma_secao_sede';
    const radio = document.querySelector(`input[name="serviceBranchModeV65"][value="${special ? 'nenhuma_secao_sede' : 'normal'}"]`);
    if (radio) radio.checked = true;

    try {
      const notice = await findNotice(date);
      setSelectedResponsaveis(responsaveisFromParsed(safeParse(notice?.mensagem)));
    } catch (_) {}
    applyModeVisibility();
    const msg = $('serviceBranchFormMessageV30');
    if (msg) msg.textContent = '';
  }

  function selectedResponsaveis() {
    return [...document.querySelectorAll('#serviceBranchChoicesV30 input[type="checkbox"]:checked')]
      .map((input) => ({
        tipo: input.dataset.tipo === 'diretoria' ? 'diretoria' : 'ramo',
        id: input.dataset.tipo === 'diretoria' ? 'diretoria' : Number(input.dataset.id),
        nome: input.dataset.nome || ''
      })).filter((x) => x.nome);
  }

  function updateBaseCache(notice) {
    if (!notice) return;
    try {
      const rows = JSON.parse(localStorage.getItem(BASE_CACHE) || '[]');
      const list = Array.isArray(rows) ? rows : [];
      const date = safeParse(notice.mensagem)?.data;
      const filtered = list.filter((n) => safeParse(n?.mensagem)?.data !== date);
      filtered.unshift(notice);
      localStorage.setItem(BASE_CACHE, JSON.stringify(filtered));
    } catch (_) {}
  }

  function calendarRowDate(row) {
    return dateFromBR(row?.querySelector('.service-calendar-date-v50')?.textContent || '');
  }

  function setCalendarRow(date, text) {
    document.querySelectorAll('#serviceCalendarListV50 .service-calendar-row-v50').forEach((row) => {
      if (calendarRowDate(row) !== date) return;
      const name = row.querySelector('.service-calendar-name-v50');
      const button = row.querySelector('.service-calendar-edit-v50');
      if (name) name.textContent = text;
      if (button) button.textContent = 'Trocar';
    });
  }

  function decorateCalendar() {
    document.querySelectorAll('#serviceCalendarListV50 .service-calendar-row-v50').forEach((row) => {
      const date = calendarRowDate(row);
      if (!date || !exceptions.has(date)) return;
      const name = row.querySelector('.service-calendar-name-v50');
      const button = row.querySelector('.service-calendar-edit-v50');
      if (name) name.textContent = 'Nenhuma seção na sede';
      if (button) button.textContent = 'Alterar';
    });
  }

  async function refreshCard(normalOverride = '') {
    const card = $('serviceBranchCardV30');
    const name = $('serviceBranchNameV30');
    const icon = card?.querySelector('.service-branch-icon-v30');
    if (!card || !name || !icon) return;
    const date = isoDateLocal(nextSaturdayDate());

    if (exceptions.get(date)?.situacao === 'nenhuma_secao_sede') {
      card.classList.add('service-branch-special-v65');
      name.classList.remove('service-branch-pending-v30');
      name.textContent = 'Nenhuma seção na sede — não haverá ramo de serviço';
      icon.textContent = '🏕️';
      return;
    }

    card.classList.remove('service-branch-special-v65');
    icon.textContent = '📣';
    if (normalOverride) {
      name.textContent = normalOverride;
      name.classList.remove('service-branch-pending-v30');
      return;
    }
    try {
      const notice = await findNotice(date);
      const resp = responsaveisFromParsed(safeParse(notice?.mensagem));
      name.textContent = resp.length ? displayResponsaveis(resp) : 'Aguardando definição';
      name.classList.toggle('service-branch-pending-v30', !resp.length);
    } catch (_) {}
  }

  async function saveUnified(event) {
    if (!isAdmin || saving) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const message = $('serviceBranchFormMessageV30');
    const button = $('serviceBranchSaveV30');
    const date = activeDate || dateFromBR($('serviceBranchDateInputV30')?.value || '');
    if (!date) {
      if (message) message.textContent = 'Não foi possível identificar o sábado selecionado.';
      return;
    }

    saving = true;
    if (button) button.disabled = true;
    if (message) message.textContent = 'Salvando...';

    try {
      if (mode() === 'nenhuma_secao_sede') {
        const { data, error } = await rt.client.from('ramo_servico_excecoes').upsert({
          data:date,
          situacao:'nenhuma_secao_sede',
          criado_por:rt.state.user.id,
          atualizado_em:new Date().toISOString()
        }, { onConflict:'data' }).select('data,situacao,atualizado_em').single();
        if (error) throw error;
        exceptions.set(date, data);
        writeExceptionCache();
        setCalendarRow(date, 'Nenhuma seção na sede');
        await refreshCard();
        if (message) message.textContent = 'Salvo.';
        $('serviceBranchDialogV30')?.close();
        return;
      }

      const responsaveis = selectedResponsaveis();
      if (!responsaveis.length) {
        if (message) message.textContent = 'Selecione pelo menos um ramo ou a Diretoria.';
        return;
      }

      const { error:deleteError } = await rt.client.from('ramo_servico_excecoes').delete().eq('data', date);
      if (deleteError) throw deleteError;
      exceptions.delete(date);
      writeExceptionCache();

      const ramos = responsaveis.filter((x) => x.tipo === 'ramo');
      const payloadMessage = JSON.stringify({
        tipo:'ramo_servico_sabado',
        data,
        responsaveis,
        ramo_ids:ramos.map((x) => x.id),
        ramo_nomes:ramos.map((x) => x.nome),
        inclui_diretoria:responsaveis.some((x) => x.tipo === 'diretoria'),
        ramo_id:ramos[0]?.id || null,
        ramo_nome:displayResponsaveis(responsaveis)
      });
      const payload = {
        titulo:SERVICE_TITLE,
        mensagem:payloadMessage,
        aviso_geral:true,
        destaque:true,
        publicado_em:new Date().toISOString(),
        expira_em:saturdayExpiryIso(date),
        ativo:true
      };

      const existing = await findNotice(date);
      const response = existing?.id
        ? await rt.client.from('avisos').update(payload).eq('id', existing.id)
            .select('id,titulo,mensagem,aviso_geral,destaque,publicado_em,expira_em,ativo').single()
        : await rt.client.from('avisos').insert(payload)
            .select('id,titulo,mensagem,aviso_geral,destaque,publicado_em,expira_em,ativo').single();

      if (response.error) throw response.error;
      updateBaseCache(response.data);
      const label = displayResponsaveis(responsaveis);
      setCalendarRow(date, label);
      if (date === isoDateLocal(nextSaturdayDate())) await refreshCard(label);
      else await refreshCard();

      if (message) message.textContent = 'Ramo de serviço salvo.';
      $('serviceBranchDialogV30')?.close();
    } catch (error) {
      console.error('GEArPC ramo de serviço:', error);
      if (message) message.textContent = `Não foi possível salvar: ${error?.message || 'erro inesperado'}`;
    } finally {
      saving = false;
      if (button) button.disabled = false;
    }
  }

  function bind() {
    const form = $('serviceBranchFormV30');
    form?.addEventListener('submit', (event) => { void saveUnified(event); }, true);

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest('.service-calendar-edit-v50');
      if (!button) return;
      const row = button.closest('.service-calendar-row-v50');
      activeDate = calendarRowDate(row);
      setTimeout(() => { void syncEditor(activeDate); }, 50);
    }, true);

    const dialog = $('serviceBranchDialogV30');
    if (dialog) new MutationObserver(() => {
      if (!dialog.open) return;
      const date = activeDate || dateFromBR($('serviceBranchDateInputV30')?.value || '');
      if (date) setTimeout(() => { void syncEditor(date); }, 20);
    }).observe(dialog, { attributes:true, attributeFilter:['open'] });

    const calendar = $('serviceCalendarListV50');
    if (calendar) new MutationObserver(() => decorateCalendar()).observe(calendar, { childList:true, subtree:true });

    const card = $('serviceBranchCardV30');
    if (card) new MutationObserver(() => setTimeout(() => { void refreshCard(); }, 30))
      .observe(card, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['class'] });
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt || !(await pilotProfile())) return;
    isAdmin = rt.state.profile?.tipo === 'administrador';
    injectStyles();
    removeOldExceptionUi();
    ensureModeUi();
    readExceptionCache();
    bind();
    await loadExceptions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { void boot(); }, { once:true });
  } else {
    void boot();
  }
})();