// Bursting heart · Sara Lobo Library
// A click on any <button class="like"> toggles aria-pressed; liking plays the burst (like.css) and sends 2 or 3
// small hearts up. From your own code: setLike(button, true | false). Pass true as a third argument to set it
// without the animation, for example when you restore a saved like as the page loads.
(function () {
  var HEART = 'M19.0711 13.1421L13.4142 18.799C12.6332 19.58 11.3668 19.58 10.5858 18.799L4.92893 13.1421C2.97631 11.1895 2.97631 8.02369 4.92893 6.07107C6.88155 4.11845 10.0474 4.11845 12 6.07107C13.9526 4.11845 17.1184 4.11845 19.0711 6.07107C21.0237 8.02369 21.0237 11.1895 19.0711 13.1421Z';
  var COLORS = ['#F91880', '#FF7AB6', '#CC8EF5'];      // the small hearts: the disc's pink, a lighter pink, the ring's lilac
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // each small heart gets its own size, sway, tilt, height and pace, so no two likes look the same
  function floats(btn) {
    var fx = btn.querySelector('.like-fx');
    COLORS.slice(0, Math.random() < 0.4 ? 3 : 2).forEach(function (color, i) {
      var r = Math.random, el = document.createElement('span');
      el.className = 'like-float';
      el.style.cssText = '--s:' + (6 + r() * 3).toFixed(1) + 'px;--dx:' + ((r() * 2 - 1) * 5.6).toFixed(1) + 'px;--dy:' + (-(22 + r() * 12)).toFixed(1) + 'px;' +
        '--r:' + ((r() * 2 - 1) * 9.6).toFixed(1) + 'deg;--dur:' + Math.round(900 + r() * 200) + 'ms;--dl:' + (380 + i * 90) + 'ms;--fc:' + color;
      el.innerHTML = '<span><svg viewBox="0 0 24 24"><path d="' + HEART + '"></path></svg></span>';
      el.addEventListener('animationend', function (e) { if (e.target === el) el.remove(); });
      fx.appendChild(el);
    });
  }

  function setLike(btn, on, quiet) {
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.remove('is-liking', 'is-unliking');
    clearTimeout(btn.likeTimer);
    if (quiet) {
      btn.querySelectorAll('.like-float').forEach(function (n) { n.remove(); });
      return;
    }
    void btn.offsetWidth;                                // lets the same animation play again
    btn.classList.add(on ? 'is-liking' : 'is-unliking');
    btn.likeTimer = setTimeout(function () { btn.classList.remove('is-liking', 'is-unliking'); }, on ? 1250 : 400);
    if (on && !reduce.matches) floats(btn);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('button.like');
    if (btn) setLike(btn, btn.getAttribute('aria-pressed') !== 'true');
  });
  window.setLike = setLike;
})();
