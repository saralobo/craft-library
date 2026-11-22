// Iridescent card · Sara Lobo Library
// A metal credit card in 3D: brushed iridescent plate, a fine struck frame along the edge, a chip and the Visa mark.
// It arrives with a slow half turn, from its back to its face, and a tap turns it over to show the numbers.
//
//   import { mountCard } from './card.js';
//   const card = mountCard(document.querySelector('#wallet'));   // fills the element, card centred
//   card.turn();  card.show('back');  card.play();  card.destroy();
//
// Needs three.js 0.169 (imported from jsDelivr below) and the card-visa.png file next to this one.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const DEFAULTS = {
  name: 'Sara Lobo', number: ['4532', '8890', '1274', '3306'], expiry: '08/30', cvv: '412',   // fails Luhn on purpose
  logo: new URL('card-visa.png', import.meta.url).href,   // the official Visa mark (Wikimedia Commons, public domain)
  size: 0.72,          // the card's height as a share of the element's height (it also keeps 12% clear at the sides)
  entrance: true,      // the half turn when it mounts
  interactive: true,   // tap, drag and keys turn it over
  transparent: true,   // the page shows around the card; false paints the ground black
  label: 'Cartão de crédito. Pressione para virar e ver o verso.',
  manual: false,       // no loop of its own: call frame(ms) to draw (used to film it)
};

// ─── Geometry: an ID-1 card (85.6 × 53.98 mm, r 3.18 mm), stood upright ──────
const H = 3.4, W = H * 53.98 / 85.6, R = H * 3.18 / 85.6, T = 0.056;
const BEVEL = 0.016;                                   // a fully rounded rim, so the edge catches a line of silver
// The relief: a slim frame along each face's edge, a hair higher than the plate, ending in a fine chamfer.
const FRAME = { inset: 0.05, chamfer: 0.007, height: 0.0035 };
const REST_X = 0.05, REST_Y = -0.26;                   // a three-quarter pose: the right edge in view
const CW = W - 2 * BEVEL, CH = H - 2 * BEVEL;

// ─── Motion ─────────────────────────────────────────────────────────────────
class Spring {
  constructor(value = 0, { stiffness = 220, zeta = 0.7 } = {}) {
    this.x = value; this.v = 0; this.target = value;
    this.k = stiffness; this.c = 2 * zeta * Math.sqrt(stiffness);
  }
  step(dt) {
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let i = 0; i < n; i++) { this.v += (-this.k * (this.x - this.target) - this.c * this.v) * h; this.x += this.v * h; }
    return this.x;
  }
}
// The entrance: each channel eases from its offset to the rest pose over its own time, and both curves end with
// no speed and no acceleration, so the card comes to rest without a step.
const EASE = {
  out: (s) => 1 - (1 - s) ** 3,                       // already moving: it fades in as it comes forward
  glide: (s) => s * s * (6 - 8 * s + 3 * s * s),      // from rest, fastest at a third, then a long soft slowdown
};
const ENTRANCE = {
  fade: { from: 1, dur: 0.8 },                         // out of the dark
  z: { from: -1.6, dur: 1.6 },                         // from just behind its place
  spin: { from: -Math.PI, dur: 1.6, ease: 'glide' },   // showing its back, a slow half turn to the face
};
const settle = (t, { from, dur, ease = 'out' }) => from * (1 - EASE[ease](Math.min(1, Math.max(0, t / dur))));
const ENTRANCE_END = 1.6;

// ─── The light on the plate ─────────────────────────────────────────────────
// A lilac pool in the top-left corner cut by a soft diagonal, a ribbon of teal green just under that edge, royal
// blue down the right, sinking to ink at the foot. u runs left → right, v top → bottom.
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix3 = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const LILAC = [152, 128, 204], PERIWINKLE = [108, 120, 198], TEAL = [42, 152, 138], DEEP = [20, 38, 104],
  ROYAL = [50, 62, 158], ROYAL_D = [24, 30, 100], DUSK = [12, 15, 54], INK = [3, 5, 14];
