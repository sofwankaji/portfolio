import {z} from 'zod';
import sanitizeHtml from 'sanitize-html';

export const assetPath=z.string().regex(/^\/assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:png|jpg|jpeg|webp)$/);
export const assetSchema=z.object({src:assetPath,alt:z.string().max(500).default(''),caption:z.string().max(1000).default('')});
export const blockSchema=z.discriminatedUnion('type',[
 z.object({id:z.string().max(80),type:z.literal('text'),html:z.string().max(100000)}),
 z.object({id:z.string().max(80),type:z.literal('image'),image:assetSchema,width:z.enum(['wide','content']).default('wide')}),
 z.object({id:z.string().max(80),type:z.literal('gallery'),images:z.array(assetSchema).min(1).max(16),columns:z.union([z.literal(2),z.literal(3)]).default(2)}),
 z.object({id:z.string().max(80),type:z.literal('split'),image:assetSchema,html:z.string().max(100000),side:z.enum(['left','right']).default('left')}),
 z.object({id:z.string().max(80),type:z.literal('quote'),quote:z.string().max(5000),attribution:z.string().max(300).default('')}),
 z.object({id:z.string().max(80),type:z.literal('divider')})
]);
const link=z.string().max(2000).refine(v=>!v||/^https?:\/\//i.test(v),'Use an http or https URL');
export const projectSchema=z.object({
 id:z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/),slug:z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/),
 title:z.string().trim().min(1).max(200),headline:z.string().trim().min(1).max(250),summary:z.string().max(2000),
 category:z.enum(['dashboard','analysis','automation']),context:z.string().max(300),role:z.string().max(300),tools:z.string().max(1000),
 repo:link.default(''),demo:link.default(''),status:z.enum(['draft','published']),cover:assetSchema.nullable().default(null),
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
 focalX:z.number().min(0).max(100).default(50),focalY:z.number().min(0).max(100).default(50),
 crop:z.enum(['portrait','square']).default('portrait'),
 revision:z.number().int().nonnegative().default(0),updatedAt:z.string().default('')
});
export type Profile=z.infer<typeof profileSchema>;
export function renderPortrait(p:Profile){return `<figure class="profile-portrait portrait-${p.crop}">${p.portrait?`<img src="${esc(p.portrait.src)}" alt="${esc(p.portrait.alt||p.name)}" style="object-position:${p.focalX}% ${p.focalY}%" fetchpriority="high" width="640" height="800">`:`<div class="portrait-monogram" aria-label="${esc(p.name)}"><span>sk.</span><span>Analytics<br>&amp; perspective.</span></div>`}<figcaption>${esc(p.name)}<span>${esc(p.role)}</span></figcaption></figure>`;}
export function renderProjectCard(p:Project){const fallback=p.id==='pizza-sales'?'sales':p.id==='ufund-risk'?'risk':p.id==='attach-rate'?'connections':p.category==='automation'?'workflow':p.category==='analysis'?'connections':'risk';return `<article class="project" data-category="${esc(p.category)}"><a class="project-link" href="/portfolio/${esc(p.slug)}/"><figure class="project-media ${p.cover?'real-cover':'illustrated-cover'}"><img src="${esc(p.cover?.src||'/covers/'+fallback+'.svg')}" alt="${esc(p.cover?.alt||p.title+' — illustrative cover')}" loading="lazy" width="900" height="650"></figure><div class="project-info"><h3>${esc(p.title)}</h3></div></a></article>`;}
export const cleanHtml=(html:string)=>sanitizeHtml(html,{allowedTags:['p','h2','h3','strong','em','u','s','ul','ol','li','a','blockquote','pre','code','br','hr'],allowedAttributes:{a:['href','target','rel']},allowedSchemes:['https','http','mailto'],transformTags:{a:(_tag,attrs)=>({tagName:'a',attribs:{...attrs,target:'_blank',rel:'noopener noreferrer'}})}});
export function cleanProject(raw:unknown):Project{const p=projectSchema.parse(raw);p.blocks=p.blocks.map(b=>b.type==='text'||b.type==='split'?{...b,html:cleanHtml(b.html)}:b);return p;}
export const esc=(text:unknown)=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function referencedAssets(p:Project){return [p.cover?.src,...p.blocks.flatMap(b=>b.type==='image'?[b.image.src]:b.type==='gallery'?b.images.map(i=>i.src):b.type==='split'?[b.image.src]:[])].filter((x):x is string=>!!x);}
export function renderBlock(b:Block):string{
 const figure=(a:Asset)=>`<figure><a href="${esc(a.src)}" target="_blank" rel="noopener"><img src="${esc(a.src)}" alt="${esc(a.alt)}" loading="lazy"></a>${a.caption?`<figcaption>${esc(a.caption)}</figcaption>`:''}</figure>`;
 switch(b.type){
  case'text':return `<section class="story-text">${cleanHtml(b.html)}</section>`;
  case'image':return `<section class="story-image ${b.width==='content'?'story-content-width':''}">${figure(b.image)}</section>`;
  case'gallery':return `<section class="story-gallery columns-${b.columns}">${b.images.map(figure).join('')}</section>`;
  case'split':return `<section class="story-split image-${b.side}">${figure(b.image)}<div class="story-text">${cleanHtml(b.html)}</div></section>`;
  case'quote':return `<blockquote class="story-quote"><p>${esc(b.quote)}</p>${b.attribution?`<cite>${esc(b.attribution)}</cite>`:''}</blockquote>`;
  case'divider':return '<hr class="story-divider">';
 }
}
export function renderProject(p:Project,all:Project[],preview=false){
 const published=all.filter(x=>x.status==='published'),at=published.findIndex(x=>x.id===p.id),next=published[(at+1)%Math.max(1,published.length)];
 const href=(x:Project)=>preview?`/preview/${x.id}`:`/portfolio/${x.slug}/`;
 const facts=[['Context',p.context],['My role',p.role],['Tools',p.tools]].filter(([,value])=>value).map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('');
 const actions=[p.demo?`<a href="${esc(p.demo)}" target="_blank" rel="noopener">Explore live project</a>`:'',p.repo?`<a href="${esc(p.repo)}" target="_blank" rel="noopener">View on GitHub</a>`:''].join('');
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${esc(p.summary)}"><title>${esc(p.title)} — Sofwan Kaji</title><link rel="stylesheet" href="/portfolio.css"><link rel="stylesheet" href="/case-study.css"><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;450;500;600&display=swap" rel="stylesheet"></head><body class="case-page">${preview?'<div class="preview-banner">Local preview · Includes saved drafts</div>':''}<header class="site-header"><div class="shell header-inner"><a class="wordmark" href="${preview?'http://127.0.0.1:4173/':'/'}">Sofwan Kaji<span class="brand-dot"></span></a><nav aria-label="Main navigation"><a href="${preview?'http://127.0.0.1:4173/':'/'}#work">All work</a><a href="mailto:sofwankaji95@gmail.com">Contact</a><a href="http://127.0.0.1:3001/">Studio</a></nav></div></header><main><section class="case-introduction shell"><a class="back-work" href="${preview?'http://127.0.0.1:4173/':'/'}#work">Back to selected work</a><p class="project-type">${esc(p.category==='analysis'?'Data science':p.category==='dashboard'?'Dashboards & business intelligence':'Reporting automation')}</p><h1>${esc(p.title)}</h1>${p.summary?`<p class="case-lead">${esc(p.summary)}</p>`:''}${facts?`<dl class="story-facts">${facts}</dl>`:''}</section>${p.cover?`<figure class="story-cover shell"><a href="${esc(p.cover.src)}" target="_blank" rel="noopener"><img src="${esc(p.cover.src)}" alt="${esc(p.cover.alt)}" fetchpriority="high"></a>${p.cover.caption?`<figcaption>${esc(p.cover.caption)}</figcaption>`:''}</figure>`:''}<div class="story-body shell">${p.blocks.map(renderBlock).join('')}</div><div class="story-actions shell">${actions}</div>${p.coverNote?`<p class="story-note shell">${esc(p.coverNote)}</p>`:''}</main><footer class="story-footer"><div class="shell">${next&&next.id!==p.id?`<p>Next project</p><a class="next-project" href="${href(next)}">${esc(next.title)}</a>`:''}<div class="footer-bottom"><a href="${preview?'http://127.0.0.1:4173/':'/'}#work">All projects</a><a href="mailto:sofwankaji95@gmail.com">sofwankaji95@gmail.com</a></div></div></footer></body></html>`.replaceAll('href="/#work"','href="/portfolio/"').replaceAll('href="http://127.0.0.1:4173/#work"','href="http://127.0.0.1:4173/portfolio/"');
}
