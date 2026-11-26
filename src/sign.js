// Where the pieces come from: one quiet line in the browser console, once per page, for the people who build with them
// (nothing shows on the page itself). It waits for the page to finish loading, so a page can set
// window.CRAFT_LIBRARY_QUIET = true (in any script, or right after importing the package) to skip it.
export function sign() {
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__craftLibrarySigned) return;
  window.__craftLibrarySigned = true;
  const say = () => {
    if (window.CRAFT_LIBRARY_QUIET || typeof console === 'undefined') return;
    console.info('%cSara Lobo Library%c  interface pieces by Sara Lobo · https://saralobolibrary.com/?ref=console', 'font-weight:600', 'color:#8a8e96');
  };
  if (document.readyState === 'complete') setTimeout(say, 0);
  else addEventListener('load', () => setTimeout(say, 0), { once: true });
}
