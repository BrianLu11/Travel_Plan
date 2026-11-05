/* Kyoto Autumn & Tea · 2026/11/20–24
 * Data-driven itinerary. No dependencies. Edit the 'days' constant to revise the plan.
 * All rail times are indicative until seats / exact trains are confirmed.
 */
'use strict';

const mapUrl = query => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
const walkingUrl = stops => 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(stops[0]) + '&destination=' + encodeURIComponent(stops[stops.length - 1]) + (stops.length > 2 ? '&waypoints=' + encodeURIComponent(stops.slice(1, -1).join('|')) : '') + '&travelmode=walking';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const travelKind = {transport:'交通',sight:'景點',night:'夜楓',tea:'品茶・購茶',meal:'用餐',rest:'休息',hotel:'住宿'};
// event array: start, end, title, description, type, Google Maps search query (optional), flag (optional)
const days = [
  {
    date:'2026-11-20', day:'FRI', dateShort:'11 / 20', label:'五', area:'京都東南部', overview:'東福寺・清水寺・高台寺',
    title:'從東福寺走進東山楓色', intro:'週五先看東福寺通天橋，接著順著清水寺、二年坂與高台寺往北走。清水寺選日間參拜，高台寺看夜楓（方案 A）。',
    route:['京都站','東福寺','清水寺','高台寺','祇園'],
    walk:['清水寺 京都','二年坂 京都','高台寺 京都','八坂神社 京都'],
    keyTitle:'方案 A：清水寺日間、高台寺夜楓',
    keyText:'11/20 清水寺不安排夜間點燈。東福寺通天橋秋季開放至 16:00 受理截止；高台寺夜間特別參拜 17:00 起。首日保留車班及行李寄放的緩衝。',
    transit:'東京 → 京都搭東海道新幹線；飯店位於烏丸御池附近。飯店寄行李後，地下鐵回京都站轉 JR 奈良線至東福寺。之後京阪東福寺 → 清水五條，步行上坡至清水寺，再沿東山往北走。',
    tips:['清水五條到清水寺有上坡，預留約 25–30 分鐘步行。','晚餐在祇園／四條河原町一帶，之後回飯店。'],
    events:[
      ['07:30','09:45','東京 → 京都','東海道新幹線のぞみ；為建議出發時段，需依實際訂票班次調整。','transport','東京駅','候選乘車時段'],
      ['09:45','10:30','前往飯店、寄放行李','京都站 → 地下鐵烏丸線 → 烏丸御池，步行至 Hotel Monterey Kyoto。','hotel','ホテルモントレ京都'],
      ['10:30','11:15','飯店 → 東福寺','地下鐵到京都站轉 JR 奈良線，東福寺站下車步行。','transport','東福寺駅 京都'],
      ['11:15','13:00','東福寺・通天橋','從通天橋俯瞰紅葉溪谷，視時間選擇方丈庭園。','sight','東福寺 京都'],
      ['13:00','13:45','午餐','東福寺周邊簡單用餐，避免下午寺院行程延誤。','meal'],
      ['13:45','14:30','前往清水寺','京阪東福寺站 → 清水五條站，接著步行上坡。','transport','清水五条駅 京都'],
      ['14:30','16:00','清水寺（日間）','清水舞台與東山紅葉；此日不排清水寺夜楓。','sight','清水寺 京都'],
      ['16:00','17:00','三年坂 → 二年坂 → 寧寧之道','順著東山老街往北走，沿途可買點心、拍照。','sight','二年坂 京都'],
      ['17:00','18:30','高台寺夜楓','夜間庭園與池水倒影，保留排隊時間。','night','高台寺 京都'],
      ['18:30','20:00','八坂神社、祇園晚餐','順著祇園一帶散步，晚上在此用餐。','meal','祇園 京都'],
      ['20:00','20:40','返回飯店、Check-in','搭阪急或地下鐵返回烏丸一帶，辦理入住。','hotel','ホテルモントレ京都']
    ]
  },
  {
    date:'2026-11-21', day:'SAT', dateShort:'11 / 21', label:'六', area:'嵐山', overview:'天龍寺・竹林・常寂光寺',
    title:'嵐山，留一整天給楓紅', intro:'今天只往京都西側移動；JR 嵯峨嵐山站進，沿天龍寺、竹林、常寂光寺走到渡月橋，再由阪急嵐山站返回市區。',
    route:['JR 嵯峨嵐山','天龍寺','竹林','常寂光寺','渡月橋','阪急嵐山'],
    walk:['天龍寺 京都','竹林の小径 嵐山','常寂光寺 京都','渡月橋 京都','阪急嵐山駅'],
    keyTitle:'只逛嵐山，不跨城去清水寺',
    keyText:'天龍寺 2026/11/14–30 有 07:30 開始的庭園早朝參拜。上午依序完成最熱門的賞楓點，下午回飯店休息；不再安排從嵐山跑到東山。',
    transit:'飯店步行至烏丸御池，搭地下鐵東西線到二條，轉 JR 嵯峨野線至嵯峨嵐山。回程從阪急嵐山搭到桂，轉阪急京都線至烏丸，步行回飯店。',
    tips:['常寂光寺是紅葉重點，至少預留 70–80 分鐘。','週六嵐山可能擁擠，午餐可在 11:30 前後提早吃。'],
    events:[
      ['07:00','07:35','飯店早餐','含早餐，盡量準時出門。','meal','ホテルモントレ京都'],
      ['07:35','08:20','前往嵐山','烏丸御池 → 二條（地下鐵）→ JR 嵯峨嵐山，步行至天龍寺。','transport','嵯峨嵐山駅'],
      ['08:20','09:10','天龍寺・曹源池庭園','利用秋季特別早朝參拜，欣賞借景式庭園與紅葉。','sight','天龍寺 京都'],
      ['09:10','09:40','嵐山竹林小徑','從天龍寺北門附近接往竹林路線。','sight','竹林の小径 京都'],
      ['09:40','10:00','步行前往常寂光寺','穿過嵯峨野街巷，避免折返竹林入口。','transport','常寂光寺 京都'],
      ['10:00','11:20','常寂光寺','紅葉階梯、仁王門、多寶塔；今天的賞楓主角。','sight','常寂光寺 京都'],
      ['11:20','12:20','午餐','嵯峨野周邊用餐，可優先找不用久候的店。','meal'],
      ['12:20','13:50','嵐山公園 → 渡月橋','沿保津川走到渡月橋，留下看山色與買點心的時間。','sight','渡月橋 京都'],
      ['13:50','14:40','阪急嵐山 → 烏丸','阪急嵐山線至桂，轉京都線至烏丸。','transport','阪急嵐山駅'],
      ['14:40','17:30','飯店休息／四條烏丸自由活動','三連休人多，午後適合休息與附近咖啡店。','rest','四条烏丸 京都'],
      ['17:30','19:00','晚餐','四條烏丸或錦市場周邊，自由安排。','meal','四条烏丸 京都']
    ]
  },
  {
    date:'2026-11-22', day:'SUN', dateShort:'11 / 22', label:'日', area:'東山北部', overview:'銀閣寺・哲學之道・永觀堂',
    title:'沿哲學之道，一路走向夜楓', intro:'從銀閣寺開始一路往南。法然院有秋季特別公開，走哲學之道到南禪寺，傍晚步行回永觀堂參加夜間參拜。',
    route:['銀閣寺','法然院','哲學之道','南禪寺','永觀堂'],
    walk:['銀閣寺 京都','法然院 京都','哲学の道 京都','南禅寺 京都','永観堂 京都'],
    keyTitle:'永觀堂夜楓是今日重點',
    keyText:'永觀堂夜間參拜 17:30 起，通常需現場購票並可能排隊。南禪寺往永觀堂只是約 10–15 分鐘的小幅北返，並非跨京都市區。',
    transit:'飯店 → 地下鐵烏丸線至今出川，轉市巴士前往銀閣寺道（假日可考慮計程車）。全天景點間以步行為主；晚上由蹴上站搭地下鐵東西線回烏丸御池。',
    tips:['法然院秋季伽藍內特別公開：2026/11/18–24，09:30–16:00。','哲學之道步行較多，穿舒適鞋；巴士若壅塞可彈性改計程車。'],
    events:[
      ['07:30','08:15','飯店早餐','今天步行較多，吃完再出發。','meal','ホテルモントレ京都'],
      ['08:15','09:10','前往銀閣寺','地下鐵到今出川，再轉巴士（或計程車）到銀閣寺道。','transport','銀閣寺道 バス停'],
      ['09:10','10:10','銀閣寺','庭園、銀沙灘、山坡展望路線。','sight','銀閣寺 京都'],
      ['10:10','10:30','步行前往法然院','沿鹿谷一帶小路南下。','transport','法然院 京都'],
      ['10:30','11:20','法然院・秋季特別公開','茅葺山門、白砂壇及通常不對外開放的伽藍。','sight','法然院 京都'],
      ['11:20','12:15','哲學之道散步','沿水路往南走，賞秋色與住宅區風景。','sight','哲学の道 京都'],
      ['12:15','13:15','午餐','哲學之道南段、岡崎一帶。','meal'],
      ['13:15','15:00','南禪寺、水路閣','三門、水路閣、庭園，可依現場人潮調整。','sight','南禅寺 京都'],
      ['15:00','16:30','附近茶點、散步休息','在南禪寺／永觀堂周邊休息，不跨區。','rest','南禅寺 京都'],
      ['16:30','17:30','提前用餐、夜楓排隊','永觀堂夜間入場可能有隊伍，提前在附近解決晚餐。','meal','永観堂 京都'],
      ['17:30','19:00','永觀堂夜楓','池泉庭園、放生池、阿彌陀堂與紅葉燈光。','night','永観堂 禅林寺 京都'],
      ['19:00','20:00','蹴上站 → 飯店','步行至蹴上，搭地下鐵東西線回烏丸御池。','transport','蹴上駅 京都']
    ]
  },
  {
    date:'2026-11-23', day:'MON', dateShort:'11 / 23', label:'一・祝', area:'宇治', overview:'平等院・老茶商・茶體驗',
    title:'宇治茶巡禮，從西岸走到東岸', intro:'把購茶留成完整的一天：平等院、上林春松本店、中村藤吉本店，之後跨河到福壽園茶工房、興聖寺、通圓茶屋。',
    route:['JR 宇治','平等院','上林／中村藤吉','福壽園','興聖寺','京阪宇治'],
    walk:['平等院 京都府宇治市','上林春松本店 宇治','中村藤吉本店 宇治','福寿園 宇治茶工房','興聖寺 宇治','通圓茶屋 宇治'],
    keyTitle:'優先領鳳凰堂整理券 + 預約福壽園',
    keyText:'11/23 是日本勤勞感謝日，平等院鳳凰堂內部參觀需現場領時間券、有人數限制；福壽園石臼磨抹茶體驗以 14:00 為預約目標（未預訂）。茶店賣場比咖啡廳更優先。',
    transit:'京都站 → JR 奈良線到宇治；西岸逛完後只跨宇治川一次，走東岸的福壽園、興聖寺、通圓。最後由京阪宇治 → 中書島 → 三條，步行轉三條京阪地下鐵東西線到烏丸御池。',
    tips:['中村藤吉本店靠近 JR 宇治站，從平等院商店街走回去會有一小段折返，但不跨河來回。','若平等院內部參觀時間券較晚，當日可先逛庭園或調整西岸茶店先後次序。','通圓與上林館內空間較小，節假日依實際人潮調整停留。'],
    events:[
      ['07:00','07:40','飯店早餐','早點出發，把假日上午留給平等院。','meal','ホテルモントレ京都'],
      ['07:40','08:55','前往宇治','地下鐵到京都站，再搭 JR 奈良線前往 JR 宇治站。','transport','JR 宇治駅'],
      ['09:00','10:40','平等院、鳳凰堂、鳳翔館','到場先領鳳凰堂內部參觀時間券；以發到的場次為準。','sight','平等院 京都府宇治市'],
      ['10:40','10:55','走到上林春松本店','沿平等院表參道、宇治橋通一帶散步。','transport','上林春松本店 宇治'],
      ['10:55','11:35','上林春松本店、上林記念館','以抹茶、玉露、煎茶等茶葉採購為主，留意記念館開放時間。','tea','上林春松本店 宇治'],
      ['11:35','11:45','步行到中村藤吉本店','往 JR 宇治站附近走。','transport','中村藤吉本店 宇治'],
      ['11:45','12:30','中村藤吉本店購茶','優先看銘茶賣場；茶寮如排隊太久可不等。','tea','中村藤吉本店 宇治'],
      ['12:30','13:25','午餐','宇治站至宇治橋通一帶，吃完往宇治川東岸移動。','meal','宇治駅 京都府'],
      ['13:25','14:00','過宇治川前往福壽園','步行跨河至東岸，前往宇治山田的茶工房。','transport','福寿園 宇治茶工房'],
      ['14:00','14:45','福壽園・石臼磨抹茶體驗','體驗約 40 分鐘，目標預約 14:00；電話 050-3152-2930。','tea','福寿園 宇治茶工房','須預約／確認名額'],
      ['14:45','15:00','步行前往興聖寺','沿宇治川東岸往南。','transport','興聖寺 京都府宇治市'],
      ['15:00','15:45','興聖寺・琴坂紅葉','欣賞參道秋色、寺院風景。','sight','興聖寺 京都府宇治市'],
      ['15:45','16:05','步行至通圓茶屋','沿宇治川東岸北上至宇治橋東端。','transport','通圓茶屋 宇治'],
      ['16:05','16:35','通圓茶屋','老茶屋短暫品茶及補買茶葉，避免拖到閉店。','tea','通圓茶屋 宇治'],
      ['16:45','17:45','京阪宇治 → 飯店','京阪宇治 → 中書島 → 三條，轉東西線回烏丸御池。','transport','京阪宇治駅'],
      ['18:30','20:00','四條烏丸晚餐','回飯店稍作休息後晚餐。','meal','四条烏丸 京都']
    ]
  },
  {
    date:'2026-11-24', day:'TUE', dateShort:'11 / 24', label:'二', area:'二條城・靜岡', overview:'二條城・小山園・回東京',
    title:'二條城晨遊，靜岡補茶返東京', intro:'退房前看二條城與庭園，之後到京都站搭新幹線。靜岡只短暫停在車站 PARCHE 小山園茶舗買平常喝的茶，下午回東京。',
    route:['Hotel Monterey','二條城','京都站','靜岡站小山園','東京'],
    walk:['元離宮二条城 京都'],
    keyTitle:'靜岡只買茶，不逛市區',
    keyText:'靜岡站 PARCHE 食彩館內有小山園茶舗（09:30–20:00），以 30 分鐘補貨為主。特定銘柄先打電話 054-253-4059。兩段新幹線必須分開購票，示意時段尚未正式訂票。',
    transit:'飯店附近烏丸御池 → 地下鐵東西線一站到二條城前；參觀後回飯店取行李，再搭烏丸線到京都站。京都 → 靜岡、靜岡 → 東京搭停靠靜岡的ひかり（按實際班次購票）。',
    tips:['二條城 08:45 開城，二之丸御殿在 11 月週二正常開放。','請勿將京都 → 東京的 Smart EX 單段票中途出站後繼續使用；應切成兩張。','站內購茶雖只需 20–30 分鐘，轉車仍預留進出閘門與找月台時間。'],
    events:[
      ['07:00','07:45','飯店早餐','最後一次飯店早餐，先整理好行李。','meal','ホテルモントレ京都'],
      ['07:45','08:10','Check-out、寄放行李','完成退房，請櫃台暫放行李。','hotel','ホテルモントレ京都'],
      ['08:10','08:35','前往二條城','烏丸御池 → 地下鐵東西線「二條城前」，出站步行。','transport','二条城前駅 京都'],
      ['08:45','10:15','元離宮二條城','二之丸御殿、二之丸庭園；以普通參觀為主，不排需另外預約的本丸御殿。','sight','元離宮二条城 京都'],
      ['10:15','10:50','返回飯店取行李','地下鐵東西線回烏丸御池，步行取行李。','transport','ホテルモントレ京都'],
      ['10:50','11:30','前往京都站','烏丸線直達京都站，注意新幹線月台動線。','transport','京都駅'],
      ['11:30','12:00','午餐與乘車準備','在京都站購買便當、確認候選班次。','meal','京都駅'],
      ['12:07','13:37','京都 → 靜岡（候選）','預計選擇停靠靜岡的ひかり；時刻及列車號正式訂票前需再次核對。','transport','静岡駅','候選時間／未預訂'],
      ['13:40','14:10','小山園茶舗・PARCHE 店','靜岡站直結的食彩館，直接補買慣喝的銘柄，不排其他茶店。','tea','小山園茶舗 パルシェ 静岡'],
      ['14:10','14:30','回新幹線月台','取票／通過閘門，留有轉乘緩衝。','transport','静岡駅'],
      ['14:41','15:42','靜岡 → 東京（候選）','停靠靜岡的ひかり；依正式購票班次調整。','transport','東京駅','候選時間／未預訂']
    ]
  }
];

