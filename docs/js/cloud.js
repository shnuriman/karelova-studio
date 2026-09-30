// Вхід + синхронізація з Supabase (REST, без SDK). Після входу підвантажує app.js.
(()=>{
const C=window.KR_CONFIG||{},K='karelova_v1',SK='karelova_sess',VK='karelova_ver',DK='karelova_dirty';
const configured=C.url&&C.anonKey&&!/YOUR-/.test(C.url+C.anonKey);
const T=C.url+'/rest/v1/crm_data';
const H=t=>({apikey:C.anonKey,Authorization:'Bearer '+(t||C.anonKey),'Content-Type':'application/json'});
let sess=null,ver=0,db=null,timer=null,busy=false,again=false;
try{sess=JSON.parse(localStorage.getItem(SK))}catch(e){}
const now=()=>Math.floor(Date.now()/1000);
const authErr=()=>Object.assign(new Error('auth'),{auth:true});

// ---------- екран входу / повідомлень
const ov=document.createElement('div');
ov.style.cssText='position:fixed;inset:0;z-index:99999;background:#060d14;color:#e8f1f5;display:none;align-items:center;justify-content:center;padding:24px;font:16px Inter,system-ui,sans-serif';
document.body.appendChild(ov);
const badge=document.createElement('div');
badge.style.cssText='position:fixed;top:calc(env(safe-area-inset-top,0px) + 6px);right:8px;z-index:9999;font:600 11px Inter,system-ui,sans-serif;padding:4px 8px;border-radius:10px;background:#c0392b;color:#fff;display:none';
badge.textContent='Не збережено на сервері';document.body.appendChild(badge);
const inp='width:100%;box-sizing:border-box;padding:14px;margin:6px 0 12px;border-radius:12px;border:1px solid #244;background:#0d1a24;color:#fff;font-size:16px';
const btn='width:100%;padding:14px;border:0;border-radius:12px;background:#09bbc6;color:#04222a;font-weight:600;font-size:16px';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const show=h=>{ov.innerHTML='<div style="width:100%;max-width:340px">'+h+'</div>';ov.style.display='flex'};
const hide=()=>{ov.style.display='none'};
const msg=(t,retry)=>show('<h2 style="margin:0 0 12px">Karelova Studio</h2><p style="line-height:1.5">'+esc(t)+'</p>'+(retry?'<button id="kr-r" style="'+btn+'">Спробувати ще</button>':''))||(retry&&document.getElementById('kr-r').addEventListener('click',()=>location.reload()));

function login(){return new Promise(res=>{
  show('<h2 style="margin:0 0 16px">Karelova Studio</h2><label>Email</label><input id="kr-e" type="email" autocomplete="username" style="'+inp+'"><label>Пароль</label><input id="kr-p" type="password" autocomplete="current-password" style="'+inp+'"><div id="kr-x" style="color:#ff8a80;min-height:20px;margin-bottom:8px"></div><button id="kr-b" style="'+btn+'">Увійти</button>');
  const go=async()=>{const x=document.getElementById('kr-x');x.textContent='';
    try{await auth('password',{email:document.getElementById('kr-e').value.trim(),password:document.getElementById('kr-p').value});hide();res()}
    catch(e){x.textContent=e.auth?'Невірний email або пароль':'Немає зв\u2019язку з сервером'}};
  document.getElementById('kr-b').addEventListener('click',go);
  document.getElementById('kr-p').addEventListener('keydown',e=>{if(e.key=='Enter')go()});
})}

// ---------- авторизація
async function auth(grant,body){
  const r=await fetch(C.url+'/auth/v1/token?grant_type='+grant,{method:'POST',headers:H(),body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){if(r.status>=400&&r.status<500)throw authErr();throw new Error('server')}
  sess={access_token:j.access_token,refresh_token:j.refresh_token,expires_at:j.expires_at||now()+j.expires_in};
  localStorage.setItem(SK,JSON.stringify(sess));
}
async function token(){
  if(!sess)throw authErr();
  if(sess.expires_at-60<now())await auth('refresh_token',{refresh_token:sess.refresh_token});
  return sess.access_token;
}

// ---------- дані
async function loadRemote(){
  const r=await fetch(T+'?select=data,version',{headers:H(await token())});
  if(r.status==401)throw authErr();
  if(!r.ok)throw new Error('server');
  const a=await r.json();return a.length?{data:a[0].data,version:a[0].version}:{data:null,version:0};
}
const cache=()=>{try{return JSON.parse(localStorage.getItem(K))}catch(e){return null}};
const dirty=()=>localStorage.getItem(DK)=='1';
function setDirty(v){if(v)localStorage.setItem(DK,'1');else localStorage.removeItem(DK);badge.style.display=v&&!busy?'block':'none'}

function conflict(){
  alert('Дані на сервері змінені з іншого пристрою. Сторінку буде оновлено, щоб не втратити ті зміни. Ваші останні правки на цьому пристрої можуть не зберегтися.');
  localStorage.removeItem(K);setDirty(false);location.reload();
}
async function push(){
  if(busy){again=true;return}
  busy=true;
  try{
    const t=await token(),h={...H(t),Prefer:'return=representation'};let r,j;
    if(ver===0){
      // Спочатку пробуємо INSERT (новий акаунт)
      r=await fetch(T,{method:'POST',headers:h,body:JSON.stringify({data:db,version:1})});
      if(r.status==401)throw authErr();
      if(r.status==409){
        // Рядок вже існує (інший пристрій / нова сесія) — читаємо актуальну версію
        const rv=await fetch(T+'?select=version',{headers:H(t)});
        if(rv.status==401)throw authErr();
        const ra=rv.ok?await rv.json():[];
        if(!ra.length){busy=false;setDirty(true);return}
        ver=ra[0].version;
        // Тепер робимо PATCH з актуальною версією
        r=await fetch(T+'?version=eq.'+ver,{method:'PATCH',headers:h,body:JSON.stringify({data:db,version:ver+1})});
        if(r.status==401)throw authErr();
        if(!r.ok)throw new Error('server');
        j=await r.json();
        if(!j.length){busy=false;return conflict()}
        ver=j[0].version;
      }else{
        if(!r.ok)throw new Error('server');
        j=await r.json();
        ver=j.length?j[0].version:1;
      }
    }else{
      r=await fetch(T+'?version=eq.'+ver,{method:'PATCH',headers:h,body:JSON.stringify({data:db,version:ver+1})});
      if(r.status==401)throw authErr();
      if(!r.ok)throw new Error('server');
      j=await r.json();
      if(!j.length){busy=false;return conflict()}
      ver=j[0].version;
    }
    localStorage.setItem(VK,String(ver));
    busy=false;setDirty(false);
    if(typeof window.toast=='function')window.toast('\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e');
  }catch(e){
    busy=false;
    if(e.auth){setDirty(true);localStorage.removeItem(SK);alert('\u0421\u0435\u0441\u0456\u044f \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043b\u0430\u0441\u044c. \u0423\u0432\u0456\u0439\u0434\u0456\u0442\u044c \u0437\u043d\u043e\u0432\u0443: \u043d\u0435\u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0456 \u0437\u043c\u0456\u043d\u0438 \u0437\u0431\u0435\u0440\u0435\u0436\u0443\u0442\u044c\u0441\u044f \u043f\u0456\u0441\u043b\u044f \u0432\u0445\u043e\u0434\u0443.');location.reload();return}
    setDirty(true);
  }
  if(again){again=false;push()}
}
function save(d){
  db=d;
  try{localStorage.setItem(K,JSON.stringify(db))}catch(e){alert('\u041f\u0430\u043c\u2019\u044f\u0442\u044c \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430 \u0437\u0430\u043f\u043e\u0432\u043d\u0435\u043d\u0430. \u0412\u0438\u0434\u0430\u043b\u0456\u0442\u044c \u0447\u0430\u0441\u0442\u0438\u043d\u0443 \u0444\u043e\u0442\u043e.')}
  setDirty(true);clearTimeout(timer);timer=setTimeout(push,600);
}
function logout(){
  if(dirty()&&!confirm('\u0454 \u0437\u043c\u0456\u043d\u0438, \u044f\u043a\u0456 \u0449\u0435 \u043d\u0435 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0456 \u043d\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0456. \u0412\u0438\u0439\u0442\u0438 \u0432\u0441\u0435 \u043e\u0434\u043d\u043e?'))return;
  [SK,K,VK,DK].forEach(k=>localStorage.removeItem(k));location.reload();
}

// ---------- оновлення, коли застосунок повертається на передній план
document.addEventListener('visibilitychange',async()=>{
  if(document.visibilityState!='visible'||!ver)return;
  if(dirty()){push();return}
  try{const r=await fetch(T+'?select=version',{headers:H(await token())});
    const a=r.ok?await r.json():[];if(a.length&&a[0].version>ver){localStorage.removeItem(K);location.reload()}}catch(e){}
});
window.addEventListener('online',()=>{if(dirty())push()});

// ---------- запуск
(async()=>{
  if(!configured)return msg('Не заповнено config.js: вкажіть адресу проєкту Supabase та публічний ключ (див. README).');
  for(;;){
    if(!sess)await login();
    try{
      const s=await loadRemote(),c=cache(),cv=+localStorage.getItem(VK)||0;
      ver=s.version;
      if(c&&dirty()&&cv===s.version){db=c}          // локальні незбережені правки на актуальній версії
      else{db=s.data;if(c&&dirty())alert('\u041b\u043e\u043a\u0430\u043b\u044c\u043d\u0456 \u043d\u0435\u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0456 \u0437\u043c\u0456\u043d\u0438 \u0432\u0456\u0434\u043a\u0438\u043d\u0443\u0442\u043e: \u0434\u0430\u043d\u0456 \u043d\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0456 \u043d\u043e\u0432\u0456\u0448\u0456.');setDirty(false)}
      if(db){try{localStorage.setItem(K,JSON.stringify(db));localStorage.setItem(VK,String(ver))}catch(e){}}
      break;
    }catch(e){
      if(e.auth){sess=null;localStorage.removeItem(SK);continue}
      const c=cache();                              // офлайн: працюємо з кешу
      if(c){db=c;ver=+localStorage.getItem(VK)||0;break}
      return msg('\u041d\u0435\u043c\u0430\u0454 \u0437\u0432\u2019\u044f\u0437\u043a\u0443 \u0437 \u0441\u0435\u0440\u0432\u0435\u0440\u043e\u043c, \u0430 \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u0438\u0445 \u0434\u0430\u043d\u0438\u0445 \u043d\u0430 \u0446\u044c\u043e\u043c\u0443 \u043f\u0440\u0438\u0441\u0442\u0440\u043e\u0457 \u0449\u0435 \u043d\u0435\u043c\u0430\u0454.',true);
    }
  }
  window.__DB=db;window.__SAVE=save;window.__LOGOUT=logout;
  const s=document.createElement('script');s.src='js/app.js?v=7';document.body.appendChild(s);
  if(dirty())push();
})();
})();
