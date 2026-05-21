// 판매 등록, 장바구니, 판매 수정/취소/삭제
var cart=[];

function selCh(ch){
  curCh=ch;
  document.getElementById('ch-baedalk').className='ch-btn'+(ch==='baedalk'?' ab':'');
  document.getElementById('ch-seller').className='ch-btn'+(ch==='seller'?' as':'');
  document.getElementById('seller-grp').style.display=ch==='seller'?'block':'none';
  document.getElementById('del-fee-grp').style.display=ch==='baedalk'?'block':'none';
  document.getElementById('payment-method-grp').style.display=ch==='baedalk'?'block':'none';
  document.getElementById('orderer-grp').style.display=ch==='baedalk'?'block':'none';
  updSS();
}
function onCartProdCh(){
  var pid=document.getElementById('cart-prod').value;
  if(pid&&prods[pid])document.getElementById('cart-price').value=prods[pid].salePrice||'';
}
function addCartItem(){
  var pid=document.getElementById('cart-prod').value;
  var qtyInput=document.getElementById('cart-qty');
  var priceInput=document.getElementById('cart-price');
  var qtyValue=qtyInput.value;
  var qty=parseInt(qtyValue)||0;
  var price=parseInt(priceInput.value)||0;
  console.log('addCartItem - pid:',pid,'qtyValue:',qtyValue,'qty:',qty,'price:',price);
  if(!pid){toast(t('eProd'));return;}
  if(!qty){toast(t('eQty')+' (입력값: '+qtyValue+')');return;}
  cart.push({pid:pid,qty:qty,price:price});
  document.getElementById('cart-prod').value='';
  qtyInput.value='';
  priceInput.value='';
  renderCart();
  updSS();
}
function removeCartItem(i){
  cart.splice(i,1);
  renderCart();
  updSS();
}
function renderCart(){
  var el=document.getElementById('cart-list');
  if(!cart.length){el.innerHTML='';return;}
  el.innerHTML=cart.map(function(item,i){
    var p=prods[item.pid]||{};
    var tot=item.qty*item.price;
    return'<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--gray-50);border-radius:8px;margin-bottom:6px;border-left:3px solid var(--primary)">'+
      '<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:700;margin-bottom:2px">'+pName(p.name+' '+(p.size||''))+'</div>'+
      '<div style="font-size:12px;color:var(--gray-500)">'+item.qty+'개 × '+N(item.price)+' ₫ = <strong>'+N(tot)+' ₫</strong></div></div>'+
      '<button onclick="removeCartItem('+i+')" style="background:transparent;border:none;color:var(--danger);font-size:20px;cursor:pointer;padding:0 0 0 10px;flex-shrink:0">✕</button>'+
      '</div>';
  }).join('');
}
function updSS(){
  var dl=parseInt(document.getElementById('out-del').value)||0;
  var tot=0,hq=0,spr=0;
  cart.forEach(function(item){
    var p=prods[item.pid]||{};
    var su=p.supplyPrice||0;
    var itemTot=item.qty*item.price;
    var itemSup=item.qty*su;
    tot+=itemTot;
    if(curCh==='baedalk'){hq+=itemTot;}
    else{hq+=itemSup;spr+=Math.max(0,itemTot-itemSup);}
  });
  if(tot===0&&cart.length>0){
    var costBearer=document.querySelector('input[name="free-cost-bearer"]:checked');
    if(costBearer&&costBearer.value==='hq'){
      hq=0;
      spr=0;
    }
  }
  var unit=lang==='vi'?' SP':'품목';
  document.getElementById('ss-items').textContent=cart.length+unit;
  document.getElementById('ss-total').textContent=N(tot)+' ₫';
  document.getElementById('ss-del').textContent=N(dl)+' ₫';
  document.getElementById('ss-hq').textContent=N(hq)+' ₫';
  document.getElementById('ss-pr').textContent=N(spr)+' ₫';
  var freeGrp=document.getElementById('free-reason-grp');
  if(freeGrp){
    if(tot===0&&cart.length>0){
      freeGrp.style.display='block';
    }else{
      freeGrp.style.display='none';
      document.getElementById('free-reason-select').value='';
      document.getElementById('free-reason-etc').style.display='none';
    }
  }
}
function handleFreeReasonSelect(){
  var sel=document.getElementById('free-reason-select').value;
  var etc=document.getElementById('free-reason-etc');
  if(sel==='기타'){etc.style.display='block';etc.focus();}else{etc.style.display='none';}
}
async function saveSale(){
  var date=document.getElementById('out-date').value;
  var sid=document.getElementById('out-seller').value;
  var dl=parseInt(document.getElementById('out-del').value)||0;
  var orderer=(document.getElementById('out-orderer').value||'').trim();
  var note=document.getElementById('out-note').value;
  if(!date){toast(t('eDate'));return;}
  if(!cart.length){toast(t('eCart'));return;}
  if(curCh==='seller'&&!sid){toast(t('eSL'));return;}
  for(var i=0;i<cart.length;i++){
    var item=cart[i];
    var cur=(stock[item.pid]||{}).quantity||0;
    var p=prods[item.pid]||{};
    if(item.qty>cur&&!confirm((p.name||'')+' '+t('overSt')))return;
  }
  var groupId=gid();
  var sellerObj=curCh==='seller'?(sellers[sid]||{}):{};
  var totalAmt=cart.reduce(function(sum,item){return sum+(item.qty*item.price);},0);
  var payMethodEl=document.querySelector('input[name="payment-method"]:checked');
  var payMethod=curCh==='baedalk'?(payMethodEl?payMethodEl.value:'bank'):'';
  var freeReason='';
  var freeCostBearer='';
  if(totalAmt===0){
    var reasonSel=document.getElementById('free-reason-select').value;
    if(!reasonSel){toast('판매금액이 0원입니다. 무상 제공 사유를 선택하세요.');return;}
    var costBearer=document.querySelector('input[name="free-cost-bearer"]:checked');
    if(!costBearer){toast('비용 부담 주체를 선택하세요.');return;}
    freeCostBearer=costBearer.value;
    if(reasonSel==='기타'){
      var reasonEtc=document.getElementById('free-reason-etc').value.trim();
      if(!reasonEtc){toast('무상 제공 사유를 입력하세요.');return;}
      freeReason='기타: '+reasonEtc;
    }else{freeReason=reasonSel;}
  }
  try{
    for(var i=0;i<cart.length;i++){
      var item=cart[i];
      var p=prods[item.pid];
      var su=p.supplyPrice||0;
      if(su===0&&curCh==='seller'&&i===0&&!confirm(t('zeroSupplyConfirm')))return;
      var tot=item.qty*item.price;
      var sup=item.qty*su;
      if(tot===0&&freeCostBearer==='hq'){sup=0;}
      var hq=curCh==='baedalk'?tot:sup;
      var spr=curCh==='baedalk'?0:Math.max(0,tot-sup);
      var itemDel=i===0?dl:0;
      var rec={date:date,productId:item.pid,productName:p.name+' '+p.size,
        quantity:item.qty,salePrice:item.price,supplyPrice:su,supplyTotal:sup,
        total:tot,deliveryFee:itemDel,hqAmount:hq,sellerProfit:spr,
        channel:curCh,sellerId:curCh==='seller'?sid:'',
        sellerName:curCh==='seller'?(sellerObj.name||''):'',
        ordererName:orderer,groupId:groupId,
        paymentMethod:payMethod,
        deliveryPaid:false,paymentConfirmed:false,
        freeReason:freeReason||'',
        freeCostBearer:freeCostBearer||'',
        staff:uName,note:note,timestamp:Date.now()+i};
      var nid=await fPush('sales',rec);sales[nid]=rec;
      var cur=(stock[item.pid]||{}).quantity||0;
      await fSet('stock/'+item.pid,Object.assign({},stock[item.pid]||{},{quantity:Math.max(0,cur-item.qty),lastUpdated:Date.now()}));
      stock[item.pid]=Object.assign({},stock[item.pid]||{},{quantity:Math.max(0,cur-item.qty)});
    }
    toast(t('saleOk'));
    cart=[];renderCart();
    document.getElementById('out-del').value='';
    document.getElementById('out-note').value='';
    document.getElementById('out-orderer').value='';
    document.getElementById('free-reason-select').value='';
    document.getElementById('free-reason-etc').value='';
    document.getElementById('free-reason-etc').style.display='none';
    document.getElementById('free-cost-hq').checked=true;
    document.getElementById('regular-badge').style.display='none';
    updSS();
    if(document.getElementById('page-home').classList.contains('active'))renderHome();
  }catch(e){toast('저장 실패:'+e.message);}
}

