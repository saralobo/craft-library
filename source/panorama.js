// Panorama · Sara Lobo Library
// A hero for moving pictures. A clip opens full-bleed under letterbox bars while the title tracks in; then the clip shrinks
// into one screen of a dome of monitors that surrounds you, and the other screens arrive in a wave around it. The pointer
// turns your head. The dome is black and white: colour lives only in a soft circle around the pointer, and the screen under
// it lights the dark with its own colours while focus brackets lock on and name it.
//
//   import { mountPanorama } from './panorama.js';
//   const hero = mountPanorama(document.querySelector('#hero'), {   // fills the element (give it a size)
//     title: 'Lorem ipsum',
//     text: 'Dolor sit amet,', textItalic: 'consectetur adipiscing.',
//     video: { src: 'reel.mp4', poster: 'poster.webp', title: 'Wild Grass', year: 2026 },
//     stills: [{ src: 'still-01.webp', title: 'The Coast Road', year: 2025 }, ...],   // up to 16, cropped to 16:10
//   });
//   hero.replay();  hero.destroy();
//
// WebGL, no dependencies. The pictures and the clip come from the same site as the page, or from one that allows CORS.

const DEFAULTS = {
  title: 'Lorem ipsum',
  text: 'Dolor sit amet,',
  textItalic: 'consectetur adipiscing.',   // set in the display face, after text
  video: null,        // { src, poster, title, year }: the opening clip, then the screen in the middle of the dome
  stills: [],         // [{ src, title, year }]: the other screens, repeated around the dome
  labels: true,       // "CAM 07" on each screen
  intro: true,        // the opening plays the first time the dome comes on screen; false starts it settled
  cursor: true,       // the dot-and-ring pointer (only for a mouse or trackpad)
  fonts: true,        // load Cormorant Garamond, Geist and Geist Mono from Google Fonts
};

const FONTS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=Geist:wght@400;500&family=Geist+Mono:wght@400;500&display=swap';
const HOLD = 3.3, MORPH_V = 1.7, MORPH = 1.45;          // s: the clip alone, the clip to its screen, each other screen in
const AR = 1.6;                                          // every screen is 16:10
const D2R = Math.PI / 180, R2D = 180 / Math.PI;

