// where the map pin comes from in the one-file CDN build: pin.cdn.js, the library's pin.js exactly as the site serves it
// (three.js from jsDelivr), next to craft.js, fetched the first time a map pin is mounted
const me = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : '';
const base = me ? me.slice(0, me.lastIndexOf('/') + 1) : 'https://cdn.jsdelivr.net/npm/craft-library@0/dist/';
export const loadPin = () => import(base + 'pin.cdn.js');
