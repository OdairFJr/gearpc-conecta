(() => {
  if (window.__GEARPC_MANDATORY_PASSWORD_V26__) return;
  window.__GEARPC_MANDATORY_PASSWORD_V26__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function waitForRuntime() {
    for (let i = 0; i < 80; i += 1) {
      const rt = window.GEARPC_RUNTIME;
      if (rt?.client && rt?.state?.user?.id) return rt;
      await sleep(250);
    }
    return null;
  }

  function createOverlay(name, email) {
    if (document.getElementById('mandatoryPasswordOverlay')) return document.getElementById('mandatoryPasswordOverlay');
    const overlay = document.createElement('div');
    overlay.id = 'mandatoryPasswordOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#edf3f8;display:grid;place-items:center;padding:18px;overflow:auto;';
    overlay.innerHTML = `
      <section style="width:min(100%,440px);background:#fff;border-radius:18px;padding:22px;box-shadow:0 10px 32px #0002;color:#17324d;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="font-size:2rem;margin-bottom:8px">🔐</div>
        <h2 style="margin:0 0 8px;font-size:1.35rem">Crie sua senha pessoal</h2>
        <p style="margin:0 0 16px;color:#5c7184;line-height:1.45">Você entrou usando uma senha temporária. Antes de continuar, crie uma senha que só você conheça.</p>
        <div style="background:#f3f7fa;border-radius:10px;padding:10px 12px;margin-bottom:16px;font-size:.86rem"><strong>${String(name || 'Usuário').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</strong><br><span style="color:#617589">${String(email || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</span></div>
        <form id="mandatoryPasswordForm">
          <label style="display:block;font-weight:700;font-size:.84rem;margin-bottom:5px" for="mandatoryPassword1">Nova senha</label>
          <input id="mandatoryPassword1" type="password" autocomplete="new-password" minlength="8" required style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #c6d4df;border-radius:10px;font:inherit;margin-bottom:12px" />
          <label style="display:block;font-weight:700;font-size:.84rem;margin-bottom:5px" for="mandatoryPassword2">Repita a nova senha</label>
          <input id="mandatoryPassword2" type="password" autocomplete="new-password" minlength="8" required style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #c6d4df;border-radius:10px;font:inherit;margin-bottom:8px" />
          <p style="margin:0 0 14px;font-size:.78rem;color:#65798b">Use pelo menos 8 caracteres. Evite nomes, datas de nascimento ou senhas muito fáceis.</p>
          <button id="mandatoryPasswordSubmit" type="submit" style="width:100%;border:0;border-radius:10px;padding:12px 14px;background:#0a376c;color:white;font-weight:800;font-size:.95rem;cursor:pointer">Salvar minha nova senha</button>
          <button id="mandatoryPasswordLogout" type="button" style="width:100%;border:0;background:transparent;color:#5d7285;padding:12px 6px 0;font-weight:700;cursor:pointer">Sair e fazer isso depois</button>
          <p id="mandatoryPasswordMessage" role="status" style="min-height:22px;margin:12px 0 0;font-size:.86rem;color:#9b2c2c"></p>
        </form>
      </section>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    return overlay;
  }

  async function run() {
    const rt = await waitForRuntime();
    if (!rt) return;
    const { client, state } = rt;
    const userId = state.user?.id;
    if (!userId) return;

    const { data: profile, error } = await client
      .from('perfis_usuarios')
      .select('nome_completo,troca_senha_obrigatoria')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !profile?.troca_senha_obrigatoria) return;

    const overlay = createOverlay(profile.nome_completo, state.user?.email || '');
    const form = overlay.querySelector('#mandatoryPasswordForm');
    const p1 = overlay.querySelector('#mandatoryPassword1');
    const p2 = overlay.querySelector('#mandatoryPassword2');
    const submit = overlay.querySelector('#mandatoryPasswordSubmit');
    const logout = overlay.querySelector('#mandatoryPasswordLogout');
    const msg = overlay.querySelector('#mandatoryPasswordMessage');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const a = p1.value;
      const b = p2.value;
      msg.style.color = '#9b2c2c';
      if (a.length < 8) {
        msg.textContent = 'A nova senha precisa ter pelo menos 8 caracteres.';
        return;
      }
      if (a !== b) {
        msg.textContent = 'As duas senhas não são iguais.';
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Salvando...';
      msg.textContent = '';

      const { error: passwordError } = await client.auth.updateUser({ password: a });
      if (passwordError) {
        msg.textContent = `Não foi possível alterar a senha: ${passwordError.message}`;
        submit.disabled = false;
        submit.textContent = 'Salvar minha nova senha';
        return;
      }

      const { error: flagError } = await client.rpc('concluir_troca_senha_obrigatoria');
      if (flagError) {
        msg.textContent = 'A senha foi alterada, mas não foi possível finalizar o primeiro acesso. Feche e abra o app novamente.';
        submit.disabled = false;
        submit.textContent = 'Salvar minha nova senha';
        return;
      }

      if (state.profile) state.profile.troca_senha_obrigatoria = false;
      msg.style.color = '#177245';
      msg.textContent = '✓ Senha criada com sucesso. Entrando...';
      await sleep(900);
      document.body.style.overflow = '';
      overlay.remove();
      location.reload();
    });

    logout.addEventListener('click', async () => {
      try { await client.auth.signOut(); } catch (_) {}
      location.reload();
    });
  }

  void run();
})();
