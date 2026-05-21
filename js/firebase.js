// Firebase Realtime Database 통신 함수
async function fGet(p){var r=await fetch(DB+'/'+p+'.json?auth='+AK);return r.ok?r.json():null;}
async function fSet(p,d){var r=await fetch(DB+'/'+p+'.json?auth='+AK,{method:'PUT',body:JSON.stringify(d)});if(!r.ok)throw new Error('FB');return r.json();}
async function fPush(p,d){var id=gid();await fSet(p+'/'+id,d);return id;}
async function fDel(p){await fetch(DB+'/'+p+'.json?auth='+AK,{method:'DELETE'});}
async function fPatch(p,d){var r=await fetch(DB+'/'+p+'.json?auth='+AK,{method:'PATCH',body:JSON.stringify(d)});if(!r.ok)throw new Error('FB');return r.json();}
