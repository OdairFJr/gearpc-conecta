(() => {
  'use strict';

  if (window.GEARPC_PURCHASE_DELIVERY_RECIPIENTS_V38) return;
  window.GEARPC_PURCHASE_DELIVERY_RECIPIENTS_V38 = true;

  const cfg = window.GEARPC_CONFIG || {};
  if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) return;

  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
  const state = {
    requestId: null,
    sectionId: null,
    sectionName: '',
    sectionRecipients: [],
    managers: [],
    activeGroup: 'section',
    loading: false
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

  function injectStyles() {
    if (document.getElementById('purchaseDeliveryRecipientsStylesV38')) return;
    const style = document.createElement('style');
    style.id = 'purchaseDeliveryRecipientsStylesV38';
    style.textContent = `
      .purchase-recipient-tabs-v38{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 10px}
      .purchase-recipient-tab-v38{border:1px solid #cfd9e4;background:#f5f8fb;color:#34516c;border-radius:10px;padding:9px 10px;font-weight:800;cursor:pointer}
      .purchase-recipient-tab-v38.active{background:#0a376c;color:#fff;border-color:#0a376c}
      .purchase-recipient-tab-v38:disabled{opacity:.45;cursor:not-allowed}
      .purchase-recipient-help-v38{display:block;margin:-2px 0 8px;color:#65778a;font-size:.8rem;line-height:1.35;font-weight:600}
    `;
    document.head.appendChild(style);
  }

  function ensureUi() {
    const current = document.getElementById('purchaseDeliveredTo');
    if (!current) return false;

    injectStyles();

    if (current.tagName === 'SELECT' && document.getElementById('purchaseRecipientTabsV38')) {
      return true;
    }

    const label = current.closest('label');
    if (!label) return false;

    label.innerHTML = `
      <span>Entregue para</span>
      <div id="purchaseRecipientTabsV38" class="purchase-recipient-tabs-v38">
        <button id="purchaseRecipientSectionTabV38" class="purchase-recipient-tab-v38 active" type="button">Seção</button>
        <button id="purchaseRecipientManagersTabV38" class="purchase-recipient-tab-v38" type="button">Dirigentes</button>
      </div>
      <small id="purchaseRecipientHelpV38" class="purchase-recipient-help-v38">Selecione quem recebeu o material.</small>
      <select id="purchaseDeliveredTo" required>
        <option value="">Selecione quem recebeu</option>
      </select>
    `;

    document.getElementById('purchaseRecipientSectionTabV38')?.addEventListener('click', () => {
      if (!state.sectionId) return;
      state.activeGroup = 'section';
      renderRecipients();
    });

    document.getElementById('purchaseRecipientManagersTabV38')?.addEventListener('click', () => {
      state.activeGroup = 'managers';
      renderRecipients();
    });

    renderRecipients();
    return true;
  }

  function renderRecipients() {
    if (!ensureUi()) return;

    const select = document.getElementById('purchaseDeliveredTo');
    const sectionTab = document.getElementById('purchaseRecipientSectionTabV38');
    const managersTab = document.getElementById('purchaseRecipientManagersTabV38');
    const help = document.getElementById('purchaseRecipientHelpV38');
    if (!select || !sectionTab || !managersTab || !help) return;

    sectionTab.disabled = !state.sectionId;
    if (!state.sectionId && state.activeGroup === 'section') state.activeGroup = 'managers';

    sectionTab.classList.toggle('active', state.activeGroup === 'section');
    managersTab.classList.toggle('active', state.activeGroup === 'managers');

    if (state.loading) {
      select.innerHTML = '<option value="">Carregando nomes...</option>';
      select.disabled = true;
      help.textContent = 'Buscando os adultos cadastrados no GEArPC Conecta.';
      return;
    }

    const names = state.activeGroup === 'section' ? state.sectionRecipients : state.managers;
    const groupLabel = state.activeGroup === 'section'
      ? (state.sectionName ? `Adultos vinculados à ${state.sectionName}.` : 'Adultos vinculados à seção solicitante.')
      : 'Dirigentes cadastrados no grupo.';

    select.disabled = false;
    select.innerHTML = '<option value="">Selecione quem recebeu</option>' +
      names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');

    help.textContent = names.length
      ? groupLabel
      : (state.activeGroup === 'section'
          ? 'Nenhum adulto ativo está vinculado a esta seção.'
          : 'Nenhum dirigente ativo foi encontrado.');
  }

  async function loadManagers() {
    const { data, error } = await client
      .from('perfis_usuarios')
      .select('nome_completo,tipo,ativo,acesso_geral_consulta')
      .eq('ativo', true)
      .order('nome_completo');

    if (error) throw error;

    return uniqueNames((data || []).filter((profile) =>
      profile.tipo === 'administrador' || profile.acesso_geral_consulta === true
    ));
  }

  async function loadSectionRecipients(sectionId) {
    if (!sectionId) return [];

    const { data: links, error: linksError } = await client
      .from('chefe_secoes')
      .select('chefe_id')
      .eq('secao_id', sectionId);

    if (linksError) throw linksError;

    const chiefIds = [...new Set((links || []).map((row) => Number(row.chefe_id)).filter(Boolean))];
    if (!chiefIds.length) return [];

    const { data: chiefs, error: chiefsError } = await client
      .from('chefes')
      .select('id,nome_completo,ativo')
      .in('id', chiefIds)
      .eq('ativo', true)
      .order('nome_completo');

    if (chiefsError) throw chiefsError;
    return uniqueNames(chiefs || []);
  }

  async function prepareRecipients(requestId) {
    state.requestId = Number(requestId) || null;
    state.sectionId = null;
    state.sectionName = '';
    state.sectionRecipients = [];
    state.managers = [];
    state.activeGroup = 'section';
    state.loading = true;
    ensureUi();
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

      const managersPromise = loadManagers();
      const sectionPromise = state.sectionId
        ? loadSectionRecipients(state.sectionId)
        : Promise.resolve([]);
      const sectionNamePromise = state.sectionId
        ? client.from('secoes').select('nome').eq('id', state.sectionId).maybeSingle()
        : Promise.resolve({ data: null, error: null });

      const [managers, sectionRecipients, sectionResult] = await Promise.all([
        managersPromise,
        sectionPromise,
        sectionNamePromise
      ]);

      if (sectionResult?.error) throw sectionResult.error;

      state.managers = managers;
      state.sectionRecipients = sectionRecipients;
      state.sectionName = sectionResult?.data?.nome || '';
    } catch (error) {
      state.sectionRecipients = [];
      state.managers = [];
      if (message) {
        message.textContent = `Não foi possível carregar os nomes para a entrega: ${error?.message || 'erro inesperado'}`;
      }
    } finally {
      state.loading = false;
      renderRecipients();
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('.purchase-deliver-button');
    if (!button) return;
    const requestId = Number(button.dataset.id || 0);
    if (requestId) prepareRecipients(requestId);
  }, true);

  const observer = new MutationObserver(() => ensureUi());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureUi, { once: true });
  } else {
    ensureUi();
  }
})();
