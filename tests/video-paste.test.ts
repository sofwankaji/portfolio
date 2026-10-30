import test from 'node:test';
import assert from 'node:assert/strict';
import {Schema} from '@tiptap/pm/model';
import {NodeSelection,TextSelection} from '@tiptap/pm/state';
import {videoPasteRange} from '../packages/shared/video-paste.ts';

test('pasting video inserts after selected media and preserves existing text',()=>{
 const schema=new Schema({nodes:{doc:{content:'block+'},paragraph:{group:'block',content:'text*'},text:{group:'inline'},portfolioBlock:{group:'block',atom:true},blockquote:{group:'block',content:'block+'}}});
 const paragraph=schema.nodes.paragraph.create(null,schema.text('Existing text')),image=schema.nodes.portfolioBlock.create(),empty=schema.nodes.paragraph.create(),doc=schema.nodes.doc.create(null,[paragraph,image,empty]);
 const selected=NodeSelection.create(doc,paragraph.nodeSize),afterImage=paragraph.nodeSize+image.nodeSize;
 assert.deepEqual(videoPasteRange(selected),{from:afterImage,to:afterImage});
 const range=videoPasteRange(TextSelection.create(doc,afterImage+1));assert.deepEqual(range,{from:afterImage,to:afterImage+empty.nodeSize});
 assert.equal(videoPasteRange(TextSelection.create(doc,2)),null);assert.equal(videoPasteRange(TextSelection.create(doc,1,5)),null);
 const nested=schema.nodes.doc.create(null,schema.nodes.blockquote.create(null,empty));assert.equal(videoPasteRange(TextSelection.create(nested,2)),null);
});
