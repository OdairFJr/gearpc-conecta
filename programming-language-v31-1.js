(() => {
  const runtime = window.GEARPC_RUNTIME;
  if (!runtime?.client || !runtime?.state) return;

  const { client, state } = runtime;
  const $ = (id) => document.getElementById(id);
  let patchTimer = null;

  function schedulePatch() {
    window.clearTimeout(patchTimer);
    patchTimer = window.setTimeout(patchProgrammingLanguage, 80);
  }

  function patchProgrammingLanguage() {
    document.querySelectorAll('.program-deadline-note').forEach((note) => {
      const desired = 'Programações das atividades regulares de sábado devem ser lançadas até <strong>sexta-feira, às 14:00</strong>.';
      if (note.innerHTML !== desired) note.innerHTML = desired;
    });

    document.querySelectorAll('.program-review-state').forEach((stateEl) => {
      const text = stateEl.textContent?.trim() || '';
      if (text.includes('Atividade conferida e autorizada')) {
        stateEl.textContent = 'Programação conferida';
      } else if (text.includes('Atividade conferida e não autorizada')) {
        stateEl.textContent = 'Programação precisa de ajustes';
      } else if (text.includes('Atividade cancelada por falta de programação')) {
        stateEl.textContent = 'Programação não lançada no prazo';
      }
    });

    document.querySelectorAll('.review-authorize').forEach((button) => {
      if (button.textContent !== '✓ Programação conferida') {
        button.textContent = '✓ Programação conferida';
      }
    });

    document.querySelectorAll('.review-deny').forEach((button) => {
      if (button.textContent !== '✎ Solicitar ajustes') {
        button.textContent = '✎ Solicitar ajustes';
      }
    });

    document.querySelectorAll('.review-cancel').forEach((button) => {
      const note = document.createElement('span');
      note.className = 'program-auto-cancel-note';
      note.textContent = 'Programação ainda não lançada • prazo sexta-feira às 14:00';
      button.replaceWith(note);
    });

    document.querySelectorAll('.program-auto-cancel-note').forEach((note) => {
      if (/cancelamento automático/i.test(note.textContent || '')) {
        note.textContent = 'Prazo de lançamento: sexta-feira às 14:00';
      }
    });

    document.querySelectorAll('[data-late-release="true"]').forEach((button) => {
      if (button.textContent !== 'Liberar lançamento após prazo') {
        button.textContent = 'Liberar lançamento após prazo';
      }
    });

    document.querySelectorAll('.program-editor-review-status').forEach((box) => {
      let html = box.innerHTML;
      html = html.replaceAll('Atividade conferida e autorizada', 'Programação conferida');
      html = html.replaceAll('Atividade conferida e não autorizada', 'Programação precisa de ajustes');
      html = html.replaceAll('Atividade cancelada por falta de programação', 'Programação não lançada no prazo');
      if (html !== box.innerHTML) box.innerHTML = html;
    });

    document.querySelectorAll('.weekly-program-cancellation').forEach((card) => {
      const strong = card.querySelector('strong');
      if (strong && /atividade cancelada/i.test(strong.textContent || '')) {
        strong.textContent = '⏰ Programação não lançada no prazo';
      }
      const paragraph = card.querySelector('p');
      if (paragraph && /foi cancelada automaticamente/i.test(paragraph.textContent || '')) {
        paragraph.textContent = 'A programação não foi lançada até sexta-feira às 14:00. O prazo de lançamento foi encerrado; a atividade não é cancelada automaticamente pelo sistema.';
      }
    });
  }

  async function saveNeedsAdjustments(button) {
    if (state.profile?.tipo !== 'administrador' || !state.user?.id) return;
    const sectionId = Number(button.dataset.sectionId || 0);
    const date = button.dataset.date || '';
    if (!sectionId || !date) return;

    const reason = window.prompt('Informe quais ajustes são necessários na programação:');
    if (reason === null) return;
    if (!reason.trim()) {
      window.alert('Informe os ajustes necessários para registrar a revisão.');
      return;
    }

    button.disabled = true;
    const now = new Date().toISOString();
    const { error } = await client.from('programacao_revisoes').upsert({
      secao_id: sectionId,
      data_atividade: date,
      status: 'nao_autorizada',
      observacao: reason.trim(),
      revisado_por: state.user.id,
      revisado_em: now,
      atualizado_em: now
    }, { onConflict: 'secao_id,data_atividade' });

    if (error) {
      window.alert('Não foi possível registrar os ajustes da programação.');
      button.disabled = false;
      return;
    }

    $('programmingRefreshButton')?.click();
    window.setTimeout(schedulePatch, 250);
  }

  document.addEventListener('click', async (event) => {
    const deny = event.target.closest('.review-deny[data-review-action="deny"]');
    if (deny) {
      event.preventDefault();
      event.stopImmediatePropagation();
      await saveNeedsAdjustments(deny);
      return;
    }

    const cancel = event.target.closest('.review-cancel[data-review-action="cancel"]');
    if (cancel) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.alert('O GEArPC Conecta controla o prazo da programação. A atividade da seção não é cancelada automaticamente por falta de lançamento.');
    }
  }, true);

  const observer = new MutationObserver(schedulePatch);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  client.auth.onAuthStateChange((_event, session) => {
    if (session) window.setTimeout(schedulePatch, 500);
  });

  patchProgrammingLanguage();
})();
