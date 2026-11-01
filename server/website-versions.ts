import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {z} from 'zod';
import {profileSchema,type Profile} from '../packages/shared/content.ts';
import {HISTORY,atomic,readProfile,readProfileDraft,saveProfile} from './store.ts';

const reasonSchema=z.enum(['manual','template','default','restore']);
const recordSchema=z.object({id:z.string().uuid(),name:z.string().trim().max(100),reason:reasonSchema,createdAt:z.string().datetime(),profile:profileSchema});
export const versionIdSchema=z.string().regex(/^(?:current|s-\d{10,16}-\d+\.json|v-[a-f0-9-]{36}\.json)$/);
const fingerprint=(p:Profile)=>createHash('sha256').update(JSON.stringify(profileSchema.parse(p))).digest('hex');
export function createWebsiteVersions({history=HISTORY,readSaved=readProfile,readDraft=readProfileDraft,save=saveProfile}={}){
 const directory=path.join(history,'website-versions');
 const effective=async()=>await readDraft()||await readSaved();
 async function assertCurrent(expected:unknown){const current=await effective(),value=profileSchema.parse(expected);if(fingerprint(current)!==fingerprint(value))throw Object.assign(new Error('ข้อมูลเว็บไซต์เปลี่ยนในอีกหน้าต่างแล้ว รีเฟรชก่อนทำรายการ'),{status:409});return current;}
 async function checkpoint(expected:unknown,name='',reason:z.infer<typeof reasonSchema>='manual'){
  const current=await assertCurrent(expected),record=recordSchema.parse({id:randomUUID(),name,reason,createdAt:new Date().toISOString(),profile:current});
  await atomic(path.join(directory,record.id+'.json'),JSON.stringify(record,null,2));return {id:'v-'+record.id+'.json',name:record.name,reason:record.reason,createdAt:record.createdAt,revision:current.revision};
 }
 async function get(rawId:string){const id=versionIdSchema.parse(rawId);if(id==='current')return readSaved();
  if(id.startsWith('s-'))return profileSchema.parse(JSON.parse(await fs.readFile(path.join(history,'profile',id.slice(2)),'utf8')));
  return recordSchema.parse(JSON.parse(await fs.readFile(path.join(directory,id.slice(2)),'utf8'))).profile;
 }
 async function list(){
  const saved=await readSaved();const entries:{id:string;name:string;reason:string;createdAt:string;revision:number}[]=[{id:'current',name:'บันทึกล่าสุด',reason:'saved',createdAt:saved.updatedAt||new Date(0).toISOString(),revision:saved.revision}];
  for(const [folder,kind]of [[path.join(history,'profile'),'s'],[directory,'v']] as const){let files:string[]=[];try{files=await fs.readdir(folder);}catch(e:any){if(e.code!=='ENOENT')throw e;}
   for(const file of files){if(kind==='s'?!/^\d{10,16}-\d+\.json$/.test(file):! /^[a-f0-9-]{36}\.json$/.test(file))continue;
    try{const raw=JSON.parse(await fs.readFile(path.join(folder,file),'utf8'));if(kind==='v'){const r=recordSchema.parse(raw);entries.push({id:'v-'+file,name:r.name,reason:r.reason,createdAt:r.createdAt,revision:r.profile.revision});}else{const p=profileSchema.parse(raw);entries.push({id:'s-'+file,name:'บันทึกเวอร์ชัน '+p.revision,reason:'saved',createdAt:p.updatedAt||new Date(Number(file.split('-')[0])).toISOString(),revision:p.revision});}}catch{/* Keep an unreadable file on disk so it can still be recovered manually. */}
   }
  }
  return entries.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,100);
 }
 async function restore(id:string,expected:unknown){const target=await get(id),current=await assertCurrent(expected);const safety=await checkpoint(current,'ก่อนเรียกคืนเวอร์ชัน','restore');const restored=await save({...target,revision:current.revision});return {profile:restored,safety};}
 return {list,get,checkpoint,restore};
}
export const websiteVersions=createWebsiteVersions();
