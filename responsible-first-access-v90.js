(() => {
  if (window.__GEARPC_RESPONSIBLE_FIRST_ACCESS_V90__) return;
  window.__GEARPC_RESPONSIBLE_FIRST_ACCESS_V90__ = true;

  const $ = (id) => document.getElementById(id);
  const state = {
    rt: null,
    rows: [],
    confirmations: new Map(),
    loading: false
  };

  function profile() { return state.rt?.state?.profile || null; }
  function user() { return state.rt?.state?.user || null; }
  function client() { return state.rt?.client || null; }

  function enabledForCurrentProfile() {
    const p = profile();
    return Boolean(p?.tipo === 'responsavel' && p?.eh_teste === true && p?.responsavel_id);
  }

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
      .replaceAll('"','&quot;').replaceAll("'","&#039;");
  }

  function formatDate(value) {
    if (!value) return 'Não informado';
    const d = new Date(`${value}T12:00:00`);
    if (Number.isNaN(d.getTime())) return 'Não informado';
    return d.toLocaleDateString('pt-BR');
  }

  function valueOrMissing(value) {
    const text = String(value ?? '').trim();
    return text || 'Não informado';
  }

  function addStyles() {
    if ($('responsibleFirstAccessStylesV90')) return;
    const style = document.createElement('style');
    style.id = 'responsibleFirstAccessStylesV90';
    style.textContent = `
      .responsible-first-access-v90{
        position:fixed;inset:0;z-index:100000;background:#eef3f7;
        overflow:auto;padding:18px 14px 34px;box-sizing:border-box;
      }
      .responsible-first-access-v90.hidden{display:none!important}
      .rfa-shell-v90{width:min(760px,100%);margin:0 auto}
      .rfa-head-v90{background:#0a376c;color:#fff;border-radius:20px;padding:20px 18px;box-shadow:0 12px 30px rgba(10,55,108,.18)}
      .rfa-head-row-v90{display:flex;align-items:center;gap:12px}
      .rfa-logo-v90{width:54px;height:54px;border-radius:14px;object-fit:cover;background:#fff}
      .rfa-eyebrow-v90{font-size:.72rem;font-weight:900;letter-spacing:.08em;opacity:.8}
      .rfa-head-v90 h1{margin:3px 0 0;font-size:1.35rem}
      .rfa-head-v90 p{margin:13px 0 0;line-height:1.45;font-size:.88rem;opacity:.94}
      .rfa-progress-v90{margin:14px 0 0;font-size:.8rem;font-weight:850}
      .rfa-actions-top-v90{display:flex;justify-content:space-between;gap:8px;margin:12px 0}
      .rfa-secondary-v90,.rfa-logout-v90{border:1px solid #cbd7e2;border-radius:10px;padding:9px 11px;background:#fff;color:#17324d;font-weight:850;cursor:pointer}
      .rfa-list-v90{display:grid;gap:12px}
      .rfa-card-v90{background:#fff;border:1px solid #d8e2ec;border-radius:17px;padding:15px;box-shadow:0 7px 20px rgba(18,48,77,.06)}
      .rfa-card-v90.confirmed{border-color:#9bcaaa;background:#f7fcf8}
      .rfa-card-v90.correction{border-color:#e6c46c;background:#fffaf0}
      .rfa-card-head-v90{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:11px}
      .rfa-card-head-v90 h2{margin:0;color:#17324d;font-size:1.04rem;line-height:1.3}
      .rfa-status-v90{flex:0 0 auto;padding:4px 8px;border-radius:999px;font-size:.67rem;font-weight:950;text-transform:uppercase;letter-spacing:.03em;background:#edf2f7;color:#51667a}
      .rfa-status-v90.ok{background:#e6f5eb;color:#22633a}.rfa-status-v90.wait{background:#fff0c7;color:#775900}
      .rfa-grid-v90{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .rfa-field-v90{background:#f6f8fa;border-radius:10px;padding:9px 10px;min-width:0}
      .rfa-field-v90 span{display:block;color:#718294;font-size:.68rem;font-weight:850;text-transform:uppercase;letter-spacing:.03em}
      .rfa-field-v90 strong{display:block;margin-top:3px;color:#243c53;font-size:.86rem;word-break:break-word}
      .rfa-card-actions-v90{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}
      .rfa-confirm-v90{border:0;border-radius:10px;padding:10px 12px;background:#176b3a;color:#fff;font-weight:900;cursor:pointer}
      .rfa-correction-v90{border:1px solid #d4b65c;border-radius:10px;padding:9px 11px;background:#fff8e2;color:#725400;font-weight:900;cursor:pointer}
      .rfa-correction-box-v90{margin-top:11px;padding-top:11px;border-top:1px solid #e7d9ae}
      .rfa-correction-box-v90 textarea{width:100%;box-sizing:border-box;min-height:86px;border:1px solid #ccb86f;border-radius:10px;padding:10px;font:inherit;resize:vertical}
      .rfa-correction-box-v90 p{margin:6px 0 0;color:#735c1c;font-size:.76rem;line-height:1.4}
      .rfa-request-text-v90{margin:10px 0 0;padding:10px 11px;border-radius:10px;background:#fff2c9;color:#695115;font-size:.8rem;line-height:1.45}
      .rfa-message-v90{min-height:20px;margin:10px 2px 0;color:#9b3f31;font-size:.8rem;font-weight:750}
      .rfa-empty-v90{background:#fff;border:1px solid #d8e2ec;border-radius:16px;padding:22px;text-align:center;color:#51667a}
      .rfa-footer-v90{text-align:center;color:#7a8a99;font-size:.72rem;margin-top:18px}
      body.rfa-locked-v90{overflow:hidden!important}
      @media(max-width:580px){
        .responsible-first-access-v90{padding:10px 9px 26px}
        .rfa-head-v90{border-radius:16px;padding:17px 14px}
        .rfa-grid-v90{grid-template-columns:1fr}
        .rfa-card-actions-v90 button{width:100%}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureGate() {
    addStyles();
    let gate = $('responsibleFirstAccessV90');
    if (gate) return gate;

    gate = document.createElement('section');
    gate.id = 'responsibleFirstAccessV90';
    gate.className = 'responsible-first-access-v90 hidden';
    gate.setAttribute('aria-label','Conferência dos dados dos jovens');
    gate.innerHTML = `
      <div class="rfa-shell-v90">
        <header class="rfa-head-v90">
          <div class="rfa-head-row-v90">
            <img class="rfa-logo-v90" src="logo-grupo.jpeg" alt="">
            <div>
              <div class="rfa-eyebrow-v90">PRIMEIRO ACESSO</div>
              <h1>Confira os dados dos seus jovens</h1>
            </div>
          </div>
          <p>Antes de acessar o GEArPC Conecta, confira os dados cadastrais de cada jovem vinculado ao seu acesso. A navegação será liberada quando todos estiverem confirmados.</p>
          <div id="responsibleFirstAccessProgressV90" class="rfa-progress-v90"></div>
        </header>

        <div class="rfa-actions-top-v90">
          <button id="responsibleFirstAccessRefreshV90" class="rfa-secondary-v90" type="button">↻ Atualizar dados</button>
          <button id="responsibleFirstAccessLogoutV90" class="rfa-logout-v90" type="button">Sair</button>
        </div>

        <div id="responsibleFirstAccessListV90" class="rfa-list-v90"></div>
        <p id="responsibleFirstAccessMessageV90" class="rfa-message-v90" role="status"></p>
        <div class="rfa-footer-v90">GEArPC Conecta • Grupo Escoteiro do Ar Paulo Carzino</div>
      </div>
    `;
    document.body.appendChild(gate);

    $('responsibleFirstAccessRefreshV90')?.addEventListener('click', () => void loadAndRender(true));
    $('responsibleFirstAccessLogoutV90')?.addEventListener('click', async () => {
      await client()?.auth.signOut();
      hideGate();
    });

    gate.addEventListener('click', (event) => {
      const confirm = event.target.closest('[data-rfa-confirm]');
      if (confirm) {
        confirm.disabled = true;
        void setStatus(Number(confirm.dataset.rfaConfirm), 'confirmado', '').finally(() => { confirm.disabled = false; });
        return;
      }

      const correction = event.target.closest('[data-rfa-correction]');
      if (correction) {
        const id = Number(correction.dataset.rfaCorrection);
        const box = gate.querySelector(`[data-rfa-correction-box="${id}"]`);
        box?.classList.toggle('hidden');
        box?.querySelector('textarea')?.focus();
        return;
      }

      const send = event.target.closest('[data-rfa-send-correction]');
      if (send) {
        const id = Number(send.dataset.rfaSendCorrection);
        const box = gate.querySelector(`[data-rfa-correction-box="${id}"]`);
        const text = box?.querySelector('textarea')?.value?.trim() || '';
        if (text.length < 3) {
          setMessage('Explique brevemente o que precisa ser corrigido.');
          return;
        }
        send.disabled = true;
        void setStatus(id, 'correcao_solicitada', text).finally(() => { send.disabled = false; });
      }
    });

    return gate;
  }

  function showGate() {
    const gate = ensureGate();
    gate.classList.remove('hidden');
    document.body.classList.add('rfa-locked-v90');
  }

  function hideGate() {
    $('responsibleFirstAccessV90')?.classList.add('hidden');
    document.body.classList.remove('rfa-locked-v90');
  }

  function setMessage(text = '', success = false) {
    const el = $('responsibleFirstAccessMessageV90');
    if (!el) return;
    el.textContent = text;
    el.style.color = success ? '#176b3a' : '#9b3f31';
  }

  async function loadRows() {
    const p = profile();
    const c = client();
    if (!p?.responsavel_id || !c) return [];

    const [linksRes, jovensRes, ramosRes, secoesRes, equipesRes, confirmationsRes] = await Promise.all([
      c.from('jovem_responsaveis')
        .select('jovem_id,responsavel_id,parentesco,responsavel_principal')
        .eq('responsavel_id', Number(p.responsavel_id)),
      c.from('jovens')
        .select('id,nome_completo,data_nascimento,registro_paxtu,validade_registro,data_acolhida,ramo_id,secao_id,equipe_id,ativo')
        .eq('ativo', true)
        .order('nome_completo'),
      c.from('ramos').select('id,nome'),
      c.from('secoes').select('id,nome,ramo_id'),
      c.from('equipes').select('id,nome,secao_id,tipo,ativo').eq('ativo', true),
      c.from('responsavel_confirmacoes_jovens')
        .select('id,responsavel_id,jovem_id,status,observacao,confirmado_em,solicitado_em,atualizado_em')
        .eq('responsavel_id', Number(p.responsavel_id))
    ]);

    const firstError = [linksRes,jovensRes,ramosRes,secoesRes,equipesRes,confirmationsRes].find((r) => r.error)?.error;
    if (firstError) throw firstError;

    const linkedIds = new Set((linksRes.data || []).map((x) => Number(x.jovem_id)));
    const linkMap = new Map((linksRes.data || []).map((x) => [Number(x.jovem_id), x]));
    const ramoMap = new Map((ramosRes.data || []).map((x) => [Number(x.id), x]));
    const secaoMap = new Map((secoesRes.data || []).map((x) => [Number(x.id), x]));
    const equipeMap = new Map((equipesRes.data || []).map((x) => [Number(x.id), x]));

    state.confirmations = new Map((confirmationsRes.data || []).map((x) => [Number(x.jovem_id), x]));
    state.rows = (jovensRes.data || [])
      .filter((j) => linkedIds.has(Number(j.id)))
      .map((j) => ({
        ...j,
        link: linkMap.get(Number(j.id)) || null,
        ramo: ramoMap.get(Number(j.ramo_id)) || null,
        secao: secaoMap.get(Number(j.secao_id)) || null,
        equipe: equipeMap.get(Number(j.equipe_id)) || null
      }));

    return state.rows;
  }

  function teamLabel(row) {
    const ramo = String(row.ramo?.nome || '').toLowerCase();
    if (ramo.includes('lobinho')) return 'Matilha';
    if (ramo.includes('escoteiro') || ramo.includes('sênior') || ramo.includes('senior')) return 'Patrulha';
    return 'Equipe';
  }

  function cardHtml(row) {
    const confirmation = state.confirmations.get(Number(row.id));
    const status = confirmation?.status || 'pendente';
    const confirmed = status === 'confirmado';
    const correction = status === 'correcao_solicitada';
    const badge = confirmed
      ? '<span class="rfa-status-v90 ok">Confirmado</span>'
      : correction
        ? '<span class="rfa-status-v90 wait">Correção solicitada</span>'
        : '<span class="rfa-status-v90">Aguardando conferência</span>';

    const correctionText = correction && confirmation?.observacao
      ? `<div class="rfa-request-text-v90"><strong>Correção informada:</strong><br>${esc(confirmation.observacao)}</div>`
      : '';

    return `
      <article class="rfa-card-v90 ${confirmed ? 'confirmed' : correction ? 'correction' : ''}">
        <div class="rfa-card-head-v90">
          <h2>${esc(row.nome_completo)}</h2>
          ${badge}
        </div>
        <div class="rfa-grid-v90">
          <div class="rfa-field-v90"><span>Nascimento</span><strong>${esc(formatDate(row.data_nascimento))}</strong></div>
          <div class="rfa-field-v90"><span>Ramo</span><strong>${esc(valueOrMissing(row.ramo?.nome))}</strong></div>
          <div class="rfa-field-v90"><span>Seção</span><strong>${esc(valueOrMissing(row.secao?.nome))}</strong></div>
          <div class="rfa-field-v90"><span>${esc(teamLabel(row))}</span><strong>${esc(valueOrMissing(row.equipe?.nome))}</strong></div>
          <div class="rfa-field-v90"><span>Nº de registro</span><strong>${esc(valueOrMissing(row.registro_paxtu))}</strong></div>
          <div class="rfa-field-v90"><span>Validade do registro</span><strong>${esc(formatDate(row.validade_registro))}</strong></div>
          <div class="rfa-field-v90"><span>Data de acolhida</span><strong>${esc(formatDate(row.data_acolhida))}</strong></div>
          <div class="rfa-field-v90"><span>Vínculo</span><strong>${esc(valueOrMissing(row.link?.parentesco))}</strong></div>
        </div>

        ${correctionText}

        ${confirmed ? '' : `
          <div class="rfa-card-actions-v90">
            <button class="rfa-confirm-v90" type="button" data-rfa-confirm="${Number(row.id)}">
              ${correction ? '✓ Dados agora estão corretos' : '✓ Dados conferidos'}
            </button>
            <button class="rfa-correction-v90" type="button" data-rfa-correction="${Number(row.id)}">✎ Solicitar correção</button>
          </div>
          <div class="rfa-correction-box-v90 hidden" data-rfa-correction-box="${Number(row.id)}">
            <textarea maxlength="700" placeholder="Ex.: data de nascimento incorreta; número de registro diferente; seção incorreta..."></textarea>
            <div class="rfa-card-actions-v90">
              <button class="rfa-correction-v90" type="button" data-rfa-send-correction="${Number(row.id)}">Enviar solicitação</button>
            </div>
            <p>A navegação continuará bloqueada até que os dados estejam corretos e você confirme este jovem.</p>
          </div>
        `}
      </article>`;
  }

  function render() {
    const gate = ensureGate();
    const list = $('responsibleFirstAccessListV90');
    const progress = $('responsibleFirstAccessProgressV90');
    if (!list || !progress) return;

    if (!state.rows.length) {
      progress.textContent = 'Nenhum jovem vinculado';
      list.innerHTML = '<div class="rfa-empty-v90"><strong>Não encontramos jovens vinculados ao seu acesso.</strong><br>Procure a administração do grupo antes de continuar.</div>';
      showGate();
      return;
    }

    const confirmedCount = state.rows.filter((row) => state.confirmations.get(Number(row.id))?.status === 'confirmado').length;
    progress.textContent = `${confirmedCount} de ${state.rows.length} jovem(ns) confirmado(s)`;
    list.innerHTML = state.rows.map(cardHtml).join('');

    if (confirmedCount === state.rows.length) {
      setMessage('Dados conferidos. Acesso liberado.', true);
      window.setTimeout(hideGate, 350);
    } else {
      setMessage('');
      showGate();
    }
  }

  async function loadAndRender(force = false) {
    if (!enabledForCurrentProfile() || state.loading) {
      if (!enabledForCurrentProfile()) hideGate();
      return;
    }

    state.loading = true;
    setMessage(force ? 'Atualizando dados…' : '');
    try {
      await loadRows();
      render();
    } catch (error) {
      showGate();
      setMessage(`Não foi possível carregar a conferência: ${error?.message || 'erro inesperado'}`);
    } finally {
      state.loading = false;
    }
  }

  async function setStatus(jovemId, status, observation) {
    if (!enabledForCurrentProfile()) return;
    const p = profile();
    const u = user();
    const c = client();
    if (!p?.responsavel_id || !u?.id || !c) return;

    const now = new Date().toISOString();
    const payload = {
      responsavel_id: Number(p.responsavel_id),
      jovem_id: Number(jovemId),
      status,
      observacao: status === 'correcao_solicitada' ? observation : null,
      confirmado_em: status === 'confirmado' ? now : null,
      solicitado_em: status === 'correcao_solicitada' ? now : null,
      confirmado_por: u.id,
      atualizado_em: now
    };

    setMessage(status === 'confirmado' ? 'Salvando confirmação…' : 'Registrando solicitação…');

    const { error } = await c.from('responsavel_confirmacoes_jovens')
      .upsert(payload, { onConflict: 'responsavel_id,jovem_id' });

    if (error) {
      setMessage(`Não foi possível salvar: ${error.message}`);
      return;
    }

    await loadRows();
    render();

    if (status === 'correcao_solicitada') {
      setMessage('Solicitação registrada. Após a correção, atualize os dados e confirme o jovem.', true);
    }
  }

  async function waitRuntime() {
    for (let i = 0; i < 120; i += 1) {
      const rt = window.GEARPC_RUNTIME;
      if (rt?.client && rt?.state?.profile && rt?.state?.user?.id) {
        state.rt = rt;
        return rt;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return null;
  }

  const prepare = async () => {
    const rt = await waitRuntime();
    if (!rt) return;
    ensureGate();
    if (!enabledForCurrentProfile()) {
      hideGate();
      return;
    }
    await loadAndRender();
  };

  window.GEARPC_DASHBOARD_PREPARE_TASKS = window.GEARPC_DASHBOARD_PREPARE_TASKS || [];
  window.GEARPC_DASHBOARD_PREPARE_TASKS.push(prepare);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && enabledForCurrentProfile() && !$('responsibleFirstAccessV90')?.classList.contains('hidden')) {
      void loadAndRender(true);
    }
  });
})();