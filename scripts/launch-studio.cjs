const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
async function ready(port){try{return (await fetch('http://127.0.0.1:'+port+'/',{signal:AbortSignal.timeout(700)})).ok;}catch{return false;}}
async function ensureServers(){
 const studio=await ready(3001),web=await ready(4173);
 if(studio&&web)return;
 fs.mkdirSync(path.join(root,'.history'),{recursive:true});
 const log=fs.openSync(path.join(root,'.history','studio-runtime.log'),'a');
 const args=[path.join(root,'node_modules','tsx','dist','cli.mjs'),path.join(root,'server','index.ts')];
 if(studio)args.push('--web-only');else if(web)args.push('--studio-only');
 const child=spawn(process.execPath,args,{cwd:root,detached:true,windowsHide:true,stdio:['ignore',log,log]});child.unref();fs.closeSync(log);
 for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,500));if(await ready(3001)&&await ready(4173))return;}
 throw new Error('Studio could not start. See C:\\resume-portfolio\\.history\\studio-runtime.log');
}
ensureServers().then(()=>{console.log('Studio ready: http://127.0.0.1:3001/');if(!process.argv.includes('--check')){const child=spawn('cmd.exe',['/c','start','','http://127.0.0.1:3001/'],{windowsHide:true,detached:true,stdio:'ignore'});child.unref();}}).catch(e=>{console.error(e.message);process.exitCode=1;});
