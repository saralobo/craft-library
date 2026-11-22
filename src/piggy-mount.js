// Glass piggy bank: the mount around the library's piggy.js. piggy.js, and three.js with it, loads only when a piggy
// bank is mounted, so the other pieces stay light.
import { loadPiggy } from './piggy-load.js';

const LABEL = 'A glass piggy bank hops in, coins drop in through its slot and it closes its eyes, happy.';

// host: the element the moment fills (give it a size). o: { autoplay (false: wait for play()), interactive (false: no
// tap to replay, no drag), label, onDone() after each play }
export function mountPiggyBank(host, o = {}) {
  let pig = null, gone = false, wantPlay = false;
  const opts = { label: o.label || LABEL };
  if (o.autoplay === false) opts.autoplay = false;
  if (o.interactive === false) opts.interactive = false;
  const done = () => { if (o.onDone) o.onDone(); };
  host.addEventListener('piggydone', done);
  const ready = loadPiggy().then((m) => {
    if (gone) return null;
    pig = m.mountPiggy(host, opts);
    if (wantPlay) pig.play();
    return pig.ready.then(() => pig);
  });
  return {
    ready,
    play: () => { if (pig) pig.play(); else wantPlay = true; },
    destroy() { gone = true; host.removeEventListener('piggydone', done); if (pig) pig.destroy(); pig = null; }
  };
}
