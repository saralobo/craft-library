// Liquid pay · Sara Lobo Library
// Slide to pay, with a drop of liquid chrome for a handle. Dragged slowly it stretches and follows the finger, heavy and
// without bounce; dragged too fast it pinches off two to four droplets that run after it and merge back in through a thin
// bridge of metal. Let go early and it flows back to the start and settles with a small ripple. Tilt the phone and it runs
// to the low side of the track, like mercury; the tilt alone never pays, only a drag to the end does. At the end the drop
// is pulled into the Pay button and fills it with chrome, and a light crosses it.
//
//   import { mountLiquid } from './liquid.js';
//   const pay = mountLiquid(document.querySelector('#pay'), {   // the track goes inside the element
//     label: 'Slide to pay', cta: 'Pay', width: 320,
//   });
//   host.addEventListener('liquidconfirm', () => pay());       // fired once, when the drop reaches the end
//   pay.reset();  pay.tilt(0.4);  pay.tilt(null);  pay.destroy();
//
// WebGL, no dependencies: the drop is a field of metaballs drawn in one fragment shader, moved by a small spring
// simulation. Without WebGL it draws flat discs on a 2D canvas.

// ─── The feel: everything worth tuning is here ─────────────────────────────────────────────────────────────────────
const W = 320, H = 64;                 // the track, in its own units (the piece scales with `width`)
const INSET = 6;                       // from the track's edge to the Pay button and to the drop at rest
const PAY_R = 26;                      // the Pay button's radius
const START = INSET + PAY_R, END = W - INSET - PAY_R, MID = H / 2;
const R_MAIN = 18, R_TAIL = 13;        // the drop is two balls: the head the finger holds and a tail that lags behind
const R_FILL = 25.5;                   // the head's radius once it has filled the Pay button
const CONFIRM_AT = 0.92;               // share of the track a drag has to reach to pay
const SOFT_STOP = 0.8;                 // without a finger, tilt can carry the drop this far and no further

const K_DRAG = 1100, C_DRAG = 56;      // how tightly the head follows the finger (spring, damping)
const K_TAIL = 320, C_TAIL = 16;       // the tail's pull toward the head: low damping, so it wobbles as it settles
const K_RETURN = 55, C_RETURN = 16;    // the slow, heavy flow back to the start when let go on a level phone
const K_LEVEL = 400, C_LEVEL = 30;     // the pull back to the track's centre line
const GRAVITY = 1500;                  // units/s² at full tilt
const TILT_DEADZONE = 0.06;            // below this the phone counts as level
const VISCOSITY = 5;                   // drag on a drop flowing freely under tilt

const SPLIT_SPEED = 900;               // finger speed (units/s) above which the stretched tail can pinch off
const SPLIT_STRETCH = 30;              // head-to-tail distance at which it pinches off
const SPLIT_COOLDOWN = 0.09;           // s between two pinches
const MAX_DROPLETS = 4;
const R_HEAD_MIN = 13;                 // the head never gives away more than this
const MERGE_SPEED = 260;               // the droplets run back to the head only once it slows below this
const K_PULL = 70, C_DROP = 7;         // the droplets' pull back (surface tension) and their drag

const SHEEN_DELAY = 0.52, SHEEN_TIME = 0.8;   // s: the light that crosses the filled button

const FONTS = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap';

