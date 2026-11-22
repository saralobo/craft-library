// Map pin: the mount around the library's pin.js. pin.js, and three.js with it, loads only when a map pin is mounted,
// so the other pieces stay light.
import { loadPin } from './pin-load.js';

// host: the element the map fills (give it a size; it is made for about 560 × 560). o: { labels: { title, confirm,
// confirmed }, label (the map's accessible name), autoplay (false: the pin waits for replay()), fonts (false: don't load
// DM Sans), onChange(address), onConfirm(address) }; address: { address, neighbourhood, place }
export function mountMapPin(host, o = {}) {
  let pin = null, gone = false, wantReplay = false;
  const opts = { labels: o.labels, label: o.label, manual: o.manual };
  if (o.autoplay === false) opts.autoplay = false;
  if (o.fonts === false) opts.fonts = false;
  const change = (e) => { if (o.onChange) o.onChange(e.detail); };
  const confirm = (e) => { if (o.onConfirm) o.onConfirm(e.detail); };
  host.addEventListener('pinchange', change); host.addEventListener('pinconfirm', confirm);
  const ready = loadPin().then((m) => {
    if (gone) return null;
    pin = m.mountPin(host, opts);
    if (wantReplay) pin.replay();
    return pin.ready.then(() => pin);
  });
  return {
    ready,
    replay: () => { if (pin) pin.replay(); else wantReplay = true; },
    confirm: () => { if (pin) pin.confirm(); },
    tick: (dt, now) => { if (pin) pin.tick(dt, now); },
    get address() { return pin ? pin.address : null; },
    destroy() { gone = true; host.removeEventListener('pinchange', change); host.removeEventListener('pinconfirm', confirm); if (pin) pin.destroy(); pin = null; }
  };
}
