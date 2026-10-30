import fs from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {HISTORY,projects,saveProject,readDraft,saveDraft,safeJoin} from './store.ts';
import {cleanProject} from '../packages/shared/content.ts';
import {hasProjectTitle,mergePortfolioDraft,sameProjectContent} from '../packages/shared/portfolio.ts';

export async function pendingPortfolioChanges(){
 const pending=[];
 for(const saved of await projects()){
  const draft=await readDraft(saved.id);
  if(draft&&draft.revision!==saved.revision){pending.push({id:saved.id,title:saved.title,conflict:true});continue;}
  const next=mergePortfolioDraft(saved,draft);
  if(hasProjectTitle(next)&&(next.status==='published'||saved.status==='published')&&!sameProjectContent(saved,next))pending.push({id:saved.id,title:next.title,conflict:false});
 }
 return pending;
}

export async function preparePortfolio(){
 // Validate every document before writing the first one.
 const collection=await projects();
 const ready=await Promise.all(collection.map(async saved=>({saved,next:mergePortfolioDraft(saved,await readDraft(saved.id))})));
 let applied=0;
 for(const {saved,next} of ready){
  if(!sameProjectContent(saved,next)){await saveProject(next);applied++;}
 }
 return {projects:await projects(),applied};
}

const reorderSchema=z.object({projects:z.array(z.object({id:z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/),revision:z.number().int().nonnegative()})).max(1000)});
export async function reorderProjects(raw:unknown){
 const request=reorderSchema.parse(raw),all=await projects(),byId=new Map(all.map(p=>[p.id,p]));
 if(request.projects.length!==all.length||new Set(request.projects.map(p=>p.id)).size!==all.length)throw Object.assign(new Error('รายการผลงานเปลี่ยนแล้ว กรุณารีเฟรชก่อนเรียงใหม่'),{status:409});
 for(const item of request.projects)if(byId.get(item.id)?.revision!==item.revision)throw Object.assign(new Error('ผลงานถูกแก้ในหน้าต่างอื่น กรุณารีเฟรชก่อนเรียงใหม่'),{status:409});
 const drafts=new Map(await Promise.all(all.map(async p=>[p.id,await readDraft(p.id)] as const)));
 for(const p of all){const draft=drafts.get(p.id);if(draft&&draft.revision!==p.revision)throw Object.assign(new Error('มีร่างเก่าของ '+p.title+' กรุณาเปิดและบันทึกก่อนเรียงลำดับ'),{status:409});}
 for(const [order,item] of request.projects.entries()){
  const old=byId.get(item.id)!;
  if(old.order===order)continue;
  const draft=drafts.get(old.id),saved=await saveProject({...old,order});
  if(draft)await saveDraft({...draft,order,revision:draft.revision===old.revision?saved.revision:draft.revision});
 }
 return projects();
}

const trashName=z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}-\d+\.json$/);
export async function listTrash(){
 const dir=path.join(HISTORY,'trash');
 const files=await fs.readdir(dir).catch((error:any)=>{if(error.code==='ENOENT')return [];throw error;});
 const result=[];
 for(const file of files.filter(f=>trashName.safeParse(f).success).sort().reverse()){
  const project=cleanProject(JSON.parse(await fs.readFile(safeJoin(dir,file),'utf8')));
  result.push({file,title:project.title,deletedAt:Number(file.match(/-(\d+)\.json$/)![1])});
 }
 return result.sort((a,b)=>b.deletedAt-a.deletedAt);
}
export async function restoreTrash(raw:unknown){
 const {file}=z.object({file:trashName}).parse(raw),location=safeJoin(path.join(HISTORY,'trash'),file);
 const project=cleanProject(JSON.parse(await fs.readFile(location,'utf8'))),all=await projects();
 if(all.some(p=>p.id===project.id))throw Object.assign(new Error('มีผลงานนี้อยู่แล้ว'),{status:409});
 const saved=await saveProject({...project,revision:0,order:Math.max(-1,...all.map(p=>p.order))+1});
 await fs.rename(location,location+'.restored');
 return saved;
}
