// 입출금 관리 모듈 (인보이스, 배달K 주간정산, 개인판매 정산, 내역, 수익현황)
var finTab='invoice';

function setFinTab(tab){
  finTab=tab;
  var tabs=['invoice','baedalk','seller','history','profit'];
  document.querySelectorAll('#page-finance .sub-tab').forEach(function(el,i){
    el.classList.toggle('active',tabs[i]===tab);
  });
  tabs.forEach(function(x){
    var el=document.getElementById('fin-'+x);
    if(el)el.style.display=x===tab?'block':'none';
  });
  if(tab==='invoice')renderFinanceInvoice();
  else if(tab==='baedalk')renderFinanceBaedalk();
  else if(tab==='seller')renderFinanceSeller();
  else if(tab==='history')renderFinanceHistory();
  else if(tab==='profit')renderFinanceProfit();
}

/* ===== 인보이스 탭 ===== */
function renderFinanceInvoice(){
  var el=document.getElementById('fin-invoice');
  var list=Object.entries(invoices).sort(function(a,b){return b[1].timestamp-a[1].timestamp;});

  // 미송금 합계
  var unpaidTotal=list.filter(function(e){return e[1].paymentStatus==='unpaid';})
    .reduce(function(s,e){return s+(e[1].totalAmount||0);},0);
  var unpaidCount=list.filter(function(e){return e[1].paymentStatus==='unpaid';}).length;

  if(!list.length){
    el.innerHTML='<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">등록된 인보이스가 없습니다.</div></div>';
    return;
  }

  var h='';

  // 미송금 요약 배너
  if(unpaidCount>0){
    h+='<div style="background:#FFF3E0;border-left:4px solid var(--warn);border-radius:var(--radius-sm);padding:14px 16px;margin-bottom:12px">'+
      '<div style="font-size:13px;font-weight:700;color:var(--warn-dark);margin-bottom:4px">⚠️ 미송금 인보이스 '+unpaidCount+'건</div>'+
      '<div style="font-size:20px;font-weight:800;color:var(--warn-dark)">'+N(unpaidTotal)+' ₫</div>'+
      '<div style="font-size:12px;color:var(--gray-500);margin-top:2px">2일 이내 본사 송금 필요</div>'+
    '</div>';
  }

  list.forEach(function(e){
    var id=e[0],inv=e[1];
    var isPaid=inv.paymentStatus==='paid';
    h+='<div class="s-sec" style="border-left:4px solid '+(isPaid?'var(--success-dark)':'var(--warn)')+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'+
        '<div>'+
          '<div style="font-size:15px;font-weight:800;color:var(--gray-900)">📋 '+inv.invoiceNo+'</div>'+
          '<div style="font-size:12px;color:var(--gray-500);margin-top:2px">'+inv.date+'</div>'+
        '</div>'+
        '<button class="cfm-btn '+(isPaid?'done':'pend')+'" onclick="toggleInvoicePayment(\''+id+'\')">'+
          (isPaid?'✅ 송금완료':'⏳ 미송금')+
        '</button>'+
      '</div>'+
      // 품목 목록
      (inv.items||[]).map(function(item){
        return'<div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid var(--gray-100)">'+
          '<span style="color:var(--gray-600)">'+item.productName+' × '+item.quantity+'개</span>'+
          '<span style="font-weight:700">'+N(item.subtotal)+' ₫</span>'+
        '</div>';
      }).join('')+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:2px solid var(--gray-200)">'+
        '<span style="font-size:13px;font-weight:700;color:var(--gray-600)">인보이스 합계</span>'+
        '<span style="font-size:18px;font-weight:800;color:var(--primary)">'+N(inv.totalAmount)+' ₫</span>'+
      '</div>'+
      (isPaid?'<div style="font-size:12px;color:var(--success-dark);margin-top:6px">✅ 송금일: '+inv.paymentDate+'</div>':'')+
    '</div>';
  });
  el.innerHTML=h;
}

