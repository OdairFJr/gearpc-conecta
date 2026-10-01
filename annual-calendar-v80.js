(() => {
  const YEAR = 2027;
  const SOURCE_LABEL = 'Calendário Regional Escoteiro 2027 • SC • Versão 1 • 30/09/2026';

  // Mantido para usuários reais enquanto a nova versão permanece em teste.
  const LEGACY_NATIONAL_EVENTS = [
    { data_inicio: '2027-04-10', data_fim: '2027-04-25', atividade: 'Semana Escoteira', abrangencia: 'Nacional', local: '', ramo_ids: null },
    { data_inicio: '2027-05-01', data_fim: '2027-05-31', atividade: '11º EducAção Escoteira', abrangencia: 'Nacional', local: '', ramo_ids: null },
    { data_inicio: '2027-06-01', data_fim: '2027-06-30', atividade: '36º Mutirão Nacional Escoteiro de Ação Ecológica', abrangencia: 'Nacional', local: '', ramo_ids: null },
    { data_inicio: '2027-06-12', data_fim: '2027-06-20', atividade: 'Mutirão Nacional Escoteiro de Doação de Sangue e cadastro REDOME', abrangencia: 'Nacional', local: '', ramo_ids: null },
    { data_inicio: '2027-07-30', data_fim: '2027-08-08', atividade: '26º Jamboree Mundial Escoteiro', abrangencia: 'Mundial', local: '', ramo_ids: [3,4] },
    { data_inicio: '2027-08-01', data_fim: '2027-08-31', atividade: 'Dia do Amigo', abrangencia: 'Nacional', local: '', ramo_ids: null },
    { data_inicio: '2027-09-01', data_fim: '2027-09-30', atividade: '29º Mutirão Nacional Escoteiro de Ação Comunitária', abrangencia: 'Nacional', local: '', ramo_ids: null },
    { data_inicio: '2027-10-02', data_fim: '2027-10-03', atividade: '7ª Caçada Nacional', abrangencia: 'Nacional', local: '', ramo_ids: [2] },
    { data_inicio: '2027-10-02', data_fim: '2027-10-03', atividade: '32º ELO Nacional', abrangencia: 'Nacional', local: '', ramo_ids: [3,4] },
    { data_inicio: '2027-10-15', data_fim: '2027-10-17', atividade: 'Jamboree do Ar (JOTA) e Jamboree na Internet (JOTI)', abrangencia: 'Nacional', local: '', ramo_ids: null },
    { data_inicio: '2027-11-05', data_fim: '2027-11-07', atividade: '1º Grande Jogo de Radioescotismo', abrangencia: 'Nacional', local: '', ramo_ids: null }
  ];

  const $ = (id) => document.getElementById(id);
  const state = {
    events: [],
    loaded: false
  };

  function runtime() { return window.GEARPC_RUNTIME || null; }
  function profile() { return runtime()?.state?.profile || null; }
  function client() { return runtime()?.client || null; }

  function isPreviewProfile() {
    const p = profile();
    return Boolean(p && (p.tipo === 'administrador' || p.eh_teste === true));
  }

  function canSeeTraining() {
    const p = profile();
    return Boolean(p && (p.tipo === 'administrador' || (p.eh_teste === true && p.tipo !== 'responsavel')));
  }

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function normalize(value) {
    return String(value ?? '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim().toLowerCase();
  }

  function dateObj(iso) {
    if (!iso) return null;
    const d = new Date(`${iso}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatDate(iso) {
    const d = dateObj(iso);
    return d ? d.toLocaleDateString('pt-BR') : '';
  }

  function formatRange(start, end) {
    if (!start) return 'Data a definir';
    if (!end || start === end) return formatDate(start);
    const a = dateObj(start);
    const b = dateObj(end);
    if (!a || !b) return [formatDate(start), formatDate(end)].filter(Boolean).join(' a ');
    if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
      return `${String(a.getDate()).padStart(2,'0')} a ${String(b.getDate()).padStart(2,'0')}/${String(b.getMonth()+1).padStart(2,'0')}/${b.getFullYear()}`;
    }
    return `${formatDate(start)} a ${formatDate(end)}`;
  }

  function monthLabel(iso) {
    const d = dateObj(iso);
    if (!d) return 'Sem data';
    const value = d.toLocaleDateString('pt-BR', { month: 'long' });
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function sortEvents(rows) {
    return [...rows].sort((a, b) => {
      const da = String(a.data_inicio || '');
      const db = String(b.data_inicio || '');
      return da.localeCompare(db) || String(a.atividade || '').localeCompare(String(b.atividade || ''), 'pt-BR');
    });
  }

  function scopeClass(scope) {
    return `calendar-scope-${normalize(scope).replace(/[^a-z]/g, '')}`;
  }

  function addStyles() {
    if ($('annualCalendarStyles')) return;
    const style = document.createElement('style');
    style.id = 'annualCalendarStyles';
    style.textContent = `
      .annual-calendar-hero{align-items:center}
      .annual-calendar-source{display:inline-flex;align-items:center;gap:7px;margin-top:10px;padding:7px 11px;border-radius:999px;background:#edf5ff;color:#0a376c;font-size:.78rem;font-weight:850}
      .annual-calendar-source.test{background:#fff3cd;color:#6d5200;border:1px solid #ecd47f}
      .calendar-test-note{margin:12px 18px 14px;padding:11px 13px;border-radius:12px;background:#fff8dc;border:1px solid #e7c96a;color:#665927;font-size:.8rem;line-height:1.45}
      .calendar-tools{margin:0 18px 15px;padding:14px;background:#fff;border:1px solid #dbe4ee;border-radius:16px;box-shadow:0 6px 18px rgba(10,55,108,.06)}
      .calendar-tools h3{margin:0;color:#17324d}.calendar-tools p{margin:5px 0 11px;color:#607086;font-size:.82rem;line-height:1.45}
      .calendar-tools-grid{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:end}
      .calendar-tools label{display:grid;gap:5px;font-size:.76rem;font-weight:850;color:#53687b}
      .calendar-tools select{min-height:42px;border:1px solid #c8d5e2;border-radius:10px;padding:8px 10px;background:#fff;font:inherit}
      .calendar-tool-btn{min-height:42px;border:0;border-radius:10px;padding:9px 12px;background:#0a376c;color:#fff;font-weight:850;cursor:pointer}
      .calendar-tool-btn.secondary{background:#e8eef4;color:#17324d}.calendar-tool-btn:disabled{opacity:.55;cursor:not-allowed}
      .calendar-import-status{margin:9px 0 0;min-height:18px;font-size:.78rem;font-weight:750;color:#177245}
      .calendar-timeline{margin:0 18px 28px;display:grid;gap:10px}
      .calendar-month{margin-top:7px;padding:8px 4px 3px;color:#0a376c;font-size:.95rem;font-weight:950;text-transform:uppercase;letter-spacing:.04em}
      .calendar-event{display:grid;grid-template-columns:105px minmax(0,1fr);gap:12px;background:#fff;border:1px solid #dbe4ee;border-radius:14px;padding:12px 13px;box-shadow:0 4px 13px rgba(10,55,108,.045)}
      .calendar-date{font-size:.78rem;font-weight:900;color:#334e68;line-height:1.35}
      .calendar-event-main{min-width:0}.calendar-event-title-row{display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap}
      .calendar-event-title{font-weight:900;color:#17324d;line-height:1.35}
      .calendar-event-meta{margin-top:5px;color:#687b8e;font-size:.76rem;line-height:1.4}
      .calendar-scope{display:inline-flex;align-items:center;border-radius:999px;padding:4px 7px;font-size:.66rem;font-weight:950;letter-spacing:.03em;text-transform:uppercase;background:#edf2f7;color:#455b70}
      .calendar-scope-mundial{background:#eee9ff;color:#563a99}.calendar-scope-nacional{background:#e9f2ff;color:#174f86}.calendar-scope-regional{background:#e9f6ee;color:#1c6a3b}.calendar-scope-distrital{background:#fff0df;color:#8b5314}.calendar-scope-grupo{background:#e9f5f5;color:#176363}
      .calendar-empty{margin:0 18px 28px;padding:24px;text-align:center;color:#60758a;background:#fff;border:1px solid #dbe4ee;border-radius:14px}
      .training-calendar-card{margin:0 18px 28px;background:#fff;border:1px solid #dbe4ee;border-radius:16px;overflow:hidden}
      .training-row{display:grid;grid-template-columns:145px minmax(0,1fr) 185px;border-top:1px solid #e6edf4}
      .training-row:first-child{border-top:0}.training-row>div{padding:12px 13px;line-height:1.4}.training-row strong{color:#17324d}.training-row small{color:#64798d}
      .training-month{padding:9px 13px;background:#edf5ff;color:#0a376c;font-weight:950;border-top:1px solid #d6e5f2}
      @media(max-width:620px){
        .calendar-test-note,.calendar-timeline,.training-calendar-card{margin-left:12px;margin-right:12px}
        .calendar-event{grid-template-columns:1fr;gap:5px}.calendar-date{color:#0a376c}
        .training-row{grid-template-columns:1fr;padding:11px 13px;gap:3px}.training-row>div{padding:0}
      }
    `;
    document.head.appendChild(style);
  }

  async function waitProfile() {
    for (let i = 0; i < 100; i += 1) {
      if (profile() && client()) return true;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
  }

  async function loadPreviewEvents(force = false) {
    if (!isPreviewProfile()) return [];
    if (state.loaded && !force) return state.events;
    const c = client();
    const { data, error } = await c.from('calendario_eventos')
      .select('id,ano,categoria,data_inicio,data_fim,atividade,abrangencia,local,secao_id,ramo_ids,observacoes,fonte,versao_fonte,em_teste')
      .eq('ano', YEAR)
      .order('data_inicio', { ascending: true });
    if (error) throw error;
    state.events = data || [];
    state.loaded = true;
    return state.events;
  }

  function activityEventsForCurrentView() {
    if (!isPreviewProfile()) return sortEvents(LEGACY_NATIONAL_EVENTS);
    return sortEvents(state.events.filter((e) => e.categoria === 'atividade' && !e.secao_id));
  }

  function renderTimeline(rows) {
    if (!rows.length) return '<div class="calendar-empty">Nenhuma atividade cadastrada para este calendário.</div>';

    let currentMonth = '';
    let html = '<div class="calendar-timeline">';
    for (const event of rows) {
      const month = monthLabel(event.data_inicio);
      if (month !== currentMonth) {
        html += `<div class="calendar-month">${esc(month)}</div>`;
        currentMonth = month;
      }
      const place = event.local ? `📍 ${esc(event.local)}` : '';
      const note = event.observacoes ? `${place ? ' • ' : ''}${esc(event.observacoes)}` : '';
      html += `
        <article class="calendar-event">
          <div class="calendar-date">${esc(formatRange(event.data_inicio, event.data_fim))}</div>
          <div class="calendar-event-main">
            <div class="calendar-event-title-row">
              <span class="calendar-event-title">${esc(event.atividade)}</span>
              <span class="calendar-scope ${scopeClass(event.abrangencia)}">${esc(event.abrangencia)}</span>
            </div>
            ${place || note ? `<div class="calendar-event-meta">${place}${note}</div>` : ''}
          </div>
        </article>`;
    }
    html += '</div>';
    return html;
  }

  function renderActivityCalendar() {
    const view = $('annualCalendarView');
    if (!view) return;
    const preview = isPreviewProfile();
    const title = $('annualCalendarTitle');
    const source = $('annualCalendarSource');
    const note = $('annualCalendarTestNote');
    const body = $('annualCalendarTimeline');

    if (title) title.textContent = 'Calendário de Atividades 2027';
    if (source) {
      source.textContent = preview ? 'Mundial • Nacional • Regional • Distrital • Grupo • TESTE' : 'Nacional • 2027';
      source.classList.toggle('test', preview);
    }
    note?.classList.toggle('hidden', !preview);
    if (body) body.innerHTML = renderTimeline(activityEventsForCurrentView());
  }

  function trainingRows() {
    return sortEvents(state.events.filter((e) => e.categoria === 'formacao'));
  }

  function renderTrainingCalendar() {
    const host = $('trainingCalendarRows');
    if (!host) return;
    const rows = trainingRows();
    if (!rows.length) {
      host.innerHTML = '<div class="calendar-empty">Nenhum curso ou capacitação cadastrado.</div>';
      return;
    }

    let currentMonth = '';
    let html = '';
    for (const event of rows) {
      const month = monthLabel(event.data_inicio);
      if (month !== currentMonth) {
        html += `<div class="training-month">${esc(month)}</div>`;
        currentMonth = month;
      }
      html += `
        <div class="training-row">
          <div><strong>${esc(formatRange(event.data_inicio, event.data_fim))}</strong></div>
          <div><strong>${esc(event.atividade)}</strong><br><span class="calendar-scope ${scopeClass(event.abrangencia)}">${esc(event.abrangencia)}</span></div>
          <div><small>${esc(event.local || 'A definir')}</small></div>
        </div>`;
    }
    host.innerHTML = html;
  }

  function buildActivityView(shell, dashboard) {
    if ($('annualCalendarView')) return;

    const view = document.createElement('section');
    view.id = 'annualCalendarView';
    view.className = 'members-view hidden';
    view.innerHTML = `
      <header class="subpage-header">
        <button id="annualCalendarBackButton" class="back-button" type="button" aria-label="Voltar">←</button>
        <div class="subpage-brand"><img src="logo-grupo.jpeg" alt="" /><div><span>GEArPC Conecta</span><strong>Calendário</strong></div></div>
        <button id="annualCalendarLogoutButton" class="secondary-button" type="button">Sair</button>
      </header>

      <section class="members-hero annual-calendar-hero">
        <div>
          <div class="eyebrow dark">PLANEJAMENTO</div>
          <h2 id="annualCalendarTitle">Calendário de Atividades 2027</h2>
          <p>Uma linha do tempo única, organizada pela data de cada atividade.</p>
          <span id="annualCalendarSource" class="annual-calendar-source">Nacional • 2027</span>
        </div>
      </section>

      <div id="annualCalendarTestNote" class="calendar-test-note hidden">
        <strong>EM TESTE.</strong> Base de 2027 organizada a partir do calendário regional de Santa Catarina. Cada atividade traz sua abrangência. Eventos de Grupo e Distrital aparecerão automaticamente na mesma linha do tempo quando forem cadastrados. O planejamento específico das seções permanece no Ciclo de Programa. O documento regional é sujeito a alterações.
      </div>

      <div id="annualCalendarTimeline"></div>
      <footer class="app-footer">GEArPC Conecta • Grupo Escoteiro do Ar Paulo Carzino</footer>
    `;
    shell.appendChild(view);

    $('annualCalendarBackButton')?.addEventListener('click', () => {
      view.classList.add('hidden');
      dashboard.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
    $('annualCalendarLogoutButton')?.addEventListener('click', () => {
      view.classList.add('hidden');
      $('logoutButton')?.click();
    });
  }


  function buildTrainingView(shell, dashboard) {
    if (!canSeeTraining() || $('trainingCalendarView')) return;

    const view = document.createElement('section');
    view.id = 'trainingCalendarView';
    view.className = 'members-view hidden';
    view.innerHTML = `
      <header class="subpage-header">
        <button id="trainingCalendarBackButton" class="back-button" type="button" aria-label="Voltar">←</button>
        <div class="subpage-brand"><img src="logo-grupo.jpeg" alt="" /><div><span>GEArPC Conecta</span><strong>Cursos e Capacitações</strong></div></div>
        <button id="trainingCalendarLogoutButton" class="secondary-button" type="button">Sair</button>
      </header>

      <section class="members-hero annual-calendar-hero">
        <div>
          <div class="eyebrow dark">FORMAÇÃO E CAPACITAÇÃO</div>
          <h2>Cursos e Capacitações 2027</h2>
          <p>Agenda separada do calendário das seções.</p>
          <span class="annual-calendar-source test">Regional SC + Nacional • 2027 • TESTE</span>
        </div>
      </section>

      <div class="calendar-test-note"><strong>EM TESTE.</strong> ${esc(SOURCE_LABEL)}. Documento sujeito a alterações.</div>
      <section id="trainingCalendarRows" class="training-calendar-card"></section>
      <footer class="app-footer">GEArPC Conecta • Grupo Escoteiro do Ar Paulo Carzino</footer>
    `;
    shell.appendChild(view);

    $('trainingCalendarBackButton')?.addEventListener('click', () => {
      view.classList.add('hidden');
      dashboard.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
    $('trainingCalendarLogoutButton')?.addEventListener('click', () => {
      view.classList.add('hidden');
      $('logoutButton')?.click();
    });
  }

  function hideTopViews(shell) {
    shell.querySelectorAll(':scope > section').forEach((section) => section.classList.add('hidden'));
  }

  function ensureButtonsAndViews() {
    addStyles();
    const modules = document.querySelector('#dashboardView .launch-modules');
    const shell = document.querySelector('.app-shell');
    const dashboard = $('dashboardView');
    if (!modules || !shell || !dashboard) return;

    let activityButton = $('annualCalendarButton');
    if (!activityButton) {
      activityButton = document.createElement('button');
      activityButton.id = 'annualCalendarButton';
      activityButton.className = 'launch-module';
      activityButton.type = 'button';
      activityButton.innerHTML = `
        <span class="launch-module-icon programming-icon" aria-hidden="true">📅</span>
        <span class="launch-module-copy"><strong>Calendário Anual</strong><small>Atividades em ordem cronológica.</small></span>
        <span class="launch-module-arrow" aria-hidden="true">›</span>`;
      modules.appendChild(activityButton);
    }

    buildActivityView(shell, dashboard);

    if (!activityButton.dataset.calendarBound) {
      activityButton.dataset.calendarBound = '1';
      activityButton.addEventListener('click', async () => {
        if (isPreviewProfile()) {
          await loadPreviewEvents();
        }
        renderActivityCalendar();
        hideTopViews(shell);
        $('annualCalendarView')?.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'auto' });
      });
    }

    if (canSeeTraining() && !$('trainingCalendarButton')) {
      const trainingButton = document.createElement('button');
      trainingButton.id = 'trainingCalendarButton';
      trainingButton.className = 'launch-module';
      trainingButton.type = 'button';
      trainingButton.innerHTML = `
        <span class="launch-module-icon programming-icon" aria-hidden="true">🎓</span>
        <span class="launch-module-copy"><strong>Cursos e Capacitações</strong><small>Formações previstas para 2027 • EM TESTE.</small></span>
        <span class="launch-module-arrow" aria-hidden="true">›</span>`;
      modules.appendChild(trainingButton);
      buildTrainingView(shell, dashboard);

      trainingButton.addEventListener('click', async () => {
        await loadPreviewEvents();
        renderTrainingCalendar();
        hideTopViews(shell);
        $('trainingCalendarView')?.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'auto' });
      });
    }

    const login = $('loginView');
    if (login && !window.__GEARPC_CALENDAR_LOGIN_OBSERVER__) {
      const observer = new MutationObserver(() => {
        if (!login.classList.contains('hidden')) {
          $('annualCalendarView')?.classList.add('hidden');
          $('trainingCalendarView')?.classList.add('hidden');
        }
      });
      observer.observe(login, { attributes: true, attributeFilter: ['class'] });
      window.__GEARPC_CALENDAR_LOGIN_OBSERVER__ = observer;
    }
  }

  // Cria o botão normal imediatamente; o restante espera o perfil.
  ensureButtonsAndViews();

  const initialReady = (async () => {
    const ready = await waitProfile();
    if (!ready) return;
    ensureButtonsAndViews();
    if (isPreviewProfile()) {
      await Promise.allSettled([loadPreviewEvents()]);
      renderActivityCalendar();
      if (canSeeTraining()) renderTrainingCalendar();
    }
  })();

  window.GEARPC_DASHBOARD_PREPARE_TASKS = window.GEARPC_DASHBOARD_PREPARE_TASKS || [];
  window.GEARPC_DASHBOARD_PREPARE_TASKS.push(() => initialReady);
})();