export function insertProjectAt(ids:string[],moving:string,target:string,after=false){
 if(new Set(ids).size!==ids.length||!ids.includes(moving)||!ids.includes(target))throw new Error('Invalid project order');
 if(moving===target)return [...ids];
 const next=ids.filter(id=>id!==moving);
 next.splice(next.indexOf(target)+(after?1:0),0,moving);
 return next;
}