/* ===== 판매 수정 ===== */
function openEdit(sid){
  var r=sales[sid];if(!r){toast('내역 없음');return;}
  document.getElementById('cancel-reason').value='';
  document.getElementById('cancel-reason-etc').value='';
  document.getElementById('cancel-reason-etc-grp').style.display='none';
  var sel=document.getElementById('cancel-reason');
  sel.onchange=function(){document.getElementById('cancel-reason-etc-grp').style.display=this.value==='기타'?'block':'none';};
  var p=prods[r.productId]||{};var su=r.supplyPrice||p.supplyPrice||0;
  var supT=su*(r.quantity||0);var saleT=r.total||((r.salePrice||0)*(r.quantity||0));
  document.querySelectorAll('#edit-id').forEach(function(el){el.value=sid;});
  document.querySelectorAll('#edit-ch').forEach(function(el){el.value=r.channel||'baedalk';});
  document.querySelectorAll('#edit-sup').forEach(function(el){el.value=supT;});
  document.getElementById('edit-amt').value=saleT;
  document.getElementById('edit-del').value=r.deliveryFee||0;
  var freeReason=r.freeReason||'';
  var freeCostBearer=r.freeCostBearer||'hq';
  if(freeReason){
    if(freeReason.startsWith('기타: ')){
      document.getElementById('edit-free-reason-select').value='기타';
      document.getElementById('edit-free-reason-etc').value=freeReason.substring(4);
      document.getElementById('edit-free-reason-etc').style.display='block';
    }else{
      document.getElementById('edit-free-reason-select').value=freeReason;
      document.getElementById('edit-free-reason-etc').style.display='none';
    }
    if(freeCostBearer==='hq'){document.getElementById('edit-free-cost-hq').checked=true;}
    else{document.getElementById('edit-free-cost-seller').checked=true;}
  }else{
    document.getElementById('edit-free-reason-select').value='';
    document.getElementById('edit-free-reason-etc').value='';
    document.getElementById('edit-free-reason-etc').style.display='none';
    document.getElementById('edit-free-cost-hq').checked=true;
  }
  var ordInfo=r.ordererName?' | 주문자: '+r.ordererName:'';
  document.getElementById('edit-info').innerHTML=
    '<strong>'+r.date+'</strong> | '+(r.productName||'')+' | 수량: '+(r.quantity||0)+'개'+ordInfo+
    '<br>채널: '+(r.channel==='baedalk'?'🛵 배달K':'🧑‍💼 개인판매자')+(r.sellerName?' | '+r.sellerName:'');
  var isCancelled=r.cancelled||false;
  var banner=document.getElementById('edit-cancelled-banner');
  var activeFields=document.getElementById('edit-active-fields');
  var restoreFields=document.getElementById('edit-restore-fields');
  if(isCancelled){
    banner.style.display='block';
    document.getElementById('edit-cancelled-reason').textContent='사유: '+(r.cancelReason||'-')+' | 취소일: '+(r.cancelledAt||'-');
    activeFields.style.display='none';
    restoreFields.style.display='block';
  }else{
    banner.style.display='none';
    activeFields.style.display='block';
    restoreFields.style.display='none';
  }
  updEditSS();
  document.getElementById('modal-edit').classList.add('open');
}
function updEditSS(){
  var amt=parseInt(document.getElementById('edit-amt').value)||0;
  var del=parseInt(document.getElementById('edit-del').value)||0;
  var ch=document.getElementById('edit-ch').value;
  var sup=parseInt(document.getElementById('edit-sup').value)||0;
  var isB=ch==='baedalk';
  if(amt===0){
    var costBearer=document.querySelector('input[name="edit-free-cost-bearer"]:checked');
    if(costBearer&&costBearer.value==='hq'){sup=0;}
  }
  document.getElementById('ess-tot').textContent=N(amt)+' ₫';
  document.getElementById('ess-del').textContent=N(del)+' ₫';
  document.getElementById('ess-hq').textContent=N(isB?amt:sup)+' ₫';
  document.getElementById('ess-pr').textContent=N(isB?0:Math.max(0,amt-sup))+' ₫';
  var freeGrp=document.getElementById('edit-free-reason-grp');
  if(freeGrp){freeGrp.style.display=amt===0?'block':'none';}
}
function handleEditFreeReasonSelect(){
  var sel=document.getElementById('edit-free-reason-select').value;
  var etc=document.getElementById('edit-free-reason-etc');
  if(sel==='기타'){etc.style.display='block';etc.focus();}else{etc.style.display='none';}
}
async function saveEditSale(){
  var sid=document.getElementById('edit-id').value;
  var amt=parseInt(document.getElementById('edit-amt').value)||0;
  var del=parseInt(document.getElementById('edit-del').value)||0;
  var ch=document.getElementById('edit-ch').value;
  var sup=parseInt(document.getElementById('edit-sup').value)||0;
  var freeReason='';
  var freeCostBearer='';
  if(amt===0){
    var reasonSel=document.getElementById('edit-free-reason-select').value;
    if(!reasonSel){toast('판매금액이 0원입니다. 무상 제공 사유를 선택하세요.');return;}
    var costBearer=document.querySelector('input[name="edit-free-cost-bearer"]:checked');
    if(!costBearer){toast('비용 부담 주체를 선택하세요.');return;}
    freeCostBearer=costBearer.value;
    if(freeCostBearer==='hq'){sup=0;}
    if(reasonSel==='기타'){
      var reasonEtc=document.getElementById('edit-free-reason-etc').value.trim();
      if(!reasonEtc){toast('무상 제공 사유를 입력하세요.');return;}
      freeReason='기타: '+reasonEtc;
    }else{freeReason=reasonSel;}
  }
  var isB=ch==='baedalk';var hq=isB?amt:sup;var spr=isB?0:Math.max(0,amt-sup);
  var r=sales[sid];if(!r)return;
  var nsp=Math.round(amt/(r.quantity||1));
  try{
    var upd={total:amt,salePrice:nsp,deliveryFee:del,hqAmount:hq,sellerProfit:spr,supplyTotal:sup,freeReason:freeReason,freeCostBearer:freeCostBearer};
    await fPatch('sales/'+sid,upd);Object.assign(sales[sid],upd);
    toast(t('saved'));closeMod('modal-edit');renderST();renderHome();
  }catch(e){toast('저장 실패:'+e.message);}
}
function getCancelReason(){
  var sel=document.getElementById('cancel-reason').value;
  if(!sel)return null;
  return sel==='기타'?(document.getElementById('cancel-reason-etc').value.trim()||'기타'):sel;
}
async function cancelSale(){
  var sid=document.getElementById('edit-id').value;
  var r=sales[sid];if(!r)return;
  var reason=getCancelReason();
  if(!reason){toast('취소 사유를 선택해주세요');return;}
  if(!confirm('이 판매 건을 취소하겠습니까?\n재고 '+(r.quantity||0)+'개가 복원됩니다.\n\n사유: '+reason))return;
  try{
    var pid=r.productId;
    var curQty=(stock[pid]||{}).quantity||0;
    var newQty=curQty+(r.quantity||0);
    await fSet('stock/'+pid,Object.assign({},stock[pid]||{},{quantity:newQty,lastUpdated:Date.now()}));
    stock[pid]=Object.assign({},stock[pid]||{},{quantity:newQty});
    var upd={cancelled:true,cancelReason:reason,cancelledAt:tday(),cancelledBy:uName};
    await fPatch('sales/'+sid,upd);Object.assign(sales[sid],upd);
    toast('🚫 주문이 취소되었습니다. 재고 복원 완료.');
    closeMod('modal-edit');renderST();renderHome();
  }catch(e){toast('취소 실패: '+e.message);}
}
async function deleteSale(){
  var sid=document.getElementById('edit-id').value;
  var r=sales[sid];if(!r)return;
  var alreadyCancelled=r.cancelled||false;
  var confirmMsg=alreadyCancelled
    ?'이미 취소된 건입니다. 데이터를 완전히 삭제하겠습니까?\n(복구 불가)'
    :'이 판매 건을 완전히 삭제하겠습니까?\n재고 '+(r.quantity||0)+'개가 복원됩니다.\n\n⚠️ 삭제 후 복구할 수 없습니다.';
  if(!confirm(confirmMsg))return;
  if(!confirm('정말 삭제하겠습니까? 마지막으로 확인합니다.'))return;
  try{
    if(!alreadyCancelled){
      var pid=r.productId;
      var curQty=(stock[pid]||{}).quantity||0;
      var newQty=curQty+(r.quantity||0);
      await fSet('stock/'+pid,Object.assign({},stock[pid]||{},{quantity:newQty,lastUpdated:Date.now()}));
      stock[pid]=Object.assign({},stock[pid]||{},{quantity:newQty});
    }
    await fDel('sales/'+sid);
    delete sales[sid];
    toast('🗑 판매 내역이 삭제되었습니다.');
    closeMod('modal-edit');renderST();renderHome();
  }catch(e){toast('삭제 실패: '+e.message);}
}
async function restoreSale(){
  var sid=document.getElementById('edit-id').value;
  var r=sales[sid];if(!r)return;
  if(!confirm('취소된 판매건을 복원하겠습니까?\n재고 '+(r.quantity||0)+'개가 다시 차감됩니다.'))return;
  try{
    var pid=r.productId;
    var curQty=(stock[pid]||{}).quantity||0;
    var newQty=Math.max(0,curQty-(r.quantity||0));
    await fSet('stock/'+pid,Object.assign({},stock[pid]||{},{quantity:newQty,lastUpdated:Date.now()}));
    stock[pid]=Object.assign({},stock[pid]||{},{quantity:newQty});
    var upd={cancelled:false,cancelReason:'',cancelledAt:'',cancelledBy:''};
    await fPatch('sales/'+sid,upd);Object.assign(sales[sid],upd);
    toast('↩️ 판매 건이 복원되었습니다.');
    closeMod('modal-edit');renderST();renderHome();
  }catch(e){toast('복원 실패: '+e.message);}
}
