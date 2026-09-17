(() => {
  if (window.__GEARPC_SAFETY_CAMERA_REMOVED_V77__) return;
  window.__GEARPC_SAFETY_CAMERA_REMOVED_V77__ = true;

  function removeCameraOption() {
    const camera = document.getElementById('svCameraV64');
    const actions = document.querySelector('.safety-photo-actions-v64');
    if (!camera && !actions) return;

    if (camera) {
      camera.removeAttribute('capture');
      camera.disabled = true;
      const label = camera.closest('label');
      if (label) label.style.display = 'none';
    }

    if (actions) {
      actions.style.gridTemplateColumns = '1fr';
      const gallery = document.getElementById('svGalleryV64');
      const galleryLabel = gallery?.closest('label');
      if (galleryLabel) {
        galleryLabel.style.display = '';
        galleryLabel.style.width = '100%';
      }
    }

    const note = document.querySelector('#svPhotosSectionV64 .safety-note-v63');
    if (note) {
      note.textContent = 'Até 10 fotos do local. Para adicionar imagens, use “Escolher da galeria”.';
    }
  }

  // Tentativas curtas apenas na inicialização, sem observadores contínuos.
  [0, 400, 1200, 2500].forEach((delay) => setTimeout(removeCameraOption, delay));

  // A interface de Segurança é criada dinamicamente; reaplica somente quando o usuário entra nela.
  document.addEventListener('click', (event) => {
    const target = event.target?.closest?.('#safetyButtonV63,#newSafetyVisitV63,[data-edit-visit]');
    if (!target) return;
    setTimeout(removeCameraOption, 80);
    setTimeout(removeCameraOption, 350);
  }, true);

  window.addEventListener('focus', () => setTimeout(removeCameraOption, 80));
})();
