import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {profileSchema,type Profile} from '../packages/shared/content.ts';
import {createWebsiteVersions} from '../server/website-versions.ts';
test('website restore keeps the effective draft as a recoverable version and advances revision',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'portfolio-version-test-'));let saved=profileSchema.parse({revision:4,name:'Original'}),draft:Profile|null=null;
 const versions=createWebsiteVersions({history:root,readSaved:async()=>structuredClone(saved),readDraft:async()=>draft?structuredClone(draft):null,save:async(raw:unknown)=>{const p=profileSchema.parse(raw);assert.equal(p.revision,saved.revision);saved={...p,revision:p.revision+1,updatedAt:new Date().toISOString()};draft=null;return structuredClone(saved);}});
 try{const first=await versions.checkpoint(saved,'Original website');draft={...structuredClone(saved),name:'Current unsaved work'};const restored=await versions.restore(first.id,draft);assert.equal(restored.profile.name,'Original');assert.equal(restored.profile.revision,5);assert.equal((await versions.get(restored.safety.id)).name,'Current unsaved work');const recovered=await versions.restore(restored.safety.id,saved);assert.equal(recovered.profile.name,'Current unsaved work');assert.equal(recovered.profile.revision,6);assert.ok((await versions.list()).some(v=>v.name==='Original website'));}
 finally{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}
});
test('stale version actions cannot overwrite newer drafts and version IDs cannot escape history',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'portfolio-version-guard-'));const saved=profileSchema.parse({revision:1}),draft={...saved,name:'Another window'};let writes=0;const versions=createWebsiteVersions({history:root,readSaved:async()=>saved,readDraft:async()=>draft,save:async()=>{writes++;return saved;}});
 try{await assert.rejects(versions.checkpoint(saved,'stale'),/อีกหน้าต่าง/);await assert.rejects(versions.restore('current',saved),/อีกหน้าต่าง/);await assert.rejects(versions.get('../../content/profile.json'));assert.equal(writes,0);assert.deepEqual(await fs.readdir(root),[]);}
 finally{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}
});
