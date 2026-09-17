(() => {
  if (window.__GEARPC_SAFETY_INAPP_CAMERA_V76__) return;
  window.__GEARPC_SAFETY_INAPP_CAMERA_V76__ = true;

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let stream = null;
  let overlay = null;
  let opening = false;

  function injectStyles() {
    if ($('safetyInAppCameraStylesV76')) return;
    const style = document.createElement('style');
    style.id = 'safetyInAppCameraStylesV76';
    style.textContent = `
      .safety-inapp-camera-button-v76{border:1px dashed #94aabd;border-radius:12px;padding:12px;background:#fff;color:#24435e;font-weight:700;text-align:center;cursor:pointer;font:inherit}
      .safety-camera-overlay-v76{position:fixed;inset:0;z-index:2147483646;background:#06111c;display:flex;flex-direction:column;color:#fff}
      .safety-camera-head-v76{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;background:rgba(0,0,0,.34)}
      .safety-camera-head-v76 strong{font-size:1rem}.safety-camera-close-v76{border:0;border-radius:999px;width:42px;height:42px;background:rgba(255,255,255,.16);color:#fff;font-size:25px;cursor:pointer}
      .safety-camera-stage-v76{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background:#000;overflow:hidden}
      .safety-camera-stage-v76 video{width:100%;height:100%;object-fit:cover;display:block}
      .safety-camera-hint-v76{position:absolute;left:12px;right:12px;bottom:12px;margin:0 auto;max-width:540px;text-align:center;background:rgba(0,0,0,.5);padding:8px 10px;border-radius:10px;font-size:.82rem}
      .safety-camera-actions-v76{display:flex;align-items:center;justify-content:center;gap:18px;padding:18px;background:#06111c}
      .safety-camera-shot-v76{width:76px;height:76px;border-radius:999px;border:6px solid #fff;background:#dfe7ed;box-shadow:0 0 0 3px rgba(255,255,255,.25) inset;cursor:pointer}
      .safety-camera-cancel-v76{border:0;border-radius:10px;padding:10px 14px;background:#263949;color:#fff;font-weight:800;cursor:pointer}
      .safety-camera-status-v76{padding:8px 14px;text-align:center;background:#132433;color:#dbe7ef;font-size:.82rem;min-height:20px}
      @media(min-width:800px){.safety-camera-overlay-v76{inset:3vh 12vw;border-radius:18px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.45)}}
    `;
    document.head.appendChild(style);
  }

  function stopStream() {
    try { stream?.getTracks?.().forEach((track) => track.stop()); } catch (_) {}
    stream = null;
  }

  function closeCamera() {
    stopStream();
    overlay?.remove();
    overlay = null;
    document.body.style.overflow = '';
  }

  function frameSize(width, height, maxSide = 800) {
    const scale = Math.min(1, maxSide / Math.max(width || 1, height || 1));
    return {
      width: Math.max(1, Math.round((width || 1) * scale)),
      height: Math.max(1, Math.round((height || 1) * scale))
    };
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Não foi possível gerar a foto.')), 'image/jpeg', 0.58);
    });
  }

  async function sendCapturedBlob(blob) {
    const gallery = $('svGalleryV64');
    if (!gallery) throw new Error('Campo de fotos não encontrado.');
    const file = new File([blob], `visita-${Date.now()}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
    const dt = new DataTransfer();
    dt.items.add(file);
    gallery.files = dt.files;
    gallery.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function takePhoto() {
    const video = $('safetyCameraVideoV76');
    const status = $('safetyCameraStatusV76');
    const shot = $('safetyCameraShotV76');
    if (!video || !video.videoWidth || !video.videoHeight) {
      if (status) status.textContent = 'A câmera ainda está iniciando.';
      return;
    }
    if (shot) shot.disabled = true;
    if (status) status.textContent = 'Salvando foto…';
    try {
      const size = frameSize(video.videoWidth, video.videoHeight, 800);
      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Não foi possível preparar a imagem.');
      ctx.drawImage(video, 0, 0, size.width, size.height);
      const blob = await canvasToBlob(canvas);
      canvas.width = 1;
      canvas.height = 1;
      await sendCapturedBlob(blob);
      closeCamera();
    } catch (error) {
      if (status) status.textContent = error?.message || 'Não foi possível tirar a foto.';
      if (shot) shot.disabled = false;
    }
  }

  function buildOverlay() {
    overlay?.remove();
    overlay = document.createElement('div');
    overlay.className = 'safety-camera-overlay-v76';
    overlay.id = 'safetyCameraOverlayV76';
    overlay.innerHTML = `
      <div class="safety-camera-head-v76"><strong>📷 Foto da visita técnica</strong><button id="safetyCameraCloseV76" class="safety-camera-close-v76" type="button" aria-label="Fechar">×</button></div>
      <div class="safety-camera-stage-v76"><video id="safetyCameraVideoV76" autoplay playsinline muted></video><p class="safety-camera-hint-v76">A câmera permanece dentro do GEArPC Conecta. Enquadre o local e toque no botão branco.</p></div>
      <div id="safetyCameraStatusV76" class="safety-camera-status-v76">Abrindo câmera…</div>
      <div class="safety-camera-actions-v76"><button id="safetyCameraCancelV76" class="safety-camera-cancel-v76" type="button">Cancelar</button><button id="safetyCameraShotV76" class="safety-camera-shot-v76" type="button" aria-label="Tirar foto"></button></div>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    $('safetyCameraCloseV76')?.addEventListener('click', closeCamera);
    $('safetyCameraCancelV76')?.addEventListener('click', closeCamera);
    $('safetyCameraShotV76')?.addEventListener('click', () => void takePhoto());
  }

  async function openCamera() {
    if (opening || overlay) return;
    opening = true;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('A câmera interna não está disponível neste aparelho. Use “Escolher da galeria”.');
        return;
      }
      buildOverlay();
      const status = $('safetyCameraStatusV76');
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        });
      } catch (firstError) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      }
      const video = $('safetyCameraVideoV76');
      if (!video) throw new Error('Tela da câmera não encontrada.');
      video.srcObject = stream;
      await video.play();
      if (status) status.textContent = 'Câmera pronta.';
    } catch (error) {
      closeCamera();
      const name = String(error?.name || '');
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        alert('O GEArPC Conecta precisa de permissão para usar a câmera. Autorize a câmera nas permissões do app/navegador e tente novamente.');
      } else if (name === 'NotReadableError') {
        alert('A câmera já está sendo usada por outro aplicativo. Feche o outro uso da câmera e tente novamente.');
      } else {
        alert(`Não foi possível abrir a câmera dentro do app. ${error?.message || ''}`.trim());
      }
    } finally {
      opening = false;
    }
  }

  function installButton() {
    const actions = document.querySelector('.safety-photo-actions-v64');
    const oldInput = $('svCameraV64');
    if (!actions || !oldInput) return false;

    const oldLabel = oldInput.closest('label');
    if (oldLabel) oldLabel.style.display = 'none';
    oldInput.removeAttribute('capture');

    if (!$('safetyInAppCameraButtonV76')) {
      const btn = document.createElement('button');
      btn.id = 'safetyInAppCameraButtonV76';
      btn.type = 'button';
      btn.className = 'safety-inapp-camera-button-v76';
      btn.textContent = '📷 Tirar foto';
      btn.addEventListener('click', () => void openCamera());
      actions.prepend(btn);
    }

    const note = $('svPhotosSectionV64')?.querySelector('.safety-note-v63');
    if (note) note.textContent = 'Até 10 fotos do local. As fotos tiradas pelo botão abaixo usam a câmera dentro do próprio app e são compactadas automaticamente.';
    return true;
  }

  async function boot() {
    injectStyles();
    for (let i = 0; i < 180; i += 1) {
      if (installButton()) break;
      await sleep(200);
    }
    new MutationObserver(() => installButton()).observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('pagehide', stopStream);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && overlay) closeCamera();
    });
  }

  void boot();
})();
