import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {PAGE_THEMES,foregroundFor,applyPageTheme,getPageTheme,pageThemeSchema} from '../packages/shared/page-theme.ts';
import {profileSchema} from '../packages/shared/content.ts';
import {formatDesignPage,DESIGN_FORMATS} from '../packages/shared/page-design-render.ts';
import {renderAbout} from '../packages/shared/site-render.ts';
import {createAgentTemplate,prepareTemplateAgent} from '../server/template-agent.ts';
import {templateSchema,instantiateTemplate} from '../packages/shared/template-kit.ts';
const lum=(hex:string)=>{const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
const contrast=(a:string,b:string)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const ids=()=>{let i=0;return()=>`id-${++i}`;};
test('eight templates have distinct readable themes rather than only different coordinates',()=>{
 const signatures=new Set();const p=profileSchema.parse({});const before=JSON.stringify(p);
 for(const format of DESIGN_FORMATS){const design=formatDesignPage(p,'about',format.id,ids()),t=design.theme!;assert.ok(t);signatures.add([t.background,t.accent,t.font,t.headingFont].join(':'));assert.ok(contrast(t.background,t.ink)>=4.5,t.name+' body');assert.ok(contrast(t.footer,t.footerInk)>=4.5,t.name+' footer');assert.ok(contrast(t.accent,foregroundFor(t.accent))>=4.5,t.name+' button');assert.equal(design.sections[0].background,t.background);const heading=design.sections[0].nodes.find(n=>n.type==='text'&&n.tag==='h1')!;assert.equal(heading.font,t.headingFont);}
 assert.equal(signatures.size,8);assert.equal(JSON.stringify(p),before);
});
test('theme colors and typography reach the public header/footer and survive profile reload',()=>{
 const p=profileSchema.parse({}),design=formatDesignPage(p,'about','spotlight',ids());design.enabled=true;p.website.designer.about=design;const saved=profileSchema.parse(JSON.parse(JSON.stringify(p))),html=renderAbout(saved,[]);assert.match(html,/--page:#141c29/);assert.match(html,/--footer:#0c1320/);assert.match(html,/--site-font:'Manrope'/);assert.match(html,/data-theme="spotlight"/);assert.equal(saved.website.designer.about.theme?.cardRadius,16);assert.equal(p.website.theme.background,'#ffffff');
});
test('changing theme retains layout, links and custom content while replacing semantic styling',()=>{
 const p=profileSchema.parse({}),page=formatDesignPage(p,'contact','spotlight',ids()),geometry=page.sections.map(s=>s.nodes.map(n=>[n.id,n.x,n.y,n.width,n.height,n.href]));applyPageTheme(page,getPageTheme('statement'));assert.deepEqual(page.sections.map(s=>s.nodes.map(n=>[n.id,n.x,n.y,n.width,n.height,n.href])),geometry);assert.equal(page.sections[0].background,PAGE_THEMES.statement.background);assert.equal(page.theme?.headingFont,'Georgia');assert.equal(page.sections[0].nodes.find(n=>n.type==='button')?.href,'mailto:'+p.website.email);assert.equal(pageThemeSchema.safeParse({...PAGE_THEMES.statement,background:'red;display:none'}).success,false);
});
test('an agent job produces a compact validated themed scaffold, brief and schema in an isolated folder',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'portfolio-agent-job-'));try{const job=await prepareTemplateAgent({id:'agent-theme-study',reference:'https://example.org/portfolio',theme:'panorama',layout:'spotlight',page:'about'},root),raw=JSON.parse(await fs.readFile(job.templateFile,'utf8')),t=templateSchema.parse(raw);assert.equal(t.design.theme?.id,'panorama');assert.ok(job.templateFile.startsWith(path.join(root,'template-work')+path.sep));assert.match(await fs.readFile(job.briefFile,'utf8'),/template:import/);assert.ok(JSON.parse(await fs.readFile(job.schemaFile,'utf8')).properties);const n=raw.design.sections[0].nodes[0];assert.ok(!Object.hasOwn(n,'focalX'));const current=profileSchema.parse({website:{heroTitle:'Current owner heading'}}),design=instantiateTemplate(t,current,ids());assert.ok(design.sections.flatMap(s=>s.nodes).some(n=>n.text==='Current owner heading'));assert.match(job.agentPrompt,/AI Agent|Template/);}
 finally{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}
});
test('agent scaffolds bind contact button destinations and reject invalid jobs',()=>{
 const t=createAgentTemplate({id:'contact-theme-study',reference:'https://example.org',page:'contact',theme:'profile',layout:'editorial'}),current=profileSchema.parse({website:{email:'owner@example.org'}}),design=instantiateTemplate(t,current,ids());assert.equal(design.sections[0].nodes.find(n=>n.type==='button')?.href,'mailto:owner@example.org');assert.throws(()=>createAgentTemplate({id:'../escape',reference:'file:///private'}));
});

test('agent scaffolds keep service headings and descriptions bound to current owner content',()=>{
 const t=createAgentTemplate({id:'services-study',reference:'https://example.org',layout:'editorial'}),current=profileSchema.parse({});current.website.services[0]={title:'Custom service',description:'A current service description.'};current.website.servicesTitle='My expertise';const design=instantiateTemplate(t,current,ids()),text=design.sections.flatMap(s=>s.nodes).map(n=>n.text);assert.ok(text.includes('Custom service'));assert.ok(text.includes('A current service description.'));assert.ok(text.includes('My expertise'));
});
