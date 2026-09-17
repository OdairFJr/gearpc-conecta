(() => {
  if (window.__GEARPC_SAFETY_TEST_V63__) return;
  window.__GEARPC_SAFETY_TEST_V63__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let store = { visits: [], plans: [] };
  let editingVisitId = null;
  let editingPlanId = null;

  const VISIT_ITEMS = [
    'Acesso ao local',
    'Entrada de veículo de emergência',
    'Área de acampamento / permanência',
    'Condições do terreno',
    'Drenagem / risco de alagamento',
    'Árvores, galhos e estruturas elevadas',
    'Instalações elétricas',
    'Água potável',
    'Banheiros',
    'Chuveiros',
    'Cozinha / preparo de alimentos',
    'Local para fogueira / fogo',
    'Área para jogos e atividades',
    'Rios, lagos, piscinas ou outros corpos d’água',
    'Abrigo para temporal',
    'Iluminação e circulação noturna'
  ];

  const EMERGENCY_ITEMS = [
    ['acidente', 'Acidente / ferimento'],
    ['medica', 'Emergência médica'],
    ['incendio', 'Incêndio'],
    ['temporal', 'Temporal / chuva intensa'],
    ['desaparecido', 'Pessoa desaparecida'],
    ['evacuacao', 'Evacuação do local']
  ];

  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  async function waitRuntime() {
    for (let i = 0; i < 120; i += 1) {
      const current = window.GEARPC_RUNTIME;
      if (current?.client && current?.state?.profile && current?.state?.user) return current;
      await sleep(250);
    }
    return null;
  }

  async function allowedForTest(current) {
    const profile = current?.state?.profile;
    return Boolean(profile && ['administrador', 'chefia', 'dirigente'].includes(profile.tipo));
  }

  function storageKey() {
    return `gearpc-safety-test-v63:${rt?.state?.user?.id || 'local'}`;
  }

  function loadStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey()) || '{}');
      store = {
        visits: Array.isArray(parsed.visits) ? parsed.visits : [],
        plans: Array.isArray(parsed.plans) ? parsed.plans : []
      };
    } catch (_) {
      store = { visits: [], plans: [] };
    }
  }

  function saveStore() {
    localStorage.setItem(storageKey(), JSON.stringify(store));
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function sectionOptions() {
    const fromState = (rt?.state?.secoes || [])
      .map((s) => ({ id: String(s.id ?? s.nome ?? ''), name: String(s.nome || s.nome_secao || '').trim() }))
      .filter((s) => s.name);
    if (fromState.length) return fromState;
    return [
      { id: 'ninhada', name: 'Ninhada' },
      { id: 'rastro-de-fogo', name: 'Rastro de Fogo' },
      { id: 'falcao-peregrino', name: 'Falcão Peregrino' },
      { id: 'loreto', name: 'Loreto' },
      { id: 'cla-caixa-preta', name: 'Clã Caixa Preta' }
    ];
  }

  function adultOptions() {
    const chiefs = (rt?.state?.chefes || [])
      .filter((c) => c.ativo !== false)
      .map((c) => String(c.nome_completo || '').trim())
      .filter(Boolean);
    const me = String(rt?.state?.profile?.nome_completo || '').trim();
    if (me) chiefs.push(me);
    return [...new Set(chiefs)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatDate(value) {
    if (!value) return '—';
    const [y, m, d] = value.split('-');
    return y && m && d ? `${d}/${m}/${y}` : value;
  }

  function setSections(containerId, selected = []) {
    const box = $(containerId);
    if (!box) return;
    const selectedSet = new Set((selected || []).map(String));
    box.innerHTML = sectionOptions().map((s) => `
      <label class="safety-check-option-v63">
        <input type="checkbox" value="${esc(s.name)}" ${selectedSet.has(s.name) ? 'checked' : ''} />
        <span>${esc(s.name)}</span>
      </label>`).join('');
  }

  function selectedSections(containerId) {
    return [...($(containerId)?.querySelectorAll('input[type="checkbox"]:checked') || [])].map((input) => input.value);
  }

  function adultSelectOptions(selected = '') {
    const names = adultOptions();
    const extra = selected && !names.includes(selected) ? [selected] : [];
    return ['<option value="">Selecione</option>', ...extra, ...names]
      .map((name, idx) => idx === 0 ? name : `<option value="${esc(name)}" ${name === selected ? 'selected' : ''}>${esc(name)}</option>`)
      .join('');
  }

  function injectStyles() {
    if ($('safetyStylesV63')) return;
    const style = document.createElement('style');
    style.id = 'safetyStylesV63';
    style.textContent = `
      #safetyViewV63{padding-bottom:40px}
      .safety-test-banner-v63{margin:16px 18px 0;padding:12px 14px;border:1px solid #cfe0ec;background:#f4f9fc;border-radius:14px;color:#31526f;font-size:.88rem;line-height:1.45}
      .safety-test-banner-v63 strong{display:block;color:#17324d;margin-bottom:3px}
      .safety-hero-actions-v63{display:flex;gap:8px;flex-wrap:wrap}
      .safety-tabs-v63{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 18px}
      .safety-tab-v63{border:1px solid #cad8e5;background:#fff;color:#17324d;border-radius:12px;padding:12px;font-weight:700;cursor:pointer}
      .safety-tab-v63.active{background:#0a376c;color:#fff;border-color:#0a376c}
      .safety-panel-v63{margin:0 18px}
      .safety-panel-head-v63{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
      .safety-panel-head-v63 h3{margin:0;color:#17324d}
      .safety-panel-head-v63 p{margin:4px 0 0;color:#64788a;font-size:.9rem}
      .safety-list-v63{display:grid;gap:10px}
      .safety-empty-v63{padding:24px 16px;border:1px dashed #b9c9d8;border-radius:14px;text-align:center;color:#687b8c;background:#fbfdff}
      .safety-card-v63{border:1px solid #d9e4ed;border-radius:15px;background:#fff;padding:14px;box-shadow:0 4px 14px rgba(15,48,77,.05)}
      .safety-card-top-v63{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .safety-card-v63 h4{margin:0;color:#17324d;font-size:1rem}
      .safety-card-v63 .meta{margin-top:7px;display:flex;flex-wrap:wrap;gap:6px;color:#5f7385;font-size:.82rem}
      .safety-pill-v63{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:#edf4fa;color:#31526f;font-size:.76rem;font-weight:700}
      .safety-pill-v63.ok{background:#e8f6ec;color:#24623b}.safety-pill-v63.warn{background:#fff4d5;color:#7b5a00}.safety-pill-v63.bad{background:#fdeaea;color:#8a2f2f}
      .safety-card-actions-v63{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
      .safety-mini-btn-v63{border:1px solid #cbd8e3;background:#fff;color:#24435e;border-radius:10px;padding:8px 10px;font-weight:700;cursor:pointer}
      .safety-mini-btn-v63.danger{border-color:#efc8c8;color:#8d2e2e;background:#fffafa}
      .safety-dialog-v63{width:min(920px,calc(100vw - 22px));max-height:92vh;border:0;border-radius:18px;padding:0;box-shadow:0 20px 60px rgba(5,25,45,.25)}
      .safety-dialog-v63::backdrop{background:rgba(5,23,38,.55)}
      .safety-dialog-shell-v63{padding:18px;background:#fff}
      .safety-dialog-head-v63{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;position:sticky;top:-18px;background:#fff;padding:18px 0 12px;z-index:2;border-bottom:1px solid #e7edf3}
      .safety-dialog-head-v63 h2{margin:2px 0 0;color:#17324d}.safety-dialog-head-v63 p{margin:4px 0 0;color:#65798b;font-size:.88rem}
      .safety-close-v63{border:0;background:#eef3f7;width:38px;height:38px;border-radius:50%;font-size:1.45rem;color:#34516a;cursor:pointer}
      .safety-form-v63{display:grid;gap:14px;padding-top:14px}
      .safety-section-v63{border:1px solid #dce6ee;border-radius:14px;padding:14px;background:#fbfdff}
      .safety-section-v63 h3{margin:0 0 10px;color:#17324d;font-size:1rem}
      .safety-grid-v63{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .safety-grid-v63.three{grid-template-columns:repeat(3,minmax(0,1fr))}
      .safety-form-v63 label{display:grid;gap:6px;font-size:.84rem;font-weight:700;color:#3e576d}
      .safety-form-v63 input,.safety-form-v63 select,.safety-form-v63 textarea{width:100%;box-sizing:border-box;border:1px solid #cbd8e3;border-radius:10px;padding:10px 11px;background:#fff;color:#17324d;font:inherit;font-weight:400}
      .safety-form-v63 textarea{resize:vertical;min-height:78px}
      .safety-check-grid-v63{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .safety-check-option-v63{display:flex!important;grid-template-columns:none!important;align-items:center;gap:8px!important;border:1px solid #dce6ee;border-radius:10px;padding:9px;background:#fff;font-weight:600!important}
      .safety-check-option-v63 input{width:auto!important;margin:0}
      .safety-eval-v63{display:grid;grid-template-columns:minmax(170px,1.2fr) minmax(130px,.55fr) minmax(180px,1fr);gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #e7edf3}
      .safety-eval-v63:last-child{border-bottom:0}.safety-eval-v63 strong{font-size:.84rem;color:#355069}
      .safety-eval-v63 input,.safety-eval-v63 select{padding:8px 9px}
      .safety-risk-v63{border:1px solid #dde6ee;border-radius:12px;padding:10px;background:#fff;margin-bottom:9px}
      .safety-risk-grid-v63{display:grid;grid-template-columns:1.1fr .7fr .7fr 1.5fr 1fr auto;gap:8px;align-items:end}
      .safety-remove-risk-v63{border:1px solid #efcaca;background:#fff7f7;color:#8a3333;border-radius:9px;padding:9px 10px;cursor:pointer;font-weight:700}
      .safety-add-risk-v63{border:1px dashed #89a6bd;background:#f8fbfd;color:#214b6a;border-radius:10px;padding:10px 12px;font-weight:700;cursor:pointer}
      .safety-dialog-actions-v63{display:flex;justify-content:flex-end;gap:8px;position:sticky;bottom:-18px;background:#fff;padding:12px 0 18px;border-top:1px solid #e7edf3;margin-top:4px}
      .safety-secondary-v63{border:1px solid #cbd8e3;background:#fff;color:#35516a;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}
      .safety-primary-v63{border:0;background:#0a376c;color:#fff;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer}
      .safety-note-v63{font-size:.82rem;color:#6d8091;margin:0}
      .safety-counts-v63{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}
      @media(max-width:720px){
        .safety-grid-v63,.safety-grid-v63.three,.safety-check-grid-v63{grid-template-columns:1fr}
        .safety-eval-v63{grid-template-columns:1fr}
        .safety-risk-grid-v63{grid-template-columns:1fr 1fr}.safety-risk-grid-v63 label:first-child,.safety-risk-grid-v63 label:nth-child(4),.safety-risk-grid-v63 label:nth-child(5){grid-column:1/-1}
        .safety-panel-head-v63{flex-direction:column}.safety-panel-head-v63 button{width:100%}
        .safety-dialog-v63{width:calc(100vw - 10px);max-height:96vh}.safety-dialog-shell-v63{padding:14px}.safety-dialog-head-v63{top:-14px;padding-top:14px}.safety-dialog-actions-v63{bottom:-14px;padding-bottom:14px}
      }
    `;
    document.head.appendChild(style);
  }

  function injectUI() {
    if ($('safetyButtonV63')) return;
    const modules = document.querySelector('.launch-modules');
    if (!modules) return;

    const button = document.createElement('button');
    button.id = 'safetyButtonV63';
    button.className = 'launch-module';
    button.type = 'button';
    button.innerHTML = `
      <span class="launch-module-icon" aria-hidden="true">🛡️</span>
      <span class="launch-module-copy"><strong>Segurança de Atividades</strong><small>Visitas técnicas e planos de segurança.</small></span>
      <span class="launch-module-arrow" aria-hidden="true">›</span>`;
    modules.appendChild(button);

    const view = document.createElement('section');
    view.id = 'safetyViewV63';
    view.className = 'members-view hidden';
    view.innerHTML = `
      <header class="subpage-header">
        <button id="safetyBackV63" class="back-button" type="button" aria-label="Voltar">←</button>
        <div class="subpage-brand"><img src="logo-grupo.jpeg" alt="" /><div><span>GEArPC Conecta</span><strong>Segurança de Atividades</strong></div></div>
        <button id="safetyLogoutV63" class="secondary-button">Sair</button>
      </header>
      <section class="members-hero">
        <div><div class="eyebrow dark">PLANEJAMENTO SEGURO</div><h2>Visitas técnicas e planos de segurança</h2><p>Registre a avaliação do local e transforme o levantamento em um plano prático para a atividade.</p></div>
      </section>
      <div class="safety-test-banner-v63"><strong>🛡️ Segurança de Atividades</strong>O preenchimento pode ser feito offline. Para enviar ao DME ou receber o retorno da análise, conecte-se à internet.</div>
      <div class="safety-tabs-v63"><button id="safetyTabVisitsV63" class="safety-tab-v63 active" type="button">📍 Visitas técnicas</button><button id="safetyTabPlansV63" class="safety-tab-v63" type="button">🛡️ Planos de segurança</button></div>
      <section id="safetyVisitsPanelV63" class="safety-panel-v63">
        <div class="safety-panel-head-v63"><div><h3>Relatórios de visita técnica</h3><p>Avalie o local antes da atividade e registre providências necessárias.</p></div><button id="newSafetyVisitV63" class="new-member-button" type="button">＋ Nova visita</button></div>
        <div id="safetyVisitsListV63" class="safety-list-v63"></div>
      </section>
      <section id="safetyPlansPanelV63" class="safety-panel-v63 hidden">
        <div class="safety-panel-head-v63"><div><h3>Planos de segurança</h3><p>Use uma visita técnica como base ou crie o plano diretamente.</p></div><button id="newSafetyPlanV63" class="new-member-button" type="button">＋ Novo plano</button></div>
        <div id="safetyPlansListV63" class="safety-list-v63"></div>
      </section>`;
    document.querySelector('.app-shell')?.appendChild(view);

    document.body.insertAdjacentHTML('beforeend', visitDialogHtml() + planDialogHtml());
    wireEvents();
  }

  function visitDialogHtml() {
    return `
      <dialog id="safetyVisitDialogV63" class="safety-dialog-v63">
        <div class="safety-dialog-shell-v63">
          <div class="safety-dialog-head-v63"><div><div class="eyebrow dark">VISITA TÉCNICA</div><h2 id="safetyVisitTitleV63">Nova visita técnica</h2><p>Registre as condições do local e os pontos que precisam de atenção.</p></div><button id="closeSafetyVisitV63" class="safety-close-v63" type="button">×</button></div>
          <form id="safetyVisitFormV63" class="safety-form-v63">
            <section class="safety-section-v63"><h3>1. Identificação</h3>
              <div class="safety-grid-v63"><label>Nome da atividade<input id="svActivityNameV63" required /></label><label>Tipo de atividade<select id="svActivityTypeV63"><option>Acampamento</option><option>Acantonamento</option><option>Jornada</option><option>Trilha</option><option>Excursão</option><option>Visita</option><option>Atividade externa</option><option>Outra</option></select></label><label>Local<input id="svLocationV63" required /></label><label>Endereço<input id="svAddressV63" /></label><label>Data prevista da atividade<input id="svActivityDateV63" type="date" /></label><label>Data da visita técnica<input id="svVisitDateV63" type="date" required /></label></div>
              <div style="margin-top:10px"><label>Seção(ões)</label><div id="svSectionsV63" class="safety-check-grid-v63"></div></div>
              <div class="safety-grid-v63" style="margin-top:10px"><label>Adultos que fizeram a visita<input id="svVisitorsV63" placeholder="Separe os nomes por vírgula" /></label><label>Responsável pelo local<input id="svLocalContactV63" /></label><label>Telefone do local<input id="svLocalPhoneV63" inputmode="tel" /></label><label>Cobertura de celular<select id="svCellCoverageV63"><option value="boa">Boa</option><option value="parcial">Parcial</option><option value="inexistente">Inexistente</option><option value="nao_verificado">Não verificada</option></select></label></div>
            </section>
            <section class="safety-section-v63"><h3>2. Avaliação do local</h3><p class="safety-note-v63">Marque a condição encontrada e registre uma observação quando necessário.</p><div id="svEvaluationV63"></div></section>
            <section class="safety-section-v63"><h3>3. Emergência e evacuação</h3><div class="safety-grid-v63"><label>Hospital / UPA de referência<input id="svHospitalV63" /></label><label>Endereço do atendimento<input id="svHospitalAddressV63" /></label><label>Distância aproximada<input id="svHospitalDistanceV63" placeholder="Ex.: 8 km" /></label><label>Tempo estimado<input id="svHospitalTimeV63" placeholder="Ex.: 15 min" /></label><label>Ponto de encontro em emergência<input id="svMeetingPointV63" /></label><label>Melhor acesso para veículo de socorro<input id="svEmergencyAccessV63" /></label></div><label style="margin-top:10px">Rota / procedimento de evacuação<textarea id="svEvacuationRouteV63"></textarea></label></section>
            <section class="safety-section-v63"><h3>4. Conclusão da visita</h3><div class="safety-grid-v63"><label>Conclusão<select id="svConclusionV63"><option value="apto">✅ Local adequado</option><option value="condicional">⚠️ Adequado com providências</option></select></label><label>Responsável pelo relatório<select id="svResponsibleV63"></select></label></div><label style="margin-top:10px">Providências necessárias / observações finais<textarea id="svMeasuresV63" placeholder="Ex.: isolar barranco, levar água potável, reforçar iluminação..."></textarea></label></section>
            <div class="safety-dialog-actions-v63"><button id="cancelSafetyVisitV63" class="safety-secondary-v63" type="button">Cancelar</button><button class="safety-primary-v63" type="submit">Salvar visita</button></div>
          </form>
        </div>
      </dialog>`;
  }

  function planDialogHtml() {
    return `
      <dialog id="safetyPlanDialogV63" class="safety-dialog-v63">
        <div class="safety-dialog-shell-v63">
          <div class="safety-dialog-head-v63"><div><div class="eyebrow dark">PLANO DE SEGURANÇA</div><h2 id="safetyPlanTitleV63">Novo plano de segurança</h2><p>Defina responsáveis, riscos, medidas preventivas e resposta a emergências.</p></div><button id="closeSafetyPlanV63" class="safety-close-v63" type="button">×</button></div>
          <form id="safetyPlanFormV63" class="safety-form-v63">
            <section class="safety-section-v63"><h3>1. Base do plano</h3><label>Usar uma visita técnica já registrada<select id="spBaseVisitV63"><option value="">Não usar visita anterior</option></select></label><p class="safety-note-v63" style="margin-top:7px">Ao selecionar uma visita, o aplicativo preenche os principais dados do local automaticamente.</p></section>
            <section class="safety-section-v63"><h3>2. Identificação da atividade</h3><div class="safety-grid-v63"><label>Nome da atividade<input id="spActivityNameV63" required /></label><label>Tipo<select id="spActivityTypeV63"><option>Acampamento</option><option>Acantonamento</option><option>Jornada</option><option>Trilha</option><option>Excursão</option><option>Visita</option><option>Atividade externa</option><option>Outra</option></select></label><label>Local<input id="spLocationV63" required /></label><label>Endereço<input id="spAddressV63" /></label><label>Data<input id="spDateV63" type="date" required /></label><label>Status<select id="spStatusV63"><option value="rascunho">Rascunho</option><option value="pronto">Pronto para a atividade</option></select></label></div><div style="margin-top:10px"><label>Seção(ões)</label><div id="spSectionsV63" class="safety-check-grid-v63"></div></div></section>
            <section class="safety-section-v63"><h3>3. Responsáveis</h3><div class="safety-grid-v63 three"><label>Coordenador da atividade<select id="spCoordinatorV63"></select></label><label>Responsável pela segurança<select id="spSafetyLeadV63"></select></label><label>Responsável pelos primeiros socorros<select id="spFirstAidLeadV63"></select></label></div></section>
            <section class="safety-section-v63"><h3>4. Análise de riscos</h3><div id="spRisksV63"></div><button id="addSafetyRiskV63" class="safety-add-risk-v63" type="button">＋ Adicionar risco</button></section>
            <section class="safety-section-v63"><h3>5. Procedimentos de emergência</h3><div id="spEmergencyV63" class="safety-grid-v63">${EMERGENCY_ITEMS.map(([key, label]) => `<label>${label}<textarea data-emergency="${key}" rows="3"></textarea></label>`).join('')}</div></section>
            <section class="safety-section-v63"><h3>6. Primeiros socorros, transporte e comunicação</h3><div class="safety-grid-v63"><label>Local do kit de primeiros socorros<input id="spKitLocationV63" /></label><label>Kit conferido?<select id="spKitCheckedV63"><option value="nao">Não</option><option value="sim">Sim</option></select></label><label>Meio de transporte<input id="spTransportV63" placeholder="Ex.: carros particulares / ônibus" /></label><label>Rota principal / deslocamento<input id="spRouteV63" /></label><label>Cobertura de celular<select id="spCellCoverageV63"><option value="boa">Boa</option><option value="parcial">Parcial</option><option value="inexistente">Inexistente</option><option value="nao_verificado">Não verificada</option></select></label><label>Outro meio de comunicação<input id="spOtherCommunicationV63" placeholder="Ex.: rádio HT" /></label><label>Hospital / UPA de referência<input id="spHospitalV63" /></label><label>Ponto de encontro em emergência<input id="spMeetingPointV63" /></label></div></section>
            <section class="safety-section-v63"><h3>7. Checklist final</h3><div id="spChecklistV63" class="safety-check-grid-v63">
              ${['Visita técnica conferida','Riscos avaliados','Responsáveis definidos','Kit de primeiros socorros conferido','Contatos de emergência conferidos','Transporte / deslocamento definido','Autorizações verificadas','Fichas médicas verificadas','Participantes serão orientados sobre segurança','Plano de emergência definido','Previsão meteorológica será verificada'].map((label, i) => `<label class="safety-check-option-v63"><input type="checkbox" data-check="${i}" /><span>${label}</span></label>`).join('')}
            </div></section>
            <div class="safety-dialog-actions-v63"><button id="cancelSafetyPlanV63" class="safety-secondary-v63" type="button">Cancelar</button><button class="safety-primary-v63" type="submit">Salvar plano</button></div>
          </form>
        </div>
      </dialog>`;
  }

  function evaluationHtml(values = []) {
    const map = new Map((values || []).map((item) => [item.item, item]));
    return VISIT_ITEMS.map((item, index) => {
      const current = map.get(item) || {};
      return `<div class="safety-eval-v63" data-eval-index="${index}"><strong>${esc(item)}</strong><select data-field="status"><option value="adequado" ${current.status === 'adequado' ? 'selected' : ''}>✅ Adequado</option><option value="atencao" ${current.status === 'atencao' ? 'selected' : ''}>⚠️ Atenção</option><option value="inadequado" ${current.status === 'inadequado' ? 'selected' : ''}>❌ Inadequado</option><option value="na" ${current.status === 'na' ? 'selected' : ''}>Não se aplica</option></select><input data-field="note" value="${esc(current.note || '')}" placeholder="Observação" /></div>`;
    }).join('');
  }

  function riskRowHtml(risk = {}) {
    return `<div class="safety-risk-v63"><div class="safety-risk-grid-v63"><label>Risco<input data-risk="name" value="${esc(risk.name || '')}" placeholder="Ex.: queda, queimadura..." /></label><label>Probabilidade<select data-risk="prob"><option value="baixa" ${risk.prob === 'baixa' ? 'selected' : ''}>Baixa</option><option value="media" ${risk.prob === 'media' ? 'selected' : ''}>Média</option><option value="alta" ${risk.prob === 'alta' ? 'selected' : ''}>Alta</option></select></label><label>Gravidade<select data-risk="severity"><option value="leve" ${risk.severity === 'leve' ? 'selected' : ''}>Leve</option><option value="moderada" ${risk.severity === 'moderada' ? 'selected' : ''}>Moderada</option><option value="grave" ${risk.severity === 'grave' ? 'selected' : ''}>Grave</option></select></label><label>Medida preventiva<input data-risk="prevention" value="${esc(risk.prevention || '')}" /></label><label>Responsável<input data-risk="responsible" value="${esc(risk.responsible || '')}" /></label><button class="safety-remove-risk-v63" type="button" title="Remover risco">×</button></div></div>`;
  }

  function showView() {
    document.querySelectorAll('.app-shell > section').forEach((section) => section.classList.add('hidden'));
    $('safetyViewV63')?.classList.remove('hidden');
    renderLists();
  }

  function backToDashboard() {
    $('safetyViewV63')?.classList.add('hidden');
    rt?.showDashboard?.();
  }

  function switchTab(tab) {
    const visits = tab === 'visits';
    $('safetyTabVisitsV63')?.classList.toggle('active', visits);
    $('safetyTabPlansV63')?.classList.toggle('active', !visits);
    $('safetyVisitsPanelV63')?.classList.toggle('hidden', !visits);
    $('safetyPlansPanelV63')?.classList.toggle('hidden', visits);
  }

  function renderLists() {
    const visitList = $('safetyVisitsListV63');
    const planList = $('safetyPlansListV63');
    if (visitList) {
      visitList.innerHTML = store.visits.length ? [...store.visits].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).map((v) => {
        const cls = v.conclusion === 'apto' ? 'ok' : v.conclusion === 'condicional' ? 'warn' : 'bad';
        const label = v.conclusion === 'apto' ? 'Adequado' : v.conclusion === 'condicional' ? 'Com providências' : 'Não recomendado';
        return `<article class="safety-card-v63"><div class="safety-card-top-v63"><div><h4>${esc(v.activityName || 'Visita técnica')}</h4><div class="meta"><span>📍 ${esc(v.location || 'Local não informado')}</span><span>📅 ${formatDate(v.visitDate)}</span>${v.sections?.length ? `<span>⚜ ${esc(v.sections.join(', '))}</span>` : ''}</div></div><span class="safety-pill-v63 ${cls}">${label}</span></div><div class="safety-card-actions-v63"><button class="safety-mini-btn-v63" type="button" data-edit-visit="${esc(v.id)}">Ver / editar</button><button class="safety-mini-btn-v63" type="button" data-plan-from-visit="${esc(v.id)}">Criar plano</button><button class="safety-mini-btn-v63 danger" type="button" data-delete-visit="${esc(v.id)}">Apagar</button></div></article>`;
      }).join('') : '<div class="safety-empty-v63">Nenhuma visita técnica cadastrada.</div>';
    }
    if (planList) {
      planList.innerHTML = store.plans.length ? [...store.plans].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).map((p) => {
        const ready = p.status === 'pronto';
        return `<article class="safety-card-v63"><div class="safety-card-top-v63"><div><h4>${esc(p.activityName || 'Plano de segurança')}</h4><div class="meta"><span>📍 ${esc(p.location || 'Local não informado')}</span><span>📅 ${formatDate(p.date)}</span>${p.sections?.length ? `<span>⚜ ${esc(p.sections.join(', '))}</span>` : ''}</div><div class="safety-counts-v63"><span class="safety-pill-v63">${p.risks?.length || 0} risco(s)</span><span class="safety-pill-v63">${p.checklist?.filter(Boolean).length || 0}/11 itens conferidos</span></div></div><span class="safety-pill-v63 ${ready ? 'ok' : 'warn'}">${ready ? 'Pronto' : 'Rascunho'}</span></div><div class="safety-card-actions-v63"><button class="safety-mini-btn-v63" type="button" data-edit-plan="${esc(p.id)}">Ver / editar</button><button class="safety-mini-btn-v63 danger" type="button" data-delete-plan="${esc(p.id)}">Apagar</button></div></article>`;
      }).join('') : '<div class="safety-empty-v63">Nenhum plano de segurança cadastrado.</div>';
    }
    refreshBaseVisits();
  }

  function resetVisitForm(record = null) {
    editingVisitId = record?.id || null;
    $('safetyVisitTitleV63').textContent = record ? 'Editar visita técnica' : 'Nova visita técnica';
    $('svActivityNameV63').value = record?.activityName || '';
    $('svActivityTypeV63').value = record?.activityType || 'Acampamento';
    $('svLocationV63').value = record?.location || '';
    $('svAddressV63').value = record?.address || '';
    $('svActivityDateV63').value = record?.activityDate || '';
    $('svVisitDateV63').value = record?.visitDate || todayISO();
    $('svVisitorsV63').value = record?.visitors || rt?.state?.profile?.nome_completo || '';
    $('svLocalContactV63').value = record?.localContact || '';
    $('svLocalPhoneV63').value = record?.localPhone || '';
    $('svCellCoverageV63').value = record?.cellCoverage || 'nao_verificado';
    $('svHospitalV63').value = record?.hospital || '';
    $('svHospitalAddressV63').value = record?.hospitalAddress || '';
    $('svHospitalDistanceV63').value = record?.hospitalDistance || '';
    $('svHospitalTimeV63').value = record?.hospitalTime || '';
    $('svMeetingPointV63').value = record?.meetingPoint || '';
    $('svEmergencyAccessV63').value = record?.emergencyAccess || '';
    $('svEvacuationRouteV63').value = record?.evacuationRoute || '';
    $('svConclusionV63').value = record?.conclusion || 'apto';
    $('svMeasuresV63').value = record?.measures || '';
    $('svResponsibleV63').innerHTML = adultSelectOptions(record?.responsible || rt?.state?.profile?.nome_completo || '');
    setSections('svSectionsV63', record?.sections || []);
    $('svEvaluationV63').innerHTML = evaluationHtml(record?.evaluation || []);
  }

  function visitFromForm() {
    const evaluation = [...$('svEvaluationV63').querySelectorAll('.safety-eval-v63')].map((row, index) => ({
      item: VISIT_ITEMS[index],
      status: row.querySelector('[data-field="status"]').value,
      note: row.querySelector('[data-field="note"]').value.trim()
    }));
    return {
      id: editingVisitId || uid('visit'),
      activityName: $('svActivityNameV63').value.trim(),
      activityType: $('svActivityTypeV63').value,
      location: $('svLocationV63').value.trim(),
      address: $('svAddressV63').value.trim(),
      activityDate: $('svActivityDateV63').value,
      visitDate: $('svVisitDateV63').value,
      sections: selectedSections('svSectionsV63'),
      visitors: $('svVisitorsV63').value.trim(),
      localContact: $('svLocalContactV63').value.trim(),
      localPhone: $('svLocalPhoneV63').value.trim(),
      cellCoverage: $('svCellCoverageV63').value,
      evaluation,
      hospital: $('svHospitalV63').value.trim(),
      hospitalAddress: $('svHospitalAddressV63').value.trim(),
      hospitalDistance: $('svHospitalDistanceV63').value.trim(),
      hospitalTime: $('svHospitalTimeV63').value.trim(),
      meetingPoint: $('svMeetingPointV63').value.trim(),
      emergencyAccess: $('svEmergencyAccessV63').value.trim(),
      evacuationRoute: $('svEvacuationRouteV63').value.trim(),
      conclusion: $('svConclusionV63').value,
      measures: $('svMeasuresV63').value.trim(),
      responsible: $('svResponsibleV63').value,
      updatedAt: new Date().toISOString()
    };
  }

  function refreshBaseVisits(selected = '') {
    const select = $('spBaseVisitV63');
    if (!select) return;
    const current = selected || select.value;
    select.innerHTML = '<option value="">Não usar visita anterior</option>' + store.visits.map((v) => `<option value="${esc(v.id)}" ${v.id === current ? 'selected' : ''}>${esc(v.activityName)} — ${esc(v.location)}</option>`).join('');
  }

  function resetPlanForm(record = null, baseVisit = null) {
    editingPlanId = record?.id || null;
    $('safetyPlanTitleV63').textContent = record ? 'Editar plano de segurança' : 'Novo plano de segurança';
    refreshBaseVisits(record?.baseVisitId || baseVisit?.id || '');
    const source = record || {};
    $('spActivityNameV63').value = source.activityName || baseVisit?.activityName || '';
    $('spActivityTypeV63').value = source.activityType || baseVisit?.activityType || 'Acampamento';
    $('spLocationV63').value = source.location || baseVisit?.location || '';
    $('spAddressV63').value = source.address || baseVisit?.address || '';
    $('spDateV63').value = source.date || baseVisit?.activityDate || '';
    $('spStatusV63').value = source.status || 'rascunho';
    setSections('spSectionsV63', source.sections || baseVisit?.sections || []);
    $('spCoordinatorV63').innerHTML = adultSelectOptions(source.coordinator || rt?.state?.profile?.nome_completo || '');
    $('spSafetyLeadV63').innerHTML = adultSelectOptions(source.safetyLead || '');
    $('spFirstAidLeadV63').innerHTML = adultSelectOptions(source.firstAidLead || '');
    const risks = source.risks?.length ? source.risks : [{ name: '', prob: 'baixa', severity: 'leve', prevention: '', responsible: '' }];
    $('spRisksV63').innerHTML = risks.map(riskRowHtml).join('');
    const emergency = source.emergency || {};
    $('spEmergencyV63').querySelectorAll('[data-emergency]').forEach((field) => { field.value = emergency[field.dataset.emergency] || ''; });
    $('spKitLocationV63').value = source.kitLocation || '';
    $('spKitCheckedV63').value = source.kitChecked || 'nao';
    $('spTransportV63').value = source.transport || '';
    $('spRouteV63').value = source.route || '';
    $('spCellCoverageV63').value = source.cellCoverage || baseVisit?.cellCoverage || 'nao_verificado';
    $('spOtherCommunicationV63').value = source.otherCommunication || '';
    $('spHospitalV63').value = source.hospital || baseVisit?.hospital || '';
    $('spMeetingPointV63').value = source.meetingPoint || baseVisit?.meetingPoint || '';
    const checklist = source.checklist || [];
    $('spChecklistV63').querySelectorAll('[data-check]').forEach((input, index) => { input.checked = Boolean(checklist[index]); });
  }

  function applyBaseVisit(id) {
    if (!id) return;
    const visit = store.visits.find((v) => v.id === id);
    if (!visit) return;
    $('spActivityNameV63').value = visit.activityName || '';
    $('spActivityTypeV63').value = visit.activityType || 'Acampamento';
    $('spLocationV63').value = visit.location || '';
    $('spAddressV63').value = visit.address || '';
    $('spDateV63').value = visit.activityDate || '';
    $('spCellCoverageV63').value = visit.cellCoverage || 'nao_verificado';
    $('spHospitalV63').value = visit.hospital || '';
    $('spMeetingPointV63').value = visit.meetingPoint || '';
    setSections('spSectionsV63', visit.sections || []);
    const emergencyEvac = $('spEmergencyV63').querySelector('[data-emergency="evacuacao"]');
    if (emergencyEvac && visit.evacuationRoute) emergencyEvac.value = visit.evacuationRoute;
  }

  function planFromForm() {
    const risks = [...$('spRisksV63').querySelectorAll('.safety-risk-v63')].map((row) => ({
      name: row.querySelector('[data-risk="name"]').value.trim(),
      prob: row.querySelector('[data-risk="prob"]').value,
      severity: row.querySelector('[data-risk="severity"]').value,
      prevention: row.querySelector('[data-risk="prevention"]').value.trim(),
      responsible: row.querySelector('[data-risk="responsible"]').value.trim()
    })).filter((risk) => risk.name || risk.prevention || risk.responsible);
    const emergency = {};
    $('spEmergencyV63').querySelectorAll('[data-emergency]').forEach((field) => { emergency[field.dataset.emergency] = field.value.trim(); });
    const checklist = [...$('spChecklistV63').querySelectorAll('[data-check]')].map((input) => input.checked);
    return {
      id: editingPlanId || uid('plan'),
      baseVisitId: $('spBaseVisitV63').value || '',
      activityName: $('spActivityNameV63').value.trim(),
      activityType: $('spActivityTypeV63').value,
      location: $('spLocationV63').value.trim(),
      address: $('spAddressV63').value.trim(),
      date: $('spDateV63').value,
      status: $('spStatusV63').value,
      sections: selectedSections('spSectionsV63'),
      coordinator: $('spCoordinatorV63').value,
      safetyLead: $('spSafetyLeadV63').value,
      firstAidLead: $('spFirstAidLeadV63').value,
      risks,
      emergency,
      kitLocation: $('spKitLocationV63').value.trim(),
      kitChecked: $('spKitCheckedV63').value,
      transport: $('spTransportV63').value.trim(),
      route: $('spRouteV63').value.trim(),
      cellCoverage: $('spCellCoverageV63').value,
      otherCommunication: $('spOtherCommunicationV63').value.trim(),
      hospital: $('spHospitalV63').value.trim(),
      meetingPoint: $('spMeetingPointV63').value.trim(),
      checklist,
      updatedAt: new Date().toISOString()
    };
  }

  function openVisit(id = null) {
    const record = id ? store.visits.find((v) => v.id === id) : null;
    resetVisitForm(record || null);
    $('safetyVisitDialogV63')?.showModal();
  }

  function openPlan(id = null, baseVisitId = null) {
    const record = id ? store.plans.find((p) => p.id === id) : null;
    const base = baseVisitId ? store.visits.find((v) => v.id === baseVisitId) : null;
    resetPlanForm(record || null, base || null);
    $('safetyPlanDialogV63')?.showModal();
  }

  function wireEvents() {
    $('safetyButtonV63')?.addEventListener('click', showView);
    $('safetyBackV63')?.addEventListener('click', backToDashboard);
    $('safetyLogoutV63')?.addEventListener('click', () => rt?.client?.auth?.signOut());
    $('safetyTabVisitsV63')?.addEventListener('click', () => switchTab('visits'));
    $('safetyTabPlansV63')?.addEventListener('click', () => switchTab('plans'));
    $('newSafetyVisitV63')?.addEventListener('click', () => openVisit());
    $('newSafetyPlanV63')?.addEventListener('click', () => openPlan());
    $('closeSafetyVisitV63')?.addEventListener('click', () => $('safetyVisitDialogV63')?.close());
    $('cancelSafetyVisitV63')?.addEventListener('click', () => $('safetyVisitDialogV63')?.close());
    $('closeSafetyPlanV63')?.addEventListener('click', () => $('safetyPlanDialogV63')?.close());
    $('cancelSafetyPlanV63')?.addEventListener('click', () => $('safetyPlanDialogV63')?.close());
    $('addSafetyRiskV63')?.addEventListener('click', () => $('spRisksV63')?.insertAdjacentHTML('beforeend', riskRowHtml()));
    $('spRisksV63')?.addEventListener('click', (event) => {
      const btn = event.target.closest('.safety-remove-risk-v63');
      if (!btn) return;
      const rows = $('spRisksV63').querySelectorAll('.safety-risk-v63');
      if (rows.length <= 1) {
        rows[0].querySelectorAll('input').forEach((input) => { input.value = ''; });
        return;
      }
      btn.closest('.safety-risk-v63')?.remove();
    });
    $('spBaseVisitV63')?.addEventListener('change', (event) => applyBaseVisit(event.target.value));

    $('safetyVisitFormV63')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const record = visitFromForm();
      const index = store.visits.findIndex((v) => v.id === record.id);
      if (index >= 0) store.visits[index] = record; else store.visits.push(record);
      saveStore();
      $('safetyVisitDialogV63')?.close();
      renderLists();
    });

    $('safetyPlanFormV63')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const record = planFromForm();
      const index = store.plans.findIndex((p) => p.id === record.id);
      if (index >= 0) store.plans[index] = record; else store.plans.push(record);
      saveStore();
      $('safetyPlanDialogV63')?.close();
      renderLists();
    });

    $('safetyVisitsListV63')?.addEventListener('click', (event) => {
      const edit = event.target.closest('[data-edit-visit]');
      if (edit) return openVisit(edit.dataset.editVisit);
      const create = event.target.closest('[data-plan-from-visit]');
      if (create) { switchTab('plans'); return openPlan(null, create.dataset.planFromVisit); }
      const del = event.target.closest('[data-delete-visit]');
      if (del && window.confirm('Apagar esta visita técnica?')) {
        store.visits = store.visits.filter((v) => v.id !== del.dataset.deleteVisit);
        saveStore(); renderLists();
      }
    });

    $('safetyPlansListV63')?.addEventListener('click', (event) => {
      const edit = event.target.closest('[data-edit-plan]');
      if (edit) return openPlan(edit.dataset.editPlan);
      const del = event.target.closest('[data-delete-plan]');
      if (del && window.confirm('Apagar este plano de segurança?')) {
        store.plans = store.plans.filter((p) => p.id !== del.dataset.deletePlan);
        saveStore(); renderLists();
      }
    });
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt || !(await allowedForTest(rt))) return;
    injectStyles();
    injectUI();
    loadStore();
    renderLists();
  }

  void boot();
})();