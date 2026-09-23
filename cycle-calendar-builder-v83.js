(() => {
  if (window.__GEARPC_CYCLE_CALENDAR_BUILDER_V83__) return;
  window.__GEARPC_CYCLE_CALENDAR_BUILDER_V83__ = true;

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let rt = null;
  let cycle = null;
  let savingCycle = false;

  const esc = (value) => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'","&#039;");

  function fmtDate(value) {
    if (!value) return '';
    const [y,m,d] = String(value).split('-');
    return y && m && d ? `${d}/${m}/${y}` : String(value);
  }

  function setMessage(id, text, ok = false) {
    const el = $(id);
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('ok', Boolean(ok));
  }

  async function waitRuntime() {
    for (let i = 0; i < 140; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.profile && x?.state?.user?.id && $('cycleFormV80')) return x;
      await sleep(150);
    }
    return null;
  }

  function installStyles() {
    if ($('cycleCalendarStylesV83')) return;
    const style = document.createElement('style');
    style.id = 'cycleCalendarStylesV83';
    style.textContent = `
      .cycle-calendar-v83-summary{padding:12px 14px;margin-bottom:13px;border-radius:12px;background:#f5f8fb;border:1px solid #dfe7ee;color:#465d72;line-height:1.45}
      .cycle-calendar-v83-summary strong{display:block;color:#173a63;font-size:1rem;margin-bottom:3px}
      .cycle-calendar-v83-rows{display:grid;gap:10px}
      .cycle-calendar-v83-row{display:grid;grid-template-columns:140px 1fr 1.15fr auto;gap:8px;align-items:start;padding:11px;border:1px solid #dfe6ed;border-radius:13px;background:#fbfcfd}
      .cycle-calendar-v83-row input,.cycle-calendar-v83-row textarea{width:100%;box-sizing:border-box;border:1px solid #c9d2dc;border-radius:9px;padding:9px 10px;background:#fff;font:inherit}
      .cycle-calendar-v83-row textarea{min-height:42px;resize:vertical}
      .cycle-calendar-v83-remove{border:1px solid #e0b7b4;background:#fff;color:#9e2b25;border-radius:9px;padding:9px 10px;font:inherit;font-weight:800;cursor:pointer}
      .cycle-calendar-v83-add{margin-top:12px;border:1px solid #b9cadb;background:#eef5fb;color:#174d78;border-radius:10px;padding:10px 12px;font:inherit;font-weight:900;cursor:pointer}
      .cycle-calendar-v83-note{margin:8px 0 14px;color:#617284;font-size:.86rem;line-height:1.4}
      @media(max-width:700px){.cycle-calendar-v83-row{grid-template-columns:1fr}.cycle-calendar-v83-remove{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function installDialog() {
    if ($('cycleCalendarDialogV83')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <dialog id="cycleCalendarDialogV83" class="member-dialog">
        <form id="cycleCalendarFormV83" class="member-form">
          <div class="dialog-title-row sticky-dialog-header">
            <div><div class="eyebrow dark">CALENDÁRIO DO CICLO</div><h2>Montar calendário do ciclo</h2></div>
            <button id="cycleCalendarCloseV83" type="button" class="dialog-close">×</button>
          </div>
          <div id="cycleCalendarSummaryV83" class="cycle-calendar-v83-summary"></div>
          <p class="cycle-calendar-v83-note">Inclua as datas principais do ciclo. Depois você poderá editar, apagar ou acrescentar outras previsões normalmente.</p>
          <div id="cycleCalendarRowsV83" class="cycle-calendar-v83-rows"></div>
          <button id="cycleCalendarAddV83" type="button" class="cycle-calendar-v83-add">＋ Adicionar outra data</button>
          <p id="cycleCalendarMessageV83" class="cycle-v80-message" role="status"></p>
          <div class="dialog-actions sticky-dialog-actions">
            <button id="cycleCalendarLaterV83" type="button" class="cancel-button">Fazer depois</button>
            <button id="cycleCalendarSaveV83" type="submit" class="save-button">Concluir calendário</button>
          </div>
        </form>
      </dialog>
    `);
  }

  function addRow(row = {}) {
    if (!cycle) return;
    const wrap = document.createElement('div');
    wrap.className = 'cycle-calendar-v83-row';
    wrap.innerHTML = `
      <input class="cycle-calendar-date-v83" type="date" min="${esc(cycle.data_inicio)}" max="${esc(cycle.data_fim)}" value="${esc(row.data || '')}" aria-label="Data" />
      <input class="cycle-calendar-title-v83" type="text" maxlength="220" value="${esc(row.titulo || '')}" placeholder="Atividade ou evento previsto" aria-label="Atividade ou evento previsto" />
      <textarea class="cycle-calendar-obs-v83" rows="2" maxlength="1800" placeholder="Observação opcional" aria-label="Observação">${esc(row.observacao || '')}</textarea>
      <button type="button" class="cycle-calendar-v83-remove" data-cycle-calendar-remove-v83>Remover</button>
    `;
    $('cycleCalendarRowsV83')?.appendChild(wrap);
  }

  function openBuilder(savedCycle) {
    cycle = savedCycle;
    const ramoText = $('cycleRamoV80')?.selectedOptions?.[0]?.textContent?.trim() || 'Ramo';
    $('cycleCalendarSummaryV83').innerHTML =
      `<strong>${esc(cycle.nome)}</strong>${esc(ramoText)} • ${esc(fmtDate(cycle.data_inicio))} a ${esc(fmtDate(cycle.data_fim))}`;
    $('cycleCalendarRowsV83').innerHTML = '';
    addRow();
    setMessage('cycleCalendarMessageV83', '');
    $('cycleCalendarDialogV83')?.showModal();
  }

  function collectRows() {
    return [...document.querySelectorAll('#cycleCalendarRowsV83 .cycle-calendar-v83-row')].map((row) => ({
      data: row.querySelector('.cycle-calendar-date-v83')?.value || '',
      titulo: row.querySelector('.cycle-calendar-title-v83')?.value.trim() || '',
      observacao: row.querySelector('.cycle-calendar-obs-v83')?.value.trim() || ''
    }));
  }

  async function saveCalendar(event) {
    event.preventDefault();
    if (!cycle?.id) return;

    const rows = collectRows().filter((r) => r.data || r.titulo || r.observacao);
    if (rows.some((r) => !r.data || !r.titulo)) {
      setMessage('cycleCalendarMessageV83', 'Toda linha preenchida precisa ter data e atividade/evento.');
      return;
    }
    if (rows.some((r) => r.data < cycle.data_inicio || r.data > cycle.data_fim)) {
      setMessage('cycleCalendarMessageV83', 'Há uma data fora do período do ciclo.');
      return;
    }

    const button = $('cycleCalendarSaveV83');
    button.disabled = true;
    setMessage('cycleCalendarMessageV83', rows.length ? 'Salvando calendário...' : 'Concluindo...');
    try {
      if (rows.length) {
        const payload = rows.map((r) => ({
          ciclo_id: Number(cycle.id),
          data: r.data,
          titulo: r.titulo,
          observacao: r.observacao || null,
          criado_por: rt.state.user.id,
          atualizado_em: new Date().toISOString()
        }));
        const { error } = await rt.client.from('ciclo_programa_previsoes').insert(payload);
        if (error) throw error;
      }
      $('cycleCalendarDialogV83')?.close();
      $('cycleRefreshV80')?.click();
      setMessage('cycleMessageV80', rows.length ? 'Ciclo e calendário salvos.' : 'Ciclo salvo. O calendário poderá ser preenchido depois.', true);
      cycle = null;
    } catch (error) {
      console.error(error);
      setMessage('cycleCalendarMessageV83', 'Não foi possível salvar o calendário.');
    } finally {
      button.disabled = false;
    }
  }

  async function saveNewCycle(event) {
    if (event.target?.id !== 'cycleFormV80') return;
    const id = Number($('cycleIdV80')?.value || 0);
    if (id || savingCycle) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const ramoId = Number($('cycleRamoV80')?.value || 0);
    const nome = $('cycleNameV80')?.value.trim() || '';
    const start = $('cycleStartV80')?.value || '';
    const end = $('cycleEndV80')?.value || '';
    const diagnostico = $('cycleDiagnosisV84')?.value.trim() || '';
    const enfase = $('cycleEmphasisV84')?.value.trim() || '';
    const objetivo = $('cycleObjectiveV80')?.value.trim() || '';

    if (!ramoId || !nome || !start || !end || !objetivo) {
      setMessage('cycleFormMessageV80', 'Preencha ramo, nome, início, encerramento e objetivo do ciclo.');
      return;
    }
    if (end < start) {
      setMessage('cycleFormMessageV80', 'A data de encerramento não pode ser anterior ao início.');
      return;
    }

    savingCycle = true;
    const button = $('cycleSaveV80');
    if (button) {
      button.disabled = true;
      button.textContent = 'Salvando ciclo...';
    }

    try {
      const { data, error } = await rt.client.from('ciclos_programa').insert({
        ramo_id: ramoId,
        nome,
        data_inicio: start,
        data_fim: end,
        diagnostico: diagnostico || null,
        enfase: enfase || null,
        objetivo,
        criado_por: rt.state.user.id,
        atualizado_em: new Date().toISOString()
      }).select('id,ramo_id,nome,data_inicio,data_fim,objetivo').single();

      if (error) throw error;
      $('cycleDialogV80')?.close();
      $('cycleRefreshV80')?.click();
      setMessage('cycleMessageV80', 'Ciclo salvo. Agora monte o calendário.', true);
      openBuilder(data);
    } catch (error) {
      console.error(error);
      setMessage('cycleFormMessageV80', 'Não foi possível salvar o ciclo.');
    } finally {
      savingCycle = false;
      if (button) {
        button.disabled = false;
        button.textContent = 'Salvar e montar calendário';
      }
    }
  }

  function updateCycleSaveButton() {
    const button = $('cycleSaveV80');
    if (!button) return;
    const editing = Number($('cycleIdV80')?.value || 0) > 0;
    button.textContent = editing ? 'Salvar ciclo' : 'Salvar e montar calendário';
  }

  function bind() {
    document.addEventListener('submit', (event) => {
      if (event.target?.id === 'cycleFormV80') void saveNewCycle(event);
    }, true);

    $('cycleCalendarFormV83')?.addEventListener('submit', saveCalendar);
    $('cycleCalendarAddV83')?.addEventListener('click', () => addRow());
    $('cycleCalendarRowsV83')?.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest('[data-cycle-calendar-remove-v83]');
      button?.closest('.cycle-calendar-v83-row')?.remove();
    });

    const closeBuilder = () => {
      $('cycleCalendarDialogV83')?.close();
      setMessage('cycleMessageV80', 'Ciclo salvo. O calendário poderá ser preenchido depois.', true);
      cycle = null;
    };
    $('cycleCalendarCloseV83')?.addEventListener('click', closeBuilder);
    $('cycleCalendarLaterV83')?.addEventListener('click', closeBuilder);

    const dialog = $('cycleDialogV80');
    if (dialog) new MutationObserver(() => {
      if (dialog.open) setTimeout(updateCycleSaveButton, 20);
    }).observe(dialog, { attributes:true, attributeFilter:['open'] });

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('#cycleNewV80,[data-cycle-edit]')) setTimeout(updateCycleSaveButton, 40);
    }, true);
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt) return;
    installStyles();
    installDialog();
    bind();
  }

  void boot();
})();