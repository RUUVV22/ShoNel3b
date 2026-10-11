const fs = require('node:fs');
const path = require('node:path');
const pkg = require('../package.json');

const projectRoot = path.join(__dirname, '..');
const outputDir = path.join(projectRoot, 'dist');
const basePath = String(process.env.EXPO_PUBLIC_BASE_URL || '').trim().replace(/^\/*|\/*$/g, '');
const rootUrl = basePath ? `/${basePath}/` : '/';
const buildId = String(process.env.GITHUB_SHA || pkg.version).slice(0, 12);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

if (!fs.existsSync(path.join(outputDir, 'index.html'))) {
  throw new Error('Run the Expo web export before preparing the PWA.');
}

fs.copyFileSync(path.join(projectRoot, 'assets', 'pwa-icon-192.png'), path.join(outputDir, 'pwa-icon-192.png'));
fs.copyFileSync(path.join(projectRoot, 'assets', 'pwa-icon-512.png'), path.join(outputDir, 'pwa-icon-512.png'));

const manifest = {
  name: 'شو نلعب؟',
  short_name: 'شو نلعب',
  description: 'ألعاب طاولة جماعية أونلاين في غرفة واحدة',
  lang: 'ar',
  dir: 'rtl',
  start_url: '.',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  theme_color: '#351326',
  background_color: '#FFF0CF',
  icons: [
    { src: './pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: './pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
};
fs.writeFileSync(path.join(outputDir, 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);

let html = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8');
const pwaHead = [
  `  <link rel="manifest" href="${rootUrl}manifest.webmanifest">`,
  `  <link rel="apple-touch-icon" href="${rootUrl}pwa-icon-512.png">`,
  '  <meta name="mobile-web-app-capable" content="yes">',
  '  <meta name="apple-mobile-web-app-capable" content="yes">',
  '  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '  <meta name="apple-mobile-web-app-title" content="شو نلعب؟">',
].join('\n');
html = html.replace('</head>', `${pwaHead}\n</head>`);
const registration = `<script>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('${rootUrl}sw.js',{scope:'${rootUrl}'});});}</script>`;
html = html.replace('</body>', `  ${registration}\n</body>`);
fs.writeFileSync(path.join(outputDir, 'index.html'), html);
fs.writeFileSync(path.join(outputDir, '404.html'), html);

const precache = [rootUrl, ...walk(outputDir)
  .filter((file) => !file.endsWith('sw.js') && !file.endsWith('metadata.json'))
  .map((file) => `${rootUrl}${path.relative(outputDir, file).split(path.sep).join('/')}`)];
const serviceWorker = `const CACHE_NAME = 'sho-nel3b-${buildId}';
const ROOT_URL = ${JSON.stringify(rootUrl)};
const PRECACHE = ${JSON.stringify(precache, null, 2)};
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match(ROOT_URL))));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
`;
fs.writeFileSync(path.join(outputDir, 'sw.js'), serviceWorker);

console.log(`Prepared installable web app at ${rootUrl}`);
