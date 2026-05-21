// 다국어 번역 데이터 및 김치 로마자 변환
var TT={
ko:{mn:['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  noData:'내역 없음',noProd:'제품 없음',noSeller:'판매자 없음',noST:'해당 기간 판매 없음',
  inOk:'입고 완료',saleOk:'판매 완료',saved:'저장되었습니다',del:'삭제되었습니다',
  adjOk:'재고 수정 완료',nameOk:'이름 저장됨',
  eDate:'날짜 입력',eProd:'제품 선택',eQty:'수량 입력',eName:'이름 입력',
  eProdN:'제품명/규격 입력',eUrl:'URL 오류',eIn:'URL·Key 입력',eSL:'판매자 선택',
  overSt:'재고 초과. 계속하겠습니까?',
  dProd:'제품을 삭제하겠습니까?',dSL:'판매자를 삭제하겠습니까?',
  r1:'Firebase 설정 초기화',r2:'이 폰의 연결 설정만 삭제됩니다. 서버 데이터는 유지됩니다. 계속하겠습니까?',
  tSale:'총 판매금액',hqTot:'본사 입금 합계',hqB:'배달K → 본사',hqS:'개인판매자 → 본사',sPr:'판매자 수익',
  kpiTodaySale:'📦 오늘 전체 판매',kpiReorder:'⚠️ 재발주 알림',kpiReorderSub:'안전재고 미달',
  kpiDelivery:'🛵 미지급 배달비',kpiWholesale:'💰 미수 도매가',
  chBaedalkBadge:'HQ Direct',chTodaySale:'오늘 총 매출',chDoneCount:'완료 건수',
  chPendDel:'미지급 배달비',chBaedalkBtn:'🛵 배달비 정산 관리 →',
  chSellerTitle:'🧑‍💼 개인판매자',chSellerBadge:'Wholesale',chSellerBtn:'💰 도매 입금 확인 →',
  invTitle:'🥬 품목별 재고 현황',
  inTitle:'📥 입고 등록',inDate:'입고일자 *',inQty:'입고 수량 *',inExpiry:'유통기한',inSaveBtn:'📥 입고 저장',
  outTitle:'📤 판매 등록',outDate:'판매일자 *',outChannel:'판매 채널 *',
  chBaedalkLabel:'🛵 배달K',chSellerLabel:'🧑‍💼 개인판매자',outSellerLbl:'판매자 선택 *',
  outOrdererLbl:'주문자 이름',outOrdererPh:'예: 김연주',
  outAddItemLbl:'상품 추가',outAddBtn:'추가',outAddHint:'제품 선택 후 수량·단가 입력 → 추가 버튼',
  outQty:'판매 수량 *',outPrice:'판매단가 (VND)',outDelFee:'배달비 (VND)',
  outDelHint:'배달K 채널 배달비 (주문 1건당 1회)',
  ssItemsLbl:'품목 수',ssTotalLbl:'판매 총액',ssDelLbl:'배달비',ssHqLbl:'본사 입금액',ssPrLbl:'판매자 수익',
  outSaveBtn:'📤 판매 저장',
  eCart:'상품을 1개 이상 추가해주세요',
  stDaily:'일일',stWeekly:'주간',stMonthly:'월간',stSeller:'판매자별',stDelivery:'배달비 지급',stWholesale:'도매 입금',
  rptDaily:'일별',rptMonthly:'월별',rptChannel:'채널별',rptOrderer:'주문자별',
  navHome:'홈',navIn:'입고',navOut:'판매',navSettle:'정산',navReport:'보고서',
  mgmtTitle:'⚙️ 관리',mgmtSeller:'판매자',mgmtProd:'제품',mgmtHist:'내역',mgmtSettings:'설정',
  mgmtSellerTitle:'🧑‍💼 판매자 관리',mgmtProdTitle:'🥬 제품 관리',
  mgmtHistIn:'입고내역',mgmtHistOut:'판매내역',
  mgmtUserName:'사용자 이름',mgmtSaveName:'이름 저장',mgmtReset:'Firebase 설정 초기화',
  pmName:'제품명 *',pmSize:'규격/용량 *',pmUnit:'단위',pmSupply:'공급단가 (VND)',pmSale:'판매단가 (VND)',pmMin:'최소 안전재고',
  slName:'판매자 이름 *',slPhone:'연락처',slNote:'메모',
  adjTitle:'📦 재고 수량 조정',adjQtyLbl:'현재 재고 수량',adjExpLbl:'유통기한 임박 수량',
  adjExpHint:'7일 이내 유통기한 제품 수량',adjSaveBtn:'재고 수정 완료',
  editTitle:'📝 판매 내역 수정',editAmtLbl:'판매금액 (VND) *',editAmtHint:'판매단가 × 수량 합계',
  editHqLbl:'본사 입금',editSaveBtn:'수정 저장',
  fProd:'제품 선택 *',fNote:'비고',saveBtn:'저장',
  invToday:'오늘 판매',invAvail:'판매가능',invUnit:'개',
  stOk:'정상',stWarn:'여유 부족',stDanger:'재발주 필요',stZero:'품절',
  unconfirmedDel:'건 미입금',pendWholesale:'미수 도매가',noRegSeller:'등록된 판매자 없음',
  cntUnit:'건',qtyUnit:'개',
  stLabelDaily:'일일 정산',stLabelWeekly:'주간 정산',stLabelMonthly:'월간 정산',
  colDate:'날짜',colProd:'제품',colQty:'수량',colSaleAmt:'판매금액',colDel:'배달비',colHQ:'본사 입금',colSellerPr:'판매자 수익',
  sSellerTotalSale:'총 매출',sSellerHQIn:'본사 입금',sSellerHQSupply:'본사입금(공급가)',sSellerProfit:'판매자 수익',sHQTotal:'본사 입금 합계',
  delTotalMonth:'이번달 배달비 합계',delPendTotal:'미지급 합계',delNoData:'배달비 내역 없음',
  delPaid:'✅ 지급완료',delPend:'⏳ 미지급',
  wsTotal:'도매 합계',wsConfirmed:'입금 확인',wsPending:'미수금',wsHasPending:'미수금 있음',wsDone:'✅ 정산완료',
  wsConfirmBtn:'✅ 입금확인',wsUnconfirmBtn:'☐ 미확인',wsNoData:'개인판매자 내역 없음',
  rptTitleDaily:'📊 일별 리포트',rptTitleMonthly:'📊 월간 합계',
  rptLabelSale:'총 판매금액',rptLabelHQ:'본사 입금',rptLabelSellerPr:'판매자 수익',
  rptLabelDel:'배달비',rptLabelCount:'건수',rptLabelBaedalk:'배달K',rptLabelSeller:'개인판매자',
  rptLabelByDay:'📅 일별 판매',rptLabelByProd:'📦 품목별',rptTitleChannel:'채널 구분',
  rptLabelRevenue:'매출',rptLabelSellerDel:'배달비',rptLabelHQWholesale:'본사입금(도매)',
  histColDate:'날짜',histColProd:'제품',histColQty:'수량',histColNote:'비고',
  histColChannel:'채널',histColAmt:'금액',histColDel:'배달비',
  mgmtStock:'재고',mgmtSupply:'공급',mgmtSalePrice:'판매',
  zeroSupplyWarn:'⚠ 공급단가 미설정',zeroSupplyConfirm:'⚠️ 공급단가 0원. 계속하겠습니까?',
  prodAdd:'+ 추가',sellerAdd:'+ 추가',editBtn:'수정',delBtn:'삭제'},
vi:{mn:['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'],
  noData:'Không có dữ liệu',noProd:'Chưa có sản phẩm',noSeller:'Chưa có người bán',noST:'Không có dữ liệu',
  inOk:'Nhập hàng xong',saleOk:'Bán hàng xong',saved:'Đã lưu',del:'Đã xóa',
  adjOk:'Đã cập nhật tồn kho',nameOk:'Đã lưu tên',
  eDate:'Vui lòng nhập ngày',eProd:'Vui lòng chọn sản phẩm',eQty:'Vui lòng nhập số lượng',eName:'Vui lòng nhập tên',
  eProdN:'Nhập tên và quy cách SP',eUrl:'URL không hợp lệ',eIn:'Nhập URL và API Key',eSL:'Vui lòng chọn người bán',
  overSt:'Vượt tồn kho. Tiếp tục?',dProd:'Xóa sản phẩm?',dSL:'Xóa người bán?',
  r1:'Xóa cấu hình Firebase',r2:'Chỉ xóa cài đặt trên máy này. Dữ liệu server vẫn giữ nguyên.',
  tSale:'Tổng doanh thu',hqTot:'Tổng tiền HQ',hqB:'BaedalcK→HQ',hqS:'Người bán→HQ',sPr:'Lợi nhuận người bán',
  kpiTodaySale:'📦 Tổng bán hôm nay',kpiReorder:'⚠️ Cần đặt hàng',kpiReorderSub:'Dưới tồn kho tối thiểu',
  kpiDelivery:'🛵 Phí chưa thanh toán',kpiWholesale:'💰 Nợ bán buôn',
  chBaedalkBadge:'HQ Direct',chTodaySale:'Doanh thu hôm nay',chDoneCount:'Số đơn hoàn thành',
  chPendDel:'Phí giao chưa thanh toán',chBaedalkBtn:'🛵 Quản lý phí giao hàng →',
  chSellerTitle:'🧑‍💼 Người bán cá nhân',chSellerBadge:'Bán buôn',chSellerBtn:'💰 Xác nhận thanh toán →',
  invTitle:'🥬 Tình trạng tồn kho theo sản phẩm',
  inTitle:'📥 Nhập hàng',inDate:'Ngày nhập *',inQty:'Số lượng nhập *',inExpiry:'Hạn sử dụng',inSaveBtn:'📥 Lưu nhập hàng',
  outTitle:'📤 Đăng ký bán',outDate:'Ngày bán *',outChannel:'Kênh bán *',
  chBaedalkLabel:'🛵 Baedalc K',chSellerLabel:'🧑‍💼 Người bán cá nhân',outSellerLbl:'Chọn người bán *',
  outOrdererLbl:'Tên người đặt hàng',outOrdererPh:'Ví dụ: Kim Yeon-ju',
  outAddItemLbl:'Thêm sản phẩm',outAddBtn:'Thêm',outAddHint:'Chọn SP → nhập SL & đơn giá → nhấn Thêm',
  outQty:'Số lượng bán *',outPrice:'Đơn giá bán (VND)',outDelFee:'Phí giao hàng (VND)',
  outDelHint:'Phí giao hàng kênh Baedalc K (1 lần/đơn)',
  ssItemsLbl:'Số mặt hàng',ssTotalLbl:'Tổng tiền bán',ssDelLbl:'Phí giao hàng',ssHqLbl:'Tiền chuyển về HQ',ssPrLbl:'Lợi nhuận người bán',
  outSaveBtn:'📤 Lưu bán hàng',
  eCart:'Vui lòng thêm ít nhất 1 sản phẩm',
  stDaily:'Ngày',stWeekly:'Tuần',stMonthly:'Tháng',stSeller:'Theo người bán',stDelivery:'Phí giao hàng',stWholesale:'Nộp bán buôn',
  rptDaily:'Ngày',rptMonthly:'Tháng',rptChannel:'Theo kênh',rptOrderer:'Theo người đặt',
  navHome:'Trang chủ',navIn:'Nhập hàng',navOut:'Bán hàng',navSettle:'Quyết toán',navReport:'Báo cáo',
  mgmtTitle:'⚙️ Quản lý',mgmtSeller:'Người bán',mgmtProd:'Sản phẩm',mgmtHist:'Lịch sử',mgmtSettings:'Cài đặt',
  mgmtSellerTitle:'🧑‍💼 Quản lý người bán',mgmtProdTitle:'🥬 Quản lý sản phẩm',
  mgmtHistIn:'Lịch sử nhập',mgmtHistOut:'Lịch sử bán',
  mgmtUserName:'Tên người dùng',mgmtSaveName:'Lưu tên',mgmtReset:'Xóa cài đặt Firebase',
  pmName:'Tên sản phẩm *',pmSize:'Quy cách *',pmUnit:'Đơn vị',pmSupply:'Giá nhập (VND)',pmSale:'Giá bán (VND)',pmMin:'Tồn kho tối thiểu',
  slName:'Tên người bán *',slPhone:'Số điện thoại',slNote:'Ghi chú',
  adjTitle:'📦 Điều chỉnh tồn kho',adjQtyLbl:'Số lượng hiện tại',adjExpLbl:'Số lượng gần hết hạn',
  adjExpHint:'Sản phẩm hết hạn trong 7 ngày',adjSaveBtn:'Lưu điều chỉnh',
  editTitle:'📝 Sửa đơn hàng',editAmtLbl:'Số tiền bán (VND) *',editAmtHint:'Đơn giá × số lượng',
  editHqLbl:'Tiền chuyển về HQ',editSaveBtn:'Lưu chỉnh sửa',
  fProd:'Chọn sản phẩm *',fNote:'Ghi chú',saveBtn:'Lưu',
  invToday:'Bán hôm nay',invAvail:'Có thể bán',invUnit:'cái',
  stOk:'Bình thường',stWarn:'Sắp hết',stDanger:'Cần đặt hàng',stZero:'Hết hàng',
  unconfirmedDel:'đơn chưa nộp',pendWholesale:'Nợ bán buôn',noRegSeller:'Chưa có người bán',
  cntUnit:'đơn',qtyUnit:'cái',
  stLabelDaily:'Quyết toán ngày',stLabelWeekly:'Quyết toán tuần',stLabelMonthly:'Quyết toán tháng',
  colDate:'Ngày',colProd:'Sản phẩm',colQty:'Số lượng',colSaleAmt:'Tiền bán',colDel:'Phí giao',colHQ:'Tiền HQ',colSellerPr:'Lợi nhuận NB',
  sSellerTotalSale:'Tổng doanh thu',sSellerHQIn:'Tiền chuyển HQ',sSellerHQSupply:'Tiền HQ (giá nhập)',sSellerProfit:'Lợi nhuận người bán',sHQTotal:'Tổng tiền HQ',
  delTotalMonth:'Tổng phí giao tháng này',delPendTotal:'Tổng chưa thanh toán',delNoData:'Không có phí giao hàng',
  delPaid:'✅ Đã trả',delPend:'⏳ Chưa trả',
  wsTotal:'Tổng bán buôn',wsConfirmed:'Đã xác nhận',wsPending:'Còn nợ',wsHasPending:'Còn nợ chưa trả',wsDone:'✅ Đã quyết toán',
  wsConfirmBtn:'✅ Xác nhận',wsUnconfirmBtn:'☐ Chưa xác nhận',wsNoData:'Không có đơn bán buôn',
  rptTitleDaily:'📊 Báo cáo ngày',rptTitleMonthly:'📊 Tổng tháng',
  rptLabelSale:'Tổng doanh thu',rptLabelHQ:'Tiền chuyển HQ',rptLabelSellerPr:'Lợi nhuận người bán',
  rptLabelDel:'Phí giao hàng',rptLabelCount:'Số đơn',rptLabelBaedalk:'Baedalc K',rptLabelSeller:'Người bán cá nhân',
  rptLabelByDay:'📅 Doanh thu theo ngày',rptLabelByProd:'📦 Theo sản phẩm',rptTitleChannel:'Phân kênh bán hàng',
  rptLabelRevenue:'Doanh thu',rptLabelSellerDel:'Phí giao hàng',rptLabelHQWholesale:'Tiền HQ (bán buôn)',
  histColDate:'Ngày',histColProd:'Sản phẩm',histColQty:'SL',histColNote:'Ghi chú',
  histColChannel:'Kênh',histColAmt:'Số tiền',histColDel:'Phí giao',
  mgmtStock:'Tồn kho',mgmtSupply:'Giá nhập',mgmtSalePrice:'Giá bán',
  zeroSupplyWarn:'⚠ Chưa có giá nhập',zeroSupplyConfirm:'⚠️ Giá nhập = 0. Tiếp tục?',
  prodAdd:'+ Thêm',sellerAdd:'+ Thêm',editBtn:'Sửa',delBtn:'Xóa'}
};

// 김치 이름 로마자 변환 (VI 모드)
var KIMCHI_MAP = {
  '포기김치':'Pogi Kimchi','깍두기':'Kkakdugi','깍뚜기':'Kkakdugi',
  '열무김치':'Yeolmu Kimchi','총각김치':'Chonggak Kimchi','쪽파김치':'Jjokpa Kimchi',
  '맛김치':'Mat Kimchi','실비김치':'Silbi Kimchi','배추김치':'Baechu Kimchi',
  '백김치':'Baek Kimchi','동치미':'Dongchimi',
  '깻잎김치':'KKennip Kimchi','깻잎':'KKennip Kimchi',
  '석박지':'Seokbakji','묵은지':'Shin Kimchi',
  '오이소박이':'Oisobaki','오이김치':'Oi Kimchi',
  '대파김치':'Daepa Kimchi','파김치':'Daepa Kimchi',
  '갓김치':'Gad Kimchi',
  '부추김치':'Buchu Kimchi','무김치':'Mu Kimchi'
};

function pName(name){
  if(lang!=='vi')return name;
  for(var k in KIMCHI_MAP){if(name.indexOf(k)!==-1)return name.replace(k,KIMCHI_MAP[k]);}
  return name;
}

function t(k){return(TT[lang]||TT.ko)[k]||k;}

function applyLang(){
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var key=el.getAttribute('data-i18n');
    var tx=(TT[lang]||TT.ko)[key];
    if(tx!==undefined) el.textContent=tx;
  });
}

function setLang(l){
  lang=l;
  document.getElementById('btn-ko').classList.toggle('active',l==='ko');
  document.getElementById('btn-vi').classList.toggle('active',l==='vi');
  applyLang();
  renderAll();
  if(document.getElementById('page-settle').classList.contains('active'))renderST();
  if(document.getElementById('page-report').classList.contains('active'))renderRpt();
  if(document.getElementById('mgmt-ov').classList.contains('open'))setMT(mgmtTab);
}
