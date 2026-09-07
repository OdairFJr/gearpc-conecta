(() => {
  if (window.__GEARPC_FIRST_ACCESS_V25__) return;
  window.__GEARPC_FIRST_ACCESS_V25__ = true;

  function installFirstAccessUi() {
    const form = document.getElementById('loginForm');
    const email = document.getElementById('email');
    const forgot = document.getElementById('forgotPasswordButton');
    const message = document.getElementById('loginMessage');
    if (!form || !email || !forgot || !message) return false;
    if (document.getElementById('firstAccessButton')) return true;

    const helper = form.querySelector('.login-helper');
    if (helper) {
      helper.textContent = 'Se você já criou sua senha, entre normalmente. No primeiro acesso, informe apenas seu e-mail e use o botão “É meu primeiro acesso”.';
    }

    forgot.textContent = 'Esqueci minha senha';

    const first = document.createElement('button');
    first.type = 'button';
    first.id = 'firstAccessButton';
    first.className = 'login-link-button';
    first.textContent = '🔑 É meu primeiro acesso — criar senha';
    first.style.cssText = 'margin-top:12px;background:#0a376c;color:#fff;border:0;border-radius:10px;padding:12px 14px;font-weight:800;width:100%;cursor:pointer;';

    const recoveryHint = form.querySelector('.login-recovery-hint');
    const firstHint = document.createElement('p');
    firstHint.id = 'firstAccessHint';
    firstHint.className = 'login-recovery-hint';
    firstHint.textContent = 'Digite seu e-mail acima. Enviaremos um link seguro para você criar sua primeira senha.';
    firstHint.style.marginTop = '6px';

    forgot.parentNode.insertBefore(first, forgot);
    forgot.parentNode.insertBefore(firstHint, forgot);
    if (recoveryHint) {
      recoveryHint.textContent = 'Se você já tinha senha e esqueceu, informe seu e-mail e toque em “Esqueci minha senha”.';
    }

    first.addEventListener('click', () => {
      const value = email.value.trim();
      message.classList.remove('success-message');
      if (!value) {
        message.textContent = 'Digite seu e-mail no campo acima para receber o link do primeiro acesso.';
        email.focus();
        return;
      }
      message.textContent = 'Enviando o link para criar sua senha...';
      forgot.click();
    });

    return true;
  }

  if (installFirstAccessUi()) return;
  let tries = 0;
  const timer = window.setInterval(() => {
    tries += 1;
    if (installFirstAccessUi() || tries >= 40) window.clearInterval(timer);
  }, 250);
})();
