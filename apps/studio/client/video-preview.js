import {normalizeVideoUrl,videoPlayerSource} from '../../../packages/shared/video.ts';
import {wn} from './writer-ui.js';

// Updating a title or caption keeps the existing player and its playback position.
export function mountVideoPreview(element,initial){
 const root=wn('div',undefined,'writer-video-preview');root.setAttribute('role','group');root.setAttribute('aria-label','ตัวอย่างวิดีโอ');
 const stage=wn('div',undefined,'writer-video-stage'),footer=wn('div',undefined,'writer-video-source'),link=wn('a');
 link.target='_blank';link.rel='noopener noreferrer';footer.append(link);root.append(stage,footer);element.append(root);
 let key='',player=null;
 const release=()=>{if(player?.tagName==='VIDEO'){player.pause();player.removeAttribute('src');player.load();}};
 function update({url='',title=''}){
  const normalized=normalizeVideoUrl(url),source=videoPlayerSource(url),next=source?source.kind+':'+source.src:'';
  root.hidden=!normalized;stage.hidden=!source;footer.hidden=!!source;
  if(!root.hidden){link.href=normalized;link.textContent=source?.kind==='youtube'?'เปิดใน YouTube ↗':'เปิดวิดีโอ ↗';}
  if(next!==key){
   key=next;release();stage.replaceChildren();player=null;
   if(source?.kind==='youtube'){
    player=wn('iframe');player.src=source.src;player.loading='lazy';player.referrerPolicy='strict-origin-when-cross-origin';
    player.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';player.allowFullscreen=true;
   }else if(source){player=wn('video');player.src=source.src;player.controls=true;player.playsInline=true;player.preload='metadata';}
   if(player)stage.append(player);
  }
  if(player){const label=title&&title!=='Video'?title:'ตัวอย่างวิดีโอ YouTube';if(player.tagName==='IFRAME')player.title=label;else player.setAttribute('aria-label',title||'ตัวอย่างวิดีโอ');}
 }
 update(initial);return {update,destroy(){release();root.remove();}};
}
