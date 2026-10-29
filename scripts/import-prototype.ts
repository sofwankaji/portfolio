import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {ROOT,PROJECTS,ASSETS,atomic} from '../server/store.ts';
import {cleanProject,esc} from '../packages/shared/content.ts';
const old=String.raw`C:\Users\sofwa\Documents\Codex\2026-10-29\new-chat-2\work\preview-site`;
const script=await fs.readFile(path.join(old,'portfolio.js'),'utf8');
const from=script.indexOf('const entries=')+'const entries='.length,to=script.indexOf('\n const dialog=',from);
if(from<14||to<0)throw new Error('Original data not found');
const literal=script.slice(from,to).trim().replace(/;$/,'');
const entries=vm.runInNewContext('('+literal+')',Object.create(null),{timeout:500});
await fs.cp(path.join(old,'assets'),ASSETS,{recursive:true});
for(const [id,d] of Object.entries(entries) as [string,any][]){
 const file=path.join(PROJECTS,id+'.json');try{await fs.access(file);continue;}catch{}
 const cover=d.image?{src:'/'+d.image,alt:d.alt||d.name,caption:''}:null;
 const blocks=d.story.map(([heading,body]:string[],i:number)=>({id:`section-${i}`,type:'text',html:`<h2>${esc(heading)}</h2><p>${esc(body)}</p>`}));
 const p=cleanProject({id,slug:id,title:d.name,headline:d.title,summary:d.intro,category:id==='customer-clustering'?'analysis':id==='reporting-automation'?'automation':'dashboard',context:d.context,role:d.role,tools:d.tools,repo:d.repo||'',demo:d.demo||'',status:'published',cover,coverStyle:id,coverNote:d.assetNote||'',blocks,revision:1,updatedAt:new Date().toISOString()});
 await atomic(file,JSON.stringify(p,null,2));
}
await atomic(path.join(ROOT,'content/media.json'),JSON.stringify([{src:'/assets/road-accident-dashboard.png',alt:'UK road accident dashboard',caption:'',name:'road-accident-dashboard.png'},{src:'/assets/customer-clustering.png',alt:'Customer clustering analysis',caption:'',name:'customer-clustering.png'}],null,2));
console.log('Imported existing projects without overwriting saved projects.');
