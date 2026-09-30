// Вхід + синхронізація з Supabase (REST, без SDK). Після входу підвантажує app.js.
(()=>{
const C=window.KR_CONFIG||{},K='karelova_v1',SK='karelova_sess',VK='karelova_ver',DK='karelova_dirty';
const configured=C.url&&C.anonKey&&!/YOUR-/.test(C.url+C.anonKey);
const T=C.url+'/rest/v1/crm_data';
const H=t=>({apikey:C.anonKey,Authorization:'Bearer '+(t||C.anonKey),'Content-Type':'application/json'});
let sess=null,ver=0,db=null,timer=null,busy=false,again=false,fail=false,retryT=null;
try{sess=JSON.parse(localStorage.getItem(SK))}catch(e){}
const now=()=>Math.floor(Date.now()/1000);
const authErr=()=>Object.assign(new Error('auth'),{auth:true});

// ---------- SVG логотип (повний, з написом знизу — бренд-кольори)
const LOGO_SVG=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 511.21 142.8" style="width:100%;max-width:187px;height:auto;display:block;margin:0 auto 4px"><defs><style>.lg-a{fill:#09bbc6}.lg-w{fill:#fff}.lg-b{fill:#00b4b1}</style></defs><g><g><path class="lg-w" d="M17.63,5.53v36.07l7.35-8.28L51.16,5.53h22.31l-33.13,34.73,35.26,58.77h-20.57l-27.38-45.68-10.02,10.55v35.13H0V5.53h17.63Z"/><path class="lg-w" d="M114.66,97.69c-3.87,2.14-8.15,3.21-12.96,3.21-6.54,0-11.89-1.87-16.03-5.74-4.14-3.74-6.28-8.68-6.28-14.96s2.14-11.35,6.41-14.83c4.14-3.47,9.88-5.74,17.23-6.68l19.9-2.67v-3.34c0-6.68-4.14-10.02-12.42-10.02-3.61,0-6.41.67-8.42,2.14-2.14,1.47-3.21,3.21-3.21,5.34,0,.93,0,1.47.13,1.87l-15.9,1.74c-.13-.8-.27-2-.27-3.47,0-3.47,1.07-6.68,3.34-9.62,2.27-2.94,5.48-5.34,9.62-7.08,4.14-1.74,9.08-2.67,14.69-2.67,9.48,0,16.7,2,21.77,6.01,4.94,4.01,7.48,10.02,7.48,18.03v27.65c0,6.54.67,12.02,2.14,16.43h-16.7c-.94-3.61-1.34-7.08-1.34-10.55-2.27,4.14-5.34,7.21-9.22,9.22ZM122.94,68.84v-1.2l-16.03,2.27c-3.74.54-6.54,1.47-8.28,2.94-1.87,1.47-2.81,3.61-2.81,6.41,0,2.54.94,4.54,2.67,5.88,1.74,1.47,4.01,2.14,6.81,2.14,5.21,0,9.35-1.6,12.69-4.67s4.94-7.61,4.94-13.76Z"/><path class="lg-w" d="M174.46,52.15c-2.94,3.74-4.41,8.42-4.41,14.16v32.73h-16.83V32.78h16.83v10.55c2-3.87,4.54-6.95,7.61-9.22,3.07-2.14,6.68-3.21,10.82-3.21,2.14,0,4.01.27,5.74.8l-2.67,15.9c-1.74-.67-3.47-.93-5.48-.93-4.94,0-8.82,1.87-11.62,5.48Z"/><path class="lg-w" d="M230.37,86.47c4.14,0,7.35-.8,9.62-2.27,2.27-1.47,4.68-3.74,7.21-6.81l13.36,6.68c-3.34,5.74-7.48,10.02-12.29,12.69-4.94,2.8-10.95,4.14-18.17,4.14-6.14,0-11.75-1.47-16.96-4.41s-9.35-7.08-12.42-12.42c-3.07-5.34-4.68-11.35-4.68-18.17s1.6-12.96,4.68-18.3c3.07-5.21,7.35-9.35,12.69-12.29,5.21-2.94,11.09-4.41,17.5-4.41s11.75,1.34,16.7,4.14c4.94,2.8,8.68,6.81,11.49,11.75,2.8,5.08,4.14,10.82,4.14,17.23v5.88h-51.03c.53,5.08,2.4,9.08,5.74,12.02,3.34,3.07,7.48,4.54,12.42,4.54ZM212.47,57.09h35.13c-.8-4.14-2.67-7.48-5.74-9.88-3.07-2.27-6.81-3.47-11.49-3.47-4.27,0-8.01,1.2-11.22,3.74-3.21,2.54-5.48,5.74-6.68,9.62Z"/><path class="lg-w" d="M290.34,99.03h-16.83V5.53h16.83v93.5Z"/><path class="lg-w" d="M354.56,96.89c-5.61,2.67-11.49,4.01-17.77,4.01s-12.16-1.34-17.63-4.01c-5.61-2.67-10.15-6.68-13.49-12.02-3.34-5.21-5.08-11.62-5.08-18.97s1.74-13.76,5.08-19.1c3.34-5.21,7.88-9.22,13.49-11.89,5.48-2.67,11.35-4.01,17.63-4.01s12.16,1.34,17.77,4.01c5.48,2.67,10.02,6.68,13.36,11.89,3.34,5.34,5.08,11.75,5.08,19.1s-1.74,13.76-5.08,18.97c-3.34,5.34-7.88,9.35-13.36,12.02ZM353.23,76.05c1.74-2.8,2.67-6.28,2.67-10.15s-.94-7.35-2.67-10.29c-1.74-2.81-4.14-5.08-6.95-6.68-2.94-1.47-6.14-2.27-9.48-2.27s-6.54.8-9.35,2.27c-2.94,1.6-5.34,3.87-7.08,6.68-1.74,2.94-2.67,6.41-2.67,10.29s.94,7.35,2.67,10.15c1.74,2.94,4.14,5.21,7.08,6.68,2.81,1.6,6.01,2.41,9.35,2.41s6.55-.8,9.48-2.41c2.81-1.47,5.21-3.74,6.95-6.68Z"/><path class="lg-w" d="M372.83,32.78h17.9l16.83,44.88,16.83-44.88h17.9l-26.85,66.25h-15.76l-26.85-66.25Z"/><g><path class="lg-b" d="M460.01,1.43c2.69-2.91,10.91-1,12.68,2.37,1.68,3.21.52,12.03-2.2,14.58-1.99,1.86-6.21,2.06-8.41.47-1.57-1.13-2.17-3.63-2.56-5.44-.66-3.07-1.81-9.5.5-11.98Z"/><path class="lg-b" d="M481.2,6.73c3.03-.34,6.82,2.63,7,5.75s-2.51,9.72-6.16,10.05-5.27-1.94-5.6-5.25c-.34-3.37.4-10.06,4.76-10.55Z"/><path class="lg-b" d="M493.15,15.23c1.78-.24,4.7,1.71,5.18,3.39.88,3.12-1.6,9.41-5.35,9.55-7.17.27-4.26-12.34.17-12.94Z"/><path class="lg-b" d="M501.28,25.31c2.37-.72,4.72,1.22,4.76,3.62.04,2.11-2.86,6.06-5.14,5.95-4.46-.21-2.77-8.61.38-9.57Z"/><path class="lg-b" d="M507.98,33.17c1.42-.38,2.51.8,3,2.02,1.53,3.74-5.1,7.79-6.14,3.41-.3-1.25,1.7-5.05,3.14-5.43Z"/></g><g><path class="lg-a" d="M460.01,1.43c2.69-2.91,10.91-1,12.68,2.37,1.68,3.21.52,12.03-2.2,14.58-1.99,1.86-6.21,2.06-8.41.47-1.57-1.13-2.17-3.63-2.56-5.44-.66-3.07-1.81-9.5.5-11.98Z"/><path class="lg-a" d="M481.2,6.73c3.03-.34,6.82,2.63,7,5.75s-2.51,9.72-6.16,10.05-5.27-1.94-5.6-5.25c-.34-3.37.4-10.06,4.76-10.55Z"/><path class="lg-a" d="M493.15,15.23c1.78-.24,4.7,1.71,5.18,3.39.88,3.12-1.6,9.41-5.35,9.55-7.17.27-4.26-12.34.17-12.94Z"/><path class="lg-a" d="M501.28,25.31c2.37-.72,4.72,1.22,4.76,3.62.04,2.11-2.86,6.06-5.14,5.95-4.46-.21-2.77-8.61.38-9.57Z"/><path class="lg-a" d="M507.98,33.17c1.42-.38,2.51.8,3,2.02,1.53,3.74-5.1,7.79-6.14,3.41-.3-1.25,1.7-5.05,3.14-5.43Z"/></g><path class="lg-a" d="M496.13,36.91c-5.08-4-12.29-6.01-21.77-6.01-5.61,0-10.56.94-14.7,2.67-4.14,1.74-7.34,4.14-9.61,7.08-2.27,2.94-3.34,6.15-3.34,9.62,0,1.47.13,2.67.26,3.47l15.76-1.72h0v-1.88c0-2.14,1.06-3.88,3.2-5.35,2.01-1.46,4.81-2.13,8.42-2.13,8.28,0,12.42,3.34,12.42,10.02v16.16c0,6.14-1.6,10.68-4.94,13.76-3.34,3.07-7.48,4.67-12.69,4.67-2.81,0-5.08-.67-6.81-2.14-1.74-1.33-2.68-3.34-2.68-5.87,0-2.81.94-4.95,2.81-6.41,1.74-1.47,4.54-2.41,8.28-2.94l15.75-2.23-2.71-11.27-16.91,2.28c-7.35.93-13.09,3.2-17.23,6.68-4.28,3.47-6.42,8.41-6.42,14.82s2.14,11.22,6.28,14.96c4.14,3.88,11.01,6.44,17.56,6.44,23.64.02,35.18-8.27,35.05-46.4-.03-8.02-1.05-14.27-5.99-18.28Z"/><g><path class="lg-w" d="M14.14,122.34c1.63,1.31,2.43,3.13,2.43,5.44s-.8,4.03-2.43,5.4c-1.63,1.37-3.74,2.05-6.33,2.05H3.3v7.1H.26v-21.74c2.97-.16,5.5-.26,7.55-.26,2.62,0,4.73.67,6.33,2.01ZM8.13,132.47c3.2,0,5.44-1.85,5.44-4.7s-2.21-4.64-5.44-4.64c-1.69,0-3.33.03-4.83.13v9.21h4.83Z"/><path class="lg-w" d="M44.08,120.1c3.42,0,6.17,1.05,8.31,3.13s3.2,4.83,3.2,8.22-1.06,6.14-3.2,8.22-4.89,3.13-8.31,3.13-6.17-1.05-8.31-3.13-3.2-4.83-3.2-8.22,1.06-6.14,3.2-8.22c2.14-2.08,4.89-3.13,8.31-3.13ZM44.08,139.95c2.46,0,4.44-.77,5.98-2.33,1.57-1.57,2.33-3.65,2.33-6.17s-.77-4.57-2.33-6.14c-1.53-1.57-3.52-2.33-5.98-2.33s-4.44.77-6.01,2.33c-1.53,1.57-2.3,3.61-2.3,6.14s.77,4.6,2.3,6.17c1.57,1.57,3.55,2.33,6.01,2.33Z"/><path class="lg-w" d="M88.91,123.33c2.11,2.01,3.17,4.67,3.17,7.99s-1.02,6.08-3.1,8.15-4.7,3.1-7.93,3.1c-2.21,0-4.83-.1-7.9-.26v-21.74c3.07-.16,5.56-.26,7.48-.26,3.42,0,6.17.99,8.28,3.01ZM86.67,137.43c1.47-1.54,2.21-3.58,2.21-6.11s-.77-4.48-2.27-5.95c-1.5-1.5-3.52-2.24-5.98-2.24-1.06,0-2.53.03-4.44.13v16.37c1.57.06,3.2.1,4.86.1,2.27,0,4.16-.77,5.63-2.3Z"/><path class="lg-w" d="M120.02,120.1c3.42,0,6.17,1.05,8.31,3.13s3.2,4.83,3.2,8.22-1.06,6.14-3.2,8.22c-2.14,2.08-4.89,3.13-8.31,3.13s-6.17-1.05-8.31-3.13c-2.14-2.08-3.2-4.83-3.2-8.22s1.06-6.14,3.2-8.22,4.89-3.13,8.31-3.13ZM120.02,139.95c2.46,0,4.44-.77,5.98-2.33,1.57-1.57,2.33-3.65,2.33-6.17s-.77-4.57-2.33-6.14c-1.53-1.57-3.52-2.33-5.98-2.33s-4.44.77-6.01,2.33c-1.53,1.57-2.3,3.61-2.3,6.14s.77,4.6,2.3,6.17c1.57,1.57,3.55,2.33,6.01,2.33Z"/><path class="lg-w" d="M149.08,142.32v-21.74h3.04v18.99h11.77v2.75h-14.8Z"/><path class="lg-w" d="M190.01,120.1c3.42,0,6.17,1.05,8.31,3.13,2.14,2.08,3.2,4.83,3.2,8.22s-1.06,6.14-3.2,8.22-4.89,3.13-8.31,3.13-6.17-1.05-8.31-3.13-3.2-4.83-3.2-8.22,1.06-6.14,3.2-8.22,4.89-3.13,8.31-3.13ZM190.01,139.95c2.46,0,4.44-.77,5.98-2.33,1.57-1.57,2.33-3.65,2.33-6.17s-.77-4.57-2.33-6.14c-1.54-1.57-3.52-2.33-5.98-2.33s-4.44.77-6.01,2.33c-1.53,1.57-2.3,3.61-2.3,6.14s.77,4.6,2.3,6.17c1.57,1.57,3.55,2.33,6.01,2.33Z"/><path class="lg-w" d="M239.52,140.53c-3.52,1.5-6.84,2.27-9.94,2.27-3.49,0-6.27-1.05-8.41-3.13s-3.2-4.86-3.2-8.28,1.09-6.11,3.29-8.19c2.21-2.08,5.12-3.1,8.73-3.1,2.53,0,5.02.35,7.48,1.02l-.61,2.85c-2.91-.61-5.15-.93-6.68-.93-2.72,0-4.89.77-6.55,2.3-1.63,1.5-2.46,3.52-2.46,6.04s.77,4.57,2.3,6.14c1.54,1.54,3.58,2.3,6.11,2.3,2.27,0,4.64-.38,7.03-1.15v-5.72h-8.25v-2.81h11.16v10.39Z"/><path class="lg-w" d="M254.42,120.58h3.45l7.13,11,7.16-11h3.45l-9.05,14.2v7.55h-3.1v-7.55l-9.05-14.2Z"/><path class="lg-w" d="M327.96,124.29c-2.85-.86-5.31-1.28-7.39-1.28-2.85,0-4.64,1.22-4.64,3.42,0,.96.42,1.66,1.22,2.11.83.45,2.27.9,4.32,1.31,2.69.54,4.22,1.06,5.72,1.98,1.54.93,2.21,2.33,2.21,4.35,0,2.14-.77,3.77-2.3,4.92-1.5,1.12-3.55,1.69-6.08,1.69-3.04,0-6.08-.61-9.08-1.82l.77-2.85c2.97,1.21,5.79,1.82,8.44,1.82,3.17,0,5.18-1.21,5.18-3.48,0-1.28-.61-2.21-1.98-2.75-1.31-.61-2.24-.8-4.19-1.18l-.67-.13c-2.46-.51-4.19-1.18-5.24-2.05-1.02-.86-1.53-2.14-1.53-3.84,0-1.92.74-3.45,2.17-4.57,1.47-1.15,3.39-1.73,5.79-1.73,2.81,0,5.5.45,8.09,1.37l-.8,2.69Z"/><path class="lg-w" d="M356.5,142.32h-3.04v-18.93h-8.28v-2.81h19.57v2.81h-8.25v18.93Z"/><path class="lg-w" d="M400.1,133.3c0,2.91-.86,5.21-2.62,6.94-1.73,1.7-4.03,2.56-6.94,2.56s-5.15-.86-6.91-2.56c-1.73-1.73-2.59-4.03-2.59-6.94v-12.73h3.04v12.73c0,4.09,2.53,6.65,6.46,6.65s6.52-2.56,6.52-6.65v-12.73h3.04v12.73Z"/><path class="lg-w" d="M434.26,123.33c2.11,2.01,3.17,4.67,3.17,7.99s-1.02,6.08-3.1,8.15-4.7,3.1-7.93,3.1c-2.21,0-4.83-.1-7.9-.26v-21.74c3.07-.16,5.56-.26,7.48-.26,3.42,0,6.17.99,8.28,3.01ZM432.02,137.43c1.47-1.54,2.21-3.58,2.21-6.11s-.77-4.48-2.27-5.95c-1.5-1.5-3.52-2.24-5.98-2.24-1.06,0-2.53.03-4.44.13v16.37c1.57.06,3.2.1,4.86.1,2.27,0,4.16-.77,5.63-2.3Z"/><path class="lg-w" d="M458.04,142.32h-3.04v-21.74h3.04v21.74Z"/><path class="lg-w" d="M487.06,120.1c3.42,0,6.17,1.05,8.31,3.13s3.2,4.83,3.2,8.22-1.06,6.14-3.2,8.22-4.89,3.13-8.31,3.13-6.17-1.05-8.31-3.13-3.2-4.83-3.2-8.22,1.06-6.14,3.2-8.22c2.14-2.08,4.89-3.13,8.31-3.13ZM487.06,139.95c2.46,0,4.44-.77,5.98-2.33,1.57-1.57,2.33-3.65,2.33-6.17s-.77-4.57-2.33-6.14c-1.53-1.57-3.52-2.33-5.98-2.33s-4.44.77-6.01,2.33c-1.53,1.57-2.3,3.61-2.3,6.14s.77,4.6,2.3,6.17c1.57,1.57,3.55,2.33,6.01,2.33Z"/></g></g></g></svg>`;

// ---------- Стилі вікна входу (вбудовані, щоб не залежати від style.css до завантаження)
const LOGIN_CSS=`
  @keyframes kr-fadein{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:none}}
  @keyframes kr-glow{0%,100%{opacity:.5}50%{opacity:1}}
  #kr-ov{
    position:fixed;inset:0;z-index:99999;
    background:radial-gradient(ellipse 800px 600px at 50% -10%,rgba(9,187,198,.18),transparent 65%),
               radial-gradient(ellipse 600px 500px at 10% 80%,rgba(91,130,255,.12),transparent 65%),
               #090d16;
    display:none;align-items:center;justify-content:center;
    padding:24px;
    font:15px/1.5 Inter,system-ui,-apple-system,sans-serif;
    color:#e8ecf4;
    overflow:auto;
  }
  #kr-card{
    width:100%;max-width:360px;
    background:linear-gradient(160deg,rgba(20,30,52,.75),rgba(10,16,32,.55));
    backdrop-filter:blur(32px) saturate(1.6);
    -webkit-backdrop-filter:blur(32px) saturate(1.6);
    border:1px solid rgba(65,95,150,.3);
    border-radius:28px;
    padding:28px 28px 26px;
    box-shadow:0 32px 80px -20px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,255,255,.08);
    animation:kr-fadein .55s cubic-bezier(.2,.8,.2,1) both;
  }
  #kr-logo-wrap{
    margin:0 auto 20px;
  }
  .kr-label{
    display:block;
    font:500 13px/1 Inter,sans-serif;
    letter-spacing:0;
    text-transform:none;
    color:rgba(128,136,170,.95);
    margin:0 0 8px;
  }
  .kr-inp{
    width:100%;box-sizing:border-box;
    padding:14px 16px;
    margin-bottom:12px;
    background:rgba(8,14,26,.7);
    border:1px solid rgba(65,95,150,.3);
    border-radius:14px;
    color:#e8ecf4;
    font:15px/1 Inter,sans-serif;
    outline:none;
    transition:border-color .2s,box-shadow .2s,background .2s;
    -webkit-appearance:none;appearance:none;
  }
  .kr-inp:focus{
    border-color:#8a82ff;
    background:rgba(111,110,254,.07);
    box-shadow:0 0 0 4px rgba(111,110,254,.18),inset 0 2px 6px rgba(0,0,0,.15);
  }
  .kr-inp::placeholder{color:rgba(126,139,166,.45)}
  #kr-err{
    font:500 13px/1.5 Inter,sans-serif;
    color:#ff8a80;
    min-height:18px;
    margin:-4px 0 10px;
    text-align:center;
  }
  #kr-btn{
    width:100%;min-height:54px;padding:0 24px;border:0;border-radius:999px;
    background:linear-gradient(100deg,#9085ff 0%,#6f6efe 45%,#4ca9ff 100%);
    color:#fff;font:500 15px/1 Inter,system-ui,sans-serif;letter-spacing:0;text-transform:none;
    display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;
    box-shadow:0 0 0 5px rgba(111,110,254,.16),0 10px 28px -8px rgba(111,110,254,.65),inset 0 1px 0 rgba(255,255,255,.28);
    transition:transform .2s cubic-bezier(.3,1.6,.5,1),box-shadow .2s;
  }
  #kr-btn:active{transform:scale(.97)}
  #kr-btn:disabled{opacity:.55;cursor:default;transform:none}
  #kr-ov, #kr-card, .kr-inp, #kr-btn {
    transition: background-color .22s ease, border-color .22s ease, color .22s ease, box-shadow .22s ease;
  }
  #kr-thm {
    position: fixed;
    top: calc(env(safe-area-inset-top, 0px) + 16px);
    right: 16px;
    z-index: 100000;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 1px solid rgba(65,95,150,.3);
    background: rgba(20,30,52,.75);
    color: #a7a0ff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 4px 12px rgba(0,0,0,.25);
    transition: transform .2s cubic-bezier(.3,1.6,.5,1), background .2s, border-color .2s;
  }
  #kr-thm:active { transform: scale(.9); }

  [data-theme="light"] #kr-ov {
    background: #f4f6fb;
    color: #121826;
  }
  [data-theme="light"] #kr-card {
    background: #ffffff;
    border: 1px solid rgba(80,105,160,.16);
    box-shadow: 0 20px 60px -15px rgba(45,60,105,.12);
  }
  [data-theme="light"] .kr-inp {
    background: #f8fafc;
    border: 1px solid rgba(80,105,160,.20);
    color: #121826;
    -webkit-text-fill-color: #121826;
  }
  [data-theme="light"] .kr-inp:focus {
    border-color: #5d5cfa;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(93,92,250,.14);
  }
  [data-theme="light"] .kr-inp::placeholder {
    color: #94a3b8;
    -webkit-text-fill-color: #94a3b8;
  }
  [data-theme="light"] .kr-label {
    color: #64748b;
  }
  [data-theme="light"] #kr-btn {
    background: linear-gradient(100deg, #5b50e6 0%, #4361ee 50%, #3b82f6 100%);
    box-shadow: 0 0 0 5px rgba(67,97,238,.16), 0 10px 28px -8px rgba(67,97,238,.55);
  }
  [data-theme="light"] #kr-err {
    color: #e11d48;
  }
  [data-theme="light"] #kr-thm {
    background: rgba(255,255,255,.9);
    border: 1px solid rgba(80,105,160,.20);
    color: #4361ee;
    box-shadow: 0 4px 14px -2px rgba(45,60,105,.1);
  }
  [data-theme="light"] .lg-w {
    fill: #121826 !important;
  }
`;

// ---------- екран входу / повідомлень
const styleEl=document.createElement('style');
styleEl.textContent=LOGIN_CSS;
document.head.appendChild(styleEl);

const ov=document.createElement('div');
ov.id='kr-ov';
document.body.appendChild(ov);

const badge=document.createElement('div');
badge.style.cssText='position:fixed;top:calc(env(safe-area-inset-top,0px) + 6px);right:8px;z-index:9999;font:600 11px Inter,system-ui,sans-serif;padding:4px 8px;border-radius:10px;background:#c0392b;color:#fff;display:none';
badge.textContent='Не збережено на сервері';document.body.appendChild(badge);

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const thmIco=()=>document.documentElement.getAttribute('data-theme')==='light'
  ?'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/></svg>'
  :'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"/></svg>';

function tgLoginThm(){
  const isLight=document.documentElement.getAttribute('data-theme')==='light';
  if(isLight){
    document.documentElement.removeAttribute('data-theme');
    try{localStorage.setItem('karelova_theme','dark')}catch(e){}
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#060a14');
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content','dark');
  }else{
    document.documentElement.setAttribute('data-theme','light');
    try{localStorage.setItem('karelova_theme','light')}catch(e){}
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#f4f6fb');
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content','light');
  }
  const b=document.getElementById('kr-thm');if(b)b.innerHTML=thmIco();
}

const show=h=>{
  ov.innerHTML=`<button id="kr-thm" aria-label="Тема" title="Змінити тему">${thmIco()}</button><div id="kr-card">${h}</div>`;
  document.getElementById('kr-thm')?.addEventListener('click',tgLoginThm);
  ov.style.display='flex';
};
const hide=()=>{ov.style.display='none'};

const btnHtml='width:100%;padding:14px;border:0;border-radius:14px;min-height:54px;background:linear-gradient(100deg,#9085ff,#6f6efe 45%,#4ca9ff);color:#fff;font:500 15px/1 Inter,sans-serif;cursor:pointer;box-shadow:0 0 0 5px rgba(111,110,254,.16),0 10px 28px -8px rgba(111,110,254,.65)';

const msg=(t,retry)=>show(
  `<div id="kr-logo-wrap">${LOGO_SVG}</div>
   <p style="line-height:1.6;margin:0 0 20px;text-align:center;color:rgba(232,236,244,.75)">${esc(t)}</p>`+
  (retry?`<button id="kr-r" style="${btnHtml}">Спробувати ще</button>`:'')
)||(retry&&document.getElementById('kr-r').addEventListener('click',()=>location.reload()));

function login(){return new Promise(res=>{
  show(`
    <div id="kr-logo-wrap">${LOGO_SVG}</div>
    <input id="kr-e" class="kr-inp" type="email" autocomplete="username" placeholder="Email" aria-label="Email">
    <input id="kr-p" class="kr-inp" type="password" autocomplete="current-password" placeholder="Пароль" aria-label="Пароль">
    <div id="kr-err"></div>
    <button id="kr-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4.5h2.5a2 2 0 012 2v11a2 2 0 01-2 2H15M10 8l4 4-4 4M14 12H4.5"/></svg>Увійти</button>
  `);
  const go=async()=>{
    const x=document.getElementById('kr-err'),b=document.getElementById('kr-btn');
    x.textContent='';b.disabled=true;b.lastChild.textContent='Вхід...';
    try{
      await auth('password',{email:document.getElementById('kr-e').value.trim(),password:document.getElementById('kr-p').value});
      hide();res();
    }catch(e){
      x.textContent=e.auth?'Невірний email або пароль':'Немає зв\u2019язку з сервером';
      b.disabled=false;b.lastChild.textContent='Увійти';
    }
  };
  document.getElementById('kr-btn').addEventListener('click',go);
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
function setDirty(v){if(v)localStorage.setItem(DK,'1');else localStorage.removeItem(DK);badge.style.display=v&&fail?'block':'none'}

function conflict(){
  alert('\u0414\u0430\u043d\u0456 \u043d\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0456 \u0437\u043c\u0456\u043d\u0435\u043d\u0456 \u0437 \u0456\u043d\u0448\u043e\u0433\u043e \u043f\u0440\u0438\u0441\u0442\u0440\u043e\u044e. \u0421\u0442\u043e\u0440\u0456\u043d\u043a\u0443 \u0431\u0443\u0434\u0435 \u043e\u043d\u043e\u0432\u043b\u0435\u043d\u043e, \u0449\u043e\u0431 \u043d\u0435 \u0432\u0442\u0440\u0430\u0442\u0438\u0442\u0438 \u0442\u0456 \u0437\u043c\u0456\u043d\u0438. \u0412\u0430\u0448\u0456 \u043e\u0441\u0442\u0430\u043d\u043d\u0456 \u043f\u0440\u0430\u0432\u043a\u0438 \u043d\u0430 \u0446\u044c\u043e\u043c\u0443 \u043f\u0440\u0438\u0441\u0442\u0440\u043e\u0457 \u043c\u043e\u0436\u0443\u0442\u044c \u043d\u0435 \u0437\u0431\u0435\u0440\u0435\u0433\u0442\u0438\u0441\u044f.');
  localStorage.removeItem(K);setDirty(false);location.reload();
}
async function push(){
  if(busy){again=true;return}
  busy=true;
  try{
    const t=await token(),h={...H(t),Prefer:'return=representation'};let r,j;
    if(ver===0){
      r=await fetch(T,{method:'POST',headers:h,body:JSON.stringify({data:db,version:1})});
      if(r.status==401)throw authErr();
      if(r.status==409){
        const rv=await fetch(T+'?select=version',{headers:H(t)});
        if(rv.status==401)throw authErr();
        const ra=rv.ok?await rv.json():[];
        if(!ra.length){busy=false;fail=true;setDirty(true);return}
        ver=ra[0].version;
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
    busy=false;fail=false;clearTimeout(retryT);setDirty(false);
  }catch(e){
    busy=false;
    if(e.auth){setDirty(true);localStorage.removeItem(SK);alert('\u0421\u0435\u0441\u0456\u044f \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043b\u0430\u0441\u044c. \u0423\u0432\u0456\u0439\u0434\u0456\u0442\u044c \u0437\u043d\u043e\u0432\u0443: \u043d\u0435\u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0456 \u0437\u043c\u0456\u043d\u0438 \u0437\u0431\u0435\u0440\u0435\u0436\u0443\u0442\u044c\u0441\u044f \u043f\u0456\u0441\u043b\u044f \u0432\u0445\u043e\u0434\u0443.');location.reload();return}
    fail=true;setDirty(true);
    clearTimeout(retryT);retryT=setTimeout(()=>{if(dirty())push()},4000);
  }
  if(again){again=false;push()}
}
function save(d){
  db=d;
  try{localStorage.setItem(K,JSON.stringify(db))}catch(e){alert('\u041f\u0430\u043c\u2019\u044f\u0442\u044c \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430 \u0437\u0430\u043f\u043e\u0432\u043d\u0435\u043d\u0430. \u0412\u0438\u0434\u0430\u043b\u0456\u0442\u044c \u0447\u0430\u0441\u0442\u0438\u043d\u0443 \u0444\u043e\u0442\u043e.')}
  setDirty(true);clearTimeout(timer);timer=setTimeout(push,600);
}
function logout(){
  if(dirty()&&!confirm('\u0404 \u0437\u043c\u0456\u043d\u0438, \u044f\u043a\u0456 \u0449\u0435 \u043d\u0435 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0456 \u043d\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0456. \u0412\u0438\u0439\u0442\u0438 \u0432\u0441\u0435 \u043e\u0434\u043d\u043e?'))return;
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
      if(c&&dirty()&&cv===s.version){db=c}
      else{db=s.data;if(c&&dirty())alert('\u041b\u043e\u043a\u0430\u043b\u044c\u043d\u0456 \u043d\u0435\u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0456 \u0437\u043c\u0456\u043d\u0438 \u0432\u0456\u0434\u043a\u0438\u043d\u0443\u0442\u043e: \u0434\u0430\u043d\u0456 \u043d\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0456 \u043d\u043e\u0432\u0456\u0448\u0456.');setDirty(false)}
      if(db){try{localStorage.setItem(K,JSON.stringify(db));localStorage.setItem(VK,String(ver))}catch(e){}}
      break;
    }catch(e){
      if(e.auth){sess=null;localStorage.removeItem(SK);continue}
      const c=cache();
      if(c){db=c;ver=+localStorage.getItem(VK)||0;break}
      return msg('\u041d\u0435\u043c\u0430\u0454 \u0437\u0432\u2019\u044f\u0437\u043a\u0443 \u0437 \u0441\u0435\u0440\u0432\u0435\u0440\u043e\u043c, \u0430 \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u0438\u0445 \u0434\u0430\u043d\u0438\u0445 \u043d\u0430 \u0446\u044c\u043e\u043c\u0443 \u043f\u0440\u0438\u0441\u0442\u0440\u043e\u0457 \u0449\u0435 \u043d\u0435\u043c\u0430\u0454.',true);
    }
  }
  window.__DB=db;window.__SAVE=save;window.__LOGOUT=logout;
  const s=document.createElement('script');s.src='js/app.js?v=54';document.body.appendChild(s);
  if(dirty())push();
})();
})();
