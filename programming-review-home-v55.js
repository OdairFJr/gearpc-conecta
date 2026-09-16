(() => {
  if (window.__GEARPC_PROGRAM_REVIEW_HOME_V55__) return;
  window.__GEARPC_PROGRAM_REVIEW_HOME_V55__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let refreshTimer = null;

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function saoPauloYmd(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value || '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  function addDaysYmd(ymd, days) {
    const [y,m,d] = ymd.split('-').map(Number);
    const x = new Date(Date.UTC(y, m - 1, d, 12));
    x.setUTCDate(x.getUTCDate() + days);
    return x.toISOString().slice(0,10);
  }

  function formatDate(ymd) {
    if (!ymd) return '';
    const [y,m,d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  }

  async function waitRuntime() {
    for (let i = 0; i < 120; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state) return x;
      await sleep(250);
    }
    return null;
  }

  function injectStyles() {
    if ($('programReviewHomeStylesV55')) return;
    const style = document.createElement('style');
    style.id = 'programReviewHomeStylesV55';
    style.textContent = `
      .program-review-home-v55{margin:14px 0 18px;display:grid;gap:10px}
      .program-review-home-card-v55{border:1px solid #b8dfc6;background:#edf8f1;border-radius:15px;padding:14px 16px;box-shadow:0 6px 18px rgba(10,55,108,.08)}
      .program-review-home-card-v55.adjust{border-color:#e8c76a;background:#fff8dc}
      .program-review-home-top-v55{display:flex;gap:10px;align-items:flex-start}.program-review-home-icon-v55{font-size:24px;line-height:1}
      .program-review-home-copy-v55{flex:1;min-width:0}.program-review-home-copy-v55 strong{display:block;color:#176b38;margin-bottom:4px}.program-review-home-card-v55.adjust strong{color:#76570b}
      .program-review-home-copy-v55 p{margin:0;color:#435a4c;line-height:1.4}.program-review-home-card-v55.adjust p{color:#635522}
      .program-review-home-note-v55{margin-top:8px!important;font-weight:700}.program-review-home-actions-v55{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      .program-review-home-actions-v55 button{border:0;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer}.program-review-home-open-v55{background:#0a376c;color:#fff}.program-review-home-dismiss-v55{background:#e7edf3;color:#31475e}
      @media(max-width:640px){.program-review-home-actions-v55 button{flex:1 1 100%}}
    `;
    document.head.appendChild(style);
  }

  function ensureHost() {
    const dashboard = $('dashboardView');
    if (!dashboard) return null;
    let host = $('programReviewHomeV55');
    if (host) return host;
    host = document.createElement('section');
    host.id = 'programReviewHomeV55';
    host.className = 'program-review-home-v55';
    host.setAttribute('aria-live', 'polite');
    const service = $('serviceBranchCardV30');
    const header = dashboard.querySelector('.launch-header');
    if (service) service.insertAdjacentElement('afterend', host);
    else header?.insertAdjacentElement('afterend', host);
    return host;
  }

  function ackKey(review) {
    return `gearpc_program_review_ack_v55:${rt.state.user?.id || ''}:${review.secao_id}:${review.data_atividade}:${review.status}:${review.revisado_em || ''}`;
  }

  function isAcked(review) {
    try { return localStorage.getItem(ackKey(review)) === '1'; } catch (_) { return false; }
  }

  function markAck(review) {
    try { localStorage.setItem(ackKey(review), '1'); } catch (_) {}
  }

  async function linkedSectionIds() {
    const profile = rt.state.profile;
    if (!profile?.chefe_id) return [];
    const { data, error } = await rt.client.from('chefe_secoes')
      .select('secao_id')
      .eq('chefe_id', Number(profile.chefe_id));
    if (error) throw error;
    return [...new Set((data || []).map((r) => Number(r.secao_id)).filter(Boolean))];
  }

  async function loadReviews() {
    const profile = rt.state.profile;
    const host = ensureHost();
    if (!host) return;
    if (!rt.state.user?.id || profile?.tipo !== 'chefia') {
      host.innerHTML = '';
      return;
    }

    const sectionIds = await linkedSectionIds();
    if (!sectionIds.length) {
      host.innerHTML = '';
      return;
    }

    const today = saoPauloYmd();
    const until = addDaysYmd(today, 14);
    const [reviewRes, sectionRes, programRes] = await Promise.all([
      rt.client.from('programacao_revisoes')
        .select('secao_id,data_atividade,status,observacao,revisado_em')
        .in('secao_id', sectionIds)
        .in('status', ['autorizada','nao_autorizada'])
        .gte('data_atividade', today)
        .lte('data_atividade', until)
        .order('data_atividade', { ascending: true }),
      rt.client.from('secoes').select('id,nome').in('id', sectionIds),
      rt.client.from('programacoes').select('id,secao_id,data_atividade').in('secao_id', sectionIds).gte('data_atividade', today).lte('data_atividade', until)
    ]);
    const error = reviewRes.error || sectionRes.error || programRes.error;
    if (error) throw error;

    const sections = new Map((sectionRes.data || []).map((s) => [Number(s.id), s.nome]));
    const programs = programRes.data || [];
    const reviews = (reviewRes.data || []).filter((r) => !isAcked(r));

    host.innerHTML = reviews.map((r, index) => {
      const adjust = r.status === 'nao_autorizada';
      const program = programs.find((p) => Number(p.secao_id) === Number(r.secao_id) && p.data_atividade === r.data_atividade);
      const title = adjust ? 'Programação conferida — revisão solicitada' : 'Programação conferida — tudo certo';
      const base = `${sections.get(Number(r.secao_id)) || 'Seção'} • ${formatDate(r.data_atividade)}`;
      const message = adjust
        ? 'A programação foi conferida e precisa de alguns ajustes antes da atividade.'
        : 'A programação foi conferida e está aprovada para a atividade.';
      return `<article class="program-review-home-card-v55 ${adjust ? 'adjust' : ''}" data-review-home-card="${index}">
        <div class="program-review-home-top-v55"><div class="program-review-home-icon-v55">${adjust ? '📝' : '✅'}</div><div class="program-review-home-copy-v55"><strong>${esc(title)}</strong><p>${esc(base)}<br>${esc(message)}</p>${r.observacao ? `<p class="program-review-home-note-v55">Observação: ${esc(r.observacao)}</p>` : ''}</div></div>
        <div class="program-review-home-actions-v55">${program ? `<button type="button" class="program-review-home-open-v55" data-review-home-open="${Number(program.id)}">Ver programação</button>` : ''}<button type="button" class="program-review-home-dismiss-v55" data-review-home-dismiss="${index}">Entendi</button></div>
      </article>`;
    }).join('');

    host.__reviewRows = reviews;
  }

  async function refresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
      try { await loadReviews(); }
      catch (error) { console.error('GEArPC: falha ao carregar avisos de revisão na tela inicial', error); }
    }, 120);
  }

  function bindEvents() {
    document.addEventListener('click', async (event) => {
      const dismiss = event.target.closest('[data-review-home-dismiss]');
      if (dismiss) {
        const host = ensureHost();
        const index = Number(dismiss.dataset.reviewHomeDismiss || -1);
        const review = host?.__reviewRows?.[index];
        if (review) markAck(review);
        dismiss.closest('[data-review-home-card]')?.remove();
        return;
      }

      const open = event.target.closest('[data-review-home-open]');
      if (open) {
        const id = Number(open.dataset.reviewHomeOpen || 0);
        if (id && typeof rt.openProgramPreview === 'function') await rt.openProgramPreview(id);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refresh();
    });
    window.addEventListener('focus', refresh);

    const dashboard = $('dashboardView');
    if (dashboard) {
      const observer = new MutationObserver(() => {
        if (!dashboard.classList.contains('hidden')) refresh();
      });
      observer.observe(dashboard, { attributes: true, attributeFilter: ['class'] });
    }
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt) return;
    injectStyles();
    bindEvents();
    rt.client.auth.onAuthStateChange((_event, session) => {
      if (session) setTimeout(refresh, 700);
      else $('programReviewHomeV55')?.replaceChildren();
    });
    const { data } = await rt.client.auth.getSession();
    if (data?.session) setTimeout(refresh, 700);
  }

  void boot();
})();
