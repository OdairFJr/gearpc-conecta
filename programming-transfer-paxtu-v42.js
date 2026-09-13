(() => {
  if (window.__GEARPC_PROGRAM_TRANSFER_PAXTU_V42__) return;
  window.__GEARPC_PROGRAM_TRANSFER_PAXTU_V42__ = true;

  const runtime = window.GEARPC_RUNTIME;
  if (!runtime?.client || !runtime?.state) return;
  const { client, state } = runtime;
  const $ = (id) => document.getElementById(id);
  const editor = $('programEditorView');
  const actionBar = $('programActionBar');
  const section = $('programEditorSection');
  const date = $('programEditorDate');
  if (!editor || !actionBar || !section || !date) return;

  const normalize = (value) => String(value || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const timeToMinutes = (time) => {
    const match = String(time || '').match(/^(\d{1,2}):(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const minutesToTime = (value) => Number.isFinite(value)
    ? `${String(Math.floor(value / 60) % 24).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}` : '';
  const formatDate = (value) => String(value || '').split('-').reverse().join('/');
  const isAdmin = () => state.profile?.tipo === 'administrador';

  function paxtuProgramRunner() {
    const norm = (value) => String(value || '').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const visible = (el) => el && el.offsetParent !== null && !el.disabled;
    const setNative = (input, value) => {
      const proto = input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(input, value); else input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
    };
    const buttonByText = (text) => [...document.querySelectorAll('button')]
      .find((button) => visible(button) && norm(button.textContent).includes(norm(text)));
    const stageInputs = () => [...document.querySelectorAll('input')].filter((input) => {
      if (!visible(input) || ['date', 'time', 'checkbox', 'radio', 'hidden'].includes(input.type)) return false;
      const parentText = norm((input.closest('label') || input.parentElement)?.textContent);
      return parentText.includes('etapa') || norm(input.getAttribute('aria-label')).includes('etapa');
    });
    const timeInputs = () => [...document.querySelectorAll('input[type="time"]')].filter(visible);

    async function run() {
      if (!/paxtu100\.escoteiros\.org\.br$/i.test(location.hostname) || !location.pathname.includes('/atividades/nova/sede')) {
        alert('Abra no Paxtu 100 a página Atividades > Nova atividade em sede e clique novamente neste favorito.');
        return;
      }
      let raw = '';
      try { raw = await navigator.clipboard.readText(); } catch (_) {
        raw = prompt('Cole aqui a programação copiada pelo GEArPC Conecta:') || '';
      }
      let payload;
      try { payload = JSON.parse(raw); } catch (_) {
        alert('A área de transferência não contém uma programação válida. Volte ao Conecta e clique em “Copiar programação”.');
        return;
      }
      if (payload?.origem !== 'gearpc-conecta-programacao' || !Array.isArray(payload.etapas) || !payload.etapas.length) {
        alert('A programação copiada não foi reconhecida.');
        return;
      }
      const preview = payload.etapas.map((item, i) => `${i + 1}. ${item.inicio}–${item.fim}  ${item.nome}`).join('\n');
      if (!confirm(`Programação a preencher no Paxtu:\n\nData: ${payload.data_br}\nSeção: ${payload.secao}\nEtapas: ${payload.etapas.length}\n\n${preview}\n\nO Paxtu ainda NÃO será salvo automaticamente. Deseja preencher os campos?`)) return;

      const problems = [];
      const dateInput = [...document.querySelectorAll('input[type="date"]')].find(visible);
      if (dateInput) setNative(dateInput, payload.data); else problems.push('data');

      const sectionSelect = [...document.querySelectorAll('select')].find((select) => visible(select));
      if (sectionSelect) {
        const target = [...sectionSelect.options].find((option) => {
          const a = norm(option.textContent); const b = norm(payload.secao);
          return a === b || a.includes(b) || b.includes(a);
        });
        if (target) setNative(sectionSelect, target.value); else problems.push('seção');
      } else {
        const sectionInput = [...document.querySelectorAll('input')].find((input) => {
          if (!visible(input) || ['date', 'time', 'checkbox', 'radio', 'hidden'].includes(input.type)) return false;
          const nearby = norm((input.closest('label') || input.parentElement)?.textContent);
          return nearby.includes('secao') || norm(input.getAttribute('placeholder')).includes('secao');
        });
        if (sectionInput) {
          setNative(sectionInput, payload.secao);
          sectionInput.focus();
          await new Promise((resolve) => setTimeout(resolve, 350));
          const option = [...document.querySelectorAll('[role="option"], li')].find((el) => {
            if (!visible(el)) return false;
            const a = norm(el.textContent); const b = norm(payload.secao);
            return a === b || a.includes(b) || b.includes(a);
          });
          if (option) option.click(); else problems.push('confirmação da seção');
        } else problems.push('seção');
      }

      const addButton = buttonByText('Adicionar Etapa');
      if (!addButton) {
        alert('Não encontrei o botão “Adicionar Etapa” nesta página do Paxtu. Nenhuma atividade foi salva.');
        return;
      }
      while (stageInputs().length < payload.etapas.length) {
        addButton.click();
        await new Promise((resolve) => setTimeout(resolve, 120));
      }

      const stages = stageInputs();
      const times = timeInputs();
      for (let i = 0; i < payload.etapas.length; i += 1) {
        const item = payload.etapas[i];
        if (i > 0 && stages[i]) setNative(stages[i], item.nome);
        if (times[i * 2]) setNative(times[i * 2], item.inicio);
        if (times[i * 2 + 1]) setNative(times[i * 2 + 1], item.fim);
      }
      if (stages.length < payload.etapas.length || times.length < payload.etapas.length * 2) problems.push('uma ou mais etapas/horários');

      const suffix = problems.length
        ? `\n\nNão consegui preencher automaticamente: ${[...new Set(problems)].join(', ')}. Complete esses campos manualmente.` : '';
      alert(`Programação preenchida. Confira todas as etapas e horários. Se estiver correto, clique manualmente em “Salvar Atividade”.${suffix}`);
    }
    void run();
  }

  const button = document.createElement('button');
  button.id = 'programTransferPaxtuButton';
  button.type = 'button';
  button.className = 'secondary-action-button hidden';
  button.textContent = '↗ Transferir programação para o Paxtu';
  actionBar.appendChild(button);

  const dialog = document.createElement('dialog');
  dialog.id = 'programTransferPaxtuDialog';
  dialog.className = 'member-dialog';
  dialog.innerHTML = `
    <div class="detail-shell">
      <div class="dialog-title-row sticky-dialog-header"><div><div class="eyebrow dark">ADMINISTRADOR</div><h2>Transferir programação para o Paxtu</h2></div><button type="button" class="dialog-close" data-program-paxtu-close aria-label="Fechar">×</button></div>
      <div class="program-transfer-paxtu-content">
        <div class="attendance-paxtu-warning"><strong>O salvamento final será manual.</strong><span>O atalho preencherá o Paxtu e você poderá conferir antes de salvar.</span></div>
        <p id="programTransferPaxtuSummary"></p>
        <button id="programTransferPaxtuCopy" type="button" class="save-button">Copiar programação</button>
        <hr />
        <h3>Configuração necessária apenas uma vez</h3>
        <p>Arraste o botão verde abaixo para a barra de favoritos do Chrome:</p>
        <a id="programTransferPaxtuBookmark" class="attendance-paxtu-bookmark" href="#">GEArPC → Programação Paxtu</a>
        <h3>Como usar</h3>
        <ol><li>Copie a programação.</li><li>No Paxtu, abra <strong>Nova Atividade em Sede</strong>.</li><li>Clique no favorito acima.</li><li>Confira os campos e salve manualmente.</li></ol>
        <p id="programTransferPaxtuMessage" class="members-message" role="status"></p>
      </div>
    </div>`;
  document.body.appendChild(dialog);
  $('programTransferPaxtuBookmark').href = `javascript:(${paxtuProgramRunner.toString()})()`;

  async function loadProgram() {
    const sectionId = Number(section.value || 0);
    const activityDate = date.value;
    if (!sectionId || !activityDate) throw new Error('Selecione a seção e a data da programação.');
    const { data: programs, error } = await client.from('programacoes')
      .select('id,secao_id,data_atividade,horario_inicio,horario_termino')
      .eq('secao_id', sectionId).eq('data_atividade', activityDate).limit(1);
    if (error) throw error;
    const program = programs?.[0];
    if (!program) throw new Error('Salve primeiro a data e os horários da programação.');
    const { data: items, error: itemError } = await client.from('programacao_itens')
      .select('id,ordem,tipo,hora_inicio,duracao_min,nome')
      .eq('programacao_id', program.id).order('hora_inicio', { ascending: true }).order('ordem', { ascending: true });
    if (itemError) throw itemError;
    const etapas = (items || []).filter((item) => item.hora_inicio && item.nome).map((item) => {
      const start = timeToMinutes(item.hora_inicio);
      return { nome: item.nome, inicio: minutesToTime(start), fim: minutesToTime(start + Number(item.duracao_min || 0)) };
    });
    if (!etapas.length) throw new Error('Inclua pelo menos uma etapa na programação antes de transferir.');
    return { program, etapas };
  }

  function updateAccess() {
    button.classList.toggle('hidden', !isAdmin());
  }
  button.addEventListener('click', async () => {
    if (!isAdmin()) return;
    $('programTransferPaxtuMessage').textContent = 'Preparando programação...';
    dialog.showModal();
    try {
      const { etapas } = await loadProgram();
      $('programTransferPaxtuSummary').textContent = `${etapas.length} etapa(s) em ${formatDate(date.value)}, seção ${section.options[section.selectedIndex]?.textContent || ''}.`;
      $('programTransferPaxtuCopy').disabled = false;
      $('programTransferPaxtuMessage').textContent = '';
    } catch (error) {
      $('programTransferPaxtuCopy').disabled = true;
      $('programTransferPaxtuMessage').textContent = error.message || 'Não foi possível preparar a programação.';
    }
  });
  dialog.addEventListener('click', (event) => {
    if (event.target.closest('[data-program-paxtu-close]')) dialog.close();
  });
  $('programTransferPaxtuCopy').addEventListener('click', async () => {
    try {
      const { etapas } = await loadProgram();
      const payload = {
        origem: 'gearpc-conecta-programacao', versao: 1,
        data: date.value, data_br: formatDate(date.value),
        secao: section.options[section.selectedIndex]?.textContent?.trim() || '', etapas
      };
      await navigator.clipboard.writeText(JSON.stringify(payload));
      $('programTransferPaxtuMessage').textContent = `✓ Programação copiada: ${etapas.length} etapa(s). Abra Nova Atividade em Sede no Paxtu e clique no favorito.`;
      $('programTransferPaxtuMessage').classList.add('success-message');
    } catch (error) {
      $('programTransferPaxtuMessage').textContent = error.message || 'Não foi possível copiar a programação.';
      $('programTransferPaxtuMessage').classList.remove('success-message');
    }
  });

  new MutationObserver(updateAccess).observe(editor, { attributes: true, attributeFilter: ['class'] });
  runtime.client.auth.onAuthStateChange(() => window.setTimeout(updateAccess, 100));
  updateAccess();
})();
