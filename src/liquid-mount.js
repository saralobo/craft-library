// Liquid pay: the mount around the library's liquid.js. liquid.js draws with WebGL and needs nothing else, so it goes
// in unchanged, like the panorama.
import { mountLiquid } from './liquid.js';

// host: the element the track goes in (it sizes itself: `width` px wide, a fifth of that tall). o: { label (the words on
// the track, default "Slide to pay"), cta (the button's word, default "Pay"), width (px, default 320), gyroscope (false:
// never read the phone's tilt), tilt (-1 to 1, a fixed tilt for a page without a gyroscope), fonts (false: don't load
// DM Sans), onConfirm() once the drop reaches the end }. Returns { reset(), pay(), tilt(v), gyroscope(), width(px),
// paid, progress, destroy() }.
export function mountLiquidPay(host, o = {}) {
  const opts = {};
  for (const k in o) if (o[k] !== undefined && k !== 'onConfirm') opts[k] = o[k];
  const m = mountLiquid(host, opts);
  const confirm = () => { if (o.onConfirm) o.onConfirm(); };
  m.element.addEventListener('liquidconfirm', confirm);
  const destroy = m.destroy;
  return Object.defineProperties({
    element: m.element, reset: m.reset, pay: m.pay, tilt: m.tilt, gyroscope: m.gyroscope, width: m.width,
    destroy() { m.element.removeEventListener('liquidconfirm', confirm); destroy(); }
  }, {
    paid: { get: () => m.paid, enumerable: true },
    progress: { get: () => m.progress, enumerable: true }
  });
}
