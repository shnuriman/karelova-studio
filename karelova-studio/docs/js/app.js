
const $=s=>document.querySelector(s),K='karelova_v1',uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tm=s=>{const[a,b]=s.split(':');return +a*60+ +b},ft=m=>String(m/60|0).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const fdt=d=>d.split('-').reverse().join('.'),money=n=>Math.round(n).toLocaleString('uk-UA')+' ₴';
const MN=['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'],DN=['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];
const ST={plan:'Заплановано',done:'Завершено',canc:'Скасовано'},cls=c=>c=='Подологія'?'mi':'pe',CATS=['Подологія','Шугаринг'];
let db=window.__DB;const save=()=>window.__SAVE(db);


if(!db){const d={};for(let i=1;i<=7;i++)d[i]={on:i<6?1:0,s:'09:00',e:'18:00'};
db={services:[['Подологія','Апаратний педикюр',700,60],['Подологія','Обробка врослого нігтя',500,45],['Шугаринг','Бікіні',400,60],['Шугаринг','Ноги повністю',600,60],['Шугаринг','Пахви',200,20]].map(a=>({id:uid(),cat:a[0],title:a[1],desc:'',price:a[2],dur:a[3]})),clients:[],appts:[],expenses:[],sched:{step:30,days:d}};save()}

const now=new Date(),S={tab:'sch',d:iso(now),m:new Date(now.getFullYear(),now.getMonth(),1),sm:new Date(now.getFullYear(),now.getMonth(),1),q:''};let cur;
const cn=id=>(db.clients.find(c=>c.id==id)||{name:'—'}).name,sv=id=>db.services.find(s=>s.id==id);
const sheet=h=>{$('#sh').innerHTML='<div class="bd" data-a="close"></div><div class="pn"><div class="hd"></div>'+h+'</div>';$('#sh').className='on'};
const P={cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',users:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16.5 14.2c2.2.1 3.6 1.6 4 4.3"/>',chart:'<path d="M5 20V11M12 20V5M19 20v-7"/>',sliders:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',imp:'<rect x="4" y="3.5" width="16" height="17" rx="3"/><circle cx="12" cy="10" r="2.6"/><path d="M7.5 17c.7-2.2 2.4-3.3 4.5-3.3s3.8 1.1 4.5 3.3"/>',file:'<path d="M6.5 3.5H14l4 4v13H6.5z"/><path d="M14 3.5v4h4"/>',search:'<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',plus:'<path d="M12 5v14M5 12h14"/>',prev:'<path d="M14.5 5.5L8 12l6.5 6.5"/>',next:'<path d="M9.5 5.5L16 12l-6.5 6.5"/>'};
const ic=n=>`<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
const TABS=[['sch','cal','Графік'],['cli','users','Клієнти'],['st','chart','Статистика'],['set','sliders','Налаштування']];
function render(){$('#v').innerHTML=({sch,cli,st,set})[S.tab]();$('#nv').style.setProperty('--i',TABS.findIndex(t=>t[0]==S.tab));$('#nv').innerHTML=TABS.map(t=>`<div role="button" tabindex="0" title="${t[2]}" aria-label="${t[2]}" class="${S.tab==t[0]?'on':''}" data-a="tab" data-v="${t[0]}">${ic(t[1])}</div>`).join('')}

function sch(){const m=S.m,y=m.getFullYear(),mo=m.getMonth(),n=new Date(y,mo+1,0).getDate(),today=iso(new Date());
let cells=DN.map(d=>`<span>${d}</span>`).join('')+'<i></i>'.repeat((new Date(y,mo,1).getDay()+6)%7);
for(let i=1;i<=n;i++){const id=iso(new Date(y,mo,i)),c=db.appts.some(a=>a.date==id&&a.status!='canc');cells+=`<b class="dy ${id==S.d?'sel':''} ${id==today?'today':''}" data-a="day" data-v="${id}">${i}${c?'<u></u>':''}</b>`}
const dt=new Date(S.d+'T00:00'),cfg=db.sched.days[(dt.getDay()+6)%7+1],step=db.sched.step,list=db.appts.filter(a=>a.date==S.d).sort((a,b)=>tm(a.start)-tm(b.start));let sl='';
if(!cfg.on)sl='<p class="mut">Вихідний день. Змінити можна в Налаштуваннях.</p>';
else for(let t=tm(cfg.s);t<tm(cfg.e);t+=step){const ap=list.filter(a=>a.status!='canc').find(a=>tm(a.start)<t+step&&tm(a.start)+a.dur>t);
if(!ap)sl+=`<div class="slot" data-a="new" data-v="${ft(t)}"><span>${ft(t)}</span><em>вільно</em></div>`;
else if(tm(ap.start)>=t){const s0=sv(ap.svc[0]);sl+=apCard(ap,s0)}}
sl+=list.filter(a=>a.status=='canc').map(a=>apCard(a,sv(a.svc[0]))).join('');
return `<h1>${MN[mo]} ${y}<span><button class="ib" data-a="pm" data-v="-1">${ic('prev')}</button> <button class="ib" data-a="pm" data-v="1">${ic('next')}</button></span></h1><div class="cd"><div class="cal">${cells}</div></div>
<h3>${dt.getDate()} ${MN[dt.getMonth()].toLowerCase().replace(/ь$/,'я').replace(/й$/,'я')}, ${DN[(dt.getDay()+6)%7]}</h3>${sl}<button class="bt" style="width:100%;margin-top:6px" data-a="new" data-v="${ft(tm(cfg.s))}">${ic('plus')} Швидкий запис</button>`}
function apCard(a,s0){return `<div class="ap ${s0?cls(s0.cat):'pe'} ${a.status=='canc'?'canc':''}" data-a="edit" data-v="${a.id}"><b><span>${esc(cn(a.cid))}</span><span>${money(a.price)}</span></b><small>${a.start}–${ft(tm(a.start)+a.dur)} · ${esc(a.svc.map(i=>(sv(i)||{}).title).filter(Boolean).join(', ')||'Без послуги')} · ${ST[a.status]}</small></div>`}

function apSheet(id,t0){const a=id?db.appts.find(x=>x.id==id):{id:'',date:S.d,start:t0,dur:db.sched.step,price:0,svc:[],status:'plan',cid:'',comment:'',photos:[]};cur=JSON.parse(JSON.stringify(a));
sheet(`<h3>${id?'Запис':'Новий запис'} · ${fdt(cur.date)}</h3><label>Клієнт</label><div class="row"><select id="xc"><option value="">Оберіть клієнта…</option>${db.clients.map(c=>`<option value="${c.id}" ${c.id==cur.cid?'selected':''}>${esc(c.name)}</option>`).join('')}</select><button class="bt sm" data-a="nc">${ic('plus')}</button></div>
<label>Послуги</label><div class="chips">${db.services.map(s=>`<span class="chip ${cls(s.cat)} ${cur.svc.includes(s.id)?'on':''}" data-a="ts" data-v="${s.id}">${esc(s.title)}</span>`).join('')||'<span class="mut">Додайте послуги в Налаштуваннях</span>'}</div>
<div class="row"><div><label>Початок</label><input id="xs" type="time" value="${cur.start}"></div><div><label>Тривалість, хв</label><input id="xd" type="number" value="${cur.dur}"></div><div><label>Ціна, ₴</label><input id="xp" type="number" value="${cur.price}"></div></div>
<label>Статус</label><select id="xt">${Object.keys(ST).map(k=>`<option value="${k}" ${k==cur.status?'selected':''}>${ST[k]}</option>`).join('')}</select>
<label>Коментар</label><textarea id="xm">${esc(cur.comment)}</textarea>
<div class="row" style="margin-top:16px">${id?'<button class="bt gh" data-a="da">Видалити</button>':''}<button class="bt" data-a="sa">Зберегти</button></div>`)}
const phs=()=>$('#ph').innerHTML=cur.photos.map((p,i)=>`<img src="${p}" data-a="dp" data-v="${i}">`).join('')+'<label for="ff">'+ic('plus')+'</label>';
const rz=f=>new Promise(r=>{const i=new Image();i.onload=()=>{const k=Math.min(1,700/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',.7))};i.src=URL.createObjectURL(f)});

function cli(){return `<h1>Клієнти <span><button class="ib" data-a="ic" aria-label="Імпорт контактів">${ic('imp')}</button> <button class="ib" data-a="cs" data-v="">${ic('plus')}</button></span></h1><div class="sr" style="margin-bottom:12px">${ic('search')}<input data-c="q" placeholder="Пошук за ім’ям або телефоном" value="${esc(S.q)}"></div><div id="cl">${cl()}</div>`}
function cl(){const q=S.q.toLowerCase(),l=db.clients.filter(c=>(c.name+c.phone).toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));
return l.map(c=>`<div class="cd li" data-a="cs" data-v="${c.id}" style="margin-bottom:8px"><span><b>${esc(c.name)}</b><br><small class="mut">${esc(c.phone||c.ig||'')}</small></span><small class="mut">${db.appts.filter(a=>a.cid==c.id).length} візитів</small></div>`).join('')||'<p class="mut">Клієнтів ще немає. Натисніть +, щоб додати першого.</p>'}
function cs(id){const c=id?db.clients.find(x=>x.id==id):{name:'',phone:'',ig:'',note:''},h=db.appts.filter(a=>a.cid==id).sort((a,b)=>b.date.localeCompare(a.date)),spent=h.filter(a=>a.status=='done').reduce((s,a)=>s+a.price,0),ig=(c.ig||'').replace(/^@/,'');
sheet(`<h3>${id?esc(c.name):'Новий клієнт'}</h3><label>Ім’я*</label><input id="cn" value="${esc(c.name)}"><label>Телефон</label><input id="cp" type="tel" placeholder="+380…" value="${esc(c.phone)}">
<div id="mo" style="${id?'':'display:none'}"><label>Instagram / Telegram</label><input id="ci" value="${esc(c.ig)}"><label>Примітки (алергії, особливості стоп)</label><textarea id="cm">${esc(c.note)}</textarea></div>
${id?'':'<p class="mut" data-a="mo" style="color:var(--pe2);cursor:pointer">Детальне додавання ▾</p>'}
${id?`<div class="row" style="margin-top:10px">${c.phone?`<a class="bt gh" style="text-align:center;text-decoration:none" href="tel:${esc(c.phone)}">Подзвонити</a>`:''}${ig?`<a class="bt gh" style="text-align:center;text-decoration:none" target="_blank" href="${ig.startsWith('http')?esc(ig):'https://instagram.com/'+esc(ig)}">Соцмережа</a>`:''}</div>
<div class="cd" style="margin-top:12px"><b>Витрачено: ${money(spent)}</b><br><small class="mut">Історія візитів (${h.length})</small>${h.map(a=>`<div class="li" data-a="edit" data-v="${a.id}"><span>${fdt(a.date)} · ${esc(a.svc.map(i=>(sv(i)||{}).title).filter(Boolean).join(', ')||'—')}</span><small>${money(a.price)}</small></div>`).join('')}</div>`:''}
<div class="row" style="margin-top:14px">${id?`<button class="bt gh" data-a="dc" data-v="${id}">Видалити</button>`:''}<button class="bt" data-a="sc" data-v="${id||''}">Зберегти</button></div>`)}

function st(){const y=S.sm.getFullYear(),mo=S.sm.getMonth(),k=y+'-'+String(mo+1).padStart(2,'0'),done=db.appts.filter(a=>a.status=='done'&&a.date.startsWith(k)),ex=db.expenses.filter(e=>e.date.startsWith(k)).sort((a,b)=>b.date.localeCompare(a.date));
const inc=done.reduce((s,a)=>s+a.price,0),out=ex.reduce((s,e)=>s+e.amount,0),cs={Подологія:0,Шугаринг:0};
done.forEach(a=>{const ss=a.svc.map(sv).filter(Boolean),t=ss.reduce((x,s)=>x+s.price,0);ss.forEach(s=>cs[s.cat]+=t?a.price*s.price/t:0)});const mx=Math.max(1,cs.Подологія+cs.Шугаринг);
return `<h1>${MN[mo]} ${y}<span><button class="ib" data-a="ps" data-v="-1">${ic('prev')}</button> <button class="ib" data-a="ps" data-v="1">${ic('next')}</button></span></h1>
<div class="cd" style="background:var(--pe)"><small>Чистий прибуток</small><b style="display:block;font-size:34px">${money(inc-out)}</b></div>
<div class="kp"><div class="cd"><small class="mut">Дохід</small><b>${money(inc)}</b></div><div class="cd"><small class="mut">Витрати</small><b>${money(out)}</b></div><div class="cd"><small class="mut">Клієнтів</small><b>${new Set(done.map(a=>a.cid)).size}</b></div><div class="cd"><small class="mut">Завершених записів</small><b>${done.length}</b></div></div>
<div class="cd" style="margin-top:10px"><b>Дохід за напрямками</b>${CATS.map(c=>`<div style="margin-top:8px;display:flex;justify-content:space-between"><span>${c}</span><span>${money(cs[c])}</span></div><div class="bar"><i style="width:${cs[c]/mx*100}%;background:var(${c=='Подологія'?'--mi2':'--pe2'})"></i></div>`).join('')}</div>
<h3 style="display:flex;justify-content:space-between">Витрати <button class="ib" data-a="es" data-v="">${ic('plus')}</button></h3>${ex.map(e=>`<div class="cd li" data-a="es" data-v="${e.id}" style="margin-bottom:8px"><span>${esc(e.cat)}<br><small class="mut">${fdt(e.date)} ${esc(e.desc)}</small></span><b>${money(e.amount)}</b></div>`).join('')||'<p class="mut">Витрат за місяць немає.</p>'}`}
function es(id){const e=id?db.expenses.find(x=>x.id==id):{cat:'Матеріали',amount:'',date:iso(new Date()),desc:''};
sheet(`<h3>Витрата</h3><label>Категорія</label><select id="ec">${['Матеріали','Оренда','Інструменти','Реклама'].map(c=>`<option ${c==e.cat?'selected':''}>${c}</option>`).join('')}</select><label>Сума, ₴</label><input id="ea" type="number" value="${e.amount}"><label>Дата</label><input id="ed" type="date" value="${e.date}"><label>Коментар</label><input id="eo" value="${esc(e.desc)}">
<div class="row" style="margin-top:14px">${id?`<button class="bt gh" data-a="de" data-v="${id}">Видалити</button>`:''}<button class="bt" data-a="se" data-v="${id||''}">Зберегти</button></div>`)}

function set(){const d=db.sched.days;return `<h1>Налаштування</h1><h3>Графік роботи</h3><div class="cd">${DN.map((n,i)=>`<div class="dr"><input type="checkbox" data-c="on" data-d="${i+1}" ${d[i+1].on?'checked':''}><b>${n}</b><input type="time" data-c="s" data-d="${i+1}" value="${d[i+1].s}"><input type="time" data-c="e" data-d="${i+1}" value="${d[i+1].e}"></div>`).join('')}
<label>Крок слотів</label><select data-c="step">${[15,30,60].map(x=>`<option value="${x}" ${x==db.sched.step?'selected':''}>${x} хв</option>`).join('')}</select></div>
<h3 style="display:flex;justify-content:space-between;margin-top:18px">Каталог послуг <button class="ib" data-a="ss" data-v="">${ic('plus')}</button></h3>${CATS.map(c=>`<small class="mut">${c}</small>${db.services.filter(s=>s.cat==c).map(s=>`<div class="ap ${cls(c)}" data-a="ss" data-v="${s.id}"><b><span>${esc(s.title)}</span><span>${money(s.price)}</span></b><small>${s.dur} хв</small></div>`).join('')||'<p class="mut">Порожньо</p>'}`).join('')}<h3 style=\"margin-top:18px\">Дані</h3><div class=\"row\"><button class=\"bt gh\" data-a=\"ex\">Експорт копії</button><button class=\"bt gh\" data-a=\"im\">Імпорт копії</button></div><div class=\"row\" style=\"margin-top:10px\"><button class=\"bt gh\" data-a=\"lo\">Вийти</button></div>`}
function ss(id){const s=id?sv(id):{cat:'Подологія',title:'',desc:'',price:'',dur:60};
sheet(`<h3>Послуга</h3><label>Категорія</label><select id="sc">${CATS.map(c=>`<option ${c==s.cat?'selected':''}>${c}</option>`).join('')}</select><label>Назва</label><input id="st" value="${esc(s.title)}"><label>Опис</label><textarea id="sd">${esc(s.desc)}</textarea>
<div class="row"><div><label>Ціна, ₴</label><input id="sp" type="number" value="${s.price}"></div><div><label>Тривалість, хв</label><input id="su" type="number" value="${s.dur}"></div></div>
<div class="row" style="margin-top:14px">${id?`<button class="bt gh" data-a="ds" data-v="${id}">Видалити</button>`:''}<button class="bt" data-a="sv" data-v="${id||''}">Зберегти</button></div>`)}

const V=i=>$('#'+i).value,done=()=>{$('#sh').className='';render()};
function rd(){cur.cid=V('xc');cur.start=V('xs');cur.dur=+V('xd')||db.sched.step;cur.price=+V('xp')||0;cur.status=V('xt');cur.comment=V('xm')}
const A={lo:()=>window.__LOGOUT(),ic:()=>impOpen(),pk:async()=>{try{const r=await navigator.contacts.select(['name','tel'],{multiple:true});impList(r.map(c=>({name:(c.name||[])[0]||'',phone:(c.tel||[])[0]||''})))}catch(e){}},
ia:()=>{const on=!IMP.every(c=>c.dup||c.on);IMP.forEach(c=>{if(!c.dup)c.on=on});$('#il').innerHTML=impRows($('#iq').value.toLowerCase());icnt()},
is:()=>{const n=IMP.filter(c=>c.on&&!c.dup);if(!n.length)return;n.forEach(c=>db.clients.push({id:uid(),name:c.name,phone:c.phone,ig:'',note:''}));save();done()},ex:()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db)],{type:'application/json'}));a.download='karelova-data.json';a.click()},im:()=>$('#fi').click(),close:()=>$('#sh').className='',tab:v=>{S.tab=v;render()},day:v=>{S.d=v;render()},pm:v=>{S.m=new Date(S.m.getFullYear(),S.m.getMonth()+ +v,1);render()},ps:v=>{S.sm=new Date(S.sm.getFullYear(),S.sm.getMonth()+ +v,1);render()},
new:v=>apSheet('',v),edit:v=>apSheet(v),
nc:()=>{const n=prompt('Ім’я клієнта');if(!n)return;const c={id:uid(),name:n,phone:'',ig:'',note:''};db.clients.push(c);save();$('#xc').add(new Option(n,c.id,true,true))},
ts:(v,t)=>{t.classList.toggle('on');cur.svc=cur.svc.includes(v)?cur.svc.filter(x=>x!=v):[...cur.svc,v];const ss=cur.svc.map(sv).filter(Boolean);$('#xp').value=ss.reduce((x,s)=>x+s.price,0);$('#xd').value=ss.reduce((x,s)=>x+s.dur,0)||db.sched.step},
dp:v=>{cur.photos.splice(+v,1);phs()},
sa:()=>{rd();if(!cur.cid)return alert('Оберіть або додайте клієнта');if(cur.id)db.appts=db.appts.map(a=>a.id==cur.id?cur:a);else{cur.id=uid();db.appts.push(cur)}save();done()},
da:()=>{if(confirm('Видалити запис?')){db.appts=db.appts.filter(a=>a.id!=cur.id);save();done()}},
cs:v=>cs(v),mo:()=>$('#mo').style.display='block',
sc:v=>{if(!V('cn').trim())return alert('Вкажіть ім’я');const o={name:V('cn').trim(),phone:V('cp').trim(),ig:$('#ci')?V('ci'):'',note:$('#cm')?V('cm'):''};if(v)Object.assign(db.clients.find(c=>c.id==v),o);else db.clients.push({id:uid(),...o});save();done()},
dc:v=>{if(db.appts.some(a=>a.cid==v))return alert('У клієнта є записи. Спочатку видаліть їх.');if(confirm('Видалити клієнта?')){db.clients=db.clients.filter(c=>c.id!=v);save();done()}},
es:v=>es(v),se:v=>{const o={cat:V('ec'),amount:+V('ea')||0,date:V('ed'),desc:V('eo')};if(v)Object.assign(db.expenses.find(e=>e.id==v),o);else db.expenses.push({id:uid(),...o});save();done()},de:v=>{db.expenses=db.expenses.filter(e=>e.id!=v);save();done()},
ss:v=>ss(v),sv:v=>{if(!V('st').trim())return alert('Вкажіть назву');const o={cat:V('sc'),title:V('st').trim(),desc:V('sd'),price:+V('sp')||0,dur:+V('su')||30};if(v)Object.assign(sv(v),o);else db.services.push({id:uid(),...o});save();done()},ds:v=>{if(confirm('Видалити послугу?')){db.services=db.services.filter(s=>s.id!=v);save();done()}}};
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(t&&A[t.dataset.a])A[t.dataset.a](t.dataset.v,t)});
document.addEventListener('input',e=>{if(e.target.id=='iq'){$('#il').innerHTML=impRows(e.target.value.toLowerCase());return}
if(e.target.dataset.c=='q'){S.q=e.target.value;$('#cl').innerHTML=cl()}});
document.addEventListener('change',async e=>{const t=e.target,c=t.dataset.c;
if(t.id=='fv'){const f=t.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const x=String(r.result);impList(/BEGIN:VCARD/i.test(x)?vcf(x):csv(x))};r.readAsText(f);return}
if(c=='ip'){IMP[+t.dataset.d].on=t.checked;icnt();return}
if(t.id=='fi'){const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(!o.services)throw 0;db=o;save();render()}catch(x){alert('Некоректний файл')}};r.readAsText(t.files[0]);return}
if(t.id=='ff'){for(const f of t.files)cur.photos.push(await rz(f));phs();return}
if(c=='step')db.sched.step=+t.value;else if(c&&t.dataset.d)db.sched.days[t.dataset.d][c]=c=='on'?(t.checked?1:0):t.value;else return;save()});
/* ---- імпорт контактів: Contact Picker (Android Chrome) або файл .vcf / .csv ---- */
let IMP=[];
const nph=p=>{p=(p||'').split(':::')[0].replace(/[^\d+]/g,'');if(/^0\d{9}$/.test(p))return '+38'+p;if(/^380\d{9}$/.test(p))return '+'+p;return p};
const icnt=()=>{const e=$('#icn');if(e)e.textContent=IMP.filter(c=>c.on&&!c.dup).length};
const impRows=q=>IMP.map((c,i)=>(c.name+c.phone).toLowerCase().includes(q)?`<label class="cd li" style="margin:0 0 6px;display:flex;align-items:center;gap:10px;color:var(--tx);font-size:15px;cursor:pointer"><input type="checkbox" style="width:20px;flex:none" data-c="ip" data-d="${i}" ${c.on?'checked':''} ${c.dup?'disabled':''}><span style="flex:1"><b>${esc(c.name)}</b><br><small class="mut">${esc(c.phone)}${c.dup?' · вже є':''}</small></span></label>`:'').join('');
function impOpen(){IMP=[];sheet(`<h3>Імпорт контактів</h3><p class="mut">Оберіть контакти з телефону або завантажте файл. iPhone: Контакти → виділити → Поділитися → vCard. Android: Контакти → Експорт (.vcf). Підходить і CSV з Google Контактів.</p>${('contacts' in navigator&&'ContactsManager' in window)?'<button class="bt" style="width:100%;margin-bottom:8px" data-a="pk">'+ic('imp')+' Обрати з телефонної книги</button>':''}<label class="bt gh" style="display:block;text-align:center;margin:0;font-size:15px;color:var(--ac2)" for="fv">${ic('file')} Завантажити файл контактів</label><input type="file" id="fv" accept=".vcf,.csv,text/vcard,text/csv" hidden>`)}
function impList(l){const have=new Set(db.clients.map(c=>nph(c.phone)).filter(Boolean));
IMP=l.map(c=>({name:(c.name||'').trim(),phone:nph(c.phone)})).filter(c=>c.name||c.phone).map(c=>({name:c.name||c.phone,phone:c.phone,dup:!!c.phone&&have.has(c.phone),on:false}));
if(!IMP.length)return alert('Контактів у файлі не знайдено');
sheet(`<h3>Знайдено: ${IMP.length}</h3><div class="sr">${ic('search')}<input id="iq" placeholder="Пошук"></div><div class="row" style="margin:10px 0"><button class="bt gh" data-a="ia">Обрати всіх</button><button class="bt" data-a="is">Додати (<span id="icn">0</span>)</button></div><div id="il">${impRows('')}</div>`)}
function vcf(t){t=t.replace(/\r/g,'').replace(/\n[ \t]/g,'');return t.split(/BEGIN:VCARD/i).slice(1).map(b=>{const g=k=>{const m=b.match(new RegExp('^(?:item\\d+\\.)?'+k+'[^:\\n]*:(.*)$','im'));return m?m[1].trim():''};let n=g('FN');if(!n)n=g('N').split(';').filter(Boolean).reverse().join(' ');return{name:n.replace(/\\,/g,','),phone:g('TEL')}})}
function csv(t){const rows=[];let r=[],f='',q=0;for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch=='"'){if(t[i+1]=='"'){f+='"';i++}else q=0}else f+=ch}else if(ch=='"')q=1;else if(ch==','||ch==';'){r.push(f);f=''}else if(ch=='\n'){r.push(f);rows.push(r);r=[];f=''}else if(ch!='\r')f+=ch}r.push(f);rows.push(r);
const h=rows[0].map(x=>x.trim().toLowerCase()),ni=h.findIndex(x=>/^name$|display|^повне/.test(x)),fi=h.findIndex(x=>/first|given|^ім/.test(x)),li=h.findIndex(x=>/last|family|прізв/.test(x)),pi=h.findIndex(x=>/phone.*value|^phone|^tel|тел|mobile/.test(x));
return rows.slice(1).map(r=>({name:ni>=0&&r[ni]?r[ni]:[r[fi],r[li]].filter(Boolean).join(' '),phone:pi>=0?r[pi]||'':''}))}

render();

setTimeout(()=>{const p=document.getElementById('splash');p&&p.classList.add('off')},2300);
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});

document.addEventListener('keydown',e=>{const t=e.target;if(e.key=='Enter'&&t.getAttribute&&t.getAttribute('role')=='button')t.click()});
