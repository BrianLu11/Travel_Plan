"use strict";
const crypto = require("node:crypto");
const POINTS_PER_CONFIRMED_TRIP = 20;
const ORGANIZER_THRESHOLD = 100;
const INVITE_TTL_DAYS = 30;
const TYPES = ["day-trip", "multi-day-trip", "event-trip", "regional-trip"];
const CURRENCIES = ["JPY","TWD","USD","KRW"];
function email(value){
  if(typeof value!=="string")throw Error("Email 格式不正確");
  const value2=value.trim().toLowerCase();
  if(value2.length>254||!(/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(value2)))throw Error("Email 格式不正確");
  return value2;
}
function emailHash(value){return crypto.createHash("sha256").update(email(value)).digest("hex");}
function tripId(value){
  if(typeof value!=="string"||!(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))||value.length>60||value.length<4)throw Error("旅行 ID 必須是 4–60 字元的小寫英數和連字號");
  return value;
}
function date(value){
  if(typeof value!=="string"||!(/^\d{4}-\d{2}-\d{2}$/.test(value)))throw Error("日期需為 YYYY-MM-DD");
  const d=new Date(value+"T00:00:00Z");
  if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value)throw Error("日期無效");
  return value;
}
function canOrganize(profile){
  return profile?.active===true&&(profile.platformAdmin===true||profile.organizerOverride===true||(Number.isInteger(profile.points)&&profile.points>=ORGANIZER_THRESHOLD));
}
function validatedTrip(input, today){
  if(!input||typeof input!=="object")throw Error("旅行資料無效");
  const id=tripId(input.tripId),start=date(input.startsOn),end=date(input.endsOn),current=date(today);
  const title=typeof input.title==="string"?input.title.trim():"";
  if(!title||title.length>100)throw Error("旅行名稱需為 1–100 字");
  if(start<current)throw Error("不可建立已經開始的旅行");
  if(end<start)throw Error("結束日期不可早於開始日期");
  const days=(Date.parse(end+"T00:00:00Z")-Date.parse(start+"T00:00:00Z"))/86400000;
  if(days>30)throw Error("一次旅行最長 31 天");
  if(Date.parse(start+"T00:00:00Z")-Date.parse(current+"T00:00:00Z")>366*86400000)throw Error("僅可建立一年內的行程");
  const templateType=input.templateType;
  if(!TYPES.includes(templateType))throw Error("不支援的行程模板");
  const currency=input.currency||"JPY";
  if(!CURRENCIES.includes(currency))throw Error("不支援的幣別");
  return {id,title,startsOn:start,endsOn:end,templateType,currency};
}
function emails(input){
  if(!Array.isArray(input)||input.length<1||input.length>20)throw Error("每次最多邀請 20 個 Email");
  const result=[...new Set(input.map(email))];
  if(result.length<1)return [];
  return result;
}
function todayInJst(){
  return new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
}
module.exports={POINTS_PER_CONFIRMED_TRIP,ORGANIZER_THRESHOLD,INVITE_TTL_DAYS,TYPES,CURRENCIES,email,emailHash,tripId,date,canOrganize,validatedTrip,emails,todayInJst};