function lightField(u, v) {
  const d = v - (0.26 + 0.76 * u);
  const lit = 1 - ss(-0.12, 0.18, d);
  const dim = (1 - 0.25 * ss(0.15, 0.6, u)) * (1 - 0.4 * ss(0.35, 0.85, v)) * (1 - 0.1 * ss(0.14, 0, v));
  const upper = mix3(LILAC, PERIWINKLE, Math.min(1, ss(0.1, 0.5, u) * 0.8 + ss(0.25, 0.7, v) * 0.5)).map((x) => x * dim);
  const lower = mix3(mix3(TEAL, DEEP, ss(0.04, 0.42, d)), INK, ss(0.3, 0.6, d));
  let right = mix3(ROYAL, ROYAL_D, ss(0.65, 1.0, u));
  right = mix3(mix3(right, DUSK, ss(0.6, 0.82, v)), INK, ss(0.8, 0.96, v));
  const foot = 1 - 0.86 * ss(0.6, 0.94, v);
  return mix3(mix3(lower, upper, lit), right, ss(0.42, 0.86, u)).map((x) => x * foot);
}
// Painted wider than the card (−0.35…1.35) so the light can slide when the card turns.
const FIELD_PAD = 0.35, SHIFT_GAIN = 0.8;
const TW = 1024, TH = Math.round(TW * H / W), U = TW / 100;   // print canvas, and 1% of the card's width
const JOST = '"Jost", "Futura", ui-sans-serif, system-ui, sans-serif';
const INK_PRINT = 'rgba(242,240,250,0.94)', MUTED_PRINT = 'rgba(222,220,240,0.5)';

function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }
function canvas2d(w = TW, h = TH) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function fieldCanvas() {
  const fw = 160, fh = Math.round(fw * H / W), [c, g] = canvas2d(fw, fh), img = g.createImageData(fw, fh);
  for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) {
    const u = -FIELD_PAD + (1 + 2 * FIELD_PAD) * (i + 0.5) / fw, v = -FIELD_PAD + (1 + 2 * FIELD_PAD) * (j + 0.5) / fh;
    const [r, gg, b] = lightField(u, v), k = (j * fw + i) * 4;
    img.data[k] = r; img.data[k + 1] = gg; img.data[k + 2] = b; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}
