(() => {
  if (window.__GEARPC_ATTENDANCE_PAXTU_V41__) return;
  window.__GEARPC_ATTENDANCE_PAXTU_V41__ = true;

  const $ = (id) => document.getElementById(id);
  const runtime = window.GEARPC_RUNTIME;
  const attendanceView = $('attendanceView');
  const actions = attendanceView?.querySelector('.attendance-admin-actions');
  const list = $('attendanceList');
  const section = $('attendanceSection');
  const date = $('attendanceDate');
  if (!attendanceView || !actions || !list || !section || !date) return;

  const normalize = (value) => String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim().toLowerCase();

  function paxtuRunner() {
    const normalizeText = (value) => String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ').trim().toLowerCase();

    async function run() {
      if (!/paxtu100\.escoteiros\.org\.br$/i.test(location.hostname)) {
        alert('Abra primeiro a atividade no Paxtu 100 e execute novamente o favorito GEArPC → Paxtu.');
        return;
      }

      let raw = '';
      try { raw = await navigator.clipboard.readText(); } catch (_) {
        raw = prompt('Cole aqui a lista copiada pelo GEArPC Conecta:') || '';
      }

      let payload;
      try { payload = JSON.parse(raw); } catch (_) {
        alert('A área de transferência não contém uma lista válida do GEArPC Conecta. Volte ao Conecta e clique em “Copiar presentes”.');
        return;
      }
      if (payload?.origem !== 'gearpc-conecta' || !Array.isArray(payload.presentes)) {
        alert('A lista copiada não foi reconhecida como uma transferência do GEArPC Conecta.');
        return;
      }

      const checkboxes = [...document.querySelectorAll('input[type="checkbox"]')]
        .filter((box) => box.offsetParent !== null && !box.disabled);
      const rows = checkboxes.map((box) => {
        const row = box.closest('tr') || box.closest('[class*="row"]') || box.parentElement?.parentElement;
        return { box, text: normalizeText(row?.innerText || row?.textContent || '') };
      });

      const found = [];
      const missing = [];
      const ambiguous = [];
      for (const person of payload.presentes) {
        const name = normalizeText(person.nome);
        const matches = rows.filter((row) => row.text === name || row.text.endsWith(name) || row.text.includes(name));
        if (matches.length === 1) found.push({ ...matches[0], name: person.nome });
        else if (matches.length === 0) missing.push(person.nome);
        else ambiguous.push(person.nome);
      }

      const already = found.filter((item) => item.box.checked);
      const toMark = found.filter((item) => !item.box.checked);
      const details = [
        `Seção: ${payload.secao || '-'}`,
        `Data no Conecta: ${payload.data || '-'}`,
        `Presentes encontrados: ${found.length}`,
        `Serão marcados agora: ${toMark.length}`,
        `Já estavam marcados: ${already.length}`,
        `Não encontrados: ${missing.length}`,
        `Nomes ambíguos: ${ambiguous.length}`
      ];
      if (missing.length) details.push(`\nNão encontrados:\n- ${missing.join('\n- ')}`);
      if (ambiguous.length) details.push(`\nAmbíguos (não serão marcados):\n- ${ambiguous.join('\n- ')}`);
      details.push('\nConfira se a atividade e a data abertas no Paxtu estão corretas. Deseja marcar os nomes encontrados?');

      if (!toMark.length) {
        alert(details.slice(0, -1).join('\n') + '\n\nNenhuma nova presença precisa ser marcada.');
        return;
      }
      if (!confirm(details.join('\n'))) return;

      for (const item of toMark) {
        item.box.click();
        await new Promise((resolve) => setTimeout(resolve, 450));
      }
      alert(`Transferência concluída. ${toMark.length} presença(s) marcada(s). Confira visualmente a lista antes de sair da página.`);
    }
    void run();
  }

  const transferButton = document.createElement('button');
  transferButton.id = 'attendancePaxtuButton';
  transferButton.type = 'button';
  transferButton.className = 'secondary-button attendance-paxtu-button';
  transferButton.textContent = '↗ Transferir para o Paxtu';
  actions.appendChild(transferButton);

  function isAdmin() {
    return runtime?.state?.profile?.tipo === 'administrador';
  }

  function updateTransferAccess() {
    transferButton.classList.toggle('hidden', !isAdmin());
  }

  const dialog = document.createElement('dialog');
  dialog.id = 'attendancePaxtuDialog';
  dialog.className = 'member-dialog attendance-paxtu-dialog';
  dialog.innerHTML = `
    <div class="detail-shell">
      <div class="dialog-title-row sticky-dialog-header">
        <div><div class="eyebrow dark">TRANSFERÊNCIA ASSISTIDA</div><h2>Transferir para o Paxtu 100</h2></div>
        <button type="button" class="dialog-close" data-paxtu-close aria-label="Fechar">×</button>
      </div>
      <div class="attendance-paxtu-content">
        <div class="attendance-paxtu-warning"><strong>O Paxtu salva cada marcação imediatamente.</strong><span>Confirme a atividade e a data no Paxtu antes de autorizar.</span></div>
        <p id="attendancePaxtuSummary"></p>
        <button id="attendancePaxtuCopy" type="button" class="save-button">Copiar todos os presentes</button>
        <hr />
        <h3>Configuração necessária apenas uma vez</h3>
        <p>Mostre a barra de favoritos do Chrome com <strong>Ctrl + Shift + B</strong>. Depois, arraste o botão abaixo para essa barra:</p>
        <a id="attendancePaxtuBookmark" class="attendance-paxtu-bookmark" href="#">GEArPC → Paxtu</a>
        <h3>Como transferir</h3>
        <ol><li>Copie os presentes.</li><li>Abra a atividade correta no Paxtu 100.</li><li>Clique no favorito <strong>GEArPC → Paxtu</strong>.</li><li>Confira o resumo e confirme.</li></ol>
        <p id="attendancePaxtuMessage" class="members-message" role="status"></p>
      </div>
    </div>`;
  document.body.appendChild(dialog);

  const bookmark = $('attendancePaxtuBookmark');
  bookmark.href = `javascript:(${paxtuRunner.toString()})()`;

  function selectedPresentNames() {
    return [...list.querySelectorAll('.attendance-card.presente h3')]
      .map((node) => node.textContent.trim()).filter(Boolean);
  }

  function sectionName() {
    return section.options[section.selectedIndex]?.textContent?.trim() || '';
  }

  function updateSummary() {
    const names = selectedPresentNames();
    $('attendancePaxtuSummary').textContent = names.length
      ? `${names.length} jovem(ns) marcado(s) como presente em ${sectionName()}, na data ${date.value.split('-').reverse().join('/')}.`
      : 'Não há jovens marcados como presentes nesta seção e data.';
    $('attendancePaxtuCopy').disabled = names.length === 0;
    transferButton.disabled = !section.value || !date.value || names.length === 0;
  }

  transferButton.addEventListener('click', () => {
    if (!isAdmin()) return;
    updateSummary();
    dialog.showModal();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target.closest('[data-paxtu-close]')) dialog.close();
  });
  async function copyTransfer(names) {
    const payload = {
      origem: 'gearpc-conecta', versao: 1,
      secao: sectionName(), data: date.value,
      presentes: names.map((nome) => ({ nome, chave: normalize(nome) }))
    };
    const text = JSON.stringify(payload);
    try {
      await navigator.clipboard.writeText(text);
      $('attendancePaxtuMessage').textContent = `✓ Lista copiada: ${names.length} presente(s). Agora abra o Paxtu e clique no favorito GEArPC → Paxtu.`;
      $('attendancePaxtuMessage').classList.add('success-message');
    } catch (_) {
      $('attendancePaxtuMessage').textContent = 'O navegador bloqueou a cópia. Atualize a página e tente novamente.';
      $('attendancePaxtuMessage').classList.remove('success-message');
    }
  }
  $('attendancePaxtuCopy').addEventListener('click', () => {
    void copyTransfer(selectedPresentNames());
  });

  new MutationObserver(updateSummary).observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  new MutationObserver(updateTransferAccess).observe(attendanceView, { attributes: true, attributeFilter: ['class'] });
  runtime?.client?.auth?.onAuthStateChange(() => window.setTimeout(updateTransferAccess, 100));
  section.addEventListener('change', updateSummary);
  date.addEventListener('change', updateSummary);
  updateSummary();
  updateTransferAccess();
})();
