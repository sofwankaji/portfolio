import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeHTML} from 'entities';
import sanitizeHtml from 'sanitize-html';
import {cleanRichText,renderRichText} from '../packages/shared/rich-text.ts';
import {renderBlock} from '../packages/shared/content.ts';
import {normalizeVideoUrl,videoPlayerSource} from '../packages/shared/video.ts';

test('code languages and literal text survive saving and receive safe syntax colors',()=>{
 const text="SELECT name, 42 FROM customers WHERE name = '<script>alert(1)</script>';\n-- Keep & compare",escaped=text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const saved=cleanRichText('<pre><code class="language-sql evil" onclick="alert(1)">'+escaped+'</code></pre>');assert.match(saved,/class="language-sql"/);assert.doesNotMatch(saved,/onclick|evil/);
 const rendered=renderRichText(saved);assert.match(rendered,/hljs-keyword/);assert.match(rendered,/story-code-toolbar/);assert.doesNotMatch(rendered,/<script>/);
 const code=rendered.match(/<code[^>]*>([\s\S]*?)<\/code>/)![1];assert.equal(decodeHTML(sanitizeHtml(code,{allowedTags:[],allowedAttributes:{}})),text);
 assert.match(cleanRichText('<pre><code class="language-js">const n=1;</code></pre>'),/language-javascript/);
});
test('video stories show the player without a repeated title, source link or caption',()=>{
 const html=renderBlock({id:'clip',type:'video',url:'https://youtu.be/M7lc1UVf-VE',title:'Walkthrough',caption:'Do not show under the video'});assert.match(html,/<iframe/);assert.doesNotMatch(html,/class="video-source"|video-caption|Do not show under/);assert.match(html,/title="Walkthrough"/);
 assert.equal(normalizeVideoUrl('youtu.be/M7lc1UVf-VE'),'https://youtu.be/M7lc1UVf-VE');assert.equal(videoPlayerSource('www.youtube.com/watch?v=M7lc1UVf-VE')?.kind,'youtube');assert.equal(normalizeVideoUrl('javascript:alert(1)'),null);
});
