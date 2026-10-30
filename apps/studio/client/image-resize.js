import {resizeImagePercent} from '../../../packages/shared/image-size.ts';
import {wn} from './writer-ui.js';

export function imageCornerHandles({media,container,getValue,preview,commit,align=()=> 'center',min=25,max=100,onDrag=()=>{}}){
 const cleanups=[];
 for(const edge of ['left','right']){
  const handle=wn('button',undefined,'writer-image-handle handle-'+edge);handle.type='button';handle.setAttribute('role','slider');handle.setAttribute('aria-label',edge==='right'?'ปรับขนาดรูปจากมุมขวา':'ปรับขนาดรูปจากมุมซ้าย');handle.setAttribute('aria-valuemin',min);handle.setAttribute('aria-valuemax',max);handle.setAttribute('aria-valuenow',getValue());handle.setAttribute('aria-orientation','horizontal');handle.title='ลากมุมเพื่อปรับขนาด · ดับเบิลคลิกเพื่อเต็มกว้าง';media.append(handle);
  let drag=null,frame=0,disposed=false;
  const show=value=>{preview(value);media.querySelectorAll('.writer-image-handle').forEach(h=>h.setAttribute('aria-valuenow',value));};
  const end=(event,cancel=false)=>{if(!drag)return;const current=drag;drag=null;cancelAnimationFrame(frame);frame=0;if(!disposed){show(cancel?current.start:current.value);if(!cancel)commit(current.value);}onDrag(false);media.classList.remove('is-resizing');if(handle.hasPointerCapture(current.id))handle.releasePointerCapture(current.id);};
  handle.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();handle.focus({preventScroll:true});drag={id:event.pointerId,x:event.clientX,start:getValue(),value:getValue(),width:container.getBoundingClientRect().width};handle.setPointerCapture(event.pointerId);onDrag(true);media.classList.add('is-resizing');};
  handle.onpointermove=event=>{if(!drag)return;event.preventDefault();drag.value=resizeImagePercent(drag.start,event.clientX-drag.x,drag.width,edge,align()==='center',min,max);if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(drag)show(drag.value);});};
  handle.onpointerup=event=>end(event);handle.onpointercancel=event=>end(event,true);handle.onlostpointercapture=event=>{if(drag)end(event,true);};
  handle.ondblclick=event=>{event.preventDefault();onDrag(true);show(max);commit(max);onDrag(false);};
  handle.onkeydown=event=>{if(event.key==='Escape'&&drag){event.preventDefault();end(event,true);return;}let value=getValue();if(event.key==='ArrowLeft')value-=event.shiftKey?1:5;else if(event.key==='ArrowRight')value+=event.shiftKey?1:5;else if(event.key==='Home')value=min;else if(event.key==='End'||event.key==='Enter')value=max;else return;event.preventDefault();event.stopPropagation();value=Math.max(min,Math.min(max,value));onDrag(true);show(value);commit(value);onDrag(false);};
  cleanups.push(()=>{disposed=true;if(drag)end(null,true);cancelAnimationFrame(frame);});
 }
 return ()=>cleanups.forEach(fn=>fn());
}
export function columnHandle({layout,getValue,side,preview,commit,onDrag=()=>{}}){
 const handle=wn('button',undefined,'writer-column-handle');handle.type='button';handle.setAttribute('role','slider');handle.setAttribute('aria-label','ปรับสัดส่วนรูปกับข้อความ');handle.setAttribute('aria-valuemin','25');handle.setAttribute('aria-valuemax','75');handle.setAttribute('aria-valuenow',getValue());handle.title='ลากเพื่อปรับสัดส่วน';layout.append(handle);let drag=null;
 const show=value=>{preview(value);handle.setAttribute('aria-valuenow',value);};
 const end=(cancel=false)=>{if(!drag)return;const d=drag;drag=null;show(cancel?d.start:d.value);if(!cancel)commit(d.value);onDrag(false);if(handle.hasPointerCapture(d.id))handle.releasePointerCapture(d.id);};
 handle.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();handle.focus({preventScroll:true});drag={id:event.pointerId,start:getValue(),value:getValue()};onDrag(true);handle.setPointerCapture(event.pointerId);};
 handle.onpointermove=event=>{if(!drag)return;const rect=layout.getBoundingClientRect(),position=(event.clientX-rect.left)/rect.width*100;drag.value=Math.round(Math.max(25,Math.min(75,side()==='right'?100-position:position)));show(drag.value);};handle.onpointerup=()=>end();handle.onpointercancel=()=>end(true);handle.onlostpointercapture=()=>end(true);
 handle.onkeydown=event=>{let value=getValue();if(event.key==='ArrowLeft')value-=5;else if(event.key==='ArrowRight')value+=5;else if(event.key==='Home')value=25;else if(event.key==='End')value=75;else return;event.preventDefault();onDrag(true);value=Math.max(25,Math.min(75,value));show(value);commit(value);onDrag(false);};
 return ()=>{drag=null;};
}
