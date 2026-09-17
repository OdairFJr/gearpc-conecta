(() => {
  if (window.__GEARPC_SAFETY_PHOTO_MEMORY_V75__) return;
  window.__GEARPC_SAFETY_PHOTO_MEMORY_V75__ = true;

  const MAX_PHOTOS = 10;
  const MAX_SIDE = 800;
  const JPEG_QUALITY = 0.58;
  const MAX_TARGET_BYTES = 220 * 1024;
  let rt = null;
  let currentVisitId = null;
  let pendingPhotos = [];
  let busy = false;

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  async function waitRuntime() {
    for (let i = 0; i < 180; i += 1) {
      const x = window.GEARPC_RUNTIME;
      if (x?.state?.user?.id) { rt = x; return x; }
      await sleep(200);
    }
    return null;
  }

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
    try { localStorage.setItem(storageKey(), JSON.stringify(store)); } catch (_) {}
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
      ? pendingPhotos.map((photo) => `<div class="safety-photo-v64"><img src="${photo.dataUrl}" alt="Foto do local"><button type="button" data-remove-photo-v75="${esc(photo.id)}" aria-label="Remover foto">×</button></div>`).join('')
      : '<p class="safety-note-v63" style="grid-column:1/-1">Nenhuma foto adicionada.</p>';

    let counter = $('svPhotoCounterV73');
    if (!counter) {
      counter = document.createElement('p');
      counter.id = 'svPhotoCounterV73';
      counter.className = 'safety-note-v63';
      counter.style.marginTop = '7px';
      grid.insertAdjacentElement('afterend', counter);
    }
    counter.textContent = `${pendingPhotos.length}/${MAX_PHOTOS} fotos • imagens otimizadas`;
  }

  function targetSize(width, height) {
    const scale = Math.min(1, MAX_SIDE / Math.max(width || 1, height || 1));
    return {
      width: Math.max(1, Math.round((width || 1) * scale)),
      height: Math.max(1, Math.round((height || 1) * scale))
    };
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Falha ao compactar imagem')), type, quality);
    });
  }

  async function readSourceDimensions(file) {
    const buffer = await file.slice(0, 262144).arrayBuffer();
    const view = new DataView(buffer);
    if (view.byteLength >= 24 &&
        view.getUint8(0) === 0x89 && view.getUint8(1) === 0x50 &&
        view.getUint8(2) === 0x4e && view.getUint8(3) === 0x47) {
      return { width: view.getUint32(16, false), height: view.getUint32(20, false) };
    }
    if (view.byteLength >= 10 && view.getUint8(0) === 0xff && view.getUint8(1) === 0xd8) {
      const sof = new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
      let offset = 2;
      while (offset + 9 < view.byteLength) {
        if (view.getUint8(offset) !== 0xff) { offset += 1; continue; }
        const marker = view.getUint8(offset + 1);
        if (sof.has(marker)) {
          return { width: view.getUint16(offset + 7, false), height: view.getUint16(offset + 5, false) };
        }
        if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
          offset += 2;
          continue;
        }
        if (offset + 3 >= view.byteLength) break;
        const length = view.getUint16(offset + 2, false);
        if (length < 2) break;
        offset += 2 + length;
      }
    }
    throw new Error('Dimensões não identificadas');
  }

  async function encodeCanvas(canvas) {
    let blob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
    if (blob.size > MAX_TARGET_BYTES) blob = await canvasToBlob(canvas, 'image/jpeg', 0.46);
    if (blob.size > MAX_TARGET_BYTES * 1.25) blob = await canvasToBlob(canvas, 'image/jpeg', 0.36);
    return blob;
  }

  async function compressWithBitmap(file) {
    if (!('createImageBitmap' in window)) throw new Error('createImageBitmap indisponível');
    const source = await readSourceDimensions(file);
    const wanted = targetSize(source.width, source.height);
    let bitmap;
    try {
      bitmap = await createImageBitmap(file, {
        resizeWidth: wanted.width,
        resizeHeight: wanted.height,
        resizeQuality: 'medium',
        imageOrientation: 'from-image'
      });
    } catch (_) {
      bitmap = await createImageBitmap(file);
    }

    try {
      const size = targetSize(bitmap.width, bitmap.height);
      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Canvas indisponível');
      ctx.drawImage(bitmap, 0, 0, size.width, size.height);
      const blob = await encodeCanvas(canvas);
      const dataUrl = await blobToDataUrl(blob);
      canvas.width = 1;
      canvas.height = 1;
      return dataUrl;
    } finally {
      try { bitmap.close?.(); } catch (_) {}
    }
  }

  async function compressWithObjectUrl(file) {
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Imagem inválida'));
        img.src = url;
      });
      const size = targetSize(image.naturalWidth || image.width, image.naturalHeight || image.height);
      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Canvas indisponível');
      ctx.drawImage(image, 0, 0, size.width, size.height);
      const blob = await encodeCanvas(canvas);
      const dataUrl = await blobToDataUrl(blob);
      canvas.width = 1;
      canvas.height = 1;
      return dataUrl;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function compressImage(file) {
    let dataUrl;
    try { dataUrl = await compressWithBitmap(file); }
    catch (_) { dataUrl = await compressWithObjectUrl(file); }
    return {
      id: `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: file.name || 'foto.jpg',
      dataUrl,
      optimized: true,
      originalBytes: Number(file.size || 0),
      createdAt: new Date().toISOString()
    };
  }

  async function addPhotoFiles(fileList) {
    if (busy) return;
    const files = [...(fileList || [])];
    const remaining = Math.max(0, MAX_PHOTOS - pendingPhotos.length);
    if (!remaining) return alert('O limite é de 10 fotos por visita.');
    busy = true;
    try {
      for (const file of files.slice(0, remaining)) {
        try {
          const photo = await compressImage(file);
          pendingPhotos.push(photo);
          renderPhotos();
          await sleep(30);
        } catch (_) {
          alert('Uma das fotos não pôde ser processada. Tente novamente ou escolha outra imagem.');
        }
      }
      if (files.length > remaining) alert('Foram adicionadas apenas as fotos necessárias para completar o limite de 10.');
    } finally {
      busy = false;
    }
  }

  async function hydrate(visitId) {
    currentVisitId = visitId || null;
    pendingPhotos = currentVisitId ? await loadPhotos(currentVisitId) : [];
    renderPhotos();
  }

  async function persistAfterVisitSave(beforeIds, photos) {
    await sleep(900);
    const store = readStore();
    let visit = currentVisitId ? store.visits.find((item) => item.id === currentVisitId) : null;
    if (!visit) visit = store.visits.find((item) => !beforeIds.has(item.id));
    if (!visit) visit = [...store.visits].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))[0] || null;
    if (!visit) return;
    visit.photosCount = photos.length;
    writeStore(store);
    try { await savePhotos(visit.id, photos); } catch (_) {}
    currentVisitId = visit.id;
  }

  // Registrado cedo (via config.js), antes dos módulos antigos de foto.
  window.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.matches('#svCameraV64,#svGalleryV64')) return;
    event.stopImmediatePropagation();
    const files = target.files || [];
    void addPhotoFiles(files);
    target.value = '';
  }, true);

  window.addEventListener('click', (event) => {
    const remove = event.target.closest?.('[data-remove-photo-v75]');
    if (remove) {
      event.preventDefault();
      event.stopImmediatePropagation();
      pendingPhotos = pendingPhotos.filter((photo) => photo.id !== remove.dataset.removePhotoV75);
      renderPhotos();
      return;
    }

    const newVisit = event.target.closest?.('#newSafetyVisitV63');
    const editVisit = event.target.closest?.('[data-edit-visit]');
    if (newVisit) {
      currentVisitId = null;
      pendingPhotos = [];
      setTimeout(renderPhotos, 250);
    }
    if (editVisit) {
      const id = editVisit.dataset.editVisit || null;
      void hydrate(id);
      setTimeout(() => { void hydrate(id); }, 450);
    }
  }, true);

  window.addEventListener('submit', (event) => {
    if (event.target?.id !== 'safetyVisitFormV63') return;
    const beforeIds = new Set(readStore().visits.map((visit) => visit.id));
    const photos = pendingPhotos.slice(0, MAX_PHOTOS);
    void persistAfterVisitSave(beforeIds, photos);
  }, true);

  void waitRuntime();
})();
