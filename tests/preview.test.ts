import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {buildPublic,OUT,PREVIEW_OUT} from '../scripts/build.ts';

test('live preview and the production website use separate output folders',async()=>{
 const preview=await buildPublic(true);
 assert.match(preview.version!,/^[a-f0-9]{64}$/);
 const local=await fs.readFile(path.join(PREVIEW_OUT,'index.html'),'utf8');
 assert.match(local,/src="\/__studio\/live.js"/);
 assert.ok(local.includes(`data-version="${preview.version}"`));
 await buildPublic();
 const production=await fs.readFile(path.join(OUT,'index.html'),'utf8');
 assert.doesNotMatch(production,/__studio\/live.js/);
 assert.match(production,/editorial\.css\?v=[a-f0-9]{12}/);
 assert.match(production,/editorial\.js\?v=[a-f0-9]{12}/);
 const localAsset=local.match(/editorial\.js\?v=([a-f0-9]{12})/)?.[1],productionAsset=production.match(/editorial\.js\?v=([a-f0-9]{12})/)?.[1];assert.equal(localAsset,productionAsset);
 const bundle=await fs.readFile(path.join(OUT,'editorial.js'),'utf8');assert.doesNotMatch(bundle,/import .*motion-math/);
 assert.notEqual(OUT,PREVIEW_OUT);
});
