import {z} from 'zod';
import type {DesignPage} from './page-design.ts';
const color=z.string().regex(/^#[a-fA-F0-9]{6}$/);
export const pageThemeSchema=z.object({
 id:z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),name:z.string().min(1).max(80),
 background:color,ink:color,muted:color,accent:color,surface:color,line:color,footer:color,footerInk:color,
 font:z.enum(['IBM Plex Sans','Manrope','Inter']).default('IBM Plex Sans'),headingFont:z.enum(['IBM Plex Sans','Manrope','Inter','Georgia']).default('IBM Plex Sans'),
 headingTracking:z.number().min(-.08).max(.04).default(-.035),headingWeight:z.enum(['300','400','500','600','700']).default('400'),
 cardRadius:z.number().min(0).max(48).default(0),imageRadius:z.number().min(0).max(48).default(0),
 cardStyle:z.enum(['flat','outline','elevated']).default('flat'),imageTreatment:z.enum(['natural','mono','warm']).default('natural'),pattern:z.enum(['none','grid','paper']).default('none'),
 buttonStyle:z.enum(['solid','outline','text','soft','gradient']).default('solid'),buttonRadius:z.number().min(0).max(100).default(0),buttonHover:z.enum(['none','lift','scale','fill','wipe']).default('fill')
}).strict();
export type PageTheme=z.infer<typeof pageThemeSchema>;
const theme=(id:string,name:string,values:Partial<PageTheme>)=>pageThemeSchema.parse({id,name,background:'#ffffff',ink:'#1c1d20',muted:'#62646b',accent:'#455ce9',surface:'#eeeff0',line:'#d5d5d7',footer:'#1c1d20',footerInk:'#ffffff',...values});
export const PAGE_THEMES:Record<string,PageTheme>={
 editorial:theme('editorial','Paper Editorial',{background:'#f8f7f3',ink:'#252521',muted:'#66655e',accent:'#333c32',surface:'#eae9e1',line:'#cfcec4',footer:'#252521',headingFont:'Georgia',imageTreatment:'mono',cardStyle:'outline',pattern:'paper',buttonStyle:'outline',buttonHover:'wipe'}),
 spotlight:theme('spotlight','Midnight Studio',{background:'#141c29',ink:'#f4f1e9',muted:'#b6bbc6',accent:'#d7b47b',surface:'#222e40',line:'#435066',footer:'#0c1320',font:'Manrope',headingFont:'Manrope',headingWeight:'500',imageRadius:16,cardRadius:16,cardStyle:'elevated',buttonRadius:80,buttonHover:'lift'}),
 gallery:theme('gallery','Blueprint',{background:'#edf3fb',ink:'#17385c',muted:'#526b85',accent:'#2556bf',surface:'#dde8f6',line:'#b4c9e0',footer:'#17385c',font:'Inter',headingFont:'Inter',headingWeight:'600',pattern:'grid',cardStyle:'outline',buttonHover:'wipe'}),
 statement:theme('statement','Terra',{background:'#f4ece3',ink:'#49352b',muted:'#796353',accent:'#9b4f37',surface:'#e8d7c7',line:'#cbb6a4',footer:'#49352b',font:'IBM Plex Sans',headingFont:'Georgia',headingTracking:-.045,pattern:'paper',imageTreatment:'warm',buttonRadius:4}),
 bento:theme('bento','Violet Studio',{background:'#f0edf8',ink:'#302347',muted:'#6e627f',accent:'#6546be',surface:'#e1daf1',line:'#c4b6db',footer:'#302347',font:'Manrope',headingFont:'Manrope',headingWeight:'600',cardRadius:28,imageRadius:28,cardStyle:'elevated',buttonStyle:'soft',buttonRadius:80,buttonHover:'scale'}),
 panorama:theme('panorama','Evergreen',{background:'#153c32',ink:'#f3f1e7',muted:'#b8cbc1',accent:'#dfcc96',surface:'#245245',line:'#4a7364',footer:'#0d2c25',headingFont:'Georgia',imageRadius:2,cardStyle:'outline',buttonStyle:'outline',buttonRadius:2,buttonHover:'wipe'}),
 profile:theme('profile','Atelier',{background:'#fbf4e8',ink:'#443426',muted:'#7d6954',accent:'#8c5a2b',surface:'#ede0ca',line:'#d2bea2',footer:'#443426',headingFont:'Georgia',imageTreatment:'warm',cardRadius:12,imageRadius:12,buttonRadius:80,buttonStyle:'outline',pattern:'paper'}),
 quiet:theme('quiet','Swiss',{background:'#fbfbf9',ink:'#242729',muted:'#626569',accent:'#b92e37',surface:'#ededeb',line:'#bfc2c3',footer:'#242729',headingFont:'IBM Plex Sans',headingWeight:'500',headingTracking:-.05,cardStyle:'outline',imageTreatment:'mono',buttonStyle:'text',buttonHover:'none'})
};
export function getPageTheme(id:string){return structuredClone(PAGE_THEMES[id]||PAGE_THEMES.editorial);}
export function foregroundFor(background:string){const rgb=[1,3,5].map(i=>parseInt(background.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4),l=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];return (l+.05)/.05>1.05/(l+.05)?'#000000':'#ffffff';}
type Palette=Pick<PageTheme,'background'|'ink'|'muted'|'accent'|'surface'|'line'|'font'> & Partial<Pick<PageTheme,'headingFont'>>;
export function applyPageTheme(page:DesignPage,raw:PageTheme,previous?:Palette){
 const t=pageThemeSchema.parse(raw);const old:Palette=previous||page.theme||{background:'#ffffff',ink:'#1c1d20',muted:'#6d6e72',accent:'#455ce9',surface:'#eeeff0',line:'#d5d5d7',font:'IBM Plex Sans'};
 const remap=(value:string,keys:('background'|'surface'|'ink'|'muted'|'accent'|'line')[])=>{const key=keys.find(key=>old[key].toLowerCase()===value.toLowerCase());return key?t[key]:value;};
 for(const section of page.sections){section.background=remap(section.background,['background','surface']);for(const n of section.nodes){
  n.color=remap(n.color,['ink','muted','accent']);n.background=remap(n.background,['background','surface','accent']);
  if(n.font==='inherit'||n.font===old.font||n.font===old.headingFont)n.font=n.type==='text'&&n.tag!=='p'?t.headingFont:t.font;
  if(n.type==='text'&&n.tag!=='p'){n.weight=t.headingWeight;n.lineHeight=1.1;}
  if(n.type==='image'&&n.radius<n.width/2)n.radius=t.imageRadius;
  if(n.type==='button'){n.buttonStyle=n.buttonStyle==='text'?'text':t.buttonStyle;n.background=t.accent;n.color=n.buttonStyle==='text'||n.buttonStyle==='outline'?t.ink:n.buttonStyle==='soft'?t.accent:foregroundFor(t.accent);n.hoverBackground=t.accent;n.hoverColor=foregroundFor(t.accent);n.hover=t.buttonHover;if(!(n.width===n.height&&n.radius>=n.width/2))n.radius=t.buttonRadius;}
 }}page.theme=t;return page;
}
export function pageThemeStyle(t:PageTheme|null|undefined){if(!t)return '';return `--site-font:'${t.font}';--canvas-heading-font:'${t.headingFont}';--canvas-heading-tracking:${t.headingTracking}em;--canvas-card-radius:${t.cardRadius}px;--canvas-line:${t.line};--canvas-surface:${t.surface};--canvas-ink:${t.ink};--canvas-muted:${t.muted};color:${t.ink};background:${t.background};font-family:'${t.font}','Noto Sans Thai',sans-serif;`;}
