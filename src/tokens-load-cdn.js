// where the token wheel comes from in the one-file CDN build: tokens.cdn.js, the library's tokens.js exactly as the site
// serves it (three.js from jsDelivr), next to craft.js, fetched the first time a token wheel is mounted
const me = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : '';
const base = me ? me.slice(0, me.lastIndexOf('/') + 1) : 'https://cdn.jsdelivr.net/npm/craft-library@0/dist/';
export const loadTokens = () => import(base + 'tokens.cdn.js');
