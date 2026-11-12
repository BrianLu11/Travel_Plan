// Run only under the Firestore emulator; never connect this test to production.
const {test,before,after}=require("node:test");
const assert=require("node:assert/strict");
const {readFileSync}=require("node:fs");
const path=require("node:path");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
}=require("@firebase/rules-unit-testing");
const {doc,getDoc,getDocs,collection,setDoc,updateDoc,deleteDoc,serverTimestamp}=require("firebase/firestore");

let env,alice,bob,admin,anonymous;
const ref=(db,path)=>doc(db,path);
const rules=readFileSync(path.resolve(__dirname,"../../expense-tracker/firestore.rules"),"utf8");

before(async()=>{
  if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error("Firestore emulator must be active");
  env=await initializeTestEnvironment({
    projectId:"demo-travel-club",
    firestore:{host:"127.0.0.1",port:8080,rules}
  });
  await env.clearFirestore();
  alice=env.authenticatedContext("alice",{email:"alice@example.com",email_verified:true}).firestore();
  bob=env.authenticatedContext("bob",{email:"bob@example.com",email_verified:true}).firestore();
  admin=env.authenticatedContext("admin",{email:"admin@example.com",email_verified:true}).firestore();
  anonymous=env.unauthenticatedContext().firestore();
  await env.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.firestore();
    await setDoc(ref(db,"users/alice"),{email:"alice@example.com",active:true,points:0,platformAdmin:false,organizerOverride:false});
    await setDoc(ref(db,"users/admin"),{email:"admin@example.com",active:true,points:0,platformAdmin:true,organizerOverride:true});
    await setDoc(ref(db,"trips/new-trip-2027"),{schemaVersion:2,title:"New Trip",currency:"JPY"});
    await setDoc(ref(db,"trips/legacy-2026"),{currency:"JPY",title:"Legacy Trip"});
    await setDoc(ref(db,"trips/new-trip-2027/members/admin"),{email:"admin@example.com",role:"admin",active:true});
    await setDoc(ref(db,"trips/new-trip-2027/invites/alice@example.com"),{email:"alice@example.com",active:true});
    await setDoc(ref(db,"trips/legacy-2026/invites/bob@example.com"),{email:"bob@example.com",active:true});
    await setDoc(ref(db,"trips/new-trip-2027/photos/pic1"),{uploaderUid:"admin",name:"photo.jpg"});
    await setDoc(ref(db,"trips/new-trip-2027/expenses/bill1"),{createdBy:"admin",title:"Lunch",amountMinor:1000});
    await setDoc(ref(db,"publishedTrips/open-trip"),{published:true,title:"Public"});
    await setDoc(ref(db,"publishedTrips/hidden-trip"),{published:false,title:"Private"});
  });
});
after(async()=>{if(env)await env.cleanup();});

test("only the profile owner can read their profile; no client can write points",async()=>{
  await assertSucceeds(getDoc(ref(alice,"users/alice")));
  await assertFails(getDoc(ref(bob,"users/alice")));
  await assertFails(getDoc(ref(anonymous,"users/alice")));
  await assertFails(updateDoc(ref(alice,"users/alice"),{points:10000,organizerOverride:true}));
  await assertFails(setDoc(ref(bob,"users/bob"),{points:100,active:true}));
  await assertFails(setDoc(ref(admin,"platformInvites/forged"),{email:"bob@example.com",status:"pending"}));
  await assertFails(setDoc(ref(admin,"pointAwards/new-trip-2027_admin"),{points:20}));
});
test("trip invitation alone does not grant finance or photo access",async()=>{
  await assertSucceeds(getDoc(ref(alice,"trips/new-trip-2027")));
  await assertFails(getDoc(ref(alice,"trips/new-trip-2027/expenses/bill1")));
  await assertFails(getDoc(ref(alice,"trips/new-trip-2027/photos/pic1")));
  await assertFails(getDoc(ref(bob,"trips/new-trip-2027")));
  await assertFails(getDoc(ref(anonymous,"trips/new-trip-2027")));
});
test("members cannot self-promote on enrollment or access other users' trip indexes",async()=>{
  await assertFails(setDoc(ref(alice,"trips/new-trip-2027/members/alice"),{
    displayName:"Alice",email:"alice@example.com",role:"admin",active:true,joinedAt:serverTimestamp()
  }));
  await assertFails(setDoc(ref(bob,"trips/new-trip-2027/members/bob"),{
    displayName:"Bob",email:"bob@example.com",role:"member",active:true,joinedAt:serverTimestamp()
  }));
  await assertFails(getDocs(collection(bob,"users/alice/tripRefs")));
  await assertFails(setDoc(ref(alice,"users/alice/tripRefs/new-trip-2027"),{role:"admin"}));
});
test("invited platform member can enroll with member role; cannot change it",async()=>{
  await assertSucceeds(setDoc(ref(alice,"trips/new-trip-2027/members/alice"),{
    displayName:"Alice",email:"alice@example.com",role:"member",active:true,joinedAt:serverTimestamp()
  }));
  await assertSucceeds(getDoc(ref(alice,"trips/new-trip-2027/expenses/bill1")));
  await assertSucceeds(getDoc(ref(alice,"trips/new-trip-2027/photos/pic1")));
  await assertFails(updateDoc(ref(alice,"trips/new-trip-2027/members/alice"),{role:"admin"}));
  await assertFails(deleteDoc(ref(alice,"trips/new-trip-2027/photos/pic1")));
  await assertSucceeds(deleteDoc(ref(admin,"trips/new-trip-2027/photos/pic1")));
});
test("legacy trip enrollment remains allowed to an invited user without new profile",async()=>{
  await assertSucceeds(setDoc(ref(bob,"trips/legacy-2026/members/bob"),{
    displayName:"Bob",email:"bob@example.com",role:"member",active:true,joinedAt:serverTimestamp()
  }));
  await assertSucceeds(getDoc(ref(bob,"trips/legacy-2026")));
});
test("published itinerary can be read publicly but cannot be listed or modified",async()=>{
  await assertSucceeds(getDoc(ref(anonymous,"publishedTrips/open-trip")));
  await assertFails(getDoc(ref(anonymous,"publishedTrips/hidden-trip")));
  await assertFails(getDocs(collection(anonymous,"publishedTrips")));
  await assertFails(setDoc(ref(alice,"publishedTrips/fake"),{published:true,title:"Spoof"}));
});
