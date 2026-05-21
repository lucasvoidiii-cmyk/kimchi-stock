// 앱 전역 상태, 유틸리티, 초기화, 라우팅, Service Worker 관리

/* ===== 전역 상태 ===== */
var lang='ko',DB='',AK='',uName='';
var prods={},sellers={},stock={},sales={},inbound={},adjLogs={};
var invoices={},settlements={},transactions={};
var curCh='baedalk',stTab='daily',mgmtTab='sl',histTab='in',rptTab='daily';
var dDay='',wOff=0,mY=new Date().getFullYear(),mM=new Date().getMonth()+1;
var expSL={};

/* ===== 유틸리티 ===== */
function N(n){return Number(n||0).toLocaleString();}
function tday(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function gid(){return Date.now().toString(36)+Math.random().toString(36).substr(2,5);}
function closeMod(id){document.getElementById(id).classList.remove('open');}
function toast(msg){var el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(function(){el.classList.remove('show');},2500);}

/* ===== 설정 ===== */
function saveConfig(){
  var url=document.getElementById('cfg-url').value.trim();
  var key=document.getElementById('cfg-key').value.trim();
  var usr=document.getElementById('cfg-user').value.trim();
  if(!url||!key){toast(t('eIn'));return;}
  if(!url.includes('firebaseio.com')&&!url.includes('firebasedatabase.app')){toast(t('eUrl'));return;}
  localStorage.setItem('db_url',url);localStorage.setItem('api_key',key);
  if(usr)localStorage.setItem('user_name',usr);
  DB=url.replace(/\/$/,'');AK=key;uName=usr;
  document.getElementById('cfg-pg').style.display='none';
  document.getElementById('app').style.display='block';
  document.getElementById('bottom-nav').style.display='flex';
  init();
}
function resetCfg(){if(!confirm(t('r1')+'\n\n'+t('r2')))return;localStorage.removeItem('db_url');localStorage.removeItem('api_key');location.reload();}
function saveName(){var n=document.getElementById('se-name').value.trim();if(!n){toast(t('eName'));return;}localStorage.setItem('user_name',n);uName=n;toast(t('nameOk'));}

/* ===== 초기화 ===== */
async function init(){
  var d=new Date();
  document.getElementById('hdr-date').textContent=(d.getMonth()+1)+'/'+d.getDate();
  dDay=tday();
  document.getElementById('in-date').value=tday();
  document.getElementById('out-date').value=tday();
  document.getElementById('se-name').value=uName;
  applyLang();
  await loadAll();
}
async function loadAll(){
  try{
    var r=await Promise.all([
      fGet('products'),fGet('sellers'),fGet('stock'),
      fGet('sales'),fGet('inbound'),fGet('adjLogs'),
      fGet('invoices'),fGet('settlements'),fGet('transactions')
    ]);
    prods=r[0]||{};sellers=r[1]||{};stock=r[2]||{};
    sales=r[3]||{};inbound=r[4]||{};adjLogs=r[5]||{};
    invoices=r[6]||{};settlements=r[7]||{};transactions=r[8]||{};
    renderAll();
  }catch(e){toast('로드 실패:'+e.message);}
}
function renderAll(){renderHome();popSels();}

/* ===== 라우팅 ===== */
function setPage(p){
  document.querySelectorAll('.page').forEach(function(el){el.classList.remove('active');});
  document.querySelectorAll('.nav-btn').forEach(function(el){el.classList.remove('active');});
  document.getElementById('page-'+p).classList.add('active');
  document.getElementById('nav-'+p).classList.add('active');
  if(p==='home')renderHome();
  else if(p==='finance'){setFinTab('invoice');}
  else if(p==='settle')renderST();
  else if(p==='report')renderRpt();
}
function setSettleTab(tab){
  stTab=tab;
  var tabs=['daily','weekly','monthly','seller','delivery','wholesale'];
  document.querySelectorAll('#page-settle .sub-tab').forEach(function(el,i){el.classList.toggle('active',tabs[i]===tab);});
  tabs.forEach(function(x){document.getElementById('st-'+x).style.display=x===tab?'block':'none';});
  renderST();
}
function setRptTab(tab){
  rptTab=tab;
  var tabs=['daily','monthly','channel','orderer'];
  document.querySelectorAll('#page-report .sub-tab').forEach(function(el,i){el.classList.toggle('active',tabs[i]===tab);});
  tabs.forEach(function(x){document.getElementById('rpt-'+x).style.display=x===tab?'block':'none';});
  renderRpt();
}

/* ===== 셀렉트 옵션 갱신 ===== */
function popSels(){
  var po='<option value=""></option>'+Object.entries(prods).map(function(e){return'<option value="'+e[0]+'">'+e[1].name+' '+e[1].size+'</option>';}).join('');
  document.getElementById('cart-prod').innerHTML=po;
  var ibProd=document.getElementById('ib-prod');
  if(ibProd)ibProd.innerHTML=po;
  var so='<option value=""></option>'+Object.entries(sellers).map(function(e){return'<option value="'+e[0]+'">'+e[1].name+'</option>';}).join('');
  document.getElementById('out-seller').innerHTML=so;
}

/* ===== 모달 외부 클릭 닫기 ===== */
document.querySelectorAll('.modal-overlay').forEach(function(el){el.addEventListener('click',function(e){if(e.target===el)el.classList.remove('open');});});

/* ===== Service Worker ===== */
if ('serviceWorker' in navigator) {
  var newWorker;
  navigator.serviceWorker.register('./service-worker.js')
    .then(function(registration) {
      console.log('[앱] Service Worker 등록 성공:', registration.scope);
      setInterval(function() { registration.update(); }, 60 * 60 * 1000);
      registration.addEventListener('updatefound', function() {
        newWorker = registration.installing;
        console.log('[앱] 새 버전 감지됨');
        newWorker.addEventListener('statechange', function() {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner();
          }
        });
      });
    })
    .catch(function(err) { console.log('[앱] Service Worker 등록 실패:', err); });
  navigator.serviceWorker.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'UPDATE_AVAILABLE') { showUpdateBanner(); }
  });
  var refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

function showUpdateBanner() {
  var banner = document.getElementById('update-banner');
  if (banner) { banner.classList.add('show'); }
}

function applyUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(function(registration) {
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  }
}

/* ===== 부팅 ===== */
(function(){
  var url=localStorage.getItem('db_url');var key=localStorage.getItem('api_key');
  uName=localStorage.getItem('user_name')||'';
  if(url&&key){DB=url.replace(/\/$/,'');AK=key;document.getElementById('app').style.display='block';document.getElementById('bottom-nav').style.display='flex';init();}
  else{document.getElementById('cfg-pg').style.display='flex';document.getElementById('bottom-nav').style.display='none';}
})();
