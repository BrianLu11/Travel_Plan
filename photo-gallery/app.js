import {firebaseConfig} from "../expense-tracker/firebase-config.js";
import {storageBucket} from "./storage-config.js";
const $=id=>document.getElementById(id);
const tripId=new URLSearchParams(location.search).get("trip")||"";
const trips={"ueno-2026":{name:"上野六人旅",url:"../ueno-trip/"},"chichibu-kawagoe-2026":{name:"秩父・長瀞",url:"../chichibu-kawagoe/"},"tsuchiura-hanabi-2026":{name:"土浦花火大會",url:"../tsuchiura-hanabi/"}};
let app,auth,db,storage,fire,store,me=null,role="",rows=[],cursor=null,busy=false,active=null,urls=new Set(),thumbs=new Map();
const notice=s=>{$("message").textContent=s;};
const valid=!!trips[tripId] && /^[a-z0-9-]{1,80}$/.test(tripId);
$("tripName").textContent=valid?trips[tripId].name+"・共享相簿":"無效的旅程";
$("back").href=valid?trips[tripId].url:"../";
const tidyUrl=url=>{if(url){URL.revokeObjectURL(url);urls.delete(url);}};
function reset(){for(const u of urls)URL.revokeObjectURL(u);urls.clear();thumbs.clear();rows=[];cursor=null;active=null;$("photoGrid").replaceChildren();$("viewer").close?.();$("gallery").hidden=true;}
const photoRef=(id,uid,kind)=>store.ref(storage,"trip-photos/"+tripId+"/"+uid+"/"+id+"/"+kind);
const collection=()=>fire.collection(db,"trips",tripId,"photos");
function errorMessage(e){const code=e?.code||"";if(code.includes("unauthorized")||code.includes("permission-denied"))return "目前沒有此相簿的權限，請確認已加入旅行且 Firebase Rules 已部署。";return e?.message||String(e);}
async function boot(){
 if(!valid)return notice("請從正確的旅行行程進入相簿。");
 if(!storageBucket)return notice("相簿尚未完成 Storage 設定。請主辦人在 Firebase 建立儲存桶，並設定 storage-config.js。");
 try{
 const [a,b,c,d]=await Promise.all([
 import("https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js"),
 import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"),
 import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"),
 import("https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js")]);
 auth=b;fire=c;store=d;app=a.initializeApp(firebaseConfig);const identity=b.getAuth(app);auth={...b,instance:identity};
 db=c.getFirestore(app);storage=d.getStorage(app,"gs://"+storageBucket);
 $("signIn").onclick=async()=>{try{await b.signInWithPopup(identity,new b.GoogleAuthProvider());}catch(e){notice(errorMessage(e));}};
 $("signOut").onclick=()=>b.signOut(identity);
 $("join").onclick=async()=>{try{await fire.setDoc(fire.doc(db,"trips",tripId,"members",me.uid),{displayName:me.displayName||me.email,email:me.email.toLowerCase(),active:true,role:"member",joinedAt:fire.serverTimestamp()});await enter(me);}catch(e){notice(errorMessage(e));}};
 $("upload").onclick=uploadFiles;$("more").onclick=loadMore;$("closeViewer").onclick=()=>$("viewer").close();
 $("viewer").addEventListener("close",()=>{tidyUrl($("viewerImage").src);tidyUrl($("download").href);$("viewerImage").removeAttribute("src");$("download").removeAttribute("href");active=null;});
 $("delete").onclick=deletePhoto;
 b.onAuthStateChanged(identity,enter);
 }catch(e){notice("Firebase 初始化失敗："+errorMessage(e));}
}
async function enter(user){
 reset();me=user;role="";notice("");$("login").hidden=false;$("join").hidden=true;
 if(!user){$("joinNote").textContent="";return;}
 if(!user.emailVerified||!user.email){notice("需要已驗證 Email 的 Google 帳號。");return;}
 try{
 const m=await fire.getDoc(fire.doc(db,"trips",tripId,"members",user.uid));
 if(m.exists()&&m.data().active===true){role=m.data().role;$("login").hidden=true;$("gallery").hidden=false;$("account").textContent=user.email;await loadMore();return;}
 const invitation=await fire.getDoc(fire.doc(db,"trips",tripId,"invites",user.email.toLowerCase()));
 if(invitation.exists()&&invitation.data().active===true){$("joinNote").textContent="你已收到邀請，請按下方按鈕加入。";$("join").hidden=false;}
 else notice("你尚未加入此趟旅行，請主辦人先在共同分帳頁邀請你的 Google Email。");
 }catch(e){notice(errorMessage(e));}
}
async function createThumbnail(file){
 const bitmap=await createImageBitmap(file);const scale=Math.min(1,800/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("無法產生照片縮圖")),"image/jpeg",.77));
}
function uploadTask(ref,data,type){return new Promise((resolve,reject)=>{const t=store.uploadBytesResumable(ref,data,{contentType:type});t.on("state_changed",s=>{$("progress").value=s.totalBytes?Math.round(100*s.bytesTransferred/s.totalBytes):0;},reject,()=>resolve());});}
async function uploadFiles(){
 if(busy||!me)return;const items=[...$("photos").files];
 if(!items.length)return notice("請先選取照片。");
 if(items.length>20)return notice("一次最多上傳 20 張照片。");
 if(items.some(f=>!["image/jpeg","image/png","image/webp"].includes(f.type)||f.size>20*1024*1024||f.size===0))return notice("僅支援 JPG、PNG、WebP，每張需在 20 MiB 內。");
 busy=true;$("upload").disabled=true;$("progress").hidden=false;let done=0;
 try{for(const f of items){
 const id=crypto.randomUUID(),original=photoRef(id,me.uid,"original"),thumb=photoRef(id,me.uid,"thumb");
 try{const preview=await createThumbnail(f);if(preview.size>1024*1024)throw Error("縮圖超過 1 MiB");
 $("uploadStatus").textContent="正在上傳 "+(done+1)+"/"+items.length+"："+f.name;
 await uploadTask(original,f,f.type);await uploadTask(thumb,preview,"image/jpeg");
 await fire.setDoc(fire.doc(collection(),id),{name:f.name.slice(0,200),uploaderUid:me.uid,uploaderName:(me.displayName||me.email||"旅伴").slice(0,120),size:f.size,contentType:f.type,originalPath:original.fullPath,thumbPath:thumb.fullPath,createdAt:fire.serverTimestamp()});done++;
 }catch(e){await Promise.allSettled([store.deleteObject(original),store.deleteObject(thumb)]);throw e;}
 }
 $("photos").value="";$("uploadStatus").textContent="已完成 "+done+" 張";notice("照片已上傳。");resetGallery();busy=false;await loadMore();
 }catch(e){notice("已完成 "+done+" 張，其餘上傳失敗："+errorMessage(e));resetGallery();busy=false;await loadMore();}
 finally{busy=false;$("upload").disabled=false;$("progress").hidden=true;}
}
function resetGallery(){for(const u of thumbs.values())tidyUrl(u);thumbs.clear();rows=[];cursor=null;$("photoGrid").replaceChildren();}
async function loadMore(){
 if(busy||!me)return;$("more").disabled=true;
 try{let constraints=[fire.orderBy("createdAt","desc"),fire.limit(24)];if(cursor)constraints.splice(1,0,fire.startAfter(cursor));
 const snap=await fire.getDocs(fire.query(collection(),...constraints));cursor=snap.docs.at(-1)||cursor;
 const incoming=snap.docs.map(d=>({id:d.id,...d.data()}));rows.push(...incoming);
 for(const item of incoming){const tile=document.createElement("button");tile.className="tile";tile.type="button";tile.setAttribute("aria-label","開啟 "+item.name);
 const img=document.createElement("img");img.alt=item.name;img.loading="lazy";const name=document.createElement("span");name.textContent=item.name;tile.append(img,name);tile.onclick=()=>openPhoto(item);$("photoGrid").append(tile);fetchImage(item,"thumb").then(url=>{if(tile.isConnected){img.src=url;thumbs.set(item.id,url);}else tidyUrl(url);}).catch(()=>{name.textContent="無法讀取縮圖";});}
 $("count").textContent=rows.length+" 張已載入";$("more").hidden=snap.size<24;
 }catch(e){notice("讀取相簿失敗："+errorMessage(e));}
 finally{$("more").disabled=false;}
}
async function fetchImage(item,kind){const path=kind==="thumb"?item.thumbPath:item.originalPath;if(typeof path!=="string"||!path.startsWith("trip-photos/"+tripId+"/"+item.uploaderUid+"/"+item.id+"/"))throw Error("無效的照片路徑");const blob=await store.getBlob(store.ref(storage,path));const u=URL.createObjectURL(blob);urls.add(u);return u;}
async function openPhoto(item){active=item;$("viewerTitle").textContent=item.name;$("delete").hidden=!(role==="admin"||item.uploaderUid===me.uid);$("viewerImage").removeAttribute("src");$("download").removeAttribute("href");$("viewer").showModal();try{const url=await fetchImage(item,"original");if(active!==item){tidyUrl(url);return;}$("viewerImage").src=url;$("download").href=url;$("download").download=item.name;}catch(e){notice("照片下載失敗："+errorMessage(e));$("viewer").close();}}
async function deletePhoto(){if(!active||!me||!(role==="admin"||active.uploaderUid===me.uid)||!confirm("確定永久刪除這張照片？"))return;const item=active;try{await Promise.all([store.deleteObject(store.ref(storage,item.originalPath)),store.deleteObject(store.ref(storage,item.thumbPath))]);await fire.deleteDoc(fire.doc(collection(),item.id));$("viewer").close();notice("照片已刪除。");resetGallery();await loadMore();}catch(e){notice("刪除未完成："+errorMessage(e));}}
boot();
