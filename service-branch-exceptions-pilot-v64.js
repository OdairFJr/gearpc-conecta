(() => {
  if (window.__GEARPC_SERVICE_BRANCH_EXCEPTIONS_V64__) return;
  window.__GEARPC_SERVICE_BRANCH_EXCEPTIONS_V64__ = true;

  const CACHE_KEY = 'gearpc_service_branch_exceptions_v64';
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let rt = null;
  let isAdmin = false;
  let exceptions = new Map();
  let cardSnapshot = null;

  const LABELS = {
    sede_indisponivel: 'Sede indisponível — não haverá ramo de serviço',
    nenhuma_secao_sede: 'Nenhuma seção em sede — não haverá ramo de serviço'
  };

  const ICONS = {
    sede_indisponivel: '🚫',
    nenhuma_secao_sede: '🏕️'
  };

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

  function isoDateLocal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDateBR(isoDate) {
    const [y,m,d] = String(isoDate).split('-').map(Number);
    return new Date(y,m-1,d,12,0,0).toLocaleDateString('pt-BR', {
      weekday:'long', day:'2-digit', month:'2-digit', year:'numeric'
    });
  }

  async function waitRuntime() {
    for (let i = 0; i < 120; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.profile && x?.state?.user?.id) return x;
      await sleep(150);
    }
    return null;
  }

  async function isPilotProfile() {
    if (rt.state.profile?.tipo === 'administrador') return true;
    const { data, error } = await rt.client
      .from('perfis_usuarios')
      .select('eh_teste')
      .eq('user_id', rt.state.user.id)
      .maybeSingle();
    return !error && data?.eh_teste === true;
  }

  function injectStyles() {
    if ($('serviceBranchExceptionsStylesV64')) return;
    const style = document.createElement('style');
    style.id = 'serviceBranchExceptionsStylesV64';
    style.textContent = `
      .service-branch-special-v64{background:linear-gradient(135deg,#f3f5f7 0%,#fff 78%)!important;border-color:#8b98a6!important}
      .service-branch-special-v64 #serviceBranchNameV30{background:#44556a!important;color:#fff!important}
      .service-exceptions-dialog-v64{border:0;border-radius:20px;padding:0;width:min(94vw,620px);max-height:88vh;box-shadow:0 22px 60px rgba(0,0,0,.28)}
      .service-exceptions-dialog-v64::backdrop{background:rgba(4,20,38,.62)}
      .service-exceptions-body-v64{padding:22px}
      .service-exceptions-body-v64 h2{margin:4px 0 6px;color:#0a376c}
      .service-exceptions-body-v64>p{margin:0 0 15px;color:#626b75;line-height:1.45}
      .service-exceptions-list-v64{display:grid;gap:9px;max-height:58vh;overflow:auto;padding-right:3px}
      .service-exception-row-v64{display:grid;grid-template-columns:minmax(0,1fr) minmax(190px,1fr) auto;gap:9px;align-items:center;padding:11px;border:1px solid #d5dde7;border-radius:12px;background:#fff}
      .service-exception-date-v64{font-weight:900;color:#0a376c;text-transform:capitalize}
      .service-exception-row-v64 select{width:100%;border:1px solid #cbd4df;border-radius:10px;padding:9px;font:inherit;background:#fff;color:#26394d}
      .service-exception-save-v64{border:0;border-radius:10px;padding:9px 11px;background:#0a376c;color:#fff;font-weight:800}
      .service-exception-saved-v64{font-size:12px;color:#2f6f45;margin-top:4px;min-height:16px}
      .service-exceptions-actions-v64{display:flex;justify-content:flex-end;margin-top:16px}
      @media(max-width:560px){.service-exception-row-v64{grid-template-columns:1fr}.service-exception-save-v64{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function readCache() {
    try {
      const rows = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
      if (Array.isArray(rows)) {
        exceptions = new Map(rows.map((r) => [r.data, r]));
      }
    } catch (_) {}
  }

  function writeCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify([...exceptions.values()])); } catch (_) {}
  }

  async function loadExceptions() {
    const { data, error } = await rt.client
      .from('ramo_servico_excecoes')
      .select('data,situacao,atualizado_em')
      .gte('data', isoDateLocal(nextSaturdayDate()))
      .order('data');
    if (error) {
      readCache();
    } else {
      exceptions = new Map((data || []).map((r) => [r.data, r]));
      writeCache();
    }
    applyCard();
    renderDialogRows();
  }

  function ensureAdminButton() {
    if (!isAdmin || $('serviceBranchExceptionsButtonV64')) return;
    const wrap = $('serviceBranchAdminV30');
    if (!wrap) return;
    const btn = document.createElement('button');
    btn.id = 'serviceBranchExceptionsButtonV64';
    btn.className = 'service-branch-button-v30 secondary';
    btn.type = 'button';
    btn.textContent = 'Sem ramo / sede';
    btn.addEventListener('click', openDialog);
    wrap.appendChild(btn);
  }

  function ensureDialog() {
    let dialog = $('serviceBranchExceptionsDialogV64');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'serviceBranchExceptionsDialogV64';
    dialog.className = 'service-exceptions-dialog-v64';
    dialog.innerHTML = `
      <div class="service-exceptions-body-v64">
        <div class="service-branch-kicker-v30">ADMINISTRADOR</div>
        <h2>Sábados sem ramo de serviço</h2>
        <p>Use estas opções quando a sede não puder ser utilizada ou quando nenhuma seção estiver em sede. O calendário normal do ramo de serviço fica preservado.</p>
        <div id="serviceBranchExceptionsListV64" class="service-exceptions-list-v64"></div>
        <div class="service-exceptions-actions-v64">
          <button id="serviceBranchExceptionsCloseV64" class="service-branch-button-v30 secondary" type="button">Fechar</button>
        </div>
      </div>`;
    document.body.appendChild(dialog);
    $('serviceBranchExceptionsCloseV64')?.addEventListener('click', () => dialog.close());
    return dialog;
  }

  function renderDialogRows() {
    const wrap = $('serviceBranchExceptionsListV64');
    if (!wrap) return;
    const first = nextSaturdayDate();
    wrap.innerHTML = '';
    for (let i = 0; i < 26; i += 1) {
      const date = isoDateLocal(addDays(first, i * 7));
      const current = exceptions.get(date)?.situacao || '';
      const row = document.createElement('div');
      row.className = 'service-exception-row-v64';
      row.innerHTML = `
        <div><div class="service-exception-date-v64">${formatDateBR(date)}</div><div class="service-exception-saved-v64" data-service-exception-status></div></div>
        <select aria-label="Situação da sede">
          <option value="">Ramo de serviço normal</option>
          <option value="sede_indisponivel">Sede indisponível</option>
          <option value="nenhuma_secao_sede">Nenhuma seção em sede</option>
        </select>
        <button class="service-exception-save-v64" type="button">Salvar</button>`;
      const select = row.querySelector('select');
      select.value = current;
      row.querySelector('button').addEventListener('click', () => saveException(date, select.value, row));
      wrap.appendChild(row);
    }
  }

  async function saveException(date, situacao, row) {
    if (!isAdmin) return;
    const button = row.querySelector('button');
    const status = row.querySelector('[data-service-exception-status]');
    button.disabled = true;
    if (status) status.textContent = 'Salvando...';

    let error = null;
    if (!situacao) {
      ({ error } = await rt.client.from('ramo_servico_excecoes').delete().eq('data', date));
      if (!error) exceptions.delete(date);
    } else {
      const response = await rt.client.from('ramo_servico_excecoes').upsert({
        data,
        situacao,
        criado_por: rt.state.user.id,
        atualizado_em: new Date().toISOString()
      }, { onConflict: 'data' }).select('data,situacao,atualizado_em').single();
      error = response.error;
      if (!error && response.data) exceptions.set(date, response.data);
    }

    button.disabled = false;
    if (error) {
      if (status) status.textContent = 'Não foi possível salvar.';
      return;
    }
    writeCache();
    if (status) status.textContent = 'Salvo.';
    applyCard();
    window.setTimeout(() => { if (status) status.textContent = ''; }, 1600);
  }

  async function openDialog() {
    if (!isAdmin) return;
    ensureDialog();
    renderDialogRows();
    $('serviceBranchExceptionsDialogV64')?.showModal();
  }

  function applyCard() {
    const card = $('serviceBranchCardV30');
    const nameEl = $('serviceBranchNameV30');
    const iconEl = card?.querySelector('.service-branch-icon-v30');
    if (!card || !nameEl || !iconEl) return;

    const date = isoDateLocal(nextSaturdayDate());
    const exception = exceptions.get(date);
    if (exception && LABELS[exception.situacao]) {
      const specialText = LABELS[exception.situacao];
      const specialIcon = ICONS[exception.situacao] || '📣';

      if (nameEl.textContent !== specialText) {
        cardSnapshot = {
          name: nameEl.textContent,
          icon: iconEl.textContent,
          pending: nameEl.classList.contains('service-branch-pending-v30')
        };
      }
      if (nameEl.textContent !== specialText) nameEl.textContent = specialText;
      if (iconEl.textContent !== specialIcon) iconEl.textContent = specialIcon;
      nameEl.classList.remove('service-branch-pending-v30');
      card.classList.add('service-branch-special-v64');
      return;
    }

    if (card.classList.contains('service-branch-special-v64')) {
      card.classList.remove('service-branch-special-v64');
      if (cardSnapshot) {
        nameEl.textContent = cardSnapshot.name || 'Aguardando definição';
        iconEl.textContent = cardSnapshot.icon || '📣';
        nameEl.classList.toggle('service-branch-pending-v30', Boolean(cardSnapshot.pending));
        cardSnapshot = null;
      }
    }
  }

  function observeBaseCard() {
    const card = $('serviceBranchCardV30');
    if (!card) return;
    let timer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        ensureAdminButton();
        applyCard();
      }, 30);
    });
    observer.observe(card, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['class','hidden'] });
  }

  function observeDashboard() {
    const dashboard = $('dashboardView');
    if (!dashboard) return;
    const observer = new MutationObserver(() => {
      if (!dashboard.classList.contains('hidden')) {
        void loadExceptions();
        ensureAdminButton();
      }
    });
    observer.observe(dashboard, { attributes:true, attributeFilter:['class'] });
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt) return;
    if (!(await isPilotProfile())) return;
    isAdmin = rt.state.profile?.tipo === 'administrador';
    injectStyles();
    ensureDialog();
    ensureAdminButton();
    readCache();
    applyCard();
    observeBaseCard();
    observeDashboard();
    await loadExceptions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { void boot(); }, { once:true });
  } else {
    void boot();
  }
})();