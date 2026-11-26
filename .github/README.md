# Sara Lobo Library

Interface pieces by [Sara Lobo](https://www.saralobodesign.com/), designed, tested and polished one detail at a time: a liquid glass nav bar, a bursting heart, a magnetic icon, an iridescent 3D card, a glass piggy bank, two "thinking" indicators, the Magic sphere and the Sweep, the Panorama, a hero for moving pictures, the Map pin, an address picker, the Token wheel, an onboarding screen, and Liquid pay, a slide to pay in liquid chrome. Each one is the exact piece from the library, with its own CSS and motion, for React 18+ or plain HTML. The only dependency is three.js, for five of the 3D pieces, and it loads only when one of them is on the page.

```bash
npm install craft-library
```

<a href="https://saralobolibrary.com/?ref=github"><img src="https://saralobolibrary.com/og/home.jpg" width="600" alt="Sara Lobo Library: micro-interactions with craft, to use and remix"></a>

**See every piece live, and copy a short prompt for Claude Code, Cursor, Lovable, Codex, Figma Make or Gemini: [saralobolibrary.com](https://saralobolibrary.com/?ref=github)**

## Liquid glass nav bar

<a href="https://saralobolibrary.com/glassnav?ref=github"><img src="https://saralobolibrary.com/og/glassnav.jpg" width="600" alt="Liquid glass nav bar, Sara Lobo Library"></a>

[See it live and copy its prompt →](https://saralobolibrary.com/glassnav?ref=github)

A 291×60 liquid glass bar for a dark app, the Figma glass layer by layer. The white capsule stretches as it travels to the chosen item, the neighbours step aside and each icon has its own gesture.

```jsx
import { GlassNav } from 'craft-library';

const [tab, setTab] = useState(0);
<GlassNav active={tab} onSelect={setTab} />
```

| Prop | | |
|---|---|---|
| `active` | `0–4` | The chosen item: Home, Search, Ask AI, Messages, Settings. Changing it moves the capsule there. Default `2`. |
| `onSelect` | `(index) => void` | Every choice, by tap, drag or arrow keys. |
| `labels` | `string[5]` | The five accessible names, in order. |
| `label` | `string` | The bar's own name. Default `"Main navigation"`. |

The glass blends with what is behind it, so put the bar on a solid background and keep `transform`, `opacity`, `filter` and `isolation` off the bar and its wrapper.

## Bursting heart

<a href="https://saralobolibrary.com/like?ref=github"><img src="https://saralobolibrary.com/og/like.jpg" width="600" alt="Bursting heart, Sara Lobo Library"></a>

[See it live and copy its prompt →](https://saralobolibrary.com/like?ref=github)

A 40px round like button, black at 60%, made to sit over photos and mid-tone backgrounds. Liking: the heart vanishes, a pink disc grows into a lilac ring, 14 dots and 2 or 3 small hearts burst out, and the heart springs back filled. Unliking only takes the colour away.

```jsx
import { LikeButton } from 'craft-library';

<LikeButton onChange={(liked) => saveLike(liked)} />
```

| Prop | | |
|---|---|---|
| `defaultLiked` | `boolean` | Starts liked, with no animation. |
| `onChange` | `(liked) => void` | After every tap. |
| `label` | `string` | The accessible name. Default `"Like"`. |

## Magnetic icon

<a href="https://saralobolibrary.com/magnet?ref=github"><img src="https://saralobolibrary.com/og/magnet.jpg" width="600" alt="Magnetic icon, Sara Lobo Library"></a>

[See it live and copy its prompt →](https://saralobolibrary.com/magnet?ref=github)

A round search button with a brushed-metal rim, for dark backgrounds. Near the cursor the rim acts like metal near a strong magnet: the disc is drawn toward the pointer, the rim creases and trembles and, where it is pulled, comes apart in small voxels of metal; its tip cracks into shards and the voxels fly off to the pointer.

```jsx
import { MagneticIcon } from 'craft-library';

<MagneticIcon onClick={openSearch} />
```

| Prop | | |
|---|---|---|
| `size` | `number \| string` | px or any CSS length; the whole effect scales with it. Default `40`. |
| `label` | `string` | The accessible name. Default `"Search"`. |
| `onClick` | `(event) => void` | |

## Iridescent card

<a href="https://saralobolibrary.com/card?ref=github"><img src="https://saralobolibrary.com/og/card.jpg" width="600" alt="Iridescent card, Sara Lobo Library"></a>

[See it live and copy its prompt →](https://saralobolibrary.com/card?ref=github)

A 3D metal credit card: a brushed iridescent plate, a fine struck frame along the edge, a chip and the Visa mark. It arrives showing its back and makes a slow half turn to its face; a tap or a drag turns it over to show the numbers, heavy and without bounce. At rest it breathes slowly, and the light slides across the metal with its angle.

```jsx
import { IridescentCard } from 'craft-library';

<IridescentCard height={480} onTurn={(face) => console.log(face)} />
```

| Prop | | |
|---|---|---|
| `height` | `number \| string` | The box the card fills: 100% wide (at least 300px) and this tall, the card centred in it. Default `480`. |
| `size` | `0–1` | The card's height as a share of the box's. Default `0.72`. |
| `onTurn` | `(face) => void` | After every turn: `"front"` or `"back"`. |
| `name`, `number`, `expiry`, `cvv` | `string` | What the back shows. `number` as `"4532 8890 1274 3306"`. |
| `entrance` | `boolean` | `false` skips the half turn on mount. Default `true`. |
| `logo` | `string` | An image URL for the mark on the face, printed in white. Default: the Visa mark. |
| `label` | `string` | The accessible name. |

It is WebGL (three.js 0.169, which comes with the package and loads the first time a card mounts), so one card per screen is best. It is made for a dark background; black is best. The Visa mark is a trademark of Visa Inc., there to show a card: pass your own `logo` for anything real.

## Glass piggy bank

<a href="https://saralobolibrary.com/piggy?ref=github"><img src="https://saralobolibrary.com/og/piggy.jpg" width="600" alt="Glass piggy bank, Sara Lobo Library"></a>

[See it live and copy its prompt →](https://saralobolibrary.com/piggy?ref=github)

A congratulations moment in 3D, made for a phone screen: a frosted glass piggy bank hops in from the right with a full turn, lands on its hind feet, nearly tips over and clacks back down, rocking like the rigid glass it is. Coins pop into the air above it and drop in through the slot; each one knocks the glass, and its eyes close a little more until they curve, happy. It plays the first time it comes into view; a tap plays it again.

```jsx
import { PiggyBank } from 'craft-library';

<PiggyBank height={560} onDone={() => console.log('saved!')} />
```

| Prop | | |
|---|---|---|
| `height` | `number \| string` | The box the moment fills: 100% wide (at least 280px) and this tall. Default `560`. |
| `autoplay` | `boolean` | `false` waits instead of playing when it comes into view. Default `true`. |
| `replay` | `any` | Change it (a counter, say) to play the moment again. |
| `interactive` | `boolean` | `false` turns off tap-to-replay and the drag that turns it once it is still. Default `true`. |
| `onDone` | `() => void` | After each play, when its eyes open again. |
| `label` | `string` | The accessible name. |

It is WebGL (three.js 0.169, which comes with the package and loads the first time it mounts), so one per screen is best. It is made for a dark background; black is best.

## Map pin

<a href="https://saralobolibrary.com/pin?ref=github"><img src="https://saralobolibrary.com/og/pin.jpg" width="600" alt="Map pin, Sara Lobo Library"></a>

[See it live and copy its prompt →](https://saralobolibrary.com/pin?ref=github)

A 3D address picker: a hollow frosted-glass map pin over a dark city map in perspective. A click or a tap on a street sends the pin flying on springs to the nearest curb: it lifts, its head leans with the acceleration, it rises a touch to aim, falls under gravity and sticks its tip in, the glass vibrating about it. The map is sharp where it lands and soft further away, the streets carry their names, and a card along the bottom shows the address, with the number on the right side of the street, to confirm. With a mouse, hovering shows the address a click would give. The city and its names are invented, to show the gesture.

```jsx
import { MapPin } from 'craft-library';

<MapPin height={560} onConfirm={(a) => saveAddress(a)} />   // saveAddress: your own handler
```

| Prop | | |
|---|---|---|
| `height` | `number \| string` | The box it fills: 100% wide and this tall. Default `560`. |
| `onChange` | `(address) => void` | Each address the pin is sent to: `{ address, neighbourhood, place }`. |
| `onConfirm` | `(address) => void` | When Confirm is pressed, with the same address. |
| `labels` | `{ title, confirm, confirmed }` | The card's words. Defaults `"Delivery address"`, `"Confirm"`, `"Confirmed"`. |
| `replay` | `any` | Change it (a counter, say) to fly the pin off and back in. |
| `autoplay` | `boolean` | `false` keeps the pin out until `replay` changes. Default `true`. |
| `fonts` | `boolean` | `false` doesn't load DM Sans from Google Fonts. Default `true`. |
| `label` | `string` | The map's accessible name. |

It is WebGL (three.js 0.169, which comes with the package and loads the first time it mounts), so one per screen is best. It paints its own dark ground.

## Token wheel

<a href="https://saralobolibrary.com/tokens?ref=github"><img src="https://saralobolibrary.com/og/tokens.jpg" width="600" alt="Token wheel, Sara Lobo Library"></a>

[See it live and copy its prompt →](https://saralobolibrary.com/tokens?ref=github)

An account onboarding screen in 3D: eight silver tokens (Pix, card, Bitcoin, insurance, investments, exchange, cashback, boleto) turn slowly on a wheel, and the one at the top comes forward and makes a full turn to show what it is. Turn the phone on its side and the tokens let go: they fall, roll and pile up against the edge of the screen with rigid-body physics, a metal bounce and a wobble at every knock; stand it up and, once they rest, they float back into the wheel. The screen sits in a phone that scales to fit the box at every angle, with two round buttons beside it: turn the phone, replay.

```jsx
import { TokenWheel } from 'craft-library';

<TokenWheel height={900} onContinue={() => goToNextStep()} />   // goToNextStep: your own handler
```

| Prop | | |
|---|---|---|
| `height` | `number \| string` | The box it fills: 100% wide and this tall. Default `900`. |
| `labels` | `{ eyebrow, title, cta, initials }` | The screen's words. Defaults `"Account · BRL"`, `"One account for everything"`, `"Continue"`, `"SL"`. |
| `onContinue` | `() => void` | When the white pill is pressed. |
| `turned` | `boolean` | `true` lays the phone on its side, `false` stands it up. |
| `frame` | `boolean` | `false` fills the box with the screen itself, for a real phone (give it `100svh`): the phone's own tilt then moves the tokens (on iOS, after a tap on the wheel). Default `true`. |
| `controls` | `boolean` | `false` hides the two round buttons. Default `true`. |
| `replay` | `any` | Change it (a counter, say) to play the opening again. |
| `autoplay` | `boolean` | `false` keeps the tokens out until `replay` changes. Default `true`. |
| `gyroscope` | `boolean` | `false` never reads the phone's tilt. Default `true`. |
| `fonts` | `boolean` | `false` doesn't load DM Sans from Google Fonts. Default `true`. |

It is WebGL (three.js 0.169, which comes with the package and loads the first time it mounts), so one per screen is best. The screen is true black; put it on a dark page.

## Liquid pay

Slide to pay, with a drop of liquid chrome for a handle. Dragged slowly it stretches and follows the finger, heavy and without bounce; dragged too fast it splits into droplets that run after it and merge back in through a thin bridge of metal. Let go early and it flows back to the start and settles with a small ripple. Tilt the phone and it runs to the low side of the track, like mercury, but a tilt never pays: only a drag to the end does. At the end the drop is pulled into the Pay button and fills it with chrome, and a light crosses it.

```jsx
import { LiquidPay } from 'craft-library';

<LiquidPay onConfirm={() => pay()} />   // pay: your own handler
```

| Prop | | |
|---|---|---|
| `onConfirm` | `() => void` | Runs once, when a drag carries the drop to the end. |
| `label` | `string` | The words on the track. Default `"Slide to pay"`. |
| `cta` | `string` | The button's word. Default `"Pay"`. |
| `width` | `number` | px. Default `320`; it is a fifth of that tall. |
| `reset` | `any` | Change it (a counter, say) to bring the drop back for another payment. |
| `gyroscope` | `boolean` | `false` never reads the phone's tilt. Default `true`. On iOS the first touch asks for the motion permission. |
| `tilt` | `number` | `-1` to `1`, a fixed tilt for a page without a gyroscope; `null` hands back to the phone. |
| `fonts` | `boolean` | `false` doesn't load DM Sans from Google Fonts. Default `true`. |

It is WebGL with no dependencies: the drop is a field of metaballs drawn in one shader and moved by a small spring simulation (without WebGL it draws flat discs). The track is true black; put it on a dark page.

## Magic sphere and Sweep

<a href="https://saralobolibrary.com/sphere?ref=github"><img src="https://saralobolibrary.com/og/sphere.jpg" width="296" alt="Magic sphere, Sara Lobo Library"></a> <a href="https://saralobolibrary.com/sweep?ref=github"><img src="https://saralobolibrary.com/og/sweep.jpg" width="296" alt="Sweep, Sara Lobo Library"></a>

[See the Magic sphere live and copy its prompt →](https://saralobolibrary.com/sphere?ref=github) · [See the Sweep live and copy its prompt →](https://saralobolibrary.com/sweep?ref=github)

Two "thinking" indicators for the wait while an answer is being written: a ball of dots, drawn on a canvas, with the word beside it. The **Magic sphere** is a Rubik's cube on a ball, one grey tone per face: its slices turn and scramble the pieces, retrace their steps until every piece is home, and the ball lights up for a moment while a light passes through the word. In the **Sweep**, a wave crosses a dotted globe from left to right, lifting the dots it passes, runs on through the word at the same speed, and rests.

```jsx
import { MagicSphere, SweepSphere } from 'craft-library';

{isThinking && <MagicSphere />}
{isThinking && <SweepSphere label="Searching" />}
```

| Prop | | |
|---|---|---|
| `label` | `string` | The word beside the ball. Default `"Thinking"`; `""` shows the ball alone (still announced as "Thinking"). |
| `size` | `number \| string` | The ball, px or any CSS length. Default `32`. Under 64px it draws more, finer dots, made to sit beside text; larger, it shows the full detail. |

Both are made for a dark background: the dots and the word are light. On a light one, set `--thinking-ink` (the dots and the light in the word) and `--thinking-dim` (the word at rest) on it or a parent. The element is a `role="status"`.

## Panorama

<a href="https://saralobolibrary.com/panorama?ref=github"><img src="https://saralobolibrary.com/og/panorama.jpg" width="600" alt="Panorama, Sara Lobo Library"></a>

[See it live and copy its prompt →](https://saralobolibrary.com/panorama?ref=github)

A hero for people who work with moving pictures. A clip opens full-bleed under letterbox bars while the title tracks in, its letters closing up from a wide spacing and out of a blur, centre first; then the clip shrinks into one screen of a panorama of monitors around you, and the other screens arrive in a wave from it. The pointer turns your head. The screens are black and white: colour lives only in a soft circle around the pointer, and the screen under it lights the dark with its own colours while focus brackets lock on and name it.

```jsx
import { PanoramaReel } from 'craft-library';

<PanoramaReel height="100vh" title="Northlight" text="Films for the" textItalic="long evening." />
```

| Prop | | |
|---|---|---|
| `height` | `number \| string` | The box it fills: 100% wide and this tall. Default `640`. |
| `title`, `text`, `textItalic` | `string` | The title, and the line under it (`textItalic` follows `text` in the display face). Defaults: "Lorem ipsum", "Dolor sit amet," "consectetur adipiscing." |
| `video` | `{ src, poster, title, year }` | The opening clip, which then becomes the screen in the middle. |
| `stills` | `{ src, title, year }[]` | Up to 16 pictures for the other screens, cropped to 16:10. With neither `video` nor `stills`, it shows the library's own clip and 15 stills (served from jsDelivr). |
| `labels` | `boolean` | "CAM 07" on each screen. Default `true`. |
| `intro` | `boolean` | `false` starts it settled, without the opening. Default `true`. |
| `cursor` | `boolean` | The dot-and-ring pointer, for a mouse or trackpad. Default `true`. |
| `fonts` | `boolean` | `false` doesn't load Cormorant Garamond, Geist and Geist Mono from Google Fonts. Default `true`. |
| `replay` | `any` | Change it (a counter, say) to play the opening again. |

It is WebGL with no dependencies, so one per screen is best. Your clip and pictures must come from your own site or one that allows CORS. The opening plays the first time it comes into view; without WebGL it shows the poster and the title, still.

## Plain HTML

One script registers eleven tags. Same pieces, same props as attributes.

```html
<script src="https://cdn.jsdelivr.net/npm/craft-library@0/dist/craft.js"></script>

<glass-nav active="0"></glass-nav>        <!-- "select" event: e.detail.index -->
<like-button></like-button>               <!-- "change" event: e.detail.liked -->
<magnetic-icon size="40"></magnetic-icon>
<iridescent-card></iridescent-card>       <!-- "cardturn" event: e.detail.face; 100% wide, 480px tall unless you size it -->
<piggy-bank></piggy-bank>                 <!-- "piggydone" event after each play; el.play() replays; 100% wide, 560px tall unless you size it -->
<magic-sphere></magic-sphere>             <!-- label="Thinking" (default; label="" for the ball alone), size="32" -->
<sweep-sphere></sweep-sphere>
<panorama-reel heading="Lorem ipsum"></panorama-reel>  <!-- text, text-italic; video and stills as JSON; el.replay(); 100% wide, 640px tall unless you size it -->
<map-pin></map-pin>                       <!-- "pinchange" and "pinconfirm" events: e.detail { address, neighbourhood, place }; label-title, label-confirm, label-confirmed; el.replay(); 100% wide, 560px tall unless you size it -->
<token-wheel></token-wheel>               <!-- "tokenscontinue" event; label-eyebrow, label-title, label-cta, initials; frame="false", controls="false", turned; el.turn(true|false), el.replay(); 100% wide, 900px tall unless you size it -->
<liquid-pay></liquid-pay>                 <!-- "liquidconfirm" event; label, cta, width="320", tilt, gyroscope="false"; el.reset(), el.tilt(v) -->
```

With a bundler and no React: `import 'craft-library/elements'`.

## Motion and access

Every item is a real `<button>` with an accessible name; the nav marks the chosen one with `aria-current` and moves with the arrow keys. The card is a `role="button"` that Enter, Space and the arrow keys turn over; the piggy bank and the map pin's map are labelled images; the pin's address is announced as it changes and Confirm is a real button. With `prefers-reduced-motion`, the heart only changes colour, the nav only slides, the magnet stays still, the card swaps faces with a fade, with no entrance and no breathing, the piggy bank stays in place while the coins appear inside it and its eyes close, the thinking balls hold still and only breathe, the panorama skips its opening and starts settled, the map pin appears in place without its flight, the token wheel starts formed and still, and Liquid pay neither stretches nor splits and confirms with a fade. The token wheel's wheel is a `role="button"` that Enter and Space replay, its title is a heading and its round buttons are real buttons with names. Liquid pay's track is a `role="slider"` with its value: the arrow keys move the drop and Enter pays, and its Pay button pays from the keyboard or a screen reader. The panorama's title is a heading; its screens and cursor are decorative.

MIT · [Sara Lobo Library](https://saralobolibrary.com)
