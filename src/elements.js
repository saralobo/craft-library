// <glass-nav>, <like-button>, <magnetic-icon>, <iridescent-card>, <piggy-bank>, <magic-sphere>, <sweep-sphere>, <panorama-reel>, <map-pin> and <token-wheel>: the
// pieces as HTML tags, for pages without React. They render into the page itself (no shadow root), so the glass can
// blend with what is behind it.
import { mountLike } from './like.js';
import { mountMagnet } from './magnet.js';
import { mountGlassNav } from './glassnav.js';
import { mountIridescentCard } from './card-mount.js';
import { mountPiggyBank } from './piggy-mount.js';
import { mountThinking } from './thinking.js';
import { mountPanoramaReel } from './panorama-mount.js';
import { mountMapPin } from './pin-mount.js';
import { mountTokenWheel } from './tokens-mount.js';
import { css } from './style.js';
import { sign } from './sign.js';

sign();

function define(name, mount, options) {
  if (typeof customElements === 'undefined' || customElements.get(name)) return;
  customElements.define(name, class extends HTMLElement {
    connectedCallback() {
      if (this.piece) return;                                    // moved, not new: it keeps its state
      css('craft-hosts', 'like-button,magnetic-icon{display:inline-block;line-height:0;vertical-align:middle}');
      this.piece = mount(this, options(this));
    }
  });
}
const send = (el, type, detail) => el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));

define('like-button', mountLike, (el) => ({
  liked: el.hasAttribute('liked'),
  label: el.getAttribute('label') || undefined,
  onChange: (liked) => { el.toggleAttribute('liked', liked); send(el, 'change', { liked }); }
}));
define('magnetic-icon', mountMagnet, (el) => ({
  label: el.getAttribute('label') || undefined,
  size: el.getAttribute('size') ? (isNaN(el.getAttribute('size')) ? el.getAttribute('size') : +el.getAttribute('size')) : undefined
}));
define('glass-nav', mountGlassNav, (el) => ({
  active: el.hasAttribute('active') ? +el.getAttribute('active') : undefined,
  labels: el.getAttribute('labels') ? el.getAttribute('labels').split(',').map((s) => s.trim()) : undefined,
  label: el.getAttribute('label') || undefined,
  onSelect: (index) => { el.setAttribute('active', index); send(el, 'select', { index }); }
}));

// the card fills the tag: a block, 100% wide (at least 300px, so a shrink-to-fit parent can't fold it) and 480px tall
// unless the page sizes it (zero specificity, so any rule wins). Each turn bubbles up from inside as a "cardturn"
// event, with e.detail.face.
define('iridescent-card', (el, o) => {
  css('craft-card-host', ':where(iridescent-card){display:block;position:relative;width:100%;min-width:300px;height:480px}');
  return mountIridescentCard(el, o);
}, (el) => ({
  name: el.getAttribute('name') || undefined,
  number: el.getAttribute('number') || undefined,
  expiry: el.getAttribute('expiry') || undefined,
  cvv: el.getAttribute('cvv') || undefined,
  logo: el.getAttribute('logo') || undefined,
  size: el.getAttribute('size') ? +el.getAttribute('size') : undefined,
  entrance: el.getAttribute('entrance') === 'false' ? false : undefined,
  label: el.getAttribute('label') || undefined
}));

// the piggy bank fills the tag: a block, 100% wide (at least 280px) and 560px tall unless the page sizes it. It plays
// the first time it comes into view; each play ends with a "piggydone" event. el.play() plays it again.
define('piggy-bank', (el, o) => {
  css('craft-piggy-host', ':where(piggy-bank){display:block;position:relative;width:100%;min-width:280px;height:560px}');
  const m = mountPiggyBank(el, o);
  el.play = m.play;
  return m;
}, (el) => ({
  autoplay: el.getAttribute('autoplay') === 'false' ? false : undefined,
  interactive: el.getAttribute('interactive') === 'false' ? false : undefined,
  label: el.getAttribute('label') || undefined
}));

