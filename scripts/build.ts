import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {ROOT,ASSETS,projects,readProfile,atomic,safeJoin} from '../server/store.ts';
import {esc,referencedAssets,renderProject,renderProjectCard,renderPortrait,type Project} from '../packages/shared/content.ts';
export const OUT=path.join(ROOT,'apps/web/out');
const source=path.join(ROOT,'apps/web/public');
export async function buildStudio(){await build({entryPoints:[path.join(ROOT,'apps/studio/client/main.js')],outfile:path.join(ROOT,'apps/studio/dist/studio.js'),bundle:true,format:'esm',minify:false,sourcemap:false});for(const name of ['index.html','studio.css'])await fs.copyFile(path.join(ROOT,'apps/studio/client',name),path.join(ROOT,'apps/studio/dist',name));}
export async function buildPublic(){
 const all=await projects(),pub=all.filter(p=>p.status==='published'),profile=await readProfile();
 await fs.mkdir(OUT,{recursive:true});await fs.cp(source,OUT,{recursive:true,filter:src=>!src.endsWith('.template.html')});
 let html=await fs.readFile(path.join(source,'index.template.html'),'utf8');
 html=html.replace(/<section class="shell hero"[\s\S]*?<\/section>/,`<section class="shell hero portfolio-hero" aria-labelledby="hero-title"><div class="hero-copy"><p class="intro-label">${esc(profile.role)}</p><h1 id="hero-title">Turning data<br>into perspective.</h1><p class="hero-intro">I’m ${esc(profile.name.split(' ')[0])}. ${esc(profile.intro)}</p><a class="work-link" href="#work">Explore selected work<span class="link-line" aria-hidden="true"></span></a></div>${renderPortrait(profile)}</section>`);
 const card=renderProjectCard;
 const start=html.indexOf('<div class="project-grid">'),end=html.indexOf('\n  </section>',start);
 if(start<0||end<0)throw new Error('Gallery template markers not found');
 html=html.slice(0,start)+`<div class="project-grid">${pub.map(card).join('')}</div>`+html.slice(end);
 html=html.replace(/<dialog id="case-study"[\s\S]*?<\/dialog>/,'').replace('Six projects. Different questions.',`${pub.length} projects. Different questions.`).replaceAll('href="portfolio.css"','href="/portfolio.css"').replaceAll('src="portfolio.js"','src="/portfolio.js"').replaceAll('href="Sofwan-Kaji-Resume.pdf"','href="/Sofwan-Kaji-Resume.pdf"').replace('href="#work">Work','href="/portfolio/">Work');
 html=html.replace('<a href="#about">About</a>','<a href="#about">About</a><a href="/studio/" class="nav-studio">Studio</a>');
 html=html.replace('</head>','<link rel="stylesheet" href="/showcase.css"></head>').replace('<a href="#top">Back to top</a>','<a href="/studio/" class="studio-entry">Studio</a><a href="#top">Back to top</a>');
 await atomic(path.join(OUT,'studio/index.html'),'<!doctype html><html lang="th"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=http://127.0.0.1:3001/"><title>Portfolio Studio</title></head><body><a href="http://127.0.0.1:3001/">เปิด Portfolio Studio</a></body></html>');
 await atomic(path.join(OUT,'index.html'),html);await atomic(path.join(OUT,'portfolio.html'),html);
 await atomic(path.join(OUT,'portfolio.js'),`(()=>{const grid=document.querySelector('.project-grid');document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{let count=0;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.querySelectorAll('.project').forEach(p=>{p.hidden=b.dataset.filter!=='all'&&p.dataset.category!==b.dataset.filter;if(!p.hidden)count++});grid.classList.toggle('is-filtered',b.dataset.filter!=='all');grid.classList.toggle('is-single',count===1);document.getElementById('work-count').textContent=count+' projects / '+b.textContent});const t=document.getElementById('theme-toggle');t.onclick=()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';t.textContent=dark?'Light mode':'Dark mode';t.setAttribute('aria-pressed',String(dark))}})();`);
 const wanted=new Set(pub.map(p=>p.slug));const dir=path.join(OUT,'portfolio');await fs.mkdir(dir,{recursive:true});
 for(const name of await fs.readdir(dir)){if(name!=='index.html'&&!wanted.has(name)){const target=safeJoin(dir,name);await fs.rm(target,{recursive:true,force:true});}}
 const galleryMain=`<main id="top" class="work-index"><section class="shell work-index-intro"><h1>Selected work.</h1><p>Dashboards, data stories and reporting workflows.<br>A closer look at the thinking behind each project.</p></section><section id="work" class="shell work-section"><div class="work-heading"><p class="section-caption" id="work-count" aria-live="polite">${pub.length} projects</p><div class="filters" role="group" aria-label="Filter projects"><button data-filter="all" aria-pressed="true">All work</button><button data-filter="dashboard" aria-pressed="false">Dashboards</button><button data-filter="analysis" aria-pressed="false">Data science</button><button data-filter="automation" aria-pressed="false">Automation</button></div></div><div class="project-grid">${pub.map(card).join('')}</div></section></main>`;
 const galleryHtml=html.replace(/<main id="top">[\s\S]*?<\/main>/,galleryMain).replace('href="#top" class="wordmark"','href="/" class="wordmark"').replaceAll('href="#about"','href="/#about"').replaceAll('href="#approach"','href="/#approach"');
 await atomic(path.join(dir,'index.html'),galleryHtml);
 for(const p of pub){await atomic(path.join(dir,p.slug,'index.html'),renderProject(p,pub));for(const asset of referencedAssets(p)){const relative=asset.slice('/assets/'.length),src=safeJoin(ASSETS,relative),dest=safeJoin(path.join(OUT,'assets'),relative);await fs.mkdir(path.dirname(dest),{recursive:true});try{await fs.copyFile(src,dest);}catch(e:any){if(e.code!=='ENOENT')throw e;}}}
 if(profile.portrait){const relative=profile.portrait.src.slice('/assets/'.length),src=safeJoin(ASSETS,relative),dest=safeJoin(path.join(OUT,'assets'),relative);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(src,dest);}
 const publishedAssets=new Set([...pub.flatMap(referencedAssets),...(profile.portrait?[profile.portrait.src]:[])]);const uploadOut=path.join(OUT,'assets/uploads');
 try{for(const name of await fs.readdir(uploadOut)){if(/^[a-f0-9-]{36}\.webp$/.test(name)&&!publishedAssets.has('/assets/uploads/'+name))await fs.rm(safeJoin(uploadOut,name),{force:true});}}catch(e:any){if(e.code!=='ENOENT')throw e;}
 return {projects:pub.length};
}
if(process.argv[1]?.endsWith('build.ts')){await buildStudio();console.log(await buildPublic());}
