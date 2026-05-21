// 보고서 렌더링 (일별/월별/채널별/주문자별) + 단골 감지
function renderRpt(){
  if(rptTab==='daily')rDay();
  else if(rptTab==='monthly')rMonth();
  else if(rptTab==='channel')rCh();
  else if(rptTab==='orderer')rOrderer();
}
function rDay(){
  var el=document.getElementById('rpt-daily');
  var recs=Object.values(sales).filter(function(r){return r.date===dDay;});
  var cv=cS(recs);
  el.innerHTML=dn(dDay,'shD(-1);rDay()','shD(1);rDay()')+
    '<div class="rpt-sec"><div class="rpt-title">'+t('rptTitleDaily')+' ('+dDay+')</div>'+
    '<div class="rpt-row"><span>'+t('rptLabelSale')+'</span><strong>'+N(cv.ts)+' ₫</strong></div>'+
    '<div class="rpt-row"><span>'+t('rptLabelHQ')+'</span><strong style="color:var(--success-dark)">'+N(cv.hq)+' ₫</strong></div>'+
    '<div class="rpt-row"><span>'+t('rptLabelSellerPr')+'</span><strong style="color:var(--purple)">'+N(cv.sp)+' ₫</strong></div>'+
    '<div class="rpt-row"><span>'+t('rptLabelDel')+'</span><strong>'+N(cv.dl)+' ₫</strong></div>'+
    '<div class="rpt-row"><span>'+t('rptLabelCount')+'</span><strong>'+cv.cnt+t('cntUnit')+' · '+cv.qty+t('invUnit')+'</strong></div>'+
    '</div>'+
    (recs.length?'<div class="rpt-sec"><div class="rpt-title">'+t('rptTitleChannel')+'</div>'+
    '<div class="rpt-row"><span>'+t('rptLabelBaedalk')+'</span><strong>'+N(cv.bs)+' ₫</strong></div>'+
    '<div class="rpt-row"><span>'+t('rptLabelSeller')+'</span><strong>'+N(cv.ss)+' ₫</strong></div>'+
    '</div>':'');
}
function rMonth(){
  var el=document.getElementById('rpt-monthly');
  var mm=('0'+mM).slice(-2);var pfx=mY+'-'+mm;
  var recs=Object.values(sales).filter(function(r){return(r.date||'').startsWith(pfx);});
  var cv=cS(recs);
  var byD={};recs.filter(function(r){return!r.cancelled;}).forEach(function(r){if(!byD[r.date])byD[r.date]={s:0,n:0};byD[r.date].s+=r.total||0;byD[r.date].n++;});
  var dr=Object.entries(byD).sort(function(a,b){return b[0].localeCompare(a[0]);}).map(function(e){return'<div class="rpt-row"><span>'+e[0]+'</span><strong>'+N(e[1].s)+' ₫</strong></div>';}).join('');
  var monthLabel=mY+'년 '+(TT[lang]||TT.ko).mn[mM-1];
  var exportBar='<div class="export-bar">'+
    '<span class="export-bar-label">📤 '+monthLabel+' 내보내기</span>'+
    '<div class="export-btns">'+
    '<button class="btn-excel" onclick="exportExcel()">📊 Excel</button>'+
    '<button class="btn-pdf" onclick="exportPDF()">📄 PDF</button>'+
    '</div></div>';
  el.innerHTML=dn(monthLabel,'shM(-1);rMonth()','shM(1);rMonth()')+
    exportBar+
    '<div class="rpt-sec"><div class="rpt-title">'+t('rptTitleMonthly')+'</div>'+
    '<div class="rpt-row"><span>'+t('rptLabelSale')+'</span><strong>'+N(cv.ts)+' ₫</strong></div>'+
    '<div class="rpt-row"><span>'+t('rptLabelHQ')+'</span><strong style="color:var(--success-dark)">'+N(cv.hq)+' ₫</strong></div>'+
    '<div class="rpt-row"><span>'+t('rptLabelSellerPr')+'</span><strong style="color:var(--purple)">'+N(cv.sp)+' ₫</strong></div>'+
    '<div class="rpt-row"><span>'+t('rptLabelDel')+'</span><strong>'+N(cv.dl)+' ₫</strong></div>'+
    '<div class="rpt-row"><span>'+t('rptLabelCount')+'</span><strong>'+cv.cnt+t('cntUnit')+' · '+cv.qty+t('invUnit')+'</strong></div>'+
    '</div>'+
    (dr?'<div class="rpt-sec"><div class="rpt-title">'+t('rptLabelByDay')+'</div>'+dr+'</div>':'');
}
function rCh(){
  var el=document.getElementById('rpt-channel');
  var mm=('0'+mM).slice(-2);var pfx=mY+'-'+mm;
  var recs=Object.values(sales).filter(function(r){return(r.date||'').startsWith(pfx);});
  var cb=cS(recs.filter(function(r){return r.channel==='baedalk';}));
  var bySeller={};
  recs.filter(function(r){return r.channel==='seller';}).forEach(function(r){
    var sid=r.sellerId||'unknown';
    if(!bySeller[sid])bySeller[sid]={name:(sellers[sid]||{}).name||(r.sellerName||sid),recs:[]};
    bySeller[sid].recs.push(r);
  });
  var byP={};recs.forEach(function(r){if(!byP[r.productId])byP[r.productId]={name:r.productName||'',q:0,s:0};byP[r.productId].q+=r.quantity||0;byP[r.productId].s+=r.total||0;});
  var pr=Object.values(byP).sort(function(a,b){return b.s-a.s;}).map(function(v){return'<div class="rpt-row"><span>'+pName(v.name)+'</span><strong>'+v.q+t('invUnit')+' · '+N(v.s)+' ₫</strong></div>';}).join('');
  var sellerSecs='';
  Object.values(bySeller).forEach(function(sv){
    var cs=cS(sv.recs);
    sellerSecs+='<div class="rpt-sec"><div class="rpt-title">🧑‍💼 '+t('rptLabelSeller')+' · <span style="color:var(--purple)">'+sv.name+'</span></div>'+
      '<div class="rpt-row"><span>'+t('rptLabelRevenue')+'</span><strong>'+N(cs.ts)+' ₫</strong></div>'+
      '<div class="rpt-row"><span>'+t('rptLabelCount')+'</span><strong>'+cs.cnt+t('cntUnit')+' · '+cs.qty+t('invUnit')+'</strong></div>'+
      '<div class="rpt-row"><span>'+t('rptLabelHQWholesale')+'</span><strong style="color:var(--success-dark)">'+N(cs.hq)+' ₫</strong></div>'+
      '<div class="rpt-row"><span>'+t('rptLabelSellerPr')+'</span><strong style="color:var(--purple)">'+N(cs.sp)+' ₫</strong></div>'+
      '</div>';
  });
  if(!sellerSecs)sellerSecs='<div class="rpt-sec"><div class="rpt-title">🧑‍💼 '+t('rptLabelSeller')+'</div><div class="rpt-row"><span style="color:var(--gray-400)">'+t('noST')+'</span></div></div>';
  el.innerHTML=dn(mY+'년 '+(TT[lang]||TT.ko).mn[mM-1],'shM(-1);rCh()','shM(1);rCh()')+
    '<div class="rpt-sec"><div class="rpt-title">🛵 '+t('rptLabelBaedalk')+'</div>'+
    '<div class="rpt-row"><span>'+t('rptLabelRevenue')+'</span><strong>'+N(cb.ts)+' ₫</strong></div>'+
    '<div class="rpt-row"><span>'+t('rptLabelCount')+'</span><strong>'+cb.cnt+t('cntUnit')+' · '+cb.qty+t('invUnit')+'</strong></div>'+
    '<div class="rpt-row"><span>'+t('rptLabelSellerDel')+'</span><strong style="color:var(--warn-dark)">'+N(cb.dl)+' ₫</strong></div>'+
    '</div>'+sellerSecs+
    (pr?'<div class="rpt-sec"><div class="rpt-title">'+t('rptLabelByProd')+'</div>'+pr+'</div>':'');
}
function rOrderer(){
  var el=document.getElementById('rpt-orderer');
  var baedalRecs=Object.values(sales).filter(function(r){return r.channel==='baedalk'&&(r.ordererName||'').trim();});
  if(!baedalRecs.length){
    el.innerHTML='<div class="empty"><div class="empty-icon">🙋</div><div class="empty-text">주문자 데이터가 없습니다</div></div>';return;
  }
  var byOrderer={};
  baedalRecs.forEach(function(r){
    var name=(r.ordererName||'').trim();
    if(!byOrderer[name])byOrderer[name]={name:name,orders:{},totalAmt:0,totalQty:0};
    var ov=byOrderer[name];
    var gid=r.groupId||r.timestamp+'';
    if(!ov.orders[gid])ov.orders[gid]={date:r.date,items:[],orderAmt:0,deliveryFee:0};
    ov.orders[gid].items.push({prod:pName(r.productName||''),qty:r.quantity||0,total:r.total||0});
    ov.orders[gid].orderAmt+=(r.total||0);
    ov.orders[gid].deliveryFee+=(r.deliveryFee||0);
    ov.totalAmt+=(r.total||0);
    ov.totalQty+=(r.quantity||0);
  });
  var sorted=Object.values(byOrderer).sort(function(a,b){return b.totalAmt-a.totalAmt;});
  var html='';
  sorted.forEach(function(ov,rank){
    var orderList=Object.values(ov.orders).sort(function(a,b){return b.date.localeCompare(a.date);});
    var orderCnt=orderList.length;
    var isRegular=orderCnt>=2;
    var rankLabel=rank===0?'🥇':rank===1?'🥈':rank===2?'🥉':'👤';
    var detailRows=orderList.map(function(od){
      var itemStr=od.items.map(function(it){return pName(it.prod)+' '+it.qty+'개';}).join(' / ');
      var amtStr=N(od.orderAmt)+' ₫';
      return'<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--gray-100);font-size:13px">'+
        '<div style="color:var(--gray-500);min-width:80px">'+od.date+'</div>'+
        '<div style="flex:1;padding:0 8px;color:var(--gray-700)">'+itemStr+'</div>'+
        '<div style="font-weight:700;white-space:nowrap">'+amtStr+'</div></div>';
    }).join('');
    html+='<div class="rpt-sec" style="margin-bottom:14px">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'+
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<span style="font-size:20px">'+rankLabel+'</span>'+
          '<div>'+
            '<div style="font-size:16px;font-weight:800;color:var(--gray-900)">'+ov.name+'</div>'+
            '<div style="font-size:12px;color:var(--gray-500);margin-top:2px">총 '+orderCnt+'건 주문'+
              (isRegular?' · <span style="color:#E65100;font-weight:700">⭐ 단골손님</span>':'')+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div style="text-align:right">'+
          '<div style="font-size:18px;font-weight:800;color:var(--primary)">'+N(ov.totalAmt)+' ₫</div>'+
          '<div style="font-size:11px;color:var(--gray-400)">누적 합계</div>'+
        '</div>'+
      '</div>'+
      '<div style="border-top:1px solid var(--gray-100);padding-top:4px">'+detailRows+'</div>'+
    '</div>';
  });
  el.innerHTML='<div style="padding:4px 0 12px;font-size:13px;color:var(--gray-500);">배달K 주문자 기준 · 총 <strong style="color:var(--gray-700)">'+sorted.length+'명</strong></div>'+html;
}

/* 단골손님 감지 */
function chkRegular(name){
  var n=(name||'').trim();
  var badge=document.getElementById('regular-badge');
  var cntEl=document.getElementById('regular-cnt');
  if(!n){badge.style.display='none';return;}
  var past=Object.values(sales).filter(function(r){return r.channel==='baedalk'&&(r.ordererName||'').trim()===n;});
  var pastGroups={};
  past.forEach(function(r){var g=r.groupId||r.timestamp+'';pastGroups[g]=true;});
  var cnt=Object.keys(pastGroups).length;
  if(cnt>0){
    badge.style.display='block';
    cntEl.textContent='이전 주문 '+cnt+'건';
  }else{
    badge.style.display='none';
  }
}
