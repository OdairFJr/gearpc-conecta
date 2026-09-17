(() => {
  if (window.__GEARPC_SAFETY_SEND_DME_V72__) return;
  window.__GEARPC_SAFETY_SEND_DME_V72__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let observer = null;
  let decorating = false;
  const sending = new Set();

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
      if (current?.client && current?.state?.user && current?.state?.profile && $('safetyVisitsListV63')) return current;
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

  function pairedPlan(visitId) {
    return readStore().plans.find((plan) => plan.baseVisitId === visitId) || null;
  }

  async function senderName() {
    const direct = String(rt?.state?.profile?.nome_completo || '').trim();
    if (direct) return direct;
    const chiefId = rt?.state?.profile?.chefe_id;
    const fromState = (rt?.state?.chefes || []).find((row) => Number(row.id) === Number(chiefId));
    const stateName = String(fromState?.nome_completo || '').trim();
    if (stateName) return stateName;
    if (!chiefId) return '';
    try {
      const { data } = await rt.client.from('chefes').select('nome_completo').eq('id', chiefId).maybeSingle();
      return String(data?.nome_completo || '').trim();
    } catch (_) {
      return '';
    }
  }

  function setButtonState(button, text, disabled = false) {
    if (!button) return;
    button.disabled = disabled;
    button.textContent = text;
  }

  function setCardStatus(visitId, text, cls = 'warn') {
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
  }

  async function remoteStatus(visitId) {
    const { data, error } = await rt.client
      .from('safety_approval_test_v67')
      .select('visit_id,status,dme_comment')
      .eq('visit_id', visitId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function sendToDme(visitId, button) {
    if (!visitId || sending.has(visitId)) return;
    if (!navigator.onLine) {
      alert('Para enviar ao DME é necessário estar conectado à internet. O planejamento continua salvo no aparelho.');
      return;
    }

    const store = readStore();
    const visit = store.visits.find((item) => item.id === visitId);
    const plan = store.plans.find((item) => item.baseVisitId === visitId);
    if (!visit) return alert('Não encontrei a visita técnica deste planejamento no aparelho.');
    if (!plan) return alert('Conclua o Plano de Segurança antes de enviar ao DME.');
    if (plan.status !== 'pronto') return alert('Abra o Plano de Segurança, altere o status para “Pronto para a atividade” e salve. Depois use “Enviar ao DME”.');

    sending.add(visitId);
    const original = button?.textContent || '📤 Enviar ao DME';
    setButtonState(button, 'Enviando…', true);

    try {
      const existing = await remoteStatus(visitId);
      if (existing?.status === 'aguardando_dme') {
        setCardStatus(visitId, 'Aguardando DME', 'warn');
        setButtonState(button, '✓ Já enviado ao DME', true);
        alert('Este planejamento já está na fila do DME aguardando análise.');
        return;
      }
      if (existing?.status === 'aprovado') {
        setCardStatus(visitId, 'Aprovado', 'ok');
        setButtonState(button, '✓ Aprovado pelo DME', true);
        alert('Este planejamento já foi aprovado pelo DME.');
        return;
      }

      const photos = await loadPhotos(visitId);
      const now = new Date().toISOString();
      const name = await senderName();
      const values = {
        submitted_by: rt.state.user.id,
        submitted_by_name: name,
        activity_name: visit.activityName || plan.activityName || '',
        status: 'aguardando_dme',
        dme_comment: '',
        reviewed_by: null,
        reviewed_at: null,
        submitted_at: now,
        updated_at: now,
        document_payload: { schemaVersion: 72, visit, plan, photos }
      };

      const result = existing
        ? await rt.client.from('safety_approval_test_v67').update(values).eq('visit_id', visitId)
        : await rt.client.from('safety_approval_test_v67').insert({ visit_id: visitId, ...values });
      if (result.error) throw result.error;

      const verified = await remoteStatus(visitId);
      if (!verified || verified.status !== 'aguardando_dme') {
        throw new Error('o banco não confirmou a entrada na fila do DME');
      }

      setCardStatus(visitId, 'Aguardando DME', 'warn');
      setButtonState(button, '✓ Enviado ao DME', true);
      window.dispatchEvent(new CustomEvent('gearpc:safety-sent-dme', { detail: { visitId } }));
      alert('Planejamento enviado ao DME com sucesso.');
    } catch (error) {
      console.warn('GEArPC explicit DME send v72', error);
      setButtonState(button, original, false);
      alert(`Não foi possível enviar ao DME: ${error?.message || 'erro não identificado'}`);
    } finally {
      sending.delete(visitId);
    }
  }

  async function decorateCard(card) {
    const edit = card.querySelector('[data-edit-visit]');
    const visitId = edit?.dataset.editVisit;
    if (!visitId) return;
    const plan = pairedPlan(visitId);
    const actions = card.querySelector('.safety-card-actions-v63');
    if (!actions) return;

    card.querySelectorAll('[data-send-dme-v67],[data-send-dme-v72]').forEach((node) => node.remove());
    if (!plan) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'safety-mini-btn-v63 safety-send-dme-v72';
    button.dataset.sendDmeV72 = visitId;
    button.textContent = '📤 Enviar ao DME';
    actions.appendChild(button);

    if (!navigator.onLine) return;
    try {
      const status = await remoteStatus(visitId);
      if (status?.status === 'aguardando_dme') {
        setCardStatus(visitId, 'Aguardando DME', 'warn');
        setButtonState(button, '✓ Já enviado ao DME', true);
      } else if (status?.status === 'aprovado') {
        setCardStatus(visitId, 'Aprovado', 'ok');
        setButtonState(button, '✓ Aprovado pelo DME', true);
      } else if (status?.status === 'ajustes_solicitados') {
        setCardStatus(visitId, 'Ajustes solicitados', 'warn');
        button.textContent = '📤 Reenviar ao DME';
      } else if (status?.status === 'reprovado') {
        setCardStatus(visitId, 'Reprovado', 'bad');
        button.textContent = '📤 Reenviar ao DME';
      }
    } catch (_) {}
  }

  async function decorateCards() {
    if (decorating) return;
    const list = $('safetyVisitsListV63');
    if (!list) return;
    decorating = true;
    observer?.disconnect();
    try {
      const cards = [...list.querySelectorAll('.safety-card-v63')];
      for (const card of cards) await decorateCard(card);
    } finally {
      decorating = false;
      observer?.observe(list, { childList: true, subtree: false });
    }
  }

  function wire() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-send-dme-v72]');
      if (button) {
        event.preventDefault();
        event.stopPropagation();
        void sendToDme(button.dataset.sendDmeV72, button);
      }
      if (event.target.closest('#safetyButtonV63')) window.setTimeout(() => { void decorateCards(); }, 300);
    }, true);

    $('safetyPlanFormV63')?.addEventListener('submit', () => {
      window.setTimeout(() => { void decorateCards(); }, 500);
    }, true);
    window.addEventListener('online', () => { void decorateCards(); });
  }

  function installObserver() {
    const list = $('safetyVisitsListV63');
    if (!list) return;
    observer = new MutationObserver(() => { void decorateCards(); });
    observer.observe(list, { childList: true, subtree: false });
  }

  async function boot() {
    rt = await waitReady();
    if (!rt) return;
    wire();
    installObserver();
    await decorateCards();
  }

  void boot();
})();