import {firebaseConfig} from "../expense-tracker/firebase-config.js";
const $=id=>document.getElementById(id);const id=new URLSearchParams(location.search).get("trip")||"";
const valid=/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)&&id.length>=4&&id.length<=60;
const status=s=>{$("status").textContent=s};
const text=s=>typeof s==="string"?s:(s?.["zh-Hant"]||s?.en||s?.ja||"");
let current=null;
function show(data){
 document.title=text(data.title)+" | Travel Plan";
 document.getElementById("page").classList.add(["day-trip","multi-day-trip","event-trip","regional-trip"].includes(data.theme)?data.theme:"day-trip");
 $("title").textContent=text(data.title);$("subtitle").textContent=text(data.subtitle);
 $("kind").textContent=({ "day-trip":"ONE DAY / CITY WALK","multi-day-trip":"MULTI-DAY / TRAVEL JOURNAL","event-trip":"EVENT / FESTIVAL","regional-trip":"REGIONAL / NATURE" })[data.theme]||"TRAVEL PLAN";
 $("duration").textContent=data.days.length+" DAY"+(data.days.length>1?"S":"");
 const fromLink=(name)=>{const a=$(name);a.href="../"+(name==="ledger"?"expense-tracker":"photo-gallery")+"/?trip="+encodeURIComponent(id);a.hidden=false};
 fromLink("ledger");fromLink("gallery");
 const params=new URLSearchParams(location.search);
 function render(){
   const day=data.days.find(d=>d.date===current)||data.days[0];
   current=day.date;$("days").replaceChildren();
   for(const item of data.days){
     const b=document.createElement("button");b.textContent=text(item.label)||item.date;b.setAttribute("aria-pressed",String(item.date===current));b.onclick=()=>{current=item.date;const u=new URL(location.href);u.searchParams.set("day",current);history.replaceState(null,"",u);render()};$("days").append(b);
   }
   $("schedule").replaceChildren();
   for(const stop of day.stops){
     const item=document.createElement("article");item.className="stop";
     const time=document.createElement("time");time.textContent=stop.time;
     const title=document.createElement("h3");title.textContent=text(stop.title);
     const description=document.createElement("p");description.textContent=text(stop.description);
     item.append(time,title,description);
     if(text(stop.location)){const a=document.createElement("a");a.href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(text(stop.location));a.target="_blank";a.rel="noopener noreferrer";a.textContent="地圖導航 ↗";item.append(a)}
     $("schedule").append(item);
   }
 }
 current=data.days.some(d=>d.date===params.get("day"))?params.get("day"):data.days[0].date;render();
 $("share").onclick=async()=>{const u=new URL(location.href);u.searchParams.set("day",current);try{await navigator.clipboard.writeText(u.href);status("已複製行程連結")}catch{status(u.href)}};
}
async function init(){
 if(!valid)return status("旅行 ID 不正確");
 try{
 const [a,f]=await Promise.all([import("https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js"),import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js")]);
 const app=a.initializeApp(firebaseConfig),db=f.getFirestore(app),snapshot=await f.getDoc(f.doc(db,"publishedTrips",id));
 if(!snapshot.exists())return status("這趟旅行的公開行程尚未發布；可向主辦人詢問。");
 show(snapshot.data());
 }catch(e){status("讀取失敗："+e.message)}
}
init();
