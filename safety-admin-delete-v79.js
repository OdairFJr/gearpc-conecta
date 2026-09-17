(() => {
  if (window.__GEARPC_SAFETY_ADMIN_DELETE_V79__) return;
  window.__GEARPC_SAFETY_ADMIN_DELETE_V79__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let rt = null;
  let allowed = false;

  async function waitRuntime() {
    for (let i = 0; i < 160; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.client && x?.state?.user && x?.state?.profile) return x;
      await sleep(250);
    }
    return null;
  }

  async function canDeleteApprovals() {
    if (rt?.state?.profile?.tipo === 'administrador') return true;
    const chiefId = rt?.state?.profile?.chefe_id;
    if (!chiefId) return false;

    const fromState = (rt?.state?.chefeFuncoes || []).some((f) =>
      Number(f.chefe_id) === Number(chiefId) &&
      String(f.funcao || '').trim().toLowerCase() === 'diretor de metodos educativos'
    );
    if (fromState) return true;

    try {
      const { data, error } = await rt.client
        .from('chefe_funcoes')
        .select('funcao')
        .eq('chefe_id', chiefId);
      if (error) return false;
      return (data || []).some((f) =>
        String(f.funcao || '').trim().toLowerCase() === 'diretor de metodos educativos'
      );
    } catch (_) {
      return false;
    }
  }

  function decorate() {
    if (!allowed) return;
    document.querySelectorAll('#safetyDmeListV67 .safety-dme-card-v67').forEach((card) => {
      if (card.querySelector('[data-delete-approval-v79],[data-delete-approval-v67]')) return;
      const review = card.querySelector('[data-review-v67]');
      const actions = card.querySelector('.safety-dme-actions-v67');
      const visitId = review?.dataset.reviewV67;
      if (!visitId || !actions) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'safety-mini-btn-v63 danger';
      btn.dataset.deleteApprovalV79 = visitId;
      btn.textContent = 'Apagar';
      actions.appendChild(btn);
    });
  }

  async function deleteApproval(visitId, button) {
    if (!navigator.onLine) {
      alert('Para apagar um envio da área do DME é necessário estar conectado à internet.');
      return;
    }

    const card = button?.closest('.safety-dme-card-v67');
    const activityName = card?.querySelector('strong')?.textContent?.trim() || 'este planejamento';
    if (!window.confirm(`Apagar definitivamente "${activityName}" da área de análise do DME? Esta ação não pode ser desfeita.`)) return;

    button.disabled = true;
    const { data, error } = await rt.client
      .from('safety_approval_test_v67')
      .delete()
      .eq('visit_id', visitId)
      .select('visit_id');

    if (error) {
      button.disabled = false;
      alert(`Não foi possível apagar o planejamento: ${error.message}`);
      return;
    }

    if (!Array.isArray(data) || !data.some((row) => row.visit_id === visitId)) {
      button.disabled = false;
      alert('O registro não foi removido. Atualize a tela e tente novamente.');
      return;
    }

    card?.remove();
    const list = document.getElementById('safetyDmeListV67');
    if (list && !list.querySelector('.safety-dme-card-v67')) {
      list.innerHTML = '<div class="safety-empty-v63">Nenhum planejamento enviado ao DME.</div>';
    }
  }

  document.addEventListener('click', (event) => {
    const del = event.target.closest('[data-delete-approval-v79]');
    if (del) {
      event.preventDefault();
      event.stopPropagation();
      void deleteApproval(del.dataset.deleteApprovalV79, del);
      return;
    }

    if (event.target.closest('#safetyButtonV63')) {
      [150, 400, 900, 1800].forEach((delay) => setTimeout(decorate, delay));
    }
  }, true);

  window.addEventListener('focus', () => {
    [100, 500].forEach((delay) => setTimeout(decorate, delay));
  });

  async function boot() {
    rt = await waitRuntime();
    if (!rt) return;
    allowed = await canDeleteApprovals();
    if (!allowed) return;
    [0, 300, 800, 1600, 3200, 6000].forEach((delay) => setTimeout(decorate, delay));
  }

  void boot();
})();