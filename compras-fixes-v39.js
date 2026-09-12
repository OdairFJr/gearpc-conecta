(() => {
  'use strict';

  if (window.GEARPC_PURCHASE_FIXES_V39) return;
  window.GEARPC_PURCHASE_FIXES_V39 = true;

  const cfg = window.GEARPC_CONFIG || {};
  if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) return;

  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
  const state = {
    userId: null,
    isAdmin: false,
    requestId: null,
    sectionId: null,
    sectionName: '',
    sectionRecipients: [],
    managers: [],
    activeGroup: 'section',
    loading: false,
    decorating: false
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function uniqueNames(rows) {
    const seen = new Set();
    return (rows || [])
      .map((row) => String(row?.nome_completo || '').trim())
      .filter((name) => {
        if (!name) return false;
        const key = name.toLocaleLowerCase('pt-BR');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR');
  }

  function injectStyles() {
    if (document.getElementById('purchaseFixesStylesV39')) return;
    const style = document.createElement('style');
    style.id = 'purchaseFixesStylesV39';
    style.textContent = `
      .purchase-recipient-tabs-v39{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 10px}
      .purchase-recipient-tab-v39{border:1px solid #cfd9e4;background:#f5f8fb;color:#34516c;border-radius:10px;padding:10px;font-weight:800;cursor:pointer}
      .purchase-recipient-tab-v39.active{background:#0a376c;color:#fff;border-color:#0a376c}
      .purchase-recipient-tab-v39:disabled{opacity:.45;cursor:not-allowed}
      .purchase-recipient-help-v39{display:block;margin:-2px 0 8px;color:#65778a;font-size:.8rem;line-height:1.35;font-weight:600}
      .purchase-delete-delivery-v39{background:#fff0f0!important;color:#9b2424!important;border:1px solid #efc8c8!important}
    `;
    document.head.appendChild(style);
  }

  async function loadUserContext() {
    try {
      const { data: sessionData } = await client.auth.getSession();
      const user = sessionData?.session?.user;
      state.userId = user?.id || null;
      if (!state.userId) return;
      const { data: profile } = await client
        .from('perfis_usuarios')
        .select('tipo')
        .eq('user_id', state.userId)
        .maybeSingle();
      state.isAdmin = profile?.tipo === 'administrador';
    } catch (_) {}
  }

  function ensureRecipientUi() {
    injectStyles();
    const current = document.getElementById('purchaseDeliveredTo');
    if (!current) return false;

    if (current.tagName === 'SELECT' && document.getElementById('purchaseRecipientTabsV39')) return true;

    const label = current.closest('label');
    if (!label) return false;

    label.innerHTML = `
      <span>Entregue para</span>
      <div id="purchaseRecipientTabsV39" class="purchase-recipient-tabs-v39">
        <button id="purchaseRecipientSectionTabV39" class="purchase-recipient-tab-v39 active" type="button">Seção</button>
        <button id="purchaseRecipientManagersTabV39" class="purchase-recipient-tab-v39" type="button">Dirigentes</button>
      </div>
      <small id="purchaseRecipientHelpV39" class="purchase-recipient-help-v39">Selecione quem recebeu o material.</small>
      <select id="purchaseDeliveredTo" required>
        <option value="">Selecione quem recebeu</option>
      </select>
    `;

    document.getElementById('purchaseRecipientSectionTabV39')?.addEventListener('click', () => {
      if (!state.sectionId) return;
      state.activeGroup = 'section';
      renderRecipients();
    });
    document.getElementById('purchaseRecipientManagersTabV39')?.addEventListener('click', () => {
      state.activeGroup = 'managers';
      renderRecipients();
    });
    renderRecipients();
    return true;
  }

  function renderRecipients() {
    if (!ensureRecipientUi()) return;
    const select = document.getElementById('purchaseDeliveredTo');
    const sectionTab = document.getElementById('purchaseRecipientSectionTabV39');
    const managersTab = document.getElementById('purchaseRecipientManagersTabV39');
    const help = document.getElementById('purchaseRecipientHelpV39');
    if (!select || !sectionTab || !managersTab || !help) return;

    sectionTab.disabled = !state.sectionId;
    if (!state.sectionId && state.activeGroup === 'section') state.activeGroup = 'managers';
    sectionTab.classList.toggle('active', state.activeGroup === 'section');
    managersTab.classList.toggle('active', state.activeGroup === 'managers');

    if (state.loading) {
      select.disabled = true;
      select.innerHTML = '<option value="">Carregando nomes...</option>';
      help.textContent = 'Buscando os adultos cadastrados no GEArPC Conecta.';
      return;
    }

    const names = state.activeGroup === 'section' ? state.sectionRecipients : state.managers;
    select.disabled = false;
    select.innerHTML = '<option value="">Selecione quem recebeu</option>' +
      names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');

    if (state.activeGroup === 'section') {
      help.textContent = names.length
        ? `Adultos vinculados à ${state.sectionName || 'seção solicitante'}.`
        : 'Nenhum adulto ativo está vinculado a esta seção.';
    } else {
      help.textContent = names.length
        ? 'Dirigentes cadastrados no grupo.'
        : 'Nenhum dirigente ativo foi encontrado.';
    }
  }

  async function loadManagers() {
    const { data: functions, error: functionsError } = await client
      .from('chefe_funcoes')
      .select('chefe_id,funcao');
    if (functionsError) throw functionsError;

    const ids = [...new Set((functions || [])
      .filter((row) => {
        const role = normalize(row.funcao);
        return role.includes('diretor') || role.includes('presidente');
      })
      .map((row) => Number(row.chefe_id))
      .filter(Boolean))];

    if (!ids.length) return [];
    const { data, error } = await client
      .from('chefes')
      .select('id,nome_completo,ativo')
      .in('id', ids)
      .eq('ativo', true)
      .order('nome_completo');
    if (error) throw error;
    return uniqueNames(data || []);
  }

  async function loadSectionRecipients(sectionId) {
    if (!sectionId) return [];
    const { data: links, error: linksError } = await client
      .from('chefe_secoes')
      .select('chefe_id')
      .eq('secao_id', sectionId);
    if (linksError) throw linksError;

    const ids = [...new Set((links || []).map((row) => Number(row.chefe_id)).filter(Boolean))];
    if (!ids.length) return [];

    const { data, error } = await client
      .from('chefes')
      .select('id,nome_completo,ativo')
      .in('id', ids)
      .eq('ativo', true)
      .order('nome_completo');
    if (error) throw error;
    return uniqueNames(data || []);
  }

  async function prepareRecipients(requestId) {
    state.requestId = Number(requestId) || null;
    state.sectionId = null;
    state.sectionName = '';
    state.sectionRecipients = [];
    state.managers = [];
    state.activeGroup = 'section';
    state.loading = true;
    ensureRecipientUi();
    renderRecipients();

    const message = document.getElementById('purchaseDeliveryMessage');
    if (message) message.textContent = '';

    try {
      const { data: request, error: requestError } = await client
        .from('solicitacoes_compras')
        .select('id,secao_id')
        .eq('id', state.requestId)
        .single();
      if (requestError) throw requestError;

      state.sectionId = request?.secao_id ? Number(request.secao_id) : null;
      state.activeGroup = state.sectionId ? 'section' : 'managers';

      const [sectionRecipients, managers, sectionResult] = await Promise.all([
        state.sectionId ? loadSectionRecipients(state.sectionId) : Promise.resolve([]),
        loadManagers(),
        state.sectionId
          ? client.from('secoes').select('nome').eq('id', state.sectionId).maybeSingle()
          : Promise.resolve({ data: null, error: null })
      ]);
      if (sectionResult?.error) throw sectionResult.error;

      state.sectionRecipients = sectionRecipients;
      state.managers = managers;
      state.sectionName = sectionResult?.data?.nome || '';
    } catch (error) {
      state.sectionRecipients = [];
      state.managers = [];
      if (message) message.textContent = `Não foi possível carregar os nomes: ${error?.message || 'erro inesperado'}`;
    } finally {
      state.loading = false;
      renderRecipients();
    }
  }

  async function decorateDeliveryCards() {
    if (state.decorating || !state.userId) return;
    const registerButtons = [...document.querySelectorAll('.purchase-deliver-button[data-id]')];
    const ids = [...new Set(registerButtons.map((button) => Number(button.dataset.id)).filter(Boolean))];
    if (!ids.length) return;

    state.decorating = true;
    try {
      const { data } = await client
        .from('solicitacoes_compras')
        .select('id,user_id')
        .in('id', ids);
      const ownership = new Map((data || []).map((row) => [Number(row.id), row.user_id]));

      registerButtons.forEach((registerButton) => {
        const id = Number(registerButton.dataset.id || 0);
        if (!id) return;
        const canDelete = state.isAdmin || ownership.get(id) === state.userId;
        if (!canDelete) return;
        const actions = registerButton.closest('.purchase-actions');
        if (!actions || actions.querySelector(`.purchase-delete-delivery-v39[data-id="${id}"]`)) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'purchase-action purchase-delete-delivery-v39';
        button.dataset.id = String(id);
        button.textContent = 'Apagar solicitação';
        actions.appendChild(button);
      });
    } catch (_) {
    } finally {
      state.decorating = false;
    }
  }

  async function deleteDeliveryRequest(id) {
    const requestId = Number(id || 0);
    if (!requestId) return;
    if (!confirm('Apagar definitivamente esta solicitação de teste?')) return;

    const message = document.getElementById('purchaseMessage');
    const { error } = await client
      .from('solicitacoes_compras')
      .delete()
      .eq('id', requestId);

    if (error) {
      if (message) message.textContent = `Não foi possível apagar: ${error.message}`;
      return;
    }

    if (message) message.textContent = 'Solicitação apagada.';
    document.getElementById('deliveryRefreshButton')?.click();
    document.getElementById('purchaseRefreshButton')?.click();
  }

  document.addEventListener('click', (event) => {
    const deliveryButton = event.target.closest?.('.purchase-deliver-button');
    if (deliveryButton) {
      const id = Number(deliveryButton.dataset.id || 0);
      if (id) prepareRecipients(id);
      return;
    }

    const deleteButton = event.target.closest?.('.purchase-delete-delivery-v39');
    if (deleteButton) {
      event.preventDefault();
      deleteDeliveryRequest(deleteButton.dataset.id);
    }
  }, true);

  const observer = new MutationObserver(() => {
    ensureRecipientUi();
    decorateDeliveryCards();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  async function init() {
    injectStyles();
    await loadUserContext();
    ensureRecipientUi();
    decorateDeliveryCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
