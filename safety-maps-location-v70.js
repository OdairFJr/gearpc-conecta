(() => {
  if (window.__GEARPC_SAFETY_MAPS_LOCATION_V70__) return;
  window.__GEARPC_SAFETY_MAPS_LOCATION_V70__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let currentCoords = null;

  async function waitReady() {
    for (let i = 0; i < 160; i += 1) {
      if ($('svMapsLinkV64') && $('safetyVisitFormV63')) return true;
      await sleep(250);
    }
    return false;
  }

  function injectStyles() {
    if ($('safetyMapsLocationStylesV70')) return;
    const style = document.createElement('style');
    style.id = 'safetyMapsLocationStylesV70';
    style.textContent = `
      .safety-map-tools-v70{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:7px}
      .safety-map-gps-v70{border:1px solid #9fb7ca;background:#f7fbff;color:#173f61;border-radius:10px;padding:9px 11px;font-weight:800;cursor:pointer}
      .safety-map-gps-v70:disabled{opacity:.65;cursor:wait}
      .safety-map-status-v70{font-size:.78rem;color:#657b8e;line-height:1.35;flex:1 1 220px}
      @media(max-width:720px){.safety-map-tools-v70{display:grid;grid-template-columns:1fr}.safety-map-gps-v70{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function installControls() {
    const input = $('svMapsLinkV64');
    if (!input || $('svUseLocationV70')) return;

    const mapRow = input.closest('.safety-map-row-v64');
    const anchor = mapRow || input.closest('label');
    if (!anchor) return;

    anchor.insertAdjacentHTML('afterend', `
      <div class="safety-map-tools-v70">
        <button id="svUseLocationV70" class="safety-map-gps-v70" type="button">📍 Usar minha localização</button>
        <span id="svLocationStatusV70" class="safety-map-status-v70">Você também pode colar manualmente um link do Google Maps no campo acima.</span>
      </div>`);

    const label = input.closest('label');
    if (label) {
      for (const node of label.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && String(node.textContent || '').includes('Link do local no Google Maps')) {
          node.textContent = 'Local no Google Maps — cole o link ou use o GPS ';
          break;
        }
      }
    }
  }

  function setStatus(text) {
    const status = $('svLocationStatusV70');
    if (status) status.textContent = text;
  }

  function googleMapsLink(lat, lng) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }

  function locateCurrentPosition() {
    if (!('geolocation' in navigator)) {
      alert('Este aparelho ou navegador não disponibiliza localização por GPS. Você ainda pode colar o link do Maps manualmente.');
      return;
    }

    const button = $('svUseLocationV70');
    if (button) {
      button.disabled = true;
      button.textContent = '📍 Localizando…';
    }
    setStatus('Solicitando a localização atual do aparelho…');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude).toFixed(6);
        const lng = Number(position.coords.longitude).toFixed(6);
        const accuracy = Math.round(Number(position.coords.accuracy || 0));
        currentCoords = { latitude: Number(lat), longitude: Number(lng), accuracyMeters: accuracy || null };
        const input = $('svMapsLinkV64');
        if (input) {
          input.value = googleMapsLink(lat, lng);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        setStatus(`Localização registrada pelo aparelho${accuracy ? ` (precisão aproximada: ${accuracy} m)` : ''}. Use “Abrir Maps” para conferir o ponto.`);
        if (button) {
          button.disabled = false;
          button.textContent = '📍 Atualizar minha localização';
        }
      },
      (error) => {
        currentCoords = null;
        let message = 'Não foi possível obter a localização. Você pode colar o link do Maps manualmente.';
        if (error?.code === 1) message = 'A permissão de localização foi negada. Autorize a localização para o GEArPC Conecta ou cole o link do Maps manualmente.';
        if (error?.code === 2) message = 'O aparelho não conseguiu determinar a localização agora. Tente novamente em área aberta ou cole o link do Maps.';
        if (error?.code === 3) message = 'A localização demorou demais para responder. Tente novamente ou cole o link do Maps.';
        setStatus(message);
        if (button) {
          button.disabled = false;
          button.textContent = '📍 Usar minha localização';
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function wire() {
    $('svUseLocationV70')?.addEventListener('click', locateCurrentPosition);

    const input = $('svMapsLinkV64');
    input?.addEventListener('input', () => {
      if (!input.value.trim()) {
        currentCoords = null;
        setStatus('Você também pode colar manualmente um link do Google Maps no campo acima.');
      }
    });

    document.addEventListener('click', (event) => {
      if (event.target.closest('#newSafetyVisitV63')) {
        currentCoords = null;
        window.setTimeout(() => setStatus('Você também pode colar manualmente um link do Google Maps no campo acima.'), 0);
      }
    }, true);
  }

  async function boot() {
    if (!(await waitReady())) return;
    injectStyles();
    installControls();
    wire();
  }

  void boot();
})();