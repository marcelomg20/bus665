
const CACHE='bus665-v3';
const ASSETS=['./','./index.html','./manifest.json','./SRC/STYLES/styles.css','./SRC/JAVASCRIPT/script.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('fetch',e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
    if(e.request.url.includes('tile.openstreetmap.fr')||e.request.url.includes('arcgisonline')){caches.open(CACHE).then(c=>c.put(e.request,res.clone()))}
    return res;
  }).catch(()=>caches.match('./index.html'))));
});
