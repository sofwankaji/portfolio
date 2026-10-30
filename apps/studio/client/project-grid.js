import {insertProjectAt} from '../../../packages/shared/project-order.ts';

// Body-level popovers escape card transforms and grid stacking contexts.
export function attachProjectMenu(trigger,panel){
 const owner=trigger.closest('.studio-project-card');
 panel.id='project-menu-'+owner.dataset.project;
 panel.setAttribute('popover','auto');panel.setAttribute('role','menu');
 panel.setAttribute('aria-label',trigger.getAttribute('aria-label'));
 trigger.setAttribute('aria-controls',panel.id);trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-expanded','false');
 const items=[...panel.querySelectorAll('button')];
 items.forEach(item=>{item.setAttribute('role','menuitem');item.tabIndex=-1;});
 document.body.append(panel);
 const isOpen=()=>panel.matches(':popover-open');
 function position(){
  const rect=trigger.getBoundingClientRect(),pad=12,gap=7;
  panel.style.maxHeight='';
  const height=panel.getBoundingClientRect().height,below=innerHeight-rect.bottom-gap-pad,above=rect.top-gap-pad;
  const opensAbove=below<height&&above>below;
  panel.style.maxHeight=Math.max(80,opensAbove?above:below)+'px';
  const size=panel.getBoundingClientRect();
  panel.style.left=Math.max(pad,Math.min(rect.right-size.width,innerWidth-size.width-pad))+'px';
  panel.style.top=Math.max(pad,Math.min(opensAbove?rect.top-size.height-gap:rect.bottom+gap,innerHeight-size.height-pad))+'px';
  panel.dataset.side=opensAbove?'above':'below';
 }
 function close(focus=false){if(isOpen())panel.hidePopover();trigger.setAttribute('aria-expanded','false');if(focus&&trigger.isConnected)trigger.focus();}
 function open(focus=false){
  document.querySelectorAll('.studio-card-actions:popover-open').forEach(other=>other.hidePopover());
  panel.showPopover();position();trigger.setAttribute('aria-expanded','true');
  if(focus)items.find(item=>!item.disabled)?.focus();
 }
 trigger.onclick=event=>{event.stopPropagation();if(isOpen())close();else open(event.detail===0);};
 trigger.onkeydown=event=>{if(event.key==='ArrowDown'){event.preventDefault();open(true);}};
 const toggle=()=>trigger.setAttribute('aria-expanded',String(isOpen()));
 const keys=event=>{
  if(event.key==='Escape'){event.preventDefault();close(true);return;}
  if(event.key==='Tab'){close(true);return;}
  const enabled=items.filter(item=>!item.disabled),index=enabled.indexOf(document.activeElement);
  if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
   event.preventDefault();const at=event.key==='Home'?0:event.key==='End'?enabled.length-1:(index+(event.key==='ArrowUp'?-1:1)+enabled.length)%enabled.length;
   enabled[at]?.focus();
  }
 };
 const scroll=event=>{if(!panel.contains(event.target))close();};
 panel.addEventListener('toggle',toggle);panel.addEventListener('keydown',keys);
 const resize=()=>close();window.addEventListener('resize',resize);document.addEventListener('scroll',scroll,true);
 return {close,destroy(){close();panel.remove();window.removeEventListener('resize',resize);document.removeEventListener('scroll',scroll,true);}};
}

