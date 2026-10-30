export type Point={x:number;y:number};
export type SpringPoint=Point&{vx:number;vy:number};
export function advanceMagnet(state:SpringPoint,target:Point,seconds:number,returning?:boolean):boolean;
export function followPointer(point:Point,target:Point,seconds:number,rate:number):boolean;
