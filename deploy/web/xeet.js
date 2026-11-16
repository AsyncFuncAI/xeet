let loaded;
async function core(){return loaded??=(async()=>{let m=await import('./wasm/teet_wasm.js');await m.default();return m})()}
function unpack(a){let v=new DataView(a.buffer,a.byteOffset,a.byteLength),n=v.getUint32(1,true),r=v.getUint32(5,true),d=new TextDecoder();if(a[0])throw Error(d.decode(a.subarray(13,13+n)));return{payload:a.slice(13,13+n),report:r?JSON.parse(d.decode(a.subarray(13+n,13+n+r))):null}}
export async function render(post,options={}){let m=await core(),r=unpack(m.call(1,JSON.stringify({op:'render',post,options})));return{png:r.payload,report:r.report}}
export async function explain(post,options={}){let m=await core(),r=unpack(m.call(0,JSON.stringify({op:'explain',post,options})));return JSON.parse(new TextDecoder().decode(r.payload))}
export async function renderRgba(post,options={}){let m=await core(),r=unpack(m.call(3,JSON.stringify({op:'renderRgba',post,options}))),v=new DataView(r.payload.buffer,r.payload.byteOffset,r.payload.byteLength);return{width:v.getUint32(0,true),height:v.getUint32(4,true),rgba:r.payload.slice(8),report:r.report}}
export async function renderBatch(post,options=[]){return Promise.all(options.map(o=>render(post,o)))}
export async function resolve(url){let r=await fetch('/api/resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})}),d=await r.json(),id=d.job,deadline=Date.now()+110000;if(!r.ok)throw Error(d.error);while(d.pending){if(Date.now()>deadline)throw Error('Lookup timed out');await new Promise(r=>setTimeout(r,1500));r=await fetch('/api/result?id='+encodeURIComponent(id));d=await r.json();if(!r.ok)throw Error(d.error)}return d}
export async function loadXeet(){await core();return{render,explain,renderRgba,renderBatch,resolve}}
