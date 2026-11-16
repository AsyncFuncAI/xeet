import {readFile,appendFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {normalize} from './normalize.mjs';
const run=promisify(execFile);const config=JSON.parse(await readFile(process.argv[2],'utf8'));
const endpoints={x:'scrapecreators.x.v1-twitter-tweet',threads:'scrapecreators.x.v1-threads-post',facebook:'scrapecreators.x.v1-facebook-post',instagram:'scrapecreators.x.v1-instagram-post',tiktok:'scrapecreators.tiktok.video.detail'};
async function api(path,data){let r=await fetch(config.url+'/internal/'+path,{method:'POST',headers:{authorization:'Bearer '+config.key,'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Resolver service HTTP '+r.status);return r.json()}
async function tick(){let {job}=await api('claim',{});if(!job)return;let endpoint=endpoints[job.platform];if(!endpoint)throw Error('Unknown platform');try{let{stdout}=await run('treg',['call',endpoint,'--query','url='+job.url],{timeout:65000,maxBuffer:15e6});let raw=JSON.parse(stdout);let result=await normalize(job.platform,raw,job.url);await api('complete',{id:job.id,result});console.log(new Date().toISOString(),job.platform,'resolved',job.id)}catch(e){await api('complete',{id:job.id,error:'The public post could not be read. It may be private, removed, or temporarily unavailable.'});console.log(new Date().toISOString(),job.platform,'failed',job.id,String(e.message).slice(0,120))}}
let stopped=false;process.on('SIGTERM',()=>{stopped=true});while(!stopped){try{await tick()}catch(e){console.log(new Date().toISOString(),'connection',String(e.message).slice(0,100))}await new Promise(r=>setTimeout(r,4000))}
