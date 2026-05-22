// 관리 패널 (제품 관리, 판매자 관리, 입출고 내역, 설정)

/* ===== 관리 패널 열기/닫기 ===== */
function openMgmt(){document.getElementById('mgmt-ov').classList.add('open');setMT(mgmtTab);}
function closeMgmt(){document.getElementById('mgmt-ov').classList.remove('open');}
function mgmtBg(e){if(e.target===document.getElementById('mgmt-ov'))closeMgmt();}
function setMT(tab){
  mgmtTab=tab;
  ['sl','pr','hi','se'].forEach(function(x){document.getElementById('mt-'+x).classList.toggle('active',x===tab);document.getElementById('mc-'+x).style.display=x===tab?'block':'none';});
  if(tab==='sl')renderSL();else if(tab==='pr')renderPR();else if(tab==='hi')renderHI();else if(tab==='se')document.getElementById('se-name').value=uName;
}
function setHT(tab){
  histTab=tab;
  document.getElementById('hb-in').className='btn btn-sm '+(tab==='in'?'btn-primary':'btn-outline');
  document.getElementById('hb-out').className='btn btn-sm '+(tab==='out'?'btn-primary':'btn-outline');
  document.getElementById('hb-adj').className='btn btn-sm '+(tab==='adj'?'btn-primary':'btn-outline');
  document.getElementById('hi-in').style.display=tab==='in'?'block':'none';
  document.getElementById('hi-out').style.display=tab==='out'?'block':'none';
  document.getElementById('hi-adj').style.display=tab==='adj'?'block':'none';
  if(tab==='in')renderHIn();else if(tab==='out')renderHOut();else renderHAdj();
}