const CSS = `
.cup { --cup-ink: #0b0a09; --cup-paper: #ece7de; --cup-soft: cubic-bezier(.22, .61, .21, 1);
  --cup-display: "Cormorant Garamond", "Cormorant", Garamond, "Times New Roman", serif;
  --cup-ui: "Geist", -apple-system, "Helvetica Neue", Arial, sans-serif; --cup-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  position: relative; overflow: hidden; background: var(--cup-ink); color: var(--cup-paper); container-type: size; touch-action: pan-y;
  -webkit-font-smoothing: antialiased; -webkit-user-select: none; user-select: none; }
.cup.cup-cur, .cup.cup-cur * { cursor: none; }
.cup-gl { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.cup-src { position: absolute; left: 0; top: 0; width: 2px; height: 2px; opacity: 0; pointer-events: none; }
.cup-scrim { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 1.2s var(--cup-soft);
  background: radial-gradient(34% 28% at 50% 50%, rgba(11, 10, 9, .9), rgba(11, 10, 9, .45) 60%, rgba(11, 10, 9, 0) 100%); }
.cup.is-settled .cup-scrim { opacity: 1; }

/* the title tracks in like an opening credit: the letters drift together from a wide spacing and out of a blur, centre
   first; then a thin anamorphic streak crosses it and each letter catches the light as it passes */
.cup-title { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); text-align: center; white-space: nowrap; pointer-events: none; will-change: transform; }
/* padding-bottom keeps the descenders (the p of "ipsum") clear of the line below */
.cup-name { position: relative; margin: 0; padding-bottom: .15em; font-family: var(--cup-display); font-weight: 300; font-size: clamp(44px, 10.5cqw, 168px); line-height: .9; letter-spacing: -.01em; }
.cup-name span { display: inline-block; opacity: 0; transform: translateX(calc(var(--o) * .42em)); filter: blur(14px);
  transition: opacity 1.6s var(--cup-soft) var(--d), transform 2.8s cubic-bezier(.16, 1, .3, 1) var(--d), filter 2.2s var(--cup-soft) var(--d); }
.cup-title.is-in .cup-name span { opacity: 1; transform: none; filter: blur(0); animation: cup-glint 1.5s ease-in-out var(--g) both; }
@keyframes cup-glint { 0%, 100% { text-shadow: 0 0 0 rgba(255, 238, 210, 0); } 45% { text-shadow: 0 0 22px rgba(255, 238, 210, .6), 0 0 2px rgba(255, 250, 240, .85); } }
.cup-flare { position: absolute; left: -20%; right: -20%; top: 54%; height: 1px; pointer-events: none; opacity: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 240, 215, .9) 50%, transparent); box-shadow: 0 0 14px 2px rgba(255, 226, 180, .3); }
.cup-title.is-in .cup-flare { animation: cup-flare 2.4s cubic-bezier(.45, 0, .2, 1) 1.5s both; }
@keyframes cup-flare { 0% { opacity: 0; transform: translateX(-55%) scaleX(.35); } 25% { opacity: 1; } 75% { opacity: .85; } 100% { opacity: 0; transform: translateX(55%) scaleX(.35); } }
.cup-text { margin: 18px 0 0; font: 400 clamp(13px, 1.15cqw, 16px)/1.4 var(--cup-ui); letter-spacing: .01em; opacity: .82; }
.cup-text em { font-family: var(--cup-display); font-size: 1.32em; }
/* each word rises from its own mask: a clip-path, not overflow, so every word keeps its own baseline (both faces sit on
   one line), and wider than the word so the italic's leaning strokes stay whole */
.cup-text .w { display: inline-block; clip-path: inset(0 -.25em); }
.cup-text .w > span { display: inline-block; transform: translateY(110%); transition: transform 1.4s cubic-bezier(.16, 1, .3, 1) var(--d); }
.cup-title.is-in .cup-text .w > span { transform: none; }
.cup-title.is-reset, .cup-title.is-reset * { transition: none !important; animation: none !important; }

.cup-bars i { position: absolute; left: 0; right: 0; height: var(--cup-bar, 0px); background: #000; transition: transform 1.3s var(--cup-soft); }
.cup-bars i:first-child { top: 0; } .cup-bars i:last-child { bottom: 0; }
.cup.is-morph .cup-bars i:first-child { transform: translateY(-101%); } .cup.is-morph .cup-bars i:last-child { transform: translateY(101%); }

/* focus brackets on the screen under the pointer, and its name */
.cup-aim { position: absolute; left: 0; top: 0; pointer-events: none; opacity: 0; will-change: transform, width, height; }
.cup-aim > i { position: absolute; width: 16px; height: 16px; border: 0 solid var(--cup-paper); }
.cup-aim > i:nth-child(1) { left: -7px; top: -7px; border-width: 1px 0 0 1px; }
.cup-aim > i:nth-child(2) { right: -7px; top: -7px; border-width: 1px 1px 0 0; }
.cup-aim > i:nth-child(3) { left: -7px; bottom: -7px; border-width: 0 0 1px 1px; }
.cup-aim > i:nth-child(4) { right: -7px; bottom: -7px; border-width: 0 1px 1px 0; }
.cup-tag { position: absolute; left: -7px; top: calc(100% + 18px); white-space: nowrap; }
.cup-tag em { display: block; font: italic 300 28px/1 var(--cup-display); text-shadow: 0 1px 12px rgba(0, 0, 0, .6); }
.cup-tag small { display: block; margin-top: 8px; font: 10.5px/1 var(--cup-mono); letter-spacing: .1em; opacity: .6; }
.cup-tag.is-new em, .cup-tag.is-new small { animation: cup-tag .8s var(--cup-soft) both; }
.cup-tag.is-new small { animation-delay: .1s; }
@keyframes cup-tag { from { opacity: 0; transform: translateY(8px); filter: blur(5px); } }

/* the pointer: a dot, and a ring that trails it and stretches with speed */
.cup-cursor { position: absolute; left: 0; top: 0; pointer-events: none; opacity: 0; transition: opacity .35s var(--cup-soft); }
.cup-cursor.is-on { opacity: 1; }
.cup-cursor i { position: absolute; left: 0; top: 0; border-radius: 50%; will-change: transform; }
.cup-dot { width: 6px; height: 6px; margin: -3px 0 0 -3px; background: var(--cup-paper); }
.cup-ring { width: 38px; height: 38px; margin: -19px 0 0 -19px; border: 1px solid rgba(236, 231, 222, .5); }

@media (prefers-reduced-motion: reduce) {
  .cup-name span, .cup-text .w > span, .cup-bars i, .cup-scrim { transition: none; }
  .cup-title.is-in .cup-name span, .cup-title.is-in .cup-flare { animation: none; }
}`;

