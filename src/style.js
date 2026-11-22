// each piece's CSS goes into the page once, the first time one is mounted
const done = new Set();
export function css(id, text) {
  if (done.has(id) || typeof document === 'undefined') return;
  done.add(id);
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = text;
  document.head.appendChild(s);
}
