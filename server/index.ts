import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
import Busboy from 'busboy';
import sharp from 'sharp';
import {z} from 'zod';
import {ROOT,CONTENT,ASSETS,HISTORY,safeJoin,atomic,projects,saveProject,saveDraft,readDraft,trashProject,readProfile,saveProfile} from './store.ts';
import {cleanProject,renderProject} from '../packages/shared/content.ts';
import {OUT,buildStudio,buildPublic} from '../scripts/build.ts';
import {publishStatus,publishJobStatus,startPublish} from './publish.service.ts';
import {preparePortfolio,reorderProjects,listTrash,restoreTrash} from './portfolio.service.ts';
const TOKEN=randomBytes(32).toString('hex');
let work=Promise.resolve();
const serial=<T>(fn:()=>Promise<T>)=>{const result=work.then(fn);work=result.then(()=>{},()=>{});return result;};
const idSchema=z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/);
const MIME:Record<string,string>={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.pdf':'application/pdf','.svg':'image/svg+xml'};
function send(res:http.ServerResponse,data:unknown,status=200){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));}
async function json(req:http.IncomingMessage){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>2*1024*1024)throw Object.assign(new Error('Content is too large'),{status:413});chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString()||'{}');}
function trusted(req:http.IncomingMessage,port:number){const hosts=[`127.0.0.1:${port}`,`localhost:${port}`];if(!hosts.includes(req.headers.host||''))throw Object.assign(new Error('Invalid local host'),{status:403});if(!['GET','HEAD'].includes(req.method||'')){if(!hosts.map(h=>'http://'+h).includes(req.headers.origin||'')||req.headers['x-studio-token']!==TOKEN)throw Object.assign(new Error('Refresh Studio to continue'),{status:403});}}
async function file(res:http.ServerResponse,root:string,relative:string,head=false){let target=safeJoin(root,relative);try{if((await fs.stat(target)).isDirectory())target=path.join(target,'index.html');const bytes=await fs.readFile(target);res.writeHead(200,{'content-type':MIME[path.extname(target)]||'application/octet-stream','cache-control':'no-cache','x-content-type-options':'nosniff'});res.end(head?undefined:bytes);}catch(e:any){if(e.code==='ENOENT'||e.code==='ENOTDIR'){res.writeHead(404);res.end('Not found');}else throw e;}}
async function media(){try{return JSON.parse(await fs.readFile(path.join(CONTENT,'media.json'),'utf8'));}catch{return [];}}
async function uploads(req:http.IncomingMessage){
 const bb=Busboy({headers:req.headers,limits:{files:16,fileSize:10*1024*1024,fields:0}}),tasks:Promise<any>[]=[];let limitError=false;
 bb.on('filesLimit',()=>{limitError=true;});
 bb.on('file',(_name,stream,info)=>{const chunks:Buffer[]=[];let truncated=false;stream.on('limit',()=>{truncated=true;});stream.on('data',c=>chunks.push(c));tasks.push(new Promise((resolve,reject)=>{stream.on('error',reject);stream.on('end',async()=>{try{if(truncated)throw new Error('Images must be smaller than 10 MB');if(!['image/png','image/jpeg','image/webp'].includes(info.mimeType))throw new Error('Choose JPG, PNG or WebP images');const data=await sharp(Buffer.concat(chunks),{limitInputPixels:36_000_000}).rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:90}).toBuffer();const name=randomUUID()+'.webp';await atomic(path.join(ASSETS,'uploads',name),data);resolve({src:'/assets/uploads/'+name,alt:'',caption:'',name:(info.filename||'image').replace(/[^\p{L}\p{N} ._-]/gu,'').slice(0,150),bytes:data.length});}catch(e){reject(e);}});}));tasks.at(-1)!.catch(()=>{});});
 const done=new Promise<void>((resolve,reject)=>{bb.on('close',resolve);bb.on('error',reject);req.on('aborted',()=>reject(new Error('Upload interrupted')));});req.pipe(bb);await done;
 const results=await Promise.allSettled(tasks);if(limitError)throw new Error('Upload at most 16 images at a time');const bad=results.find(r=>r.status==='rejected');if(bad?.status==='rejected')throw bad.reason;
 const saved=results.map(r=>(r as PromiseFulfilledResult<any>).value);if(!saved.length)throw new Error('Choose an image first');const all=await media();all.push(...saved);await atomic(path.join(CONTENT,'media.json'),JSON.stringify(all,null,2));return saved;
}
async function studioHandler(req:http.IncomingMessage,res:http.ServerResponse){
 try{
  trusted(req,3001);const url=new URL(req.url||'/','http://127.0.0.1:3001'),parts=url.pathname.split('/').filter(Boolean);
  res.setHeader('x-frame-options','SAMEORIGIN');res.setHeader('content-security-policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob: data:; frame-src 'self' http://127.0.0.1:4173 https://www.youtube-nocookie.com; media-src 'self' https:; connect-src 'self'; base-uri 'self'; frame-ancestors 'self'");
  if(parts[0]==='api'){
   res.setHeader('cache-control','no-store');
   if(req.method==='POST'&&parts[1]==='publish'&&parts[2]==='prepare'){if((await publishJobStatus()).busy)throw Object.assign(new Error('กำลังส่งข้อมูลอยู่ กรุณารอให้เสร็จก่อน'),{status:409});return send(res,await serial(async()=>{const result=await preparePortfolio();await buildPublic();return result;}));}
   if(req.method==='POST'&&parts[1]==='projects'&&parts[2]==='reorder'){const body=await json(req);return send(res,await serial(async()=>{const result=await reorderProjects(body);await buildPublic();return result;}));}
   if(req.method==='GET'&&parts[1]==='trash')return send(res,await listTrash());
   if(req.method==='POST'&&parts[1]==='trash'&&parts[2]==='restore'){const body=await json(req);return send(res,await serial(async()=>{const result=await restoreTrash(body);await buildPublic();return result;}));}
   if(req.method==='GET'&&parts[1]==='bootstrap'){const collection=await projects(),drafts=(await Promise.all(collection.map(p=>readDraft(p.id)))).filter(d=>d&&collection.some(p=>p.id===d.id&&p.revision===d.revision));return send(res,{token:TOKEN,projects:collection,drafts,media:await media(),profile:await readProfile()});}
   if(req.method==='GET'&&parts[1]==='publish'&&parts[2]==='status')return send(res,await publishStatus());
   if(req.method==='GET'&&parts[1]==='publish'&&parts[2]==='job')return send(res,await publishJobStatus());
   if(req.method==='POST'&&parts[1]==='publish'&&parts.length===2)return send(res,await startPublish(await json(req),serial),202);
   if(req.method==='GET'&&parts[1]==='profile')return send(res,await readProfile());
   if(req.method==='PUT'&&parts[1]==='profile'){const raw=await json(req);return send(res,await serial(async()=>{const p=await saveProfile(raw);await buildPublic();return p;}));}
   if(req.method==='GET'&&parts[1]==='drafts'&&parts[2])return send(res,await readDraft(idSchema.parse(parts[2])));
   if(req.method==='PUT'&&parts[1]==='drafts'&&parts[2]){const raw=await json(req);if(raw.id!==idSchema.parse(parts[2]))throw new Error('Invalid project');return send(res,await serial(()=>saveDraft(raw)));}
   if(req.method==='PUT'&&parts[1]==='projects'&&parts[2]){const raw=await json(req);if(raw.id!==idSchema.parse(parts[2]))throw new Error('Invalid project');return send(res,await serial(async()=>{const p=await saveProject(raw);await buildPublic();return p;}));}
   if(req.method==='POST'&&parts[1]==='uploads')return send(res,await serial(()=>uploads(req)),201);
   if(req.method==='POST'&&parts[1]==='projects'&&parts[3]==='trash'){const id=idSchema.parse(parts[2]),body=z.object({revision:z.number().int().nonnegative()}).parse(await json(req));await serial(async()=>{await trashProject(id,body.revision);await buildPublic();});return send(res,{ok:true});}
   if(req.method==='GET'&&parts[1]==='projects'&&parts[3]==='history'){const id=idSchema.parse(parts[2]);try{const files=(await fs.readdir(path.join(HISTORY,'projects',id))).filter(f=>/^\d+-\d+\.json$/.test(f)).sort().reverse();return send(res,files.slice(0,30));}catch{return send(res,[]);}}
   if(req.method==='POST'&&parts[1]==='projects'&&parts[3]==='restore'){const id=idSchema.parse(parts[2]),body=await json(req);if(!/^\d+-\d+\.json$/.test(body.file))throw new Error('Invalid version');return send(res,await serial(async()=>{const raw=JSON.parse(await fs.readFile(path.join(HISTORY,'projects',id,body.file),'utf8')),current=(await projects()).find(p=>p.id===id);raw.revision=current?.revision??0;const p=await saveProject(raw);await buildPublic();return p;}));}
   return send(res,{error:'Not found'},404);
  }
  if(!['GET','HEAD'].includes(req.method||''))return send(res,{error:'Method not allowed'},405);
  if(parts[0]==='preview'&&parts[1]){const id=idSchema.parse(parts[1]),all=await projects(),p=(await readDraft(id))||all.find(p=>p.id===id);if(!p)return send(res,{error:'Not found'},404);res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});return res.end(renderProject(p,all,true));}
  if(parts[0]==='assets')return await file(res,ASSETS,decodeURIComponent(parts.slice(1).join('/')),req.method==='HEAD');
  if(parts[0]==='covers')return await file(res,path.join(ROOT,'apps/web/public'),decodeURIComponent(parts.join('/')),req.method==='HEAD');
  if(['/portfolio.css','/case-study.css'].includes(url.pathname))return await file(res,path.join(ROOT,'apps/web/public'),url.pathname.slice(1));
  return await file(res,path.join(ROOT,'apps/studio/dist'),parts.length?decodeURIComponent(parts.join('/')):'index.html',req.method==='HEAD');
 }catch(e:any){if(!res.headersSent)send(res,{error:e instanceof z.ZodError?e.issues.map((x:any)=>x.message).join('; '):e.message||'Unable to complete request'},e.status||400);else res.end();}
}
async function publicHandler(req:http.IncomingMessage,res:http.ServerResponse){try{if(!['127.0.0.1:4173','localhost:4173'].includes(req.headers.host||''))return send(res,{error:'Invalid host'},403);if(!['GET','HEAD'].includes(req.method||''))return send(res,{error:'Read-only website'},405);const url=new URL(req.url||'/','http://127.0.0.1:4173');if(url.pathname==='/studio.html'){res.writeHead(302,{location:'http://127.0.0.1:3001/'});return res.end();}await file(res,OUT,decodeURIComponent(url.pathname).replace(/^\//,''),req.method==='HEAD');}catch{if(!res.headersSent){res.writeHead(404);res.end('Not found');}}}
await buildStudio();await fs.copyFile(path.join(ROOT,'apps/studio/client/index.html'),path.join(ROOT,'apps/studio/dist/index.html'));await fs.copyFile(path.join(ROOT,'apps/studio/client/studio.css'),path.join(ROOT,'apps/studio/dist/studio.css'));await buildPublic();
if(!process.argv.includes('--web-only'))http.createServer(studioHandler).listen(3001,'127.0.0.1',()=>console.log('Studio: http://127.0.0.1:3001/'));
if(!process.argv.includes('--studio-only'))http.createServer(publicHandler).listen(4173,'127.0.0.1',()=>console.log('Portfolio: http://127.0.0.1:4173/'));
