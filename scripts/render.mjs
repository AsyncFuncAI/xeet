import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {normalize} from '../bridge/normalize.mjs';
import init,{call} from '../deploy/web/wasm/teet_wasm.js';
const[input,output='post.png',theme='light',width='600']=process.argv.slice(2);
if(!input){console.error('Usage: node scripts/render.mjs <post.json | public-post-url> [output.png] [light|dark] [width]');process.exit(1)}
let post;
if(input.startsWith('https://')){let host=new URL(input).hostname;let platform=/threads\.(com|net)$/.test(host)?'threads':/instagram\.com$/.test(host)?'instagram':/facebook\.com$|fb\.watch$/.test(host)?'facebook':/tiktok\.com$/.test(host)?'tiktok':/^(www\.)?(x|twitter)\.com$/.test(host)?'x':null;const endpoint={threads:'scrapecreators.x.v1-threads-post',x:'scrapecreators.x.v1-twitter-tweet',facebook:'scrapecreators.x.v1-facebook-post',instagram:'scrapecreators.x.v1-instagram-post',tiktok:'scrapecreators.tiktok.video.detail'}[platform];if(!endpoint)throw Error('Unsupported post URL');let raw=JSON.parse(execFileSync('treg',['call',endpoint,'--query','url='+input],{timeout:65000,maxBuffer:15e6,encoding:'utf8'}));post=(await normalize(platform,raw,input)).post;}else{let raw=JSON.parse(await readFile(input,'utf8'));post=raw.post||raw;}
await init({module_or_path:await readFile(new URL('../deploy/web/wasm/teet_wasm_bg.wasm',import.meta.url))});
let a=call(1,JSON.stringify({op:'render',post,options:{width:Number(width),theme,dpr:2}}));let v=new DataView(a.buffer,a.byteOffset,a.byteLength),n=v.getUint32(1,true);if(a[0])throw Error(new TextDecoder().decode(a.subarray(13,13+n)));await writeFile(output,a.subarray(13,13+n));console.log(output);
