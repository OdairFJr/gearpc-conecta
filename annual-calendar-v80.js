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
    sections: [],
    selectedSectionId: null,
    loaded: false
  };

  function runtime() { return window.GEARPC_RUNTIME || null; }
  function profile() { return runtime()?.state?.profile || null; }
  function client() { return runtime()?.client || null; }

  function isPreviewProfile() {
    const p = profile();
    return Boolean(p && (p.tipo === 'administrador' || p.eh_teste === true));
  }

  function canPlanSection() {
    const p = profile();
    return Boolean(p && (p.tipo === 'administrador' || (p.eh_teste === true && p.tipo === 'chefia')));
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
      .calendar-scope-mundial{background:#eee9ff;color:#563a99}.calendar-scope-nacional{background:#e9f2ff;color:#174f86}.calendar-scope-regional{background:#e9f6ee;color:#1c6a3b}.calendar-scope-distrital{background:#fff0df;color:#8b5314}.calendar-scope-grupo{background:#e9f5f5;color:#176363}.calendar-scope-secao{background:#fff1cf;color:#775900}
      .calendar-empty{margin:0 18px 28px;padding:24px;text-align:center;color:#60758a;background:#fff;border:1px solid #dbe4ee;border-radius:14px}
      .training-calendar-card{margin:0 18px 28px;background:#fff;border:1px solid #dbe4ee;border-radius:16px;overflow:hidden}
      .training-row{display:grid;grid-template-columns:145px minmax(0,1fr) 185px;border-top:1px solid #e6edf4}
      .training-row:first-child{border-top:0}.training-row>div{padding:12px 13px;line-height:1.4}.training-row strong{color:#17324d}.training-row small{color:#64798d}
      .training-month{padding:9px 13px;background:#edf5ff;color:#0a376c;font-weight:950;border-top:1px solid #d6e5f2}
      @media(max-width:620px){
        .calendar-test-note,.calendar-tools,.calendar-timeline,.training-calendar-card{margin-left:12px;margin-right:12px}
        .calendar-tools-grid{grid-template-columns:1fr}.calendar-tool-btn{width:100%}
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

  async function loadPlanningSections() {
    if (!canPlanSection()) {
      state.sections = [];
      state.selectedSectionId = null;
      return [];
    }

    const c = client();
    const p = profile();
    let sections = [];

    if (p.tipo === 'administrador') {
      const { data, error } = await c.from('secoes')
        .select('id,nome,ramo_id,ativo')
        .eq('ativo', true)
        .order('id');
      if (error) throw error;
      sections = data || [];
    } else {
      const { data: links, error: linkError } = await c.from('chefe_secoes')
        .select('secao_id')
        .eq('chefe_id', p.chefe_id);
      if (linkError) throw linkError;
      const ids = [...new Set((links || []).map((r) => Number(r.secao_id)).filter(Boolean))];
      if (ids.length) {
        const { data, error } = await c.from('secoes')
          .select('id,nome,ramo_id,ativo')
          .in('id', ids)
          .eq('ativo', true)
          .order('id');
        if (error) throw error;
        sections = data || [];
      }
    }

    state.sections = sections;
    if (!state.selectedSectionId || !sections.some((s) => Number(s.id) === Number(state.selectedSectionId))) {
      state.selectedSectionId = sections[0]?.id || null;
    }
    return sections;
  }

  function selectedSection() {
    return state.sections.find((s) => Number(s.id) === Number(state.selectedSectionId)) || null;
  }

  function commonEventAppliesToSection(event, section) {
    if (event.secao_id) return Number(event.secao_id) === Number(section?.id);
    if (!section) return true;
    if (!Array.isArray(event.ramo_ids) || !event.ramo_ids.length) return true;
    return event.ramo_ids.map(Number).includes(Number(section.ramo_id));
  }

  function activityEventsForCurrentView() {
    if (!isPreviewProfile()) return sortEvents(LEGACY_NATIONAL_EVENTS);

    const section = selectedSection();
    const rows = state.events.filter((e) => e.categoria === 'atividade');
    if (!section) return sortEvents(rows.filter((e) => !e.secao_id));
    return sortEvents(rows.filter((e) => commonEventAppliesToSection(e, section)));
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

  function renderSectionTools() {
    const host = $('sectionCalendarTools');
    if (!host) return;
    const visible = isPreviewProfile() && canPlanSection();
    host.classList.toggle('hidden', !visible);
    if (!visible) return;

    const select = $('sectionCalendarSelect');
    if (select) {
      select.innerHTML = state.sections.map((s) => `<option value="${Number(s.id)}">${esc(s.nome)}</option>`).join('');
      if (state.selectedSectionId) select.value = String(state.selectedSectionId);
    }

    const enabled = Boolean(selectedSection());
    $('sectionCalendarDownload')?.toggleAttribute('disabled', !enabled);
    $('sectionCalendarImportButton')?.toggleAttribute('disabled', !enabled);
  }

  function renderActivityCalendar() {
    const view = $('annualCalendarView');
    if (!view) return;
    const preview = isPreviewProfile();
    const section = selectedSection();
    const title = $('annualCalendarTitle');
    const source = $('annualCalendarSource');
    const note = $('annualCalendarTestNote');
    const body = $('annualCalendarTimeline');

    if (title) {
      title.textContent = preview && section
        ? `Calendário completo • ${section.nome}`
        : 'Calendário de Atividades 2027';
    }
    if (source) {
      source.textContent = preview ? 'Mundial • Nacional • Regional • Distrital • Grupo • Seção • TESTE' : 'Nacional • 2027';
      source.classList.toggle('test', preview);
    }
    note?.classList.toggle('hidden', !preview);
    renderSectionTools();
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

  function csvEscape(value) {
    const s = String(value ?? '');
    return `"${s.replaceAll('"', '""')}"`;
  }

  function safeFileName(value) {
    return normalize(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'secao';
  }

  function toCsvDate(iso) {
    return iso ? formatDate(iso) : '';
  }

  function downloadSectionCsv() {
    const section = selectedSection();
    if (!section) return;

    const rows = activityEventsForCurrentView();
    const header = ['Data inicial','Data final','Atividade','Abrangência','Local','Seção','Observações'];
    const table = [header];

    for (const e of rows) {
      table.push([
        toCsvDate(e.data_inicio),
        toCsvDate(e.data_fim),
        e.atividade,
        e.abrangencia,
        e.local || '',
        section.nome,
        e.observacoes || ''
      ]);
    }

    // Linhas prontas para preenchimento das atividades próprias da seção.
    for (let i = 0; i < 10; i += 1) {
      table.push(['','','','SEÇÃO','',section.nome,'']);
    }

    const csv = '\ufeff' + table.map((row) => row.map(csvEscape).join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Calendario_2027_${safeFileName(section.nome)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      const next = text[i + 1];
      if (quoted) {
        if (ch === '"' && next === '"') {
          field += '"';
          i += 1;
        } else if (ch === '"') {
          quoted = false;
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        quoted = true;
      } else if (ch === ';') {
        row.push(field);
        field = '';
      } else if (ch === '\n') {
        row.push(field.replace(/\r$/, ''));
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
    if (field.length || row.length) {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
    }
    return rows.filter((r) => r.some((v) => String(v).trim()));
  }

  function parseInputDate(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    const d = new Date(Date.UTC(year, month - 1, day));
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
    return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }

  async function importSectionCsv(file) {
    const section = selectedSection();
    const status = $('sectionCalendarImportStatus');
    if (!section || !file) return;
    if (status) status.textContent = 'Lendo planilha…';

    try {
      const text = await file.text();
      const rows = parseCsv(text.replace(/^\uFEFF/, ''));
      if (rows.length < 2) throw new Error('A planilha não possui linhas para importar.');

      const headers = rows[0].map((h) => normalize(h));
      const indexOf = (...names) => {
        for (const name of names) {
          const idx = headers.indexOf(normalize(name));
          if (idx >= 0) return idx;
        }
        return -1;
      };

      const ixStart = indexOf('Data inicial');
      const ixEnd = indexOf('Data final');
      const ixActivity = indexOf('Atividade');
      const ixScope = indexOf('Abrangência','Abrangencia');
      const ixLocal = indexOf('Local');
      const ixNotes = indexOf('Observações','Observacoes');

      if (ixStart < 0 || ixActivity < 0 || ixScope < 0) {
        throw new Error('Use a planilha baixada pelo GEArPC Conecta; faltam colunas obrigatórias.');
      }

      const imported = [];
      for (let i = 1; i < rows.length; i += 1) {
        const r = rows[i];
        const scope = normalize(r[ixScope]);
        if (scope !== 'secao') continue;

        const activity = String(r[ixActivity] || '').trim();
        const start = parseInputDate(r[ixStart]);
        const end = ixEnd >= 0 ? parseInputDate(r[ixEnd]) : null;
        if (!activity && !start) continue;
        if (!activity || !start) throw new Error(`Linha ${i + 1}: informe Data inicial e Atividade.`);
        if (end && end < start) throw new Error(`Linha ${i + 1}: a Data final não pode ser anterior à inicial.`);

        imported.push({
          ano: YEAR,
          categoria: 'atividade',
          data_inicio: start,
          data_fim: end,
          atividade: activity,
          abrangencia: 'Seção',
          local: ixLocal >= 0 ? (String(r[ixLocal] || '').trim() || null) : null,
          secao_id: Number(section.id),
          ramo_ids: [Number(section.ramo_id)],
          observacoes: ixNotes >= 0 ? (String(r[ixNotes] || '').trim() || null) : null,
          fonte: 'Planejamento da seção',
          versao_fonte: 'Importado pelo GEArPC Conecta',
          em_teste: true
        });
      }

      if (!imported.length) {
        throw new Error('Nenhuma atividade com abrangência SEÇÃO foi encontrada. Preencha ao menos uma das linhas de seção.');
      }

      const ok = window.confirm(
        `Importar ${imported.length} atividade(s) para ${section.nome}?\n\nAs atividades de seção atualmente salvas para 2027 serão substituídas pelas desta planilha. Os eventos Mundial, Nacional, Regional, Distrital e de Grupo não serão alterados.`
      );
      if (!ok) {
        if (status) status.textContent = 'Importação cancelada.';
        return;
      }

      const c = client();
      const { data: oldRows, error: oldError } = await c.from('calendario_eventos')
        .select('id')
        .eq('ano', YEAR)
        .eq('secao_id', Number(section.id))
        .eq('abrangencia', 'Seção');
      if (oldError) throw oldError;

      const { data: inserted, error: insertError } = await c.from('calendario_eventos')
        .insert(imported)
        .select('id');
      if (insertError) throw insertError;

      const oldIds = (oldRows || []).map((r) => r.id).filter(Boolean);
      if (oldIds.length) {
        const { error: deleteError } = await c.from('calendario_eventos').delete().in('id', oldIds);
        if (deleteError) {
          const newIds = (inserted || []).map((r) => r.id).filter(Boolean);
          if (newIds.length) await c.from('calendario_eventos').delete().in('id', newIds);
          throw deleteError;
        }
      }

      await loadPreviewEvents(true);
      renderActivityCalendar();
      if (status) status.textContent = `✓ ${imported.length} atividade(s) de ${section.nome} importada(s).`;
    } catch (error) {
      if (status) status.textContent = `Não foi possível importar: ${error.message || error}`;
    } finally {
      const input = $('sectionCalendarImportInput');
      if (input) input.value = '';
    }
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
        <strong>EM TESTE.</strong> Base de 2027 organizada a partir do calendário regional de Santa Catarina. Cada atividade traz sua abrangência. Eventos de Grupo e Distrital aparecerão automaticamente na mesma linha do tempo quando forem cadastrados. O documento regional é sujeito a alterações.
      </div>

      <section id="sectionCalendarTools" class="calendar-tools hidden">
        <h3>Calendário da seção</h3>
        <p>Baixe a planilha já com os eventos comuns, acrescente as atividades da seção e importe de volta. Na importação, somente as linhas marcadas como <strong>SEÇÃO</strong> são gravadas.</p>
        <div class="calendar-tools-grid">
          <label>Seção
            <select id="sectionCalendarSelect"></select>
          </label>
          <button id="sectionCalendarDownload" class="calendar-tool-btn secondary" type="button">⬇ Baixar planilha</button>
          <button id="sectionCalendarImportButton" class="calendar-tool-btn" type="button">⬆ Importar planilha</button>
        </div>
        <input id="sectionCalendarImportInput" type="file" accept=".csv,text/csv" hidden>
        <p id="sectionCalendarImportStatus" class="calendar-import-status" role="status"></p>
      </section>

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
    $('sectionCalendarSelect')?.addEventListener('change', (event) => {
      state.selectedSectionId = Number(event.target.value || 0) || null;
      renderActivityCalendar();
    });
    $('sectionCalendarDownload')?.addEventListener('click', downloadSectionCsv);
    $('sectionCalendarImportButton')?.addEventListener('click', () => $('sectionCalendarImportInput')?.click());
    $('sectionCalendarImportInput')?.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (file) void importSectionCsv(file);
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

    activityButton.addEventListener('click', async () => {
      if (isPreviewProfile()) {
        await Promise.all([loadPreviewEvents(), loadPlanningSections()]);
      }
      renderActivityCalendar();
      hideTopViews(shell);
      $('annualCalendarView')?.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, { once: false });

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
      await Promise.allSettled([loadPreviewEvents(), loadPlanningSections()]);
      renderActivityCalendar();
      if (canSeeTraining()) renderTrainingCalendar();
    }
  })();

  window.GEARPC_DASHBOARD_PREPARE_TASKS = window.GEARPC_DASHBOARD_PREPARE_TASKS || [];
  window.GEARPC_DASHBOARD_PREPARE_TASKS.push(() => initialReady);
})();