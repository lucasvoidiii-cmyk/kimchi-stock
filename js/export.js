// 엑셀 및 PDF 내보내기 (월간 정산 보고서)
function getMonthRecs(){
  var mm=('0'+mM).slice(-2);var pfx=mY+'-'+mm;
  return Object.values(sales).filter(function(r){return(r.date||'').startsWith(pfx);});
}
function showExportProgress(show,icon,text){
  var el=document.getElementById('export-progress');
  if(show){
    document.getElementById('ep-icon').textContent=icon||'⏳';
    document.getElementById('ep-text').textContent=text||'파일 생성 중...';
    el.classList.add('show');
  }else{el.classList.remove('show');}
}
function exportExcel(){
  if(typeof XLSX==='undefined'){toast('라이브러리 로드 중. 잠시 후 다시 시도하세요.');return;}
  showExportProgress(true,'📊','Excel 파일 생성 중...');
  setTimeout(function(){
    try{
      var mm=('0'+mM).slice(-2);
      var monthLabel=mY+'년 '+mm+'월';
      var allRecs=getMonthRecs();
      var activeRecs=allRecs.filter(function(r){return!r.cancelled;});
      var wb=XLSX.utils.book_new();
      var cv=cS(activeRecs);
      /* 시트1: 월간 요약 */
      var bRecs=activeRecs.filter(function(r){return r.channel==='baedalk';});
      var sRecs=activeRecs.filter(function(r){return r.channel==='seller';});
      var cvB=cS(bRecs);var cvS=cS(sRecs);
      var cancelCount=allRecs.filter(function(r){return r.cancelled;}).length;
      var s1=[
        [monthLabel+' 월간 정산 요약','','대한김치 재고관리'],
        ['생성일',new Date().toLocaleDateString('ko-KR'),''],
        ['','',''],
        ['▶ 전체 요약','',''],
        ['총 판매금액 (VND)',cv.ts,''],
        ['본사 입금 합계 (VND)',cv.hq,''],
        ['판매자 수익 합계 (VND)',cv.sp,''],
        ['배달비 합계 (VND)',cv.dl,''],
        ['판매 건수 (취소 제외)',cv.cnt,''],
        ['판매 수량 (취소 제외)',cv.qty,''],
        ['취소 건수',cancelCount,''],
        ['','',''],
        ['▶ 채널별 요약','',''],
        ['채널','매출 (VND)','건수'],
        ['배달K',cvB.ts,cvB.cnt],
        ['개인판매자',cvS.ts,cvS.cnt],
        ['','',''],
        ['▶ 품목별 요약','',''],
        ['품목','판매수량','매출 (VND)']
      ];
      var byP={};activeRecs.forEach(function(r){var n=r.productName||'';if(!byP[n])byP[n]={q:0,s:0};byP[n].q+=r.quantity||0;byP[n].s+=r.total||0;});
      Object.entries(byP).sort(function(a,b){return b[1].s-a[1].s;}).forEach(function(e){s1.push([e[0],e[1].q,e[1].s]);});
      var ws1=XLSX.utils.aoa_to_sheet(s1);
      ws1['!cols']=[{wch:30},{wch:18},{wch:18}];
      XLSX.utils.book_append_sheet(wb,ws1,'월간요약');
      /* 시트2: 일별 판매 */
      var byD={};activeRecs.forEach(function(r){var d=r.date||'';if(!byD[d])byD[d]={sale:0,hq:0,del:0,cnt:0,qty:0};var p=prods[r.productId]||{};var su=r.supplyPrice||p.supplyPrice||0;var isB=r.channel==='baedalk';var sale=r.total||0;var hq=isB?sale:su*(r.quantity||0);byD[d].sale+=sale;byD[d].hq+=hq;byD[d].del+=r.deliveryFee||0;byD[d].cnt++;byD[d].qty+=r.quantity||0;});
      var s2=[['날짜','총매출(VND)','본사입금(VND)','배달비(VND)','건수','수량']];
      Object.entries(byD).sort(function(a,b){return a[0].localeCompare(b[0]);}).forEach(function(e){s2.push([e[0],e[1].sale,e[1].hq,e[1].del,e[1].cnt,e[1].qty]);});
      s2.push(['합계',cv.ts,cv.hq,cv.dl,cv.cnt,cv.qty]);
      var ws2=XLSX.utils.aoa_to_sheet(s2);
      ws2['!cols']=[{wch:14},{wch:16},{wch:16},{wch:14},{wch:8},{wch:8}];
      XLSX.utils.book_append_sheet(wb,ws2,'일별판매');
      /* 시트3: 전체 거래 명세 */
      var s3=[['날짜','채널','주문자/판매자','품목','수량','판매단가','판매금액','배달비','본사입금','상태','비고']];
      allRecs.slice().sort(function(a,b){return(a.date||'').localeCompare(b.date||'');}).forEach(function(r){
        var p=prods[r.productId]||{};var su=r.supplyPrice||p.supplyPrice||0;
        var isB=r.channel==='baedalk';var hq=isB?(r.total||0):su*(r.quantity||0);
        var who=isB?(r.ordererName||''):(r.sellerName||'');
        var status=r.cancelled?('취소('+(r.cancelReason||'')+')'):( r.paymentConfirmed?'입금확인':'미확인');
        s3.push([r.date||'',isB?'배달K':'개인판매자',who,r.productName||'',r.quantity||0,r.salePrice||0,r.total||0,r.deliveryFee||0,hq,status,r.note||'']);
      });
      var ws3=XLSX.utils.aoa_to_sheet(s3);
      ws3['!cols']=[{wch:12},{wch:12},{wch:14},{wch:18},{wch:6},{wch:12},{wch:14},{wch:12},{wch:14},{wch:22},{wch:16}];
      XLSX.utils.book_append_sheet(wb,ws3,'전체거래명세');
      /* 시트4: 판매자별 정산 */
      var s4=[['판매자','총매출(VND)','본사입금(VND)','판매자수익(VND)','건수','미수금액(VND)']];
      var bySL={};activeRecs.filter(function(r){return r.channel==='seller';}).forEach(function(r){var v=r.sellerId||'?';if(!bySL[v])bySL[v]={name:r.sellerName||v,recs:[]};bySL[v].recs.push(r);});
      Object.values(bySL).forEach(function(sv){
        var c=cS(sv.recs);
        var pendAmt=sv.recs.filter(function(r){return!r.paymentConfirmed;}).reduce(function(s,r){var p=prods[r.productId]||{};var su=r.supplyPrice||p.supplyPrice||0;return s+su*(r.quantity||0);},0);
        s4.push([sv.name,c.ts,c.hq,c.sp,c.cnt,pendAmt]);
      });
      var ws4=XLSX.utils.aoa_to_sheet(s4);
      ws4['!cols']=[{wch:16},{wch:16},{wch:16},{wch:16},{wch:8},{wch:16}];
      XLSX.utils.book_append_sheet(wb,ws4,'판매자별정산');
      var fname='대한김치_월간정산_'+mY+mm+'.xlsx';
      XLSX.writeFile(wb,fname);
      showExportProgress(false);
      toast('✅ Excel 저장 완료: '+fname);
    }catch(e){showExportProgress(false);toast('Excel 오류: '+e.message);console.error(e);}
  },100);
}
function exportPDF(){
  var jsPDFLib=(window.jspdf&&window.jspdf.jsPDF)||(typeof jsPDF!=='undefined'?jsPDF:null);
  if(!jsPDFLib){toast('PDF 라이브러리 로드 중. 잠시 후 다시 시도하세요.');return;}
  showExportProgress(true,'📄','PDF 파일 생성 중...');
  setTimeout(function(){
    try{
      var doc=new jsPDFLib({orientation:'portrait',unit:'mm',format:'a4'});
      var mm=('0'+mM).slice(-2);
      var monthLabel=mY+'. '+mm;
      var allRecs=getMonthRecs();
      var activeRecs=allRecs.filter(function(r){return!r.cancelled;});
      var cv=cS(activeRecs);
      var pageW=doc.internal.pageSize.getWidth();
      var y=14;
      doc.setFillColor(21,101,192);doc.roundedRect(14,y,pageW-28,16,3,3,'F');
      doc.setTextColor(255,255,255);doc.setFontSize(14);doc.setFont(undefined,'bold');
      doc.text('DAEHAN KIMCHI  Monthly Settlement Report',pageW/2,y+7,{align:'center'});
      doc.setFontSize(10);doc.setFont(undefined,'normal');
      doc.text(monthLabel+'  /  Generated: '+new Date().toLocaleDateString('en-CA'),pageW/2,y+13,{align:'center'});
      doc.setTextColor(0,0,0);y+=22;
      var bRecs=activeRecs.filter(function(r){return r.channel==='baedalk';});
      var sRecs=activeRecs.filter(function(r){return r.channel==='seller';});
      var cvB=cS(bRecs);var cvS=cS(sRecs);
      var cancelCount=allRecs.filter(function(r){return r.cancelled;}).length;
      doc.autoTable({startY:y,
        head:[['Item','Amount / Count','Item','Amount / Count']],
        body:[
          ['Total Sales (VND)',N(cv.ts)+'  VND','HQ Deposit (VND)',N(cv.hq)+'  VND'],
          ['Seller Profit (VND)',N(cv.sp)+'  VND','Delivery Fee (VND)',N(cv.dl)+'  VND'],
          ['Orders (active)',cv.cnt+' orders / '+cv.qty+' items','Cancelled',cancelCount+' orders'],
          ['BaedalK',N(cvB.ts)+' ('+cvB.cnt+' orders)','Sellers',N(cvS.ts)+' ('+cvS.cnt+' orders)']
        ],
        styles:{fontSize:9,cellPadding:3},
        headStyles:{fillColor:[21,101,192],fontSize:9},
        columnStyles:{0:{fontStyle:'bold',cellWidth:42},1:{cellWidth:48},2:{fontStyle:'bold',cellWidth:42},3:{cellWidth:48}},
        margin:{left:14,right:14}});
      y=doc.lastAutoTable.finalY+8;
      doc.setFontSize(10);doc.setFont(undefined,'bold');doc.setTextColor(21,101,192);
      doc.text('Sales by Product',14,y);doc.setTextColor(0,0,0);doc.setFont(undefined,'normal');y+=4;
      var byP={};activeRecs.forEach(function(r){var n=r.productName||'';if(!byP[n])byP[n]={q:0,s:0};byP[n].q+=r.quantity||0;byP[n].s+=r.total||0;});
      var prodRows=Object.entries(byP).sort(function(a,b){return b[1].s-a[1].s;}).map(function(e){return[e[0],e[1].q+' ea',N(e[1].s)+' VND'];});
      prodRows.push(['Total',cv.qty+' ea',N(cv.ts)+' VND']);
      doc.autoTable({startY:y,head:[['Product','Qty','Amount (VND)']],body:prodRows,
        styles:{fontSize:9},headStyles:{fillColor:[21,101,192]},
        columnStyles:{1:{halign:'center'},2:{halign:'right'}},
        margin:{left:14,right:14},
        didParseCell:function(data){if(data.row.index===prodRows.length-1){data.cell.styles.fontStyle='bold';data.cell.styles.fillColor=[240,248,255];}}});
      y=doc.lastAutoTable.finalY+8;
      if(y>220){doc.addPage();y=14;}
      doc.setFontSize(10);doc.setFont(undefined,'bold');doc.setTextColor(21,101,192);
      doc.text('Daily Sales',14,y);doc.setTextColor(0,0,0);doc.setFont(undefined,'normal');y+=4;
      var byD={};activeRecs.forEach(function(r){var d=r.date||'';if(!byD[d])byD[d]={sale:0,hq:0,del:0,cnt:0};var p=prods[r.productId]||{};var su=r.supplyPrice||p.supplyPrice||0;var isB=r.channel==='baedalk';var sale=r.total||0;byD[d].sale+=sale;byD[d].hq+=isB?sale:su*(r.quantity||0);byD[d].del+=r.deliveryFee||0;byD[d].cnt++;});
      var dayRows=Object.entries(byD).sort(function(a,b){return a[0].localeCompare(b[0]);}).map(function(e){return[e[0],e[1].cnt+' orders',N(e[1].sale)+' VND',N(e[1].hq)+' VND',N(e[1].del)+' VND'];});
      dayRows.push(['Total',cv.cnt+' orders',N(cv.ts)+' VND',N(cv.hq)+' VND',N(cv.dl)+' VND']);
      doc.autoTable({startY:y,head:[['Date','Orders','Sales','HQ Deposit','Del Fee']],body:dayRows,
        styles:{fontSize:8},headStyles:{fillColor:[21,101,192]},
        columnStyles:{2:{halign:'right'},3:{halign:'right'},4:{halign:'right'}},
        margin:{left:14,right:14},
        didParseCell:function(data){if(data.row.index===dayRows.length-1){data.cell.styles.fontStyle='bold';data.cell.styles.fillColor=[240,248,255];}}});
      doc.addPage();y=14;
      doc.setFillColor(21,101,192);doc.roundedRect(14,y,pageW-28,10,2,2,'F');
      doc.setTextColor(255,255,255);doc.setFontSize(11);doc.setFont(undefined,'bold');
      doc.text('Transaction Detail  '+monthLabel,pageW/2,y+7,{align:'center'});
      doc.setTextColor(0,0,0);doc.setFont(undefined,'normal');y+=14;
      var txRows=allRecs.slice().sort(function(a,b){return(a.date||'').localeCompare(b.date||'');}).map(function(r){
        var isB=r.channel==='baedalk';
        var p=prods[r.productId]||{};var su=r.supplyPrice||p.supplyPrice||0;
        var hq=isB?(r.total||0):su*(r.quantity||0);
        var who=isB?(r.ordererName||'-'):(r.sellerName||'-');
        var status=r.cancelled?'X':(isB?'-':(r.paymentConfirmed?'OK':'PEND'));
        return[r.date||'',isB?'BaedalK':'Seller',r.productName||'',r.quantity||0,N(r.total||0),N(r.deliveryFee||0),N(hq),who,status];
      });
      doc.autoTable({startY:y,
        head:[['Date','Ch','Product','Qty','Amount','DelFee','HQ','Orderer/Seller','St']],
        body:txRows,
        styles:{fontSize:7.5,cellPadding:1.8},
        headStyles:{fillColor:[21,101,192],fontSize:8},
        columnStyles:{3:{halign:'center'},4:{halign:'right'},5:{halign:'right'},6:{halign:'right'},8:{halign:'center'}},
        margin:{left:14,right:14},
        didParseCell:function(data){if(data.row.raw&&data.row.raw[8]==='X'){Object.values(data.row.cells).forEach(function(c){c.styles.textColor=[180,0,0];c.styles.fontStyle='italic';});}}});
      var pageCount=doc.internal.getNumberOfPages();
      for(var i=1;i<=pageCount;i++){
        doc.setPage(i);doc.setFontSize(8);doc.setTextColor(150);
        doc.text('DAEHAN KIMCHI  '+monthLabel+'  |  Page '+i+' / '+pageCount,pageW/2,doc.internal.pageSize.getHeight()-6,{align:'center'});
      }
      doc.save('대한김치_월간정산_'+mY+mm+'.pdf');
      showExportProgress(false);
      toast('✅ PDF 저장 완료');
    }catch(e){showExportProgress(false);toast('PDF 오류: '+e.message);console.error(e);}
  },150);
}

