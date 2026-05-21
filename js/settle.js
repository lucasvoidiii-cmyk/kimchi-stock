// 정산 (일일/주간/월간/판매자별/배달비/도매 입금)
function renderST(){
  if(stTab==='daily')stDaily();
  else if(stTab==='weekly')stWeekly();
  else if(stTab==='monthly')stMonthly();
  else if(stTab==='seller')stSeller();
  else if(stTab==='delivery')stDelivery();
  else if(stTab==='wholesale')stWholesale();
}
function cS(recs){
  var ts=0,hq=0,sp=0,bs=0,ss=0,cnt=0,qty=0,dl=0;
  recs.forEach(function(r){
    if(r.cancelled)return;
    var p=prods[r.productId]||{};var su=r.supplyPrice||p.supplyPrice||0;
    var sup=r.supplyTotal!==undefined?r.supplyTotal:su*(r.quantity||0);
    var sale=r.total||((r.salePrice||0)*(r.quantity||0));
    var isB=r.channel==='baedalk';
    ts+=sale;hq+=(isB?sale:sup);sp+=(isB?0:Math.max(0,sale-sup));
    if(isB)bs+=sale;else ss+=sale;
    cnt++;qty+=(r.quantity||0);dl+=(r.deliveryFee||0);
  });
  return{ts:ts,hq:hq,sp:sp,bs:bs,ss:ss,cnt:cnt,qty:qty,dl:dl};
}
function sH(c,title){
  return '<div class="s-sec"><div style="font-size:13px;font-weight:700;color:var(--gray-500);margin-bottom:10px">'+title+'</div>'+
    '<div class="s-row"><span class="s-lbl">'+t('tSale')+'</span><span class="s-val">'+N(c.ts)+' ₫</span></div>'+
    '<div class="s-row"><span class="s-lbl">'+t('rptLabelCount')+'</span><span class="s-val">'+c.cnt+t('cntUnit')+' · '+c.qty+t('invUnit')+'</span></div>'+
    (c.bs?'<div class="s-row"><span class="s-lbl">'+t('hqB')+'</span><span class="s-val hq">'+N(c.bs)+' ₫</span></div>':'')+
    (c.ss?'<div class="s-row"><span class="s-lbl">'+t('hqS')+'</span><span class="s-val hq">'+N(c.hq-c.bs)+' ₫</span></div>':'')+
    (c.sp?'<div class="s-row"><span class="s-lbl">'+t('sPr')+'</span><span class="s-val pr">'+N(c.sp)+' ₫</span></div>':'')+
    '</div><div class="s-total"><span class="st-lbl">'+t('hqTot')+'</span><span class="st-val">'+N(c.hq)+' ₫</span></div>';
}
function dn(lbl,pf,nf){return'<div class="dnav"><button class="dnav-btn" onclick="'+pf+'">‹</button><div class="dnav-lbl">'+lbl+'</div><button class="dnav-btn" onclick="'+nf+'">›</button></div>';}
function noST(){return'<div class="empty"><div class="empty-icon">📊</div><div class="empty-text">'+t('noST')+'</div></div>';}
function stDaily(){
  var el=document.getElementById('st-daily');
  var recs=Object.values(sales).filter(function(r){return r.date===dDay;});
  el.innerHTML=dn(dDay,'shD(-1)','shD(1)')+(recs.length?sH(cS(recs),t('stLabelDaily')):noST());
}
function shD(d){var dt=new Date(dDay);dt.setDate(dt.getDate()+d);dDay=dt.toISOString().slice(0,10);stDaily();}
function stWeekly(){
  var el=document.getElementById('st-weekly');
  var tod=new Date();tod.setDate(tod.getDate()+wOff*7);
  var mon=new Date(tod);mon.setDate(tod.getDate()-tod.getDay()+1);
  var sun=new Date(mon);sun.setDate(mon.getDate()+6);
  function fm(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
  var ms=fm(mon),ss=fm(sun);
  var recs=Object.values(sales).filter(function(r){return r.date>=ms&&r.date<=ss;});
  el.innerHTML=dn(ms+' ~ '+ss,'shW(-1)','shW(1)')+(recs.length?sH(cS(recs),t('stLabelWeekly')):noST());
}
function shW(d){wOff+=d;stWeekly();}
function stMonthly(){
  var el=document.getElementById('st-monthly');
  var mm=('0'+mM).slice(-2);var pfx=mY+'-'+mm;
  var recs=Object.values(sales).filter(function(r){return(r.date||'').startsWith(pfx);});
  el.innerHTML=dn(mY+'년 '+(TT[lang]||TT.ko).mn[mM-1],'shM(-1)','shM(1)')+(recs.length?sH(cS(recs),t('stLabelMonthly')):noST());
}
function shM(d){mM+=d;if(mM>12){mM=1;mY++;}if(mM<1){mM=12;mY--;}renderST();}
function stSeller(){
  var el=document.getElementById('st-seller');
  var mm=('0'+mM).slice(-2);var pfx=mY+'-'+mm;
  var nav=dn(mY+'년 '+(TT[lang]||TT.ko).mn[mM-1],'shM(-1);stSeller()','shM(1);stSeller()');
  var mRecs=Object.values(sales).filter(function(r){return(r.date||'').startsWith(pfx);});
  if(!mRecs.length){el.innerHTML=nav+noST();return;}
  var byCh={b:[],s:{}};
  Object.entries(sales).forEach(function(e){var r=e[1];if(!(r.date||'').startsWith(pfx))return;if(r.channel==='seller'){var v=r.sellerId||'?';if(!byCh.s[v])byCh.s[v]=[];byCh.s[v].push(r);}else byCh.b.push(r);});
  var h=nav;
  if(byCh.b.length){var cv=cS(byCh.b);var ex=expSL['__b__']||false;
    h+='<div class="s-sec" style="border-left:4px solid var(--pink)">'+
      '<div class="s-hdr"><div class="s-name">🛵 BaedalcK</div>'+
      '<button class="s-cnt-btn" onclick="togExp(\'__b__\')">'+cv.cnt+t('cntUnit')+'·'+cv.qty+t('invUnit')+' '+(ex?'▲':'▼')+'</button></div>'+
      '<div class="s-row"><span class="s-lbl">'+t('sSellerTotalSale')+'</span><span class="s-val">'+N(cv.ts)+' ₫</span></div>'+
      '<div class="s-row"><span class="s-lbl">'+t('sSellerHQIn')+'</span><span class="s-val hq">'+N(cv.hq)+' ₫</span></div>'+
      (ex?buildDL(byCh.b,'b'):'')+
      '</div>';
  }
  Object.entries(byCh.s).forEach(function(e){
    var vid=e[0],recs=e[1];var sname=(sellers[vid]||{}).name||vid;
    var cv=cS(recs);var ex=expSL[vid]||false;
    h+='<div class="s-sec" style="border-left:4px solid var(--purple)">'+
      '<div class="s-hdr"><div class="s-name">🧑‍💼 '+sname+'</div>'+
      '<button class="s-cnt-btn" onclick="togExp(\''+vid+'\')">'+cv.cnt+t('cntUnit')+'·'+cv.qty+t('invUnit')+' '+(ex?'▲':'▼')+'</button></div>'+
      '<div class="s-row"><span class="s-lbl">'+t('sSellerTotalSale')+'</span><span class="s-val">'+N(cv.ts)+' ₫</span></div>'+
      '<div class="s-row"><span class="s-lbl">'+t('sSellerHQSupply')+'</span><span class="s-val hq">'+N(cv.hq)+' ₫</span></div>'+
      '<div class="s-row"><span class="s-lbl">'+t('sSellerProfit')+'</span><span class="s-val pr">'+N(cv.sp)+' ₫</span></div>'+
      (ex?buildDL(recs,'s'):'')+
      '</div>';
  });
  var tot=cS(mRecs);
  h+='<div class="s-total"><span class="st-lbl">'+t('sHQTotal')+'</span><span class="st-val">'+N(tot.hq)+' ₫</span></div>';
  el.innerHTML=h;
}
function buildDL(recs,ct){
  if(!recs||!recs.length)return'';
  var sr=recs.slice().sort(function(a,b){return b.timestamp-a.timestamp;});
  var h='<div class="sdl">';
  sr.forEach(function(r){
    var sid=Object.keys(sales).find(function(k){var s=sales[k];return s===r||(s.timestamp===r.timestamp&&s.productId===r.productId);});
    var p=prods[r.productId]||{};var su=r.supplyPrice||p.supplyPrice||0;
    var sup=r.supplyTotal!==undefined?r.supplyTotal:su*(r.quantity||0);
    var sale=r.total||((r.salePrice||0)*(r.quantity||0));
    var isB=ct==='b';var hq=isB?sale:sup;var pr=isB?0:Math.max(0,sale-sup);
    var isCancelled=r.cancelled||false;
    var cancelledClass=isCancelled?' sdi-cancelled cancel-stripe':'';
    var cancelledInfo=isCancelled?'<div class="sdi-row" style="margin-top:4px"><span class="sdi-k">취소 사유</span><span class="sdi-v" style="color:var(--danger-dark)">'+(r.cancelReason||'-')+'</span></div>':'';
    h+='<div class="sdi '+(isB?'b':'s')+cancelledClass+'">'+
      '<div class="sdi-row"><span class="sdi-k">'+t('colDate')+'</span><span class="sdi-v">'+r.date+'</span></div>'+
      '<div class="sdi-row"><span class="sdi-k">'+t('colProd')+'</span><span class="sdi-v">'+pName(r.productName||'')+'</span></div>'+
      '<div class="sdi-row"><span class="sdi-k">'+t('colQty')+'</span><span class="sdi-v">'+(r.quantity||0)+t('invUnit')+'</span></div>'+
      '<div class="sdi-row"><span class="sdi-k">'+t('colSaleAmt')+'</span><span class="sdi-v" style="'+(isCancelled?'text-decoration:line-through;color:var(--gray-400)':'')+'">'+N(sale)+' ₫</span></div>'+
      '<div class="sdi-row"><span class="sdi-k">'+t('colDel')+'</span><span class="sdi-v">'+N(r.deliveryFee||0)+' ₫</span></div>'+
      (!isCancelled?'<div class="sdi-row"><span class="sdi-k">'+t('colHQ')+'</span><span class="sdi-v" style="color:var(--success-dark)">'+N(hq)+' ₫</span></div>':'')+
      (!isB&&!isCancelled?'<div class="sdi-row"><span class="sdi-k">'+t('colSellerPr')+'</span><span class="sdi-v" style="color:var(--purple)">'+N(pr)+' ₫</span></div>':'')+
      cancelledInfo+
      '<div class="sdi-act">'+(sid?'<button class="btn btn-sm '+(isCancelled?'btn-outline':'btn-primary')+'" onclick="openEdit(\''+sid+'\')">'+(isCancelled?'↩️':'✏️')+'</button>':'')+'</div>'+
      '</div>';
  });
  return h+'</div>';
}
function togExp(vid){expSL[vid]=!expSL[vid];stSeller();}
function stDelivery(){
  var el=document.getElementById('st-delivery');
  var mm=('0'+mM).slice(-2);var pfx=mY+'-'+mm;
  var nav=dn(mY+'년 '+(TT[lang]||TT.ko).mn[mM-1],'shM(-1);stDelivery()','shM(1);stDelivery()');
  var recs=Object.entries(sales).filter(function(e){var r=e[1];return(r.date||'').startsWith(pfx)&&r.channel==='baedalk'&&(r.deliveryFee||0)>0;}).map(function(e){return Object.assign({_id:e[0]},e[1]);}).sort(function(a,b){return b.timestamp-a.timestamp;});
  if(!recs.length){el.innerHTML=nav+'<div class="empty"><div class="empty-icon">🛵</div><div class="empty-text">'+t('delNoData')+'</div></div>';return;}
  var totAll=recs.reduce(function(s,r){return s+(r.deliveryFee||0);},0);
  var pend=recs.filter(function(r){return!r.deliveryPaid;}).reduce(function(s,r){return s+(r.deliveryFee||0);},0);
  var h=nav+
    '<div class="s-sec">'+
    '<div class="s-row"><span class="s-lbl">'+t('delTotalMonth')+'</span><span class="s-val">'+N(totAll)+' ₫</span></div>'+
    '<div class="s-row"><span class="s-lbl" style="color:var(--warn-dark)">'+t('delPendTotal')+'</span><span class="s-val" style="color:var(--warn-dark)">'+N(pend)+' ₫</span></div>'+
    '</div><div class="s-sec">';
  recs.forEach(function(r){
    var paid=r.deliveryPaid||false;
    h+='<div class="pay-row">'+
      '<div class="pay-info">'+
      '<div class="pay-name">'+r.date+' · '+pName(r.productName||'')+'</div>'+
      '<div class="pay-amt">'+(r.quantity||0)+t('invUnit')+' · '+t('colDel')+' '+N(r.deliveryFee)+' ₫</div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:8px">'+
      '<button class="cfm-btn '+(paid?'done':'pend')+'" onclick="togDel(\''+r._id+'\','+(!paid)+')">'+( paid?t('delPaid'):t('delPend'))+'</button>'+
      '<button class="btn-dsm" onclick="openEdit(\''+r._id+'\')">✏️</button>'+
      '</div></div>';
  });
  h+='</div>';el.innerHTML=h;
}
async function togDel(id,v){try{await fPatch('sales/'+id,{deliveryPaid:v});sales[id].deliveryPaid=v;stDelivery();renderHome();}catch(e){toast('실패');}}
function stWholesale(){
  var el=document.getElementById('st-wholesale');
  var mm=('0'+mM).slice(-2);var pfx=mY+'-'+mm;
  var nav=dn(mY+'년 '+(TT[lang]||TT.ko).mn[mM-1],'shM(-1);stWholesale()','shM(1);stWholesale()');
  var srecs=Object.entries(sales).filter(function(e){var r=e[1];return(r.date||'').startsWith(pfx)&&r.channel==='seller';}).map(function(e){return Object.assign({_id:e[0]},e[1]);});
  if(!srecs.length){el.innerHTML=nav+'<div class="empty"><div class="empty-icon">💰</div><div class="empty-text">'+t('wsNoData')+'</div></div>';return;}
  var bySL={};srecs.forEach(function(r){var v=r.sellerId||'?';if(!bySL[v])bySL[v]=[];bySL[v].push(r);});
  var h=nav;
  Object.entries(bySL).forEach(function(e){
    var vid=e[0],recs=e[1];var sname=(sellers[vid]||{}).name||vid;
    function getHQ(r){var p=prods[r.productId]||{};var su=r.supplyPrice||p.supplyPrice||0;return su*(r.quantity||0);}
    var totA=recs.reduce(function(s,r){return s+getHQ(r);},0);
    var paidA=recs.filter(function(r){return r.paymentConfirmed;}).reduce(function(s,r){return s+getHQ(r);},0);
    var pendA=totA-paidA;
    h+='<div class="s-sec">'+
      '<div class="s-hdr">'+
      '<div class="s-name">🧑‍💼 '+sname+'</div>'+
      '<span style="font-size:13px;color:'+(pendA>0?'var(--warn-dark)':'var(--success-dark)')+';font-weight:700">'+(pendA>0?t('wsHasPending'):t('wsDone'))+'</span>'+
      '</div>'+
      '<div class="s-row"><span class="s-lbl">'+t('wsTotal')+'</span><span class="s-val">'+N(totA)+' ₫</span></div>'+
      '<div class="s-row"><span class="s-lbl" style="color:var(--success-dark)">'+t('wsConfirmed')+'</span><span class="s-val" style="color:var(--success-dark)">'+N(paidA)+' ₫</span></div>'+
      '<div class="s-row"><span class="s-lbl" style="color:var(--warn-dark)">'+t('wsPending')+'</span><span class="s-val" style="color:var(--warn-dark)">'+N(pendA)+' ₫</span></div>'+
      '<div style="border-top:1px solid var(--gray-100);margin-top:8px;padding-top:8px">';
    recs.slice().sort(function(a,b){return b.timestamp-a.timestamp;}).forEach(function(r){
      var hq=getHQ(r);var conf=r.paymentConfirmed||false;
      h+='<div class="pay-row">'+
        '<div class="pay-info">'+
        '<div class="pay-name">'+r.date+' · '+pName(r.productName||'')+'</div>'+
        '<div class="pay-amt">'+(r.quantity||0)+t('invUnit')+' · '+N(hq)+' ₫</div>'+
        '</div>'+
        '<button class="cfm-btn '+(conf?'done':'pend')+'" onclick="togWS(\''+r._id+'\','+(!conf)+')">'+( conf?t('wsConfirmBtn'):t('wsUnconfirmBtn'))+'</button>'+
        '</div>';
    });
    h+='</div></div>';
  });
  el.innerHTML=h;
}
async function togWS(id,v){try{await fPatch('sales/'+id,{paymentConfirmed:v});sales[id].paymentConfirmed=v;stWholesale();renderHome();}catch(e){toast('실패');}}
