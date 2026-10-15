
/* ── TOAST HELPER ───────────────────────────────────────────── */
window.toast = function(msg, type) {
  type = type || 'ok';
  const ct = document.getElementById('toast-ct');
  if (!ct) return;
  const t = document.createElement('div');
  t.className = 'tst ' + type;
  t.textContent = msg;
  ct.prepend(t);
  setTimeout(function() {
    t.style.transition = 'opacity .25s, transform .25s';
    t.style.opacity = '0';
    t.style.transform = 'translateY(-6px)';
    setTimeout(function() { t.remove(); }, 260);
  }, type == 'ok' ? 1600 : 2600);
};

/* ── CORE UTILS ─────────────────────────────────────────────── */
const $ = s => document.querySelector(s);
const K = 'karelova_v1';
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tm  = s => { const [a, b] = s.split(':'); return +a * 60 + +b; };
const ft  = m => String(m / 60 | 0).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const fdt = d => d.split('-').reverse().join('.');
const money = n => Math.round(n).toLocaleString('uk-UA') + ' ₴';
const nph = p => {
  p = (p || '').split(':::')[0].replace(/[^\d+]/g, '');
  if (/^0\d{9}$/.test(p)) return '+38' + p;
  if (/^380\d{9}$/.test(p)) return '+' + p;
  return p;
};

const MN = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
const MN_GEN = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
const DN = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];
const ST = { plan: 'Заплановано', done: 'Завершено', canc: 'Скасовано' };
const cls = c => c === 'Подологія' ? 'mi' : 'pe';
const CATS = ['Подологія', 'Шугаринг'];

let db = window.__DB;
const save = () => window.__SAVE(db);

/* ── DB INIT ────────────────────────────────────────────────── */
if (!db) {
  const d = {};
  for (let i = 1; i <= 7; i++) d[i] = { on: i < 6 ? 1 : 0, s: '09:00', e: '18:00' };
  db = {
    services: [],
    clients: [],
    appts: [],
    expenses: [],
    products: [],
    sales: [],
    sched: { step: 30, days: d },
  };
  save();
}
db.products = db.products || [];
db.sales = db.sales || [];

// Прапорці одноразових міграцій живуть у самих даних (db.mig), а не в localStorage пристрою.
// Інакше кожен новий девайс "скидав" і перезаповнював дані на сервері.
db.mig = db.mig || {};
if (!db.mig._init) {
  if ((db.clients || []).length || (db.appts || []).length || (db.services || []).length) {
    ['reset', 'clients', 'services', 'sep2026'].forEach(k => { db.mig[k] = 1; });
  }
  db.mig._init = 1;
}
const migDone = k => !!db.mig[k];
const migSet = k => { db.mig[k] = 1; };

// Одноразове скидання тестових записів, клієнтів та послуг
const RESET_KEY = 'karelova_reset_v1';
try {
  if (!migDone('reset')) {
    db.appts = [];
    db.clients = [];
    db.services = [];
    db.expenses = [];
    db.products = [];
    db.sales = [];
    if (db.sched && db.sched.over) db.sched.over = {};
    migSet('reset');
    save();
  }
} catch (e) {}

// Одноразове заповнення каталогу продукції (стартові позиції догляду)
try {
  if (!migDone('products_v1')) {
    if (!db.products.length) {
      db.products = [
        { id: uid(), title: 'Крем для стоп з сечовиною 10%', brand: 'Baehr', vol: '100 мл', cost: 320, price: 550, note: 'Для сухої шкіри стоп' },
        { id: uid(), title: 'Олія монарди для нігтів та кутикули', brand: 'Podopharm', vol: '30 мл', cost: 280, price: 480, note: 'Антибактеріальний та відновлювальний догляд' },
        { id: uid(), title: 'Спрей-дезодорант для ніг', brand: 'SUDA Care', vol: '150 мл', cost: 360, price: 620, note: 'Зниження пітливості та захист' },
      ];
      save();
    }
    migSet('products_v1');
  }
} catch (e) {}

// Одноразове заповнення клієнтів
const SEED_CLIENTS_KEY = 'karelova_seed_clients_v1';
try {
  if (!migDone('clients')) {
    const raw = [
      'Аліка','Ксюша (+380967012306)','Людмила','Софія','Вікторія',
      'Галина Володимирівна','Максим Микитюк','Крістіна','Валентина Василівна','Зоя',
      'Настя інстаграм (+380937105859)','Надя Олійник','Аня','Артем','Олена',
      'Сергій','Ігор','Матвій Лисий','Віталіна','Олексій',
      'Лєна Аксентюк','Марічка','Ольга','Марина (Старлайф)','Алла (+380968087688)',
      'Оксана Савіцька','Надя Калакайчук','Володимир тато Ані Стомат','Лариса','Марта Віки кури',
      'Любов Михайлівна Забігайло','Тетяна (Вайбер)','Юлія','Лєра Альони (ЦНАП)','Юлія (+380985821335)',
      'Люда','Галина Миколаївна','Ліза Львів','Галя Ксюхи Григорчук','Сашка Атаманюк',
      'Олесь чоловік Віки кури (+380683461288)','Руслан','Наташа Лачова','Аня (Стоматологія)','Ксюха Григорчук',
      'Юля Григорчук','Антон Драган','Альон Подра','Володимир Криворчук','Сергій Петрович',
      'Аліна (Вайт Хорс)','Аня Сьоміна','Олена Зеленська','Маша від Казівої','Ніка Доценко',
      'Катя Лози','Мама Марина Малишка Софія','Тетяна','Філя Віки Комісарчук','Ліза Твардов',
      'Таня перукарка','Олександр Гурський','Мала (Врослий ніготь)','Чоловік Анька Федорова','Наталія Рева',
      'Олена Собков','Мар\'яна (Дубово)','Ірина Мельничук','Андрій','Оля Бандура',
      'Михайло Плай (+380983001010)','Світлана (+380682029996)','Баришнікова Олена (+380679659481)','Анна з дитиною','Наталка Лужняк',
      'Оксана Мілани мама','Аміна','Сашка Колесникова','Олександр','Мала Віки Федорук',
      'Наталка Лачова','Тетяна закордон (+380685242936)','Ксюха Катеринчук','Валентина Барб','Альона (ЦНАП)',
      'Наташка (Машини)','Лєна (+380967384775)','Наташа (Двір)','Алла (+380671360087)','Наталія (+380970441221)',
      'Ліля Станіславівна з мамою (+380509288424)','Віка Кури','Наташка Дурдас','Крістіна Іконнікова','Іра Ооексюк',
      'Олексій (+380970648696)','Юля Бабій','Вєра','Люда Морозовська','Оля Дряхлова',
      'Віка Комісарчук','Сашка ортопедичний','Аліна (+380967205508)','Ярослава','Альона Комісарчук',
      'Марія (+380978920202)','Маріанна Циганкової','Катя Сморкалова','Георгій','Настя Бабій',
      'Мама Ксюхи Григорчук','Таня (Масажистка)','Оля (Манік)','Тоня (Лезнево)','Вікторія Звезда',
      'Віка Синозацька','Наталія (+380982312065)','Тоня Аліни Медпред (+380673927825)','Юлія (+380638122056)','Оля перукарка',
      'Владислав','Маша Новіцька','Сергій врослий ніготь','Наташа Шендера','Аліна Лачової колега',
      'Мілана','Таня Михайловська','Тетяна з малим врослий ніготь (+380980458370)','Ніна Олександрівна','Соня Олексюк',
      'Мар\'яна Потоцькі','Таня Ткачук (Перукарка)','Катька кума Лози','Зоряна (+380989510225)','Марина Новіцька',
      'Вера','Іра Заправка','Вікторія (+380680134586)','Аліна Гаджала','Маша Самолюк Юльки',
      'Надя Драган Подри мама','Паша Наді Дубово','Христина Іконнікова','Альона Подра','Оля (Психолог)',
      'Іра Олексюк','Лєра Синозацька','Ксюха Лыса Бондар','Оксана адвокат','Альонин папа',
      'Оля Хоптяр','Настя Кибалка','Аня Веденська','Наташа Лужняк','Ліза Аксентюк',
      'Маша Наталки Юзина','Света Тимчишина','Алла Шевчук','Людмила (+380974625662)','Юля Катьки кума',
      'Настя Тані мала','Інна пенсійний','Ліна Бондар','Каріна Яструб','Аліса Вахнован',
      'Таня Синозацька','Саша Атаманюк','Марина Ескулаб','Оля Лозіка','Ельдар',
      'Лєна Хамська','Альона від Ксюхи','Олександра ортопедичний','Тетяна кухар','Вера школа',
      'Катя Калакайчук','Настя Польша','Аня Федорова','Віка нова','Наталка Бавовна',
      'Наталі машини','Галя базар','Оля (перукарка)',
    ];
    const phoneRx = /\s*\((\+38\d[\d\s]*)\)\s*$/;
    raw.forEach(entry => {
      const m = entry.match(phoneRx);
      const phone = m ? m[1].replace(/\s/g, '') : '';
      const name  = m ? entry.replace(phoneRx, '').trim() : entry.trim();
      db.clients.push({ id: uid(), name, phone, ig: '', note: '' });
    });
    migSet('clients');
    save();
  }
} catch (e) {}

// Одноразове заповнення послуг (Шугаринг та Подологія)
const SEED_SERVICES_KEY = 'karelova_seed_services_v1';
try {
  if (!migDone('services')) {
    const defaultServices = [
      // Шугаринг
      { cat: 'Шугаринг', title: 'Личко', desc: '', price: 100, dur: 15 },
      { cat: 'Шугаринг', title: 'Підмишки', desc: '', price: 250, dur: 10 },
      { cat: 'Шугаринг', title: 'Руки', desc: '', price: 400, dur: 15 },
      { cat: 'Шугаринг', title: 'Ноги до колін', desc: '', price: 450, dur: 30 },
      { cat: 'Шугаринг', title: 'Ноги повністю', desc: '', price: 600, dur: 60 },
      { cat: 'Шугаринг', title: 'Бікіні класичне', desc: '', price: 400, dur: 15 },
      { cat: 'Шугаринг', title: 'Бікіні глибоке', desc: '', price: 500, dur: 30 },
      // Подологія
      { cat: 'Подологія', title: 'Видалення стержневої мозолі', desc: '', price: 700, dur: 30 },
      { cat: 'Подологія', title: 'Догляд за діабетичною стопою', desc: '', price: 1000, dur: 60 },
      { cat: 'Подологія', title: 'Апаратний педикюр', desc: '', price: 800, dur: 60 },
      { cat: 'Подологія', title: 'Консультація подолога', desc: '', price: 500, dur: 60 },
      { cat: 'Подологія', title: 'Медичний педикюр', desc: '', price: 1000, dur: 60 },
      { cat: 'Подологія', title: 'Апаратна обробка проблемної стопи', desc: '', price: 1200, dur: 60 },
      { cat: 'Подологія', title: 'Видалення натоптишів', desc: '', price: 800, dur: 30 },
      { cat: 'Подологія', title: 'Видалення мозолів', desc: '', price: 500, dur: 30 },
      { cat: 'Подологія', title: 'Лікування врослого нігтя', desc: '', price: 1000, dur: 60 },
      { cat: 'Подологія', title: "Лікування тріщин п'ят", desc: '', price: 600, dur: 60 },
      { cat: 'Подологія', title: 'Оніхолізис (лікування порожнечі під нігтем)', desc: '', price: 1400, dur: 60 },
      { cat: 'Подологія', title: 'Обробка нігтів при грибкових ураженнях', desc: '', price: 800, dur: 60 },
    ];
    defaultServices.forEach(s => {
      if (!db.services.some(x => x.title === s.title)) {
        db.services.push({ id: uid(), ...s });
      }
    });
    migSet('services');
    save();
  }
} catch (e) {}