/* ===== 주간 배달K 정산서 엑셀 (한국어 + 베트남어 병기) ===== */
function exportBaedalkWeeklyExcel(weekStart,weekEnd){
  if(typeof XLSX==='undefined'){toast('라이브러리 로드 중. 잠시 후 다시 시도하세요.');return;}
  showExportProgress(true,'📊','주간 정산서 Excel 생성 중...');
  setTimeout(function(){
    try{
      var recs=Object.values(sales).filter(function(r){
        return r.channel==='baedalk'&&!r.cancelled&&r.date>=weekStart&&r.date<=weekEnd;
      }).sort(function(a,b){return(a.date||'').localeCompare(b.date||'');});

      var salesTotal=recs.reduce(function(s,r){return s+(r.total||0);},0);
      var bankTotal=recs.filter(function(r){return(r.paymentMethod||'bank')==='bank';}).reduce(function(s,r){return s+(r.total||0);},0);
      var cashTotal=recs.filter(function(r){return r.paymentMethod==='cash';}).reduce(function(s,r){return s+(r.total||0);},0);
      var deliveryTotal=recs.reduce(function(s,r){return s+(r.deliveryFee||0);},0);
      var wholesaleTotal=recs.reduce(function(s,r){var p=prods[r.productId]||{};var su=r.supplyPrice||p.supplyPrice||0;return s+(r.supplyTotal!==undefined?r.supplyTotal:su*(r.quantity||0));},0);
      var resendTotal=salesTotal-wholesaleTotal-deliveryTotal;
      var extraSend=Math.max(0,resendTotal-cashTotal);

      var wb=XLSX.utils.book_new();

      /* 시트1: 정산 요약 (한국어 / 베트남어) */
      var s1=[
        ['대한김치 배달K 주간 정산서 / Bảng Quyết Toán Tuần BaedalK - DAEHAN KIMCHI','',''],
        ['정산기간 / Kỳ quyết toán',weekStart+' ~ '+weekEnd,''],
        ['생성일 / Ngày tạo',new Date().toLocaleDateString('ko-KR'),''],
        ['','',''],
        ['▶ 결제수단별 판매금액 / Doanh thu theo phương thức thanh toán','',''],
        ['🏦 계좌이체 / Chuyển khoản ngân hàng',bankTotal,'VND'],
        ['💵 현금 / Tiền mặt',cashTotal,'VND'],
        ['판매금액 합계 / Tổng doanh thu',salesTotal,'VND'],
        ['','',''],
        ['▶ 공제 항목 / Các khoản khấu trừ','',''],
        ['배달비 합계 / Tổng phí giao hàng',deliveryTotal,'VND'],
        ['도매가 합계 / Tổng giá nhập (hóa đơn)',wholesaleTotal,'VND'],
        ['','',''],
        ['▶ 본사 재송금액 / Tiền chuyển lại HQ','',''],
        ['재송금액 (판매합계 - 배달비 - 도매가) / Tiền gửi lại (Tổng - Phí giao - Giá nhập)',resendTotal,'VND'],
        ['','',''],
        ['※ 현금 보관액 내가 보관 중 / Tiền mặt đang giữ',cashTotal,'VND'],
        ['※ 추가 송금 필요액 (재송금액 - 현금) / Cần chuyển thêm (Gửi lại - Tiền mặt)',extraSend,'VND'],
      ];
      var ws1=XLSX.utils.aoa_to_sheet(s1);
      ws1['!cols']=[{wch:60},{wch:18},{wch:8}];
      XLSX.utils.book_append_sheet(wb,ws1,'정산요약 Summary');

      /* 시트2: 주문 상세 (한국어 / 베트남어) */
      var s2=[['날짜/Ngày','주문자/Người đặt','제품/Sản phẩm','수량/SL','판매금액/Tiền bán','배달비/Phí giao','도매가/Giá nhập','결제수단/Thanh toán']];
      recs.forEach(function(r){
        var p=prods[r.productId]||{};
        var su=r.supplyPrice||p.supplyPrice||0;
        var sup=r.supplyTotal!==undefined?r.supplyTotal:su*(r.quantity||0);
        var pay=(r.paymentMethod||'bank')==='bank'?'계좌이체/Chuyển khoản':'현금/Tiền mặt';
        s2.push([r.date,r.ordererName||'-',r.productName||'',r.quantity||0,r.total||0,r.deliveryFee||0,sup,pay]);
      });
      s2.push(['합계/Tổng','','',recs.reduce(function(s,r){return s+(r.quantity||0);},0),salesTotal,deliveryTotal,wholesaleTotal,'']);
      var ws2=XLSX.utils.aoa_to_sheet(s2);
      ws2['!cols']=[{wch:12},{wch:16},{wch:22},{wch:6},{wch:14},{wch:12},{wch:14},{wch:20}];
      XLSX.utils.book_append_sheet(wb,ws2,'주문상세 Detail');

      var fname='대한김치_배달K정산_'+weekStart+'_'+weekEnd+'.xlsx';
      XLSX.writeFile(wb,fname);
      showExportProgress(false);
      toast('✅ Excel 저장 완료: '+fname);
    }catch(e){showExportProgress(false);toast('Excel 오류: '+e.message);console.error(e);}
  },100);
}

