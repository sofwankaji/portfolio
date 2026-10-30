import test from 'node:test';
import assert from 'node:assert/strict';
import {deploymentHtml} from '../scripts/export-public.ts';

test('GitHub Pages navigation preserves homepage sections and external video links',()=>{
 const html=deploymentHtml('<a href="/#about">About</a><a href="/#approach">Approach</a><a href="/portfolio/story/#result">Result</a><a href="#local">Local</a><iframe src="https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ"></iframe>','/portfolio');
 assert.match(html,/href="\/portfolio\/#about"/);
 assert.match(html,/href="\/portfolio\/#approach"/);
 assert.match(html,/href="\/portfolio\/portfolio\/story\/#result"/);
 assert.match(html,/href="#local"/);
 assert.match(html,/src="https:\/\/www.youtube-nocookie.com\/embed\/aqz-KE-bpKQ"/);
});
