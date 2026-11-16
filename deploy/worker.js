const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function body(req,max=8192){const r=req.body?.getReader();let all=[],n=0;if(!r)return {};for(;;){let {done,value}=await r.read();if(done)break;n+=value.length;if(n>max){await r.cancel();throw Error('Request too large')}all.push(value)}let a=new Uint8Array(n),i=0;for(let b of all){a.set(b,i);i+=b.length}return JSON.parse(new TextDecoder().decode(a))}
function canonical(value){let u;try{u=new URL(value)}catch{throw Error('Paste a complete public post URL.')}if(u.protocol!=='https:'||u.port||u.username||u.password||u.href.length>2048)throw Error('Use a public HTTPS post URL.');const h=u.hostname.replace(/^www\./,'');let platform,path=u.pathname;let keep=new URLSearchParams();if(['x.com','twitter.com','mobile.twitter.com'].includes(h)&&/^\/(?:[\w]+\/status\/\d+|i\/(?:web\/)?status\/\d+)(?:\/.*)?$/.test(path)){platform='x';u.hostname='x.com';path=path.replace(/(\/status\/\d+).*/,'$1')}else if(['threads.com','threads.net'].includes(h)&&/^\/@[\w.]+\/post\/[\w-]+\/?$/.test(path)){platform='threads';u.hostname='www.threads.com'}else if(['instagram.com','m.instagram.com'].includes(h)&&/^\/(?:p|reel|reels|tv)\/[\w-]+\/?$/.test(path)){platform='instagram';u.hostname='www.instagram.com'}else if(['tiktok.com','m.tiktok.com'].includes(h)&&/^\/@[\w.]+\/(?:video|photo)\/\d+\/?$/.test(path)){platform='tiktok';u.hostname='www.tiktok.com'}else if(['vm.tiktok.com','vt.tiktok.com'].includes(h)&&/^\/[\w-]+\/?$/.test(path)){platform='tiktok'}else if(['facebook.com','m.facebook.com','web.facebook.com'].includes(h)&&(/\/(?:posts|videos|reel)\/[\w.-]+/.test(path)||['/story.php','/photo.php','/watch/','/permalink.php'].includes(path))){platform='facebook';u.hostname='www.facebook.com';for(const k of ['story_fbid','id','v','fbid'])if(u.searchParams.has(k))keep.set(k,u.searchParams.get(k))}else if(h==='fb.watch'&&/^\/[\w-]+\/?$/.test(path)){platform='facebook'}else throw Error('Use a single public post from X, Threads, Facebook, Instagram or TikTok.');u.pathname=path;u.search=keep.toString();u.hash='';return{url:u.href,platform}}
async function hash(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('')}
export default{async fetch(req,env){const u=new URL(req.url),now=Math.floor(Date.now()/1000);try{
 if(u.pathname==='/api/health'){let h=await env.DB.prepare('SELECT value FROM health WHERE key=?').bind('resolver').first();return json({ok:true,renderer:'rust-wasm',platforms:['x','threads','facebook','instagram','tiktok'],resolver:h&&now-h.value<90?'online':'offline'})}
 if(u.pathname.startsWith('/internal/')){
  if(req.headers.get('authorization')!=='Bearer '+env.RESOLVER_KEY)return json({error:'Not found'},404);
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  if(u.pathname==='/internal/claim'){
   await env.DB.prepare("INSERT INTO health(key,value) VALUES('resolver',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(now).run();
   const job=await env.DB.prepare("UPDATE jobs SET status='processing',lease=?,attempts=attempts+1 WHERE id=(SELECT id FROM jobs WHERE (status='pending' OR (status='processing' AND lease<?)) AND attempts<2 ORDER BY created LIMIT 1) RETURNING id,key,url,platform").bind(now+90,now).first();return json({job:job||null});
  }
  if(u.pathname==='/internal/complete'){
   const b=await body(req,1900000);const job=await env.DB.prepare('SELECT key,url,platform FROM jobs WHERE id=?').bind(b.id).first();if(!job)return json({error:'Job not found'},404);
   if(b.error){await env.DB.prepare("UPDATE jobs SET status='failed',error=? WHERE id=?").bind(String(b.error).slice(0,200),b.id).run();return json({ok:true})}
   if(!b.result?.post||typeof b.result.post.text!=='string')throw Error('Missing resolved post.');b.result.post.platform=job.platform;b.result.source={url:job.url,provider:'research',fetchedAt:new Date().toISOString()};
   await env.DB.prepare('INSERT INTO cache(key,payload,expires) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload,expires=excluded.expires').bind(job.key,JSON.stringify(b.result),now+3600).run();
   await env.DB.prepare("UPDATE jobs SET status='done',error=NULL WHERE id=?").bind(b.id).run();
   await env.DB.prepare('DELETE FROM cache WHERE expires<?').bind(now-3600).run();await env.DB.prepare('DELETE FROM jobs WHERE created<?').bind(now-86400).run();
   return json({ok:true});
  }
  return json({error:'Not found'},404);
 }
 if(u.pathname==='/api/result'){
  const job=await env.DB.prepare('SELECT key,status,error,created FROM jobs WHERE id=?').bind(u.searchParams.get('id')||'').first();if(!job)return json({error:'Lookup not found. Paste the link again.'},404);
  if(job.status==='done'){let c=await env.DB.prepare('SELECT payload FROM cache WHERE key=?').bind(job.key).first();if(c)return json(JSON.parse(c.payload));}
  if(job.status==='failed')return json({error:job.error||'The post could not be read.'},422);
  if(now-job.created>120)return json({error:'The lookup took too long. Try again shortly.'},504);
  return json({pending:true},202);
 }
 if(u.pathname==='/api/resolve'){
  if(req.method!=='POST')return json({error:'Use POST'},405);const b=await body(req);const c=canonical(b.url||b.input);let key=await hash(c.url);
  let cache=await env.DB.prepare('SELECT payload FROM cache WHERE key=? AND expires>?').bind(key,now).first();if(cache)return json({...JSON.parse(cache.payload),cached:true});
  let job=await env.DB.prepare('SELECT id,status,created,error FROM jobs WHERE key=?').bind(key).first();if(job&&['pending','processing'].includes(job.status)&&now-job.created<120)return json({job:job.id,pending:true},202);
  let health=await env.DB.prepare("SELECT value FROM health WHERE key='resolver'").first();if(!health||now-health.value>90)return json({error:'Live lookup is temporarily offline. Examples, text and Post JSON still render locally.'},503);
  let ip=await hash(req.headers.get('cf-connecting-ip')||'shared');for(let [bucket,cap]of [[`ip:${Math.floor(now/3600)}:${ip.slice(0,24)}`,12],[`day:${Math.floor(now/86400)}`,150]]){let r=await env.DB.prepare('INSERT INTO limits(bucket,n) VALUES(?,1) ON CONFLICT(bucket) DO UPDATE SET n=n+1 RETURNING n').bind(bucket).first();if(r.n>cap)return json({error:'Lookup budget reached. Use the examples or paste text/JSON, or try later.'},429)}
  const id=crypto.randomUUID();await env.DB.prepare("INSERT INTO jobs(id,key,url,platform,status,created) VALUES(?,?,?,?,'pending',?) ON CONFLICT(key) DO UPDATE SET id=excluded.id,status='pending',created=excluded.created,attempts=0,error=NULL,lease=0").bind(id,key,c.url,c.platform,now).run();return json({job:id,pending:true},202);
 }
 if(u.pathname==='/api/resolve-links')return json({links:{},notes:['External link-card lookup is not enabled.']});
 if(u.pathname.startsWith('/api/'))return json({error:'Not found'},404);
 return env.ASSETS.fetch(req);
 }catch(e){return json({error:e.message||'Request failed'},400)}}};