const CSS = `
.lq { --lq-w: 320px; position: relative; display: block; width: var(--lq-w); height: calc(var(--lq-w) / 5); border-radius: 999px;
  background: linear-gradient(180deg, #050505, #0c0c0d); touch-action: none; -webkit-user-select: none; user-select: none;
  -webkit-tap-highlight-color: transparent; cursor: grab; outline: none;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .075), inset 0 1px 0 rgba(255, 255, 255, .05), inset 0 calc(var(--lq-w) * .02) calc(var(--lq-w) * .045) rgba(0, 0, 0, .85);
  font-family: "DM Sans", -apple-system, "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
.lq.is-dragging { cursor: grabbing; }
.lq.is-paid { cursor: default; }
.lq:focus-visible { box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .075), 0 0 0 2px #000, 0 0 0 3.5px rgba(255, 255, 255, .7); }
.lq-label { position: absolute; top: 0; bottom: 0; left: calc(var(--lq-w) * .17); right: calc(var(--lq-w) * .2); display: flex;
  align-items: center; justify-content: center; pointer-events: none; font-size: calc(var(--lq-w) * .047); font-weight: 400; letter-spacing: .01em; }
.lq-label span { color: transparent; -webkit-background-clip: text; background-clip: text; background-size: 260% 100%;
  background-image: linear-gradient(90deg, rgba(255, 255, 255, .32) 0%, rgba(255, 255, 255, .32) 40%, rgba(255, 255, 255, .8) 50%, rgba(255, 255, 255, .32) 60%, rgba(255, 255, 255, .32) 100%);
  animation: lq-shine 3.4s cubic-bezier(.45, 0, .25, 1) infinite; }
@keyframes lq-shine { 0% { background-position: 100% 0; } 55%, 100% { background-position: 0% 0; } }
.lq-gl { position: absolute; inset: 0; width: 100%; height: 100%; display: block; pointer-events: none; }
.lq-pay { position: absolute; top: calc(var(--lq-w) * ${INSET / W}); right: calc(var(--lq-w) * ${INSET / W}); width: calc(var(--lq-w) * ${2 * PAY_R / W});
  height: calc(var(--lq-w) * ${2 * PAY_R / W}); margin: 0; padding: 0; border-radius: 50%; border: 1px solid rgba(255, 255, 255, .14); background: transparent;
  color: rgba(255, 255, 255, .62); font: 500 calc(var(--lq-w) * .044) / 1 "DM Sans", -apple-system, "Helvetica Neue", Arial, sans-serif; letter-spacing: .01em;
  cursor: inherit; outline: none; transition: color .45s ease .1s, border-color .35s ease; -webkit-tap-highlight-color: transparent; }
.lq-pay:focus-visible { box-shadow: 0 0 0 2px #000, 0 0 0 3.5px rgba(255, 255, 255, .7); }
.lq.is-paid .lq-pay { color: transparent; border-color: transparent; }
@media (prefers-reduced-motion: reduce) { .lq-label span { animation: none; background-position: 100% 0; } .lq-pay { transition: none; } }
`;

const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const FRAG = `precision highp float;
uniform vec2 uRes;uniform float uScale;uniform vec4 uB[8];uniform float uLight;uniform float uSheen;uniform float uAlpha;
float field(vec2 p){float f=0.;for(int i=0;i<8;i++){vec4 b=uB[i];if(b.z<=0.)continue;vec2 d=p-b.xy;f+=b.z*b.z/(dot(d,d)+.0001);}return f;}
float hgt(float f){return sqrt(clamp(1.-1./max(f,1.),0.,1.));}
vec3 env(vec3 r){
  float L=uLight,y=r.y;
  float c=mix(.13,.92,smoothstep(-.08,.8,y));
  c*=1.-.78*exp(-pow((y+.05)*8.,2.));
  c+=.62*exp(-pow((y-.24)*9.,2.))*(.55+.45*smoothstep(.9,.1,abs(r.x+L*.8)));
  c+=.34*smoothstep(-.35,-.95,y);
  c+=.5*exp(-pow((r.x-.58+L)*6.,2.))*smoothstep(-.4,.35,y);
  c+=.22*exp(-pow((r.x+.7+L*.5)*8.,2.))*smoothstep(-.2,.5,y);
  vec3 col=vec3(c);
  return col*mix(vec3(1.),vec3(.93,.97,1.05),smoothstep(-.2,.7,y));
}
void main(){
  vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uScale;
  float f=field(p),e=.6;
  float fx0=field(p-vec2(e,0.)),fx1=field(p+vec2(e,0.)),fy0=field(p-vec2(0.,e)),fy1=field(p+vec2(0.,e));
  float w=length(vec2(fx1-fx0,fy1-fy0)/(2.*e))/uScale+1e-4;
  float a=smoothstep(1.-w,1.+w,f);
  float sh=smoothstep(.42,1.,field(p-vec2(0.,2.5)))*(1.-a)*.6;
  if(a<=0.&&sh<=0.){gl_FragColor=vec4(0.);return;}
  float k=22./(2.*e);
  vec3 n=normalize(vec3(-(hgt(fx1)-hgt(fx0))*k,(hgt(fy1)-hgt(fy0))*k,1.));
  vec3 r=reflect(vec3(0.,0.,-1.),n);
  vec3 col=env(r)*(.74+.5*pow(1.-n.z,3.));
  col+=.7*exp(-pow((p.x-uSheen+(p.y-${MID}.)*.45)/9.,2.));
  float A=a*uAlpha;
  gl_FragColor=vec4(min(col,vec3(1.))*A,max(A,sh*uAlpha));
}`;

