export function designMotionFrames(effect:string):Keyframe[]{
 const origin:Record<string,string>={fade:'none',rise:'translateY(28px)',left:'translateX(-32px)',right:'translateX(32px)',zoom:'scale(.94)',stagger:'translateY(16px)'};
 return origin[effect]?[{opacity:0,transform:origin[effect]},{opacity:1,transform:'none'}]:[];
}
export function designMotionTiming(duration:number,delay:number){return {duration:Math.min(2500,Math.max(200,Number.isFinite(duration)?duration*1000:700)),delay:Math.min(2000,Math.max(0,Number.isFinite(delay)?delay*1000:0)),easing:'cubic-bezier(.22,1,.36,1)',fill:'both' as const};}
