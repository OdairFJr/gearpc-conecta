(() => {
  if (window.__GEARPC_CYCLE_IMPORT_V84__) return;
  window.__GEARPC_CYCLE_IMPORT_V81__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let imported = null;

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function setMsg(text, ok = false) {
    const el = $('cycleImportMessageV81');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('ok', Boolean(ok));
  }

  function loadScript(id, src) {
    return new Promise((resolve, reject) => {
      if ($(id)) {
        if ($(id).dataset.loaded === '1') return resolve();
        $(id).addEventListener('load', resolve, { once:true });
        $(id).addEventListener('error', reject, { once:true });
        return;
      }
      const s = document.createElement('script');
      s.id = id;
      s.src = src;
      s.async = true;
      s.addEventListener('load', () => { s.dataset.loaded = '1'; resolve(); }, { once:true });
      s.addEventListener('error', () => reject(new Error('Não foi possível carregar o leitor do arquivo.')), { once:true });
      document.head.appendChild(s);
    });
  }

  async function extractPdf(file) {
    await loadScript('gearpcPdfJsV81', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    if (!window.pdfjsLib) throw new Error('Leitor de PDF indisponível.');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str || '').join(' '));
    }
    return pages.join('\n\n');
  }

  async function extractDocx(file) {
    await loadScript('gearpcMammothV81', 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js');
    if (!window.mammoth) throw new Error('Leitor de Word indisponível.');
    const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value || '';
  }

  async function extractSpreadsheet(file) {
    await loadScript('gearpcXlsxV81', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    if (!window.XLSX) throw new Error('Leitor de Excel indisponível.');
    const wb = window.XLSX.read(await file.arrayBuffer(), { type:'array', cellDates:false });
    const out = [];
    for (const name of wb.SheetNames) {
      out.push('PLANILHA: ' + name);
      out.push(window.XLSX.utils.sheet_to_csv(wb.Sheets[name], { blankrows:false }));
    }
    return out.join('\n\n');
  }

  async function extractText(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) return extractPdf(file);
    if (name.endsWith('.docx')) return extractDocx(file);
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return extractSpreadsheet(file);
    if (name.endsWith('.doc')) throw new Error('Arquivo Word antigo (.doc). Salve-o como .docx e tente novamente.');
    throw new Error('Formato não suportado. Use PDF, Word (.docx) ou Excel (.xlsx/.xls).');
  }

  function normalizeRamo(value) {
    const raw = String(value || '').trim().toLocaleLowerCase('pt-BR');
    const options = [...($('cycleImportRamoV81')?.options || [])];
    return options.find((o) => String(o.textContent || '').trim().toLocaleLowerCase('pt-BR') === raw)?.value || '';
  }

  function installUi() {
    if (!$('cycleImportV81')) {
      const button = document.createElement('button');
      button.id = 'cycleImportV81';
      button.type = 'button';
      button.className = 'secondary-action-button';
      button.textContent = '📄 Importar arquivo';
      $('cycleNewV80')?.insertAdjacentElement('beforebegin', button);
    }

    if (!$('cycleImportDialogV81')) {
      document.body.insertAdjacentHTML('beforeend', `
        <dialog id="cycleImportDialogV81" class="member-dialog">
          <div class="detail-shell">
            <div class="dialog-title-row sticky-dialog-header">
              <div>
                <div class="eyebrow dark">IMPORTAR CICLO DE PROGRAMA</div>
                <h2>Converter arquivo(s) para o Conecta</h2>
                <p class="dialog-helper">Envie um ou mais arquivos do mesmo ciclo. O app combina os conteúdos e monta uma única versão para conferência antes de salvar.</p>
              </div>
              <button id="cycleImportCloseV81" type="button" class="dialog-close" aria-label="Fechar">×</button>
            </div>

            <section id="cycleImportPickV81" class="cycle-import-v81-box">
              <label class="cycle-import-v81-file">
                <strong>Arquivo(s) do ciclo</strong>
                <input id="cycleImportFileV81" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
                <small>Você pode selecionar vários arquivos do mesmo ciclo ao mesmo tempo — por exemplo, diagnóstico em PDF + calendário em Excel. Aceita PDF, Word (.docx) e Excel (.xlsx/.xls). Arquivos .doc antigos precisam ser salvos como .docx.</small>
              </label>
              <button id="cycleImportReadV81" type="button" class="save-button">Interpretar arquivo(s)</button>
            </section>

            <form id="cycleImportReviewV81" class="hidden">
              <div class="cycle-import-v81-grid">
                <label>Ramo <span class="cycle-import-v81-required">obrigatório</span><select id="cycleImportRamoV81" required></select></label>
                <label>Nome do ciclo <span class="cycle-import-v81-required">obrigatório</span><input id="cycleImportNameV81" required maxlength="140" /></label>
                <label>Data de início <span class="cycle-import-v81-required">obrigatório</span><input id="cycleImportStartV81" type="date" required /></label>
                <label>Data de encerramento <span class="cycle-import-v81-required">obrigatório</span><input id="cycleImportEndV81" type="date" required /></label>
              </div>
              <label class="cycle-import-v81-stack">Diagnóstico <span class="cycle-import-v81-required">revise antes de salvar</span><textarea id="cycleImportDiagnosisV84" rows="5" maxlength="8000" placeholder="Diagnóstico identificado nos documentos"></textarea></label>
              <label class="cycle-import-v81-stack">Ênfase <span class="cycle-import-v81-required">revise antes de salvar</span><textarea id="cycleImportEmphasisV84" rows="4" maxlength="4000" placeholder="Ênfase ou prioridade definida para o ciclo"></textarea></label>
              <label class="cycle-import-v81-stack">Objetivo do ciclo <span class="cycle-import-v81-required">obrigatório</span><textarea id="cycleImportObjectiveV81" rows="4" required maxlength="2400"></textarea></label>

              <div id="cycleImportWarningsV81" class="cycle-import-v81-warnings hidden"></div>

              <div class="cycle-import-v81-section-head">
                <div><strong>Previsões identificadas</strong><small>Revise as datas e atividades antes de salvar.</small></div>
                <button id="cycleImportAddRowV81" type="button" class="secondary-action-button">＋ Adicionar previsão</button>
              </div>
              <div id="cycleImportRowsV81" class="cycle-import-v81-rows"></div>

              <p id="cycleImportMessageV81" class="cycle-import-v81-message" role="status"></p>
              <div class="dialog-actions sticky-dialog-actions">
                <button id="cycleImportBackV81" type="button" class="cancel-button">Escolher outros arquivos</button>
                <button id="cycleImportSaveV81" type="submit" class="save-button">Salvar no Ciclo de Programa</button>
              </div>
            </form>
          </div>
        </dialog>
      `);
    }

    if (!$('cycleImportStylesV81')) {
      const style = document.createElement('style');
      style.id = 'cycleImportStylesV81';
      style.textContent = `
        .cycle-import-v81-box{display:grid;gap:16px;padding:8px 0 4px}.cycle-import-v81-file{display:grid;gap:8px;font-weight:800;color:#425466}
        .cycle-import-v81-file input{border:1px dashed #9eb0c2;border-radius:14px;padding:18px;background:#f8fafc;font:inherit}.cycle-import-v81-file small{font-weight:500;color:#68798a;line-height:1.4}
        .cycle-import-v81-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cycle-import-v81-grid label,.cycle-import-v81-stack{display:flex;flex-direction:column;gap:6px;font-weight:800;color:#425466}
        .cycle-import-v81-grid input,.cycle-import-v81-grid select,.cycle-import-v81-stack textarea,.cycle-import-v81-row input,.cycle-import-v81-row textarea{width:100%;box-sizing:border-box;border:1px solid #c9d2dc;border-radius:10px;padding:10px 11px;background:#fff;font:inherit}
        .cycle-import-v81-stack{margin-top:12px}.cycle-import-v81-required{color:#a22520;font-size:.72rem;font-weight:900}
        .cycle-import-v81-section-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin:20px 0 10px}.cycle-import-v81-section-head div{display:grid;gap:3px}.cycle-import-v81-section-head small{color:#68798a}
        .cycle-import-v81-rows{display:grid;gap:10px}.cycle-import-v81-row{display:grid;grid-template-columns:135px 1fr 1.2fr auto;gap:8px;align-items:start;padding:10px;border:1px solid #e0e6ec;border-radius:12px;background:#fbfcfd}
        .cycle-import-v81-row textarea{min-height:42px;resize:vertical}.cycle-import-v81-row button{border:1px solid #e0b7b4;background:#fff;color:#9e2b25;border-radius:10px;padding:10px;cursor:pointer;font:inherit;font-weight:800}
        .cycle-import-v81-warnings{margin:14px 0;padding:12px 14px;border-radius:12px;background:#fff8e6;border:1px solid #efd89c;color:#6b5417;line-height:1.45}
        .cycle-import-v81-message{min-height:20px;color:#9e2b25;font-weight:700}.cycle-import-v81-message.ok{color:#24663a}
        @media(max-width:760px){.cycle-import-v81-grid{grid-template-columns:1fr}.cycle-import-v81-row{grid-template-columns:1fr}.cycle-import-v81-section-head{align-items:stretch;flex-direction:column}.cycle-import-v81-section-head button{width:100%}}
      `;
      document.head.appendChild(style);
    }
  }

  function allowedRamos() {
    const source = $('cycleRamoV80');
    return [...(source?.options || [])].map((o) => ({ value:o.value, label:o.textContent })).filter((o) => o.value);
  }

  function resetDialog() {
    imported = null;
    $('cycleImportFileV81').value = '';
    $('cycleImportPickV81').classList.remove('hidden');
    $('cycleImportReviewV81').classList.add('hidden');
    $('cycleImportRowsV81').innerHTML = '';
    $('cycleImportWarningsV81').classList.add('hidden');
    $('cycleImportWarningsV81').innerHTML = '';
    setMsg('');
  }

  function addRow(row = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'cycle-import-v81-row';
    wrap.innerHTML = `
      <input class="cycle-import-date-v81" type="date" value="${esc(row.data || '')}" aria-label="Data" />
      <input class="cycle-import-title-v81" value="${esc(row.titulo || '')}" maxlength="220" placeholder="Atividade ou evento previsto" aria-label="Atividade ou evento" />
      <textarea class="cycle-import-obs-v81" rows="2" maxlength="1800" placeholder="Observação opcional" aria-label="Observação">${esc(row.observacao || '')}</textarea>
      <button type="button" data-remove-import-row>Remover</button>
    `;
    $('cycleImportRowsV81').appendChild(wrap);
  }

  function fillReview(cycle) {
    const ramos = allowedRamos();
    $('cycleImportRamoV81').innerHTML = ramos.map((r) => `<option value="${esc(r.value)}">${esc(r.label)}</option>`).join('');
    $('cycleImportRamoV81').value = normalizeRamo(cycle.ramo) || ramos[0]?.value || '';
    $('cycleImportNameV81').value = cycle.nome || '';
    $('cycleImportStartV81').value = /^\d{4}-\d{2}-\d{2}$/.test(cycle.data_inicio || '') ? cycle.data_inicio : '';
    $('cycleImportEndV81').value = /^\d{4}-\d{2}-\d{2}$/.test(cycle.data_fim || '') ? cycle.data_fim : '';
    $('cycleImportDiagnosisV84').value = cycle.diagnostico || '';
    $('cycleImportEmphasisV84').value = cycle.enfase || '';
    $('cycleImportObjectiveV81').value = cycle.objetivo || '';
    $('cycleImportRowsV81').innerHTML = '';
    (cycle.previsoes || []).forEach(addRow);
    if (!(cycle.previsoes || []).length) addRow();

    const warnings = Array.isArray(cycle.avisos) ? cycle.avisos.filter(Boolean) : [];
    if (warnings.length) {
      $('cycleImportWarningsV81').innerHTML = '<strong>Confira estes pontos:</strong><br>' + warnings.map((w) => '• ' + esc(w)).join('<br>');
      $('cycleImportWarningsV81').classList.remove('hidden');
    } else {
      $('cycleImportWarningsV81').classList.add('hidden');
    }

    $('cycleImportPickV81').classList.add('hidden');
    $('cycleImportReviewV81').classList.remove('hidden');
    setMsg('Revise os campos abaixo. Nada será salvo até você confirmar.');
  }

  async function interpretFile() {
    const files = [...($('cycleImportFileV81')?.files || [])];
    if (!files.length) { setMsg('Selecione pelo menos um arquivo para importar.'); return; }
    if (files.length > 8) { setMsg('Selecione no máximo 8 arquivos por importação.'); return; }

    const button = $('cycleImportReadV81');
    button.disabled = true;
    button.textContent = files.length > 1 ? 'Lendo arquivos...' : 'Lendo arquivo...';
    setMsg(files.length > 1 ? `Extraindo o conteúdo de ${files.length} arquivos...` : 'Extraindo o conteúdo do arquivo...');

    try {
      const documents = [];
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        setMsg(`Lendo ${i + 1} de ${files.length}: ${file.name}`);
        const text = await extractText(file);
        if (!String(text).trim() || String(text).trim().length < 30) {
          throw new Error(`Não encontrei texto suficiente em "${file.name}". Se for um PDF escaneado como imagem, esta versão ainda não consegue interpretá-lo.`);
        }
        documents.push({ filename:file.name, text:String(text).slice(0, 70000) });
      }

      setMsg(files.length > 1
        ? 'Combinando os documentos e organizando diagnóstico, ênfase, objetivo e calendário...'
        : 'Interpretando o ciclo e organizando as informações...');

      const { data, error } = await rt.client.functions.invoke('importar-ciclo-programa-ia', {
        body: { documents }
      });
      if (error) throw error;
      if (!data?.cycle) throw new Error('Os arquivos foram lidos, mas não foi possível montar o ciclo.');
      imported = data.cycle;
      fillReview(imported);
      setMsg(`${files.length} arquivo(s) interpretado(s). Revise os campos abaixo antes de salvar.`, true);
    } catch (error) {
      console.error(error);
      setMsg(error?.message || 'Não foi possível importar estes arquivos.');
    } finally {
      button.disabled = false;
      button.textContent = 'Interpretar arquivo(s)';
    }
  }

  function collectRows() {
    return [...document.querySelectorAll('#cycleImportRowsV81 .cycle-import-v81-row')].map((row) => ({
      data: row.querySelector('.cycle-import-date-v81')?.value || '',
      titulo: row.querySelector('.cycle-import-title-v81')?.value.trim() || '',
      observacao: row.querySelector('.cycle-import-obs-v81')?.value.trim() || ''
    })).filter((r) => r.data || r.titulo || r.observacao);
  }

  async function saveImported(event) {
    event.preventDefault();
    const ramoId = Number($('cycleImportRamoV81').value || 0);
    const nome = $('cycleImportNameV81').value.trim();
    const start = $('cycleImportStartV81').value;
    const end = $('cycleImportEndV81').value;
    const diagnostico = $('cycleImportDiagnosisV84').value.trim();
    const enfase = $('cycleImportEmphasisV84').value.trim();
    const objetivo = $('cycleImportObjectiveV81').value.trim();
    const rows = collectRows();

    if (!ramoId || !nome || !start || !end || !objetivo) {
      setMsg('Preencha ramo, nome, início, encerramento e objetivo do ciclo.');
      return;
    }
    if (end < start) { setMsg('A data de encerramento não pode ser anterior ao início.'); return; }
    const incomplete = rows.find((r) => !r.data || !r.titulo);
    if (incomplete) { setMsg('Toda previsão mantida precisa ter data e atividade/evento. Remova linhas vazias ou complete-as.'); return; }
    const outside = rows.find((r) => r.data < start || r.data > end);
    if (outside) { setMsg('Há previsão fora do período do ciclo. Ajuste a data ou o período antes de salvar.'); return; }

    const button = $('cycleImportSaveV81');
    button.disabled = true;
    setMsg('Salvando o ciclo importado...');
    let cycleId = null;
    try {
      const { data:cycle, error } = await rt.client.from('ciclos_programa').insert({
        ramo_id:ramoId, nome, data_inicio:start, data_fim:end,
        diagnostico:diagnostico || null, enfase:enfase || null, objetivo,
        criado_por:rt.state.user.id, atualizado_em:new Date().toISOString()
      }).select('id').single();
      if (error) throw error;
      cycleId = Number(cycle.id);

      if (rows.length) {
        const payload = rows.map((r) => ({
          ciclo_id:cycleId, data:r.data, titulo:r.titulo, observacao:r.observacao || null,
          criado_por:rt.state.user.id, atualizado_em:new Date().toISOString()
        }));
        const { error:predError } = await rt.client.from('ciclo_programa_previsoes').insert(payload);
        if (predError) throw predError;
      }

      setMsg('Ciclo importado e salvo com sucesso.', true);
      $('cycleRefreshV80')?.click();
      setTimeout(() => {
        $('cycleImportDialogV81')?.close();
        resetDialog();
      }, 700);
    } catch (error) {
      console.error(error);
      if (cycleId) {
        try { await rt.client.from('ciclos_programa').delete().eq('id', cycleId); } catch (_) {}
      }
      setMsg('Não foi possível salvar o ciclo importado. Nenhum ciclo incompleto foi mantido.');
    } finally {
      button.disabled = false;
    }
  }

  function wire() {
    $('cycleImportV81')?.addEventListener('click', () => {
      resetDialog();
      $('cycleImportDialogV81')?.showModal();
    });
    $('cycleImportCloseV81')?.addEventListener('click', () => $('cycleImportDialogV81')?.close());
    $('cycleImportReadV81')?.addEventListener('click', () => void interpretFile());
    $('cycleImportBackV81')?.addEventListener('click', resetDialog);
    $('cycleImportAddRowV81')?.addEventListener('click', () => addRow());
    $('cycleImportReviewV81')?.addEventListener('submit', saveImported);
    $('cycleImportRowsV81')?.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest('[data-remove-import-row]');
      button?.closest('.cycle-import-v81-row')?.remove();
    });
  }

  async function boot() {
    for (let i = 0; i < 120; i += 1) {
      rt = window.GEARPC_RUNTIME;
      if (rt?.client && rt?.state?.profile && $('cycleNewV80') && $('cycleRamoV80')) break;
      await sleep(250);
    }
    if (!rt?.client || !$('cycleNewV80')) return;

    const tipo = rt.state.profile?.tipo;
    const enabled = tipo === 'administrador' || tipo === 'chefia' || tipo === 'dirigente';
    if (!enabled) return;

    installUi();
    const ramos = allowedRamos();
    $('cycleImportRamoV81').innerHTML = ramos.map((r) => `<option value="${esc(r.value)}">${esc(r.label)}</option>`).join('');
    wire();
  }

  void boot();
})();