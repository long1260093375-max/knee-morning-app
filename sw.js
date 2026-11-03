const C='knee-v3';
const A=['./','./index.html','./app.js','./style.css','./manifest.json','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);if(u.origin!==location.origin)return;
 // Prefer network for JS/CSS so video updates show up without fighting old cache
 if(/\.(js|css)$/.test(u.pathname)||u.pathname.endsWith('/app.js')){
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(cache=>cache.put(e.request,c));return r;}).catch(()=>caches.match(e.request)));
  return;
 }
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
