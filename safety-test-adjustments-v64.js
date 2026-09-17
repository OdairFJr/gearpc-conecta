(() => {
  if (window.__GEARPC_SAFETY_TEST_ADJUSTMENTS_V64__) return;
  window.__GEARPC_SAFETY_TEST_ADJUSTMENTS_V64__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let currentVisitId = null;
  let currentPlanId = null;
  let currentBaseVisitId = null;
  let pendingPhotos = [];

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

  function writeStore(store) {
    localStorage.setItem(storageKey(), JSON.stringify(store));
  }

  async function waitReady() {
    for (let i = 0; i < 160; i += 1) {
      const current = window.GEARPC_RUNTIME;
      if (current?.state?.user && $('safetyVisitFormV63') && $('safetyPlanFormV63')) return current;
      await sleep(250);
    }
    return null;
  }

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function activeAdults() {
    const names = (rt?.state?.chefes || [])
      .filter((chief) => chief.ativo !== false)
      .map((chief) => String(chief.nome_completo || '').trim())
      .filter(Boolean);
    const me = String(rt?.state?.profile?.nome_completo || '').trim();
    if (me) names.push(me);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  function injectStyles() {
    if ($('safetyAdjustStylesV64')) return;
    const style = document.createElement('style');
    style.id = 'safetyAdjustStylesV64';
    style.textContent = `
      .safety-visitors-v64{margin-top:10px}
      .safety-photo-actions-v64{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
      .safety-photo-input-v64{position:relative;border:1px dashed #94aabd;border-radius:12px;padding:12px;background:#fff;color:#24435e;font-weight:700;text-align:center;cursor:pointer}
      .safety-photo-input-v64 input{position:absolute;inset:0;opacity:0;cursor:pointer}
      .safety-photo-grid-v64{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}
      .safety-photo-v64{position:relative;aspect-ratio:4/3;border:1px solid #dce6ee;border-radius:10px;overflow:hidden;background:#eef3f7}
      .safety-photo-v64 img{width:100%;height:100%;object-fit:cover;display:block}
      .safety-photo-v64 button{position:absolute;top:5px;right:5px;border:0;border-radius:999px;width:30px;height:30px;background:rgba(20,35,48,.78);color:#fff;font-size:18px;cursor:pointer}
      .safety-offline-note-v64{margin-top:8px;padding:9px 10px;border-radius:10px;background:#edf7f0;color:#2d6640;font-size:.8rem;line-height:1.4}
      .safety-map-row-v64{display:flex;gap:8px;align-items:end}
      .safety-map-row-v64 label{flex:1}
      .safety-map-open-v64{border:1px solid #cbd8e3;background:#fff;color:#24435e;border-radius:10px;padding:10px 12px;font-weight:700;cursor:pointer;white-space:nowrap}
      @media(max-width:720px){.safety-photo-actions-v64,.safety-photo-grid-v64{grid-template-columns:1fr 1fr}.safety-map-row-v64{display:grid;grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function hideLabelFor(id) {
    const input = $(id);
    const label = input?.closest('label');
    if (label) label.style.display = 'none';
    return label;
  }

  function installVisitFields() {
    if ($('svStartDateV64')) return;
    const oldDateLabel = hideLabelFor('svActivityDateV63');
    oldDateLabel?.insertAdjacentHTML('beforebegin', `
      <label>Data de início<input id="svStartDateV64" type="date" /></label>
      <label>Hora de início<input id="svStartTimeV64" type="time" /></label>
      <label>Data de término<input id="svEndDateV64" type="date" /></label>
      <label>Hora de término<input id="svEndTimeV64" type="time" /></label>`);

    const addressLabel = $('svAddressV63')?.closest('label');
    addressLabel?.insertAdjacentHTML('afterend', `
      <label>Link do local no Google Maps<input id="svMapsLinkV64" type="url" inputmode="url" placeholder="Cole aqui o link do Maps" /></label>`);

    const visitorsLabel = hideLabelFor('svVisitorsV63');
    visitorsLabel?.insertAdjacentHTML('beforebegin', `
      <div class="safety-visitors-v64" style="grid-column:1/-1"><label>Adultos que fizeram a visita</label><div id="svVisitorsChoicesV64" class="safety-check-grid-v63"></div><p class="safety-note-v63" style="margin-top:6px">Selecione todos os adultos presentes na visita técnica.</p></div>`);

    const visitSections = [...$('safetyVisitFormV63').querySelectorAll('.safety-section-v63')];
    const evaluationSection = visitSections.find((section) => section.querySelector('#svEvaluationV63'));
    if (evaluationSection) {
      evaluationSection.insertAdjacentHTML('afterend', `
        <section id="svPhotosSectionV64" class="safety-section-v63">
          <h3>3. Fotos e localização</h3>
          <p class="safety-note-v63">Até 6 fotos do local. Você pode tirar a foto na hora ou escolher imagens já existentes no celular.</p>
          <div class="safety-photo-actions-v64">
            <label class="safety-photo-input-v64">📷 Tirar foto<input id="svCameraV64" type="file" accept="image/*" capture="environment" /></label>
            <label class="safety-photo-input-v64">🖼️ Escolher da galeria<input id="svGalleryV64" type="file" accept="image/*" multiple /></label>
          </div>
          <div id="svPhotoGridV64" class="safety-photo-grid-v64"></div>
          <div class="safety-offline-note-v64">📴 O relatório e as fotos podem ser preenchidos sem internet depois que esta versão tiver sido aberta ao menos uma vez com conexão.</div>
        </section>`);
      const sections = [...$('safetyVisitFormV63').querySelectorAll('.safety-section-v63')];
      const emergency = sections.find((section) => section.querySelector('#svHospitalV63'));
      const conclusion = sections.find((section) => section.querySelector('#svConclusionV63'));
      if (emergency?.querySelector('h3')) emergency.querySelector('h3').textContent = '4. Emergência e evacuação';
      if (conclusion?.querySelector('h3')) conclusion.querySelector('h3').textContent = '5. Conclusão da visita';
    }

    renderVisitorChoices([]);
  }

  function installPlanFields() {
    if ($('spStartDateV64')) return;
    const oldDateLabel = hideLabelFor('spDateV63');
    oldDateLabel?.insertAdjacentHTML('beforebegin', `
      <label>Data de início<input id="spStartDateV64" type="date" required /></label>
      <label>Hora de início<input id="spStartTimeV64" type="time" /></label>
      <label>Data de término<input id="spEndDateV64" type="date" required /></label>
      <label>Hora de término<input id="spEndTimeV64" type="time" /></label>`);
    const addressLabel = $('spAddressV63')?.closest('label');
    addressLabel?.insertAdjacentHTML('afterend', `<label>Link do local no Google Maps<input id="spMapsLinkV64" type="url" inputmode="url" placeholder="Cole aqui o link do Maps" /></label>`);
  }

  function renderVisitorChoices(selected) {
    const box = $('svVisitorsChoicesV64');
    if (!box) return;
    const selectedSet = new Set(selected || []);
    box.innerHTML = activeAdults().map((name) => `
      <label class="safety-check-option-v63"><input type="checkbox" value="${esc(name)}" ${selectedSet.has(name) ? 'checked' : ''}/><span>${esc(name)}</span></label>`).join('');
    syncVisitorsHidden();
  }

  function selectedVisitors() {
    return [...($('svVisitorsChoicesV64')?.querySelectorAll('input:checked') || [])].map((input) => input.value);
  }

  function syncVisitorsHidden() {
    const hidden = $('svVisitorsV63');
    if (hidden) hidden.value = selectedVisitors().join(', ');
  }

  function specialEvaluation(record) {
    const stored = new Map((record?.evaluation || []).map((entry) => [entry.item, entry.status]));
    [...($('svEvaluationV63')?.querySelectorAll('.safety-eval-v63') || [])].forEach((row) => {
      const title = row.querySelector('strong');
      const select = row.querySelector('[data-field="status"]');
      if (!title || !select) return;
      const text = title.textContent || '';
      const oldStatus = stored.get(text) || select.value;
      if (text.includes('Rios, lagos, piscinas')) {
        title.textContent = 'Existe rio, lago, piscina ou outro corpo d’água no local?';
        select.innerHTML = '<option value="nao">Não</option><option value="sim">Sim</option><option value="na">Não verificado</option>';
        select.value = ['sim', 'nao', 'na'].includes(oldStatus) ? oldStatus : 'na';
      }
      if (text.includes('Abrigo para temporal')) {
        title.textContent = 'Existe abrigo adequado para temporal?';
        select.innerHTML = '<option value="sim">Sim</option><option value="nao">Não</option><option value="na">Não verificado</option>';
        select.value = ['sim', 'nao', 'na'].includes(oldStatus) ? oldStatus : 'na';
      }
    });
  }

  function visitRecord(id) {
    return readStore().visits.find((visit) => visit.id === id) || null;
  }

  function planRecord(id) {
    return readStore().plans.find((plan) => plan.id === id) || null;
  }

  function hydrateVisit(id = null) {
    currentVisitId = id || null;
    const record = id ? visitRecord(id) : null;
    $('svStartDateV64').value = record?.activityStartDate || record?.activityDate || '';
    $('svStartTimeV64').value = record?.activityStartTime || '';
    $('svEndDateV64').value = record?.activityEndDate || record?.activityDate || '';
    $('svEndTimeV64').value = record?.activityEndTime || '';
    $('svMapsLinkV64').value = record?.mapsLink || '';
    const visitors = Array.isArray(record?.visitorsList)
      ? record.visitorsList
      : String(record?.visitors || $('svVisitorsV63')?.value || '').split(',').map((x) => x.trim()).filter(Boolean);
    renderVisitorChoices(visitors);
    specialEvaluation(record);
    pendingPhotos = [];
    renderPhotos();
    if (id) loadPhotos(id).then((photos) => { pendingPhotos = photos; renderPhotos(); }).catch(() => {});
  }

  function hydratePlan(id = null, baseVisitId = null) {
    currentPlanId = id || null;
    currentBaseVisitId = baseVisitId || null;
    const record = id ? planRecord(id) : null;
    const base = !record && baseVisitId ? visitRecord(baseVisitId) : null;
    $('spStartDateV64').value = record?.activityStartDate || base?.activityStartDate || record?.date || base?.activityDate || '';
    $('spStartTimeV64').value = record?.activityStartTime || base?.activityStartTime || '';
    $('spEndDateV64').value = record?.activityEndDate || base?.activityEndDate || record?.date || base?.activityDate || '';
    $('spEndTimeV64').value = record?.activityEndTime || base?.activityEndTime || '';
    $('spMapsLinkV64').value = record?.mapsLink || base?.mapsLink || '';
  }

  function applyBaseVisitExtras(id) {
    currentBaseVisitId = id || null;
    const base = id ? visitRecord(id) : null;
    if (!base) return;
    $('spStartDateV64').value = base.activityStartDate || base.activityDate || '';
    $('spStartTimeV64').value = base.activityStartTime || '';
    $('spEndDateV64').value = base.activityEndDate || base.activityDate || '';
    $('spEndTimeV64').value = base.activityEndTime || '';
    $('spMapsLinkV64').value = base.mapsLink || '';
  }

  function openPhotoDb() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB indisponível'));
      const request = indexedDB.open('gearpc-safety-test-v64', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('visitPhotos')) db.createObjectStore('visitPhotos', { keyPath: 'visitId' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function loadPhotos(visitId) {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('visitPhotos', 'readonly');
      const req = tx.objectStore('visitPhotos').get(visitId);
      req.onsuccess = () => resolve(Array.isArray(req.result?.photos) ? req.result.photos : []);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  }

  async function savePhotos(visitId, photos) {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('visitPhotos', 'readwrite');
      tx.objectStore('visitPhotos').put({ visitId, photos });
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  async function deletePhotos(visitId) {
    try {
      const db = await openPhotoDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction('visitPhotos', 'readwrite');
        tx.objectStore('visitPhotos').delete(visitId);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch (_) {}
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Imagem inválida'));
        image.onload = () => {
          const max = 900;
          const scale = Math.min(1, max / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve({
            id: `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name: file.name || 'foto.jpg',
            dataUrl: canvas.toDataURL('image/jpeg', 0.68),
            createdAt: new Date().toISOString()
          });
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function addPhotoFiles(files) {
    const remaining = Math.max(0, 6 - pendingPhotos.length);
    if (!remaining) {
      alert('O limite desta versão de teste é de 6 fotos por visita.');
      return;
    }
    const list = [...files].slice(0, remaining);
    for (const file of list) {
      try { pendingPhotos.push(await compressImage(file)); } catch (_) {}
    }
    renderPhotos();
  }

  function renderPhotos() {
    const grid = $('svPhotoGridV64');
    if (!grid) return;
    grid.innerHTML = pendingPhotos.length
      ? pendingPhotos.map((photo) => `<div class="safety-photo-v64"><img src="${photo.dataUrl}" alt="Foto do local"/><button type="button" data-remove-photo-v64="${esc(photo.id)}" aria-label="Remover foto">×</button></div>`).join('')
      : '<p class="safety-note-v63" style="grid-column:1/-1">Nenhuma foto adicionada.</p>';
  }

  function openMaps(url) {
    const link = String(url || '').trim();
    if (!link) return alert('Cole primeiro o link do local no Google Maps.');
    try {
      const parsed = new URL(link);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
      window.open(parsed.href, '_blank', 'noopener');
    } catch (_) {
      alert('O link informado não parece válido.');
    }
  }

  function installMapButtons() {
    const visitInput = $('svMapsLinkV64');
    if (visitInput && !$('svOpenMapsV64')) {
      const label = visitInput.closest('label');
      const wrapper = document.createElement('div');
      wrapper.className = 'safety-map-row-v64';
      label.parentNode.insertBefore(wrapper, label);
      wrapper.appendChild(label);
      wrapper.insertAdjacentHTML('beforeend', '<button id="svOpenMapsV64" class="safety-map-open-v64" type="button">Abrir Maps</button>');
    }
    const planInput = $('spMapsLinkV64');
    if (planInput && !$('spOpenMapsV64')) {
      const label = planInput.closest('label');
      const wrapper = document.createElement('div');
      wrapper.className = 'safety-map-row-v64';
      label.parentNode.insertBefore(wrapper, label);
      wrapper.appendChild(label);
      wrapper.insertAdjacentHTML('beforeend', '<button id="spOpenMapsV64" class="safety-map-open-v64" type="button">Abrir Maps</button>');
    }
  }

  function enrichVisitAfterSave(beforeIds, extras, photos) {
    window.setTimeout(async () => {
      const store = readStore();
      let record = currentVisitId ? store.visits.find((visit) => visit.id === currentVisitId) : null;
      if (!record) record = store.visits.find((visit) => !beforeIds.has(visit.id)) || [...store.visits].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
      if (!record) return;
      Object.assign(record, extras, { photosCount: photos.length });
      writeStore(store);
      try { await savePhotos(record.id, photos); } catch (_) {}
      currentVisitId = record.id;
    }, 0);
  }

  function enrichPlanAfterSave(beforeIds, extras) {
    window.setTimeout(() => {
      const store = readStore();
      let record = currentPlanId ? store.plans.find((plan) => plan.id === currentPlanId) : null;
      if (!record) record = store.plans.find((plan) => !beforeIds.has(plan.id)) || [...store.plans].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
      if (!record) return;
      Object.assign(record, extras);
      writeStore(store);
      currentPlanId = record.id;
    }, 0);
  }

  function wire() {
    $('svVisitorsChoicesV64')?.addEventListener('change', syncVisitorsHidden);
    $('svCameraV64')?.addEventListener('change', (event) => { addPhotoFiles(event.target.files || []); event.target.value = ''; });
    $('svGalleryV64')?.addEventListener('change', (event) => { addPhotoFiles(event.target.files || []); event.target.value = ''; });
    $('svPhotoGridV64')?.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-remove-photo-v64]');
      if (!btn) return;
      pendingPhotos = pendingPhotos.filter((photo) => photo.id !== btn.dataset.removePhotoV64);
      renderPhotos();
    });
    $('svOpenMapsV64')?.addEventListener('click', () => openMaps($('svMapsLinkV64')?.value));
    $('spOpenMapsV64')?.addEventListener('click', () => openMaps($('spMapsLinkV64')?.value));

    document.addEventListener('click', (event) => {
      const newVisit = event.target.closest('#newSafetyVisitV63');
      const editVisit = event.target.closest('[data-edit-visit]');
      const fromVisit = event.target.closest('[data-plan-from-visit]');
      const newPlan = event.target.closest('#newSafetyPlanV63');
      const editPlan = event.target.closest('[data-edit-plan]');
      const delVisit = event.target.closest('[data-delete-visit]');
      if (newVisit) { currentVisitId = null; window.setTimeout(() => hydrateVisit(null), 0); }
      if (editVisit) { currentVisitId = editVisit.dataset.editVisit; window.setTimeout(() => hydrateVisit(currentVisitId), 0); }
      if (fromVisit) { currentPlanId = null; currentBaseVisitId = fromVisit.dataset.planFromVisit; window.setTimeout(() => hydratePlan(null, currentBaseVisitId), 0); }
      if (newPlan) { currentPlanId = null; currentBaseVisitId = null; window.setTimeout(() => hydratePlan(null, null), 0); }
      if (editPlan) { currentPlanId = editPlan.dataset.editPlan; window.setTimeout(() => hydratePlan(currentPlanId, null), 0); }
      if (delVisit) {
        const id = delVisit.dataset.deleteVisit;
        window.setTimeout(() => { if (!visitRecord(id)) deletePhotos(id); }, 0);
      }
    }, true);

    $('spBaseVisitV63')?.addEventListener('change', (event) => window.setTimeout(() => applyBaseVisitExtras(event.target.value), 0));

    $('safetyVisitFormV63')?.addEventListener('submit', () => {
      syncVisitorsHidden();
      const startDate = $('svStartDateV64').value;
      if ($('svActivityDateV63')) $('svActivityDateV63').value = startDate;
      const beforeIds = new Set(readStore().visits.map((visit) => visit.id));
      const extras = {
        activityStartDate: startDate,
        activityStartTime: $('svStartTimeV64').value,
        activityEndDate: $('svEndDateV64').value,
        activityEndTime: $('svEndTimeV64').value,
        mapsLink: $('svMapsLinkV64').value.trim(),
        visitorsList: selectedVisitors()
      };
      enrichVisitAfterSave(beforeIds, extras, [...pendingPhotos]);
    }, true);

    $('safetyPlanFormV63')?.addEventListener('submit', () => {
      const startDate = $('spStartDateV64').value;
      if ($('spDateV63')) $('spDateV63').value = startDate;
      const beforeIds = new Set(readStore().plans.map((plan) => plan.id));
      const extras = {
        activityStartDate: startDate,
        activityStartTime: $('spStartTimeV64').value,
        activityEndDate: $('spEndDateV64').value,
        activityEndTime: $('spEndTimeV64').value,
        mapsLink: $('spMapsLinkV64').value.trim()
      };
      enrichPlanAfterSave(beforeIds, extras);
    }, true);
  }

  function updateBanner() {
    const banner = document.querySelector('.safety-test-banner-v63');
    if (!banner || banner.dataset.offlineV64) return;
    banner.dataset.offlineV64 = '1';
    banner.innerHTML = '<strong>🧪 Versão de teste</strong>Os registros continuam apenas neste aparelho. Depois de abrir esta versão uma vez com internet, a visita técnica pode ser preenchida offline, inclusive com fotos.';
  }

  async function boot() {
    rt = await waitReady();
    if (!rt) return;
    injectStyles();
    installVisitFields();
    installPlanFields();
    installMapButtons();
    updateBanner();
    wire();
  }

  void boot();
})();