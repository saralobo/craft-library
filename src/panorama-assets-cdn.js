// where the Panorama's own clip and pictures are in the one-file CDN build: dist/panorama/, next to craft.js
const me = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : '';
export const ASSETS = (me ? me.slice(0, me.lastIndexOf('/') + 1) : 'https://cdn.jsdelivr.net/npm/craft-library@0/dist/') + 'panorama/';
