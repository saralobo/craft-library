/* Pin de mapa · Sara Lobo Library (saralobolibrary.com). A city map in perspective with a glass map pin: a click or a tap
   on a street sends the pin flying to the nearest curb, where it sticks its tip in; the map is in focus there and soft
   further away, the streets carry their names, and a card under the map names the address and confirms it.
   One ES module, three.js 0.169 its only dependency. Made with craft by Sara Lobo. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

// the words the piece shows, in English; the library's page hands in its Portuguese
const LABELS = {
  title: 'Delivery address', confirm: 'Confirm', confirmed: 'Confirmed', nogl: '3D is not available in this browser.',
  label: 'A city map with a glass pin: click a street and the pin flies to the curb; the address shows in a card to confirm.'
};
const CSS = '.pin-root{--pin-paper:#EDEEF2;--pin-muted:#A3A5AE;--pin-faint:#73757F;--pin-sans:\'DM Sans\',ui-sans-serif,system-ui,-apple-system,\'Segoe UI\',sans-serif;position:relative;overflow:hidden;font-family:var(--pin-sans);-webkit-font-smoothing:antialiased;color:var(--pin-paper);text-align:left;line-height:normal;letter-spacing:normal}\n.pin-root *{box-sizing:border-box}\n.pin-nogl{position:absolute;inset:0;display:grid;place-items:center;padding:24px;text-align:center;font-size:14px;color:var(--pin-faint)}\n.pin-tag{position:absolute;left:0;top:0;z-index:2;height:28px;border-radius:8px;background:#1B1C20;border:1px solid rgba(255,255,255,.09);box-shadow:0 6px 18px rgba(0,0,0,.35);opacity:0;pointer-events:none;overflow:hidden;will-change:transform,opacity;transition:width .26s cubic-bezier(.2,.8,.2,1)}\n.pin-tag span{position:absolute;left:0;top:0;height:100%;display:flex;align-items:center;gap:6px;padding:0 10px;white-space:nowrap;font:500 12.5px/1 var(--pin-sans);color:var(--pin-paper);opacity:0;transition:opacity .18s ease}\n.pin-tag i{font-style:normal;font-weight:400;color:var(--pin-muted)}\n.pin-tag i::before{content:\'·\';margin-right:6px;color:var(--pin-faint)}\n.pin-mapl{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}\n.pin-ml{position:absolute;left:0;top:0;white-space:nowrap;font:500 10.5px/1 var(--pin-sans);letter-spacing:.01em;color:#8C8E99;text-shadow:0 0 3px rgba(8,9,10,.95),0 0 7px rgba(8,9,10,.7);will-change:transform,opacity,filter}\n.pin-ml.av{font-size:11px;color:#B5B7C2}\n.pin-ml.poi{color:#AAA6D8}\n.pin-ml.park{color:#7F998F}\n.pin-ml.river{font-style:italic;color:#7287BD;letter-spacing:.06em}\n.pin-addr{position:absolute;left:12px;right:12px;bottom:12px;z-index:2;display:flex;align-items:center;gap:12px;padding:11px 11px 11px 14px;border-radius:14px;background:#17181C;border:1px solid rgba(255,255,255,.08);box-shadow:0 10px 30px rgba(0,0,0,.45)}\n.pin-addr-t{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1;transition:opacity .14s ease,transform .14s ease}\n.pin-addr-t.swap{opacity:0;transform:translateY(2px)}\n.pin-addr-k{font-size:11.5px;color:var(--pin-faint)}\n.pin-addr-a{font-size:15px;font-weight:500;letter-spacing:-.005em;color:var(--pin-paper);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.pin-addr-b{font-size:12.5px;color:var(--pin-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.pin-addr-go{flex:none;display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 16px;border-radius:999px;border:0;background:var(--pin-paper);color:#0A0B0C;font:500 13px var(--pin-sans);cursor:pointer;transition:background-color .25s ease,color .25s ease,opacity .25s ease,padding .25s ease}\n.pin-addr-go[aria-disabled="true"]{opacity:.42;cursor:default}\n.pin-addr-go:focus-visible{outline:2px solid var(--pin-paper);outline-offset:2px}\n.pin-addr-go svg{width:0;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:14;stroke-dashoffset:14;transition:width .25s ease,stroke-dashoffset .35s ease .1s}\n.pin-addr-go.done{background:rgba(255,255,255,.08);color:var(--pin-paper);opacity:1;padding:0 16px 0 13px}\n.pin-addr-go.done svg{width:16px;stroke-dashoffset:0}';
function css() {
  if (document.getElementById('pin-style')) return;
  const s = document.createElement('style'); s.id = 'pin-style'; s.textContent = CSS; document.head.appendChild(s);
}
function fonts() {                                        // DM Sans, as the piece was drawn with it
  if (document.querySelector('link[data-pin-fonts]')) return;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.pinFonts = '';
  l.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap';
  document.head.appendChild(l);
}

const G = 5.2, TAU = Math.PI * 2;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);
const clamp01 = (x) => Math.min(1, Math.max(0, x)), lerp = (a, b, k) => a + (b - a) * k, damp = THREE.MathUtils.damp;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

class Spring {
  constructor(value = 0, { stiffness = 220, zeta = 0.7 } = {}) { this.x = value; this.v = 0; this.target = value; this.set(stiffness, zeta); }
  set(stiffness, zeta) { this.k = stiffness; this.c = 2 * zeta * Math.sqrt(stiffness); return this; }
  accel() { return -this.k * (this.x - this.target) - this.c * this.v; }
  step(dt) {
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let i = 0; i < n; i++) { this.v += (-this.k * (this.x - this.target) - this.c * this.v) * h; this.x += this.v * h; }
    return this.x;
  }
}

const VERT_UV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const VERT_W = 'varying vec3 vW; void main(){ vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }';
function softbox(w, h, pos, rgb, k, soft = 0.22) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(...rgb).multiplyScalar(k) }, uSoft: { value: soft } },
    vertexShader: VERT_UV,
    fragmentShader: 'uniform vec3 uColor; uniform float uSoft; varying vec2 vUv; void main(){ vec2 q = abs(vUv - 0.5) * 2.0; gl_FragColor = vec4(uColor * smoothstep(1.0, 1.0 - uSoft, q.x) * smoothstep(1.0, 1.0 - uSoft, q.y), 1.0); }',
    side: THREE.DoubleSide
  }));
  m.position.set(...pos); m.lookAt(0, 0.5, 0); return m;
}
function studio(renderer, base, boxes) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(30, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec3 vP; void main(){ vec3 d = normalize(vP); vec3 c = vec3(0.0); ' + base + ' gl_FragColor = vec4(c, 1.0); }'
  })));
  boxes.forEach((b) => env.add(softbox(...b)));
  const pm = new THREE.PMREMGenerator(renderer);
  const t = pm.fromScene(env, 0).texture; pm.dispose();
  env.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return t;
}
const GLASS_ROOM = ['c += vec3(0.004, 0.005, 0.011) + vec3(0.016, 0.017, 0.03) * smoothstep(-0.2, 1.0, d.y);', [
  [8, 5, [-5, 6, 5], [1, 1, 1], 2.8, 0.5],
  [4.5, 4.5, [0.5, 9, -1], [1, 1, 1], 1.3, 0.5],
  [3.4, 7, [-8, -0.5, 1.5], [0.24, 0.46, 1], 7.5, 0.5],
  [3.4, 8, [-6, 1.5, -5], [0.62, 0.32, 1], 7.5, 0.5],
  [3, 7, [7, 1.5, 2], [0.4, 0.42, 1], 6.0, 0.5],
  [8, 1.8, [1, 4, -8], [0.86, 0.86, 1], 1.4, 0.5],
  [10, 10, [0, -7, 0], [0.42, 0.3, 0.95], 2.0, 0.6],
  [2.8, 5, [-4, -3, 4], [0.3, 0.45, 1], 6.0, 0.5]
]];

// one stage: renderer, the glass's studio, a backdrop only the glass sees, the floor and its contact shadow, the framing
// and the loop
function makeStage(container, o) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;display:block;width:100%;height:100%;outline:none;touch-action:none';
  canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', o.label);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw new Error('no context');
  } catch (e) { container.classList.add('no-gl'); return null; }
  container.appendChild(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.05, 80);
  const glassEnv = studio(renderer, ...GLASS_ROOM);
  scene.environment = glassEnv;

  // the stage's own ground (the CSS gradient of .stage), drawn first so the canvas is opaque. The floor's light is added
  // with alpha 0, and WebKit drops colour where alpha is 0: on a transparent canvas Safari showed only what lay under the shadow
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { uRes: { value: new THREE.Vector2(1, 1) } },
    vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform vec2 uRes;
      void main() {
        vec2 uv = gl_FragCoord.xy / uRes;
        float d = length(vec2((uv.x - 0.5) / 1.2, 1.0 - uv.y));    // radial-gradient(120% 100% at 50% 0%, a, b 70%)
        vec3 c = mix(vec3(21.0, 22.0, 26.0), vec3(10.0, 11.0, 12.0), clamp(d / 0.7, 0.0, 1.0)) / 255.0;
        float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
        gl_FragColor = vec4(c + n / 255.0, 1.0);
      }`,
    depthTest: false, depthWrite: false
  }));
  ground.frustumCulled = false; ground.renderOrder = -20;
  ground.onBeforeRender = (r) => { ground.material.colorWrite = r.getRenderTarget() === null; };
  scene.add(ground);

  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.ShaderMaterial({
    uniforms: { uBack: { value: new THREE.Vector4(...(o.backdrop || [0.5, 1.05, 1.3]), 0) } },   // its centre height, height, width, centre x
    vertexShader: VERT_W,
    fragmentShader: `uniform vec4 uBack; varying vec3 vW;
      void main() {
        float s = (vW.x - uBack.w) / uBack.z, t = (vW.y - uBack.x) / uBack.y;
        vec3 c = vec3(0.37, 0.37, 0.40) * (0.62 + 0.75 * smoothstep(-0.6, 1.0, t));
        c = mix(c, vec3(0.52, 0.32, 0.95), smoothstep(-0.45, -0.95, s) * 0.7);
        c = mix(c, vec3(0.26, 0.44, 1.0), smoothstep(-0.5, -0.95, s) * smoothstep(0.0, -0.7, t) * 0.8);
        c = mix(c, vec3(0.34, 0.40, 0.85), smoothstep(0.55, 1.0, s) * 0.45);
        c *= mix(0.22, 1.0, smoothstep(-0.95, -0.25, t));
        gl_FragColor = vec4(c, 1.0);
      }`,
    depthWrite: false
  }));
  backdrop.position.set(0, 0.5, -2.8); backdrop.renderOrder = -10;
  backdrop.onBeforeRender = (r) => { backdrop.material.colorWrite = r.getRenderTarget() !== null; };
  scene.add(backdrop);

  // satin frosted glass under a glossy coat; clear where the glass is solid (per-vertex aClear, 0 when absent)
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.19, transmission: 1, thickness: 0.22, ior: 1.5, dispersion: 0.6,
    clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 0.6, envMap: glassEnv, side: THREE.DoubleSide
  });
  glass.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aClear;\nvarying float vClear;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvClear = aClear;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vClear;')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.07, vClear);');
  };
  glass.customProgramCacheKey = () => 'glass-kit';
  const notInGlass = (m) => { m.onBeforeRender = (r) => { m.material.colorWrite = r.getRenderTarget() === null; }; };

  // the floor: a faint cool pool, the contact shadow and the violet light the glass gathers where it touches
  const SH = { size: o.shadow || 2.6, far: 0.6, res: 256 };
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(SH.size, SH.size), new THREE.ShaderMaterial({
    vertexShader: VERT_UV,
    fragmentShader: `varying vec2 vUv;
      void main() {
        float a = 0.06 * pow(max(0.0, 1.0 - length(vUv - 0.5) * 2.0), 1.7);
        float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
        gl_FragColor = vec4(vec3(0.82, 0.8, 1.0) * a + n / 255.0 * step(0.002, a), 0.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, premultipliedAlpha: true
  }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = -0.003; pool.renderOrder = 0; scene.add(pool);
  const shadowRT = new THREE.WebGLRenderTarget(SH.res, SH.res), blurRT = new THREE.WebGLRenderTarget(SH.res, SH.res);
  shadowRT.texture.generateMipmaps = blurRT.texture.generateMipmaps = false;
  const shadowCam = new THREE.OrthographicCamera(-SH.size / 2, SH.size / 2, SH.size / 2, -SH.size / 2, 0, SH.far);
  shadowCam.rotation.x = Math.PI / 2; shadowCam.position.y = -0.005; shadowCam.layers.set(1);
  const casterMat = new THREE.ShaderMaterial({
    vertexShader: 'varying float vD; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); vD = gl_Position.z / gl_Position.w * 0.5 + 0.5; }',
    fragmentShader: 'varying float vD; void main(){ float h = clamp(vD, 0.0, 1.0); gl_FragColor = vec4(1.0 - smoothstep(0.0, 0.09, h), 0.0, 0.0, pow(1.0 - h, 1.8)); }',
    side: THREE.DoubleSide
  });
  const blurMat = (dx, dy) => new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uStep: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uStep; varying vec2 vUv;
      void main() {
        vec2 d = vec2(${dx.toFixed(1)}, ${dy.toFixed(1)}) * uStep; vec4 s = vec4(0.0);
        s += texture2D(tDiffuse, vUv - 4.0 * d) * 0.051; s += texture2D(tDiffuse, vUv - 3.0 * d) * 0.0918;
        s += texture2D(tDiffuse, vUv - 2.0 * d) * 0.12245; s += texture2D(tDiffuse, vUv - d) * 0.1531;
        s += texture2D(tDiffuse, vUv) * 0.1633;
        s += texture2D(tDiffuse, vUv + d) * 0.1531; s += texture2D(tDiffuse, vUv + 2.0 * d) * 0.12245;
        s += texture2D(tDiffuse, vUv + 3.0 * d) * 0.0918; s += texture2D(tDiffuse, vUv + 4.0 * d) * 0.051;
        gl_FragColor = s;
      }`,
    depthTest: false, depthWrite: false
  });
  const hBlur = blurMat(1, 0), vBlur = blurMat(0, 1);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  function blurPass(h, v) {
    quad.material = hBlur; hBlur.uniforms.tDiffuse.value = shadowRT.texture; hBlur.uniforms.uStep.value = h / SH.res;
    renderer.setRenderTarget(blurRT); renderer.render(quad, quadCam);
    quad.material = vBlur; vBlur.uniforms.tDiffuse.value = blurRT.texture; vBlur.uniforms.uStep.value = v / SH.res;
    renderer.setRenderTarget(shadowRT); renderer.render(quad, quadCam);
  }
  const floorGeo = new THREE.PlaneGeometry(SH.size, SH.size).rotateX(Math.PI / 2);
  const shadowPlane = new THREE.Mesh(floorGeo, new THREE.ShaderMaterial({
    uniforms: { map: { value: shadowRT.texture } }, vertexShader: VERT_UV,
    fragmentShader: 'uniform sampler2D map; varying vec2 vUv; void main(){ gl_FragColor = vec4(0.0, 0.0, 0.0, texture2D(map, vUv).a * ' + (o.shadowK || 0.8).toFixed(2) + '); }',
    transparent: true, depthWrite: false
  }));
  const glowPlane = new THREE.Mesh(floorGeo, new THREE.ShaderMaterial({
    uniforms: { map: { value: shadowRT.texture } }, vertexShader: VERT_UV,
    fragmentShader: 'uniform sampler2D map; varying vec2 vUv; void main(){ gl_FragColor = vec4(vec3(0.2, 0.15, 0.55) * texture2D(map, vUv).r, 0.0); }',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, premultipliedAlpha: true
  }));
  for (const [m, k] of o.glow === false ? [[shadowPlane, 1]] : [[shadowPlane, 1], [glowPlane, 2]]) { m.scale.y = -1; m.position.y = 0.001 * k; m.renderOrder = k; scene.add(m); }

  const casters = [];                                   // glass meshes: drawn with casterMat for the shadow view
  function renderShadow(lift) {
    casters.forEach((m) => { m.userData.mat = m.material; m.material = casterMat; });
    scene.overrideMaterial = casterMat;
    renderer.setRenderTarget(shadowRT); renderer.render(scene, shadowCam);
    scene.overrideMaterial = null;
    casters.forEach((m) => { m.material = m.userData.mat; });
    const b = 1 + 4 * lift;
    blurPass(2.2 * b, 3.4 * b); blurPass(1.1 * b, 1.7 * b); blurPass(0.5 * b, 0.8 * b);
    renderer.setRenderTarget(null);
  }

  // framing: a view `w` wide and `h` tall around (0, lookY, 0), seen from `elev` degrees up
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    renderer.getDrawingBufferSize(ground.material.uniforms.uRes.value);
    camera.aspect = w / h;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max(o.view[0] / (2 * tan * camera.aspect), o.view[1] / (2 * tan)), el = THREE.MathUtils.degToRad(o.elev);
    camera.position.set(0, o.lookY + Math.sin(el) * dist, (o.lookZ || 0) + Math.cos(el) * dist);
    camera.lookAt(0, o.lookY, o.lookZ || 0);
    camera.updateProjectionMatrix();
    if (stage.onResize) stage.onResize();
  }
  const ro = new ResizeObserver(resize); ro.observe(container);

  // the loop: dt-based, paused off screen or in a hidden tab. With o.manual nothing runs on its own: stage.tick(dt, now)
  // moves it a step (how the library films it, frame by frame)
  let visible = false, prev = performance.now(), raf = 0, dead = false, io = null;
  function start(update) {
    io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && stage.onVisible) stage.onVisible(); }, { threshold: 0.25 });
    io.observe(container);
    resize();
    if (o.manual) { stage.tick = update; return; }
    const frame = (now) => {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - prev) / 1000); prev = now;
      if (!visible || document.hidden) return;
      update(dt, now);
    };
    raf = requestAnimationFrame(frame);
  }
  function destroy() {
    dead = true; cancelAnimationFrame(raf); if (io) io.disconnect(); ro.disconnect();
    scene.traverse((m) => { if (m.isMesh) { m.geometry.dispose(); [].concat(m.material).forEach((x) => x.dispose()); } });
    glassEnv.dispose(); shadowRT.dispose(); blurRT.dispose(); casterMat.dispose(); hBlur.dispose(); vBlur.dispose();
    renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
  }
  const shadowAt = (x, z) => { shadowCam.position.x = x; shadowCam.position.z = z; for (const m of [pool, shadowPlane, glowPlane]) { m.position.x = x; m.position.z = z; } };
  const stage = { renderer, scene, camera, canvas, glass, notInGlass, destroy, casters, renderShadow, start, onResize: null, onVisible: null, backdrop: backdrop.material.uniforms.uBack.value,
    backdropMesh: backdrop, res: ground.material.uniforms.uRes.value, shadowAt,
    draw() { renderer.render(scene, camera); } };
  return stage;
}

// a floor ring: what the glass leaves on the floor when it lands (two violet ripples) and, for the pin, the target it aims at
function ringMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uRip: { value: new THREE.Vector3(0, 0, -1) },     // xz centre, time since the impact (-1: none)
      uRipK: { value: 1 },                              // how hard it landed
      uMark: { value: new THREE.Vector4(0, 0, 0.1, 0) },// xz centre, radius, opacity
      uSpot: { value: new THREE.Vector3(0, 0, 0) },     // xz centre, strength: the light the glass gathers at its tip
      uHov: { value: new THREE.Vector3(0, 0, 0) },      // xz centre, strength: the curb under the pointer
      uScale: { value: 1 }                              // the pin's scale: its marks on the floor scale with it
    },
    vertexShader: VERT_W,
    fragmentShader: `uniform vec3 uRip; uniform float uRipK; uniform vec4 uMark; uniform vec3 uSpot, uHov; uniform float uScale; varying vec3 vW;
      float ring(float d, float r, float w) { return smoothstep(w, 0.0, abs(d - r)); }
      void main() {
        vec3 c = vec3(0.0);
        float dm = distance(vW.xz, uMark.xy) / uScale;
        c += vec3(0.62, 0.6, 0.95) * 0.32 * uMark.w * (ring(dm, uMark.z, 0.011) + 0.35 * ring(dm, uMark.z * 0.42, 0.008));
        if (uRip.z >= 0.0) {
          float d = distance(vW.xz, uRip.xy) / uScale;
          for (int k = 0; k < 2; k++) {
            float t = uRip.z - 0.2 * float(k);
            if (t > 0.0) {
              float r = 0.04 + 0.62 * (1.0 - exp(-2.4 * t)), a = exp(-2.0 * t) * smoothstep(0.0, 0.06, t);
              c += vec3(0.42, 0.3, 0.95) * 0.2 * uRipK * a * ring(d, r, 0.018 + 0.05 * t) * (k == 0 ? 1.0 : 0.6);
            }
          }
        }
        float dh = distance(vW.xz, uHov.xy) / uScale;
        c += vec3(0.62, 0.6, 0.95) * 0.3 * uHov.z * (ring(dh, 0.026, 0.006) + smoothstep(0.009, 0.004, dh));
        float ds = distance(vW.xz, uSpot.xy) / uScale;
        c += vec3(0.62, 0.6, 0.95) * 0.14 * uSpot.z * exp(-ds * ds / 0.004);
        float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
        gl_FragColor = vec4(c + n / 255.0 * step(0.002, c.r + c.b), 0.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, premultipliedAlpha: true
  });
}

// ─── Pin de mapa ─────────────────────────────────────────────────────────────────────────────────────────
// A teardrop of frosted glass, open through its head like the map pin it is. It flies to the place on a spring, its head
// leaning with the acceleration like something carried, rises a touch as it aims, falls under gravity and sticks its tip
// in the map; the glass vibrates about the tip and settles. The map lies under it in the camera's perspective, in focus
// where the pin is and softly out of focus away from it; the focus follows the pin. A tap on the map sends it there.
const PIN = { r: 0.34, c: 0.64, rho: 0.028, zs: 0.8, hole: 0.13, fillet: 0.085, tilt: 0.5, hover: 0.42, area: [0.95, 0.62], home: [0.1, 0.05], from: [-2.3, 1.6, -0.75] };

// a smooth closed surface from a signed distance: surface nets on a grid, each vertex then pulled onto the surface,
// normals from the field itself (so the glass shades without facets)
function sdfGeometry(sdf, min, max, h) {
  const [nx, ny, nz] = [0, 1, 2].map((a) => Math.ceil((max[a] - min[a]) / h) + 1), at = (i, j, k) => i + nx * (j + ny * k);
  const F = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) F[at(i, j, k)] = sdf(min[0] + i * h, min[1] + j * h, min[2] + k * h);
  const grad = (x, y, z, e) => [sdf(x + e, y, z) - sdf(x - e, y, z), sdf(x, y + e, z) - sdf(x, y - e, z), sdf(x, y, z + e) - sdf(x, y, z - e)];
  const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cell = new Int32Array(nx * ny * nz).fill(-1), pos = [], nor = [], idx = [], v = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let inside = 0;
    for (let c = 0; c < 8; c++) { v[c] = F[at(i + (c & 1), j + (c >> 1 & 1), k + (c >> 2))]; if (v[c] < 0) inside++; }
    if (inside === 0 || inside === 8) continue;
    let sx = 0, sy = 0, sz = 0, m = 0;
    for (const [a, b] of EDGES) {
      if ((v[a] < 0) === (v[b] < 0)) continue;
      const t = v[a] / (v[a] - v[b]);
      sx += lerp(a & 1, b & 1, t); sy += lerp(a >> 1 & 1, b >> 1 & 1, t); sz += lerp(a >> 2, b >> 2, t); m++;
    }
    let x = min[0] + (i + sx / m) * h, y = min[1] + (j + sy / m) * h, z = min[2] + (k + sz / m) * h;
    for (let it = 0; it < 4; it++) {                    // Newton steps onto the zero level
      const d = sdf(x, y, z), g = grad(x, y, z, h * 0.25), gg = g[0] * g[0] + g[1] * g[1] + g[2] * g[2];
      if (gg < 1e-14) break;
      const s = d * h * 0.5 / gg; x -= g[0] * s; y -= g[1] * s; z -= g[2] * s;
    }
    const g = grad(x, y, z, h * 0.25), gl = Math.hypot(...g) || 1;
    cell[at(i, j, k)] = pos.length / 3; pos.push(x, y, z); nor.push(g[0] / gl, g[1] / gl, g[2] / gl);
  }
  const quad = (a, b, c, d) => {                         // two triangles, turned to face along the surface normals
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    const P = (n) => [pos[3 * n], pos[3 * n + 1], pos[3 * n + 2]], [A, B, C] = [P(a), P(b), P(c)];
    const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], w = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    if (n[0] * nor[3 * a] + n[1] * nor[3 * a + 1] + n[2] * nor[3 * a + 2] < 0) idx.push(a, c, b, a, d, c); else idx.push(a, b, c, a, c, d);
  };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const f = F[at(i, j, k)] < 0;
    if (f !== (F[at(i + 1, j, k)] < 0)) quad(cell[at(i, j - 1, k - 1)], cell[at(i, j, k - 1)], cell[at(i, j, k)], cell[at(i, j - 1, k)]);
    if (f !== (F[at(i, j + 1, k)] < 0)) quad(cell[at(i - 1, j, k - 1)], cell[at(i, j, k - 1)], cell[at(i, j, k)], cell[at(i - 1, j, k)]);
    if (f !== (F[at(i, j, k + 1)] < 0)) quad(cell[at(i - 1, j - 1, k)], cell[at(i, j - 1, k)], cell[at(i, j, k)], cell[at(i - 1, j, k)]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

// the pin: a teardrop (head and tip joined by the lines tangent to both), a little flatter front to back, with a round
// hole through its head along the line of sight and every edge of the hole rounded off
function pinGeometry() {
  const { r, c, rho, zs, hole, fillet, tilt } = PIN, al = Math.asin(r / c), yc = rho / Math.sin(al), hh = c - yc;
  const b = (rho - r) / hh, a = Math.sqrt(1 - b * b), ay = Math.sin(tilt), az = Math.cos(tilt);
  const sdf = (x, y, z) => {
    const px = Math.hypot(x, z / zs), py = y - yc, k = -b * px + a * py;
    const body = k < 0 ? Math.hypot(px, py) - rho : k > a * hh ? Math.hypot(px, py - hh) - r : a * px + b * py - rho;
    const qy = y - c, t = qy * ay + z * az, cut = hole - Math.hypot(x, qy - t * ay, z - t * az);
    const s = Math.max(fillet - Math.abs(body - cut), 0) / fillet;
    return Math.max(body, cut) + s * s * fillet * 0.25;   // smooth subtraction
  };
  const h = 0.0095, e = 3 * h;
  const g = sdfGeometry(sdf, [-r - e, -e, -r * zs - e], [r + e, c + r + e, r * zs + e], h);
  const p = g.attributes.position, clear = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), t = clamp01((0.4 - y) / 0.22); clear[i] = t * t * (3 - 2 * t); }   // the solid tip reads clear
  g.setAttribute('aClear', new THREE.BufferAttribute(clear, 1));
  return g;
}

// ─── The city under the pin ──────────────────────────────────────────────────────────────────────────────
// A real street network, drawn once into two textures (a sharp one where the pin can land, a coarse one out to the far
// blur) and read back by the pointer, so a click lands on a curb with a real address. A grid turned a little, with
// blocks of different sizes and two avenues on it (Horizonte and Aurora); a river behind with an avenue on its bank,
// where the streets end and only the avenues cross, on bridges; every block lined with buildings, some of them a place;
// a park with a pond and a praça. The names are invented.
const CITY = {
  A: 0.28, M: 400,                                      // grid turn; metres per unit, for house numbers
  AV: 0.013, ST: 0.0068, BR: 0.011, SW: 0.006, GAP: 0.0028, RIVER: 0.13, BANK: 0.024,   // half widths, sidewalk, gaps
  near: [-1.75, -1.95, 3.5, 2048], far: [-6.5, -9.5, 13, 1024],   // texture squares: x0, z0, size, pixels
  area: [1.0, -1.05, 0.62]                              // where a click may land: |x|, and z from, to
};
const NAMES = {
  col: ['Rua das Acácias', 'Rua Jasmim', 'Rua das Camélias', 'Rua Lavanda', 'Rua Magnólia', 'Rua das Hortênsias', 'Rua Alecrim', 'Rua Dália', 'Rua das Orquídeas', 'Rua Gardênia', 'Rua Begônia', 'Rua Azaleia', 'Rua dos Lírios', 'Rua Violeta'],
  row: ['Rua Ametista', 'Rua Turmalina', 'Rua Safira', 'Rua Ágata', 'Rua Topázio', 'Rua Quartzo', 'Rua Ônix', 'Rua Citrino', 'Rua Jade', 'Rua Granada', 'Rua Opala', 'Rua Âmbar', 'Rua Cristal', 'Rua Esmeralda'],
  avCol: 'Avenida Horizonte', avRow: 'Avenida Aurora', bank: 'Avenida Beira-Rio', farBank: 'Rua da Margem', river: 'Rio Claro',
  parks: ['Parque das Luzes', 'Praça Íris'], hoods: ['Alto da Aurora', 'Vila Opala', 'Jardim Cristal', 'Vila Âmbar'], farHood: 'Vila Ribeira',
  kind: ['Café', 'Padaria', 'Livraria', 'Galeria', 'Ateliê', 'Floricultura', 'Mercado', 'Farmácia'],
  place: ['Lume', 'Prisma', 'Íris', 'Aurora', 'Safira', 'Jade', 'Ônix', 'Lavanda', 'Cristal', 'Quartzo', 'Opala', 'Âmbar']
};

const mod = (n, m) => ((n % m) + m) % m;

function buildCity() {
  const C = CITY, ca = Math.cos(C.A), sa = Math.sin(C.A);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rngOf = (i, j) => { let s = (((i * 73856093) ^ (j * 19349663)) >>> 0) % 2147483646 + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const toQ = (x, z) => [ca * x - sa * z, sa * x + ca * z], toW = (u, v) => [ca * u + sa * v, -sa * u + ca * v];
  const lines = (lo, hi, R) => { const a = [0]; for (let x = 0; x < R;) a.push(x += lerp(lo, hi, rnd())); for (let x = 0; x > -R;) a.unshift(x -= lerp(lo, hi, rnd())); return a; };
  const X = lines(0.19, 0.31, 11.5), Y = lines(0.13, 0.21, 11.5), I0 = X.indexOf(0), J0 = Y.indexOf(0);
  const zr = (x) => -1.25 - 0.22 * x + 0.1 * Math.sin(1.4 * x + 0.6);
  const bank = (x, s) => zr(x) + s * (C.RIVER + C.BANK);  // the bank roads' centre lines: s = 1 near side, -1 far side
  const land = (x, z, m = 0) => z > bank(x, 1) + m || z < bank(x, -1) - m;
  const hwC = (i) => (i === I0 ? C.AV : C.ST), hwR = (j) => (j === J0 ? C.AV : C.ST);
  const cut = new Set();                                  // streets left out: c{i},{j} column i between rows j and j+1; r{j},{i}
  for (let i = 0; i < X.length; i++) for (let j = 0; j < Y.length - 1; j++) if (i !== I0 && rnd() < 0.1) cut.add(`c${i},${j}`);
  for (let j = 0; j < Y.length; j++) for (let i = 0; i < X.length - 1; i++) if (j !== J0 && rnd() < 0.1) cut.add(`r${j},${i}`);
  const cellOf = (x, z) => { const [u, v] = toQ(x, z); let i = 0, j = 0; while (X[i + 1] <= u) i++; while (Y[j + 1] <= v) j++; return [i, j]; };
  const range = (A, lo, hi) => { let a = 0, b = A.length - 2; while (a < b && A[a + 1] < lo) a++; while (b > a && A[b] > hi) b--; return [a, b]; };
  const qBounds = (x0, z0, s) => { const c = [[x0, z0], [x0 + s, z0], [x0, z0 + s], [x0 + s, z0 + s]].map(([x, z]) => toQ(x, z)); return [Math.min(...c.map((q) => q[0])), Math.max(...c.map((q) => q[0])), Math.min(...c.map((q) => q[1])), Math.max(...c.map((q) => q[1]))]; };

  const parks = [];
  const addPark = (x, z, n, name, pond) => {             // n × n cells, the streets inside it left out, the avenues kept outside
    let [i, j] = cellOf(x, z);
    if (n > 1 && i + 1 === I0) i++; if (n > 1 && j + 1 === J0) j++;
    for (let a = i; a < i + n; a++) for (let b = j; b < j + n; b++) { if (a > i) cut.add(`c${a},${b}`); if (b > j) cut.add(`r${b},${a}`); }
    parks.push({ i: [i, i + n - 1], j: [j, j + n - 1], name, pond });
  };
  addPark(0.75, -0.62, 2, NAMES.parks[0], true); addPark(-0.95, 0.5, 1, NAMES.parks[1], false);
  const parkOf = (i, j) => parks.findIndex((p) => i >= p.i[0] && i <= p.i[1] && j >= p.j[0] && j <= p.j[1]);
  const block = (i, j) => {                              // the built part of cell (i, j), inside the sidewalks of the streets it has
    const L = !cut.has(`c${i},${j}`), R = !cut.has(`c${i + 1},${j}`), B = !cut.has(`r${j},${i}`), T = !cut.has(`r${j + 1},${i}`);
    return { i, j, L, R, B, T, x0: X[i] + (L ? hwC(i) + C.SW : 0), x1: X[i + 1] - (R ? hwC(i + 1) + C.SW : 0), y0: Y[j] + (B ? hwR(j) + C.SW : 0), y1: Y[j + 1] - (T ? hwR(j + 1) + C.SW : 0) };
  };
  const parkRect = (p) => { const a = block(p.i[0], p.j[0]), b = block(p.i[1], p.j[1]); return [a.x0, b.x1, a.y0, b.y1]; };
  const lotsOf = (b) => {                                // lots along each side with a street, or now and then one big building
    const r = rngOf(b.i, b.j), out = [], D = lerp(0.042, 0.058, r()), G = C.GAP;
    if (b.x1 - b.x0 < 0.05 || b.y1 - b.y0 < 0.05) return out;
    if (r() < 0.07) { out.push({ u0: b.x0 + 0.012, u1: b.x1 - 0.012, v0: b.y0 + 0.012, v1: b.y1 - 0.012, t: 0.8 + 0.2 * r() }); return out; }
    const run = (a0, a1, c0, c1, alongU, side) => {
      for (let s = a0; s < a1 - 0.012;) {
        let w = lerp(0.022, 0.05, r()); if (a1 - (s + w) < 0.02) w = a1 - s;
        const t = 0.55 + 0.45 * r();
        out.push(alongU ? { u0: s, u1: s + w, v0: c0, v1: c1, t, side } : { u0: c0, u1: c1, v0: s, v1: s + w, t, side });
        s += w + G;
      }
    };
    if (b.B) run(b.x0, b.x1, b.y0, b.y0 + D, true, 'B');
    if (b.T) run(b.x0, b.x1, b.y1 - D, b.y1, true, 'T');
    const va = b.B ? b.y0 + D + G : b.y0, vb = b.T ? b.y1 - D - G : b.y1;
    if (b.L) run(va, vb, b.x0, b.x0 + D, false, 'L');
    if (b.R) run(va, vb, b.x1 - D, b.x1, false, 'R');
    return out;
  };

  // the streets near the pin, in world units, for snapping, numbering, lighting up and naming. Each piece is a straight
  // stretch on land; s0, s1: where it runs along its street, in units (house numbers count M metres a unit from there)
  const [nu0, nu1, nv0, nv1] = qBounds(C.near[0], C.near[1], C.near[2]), NI = range(X, nu0, nu1), NJ = range(Y, nv0, nv1);
  const streets = [];
  const onLand = (a, b, s0, s1, out) => {                // split a straight stretch where it meets the river's bank roads
    const n = 24, P = (t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)], ok = (t) => { const [x, z] = P(t); return land(x, z); };
    let t0 = ok(0) ? 0 : null;
    for (let k = 1; k <= n; k++) {
      const t = k / n, o = ok(t);
      if ((t0 !== null) !== o) {                        // a crossing: find it
        let lo = (k - 1) / n, hi = t; for (let it = 0; it < 14; it++) { const m = (lo + hi) / 2; if (ok(m) === ok(lo)) lo = m; else hi = m; }
        const tc = (lo + hi) / 2;
        if (t0 !== null) { out.push({ a: P(t0), b: P(tc), s0: lerp(s0, s1, t0), s1: lerp(s0, s1, tc) }); t0 = null; } else t0 = tc;
      }
    }
    if (t0 !== null) out.push({ a: P(t0), b: P(1), s0: lerp(s0, s1, t0), s1 });
  };
  for (let i = NI[0]; i <= NI[1] + 1; i++) {
    const st = { id: 'c' + i, name: i === I0 ? NAMES.avCol : NAMES.col[mod(i, NAMES.col.length)], hw: hwC(i), kind: i === I0 ? 'av' : 'st', pieces: [] };
    for (let j = NJ[0]; j <= NJ[1]; j++) if (!cut.has(`c${i},${j}`)) onLand(toW(X[i], Y[j]), toW(X[i], Y[j + 1]), Y[j] + 6, Y[j + 1] + 6, st.pieces);
    if (st.pieces.length) streets.push(st);
  }
  for (let j = NJ[0]; j <= NJ[1] + 1; j++) {
    const st = { id: 'r' + j, name: j === J0 ? NAMES.avRow : NAMES.row[mod(j, NAMES.row.length)], hw: hwR(j), kind: j === J0 ? 'av' : 'st', pieces: [] };
    for (let i = NI[0]; i <= NI[1]; i++) if (!cut.has(`r${j},${i}`)) onLand(toW(X[i], Y[j]), toW(X[i + 1], Y[j]), X[i] + 6, X[i + 1] + 6, st.pieces);
    if (st.pieces.length) streets.push(st);
  }
  for (const s of [1, -1]) {
    const st = { id: s > 0 ? 'bn' : 'bf', name: s > 0 ? NAMES.bank : NAMES.farBank, hw: C.BR, kind: 'bank', pieces: [] };
    let acc = 8;
    for (let x = C.near[0]; x < C.near[0] + C.near[2]; x += 0.05) {
      const a = [x, bank(x, s)], b = [x + 0.05, bank(x + 0.05, s)], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      st.pieces.push({ a, b, s0: acc, s1: acc + L }); acc += L;
    }
    streets.push(st);
  }
  const hoodOf = (x, z) => { if (z < bank(x, -1)) return NAMES.farHood; const [u, v] = toQ(x, z); return NAMES.hoods[(u >= 0 ? 1 : 0) + (v >= 0 ? 2 : 0)]; };
  function snap(x, z) {                                   // the nearest curb: the nearest street, then out to the curb on the pointer's side
    let best = null, bd = Infinity;
    for (const st of streets) for (const p of st.pieces) {
      const dx = p.b[0] - p.a[0], dz = p.b[1] - p.a[1], L2 = dx * dx + dz * dz || 1e-9;
      const t = clamp01(((x - p.a[0]) * dx + (z - p.a[1]) * dz) / L2), cx = p.a[0] + dx * t, cz = p.a[1] + dz * t;
      const d = Math.hypot(x - cx, z - cz) - st.hw;
      if (d < bd) { bd = d; best = { st, p, t, cx, cz, dx, dz, L: Math.sqrt(L2) }; }
    }
    const { st, p, t, cx, cz, dx, dz, L } = best;
    const side = (x - cx) * -dz + (z - cz) * dx >= 0 ? 1 : -1, nx = -dz / L * side, nz = dx / L * side, off = st.hw + 0.007;
    const m = Math.max(1, Math.round(lerp(p.s0, p.s1, t) * C.M)), num = 2 * Math.round(m / 2) + (side > 0 ? 1 : 0) || 1;
    const sx = cx + nx * off, sz = cz + nz * off;
    return { x: sx, z: sz, street: st, num, address: `${st.name}, ${num}`, hood: hoodOf(sx, sz), d: bd };
  }

  // the places: one in some blocks near the pin, on the street side of one of its buildings
  const pois = [];
  for (let i = NI[0]; i <= NI[1]; i++) for (let j = NJ[0]; j <= NJ[1]; j++) {
    if (parkOf(i, j) >= 0) continue;
    const b = block(i, j), lots = lotsOf(b).filter((l) => l.side), r = rngOf(j * 7 + 3, i * 13 + 5);
    if (!lots.length || r() > 0.3) continue;
    const l = lots[Math.floor(r() * lots.length)], mu = (l.u0 + l.u1) / 2, mv = (l.v0 + l.v1) / 2;
    const [u, v] = l.side === 'B' ? [mu, l.v0 + 0.011] : l.side === 'T' ? [mu, l.v1 - 0.011] : l.side === 'L' ? [l.u0 + 0.011, mv] : [l.u1 - 0.011, mv];
    const [x, z] = toW(u, v);
    if (!land(x, z, C.BR + C.SW)) continue;
    pois.push({ id: pois.length, u, v, x, z, name: `${NAMES.kind[Math.floor(r() * 8)]} ${NAMES.place[Math.floor(r() * 12)]}`, snap: snap(x, z) });
  }
  return { X, Y, I0, J0, cut, parks, parkOf, parkRect, block, lotsOf, zr, bank, land, toQ, toW, range, qBounds, streets, snap, hoodOf, pois, cellOf };
}

// the city painted into a texture: [x0, z0, size, pixels]; detail: the buildings lot by lot and the places
function paintCity(city, [x0, z0, size, N], detail) {
  const C = CITY, ca = Math.cos(C.A), sa = Math.sin(C.A), k = N / size, { X, Y, I0, J0 } = city;
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d');
  const W = () => g.setTransform(k, 0, 0, k, -k * x0, -k * z0), Q = () => g.setTransform(k * ca, -k * sa, k * sa, k * ca, -k * x0, -k * z0);
  const landPath = (m) => {                              // the land on both sides of the river, m units back from the bank roads' centre lines
    g.beginPath();
    for (let x = x0 - 0.5; x <= x0 + size + 0.5; x += 0.04) g.lineTo(x, city.bank(x, 1) + m);
    g.lineTo(x0 + size + 0.5, z0 + size + 0.5); g.lineTo(x0 - 0.5, z0 + size + 0.5); g.closePath();
    g.moveTo(x0 + size + 0.5, z0 - 0.5); g.lineTo(x0 - 0.5, z0 - 0.5);
    for (let x = x0 - 0.5; x <= x0 + size + 0.5; x += 0.04) g.lineTo(x, city.bank(x, -1) - m);
    g.closePath();
  };
  W(); g.fillStyle = 'rgb(5,5,7)'; g.fillRect(x0, z0, size, size);
  const [u0, u1, v0, v1] = city.qBounds(x0, z0, size), I = city.range(X, u0 - 0.3, u1 + 0.3), J = city.range(Y, v0 - 0.3, v1 + 0.3);

  // parks: a dark green with paths; the big one has a pond, the praça its diagonals and a fountain
  Q();
  for (const p of city.parks) {
    const [a, b, c, d] = city.parkRect(p), w = b - a, h = d - c, cx = (a + b) / 2, cy = (c + d) / 2;
    g.fillStyle = 'rgb(9,15,14)'; g.beginPath(); g.roundRect(a, c, w, h, 0.012); g.fill();
    g.strokeStyle = 'rgb(21,29,27)'; g.lineWidth = 0.0045; g.lineCap = 'round'; g.beginPath();
    if (p.pond) {
      g.ellipse(cx, cy, w * 0.4, h * 0.38, 0, 0, TAU);
      g.moveTo(a, cy); g.lineTo(cx - w * 0.4, cy); g.moveTo(b, cy); g.lineTo(cx + w * 0.4, cy);
      g.moveTo(cx, c); g.lineTo(cx, cy - h * 0.38); g.moveTo(cx, d); g.lineTo(cx, cy + h * 0.38);
      g.stroke(); g.fillStyle = 'rgb(5,10,22)'; g.beginPath(); g.ellipse(cx, cy, w * 0.27, h * 0.24, 0.2, 0, TAU); g.fill();
    } else {
      g.moveTo(a, c); g.lineTo(b, d); g.moveTo(b, c); g.lineTo(a, d);
      g.moveTo(cx + Math.min(w, h) * 0.3, cy); g.arc(cx, cy, Math.min(w, h) * 0.3, 0, TAU); g.stroke();
      g.fillStyle = 'rgb(5,10,22)'; g.beginPath(); g.arc(cx, cy, Math.min(w, h) * 0.09, 0, TAU); g.fill();
    }
  }
  // buildings, only on land
  g.save(); W(); landPath(C.BR + C.SW); g.clip(); Q();
  for (let i = I[0]; i <= I[1]; i++) for (let j = J[0]; j <= J[1]; j++) {
    if (city.parkOf(i, j) >= 0) continue;
    const b = city.block(i, j);
    if (!detail) { g.fillStyle = 'rgb(14,15,20)'; g.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); continue; }
    g.fillStyle = 'rgb(10,10,14)'; g.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);   // the yards
    for (const l of city.lotsOf(b)) { g.fillStyle = `rgb(${Math.round(13 + 13 * l.t)},${Math.round(14 + 13 * l.t)},${Math.round(19 + 16 * l.t)})`; g.fillRect(l.u0, l.v0, l.u1 - l.u0, l.v1 - l.v0); }
  }
  g.restore();
  // the river
  W(); g.fillStyle = 'rgb(5,9,21)'; g.beginPath();
  for (let x = x0 - 0.5; x <= x0 + size + 0.5; x += 0.04) g.lineTo(x, city.zr(x) + C.RIVER);
  for (let x = x0 + size + 0.5; x >= x0 - 0.5; x -= 0.04) g.lineTo(x, city.zr(x) - C.RIVER);
  g.fill();
  // the streets, up to the bank roads
  g.save(); W(); landPath(0); g.clip(); Q();
  g.strokeStyle = 'rgb(36,38,50)'; g.lineWidth = 2 * C.ST; g.lineCap = 'butt'; g.beginPath();
  for (let i = I[0]; i <= I[1] + 1; i++) if (i !== I0) for (let j = J[0]; j <= J[1]; j++) if (!city.cut.has(`c${i},${j}`)) { g.moveTo(X[i], Y[j]); g.lineTo(X[i], Y[j + 1]); }
  for (let j = J[0]; j <= J[1] + 1; j++) if (j !== J0) for (let i = I[0]; i <= I[1]; i++) if (!city.cut.has(`r${j},${i}`)) { g.moveTo(X[i], Y[j]); g.lineTo(X[i + 1], Y[j]); }
  g.stroke(); g.restore();
  // the bank roads, then the avenues over everything (on bridges across the river)
  W(); g.strokeStyle = 'rgb(50,52,68)'; g.lineWidth = 2 * C.BR; g.lineJoin = 'round';
  for (const s of [1, -1]) { g.beginPath(); for (let x = x0 - 0.5; x <= x0 + size + 0.5; x += 0.04) g.lineTo(x, city.bank(x, s)); g.stroke(); }
  Q(); g.strokeStyle = 'rgb(66,68,90)'; g.lineWidth = 2 * C.AV; g.beginPath();
  g.moveTo(X[I0], Y[J[0]]); g.lineTo(X[I0], Y[J[1] + 1]); g.moveTo(X[I[0]], Y[J0]); g.lineTo(X[I[1] + 1], Y[J0]); g.stroke();
  if (detail) { g.fillStyle = 'rgb(122,118,178)'; for (const p of city.pois) { g.beginPath(); g.arc(p.u, p.v, 0.0085, 0, TAU); g.fill(); } }

  const tex = new THREE.CanvasTexture(cv);
  tex.flipY = false; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 8;
  return tex;
}

// the map: the two textures seen through a lens. The blur grows with the distance from the focus, mostly in depth as a
// lens does and a little sideways; out of focus each pixel is a disc of taps (a bokeh), sampled from a coarser mip level
const LENS = `
  uniform vec2 uFocus; uniform vec3 uCam, uFwd, uRight, uBlur;
  float lensBlur(vec3 w) {                                 // gaussian sigma of the blur at w, in world units
    vec3 fp = vec3(uFocus.x, 0.0, uFocus.y);
    float e = length(vec2(dot(w - fp, uFwd), dot(w - fp, uRight) * uBlur.z)) - uBlur.y;
    return uBlur.x * 0.5 * (e + sqrt(e * e + 0.01));
  }`;
function mapMaterial(near, far) {
  const C = CITY;
  return new THREE.ShaderMaterial({
    uniforms: {
      uFocus: { value: new THREE.Vector2() }, uCam: { value: new THREE.Vector3() }, uFwd: { value: new THREE.Vector3() }, uRight: { value: new THREE.Vector3() },
      uBlur: { value: new THREE.Vector3(0.05, 0.24, 0.5) },  // blur per unit away, the sharp radius, how much sideways counts
      uNear: { value: near }, uFar: { value: far },
      uNR: { value: new THREE.Vector4(C.near[0], C.near[1], C.near[2], C.near[3] / C.near[2]) }, uFR: { value: new THREE.Vector4(C.far[0], C.far[1], C.far[2], C.far[3] / C.far[2]) }
    },
    vertexShader: VERT_W,
    fragmentShader: `${LENS}
      uniform sampler2D uNear, uFar; uniform vec4 uNR, uFR; varying vec3 vW;
      vec3 lens(sampler2D t, vec2 uv, float r) {             // r: the disc's radius in texels
        vec3 sharp = texture(t, uv).rgb;
        if (r < 0.75) return sharp;
        vec2 ts = 1.0 / vec2(textureSize(t, 0)); float lod = log2(r * 0.55); vec3 a = vec3(0.0);
        for (int i = 0; i < 16; i++) { float fi = float(i) + 0.5, an = fi * 2.3999632; a += textureLod(t, uv + vec2(cos(an), sin(an)) * sqrt(fi / 16.0) * r * ts, lod).rgb; }
        return mix(sharp, a / 16.0, smoothstep(0.75, 1.6, r));
      }
      void main() {
        vec2 p = vW.xz; float R = 2.0 * lensBlur(vW);         // a disc twice the sigma
        vec2 nuv = (p - uNR.xy) / uNR.z, fuv = (p - uFR.xy) / uFR.z;
        float wn = smoothstep(0.0, 0.25, min(min(nuv.x, 1.0 - nuv.x), min(nuv.y, 1.0 - nuv.y)) * uNR.z);   // near texture, fading out at its edge
        vec3 c = vec3(0.0);
        if (wn > 0.0) c += lens(uNear, nuv, R * uNR.w) * wn;
        if (wn < 1.0) c += lens(uFar, fuv, R * uFR.w) * (1.0 - wn);
        c *= smoothstep(12.0, 6.5, dot(vW - uCam, uFwd));     // the far map fades into the dark
        float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
        gl_FragColor = vec4(c + n / 255.0, 0.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, premultipliedAlpha: true
  });
}

// a street lit up under the pointer: a ribbon along its pieces, soft at the edges by the same lens
function ribbonMaterial(MU) {
  return new THREE.ShaderMaterial({
    uniforms: { uFocus: MU.uFocus, uCam: MU.uCam, uFwd: MU.uFwd, uRight: MU.uRight, uBlur: MU.uBlur, uK: { value: 0 } },
    vertexShader: 'attribute vec2 aAcross; varying vec2 vA; varying vec3 vW; void main(){ vA = aAcross; vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }',
    fragmentShader: `${LENS}
      uniform float uK; varying vec2 vA; varying vec3 vW;
      float erfA(float x) { float x2 = x * x; return sign(x) * sqrt(1.0 - exp(-x2 * (1.2732395 + 0.147 * x2) / (1.0 + 0.147 * x2))); }
      void main() {
        float s = 1.4142 * max(lensBlur(vW), length(fwidth(vW.xz)) * 0.5);
        float cov = 0.5 * (erfA((vA.x + vA.y) / s) - erfA((vA.x - vA.y) / s));
        gl_FragColor = vec4(vec3(0.23, 0.21, 0.42) * cov * uK, 0.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, premultipliedAlpha: true
  });
}
function ribbonGeometry(street) {
  const pos = [], acr = [], idx = [], pad = 0.035, w = street.hw + pad;
  for (const p of street.pieces) {
    const dx = p.b[0] - p.a[0], dz = p.b[1] - p.a[1], L = Math.hypot(dx, dz) || 1, nx = -dz / L * w, nz = dx / L * w, o = pos.length / 3;
    pos.push(p.a[0] + nx, 0, p.a[1] + nz, p.a[0] - nx, 0, p.a[1] - nz, p.b[0] - nx, 0, p.b[1] - nz, p.b[0] + nx, 0, p.b[1] + nz);
    acr.push(w, street.hw, -w, street.hw, -w, street.hw, w, street.hw);
    idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aAcross', new THREE.Float32BufferAttribute(acr, 2)); g.setIndex(idx);
  return g;
}

// root: the element the piece fills (give it a size; it is made for about 560 × 560). o: { labels: { title, confirm,
// confirmed, nogl }, label (the canvas's accessible name), autoplay (false: wait for replay()), fonts (false: don't load DM
// Sans), manual (no clock of its own: the returned tick(dt, now) moves it) }. Events on root: "pinchange" (the pin was sent to
// an address) and "pinconfirm" (it was confirmed), detail { address, neighbourhood, place }
export function mountPin(root, o = {}) {
  const L = Object.assign({}, LABELS), container = root;
  for (const k in o.labels || {}) if (o.labels[k] != null) L[k] = o.labels[k];   // a word left out keeps its default
  css(); if (o.fonts !== false) fonts();
  root.classList.add('pin-root');
  const K = makeStage(container, { label: o.label || L.label, view: [2.45, 2.25], elev: 34, lookY: 0.36, lookZ: 0.05, shadow: 3.2, backdrop: [-0.3, 1.2, 1.0], manual: o.manual });
  if (!K) {                                                // no WebGL: say so, quietly, where the map would be
    const n = document.createElement('div'); n.className = 'pin-nogl'; n.textContent = L.nogl; root.appendChild(n);
    return { ready: Promise.resolve(), replay() {}, confirm() {}, tick() {}, get address() { return null; }, destroy() { n.remove(); root.classList.remove('pin-root'); } };
  }
  const { scene } = K, city = buildCity(), A = CITY.area;
  const map = new THREE.Mesh(new THREE.PlaneGeometry(26, 26).rotateX(-Math.PI / 2), mapMaterial(paintCity(city, CITY.near, true), paintCity(city, CITY.far, false)));
  map.position.y = -0.002; map.renderOrder = 0; scene.add(map);
  const MU = map.material.uniforms, BACK_Y = K.backdrop.x;
  const behind = (x, y, z, out) => {                       // where the line from the camera through the pin's head meets the backdrop
    const C = K.camera.position, t = (-2.8 - C.z) / (z - C.z);
    return out.set(C.x + (x - C.x) * t, C.y + (y + PIN.c - C.y) * t);
  };
  const _b = new THREE.Vector2(), _b0 = new THREE.Vector2();
  const rings = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6).rotateX(-Math.PI / 2), ringMaterial());
  rings.position.y = 0.003; rings.renderOrder = 3; scene.add(rings);
  const U = rings.material.uniforms;

  const body = new THREE.Mesh(pinGeometry(), K.glass); body.renderOrder = 2; body.layers.enable(1);
  const pivot = new THREE.Group(); pivot.add(body); scene.add(pivot);
  K.casters.push(body);

  // the channels, each on its own spring: where it goes (x, z), its height, its lean (how far the head leads, x and z)
  const sx = new Spring(0, { stiffness: 30, zeta: 0.9 }), sz = new Spring(0, { stiffness: 30, zeta: 0.9 }), sy = new Spring(0, { stiffness: 55, zeta: 0.85 });
  const lx = new Spring(0), lz = new Spring(0);
  const FLY = [110, 0.5], STUCK = [380, 0.09], FOCUS = [1.5, 1.1];
  let state = 'wait', vy = 0, aim = 0, rip = -1, ripX = 0, ripZ = 0, ripK = 1, mark = 0, markR = 0.2, spot = 0, sway = 0;
  const dir = new THREE.Vector2(0.8, 0.6), _v = new THREE.Vector2(), goal = new THREE.Vector2(), focus = new THREE.Vector2();
  const focusAt = (x, z, k = 1) => {                    // the focus pulls towards (x, z): the mark, as a focus puller knows where it lands
    focus.x = lerp(focus.x, THREE.MathUtils.clamp(x, -FOCUS[0], FOCUS[0]), k); focus.y = lerp(focus.y, THREE.MathUtils.clamp(z, -FOCUS[1], FOCUS[1]), k);
  };
  function reset() {
    sx.x = sx.target = PIN.from[0]; sy.x = PIN.from[1]; sz.x = sz.target = PIN.from[2]; sx.v = sy.v = sz.v = 0;
    lx.x = lx.v = lz.x = lz.v = 0; lx.set(...FLY); lz.set(...FLY);
    rip = -1; mark = 0; spot = 0; state = 'wait';
  }
  function goTo(x, z) {
    if (reduce) {                                         // no flight: it is simply there, and so is the focus
      sx.x = sx.target = x; sz.x = sz.target = z; goal.set(x, z); sy.x = 0; state = 'stuck'; rip = -1; spot = 1; focusAt(x, z); U.uMark.value.set(x, z, 0.07, 0); return;
    }
    _v.set(x - sx.x, z - sz.x); if (_v.lengthSq() > 1e-4) dir.copy(_v).normalize();
    goal.set(x, z); sy.target = PIN.hover;            // it lifts first, then goes (see step)
    if (state === 'drop') sy.v = vy;                      // caught mid-fall: the height spring takes its speed
    if (state !== 'fly' && state !== 'leave') { lx.set(...FLY); lz.set(...FLY); }
    state = 'fly'; markR = Math.max(markR, 0.16);
  }
  function leave() {                                      // replay: it pulls its tip out and flies off the way it came, then comes back
    goal.set(PIN.from[0], PIN.from[2]); sy.target = PIN.from[1];
    if (state === 'drop') sy.v = vy;
    if (state !== 'fly') { lx.set(...FLY); lz.set(...FLY); }
    state = 'leave';
  }
  function impact(v) {
    state = 'stuck'; sy.x = 0; vy = 0;
    lx.set(...STUCK); lz.set(...STUCK);
    const k = Math.min(1.9, 0.8 * v);                     // the knock: the glass springs about its tip, along its way in
    lx.v += dir.x * k; lz.v += dir.y * k;
    rip = 0; ripX = sx.x; ripZ = sz.x; ripK = clamp01(v / 2.2);
  }
  const frustum = new THREE.Frustum(), _m = new THREE.Matrix4(), bound = new THREE.Sphere(new THREE.Vector3(), 0.55);
  function inView() {
    K.camera.updateMatrixWorld(); _m.multiplyMatrices(K.camera.projectionMatrix, K.camera.matrixWorldInverse); frustum.setFromProjectionMatrix(_m);
    bound.center.set(sx.x, sy.x + 0.5, sz.x); return frustum.intersectsSphere(bound);
  }
  function step(dt, now) {
    if (state === 'fly' || state === 'aim' || state === 'leave') {
      if (sy.x > 0.12) { sx.target = goal.x; sz.target = goal.y; }   // the tip clears the map before it travels
      sx.step(dt); sz.step(dt); sy.step(dt);
      lx.target = THREE.MathUtils.clamp(sx.accel() * 0.05, -0.3, 0.3);   // the head leans with the acceleration
      lz.target = THREE.MathUtils.clamp(sz.accel() * 0.05, -0.3, 0.3);
      const dist = Math.hypot(sx.x - goal.x, sz.x - goal.y), sp = Math.hypot(sx.v, sz.v);
      if (state === 'fly' && dist < 0.012 && sp < 0.07 && Math.abs(sy.x - PIN.hover) < 0.03 && Math.abs(sy.v) < 0.12) { state = 'aim'; aim = 0; sy.target = PIN.hover + 0.07; }
      if (state === 'aim' && (aim += dt) > 0.15) { state = 'drop'; vy = sy.v; }
      if (state === 'leave' && (!inView() || dist < 0.05)) { reset(); pick(...PIN.home); }   // out of the frame: it comes back in
    } else if (state === 'drop') {
      sx.step(dt); sz.step(dt);
      lx.target = lz.target = 0;
      vy -= G * dt; sy.x += vy * dt;
      if (sy.x <= 0) impact(-vy);
    }
    lx.step(dt); lz.step(dt);
    if (rip >= 0) rip += dt;
    const flying = state === 'fly' || state === 'aim' || state === 'drop';
    mark = damp(mark, flying ? 1 : 0, flying ? 8 : 10, dt);
    const dist = Math.hypot(sx.x - goal.x, sz.x - goal.y);
    markR = damp(markR, 0.075 + 0.11 * clamp01(dist / 0.7), 5, dt);
    spot = damp(spot, state === 'stuck' ? 1 : 0, state === 'stuck' ? 3 : 8, dt);
    sway = damp(sway, state === 'stuck' && !reduce ? 1 : 0, 1.2, dt);
    if (!reduce && state !== 'leave' && state !== 'wait') focusAt(goal.x, goal.y, 1 - Math.exp(-3.2 * dt));   // it racks to the new mark as the pin flies
    ready(state === 'stuck');
  }
  function render(now) {
    const swx = sway * 0.022 * Math.sin(now / 3900), swz = sway * 0.016 * Math.sin(now / 5300 + 1.3);
    pivot.position.set(sx.x, sy.x, sz.x);
    pivot.rotation.set(lz.x + swz, 0, -(lx.x + swx), 'XZY');   // the head leads by (lx, lz) radians
    U.uMark.value.set(goal.x, goal.y, markR, mark);
    U.uRip.value.set(ripX, ripZ, rip); U.uRipK.value = ripK;
    U.uSpot.value.set(sx.x, sz.x, spot);
    U.uHov.value.set(hv.x, hv.z, hv.k);
    behind(sx.x, sy.x, sz.x, _b);                         // what the glass sees behind it moves with it, so it keeps its tone anywhere
    K.backdrop.x = BACK_Y + _b.y - _b0.y; K.backdrop.w = 0.85 * (_b.x - _b0.x);
    MU.uFocus.value.copy(focus); MU.uCam.value.copy(K.camera.position);
    K.camera.getWorldDirection(MU.uFwd.value); MU.uRight.value.crossVectors(MU.uFwd.value, Y).normalize();
    K.renderShadow(Math.max(0, sy.x) * 0.9);
    K.draw();
  }

  // ── the address: a click lands on the nearest curb, and the card under the map names it and confirms it ──
  const card = document.createElement('div'); card.className = 'pin-addr';
  card.innerHTML = '<div class="pin-addr-t" role="status"><span class="pin-addr-k"></span><span class="pin-addr-a"></span><span class="pin-addr-b"></span></div>'
    + '<button class="pin-addr-go" type="button" aria-disabled="true"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.6 8.4l2.9 2.9 5.9-6.6"/></svg><span></span></button>';
  container.appendChild(card);
  const cardT = card.querySelector('.pin-addr-t'), cardA = card.querySelector('.pin-addr-a'), cardB = card.querySelector('.pin-addr-b'), go = card.querySelector('.pin-addr-go'), goT = go.querySelector('span');
  card.querySelector('.pin-addr-k').textContent = L.title; goT.textContent = L.confirm;
  let here = null;
  const emit = (type) => root.dispatchEvent(new CustomEvent(type, { bubbles: true, detail: here && { address: here.address, neighbourhood: here.hood, place: here.place || null } }));
  let cardTimer = 0, confirmed = false, isReady = null;
  function showAddress(sn, place) {
    const a = sn.address, b = place ? `${place} · ${sn.hood}` : sn.hood;
    if (cardA.textContent === a && cardB.textContent === b) return;
    const put = () => { cardA.textContent = a; cardB.textContent = b; cardT.classList.remove('swap'); };
    clearTimeout(cardTimer);
    if (!cardA.textContent || reduce || o.manual) { put(); return; }
    cardT.classList.add('swap'); cardTimer = setTimeout(put, 140);   // out, new text, back in
  }
  function ready(r) { r = r && !confirmed; if (r !== isReady) { isReady = r; go.setAttribute('aria-disabled', r ? 'false' : 'true'); } }
  function confirmIt(v) { confirmed = v; go.classList.toggle('done', v); goT.textContent = v ? L.confirmed : L.confirm; isReady = null; }
  go.addEventListener('click', () => {
    if (state !== 'stuck' || confirmed) return;
    confirmIt(true); ready(false);
    rip = 0; ripX = sx.x; ripZ = sz.x; ripK = 0.55;      // a soft ripple from the pin
    emit('pinconfirm');
  });
  function pick(x, z) {
    x = THREE.MathUtils.clamp(x, -A[0], A[0]); z = THREE.MathUtils.clamp(z, A[1], A[2]);
    const poi = city.pois.find((p) => Math.hypot(p.x - x, p.z - z) < 0.02), sn = poi ? poi.snap : city.snap(x, z);
    confirmIt(false); showAddress(sn, poi && poi.name);
    here = Object.assign({ place: poi && poi.name }, sn); emit('pinchange');
    goTo(sn.x, sn.z);
  }

  // ── the names on the map: real type along the streets, as on a map, blurred by the same lens as the map under them ──
  const layer = document.createElement('div'); layer.className = 'pin-mapl'; layer.setAttribute('aria-hidden', 'true'); container.insertBefore(layer, card);
  const cands = [], labels = [], meas = document.createElement('canvas').getContext('2d');
  for (const st of city.streets) {
    const cls = st.kind === 'st' ? '' : 'av', pr = st.kind === 'av' ? 0 : st.kind === 'bank' ? 1 : 2;
    const pieces = st.kind === 'bank' ? st.pieces.filter((_, k) => k % 7 === 4) : st.pieces.filter((p) => Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1]) > 0.12);
    for (const p of pieces) cands.push({ text: st.name, cls, pr, x: (p.a[0] + p.b[0]) / 2, z: (p.a[1] + p.b[1]) / 2, dir: [p.b[0] - p.a[0], p.b[1] - p.a[1]], max: st.kind === 'st' ? 2 : 3, key: st.id });
  }
  for (const p of city.pois) cands.push({ text: p.name, cls: 'poi', pr: 2, x: p.x, z: p.z, dx: 9, max: 1, key: 'o' + p.id, kind: 'poi' });
  city.parks.forEach((p, k) => { const [a, b, c, d] = city.parkRect(p), [x, z] = city.toW((a + b) / 2, (c + d) / 2); cands.push({ text: p.name, cls: 'park', pr: 2, x, z, max: 1, key: 'p' + k }); });
  for (let x = -1.4; x <= 1.41; x += 0.35) cands.push({ text: NAMES.river, cls: 'river', pr: 2, x, z: city.zr(x), dir: [1, -0.22 + 0.14 * Math.cos(1.4 * x + 0.6)], max: 1, key: 'w' });
  cands.sort((a, b) => a.pr - b.pr || Math.hypot(a.x - PIN.home[0], a.z - PIN.home[1]) - Math.hypot(b.x - PIN.home[0], b.z - PIN.home[1]));
  const _p = new THREE.Vector3();
  const toScreen = (x, y, z) => { _p.set(x, y, z).project(K.camera); return [(_p.x + 1) / 2 * container.clientWidth, (1 - _p.y) / 2 * container.clientHeight]; };
  const wpp = (x, y, z) => 2 * Math.hypot(x - K.camera.position.x, y - K.camera.position.y, z - K.camera.position.z) * Math.tan(THREE.MathUtils.degToRad(K.camera.fov / 2)) / container.clientHeight;
  function layout() {
    const W = container.clientWidth, H = container.clientHeight; if (!W || !H) return;
    K.camera.updateMatrixWorld();
    const top = card.offsetTop - 8, placed = [], count = {}; let places = 0;
    layer.textContent = ''; labels.length = 0;
    for (const c of cands) {
      if ((count[c.key] || 0) >= c.max || (c.kind === 'poi' && places >= 6)) continue;
      const [x, y] = toScreen(c.x, 0, c.z); let ang = 0;
      if (c.dir) {
        const L = Math.hypot(...c.dir), [x2, y2] = toScreen(c.x + c.dir[0] / L * 0.05, 0, c.z + c.dir[1] / L * 0.05);
        ang = Math.atan2(y2 - y, x2 - x); if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
        if (Math.abs(ang) > 1.36) continue;              // too steep to read
      }
      meas.font = `${c.cls === 'river' ? 'italic ' : ''}500 ${c.cls === 'av' ? 11 : 10.5}px "DM Sans", sans-serif`;
      const w = meas.measureText(c.text).width * 1.03 + 2, cx = x + (c.dx ? c.dx + w / 2 : 0), cy = y;
      const n = Math.max(2, Math.ceil(w / 13)), circ = [];
      for (let k = 0; k < n; k++) { const t = (k / (n - 1) - 0.5) * (w - 8); circ.push([cx + Math.cos(ang) * t, cy + Math.sin(ang) * t]); }
      if (circ.some(([px, py]) => px < 10 || px > W - 10 || py < 10 || py > top)) continue;
      if (circ.some(([px, py]) => placed.some(([qx, qy]) => (qx - px) ** 2 + (qy - py) ** 2 < 15 * 15))) continue;
      if (count[c.key] && labels.some((l) => l.key === c.key && Math.hypot(l.cx - cx, l.cy - cy) < 170)) continue;
      placed.push(...circ); count[c.key] = (count[c.key] || 0) + 1; if (c.kind === 'poi') places++;
      const el = document.createElement('span'); el.className = 'pin-ml ' + c.cls; el.textContent = c.text;
      el.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px) translate(-50%, -50%) rotate(${ang.toFixed(4)}rad)`;
      layer.appendChild(el);
      labels.push({ el, key: c.key, cx, cy, circ, x: c.x, z: c.z, blur: -1, op: -1, vis: 1 });
      if (labels.length >= 40) break;
    }
    labelStep(10);
  }
  const _f = new THREE.Vector3(), _r = new THREE.Vector3(), _w = new THREE.Vector3();
  function lensBlur(x, z) {                               // the map shader's lensBlur, in JS
    const B = MU.uBlur.value; _w.set(x - focus.x, 0, z - focus.y);
    const e = Math.hypot(_w.dot(_f), _w.dot(_r) * B.z) - B.y;
    return B.x * 0.5 * (e + Math.sqrt(e * e + 0.01));
  }
  function labelStep(dt) {
    K.camera.getWorldDirection(_f); _r.crossVectors(_f, Y).normalize();
    const [hx, hy] = toScreen(sx.x, sy.x + PIN.c, sz.x), [tx, ty] = toScreen(sx.x, sy.x, sz.x), rp = PIN.r / wpp(sx.x, sy.x + PIN.c, sz.x);
    const segD = (px, py) => { const vx = tx - hx, vy = ty - hy, t = clamp01(((px - hx) * vx + (py - hy) * vy) / (vx * vx + vy * vy || 1)); return Math.hypot(px - hx - vx * t, py - hy - vy * t); };
    for (const l of labels) {
      const hide = state !== 'wait' && l.circ.some(([px, py]) => Math.hypot(px - hx, py - hy) < rp + 8 || segD(px, py) < rp * 0.5 + 6);   // out of the pin's way
      l.vis = damp(l.vis, hide ? 0 : 1, 10, dt);
      const b = Math.max(0, lensBlur(l.x, l.z) / wpp(l.x, 0, l.z) - 0.35), op = clamp01(1.3 - b * 0.38) * l.vis;
      if (Math.abs(b - l.blur) > 0.06) { l.el.style.filter = b < 0.1 ? '' : `blur(${b.toFixed(2)}px)`; l.blur = b; }
      if (Math.abs(op - l.op) > 0.01) { l.el.style.opacity = op.toFixed(3); l.op = op; }
    }
  }
  K.onResize = () => { behind(PIN.home[0], 0, PIN.home[1], _b0); layout(); };
  let dead = false;
  const refit = () => { if (!dead) layout(); };
  if (document.fonts) { document.fonts.ready.then(refit); document.fonts.addEventListener('loadingdone', refit); }

  // ── hover (mouse and pen): the address under the pointer, the street lit up, a small ring on the curb ──
  const ray = new THREE.Raycaster(), floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3(), ndc = new THREE.Vector2();
  const tag = document.createElement('div'), faces = [document.createElement('span'), document.createElement('span')];
  tag.className = 'pin-tag'; tag.setAttribute('aria-hidden', 'true'); tag.append(...faces); container.appendChild(tag);
  const tg = { f: null, shown: 0, x: 0, y: 0, tx: 0, ty: 0, w: 0, front: 0, key: '', text: '' }, hv = { x: 0, z: 0, k: 0 };
  const head = new THREE.Sphere(new THREE.Vector3(), PIN.r), tip = new THREE.Sphere(new THREE.Vector3(), 0.14);
  const ribbons = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.BufferGeometry(), ribbonMaterial(MU)); m.position.y = 0.001; m.renderOrder = 1; m.visible = false; m.frustumCulled = false; scene.add(m);
    return { m, id: null, k: 0 };
  });
  const ribbonGeo = new Map();
  function featureAt(x, z, tol) {
    const cx = THREE.MathUtils.clamp(x, -A[0], A[0]), cz = THREE.MathUtils.clamp(z, A[1], A[2]);
    const poi = city.pois.find((p) => Math.hypot(p.x - x, p.z - z) < 0.016 + tol);
    if (poi) return { key: 'o' + poi.id, label: poi.name, sub: poi.snap.address, ring: [poi.x, poi.z] };
    const sn = city.snap(cx, cz);
    if (!city.land(x, z, CITY.BR)) return { key: 'w', label: NAMES.river, sub: sn.address, ring: [sn.x, sn.z] };
    const pk = city.parkOf(...city.cellOf(x, z));
    if (pk >= 0) return { key: 'p' + pk, label: city.parks[pk].name, sub: sn.address, ring: [sn.x, sn.z] };
    return { key: 's' + sn.street.id, street: sn.street, label: sn.address, sub: sn.hood, ring: [sn.x, sn.z] };
  }
  function face(el, f) { el.textContent = f.label; if (f.sub) { const i = document.createElement('i'); i.textContent = f.sub; el.append(i); } }
  function hover(f) {
    const was = tg.f; tg.f = f; if (!f) return;
    if (!was) { hv.x = f.ring[0]; hv.z = f.ring[1]; }
    if (f.street && !ribbons.some((r) => r.id === f.street.id)) {
      const r = ribbons.reduce((a, b) => (a.k < b.k ? a : b)); r.id = f.street.id; r.k = 0;
      if (!ribbonGeo.has(f.street.id)) ribbonGeo.set(f.street.id, ribbonGeometry(f.street));
      r.m.geometry = ribbonGeo.get(f.street.id);
    }
    const text = f.label + '|' + (f.sub || '');
    if (text === tg.text) return;
    tg.text = text;
    if (f.key === tg.key && tg.shown > 0.02) {           // the same street, another number: the text just changes
      face(faces[tg.front], f); tg.w = faces[tg.front].offsetWidth; tag.style.width = tg.w + 'px'; return;
    }
    tg.key = f.key;
    const next = faces[1 - tg.front]; face(next, f); tg.w = next.offsetWidth;
    if (tg.shown < 0.02) { tag.style.transition = 'none'; tag.style.width = tg.w + 'px'; void tag.offsetWidth; tag.style.transition = ''; }
    else tag.style.width = tg.w + 'px';
    faces[tg.front].style.opacity = '0'; next.style.opacity = '1'; tg.front = 1 - tg.front;
  }
  function placeTag(px, py) {                             // above and to the right of the pointer, flipped near the edges
    const W = container.clientWidth;
    tg.tx = px + 14 + tg.w > W - 10 ? px - 14 - tg.w : px + 14; tg.ty = py - 40 < 8 ? py + 18 : py - 40;
    if (tg.shown < 0.02 || reduce) { tg.x = tg.tx; tg.y = tg.ty; }
  }
  function aimAt(clientX, clientY) {                      // the floor under a pointer, or null over the pin
    const r = K.canvas.getBoundingClientRect();
    ndc.set((clientX - r.left) / r.width * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, K.camera);
    head.center.set(sx.x, sy.x + PIN.c, sz.x); tip.center.set(sx.x, sy.x + 0.22, sz.x);
    if (ray.ray.intersectsSphere(head) || ray.ray.intersectsSphere(tip) || !ray.ray.intersectPlane(floor, hit)) return null;
    return hit;
  }
  function look(clientX, clientY) {
    const h = aimAt(clientX, clientY); if (!h) { hover(null); return; }
    const r = K.canvas.getBoundingClientRect();
    hover(featureAt(h.x, h.z, 4 * wpp(h.x, 0, h.z)));
    placeTag(clientX - r.left, clientY - r.top);
  }
  K.canvas.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') look(e.clientX, e.clientY); });
  K.canvas.addEventListener('pointerleave', () => hover(null));
  K.canvas.addEventListener('pointerdown', (e) => { const h = aimAt(e.clientX, e.clientY); if (h) pick(h.x, h.z); });
  function hoverStep(dt) {
    const f = tg.f;
    for (const r of ribbons) {
      const on = !!(f && f.street && f.street.id === r.id);
      r.k = damp(r.k, on ? 1 : 0, on ? 12 : 7, dt); r.m.visible = r.k > 0.003; r.m.material.uniforms.uK.value = r.k;
    }
    if (f) { hv.x = reduce ? f.ring[0] : damp(hv.x, f.ring[0], 30, dt); hv.z = reduce ? f.ring[1] : damp(hv.z, f.ring[1], 30, dt); }
    hv.k = damp(hv.k, f ? 1 : 0, f ? 14 : 9, dt);
    tg.shown = damp(tg.shown, f ? 1 : 0, f ? 16 : 10, dt);
    tg.x = damp(tg.x, tg.tx, 24, dt); tg.y = damp(tg.y, tg.ty, 24, dt);
    tag.style.opacity = tg.shown < 0.003 ? '0' : tg.shown.toFixed(3);
    tag.style.transform = `translate3d(${tg.x.toFixed(1)}px, ${(tg.y + (1 - tg.shown) * 4).toFixed(1)}px, 0)`;
  }

  function replay() { if (reduce || state === 'wait') { pick(...PIN.home); return; } leave(); }
  K.onVisible = () => { if (state === 'wait' && o.autoplay !== false) pick(...PIN.home); };

  reset(); focusAt(...PIN.home);
  K.start((dt, now) => {
    hoverStep(dt); labelStep(dt);
    step(dt, now);
    render(now);
  });
  return {
    ready: Promise.resolve(),
    replay,
    confirm: () => go.click(),
    tick: (dt, now) => K.tick && K.tick(dt, now),
    project: (x, z) => { K.camera.updateMatrixWorld(); return toScreen(x, 0, z).slice(0, 2); },   // where a point of the map is, in the root's pixels
    home: () => city.snap(...PIN.home),
    get address() { return here && { address: here.address, neighbourhood: here.hood, place: here.place || null }; },
    destroy() {
      dead = true; if (document.fonts) document.fonts.removeEventListener('loadingdone', refit);
      clearTimeout(cardTimer); K.destroy();
      card.remove(); tag.remove(); layer.remove(); root.classList.remove('pin-root');
    }
  };
}
