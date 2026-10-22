/* Offline shell only. No Supabase API, Bible text, auth, or personal progress is cached. */
const CACHE="labgame-app-shell-v1";
const PREFIX="labgame-app-shell-";
self.addEventListener("install",event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch("/",{cache:"reload"});
   if(response.ok){
    await cache.put("/",response.clone());
    const html=await response.text();
    const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(m=>m[1]);
    await Promise.all([...new Set(assets)].map(async path=>{
     const asset=await fetch(path);
     if(asset.ok)await cache.put(path,asset);
    }));
   }
   const icon=await fetch("/icons/labgame.svg");
   if(icon.ok)await cache.put("/icons/labgame.svg",icon);
  }catch(e){/* Online install not guaranteed; app remains network-first. */}
  await self.skipWaiting();
 })());
});
self.addEventListener("activate",event=>{
 event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(name=>name.startsWith(PREFIX)&&name!==CACHE).map(name=>caches.delete(name)));
  await self.clients.claim();
 })());
});
self.addEventListener("fetch",event=>{
 const request=event.request;
 const url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin)return;
 if(url.pathname.startsWith("/assets/")||url.pathname==="/icons/labgame.svg"){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   const hit=await cache.match(request);
   if(hit)return hit;
   const response=await fetch(request);
   if(response.ok)await cache.put(request,response.clone());
   return response;
  })());
  return;
 }
 if(request.mode==="navigate"){
  event.respondWith((async()=>{
   try{const online=await fetch(request);
    if(online.ok&&url.pathname==="/"){const cache=await caches.open(CACHE);await cache.put("/",online.clone());}
    return online;
   }catch(e){
    const cache=await caches.open(CACHE);
    return await cache.match("/")||new Response("A interface LABGAME está offline. Conecte-se para sincronizar leituras.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
   }
  })());
 }
});
