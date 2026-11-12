// A single, non-invasive profile entry shared by every Travel Plan page.
// The page remains usable if Firebase cannot load: the profile link still works.
import {firebaseConfig} from "../expense-tracker/firebase-config.js";
const profileUrl=new URL("../travel-club/",import.meta.url);
const css=new URL("./profile-nav.css",import.meta.url);
const sheet=document.createElement("link");
sheet.rel="stylesheet";sheet.href=css.href;document.head.append(sheet);

const link=document.createElement("a");
link.className="tp-profile-link";link.href=profileUrl.href;
link.setAttribute("aria-label","前往個人頁面");link.title="我的個人頁面";
if(location.pathname.replace(/\/+$/,"/")===profileUrl.pathname)link.setAttribute("aria-current","page");

const fallback=document.createElement("span");
fallback.className="tp-profile-fallback";
fallback.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="3.5"/><path d="M4.8 20c.4-4 3.2-6 7.2-6s6.8 2 7.2 6"/></svg>';
const photo=document.createElement("img");photo.className="tp-profile-photo";
photo.alt="";photo.hidden=true;photo.referrerPolicy="no-referrer";
photo.onerror=()=>{photo.hidden=true;fallback.hidden=false;};
link.append(fallback,photo);

// Keep the brand in its original position and place the profile entry after
// all right-side controls. Each travel page keeps its own header design.
const headerTargets=[
  "header .header-actions",  // Ueno and Chichibu: language/share controls
  "header .header-side",     // Kyoto: date/share controls
  "header .header-buttons",  // Tsuchiura: date/share controls
  "header.topbar nav",       // Expense tracker: back/sign-out controls
  "header.topbar .nav",      // Other nested topbars
  "header"                   // Home, Club, Gallery, and dynamic trip pages
];
const target=headerTargets.map(selector=>document.querySelector(selector)).find(Boolean);
if(target)target.append(link);
else document.body.prepend(link);

// Firebase Auth on all pages is optional: a valid link never depends on sign-in.
async function updateAvatar(){
  try{
    const [core,accounts]=await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js")
    ]);
    const app=core.getApps().find(a=>a.name==="[DEFAULT]")||core.initializeApp(firebaseConfig);
    accounts.onAuthStateChanged(accounts.getAuth(app),user=>{
      if(!user){photo.hidden=true;fallback.hidden=false;return;}
      const label=user.displayName||user.email||"我的個人頁面";
      link.setAttribute("aria-label","前往"+label+"的個人頁面");
      try{
        const url=new URL(user.photoURL||"");
        if(url.protocol!=="https:")throw Error("Unsupported avatar URL");
        photo.src=url.href;
        photo.hidden=false;fallback.hidden=true;
      }catch{
        fallback.textContent=Array.from(label.trim())[0]||"旅";
        fallback.hidden=false;photo.hidden=true;
      }
    });
  }catch{ /* Non-authenticated pages must not depend on Firebase availability. */ }
}
updateAvatar();