const VS = `
attribute vec3 aPos; attribute vec2 aUv; attribute vec4 aRect; attribute vec4 aMisc; attribute vec2 aPan; attribute vec2 aLab; attribute float aGlow;
uniform vec2 uHalf; uniform float uP;
varying vec2 vUv; varying vec4 vRect; varying vec4 vMisc; varying vec2 vPan; varying vec2 vLab; varying float vGlow;
void main() {
  vUv = aUv; vRect = aRect; vMisc = aMisc; vPan = aPan; vLab = aLab; vGlow = aGlow;
  gl_Position = vec4(aPos.x / uHalf.x, -aPos.y / uHalf.y, 0.0, (uP - aPos.z) / uP);   // CSS-style perspective, divided on the GPU
}`;

const FS = `
#extension GL_OES_standard_derivatives : enable
precision mediump float;
varying vec2 vUv; varying vec4 vRect; varying vec4 vMisc; varying vec2 vPan; varying vec2 vLab; varying float vGlow;
uniform sampler2D uAtlas; uniform sampler2D uVideo; uniform sampler2D uLabels; uniform float uLab;
uniform highp vec2 uView; uniform highp float uDpr; uniform highp vec4 uColor;
vec3 grade(vec3 c) {                                            // black and white, colour in a soft circle at the pointer
  if (uColor.w <= 0.0) return c;
  highp vec2 sp = vec2(gl_FragCoord.x / uDpr - uView.x, uView.y - gl_FragCoord.y / uDpr);
  float k = 1.0 - smoothstep(uColor.z * 0.4, uColor.z, length(sp - uColor.xy));
  vec3 g = vec3(dot(c, vec3(0.299, 0.587, 0.114))) * vec3(1.02, 1.0, 0.96);
  return mix(c, mix(g * 0.92, c * (1.0 + 0.08 * k), k), uColor.w);
}
void main() {
  vec2 uv = clamp((vUv - 0.5) / 1.16 + 0.5 + vPan, 0.002, 0.998);              // the picture a little larger, panned
  vec2 t = vRect.xy + uv * vRect.zw;
  vec3 col = vMisc.z > 0.5 ? texture2D(uVideo, t).rgb : texture2D(uAtlas, t).rgb;
  vec2 p = (vUv - 0.5) * vec2(1.6, 1.0);
  float kb = vMisc.w, r = 0.035 * kb;
  vec2 q = abs(p) - vec2(0.8, 0.5) + r;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;                 // a rounded screen
  col *= mix(0.5, 1.0, smoothstep(0.0, 0.14 * kb, -d));                         // its dark inner edge
  vec2 lp = (vUv - vec2(0.07, 0.836)) / vec2(0.42, 0.084);
  if (uLab > 0.0 && lp.x > 0.0 && lp.x < 1.0 && lp.y > 0.0 && lp.y < 1.0) {
    float a = texture2D(uLabels, vLab + lp * vec2(0.25, 0.03125)).a;
    col = mix(col, vec3(0.925, 0.906, 0.871), a * 0.8 * uLab);
  }
  col *= 1.0 - vMisc.y;
  col = grade(col);
  float aa = fwidth(d);
  float alpha = (1.0 - smoothstep(-aa, aa, d)) * vMisc.x;
  vec4 outc = vec4(col * alpha, alpha);
  if (vGlow > 0.001) {                                                         // the screen's own light on the dark around it
    vec2 cu = clamp(vUv, 0.0, 1.0) * 0.86 + 0.07;
    vec3 gc = vMisc.z > 0.5 ? texture2D(uVideo, vRect.xy + cu * vRect.zw).rgb : texture2D(uAtlas, vRect.xy + cu * vRect.zw, 5.0).rgb;
    float ga = vGlow * 0.85 * exp(-max(d, 0.0) / (0.28 * kb)) * vMisc.x * (1.0 - alpha);
    outc += vec4(grade(gc) * 1.6 * ga, ga);
  }
  gl_FragColor = outc;
}`;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, u) => a + (b - a) * u;
const ease = (u) => (u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);          // in-out, both ends at rest
const sstep = (a, b, v) => { const u = clamp((v - a) / (b - a)); return u * u * (3 - 2 * u); };
const damp = (cur, to, rate, dt) => cur + (to - cur) * (1 - Math.exp(-rate * dt));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// rotate a point first about X (b), then about Y (a): the order of "rotateY(a) rotateX(b)" in CSS
function rot(x, y, z, a, b) {
  const y1 = y * Math.cos(b) - z * Math.sin(b), z1 = y * Math.sin(b) + z * Math.cos(b);
  return [x * Math.cos(a) + z1 * Math.sin(a), y1, -x * Math.sin(a) + z1 * Math.cos(a)];
}

