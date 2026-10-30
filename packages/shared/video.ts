export function isVideoUrl(value:string){
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}
}
export function youtubeEmbedUrl(value:string){
 try{
  const url=new URL(value);if(url.protocol!=='https:')return null;
  let id:string|null=null;
  if(url.hostname==='youtu.be')id=url.pathname.slice(1);
  else if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(url.hostname)){
   id=url.pathname==='/watch'?url.searchParams.get('v'):url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)\/?$/)?.[1]||null;
  }
  return id&&/^[a-zA-Z0-9_-]{11}$/.test(id)?'https://www.youtube-nocookie.com/embed/'+id:null;
 }catch{return null;}
}

export function videoPlayerSource(value:string){
 if(!isVideoUrl(value))return null;
 const embed=youtubeEmbedUrl(value);
 if(embed)return {kind:'youtube' as const,src:embed};
 if(/\.(mp4|webm)$/i.test(new URL(value).pathname))return {kind:'file' as const,src:value};
 return null;
}
