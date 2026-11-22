// Token wheel: the mount around the library's tokens.js. tokens.js, and three.js with it, loads only when a token wheel
// is mounted, so the other pieces stay light.
import { loadTokens } from './tokens-load.js';

// host: the element the screen fills (give it a size; with the frame the phone, 390 × 844, scales to fit, and it is made
// for a box about 900px tall). o: { labels: { eyebrow, title, cta, initials }, frame (false: the screen fills the host,
// for a real phone), controls (false: no turn and replay buttons beside the phone), autoplay (false: the tokens wait for
// replay()), fonts (false: don't load DM Sans), gyroscope (false: never read the phone's tilt), turned (true: lay it on
// its side), onContinue() when the white pill is pressed }
export function mountTokenWheel(host, o = {}) {
  let w = null, gone = false, wantReplay = false, wantTurn = o.turned ? true : null;
  const opts = { labels: o.labels, frame: o.frame, controls: o.controls, autoplay: o.autoplay, fonts: o.fonts, gyroscope: o.gyroscope };
  const cont = () => { if (o.onContinue) o.onContinue(); };
  host.addEventListener('tokenscontinue', cont);
  const ready = loadTokens().then((m) => {
    if (gone) return null;
    w = m.mountTokens(host, opts);
    if (wantTurn != null) w.turn(wantTurn);
    if (wantReplay) w.replay();
    return w.ready.then(() => w);
  });
  return {
    ready,
    replay: () => { if (w) w.replay(); else wantReplay = true; },
    turn: (side) => { if (w) return w.turn(side); wantTurn = side == null ? !wantTurn : !!side; return wantTurn; },
    gyroscope: () => (w ? w.gyroscope() : Promise.resolve(false)),   // call it from a tap: iOS asks the person first
    get turned() { return w ? w.turned : !!wantTurn; },
    destroy() { gone = true; host.removeEventListener('tokenscontinue', cont); if (w) w.destroy(); w = null; }
  };
}
