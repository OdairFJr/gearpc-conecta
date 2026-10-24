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
