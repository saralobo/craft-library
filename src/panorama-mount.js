// Panorama: the mount around the library's panorama.js. With no video and no stills it shows the library's own clip
// and pictures, which ship with the package in dist/panorama/ (see panorama-assets.js for where they are read from).
import { mountPanorama } from './panorama.js';
import { ASSETS } from './panorama-assets.js';

// the pictures and their names, in the library demo's order
const FILMS = [
  ['s01', 'The Coast Road', 2025], ['s02', 'Small Hours', 2024], ['s03', 'Vacancy', 2025], ['s13', 'Blue Room', 2024],
  ['s05', 'Two Bodies', 2024], ['s06', 'Salt', 2025], ['s07', 'After Rain', 2023], ['s14', 'Keeper', 2025],
  ['s08', 'High Country', 2025], ['s09', 'Last Picture House', 2024], ['s10', 'Mr. Albescu', 2023], ['s15', 'Summer, Ohio', 2023],
  ['s11', 'Pinewood', 2025], ['s12', 'Riviera', 2026], ['s16', 'Room 414', 2026]
];

// host: the element it fills (give it a size). o: { title, text, textItalic, video: { src, poster, title, year },
// stills: [{ src, title, year }] (up to 16), labels, intro, cursor, fonts }. Returns { replay(), destroy() }.
export function mountPanoramaReel(host, o = {}) {
  const opts = {};
  for (const k in o) if (o[k] !== undefined) opts[k] = o[k];   // an unset option keeps the piece's own default
  if (opts.video === undefined) opts.video = { src: ASSETS + 'reel.mp4', poster: ASSETS + 'poster.webp', title: 'Wild Grass', year: 2026 };
  if (opts.stills === undefined) opts.stills = FILMS.map(([n, title, year]) => ({ src: ASSETS + 't/' + n + '.webp', title, year }));
  return mountPanorama(host, opts);
}
