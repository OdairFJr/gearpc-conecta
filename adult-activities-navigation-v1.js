(() => {
  const element = (id) => document.getElementById(id);
  const runtime = window.GEARPC_RUNTIME;
  if (!runtime) return;
  const { client, state, showDashboard } = runtime;
  const dashboard = element('dashboardView');
  const page = element('adultActivitiesView');
  const button = element('adultActivitiesButton');
  const form = element('adultActivityForm');
  const steps = element('adultActivitySteps');
  const list = element('adultActivityList');
  const message = element('adultActivityMessage');
  const listMessage = element('adultActivityListMessage');
  const activities = () => client.from('atividades_adultos_pioneiros_v1');
  const evaluations = () => client.from('avaliacoes_atividades_adultos_v1');
  const questions = [
    ['organizacao', 'Organização'],
    ['conteudo', 'Conteúdo'],
    ['formadores', 'Clareza dos formadores'],
    ['aproveitamento', 'Aproveitamento'],
    ['estrutura', 'Local e estrutura'],
  ];
  const dateTime = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium',
  });
  let request = 0;

  function canUseModule() {
    return state.user && state.profile?.ativo &&
      ['administrador', 'chefia'].includes(state.profile.tipo);
  }

  function append(parent, tag, content) {
    const child = document.createElement(tag);
    child.textContent = content;
    parent.append(child);
    return child;
  }

  function mapsLink(value) {
    try {
      const url = new URL(value);
      const isGoogle = /^(?:www\.)?google\.(?:com|com\.br)$/.test(url.hostname);
      const shortLink = url.hostname === 'maps.app.goo.gl' ||
        (url.hostname === 'goo.gl' && url.pathname.startsWith('/maps/'));
      const mapsHost = /^maps\.google\.(?:com|com\.br)$/.test(url.hostname);
      if (url.protocol === 'https:' && !url.username && !url.password &&
          (shortLink || mapsHost || (isGoogle && /^\/maps(?:\/|$)/.test(url.pathname)))) {
        return url.href;
      }
    } catch {
      // Um campo vazio ou inválido não produz um link.
    }
    return null;
  }

  function addEvaluation(activity, card) {
    if (dateTime.format(new Date()) < `${activity.data} ${activity.fim}`) {
      append(card, 'p', 'A avaliação estará disponível após o horário de término.');
      return;
    }
    const details = append(card, 'details', '');
    append(details, 'summary', 'Registrar avaliação sem identificação');
    const evaluationForm = append(details, 'form', '');
    for (const [name, title] of questions) {
      const label = append(evaluationForm, 'label', title);
      const select = append(label, 'select', '');
      select.name = name;
      select.required = true;
      select.append(new Option('Selecione de 1 a 5', ''));
      for (let score = 1; score <= 5; score += 1) select.append(new Option(score, score));
    }
    for (const [name, title] of [['positivo', 'O que mais gostou?'], ['melhorias', 'O que melhorar?']]) {
      const textarea = append(append(evaluationForm, 'label', title), 'textarea', '');
      textarea.name = name;
      textarea.maxLength = 2000;
      textarea.rows = 2;
    }
    const submit = append(evaluationForm, 'button', 'Salvar avaliação');
    submit.className = 'save-button';
    const status = append(evaluationForm, 'p', '');
    status.setAttribute('role', 'status');
    let responseId = crypto.randomUUID();

    evaluationForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submit.disabled || !canUseModule()) return;
      const values = Object.fromEntries(new FormData(evaluationForm));
      for (const [name] of questions) values[name] = Number(values[name]);
      submit.disabled = true;
      status.textContent = 'Salvando avaliação…';
      try {
        const { error } = await evaluations().insert({ ...values, id: responseId, atividade_id: activity.id });
        if (error && error.code !== '23505') throw error;
        responseId = crypto.randomUUID();
        evaluationForm.reset();
        status.textContent = 'Avaliação registrada.';
        if (responses.open) await loadResponses();
      } catch {
        status.textContent = 'Não foi possível salvar a avaliação. Verifique a conexão e tente novamente.';
      } finally {
        submit.disabled = false;
      }
    });

    const responses = append(card, 'details', '');
    append(responses, 'summary', 'Consultar avaliações');
    const results = append(responses, 'div', '');
    let resultRequest = 0;
    async function loadResponses() {
      const current = ++resultRequest;
      results.textContent = 'Carregando avaliações…';
      try {
        const { data, error } = await evaluations()
          .select('organizacao,conteudo,formadores,aproveitamento,estrutura,positivo,melhorias')
          .eq('atividade_id', activity.id);
        if (error) throw error;
        if (current !== resultRequest || !canUseModule()) return;
        results.textContent = data.length === 1 ? '1 avaliação' : `${data.length} avaliações`;
        for (const response of data) {
          const item = append(results, 'article', '');
          append(item, 'p', questions.map(([name, title]) => `${title}: ${response[name]}/5`).join('\n'));
          if (response.positivo) append(item, 'p', `Pontos positivos: ${response.positivo}`);
          if (response.melhorias) append(item, 'p', `Sugestões: ${response.melhorias}`);
        }
      } catch {
        if (current === resultRequest) results.textContent = 'Não foi possível carregar as avaliações.';
      }
    }
    responses.addEventListener('toggle', () => {
      if (responses.open) void loadResponses();
    });
  }

  function renderActivity(activity) {
    const card = append(list, 'article', '');
    append(card, 'h3', activity.nome);
    const date = activity.data.split('-').reverse().join('/');
    append(card, 'p', `${activity.tipo} · ${date} · ${activity.inicio.slice(0, 5)} às ${activity.fim.slice(0, 5)}`);
    append(card, 'p', `Local: ${activity.local}\nResponsável: ${activity.responsavel}`);
    const url = mapsLink(activity.maps_url);
    if (url) {
      const link = append(card, 'a', 'Abrir no Google Maps');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    if (activity.observacoes) append(card, 'p', activity.observacoes);
    if (activity.etapas?.length) {
      const schedule = append(card, 'details', '');
      append(schedule, 'summary', 'Programação');
      const items = append(schedule, 'ul', '');
      for (const step of activity.etapas) {
        const time = [step.inicio, step.fim].filter(Boolean).join('–');
        append(items, 'li', [time, step.nome || step.etapa, step.formador].filter(Boolean).join(' · '));
      }
    }
    if (activity.participantes?.length) {
      const participants = append(card, 'details', '');
      append(participants, 'summary', 'Participantes');
      append(participants, 'p', activity.participantes.join('\n'));
    }
    addEvaluation(activity, card);
  }

  async function refresh() {
    const current = ++request;
    const userId = state.user?.id;
    listMessage.textContent = 'Carregando atividades…';
    try {
      const { data, error } = await activities()
        .select('id,nome,tipo,data,inicio,fim,local,responsavel,maps_url,observacoes,etapas,participantes')
        .order('data', { ascending: false }).order('inicio', { ascending: false });
      if (error) throw error;
      if (current !== request || state.user?.id !== userId || !canUseModule()) return;
      list.replaceChildren();
      for (const activity of data) renderActivity(activity);
      listMessage.textContent = data.length ? '' : 'Nenhuma atividade registrada.';
    } catch {
      if (current === request) listMessage.textContent = 'Não foi possível carregar as atividades. Volte ao painel e tente novamente.';
    }
  }

  const observer = new MutationObserver(() => {
    if (!dashboard.classList.contains('hidden')) button.classList.toggle('hidden', !canUseModule());
    if (!canUseModule()) {
      request += 1;
      form.reset();
      steps.replaceChildren();
      list.replaceChildren();
      message.textContent = '';
      listMessage.textContent = '';
    }
  });
  observer.observe(dashboard, { attributes: true, attributeFilter: ['class'] });
  observer.observe(element('loginView'), { attributes: true, attributeFilter: ['class'] });

  button.addEventListener('click', () => {
    if (!canUseModule() || dashboard.classList.contains('hidden')) return;
    dashboard.classList.add('hidden');
    page.classList.remove('hidden');
    window.scrollTo(0, 0);
    void refresh();
  });
  element('adultActivitiesBackButton').addEventListener('click', () => {
    showDashboard();
    window.scrollTo(0, 0);
  });

  element('adultActivityAddStep').addEventListener('click', () => {
    const step = element('adultActivityStepTemplate').content.firstElementChild.cloneNode(true);
    step.querySelector('button').addEventListener('click', () => step.remove());
    steps.append(step);
    step.querySelector('input').focus();
  });

  const submit = form.querySelector('[type="submit"]');
  let activityId = crypto.randomUUID();
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled || !canUseModule()) return;
    const fields = new FormData(form);
    const values = {};
    for (const name of ['nome', 'tipo', 'responsavel', 'local', 'maps_url', 'data', 'inicio', 'fim', 'observacoes']) {
      values[name] = fields.get(name).trim();
    }
    if (!values.nome || !values.responsavel || !values.local) {
      message.textContent = 'Preencha o nome, o responsável e o local.';
      return;
    }
    if (values.fim <= values.inicio) {
      message.textContent = 'O horário de fim deve ser posterior ao horário de início.';
      return;
    }
    if (values.maps_url && !mapsLink(values.maps_url)) {
      message.textContent = 'Informe um link válido do Google Maps.';
      return;
    }
    values.maps_url ||= null;
    values.participantes = fields.get('participantes').split('\n').map((name) => name.trim()).filter(Boolean);
    values.etapas = [...steps.children].map((step) => ({
      nome: step.querySelector('[name="etapa_nome"]').value.trim(),
      formador: step.querySelector('[name="etapa_formador"]').value.trim(),
      inicio: step.querySelector('[name="etapa_inicio"]').value,
      fim: step.querySelector('[name="etapa_fim"]').value,
    }));
    if (values.etapas.some((step) => !step.nome || (step.inicio && step.fim && step.fim <= step.inicio))) {
      message.textContent = 'Revise o nome e os horários das etapas da programação.';
      return;
    }

    const userId = state.user.id;
    submit.disabled = true;
    message.textContent = 'Salvando atividade…';
    try {
      const { error } = await activities().insert({ ...values, id: activityId, criado_por: userId });
      if (error && error.code !== '23505') throw error;
      activityId = crypto.randomUUID();
      if (state.user?.id !== userId) return;
      form.reset();
      steps.replaceChildren();
      message.textContent = 'Atividade salva.';
      await refresh();
    } catch {
      if (state.user?.id === userId) message.textContent = 'Não foi possível salvar. Verifique a conexão e tente novamente.';
    } finally {
      submit.disabled = false;
    }
  });
})();
