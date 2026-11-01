import type {DesignNode} from './page-design.ts';
export const BUTTON_ICONS={none:'',arrow:'M4 12h16m-6-6 6 6-6 6',diagonal:'M6 18 18 6M6 6h12v12',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',mail:'M3 5h18v14H3zM3 5l9 8 9-8',play:'m8 4 12 8-12 8z',chevron:'m9 5 7 7-7 7'};
export const BUTTON_PRESETS=[{id:'solid',name:'พื้นทึบ'},{id:'outline',name:'เส้นขอบ'},{id:'pill',name:'แคปซูล'},{id:'circle',name:'วงกลม'},{id:'icon',name:'ไอคอน'},{id:'text',name:'ข้อความ'},{id:'soft',name:'สีอ่อน'},{id:'gradient',name:'ไล่สี'}] as const;
export function applyButtonPreset(n:DesignNode,preset:string,accent:string,ink:string){
 Object.assign(n,{buttonStyle:'solid',buttonIcon:'none',iconOnly:false,radius:8,shadow:false,background:accent,color:'#ffffff',align:'center',height:64,hover:'lift'});
 if(preset==='outline')Object.assign(n,{buttonStyle:'outline',color:ink,buttonIcon:'diagonal'});
 if(preset==='pill')Object.assign(n,{radius:80,buttonIcon:'arrow'});
 if(preset==='circle')Object.assign(n,{width:144,height:144,radius:144,buttonIcon:'diagonal',fontSize:18});
 if(preset==='icon')Object.assign(n,{width:72,height:72,radius:72,buttonIcon:'diagonal',iconOnly:true});
 if(preset==='text')Object.assign(n,{buttonStyle:'text',color:ink,buttonIcon:'arrow',hover:'none'});
 if(preset==='soft')Object.assign(n,{buttonStyle:'soft',color:accent,buttonIcon:'mail'});
 if(preset==='gradient')Object.assign(n,{buttonStyle:'gradient',shadow:true,hover:'scale',buttonIcon:'diagonal',hoverBackground:'#8a72dc'});
 return n;
}
