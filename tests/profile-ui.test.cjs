"use strict";
const fs=require("node:fs");
const assert=require("node:assert/strict");
const test=require("node:test");
const pages=["index.html","travel-club/index.html","expense-tracker/index.html","photo-gallery/index.html","trip/index.html","tsuchiura-hanabi/index.html","chichibu-kawagoe/index.html","kyoto-autumn-tea/index.html","ueno-trip/index.html"];
test("all published pages load the shared member profile link",()=>{
  for(const page of pages){
    const html=fs.readFileSync(page,"utf8");
    assert.match(html,/<script type="module" src="(?:\.\.?\/)*shared\/profile-nav\.js"><\/script>/,page);
  }
});
test("member dashboard retains exactly one of each functional control",()=>{
  const html=fs.readFileSync("travel-club/index.html","utf8");
  const ids=["loginView","joinView","dashboard","signIn","signOut","acceptPlatform","newTrip","tripId","title","startsOn","endsOn","templateType","currency","platformInvite","platformEmails","publishPanel","publishTrip","publishId","itineraryJson","joinTrip","joiningId","tripList","account","points","qualification","memberAvatar","memberRole","memberName","memberSince","progressRing","pointsNeeded","tripCount","organizer","status"];
  for(const id of ids){
    const count=(html.match(new RegExp('id="'+id+'"',"g"))||[]).length;
    assert.equal(count,1,id+" must appear exactly once");
  }
});
test("profile widget defaults to real navigation even if Firebase is offline",()=>{
  const code=fs.readFileSync("shared/profile-nav.js","utf8");
  assert.match(code,/new URL\("\.\.\/travel-club\/",import\.meta\.url\)/);
  assert.match(code,/link\.href=profileUrl\.href/);
  assert.match(code,/catch\{/);
});
