(() => {
  if (window.__GEARPC_SAFETY_AUTO_SUBMIT_V71__) return;
  window.__GEARPC_SAFETY_AUTO_SUBMIT_V71__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let sending = false;

  function storageKey() {
    return `gearpc-safety-test-v63:${rt?.state?.user?.id || 'local'}`;
  }

  function readStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey()) || '{}');
      return {
        visits: Array.isArray(parsed.visits) ? parsed.visits : [],
        plans: Array.isArray(parsed.plans) ? parsed.plans : []
      };
    } catch (_) {
      return { visits: [], plans: [] };
    }
  }

  async function waitReady() {
    for (let i = 0; i < 160; i += 1) {
      const current = window.GEARPC_RUNTIME;
      if (current?.client && current?.state?.user && current?.state?.profile && $('safetyPlanFormV63')) return current;
      await sleep(250);
    }
    return null;
  }

  function openPhotoDb() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB indisponível'));
      const req = indexedDB.open('gearpc-safety-test-v64', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('visitPhotos')) db.createObjectStore('visitPhotos', { keyPath: 'visitId' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function loadPhotos(visitId) {
    try {
      const db = await openPhotoDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('visitPhotos', 'readonly');
        const req = tx.objectStore('visitPhotos').get(visitId);
        req.onsuccess = () => resolve(Array.isArray(req.result?.photos) ? req.result.photos : []);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      });
    } catch (_) {
      return [];
    }
  }

  function updateCard(visitId, text, cls = 'warn') {
    const edit = document.querySelector(`[data-edit-visit="${CSS.escape(visitId)}"]`);
    const card = edit?.closest('.safety-card-v63');
    if (!card) return;
    let badge = card.querySelector('.safety-approval-status-v67');
    if (!badge) {
      badge = document.createElement('span');
      card.querySelector('.meta')?.insertAdjacentElement('afterend', badge);
    }
    badge.className = `safety-pill-v63 safety-approval-status-v67 ${cls}`;
    badge.textContent = text;
    card.querySelectorAll('[data-send-dme-v67]').forEach((button) => button.remove());
  }

  async function autoSubmit(visitId) {
    if (sending || !visitId || !navigator.onLine) return;
    const store = readStore();
    const visit = store.visits.find((item) => item.id === visitId);
    const plan = store.plans.find((item) => item.baseVisitId === visitId);
    if (!visit || !plan || plan.status !== 'pronto') return;

    sending = true;
    try {
      const { data: existing, error: existingError } = await rt.client
        .from('safety_approval_test_v67')
        .select('visit_id,status')
        .eq('visit_id', visitId)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing?.status === 'aprovado') {
        updateCard(visitId, 'Aprovado', 'ok');
        return;
      }

      const photos = await loadPhotos(visitId);
      const now = new Date().toISOString();
      const values = {
        submitted_by: rt.state.user.id,
        submitted_by_name: rt.state.profile.nome_completo || '',
        activity_name: visit.activityName || plan.activityName || '',
        status: 'aguardando_dme',
        dme_comment: '',
        reviewed_by: null,
        reviewed_at: null,
        submitted_at: now,
        updated_at: now,
        document_payload: { schemaVersion: 71, visit, plan, photos }
      };

      const result = existing
        ? await rt.client.from('safety_approval_test_v67').update(values).eq('visit_id', visitId)
        : await rt.client.from('safety_approval_test_v67').insert({ visit_id: visitId, ...values });
      if (result.error) throw result.error;

      updateCard(visitId, 'Aguardando DME', 'warn');
      window.dispatchEvent(new CustomEvent('gearpc:safety-sent-dme', { detail: { visitId } }));
      alert('Planejamento salvo e enviado automaticamente ao DME para análise.');
    } catch (error) {
      console.warn('GEArPC safety auto submit v71', error);
      alert(`O planejamento foi salvo no aparelho, mas não foi possível enviá-lo ao DME agora: ${error?.message || 'erro de conexão'}. Você poderá reenviar quando estiver conectado.`);
    } finally {
      sending = false;
    }
  }

  function wire() {
    $('safetyPlanFormV63')?.addEventListener('submit', () => {
      const ready = $('spStatusV63')?.value === 'pronto';
      const visitId = String($('spBaseVisitV63')?.value || '').trim();
      if (!ready || !visitId) return;
      window.setTimeout(() => { void autoSubmit(visitId); }, 350);
    }, true);
  }

  async function boot() {
    rt = await waitReady();
    if (!rt) return;
    wire();
  }

  void boot();
})();