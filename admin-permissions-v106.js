(() => {
  if (window.__GEARPC_ADMIN_PERMISSIONS_V106__) return;
  window.__GEARPC_ADMIN_PERMISSIONS_V106__ = true;
  const rt=window.GEARPC_RUNTIME;if(!rt?.client||!rt?.state)return;
  const {client,state}=rt,$=id=>document.getElementById(id);
  let people=[],history=[],busy=false;
  const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const isAdmin=()=>state.profile?.tipo==='administrador';
  const stamp=x=>{if(!x)return 'Sem data';const d=new Date(x);return Number.isNaN(d.getTime())?
    'Sem data':d.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'});};
  const role=x=>({administrador:'Administrador',chefia:'Chefia',responsavel:'Responsável'})[x]||x||'?';

  function mount(){
    if(!isAdmin())return null;
    let node=$('adminsV106');if(node)return node;
    const summary=$('accessView')?.querySelector('.access-summary');
    if(!summary)return null;
    const style=document.createElement('style');style.id='adminsCssV106';
    style.textContent=[
      '.admins-v106{background:#fff;border:1px solid #cad8e5;border-radius:15px;padding:14px;margin:14px 0}',
      '.admins-v106 h3{margin:0 0 6px;color:#0a376c}',
      '.admins-v106 p{font-size:.82rem;color:#516b81;line-height:1.5;margin:4px 0 10px}',
      '.admins-v106-list{display:grid;gap:8px;margin:11px 0}',
      '.admins-v106-item{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px;background:#f8fafc;border:1px solid #dce6ef;border-radius:11px}',
      '.admins-v106-item strong{display:block;color:#233e5b;overflow-wrap:anywhere}',
      '.admins-v106-item small{display:block;font-size:.73rem;color:#59728a;margin-top:5px}',
      '.admins-v106-item button{border:1px solid #d5b4b4;background:#fff;color:#9a3333;border-radius:9px;padding:9px;font-weight:750;cursor:pointer}',
      '.admins-v106 details{border-top:1px solid #e5ebf0;padding-top:12px;margin-top:14px}',
      '.admins-v106 summary{font-weight:850;color:#164a75;cursor:pointer;font-size:.85rem}',
      '.admins-v106-form{display:grid;gap:10px;margin-top:12px}',
      '.admins-v106-form label{font-size:.77rem;font-weight:750;color:#485f75;display:grid;gap:5px}',
      '.admins-v106-form select,.admins-v106-form textarea{font:inherit;box-sizing:border-box;width:100%;border:1px solid #becedc;border-radius:9px;padding:10px;background:#fff;color:#234}',
      '.admins-v106-form textarea{resize:vertical;min-height:65px}',
      '.admins-v106-form button{justify-self:start;padding:10px 12px;background:#0a376c;color:#fff;border:0;border-radius:9px;font-weight:850;cursor:pointer}',
      '.admins-v106 button:disabled{opacity:.55;cursor:wait}',
      '.admins-v106-history article{font-size:.78rem;color:#425b72;border-bottom:1px solid #e7edf2;padding:10px 0;line-height:1.5}',
      '.admins-v106-history strong{color:#173f70}',
      '.admins-v106-history small{color:#6a8094}',
      '#adminsStatusV106{min-height:16px;font-size:.78rem}',
      '@media(max-width:640px){.admins-v106-item{align-items:flex-start;flex-direction:column}}'
    ].join('');
    document.head.appendChild(style);
    node=document.createElement('section');node.id='adminsV106';node.className='admins-v106';
    node.innerHTML='<h3>Administradores do GEArPC Conecta</h3>'+
      '<p>Lista de quem possui acesso administrativo completo. Revise quando a diretoria mudar.</p>'+
      '<div id="adminsListV106" class="admins-v106-list"></div>'+
      '<details><summary>Conceder acesso a outro chefe</summary><div class="admins-v106-form">'+
      '<label>Chefe<select id="adminsSelectV106"></select></label>'+
      '<label>Motivo da alteração (opcional, até 500 caracteres)'+
      '<textarea id="adminsReasonV106" maxlength="500" placeholder="Ex.: mudança de diretoria"></textarea></label>'+
      '<button id="adminsGrantV106" type="button">Conceder acesso administrativo</button></div></details>'+
      '<details><summary>Histórico de concessões e retiradas</summary>'+
      '<p>As permissões que já existiam antes deste controle não têm autor nem data de concessão conhecidos.</p>'+
      '<div id="adminsHistoryV106" class="admins-v106-history"></div></details>'+
      '<p id="adminsStatusV106" role="status"></p>';
    summary.insertAdjacentElement('afterend',node);
    node.addEventListener('click',async e=>{
      const revoke=e.target.closest('[data-revoke-v106]');
      if(revoke)await change(revoke.dataset.revokeV106,false);
      else if(e.target.closest('#adminsGrantV106'))await change($('adminsSelectV106').value,true);
    });
    return node;
  }
  function draw(){
    if(!mount())return;
    const persons=new Map(people.map(p=>[p.user_id,p.nome_completo]));
    const admins=people.filter(p=>p.tipo==='administrador')
      .sort((a,b)=>a.nome_completo.localeCompare(b.nome_completo,'pt-BR'));
    const active=admins.filter(p=>p.ativo).length;
    $('adminsListV106').innerHTML='<p><strong>'+active+'</strong> administrador(es) ativo(s)'+
      (admins.length>active?' • '+(admins.length-active)+' inativo(s) ainda com perfil administrativo':'')+'</p>'+
      (admins.length?admins.map(p=>{
        const button=p.user_id===state.user?.id?
          '<small>Seu acesso — não pode remover a si próprio</small>':
          '<button type="button" data-revoke-v106="'+esc(p.user_id)+'">Retirar acesso</button>';
        return '<article class="admins-v106-item"><div><strong>'+esc(p.nome_completo)+
          '</strong><small>'+(p.ativo?'Administrador ativo':'Conta inativa')+
          (p.chefe_id?' • Cadastro de chefia preservado':'')+'</small></div>'+button+'</article>';
      }).join(''):'<p>Nenhum administrador identificado.</p>');
    const options=people.filter(p=>p.ativo&&p.tipo==='chefia'&&p.chefe_id&&!p.eh_teste)
      .sort((a,b)=>a.nome_completo.localeCompare(b.nome_completo,'pt-BR'));
    const select=$('adminsSelectV106'),previous=select.value;
    select.innerHTML='<option value="">Selecione um chefe</option>'+
      options.map(p=>'<option value="'+esc(p.user_id)+'">'+esc(p.nome_completo)+'</option>').join('');
    if(options.some(p=>p.user_id===previous))select.value=previous;
    $('adminsGrantV106').disabled=!options.length;

    $('adminsHistoryV106').innerHTML=history.length?history.map(h=>{
      const who=persons.get(h.user_id)||'Usuário não identificado';
      const actor=h.alterado_por?(persons.get(h.alterado_por)||'Administrador anterior'):'Autor não registrado';
      const verb=h.acao==='identificado'?'Já era administrador na implantação':
        h.acao==='concedido'?'Acesso concedido':'Acesso retirado';
      return '<article><strong>'+esc(who)+'</strong> — '+esc(verb)+
        '<div><small>'+esc(stamp(h.realizado_em))+' • Por: '+esc(actor)+'</small></div>'+
        (h.tipo_anterior?'<div>'+esc(role(h.tipo_anterior))+' → '+esc(role(h.tipo_novo))+'</div>':'')+
        (h.motivo?'<div>'+esc(h.motivo)+'</div>':'')+'</article>';
    }).join(''):'<p>Sem histórico registrado.</p>';
  }
  async function refresh(){
    if(!isAdmin()||!mount())return;
    $('adminsStatusV106').textContent='Atualizando relação de administradores...';
    const [users,log]=await Promise.all([
      client.from('perfis_usuarios')
        .select('user_id,nome_completo,tipo,ativo,chefe_id,eh_teste').order('nome_completo'),
      client.from('administradores_historico')
        .select('id,user_id,acao,tipo_anterior,tipo_novo,alterado_por,motivo,realizado_em')
        .order('realizado_em',{ascending:false}).limit(100)
    ]);
    if(users.error||log.error)throw users.error||log.error;
    people=users.data||[];history=log.data||[];
    draw();
    $('adminsStatusV106').textContent='Relação atualizada.';
  }
  async function change(id,grant){
    if(!isAdmin()||busy)return;
    const p=people.find(x=>x.user_id===id);
    if(!p){$('adminsStatusV106').textContent='Selecione um chefe cadastrado.';return;}
    if(!grant&&id===state.user?.id){
      $('adminsStatusV106').textContent='Não é permitido retirar seu próprio acesso.';return;
    }
    const prompt=grant?'Conceder permissão ADMINISTRATIVA COMPLETA a '+p.nome_completo+
      '? A pessoa poderá cadastrar e editar dados de todas as seções.':
      'Retirar acesso administrativo de '+p.nome_completo+
      '? A pessoa voltará ao perfil de chefia e perderá permissão geral de edição.';
    if(!window.confirm(prompt))return;
    busy=true;
    const controls=[...mount().querySelectorAll('button,select,textarea')];
    const reason=$('adminsReasonV106').value.trim()||null;
    controls.forEach(el=>el.disabled=true);
    $('adminsStatusV106').textContent=grant?'Concedendo acesso...':'Retirando acesso...';
    try{
      const {data,error}=await client.rpc('gerenciar_administrador_v106',{
        p_usuario_id:id,p_tornar_admin:grant,p_motivo:reason
      });
      if(error)throw error;
      if(data?.ok!==true)throw new Error('O servidor não confirmou a alteração.');
      await refresh();
      $('adminsStatusV106').textContent=(grant?'Acesso concedido.':'Acesso retirado.')+
        ' Mudança salva no histórico; a pessoa deverá sair e entrar novamente no aplicativo.';
      $('adminsReasonV106').value='';
    }catch(e){
      $('adminsStatusV106').textContent='Não foi possível alterar: '+(e.message||e);
    }finally{
      busy=false;
      controls.forEach(el=>{if(el.isConnected)el.disabled=false;});
      $('adminsGrantV106').disabled=!people.some(p=>p.ativo&&p.tipo==='chefia'&&p.chefe_id&&!p.eh_teste);
    }
  }
  async function load(){
    if(!isAdmin())return;
    try{await refresh();}
    catch(e){if($('adminsStatusV106'))$('adminsStatusV106').textContent=
      'Não foi possível consultar os administradores: '+(e.message||e);}
  }
  async function boot(){
    for(let i=0;i<100;i++){
      if(isAdmin()){
        mount();await load();
        $('accessButton')?.addEventListener('click',load);
        $('accessRefreshButton')?.addEventListener('click',load);
        window.addEventListener('focus',()=>{
          if(!$('accessView')?.classList.contains('hidden'))void load();
        });
        return;
      }
      if(state.profile?.tipo&&state.profile.tipo!=='administrador')return;
      await new Promise(resolve=>setTimeout(resolve,200));
    }
  }
  void boot();
})();
