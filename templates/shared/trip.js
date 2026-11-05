// Shared renderer for generated itineraries. All trip copy is rendered as text, never HTML.
export function mountTrip(data){
  const $=id=>document.getElementById(id);
  const langs=["zh-Hant","ja","en"];
  const params=new URLSearchParams(location.search);
  let lang=langs.includes(params.get("lang"))?params.get("lang"):"zh-Hant";
  const days=Array.isArray(data.days)?data.days:[];
  if(!days.length)throw Error("Trip requires at least one day");
  let current=days.find(d=>d.id===params.get("day"))||days[0];
  let mode=params.get("mode") in current.plans?params.get("mode"):Object.keys(current.plans)[0];
  const localized=value=>typeof value==="string"?value:(value?.[lang]??value?.["zh-Hant"]??"");
  const text=(id,value)=>{$(id).textContent=localized(value)};
  function syncUrl(){
    const u=new URL(location.href);u.searchParams.set("day",current.id);u.searchParams.set("mode",mode);u.searchParams.set("lang",lang);history.replaceState(null,"",u);
  }
  function button(label,onClick,pressed){
    const b=document.createElement("button");b.type="button";b.textContent=localized(label);
    if(pressed!==undefined)b.setAttribute("aria-pressed",String(pressed));
    b.addEventListener("click",onClick);return b;
  }
  function renderTabs(container,items,selected,change){
    container.replaceChildren();for(const item of items)container.append(button(item.label,()=>change(item.key),item.key===selected));
  }
  function render(){
    document.documentElement.lang=lang;document.title=localized(data.title)+" | Travel Plan";
    $("mark").textContent=data.mark||"旅";text("tripLabel",data.shortLabel);text("title",data.title);text("subtitle",data.subtitle);
    text("pageTitle",{"zh-Hant":"旅行時間軸",ja:"旅のタイムライン",en:"Travel timeline"});
    text("modeTitle",{"zh-Hant":"行程方案",ja:"旅程プラン",en:"Itinerary plans"});
    $("share").textContent=localized({"zh-Hant":"分享行程 ↗",ja:"旅程を共有 ↗",en:"Share itinerary ↗"});
    $("homeLink").setAttribute("aria-label",localized({"zh-Hant":"返回 Travel Plan 總首頁",ja:"Travel Plan のトップページへ",en:"Back to Travel Plan homepage"}));
    for(const l of langs){const btn=document.querySelector('[data-lang="'+l+'"]');btn.setAttribute("aria-pressed",String(l===lang));}
    renderTabs($("days"),days.map(d=>({key:d.id,label:d.label})),current.id,key=>{current=days.find(d=>d.id===key);mode=Object.keys(current.plans)[0];syncUrl();render();});
    renderTabs($("modes"),Object.entries(current.plans).map(([key,p])=>({key,label:p.label})),mode,key=>{mode=key;syncUrl();render();});
    const list=$("schedule");list.replaceChildren();
    const stops=current.plans[mode]?.stops||[];
    for(const stop of stops){
      const article=document.createElement("article");article.className="stop";
      const time=document.createElement("time");time.textContent=stop.time||"";article.append(time);
      const title=document.createElement("h3");title.textContent=localized(stop.title);article.append(title);
      const desc=document.createElement("p");desc.textContent=localized(stop.description);article.append(desc);
      if(stop.map){const a=document.createElement("a");a.href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(stop.map);a.textContent=localized({"zh-Hant":"查看地圖 ↗",ja:"地図を見る ↗",en:"View map ↗"});a.target="_blank";a.rel="noopener noreferrer";article.append(a);}
      list.append(article);
    }
    if(!stops.length){const p=document.createElement("p");p.textContent=localized({"zh-Hant":"尚無行程資料。",ja:"予定はまだありません。",en:"No stops yet."});list.append(p);}
    $("tools").replaceChildren();
    const features=data.features||{};
    const root=new URL($("homeLink").getAttribute("href"),location.href);
    for(const [flag,path,labels] of [
      ["ledger","expense-tracker/",{"zh-Hant":"旅行分帳 ↗",ja:"旅行の共同精算 ↗",en:"Shared expenses ↗"}],
      ["gallery","photo-gallery/",{"zh-Hant":"共享相簿 ↗",ja:"共有アルバム ↗",en:"Shared gallery ↗"}]
    ]){if(features[flag] && data.tripId){
      const a=document.createElement("a");const u=new URL(path,root);u.searchParams.set("trip",data.tripId);a.href=u.href;a.textContent=localized(labels);$("tools").append(a);
    }}
    text("templateNotice",{"zh-Hant":"示範資料僅供模板預覽，請確認旅行資訊、訂位及 Firebase 權限後再公開。",ja:"これはテンプレートの例です。公開前に旅程・予約・Firebase権限を確認してください。",en:"Template sample only. Verify details, bookings and Firebase access before publishing."});
  }
  document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",()=>{lang=b.dataset.lang;syncUrl();render();}));
  $("share").addEventListener("click",async()=>{syncUrl();try{await navigator.clipboard.writeText(location.href);$("shareStatus").textContent=localized({"zh-Hant":"連結已複製",ja:"リンクをコピーしました",en:"Link copied"});}catch{$("shareStatus").textContent=location.href;}});
  syncUrl();render();
}
