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

/* ===== 주간 배달K 정산서 PDF (모달 미리보기 → 인쇄) ===== */
function exportBaedalkWeeklyPDF(weekStart,weekEnd){
  try{
    var recs=Object.values(sales).filter(function(r){
      return r.channel==='baedalk'&&!r.cancelled&&r.date>=weekStart&&r.date<=weekEnd;
    }).sort(function(a,b){return(a.date||'').localeCompare(b.date||'');});

    var salesTotal=recs.reduce(function(s,r){return s+(r.total||0);},0);
    var bankTotal=recs.filter(function(r){return(r.paymentMethod||'bank')==='bank';}).reduce(function(s,r){return s+(r.total||0);},0);
    var cashTotal=recs.filter(function(r){return r.paymentMethod==='cash';}).reduce(function(s,r){return s+(r.total||0);},0);
    var deliveryTotal=recs.reduce(function(s,r){return s+(r.deliveryFee||0);},0);
    var wholesaleTotal=recs.reduce(function(s,r){
      var p=prods[r.productId]||{};var su=r.supplyPrice||p.supplyPrice||0;
      return s+(r.supplyTotal!==undefined?r.supplyTotal:su*(r.quantity||0));
    },0);
    var resendTotal=salesTotal-wholesaleTotal-deliveryTotal;
    var extraSend=Math.max(0,resendTotal-cashTotal);

    var rows=recs.map(function(r){
      var p=prods[r.productId]||{};var su=r.supplyPrice||p.supplyPrice||0;
      var sup=r.supplyTotal!==undefined?r.supplyTotal:su*(r.quantity||0);
      var isCash=(r.paymentMethod||'bank')==='cash';
      return'<tr style="border-bottom:1px solid #eee">'+
        '<td style="padding:5px 4px">'+r.date+'</td>'+
        '<td style="padding:5px 4px">'+(r.ordererName||'-')+'</td>'+
        '<td style="padding:5px 4px">'+pName(r.productName||'')+'</td>'+
        '<td style="padding:5px 4px;text-align:center">'+(r.quantity||0)+'</td>'+
        '<td style="padding:5px 4px;text-align:right">'+N(r.total||0)+'</td>'+
        '<td style="padding:5px 4px;text-align:right">'+N(r.deliveryFee||0)+'</td>'+
        '<td style="padding:5px 4px;text-align:right">'+N(sup)+'</td>'+
        '<td style="padding:5px 4px;text-align:center;color:'+(isCash?'#E65100':'#1565C0')+';font-weight:700">'+(isCash?'현금':'계좌')+'</td>'+
      '</tr>';
    }).join('');

    function sRow(label,val,color,bold){
      return'<tr style="border-bottom:1px solid #f0f0f0">'+
        '<td style="padding:6px 8px;color:#555;font-size:11px'+(bold?';font-weight:700':'')+'">'+label+'</td>'+
        '<td style="padding:6px 8px;text-align:right;font-weight:'+(bold?'800':'700')+';color:'+(color||'#333')+'">'+val+'</td>'+
      '</tr>';
    }
    function secRow(label){
      return'<tr><td colspan="2" style="padding:6px 8px;background:#EEF2FF;font-weight:700;color:#1565C0;font-size:11px">'+label+'</td></tr>';
    }

    var html=
      '<div style="background:#1565C0;color:#fff;padding:10px 14px;border-radius:6px;margin-bottom:12px">'+
        '<div style="font-size:13px;font-weight:800;margin-bottom:2px">🥬 대한김치 배달K 주간 정산서</div>'+
        '<div style="font-size:11px;opacity:.9">정산기간: '+weekStart+' ~ '+weekEnd+'</div>'+
        '<div style="font-size:10px;opacity:.8">생성일: '+new Date().toLocaleDateString('ko-KR')+'</div>'+
      '</div>'+
      '<table style="width:100%;border-collapse:collapse;margin-bottom:14px">'+
        secRow('▶ 결제수단별 판매금액 / Doanh thu theo phương thức')+
        sRow('🏦 계좌이체 / Chuyển khoản',N(bankTotal)+' ₫')+
        sRow('💵 현금 / Tiền mặt',N(cashTotal)+' ₫')+
        sRow('판매금액 합계 / Tổng doanh thu',N(salesTotal)+' ₫','#333',true)+
        secRow('▶ 공제 항목 / Các khoản khấu trừ')+
        sRow('배달비 합계 / Tổng phí giao hàng','− '+N(deliveryTotal)+' ₫','#E65100')+
        sRow('도매가 합계 / Tổng giá nhập','− '+N(wholesaleTotal)+' ₫','#E65100')+
        '<tr><td colspan="2" style="padding:0"></td></tr>'+
        '<tr style="background:#E8F5E9"><td style="padding:8px;font-weight:800;color:#2E7D32">▶ 본사 재송금액 / Tiền chuyển lại HQ</td>'+
          '<td style="padding:8px;text-align:right;font-weight:800;color:#2E7D32;font-size:15px">'+N(resendTotal)+' ₫</td></tr>'+
        secRow('▶ 현금 정산 / Quyết toán tiền mặt')+
        sRow('현금 보관액 내가 보관 중 / Tiền mặt đang giữ',N(cashTotal)+' ₫')+
        '<tr style="background:#FFF8E1"><td style="padding:8px;font-weight:800;color:#E65100">▶ 추가 송금 필요액 / Cần chuyển thêm</td>'+
          '<td style="padding:8px;text-align:right;font-weight:800;color:#E65100;font-size:15px">'+N(extraSend)+' ₫</td></tr>'+
      '</table>'+
      '<div style="font-size:12px;font-weight:700;color:#1565C0;margin-bottom:6px">📋 주문 상세 / Chi tiết đơn hàng</div>'+
      '<div style="overflow-x:auto">'+
      '<table style="width:100%;border-collapse:collapse;font-size:10px">'+
        '<thead><tr style="background:#1565C0;color:#fff">'+
          '<th style="padding:5px 4px;text-align:left">날짜</th>'+
          '<th style="padding:5px 4px;text-align:left">주문자</th>'+
          '<th style="padding:5px 4px;text-align:left">제품</th>'+
          '<th style="padding:5px 4px;text-align:center">수량</th>'+
          '<th style="padding:5px 4px;text-align:right">판매금액</th>'+
          '<th style="padding:5px 4px;text-align:right">배달비</th>'+
          '<th style="padding:5px 4px;text-align:right">도매가</th>'+
          '<th style="padding:5px 4px;text-align:center">결제</th>'+
        '</tr></thead>'+
        '<tbody>'+rows+
        '<tr style="background:#E8F5E9;font-weight:700">'+
          '<td style="padding:5px 4px" colspan="3">합계/Tổng</td>'+
          '<td style="padding:5px 4px;text-align:center">'+recs.reduce(function(s,r){return s+(r.quantity||0);},0)+'</td>'+
          '<td style="padding:5px 4px;text-align:right">'+N(salesTotal)+'</td>'+
          '<td style="padding:5px 4px;text-align:right">'+N(deliveryTotal)+'</td>'+
          '<td style="padding:5px 4px;text-align:right">'+N(wholesaleTotal)+'</td>'+
          '<td></td>'+
        '</tr>'+
        '</tbody>'+
      '</table></div>'+
      '<div style="margin-top:12px;text-align:center;font-size:10px;color:#aaa">DAEHAN KIMCHI | BaedalK 정산 | '+weekStart+' ~ '+weekEnd+'</div>';

    document.getElementById('print-content').innerHTML=html;
    document.getElementById('modal-print').classList.add('open');
  }catch(e){toast('PDF 오류: '+e.message);console.error(e);}
}

function printSettlement(){
  var content=document.getElementById('print-content').innerHTML;
  var w=window.open('','_blank','width=800,height=600');
  if(!w){
    // 팝업 차단 시 현재 페이지에서 인쇄
    var st=document.createElement('style');
    st.id='__ps';
    st.textContent='@media print{body>*{display:none!important;}#__pc{display:block!important;position:static!important;}}';
    document.head.appendChild(st);
    var d=document.createElement('div');
    d.id='__pc';
    d.style.cssText='display:none;position:fixed;top:0;left:0;width:100%;background:#fff;z-index:99999;padding:16px;box-sizing:border-box;';
    d.innerHTML=content;
    document.body.appendChild(d);
    d.style.display='block';
    setTimeout(function(){
      window.print();
      setTimeout(function(){
        document.body.removeChild(d);
        document.head.removeChild(st);
      },1000);
    },300);
    return;
  }
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif;padding:16px;font-size:11px;}@media print{@page{margin:12mm;}}</style></head><body>'+content+'<script>window.onload=function(){window.print();setTimeout(function(){window.close();},1000);}<\/script></body></html>');
  w.document.close();
}
