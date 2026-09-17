(() => {
  if (window.__GEARPC_SAFETY_UNIFIED_FLOW_V66_3__) return;
  window.__GEARPC_SAFETY_UNIFIED_FLOW_V66_3__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (id) => document.getElementById(id);
  let currentVisitId = null;
  let savingUnified = false;

  async function waitReady() {
    for (let i = 0; i < 160; i += 1) {
      if ($('safetyViewV63') && $('safetyVisitsPanelV63') && $('safetyPlansPanelV63') && $('safetyVisitFormV63') && $('safetyPlanFormV63')) return true;
      await sleep(250);
    }
    return false;
  }

  function storageKey() {
    const rt = window.GEARPC_RUNTIME;
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

  function pairedPlanForVisit(visitId) {
    if (!visitId) return null;
    return readStore().plans.find((plan) => plan.baseVisitId === visitId) || null;
  }

  function setTextIfChanged(element, value) {
    if (element && element.textContent !== value) element.textContent = value;
  }

  function injectStyles() {
    if ($('safetyUnifiedStylesV663')) return;
    const style = document.createElement('style');
    style.id = 'safetyUnifiedStylesV663';
    style.textContent = `
      .safety-pair-status-v66{display:inline-flex;margin-top:8px}
      #safetyPlansPanelV63,.safety-tabs-v63,#newSafetyPlanV63{display:none!important}
      #safetyPlanDialogV63{visibility:hidden!important;pointer-events:none!important}
      #safetyVisitsListV63 [data-plan-from-visit]{display:none!important}
      .safety-unified-plan-section-v663{border-left:3px solid #8fb5d4}
      .safety-unified-plan-intro-v663{padding:10px 12px;border-radius:12px;background:#eef6fb;color:#31526f;font-size:.86rem;line-height:1.45}
      .safety-unified-reminder-v663{padding:11px 12px;border-radius:12px;background:#fff8dc;border:1px solid #eadb92;color:#66551b;font-size:.88rem;font-weight:700;line-height:1.4}
      #spSafetyLeadV63{display:none!important}
    `;
    document.head.appendChild(style);
  }

  function movePlanSectionsIntoVisit() {
    const visitForm = $('safetyVisitFormV63');
    if (!visitForm || visitForm.dataset.unifiedV663 === '1') return;

    const actions = visitForm.querySelector('.safety-dialog-actions-v63');
    if (!actions) return;

    // Se uma versão anterior já tiver movido os blocos 8, 9 e 10 para a visita,
    // devolve-os ao formulário interno do plano, que permanece oculto.
    const planForm = $('safetyPlanFormV63');
    const planActions = planForm?.querySelector('.safety-dialog-actions-v63');
    ['spEmergencyV63', 'spKitLocationV63', 'spChecklistV63'].forEach((id) => {
      const section = $(id)?.closest('.safety-section-v63');
      if (section && planActions && section.closest('#safetyVisitFormV63')) {
        planActions.insertAdjacentElement('beforebegin', section);
      }
    });

    const fields = ['spCoordinatorV63', 'spRisksV63'];
    const sections = [];
    fields.forEach((id) => {
      const section = $(id)?.closest('.safety-section-v63');
      if (section && !sections.includes(section)) sections.push(section);
    });
    if (sections.length < 2) return;

    const safetyLead = $('spSafetyLeadV63');
    if (safetyLead) {
      safetyLead.value = '';
      const safetyLeadLabel = safetyLead.closest('label');
      if (safetyLeadLabel) safetyLeadLabel.style.display = 'none';
    }
    const responsiblesGrid = $('spCoordinatorV63')?.closest('.safety-grid-v63');
    responsiblesGrid?.classList.remove('three');

    const intro = document.createElement('div');
    intro.className = 'safety-unified-plan-intro-v663';
    intro.innerHTML = '<strong>Plano de segurança</strong><br>Continue o mesmo preenchimento abaixo. Ao final, um único botão salva a visita técnica e o plano desta atividade juntos.';
    actions.insertAdjacentElement('beforebegin', intro);

    const titles = [
      '6. Responsáveis da atividade',
      '7. Análise de riscos'
    ];

    sections.forEach((section, index) => {
      section.classList.add('safety-unified-plan-section-v663');
      const heading = section.querySelector('h3');
      if (heading && titles[index]) heading.textContent = titles[index];
      actions.insertAdjacentElement('beforebegin', section);
    });

    let reminder = visitForm.querySelector('.safety-unified-reminder-v663');
    if (!reminder) {
      reminder = document.createElement('div');
      reminder.className = 'safety-unified-reminder-v663';
      reminder.textContent = '🩹 Lembrete: confira o kit de primeiros socorros antes da atividade.';
      actions.insertAdjacentElement('beforebegin', reminder);
    }

    const save = actions.querySelector('button[type="submit"]');
    setTextIfChanged(save, 'Salvar planejamento');
    visitForm.dataset.unifiedV663 = '1';
  }

  function refreshUnifiedUi() {
    $('safetyPlansPanelV63')?.classList.add('hidden');
    $('safetyVisitsPanelV63')?.classList.remove('hidden');

    const heroTitle = document.querySelector('#safetyViewV63 .members-hero h2');
    const heroText = document.querySelector('#safetyViewV63 .members-hero p');
    setTextIfChanged(heroTitle, 'Planejamento de segurança da atividade');
    setTextIfChanged(heroText, 'Visita técnica e plano de segurança são preenchidos juntos, em uma única etapa.');

    const panelTitle = document.querySelector('#safetyVisitsPanelV63 .safety-panel-head-v63 h3');
    const panelText = document.querySelector('#safetyVisitsPanelV63 .safety-panel-head-v63 p');
    setTextIfChanged(panelTitle, 'Planejamentos de segurança');
    setTextIfChanged(panelText, 'Abra um planejamento, preencha visita e plano na mesma tela e salve uma única vez.');

    setTextIfChanged($('newSafetyVisitV63'), '＋ Novo planejamento');

    const visitEyebrow = document.querySelector('#safetyVisitDialogV63 .safety-dialog-head-v63 .eyebrow');
    const visitTitle = $('safetyVisitTitleV63');
    const visitHelp = document.querySelector('#safetyVisitDialogV63 .safety-dialog-head-v63 p');
    setTextIfChanged(visitEyebrow, 'SEGURANÇA DA ATIVIDADE');
    if (visitTitle && !visitTitle.textContent.toLowerCase().includes('editar')) setTextIfChanged(visitTitle, 'Novo planejamento de segurança');
    setTextIfChanged(visitHelp, 'Preencha a visita técnica e o plano de segurança abaixo. O salvamento é único.');

    movePlanSectionsIntoVisit();
    const save = $('safetyVisitFormV63')?.querySelector('.safety-dialog-actions-v63 button[type="submit"]');
    setTextIfChanged(save, 'Salvar planejamento');
  }

  function decorateCards() {
    document.querySelectorAll('#safetyVisitsListV63 .safety-card-v63').forEach((card) => {
      const edit = card.querySelector('[data-edit-visit]');
      if (!edit) return;
      const visitId = edit.dataset.editVisit;
      const paired = pairedPlanForVisit(visitId);
      setTextIfChanged(edit, 'Ver / editar planejamento');

      let badge = card.querySelector('.safety-pair-status-v66');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'safety-pill-v63 safety-pair-status-v66';
        const counts = card.querySelector('.safety-counts-v63');
        if (counts) counts.appendChild(badge);
        else card.querySelector('.meta')?.insertAdjacentElement('afterend', badge);
      }
      badge.classList.toggle('ok', Boolean(paired));
      badge.classList.toggle('warn', !paired);
      setTextIfChanged(badge, paired ? 'Planejamento completo' : 'Salvar para completar');
    });
  }

  function closeHiddenPlanDialog() {
    const dialog = $('safetyPlanDialogV63');
    try { if (dialog?.open) dialog.close(); } catch (_) {}
    refreshUnifiedUi();
  }

  function primePlanFormForVisit(visitId = null) {
    const paired = pairedPlanForVisit(visitId);
    if (paired) {
      const editButton = document.querySelector(`#safetyPlansListV63 [data-edit-plan="${CSS.escape(paired.id)}"]`);
      if (editButton) {
        editButton.click();
        closeHiddenPlanDialog();
        return;
      }
    }

    const newPlan = $('newSafetyPlanV63');
    if (newPlan) {
      newPlan.click();
      closeHiddenPlanDialog();
    }
  }

  function selectedVisitSections() {
    return [...($('svSectionsV63')?.querySelectorAll('input[type="checkbox"]:checked') || [])].map((input) => input.value);
  }

  function syncPlanIdentification(visitId = '') {
    if ($('spBaseVisitV63')) $('spBaseVisitV63').value = visitId || '';
    if ($('spActivityNameV63')) $('spActivityNameV63').value = $('svActivityNameV63')?.value || '';
    if ($('spActivityTypeV63')) $('spActivityTypeV63').value = $('svActivityTypeV63')?.value || 'Acampamento';
    if ($('spLocationV63')) $('spLocationV63').value = $('svLocationV63')?.value || '';
    if ($('spAddressV63')) $('spAddressV63').value = $('svAddressV63')?.value || '';

    const startDate = $('svStartDateV64')?.value || $('svActivityDateV63')?.value || '';
    if ($('spDateV63')) $('spDateV63').value = startDate;
    if ($('spStatusV63')) $('spStatusV63').value = 'pronto';

    const selected = new Set(selectedVisitSections());
    $('spSectionsV63')?.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = selected.has(input.value);
    });

    if ($('spStartDateV64')) $('spStartDateV64').value = $('svStartDateV64')?.value || startDate;
    if ($('spStartTimeV64')) $('spStartTimeV64').value = $('svStartTimeV64')?.value || '';
    if ($('spEndDateV64')) $('spEndDateV64').value = $('svEndDateV64')?.value || startDate;
    if ($('spEndTimeV64')) $('spEndTimeV64').value = $('svEndTimeV64')?.value || '';
    if ($('spMapsLinkV64')) $('spMapsLinkV64').value = $('svMapsLinkV64')?.value || '';

    if ($('spCellCoverageV63')) $('spCellCoverageV63').value = $('svCellCoverageV63')?.value || 'nao_verificado';
    if ($('spHospitalV63') && !$('spHospitalV63').value) $('spHospitalV63').value = $('svHospitalV63')?.value || '';
    if ($('spMeetingPointV63') && !$('spMeetingPointV63').value) $('spMeetingPointV63').value = $('svMeetingPointV63')?.value || '';

    // Campos removidos do fluxo: mantém vazios também no registro interno.
    if ($('spSafetyLeadV63')) $('spSafetyLeadV63').value = '';
    $('spEmergencyV63')?.querySelectorAll('[data-emergency]').forEach((field) => { field.value = ''; });
    if ($('spKitLocationV63')) $('spKitLocationV63').value = '';
    if ($('spKitCheckedV63')) $('spKitCheckedV63').value = 'nao';
    if ($('spTransportV63')) $('spTransportV63').value = '';
    if ($('spRouteV63')) $('spRouteV63').value = '';
    if ($('spOtherCommunicationV63')) $('spOtherCommunicationV63').value = '';
    $('spChecklistV63')?.querySelectorAll('[data-check]').forEach((input) => { input.checked = false; });
  }

  function newestVisitId(beforeIds) {
    const visits = readStore().visits;
    const added = visits.filter((visit) => !beforeIds.has(visit.id));
    if (added.length) return [...added].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))[0]?.id || null;
    return [...visits].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))[0]?.id || null;
  }

  function submitHiddenPlan(visitId) {
    syncPlanIdentification(visitId);
    const planForm = $('safetyPlanFormV63');
    if (!planForm) return;
    planForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    closeHiddenPlanDialog();
    window.setTimeout(() => {
      refreshUnifiedUi();
      decorateCards();
      savingUnified = false;
    }, 160);
  }

  function wire() {
    document.addEventListener('click', (event) => {
      const newPlanning = event.target.closest('#newSafetyVisitV63');
      if (newPlanning) {
        currentVisitId = null;
        window.setTimeout(() => {
          primePlanFormForVisit(null);
          refreshUnifiedUi();
        }, 60);
        return;
      }

      const editPlanning = event.target.closest('[data-edit-visit]');
      if (editPlanning) {
        currentVisitId = editPlanning.dataset.editVisit || null;
        window.setTimeout(() => {
          primePlanFormForVisit(currentVisitId);
          const title = $('safetyVisitTitleV63');
          setTextIfChanged(title, 'Editar planejamento de segurança');
          refreshUnifiedUi();
        }, 80);
      }
    }, true);

    $('safetyVisitFormV63')?.addEventListener('submit', () => {
      if (savingUnified) return;
      savingUnified = true;
      const beforeIds = new Set(readStore().visits.map((visit) => visit.id));
      syncPlanIdentification(currentVisitId || '');

      window.setTimeout(() => {
        const visitId = currentVisitId || newestVisitId(beforeIds);
        if (!visitId) {
          savingUnified = false;
          return;
        }
        currentVisitId = visitId;
        submitHiddenPlan(visitId);
      }, 420);
    }, true);
  }

  function installObserver() {
    const list = $('safetyVisitsListV63');
    if (!list) return;
    const observer = new MutationObserver(() => {
      refreshUnifiedUi();
      decorateCards();
    });
    observer.observe(list, { childList: true, subtree: false });
  }

  async function boot() {
    if (!(await waitReady())) return;
    injectStyles();
    refreshUnifiedUi();
    decorateCards();
    installObserver();
    wire();
  }

  void boot();
})();