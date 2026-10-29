import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {ROOT} from './store.ts';
import type {PublishConfig} from './publish-config.ts';
export function redact(text:string){return text.replace(/(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)/g,'[redacted]').replace(/https:\/\/[^/@\s]+:[^/@\s]+@/g,'https://[redacted]@');}
export async function run(executable:'git'|'gh',args:string[],cwd=ROOT):Promise<string>{return new Promise((resolve,reject)=>{execFile(executable,args,{cwd,windowsHide:true,timeout:120000,maxBuffer:8*1024*1024,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never',GH_PROMPT_DISABLED:'1'}},(error,stdout,stderr)=>{if(error)reject(new Error(redact((stderr||stdout||error.message).trim()).slice(0,4000)));else resolve(stdout.trimEnd());});});}
export const git=(args:string[])=>run('git',args);
export const gh=(args:string[])=>run('gh',args);
export function matchesRemote(remote:string,repository:string){return remote===`https://github.com/${repository}.git`||remote===`https://github.com/${repository}`||remote===`git@github.com:${repository}.git`;}
export async function verifyRepository(config:PublishConfig){
 const top=await git(['rev-parse','--show-toplevel']);if(path.resolve(top)!==ROOT)throw new Error('Studio is outside the configured repository');
 const branch=await git(['symbolic-ref','--short','HEAD']);if(branch!==config.branch)throw new Error(`Switch to branch ${config.branch} before publishing`);
 const remote=await git(['remote','get-url','--push','origin']);if(!matchesRemote(remote,config.repository))throw new Error('Git remote does not match the approved GitHub repository');
 if(await git(['diff','--name-only','--diff-filter=U']))throw new Error('Resolve Git merge conflicts before publishing');
 for(const name of ['MERGE_HEAD','rebase-merge','rebase-apply']){const file=await git(['rev-parse','--git-path',name]);try{await fs.access(path.resolve(ROOT,file));throw new Error('Finish the active merge or rebase before publishing');}catch(e:any){if(e.code!=='ENOENT')throw e;}}
 return {branch,remote,head:await git(['rev-parse','HEAD'])};
}
export function parseDivergence(value:string){const [ahead,behind]=value.trim().split(/\s+/).map(Number);if(!Number.isInteger(ahead)||!Number.isInteger(behind))throw new Error('Cannot read Git synchronization state');return {ahead,behind};}
export async function divergence(config:PublishConfig){return parseDivergence(await git(['rev-list','--left-right','--count',`HEAD...refs/remotes/origin/${config.branch}`]));}
export async function refreshRemote(config:PublishConfig){await git(['fetch','origin',config.branch]);const counts=await divergence(config);if(counts.behind)throw new Error('GitHub has newer commits. Sync the repository before publishing; no remote history was overwritten.');return counts;}
export function checkSecret(bytes:Buffer,file:string){if(!/\.(?:json|md|ts|js|html|yml|yaml|txt|css)$/.test(file))return;const text=bytes.toString('utf8');if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{40,}/.test(text))throw new Error(`A credential-like value was detected in ${file}. Remove it before publishing.`);}
