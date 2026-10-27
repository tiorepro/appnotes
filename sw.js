/* Mở app khi mất mạng: ưu tiên mạng, không có thì dùng bản đã lưu */
const CACHE = 'ghichu-v2-v1';
const EXTRA = ['fonts.googleapis.com', 'fonts.gstatic.com', 'www.gstatic.com'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './manifest.webmanifest', './icon-192.png']).catch(() => {})));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) {
    if (!EXTRA.includes(u.hostname)) return;
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; })));
    return;
  }
  // Ưu tiên bản mới từ mạng, nhưng chờ tối đa 2,5 giây (sóng yếu thì mở ngay bản đã lưu); chỉ lưu phản hồi hợp lệ
  const fresh = fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; });
  const quick = new Promise(done => setTimeout(() => done(null), 2500));
  e.respondWith(Promise.race([fresh.catch(() => null), quick]).then(res => res || caches.match(r).then(m => m || caches.match('./index.html')).then(m => m || fresh)));
  e.waitUntil(fresh.catch(() => {}));
});
