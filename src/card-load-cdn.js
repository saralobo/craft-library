// where the card comes from in the one-file CDN build: card.cdn.js, the library's card.js exactly as the site serves
// it (three.js from jsDelivr), next to craft.js, fetched the first time a card is mounted
const me = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : '';
const base = me ? me.slice(0, me.lastIndexOf('/') + 1) : 'https://cdn.jsdelivr.net/npm/craft-library@0/dist/';
export const loadCard = () => import(base + 'card.cdn.js');
