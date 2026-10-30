/** A damped return with a separate, quieter response while following a pointer. */
export function advanceMagnet(state,target,seconds,returning=false){
 const dt=Math.min(.032,Math.max(0,seconds));
 for(const axis of ['x','y']){const velocity=axis==='x'?'vx':'vy';if(returning){state[velocity]+=((target[axis]-state[axis])*130-state[velocity]*10)*dt;state[axis]+=state[velocity]*dt;}else{state[axis]+=(target[axis]-state[axis])*(1-Math.exp(-11*dt));state[velocity]=0;}}
 return Math.abs(state.x-target.x)+Math.abs(state.y-target.y)+Math.abs(state.vx)+Math.abs(state.vy)>.025;
}
export function followPointer(point,target,seconds,rate){const blend=1-Math.exp(-rate*Math.min(.05,Math.max(0,seconds)));point.x+=(target.x-point.x)*blend;point.y+=(target.y-point.y)*blend;return Math.abs(point.x-target.x)+Math.abs(point.y-target.y)>.1;}
