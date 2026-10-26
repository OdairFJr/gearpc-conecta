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
