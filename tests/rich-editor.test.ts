import test from 'node:test';import assert from 'node:assert/strict';
import {cleanRichText,renderRichText} from '../packages/shared/rich-text.ts';
import {resizeImagePercent} from '../packages/shared/image-size.ts';
import {cleanProject,renderProject,profileSchema} from '../packages/shared/content.ts';
test('rich formatting survives saving without admitting arbitrary styles or executable attributes',()=>{
 const html=cleanRichText('<p style="text-align:center;position:fixed;background:url(https://evil.test)"><strong>Bold</strong> <em>Italic</em> <u>Underline</u><span onclick="alert(1)" style="color:rgb(53,94,201);font-size:24px;font-family:Georgia;line-height:1.8;position:fixed">Styled</span><mark data-color="#fff1b8" style="background-color:#fff1b8;color:inherit">Highlight</mark><sup>2</sup><sub>n</sub></p>');
 assert.match(html,/text-align:center/);assert.match(html,/color:#355ec9/);assert.match(html,/font-size:24px/);assert.match(html,/font-family:Georgia/);assert.match(html,/background-color:#fff1b8/);assert.match(html,/<sup>2<\/sup><sub>n<\/sub>/);assert.doesNotMatch(html,/onclick|position|url\(|evil\.test/);
 const unsafe=cleanRichText('<span style="color:rgba(0,0,0,0);font-size:999px;font-family:evil;line-height:999">Text</span><a href="javascript:alert(1)">Bad link</a>');assert.doesNotMatch(unsafe,/rgba|999|evil|javascript/);
});
test('tables, checklists and callouts keep their content and safe editing metadata',()=>{
 const html=cleanRichText('<aside data-callout="success"><p>Result</p></aside><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked><span></span></label><div><p>Done</p></div></li></ul><table><colgroup><col style="width:140px"></colgroup><tbody><tr><th colspan="2" rowspan="999" data-colwidth="140,140">Heading</th></tr><tr><td style="text-align:right">42</td></tr></tbody></table>');
 assert.match(html,/data-callout="success"/);assert.match(html,/data-checked="true"/);assert.match(html,/aria-checked="true"/);assert.match(html,/colspan="2"/);assert.match(html,/data-colwidth="140,140"/);assert.match(html,/text-align:right/);assert.doesNotMatch(html,/rowspan="999"|<input|<label|<div/);assert.match(renderRichText(html),/class="story-table-scroll"><table>/);
 assert.match(cleanRichText('<table><tr><td colspan="2" data-colwidth="0,140">Merged</td></tr></table>'),/data-colwidth="0,140"/);assert.doesNotMatch(cleanRichText('<table><tr><td data-colwidth="99999">Cell</td></tr></table>'),/data-colwidth/);
});
test('rich project content has the same colors and structure in a generated public story',()=>{
 const p=cleanProject({id:'rich-story',slug:'rich-story',title:'Rich story',headline:'Rich story',summary:'',category:'analysis',context:'',role:'',tools:'',status:'published',blocks:[{id:'rich',type:'text',html:'<h4>Detail</h4><blockquote><p>A quote</p></blockquote><p><span style="color:#b83e4b;font-size:24px">Result</span></p><table><tbody><tr><td>Cell</td></tr></tbody></table>'}]});const html=renderProject(p,[p],false,profileSchema.parse({}));assert.match(html,/<h4>Detail<\/h4>/);assert.match(html,/color:#b83e4b/);assert.match(html,/font-size:24px/);assert.match(html,/story-table-scroll/);assert.doesNotMatch(html,/127\.0\.0\.1|<iframe/);
});
test('image corner dragging respects alignment and document bounds',()=>{
 assert.equal(resizeImagePercent(60,100,1000,'right',false),70);assert.equal(resizeImagePercent(60,100,1000,'right',true),80);assert.equal(resizeImagePercent(60,-100,1000,'left',true),80);assert.equal(resizeImagePercent(60,10000,1000,'right'),100);assert.equal(resizeImagePercent(60,-10000,1000,'right'),25);assert.equal(resizeImagePercent(60,100,0,'right'),60);assert.equal(resizeImagePercent(50,500,1000,'right',false,25,75),75);
});
