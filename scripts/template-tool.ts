import fs from 'node:fs/promises';
import {templateSchema,templateJsonSchema,templateExample} from '../packages/shared/template-kit.ts';
import {templateLibrary} from '../server/template-library.ts';
const [mode,file]=process.argv.slice(2);
try{
 if(mode==='schema')console.log(JSON.stringify(templateJsonSchema(),null,2));
 else if(mode==='example')console.log(JSON.stringify(templateExample(),null,2));
 else{if(!file||!['check','import'].includes(mode))throw new Error('ใช้ template:check -- <file.json> หรือ template:import -- <file.json>');const bytes=await fs.readFile(file);if(bytes.length>512*1024)throw new Error('Template ต้องไม่เกิน 512 KB');const t=templateSchema.parse(JSON.parse(bytes.toString('utf8')));if(mode==='import')await templateLibrary.add(t);console.log(JSON.stringify({valid:true,imported:mode==='import',id:t.id,name:t.name,sections:t.design.sections.length,nodes:t.design.sections.reduce((sum,s)=>sum+s.nodes.length,0)}));}
}catch(e:any){console.error(e.issues?e.issues.map((i:any)=>i.path.join('.')+': '+i.message).join('\n'):e.message);process.exitCode=1;}
