import fs from 'node:fs/promises';
import path from 'node:path';
import {templateSchema,type DesignTemplate} from '../packages/shared/template-kit.ts';
import {HISTORY,ASSETS,atomic,safeJoin} from './store.ts';
export const TEMPLATE_DIRECTORY=path.join(HISTORY,'templates');
export function createTemplateLibrary(directory=TEMPLATE_DIRECTORY,assets=ASSETS){
 async function validateAssets(template:DesignTemplate){for(const n of template.design.sections.flatMap(s=>s.nodes)){if(n.type==='image'&&n.image)try{await fs.access(safeJoin(assets,n.image.src.slice('/assets/'.length)));}catch{throw new Error('ไม่พบรูป '+n.image.src+' · ใช้ binding รูปโปรไฟล์ หรือเลือกรูปหลังใช้ Template');}}}
 async function get(id:string){if(!/^[a-z][a-z0-9-]{1,63}$/.test(id))throw new Error('Template ID ไม่ถูกต้อง');const file=path.join(directory,id+'.json');if((await fs.stat(file)).size>512*1024)throw new Error('Template ต้องไม่เกิน 512 KB');const t=templateSchema.parse(JSON.parse(await fs.readFile(file,'utf8')));if(t.id!==id)throw new Error('Template ID ต้องตรงกับชื่อไฟล์');return t;}
 async function list(){let files:string[]=[];try{files=await fs.readdir(directory);}catch(e:any){if(e.code!=='ENOENT')throw e;}
  const entries=[];for(const file of files){if(!/^[a-z][a-z0-9-]{1,63}\.json$/.test(file))continue;try{const t=await get(file.slice(0,-5)),preview=structuredClone(t);preview.design.sections=preview.design.sections.slice(0,1);preview.design.sections[0].nodes=preview.design.sections[0].nodes.slice(0,24).map(n=>({...n,text:n.text.slice(0,400)}));const ids=new Set(preview.design.sections.flatMap(s=>s.nodes.map(n=>n.id)));preview.bindings=preview.bindings.filter(b=>ids.has(b.nodeId));entries.push({id:t.id,name:t.name,description:t.description,category:t.category,pages:t.pages,reference:t.reference,preview});}catch{/* Invalid files are left untouched and never run as code. */}}
  return entries.sort((a,b)=>a.name.localeCompare(b.name));
 }
 async function add(raw:unknown){if(Buffer.byteLength(JSON.stringify(raw),'utf8')>512*1024)throw new Error('Template ต้องไม่เกิน 512 KB');const t=templateSchema.parse(raw);await validateAssets(t);await fs.mkdir(directory,{recursive:true});if((await list()).length>=50)throw new Error('เก็บ Template ได้สูงสุด 50 แบบ');
  // Importing must not silently overwrite an existing design with the same ID.
  const file=path.join(directory,t.id+'.json');try{await fs.access(file);throw new Error('มี Template ID นี้แล้ว เปลี่ยน id ก่อนนำเข้า');}catch(e:any){if(e.code!=='ENOENT')throw e;}t.design.enabled=false;const encoded=JSON.stringify(t,null,2);if(Buffer.byteLength(encoded,'utf8')>512*1024)throw new Error('Template หลังจัดรูปแบบต้องไม่เกิน 512 KB');await atomic(file,encoded);return t;
 }
 return {get,list,add};
}
export const templateLibrary=createTemplateLibrary();
