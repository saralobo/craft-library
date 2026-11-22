// Iridescent card: the mount around the library's card.js. card.js, and three.js with it, loads only when a card is
// mounted, so the other pieces stay light.
import { loadCard } from './card-load.js';

const LABEL = 'Credit card. Press to turn it over and see the back.';
const KEYS = ['name', 'number', 'expiry', 'cvv', 'logo', 'size', 'entrance', 'interactive'];

// host: the element the card fills (give it a size; the card sits centred at `size` of its height).
// o: { name, number ('4532 8890 1274 3306' or four groups), expiry, cvv, logo (an image URL), size (0–1, default 0.72),
//      entrance (false: no half turn on mount), interactive (false: no tap or drag), label, onTurn(face) }
export function mountIridescentCard(host, o = {}) {
  let card = null, gone = false;
  const opts = { label: o.label || LABEL };
  for (const k of KEYS) if (o[k] !== undefined && o[k] !== null) opts[k] = o[k];
  if (typeof opts.number === 'string') opts.number = opts.number.trim().split(/\s+/);
  const turned = (e) => { if (o.onTurn) o.onTurn(e.detail.face); };
  host.addEventListener('cardturn', turned);
  const ready = loadCard().then((m) => {
    if (gone) return null;
    if (!opts.logo && m.LOGO) opts.logo = m.LOGO;              // the Visa mark, carried in the module
    card = m.mountCard(host, opts);
    return card.ready.then(() => card);
  });
  return {
    ready,
    turn: (dir) => { if (card) card.turn(dir); },
    show: (face) => { if (card) card.show(face); },
    play: () => { if (card) card.play(); },
    get face() { return card ? card.face : 'front'; },
    destroy() { gone = true; host.removeEventListener('cardturn', turned); if (card) card.destroy(); card = null; }
  };
}
