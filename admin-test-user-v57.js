(() => {
  if (window.__GEARPC_ADMIN_TEST_USER_V57__) return;
  window.__GEARPC_ADMIN_TEST_USER_V57__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let sections = [];
  const statusByTarget = { chief: null, responsible: null };

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
      .replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  async function waitAdmin() {
    for (let i = 0; i < 100; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.profile) {
        return x.state.profile.tipo === 'administrador' ? x : null;
      }
      await sleep(200);
    }
    return null;
  }

  function injectStyles() {
    if ($('adminTestUserStylesV57')) return;
    const s = document.createElement('style');
    s.id = 'adminTestUserStylesV57';
    s.textContent = `
      .test-lab-v57{margin:14px 0 18px;background:#fff8dc;border:1px solid #e7c96a;border-radius:16px;padding:15px;box-shadow:0 5px 18px rgba(10,55,108,.06)}
      .test-lab-head-v57{display:flex;gap:10px;align-items:flex-start;justify-content:space-between}.test-lab-head-v57 h3{margin:0;color:#725309}.test-lab-head-v57 p{margin:5px 0 0;color:#665927;line-height:1.4;font-size:.88rem}
      .test-badge-v57{white-space:nowrap;background:#725309;color:#fff;border-radius:999px;padding:5px 9px;font-size:.72rem;font-weight:900}
      .test-scenarios-v57{display:grid;gap:12px;margin-top:14px}.test-scenario-v57{background:#fff;border:1px solid #e2d5a5;border-radius:14px;padding:13px}
      .test-scenario-v57 h4{margin:0;color:#17324d;font-size:1rem}.test-scenario-v57>p{margin:4px 0 0;color:#607086;font-size:.8rem;line-height:1.4}
      .test-grid-v57{display:grid;grid-template-columns:1.2fr 1fr;gap:9px;margin-top:12px}.test-grid-v57 label{display:grid;gap:5px;font-size:.76rem;font-weight:800;color:#4e6072}.test-grid-v57 select{width:100%;box-sizing:border-box;border:1px solid #c8d3dd;border-radius:9px;padding:9px;background:#fff;font:inherit}
      .test-checks-v57{grid-column:1/-1;display:grid;gap:7px;padding:9px;border:1px solid #e0e6ec;border-radius:10px;background:#f8fafc}.test-checks-v57>strong{font-size:.76rem;color:#4d6175}
      .test-check-v57{display:flex!important;grid-template-columns:none!important;flex-direction:row!important;align-items:flex-start;gap:8px!important;font-size:.78rem!important;font-weight:750!important}.test-check-v57 input{width:18px;height:18px;accent-color:#0a376c;flex:0 0 auto}
      .test-status-v57{margin-top:11px;padding:10px 11px;border-radius:10px;background:#f6f8fa;color:#53697c;font-size:.8rem;line-height:1.45}.test-status-v57 strong{color:#17324d}
      .test-actions-v57{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.test-actions-v57 button{border:0;border-radius:10px;padding:9px 11px;font-weight:800;cursor:pointer}.test-save-v57{background:#0a376c;color:#fff}.test-pass-v57{background:#e8edf3;color:#17324d}.test-actions-v57 button:disabled{opacity:.6;cursor:wait}
      .test-msg-v57{min-height:18px;margin:8px 0 0;font-size:.8rem;font-weight:700;color:#177245}
      .test-overlay-v57{position:fixed;inset:0;z-index:2147483647;background:rgba(4,20,38,.7);display:grid;place-items:center;padding:18px;overflow:auto}.test-card-v57{width:min(100%,480px);box-sizing:border-box;background:#fff;border-radius:18px;padding:21px;box-shadow:0 22px 60px rgba(0,0,0,.3);color:#17324d}.test-card-v57 h2{margin:3px 0 8px;color:#0a376c}.test-cred-v57{display:grid;gap:8px;margin:14px 0}.test-cred-v57 label{display:grid;gap:4px;font-size:.76rem;font-weight:800;color:#607487}.test-cred-v57 input{width:100%;box-sizing:border-box;border:1px solid #c2ced9;border-radius:9px;padding:10px;font:700 .92rem ui-monospace,SFMono-Regular,Menlo,monospace}
      .test-card-actions-v57{display:grid;gap:8px}.test-card-actions-v57 button{border:0;border-radius:10px;padding:10px 12px;font-weight:800;cursor:pointer}.test-copy-v57{background:#0a376c;color:#fff}.test-close-v57{background:#e9eef3;color:#17324d}.test-note-v57{padding:10px;border-radius:10px;background:#fff7df;border:1px solid #efd99a;color:#6e5510;font-size:.82rem;line-height:1.4}
      @media(max-width:560px){.test-grid-v57{grid-template-columns:1fr}.test-checks-v57{grid-column:auto}.test-actions-v57 button{width:100%}.test-lab-head-v57{flex-direction:column}.test-badge-v57{align-self:flex-start}}
    `;
    document.head.appendChild(s);
  }

  async function invoke(target, body) {
    const { data, error } = await rt.client.functions.invoke('admin-test-user', { body: { target, ...body } });
    if (error) {
      try {
        const response = error.context;
        const parsed = response && typeof response.clone === 'function' ? await response.clone().json() : null;
        if (parsed?.error) throw new Error(parsed.error);
      } catch (nested) {
        if (nested?.message) throw nested;
      }
      throw new Error(error.message || 'Falha ao acessar o cenário de teste.');
    }
    if (!data?.ok) throw new Error(data?.error || 'Falha ao acessar o cenário de teste.');
    return data;
  }

  function panelHost() {
    const view = $('accessView');
    if (!view) return null;
    return {
      view,
      hero: view.querySelector('.members-hero'),
      toolbar: view.querySelector('.members-toolbar')
    };
  }

  function youthChecks(prefix) {
    return `
      <div class="test-checks-v57">
        <strong>Jovens fictícios vinculados</strong>
        <label class="test-check-v57"><input id="${prefix}ChildLobinhoV57" type="checkbox" value="lobinho"><span>JOVEM TESTE LOBINHO — Rastro de Fogo</span></label>
        <label class="test-check-v57"><input id="${prefix}ChildSeniorV57" type="checkbox" value="senior"><span>JOVEM TESTE SÊNIOR — Loreto</span></label>
      </div>`;
  }

  function ensurePanel() {
    let panel = $('adminTestLabV57');
    if (panel) return panel;
    const host = panelHost();
    if (!host) return null;

    panel = document.createElement('section');
    panel.id = 'adminTestLabV57';
    panel.className = 'test-lab-v57';
    panel.innerHTML = `
      <div class="test-lab-head-v57">
        <div><h3>🧪 Cenários de teste</h3><p>Contas fictícias isoladas para validar permissões sem misturar dados de famílias reais.</p></div>
        <span class="test-badge-v57">SÓ ADMIN</span>
      </div>

      <div class="test-scenarios-v57">
        <section class="test-scenario-v57">
          <h4>Chefe de Teste</h4>
          <p>Pode ser testado sem filhos ou também como responsável, mantendo as permissões da chefia.</p>
          <div class="test-grid-v57">
            <label>Seção da chefia<select id="chiefTestSectionV57"></select></label>
            <label>Função<select id="chiefTestRoleV57"><option value="Assistente">Assistente</option><option value="Chefe de Seção">Chefe de Seção</option><option value="Apoio">Apoio</option></select></label>
            <label class="test-check-v57"><input id="chiefTestGeneralV57" type="checkbox"><span>Também simular dirigente com acesso geral de consulta</span></label>
            ${youthChecks('chiefTest')}
          </div>
          <div id="chiefTestStatusV57" class="test-status-v57">Carregando cenário…</div>
          <div class="test-actions-v57">
            <button id="chiefTestSaveV57" class="test-save-v57" type="button">Salvar cenário do chefe</button>
            <button id="chiefTestPasswordV57" class="test-pass-v57" type="button">🔑 Criar / redefinir acesso</button>
          </div>
          <p id="chiefTestMessageV57" class="test-msg-v57" role="status"></p>
        </section>

        <section class="test-scenario-v57">
          <h4>Responsável de Teste</h4>
          <p>Conta sem função de chefia. Pode ter um ou dois filhos fictícios, inclusive em ramos diferentes.</p>
          <div class="test-grid-v57">
            ${youthChecks('responsibleTest')}
          </div>
          <div id="responsibleTestStatusV57" class="test-status-v57">Carregando cenário…</div>
          <div class="test-actions-v57">
            <button id="responsibleTestSaveV57" class="test-save-v57" type="button">Salvar cenário do responsável</button>
            <button id="responsibleTestPasswordV57" class="test-pass-v57" type="button">🔑 Criar / redefinir acesso</button>
          </div>
          <p id="responsibleTestMessageV57" class="test-msg-v57" role="status"></p>
        </section>
      </div>`;

    if (host.toolbar) host.toolbar.insertAdjacentElement('beforebegin', panel);
    else if (host.hero) host.hero.insertAdjacentElement('afterend', panel);
    else host.view.prepend(panel);

    $('chiefTestSaveV57')?.addEventListener('click', saveChiefScenario);
    $('chiefTestPasswordV57')?.addEventListener('click', () => resetAccess('chief'));
    $('responsibleTestSaveV57')?.addEventListener('click', saveResponsibleScenario);
    $('responsibleTestPasswordV57')?.addEventListener('click', () => resetAccess('responsible'));
    return panel;
  }

  function fillSections() {
    const select = $('chiefTestSectionV57');
    if (!select) return;
    select.innerHTML = sections.map((s) => `<option value="${Number(s.id)}">${esc(s.nome)}</option>`).join('');
  }

  function checkedChildren(prefix) {
    const ids = [`${prefix}ChildLobinhoV57`, `${prefix}ChildSeniorV57`];
    return ids.map((id) => $(id)).filter((el) => el?.checked).map((el) => el.value);
  }

  function setCheckedChildren(prefix, keys) {
    const allowed = new Set(Array.isArray(keys) ? keys : []);
    const lob = $(`${prefix}ChildLobinhoV57`);
    const sen = $(`${prefix}ChildSeniorV57`);
    if (lob) lob.checked = allowed.has('lobinho');
    if (sen) sen.checked = allowed.has('senior');
  }

  function describeChildren(keys) {
    if (!Array.isArray(keys) || !keys.length) return 'sem filhos';
    const labels = [];
    if (keys.includes('lobinho')) labels.push('Lobinho');
    if (keys.includes('senior')) labels.push('Sênior');
    return labels.join(' + ');
  }

  function renderChiefStatus(data) {
    statusByTarget.chief = data;
    const box = $('chiefTestStatusV57');
    if (!box) return;
    const account = data?.exists ? 'Conta pronta para login' : 'Conta de login ainda não criada';
    const role = data?.secao_nome ? `${data.secao_nome} • ${data.funcao || 'Assistente'}` : 'Seção ainda não configurada';
    const family = describeChildren(data?.child_keys);
    box.innerHTML = `<strong>${esc(account)}</strong><br>${esc(role)}${data?.acesso_geral_consulta ? ' • também dirigente' : ''}<br>Família: ${esc(family)}<br><span>${esc(data?.email || 'chefe.teste@gearpc.test')}</span>`;
    if (data?.secao_id && $('chiefTestSectionV57')) $('chiefTestSectionV57').value = String(data.secao_id);
    if (data?.funcao && $('chiefTestRoleV57')) $('chiefTestRoleV57').value = data.funcao;
    if ($('chiefTestGeneralV57')) $('chiefTestGeneralV57').checked = Boolean(data?.acesso_geral_consulta);
    setCheckedChildren('chiefTest', data?.child_keys || []);
  }

  function renderResponsibleStatus(data) {
    statusByTarget.responsible = data;
    const box = $('responsibleTestStatusV57');
    if (!box) return;
    const account = data?.exists ? 'Conta pronta para login' : 'Conta de login ainda não criada';
    box.innerHTML = `<strong>${esc(account)}</strong><br>Filhos: ${esc(describeChildren(data?.child_keys))}<br><span>${esc(data?.email || 'responsavel.teste@gearpc.test')}</span>`;
    setCheckedChildren('responsibleTest', data?.child_keys || []);
  }

  async function loadStatuses() {
    const [chiefResult, responsibleResult] = await Promise.allSettled([
      invoke('chief', { action: 'status' }),
      invoke('responsible', { action: 'status' })
    ]);

    if (chiefResult.status === 'fulfilled') renderChiefStatus(chiefResult.value);
    else if ($('chiefTestMessageV57')) $('chiefTestMessageV57').textContent = `Não foi possível consultar: ${chiefResult.reason?.message || chiefResult.reason}`;

    if (responsibleResult.status === 'fulfilled') renderResponsibleStatus(responsibleResult.value);
    else if ($('responsibleTestMessageV57')) $('responsibleTestMessageV57').textContent = `Não foi possível consultar: ${responsibleResult.reason?.message || responsibleResult.reason}`;
  }

  async function saveChiefScenario() {
    const button = $('chiefTestSaveV57');
    const msg = $('chiefTestMessageV57');
    const sectionId = Number($('chiefTestSectionV57')?.value || 0);
    if (!sectionId) return;
    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'Salvando…';
    if (msg) msg.textContent = '';
    try {
      const data = await invoke('chief', {
        action: 'configure',
        secao_id: sectionId,
        funcao: $('chiefTestRoleV57')?.value || 'Assistente',
        acesso_geral_consulta: Boolean($('chiefTestGeneralV57')?.checked),
        child_keys: checkedChildren('chiefTest')
      });
      renderChiefStatus(data);
      if (msg) msg.textContent = '✓ Cenário do Chefe de Teste atualizado.';
      if (data.temporaryPassword) showCredentials('chief', data);
    } catch (error) {
      if (msg) msg.textContent = `Não foi possível salvar: ${error.message || error}`;
    } finally {
      button.disabled = false;
      button.textContent = old;
    }
  }

  async function saveResponsibleScenario() {
    const button = $('responsibleTestSaveV57');
    const msg = $('responsibleTestMessageV57');
    const children = checkedChildren('responsibleTest');
    if (!children.length) {
      if (msg) msg.textContent = 'Selecione pelo menos um jovem fictício.';
      return;
    }
    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'Salvando…';
    if (msg) msg.textContent = '';
    try {
      const data = await invoke('responsible', { action: 'configure', child_keys: children });
      renderResponsibleStatus(data);
      if (msg) msg.textContent = '✓ Cenário do Responsável de Teste atualizado.';
      if (data.temporaryPassword) showCredentials('responsible', data);
    } catch (error) {
      if (msg) msg.textContent = `Não foi possível salvar: ${error.message || error}`;
    } finally {
      button.disabled = false;
      button.textContent = old;
    }
  }

  async function resetAccess(target) {
    const isChief = target === 'chief';
    const button = $(isChief ? 'chiefTestPasswordV57' : 'responsibleTestPasswordV57');
    const msg = $(isChief ? 'chiefTestMessageV57' : 'responsibleTestMessageV57');
    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'Gerando…';
    if (msg) msg.textContent = '';
    try {
      const data = await invoke(target, { action: 'reset_password' });
      if (isChief) renderChiefStatus(data); else renderResponsibleStatus(data);
      showCredentials(target, data);
      if (msg) msg.textContent = '✓ Acesso de teste preparado.';
    } catch (error) {
      if (msg) msg.textContent = `Não foi possível gerar o acesso: ${error.message || error}`;
    } finally {
      button.disabled = false;
      button.textContent = old;
    }
  }

  function showCredentials(target, data) {
    $('testUserOverlayV57')?.remove();
    if (!data?.temporaryPassword) return;
    const label = target === 'chief' ? 'Chefe de Teste' : 'Responsável de Teste';
    const overlay = document.createElement('div');
    overlay.id = 'testUserOverlayV57';
    overlay.className = 'test-overlay-v57';
    overlay.innerHTML = `
      <section class="test-card-v57" role="dialog" aria-modal="true">
        <div style="font-size:2rem">🧪</div>
        <h2>Acesso do ${esc(label)}</h2>
        <p>Use estas credenciais para sair da conta administrativa e entrar no cenário fictício.</p>
        <div class="test-cred-v57">
          <label>E-mail<input id="testUserEmailV57" readonly value="${esc(data.email || '')}"></label>
          <label>Senha<input id="testUserPasswordValueV57" readonly value="${esc(data.temporaryPassword)}"></label>
        </div>
        <p class="test-note-v57"><strong>Ambiente de teste:</strong> os jovens e responsáveis fictícios ficam isolados das listas e relatórios normais.</p>
        <div class="test-card-actions-v57">
          <button id="testUserCopyV57" class="test-copy-v57" type="button">Copiar e-mail e senha</button>
          <button id="testUserCloseV57" class="test-close-v57" type="button">Fechar</button>
        </div>
        <p id="testUserCopyMsgV57" class="test-msg-v57"></p>
      </section>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const close = () => {
      document.body.style.overflow = '';
      overlay.remove();
    };
    $('testUserCloseV57')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    $('testUserCopyV57')?.addEventListener('click', async () => {
      const value = `E-mail: ${data.email}\nSenha: ${data.temporaryPassword}`;
      const msg = $('testUserCopyMsgV57');
      try {
        await navigator.clipboard.writeText(value);
        if (msg) msg.textContent = '✓ Credenciais copiadas.';
      } catch (_) {
        if (msg) msg.textContent = 'Copie manualmente os campos acima.';
      }
    });
  }

  async function prepare() {
    ensurePanel();
    if (!sections.length) {
      const { data, error } = await rt.client.from('secoes').select('id,nome,ativo').eq('ativo', true).order('id');
      if (!error) sections = data || [];
      fillSections();
    }
    await loadStatuses();
  }

  async function boot() {
    rt = await waitAdmin();
    if (!rt) return;
    injectStyles();
    $('accessButton')?.addEventListener('click', () => setTimeout(prepare, 300));
    const view = $('accessView');
    if (view) {
      const observer = new MutationObserver(() => {
        if (!view.classList.contains('hidden')) setTimeout(prepare, 100);
      });
      observer.observe(view, { attributes: true, attributeFilter: ['class'] });
    }
    if (view && !view.classList.contains('hidden')) await prepare();
  }

  void boot();
})();