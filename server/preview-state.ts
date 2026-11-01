import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {ROOT,projects,readDraft,readProfile,readProfileDraft} from './store.ts';
import {mergePortfolioDraft} from '../packages/shared/portfolio.ts';

export async function readPreviewSnapshot(){
 const saved=await projects();
 const collection=await Promise.all(saved.map(async project=>{
  const draft=await readDraft(project.id);
  return mergePortfolioDraft(project,draft?.revision===project.revision?draft:null);
 }));
 const profile=await readProfileDraft()||await readProfile();
 const hash=createHash('sha256').update(JSON.stringify({projects:collection,profile}));
 for(const name of ['editorial.css','editorial.js','motion-math.js','canvas.css'])hash.update(await fs.readFile(path.join(ROOT,'apps/web/public',name)));
 for(const name of ['canvas-motion.js','design-motion.ts'])hash.update(await fs.readFile(path.join(ROOT,'packages/shared',name)));
 const version=hash.digest('hex');
 return {projects:collection,profile,version};
}

export const previewLiveScript=`(()=>{const version=document.currentScript.dataset.version;let checking=false;setInterval(async()=>{if(checking||document.hidden)return;checking=true;try{const r=await fetch('/__studio/version',{cache:'no-store'});if(r.ok&&(await r.json()).version!==version)location.reload();}catch{}finally{checking=false;}},1200);})();`;
