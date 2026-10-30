import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanProject,renderBlock} from '../packages/shared/content.ts';
import {mergePortfolioDraft} from '../packages/shared/portfolio.ts';
import {youtubeEmbedUrl,videoPlayerSource} from '../packages/shared/video.ts';
import {diffPublishedSnapshot} from '../server/publish.service.ts';

const sample=()=>cleanProject({id:'story',slug:'story',title:'A story',headline:'A story',summary:'',category:'dashboard',context:'',role:'',tools:'',status:'published',blocks:[],order:4,revision:2});
const image={src:'/assets/result.webp',alt:'Result',caption:'A caption'};

test('publishing merges every current autosave and keeps collection order',()=>{
 const saved=sample(),draft={...saved,title:'Edited elsewhere',order:0,blocks:[{id:'text',type:'text' as const,html:'<p>Latest writing</p>'}]};
 const next=mergePortfolioDraft(saved,draft);assert.equal(next.title,'Edited elsewhere');assert.equal(next.order,4);assert.equal(next.blocks.length,1);
 assert.throws(()=>mergePortfolioDraft(saved,{...draft,revision:1}),/ร่างเก่า/);
});
test('named new projects publish automatically; hidden and unnamed work stay local',()=>{
 const draft={...sample(),status:'draft' as const};assert.equal(mergePortfolioDraft(draft,null).status,'published');
 assert.equal(mergePortfolioDraft({...draft,keepDraft:true},null).status,'draft');
 assert.equal(mergePortfolioDraft({...draft,title:'Untitled project'},null).status,'draft');
 assert.equal(cleanProject({...sample(),keepDraft:true,status:'published'}).status,'draft');
});
test('a complete publication snapshot includes additions, edits, and removals',()=>{
 const old=new Map([['content/projects/hidden.json','a'],['content/assets/unused.webp','b'],['content/projects/edited.json','c']]);
 const plan=diffPublishedSnapshot({'content/projects/edited.json':'new','content/projects/created.json':'d'},old);
 assert.deepEqual(plan.remove,['content/assets/unused.webp','content/projects/hidden.json']);
 assert.deepEqual(plan.changes.map(c=>c.status).sort(),['added','modified','removed from public repository','removed from public repository']);
});
test('image sizes and split proportions survive validation and public rendering',()=>{
 const p=cleanProject({...sample(),blocks:[{id:'image',type:'image',image,size:65,align:'left'},{id:'split',type:'split',image,html:'<p>Alongside the result</p>',side:'right',ratio:35}]});
 assert.match(renderBlock(p.blocks[0]),/align-left.*width:65%/);assert.match(renderBlock(p.blocks[1]),/image-right.*--image-share:35fr;--text-share:65fr/);
 assert.match(renderBlock(p.blocks[1]),/Alongside the result/);assert.throws(()=>cleanProject({...sample(),blocks:[{...p.blocks[0],size:101}]}));
 assert.throws(()=>cleanProject({...sample(),blocks:[{...p.blocks[1],ratio:10}]}));
});
test('YouTube links embed only approved hosts and valid video IDs',()=>{
 const embed='https://www.youtube-nocookie.com/embed/jfKfPfyJRdk';
 for(const url of ['https://youtu.be/jfKfPfyJRdk','https://www.youtube.com/watch?v=jfKfPfyJRdk&t=20','https://youtube.com/shorts/jfKfPfyJRdk'])assert.equal(youtubeEmbedUrl(url),embed);
 assert.equal(youtubeEmbedUrl('https://youtube.com.evil.test/watch?v=jfKfPfyJRdk'),null);assert.equal(youtubeEmbedUrl('https://youtu.be/bad'),null);
 const project=cleanProject({...sample(),blocks:[{id:'video',type:'video',url:'https://youtu.be/jfKfPfyJRdk',title:'Demo <clip>',caption:'A result'}]});
 const html=renderBlock(project.blocks[0]);assert.match(html,/<iframe src="https:\/\/www.youtube-nocookie.com\/embed\/jfKfPfyJRdk"/);assert.match(html,/Demo &lt;clip&gt;/);assert.doesNotMatch(html,/A result/);
 assert.throws(()=>cleanProject({...sample(),blocks:[{id:'video',type:'video',url:'javascript:alert(1)'}]}));
});

test('video previews accept only safe YouTube players or direct video files',()=>{
 assert.deepEqual(videoPlayerSource('https://youtu.be/M7lc1UVf-VE?si=test'),{kind:'youtube',src:'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE'});
 const file='https://media.example.test/demo.MP4?token=example';assert.deepEqual(videoPlayerSource(file),{kind:'file',src:file});
 for(const value of ['javascript:alert(1)','https://user:secret@youtube.com/watch?v=M7lc1UVf-VE','https://youtube.com.evil.test/watch?v=M7lc1UVf-VE','https://example.test/?name=demo.mp4','https://youtu.be/bad',''])assert.equal(videoPlayerSource(value),null);
});
