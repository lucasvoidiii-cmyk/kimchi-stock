// 재고 수량 조정 (모달에서 수량 변경 및 이력 기록)
function openAdj(pid){
  var s=stock[pid]||{quantity:0,expiringCount:0};
  var p=prods[pid]||{};
  document.getElementById('adj-name').textContent=p.name+' '+p.size;
  document.getElementById('adj-qty').value=s.quantity||0;
  document.getElementById('adj-exp').value=s.expiringCount||0;
  document.getElementById('adj-pid').value=pid;
  document.getElementById('adj-note').value='';
  // 이 제품의 수정 이력 표시
  var logs=Object.values(adjLogs).filter(function(l){return l.productId===pid;}).sort(function(a,b){return b.timestamp-a.timestamp;}).slice(0,5);
  var logWrap=document.getElementById('adj-log-wrap');
  var logList=document.getElementById('adj-log-list');
  if(logs.length){
    logList.innerHTML=logs.map(function(l){
      var d=new Date(l.timestamp);
      var ds=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
      var diff=l.newQty-l.prevQty;
      var diffStr=(diff>0?'<span style="color:var(--success-dark);font-weight:700">+'+diff+'</span>':'<span style="color:var(--danger-dark);font-weight:700">'+diff+'</span>');
      return'<div style="background:var(--gray-50);border-radius:8px;padding:10px 12px;margin-bottom:6px;border-left:3px solid var(--warn)">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'+
          '<span style="font-size:12px;color:var(--gray-500)">'+ds+'</span>'+
          '<span style="font-size:13px">'+l.prevQty+'개 → '+l.newQty+'개 ('+diffStr+')</span>'+
        '</div>'+
        '<div style="display:flex;justify-content:space-between;font-size:12px">'+
          '<span style="color:var(--gray-600)">📝 '+(l.note||'사유 없음')+'</span>'+
          '<span style="color:var(--primary);font-weight:700">👤 '+(l.staff||'미입력')+'</span>'+
        '</div>'+
      '</div>';
    }).join('');
    logWrap.style.display='block';
  }else{
    logWrap.style.display='none';
  }
  document.getElementById('modal-adj').classList.add('open');
}
function adjSt(d){var el=document.getElementById('adj-qty');el.value=Math.max(0,(parseInt(el.value)||0)+d);}
async function saveAdj(){
  var id=document.getElementById('adj-pid').value;
  var qty=parseInt(document.getElementById('adj-qty').value)||0;
  var exp=parseInt(document.getElementById('adj-exp').value)||0;
  var note=document.getElementById('adj-note').value.trim();
  var prevQty=(stock[id]||{}).quantity||0;
  var p=prods[id]||{};
  try{
    await fSet('stock/'+id,{quantity:qty,expiringCount:exp,lastUpdated:Date.now()});
    stock[id]={quantity:qty,expiringCount:exp,lastUpdated:Date.now()};
    var logRec={productId:id,productName:(p.name||'')+' '+(p.size||''),prevQty:prevQty,newQty:qty,note:note,staff:uName,date:tday(),timestamp:Date.now()};
    var lid=gid();
    await fSet('adjLogs/'+lid,logRec);
    adjLogs[lid]=logRec;
    toast(t('adjOk'));closeMod('modal-adj');renderHome();
  }catch(e){toast('실패:'+e.message);}
}
