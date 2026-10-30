import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import {codeLowlight} from '../../../packages/shared/code-highlight.ts';
import {CODE_LANGUAGES,codeLanguage} from '../../../packages/shared/code-languages.ts';
import {wn,writerButton} from './writer-ui.js';

export const WriterCodeBlock=CodeBlockLowlight.extend({
 priority:200,
 addKeyboardShortcuts(){return {...(this.parent?.()||{}),'Mod-a':()=>{const selection=this.editor.state.selection,$from=selection.$from;if($from.parent.type.name!==this.name)return false;if(!selection.empty&&selection.from===$from.start()&&selection.to===$from.end())return false;this.editor.commands.setTextSelection({from:$from.start(),to:$from.end()});return true;}};},
 addNodeView(){return ({node,editor,getPos})=>{
  let current=node,timer=null;
  const dom=wn('div',undefined,'writer-code-block'),header=wn('div',undefined,'writer-code-toolbar');header.contentEditable='false';
  const language=wn('select');language.setAttribute('aria-label','ภาษาโค้ด');for(const [value,label]of CODE_LANGUAGES){const option=wn('option',value==='auto'?'อัตโนมัติ':label);option.value=value;language.append(option);}language.value=codeLanguage(node.attrs.language);
  language.onchange=()=>{const pos=getPos();if(typeof pos==='number')editor.view.dispatch(editor.state.tr.setNodeMarkup(pos,undefined,{...current.attrs,language:language.value}));};
  const copy=writerButton('คัดลอกโค้ด','คัดลอก',async()=>{try{await navigator.clipboard.writeText(current.textContent);copy.textContent='คัดลอกแล้ว';}catch{copy.textContent='คัดลอกไม่สำเร็จ';}clearTimeout(timer);timer=setTimeout(()=>copy.textContent='คัดลอก',1800);});copy.setAttribute('aria-live','polite');header.append(language,copy);
  const pre=wn('pre'),code=wn('code');code.className='hljs';code.setAttribute('aria-label','โค้ด');code.spellcheck=false;pre.append(code);dom.append(header,pre);
  return {dom,contentDOM:code,stopEvent:event=>header.contains(event.target),ignoreMutation:mutation=>mutation.type!=='selection'&&!code.contains(mutation.target),update(next){if(next.type!==current.type)return false;current=next;language.value=codeLanguage(next.attrs.language);return true;},destroy(){clearTimeout(timer);}};
 };}
}).configure({lowlight:codeLowlight,defaultLanguage:'auto',enableTabIndentation:true,tabSize:2});
