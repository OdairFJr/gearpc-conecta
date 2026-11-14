(() => {
  const view = document.getElementById('accessView');
  if (!view) return;
  const make = (tag, text) => {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
  };
  const panel = make('details', '');
  panel.style.cssText = 'margin:16px;padding:16px;border:1px solid #c9d9e6;border-radius:12px;background:white';
  const title = make('summary', 'Ativar responsáveis em lote');
  const instructions = make('p', 'Confira o e-mail e a validade no Paxtu antes de selecionar. O envio ocorre apenas após sua confirmação.');
  const load = make('button', 'Atualizar lista');
  const send = make('button', 'Enviar convites selecionados');
  load.type = send.type = 'button';
  const status = make('p', '');
  status.setAttribute('role', 'status');
  const list = make('div', '');
  panel.append(title, instructions, load, send, status, list);
  view.querySelector('header')?.after(panel);
  const ready = 'Pronto para convidar';
  const pending = 'Convite pendente';
  let choices = [];
  let busy = false;
  send.disabled = true;

  async function refresh() {
    const rt = window.GEARPC_RUNTIME;
    if (rt?.state?.profile?.tipo !== 'administrador' || busy) return;
    choices = [];
    list.replaceChildren();
    send.disabled = true;
    load.disabled = true;
    try {
      const { data, error } = await rt.client.rpc('listar_lote_responsaveis');
      if (error) throw error;
      for (const row of data) {
        const line = make('div', '');
        line.style.cssText = 'padding:10px 0;border-bottom:1px solid #dde6ee';
        const label = make('label', '');
        const check = document.createElement('input');
        check.type = 'checkbox';
        check.disabled = ![ready, pending].includes(row.situacao);
        if (!check.disabled) choices.push({ row, check });
        label.append(check, document.createTextNode(' ' + row.nome));
        line.append(label, make('div', (row.email || 'Sem e-mail') + ' · ' + row.situacao));
        for (const child of row.filhos) {
          const validity = child.validade?.split('-').reverse().join('/') || 'sem validade informada';
          line.append(make('div', child.nome + ' · ' + validity + (child.ativo ? '' : ' · cadastro inativo')));
        }
        list.append(line);
      }
      send.disabled = choices.length === 0;
    } catch {
      status.textContent = 'Não foi possível consultar os cadastros. Atualize a lista para tentar novamente.';
    } finally {
      load.disabled = false;
    }
  }

  panel.addEventListener('toggle', () => { if (panel.open) void refresh(); });
  load.addEventListener('click', () => { status.textContent = ''; void refresh(); });
  send.addEventListener('click', async () => {
    if (busy) return;
    const rt = window.GEARPC_RUNTIME;
    if (rt?.state?.profile?.tipo !== 'administrador') return;
    const selected = choices.filter(({ check }) => check.checked);
    if (!selected.length) {
      status.textContent = 'Selecione pelo menos um responsável conferido.';
      return;
    }
    if (!window.confirm('Enviar convite ou reenviar link para ' + selected.length + ' responsável(is) selecionado(s)?')) return;
    busy = true;
    load.disabled = send.disabled = true;
    const failures = [];
    let sent = 0;
    try {
      for (const { row } of selected) {
        status.textContent = 'Enviando: ' + row.nome;
        try {
          const { data, error } = await rt.client.functions.invoke('admin-invite-responsavel', { body: { id: row.id } });
          if (error || !data?.ok) {
            const detail = await error?.context?.json?.().catch(() => null);
            failures.push(row.nome + ' — ' + (detail?.error || 'envio não confirmado'));
          } else {
            sent += 1;
          }
        } catch {
          failures.push(row.nome + ' — envio não confirmado');
        }
      }
    } finally {
      busy = false;
      status.textContent = sent + ' convite(s) enviado(s). ' + failures.join(' • ');
      await refresh();
    }
  });
})();
