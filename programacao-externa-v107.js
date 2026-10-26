/* v107 - Programação externa, acampamentos, jornadas e eventos especiais. */
(() => {
 if (window.__GEARPC_EXTERNAL_PROGRAM_V107__) return;
 window.__GEARPC_EXTERNAL_PROGRAM_V107__=true;
 const rt=window.GEARPC_RUNTIME;if(!rt?.client||!rt?.state)return;
 const {client,state}=rt,$=id=>document.getElementById(id);
 const TYPES={externa:'Atividade externa',acampamento:'Acampamento',acantonamento:'Acantonamento',
  jornada:'Jornada',visita:'Visita educativa',evento:'Evento',especial:'Atividade especial'};
 const STATUS={rascunho:'Rascunho',em_analise:'Aguardando DME',ajustes:'Ajustes solicitados',
  aprovada:'Aprovada',publicada:'Publicada para responsáveis'};
 let data=[],sections=[],own=[],editing=null,steps=[],busy=false;
 const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
 const admin=()=>state.profile?.tipo==='administrador';
 const chief=()=>state.profile?.tipo==='chefia';
 const manager=id=>admin()||chief()&&own.includes(Number(id));
 const dateLocal=iso=>{
   if(!iso)return '';
   const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',year:'numeric',
      month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})
     .formatToParts(new Date(iso));
   const x=k=>parts.find(p=>p.type===k)?.value||'';
   return x('year')+'-'+x('month')+'-'+x('day')+'T'+x('hour')+':'+x('minute');
 };
 const timestamp=s=>s?new Date(s+':00-03:00').toISOString():null;
 const dateFormat=s=>s?new Date(s).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',
   dateStyle:'short',timeStyle:'short'}):'Não informada';
 const nowLocal=()=>dateLocal(new Date().toISOString());
 const status=(text)=>{const node=$('externalStatusV107');if(node)node.textContent=text||'';};
 const formStatus=text=>{const node=$('externalFormStatusV107');if(node)node.textContent=text||'';};

 function styles(){
  if($('externalCssV107'))return;
  const style=document.createElement('style');style.id='externalCssV107';
  style.textContent=[
    '.external-box-v107{border:1px solid #c7d9e9;border-radius:15px;background:#f7fbfe;padding:15px;margin:14px 0}',
    '.external-box-v107>summary{font-weight:850;color:#144369;font-size:1rem;cursor:pointer}',
    '.external-box-v107 p{color:#546f83;font-size:.82rem;line-height:1.5}',
    '.external-actions-v107{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin:12px 0}',
    '.external-actions-v107 button,.external-control-v107 button{padding:9px 12px;font-weight:750;border:1px solid #b6c9d9;border-radius:9px;background:#fff;color:#0a376c;cursor:pointer}',
    '.external-actions-v107 button:first-child,.external-primary-v107{background:#0a376c!important;color:white!important}',
    '.external-box-v107 button:disabled{opacity:.52;cursor:wait}',
    '.external-list-v107{display:grid;gap:8px}',
    '.external-card-v107{border:1px solid #d9e4ee;border-radius:10px;background:white;padding:11px;display:flex;justify-content:space-between;gap:12px;align-items:center}',
    '.external-card-v107 strong{display:block;color:#223f59}',
    '.external-card-v107 small{display:block;color:#5e758c;font-size:.75rem;margin-top:4px}',
    '.external-card-v107 button{border:1px solid #bed1df;border-radius:8px;padding:8px;background:#f5fafc;color:#0a376c;cursor:pointer}',
    '.external-editor-v107{border-top:1px solid #d4e0eb;margin-top:14px;padding-top:14px}',
    '.external-editor-v107 h3{color:#0a376c;margin:0 0 10px}',
    '.external-grid-v107{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}',
    '.external-grid-v107 label,.external-etapa-v107 label{display:grid;gap:5px;color:#405b72;font-size:.78rem;font-weight:750}',
    '.external-grid-v107 input,.external-grid-v107 select,.external-grid-v107 textarea, .external-etapa-v107 input,.external-etapa-v107 textarea{box-sizing:border-box;width:100%;border:1px solid #c1d1df;border-radius:8px;padding:10px;background:#fff;color:#253d55;font:inherit}',
    '.external-grid-v107 textarea,.external-etapa-v107 textarea{resize:vertical;min-height:64px}',
    '.external-grid-v107 .full{grid-column:1/-1}',
    '.external-etapa-v107{padding:11px;background:white;border:1px solid #d5e2ec;border-radius:10px;margin:10px 0}',
    '.external-etapa-v107 header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}',
    '.external-etapa-v107 header strong{color:#20496c}',
    '.external-notes-v107{padding:10px 12px;border-left:3px solid #709aba;background:#eaf3fa;margin:12px 0;white-space:pre-wrap;overflow-wrap:anywhere;color:#34526b;font-size:.82rem}',
    '.external-notes-v107 strong{display:block;margin-bottom:4px}',
    '.external-form-actions-v107{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}',
    '.external-form-actions-v107 button{padding:10px 12px;border:1px solid #b6cad8;border-radius:9px;background:#fff;color:#0a376c;font-weight:800;cursor:pointer}',
    '.external-status-v107{min-height:1em;color:#4a657d;font-size:.78rem}',
    '.external-hidden-v107{display:none!important}',
    '@media(max-width:650px){.external-grid-v107{grid-template-columns:1fr}.external-card-v107{align-items:flex-start;flex-direction:column}}'
  ].join('');
  document.head.appendChild(style);
 }
 function mount(){
  const view=$('programmingView');if(!view || $('externalBoxV107'))return;
  styles();
  const box=document.createElement('details');box.id='externalBoxV107';box.className='external-box-v107';
  box.innerHTML='<summary>🏕️ Programações externas, acampamentos e especiais</summary>'+
   '<p>Planejamento para atividades fora da sede, jornadas, acampamentos, acantonamentos, visitas e eventos. O roteiro é separado da reunião semanal.</p>'+
   '<div class="external-actions-v107">'+
   '<button type="button" id="externalNewV107" class="external-primary-v107">＋ Nova programação externa</button>'+
   '<button type="button" id="externalRefreshV107">↻ Atualizar</button></div>'+
   '<p id="externalStatusV107" class="external-status-v107" role="status"></p>'+
   '<div id="externalListV107" class="external-list-v107"></div>'+
   '<section id="externalEditorV107" class="external-editor-v107 external-hidden-v107"></section>';
  view.querySelector('#programmingRoleNote')?.insertAdjacentElement('afterend',box);
  $('externalNewV107').addEventListener('click',()=>openEditor(null));
  $('externalRefreshV107').addEventListener('click',load);
  $('externalListV107').addEventListener('click',e=>{
   const btn=e.target.closest('[data-external-open]');
   if(btn)openEditor(Number(btn.dataset.externalOpen));
  });
  $('externalEditorV107').addEventListener('click',async e=>{
   const remove=e.target.closest('[data-external-remove]');
   if(remove){steps.splice(Number(remove.dataset.externalRemove),1);renderSteps();return;}
   if(e.target.closest('#externalAddStageV107')){collectSteps();steps.push({
     inicio:$('externalFromV107')?.value||nowLocal(),
     fim:$('externalToV107')?.value||nowLocal(),titulo:'',descricao:'',condutor:'',materiais:'',cuidados:''
   });renderSteps();return;}
   if(e.target.closest('#externalCancelV107')){closeEditor();return;}
   if(e.target.closest('#externalSendV107'))await action('enviar');
   if(e.target.closest('#externalApproveV107'))await action('aprovar');
   if(e.target.closest('#externalAdjustV107'))await action('ajustar');
   if(e.target.closest('#externalPublishV107'))await action('publicar');
  });
  $('externalEditorV107').addEventListener('submit',save);
  box.addEventListener('toggle',()=>{if(box.open)void load();});
  const permitted=admin()||chief();
  $('externalNewV107').classList.toggle('external-hidden-v107',!permitted);
 }
 async function load(){
  if(!mountReady() || !state.profile || state.profile.tipo==='responsavel')return;
  status('Carregando programações externas...');
  try{
   const promises=[
    client.from('secoes').select('id,nome,ramo_id,ativo').eq('ativo',true).order('id'),
    client.from('programacoes_externas')
      .select('id,secao_id,tipo,titulo,local,ponto_encontro,data_inicio,data_fim,objetivo,transporte,alimentacao,materiais,riscos,prevencoes,plano_b,responsavel_nome,custo_estimado,exige_autorizacao,texto_autorizacao,observacoes,status,parecer_dme,atividade_id,atualizado_em')
      .order('data_inicio',{ascending:false}).limit(250)
   ];
   if(chief() && state.profile?.chefe_id)promises.push(
      client.from('chefe_secoes').select('secao_id').eq('chefe_id',state.profile.chefe_id));
   const results=await Promise.all(promises);
   const err=results.find(r=>r.error)?.error;
   if(err)throw err;
   sections=results[0].data||[];
   data=results[1].data||[];
   own=chief()?(results[2]?.data||[]).map(r=>Number(r.secao_id)):[];
   list();
   status(data.length+' programação(ões) cadastrada(s).');
  }catch(error){status('Erro ao carregar: '+error.message);}
 }
 function mountReady(){return Boolean($('externalBoxV107'));}
 function list(){
  const byId=new Map(sections.map(s=>[Number(s.id),s.nome]));
  $('externalListV107').innerHTML=data.length?data.map(row=>{
   return '<article class="external-card-v107"><div><strong>'+esc(row.titulo)+'</strong>'+
     '<small>'+esc(TYPES[row.tipo]||row.tipo)+' • '+esc(byId.get(Number(row.secao_id))||'Seção')+
     ' • '+esc(dateFormat(row.data_inicio))+' até '+esc(dateFormat(row.data_fim))+
     '</small><small>'+esc(row.local)+' • '+esc(STATUS[row.status]||row.status)+'</small></div>'+
     '<button type="button" data-external-open="'+Number(row.id)+'">Abrir roteiro</button></article>';
  }).join(''):'<p>Nenhuma programação externa cadastrada. Use “Nova programação externa” para começar.</p>';
 }

 function textField(label,key,value='',long=false,full=false,required=false){
  const id='external_'+key+'_v107';
  const field=long?
    '<textarea id="'+id+'" rows="2" '+(required?'required':'')+'>'+esc(value)+'</textarea>':
    '<input id="'+id+'" type="text" value="'+esc(value)+'" '+(required?'required':'')+' />';
  return '<label class="'+(full?'full':'')+'">'+esc(label)+field+'</label>';
 }
 function dateField(label,key,value,required=false){
  return '<label>'+esc(label)+'<input id="external_'+key+'_v107" type="datetime-local" value="'+esc(value||'')+
   '" '+(required?'required':'')+' /></label>';
 }
 function stageField(index,key,label,value,long=false){
  const common='data-stage-idx="'+index+'" data-stage-key="'+key+'"';
  const type=key==='inicio'||key==='fim'?'datetime-local':'text';
  return '<label'+(long?' class="full"':'')+'>'+esc(label)+(long?
   '<textarea '+common+' rows="2">'+esc(value||'')+'</textarea>':
   '<input type="'+type+'" '+common+' value="'+esc(value||'')+'" />')+'</label>';
 }
 function collectSteps(){
  if(!$('externalStagesV107'))return;
  steps=[...$('externalStagesV107').querySelectorAll('.external-etapa-v107')].map((node)=>{
   const row={};
   node.querySelectorAll('[data-stage-key]').forEach(input=>{
     row[input.dataset.stageKey]=input.value||'';
   });
   return row;
  });
 }
 function renderSteps(){
  const host=$('externalStagesV107');if(!host)return;
  const edit=canEdit();
  host.innerHTML=steps.length?steps.map((row,i)=>
   '<article class="external-etapa-v107"><header><strong>Etapa '+(i+1)+'</strong>'+
   (edit?'<button type="button" data-external-remove="'+i+'">Remover</button>':'')+
   '</header><div class="external-grid-v107">'+
   stageField(i,'inicio','Início',row.inicio)+stageField(i,'fim','Término',row.fim)+
   stageField(i,'titulo','Atividade / etapa',row.titulo)+
   stageField(i,'condutor','Quem conduz',row.condutor)+
   stageField(i,'descricao','Descrição / dinâmica',row.descricao,true)+
   stageField(i,'materiais','Materiais específicos',row.materiais,true)+
   stageField(i,'cuidados','Segurança e cuidados da etapa',row.cuidados,true)+
   '</div></article>').join(''):'<p>Nenhuma etapa adicionada. Monte o roteiro com os períodos da atividade.</p>';
  if(!edit)host.querySelectorAll('input,textarea').forEach(el=>el.disabled=true);
 }
 function canEdit(){return (!editing||['rascunho','ajustes'].includes(editing.status))
   &&manager(Number($('externalSectionV107')?.value||editing?.secao_id));}

 async function openEditor(id){
  if(!state.profile || state.profile.tipo==='responsavel')return;
  formStatus('');
  try{
   const row=id?data.find(r=>Number(r.id)===Number(id)):null;
   if(id&&!row){status('Programação não encontrada. Atualize a lista.');return;}
   editing=row?{...row}:null;
   steps=[];
   if(id){
    const {data:items,error}=await client.from('programacoes_externas_etapas')
      .select('ordem,inicio,fim,titulo,descricao,condutor,materiais,cuidados')
      .eq('programacao_id',Number(id)).order('ordem');
    if(error)throw error;
    steps=(items||[]).map(item=>({...item,inicio:dateLocal(item.inicio),fim:dateLocal(item.fim)}));
   }
   const permitted=admin()?sections:sections.filter(s=>own.includes(Number(s.id)));
   if(!row&&!permitted.length){
     status('Você não tem seção vinculada para criar esta programação.');return;
   }
   const select=sections.filter(s=>row?Number(s.id)===Number(row.secao_id):
      permitted.some(p=>Number(p.id)===Number(s.id)));
   const title=row?.titulo||'';
   const existing=row?.status||'rascunho';
   const editable=!row||['rascunho','ajustes'].includes(existing);
   const disabledControls=!editable;
   const types=Object.entries(TYPES).map(([key,value])=>
     '<option value="'+key+'" '+(key===(row?.tipo||'externa')?'selected':'')+'>'+esc(value)+'</option>').join('');
   const options=select.map(section=>'<option value="'+section.id+'">'+esc(section.nome)+'</option>').join('');
   const note=row?.parecer_dme?
      '<aside class="external-notes-v107"><strong>Orientações do DME</strong>'+esc(row.parecer_dme)+'</aside>':'';
   $('externalEditorV107').innerHTML=
    '<h3>'+(row?'Programação externa: '+esc(row.titulo):'Nova programação externa')+'</h3>'+
    '<p>Tipo: '+esc(STATUS[existing]||existing)+
      '. Os responsáveis somente verão os dados da atividade depois da publicação.</p>'+note+
    '<form id="externalFormV107"><div class="external-grid-v107">'+
    '<label>Seção<select id="externalSectionV107" required>'+options+'</select></label>'+
    '<label>Tipo de atividade<select id="externalTypeV107">'+types+'</select></label>'+
    textField('Nome / título','title',title,false,true,true)+
    textField('Objetivo educativo','objective',row?.objetivo,true,true)+
    dateField('Início (data e hora)','from',dateLocal(row?.data_inicio),true)+
    dateField('Término (data e hora)','to',dateLocal(row?.data_fim),true)+
    textField('Local da atividade','place',row?.local,false,true,true)+
    textField('Ponto de encontro e retorno','meeting',row?.ponto_encontro,false,true)+
    textField('Chefe responsável / coordenação','leader',row?.responsavel_nome,false,true)+
    textField('Transporte e deslocamentos','transport',row?.transporte,true,true)+
    textField('Alimentação e água','food',row?.alimentacao,true,true)+
    textField('Materiais gerais e equipamentos','materials',row?.materiais,true,true)+
    '<label>Custo estimado por participante (R$)<input id="externalCostV107" type="number" min="0" step="0.01" value="'+
     esc(row?.custo_estimado??'')+'" /></label>'+
    '<label>Solicitar autorização? <select id="externalPermissionV107"><option value="true"'+
     (row?.exige_autorizacao!==false?' selected':'')+
     '>Sim</option><option value="false"'+(row?.exige_autorizacao===false?' selected':'')+
     '>Não</option></select></label>'+
    textField('Riscos identificados','risks',row?.riscos,true,true)+
    textField('Prevenção e medidas de segurança','prevention',row?.prevencoes,true,true)+
    textField('Plano alternativo / tempo ruim','backup',row?.plano_b,true,true)+
    textField('Texto para a autorização dos responsáveis','permissionText',row?.texto_autorizacao,true,true)+
    textField('Orientações e observações','notes',row?.observacoes,true,true)+
    '</div><h3>Roteiro / linha do tempo</h3>'+
    '<p>Inclua as etapas com horários reais; o roteiro pode atravessar vários dias.</p>'+
    '<div id="externalStagesV107"></div>'+
    '<div class="external-actions-v107"><button type="button" id="externalAddStageV107">＋ Adicionar etapa</button></div>'+
    '<div class="external-form-actions-v107">'+
    (editable?'<button class="external-primary-v107" type="submit" id="externalSaveV107">Salvar rascunho / alterações</button>':'')+
    (editable?'<button type="button" id="externalSendV107">Salvar e enviar ao DME</button>':'')+
    (admin()&&existing==='em_analise'?'<button type="button" id="externalApproveV107">Aprovar</button>'+
      '<button type="button" id="externalAdjustV107">Solicitar ajustes</button>':'')+
    (admin()&&existing==='aprovada'?'<button type="button" id="externalPublishV107">Publicar para responsáveis</button>':'')+
    '<button type="button" id="externalCancelV107">Fechar</button>'+
    '</div><p id="externalFormStatusV107" role="status" class="external-status-v107"></p>'+
    (existing==='publicada'?'<p>Esta programação foi publicada no cadastro de atividades para os responsáveis. Para preservar autorizações e registros, ela não pode mais ser editada neste módulo.</p>':'')+
    '</form>';
   if(row)$('externalSectionV107').value=String(row.secao_id);
   $('externalEditorV107').classList.remove('external-hidden-v107');
   renderSteps();
   if(disabledControls){
     $('externalFormV107').querySelectorAll('input,textarea,select')
       .forEach(el=>el.disabled=true);
     $('externalAddStageV107')?.setAttribute('disabled','');
   }
   $('externalEditorV107').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(error){status('Não foi possível abrir o roteiro: '+error.message);}
 }
 function closeEditor(){
   editing=null;steps=[];
   $('externalEditorV107')?.classList.add('external-hidden-v107');
 }

 async function persist(){
  if(busy)return null;
  if(!canEdit()){formStatus('Essa programação não permite alterações no momento.');return null;}
  collectSteps();
  const value=k=>$('external_'+k+'_v107')?.value?.trim()||'';
  const start=$('externalFromV107')?.value,end=$('externalToV107')?.value;
  const section=Number($('externalSectionV107')?.value||0);
  if(!section || !manager(section)){formStatus('Escolha uma seção autorizada.');return null;}
  if(!start||!end||start>=end){formStatus('Informe início e término válidos.');return null;}
  if(value('title').length<3 || !value('place')){formStatus('Informe título e local.');return null;}
  if(steps.some(s=>!s.inicio||!s.fim||s.inicio>=s.fim||
    s.inicio<start||s.fim>end||!String(s.titulo||'').trim())){
      formStatus('Confira as datas, a ordem e o título de cada etapa.');return null;
  }
  const dados={
   id:editing?.id||null,
   atualizado_em:editing?.atualizado_em||null,
   secao_id:section,tipo:$('externalTypeV107').value,
   titulo:value('title'),objetivo:value('objective'),
   local:value('place'),ponto_encontro:value('meeting'),
   data_inicio:timestamp(start),data_fim:timestamp(end),
   transporte:value('transport'),alimentacao:value('food'),
   materiais:value('materials'),responsavel_nome:value('leader'),
   riscos:value('risks'),prevencoes:value('prevention'),
   plano_b:value('backup'),custo_estimado:$('externalCostV107').value||null,
   exige_autorizacao:$('externalPermissionV107').value==='true',
   texto_autorizacao:value('permissionText'),
   observacoes:value('notes'),
   etapas:steps.map((etapa)=>({
      inicio:timestamp(etapa.inicio),fim:timestamp(etapa.fim),
      titulo:etapa.titulo,descricao:etapa.descricao,
      condutor:etapa.condutor,materiais:etapa.materiais,cuidados:etapa.cuidados
   }))
  };
  busy=true;formStatus('Salvando roteiro...');
  try{
   const {data:result,error}=await client.rpc('salvar_programacao_externa_v107',{p_dados:dados});
   if(error)throw error;
   if(!result?.id)throw new Error('O servidor não confirmou o registro.');
   await load();
   editing=data.find(r=>Number(r.id)===Number(result.id))||{
     ...dados,id:result.id,atualizado_em:result.atualizado_em,status:result.status};
   formStatus('Roteiro salvo.');
   return Number(result.id);
  }catch(error){
   formStatus('Não foi possível salvar: '+error.message);
   return null;
  }finally{busy=false;}
 }
 async function save(event){
  event.preventDefault();
  const id=await persist();if(id)await openEditor(id);
 }
 async function action(operation){
  if(busy)return;
  let id=editing?.id;
  if(operation==='enviar'){
   id=await persist();
   if(!id)return;
  }else if(!id){formStatus('Salve a programação primeiro.');return;}
  let comment=null;
  if(operation==='aprovar'){
    comment=window.prompt('Comentários e orientações do DME (opcional):','');
    if(comment===null)return;
  }else if(operation==='ajustar'){
    comment=window.prompt('Informe as orientações para correção:','');
    if(!comment?.trim()){formStatus('Descreva quais ajustes são necessários.');return;}
  }else if(operation==='publicar'){
    if(!window.confirm('Publicar esta atividade aprovada para o cadastro usado pelos responsáveis? A programação será bloqueada para preservar os registros e autorizações.'))return;
  }
  busy=true;formStatus('Atualizando situação...');
  try{
    const {error}=await client.rpc('mudar_status_programacao_externa_v107',{
      p_id:id,p_acao:operation,p_parecer:comment
    });
    if(error)throw error;
    await load();await openEditor(id);
    formStatus(operation==='enviar'?'Enviada para conferência do DME.':
      operation==='aprovar'?'Atividade aprovada; ainda não publicada.':
      operation==='ajustar'?'Ajustes solicitados à chefia.':'Atividade publicada para os responsáveis.');
  }catch(error){formStatus('Não foi possível concluir: '+error.message);}
  finally{busy=false;}
 }
 async function boot(){
  for(let i=0;i<95;i++){
   if(state.profile && $('programmingView')){
     if(state.profile.tipo!=='responsavel'){
       mount();
       $('programmingButton')?.addEventListener('click',load);
     }
     return;
   }
   await new Promise(resolve=>setTimeout(resolve,200));
  }
 }
 void boot();
})();
