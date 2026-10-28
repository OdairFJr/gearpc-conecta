/* v107 - Programação externa, acampamentos, jornadas e eventos especiais. */
(() => {
 if (window.__GEARPC_EXTERNAL_PROGRAM_V107__) return;
 window.__GEARPC_EXTERNAL_PROGRAM_V107__=true;
 const rt=window.GEARPC_RUNTIME;if(!rt?.client||!rt?.state)return;
 const {client,state}=rt,$=id=>document.getElementById(id);
 const PAxtuTypes=[
 'Acampamento','Acampamento de Férias Escoteiro (AFE)','Acampamento de grupo',
 'Acampamento de patrulha','Acampamento de seção','Acantonamento',
 'Arrecadação de donativos','ASEC','Assembleia','Atividade Aquática',
 'Atividade Cívica','Atividade Comunitária','Atividade Cultural',
 'Atividade da Modalidade do Ar','Atividade da Modalidade do Mar',
 'Atividade de acessibilidade, diversidade e inclusão','Atividade de Alcateia',
 'Atividade de Clã','Atividade de Divulgação','Atividade de Grupo',
 'Atividade de modalidade','Atividade de Patrulha','Atividade de Ramo',
 'Atividade Distrital','Atividade Ecológica','Atividade Embarcada',
 'Atividade Espiritual','Atividade Esportiva','Atividade Internacional',
 'Atividade Regional','Atividade Religiosa','Atividade Social',
 'Atividades de especialidade','Aventura Sênior','Bivaque','Boa ação',
 'Caçada Nacional','Caminhada','Campanha Financeira',
 'Campeões da Natureza - Escoteiro','Campeões da Natureza - Lobinho',
 'Campeões da Natureza - Sênior','Certificado de funcionamento',
 'Certificado de funcionamento 2','Congresso','Corpus Christi',
 'Corrida de Aventura','CQWS HF','Cruzeiro Marítimo','Curso','Debate',
 'Dia do amigo','Dia do Sênior e do Pioneiro','Dia Internacional da Juventude',
 'Dia Mundial da Limpeza','Dia Mundial do Meio Ambiente','Echolink DMR',
 'EducAÇÃO escoteira','Educação para Gentileza e Generosidade',
 'Elo Nacional','Escalada','Escoteiros contra a COVID-19',
 'Escoteiros do Mundo','Espeleologia (visita a caverna)','Excursão',
 'Festa','Fogo de Conselho','Fórum','Gincana',
 'Gincana Cultural 2016/2017 - 2ª fase',
 'Gincana Cultural Nacional Escoteira','Grande Jogo',
 'Grande Jogo Aéreo','Grande Jogo Naval','Hora do Planeta','Indaba',
 'Inovadores de Impacto','Insígnia HeforShe','Insígnia Mares Limpos',
 'Jamboree','Jogo da cidade','Jornada','Jornada X',
 'JOTA','Jota/Joti','JOTI','JOTI - Edição especial',
 'Junho Laranja','Lamparada','Luz da Paz de Belém',
 'Maio Amarelo','Março Roxo','Mensageiros da Paz (MoP)',
 'Módulo','MUTCOM','MUTECO','Mutirão de Doação de Sangue e REDOME',
 'Mutirão Nacional de Voluntariado','Mutirão Pioneiro',
 'Oficina','Palestras','Parceiros / Campanhas Nacionais',
 'Parceiros da UEL','Páscoa do Senhor','Passeio',
 'Programa Ambiental da Base Escoteira','Quilômetros pela Paz',
 'Radioescotismo','Regata','Restaura Natureza','Reunião especial'
 ];
 const TRANSPORT_OPTIONS=['A pé','Avião','Barco','Bicicleta','Carro','Metrô','Ônibus','Outros','Trem'];
 const TYPES={externa:'Atividade externa',acampamento:'Acampamento',acantonamento:'Acantonamento',
  jornada:'Jornada',visita:'Visita educativa',evento:'Evento',especial:'Atividade especial'};
 const STATUS={rascunho:'Rascunho',em_analise:'Aguardando DME',ajustes:'Ajustes solicitados',
  aprovada:'Aprovada',publicada:'Publicada para responsáveis'};
 let data=[],sections=[],own=[],editing=null,steps=[],busy=false;
 let people={jovens:[],chefes:[],chefes_secoes:[]};
 let chosenSections=new Set(),chosenYouth=new Set(),chosenChiefs=new Set();
 let sectionFilter='',chiefFilter='',selectedDirector=false;
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
    '.ext-member-list-v111{display:grid;gap:5px;max-height:280px;overflow:auto;padding:10px;background:#fff;border:1px solid #d4e0eb;border-radius:10px}',
    '.ext-member-option-v111{display:flex!important;align-items:center;gap:8px;padding:4px;font-size:.79rem;color:#34516b;cursor:pointer}',
    '.ext-member-option-v111 input{width:auto!important;flex-shrink:0}',
    '.ext-rosters-v111{margin:12px 0}.ext-rosters-v111 h4{color:#1c4565;margin:8px 0}',
    '.ext-flagline-v111{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0}.ext-flagline-v111 label{display:flex;gap:6px;align-items:center}',
    '.ext-flagline-v111 input{width:auto!important}',
    '.ext-doc-v112{padding:13px;border:1px solid #c5d5e4;border-radius:10px;background:#fff;margin:10px 0 16px}',
    '.ext-doc-v112 p{margin:6px 0 10px}.ext-doc-v112 label{display:grid;gap:7px;font-size:.82rem;font-weight:800;color:#2d526e}',
    '.ext-doc-v112 input[type=file]{width:100%;box-sizing:border-box;padding:9px;border:1px solid #c3d4e2;border-radius:8px}',
    '.ext-doc-v112 .ext-doc-existing-v112{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin:12px 0}',
    '.ext-doc-v112 button{padding:9px 12px;border:1px solid #b6cad8;border-radius:8px;background:#f5faff;color:#16476d;font-weight:750}',
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
   if(remove){collectSteps();steps.splice(Number(remove.dataset.externalRemove),1);renderSteps();return;}
   if(e.target.closest('#externalAddStageV107')){collectSteps();steps.push({
     inicio:$('externalFromV107')?.value||nowLocal(),
     fim:$('externalToV107')?.value||nowLocal(),titulo:'',descricao:'',condutor:'',materiais:''
   });renderSteps();return;}
   if(e.target.closest('#externalCancelV107')){closeEditor();return;}
   if(e.target.closest('#externalSendV107'))await action('enviar');
   if(e.target.closest('#externalApproveV107'))await action('aprovar');
   if(e.target.closest('#externalAdjustV107'))await action('ajustar');
   if(e.target.closest('#externalPublishV107'))await action('publicar');
   if(e.target.closest('#externalCopyPaxtuV110'))await copyPaxtu();
   if(e.target.closest('#externalDownloadDocumentV112'))await downloadScheduleDocument();
   if(e.target.closest('#externalUnlinkDocumentV112'))await unlinkScheduleDocument();
   if(e.target.closest('#externalBindSafetyV108'))await attachSafety();
  });
  $('externalEditorV107').addEventListener('submit',save);
  box.addEventListener('toggle',()=>{if(box.open)void load();});
  $('externalEditorV107').addEventListener('change',ev=>{
    const el=ev.target;
    if(el.matches('[data-ext-section]')){
      const id=Number(el.dataset.extSection),checked=el.checked;
      if(checked){
        chosenSections.add(id);
        for(const j of people.jovens)if(Number(j.secao_id)===id&&!j.eh_teste)chosenYouth.add(Number(j.id));
        for(const link of people.chefes_secoes)
          if(Number(link.secao_id)===id&&!people.chefes.find(c=>Number(c.id)===Number(link.chefe_id))?.eh_teste)
            chosenChiefs.add(Number(link.chefe_id));
      }else{
        if(chosenSections.size===1){el.checked=true;formStatus('Selecione pelo menos uma seção.');return;}
        chosenSections.delete(id);
        for(const j of people.jovens)if(Number(j.secao_id)===id)chosenYouth.delete(Number(j.id));
        for(const link of people.chefes_secoes)
          if(Number(link.secao_id)===id&&!people.chefes_secoes.some(l=>
            Number(l.chefe_id)===Number(link.chefe_id)&&chosenSections.has(Number(l.secao_id))))
            chosenChiefs.delete(Number(link.chefe_id));
      }
      renderPeople();
    }else if(el.matches('[data-ext-youth]')){
      const id=Number(el.dataset.extYouth);
      if(el.checked)chosenYouth.add(id);else chosenYouth.delete(id);
      renderPeople();
    }else if(el.matches('[data-ext-chief]')){
      const id=Number(el.dataset.extChief);
      if(el.checked)chosenChiefs.add(id);else chosenChiefs.delete(id);
      renderPeople();
    }else if(el.id==='externalDirV111'){
      selectedDirector=el.checked;
    }else if(el.id==='externalSectionV107'){
      if(!chosenSections.has(Number(el.value))){
        const sid=Number(el.value);
        chosenSections.add(sid);
        for(const j of people.jovens)
          if(Number(j.secao_id)===sid&&!j.eh_teste)chosenYouth.add(Number(j.id));
        for(const link of people.chefes_secoes)
          if(Number(link.secao_id)===sid&&!people.chefes.find(c=>Number(c.id)===Number(link.chefe_id))?.eh_teste)
            chosenChiefs.add(Number(link.chefe_id));
        renderPeople();
      }
    }else if(el.id==='externalTypeV107'){
      if(['acampamento','acantonamento'].includes(el.value)){
        const nights=$('externalNightsV111');if(nights)nights.checked=true;
      }
      const typesMap={acampamento:'Acampamento',acantonamento:'Acantonamento',
        jornada:'Jornada',visita:'Excursão',evento:'Atividade de Grupo',
        especial:'Atividade de Grupo'};
      const field=$('externalPaxtuTypeV111');
      if(field&&typesMap[el.value])field.value=typesMap[el.value];
    }
  });
  $('externalEditorV107').addEventListener('input',ev=>{
    if(ev.target.id==='externalPeopleSearchV111'){
      sectionFilter=ev.target.value;renderPeople();
    }
    if(ev.target.id==='externalChiefSearchV111'){
      chiefFilter=ev.target.value;renderPeople();
    }
  });
  if(admin()){
    const hint=document.createElement('p');hint.className='external-notes-v107';
    hint.textContent='Transferência Paxtu100: após publicar, copie a atividade e use o favorito na tela Nova Atividade Especial. O salvamento final é manual. ';
    const fav=document.createElement('a');
    fav.textContent='GEArPC → Externa Paxtu100';
    fav.className='attendance-paxtu-bookmark';
    fav.href='javascript:('+paxtuExternalRunner.toString()+')()';
    hint.appendChild(fav);box.appendChild(hint);
  }
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
      .select('id,roteiro_arquivo_path,roteiro_arquivo_nome,roteiro_arquivo_mime,roteiro_arquivo_tamanho,roteiro_arquivo_atualizado_em,secao_id,atividade_geral,plano_seguranca_visit_id,tipo,tipo_paxtu,responsavel_chefe_id,titulo,local,ponto_encontro,local_saida,local_chegada,descricao_breve,transporte,transporte_detalhes,alimentacao,materiais,responsavel_nome,link_mapa,custo_estimado,online,noites_acampadas,indaba,incluir_diretoria,exige_autorizacao,texto_autorizacao,observacoes,status,parecer_dme,atividade_id,atualizado_em')
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
     '<small>'+esc(TYPES[row.tipo]||row.tipo)+' • '+(row.atividade_geral?'Todo o grupo':esc(byId.get(Number(row.secao_id))||'Seção'))+
     ' • '+esc(dateFormat(row.data_inicio))+' até '+esc(dateFormat(row.data_fim))+
     '</small><small>'+esc(row.local)+' • '+esc(STATUS[row.status]||row.status)+
       (row.roteiro_arquivo_path?' • PDF/Word anexado':'')+'</small></div>'+
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
   '</div></article>').join(''):'<p>Nenhuma etapa adicionada. Monte o roteiro com os períodos da atividade.</p>';
  if(!edit)host.querySelectorAll('input,textarea').forEach(el=>el.disabled=true);
 }
 function canEdit(){return (!editing||['rascunho','ajustes'].includes(editing.status))
   &&manager(Number($('externalSectionV107')?.value||editing?.secao_id));}


 const normPerson=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().trim();
 async function ensureCandidates(){
   if(people.chefes.length||people.jovens.length)return;
   const {data:c,error}=await client.rpc('candidatos_programacao_externa_v111');
   if(error)throw error;
   people={jovens:c?.jovens||[],chefes:c?.chefes||[],
     chefes_secoes:c?.chefes_secoes||[]};
 }
 function sectionNames(){return [...chosenSections].map(id=>{
   const sec=sections.find(s=>Number(s.id)===id);
   if(!sec)return 'Seção não identificada';
   const prefix={2:'ALCATEIA',3:'TROPA ESCOTEIRA',4:'TROPA SÊNIOR',5:'CLÃ'}[Number(sec.ramo_id)]||'';
   return (prefix?prefix+' ':'')+sec.nome.toLocaleUpperCase('pt-BR');
 });}
 function renderPeople(){
   const sectionsHost=$('externalChosenSectionsV111'),you=$('externalYouthV111'),
     adults=$('externalAdultsV111');
   if(!sectionsHost||!you||!adults)return;
   const editable=canEdit();
   const previousYouthScroll=you.scrollTop,previousChiefScroll=adults.scrollTop;
   const sid=Number($('externalSectionV107')?.value||0);
   sectionsHost.innerHTML=sections.map(s=>
     '<label class="ext-member-option-v111"><input type="checkbox" data-ext-section="'+s.id+'" '+
       (chosenSections.has(Number(s.id))?'checked ':'')+
       (!editable||Number(s.id)===sid?'disabled ':'')+' />'+esc(s.nome)+'</label>').join('')+
     (admin()?'<label class="ext-member-option-v111"><input id="externalDirV111" type="checkbox" '+
       (selectedDirector?'checked ':'')+(editable?'':'disabled ')+
       '/> Diretoria (sem membros automáticos)</label>':'');
   // Only people from selected sections can be chosen as juvenile participants.
   const youth=people.jovens.filter(j=>chosenSections.has(Number(j.secao_id))&&
      normPerson(j.nome).includes(normPerson(sectionFilter)));
   you.innerHTML='<p>'+chosenYouth.size+' jovem(ns) selecionado(s).</p>'+
     (youth.length?youth.map(j=>
       '<label class="ext-member-option-v111"><input type="checkbox" data-ext-youth="'+j.id+'" '+
       (chosenYouth.has(Number(j.id))?'checked ':'')+(editable?'':'disabled ')+
       '/>'+esc(j.nome)+(j.eh_teste?' <small>(teste)</small>':'')+'</label>').join('')
       :'<p>Nenhum jovem corresponde à pesquisa nas seções selecionadas.</p>');
   const available=people.chefes.filter(c=>normPerson(c.nome).includes(normPerson(chiefFilter)));
   adults.innerHTML='<p>'+chosenChiefs.size+' escotista(s) selecionado(s). '+
     'Você pode acrescentar chefes de outras seções.</p>'+
     available.map(c=>
       '<label class="ext-member-option-v111"><input type="checkbox" data-ext-chief="'+c.id+'" '+
       (chosenChiefs.has(Number(c.id))?'checked ':'')+(editable?'':'disabled ')+
       '/>'+esc(c.nome)+(c.eh_teste?' <small>(teste)</small>':'')+'</label>').join('');
   you.scrollTop=previousYouthScroll;adults.scrollTop=previousChiefScroll;
 }
 function selectedIds(){return {
   secoes:[...chosenSections].sort((a,b)=>a-b),
   jovens:[...chosenYouth].sort((a,b)=>a-b),
   chefes:[...chosenChiefs].sort((a,b)=>a-b)
 };}
 async function openEditor(id){
  if(!state.profile || state.profile.tipo==='responsavel')return;
  formStatus('');
  try{
   const row=id?data.find(r=>Number(r.id)===Number(id)):null;
   if(id&&!row){status('Programação não encontrada. Atualize a lista.');return;}
   editing=row?{...row}:null;
   steps=[];sectionFilter='';chiefFilter='';selectedDirector=Boolean(row?.incluir_diretoria);
   await ensureCandidates();
   const permitted=admin()?sections:sections.filter(s=>own.includes(Number(s.id)));
   if(!row&&!permitted.length){
     status('Você não tem seção vinculada para criar esta programação.');return;
   }
   if(id){
    const {data:items,error}=await client.from('programacoes_externas_etapas')
      .select('ordem,inicio,fim,titulo,descricao,condutor,materiais,cuidados')
      .eq('programacao_id',Number(id)).order('ordem');
    if(error)throw error;
    steps=(items||[]).map(item=>({...item,inicio:dateLocal(item.inicio),fim:dateLocal(item.fim)}));
   }
   chosenSections=new Set(row?[Number(row.secao_id)]:[Number(permitted[0].id)]);
   chosenYouth=new Set();chosenChiefs=new Set();
   if(id){
     const [sx,jx,cx]=await Promise.all([
       client.from('programacao_externa_secoes_v111').select('secao_id').eq('programacao_id',id),
       client.from('programacao_externa_jovens_v111').select('jovem_id').eq('programacao_id',id),
       client.from('programacao_externa_chefes_v111').select('chefe_id').eq('programacao_id',id)
     ]);
     if(sx.error||jx.error||cx.error)throw sx.error||jx.error||cx.error;
     if(sx.data?.length){
       chosenSections=new Set(sx.data.map(x=>Number(x.secao_id)));
       chosenYouth=new Set((jx.data||[]).map(x=>Number(x.jovem_id)));
       chosenChiefs=new Set((cx.data||[]).map(x=>Number(x.chefe_id)));
     }else{
       for(const j of people.jovens)
         if(chosenSections.has(Number(j.secao_id))&&!j.eh_teste)chosenYouth.add(Number(j.id));
       for(const x of people.chefes_secoes)
         if(chosenSections.has(Number(x.secao_id))&&!people.chefes.find(c=>Number(c.id)===Number(x.chefe_id))?.eh_teste)
           chosenChiefs.add(Number(x.chefe_id));
     }
   }else{
     for(const j of people.jovens)
       if(chosenSections.has(Number(j.secao_id))&&!j.eh_teste)chosenYouth.add(Number(j.id));
     for(const x of people.chefes_secoes)
       if(chosenSections.has(Number(x.secao_id))&&!people.chefes.find(c=>Number(c.id)===Number(x.chefe_id))?.eh_teste)
         chosenChiefs.add(Number(x.chefe_id));
   }
   const select=sections.filter(s=>row?Number(s.id)===Number(row.secao_id):
      permitted.some(p=>Number(p.id)===Number(s.id)));
   const title=row?.titulo||'';
   const existing=row?.status||'rascunho';
   const editable=(!row||['rascunho','ajustes'].includes(existing)) &&
      (!row||manager(Number(row.secao_id)));
   const disabledControls=!editable;
   // A chefia convidada por outra seção consulta o roteiro, mas não o edita.
   const canChange=editable;
   const types=Object.entries(TYPES).map(([key,value])=>
     '<option value="'+key+'" '+(key===(row?.tipo||'externa')?'selected':'')+'>'+esc(value)+'</option>').join('');
   const options=select.map(section=>'<option value="'+section.id+'">'+esc(section.nome)+'</option>').join('');
   const selectedPaxtuType=row?.tipo_paxtu||({
     externa:'Atividade de Grupo',acampamento:'Acampamento',
     acantonamento:'Acantonamento',jornada:'Jornada',visita:'Excursão',
     evento:'Atividade de Grupo',especial:'Atividade de Grupo'
   }[row?.tipo||'externa']||'Atividade de Grupo');
   const chiefOptions=people.chefes.map(c=>
     '<option value="'+c.id+'" '+(Number(row?.responsavel_chefe_id)===Number(c.id)?'selected':'')+'>'+
     esc(c.nome)+'</option>').join('');
   const transportVal=row?.transporte||'';
   const transportOptions=TRANSPORT_OPTIONS.map(t=>
     '<option value="'+esc(t)+'" '+(t===transportVal?'selected':'')+'>'+esc(t)+'</option>').join('');
   const note=row?.parecer_dme?
      '<aside class="external-notes-v107"><strong>Orientações do DME</strong>'+esc(row.parecer_dme)+'</aside>':'';
   let safetyOptions='';
   if(admin() && row?.status==='aprovada') {
     const {data:approved,error:plansError}=await client.rpc('listar_planos_seguranca_externa_v108');
     if(plansError)throw plansError;
     const targetDate=dateLocal(row.data_inicio).slice(0,10);
     const requiredNames=[...chosenSections].map(id=>sections.find(s=>Number(s.id)===id)?.nome).filter(Boolean);
     const eligible=(approved||[]).filter(plan=>{
       const scopes=Array.isArray(plan.secoes)?plan.secoes:[];
       return plan.data_plano===targetDate &&
         requiredNames.every(name=>scopes.includes(name));
     });
     safetyOptions='<div class="external-notes-v107"><strong>Plano de segurança formal</strong>'+
       (row.plano_seguranca_visit_id
        ? 'Plano aprovado vinculado: '+esc(row.plano_seguranca_visit_id)+'.'
        : 'Ainda não há plano de segurança vinculado. Não é possível publicar.')+
       '<p>O documento deve estar aprovado no módulo Segurança em Atividades e corresponder à data e à(s) seção(ões) da atividade.</p>'+
       '<label>Escolha o plano aprovado<select id="externalSafetyPlanV108">'+
       '<option value="">Selecione o plano correspondente</option>'+
       eligible.map(plan=>'<option value="'+esc(plan.visit_id)+'" '+
         (row.plano_seguranca_visit_id===plan.visit_id?'selected':'')+'>'+
         esc(plan.atividade)+' • '+esc(plan.data_plano)+'</option>').join('')+
       '</select></label>'+
       (eligible.length===0?'<p>Nenhum plano aprovado compatível foi encontrado. Preencha e envie o plano no módulo Segurança em Atividades, aguarde aprovação e reabra esta programação.</p>':'')+
       '<div class="external-form-actions-v107">'+
       '<button type="button" id="externalBindSafetyV108" '+
       (!eligible.length?'disabled':'')+'>Vincular plano de segurança</button></div></div>';
   } else if(row?.plano_seguranca_visit_id) {
     safetyOptions='<aside class="external-notes-v107"><strong>Plano de segurança vinculado</strong>'+
       esc(row.plano_seguranca_visit_id)+'</aside>';
   }
   $('externalEditorV107').innerHTML=
    '<h3>'+(row?'Programação externa: '+esc(row.titulo):'Nova programação externa')+'</h3>'+
    '<p>Tipo: '+esc(STATUS[existing]||existing)+
      '. Os responsáveis somente verão os dados da atividade depois da publicação.</p>'+note+safetyOptions+
    '<form id="externalFormV107"><div class="external-grid-v107">'+
    '<label>Seção de referência (chefia organizadora)<select id="externalSectionV107" required>'+options+'</select></label>'+
    '<label>Tipo interno da atividade<select id="externalTypeV107">'+types+'</select></label>'+
    '<label class="full">Tipo no Paxtu100<input id="externalPaxtuTypeV111" list="externalPaxtuTypeOptionsV111" value="'+
      esc(selectedPaxtuType)+'" required />'+
      '<datalist id="externalPaxtuTypeOptionsV111">'+PAxtuTypes.map(t=>
        '<option value="'+esc(t)+'"></option>').join('')+'</datalist></label>'+
    (admin()?'<label class="full">Abrangência<select id="externalGeneralV107">'+
      '<option value="false"'+(row?.atividade_geral!==true?' selected':'')+'>Somente a seção indicada</option>'+
      '<option value="true"'+(row?.atividade_geral===true?' selected':'')+'>Todo o grupo (atividade geral)</option></select></label>':'')+
    textField('Nome / título','title',title,false,true,true)+
    textField('Objetivo educativo','objective',row?.objetivo,true,true)+
    dateField('Início (data e hora)','from',dateLocal(row?.data_inicio),true)+
    dateField('Término (data e hora)','to',dateLocal(row?.data_fim),true)+
    textField('Local da atividade','place',row?.local,false,true,true)+
    textField('Link do mapa (Paxtu100)','map',row?.link_mapa,false,true)+
    textField('Local de saída','departure',row?.local_saida||row?.ponto_encontro,false,true)+
    textField('Local de chegada','arrival',row?.local_chegada||row?.ponto_encontro,false,true)+
    '<label class="full">Chefe responsável pela atividade<select id="externalLeaderV111" required>'+
      '<option value="">Selecione um escotista do grupo</option>'+chiefOptions+'</select></label>'+
    '<label>Meio de transporte<select id="externalTransportV111" required>'+
      '<option value="">Selecione</option>'+transportOptions+'</select></label>'+
    textField('Detalhes do transporte','transportDetails',row?.transporte_detalhes||(
       !TRANSPORT_OPTIONS.includes(transportVal)?transportVal:''),true,true)+
    textField('Descreva brevemente a atividade (Paxtu100)','brief',row?.descricao_breve||'',true,true)+
    '<label class="full">Marcação especial no Paxtu100'+
      '<span class="ext-flagline-v111">'+
        '<label><input type="checkbox" id="externalOnlineV111" '+
          (row?.online?'checked':'')+'/> Atividade on-line</label>'+
        '<label><input type="checkbox" id="externalNightsV111" '+
          ((row?.noites_acampadas||['acampamento','acantonamento'].includes(row?.tipo))?'checked':'')+
          '/> Atividade com noites acampadas</label>'+
        '<label><input type="checkbox" id="externalIndabaV111" '+
          (row?.indaba?'checked':'')+'/> Atividade Indaba</label>'+
      '</span></label>'+
    textField('Alimentação e água','food',row?.alimentacao,true,true)+
    textField('Materiais gerais e equipamentos','materials',row?.materiais,true,true)+
    '<label>Custo estimado por participante (R$)<input id="externalCostV107" type="number" min="0" step="0.01" value="'+
     esc(row?.custo_estimado??'')+'" /></label>'+
    '<p class="full external-notes-v107">Autorização específica obrigatória para atividades externas.</p>'+
    '<p class="full external-notes-v107"><strong>Seções no Paxtu100</strong>'+
    'Marque todas as seções participantes. A opção Ninhada não apareceu na lista do Paxtu100; confira esse caso manualmente.</p>'+
    '<p class="full external-notes-v107"><strong>Segurança de Atividades</strong>'+
    'Riscos, medidas preventivas, cuidados e plano alternativo são registrados apenas no Plano de Segurança. A atividade só poderá ser publicada após a aprovação do plano pelo DME.</p>'+
    '<p class="full external-notes-v107"><strong>Autorização padronizada</strong>O Conecta gera a autorização segundo o modelo institucional. Nenhum texto precisa ser digitado pela chefia.</p>'+
    textField('Orientações e observações','notes',row?.observacoes,true,true)+
    '</div><h3>Seções e participantes</h3>'+
    '<p>Ao marcar uma seção, todos os seus jovens e escotistas ativos são selecionados automaticamente.'+
    ' Desmarque quem não irá participar ou acrescente um escotista de outra seção.</p>'+
    '<div id="externalChosenSectionsV111" class="ext-member-list-v111"></div>'+
    '<div class="external-grid-v107">'+
      '<label>Buscar jovem por nome<input id="externalPeopleSearchV111" type="search" placeholder="Filtrar jovens"></label>'+
      '<label>Buscar escotista por nome<input id="externalChiefSearchV111" type="search" placeholder="Filtrar escotistas"></label>'+
    '</div><div class="external-grid-v107 ext-rosters-v111">'+
      '<section><h4>Jovens</h4><div id="externalYouthV111" class="ext-member-list-v111"></div></section>'+
      '<section><h4>Escotistas</h4><div id="externalAdultsV111" class="ext-member-list-v111"></div></section>'+
    '</div><h3>Roteiro da atividade</h3>'+
    '<p>Se o roteiro já estiver pronto em PDF ou Word, anexe esse documento. Não é necessário redigitar as etapas. Os dados gerais, as seções e os participantes continuam obrigatórios.</p>'+
    '<div class="ext-doc-v112"><strong>Documento do roteiro (PDF, DOC ou DOCX)</strong>'+
    (row?.roteiro_arquivo_path?
       '<div class="ext-doc-existing-v112"><span>Arquivo salvo: <strong>'+esc(row.roteiro_arquivo_nome)+
       '</strong> ('+Math.round((Number(row.roteiro_arquivo_tamanho)||0)/1024)+' KB)</span>'+
       '<button type="button" id="externalDownloadDocumentV112">Baixar roteiro</button>'+
       (editable?'<button type="button" id="externalUnlinkDocumentV112">Remover anexo</button>':'')+
       '</div>':'<p>Ainda não há documento anexado.</p>')+
    (editable?'<label>Enviar arquivo existente ou substituir o anterior'+
      '<input type="file" id="externalDocumentFileV112" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />'+
      '<small>Até 15 MB. O documento será enviado ao salvar. Como alternativa, digite as etapas abaixo.</small>'+
      '</label>':'')+
    '</div><h3>Etapas do roteiro (opcionais quando houver documento)</h3>'+
    '<p>Inclua as etapas com horários reais; o roteiro pode atravessar vários dias.</p>'+
    '<div id="externalStagesV107"></div>'+
    '<div class="external-actions-v107"><button type="button" id="externalAddStageV107">＋ Adicionar etapa</button></div>'+
    '<div class="external-form-actions-v107">'+
    (editable?'<button class="external-primary-v107" type="submit" id="externalSaveV107">Salvar rascunho / alterações</button>':'')+
    (editable?'<button type="button" id="externalSendV107">Salvar e enviar ao DME</button>':'')+
    (admin()&&existing==='em_analise'?'<button type="button" id="externalApproveV107">Aprovar</button>'+
      '<button type="button" id="externalAdjustV107">Solicitar ajustes</button>':'')+
    (admin()&&existing==='aprovada'?'<button type="button" id="externalPublishV107" '+
     (!row?.plano_seguranca_visit_id?'disabled title="Vincule um plano de segurança aprovado"':'')+
     '>Publicar para responsáveis</button>':'')+
    (admin()&&row&&existing==='publicada'?'<button type="button" id="externalCopyPaxtuV110">Copiar para Paxtu100</button>':'')+
    '<button type="button" id="externalCancelV107">Fechar</button>'+
    '</div><p id="externalFormStatusV107" role="status" class="external-status-v107"></p>'+
    (existing==='publicada'?'<p>Esta programação foi publicada no cadastro de atividades para os responsáveis. Para preservar autorizações e registros, ela não pode mais ser editada neste módulo.</p>':'')+
    '</form>';
   if(row)$('externalSectionV107').value=String(row.secao_id);
   $('externalEditorV107').classList.remove('external-hidden-v107');
   renderSteps();renderPeople();
   if(disabledControls){
     $('externalFormV107').querySelectorAll('input,textarea,select')
       .forEach(el=>el.disabled=true);
     $('externalAddStageV107')?.setAttribute('disabled','');
   }
   $('externalEditorV107').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(error){status('Não foi possível abrir o roteiro: '+error.message);}
 }
 function closeEditor(){
   editing=null;steps=[];chosenSections.clear();chosenYouth.clear();chosenChiefs.clear();
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
  if(!chosenSections.has(section) || !chosenSections.size){
    formStatus('Inclua a seção organizadora entre as participantes.');return null;
  }
  if(!chosenYouth.size&&!chosenChiefs.size){
    formStatus('Selecione pelo menos um jovem ou escotista participante.');return null;
  }
  if(!$('externalLeaderV111')?.value){
    formStatus('Escolha um chefe responsável.');return null;
  }
  if(!($('externalTransportV111')?.value)){
    formStatus('Selecione o meio de transporte conforme o Paxtu100.');return null;
  }
  if(!($('externalPaxtuTypeV111')?.value.trim())){
    formStatus('Informe o tipo de atividade utilizado no Paxtu100.');return null;
  }
  const attachedFile=$('externalDocumentFileV112')?.files?.[0]||null;
  if(attachedFile){
    const ext=attachedFile.name.split('.').pop()?.toLowerCase();
    if(!['pdf','doc','docx'].includes(ext)||!attachedFile.size||attachedFile.size>15728640){
      formStatus('O documento precisa ser PDF, DOC ou DOCX e ter até 15 MB.');return null;
    }
  }
  if(steps.some(s=>!s.inicio||!s.fim||s.inicio>=s.fim||
    s.inicio<start||s.fim>end||!String(s.titulo||'').trim())){
      formStatus('Confira as datas, a ordem e o título de cada etapa.');return null;
  }
  const dados={
   id:editing?.id||null,
   atualizado_em:editing?.atualizado_em||null,
   secao_id:section,atividade_geral:admin()&&$('externalGeneralV107')?.value==='true',
   tipo:$('externalTypeV107').value,tipo_paxtu:$('externalPaxtuTypeV111').value.trim(),
   titulo:value('title'),objetivo:value('objective'),
   secoes_participantes:[...chosenSections],
   jovens_participantes:[...chosenYouth],
   chefes_participantes:[...chosenChiefs],
   incluir_diretoria:admin()&&selectedDirector,
   responsavel_chefe_id:Number($('externalLeaderV111').value),
   descricao_breve:value('brief'),local_saida:value('departure'),
   local_chegada:value('arrival'),transporte_detalhes:value('transportDetails'),
   online:$('externalOnlineV111').checked,
   noites_acampadas:$('externalNightsV111').checked,
   indaba:$('externalIndabaV111').checked,
   local:value('place'),ponto_encontro:value('departure'),link_mapa:value('map'),
   data_inicio:timestamp(start),data_fim:timestamp(end),
   transporte:$('externalTransportV111').value,alimentacao:value('food'),
   materiais:value('materials'),
   custo_estimado:$('externalCostV107').value||null,
   exige_autorizacao:true,
   observacoes:value('notes'),
   etapas:steps.map((etapa)=>({
      inicio:timestamp(etapa.inicio),fim:timestamp(etapa.fim),
      titulo:etapa.titulo,descricao:etapa.descricao,
      condutor:etapa.condutor,materiais:etapa.materiais
   }))
  };
  busy=true;formStatus('Salvando roteiro...');
  try{
   const {data:result,error}=await client.rpc('salvar_programacao_externa_v111',{p_dados:dados});
   if(error)throw error;
   if(!result?.id)throw new Error('O servidor não confirmou o registro.');
   if(attachedFile){
     formStatus('Dados salvos. Enviando documento PDF/Word...');
     const extension=attachedFile.name.split('.').pop().toLowerCase();
     const mimeTypes={
       pdf:'application/pdf',doc:'application/msword',
       docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
     };
     const path=String(result.id)+'/'+crypto.randomUUID()+'.'+extension;
     const {error:uploadError}=await client.storage.from('gearpc-roteiros-externos')
       .upload(path,attachedFile,{contentType:mimeTypes[extension],upsert:false});
     if(uploadError)throw new Error('O rascunho foi salvo, mas o envio do documento falhou: '+uploadError.message);
     const {error:linkError}=await client.rpc('vincular_roteiro_documento_externo_v112',{
       p_id:Number(result.id),p_path:path,p_nome:attachedFile.name,
       p_atualizado_em:result.atualizado_em
     });
     if(linkError){
       await client.storage.from('gearpc-roteiros-externos').remove([path]);
       throw new Error('O rascunho foi salvo, mas o documento não foi vinculado: '+linkError.message);
     }
   }
   await load();
   editing=data.find(r=>Number(r.id)===Number(result.id))||{
     ...dados,id:result.id,atualizado_em:result.atualizado_em,status:result.status};
   formStatus(attachedFile?'Rascunho e documento salvos.':'Roteiro salvo.');
   return Number(result.id);
  }catch(error){
   formStatus('Não foi possível salvar: '+error.message);
   return null;
  }finally{busy=false;}
 }
 async function downloadScheduleDocument(){
   const row=editing;
   if(!row?.roteiro_arquivo_path){formStatus('Esta atividade ainda não tem documento.');return;}
   formStatus('Baixando roteiro...');
   try{
     const {data:blob,error}=await client.storage.from('gearpc-roteiros-externos')
       .download(row.roteiro_arquivo_path);
     if(error)throw error;
     const url=URL.createObjectURL(blob);
     const link=document.createElement('a');
     link.href=url;link.download=row.roteiro_arquivo_nome||'roteiro-externo.pdf';
     document.body.appendChild(link);link.click();link.remove();
     setTimeout(()=>URL.revokeObjectURL(url),60000);
     formStatus('Documento pronto para ser aberto ou enviado ao Paxtu100.');
   }catch(err){formStatus('Não foi possível baixar o documento: '+err.message);}
 }
 async function unlinkScheduleDocument(){
   if(busy||!editing?.id||!editing?.roteiro_arquivo_path||!canEdit())return;
   if(!window.confirm('Retirar o documento desta programação? Enquanto for rascunho, você poderá enviar outro.'))return;
   busy=true;formStatus('Retirando documento...');
   try{
     const id=editing.id,old=editing.roteiro_arquivo_path;
     const {error}=await client.rpc('desvincular_roteiro_documento_externo_v112',{p_id:id});
     if(error)throw error;
     await client.storage.from('gearpc-roteiros-externos').remove([old]);
     await load();await openEditor(id);
     formStatus('Documento retirado. Envie outro ou preencha o roteiro no aplicativo.');
   }catch(err){formStatus('Não foi possível retirar o documento: '+err.message);}
   finally{busy=false;}
 }
 async function save(event){
  event.preventDefault();
  const id=await persist();if(id)await openEditor(id);
 }
 async function attachSafety(){
   if(!admin() || editing?.status!=='aprovada')return;
   const id=editing?.id;
   const visitId=$('externalSafetyPlanV108')?.value;
   if(!id || !visitId){formStatus('Selecione um plano de segurança aprovado.');return;}
   busy=true;formStatus('Vinculando o plano de segurança...');
   try{
     const {data:response,error}=await client.rpc('vincular_plano_seguranca_externa_v108',{
       p_programacao_id:id,p_visit_id:visitId
     });
     if(error)throw error;
     if(!response?.ok)throw new Error('O servidor não confirmou o vínculo.');
     await load();await openEditor(id);
     formStatus('Plano de segurança aprovado vinculado. A programação já pode ser publicada.');
   }catch(error){formStatus('Não foi possível vincular o plano: '+error.message);}
   finally{busy=false;}
 }

 // Transfere campos preenchidos, sem salvar automaticamente no Paxtu100.
 function paxtuExternalRunner(){
   const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
   const visible=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.disabled;};
   function label(e){return norm((e.labels?.[0]?.textContent||'')+' '+
       (e.getAttribute('aria-label')||e.getAttribute('placeholder')||e.name||e.id||''));}
   function set(e,v){
     if(!e||v===null||v===undefined||v==='')return false;
     if(e.tagName==='SELECT'){
       const o=[...e.options].find(x=>norm(x.textContent)===norm(v))||
           [...e.options].find(x=>norm(x.textContent).includes(norm(v)));
       if(!o)return false;v=o.value;
     }
     const p=e.tagName==='SELECT'?HTMLSelectElement.prototype:
       e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
     Object.getOwnPropertyDescriptor(p,'value').set.call(e,String(v));
     e.dispatchEvent(new Event('input',{bubbles:true}));
     e.dispatchEvent(new Event('change',{bubbles:true}));return true;
   }
   async function run(){
     if(!/paxtu(?:100)?\.escoteiros\.org\.br$/i.test(location.hostname)){
       alert('Abra a página de Nova Atividade Especial no Paxtu100.');return;
     }
     let raw;try{raw=await navigator.clipboard.readText();}
     catch(_){raw=prompt('Cole os dados copiados do GEArPC Conecta:')||'';}
     let data;try{data=JSON.parse(raw);}catch(_){alert('Os dados copiados não são JSON válido.');return;}
     if(data?.origem!=='gearpc-conecta-externa-v110')return alert('Copie primeiro uma atividade externa do GEArPC Conecta.');
     if(!confirm('Preencher os campos disponíveis no Paxtu100? O salvamento final será manual.'))return;
     const fields=[...document.querySelectorAll('input,textarea,select')].filter(e=>visible(e)&&!['hidden','checkbox','radio','file'].includes(e.type));
     let count=0;const missing=[];
     const mapping=[
       [['nome da atividade','nome'],data.nome],
       [['local da atividade','local'],data.local],
       [['link do mapa','link da localizacao'],data.link_mapa],
       [['coordenador','chefe responsavel'],data.coordenador],
       [['tipo de atividade','tipo'],data.tipo],
       [['local de saída','local da saida'],data.local_saida],
       [['local de chegada'],data.local_chegada],
       [['descreva brevemente a atividade','descrição breve'],data.descricao_breve],
       [['transporte','meio de transporte'],data.transporte],
       [['custo individual','valor','custo'],data.custo]
     ];
     for(const [names,value]of mapping){
       if(!value)continue;
       const field=fields.find(f=>names.some(n=>label(f)===norm(n)||label(f).startsWith(norm(n)+' ')));
       if(field&&set(field,value))count++;else missing.push(names[0]);
     }
     const dates=fields.filter(x=>x.type==='date'),times=fields.filter(x=>x.type==='time');
     for(const [e,v] of [[dates[0],data.data_inicio],[dates[1],data.data_fim],
       [times[0],data.hora_inicio],[times[1],data.hora_fim]])if(set(e,v))count++;
     const youth=(data.jovens||[]).map(p=>p.nome);
     const chiefs=(data.escotistas||[]).map(p=>p.nome);
     alert(count+' campo(s) preenchido(s). Seções a selecionar: '+
       (data.secoes||[]).join(', ')+'. '+
       'O Paxtu insere todos os integrantes ao selecionar as seções: confira a lista final, retirando os não participantes. '+
       'Jovens selecionados no Conecta ('+youth.length+'): '+youth.join('; ')+'. '+
       'Escotistas selecionados ('+chiefs.length+'): '+chiefs.join('; ')+'. '+
       (missing.length?'Campos para completar manualmente: '+missing.join(', ')+'. ':'')+
       'Nenhum registro foi salvo automaticamente.');
   }void run();
 }
 async function copyPaxtu(){
   if(!admin()||editing?.status!=='publicada')return;
   const r=editing,dt=x=>dateLocal(x);
   const d1=dt(r.data_inicio),d2=dt(r.data_fim);
   const payload={
     origem:'gearpc-conecta-externa-v110',versao:1,
     id_conecta:r.id,nome:r.titulo,tipo:r.tipo_paxtu||TYPES[r.tipo]||r.tipo,
     secoes:[...sectionNames(),...(r.incluir_diretoria?['DIRETORIA']:[])],incluir_diretoria:!!r.incluir_diretoria,
     secao:r.atividade_geral?'Todo o grupo':sectionNames().join('; '),
     jovens:[...chosenYouth].map(id=>{
       const j=people.jovens.find(j=>Number(j.id)===id);
       return {nome:j?.nome||String(id),registro_paxtu:j?.registro_paxtu||'',id_conecta:id};
     }),
     escotistas:[...chosenChiefs].map(id=>{
       const c=people.chefes.find(c=>Number(c.id)===id);
       return {nome:c?.nome||String(id),registro_paxtu:c?.registro_paxtu||'',id_conecta:id};
     }),
     local:r.local,link_mapa:r.link_mapa||'',coordenador:r.responsavel_nome,
     transporte:r.transporte||'',custo:r.custo_estimado??'',
     local_saida:r.local_saida||r.ponto_encontro||'',
     local_chegada:r.local_chegada||r.ponto_encontro||'',
     descricao_breve:r.descricao_breve||'',online:!!r.online,
     noites_acampadas:!!r.noites_acampadas,indaba:!!r.indaba,
     data_inicio:d1.slice(0,10),hora_inicio:d1.slice(11,16),
     data_fim:d2.slice(0,10),hora_fim:d2.slice(11,16),
     encontro:r.ponto_encontro,objetivo:r.objetivo,
     alimentacao:r.alimentacao,materiais:r.materiais,observacoes:r.observacoes,
     etapas:steps.map(e=>({...e}))
   };
   try{
     await navigator.clipboard.writeText(JSON.stringify(payload));
     formStatus('Atividade, seções e lista final de participantes copiadas. No Paxtu100 abra Nova Atividade Especial e use o favorito GEArPC → Externa. Confira todas as seleções antes de salvar.');
   }catch(e){
     window.prompt('Copie os dados para usar no Paxtu100:',JSON.stringify(payload));
     formStatus('Copie o conteúdo acima para usar no Paxtu100.');
   }
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
