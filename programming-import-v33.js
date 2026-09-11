(() => {
  const runtime = window.GEARPC_RUNTIME;
  if (!runtime?.client || !runtime?.state) return;

  const $ = (id) => document.getElementById(id);
  const AREAS = ['Físico', 'Afetivo', 'Caráter', 'Espiritual', 'Intelectual', 'Social'];
  const MAX_FILE_SIZE = 15 * 1024 * 1024;
  const PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
  const PDFJS_WORKER_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  const MAMMOTH_URL = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';

  let importSession = null;
  let importButton = null;
  let fileInput = null;
  let banner = null;
  let saveToBankCheckbox = null;
  let originalSaveAndUseText = '';
  let originalSaveText = '';
  let syncTimer = null;

  function normalize(value) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[“”"'()\[\]]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function cleanText(value) {
    return String(value ?? '')
      .replace(/\u00a0/g, ' ')
      .replace(/\r/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function splitLines(value) {
    return cleanText(value).split(/\n+/).map((line) => line.trim()).filter(Boolean);
  }

  function loadScript(id, src, ready) {
    if (ready?.()) return Promise.resolve();
    const current = document.getElementById(id);
    if (current) {
      return new Promise((resolve, reject) => {
        if (ready?.()) return resolve();
        current.addEventListener('load', () => resolve(), { once: true });
        current.addEventListener('error', () => reject(new Error('Falha ao carregar leitor de arquivos.')), { once: true });
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => reject(new Error('Falha ao carregar leitor de arquivos.')), { once: true });
      document.head.appendChild(script);
    });
  }

  async function readPdf(file) {
    await loadScript('gearpcPdfJsV33', PDFJS_URL, () => Boolean(window.pdfjsLib));
    if (!window.pdfjsLib) throw new Error('Leitor de PDF indisponível.');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await window.pdfjsLib.getDocument({ data }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      let pageText = '';
      content.items.forEach((item) => {
        pageText += item.str || '';
        pageText += item.hasEOL ? '\n' : ' ';
      });
      pages.push(cleanText(pageText));
    }
    const text = cleanText(pages.join('\n\n'));
    if (text.length < 30) {
      throw new Error('Este PDF parece ser uma imagem digitalizada e não possui texto suficiente para importação automática.');
    }
    return text;
  }

  async function readDocx(file) {
    await loadScript('gearpcMammothV33', MAMMOTH_URL, () => Boolean(window.mammoth));
    if (!window.mammoth) throw new Error('Leitor de Word indisponível.');
    const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    const text = cleanText(result?.value || '');
    if (text.length < 15) throw new Error('Não foi possível encontrar texto suficiente neste arquivo Word.');
    return text;
  }

  async function readFile(file) {
    if (!file) throw new Error('Nenhum arquivo selecionado.');
    if (file.size > MAX_FILE_SIZE) throw new Error('O arquivo é muito grande. Use um arquivo de até 15 MB.');
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf') || file.type === 'application/pdf') return readPdf(file);
    if (name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return readDocx(file);
    if (name.endsWith('.txt') || name.endsWith('.md') || file.type.startsWith('text/')) return cleanText(await file.text());
    if (name.endsWith('.doc')) throw new Error('O formato Word antigo (.doc) ainda não é suportado. Salve o arquivo como .docx e tente novamente.');
    throw new Error('Formato não suportado. Use PDF, Word (.docx) ou arquivo de texto.');
  }

  const FIELD_ALIASES = {
    nome: ['nome', 'nome da atividade', 'titulo', 'titulo da atividade', 'atividade', 'jogo', 'nome do jogo'],
    ramo: ['ramo', 'ramo indicado', 'ramo sugerido'],
    objetivo: ['objetivo', 'objetivos', 'objetivo educativo', 'objetivos educativos', 'finalidade'],
    duracao: ['duracao', 'tempo', 'tempo previsto', 'duracao prevista'],
    participantes: ['participantes', 'numero de participantes', 'n participantes', 'publico'],
    local: ['local', 'local sugerido', 'ambiente', 'espaco'],
    areas: ['areas de desenvolvimento', 'area de desenvolvimento', 'areas', 'area'],
    eixo: ['eixo', 'eixo de conhecimento'],
    bloco: ['bloco', 'bloco de conhecimento'],
    progressao: ['itens de progressao', 'item de progressao', 'itens relacionados', 'item relacionado', 'competencias', 'competencia'],
    materiais: ['materiais', 'material', 'material necessario', 'materiais necessarios', 'recursos', 'recursos necessarios'],
    preparacao: ['preparacao', 'preparacao previa', 'antes da atividade', 'pre requisitos', 'pre requisitos da atividade'],
    desenvolvimento: ['desenvolvimento', 'passo a passo', 'como fazer', 'procedimento', 'metodologia', 'descricao', 'execucao', 'aplicacao'],
    regras: ['regras', 'regra', 'orientacoes', 'instrucoes'],
    seguranca: ['seguranca', 'cuidados', 'seguranca e cuidados', 'riscos', 'atencao'],
    plano_b: ['plano b', 'alternativa', 'adaptacoes', 'plano alternativo'],
    tags: ['tags', 'palavras chave', 'palavras-chave', 'palavras chaves']
  };

  const ALIAS_LOOKUP = (() => {
    const map = new Map();
    Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => aliases.forEach((alias) => map.set(normalize(alias), field)));
    return map;
  })();

  function detectHeading(line) {
    const raw = String(line || '').trim();
    if (!raw || raw.length > 90) return null;
    const inline = raw.match(/^([^:–—]{2,60})\s*[:–—]\s*(.*)$/);
    if (inline) {
      const field = ALIAS_LOOKUP.get(normalize(inline[1]));
      if (field) return { field, value: inline[2].trim() };
    }
    const field = ALIAS_LOOKUP.get(normalize(raw.replace(/[:–—]+$/, '')));
    return field ? { field, value: '' } : null;
  }

  function parseDuration(value) {
    const text = normalize(value);
    let match = text.match(/\b(\d{1,2})\s*h(?:oras?)?\s*(\d{1,2})?\s*(?:min(?:utos?)?)?\b/);
    if (match) return Math.max(5, Math.min(480, Number(match[1]) * 60 + Number(match[2] || 0)));
    match = text.match(/\b(\d{1,3})\s*(?:min|minuto|minutos)\b/);
    if (match) return Math.max(5, Math.min(480, Number(match[1])));
    match = text.match(/^\s*(\d{1,3})\s*$/);
    if (match) return Math.max(5, Math.min(480, Number(match[1])));
    return 30;
  }

  function parseRamo(value) {
    const text = normalize(value);
    const candidates = [
      ['Filhotes', ['filhote', 'filhotes']],
      ['Lobinho', ['lobinho', 'lobinhos', 'alcateia']],
      ['Escoteiro', ['escoteiro', 'escoteiros', 'tropa escoteira']],
      ['Sênior', ['senior', 'seniores', 'tropa senior']],
      ['Pioneiro', ['pioneiro', 'pioneiros', 'cla pioneiro', 'cla']]
    ];
    for (const [label, words] of candidates) {
      if (words.some((word) => text.includes(word))) return label;
    }
    return '';
  }

  function parseAreas(value) {
    const hay = normalize(value);
    return AREAS.filter((area) => hay.includes(normalize(area)));
  }

  function parseActivityText(text, filename) {
    const cleaned = cleanText(text);
    const lines = cleaned.split('\n').map((line) => line.trim()).filter(Boolean);
    const buckets = {};
    let current = null;

    lines.forEach((line) => {
      const heading = detectHeading(line);
      if (heading) {
        current = heading.field;
        if (heading.value) buckets[current] = buckets[current] ? `${buckets[current]}\n${heading.value}` : heading.value;
        return;
      }
      if (current) buckets[current] = buckets[current] ? `${buckets[current]}\n${line}` : line;
    });

    const baseName = String(filename || 'Atividade')
      .replace(/\.(pdf|docx|txt|md)$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    let name = cleanText(buckets.nome || '') || baseName;
    if (/^(ficha|atividade|ficha de atividade)$/i.test(name) && lines[0] && !detectHeading(lines[0])) name = lines[0].slice(0, 120);

    let development = cleanText(buckets.desenvolvimento || '');
    if (!development && lines.length > 1) {
      const fallback = lines.filter((line) => !detectHeading(line)).slice(name === lines[0] ? 1 : 0).join('\n');
      if (fallback.length >= 40) development = fallback;
    }

    const areas = parseAreas(buckets.areas || '');
    const progress = splitLines(buckets.progressao || '');
    const tags = String(buckets.tags || '').split(/[;,\n]/).map((tag) => tag.trim()).filter(Boolean);

    return {
      nome: name.slice(0, 180),
      ramo: parseRamo(buckets.ramo || ''),
      duracao_min: parseDuration(buckets.duracao || cleaned.match(/dura[cç][aã]o[^\n]{0,40}/i)?.[0] || ''),
      participantes: cleanText(buckets.participantes || ''),
      local_sugerido: cleanText(buckets.local || ''),
      objetivo: cleanText(buckets.objetivo || ''),
      areas_desenvolvimento: areas,
      eixo: cleanText(buckets.eixo || ''),
      bloco: cleanText(buckets.bloco || ''),
      itens_progressao: progress,
      materiais: cleanText(buckets.materiais || ''),
      preparacao: cleanText(buckets.preparacao || ''),
      desenvolvimento: development,
      regras: cleanText(buckets.regras || ''),
      seguranca: cleanText(buckets.seguranca || ''),
      plano_b: cleanText(buckets.plano_b || ''),
      tags: [...new Set(['importada', ...tags])]
    };
  }

  function injectStyles() {
    if ($('programImportStylesV33')) return;
    const style = document.createElement('style');
    style.id = 'programImportStylesV33';
    style.textContent = `
      .program-import-button-v33{white-space:nowrap}
      .program-import-banner-v33{margin:0 0 14px;padding:12px 14px;border:1px solid #b9d5ef;border-radius:12px;background:#eef7ff;color:#234f77;line-height:1.4}
      .program-import-banner-v33 strong{display:block;margin-bottom:4px;color:#153d62}
      .program-import-banner-v33 label{display:flex;gap:8px;align-items:flex-start;margin-top:9px;font-weight:800;color:#173f70}
      .program-import-banner-v33 small{display:block;margin-top:7px;color:#526c84}
      .program-import-banner-v33 input{margin-top:3px}
    `;
    document.head.appendChild(style);
  }

  function setAreas(container, values) {
    const wanted = new Set((values || []).map(normalize));
    container?.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = wanted.has(normalize(input.value));
    });
  }

  function setSelectValue(select, value) {
    if (!select || !value) return;
    const option = [...select.options].find((item) => normalize(item.value) === normalize(value) || normalize(item.textContent) === normalize(value));
    if (option) select.value = option.value;
  }

  function ensureBanner() {
    const form = $('libraryActivityForm');
    if (!form) return null;
    if (banner?.isConnected) return banner;
    banner = document.createElement('div');
    banner.id = 'programImportBannerV33';
    banner.className = 'program-import-banner-v33 hidden';
    banner.innerHTML = `
      <strong>📄 Atividade importada</strong>
      <span id="programImportFileNameV33"></span>
      <label><input type="checkbox" id="programImportSaveToBankV33" checked /> <span>Salvar também no Banco de Ideias</span></label>
      <small>Confira os campos abaixo antes de confirmar. O arquivo original é lido neste aparelho; somente os dados confirmados são salvos no GEArPC Conecta.</small>`;
    form.prepend(banner);
    saveToBankCheckbox = $('programImportSaveToBankV33');
    saveToBankCheckbox?.addEventListener('change', updateImportButtons);
    return banner;
  }

  function updateImportButtons() {
    const saveAndUse = $('saveAndUseLibraryActivityButton');
    const save = $('saveLibraryActivityButton');
    if (!saveAndUse || !importSession) return;
    if (!originalSaveAndUseText) originalSaveAndUseText = saveAndUse.textContent || '';
    if (!originalSaveText && save) originalSaveText = save.textContent || '';
    const saveBank = saveToBankCheckbox?.checked !== false;
    saveAndUse.textContent = saveBank ? 'Salvar no banco e usar na programação' : 'Usar só nesta programação';
    if (save) save.textContent = 'Salvar apenas no Banco de Ideias';
  }

  function resetImportUi() {
    importSession = null;
    if (banner) banner.classList.add('hidden');
    const saveAndUse = $('saveAndUseLibraryActivityButton');
    const save = $('saveLibraryActivityButton');
    if (saveAndUse && originalSaveAndUseText) saveAndUse.textContent = originalSaveAndUseText;
    if (save && originalSaveText) save.textContent = originalSaveText;
  }

  function populateLibraryForm(data, filename) {
    const fields = {
      libraryActivityName: data.nome,
      libraryActivityDuration: String(data.duracao_min || 30),
      libraryActivityParticipants: data.participantes,
      libraryActivityLocation: data.local_sugerido,
      libraryActivityObjective: data.objetivo,
      libraryActivityAxis: data.eixo,
      libraryActivityBlock: data.bloco,
      libraryActivityProgressItems: (data.itens_progressao || []).join('\n'),
      libraryActivityMaterials: data.materiais,
      libraryActivityPreparation: data.preparacao,
      libraryActivityDevelopment: data.desenvolvimento,
      libraryActivityRules: data.regras,
      libraryActivitySafety: data.seguranca,
      libraryActivityPlanB: data.plano_b,
      libraryActivityTags: (data.tags || []).join('; ')
    };
    Object.entries(fields).forEach(([id, value]) => {
      const el = $(id);
      if (el && value != null) el.value = value;
    });
    if (data.ramo) setSelectValue($('libraryActivityRamo'), data.ramo);
    setAreas($('libraryActivityAreas'), data.areas_desenvolvimento || []);
    const title = $('libraryActivityDialogTitle');
    if (title) title.textContent = 'Revisar atividade importada';
    const message = $('libraryActivityMessage');
    if (message) {
      const missing = [];
      if (!data.objetivo) missing.push('objetivo');
      if (!data.desenvolvimento) missing.push('desenvolvimento');
      message.textContent = missing.length
        ? `Importação concluída. Confira a ficha e preencha ${missing.join(' e ')} antes de salvar.`
        : 'Importação concluída. Confira a ficha antes de salvar.';
      message.classList.remove('success-message');
    }
    const currentBanner = ensureBanner();
    if (currentBanner) {
      currentBanner.classList.remove('hidden');
      const fileName = $('programImportFileNameV33');
      if (fileName) fileName.textContent = `Arquivo: ${filename}`;
      if (saveToBankCheckbox) saveToBankCheckbox.checked = true;
    }
    updateImportButtons();
  }

  function collectReviewedActivity() {
    const get = (id) => ($(id)?.value || '').trim();
    const areas = [...($('libraryActivityAreas')?.querySelectorAll('input[type="checkbox"]:checked') || [])].map((input) => input.value);
    return {
      nome: get('libraryActivityName'),
      duracao_min: Number(get('libraryActivityDuration') || 30),
      objetivo: get('libraryActivityObjective'),
      areas_desenvolvimento: areas,
      eixo: get('libraryActivityAxis'),
      bloco: get('libraryActivityBlock'),
      itens_progressao: splitLines(get('libraryActivityProgressItems')),
      materiais: get('libraryActivityMaterials'),
      preparacao: get('libraryActivityPreparation'),
      desenvolvimento: get('libraryActivityDevelopment'),
      regras: get('libraryActivityRules'),
      seguranca: get('libraryActivitySafety'),
      plano_b: get('libraryActivityPlanB')
    };
  }

  async function useWithoutBank() {
    const activity = collectReviewedActivity();
    const message = $('libraryActivityMessage');
    if (!activity.nome || !activity.objetivo || !activity.desenvolvimento) {
      if (message) message.textContent = 'Informe nome, objetivo e desenvolvimento da atividade antes de usar na programação.';
      return;
    }

    const dialog = $('libraryActivityDialog');
    if (dialog?.open) dialog.close();
    resetImportUi();
    const addManual = $('programAddManualButton');
    if (!addManual || addManual.classList.contains('hidden')) {
      window.alert('Esta programação está somente para consulta e não pode receber atividades.');
      return;
    }
    addManual.click();
    window.setTimeout(() => {
      const values = {
        programItemDuration: String(activity.duracao_min || 30),
        programItemName: activity.nome,
        programItemObjective: activity.objetivo,
        programItemAxis: activity.eixo,
        programItemBlock: activity.bloco,
        programItemProgressItems: (activity.itens_progressao || []).join('\n'),
        programItemMaterials: activity.materiais,
        programItemPreparation: activity.preparacao,
        programItemDevelopment: activity.desenvolvimento,
        programItemRules: activity.regras,
        programItemSafety: activity.seguranca,
        programItemPlanB: activity.plano_b
      };
      Object.entries(values).forEach(([id, value]) => {
        const el = $(id);
        if (el && value != null) el.value = value;
      });
      setAreas($('programItemAreas'), activity.areas_desenvolvimento || []);
      const origin = $('programItemOrigin');
      if (origin) origin.value = 'manual';
      const form = $('programItemForm');
      if (form) form.requestSubmit();
    }, 80);
  }

  async function beginImport(file) {
    if (!file) return;
    const oldText = importButton?.textContent || '';
    if (importButton) {
      importButton.disabled = true;
      importButton.textContent = 'Lendo arquivo…';
    }
    try {
      const text = await readFile(file);
      const parsed = parseActivityText(text, file.name);
      const openLibrary = $('programNewLibraryButton');
      if (!openLibrary || openLibrary.classList.contains('hidden')) throw new Error('Você não tem permissão para importar atividades nesta programação.');
      importSession = { filename: file.name, parsed };
      openLibrary.click();
      window.setTimeout(() => populateLibraryForm(parsed, file.name), 60);
    } catch (error) {
      console.error('GEArPC: falha ao importar ficha', error);
      window.alert(error?.message || 'Não foi possível importar esta ficha de atividade.');
      resetImportUi();
    } finally {
      if (importButton) {
        importButton.disabled = false;
        importButton.textContent = oldText || '📥 Importar ficha';
      }
      if (fileInput) fileInput.value = '';
    }
  }

  function syncImportButton() {
    const actionBar = $('programActionBar');
    const addManual = $('programAddManualButton');
    const newLibrary = $('programNewLibraryButton');
    if (!actionBar || !addManual || !newLibrary) return;
    injectStyles();
    if (!importButton?.isConnected) {
      importButton = document.createElement('button');
      importButton.type = 'button';
      importButton.id = 'programImportActivityButtonV33';
      importButton.className = 'secondary-action-button program-import-button-v33';
      importButton.textContent = '📥 Importar ficha';
      importButton.addEventListener('click', () => fileInput?.click());
      newLibrary.insertAdjacentElement('afterend', importButton);
    }
    const unavailable = addManual.classList.contains('hidden') || newLibrary.classList.contains('hidden') || addManual.disabled;
    importButton.classList.toggle('hidden', unavailable);
    importButton.disabled = unavailable;
  }

  function initialize() {
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'programImportFileV33';
      fileInput.accept = '.pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';
      fileInput.className = 'hidden';
      fileInput.addEventListener('change', () => beginImport(fileInput.files?.[0]));
      document.body.appendChild(fileInput);
    }
    ensureBanner();
    syncImportButton();

    const libraryDialog = $('libraryActivityDialog');
    libraryDialog?.addEventListener('close', () => {
      window.setTimeout(() => {
        if (!$('programItemDialog')?.open) resetImportUi();
      }, 120);
    });
  }

  document.addEventListener('click', (event) => {
    const saveAndUse = event.target.closest('#saveAndUseLibraryActivityButton');
    if (saveAndUse && importSession && saveToBankCheckbox?.checked === false) {
      event.preventDefault();
      event.stopImmediatePropagation();
      useWithoutBank();
    }
  }, true);

  const observer = new MutationObserver(() => {
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(syncImportButton, 120);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled'] });

  runtime.client.auth.onAuthStateChange((_event, session) => {
    if (session) window.setTimeout(initialize, 500);
    else resetImportUi();
  });

  initialize();
})();
