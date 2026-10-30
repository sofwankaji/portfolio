import {z} from 'zod';

const copy=(value:string,max=300)=>z.string().max(max).default(value);
const color=(value:string)=>z.string().regex(/^#[0-9a-fA-F]{6}$/).default(value);
const websiteLink=z.string().max(2000).refine(value=>/^https?:\/\//i.test(value)||/^\/(?!\/)[a-zA-Z0-9/_#?.=&%+\-.]*$/.test(value),'Use an https URL or a local website path');
export const siteSettingsSchema=z.object({
 heroTitle:copy('Helping ideas thrive\nthrough meaningful data.'),
 note:copy('Always exploring...'),
 servicesTitle:copy('I can help you with...'),
 services:z.array(z.object({title:z.string().max(120),description:z.string().max(1200)})).max(6).default(()=>[
  {title:'Data & insight',description:'From an open question to a focused analysis. I connect the details, explore the patterns and make the findings useful.'},
  {title:'Dashboards & stories',description:'Clear, considered dashboards that turn complex information into something people can understand and act on.'},
  {title:'The connected workflow',description:'Bringing analysis, reporting and automation together. Less repetitive work, more room for better questions.'}
 ]),
 featureTitle:copy('A clear question.\nA useful answer.'),
 featureBody:copy('I enjoy the space between a business question and a clear answer. Working with SQL, Power BI, Python and Excel, I bring structure to the data and care to the way it is presented.',2000),
 featureNote:copy('Curiosity is part of the process.'),featureTag:copy('SQL · Power BI · Python'),
 workTitle:copy('Selected work.'),workIntro:copy('A selection of dashboards, data stories and reporting workflows.',1000),
 footerTitle:copy('Let’s work\ntogether.'),contactTitle:copy('Let’s make\nit clear.'),contactIntro:copy('Have a question, an idea or a project in mind? I’d like to hear about it.',1000),
 email:z.string().email().default('sofwankaji95@gmail.com'),phone:z.string().max(60).default(''),
 location:copy('Based in Thailand'),availability:copy('Open to thoughtful collaborations'),
 timezone:z.enum(['Asia/Bangkok','Asia/Singapore','Europe/London','America/New_York','UTC']).default('Asia/Bangkok'),edition:copy('2026 Edition'),
 socials:z.array(z.object({label:z.string().max(80),url:websiteLink})).max(8).default(()=>[{label:'GitHub',url:'https://github.com/sofwankaji'},{label:'Resume',url:'/Sofwan-Kaji-Resume.pdf'}]),
 showServices:z.boolean().default(true),showFeature:z.boolean().default(true),showSelectedWork:z.boolean().default(true),
 theme:z.object({background:color('#ffffff'),ink:color('#1c1d20'),muted:color('#6d6e72'),accent:color('#455ce9'),footer:color('#1c1d20'),footerInk:color('#ffffff'),surface:color('#eeeff0'),line:color('#d5d5d7'),font:z.enum(['IBM Plex Sans','Manrope','Inter']).default('IBM Plex Sans')}).default(()=>({background:'#ffffff',ink:'#1c1d20',muted:'#6d6e72',accent:'#455ce9',footer:'#1c1d20',footerInk:'#ffffff',surface:'#eeeff0',line:'#d5d5d7',font:'IBM Plex Sans' as const})),
 labels:z.object({contextLabel:copy('Context'),roleLabel:copy('My role'),toolsLabel:copy('Tools'),liveProject:copy('Explore live project'),sourceCode:copy('View on GitHub'),brand:copy('Portfolio by'),work:copy('Work'),about:copy('About'),contact:copy('Contact'),allWork:copy('All work'),dashboard:copy('Dashboards'),analysis:copy('Data science'),automation:copy('Automation'),contactCta:copy('Get in touch'),moreWork:copy('More work'),nextProject:copy('Next project'),backToWork:copy('Back to work'),version:copy('Version'),localTime:copy('Local time'),socials:copy('Socials'),email:copy('Email'),location:copy('Location'),view:copy('View')}).default(()=>({contextLabel:'Context',roleLabel:'My role',toolsLabel:'Tools',liveProject:'Explore live project',sourceCode:'View on GitHub',brand:'Portfolio by',work:'Work',about:'About',contact:'Contact',allWork:'All work',dashboard:'Dashboards',analysis:'Data science',automation:'Automation',contactCta:'Get in touch',moreWork:'More work',nextProject:'Next project',backToWork:'Back to work',version:'Version',localTime:'Local time',socials:'Socials',email:'Email',location:'Location',view:'View'}))
});
