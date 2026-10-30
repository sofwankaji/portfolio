import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {ROOT,ASSETS,projects,readProfile,atomic,safeJoin} from '../server/store.ts';
import {readPreviewSnapshot} from '../server/preview-state.ts';
import {profileAssets,referencedAssets,renderProject} from '../packages/shared/content.ts';
import {renderAbout,renderWork,renderContact} from '../packages/shared/site-render.ts';
export const OUT=path.join(ROOT,'apps/web/out');
export const PREVIEW_OUT=path.join(ROOT,'.history/preview-site');
const source=path.join(ROOT,'apps/web/public');
export async function buildStudio(){await build({entryPoints:[path.join(ROOT,'apps/studio/client/main.js')],outfile:path.join(ROOT,'apps/studio/dist/studio.js'),bundle:true,format:'esm',minify:false,sourcemap:false});for(const name of ['index.html','studio.css'])await fs.copyFile(path.join(ROOT,'apps/studio/client',name),path.join(ROOT,'apps/studio/dist',name));}
export async function buildPublic(preview=false){
 const output=preview?PREVIEW_OUT:OUT,snapshot=preview?await readPreviewSnapshot():null;
 const all=snapshot?.projects||await projects(),pub=all.filter(p=>p.status==='published'),profile=snapshot?.profile||await readProfile();
 await fs.mkdir(output,{recursive:true});await fs.cp(source,output,{recursive:true,filter:src=>!src.endsWith('.template.html')&&!src.endsWith('.d.ts')});
 await build({absWorkingDir:ROOT,entryPoints:[path.join(source,'editorial.js')],outfile:path.join(output,'editorial.js'),bundle:true,format:'iife',minify:false});
 const assetHash=createHash('sha256').update(await fs.readFile(path.join(output,'editorial.css'))).update(await fs.readFile(path.join(output,'editorial.js'))).digest('hex').slice(0,12);
 const live=(html:string)=>{html=html.replace(/((?:href|src)="\/editorial\.(?:css|js))"/g,`$1?v=${assetHash}"`);return preview?html.replace('</body>',`<script src="/__studio/live.js" data-version="${snapshot!.version}"></script></body>`):html;};

 await atomic(path.join(output,'studio/index.html'),'<!doctype html><html lang="th"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=http://127.0.0.1:3001/"><title>Portfolio Studio</title></head><body><a href="http://127.0.0.1:3001/">เปิด Portfolio Studio</a></body></html>');
 const about=live(renderAbout(profile,pub));await atomic(path.join(output,'index.html'),about);await atomic(path.join(output,'about/index.html'),about);
 await atomic(path.join(output,'contact/index.html'),live(renderContact(profile)));
 const work=live(renderWork(profile,pub));await atomic(path.join(output,'portfolio.html'),work);
 const wanted=new Set(pub.map(p=>p.slug)),dir=path.join(output,'portfolio');await fs.mkdir(dir,{recursive:true});
 for(const name of await fs.readdir(dir)){if(name!=='index.html'&&!wanted.has(name)){const target=safeJoin(dir,name);await fs.rm(target,{recursive:true,force:true});}}
 await atomic(path.join(dir,'index.html'),work);
 for(const p of pub)await atomic(path.join(dir,p.slug,'index.html'),live(renderProject(p,pub,false,profile)));
 const assets=new Set([...pub.flatMap(referencedAssets),...profileAssets(profile)]);
 for(const asset of assets){const relative=asset.slice('/assets/'.length),src=safeJoin(ASSETS,relative),dest=safeJoin(path.join(output,'assets'),relative);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(src,dest);}
 const uploadOut=path.join(output,'assets/uploads');
 try{for(const name of await fs.readdir(uploadOut)){if(/^[a-f0-9-]{36}\.webp$/.test(name)&&!assets.has('/assets/uploads/'+name))await fs.rm(safeJoin(uploadOut,name),{force:true});}}catch(e:any){if(e.code!=='ENOENT')throw e;}
 return {projects:pub.length,version:snapshot?.version};
}
if(process.argv[1]?.endsWith('build.ts')){await buildStudio();console.log(await buildPublic());}
