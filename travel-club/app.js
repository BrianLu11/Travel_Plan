import {firebaseConfig} from "../expense-tracker/firebase-config.js";
const $=id=>document.getElementById(id);
let auth,db,fn,api,fire,me,profile;
const pending=new Set();
const tell=(msg)=>{$("status").textContent=msg;};
const emails=text=>[...new Set(text.split(/[\s,;]+/).map(s=>s.trim()).filter(Boolean))];
const tripId=id=>typeof id==="string"&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)&&id.length>=4&&id.length<=60;
function toggle(id,on){$(id).hidden=!on;}
function formHandler(id,callback){
  $(id).addEventListener("submit",async e=>{
    e.preventDefault();const button=$(id).querySelector('button[type="submit"],button:not([type])');
    if(button)button.disabled=true;
    try{await callback();}catch(err){tell(err?.message||String(err));}finally{if(button)button.disabled=false;}
  });
}
async function call(name,data){return (await api.httpsCallable(fn,name)(data)).data;}
async function load(){
  const [a,b,c,d]=await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"),
    import("https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js")
  ]);
  fire=c;api=d;
  const app=a.initializeApp(firebaseConfig);auth=b.getAuth(app);db=c.getFirestore(app);fn=d.getFunctions(app,"asia-northeast1");
  $("signIn").onclick=()=>b.signInWithPopup(auth,new b.GoogleAuthProvider()).catch(e=>tell(e.message));
  $("signOut").onclick=()=>b.signOut(auth);
  $("acceptPlatform").onclick=async()=>{try{await call("acceptPlatformInvite",{});await enter(me);}catch(e){tell(e.message)}};
  formHandler("newTrip",async()=>{
    const data={tripId:$("tripId").value.trim(),title:$("title").value.trim(),startsOn:$("startsOn").value,endsOn:$("endsOn").value,templateType:$("templateType").value,currency:$("currency").value};
    const r=await call("createTrip",data);tell("旅行已建立："+r.tripId+"。現在可以從下方邀請旅伴。");
    $("newTrip").reset();await renderTrips();
  });
  formHandler("platformInvite",async()=>{
    const list=emails($("platformEmails").value);
    const r=await call("invitePlatformMembers",{emails:list});
    tell("已建立 "+r.invited+" 個平台邀請。請將本頁連結傳給受邀者。");
    $("platformEmails").value="";
  });
  formHandler("publishTrip",async()=>{
    let data;
    try{data=JSON.parse($("itineraryJson").value)}catch{throw Error("行程內容不是有效 JSON")}
    const id=$("publishId").value.trim();if(!tripId(id))throw Error("旅行 ID 不正確");
    const result=await call("publishItinerary",{tripId:id,itinerary:data});
    tell("已發布公開行程："+result.url);
  });
  formHandler("joinTrip",async()=>{
    const id=$("joiningId").value.trim();if(!tripId(id))throw Error("旅行 ID 無效");
    await call("acceptTripInvite",{tripId:id});tell("已成功加入 "+id);
    $("joiningId").value="";await renderTrips();
  });
  b.onAuthStateChanged(auth,enter);
}
async function enter(user){
  me=user;profile=null;toggle("loginView",!user);toggle("joinView",false);toggle("dashboard",false);tell("");
  if(!user)return;
  if(!user.emailVerified){tell("請使用已驗證 Email 的 Google 帳號");return;}
  try{
    const doc=await fire.getDoc(fire.doc(db,"users",user.uid));
    if(!doc.exists()||doc.data().active!==true){toggle("joinView",true);return;}
    profile=doc.data();toggle("dashboard",true);
    $("account").textContent=user.email||"";
    const name=user.displayName||profile.displayName||user.email||"旅行會員";
    $("memberName").textContent=name;
    $("memberRole").textContent=profile.platformAdmin===true?"TRAVEL CLUB / ADMINISTRATOR":"TRAVEL CLUB / MEMBER";
    const avatar=$("memberAvatar");avatar.replaceChildren();
    if(user.photoURL){const img=document.createElement("img");img.alt="";img.referrerPolicy="no-referrer";img.onerror=()=>{avatar.textContent=Array.from(name)[0]||"旅";};img.src=user.photoURL;avatar.append(img);}
    else avatar.textContent=Array.from(name)[0]||"旅";
    const joined=profile.joinedAt?.toDate?.();
    $("memberSince").textContent=joined instanceof Date&&!Number.isNaN(joined.getTime())?"會員加入 · "+joined.toLocaleDateString("zh-TW",{year:"numeric",month:"long",timeZone:"Asia/Tokyo"}):"";
    $("points").textContent=String(profile.points||0);
    const can=profile.platformAdmin===true||profile.organizerOverride===true||(Number.isInteger(profile.points)&&profile.points>=100);
    $("qualification").textContent=can?"可發起旅行":"一般會員";
    const points=Number.isInteger(profile.points)?Math.max(0,profile.points):0;
    $("progressRing").style.setProperty("--progress",Math.min(100,points)+"%");
    $("pointsNeeded").textContent=can?"已取得開團資格":"距離自行開團還差 "+Math.max(0,100-points)+" 點";
    toggle("organizerHeader",can);
    toggle("organizer",can);
    toggle("publishPanel",can);
    await renderTrips();
  }catch(e){tell("讀取會員資訊失敗："+e.message)}
}
async function renderTrips(){
  if(!me||!profile)return;
  const list=$("tripList");list.replaceChildren();
  const q=await fire.getDocs(fire.collection(db,"users",me.uid,"tripRefs"));
  $("tripCount").textContent=String(q.size);
  if(q.empty){list.innerHTML='<div class="trip-empty"><b>✦ 下一段旅程，等你出發。</b>收到邀請後，就能從右側的加入表單加入旅程。</div>';return;}
  for(const snapshot of q.docs){
    const record=snapshot.data(),id=snapshot.id;
    const div=document.createElement("article");div.className="trip";
    const top=document.createElement("div");top.className="trip-top";
    const kicker=document.createElement("span");kicker.className="trip-kicker";kicker.textContent="TRAVEL JOURNAL / "+String(q.docs.indexOf(snapshot)+1).padStart(2,"0");
    const tag=document.createElement("span");tag.className="trip-role";tag.textContent=record.role==="admin"?"主辦人":"旅伴";top.append(kicker,tag);div.append(top);
    const title=document.createElement("h3");title.textContent=record.title||id;div.append(title);
    const desc=document.createElement("p");desc.className="trip-description";desc.textContent="旅行 ID / "+id;div.append(desc);
    const links=document.createElement("div");links.className="trip-links";
    const addLink=(label,path)=>{const a=document.createElement("a");a.href=path;a.textContent=label;links.append(a)};
    addLink("行程 ↗","../trip/?trip="+encodeURIComponent(id));
    addLink("分帳 ↗","../expense-tracker/?trip="+encodeURIComponent(id));
    addLink("相簿 ↗","../photo-gallery/?trip="+encodeURIComponent(id));div.append(links);
    if(record.role==="admin"){
      const form=document.createElement("form");const label=document.createElement("label");label.textContent="邀請旅伴（Google Email，每行一個）";
      const field=document.createElement("textarea");field.rows=2;field.placeholder="friend@example.com";label.append(field);
      const button=document.createElement("button");button.textContent="邀請加入此團";form.append(label,button);
      form.onsubmit=async e=>{e.preventDefault();button.disabled=true;try{const r=await call("inviteTripMembers",{tripId:id,emails:emails(field.value)});field.value="";tell("成功建立 "+r.invited+" 份邀請；請分享旅行 ID："+id);}catch(e){tell(e.message)}finally{button.disabled=false}};div.append(form);
      try{
        const tripSnap=await fire.getDoc(fire.doc(db,"trips",id));
        const trip=tripSnap.data();
        if(trip&&trip.status==="planned"){
          const complete=document.createElement("button");complete.className="soft";complete.type="button";complete.textContent="旅行結束後確認結團";
          complete.onclick=async()=>{if(!confirm("確定這趟旅行已完成？結團後才能為出席旅伴核發積分。"))return;try{await call("completeTrip",{tripId:id});tell("已結團");await renderTrips()}catch(e){tell(e.message)}};
          div.append(complete);
        }
        if(trip&&trip.status==="completed"){
          const heading=document.createElement("h4");heading.textContent="確認出席並核發 +20 點（每人每團只能一次）";div.append(heading);
          const members=await fire.getDocs(fire.collection(db,"trips",id,"members"));
          for(const member of members.docs){
            if(!member.data().active||member.id===me.uid)continue;
            const row=document.createElement("p");row.textContent=member.data().displayName||member.data().email;
            const award=document.createElement("button");award.className="soft";award.type="button";award.textContent="核發出席積分";
            award.onclick=async()=>{award.disabled=true;try{const r=await call("awardParticipation",{tripId:id,uid:member.id});tell("已核發，該會員總積分："+r.total)}catch(e){tell(e.message)}};
            row.append(document.createTextNode(" "),award);div.append(row);
          }
        }
      }catch(e){tell("旅行管理資料載入失敗："+e.message)}
    }
    list.append(div);
  }
}
load().catch(e=>tell("初始化失敗："+e.message));
