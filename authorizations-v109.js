/* GEArPC v109: autorizações de atividades externas, assinatura simples e vias impressas.
   Enquanto testes com responsáveis não forem concluídos, a área familiar
   aparece somente para a conta de responsável de teste. */
(() => {
  if(window.__GEARPC_AUTHORIZATIONS_V109__)return;
  window.__GEARPC_AUTHORIZATIONS_V109__=true;
  const rt=window.GEARPC_RUNTIME;if(!rt?.client||!rt?.state)return;
  const {client,state}=rt,$=id=>document.getElementById(id);
  const PARENTS_TEST_ONLY=true;
  let familyRows=[],chiefRows=[],busy=false;
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
      '.authorizations-sign-v109 input[type=text],.authorizations-v109 select{padding:10px;box-sizing:border-box;width:100%;border:1px solid #bdcedd;border-radius:8px;background:#fff;color:#1c394f;font:inherit}',
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
    const cpf='____________________________';
    const reais=value=>value===null||value===undefined||value===''?
      'A confirmar':Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
    const chef=row.chefe_responsavel||'Chefe responsável pela atividade';
    const lead='<p>Eu, <strong>'+esc(row.responsavel_nome||'Responsável legal')+
      '</strong>, inscrito(a) no CPF sob nº '+cpf+
      ', responsável legal de <strong>'+esc(row.jovem_nome)+
      '</strong>, membro do <strong>Grupo Escoteiro do Ar Paulo Carzino — 198/SC</strong>, '+
      'autorizo sua participação na atividade especial descrita abaixo:</p>';
    const item=(name,value)=>'<div><strong>'+esc(name)+': </strong>'+esc(value||'Não informado')+'</div>';
    return lead+
      '<div class="document-facts-v110">'+
      item('Atividade',row.titulo)+
      item('Data',when(row.inicio)+' até '+when(row.fim))+
      item('Local',row.local)+
      item('Transporte',row.transporte||'A confirmar')+
      item('Ponto de encontro',row.ponto_encontro||'A confirmar')+
      item('Responsável pela atividade',chef)+
      item('Custo individual da atividade',reais(row.custo_individual))+
      '</div>'+
      '<p>'+esc(row.texto_autorizacao||'O responsável confirma ciência da participação na atividade acima.')+'</p>';
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
      '<p>Quando a atividade for publicada, consulte as informações, imprima a autorização para assinar à mão ou assine eletronicamente. A chefia verá seu registro.</p>'+
      '<p id="familyAuthStatusV109" role="status"></p><div id="familyAuthListV109" class="authorizations-list-v109"></div>'+
      '<div class="authorizations-actions-v109"><button type="button" id="familyAuthRefreshV109">Atualizar autorizações</button></div>';
    modules.insertAdjacentElement('afterend',panel);
    panel.addEventListener('click',async ev=>{
      const print=ev.target.closest('[data-print-authorization]');
      if(print){const row=familyRows[Number(print.dataset.printAuthorization)];if(row)printSheet(row);return;}
      const sign=ev.target.closest('[data-sign-authorization]');
      if(sign)await signElectronic(Number(sign.dataset.signAuthorization),sign.dataset.answer);
    });
    $('familyAuthRefreshV109').addEventListener('click',loadFamily);
  }
  function drawFamily(){
    const host=$('familyAuthListV109');if(!host)return;
    const rows=familyRows;
    host.innerHTML=rows.length?rows.map((r,i)=>{
      const current=validAuthorization(r);
      return '<article class="authorizations-card-v109" data-family-auth-row="'+i+'">'+
        '<strong>'+esc(r.titulo)+'</strong>'+
        '<small>Jovem: '+esc(r.jovem_nome)+' • '+esc(r.secao_nome)+'</small>'+
        '<small>'+esc(when(r.inicio))+' até '+esc(when(r.fim))+' • '+esc(r.local||'Local a confirmar')+'</small>'+
        (r.descricao?'<p>'+esc(r.descricao)+'</p>':'')+
        '<div class="authorizations-terms-v109">'+consentDocument(r)+'</div>'+
        '<p class="authorizations-status-v109">'+esc(statusLabel(r))+
        (current?' • '+esc(r.nome_assinante||'')+' • '+esc(when(r.assinado_em)):'')+'</p>'+
        '<div class="authorizations-actions-v109">'+
         '<button type="button" data-print-authorization="'+i+'">Imprimir autorização</button></div>'+
        '<details><summary>Assinar eletronicamente / registrar resposta</summary>'+
        '<div class="authorizations-sign-v109">'+
        '<label>Digite seu nome completo conforme cadastro'+
          '<input type="text" data-sign-name maxlength="200" placeholder="'+esc(r.responsavel_nome||'Nome do responsável')+'"></label>'+
        '<label class="check"><input type="checkbox" data-sign-accept>'+
          '<span>Confirmo que sou o responsável autenticado, li os dados e o texto da autorização e estou registrando minha decisão eletronicamente.</span></label>'+
        '<div class="authorizations-actions-v109">'+
        '<button type="button" class="primary" data-sign-authorization="'+i+'" data-answer="autorizado">Assinar e autorizar</button>'+
        '<button type="button" data-sign-authorization="'+i+'" data-answer="nao_autorizado">Não autorizar</button></div>'+
        '</div></details></article>';
    }).join(''):'<p>Nenhuma atividade externa aguardando autorização para os jovens vinculados a esta conta.</p>';
  }
  async function loadFamily(){
    if(!showFamily()||!$('familyAuthStatusV109'))return;
    const message=$('familyAuthStatusV109');
    message.textContent='Verificando atividades publicadas...';
    try{
      const {data,error}=await client.rpc('listar_autorizacoes_familia_v109');
      if(error)throw error;
      familyRows=Array.isArray(data)?data:[];
      drawFamily();
      const pending=familyRows.filter(r=>!validAuthorization(r)).length;
      message.textContent=familyRows.length+
        ' autorização(ões) de atividade externa • '+pending+' pendente(s).';
    }catch(err){message.textContent='Não foi possível consultar autorizações: '+err.message;}
  }
  async function signElectronic(index,answer){
    if(busy||!showFamily())return;
    const row=familyRows[index],host=$('familyAuthListV109')?.querySelector('[data-family-auth-row="'+index+'"]');
    if(!row||!host)return;
    const name=host.querySelector('[data-sign-name]')?.value?.trim();
    const checked=host.querySelector('[data-sign-accept]')?.checked;
    if(!name||!checked){
      $('familyAuthStatusV109').textContent='Digite seu nome completo e marque a confirmação para assinar.';
      return;
    }
    const choice=answer==='autorizado'?'AUTORIZAR':'NÃO AUTORIZAR';
    if(!window.confirm('Confirma que deseja '+choice+' a participação de '+
      row.jovem_nome+' na atividade '+row.titulo+'?'))return;
    busy=true;
    const controls=[...host.querySelectorAll('button,input')];controls.forEach(el=>el.disabled=true);
    $('familyAuthStatusV109').textContent='Registrando sua assinatura...';
    try{
      const {data,error}=await client.rpc('assinar_autorizacao_eletronica_v109',{
        p_atividade_id:row.atividade_id,p_jovem_id:row.jovem_id,
        p_status:answer,p_nome_digitado:name,p_termo_aceito:true
      });
      if(error)throw error;
      if(data?.ok!==true)throw new Error('Assinatura não confirmada pelo servidor.');
      await loadFamily();
      $('familyAuthStatusV109').textContent='Resposta assinada eletronicamente e disponível à chefia.';
    }catch(err){
      $('familyAuthStatusV109').textContent='Não foi possível assinar: '+err.message;
    }finally{busy=false;controls.forEach(el=>{if(el.isConnected)el.disabled=false;});}
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
      '<p class="notice">O CPF deverá ser preenchido pelo responsável na via impressa, pois ainda não está registrado no Conecta. '+
      'Entregue a autorização assinada à chefia. Não se trata de ficha médica.</p>'+
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
        const guardians=Array.isArray(r.responsaveis)?r.responsaveis:[];
        const canReceive=!complete;
        html+='<article class="authorizations-card-v109" data-chief-authorization="'+i+'">'+
          '<strong>'+esc(r.jovem_nome)+'</strong>'+
          '<small>'+esc(r.secao_nome)+' • '+esc(r.titulo)+'</small>'+
          '<small>'+esc(when(r.inicio))+' • '+esc(r.local||'Local não informado')+'</small>'+
          '<p class="authorizations-status-v109">'+esc(statusLabel(r))+
          (complete?' • '+esc(r.nome_assinante||'')+' • '+esc(when(r.assinado_em)):'')+'</p>';
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
      const {data,error}=await client.rpc('listar_autorizacoes_chefia_v109',{p_secao_id:null});
      if(error)throw error;
      chiefRows=Array.isArray(data)?data:[];
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
