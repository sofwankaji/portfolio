import {NodeSelection,type Selection} from '@tiptap/pm/state';

export function videoPasteRange(selection:Selection){
 if(selection instanceof NodeSelection&&selection.node.type.name==='portfolioBlock'&&selection.$from.depth===0)return {from:selection.to,to:selection.to};
 if(selection.empty&&selection.$from.depth===1&&selection.$from.parent.type.name==='paragraph'&&!selection.$from.parent.textContent.trim())return {from:selection.$from.before(),to:selection.$from.after()};
 return null;
}
