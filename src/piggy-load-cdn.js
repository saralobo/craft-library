// where the piggy bank comes from in the one-file CDN build: piggy.cdn.js, the library's piggy.js exactly as the site
// serves it (three.js from jsDelivr), next to craft.js, fetched the first time a piggy bank is mounted
const me = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : '';
const base = me ? me.slice(0, me.lastIndexOf('/') + 1) : 'https://cdn.jsdelivr.net/npm/craft-library@0/dist/';
export const loadPiggy = () => import(base + 'piggy.cdn.js');
