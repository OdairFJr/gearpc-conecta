/* GEArPC Conecta v123 - PDF real, independente de window.print. */
(() => {
 if(window.GEARPC_AUTH_PDF_V123)return;
 const SOURCE='https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
 let loading;
 function loadLib(){
  if(window.PDFLib?.PDFDocument)return Promise.resolve(window.PDFLib);
  if(loading)return loading;
  loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src=SOURCE;script.async=true;
   script.onload=()=>window.PDFLib?.PDFDocument?resolve(window.PDFLib):reject(new Error('Biblioteca PDF não disponível'));
   script.onerror=()=>reject(new Error('Gerador PDF indisponível. Confira a conexão.'));
   document.head.appendChild(script);
  }).catch(err=>{loading=null;throw err;});
  return loading;
 }
 const safe=v=>String(v===null||v===undefined||v===''?'Não informado':v)
  .replace(/\r\n?/g,'\n').replace(/[–—−]/g,'-').replace(/[‘’]/g,"'")
  .replace(/[“”]/g,'"').replace(/…/g,'...').replace(/[•·]/g,'-')
  .replace(/\u00a0/g,' ').replace(/[^\x09\x0a\x0d\x20-\x7e\xa1-\xff]/g,' ');
 const when=v=>{if(!v)return 'Não informado';const d=new Date(v);
  return Number.isFinite(d.valueOf())?d.toLocaleString('pt-BR',
   {timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}):'Não informado';
 };
 const price=v=>v===null||v===undefined||v===''?'Não informado':
   Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const fileName=r=>(r.simulado?'SIMULACAO':'AUTORIZACAO')+'_GEArPC_'+
   (Number(r.atividade_id)||'atividade')+'_'+(Number(r.jovem_id)||'jovem')+'.pdf';
 async function makeBytes(r,lib){
  if(!r||r.simulado===undefined||r.tipo_registro===undefined)
    throw new Error('Dados incompletos para o comprovante.');
  const {PDFDocument,StandardFonts,rgb}=lib;
  const doc=await PDFDocument.create();
  doc.setTitle(safe((r.simulado?'SIMULACAO':'COMPROVANTE')+' - '+r.titulo));
  doc.setAuthor('Grupo Escoteiro do Ar Paulo Carzino - 198/SC');
  doc.setCreator('GEArPC Conecta v123');
  const regular=await doc.embedFont(StandardFonts.Helvetica);
  const bold=await doc.embedFont(StandardFonts.HelveticaBold);
  const navy=rgb(.11,.24,.35),grey=rgb(.34,.40,.45),red=rgb(.65,.13,.13);
  const W=595.28,H=841.89,M=46,max=W-2*M;
  let page,y;
  function nextPage(){
   page=doc.addPage([W,H]);y=H-44;
   page.drawText('GEArPC CONECTA - GRUPO ESCOTEIRO DO AR PAULO CARZINO - 198/SC',
    {x:M,y,size:8.7,font:bold,color:navy});
   y-=16;page.drawLine({start:{x:M,y},end:{x:W-M,y},thickness:.7,color:grey});y-=24;
  }
  function ensure(n){if(!page||y-n<55)nextPage();}
  function wrap(value,font,size){
   const out=[];
   for(const p of safe(value).split('\n')){
    const words=p.trim().split(/\s+/).filter(Boolean);
    if(!words.length){out.push('');continue;}
    let current='';
    for(const word of words){
     const together=current?current+' '+word:word;
     if(font.widthOfTextAtSize(together,size)<=max){current=together;continue;}
     if(current){out.push(current);current='';}
     let part='';
     for(const char of word){
      if(part&&font.widthOfTextAtSize(part+char,size)>max){out.push(part);part='';}
      part+=char;
     }
     current=part;
    }
    if(current)out.push(current);
   }
   return out;
  }
  function paragraph(value,opt={}){
   const size=opt.size||10.4,leading=size*1.45,font=opt.bold?bold:regular;
   for(const line of wrap(value,font,size)){
    ensure(leading);
    if(line)page.drawText(line,{x:M,y,size,font,color:opt.color||navy});
    y-=leading;
   }
   y-=opt.after??6;
  }
  function heading(value){ensure(29);y-=4;paragraph(value,{bold:true,size:12,after:6});}
  function field(label,value){paragraph(label+': '+safe(value),{size:10,after:0});}
  nextPage();
  paragraph(r.simulado?'SIMULACAO DE TESTE - NAO E AUTORIZACAO VALIDA':
   'COMPROVANTE DE ASSINATURA ELETRONICA',
   {bold:true,size:14.5,color:r.simulado?red:navy,after:13});
  paragraph(r.status==='autorizado'?'PARTICIPACAO AUTORIZADA':'PARTICIPACAO NAO AUTORIZADA',
   {bold:true,size:12,color:r.simulado?red:navy,after:11});
  heading('Dados da atividade');
  for(const [label,value] of [
   ['Atividade',r.titulo],['Jovem',r.jovem_nome],['Seção',r.secao_nome],
   ['Início',when(r.inicio)],['Término',when(r.fim)],['Local',r.local],
   ['Saída',r.local_saida||r.ponto_encontro],
   ['Retorno',r.local_chegada||r.ponto_encontro],
   ['Ponto de encontro',r.ponto_encontro||r.local_saida],
   ['Transporte',r.transporte],
   ['Chefe responsável',r.chefe_responsavel],['Custo por participante',price(r.custo_individual)]
  ])field(label,value);
  for(const [label,key] of [
   ['Detalhes do transporte','transporte_detalhes'],['Descrição','descricao_breve'],
   ['Alimentação','alimentacao'],['Materiais','materiais'],
   ['Observações','observacoes'],['Mapa','link_mapa']
  ])if(r[key])field(label,r[key]);
  y-=10;heading('Declaração registrada');
  const verb=r.status==='nao_autorizado'?'NÃO AUTORIZO':'AUTORIZO';
  paragraph('Eu, '+safe(r.nome_assinante)+', identificado(a) pelo documento '+
   safe(r.documento_tipo)+' terminado em '+safe(r.documento_final)+', declaro: '+
   verb+' a participação de '+safe(r.jovem_nome)+' na atividade descrita acima.',{size:10.6,after:8});
  if(r.termo_original||r.texto_autorizacao)
   paragraph(r.termo_original||r.texto_autorizacao,{size:10,after:10});
  heading('Registro eletrônico');
  field('Tipo',r.simulado?'Simulação não válida':'Assinatura eletrônica simples');
  field('Nome informado',r.nome_assinante);
  field('Documento',safe(r.documento_tipo)+' - somente final '+safe(r.documento_final));
  field('Resposta',r.status==='autorizado'?'Autorizado':'Não autorizado');
  field('Data e hora',when(r.assinado_em));
  field('ID de registro',r.registro_id);
  if(!r.simulado)field('ID de evento de auditoria',r.evento_id||'Não disponível');
  field('Versão da autorização',r.versao_assinada);
  y-=12;
  paragraph(r.simulado?
   'ATENCAO: teste sem valor de autorização. A pessoa indicada não foi autenticada, e o registro não comprova que ela assinou.':
   'Registro da assinatura eletrônica simples realizada em conta autenticada do GEArPC Conecta. Não é assinatura digital certificada. Somente o final do documento de identificação é apresentado.',
   {size:9.2,bold:!!r.simulado,color:r.simulado?red:grey});
  const pages=doc.getPages();
  pages.forEach((p,i)=>{
   p.drawLine({start:{x:M,y:42},end:{x:W-M,y:42},thickness:.5,color:grey});
   p.drawText('GEArPC Conecta - Cópia de registro eletrônico',
    {x:M,y:29,font:regular,size:8,color:grey});
   p.drawText((i+1)+' / '+pages.length,
    {x:W-M-25,y:29,font:regular,size:8,color:grey});
  });
  return doc.save({useObjectStreams:false});
 }
 async function downloadSigned(row){
  const lib=await loadLib();
  const bytes=await makeBytes(row,lib);
  if(bytes.length<500||bytes[0]!==37||bytes[1]!==80||
   bytes[2]!==68||bytes[3]!==70||bytes[4]!==45)
   throw new Error('Arquivo PDF incompleto. O download foi interrompido.');
  const blob=new Blob([bytes],{type:'application/pdf'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=fileName(row);
  a.style.display='none';document.body.appendChild(a);
  try{a.click();}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),120000);}
  return {name:fileName(row),size:blob.size};
 }
 window.GEARPC_AUTH_PDF_V123={downloadSigned,makeBytes};
})();