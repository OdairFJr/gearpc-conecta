(() => {
  if (window.__GEARPC_BIRTHDAY_PILOT_V61__) return;
  window.__GEARPC_BIRTHDAY_PILOT_V61__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let pilot = false;
  let refreshTimer = null;

  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function smartName(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (raw !== raw.toUpperCase()) return raw;
    return raw.toLocaleLowerCase('pt-BR').replace(/(^|[\s'-])([a-záàâãéêíóôõúüç])/g, (_m, a, b) => `${a}${b.toLocaleUpperCase('pt-BR')}`);
  }

  async function waitRuntime() {
    for (let i = 0; i < 120; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.profile && x?.state?.user?.id) return x;
      await sleep(250);
    }
    return null;
  }

  async function resolvePilot() {
    if (rt.state.profile?.tipo === 'administrador') return true;
    const { data, error } = await rt.client
      .from('perfis_usuarios')
      .select('eh_teste')
      .eq('user_id', rt.state.user.id)
      .maybeSingle();
    return !error && data?.eh_teste === true;
  }

  function saoPauloParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value || '';
    return { month: get('month'), day: get('day') };
  }

  function isBirthdayToday(dateValue) {
    if (!dateValue) return false;
    const match = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return false;
    const today = saoPauloParts();
    return match[2] === today.month && match[3] === today.day;
  }

  function injectStyles() {
    if ($('birthdayPilotStylesV61')) return;
    const style = document.createElement('style');
    style.id = 'birthdayPilotStylesV61';
    style.textContent = `
      .birthday-host-v61{margin:14px 0 18px;display:grid;gap:10px}
      .birthday-self-v61{position:relative;overflow:hidden;border:1px solid #e4c46a;background:linear-gradient(135deg,#fff9df,#fff3bd);border-radius:18px;padding:20px 18px;box-shadow:0 8px 24px rgba(94,70,0,.12)}
      .birthday-self-v61::before,.birthday-self-v61::after{position:absolute;font-size:34px;opacity:.34}.birthday-self-v61::before{content:'🎈';right:18px;top:12px}.birthday-self-v61::after{content:'🎉';right:62px;bottom:8px}
      .birthday-self-v61 .birthday-kicker-v61{font-size:.75rem;font-weight:900;letter-spacing:.08em;color:#7a5a00;margin-bottom:5px}.birthday-self-v61 h3{margin:0 0 7px;color:#644900;font-size:1.28rem}.birthday-self-v61 p{margin:0;max-width:720px;color:#5b4d24;line-height:1.5}.birthday-self-v61 strong{color:#4d3b00}
      .birthday-others-v61{border:1px solid #c9d9ee;background:#f3f8ff;border-radius:15px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;box-shadow:0 5px 16px rgba(10,55,108,.06)}
      .birthday-others-icon-v61{font-size:26px;line-height:1}.birthday-others-v61 strong{display:block;color:#0a376c;margin-bottom:4px}.birthday-others-v61 p{margin:0;color:#465e78;line-height:1.45}
      @media(max-width:640px){.birthday-self-v61{padding:18px 15px}.birthday-self-v61::after{display:none}}
    `;
    document.head.appendChild(style);
  }

  function ensureHost() {
    const dashboard = $('dashboardView');
    if (!dashboard) return null;
    let host = $('birthdayHostV61');
    if (host) return host;
    host = document.createElement('section');
    host.id = 'birthdayHostV61';
    host.className = 'birthday-host-v61';
    host.setAttribute('aria-live', 'polite');
    const header = dashboard.querySelector('.launch-header');
    if (header) header.insertAdjacentElement('afterend', host);
    else dashboard.prepend(host);
    return host;
  }

  function joinNames(names) {
    if (names.length <= 1) return names[0] || '';
    if (names.length === 2) return `${names[0]} e ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
  }

  async function loadBirthdays() {
    const host = ensureHost();
    if (!host || !rt.state.user?.id || !pilot) {
      if (host) host.innerHTML = '';
      return;
    }

    const [chiefRes, youthRes] = await Promise.all([
      rt.client.from('chefes')
        .select('id,nome_completo,data_nascimento,ativo,eh_teste')
        .or('ativo.eq.true,eh_teste.eq.true')
        .not('data_nascimento', 'is', null),
      rt.client.from('jovens')
        .select('id,nome_completo,data_nascimento,ativo')
        .eq('ativo', true)
        .not('data_nascimento', 'is', null)
    ]);

    if (chiefRes.error && youthRes.error) {
      host.innerHTML = '';
      return;
    }

    const people = [
      ...((chiefRes.data || []).filter((p) => isBirthdayToday(p.data_nascimento)).map((p) => ({ kind:'chefe', id:Number(p.id), nome:smartName(p.nome_completo) }))),
      ...((youthRes.data || []).filter((p) => isBirthdayToday(p.data_nascimento)).map((p) => ({ kind:'jovem', id:Number(p.id), nome:smartName(p.nome_completo) })))
    ];

    if (!people.length) {
      host.innerHTML = '';
      return;
    }

    const profile = rt.state.profile || {};
    const self = profile.chefe_id
      ? people.find((p) => p.kind === 'chefe' && p.id === Number(profile.chefe_id))
      : null;
    const others = self ? people.filter((p) => !(p.kind === self.kind && p.id === self.id)) : people;

    const blocks = [];
    if (self) {
      blocks.push(`
        <article class="birthday-self-v61">
          <div class="birthday-kicker-v61">🎂 HOJE É O SEU DIA</div>
          <h3>Feliz aniversário, ${esc(self.nome)}! 🎉</h3>
          <p>O <strong>Grupo Escoteiro do Ar Paulo Carzino</strong> deseja a você um novo ciclo cheio de saúde, alegria, conquistas, boas amizades e muitas aventuras. Que seu dia seja muito especial. <strong>Parabéns! ⚜️✈️</strong></p>
        </article>`);
    }

    if (others.length) {
      const names = others.map((p) => p.nome).filter(Boolean);
      const plural = names.length > 1;
      blocks.push(`
        <article class="birthday-others-v61">
          <div class="birthday-others-icon-v61">🎂</div>
          <div><strong>Hoje tem aniversário no GEArPC!</strong><p>${plural ? 'Hoje celebramos os aniversários de' : 'Hoje é aniversário de'} <strong>${esc(joinNames(names))}</strong>. ${plural ? 'Não esqueça de dar os parabéns aos aniversariantes!' : 'Não esqueça de dar os parabéns!'} 🎉</p></div>
        </article>`);
    }

    host.innerHTML = blocks.join('');
  }

  function scheduleRefresh(delay = 80) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => { void loadBirthdays(); }, delay);
  }

  function bindRefresh() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) scheduleRefresh(120);
    });
    window.addEventListener('focus', () => scheduleRefresh(120));
    const dashboard = $('dashboardView');
    if (dashboard) {
      new MutationObserver(() => {
        if (!dashboard.classList.contains('hidden')) scheduleRefresh(80);
      }).observe(dashboard, { attributes:true, attributeFilter:['class'] });
    }
    window.setInterval(() => {
      const dashboard = $('dashboardView');
      if (dashboard && !dashboard.classList.contains('hidden')) scheduleRefresh(20);
    }, 300000);
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt) return;
    pilot = await resolvePilot();
    if (!pilot) return;
    injectStyles();
    bindRefresh();
    scheduleRefresh(120);
    rt.client.auth.onAuthStateChange((_event, session) => {
      if (session) scheduleRefresh(700);
      else $('birthdayHostV61')?.replaceChildren();
    });
  }

  void boot();
})();
