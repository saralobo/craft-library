// Builds dist/ from the library's own files in source/ (copied from the site as they are). The pieces' CSS and engines
// go in unchanged; only the wrapping around them is written here. Run: npm run build
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, cpSync } from 'node:fs';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const read = (f) => readFileSync(new URL('./source/' + f, import.meta.url), 'utf8');
const between = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('marker not found: ' + a); return s.slice(i + a.length, j); };
const out = (f, s) => writeFileSync(new URL('./dist/' + f, import.meta.url), s);
mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });

// each engine runs once, in a scope where `window` is a plain object, so it hands its functions back instead of
// setting globals (its own listeners on document and window are kept)
const engine = (code) => `let api;\nfunction engine() {\n  if (api) return api;\n  const window = {};\n${code}\n  return (api = window);\n}\n`;

// ---- bursting heart
const HEART = 'M19.0711 13.1421L13.4142 18.799C12.6332 19.58 11.3668 19.58 10.5858 18.799L4.92893 13.1421C2.97631 11.1895 2.97631 8.02369 4.92893 6.07107C6.88155 4.11845 10.0474 4.11845 12 6.07107C13.9526 4.11845 17.1184 4.11845 19.0711 6.07107C21.0237 8.02369 21.0237 11.1895 19.0711 13.1421Z';
const LIKE_INNER = '<span class="like-fx" aria-hidden="true"><span class="like-ring"></span><span class="like-dots">' + '<i><b></b><b></b></i>'.repeat(7) + '</span></span>' +
  '<span class="like-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24"><path class="like-fill" d="' + HEART + '"></path><path class="like-line" d="' + HEART + '"></path></svg></span>';
out('like.js', `// Bursting heart · Craft Library, by Sara Lobo. like.css and like.js from the library, unchanged, around a mount.
import { css } from './style.js';
const CSS = ${JSON.stringify(read('like.css'))};
const INNER = ${JSON.stringify(LIKE_INNER)};
${engine(read('like.js'))}
// host: the element the button goes in. o: { liked, label, onChange(liked) }
export function mountLike(host, o = {}) {
  css('craft-like', CSS);
  const L = engine();
  host.innerHTML = '<button class="like" type="button" aria-pressed="false">' + INNER + '</button>';
  const btn = host.firstChild;
  btn.setAttribute('aria-label', o.label || 'Like');
  if (o.liked) L.setLike(btn, true, true);
  const mo = new MutationObserver(() => { if (o.onChange) o.onChange(btn.getAttribute('aria-pressed') === 'true'); });
  mo.observe(btn, { attributes: true, attributeFilter: ['aria-pressed'] });
  return { button: btn, set: (on, quiet) => L.setLike(btn, on, quiet), destroy() { mo.disconnect(); host.innerHTML = ''; } };
}
`);

// ---- magnetic icon
const RING = '<svg class="mag-ring" viewBox="0 0 40 40" aria-hidden="true"><defs>' +
  '<linearGradient id="magMetal" x1="32" y1="3.5" x2="20" y2="40" gradientUnits="userSpaceOnUse"><stop stop-color="#999"></stop><stop offset=".452" stop-color="#fff"></stop><stop offset="1" stop-color="#A2A2A2"></stop></linearGradient>' +
  '<radialGradient id="magFade" cx="20" cy="20" r="40" gradientUnits="userSpaceOnUse"><stop offset=".506" stop-color="#fff"></stop><stop offset=".507" stop-color="#000"></stop></radialGradient>' +
  '<mask id="magMask" maskUnits="userSpaceOnUse" x="-30" y="-30" width="100" height="100"><rect x="-30" y="-30" width="100" height="100" fill="url(#magFade)"></rect></mask></defs>' +
  '<path class="mag-rim" mask="url(#magMask)" d="M39.25 20C39.25 30.6315 30.6315 39.25 20 39.25C9.36852 39.25 .75 30.6315 .75 20C.75 9.36852 9.36852 .75 20 .75C30.6315 .75 39.25 9.36852 39.25 20Z" fill="#fff" fill-opacity=".2" stroke="url(#magMetal)" stroke-width="1.5"></path></svg>';
const GLYPH = '<svg class="mag-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M17.5 17.5L13.8807 13.8807M13.8807 13.8807C15.0871 12.6743 15.8333 11.0076 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333C11.0076 15.8333 12.6743 15.0871 13.8807 13.8807Z" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
out('magnet.js', `// Magnetic icon · Craft Library, by Sara Lobo. magnet.css and magnet.js from the library, unchanged, around a mount.
import { css } from './style.js';
const CSS = ${JSON.stringify(read('magnet.css'))};
const MARKUP = ${JSON.stringify(RING + GLYPH)};
${engine(read('magnet.js'))}
// host: the element the button goes in. o: { label, size (px or any CSS length), onClick }
export function mountMagnet(host, o = {}) {
  css('craft-magnet', CSS);
  const M = engine();
  host.innerHTML = '<button class="mag" type="button">' + MARKUP + '</button>';
  const btn = host.firstChild;
  btn.setAttribute('aria-label', o.label || 'Search');
  if (o.size) btn.style.setProperty('--mag-size', typeof o.size === 'number' ? o.size + 'px' : String(o.size));
  if (o.onClick) btn.addEventListener('click', o.onClick);
  M.magnetize(btn);
  return { button: btn, point: (x, y) => M.magnetPoint(btn, x, y), destroy() { host.innerHTML = ''; } };
}
`);

