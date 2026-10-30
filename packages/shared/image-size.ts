export function resizeImagePercent(start:number,delta:number,container:number,edge:'left'|'right',centered=false,min=25,max=100){
 if(!Number.isFinite(container)||container<=0)return start;
 const change=delta*(edge==='left'?-1:1)*(centered?2:1)/container*100;
 return Math.round(Math.max(min,Math.min(max,start+change)));
}
