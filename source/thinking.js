// Thinking orbs · Sara Lobo Library
// Two "thinking" indicators made of dots on a canvas, for the wait while an answer is being written:
//   sphere · Magic sphere: a Rubik's cube on a ball, one grey tone per face. Its slices turn to scramble the pieces,
//            then retrace their steps until every piece is home, and the ball lights up for a moment.
//   sweep  · Sweep: a dotted globe. A wave crosses it from left to right, lifting the dots it passes, then rests.
//            Beside a label, the same wave runs on through the word at the same speed.
// Markup (styled by thinking.css):
//   <span class="thinking" data-kind="sphere" role="status">
//     <canvas class="thinking-orb" aria-hidden="true"></canvas><span class="thinking-label">Thinking</span>
//   </span>
// Every .thinking on the page is set up as the page loads; for one added later, call thinking(el), which returns
// { destroy }. The ball takes the canvas's CSS size (--thinking-size). Under 64px it draws more, finer dots, made
// for sitting beside text; larger, it shows the full detail. Every motion runs on the frame's real time.
(function () {
  var TAU = Math.PI * 2, SMALL = 64;
  var SPEED = 85, REST = 0.55, HALO = 26;              // the Sweep's wave beside a word: px per second, the pause, the light's reach
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var all = [], running = false, last = 0;

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(a, b, x) { var t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // dots grouped by opacity, so a frame is a few fills instead of hundreds
  function painter() {
    var LEVELS = 16, d = [], n = [];
    for (var i = 0; i < LEVELS; i++) { d.push([]); n.push(0); }
    return {
      gain: 1,
      dot: function (x, y, r, a) {
        a *= this.gain; if (a <= 0.02) return;
        var b = Math.min(LEVELS - 1, (a * LEVELS) | 0), arr = d[b], k = n[b];
        arr[k] = x; arr[k + 1] = y; arr[k + 2] = r; n[b] = k + 3;
      },
      flush: function (c, ink) {
        c.fillStyle = ink;
        for (var b = 0; b < LEVELS; b++) {
          if (!n[b]) continue;
          var arr = d[b];
          c.globalAlpha = (b + 1) / LEVELS; c.beginPath();
          for (var i = 0; i < n[b]; i += 3) { c.moveTo(arr[i] + arr[i + 2], arr[i + 1]); c.arc(arr[i], arr[i + 1], arr[i + 2], 0, TAU); }
          c.fill(); n[b] = 0;
        }
        c.globalAlpha = 1;
      }
    };
  }

  // 3D: turn() rotates by the view into o[0..2] (y down, z away from the camera); persp() writes screen x, y and scale into o[3..5]
  var CAM = 3.2, LX = -0.42, LY = -0.62, LZ = -0.66;   // the light comes from the upper left, in front
  function view(yaw, pitch) { return { cy: Math.cos(yaw), sy: Math.sin(yaw), cp: Math.cos(pitch), sp: Math.sin(pitch) }; }
  function turn(V, x, y, z, o) {
    var x1 = x * V.cy - z * V.sy, z1 = x * V.sy + z * V.cy;
    o[0] = x1; o[1] = y * V.cp - z1 * V.sp; o[2] = y * V.sp + z1 * V.cp;
  }
  function persp(x, y, z, o) { var f = CAM / (CAM + z); o[3] = x * f; o[4] = y * f; o[5] = f; }
  // lit from the upper left; the far side of the ball fades out, so it reads solid
  function lit(nx, ny, nz) { return (0.32 + 0.68 * Math.max(0, nx * LX + ny * LY + nz * LZ)) * (0.07 + 0.93 * smooth(0.28, -0.3, nz)); }

  // ── Magic sphere: 3×3 stickers per face, projected from a cube onto the ball. Each dot knows its cubie (-1…1 per axis).
  // Five random slice turns of 90°, then the same five undone; when every piece is home the ball lights up, and again.
  var TONES = [1, 0.5, 0.78, 0.3, 0.62, 0.18];
  function spin(q, axis, cs, sn) { var b = (axis + 1) % 3, c = (axis + 2) % 3, qb = q[b], qc = q[c]; q[b] = qb * cs - qc * sn; q[c] = qb * sn + qc * cs; }
  function sphere(small) {
    var per = small ? 2 : 4, COUNT = 5, SLOT = 0.5, DUR = 0.42, HOLD = 1.1, R0 = 0.8, D = [], v = [0, 0, 0], o = [0, 0, 0, 0, 0, 0];
    for (var a = 0; a < 3; a++) for (var sg = 1; sg >= -1; sg -= 2) {
      var s = TONES[a * 2 + (sg > 0 ? 0 : 1)], b = (a + 1) % 3, c = (a + 2) % 3;
      for (var su = -1; su <= 1; su++) for (var sv = -1; sv <= 1; sv++) for (var j = 0; j < per; j++) for (var k = 0; k < per; k++) {
        var pos = [0, 0, 0], cub = [0, 0, 0];
        pos[a] = sg; cub[a] = sg; cub[b] = su; cub[c] = sv;
        pos[b] = su * 2 / 3 + ((j + 0.5) / per * 2 - 1) * 0.26;
        pos[c] = sv * 2 / 3 + ((k + 0.5) / per * 2 - 1) * 0.26;
        D.push({ pos: pos, cub: cub, s: s });
      }
    }
    var t = 0, seq = [], mi = 0, mt = 0;
    function plan() {
      var sc = [], prev = -1;
      while (sc.length < COUNT) {
        var axis = (Math.random() * 3) | 0, layer = ((Math.random() * 3) | 0) - 1, key = axis * 3 + layer + 1;
        if (key === prev) continue;
        prev = key; sc.push({ axis: axis, layer: layer, dir: Math.random() < 0.5 ? -1 : 1 });
      }
      seq = sc.concat(sc.slice().reverse().map(function (m) { return { axis: m.axis, layer: m.layer, dir: -m.dir }; }));
    }
    plan();
    return {
      time: function () { return t; },
      step: function (dt) {
        t += dt; mt += dt;
        if (mi < seq.length) {
          if (mt >= SLOT) {                                // the turn is done: write it into the dots, exactly 90°
            var m = seq[mi];
            D.forEach(function (d) { if (d.cub[m.axis] === m.layer) { spin(d.pos, m.axis, 0, m.dir); spin(d.cub, m.axis, 0, m.dir); } });
            mi++; mt -= SLOT;
          }
        } else if (mt >= HOLD) { plan(); mi = 0; mt -= HOLD; }
      },
      draw: function (p, u) {
        var V = view(0.72 + 0.2 * Math.sin(t * TAU / 15), 0.5 + 0.07 * Math.sin(t * TAU / 21));
        var m = mi < seq.length ? seq[mi] : null;
        var th = m ? m.dir * Math.PI / 2 * ease(clamp01(mt / DUR)) : 0, cs = Math.cos(th), sn = Math.sin(th);
        var glow = m ? 0 : Math.sin(Math.PI * clamp01(mt / HOLD)), rb = R0 * (1 + 0.03 * glow);
        for (var i = 0; i < D.length; i++) {
          var d = D[i];
          v[0] = d.pos[0]; v[1] = d.pos[1]; v[2] = d.pos[2];
          if (m && d.cub[m.axis] === m.layer) spin(v, m.axis, cs, sn);
          var k = rb / Math.hypot(v[0], v[1], v[2]);
          turn(V, v[0] * k, v[1] * k, v[2] * k, o);
          var shade = lit(o[0] / rb, o[1] / rb, o[2] / rb);
          persp(o[0], o[1], o[2], o);
          p.dot(u.cx + o[3] * u.R, u.cy + o[4] * u.R, u.rad((small ? 0.5 : 1.05) * o[5]), shade * (0.25 + 0.75 * (d.s + (1 - d.s) * 0.6 * glow)));
        }
      }
    };
  }

  // ── Sweep: rings of latitude. front(t) places the wave in ball radii; on its own it crosses in 1.2 s and rests 0.55 s.
  function sweep(small, front) {
    var LAT = small ? 11 : 15, dens = small ? 26 : 40, R0 = 0.74, W = small ? 0.28 : 0.24, D = [], o = [0, 0, 0, 0, 0, 0];
    for (var a = 1; a < LAT; a++) {
      var lat = Math.PI * a / LAT, y = -Math.cos(lat), r = Math.sin(lat), n = Math.max(5, Math.round(r * dens));
      for (var b = 0; b < n; b++) { var th = TAU * b / n + a * 0.37; D.push([Math.cos(th) * r, y, Math.sin(th) * r]); }
    }
    front = front || function (t) { return -1.3 + 2.6 * (t % 1.75) / 1.2; };
    var t = 0;
    return {
      time: function () { return t; },
      step: function (dt) { t += dt; },
      draw: function (p, u) {
        var V = view(0.35 * Math.sin(t * TAU / 17), 0.3 + 0.07 * Math.sin(t * TAU / 23)), f = front(t);
        for (var i = 0; i < D.length; i++) {
          turn(V, D[i][0], D[i][1], D[i][2], o);
          var nx = o[0], ny = o[1], nz = o[2], q = (nx * R0 - f) / W, w = Math.exp(-q * q), rho = R0 * (1 + 0.17 * w);
          persp(nx * rho, ny * rho, nz * rho, o);
          p.dot(u.cx + o[3] * u.R, u.cy + o[4] * u.R, u.rad((small ? 0.45 + 0.25 * w : 0.95 + 0.6 * w) * o[5]), lit(nx, ny, nz) * (0.75 + 0.25 * w) + 0.55 * w * smooth(0.3, -0.3, nz));
        }
      }
    };
  }

  // beside a word, the Sweep's wave is one run in px along the row: it starts left of the ball, crosses it, goes on
  // through the word and rests (positions are relative to the word's left edge)
  function rowX(r, t) { return r.x0 + SPEED * (t % ((r.x1 - r.x0) / SPEED + REST)); }

  function size(I) {
    var cw = I.cv.clientWidth, ch = I.cv.clientHeight;
    if (!cw || !ch) return;
    var small = Math.min(cw, ch) < SMALL, dpr = Math.min(devicePixelRatio || 1, small ? 3 : 2);
    var w = Math.round(cw * dpr), h = Math.round(ch * dpr);
    if (I.cv.width !== w || I.cv.height !== h) { I.cv.width = w; I.cv.height = h; }
    var R = Math.min(w, h) * 0.44, k = small ? dpr : R / 80, minR = (small ? 0.4 : 0.5) * dpr;
    I.w = w; I.h = h;
    I.u = { cx: w / 2, cy: h / 2, R: R, rad: function (d) { return Math.max(minR, d * k); } };
    I.ink = getComputedStyle(I.el).getPropertyValue('--thinking-ink').trim() || '#EDEDED';
    if (I.small !== small) {
      I.small = small;
      I.sim = I.kind === 'sweep' ? sweep(small, I.row && function (t) { return (rowX(I.row, t) - I.row.cx) / I.row.R; }) : sphere(small);
      if (reduce.matches) for (var i = 0; i < 150; i++) I.sim.step(1 / 60);   // a still pose, mid-thought
    }
    if (I.row) {
      var L = I.label;
      I.row.cx = I.cv.offsetLeft + I.cv.offsetWidth / 2 - L.offsetLeft; I.row.R = R / dpr;
      I.row.x0 = I.row.cx - 1.3 * I.row.R; I.row.x1 = L.offsetWidth + HALO + 4;
    }
  }

  function frame(now) {
    if (!all.length) { running = false; return; }
    requestAnimationFrame(frame);
    var dt = Math.min(1 / 30, Math.max(0, (now - last) / 1000)); last = now;
    if (document.hidden) return;
    for (var i = 0; i < all.length; i++) {
      var I = all[i];
      if (!I.seen || !I.u) continue;
      if (reduce.matches) I.calm += dt; else I.sim.step(dt);
      I.ctx.clearRect(0, 0, I.w, I.h);
      I.p.gain = (I.small ? 1.35 : 1) * (reduce.matches ? 0.72 + 0.28 * Math.sin(I.calm * TAU / 3.2) : 1);
      I.sim.draw(I.p, I.u);
      I.p.flush(I.ctx, I.ink);
      if (I.row && !reduce.matches) I.label.style.setProperty('--thinking-x', (rowX(I.row, I.sim.time())).toFixed(1) + 'px');
    }
  }

  function thinking(el) {
    if (el.__thinking) return el.__thinking;
    var cv = el.querySelector('.thinking-orb');
    if (!cv) {
      cv = document.createElement('canvas'); cv.className = 'thinking-orb'; cv.setAttribute('aria-hidden', 'true');
      el.insertBefore(cv, el.firstChild);
    }
    var label = el.querySelector('.thinking-label'), kind = el.getAttribute('data-kind') === 'sweep' ? 'sweep' : 'sphere';
    var I = { el: el, cv: cv, ctx: cv.getContext('2d'), label: label, kind: kind, row: kind === 'sweep' && label ? { cx: 0, R: 1, x0: 0, x1: 1 } : null,
      sim: null, small: null, u: null, w: 0, h: 0, ink: '', seen: true, calm: 0, p: painter() };
    I.ro = new ResizeObserver(function () { size(I); });
    I.ro.observe(cv);
    if (label) I.ro.observe(label);                      // the word's width moves with its font and language
    I.io = new IntersectionObserver(function (es) { I.seen = es[es.length - 1].isIntersecting; });
    I.io.observe(el);
    size(I);
    all.push(I);
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    return (el.__thinking = {
      destroy: function () {
        I.ro.disconnect(); I.io.disconnect();
        all.splice(all.indexOf(I), 1);
        I.ctx.clearRect(0, 0, I.w, I.h);
        if (label) label.style.removeProperty('--thinking-x');
        el.__thinking = null;
      }
    });
  }

  function scan() { Array.prototype.forEach.call(document.querySelectorAll('.thinking'), thinking); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  window.thinking = thinking;
})();
