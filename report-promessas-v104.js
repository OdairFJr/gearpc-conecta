/* GEArPC Conecta v104 | Consulta de promessas na Central de Relatórios. */
(() => {
  if (window.__GEARPC_PROMISE_REPORT_V104__) return;
  window.__GEARPC_PROMISE_REPORT_V104__ = true;
  const rt=window.GEARPC_RUNTIME;
  if(!rt?.client || !rt?.state) return;
  const {client,state}=rt;
  const $=id=>document.getElementById(id);
  const PDF_JS='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  const PDF_TABLE='https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js';
  const NAMES={'2':'Lobinho','3':'Escoteiro','4':'Sênior','5':'Pioneiro',
    adulto:'Promessa adulta',pendente:'Ramo a conferir'};
  function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLocaleLowerCase('pt-BR').trim();}
  function fmt(v){if(!v)return 'Não registrada';const [y,m,d]=String(v).slice(0,10).split('-');
    return y&&m&&d ? d+'/'+m+'/'+y : String(v);}
  function opts(){return {branch:$('promiseBranchV104')?.value||'todos',
    name:norm($('promiseNameV104')?.value),missing:Boolean($('promiseMissingV104')?.checked),
    inactive:Boolean($('promiseInactiveV104')?.checked),
    period:Boolean($('promisePeriodV104')?.checked),
    start:$('reportStart')?.value||'',end:$('reportEnd')?.value||''};}
  async function all(table,columns){
    const results=[];for(let page=0;page<200;page++){
      const {data,error}=await client.from(table).select(columns).range(page*1000,page*1000+999);
      if(error)throw new Error(table+': '+error.message);
      results.push(...(data||[]));if(!data||data.length<1000)return results;
    }
    throw new Error('Limite de registros atingido; contate a administração.');
  }
  async function sources(){
    const [youth,history,adults,sections]=await Promise.all([
      all('jovens','id,nome_completo,ramo_id,secao_id,ativo,data_promessa_lobinho,data_promessa_escoteira,data_promessa_adulta'),
      all('jovem_historico_ramos','jovem_id,ramo_id,data_promessa,origem'),
      all('chefes','id,nome_completo,ativo,data_promessa_lobinho,data_promessa_escoteira,data_promessa_adulta'),
      all('secoes','id,nome')]);
    return {youth,history,adults,sections};
  }
  function rowsFrom(src,o){
    const sections=new Map((src.sections||[]).map(s=>[Number(s.id),s.nome]));
    const youths=new Map((src.youth||[]).map(j=>[Number(j.id),j]));
    const map=new Map();
    const make=(p,kind,branch,date,origin,review,section)=>({
      key:kind+':'+p.id+':'+branch,name:p.nome_completo||'Nome não informado',
      kind:kind==='jovem'?'Jovem':'Adulto',branch:String(branch),
      label:NAMES[branch]||String(branch),date:date||null,origin,review:Boolean(review),
      section:section||'-',active:p.ativo!==false
    });
    for(const h of src.history||[]){
      const j=youths.get(Number(h.jovem_id));const branch=String(h.ramo_id);
      if(!j||!['2','3','4','5'].includes(branch))continue;
      const legacy=h.origem==='legado_a_conferir';
      const r=make(j,'jovem',branch,h.data_promessa,
        legacy?'Histórico importado: conferir':'Histórico por ramo',legacy,sections.get(Number(j.secao_id)));
      map.set(r.key,r);
    }
    for(const j of src.youth||[]){
      const branch=String(j.ramo_id), section=sections.get(Number(j.secao_id));
      const key=b=>'jovem:'+j.id+':'+b;
      if(j.data_promessa_lobinho&&!map.get(key('2'))?.date)
        map.set(key('2'),make(j,'jovem','2',j.data_promessa_lobinho,
          'Cadastro anterior: conferir',true,section));
      if(j.data_promessa_escoteira){
        const found=[...map.values()].some(r=>r.key.startsWith('jovem:'+j.id+':')
          &&['3','4','5'].includes(r.branch)&&r.date===j.data_promessa_escoteira);
        if(branch==='3'&&!map.get(key('3'))?.date)
          map.set(key('3'),make(j,'jovem','3',j.data_promessa_escoteira,
            'Cadastro anterior: conferir',true,section));
        else if(!found)map.set(key('pendente'),make(j,'jovem','pendente',
          j.data_promessa_escoteira,'Promessa Escoteira antiga: ramo não identificado',true,section));
      }
      if(j.data_promessa_adulta)
        map.set(key('adulto'),make(j,'jovem','adulto',j.data_promessa_adulta,
          'Promessa adulta no cadastro do jovem: conferir',true,section));
      if(['2','3','4','5'].includes(branch)&&!map.has(key(branch)))
        map.set(key(branch),make(j,'jovem',branch,null,'Sem data registrada',false,section));
    }
    for(const p of src.adults||[]){
      for(const [branch,field] of [['2','data_promessa_lobinho'],['3','data_promessa_escoteira'],
        ['adulto','data_promessa_adulta']]){
        if(p[field]){const r=make(p,'adulto',branch,p[field],'Cadastro do adulto',false,'Equipe adulta');
          map.set(r.key,r);}
      }
      if(!p.data_promessa_adulta){const r=make(p,'adulto','adulto',null,'Sem data registrada',
        false,'Equipe adulta');map.set(r.key,r);}
    }
    const sort={'2':0,'3':1,'4':2,'5':3,adulto:4,pendente:5};
    return [...map.values()].filter(r=>o.inactive||r.active)
      .filter(r=>o.branch==='todos'||r.branch===o.branch)
      .filter(r=>!o.name||norm(r.name).includes(o.name))
      .filter(r=>o.missing||Boolean(r.date))
      .filter(r=>!o.period||(Boolean(r.date)&&r.date>=o.start&&r.date<=o.end))
      .sort((a,b)=>(sort[a.branch]-sort[b.branch])||a.name.localeCompare(b.name,'pt-BR'));
  }

  function render(rows){
    const host=$('promiseResultsV104');if(!host)return;
    const missing=rows.filter(r=>!r.date).length,review=rows.filter(r=>r.review).length;
    let html='<p class="promise-summary-v104"><strong>'+rows.length+'</strong> registro(s) • '+
      (rows.length-missing)+' com data'+(missing?' • '+missing+' sem data':'')+
      (review?' • '+review+' a conferir':'')+'</p>';
    if(rows.length>100)html+='<p class="promise-hint-v104">Mostrando os primeiros 100 registros. O PDF e o CSV incluem todos os resultados.</p>';
    if(rows.length){
      html+='<div class="promise-table-scroll-v104"><table class="promise-table-v104"><thead><tr>'+
        '<th>Ramo</th><th>Membro</th><th>Seção atual</th><th>Data</th><th>Origem</th>'+
        '</tr></thead><tbody>';
      html+=rows.slice(0,100).map(r=>'<tr><td>'+esc(r.label)+'</td><td>'+esc(r.name)+
        ' <small>('+esc(r.kind)+')</small></td><td>'+esc(r.section)+'</td><td>'+
        esc(fmt(r.date))+'</td><td>'+esc(r.origin)+'</td></tr>').join('');
      html+='</tbody></table></div>';
    }else html+='<p class="promise-hint-v104">Nenhum registro encontrado com estes filtros.</p>';
    host.innerHTML=html;
  }

  function validatedOptions(){
    const o=opts();if(o.period&&(!o.start||!o.end||o.start>o.end))
      throw new Error('Informe datas válidas na seção "Período do relatório".');
    return o;
  }
  async function lookup(){
    if(state.profile?.tipo!=='administrador')throw new Error('Acesso restrito.');
    const o=validatedOptions();
    const data=await sources();
    return {rows:rowsFrom(data,o),options:o};
  }
  async function search(){
    const button=$('promiseSearchV104'),status=$('promiseStatusV104');
    if(!button||button.disabled)return;
    button.disabled=true;status.textContent='Consultando as datas...';
    try{const found=await lookup();render(found.rows);
      status.textContent='Consulta atualizada.';}
    catch(e){status.textContent='Não foi possível consultar: '+e.message;
      console.error('GEArPC: busca de promessas',e);}
    finally{button.disabled=false;}
  }

  function injectCss(){
    if($('promiseStylesV104'))return;
    const style=document.createElement('style');style.id='promiseStylesV104';
    style.textContent=[
      '.promise-filters-v104{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:13px}',
      '.promise-filters-v104 label{display:grid;gap:5px;font-size:.78rem;font-weight:800;color:#456075}',
      '.promise-filters-v104 input,.promise-filters-v104 select{width:100%;box-sizing:border-box;padding:10px;border:1px solid #bdcfdd;border-radius:9px;background:white;color:#203c54}',
      '.promise-options-v104{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}',
      '.promise-options-v104 label{display:flex;align-items:center;gap:5px;color:#4b647b;font-size:.77rem;font-weight:700}',
      '.promise-options-v104 input{flex-shrink:0}',
      '.promise-actions-v104{display:flex;flex-wrap:wrap;gap:9px;margin-top:12px}',
      '.promise-actions-v104 button{border:1px solid #b9cadb;border-radius:9px;background:#f6f9fc;color:#0a376c;padding:10px 12px;font-weight:800;cursor:pointer}',
      '.promise-actions-v104 button:first-child{background:#0a376c;color:white}',
      '.promise-actions-v104 button:disabled{opacity:.55;cursor:wait}',
      '.promise-summary-v104{margin:12px 0 8px!important;color:#39536d;font-size:.8rem}',
      '.promise-hint-v104{margin:10px 0!important;font-size:.76rem;color:#78602a;line-height:1.5}',
      '.promise-table-scroll-v104{overflow-x:auto;border:1px solid #dbe5ee;border-radius:10px;margin-top:9px}',
      '.promise-table-v104{width:100%;min-width:620px;border-collapse:collapse;font-size:.75rem}',
      '.promise-table-v104 th,.promise-table-v104 td{padding:9px;border-bottom:1px solid #e8edf3;text-align:left;vertical-align:top}',
      '.promise-table-v104 th{background:#edf4fa;color:#0a376c;font-weight:800}',
      '.promise-table-v104 small{color:#60798c}',
      '#promiseStatusV104{font-size:.76rem;color:#536d80;min-height:15px}',
      '@media(max-width:650px){.promise-filters-v104{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(style);
  }

  function makePanel(){
    const view=$('reportsView');
    if(!view||$('promisePanelV104'))return;
    const panel=document.createElement('section');panel.id='promisePanelV104';
    panel.className='reports-card';
    panel.innerHTML=
      '<h3>Consulta de promessas de todos os ramos</h3>'+
      '<p>Consulte a data de promessa de cada jovem em todos os ramos pelos quais passou. Inclui também as promessas dos adultos. Gere um PDF ou CSV separado para controle.</p>'+
      '<div class="promise-filters-v104">'+
      '<label>Ramo / tipo de promessa<select id="promiseBranchV104">'+
      '<option value="todos">Todos os ramos e adultos</option>'+
      '<option value="2">Lobinho</option><option value="3">Escoteiro</option>'+
      '<option value="4">Sênior</option><option value="5">Pioneiro</option>'+
      '<option value="adulto">Promessa adulta</option>'+
      '<option value="pendente">Antigas sem ramo identificado</option></select></label>'+
      '<label>Buscar pelo nome do membro<input id="promiseNameV104" type="search" autocomplete="off" placeholder="Nome ou parte do nome"></label>'+
      '</div><div class="promise-options-v104">'+
      '<label><input id="promiseMissingV104" type="checkbox"> Incluir sem data registrada</label>'+
      '<label><input id="promisePeriodV104" type="checkbox"> Filtrar pelo período acima</label>'+
      '<label><input id="promiseInactiveV104" type="checkbox"> Incluir inativos</label></div>'+
      '<p class="promise-hint-v104">Filhotes não possuem promessa. Compromisso Sênior, Investidura e Partida são marcos diferentes. Datas antigas sem ramo conhecido ficam sinalizadas para conferência.</p>'+
      '<div class="promise-actions-v104">'+
      '<button type="button" id="promiseSearchV104">Consultar datas</button>'+
      '<button type="button" id="promisePdfV104">Gerar PDF das promessas</button>'+
      '<button type="button" id="promiseCsvV104">Exportar CSV</button></div>'+
      '<p id="promiseStatusV104" role="status"></p>'+
      '<div id="promiseResultsV104" aria-live="polite"></div>';
    const first=view.querySelector('.reports-card');
    if(first)first.insertAdjacentElement('afterend',panel);
    else view.appendChild(panel);
    $('promiseSearchV104').addEventListener('click',search);
    $('promisePdfV104').addEventListener('click',()=>download('pdf'));
    $('promiseCsvV104').addEventListener('click',()=>download('csv'));
    $('promiseNameV104').addEventListener('keydown',event=>{
      if(event.key==='Enter'){event.preventDefault();search();}
    });
  }