let fontsLoaded = false;
function loadFonts() {
  if (fontsLoaded || typeof document === 'undefined') return;
  fontsLoaded = true;
  if (document.querySelector('link[href*="family=DM+Sans"]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = FONTS;
  document.head.appendChild(l);
}
function addCss() {
  if (document.getElementById('craft-liquid')) return;
  const s = document.createElement('style');
  s.id = 'craft-liquid'; s.textContent = CSS;
  document.head.appendChild(s);
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function mountLiquid(host, o = {}) {
  addCss();
  if (o.fonts !== false) loadFonts();
  const label = o.label || 'Slide to pay', cta = o.cta || 'Pay';

  const root = document.createElement('div');
  root.className = 'lq';
  root.tabIndex = 0;
  root.setAttribute('role', 'slider');
  root.setAttribute('aria-label', label);
  root.setAttribute('aria-valuemin', '0');
  root.setAttribute('aria-valuemax', '100');
  root.setAttribute('aria-valuenow', '0');
  root.innerHTML = '<span class="lq-label" aria-hidden="true"><span></span></span><canvas class="lq-gl" aria-hidden="true"></canvas><button class="lq-pay" type="button"></button>';
  const labelEl = root.firstChild, canvas = root.children[1], payBtn = root.children[2];
  labelEl.firstChild.textContent = label;
  payBtn.textContent = cta;
  host.appendChild(root);

  let width = 320;
  const setWidth = (w) => { width = Math.max(160, +w || 320); root.style.setProperty('--lq-w', width + 'px'); };
  setWidth(o.width);

  // ─── state ───
  const ball = (x, r) => ({ x, y: MID, vx: 0, vy: 0, r, rt: r });
  const head = ball(START, R_MAIN), tail = ball(START, R_TAIL);
  let drops = [];
  let dragging = false, grab = 0, target = START, pointerId = null, lastPX = 0, lastPT = 0, fingerV = 0, cooldown = 0;
  let keyTarget = null;
  let paid = false, paidT = 0, alpha = 1, fadeIn = false;
  let tiltGyro = 0, tiltManual = o.tilt == null ? null : clamp(+o.tilt, -1, 1), tiltSmooth = 0, tiltY = 0;
  let t = 0, raf = 0, prev = 0, onScreen = true, dead = false, acc = 0;

  const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = reduceMq.matches;
  const onReduce = () => { reduce = reduceMq.matches; };
  reduceMq.addEventListener('change', onReduce);

  const progress = () => clamp((head.x - START) / (END - START), 0, 1);
  const tiltX = () => (tiltManual != null ? tiltManual : tiltGyro);

  // ─── drawing ───
  let gl = null, prog = null, uni = {}, ctx2d = null;
  const BALLS = new Float32Array(32);
  try { gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true }); } catch (e) { gl = null; }
  if (gl) {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'a');
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      for (const n of ['uRes', 'uScale', 'uB', 'uLight', 'uSheen', 'uAlpha']) uni[n] = gl.getUniformLocation(prog, n);
    } catch (e) { console.warn('Liquid pay: WebGL failed, drawing flat', e); gl = null; }
  }
  if (!gl) ctx2d = canvas.getContext('2d');

  let scale = 1;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = root.clientWidth || width;
    scale = (cw / W) * dpr;
    canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
  }

  function sheenX() {
    if (!paid || reduce) return -999;
    const k = (paidT - SHEEN_DELAY) / SHEEN_TIME;
    return k <= 0 || k >= 1 ? -999 : END - 60 + ease(k) * 150;
  }

  function draw() {
    const all = [head, tail, ...drops];
    const breathe = !dragging && !paid ? 1 + 0.018 * Math.sin(t * 1.9) : 1;
    for (let i = 0; i < 8; i++) {
      const b = all[i];
      BALLS[i * 4] = b ? b.x : 0; BALLS[i * 4 + 1] = b ? b.y : 0;
      BALLS[i * 4 + 2] = b ? Math.max(0, b.r * (i === 0 ? breathe : 1)) : 0; BALLS[i * 4 + 3] = 0;
    }
    if (gl) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uni.uRes, canvas.width, canvas.height);
      gl.uniform1f(uni.uScale, scale);
      gl.uniform4fv(uni.uB, BALLS);
      gl.uniform1f(uni.uLight, tiltSmooth * 0.35 + clamp(head.vx * 0.00035, -0.25, 0.25));
      gl.uniform1f(uni.uSheen, sheenX());
      gl.uniform1f(uni.uAlpha, alpha);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else if (ctx2d) {
      ctx2d.setTransform(scale, 0, 0, scale, 0, 0);
      ctx2d.clearRect(0, 0, W, H);
      ctx2d.globalAlpha = alpha;
      for (const b of all) {
        if (b.r <= 0.5) continue;
        const g = ctx2d.createRadialGradient(b.x - b.r * .3, b.y - b.r * .4, b.r * .1, b.x, b.y, b.r * 1.15);
        g.addColorStop(0, '#fafafa'); g.addColorStop(.55, '#8d8f93'); g.addColorStop(1, '#1b1c1e');
        ctx2d.fillStyle = g; ctx2d.beginPath(); ctx2d.arc(b.x, b.y, b.r * 1.15, 0, Math.PI * 2); ctx2d.fill();
      }
    }
  }

  // ─── physics, at a fixed step ───
  const DT = 1 / 120;
  function wall(b, hi) {
    const lo = INSET + b.r * 0.9;
    if (b.x < lo) { b.x = lo; if (b.vx < 0) b.vx *= -0.12; }
    if (b.x > hi) { b.x = hi; if (b.vx > 0) b.vx *= -0.12; }
    const top = INSET + b.r * 0.9, bot = H - INSET - b.r * 0.9;
    if (top < bot) { if (b.y < top) { b.y = top; b.vy *= -0.12; } if (b.y > bot) { b.y = bot; b.vy *= -0.12; } }
    else b.y = MID;
  }
  function level(b, ay) { return K_LEVEL * (MID - b.y) - C_LEVEL * b.vy + ay; }

  function step(dt) {
    const tx = tiltX(), free = Math.abs(tx) > TILT_DEADZONE;
    const gx = (dragging || paid) ? 0 : tx * GRAVITY, gy = paid ? 0 : tiltY * GRAVITY * 0.25;
    cooldown = Math.max(0, cooldown - dt);

    // the head
    let ax;
    if (paid) ax = 260 * (END - head.x) - 26 * head.vx;
    else if (dragging || keyTarget != null) ax = K_DRAG * ((dragging ? target : keyTarget) - head.x) - C_DRAG * head.vx;
    else if (free) ax = gx - VISCOSITY * head.vx;
    else ax = K_RETURN * (START - head.x) - C_RETURN * head.vx;
    head.vx += ax * dt; head.vy += level(head, gy) * dt;
    if (reduce && (dragging || keyTarget != null)) { head.x = dragging ? target : keyTarget; head.vx = 0; }
    head.x += head.vx * dt; head.y += head.vy * dt;
    const hiHead = paid ? END : (dragging || keyTarget != null) ? W - INSET - head.r * 0.9 : START + SOFT_STOP * (END - START);
    wall(head, hiHead);

    // the tail: a spring to the head, so the drop stretches when it moves and wobbles when it stops
    if (reduce) { tail.x = head.x; tail.y = head.y; tail.vx = head.vx; tail.vy = head.vy; }
    else {
      const k = paid ? 900 : K_TAIL, c = paid ? 60 : C_TAIL;
      tail.vx += (k * (head.x - tail.x) - c * (tail.vx - head.vx) + gx * 0.6) * dt;
      tail.vy += (k * (head.y - tail.y) - c * (tail.vy - head.vy) + level(tail, gy) * 0.3) * dt;
      tail.x += tail.vx * dt; tail.y += tail.vy * dt;
      wall(tail, W - INSET - tail.r * 0.9);
    }

    // pinch-off: stretched too far by a fast finger, the tail lets a droplet go
    const stretch = head.x - tail.x;
    if (!reduce && dragging && !paid && cooldown === 0 && drops.length < MAX_DROPLETS && Math.abs(fingerV) > SPLIT_SPEED && Math.abs(stretch) > SPLIT_STRETCH && head.rt > R_HEAD_MIN) {
      const dir = Math.sign(stretch) || 1, r = 5.5 + Math.random() * 2.5;
      drops.push({ x: tail.x - dir * tail.r * 0.55, y: tail.y + (Math.random() - .5) * 4, vx: head.vx * 0.3, vy: (Math.random() - .5) * 30, r: 0.5, rt: r });
      tail.x += dir * 10; tail.vx = head.vx * 0.7;
      cooldown = SPLIT_COOLDOWN;
    }

    // the droplets: they lag, then run back and merge once the head slows (surface tension)
    const headSpeed = Math.abs(head.vx);
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      const pull = paid ? 300 : headSpeed < MERGE_SPEED ? K_PULL : 0;
      d.vx += (pull * (head.x - d.x) - C_DROP * d.vx + gx) * dt;
      d.vy += (pull * (head.y - d.y) * 0.5 + level(d, gy) * 0.4) * dt;
      d.x += d.vx * dt; d.y += d.vy * dt;
      d.r += (d.rt - d.r) * 0.25;
      wall(d, W - INSET - d.r * 0.9);
      if (Math.hypot(d.x - head.x, d.y - head.y) < (head.r + d.r) * 0.55) drops.splice(i, 1);
    }

    // volume: what the droplets carry, the head gives up; it gets it back as they merge
    let given = 0;
    for (const d of drops) given += d.rt * d.rt;
    head.rt = paid ? R_FILL : Math.sqrt(Math.max(R_HEAD_MIN * R_HEAD_MIN, R_MAIN * R_MAIN - given));
    tail.rt = paid ? 0 : R_TAIL;
    head.r += (head.rt - head.r) * (paid ? 0.05 : 0.2);
    tail.r += (tail.rt - tail.r) * (paid ? 0.06 : 0.2);

    if ((dragging || keyTarget != null) && !paid && progress() >= CONFIRM_AT) pay();
  }

  // ─── paying ───
  let lastNow = -1;
  function pay() {
    if (paid) return;
    paid = true; paidT = 0;
    if (pointerId != null) { try { root.releasePointerCapture(pointerId); } catch (e) {} }
    dragging = false; pointerId = null; keyTarget = null;
    root.classList.remove('is-dragging');
    root.setAttribute('aria-valuenow', '100');
    if (reduce) { head.x = END; head.r = R_FILL; tail.r = 0; drops = []; alpha = 0; fadeIn = true; }
    if (navigator.vibrate) { try { navigator.vibrate(14); } catch (e) {} }
    setTimeout(() => { if (paid && !dead) root.classList.add('is-paid'); }, reduce ? 0 : 280);
    root.dispatchEvent(new CustomEvent('liquidconfirm', { bubbles: true }));
  }
  function reset() {
    paid = false; paidT = 0; alpha = 1; fadeIn = false; drops = []; keyTarget = null;
    root.classList.remove('is-paid');
    head.rt = R_MAIN; tail.rt = R_TAIL;
    if (reduce) { head.x = tail.x = START; head.r = R_MAIN; tail.r = R_TAIL; }
  }

  // ─── the loop ───
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!onScreen) { prev = now; return; }
    const dt = Math.min(0.05, prev ? (now - prev) / 1000 : 0);
    prev = now;
    t += dt; acc += dt;
    if (paid) paidT += dt;
    if (fadeIn) { alpha = Math.min(1, alpha + dt / 0.35); if (alpha >= 1) fadeIn = false; }
    tiltSmooth += (tiltX() - tiltSmooth) * Math.min(1, dt * 6);
    let n = 0;
    while (acc >= DT && n < 10) { step(DT); acc -= DT; n++; }
    if (n === 10) acc = 0;
    fingerV *= Math.pow(0.02, dt);
    const p = progress();
    labelEl.style.opacity = String(clamp(1 - p * 1.8, 0, 1) * (paid ? 0 : 1));
    if (!paid) { const v = String(Math.round(p * 100)); if (root.getAttribute('aria-valuenow') !== v) root.setAttribute('aria-valuenow', v); }
    draw();
  }

  // ─── input ───
  const localX = (e) => { const r = root.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * W; };
  function onDown(e) {
    if (paid || (e.button != null && e.button > 0)) return;
    if (gyroWanted && !gyroOn && iosAsk) startGyro();
    const x = localX(e);
    if (Math.abs(x - head.x) > 46) return;
    dragging = true; keyTarget = null; pointerId = e.pointerId; grab = head.x - x; target = head.x;
    lastPX = x; lastPT = e.timeStamp || performance.now(); fingerV = 0;
    root.classList.add('is-dragging');
    try { root.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  }
  function onMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    const x = localX(e), now = e.timeStamp || performance.now(), dtm = Math.max(1, now - lastPT);
    fingerV = fingerV * 0.55 + ((x - lastPX) / dtm) * 1000 * 0.45;
    lastPX = x; lastPT = now;
    target = clamp(x + grab, START, END + 8);
  }
  function onUp(e) {
    if (e.pointerId !== pointerId) return;
    dragging = false; pointerId = null;
    root.classList.remove('is-dragging');
  }
  function onKey(e) {
    if (paid) return;
    const stepK = (END - START) * 0.1;
    let k = keyTarget != null ? keyTarget : head.x;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') k += stepK;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') k -= stepK;
    else if (e.key === 'Home') k = START;
    else if (e.key === 'End') k = END + 8;
    else if (e.key === 'Enter') { e.preventDefault(); pay(); return; }
    else return;
    e.preventDefault();
    keyTarget = clamp(k, START, END + 8);
    if (keyTarget <= START + 0.5) keyTarget = null;
  }
  // the Pay button pays from the keyboard or a screen reader; a tap on it only pays once the drop is nearly there
  function onPay(e) { if (e.detail === 0 || progress() > 0.85) pay(); }
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onUp);
  root.addEventListener('keydown', onKey);
  payBtn.addEventListener('click', onPay);

  // ─── the phone's tilt. Android reads it at once; iOS asks the person first, from a tap, so it asks on the first touch ───
  const gyroWanted = o.gyroscope !== false && typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  const iosAsk = gyroWanted && typeof DeviceOrientationEvent.requestPermission === 'function';
  let gyroOn = false, asking = null;
  function onOrient(e) {
    if (e.gamma == null) return;
    gyroOn = true;
    const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    const a = ((ang % 360) + 360) % 360;
    // the screen's own left-right, whichever way the phone is held
    const lr = a === 90 ? e.beta : a === 180 ? -e.gamma : a === 270 ? -e.beta : e.gamma;
    const fb = a === 90 ? -e.gamma : a === 180 ? -e.beta : a === 270 ? e.gamma : e.beta;
    tiltGyro = clamp(lr / 35, -1, 1);
    tiltY = clamp((fb - 35) / 60, -1, 1);   // a phone held at a comfortable 35° counts as level
  }
  function startGyro() {
    if (gyroOn) return Promise.resolve(true);
    if (!gyroWanted) return Promise.resolve(false);
    if (asking) return asking;
    const ask = iosAsk ? DeviceOrientationEvent.requestPermission().catch(() => 'denied') : Promise.resolve('granted');
    return (asking = ask.then((p) => { if (p === 'granted' && !dead) addEventListener('deviceorientation', onOrient); return p === 'granted'; }));
  }
  if (gyroWanted && !iosAsk) startGyro();

  const ro = new ResizeObserver(resize); ro.observe(root);
  const io = new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; }); io.observe(root);
  resize();
  raf = requestAnimationFrame(frame);

  return {
    element: root,
    reset,
    pay,
    tilt: (v) => { tiltManual = v == null ? null : clamp(+v, -1, 1); },   // -1 to 1, for a page without a gyroscope; null hands back to the phone
    gyroscope: startGyro,                                                   // call it from a tap: iOS asks the person first
    width: setWidth,
    get paid() { return paid; },
    get progress() { return progress(); },
    destroy() {
      dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      reduceMq.removeEventListener('change', onReduce);
      removeEventListener('deviceorientation', onOrient);
      if (gl) { const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); }
      root.remove();
    }
  };
}
