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
 assert.notEqual(OUT,PREVIEW_OUT);
});
