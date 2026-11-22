// where the token wheel comes from: for bundlers, the package's tokens.js (it imports the `three` dependency)
export const loadTokens = () => import('./tokens.js');
