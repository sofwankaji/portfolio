import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {ROOT,HISTORY,atomic,safeJoin,projects,readProfile} from './store.ts';
import {referencedAssets} from '../packages/shared/content.ts';
import {readPublishConfig,type PublishConfig} from './publish-config.ts';
import {git,gh,redact,verifyRepository,divergence,refreshRemote,checkSecret} from './git.service.ts';
import {exportPublic} from '../scripts/export-public.ts';

const publicPath=(p:string)=>p==='content/profile.json'||/^content\/projects\/[a-z0-9-]+\.json$/.test(p)||/^content\/assets\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.(png|jpg|jpeg|webp)$/.test(p);
export const isPublicContentPath=publicPath;
const blobHash=(bytes:Buffer)=>createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
export type PublishPlan={files:string[];remove:string[];changes:{path:string;status:string}[];hashes:Record<string,string>;fingerprint:string;publishedProjects:number};
export async function makePublishPlan():Promise<PublishPlan>{
 const all=await projects(),published=all.filter(p=>p.status==='published'),profile=await readProfile();
 const files=new Set(['content/profile.json',...published.map(p=>'content/projects/'+p.id+'.json'),...published.flatMap(referencedAssets).map(src=>'content/'+src.slice(1)),...(profile.portrait?['content/'+profile.portrait.src.slice(1)]:[])]);
 const hashes:Record<string,string>={};
 for(const name of files){if(!publicPath(name))throw new Error('Unapproved public content path');const file=safeJoin(ROOT,name),stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink())throw new Error(`Unsupported file: ${name}`);const bytes=await fs.readFile(file);checkSecret(bytes,name);hashes[name]=blobHash(bytes);}
 const tree=await git(['ls-tree','-r','--full-tree','HEAD','--','content/']);const tracked=new Map<string,string>();
 for(const row of tree.split('\n').filter(Boolean)){const [meta,name]=row.split('\t');if(publicPath(name))tracked.set(name,meta.split(' ')[2]);}
 const remove=[...tracked.keys()].filter(name=>!files.has(name)).sort();
 const changes=[...[...files].filter(name=>tracked.get(name)!==hashes[name]).map(name=>({path:name,status:tracked.has(name)?'modified':'added'})),...remove.map(name=>({path:name,status:'removed from public repository'}))].sort((a,b)=>a.path.localeCompare(b.path));
 const fingerprint=createHash('sha256').update(JSON.stringify({hashes:Object.fromEntries(Object.entries(hashes).sort()),remove})).digest('hex');
 return {files:[...files].sort(),remove,changes,hashes,fingerprint,publishedProjects:published.length};
}
async function systemChanges(){const names=[...(await git(['diff','--name-only','--no-renames','-z','HEAD'])).split('\0'),...(await git(['ls-files','--others','--exclude-standard','-z'])).split('\0')];return [...new Set(names.filter(Boolean).filter(n=>!publicPath(n)))];}
const stageLabels=[['validate','ตรวจข้อมูล'],['build','สร้างเว็บ'],['sync','ตรวจ GitHub'],['commit','บันทึกเวอร์ชัน'],['push','Push ไป GitHub'],['verify','ตรวจไฟล์บน GitHub'],['deploy','ตรวจเว็บออนไลน์']];
type Job={id:string;status:string;stage:string;steps:{key:string;label:string;status:string}[];message:string;startedAt:string;updatedAt:string;commit?:string;commitUrl?:string;runUrl?:string;siteUrl?:string;error?:string;pushed?:boolean;verified?:boolean;noChanges?:boolean;files?:{path:string;status:string}[]};
let latest:Job|null=null,loaded=false,busy=false;
const jobFile=path.join(HISTORY,'publish','latest.json');
async function load(){if(loaded)return;loaded=true;try{latest=JSON.parse(await fs.readFile(jobFile,'utf8'));if(latest&&['running','deploying','pushed'].includes(latest.status)){latest.status=latest.pushed?'pushed_unverified':'failed';latest.error='Studio restarted. Check the result before retrying.';}}catch{latest=null;}}
async function persist(){if(latest)await atomic(jobFile,JSON.stringify(latest,null,2));}
async function step(job:Job,key:string){job.stage=key;job.updatedAt=new Date().toISOString();const i=job.steps.findIndex(s=>s.key===key);job.steps.forEach((s,index)=>s.status=index<i?'done':index===i?'running':'pending');await persist();}
async function fail(job:Job,error:unknown){job.status='failed';job.error=redact(error instanceof Error?error.message:String(error));job.updatedAt=new Date().toISOString();const current=job.steps.find(s=>s.key===job.stage);if(current)current.status='failed';busy=false;await persist();}
export async function publishStatus(){await load();const config=await readPublishConfig();try{const repo=await verifyRepository(config),plan=await makePublishPlan(),counts=await divergence(config),blocked=await systemChanges();return {config,repository:repo,...counts,plan:{changes:plan.changes,fingerprint:plan.fingerprint,publishedProjects:plan.publishedProjects},blocked,busy,job:latest};}catch(e:any){return {config,busy,job:latest,error:redact(e.message)};}}
export async function publishJobStatus(){await load();return {busy,job:latest};}
export const publishRequestSchema=z.object({message:z.string().trim().min(1).max(200).refine(x=>!/[\r\n\x00-\x1f]/.test(x)),expectedHead:z.string().regex(/^[a-f0-9]{40}$/),fingerprint:z.string().regex(/^[a-f0-9]{64}$/)});
export async function startPublish(raw:unknown,serial:<T>(fn:()=>Promise<T>)=>Promise<T>){
 await load();if(busy)throw Object.assign(new Error('A publish is already in progress'),{status:409});const request=publishRequestSchema.parse(raw);
 const job:Job={id:randomUUID(),status:'running',stage:'validate',steps:stageLabels.map(([key,label])=>({key,label,status:'pending'})),message:request.message,startedAt:new Date().toISOString(),updatedAt:new Date().toISOString()};busy=true;latest=job;await persist();
 void serial(()=>performPublish(job,request)).catch(e=>fail(job,e));return job;
}
async function performPublish(job:Job,request:z.infer<typeof publishRequestSchema>){
 const config=await readPublishConfig();job.siteUrl=config.siteUrl;
 await step(job,'validate');const repo=await verifyRepository(config);if(repo.head!==request.expectedHead)throw new Error('The local Git revision changed. Refresh the publish page before retrying.');
 const blocked=await systemChanges();if(blocked.length)throw new Error('System files have uncommitted changes: '+blocked.slice(0,8).join(', '));
 const plan=await makePublishPlan();if(plan.fingerprint!==request.fingerprint)throw new Error('Saved content changed. Refresh the publish page before retrying.');job.files=plan.changes;
 const approved=new Set([...plan.files,...plan.remove]);const staged=(await git(['diff','--cached','--name-only','-z'])).split('\0').filter(Boolean);if(staged.some(name=>!approved.has(name)))throw new Error('Unrelated files are staged in Git. Keep them separate before publishing.');
 await step(job,'build');await exportPublic();if((await makePublishPlan()).fingerprint!==plan.fingerprint)throw new Error('Content changed while building. Retry with the latest saved content.');
 await step(job,'sync');await refreshRemote(config);
 await step(job,'commit');
 if(plan.changes.length){for(let i=0;i<plan.files.length;i+=60)await git(['add','-f','--',...plan.files.slice(i,i+60)]);for(let i=0;i<plan.remove.length;i+=60)await git(['rm','--cached','--ignore-unmatch','--',...plan.remove.slice(i,i+60)]);
  const index=await git(['ls-files','--stage','-z','--','content/']);for(const entry of index.split('\0').filter(Boolean)){const [meta,name]=entry.split('\t');if(!approved.has(name)||plan.remove.includes(name))throw new Error('Unexpected public content in the Git index');if(meta.split(' ')[1]!==plan.hashes[name])throw new Error('A content file changed during staging. Refresh before retrying.');}
  await git(['commit','-m',request.message]);
 }else job.noChanges=true;
 job.commit=await git(['rev-parse','HEAD']);job.commitUrl=`https://github.com/${config.repository}/commit/${job.commit}`;
 await step(job,'push');await git(['push','origin',`HEAD:refs/heads/${config.branch}`]);job.pushed=true;
 await step(job,'verify');const remote=(await git(['ls-remote','origin',`refs/heads/${config.branch}`])).split(/\s+/)[0];if(remote!==job.commit)throw new Error('Push returned, but the GitHub branch has a different revision.');job.verified=true;
 job.status='deploying';await step(job,'deploy');void monitorDeployment(job,config).catch(e=>fail(job,e));
}
async function monitorDeployment(job:Job,config:PublishConfig){
 const end=Date.now()+12*60*1000;let lastError='';
 while(Date.now()<end&&latest?.id===job.id){
  try{
   const runs=JSON.parse(await gh(['run','list','--repo',config.repository,'--workflow',config.workflow,'--commit',job.commit!,'--limit','1','--json','databaseId,status,conclusion,url,headSha']));const run=runs.find((r:any)=>r.headSha===job.commit);
   if(run){job.runUrl=run.url;await persist();if(run.status==='completed'&&run.conclusion!=='success')throw Object.assign(new Error('Push succeeded, but GitHub Pages deployment '+run.conclusion+'. Open the deployment log.'),{terminal:true});
    if(run.status==='completed'&&run.conclusion==='success'){const response=await fetch(new URL('version.json?studio='+job.commit,config.siteUrl),{signal:AbortSignal.timeout(12000),cache:'no-store'});if(response.ok&&(await response.json()).commit===job.commit){job.status='deployed';job.updatedAt=new Date().toISOString();job.steps.forEach(s=>s.status='done');busy=false;await persist();return;}}
   }
  }catch(e:any){if(e.terminal)throw e;lastError=redact(e.message);}
  await new Promise(resolve=>setTimeout(resolve,7000));
 }
 job.status='pushed_unverified';job.error=lastError||'GitHub has the new revision. Online deployment is not yet verified.';busy=false;await persist();
}
