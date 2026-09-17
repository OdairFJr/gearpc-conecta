(() => {
  if (window.__GEARPC_SAFETY_SIMPLIFY_V73__) return;
  window.__GEARPC_SAFETY_SIMPLIFY_V73__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let rt = null;
  let currentVisitId = null;
  let pendingPhotos = [];
  let photoBusy = false;
  const MAX_PHOTOS = 10;
  const REMOVED_EVAL = 'Entrada de veículo de emergência';

  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

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
      if (current?.client && current?.state?.user && $('safetyVisitFormV63') && $('svPhotoGridV64')) return current;
      await sleep(250);
    }
    return null;
  }

  function hideField(id) {
    const field = $(id);
    const label = field?.closest('label');
    if (label) label.style.display = 'none';
    if (field && 'value' in field) field.value = '';
  }

  function simplifyVisitForm() {
    hideField('svLocalContactV63');
    hideField('svLocalPhoneV63');
    hideField('svEmergencyAccessV63');
    hideField('svEvacuationRouteV63');

    const evaluation = $('svEvaluationV63');
    evaluation?.querySelectorAll('.safety-eval-v63').forEach((row) => {
      const text = String(row.querySelector('strong')?.textContent || '').trim();
      if (text.includes(REMOVED_EVAL)) row.style.display = 'none';
    });

    const emergencySection = $('svHospitalV63')?.closest('.safety-section-v63');
    const heading = emergencySection?.querySelector('h3');
    if (heading) heading.textContent = '4. Emergência';

    const photoSection = $('svPhotosSectionV64');
    const note = photoSection?.querySelector('.safety-note-v63');
    if (note) note.textContent = 'Até 10 fotos do local. Você pode tirar fotos na hora ou escolher imagens já existentes no celular.';
  }

  function clearRemovedFieldsBeforeSave() {
    ['svLocalContactV63','svLocalPhoneV63','svEmergencyAccessV63','svEvacuationRouteV63'].forEach((id) => {
      const field = $(id);
      if (field && 'value' in field) field.value = '';
    });
  }

  function cleanVisitRecord(record) {
    if (!record) return record;
    delete record.localContact;
    delete record.localPhone;
    delete record.emergencyAccess;
    delete record.evacuationRoute;
    if (Array.isArray(record.evaluation)) {
      record.evaluation = record.evaluation.filter((entry) => !String(entry?.item || '').includes(REMOVED_EVAL));
    }
    return record;
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
    if (!visitId) return [];
    try {
      const db = await openPhotoDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('visitPhotos', 'readonly');
        const req = tx.objectStore('visitPhotos').get(visitId);
        req.onsuccess = () => resolve(Array.isArray(req.result?.photos) ? req.result.photos.slice(0, MAX_PHOTOS) : []);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      });
    } catch (_) {
      return [];
    }
  }

  async function savePhotos(visitId, photos) {
    if (!visitId) return;
    const db = await openPhotoDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('visitPhotos', 'readwrite');
      tx.objectStore('visitPhotos').put({ visitId, photos: photos.slice(0, MAX_PHOTOS) });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  function renderPhotos() {
    const grid = $('svPhotoGridV64');
    if (!grid) return;
    grid.innerHTML = pendingPhotos.length
      ? pendingPhotos.map((photo) => `<div class="safety-photo-v64"><img src="${photo.dataUrl}" alt="Foto do local"><button type="button" data-remove-photo-v73="${esc(photo.id)}" aria-label="Remover foto">×</button></div>`).join('')
      : '<p class="safety-note-v63" style="grid-column:1/-1">Nenhuma foto adicionada.</p>';

    let counter = $('svPhotoCounterV73');
    if (!counter) {
      counter = document.createElement('p');
      counter.id = 'svPhotoCounterV73';
      counter.className = 'safety-note-v63';
      counter.style.marginTop = '7px';
      grid.insertAdjacentElement('afterend', counter);
    }
    counter.textContent = `${pendingPhotos.length}/${MAX_PHOTOS} fotos`;
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
    if (photoBusy) return;
    const remaining = Math.max(0, MAX_PHOTOS - pendingPhotos.length);
    if (!remaining) return alert('O limite é de 10 fotos por visita.');
    const list = [...files].slice(0, remaining);
    photoBusy = true;
    try {
      for (const file of list) {
        try { pendingPhotos.push(await compressImage(file)); } catch (_) {}
      }
      renderPhotos();
      if ([...files].length > remaining) alert('Foram adicionadas apenas as fotos necessárias para completar o limite de 10.');
    } finally {
      photoBusy = false;
    }
  }

  async function hydratePhotos(visitId) {
    pendingPhotos = visitId ? await loadPhotos(visitId) : [];
    renderPhotos();
  }

  function findSavedVisit(beforeIds) {
    const store = readStore();
    let visit = currentVisitId ? store.visits.find((item) => item.id === currentVisitId) : null;
    if (!visit) visit = store.visits.find((item) => !beforeIds.has(item.id));
    if (!visit) visit = [...store.visits].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))[0] || null;
    return { store, visit };
  }

  async function finalizeVisitSave(beforeIds, photos) {
    await sleep(250);
    const { store, visit } = findSavedVisit(beforeIds);
    if (!visit) return;
    cleanVisitRecord(visit);
    visit.photosCount = photos.length;
    writeStore(store);
    try { await savePhotos(visit.id, photos); } catch (_) {}
    currentVisitId = visit.id;
  }

  function cleanupReview() {
    const body = $('safetyReviewBodyV67');
    if (!body) return;
    body.querySelectorAll('.safety-review-grid-v67 > div').forEach((box) => {
      const title = String(box.querySelector('strong')?.textContent || '').trim();
      if (title === 'Evacuação' || title.includes(REMOVED_EVAL)) box.remove();
    });
  }

  function formatDate(value) {
    if (!value) return '—';
    try { return new Date(value).toLocaleString('pt-BR'); } catch (_) { return String(value); }
  }

  async function printSimplified(visitId, printWindow) {
    try {
      const { data, error } = await rt.client
        .from('safety_approval_test_v67')
        .select('activity_name,status,dme_comment,reviewed_at,document_payload')
        .eq('visit_id', visitId)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.status !== 'aprovado') throw new Error('A impressão só é liberada depois da aprovação do DME.');

      const payload = data.document_payload || {};
      const v = payload.visit || {};
      const p = payload.plan || {};
      const evaluations = (v.evaluation || []).filter((entry) => !String(entry?.item || '').includes(REMOVED_EVAL));
      const evals = evaluations.map((entry) => `<tr><td>${esc(entry.item)}</td><td>${esc(entry.status || '—')}</td><td>${esc(entry.note || '')}</td></tr>`).join('');
      const risks = (p.risks || []).map((risk) => `<tr><td>${esc(risk.name || '')}</td><td>${esc(risk.prob || '')}</td><td>${esc(risk.severity || '')}</td><td>${esc(risk.prevention || '')}</td><td>${esc(risk.responsible || '')}</td></tr>`).join('');
      const photos = (payload.photos || []).slice(0, MAX_PHOTOS).map((photo) => `<img src="${photo.dataUrl}" alt="Foto do local">`).join('');

      printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(data.activity_name || 'Segurança')}</title><style>@page{size:A4;margin:12mm}body{font-family:Arial,sans-serif;color:#1f3447;font-size:11px;line-height:1.35}h1{font-size:18px;margin:0}h2{font-size:14px;border-bottom:1px solid #9fb0bf;padding-bottom:4px;margin-top:17px}table{width:100%;border-collapse:collapse;margin:7px 0}td,th{border:1px solid #bdc9d3;padding:5px;vertical-align:top}th{background:#eef3f7;text-align:left}.head{display:flex;align-items:center;gap:12px;border-bottom:2px solid #17324d;padding-bottom:10px}.head img{width:58px;height:58px;object-fit:contain}.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.box{border:1px solid #c9d3dc;border-radius:5px;padding:7px;break-inside:avoid}.approved{border:2px solid #3f7d50;background:#eef8f0;padding:9px;border-radius:7px;margin:12px 0;break-inside:avoid}.photos{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.photos img{width:100%;max-height:220px;object-fit:cover;break-inside:avoid}.footer{margin-top:16px;border-top:1px solid #aaa;padding-top:7px;font-size:9px;color:#657383}@media print{button{display:none}}</style></head><body>
        <div class="head"><img src="logo-grupo.jpeg"><div><h1>Relatório de Visita Técnica e Plano de Segurança</h1><div>Grupo Escoteiro do Ar Paulo Carzino — GEArPC</div></div></div>
        <div class="approved"><strong>APROVADO PELO DIRETOR DE MÉTODOS EDUCATIVOS</strong><br>Data da análise: ${esc(formatDate(data.reviewed_at))}${data.dme_comment ? `<br>Parecer: ${esc(data.dme_comment)}` : ''}</div>
        <h2>1. Identificação</h2><div class="grid"><div class="box"><strong>Atividade</strong><br>${esc(v.activityName || p.activityName || '—')}</div><div class="box"><strong>Local</strong><br>${esc(v.location || p.location || '—')}<br>${esc(v.address || p.address || '')}</div><div class="box"><strong>Início</strong><br>${esc(v.activityStartDate || v.activityDate || p.activityStartDate || p.date || '—')} ${esc(v.activityStartTime || p.activityStartTime || '')}</div><div class="box"><strong>Término</strong><br>${esc(v.activityEndDate || p.activityEndDate || '—')} ${esc(v.activityEndTime || p.activityEndTime || '')}</div><div class="box"><strong>Seções</strong><br>${esc((v.sections || p.sections || []).join(', ') || '—')}</div><div class="box"><strong>Adultos na visita</strong><br>${esc((v.visitorsList || []).join(', ') || v.visitors || '—')}</div></div>
        <h2>2. Visita técnica</h2>${evals ? `<table><thead><tr><th>Item</th><th>Situação</th><th>Observação</th></tr></thead><tbody>${evals}</tbody></table>` : ''}<div class="grid"><div class="box"><strong>Hospital / UPA</strong><br>${esc(v.hospital || '—')}<br>${esc(v.hospitalAddress || '')}</div><div class="box"><strong>Providências / observações</strong><br>${esc(v.measures || '—')}</div><div class="box"><strong>Mapa</strong><br>${esc(v.mapsLink || '—')}</div></div>
        <h2>3. Plano de segurança</h2><div class="grid"><div class="box"><strong>Coordenador</strong><br>${esc(p.coordinator || v.coordinator || '—')}</div><div class="box"><strong>Responsável pela segurança</strong><br>${esc(p.safetyLead || '—')}</div><div class="box"><strong>Primeiros socorros</strong><br>${esc(p.firstAidLead || '—')}</div><div class="box"><strong>Transporte / rota</strong><br>${esc(p.transport || '—')}<br>${esc(p.route || '')}</div></div>
        ${risks ? `<h2>4. Análise de riscos</h2><table><thead><tr><th>Risco</th><th>Prob.</th><th>Grav.</th><th>Prevenção</th><th>Responsável</th></tr></thead><tbody>${risks}</tbody></table>` : ''}
        <h2>5. Procedimentos de emergência</h2><div class="grid">${Object.entries(p.emergency || {}).map(([key,val]) => `<div class="box"><strong>${esc(key)}</strong><br>${esc(val || '—')}</div>`).join('')}</div>
        ${photos ? `<h2>6. Fotos da visita</h2><div class="photos">${photos}</div>` : ''}
        <div class="footer">Documento correspondente à versão aprovada pelo DME no GEArPC Conecta.</div><script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`);
      printWindow.document.close();
    } catch (error) {
      try { printWindow.close(); } catch (_) {}
      alert(error?.message || 'Não foi possível gerar a impressão.');
    }
  }

  function wire() {
    window.addEventListener('change', (event) => {
      if (!event.target.matches('#svCameraV64,#svGalleryV64')) return;
      event.stopImmediatePropagation();
      const files = event.target.files || [];
      void addPhotoFiles(files);
      event.target.value = '';
    }, true);

    window.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-remove-photo-v73]');
      if (remove) {
        event.preventDefault();
        event.stopImmediatePropagation();
        pendingPhotos = pendingPhotos.filter((photo) => photo.id !== remove.dataset.removePhotoV73);
        renderPhotos();
        return;
      }

      const print = event.target.closest('[data-print-v67]');
      if (print) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const popup = window.open('', '_blank');
        if (!popup) return alert('O navegador bloqueou a janela de impressão. Permita pop-ups para o GEArPC Conecta.');
        void printSimplified(print.dataset.printV67, popup);
        return;
      }

      const newVisit = event.target.closest('#newSafetyVisitV63');
      const editVisit = event.target.closest('[data-edit-visit]');
      const review = event.target.closest('[data-review-v67]');
      if (newVisit) {
        currentVisitId = null;
        window.setTimeout(() => { pendingPhotos = []; simplifyVisitForm(); renderPhotos(); }, 120);
      }
      if (editVisit) {
        currentVisitId = editVisit.dataset.editVisit || null;
        window.setTimeout(() => { simplifyVisitForm(); void hydratePhotos(currentVisitId); }, 150);
      }
      if (review) window.setTimeout(cleanupReview, 80);
    }, true);

    window.addEventListener('submit', (event) => {
      if (event.target?.id !== 'safetyVisitFormV63') return;
      clearRemovedFieldsBeforeSave();
      const beforeIds = new Set(readStore().visits.map((visit) => visit.id));
      const photos = [...pendingPhotos];
      void finalizeVisitSave(beforeIds, photos);
    }, true);
  }

  async function boot() {
    rt = await waitReady();
    if (!rt) return;
    simplifyVisitForm();
    wire();
  }

  void boot();
})();