/* ===== 주간 배달K 정산서 PDF (오버레이 방식 — 모바일 완벽 지원) ===== */
function exportBaedalkWeeklyPDF(weekStart,weekEnd){
  var recs=Object.values(sales).filter(function(r){
    return r.channel==='baedalk'&&!r.cancelled&&r.date>=weekStart&&r.date<=weekEnd;
  }).sort(function(a,b){return(a.date||'').localeCompare(b.date||'');});

  var salesTotal=recs.reduce(function(s,r){return s+(r.total||0);},0);
  var bankTotal=recs.filter(function(r){return(r.paymentMethod||'bank')==='bank';}).reduce(function(s,r){return s+(r.total||0);},0);
  var cashTotal=recs.filter(function(r){return r.paymentMethod==='cash';}).reduce(function(s,r){return s+(r.total||0);},0);
  var deliveryTotal=recs.reduce(function(s,r){return s+(r.deliveryFee||0);},0);
  var wholesaleTotal=recs.reduce(function(s,r){var p=prods[r.productId]||{};var su=r.supplyPrice||p.supplyPrice||0;return s+(r.supplyTotal!==undefined?r.supplyTotal:su*(r.quantity||0));},0);
  var resendTotal=salesTotal-wholesaleTotal-deliveryTotal;
  var extraSend=Math.max(0,resendTotal-cashTotal);

  var rows=recs.map(function(r){
    var p=prods[r.productId]||{};var su=r.supplyPrice||p.supplyPrice||0;
    var sup=r.supplyTotal!==undefined?r.supplyTotal:su*(r.quantity||0);
    var isCash=(r.paymentMethod||'bank')==='cash';
    return'<tr>'+
      '<td>'+r.date+'</td>'+
      '<td>'+(r.ordererName||'-')+'</td>'+
      '<td>'+pName(r.productName||'')+'</td>'+
      '<td style="text-align:center">'+(r.quantity||0)+'</td>'+
      '<td style="text-align:right">'+N(r.total||0)+'</td>'+
      '<td style="text-align:right">'+N(r.deliveryFee||0)+'</td>'+
      '<td style="text-align:right">'+N(sup)+'</td>'+
      '<td style="text-align:center;color:'+(isCash?'#E65100':'#1565C0')+';font-weight:700">'+(isCash?'💵 현금':'🏦 계좌')+'</td>'+
    '</tr>';
  }).join('');

  var content=
    '<div class="print-header">'+
      '<div style="font-size:16px;font-weight:800;margin-bottom:4px">🥬 대한김치 배달K 주간 정산서</div>'+
      '<div style="font-size:11px;opacity:.9">정산기간: '+weekStart+' ~ '+weekEnd+' &nbsp;|&nbsp; 생성일: '+new Date().toLocaleDateString('ko-KR')+'</div>'+
    '</div>'+
    '<table class="sum-tbl">'+
      '<tr class="sec-row"><td colspan="2">▶ 결제수단별 판매금액 / Doanh thu theo phương thức</td></tr>'+
      '<tr><td>🏦 계좌이체 / Chuyển khoản</td><td class="r">'+N(bankTotal)+' ₫</td></tr>'+
      '<tr><td>💵 현금 / Tiền mặt</td><td class="r">'+N(cashTotal)+' ₫</td></tr>'+
      '<tr class="bold-row"><td>판매금액 합계 / Tổng doanh thu</td><td class="r">'+N(salesTotal)+' ₫</td></tr>'+
      '<tr class="sec-row"><td colspan="2">▶ 공제 항목 / Các khoản khấu trừ</td></tr>'+
      '<tr><td>배달비 합계 / Tổng phí giao hàng</td><td class="r" style="color:#E65100">− '+N(deliveryTotal)+' ₫</td></tr>'+
      '<tr><td>도매가 합계 / Tổng giá nhập</td><td class="r" style="color:#E65100">− '+N(wholesaleTotal)+' ₫</td></tr>'+
      '<tr class="hi-row"><td>▶ 본사 재송금액 / Tiền chuyển lại HQ</td><td class="r">'+N(resendTotal)+' ₫</td></tr>'+
      '<tr class="sec-row"><td colspan="2">▶ 현금 정산 / Quyết toán tiền mặt</td></tr>'+
      '<tr><td>현금 보관액 내가 보관 중 / Tiền mặt đang giữ</td><td class="r">'+N(cashTotal)+' ₫</td></tr>'+
      '<tr class="hi-row"><td>▶ 추가 송금 필요액 / Cần chuyển thêm</td><td class="r">'+N(extraSend)+' ₫</td></tr>'+
    '</table>'+
    '<div class="det-title">📋 주문 상세 / Chi tiết đơn hàng</div>'+
    '<table class="det-tbl">'+
      '<thead><tr>'+
        '<th>날짜/Ngày</th><th>주문자/Người đặt</th><th>제품/Sản phẩm</th>'+
        '<th>수량</th><th>판매금액</th><th>배달비</th><th>도매가</th><th>결제</th>'+
      '</tr></thead>'+
      '<tbody>'+rows+
        '<tr class="tot-row">'+
          '<td><b>합계/Tổng</b></td><td></td><td></td>'+
          '<td style="text-align:center"><b>'+recs.reduce(function(s,r){return s+(r.quantity||0);},0)+'</b></td>'+
          '<td style="text-align:right"><b>'+N(salesTotal)+'</b></td>'+
          '<td style="text-align:right"><b>'+N(deliveryTotal)+'</b></td>'+
          '<td style="text-align:right"><b>'+N(wholesaleTotal)+'</b></td>'+
          '<td></td>'+
        '</tr>'+
      '</tbody>'+
    '</table>'+
    '<div class="print-footer">DAEHAN KIMCHI &nbsp;|&nbsp; BaedalK 정산 &nbsp;|&nbsp; '+weekStart+' ~ '+weekEnd+'</div>';

  // 기존 오버레이 제거
  var old=document.getElementById('pdf-overlay');
  if(old)document.body.removeChild(old);
  var oldSt=document.getElementById('pdf-print-style');
  if(oldSt)document.head.removeChild(oldSt);

  // 인쇄 전용 스타일 (화면에서는 오버레이만, 인쇄 시에는 오버레이만 출력)
  var pStyle=document.createElement('style');
  pStyle.id='pdf-print-style';
  pStyle.textContent=
    '@media print{'+
      'body>*:not(#pdf-overlay){display:none!important;}'+
      '#pdf-overlay{position:static!important;overflow:visible!important;padding:0!important;}'+
      '#pdf-close-btn{display:none!important;}'+
    '}'+
    '#pdf-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:9999;overflow-y:auto;padding:16px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif;font-size:11px;color:#333;}'+
    '#pdf-overlay .print-header{background:#1565C0;color:#fff;padding:12px 16px;border-radius:6px;margin-bottom:12px;}'+
    '#pdf-overlay .sum-tbl{width:100%;border-collapse:collapse;margin-bottom:14px;}'+
    '#pdf-overlay .sum-tbl td{padding:6px 8px;border-bottom:1px solid #eee;}'+
    '#pdf-overlay .sum-tbl .r{text-align:right;font-weight:700;}'+
    '#pdf-overlay .sum-tbl .sec-row td{background:#EEF2FF;font-weight:700;color:#1565C0;font-size:11px;}'+
    '#pdf-overlay .sum-tbl .bold-row td{font-weight:700;}'+
    '#pdf-overlay .sum-tbl .hi-row td{background:#E8F5E9;font-weight:800;color:#2E7D32;}'+
    '#pdf-overlay .det-title{font-size:12px;font-weight:700;color:#1565C0;margin:10px 0 6px;}'+
    '#pdf-overlay .det-tbl{width:100%;border-collapse:collapse;font-size:10px;}'+
    '#pdf-overlay .det-tbl th{background:#1565C0;color:#fff;padding:5px 4px;text-align:left;}'+
    '#pdf-overlay .det-tbl td{padding:4px 4px;border-bottom:1px solid #f0f0f0;}'+
    '#pdf-overlay .det-tbl .tot-row td{background:#E8F5E9;}'+
    '#pdf-overlay .print-footer{margin-top:14px;text-align:center;font-size:10px;color:#aaa;}'+
    '#pdf-close-btn{position:fixed;top:12px;right:12px;z-index:10000;background:#fff;border:2px solid var(--gray-300);border-radius:50%;width:40px;height:40px;font-size:20px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15);}';
  document.head.appendChild(pStyle);

  // 오버레이 생성
  var overlay=document.createElement('div');
  overlay.id='pdf-overlay';
  overlay.innerHTML='<button id="pdf-close-btn" onclick="closePdfOverlay()">✕</button>'+content+
    '<div style="display:flex;gap:10px;margin-top:16px;padding-bottom:20px;">'+
      '<button onclick="window.print()" style="flex:1;padding:14px;background:#1565C0;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;">🖨️ 인쇄 / PDF 저장</button>'+
      '<button onclick="closePdfOverlay()" style="flex:0 0 auto;padding:14px 18px;background:var(--gray-100);color:var(--gray-700);border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;">✕ 닫기</button>'+
    '</div>';
  document.body.appendChild(overlay);
}

function closePdfOverlay(){
  var ov=document.getElementById('pdf-overlay');
  var st=document.getElementById('pdf-print-style');
  if(ov)document.body.removeChild(ov);
  if(st)document.head.removeChild(st);
}
