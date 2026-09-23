(() => {
  if (window.__GEARPC_SERVICE_BRANCH_PILOT_V66__) return;
  window.__GEARPC_SERVICE_BRANCH_PILOT_V66__ = true;

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const CACHE_KEY = 'gearpc_service_branch_exceptions_v66';
  let rt = null;
  let isAdmin = false;
  let exceptions = new Map();
  let savingSpecial = false;

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

  function dateFromText(text) {
    const match = String(text || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
  }

  async function waitRuntime() {
    for (let i = 0; i < 120; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.profile && x?.state?.user?.id) return x;
      await sleep(150);
    }
    return null;
  }

  async function isEnabledProfile() {
    return Boolean(rt.state.profile && rt.state.user?.id);
  }

  function injectStyles() {
    if ($('serviceBranchPilotStylesV66')) return;
    const style = document.createElement('style');
    style.id = 'serviceBranchPilotStylesV66';
    style.textContent = `
      .service-branch-no-section-v66{grid-column:1/-1;border-color:#9aa9b8!important;background:#f5f7f9!important}
      .service-branch-no-section-v66:has(input:checked){border-color:#44556a!important;background:#e9edf1!important;color:#253647!important}
      .service-branch-no-section-note-v66{display:block;font-size:11px;font-weight:600;color:#687887;margin-top:2px}
      .service-branch-card-v66-special #serviceBranchNameV30{background:#44556a!important;color:#fff!important}
    `;
    document.head.appendChild(style);
  }

  function readCache() {
    try {
      const rows = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
      if (Array.isArray(rows)) exceptions = new Map(rows.map((r) => [r.data, r]));
    } catch (_) {}
  }

  function writeCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify([...exceptions.values()])); } catch (_) {}
  }

  async function loadExceptions() {
    const { data, error } = await rt.client.from('ramo_servico_excecoes')
      .select('data,situacao,atualizado_em')
      .gte('data', isoDateLocal(nextSaturdayDate()))
      .order('data');
    if (!error) {
      exceptions = new Map((data || []).map((r) => [r.data, r]));
      writeCache();
    } else {
      readCache();
    }
    ensureSpecialChoice();
    decorateCalendar();
    applyCard();
  }

  function removeOldSeparateUi() {
    $('serviceBranchExceptionsButtonV64')?.remove();
    $('serviceBranchExceptionsDialogV64')?.remove();
  }

  function currentEditorDate() {
    return dateFromText($('serviceBranchDateInputV30')?.value || '');
  }

  function ensureSpecialChoice() {
    const wrap = $('serviceBranchChoicesV30');
    if (!wrap || !isAdmin) return;
    let label = $('serviceBranchNoSectionV66');
    if (!label) {
      label = document.createElement('label');
      label.id = 'serviceBranchNoSectionV66';
      label.className = 'service-branch-choice-v30 service-branch-no-section-v66';
      label.innerHTML = `
        <input id="serviceBranchNoSectionInputV66" type="checkbox">
        <span><strong>Nenhuma seção na sede</strong><small class="service-branch-no-section-note-v66">Neste sábado não haverá ramo de serviço.</small></span>`;
      wrap.prepend(label);
      label.querySelector('input')?.addEventListener('change', toggleNormalChoices);
    }

    const date = currentEditorDate();
    const checked = date && exceptions.get(date)?.situacao === 'nenhuma_secao_sede';
    const input = $('serviceBranchNoSectionInputV66');
    if (input) input.checked = Boolean(checked);
    toggleNormalChoices();
  }

  function toggleNormalChoices() {
    const wrap = $('serviceBranchChoicesV30');
    const special = $('serviceBranchNoSectionInputV66')?.checked === true;
    if (!wrap) return;
    [...wrap.querySelectorAll('input[type="checkbox"]')].forEach((input) => {
      if (input.id === 'serviceBranchNoSectionInputV66') return;
      input.disabled = special;
    });
    const help = wrap.parentElement?.querySelector('.service-branch-choice-help-v30');
    if (help) {
      help.textContent = special
        ? 'Nenhum ramo precisa ser escolhido para este sábado.'
        : 'Você pode marcar um ou mais ramos e também a Diretoria.';
    }
  }

  function calendarDate(row) {
    return dateFromText(row?.querySelector('.service-calendar-date-v50')?.textContent || '');
  }

  function decorateCalendar() {
    document.querySelectorAll('#serviceCalendarListV50 .service-calendar-row-v50').forEach((row) => {
      const date = calendarDate(row);
      if (!date || exceptions.get(date)?.situacao !== 'nenhuma_secao_sede') return;
      const name = row.querySelector('.service-calendar-name-v50');
      const button = row.querySelector('.service-calendar-edit-v50');
      if (name && name.textContent !== 'Nenhuma seção na sede') name.textContent = 'Nenhuma seção na sede';
      if (button && button.textContent !== 'Alterar') button.textContent = 'Alterar';
    });
  }

  function applyCard() {
    const date = isoDateLocal(nextSaturdayDate());
    const special = exceptions.get(date)?.situacao === 'nenhuma_secao_sede';
    const card = $('serviceBranchCardV30');
    const name = $('serviceBranchNameV30');
    const icon = card?.querySelector('.service-branch-icon-v30');
    if (!card || !name || !icon) return;

    if (special) {
      if (!card.classList.contains('service-branch-card-v66-special')) card.classList.add('service-branch-card-v66-special');
      if (name.textContent !== 'Nenhuma seção na sede — não haverá ramo de serviço') name.textContent = 'Nenhuma seção na sede — não haverá ramo de serviço';
      if (name.classList.contains('service-branch-pending-v30')) name.classList.remove('service-branch-pending-v30');
      if (icon.textContent !== '🏕️') icon.textContent = '🏕️';
    } else {
      if (card.classList.contains('service-branch-card-v66-special')) card.classList.remove('service-branch-card-v66-special');
      if (icon.textContent === '🏕️') icon.textContent = '📣';
    }
  }

  async function saveSpecial(event) {
    if (!isAdmin || savingSpecial) return;
    const form = $('serviceBranchFormV30');
    if (!form) return;

    if (form.dataset.serviceBranchV66Bypass === '1') {
      delete form.dataset.serviceBranchV66Bypass;
      return;
    }

    const date = currentEditorDate();
    if (!date) return;
    const special = $('serviceBranchNoSectionInputV66')?.checked === true;
    const hasExistingSpecial = exceptions.get(date)?.situacao === 'nenhuma_secao_sede';

    if (!special && !hasExistingSpecial) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const message = $('serviceBranchFormMessageV30');
    const saveButton = $('serviceBranchSaveV30');
    savingSpecial = true;
    if (saveButton) saveButton.disabled = true;
    if (message) message.textContent = 'Salvando...';

    try {
      if (special) {
        const { error } = await rt.client.from('ramo_servico_excecoes').upsert({
          data: date,
          situacao: 'nenhuma_secao_sede',
          criado_por: rt.state.user.id,
          atualizado_em: new Date().toISOString()
        }, { onConflict:'data' });
        if (error) throw error;

        exceptions.set(date, { data:date, situacao:'nenhuma_secao_sede', atualizado_em:new Date().toISOString() });
        writeCache();
        if (message) message.textContent = 'Salvo.';
        decorateCalendar();
        applyCard();
        $('serviceBranchDialogV30')?.close();
        return;
      }

      const { error } = await rt.client.from('ramo_servico_excecoes').delete().eq('data', date);
      if (error) throw error;
      exceptions.delete(date);
      writeCache();
      if (message) message.textContent = 'Salvando ramo de serviço...';

      form.dataset.serviceBranchV66Bypass = '1';
      if (saveButton) saveButton.disabled = false;
      savingSpecial = false;
      form.requestSubmit();
      return;
    } catch (error) {
      console.error('Ramo de serviço:', error);
      if (message) message.textContent = `Não foi possível salvar: ${error?.message || 'erro inesperado'}`;
    } finally {
      if (savingSpecial) {
        savingSpecial = false;
        if (saveButton) saveButton.disabled = false;
      }
    }
  }

  function observeDialog() {
    const dialog = $('serviceBranchDialogV30');
    if (!dialog) return;
    new MutationObserver(() => {
      if (!dialog.open) return;
      setTimeout(() => ensureSpecialChoice(), 20);
    }).observe(dialog, { attributes:true, attributeFilter:['open'] });
  }

  function observeCalendar() {
    const wrap = $('serviceCalendarListV50');
    if (!wrap) return;
    let timer = null;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(decorateCalendar, 30);
    }).observe(wrap, { childList:true, subtree:true });
  }

  function observeCard() {
    const name = $('serviceBranchNameV30');
    if (!name) return;
    let timer = null;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(applyCard, 30);
    }).observe(name, { childList:true, characterData:true, subtree:true });
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt || !(await isEnabledProfile())) return;
    isAdmin = rt.state.profile?.tipo === 'administrador';
    injectStyles();
    removeOldSeparateUi();
    readCache();

    const form = $('serviceBranchFormV30');
    form?.addEventListener('submit', (event) => { void saveSpecial(event); }, true);

    observeDialog();
    observeCalendar();
    observeCard();
    await loadExceptions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { void boot(); }, { once:true });
  } else {
    void boot();
  }
})();