// 입고 등록 + 인보이스 관리

/* ===== 인보이스 장바구니 (한 인보이스에 여러 품목) ===== */
var inboundCart=[];

// 제품 선택 시 등록된 공급단가 자동 입력
function onInboundProdCh(){
  var pid=document.getElementById('ib-prod').value;
  if(pid&&prods[pid]){
    var price=prods[pid].supplyPrice||0;
    document.getElementById('ib-price').value=price||'';
  }
}

function addInboundItem(){
  var pid=document.getElementById('ib-prod').value;
  var qty=parseInt(document.getElementById('ib-qty').value)||0;
  var price=parseInt(document.getElementById('ib-price').value)||0;
  if(!pid){toast(t('eProd'));return;}
  if(!qty){toast(t('eQty'));return;}
  if(!price){toast('공급단가를 입력하세요.');return;}
  var p=prods[pid]||{};
  inboundCart.push({pid:pid,productName:p.name+' '+p.size,qty:qty,price:price});
  document.getElementById('ib-prod').value='';
  document.getElementById('ib-qty').value='';
  document.getElementById('ib-price').value='';
  renderInboundCart();
}

function removeInboundItem(i){
  inboundCart.splice(i,1);
  renderInboundCart();
}

function renderInboundCart(){
  var el=document.getElementById('ib-cart-list');
  var total=inboundCart.reduce(function(s,item){return s+item.qty*item.price;},0);
  if(!inboundCart.length){
    el.innerHTML='';
    document.getElementById('ib-total-box').style.display='none';
    return;
  }
  el.innerHTML=inboundCart.map(function(item,i){
    var tot=item.qty*item.price;
    return'<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--gray-50);border-radius:8px;margin-bottom:6px;border-left:3px solid var(--success-dark)">'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:14px;font-weight:700;margin-bottom:2px">'+item.productName+'</div>'+
        '<div style="font-size:12px;color:var(--gray-500)">'+item.qty+'개 × '+N(item.price)+' ₫ = <strong>'+N(tot)+' ₫</strong></div>'+
      '</div>'+
      '<button onclick="removeInboundItem('+i+')" style="background:transparent;border:none;color:var(--danger);font-size:20px;cursor:pointer;padding:0 0 0 10px;flex-shrink:0">✕</button>'+
    '</div>';
  }).join('');
  document.getElementById('ib-total-box').style.display='block';
  document.getElementById('ib-total-amt').textContent=N(total)+' ₫';
}

/* ===== 인보이스 저장 ===== */
async function saveInbound(){
  var date=document.getElementById('in-date').value;
  var invNo=document.getElementById('in-inv-no').value.trim();
  if(!date){toast(t('eDate'));return;}
  if(!invNo){toast('인보이스 번호를 입력하세요.');return;}
  if(!inboundCart.length){toast('품목을 1개 이상 추가하세요.');return;}

  var totalAmt=inboundCart.reduce(function(s,item){return s+item.qty*item.price;},0);
  var note=document.getElementById('in-note').value;
  var invId=gid();

  var invRec={
    invoiceNo:invNo,
    date:date,
    totalAmount:totalAmt,
    items:inboundCart.map(function(item){return{productId:item.pid,productName:item.productName,quantity:item.qty,unitPrice:item.price,subtotal:item.qty*item.price};}),
    paymentStatus:'unpaid',
    paymentDate:'',
    note:note,
    staff:uName,
    timestamp:Date.now()
  };

  try{
    await fSet('invoices/'+invId,invRec);
    invoices[invId]=invRec;

    for(var i=0;i<inboundCart.length;i++){
      var item=inboundCart[i];
      var rec={
        date:date,
        invoiceId:invId,
        invoiceNo:invNo,
        productId:item.pid,
        productName:item.productName,
        quantity:item.qty,
        unitPrice:item.price,
        subtotal:item.qty*item.price,
        expiry:document.getElementById('in-expiry').value,
        note:note,
        staff:uName,
        timestamp:Date.now()+i
      };
      await fPush('inbound',rec);
      var cur=(stock[item.pid]||{}).quantity||0;
      await fSet('stock/'+item.pid,Object.assign({},stock[item.pid]||{},{quantity:cur+item.qty,lastUpdated:Date.now()}));
      stock[item.pid]=Object.assign({},stock[item.pid]||{},{quantity:cur+item.qty});
    }

    inboundCart=[];
    renderInboundCart();
    document.getElementById('in-inv-no').value='';
    document.getElementById('in-note').value='';
    document.getElementById('in-expiry').value='';

    toast('✅ 입고 완료. 인보이스 '+invNo+' 등록됨.');
    if(document.getElementById('page-home').classList.contains('active'))renderHome();
  }catch(e){toast('저장 실패:'+e.message);}
}

/* ===== 인보이스 송금 상태 토글 ===== */
async function toggleInvoicePayment(invId){
  var inv=invoices[invId];if(!inv)return;
  var newStatus=inv.paymentStatus==='paid'?'unpaid':'paid';
  var newDate=newStatus==='paid'?tday():'';
  try{
    await fPatch('invoices/'+invId,{paymentStatus:newStatus,paymentDate:newDate});
    invoices[invId].paymentStatus=newStatus;
    invoices[invId].paymentDate=newDate;
    renderFinanceInvoice();
    renderHome();
    toast(newStatus==='paid'?'✅ 송금 완료 처리됨':'↩️ 미송금으로 변경됨');
  }catch(e){toast('실패:'+e.message);}
}
