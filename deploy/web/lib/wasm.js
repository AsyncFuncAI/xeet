let ready=false,worker,pending=new Map(),next=0,lastStage;const stages=new Set(),sizes=new Set();
export function onLoadStage(fn){stages.add(fn);if(lastStage)fn(lastStage);return()=>stages.delete(fn)}
export function onWasmSized(fn){sizes.add(fn);return()=>sizes.delete(fn)}
export function wasmReady(){return ready}
export function preloadWorker(){if(worker)return;worker=new Worker(new URL('./render-worker.js',import.meta.url),{type:'module'});worker.onmessage=({data:d})=>{if(d.ready){ready=true;return;}if(d.stage){lastStage=d;for(const f of stages)f(d);return;}let p=pending.get(d.id);if(p){pending.delete(d.id);d.error?p.reject(Error(d.error)):p.resolve(d.result)}};worker.onerror=()=>{for(const p of pending.values())p.reject(Error('The renderer could not load. Reload to retry.'));pending.clear()};}
export async function renderSuiteInWorker(post,mode,layouts,dpr,{fontScale=1,autoExpand=true}={}){preloadWorker();let id=++next;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});worker.postMessage({id,post:{...post,platform:post.platform||window.activePlatform||'x'},mode,layouts,dpr,fontScale,autoExpand})})}
