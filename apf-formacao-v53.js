(() => {
  if (window.__GEARPC_APF_FORMACAO_V53__) return;
  window.__GEARPC_APF_FORMACAO_V53__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let configs = [];
  let assessoramentos = [];
  let chiefs = [];
  let currentApfId = null;

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function today() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function dateBR(value) {
    if (!value) return '—';
    const [y,m,d] = String(value).split('-').map(Number);
    if (!y || !m || !d) return value;
    return new Date(y,m-1,d,12).toLocaleDateString('pt-BR');
  }

  function chief(id) {
    return chiefs.find((c) => Number(c.id) === Number(id)) || null;
  }

  function cfg(id) {
    return configs.find((c) => Number(c.chefe_id) === Number(id)) || null;
  }

  function activeFor(apfId) {
    return assessoramentos.filter((a) => Number(a.apf_chefe_id) === Number(apfId) && a.status === 'ativo');
  }

  function formationLabel(a) {
    if (a.formacao === 'preliminar') return 'Preliminar';
    const level = a.formacao === 'avancado' ? 'Avançado' : 'Intermediário';
    const line = a.linha === 'dirigente' ? 'Dirigente' : 'Escotista';
    return `${level} ${line}`;
  }

  function levelLabel(value) {
    if (value === 'avancado') return 'Avançado';
    if (value === 'intermediario') return 'Intermediário';
    return 'Não possui';
  }

  function allowedFormationOptions(config) {
    const options = [];
    if (config?.preliminar_concluido) options.push({ value:'preliminar:', label:'Preliminar' });
    if (['intermediario','avancado'].includes(config?.nivel_escotista)) {
      options.push({ value:'intermediario:escotista', label:'Intermediário — Escotista' });
    }
    if (config?.nivel_escotista === 'avancado') {
      options.push({ value:'avancado:escotista', label:'Avançado — Escotista' });
    }
    if (['intermediario','avancado'].includes(config?.nivel_dirigente)) {
      options.push({ value:'intermediario:dirigente', label:'Intermediário — Dirigente' });
    }
    if (config?.nivel_dirigente === 'avancado') {
      options.push({ value:'avancado:dirigente', label:'Avançado — Dirigente' });
    }
    return options;
  }

  async function waitRuntime() {
    for (let i=0;i<120;i++) {
      const runtime = window.GEARPC_RUNTIME;
      if (runtime?.client && runtime?.state?.profile) return runtime;
      await sleep(250);
    }
    return null;
  }

  function injectStyles() {
    if ($('apfFormationStylesV53')) return;
    const style = document.createElement('style');
    style.id = 'apfFormationStylesV53';
    style.textContent = `
      .apf-training-v53{display:grid;gap:8px;margin-top:11px;padding:11px;border-radius:11px;background:#f4f8fc;border:1px solid #dce7f0;font-size:.82rem;color:#4e6377}
      .apf-training-v53 strong{color:#17324d}.apf-assignees-v53{margin-top:11px;padding-top:11px;border-top:1px solid #e0e7ed}.apf-assignees-v53 h4{margin:0 0 7px;color:#17324d;font-size:.86rem}.apf-assignees-v53 ul{margin:0;padding-left:18px;color:#586d80;font-size:.81rem;line-height:1.5}
      .apf-assignees-button-v53{margin-top:11px;width:100%;border:0;border-radius:10px;padding:10px 12px;background:#0a376c;color:#fff;font-weight:800;cursor:pointer}.apf-assignees-button-v53:disabled{background:#9aa8b5;cursor:not-allowed}
      .apf-capacity-v53{font-weight:900}.apf-capacity-v53.full{color:#9b2c2c}.apf-capacity-v53.open{color:#177245}
      .apf-level-grid-v53{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid #e3e9ef}.apf-level-grid-v53 label{display:grid;gap:5px;font-size:.76rem;font-weight:800;color:#52687b}.apf-level-grid-v53 select{width:100%;box-sizing:border-box;border:1px solid #ccd7e0;border-radius:9px;padding:9px;font:inherit;background:#fff}.apf-preliminar-v53{display:flex!important;grid-template-columns:none!important;align-items:center;gap:8px}.apf-preliminar-v53 input{width:18px!important;height:18px!important;accent-color:#0a376c}
      .apf-assess-dialog-v53{border:0;border-radius:18px;padding:0;width:min(94vw,650px);max-height:90vh;box-shadow:0 22px 60px rgba(0,0,0,.3)}.apf-assess-dialog-v53::backdrop{background:rgba(4,20,38,.64)}.apf-assess-body-v53{padding:20px}.apf-assess-body-v53 h2{margin:3px 0 4px;color:#0a376c}.apf-assess-sub-v53{margin:0 0 15px;color:#64788a}.apf-assess-summary-v53{display:flex;justify-content:space-between;gap:10px;align-items:center;background:#f4f8fc;border-radius:11px;padding:10px 12px;margin-bottom:14px}.apf-assess-summary-v53 strong{color:#17324d}.apf-assess-form-v53{display:grid;gap:10px;padding:13px;border:1px solid #dce5ed;border-radius:13px;background:#fff}.apf-assess-form-v53 label{display:grid;gap:5px;font-size:.8rem;font-weight:800;color:#4f6579}.apf-assess-form-v53 select,.apf-assess-form-v53 input,.apf-assess-form-v53 textarea{width:100%;box-sizing:border-box;border:1px solid #cbd7e1;border-radius:9px;padding:10px;font:inherit;background:#fff}.apf-assess-grid-v53{display:grid;grid-template-columns:1fr 1fr;gap:9px}.apf-assess-add-v53{border:0;border-radius:10px;padding:10px 12px;background:#0a376c;color:#fff;font-weight:800;cursor:pointer}.apf-assess-add-v53:disabled{background:#9ba9b5;cursor:not-allowed}.apf-assess-list-v53{display:grid;gap:9px;margin-top:15px}.apf-assess-row-v53{border:1px solid #dce5ed;border-radius:12px;padding:11px;background:#fff}.apf-assess-row-v53 strong{color:#17324d}.apf-assess-meta-v53{font-size:.8rem;color:#627587;margin-top:4px}.apf-assess-row-actions-v53{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.apf-assess-row-actions-v53 button{border:0;border-radius:8px;padding:7px 9px;font-weight:800;cursor:pointer;font-size:.76rem}.apf-finish-v53{background:#e5f4e9;color:#176a37}.apf-end-v53{background:#edf0f3;color:#4f6171}.apf-delete-v53{background:#fdeceb;color:#a22520}.apf-assess-close-v53{width:100%;border:0;border-radius:10px;padding:10px 12px;margin-top:15px;background:#e9eef3;color:#17324d;font-weight:800;cursor:pointer}.apf-assess-message-v53{min-height:20px;font-size:.82rem;font-weight:700;margin:8px 0 0}.apf-history-title-v53{margin:15px 0 5px;font-size:.85rem;color:#53687b}
      @media(max-width:560px){.apf-level-grid-v53,.apf-assess-grid-v53{grid-template-columns:1fr}.apf-assess-body-v53{padding:16px}}
    `;
    document.head.appendChild(style);
  }

  async function loadAll() {
    const [cfgRes, assRes, chiefsRes] = await Promise.all([
      rt.client.from('apfs_disponiveis').select('id,chefe_id,disponivel,observacoes,preliminar_concluido,nivel_escotista,nivel_dirigente').order('chefe_id'),
      rt.client.from('apf_assessoramentos').select('id,apf_chefe_id,assessorado_chefe_id,formacao,linha,data_inicio,status,data_fim,observacoes,criado_em').order('criado_em', { ascending:false }),
      rt.client.from('chefes').select('id,nome_completo,ativo').eq('ativo',true).order('nome_completo')
    ]);
    if (cfgRes.error) throw cfgRes.error;
    if (assRes.error) throw assRes.error;
    if (chiefsRes.error) throw chiefsRes.error;
    configs = cfgRes.data || [];
    assessoramentos = assRes.data || [];
    chiefs = chiefsRes.data || [];
  }

  function findChiefByCard(card) {
    const name = card.querySelector('.apf-card-head-v52 strong')?.textContent?.trim();
    if (!name) return null;
    return chiefs.find((c) => c.nome_completo === name) || null;
  }

  function decorateCards() {
    if (rt?.state?.profile?.tipo !== 'administrador') return;
    document.querySelectorAll('#apfListV52 .apf-card-v52').forEach((card) => {
      const c = findChiefByCard(card);
      if (!c) return;
      const config = cfg(c.id);
      const active = activeFor(c.id);
      const badge = card.querySelector('.apf-badge-v52');
      if (badge) {
        badge.classList.toggle('full', active.length >= 4);
        badge.textContent = active.length >= 4 ? 'Lotado • 4/4' : `${active.length}/4 assessorados`;
      }

      let training = card.querySelector('.apf-training-v53');
      if (!training) {
        training = document.createElement('div');
        training.className = 'apf-training-v53';
        const meta = card.querySelector('.apf-meta-v52');
        meta?.insertAdjacentElement('afterend', training);
      }
      training.innerHTML = `
        <div><strong>Preliminar:</strong> ${config?.preliminar_concluido ? 'Concluído' : 'Não informado'}</div>
        <div><strong>Linha Escotista:</strong> ${levelLabel(config?.nivel_escotista)}</div>
        <div><strong>Linha Dirigente:</strong> ${levelLabel(config?.nivel_dirigente)}</div>
        <div class="apf-capacity-v53 ${active.length >= 4 ? 'full' : 'open'}">Capacidade: ${active.length} de 4 assessorados ativos</div>`;

      let assBlock = card.querySelector('.apf-assignees-v53');
      if (!assBlock) {
        assBlock = document.createElement('div');
        assBlock.className = 'apf-assignees-v53';
        card.appendChild(assBlock);
      }
      const names = active.map((a) => {
        const person = chief(a.assessorado_chefe_id);
        return person ? `<li>${esc(person.nome_completo)} — ${esc(formationLabel(a))}</li>` : '';
      }).filter(Boolean).join('');
      assBlock.innerHTML = `<h4>Assessorados atuais</h4>${names ? `<ul>${names}</ul>` : '<div style="font-size:.81rem;color:#718292">Nenhum assessorado ativo.</div>'}<button class="apf-assignees-button-v53" type="button">${active.length >= 4 ? '👥 Gerenciar assessorados (lotado)' : '＋ Registrar / gerenciar assessorados'}</button>`;
      assBlock.querySelector('button')?.addEventListener('click', () => openAssessments(c.id));
    });
  }

  function enhanceManager() {
    if (rt?.state?.profile?.tipo !== 'administrador') return;
    const dialog = $('apfManagerDialogV52');
    if (!dialog?.open) return;
    const intro = dialog.querySelector('.apf-dialog-body-v52 > p');
    if (intro) intro.textContent = 'Defina quem pode atuar como APF e registre o maior nível concluído em cada linha. O limite de assessorados é automático: 4 por APF.';

    dialog.querySelectorAll('.apf-manager-row-v52').forEach((row) => {
      if (row.querySelector('.apf-level-grid-v53')) return;
      const chiefId = Number(row.dataset.chiefId);
      const config = cfg(chiefId);
      const vagasLabel = row.querySelector('.apf-vagas-v52')?.closest('label');
      if (vagasLabel) vagasLabel.style.display = 'none';
      const grid = document.createElement('div');
      grid.className = 'apf-level-grid-v53';
      grid.innerHTML = `
        <label class="apf-preliminar-v53"><input class="apf-preliminar-check-v53" type="checkbox" ${config?.preliminar_concluido ? 'checked' : ''}/><span>Preliminar concluído</span></label>
        <label>Linha Escotista<select class="apf-escotista-level-v53"><option value="">Não possui</option><option value="intermediario" ${config?.nivel_escotista === 'intermediario' ? 'selected' : ''}>Intermediário</option><option value="avancado" ${config?.nivel_escotista === 'avancado' ? 'selected' : ''}>Avançado</option></select></label>
        <label>Linha Dirigente<select class="apf-dirigente-level-v53"><option value="">Não possui</option><option value="intermediario" ${config?.nivel_dirigente === 'intermediario' ? 'selected' : ''}>Intermediário</option><option value="avancado" ${config?.nivel_dirigente === 'avancado' ? 'selected' : ''}>Avançado</option></select></label>`;
      row.appendChild(grid);
      const autoPrelim = () => {
        const escLv = grid.querySelector('.apf-escotista-level-v53').value;
        const dirLv = grid.querySelector('.apf-dirigente-level-v53').value;
        if (escLv || dirLv) grid.querySelector('.apf-preliminar-check-v53').checked = true;
      };
      grid.querySelector('.apf-escotista-level-v53').addEventListener('change', autoPrelim);
      grid.querySelector('.apf-dirigente-level-v53').addEventListener('change', autoPrelim);
    });

    const oldSave = $('apfManagerSaveV52');
    if (oldSave && !oldSave.dataset.v53Patched) {
      const fresh = oldSave.cloneNode(true);
      fresh.dataset.v53Patched = 'true';
      oldSave.replaceWith(fresh);
      fresh.addEventListener('click', saveManagerV53);
    }
  }

  async function saveManagerV53() {
    const button = $('apfManagerSaveV52');
    const msg = $('apfManagerMessageV52');
    button.disabled = true;
    button.textContent = 'Salvando...';
    msg.textContent = '';
    try {
      const managerRows = [...document.querySelectorAll('.apf-manager-row-v52')];
      for (const row of managerRows) {
        const chefeId = Number(row.dataset.chiefId);
        const disponivel = row.querySelector('.apf-enabled-v52')?.checked === true;
        const observacoes = String(row.querySelector('.apf-obs-v52')?.value || '').trim() || null;
        const preliminar = row.querySelector('.apf-preliminar-check-v53')?.checked === true;
        const nivelEscotista = row.querySelector('.apf-escotista-level-v53')?.value || null;
        const nivelDirigente = row.querySelector('.apf-dirigente-level-v53')?.value || null;
        const payload = {
          chefe_id: chefeId,
          disponivel,
          vagas: 4,
          observacoes,
          preliminar_concluido: preliminar || Boolean(nivelEscotista || nivelDirigente),
          nivel_escotista: nivelEscotista,
          nivel_dirigente: nivelDirigente,
          atualizado_em: new Date().toISOString()
        };
        const { error } = await rt.client.from('apfs_disponiveis').upsert(payload, { onConflict:'chefe_id' });
        if (error) throw error;
      }
      msg.style.color = '#177245';
      msg.textContent = '✓ APFs e níveis de formação atualizados.';
      await loadAll();
      $('apfManagerDialogV52')?.close();
      const back = $('apfBackV52');
      const open = $('apfButtonV52');
      if (back && open) {
        back.click();
        setTimeout(() => open.click(), 80);
      }
    } catch (error) {
      msg.style.color = '#9b2c2c';
      msg.textContent = `Não foi possível salvar: ${error.message || error}`;
    } finally {
      button.disabled = false;
      button.textContent = 'Salvar';
    }
  }

  function ensureAssessDialog() {
    let dialog = $('apfAssessDialogV53');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'apfAssessDialogV53';
    dialog.className = 'apf-assess-dialog-v53';
    dialog.innerHTML = `
      <div class="apf-assess-body-v53">
        <div class="eyebrow dark">ASSESSORIA PESSOAL DE FORMAÇÃO</div>
        <h2 id="apfAssessTitleV53">Assessorados</h2>
        <p id="apfAssessSubtitleV53" class="apf-assess-sub-v53"></p>
        <div id="apfAssessSummaryV53" class="apf-assess-summary-v53"></div>
        <form id="apfAssessFormV53" class="apf-assess-form-v53">
          <label>Assessorado<select id="apfAssessPersonV53" required><option value="">Selecione o adulto</option></select></label>
          <div class="apf-assess-grid-v53">
            <label>Formação / linha<select id="apfAssessFormationV53" required></select></label>
            <label>Data de início<input id="apfAssessStartV53" type="date" required /></label>
          </div>
          <label>Observação<textarea id="apfAssessObsV53" rows="2" placeholder="Opcional"></textarea></label>
          <button id="apfAssessAddV53" class="apf-assess-add-v53" type="submit">＋ Registrar assessorado</button>
          <p id="apfAssessMessageV53" class="apf-assess-message-v53" role="status"></p>
        </form>
        <div id="apfAssessListV53" class="apf-assess-list-v53"></div>
        <button id="apfAssessCloseV53" class="apf-assess-close-v53" type="button">Fechar</button>
      </div>`;
    document.body.appendChild(dialog);
    $('apfAssessCloseV53').addEventListener('click', () => dialog.close());
    $('apfAssessFormV53').addEventListener('submit', addAssessment);
    return dialog;
  }

  async function openAssessments(apfId) {
    currentApfId = Number(apfId);
    await loadAll();
    const dialog = ensureAssessDialog();
    const person = chief(currentApfId);
    $('apfAssessTitleV53').textContent = person?.nome_completo || 'APF';
    $('apfAssessSubtitleV53').textContent = 'Selecione os nomes dos assessorados cadastrados no grupo. Não é necessário digitar os nomes.';
    $('apfAssessStartV53').value = today();
    $('apfAssessObsV53').value = '';
    renderAssessDialog();
    dialog.showModal();
  }

  function renderAssessDialog() {
    const config = cfg(currentApfId);
    const active = activeFor(currentApfId);
    const remaining = Math.max(0, 4 - active.length);
    $('apfAssessSummaryV53').innerHTML = `<strong>${active.length} de 4 assessorados ativos</strong><span>${remaining ? `${remaining} vaga${remaining === 1 ? '' : 's'} disponível${remaining === 1 ? '' : 'is'}` : 'Lotado'}</span>`;

    const peopleSelect = $('apfAssessPersonV53');
    peopleSelect.innerHTML = '<option value="">Selecione o adulto</option>' + chiefs
      .filter((c) => Number(c.id) !== Number(currentApfId))
      .map((c) => `<option value="${Number(c.id)}">${esc(c.nome_completo)}</option>`).join('');

    const formationSelect = $('apfAssessFormationV53');
    const options = allowedFormationOptions(config);
    formationSelect.innerHTML = options.length
      ? '<option value="">Selecione</option>' + options.map((o) => `<option value="${o.value}">${esc(o.label)}</option>`).join('')
      : '<option value="">Cadastre primeiro a formação deste APF</option>';

    const addButton = $('apfAssessAddV53');
    addButton.disabled = active.length >= 4 || !options.length;
    addButton.textContent = active.length >= 4 ? 'Limite de 4 assessorados atingido' : '＋ Registrar assessorado';

    const list = $('apfAssessListV53');
    const all = assessoramentos.filter((a) => Number(a.apf_chefe_id) === Number(currentApfId));
    const activeRows = all.filter((a) => a.status === 'ativo');
    const historicRows = all.filter((a) => a.status !== 'ativo');
    list.innerHTML = '';

    if (!activeRows.length) list.innerHTML = '<div style="font-size:.84rem;color:#718292">Nenhum assessoramento ativo.</div>';
    activeRows.forEach((a) => list.appendChild(assessmentRow(a, true)));
    if (historicRows.length) {
      const title = document.createElement('div');
      title.className = 'apf-history-title-v53';
      title.textContent = 'Histórico';
      list.appendChild(title);
      historicRows.forEach((a) => list.appendChild(assessmentRow(a, false)));
    }
  }

  function assessmentRow(a, active) {
    const person = chief(a.assessorado_chefe_id);
    const row = document.createElement('div');
    row.className = 'apf-assess-row-v53';
    row.innerHTML = `
      <strong>${esc(person?.nome_completo || 'Adulto')}</strong>
      <div class="apf-assess-meta-v53">${esc(formationLabel(a))} • início ${esc(dateBR(a.data_inicio))}${a.data_fim ? ` • fim ${esc(dateBR(a.data_fim))}` : ''}${a.status !== 'ativo' ? ` • ${a.status === 'concluido' ? 'Concluído' : 'Encerrado'}` : ''}</div>
      ${a.observacoes ? `<div class="apf-assess-meta-v53">${esc(a.observacoes)}</div>` : ''}
      <div class="apf-assess-row-actions-v53">
        ${active ? `<button class="apf-finish-v53" type="button">✓ Concluir</button><button class="apf-end-v53" type="button">Encerrar</button>` : ''}
        <button class="apf-delete-v53" type="button">Apagar</button>
      </div>`;
    if (active) {
      row.querySelector('.apf-finish-v53').addEventListener('click', () => finishAssessment(a.id, 'concluido'));
      row.querySelector('.apf-end-v53').addEventListener('click', () => finishAssessment(a.id, 'encerrado'));
    }
    row.querySelector('.apf-delete-v53').addEventListener('click', () => deleteAssessment(a.id, person?.nome_completo || 'este assessorado'));
    return row;
  }

  async function addAssessment(event) {
    event.preventDefault();
    const msg = $('apfAssessMessageV53');
    msg.style.color = '#9b2c2c';
    msg.textContent = '';
    const assessoradoId = Number($('apfAssessPersonV53').value || 0);
    const pair = String($('apfAssessFormationV53').value || '').split(':');
    const formacao = pair[0] || '';
    const linha = pair[1] || null;
    if (!assessoradoId || !formacao) {
      msg.textContent = 'Selecione o assessorado e a formação.';
      return;
    }
    const payload = {
      apf_chefe_id: currentApfId,
      assessorado_chefe_id: assessoradoId,
      formacao,
      linha: linha || null,
      data_inicio: $('apfAssessStartV53').value || today(),
      status: 'ativo',
      observacoes: String($('apfAssessObsV53').value || '').trim() || null
    };
    const button = $('apfAssessAddV53');
    button.disabled = true;
    button.textContent = 'Salvando...';
    const { error } = await rt.client.from('apf_assessoramentos').insert(payload);
    if (error) {
      msg.textContent = error.message || 'Não foi possível registrar o assessorado.';
      button.disabled = false;
      button.textContent = '＋ Registrar assessorado';
      return;
    }
    msg.style.color = '#177245';
    msg.textContent = '✓ Assessorado registrado.';
    $('apfAssessPersonV53').value = '';
    $('apfAssessFormationV53').value = '';
    $('apfAssessObsV53').value = '';
    await loadAll();
    renderAssessDialog();
    decorateCards();
  }

  async function finishAssessment(id, status) {
    const label = status === 'concluido' ? 'concluir' : 'encerrar';
    if (!window.confirm(`Deseja ${label} este assessoramento? A vaga será liberada para outro adulto.`)) return;
    const { error } = await rt.client.from('apf_assessoramentos').update({ status, data_fim: today(), atualizado_em: new Date().toISOString() }).eq('id', id);
    if (error) {
      $('apfAssessMessageV53').textContent = `Não foi possível atualizar: ${error.message}`;
      return;
    }
    await loadAll();
    renderAssessDialog();
    decorateCards();
  }

  async function deleteAssessment(id, name) {
    if (!window.confirm(`Apagar o registro de assessoramento de ${name}? Esta ação remove o registro do sistema.`)) return;
    const { error } = await rt.client.from('apf_assessoramentos').delete().eq('id', id);
    if (error) {
      $('apfAssessMessageV53').textContent = `Não foi possível apagar: ${error.message}`;
      return;
    }
    await loadAll();
    renderAssessDialog();
    decorateCards();
  }

  function installObservers() {
    const bodyObserver = new MutationObserver(() => {
      if ($('apfManagerDialogV52')?.open) enhanceManager();
      if ($('apfViewV52') && !$('apfViewV52').classList.contains('hidden')) decorateCards();
    });
    bodyObserver.observe(document.body, { childList:true, subtree:true });

    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('#apfManageV52')) setTimeout(enhanceManager, 60);
      if (target?.closest('#apfButtonV52')) setTimeout(async () => {
        try { await loadAll(); decorateCards(); } catch (_) {}
      }, 350);
    });
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt || rt.state.profile?.tipo !== 'administrador') return;
    injectStyles();
    try { await loadAll(); } catch (error) { console.warn('GEArPC APF v53:', error); }
    installObservers();
    setTimeout(decorateCards, 500);
  }

  void boot();
})();
