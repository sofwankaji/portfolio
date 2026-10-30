import {createLowlight} from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import powershell from 'highlight.js/lib/languages/powershell';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import cpp from 'highlight.js/lib/languages/cpp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import plaintext from 'highlight.js/lib/languages/plaintext';
import {codeLanguage} from './code-languages.ts';
const core=createLowlight({javascript,typescript,python,sql,json,bash,powershell,xml,css,yaml,markdown,java,csharp,cpp,go,rust,plaintext});
export const codeLowlight={...core,highlightAuto:(value:string)=>core.highlightAuto(value,{subset:['sql','python','javascript','typescript','json','xml','css','bash']})};
const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function highlightedCode(text:string,language:string){
 const key=codeLanguage(language),tree=key==='auto'?codeLowlight.highlightAuto(text):core.highlight(key,text);
 const serialize=(node:any):string=>node.type==='text'?escape(node.value):node.type==='element'?'<span class="'+(node.properties?.className||[]).filter((s:string)=>/^[a-zA-Z0-9_-]+$/.test(s)).join(' ')+'">'+(node.children||[]).map(serialize).join('')+'</span>':(node.children||[]).map(serialize).join('');
 return serialize(tree);
}
