// The pieces as React components. Each renders an empty host and mounts the library's own piece into it, so what
// shows is the same markup, CSS and motion as on the site.
import { createElement, useEffect, useRef } from 'react';
import { mountLike } from './like.js';
import { mountMagnet } from './magnet.js';
import { mountGlassNav } from './glassnav.js';
import { mountIridescentCard } from './card-mount.js';
import { mountPiggyBank } from './piggy-mount.js';
import { mountThinking } from './thinking.js';
import { mountPanoramaReel } from './panorama-mount.js';
import { mountMapPin } from './pin-mount.js';
import { mountTokenWheel } from './tokens-mount.js';
import { mountLiquidPay } from './liquid-mount.js';

const HOST = { display: 'inline-block', lineHeight: 0, verticalAlign: 'middle' };

// a callback prop that can change on every render without remounting the piece
function useLatest(fn) { const r = useRef(fn); r.current = fn; return r; }

export function LikeButton({ defaultLiked = false, label, onChange, className, style }) {
  const host = useRef(null), change = useLatest(onChange);
  useEffect(() => {
    const m = mountLike(host.current, { liked: defaultLiked, label, onChange: (v) => change.current && change.current(v) });
    return () => m.destroy();
  }, [label]);
  return createElement('span', { ref: host, className, style: { ...HOST, ...style } });
}

export function MagneticIcon({ label, size, onClick, className, style }) {
  const host = useRef(null), click = useLatest(onClick);
  useEffect(() => {
    const m = mountMagnet(host.current, { label, size, onClick: (e) => click.current && click.current(e) });
    return () => m.destroy();
  }, [label, size]);
  return createElement('span', { ref: host, className, style: { ...HOST, ...style } });
}

// active: the chosen item (0–4). Changing it moves the capsule there; onSelect reports every choice.
export function GlassNav({ active = 2, labels, label, onSelect, className, style }) {
  const host = useRef(null), bar = useRef(null), select = useLatest(onSelect);
  useEffect(() => {
    const m = bar.current = mountGlassNav(host.current, { active, labels, label, onSelect: (i) => select.current && select.current(i) });
    return () => { m.destroy(); bar.current = null; };
  }, [label, labels && labels.join('\n')]);
  useEffect(() => { const m = bar.current; if (m && m.active !== active) m.select(active); }, [active]);
  // the wrapper must stay out of any stacking context (no transform, opacity, filter or isolation), or the glass stops blending
  return createElement('span', { ref: host, className, style });
}

// The card fills the box it renders (100% wide and `height` tall, 480px by default) and sits centred in it. The box
// keeps at least 300px of width, so a parent that shrinks to its content (a centring flex row) can't fold it to nothing.
// It loads its 3D scene (three.js) the first time it mounts. onTurn reports each turn with the face now showing.
export function IridescentCard({ height = 480, size, name, number, expiry, cvv, logo, entrance, label, onTurn, className, style }) {
  const host = useRef(null), turn = useLatest(onTurn);
  const num = Array.isArray(number) ? number.join(' ') : number;
  useEffect(() => {
    const m = mountIridescentCard(host.current, { size, name, number: num, expiry, cvv, logo, entrance, label, onTurn: (f) => turn.current && turn.current(f) });
    return () => m.destroy();
  }, [size, name, num, expiry, cvv, logo, entrance, label]);
  return createElement('div', { ref: host, className, style: { position: 'relative', width: '100%', minWidth: 300, height, ...style } });
}

// The piggy bank fills the box it renders (100% wide and `height` tall, 560px by default; it is made for a phone screen)
// and plays its moment the first time it comes into view; a tap plays it again. replay: change it (a counter) to play
// it again from code. It loads its 3D scene (three.js) the first time it mounts. onDone reports the end of each play.
export function PiggyBank({ height = 560, autoplay, interactive, replay, label, onDone, className, style }) {
  const host = useRef(null), pig = useRef(null), last = useRef(replay), done = useLatest(onDone);
  useEffect(() => {
    const m = pig.current = mountPiggyBank(host.current, { autoplay, interactive, label, onDone: () => done.current && done.current() });
    return () => { m.destroy(); pig.current = null; };
  }, [autoplay, interactive, label]);
  useEffect(() => { if (last.current === replay) return; last.current = replay; if (pig.current) pig.current.play(); }, [replay]);
  return createElement('div', { ref: host, className, style: { position: 'relative', width: '100%', minWidth: 280, height, ...style } });
}

// The Magic sphere and the Sweep: a "thinking" indicator, a ball of dots with the word beside it. size: the ball, px or
// any CSS length (32 by default; under 64px it draws finer, denser dots made to sit beside text). label: the word
// ("Thinking" by default; '' for the ball alone). The host keeps its line height, so the word is never clipped.
function thinkingComponent(kind, name) {
  function Thinking({ size, label, className, style }) {
    const host = useRef(null);
    useEffect(() => {
      const m = mountThinking(host.current, { kind, size, label });
      return () => m.destroy();
    }, [size, label]);
    return createElement('span', { ref: host, className, style: { display: 'inline-block', verticalAlign: 'middle', ...style } });
  }
  Thinking.displayName = name;
  return Thinking;
}
export const MagicSphere = thinkingComponent('sphere', 'MagicSphere');
export const SweepSphere = thinkingComponent('sweep', 'SweepSphere');

