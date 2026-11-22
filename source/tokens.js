/* Roda de fichas · Sara Lobo Library (saralobolibrary.com). An onboarding screen for an account: eight silver tokens
   (Pix, card, Bitcoin, insurance, investments, exchange, cashback, boleto) turn slowly on a wheel, and each one, as it
   passes the top, comes forward and makes a full turn to show what it is. Turn the phone on its side and the tokens let
   go: they fall, roll and pile up against the edge of the screen like real coins; stand it up and, once they rest, they
   float back into the wheel. One ES module, three.js 0.169 its only dependency. Made with craft by Sara Lobo. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

// the words the piece shows, in English
const LABELS = {
  eyebrow: 'Account · BRL', title: 'One account for everything', cta: 'Continue', initials: 'SL', search: 'Search',
  analytics: 'Analytics', cards: 'Cards', step: 'Step 4 of 4', hero: 'Replay the tokens',
  turn: 'Turn the phone', upright: 'Turn it upright', gyro: 'Gyroscope on', replay: 'Replay',
  nogl: '3D could not start in this browser.'
};
/* a phone screen: a header, the tokens, what they are, the steps and a full-width white pill. With the frame, the
   screen sits in a phone (an island, the status bar) scaled to fit the box, with two quiet round buttons beside it or
   below it: turn the phone, replay. Without it, the screen fills the box. True black, by choice */
const STYLE = `
.tk-root{--tk-white:#F5F5F7;--tk-grey:#8D8E96;--tk-chip:rgba(255,255,255,.12);--tk-chip-hi:rgba(255,255,255,.18);--tk-sans:'DM Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;--tk-spring:cubic-bezier(.2,.8,.2,1);
  position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:28px;color:var(--tk-white);font-family:var(--tk-sans);font-optical-sizing:none;line-height:normal;text-align:left;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;color-scheme:dark}
.tk-root[data-tools="below"]{flex-direction:column;gap:20px}
.tk-root[data-frame="off"]{display:block}
.tk-root *{box-sizing:border-box}
.tk-root button{font:inherit;color:inherit;cursor:pointer;border:0;background:none;padding:0;margin:0}
.tk-root button:focus-visible,.tk-root .tk-hero:focus-visible,.tk-root .tk-search:focus-within{outline:2px solid var(--tk-white);outline-offset:2px}
.tk-root .tk-area{position:relative;flex:none}
.tk-root[data-frame="off"] .tk-area{position:absolute;inset:0}

.tk-root .tk-tools{flex:none;display:flex;flex-direction:column;gap:10px}
.tk-root[data-tools="below"] .tk-tools{flex-direction:row}
.tk-root .tk-tool{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08);transition:background .2s ease,color .2s ease,transform .45s var(--tk-spring)}
.tk-root .tk-tool:hover{background:rgba(255,255,255,.13)}
.tk-root .tk-tool:active{transform:scale(.94)}
.tk-root .tk-tool[aria-pressed="true"]{background:var(--tk-white);color:#0B0B0D}
.tk-root .tk-tool svg,.tk-root .tk-icon svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.tk-root .tk-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}

.tk-root .tk-device{position:absolute;left:50%;top:50%;width:390px;height:844px;margin:-422px 0 0 -195px;border-radius:52px;overflow:hidden;isolation:isolate;background:#000;
  box-shadow:0 0 0 1px rgba(255,255,255,.09),0 0 0 9px #111114,0 0 0 10px rgba(255,255,255,.07),0 40px 100px rgba(0,0,0,.6)}
.tk-root[data-frame="off"] .tk-device{left:0;top:0;width:100%;height:100%;margin:0;border-radius:0;box-shadow:none}
.tk-root .tk-device canvas{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:3;pointer-events:none}
.tk-root .tk-status{position:absolute;inset:0 0 auto;height:54px;z-index:30;display:flex;align-items:center;justify-content:space-between;padding:8px 32px 0 38px;font-size:16px;font-weight:600;letter-spacing:-.01em;pointer-events:none}
.tk-root .tk-island{position:absolute;top:11px;left:50%;width:120px;height:34px;margin-left:-60px;border-radius:20px;background:#000;z-index:31;pointer-events:none}
.tk-root .tk-homebar{position:absolute;left:50%;bottom:8px;width:136px;height:5px;margin-left:-68px;border-radius:3px;background:rgba(255,255,255,.6);z-index:30;pointer-events:none}
.tk-root[data-frame="off"] .tk-status,.tk-root[data-frame="off"] .tk-island,.tk-root[data-frame="off"] .tk-homebar{display:none}

.tk-root .tk-ui{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;padding:60px 16px 34px}
.tk-root[data-frame="off"] .tk-ui{padding:14px max(16px,env(safe-area-inset-right,0px)) 34px max(16px,env(safe-area-inset-left,0px))}
.tk-root .tk-top{flex:none;display:flex;align-items:center;gap:10px}
.tk-root .tk-avatar{width:36px;height:36px;flex:none;border-radius:50%;display:grid;place-items:center;background:linear-gradient(160deg,#3A3B42,#1E1F24);font-size:13px;font-weight:600;letter-spacing:.01em;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
.tk-root .tk-search{flex:1;min-width:0;height:36px;display:flex;align-items:center;gap:8px;margin:0;padding:0 12px;border-radius:999px;background:var(--tk-chip);color:var(--tk-grey)}
.tk-root .tk-search svg{flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.tk-root .tk-search input{flex:1;min-width:0;height:100%;margin:0;padding:1px 2px;border:0;background:none;outline:none;box-shadow:none;font:inherit;font-size:15px;color:var(--tk-white)}
.tk-root .tk-search input::placeholder{color:var(--tk-grey);opacity:1}
.tk-root .tk-icon{width:36px;height:36px;flex:none;border-radius:50%;display:grid;place-items:center;background:var(--tk-chip);transition:background .2s ease}
.tk-root .tk-icon:active{background:var(--tk-chip-hi)}
/* the centre block: the tokens, then what they are */
.tk-root .tk-hero{position:relative;flex:1 1 auto;min-height:200px;margin:0 -16px;cursor:pointer}
.tk-root .tk-nogl{display:none;position:absolute;inset:0;place-items:center;padding:24px;text-align:center;color:var(--tk-grey);font-size:14px}
.tk-root .tk-device.tk-nogl-on .tk-nogl{display:grid}
.tk-root .tk-copy{flex:none;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
.tk-root .tk-eyebrow{font-size:13px;font-weight:500;color:var(--tk-grey)}
.tk-root .tk-title{margin:0;padding:0;font-family:var(--tk-sans);font-size:30px;font-weight:700;font-style:normal;letter-spacing:-.035em;line-height:1.06;text-transform:none;text-wrap:balance;color:inherit}
.tk-root .tk-dots{flex:none;display:flex;justify-content:center;gap:6px;margin-top:22px}
.tk-root .tk-dots i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.22)}
.tk-root .tk-dots i:last-child{background:var(--tk-white)}
/* the call to action, as on the onboarding steps of a bank app */
.tk-root .tk-cta{flex:none;margin-top:32px;height:52px;width:100%;border-radius:999px;background:var(--tk-white);color:#0B0B0D;font-size:16px;font-weight:600;letter-spacing:-.01em;transition:transform .45s var(--tk-spring),background .2s ease}
.tk-root .tk-cta:active{transform:scale(.98);background:#E2E2E6}
/* the build: each block rises out of a light blur as the tokens open */
.tk-root .tk-rise{transition:opacity .7s ease,filter .8s ease,translate 1.1s var(--tk-spring);transition-delay:var(--tk-d,0s)}
.tk-root .tk-device[data-phase="wait"] .tk-rise{opacity:0;filter:blur(6px);translate:0 12px;pointer-events:none;transition-duration:.25s;transition-delay:0s}
@media (prefers-reduced-motion:reduce){.tk-root .tk-rise{transition-duration:.01s!important;transition-delay:0s!important}}
`;
function css() {
  if (document.getElementById('tokens-style')) return;
  const s = document.createElement('style'); s.id = 'tokens-style'; s.textContent = STYLE; document.head.appendChild(s);
}
function fonts() {                                        // DM Sans, as the screen was drawn with it
  if (document.querySelector('link[data-tokens-fonts]')) return;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.tokensFonts = '';
  l.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap';
  document.head.appendChild(l);
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const STATUS = '<svg width="76" height="13" viewBox="0 0 76 13"><g fill="#F5F5F7"><rect x="0" y="8" width="3" height="5" rx="1"/><rect x="5" y="5.5" width="3" height="7.5" rx="1"/><rect x="10" y="3" width="3" height="10" rx="1"/><rect x="15" y="0.5" width="3" height="12.5" rx="1"/><path d="M31 3.6a9.6 9.6 0 0 1 13 0l-1.5 1.6a7.4 7.4 0 0 0-10 0z M34 6.8a5.3 5.3 0 0 1 7 0l-1.5 1.6a3.1 3.1 0 0 0-4 0z M37.5 10.2l1.5-1.5 1.5 1.5-1.5 1.6z"/><rect x="51" y="1" width="21" height="11" rx="3.4" fill="none" stroke="#F5F5F7" stroke-opacity=".45"/><rect x="53" y="3" width="15" height="7" rx="1.8"/><rect x="73" y="4.5" width="1.6" height="4" rx=".8" fill-opacity=".45"/></g></svg>';
const SCREEN = (L) => `<div class="tk-status" aria-hidden="true"><span>9:41</span>${STATUS}</div>
  <div class="tk-island" aria-hidden="true"></div>
  <canvas aria-hidden="true"></canvas>
  <div class="tk-ui">
    <div class="tk-top">
      <span class="tk-avatar" aria-hidden="true">${esc(L.initials)}</span>
      <label class="tk-search"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.8"/><path d="M10.6 10.6l3.2 3.2"/></svg><input type="search" placeholder="${esc(L.search)}" aria-label="${esc(L.search)}"></label>
      <button class="tk-icon" type="button" aria-label="${esc(L.analytics)}"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 14.5V9.5M9 14.5V4M14 14.5V7.5"/></svg></button>
      <button class="tk-icon" type="button" aria-label="${esc(L.cards)}"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="2.5" y="4" width="13" height="10" rx="2"/><path d="M2.5 7.5h13"/></svg></button>
    </div>
    <div class="tk-hero" role="button" tabindex="0" aria-label="${esc(L.hero)}"><div class="tk-nogl">${esc(L.nogl)}</div></div>
    <div class="tk-copy tk-rise" style="--tk-d:0s">
      <span class="tk-eyebrow">${esc(L.eyebrow)}</span>
      <h2 class="tk-title">${esc(L.title)}</h2>
    </div>
    <div class="tk-dots tk-rise" style="--tk-d:.06s" aria-label="${esc(L.step)}"><i></i><i></i><i></i><i></i></div>
    <button class="tk-cta tk-rise" type="button" style="--tk-d:.14s">${esc(L.cta)}</button>
  </div>
  <div class="tk-homebar" aria-hidden="true"></div>`;
const TOOLS = (L) => `<button class="tk-tool" type="button" data-tk="turn" aria-pressed="false" title="${esc(L.turn)}"><svg width="22" height="22" viewBox="0 0 18 18" aria-hidden="true"><rect x="5.5" y="2.5" width="7" height="13" rx="1.8"/><path d="M2.2 7.2a7.5 7.5 0 0 1 2-3.4M15.8 10.8a7.5 7.5 0 0 1-2 3.4"/><path d="M1.6 4.4l2.6-.6.6 2.6M16.4 13.6l-2.6.6-.6-2.6"/></svg><span class="tk-sr">${esc(L.turn)}</span></button>
  <button class="tk-tool" type="button" data-tk="replay" title="${esc(L.replay)}"><svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.8 8a5.2 5.2 0 1 0 1.6-3.75"/><path d="M2.6 1.9v2.7h2.7"/></svg><span class="tk-sr">${esc(L.replay)}</span></button>`;

const TAU = Math.PI * 2;
const clamp01 = (x) => Math.min(1, Math.max(0, x)), lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const ease = {
  outCubic: (p) => 1 - Math.pow(1 - p, 3), inCubic: (p) => p * p * p,
  inOutSine: (p) => 0.5 - 0.5 * Math.cos(Math.PI * p),
  glide: (s) => s * s * (6 - 8 * s + 3 * s * s)        // starts at rest, fastest at a third, lands at rest
};

class Spring {
  constructor(value = 0, { stiffness = 220, zeta = 0.7 } = {}) { this.x = value; this.v = 0; this.target = value; this.k = stiffness; this.c = 2 * zeta * Math.sqrt(stiffness); }
  step(dt) { const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n; for (let i = 0; i < n; i++) { this.v += (-this.k * (this.x - this.target) - this.c * this.v) * h; this.x += this.v * h; } return this.x; }
}
let springCss;   // the CSS spring the UI rides on, generated once from the same spring as the 3D
function springCurve() {
  if (springCss !== undefined) return springCss;
  springCss = '';
  if (!window.CSS || !CSS.supports || !CSS.supports('transition-timing-function', 'linear(0, 1)')) return springCss;
  const s = new Spring(0, { stiffness: 120, zeta: 0.9 }); s.target = 1;
  const tr = [0]; let t = 0;
  while (t < 3 && !(t > 0.05 && Math.abs(1 - s.x) < 1e-3 && Math.abs(s.v) < 1e-2)) { s.step(1 / 600); t += 1 / 600; tr.push(s.x); }
  const st = []; for (let i = 0; i <= 40; i++) st.push(+tr[Math.round(i / 40 * (tr.length - 1))].toFixed(4));
  st[40] = 1; return (springCss = `linear(${st.join(', ')})`);
}

// ─── Light: softboxes in a PMREM room. Silver shows nothing but what it reflects, so the room is the look: a warm key
// high on the left (the gold faces), deep blue low on the right and from below (the blue faces), white strips for rims
function softbox(w, h, pos, rgb, k, soft = 0.5) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(...rgb).multiplyScalar(k) }, uSoft: { value: soft } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 uColor; uniform float uSoft; varying vec2 vUv; void main(){ vec2 q = abs(vUv - 0.5) * 2.0; gl_FragColor = vec4(uColor * smoothstep(1.0, 1.0 - uSoft, q.x) * smoothstep(1.0, 1.0 - uSoft, q.y), 1.0); }',
    side: THREE.DoubleSide
  }));
  m.position.set(...pos); m.lookAt(0, 0, 0); return m;
}
function studio(renderer, base, boxes) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(30, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec3 vP; void main(){ vec3 d = normalize(vP); vec3 c = vec3(0.0); ' + base + ' gl_FragColor = vec4(c, 1.0); }'
  })));
  boxes.forEach((b) => env.add(softbox(...b)));
  const pm = new THREE.PMREMGenerator(renderer), tex = pm.fromScene(env, 0).texture; pm.dispose();
  env.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return tex;
}
const SILVER_ROOM = ['c += vec3(0.008, 0.009, 0.014) + vec3(0.03, 0.034, 0.05) * smoothstep(-0.4, 1.0, d.y);', [
  [6.5, 6.5, [-6, 5, 3], [1, 0.76, 0.42], 3.0],      // warm gold, high on the left
  [7, 7, [6, -4, 3], [0.26, 0.52, 1], 3.6],           // blue, low on the right
  [9, 4, [0, -7, 2.5], [0.16, 0.38, 1], 3.0],         // deep blue from below
  [10, 2, [0, 7, 1], [1, 1, 1], 2.8],                 // a white strip overhead: the rims
  [5, 3.5, [0, 1, 8], [0.9, 0.94, 1], 0.6],           // a soft fill behind the camera: faces turned to you
  [2.5, 7, [-3, 1, -7], [1, 0.9, 0.75], 1.8],         // warm strip behind on the left
  [2.5, 7, [4, 0, -7], [0.45, 0.68, 1], 2.0],         // blue strip behind on the right
  [2, 6, [-8, -2, 1], [0.8, 0.88, 1], 1.4]            // a cool edge light on the left
]];

