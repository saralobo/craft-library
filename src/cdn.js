// the one-file build for a <script> tag: registers the ten tags and exposes the mount functions (the 3D pieces' scenes
// are fetched from next to this file the first time one is mounted, and so are the Panorama's clip and pictures)
import { mountLike, mountMagnet, mountGlassNav, mountIridescentCard, mountPiggyBank, mountThinking, mountPanoramaReel, mountMapPin, mountTokenWheel } from './elements.js';
window.CraftLibrary = { mountLike, mountMagnet, mountGlassNav, mountIridescentCard, mountPiggyBank, mountThinking, mountPanoramaReel, mountMapPin, mountTokenWheel };
