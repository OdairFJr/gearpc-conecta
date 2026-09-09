(() => {
  if (window.__GEARPC_ADMIN_REPORTS_V29__) return;
  window.__GEARPC_ADMIN_REPORTS_V29__ = true;

  const rt = window.GEARPC_RUNTIME;
  if (!rt?.client || !rt?.state) return;
  const { client, state } = rt;
  const $ = (id) => document.getElementById(id);
  const PAGE_SIZE = 1000;

  const BLOCKS = [
    ['jovens', 'Jovens e responsáveis'],
    ['adultos', 'Adultos, funções e seções'],
    ['presencas', 'Presenças'],
    ['programacoes', 'Programações e conferências'],
    ['atividades', 'Atividades, confirmações e autorizações'],
    ['visitas', 'Visitas e caminho para o próximo ramo'],
    ['biblioteca', 'Banco de atividades e ideias'],
    ['avisos', 'Avisos e notificações'],
    ['historico', 'Histórico de ações no app']
  ];

  const PDF_LIB = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  const AUTOTABLE_LIB = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js';

  function esc(value) {
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function fmtDate(value) {
    if (!value) return '-';
    const raw = String(value).slice(0, 10);
    const [y,m,d] = raw.split('-');
    return y && m && d ? `${d}/${m}/${y}` : raw;
  }

  function fmtDateTime(value) {
    if (!value) return '-';
    try {
      return new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(value));
    } catch (_) { return String(value); }
  }

  function boolLabel(value) { return value ? 'Sim' : 'Não'; }
  function statusLabel(value) {
    return ({ presente:'Presente', ausente:'Ausente', pendente:'Pendente', autorizada:'Autorizada', nao_autorizada:'Não autorizada', cancelada_sem_programacao:'Cancelada - sem programação' })[value] || String(value || '-').replaceAll('_',' ');
  }

  function todayYmd() {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type)?.value || '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  function setPreset(kind) {
    const today = todayYmd();
    const [year, month] = today.split('-').map(Number);
    let start = today, end = today;
    if (kind === 'month') {
      start = `${year}-${String(month).padStart(2,'0')}-01`;
      end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0,10);
    } else if (kind === 'semester') {
      const firstMonth = month <= 6 ? 1 : 7;
      const lastMonth = month <= 6 ? 6 : 12;
      start = `${year}-${String(firstMonth).padStart(2,'0')}-01`;
      end = new Date(Date.UTC(year, lastMonth, 0)).toISOString().slice(0,10);
    } else if (kind === 'year') {
      start = `${year}-01-01`;
      end = `${year}-12-31`;
    }
    $('reportStart').value = start;
    $('reportEnd').value = end;
  }

  function installStyles() {
    if ($('gearpcReportsV29Styles')) return;
    const style = document.createElement('style');
    style.id = 'gearpcReportsV29Styles';
    style.textContent = `
      .reports-view{min-height:100vh}.reports-hero{margin-bottom:14px}.reports-card{background:#fff;border:1px solid #d9e3ec;border-radius:18px;padding:16px;box-shadow:0 5px 18px #0a376c12;margin-bottom:14px}.reports-card h3{margin:0 0 5px;color:#0a376c}.reports-card p{margin:0;color:#63778a;line-height:1.45}.report-period-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.report-period-grid label,.report-blocks label{display:grid;gap:5px;font-size:.78rem;font-weight:800;color:#435a70}.report-period-grid input{width:100%;box-sizing:border-box;border:1px solid #c7d3de;border-radius:10px;padding:10px;background:#fff}.report-presets{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.report-presets button,.report-small-action{border:1px solid #bccbd7;background:#f8fbfd;color:#0a376c;border-radius:10px;padding:8px 11px;font-weight:800;cursor:pointer}.report-blocks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}.report-block-option{display:flex!important;grid-template-columns:none!important;align-items:flex-start;gap:8px!important;background:#f7f9fb;border:1px solid #e0e7ed;border-radius:11px;padding:10px;font-weight:700!important}.report-block-option input{margin-top:2px}.report-block-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.report-medical{margin-top:13px;border:1px solid #e1c26c;background:#fff8dc;border-radius:12px;padding:11px}.report-medical label{display:flex;gap:8px;align-items:flex-start;color:#6c550d;font-weight:800;font-size:.8rem}.report-medical small{display:block;color:#75662f;margin-top:5px;line-height:1.4}.report-generate{width:100%;border:0;border-radius:12px;padding:13px;background:#0a376c;color:#fff;font-weight:900;font-size:.95rem;cursor:pointer;margin-top:14px}.report-generate:disabled{opacity:.6;cursor:wait}.report-message{margin:10px 0 0;min-height:18px;color:#53687c;font-size:.8rem}.report-note{font-size:.76rem;color:#687d90;margin-top:8px!important}.report-summary-preview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.report-summary-preview div{background:#f4f7fa;border-radius:10px;padding:9px;text-align:center}.report-summary-preview strong{display:block;color:#0a376c;font-size:1rem}.report-summary-preview span{font-size:.68rem;color:#718494}.hidden{display:none!important}@media(max-width:650px){.report-period-grid,.report-blocks{grid-template-columns:1fr}.report-summary-preview{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);
  }

  function ensureButton() {
    const modules = document.querySelector('#dashboardView .launch-modules');
    if (!modules || $('reportsButton')) return;
    const button = document.createElement('button');
    button.id = 'reportsButton';
    button.className = 'launch-module';
    button.type = 'button';
    button.innerHTML = `<span class="launch-module-icon" aria-hidden="true">PDF</span><span class="launch-module-copy"><strong>Relatórios</strong><small>Gere relatórios administrativos em PDF por período.</small></span><span class="launch-module-arrow" aria-hidden="true">›</span>`;
    modules.appendChild(button);
  }

  function ensureView() {
    let view = $('reportsView');
    if (view) return view;
    const main = document.querySelector('main.app-shell');
    if (!main) return null;
    view = document.createElement('section');
    view.id = 'reportsView';
    view.className = 'members-view reports-view hidden';
    view.innerHTML = `
      <header class="subpage-header">
        <button id="reportsBackButton" class="back-button" type="button" aria-label="Voltar">←</button>
        <div class="subpage-brand"><img src="logo-grupo.jpeg" alt="" /><div><span>GEArPC Conecta</span><strong>Relatórios</strong></div></div>
        <button id="reportsLogoutButton" class="secondary-button">Sair</button>
      </header>
      <section class="members-hero reports-hero"><div><div class="eyebrow dark">ADMINISTRAÇÃO</div><h2>Central de Relatórios</h2><p>Selecione o período e os módulos que devem compor o PDF.</p></div></section>
      <section class="reports-card">
        <h3>Período do relatório</h3><p>Use um período rápido ou informe as datas manualmente.</p>
        <div class="report-period-grid"><label>Data inicial<input id="reportStart" type="date" /></label><label>Data final<input id="reportEnd" type="date" /></label></div>
        <div class="report-presets"><button type="button" data-report-preset="month">Mês atual</button><button type="button" data-report-preset="semester">Semestre atual</button><button type="button" data-report-preset="year">Ano atual</button></div>
      </section>
      <section class="reports-card">
        <h3>Conteúdo</h3><p>Cadastros de jovens e adultos representam a situação atual. Os demais módulos usam o período selecionado.</p>
        <div class="report-blocks">${BLOCKS.map(([key,label]) => `<label class="report-block-option"><input type="checkbox" data-report-block="${key}" checked /><span>${esc(label)}</span></label>`).join('')}</div>
        <div class="report-block-actions"><button id="reportSelectAll" class="report-small-action" type="button">Selecionar todos</button><button id="reportClearAll" class="report-small-action" type="button">Limpar seleção</button></div>
        <div class="report-medical"><label><input id="reportMedical" type="checkbox" /><span>Incluir fichas médicas de jovens e adultos</span></label><small>Esta opção inclui dados de saúde e contatos de emergência. Use o PDF apenas para finalidade administrativa autorizada.</small></div>
        <button id="reportGenerate" class="report-generate" type="button">Gerar e baixar PDF</button>
        <p id="reportMessage" class="report-message" role="status"></p>
        <p class="report-note">O PDF recebe identificação do período, data de geração e numeração de páginas.</p>
      </section>`;
    main.appendChild(view);
    setPreset('month');
    return view;
  }

  function showReports() {
    const view = ensureView();
    if (!view) return;
    ['loginView','dashboardView','membersView','chiefsView','attendanceView','accessView','programmingView','programEditorView'].forEach((id) => $(id)?.classList.add('hidden'));
    view.classList.remove('hidden');
  }

  function selectedBlocks() {
    return [...document.querySelectorAll('[data-report-block]:checked')].map((el) => el.dataset.reportBlock);
  }

  function setMessage(text, ok=false) {
    const el = $('reportMessage');
    if (!el) return;
    el.textContent = text || '';
    el.style.color = ok ? '#176b38' : '#53687c';
  }

  function loadScript(src, id) {
    return new Promise((resolve, reject) => {
      if ($(id)) return resolve();
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
      document.head.appendChild(script);
    });
  }

  async function ensurePdfLibraries() {
    if (!window.jspdf?.jsPDF) await loadScript(PDF_LIB, 'gearpcJsPdfLib');
    if (!window.jspdf?.jsPDF) throw new Error('Biblioteca PDF indisponível.');
    const test = new window.jspdf.jsPDF();
    if (typeof test.autoTable !== 'function') await loadScript(AUTOTABLE_LIB, 'gearpcAutoTableLib');
  }

  async function fetchAll(table, fields='*', apply=null) {
    let rows = [];
    for (let from=0; ; from += PAGE_SIZE) {
      let q = client.from(table).select(fields);
      if (apply) q = apply(q);
      const { data, error } = await q.range(from, from + PAGE_SIZE - 1);
      if (error) throw new Error(`${table}: ${error.message}`);
      rows.push(...(data || []));
      if (!data || data.length < PAGE_SIZE) break;
    }
    return rows;
  }

  async function fetchByIds(table, fields, column, ids) {
    const clean = [...new Set((ids || []).filter((v) => v !== null && v !== undefined))];
    if (!clean.length) return [];
    let rows = [];
    for (let i=0; i<clean.length; i+=100) {
      const chunk = clean.slice(i, i+100);
      rows.push(...await fetchAll(table, fields, (q) => q.in(column, chunk)));
    }
    return rows;
  }

  function periodTs(start, end) {
    return { startTs:`${start}T00:00:00-03:00`, endTs:`${end}T23:59:59-03:00` };
  }

  async function loadData(start, end, blocks, includeMedical) {
    const { startTs, endTs } = periodTs(start, end);
    const common = await Promise.all([
      fetchAll('ramos','id,nome,ordem,ativo'),
      fetchAll('secoes','id,nome,ramo_id,ativo'),
      fetchAll('perfis_usuarios','user_id,nome_completo,tipo,ativo,chefe_id,acesso_geral_consulta')
    ]);
    const data = { ramos:common[0], secoes:common[1], perfis:common[2] };

    if (blocks.includes('jovens')) {
      [data.jovens,data.responsaveis,data.vinculos,data.equipes] = await Promise.all([
        fetchAll('jovens','id,nome_completo,ramo_id,secao_id,registro_paxtu,data_nascimento,data_acolhida,validade_registro,ativo,equipe_nome,equipe_id,data_promessa_lobinho,data_promessa_escoteira,data_promessa_adulta,data_pode_iniciar_caminho,data_inicio_caminho,data_passagem_ramo,data_limite_passagem_ramo'),
        fetchAll('responsaveis','id,nome_completo,telefone,email,registro_paxtu,criado_em'),
        fetchAll('jovem_responsaveis','jovem_id,responsavel_id,parentesco,responsavel_principal'),
        fetchAll('equipes','id,secao_id,nome,tipo,ativo')
      ]);
    }

    if (blocks.includes('adultos') || blocks.includes('programacoes') || includeMedical) {
      [data.chefes,data.chefeFuncoes,data.chefeSecoes] = await Promise.all([
        fetchAll('chefes','id,nome_completo,registro_paxtu,data_nascimento,validade_registro,telefone,ativo,criado_em,atualizado_em,data_promessa_lobinho,data_promessa_escoteira,data_promessa_adulta'),
        fetchAll('chefe_funcoes','id,chefe_id,funcao'),
        fetchAll('chefe_secoes','chefe_id,secao_id')
      ]);
    }

    if (blocks.includes('presencas')) {
      data.chamadas = await fetchAll('chamadas','id,secao_id,data_reuniao,titulo,criado_por,criado_em,atualizado_em',(q)=>q.gte('data_reuniao',start).lte('data_reuniao',end).order('data_reuniao'));
      data.presencas = await fetchByIds('presencas_chamada','id,chamada_id,jovem_id,status,observacao,registrado_por,atualizado_em','chamada_id',data.chamadas.map((r)=>r.id));
      if (!data.jovens) data.jovens = await fetchAll('jovens','id,nome_completo,secao_id,ativo');
    }

    if (blocks.includes('programacoes')) {
      data.programacoes = await fetchAll('programacoes','id,secao_id,data_atividade,horario_inicio,horario_termino,observacoes_finais,criado_por,criado_em,atualizado_em',(q)=>q.gte('data_atividade',start).lte('data_atividade',end).order('data_atividade'));
      data.programacaoItens = await fetchByIds('programacao_itens','id,programacao_id,ordem,tipo,hora_inicio,duracao_min,nome,condutor_chefe_id,objetivo,areas_desenvolvimento,eixo,bloco,itens_progressao,materiais,origem,criado_em,atualizado_em','programacao_id',data.programacoes.map((r)=>r.id));
      data.programacaoRevisoes = await fetchAll('programacao_revisoes','id,secao_id,data_atividade,status,observacao,revisado_por,revisado_em,atualizado_em',(q)=>q.gte('data_atividade',start).lte('data_atividade',end));
    }

    if (blocks.includes('atividades')) {
      data.atividades = await fetchAll('atividades','id,titulo,descricao,data_inicio,data_fim,local,atividade_geral,exige_autorizacao,texto_autorizacao,autorizacao_versao,criado_em',(q)=>q.gte('data_inicio',startTs).lte('data_inicio',endTs).order('data_inicio'));
      const ids = data.atividades.map((r)=>r.id);
      [data.atividadeRamos,data.confirmacoes,data.autorizacoes] = await Promise.all([
        fetchByIds('atividade_ramos','atividade_id,ramo_id','atividade_id',ids),
        fetchByIds('confirmacoes_presenca','id,atividade_id,jovem_id,responsavel_id,resposta,observacao,respondido_em','atividade_id',ids),
        fetchByIds('autorizacoes_atividade','id,atividade_id,jovem_id,responsavel_id,status,versao_atividade,titulo_snapshot,data_inicio_snapshot,data_fim_snapshot,local_snapshot,assinado_em,atualizado_em','atividade_id',ids)
      ]);
      if (!data.jovens) data.jovens = await fetchAll('jovens','id,nome_completo,secao_id,ativo');
      if (!data.responsaveis) data.responsaveis = await fetchAll('responsaveis','id,nome_completo,telefone,email,registro_paxtu');
    }

    if (blocks.includes('visitas')) {
      [data.visitas,data.visitasProximoRamo,data.visitantes] = await Promise.all([
        fetchAll('visitas','id,visitante_id,data_visita,observacoes,criado_em',(q)=>q.gte('data_visita',start).lte('data_visita',end).order('data_visita')),
        fetchAll('visitas_proximo_ramo','id,jovem_id,secao_destino_id,data_visita,observacao,criado_em',(q)=>q.gte('data_visita',start).lte('data_visita',end).order('data_visita')),
        fetchAll('visitantes','id,nome_completo,data_nascimento,ramo_id,nome_responsavel,telefone_responsavel,observacoes,situacao,criado_em')
      ]);
      if (!data.jovens) data.jovens = await fetchAll('jovens','id,nome_completo,secao_id,ativo');
    }

    if (blocks.includes('biblioteca')) {
      [data.biblioteca,data.ideias] = await Promise.all([
        fetchAll('biblioteca_atividades','id,nome,ramo,objetivo,eixo,bloco,duracao_min,participantes,local_sugerido,visibilidade,origem,criado_por_chefe_id,ativo,criado_em,atualizado_em',(q)=>q.gte('criado_em',startTs).lte('criado_em',endTs).order('criado_em')),
        fetchAll('ideias_progressao','id,ramo,eixo,bloco,codigo,intencionalidade,sugestao,categoria,formato,ambiente_sugerido,duracao_sugerida,participantes,complexidade,natureza_sugestao,fonte_oficial,ativo,criado_em',(q)=>q.gte('criado_em',startTs).lte('criado_em',endTs).order('criado_em'))
      ]);
    }

    if (blocks.includes('avisos')) {
      [data.avisos,data.notificacoes] = await Promise.all([
        fetchAll('avisos','id,titulo,mensagem,aviso_geral,destaque,publicado_em,expira_em,ativo,criado_em',(q)=>q.gte('publicado_em',startTs).lte('publicado_em',endTs).order('publicado_em')),
        fetchAll('notificacoes','id,user_id,tipo,titulo,mensagem,atividade_id,jovem_id,secao_id,data_referencia,lida,criado_em',(q)=>q.gte('criado_em',startTs).lte('criado_em',endTs).order('criado_em'))
      ]);
    }

    if (blocks.includes('historico')) {
      data.historico = await fetchAll('historico_atividades_app','id,user_id,categoria,acao,descricao,secao_id,jovem_id,programacao_id,entidade,entidade_id,criado_em',(q)=>q.gte('criado_em',startTs).lte('criado_em',endTs).order('criado_em',{ascending:false}));
    }

    if (includeMedical) {
      if (!data.jovens) data.jovens = await fetchAll('jovens','id,nome_completo,secao_id,ativo');
      [data.medicasJovens,data.medicasChefes] = await Promise.all([
        fetchAll('fichas_medicas','id,jovem_id,tipo_sanguineo,alergias,medicamentos_uso_continuo,restricoes_alimentares,condicoes_relevantes,necessidades_especiais,plano_saude,numero_carteirinha,contato_emergencia_nome,contato_emergencia_telefone,observacoes,responsavel_confirmou,confirmado_em,criado_em,atualizado_em'),
        fetchAll('fichas_medicas_chefes','id,chefe_id,tipo_sanguineo,alergias,medicamentos_uso_continuo,restricoes_alimentares,condicoes_relevantes,necessidades_especiais,plano_saude,numero_carteirinha,contato_emergencia_nome,contato_emergencia_telefone,observacoes,criado_em,atualizado_em')
      ]);
    }

    return data;
  }

  async function imageDataUrl(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) return null;
      const blob = await response.blob();
      return await new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => resolve(null); reader.readAsDataURL(blob); });
    } catch (_) { return null; }
  }

  function mapBy(rows, key='id') { return new Map((rows || []).map((r)=>[String(r[key]),r])); }
  function groupBy(rows, key) { const m = new Map(); (rows||[]).forEach((r)=>{ const k=String(r[key]); if(!m.has(k))m.set(k,[]); m.get(k).push(r); }); return m; }
  function arrText(value) { return Array.isArray(value) ? value.join(', ') : (value || '-'); }

  async function buildPdf(start, end, blocks, includeMedical, data) {
    await ensurePdfLibraries();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:'mm', format:'a4', orientation:'portrait' });
    const logo = await imageDataUrl('logo-grupo.jpeg');
    const ramos = mapBy(data.ramos), secoes = mapBy(data.secoes), perfis = mapBy(data.perfis,'user_id');
    const jovens = mapBy(data.jovens), responsaveis = mapBy(data.responsaveis), chefes = mapBy(data.chefes), visitantes = mapBy(data.visitantes);
    const funcoes = groupBy(data.chefeFuncoes,'chefe_id'), chefeSecoes = groupBy(data.chefeSecoes,'chefe_id'), vinculos = groupBy(data.vinculos,'jovem_id');
    let y = 18;

    const footer = () => {
      const pages = doc.getNumberOfPages();
      for (let i=1;i<=pages;i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(110);
        doc.text(`GEArPC Conecta - uso administrativo - página ${i} de ${pages}`, 105, 291, { align:'center' });
      }
    };
    const pageIfNeeded = (need=18) => { if (y + need > 278) { doc.addPage(); y = 18; } };
    const sectionTitle = (title, subtitle='') => { pageIfNeeded(18); doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(10,55,108); doc.text(title,14,y); y += 6; if(subtitle){doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(90);doc.text(doc.splitTextToSize(subtitle,180),14,y);y+=7;} };
    const table = (head, body, opts={}) => {
      pageIfNeeded(20);
      doc.autoTable({ startY:y, head:[head], body:body.length?body:[head.map((_,i)=>i===0?'Sem registros neste período':'')], theme:'grid', styles:{fontSize:7.2,cellPadding:1.6,valign:'top',overflow:'linebreak'}, headStyles:{fillColor:[10,55,108],textColor:255,fontStyle:'bold'}, alternateRowStyles:{fillColor:[247,249,251]}, margin:{left:14,right:14,bottom:16}, ...opts });
      y = doc.lastAutoTable.finalY + 7;
    };

    if (logo) { try { doc.addImage(logo,'JPEG',14,10,18,18); } catch (_) {} }
    doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(10,55,108); doc.text('Relatório Administrativo',38,17);
    doc.setFontSize(11); doc.setTextColor(45); doc.text('GEArPC Conecta - Grupo Escoteiro do Ar Paulo Carzino',38,23);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(80); doc.text(`Período: ${fmtDate(start)} a ${fmtDate(end)}`,14,34); doc.text(`Gerado em: ${fmtDateTime(new Date().toISOString())}`,14,39);
    y = 48;

    const activeYouth = (data.jovens||[]).filter((r)=>r.ativo).length;
    const activeChiefs = (data.chefes||[]).filter((r)=>r.ativo).length;
    table(['Indicador','Quantidade'],[
      ['Jovens ativos', String(activeYouth)], ['Adultos ativos', String(activeChiefs)], ['Reuniões/chamadas no período', String((data.chamadas||[]).length)], ['Programações no período', String((data.programacoes||[]).length)], ['Atividades no período', String((data.atividades||[]).length)], ['Visitas no período', String((data.visitas||[]).length + (data.visitasProximoRamo||[]).length)]
    ],{tableWidth:110});

    if (blocks.includes('jovens')) {
      sectionTitle('Jovens e responsáveis','Situação cadastral atual; as datas de acolhida, promessa e passagem permanecem visíveis para controle histórico.');
      table(['Jovem','Seção','Registro','Nascimento','Acolhida','Equipe','Responsável principal','Situação'],(data.jovens||[]).map((j)=>{
        const sec = secoes.get(String(j.secao_id)); const links = vinculos.get(String(j.id))||[]; const principal = links.find((v)=>v.responsavel_principal)||links[0]; const resp = principal ? responsaveis.get(String(principal.responsavel_id)) : null;
        return [j.nome_completo,sec?.nome||'-',j.registro_paxtu||'-',fmtDate(j.data_nascimento),fmtDate(j.data_acolhida),j.equipe_nome||'-',resp?.nome_completo||'-',j.ativo?'Ativo':'Inativo'];
      }),{columnStyles:{0:{cellWidth:34},1:{cellWidth:25},6:{cellWidth:34}}});
      const caminho = (data.jovens||[]).filter((j)=>j.data_pode_iniciar_caminho||j.data_inicio_caminho||j.data_passagem_ramo||j.data_limite_passagem_ramo);
      table(['Jovem','Pode iniciar caminho','Início do caminho','Passagem de ramo','Limite da passagem'],caminho.map((j)=>[j.nome_completo,fmtDate(j.data_pode_iniciar_caminho),fmtDate(j.data_inicio_caminho),fmtDate(j.data_passagem_ramo),fmtDate(j.data_limite_passagem_ramo)]));
    }

    if (blocks.includes('adultos')) {
      sectionTitle('Adultos, funções e seções','Situação cadastral atual da equipe adulta.');
      table(['Adulto','Funções','Seções','Registro','Validade','Telefone','Situação'],(data.chefes||[]).map((c)=>[
        c.nome_completo,(funcoes.get(String(c.id))||[]).map((f)=>f.funcao).join(', ')||'-',(chefeSecoes.get(String(c.id))||[]).map((v)=>secoes.get(String(v.secao_id))?.nome).filter(Boolean).join(', ')||'-',c.registro_paxtu||'-',fmtDate(c.validade_registro),c.telefone||'-',c.ativo?'Ativo':'Inativo'
      ]),{columnStyles:{0:{cellWidth:34},1:{cellWidth:38},2:{cellWidth:31}}});
    }

    if (blocks.includes('presencas')) {
      sectionTitle('Presenças',`Chamadas realizadas entre ${fmtDate(start)} e ${fmtDate(end)}.`);
      const pByCall = groupBy(data.presencas,'chamada_id');
      table(['Data','Seção','Título','Presentes','Ausentes','Pendentes'],(data.chamadas||[]).map((c)=>{const rows=pByCall.get(String(c.id))||[];return [fmtDate(c.data_reuniao),secoes.get(String(c.secao_id))?.nome||'-',c.titulo||'-',String(rows.filter((r)=>r.status==='presente').length),String(rows.filter((r)=>r.status==='ausente').length),String(rows.filter((r)=>!r.status||r.status==='pendente').length)];}));
      table(['Data','Seção','Jovem','Status','Observação'],(data.presencas||[]).map((p)=>{const call=(data.chamadas||[]).find((c)=>String(c.id)===String(p.chamada_id));return [fmtDate(call?.data_reuniao),secoes.get(String(call?.secao_id))?.nome||'-',jovens.get(String(p.jovem_id))?.nome_completo||'-',statusLabel(p.status),p.observacao||'-'];}),{columnStyles:{2:{cellWidth:42},4:{cellWidth:45}}});
    }

    if (blocks.includes('programacoes')) {
      sectionTitle('Programações e conferências',`Programações das seções no período selecionado.`);
      const revKey = new Map((data.programacaoRevisoes||[]).map((r)=>[`${r.secao_id}:${r.data_atividade}`,r])); const itemsByProgram=groupBy(data.programacaoItens,'programacao_id');
      table(['Data','Seção','Horário','Itens','Situação','Observação da revisão'],(data.programacoes||[]).map((p)=>{const rev=revKey.get(`${p.secao_id}:${p.data_atividade}`);return [fmtDate(p.data_atividade),secoes.get(String(p.secao_id))?.nome||'-',`${String(p.horario_inicio||'').slice(0,5)} - ${String(p.horario_termino||'').slice(0,5)}`,String((itemsByProgram.get(String(p.id))||[]).length),rev?statusLabel(rev.status):'Aguardando conferência',rev?.observacao||'-'];}),{columnStyles:{5:{cellWidth:50}}});
      table(['Data','Seção','Hora','Atividade','Objetivo','Condutor','Eixo / bloco'],(data.programacaoItens||[]).sort((a,b)=>(a.programacao_id-b.programacao_id)||(a.ordem-b.ordem)).map((i)=>{const p=(data.programacoes||[]).find((x)=>String(x.id)===String(i.programacao_id));return [fmtDate(p?.data_atividade),secoes.get(String(p?.secao_id))?.nome||'-',String(i.hora_inicio||'').slice(0,5),i.nome||'-',i.objetivo||'-',chefes.get(String(i.condutor_chefe_id))?.nome_completo||'-',[i.eixo,i.bloco].filter(Boolean).join(' / ')||'-'];}),{columnStyles:{3:{cellWidth:37},4:{cellWidth:45}}});
      const cancellations=(data.programacaoRevisoes||[]).filter((r)=>r.status==='cancelada_sem_programacao'); if(cancellations.length) table(['Data','Seção','Cancelamento / observação'],cancellations.map((r)=>[fmtDate(r.data_atividade),secoes.get(String(r.secao_id))?.nome||'-',r.observacao||'-']));
    }

    if (blocks.includes('atividades')) {
      sectionTitle('Atividades, confirmações e autorizações','Atividades gerais/especiais registradas com início dentro do período selecionado.');
      const confByAct=groupBy(data.confirmacoes,'atividade_id'), authByAct=groupBy(data.autorizacoes,'atividade_id'), arByAct=groupBy(data.atividadeRamos,'atividade_id');
      table(['Atividade','Início','Fim','Local','Ramos','Confirmações','Autorizações'],(data.atividades||[]).map((a)=>[a.titulo,fmtDateTime(a.data_inicio),fmtDateTime(a.data_fim),a.local||'-',a.atividade_geral?'Todos':(arByAct.get(String(a.id))||[]).map((r)=>ramos.get(String(r.ramo_id))?.nome).filter(Boolean).join(', ')||'-',String((confByAct.get(String(a.id))||[]).length),a.exige_autorizacao?String((authByAct.get(String(a.id))||[]).length):'Não exige']),{columnStyles:{0:{cellWidth:38},4:{cellWidth:30}}});
      table(['Atividade','Jovem','Confirmação','Respondido em'],(data.confirmacoes||[]).map((c)=>[(data.atividades||[]).find((a)=>String(a.id)===String(c.atividade_id))?.titulo||'-',jovens.get(String(c.jovem_id))?.nome_completo||'-',c.resposta||'-',fmtDateTime(c.respondido_em)]));
      table(['Atividade','Jovem','Responsável','Status','Assinado em'],(data.autorizacoes||[]).map((a)=>[(data.atividades||[]).find((x)=>String(x.id)===String(a.atividade_id))?.titulo||a.titulo_snapshot||'-',jovens.get(String(a.jovem_id))?.nome_completo||'-',responsaveis.get(String(a.responsavel_id))?.nome_completo||'-',statusLabel(a.status),fmtDateTime(a.assinado_em)]));
    }

    if (blocks.includes('visitas')) {
      sectionTitle('Visitas e caminho para o próximo ramo');
      table(['Data','Visitante','Ramo','Responsável','Telefone','Situação','Observação'],(data.visitas||[]).map((v)=>{const vis=visitantes.get(String(v.visitante_id));return [fmtDate(v.data_visita),vis?.nome_completo||'-',ramos.get(String(vis?.ramo_id))?.nome||'-',vis?.nome_responsavel||'-',vis?.telefone_responsavel||'-',vis?.situacao||'-',v.observacoes||'-'];}),{columnStyles:{1:{cellWidth:36},6:{cellWidth:40}}});
      table(['Data','Jovem','Seção de destino','Observação'],(data.visitasProximoRamo||[]).map((v)=>[fmtDate(v.data_visita),jovens.get(String(v.jovem_id))?.nome_completo||'-',secoes.get(String(v.secao_destino_id))?.nome||'-',v.observacao||'-']),{columnStyles:{1:{cellWidth:45},3:{cellWidth:65}}});
    }

    if (blocks.includes('biblioteca')) {
      sectionTitle('Banco de atividades e ideias',`Registros criados entre ${fmtDate(start)} e ${fmtDate(end)}.`);
      table(['Criado em','Nome','Ramo','Eixo','Bloco','Duração','Origem','Situação'],(data.biblioteca||[]).map((b)=>[fmtDateTime(b.criado_em),b.nome,b.ramo||'-',b.eixo||'-',b.bloco||'-',b.duracao_min?`${b.duracao_min} min`:'-',b.origem||'-',b.ativo?'Ativa':'Inativa']),{columnStyles:{1:{cellWidth:40}}});
      table(['Criado em','Ramo','Código','Eixo','Bloco','Sugestão','Fonte'],(data.ideias||[]).map((i)=>[fmtDateTime(i.criado_em),i.ramo||'-',i.codigo||'-',i.eixo||'-',i.bloco||'-',i.sugestao||'-',i.fonte_oficial||'-']),{columnStyles:{5:{cellWidth:55},6:{cellWidth:35}}});
    }

    if (blocks.includes('avisos')) {
      sectionTitle('Avisos e notificações');
      table(['Publicado em','Título','Mensagem','Geral','Destaque','Situação'],(data.avisos||[]).map((a)=>[fmtDateTime(a.publicado_em),a.titulo,a.mensagem,a.aviso_geral?'Sim':'Não',a.destaque?'Sim':'Não',a.ativo?'Ativo':'Inativo']),{columnStyles:{2:{cellWidth:75}}});
      table(['Criado em','Usuário','Tipo','Título','Mensagem','Lida'],(data.notificacoes||[]).map((n)=>[fmtDateTime(n.criado_em),perfis.get(String(n.user_id))?.nome_completo||'-',n.tipo||'-',n.titulo||'-',n.mensagem||'-',n.lida?'Sim':'Não']),{columnStyles:{4:{cellWidth:65}}});
    }

    if (blocks.includes('historico')) {
      sectionTitle('Histórico de ações no app');
      table(['Data/hora','Usuário','Categoria','Ação','Descrição'],(data.historico||[]).map((h)=>[fmtDateTime(h.criado_em),perfis.get(String(h.user_id))?.nome_completo||'-',h.categoria||'-',h.acao||'-',h.descricao||'-']),{columnStyles:{1:{cellWidth:36},4:{cellWidth:78}}});
    }

    if (includeMedical) {
      sectionTitle('Fichas médicas - dados sensíveis','Situação atual das fichas médicas. Este conteúdo deve permanecer restrito à administração autorizada.');
      table(['Jovem','Tipo sanguíneo','Alergias','Medicamentos','Restrições','Condições / necessidades','Plano','Contato de emergência','Atualizado em'],(data.medicasJovens||[]).map((m)=>[jovens.get(String(m.jovem_id))?.nome_completo||'-',m.tipo_sanguineo||'-',m.alergias||'-',m.medicamentos_uso_continuo||'-',m.restricoes_alimentares||'-',[m.condicoes_relevantes,m.necessidades_especiais].filter(Boolean).join(' / ')||'-',[m.plano_saude,m.numero_carteirinha].filter(Boolean).join(' - ')||'-',[m.contato_emergencia_nome,m.contato_emergencia_telefone].filter(Boolean).join(' - ')||'-',fmtDateTime(m.atualizado_em)]),{styles:{fontSize:6.3,cellPadding:1.2},columnStyles:{0:{cellWidth:28},5:{cellWidth:35},7:{cellWidth:32}}});
      table(['Adulto','Tipo sanguíneo','Alergias','Medicamentos','Restrições','Condições / necessidades','Plano','Contato de emergência','Atualizado em'],(data.medicasChefes||[]).map((m)=>[chefes.get(String(m.chefe_id))?.nome_completo||'-',m.tipo_sanguineo||'-',m.alergias||'-',m.medicamentos_uso_continuo||'-',m.restricoes_alimentares||'-',[m.condicoes_relevantes,m.necessidades_especiais].filter(Boolean).join(' / ')||'-',[m.plano_saude,m.numero_carteirinha].filter(Boolean).join(' - ')||'-',[m.contato_emergencia_nome,m.contato_emergencia_telefone].filter(Boolean).join(' - ')||'-',fmtDateTime(m.atualizado_em)]),{styles:{fontSize:6.3,cellPadding:1.2},columnStyles:{0:{cellWidth:28},5:{cellWidth:35},7:{cellWidth:32}}});
    }

    footer();
    doc.save(`GEArPC_Relatorio_${start}_a_${end}.pdf`);
  }

  async function generateReport() {
    if (state.profile?.tipo !== 'administrador') return;
    const start = $('reportStart')?.value, end = $('reportEnd')?.value;
    const blocks = selectedBlocks(); const includeMedical = Boolean($('reportMedical')?.checked);
    if (!start || !end) return setMessage('Informe a data inicial e a data final.');
    if (start > end) return setMessage('A data inicial não pode ser posterior à data final.');
    if (!blocks.length && !includeMedical) return setMessage('Selecione pelo menos um conteúdo para o relatório.');
    const button = $('reportGenerate');
    button.disabled = true; button.textContent = 'Gerando relatório...'; setMessage('Consultando os dados do GEArPC Conecta...');
    try {
      const data = await loadData(start,end,blocks,includeMedical);
      setMessage('Montando o PDF...');
      await buildPdf(start,end,blocks,includeMedical,data);
      setMessage('Relatório gerado com sucesso.', true);
    } catch (error) {
      console.error('GEArPC relatório:', error);
      setMessage(`Não foi possível gerar o relatório: ${error.message || error}`);
    } finally {
      button.disabled = false; button.textContent = 'Gerar e baixar PDF';
    }
  }

  function bind() {
    $('reportsButton')?.addEventListener('click', showReports);
    $('reportsBackButton')?.addEventListener('click', () => { $('reportsView')?.classList.add('hidden'); rt.showDashboard?.(); });
    $('reportsLogoutButton')?.addEventListener('click', () => $('logoutButton')?.click());
    document.querySelectorAll('[data-report-preset]').forEach((b)=>b.addEventListener('click',()=>setPreset(b.dataset.reportPreset)));
    $('reportSelectAll')?.addEventListener('click',()=>document.querySelectorAll('[data-report-block]').forEach((c)=>c.checked=true));
    $('reportClearAll')?.addEventListener('click',()=>document.querySelectorAll('[data-report-block]').forEach((c)=>c.checked=false));
    $('reportGenerate')?.addEventListener('click', generateReport);
  }

  async function boot() {
    installStyles();
    for (let i=0;i<80;i++) { if (state.profile) break; await new Promise((r)=>setTimeout(r,250)); }
    if (state.profile?.tipo !== 'administrador') return;
    ensureButton(); ensureView(); bind();
  }

  void boot();
})();