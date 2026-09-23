(() => {
  const EVENTS = [
    { origem: 'Nacional', ano: 2027, ordem: 1, atividade: 'Semana Escoteira', data: '10 a 25/04/2027', ramo: 'Todos' },
    { origem: 'Nacional', ano: 2027, ordem: 2, atividade: '11º EducAção Escoteira', data: '01 a 31/05/2027', ramo: 'Todos' },
    { origem: 'Nacional', ano: 2027, ordem: 3, atividade: '36º Mutirão Nacional Escoteiro de Ação Ecológica', data: '01 a 30/06/2027', ramo: 'Todos' },
    { origem: 'Nacional', ano: 2027, ordem: 4, atividade: 'Mutirão Nacional Escoteiro de Doação de Sangue e cadastro REDOME', data: '12 a 20/06/2027', ramo: 'Todos' },
    { origem: 'Nacional', ano: 2027, ordem: 5, atividade: '26º Jamboree Mundial Escoteiro', data: '30/07 a 08/08/2027', ramo: 'Escoteiro e Sênior' },
    { origem: 'Nacional', ano: 2027, ordem: 6, atividade: 'Dia do Amigo', data: '01 a 31/08/2027', ramo: 'Todos' },
    { origem: 'Nacional', ano: 2027, ordem: 7, atividade: '29º Mutirão Nacional Escoteiro de Ação Comunitária', data: '01 a 30/09/2027', ramo: 'Todos' },
    { origem: 'Nacional', ano: 2027, ordem: 8, atividade: '7ª Caçada Nacional', data: '02 e 03/10/2027', ramo: 'Lobinho' },
    { origem: 'Nacional', ano: 2027, ordem: 9, atividade: '32º ELO Nacional', data: '02 e 03/10/2027', ramo: 'Escoteiro e Sênior' },
    { origem: 'Nacional', ano: 2027, ordem: 10, atividade: 'Jamboree do Ar (JOTA) e Jamboree na Internet (JOTI)', data: '15 a 17/10/2027', ramo: 'Todos' },
    { origem: 'Nacional', ano: 2027, ordem: 11, atividade: '1º Grande Jogo de Radioescotismo', data: '05 a 07/11/2027', ramo: 'Todos' }
  ];

  window.GEARPC_CALENDARIO_ANUAL_EVENTS = EVENTS.map((item) => ({ ...item }));

  function addStyles() {
    if (document.getElementById('annualCalendarStyles')) return;
    const style = document.createElement('style');
    style.id = 'annualCalendarStyles';
    style.textContent = `
      .annual-calendar-hero { align-items: center; }
      .annual-calendar-source {
        display: inline-flex; align-items: center; gap: 8px; margin-top: 10px;
        padding: 7px 11px; border-radius: 999px; background: #edf5ff;
        color: #0a376c; font-size: .82rem; font-weight: 800;
      }
      .annual-calendar-card {
        margin: 0 18px 28px; background: #fff; border: 1px solid #dbe4ee;
        border-radius: 18px; overflow: hidden; box-shadow: 0 8px 24px rgba(10,55,108,.07);
      }
      .annual-calendar-table { width: 100%; }
      .annual-calendar-row {
        display: grid; grid-template-columns: minmax(0, 1fr) 155px 150px;
        align-items: stretch; border-top: 1px solid #e6edf4;
      }
      .annual-calendar-row:first-child { border-top: 0; }
      .annual-calendar-head {
        background: #0a376c; color: #fff; font-size: .78rem; font-weight: 900;
        text-transform: uppercase; letter-spacing: .04em;
      }
      .annual-calendar-cell {
        padding: 13px 14px; display: flex; align-items: center;
        min-width: 0; line-height: 1.35;
      }
      .annual-calendar-row:not(.annual-calendar-head) .annual-calendar-cell:first-child {
        font-weight: 800; color: #17324d;
      }
      .annual-calendar-date { font-weight: 750; color: #334e68; }
      .annual-calendar-branch { color: #52677b; font-weight: 700; }
      .annual-calendar-empty { padding: 24px; text-align: center; color: #60758a; }
      @media (max-width: 620px) {
        .annual-calendar-card { margin: 0 12px 24px; border-radius: 14px; }
        .annual-calendar-head { display: none; }
        .annual-calendar-row {
          grid-template-columns: 1fr; padding: 13px 14px; gap: 5px;
        }
        .annual-calendar-cell { padding: 0; display: block; }
        .annual-calendar-date::before { content: 'Data: '; font-weight: 900; color: #17324d; }
        .annual-calendar-branch::before { content: 'Ramo: '; font-weight: 900; color: #17324d; }
      }
    `;
    document.head.appendChild(style);
  }

  function renderRows() {
    return EVENTS
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((item) => `
        <div class="annual-calendar-row">
          <div class="annual-calendar-cell">${item.atividade}</div>
          <div class="annual-calendar-cell annual-calendar-date">${item.data}</div>
          <div class="annual-calendar-cell annual-calendar-branch">${item.ramo}</div>
        </div>
      `).join('');
  }

  function ensureCalendar() {
    if (document.getElementById('annualCalendarButton')) return;

    addStyles();

    const modules = document.querySelector('#dashboardView .launch-modules');
    const shell = document.querySelector('.app-shell');
    const dashboard = document.getElementById('dashboardView');
    if (!modules || !shell || !dashboard) return;

    const button = document.createElement('button');
    button.id = 'annualCalendarButton';
    button.className = 'launch-module';
    button.type = 'button';
    button.innerHTML = `
      <span class="launch-module-icon programming-icon" aria-hidden="true">📅</span>
      <span class="launch-module-copy">
        <strong>Calendário Anual</strong>
        <small>Consulte as atividades previstas para o ano.</small>
      </span>
      <span class="launch-module-arrow" aria-hidden="true">›</span>
    `;
    modules.appendChild(button);

    const view = document.createElement('section');
    view.id = 'annualCalendarView';
    view.className = 'members-view hidden';
    view.innerHTML = `
      <header class="subpage-header">
        <button id="annualCalendarBackButton" class="back-button" type="button" aria-label="Voltar">←</button>
        <div class="subpage-brand"><img src="logo-grupo.jpeg" alt="" /><div><span>GEArPC Conecta</span><strong>Calendário Anual</strong></div></div>
        <button id="annualCalendarLogoutButton" class="secondary-button" type="button">Sair</button>
      </header>

      <section class="members-hero annual-calendar-hero">
        <div>
          <div class="eyebrow dark">PLANEJAMENTO</div>
          <h2>Calendário Anual 2027</h2>
          <p>Atividades previstas para apoiar o planejamento das seções e do grupo.</p>
          <span class="annual-calendar-source">Nacional • 2027</span>
        </div>
      </section>

      <section class="annual-calendar-card" aria-label="Atividades do calendário nacional 2027">
        <div class="annual-calendar-table">
          <div class="annual-calendar-row annual-calendar-head">
            <div class="annual-calendar-cell">Atividade</div>
            <div class="annual-calendar-cell">Data</div>
            <div class="annual-calendar-cell">Ramo</div>
          </div>
          ${renderRows() || '<div class="annual-calendar-empty">Nenhuma atividade cadastrada.</div>'}
        </div>
      </section>

      <footer class="app-footer">GEArPC Conecta • Grupo Escoteiro do Ar Paulo Carzino</footer>
    `;

    shell.appendChild(view);

    const back = document.getElementById('annualCalendarBackButton');
    const logout = document.getElementById('annualCalendarLogoutButton');

    button.addEventListener('click', () => {
      shell.querySelectorAll(':scope > section').forEach((section) => section.classList.add('hidden'));
      view.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'auto' });
    });

    back.addEventListener('click', () => {
      view.classList.add('hidden');
      dashboard.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'auto' });
    });

    logout.addEventListener('click', () => {
      view.classList.add('hidden');
      document.getElementById('logoutButton')?.click();
    });

    const login = document.getElementById('loginView');
    if (login) {
      new MutationObserver(() => {
        if (!login.classList.contains('hidden')) view.classList.add('hidden');
      }).observe(login, { attributes: true, attributeFilter: ['class'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureCalendar, { once: true });
  } else {
    ensureCalendar();
  }
})();