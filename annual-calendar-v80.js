(() => {
  const NATIONAL_EVENTS = [
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

  const REGIONAL_EVENTS = [
    { ordem: 1, atividade: 'Premiação Patrulha Padrão 2026 e Lançamento Patrulha Padrão 2027', data: '22/02/2027', local: 'Online' },
    { ordem: 2, atividade: '31º Congresso Escoteiro Estadual', data: '20 e 21/03/2027', local: 'Florianópolis' },
    { ordem: 3, atividade: '17º Fórum Regional de Jovens Líderes', data: '20/03/2027', local: 'Florianópolis' },
    { ordem: 4, atividade: '17º Fórum Regional Pioneiro', data: '20/03/2027', local: 'Florianópolis' },
    { ordem: 5, atividade: '34ª Reunião Ordinária da Assembleia Escoteira Regional', data: '21/03/2027', local: 'Florianópolis' },
    { ordem: 6, atividade: 'Acampamento Ponta de Flecha - Ramo Escoteiro', data: '26 e 27/06/2027', local: 'Descentralizado' },
    { ordem: 7, atividade: 'Vigília Regional Pioneira', data: '26 e 27/06/2027', local: 'Descentralizado' },
    { ordem: 8, atividade: '28º Mutirão Regional Pioneiro', data: '18 e 19/09/2027', local: 'Brusque' }
  ];

  const TRAINING_EVENTS = [
    { mes: 'Janeiro', data: '18 a 22/01/2027', atividade: 'Capacita Jovem Líder', local: 'A definir', abrangencia: 'Nacional' },
    { mes: 'Janeiro', data: '23 e 24/01/2027', atividade: 'Formação de Multiplicadores: Programa Educativo Atualizado', local: 'Concórdia', abrangencia: 'Regional' },
    { mes: 'Janeiro', data: '30 e 31/01/2027', atividade: 'Formação de Multiplicadores: Programa Educativo Atualizado', local: 'Florianópolis', abrangencia: 'Regional' },

    { mes: 'Fevereiro', data: '01/02 a 02/03/2027', atividade: 'Curso Preliminar (Parte 1 - EAD)', local: 'Online', abrangencia: 'Formação' },
    { mes: 'Fevereiro', data: '01/02 a 02/03/2027', atividade: 'Cursos Intermediários (Parte 1 - EAD): Lobinho / Dirigente', local: 'Online', abrangencia: 'Formação' },

    { mes: 'Março', data: '05 a 07/03/2027', atividade: 'Curso APH (Atendimento Pré-Hospitalar) 1', local: 'São José', abrangencia: 'Formação' },
    { mes: 'Março', data: '06 e 07/03/2027', atividade: 'Curso Preliminar (Parte 1 e 2)', local: 'Mesorregião Serrana / Mesorregião Vale do Itajaí', abrangencia: 'Formação' },

    { mes: 'Abril', data: '01 a 30/04/2027', atividade: 'Curso Preliminar (Parte 1 - EAD)', local: 'Online', abrangencia: 'Formação' },
    { mes: 'Abril', data: '01 a 30/04/2027', atividade: 'Cursos Intermediários (Parte 1 - EAD): Escoteiro / Sênior / Pioneiro', local: 'Online', abrangencia: 'Formação' },
    { mes: 'Abril', data: '03 e 04/04/2027', atividade: 'Curso Preliminar (Parte 1 e 2)', local: 'Mesorregião Grande Florianópolis', abrangencia: 'Formação' },
    { mes: 'Abril', data: '10 e 11/04/2027', atividade: 'Curso Intermediário: Ramo Filhotes', local: 'Campo Escoteiro Padre Edgard (CEPE) - Xaxim', abrangencia: 'Formação' },
    { mes: 'Abril', data: '10 e 11/04/2027', atividade: 'Curso Intermediário: Ramo Lobinho (Parte 2)', local: 'Campo Escoteiro Padre Edgard (CEPE) - Xaxim', abrangencia: 'Formação' },
    { mes: 'Abril', data: '21 a 24/04/2027', atividade: 'Capacitações Estratégicas Nacionais', local: 'A definir', abrangencia: 'Nacional' },

    { mes: 'Maio', data: '15 e 16/05/2027', atividade: 'Encontro Regional de Comunicação', local: 'Florianópolis', abrangencia: 'Formação' },
    { mes: 'Maio', data: '15 e 16/05/2027', atividade: 'Curso Preliminar (Parte 1 e 2)', local: 'Mesorregião Oeste (Pinhalzinho)', abrangencia: 'Regional' },
    { mes: 'Maio', data: '22 e 23/05/2027', atividade: 'Cursos Intermediários (Parte 2): Escoteiro / Sênior', local: 'Mesorregião Sul Catarinense', abrangencia: 'Formação' },
    { mes: 'Maio', data: '22 e 23/05/2027', atividade: 'Curso Intermediário - Ramo Pioneiro', local: 'Mesorregião Grande Florianópolis', abrangencia: 'Formação' },
    { mes: 'Maio', data: '22 e 23/05/2027', atividade: 'Curso Intermediário - Linha Dirigente (Parte 2)', local: 'Mesorregião Oeste', abrangencia: 'Formação' },

    { mes: 'Junho', data: '01 a 30/06/2027', atividade: 'Curso Preliminar (Parte 1 - EAD)', local: 'Online', abrangencia: 'Formação' },
    { mes: 'Junho', data: '05 e 06/06/2027', atividade: 'Curso Preliminar (Parte 1 e 2)', local: 'Mesorregião Vale do Itajaí (Pomerode)', abrangencia: 'Formação' },

    { mes: 'Julho', data: '01 a 31/07/2027', atividade: 'Cursos Intermediários (Parte 1 - EAD): Lobinho / Dirigente', local: 'Online', abrangencia: 'Formação' },
    { mes: 'Julho', data: '09 a 11/07/2027', atividade: 'Curso APH (Atendimento Pré-Hospitalar) 1', local: 'Lages', abrangencia: 'Formação' },
    { mes: 'Julho', data: '24 e 25/07/2027', atividade: 'Curso Preliminar (Parte 1 e 2)', local: 'Mesorregião Norte Catarinense', abrangencia: 'Formação' },

    { mes: 'Agosto', data: '02 a 31/08/2027', atividade: 'Curso Preliminar (Parte 1 - EAD)', local: 'Online', abrangencia: 'Formação' },
    { mes: 'Agosto', data: '21 e 22/08/2027', atividade: 'Curso Preliminar (Parte 1 e 2)', local: 'Mesorregião Oeste (Maravilha)', abrangencia: 'Formação' },
    { mes: 'Agosto', data: '28 e 29/08/2027', atividade: 'Cursos Intermediários (Parte 2): Escoteiro / Sênior', local: 'Mesorregião Oeste (Videira)', abrangencia: 'Formação' },
    { mes: 'Agosto', data: '28 e 29/08/2027', atividade: 'Cursos Intermediários (Parte 2): Lobinho / Pioneiro / Dirigente', local: 'Mesorregião Norte Catarinense', abrangencia: 'Formação' },

    { mes: 'Setembro', data: '04 a 07/09/2027', atividade: 'Cursos Avançados: Escoteiro / Sênior', local: 'Campo Escoteiro Padre Edgard (CEPE) - Xaxim', abrangencia: 'Formação' },
    { mes: 'Setembro', data: '17 a 19/09/2027', atividade: 'Curso APH (Atendimento Pré-Hospitalar) 2', local: 'Palhoça', abrangencia: 'Formação' },
    { mes: 'Setembro', data: '25 e 26/09/2027', atividade: 'Curso Preliminar (Parte 1 e 2)', local: 'Mesorregião Sul Catarinense', abrangencia: 'Formação' },
    { mes: 'Setembro', data: '25 e 26/09/2027', atividade: 'Curso Intermediário - Ramo Filhotes', local: 'Mesorregião Grande Florianópolis', abrangencia: 'Formação' },
    { mes: 'Setembro', data: '25 e 26/09/2027', atividade: 'Cursos Intermediários: Escoteiro / Sênior', local: 'Mesorregião Vale do Itajaí', abrangencia: 'Formação' },
    { mes: 'Setembro', data: '25 e 26/09/2027', atividade: 'Cursos Intermediários: Lobinho / Dirigente', local: 'Mesorregião Grande Florianópolis', abrangencia: 'Formação' },

    { mes: 'Outubro', data: '01 a 31/10/2027', atividade: 'Curso Preliminar (Parte 1 - EAD)', local: 'Online', abrangencia: 'Formação' },
    { mes: 'Outubro', data: '01 a 31/10/2027', atividade: 'Cursos Intermediários (Parte 1 - EAD): Escoteiro / Sênior / Pioneiro', local: 'Online', abrangencia: 'Formação' },
    { mes: 'Outubro', data: '09 e 10/10/2027', atividade: 'Curso Preliminar (Parte 1 e 2)', local: 'Mesorregião Grande Florianópolis', abrangencia: 'Formação' },
    { mes: 'Outubro', data: '30/10 a 02/11/2027', atividade: 'Cursos Avançados: Filhotes / Lobinho / Pioneiro / Dirigente', local: 'Mesorregião Vale do Itajaí', abrangencia: 'Formação' }
  ];

  window.GEARPC_CALENDARIO_ANUAL_EVENTS = NATIONAL_EVENTS.map((item) => ({ ...item }));
  window.GEARPC_CALENDARIO_REGIONAL_TEST_EVENTS = REGIONAL_EVENTS.map((item) => ({ ...item }));
  window.GEARPC_CALENDARIO_FORMACAO_TEST_EVENTS = TRAINING_EVENTS.map((item) => ({ ...item }));

  const $ = (id) => document.getElementById(id);

  function profile() {
    return window.GEARPC_RUNTIME?.state?.profile || null;
  }

  function testCalendarsEnabled() {
    const p = profile();
    return Boolean(p && (p.tipo === 'administrador' || p.eh_teste === true));
  }

  function trainingCalendarEnabled() {
    const p = profile();
    return Boolean(p && (p.tipo === 'administrador' || (p.eh_teste === true && p.tipo !== 'responsavel')));
  }

  function addStyles() {
    if ($('annualCalendarStyles')) return;
    const style = document.createElement('style');
    style.id = 'annualCalendarStyles';
    style.textContent = `
      .annual-calendar-hero { align-items: center; }
      .annual-calendar-source {
        display: inline-flex; align-items: center; gap: 8px; margin-top: 10px;
        padding: 7px 11px; border-radius: 999px; background: #edf5ff;
        color: #0a376c; font-size: .82rem; font-weight: 800;
      }
      .annual-calendar-source.test { background:#fff3cd; color:#6d5200; border:1px solid #ecd47f; }
      .annual-calendar-note {
        margin: 12px 18px 14px; padding: 11px 13px; border-radius: 12px;
        background:#fff8dc; border:1px solid #e7c96a; color:#665927;
        font-size:.8rem; line-height:1.45;
      }
      .annual-calendar-card {
        margin: 0 18px 28px; background: #fff; border: 1px solid #dbe4ee;
        border-radius: 18px; overflow: hidden; box-shadow: 0 8px 24px rgba(10,55,108,.07);
      }
      .annual-calendar-card-title {
        padding: 12px 14px; background:#eef4fa; color:#17324d; font-weight:900;
        border-bottom:1px solid #dbe4ee;
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
      .annual-calendar-branch, .annual-calendar-local { color: #52677b; font-weight: 700; }
      .annual-calendar-empty { padding: 24px; text-align: center; color: #60758a; }
      .training-calendar-row { grid-template-columns: 150px minmax(0,1fr) 190px; }
      .training-month {
        padding:10px 14px; background:#edf5ff; color:#0a376c; font-weight:950;
        border-top:1px solid #d7e5f2; border-bottom:1px solid #d7e5f2;
      }
      @media (max-width: 620px) {
        .annual-calendar-card { margin: 0 12px 24px; border-radius: 14px; }
        .annual-calendar-note { margin:12px 12px 14px; }
        .annual-calendar-head { display: none; }
        .annual-calendar-row, .training-calendar-row {
          grid-template-columns: 1fr; padding: 13px 14px; gap: 5px;
        }
        .annual-calendar-cell { padding: 0; display: block; }
        .annual-calendar-date::before { content: 'Data: '; font-weight: 900; color: #17324d; }
        .annual-calendar-branch::before { content: 'Ramo: '; font-weight: 900; color: #17324d; }
        .annual-calendar-local::before { content: 'Local: '; font-weight: 900; color: #17324d; }
      }
    `;
    document.head.appendChild(style);
  }

  function renderNationalRows() {
    return NATIONAL_EVENTS
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

  function renderRegionalRows() {
    return REGIONAL_EVENTS
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((item) => `
        <div class="annual-calendar-row">
          <div class="annual-calendar-cell">${item.atividade}</div>
          <div class="annual-calendar-cell annual-calendar-date">${item.data}</div>
          <div class="annual-calendar-cell annual-calendar-local">${item.local}</div>
        </div>
      `).join('');
  }

  function renderTrainingRows() {
    let currentMonth = '';
    return TRAINING_EVENTS.map((item) => {
      const month = item.mes !== currentMonth
        ? `<div class="training-month">${item.mes}</div>`
        : '';
      currentMonth = item.mes;
      return `${month}
        <div class="annual-calendar-row training-calendar-row">
          <div class="annual-calendar-cell annual-calendar-date">${item.data}</div>
          <div class="annual-calendar-cell">${item.atividade}</div>
          <div class="annual-calendar-cell annual-calendar-local">${item.local}</div>
        </div>`;
    }).join('');
  }

  function hideTopViews(shell) {
    shell.querySelectorAll(':scope > section').forEach((section) => section.classList.add('hidden'));
  }

  function ensureActivityCalendar() {
    if ($('annualCalendarButton')) return;
    addStyles();

    const modules = document.querySelector('#dashboardView .launch-modules');
    const shell = document.querySelector('.app-shell');
    const dashboard = $('dashboardView');
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
          <h2>Calendário de Atividades 2027</h2>
          <p>Atividades previstas para apoiar o planejamento das seções e do grupo.</p>
          <span id="annualCalendarSource" class="annual-calendar-source">Nacional • 2027</span>
        </div>
      </section>

      <div id="annualCalendarTestNote" class="annual-calendar-note hidden">
        <strong>EM TESTE.</strong> Inclui o Calendário Regional Escoteiro 2027 de Santa Catarina, Versão 1 de 30/09/2026. O documento regional está sujeito a alterações.
      </div>

      <section class="annual-calendar-card" aria-label="Atividades do calendário nacional 2027">
        <div class="annual-calendar-card-title">🇧🇷 Nacional</div>
        <div class="annual-calendar-table">
          <div class="annual-calendar-row annual-calendar-head">
            <div class="annual-calendar-cell">Atividade</div>
            <div class="annual-calendar-cell">Data</div>
            <div class="annual-calendar-cell">Ramo</div>
          </div>
          ${renderNationalRows() || '<div class="annual-calendar-empty">Nenhuma atividade cadastrada.</div>'}
        </div>
      </section>

      <section id="regionalCalendarCard" class="annual-calendar-card hidden" aria-label="Atividades do calendário regional Santa Catarina 2027">
        <div class="annual-calendar-card-title">🟢 Regional SC</div>
        <div class="annual-calendar-table">
          <div class="annual-calendar-row annual-calendar-head">
            <div class="annual-calendar-cell">Atividade / evento</div>
            <div class="annual-calendar-cell">Data</div>
            <div class="annual-calendar-cell">Local</div>
          </div>
          ${renderRegionalRows()}
        </div>
      </section>

      <footer class="app-footer">GEArPC Conecta • Grupo Escoteiro do Ar Paulo Carzino</footer>
    `;
    shell.appendChild(view);

    const refreshTestState = () => {
      const enabled = testCalendarsEnabled();
      $('regionalCalendarCard')?.classList.toggle('hidden', !enabled);
      $('annualCalendarTestNote')?.classList.toggle('hidden', !enabled);
      const source = $('annualCalendarSource');
      if (source) {
        source.textContent = enabled ? 'Nacional + Regional SC • 2027 • TESTE' : 'Nacional • 2027';
        source.classList.toggle('test', enabled);
      }
    };

    button.addEventListener('click', () => {
      refreshTestState();
      hideTopViews(shell);
      view.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'auto' });
    });

    $('annualCalendarBackButton')?.addEventListener('click', () => {
      view.classList.add('hidden');
      dashboard.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'auto' });
    });

    $('annualCalendarLogoutButton')?.addEventListener('click', () => {
      view.classList.add('hidden');
      $('logoutButton')?.click();
    });

    const login = $('loginView');
    if (login) {
      new MutationObserver(() => {
        if (!login.classList.contains('hidden')) view.classList.add('hidden');
      }).observe(login, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function ensureTrainingCalendar() {
    if (!trainingCalendarEnabled() || $('trainingCalendarButton')) return;
    addStyles();

    const modules = document.querySelector('#dashboardView .launch-modules');
    const shell = document.querySelector('.app-shell');
    const dashboard = $('dashboardView');
    if (!modules || !shell || !dashboard) return;

    const button = document.createElement('button');
    button.id = 'trainingCalendarButton';
    button.className = 'launch-module';
    button.type = 'button';
    button.innerHTML = `
      <span class="launch-module-icon programming-icon" aria-hidden="true">🎓</span>
      <span class="launch-module-copy">
        <strong>Cursos e Capacitações</strong>
        <small>Calendário 2027 da formação adulta • EM TESTE.</small>
      </span>
      <span class="launch-module-arrow" aria-hidden="true">›</span>
    `;
    modules.appendChild(button);

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
          <p>Agenda separada das atividades para apoiar o planejamento de cursos, formações e capacitações.</p>
          <span class="annual-calendar-source test">Regional SC + Nacional • 2027 • TESTE</span>
        </div>
      </section>

      <div class="annual-calendar-note">
        <strong>EM TESTE.</strong> Dados extraídos do Calendário Regional Escoteiro 2027 de Santa Catarina, Versão 1 de 30/09/2026. Documento sujeito a alterações.
      </div>

      <section class="annual-calendar-card" aria-label="Cursos e capacitações 2027">
        <div class="annual-calendar-table">
          <div class="annual-calendar-row annual-calendar-head training-calendar-row">
            <div class="annual-calendar-cell">Data</div>
            <div class="annual-calendar-cell">Curso / capacitação</div>
            <div class="annual-calendar-cell">Local</div>
          </div>
          ${renderTrainingRows()}
        </div>
      </section>

      <footer class="app-footer">GEArPC Conecta • Grupo Escoteiro do Ar Paulo Carzino</footer>
    `;
    shell.appendChild(view);

    button.addEventListener('click', () => {
      hideTopViews(shell);
      view.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'auto' });
    });

    $('trainingCalendarBackButton')?.addEventListener('click', () => {
      view.classList.add('hidden');
      dashboard.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'auto' });
    });

    $('trainingCalendarLogoutButton')?.addEventListener('click', () => {
      view.classList.add('hidden');
      $('logoutButton')?.click();
    });

    const login = $('loginView');
    if (login) {
      new MutationObserver(() => {
        if (!login.classList.contains('hidden')) view.classList.add('hidden');
      }).observe(login, { attributes: true, attributeFilter: ['class'] });
    }
  }

  async function waitProfile() {
    for (let i = 0; i < 80; i += 1) {
      if (profile()) return profile();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return null;
  }

  ensureActivityCalendar();

  const initialReady = (async () => {
    await waitProfile();
    ensureTrainingCalendar();
  })();

  window.GEARPC_DASHBOARD_PREPARE_TASKS = window.GEARPC_DASHBOARD_PREPARE_TASKS || [];
  window.GEARPC_DASHBOARD_PREPARE_TASKS.push(() => initialReady);

  void initialReady;
})();