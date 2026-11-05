#!/usr/bin/env node
// Zero-dependency static checks. Not a substitute for browser or Firebase auth tests.
import {readFile,readdir,access} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const errors=[],notices=[];
const posix=p=>p.split(path.sep).join("/");
const ignored=new Set([".git","node_modules",".github"]);
const htmls=[],jsFiles=[];
async function scan(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    if(ignored.has(entry.name)||entry.name.startsWith("."))continue;
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())await scan(file);
    else if(entry.isFile()){
      if(file.endsWith(".html"))htmls.push(file);
      if(file.endsWith(".js")||file.endsWith(".mjs"))jsFiles.push(file);
    }
  }
}
const exists=async file=>{try{await access(file);return true;}catch{return false;}};
await scan(root);
for(const file of htmls){
  const rel=posix(path.relative(root,file)),html=await readFile(file,"utf8");
  const attrs=[...html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)];
  for(const match of attrs){
    const value=match[1];
    if(/^(?:https?:|mailto:|tel:|data:|blob:|#|javascript:)/i.test(value))continue;
    if(value.startsWith("/")){errors.push(rel+": root-absolute link is unsafe on project Pages: "+value);continue;}
    const url=value.split(/[?#]/,1)[0];if(!url)continue;
    if(!await exists(path.resolve(path.dirname(file),decodeURIComponent(url))))errors.push(rel+": missing local link "+value);
  }
  if(rel.includes("/")&&!(rel.startsWith("templates/"))&&/<header\b/i.test(html)){
    if(/class=["'][^"']*brand[^"']*["']/.test(html)){
      const found=html.match(/<a\b[^>]*class=["'][^"']*brand[^"']*["'][^>]*>/i)?.[0]||"";
      if(!/href=["']\.\.\/["']/.test(found))errors.push(rel+": brand must link to ../ (site homepage)");
    }
  }
  if(rel.startsWith("templates/")&&rel.endsWith("/index.html")&&!html.includes('id="homeLink"'))errors.push(rel+": missing template homeLink");
}
for(const file of jsFiles){
  const rel=posix(path.relative(root,file));
  const checked=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});
  if(checked.status!==0)errors.push(rel+": JS syntax error: "+(checked.stderr||checked.stdout).trim().slice(0,350));
}
for(const name of ["ueno-trip","chichibu-kawagoe"]){
 const html=await readFile(path.join(root,name,"index.html"),"utf8");
 if(!html.includes('href="../"'))errors.push(name+": missing homepage navigation");
}
for(const type of ["day-trip","multi-day-trip"]){
 const src=await readFile(path.join(root,"templates",type,"trip-data.js"),"utf8");
 if(!src.includes("features:{ledger:false,gallery:false}"))errors.push(type+": sample must keep Firebase services disabled");
}
for(const line of notices)console.log("NOTICE "+line);
if(errors.length){errors.forEach(s=>console.error("FAIL "+s));console.error(errors.length+" check(s) failed.");process.exitCode=1;}
else console.log("PASS: "+htmls.length+" HTML, "+jsFiles.length+" JS files, local paths, navigation and template defaults.");
