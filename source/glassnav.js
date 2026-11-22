/* the liquid glass nav bar: its CSS, markup and motion engine (also what the piece page hands out as code),
   and the demo the tiles and the piece page play */
(function () {

  var CSS = `/* Liquid glass nav bar · Sara Lobo Library
   Figma "Liquid Glass Button - Dark", 291×60, for a dark app. Paint order follows the Figma layer: background blur →
   fills → lenses → capsule and icons → inner shadows → strokes. The bar stays out of any stacking context (no transform,
   opacity or isolation on it), so every blend mode mixes with what is behind it: keep it on a solid background. */
.lgn-wrap{position:relative;display:inline-block}
.lgn{position:relative;display:block;width:291px;height:60px;border-radius:999px;overflow:hidden;touch-action:pan-y;-webkit-user-select:none;user-select:none}
.lgn > *{position:absolute}
.lgn-fx{inset:0;border-radius:inherit;pointer-events:none}

/* fills, bottom to top: a soft light from the top left, a grey veil and a near-white linear burn */
.lgn-blur{-webkit-backdrop-filter:blur(15.96px);backdrop-filter:blur(15.96px)}
.lgn-sheen{mix-blend-mode:plus-lighter;opacity:.1;background:url("data:image/svg+xml;utf8,<svg viewBox='0 0 291 60' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(16.645 3.2563 -15.793 3.4319 38.852 9.8387)'><stop stop-color='%23fff'/><stop offset='1' stop-color='%23fff' stop-opacity='0'/></radialGradient></defs><rect width='291' height='60' fill='url(%23g)'/></svg>") 0 0/100% 100%}
.lgn-veil{background:rgba(51,51,51,.2)}
.lgn-burn{background:#E6E6E6;mix-blend-mode:color-burn}

/* lenses: four nested capsules, each a little smaller, each blurring what is behind it a little less */
.lgn-lens{border-radius:999px;background:rgba(255,255,255,.01);pointer-events:none}
.lgn-lens:nth-of-type(1){inset:0 .09px 0 -.21px;-webkit-backdrop-filter:blur(10.64px);backdrop-filter:blur(10.64px)}
.lgn-lens:nth-of-type(2){inset:.64px .52px .64px .23px;-webkit-backdrop-filter:blur(5.32px);backdrop-filter:blur(5.32px)}
.lgn-lens:nth-of-type(3){inset:1.91px 1.4px 1.91px 1.11px;-webkit-backdrop-filter:blur(2.66px);backdrop-filter:blur(2.66px)}
.lgn-lens:nth-of-type(4){inset:8.3px 5.8px 8.3px 5.5px;-webkit-backdrop-filter:blur(.21px);backdrop-filter:blur(.21px)}

/* the capsule and the icons; a dark copy of the icons, cut to the capsule's shape, sits on top */
.lgn-content,.lgn-hits{inset:0}
.lgn-content{pointer-events:none}
.lgn-pill{position:absolute;left:111px;top:3px;width:70px;height:54px;border-radius:27px;background:#fff}
.lgn-icons{position:absolute;inset:0}
.lgn-icons .ic{position:absolute;top:18px;width:24px;height:24px;color:#fff}
.lgn-icons.lgn-dark .ic{color:#33363F}
.ic[data-i="0"]{left:20px;--lv:lgn-home}
.ic[data-i="1"]{left:67px;--lv:lgn-search}
.ic[data-i="2"]{left:134px;--lv:none}
.ic[data-i="3"]{left:196px;top:17px;width:29px;height:29px;--lv:lgn-send;--lvd:760ms}
.ic[data-i="4"]{left:248px;--lv:lgn-gear;--lvd:820ms;--lve:cubic-bezier(.3,1.45,.45,1)}
.ic-a{display:block;width:100%;height:100%;transform-origin:50% 50%;transition:transform .2s cubic-bezier(.2,.8,.2,1)}
.ic svg{display:block}
.ic.lgn-press .ic-a{transform:scale(.86)}

/* inner shadows, drawn over everything: a wide linear burn, a grey overlay ring, and light edges that add.
   Linear burn exists only in Safari (plus-darker); elsewhere a colour burn a little stronger gives the same dark glass.
   The last two shadows of the rim are Figma's Glass light (-45°, 80%): strong on the top left, weaker on the bottom right. */
.lgn-shade{box-shadow:inset 0 0 46.52px rgba(242,242,242,.8);mix-blend-mode:color-burn}
@supports (mix-blend-mode:plus-darker){
  .lgn-burn{mix-blend-mode:plus-darker}
  .lgn-shade{box-shadow:inset 0 0 46.52px rgba(242,242,242,.5);mix-blend-mode:plus-darker}
}
.lgn-ring{box-shadow:inset 0 0 0 2.11px #999;mix-blend-mode:overlay}
.lgn-rim{box-shadow:inset 4.23px 4.23px 2.11px -4.23px #B3B3B3,inset -4.23px -4.23px 2.11px -4.23px #B3B3B3,
  inset 12px 12px 1.5px -14px rgba(255,255,255,.75),inset -12px -12px 1.5px -14px rgba(255,255,255,.35);mix-blend-mode:plus-lighter}
/* with the capsule at an end, the rim light steps back there, so the dark gap around the capsule reads even */
.lgn-rim.lgn-fade{-webkit-mask-image:linear-gradient(90deg,rgba(0,0,0,calc(1 - var(--fl,0))) 0,#000 76px,#000 calc(100% - 76px),rgba(0,0,0,calc(1 - var(--fr,0))) 100%);
  mask-image:linear-gradient(90deg,rgba(0,0,0,calc(1 - var(--fl,0))) 0,#000 76px,#000 calc(100% - 76px),rgba(0,0,0,calc(1 - var(--fr,0))) 100%)}
/* strokes, inside, 0.43px: white at 10%, and a white-to-clear gradient that adds */
.lgn-line{box-shadow:inset 0 0 0 .43px rgba(255,255,255,.1)}
.lgn-edge{inset:0;width:100%;height:100%;mix-blend-mode:plus-lighter;pointer-events:none}

/* tap targets: one button per item, laid out by the script; on the chosen item the focus ring hugs the capsule */
.lgn-hit{all:unset;position:absolute;top:0;height:60px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.lgn-hit:focus-visible{outline:none}
.lgn-hit:focus-visible::after{content:"";position:absolute;left:calc(var(--ic) - 25px);top:5px;width:50px;height:50px;border-radius:50%;box-shadow:0 0 0 2px #9DB8FF}
.lgn-hit[aria-current]:focus-visible::after{left:calc(var(--ic) - 36px);top:2px;width:72px;height:56px;border-radius:28px}
.lgn-dragging,.lgn-dragging .lgn-hit{cursor:grabbing}

/* each icon's gesture when it is chosen: the house jumps, the lens peeks, the message takes off, the gear turns */
.ic.lgn-gesture .ic-a{transition:none;animation:var(--lv) var(--lvd,640ms) var(--lve,cubic-bezier(.2,.8,.2,1)) both}
@keyframes lgn-home{0%{transform:none}28%{transform:translateY(-3.5px) scale(1.08,.9)}52%{transform:translateY(0) scale(.92,1.08)}74%{transform:scale(1.03,.97)}100%{transform:none}}
@keyframes lgn-search{0%{transform:none}34%{transform:rotate(-26deg) scale(1.16)}68%{transform:rotate(9deg) scale(.98)}100%{transform:none}}
@keyframes lgn-send{0%{transform:none;opacity:1}36%{transform:translate(13px,-13px) scale(.6);opacity:0}37%{transform:translate(-13px,13px) scale(.6);opacity:0}100%{transform:none;opacity:1}}
@keyframes lgn-gear{from{transform:rotate(0)}to{transform:rotate(120deg)}}
/* the AI does not turn: its big star takes a breath and the small one twinkles, a beat later */
.ic[data-i="2"] path{transform-box:fill-box;transform-origin:50% 50%}
.ic[data-i="2"].lgn-gesture path:first-child{animation:lgn-ai-big 560ms cubic-bezier(.2,.8,.2,1) both}
.ic[data-i="2"].lgn-gesture path:last-child{animation:lgn-ai-small 640ms cubic-bezier(.2,.8,.2,1) 120ms both}
@keyframes lgn-ai-big{0%{transform:none}24%{transform:scale(.84)}60%{transform:scale(1.1)}100%{transform:none}}
@keyframes lgn-ai-small{0%{transform:none}20%{transform:scale(.15)}62%{transform:scale(1.45)}100%{transform:none}}

/* sparks blend by difference: dark over the white capsule, white over the glass and the page */
.lgn-spark{position:absolute;left:0;top:0;pointer-events:none;color:#fff;mix-blend-mode:difference}
.lgn-dot{width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%;background:#fff}
.lgn-star{width:var(--sz,10px);height:var(--sz,10px);margin:calc(var(--sz,10px) / -2) 0 0 calc(var(--sz,10px) / -2);filter:drop-shadow(0 0 2.5px rgba(255,255,255,.9))}
.lgn-star svg{display:block;width:100%;height:100%}

@media (prefers-reduced-motion:reduce){ .ic-a{transition:none} .ic.lgn-gesture .ic-a,.ic.lgn-gesture path{animation:none} }`;

  var NAV = `<nav class="lgn" aria-label="Navegação principal">
  <span class="lgn-fx lgn-blur" aria-hidden="true"></span>
  <span class="lgn-fx lgn-sheen" aria-hidden="true"></span>
  <span class="lgn-fx lgn-veil" aria-hidden="true"></span>
  <span class="lgn-fx lgn-burn" aria-hidden="true"></span>
  <i class="lgn-lens" aria-hidden="true"></i>
  <i class="lgn-lens" aria-hidden="true"></i>
  <i class="lgn-lens" aria-hidden="true"></i>
  <i class="lgn-lens" aria-hidden="true"></i>
  <div class="lgn-content" aria-hidden="true">
    <span class="lgn-pill"></span>
    <div class="lgn-icons">
      <span class="ic" data-i="0"><span class="ic-a"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8.09525 7.34693L7.09525 8.20407C6.06437 9.08769 5.54892 9.5295 5.27446 10.1262C5 10.723 5 11.4019 5 12.7596V17C5 18.8856 5 19.8284 5.58579 20.4142C6.17157 21 7.11438 21 9 21H15C16.8856 21 17.8284 21 18.4142 20.4142C19 19.8284 19 18.8856 19 17V12.7596C19 11.4019 19 10.723 18.7255 10.1262C18.4511 9.5295 17.9356 9.08769 16.9047 8.20407L15.9047 7.34693C14.0414 5.7498 13.1098 4.95123 12 4.95123C10.8902 4.95123 9.95857 5.7498 8.09525 7.34693Z" stroke-width="2" stroke="currentColor"/><path d="M14.5 21V16C14.5 15.4477 14.0523 15 13.5 15H10.5C9.94772 15 9.5 15.4477 9.5 16V21" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></svg></span></span>
      <span class="ic" data-i="1"><span class="ic-a"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20L17 17" stroke-width="2" stroke-linecap="round" stroke="currentColor"/></svg></span></span>
      <span class="ic" data-i="2"><span class="ic-a"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M10 5C11.1 10.5 12.5 11.9 18 13C12.5 14.1 11.1 15.5 10 21C8.9 15.5 7.5 14.1 2 13C7.5 11.9 8.9 10.5 10 5Z" stroke-width="2" stroke-linejoin="round" stroke="currentColor"/><path d="M18.5 2C19.025 4.50833 19.4917 4.975 22 5.5C19.4917 6.025 19.025 6.49167 18.5 9C17.975 6.49167 17.5083 6.025 15 5.5C17.5083 4.975 17.975 4.50833 18.5 2Z" stroke-width="2" stroke-linejoin="round" stroke="currentColor"/></svg></span></span>
      <span class="ic" data-i="3"><span class="ic-a"><svg width="29" height="29" viewBox="0 0 29 29" fill="none"><path d="M21.7229 4.69296C22.3309 4.58484 23.0897 4.56034 23.6975 5.07284L23.8176 5.18222L23.927 5.30234C24.4396 5.9102 24.415 6.66895 24.3069 7.27695C24.1902 7.93275 23.9088 8.76704 23.5862 9.73495L20.9719 17.5787C20.6466 18.5546 20.3903 19.3235 20.1673 19.8951C19.9575 20.4327 19.7221 20.9533 19.3801 21.3092C18.0357 22.7078 15.7967 22.7081 14.4524 21.3092C14.1104 20.9533 13.8751 20.4328 13.6653 19.8951C13.4423 19.3235 13.186 18.5547 12.8606 17.5787C12.7174 17.149 12.6787 17.0428 12.6331 16.9566C12.5001 16.7053 12.2946 16.4997 12.0432 16.3668C11.957 16.3212 11.8506 16.2824 11.4212 16.1393C10.4452 15.8139 9.67634 15.5576 9.10476 15.3346C8.56711 15.1248 8.04658 14.8894 7.69069 14.5475C6.29189 13.2031 6.29205 10.9642 7.69069 9.61972C8.04654 9.27777 8.56717 9.04238 9.10476 8.83261C9.67631 8.60961 10.4453 8.35321 11.4212 8.02792L19.2649 5.41366C20.2328 5.09104 21.0671 4.80968 21.7229 4.69296ZM22.3694 6.62949C22.3077 6.63039 22.2122 6.63784 22.0725 6.66269C21.5961 6.74758 20.9287 6.96713 19.8967 7.31113L12.054 9.92538C11.0567 10.2578 10.3447 10.4956 9.83132 10.6959C9.57729 10.795 9.3942 10.8767 9.26296 10.9459C9.19881 10.9798 9.15281 11.0076 9.12136 11.0289C9.10613 11.0392 9.09448 11.0475 9.08718 11.0533C9.08382 11.056 9.08102 11.0587 9.07937 11.0601C9.07792 11.0613 9.07644 11.0621 9.07644 11.0621C8.49698 11.6195 8.49681 12.5478 9.07644 13.1051C9.07644 13.1051 9.0778 13.1057 9.07937 13.107C9.08106 13.1085 9.0837 13.1111 9.08718 13.1139C9.09452 13.1197 9.10601 13.1279 9.12136 13.1383C9.15284 13.1596 9.1987 13.1874 9.26296 13.2213C9.39423 13.2905 9.5772 13.3721 9.83132 13.4713C10.3447 13.6716 11.0566 13.9093 12.054 14.2418C12.4194 14.3636 12.7114 14.4584 12.9778 14.5992C13.5842 14.9199 14.0799 15.4156 14.4007 16.0221C14.5416 16.2885 14.6362 16.5804 14.7581 16.9459C15.0906 17.9434 15.3283 18.6551 15.5286 19.1685C15.6278 19.4228 15.7093 19.6056 15.7786 19.7369C15.8125 19.8012 15.8402 19.847 15.8616 19.8785C15.872 19.8939 15.8801 19.9053 15.886 19.9127C15.8888 19.9162 15.8913 19.9188 15.8928 19.9205C15.8943 19.9221 15.8948 19.9234 15.8948 19.9234C16.4521 20.5031 17.3803 20.5029 17.9378 19.9234C17.9378 19.9234 17.9385 19.922 17.9397 19.9205C17.9412 19.9188 17.9438 19.9161 17.9466 19.9127C17.9524 19.9054 17.9606 19.8937 17.971 19.8785C17.9923 19.8471 18.0201 19.8011 18.054 19.7369C18.1232 19.6057 18.2048 19.4226 18.304 19.1685C18.5043 18.6552 18.742 17.9432 19.0745 16.9459L21.6887 9.10312C22.0328 8.07105 22.2523 7.40381 22.3372 6.92734C22.3622 6.7868 22.3686 6.69111 22.3694 6.62949Z" fill="currentColor"/></svg></span></span>
      <span class="ic" data-i="4"><span class="ic-a"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4.43094 7.63L3.08169 10.0555C2.55298 11.0059 2.28862 11.4812 2.28862 12C2.28862 12.5188 2.55298 12.9941 3.08169 13.9445L4.43094 16.37L5.85685 18.7512C6.41561 19.6843 6.69498 20.1509 7.14431 20.4103C7.59364 20.6697 8.13737 20.6784 9.22483 20.6957L12 20.74L14.7752 20.6957C15.8626 20.6784 16.4064 20.6697 16.8557 20.4103C17.305 20.1509 17.5844 19.6843 18.1431 18.7512L19.5691 16.37L20.9183 13.9445C21.447 12.9941 21.7114 12.5188 21.7114 12C21.7114 11.4812 21.447 11.0059 20.9183 10.0555L19.5691 7.63L18.1431 5.24876C17.5844 4.31567 17.305 3.84912 16.8557 3.5897C16.4064 3.33028 15.8626 3.3216 14.7752 3.30426L12 3.26L9.22483 3.30426C8.13737 3.3216 7.59364 3.33028 7.14431 3.5897C6.69498 3.84912 6.4156 4.31567 5.85685 5.24876L4.43094 7.63Z" stroke-width="2" stroke="currentColor"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg></span></span>
    </div>
  </div>
  <span class="lgn-fx lgn-shade" aria-hidden="true"></span>
  <span class="lgn-fx lgn-ring" aria-hidden="true"></span>
  <span class="lgn-fx lgn-rim" aria-hidden="true"></span>
  <span class="lgn-fx lgn-line" aria-hidden="true"></span>
  <svg class="lgn-edge" viewBox="0 0 291 60" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="lgn-edge" gradientUnits="userSpaceOnUse" x1="0" y1=".5" x2="1" y2=".5" gradientTransform="matrix(257.59 54.558 -264.61 53.112 165.7 -17.154)"><stop stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect x=".2128" y=".2128" width="290.5745" height="59.5745" rx="29.787" fill="none" stroke="url(#lgn-edge)" stroke-opacity=".1" stroke-width=".4255"/></svg>
  <div class="lgn-hits">
    <button class="lgn-hit" type="button" aria-label="Início"></button>
    <button class="lgn-hit" type="button" aria-label="Buscar"></button>
    <button class="lgn-hit" type="button" aria-label="Perguntar à IA"></button>
    <button class="lgn-hit" type="button" aria-label="Mensagens"></button>
    <button class="lgn-hit" type="button" aria-label="Ajustes"></button>
  </div>
</nav>`;

  function lgnEngine() {
    /* Liquid glass nav bar: the white capsule rides two springs to the chosen item, the icons step aside and each one
       has its own gesture. Works on the markup: .lgn-wrap > nav.lgn, with .lgn-icons, .lgn-pill, .lgn-rim and five
       .lgn-hit buttons. LiquidGlassNav.mount(nav) returns { select(i, quiet), active }. */
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // geometry from the Figma frame, where the AI is chosen. Choosing another item moves its neighbours aside the same
    // way: 66px from the chosen centre, the others evenly spaced, the capsule always 70 wide and at least 3px from the ends
    var BASE = [32, 79, 146, 211.5, 260], PW = 70, GAP = 66;
    function layoutFor(a) {
      if (a === 2) return BASE.slice();
      var first = a === 0 ? 3 + PW / 2 : BASE[0], last = a === 4 ? 288 - PW / 2 : BASE[4];
      var wide = (a > 0) + (a < 4), g = (last - first - GAP * wide) / (4 - wide), out = [first];
      for (var i = 1; i < 5; i++) out.push(out[i - 1] + (i === a || i - 1 === a ? GAP : g));
      return out;
    }
    var LAYOUTS = [0, 1, 2, 3, 4].map(layoutFor);
    function segOf(c) { return [0, (c[0] + c[1]) / 2, (c[1] + c[2]) / 2, (c[2] + c[3]) / 2, (c[3] + c[4]) / 2, 291]; }
    var STAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1C13 9 15 11 23 12C15 13 13 15 12 23C11 15 9 13 1 12C9 11 11 9 12 1Z"/></svg>';

    // springs: x moves toward t with stiffness k and damping c. c = 2√k is critical damping, so nothing bounces:
    // the front edge is stiffer than the back, which is what stretches the capsule while it travels
    var LEAD = [620, 50], TRAIL = [240, 31], DRAG_LEAD = [900, 60], DRAG_TRAIL = [420, 41];
    if (reduce) LEAD = TRAIL = DRAG_LEAD = DRAG_TRAIL = [800, 57];
    function spring(x, kc) { return { x: x, v: 0, t: x, k: kc[0], c: kc[1] }; }
    function setKC(s, kc) { s.k = kc[0]; s.c = kc[1]; }
    function step(s, dt) {
      var n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
      for (var i = 0; i < n; i++) { s.v += (-s.k * (s.x - s.t) - s.c * s.v) * h; s.x += s.v * h; }
    }
    function still(s) { return Math.abs(s.x - s.t) < .02 && Math.abs(s.v) < .05; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    // one frame loop for every bar that is moving
    var running = new Set(), raf = 0, last = 0, uid = 0;
    function loop(now) {
      var dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
      running.forEach(function (n) { if (!n.tick(dt)) running.delete(n); });
      raf = running.size ? requestAnimationFrame(loop) : 0;
    }
    function wake(n) { running.add(n); if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }

    function mount(nav, opts) {
      opts = opts || {};
      var live = opts.interactive !== false, wrap = nav.parentElement;
      var white = nav.querySelector('.lgn-icons'), dark = white.cloneNode(true);
      dark.classList.add('lgn-dark'); white.parentNode.insertBefore(dark, white.nextSibling);
      var grad = nav.querySelector('.lgn-edge linearGradient');               // one gradient id per bar on the page
      if (grad) { grad.id = 'lgn-edge-' + (++uid); nav.querySelector('.lgn-edge rect').setAttribute('stroke', 'url(#' + grad.id + ')'); }
      var pill = nav.querySelector('.lgn-pill'), rim = nav.querySelector('.lgn-rim'), hits = nav.querySelectorAll('.lgn-hit');
      var icons = BASE.map(function (_, i) { return nav.querySelectorAll('.ic[data-i="' + i + '"]'); });
      var active = 2, lay = LAYOUTS[2], seg = segOf(lay), down = null, drag = null, suppress = false, self = {};
      var L = spring(BASE[2] - PW / 2, LEAD), R = spring(BASE[2] + PW / 2, LEAD);
      var X = BASE.map(function (c) { return spring(c, [480, 44]); });
      var all = [L, R].concat(X);
      if (!live) nav.style.pointerEvents = 'none';

      function lead(dir) {
        var a = drag ? DRAG_LEAD : LEAD, b = drag ? DRAG_TRAIL : TRAIL;
        if (dir > 0) { setKC(R, a); setKC(L, b); } else if (dir < 0) { setKC(L, a); setKC(R, b); } else { setKC(L, a); setKC(R, a); }
      }
      // the bar's ends are walls: past them the capsule squeezes softly instead of sliding out
      function soft(o) { return 3 * (1 - Math.exp(-o / 6)); }
      function draw() {
        var l = L.x < 3 ? 3 - soft(3 - L.x) : L.x, r = R.x > 288 ? 288 + soft(R.x - 288) : R.x;
        pill.style.left = l + 'px'; pill.style.width = (r - l) + 'px';
        dark.style.clipPath = 'inset(3px ' + (291 - r) + 'px 3px ' + l + 'px round 27px)';
        // at an end, the rim light steps back so the gap around the capsule stays even
        var fl = clamp((43 - l) / 40, 0, 1), fr = clamp((r - 248) / 40, 0, 1);
        rim.classList.toggle('lgn-fade', fl + fr > .001);
        rim.style.setProperty('--fl', fl.toFixed(3)); rim.style.setProperty('--fr', fr.toFixed(3));
        for (var i = 0; i < 5; i++) {
          var dx = X[i].x - BASE[i], tf = Math.abs(dx) < .001 ? '' : 'translateX(' + dx + 'px)';
          icons[i].forEach(function (el) { el.style.transform = tf; });
        }
      }
      self.tick = function (dt) {
        all.forEach(function (s) { step(s, dt); });
        var done = !drag && all.every(still);
        if (done) all.forEach(function (s) { s.x = s.t; s.v = 0; });            // land exactly on the layout
        draw();
        return !done;
      };

      function select(i, quiet, fromDrag) {
        var prev = active, c = (L.x + R.x) / 2;
        active = i; lay = LAYOUTS[i]; seg = segOf(lay);
        hits.forEach(function (h, k) {
          if (k === i) h.setAttribute('aria-current', 'page'); else h.removeAttribute('aria-current');
          h.tabIndex = live && k === i ? 0 : -1;
          h.style.left = seg[k] + 'px'; h.style.width = (seg[k + 1] - seg[k]) + 'px'; h.style.setProperty('--ic', (lay[k] - seg[k]) + 'px');
        });
        // the neighbours step aside in a ripple: the nearer an icon is to the chosen one, the quicker it moves
        X.forEach(function (s, k) { var kk = reduce ? 800 : 560 - 90 * Math.abs(k - i); setKC(s, [kk, 2 * Math.sqrt(kk)]); s.t = lay[k]; });
        lead(Math.sign(lay[i] - c));
        L.t = lay[i] - PW / 2; R.t = lay[i] + PW / 2;
        if (quiet) { all.forEach(function (s) { s.x = s.t; s.v = 0; }); draw(); return; }
        if (!reduce && !(fromDrag && i === prev)) gesture(i);
        wake(self);
        if (opts.onSelect) opts.onSelect(i);
      }
      self.select = function (i, quiet) { select(i, quiet); };            // quiet: jump there, no motion and no onSelect
      Object.defineProperty(self, 'active', { get: function () { return active; } });

      // ---- each icon's gesture, then sparks: the AI's rise and twinkle, the others burst out of the icon
      function spark(cls, x, y, frames, timing) {
        var p = document.createElement('span');
        p.className = 'lgn-spark ' + cls; if (cls === 'lgn-star') p.innerHTML = STAR;
        p.style.left = (nav.offsetLeft + x) + 'px'; p.style.top = (nav.offsetTop + y) + 'px';
        wrap.appendChild(p);
        p.animate(frames, timing).onfinish = function () { p.remove(); };
        return p;
      }
      function gesture(i) {
        icons[i].forEach(function (el) {
          el.classList.remove('lgn-gesture'); void el.offsetWidth; el.classList.add('lgn-gesture');
          el.addEventListener('animationend', function end() {                // the AI has two stars that end at different times
            if (el.getAnimations && el.getAnimations({ subtree: true }).some(function (a) { return a.playState === 'running'; })) return;
            el.classList.remove('lgn-gesture'); el.removeEventListener('animationend', end);
          });
        });
        var cx = lay[i];
        if (i === 2) {
          for (var k = 0; k < 5; k++) {
            var up = 30 + Math.random() * 26, sway = (Math.random() - .5) * 16;
            spark('lgn-star', cx + (Math.random() - .5) * 28, 20 + Math.random() * 16, [
              { transform: 'translate(0,0) scale(0) rotate(0deg)', opacity: 0 },
              { transform: 'translate(' + sway * .3 + 'px,' + -up * .25 + 'px) scale(1) rotate(20deg)', opacity: 1, offset: .22 },
              { transform: 'translate(' + sway * .7 + 'px,' + -up * .62 + 'px) scale(.5) rotate(34deg)', opacity: .9, offset: .55 },
              { transform: 'translate(' + sway * .85 + 'px,' + -up * .8 + 'px) scale(.95) rotate(40deg)', opacity: .85, offset: .74 },
              { transform: 'translate(' + sway + 'px,' + -up + 'px) scale(0) rotate(45deg)', opacity: 0 }
            ], { duration: 950 + Math.random() * 450, delay: 40 + k * 90 + Math.random() * 50, easing: 'cubic-bezier(.22,.6,.3,1)', fill: 'both' })
              .style.setProperty('--sz', (6 + Math.random() * 5) + 'px');
          }
          return;
        }
        for (var j = 0; j < 6; j++) {
          var ang = (j / 6) * Math.PI * 2 + Math.random() * .6, far = 24 + Math.random() * 14;
          spark('lgn-dot', cx, 30, [
            { transform: 'translate(0,0) scale(.3)', opacity: 1 },
            { transform: 'translate(' + Math.cos(ang) * far * .7 + 'px,' + Math.sin(ang) * far * .7 + 'px) scale(1)', opacity: 1, offset: .55 },
            { transform: 'translate(' + Math.cos(ang) * far + 'px,' + Math.sin(ang) * far + 'px) scale(.2)', opacity: 0 }
          ], { duration: 560 + Math.random() * 260, delay: 110, easing: 'cubic-bezier(.15,.7,.25,1)', fill: 'both' });
        }
      }

      // ---- pointer: tap an item, or grab the capsule and drag it; letting go snaps it to the nearest item
      function localX(e) { var r = nav.getBoundingClientRect(); return (e.clientX - r.left) * 291 / r.width; }   // in the bar's own 291px, even when it is shown scaled
      function indexAt(x) { for (var i = 0; i < 5; i++) if (x < seg[i + 1]) return i; return 4; }
      function rubber(o) { return 10 * (1 - Math.exp(-o / 24)); }
      function user() { if (opts.onUser) opts.onUser(); }
      function unpress() { nav.querySelectorAll('.lgn-press').forEach(function (el) { el.classList.remove('lgn-press'); }); }
      function up(e, cancel) {
        var d = down; if (!d || e.pointerId !== d.id) return;
        down = null; nav.classList.remove('lgn-dragging'); unpress();
        if (!d.on) return;
        drag = null; suppress = true; setTimeout(function () { suppress = false; }, 80);
        var c = (L.t + R.t) / 2, best = 0;
        for (var i = 1; i < 5; i++) if (Math.abs(lay[i] - c) < Math.abs(lay[best] - c)) best = i;
        select(cancel ? active : best, false, true);
      }
      if (live) {
        nav.addEventListener('pointerdown', function (e) {
          if (e.button > 0) return;
          user();
          var x = localX(e), i = indexAt(x);
          down = { id: e.pointerId, x0: x, c0: (L.t + R.t) / 2, last: x, on: false };
          if (i !== active) icons[i].forEach(function (el) { el.classList.add('lgn-press'); });
        });
        nav.addEventListener('pointermove', function (e) {
          var d = down; if (!d || e.pointerId !== d.id) return;
          var x = localX(e), dx = x - d.x0;
          if (!d.on && Math.abs(dx) > 6) {
            d.on = true; drag = d; try { nav.setPointerCapture(e.pointerId); } catch (_) {}
            nav.classList.add('lgn-dragging'); unpress();
          }
          if (!d.on) return;
          var c = d.c0 + dx, lo = 3 + PW / 2, hi = 288 - PW / 2;
          if (c < lo) c = lo - rubber(lo - c); else if (c > hi) c = hi + rubber(c - hi);
          lead(Math.sign(x - d.last)); d.last = x;
          L.t = c - PW / 2; R.t = c + PW / 2;
          wake(self);
        });
        nav.addEventListener('pointerup', function (e) { up(e, false); });
        nav.addEventListener('pointercancel', function (e) { up(e, true); });
        hits.forEach(function (h, i) { h.addEventListener('click', function () { if (!suppress) { user(); select(i); } }); });
        nav.addEventListener('keydown', function (e) {
          var to = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: 4 }[e.key];
          if (to === undefined) return;
          e.preventDefault(); user(); to = clamp(to, 0, 4); select(to); hits[to].focus();
        });
      }

      select(2, true);
      nav.__lgn = self;
      return self;
    }
    window.LiquidGlassNav = { mount: mount };
  }

  lgnEngine();

  // ---- the code people copy is the code that runs here
  var html = '<div class="lgn-wrap">\n' + NAV.split('\n').map(function (l) { return '  ' + l; }).join('\n') + '\n</div>';
  var js = '(' + lgnEngine.toString() + ')();\n\n// every bar on the page\ndocument.querySelectorAll(\'.lgn\').forEach(function (nav) { LiquidGlassNav.mount(nav); });';
  window.LGN_CODE = { html: html, css: CSS, js: js };

  // ---- on this site: the stage, one flat mid-dark grey (Sara's pick, #444444); the glass mixes with it, so the bar reads
  //      darker than the ground
  var st = document.createElement('style');
  st.textContent = CSS + '\n.d-glass{position:absolute;inset:0;display:grid;place-items:center;isolation:isolate;background:#444444}';
  document.head.appendChild(st);

  // ---- the demo. On a tile: a small film that keeps playing while it is on screen. On the piece page: live, to try out;
  //      "Reproduzir" walks once through the items, and touching the bar stops it.
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, SEQ = [4, 0, 3, 1, 2];
  function demo(t) {
    var holder = t.querySelector('.d-glass .lgn-wrap'); if (!holder) return null;
    holder.innerHTML = NAV;
    // the bar is drawn at 291×60; on the stage it is shown up to 1.5× larger, and never closer than 12px to a narrow card's
    // edges. zoom, not transform: a transform would isolate the bar and its glass would stop blending with the ground
    var ground = holder.parentNode;
    function fit() {
      var w = ground.clientWidth; if (!w) return;
      holder.style.zoom = Math.max(Math.min(1, (w - 24) / 291), Math.min(1.5, (w - 96) / 291)).toFixed(3);
    }
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(ground);
    var tile = t.classList.contains('tile'), timers = [];
    function stop() { timers.forEach(clearTimeout); timers = []; }
    var api = window.LiquidGlassNav.mount(holder.querySelector('.lgn'), { interactive: !tile, onUser: stop });
    if (tile) {
      var visible = true, k = 0;
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(t);
      if (!reduce) setInterval(function () { if (visible && !document.hidden) api.select(SEQ[k++ % SEQ.length]); }, 1500);
      return { play: function () {}, stop: function () {} };          // the film runs on its own, hover or not
    }
    var d = t.querySelector('.demo'); if (d) d.removeAttribute('aria-hidden');   // here the bar is a real control
    return {
      play: function () { stop(); if (reduce) return; SEQ.forEach(function (i, n) { timers.push(setTimeout(function () { api.select(i); }, n * 1150)); }); },
      stop: stop
    };
  }
  window.__demosExtra = Object.assign(window.__demosExtra || {}, { glassnav: demo });
  window.__make = window.__make || {};                                 // the piece page renders before its demo table exists
  window.__make.glassnav = demo;
})();