let styled = false;
function injectStyle(fonts) {
  if (styled) return; styled = true;
  if (fonts && !document.querySelector(`link[href="${FONTS}"]`)) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONTS; document.head.append(l);
  }
  const s = document.createElement('style'); s.textContent = CSS; document.head.append(s);
}

function markup(o) {
  const ch = [...String(o.title)], mid = (ch.length - 1) / 2;
  const letters = ch.map((c, i) => `<span aria-hidden="true" style="--o:${(i - mid).toFixed(1)};--d:${(Math.abs(i - mid) * .07).toFixed(2)}s;--g:${(1.5 + i / Math.max(1, ch.length - 1) * 1.2).toFixed(2)}s">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');
  let k = 0;
  const words = (s) => String(s || '').split(/\s+/).filter(Boolean).map((w) => `<span class="w"><span style="--d:${(1.7 + k++ * .07).toFixed(2)}s">${esc(w)}</span></span>`).join(' ');
  const text = words(o.text) + (o.textItalic ? ` <em>${words(o.textItalic)}</em>` : '');
  return `<canvas class="cup-gl" aria-hidden="true"></canvas>
<div class="cup-scrim"></div>
<div class="cup-title"><div class="cup-name" role="heading" aria-level="1" aria-label="${esc(o.title)}">${letters}<i class="cup-flare" aria-hidden="true"></i></div><p class="cup-text">${text}</p></div>
<div class="cup-bars" aria-hidden="true"><i></i><i></i></div>
<div class="cup-aim" aria-hidden="true"><i></i><i></i><i></i><i></i><div class="cup-tag"></div></div>
<div class="cup-cursor" aria-hidden="true"><i class="cup-ring"></i><i class="cup-dot"></i></div>`;
}

export function mountPanorama(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  injectStyle(o.fonts);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  root.classList.add('cup');
  if (o.cursor && fine) root.classList.add('cup-cur');
  root.innerHTML = markup(o);
  const $ = (s) => root.querySelector(s);
  const canvas = $('.cup-gl'), titleEl = $('.cup-title'), aim = $('.cup-aim'), tag = $('.cup-tag');
  const cursor = $('.cup-cursor'), dot = $('.cup-dot'), ring = $('.cup-ring');

  const stills = (o.stills || []).slice(0, 16);
  let video = null;
  if (o.video && o.video.src) {
    video = document.createElement('video');
    video.className = 'cup-src'; video.crossOrigin = 'anonymous';
    Object.assign(video, { src: o.video.src, muted: true, loop: true, playsInline: true, preload: 'auto' });
    if (o.video.poster) video.poster = o.video.poster;
    video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.setAttribute('aria-hidden', 'true');
    root.append(video);
  }
  // screen 0 is the clip (or the first still); the rest repeat the stills, neighbours in the list kept apart
  const S = Math.max(1, stills.length);
  const filmFor = (i) => (i === 0 && video ? o.video : stills[(i * 7 + Math.floor(i / S) * 4) % S] || {});
  const stillIndex = (i) => (i === 0 && video ? -1 : (i * 7 + Math.floor(i / S) * 4) % S);

  // ---------- WebGL: every screen is one textured quad ----------
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
  if (!gl || !gl.getExtension('OES_standard_derivatives')) {
    // no WebGL: the opening picture and the title, still
    const pic = (o.video && o.video.poster) || (stills[0] && stills[0].src);
    if (pic) Object.assign(root.style, { backgroundImage: `url("${pic}")`, backgroundSize: 'cover', backgroundPosition: 'center' });
    titleEl.classList.add('is-in');
    return { replay() {}, destroy() { root.innerHTML = ''; root.classList.remove('cup', 'cup-cur'); } };
  }
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog); gl.useProgram(prog);
  const MAX = 100, F = 18;                                                   // screens at most, floats per vertex
  const data = new Float32Array(MAX * 4 * F);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  const idx = new Uint16Array(MAX * 6);
  for (let i = 0; i < MAX; i++) idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  [['aPos', 3, 0], ['aUv', 2, 3], ['aRect', 4, 5], ['aMisc', 4, 9], ['aPan', 2, 13], ['aLab', 2, 15], ['aGlow', 1, 17]].forEach(([name, size, off]) => {
    const loc = gl.getAttribLocation(prog, name); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, F * 4, off * 4);
  });
  const U = (n) => gl.getUniformLocation(prog, n);
  const uHalf = U('uHalf'), uP = U('uP'), uLab = U('uLab'), uView = U('uView'), uDpr = U('uDpr'), uColor = U('uColor');
  gl.uniform1i(U('uAtlas'), 0); gl.uniform1i(U('uVideo'), 1); gl.uniform1i(U('uLabels'), 2);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const texture = (unit, mip) => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([21, 19, 17, 255]));
    return { t, unit, mip };
  };
  const upload = (tx, src) => {
    try {
      gl.activeTexture(gl.TEXTURE0 + tx.unit); gl.bindTexture(gl.TEXTURE_2D, tx.t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      if (tx.mip) gl.generateMipmap(gl.TEXTURE_2D);
    } catch (e) { console.warn('Panorama: a picture could not be read (another site without CORS?)', e); }
  };
  const tAtlas = texture(0, true), tVideo = texture(1, false), tLab = texture(2, true);

  // the stills in one 2048 × 1024 sheet: 400 × 250 each, cropped to 16:10, with a gutter so the mipmaps don't bleed
  const sheet = document.createElement('canvas'); sheet.width = 2048; sheet.height = 1024;
  const sctx = sheet.getContext('2d'); sctx.fillStyle = '#151311'; sctx.fillRect(0, 0, 2048, 1024);
  let pending = stills.length;
  stills.forEach((f, j) => {
    const im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async';
    im.onload = im.onerror = () => {
      if (im.naturalWidth) {
        const iw = im.naturalWidth, ih = im.naturalHeight, sw = Math.min(iw, ih * AR), sh = sw / AR;
        sctx.drawImage(im, (iw - sw) / 2, (ih - sh) / 2, sw, sh, (j % 4) * 512, Math.floor(j / 4) * 256, 400, 250);
      }
      if (--pending === 0) upload(tAtlas, sheet);
    };
    im.src = f.src;
  });
  const cellRect = (j) => [(j % 4) * .25, Math.floor(j / 4) * .25, 400 / 2048, 250 / 1024];
  let videoRect = [.05, 0, .9, 1], lastVT = -1;
  if (video) {
    if (o.video.poster) { const p = new Image(); p.crossOrigin = 'anonymous'; p.onload = () => upload(tVideo, p); p.src = o.video.poster; }
    video.addEventListener('loadedmetadata', () => {
      const a = video.videoWidth / video.videoHeight;
      videoRect = a > AR ? [(1 - AR / a) / 2, 0, AR / a, 1] : [0, (1 - a / AR) / 2, 1, a / AR];
    });
  }
  let labelsReady = false;
  function makeLabels() {
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.font = '500 19px "Geist Mono", ui-monospace, Menlo, monospace'; x.textBaseline = 'middle';
    try { x.letterSpacing = '1.5px'; } catch (e) {}
    for (let i = 0; i < 128; i++) {
      const ox = (i % 4) * 256, oy = Math.floor(i / 4) * 32;
      x.globalAlpha = .7; x.beginPath(); x.arc(ox + 9, oy + 16, 4, 0, 7); x.fill();
      x.globalAlpha = 1; x.fillText('CAM ' + String(i + 1).padStart(2, '0'), ox + 22, oy + 17);
    }
    upload(tLab, c); labelsReady = true;
  }

  // ---------- the dome ----------
  let W = 0, H = 0, P = 600, R = 0, tw = 0, cells = [], n = 0;
  let g = new Float32Array(MAX), hv = new Float32Array(MAX);
  function layout() {
    W = root.clientWidth; H = root.clientHeight; if (!W || !H) return;
    P = Math.max(W * .42, 340); R = Math.max(W, H * 1.3) * .95;
    const C = W < 720 ? 7 : 11, Rw = 7, da = (W < 720 ? 18 : 15) * D2R, db = 13 * D2R;
    cells = [];
    for (let r = 0; r < Rw; r++) for (let c = 0; c < C; c++) cells.push([(c - (C - 1) / 2) * da, (r - (Rw - 1) / 2) * db]);
    cells.sort((p, q) => Math.hypot(p[0], p[1]) - Math.hypot(q[0], q[1]));    // the clip takes the middle screen
    n = Math.min(MAX, cells.length); tw = R * da * .84;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    root.style.setProperty('--cup-bar', (W > H ? Math.max(0, (H - W / 2.39) / 2) : 0) + 'px');
  }

  // the pointer, relative to the dome's element
  let px = 0, py = 0, inside = false, mx = 0, my = 0;
  const onMove = (e) => {
    const b = root.getBoundingClientRect();
    px = e.clientX - b.left; py = e.clientY - b.top; inside = true;
    mx = clamp(px / W * 2 - 1, -1, 1); my = clamp(py / H * 2 - 1, -1, 1);
  };
  const onLeave = () => { inside = false; mx = my = 0; };
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerdown', onMove);
  root.addEventListener('pointerleave', onLeave);
  root.addEventListener('pointercancel', onLeave);

  // ---------- time ----------
  let t0 = 0, last = 0, raf = 0, visible = false, started = false, ready = false, settledAt = 0;
  let headH = 0, headP = 0, clock = 0, fx = 0, fy = 0, on = 0, mono = 0, labOn = 0, hover = -1;
  const AIM = { x: 0, y: 0, w: 0, h: 0, o: 0, idx: -1 }, CUR = { x: 0, y: 0, s: 1, d: 1, seen: false };

  function begin() {
    started = true;
    titleEl.classList.add('is-reset'); titleEl.classList.remove('is-in'); void titleEl.offsetWidth; titleEl.classList.remove('is-reset');
    root.classList.remove('is-morph', 'is-settled');
    settledAt = 0; mono = 0; labOn = 0; hover = -1; g.fill(0); hv.fill(0);
    if (video) { try { video.currentTime = 0; video.play().catch(() => {}); } catch (e) {} }
    const skip = reduce || !o.intro;
    t0 = performance.now() / 1000 - (skip ? HOLD + 4 : 0);
    if (skip) { titleEl.classList.add('is-in'); root.classList.add('is-morph', 'is-settled'); settledAt = 1; }
    else setTimeout(() => titleEl.classList.add('is-in'), 450);
  }

  function pose(i, dt) {
    const [a, b] = cells[i];
    let x = Math.sin(a) * Math.cos(b), y = Math.sin(b), z = -Math.cos(a) * Math.cos(b);
    [x, y, z] = rot(x, y, z, headH, 0); [x, y, z] = rot(x, y, z, 0, -headP);
    const fwd = -z, Xs = x / Math.max(.05, fwd) * P, Ys = y / Math.max(.05, fwd) * P;
    const h = (hv[i] = damp(hv[i], hover === i ? 1 : 0, 6, dt));
    const near = (g[i] = damp(g[i], Math.exp(-((Math.hypot(Xs - fx, Ys - fy) / 240) ** 2)) * on, 4, dt));
    const r = R * (1 - .07 * near - .12 * h);
    return { x: x * r, y: y * r, z: P + z * r, rx: Math.asin(clamp(y, -1, 1)) * R2D, ry: Math.atan2(-x, -z) * R2D,
      w: tw * (1 + .08 * h), o: sstep(.3, .52, fwd), sh: clamp((1 - fwd) * 1.6) * .55 * (1 - .6 * near) * (1 - h),
      ix: -Xs / W * 6, iy: -Ys / H * 6, glow: h };
  }
  const mix = (a, b, u) => { const r = {}; for (const k in b) r[k] = lerp(a[k] ?? b[k], b[k], u); return r; };
  const CORNERS = [[-.5, -.5, 0, 0], [.5, -.5, 1, 0], [.5, .5, 1, 1], [-.5, .5, 0, 1]];

  function item(i, q, kb) {
    const w = q.w, h = w / AR, cx = Math.cos(q.rx * D2R), sx = Math.sin(q.rx * D2R), cy = Math.cos(q.ry * D2R), sy = Math.sin(q.ry * D2R);
    const pts = [];
    for (const [lx, ly] of CORNERS) {                            // rotateX, then rotateY, then translate
      const X = lx * w, Y = ly * h * cx, Z = ly * h * sx;
      pts.push(X * cy + Z * sy + q.x, Y + q.y, -X * sy + Z * cy + q.z);
    }
    // a glowing screen gets a larger quad to hold its light; the hit test keeps the screen itself
    const m = q.glow > .001 ? .75 : 0, hp = pts.slice();
    if (m) for (let k = 0; k < 3; k++) { const c = (pts[k] + pts[3 + k] + pts[6 + k] + pts[9 + k]) / 4; for (let v = 0; v < 4; v++) pts[v * 3 + k] = c + (pts[v * 3 + k] - c) * (1 + 2 * m); }
    const si = stillIndex(i);
    return { i, z: q.z, pts, hp, m, rect: si < 0 ? videoRect : cellRect(si), misc: [q.o, q.sh, si < 0 ? 1 : 0, kb], pan: [-q.ix / 116, -q.iy / 116], lab: [(i % 4) * .25, Math.floor(i / 4) / 32], glow: q.glow };
  }

  function draw(list) {
    gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (!labelsReady && o.labels) makeLabels();
    if (video && video.readyState >= 2 && video.currentTime !== lastVT) { lastVT = video.currentTime; upload(tVideo, video); }
    list.sort((a, b) => a.z - b.z);                              // back to front
    let k = 0;
    for (const it of list) for (let v = 0; v < 4; v++) {
      const e = 1 + 2 * it.m;
      data.set([it.pts[v * 3], it.pts[v * 3 + 1], it.pts[v * 3 + 2], .5 + (CORNERS[v][2] - .5) * e, .5 + (CORNERS[v][3] - .5) * e,
        ...it.rect, ...it.misc, ...it.pan, ...it.lab, it.glow], k); k += F;
    }
    gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, k), gl.DYNAMIC_DRAW);
    gl.uniform2f(uHalf, W / 2, H / 2); gl.uniform1f(uP, P); gl.uniform1f(uLab, o.labels ? labOn : 0);
    gl.uniform2f(uView, W / 2, H / 2); gl.uniform1f(uDpr, canvas.width / W);
    gl.uniform4f(uColor, fx, fy, Math.min(W, H) * .3 * (.35 + .65 * on), mono);
    [tAtlas, tVideo, tLab].forEach((tx) => { gl.activeTexture(gl.TEXTURE0 + tx.unit); gl.bindTexture(gl.TEXTURE_2D, tx.t); });
    gl.drawElements(gl.TRIANGLES, list.length * 6, gl.UNSIGNED_SHORT, 0);
  }

  const project = (it) => {
    const s = [];
    for (let v = 0; v < 4; v++) { const d = P - it.hp[v * 3 + 2]; if (d <= 1) return null; s.push(it.hp[v * 3] * P / d, it.hp[v * 3 + 1] * P / d); }
    return s;
  };
  function hit(list, x, y) {                                      // the front-most screen under the pointer
    for (let j = list.length - 1; j >= 0; j--) {
      const it = list[j]; if (it.misc[0] < .3) continue;
      const s = project(it); if (!s) continue;
      let pos = 0, neg = 0;
      for (let v = 0; v < 4; v++) { const ax = s[v * 2], ay = s[v * 2 + 1], bx = s[(v + 1) % 4 * 2], by = s[(v + 1) % 4 * 2 + 1]; if ((bx - ax) * (y - ay) - (by - ay) * (x - ax) > 0) pos++; else neg++; }
      if (!pos || !neg) return it;
    }
    return null;
  }
  function aimAt(it, dt) {
    let r = null;
    if (it) { const s = project(it); if (s) { const xs = [s[0], s[2], s[4], s[6]].map((v) => v + W / 2), ys = [s[1], s[3], s[5], s[7]].map((v) => v + H / 2); r = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }; } }
    const i = it && r ? it.i : -1;
    if (i !== AIM.idx) {
      if (i >= 0) {
        const f = filmFor(i);
        tag.innerHTML = `<em>${esc(f.title || '')}</em><small>${o.labels ? `CAM ${String(i + 1).padStart(2, '0')}` : ''}${o.labels && f.year ? ' · ' : ''}${esc(f.year || '')}</small>`;
        tag.classList.remove('is-new'); void tag.offsetWidth; tag.classList.add('is-new');
        if (AIM.o < .05) Object.assign(AIM, { x: r.x - r.w * .1, y: r.y - r.h * .1, w: r.w * 1.2, h: r.h * 1.2 });   // lock on from a little wider
      }
      AIM.idx = i;
    }
    if (r) { AIM.x = damp(AIM.x, r.x, 11, dt); AIM.y = damp(AIM.y, r.y, 11, dt); AIM.w = damp(AIM.w, r.w, 11, dt); AIM.h = damp(AIM.h, r.h, 11, dt); }
    AIM.o = damp(AIM.o, r ? 1 : 0, r ? 9 : 5, dt);
    aim.style.opacity = AIM.o.toFixed(3);
    aim.style.transform = `translate(${AIM.x.toFixed(1)}px,${AIM.y.toFixed(1)}px)`;
    aim.style.width = AIM.w.toFixed(1) + 'px'; aim.style.height = AIM.h.toFixed(1) + 'px';
  }
  function cursorStep(dt) {
    const show = o.cursor && fine && inside;
    cursor.classList.toggle('is-on', show);
    if (!show) { CUR.seen = false; return; }
    if (!CUR.seen) { CUR.x = px; CUR.y = py; CUR.seen = true; }
    CUR.x = damp(CUR.x, px, 15, dt); CUR.y = damp(CUR.y, py, 15, dt);
    const vx = px - CUR.x, vy = py - CUR.y, sp = Math.min(.4, Math.hypot(vx, vy) / 110);
    CUR.s = damp(CUR.s, hover >= 0 ? .42 : 1, 10, dt); CUR.d = damp(CUR.d, hover >= 0 ? 1.35 : 1, 10, dt);
    dot.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) scale(${CUR.d.toFixed(3)})`;
    ring.style.transform = `translate(${CUR.x.toFixed(1)}px,${CUR.y.toFixed(1)}px) rotate(${Math.atan2(vy, vx).toFixed(3)}rad) scale(${(CUR.s * (1 + sp)).toFixed(3)},${(CUR.s * (1 - sp * .45)).toFixed(3)})`;
  }

  const list = [];
  function frame(nowMs) {
    raf = 0;
    if (!visible) return;
    const now = nowMs / 1000, dt = Math.min(.05, now - (last || now)); last = now;
    if (!started && ready) begin();
    if (!started || !n) { raf = requestAnimationFrame(frame); return; }
    const t = now - t0;
    clock += dt;
    headH = damp(headH, mx * .42 + (reduce ? 0 : Math.sin(clock * .13) * .05), 3.2, dt); headP = damp(headP, my * .26, 3.2, dt);
    const live = inside && settledAt;
    if (live) { fx = damp(fx, px - W / 2, 9, dt); fy = damp(fy, py - H / 2, 9, dt); }
    on = damp(on, live ? 1 : 0, 2.4, dt);
    mono = damp(mono, settledAt ? 1 : 0, 1.4, dt);
    labOn = damp(labOn, settledAt ? 1 : 0, 2.5, dt);
    if (t > HOLD - .05) root.classList.add('is-morph');
    if (t > HOLD + MORPH_V + .4 && !settledAt) { settledAt = now; root.classList.add('is-settled'); }

    list.length = 0;
    const diag = Math.hypot(W, H);
    let p0 = null, u0 = 1;
    for (let i = 0; i < n; i++) {
      const p = pose(i, dt);
      let q;
      if (i === 0) {
        p0 = p; u0 = ease(clamp((t - HOLD) / MORPH_V));
        q = mix({ x: 0, y: 0, z: 0, rx: 0, ry: 0, w: Math.max(W, H * AR), o: 1, sh: 0, ix: 0, iy: 0, glow: 0 }, p, u0);
      } else {
        // the rest arrive in a wave that starts at the clip's screen
        const u = ease(clamp((t - HOLD - .3 - Math.hypot(p.x - p0.x, p.y - p0.y) / diag * 1.1) / MORPH));
        q = u >= 1 ? p : mix({ ...p, z: p.z - 700, o: 0 }, p, u);
      }
      if (q.o > .002) list.push(item(i, q, i === 0 ? lerp(200 / (Math.max(W, H * AR) / AR), 1, u0) : 1));
    }
    draw(list);
    const it = inside && settledAt ? hit(list, px - W / 2, py - H / 2) : null;
    hover = it ? it.i : -1;
    aimAt(it, dt);
    cursorStep(dt);
    titleEl.style.transform = `translate(-50%, -50%) scale(${lerp(1, .9, ease(clamp((t - HOLD - .15) / 1.7))).toFixed(4)})`;
    raf = requestAnimationFrame(frame);
  }
  const wake = () => { if (!raf && visible) { last = 0; raf = requestAnimationFrame(frame); } };

  // runs only while on screen; the opening waits for the fonts and for the clip to be playable (or 2.2 s)
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; wake(); });
  io.observe(root);
  const ro = new ResizeObserver(() => { layout(); wake(); });
  ro.observe(root);
  layout();
  Promise.all([document.fonts ? document.fonts.ready : null, video ? new Promise((r) => { video.addEventListener('canplay', r, { once: true }); setTimeout(r, 2200); }) : null])
    .then(() => { ready = true; wake(); });

  return {
    replay() { if (ready) { begin(); wake(); } },
    destroy() {
      cancelAnimationFrame(raf); raf = 0; visible = false; io.disconnect(); ro.disconnect();
      root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerdown', onMove);
      root.removeEventListener('pointerleave', onLeave); root.removeEventListener('pointercancel', onLeave);
      if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
      const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      root.innerHTML = ''; root.classList.remove('cup', 'cup-cur', 'is-morph', 'is-settled'); root.style.removeProperty('--cup-bar');
    },
  };
}
