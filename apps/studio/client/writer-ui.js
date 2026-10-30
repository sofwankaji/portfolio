export const WRITER_ICONS={bold:'<b>B</b>',italic:'<i>I</i>',underline:'<u>U</u>',strike:'<s>S</s>',quote:'<svg viewBox="0 0 24 24"><path d="M10 5H4v8h6V5ZM20 5h-6v8h6V5ZM10 13c0 4-2 6-5 6m15-6c0 4-2 6-5 6"/></svg>',link:'<svg viewBox="0 0 24 24"><path d="m10 14 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1" transform="translate(1 -1) scale(.9)"/></svg>',list:'<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.1M3 12h.1M3 18h.1"/></svg>',align:'<svg viewBox="0 0 24 24"><path d="M3 5h18M3 10h12M3 15h18M3 20h12"/></svg>',image:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/></svg>',undo:'<svg viewBox="0 0 24 24"><path d="M8 5 3 10l5 5M3 10h11a6 6 0 0 1 0 12" transform="translate(0 -3)"/></svg>',redo:'<svg viewBox="0 0 24 24"><path d="m16 5 5 5-5 5m5-5H10a6 6 0 0 0 0 12" transform="translate(0 -3)"/></svg>',plus:'<svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16"/></svg>',table:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',color:'<span class="writer-color-icon">A</span>',more:'<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>'};
const icon=body=>'<svg viewBox="0 0 24 24">'+body+'</svg>';
Object.assign(WRITER_ICONS,{
 columns:icon('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M11 4v16m4-11h3m-3 4h3m-3 4h3"/>'),
 gallery:icon('<rect x="3" y="4" width="8" height="7" rx="1"/><rect x="14" y="4" width="7" height="7" rx="1"/><rect x="3" y="14" width="8" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
 video:icon('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 8 6 4-6 4Z"/>'),
 type:icon('<path d="M4 6V4h16v2M12 4v16M8 20h8"/>'),
 code:icon('<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16"/>'),
 check:icon('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m7 12 3 3 7-7"/>'),
 ordered:icon('<path d="M9 6h12M9 12h12M9 18h12M3 4h1v4M2 12c0-3 4-2 2 0l-2 2h3M2 17h3l-2 2h2v2H2"/>'),
 callout:icon('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M12 10v6m0-9h.01"/>'),
 divider:icon('<path d="M3 12h18M7 5h10M7 19h10"/>'),
 template:icon('<path d="M6 3h9l4 4v14H6ZM14 3v5h5M9 12h7m-7 4h7"/>'),
 trash:icon('<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>'),
 rows:icon('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18"/>'),
 upload:icon('<path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/>')
});
export const wn=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
export function writerButton(label,content,run){const b=wn('button',undefined,'writer-tool');b.type='button';b.setAttribute('aria-label',label);b.title=label;if(WRITER_ICONS[content])b.innerHTML=WRITER_ICONS[content];else b.textContent=content;b.onmousedown=event=>event.preventDefault();b.onclick=event=>{event.preventDefault();run(event,b);};return b;}
export function writerPopover(trigger,label,build){const popup=wn('div',undefined,'writer-popover');popup.popover='auto';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',label);popup.append(wn('div',label,'writer-popover-title'));const close=()=>{if(popup.matches(':popover-open'))popup.hidePopover();popup.remove();};build(popup,close);document.body.append(popup);popup.showPopover();const r=trigger.getBoundingClientRect(),w=popup.getBoundingClientRect();popup.style.left=Math.max(12,Math.min(innerWidth-w.width-12,r.left))+'px';popup.style.top=Math.max(12,Math.min(innerHeight-w.height-12,r.bottom+8))+'px';popup.querySelector('[data-autofocus]')?.focus();popup.addEventListener('toggle',event=>{if(event.newState==='closed')popup.remove();});return popup;}