/* ===== 제품 관리 ===== */
function renderPR(){
  var el=document.getElementById('pr-list');var pids=Object.keys(prods);
  if(!pids.length){el.innerHTML='<div class="empty"><div class="empty-icon">🥬</div><div class="empty-text">'+t('noProd')+'</div></div>';return;}
  el.innerHTML=pids.map(function(pid){var p=prods[pid];var s=stock[pid]||{quantity:0};
    return'<div class="p-item" data-pid="'+pid+'">'+
      '<div class="p-name">'+pName(p.name)+' '+p.size+'</div>'+
      '<div class="p-meta">'+t('mgmtStock')+':'+(s.quantity||0)+(p.unit||t('invUnit'))+' | '+t('mgmtSupply')+':'+N(p.supplyPrice||0)+'₫ | '+t('mgmtSalePrice')+':'+N(p.salePrice||0)+'₫</div>'+
      '<div class="p-acts">'+
      '<button class="btn btn-sm btn-outline pr-edit-btn">✏️ '+t('editBtn')+'</button>'+
      '<button class="btn btn-sm btn-outline pr-adj-btn">📦 '+t('mgmtStock')+'</button>'+
      '<button class="btn-dsm pr-del-btn">🗑</button>'+
      '</div></div>';
  }).join('');
  el.querySelectorAll('.pr-edit-btn').forEach(function(btn){
    var pid=btn.closest('[data-pid]').getAttribute('data-pid');
    btn.onclick=function(){openEdProd(pid);};
  });
  el.querySelectorAll('.pr-adj-btn').forEach(function(btn){
    var pid=btn.closest('[data-pid]').getAttribute('data-pid');
    btn.onclick=function(){openAdj(pid);};
  });
  el.querySelectorAll('.pr-del-btn').forEach(function(btn){
    var pid=btn.closest('[data-pid]').getAttribute('data-pid');
    btn.onclick=function(){delProd(pid);};
  });
}
function openAddProd(){
  document.getElementById('pm-title').textContent='제품 추가';
  ['pm-name','pm-size','pm-unit','pm-supply','pm-sale','pm-min','pm-id'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('pm-size-select').value='1kg';
  document.getElementById('pm-size').style.display='none';
  document.getElementById('modal-prod').classList.add('open');
}
function handleSizeSelect(){
  var sel=document.getElementById('pm-size-select').value;
  var inp=document.getElementById('pm-size');
  if(sel==='custom'){inp.style.display='block';inp.value='';inp.focus();}
  else{inp.style.display='none';inp.value=sel;}
}
function openEdProd(id){
  var p=prods[id];
  document.getElementById('pm-title').textContent='제품 수정';
  document.getElementById('pm-name').value=p.name||'';
  var size=p.size||'';
  var sizeSelect=document.getElementById('pm-size-select');
  var sizeInput=document.getElementById('pm-size');
  var found=false;
  for(var i=0;i<sizeSelect.options.length-1;i++){
    if(sizeSelect.options[i].value===size){
      sizeSelect.value=size;sizeInput.style.display='none';sizeInput.value=size;found=true;break;
    }
  }
  if(!found){sizeSelect.value='custom';sizeInput.style.display='block';sizeInput.value=size;}
  document.getElementById('pm-unit').value=p.unit||'';
  document.getElementById('pm-supply').value=p.supplyPrice||'';
  document.getElementById('pm-sale').value=p.salePrice||'';
  document.getElementById('pm-min').value=p.minStock||'';
  document.getElementById('pm-id').value=id;
  document.getElementById('modal-prod').classList.add('open');
}
async function saveProd(){
  var name=document.getElementById('pm-name').value.trim();
  var sizeSelect=document.getElementById('pm-size-select').value;
  var sizeInput=document.getElementById('pm-size').value.trim();
  var size=sizeSelect==='custom'?sizeInput:sizeSelect;
  if(!name||!size){toast(t('eProdN'));return;}
  var id=document.getElementById('pm-id').value||gid();
  var p={name:name,size:size,unit:document.getElementById('pm-unit').value||'개',supplyPrice:parseInt(document.getElementById('pm-supply').value)||0,salePrice:parseInt(document.getElementById('pm-sale').value)||0,minStock:parseInt(document.getElementById('pm-min').value)||0};
  try{await fSet('products/'+id,p);prods[id]=p;toast(t('saved'));closeMod('modal-prod');renderPR();popSels();renderHome();}catch(e){toast('실패:'+e.message);}
}
async function delProd(id){if(!confirm(t('dProd')))return;try{await fDel('products/'+id);delete prods[id];toast(t('del'));renderPR();renderHome();}catch(e){toast('실패');}}

/* ===== 판매자 관리 ===== */
function renderSL(){
  var el=document.getElementById('sl-list');var sids=Object.keys(sellers);
  if(!sids.length){el.innerHTML='<div class="empty"><div class="empty-icon">🧑‍💼</div><div class="empty-text">'+t('noSeller')+'</div></div>';return;}
  el.innerHTML=sids.map(function(sid){var s=sellers[sid];
    var rate=s.profitRate!==undefined?s.profitRate:50;
    return'<div class="sl-card" data-sid="'+sid+'">'+
      '<div class="sl-name">🧑‍💼 '+s.name+'</div>'+
      '<div class="sl-meta">'+(s.phone||'')+' '+(s.note?'| '+s.note:'')+'</div>'+
      '<div class="sl-meta" style="margin-top:4px;color:var(--purple);font-weight:700">수익배분 — 판매자 '+rate+'% : 나 '+(100-rate)+'%</div>'+
      '<div class="p-acts" style="margin-top:10px">'+
      '<button class="btn btn-sm btn-outline sl-edit-btn">✏️ '+t('editBtn')+'</button>'+
      '<button class="btn-dsm sl-del-btn">🗑 '+t('delBtn')+'</button>'+
      '</div></div>';
  }).join('');
  el.querySelectorAll('.sl-edit-btn').forEach(function(btn){
    var sid=btn.closest('[data-sid]').getAttribute('data-sid');
    btn.onclick=function(){openEdSL(sid);};
  });
  el.querySelectorAll('.sl-del-btn').forEach(function(btn){
    var sid=btn.closest('[data-sid]').getAttribute('data-sid');
    btn.onclick=function(){delSL(sid);};
  });
}
function openAddSL(){
  document.getElementById('sl-title').textContent='판매자 추가';
  ['sl-name','sl-phone','sl-note','sl-id'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('sl-profit-rate').value='50';
  document.getElementById('modal-seller').classList.add('open');
}
function openEdSL(id){
  var s=sellers[id];
  document.getElementById('sl-title').textContent='판매자 수정';
  document.getElementById('sl-name').value=s.name||'';
  document.getElementById('sl-phone').value=s.phone||'';
  document.getElementById('sl-note').value=s.note||'';
  document.getElementById('sl-profit-rate').value=s.profitRate!==undefined?s.profitRate:50;
  document.getElementById('sl-id').value=id;
  document.getElementById('modal-seller').classList.add('open');
}
async function saveSeller(){
  var name=document.getElementById('sl-name').value.trim();if(!name){toast(t('eName'));return;}
  var id=document.getElementById('sl-id').value||gid();
  var rate=parseInt(document.getElementById('sl-profit-rate').value)||50;
  if(rate<0||rate>100){toast('수익 배분 비율은 0~100 사이로 입력하세요.');return;}
  var s={name:name,phone:document.getElementById('sl-phone').value,note:document.getElementById('sl-note').value,profitRate:rate};
  try{await fSet('sellers/'+id,s);sellers[id]=s;toast(t('saved'));closeMod('modal-seller');renderSL();popSels();renderHome();}catch(e){toast('실패:'+e.message);}
}
async function delSL(id){if(!confirm(t('dSL')))return;try{await fDel('sellers/'+id);delete sellers[id];toast(t('del'));renderSL();}catch(e){toast('실패');}}

/* ===== 내역 조회 ===== */
function renderHI(){if(histTab==='in')renderHIn();else if(histTab==='out')renderHOut();else renderHAdj();}
function renderHAdj(){
  var el=document.getElementById('hi-adj');
  var recs=Object.values(adjLogs).sort(function(a,b){return b.timestamp-a.timestamp;}).slice(0,50);
  if(!recs.length){el.innerHTML='<div class="empty"><div class="empty-text">'+t('noData')+'</div></div>';return;}
  el.innerHTML='<div class="h-wrap"><table class="h-tbl"><thead><tr>'+
    '<th>날짜·시간</th><th>제품</th><th>변경</th><th>사유</th><th>담당자</th>'+
    '</tr></thead><tbody>'+
    recs.map(function(r){
      var d=new Date(r.timestamp);
      var ds=('0'+(d.getMonth()+1)).slice(-2)+'/'+('0'+d.getDate()).slice(-2)+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
      var diff=r.newQty-r.prevQty;
      var diffCol=diff>=0?'color:var(--success-dark)':'color:var(--danger-dark)';
      var diffStr=(diff>=0?'+':'')+diff+'개';
      return'<tr>'+
        '<td style="font-size:12px">'+ds+'</td>'+
        '<td>'+pName(r.productName||'')+'</td>'+
        '<td style="'+diffCol+';font-weight:700">'+r.prevQty+'→'+r.newQty+' <span style="font-size:11px">('+diffStr+')</span></td>'+
        '<td style="font-size:12px;color:var(--gray-600)">'+(r.note||'-')+'</td>'+
        '<td style="font-size:12px;color:var(--primary);font-weight:700">'+(r.staff||'-')+'</td>'+
      '</tr>';
    }).join('')+
    '</tbody></table></div>';
}
function renderHIn(){
  var el=document.getElementById('hi-in');
  var recs=Object.values(inbound).sort(function(a,b){return b.timestamp-a.timestamp;}).slice(0,50);
  if(!recs.length){el.innerHTML='<div class="empty"><div class="empty-text">'+t('noData')+'</div></div>';return;}
  el.innerHTML='<div class="h-wrap"><table class="h-tbl"><thead><tr>'+
    '<th>'+t('histColDate')+'</th><th>'+t('histColProd')+'</th><th>'+t('histColQty')+'</th><th>'+t('histColNote')+'</th>'+
    '</tr></thead><tbody>'+
    recs.map(function(r){return'<tr><td>'+r.date+'</td><td>'+pName(r.productName||'')+'</td><td>'+(r.quantity||0)+t('invUnit')+'</td><td>'+(r.note||'')+'</td></tr>';}).join('')+
    '</tbody></table></div>';
}
function renderHOut(){
  var el=document.getElementById('hi-out');
  var recs=Object.entries(sales).sort(function(a,b){return b[1].timestamp-a[1].timestamp;}).slice(0,50);
  if(!recs.length){el.innerHTML='<div class="empty"><div class="empty-text">'+t('noData')+'</div></div>';return;}
  el.innerHTML='<div class="h-wrap"><table class="h-tbl"><thead><tr>'+
    '<th>'+t('histColDate')+'</th><th>'+t('histColProd')+'</th><th>'+t('histColChannel')+'</th>'+
    '<th>주문자</th><th>'+t('histColQty')+'</th><th>'+t('histColAmt')+'</th><th>'+t('histColDel')+'</th>'+
    '</tr></thead><tbody>'+
    recs.map(function(e){var r=e[1];var isB=r.channel==='baedalk';var isCancelled=r.cancelled||false;
      var rowStyle=isCancelled?'opacity:.55;background:#FFF5F5;':'';
      var amtStr=isCancelled?'<span style="text-decoration:line-through;color:var(--gray-400)">'+N(r.total||0)+' ₫</span> <span class="ctag ctag-cancel">취소</span>':N(r.total||0)+' ₫';
      if((r.total||0)===0&&r.freeReason){
        amtStr+=' <span style="display:inline-block;background:#E8F5E9;color:var(--success-dark);padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;margin-left:4px">🎁 '+r.freeReason+'</span>';
      }
      return'<tr style="'+rowStyle+'"><td>'+r.date+'</td><td>'+pName(r.productName||'')+'</td>'+
        '<td><span class="ctag '+(isB?'ctag-b':'ctag-s')+'">'+( isB?'BaedalcK':t('rptLabelSeller').slice(0,6))+'</span></td>'+
        '<td style="font-size:12px;color:var(--gray-600)">'+(isB?(r.ordererName||'-'):(r.sellerName||'-'))+'</td>'+
        '<td>'+(r.quantity||0)+t('invUnit')+'</td><td>'+amtStr+'</td><td>'+N(r.deliveryFee||0)+' ₫</td></tr>';
    }).join('')+
    '</tbody></table></div>';
}
