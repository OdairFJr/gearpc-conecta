/* GEArPC v109: autorizações de atividades externas, assinatura simples e vias impressas.
   Enquanto testes com responsáveis não forem concluídos, a área familiar
   aparece somente para a conta de responsável de teste. */
(() => {
  if(window.__GEARPC_AUTHORIZATIONS_V109__)return;
  window.__GEARPC_AUTHORIZATIONS_V109__=true;
  const rt=window.GEARPC_RUNTIME;if(!rt?.client||!rt?.state)return;
  const {client,state}=rt,$=id=>document.getElementById(id);
  const PARENTS_TEST_ONLY=true;
  let familyRows=[],chiefRows=[],familySimulations=[],chiefSimulations=[],busy=false;
  const familyDrafts=new Map();
  const draftKey=r=>String(r.atividade_id)+':'+String(r.jovem_id);
  const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const when=s=>s?new Date(s).toLocaleString('pt-BR',
    {timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}):'Não informado';
  const isAdmin=()=>state.profile?.tipo==='administrador';
  const canChief=()=>isAdmin()||state.profile?.tipo==='chefia';
  const asParent=()=>state.profile?.tipo==='responsavel'||
    (state.profile?.tipo==='chefia' && state.profile?.eh_teste===true && state.profile?.responsavel_id);
  const showFamily=()=>asParent() && (!PARENTS_TEST_ONLY||state.profile?.eh_teste===true);
  const validAuthorization=r=>r.status&&Number(r.versao_assinada)===Number(r.versao);
  const lastSimulation=(r,items)=>items.find(s=>Number(s.atividade_id)===Number(r.atividade_id)
    && Number(s.jovem_id)===Number(r.jovem_id)
    && Number(s.versao_atividade)===Number(r.versao));
  const matchingAccount=(name,row)=>name.trim().toLocaleLowerCase('pt-BR')===
    String(row.responsavel_nome||'').trim().toLocaleLowerCase('pt-BR');
  const statusLabel=r=>!validAuthorization(r)?'Pendente de autorização':
    r.status==='nao_autorizado'?'Participação não autorizada':
    r.meio==='eletronica'?'Autorizada eletronicamente':
    r.meio==='papel'?'Documento impresso recebido':'Autorizada (registro anterior)';

  function style(){
    if($('authorizationsCssV109'))return;
    const el=document.createElement('style');el.id='authorizationsCssV109';
    el.textContent=[
      '.authorizations-v109{background:#fff;border:1px solid #cbdbe9;border-radius:14px;padding:13px;margin:15px 0;color:#25415b}',
      '.authorizations-v109>summary{font-size:1rem;font-weight:850;color:#123f6b;cursor:pointer}',
      '.authorizations-v109 p{font-size:.82rem;color:#4d667d;line-height:1.5}',
      '.authorizations-list-v109{display:grid;gap:11px;margin:12px 0}',
      '.authorizations-card-v109{background:#f8fbfe;border:1px solid #d7e4ee;border-radius:11px;padding:12px}',
      '.authorizations-card-v109 strong{color:#183f60;display:block;font-size:.9rem}',
      '.authorizations-card-v109 small{display:block;font-size:.74rem;color:#586f84;margin-top:4px}',
      '.authorizations-card-v109 .authorizations-status-v109{font-size:.75rem;color:#3e5b76;font-weight:850;margin-top:8px}',
      '.authorizations-card-v109 .authorizations-terms-v109{white-space:pre-wrap;border-left:3px solid #94b0c5;background:white;padding:10px;color:#344e63;font-size:.8rem;margin:9px 0}',
      '.authorizations-actions-v109{display:flex;gap:8px;flex-wrap:wrap;margin:9px 0}',
      '.authorizations-v109 button{border-radius:9px;border:1px solid #b9cddb;padding:9px 11px;background:#fff;color:#143f6b;font-weight:800;font-size:.78rem;cursor:pointer}',
      '.authorizations-v109 button:disabled{opacity:.5;cursor:wait}',
      '.authorizations-sign-v109{margin-top:10px;border-top:1px solid #d8e5ee;padding-top:10px;display:grid;gap:10px}',
      '.document-facts-v110{margin:12px 0;font-size:.79rem}.document-facts-v110 div{margin:3px 0}',
      '.authorizations-sign-v109 label{display:grid;gap:5px;font-size:.78rem;color:#425b71;font-weight:750}',
      '.authorizations-sign-v109 input[type=text],.authorizations-sign-v109 input[inputmode=numeric],.authorizations-v109 select{padding:10px;box-sizing:border-box;width:100%;border:1px solid #bdcedd;border-radius:8px;background:#fff;color:#1c394f;font:inherit}',
      '.auth-sign-error-v117{padding:8px 10px;margin:7px 0;color:#9a2828;font-weight:800;border-left:3px solid #b63b3b;min-height:1em}',
      '.auth-sign-hint-v117{color:#516a82;font-size:.76rem}',
      '.auth-name-validation-v120{font-size:.78rem;font-weight:800;color:#a13f30;min-height:1em;margin:3px 0}',
      '.auth-registered-name-v120{background:#eef6fc;padding:10px;border-radius:8px;color:#254960;font-size:.78rem}',
      '.auth-simulation-v121{background:#fff6e3;border:1px solid #d1b67c;border-radius:8px;padding:10px;color:#664b25;font-size:.78rem}',
      '.auth-fill-name-v120{align-self:flex-start;border:1px solid #9cbad1!important;background:#edf6fc!important}',
      '.authorizations-sign-v109 label.check{display:flex;flex-direction:row;align-items:flex-start;gap:9px}',
      '.authorizations-sign-v109 input[type=checkbox]{flex:0 0 auto;margin-top:3px}',
      '.authorizations-sign-v109 button.primary{background:#0a376c;color:white}',
      '.authorizations-v109 details>summary{cursor:pointer;color:#164a78;font-size:.85rem;font-weight:800}',
      '.authorizations-v109 .authorizations-summary-v109{color:#526d80;font-size:.78rem;margin:9px 0}',
      '#familyAuthStatusV109,#chiefAuthStatusV109{min-height:16px;color:#455f75;font-size:.8rem}',
      '.authorizations-chief-v109 select{font-size:.8rem}',
      '@media (max-width:650px){.authorizations-v109{padding:10px}}'
    ].join('');
    document.head.appendChild(el);
  }


  // O mesmo conteúdo é apresentado na tela e impresso. Os dados são ligados
  // à atividade efetivamente publicada, não ao modelo antigo de cada chefe.
  function consentDocument(row){
    const documento=row.documento_responsavel||'____________________________';
    const tipoDocumento=!row.documento_responsavel?'CPF ou RG':(row.tipo_documento==='RG'?'RG':'CPF');
    const reais=value=>value===null||value===undefined||value===''?
      'Não informado':Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
    const chef=row.chefe_responsavel||'Não informado';
    const item=(name,value)=>'<div><strong>'+esc(name)+': </strong>'+
      esc(value===null||value===undefined||value===''?'Não informado':value)+'</div>';
    const nome=(row.nome_assinatura===undefined?row.responsavel_nome:row.nome_assinatura)||'____________________________';
    const lead='<p>Eu, <strong>'+esc(nome)+
      '</strong>, identificado(a) pelo '+tipoDocumento+' nº <strong>'+esc(documento)+'</strong>'+
      ', responsável legal por <strong>'+esc(row.jovem_nome)+
      '</strong>, membro do <strong>Grupo Escoteiro do Ar Paulo Carzino — 198/SC</strong>, '+
      'autorizo sua participação na atividade escoteira descrita abaixo:</p>';
    return lead+'<div class="document-facts-v110">'+
      item('Atividade',row.titulo)+
      item('Jovem',row.jovem_nome)+
      item('Seção',row.secao_nome)+
      item('Data e hora de saída',when(row.inicio))+
      item('Data e hora de retorno',when(row.fim))+
      item('Local da atividade',row.local)+
      item('Local de saída',row.local_saida||row.ponto_encontro)+
      item('Local de chegada',row.local_chegada||row.ponto_encontro)+
      item('Transporte',row.transporte)+
      (row.transporte_detalhes?item('Detalhes do transporte',row.transporte_detalhes):'')+
      item('Ponto de encontro',row.ponto_encontro||row.local_saida)+
      item('Chefe responsável',chef)+
      item('Custo por participante',reais(row.custo_individual))+
      (row.descricao_breve?item('Descrição da atividade',row.descricao_breve):'')+
      (row.alimentacao?item('Alimentação e água',row.alimentacao):'')+
      (row.materiais?item('Materiais necessários',row.materiais):'')+
      (row.observacoes?item('Orientações adicionais',row.observacoes):'')+
      (row.link_mapa?item('Localização (mapa)',row.link_mapa):'')+
      '</div><p>'+esc(row.texto_autorizacao||
        'O responsável declara ciência das condições da atividade acima.')+'</p>';
  }
  const validCpf=c=>{
    const d=String(c||'').replace(/\D/g,'');
    if(!/^\d{11}$/.test(d)||/^(\d)\1{10}$/.test(d))return false;
    const digit=n=>{
      let sum=0;for(let i=0;i<n;i++)sum+=Number(d[i])*(n+1-i);
      const v=(sum*10)%11;return v===10?0:v;
    };
    return digit(9)===Number(d[9])&&digit(10)===Number(d[10]);
  };
  const formatCpf=v=>{
    const d=String(v||'').replace(/\D/g,'').slice(0,11);
    return d.length===11?d.slice(0,3)+'.'+d.slice(3,6)+'.'+d.slice(6,9)+'-'+d.slice(9):d;
  };
  const withIdentity=(row,card)=>{
    const tipo=card?.querySelector('[data-sign-doc-type]')?.value==='RG'?'RG':'CPF';
    const raw=card?.querySelector('[data-sign-document]')?.value?.trim()||'';
    return {
      ...row,
      nome_assinatura:card?.querySelector('[data-sign-name]')?.value?.trim()||'',
      tipo_documento:tipo,
      documento_responsavel:tipo==='CPF'?formatCpf(raw):raw.toUpperCase()
    };
  };
  const validRg=value=>/^[0-9A-Z]{5,20}$/.test(String(value||'').toUpperCase().replace(/[^0-9A-Z]/g,''));

  function showSignMessage(card,message){
    const local=card?.querySelector('[data-card-sign-status]');
    if(local)local.textContent=message||'';
    if($('familyAuthStatusV109'))$('familyAuthStatusV109').textContent=message||'';
  }
  function previewCardIdentity(card,row){
    const target=card?.querySelector('[data-consent-document]');
    if(target)target.innerHTML=consentDocument(withIdentity(row,card));
  }
  
  // Prévia usa o mesmo corpo do termo exibido na via impressa e para a família.
  window.GEARPC_CONSENT_PREVIEW_V115 = consentDocument;

  function mountFamily(){
    if(!showFamily())return;
    if($('familyAuthBoxV109'))return;
    const dash=$('dashboardView'),modules=dash?.querySelector('.launch-modules');
    if(!modules)return;
    style();
    const panel=document.createElement('details');panel.id='familyAuthBoxV109';
    panel.className='authorizations-v109';panel.open=true;
    panel.innerHTML='<summary>📝 Autorizações de atividades externas (teste)</summary>'+
      '<p>Informe o nome e o documento de quem assina. Durante os testes, é possível informar outro responsável ainda não cadastrado no Paxtu. A declaração será registrada como SIMULAÇÃO, sem ser considerada autorização legal válida.</p>'+
      '<p id="familyAuthStatusV109" role="status"></p><div id="familyAuthListV109" class="authorizations-list-v109"></div>'+
      '<div class="authorizations-actions-v109"><button type="button" id="familyAuthRefreshV109">Atualizar autorizações</button></div>';
    modules.insertAdjacentElement('afterend',panel);
    panel.addEventListener('click',async ev=>{
      const print=ev.target.closest('[data-print-authorization]');
      if(print){
        const i=Number(print.dataset.printAuthorization),row=familyRows[i];
        const card=$('familyAuthListV109')?.querySelector('[data-family-auth-row="'+i+'"]');
        if(row)printSheet(withIdentity(row,card));return;
      }
      const fill=ev.target.closest('[data-fill-registered-name]');
      if(fill){
        const i=Number(fill.dataset.fillRegisteredName),row=familyRows[i];
        const card=$('familyAuthListV109')?.querySelector('[data-family-auth-row="'+i+'"]');
        const input=card?.querySelector('[data-sign-name]');
        if(row&&input){
          input.value=row.responsavel_nome||'';
          input.removeAttribute('aria-invalid');
          const warning=card.querySelector('[data-name-validation]');
          if(warning)warning.textContent='Nome cadastrado aplicado.';
          input.dispatchEvent(new Event('input',{bubbles:true}));
          showSignMessage(card,'Nome do responsável cadastrado aplicado. Confira seu documento e a declaração antes de assinar.');
        }
        return;
      }
      const sign=ev.target.closest('[data-sign-authorization]');
      if(sign)await signElectronic(Number(sign.dataset.signAuthorization),sign.dataset.answer);
    });
    const saveDraft=ev=>{
      const card=ev.target.closest('[data-family-auth-row]');
      if(!card)return;
      const row=familyRows[Number(card.dataset.familyAuthRow)];
      if(!row)return;
      familyDrafts.set(draftKey(row),{
        name:card.querySelector('[data-sign-name]')?.value||'',
        documentType:card.querySelector('[data-sign-doc-type]')?.value||'CPF',
        document:card.querySelector('[data-sign-document]')?.value||'',
        accepted:!!card.querySelector('[data-sign-accept]')?.checked
      });
      if(ev.target.matches('[data-sign-name]')){
        const warning=card.querySelector('[data-name-validation]');
        if(warning)warning.textContent='';
        ev.target.removeAttribute('aria-invalid');
      }
      const typed=card.querySelector('[data-sign-name]')?.value?.trim()||'';
      const same=matchingAccount(typed,row);
      const authorize=card.querySelector('[data-sign-authorization][data-answer="autorizado"]');
      const refuse=card.querySelector('[data-sign-authorization][data-answer="nao_autorizado"]');
      if(authorize)authorize.textContent=same?'Assinar eletronicamente e autorizar':'Registrar teste de assinatura e autorizar';
      if(refuse)refuse.textContent=same?'Assinar e não autorizar':'Registrar teste e não autorizar';
      previewCardIdentity(card,row);
    };
    panel.addEventListener('input',saveDraft);
    panel.addEventListener('change',saveDraft);
    $('familyAuthRefreshV109').addEventListener('click',loadFamily);
  }
  function drawFamily(){
    const host=$('familyAuthListV109');if(!host)return;
    const rows=familyRows;
    host.innerHTML=rows.length?rows.map((r,i)=>{
      const current=validAuthorization(r),draft=familyDrafts.get(draftKey(r))||{};
      const name=draft.name===undefined?'':draft.name;
      const sim=lastSimulation(r,familySimulations),same=matchingAccount(name,r);
      const docType=draft.documentType==='RG'?'RG':'CPF';
      const missing=[];
      if(!r.local_saida&&!r.ponto_encontro)missing.push('local de saída');
      if(!r.local_chegada&&!r.ponto_encontro)missing.push('local de chegada');
      if(!r.transporte||r.transporte==='Outros'&&!r.transporte_detalhes)missing.push('detalhes do transporte');
      return '<article class="authorizations-card-v109" data-family-auth-row="'+i+'">'+
        '<strong>'+esc(r.titulo)+'</strong>'+
        '<small>Jovem: '+esc(r.jovem_nome)+' • '+esc(r.secao_nome)+'</small>'+
        '<small>'+esc(when(r.inicio))+' até '+esc(when(r.fim))+' • '+esc(r.local||'Local não informado')+'</small>'+
        (missing.length?'<p class="auth-sign-error-v117">A programação não informa: '+esc(missing.join(', '))+
          '. Confirme esses dados com a chefia antes de autorizar.</p>':'')+
        '<p class="authorizations-status-v109">'+esc(statusLabel(r))+
        (current?' • '+esc(r.nome_assinante||'')+' • '+esc(when(r.assinado_em)):'')+'</p>'+
        (!current&&sim?'<p class="auth-simulation-v121"><strong>Simulação de assinatura registrada (não é autorização válida).</strong> '+
          esc(sim.nome_informado)+' • '+esc(sim.documento_tipo)+' final '+esc(sim.documento_final)+
          ' • '+esc(when(sim.registrado_em))+'</p>':'')+
        '<div class="authorizations-sign-v109">'+
        '<label>Nome completo de quem vai assinar'+
          '<input type="text" data-sign-name maxlength="200" autocomplete="name" placeholder="Nome completo cadastrado" value="'+esc(name)+'"></label>'+
        '<p class="auth-registered-name-v120">Conta usada para o teste: <strong>'+esc(r.responsavel_nome||'Não identificado')+
          '</strong>. Pode digitar o nome do pai, da mãe ou de outro responsável. Quando o nome não corresponder ao desta conta, o aplicativo salvará apenas uma <strong>simulação</strong>, sem atribuir assinatura à pessoa digitada.</p>'+
        '<button type="button" class="auth-fill-name-v120" data-fill-registered-name="'+i+'">Usar nome cadastrado</button>'+
        '<p data-name-validation class="auth-name-validation-v120" role="alert"></p>'+
        '<label>Tipo de documento de identificação'+
          '<select data-sign-doc-type><option value="CPF" '+(docType==='CPF'?'selected':'')+'>CPF</option>'+
          '<option value="RG" '+(docType==='RG'?'selected':'')+'>RG</option></select></label>'+
        '<label>Número do documento do responsável'+
          '<input type="text" autocomplete="off" data-sign-document maxlength="25" '+
          'placeholder="CPF ou RG de quem vai assinar" value="'+esc(draft.document||'')+'"></label>'+
        '<p class="auth-sign-hint-v117">Na via impressa, o pai ou a mãe poderá preencher e assinar o documento. Para testar o fluxo eletrônico, informe o nome e o CPF ou RG que desejar testar. Um nome diferente da conta gera simulação, não autorização válida. O sistema guarda apenas os dois dígitos finais do documento.</p>'+
        '<div class="authorizations-terms-v109" data-consent-document>'+
          consentDocument({...r,nome_assinatura:name,tipo_documento:docType,
            documento_responsavel:docType==='CPF'?formatCpf(draft.document||''):
              String(draft.document||'').toUpperCase()})+'</div>'+
        '<div class="authorizations-actions-v109"><button type="button" data-print-authorization="'+i+'">Imprimir autorização (campos manuais ou preenchidos)</button></div>'+
        '<label class="check"><input type="checkbox" data-sign-accept '+(draft.accepted?'checked':'')+'>'+
          '<span>Confirmo que li os dados e o texto da autorização e registro minha decisão eletronicamente.</span></label>'+
        '<div class="authorizations-actions-v109">'+
          '<button type="button" class="primary" data-sign-authorization="'+i+'" data-answer="autorizado">'+
          (same?'Assinar eletronicamente e autorizar':'Registrar teste de assinatura e autorizar')+'</button>'+
          '<button type="button" data-sign-authorization="'+i+'" data-answer="nao_autorizado">'+
          (same?'Assinar e não autorizar':'Registrar teste e não autorizar')+'</button>'+
        '</div><p data-card-sign-status class="auth-sign-error-v117" role="alert" aria-live="polite"></p>'+
        '</div></article>';
    }).join(''):'<p>Nenhuma atividade externa publicada para os jovens vinculados a esta conta.</p>';
  }
  async function loadFamily(){
    if(!showFamily()||!$('familyAuthStatusV109'))return;
    const message=$('familyAuthStatusV109');
    message.textContent='Verificando atividades publicadas...';
    try{
      const [items,sims]=await Promise.all([
        client.rpc('listar_autorizacoes_familia_v117'),
        client.rpc('listar_simulacoes_autorizacao_v121',{p_modo:'familia'})
      ]);
      if(items.error)throw items.error;
      if(sims.error)throw sims.error;
      familyRows=Array.isArray(items.data)?items.data:[];
      familySimulations=Array.isArray(sims.data)?sims.data:[];
      drawFamily();
      const pending=familyRows.filter(r=>!validAuthorization(r)).length;
      message.textContent=familyRows.length+
        ' autorização(ões) de atividade externa • '+pending+' pendente(s).';
    }catch(err){message.textContent='Não foi possível consultar autorizações: '+err.message;}
  }
  async function signElectronic(index,answer){
    if(!showFamily())return;
    const row=familyRows[index];
    const card=$('familyAuthListV109')?.querySelector('[data-family-auth-row="'+index+'"]');
    if(!row||!card){
      showSignMessage(card,'Não foi possível localizar o formulário. Atualize as autorizações.');
      return;
    }
    if(busy){showSignMessage(card,'Uma assinatura já está sendo processada.');return;}
    const nameField=card.querySelector('[data-sign-name]');
    const docField=card.querySelector('[data-sign-document]');
    const tipo=card.querySelector('[data-sign-doc-type]')?.value==='RG'?'RG':'CPF';
    const acceptField=card.querySelector('[data-sign-accept]');
    const name=nameField?.value?.trim()||'';
    const numeroDoc=docField?.value?.trim()||'';
    if(name.length<5){
      showSignMessage(card,'Informe o nome completo da pessoa para continuar.');
      return;
    }
    const same=matchingAccount(name,row);
    nameField?.removeAttribute('aria-invalid');
    const warning=card.querySelector('[data-name-validation]');
    if(warning)warning.textContent=same?'Assinatura da conta autenticada.':
      'Nome diferente da conta: apenas uma simulação será registrada, sem validade como autorização.';
    if(tipo==='CPF'&&!validCpf(numeroDoc)){showSignMessage(card,'Digite um CPF válido com 11 dígitos.');docField?.focus();return;}
    if(tipo==='RG'&&!validRg(numeroDoc)){showSignMessage(card,'Informe um RG com 5 a 20 letras ou números.');docField?.focus();return;}
    if(!acceptField?.checked){showSignMessage(card,'Marque a declaração antes de assinar.');acceptField?.focus();return;}
    const choice=answer==='autorizado'?'AUTORIZAR':'NÃO AUTORIZAR';
    const question=same?
      'Confirma que deseja '+choice+' a participação de '+row.jovem_nome+' na atividade '+row.titulo+'?':
      'SIMULAÇÃO DE TESTE: registrar uma declaração em nome de '+name+' para '+
       row.jovem_nome+'? Isso NÃO comprova que a pessoa assinou e NÃO vale como autorização legal.';
    if(!window.confirm(question))return;
    busy=true;
    const controls=[...card.querySelectorAll('button,input')];
    controls.forEach(el=>el.disabled=true);
    showSignMessage(card,'Registrando assinatura eletrônica...');
    try{
      const {data,error}=await client.rpc(same?
        'assinar_autorizacao_eletronica_v118':'simular_autorizacao_externa_v121',{
        p_atividade_id:row.atividade_id,p_jovem_id:row.jovem_id,
        p_status:answer,p_nome_digitado:name,p_tipo_documento:tipo,
        p_numero_documento:numeroDoc,p_termo_aceito:true
      });
      if(error)throw error;
      if(data?.ok!==true)throw new Error('O servidor não confirmou o registro.');
      familyDrafts.delete(draftKey(row));
      await loadFamily();
      $('familyAuthStatusV109').textContent=same?
        'Assinatura eletrônica da conta autenticada registrada e disponível à chefia.':
        'Simulação registrada para teste. A chefia pode visualizá-la, mas ela NÃO conta como autorização válida.';
    }catch(err){
      showSignMessage(card,'Não foi possível assinar: '+err.message);
    }finally{
      busy=false;controls.forEach(el=>{if(el.isConnected)el.disabled=false;});
    }
  }

  function printSheet(row){
    const w=window.open('','_blank');
    if(!w){
      $('familyAuthStatusV109').textContent='O navegador bloqueou a impressão. Autorize janelas para este site e tente novamente.';
      return;
    }
    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'+
      '<meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<title>Autorização especial - GEArPC</title>'+
      '<style>body{font:14px/1.52 Arial,sans-serif;max-width:760px;margin:22px auto;padding:15px;color:#202020}'+
      'header{border:1px solid #444;padding:12px;text-align:center;margin-bottom:26px}'+
      'h1{font-size:18px;margin:0}h2{text-align:center;font-size:16px;margin:24px 0 18px}'+
      'p{margin:8px 0}.document-facts-v110{margin:15px 0}.document-facts-v110 div{margin:2px 0}'+
      '.signline{border-bottom:1px solid #333;height:36px;margin:22px 0 5px}'+
      '.notice{margin-top:28px;font-size:11px}.actions{padding:12px}'+
      '@media print{.actions{display:none}body{margin:0 auto;padding:5mm}}</style></head><body>'+
      '<header><h1>Grupo Escoteiro do Ar Paulo Carzino — 198/SC</h1>'+
      '<div>Autorização de participação em atividade especial</div></header>'+
      consentDocument(row)+
      '<div class="signline"></div><p>Data: ____/____/______</p>'+
      '<div class="signline"></div><p>Cidade</p>'+
      '<div class="signline"></div><p>Assinatura do responsável</p>'+
      '<p class="notice">Nome e documento podem ser preenchidos manualmente se os campos estiverem em branco. '+
      'Entregue a via física assinada à chefia. Não se trata de ficha médica.</p>'+
      '<div class="actions"><button onclick="window.print()">Imprimir autorização</button></div></body></html>';
    w.document.open();w.document.write(html);w.document.close();
  }

  function mountChief(){
    if(!canChief()||$('chiefAuthBoxV109'))return;
    const view=$('programmingView'),note=view?.querySelector('#programmingRoleNote');
    if(!view||!note)return;
    style();
    const panel=document.createElement('details');panel.id='chiefAuthBoxV109';
    panel.className='authorizations-v109 authorizations-chief-v109';
    panel.innerHTML='<summary>📋 Autorizações das atividades externas</summary>'+
      '<p>Acompanhe as respostas eletrônicas e as autorizações impressas da sua seção. Registre o papel somente depois de receber o original assinado.</p>'+
      '<p id="chiefAuthStatusV109" role="status"></p>'+
      '<div id="chiefAuthListV109" class="authorizations-list-v109"></div>'+
      '<div class="authorizations-actions-v109"><button id="chiefAuthRefreshV109" type="button">Atualizar autorizações</button></div>';
    note.insertAdjacentElement('afterend',panel);
    $('chiefAuthRefreshV109').addEventListener('click',loadChief);
    panel.addEventListener('toggle',()=>{if(panel.open)void loadChief();});
    panel.addEventListener('click',async event=>{
      const recv=event.target.closest('[data-receive-paper]');
      if(recv)await receivePaper(Number(recv.dataset.receivePaper));
    });
  }
  function drawChief(){
    const host=$('chiefAuthListV109');if(!host)return;
    const rows=chiefRows;
    const signed=rows.filter(r=>validAuthorization(r)&&r.status==='autorizado').length;
    const declined=rows.filter(r=>validAuthorization(r)&&r.status==='nao_autorizado').length;
    const pending=rows.length-signed-declined;
    let html='<p class="authorizations-summary-v109"><strong>'+
      rows.length+'</strong> participação(ões) • <strong>'+signed+'</strong> autorizada(s) • '+
      declined+' não autorizada(s) • <strong>'+pending+'</strong> pendente(s).</p>';
    if(rows.length){
      html+='<div class="authorizations-list-v109">';
      for(let i=0;i<rows.length;i++){
        const r=rows[i],complete=validAuthorization(r);
        const sim=lastSimulation(r,chiefSimulations);
        const guardians=Array.isArray(r.responsaveis)?r.responsaveis:[];
        const canReceive=!complete;
        html+='<article class="authorizations-card-v109" data-chief-authorization="'+i+'">'+
          '<strong>'+esc(r.jovem_nome)+'</strong>'+
          '<small>'+esc(r.secao_nome)+' • '+esc(r.titulo)+'</small>'+
          '<small>'+esc(when(r.inicio))+' • '+esc(r.local||'Local não informado')+'</small>'+
          '<p class="authorizations-status-v109">'+esc(statusLabel(r))+
          (complete?' • '+esc(r.nome_assinante||'')+' • '+esc(when(r.assinado_em)):'')+'</p>'+
          (!complete&&sim?'<p class="auth-simulation-v121">Simulação de assinatura (não é autorização válida): '+
            esc(sim.nome_informado)+' • '+esc(sim.documento_tipo)+' final '+esc(sim.documento_final)+
            ' • '+esc(when(sim.registrado_em))+'</p>':'');
        if(canReceive && guardians.length){
          html+='<div class="authorizations-sign-v109">'+
            '<label>Responsável que assinou o papel'+
            '<select data-paper-guardian><option value="">Escolher responsável vinculado</option>'+
            guardians.map(g=>'<option value="'+Number(g.id)+'">'+esc(g.nome)+'</option>').join('')+
            '</select></label>'+
            '<div class="authorizations-actions-v109">'+
            '<button type="button" data-receive-paper="'+i+'">Registrar via impressa recebida</button>'+
            '</div></div>';
        }
        html+='</article>';
      }
      html+='</div>';
    }else html+='<p>Não há autorizações de atividades externas publicadas para as seções disponíveis.</p>';
    host.innerHTML=html;
  }
  async function loadChief(){
    if(!canChief()||!$('chiefAuthStatusV109'))return;
    const node=$('chiefAuthStatusV109');node.textContent='Consultando autorizações das seções...';
    try{
      const [items,sims]=await Promise.all([
        client.rpc('listar_autorizacoes_chefia_v109',{p_secao_id:null}),
        client.rpc('listar_simulacoes_autorizacao_v121',{p_modo:'chefia'})
      ]);
      if(items.error)throw items.error;
      if(sims.error)throw sims.error;
      chiefRows=Array.isArray(items.data)?items.data:[];
      chiefSimulations=Array.isArray(sims.data)?sims.data:[];
      drawChief();
      node.textContent='Autorizações atualizadas.';
    }catch(e){node.textContent='Não foi possível consultar autorizações: '+e.message;}
  }
  async function receivePaper(index){
    if(busy||!canChief())return;
    const row=chiefRows[index];
    const card=$('chiefAuthListV109')?.querySelector('[data-chief-authorization="'+index+'"]');
    if(!row||!card||validAuthorization(row))return;
    const guardian=Number(card.querySelector('[data-paper-guardian]')?.value||0);
    if(!guardian){
      $('chiefAuthStatusV109').textContent='Selecione o responsável que assinou a via entregue.';
      return;
    }
    if(!window.confirm('Você conferiu fisicamente a autorização impressa e assinada para '+
      row.jovem_nome+' na atividade '+row.titulo+'? O app registrará o recebimento e a chefia deverá manter o original.'))return;
    busy=true;
    const controls=[...card.querySelectorAll('button,select')];
    controls.forEach(el=>el.disabled=true);
    $('chiefAuthStatusV109').textContent='Registrando recebimento da autorização impressa...';
    try{
      const {data,error}=await client.rpc('receber_autorizacao_papel_v109',{
        p_atividade_id:row.atividade_id,p_jovem_id:row.jovem_id,p_responsavel_id:guardian
      });
      if(error)throw error;
      if(!data?.ok)throw new Error('O servidor não confirmou o recebimento.');
      await loadChief();
      $('chiefAuthStatusV109').textContent='Autorização física registrada. Guarde o documento assinado no arquivo do grupo.';
    }catch(err){$('chiefAuthStatusV109').textContent='Não foi possível registrar: '+err.message;}
    finally{busy=false;controls.forEach(el=>{if(el.isConnected)el.disabled=false;});}
  }

  async function boot(){
    for(let i=0;i<110;i++){
      if(state.profile && $('dashboardView') && $('programmingView')){
        mountFamily();mountChief();
        if(showFamily())void loadFamily();
        $('programmingButton')?.addEventListener('click',()=>{
          if($('chiefAuthBoxV109')?.open)void loadChief();
        });
        window.addEventListener('focus',()=>{
          if(showFamily()&&!$('dashboardView')?.classList.contains('hidden'))void loadFamily();
          if(canChief()&&!$('programmingView')?.classList.contains('hidden')&&
            $('chiefAuthBoxV109')?.open)void loadChief();
        });
        return;
      }
      await new Promise(resolve=>setTimeout(resolve,200));
    }
  }
  void boot();
})();