// ─── The emblems: what each token stands for, struck up on both faces ──────
// Pix and Bitcoin are their official marks: the symbol's four parts from Wikimedia Commons 'Pix (Brazil) logo.svg' and
// 'BitcoinSign.svg' (both public domain), sampled once into outlines (each shape: its outline, then its holes, as flat
// x, y lists), centred and scaled to the token. The others are drawn here.
const MARKS = {"pix":[[[-0.1178446,0.1168396,-0.1156924,0.1168047,-0.1135521,0.1167003,-0.1114252,0.116527,-0.1093129,0.1162852,-0.1072164,0.1159756,-0.1051372,0.1155987,-0.1030765,0.115155,-0.1010355,0.1146451,-0.0990157,0.1140695,-0.0970183,0.1134287,-0.0950447,0.1127232,-0.093096,0.1119537,-0.0911737,0.1111206,-0.0892791,0.1102246,-0.0874133,0.109266,-0.0855778,0.1082455,-0.0837738,0.1071636,-0.0820027,0.1060209,-0.0802657,0.1048179,-0.0785642,0.103555,-0.0768994,0.102233,-0.0752727,0.1008522,-0.0736854,0.0994133,-0.0721387,0.0979167,-0.0059027,0.0316689,-0.0052911,0.0310971,-0.0046507,0.0305749,-0.0039841,0.0301022,-0.0032939,0.0296792,-0.0025827,0.0293058,-0.0018531,0.0289821,-0.0011078,0.028708,-0.0003494,0.0284836,0.0004196,0.028309,0.0011965,0.0281841,0.0019787,0.028109,0.0027636,0.0280837,0.0035485,0.0281082,0.0043308,0.0281826,0.005108,0.0283069,0.0058775,0.0284811,0.0066365,0.0287052,0.0073825,0.0289793,0.0081128,0.0293034,0.008825,0.0296775,0.0095162,0.0301016,0.010184,0.0305758,0.0108257,0.0311001,0.0114387,0.0316745,0.0774335,0.0976752,0.0789802,0.0991718,0.0805676,0.1006107,0.0821943,0.1019915,0.083859,0.1033136,0.0855606,0.1045764,0.0872975,0.1057794,0.0890687,0.1069222,0.0908726,0.108004,0.0927081,0.1090245,0.0945739,0.1099831,0.0964686,0.1108792,0.0983909,0.1117122,0.1003395,0.1124818,0.1023132,0.1131872,0.1043106,0.113828,0.1063304,0.1144036,0.1083713,0.1149136,0.110432,0.1153573,0.1125112,0.1157342,0.1146077,0.1160438,0.11672,0.1162855,0.118847,0.1164588,0.1209872,0.1165632,0.1231394,0.1165981,0.1310886,0.1165981,0.047268,0.2004206,0.0439225,0.2035478,0.0404222,0.206403,0.0367811,0.2089863,0.0330133,0.2112977,0.029133,0.2133372,0.025154,0.2151047,0.0210907,0.2166003,0.0169569,0.217824,0.0127669,0.2187757,0.0085347,0.2194555,0.0042743,0.2198634,-1e-07,0.2199994,-0.0042746,0.2198634,-0.0085349,0.2194555,-0.012767,0.2187757,-0.0169569,0.217824,-0.0210905,0.2166003,-0.0251536,0.2151047,-0.0291322,0.2133372,-0.0330123,0.2112977,-0.0367798,0.2089863,-0.0404205,0.206403,-0.0439203,0.2035478,-0.0472654,0.2004206,-0.1308467,0.1168393]],[[0.2004228,0.0472658,0.1497687,0.0979198,0.1496288,0.0978649,0.149488,0.0978118,0.1493463,0.0977604,0.1492036,0.097711,0.14906,0.0976636,0.1489154,0.0976181,0.14877,0.0975746,0.1486237,0.0975333,0.1484765,0.097494,0.1483284,0.097457,0.1481795,0.0974222,0.1480297,0.0973896,0.1478791,0.0973594,0.1477277,0.0973316,0.1475755,0.0973062,0.1474224,0.0972832,0.1472686,0.0972628,0.147114,0.0972449,0.1469587,0.0972297,0.1468025,0.0972171,0.1466457,0.0972072,0.1464881,0.0972001,0.1463297,0.0971958,0.1461707,0.0971944,0.1231398,0.0971944,0.121653,0.0971693,0.1201701,0.0970945,0.1186924,0.0969704,0.1172212,0.0967977,0.1157578,0.0965767,0.1143035,0.0963082,0.1128596,0.0959926,0.1114274,0.0956304,0.1100083,0.0952223,0.1086034,0.0947686,0.1072141,0.0942701,0.1058417,0.0937271,0.1044875,0.0931403,0.1031528,0.0925102,0.1018389,0.0918373,0.1005471,0.0911222,0.0992787,0.0903654,0.0980349,0.0895674,0.0968171,0.0887288,0.0956267,0.0878501,0.0944647,0.0869318,0.0933327,0.0859746,0.0922319,0.0849788,0.0911635,0.0839452,0.0251706,0.0179503,0.0243887,0.0171944,0.0235874,0.0164707,0.0227676,0.0157791,0.0219301,0.0151196,0.0210758,0.0144923,0.0202056,0.0138971,0.0193202,0.0133341,0.0184205,0.0128033,0.0175074,0.0123046,0.0165816,0.0118381,0.0156442,0.0114037,0.0146958,0.0110015,0.0137374,0.0106315,0.0127697,0.0102936,0.0117937,0.009988,0.0108102,0.0097144,0.0098199,0.0094731,0.0088239,0.0092639,0.0078228,0.0090869,0.0068176,0.0089421,0.0058092,0.0088294,0.0047982,0.008749,0.0037857,0.0087007,0.0027724,0.0086846,0.0017581,0.0087007,0.0007448,0.008749,-0.0002668,0.0088294,-0.0012758,0.0089421,-0.0022814,0.0090869,-0.0032828,0.0092638,-0.004279,0.0094729,-0.0052694,0.0097142,-0.0062529,0.0099876,-0.0072289,0.0102932,-0.0081965,0.0106309,-0.0091548,0.0110008,-0.0101029,0.0114028,-0.0110401,0.0118369,-0.0119656,0.0123032,-0.0128784,0.0128015,-0.0137777,0.013332,-0.0146628,0.0138946,-0.0155327,0.0144893,-0.0163866,0.0151162,-0.0172238,0.0157751,-0.0180432,0.0164661,-0.0188442,0.0171892,-0.0196259,0.0179444,-0.0858679,0.0841864,-0.0869362,0.0852203,-0.0880371,0.0862162,-0.0891691,0.0871736,-0.090331,0.0880919,-0.0915215,0.0889707,-0.0927393,0.0898094,-0.093983,0.0906074,-0.0952515,0.0913643,-0.0965433,0.0920794,-0.0978572,0.0927522,-0.0991919,0.0933823,-0.1005461,0.093969,-0.1019185,0.0945119,-0.1033078,0.0950104,-0.1047126,0.0954639,-0.1061318,0.095872,-0.107564,0.0962341,-0.1090079,0.0965496,-0.1104622,0.0968181,-0.1119256,0.0970389,-0.1133968,0.0972116,-0.1148745,0.0973357,-0.1163574,0.0974105,-0.1178442,0.0974355,-0.1461633,0.0974355,-0.1463139,0.097437,-0.1464636,0.0974413,-0.1466126,0.0974485,-0.1467607,0.0974585,-0.1469081,0.0974711,-0.1470546,0.0974863,-0.1472004,0.097504,-0.1473454,0.0975242,-0.1474896,0.0975467,-0.1476331,0.0975716,-0.1477758,0.0975987,-0.1479178,0.097628,-0.148059,0.0976594,-0.1481995,0.0976928,-0.1483393,0.0977281,-0.1484783,0.0977653,-0.1486166,0.0978043,-0.1487543,0.097845,-0.1488912,0.0978874,-0.1490274,0.0979314,-0.149163,0.0979768,-0.1492978,0.0980237,-0.149432,0.098072,-0.1495655,0.0981215,-0.2004213,0.0472658,-0.2035484,0.0439205,-0.2064037,0.0404205,-0.208987,0.0367796,-0.2112983,0.0330121,-0.2133378,0.0291319,-0.2151053,0.0251532,-0.2166009,0.0210901,-0.2178246,0.0169565,-0.2187763,0.0127667,-0.2194561,0.0085346,-0.219864,0.0042744,-0.22,1e-07,-0.219864,-0.0042742,-0.2194561,-0.0085345,-0.2187763,-0.0127665,-0.2178246,-0.0169564,-0.2166009,-0.0210899,-0.2151053,-0.0251531,-0.2133378,-0.0291318,-0.2112983,-0.0330119,-0.208987,-0.0367795,-0.2064037,-0.0404203,-0.2035484,-0.0439204,-0.2004213,-0.0472656,-0.1495675,-0.0981193,-0.1494337,-0.0980698,-0.1492993,-0.0980216,-0.1491643,-0.0979747,-0.1490285,-0.0979292,-0.1488922,-0.0978853,-0.1487551,-0.0978429,-0.1486173,-0.0978022,-0.1484789,-0.0977632,-0.1483397,-0.097726,-0.1481999,-0.0976907,-0.1480593,-0.0976573,-0.147918,-0.0976259,-0.147776,-0.0975966,-0.1476333,-0.0975695,-0.1474897,-0.0975446,-0.1473455,-0.0975221,-0.1472005,-0.0975019,-0.1470547,-0.0974841,-0.1469081,-0.0974689,-0.1467607,-0.0974563,-0.1466126,-0.0974464,-0.1464636,-0.0974392,-0.1463139,-0.0974349,-0.1461633,-0.0974334,-0.1178442,-0.0974334,-0.1163574,-0.0974083,-0.1148745,-0.0973335,-0.1133968,-0.0972095,-0.1119256,-0.0970368,-0.1104622,-0.096816,-0.1090079,-0.0965475,-0.107564,-0.096232,-0.1061318,-0.09587,-0.1047126,-0.0954619,-0.1033078,-0.0950084,-0.1019185,-0.09451,-0.1005461,-0.0939671,-0.0991919,-0.0933805,-0.0978572,-0.0927505,-0.0965433,-0.0920777,-0.0952515,-0.0913627,-0.093983,-0.090606,-0.0927393,-0.0898081,-0.0915215,-0.0889696,-0.090331,-0.088091,-0.0891691,-0.0871728,-0.0880371,-0.0862156,-0.0869362,-0.0852199,-0.0858679,-0.0841862,-0.0196318,-0.0179502,-0.0180903,-0.0165172,-0.0164637,-0.0152088,-0.01476,-0.0140249,-0.0129867,-0.0129657,-0.0111517,-0.012031,-0.0092626,-0.011221,-0.0073272,-0.0105355,-0.0053533,-0.0099747,-0.0033484,-0.0095385,-0.0013205,-0.0092269,0.0007228,-0.00904,0.0027739,-0.0089777,0.0048248,-0.0090401,0.006868,-0.0092271,0.0088956,-0.0095389,0.0109,-0.0099753,0.0128734,-0.0105363,0.0148081,-0.0112221,0.0166964,-0.0120326,0.0185305,-0.0129678,0.0203027,-0.0140277,0.0220052,-0.0152123,0.0236305,-0.0165217,0.0251706,-0.0179558,0.0911635,-0.0839447,0.0922319,-0.0849784,0.0933327,-0.0859741,0.0944647,-0.0869314,0.0956267,-0.0878496,0.0968171,-0.0887283,0.0980349,-0.0895669,0.0992787,-0.0903649,0.1005471,-0.0911217,0.1018389,-0.0918369,0.1031528,-0.0925098,0.1044875,-0.0931399,0.1058417,-0.0937267,0.1072141,-0.0942696,0.1086034,-0.0947682,0.1100083,-0.0952218,0.1114274,-0.0956299,0.1128596,-0.0959921,0.1143035,-0.0963077,0.1157578,-0.0965762,0.1172212,-0.0967972,0.1186924,-0.0969699,0.1201701,-0.097094,0.121653,-0.0971688,0.1231398,-0.0971939,0.1461707,-0.0971939,0.1463297,-0.0971953,0.1464881,-0.0971996,0.1466457,-0.0972067,0.1468025,-0.0972166,0.1469587,-0.0972291,0.147114,-0.0972444,0.1472686,-0.0972622,0.1474224,-0.0972826,0.1475755,-0.0973056,0.1477277,-0.097331,0.1478791,-0.0973588,0.1480297,-0.097389,0.1481795,-0.0974215,0.1483284,-0.0974564,0.1484765,-0.0974934,0.1486237,-0.0975326,0.14877,-0.097574,0.1489154,-0.0976175,0.14906,-0.097663,0.1492036,-0.0977104,0.1493463,-0.0977599,0.149488,-0.0978112,0.1496288,-0.0978644,0.1497687,-0.0979194,0.2004228,-0.0472653,0.2035497,-0.0439201,0.2064047,-0.04042,0.2089878,-0.0367792,0.211299,-0.0330116,0.2133383,-0.0291315,0.2151057,-0.0251528,0.2166012,-0.0210896,0.2178248,-0.0169561,0.2187764,-0.0127662,0.2194562,-0.0085342,0.219864,-0.0042739,0.22,4e-07,0.219864,0.0042747,0.2194562,0.0085349,0.2187764,0.012767,0.2178248,0.0169568,0.2166012,0.0210904,0.2151057,0.0251535,0.2133383,0.0291322,0.211299,0.0330124,0.2089878,0.0367799,0.2064047,0.0404207,0.2035497,0.0439208,0.2004228,0.0472661]],[[0.1231402,-0.1165976,0.120988,-0.1165627,0.1188478,-0.1164583,0.1167208,-0.116285,0.1146085,-0.1160433,0.1125121,-0.1157337,0.1104328,-0.1153568,0.1083721,-0.1149131,0.1063312,-0.1144031,0.1043114,-0.1138275,0.102314,-0.1131867,0.1003403,-0.1124812,0.0983917,-0.1117117,0.0964694,-0.1108787,0.0945747,-0.1099826,0.0927089,-0.109024,0.0908734,-0.1080035,0.0890695,-0.1069217,0.0872983,-0.1057789,0.0855614,-0.1045759,0.0838598,-0.1033131,0.0821951,-0.101991,0.0805684,-0.1006102,0.078981,-0.0991713,0.0774343,-0.0976747,0.0114395,-0.0316779,0.0108428,-0.0311215,0.0102133,-0.0306136,0.0095539,-0.0301541,0.0088676,-0.0297432,0.0081574,-0.0293807,0.0074263,-0.0290667,0.0066773,-0.0288011,0.0059134,-0.0285839,0.0051375,-0.0284151,0.0043527,-0.0282946,0.0035619,-0.0282226,0.0027681,-0.0281988,0.0019743,-0.0282234,0.0011835,-0.0282963,0.0003987,-0.0284175,-0.0003771,-0.0285869,-0.0011409,-0.0288046,-0.0018898,-0.0290706,-0.0026208,-0.0293847,-0.0033308,-0.029747,-0.0040169,-0.0301575,-0.0046761,-0.0306162,-0.0053054,-0.031123,-0.0059018,-0.0316779,-0.0721379,-0.0979159,-0.0736846,-0.0994125,-0.0752719,-0.1008514,-0.0768986,-0.1022322,-0.0785634,-0.1035542,-0.0802649,-0.104817,-0.0820019,-0.1060201,-0.083773,-0.1071628,-0.085577,-0.1082447,-0.0874125,-0.1092652,-0.0892783,-0.1102237,-0.0911729,-0.1111198,-0.0930952,-0.1119529,-0.0950439,-0.1127224,-0.0970176,-0.1134279,-0.0990149,-0.1140687,-0.1010347,-0.1146443,-0.1030757,-0.1151542,-0.1051364,-0.1155979,-0.1072156,-0.1159748,-0.1093121,-0.1162844,-0.1114244,-0.1165262,-0.1135514,-0.1166995,-0.1156916,-0.1168039,-0.1178438,-0.1168388,-0.1308498,-0.1168388,-0.0472645,-0.2004221,-0.0439195,-0.203549,-0.0404196,-0.2064041,-0.0367789,-0.2089872,-0.0330115,-0.2112984,-0.0291315,-0.2133377,-0.0251528,-0.2151051,-0.0210897,-0.2166005,-0.0169562,-0.2178241,-0.0127663,-0.2187758,-0.0085342,-0.2194556,-0.004274,-0.2198634,4e-07,-0.2199994,0.0042748,-0.2198634,0.0085351,-0.2194556,0.0127672,-0.2187758,0.0169572,-0.2178241,0.0210908,-0.2166005,0.025154,-0.2151051,0.0291328,-0.2133377,0.033013,-0.2112984,0.0367806,-0.2089872,0.0404215,-0.2064041,0.0439216,-0.203549,0.0472668,-0.2004221,0.1310893,-0.1165976]]],"btc":[[[0.1047677,0.0170839,0.107796,0.0187001,0.110724,0.0204179,0.1135475,0.0222394,0.1162623,0.0241671,0.1188642,0.026203,0.1213488,0.0283494,0.123712,0.0306086,0.1259494,0.0329829,0.128057,0.0354744,0.1300303,0.0380853,0.1318651,0.040818,0.1335573,0.0436747,0.1351025,0.0466575,0.1364965,0.0497688,0.1377351,0.0530108,0.138814,0.0563857,0.139729,0.0598958,0.1404758,0.0635432,0.1410501,0.0673303,0.1414478,0.0712593,0.1416646,0.0753324,0.1416962,0.0795518,0.1415384,0.0839198,0.1411869,0.0884387,0.1403824,0.0945459,0.1391879,0.1003145,0.1376153,0.1057538,0.1356763,0.1108731,0.1333827,0.1156817,0.1307463,0.1201887,0.1277789,0.1244035,0.1244924,0.1283353,0.1208985,0.1319934,0.1170089,0.135387,0.1128356,0.1385255,0.1083903,0.141418,0.1036848,0.1440738,0.0987309,0.1465023,0.0935403,0.1487126,0.088125,0.1507141,0.0824966,0.1525159,0.076667,0.1541274,0.070648,0.1555578,0.0644514,0.1568164,0.0580889,0.1579125,0.0515724,0.1588552,0.0449136,0.159654,0.0381244,0.1603179,0.0381139,0.23,-0.0043486,0.23,-0.0043605,0.1621504,-0.0057581,0.1621493,-0.0071579,0.162146,-0.0085597,0.1621406,-0.0099634,0.1621331,-0.0113689,0.1621238,-0.0127761,0.1621126,-0.0141848,0.1620997,-0.015595,0.1620852,-0.0170065,0.1620691,-0.0184192,0.1620515,-0.019833,0.1620326,-0.0212477,0.1620124,-0.0226634,0.161991,-0.0240797,0.1619685,-0.0254968,0.161945,-0.0269143,0.1619207,-0.0283322,0.1618955,-0.0297504,0.1618695,-0.0311687,0.161843,-0.0325871,0.1618159,-0.0340055,0.1617883,-0.0354236,0.1617604,-0.0368414,0.1617322,-0.0382588,0.1617039,-0.0382681,0.2299908,-0.0806922,0.2299947,-0.0807002,0.1603298,-0.0818486,0.1603064,-0.0829953,0.1602832,-0.0841402,0.1602602,-0.0852833,0.1602376,-0.0864247,0.1602153,-0.0875642,0.1601935,-0.0887019,0.1601722,-0.0898377,0.1601515,-0.0909716,0.1601316,-0.0921036,0.1601124,-0.0932337,0.160094,-0.0943618,0.1600765,-0.095488,0.16006,-0.0966122,0.1600445,-0.0977344,0.1600302,-0.0988545,0.160017,-0.0999726,0.1600052,-0.1010886,0.1599946,-0.1022025,0.1599855,-0.1033144,0.1599779,-0.104424,0.1599719,-0.1055316,0.1599675,-0.1066369,0.1599648,-0.1077401,0.1599638,-0.1077401,0.1601699,-0.1663094,0.1601937,-0.1663015,0.1148999,-0.1661428,0.1149029,-0.1656848,0.1149112,-0.1649551,0.1149241,-0.1639811,0.1149409,-0.1627903,0.1149608,-0.16141,0.1149831,-0.1598677,0.1150069,-0.1581909,0.1150315,-0.156407,0.1150562,-0.1545435,0.1150802,-0.1526277,0.1151027,-0.1506873,0.115123,-0.1487495,0.1151404,-0.1468418,0.115154,-0.1449917,0.1151631,-0.1432267,0.1151669,-0.1415741,0.1151647,-0.1400614,0.1151558,-0.1387161,0.1151393,-0.1375656,0.1151145,-0.1366373,0.1150806,-0.1359588,0.1150369,-0.1355573,0.1149827,-0.1354605,0.1149171,-0.1333711,0.1148645,-0.1313991,0.1147131,-0.1295411,0.1144677,-0.1277938,0.1141333,-0.126154,0.1137148,-0.1246184,0.1132171,-0.1231836,0.1126451,-0.1218465,0.1120037,-0.1206036,0.1112978,-0.1194518,0.1105325,-0.1183876,0.1097125,-0.1174079,0.1088428,-0.1165093,0.1079284,-0.1156886,0.106974,-0.1149424,0.1059847,-0.1142675,0.1049654,-0.1136606,0.103921,-0.1131184,0.1028564,-0.1126375,0.1017764,-0.1122148,0.1006862,-0.1118469,0.0995904,-0.1115305,0.0984942,-0.1112624,0.0974023,-0.1110392,0.0963197,-0.1110259,0.0169373,-0.1110259,-0.0945691,-0.1111337,-0.0952605,-0.1112695,-0.0959805,-0.1114362,-0.0967238,-0.1116365,-0.0974853,-0.1118732,-0.0982599,-0.1121492,-0.0990425,-0.1124671,-0.0998278,-0.1128298,-0.1006108,-0.11324,-0.1013863,-0.1137006,-0.1021492,-0.1142143,-0.1028943,-0.1147838,-0.1036164,-0.115412,-0.1043105,-0.1161017,-0.1049714,-0.1168556,-0.105594,-0.1176765,-0.1061731,-0.1185673,-0.1067035,-0.1195306,-0.1071802,-0.1205692,-0.1075979,-0.121686,-0.1079516,-0.1228837,-0.1082361,-0.1241651,-0.1084462,-0.125533,-0.1085768,-0.1269902,-0.1086228,-0.1270838,-0.108678,-0.127483,-0.1087238,-0.1281604,-0.1087607,-0.1290883,-0.1087894,-0.1302393,-0.1088106,-0.1315858,-0.1088249,-0.1331002,-0.1088329,-0.1347552,-0.1088352,-0.1365231,-0.1088325,-0.1383765,-0.1088254,-0.1402877,-0.1088145,-0.1422294,-0.1088005,-0.1441738,-0.108784,-0.1460936,-0.1087657,-0.1479612,-0.108746,-0.1497491,-0.1087258,-0.1514297,-0.1087056,-0.1529755,-0.108686,-0.1543591,-0.1086677,-0.1555528,-0.1086513,-0.1565291,-0.1086375,-0.1572606,-0.1086268,-0.1577197,-0.10862,-0.1578788,-0.1086176,-0.1663015,-0.1592662,-0.1110524,-0.1592662,-0.1097664,-0.1592685,-0.1084824,-0.1592722,-0.1072002,-0.1592772,-0.10592,-0.1592835,-0.1046416,-0.1592909,-0.1033651,-0.1592993,-0.1020905,-0.1593087,-0.1008178,-0.159319,-0.0995471,-0.15933,-0.0982782,-0.1593416,-0.0970113,-0.1593538,-0.0957463,-0.1593665,-0.0944832,-0.1593795,-0.0932221,-0.1593927,-0.0919629,-0.1594061,-0.0907057,-0.1594196,-0.0894504,-0.159433,-0.0881971,-0.1594463,-0.0869458,-0.1594593,-0.0856964,-0.159472,-0.084449,-0.1594842,-0.0832035,-0.1594959,-0.0819601,-0.159507,-0.0807187,-0.1595173,-0.0806817,-0.2299881,-0.0382681,-0.23,-0.03828,-0.1602677,-0.0368235,-0.1602967,-0.0353711,-0.1603244,-0.0339229,-0.1603506,-0.0324786,-0.1603755,-0.0310384,-0.160399,-0.0296021,-0.1604211,-0.0281696,-0.1604418,-0.0267409,-0.1604613,-0.0253159,-0.1604793,-0.0238946,-0.160496,-0.0224769,-0.1605114,-0.0210628,-0.1605255,-0.0196521,-0.1605383,-0.0182448,-0.1605497,-0.0168409,-0.1605599,-0.0154402,-0.1605688,-0.0140428,-0.1605763,-0.0126486,-0.1605826,-0.0112574,-0.1605877,-0.0098693,-0.1605914,-0.0084841,-0.160594,-0.0071019,-0.1605952,-0.0057225,-0.1605953,-0.004346,-0.1605941,-0.0043578,-0.23,0.0381033,-0.23,0.0381271,-0.1596467,0.0469358,-0.15906,0.0555118,-0.1583135,0.0638455,-0.1573921,0.071927,-0.1562805,0.0797468,-0.1549634,0.0872951,-0.1534255,0.0945622,-0.1516517,0.1015384,-0.1496267,0.1082141,-0.1473352,0.1145794,-0.144762,0.1206248,-0.1418919,0.1263405,-0.1387095,0.1317168,-0.1351996,0.136744,-0.1313471,0.1414124,-0.1271365,0.1457123,-0.1225528,0.1496341,-0.1175805,0.1531679,-0.1122046,0.1563042,-0.1064097,0.1590332,-0.1001806,0.1613452,-0.093502,0.1632305,-0.0863586,0.1646794,-0.0787353,0.1656822,-0.0706168,0.1661509,-0.0640315,0.1663094,-0.0577504,0.1661645,-0.0517668,0.1657228,-0.0460739,0.1649909,-0.0406651,0.1639754,-0.0355335,0.1626829,-0.0306726,0.1611202,-0.0260755,0.1592938,-0.0217355,0.1572103,-0.0176459,0.1548765,-0.0138,0.1522988,-0.010191,0.1494841,-0.0068122,0.1464388,-0.003657,0.1431697,-0.0007185,0.1396833,0.00201,0.1359863,0.0045352,0.1320854,0.0068638,0.1279871,0.0090025,0.1236981,0.0109582,0.119225,0.0127374,0.1145745,0.0143469,0.1097532,0.0157935,0.1047677,0.0170839],[-0.0372441,0.1118426,-0.0339922,0.1118776,-0.0302602,0.1119636,-0.026103,0.1120724,-0.0215757,0.1121756,-0.0167333,0.112245,-0.0116306,0.1122522,-0.0063227,0.1121689,-0.0008646,0.1119668,0.0046887,0.1116177,0.0102824,0.1110931,0.0158613,0.1103648,0.0213705,0.1094045,0.026755,0.1081839,0.0319599,0.1066746,0.0369301,0.1048484,0.0416107,0.1026769,0.0459467,0.1001319,0.0498832,0.097185,0.0533651,0.093808,0.0563374,0.0899724,0.0587452,0.0856501,0.0605335,0.0808127,0.0616474,0.0754318,0.0620318,0.0694793,0.0616475,0.0637638,0.060534,0.0585802,0.0587462,0.0539028,0.0563391,0.0497058,0.0533675,0.0459637,0.0498865,0.0426507,0.045951,0.0397413,0.041616,0.0372098,0.0369364,0.0350304,0.0319671,0.0331776,0.0267631,0.0316257,0.0213794,0.0303491,0.0158708,0.029322,0.0102925,0.0285188,0.0046992,0.0279139,-0.000854,0.0274816,-0.0063123,0.0271963,-0.0116206,0.0270322,-0.0167239,0.0269638,-0.0215675,0.0269654,-0.0260962,0.0270112,-0.0302552,0.0270758,-0.0339895,0.0271333,-0.0372441,0.0271582,-0.0372441,0.1118426],[-0.0372626,-0.1089664,-0.0372441,-0.0155936,-0.0333383,-0.0155548,-0.0288579,-0.015461,-0.0238688,-0.0153432,-0.0184369,-0.0152325,-0.0126281,-0.0151598,-0.0065081,-0.0151561,-0.0001428,-0.0152526,0.0064019,-0.0154802,0.0130602,-0.0158699,0.0197662,-0.0164527,0.0264541,-0.0172596,0.0330581,-0.0183218,0.0395122,-0.01967,0.0457508,-0.0213355,0.0517078,-0.0233492,0.0573175,-0.0257421,0.062514,-0.0285452,0.0672315,-0.0317896,0.0714041,-0.0355062,0.0749659,-0.0397261,0.0778512,-0.0444803,0.0799941,-0.0497999,0.0813287,-0.0557157,0.0817892,-0.0622588,0.0813314,-0.0685435,0.0799991,-0.0742449,0.077858,-0.0793912,0.0749741,-0.0840105,0.0714132,-0.0881308,0.0672412,-0.0917803,0.062524,-0.0949869,0.0573274,-0.0977789,0.0517173,-0.1001843,0.0457595,-0.1022311,0.0395201,-0.1039474,0.0330647,-0.1053614,0.0264593,-0.1065011,0.0197697,-0.1073946,0.0130619,-0.10807,0.0064017,-0.1085553,-0.0001451,-0.1088787,-0.0065126,-0.1090682,-0.0126348,-0.1091519,-0.018446,-0.1091579,-0.0238802,-0.1091142,-0.0288717,-0.109049,-0.0333544,-0.1089904,-0.0372626,-0.1089664]]]};
const V2 = (x, y) => new THREE.Vector2(x, y);
const pts = (a) => { const r = []; for (let i = 0; i < a.length; i += 2) r.push(V2(a[i], a[i + 1])); return r; };
const baked = (shapes) => shapes.map(([outline, ...holes]) => { const s = new THREE.Shape(pts(outline)); s.holes = holes.map((h) => new THREE.Path(pts(h))); return s; });
const poly = (p) => new THREE.Shape(p.map(([x, y]) => V2(x, y)));
function rrect(w, h, r, cx = 0, cy = 0, P = THREE.Shape) {
  const s = new P(), x = cx - w / 2, y = cy - h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0); s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI); s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5); return s;
}
const disc = (r, cx = 0, cy = 0, P = THREE.Shape) => { const s = new P(); s.absarc(cx, cy, r, 0, TAU, false); return s; };
const ring = (ro, ri, cx = 0, cy = 0) => { const s = disc(ro, cx, cy); s.holes.push(disc(ri, cx, cy, THREE.Path)); return s; };
function capsule(ax, ay, bx, by, w) {
  const a = Math.atan2(by - ay, bx - ax), s = new THREE.Shape();
  s.absarc(bx, by, w, a - Math.PI / 2, a + Math.PI / 2, false); s.absarc(ax, ay, w, a + Math.PI / 2, a + Math.PI * 1.5, false); return s;
}
function shieldShape(k = 1, cy = 0) {   // a heater shield: a rounded peak, sloped shoulders, straight sides, a pointed foot
  const s = new THREE.Shape(), p = (x, y) => [x * k, y * k + cy];
  s.moveTo(...p(-0.07, 0.47)); s.quadraticCurveTo(...p(0, 0.5), ...p(0.07, 0.47)); s.lineTo(...p(0.36, 0.345));
  s.quadraticCurveTo(...p(0.42, 0.32), ...p(0.42, 0.26)); s.lineTo(...p(0.42, 0.02));
  s.bezierCurveTo(...p(0.42, -0.25), ...p(0.24, -0.42), ...p(0.035, -0.49)); s.quadraticCurveTo(...p(0, -0.502), ...p(-0.035, -0.49));
  s.bezierCurveTo(...p(-0.24, -0.42), ...p(-0.42, -0.25), ...p(-0.42, 0.02)); s.lineTo(...p(-0.42, 0.26));
  s.quadraticCurveTo(...p(-0.42, 0.32), ...p(-0.36, 0.345)); s.lineTo(...p(-0.07, 0.47)); return s;
}
function checkOutline(k, cx, cy, hw) {   // a thick check: round caps, a round outer corner, a mitred inner one
  const [A, C, B] = [[-0.43, 0.02], [-0.12, -0.3], [0.47, 0.33]].map(([x, y]) => V2(x * k + cx, y * k + cy));
  const d1 = C.clone().sub(A).normalize(), d2 = B.clone().sub(C).normalize();
  const n1 = V2(-d1.y, d1.x), n2 = V2(-d2.y, d2.x), m = n1.clone().add(n2).normalize(), out = [];
  const at = (c, v, s = hw) => out.push(V2(c.x + v.x * s, c.y + v.y * s)), ang = (v) => Math.atan2(v.y, v.x);
  const arc = (c, a0, da, n = 12) => { for (let i = 0; i <= n; i++) { const a = a0 + da * i / n; out.push(V2(c.x + Math.cos(a) * hw, c.y + Math.sin(a) * hw)); } };
  at(A, n1); at(C, m, hw / m.dot(n1)); at(B, n2); arc(B, ang(n2), -Math.PI);
  const a0 = ang(n2.clone().negate()); let da = ang(n1.clone().negate()) - a0; if (da > Math.PI) da -= TAU; if (da < -Math.PI) da += TAU;
  arc(C, a0, da, 8); arc(A, ang(n1.clone().negate()), -Math.PI);
  return new THREE.Path(out);
}
function arrow(y, dir) {   // a flat arrow along x, pointing +1 right or -1 left
  const t = 0.026, hw = 0.07, x0 = -0.2 * dir, x1 = 0.1 * dir, x2 = 0.21 * dir;
  return poly([[x0, y - t], [x1, y - t], [x1, y - hw], [x2, y], [x1, y + hw], [x1, y + t], [x0, y + t]]);
}
const ICONS = {
  pix: () => baked(MARKS.pix),
  btc: () => baked(MARKS.btc),
  shield: () => { const s = shieldShape(0.46, 0.005); s.holes.push(checkOutline(0.25, -0.006, 0.022, 0.03)); return [s]; },
  card: () => { const s = rrect(0.5, 0.34, 0.05); s.holes.push(rrect(0.1, 0.075, 0.018, -0.13, 0.04, THREE.Path), rrect(0.24, 0.032, 0.016, -0.06, -0.085, THREE.Path)); return [s]; },
  invest: () => [0.16, 0.27, 0.4].map((h, i) => rrect(0.085, h, 0.035, (i - 1) * 0.14, -0.2 + h / 2)),
  fx: () => [arrow(0.085, 1), arrow(-0.085, -1)],
  cashback: () => [ring(0.072, 0.036, -0.12, 0.13), ring(0.072, 0.036, 0.12, -0.13), capsule(-0.13, -0.19, 0.13, 0.19, 0.027)],
  boleto: () => { const W = [0.03, 0.014, 0.045, 0.014, 0.03, 0.058, 0.014, 0.03, 0.045, 0.014, 0.03]; let x = -0.235; return W.map((w) => { const s = rrect(w, 0.32, Math.min(0.006, w / 2.5), x + w / 2, 0); x += w + 0.02; return s; }); }
};
const ORDER = ['pix', 'card', 'btc', 'shield', 'invest', 'fx', 'cashback', 'boleto'];

