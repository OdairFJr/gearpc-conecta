(() => {
  if (window.__GEARPC_SAFETY_CAMERA_REMOVED_V78__) return;
  window.__GEARPC_SAFETY_CAMERA_REMOVED_V78__ = true;

  const style = document.createElement('style');
  style.id = 'safetyCameraRemovedStylesV78';
  style.textContent = `
    #svCameraV64{display:none!important;pointer-events:none!important}
    .safety-photo-actions-v64 label:has(#svCameraV64){display:none!important}
    .safety-photo-actions-v64{grid-template-columns:1fr!important}
    .safety-photo-actions-v64 label:has(#svGalleryV64){display:block!important;width:100%!important}
  `;
  document.head.appendChild(style);

  function finalizePhotoArea() {
    const camera = document.getElementById('svCameraV64');
    if (camera) {
      camera.removeAttribute('capture');
      camera.disabled = true;
      const label = camera.closest('label');
      if (label) label.style.display = 'none';
    }

    const gallery = document.getElementById('svGalleryV64');
    const galleryLabel = gallery?.closest('label');
    if (galleryLabel) {
      galleryLabel.style.display = 'block';
      galleryLabel.style.width = '100%';
    }

    const actions = document.querySelector('.safety-photo-actions-v64');
    if (actions) actions.style.gridTemplateColumns = '1fr';

    const note = document.querySelector('#svPhotosSectionV64 .safety-note-v63');
    if (note) note.textContent = 'Até 10 fotos do local. Para adicionar imagens, use “Escolher da galeria”.';
  }

  [0, 300, 800, 1600, 3200, 6000].forEach((delay) => setTimeout(finalizePhotoArea, delay));

  document.addEventListener('click', (event) => {
    if (!event.target?.closest?.('#safetyButtonV63,#newSafetyVisitV63,[data-edit-visit],[data-plan-from-visit]')) return;
    setTimeout(finalizePhotoArea, 50);
    setTimeout(finalizePhotoArea, 300);
    setTimeout(finalizePhotoArea, 900);
  }, true);
})();