// the thinking indicators: inline, beside text. size="32" (px) or any CSS length; label="Thinking" by default,
// label="" for the ball alone
const thinkingTag = (kind) => (el, o) => {
  css('craft-thinking-host', 'magic-sphere,sweep-sphere{display:inline-block;vertical-align:middle}');
  return mountThinking(el, { ...o, kind });
};
const thinkingOptions = (el) => ({
  size: el.getAttribute('size') ? (isNaN(el.getAttribute('size')) ? el.getAttribute('size') : +el.getAttribute('size')) : undefined,
  label: el.hasAttribute('label') ? el.getAttribute('label') : undefined
});
define('magic-sphere', thinkingTag('sphere'), thinkingOptions);
define('sweep-sphere', thinkingTag('sweep'), thinkingOptions);

// the panorama fills the tag: a block, 100% wide and 640px tall unless the page sizes it. heading="…" is its title (a
// title attribute would also show as a tooltip); video and stills take JSON. el.replay() plays the opening again.
const json = (s) => { if (!s) return undefined; try { return JSON.parse(s); } catch (e) { console.warn('panorama-reel: not JSON', s); return undefined; } };
define('panorama-reel', (el, o) => {
  css('craft-panorama-host', ':where(panorama-reel){display:block;position:relative;width:100%;height:640px}');
  const m = mountPanoramaReel(el, o);
  el.replay = m.replay;
  return m;
}, (el) => ({
  title: el.getAttribute('heading') ?? undefined,
  text: el.getAttribute('text') ?? undefined,
  textItalic: el.getAttribute('text-italic') ?? undefined,
  video: json(el.getAttribute('video')),
  stills: json(el.getAttribute('stills')),
  labels: el.getAttribute('labels') === 'false' ? false : undefined,
  intro: el.getAttribute('intro') === 'false' ? false : undefined,
  cursor: el.getAttribute('cursor') === 'false' ? false : undefined,
  fonts: el.getAttribute('fonts') === 'false' ? false : undefined
}));

// the map pin fills the tag: a block, 100% wide and 560px tall unless the page sizes it. Each address the pin is sent to
// fires "pinchange" and a confirmation "pinconfirm", both with e.detail { address, neighbourhood, place }. The words:
// label-title, label-confirm, label-confirmed. el.replay() flies the pin off and back in.
define('map-pin', (el, o) => {
  css('craft-pin-host', ':where(map-pin){display:block;position:relative;width:100%;height:560px}');
  const m = mountMapPin(el, o);
  el.replay = m.replay;
  return m;
}, (el) => ({
  labels: { title: el.getAttribute('label-title') ?? undefined, confirm: el.getAttribute('label-confirm') ?? undefined, confirmed: el.getAttribute('label-confirmed') ?? undefined },
  label: el.getAttribute('label') || undefined,
  autoplay: el.getAttribute('autoplay') === 'false' ? false : undefined,
  fonts: el.getAttribute('fonts') === 'false' ? false : undefined
}));

// the token wheel fills the tag: a block, 100% wide and 900px tall unless the page sizes it. Its white pill fires
// "tokenscontinue". The words: label-eyebrow, label-title, label-cta, initials. frame="false" fills the tag with the
// screen (a real phone), controls="false" hides the round buttons, turned lays it on its side; from code, el.turn(true)
// lays it down, el.turn(false) stands it up and el.replay() plays the opening again.
const off = (el, name) => (el.getAttribute(name) === 'false' ? false : undefined);
define('token-wheel', (el, o) => {
  css('craft-tokens-host', ':where(token-wheel){display:block;position:relative;width:100%;height:900px}');
  const m = mountTokenWheel(el, o);
  el.replay = m.replay; el.turn = m.turn; el.gyroscope = m.gyroscope;
  return m;
}, (el) => ({
  labels: { eyebrow: el.getAttribute('label-eyebrow') ?? undefined, title: el.getAttribute('label-title') ?? undefined, cta: el.getAttribute('label-cta') ?? undefined, initials: el.getAttribute('initials') ?? undefined },
  frame: off(el, 'frame'), controls: off(el, 'controls'), autoplay: off(el, 'autoplay'), fonts: off(el, 'fonts'), gyroscope: off(el, 'gyroscope'),
  turned: el.hasAttribute('turned') && el.getAttribute('turned') !== 'false'
}));

export { mountLike, mountMagnet, mountGlassNav, mountIridescentCard, mountPiggyBank, mountThinking, mountPanoramaReel, mountMapPin, mountTokenWheel };
