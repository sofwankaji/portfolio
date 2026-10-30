import {NodeSelection,TextSelection,type EditorState} from '@tiptap/pm/state';
import {CellSelection,TableMap} from '@tiptap/pm/tables';
export function tableContext(state:EditorState){const selection=state.selection;if(selection instanceof NodeSelection&&selection.node.type.name==='table')return {node:selection.node,pos:selection.from};for(let depth=selection.$from.depth;depth>0;depth--)if(selection.$from.node(depth).type.name==='table')return {node:selection.$from.node(depth),pos:selection.$from.before(depth)};return null;}
export function prepareTableAction(state:EditorState,method:string){
 const context=tableContext(state);if(!context)return null;let selection=state.selection;
 if(selection instanceof NodeSelection)selection=TextSelection.near(state.doc.resolve(context.pos+4));
 if(selection instanceof CellSelection){const rows=['addRowBefore','addRowAfter','deleteRow'].includes(method),columns=['addColumnBefore','addColumnAfter','deleteColumn'].includes(method);if((rows&&selection.isColSelection())||(columns&&selection.isRowSelection()))selection=TextSelection.near(state.doc.resolve(selection.$anchorCell.pos+2));}
 const map=TableMap.get(context.node);if((method==='deleteRow'&&map.height===1)||(method==='deleteColumn'&&map.width===1))method='deleteTable';
 return {selection,method};
}
