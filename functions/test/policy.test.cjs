const test=require("node:test"),assert=require("node:assert/strict");
const p=require("../lib/policy.js");
test("new members cannot organize",()=>{assert.equal(p.canOrganize({active:true,points:0}),false);assert.equal(p.canOrganize({active:true,points:99}),false);assert.equal(p.canOrganize({active:true,points:100}),true);assert.equal(p.canOrganize({active:false,points:999}),false);});
test("bootstrapped platform owner can organize",()=>{assert.equal(p.canOrganize({active:true,points:0,organizerOverride:true}),true);});
test("invitation matches case insensitive verified email",()=>{assert.equal(p.emailHash(" EXAMPLE@GMAIL.COM "),p.emailHash("example@gmail.com"));});
test("trip IDs reject traversal",()=>{assert.throws(()=>p.tripId("../evil"));assert.throws(()=>p.tripId("A-B"));assert.equal(p.tripId("kyoto-2027"),"kyoto-2027");});
test("trip validation rejects invalid dates and unapproved templates",()=>{const ok={tripId:"kyoto-2027",title:"京都旅行",startsOn:"2027-05-01",endsOn:"2027-05-05",templateType:"multi-day-trip",currency:"JPY"};assert.equal(p.validatedTrip(ok,"2026-11-12").title,"京都旅行");assert.throws(()=>p.validatedTrip({...ok,endsOn:"2027-02-30"},"2026-11-12"));assert.throws(()=>p.validatedTrip({...ok,templateType:"arbitrary"},"2026-11-12"));assert.throws(()=>p.validatedTrip({...ok,startsOn:"2026-01-01"},"2026-11-12"));});
test("bulk emails are capped and deduped",()=>{assert.deepEqual(p.emails(["A@B.COM","a@b.com"]),["a@b.com"]);assert.throws(()=>p.emails(Array(21).fill("a@b.com")));});
