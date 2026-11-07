import {firebaseConfig} from "./firebase-config.js";
import {calculateLedger, formatMoney, parseAmount, parseShare, equalShares, validateCustomShares, expenseShares} from "./ledger.js";

const tripId = new URLSearchParams(location.search).get("trip") || "";
const trips = {
 "ueno-2026": {label:"上野六人旅 · 2026/10/25",path:"../ueno-trip/"},
 "chichibu-kawagoe-2026": {label:"秩父・長瀞 · 2026/10/30–11/1",path:"../chichibu-kawagoe/"},
 "tsuchiura-hanabi-2026": {label:"土浦花火大會 · 2026/11/7",path:"../tsuchiura-hanabi/"}
};
const trip = trips[tripId];
const $ = id => document.getElementById(id);
let auth,db,user,member,unsubscribe=[],members=[],expenses=[],invitations=[],currency="JPY",splitMode="equal",shareDraft=new Map();
const alertText=(s,bad=false)=>{const el=$("status");el.hidden=false;el.textContent=s;el.className="status "+(bad?"error":"");};
const show=id=>["setupView","loginView","joinView","dashboard"].forEach(x=>$(x).hidden=x!==id);
const safeText=(el,s)=>{el.textContent=String(s??"");};
function nameOf(uid){return members.find(m=>m.uid===uid)?.displayName || "旅伴（已離開）";}
function cleanup(){unsubscribe.forEach(fn=>fn());unsubscribe=[];members=[];expenses=[];invitations=[];}
function validMail(s){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);}
if(!trip){$("tripName").textContent="未知的行程";$("tripBack").href="../";show("setupView");alertText("無效的行程 ID。請從 Travel Plan 的行程頁進入。",true);}
else{
 $("tripName").textContent=trip.label;$("tripBack").href=trip.path;
 $("expenseDate").value=new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Tokyo"});
 $("copyLinkBtn").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(location.href);alertText("帳本連結已複製。");}catch{alertText("請直接複製瀏覽器網址。",true);}});
 if(!firebaseConfig.apiKey||!firebaseConfig.projectId||!firebaseConfig.appId||!firebaseConfig.authDomain){show("setupView");}
 else boot();
}
async function boot(){
 try {
   const [{initializeApp},{getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut},{getFirestore,doc,getDoc,setDoc,collection,addDoc,deleteDoc,onSnapshot,serverTimestamp,query,where,updateDoc}] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js")
   ]);
   const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
   const ref=doc(db,"trips",tripId),users=collection(db,"trips",tripId,"members"),bills=collection(db,"trips",tripId,"expenses"),invites=collection(db,"trips",tripId,"invites");
   const login = async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider());}catch(e){alertText("登入失敗："+(e.message||e.code),true);}};
   $("signInBtn").onclick=login;
   $("signOutBtn").onclick=()=>signOut(auth);
   const memberRef=uid=>doc(users,uid);
   async function enter(current){
     cleanup();user=current;member=null;
     $("signOutBtn").hidden=!user;
     if(!user){show("loginView");return;}
     const normalized=(user.email||"").toLowerCase();
     if(!user.emailVerified||!validMail(normalized)){show("loginView");alertText("需要已驗證 Email 的 Google 帳號。",true);return;}
     try {
       const snap=await getDoc(memberRef(user.uid));
       if(snap.exists()&&snap.data().active===true){
         member={uid:user.uid,...snap.data()};await start();
       } else {
         const invitation=await getDoc(doc(invites,normalized));
         if(!invitation.exists()||invitation.data().active!==true){
           show("loginView");alertText("你尚未獲邀參加此帳本，請主辦人新增你的 Google Email。",true);return;
         }
         $("joinAccount").textContent=user.email;show("joinView");
       }
     }catch(e){show("loginView");alertText("無法讀取帳本權限："+e.message,true);}
   }
   $("joinBtn").onclick=async()=>{
     if(!user)return;
     try{
       await setDoc(memberRef(user.uid),{displayName:user.displayName||user.email,email:user.email.toLowerCase(),active:true,role:"member",joinedAt:serverTimestamp()});
       await enter(user);
     }catch(e){alertText("加入失敗："+e.message,true);}
   };
   onAuthStateChanged(auth,enter);
   function watch(col,cb){
     const fn=onSnapshot(col,snap=>{cb(snap.docs.map(d=>({id:d.id,...d.data()})));render();},err=>alertText("同步失敗："+err.message,true));
     unsubscribe.push(fn);
   }
   async function start(){
     show("dashboard");$("accountName").textContent=user.email;
     const t=await getDoc(ref);currency=t.exists()&&t.data().currency||"JPY";
     $("currencyName").textContent=currency;$("amountUnit").textContent=currency;
     watch(users,a=>{members=a.map(x=>({uid:x.id,...x})).filter(x=>x.active);});
     watch(bills,a=>{expenses=a;});
     if(member.role==="admin"){
       $("adminPanel").hidden=false;watch(invites,a=>{invitations=a;});
     }else $("adminPanel").hidden=true;
   }
   $("splitMode").addEventListener("change",()=>{
     splitMode=$("splitMode").value;
     $("customSplitPanel").hidden=splitMode!=="custom";
     renderCustomShares(true);
   });
   $("expenseAmount").addEventListener("input",()=>renderCustomShares(false));
   $("rebalanceBtn").addEventListener("click",()=>{
     shareDraft.clear();
     renderCustomShares(true);
   });
   function renderCustomShares(prefill=false){
     if(splitMode!=="custom")return;
     const selected=[...document.querySelectorAll('input[name="participating"]:checked')].map(c=>c.value);
     const panel=$("customShareInputs");
     const prior=new Map(shareDraft);
     if(prefill || !shareDraft.size){
       try{
         const equal=equalShares(parseAmount($("expenseAmount").value,currency),selected);
         shareDraft=new Map(Object.entries(equal).map(([k,v])=>[k,String(v/(10**(["JPY","KRW","TWD"].includes(currency)?0:2)))]));
       }catch{if(prefill)shareDraft.clear();}
     }
     panel.replaceChildren();
     for(const uid of selected){
       const label=document.createElement("label");label.className="custom-share-row";
       const name=document.createElement("span");name.textContent=nameOf(uid);
       const input=document.createElement("input");input.type="text";input.inputMode="decimal";input.setAttribute("aria-label",nameOf(uid)+" 分攤金額");
       input.value=shareDraft.get(uid)??prior.get(uid)??"";
       input.addEventListener("input",()=>{shareDraft.set(uid,input.value);validateDraft();});
       label.append(name,input);panel.append(label);
     }
     validateDraft();
   }
   function validateDraft(){
     if(splitMode!=="custom")return;
     const el=$("shareValidation");
     try{
       const total=parseAmount($("expenseAmount").value,currency);
       const selected=[...document.querySelectorAll('input[name="participating"]:checked')].map(c=>c.value);
       let sum=0;
       for(const uid of selected)sum+=parseShare(shareDraft.get(uid)??"",currency);
       const remaining=total-sum;
       el.textContent=remaining===0?"✓ 自訂分攤總額正確":remaining>0?"尚未分配："+formatMoney(remaining,currency):"超過總額："+formatMoney(-remaining,currency);
       el.className=remaining===0?"valid":"invalid";
     }catch(e){el.textContent=e.message;el.className="invalid";}
   }
   $("expenseForm").onsubmit=async ev=>{
     ev.preventDefault();
     try{
       const title=$("expenseTitle").value.trim(),amountMinor=parseAmount($("expenseAmount").value,currency);
       const payerUid=$("payerSelect").value;
       const participantUids=[...document.querySelectorAll('input[name="participating"]:checked')].map(x=>x.value).sort();
       if(!title||title.length>100||!members.some(m=>m.uid===payerUid)||!participantUids.length)throw Error("請確認項目、付款人與參與者。");
       const splitData={splitMode};
       if(splitMode==="custom"){
         const sharesMinor={};
         for(const uid of participantUids)sharesMinor[uid]=parseShare(shareDraft.get(uid)??"",currency);
         splitData.sharesMinor=validateCustomShares(amountMinor,participantUids,sharesMinor);
       }
       $("saveExpenseBtn").disabled=true;
       await addDoc(bills,{title,amountMinor,payerUid,participantUids,category:$("expenseCategory").value,date:$("expenseDate").value,...splitData,createdBy:user.uid,createdAt:serverTimestamp()});
       $("expenseTitle").value="";$("expenseAmount").value="";shareDraft.clear();renderCustomShares(true);
       alertText("費用已儲存並同步。");
     }catch(e){alertText("新增失敗："+e.message,true);}
     finally{$("saveExpenseBtn").disabled=false;}
   };
   $("selectAllBtn").onclick=()=>{document.querySelectorAll('input[name="participating"]').forEach(el=>el.checked=true);renderCustomShares(false);};
   $("inviteForm").onsubmit=async ev=>{
     ev.preventDefault();if(member?.role!=="admin")return;
     const mail=$("inviteEmail").value.trim().toLowerCase();
     if(!validMail(mail))return alertText("請輸入有效 Email。",true);
     try{await setDoc(doc(invites,mail),{email:mail,active:true,invitedBy:user.uid,updatedAt:serverTimestamp()});$("inviteEmail").value="";alertText("已新增邀請。請將帳本連結傳給旅伴。");}
     catch(e){alertText("邀請失敗："+e.message,true);}
   };
   function actionButton(text,fn){
     const b=document.createElement("button");b.type="button";b.className="plain-button";b.textContent=text;b.onclick=fn;return b;
   }
   function render(){
     if(!member)return;
     const pay=$("payerSelect"),old=pay.value,selected=new Set([...document.querySelectorAll('input[name="participating"]:checked')].map(x=>x.value));
     pay.replaceChildren();
     for(const m of members){const op=document.createElement("option");op.value=m.uid;op.textContent=m.displayName||m.email;pay.append(op);}
     pay.value=members.some(m=>m.uid===old)?old:user.uid;
     $("participantOptions").replaceChildren();
     for(const m of members){
       const label=document.createElement("label");label.className="person-check";
       const check=document.createElement("input");check.type="checkbox";check.name="participating";check.value=m.uid;check.checked=selected.size?selected.has(m.uid):true;check.addEventListener("change",()=>renderCustomShares(false));
       label.append(check,document.createTextNode(" "+(m.displayName||m.email)));$("participantOptions").append(label);
     }
     renderCustomShares(false);
     const result=calculateLedger(members,expenses);
     $("totalAmount").textContent=formatMoney(result.totalMinor,currency);
     $("entryCount").textContent=expenses.length+" / "+members.length;
     const my=result.balances.find(b=>b.uid===user.uid)?.netMinor||0;
     $("myBalance").textContent=(my>0?"+":"")+formatMoney(my,currency);
     $("myBalanceHint").textContent=my>0?"其他人合計應付給你":my<0?"你合計需要付給其他人":"目前已平衡";
     const balances=$("balanceList");balances.replaceChildren();
     for(const b of result.balances.sort((a,b)=>b.netMinor-a.netMinor)){
       const row=document.createElement("div");row.className="balance-row";
       const n=document.createElement("span"),v=document.createElement("b");n.textContent=b.displayName||b.email;v.textContent=(b.netMinor>0?"+":"")+formatMoney(b.netMinor,currency);row.append(n,v);balances.append(row);
     }
     const transfers=$("transferList");transfers.replaceChildren();
     const lines=result.transfers.map(t=>nameOf(t.from)+" → "+nameOf(t.to)+"："+formatMoney(t.amountMinor,currency));
     if(!lines.length){transfers.textContent="目前無需轉帳。";}
     lines.forEach(line=>{const item=document.createElement("div");item.className="transfer-row";item.textContent=line;transfers.append(item);});
     $("copySettlementBtn").onclick=async()=>{try{await navigator.clipboard.writeText(trip.label+"\n"+(lines.join("\n")||"目前無需轉帳。"));alertText("結算文字已複製。");}catch{alertText("複製失敗，請手動選取。",true);}};
     $("historyCount").textContent=expenses.length+" 筆";
     const list=$("expenseList");list.replaceChildren();
     for(const x of [...expenses].sort((a,b)=>String(b.date).localeCompare(String(a.date)))){
       const item=document.createElement("article");item.className="expense-item";
       const content=document.createElement("div"),h=document.createElement("strong"),small=document.createElement("small"),right=document.createElement("div"),amount=document.createElement("b");
       h.textContent=x.title;small.textContent=(x.date||"")+" · "+(x.category||"其他")+" · 付款："+nameOf(x.payerUid)+" · "+(x.splitMode==="custom"?"自訂金額":"平均分攤")+" · "+(x.participantUids||[]).length+" 人";
       try{const shares=expenseShares(x);small.textContent+="\n"+Object.entries(shares).map(([uid,v])=>nameOf(uid)+"："+formatMoney(v,currency)).join(" / ");}catch{small.textContent+=" · 分攤資料異常";}
       amount.textContent=formatMoney(x.amountMinor,currency);content.append(h,small);right.append(amount);
       if(x.createdBy===user.uid||member.role==="admin"){right.append(actionButton("刪除",async()=>{if(!confirm("確定刪除此筆費用？"))return;try{await deleteDoc(doc(bills,x.id));}catch(e){alertText("刪除失敗："+e.message,true);}}));}
       item.append(content,right);list.append(item);
     }
     if(!expenses.length)list.textContent="尚無紀錄。新增第一筆共同費用吧。";
     if(result.skipped)alertText("有 "+result.skipped+" 筆記錄涉及已停用成員或無效資料，未納入結算。",true);
     if(member.role==="admin"){
       const inv=$("inviteList");inv.replaceChildren();
       for(const i of invitations){const p=document.createElement("div");p.className="admin-row";const s=document.createElement("span");s.textContent=i.email+" · "+(i.active?"有效":"已撤回");p.append(s,actionButton(i.active?"撤回":"重新邀請",async()=>{try{await updateDoc(doc(invites,i.id),{active:!i.active});}catch(e){alertText(e.message,true);}}));inv.append(p);}
       const mem=$("adminMemberList");mem.replaceChildren();
       for(const m of members){const p=document.createElement("div");p.className="admin-row";const s=document.createElement("span");s.textContent=(m.displayName||m.email)+" · "+m.role;p.append(s);if(m.role!=="admin")p.append(actionButton("停用",async()=>{if(confirm("停用後該旅伴無法再查看帳本；涉及他的費用將暫時無法正確結算。")){try{await updateDoc(memberRef(m.uid),{active:false});}catch(e){alertText(e.message,true);}}}));mem.append(p);}
     }
     $("exportBtn").onclick=()=>{
       const csv=[["date","title","category","amount_minor","currency","payer_uid","participant_uids","split_mode","shares_minor_json","created_by"],...expenses.map(x=>[x.date,x.title,x.category,x.amountMinor,currency,x.payerUid,(x.participantUids||[]).join("|"),x.splitMode||"equal",JSON.stringify(x.splitMode==="custom"?x.sharesMinor:equalShares(x.amountMinor,x.participantUids)),x.createdBy])].map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");
       const a=document.createElement("a"),url=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.href=url;a.download=tripId+"-expenses.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
     };
   }
 }catch(e){show("setupView");alertText("Firebase 初始化失敗："+e.message,true);}
}
