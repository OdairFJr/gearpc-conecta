(() => {
  if (window.__GEARPC_ADMIN_PASSWORD_V51__) return;
  window.__GEARPC_ADMIN_PASSWORD_V51__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let runtime = null;
  let observer = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  async function waitForAdminRuntime() {
    for (let i = 0; i < 80; i += 1) {
      const rt = window.GEARPC_RUNTIME;
      if (rt?.client && rt?.state?.profile) {
        if (rt.state.profile.tipo !== 'administrador') return null;
        return rt;
      }
      await sleep(250);
    }
    return null;
  }

  function injectStyles() {
    if ($('adminPasswordStylesV51')) return;
    const style = document.createElement('style');
    style.id = 'adminPasswordStylesV51';
    style.textContent = `
      .admin-password-actions-v51{display:flex;justify-content:flex-end;margin-top:12px;padding-top:12px;border-top:1px solid #e3e9ef}
      .admin-password-button-v51{border:0;border-radius:10px;padding:9px 12px;background:#0a376c;color:#fff;font-weight:800;cursor:pointer;font:inherit;font-size:.84rem}
      .admin-password-button-v51:disabled{opacity:.6;cursor:wait}
      .admin-password-overlay-v51{position:fixed;inset:0;z-index:2147483647;background:rgba(4,20,38,.68);display:grid;place-items:center;padding:18px;overflow:auto}
      .admin-password-card-v51{width:min(100%,460px);box-sizing:border-box;background:#fff;border-radius:18px;padding:22px;box-shadow:0 22px 60px rgba(0,0,0,.28);color:#17324d;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
      .admin-password-card-v51 h2{margin:2px 0 8px;color:#0a376c;font-size:1.35rem}.admin-password-card-v51 p{line-height:1.45;color:#5c7184}
      .admin-password-person-v51{background:#f3f7fa;border-radius:11px;padding:11px 12px;margin:14px 0;font-size:.88rem}.admin-password-person-v51 span{color:#65798b}
      .admin-password-value-v51{display:grid;grid-template-columns:1fr auto;gap:8px;margin:14px 0}.admin-password-value-v51 input{min-width:0;border:1px solid #bdcbd7;border-radius:10px;padding:11px 12px;font:700 1rem ui-monospace,SFMono-Regular,Menlo,monospace;color:#17324d;background:#fff}
      .admin-password-copy-v51,.admin-password-close-v51{border:0;border-radius:10px;padding:10px 13px;font-weight:800;cursor:pointer}.admin-password-copy-v51{background:#0a376c;color:#fff}.admin-password-close-v51{background:#e9eef5;color:#0a376c;width:100%;margin-top:8px}
      .admin-password-note-v51{font-size:.82rem;background:#fff7df;border:1px solid #efd99a;border-radius:10px;padding:10px 11px;color:#6f5510!important}.admin-password-message-v51{min-height:20px;font-size:.84rem;font-weight:700;color:#177245!important;margin:8px 0 0!important}
      @media(max-width:480px){.admin-password-value-v51{grid-template-columns:1fr}.admin-password-copy-v51{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function adultRowForEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    const rows = runtime?.state?.accessRows || [];
    const row = rows.find((item) => String(item?.email || '').trim().toLowerCase() === normalized);
    if (!row) return null;
    return row.tipo === 'chefia' || row.tipo === 'administrador' ? row : null;
  }

  function decorateCards() {
    if (!runtime || runtime.state.profile?.tipo !== 'administrador') return;
    const list = $('accessList');
    if (!list) return;
    list.querySelectorAll('.access-card').forEach((card) => {
      if (card.querySelector('.admin-password-actions-v51')) return;
      const email = card.querySelector('.access-card-head > div > span')?.textContent?.trim() || '';
      const row = adultRowForEmail(email);
      if (!row) return;
      if (String(runtime.state.user?.email || '').trim().toLowerCase() === email.toLowerCase()) return;

      const wrap = document.createElement('div');
      wrap.className = 'admin-password-actions-v51';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'admin-password-button-v51';
      button.dataset.email = email;
      button.dataset.name = row.nome_completo || email;
      button.textContent = row.ultimo_login_em ? '🔑 Redefinir senha provisória' : '🔑 Gerar senha provisória';
      button.addEventListener('click', () => resetTemporaryPassword(button, row));
      wrap.appendChild(button);
      card.appendChild(wrap);
    });
  }

  async function functionErrorMessage(error) {
    try {
      const response = error?.context;
      if (response && typeof response.clone === 'function') {
        const body = await response.clone().json();
        if (body?.error) return String(body.error);
      }
    } catch (_) {}
    return error?.message || 'Não foi possível gerar a senha provisória.';
  }

  async function resetTemporaryPassword(button, row) {
    const email = button.dataset.email || row.email || '';
    const name = button.dataset.name || row.nome_completo || email;
    const alreadyEntered = Boolean(row.ultimo_login_em);
    const question = alreadyEntered
      ? `Redefinir a senha de ${name}?\n\nA senha atual deixará de funcionar e, no próximo login, essa pessoa será obrigada a criar uma nova senha pessoal.`
      : `Gerar uma senha provisória para ${name}?\n\nEla será usada somente no primeiro acesso e depois o app exigirá uma senha pessoal.`;
    if (!window.confirm(question)) return;

    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = 'Gerando...';
    const message = $('accessMessage');
    if (message) message.textContent = `Gerando senha provisória para ${name}...`;

    try {
      const { data, error } = await runtime.client.functions.invoke('admin-reset-temporary-password', {
        body: { email }
      });
      if (error) throw new Error(await functionErrorMessage(error));
      if (!data?.ok || !data?.temporaryPassword) throw new Error(data?.error || 'A função não retornou uma senha provisória.');
      showPassword(data);
      if (message) message.textContent = `Senha provisória gerada para ${data.nome || name}.`;
    } catch (error) {
      const text = error?.message || String(error);
      if (message) message.textContent = `Não foi possível gerar a senha: ${text}`;
      window.alert(`Não foi possível gerar a senha provisória.\n\n${text}`);
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  function showPassword(data) {
    $('adminPasswordOverlayV51')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'adminPasswordOverlayV51';
    overlay.className = 'admin-password-overlay-v51';
    overlay.innerHTML = `
      <section class="admin-password-card-v51" role="dialog" aria-modal="true" aria-labelledby="adminPasswordTitleV51">
        <div style="font-size:2rem">🔑</div>
        <h2 id="adminPasswordTitleV51">Senha provisória criada</h2>
        <p>Envie esta senha somente para a pessoa abaixo.</p>
        <div class="admin-password-person-v51"><strong>${escapeHtml(data.nome || 'Adulto')}</strong><br><span>${escapeHtml(data.email || '')}</span></div>
        <div class="admin-password-value-v51"><input id="adminPasswordValueV51" type="text" readonly value="${escapeHtml(data.temporaryPassword)}" aria-label="Senha provisória" /><button id="adminPasswordCopyV51" class="admin-password-copy-v51" type="button">Copiar</button></div>
        <p class="admin-password-note-v51"><strong>Importante:</strong> ao entrar com esta senha, o GEArPC Conecta solicitará imediatamente que a pessoa crie uma senha pessoal.</p>
        <p id="adminPasswordMessageV51" class="admin-password-message-v51" role="status"></p>
        <button id="adminPasswordCloseV51" class="admin-password-close-v51" type="button">Fechar</button>
      </section>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const input = $('adminPasswordValueV51');
    const msg = $('adminPasswordMessageV51');
    const close = () => {
      document.body.style.overflow = '';
      overlay.remove();
    };
    $('adminPasswordCloseV51')?.addEventListener('click', close);
    overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
    $('adminPasswordCopyV51')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(data.temporaryPassword);
        msg.textContent = '✓ Senha copiada.';
      } catch (_) {
        input.focus();
        input.select();
        try { document.execCommand('copy'); msg.textContent = '✓ Senha copiada.'; }
        catch (_) { msg.textContent = 'Selecione a senha e copie manualmente.'; }
      }
    });
    input?.focus();
    input?.select();
  }

  async function boot() {
    runtime = await waitForAdminRuntime();
    if (!runtime) return;
    injectStyles();

    const list = $('accessList');
    if (list) {
      observer = new MutationObserver(() => decorateCards());
      observer.observe(list, { childList: true, subtree: true });
    }
    $('accessButton')?.addEventListener('click', () => window.setTimeout(decorateCards, 400));
    $('accessRefreshButton')?.addEventListener('click', () => window.setTimeout(decorateCards, 500));
    $('accessSearch')?.addEventListener('input', () => window.setTimeout(decorateCards, 0));
    decorateCards();
  }

  void boot();
})();