// Одноразове заповнення записів за вересень 2026 року
const SEED_APPTS_SEP2026_KEY = 'karelova_seed_appts_sep2026_v1';
try {
  if (!migDone('sep2026')) {
    const findClient = name => {
      const q = name.trim().toLowerCase();
      let cl = db.clients.find(c => c.name.toLowerCase() === q);
      if (cl) return cl;
      const nq = q.replace(/['’\`]/g, '').replace(/[\(\)]/g, '').replace(/\s+/g, ' ');
      cl = db.clients.find(c => {
        const nx = c.name.toLowerCase().replace(/['’\`]/g, '').replace(/[\(\)]/g, '').replace(/\s+/g, ' ');
        return nx === nq;
      });
      if (cl) return cl;
      return db.clients.find(c => {
        const nx = c.name.toLowerCase().replace(/['’\`]/g, '').replace(/[\(\)]/g, '').replace(/\s+/g, ' ');
        return nx.includes(nq) || nq.includes(nx);
      });
    };

    const findService = name => {
      let q = name.trim().toLowerCase();
      if (q.startsWith('бикіні')) q = q.replace('бикіні', 'бікіні');
      return db.services.find(s => s.title.toLowerCase() === q);
    };

    const rawAppts = [
      // 2 вересня (середа)
      { d: '2026-09-02', s: '14:00', dur: 60, c: 'Олена', v: ['Медичний педикюр'] },
      { d: '2026-09-02', s: '16:00', dur: 60, c: 'Олесь чоловік Віки кури', v: ['Апаратний педикюр'] },

      // 3 вересня (четвер)
      { d: '2026-09-03', s: '09:15', dur: 30, c: 'Ксюха Лыса Бондар', v: ['Бікіні глибоке'] },
      { d: '2026-09-03', s: '11:00', dur: 30, c: 'Зоя', v: ['Консультація подолога'], m: 'вросший ніготь' },
      { d: '2026-09-03', s: '11:30', dur: 30, c: 'Галя Ксюхи Григорчук', v: ['Консультація подолога'] },
      { d: '2026-09-03', s: '12:00', dur: 60, c: 'Оля Хоптяр', v: ['Підмишки', 'Ноги повністю', 'Бікіні глибоке'] },
      { d: '2026-09-03', s: '13:00', dur: 30, c: 'Оксана адвокат', v: ['Бікіні глибоке'] },
      { d: '2026-09-03', s: '13:30', dur: 60, c: 'Настя інстаграм', v: ['Апаратний педикюр'], m: '+ зняття покриття' },
      { d: '2026-09-03', s: '16:00', dur: 30, c: 'Вера школа', v: ['Бікіні глибоке'] },
      { d: '2026-09-03', s: '18:30', dur: 30, b: 'збори в Єгора' },

      // 4 вересня (п\'ятниця)
      { d: '2026-09-04', s: '18:00', dur: 60, c: 'Матвій Лисий', v: ['Консультація подолога'] },

      // 5 вересня (субота)
      { d: '2026-09-05', s: '09:30', dur: 30, c: 'Наташка (Машини)', v: ['Бікіні глибоке'] },
      { d: '2026-09-05', s: '10:00', dur: 60, c: 'Надя Олійник', v: ['Медичний педикюр'] },

      // 7 вересня (понеділок)
      { d: '2026-09-07', s: '10:00', dur: 30, c: 'Юля Григорчук', v: ['Бікіні глибоке'] },

      // 9 вересня (середа)
      { d: '2026-09-09', s: '09:30', dur: 60, c: 'Валентина Василівна', v: ['Консультація подолога'] },
      { d: '2026-09-09', s: '10:30', dur: 60, c: 'Крістіна', v: ['Консультація подолога'], m: 'вросший ніготь' },
      { d: '2026-09-09', s: '12:00', dur: 70, c: 'Ліна Бондар', v: ['Підмишки', 'Ноги до колін', 'Бікіні глибоке'] },
      { d: '2026-09-09', s: '15:00', dur: 30, b: 'Анна Станіславівна (вихователь в металісті)' },
      { d: '2026-09-09', s: '18:00', dur: 60, b: 'збори в Жені' },

      // 10 вересня (четвер)
      { d: '2026-09-10', s: '10:00', dur: 30, b: 'Катька дип' },
      { d: '2026-09-10', s: '11:00', dur: 30, b: 'на укол' },
      { d: '2026-09-10', s: '11:30', dur: 30, c: 'Ксюха Катеринчук', v: ['Бікіні глибоке'] },
      { d: '2026-09-10', s: '12:00', dur: 160, c: 'Таня Синозацька', v: ['Підмишки', 'Ноги повністю', 'Бікіні глибоке', 'Апаратний педикюр'] },
      { d: '2026-09-10', s: '16:00', dur: 30, c: 'Іра Ооексюк', v: ['Підмишки', 'Ноги до колін', 'Бікіні глибоке'] },
      { d: '2026-09-10', s: '16:30', dur: 30, c: 'Аня Веденська', v: ['Підмишки', 'Бікіні глибоке'] },
      { d: '2026-09-10', s: '17:00', dur: 100, c: 'Аня Федорова', v: ['Підмишки', 'Ноги повністю', 'Бікіні глибоке'] },

      // 15 вересня (вівторок)
      { d: '2026-09-15', s: '12:00', dur: 60, c: 'Аліна (Вайт Хорс)', v: ['Апаратний педикюр'] },
      { d: '2026-09-15', s: '14:40', dur: 90, c: 'Надя Калакайчук', v: ['Ноги повністю', 'Бікіні глибоке'] },
      { d: '2026-09-15', s: '16:30', dur: 30, c: 'Іра Заправка', v: ['Бікіні глибоке'] },

      // 16 вересня (середа)
      { d: '2026-09-16', s: '12:30', dur: 30, c: 'Юля Бабій', v: ['Бікіні глибоке'] },
      { d: '2026-09-16', s: '13:00', dur: 60, c: 'Галина Володимирівна', v: ['Консультація подолога'], m: 'вросший ніготь' },

      // 17 вересня (четвер)
      { d: '2026-09-17', s: '12:00', dur: 30, c: 'Алла Шевчук', v: ['Бікіні глибоке'] },

      // 19 вересня (субота)
      { d: '2026-09-19', s: '10:00', dur: 60, c: 'Матвій Лисий', v: ['Консультація подолога'] },

      // 20 вересня (неділя)
      { d: '2026-09-20', s: '11:00', dur: 60, c: 'Ліза Аксентюк', v: ['Підмишки', 'Ноги повністю'] },
      { d: '2026-09-20', s: '12:00', dur: 40, c: 'Альон Подра', v: ['Бікіні глибоке'] },
      { d: '2026-09-20', s: '13:30', dur: 75, c: 'Ліза Львів', v: ['Личко', 'Ноги повністю'] },

      // 22 вересня (вівторок)
      { d: '2026-09-22', s: '11:00', dur: 30, c: 'Наташа Лачова', v: [] },
      { d: '2026-09-22', s: '15:00', dur: 60, c: 'Галина Миколаївна', v: ['Консультація подолога'] },
      { d: '2026-09-22', s: '17:00', dur: 60, c: 'Аліна Лачової колега', v: ['Апаратний педикюр'] },

      // 23 вересня (середа)
      { d: '2026-09-23', s: '16:00', dur: 90, c: 'Оля Бандура', v: ['Ноги повністю', 'Бікіні глибоке'] },

      // 24 вересня (четвер)
      { d: '2026-09-24', s: '14:30', dur: 60, c: 'Софія', v: ['Консультація подолога'], m: 'вросший ніготь' },
      { d: '2026-09-24', s: '17:30', dur: 30, c: 'Таня Михайловська', v: ['Бікіні глибоке'] },
      { d: '2026-09-24', s: '18:00', dur: 60, c: 'Вікторія', v: ['Апаратний педикюр'] },

      // 26 вересня (субота)
      { d: '2026-09-26', s: '11:00', dur: 30, c: 'Настя Бабій', v: ['Ноги до колін'] },

      // 28 вересня (понеділок)
      { d: '2026-09-28', s: '18:00', dur: 60, c: 'Людмила', v: ['Консультація подолога'], m: 'видалення мозоля' },

      // 29 вересня (вівторок)
      { d: '2026-09-29', s: '14:00', dur: 60, c: 'Аліка', v: ['Консультація подолога'], m: 'вросший ніготь' },
      { d: '2026-09-29', s: '15:00', dur: 30, c: 'Софія', v: ['Консультація подолога'], m: 'вросший ніготь огляд' },
      { d: '2026-09-29', s: '16:00', dur: 60, c: 'Ельдар', v: ['Консультація подолога'], m: 'вросший ніготь' },
      { d: '2026-09-29', s: '17:00', dur: 30, c: 'Марина Ескулаб', v: ['Бікіні глибоке'] },

      // 30 вересня (середа)
      { d: '2026-09-30', s: '10:30', dur: 30, c: 'Оля перукарка', v: ['Підмишки', 'Бікіні глибоке'] },
      { d: '2026-09-30', s: '11:00', dur: 60, c: 'Мала (Врослий ніготь)', v: ['Консультація подолога'] },
      { d: '2026-09-30', s: '12:00', dur: 30, c: 'Інна пенсійний', v: ['Бікіні глибоке'] },
      { d: '2026-09-30', s: '16:00', dur: 60, c: 'Олесь чоловік Віки кури', v: ['Медичний педикюр'], m: 'масаж' },
      { d: '2026-09-30', s: '18:00', dur: 90, c: 'Надя Калакайчук', v: ['Ноги повністю', 'Бікіні глибоке'] },
    ];

    db.appts = db.appts || [];
    db.sched = db.sched || { step: 30, days: {} };
    db.sched.over = db.sched.over || {};

    // Робимо робочими вихідні дні, на які є записи
    ['2026-09-05', '2026-09-19', '2026-09-20', '2026-09-26'].forEach(day => {
      if (!db.sched.over[day]) db.sched.over[day] = { on: 1, s: '09:00', e: '19:00' };
    });

    rawAppts.forEach(r => {
      const exists = db.appts.some(a => a.date === r.d && a.start === r.s);
      if (exists) return;

      if (r.b) {
        db.appts.push({
          id: uid(),
          type: 'break',
          title: r.b,
          date: r.d,
          start: r.s,
          dur: r.dur,
          comment: '',
          price: 0,
          svc: [],
          status: 'plan',
          cid: '',
        });
      } else {
        const cl = findClient(r.c);
        const svcList = (r.v || []).map(findService).filter(Boolean);
        const svcIds = svcList.map(x => x.id);
        const price = svcList.reduce((acc, x) => acc + x.price, 0);

        db.appts.push({
          id: uid(),
          date: r.d,
          start: r.s,
          dur: r.dur,
          price,
          svc: svcIds,
          status: 'done',
          cid: cl ? cl.id : '',
          comment: r.m || '',
          photos: [],
        });
      }
    });

    migSet('sep2026');
    save();
  }
} catch (e) {}

/* ── STATE ──────────────────────────────────────────────────── */
const now = new Date();
const S = {
  tab: 'sch',
  d:   iso(now),
  m:   new Date(now.getFullYear(), now.getMonth(), 1),
  sm:  new Date(now.getFullYear(), now.getMonth(), 1),
  q:   '',
  sq:  '',
  salTab: 'wait',
  mx:  {},
};
let cur;
let curSal;
let lastDayTap = { id: '', t: 0 };

const cn = id => (db.clients.find(c => c.id == id) || { name: '—' }).name;
const sv = id => db.services.find(s => s.id == id);

/* Назви послуг запису (повтори → «×2») */
const svCount = svc => { const m = new Map(); svc.forEach(i => m.set(i, (m.get(i) || 0) + 1)); return m; };
const svTitle = a => [...svCount(a.svc)].map(([i, n]) => { const x = sv(i); return x ? x.title + (n > 1 ? ' ×' + n : '') : ''; }).filter(Boolean).join(', ') || 'Без послуги';
const dm = m => { const h = m / 60 | 0, r = m % 60; return (h ? h + ' год' : '') + (h && r ? ' ' : '') + (r || !h ? r + ' хв' : ''); };

const sheet = (h, page) => {
  S.bk = null; S.pgDirty = null;
  $('#sh').innerHTML = page ? h :
    '<div class="bd" data-a="close"></div><div class="pn"><div class="hd"></div>' + h + '</div>';
  $('#sh').className = 'on';
  S.snap = sig();
};

// Знімок введених даних у шторці: щоб попередити про незбережені зміни
const sig = () => {
  const f = [...document.querySelectorAll('#sh input, #sh select, #sh textarea')]
    .filter(x => x.type != 'file').map(x => x.type == 'checkbox' ? x.checked : x.value);
  return JSON.stringify([f, $('#xq') && cur ? [cur.cid, cur.svc] : 0, curSal ? [curSal.cid, curSal.items] : 0]);
};
// шторка з кнопкою «Зберегти» — тоді є що втрачати
const dirty = () => $('#sh').classList.contains('on')
  && (S.pgDirty
    ? S.pgDirty()
    : !!$('#sh [data-a=sa], #sh [data-a=sc], #sh [data-a=se], #sh [data-a=sv], #sh [data-a=sbrk], #sh [data-a=ssal], #sh [data-a=sprod]') && S.snap !== sig());

/* ── ICONS ──────────────────────────────────────────────────── */
const P = {
  cal:     '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  archive: '<rect x="3" y="3" width="18" height="4" rx="1"/><path d="M5 7v13a2 2 0 002 2h10a2 2 0 002-2V7M10 12h4"/>',
  camera:  '<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>',
  users:   '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16.5 14.2c2.2.1 3.6 1.6 4 4.3"/>',
  bag:     '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>',
  chart:   '<path d="M5 20V11M12 20V5M19 20v-7"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  imp:     '<rect x="4" y="3.5" width="16" height="17" rx="3"/><circle cx="12" cy="10" r="2.6"/><path d="M7.5 17c.7-2.2 2.4-3.3 4.5-3.3s3.8 1.1 4.5 3.3"/>',
  file:    '<path d="M6.5 3.5H14l4 4v13H6.5z"/><path d="M14 3.5v4h4"/>',
  search:  '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  plus:    '<path d="M12 5v14M5 12h14"/>',
  prev:    '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  next:    '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
  trash:   '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M5 7l1 13h12l1-13"/><path d="M9 7V4h6v3"/>',
  check:   '<path d="M4 12l5.5 5.5L20 6"/>',
  phone:   '<path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 005.2 5.2l1.3-2 4 1.5v3a2 2 0 01-2.2 2A15.5 15.5 0 014.5 5.7a2 2 0 012-2.2z"/>',
  link:    '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  download:'<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>',
  upload:  '<path d="M12 16V5M7.5 9.5L12 5l4.5 4.5M5 20h14"/>',
  logout:  '<path d="M9 4.5H6.5a2 2 0 00-2 2v11a2 2 0 002 2H9M14 8l4 4-4 4M18 12H9.5"/>',
  down:    '<path d="M6 9.5l6 6 6-6"/>',
  moon:    '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
  sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"/>',
  pause:   '<path d="M8 5.5v13M16 5.5v13" stroke-width="3.2"/>',
  work:    '<rect x="3.5" y="7.5" width="17" height="12" rx="3"/><path d="M9 7.5V6a2 2 0 012-2h2a2 2 0 012 2v1.5M3.5 12.5h17"/>',
  x:       '<path d="M6 6l12 12M18 6L6 18"/>',
  checks:  '<path d="M3.5 12.5L8 17l6-10M13 15l1.5 1.5L21 8"/>',
  minus:   '<path d="M5 12h14"/>',
  list:    '<path d="M9.5 6.5H20M9.5 12H20M9.5 17.5H20"/><circle cx="4.8" cy="6.5" r=".6"/><circle cx="4.8" cy="12" r=".6"/><circle cx="4.8" cy="17.5" r=".6"/>',
  clock:   '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  flag:    '<path d="M6 21V4M6 5h11l-2.5 4L17 13H6"/>',
  cash:    '<rect x="3" y="6.5" width="18" height="11" rx="3"/><circle cx="12" cy="12" r="2.5"/>',
  msg:     '<path d="M5 5h14a2 2 0 012 2v8a2 2 0 01-2 2h-7l-4 3.5V17H5a2 2 0 01-2-2V7a2 2 0 012-2z"/><path d="M8 10h8M8 13h5"/>',
};
const ic = n => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

/* Заголовок шторки: назва + мала кругла кнопка видалення справа */
const shHead = (title, act, v) => `<div class="sh-h"><h3>${title}</h3>${
  act ? `<button class="ib dl" data-a="${act}" ${v !== undefined ? `data-v="${v}"` : ''} aria-label="Видалити" title="Видалити">${ic('trash')}</button>` : ''
}</div>`;
const closeBtn = () => `<button class="bt gh" data-a="close">${ic('x')} Закрити</button>`;

/* ── TABS ───────────────────────────────────────────────────── */
const TABS = [
  ['sch', 'cal',     'Графік'],
  ['sal', 'bag',     'Замовлення'],
  ['cli', 'users',   'Клієнти'],
  ['st',  'chart',   'Статистика'],
  ['set', 'sliders', 'Налаштування'],
];

/* ── RENDER WITH TRANSITION ─────────────────────────────────── */
function render(soft) {
  const el = $('#v');
  const nv = $('#nv');
  const idx = TABS.findIndex(t => t[0] == S.tab);

  const paint = function() {
    const top = el.scrollTop;
    el.innerHTML = ({ sch, cli, sal, st, set })[S.tab]();
    if (S.last !== S.tab) { el.scrollTop = 0; S.last = S.tab; } else el.scrollTop = top;
    nv.style.setProperty('--i', idx);
    nv.style.setProperty('--tab-cnt', TABS.length);
    nv.innerHTML = TABS.map(t =>
      `<div role="button" tabindex="0" title="${t[2]}" aria-label="${t[2]}"
            class="${S.tab == t[0] ? 'on' : ''}" data-a="tab" data-v="${t[0]}">${ic(t[1])}</div>`
    ).join('');
  };

  // «М'яке» оновлення (вибір дня, місяць): без згасання екрана
  if (soft) { paint(); return; }

  // Fade out → оновити → fade in
  el.classList.add('v-out');
  setTimeout(function() {
    paint();
    el.classList.remove('v-out');
  }, 120);
}

/* ── SCHEDULE TAB ───────────────────────────────────────────── */
// Графік дня: разове перевизначення (sched.over) має пріоритет над шаблоном тижня
const wdOf = id => (new Date(id + 'T00:00').getDay() + 6) % 7 + 1;
const dcfg = id => (db.sched.over || {})[id] || db.sched.days[wdOf(id)];

function setDay(on) {
  const base = db.sched.days[wdOf(S.d)];
  db.sched.over = db.sched.over || {};
  if (!!base.on === !!on) delete db.sched.over[S.d];
  else db.sched.over[S.d] = { on: on ? 1 : 0, s: base.s, e: base.e };
  save();
  toast(on ? 'День став робочим' : 'День став вихідним');
  render(true);
}

function sch() {
  const m = S.m, y = m.getFullYear(), mo = m.getMonth();
  const n = new Date(y, mo + 1, 0).getDate();
  const today = iso(new Date());
  let cells = DN.map(d => `<span>${d}</span>`).join('') +
    '<i></i>'.repeat((new Date(y, mo, 1).getDay() + 6) % 7);
  for (let i = 1; i <= n; i++) {
    const id = iso(new Date(y, mo, i));
    const c = db.appts.filter(a => a.date == id && a.status != 'canc' && a.type != 'break').length;
    const off = !dcfg(id).on;
    cells += `<b class="dy ${id == S.d ? 'sel' : ''} ${id == today ? 'today' : ''} ${off ? 'off' : ''}"
                 data-a="day" data-v="${id}"><span class="dn">${i}${c ? `<sup>${c}</sup>` : ''}</span></b>`;
  }
  const dt  = new Date(S.d + 'T00:00');
  const cfg = dcfg(S.d);
  const step = db.sched.step;
  const list = db.appts.filter(a => a.date == S.d).sort((a, b) => tm(a.start) - tm(b.start));
  let sl = '';
  if (!cfg.on) {
    sl = `<div class="off-card">
            <div class="oh">
              <span class="ico">${ic('moon')}</span>
              <span class="t"><b>Вихідний</b><small>Записи на цей день закриті</small></span>
            </div>
            <button class="bt" data-a="dw">${ic('work')} Зробити робочим</button>
          </div>` + list.filter(a => a.status != 'canc').map(a => apCard(a, sv(a.svc[0]))).join('');
  } else {
    const act = list.filter(a => a.status != 'canc');
    const shown = new Set();
    for (let t = tm(cfg.s); t < tm(cfg.e); t += step) {
      const busy = act.some(a => tm(a.start) < t + step && tm(a.start) + a.dur > t);
      if (!busy) {
        sl += `<div class="slot" data-a="new" data-v="${ft(t)}">
                 <span>${ft(t)}</span><em>вільно</em></div>`;
      } else {
        // усі записи, що починаються в цьому слоті (у т.ч. накладені один на одного)
        act.filter(a => tm(a.start) >= t && tm(a.start) < t + step).forEach(a => {
          shown.add(a.id);
          sl += apCard(a, sv(a.svc[0]));
        });
      }
    }
    // записи поза робочими годинами / поза сіткою теж показуємо
    act.filter(a => !shown.has(a.id)).forEach(a => { sl += apCard(a, sv(a.svc[0])); });
  }
  sl += list.filter(a => a.status == 'canc').map(a => apCard(a, sv(a.svc[0]))).join('');
  const dayLabel = dt.getDate() + ' ' + MN_GEN[dt.getMonth()] + ', ' + DN[(dt.getDay() + 6) % 7];
  const dayBooked = list.filter(a => a.status != 'canc' && a.type != 'break');
  const dayDone   = dayBooked.filter(a => a.status == 'done');
  const dayTotal  = dayBooked.reduce((s, a) => s + (a.price || 0), 0);
  const hasDone   = dayDone.length > 0;
  const sumCls    = dayTotal === 0 ? 'is-zero' : hasDone ? 'is-done' : '';
  const sumLbl    = hasDone ? 'Зароблено' : dayTotal > 0 ? 'Заплановано' : 'Немає записів';
  const daySumHtml = `<span class="day-sum${sumCls ? ' ' + sumCls : ''}"><span class="day-sum-lbl">${sumLbl}</span><span class="day-sum-val">${dayTotal > 0 ? money(dayTotal) : '—'}</span></span>`;
  return `<h1>${MN[mo]} ${y}
    <span>
      <button class="ib" data-a="pm" data-v="-1">${ic('prev')}</button>
      <button class="ib" data-a="pm" data-v="1">${ic('next')}</button>
    </span>
  </h1>
  <div class="cd"><div class="cal">${cells}</div></div>
  <div class="day-h"><h3>${dayLabel}</h3>${daySumHtml}</div>
  ${sl}
  ${cfg.on ? `<button class="bt gh" style="margin-top:6px" data-a="dof">${ic('moon')} Зробити вихідним</button>` : ''}`;
}

function apCard(a, s0) {
  if (a.type === 'break') {
    const end = ft(tm(a.start) + a.dur);
    return `<div class="ap brk" data-a="edit" data-v="${a.id}">
      <div class="am">
        <b>${a.start} – ${end} · ${esc(a.title || 'Подія')}</b>
        ${a.comment ? `<div class="as">${esc(a.comment)}</div>` : ''}
      </div>
    </div>`;
  }
  const icn = { plan: 'clock', done: 'check', canc: 'x' }[a.status] || 'clock';
  const lines = [...svCount(a.svc)].map(([i, n]) => {
    const x = sv(i);
    return x ? esc(x.title) + (n > 1 ? ' ×' + n : '') : '';
  }).filter(Boolean).join('<br>') || 'Без послуги';
  return `<div class="ap ${s0 ? cls(s0.cat) : 'pe'} st-${a.status}" data-a="edit" data-v="${a.id}">
    <div class="am">
      <b>${a.start} – ${ft(tm(a.start) + a.dur)} · ${esc(cn(a.cid))}</b>
      <div class="as">${lines}</div>
      ${a.comment ? `<div class="ap-cmt">${ic('msg')} <em>${esc(a.comment)}</em></div>` : ''}
    </div>
    <div class="ar2">
      <span class="si" title="${ST[a.status] || ''}">${ic(icn)}</span>
      <em>${money(a.price)}</em>
    </div>
  </div>`;
}

/* ── APPOINTMENT SHEET ──────────────────────────────────────── */
const fld = (inner, icon) => `<div class="fld">${inner}${icon ? ic(icon) : ''}</div>`;

function svHtml() {
  return [...svCount(cur.svc)].map(([id, n]) => {
    const x = sv(id);
    if (!x) return '';
    return `<div class="sv-c ${cls(x.cat)}">
      <div class="t"><b>${esc(x.title)}</b><small>${money(x.price)} · ${dm(x.dur)}</small></div>
      <div class="qt">
        <button type="button" data-a="qty" data-v="${id}|-1" aria-label="Менше">${ic('minus')}</button>
        <span>${n}</span>
        <button type="button" data-a="qty" data-v="${id}|1" aria-label="Більше">${ic('plus')}</button>
      </div>
      <button type="button" class="ib dl" data-a="rsv" data-v="${id}" aria-label="Прибрати">${ic('trash')}</button>
    </div>`;
  }).join('');
}

/* Попап вибору послуг: можна відмітити кілька та додати разом */
let pkSel = new Set();
const pkFoot = () => {
  const ids = [...pkSel], ss = ids.map(sv).filter(Boolean);
  const b = $('#pka');
  if (!b) return;
  b.disabled = !ss.length;
  b.innerHTML = ic('plus') + (ss.length
    ? ` Додати все (${ss.length}) · ${money(ss.reduce((x, y) => x + y.price, 0))}`
    : ' Оберіть послуги');
};
const pkOpen = () => {
  pkSel = new Set();
  let m = $('#pkm');
  if (!m) { m = document.createElement('div'); m.id = 'pkm'; document.body.appendChild(m); }
  const cats = [...new Set(db.services.map(x => x.cat))];
  const chips = cats.length > 1
    ? `<div class="pk-tabs"><button type="button" class="pk-tab on" data-a="pkc" data-v="">Усі</button>` +
      cats.map(c => `<button type="button" class="pk-tab" data-a="pkc" data-v="${esc(c)}">${esc(c)}</button>`).join('') + '</div>'
    : '';
  const list = !db.services.length
    ? '<div class="sg"><small>Додайте послуги в Налаштуваннях</small></div>'
    : cats.map(c =>
        `<div class="pk-g" data-cat="${esc(c)}"><div class="sgh">${esc(c)}</div>` +
        db.services.filter(x => x.cat == c).map(x =>
          `<div class="pk-r ${cls(x.cat)}" data-a="tgs" data-v="${x.id}">
             <span class="t"><b>${esc(x.title)}</b><small>${ic('clock')} ${dm(x.dur)}</small></span>
             <span class="pk-p">${money(x.price)}</span>
             <i class="pk-c">${ic('check')}</i></div>`
        ).join('') + '</div>'
      ).join('');
  m.innerHTML = `<div class="pk-bd" data-a="pkx"></div>
    <div class="pk-pn">
      <div class="pk-h"><h3>Оберіть послуги</h3>
        <button type="button" class="pk-x" data-a="pkx" aria-label="Закрити">${ic('x')}</button></div>
      ${chips}
      <div class="pk-l">${list}</div>
      <div class="pk-f"><button type="button" class="bt" id="pka" data-a="apk"></button></div>
    </div>`;
  m.className = 'on';
  pkFoot();
};
const pkClose = () => { const m = $('#pkm'); if (m) m.className = ''; };

const endOf = () => ft(Math.min(tm(cur.start) + cur.dur, 1439));
const syncTimes = () => { $('#xs').value = cur.start; $('#xe').value = endOf(); };
const thint = () => { $('#xth').textContent = V('xt') == 'done' ? '' : 'Не рахується в дохід'; };

// Пошук клієнта: фільтр існуючих + «Додати як нового»
function cql() {
  const el = $('#xl');
  if (!el) return;
  const q = cur.cid ? '' : V('xq').trim();
  const ql = q.toLowerCase(), qd = ql.replace(/\D/g, '');
  const m = db.clients
    .filter(c => !ql || c.name.toLowerCase().includes(ql) || (qd && (c.phone || '').replace(/\D/g, '').includes(qd)))
    .sort((x, y) => x.name.localeCompare(y.name)).slice(0, 40);
  const exact = db.clients.some(c => c.name.trim().toLowerCase() == ql);
  el.innerHTML =
    (q && !exact ? `<div class="sg add" data-a="acl"><span><em>+</em> Додати <b>${esc(q)}</b> як нового клієнта</span></div>` : '') +
    m.map(c => `<div class="sg" data-a="pcl" data-v="${c.id}"><b>${esc(c.name)}</b><small>${esc(c.phone || '')}</small></div>`).join('') +
    (!q && !m.length ? '<div class="sg"><small>Клієнтів ще немає — введіть ім’я</small></div>' : '');
}

// Вільні години для обраної дати та поточної тривалості
function recH() {
  const el = $('#xr');
  if (!el) return;
  const cfg = dcfg(cur.date);
  if (!cfg.on) { el.innerHTML = '<span class="mut">Вихідний день</span>'; return; }
  const step = db.sched.step, dur = cur.dur;
  const busy = db.appts.filter(x => x.date == cur.date && x.status != 'canc' && x.id != cur.id)
    .map(x => [tm(x.start), tm(x.start) + x.dur]);
  const out = [];
  for (let t = tm(cfg.s); t + dur <= tm(cfg.e); t += step)
    if (!busy.some(([a, b]) => t < b && t + dur > a)) out.push(t);
  el.innerHTML = out.map(t => `<span class="rc ${ft(t) == cur.start ? 'on' : ''}" data-a="rh" data-v="${ft(t)}">${ft(t)}</span>`).join('')
    || '<span class="mut">Вільних годин немає</span>';
}

function svChanged() {
  const ss = cur.svc.map(sv).filter(Boolean);
  cur.price = ss.reduce((x, y) => x + y.price, 0);
  cur.dur   = ss.reduce((x, y) => x + y.dur, 0) || db.sched.step;
  $('#xp').value = cur.price;
  $('#xsv').innerHTML = svHtml();
  syncTimes();
  recH();
}

function apSheet(id, t0) {
  const a = id
    ? db.appts.find(x => x.id == id)
    : { id: '', date: S.d, start: t0, dur: db.sched.step, price: 0, svc: [], status: 'plan', cid: '', comment: '', photos: [] };
  cur = JSON.parse(JSON.stringify(a));
  cur.svc = cur.svc || [];
  if (!id && cur.status == 'plan' && isPast(cur)) cur.status = 'done';
  const clWait = cur.cid ? (db.sales || []).filter(s => s.cid == cur.cid && s.status == 'wait') : [];
  const clObj = cur.cid ? db.clients.find(c => c.id == cur.cid) : null;
  const clPhone = clObj ? (clObj.phone || '') : '';

  sheet(`<div class="pn pg">
    <div class="pg-h">
      <button type="button" class="ib pg-back" data-a="close" aria-label="Назад">${ic('prev')}</button>
      <h3>${id ? 'Запис' : 'Новий запис'}</h3>
      ${id ? `<button type="button" class="ib dl" data-a="da" aria-label="Видалити" title="Видалити">${ic('trash')}</button>` : ''}
    </div>
    <div class="pg-b">

    <div class="fh first">${ic('users')} Клієнт</div>
    <div class="fld ${cur.cid ? 'ok' : ''}" id="xcw">
      <input id="xq" autocomplete="off" autocorrect="off" placeholder="Ім’я клієнта" value="${esc(cur.cid ? cn(cur.cid) : '')}">
      <span class="ck">${ic('check')}</span>
    </div>
    <div class="sgl" id="xl"></div>

    <div class="fld" id="xcp-wrap" style="margin-top:8px">
      <input id="xcp" type="tel" inputmode="tel" placeholder="+380… (додати або змінити телефон)" value="${esc(clPhone)}">
      <a id="xcp-call" href="${clPhone ? 'tel:' + nph(clPhone) : 'javascript:void(0)'}" class="sf" style="right:12px;color:${clPhone ? 'var(--ac2)' : 'var(--mu)'};display:flex;align-items:center;height:100%;text-decoration:none" title="${clPhone ? 'Зателефонувати' : 'Телефон'}">${ic('phone')}</a>
    </div>

    ${clWait.length ? `
      <div class="sal-card sal-wait" style="margin:12px 0 6px">
        <div class="sal-top-row" data-a="esal" data-v="${clWait[0].id}">
          <div class="sal-client-info">
            <span class="sal-cname" style="color:#facc15">${ic('bag')} Замовлення очікує видачі</span>
            <span class="sal-cdate">${fdt(clWait[0].date)}</span>
          </div>
          <div class="sal-total-price">${money(clWait[0].total)}</div>
        </div>
        <div class="sal-card-items" data-a="esal" data-v="${clWait[0].id}">
          ${(clWait[0].items || []).map(it => `
            <div class="sal-ci-row">
              <span class="sal-ci-name">${esc(it.title)}</span>
              <div class="sal-ci-right">
                ${it.vol ? `<span class="sal-ci-vol">${esc(it.vol)}</span>` : ''}
                <span class="sal-ci-qty">×${it.qty || 1}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="sal-card-footer">
          <span class="sal-status-label wait">Очікує видачі</span>
          <button type="button" class="bt-pickup" data-a="pick-sal" data-v="${clWait[0].id}">
            ${ic('check')} Клієнт забрав
          </button>
        </div>
      </div>
    ` : ''}

    <div class="fh">${ic('clock')} Дата та час запису</div>
    <label>Дата</label>
    ${fld(`<input id="xdt" type="date" value="${cur.date}">`, 'cal')}
    <div class="row" style="gap:10px">
      <div><label>Початок</label>${fld(`<input id="xs" type="time" value="${cur.start}">`, 'clock')}</div>
      <div><label>Кінець</label>${fld(`<input id="xe" type="time" value="${endOf()}">`, 'clock')}</div>
    </div>
    <label>Рекомендовані години</label>
    <div class="rh" id="xr"></div>

    <div class="fh">${ic('file')} Послуги</div>
    <div id="xsv">${svHtml()}</div>
    <button type="button" class="bt gh" data-a="tsp" style="margin-top:8px">${ic('plus')} Додати послугу</button>

    <div class="fh">${ic('cash')} Ціна</div>
    <div class="fld"><input id="xp" type="number" inputmode="decimal" min="0" value="${cur.price}"><em class="sf">₴</em></div>

    <div class="fh">${ic('flag')} Статус</div>
    <select id="xt">
      ${Object.keys(ST).map(k => `<option value="${k}" ${k == cur.status ? 'selected' : ''}>${ST[k]}</option>`).join('')}
    </select>
    <small class="mut" id="xth" style="display:block;margin-top:6px"></small>

    <div class="fh">${ic('msg')} Коментар</div>
    <textarea id="xm" placeholder="Напишіть коментар тут">${esc(cur.comment)}</textarea>

    </div>
    <div class="pg-f"><button type="button" class="bt" data-a="sa">${ic('check')} Зберегти</button></div>
  </div>`, true);
  thint();
  recH();
}

/* ── ПОПАП «ОБЕРИ ДІЮ» ────────────────────────────────────────── */
function actSheet(t0) {
  const dt = new Date(S.d + 'T00:00');
  const dStr = dt.getDate() + ' ' + MN_GEN[dt.getMonth()];
  const sub = t0 ? `${dStr} · ${t0}` : dStr;
  sheet(`
    <div class="act-pop">
      <div class="act-h">
        <div class="act-t">Обери дію</div>
        <div class="act-sub">${sub}</div>
      </div>
      <div class="act-btns">
        <button type="button" class="act-b act-pri" data-a="act-ap" data-v="${t0 || ''}">
          <span class="act-ico">${ic('plus')}</span>
          <span>Створити новий запис</span>
        </button>
        <button type="button" class="act-b act-sec" data-a="act-brk" data-v="${t0 || ''}">
          <span class="act-ico">${ic('cal')}</span>
          <span>Додати подію</span>
        </button>
      </div>
    </div>
  `);
}

/* ── ФОРМА ПЕРЕРВИ ─────────────────────────────────────────── */
function breakSheet(id, t0) {
  const a = id
    ? db.appts.find(x => x.id == id)
    : {
        id: '',
        type: 'break',
        title: '',
        date: S.d,
        start: t0 || '09:00',
        dur: db.sched.step || 30,
        comment: '',
        price: 0,
        svc: [],
        status: 'plan',
        cid: '',
        photos: []
      };
  cur = JSON.parse(JSON.stringify(a));
  cur.end = ft(tm(cur.start) + (cur.dur || 30));

  sheet(`<div class="pn pg">
    <div class="pg-h">
      <button type="button" class="ib pg-back" data-a="close" aria-label="Назад">${ic('prev')}</button>
      <h3>${id ? 'Подія' : 'Додати подію'}</h3>
      ${id ? `<button type="button" class="ib dl" data-a="dbrk" aria-label="Видалити" title="Видалити">${ic('trash')}</button>` : ''}
    </div>
    <div class="pg-b">
      <div class="fh first">${ic('file')} Назва</div>
      <input id="bn" value="${esc(cur.title)}" placeholder="Назва події" autocomplete="off">

      <div class="fh">${ic('clock')} Час події</div>
      <label>Дата</label>
      ${fld(`<input id="bdt" type="date" value="${cur.date}">`, 'cal')}
      <div class="row" style="gap:12px;margin-top:10px">
        <div style="flex:1"><label>Від</label>${fld(`<input id="bs" type="time" value="${cur.start}">`, 'clock')}</div>
        <div style="flex:1"><label>До</label>${fld(`<input id="be" type="time" value="${cur.end}">`, 'clock')}</div>
      </div>

      <div class="fh">${ic('msg')} Коментар</div>
      <textarea id="bm" placeholder="Напишіть коментар">${esc(cur.comment || '')}</textarea>
    </div>
    <div class="pg-f">
      <button type="button" class="bt" data-a="sbrk">${ic('check')} Зберегти</button>
    </div>
  </div>`, true);
}

const phs = () => {
  $('#ph') && ($('#ph').innerHTML =
    cur.photos.map((p, i) => `<img src="${p}" data-a="dp" data-v="${i}">`).join('') +
    '<label for="ff">' + ic('plus') + '</label>');
};

const rz = f => new Promise(r => {
  const i = new Image();
  i.onload = () => {
    const k = Math.min(1, 700 / Math.max(i.width, i.height));
    const c = document.createElement('canvas');
    c.width = i.width * k; c.height = i.height * k;
    c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
    r(c.toDataURL('image/jpeg', .7));
  };
  i.src = URL.createObjectURL(f);
});

const rzSq = f => new Promise(r => {
  const i = new Image();
  i.onload = () => {
    const s = 400;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    const minD = Math.min(i.width, i.height);
    const sx = (i.width - minD) / 2;
    const sy = (i.height - minD) / 2;
    ctx.drawImage(i, sx, sy, minD, minD, 0, 0, s, s);
    r(c.toDataURL('image/jpeg', .8));
  };
  i.src = URL.createObjectURL(f);
});

/* ── CLIENTS TAB ────────────────────────────────────────────── */
function cli() {
  return `<h1>Клієнти
    <span>
      <button class="ib" data-a="ic" aria-label="Імпорт контактів">${ic('imp')}</button>
      <button class="ib" data-a="cs" data-v="">${ic('plus')}</button>
    </span>
  </h1>
  <div class="sr" style="margin-bottom:12px">
    ${ic('search')}
    <input data-c="q" placeholder="Пошук за іменем або телефоном" value="${esc(S.q)}">
  </div>
  <div id="cl">${cl()}</div>`;
}

function cl() {
  const q = S.q.toLowerCase();
  const l = db.clients.filter(c => (c.name + c.phone).toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
  return l.map(c => `
    <div class="cd li" data-a="cs" data-v="${c.id}" style="margin-bottom:8px">
      <span><b>${esc(c.name)}</b><br><small class="mut">${esc(c.phone || c.ig || '')}</small></span>
      <small class="mut">${db.appts.filter(a => a.cid == c.id).length} візитів</small>
    </div>`).join('') || '<p class="mut">Клієнтів ще немає. Натисніть +, щоб додати першого.</p>';
}

function cs(id) {
  const c = id
    ? db.clients.find(x => x.id == id)
    : { name: '', phone: '', ig: '', note: '' };
  const h = db.appts.filter(a => a.cid == id).sort((a, b) => b.date.localeCompare(a.date));
  const spent = h.filter(a => a.status == 'done').reduce((s, a) => s + a.price, 0);
  const clSales = id ? (db.sales || []).filter(s => s.cid == id).sort((a, b) => b.date.localeCompare(a.date)) : [];
  const clWait = clSales.filter(s => s.status == 'wait');
  const clDone = clSales.filter(s => s.status == 'done');
  const prodSpent = clDone.reduce((s, o) => s + (o.total || 0), 0);
  const totalSpent = spent + prodSpent;

  sheet(`
    ${shHead(id ? '' : 'Новий клієнт', id ? 'dc' : '', id)}
    <label>Ім’я*</label>
    <input id="cn" value="${esc(c.name)}" placeholder="Ім’я клієнта">
    <label>Телефон</label>
    <input id="cp" type="tel" placeholder="+380…" value="${esc(c.phone)}">
    <div id="mo" style="${id ? '' : 'display:none'}">
      <label>Примітки (алергії, особливості)</label>
      <textarea id="cm">${esc(c.note)}</textarea>
    </div>
    ${id ? '' : '<p class="mut" data-a="mo" style="color:var(--ac2);cursor:pointer">Детальне додавання ▾</p>'}
    ${id ? `
      <div class="cd cl-summary-card">
        <div class="cl-stat-col">
          <span class="cl-stat-lbl">Всього сплачено</span>
          <b class="cl-stat-val">${money(totalSpent)}</b>
        </div>
        <div class="cl-stat-col">
          <span class="cl-stat-lbl">Візитів</span>
          <b class="cl-stat-val">${h.length}</b>
        </div>
        <div class="cl-stat-col">
          <span class="cl-stat-lbl">Покупок</span>
          <b class="cl-stat-val">${clDone.length}</b>
        </div>
      </div>

      ${clWait.length ? `
        <div class="cl-sec-head" style="margin-top:14px">
          <span class="cl-sec-title wait-title">${ic('bag')} До видачі клієнту</span>
          <span class="sal-status-label wait">${clWait.length > 1 ? clWait.length + ' замовл.' : 'Очікує видачі'}</span>
        </div>
        ${clWait.map(s => `
          <div class="cd sal-card sal-wait" style="margin-bottom:12px">
            <div class="sal-top-row" data-a="esal" data-v="${s.id}">
              <div class="sal-client-info">
                <span class="sal-cname">Замовлення від ${fdt(s.date)}</span>
                ${s.note ? `<span class="sal-cdate">${esc(s.note)}</span>` : ''}
              </div>
              <div class="sal-total-price">${money(s.total)}</div>
            </div>

            <div class="sal-card-items" data-a="esal" data-v="${s.id}">
              ${(s.items || []).map(it => `
                <div class="sal-ci-row">
                  <span class="sal-ci-name">${esc(it.title)}</span>
                  <div class="sal-ci-right">
                    ${it.vol ? `<span class="sal-ci-vol">${esc(it.vol)}</span>` : ''}
                    <span class="sal-ci-qty">×${it.qty || 1}</span>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="sal-card-footer">
              <span class="sal-status-label wait">Очікує видачі</span>
              <button type="button" class="bt-pickup" data-a="pick-sal" data-v="${s.id}">
                ${ic('check')} Клієнт забрав
              </button>
            </div>
          </div>
        `).join('')}
      ` : ''}

      <div class="cl-history-block" style="margin-top:14px">
        <div class="cl-sec-head">
          <span class="cl-sec-title">Візити ${h.length ? `(${h.length})` : ''}</span>
          ${h.length ? `<span class="cl-sec-sum">${money(spent)}</span>` : ''}
        </div>
        ${h.length ? `
          <div class="cd cl-hist-box">
            <div class="hist-list">
              ${h.map(a => `
                <div class="hv st-${a.status}" data-a="edit" data-v="${a.id}">
                  <div class="hv-d">${fdt(a.date)}${a.status == 'plan' ? '<i>заплановано</i>' : a.status == 'canc' ? '<i>скасовано</i>' : ''}</div>
                  <div class="hv-s">${esc(svTitle(a))}</div>
                  <div class="hv-p">${money(a.price)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="cl-empty-box">Ще немає візитів</div>
        `}
      </div>

      <div class="cl-history-block" style="margin-top:14px">
        <div class="cl-sec-head">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="cl-sec-title">Придбана продукція ${clDone.length ? `(${clDone.length})` : ''}</span>
            ${prodSpent ? `<span class="cl-sec-sum">${money(prodSpent)}</span>` : ''}
          </div>
          <button type="button" class="bt-add-sal-sm" data-a="nsal-cl" data-v="${id}">
            ${ic('plus')} Додати продаж
          </button>
        </div>
        ${clDone.length ? `
          <div class="cl-sales-list">
            ${clDone.map(s => `
              <div class="cd sal-card" data-a="esal" data-v="${s.id}" style="margin-bottom:10px;cursor:pointer">
                <div class="sal-top-row">
                  <div class="sal-client-info">
                    <span class="sal-cname">${fdt(s.date)}</span>
                    <span class="sal-status-label done">Видано</span>
                  </div>
                  <div class="sal-total-price">${money(s.total)}</div>
                </div>
                <div class="sal-card-items">
                  ${(s.items || []).map(it => `
                    <div class="sal-ci-row">
                      <span class="sal-ci-name">${esc(it.title)}</span>
                      <div class="sal-ci-right">
                        ${it.vol ? `<span class="sal-ci-vol">${esc(it.vol)}</span>` : ''}
                        <span class="sal-ci-qty">×${it.qty || 1}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
                ${s.note ? `<div class="sal-card-note">${esc(s.note)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="cl-empty-box">Куплених засобів ще немає</div>
        `}
      </div>
    ` : ''}
    <div class="row" style="margin-top:22px;padding-bottom:14px">
      ${closeBtn()}
      <button class="bt" data-a="sc" data-v="${id || ''}">${ic('check')} Зберегти</button>
    </div>
  `);
}

/* ── SALES TAB ────────────────────────────────────────────── */
const pr = id => (db.products || []).find(p => p.id == id);

function sal() {
  const allSales = (db.sales || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const waitSales = allSales.filter(s => s.status == 'wait');
  const doneSales = allSales.filter(s => s.status == 'done');

  return `
    <h1>Замовлення
      <span>
        <button class="ib gh" data-a="sal-arch" title="Архів замовлень" aria-label="Архів замовлень">${ic('archive')}</button>
        <button class="ib" data-a="nsal" aria-label="Нове замовлення">${ic('plus')}</button>
      </span>
    </h1>

    <div class="sal-bar-row">
      <span class="sal-bar-title">Актуальні замовлення (${waitSales.length})</span>
    </div>

    <div id="sal-list">
      ${salListRows(waitSales, 'wait')}
    </div>
  `;
}

function salArchPg() {
  const q = (S.salArchQ || '').toLowerCase().trim();
  const doneSales = (db.sales || []).filter(s => s.status == 'done').sort((a, b) => b.date.localeCompare(a.date));
  const filtered = doneSales.filter(s => {
    if (!q) return true;
    const cName = cn(s.cid).toLowerCase();
    const pNames = (s.items || []).map(i => (i.title || '') + ' ' + (i.brand || '')).join(' ').toLowerCase();
    return cName.includes(q) || pNames.includes(q);
  });

  pgOpen(`<div class="pn pg">
    ${pgHead('Архів замовлень')}
    <div class="pg-b">
      <div class="sr" style="margin:10px 0 14px">
        ${ic('search')}
        <input id="sal_arch_q" autocomplete="off" placeholder="Пошук в архіві" value="${esc(S.salArchQ || '')}">
      </div>
      <div id="sal-arch-list">
        ${salListRows(filtered, 'done')}
      </div>
    </div>
  </div>`, () => render(true));
}

function salListRows(list, filter) {
  if (!list.length) {
    const msg = filter == 'wait'
      ? 'Немає замовлень, що очікують видачі.<br>Натисніть «+», щоб створити нове.'
      : filter == 'done'
      ? 'Архів виданих замовлень порожній.'
      : 'Продажів ще немає. Натисніть «+», щоб додати перше замовлення.';
    return `<p class="mut" style="text-align:center;margin-top:28px">${msg}</p>`;
  }

  return list.map(o => `
    <div class="cd sal-card ${o.status == 'wait' ? 'sal-wait' : 'sal-done'}">
      <div class="sal-top-row" data-a="esal" data-v="${o.id}">
        <div class="sal-client-info">
          <span class="sal-cname">${esc(o.cid ? cn(o.cid) : 'Швидкий продаж')}</span>
          <span class="sal-cdate">${fdt(o.date)}</span>
        </div>
        <div class="sal-total-price">${money(o.total || 0)}</div>
      </div>

      <div class="sal-card-items" data-a="esal" data-v="${o.id}">
        ${(o.items && o.items.length)
          ? o.items.map(it => `
              <div class="sal-ci-row">
                <span class="sal-ci-name">${esc(it.title)}</span>
                <div class="sal-ci-right">
                  ${it.vol ? `<span class="sal-ci-vol">${esc(it.vol)}</span>` : ''}
                  <span class="sal-ci-qty">×${it.qty || 1}</span>
                </div>
              </div>
            `).join('')
          : '<div class="sal-ci-row"><span class="sal-ci-name mut">Без товарів</span></div>'
        }
      </div>

      ${o.note ? `<div class="sal-card-note" data-a="esal" data-v="${o.id}">${esc(o.note)}</div>` : ''}

      <div class="sal-card-footer">
        <span class="sal-status-label ${o.status == 'wait' ? 'wait' : 'done'}">
          ${o.status == 'wait' ? 'Очікує видачі' : 'Видано клієнту'}
        </span>
        ${o.status == 'wait' ? `
          <button type="button" class="bt-pickup" data-a="pick-sal" data-v="${o.id}">
            ${ic('check')} Клієнт забрав
          </button>
        ` : `
          <button type="button" class="bt-undo" data-a="undo-sal" data-v="${o.id}" title="Повернути в очікування">
            ${ic('prev')} В очікування
          </button>
        `}
      </div>
    </div>
  `).join('');
}

function salCalc() {
  if (!curSal) return;
  curSal.items = curSal.items || [];
  curSal.total = curSal.items.reduce((s, it) => s + ((+it.price || 0) * (+it.qty || 1)), 0);
  curSal.costTotal = curSal.items.reduce((s, it) => s + ((+it.cost || 0) * (+it.qty || 1)), 0);
  curSal.profit = curSal.total - curSal.costTotal;
}

function salSheet(id, presetCid, presetDate) {
  const o = id
    ? db.sales.find(x => x.id == id)
    : {
        id: '',
        date: presetDate || S.d || iso(new Date()),
        cid: presetCid || '',
        items: [],
        total: 0,
        costTotal: 0,
        profit: 0,
        status: 'wait',
        note: ''
      };
  curSal = JSON.parse(JSON.stringify(o));
  salCalc();
  salOpenForm(id);
}

function salItemsHtml() {
  if (!curSal.items.length) {
    return `<p class="mut" style="text-align:center;padding:12px 0">Товарів ще не додано.<br>Натисніть кнопку нижче, щоб вибрати продукцію.</p>`;
  }
  return curSal.items.map((it, idx) => `
    <div class="sal-item-card">
      <div class="sic-top">
        <div class="sic-title">${esc(it.title)}</div>
        <button type="button" class="sic-del" data-a="it-del" data-v="${idx}" aria-label="Видалити">${ic('x')}</button>
      </div>
      <div class="sic-meta">
        ${it.brand ? `<span>${esc(it.brand)}</span>` : ''}
        ${it.vol ? `<span class="sic-vol">${esc(it.vol)}</span>` : ''}
        <span class="sic-unit">${money(it.price)} / шт</span>
      </div>
      <div class="sic-bot">
        <div class="sic-qty">
          <button type="button" class="sic-qbtn" data-a="it-qty" data-v="${idx}|-1">−</button>
          <span class="sic-qnum">${it.qty}</span>
          <button type="button" class="sic-qbtn" data-a="it-qty" data-v="${idx}|1">+</button>
        </div>
        <div class="sic-sum">${money(it.price * it.qty)}</div>
      </div>
    </div>
  `).join('');
}

function salSummaryHtml() {
  return `
    <div class="sal-summary-card">
      <div class="ssc-row">
        <span>Сума продажу (виручка)</span>
        <b>${money(curSal.total)}</b>
      </div>
      <div class="ssc-row" style="margin-top:4px">
        <span>Собівартість закупки</span>
        <b>${money(curSal.costTotal)}</b>
      </div>
      <div class="ssc-row ssc-main">
        <span>Ваш чистий заробіток</span>
        <b>+${money(curSal.profit)}</b>
      </div>
    </div>
  `;
}

function salOpenForm(id) {
  sheet(`<div class="pn pg">
    <div class="pg-h">
      <button type="button" class="ib pg-back" data-a="close" aria-label="Назад">${ic('prev')}</button>
      <h3>${id ? 'Замовлення' : 'Нове замовлення'}</h3>
      ${id ? `<button type="button" class="ib dl" data-a="dsal" data-v="${id}" aria-label="Видалити" title="Видалити">${ic('trash')}</button>` : ''}
    </div>
    <div class="pg-b">
      <div class="fh first">${ic('users')} Клієнт</div>
      <div class="fld ${curSal.cid ? 'ok' : ''}" id="sal-cw">
        <input id="sal-cq" autocomplete="off" autocorrect="off" placeholder="Ім’я клієнта (або залиште порожнім для швидкого продажу)" value="${esc(curSal.cid ? cn(curSal.cid) : '')}">
        <span class="ck">${ic('check')}</span>
      </div>
      <div class="sgl" id="sal-cl-list"></div>

      <div class="fh">${ic('cal')} Дата замовлення</div>
      ${fld(`<input id="sal-dt" type="date" value="${curSal.date}">`, 'cal')}

      <div class="fh">${ic('bag')} Продукція</div>
      <div id="sal-items-wrap">${salItemsHtml()}</div>
      <button type="button" class="bt gh" data-a="pk-prod" style="margin-top:8px">${ic('plus')} Додати засіб</button>

      <div class="fh">${ic('flag')} Статус замовлення</div>
      <div class="sal-status-picks">
        <button type="button" class="ssp-btn ${curSal.status == 'wait' ? 'on' : ''}" data-a="sal-st" data-v="wait">
          Очікує видачі
        </button>
        <button type="button" class="ssp-btn ${curSal.status == 'done' ? 'on' : ''}" data-a="sal-st" data-v="done">
          Видано клієнту
        </button>
      </div>
      <small class="mut" style="display:block;margin-top:6px">
        ${curSal.status == 'wait' ? 'Замовлення висітиме у вкладці «До видачі», доки клієнт не забере' : 'Замовлення одразу буде збережено в архіві виданих'}
      </small>

      <div id="sal-sum-wrap">${salSummaryHtml()}</div>

      <div class="fh">${ic('msg')} Примітка / Коментар</div>
      <textarea id="sal-note" placeholder="Оплачено на картку / Забере через тиждень...">${esc(curSal.note || '')}</textarea>
    </div>
    <div class="pg-f">
      <button type="button" class="bt" data-a="ssal">${ic('check')} Зберегти замовлення</button>
    </div>
  </div>`, true);
}

function salCql() {
  const el = $('#sal-cl-list');
  if (!el) return;
  const q = curSal.cid ? '' : ($('#sal-cq') ? $('#sal-cq').value.trim() : '');
  const ql = q.toLowerCase(), qd = ql.replace(/\D/g, '');
  const m = db.clients
    .filter(c => !ql || c.name.toLowerCase().includes(ql) || (qd && (c.phone || '').replace(/\D/g, '').includes(qd)))
    .sort((x, y) => x.name.localeCompare(y.name)).slice(0, 30);
  const exact = db.clients.some(c => c.name.trim().toLowerCase() == ql);

  el.innerHTML =
    (q && !exact ? `<div class="sg add" data-a="sal-acl"><span><em>+</em> Додати <b>${esc(q)}</b> як нового клієнта</span></div>` : '') +
    m.map(c => `<div class="sg" data-a="sal-pcl" data-v="${c.id}"><b>${esc(c.name)}</b><small>${esc(c.phone || '')}</small></div>`).join('') +
    (!q ? `<div class="sg" data-a="sal-nocl"><small class="mut">Швидкий продаж без прив'язки до клієнта</small></div>` : '');
}

function pkProdRows(q) {
  q = (q || '').toLowerCase().trim();
  const prods = (db.products || []).filter(p => !q || p.title.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q));
  if (!prods.length) {
    return `
      <p class="mut" style="text-align:center;padding:20px 0">
        ${q ? 'Нічого не знайдено' : 'У каталозі ще немає продукції.'}
      </p>
      <button type="button" class="bt" data-a="eprod" data-v="" style="margin-top:10px">
        ${ic('plus')} Додати новий засіб у каталог
      </button>
    `;
  }

  return prods.map(p => `
    <div class="cd" data-a="add-it" data-v="${p.id}" style="cursor:pointer;margin-bottom:8px;padding:12px 14px">
      <div style="font:600 15px/1.25 Inter,sans-serif;color:var(--tx)">${esc(p.title)}</div>
      <div style="display:flex;align-items:center;gap:6px;margin:4px 0 6px">
        ${p.brand ? `<span style="font:500 12px/1 Inter;color:var(--mu)">${esc(p.brand)}</span>` : ''}
        ${p.vol ? `<span style="font:500 11.5px/1 Inter;color:var(--mu);background:rgba(255,255,255,.06);padding:2px 6px;border-radius:6px">${esc(p.vol)}</span>` : ''}
      </div>
      <div style="font:700 15px/1 Inter;color:var(--tx)">${money(p.price)}</div>
    </div>
  `).join('');
}

function pkProdOpen() {
  pgOpen(`<div class="pn pg">
    ${pgHead('Оберіть продукцію', `<button type="button" class="ib" data-a="eprod" data-v="" aria-label="Новий товар">${ic('plus')}</button>`)}
    <div class="pg-b">
      <div class="sr" style="margin:10px 0 10px">${ic('search')}<input id="pk_prod_q" autocomplete="off" placeholder="Пошук за назвою або брендом"></div>
      <div id="pk_prod_l">${pkProdRows('')}</div>
    </div>
  </div>`, () => salOpenForm(curSal.id));
}

const salMoRows = list => list.length
  ? list.map(s => `
      <div class="ar" data-a="esal" data-v="${s.id}">
        <span class="dt pr"><b>${+s.date.slice(8)}</b><small>чек</small></span>
        <span class="t">
          <b>${esc(s.cid ? cn(s.cid) : 'Швидкий продаж')}</b>
          <small>${esc((s.items || []).map(i => i.title + ' ×' + i.qty).join(', '))}</small>
        </span>
        <span class="rt">
          <em class="pl">+${money(s.profit || 0)}</em>
          <small class="mut">${money(s.total || 0)}</small>
        </span>
      </div>`).join('')
  : '<p class="mut" style="margin:0">Продажів немає.</p>';

/* ── STATISTICS TAB ─────────────────────────────────────────── */
const mkey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');

function sum(done, ex, sales) {
  sales = sales || db.sales || [];
  const svcInc = done.reduce((s, a) => s + a.price, 0);
  const out = ex.reduce((s, e) => s + e.amount, 0);

  const salesDone = sales.filter(s => s.status == 'done');
  const salesInc = salesDone.reduce((s, o) => s + (o.total || 0), 0);
  const salesCost = salesDone.reduce((s, o) => s + (o.costTotal || 0), 0);
  const salesProfit = salesInc - salesCost;

  const inc = svcInc + salesInc;
  const net = (svcInc - out) + salesProfit;

  const cat = { Подологія: 0, Шугаринг: 0 };
  const wk = {};
  const add = (key, title, c, amt) => {
    const w = wk[key] || (wk[key] = { title, cat: c, n: 0, amt: 0 });
    w.n++; w.amt += amt;
  };
  done.forEach(a => {
    const ss = a.svc.map(sv).filter(Boolean);
    const t = ss.reduce((x, s) => x + s.price, 0);
    ss.forEach(s => { cat[s.cat] = (cat[s.cat] || 0) + (t ? a.price * s.price / t : 0); });
    if (!ss.length) add('-', 'Без послуги', '', a.price);
    ss.forEach(s => add(s.id, s.title, s.cat, t ? a.price * s.price / t : a.price / ss.length));
  });
  const works = Object.values(wk).sort((x, y) => y.amt - x.amt || y.n - x.n);

  return {
    done, ex, sales, salesDone,
    svcInc, salesInc, salesCost, salesProfit,
    inc, out, net,
    cat, works,
    cl: new Set([...done.map(a => a.cid), ...salesDone.map(s => s.cid)].filter(Boolean)).size
  };
}

const mstat = k => sum(
  db.appts.filter(a => a.status == 'done' && a.type != 'break' && a.date.startsWith(k)),
  db.expenses.filter(e => e.date.startsWith(k)).sort((a, b) => b.date.localeCompare(a.date)),
  (db.sales || []).filter(s => s.date.startsWith(k))
);

const catBars = (cat, salesInc = 0) => {
  const sInc = salesInc || 0;
  const pod = cat.Подологія || 0;
  const shug = cat.Шугаринг || 0;
  const mx = Math.max(1, pod + shug + sInc);
  return `
    <div class="cr"><span>Подологія</span><span>${money(pod)}</span></div>
    <div class="bar"><i style="width:${pod / mx * 100}%;background:var(--mi2)"></i></div>
    <div class="cr"><span>Шугаринг</span><span>${money(shug)}</span></div>
    <div class="bar"><i style="width:${shug / mx * 100}%;background:var(--pe2)"></i></div>
    <div class="cr"><span>Продукція</span><span>${money(sInc)}</span></div>
    <div class="bar"><i style="width:${sInc / mx * 100}%;background:var(--pr2)"></i></div>
  `;
};

// Коротка назва послуг запису: «Апаратний педикюр +3»
const svShort = a => {
  const m = [...svCount(a.svc)].map(([i, n]) => { const x = sv(i); return x ? x.title + (n > 1 ? ' ×' + n : '') : ''; }).filter(Boolean);
  return m.length ? m[0] + (m.length > 1 ? ' +' + (m.length - 1) : '') : 'Без послуги';
};
const secH = (t, r, first) => `<div class="sh2 ${first ? 'first' : ''}"><span>${t}</span>${r ? `<em>${r}</em>` : ''}</div>`;

// Список прийомів: дата · клієнт і послуга · сума і час (новіші зверху)
const apRows = ds => {
  const f = ds.filter(a => a.type != 'break');
  return f.length
    ? f.slice().sort((a, b) => b.date.localeCompare(a.date) || tm(b.start) - tm(a.start)).map(a => {
      const s0 = sv(a.svc[0]);
      const wd = DN[(new Date(a.date + 'T00:00').getDay() + 6) % 7];
      return `
      <div class="ar" data-a="edit" data-v="${a.id}">
        <span class="dt ${s0 ? cls(s0.cat) : 'pe'}"><b>${+a.date.slice(8)}</b><small>${wd}</small></span>
        <span class="t"><b>${esc(cn(a.cid))}</b><small title="${esc(svTitle(a))}">${esc(svShort(a))}</small></span>
        <span class="rt"><em class="pl">+${money(a.price)}</em><small>${a.start}</small></span>
      </div>`;
    }).join('')
  : '<p class="mut" style="margin:0">Прийомів немає.</p>';
};

// Виконані роботи: згруповано за напрямком, у кожного напрямку підсумок
const workList = ws => {
  if (!ws.length) return '<p class="mut" style="margin:0 0 4px">Виконаних робіт немає.</p>';
  const cats = [...new Set(ws.map(w => w.cat))]
    .sort((x, y) => (CATS.indexOf(x) < 0 ? 99 : CATS.indexOf(x)) - (CATS.indexOf(y) < 0 ? 99 : CATS.indexOf(y)));
  return `<div class="wk">${cats.map(c => {
    const l = ws.filter(w => w.cat == c);
    const col = c == 'Подологія' ? '--mi2' : c == 'Шугаринг' ? '--pe2' : '--mu';
    return `<div class="wg">
      <div class="wgh"><i style="background:var(${col})"></i><span>${esc(c || 'Інше')}</span><b>${money(l.reduce((s, w) => s + w.amt, 0))}</b></div>
      ${l.map(w => `<div class="wr"><span>${esc(w.title)}<em>×${w.n}</em></span><b>${money(w.amt)}</b></div>`).join('')}
    </div>`;
  }).join('')}</div>`;
};

const exRows = ex => ex.length
  ? ex.map(e => `
      <div class="er" data-a="es" data-v="${e.id}">
        <span class="t"><b>${esc(e.cat)}</b><small>${fdt(e.date)}${e.desc ? ' · ' + esc(e.desc) : ''}</small></span>
        <em class="mn">−${money(e.amount)}</em>
      </div>`).join('')
  : '<p class="mut" style="margin:0">Витрат немає.</p>';

function st() {
  const all = sum(db.appts.filter(a => a.status == 'done' && a.type != 'break'), db.expenses, db.sales);
  const cur = mkey(new Date());
  const pd = new Date(); pd.setDate(1); pd.setMonth(pd.getMonth() - 1);
  const prev = mkey(pd);

  // усі місяці, де є дані, + поточний; найновіші зверху
  const keys = new Set([cur]);
  db.appts.forEach(a => { if (a.status == 'done' && a.type != 'break') keys.add(a.date.slice(0, 7)); });
  db.expenses.forEach(e => keys.add(e.date.slice(0, 7)));
  (db.sales || []).forEach(s => { if (s.status == 'done') keys.add(s.date.slice(0, 7)); });
  const list = [...keys].filter(k => /^\d{4}-\d{2}$/.test(k)).sort().reverse();

  const item = k => {
    const m = mstat(k), y = k.slice(0, 4), mo = +k.slice(5) - 1;
    const open = k in S.mx ? S.mx[k] : k == cur;   // за замовчуванням розгорнутий лише поточний місяць
    return `
    <div class="mo ${open ? 'open' : ''}">
      <div class="mo-h" role="button" tabindex="0" data-a="mt" data-v="${k}">
        <span class="t">
          <b>${MN[mo]} ${y}${k == cur ? '<em class="tag">Поточний</em>' : ''}</b>
          <small><span class="inc">Дохід ${money(m.inc)}</span> · <span class="exp">Витрати ${money(m.out)}</span></small>
        </span>
        <span class="amt ${m.net < 0 ? 'neg' : ''}">${money(m.net)}</span>
        ${ic('down')}
      </div>
      <div class="mo-b"><div><div class="in">
        <div class="mk">
          <div><small>Послуги</small><b class="inc">${money(m.svcInc)}</b></div>
          <div><small>Продажі (чистий)</small><b class="sal-tx">+${money(m.salesProfit)}</b></div>
          <div><small>Витрати кабінету</small><b class="exp">${money(m.out)}</b></div>
        </div>
        ${secH('Прийоми', m.done.length, true)}
        ${apRows(m.done)}
        ${m.salesDone.length ? `
          ${secH('Продана продукція', m.salesDone.length + ' чек. · +' + money(m.salesProfit))}
          ${salMoRows(m.salesDone)}
        ` : ''}
        ${secH('Виконані роботи')}
        ${workList(m.works)}
        ${secH('Витрати', m.ex.length ? '−' + money(m.out) : '')}
        ${exRows(m.ex)}
      </div></div></div>
    </div>`;
  };

  return `
    <h1>Статистика</h1>
    <div class="sec">Загальна статистика</div>
    <div class="cd hero">
      <small class="mut">Чистий прибуток за весь час</small>
      <b class="big ${all.net < 0 ? 'neg' : ''}">${money(all.net)}</b>
    </div>
    <div class="kp">
      <div class="cd inc-c"><small class="mut">Послуги</small><b class="inc">${money(all.svcInc)}</b></div>
      <div class="cd sal-c"><small class="mut">Заробіток з продажів</small><b class="sal-tx">+${money(all.salesProfit)}</b></div>
      <div class="cd exp-c"><small class="mut">Витрати</small><b class="exp">${money(all.out)}</b></div>
      <div class="cd"><small class="mut">Клієнтів</small><b>${all.cl}</b></div>
    </div>
    <div class="cd" style="margin-top:10px">
      <b>Дохід за напрямками</b>
      ${catBars(all.cat, all.salesInc)}
    </div>
    <button class="bt" data-a="es" data-v="">${ic('plus')} Додати витрату</button>
    <div class="sec" style="margin-top:26px">Історія по місяцях</div>
    ${list.map(item).join('')}
  `;
}

function es(id) {
  const e = id
    ? db.expenses.find(x => x.id == id)
    : { cat: 'Матеріали', amount: '', date: iso(new Date()), desc: '' };
  sheet(`
    ${shHead('Витрата', id ? 'de' : '', id)}
    <label>Категорія</label>
    <select id="ec">
      ${['Матеріали','Оренда','Інструменти','Реклама'].map(c => `<option ${c == e.cat ? 'selected' : ''}>${c}</option>`).join('')}
    </select>
    <label>Сума, ₴</label>
    <input id="ea" type="number" min="0" value="${e.amount}">
    <label>Дата</label>
    <input id="ed" type="date" value="${e.date}">
    <label>Коментар</label>
    <input id="eo" value="${esc(e.desc)}">
    <div class="row" style="margin-top:18px">
      ${closeBtn()}
      <button class="bt" data-a="se" data-v="${id || ''}">${ic('check')} Зберегти</button>
    </div>
  `);
}

/* ── SETTINGS TAB ───────────────────────────────────────────── */
// закінчення: 1 послуга / 2 послуги / 5 послуг
const plu = (n, a, b, c) => { const m = n % 100, d = n % 10; return m > 10 && m < 20 ? c : d == 1 ? a : d >= 2 && d <= 4 ? b : c; };

// короткий підсумок графіка для рядка налаштувань: «Пн–Пт · 09:00–18:00»
function schSum() {
  const d = db.sched.days, on = DN.map((_, i) => i + 1).filter(i => d[i].on);
  if (!on.length) return 'Немає робочих днів';
  const parts = [];
  let s = on[0], p = on[0];
  for (const i of on.slice(1).concat(0)) {
    if (i == p + 1) { p = i; continue; }
    parts.push(s == p ? DN[s - 1] : p - s == 1 ? DN[s - 1] + ', ' + DN[p - 1] : DN[s - 1] + '–' + DN[p - 1]);
    s = p = i;
  }
  const hs = new Set(on.map(i => d[i].s + '–' + d[i].e));
  return parts.join(', ') + ' · ' + (hs.size == 1 ? [...hs][0] : 'різні години');
}

const stRow = (ico, tone, title, sub, badge, act, noChv) => `
  <div class="sti" role="button" tabindex="0" data-a="${act}">
    <span class="ico ${tone}">${ic(ico)}</span>
    <span class="t"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>
    ${badge == 'warn' ? '<i class="bdg warn">!</i>' : ''}
    ${noChv ? '' : `<span class="chv">${ic('next')}</span>`}
  </div>`;

function applyTheme(light, showMsg = true) {
  const root = document.documentElement;
  if (light) {
    root.setAttribute('data-theme', 'light');
    try { localStorage.setItem('karelova_theme', 'light'); } catch (e) {}
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f4f6fb');
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', 'light');
  } else {
    root.removeAttribute('data-theme');
    try { localStorage.setItem('karelova_theme', 'dark'); } catch (e) {}
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#060a14');
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', 'dark');
  }
  if (showMsg) toast(light ? 'Світлу тему увімкнено' : 'Темну тему увімкнено');
  if (S.tab == 'set') render();
}

function set() {
  const n = db.services.length;
  const np = (db.products || []).length;
  const anyDay = DN.some((_, i) => db.sched.days[i + 1].on);
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return `
    <h1>Налаштування</h1>
    <div class="stl">
      <div class="sti" role="button" tabindex="0" data-a="tgth" aria-label="Світла тема">
        <span class="ico ${isLight ? 't-sun' : 't-moon'}">${ic(isLight ? 'sun' : 'moon')}</span>
        <span class="t"><b>Світла тема</b><small>${isLight ? 'Увімкнено' : 'Вимкнено'}</small></span>
        <span class="sw-pill ${isLight ? 'on' : ''}"><i></i></span>
      </div>
    </div>
    <div class="stl">
      ${stRow('cal', 't1', 'Графік роботи', schSum(), anyDay ? 'ok' : 'warn', 'gsch')}
      ${stRow('list', 't2', 'Послуги', n ? n + ' ' + plu(n, 'послуга', 'послуги', 'послуг') : 'Ще не додано', n ? 'ok' : 'warn', 'gsvc')}
      ${stRow('bag', 't-prod', 'Продукція', np ? np + ' ' + plu(np, 'товар', 'товари', 'товарів') : 'Ще не додано', np ? 'ok' : 'warn', 'gprod')}
      ${stRow('download', 't3', 'Резервна копія', 'Експорт та імпорт даних', '', 'gbkp')}
    </div>
    <div class="stl">
      ${stRow('logout', 't4', 'Вийти', '', '', 'lo', true)}
    </div>`;
}

/* ── Сторінки налаштувань (повний екран зі стрілкою «назад») ── */
const pgHead = (title, right) => `<div class="pg-h">
    <button type="button" class="ib pg-back" data-a="close" aria-label="Назад">${ic('prev')}</button>
    <h3>${title}</h3>${right || ''}
  </div>`;
const pgOpen = (h, back, dirtyFn) => { sheet(h, true); S.bk = back || null; S.pgDirty = dirtyFn || null; };
// повернення на список налаштувань (оновлює підсумки в рядках)
const stBack = () => { $('#sh').className = ''; render(true); };

/* Графік роботи */
const PS = {};
const psDay = () => {
  const c = PS.d.days[PS.day];
  return `
    <div class="dch">${DN.map((n, i) =>
      `<button type="button" class="${PS.day == i + 1 ? 'on' : ''} ${PS.d.days[i + 1].on ? '' : 'off'}" data-a="gday" data-v="${i + 1}">${n}</button>`).join('')}</div>
    <div class="swr"><span>Робочий день</span><label class="sw"><input type="checkbox" data-p="on" ${c.on ? 'checked' : ''}><i></i></label></div>
    <div class="fh">${ic('clock')} Робочі години</div>
    <div class="${c.on ? '' : 'dis'}">
      <div class="row" style="gap:10px">
        <div><label>Початок</label>${fld(`<input type="time" data-p="s" value="${c.s}">`, 'clock')}</div>
        <div><label>Кінець</label>${fld(`<input type="time" data-p="e" value="${c.e}">`, 'clock')}</div>
      </div>
      <button type="button" class="bt gh" data-a="gcp" style="margin-top:14px">${ic('checks')} Застосувати години до всіх днів</button>
    </div>`;
};
const psUpd = () => { const b = $('#pgsv'); if (b) b.disabled = JSON.stringify(PS.d) === PS.o; };
const psChange = t => {
  const p = t.dataset.p, c = PS.d.days[PS.day];
  if (p == 'step') PS.d.step = +t.value;
  else if (p == 'on') { c.on = t.checked ? 1 : 0; $('#psd').innerHTML = psDay(); }
  else if (t.value) c[p] = t.value;
  else t.value = c[p];
  psUpd();
};

function schPg() {
  PS.d = JSON.parse(JSON.stringify({ step: db.sched.step, days: db.sched.days }));
  PS.o = JSON.stringify(PS.d);
  PS.day = 1;
  const steps = [...new Set([15, 30, 60, PS.d.step])].sort((x, y) => x - y);
  pgOpen(`<div class="pn pg">
    ${pgHead('Графік роботи')}
    <div class="pg-b">
      <p class="mut pg-sub">Оберіть день і налаштуйте години роботи</p>
      <div id="psd">${psDay()}</div>
      <div class="fh">${ic('cal')} Крок записів</div>
      <select data-p="step">${steps.map(x => `<option value="${x}" ${x == PS.d.step ? 'selected' : ''}>${x} хв</option>`).join('')}</select>
      <small class="mut" style="display:block;margin-top:6px">Інтервал між слотами для запису</small>
    </div>
    <div class="pg-f"><button type="button" class="bt" id="pgsv" data-a="sws" disabled>${ic('check')} Зберегти</button></div>
  </div>`, stBack, () => JSON.stringify(PS.d) !== PS.o);
}

/* Послуги: список */
function svRows(q) {
  q = (q || '').trim().toLowerCase();
  const cats = [...new Set([...CATS, ...db.services.map(s => s.cat)])];
  const html = cats.map(c => {
    const l = db.services.filter(s => s.cat == c && (!q || s.title.toLowerCase().includes(q)));
    return l.length
      ? `<div class="sgh2">${esc(c)}</div>` + l.map(s => `
          <div class="scd ${cls(c)}" data-a="ss" data-v="${s.id}">
            <b>${esc(s.title)}</b><small>${money(s.price)} · ${dm(s.dur)}</small>
          </div>`).join('')
      : '';
  }).join('');
  return html || `<p class="mut" style="text-align:center;margin-top:28px">${q ? 'Нічого не знайдено' : 'Послуг ще немає. Натисніть «+», щоб додати.'}</p>`;
}

function svcPg() {
  pgOpen(`<div class="pn pg">
    ${pgHead('Послуги', `<button type="button" class="ib" data-a="ss" data-v="" aria-label="Додати послугу">${ic('plus')}</button>`)}
    <div class="pg-b">
      <div class="sr" style="margin:10px 0 6px">${ic('search')}<input id="svq" autocomplete="off" placeholder="Пошук"></div>
      <div id="svl">${svRows('')}</div>
    </div>
  </div>`, stBack);
}

/* Послуга: редагування */
function ss(id) {
  const s = id ? sv(id) : { cat: 'Подологія', title: '', desc: '', price: '', dur: 60 };
  const cats = [...new Set([...CATS, s.cat])];
  pgOpen(`<div class="pn pg">
    ${pgHead(id ? 'Послуга' : 'Нова послуга', id ? `<button type="button" class="ib dl" data-a="ds" data-v="${id}" aria-label="Видалити" title="Видалити">${ic('trash')}</button>` : '')}
    <div class="pg-b">
      <div class="fh first">${ic('list')} Категорія</div>
      <select id="sc">${cats.map(c => `<option ${c == s.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>

      <div class="fh">${ic('file')} Послуга</div>
      <input id="st" value="${esc(s.title)}" placeholder="Назва послуги">

      <div class="fh">${ic('msg')} Опис</div>
      <textarea id="sd" placeholder="Введіть опис">${esc(s.desc)}</textarea>

      <div class="fh">${ic('cash')} Вартість</div>
      <div class="fld"><input id="sp" type="number" inputmode="decimal" min="0" value="${s.price}"><em class="sf">₴</em></div>

      <div class="fh">${ic('clock')} Тривалість послуги</div>
      <div class="fld"><input id="su" type="number" inputmode="numeric" min="5" step="5" value="${s.dur}"><em class="sf">хв</em></div>
    </div>
    <div class="pg-f"><button type="button" class="bt" data-a="sv" data-v="${id || ''}">${ic('check')} Зберегти</button></div>
  </div>`, svcPg);
}

/* Резервна копія */
function bkpPg() {
  pgOpen(`<div class="pn pg">
    ${pgHead('Резервна копія')}
    <div class="pg-b">
      <p class="mut pg-sub">Зберігайте копію даних у файл і відновлюйте її за потреби. Робіть копію час від часу.</p>
      <button type="button" class="bt gh" data-a="ex">${ic('download')} Експорт копії</button>
      <button type="button" class="bt gh" data-a="im" style="margin-top:10px">${ic('upload')} Імпорт копії</button>
      <p class="mut pg-sub" style="margin-top:14px">Імпорт замінює всі поточні дані даними з файлу.</p>
    </div>
  </div>`, stBack);
}

/* ── PRODUCT CATALOG (SETTINGS) ────────────────────────────── */
let curProdPhoto = '';

function prodRows(q) {
  q = (q || '').toLowerCase().trim();
  const prods = (db.products || []).filter(p => !q || p.title.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q));
  if (!prods.length) {
    return `<p class="mut" style="text-align:center;margin-top:28px">${q ? 'Нічого не знайдено' : 'Продукції ще немає. Натисніть «+», щоб додати перший засіб.'}</p>`;
  }
  return prods.map(p => {
    const margin = (+p.price || 0) - (+p.cost || 0);
    return `
      <div class="cd prod-catalog-card" data-a="eprod" data-v="${p.id}">
        <div class="pcc-thumb-wrap">
          ${p.photo
            ? `<img src="${p.photo}" class="pcc-img" alt="${esc(p.title)}">`
            : `<div class="pcc-placeholder">${ic('camera')}</div>`
          }
        </div>
        <div class="pcc-body">
          <div class="pcc-title">${esc(p.title)}</div>
          <div class="pcc-tags">
            ${p.brand ? `<span class="pcc-brand">${esc(p.brand)}</span>` : ''}
            ${p.vol ? `<span class="pcc-vol">${esc(p.vol)}</span>` : ''}
          </div>
          <div class="pcc-fin">
            <span class="pcc-price">${money(p.price)}</span>
            <span class="pcc-cost">Закупка: ${money(p.cost)}</span>
            <span class="pcc-margin">+${money(margin)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function prodPg() {
  pgOpen(`<div class="pn pg">
    ${pgHead('Каталог продукції', `<button type="button" class="ib" data-a="eprod" data-v="" aria-label="Додати засіб">${ic('plus')}</button>`)}
    <div class="pg-b">
      <div class="sr" style="margin:10px 0 12px">${ic('search')}<input id="prod_q" autocomplete="off" placeholder="Пошук за назвою чи брендом"></div>
      <div id="prod_l">${prodRows('')}</div>
    </div>
  </div>`, stBack);
}

function prodSheet(id) {
  const p = id ? (pr(id) || {}) : { title: '', brand: '', vol: '', cost: '', price: '', note: '', photo: '' };
  curProdPhoto = p.photo || '';
  const quickVols = ['30 мл', '50 мл', '100 мл', '150 мл', '200 мл', '250 мл', '500 мл', '50 г', '100 г'];

  const diff = (+p.price || 0) - (+p.cost || 0);
  const pct = p.cost > 0 && p.price ? Math.round((diff / p.cost) * 100) : 0;

  pgOpen(`<div class="pn pg">
    ${pgHead(id ? 'Редагувати засіб' : 'Новий засіб', id ? `<button type="button" class="ib dl" data-a="dprod" data-v="${id}" aria-label="Видалити" title="Видалити">${ic('trash')}</button>` : '')}
    <div class="pg-b">
      <div class="prod-photo-section">
        <div id="prod_photo_preview" class="prod-photo-box">
          ${curProdPhoto ? `
            <img src="${curProdPhoto}" class="prod-photo-img" alt="Фото засобу">
            <button type="button" class="prod-photo-del" data-a="del-pphoto" aria-label="Видалити фото">${ic('x')}</button>
          ` : `
            <label for="prod_photo_file" class="prod-photo-upload-label">
              ${ic('camera')}
              <span>Додати фото</span>
            </label>
          `}
        </div>
        <input type="file" id="prod_photo_file" accept="image/*" style="display:none">
      </div>

      <div class="fh first">${ic('bag')} Назва продукції</div>
      <input id="pt" value="${esc(p.title)}" placeholder="Наприклад: Крем для стоп з сечовиною 10%">

      <div class="fh">${ic('work')} Виробник (Бренд)</div>
      <input id="pb" value="${esc(p.brand || '')}" placeholder="Наприклад: Baehr, Podopharm, SUDA">

      <div class="fh">${ic('file')} Вага чи об’єм</div>
      <input id="pv" value="${esc(p.vol || '')}" placeholder="Наприклад: 100 мл, 50 г">
      <div class="vol-chips">
        ${quickVols.map(v => `<button type="button" class="vol-chip" data-a="vchip" data-v="${v}">${v}</button>`).join('')}
      </div>

      <div class="fh">${ic('cash')} Ціна закупки (собівартість)</div>
      <div class="fld"><input id="pc" type="number" inputmode="decimal" min="0" value="${p.cost || ''}" placeholder="0"><em class="sf">₴</em></div>

      <div class="fh">${ic('cash')} Ціна продажу</div>
      <div class="fld"><input id="pp" type="number" inputmode="decimal" min="0" value="${p.price || ''}" placeholder="0"><em class="sf">₴</em></div>

      <div id="prod-margin-box" class="sal-summary-card" style="margin-top:16px">
        <div class="ssc-row ssc-main" style="margin-top:0;padding-top:0;border-top:0">
          <span>Ваш чистий заробіток з 1 шт</span>
          <b id="pm-diff">+${money(Math.max(0, diff))}</b>
        </div>
        <small class="mut" id="pm-pct" style="display:block;margin-top:4px">
          ${pct ? 'Націнка ' + pct + '%' : ''}
        </small>
      </div>

      <div class="fh">${ic('msg')} Примітки</div>
      <textarea id="pnote" placeholder="Особливості застосування, призначення...">${esc(p.note || '')}</textarea>
    </div>
    <div class="pg-f">
      <button type="button" class="bt" data-a="sprod" data-v="${id || ''}">${ic('check')} Зберегти засіб</button>
    </div>
  </div>`, prodPg);
}

/* ── ACTIONS ────────────────────────────────────────────────── */
const V    = i => $('#' + i).value;
const done = () => { $('#sh').className = ''; render(); };

function rd() {
  if (V('xdt')) cur.date = V('xdt');
  if (V('xs'))  cur.start = V('xs');
  const e = V('xe');
  if (e && tm(e) > tm(cur.start)) cur.dur = tm(e) - tm(cur.start);
  cur.dur     = Math.max(5, cur.dur || db.sched.step);
  cur.price   = +V('xp') || 0;
  cur.status  = V('xt');
  cur.comment = V('xm');
}

// зміна дати/часу у формі запису
function apChange(k) {
  if (k == 'xt') { thint(); return; }
  if (k == 'xdt') { if (V('xdt')) cur.date = V('xdt'); else $('#xdt').value = cur.date; }
  if (k == 'xs')  { if (V('xs')) cur.start = V('xs'); syncTimes(); }
  if (k == 'xe') {
    const e = V('xe');
    if (e && tm(e) > tm(cur.start)) cur.dur = tm(e) - tm(cur.start);
    else toast('Кінець має бути пізніше за початок', 'warn');
    syncTimes();
  }
  if (k == 'xdt' || k == 'xs' || k == 'xe') {
    const t = { ...cur, start: V('xs') || cur.start };
    if (V('xt') == 'plan' && isPast(t)) { $('#xt').value = 'done'; thint(); }
  }
  recH();
}

const A = {
  lo: () => window.__LOGOUT(),
  ic: () => impOpen(),

  pk: async () => {
    try {
      const r = await navigator.contacts.select(['name', 'tel'], { multiple: true });
      impList(r.map(c => ({ name: (c.name || [])[0] || '', phone: (c.tel || [])[0] || '' })));
    } catch (e) {}
  },

  ia: () => {
    const on = !IMP.every(c => c.dup || c.on);
    IMP.forEach(c => { if (!c.dup) c.on = on; });
    $('#il').innerHTML = impRows($('#iq').value.toLowerCase());
    icnt();
  },

  is: () => {
    const n = IMP.filter(c => c.on && !c.dup);
    if (!n.length) return;
    n.forEach(c => db.clients.push({ id: uid(), name: c.name, phone: c.phone, ig: '', note: '' }));
    save();
    toast('Додано ' + n.length + ' контактів');
    done();
  },

  ex: () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(db)], { type: 'application/json' }));
    a.download = 'karelova-data.json';
    a.click();
    toast('Резервну копію збережено');
  },

  im: () => document.getElementById('fi').click(),

  close: () => {
    if (dirty() && !confirm('Закрити без збереження?\nВнесені дані буде втрачено.')) return;
    if (S.bk) { const b = S.bk; S.bk = null; b(); } else $('#sh').className = '';
  },

  // налаштування
  tgth: () => applyTheme(document.documentElement.getAttribute('data-theme') !== 'light'),
  gsch: () => schPg(),
  gsvc: () => svcPg(),
  gbkp: () => bkpPg(),
  gday: v => { PS.day = +v; $('#psd').innerHTML = psDay(); },
  gcp: () => {
    const c = PS.d.days[PS.day];
    DN.forEach((_, i) => { PS.d.days[i + 1].s = c.s; PS.d.days[i + 1].e = c.e; });
    psUpd();
    toast('Години застосовано до всіх днів');
  },
  sws: () => {
    const bad = DN.findIndex((_, i) => PS.d.days[i + 1].on && tm(PS.d.days[i + 1].e) <= tm(PS.d.days[i + 1].s));
    if (bad >= 0) {
      PS.day = bad + 1;
      $('#psd').innerHTML = psDay();
      toast('Кінець має бути пізніше за початок (' + DN[bad] + ')', 'warn');
      return;
    }
    db.sched.step = PS.d.step;
    db.sched.days = PS.d.days;
    save();
    toast('Графік збережено');
    stBack();
  },

  tab: v => { S.tab = v; render(); },
  dw:  () => setDay(1),
  dof: () => setDay(0),
  mt:  (v, t) => { const el = t.closest('.mo'); el.classList.toggle('open'); S.mx[v] = el.classList.contains('open'); },
  day: v => {
    const now = Date.now();
    if (lastDayTap.id === v && (now - lastDayTap.t) < 450) {
      lastDayTap = { id: '', t: 0 };
      S.d = v;
      setDay(!dcfg(v).on);
      return;
    }
    lastDayTap = { id: v, t: now };
    S.d = v;
    render(true);
  },
  // перехід між місяцями: нижня панель дня переходить разом з календарем
  pm:  v => {
    S.m = new Date(S.m.getFullYear(), S.m.getMonth() + +v, 1);
    const y = S.m.getFullYear(), mo = S.m.getMonth(), t = new Date();
    if (y == t.getFullYear() && mo == t.getMonth()) S.d = iso(t);            // поточний місяць → сьогодні
    else {                                                                    // інший → той самий день (або останній)
      const last = new Date(y, mo + 1, 0).getDate();
      S.d = iso(new Date(y, mo, Math.min(new Date(S.d + 'T00:00').getDate(), last)));
    }
    render(true);
  },
  ps:  v => { S.sm = new Date(S.sm.getFullYear(), S.sm.getMonth() + +v, 1); render(); },

  new:  v => actSheet(v),
  edit: v => {
    const a = db.appts.find(x => x.id == v);
    if (a && a.type === 'break') breakSheet(v);
    else apSheet(v);
  },
  'act-ap':  v => apSheet('', v),
  'act-brk': v => breakSheet('', v),

  // клієнт: вибір зі списку / створення нового прямо з пошуку
  pcl: v => {
    cur.cid = v;
    const c = db.clients.find(x => x.id == v);
    $('#xq').value = c ? c.name : cn(v);
    $('#xcw').classList.add('ok');
    if ($('#xcp')) {
      const ph = c ? (c.phone || '') : '';
      $('#xcp').value = ph;
      const callEl = $('#xcp-call');
      if (callEl) {
        callEl.href = ph ? 'tel:' + nph(ph) : 'javascript:void(0)';
        callEl.style.color = ph ? 'var(--ac2)' : 'var(--mu)';
      }
    }
    $('#xl').innerHTML = '';
    $('#xq').blur();
  },
  acl: () => {
    const n = V('xq').trim().replace(/\s+/g, ' ');
    if (!n) return;
    const phone = $('#xcp') ? $('#xcp').value.trim() : '';
    const c = { id: uid(), name: n, phone: phone, ig: '', note: '' };
    db.clients.push(c);
    save();
    toast('Клієнта додано');
    A.pcl(c.id);
  },

  // послуги: додати / кількість / прибрати
  tsp: () => pkOpen(),
  pkx: () => pkClose(),
  pkc: (v, t) => {
    document.querySelectorAll('#pkm .pk-tab').forEach(b => b.classList.toggle('on', b === t));
    document.querySelectorAll('#pkm .pk-g').forEach(g => { g.hidden = !!v && g.dataset.cat !== v; });
  },
  tgs: (v, t) => {
    if (pkSel.has(v)) pkSel.delete(v); else pkSel.add(v);
    t.classList.toggle('on', pkSel.has(v));
    pkFoot();
  },
  apk: () => {
    if (!pkSel.size) return;
    pkSel.forEach(id => cur.svc.push(id));
    pkClose();
    svChanged();
  },
  qty: v => {
    const [id, d] = v.split('|');
    if (d == '1') cur.svc.push(id);
    else if (cur.svc.filter(x => x == id).length > 1) cur.svc.splice(cur.svc.indexOf(id), 1);
    svChanged();
  },
  rsv: v => { cur.svc = cur.svc.filter(x => x != v); svChanged(); },

  // рекомендована година
  rh: v => { cur.start = v; syncTimes(); recH(); },

  dp: v => { cur.photos.splice(+v, 1); phs(); },

  sa: () => {
    rd();
    const phoneVal = $('#xcp') ? $('#xcp').value.trim() : '';
    if (!cur.cid) {
      const q = V('xq').trim().toLowerCase();
      const m = q && db.clients.find(c => c.name.trim().toLowerCase() == q);
      if (m) cur.cid = m.id;
    }
    if (!cur.cid) {
      const n = V('xq').trim().replace(/\s+/g, ' ');
      if (n) {
        const newC = { id: uid(), name: n, phone: phoneVal, ig: '', note: '' };
        db.clients.push(newC);
        cur.cid = newC.id;
      }
    } else {
      const cl = db.clients.find(c => c.id == cur.cid);
      if (cl && phoneVal !== undefined && (cl.phone || '') !== phoneVal) {
        cl.phone = phoneVal;
      }
    }
    if (!cur.cid) { toast('Оберіть або додайте клієнта', 'warn'); return; }
    if (cur.status == 'plan' && isPast(cur)) cur.status = 'done';
    if (cur.status != 'canc') {
      const a1 = tm(cur.start), b1 = a1 + cur.dur;
      const clash = db.appts.filter(x => x.id != cur.id && x.date == cur.date && x.status != 'canc'
        && tm(x.start) < b1 && tm(x.start) + x.dur > a1);
      if (clash.length) {
        const list = clash.map(x => '• ' + x.start + ' – ' + ft(tm(x.start) + x.dur) + ' · ' + (x.type == 'break' ? (x.title || 'Подія') : cn(x.cid))).join('\n');
        if (!confirm('На цей час уже є запис:\n' + list + '\n\nЗберегти все одно? Обидва записи залишаться.')) return;
      }
    }
    if (cur.id) db.appts = db.appts.map(a => a.id == cur.id ? cur : a);
    else { cur.id = uid(); db.appts.push(cur); }
    save();
    S.d = cur.date;
    S.m = new Date(+cur.date.slice(0, 4), +cur.date.slice(5, 7) - 1, 1);
    toast('Запис збережено');
    done();
  },

  da: () => {
    if (confirm('Видалити запис?')) {
      db.appts = db.appts.filter(a => a.id != cur.id);
      save();
      done();
    }
  },

  sbrk: () => {
    const title = (V('bn') || '').trim() || 'Подія';
    const date  = V('bdt') || cur.date || S.d;
    const start = V('bs');
    const end   = V('be');
    const comment = (V('bm') || '').trim();
    if (!start || !end) { toast('Вкажіть час', 'warn'); return; }
    const tStart = tm(start);
    const tEnd = tm(end);
    if (tEnd <= tStart) { toast('Час закінчення має бути пізніше початку', 'warn'); return; }
    const dur = tEnd - tStart;

    const clash = db.appts.filter(x => x.id != cur.id && x.date == date && x.status != 'canc'
      && tm(x.start) < tStart + dur && tm(x.start) + x.dur > tStart);
    if (clash.length) {
      const list = clash.map(x => '• ' + x.start + ' – ' + ft(tm(x.start) + x.dur) + ' · ' + (x.type == 'break' ? (x.title || 'Подія') : cn(x.cid))).join('\n');
      if (!confirm('На цей час уже є запис:\n' + list + '\n\nЗберегти все одно? Обидва записи залишаться.')) return;
    }

    cur.type = 'break';
    cur.title = title;
    cur.date = date;
    cur.start = start;
    cur.dur = dur;
    cur.comment = comment;
    cur.price = 0;
    cur.svc = [];
    cur.status = 'plan';
    cur.cid = '';

    if (cur.id) db.appts = db.appts.map(a => a.id == cur.id ? cur : a);
    else { cur.id = uid(); db.appts.push(cur); }

    save();
    S.d = cur.date;
    S.m = new Date(+cur.date.slice(0, 4), +cur.date.slice(5, 7) - 1, 1);
    toast('Подію збережено');
    done();
  },

  dbrk: () => {
    if (confirm('Видалити цей запис?')) {
      db.appts = db.appts.filter(a => a.id != cur.id);
      save();
      done();
      toast('Видалено');
    }
  },

  cs: v => cs(v),
  mo: () => { $('#mo').style.display = 'block'; },

  sc: v => {
    const nm = $('#cn').value.trim();
    if (!nm) { toast('\u0412\u043a\u0430\u0436\u0456\u0442\u044c \u0456\u043c\u2019\u044f', 'warn'); return; }
    const o = { name: nm, phone: V('cp').trim(), note: $('#cm') ? V('cm') : '' };
    if (v) Object.assign(db.clients.find(c => c.id == v), o);
    else db.clients.push({ id: uid(), ig: '', ...o });
    save();
    toast('\u041a\u043b\u0456\u0454\u043d\u0442\u0430 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e');
    done();
  },

  dc: v => {
    if (db.appts.some(a => a.cid == v)) {
      toast('\u0423 \u043a\u043b\u0456\u0454\u043d\u0442\u0430 \u0454 \u0437\u0430\u043f\u0438\u0441\u0438. \u0421\u043f\u043e\u0447\u0430\u0442\u043a\u0443 \u0432\u0438\u0434\u0430\u043b\u0456\u0442\u044c \u0457\u0445.', 'warn');
      return;
    }
    if (confirm('\u0412\u0438\u0434\u0430\u043b\u0438\u0442\u0438 \u043a\u043b\u0456\u0454\u043d\u0442\u0430?')) {
      db.clients = db.clients.filter(c => c.id != v);
      save();
      done();
    }
  },

  es: v => es(v),

  se: v => {
    const o = { cat: V('ec'), amount: +V('ea') || 0, date: V('ed'), desc: V('eo') };
    if (v) Object.assign(db.expenses.find(e => e.id == v), o);
    else db.expenses.push({ id: uid(), ...o });
    save();
    toast('\u0412\u0438\u0442\u0440\u0430\u0442\u0443 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e');
    done();
  },

  de: v => {
    db.expenses = db.expenses.filter(e => e.id != v);
    save();
    done();
  },

  ss: v => ss(v),

  sv: v => {
    if (!V('st').trim()) { toast('\u0412\u043a\u0430\u0436\u0456\u0442\u044c \u043d\u0430\u0437\u0432\u0443 \u043f\u043e\u0441\u043b\u0443\u0433\u0438', 'warn'); return; }
    const o = { cat: V('sc'), title: V('st').trim(), desc: V('sd'), price: +V('sp') || 0, dur: +V('su') || 30 };
    if (v) Object.assign(sv(v), o);
    else db.services.push({ id: uid(), ...o });
    save();
    toast('\u041f\u043e\u0441\u043b\u0443\u0433\u0443 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e');
    svcPg();
  },

  ds: v => {
    if (confirm('Видалити послугу?')) {
      db.services = db.services.filter(s => s.id != v);
      save();
      svcPg();
    }
  },

  // ── Продажі ──
  'sal-arch': () => salArchPg(),
  saltab: v => { S.salTab = v; render(true); },
  nsal: () => salSheet(''),
  esal: v => salSheet(v),
  'pick-sal': v => {
    const s = (db.sales || []).find(x => x.id == v);
    if (s) {
      s.status = 'done';
      save();
      toast('Замовлення видано клієнту');
      if ($('#cn') && s.cid) {
        cs(s.cid);
      } else {
        render(true);
      }
    }
  },
  'undo-sal': v => {
    const s = (db.sales || []).find(x => x.id == v);
    if (s) {
      s.status = 'wait';
      save();
      toast('Замовлення повернуто в очікування видачі');
      if ($('#sal-arch-list')) {
        salArchPg();
      } else {
        render(true);
      }
    }
  },
  'sal-pcl': v => {
    curSal.cid = v;
    if ($('#sal-cq')) $('#sal-cq').value = cn(v);
    if ($('#sal-cw')) $('#sal-cw').classList.add('ok');
    if ($('#sal-cl-list')) $('#sal-cl-list').innerHTML = '';
  },
  'sal-nocl': () => {
    curSal.cid = '';
    if ($('#sal-cq')) $('#sal-cq').value = '';
    if ($('#sal-cw')) $('#sal-cw').classList.remove('ok');
    if ($('#sal-cl-list')) $('#sal-cl-list').innerHTML = '';
  },
  'sal-acl': () => {
    const n = ($('#sal-cq') ? $('#sal-cq').value : '').trim().replace(/\s+/g, ' ');
    if (!n) return;
    const c = { id: uid(), name: n, phone: '', ig: '', note: '' };
    db.clients.push(c);
    save();
    toast('Клієнта додано');
    A['sal-pcl'](c.id);
  },
  'pk-prod': () => pkProdOpen(),
  'add-it': v => {
    const p = pr(v);
    if (!p) return;
    curSal.items = curSal.items || [];
    const existing = curSal.items.find(x => x.pid == p.id);
    if (existing) {
      existing.qty++;
    } else {
      curSal.items.push({
        pid: p.id,
        title: p.title,
        brand: p.brand || '',
        vol: p.vol || '',
        cost: +p.cost || 0,
        price: +p.price || 0,
        qty: 1
      });
    }
    salCalc();
    salOpenForm(curSal.id);
  },
  'it-qty': v => {
    const [idx, d] = v.split('|');
    const item = curSal.items[+idx];
    if (!item) return;
    item.qty = Math.max(1, item.qty + +d);
    salCalc();
    $('#sal-items-wrap').innerHTML = salItemsHtml();
    $('#sal-sum-wrap').innerHTML = salSummaryHtml();
  },
  'it-del': v => {
    curSal.items.splice(+v, 1);
    salCalc();
    $('#sal-items-wrap').innerHTML = salItemsHtml();
    $('#sal-sum-wrap').innerHTML = salSummaryHtml();
  },
  'sal-st': v => {
    curSal.status = v;
    document.querySelectorAll('.sal-status-picks .ssp-btn').forEach(b => {
      b.classList.toggle('on', b.dataset.v === v);
    });
  },
  ssal: () => {
    if (!curSal.items.length) { toast('Додайте хоча б один засіб', 'warn'); return; }
    curSal.date = $('#sal-dt') ? $('#sal-dt').value : curSal.date;
    curSal.note = $('#sal-note') ? $('#sal-note').value.trim() : '';
    salCalc();
    if (curSal.id) {
      db.sales = db.sales.map(s => s.id == curSal.id ? curSal : s);
    } else {
      curSal.id = uid();
      db.sales = db.sales || [];
      db.sales.push(curSal);
    }
    save();
    toast(curSal.status == 'wait' ? 'Замовлення збережено (очікує видачі)' : 'Продаж збережено');
    done();
  },
  dsal: v => {
    if (confirm('Видалити це замовлення?')) {
      db.sales = (db.sales || []).filter(s => s.id != v);
      save();
      done();
      toast('Замовлення видалено');
    }
  },
  'nsal-cl': v => salSheet('', v, iso(new Date())),
  'nsal-ap': () => salSheet('', cur ? cur.cid : '', cur ? cur.date : iso(new Date())),
  'act-sal': v => salSheet('', '', v || S.d),

  // ── Продукція в налаштуваннях ──
  gprod: () => prodPg(),
  eprod: v => prodSheet(v),
  'del-pphoto': () => {
    curProdPhoto = '';
    const box = $('#prod_photo_preview');
    if (box) {
      box.innerHTML = `
        <label for="prod_photo_file" class="prod-photo-upload-label">
          ${ic('camera')}
          <span>Додати фото</span>
        </label>
      `;
    }
  },
  sprod: v => {
    const title = ($('#pt') ? $('#pt').value : '').trim();
    if (!title) { toast('Вкажіть назву засобу', 'warn'); return; }
    const o = {
      title,
      brand: ($('#pb') ? $('#pb').value : '').trim(),
      vol: ($('#pv') ? $('#pv').value : '').trim(),
      cost: +($('#pc') ? $('#pc').value : 0) || 0,
      price: +($('#pp') ? $('#pp').value : 0) || 0,
      photo: curProdPhoto,
      note: ($('#pnote') ? $('#pnote').value : '').trim()
    };
    db.products = db.products || [];
    if (v) Object.assign(pr(v), o);
    else db.products.push({ id: uid(), ...o });
    save();
    toast('Засіб збережено у каталозі');
    prodPg();
  },
  dprod: v => {
    if (confirm('Видалити цей засіб з каталогу?')) {
      db.products = (db.products || []).filter(p => p.id != v);
      save();
      prodPg();
      toast('Засіб видалено');
    }
  },
  vchip: v => {
    if ($('#pv')) $('#pv').value = v;
    const cost = +($('#pc') ? $('#pc').value : 0) || 0;
    const price = +($('#pp') ? $('#pp').value : 0) || 0;
    const diff = price - cost;
    const pct = cost > 0 ? Math.round((diff / cost) * 100) : 0;
    if ($('#pm-diff')) $('#pm-diff').textContent = (diff >= 0 ? '+' : '') + money(diff);
    if ($('#pm-pct')) $('#pm-pct').textContent = cost > 0 ? 'Націнка ' + pct + '%' : '';
  },
};

/* ── EVENT DELEGATION ───────────────────────────────────────── */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-a]');
  if (t && A[t.dataset.a]) A[t.dataset.a](t.dataset.v, t);
});

document.addEventListener('focusin', e => {
  if (e.target.id == 'xq') { if (cur && cur.cid) e.target.select(); cql(); }
  if (e.target.id == 'sal-cq') { if (curSal && curSal.cid) e.target.select(); salCql(); }
});

document.addEventListener('input', e => {
  if (e.target.id == 'xq') { cur.cid = ''; $('#xcw').classList.remove('ok'); cql(); return; }
  if (e.target.id == 'xcp') {
    const ph = e.target.value.trim();
    const callEl = $('#xcp-call');
    if (callEl) {
      callEl.href = ph ? 'tel:' + nph(ph) : 'javascript:void(0)';
      callEl.style.color = ph ? 'var(--ac2)' : 'var(--mu)';
    }
    return;
  }
  if (e.target.id == 'sal-cq') { if (curSal) { curSal.cid = ''; $('#sal-cw').classList.remove('ok'); } salCql(); return; }
  if (e.target.id == 'svq') { $('#svl').innerHTML = svRows(e.target.value); return; }
  if (e.target.id == 'prod_q') { $('#prod_l').innerHTML = prodRows(e.target.value); return; }
  if (e.target.id == 'pk_prod_q') { $('#pk_prod_l').innerHTML = pkProdRows(e.target.value); return; }
  if (e.target.id == 'iq') { $('#il').innerHTML = impRows(e.target.value.toLowerCase()); return; }
  if (e.target.dataset.c == 'q') { S.q = e.target.value; $('#cl').innerHTML = cl(); return; }
  if (e.target.dataset.c == 'sq') {
    S.sq = e.target.value;
    const q = (S.sq || '').toLowerCase().trim();
    const waitSales = (db.sales || []).filter(s => s.status == 'wait').sort((a, b) => b.date.localeCompare(a.date));
    const flt = waitSales.filter(s => {
      if (!q) return true;
      const cName = cn(s.cid).toLowerCase();
      const pNames = (s.items || []).map(i => (i.title || '') + ' ' + (i.brand || '')).join(' ').toLowerCase();
      return cName.includes(q) || pNames.includes(q);
    });
    const el = $('#sal-list');
    if (el) el.innerHTML = salListRows(flt, 'wait');
    return;
  }
  if (e.target.id == 'sal_arch_q') {
    S.salArchQ = e.target.value;
    const q = (S.salArchQ || '').toLowerCase().trim();
    const doneSales = (db.sales || []).filter(s => s.status == 'done').sort((a, b) => b.date.localeCompare(a.date));
    const flt = doneSales.filter(s => {
      if (!q) return true;
      const cName = cn(s.cid).toLowerCase();
      const pNames = (s.items || []).map(i => (i.title || '') + ' ' + (i.brand || '')).join(' ').toLowerCase();
      return cName.includes(q) || pNames.includes(q);
    });
    const el = $('#sal-arch-list');
    if (el) el.innerHTML = salListRows(flt, 'done');
    return;
  }
  if (['pc', 'pp'].includes(e.target.id)) {
    const cost = +($('#pc') ? $('#pc').value : 0) || 0;
    const price = +($('#pp') ? $('#pp').value : 0) || 0;
    const diff = price - cost;
    const pct = cost > 0 ? Math.round((diff / cost) * 100) : 0;
    if ($('#pm-diff')) $('#pm-diff').textContent = (diff >= 0 ? '+' : '') + money(diff);
    if ($('#pm-pct')) $('#pm-pct').textContent = cost > 0 ? 'Націнка ' + pct + '%' : '';
    return;
  }
});

document.addEventListener('change', async e => {
  const t = e.target, c = t.dataset.c;
  if (t.dataset.p) { psChange(t); return; }
  if (['xdt', 'xs', 'xe', 'xt'].includes(t.id)) { apChange(t.id); return; }
  if (t.id == 'fv') {
    const f = t.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const x = String(r.result);
      impList(/BEGIN:VCARD/i.test(x) ? vcf(x) : csv(x));
    };
    r.readAsText(f);
    return;
  }
  if (c == 'ip') { IMP[+t.dataset.d].on = t.checked; icnt(); return; }
  if (t.id == 'fi') {
    const r = new FileReader();
    r.onload = () => {
      try {
        const o = JSON.parse(r.result);
        if (!o.services) throw 0;
        db = o;
        save();
        $('#sh').className = '';
        render();
        toast('\u0414\u0430\u043d\u0456 \u0456\u043c\u043f\u043e\u0440\u0442\u043e\u0432\u0430\u043d\u043e');
      } catch (x) {
        toast('\u041d\u0435\u043a\u043e\u0440\u0435\u043a\u0442\u043d\u0438\u0439 \u0444\u0430\u0439\u043b', 'err');
      }
    };
    r.readAsText(t.files[0]);
    return;
  }
  if (t.id == 'ff') { for (const f of t.files) cur.photos.push(await rz(f)); phs(); return; }
  if (t.id == 'prod_photo_file') {
    const f = t.files[0];
    if (!f) return;
    curProdPhoto = await rzSq(f);
    const box = $('#prod_photo_preview');
    if (box) {
      box.innerHTML = `
        <img src="${curProdPhoto}" class="prod-photo-img" alt="Фото засобу">
        <button type="button" class="prod-photo-del" data-a="del-pphoto" aria-label="Видалити фото">${ic('x')}</button>
      `;
    }
    return;
  }
});

/* ── IMPORT CONTACTS ────────────────────────────────────────── */
let IMP = [];

const icnt = () => {
  const e = $('#icn');
  if (e) e.textContent = IMP.filter(c => c.on && !c.dup).length;
};

const impRows = q => IMP.map((c, i) =>
  (c.name + c.phone).toLowerCase().includes(q)
    ? `<label class="cd li" style="margin:0 0 6px;display:flex;align-items:center;gap:10px;color:var(--tx);font-size:15px;cursor:pointer">
         <input type="checkbox" style="width:20px;flex:none" data-c="ip" data-d="${i}" ${c.on ? 'checked' : ''} ${c.dup ? 'disabled' : ''}>
         <span style="flex:1"><b>${esc(c.name)}</b><br><small class="mut">${esc(c.phone)}${c.dup ? ' · вже є' : ''}</small></span>
       </label>`
    : ''
).join('');

function impOpen() {
  IMP = [];
  sheet(`
    <h3>Імпорт контактів</h3>
    <p class="mut">Оберіть контакти з телефону або завантажте файл.<br>iPhone: Контакти → виділити → Поділитися → vCard.<br>Android: Контакти → Експорт (.vcf). Підходить і CSV з Google Контактів.</p>
    ${'contacts' in navigator && 'ContactsManager' in window
      ? `<button class="bt" style="margin-bottom:8px" data-a="pk">${ic('imp')} Обрати з телефонної книги</button>`
      : ''}
    <label class="bt gh" for="fv">
      ${ic('file')} Завантажити файл контактів
    </label>
  `);
}

function impList(l) {
  const have = new Set(db.clients.map(c => nph(c.phone)).filter(Boolean));
  IMP = l
    .map(c => ({ name: (c.name || '').trim(), phone: nph(c.phone) }))
    .filter(c => c.name || c.phone)
    .map(c => ({ name: c.name || c.phone, phone: c.phone, dup: !!c.phone && have.has(c.phone), on: false }));
  if (!IMP.length) { toast('Контактів у файлі не знайдено', 'warn'); return; }
  sheet(`
    <h3>Знайдено: ${IMP.length}</h3>
    <div class="sr">${ic('search')}<input id="iq" placeholder="Пошук"></div>
    <div class="row" style="margin:10px 0">
      <button class="bt gh" data-a="ia">${ic('checks')} Обрати всіх</button>
      <button class="bt" data-a="is">${ic('plus')} Додати (<span id="icn">0</span>)</button>
    </div>
    <div id="il">${impRows('')}</div>
  `);
}

function vcf(t) {
  t = t.replace(/\r/g, '').replace(/\n[ \t]/g, '');
  return t.split(/BEGIN:VCARD/i).slice(1).map(b => {
    const g = k => { const m = b.match(new RegExp('^(?:item\\d+\\.)?'+k+'[^:\\n]*:(.*)$', 'im')); return m ? m[1].trim() : ''; };
    let n = g('FN');
    if (!n) n = g('N').split(';').filter(Boolean).reverse().join(' ');
    return { name: n.replace(/\\,/g, ','), phone: g('TEL') };
  });
}

function csv(t) {
  const rows = []; let r = [], f = '', q = 0;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch == '"') { if (t[i+1] == '"') { f += '"'; i++; } else q = 0; } else f += ch; }
    else if (ch == '"') q = 1;
    else if (ch == ',' || ch == ';') { r.push(f); f = ''; }
    else if (ch == '\n') { r.push(f); rows.push(r); r = []; f = ''; }
    else if (ch != '\r') f += ch;
  }
  r.push(f); rows.push(r);
  const h  = rows[0].map(x => x.trim().toLowerCase());
  const ni = h.findIndex(x => /^name$|display|^повне/.test(x));
  const fi = h.findIndex(x => /first|given|^ім/.test(x));
  const li = h.findIndex(x => /last|family|прізв/.test(x));
  const pi = h.findIndex(x => /phone.*value|^phone|^tel|тел|mobile/.test(x));
  return rows.slice(1).map(r => ({
    name: ni >= 0 && r[ni] ? r[ni] : [r[fi], r[li]].filter(Boolean).join(' '),
    phone: pi >= 0 ? r[pi] || '' : '',
  }));
}

/* ── KEYBOARD NAV ───────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  const t = e.target;
  if (e.key == 'Enter' && t.getAttribute && t.getAttribute('role') == 'button') t.click();
  if (e.key == 'Escape' && $('#pkm') && $('#pkm').classList.contains('on')) { pkClose(); return; }
  if (e.key == 'Escape' && $('#sh').classList.contains('on')) { $('#sh').className = ''; }
});

/* ── АВТОЗАВЕРШЕННЯ ─────────────────────────────────────────── */
// запис вважається минулим, коли його час закінчення вже пройшов
function isPast(a) {
  const n = new Date(), t = iso(n);
  return a.date < t || (a.date == t && tm(a.start) + a.dur <= n.getHours() * 60 + n.getMinutes());
}
// «Заплановано» → «Завершено» для всіх записів, час яких минув (скасовані не чіпаємо)
function autoDone() {
  let ch = 0;
  db.appts.forEach(a => { if (a.status == 'plan' && isPast(a)) { a.status = 'done'; ch++; } });
  if (ch) save();
  return ch;
}
const autoTick = () => { if (autoDone() && !$('#sh').classList.contains('on')) render(true); };
setInterval(autoTick, 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState == 'visible') autoTick(); });

/* ── INIT ───────────────────────────────────────────────────── */
try { if (localStorage.getItem('karelova_theme') === 'light') applyTheme(true, false); } catch (e) {}
autoDone();
render();

setTimeout(() => {
  const p = document.getElementById('splash');
  if (p) p.classList.add('off');
}, 2200);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
