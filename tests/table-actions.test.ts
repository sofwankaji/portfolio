import test from 'node:test';
import assert from 'node:assert/strict';
import {Schema} from '@tiptap/pm/model';
import {EditorState} from '@tiptap/pm/state';
import {tableNodes,CellSelection,deleteColumn,deleteRow,deleteTable} from '@tiptap/pm/tables';
import {prepareTableAction,tableContext} from '../packages/shared/table-actions.ts';

test('row actions after column selection target a row and deleting the final row removes the table',()=>{
 const schema=new Schema({nodes:{doc:{content:'block+'},paragraph:{group:'block',content:'text*'},text:{group:'inline'},...tableNodes({tableGroup:'block',cellContent:'paragraph+',cellAttributes:{}})}}),p=(text='')=>schema.nodes.paragraph.create(null,text?schema.text(text):undefined),table=schema.nodes.table.create(null,Array.from({length:3},(_,r)=>schema.nodes.table_row.create(null,Array.from({length:3},(_,c)=>schema.nodes.table_cell.create(null,p(r+','+c))))));
 const intro=p('Keep introduction'),doc=schema.nodes.doc.create(null,[intro,table,p('Keep ending')]);let state=EditorState.create({doc,selection:CellSelection.colSelection(doc.resolve(intro.nodeSize+2))});
 const run=(method:string)=>{const prepared=prepareTableAction(state,method)!;state=state.apply(state.tr.setSelection(prepared.selection));const command={deleteColumn,deleteRow,deleteTable}[prepared.method as 'deleteColumn'|'deleteRow'|'deleteTable'];assert.equal(command(state,tr=>state=state.apply(tr)),true);};
 run('deleteColumn');assert.equal(tableContext(state)!.node.firstChild!.childCount,2);run('deleteRow');assert.equal(tableContext(state)!.node.childCount,2);run('deleteRow');assert.equal(tableContext(state)!.node.childCount,1);run('deleteRow');assert.equal(state.doc.childCount,2);assert.equal(state.doc.textContent,'Keep introductionKeep ending');
});
