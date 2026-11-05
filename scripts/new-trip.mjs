#!/usr/bin/env node
import {readFile,writeFile,mkdir,access} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const [type,slug]=process.argv.slice(2);
if(!["day-trip","multi-day-trip"].includes(type)||!slug||!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug)){
  console.error("Usage: node scripts/new-trip.mjs <day-trip|multi-day-trip> <lowercase-trip-slug>");
  process.exitCode=1;
}else{
  const dest=path.join(root,slug);
  try{await access(dest);throw Error("Target folder already exists: "+slug);}
  catch(e){if(e.code!=="ENOENT")throw e;}
  await mkdir(dest);
  for(const file of ["index.html","app.js","trip-data.js"]){
    let data=await readFile(path.join(root,"templates",type,file),"utf8");
    // Scaffolds live two levels below the root; generated trips live one level below.
    if(file==="index.html") data=data.replaceAll('href="../../"','href="../"').replace('href="../shared/trip.css"','href="../templates/shared/trip.css"');
    if(file==="app.js")data=data.replace('from "../shared/trip.js"','from "../templates/shared/trip.js"');
    if(file==="trip-data.js")data=data.replace(/example-(?:day-trip|multi-day)/g,slug);
    await writeFile(path.join(dest,file),data);
  }
  console.log("Created "+slug+"/. Edit "+slug+"/trip-data.js, add a homepage link, and run node scripts/check-site.mjs.");
}