// ---- liquid glass nav bar
const G = read('glassnav.js');
const NAV_CSS = between(G, 'var CSS = `', '`;');
const NAV = between(G, 'var NAV = `', '`;');
const ENGINE = 'function lgnEngine() {' + between(G, 'function lgnEngine() {', '\n  lgnEngine();');
out('glassnav.js', `// Liquid glass nav bar · Craft Library, by Sara Lobo. The bar's CSS, markup and engine from the library, unchanged,
// around a mount.
import { css } from './style.js';
const CSS = ${JSON.stringify(NAV_CSS)};
const NAV = ${JSON.stringify(NAV)};
${engine(ENGINE.trimEnd() + '\n  lgnEngine();')}
const LABELS = ['Home', 'Search', 'Ask AI', 'Messages', 'Settings'];
// host: the element the bar goes in (it becomes the bar's wrapper; it must not set transform, opacity, filter or
// isolation). o: { active (0–4), labels (five names), label (the bar's name), onSelect(index) }
export function mountGlassNav(host, o = {}) {
  css('craft-glassnav', CSS);
  const G = engine();
  host.classList.add('lgn-wrap');
  host.innerHTML = NAV;
  const nav = host.querySelector('.lgn'), names = o.labels || LABELS;
  nav.setAttribute('aria-label', o.label || 'Main navigation');
  nav.querySelectorAll('.lgn-hit').forEach((b, i) => b.setAttribute('aria-label', names[i] || LABELS[i]));
  const bar = G.LiquidGlassNav.mount(nav, { onSelect: (i) => { if (o.onSelect) o.onSelect(i); } });
  if (o.active != null && +o.active !== 2) bar.select(Math.max(0, Math.min(4, +o.active)), true);
  return {
    get active() { return bar.active; },
    select: (i) => bar.select(i),
    destroy() { host.innerHTML = ''; host.classList.remove('lgn-wrap'); }
  };
}
`);

// ---- iridescent card: a 3D piece. The library's card.js is an ES module that brings its own three.js and its Visa mark,
// so it ships twice, unchanged but for where three.js comes from: card.js for bundlers (the `three` dependency, the Visa
// mark carried along as LOGO, so no bundler has to find the image), and card.cdn.js exactly as the site serves it, which
// the CDN build fetches the first time a card is mounted (card-visa.png sits next to both).
const CARD = read('card.js');
const CARD_THREE = "import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';";
if (!CARD.includes(CARD_THREE)) throw new Error('card.js: the three.js import moved');
const LOGO = 'data:image/png;base64,' + readFileSync(new URL('./source/card-visa.png', import.meta.url)).toString('base64');
out('card.cdn.js', CARD);
out('card.js', CARD.replace(CARD_THREE, "import * as THREE from 'three';") + `\n// the Visa mark (Wikimedia Commons, public domain), so bundlers don't have to resolve card-visa.png\nexport const LOGO = ${JSON.stringify(LOGO)};\n`);
copyFileSync(new URL('./source/card-visa.png', import.meta.url), new URL('./dist/card-visa.png', import.meta.url));

// ---- glass piggy bank: a 3D piece like the card. The library's piggy.js is an ES module carrying its own shape and
// numbers and importing three.js; it ships twice, unchanged but for where three.js comes from: piggy.js for bundlers
// (the `three` dependency) and piggy.cdn.js exactly as the site serves it, which the CDN build fetches on first mount.
const PIGGY = read('piggy.js');
if (!PIGGY.includes(CARD_THREE)) throw new Error('piggy.js: the three.js import moved');
out('piggy.cdn.js', PIGGY);
out('piggy.js', PIGGY.replace(CARD_THREE, "import * as THREE from 'three';"));

// ---- map pin: a 3D piece like the piggy bank. The library's pin.js is an ES module importing three.js; it ships twice,
// unchanged but for where three.js comes from: pin.js for bundlers and pin.cdn.js exactly as the site serves it
const PIN = read('pin.js');
if (!PIN.includes(CARD_THREE)) throw new Error('pin.js: the three.js import moved');
out('pin.cdn.js', PIN);
out('pin.js', PIN.replace(CARD_THREE, "import * as THREE from 'three';"));

// ---- token wheel: a 3D piece like the map pin. The library's tokens.js is an ES module importing three.js; it ships
// twice, unchanged but for where three.js comes from: tokens.js for bundlers and tokens.cdn.js exactly as the site serves it
const TOKENS = read('tokens.js');
if (!TOKENS.includes(CARD_THREE)) throw new Error('tokens.js: the three.js import moved');
out('tokens.cdn.js', TOKENS);
out('tokens.js', TOKENS.replace(CARD_THREE, "import * as THREE from 'three';"));

