import sanitizeHtml from 'sanitize-html';
import {normalizeColor,FONT_SIZES,CALLOUT_TONES,FONT_CHOICES} from './rich-style.ts';
const alignment=new Set(['left','center','right','justify']);
function styleFor(tag:string,raw:string){
 const result:string[]=[];
 for(const declaration of raw.split(';')){
  const split=declaration.indexOf(':');if(split<0)continue;const key=declaration.slice(0,split).trim().toLowerCase(),value=declaration.slice(split+1).trim();
  if(['span','mark'].includes(tag)&&['color','background-color'].includes(key)){const color=normalizeColor(value);if(color)result.push(key+':'+color);else if(key==='color'&&value==='inherit')result.push('color:inherit');}
  if(tag==='span'&&key==='font-size'&&/^\d{2}px$/.test(value)&&FONT_SIZES.includes(Number(value.slice(0,-2)) as any))result.push('font-size:'+value);
  if(tag==='span'&&key==='font-family'){const family=value.replace(/["']/g,'').split(',')[0].trim();if(FONT_CHOICES.some(([,font])=>font&&font.toLowerCase()===family.toLowerCase()))result.push('font-family:'+family);}
  if(['p','h2','h3','h4','blockquote','th','td'].includes(tag)&&key==='text-align'&&alignment.has(value))result.push('text-align:'+value);
  if(['span','p'].includes(tag)&&key==='line-height'&&['1.4','1.6','1.8','2'].includes(value))result.push('line-height:'+value);
  if(tag==='col'&&key==='width'&&/^\d{2,4}px$/.test(value)&&Number(value.slice(0,-2))<=1600)result.push('width:'+value);
 }
 return result.join(';');
}
const positive=(value:string,max=20)=>/^\d{1,3}$/.test(value)&&Number(value)>0&&Number(value)<=max;
export function cleanRichText(html:string){return sanitizeHtml(html,{
 allowedTags:['p','h2','h3','h4','strong','em','u','s','sub','sup','span','mark','ul','ol','li','a','blockquote','pre','code','br','hr','aside','table','thead','tbody','tfoot','tr','th','td','colgroup','col'],
 allowedAttributes:{a:['href','target','rel'],span:['style'],mark:['style','data-color'],p:['style'],h2:['style'],h3:['style'],h4:['style'],blockquote:['style'],aside:['data-callout'],ul:['data-type'],ol:['start'],li:['data-type','data-checked','role','aria-checked','aria-disabled'],th:['colspan','rowspan','data-colwidth','style'],td:['colspan','rowspan','data-colwidth','style'],col:['style']},
 allowedSchemes:['https','http','mailto'],
 transformTags:{'*':(tag,attrs)=>{
  const safe={...attrs};if(safe.style){safe.style=styleFor(tag,safe.style);if(!safe.style)delete safe.style;}
  if(tag==='a'){safe.target='_blank';safe.rel='noopener noreferrer';}
  if(tag==='aside'){if(!CALLOUT_TONES.includes(safe['data-callout'] as any))safe['data-callout']='note';}
  if(tag==='mark'){const color=normalizeColor(safe['data-color']||'');if(color)safe['data-color']=color;else delete safe['data-color'];}
  if(tag==='ul'&&safe['data-type']!=='taskList')delete safe['data-type'];
  if(tag==='ol'&&!positive(safe.start||'',999))delete safe.start;
  if(tag==='li'){if(safe['data-type']==='taskItem'){safe['data-checked']=String(safe['data-checked']==='true');safe.role='checkbox';safe['aria-checked']=safe['data-checked'];safe['aria-disabled']='true';}else for(const key of ['data-type','data-checked','role','aria-checked','aria-disabled'])delete safe[key];}
  if(tag==='td'||tag==='th'){for(const key of ['colspan','rowspan'])if(!positive(safe[key]||''))delete safe[key];if(safe['data-colwidth']&&!/^(?:0|[4-9]\d|[1-9]\d{2}|1[0-5]\d{2}|1600)(?:,(?:0|[4-9]\d|[1-9]\d{2}|1[0-5]\d{2}|1600)){0,11}$/.test(safe['data-colwidth']))delete safe['data-colwidth'];}
  return {tagName:tag,attribs:safe};
 }}
});}
export function renderRichText(html:string){return cleanRichText(html).replace(/<table\b[^>]*>/g,'<div class="story-table-scroll">$&').replace(/<\/table>/g,'$&</div>');}
