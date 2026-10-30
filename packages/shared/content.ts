import {z} from 'zod';
import {cleanRichText,renderRichText} from './rich-text.ts';
import {siteHead,siteHeader,siteFooter,arrow,buttonContents} from './site-shell.ts';
import {siteSettingsSchema} from './site-settings.ts';
import {isVideoUrl,youtubeEmbedUrl} from './video.ts';

export const assetPath=z.string().regex(/^\/assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:png|jpg|jpeg|webp)$/);
export const assetSchema=z.object({src:assetPath,alt:z.string().max(500).default(''),caption:z.string().max(1000).default('')});
export const blockSchema=z.discriminatedUnion('type',[
 z.object({id:z.string().max(80),type:z.literal('text'),html:z.string().max(100000)}),
 z.object({id:z.string().max(80),type:z.literal('image'),image:assetSchema,width:z.enum(['wide','content']).default('wide'),size:z.number().min(25).max(100).default(100),align:z.enum(['left','center','right']).default('center')}),
 z.object({id:z.string().max(80),type:z.literal('gallery'),images:z.array(assetSchema).min(1).max(16),columns:z.union([z.literal(2),z.literal(3)]).default(2)}),
 z.object({id:z.string().max(80),type:z.literal('split'),image:assetSchema,html:z.string().max(100000),side:z.enum(['left','right']).default('left'),ratio:z.number().min(25).max(75).default(50)}),
 z.object({id:z.string().max(80),type:z.literal('video'),url:z.string().max(2000).refine(v=>!v||isVideoUrl(v),'ใช้ลิงก์วิดีโอที่เริ่มด้วย https://'),title:z.string().max(200).default('Video'),caption:z.string().max(1000).default('')}),
 z.object({id:z.string().max(80),type:z.literal('quote'),quote:z.string().max(5000),attribution:z.string().max(300).default('')}),
 z.object({id:z.string().max(80),type:z.literal('divider')})
]);
const link=z.string().max(2000).refine(v=>!v||/^https?:\/\//i.test(v),'Use an http or https URL');
export const projectSchema=z.object({
 id:z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/),slug:z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/),
 title:z.string().trim().min(1).max(200),headline:z.string().trim().min(1).max(250),summary:z.string().max(2000),
 category:z.enum(['dashboard','analysis','automation']),context:z.string().max(300),role:z.string().max(300),tools:z.string().max(1000),
 repo:link.default(''),demo:link.default(''),status:z.enum(['draft','published']),keepDraft:z.boolean().default(false),cover:assetSchema.nullable().default(null),
 location:z.string().max(120).default(''),year:z.string().max(12).default(''),coverTone:z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#e8e9eb'),
 coverStyle:z.string().max(80).default(''),coverNote:z.string().max(1500).default(''),blocks:z.array(blockSchema).max(100),
 order:z.number().int().nonnegative().default(0),revision:z.number().int().nonnegative().default(0),updatedAt:z.string().default('')
});
export type Project=z.infer<typeof projectSchema>;
export type Block=z.infer<typeof blockSchema>;
export type Asset=z.infer<typeof assetSchema>;
export const profileSchema=z.object({
 name:z.string().trim().min(1).max(100).default('Sofwan Kaji'),
 role:z.string().max(150).default('Analytics & business intelligence'),
 intro:z.string().max(1000).default('I build dashboards and analytical tools that make complex information easier to understand.'),
 portrait:assetSchema.nullable().default(null),
 aboutImage:assetSchema.nullable().default(null),featureImage:assetSchema.nullable().default(null),
 aboutFocalX:z.number().min(0).max(100).default(50),aboutFocalY:z.number().min(0).max(100).default(45),
 website:siteSettingsSchema.default(()=>siteSettingsSchema.parse({})),
 focalX:z.number().min(0).max(100).default(50),focalY:z.number().min(0).max(100).default(50),
 crop:z.enum(['portrait','square']).default('portrait'),
 revision:z.number().int().nonnegative().default(0),updatedAt:z.string().default('')
});
export type Profile=z.infer<typeof profileSchema>;
export function profileAssets(p:Profile){return [p.portrait?.src,p.aboutImage?.src,p.featureImage?.src].filter((x):x is string=>!!x);}
export function renderPortrait(p:Profile){return `<figure class="profile-portrait portrait-${p.crop}">${p.portrait?`<img src="${esc(p.portrait.src)}" alt="${esc(p.portrait.alt||p.name)}" style="object-position:${p.focalX}% ${p.focalY}%" fetchpriority="high" width="640" height="800">`:`<div class="portrait-monogram" aria-label="${esc(p.name)}"><span>sk.</span><span>Analytics<br>&amp; perspective.</span></div>`}<figcaption>${esc(p.name)}<span>${esc(p.role)}</span></figcaption></figure>`;}
export function projectCover(p:Project){const fallback=p.id==='pizza-sales'?'sales':p.id==='ufund-risk'?'risk':p.id==='attach-rate'?'connections':p.category==='automation'?'workflow':p.category==='analysis'?'connections':'risk';return p.cover?.src||'/covers/'+fallback+'.svg';}
export function renderProjectCard(p:Project){return `<article class="project" data-category="${esc(p.category)}"><a class="project-link" href="/portfolio/${esc(p.slug)}/"><figure class="project-media ${p.cover?'real-cover':'illustrated-cover'}" style="--cover-tone:${p.coverTone}"><img src="${esc(projectCover(p))}" alt="${esc(p.cover?.alt||p.title)}" loading="lazy" width="900" height="650"></figure><div class="project-info"><h3>${esc(p.title)}</h3><span class="project-open" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 18 18 6M6 6h12v12"/></svg></span></div></a></article>`;}
export const cleanHtml=cleanRichText;
export function cleanProject(raw:unknown):Project{const p=projectSchema.parse(raw);if(p.keepDraft)p.status='draft';p.blocks=p.blocks.map(b=>b.type==='text'||b.type==='split'?{...b,html:cleanHtml(b.html)}:b);return p;}
export const esc=(text:unknown)=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function referencedAssets(p:Project){return [p.cover?.src,...p.blocks.flatMap(b=>b.type==='image'?[b.image.src]:b.type==='gallery'?b.images.map(i=>i.src):b.type==='split'?[b.image.src]:[])].filter((x):x is string=>!!x);}
export function renderBlock(b:Block):string{
 const figure=(a:Asset)=>`<figure><a href="${esc(a.src)}" target="_blank" rel="noopener"><img src="${esc(a.src)}" alt="${esc(a.alt)}" loading="lazy"></a>${a.caption?`<figcaption>${esc(a.caption)}</figcaption>`:''}</figure>`;
 switch(b.type){
  case'text':return `<section class="story-text">${renderRichText(b.html)}</section>`;
  case'image':return `<section class="story-image align-${b.align} ${b.width==='content'?'story-content-width':''}" style="width:${b.size}%">${figure(b.image)}</section>`;
  case'gallery':return `<section class="story-gallery columns-${b.columns}">${b.images.map(figure).join('')}</section>`;
  case'split':return `<section class="story-split image-${b.side}" style="--image-share:${b.ratio}fr;--text-share:${100-b.ratio}fr">${figure(b.image)}<div class="story-text">${renderRichText(b.html)}</div></section>`;
  case'video':{
   if(!b.url)return '';const embed=youtubeEmbedUrl(b.url),label=b.title||'Video';
   const player=embed?`<div class="video-frame"><iframe src="${embed}" title="${esc(label)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`:/\.(mp4|webm)(?:$|[?#])/i.test(b.url)?`<video controls preload="metadata" src="${esc(b.url)}" aria-label="${esc(label)}"></video>`:'';
   return `<section class="story-video">${player||`<a class="video-source" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">${esc(label)}<span aria-hidden="true"> ↗</span></a>`}</section>`;
  }
  case'quote':return `<blockquote class="story-quote"><p>${esc(b.quote)}</p>${b.attribution?`<cite>${esc(b.attribution)}</cite>`:''}</blockquote>`;
  case'divider':return '<hr class="story-divider">';
 }
}
export function renderProject(p:Project,all:Project[],preview=false,profile:Profile=profileSchema.parse({})){
 const published=all.filter(x=>x.status==='published'),at=published.findIndex(x=>x.id===p.id),next=published[(at+1)%Math.max(1,published.length)],l=profile.website.labels;
 const facts=[[l.contextLabel,p.context],[l.roleLabel,p.role],[l.toolsLabel,p.tools],[l.location,p.location],[l.yearLabel,p.year]].filter(([,value])=>value).map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('');
 const actions=[p.demo?`<a class="magnetic magnetic-button" href="${esc(p.demo)}" target="_blank" rel="noopener">${buttonContents(esc(l.liveProject))}</a>`:'',p.repo?`<a class="magnetic magnetic-button" href="${esc(p.repo)}" target="_blank" rel="noopener">${buttonContents(esc(l.sourceCode))}</a>`:''].join('');
 const html=siteHead(profile,p.title,p.summary)+(preview?'<div class="preview-banner">Local preview</div>':'')+siteHeader(profile,'work')+`<main id="main"><section class="story-intro content-shell"><a class="back-work" href="/portfolio/">${esc(l.backToWork)}</a><h1>${esc(p.title)}</h1>${p.summary?`<p class="case-lead">${esc(p.summary)}</p>`:''}${facts?`<dl class="story-facts">${facts}</dl>`:''}</section>${p.cover?`<figure class="story-cover content-shell" style="background:${p.coverTone}"><a href="${esc(p.cover.src)}" target="_blank" rel="noopener"><img src="${esc(p.cover.src)}" alt="${esc(p.cover.alt)}" fetchpriority="high"></a>${p.cover.caption?`<figcaption>${esc(p.cover.caption)}</figcaption>`:''}</figure>`:''}<div class="story-body content-shell">${p.blocks.map(renderBlock).join('')}</div><div class="story-actions content-shell">${actions}</div>${p.coverNote?`<p class="story-note content-shell">${esc(p.coverNote)}</p>`:''}${next&&next.id!==p.id?`<section class="next-work content-shell"><span>${esc(l.nextProject)}</span><a href="/portfolio/${esc(next.slug)}/">${esc(next.title)}${arrow}</a></section>`:''}</main>`+siteFooter(profile);
 return preview?html.replace(/(<a\b[^>]*href=)"\/(?!\/)(?!assets\/)([^"]*)"/g,'$1"http://127.0.0.1:4173/$2"'):html;
}