// The brushed grooves: thin bright lines on strips of slightly different shade, constant down the card.
// R holds the line, G the shade of the strip it sits on.
function grooveCanvas(seed) {
  const r = rng(seed), marks = [];
  for (let x = 6 + r() * 10; x < TW; x += 15 + r() * 20) {
    marks.push([x, 0.9 + r() * 1.4, 0.35 + r() * 0.65]);
    if (r() < 0.22) marks.push([x + 4 + r() * 3, 0.8 + r(), 0.25 + r() * 0.4]);
  }
  const [c, g] = canvas2d(TW, 1), img = g.createImageData(TW, 1);
  let m = 0, shade = 0;
  for (let i = 0; i < TW; i++) {
    if (m < marks.length && i >= marks[m][0]) { shade = (r() - 0.5) * 0.12; m++; }
    let line = 0;
    for (const [mx, w, s] of marks) { const d = (i - mx) / w; if (d > -4 && d < 4) line += Math.exp(-d * d) * s; }
    img.data[i * 4] = Math.min(1, line) * 255; img.data[i * 4 + 1] = (0.5 + shade * 4) * 255; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return { canvas: c, data: img.data };
}
// Roughness in G, metalness in B (three.js reads them from these channels).
function paintSurface(g, grooves, roughBase, metal) {
  for (let x = 0; x < TW; x++) {
    g.fillStyle = `rgb(0,${Math.round(255 * (roughBase - grooves[x * 4] / 255 * 0.16))},${Math.round(metal * 255)})`;
    g.fillRect(x, 0, 1, TH);
  }
}
// Print goes on a transparent layer over the plate (a) and into the surface map (b), where it is smoother and more
// metallic than the brushed plate, so it glints as the card turns.
function printer(a, b) {
  return (str, x, y, { size, weight = 300, tracking = 0, fill, align = 'left' }) => {
    for (const [g, style] of [[a, fill], [b, 'rgb(0,42,235)']]) {
      g.font = `${weight} ${size * U}px ${JOST}`;
      g.letterSpacing = `${tracking * size * U}px`;   // tracking in em
      g.textAlign = align;
      g.fillStyle = style;
      g.fillText(str, x, y);
    }
  };
}
function tinted(img, w, h, fill) {
  const [c, g] = canvas2d(Math.round(w), Math.round(h));
  g.drawImage(img, 0, 0, c.width, c.height);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = fill; g.fillRect(0, 0, c.width, c.height);
  return c;
}
function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function chipCanvas() {
  const [c, g] = canvas2d(256, 320);
  const grd = g.createLinearGradient(0, 0, 256, 320);
  grd.addColorStop(0, '#d4d3d6'); grd.addColorStop(0.55, '#a7a6ad'); grd.addColorStop(1, '#bebdc3');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 320);
  g.strokeStyle = 'rgba(78,78,86,0.7)'; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(128, 0); g.lineTo(128, 92);                     // centre spine
  g.moveTo(128, 228); g.lineTo(128, 320);
  g.roundRect(84, 92, 88, 136, 18);                        // the die pad
  g.moveTo(0, 112); g.lineTo(84, 112); g.moveTo(172, 112); g.lineTo(256, 112);
  g.moveTo(0, 208); g.lineTo(84, 208); g.moveTo(172, 208); g.lineTo(256, 208);
  g.moveTo(84, 160); g.lineTo(40, 160); g.quadraticCurveTo(30, 160, 30, 170); g.lineTo(30, 208);
  g.moveTo(172, 160); g.lineTo(226, 160); g.quadraticCurveTo(236, 160, 236, 150); g.lineTo(236, 112);
  g.stroke();
  return c;
}
// The typeface of the print: Jost, from Google Fonts, added to the page once.
function loadJost() {
  if (!document.querySelector('link[data-craft-jost]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.dataset.craftJost = '';
    l.href = 'https://fonts.googleapis.com/css2?family=Jost:wght@300;400&display=swap';
    document.head.appendChild(l);
  }
  return Promise.race([
    Promise.all(['300 40px', '400 40px'].map((f) => document.fonts.load(`${f} "Jost"`))),
    new Promise((r) => setTimeout(r, 3000)),
  ]).catch(() => {});
}

export function mountCard(container, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = reduceMq.matches;
  const onReduce = (e) => { reduce = e.matches; };
  reduceMq.addEventListener('change', onReduce);

  // ─── Renderer ─────────────────────────────────────────────────────────────
  const host = document.createElement('div');
  host.className = 'craft-card';
  host.style.cssText = 'position:absolute;inset:0;outline:none;touch-action:none;-webkit-tap-highlight-color:transparent';
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  if (o.interactive) { host.setAttribute('role', 'button'); host.tabIndex = 0; host.setAttribute('aria-label', o.label); }
  container.appendChild(host);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: o.transparent, powerPreference: 'high-performance', preserveDrawingBuffer: o.manual });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, o.transparent ? 0 : 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // No tone mapping: Neutral's toe pulls the dark violets toward saturated blue.
  renderer.toneMapping = THREE.NoToneMapping;
  const canvas = renderer.domElement;
  canvas.style.cssText = 'display:block;width:100%;height:100%;transition:opacity 160ms ease';
  host.appendChild(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const disposables = [];
  const keep = (x) => { disposables.push(x); return x; };

  // ─── Studio ───────────────────────────────────────────────────────────────
  // The colour of the plate comes from its own light field, so the sky stays black where the face looks at rest.
  // The panels show when the card turns, and give the rim its line of silver.
  function bake(env) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const rt = pmrem.fromScene(env, 0.02);
    pmrem.dispose();
    env.traverse((n) => { if (n.isMesh) { n.geometry.dispose(); n.material.dispose(); } });
    return keep(rt).texture;
  }
  function panels(env, list) {
    for (const [w, h, intensity, tint, pos] of list) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(intensity), side: THREE.DoubleSide }));
      m.position.set(...pos); m.lookAt(0, 0, 0);
      env.add(m);
    }
    return env;
  }
  scene.environment = bake(panels(new THREE.Scene(), [
    [4, 3, 1.8, 0xffffff, [-5, 5, 4]],                    // key, top left in front
    [7, 9, 1.4, 0xf2f2ff, [6, 0.5, -1.5]],                // right side: the silver of the edge
    [8, 2.5, 0.9, 0xffffff, [0, 6, 1]],                   // top rim
    [3, 6, 0.3, 0xdfe2ff, [-7, 0, -1]],                   // dim left
  ]));
  // The edge gets a brighter studio of its own, with an aqua and a violet strip its metal picks up as it turns.
  const rimScene = new THREE.Scene();
  rimScene.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'varying vec3 vP; void main(){ gl_FragColor = vec4(mix(vec3(.012,.012,.02), vec3(.07,.07,.09), vP.y * .5 + .5), 1.); }',
  })));
  const rimEnv = bake(panels(rimScene, [
    [4, 4, 0.5, 0xf0eeff, [-4, 1.2, 4.6]],                // front fill, brighter toward the top left
    [4, 4, 0.16, 0xc8d4ff, [-1.2, -2.6, 5.2]],            // and fading toward the bottom
    [4, 3, 2.4, 0xffffff, [-5, 5, 4]],                    // key
    [7, 9, 1.6, 0xeef8ff, [6, 0.5, -1.5]],                // right side
    [8, 2.5, 1.2, 0xffffff, [0, 6, 1]],                   // top
    [5, 1.2, 1.1, 0x6ff0dc, [3, -3.5, 4]],                // aqua
    [5, 1.2, 1.0, 0x9a78ff, [-5, -3, 1]],                 // violet
  ]));

  // ─── Textures, painted once ───────────────────────────────────────────────
  function texture(c, srgb) {
    const t = keep(new THREE.CanvasTexture(c));
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = aniso;
    return t;
  }
  const field = texture(fieldCanvas(), true);
  const frontG = grooveCanvas(7), backG = grooveCanvas(31);
  const frontGrooves = texture(frontG.canvas, false), backGrooves = texture(backG.canvas, false);
  let logo = null;
  const [fc, fg] = canvas2d(), [fsC, fsG] = canvas2d();
  function paintFront() {
    fg.clearRect(0, 0, TW, TH);
    paintSurface(fsG, frontG.data, 0.32, 0.6);
    if (!logo) return;
    const w = 0.24 * TW, h = w * logo.naturalHeight / logo.naturalWidth;
    const x = 0.865 * TW - w, y = 0.918 * TH - h;
    fg.drawImage(tinted(logo, w, h, 'rgba(246,246,252,0.97)'), x, y);
    fsG.drawImage(tinted(logo, w, h, 'rgb(0,42,235)'), x, y);     // smooth and metallic, so it glints
  }
  // The back: a slim glossy stripe, then one column of small type with room around it.
  const stripe = { x: 0.075, w: 0.12 };
  const [bc, bg] = canvas2d(), [bsC, bsG] = canvas2d();
  function paintBack() {
    bg.clearRect(0, 0, TW, TH);
    const band = bg.createLinearGradient(stripe.x * TW, 0, (stripe.x + stripe.w) * TW, 0);
    band.addColorStop(0, 'rgba(7,7,13,0.97)'); band.addColorStop(0.5, 'rgba(18,18,30,0.97)'); band.addColorStop(1, 'rgba(7,7,13,0.97)');
    bg.fillStyle = band; bg.fillRect(stripe.x * TW, 0, stripe.w * TW, TH);
    paintSurface(bsG, backG.data, 0.34, 0.6);
    bsG.fillStyle = 'rgb(0,40,40)'; bsG.fillRect(stripe.x * TW, 0, stripe.w * TW, TH);
    const print = printer(bg, bsG), x0 = (stripe.x + stripe.w + 0.085) * TW, col2 = x0 + 21 * U;
    print(o.name.toUpperCase(), x0, 0.108 * TH, { size: 2.9, weight: 400, tracking: 0.24, fill: INK_PRINT });
    const yN = 0.69 * TH;
    print(`${o.number[0]}  ${o.number[1]}`, x0, yN, { size: 5.2, tracking: 0.12, fill: INK_PRINT });
    print(`${o.number[2]}  ${o.number[3]}`, x0, yN + 7.6 * U, { size: 5.2, tracking: 0.12, fill: INK_PRINT });
    const yL = 0.835 * TH;
    print('VALID THRU', x0, yL, { size: 2.1, weight: 400, tracking: 0.2, fill: MUTED_PRINT });
    print('CVV', col2, yL, { size: 2.1, weight: 400, tracking: 0.2, fill: MUTED_PRINT });
    print(o.expiry, x0, yL + 4.9 * U, { size: 3.4, tracking: 0.12, fill: INK_PRINT });
    print(o.cvv, col2, yL + 4.9 * U, { size: 3.4, tracking: 0.12, fill: INK_PRINT });
  }
  paintFront(); paintBack();
  const frontDetail = texture(fc, true), frontSurf = texture(fsC, false);
  const backDetail = texture(bc, true), backSurf = texture(bsC, false);
  frontDetail.premultiplyAlpha = backDetail.premultiplyAlpha = true;   // clean type edges in the mipmaps
  // The back is seen through the card's −z side, so its u runs the other way.
  for (const t of [backDetail, backSurf]) { t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; }
  const repaint = () => { paintFront(); paintBack(); for (const t of [frontDetail, frontSurf, backDetail, backSurf]) t.needsUpdate = true; };
  const logoReady = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = o.logo;
    img.decode().then(() => { logo = img; }, () => {}).then(resolve);
  });

  // ─── Materials ────────────────────────────────────────────────────────────
  // The entrance fade: every material ends scaled by the same amount (an opacity fade on a transparent canvas,
  // a fade from black on an opaque one).
  const fadeU = { value: 1 };
  function withFade(m) {
    const own = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      own.call(m, sh, r);
      sh.uniforms.uFade = fadeU;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uFade;')
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor *= uFade;');
    };
    return keep(m);
  }
  // A physical metal whose colour is the light field, sampled with an offset that follows the face's angle, so
  // turning the card slides the light across it. The grooves and the print stay put.
  function plate(detail, surf, grooves) {
    const shift = { value: new THREE.Vector2() };
    const m = new THREE.MeshPhysicalMaterial({
      map: detail, roughnessMap: surf, metalnessMap: surf,
      roughness: 1, metalness: 1,
      emissive: 0xffffff, emissiveIntensity: 1,
      clearcoat: 0.5, clearcoatRoughness: 0.12,
      iridescence: 0.25, iridescenceIOR: 1.4, iridescenceThicknessRange: [220, 520],
    });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { uField: { value: field }, uGroove: { value: grooves }, uShift: shift });
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform sampler2D uField, uGroove;
          uniform vec2 uShift;
          // Height of the relief at a point of the face (card units, centred): the frame along the edge stands
          // FRAME.height above the plate and steps down over the chamfer.
          float frameHeight( vec2 p ) {
            vec2 q = abs( p ) - vec2( ${(CW / 2 - (R - BEVEL)).toFixed(4)}, ${(CH / 2 - (R - BEVEL)).toFixed(4)} );
            float inset = ${(R - BEVEL).toFixed(4)} - length( max( q, 0.0 ) ) - min( max( q.x, q.y ), 0.0 );
            return ${FRAME.height.toFixed(4)} * ( 1.0 - smoothstep( ${(FRAME.inset - FRAME.chamfer).toFixed(4)}, ${(FRAME.inset + FRAME.chamfer).toFixed(4)}, inset ) );
          }`)
        .replace('#include <map_fragment>', `
          vec4 detail = texture2D( map, vMapUv );
          vec3 light = texture2D( uField, ( vMapUv + uShift + ${FIELD_PAD.toFixed(2)} ) / ${(1 + 2 * FIELD_PAD).toFixed(2)} ).rgb;
          vec2 groove = texture2D( uGroove, vec2( vMapUv.x, 0.5 ) ).rg;
          vec3 plateColor = light * ( 1.0 + ( groove.g - 0.5 ) * 0.5 ) + groove.r * 0.6 * ( light + 0.004 );
          vec3 surfaceColor = plateColor * ( 1.0 - detail.a ) + detail.rgb;
          // The relief: the frame's chamfer lit from the top left (the light leans as the card turns), so the inner
          // walls facing it brighten and the others fall into shade, the way a struck edge reads.
          vec2 cp = ( vMapUv - 0.5 ) * vec2( ${CW.toFixed(4)}, ${CH.toFixed(4)} );
          const float reliefE = 0.0015;
          vec2 slope = vec2( frameHeight( cp + vec2( reliefE, 0.0 ) ) - frameHeight( cp - vec2( reliefE, 0.0 ) ),
                             frameHeight( cp + vec2( 0.0, reliefE ) ) - frameHeight( cp - vec2( 0.0, reliefE ) ) ) / ( 2.0 * reliefE );
          vec3 reliefN = normalize( vec3( -slope, 1.0 ) );
          vec3 reliefL = normalize( vec3( -0.55 + uShift.x * 1.5, 0.65 + uShift.y * 1.5, 0.55 ) );
          float relief = dot( reliefN, reliefL ) - reliefL.z;
          surfaceColor = surfaceColor * ( 1.0 + relief * 1.4 ) + max( relief, 0.0 ) * vec3( 0.2, 0.22, 0.26 );
          diffuseColor.rgb *= surfaceColor;
          // The aqua beam: a band along the light's diagonal edge that runs ahead of the light when the card turns
          // and lights up the grooves it crosses, the way brushed metal streaks.
          vec2 gp = vMapUv + uShift * 2.4;
          float gb = ( 1.0 - gp.y ) - ( 0.17 + 0.76 * gp.x );
          float glint = exp( -gb * gb / 0.005 ) * ( 1.0 - smoothstep( 0.2, 0.62, gp.x ) ) * ( 0.15 + groove.r * 0.95 ) * ( 1.0 - detail.a );`)
        .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance = totalEmissiveRadiance * surfaceColor + vec3( 0.72, 0.96, 1.0 ) * glint * 0.22;');
    };
    m.userData.shift = shift.value;
    return withFade(m);
  }
  const frontMat = plate(frontDetail, frontSurf, frontGrooves), backMat = plate(backDetail, backSurf, backGrooves);
  const edgeMat = withFade(new THREE.MeshStandardMaterial({ color: 0xc4c4d0, metalness: 1, roughness: 0.28, envMap: rimEnv }));

  // ─── The card ─────────────────────────────────────────────────────────────
  const capUV = {
    generateTopUV(g, v, a, b, c) { return [a, b, c].map((i) => new THREE.Vector2(v[i * 3] / CW + 0.5, v[i * 3 + 1] / CH + 0.5)); },
    generateSideWallUV() { return [0, 0, 0, 0].map(() => new THREE.Vector2()); },
  };
  const geo = keep(new THREE.ExtrudeGeometry(roundedRect(CW, CH, R - BEVEL), {
    depth: T - 2 * BEVEL, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 6,
    curveSegments: 14, UVGenerator: capUV,
  }));
  geo.translate(0, 0, -(T - 2 * BEVEL) / 2);
  { // split the lid group into back (first half) and front (second half); the sides stay on their own
    const [lids, sides] = geo.groups, half = lids.count / 2;
    geo.clearGroups();
    geo.addGroup(lids.start, half, 0);
    geo.addGroup(lids.start + half, half, 1);
    geo.addGroup(sides.start, sides.count, 2);
  }
  const card = new THREE.Mesh(geo, [backMat, frontMat, edgeMat]);
  // the chip, inlaid on the front
  const chipW = W * 0.167, chipH = H * 0.128;
  const chipTex = texture(chipCanvas(), true);
  const chip = new THREE.Mesh(
    keep(new THREE.ShapeGeometry(roundedRect(chipW, chipH, chipW * 0.12), 6)),
    withFade(new THREE.MeshStandardMaterial({ map: chipTex, emissiveMap: chipTex, metalness: 0.9, roughness: 0.35, emissive: 0xffffff, emissiveIntensity: 0.55 })),
  );
  { const p = chip.geometry.attributes.position, uv = chip.geometry.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / chipW + 0.5, p.getY(i) / chipH + 0.5); }
  chip.position.set(W * 0.05, H * 0.5 - H * 0.166, T / 2 + 0.0008);

  const flipNode = new THREE.Group(); flipNode.add(card, chip);
  const spinNode = new THREE.Group(); spinNode.add(flipNode);           // the entrance's half turn
  const tiltNode = new THREE.Group(); tiltNode.rotation.order = 'YXZ'; tiltNode.add(spinNode);
  const root = new THREE.Group(); root.add(tiltNode);
  scene.add(root);

  // How far the light slides for a given turn of the face, measured from the rest pose.
  const REST_N = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(REST_X, REST_Y, 0, 'YXZ'));
  const _n = new THREE.Vector3();
  function slideLight(mat, side) {
    _n.set(0, 0, side).transformDirection(flipNode.matrixWorld);
    mat.userData.shift.set(                              // tanh eases into the edge of the painted field
      FIELD_PAD * Math.tanh((_n.x - REST_N.x) * SHIFT_GAIN / FIELD_PAD),
      FIELD_PAD * Math.tanh((_n.y - REST_N.y) * SHIFT_GAIN / FIELD_PAD),
    );
  }

  // ─── Layout: the card at `size` of the element's height, centred ───────────
  function fit() {
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const byH = H / o.size / 2 / tan, byW = W / 0.76 / 2 / tan / camera.aspect;
    camera.position.set(0, 0, Math.max(byH, byW));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(fit); ro.observe(host);
  fit();

  // ─── Motion state ─────────────────────────────────────────────────────────
  const flip = new Spring(0, { stiffness: 16, zeta: 1 });       // a heavy turn, no overshoot: a metal card
  const tiltX = new Spring(0, { stiffness: 120, zeta: 0.9 });   // faces the pointer
  const tiltY = new Spring(0, { stiffness: 120, zeta: 0.9 });
  let entrance = null;                                          // { t0 } while the half turn plays
  let ready = false, arriving = false;

  function play() {
    flip.x = flip.target = 0; flip.v = 0;
    entrance = { t0: null };
    arriving = true;
    if (reduce) { entrance = null; arriving = false; fadeIn(); }
  }
  function fadeIn() { canvas.style.opacity = '0'; requestAnimationFrame(() => { canvas.style.opacity = '1'; }); }
  function turn(dir = 1) {
    const target = (Math.round(flip.target / Math.PI) + dir) * Math.PI;
    if (reduce) {                                               // no travel: fade out, swap faces, fade in
      canvas.style.opacity = '0';
      setTimeout(() => { flip.x = flip.target = target; flip.v = 0; canvas.style.opacity = '1'; changed(); }, 170);
      return;
    }
    flip.target = target;
    changed();
  }
  function show(face) {
    entrance = null; arriving = false;
    flip.x = flip.target = face === 'back' ? Math.PI : 0; flip.v = 0;
    changed();
  }
  const faceNow = () => (Math.round(flip.target / Math.PI) % 2 !== 0 ? 'back' : 'front');
  let lastFace = 'front';
  function changed() {
    const f = faceNow();
    if (f === lastFace) return;
    lastFace = f;
    host.dispatchEvent(new CustomEvent('cardturn', { bubbles: true, detail: { face: f } }));
  }

  // ─── Input ────────────────────────────────────────────────────────────────
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hitCard(e) {
    const r = host.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(card, false)[0];
  }
  let drag = null;
  const on = (el, type, fn) => { el.addEventListener(type, fn); return () => el.removeEventListener(type, fn); };
  const off = [];
  if (o.interactive) {
    off.push(on(host, 'pointerdown', (e) => {
      if (arriving || !hitCard(e)) return;
      host.setPointerCapture(e.pointerId);
      drag = { x0: e.clientX, x: e.clientX, t: e.timeStamp, vel: 0, moved: false, side: e.clientX };
    }));
    off.push(on(host, 'pointermove', (e) => {
      if (e.pointerType === 'mouse' && !drag) {
        const r = host.getBoundingClientRect();
        tiltY.target = ((e.clientX - r.left) / r.width * 2 - 1) * 0.1;     // ±6° and ±4°: the face follows the pointer
        tiltX.target = ((e.clientY - r.top) / r.height * 2 - 1) * 0.07;
        host.style.cursor = hitCard(e) ? 'pointer' : 'default';
      }
      if (!drag || reduce) return;
      if (!drag.moved && Math.abs(e.clientX - drag.x0) < 6) return;
      drag.moved = true;
      const dx = e.clientX - drag.x, k = Math.PI / (host.getBoundingClientRect().width * 0.55);
      const dts = Math.max(8, e.timeStamp - drag.t) / 1000;
      flip.x += dx * k; flip.target = flip.x;
      drag.vel = drag.vel * 0.3 + (dx * k / dts) * 0.7;
      drag.x = e.clientX; drag.t = e.timeStamp;
    }));
    const release = (e) => {
      if (!drag) return;
      if (!drag.moved) {                                        // pressing a side pushes it away
        const r = host.getBoundingClientRect();
        turn(drag.side > r.left + r.width / 2 ? 1 : -1);
      } else {
        const vel = e.timeStamp - drag.t > 90 ? 0 : drag.vel;   // a hand that stopped carries no throw
        flip.v = vel;
        flip.target = Math.round((flip.x + vel * 0.16) / Math.PI) * Math.PI;
        changed();
      }
      drag = null;
    };
    off.push(on(host, 'pointerup', release), on(host, 'pointercancel', release));
    off.push(on(host, 'pointerleave', (e) => { if (e.pointerType === 'mouse') { tiltX.target = 0; tiltY.target = 0; } }));
    off.push(on(host, 'keydown', (e) => {
      if (arriving) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); turn(1); }
      if (e.key === 'ArrowRight') turn(1);
      if (e.key === 'ArrowLeft') turn(-1);
    }));
  }

  // ─── The frame ────────────────────────────────────────────────────────────
  let prev = null;
  function draw(now) {
    const dt = prev === null ? 1 / 60 : Math.min(0.1, (now - prev) / 1000); prev = now;
    let fade = 0, z = 0, spin = 0;
    if (entrance) {
      if (entrance.t0 === null && ready) entrance.t0 = now;
      const t = entrance.t0 === null ? 0 : (now - entrance.t0) / 1000;
      fade = settle(t, ENTRANCE.fade); z = settle(t, ENTRANCE.z); spin = settle(t, ENTRANCE.spin);
      if (t > ENTRANCE_END - 0.05) arriving = false;
      if (t >= ENTRANCE_END) entrance = null;
    }
    if (!drag) flip.step(Math.min(dt, 1 / 30));
    tiltX.step(Math.min(dt, 1 / 30)); tiltY.step(Math.min(dt, 1 / 30));
    const swayY = reduce ? 0 : Math.sin(now / 4300) * 0.06;      // 27 s and 19.5 s cycles: it breathes, never spins
    const swayX = reduce ? 0 : Math.sin(now / 3100 + 1.3) * 0.025;
    const bob = reduce ? 0 : Math.sin(now / 2600) * 0.015;
    root.position.set(0, bob, z);
    spinNode.rotation.y = spin;
    flipNode.rotation.y = flip.x;
    tiltNode.rotation.y = REST_Y + tiltY.x + swayY;
    tiltNode.rotation.x = REST_X + tiltX.x + swayX;
    fadeU.value = 1 - fade;
    root.updateMatrixWorld();
    slideLight(frontMat, 1); slideLight(backMat, -1);
    renderer.render(scene, camera);
  }

  // The card waits for its print (the logo and the typeface) and for the GPU, so nothing pops in as it arrives.
  const whenReady = Promise.allSettled([logoReady, loadJost()]).then(() => {
    repaint();
    for (const t of [frontDetail, frontSurf, backDetail, backSurf]) renderer.initTexture(t);
    renderer.compile(scene, camera);
    ready = true;
  });
  if (o.entrance) play(); else { fadeU.value = 1; }

  let raf = 0, visible = true, io = null;
  if (!o.manual) {
    const loop = (now) => {
      if (!host.isConnected) { api.destroy(); return; }       // taken off the page: let the GPU go
      raf = requestAnimationFrame(loop);
      if (visible && !document.hidden) draw(now); else prev = null;
    };
    raf = requestAnimationFrame(loop);
    io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(host);
  }

  const api = {
    element: host,
    ready: whenReady,
    play, turn, show,
    get face() { return faceNow(); },
    frame: (ms) => draw(ms),                                    // manual mode: draw the card at this time
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect(); if (io) io.disconnect();
      off.forEach((f) => f()); reduceMq.removeEventListener('change', onReduce);
      disposables.forEach((d) => d.dispose && d.dispose());
      renderer.dispose(); host.remove();
    },
  };
  return api;
}
