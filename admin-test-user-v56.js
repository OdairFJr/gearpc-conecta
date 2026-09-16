(() => {
  if (window.__GEARPC_ADMIN_TEST_USER_V56__) return;
  window.__GEARPC_ADMIN_TEST_USER_V56__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let sections = [];
  let currentStatus = null;

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

  function styles() {
    if ($('adminTestUserStylesV56')) return;
    const s = document.createElement('style');
    s.id = 'adminTestUserStylesV56';
    s.textContent = `
      .test-user-panel-v56{margin:14px 0 18px;background:#fff8dc;border:1px solid #e7c96a;border-radius:16px;padding:15px;box-shadow:0 5px 18px rgba(10,55,108,.06)}
      .test-user-head-v56{display:flex;gap:10px;align-items:flex-start;justify-content:space-between}.test-user-head-v56 h3{margin:0;color:#725309}.test-user-head-v56 p{margin:5px 0 0;color:#665927;line-height:1.4;font-size:.88rem}
      .test-user-badge-v56{white-space:nowrap;background:#725309;color:#fff;border-radius:999px;padding:5px 9px;font-size:.72rem;font-weight:900}
      .test-user-grid-v56{display:grid;grid-template-columns:1.3fr 1fr;gap:9px;margin-top:13px}.test-user-grid-v56 label{display:grid;gap:5px;font-size:.78rem;font-weight:800;color:#4e6072}.test-user-grid-v56 select{width:100%;box-sizing:border-box;border:1px solid #c8d3dd;border-radius:9px;padding:9px;background:#fff;font:inherit}
      .test-user-check-v56{grid-column:1/-1;display:flex!important;align-items:center;gap:8px!important}.test-user-check-v56 input{width:18px;height:18px;accent-color:#0a376c}
      .test-user-status-v56{margin-top:12px;padding:10px 11px;border-radius:10px;background:#f6f8fa;color:#53697c;font-size:.82rem;line-height:1.45}.test-user-status-v56 strong{color:#17324d}
      .test-user-actions-v56{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.test-user-actions-v56 button{border:0;border-radius:10px;padding:9px 11px;font-weight:800;cursor:pointer}.test-user-save-v56{background:#0a376c;color:#fff}.test-user-pass-v56{background:#e8edf3;color:#17324d}.test-user-actions-v56 button:disabled{opacity:.6;cursor:wait}
      .test-user-message-v56{min-height:20px;margin:9px 0 0;font-size:.82rem;font-weight:700;color:#177245}
      .test-user-overlay-v56{position:fixed;inset:0;z-index:2147483647;background:rgba(4,20,38,.7);display:grid;place-items:center;padding:18px;overflow:auto}.test-user-card-v56{width:min(100%,480px);box-sizing:border-box;background:#fff;border-radius:18px;padding:21px;box-shadow:0 22px 60px rgba(0,0,0,.3);color:#17324d}.test-user-card-v56 h2{margin:3px 0 8px;color:#0a376c}.test-user-cred-v56{display:grid;gap:8px;margin:14px 0}.test-user-cred-v56 label{display:grid;gap:4px;font-size:.76rem;font-weight:800;color:#607487}.test-user-cred-v56 input{width:100%;box-sizing:border-box;border:1px solid #c2ced9;border-radius:9px;padding:10px;font:700 .92rem ui-monospace,SFMono-Regular,Menlo,monospace}.test-user-card-actions-v56{display:grid;gap:8px}.test-user-card-actions-v56 button{border:0;border-radius:10px;padding:10px 12px;font-weight:800;cursor:pointer}.test-user-copy-v56{background:#0a376c;color:#fff}.test-user-close-v56{background:#e9eef3;color:#17324d}.test-user-note-v56{padding:10px;border-radius:10px;background:#fff7df;border:1px solid #efd99a;color:#6e5510;font-size:.82rem;line-height:1.4}
      @media(max-width:560px){.test-user-grid-v56{grid-template-columns:1fr}.test-user-check-v56{grid-column:auto}.test-user-actions-v56 button{width:100%}.test-user-head-v56{flex-direction:column}.test-user-badge-v56{align-self:flex-start}}
    `;
    document.head.appendChild(s);
  }

  async function invoke(body) {
    const { data, error } = await rt.client.functions.invoke('admin-test-user', { body });
    if (error) {
      try {
        const response = error.context;
        const parsed = response && typeof response.clone === 'function' ? await response.clone().json() : null;
        if (parsed?.error) throw new Error(parsed.error);
      } catch (nested) {
        if (nested?.message) throw nested;
      }
      throw new Error(error.message || 'Falha ao acessar o usuário de teste.');
    }
    if (!data?.ok) throw new Error(data?.error || 'Falha ao acessar o usuário de teste.');
    return data;
  }

  function panelHost() {
    const view = $('accessView');
    if (!view) return null;
    const hero = view.querySelector('.members-hero');
    const toolbar = view.querySelector('.members-toolbar');
    return { view, hero, toolbar };
  }

  function ensurePanel() {
    let panel = $('adminTestUserPanelV56');
    if (panel) return panel;
    const host = panelHost();
    if (!host) return null;
    panel = document.createElement('section');
    panel.id = 'adminTestUserPanelV56';
    panel.className = 'test-user-panel-v56';
    panel.innerHTML = `
      <div class="test-user-head-v56"><div><h3>🧪 Chefe de Teste</h3><p>Conta fictícia interna para reproduzir o acesso de chefes sem aparecer nas listas normais do grupo.</p></div><span class="test-user-badge-v56">SÓ ADMIN</span></div>
      <div class="test-user-grid-v56">
        <label>Seção do teste<select id="testUserSectionV56"></select></label>
        <label>Função na seção<select id="testUserRoleV56"><option value="Assistente">Assistente</option><option value="Chefe de Seção">Chefe de Seção</option><option value="Apoio">Apoio</option></select></label>
        <label class="test-user-check-v56"><input id="testUserGeneralV56" type="checkbox" /><span>Também simular dirigente com acesso geral de consulta</span></label>
      </div>
      <div id="testUserStatusV56" class="test-user-status-v56">Carregando situação da conta de teste…</div>
      <div class="test-user-actions-v56"><button id="testUserSaveV56" class="test-user-save-v56" type="button">Salvar cenário de teste</button><button id="testUserPasswordV56" class="test-user-pass-v56" type="button">🔑 Criar / redefinir acesso</button></div>
      <p id="testUserMessageV56" class="test-user-message-v56" role="status"></p>`;
    if (host.toolbar) host.toolbar.insertAdjacentElement('beforebegin', panel);
    else if (host.hero) host.hero.insertAdjacentElement('afterend', panel);
    else host.view.prepend(panel);

    $('testUserSaveV56')?.addEventListener('click', saveScenario);
    $('testUserPasswordV56')?.addEventListener('click', resetAccess);
    return panel;
  }

  function fillSections() {
    const select = $('testUserSectionV56');
    if (!select) return;
    select.innerHTML = sections.map((s) => `<option value="${Number(s.id)}">${esc(s.nome)}</option>`).join('');
  }

  function renderStatus(data) {
    currentStatus = data;
    const box = $('testUserStatusV56');
    if (!box) return;
    const exists = Boolean(data?.exists);
    const scenario = data?.secao_nome
      ? `${data.secao_nome} • ${data.funcao || 'Assistente'}${data.acesso_geral_consulta ? ' • também dirigente' : ''}`
      : 'Nenhum cenário configurado ainda.';
    box.innerHTML = `<strong>${exists ? 'Conta pronta para login' : 'Conta de login ainda não criada'}</strong><br>${esc(scenario)}<br><span>${esc(data?.email || 'chefe.teste@gearpc.test')}</span>`;
    if (data?.secao_id && $('testUserSectionV56')) $('testUserSectionV56').value = String(data.secao_id);
    if (data?.funcao && $('testUserRoleV56')) $('testUserRoleV56').value = data.funcao;
    if ($('testUserGeneralV56')) $('testUserGeneralV56').checked = Boolean(data?.acesso_geral_consulta);
  }

  async function loadStatus() {
    const msg = $('testUserMessageV56');
    try {
      const data = await invoke({ action: 'status' });
      renderStatus(data);
      if (msg) msg.textContent = '';
    } catch (error) {
      if (msg) msg.textContent = `Não foi possível consultar a conta de teste: ${error.message || error}`;
    }
  }

  async function saveScenario() {
    const button = $('testUserSaveV56');
    const msg = $('testUserMessageV56');
    const sectionId = Number($('testUserSectionV56')?.value || 0);
    const role = $('testUserRoleV56')?.value || 'Assistente';
    const general = Boolean($('testUserGeneralV56')?.checked);
    if (!sectionId) return;
    button.disabled = true;
    const old = button.textContent;
    button.textContent = 'Salvando…';
    if (msg) msg.textContent = '';
    try {
      const data = await invoke({ action: 'configure', secao_id: sectionId, funcao: role, acesso_geral_consulta: general });
      renderStatus(data);
      if (msg) msg.textContent = '✓ Cenário de teste atualizado.';
      if (data.temporaryPassword) showCredentials(data);
    } catch (error) {
      if (msg) msg.textContent = `Não foi possível salvar: ${error.message || error}`;
    } finally {
      button.disabled = false;
      button.textContent = old;
    }
  }

  async function resetAccess() {
    const button = $('testUserPasswordV56');
    const msg = $('testUserMessageV56');
    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'Gerando…';
    if (msg) msg.textContent = '';
    try {
      const data = await invoke({ action: 'reset_password' });
      renderStatus(data);
      showCredentials(data);
      if (msg) msg.textContent = '✓ Acesso de teste preparado.';
    } catch (error) {
      if (msg) msg.textContent = `Não foi possível gerar o acesso: ${error.message || error}`;
    } finally {
      button.disabled = false;
      button.textContent = old;
    }
  }

  function showCredentials(data) {
    $('testUserOverlayV56')?.remove();
    if (!data?.temporaryPassword) return;
    const overlay = document.createElement('div');
    overlay.id = 'testUserOverlayV56';
    overlay.className = 'test-user-overlay-v56';
    overlay.innerHTML = `<section class="test-user-card-v56" role="dialog" aria-modal="true"><div style="font-size:2rem">🧪</div><h2>Acesso do Chefe de Teste</h2><p>Use estas credenciais para sair da sua conta administrativa e entrar como o usuário fictício.</p><div class="test-user-cred-v56"><label>E-mail<input id="testUserEmailV56" readonly value="${esc(data.email || '')}" /></label><label>Senha<input id="testUserPasswordValueV56" readonly value="${esc(data.temporaryPassword)}" /></label></div><p class="test-user-note-v56"><strong>Importante:</strong> esta senha não obriga troca. Você pode redefini-la novamente pelo painel sempre que quiser. A conta permanece escondida das listas normais.</p><div class="test-user-card-actions-v56"><button id="testUserCopyV56" class="test-user-copy-v56" type="button">Copiar e-mail e senha</button><button id="testUserCloseV56" class="test-user-close-v56" type="button">Fechar</button></div><p id="testUserCopyMsgV56" class="test-user-message-v56"></p></section>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    const close = () => { document.body.style.overflow = ''; overlay.remove(); };
    $('testUserCloseV56')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    $('testUserCopyV56')?.addEventListener('click', async () => {
      const text = `E-mail: ${data.email}\nSenha: ${data.temporaryPassword}`;
      const msg = $('testUserCopyMsgV56');
      try { await navigator.clipboard.writeText(text); if (msg) msg.textContent = '✓ Credenciais copiadas.'; }
      catch (_) { if (msg) msg.textContent = 'Copie manualmente os campos acima.'; }
    });
  }

  async function prepare() {
    ensurePanel();
    const { data, error } = await rt.client.from('secoes').select('id,nome,ativo').eq('ativo', true).order('id');
    if (!error) sections = data || [];
    fillSections();
    await loadStatus();
  }

  async function boot() {
    rt = await waitAdmin();
    if (!rt) return;
    styles();
    $('accessButton')?.addEventListener('click', () => setTimeout(prepare, 350));
    const view = $('accessView');
    if (view) {
      const observer = new MutationObserver(() => {
        if (!view.classList.contains('hidden')) setTimeout(prepare, 120);
      });
      observer.observe(view, { attributes: true, attributeFilter: ['class'] });
    }
    if (view && !view.classList.contains('hidden')) await prepare();
  }

  void boot();
})();