// The Panorama fills the box it renders (100% wide and `height` tall, 640px by default): a hero for moving pictures.
// With no `video` and no `stills` it shows the library's own clip and pictures; pass yours to make it your own (the
// pictures must come from your site or one that allows CORS). replay: change it (a counter) to play the opening again.
export function PanoramaReel({ height = 640, title, text, textItalic, video, stills, labels, intro, cursor, fonts, replay, className, style }) {
  const host = useRef(null), dome = useRef(null), last = useRef(replay);
  const key = JSON.stringify([title, text, textItalic, video, stills, labels, intro, cursor, fonts]);
  useEffect(() => {
    const m = dome.current = mountPanoramaReel(host.current, { title, text, textItalic, video, stills, labels, intro, cursor, fonts });
    return () => { m.destroy(); dome.current = null; };
  }, [key]);
  useEffect(() => { if (last.current === replay) return; last.current = replay; if (dome.current) dome.current.replay(); }, [replay]);
  return createElement('div', { ref: host, className, style: { position: 'relative', width: '100%', height, ...style } });
}

// The map pin fills the box it renders (100% wide and `height` tall, 560px by default) with a city map and a glass pin:
// a click on a street sends the pin to its curb, and the card under the map confirms the address. onChange and onConfirm
// get { address, neighbourhood, place }. labels: { title, confirm, confirmed }, the card's words. replay: change it (a
// counter) to fly the pin off and back in. It loads its 3D scene (three.js) the first time it mounts.
export function MapPin({ height = 560, labels, label, autoplay, fonts, replay, onChange, onConfirm, className, style }) {
  const host = useRef(null), pin = useRef(null), last = useRef(replay), change = useLatest(onChange), confirm = useLatest(onConfirm);
  const key = JSON.stringify([labels, label, autoplay, fonts]);
  useEffect(() => {
    const m = pin.current = mountMapPin(host.current, { labels, label, autoplay, fonts, onChange: (a) => change.current && change.current(a), onConfirm: (a) => confirm.current && confirm.current(a) });
    return () => { m.destroy(); pin.current = null; };
  }, [key]);
  useEffect(() => { if (last.current === replay) return; last.current = replay; if (pin.current) pin.current.replay(); }, [replay]);
  return createElement('div', { ref: host, className, style: { position: 'relative', width: '100%', height, ...style } });
}

// The token wheel fills the box it renders (100% wide and `height` tall, 900px by default): an account onboarding screen
// whose silver tokens turn on a wheel. With the frame (the default) the screen sits in a phone that scales to fit the box,
// with two round buttons beside it, turn it on its side and replay; turned lays it down from code, and the tokens fall
// and pile up against the edge. frame={false} fills the box with the screen itself, for a real phone, where the phone's
// own tilt moves the tokens. onContinue: the white pill. It loads its 3D scene (three.js) the first time it mounts.
export function TokenWheel({ height = 900, labels, frame, controls, autoplay, fonts, gyroscope, turned, replay, onContinue, className, style }) {
  const host = useRef(null), wheel = useRef(null), last = useRef(replay), cont = useLatest(onContinue);
  const key = JSON.stringify([labels, frame, controls, autoplay, fonts, gyroscope]);
  useEffect(() => {
    const m = wheel.current = mountTokenWheel(host.current, { labels, frame, controls, autoplay, fonts, gyroscope, turned, onContinue: () => cont.current && cont.current() });
    return () => { m.destroy(); wheel.current = null; };
  }, [key]);
  useEffect(() => { const m = wheel.current; if (m && turned != null && m.turned !== !!turned) m.turn(!!turned); }, [turned]);
  useEffect(() => { if (last.current === replay) return; last.current = replay; if (wheel.current) wheel.current.replay(); }, [replay]);
  return createElement('div', { ref: host, className, style: { position: 'relative', width: '100%', height, ...style } });
}

// Liquid pay: slide to pay, with a drop of liquid chrome for a handle. It sizes itself (`width` px wide, 320 by default,
// and a fifth of that tall). onConfirm runs once, when a drag carries the drop to the end; tilting the phone moves the
// drop but never pays. reset: change it (a counter) to bring the drop back for another payment. tilt: -1 to 1, a fixed
// tilt for a page without a gyroscope (null hands back to the phone).
export function LiquidPay({ label, cta, width, gyroscope, fonts, tilt, reset, onConfirm, className, style }) {
  const host = useRef(null), pay = useRef(null), last = useRef(reset), confirm = useLatest(onConfirm);
  useEffect(() => {
    const m = pay.current = mountLiquidPay(host.current, { label, cta, width, gyroscope, fonts, tilt, onConfirm: () => confirm.current && confirm.current() });
    return () => { m.destroy(); pay.current = null; };
  }, [label, cta, gyroscope, fonts]);
  useEffect(() => { if (pay.current) pay.current.width(width); }, [width]);
  useEffect(() => { if (pay.current) pay.current.tilt(tilt); }, [tilt]);
  useEffect(() => { if (last.current === reset) return; last.current = reset; if (pay.current) pay.current.reset(); }, [reset]);
  return createElement('span', { ref: host, className, style: { ...HOST, ...style } });
}

export { mountLike, mountMagnet, mountGlassNav, mountIridescentCard, mountPiggyBank, mountThinking, mountPanoramaReel, mountMapPin, mountTokenWheel, mountLiquidPay };
