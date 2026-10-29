import fs from 'node:fs/promises';
import path from 'node:path';
import {ROOT,safeJoin,atomic} from '../server/store.ts';
import {buildPublic,OUT} from './build.ts';
import {readPublishConfig} from '../server/publish-config.ts';
export const DEPLOY=path.join(ROOT,'apps/web/deploy');
export function deploymentHtml(html:string,base:string){
 // Local Studio links are intentionally absent from the online website.
 return html.replace(/<a\b[^>]*href="(?:\/studio\/|http:\/\/127\.0\.0\.1:3001\/)"[^>]*>[\s\S]*?<\/a>/g,'')
  .replace(/\b(href|src)="\/(?!\/)([^"#]*)"/g,(_all,attr,relative)=>`${attr}="${base}/${relative}"`);
}
export async function exportPublic(){
 const config=await readPublishConfig();await buildPublic();
 const resolved=path.resolve(DEPLOY);if(resolved!==path.join(ROOT,'apps/web/deploy'))throw new Error('Invalid export folder');
 await fs.rm(resolved,{recursive:true,force:true});await fs.mkdir(resolved,{recursive:true});
 await fs.cp(OUT,DEPLOY,{recursive:true,filter:src=>path.relative(OUT,src).split(path.sep)[0]!=='studio'});
 async function rewrite(dir:string){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const file=safeJoin(dir,entry.name);if(entry.isSymbolicLink())throw new Error('Symbolic links cannot be published');if(entry.isDirectory())await rewrite(file);else if(entry.name.endsWith('.html'))await atomic(file,deploymentHtml(await fs.readFile(file,'utf8'),config.basePath));}}
 await rewrite(DEPLOY);await atomic(path.join(DEPLOY,'.nojekyll'),'');
 const commit=process.env.GITHUB_SHA;if(commit&&/^[a-f0-9]{40}$/.test(commit))await atomic(path.join(DEPLOY,'version.json'),JSON.stringify({commit,builtAt:new Date().toISOString()})+'\n');
 return {directory:DEPLOY,siteUrl:config.siteUrl};
}
if(process.argv[1]?.endsWith('export-public.ts'))console.log(await exportPublic());
