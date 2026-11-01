import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {profileSchema} from '../packages/shared/content.ts';
import {templateExample,templateSchema,instantiateTemplate,templateJsonSchema,templateAiBrief} from '../packages/shared/template-kit.ts';
import {createTemplateLibrary} from '../server/template-library.ts';
import {designPageSchema,designNodeSchema,fitDesignNode} from '../packages/shared/page-design.ts';
import {BUTTON_PRESETS,applyButtonPreset} from '../packages/shared/design-buttons.ts';
import {renderDesignNode} from '../packages/shared/page-design-render.ts';
test('AI template schema is exportable and binds current profile data with fresh IDs',()=>{
 const example=templateExample(),profile=profileSchema.parse({name:'Current owner',website:{heroTitle:'A current heading'}});const schema=templateJsonSchema();assert.ok(schema.properties);let i=0;const design=instantiateTemplate(example,profile,()=>`new-${++i}`);assert.equal(design.sections[0].nodes[0].text,'A current heading');assert.notEqual(design.sections[0].id,example.design.sections[0].id);assert.equal(design.enabled,false);assert.ok(designPageSchema.safeParse(design).success);assert.match(templateAiBrief('https://example.org/design','about'),/https:\/\/example.org\/design/);
});
test('template imports reject executable fields, invalid bindings and unsafe geometry',()=>{
 const t=templateExample();assert.equal(templateSchema.safeParse({...t,script:'alert(1)'}).success,false);const bad=structuredClone(t);bad.bindings.push({nodeId:'missing',path:'profile.name'});assert.equal(templateSchema.safeParse(bad).success,false);const outside=structuredClone(t);outside.design.sections[0].nodes[0].width=1200;outside.design.sections[0].nodes[0].x=100;assert.equal(templateSchema.safeParse(outside).success,false);
 assert.equal(templateSchema.safeParse({...t,id:'default'}).success,false);
});
test('custom templates are discovered from disk, previewed, and cannot overwrite existing IDs',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'portfolio-template-test-'));try{const library=createTemplateLibrary(path.join(root,'library'),path.join(root,'assets')),t=templateExample();await library.add(t);const entries=await library.list();assert.equal(entries[0].name,t.name);assert.equal(entries[0].preview.design.sections.length,1);assert.ok(entries[0].preview.bindings.every(b=>entries[0].preview.design.sections[0].nodes.some(n=>n.id===b.nodeId)));assert.equal((await library.get(t.id)).design.sections.length,2);await assert.rejects(library.add(t),/มี Template ID/);await assert.rejects(library.get('../profile'),/ID/);const large={...t,id:'large-normalized',bindings:[],design:{enabled:false,sections:Array.from({length:3},(_,section)=>({id:'section-'+section,name:'Large',height:2400,background:'#ffffff',nodes:Array.from({length:40},(_,i)=>({id:'node-'+section+'-'+i,type:'text',x:0,y:i*40,width:100,height:24,text:'x'.repeat(4000)}))}))}};await assert.rejects(library.add(large),/512 KB/);assert.equal((await library.list()).length,1);}
 finally{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}
});
test('all visual button presets retain a valid position and accessible public output',()=>{
 for(const preset of BUTTON_PRESETS){const n=designNodeSchema.parse({id:'cta',type:'button',x:1100,y:600,width:320,height:80,text:'Contact',href:'/contact/'});applyButtonPreset(n,preset.id,'#455ce9','#1c1d20');fitDesignNode(n,720);assert.ok(designNodeSchema.safeParse(n).success);const html=renderDesignNode(n,[]);assert.match(html,/href="\/contact\/"/);if(n.iconOnly)assert.match(html,/aria-label="Contact"/);if(n.buttonIcon!=='none')assert.match(html,/<svg/);assert.ok(n.x+n.width<=1200&&n.y+n.height<=720);}
 const tel=designNodeSchema.parse({id:'call',type:'button',x:0,y:0,width:300,height:64,href:'tel:+66012345678',text:'Call',buttonIcon:'mail'});assert.match(renderDesignNode(tel,[]),/tel:\+66012345678/);
 const file={...tel,href:'/Sofwan-Kaji-Resume.pdf',download:true};assert.match(renderDesignNode(file,[]),/ download>/);assert.doesNotMatch(renderDesignNode({...file,href:'https://example.org/file.pdf'},[]),/ download>/);
});
