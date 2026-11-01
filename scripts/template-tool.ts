import fs from 'node:fs/promises';
import {templateSchema,templateJsonSchema,templateExample,compactTemplate} from '../packages/shared/template-kit.ts';
import {templateLibrary} from '../server/template-library.ts';
import {prepareTemplateAgent} from '../server/template-agent.ts';
const [mode,file]=process.argv.slice(2);
try{
 if(mode==='schema')console.log(JSON.stringify(templateJsonSchema(),null,2));
 else if(mode==='example')console.log(JSON.stringify(compactTemplate(templateExample()),null,2));
 else if(mode==='agent'){const args=process.argv.slice(3),options:Record<string,string>={};for(let i=0;i<args.length;i+=2){const key=args[i].replace(/^--/,'');if(!['id','name','reference','page','layout','theme'].includes(key)||!args[i+1])throw new Error('ใช้ --id, --name, --reference, --page, --layout หรือ --theme');options[key]=args[i+1];}console.log(JSON.stringify(await prepareTemplateAgent(options),null,2));}
 else{if(!file||!['check','import'].includes(mode))throw new Error('ใช้ template:check -- <file.json> หรือ template:import -- <file.json>');const bytes=await fs.readFile(file);if(bytes.length>512*1024)throw new Error('Template ต้องไม่เกิน 512 KB');const t=templateSchema.parse(JSON.parse(bytes.toString('utf8')));if(mode==='import')await templateLibrary.add(t);console.log(JSON.stringify({valid:true,imported:mode==='import',id:t.id,name:t.name,theme:t.design.theme?.name||null,sections:t.design.sections.length,nodes:t.design.sections.reduce((sum,s)=>sum+s.nodes.length,0),...(mode==='import'?{previewUrl:`http://127.0.0.1:3001/preview/template/${t.id}/${t.pages[0]}/`,studioUrl:`http://127.0.0.1:3001/?template=${t.id}&page=${t.pages[0]}#profile`}:{})}));}
}catch(e:any){console.error(e.issues?e.issues.map((i:any)=>i.path.join('.')+': '+i.message).join('\n'):e.message);process.exitCode=1;}
