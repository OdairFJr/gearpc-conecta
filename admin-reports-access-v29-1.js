(() => {
  if (window.__GEARPC_ADMIN_REPORTS_ACCESS_V29_1__) return;
  window.__GEARPC_ADMIN_REPORTS_ACCESS_V29_1__ = true;

  const rt = window.GEARPC_RUNTIME;
  if (!rt?.client || !rt?.state) return;
  const { client, state } = rt;
  const $ = (id) => document.getElementById(id);
  const PDF_LIB = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  const AUTOTABLE_LIB = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js';
  let accessRows = [];
  let preparing = null;
  let patched = false;
  let bypassGenerate = false;

  function fmtDateTime(value) {
    if (!value) return '-';
    try {
      return new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(value));
    } catch (_) { return String(value); }
  }

  function loadScript(src, id) {
    return new Promise((resolve, reject) => {
      if ($(id)) {
        if ($(id).dataset.loaded === 'true' || (id === 'gearpcJsPdfLib' && window.jspdf?.jsPDF)) return resolve();
        $(id).addEventListener('load', resolve, { once:true });
        $(id).addEventListener('error', reject, { once:true });
        return;
      }
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
      script.onerror = () => reject(new Error('Não foi possível carregar a biblioteca de PDF.'));
      document.head.appendChild(script);
    });
  }

  async function loadAccessRows() {
    const { data, error } = await client.rpc('relatorio_acessos_usuarios');
    if (error) throw error;
    accessRows = data || [];
  }

  function historicSelected() {
    return Boolean(document.querySelector('[data-report-block="historico"]')?.checked);
  }

  function patchConstructor() {
    if (patched || !window.jspdf?.jsPDF) return;
    const Original = window.jspdf.jsPDF;
    const Wrapped = function(...args) {
      const doc = new Original(...args);
      const originalSave = doc.save.bind(doc);
      doc.save = function(filename, options) {
        if (historicSelected() && accessRows.length && typeof doc.autoTable === 'function') {
          try {
            const start = $('reportStart')?.value || '';
            const end = $('reportEnd')?.value || '';
            doc.addPage();
            doc.setFont('helvetica','bold');
            doc.setFontSize(14);
            doc.setTextColor(10,55,108);
            doc.text('Acessos ao GEArPC Conecta', 14, 18);
            doc.setFont('helvetica','normal');
            doc.setFontSize(8.5);
            doc.setTextColor(85);
            doc.text('Visão cadastral de acesso. O total de aberturas é acumulado e não representa apenas o período selecionado.', 14, 24);
            if (start && end) doc.text(`Período principal do relatório: ${start.split('-').reverse().join('/')} a ${end.split('-').reverse().join('/')}`, 14, 29);
            doc.autoTable({
              startY: 34,
              head: [['Usuário','Perfil','Conta criada','Último login','Primeiro acesso app','Último acesso app','Aberturas','Instalado']],
              body: accessRows.map((r) => [
                r.nome_completo || r.email || '-',
                r.tipo || '-',
                fmtDateTime(r.conta_criada_em),
                fmtDateTime(r.ultimo_login_em),
                fmtDateTime(r.primeiro_acesso_app),
                fmtDateTime(r.ultimo_acesso_app),
                String(r.total_aberturas || 0),
                r.abriu_como_app ? 'Sim' : 'Não'
              ]),
              theme:'grid',
              styles:{ fontSize:6.5, cellPadding:1.4, valign:'top', overflow:'linebreak' },
              headStyles:{ fillColor:[10,55,108], textColor:255, fontStyle:'bold' },
              alternateRowStyles:{ fillColor:[247,249,251] },
              margin:{ left:10, right:10, bottom:16 },
              columnStyles:{ 0:{cellWidth:31}, 1:{cellWidth:18}, 2:{cellWidth:24}, 3:{cellWidth:24}, 4:{cellWidth:24}, 5:{cellWidth:24}, 6:{cellWidth:15}, 7:{cellWidth:15} }
            });
          } catch (error) {
            console.warn('GEArPC: não foi possível acrescentar a página de acessos ao PDF.', error);
          }
        }
        return originalSave(filename, options);
      };
      return doc;
    };
    Object.setPrototypeOf(Wrapped, Original);
    Wrapped.prototype = Original.prototype;
    Object.keys(Original).forEach((key) => { try { Wrapped[key] = Original[key]; } catch (_) {} });
    Wrapped.API = Original.API;
    window.jspdf.jsPDF = Wrapped;
    patched = true;
  }

  async function prepare() {
    if (preparing) return preparing;
    preparing = (async () => {
      await Promise.all([
        loadAccessRows(),
        (async () => {
          if (!window.jspdf?.jsPDF) await loadScript(PDF_LIB, 'gearpcJsPdfLib');
          if (!window.jspdf?.jsPDF) throw new Error('Biblioteca PDF indisponível.');
          const probe = new window.jspdf.jsPDF();
          if (typeof probe.autoTable !== 'function') await loadScript(AUTOTABLE_LIB, 'gearpcAutoTableLib');
        })()
      ]);
      patchConstructor();
    })().finally(() => { preparing = null; });
    return preparing;
  }

  function relabelHistory() {
    const input = document.querySelector('[data-report-block="historico"]');
    const span = input?.closest('label')?.querySelector('span');
    if (span) span.textContent = 'Acessos e histórico de ações no app';
  }

  async function boot() {
    for (let i=0;i<80;i++) {
      if (state.profile) break;
      await new Promise((r)=>setTimeout(r,250));
    }
    if (state.profile?.tipo !== 'administrador') return;
    for (let i=0;i<40;i++) {
      if ($('reportsButton') && $('reportGenerate')) break;
      await new Promise((r)=>setTimeout(r,150));
    }
    relabelHistory();
    $('reportsButton')?.addEventListener('click', () => { void prepare().catch((e)=>console.warn('GEArPC relatórios:',e)); });

    document.addEventListener('click', async (event) => {
      const button = event.target instanceof Element ? event.target.closest('#reportGenerate') : null;
      if (!button || bypassGenerate) return;
      if (patched && accessRows.length) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const oldText = button.textContent;
      button.disabled = true;
      button.textContent = 'Preparando PDF...';
      try {
        await prepare();
        bypassGenerate = true;
        button.disabled = false;
        button.textContent = oldText;
        button.click();
      } catch (error) {
        button.disabled = false;
        button.textContent = oldText;
        const msg = $('reportMessage');
        if (msg) msg.textContent = `Não foi possível preparar o relatório: ${error.message || error}`;
      } finally {
        window.setTimeout(() => { bypassGenerate = false; }, 0);
      }
    }, true);
  }

  void boot();
})();