const checklistData = [
  ['確認 11/20 東京 → 京都新幹線','建議上午抵達京都，東福寺安排在 11:15 起'],
  ['確認 11/24 京都 → 靜岡新幹線','目標中午由京都出發，停靠靜岡'],
  ['確認 11/24 靜岡 → 東京新幹線','目標下午 14:30–15:00 左右離開靜岡'],
  ['預約 11/23 福壽園石臼磨抹茶體驗','優先詢問 14:00 的體驗名額'],
  ['確認 Hotel Monterey Kyoto 寄放行李','11/20 入住前、11/24 退房後各一次'],
  ['確認小山園茶舗所需銘柄與營業','靜岡站 PARCHE，電話 054-253-4059']
];

const $ = selector => document.querySelector(selector);
let activeIndex = 0;
let showAll = false;
let toastTimer = null;

function renderOverview() {
  $('#dayOverview').innerHTML = days.map((d,i) => `
    <button class="overview-card" type="button" data-go-day="${i}" aria-label="查看 ${esc(d.dateShort.replace(/\s/g,''))} ${esc(d.area)} 的詳細行程">
      <span class="ov-day">DAY 0${i+1} · ${esc(d.day)}</span>
      <span class="ov-num">${esc(d.dateShort)}</span>
      <span class="ov-title">${esc(d.area)}</span>
      <span class="ov-desc">${esc(d.overview)}</span>
      <span class="ov-arrow" aria-hidden="true">↗</span>
    </button>`).join('');
  $('#dayOverview').querySelectorAll('[data-go-day]').forEach(button => {
    button.addEventListener('click', () => {
      setDay(Number(button.dataset.goDay));
      $('#itinerary').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    });
  });
}
function renderTabs() {
  $('#dayTabs').innerHTML = days.map((d,i) => `
    <button type="button" id="tab-day-${i+1}" class="day-tab" role="tab" aria-controls="panel-day-${i+1}" aria-selected="${!showAll && activeIndex===i}" tabindex="${!showAll && activeIndex===i ? 0 : -1}" data-tab="${i}">
      <span>${esc(d.dateShort)} · ${esc(d.label)}</span><b>${esc(d.area)}</b>
    </button>`).join('');
  $('#dayTabs').querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', () => setDay(Number(button.dataset.tab)));
    button.addEventListener('keydown', event => {
      const current = Number(button.dataset.tab);
      let next;
      if (event.key === 'ArrowRight') next = (current+1)%days.length;
      else if (event.key === 'ArrowLeft') next = (current+days.length-1)%days.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = days.length-1;
      else return;
      event.preventDefault();
      setDay(next);
      $(`#tab-day-${next+1}`).focus();
    });
  });
  $('#allDaysBtn').setAttribute('aria-pressed',String(showAll));
  $('#allDaysBtn').textContent = showAll ? '收合全部' : '展開全部';
}
function renderEvent(row) {
  const [from,to,title,description,kind,place,flag] = row;
  return `<li class="event" data-kind="${esc(kind)}">
    <div class="event-time">${esc(from)}<small>— ${esc(to)}</small></div>
    <div class="event-middle"><span class="event-dot"></span><span class="event-line"></span></div>
    <div class="event-main">
      <div class="event-row"><span class="event-title">${esc(title)}</span><span class="event-kind">${esc(travelKind[kind] || '行程')}</span></div>
      <p class="event-desc">${esc(description)}</p>
      ${place ? `<a class="event-place" href="${mapUrl(place)}" target="_blank" rel="noopener noreferrer">在 Google Maps 查看位置 ↗</a>` : ''}
      ${flag ? `<div><span class="event-flag">${esc(flag)}</span></div>` : ''}
    </div>
  </li>`;
}
function renderPanel(d,i) {
  return `<article class="day-panel" id="panel-day-${i+1}" role="tabpanel" aria-labelledby="tab-day-${i+1}">
    <div class="day-panel-head">
      <div class="panel-num">0${i+1}<span>${esc(d.dateShort)} · ${esc(d.day)}</span></div>
      <div><h3 class="panel-title">${esc(d.title)}</h3><p class="panel-intro">${esc(d.intro)}</p>
        <div class="panel-route" aria-label="每日移動順序">${d.route.map((r,j) => `${j>0 ? '<span class="route-sep" aria-hidden="true">›</span>' : ''}<span class="route-chip">${esc(r)}</span>`).join('')}</div>
      </div>
    </div>
    <div class="day-panel-body">
      <div class="timeline"><div class="timeline-label">DAY 0${i+1} · HOURLY SCHEDULE</div><ol class="events" style="padding:0;margin:0;list-style:none">${d.events.map(renderEvent).join('')}</ol></div>
      <aside class="day-sidebar" aria-label="每日旅行筆記">
        <div class="sidebar-section"><div class="sidebar-label">TODAY'S HIGHLIGHT</div><h3>${esc(d.keyTitle)}</h3><p>${esc(d.keyText)}</p>
          <a class="sidebar-cta" href="${d.walk.length===1 ? mapUrl(d.walk[0]) : walkingUrl(d.walk)}" target="_blank" rel="noopener noreferrer">${d.walk.length===1?'查看景點位置':'查看景點步行區段'} <span aria-hidden="true">↗</span></a>
          <button type="button" class="copy-day" data-copy-day="${i}">複製今日時間表 ↗</button></div>
        <div class="sidebar-section"><div class="sidebar-label">HOW TO GET AROUND</div><h3>交通與動線</h3><p>${esc(d.transit)}</p></div>
        <div class="sidebar-section"><div class="sidebar-label">GOOD TO KNOW</div><h3>當日提醒</h3><ul>${d.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
      </aside>
    </div>
  </article>`;
}
function renderSchedule() {
  const items = showAll ? days.map((d,i) => [d,i]) : [[days[activeIndex],activeIndex]];
  $('#dayContent').innerHTML = items.map(([d,i]) => renderPanel(d,i)).join('');
  $('#dayContent').querySelectorAll('[data-copy-day]').forEach(btn => btn.addEventListener('click',()=>copyDay(Number(btn.dataset.copyDay))));
}
function setDay(index,updateHash=true) {
  activeIndex = Math.min(days.length-1,Math.max(0,index));
  showAll = false;
  renderTabs();
  renderSchedule();
  if (updateHash) history.replaceState(null,'',`#day-${activeIndex+1}`);
}
function showAllDays(updateHash=true) {
  showAll = true;
  renderTabs();renderSchedule();
  if (updateHash) history.replaceState(null,'','#all-days');
}
function showToast(message) {
  const node = $('#toast');
  node.textContent = message;node.classList.add('visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>node.classList.remove('visible'),2700);
}
async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(value);showToast('已複製到剪貼簿');return; } catch (_) { /* fallback below */ }
  }
  const box = document.createElement('textarea');
  box.value=value;box.style.position='fixed';box.style.left='-9999px';document.body.append(box);box.select();
  const ok=document.execCommand('copy');box.remove();
  showToast(ok?'已複製到剪貼簿':'無法自動複製，請改用瀏覽器分享功能');
}
function copyDay(index) {
  const d=days[index];
  const lines=[`京都紅葉-茶葉之旅｜2026/${d.dateShort.replace(/\s/g,'')}（${d.label}）`,`DAY 0${index+1}｜${d.area}｜${d.title}`,'',...d.events.map(e=>`${e[0]}–${e[1]}  ${e[2]}${e[3] ? '｜'+e[3] : ''}`),'',location.href.split('#')[0]+'#day-'+(index+1)];
  copyText(lines.join('\n'));
}
function renderChecklist() {
  const prefix='travelplan_kyoto_20261120_check_';
  const stored = index => {try{return localStorage.getItem(prefix+index)==='true'}catch(_){return false}};
  $('#checkItems').innerHTML=checklistData.map(([name,sub],i)=>`<label class="check-item"><input type="checkbox" data-check="${i}" ${stored(i)?'checked':''}><span><span class="check-title">${esc(name)}</span><span class="check-sub">${esc(sub)}</span></span></label>`).join('');
  const update=()=>{
    const inputs=[...$('#checkItems').querySelectorAll('input[type="checkbox"]')];const n=inputs.filter(x=>x.checked).length;
    $('#checkProgress').textContent=`${n} / ${inputs.length} 完成`;
    $('#progressFill').style.width=(n/inputs.length*100)+'%';
  };
  $('#checkItems').querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{
    try{localStorage.setItem(prefix+input.dataset.check,String(input.checked))}catch(_){}
    update();
  }));
  update();
}
function init() {
  renderOverview();renderChecklist();
  const initial=location.hash.match(/^#day-([1-5])$/);
  if (location.hash==='#all-days') showAllDays(false);
  else setDay(initial?Number(initial[1])-1:0,false);
  $('#allDaysBtn').addEventListener('click',()=>{
    if(showAll) setDay(activeIndex);else showAllDays();
  });
  $('#shareBtn').addEventListener('click',async()=>{
    if (navigator.share) {
      try{await navigator.share({title:'京都紅葉-茶葉之旅',text:'2026/11/20–24 京都、宇治、靜岡 5 天 4 夜行程',url:location.href});return}
      catch(e){if(e.name==='AbortError')return}
    }
    copyText(location.href);
  });
  window.addEventListener('hashchange',()=>{
    const value=location.hash.match(/^#day-([1-5])$/);
    if(value)setDay(Number(value[1])-1,false);
    else if(location.hash==='#all-days')showAllDays(false);
  });
  window.addEventListener('beforeprint',()=>{if(!showAll){window.__kyotoPrintRestore=activeIndex;showAllDays(false)}});
  window.addEventListener('afterprint',()=>{if(window.__kyotoPrintRestore!==undefined){setDay(window.__kyotoPrintRestore,false);delete window.__kyotoPrintRestore}});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();