export function mountProjectGrid(grid,{onReorder,onDragState}){
 let state=null,previewFrame=0,beginFrame=0;
 const animations=new Map();
 const cards=()=>[...grid.querySelectorAll(':scope > .studio-project-card')].filter(card=>card!==state?.source);
 function snapshot(){return new Map(cards().map(card=>[card,card.getBoundingClientRect()]));}
 function stopAnimations(){animations.forEach(animation=>animation.cancel());animations.clear();}
 function animateLayout(before){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  for(const card of cards()){
   const previous=before.get(card);if(!previous)continue;
   const rect=card.getBoundingClientRect(),x=previous.left-rect.left,y=previous.top-rect.top;
   if(Math.abs(x)<.5&&Math.abs(y)<.5)continue;
   const animation=card.animate([{transform:`translate(${x}px,${y}px)`},{transform:'translate(0,0)'}],{duration:240,easing:'cubic-bezier(.22,1,.36,1)'});
   animations.set(card,animation);animation.onfinish=()=>{if(animations.get(card)===animation)animations.delete(card);};
  }
 }
 function displayedOrder(){
  return [...grid.children].filter(node=>node!==state.source&&(node.matches('.studio-project-card')||node===state.placeholder)).map(node=>node===state.placeholder?state.id:node.dataset.project);
 }
 // Hit testing uses final layout coordinates, not the cards' moving animation frames.
 function layoutRect(node){const rect=grid.getBoundingClientRect();return {left:rect.left+node.offsetLeft,top:rect.top+node.offsetTop,width:node.offsetWidth,height:node.offsetHeight};}
 function preview(x,y){
  if(!state?.placeholder.isConnected)return;
  const slot=layoutRect(state.placeholder);
  if(x>slot.left+5&&x<slot.left+slot.width-5&&y>slot.top+5&&y<slot.top+slot.height-5)return;
  let nearest=null,distance=Infinity;
  for(const card of cards()){
   const rect=layoutRect(card),dx=Math.max(rect.left-x,0,x-rect.left-rect.width),dy=Math.max(rect.top-y,0,y-rect.top-rect.height);
   const score=dx*dx+dy*dy;
   if(score<distance){nearest={card,rect};distance=score;}
  }
  if(!nearest)return;
  const {card,rect}=nearest;
  const after=y>rect.top+rect.height||(!(y<rect.top)&&x>=rect.left+rect.width/2);
  const order=displayedOrder(),next=insertProjectAt(order,state.id,card.dataset.project,after);
  if(next.every((id,index)=>id===order[index]))return;
  const before=snapshot();stopAnimations();
  const at=next.indexOf(state.id),others=next.filter(id=>id!==state.id),reference=cards().find(card=>card.dataset.project===others[at]);
  grid.insertBefore(state.placeholder,reference||null);animateLayout(before);
 }
 function finish(commit=false,event=null){
  if(!state)return;
  cancelAnimationFrame(beginFrame);cancelAnimationFrame(previewFrame);
  const current=state,before=snapshot(),next=current.placeholder.isConnected?displayedOrder():current.original;
  stopAnimations();
  if(commit&&current.placeholder.isConnected)grid.insertBefore(current.source,current.placeholder);
  else for(const id of current.original){const card=[...grid.children].find(node=>node.dataset.project===id);if(card)grid.append(card);}
  current.placeholder.remove();current.ghost?.remove();current.surface?.remove();
  current.source.classList.remove('is-dragging');current.source.removeAttribute('aria-grabbed');
  current.source.style.cssText=current.originalStyle;grid.classList.remove('is-sorting');
  state=null;animateLayout(before);
  if(commit&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
   const rect=current.source.getBoundingClientRect();
   const x=event?event.clientX-current.offsetX-rect.left:0,y=event?event.clientY-current.offsetY-rect.top:0;
   current.source.animate([{transform:`translate(${x}px,${y}px) scale(1.025)`,boxShadow:'0 18px 35px #26354024'},{transform:'translate(0,0) scale(1)',boxShadow:'0 0 0 #26354000'}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});
  }
  setTimeout(()=>onDragState(null),0);
  if(commit&&!next.every((id,index)=>id===current.original[index]))onReorder(next);
 }
 function start(event){
  const source=event.target.closest('.studio-project-card');
  if(!source||source.closest('.studio-project-grid')!==grid||event.target.closest('.studio-card-menu')||grid.classList.contains('is-saving')){event.preventDefault();return;}
  document.querySelectorAll('.studio-card-actions:popover-open').forEach(panel=>panel.hidePopover());
  const rect=source.getBoundingClientRect(),placeholder=document.createElement('div'),ghost=source.cloneNode(true);
  placeholder.className='project-drop-slot';placeholder.style.height=rect.height+'px';placeholder.setAttribute('aria-hidden','true');
  ghost.classList.add('project-drag-ghost');ghost.setAttribute('aria-hidden','true');ghost.inert=true;ghost.style.width=rect.width+'px';ghost.style.height=rect.height+'px';document.body.append(ghost);
  const offsetX=Math.max(0,Math.min(event.clientX-rect.left,rect.width)),offsetY=Math.max(0,Math.min(event.clientY-rect.top,rect.height));
  event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',source.dataset.project);event.dataTransfer.setDragImage(ghost,offsetX,offsetY);
  state={source,placeholder,ghost,id:source.dataset.project,original:[...grid.querySelectorAll(':scope > .studio-project-card')].map(card=>card.dataset.project),originalStyle:source.style.cssText,offsetX,offsetY};
  onDragState(state.id);
  beginFrame=requestAnimationFrame(()=>{
   if(!state)return;
   const left=source.offsetLeft,top=source.offsetTop;
   source.style.cssText+=`;position:absolute;left:${left}px;top:${top}px;width:${rect.width}px;height:${rect.height}px;pointer-events:none;opacity:0;`;
   grid.insertBefore(placeholder,source);source.classList.add('is-dragging');source.setAttribute('aria-grabbed','true');grid.classList.add('is-sorting');
   ghost.remove();state.ghost=null;
   const surface=document.createElement('div');surface.className='project-drag-surface';surface.setAttribute('aria-hidden','true');surface.addEventListener('dragover',over);surface.addEventListener('drop',drop);document.body.append(surface);state.surface=surface;
  });
 }
 function insideGrid(event){const rect=grid.getBoundingClientRect();return event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;}
 function over(event){if(!state)return;event.preventDefault();event.dataTransfer.dropEffect=insideGrid(event)?'move':'none';if(!insideGrid(event))return;cancelAnimationFrame(previewFrame);previewFrame=requestAnimationFrame(()=>preview(event.clientX,event.clientY));}
 function drop(event){if(!state)return;event.preventDefault();cancelAnimationFrame(previewFrame);if(!insideGrid(event)){finish(false);return;}preview(event.clientX,event.clientY);finish(true,event);}
 const end=()=>finish(false);
 grid.addEventListener('dragstart',start);grid.addEventListener('dragover',over);grid.addEventListener('drop',drop);grid.addEventListener('dragend',end);
 return {destroy(){finish(false);stopAnimations();grid.removeEventListener('dragstart',start);grid.removeEventListener('dragover',over);grid.removeEventListener('drop',drop);grid.removeEventListener('dragend',end);}};
}
