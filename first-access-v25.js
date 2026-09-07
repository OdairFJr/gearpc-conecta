(() => {
  if (window.__GEARPC_FIRST_ACCESS_V25__) return;
  window.__GEARPC_FIRST_ACCESS_V25__ = true;

  function installFirstAccessUi() {
    const form = document.getElementById('loginForm');
    const forgot = document.getElementById('forgotPasswordButton');
    if (!form || !forgot) return false;
    if (document.getElementById('temporaryPasswordHint')) return true;

    const helper = form.querySelector('.login-helper');
    if (helper) {
      helper.textContent = 'Entre com seu e-mail e senha. No primeiro acesso, use a senha temporária enviada pela direção do grupo.';
    }

    const box = document.createElement('div');
    box.id = 'temporaryPasswordHint';
    box.style.cssText = 'margin:12px 0 8px;padding:11px 12px;border-radius:10px;background:#eaf3ff;border:1px solid #b9d5f5;color:#17324d;font-size:.86rem;line-height:1.4;text-align:left;';
    box.innerHTML = '<strong>🔑 Primeiro acesso</strong><br>Use o seu e-mail e a senha temporária recebida. Assim que entrar, o aplicativo vai pedir que você crie uma senha pessoal nova.';

    const loginButton = document.getElementById('loginButton');
    if (loginButton?.parentNode) loginButton.parentNode.insertBefore(box, loginButton);

    forgot.textContent = 'Esqueci minha senha';
    const recoveryHint = form.querySelector('.login-recovery-hint');
    if (recoveryHint) {
      recoveryHint.textContent = 'Use esta opção somente se você já criou sua senha pessoal e não lembra mais dela.';
    }

    const oldFirst = document.getElementById('firstAccessButton');
    if (oldFirst) oldFirst.remove();
    const oldHint = document.getElementById('firstAccessHint');
    if (oldHint) oldHint.remove();

    return true;
  }

  if (installFirstAccessUi()) return;
  let tries = 0;
  const timer = window.setInterval(() => {
    tries += 1;
    if (installFirstAccessUi() || tries >= 40) window.clearInterval(timer);
  }, 250);
})();
