(() => {
  if (window.__GEARPC_MEDICAL_EDIT_V95__) return;
  window.__GEARPC_MEDICAL_EDIT_V95__ = true;
  const $ = (id) => document.getElementById(id);
  const state = { rt:null, editor:null, med:null, proposal:null, jovemId:null,
    original:null, busy:false, adminPanel:null, adminRows:[] };
  const keys = ['tipo_sanguineo','alergias','medicamentos_uso_continuo','restricoes_alimentares',
    'condicoes_relevantes','necessidades_especiais','plano_saude','numero_carteirinha',
    'contato_emergencia_nome','contato_emergencia_telefone','observacoes'];
  const labels = {tipo_sanguineo:'Tipo sanguíneo',alergias:'Alergias',
    medicamentos_uso_continuo:'Medicamentos',restricoes_alimentares:'Restrições alimentares',
    condicoes_relevantes:'Condições de saúde',necessidades_especiais:'Necessidades especiais',
    plano_saude:'Plano de saúde',numero_carteirinha:'Carteirinha do plano',
    contato_emergencia_nome:'Contato para emergência',
    contato_emergencia_telefone:'Telefone de emergência',observacoes:'Observações',
    medicamentos:'Medicamentos detalhados',_manual_summary:'Informações complementares'};
  const cl = () => state.rt?.client;
  const prof = () => state.rt?.state?.profile;
  const usr = () => state.rt?.state?.user;
  const utils = () => window.GEARPC_MEDICAL_UTILS_V95;
  const isParent = () => prof()?.tipo === 'responsavel' && prof()?.eh_teste === true && !!prof()?.responsavel_id;
  const isAdmin = () => prof()?.tipo === 'administrador';
  const esc = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const originalValue = (id) => state.editor?.querySelector('[data-original-id="'+id+'"]');
  function msg(text, error=false) {
    const el=originalValue('medicalFormMessage');
    if (!el) return;
    el.textContent=text;
    el.style.color=error?'#a33b30':'#176b3a';
  }
  function medSelect() {
    return 'jovem_id,tipo_sanguineo,alergias,medicamentos_uso_continuo,restricoes_alimentares,'+
      'condicoes_relevantes,necessidades_especiais,plano_saude,numero_carteirinha,'+
      'contato_emergencia_nome,contato_emergencia_telefone,observacoes,dados_completos,atualizado_em';
  }
  function styles() {
    if ($('medicalEditStylesV95')) return;
    const st=document.createElement('style');
    st.id='medicalEditStylesV95';
    st.textContent='.med-edit-v95{max-height:95vh;max-width:min(940px,96vw);width:920px;padding:0;border-radius:15px;border:1px solid #c4d7e5;box-shadow:0 12px 52px #0004}.med-edit-v95::backdrop{background:#071a2bc9}.med-edit-v95 form{max-height:95vh;overflow-y:auto}.med-edit-notice-v95{margin:12px 0;padding:11px;background:#eaf3ff;border-radius:10px;color:#183956;font-size:.85rem}.med-edit-open-v95{border:1px solid #b3cee3;background:#e8f4fc;color:#164873;border-radius:10px;font-size:.82rem;font-weight:850;padding:10px 12px;margin:10px 0;cursor:pointer}.med-edit-badge-v95{font-size:.75rem;color:#765810;background:#fff2cf;border-radius:8px;padding:9px;margin-top:7px}.med-edit-admin-v95{position:fixed;inset:0;background:#eff3f8;z-index:110000;overflow:auto;padding:14px;box-sizing:border-box}.med-edit-admin-v95.hidden{display:none!important}.med-edit-shell-v95{max-width:920px;margin:0 auto}.med-edit-header-v95{display:flex;justify-content:space-between;gap:15px;align-items:center;background:#0a376c;border-radius:14px;color:#fff;padding:15px}.med-edit-header-v95 h2{margin:0;font-size:1.2rem}.med-edit-header-v95 button{padding:10px;background:#fff;border:0;border-radius:8px}.med-edit-admin-card-v95{background:#fff;border-radius:12px;padding:16px;margin:14px 0;border:1px solid #d4e1eb}.med-edit-admin-card-v95 h3{margin:0 0 5px}.med-edit-changes-v95{margin:9px 0;padding:9px 12px;background:#f4f7fa;border-radius:8px;font-size:.8rem}.med-edit-changes-v95 p{margin:6px 0;padding-bottom:6px;border-bottom:1px solid #dfe6eb;overflow-wrap:anywhere}.med-edit-btn-v95{border:0;border-radius:8px;color:#fff;background:#176b3a;padding:10px 13px;font-weight:800;margin:5px 5px 5px 0}.med-edit-btn-v95.reject{background:#9e4635}.med-edit-reason-v95{display:block;width:100%;box-sizing:border-box;min-height:70px;margin:7px 0;padding:9px;border-radius:8px;border:1px solid #c5d3de}.med-edit-admin-message-v95{min-height:22px;margin-top:10px;font-weight:750}@media(max-width:620px){.med-edit-v95{width:100vw;max-width:100vw;max-height:100dvh;border-radius:0}.med-edit-v95 form{max-height:100dvh}.med-edit-header-v95{align-items:flex-start}}';
    document.head.appendChild(st);
  }
  function editor() {
    if (state.editor) return state.editor;
    const original=$('medicalDialog');
    if (!original) throw Error('Formulário médico original não encontrado.');
    styles();
    const dialog=original.cloneNode(true);
    dialog.id='responsibleMedicalDialogV95';
    dialog.classList.add('med-edit-v95');
    dialog.querySelectorAll('[id]').forEach((node)=>{
      node.dataset.originalId=node.id;
      node.id='rme95-'+node.id;
    });
    dialog.querySelectorAll('[for]').forEach((node)=>{
      node.setAttribute('for','rme95-'+node.getAttribute('for'));
    });
    dialog.querySelectorAll('input[name]').forEach((node)=>{
      node.name='rme95-'+node.name;
    });
    const remove=dialog.querySelector('[data-original-id="deleteMedicalButton"]');
    remove?.remove();
    const title=dialog.querySelector('h2');
    if (title) title.textContent='Conferência e edição da ficha médica';
    const note=dialog.querySelector('.medical-form-warning');
    if (note) note.textContent='Confira toda a ficha, altere o que for necessário e envie para aprovação da administração. Até a aprovação, a ficha oficial permanece como está.';
    const save=dialog.querySelector('[data-original-id="saveMedicalButton"]');
    if (save) save.textContent='Enviar alterações para aprovação';
    const form=dialog.querySelector('form');
    form.setAttribute('method','dialog');
    form.insertAdjacentHTML('afterbegin','<p class="med-edit-notice-v95">Somente um responsável vinculado pode enviar esta proposta. O administrador terá acesso às informações alteradas para conferência.</p>');
    form.addEventListener('submit',(ev)=>{ev.preventDefault();void submit();});
    dialog.querySelector('[data-original-id="closeMedicalDialog"]')?.addEventListener('click',()=>dialog.close());
    dialog.querySelector('[data-original-id="cancelMedicalButton"]')?.addEventListener('click',()=>dialog.close());
    dialog.querySelector('[data-original-id="medicalAddMedicationButton"]')?.addEventListener('click',()=>addMedRow());
    dialog.addEventListener('click',(ev)=>{
      const rem=ev.target.closest('[data-remove-medication]');
      if (rem) {
        const row=rem.closest('[data-medication-row]');
        const list=originalValue('medicalMedicationsList');
        if (list?.querySelectorAll('[data-medication-row]').length===1)
          row?.querySelectorAll('input,select').forEach((input)=>{input.value='';});
        else row?.remove();
      }
      const clear=ev.target.closest('[data-clear-medical-input]');
      if (clear) {
        const input=originalValue(clear.dataset.clearMedicalInput);
        if(input) { input.value='';input.focus(); }
      }
    });
    document.body.appendChild(dialog);
    state.editor=dialog;
    return dialog;
  }
  function medicationRow(data={}) {
    const row=document.createElement('div');
    row.className='medical-medication-row';
    row.dataset.medicationRow='';
    row.innerHTML='<label>Nome do medicamento<input type="text" data-med-name maxlength="160"></label>'+
      '<label>Uso contínuo<select data-med-cont><option value="">Não informado</option><option value="sim">Sim</option><option value="nao">Não</option></select></label>'+
      '<label class="wide">Informações<input type="text" data-med-info maxlength="240" placeholder="Dose, horário ou orientação"></label>'+
      '<button type="button" class="danger-text medical-remove-medication" data-remove-medication>Apagar</button>';
    row.querySelector('[data-med-name]').value=data.nome||'';
    row.querySelector('[data-med-cont]').value=data.uso_continuo===true?'sim':data.uso_continuo===false?'nao':'';
    row.querySelector('[data-med-info]').value=data.informacoes||'';
    return row;
  }
  function addMedRow() {
    originalValue('medicalMedicationsList')?.appendChild(medicationRow());
  }
  function fill(payload, med) {
    const u=utils();
    const data=payload || med || {};
    const raw=u.fullMedicalData(data);
    const full=u.applyMedicalFallbacks(raw,data);
    const manual=u.manualMedicalComplements(data,raw);
    const blood=u.parseBloodType(data.tipo_sanguineo);
    const d=editor();
    d.querySelectorAll('[data-full-key]').forEach((el)=>{
      const value=full[el.dataset.fullKey];
      if(el.type==='checkbox') el.checked=value===true;
      else if(el.type==='radio') el.checked=String(value??'')===el.value;
      else el.value=value??'';
    });
    originalValue('medicalBloodType').value=blood.abo;
    if(!full.fator_rh && blood.rh) {
      d.querySelector('[data-full-key="fator_rh"]').value=blood.rh;
    }
    const manualIds={allergies:'medicalAllergies',medications:'medicalContinuousMedication',
      foodRestrictions:'medicalFoodRestrictions',conditions:'medicalRelevantConditions',
      specialNeeds:'medicalSpecialNeeds',observations:'medicalObservations'};
    Object.entries(manualIds).forEach(([k,id])=>{originalValue(id).value=manual[k]||'';});
    const fields={medicalHealthPlan:'plano_saude',medicalCardNumber:'numero_carteirinha',
      medicalEmergencyPhone:'contato_emergencia_telefone'};
    Object.entries(fields).forEach(([id,k])=>{originalValue(id).value=data[k]||'';});
    originalValue('medicalEmergencyName').value=data.contato_emergencia_nome==='Pais/Responsáveis'?'':(data.contato_emergencia_nome||'');
    const meds=originalValue('medicalMedicationsList');
    meds.replaceChildren(...(Array.isArray(full.medicamentos)&&full.medicamentos.length?full.medicamentos:[{}]).map(medicationRow));
  }
  function collect() {
    const u=utils(), dlg=editor();
    const full={};
    dlg.querySelectorAll('[data-full-key]').forEach((el)=>{
      const key=el.dataset.fullKey;
      if(el.type==='checkbox')full[key]=el.checked;
      else if(el.type==='radio'){if(el.checked)full[key]=el.value;}
      else full[key]=el.value.trim();
    });
    const meds=[...originalValue('medicalMedicationsList').querySelectorAll('[data-medication-row]')]
      .map((row)=>{
        const name=row.querySelector('[data-med-name]').value.trim();
        const cont=row.querySelector('[data-med-cont]').value;
        const info=row.querySelector('[data-med-info]').value.trim();
        return {nome:name,uso_continuo:cont==='sim'?true:cont==='nao'?false:null,informacoes:info};
      }).filter((v)=>v.nome||v.informacoes||v.uso_continuo!==null);
    full.medicamentos=meds;
    const manual={
      allergies:originalValue('medicalAllergies').value.trim(),
      medications:originalValue('medicalContinuousMedication').value.trim(),
      foodRestrictions:originalValue('medicalFoodRestrictions').value.trim(),
      conditions:originalValue('medicalRelevantConditions').value.trim(),
      specialNeeds:originalValue('medicalSpecialNeeds').value.trim(),
      observations:originalValue('medicalObservations').value.trim()
    };
    full._manual_summary=manual;
    const summary=u.buildMedicalSummary(full,manual);
    const abo=originalValue('medicalBloodType').value.trim();
    const rh=String(full.fator_rh||'').trim();
    const emergencyName=full.avisar_emergencia==='pais'
      ? 'Pais/Responsáveis'
      : (full.emergencia_outro||originalValue('medicalEmergencyName').value.trim()||null);
    return {
      tipo_sanguineo:abo?abo+rh:null,
      alergias:summary.alergias,
      medicamentos_uso_continuo:summary.medicamentos_uso_continuo,
      restricoes_alimentares:summary.restricoes_alimentares,
      condicoes_relevantes:summary.condicoes_relevantes,
      necessidades_especiais:summary.necessidades_especiais,
      plano_saude:originalValue('medicalHealthPlan').value.trim()||null,
      numero_carteirinha:originalValue('medicalCardNumber').value.trim()||null,
      contato_emergencia_nome:emergencyName,
      contato_emergencia_telefone:full.telefone_emergencia||originalValue('medicalEmergencyPhone').value.trim()||null,
      observacoes:summary.observacoes,
      dados_completos:full
    };
  }
  async function open(jovemId) {
    if(!isParent())return;
    if(!Number.isSafeInteger(Number(jovemId))||Number(jovemId)<1)return;
    const c=cl(),p=prof();
    try {
      const link=await c.from('jovem_responsaveis').select('jovem_id')
        .eq('responsavel_id',Number(p.responsavel_id)).eq('jovem_id',Number(jovemId)).maybeSingle();
      if(link.error)throw link.error;
      if(!link.data)throw Error('Este jovem não está vinculado ao seu acesso.');
      const [medResult,propResult,jovemResult]=await Promise.all([
        c.from('fichas_medicas').select(medSelect()).eq('jovem_id',Number(jovemId)).maybeSingle(),
        c.from('responsavel_propostas_ficha_medica')
          .select('id,dados_propostos,base_atualizado_em,status,criado_em')
          .eq('responsavel_id',Number(p.responsavel_id)).eq('jovem_id',Number(jovemId))
          .eq('status','pendente').maybeSingle(),
        c.from('jovens').select('nome_completo').eq('id',Number(jovemId)).single()
      ]);
      for(const r of [medResult,propResult,jovemResult])if(r.error)throw r.error;
      state.med=medResult.data||null;
      state.proposal=propResult.data||null;
      state.jovemId=Number(jovemId);
      const d=editor();
      originalValue('medicalMemberName').textContent=jovemResult.data.nome_completo;
      fill(state.proposal?.dados_propostos || null,state.med);
      state.original=collect();
      msg(state.proposal
        ? 'Há alterações aguardando aprovação. Você pode ajustar e reenviar esta proposta.'
        : 'Corrija somente o que for necessário. Nenhuma alteração é gravada na ficha oficial sem a aprovação.');
      if(!d.open)d.showModal();
    } catch(e) {
      window.alert('Não foi possível abrir a ficha: '+(e.message||e));
    }
  }
  async function submit() {
    if(state.busy || !isParent() || !state.jovemId)return;
    const proposed=collect();
    if(JSON.stringify(proposed)===JSON.stringify(state.original)){
      msg('Nenhuma alteração nova. Se os dados já estão corretos, use a confirmação de dados do jovem.');
      return;
    }
    if(JSON.stringify(proposed).length>35000){
      msg('A ficha ultrapassa o tamanho permitido. Resuma os campos mais extensos.',true);return;
    }
    state.busy=true;
    const save=originalValue('saveMedicalButton');
    if(save)save.disabled=true;
    msg('Enviando alterações para análise…');
    try{
      const c=cl(),p=prof(),current=await c.from('fichas_medicas')
        .select('atualizado_em').eq('jovem_id',state.jovemId).maybeSingle();
      if(current.error)throw current.error;
      if((current.data?.atualizado_em||null)!==(state.med?.atualizado_em||null))
        throw Error('A ficha foi atualizada por outra pessoa. Feche e abra novamente antes de enviar.');
      let resp;
      if(state.proposal?.id) {
        resp=await c.from('responsavel_propostas_ficha_medica')
          .update({dados_propostos:proposed,base_atualizado_em:state.med?.atualizado_em||null,
            atualizado_em:new Date().toISOString()})
          .eq('id',state.proposal.id).eq('status','pendente').select('id').single();
      }else{
        resp=await c.from('responsavel_propostas_ficha_medica')
          .insert({responsavel_id:Number(p.responsavel_id),jovem_id:state.jovemId,
            criado_por:usr().id,base_atualizado_em:state.med?.atualizado_em||null,
            dados_propostos:proposed}).select('id').single();
      }
      if(resp.error)throw resp.error;
      const now=new Date().toISOString();
      const conf=await c.from('responsavel_confirmacoes_jovens')
        .upsert({responsavel_id:Number(p.responsavel_id),jovem_id:state.jovemId,
          status:'correcao_solicitada',observacao:'Ficha médica editada: aguardando aprovação da administração.',
          confirmado_em:null,ficha_medica_confirmada_em:null,solicitado_em:now,
          atualizado_em:now,confirmado_por:usr().id},
          {onConflict:'responsavel_id,jovem_id'});
      if(conf.error)throw conf.error;
      state.editor.close();
      await window.GEARPC_RESPONSIBLE_FIRST_ACCESS_V95?.refresh?.();
      window.alert('Alterações enviadas para o administrador. A ficha oficial só será alterada após aprovação.');
    }catch(e){msg('Não foi possível enviar: '+(e.message||e),true);}
    finally{state.busy=false;if(save)save.disabled=false;}
  }
  function labelFor(key) {
    if(labels[key])return labels[key];
    const f=$('medicalDialog')?.querySelector('[data-full-key="'+key+'"]');
    const option=f?.closest('.medical-option-row');
    return option?.querySelector('.medical-option span')?.textContent?.trim()
      || f?.closest('fieldset')?.querySelector('legend')?.textContent?.trim()
      || f?.closest('label')?.textContent?.trim()
      || key.replaceAll('_',' ');
  }
  function valueText(v) {
    if(v===true)return 'Sim';
    if(v===false)return 'Não';
    if(v==null||v==='')return 'Não informado';
    if(Array.isArray(v))return v.map(valueText).join(' | ')||'Não informado';
    if(typeof v==='object')return Object.entries(v).map(([k,x])=>k+': '+valueText(x)).join(' | ');
    return String(v);
  }
  function changedHtml(actual={}, proposed={}) {
    const from=actual||{},to=proposed||{};
    const top=keys.filter((k)=>String(from[k]??'')!==String(to[k]??''))
      .map((k)=>[labels[k]||k,from[k],to[k]]);
    const before=from.dados_completos||{},after=to.dados_completos||{};
    const detail=[...new Set([...Object.keys(before),...Object.keys(after)])]
      .filter((k)=>{
        const left=before[k],right=after[k];
        if(k.endsWith('_marcado')&&(left===undefined||left===null)&&right===false)return false;
        return JSON.stringify(left??null)!==JSON.stringify(right??null);
      })
      .map((k)=>[labelFor(k),before[k],after[k]]);
    const all=[...top,...detail];
    if(!all.length)return '<p>Não foram encontradas diferenças. Confira se a ficha foi atualizada recentemente.</p>';
    return all.map(([name,a,b])=>'<p><strong>'+esc(name)+'</strong><span style="display:block">Atual: '+esc(valueText(a))+'</span><span style="display:block;color:#176b3a">Proposto: '+esc(valueText(b))+'</span></p>').join('');
  }
  function adminPanel() {
    if(state.adminPanel)return state.adminPanel;
    styles();
    const box=document.createElement('section');
    box.className='med-edit-admin-v95 hidden';box.id='medicalAdminPanelV95';
    box.innerHTML='<div class="med-edit-shell-v95"><div class="med-edit-header-v95">'+
      '<h2>Propostas de alteração da ficha médica</h2><button type="button" data-v95-close>Voltar</button></div>'+
      '<p>Confira o que mudou e aprove ou rejeite. Somente a aprovação atualiza a ficha médica oficial.</p>'+
      '<div id="medicalAdminRowsV95"></div><div class="med-edit-admin-message-v95" id="medicalAdminMsgV95"></div></div>';
    box.querySelector('[data-v95-close]').addEventListener('click',()=>{
      box.classList.add('hidden');document.body.classList.remove('med-edit-admin-lock-v95');
    });
    box.addEventListener('click',async(ev)=>{
      const action=ev.target.closest('[data-v95-decision]');
      if(!action||state.busy)return;
      const id=Number(action.dataset.v95Decision),approve=action.dataset.approve==='true';
      const row=state.adminRows.find((x)=>Number(x.id)===id);
      if(!row)return;
      if(approve&&!window.confirm('Aprovar as alterações da ficha médica de '+row.jovemNome+'?'))return;
      const reason=box.querySelector('[data-v95-reason="'+id+'"]')?.value.trim()||null;
      state.busy=true;
      action.disabled=true;
      const status=$('medicalAdminMsgV95');status.textContent='Registrando decisão…';
      try{
        const r=await cl().rpc('admin_decidir_proposta_medica',
          {p_proposta_id:id,p_aprovar:approve,p_justificativa:reason});
        if(r.error)throw r.error;
        status.textContent=approve?'Ficha médica aprovada e atualizada.':'Proposta rejeitada; responsável poderá reenviar.';
        await loadAdmin();
      }catch(e){status.textContent='Erro: '+(e.message||e);}
      finally{state.busy=false;action.disabled=false;}
    });
    document.body.appendChild(box);state.adminPanel=box;return box;
  }
  async function loadAdmin() {
    if(!isAdmin())return;
    const panel=adminPanel(),list=$('medicalAdminRowsV95');
    list.textContent='Carregando propostas…';
    const c=cl();
    const r=await c.from('responsavel_propostas_ficha_medica')
      .select('id,responsavel_id,jovem_id,criado_em,base_atualizado_em,dados_propostos')
      .eq('status','pendente').order('criado_em',{ascending:true});
    if(r.error){list.textContent='Não foi possível carregar: '+r.error.message;return;}
    if(!r.data?.length){state.adminRows=[];list.textContent='Não há alterações médicas pendentes.';return;}
    const ids=[...new Set(r.data.map(x=>x.jovem_id))],parentIds=[...new Set(r.data.map(x=>x.responsavel_id))];
    const [j,parents,med]=await Promise.all([
      c.from('jovens').select('id,nome_completo').in('id',ids),
      c.from('responsaveis').select('id,nome_completo').in('id',parentIds),
      c.from('fichas_medicas').select(medSelect()).in('jovem_id',ids)
    ]);
    for(const q of [j,parents,med])if(q.error){list.textContent='Erro: '+q.error.message;return;}
    const jovens=new Map((j.data||[]).map(x=>[Number(x.id),x.nome_completo]));
    const responsaveis=new Map((parents.data||[]).map(x=>[Number(x.id),x.nome_completo]));
    const medical=new Map((med.data||[]).map(x=>[Number(x.jovem_id),x]));
    state.adminRows=r.data.map((x)=>({...x,
      jovemNome:jovens.get(Number(x.jovem_id))||'Jovem',
      responsavelNome:responsaveis.get(Number(x.responsavel_id))||'Responsável',
      med:medical.get(Number(x.jovem_id))||null}));
    list.innerHTML=state.adminRows.map((x)=>{
      const conflict=(x.med?.atualizado_em||null)!==(x.base_atualizado_em||null);
      return '<article class="med-edit-admin-card-v95"><h3>'+esc(x.jovemNome)+'</h3>'+
        '<p>Enviado por: <strong>'+esc(x.responsavelNome)+'</strong> em '+esc(new Date(x.criado_em).toLocaleString('pt-BR'))+'</p>'+
        (conflict?'<p class="med-edit-badge-v95">A ficha original mudou desde o envio. Será necessário reenviar a proposta.</p>':'')+
        '<details open><summary>Confira as alterações solicitadas</summary><div class="med-edit-changes-v95">'+changedHtml(x.med,x.dados_propostos)+'</div></details>'+
        '<textarea class="med-edit-reason-v95" data-v95-reason="'+Number(x.id)+'" placeholder="Motivo da rejeição (opcional)"></textarea>'+
        '<button class="med-edit-btn-v95" type="button" data-v95-decision="'+Number(x.id)+'" data-approve="true"'+(conflict?' disabled':'')+'>Aprovar e atualizar ficha</button>'+
        '<button class="med-edit-btn-v95 reject" type="button" data-v95-decision="'+Number(x.id)+'" data-approve="false">Rejeitar proposta</button></article>';
    }).join('');
  }
  async function openAdmin(){
    if(!isAdmin())return;
    const pane=adminPanel();pane.classList.remove('hidden');
    try{await loadAdmin();}catch(e){$('medicalAdminRowsV95').textContent=e.message||e;}
  }
  function addAdminButton() {
    const modules=document.querySelector('#dashboardView .launch-modules');
    if(!modules||!isAdmin()||$('medicalProposalAdminButtonV95'))return;
    const btn=document.createElement('button');
    btn.className='launch-module';btn.type='button';btn.id='medicalProposalAdminButtonV95';
    btn.innerHTML='<span class="launch-module-icon">🩺</span><span class="launch-module-copy"><strong>Aprovar fichas médicas</strong><small>Alterações enviadas pelos responsáveis.</small></span><span class="launch-module-arrow">›</span>';
    btn.addEventListener('click',()=>void openAdmin());modules.appendChild(btn);
  }
  async function prepare() {
    const rt=window.GEARPC_RUNTIME;
    if(!rt?.client||!rt?.state?.profile)return;
    state.rt=rt;
    if(isAdmin())addAdminButton();
  }
  window.GEARPC_MEDICAL_EDIT_V95={open,openAdmin};
  window.GEARPC_DASHBOARD_PREPARE_TASKS=window.GEARPC_DASHBOARD_PREPARE_TASKS||[];
  window.GEARPC_DASHBOARD_PREPARE_TASKS.push(prepare);
  document.addEventListener('click',(event)=>{
    const button=event.target.closest('[data-rfa-edit-medical],[data-rdm-edit-medical]');
    if(button&&isParent()){
      const id=Number(button.dataset.rfaEditMedical||button.dataset.rdmEditMedical);
      if(id)void open(id);
    }
  });
})();