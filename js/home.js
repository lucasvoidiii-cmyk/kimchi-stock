// 홈 화면 KPI 대시보드 및 재고 현황 렌더링
function renderHome(){
  var tod=tday();
  var mm=('0'+(new Date().getMonth()+1)).slice(-2);
  var mp=new Date().getFullYear()+'-'+mm;
  var tRecs=Object.values(sales).filter(function(r){return r.date===tod&&!r.cancelled;});
  var mRecs=Object.values(sales).filter(function(r){return(r.date||'').startsWith(mp)&&!r.cancelled;});
  var tQ=tRecs.reduce(function(s,r){return s+(r.quantity||0);},0);
  var tA=tRecs.reduce(function(s,r){return s+(r.total||0);},0);
  setKPI('kpi-tq',tQ,t('invUnit'));setKPI('kpi-ta',null,null,N(tA)+' ₫',true);
  var alc=0;Object.entries(prods).forEach(function(e){var id=e[0],p=e[1];var q=(stock[id]||{}).quantity||0;if(p.minStock&&q<=p.minStock)alc++;});
  setKPI('kpi-ro',alc,lang==='vi'?' SP':'품목');
  var badge=document.getElementById('nav-badge');
  if(alc>0){badge.textContent=alc;badge.style.display='block';}else badge.style.display='none';
  var pdR=mRecs.filter(function(r){return r.channel==='baedalk'&&(r.deliveryFee||0)>0&&!r.deliveryPaid;});
  var pdA=pdR.reduce(function(s,r){return s+(r.deliveryFee||0);},0);
  setKPI('kpi-dc',pdR.length,t('cntUnit'));setKPI('kpi-da',null,null,N(pdA)+' ₫',true);
  var pwR=mRecs.filter(function(r){return r.channel==='seller'&&!r.paymentConfirmed;});
  var pwA=0;
  var pwC=0;
  pwR.forEach(function(r){
    var p=prods[r.productId]||{};
    var su=r.supplyPrice||p.supplyPrice||0;
    var sup=r.supplyTotal!==undefined?r.supplyTotal:su*(r.quantity||0);
    if(sup>0){
      pwA+=sup;
      pwC++;
    }
  });
  setKPI('kpi-wc',pwC,t('cntUnit'));setKPI('kpi-wa',null,null,N(pwA)+' ₫',true);
  var tB=tRecs.filter(function(r){return r.channel==='baedalk';});
  document.getElementById('ch-bs').textContent=N(tB.reduce(function(s,r){return s+(r.total||0);},0))+' ₫';
  document.getElementById('ch-bc').textContent=tB.length+t('cntUnit');
  document.getElementById('ch-bd').textContent=N(tB.reduce(function(s,r){return s+(r.deliveryFee||0);},0))+' ₫';
  var sids=Object.keys(sellers);
  var srEl=document.getElementById('ch-sr');
  if(!sids.length){srEl.innerHTML='<div class="ch-stat-row"><span class="ch-stat-lbl" style="color:var(--gray-400)">'+t('noRegSeller')+'</span></div>';}
  else{
    var h='';
    sids.forEach(function(sid){
      var s=sellers[sid];
      var uR=mRecs.filter(function(r){return r.channel==='seller'&&r.sellerId===sid&&!r.paymentConfirmed;});
      var uA=0;
      var uC=0;
      uR.forEach(function(r){
        var p=prods[r.productId]||{};
        var su=r.supplyPrice||p.supplyPrice||0;
        var sup=r.supplyTotal!==undefined?r.supplyTotal:su*(r.quantity||0);
        if(sup>0){
          uA+=sup;
          uC++;
        }
      });
      var col=uC>0?'var(--warn-dark)':'var(--success-dark)';
      h+='<div class="ch-stat-row"><div><div style="font-size:15px;font-weight:700">🧑‍💼 '+s.name+'</div>'+
        '<div style="font-size:12px;color:var(--gray-400)">'+uC+t('unconfirmedDel')+'</div></div>'+
        '<div style="text-align:right"><div style="font-size:16px;font-weight:800;color:'+col+'">'+N(uA)+' ₫</div>'+
        '<div style="font-size:11px;color:var(--gray-400)">'+t('pendWholesale')+'</div></div></div>';
    });
    srEl.innerHTML=h;
  }
  renderInv();
}
function setKPI(id,val,unit,txt,sub){
  var el=document.getElementById(id);if(!el)return;
  if(sub){el.textContent=txt||'0 ₫';}
  else{el.innerHTML=N(val)+'<span style="font-size:14px;font-weight:500">'+unit+'</span>';}
}
function renderInv(){
  var el=document.getElementById('inv-list');
  var pids=Object.keys(prods);
  if(!pids.length){el.innerHTML='<div class="empty"><div class="empty-icon">🥬</div><div class="empty-text">'+t('noProd')+'</div></div>';return;}
  var tod=tday();var h='';
  pids.forEach(function(id){
    var p=prods[id];var s=stock[id]||{quantity:0};
    var qty=s.quantity||0;var mn=p.minStock||0;
    var bc='ib-ok',bx=t('stOk');
    if(qty<0){bc='ib-backorder';bx=t('stBackorder');}
    else if(qty===0){bc='ib-zero';bx=t('stZero');}
    else if(mn&&qty<=mn){bc='ib-danger';bx=t('stDanger');}
    else if(mn&&qty<=mn*1.5){bc='ib-warn';bx=t('stWarn');}
    var tQ=Object.values(sales).filter(function(r){return r.date===tod&&r.productId===id&&!r.cancelled;}).reduce(function(a,r){return a+(r.quantity||0);},0);
    h+='<div class="inv-item" onclick="openAdj(\''+id+'\')"><span class="inv-emoji">🥬</span><div class="inv-info"><div class="inv-name">'+pName(p.name)+'</div><div class="inv-spec">'+p.size+' · '+t('invToday')+' '+tQ+t('invUnit')+'</div><span class="inv-badge '+bc+'"'+(bc==='ib-backorder'?' style="background:#6A1B9A;color:#fff;"':'')+'>'+bx+'</span></div><div class="inv-right"><div class="inv-qty" style="'+(bc==='ib-backorder'?'color:var(--purple);':bc==='ib-danger'?'color:var(--danger-dark);':bc==='ib-zero'?'color:var(--gray-400);':'')+'">'+qty+'<span class="inv-unit">'+(p.unit||'개')+'</span></div><div class="inv-avail">'+(qty<0?t('stBackorder')+' '+Math.abs(qty)+t('invUnit'):t('invAvail')+' '+qty+t('invUnit'))+'</div></div></div>';
  });
  el.innerHTML=h;
}
