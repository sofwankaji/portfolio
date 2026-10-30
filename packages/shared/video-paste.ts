import {NodeSelection,type Selection} from '@tiptap/pm/state';

export function videoPasteRange(selection:Selection){
 if(selection instanceof NodeSelection&&selection.node.type.name==='portfolioBlock'&&selection.$from.depth===0)return {from:selection.to,to:selection.to};
 if(selection.$from.depth===1&&selection.$to.depth===1&&['paragraph','heading'].includes(selection.$from.parent.type.name)&&!selection.$from.marks().some(mark=>mark.type.name==='code')){if(selection.empty&&!selection.$from.parent.textContent.trim())return {from:selection.$from.before(),to:selection.$from.after()};const after=selection.$to.after(1);return {from:after,to:after};}
 return null;
}
