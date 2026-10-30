import {Node,mergeAttributes} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {TextStyleKit} from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import {TableKit} from '@tiptap/extension-table';
import {TaskList,TaskItem} from '@tiptap/extension-list';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Placeholder from '@tiptap/extension-placeholder';

const Callout=Node.create({name:'callout',group:'block',content:'block+',defining:true,addAttributes(){return {tone:{default:'info',parseHTML:element=>element.getAttribute('data-callout')||'info',renderHTML:attrs=>({'data-callout':attrs.tone})}};},parseHTML(){return [{tag:'aside[data-callout]'}];},renderHTML({HTMLAttributes}){return ['aside',mergeAttributes(HTMLAttributes),0];},addCommands(){return {toggleCallout:attrs=>({commands})=>commands.toggleWrap(this.name,attrs)};}});
export const richExtensions=()=>[
 StarterKit.configure({heading:{levels:[2,3,4]},link:{openOnClick:false,protocols:['http','https','mailto']}}),
 TextStyleKit,Highlight.configure({multicolor:true}),TextAlign.configure({types:['heading','paragraph']}),
 TableKit.configure({table:{resizable:true,cellMinWidth:70}}),TaskList,TaskItem.configure({nested:true}),Superscript,Subscript,Callout,
 Placeholder.configure({placeholder:({node})=>node.type.name==='heading'?'หัวข้อ…':'เขียนเนื้อหา หรือพิมพ์ / เพื่อเพิ่ม…',showOnlyCurrent:true})
];
