(() => {
  if (window.__GEARPC_PROGRAMMING_OK_COMMENT_V59__) return;
  window.__GEARPC_PROGRAMMING_OK_COMMENT_V59__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let observer = null;
  let decorating = false;

  async function waitRuntime() {
    for (let i = 0; i < 120; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.profile && x?.state?.user?.id) return x;
      await sleep(250);
    }
    return null;
  }

  function injectStyles() {
    if ($('programOkCommentStylesV59')) return;
    const style = document.createElement('style');
    style.id = 'programOkCommentStylesV59';
    style.textContent = `
      .program-ok-comment-v59{display:grid;gap:5px;margin-top:10px;padding:10px 11px;border-radius:11px;background:#f3f8f5;border:1px solid #cfe3d6}
      .program-ok-comment-v59 span{font-size:.78rem;font-weight:900;color:#315b40}
      .program-ok-comment-v59 textarea{width:100%;min-height:68px;resize:vertical;box-sizing:border-box;border:1px solid #bed1c5;border-radius:9px;padding:9px 10px;background:#fff;font:inherit;color:#243c2c}
      .program-ok-comment-v59 small{color:#607467;line-height:1.35}
      .program-ok-comment-saved-v59{margin:8px 0 0;padding:8px 10px;border-radius:9px;background:#edf8f1;color:#176b38;font-size:.86rem}
    `;
    document.head.appendChild(style);
  }

  async function loadSavedComment(sectionId, date) {
    const { data, error } = await rt.client.from('programacao_revisoes')
      .select('observacao_teste,status')
      .eq('secao_id', Number(sectionId))
      .eq('data_atividade', date)
      .maybeSingle();
    if (error) return null;
    return data || null;
  }

  async function decorateCard(card) {
    const authorize = card.querySelector('[data-review-action="authorize"]');
    if (!authorize || card.querySelector('.program-ok-comment-v59')) return;
    const sectionId = Number(authorize.dataset.sectionId || 0);
    const date = authorize.dataset.date || '';
    if (!sectionId || !date) return;

    const wrap = document.createElement('label');
    wrap.className = 'program-ok-comment-v59';
    wrap.innerHTML = `<span>Comentário/aviso (opcional)</span><textarea data-ok-comment-v59 placeholder="Ex.: Tudo certo. Apenas lembrar de separar o material com antecedência."></textarea><small>Este comentário não altera a aprovação da programação.</small>`;
    const actions = card.querySelector('.program-review-actions');
    actions?.insertAdjacentElement('beforebegin', wrap);

    const saved = await loadSavedComment(sectionId, date);
    const textarea = wrap.querySelector('textarea');
    if (saved?.status === 'autorizada' && saved?.observacao_teste && textarea) textarea.value = saved.observacao_teste;
  }

  async function decoratePanel() {
    if (decorating) return;
    const panel = $('programWeeklyReviewPanel');
    if (!panel) return;
    decorating = true;
    try {
      const cards = [...panel.querySelectorAll('.program-review-card')];
      for (const card of cards) await decorateCard(card);
    } finally {
      decorating = false;
    }
  }

  async function saveApprovedComment(button) {
    const sectionId = Number(button.dataset.sectionId || 0);
    const date = button.dataset.date || '';
    if (!sectionId || !date) return;
    const card = button.closest('.program-review-card');
    const text = String(card?.querySelector('[data-ok-comment-v59]')?.value || '').trim();
    const now = new Date().toISOString();
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Salvando...';

    try {
      const payload = {
        secao_id: sectionId,
        data_atividade: date,
        status: 'autorizada',
        observacao: null,
        observacao_teste: text || null,
        revisado_por: rt.state.user.id,
        revisado_em: now,
        atualizado_em: now
      };
      const { error } = await rt.client.from('programacao_revisoes')
        .upsert(payload, { onConflict: 'secao_id,data_atividade' });
      if (error) throw error;

      const oldState = card?.querySelector('.program-review-state');
      if (oldState) {
        oldState.className = 'program-review-state ok';
        oldState.textContent = 'Tudo certo';
      }
      card?.querySelector('.program-ok-comment-saved-v59')?.remove();
      if (text) {
        const note = document.createElement('p');
        note.className = 'program-ok-comment-saved-v59';
        note.innerHTML = `<strong>Comentário/aviso:</strong> ${text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}`;
        card?.querySelector('.program-review-actions')?.insertAdjacentElement('beforebegin', note);
      }
      button.textContent = '✓ Revisada — tudo certo';
    } catch (error) {
      console.error('GEArPC: falha ao salvar comentário de aprovação', error);
      window.alert('Não foi possível salvar a conferência. Tente novamente.');
      button.textContent = originalText;
    } finally {
      button.disabled = false;
    }
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest('[data-review-action="authorize"]');
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void saveApprovedComment(button);
    }, true);
  }

  function watchPanel() {
    const panel = $('programWeeklyReviewPanel');
    if (!panel || observer) return;
    observer = new MutationObserver(() => setTimeout(() => void decoratePanel(), 30));
    observer.observe(panel, { childList: true, subtree: true });
  }

  async function boot() {
    rt = await waitRuntime();
    if (!rt || rt.state.profile?.tipo !== 'administrador') return;
    injectStyles();
    bindEvents();
    watchPanel();
    setTimeout(() => { watchPanel(); void decoratePanel(); }, 500);
  }

  void boot();
})();
