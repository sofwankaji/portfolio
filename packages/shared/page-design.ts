import {z} from 'zod';

const id=z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
const color=z.string().regex(/^#[a-fA-F0-9]{6}$/);
const image=z.object({src:z.string().regex(/^\/assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(png|jpg|jpeg|webp)$/),alt:z.string().max(500).default('')});
export const designLink=z.string().max(2000).refine(v=>!v||/^https?:\/\//i.test(v)||/^mailto:[^\s<>"']+@[^\s<>"']+$/.test(v)||/^\/(?!\/)[a-zA-Z0-9/_#?.=&%+\-.]*$/.test(v)||/^#[a-zA-Z0-9_-]+$/.test(v),'ใช้ https://, อีเมล หรือพาธในเว็บไซต์');
export const designNodeSchema=z.object({
 id,type:z.enum(['text','image','button','shape','projects']),name:z.string().max(120).default(''),
 x:z.number().finite().min(0).max(1176),y:z.number().finite().min(0).max(2376),width:z.number().finite().min(24).max(1200),height:z.number().finite().min(24).max(2400),
 text:z.string().max(8000).default(''),image:image.nullable().default(null),href:designLink.default(''),
 newTab:z.boolean().default(false),buttonStyle:z.enum(['solid','outline','text']).default('solid'),hover:z.enum(['none','lift','scale','fill']).default('lift'),hoverBackground:color.default('#455ce9'),hoverColor:color.default('#ffffff'),borderWidth:z.number().min(0).max(8).default(1),
 motion:z.enum(['none','fade','rise','left','right','zoom','stagger']).default('none'),motionDuration:z.number().min(.2).max(2.5).default(.7),motionDelay:z.number().min(0).max(2).default(0),
 fontSize:z.number().min(12).max(180).default(24),font:z.enum(['inherit','IBM Plex Sans','Manrope','Inter','Georgia']).default('inherit'),weight:z.enum(['300','400','500','600','700']).default('400'),italic:z.boolean().default(false),align:z.enum(['left','center','right']).default('left'),tag:z.enum(['p','h1','h2','h3']).default('p'),lineHeight:z.number().min(1).max(2.5).default(1.4),
 color:color.default('#1c1d20'),background:color.default('#eeeff0'),radius:z.number().min(0).max(600).default(0),opacity:z.number().min(.05).max(1).default(1),
 fit:z.enum(['cover','contain']).default('cover'),focalX:z.number().min(0).max(100).default(50),focalY:z.number().min(0).max(100).default(50),
 locked:z.boolean().default(false),hidden:z.boolean().default(false),mobileHidden:z.boolean().default(false),
 columns:z.number().int().min(1).max(3).default(2),limit:z.number().int().min(1).max(30).default(6)
});
export const designSectionSchema=z.object({id,name:z.string().max(120).default('Section'),height:z.number().min(240).max(2400).default(640),background:color.default('#ffffff'),nodes:z.array(designNodeSchema).max(40)}).superRefine((s,ctx)=>{for(const n of s.nodes)if(n.x+n.width>1200.01||n.y+n.height>s.height+.01)ctx.addIssue({code:'custom',message:'องค์ประกอบต้องอยู่ภายในส่วนของหน้า'});});
export const designPageSchema=z.object({enabled:z.boolean().default(false),hideHeader:z.boolean().default(false),hideFooter:z.boolean().default(false),sections:z.array(designSectionSchema).max(16).default([])}).superRefine((p,ctx)=>{const ids=p.sections.flatMap(s=>[s.id,...s.nodes.map(n=>n.id)]);if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',message:'ID ซ้ำในหน้า'});if(p.enabled&&!p.sections.length)ctx.addIssue({code:'custom',message:'เพิ่มส่วนของหน้าก่อนเปิดใช้'});if(p.sections.reduce((sum,s)=>sum+s.nodes.length,0)>200)ctx.addIssue({code:'custom',message:'ใช้ได้สูงสุด 200 องค์ประกอบต่อหน้า'});});
const blank=()=>designPageSchema.parse({});
export const pageDesignSchema=z.object({about:designPageSchema.default(blank),work:designPageSchema.default(blank),contact:designPageSchema.default(blank)}).default(()=>({about:blank(),work:blank(),contact:blank()}));
export type DesignNode=z.infer<typeof designNodeSchema>;
export type DesignSection=z.infer<typeof designSectionSchema>;
export type DesignPage=z.infer<typeof designPageSchema>;
export type DesignPageKey='about'|'work'|'contact';
export const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
// Shared by pointer, keyboard and numeric controls; a resize cannot leave the page.
export function fitDesignNode(n:DesignNode,sectionHeight:number){n.width=clamp(Math.round(n.width),24,1200);n.height=clamp(Math.round(n.height),24,sectionHeight);n.x=clamp(Math.round(n.x),0,1200-n.width);n.y=clamp(Math.round(n.y),0,sectionHeight-n.height);return n;}
export function designAssets(pages:z.infer<typeof pageDesignSchema>){return Object.values(pages).filter(p=>p.enabled).flatMap(p=>p.sections.flatMap(s=>s.nodes.filter(n=>!n.hidden&&n.type==='image').flatMap(n=>n.image?[n.image.src]:[])));}