/* ===== 배달K 주간정산 탭 ===== */
function renderFinanceBaedalk(){
  var el=document.getElementById('fin-baedalk');

  // 현재 주 범위 계산
  var tod=new Date();tod.setDate(tod.getDate()+wOff*7);
  var mon=new Date(tod);mon.setDate(tod.getDate()-tod.getDay()+1);
  var sun=new Date(mon);sun.setDate(mon.getDate()+6);
  function fm(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
  var weekStart=fm(mon),weekEnd=fm(sun);
  var weekLabel=weekStart+' ~ '+weekEnd;

  // 해당 주 배달K 판매 집계
  var weekRecs=Object.values(sales).filter(function(r){
    return r.channel==='baedalk'&&!r.cancelled&&r.date>=weekStart&&r.date<=weekEnd;
  });
  var salesTotal=weekRecs.reduce(function(s,r){return s+(r.total||0);},0);
  var deliveryTotal=weekRecs.reduce(function(s,r){return s+(r.deliveryFee||0);},0);
  var wholesaleTotal=weekRecs.reduce(function(s,r){
    var p=prods[r.productId]||{};
    var su=r.supplyPrice||p.supplyPrice||0;
    return s+(r.supplyTotal!==undefined?r.supplyTotal:su*(r.quantity||0));
  },0);
  var hqProfit=salesTotal-wholesaleTotal-deliveryTotal; // 본사 수익
  var resendTotal=hqProfit; // 나→본사 재송금액

  // 해당 주 정산 레코드 확인
  var weekKey=weekStart;
  var existingSettlement=Object.entries(settlements).find(function(e){
    return e[1].weekStart===weekStart&&e[1].type==='baedalk';
  });

  var h=dn(weekLabel,'wOff--;renderFinanceBaedalk()','wOff++;renderFinanceBaedalk()');

  h+='<div class="s-sec">'+
    '<div style="font-size:14px;font-weight:700;color:var(--gray-600);margin-bottom:12px">📊 주간 배달K 집계</div>'+
    '<div class="s-row"><span class="s-lbl">배달K 판매금액 합계</span><span class="s-val">'+N(salesTotal)+' ₫</span></div>'+
    '<div class="s-row"><span class="s-lbl">배달비 합계</span><span class="s-val" style="color:var(--warn-dark)">− '+N(deliveryTotal)+' ₫</span></div>'+
    '<div class="s-row"><span class="s-lbl">도매가 합계</span><span class="s-val" style="color:var(--warn-dark)">− '+N(wholesaleTotal)+' ₫</span></div>'+
    '<div class="s-total"><span class="st-lbl">본사 재송금액</span><span class="st-val">'+N(resendTotal)+' ₫</span></div>'+
  '</div>';

  if(!weekRecs.length){
    h+='<div class="empty"><div class="empty-icon">🛵</div><div class="empty-text">이 주에 배달K 판매 내역이 없습니다.</div></div>';
    el.innerHTML=h;return;
  }

  // 본사 → 나 수령 입력 또는 확인
  if(existingSettlement){
    var st=existingSettlement[1];
    var stId=existingSettlement[0];
    var isResent=st.resendStatus==='done';
    h+='<div class="s-sec">'+
      '<div style="font-size:14px;font-weight:700;color:var(--gray-600);margin-bottom:12px">💸 정산 처리 현황</div>'+
      '<div class="s-row"><span class="s-lbl">본사 수령액</span><span class="s-val" style="color:var(--success-dark)">'+N(st.receivedAmount)+' ₫</span></div>'+
      '<div class="s-row"><span class="s-lbl">수령일</span><span class="s-val">'+st.receivedDate+'</span></div>'+
      '<div class="s-row"><span class="s-lbl">재송금액</span><span class="s-val">'+N(st.resendAmount)+' ₫</span></div>'+
      '<div style="margin-top:10px;display:flex;gap:8px;align-items:center">'+
        '<button class="cfm-btn '+(isResent?'done':'pend')+'" onclick="toggleBaedalkResend(\''+stId+'\')">'+
          (isResent?'✅ 재송금 완료':'⏳ 재송금 대기')+
        '</button>'+
        (isResent?'<span style="font-size:12px;color:var(--success-dark)">'+st.resendDate+'</span>':'')+
      '</div>'+
    '</div>';
  }else{
    // 수령 미등록 상태 — 입력 폼
    h+='<div class="s-sec">'+
      '<div style="font-size:14px;font-weight:700;color:var(--gray-600);margin-bottom:12px">💸 본사 수령액 등록</div>'+
      '<div class="form-group">'+
        '<label class="form-label">수령일</label>'+
        '<input type="date" class="form-control" id="bdlk-recv-date" value="'+tday()+'">'+
      '</div>'+
      '<div class="form-group">'+
        '<label class="form-label">본사로부터 수령한 금액 (VND)</label>'+
        '<input type="number" class="form-control" id="bdlk-recv-amt" placeholder="0" value="'+salesTotal+'">'+
        '<div class="form-hint">배달K 판매금액 + 배달비 합계가 자동 입력됩니다. 실제 수령액으로 수정하세요.</div>'+
      '</div>'+
      '<button class="btn btn-primary" onclick="saveBaedalkSettlement(\''+weekStart+'\',\''+weekEnd+'\','+salesTotal+','+deliveryTotal+','+wholesaleTotal+','+resendTotal+')">💾 수령 등록 및 재송금액 확정</button>'+
    '</div>';
  }

  el.innerHTML=h;
}

async function saveBaedalkSettlement(weekStart,weekEnd,salesTotal,deliveryTotal,wholesaleTotal,resendTotal){
  var recvDate=document.getElementById('bdlk-recv-date').value;
  var recvAmt=parseInt(document.getElementById('bdlk-recv-amt').value)||0;
  if(!recvDate){toast('수령일을 입력하세요.');return;}
  if(!recvAmt){toast('수령 금액을 입력하세요.');return;}
  var rec={
    type:'baedalk',
    weekStart:weekStart,weekEnd:weekEnd,
    salesTotal:salesTotal,
    deliveryTotal:deliveryTotal,
    wholesaleTotal:wholesaleTotal,
    receivedAmount:recvAmt,
    receivedDate:recvDate,
    resendAmount:resendTotal,
    resendStatus:'pending', // pending / done
    resendDate:'',
    staff:uName,
    timestamp:Date.now()
  };
  try{
    var id=await fPush('settlements',rec);
    settlements[id]=rec;
    toast('✅ 수령 등록 완료. 재송금 후 완료 처리해주세요.');
    renderFinanceBaedalk();
    renderHome();
  }catch(e){toast('실패:'+e.message);}
}

async function toggleBaedalkResend(stId){
  var st=settlements[stId];if(!st)return;
  var newStatus=st.resendStatus==='done'?'pending':'done';
  var newDate=newStatus==='done'?tday():'';
  try{
    await fPatch('settlements/'+stId,{resendStatus:newStatus,resendDate:newDate});
    settlements[stId].resendStatus=newStatus;
    settlements[stId].resendDate=newDate;
    toast(newStatus==='done'?'✅ 재송금 완료 처리됨':'↩️ 재송금 대기로 변경됨');
    renderFinanceBaedalk();
    renderHome();
  }catch(e){toast('실패:'+e.message);}
}

/* ===== 개인판매자 정산 탭 ===== */
function renderFinanceSeller(){
  var el=document.getElementById('fin-seller');
  var mm=('0'+mM).slice(-2);var pfx=mY+'-'+mm;
  var nav=dn(mY+'년 '+(TT[lang]||TT.ko).mn[mM-1],'shM(-1);renderFinanceSeller()','shM(1);renderFinanceSeller()');

  var mRecs=Object.entries(sales).filter(function(e){
    var r=e[1];return(r.date||'').startsWith(pfx)&&r.channel==='seller'&&!r.cancelled;
  }).map(function(e){return Object.assign({_id:e[0]},e[1]);});

  if(!mRecs.length){
    el.innerHTML=nav+'<div class="empty"><div class="empty-icon">🧑‍💼</div><div class="empty-text">이 달 개인판매 내역이 없습니다.</div></div>';
    return;
  }

  // 판매자별 그룹핑
  var bySL={};
  mRecs.forEach(function(r){
    var vid=r.sellerId||'?';
    if(!bySL[vid])bySL[vid]=[];
    bySL[vid].push(r);
  });

  var h=nav;
  var myTotalProfit=0;

  Object.entries(bySL).forEach(function(e){
    var vid=e[0],recs=e[1];
    var sObj=sellers[vid]||{};
    var sname=sObj.name||vid;
    var rate=sObj.profitRate!==undefined?sObj.profitRate:50; // 판매자 수익 비율
    var myRate=100-rate; // 내 수익 비율

    var totalSale=recs.reduce(function(s,r){return s+(r.total||0);},0);
    var sellerProfit=Math.round(totalSale*rate/100);
    var myProfit=Math.round(totalSale*myRate/100);
    myTotalProfit+=myProfit;

    // 이미 배분 완료된 건 확인
    var paidRecs=recs.filter(function(r){return r.sellerProfitPaid;});
    var unpaidRecs=recs.filter(function(r){return!r.sellerProfitPaid;});
    var unpaidAmt=unpaidRecs.reduce(function(s,r){return s+Math.round((r.total||0)*rate/100);},0);

    h+='<div class="s-sec" style="border-left:4px solid var(--purple)">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'+
        '<div>'+
          '<div style="font-size:15px;font-weight:800">🧑‍💼 '+sname+'</div>'+
          '<div style="font-size:12px;color:var(--purple);margin-top:2px">수익배분 — 판매자 '+rate+'% : 나 '+myRate+'%</div>'+
        '</div>'+
        (unpaidAmt>0?'<span style="font-size:12px;font-weight:700;color:var(--warn-dark)">미지급 '+N(unpaidAmt)+' ₫</span>':
        '<span style="font-size:12px;font-weight:700;color:var(--success-dark)">✅ 정산완료</span>')+
      '</div>'+
      '<div class="s-row"><span class="s-lbl">총 판매금액</span><span class="s-val">'+N(totalSale)+' ₫</span></div>'+
      '<div class="s-row"><span class="s-lbl">판매자 수익 ('+rate+'%)</span><span class="s-val" style="color:var(--purple)">'+N(sellerProfit)+' ₫</span></div>'+
      '<div class="s-row"><span class="s-lbl">내 수익 ('+myRate+'%)</span><span class="s-val" style="color:var(--success-dark)">'+N(myProfit)+' ₫</span></div>'+
      // 건별 목록
      '<div style="margin-top:10px;border-top:1px solid var(--gray-100);padding-top:8px">'+
      recs.map(function(r){
        var rSale=r.total||0;
        var rSellerP=Math.round(rSale*rate/100);
        var isPaid=r.sellerProfitPaid||false;
        return'<div class="pay-row">'+
          '<div class="pay-info">'+
            '<div class="pay-name">'+r.date+' · '+pName(r.productName||'')+'</div>'+
            '<div class="pay-amt">판매 '+N(rSale)+' ₫ → 판매자 '+N(rSellerP)+' ₫</div>'+
          '</div>'+
          '<button class="cfm-btn '+(isPaid?'done':'pend')+'" onclick="toggleSellerProfitPaid(\''+r._id+'\','+(!isPaid)+')">'+
            (isPaid?'✅ 지급완료':'⏳ 미지급')+
          '</button>'+
        '</div>';
      }).join('')+
      '</div>'+
    '</div>';
  });

  // 내 총 수익 합계
  h+='<div class="s-total"><span class="st-lbl">이번달 내 순수익 합계</span><span class="st-val">'+N(myTotalProfit)+' ₫</span></div>';
  el.innerHTML=h;
}

async function toggleSellerProfitPaid(saleId,v){
  try{
    await fPatch('sales/'+saleId,{sellerProfitPaid:v});
    sales[saleId].sellerProfitPaid=v;
    toast(v?'✅ 지급 완료':'↩️ 미지급으로 변경');
    renderFinanceSeller();
    renderHome();
  }catch(e){toast('실패:'+e.message);}
}

/* ===== 입출금 내역 탭 ===== */
function renderFinanceHistory(){
  var el=document.getElementById('fin-history');
  var mm=('0'+mM).slice(-2);var pfx=mY+'-'+mm;
  var nav=dn(mY+'년 '+(TT[lang]||TT.ko).mn[mM-1],'shM(-1);renderFinanceHistory()','shM(1);renderFinanceHistory()');

  var rows=[];

  // 인보이스 송금 내역
  Object.values(invoices).filter(function(inv){return(inv.date||'').startsWith(pfx);}).forEach(function(inv){
    rows.push({
      date:inv.date,
      type:'invoice',
      label:'📋 인보이스 송금 ('+inv.invoiceNo+')',
      direction:'out',
      amount:inv.totalAmount,
      status:inv.paymentStatus==='paid'?'✅ 송금완료':'⏳ 미송금',
      statusColor:inv.paymentStatus==='paid'?'var(--success-dark)':'var(--warn-dark)'
    });
  });

  // 배달K 주간 수령/재송금 내역
  Object.values(settlements).filter(function(st){return st.type==='baedalk'&&(st.weekStart||'').startsWith(pfx.slice(0,7));}).forEach(function(st){
    rows.push({
      date:st.receivedDate||st.weekStart,
      type:'baedalk-recv',
      label:'🛵 배달K 주간 수령 ('+st.weekStart+'~'+st.weekEnd.slice(5)+')',
      direction:'in',
      amount:st.receivedAmount,
      status:'✅ 수령완료',
      statusColor:'var(--success-dark)'
    });
    rows.push({
      date:st.resendDate||st.weekStart,
      type:'baedalk-resend',
      label:'🛵 배달K 재송금 → 본사',
      direction:'out',
      amount:st.resendAmount,
      status:st.resendStatus==='done'?'✅ 송금완료':'⏳ 미송금',
      statusColor:st.resendStatus==='done'?'var(--success-dark)':'var(--warn-dark)'
    });
  });

  // 개인판매자 수익 배분 내역
  Object.entries(sales).filter(function(e){
    var r=e[1];return(r.date||'').startsWith(pfx)&&r.channel==='seller'&&!r.cancelled;
  }).forEach(function(e){
    var r=e[1];
    var sObj=sellers[r.sellerId||'']||{};
    var rate=sObj.profitRate!==undefined?sObj.profitRate:50;
    var sellerP=Math.round((r.total||0)*rate/100);
    rows.push({
      date:r.date,
      type:'seller-profit',
      label:'🧑‍💼 판매자 수익 지급 ('+( r.sellerName||'')+')',
      direction:'out',
      amount:sellerP,
      status:r.sellerProfitPaid?'✅ 지급완료':'⏳ 미지급',
      statusColor:r.sellerProfitPaid?'var(--success-dark)':'var(--warn-dark)'
    });
  });

  rows.sort(function(a,b){return b.date.localeCompare(a.date);});

  if(!rows.length){
    el.innerHTML=nav+'<div class="empty"><div class="empty-icon">📒</div><div class="empty-text">이 달 입출금 내역이 없습니다.</div></div>';
    return;
  }

  var h=nav+'<div class="s-sec">';
  rows.forEach(function(row){
    var isIn=row.direction==='in';
    h+='<div class="pay-row">'+
      '<div class="pay-info">'+
        '<div class="pay-name">'+row.label+'</div>'+
        '<div class="pay-amt">'+row.date+'</div>'+
      '</div>'+
      '<div style="text-align:right">'+
        '<div style="font-size:15px;font-weight:800;color:'+(isIn?'var(--success-dark)':'var(--danger-dark)')+'">'+
          (isIn?'+ ':' − ')+N(row.amount)+' ₫'+
        '</div>'+
        '<div style="font-size:11px;font-weight:700;color:'+row.statusColor+'">'+row.status+'</div>'+
      '</div>'+
    '</div>';
  });
  h+='</div>';
  el.innerHTML=h;
}

/* ===== 수익 현황 탭 ===== */
function renderFinanceProfit(){
  var el=document.getElementById('fin-profit');
  var mm=('0'+mM).slice(-2);var pfx=mY+'-'+mm;
  var nav=dn(mY+'년 '+(TT[lang]||TT.ko).mn[mM-1],'shM(-1);renderFinanceProfit()','shM(1);renderFinanceProfit()');

  // 개인판매자 채널 수익만 집계
  var sellerRecs=Object.entries(sales).filter(function(e){
    var r=e[1];return(r.date||'').startsWith(pfx)&&r.channel==='seller'&&!r.cancelled;
  }).map(function(e){return e[1];});

  var totalSale=sellerRecs.reduce(function(s,r){return s+(r.total||0);},0);
  var myProfit=sellerRecs.reduce(function(s,r){
    var sObj=sellers[r.sellerId||'']||{};
    var rate=sObj.profitRate!==undefined?sObj.profitRate:50;
    return s+Math.round((r.total||0)*(100-rate)/100);
  },0);
  var sellerPayout=totalSale-myProfit;

  // 판매자별 수익 분해
  var bySL={};
  sellerRecs.forEach(function(r){
    var vid=r.sellerId||'?';
    if(!bySL[vid]){
      var sObj=sellers[vid]||{};
      bySL[vid]={name:sObj.name||vid,rate:sObj.profitRate!==undefined?sObj.profitRate:50,total:0,myProfit:0,sellerP:0};
    }
    var rate=bySL[vid].rate;
    bySL[vid].total+=(r.total||0);
    bySL[vid].sellerP+=Math.round((r.total||0)*rate/100);
    bySL[vid].myProfit+=Math.round((r.total||0)*(100-rate)/100);
  });

  var h=nav;

  // 월간 수익 요약 카드
  h+='<div style="background:linear-gradient(135deg,var(--success-dark),#1B5E20);border-radius:var(--radius);padding:20px;margin-bottom:12px;color:#fff">'+
    '<div style="font-size:13px;font-weight:700;opacity:.85;margin-bottom:6px">'+mY+'년 '+mm+'월 내 순수익</div>'+
    '<div style="font-size:32px;font-weight:800;margin-bottom:8px">'+N(myProfit)+' ₫</div>'+
    '<div style="font-size:12px;opacity:.8">개인판매 총액 '+N(totalSale)+' ₫ 중 내 몫</div>'+
  '</div>';

  if(!sellerRecs.length){
    h+='<div class="empty"><div class="empty-icon">💰</div><div class="empty-text">이 달 개인판매 내역이 없습니다.</div></div>';
    el.innerHTML=h;return;
  }

  h+='<div class="s-sec">'+
    '<div style="font-size:14px;font-weight:700;color:var(--gray-600);margin-bottom:10px">수익 구조</div>'+
    '<div class="s-row"><span class="s-lbl">개인판매 총액</span><span class="s-val">'+N(totalSale)+' ₫</span></div>'+
    '<div class="s-row"><span class="s-lbl">판매자 지급액 합계</span><span class="s-val" style="color:var(--purple)">− '+N(sellerPayout)+' ₫</span></div>'+
    '<div class="s-total"><span class="st-lbl">내 순수익</span><span class="st-val">'+N(myProfit)+' ₫</span></div>'+
  '</div>';

  // 판매자별 수익 분해
  h+='<div class="s-sec"><div style="font-size:14px;font-weight:700;color:var(--gray-600);margin-bottom:10px">판매자별 내역</div>';
  Object.values(bySL).forEach(function(sv){
    h+='<div style="padding:10px 0;border-bottom:1px solid var(--gray-100)">'+
      '<div style="display:flex;justify-content:space-between;align-items:center">'+
        '<div>'+
          '<div style="font-size:14px;font-weight:700">🧑‍💼 '+sv.name+'</div>'+
          '<div style="font-size:12px;color:var(--gray-500);margin-top:2px">판매자 '+sv.rate+'% · 나 '+(100-sv.rate)+'%</div>'+
        '</div>'+
        '<div style="text-align:right">'+
          '<div style="font-size:15px;font-weight:800;color:var(--success-dark)">+'+N(sv.myProfit)+' ₫</div>'+
          '<div style="font-size:11px;color:var(--gray-400)">총 '+N(sv.total)+' ₫</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  });
  h+='</div>';
  el.innerHTML=h;
}
