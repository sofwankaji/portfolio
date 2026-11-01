import test from 'node:test';
import assert from 'node:assert/strict';
import {profileSchema,profileAssets,cleanProject} from '../packages/shared/content.ts';
import {designNodeSchema,designPageSchema,fitDesignNode} from '../packages/shared/page-design.ts';
import {seedDesignPage,renderDesignPage,formatDesignPage,DESIGN_FORMATS} from '../packages/shared/page-design-render.ts';
import {designMotionFrames,designMotionTiming} from '../packages/shared/design-motion.ts';
import {renderAbout,renderWork,renderContact} from '../packages/shared/site-render.ts';
import {deploymentHtml} from '../scripts/export-public.ts';
const profile=()=>profileSchema.parse({});
const uid=()=>{let i=0;return ()=>`node-${++i}`;};
const project=(id:string,status='published')=>cleanProject({id,slug:id,title:id,headline:id,summary:'',category:'analysis',context:'',role:'',tools:'',status,blocks:[]});

test('existing profiles retain their original pages until a design is enabled',()=>{
 const p=profile();assert.equal(p.website.designer.about.enabled,false);assert.equal(p.website.designer.work.enabled,false);
 assert.match(renderAbout(p,[]),/about-intro/);assert.doesNotMatch(renderAbout(p,[]),/class="canvas-page"/);
 for(const key of ['about','work','contact'] as const){const page=seedDesignPage(p,key,uid());assert.equal(designPageSchema.safeParse(page).success,true);assert.equal(page.enabled,false);assert.equal(p.website.designer[key].sections.length,0);}
});
test('designed pages keep text, geometry and display settings through validation and deployment paths',()=>{
 const p=profile();for(const key of ['about','work','contact'] as const){p.website.designer[key]=seedDesignPage(p,key,uid());p.website.designer[key].enabled=true;}
 const heading=p.website.designer.about.sections[0].nodes[0];heading.text='Clear <script>alert(1)</script> & thoughtful';heading.fontSize=92;heading.x=96;heading.width=900;heading.italic=true;
 const saved=profileSchema.parse(JSON.parse(JSON.stringify(p)));assert.equal(saved.website.designer.about.sections[0].nodes[0].fontSize,92);
 const html=renderAbout(saved,[project('visible'),project('secret','draft')]);assert.match(html,/Clear &lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; thoughtful/);assert.doesNotMatch(html,/<script>alert/);assert.match(html,/left:8%/);assert.match(html,/font-style:italic/);assert.match(html,/href="\/portfolio\/visible\/"/);assert.doesNotMatch(html,/portfolio\/secret/);
 const deployed=deploymentHtml(html,'/portfolio');assert.match(deployed,/href="\/portfolio\/canvas.css"/);assert.match(deployed,/href="\/portfolio\/portfolio\/visible\/"/);
 assert.match(renderWork(saved,[]),/canvas-page/);saved.website.designer.contact.hideHeader=true;saved.website.designer.contact.hideFooter=true;const contact=renderContact(saved);assert.doesNotMatch(contact,/<header|<footer/);assert.match(contact,/<main id="main">/);assert.match(contact,/<\/body><\/html>$/);
});
test('page designs reject unsafe URLs, styles, duplicate IDs and elements outside their section',()=>{
 const n={id:'safe',type:'text',x:0,y:0,width:400,height:100};
 for(const bad of [{href:'javascript:alert(1)'},{image:{src:'https://example.org/tracker.png'}},{color:'red;display:none'},{font:'Arial;evil'},{x:Infinity}])assert.equal(designNodeSchema.safeParse({...n,...bad}).success,false);
 const page=seedDesignPage(profile(),'about',uid());page.sections[0].nodes[0].x=1100;assert.equal(designPageSchema.safeParse(page).success,false);
 const duplicate=seedDesignPage(profile(),'about',uid());duplicate.sections[0].nodes[1].id=duplicate.sections[0].nodes[0].id;assert.equal(designPageSchema.safeParse(duplicate).success,false);
 assert.equal(designPageSchema.safeParse({enabled:true,sections:[]}).success,false);
});
test('pointer and keyboard geometry stay bounded even after corner resizing or section shrinking',()=>{
 const n=designNodeSchema.parse({id:'box',type:'image',x:1000,y:1000,width:800,height:1000});fitDesignNode(n,640);assert.deepEqual([n.x,n.y,n.width,n.height],[400,0,800,640]);
 for(let i=0;i<100;i++){Object.assign(n,{x:-i*20,y:i*100,width:24+i*20,height:i*40});fitDesignNode(n,800);assert.ok(n.x>=0&&n.x+n.width<=1200);assert.ok(n.y>=0&&n.y+n.height<=800);}
});
test('enabled design images join the publish plan while hidden and inactive design images stay private',()=>{
 const p=profile(),page=seedDesignPage(p,'about',uid());p.website.designer.about=page;
 const image=page.sections[0].nodes.find(n=>n.type==='image')!;image.image={src:'/assets/uploads/designed.webp',alt:'Designed'};
 assert.ok(!profileAssets(p).includes(image.image.src));page.enabled=true;assert.ok(profileAssets(p).includes(image.image.src));image.hidden=true;assert.ok(!profileAssets(p).includes(image.image.src));
});
test('work collections grow with the portfolio and never include hidden work',()=>{
 const p=profile(),page=seedDesignPage(p,'work',uid());const projects=Array.from({length:12},(_,i)=>project('work-'+i));projects[1].keepDraft=true;
 const html=renderDesignPage(page,projects);assert.equal((html.match(/class="canvas-project"/g)||[]).length,6);assert.doesNotMatch(html,/href="\/portfolio\/work-1\/"/);assert.match(html,/--section-height:/);
});
test('every selectable format works on each page and retains the current profile content',()=>{
 const p=profile();for(const key of ['about','work','contact'] as const)for(const format of DESIGN_FORMATS){const page=formatDesignPage(p,key,format.id,uid());assert.ok(designPageSchema.safeParse(page).success,`${key}/${format.id}`);assert.equal(page.enabled,false);assert.ok(page.sections.length);const html=renderDesignPage(page,[]);assert.ok(html.includes(key==='work'?'Turning complex data':key==='contact'?'Let’s make':'Helping ideas thrive'));}
});
test('button destinations, styles and motion survive saving without allowing executable configuration',()=>{
 const n=designNodeSchema.parse({id:'cta',type:'button',x:80,y:80,width:400,height:80,text:'Read the story',href:'/portfolio/selected-work/',buttonStyle:'outline',hover:'fill',newTab:true,motion:'rise',motionDuration:1.2,motionDelay:.3});
 const page=designPageSchema.parse({enabled:true,sections:[{id:'lead',height:640,background:'#ffffff',nodes:[n]}]});const html=renderDesignPage(page,[]);
 assert.match(html,/href="\/portfolio\/selected-work\/"[^>]*target="_blank" rel="noopener noreferrer"/);assert.match(html,/button-style-outline button-hover-fill/);assert.match(html,/data-canvas-motion="rise" data-motion-duration="1.2" data-motion-delay="0.3"/);
 for(const bad of [{motion:'eval(1)'},{motionDuration:99},{motionDelay:-1},{hover:'javascript'},{hoverColor:'red;bad'}])assert.equal(designNodeSchema.safeParse({...n,...bad}).success,false);
 for(const effect of ['fade','rise','left','right','zoom','stagger']){const frames=designMotionFrames(effect);assert.equal(frames[0].opacity,0);assert.equal(frames[1].opacity,1);assert.equal(frames[1].transform,'none');}assert.deepEqual(designMotionFrames('unexpected'),[]);assert.deepEqual(designMotionTiming(Infinity,-10),{duration:700,delay:0,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
});
