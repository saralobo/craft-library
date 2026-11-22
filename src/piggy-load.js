// where the piggy bank comes from: for bundlers, the package's piggy.js (it imports the `three` dependency)
export const loadPiggy = () => import('./piggy.js');
