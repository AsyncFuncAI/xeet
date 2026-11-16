import {bootPlayground} from './lib/boot-playground.js';
import {HARD} from './lib/hard.js';
import {platformFromUrl} from './lib/post.js';
const originals=HARD.map(e=>({...e,post:{...e.post,platform:"x"}}));const names={x:'xeet',threads:'teet',facebook:'feet',instagram:'igeet',tiktok:'tikeet'};
window.activePlatform='x';let choice=0;
function reflectPlatform(platform){
 if(!names[platform])return;
 window.activePlatform=platform;
 for(const id of ['btnQuote','btnPoll'])document.getElementById(id).hidden=platform!=='x';
 for(const b of document.querySelectorAll('[data-platform]'))b.setAttribute('aria-selected',String(b.dataset.platform===platform));
 document.querySelector('h1').textContent=names[platform];document.title=names[platform]+' · xeet';
 const params=new URLSearchParams(location.search);params.set('platform',platform);history.replaceState(null,'','?'+params+location.hash);
}
async function select(platform,initial=false){
 const seq=++choice;reflectPlatform(platform);
 const examples=platform==='x'?originals:await(await fetch('/examples/'+platform+'.json')).json();if(seq!==choice)return;
 HARD.splice(0,HARD.length,...examples);
 if(initial)bootPlayground();else dispatchEvent(new Event('xeet-platform'));
}
for(const b of document.querySelectorAll('[data-platform]'))b.onclick=()=>select(b.dataset.platform).catch(e=>{document.querySelector('#status').textContent=e.message});
const initial=new URLSearchParams(location.search).get('platform');await select(names[initial]?initial:'x',true);

// Pasting a URL changes the platform UI without loading an example over the paste.
document.getElementById('input').addEventListener('input',()=>{
 const platform=platformFromUrl(document.getElementById('input').value);
 if(!platform)return;
 ++choice; // Cancel any slower, earlier example-tab fetch.
 reflectPlatform(platform);
 document.getElementById('title').textContent='Public post';
 document.getElementById('why').textContent='Detected from your link. Profile photo, text and media resolve automatically.';
});
addEventListener('xeet-post-platform',event=>reflectPlatform(event.detail));