// ---- thinking orbs (Magic sphere and Sweep): one engine draws both on a canvas
out('thinking.js', `// Magic sphere and Sweep · Craft Library, by Sara Lobo. thinking.css and thinking.js from the library, unchanged,
// around a mount.
import { css } from './style.js';
const CSS = ${JSON.stringify(read('thinking.css'))};
${engine(read('thinking.js'))}
// host: the element it goes in. o: { kind: 'sphere' | 'sweep', size (px or any CSS length, default 32),
// label (the word beside the ball, default "Thinking"; '' or false for the ball alone) }
export function mountThinking(host, o = {}) {
  css('craft-thinking', CSS);
  const T = engine();
  const kind = o.kind === 'sweep' ? 'sweep' : 'sphere';
  const label = o.label == null || o.label === true ? 'Thinking' : o.label === false ? '' : String(o.label);
  host.innerHTML = '<span class="thinking" data-kind="' + kind + '" role="status"><canvas class="thinking-orb" aria-hidden="true"></canvas>' + (label ? '<span class="thinking-label"></span>' : '') + '</span>';
  const el = host.firstChild;
  if (label) el.lastChild.textContent = label; else el.setAttribute('aria-label', 'Thinking');
  if (o.size) el.style.setProperty('--thinking-size', typeof o.size === 'number' ? o.size + 'px' : String(o.size));
  const m = T.thinking(el);
  return { element: el, destroy() { m.destroy(); host.innerHTML = ''; } };
}
`);

// ---- panorama: a WebGL hero. The library's panorama.js is an ES module with no dependencies, so it goes in
// unchanged. Its clip and pictures ship in dist/panorama/; for bundlers the mount reads them from jsDelivr at this exact
// version (a bundler doesn't serve files out of node_modules), in craft.js from next to itself.
out('panorama.js', read('panorama.js'));
const VERSION = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;
out('panorama-assets.js', `// where the Panorama's own clip and pictures are: jsDelivr, at this version of the package\nexport const ASSETS = 'https://cdn.jsdelivr.net/npm/craft-library@${VERSION}/dist/panorama/';\n`);
cpSync(new URL('./source/panorama/', import.meta.url), new URL('./dist/panorama/', import.meta.url), { recursive: true });

// ---- the hand-written parts, then the one-file build for a <script> tag
for (const f of ['style.js', 'index.js', 'elements.js', 'cdn.js', 'card-mount.js', 'card-load.js', 'piggy-mount.js', 'piggy-load.js', 'panorama-mount.js', 'pin-mount.js', 'pin-load.js', 'tokens-mount.js', 'tokens-load.js']) copyFileSync(new URL('./src/' + f, import.meta.url), new URL('./dist/' + f, import.meta.url));
// in craft.js the card, the piggy bank, the map pin and the token wheel come from card.cdn.js, piggy.cdn.js, pin.cdn.js and
// tokens.cdn.js next to it, so three.js never lands in the one file
const cardFromCdn = { name: 'card-from-cdn', setup(b) {
  b.onResolve({ filter: /\/card-load\.js$/ }, () => ({ path: fileURLToPath(new URL('./src/card-load-cdn.js', import.meta.url)) }));
  b.onResolve({ filter: /\/piggy-load\.js$/ }, () => ({ path: fileURLToPath(new URL('./src/piggy-load-cdn.js', import.meta.url)) }));
  b.onResolve({ filter: /\/pin-load\.js$/ }, () => ({ path: fileURLToPath(new URL('./src/pin-load-cdn.js', import.meta.url)) }));
  b.onResolve({ filter: /\/tokens-load\.js$/ }, () => ({ path: fileURLToPath(new URL('./src/tokens-load-cdn.js', import.meta.url)) }));
  b.onResolve({ filter: /\/panorama-assets\.js$/ }, () => ({ path: fileURLToPath(new URL('./src/panorama-assets-cdn.js', import.meta.url)) }));
} };
await build({ entryPoints: [fileURLToPath(new URL('./dist/cdn.js', import.meta.url))], bundle: true, format: 'iife', target: 'es2020', outfile: fileURLToPath(new URL('./dist/craft.js', import.meta.url)), legalComments: 'none', plugins: [cardFromCdn], logLevel: 'error',
  banner: { js: '/* Sara Lobo Library · liquid glass nav bar, bursting heart, magnetic icon, iridescent card, glass piggy bank, magic sphere, sweep, panorama, map pin, token wheel · <glass-nav>, <like-button>, <magnetic-icon>, <iridescent-card>, <piggy-bank>, <magic-sphere>, <sweep-sphere>, <panorama-reel>, <map-pin>, <token-wheel> */' } });
console.log('built dist/');

// ---- the README the GitHub repository shows (GitHub reads .github/README.md before README.md): the same text, its links
// marked ?ref=github instead of ?ref=npm, so the site's dashboard tells the two apart
mkdirSync(new URL('./.github/', import.meta.url), { recursive: true });
writeFileSync(new URL('./.github/README.md', import.meta.url), readFileSync(new URL('./README.md', import.meta.url), 'utf8').replaceAll('?ref=npm', '?ref=github'));
console.log('wrote .github/README.md');
