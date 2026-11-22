// Magnetic icon · Sara Lobo Library
// Every .mag on the page reads the pointer and its rim follows it while it is near: the disc is drawn toward it, the
// strained rim creases, trembles and comes apart where it is pulled, the tip cracks into shards, and voxels fly to
// the pointer. Let go, and the rim springs back with a wobble, closing up as the loose voxels return to it. Pairs with
// magnet.css.
// Buttons added later: magnetize(root). To steer one without a mouse (a demo, a tour): magnetPoint(button, x, y) with
// a point on screen, and magnetPoint(button, null) to hand it back to the pointer.
(function () {
  var C = 20, R = 19.25, N = 96;   // the rim's centre and radius in the 40-unit box, and how many points draw it
  var REACH = 44;                  // how far past the rim the magnet is felt
  var PULL = 15, FALL = 1.1;       // the furthest the rim reaches out, and how fast the pull drops with distance
  var BODY = 0.3, SHIFT = 0.14;    // how much of the disc goes with the tip, and how far the disc itself is drawn
  var JAG = 0.18;                  // how deep the strained rim creases
  var FRAY = 1.6, CHIPS = 90;      // how far the pulled stretch of the rim frays, and how many voxels can fall out of the ring
  var DENT = 3.5;                  // the furthest the rim is drawn in while the pointer is over the button
  var RATE = 90, MAXDUST = 90;     // voxels shed per second at full pull, and at most at once
  var ROOM = 46;                   // room for the shards and voxels on every side of the button (matches .mag-dust)
  var pointer = null, mags = [], raf = 0, last = 0, uid = 0;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {   // less motion: the button stays as drawn
    window.magnetize = window.magnetPoint = function () {};
    return;
  }

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function wrap(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
  function bell(x, s) { return Math.exp(-x * x / (2 * s * s)); }
  function spike(x, s) { return Math.exp((0.16 - Math.sqrt(x * x + 0.0256)) / s); }   // a rounded peak with flared shoulders, like metal drawn out
  function hash(x, y) { var h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); }
  function n2(x) { return Math.round(x * 100) / 100; }
  // a quick, smooth random shiver for point i, between -0.5 and 0.5
  function tremble(i, now) { var f = now / 1000 * 14, k = Math.floor(f), u = f - k; u = u * u * (3 - 2 * u); return hash(i, k) * (1 - u) + hash(i, k + 1) * u - 0.5; }

  // the rim's radius at angle t, around the disc's (drawn) centre: pulled out toward the pointer, the disc going with it,
  // or pressed in; the far side gives a little
  function width(m) { return 0.55 - 0.25 * clamp(m.d / PULL, 0, 1); }
  function radius(m, t) {
    var dt = wrap(t - m.a), d = m.d;
    return R + (d > 0 ? d * (spike(dt, width(m)) + BODY * bell(dt, 1)) : d * bell(dt, 0.7)) - 0.12 * d * bell(wrap(dt - Math.PI), 1.3);
  }

  // how hard the field strains the metal (0 at rest, 1 at a full pull), and how worn the rim is at angle t: only where
  // the magnet pulls, beside the shards, fading out within about a quarter turn either side; the rest of the ring
  // stays whole. Wear builds faster than the strain, so a middling pull already marks it
  function strainOf(m) { return clamp((Math.abs(m.d) + 3 * m.heat) / PULL, 0, 1); }
  function damage(m, t) { return clamp((Math.abs(m.d) + 3 * m.heat) / 9, 0, 1) * bell(wrap(t - m.a), 0.7); }

  // the rim as one closed curve: smooth where it is calm (Catmull-Rom turned into cubic Béziers), creased into straight,
  // trembling facets where the magnet strains it, and frayed into short crooked facets on either side of them
  function rimPath(m, now) {
    var pts = [], strain = strainOf(m), i, t, r, env, sharp, fray, n, p, a, b, c, e;
    for (i = 0; i < N; i++) {
      t = i / N * 2 * Math.PI;
      r = radius(m, t);
      env = bell(wrap(t - m.a), 0.6) * strain;
      sharp = env > 0.12;
      fray = sharp ? 0 : clamp((damage(m, t) - 0.15) / 0.85, 0, 1);
      if ((sharp && i % 3) || (fray > 0 && i % 2)) continue;
      if (sharp) r += 2 * JAG * PULL * env * tremble(i, now);
      else if (fray > 0) r += FRAY * fray * (hash(i, 21) - 0.62 + 0.3 * tremble(i + 500, now));   // each facet keeps its own dent (mostly worn in), and shivers a little
      pts.push([m.cx + r * Math.cos(t), m.cy + r * Math.sin(t), sharp || fray > 0]);
    }
    n = pts.length;
    p = 'M' + n2(pts[0][0]) + ' ' + n2(pts[0][1]);
    for (i = 0; i < n; i++) {
      a = pts[(i + n - 1) % n]; b = pts[i]; c = pts[(i + 1) % n]; e = pts[(i + 2) % n];
      p += b[2] || c[2] ? 'L' + n2(c[0]) + ' ' + n2(c[1])
        : 'C' + n2(b[0] + (c[0] - a[0]) / 6) + ' ' + n2(b[1] + (c[1] - a[1]) / 6) + ' ' +
                n2(c[0] - (e[0] - b[0]) / 6) + ' ' + n2(c[1] - (e[1] - b[1]) / 6) + ' ' + n2(c[0]) + ' ' + n2(c[1]);
    }
    return p + 'Z';
  }

  // where the rim wants to be: outside, it reaches toward the pointer (never past it); over the button, it is drawn in
  function aim(m) {
    var p = m.ghost || pointer;
    if (!p) return null;
    var k = 40 / m.box.width;
    var x = (p.x - m.box.left) * k - C, y = (p.y - m.box.top) * k - C;
    var dist = Math.hypot(x, y), edge = dist - R, near = 1 - Math.max(edge, 0) / REACH;
    if (edge > REACH) return null;
    var d = edge >= 0
      ? Math.min(edge * 0.9 / (1 + BODY), PULL * Math.pow(1 - edge / REACH, FALL))
      : -Math.min(-edge * 0.85, DENT * clamp(dist / R, 0, 1));
    // heat: how hard the field strains the metal, strongest at the rim and calm at the very centre
    return { d: d, a: Math.atan2(y, x), x: x, y: y, dist: dist, near: near, heat: edge >= 0 ? near * near : clamp(dist / R, 0, 1) };
  }

  // one tick of the springs; true once everything has come to rest
  function step(m, dt) {
    var t = m.t = aim(m), to = t ? t.d : 0, heat = t ? t.heat : 0, turn = 0, k, c, ix = 0, iy = 0, e;
    // a spring toward the target; looser once the magnet lets go, so the metal overshoots and wobbles back
    if (t) { k = 420; c = 30; } else { k = 260; c = 9; }
    m.v += (k * (to - m.d) - c * m.v) * dt;
    m.d += m.v * dt;
    m.heat += (heat - m.heat) * (1 - Math.exp(-dt * 6));
    if (t) {
      // the stretched side turns toward the pointer; close to the centre the direction jitters, so it turns slower there
      turn = wrap(t.a - m.a);
      m.a += turn * (1 - Math.exp(-dt * 22 * clamp(t.dist / 8, 0, 1)));
      // the glyph is drawn a little toward the pointer too
      e = 1.4 * t.near * t.near / Math.max(t.dist, 1);
      ix = t.x * e; iy = t.y * e;
    }
    e = 1 - Math.exp(-dt * 14);
    m.ix += (ix - m.ix) * e; m.iy += (iy - m.iy) * e;
    // the disc itself is drawn toward the magnet
    e = SHIFT * Math.abs(m.d);
    m.cx = C + e * Math.cos(m.a); m.cy = C + e * Math.sin(m.a);
    return Math.abs(to - m.d) < 0.02 && Math.abs(m.v) < 0.05 && Math.abs(turn) < 0.002 && Math.abs(heat - m.heat) < 0.01 &&
      Math.abs(ix - m.ix) < 0.01 && Math.abs(iy - m.iy) < 0.01;
  }

  // voxels break off where the magnet pulls hardest: more the further the rim is pulled, and more while the pointer moves
  function shed(m, dt) {
    var t = m.t, pull, th, r, x, y, dx, dy, l;
    if (!t) { m.acc = 0; return; }
    pull = m.d > 0 ? clamp(m.d / PULL, 0, 1) : 0.5 * clamp(-m.d / DENT, 0, 1);
    m.acc += dt * RATE * Math.pow(pull, 1.4) * (0.35 + 0.65 * clamp(m.pace / 160, 0, 1));
    for (; m.acc >= 1; m.acc--) {
      if (m.dust.length >= MAXDUST) continue;
      th = m.a + (Math.random() + Math.random() - 1) * width(m) * 1.4;
      r = radius(m, th) - Math.random() * 1.2;
      if (m.d > 0) r += 0.35 * m.d * clamp((r - R) / (m.d * (1 + BODY)), 0, 1);   // off the shards, which have pulled away
      x = m.cx + r * Math.cos(th); y = m.cy + r * Math.sin(th);
      dx = C + t.x - x; dy = C + t.y - y; l = Math.hypot(dx, dy) || 1;
      m.dust.push({ x: x, y: y, vx: dx / l * 12, vy: dy / l * 12, hx: C + R * Math.cos(th), hy: C + R * Math.sin(th),
        s: 1.2 + Math.random() * 1.6, k: 1, age: 0, life: 0.6 + Math.random() * 0.6, back: Math.random() < 0.3,
        spin: Math.random() < 0.5 ? -1 : 1, c: Math.random() < 0.35 ? 190 : 255 });
    }
  }

  // loose voxels: drawn to the pointer and swallowed there; once the magnet lets go (and for the few that hold on), back to the rim
  function drift(m, dt) {
    var t = m.t, e = 1 - Math.exp(-dt * 5), k, p, home, tx, ty, dx, dy, dist, sp, sw;
    for (k = m.dust.length - 1; k >= 0; k--) {
      p = m.dust[k];
      p.age += dt;
      home = !t || (p.back && p.age > 0.18);
      if (home && !p.ret) { p.ret = true; p.life = Math.max(p.life, p.age + 0.5); }
      tx = home ? p.hx : C + t.x; ty = home ? p.hy : C + t.y;
      dx = tx - p.x; dy = ty - p.y; dist = Math.hypot(dx, dy) || 0.001;
      sp = (home ? 18 : 30) + 420 / (dist + 6);
      sw = p.spin * sp * 0.4 * clamp(dist / 20, 0, 1);   // a slight swirl, like filings along a field line
      p.vx += (dx / dist * sp - dy / dist * sw - p.vx) * e;
      p.vy += (dy / dist * sp + dx / dist * sw - p.vy) * e;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.k = 0.45 + 0.55 * clamp(dist / 12, 0, 1);
      if (dist < (home ? 1 : 2)) p.age = Math.max(p.age, p.life - 0.1);   // swallowed by the magnet, or back in the metal
      if (p.age >= p.life) m.dust.splice(k, 1);
    }
    return m.dust.length > 0;
  }

  // where the drawn rim gives way to the shards: a clean crack line a little under halfway up the stretch
  function crack(m) { var d = Math.max(m.d, 0); return [R + 1 + 0.45 * d, 0.04 * d + 0.001]; }

  // the cracked tip: past the crack line the rim splits into shards that pull away toward the pointer, the ones nearest
  // the point the most, each turned a little; as the rim springs back they close up again
  function drawShards(m, g) {
    if (m.d < 1) return;
    var f = crack(m)[0], top = radius(m, m.a) - f, cuts = [], lo, hi, x, k, i, t0, t1, tc, r0, r1, ro, rm, q;
    if (top < 0.5) return;
    for (lo = 0; lo > -Math.PI && radius(m, m.a + lo) > f; lo -= 0.02);
    for (hi = 0; hi < Math.PI && radius(m, m.a + hi) > f; hi += 0.02);
    // the cracks ride with the tip, so the shards keep their shapes as it turns
    for (x = -(0.08 + 0.06 * hash(9, 1)), k = 0; x > lo; x -= 0.15 + 0.15 * hash(k++, 2)) cuts.unshift(x);
    cuts.unshift(lo);
    for (x = 0.08 + 0.06 * hash(9, 3), k = 0; x < hi; x += 0.15 + 0.15 * hash(k++, 4)) cuts.push(x);
    cuts.push(hi);
    function at(t, r) { return [m.cx + r * Math.cos(m.a + t), m.cy + r * Math.sin(m.a + t)]; }
    for (i = 0; i < cuts.length - 1; i++) {
      t0 = cuts[i] + 0.012; t1 = cuts[i + 1] - 0.012;
      if (t1 - t0 < 0.03) continue;
      tc = (t0 + t1) / 2; r0 = radius(m, m.a + t0); r1 = radius(m, m.a + t1); ro = radius(m, m.a + tc);
      q = clamp((ro - f) / top, 0, 1);
      if (ro - f > 6) {   // the long piece at the point breaks once more across
        rm = f + (ro - f) * (0.4 + 0.2 * hash(i, 7));
        shard(m, g, i * 2, q * 0.5, [at(t0, f), at(tc, f), at(t1, f), at(t1, Math.min(rm, r1)), at(t0, Math.min(rm, r0))], 0);
        shard(m, g, i * 2 + 1, q, [at(t0, Math.min(rm, r0)), at(t1, Math.min(rm, r1)), at(t1, r1), at(tc, ro), at(t0, r0)], 2);
      } else shard(m, g, i * 2, q, [at(t0, f), at(tc, f), at(t1, f), at(t1, r1), at(tc, ro), at(t0, r0)], 3);
    }
  }
  // one shard; its rim edge starts at point `rim` of its outline (0: it carries none)
  function shard(m, g, k, q, pts, rim) {
    var cx = 0, cy = 0, l = m.d * (0.04 + 0.45 * Math.pow(q, 1.5)) * (0.8 + 0.4 * hash(k, 1)), ux, uy, tx, ty, dl, i;
    pts.forEach(function (p) { cx += p[0] / pts.length; cy += p[1] / pts.length; });
    // pulled partly outward, partly straight at the pointer
    ux = cx - m.cx; uy = cy - m.cy; dl = Math.hypot(ux, uy) || 1; ux /= dl; uy /= dl;
    if (m.t) { tx = C + m.t.x - cx; ty = C + m.t.y - cy; dl = Math.hypot(tx, ty) || 1; ux = (ux + tx / dl) / 2; uy = (uy + ty / dl) / 2; }
    g.save();
    g.translate(cx + ux * l, cy + uy * l); g.rotate((hash(k, 3) - 0.5) * 0.5 * q); g.translate(-cx, -cy);
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.fill();
    g.lineWidth = 0.5; g.lineJoin = 'miter'; g.strokeStyle = 'rgba(255,255,255,0.2)'; g.stroke();   // the fresh break catches the light
    if (rim) {   // the piece of metal rim it carries
      g.beginPath(); g.moveTo(pts[rim][0], pts[rim][1]);
      for (i = rim + 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.lineWidth = 1.5; g.strokeStyle = 'rgba(236,236,236,0.95)'; g.stroke();
    }
    g.restore();
  }

  // the voxels falling out of the rim where it's pulled: holes in the rim's mask, each opening once the metal is worn
  // enough where it sits (and flickering at the edge of breaking), always on the rim you can see: past the crack line,
  // where the shards take over, that's the crack line itself. The piece that falls out flies to the magnet; as the
  // rim heals, the holes close again
  function chips(m, now) {
    var t = m.t, f = crack(m)[0];
    m.chips.forEach(function (c, k) {
      var o = clamp((damage(m, c.a) + 0.08 * tremble(300 + k, now) - c.at) / 0.12, 0, 1), z, r, x, y, dx, dy, l;
      if (o < 0.02) o = 0;                                  // closed means fully closed: no sliver left in the mask
      if (!o && !c.open) return;
      c.open = o;
      z = c.s * o; r = Math.min(radius(m, c.a), f) + c.o; x = m.cx + r * Math.cos(c.a); y = m.cy + r * Math.sin(c.a);
      c.el.setAttribute('x', n2(x - z / 2)); c.el.setAttribute('y', n2(y - z / 2));
      c.el.setAttribute('width', n2(z)); c.el.setAttribute('height', n2(z));
      if (o < 0.2) c.gone = false;
      else if (o > 0.6 && !c.gone && t && now - c.at2 > 500 && m.dust.length < MAXDUST) {
        c.gone = true; c.at2 = now;
        dx = C + t.x - x; dy = C + t.y - y; l = Math.hypot(dx, dy) || 1;
        m.dust.push({ x: x, y: y, vx: dx / l * 10, vy: dy / l * 10, hx: x, hy: y, s: c.s, k: 1, age: 0, life: 0.7 + Math.random() * 0.6,
          back: false, spin: Math.random() < 0.5 ? -1 : 1, c: Math.random() < 0.35 ? 190 : 255 });
      }
    });
  }

  function draw(m, now) {
    var s = m.box.width / 40, dpr = Math.min(2, devicePixelRatio || 1), size = Math.round((40 + 2 * ROOM) * s * dpr), f = crack(m), g = m.g;
    m.rim.setAttribute('d', rimPath(m, now));
    chips(m, now);
    // the drawn rim gives way at the crack line, where the shards take over
    m.grad.setAttribute('cx', n2(m.cx)); m.grad.setAttribute('cy', n2(m.cy));
    m.stops[0].setAttribute('offset', (f[0] / 40).toFixed(4));
    m.stops[1].setAttribute('offset', ((f[0] + f[1]) / 40).toFixed(4));
    if (m.icon) m.icon.style.transform = 'translate(' + n2((m.ix + m.cx - C) * s) + 'px,' + n2((m.iy + m.cy - C) * s) + 'px)';
    if (m.cv.width !== size) m.cv.width = m.cv.height = size;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, size, size);
    g.setTransform(s * dpr, 0, 0, s * dpr, ROOM * s * dpr, ROOM * s * dpr);
    drawShards(m, g);
    m.dust.forEach(function (p) {
      // never under 2 screen pixels, so the voxels still read on a small button
      var q = p.age / p.life, a = 0.9 * Math.min(1, p.age / 0.06) * (1 - q * q * q), z = Math.max(p.s, 2 / s) * p.k;
      g.fillStyle = 'rgba(' + p.c + ',' + p.c + ',' + p.c + ',' + n2(a) + ')';
      g.fillRect(p.x - z / 2, p.y - z / 2, z, z);
    });
  }

  function frame(now) {
    var dt = Math.min((now - last) / 1000, 1 / 30), rest = true;
    last = now;
    mags = mags.filter(function (m) { return m.el.isConnected; });   // buttons taken off the page let go
    mags.forEach(function (m) {
      m.box = m.el.getBoundingClientRect();
      if (!m.box.width) return;
      // how fast the magnet moves, in units a second: a quick pass tears off more than a slow one
      var p = m.ghost || pointer;
      if (p && m.lp && dt > 0) m.pace += (Math.hypot(p.x - m.lp.x, p.y - m.lp.y) * 40 / m.box.width / dt - m.pace) * (1 - Math.exp(-dt * 8));
      else m.pace *= Math.exp(-dt * 4);
      m.lp = p ? { x: p.x, y: p.y } : null;
      // two half steps keep the springs steady when frames come in slow
      var still = step(m, dt / 2) & step(m, dt / 2);
      shed(m, dt);
      var live = drift(m, dt) || !still || (m.t && (Math.abs(m.d) > 0.5 || m.heat > 0.05));
      if (live) { rest = false; draw(m, now); m.still = false; }
      else if (!m.still) { draw(m, now); m.still = true; }
    });
    raf = rest ? 0 : requestAnimationFrame(frame);
  }
  function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  function wire(el) {
    var svg = el.querySelector('.mag-ring'), icon = el.querySelector('.mag-icon'), cv;
    if (el.__mag || !svg) return;
    // each button gets its own ids, so several can live on one page
    uid++;
    svg.querySelectorAll('[id]').forEach(function (def) {
      var id = def.id + '-' + uid;
      svg.querySelectorAll('[fill],[stroke],[mask]').forEach(function (s) {
        ['fill', 'stroke', 'mask'].forEach(function (at) { if (s.getAttribute(at) === 'url(#' + def.id + ')') s.setAttribute(at, 'url(#' + id + ')'); });
      });
      def.id = id;
    });
    cv = document.createElement('canvas');
    cv.className = 'mag-dust';
    cv.setAttribute('aria-hidden', 'true');
    el.insertBefore(cv, icon);
    // the voxels that can fall out of the rim: squares in its mask, closed until the metal wears (see chips()).
    // Each sits at its own spot round the ring, mostly biting the rim from outside, and gives way at its own strain
    var mask = svg.querySelector('mask'), holes = [], k, q;
    for (k = 0; mask && k < CHIPS; k++) {
      q = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      q.setAttribute('fill', '#000'); q.setAttribute('width', 0); q.setAttribute('height', 0);
      mask.appendChild(q);
      holes.push({ el: q, a: (k + 0.8 * hash(k, 11)) / CHIPS * 2 * Math.PI, s: 0.9 + 1.5 * hash(k, 12), o: 0.2 + 1.1 * (hash(k, 13) - 0.5),
        at: 0.08 + 0.72 * hash(k, 14), open: 0, gone: false, at2: -1e9 });
    }
    el.__mag = { el: el, rim: svg.querySelector('.mag-rim'), grad: svg.querySelector('radialGradient'), stops: svg.querySelectorAll('radialGradient stop'),
      icon: icon, cv: cv, g: cv.getContext('2d'), dust: [], chips: holes, acc: 0, pace: 0, lp: null, ghost: null,
      d: 0, v: 0, a: -Math.PI / 2, heat: 0, cx: C, cy: C, ix: 0, iy: 0, t: null, still: true };
    mags.push(el.__mag);
  }
  window.magnetize = function (root) {
    root = root || document;
    if (root.matches && root.matches('.mag')) wire(root);
    root.querySelectorAll('.mag').forEach(wire);
  };
  window.magnetPoint = function (el, x, y) {
    wire(el);
    if (!el.__mag) return;
    el.__mag.ghost = x == null ? null : { x: x, y: y };
    wake();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { window.magnetize(); });
  else window.magnetize();

  function track(e) { pointer = { x: e.clientX, y: e.clientY }; wake(); }
  function drop() { pointer = null; wake(); }
  addEventListener('pointermove', track, { passive: true });
  addEventListener('pointerdown', track, { passive: true });
  addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') drop(); });
  addEventListener('pointercancel', drop);
  addEventListener('pointerout', function (e) { if (!e.relatedTarget) drop(); });
  addEventListener('blur', drop);
  addEventListener('scroll', wake, { passive: true });   // the page moves under a still pointer
})();
