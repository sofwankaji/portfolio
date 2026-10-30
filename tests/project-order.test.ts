import test from 'node:test';
import assert from 'node:assert/strict';
import {insertProjectAt} from '../packages/shared/project-order.ts';

test('drag insertion supports either side of a card, including the last position',()=>{
 const original=['a','b','c','d'];
 assert.deepEqual(insertProjectAt(original,'a','d',true),['b','c','d','a']);
 assert.deepEqual(insertProjectAt(original,'d','a'),['d','a','b','c']);
 assert.deepEqual(insertProjectAt(original,'a','c'),['b','a','c','d']);
 assert.deepEqual(insertProjectAt(original,'d','b',true),['a','b','d','c']);
 assert.deepEqual(original,['a','b','c','d']);
});
test('a drag cannot drop or duplicate project IDs',()=>{
 assert.deepEqual(insertProjectAt(['a','b'],'a','a'),['a','b']);
 assert.throws(()=>insertProjectAt(['a','a'],'a','a'));
 assert.throws(()=>insertProjectAt(['a','b'],'unknown','b'));
});
