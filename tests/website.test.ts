import test from 'node:test';
import assert from 'node:assert/strict';
import {profileSchema,profileAssets,cleanProject,renderProject} from '../packages/shared/content.ts';
import {renderAbout,renderWork,renderContact} from '../packages/shared/site-render.ts';
import {deploymentHtml} from '../scripts/export-public.ts';
const project=()=>cleanProject({id:'sample',slug:'sample',title:'Visible work',headline:'Work',summary:'',category:'analysis',context:'',role:'',tools:'',status:'published',blocks:[]});
test('old profiles receive independent website settings and reject unsafe visual values',()=>{
 const a=profileSchema.parse({name:'Sofwan'}),b=profileSchema.parse({});a.website.services[0].title='Changed';assert.notEqual(b.website.services[0].title,'Changed');assert.equal(a.website.theme.font,'IBM Plex Sans');
 assert.throws(()=>profileSchema.parse({website:{theme:{accent:'red;position:fixed'}}}));assert.throws(()=>profileSchema.parse({website:{socials:[{label:'Bad',url:'javascript:alert(1)'}]}}));assert.throws(()=>profileSchema.parse({aboutFocalX:101}));
});
test('new website content is escaped and hidden projects stay out of About and Work',()=>{
 const p=profileSchema.parse({name:'Sofwan <Kaji>',aboutImage:{src:'/assets/portrait.webp',alt:'"A portrait"'},website:{heroTitle:'An idea <script>\nA clear answer',showServices:false,showFeature:false,contactTitle:'Say <hello>',labels:{work:'Projects <all>'}}}),visible=project(),hidden=cleanProject({...visible,id:'hidden',slug:'hidden',title:'Do not publish',status:'draft'});
 const about=renderAbout(p,[hidden,visible]),work=renderWork(p,[hidden,visible]),contact=renderContact(p);assert.match(about,/An idea &lt;script&gt;<br>A clear answer/);assert.doesNotMatch(about,/class="services |class="feature-section"|Do not publish/);assert.match(work,/Visible work/);assert.doesNotMatch(work,/Do not publish/);assert.match(contact,/Say &lt;hello&gt;/);
 for(const html of [about,work,contact,renderProject(visible,[visible],false,p)]){assert.match(html,/Projects &lt;all&gt;/);assert.doesNotMatch(html,/127\.0\.0\.1|__studio\/live/);const deployed=deploymentHtml(html,'/portfolio');assert.match(deployed,/src="\/portfolio\/editorial.js"/);assert.match(deployed,/href="\/portfolio\/contact\/"/);}
});
test('all website portrait and feature images join the published asset set',()=>{
 const p=profileSchema.parse({portrait:{src:'/assets/avatar.webp'},aboutImage:{src:'/assets/about.webp'},featureImage:{src:'/assets/feature.webp'}});assert.deepEqual(profileAssets(p),['/assets/avatar.webp','/assets/about.webp','/assets/feature.webp']);
});

test('Studio stories load styles and scripts from their own origin while links open the public preview',()=>{
 const html=renderProject(project(),[],true,profileSchema.parse({}));assert.match(html,/href="\/editorial.css"/);assert.match(html,/src="\/editorial.js"/);assert.match(html,/href="http:\/\/127.0.0.1:4173\/portfolio\/"/);assert.doesNotMatch(html,/(?:href|src)="http:\/\/127.0.0.1:4173\/editorial\.(?:css|js)"/);
});

test('Work starts with a table, offers matching image tiles and omits private work from both',()=>{
 const p=profileSchema.parse({website:{workLayout:'grid',workHeadline:'Own work headline',labels:{projectLabel:'Client'}}}),visible=cleanProject({...project(),location:'Thailand',year:'2026',coverTone:'#ddeeff'}),hidden=cleanProject({...project(),id:'private',slug:'private',title:'Hidden item',status:'draft'});const html=renderWork(p,[visible,hidden]);assert.match(html,/data-work-layout="grid"/);assert.match(html,/data-work-view="list"/);assert.match(html,/data-work-view="grid"/);assert.match(html,/Own work headline/);assert.match(html,/Thailand/);assert.match(html,/2026/);assert.match(html,/data-preview-tone="#ddeeff"/);assert.doesNotMatch(html,/Hidden item/);assert.equal((html.match(/href="\/portfolio\/sample\/"/g)||[]).length,2);
});