// extruded with a rounded bevel, centred on z = 0; the bevel's normals are smoothed across its segments. `dome` bends the
// faces' normals as if they were gently domed (a normal that varies linearly with x, y interpolates exactly on big triangles)
function slab(shape, { depth, bevel, size, segs = 8, curve = 48, dome = 0 }) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: size, bevelSegments: segs, curveSegments: curve, steps: 1 });
  g.translate(0, 0, -depth / 2);
  const pos = g.attributes.position, nor = g.attributes.normal, key = (i) => `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
  const sides = g.groups.filter((q) => q.materialIndex === 1), acc = new Map();
  for (const c of sides) for (let i = c.start; i < c.start + c.count; i++) { const k = key(i), v = acc.get(k) || [0, 0, 0]; v[0] += nor.getX(i); v[1] += nor.getY(i); v[2] += nor.getZ(i); acc.set(k, v); }
  for (const c of sides) for (let i = c.start; i < c.start + c.count; i++) { const v = acc.get(key(i)), l = Math.hypot(...v) || 1; nor.setXYZ(i, v[0] / l, v[1] / l, v[2] / l); }
  if (dome) for (const c of g.groups.filter((q) => q.materialIndex === 0)) for (let i = c.start; i < c.start + c.count; i++) {
    const z = Math.sign(nor.getZ(i)), x = pos.getX(i) * dome, y = pos.getY(i) * dome, l = Math.hypot(x, y, 1); nor.setXYZ(i, x / l, y / l, z / l);
  }
  return g;
}

// ─── The choreography: a wheel ──────────────────────────────────────────────
// It runs only forward: nothing goes back the way it came. Every channel is a pure function of time from rest to rest,
// and the endless part starts from rest too. Tokens never pass through one another: the one that turns is lifted in
// front of its neighbours first.
const N = 8, CR = 0.55, tSuccess = 0.85, TOP = Math.PI / 2;
const Yax = new THREE.Vector3(0, 1, 0), _va = new THREE.Vector3();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const radial = (th, v) => v.set(Math.cos(th), Math.sin(th), 0);
// time for a motion that then runs for ever: it starts from rest and reaches full speed after `ramp` s
const runFrom = (t, t0, ramp) => { const x = t - t0; if (x <= 0) return 0; if (x >= ramp) return x - ramp / 2; const u = x / ramp; return ramp * (u * u * u - u * u * u * u / 2); };
// the way in: out of the centre, small and edge-on, turning forward to face you
function opening(i, t, from = -Math.PI / 2, stagger = 0.07, dur = 2.4) {
  const u = seg(t, i * stagger, i * stagger + dur);
  // it reaches its place before it turns, so nothing turns while the tokens are still crowded in the middle
  return { r: lerp(0.3, 1, ease.outCubic(seg(u, 0, 0.6))), k: lerp(0.2, 1, ease.outCubic(seg(u, 0, 0.5))), turn: from * (1 - ease.glide(seg(u, 0.38, 1))) };
}
// the ring turns slowly like a big wheel with the tokens kept upright. Each one, as it passes the top, comes forward,
// makes a full turn showing what it is, and goes back into the ring. There is always one at the top.
const WHEEL = (() => {
  const R = 1.4, TILT = 0.6, SLOT = 5.2, LIFT = 0.6, T0 = 2.4, h = Math.PI / N;
  return {
    tRest: T0,
    angle: (i, t) => TOP + h + i * TAU / N - (TAU / N / SLOT) * runFrom(t, T0, 2.2),   // where token i stands on the wheel
    pose(i, t, o) {
      const op = opening(i, t, Math.PI / 2 - TILT), th = this.angle(i, t);   // from edge-on straight to the scales: never flat while crowded
      const d = wrap(th - TOP - h), s = d > 0 ? 0 : clamp01(-d / (2 * h)), lift = Math.sin(Math.PI * s) ** 2;
      const r = R * op.r + 0.12 * lift;
      o.p.set(Math.cos(th) * r, Math.sin(th) * r, LIFT * lift);
      o.q.setFromAxisAngle(radial(th, _va), TILT + op.turn + TAU * ease.inOutSine(seg(s, 0.18, 0.82)));   // it turns only once it stands clear
      o.k = op.k * (1 + 0.1 * lift);
    }
  };
})();

// roll: the phone's roll, { x (degrees, clockwise), v (degrees/s) }; reduced(): whether to hold still
function makeTokens(renderer, roll, reduced) {
  const scene = new THREE.Scene(), env = studio(renderer, ...SILVER_ROOM);
  const satin = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.95, 0.95, 0.96), metalness: 1, roughness: 0.24, envMap: env });
  const polish = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.97, 0.97, 0.98), metalness: 1, roughness: 0.08, envMap: env });
  const T = 0.06, body = slab(disc(CR), { depth: 0.05, bevel: 0.035, size: 0.03, curve: 96, dome: 0.5 });
  const rim = slab(ring(0.5, 0.455), { depth: 0.006, bevel: 0.012, size: 0.008, segs: 4, curve: 96 });
  const rig = new THREE.Group(), coins = [], geos = [body, rim]; scene.add(rig);
  ORDER.forEach((name) => {
    const emblem = slab(ICONS[name](), { depth: 0.008, bevel: 0.012, size: 0.006, segs: 4, curve: 24 }); geos.push(emblem);
    const coin = new THREE.Group(), front = new THREE.Group(), back = new THREE.Group();
    coin.add(new THREE.Mesh(body, [satin, polish]));
    for (const holder of [front, back]) for (const g of [rim, emblem]) { const m = new THREE.Mesh(g, polish); m.position.z = T + 0.003; holder.add(m); }
    // the back's emblem is the front's turned half round the axis the tokens turn about, so it reads the right way up
    back.quaternion.setFromAxisAngle(Yax, Math.PI);
    coin.add(front, back); rig.add(coin); coins.push({ coin, back });
  });
  const o = { p: new THREE.Vector3(), q: new THREE.Quaternion(), k: 1 };
  const take = WHEEL;

  // ─── Physics: the screen is a box, the tokens are coins in it ─────────────
  // Each token is a rigid disc standing in the plane of the screen (radius CR, mass 1, moment of inertia ½mr²) under
  // gravity, inside a box the shape of the screen, rounded corners included. Contacts are impulses: restitution 0.3
  // (metal on metal bounces little, and below 1.2 units/s not at all, so a pile rests), Coulomb friction 0.35 (a coin
  // rolls along the floor rather than skating, so its icon turns as it goes, as a real coin's would), and a small
  // positional push so a pile does not sink into itself. Stepped six times a frame. While the wheel turns, the app
  // holds the tokens; once the phone leans they are let go, and once it is upright again and they have come to rest,
  // they float back into the wheel, still pushing each other aside, and the wheel takes them again.
  const PH = { g: 34, e: 0.3, mu: 0.35, sub: 6, iters: 8, lin: 0.22, ang: 0.9, slop: 0.002 };
  const R = CR, I = 0.5 * R * R, KT = 2 + 2 * R * R / I, KW = 1 + R * R / I;   // effective masses along the tangent
  const bodies = coins.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, a: 0, w: 0, wob: new Spring(0, { stiffness: 420, zeta: 0.2 }), ax: new THREE.Vector3(1, 0, 0) }));
  const kin = coins.map(() => ({ p: new THREE.Vector3(), q: new THREE.Quaternion(), k: 1, last: new THREE.Vector3(), has: false }));
  const box = { l: -2.5, r: 2.5, b: -6, t: 6, rc: 0.7 };
  let mode = 'wheel', mix = 0, calm = 0, gatherT = 0, mergeT = 0;
  const qp = new THREE.Quaternion(), qz = new THREE.Quaternion(), ql = new THREE.Quaternion(), Z = new THREE.Vector3(0, 0, 1), d2r = Math.PI / 180, RM = 1.62;
  // a coin in a thin box rests leaning a little on the glass, front or back, so it catches the side lights
  const LEAN = coins.map((_, i) => ({ axis: new THREE.Vector3(Math.cos(i * 2.4), Math.sin(i * 2.4), 0), a: (i % 2 ? -1 : 1) * (0.32 + 0.1 * ((i * 7) % 3)) }));
  const kick = (b, imp, tx, ty) => { if (imp < 0.9) return; b.ax.set(tx, ty, 0); b.wob.v += Math.min(1.6, imp * 0.35) * (Math.random() < 0.5 ? -1 : 1); };
  // a contact against something that does not move: a wall, or a rounded corner; n points into the box
  function wall(b, nx, ny, pen) {
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      const jn = -(1 + (vn < -1.2 ? PH.e : 0)) * vn, tx = -ny, ty = nx;
      b.vx += jn * nx; b.vy += jn * ny;
      const vt = (b.vx + b.w * R * ny) * tx + (b.vy - b.w * R * nx) * ty;   // the contact point's speed along the wall
      const jt = Math.max(-PH.mu * jn, Math.min(PH.mu * jn, -vt / KW));
      b.vx += jt * tx; b.vy += jt * ty; b.w -= jt * R / I;
      kick(b, -vn, tx, ty);
    }
    if (pen > PH.slop) { b.x += nx * (pen - PH.slop) * 0.8; b.y += ny * (pen - PH.slop) * 0.8; }
  }
  function step(dt, gx, gy, pull, t) {
    const h = dt / PH.sub, dl = Math.exp(-PH.lin * h), da = Math.exp(-PH.ang * h);
    for (let s = 0; s < PH.sub; s++) {
      bodies.forEach((b, i) => {
        b.vx += gx * h; b.vy += gy * h;
        if (pull > 0) {                                     // back to its place on the wheel, and upright
          const th = take.angle(i, t), K = 26 * pull, C = 2 * 0.95 * Math.sqrt(K);
          b.vx += (K * (RM * Math.cos(th) - b.x) - C * b.vx) * h; b.vy += (K * (RM * Math.sin(th) - b.y) - C * b.vy) * h;
          b.w += (-18 * pull * wrap(b.a) - 2 * 0.9 * Math.sqrt(18 * pull) * b.w) * h;
        }
        b.vx *= dl; b.vy *= dl; b.w *= da;
        b.x += b.vx * h; b.y += b.vy * h; b.a += b.w * h;
      });
      for (let it = 0; it < PH.iters; it++) {
        for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
          const bi = bodies[i], bj = bodies[j], dx = bj.x - bi.x, dy = bj.y - bi.y, d = Math.hypot(dx, dy);
          if (d >= 2 * R || d < 1e-6) continue;
          const nx = dx / d, ny = dy / d, tx = -ny, ty = nx;
          const rvx = (bj.vx + bj.w * R * ny) - (bi.vx - bi.w * R * ny), rvy = (bj.vy - bj.w * R * nx) - (bi.vy + bi.w * R * nx);
          const vn = rvx * nx + rvy * ny;
          if (vn < 0) {
            const jn = -(1 + (vn < -1.2 ? PH.e : 0)) * vn / 2;
            bi.vx -= jn * nx; bi.vy -= jn * ny; bj.vx += jn * nx; bj.vy += jn * ny;
            const vt = rvx * tx + rvy * ty, jt = Math.max(-PH.mu * jn, Math.min(PH.mu * jn, -vt / KT));
            bi.vx -= jt * tx; bi.vy -= jt * ty; bj.vx += jt * tx; bj.vy += jt * ty;
            bi.w -= jt * R / I; bj.w -= jt * R / I;
            kick(bi, -vn, tx, ty); kick(bj, -vn, tx, ty);
          }
          const pen = 2 * R - d;
          if (pen > PH.slop) { const c = (pen - PH.slop) * 0.4; bi.x -= nx * c; bi.y -= ny * c; bj.x += nx * c; bj.y += ny * c; }
        }
        for (const b of bodies) {
          const L = box.l + R, Rr = box.r - R, B = box.b + R, Tt = box.t - R, cl = box.l + box.rc, cr = box.r - box.rc, cb = box.b + box.rc, ct = box.t - box.rc;
          const cx = b.x < cl ? cl : b.x > cr ? cr : null, cy = b.y < cb ? cb : b.y > ct ? ct : null;
          if (cx != null && cy != null) {                   // in a corner: the rounded corner is the wall
            const ex = b.x - cx, ey = b.y - cy, d = Math.hypot(ex, ey), lim = box.rc - R;
            if (d > lim) wall(b, -ex / d, -ey / d, d - lim);
          } else {
            if (b.x < L) wall(b, 1, 0, L - b.x); if (b.x > Rr) wall(b, -1, 0, b.x - Rr);
            if (b.y < B) wall(b, 0, 1, B - b.y); if (b.y > Tt) wall(b, 0, -1, b.y - Tt);
          }
        }
      }
    }
    bodies.forEach((b) => b.wob.step(dt));
  }
  const energy = () => bodies.reduce((s, b) => s + b.vx * b.vx + b.vy * b.vy + 0.3 * b.w * b.w, 0);

  return {
    scene, tEnd: take.tRest,
    calm: () => mode === 'wheel',
    // the screen's edges, in the plane of the tokens; corner radius as the device's
    setBox(l, r, b, t, rc) { Object.assign(box, { l, r, b, t, rc: Math.max(rc, R + 0.02) }); },
    update(t, now, ex, dt = 0) {
      const reduce = reduced(), tt = reduce ? take.tRest : t, sway = reduce ? 0 : ease.inOutSine(seg(t, take.tRest, take.tRest + 2));
      // where the wheel would hold each token now
      coins.forEach((c, i) => {
        take.pose(i, tt, o); const k = kin[i];
        k.last.copy(k.p); k.p.copy(o.p); k.q.copy(o.q); k.k = o.k; if (!k.has) { k.last.copy(o.p); k.has = true; }
      });
      // the phone's lean decides: let go, fall, rest, come back
      const lean = Math.abs(roll.x), still = lean < 6 && Math.abs(roll.v) < 2;
      if (mode === 'wheel' && lean > 8 && ex === 0) {
        bodies.forEach((b, i) => {                          // let go where they are, moving as they were
          const k = kin[i]; b.x = k.p.x; b.y = k.p.y; b.vx = dt ? (k.p.x - k.last.x) / dt : 0; b.vy = dt ? (k.p.y - k.last.y) / dt : 0; b.a = 0; b.w = 0;
        });
        mode = 'fall'; calm = 0;
      }
      if ((mode === 'gather' || mode === 'merge') && lean > 8) mode = 'fall';
      if (mode === 'fall') { mix = Math.min(1, mix + dt / 0.4); calm = still ? calm + dt : 0; if (calm > 1.1 && energy() < 0.4) { mode = 'gather'; gatherT = 0; } }
      else if (mode === 'gather') { gatherT += dt; mix = Math.min(1, mix + dt / 0.4); if (gatherT > 2.3) { mode = 'merge'; mergeT = 0; } }
      else if (mode === 'merge') { mergeT += dt; mix = 1 - ease.inOutSine(clamp01(mergeT / 0.9)); if (mergeT >= 0.9) { mode = 'wheel'; mix = 0; } }
      if (mode !== 'wheel') {
        const al = roll.x * d2r, gs = mode === 'fall' ? 1 : 1 - ease.inOutSine(clamp01(gatherT / 0.5));
        const pull = mode === 'fall' ? 0 : ease.inOutSine(clamp01(gatherT / 0.8));
        step(Math.min(dt, 1 / 30), Math.sin(al) * PH.g * gs, -Math.cos(al) * PH.g * gs, pull, t);
      }
      const m = ease.inOutSine(mix);
      rig.rotation.set((-0.1 + sway * 0.04 * Math.sin(now / 5.2)) * (1 - m), (0.06 + sway * 0.05 * Math.sin(now / 6.7 + 1.3)) * (1 - m), 0);
      const shrink = 1 - ease.inCubic(ex);
      coins.forEach((c, i) => {
        const k = kin[i], b = bodies[i];
        if (m <= 0) {
          c.coin.position.copy(k.p).multiplyScalar(lerp(0.3, 1, shrink)); c.coin.quaternion.copy(k.q); c.coin.scale.setScalar(Math.max(1e-3, k.k * shrink));
          return;
        }
        // a coin: turned in the plane by its roll, rocked out of it by the last knock
        qp.setFromAxisAngle(LEAN[i].axis, LEAN[i].a).multiply(ql.setFromAxisAngle(b.ax, b.wob.x)).multiply(qz.setFromAxisAngle(Z, b.a));
        c.coin.position.set(lerp(k.p.x, b.x, m), lerp(k.p.y, b.y, m), lerp(k.p.z, 0, m));
        c.coin.quaternion.slerpQuaternions(k.q, qp, m);
        c.coin.scale.setScalar(lerp(k.k, 1, m));
      });
    },
    dispose() { geos.forEach((g) => g.dispose()); satin.dispose(); polish.dispose(); env.dispose(); }
  };
}

/* mountTokens(host, o): the screen goes into host (give it a size; with the frame the phone, 390 × 844, scales to fit,
   and it is made for a box about 900px tall). o: { labels: { eyebrow, title, cta, initials, search, analytics, cards,
   step, hero, turn, upright, gyro, replay, nogl }, frame (false: the screen fills host, for a real phone), controls
   (false: no buttons beside the phone; the frame only), autoplay (false: the tokens wait for replay()), fonts (false:
   don't load DM Sans), gyroscope (false: never read the phone's tilt. Otherwise, with the frame, the turn button reads it
   on a touch screen; without it, the phone's own tilt moves the tokens, on iOS once the wheel is tapped) }.
   Returns { ready, replay(), turn(side), gyroscope(), turned, destroy() }. "Continue" fires "tokenscontinue", which
   bubbles up through host. */
export function mountTokens(host, o = {}) {
  const L = Object.assign({}, LABELS);
  for (const k in o.labels || {}) if (o.labels[k] != null) L[k] = String(o.labels[k]);   // a word left out keeps its default
  const frame = o.frame !== false, controls = frame && o.controls !== false;
  css(); if (o.fonts !== false) fonts();
  // the piece lays itself out in a shell of its own that fills host, so the page's styles on host (its display, its
  // padding) leave it alone: host only gives it its size
  const root = document.createElement('div'); root.className = 'tk-root'; root.dataset.frame = frame ? 'on' : 'off';
  host.appendChild(root);
  if (springCurve()) root.style.setProperty('--tk-spring', springCurve());
  const area = document.createElement('div'); area.className = 'tk-area';
  const device = document.createElement('div'); device.className = 'tk-device'; device.dataset.phase = 'wait';
  device.innerHTML = SCREEN(L); area.appendChild(device); root.appendChild(area);
  let tools = null;
  if (controls) { tools = document.createElement('div'); tools.className = 'tk-tools'; tools.innerHTML = TOOLS(L); root.appendChild(tools); }
  const canvas = device.querySelector('canvas'), hero = device.querySelector('.tk-hero'), cta = device.querySelector('.tk-cta');
  const turnBtn = tools && tools.querySelector('[data-tk="turn"]'), turnLbl = turnBtn && turnBtn.querySelector('.tk-sr');
  const setPhase = (done) => { const p = done ? 'done' : 'wait'; if (device.dataset.phase !== p) device.dataset.phase = p; };

  const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = reduceMq.matches;
  const onReduce = (e) => { reduce = e.matches; };
  reduceMq.addEventListener('change', onReduce);

  // ─── Renderer, and a camera that puts the wheel's centre in the hero slot ──
  let renderer = null;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!o.preserveDrawingBuffer }); }
  catch (e) { device.classList.add('tk-nogl-on'); setPhase(true); }
  const FOV = 26, view = { W: 390, H: 844, cx: 195, cy: 420, ppu: 90 };
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100), _size = new THREE.Vector2();
  if (renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0x000000, 0);
  }
  let tokens = null;
  function layout() {
    if (!renderer) return;
    // measured untransformed (offsets, not bounding boxes), so the layout holds while the phone is turned
    view.W = Math.max(1, device.offsetWidth); view.H = Math.max(1, device.offsetHeight);
    view.cx = hero.offsetLeft + hero.offsetWidth / 2; view.cy = hero.offsetTop + hero.offsetHeight * 0.53;   // a touch low: the top token lifts
    view.ppu = Math.max(1, Math.min(hero.offsetHeight / 5.2, view.W / 5.6));   // the wheel, about 4 units across, with room above for the token that lifts
    const sz = renderer.getSize(_size);
    if (sz.x !== view.W || sz.y !== view.H) renderer.setSize(view.W, view.H, false);   // (a canvas given its size again is cleared)
    const d = view.H / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * view.ppu);
    camera.aspect = view.W / view.H; camera.position.set(0, 0, d); camera.lookAt(0, 0, 0);
    camera.setViewOffset(view.W, view.H, view.W / 2 - view.cx, view.H / 2 - view.cy, view.W, view.H);
    camera.updateProjectionMatrix();
    // the box the tokens fall in: the screen's edges in the plane of the tokens (at z = 0 a unit is ppu pixels everywhere)
    if (tokens) { const u = view.ppu, m = 0.04; tokens.setBox(-view.cx / u + m, (view.W - view.cx) / u - m, -(view.H - view.cy) / u + m, view.cy / u - m, frame ? 50 / u : 0); }
  }

  // ─── Turning the phone ───────────────────────────────────────────────────
  // `turn` is the mock-up's roll in degrees, clockwise (90 = on its side, its right edge down); the button turns it to
  // its side and back. A real phone's gyroscope adds its own roll instead (`gyro`), and the mock-up stays as it is drawn.
  // Gravity always points to the real floor, so inside the screen it turns the other way: the tokens feel it once the
  // phone leans past a few degrees (makeTokens).
  const turn = new Spring(0, { stiffness: 15, zeta: 1 });       // a hand turning a phone: unhurried, no overshoot
  const gyro = new Spring(0, { stiffness: 15, zeta: 1 });
  let gyroOn = false, gyroTarget = 0, onTilt = null, dead = false;
  const roll = { get x() { return turn.x + gyro.x; }, get v() { return turn.v + gyro.v; } };
  // the mock-up turns about its centre and scales so that, at every angle, it fits the room the box has (never above its
  // real size); the room it takes follows it, so the buttons stay right beside it and slide along as it lies down
  // (a layer of its own only while it turns: one kept at rest would stay drawn at the scale it started at, soft once it grows)
  let rootW = 0, rootH = 0, lastTf = '', lastBox = '', layer = false;
  function fit() {
    if (!frame) return;
    const beside = controls && root.dataset.tools === 'side', below = controls && !beside;
    const W = rootW - (beside ? 48 + 28 : 0), H = rootH - (below ? 48 + 20 : 0);
    const a = THREE.MathUtils.degToRad(turn.x), c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)), bw = 410 * c + 864 * s, bh = 410 * s + 864 * c;
    const k = Math.max(0.05, Math.min(1, (W - 8) / bw, (H - 8) / bh));
    const tf = `rotate(${turn.x.toFixed(2)}deg) scale(${k.toFixed(4)})`, moving = Math.abs(turn.x - turn.target) > 0.01 || Math.abs(turn.v) > 0.01;
    if (moving !== layer) device.style.willChange = (layer = moving) ? 'transform' : '';
    if (tf !== lastTf) device.style.transform = lastTf = tf;
    const w = ((390 * c + 844 * s) * k).toFixed(1) + 'px', h = ((390 * s + 844 * c) * k).toFixed(1) + 'px';   // the screen's own footprint: its rim spills over, as a phone's does
    if (w + h !== lastBox) { lastBox = w + h; area.style.width = w; area.style.height = h; }
  }
  function place() {
    const cs = getComputedStyle(root);
    rootW = root.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); rootH = root.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (controls) { const side = rootW >= rootH * 0.62 ? 'side' : 'below'; if (root.dataset.tools !== side) root.dataset.tools = side; }
    fit();
  }
  function setTurnLabel(side) {
    if (!turnBtn) return;
    const l = gyroOn ? L.gyro : side ? L.upright : L.turn;
    turnLbl.textContent = turnBtn.title = l; turnBtn.setAttribute('aria-pressed', String(gyroOn || side));
  }
  function setTurn(side) {
    if (side == null) side = turn.target < 45;
    turn.target = side ? 90 : 0; setTurnLabel(side);
    return side;
  }
  // a real phone: its roll from the gyroscope. It has to be asked from a tap (iOS asks the person first); inside a page
  // that may not read the sensor, no reading comes, and it resolves false
  function startGyro() {
    if (gyroOn) return Promise.resolve(true);
    if (!('DeviceOrientationEvent' in window)) return Promise.resolve(false);
    const ask = typeof DeviceOrientationEvent.requestPermission === 'function' ? DeviceOrientationEvent.requestPermission().catch(() => 'denied') : Promise.resolve('granted');
    return ask.then((p) => new Promise((res) => {
      if (p !== 'granted' || dead) return res(false);
      let got = false;
      const on = (e) => { if (e.gamma == null) return; got = true; gyroTarget = Math.max(-90, Math.min(90, e.gamma)); };
      addEventListener('deviceorientation', on);
      setTimeout(() => {
        if (got && !dead) { gyroOn = true; onTilt = on; turn.target = 0; setTurnLabel(false); res(true); }
        else { removeEventListener('deviceorientation', on); res(false); }
      }, 900);
    }));
  }
  if (turnBtn) turnBtn.addEventListener('click', () => {
    if (gyroOn) return;
    const touch = o.gyroscope !== false && matchMedia('(pointer: coarse)').matches;
    (touch ? startGyro() : Promise.resolve(false)).then((on) => { if (!on && !dead) setTurn(); });
  });

  // ─── The loop ──────────────────────────────────────────────────────────────
  const EXIT = 0.4;
  let t = 0, exitT = -1, prev = performance.now(), onScreen = false, playing = o.autoplay !== false, again = false, raf = 0, shown = null;
  const ready = new Promise((r) => { shown = r; });
  function replay() {
    if (!tokens) return;
    if (!playing) { playing = true; return; }
    if (exitT >= 0) return;
    if (!tokens.calm()) { again = true; return; }             // the tokens are loose: once the wheel has them back
    again = false;
    if (reduce) { t = tokens.tEnd; return; }
    exitT = 0; setPhase(false);
  }
  function frameLoop(now) {
    raf = requestAnimationFrame(frameLoop);
    const dt = Math.min(0.1, Math.max(0, (now - prev) / 1000)); prev = now;
    if (!onScreen || document.hidden || !tokens) return;
    if (exitT >= 0) { exitT += dt; if (exitT >= EXIT) { exitT = -1; t = 0; } } else if (playing) t += dt;
    if (reduce && exitT < 0 && playing) t = Math.max(t, tokens.tEnd);
    if (gyroOn) gyro.target = gyroTarget;
    turn.step(dt); gyro.step(dt); fit();
    tokens.update(t, now / 1000, exitT >= 0 ? exitT / EXIT : 0, dt);
    if (again && tokens.calm()) replay();
    setPhase(exitT < 0 && playing && t >= tSuccess);
    renderer.render(tokens.scene, camera);
    if (shown) { shown(); shown = null; }
  }
  // without the frame this is the phone itself: its own tilt moves the tokens. Android reads it at once; iOS asks the
  // person first, and only from a tap, so it asks on the first tap on the wheel
  const iosAsk = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
  const phoneGyro = !frame && o.gyroscope !== false;
  if (phoneGyro && !iosAsk) startGyro();
  const onHero = () => { if (phoneGyro && iosAsk && !gyroOn) startGyro(); if (tokens && tokens.calm()) replay(); };
  const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHero(); } };
  const onCta = () => root.dispatchEvent(new CustomEvent('tokenscontinue', { bubbles: true }));
  hero.addEventListener('click', onHero); hero.addEventListener('keydown', onKey); cta.addEventListener('click', onCta);
  if (tools) tools.querySelector('[data-tk="replay"]').addEventListener('click', replay);
  const ro = new ResizeObserver(() => { place(); layout(); });
  ro.observe(root); ro.observe(device); ro.observe(hero);
  const io = new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; }); io.observe(area);
  if (renderer) { tokens = makeTokens(renderer, roll, () => reduce); place(); layout(); t = reduce && playing ? tokens.tEnd : 0; raf = requestAnimationFrame(frameLoop); }
  else if (shown) { shown(); shown = null; place(); }

  return {
    ready,
    replay,
    turn: (side) => (gyroOn ? false : setTurn(side)),       // true: on its side, false: upright, nothing: the other way
    gyroscope: startGyro,
    get turned() { return turn.target > 45; },
    destroy() {
      dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      reduceMq.removeEventListener('change', onReduce);
      if (onTilt) removeEventListener('deviceorientation', onTilt);
      if (tokens) tokens.dispose();
      if (renderer) { renderer.dispose(); renderer.forceContextLoss(); }
      root.remove();
    }
  };
}
