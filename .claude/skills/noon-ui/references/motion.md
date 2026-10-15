# Motion reference

How screens, sheets, toasts and in-screen elements animate in noon Flow Kit. Sources: `src/motion/presets.ts`, `src/motion/transitions.ts`, `src/motion/recipes.tsx`, `src/motion/reducedMotion.ts`, `src/motion/haptics.ts`, `src/motion/custom/index.ts`, `src/foundations/global.css`, `src/kit/Navigator.tsx`, `src/kit/types.ts`, `src/kit/NoonPrototype.tsx`, `src/components/{Lottie,Pressable,Skeleton,Spinner,Toast,QuantityStepper,Segmented,TabBar,WishlistHeart,Button}`.

Purpose-first view of what moves today, with "use for now" per purpose: [motion-guidelines.md](motion-guidelines.md) (provisional).

## 1. Principles

| Principle | What the code does |
|---|---|
| One library | Everything JS-driven uses `motion/react` (`motion.*`, `AnimatePresence`, `useMotionValue`, `useTransform`, `useScroll`, `layoutId`, `layout`). Lotties use `@lottiefiles/dotlottie-react` through `<Lottie>`. |
| One set of values | `src/motion/presets.ts` is "Central motion tokens. Every animation in the kit reads from here". Values mirror bappzaar reanimated (`withTiming` / `withSpring`, `Easing.out(Easing.cubic)` etc.). Exported from the package root (`src/index.ts`: `export * from './motion/presets'`, `export * from './motion/recipes'`). |
| Springs vs tweens | Springs for physical things: press feedback (`spring.press`), sheets/toasts (`spring.sheet`), badges/hearts/counters (`spring.bouncy`), layout/zoom (`spring.gentle`). Tweens (`duration` + `easing`) for fades, tab indicators, screen pushes (`push`/`modal` use a 0.42s `easing.ios` tween, not a spring). |
| 1:1 with the RN app | When porting, copy the source timing exactly and record it in the flow's `tokens.ts` / `MAPPING.md`, even when it is not a preset (e.g. PLP card rise spring 380/39, search spring 280.6/27.14, checkout-alpha 250ms, address modal 330ms, cart snackbar spring 120/16/0.7). The comment on the screen/component names the bappzaar source. |
| Reduced motion | `<NoonPrototype reducedMotion="user" \| "always" \| "never">`, default `'user'` (follow the OS setting; `'never'` for a recorded demo). One switch drives motion/react (`MotionConfig`), CSS (`data-nk-motion="reduce"` + `global.css`), the Navigator, `<Lottie>`, `<Spinner>`, `<Skeleton>` and every flow's autoplay through `useReduceMotion()`. What each kind of motion does: section 7. |
| Navigator owns screen motion | Screens never animate their own entry; the Navigator applies the transition chosen per screen or per navigation (section 3). A screen may animate its content after mount. |

### Which motion for which moment

Decide the motion by **what the element is doing**, then take the values from the presets below. This is the analysis of the noon X Supermall spec (`supermall`, `handoff`) mapped onto the kit; follow it for every new screen.

| The element… | Move with | Fade with | Typical values | Haptic |
|---|---|---|---|---|
| **pushes in** as a page (search, PLP from a tile) | `supermall.springs.move` (= `handoff.spring`), interruptible; page under drifts `handoff.parallax` | — | 0.54s, x 100% → 0 | `tap` on the trigger |
| **arrives** as page content after a push (header, tiles, chip rows, banners) | `y: supermall.reveal.y` → 0, `ease: supermall.ease.soft`, `reveal.move` | `ease.soft`, `reveal.fade` | from 0.4s, 30ms stagger top → bottom; skeleton fades `reveal.skeletonLag` after its part | — |
| **enters as a list** (suggestions, rows, filter chips) | `handoff.spring`, y −20 → 0 (falls in) | `handoff.easeOut`, `handoff.fade.out` (0.183) | 60ms stagger top → bottom (chips left → right) | `tick` as they arrive |
| **updates in place** (row label / photo while typing) | none | cross-fade | 28ms apart (`rows.swapStagger`) | — |
| **leaves** because the user moved on (rows on submit) | y 0 → −12, `handoff.easeInOut`, 0.15s | `handoff.easeInOut`, 0.13s | 25ms stagger **bottom → top**; always faster than its entrance | `tap` on the trigger |
| **leaves** because it no longer applies (backspace) | y −20 → 0 reversed | `handoff.easeInOut` | 40ms stagger bottom → top (`handoff.stagger.out`) | — |
| **is replaced** by the next page (search art when typing starts) | y 0 → 20 (`supermall.dismiss`) | `handoff.easeInOut`, 0.189 | — | — |
| **fades in over** another page (PLP over search) | the search bar lifts 5px with it | `handoff.easeInOut`, `page.fade` 0.3 | 10ms after the last row is gone | — |
| **rises from an edge** (bottom nav, sticky footers) | `handoff.spring`, y = its height → 0 | — | nav 94px, 224ms after the page | — |
| **is a product card** loading | `handoff.spring`, y 16 → 0 | `handoff.easeOut` 0.183; its skeleton fades `cards.skeletonLag` (0.353) after | 60ms stagger in grid order | `land` when the first rows are in |
| **is loading** | shimmer band (`supermall.shimmer`; in code today: `<Skeleton>`'s `nk-shimmer`, 1.2s, 400px gradient), linear, repeat | skeleton out with `handoff.easeInOut` | one 195px band at 17°, 1.867s per pass, 0.2s before the first | — |
| **opens space** in a laid-out list (inline banner) | FLIP: lay out once, then transform the grid, `ease.soft` 0.56 | `ease.soft` 0.3 (front-loaded out: 0.22) | banner settles from −8px / 96%, 40ms after the space | `soft` when it settles |
| **re-skins a list** (filter select / unselect) | cards out 0.18 (`handoff.easeInOut`) → one re-layout → skeletons FLIP 0.42 `ease.soft` → cards back as on load at 0.82 | as cards | `supermall.swap` | `tap` on the pill, `land` on the new list |
| **is selected** (pill, chip, payment row) | no movement; press dip `supermall.press` | fill + stroke cross-fade `ease.soft` 0.26 | — | `tap` |
| **is pressed** (anything tappable) | scale 1 → 0.96 at 30% (back-out) → 1, release `ease.standard`, 0.34s; or the component's `pressScale` token | — | — | `tap` (on release on iOS Safari) |
| **grows from a dot** into a pill / badge | keyframed width (dot → disc → stretch, ≈7% overshoot; at rest ≈1.45s) | text `ease.textIn` 0.2s from 0.7s | then a settle nudge `supermall.nudge` (x only, no rotation) | `pop` with the nudge / at the stretch peak |
| **makes room** for an icon (label shifts, bolt grows) | `supermall.sampled.bolt` 0.667s (8.5% overshoot); icon 100ms behind the label | — | `supermall.bolt` | `tick` as it spins in |
| **drops the whole page** to reveal a sheet (top sheet tease) | `supermall.sampled.xmpDrop` 0.544s, 181px; corners round `sampled.xmpRound` 0.2s | status bar inverts `ease.soft` 0.3 | returns after the sheet on `springs.return` 0.54s; corners flatten 110ms in, `ease.standard` 0.28 | `soft` at the bottom, `land` on return |
| **slides an underline** between tabs | `supermall.ease.tab` (slight overshoot) or the tab bar's `tween('base', 'out')` | — | — | `tick` |
| **rotates on its own** (ticker, marquee subtitles) | ticker steps `ease.sheet` 0.5s every 2.4s; marquees loop 7.2s `ease.standard`, 140ms apart | — | `supermall.ticker` | none (ambient) |
| **returns from a held offset** | `supermall.springs.return` (critically damped, no overshoot) | — | ≈0.54s | `land` |
| **is a modal sheet / drawer** | the Navigator's sheet (`spring.sheet`) | scrim `duration.base` | — | — |
| **celebrates** (success) | existing Lotties / `Confetti` | — | — | `success` |

Animate only `transform` and `opacity` (and `clip-path` / colour cross-fades); lay out once, then move with transforms (FLIP). Every spring movement is interruptible. Under reduced motion, keep fades and drop movement (section 7). Per-flow inventory of what actually moves, with file:line and source: [motion-matrix.md](motion-matrix.md).

## 2. Presets (`src/motion/presets.ts`)

**The motion reference (2026-10-15): ProtoPie "noon X supermall" · recording "Test01"** (cloud.protopie.io/p/041e0f998b5182ed0ca8ce6d/r/8e30fe8e), read from its recorded tracks. Every flow takes its timing from these tokens; screens keep their own choreography (what moves, how far, stagger order). Recorded: page push 382 → 0 while the page under it goes 0 → −200, ≈ 547ms, one spring; rows / blocks travel 20px on it; fades in ≈ 183ms fast-start (≈ 276 long); fades out ≈ 189ms S-curve (≈ 388 long); stagger 60ms in, 40ms out. Kept (no Test01 counterpart): `spring.press`, `spring.bouncy`, `easing.backOut`, `duration.instant`, and the tab-switch page loader (its own 1:1 reference, `pageLoader`).

### easing (cubic-bezier arrays, `as Bezier`; fits of the recorded curves so they also work in CSS — `handoff` keeps the exact sampled ones)

| Key | Value | Source / use |
|---|---|---|
| `easing.out` | `[0, 0.204, 0.316, 1.066]` | Test01 fade-in, fast start (fit ≤ 1.3%); default for UI entering |
| `easing.inOut` | `[0.615, 0.06, 0.34, 0.993]` | Test01 S-curve (fit ≤ 0.2%); cross-fades, card flip |
| `easing.in` | `[0.615, 0.06, 0.34, 0.993]` | elements leaving: Test01 fades out on its S-curve |
| `easing.standard` | `[0.615, 0.06, 0.34, 0.993]` | Test01 S-curve; `fade` transition, alpha pushes |
| `easing.ios` | `[0.338, 0.75, 0.061, 1.109]` | the shape of the Test01 spring (~1% settle, fit ≤ 3.7%) for tweens that move things |
| `easing.backOut` | `[0.34, 1.56, 0.64, 1]` | `Easing.out(Easing.back(1.5))`; playful overshoot (kept) |

### duration (seconds)

| Key | Value | Test01 |
|---|---|---|
| `instant` | `0.1` | (kept) micro state flips |
| `fast` | `0.183` | fade-in |
| `base` | `0.189` | S-curve fade (`fade` transition, scrims, `Segmented` thumb) |
| `medium` | `0.276` | long fade-in (`FadeIn`, collapses) |
| `slow` | `0.388` | long S-curve (`Reveal` on scroll) |
| `slower` | `0.547` | the spring's settle (long reveals, `card-flip`) |

### spring (`satisfies Record<string, Transition>`)

| Key | Value | Use |
|---|---|---|
| `spring.press` | `{ type: 'spring', stiffness: 500, damping: 30, mass: 0.6 }` | `<Pressable>` whileTap (kept) |
| `spring.sheet` | Test01: `{ stiffness: 280.6, damping: 27.14, mass: 1 }` | bottom sheets, `sheet` transition, nav toasts |
| `spring.bouncy` | `{ type: 'spring', stiffness: 400, damping: 14 }` | badges, counters, hearts, `Pop` (kept) |
| `spring.gentle` | Test01: `{ stiffness: 280.6, damping: 27.14, mass: 1 }` | default layout / movement, `zoom`, `scale-up` |

### helpers

| Export | Value |
|---|---|
| `tween(d = 'base', e = 'out')` | returns `{ duration: duration[d], ease: easing[e] }` (used in `src/flows/checkout/AlternatePhoneScreen.tsx`) |
| `pressScale` | `0.96` (bappzaar AnimatedPressable); re-exported as `button.pressScale` token |
| `appleSpring(response, dampingFraction)` | SwiftUI-style spring → `{ type: 'spring', stiffness: ω², damping: 2ζω, mass: 1 }` with ω = 2π / response |
| `sampledEase(samples)` | easing function from evenly spaced samples (a CSS `linear(…)` list), linearly interpolated; motion/react accepts it as `ease` |

### handoff (the search → PLP motion language)

Ported 1:1 from github.com/saswata2002/Brand-Widget-PLP (`app.js`, the ProtoPie Dev Handoff "noon X supermall", scenario Test01, read from its recorded property tracks, not eyeballed). One spring moves everything; fades use two recorded curves.

| Key | Value | Use |
|---|---|---|
| `handoff.spring` | `{ type: 'spring', stiffness: 280.6, damping: 27.14, mass: 1 }` (ω 16.75 rad/s, ζ 0.81, 1.3% overshoot, settled ≈0.5s) | every movement: search push, rows, presearch, chips, cards, bottom nav, grid push |
| `handoff.easeOut` | `sampledEase([...21 samples])`, fast-start ease-out | fades **in**: rows, presearch, cards |
| `handoff.easeInOut` | `sampledEase([...21 samples])`, S-curve | fades **out**, chips in, skeletons, the field fill, `results-fade` |
| `handoff.revealFade` | `sampledEase([...25 samples])` | the brand panel and its header fading in |
| `handoff.fade` | `{ out: 0.183, outLong: 0.276, io: 0.189, ioLong: 0.388, reveal: 0.3 }` | fade lengths (s) |
| `handoff.stagger` | `{ in: 0.06, out: 0.04 }` | in top → bottom, out bottom → top |
| `handoff.travel` | `20` | px a row / block moves while fading |
| `handoff.parallax` | `200 / 382` | push: the page underneath drifts this share of the width (`slide-left` under `x: '-52%'`) |
| `handoff.io` | `[0.45, 0, 0.55, 1]` | symmetric in-out (brand widget title crossfade) |
| `handoff.springs.pager` | `appleSpring(0.34, 0.74)` (≈3% overshoot) | `SpringPager` settle |
| `handoff.springs.morph` | `appleSpring(0.44, 0.94)` (no visible bounce) | brand panel ⇄ selected bar, grid push on select / clear |
| `handoff.springs.pop` | `appleSpring(0.42, 0.52)` (≈15% overshoot) | selected-brand coin and its mark |
| `handoff.springs.card` | `appleSpring(0.5, 0.92)` | brand cards rising into the panel |

```ts
import { handoff } from '../../motion/presets';
<motion.div initial={{ opacity: 0, y: -handoff.travel }} animate={{ opacity: 1, y: 0 }}
  transition={{ y: { ...handoff.spring, delay }, opacity: { duration: handoff.fade.out, ease: handoff.easeOut, delay } }} />
```

### supermall (noon X Supermall spec)

Source: **noon-x-supermall.vercel.app/spec** (Figma `90:45995` "Sas-Motion"; every number read from the prototype's code and frame-checked, 2026-10-08). It extends `handoff`: same spring, same fades. Seconds unless noted.

| Key | Value | Use |
|---|---|---|
| `supermall.ease.soft` | `[0.22, 1, 0.36, 1]` | content reveals after a push, banners, FLIP glides, selection fills, status bar invert |
| `supermall.ease.standard` | `[0.4, 0, 0.2, 1]` | exits that land (corners flattening), looping marquees, press release |
| `supermall.ease.tab` | `[0.3, 1.25, 0.5, 1]` | tab underline (slight overshoot) |
| `supermall.ease.textIn` | `[0.333, 0, 0.833, 1]` | text fading up inside a growing pill |
| `supermall.ease.sheet` | `easing.ios` `[0.32, 0.72, 0, 1]` | ticker steps |
| `supermall.sampled.xmpDrop` | `keyedEase(34 points)` (≈1.3% overshoot) | whole-page drop (top sheet tease) |
| `supermall.sampled.xmpRound` | `keyedEase(13 points)` S-curve | corner rounding as the page drops |
| `supermall.sampled.bolt` | `keyedEase(16 points)` (8.5% overshoot, slow start) | a label making room / an icon growing in |
| `supermall.css.*` | the same three as CSS `linear()` strings | CSS / WAAPI animations |
| `supermall.springs.move` | `handoff.spring` (280.6 / 27.14) | every movement |
| `supermall.springs.return` | `{ stiffness: 240.25, damping: 31, mass: 1 }` (critically damped, ω 15.5, ≈0.54s) | returning from a held offset |
| `supermall.settle(d)` | PP settle length for `d` px: 12 → 0.52 · 16 → 0.54 · 20 → 0.56 · 94 → 0.67 | timeline maths (when the next beat starts) |
| `supermall.push` | `{ duration: 0.54, edge: 24 }` | push length, edge-swipe-back zone (px) |
| `supermall.reveal` | `{ delay: 0.4, y: 12, move: 0.48, fade: 0.26, stagger: 0.03, skeletonLag: 0.16, skeletonFade: 0.2 }` | page content after a push |
| `supermall.rows` | `{ y: 20, delay: 0.11, fadeIn: 0.183, stagger: 0.06, swapStagger: 0.028, exitY: 12, exitMove: 0.15, exitFade: 0.13, exitStagger: 0.025, backspaceStagger: 0.04 }` | list rows / suggestions |
| `supermall.dismiss` | `{ y: 20, fade: 0.189 }` | content replaced by what comes next |
| `supermall.page` | `{ gap: 0.01, fade: 0.3, barLift: 5, shimmerLag: 0.12, navRise: 94, navLag: 0.224, chipsLag: 0.48, cardsLag: 0.68 }` | results page over search |
| `supermall.cards` | `{ y: 16, fadeIn: 0.183, stagger: 0.06, skeletonLag: 0.353, skeletonFade: 0.189 }` | product cards |
| `supermall.shimmer` | `{ band: 195, angle: 17, from: -200, to: 640, duration: 1.867 }` | skeleton shimmer (px, °, s) |
| `supermall.banner` | `{ lag: 0.04, open: 0.56, fade: 0.3, close: 0.52, out: 0.22, y: -8, scale: 0.96 }` | inline banner in a grid |
| `supermall.swap` | `{ out: 0.18, flip: 0.42, reveal: 0.82, fill: 0.26 }` | re-skinning a list |
| `supermall.press` | `{ scale: [1, 0.96, 1], times: [0, 0.3, 1], duration: 0.34 }` | chip / pill press dip |
| `supermall.topSheet` | `{ drop: 181, duration: 0.544, cornerRadius: 20, cornersIn: 0.2, returnAfter: 3.33, back: 0.54, cornersOutLag: 0.11, cornersOut: 0.28, statusBar: 0.3 }` | page drop / return |
| `supermall.bolt` | `{ after: 0.233, duration: 0.667, iconLag: 0.1, shift: 23.5 }` | icon arriving into a label |
| `supermall.nudge` | `{ textAt: 0.7, text: 0.2, settle: 1.45, x: [0, -1.5, 1.3, -0.8, 0.4, 0], times: [...], duration: 0.56 }` | pill grown from a dot, then nudged |
| `supermall.ticker` | `{ every: 2.4, step: 0.5, rowHeight: 34, marquee: 7.2, marqueeStagger: 0.14 }` | ambient rotating stacks |

```ts
import { handoff, supermall } from '../../motion/presets';
// page content after a push
<motion.div initial={{ opacity: 0, y: supermall.reveal.y }} animate={{ opacity: 1, y: 0 }}
  transition={{ delay: supermall.reveal.delay + i * supermall.reveal.stagger,
    y: { duration: supermall.reveal.move, ease: supermall.ease.soft }, opacity: { duration: supermall.reveal.fade, ease: supermall.ease.soft } }} />
// pill press dip
<motion.button whileTap={{ scale: supermall.press.scale }} transition={{ duration: supermall.press.duration, times: supermall.press.times, ease: supermall.ease.standard }} />
// return from a held offset
<motion.div animate={{ y: 0 }} transition={supermall.springs.return} />
```

**In code vs spec only (verified by grep, 2026-10-13).** Used by flows: `supermall.reveal` (orders, search landing), `supermall.press` (orders), `supermall.swap` (plp), `supermall.springs.return` (orders `ImageStack`), `supermall.ease.*`. Defined from the spec but not used by any flow yet: `shimmer`, `topSheet`, `bolt`, `nudge`, `ticker`, `banner`, `sampled.*`, `css.*`, `settle`, `push`, `dismiss`, `rows`, `page`, `cards` (the search / PLP code reads the same numbers from `handoff` + `searchTokens` / `plpTokens`; note the PLP bottom nav rises **88px** (`plpTokens.timeline.navRise`) where `supermall.page.navRise` is 94). Treat the unused ones as reference values; the choreographies below describe the spec, not shipped screens, unless a flow is named.

Helpers added with it: `keyedEase(points)` (uneven-stop `linear()` lists as an easing function) in `presets.ts`; `haptic(kind)` / `haptics` in `src/motion/haptics.ts`.

Component press scales live in tokens (`src/foundations/tokens.ts`): `button.pressScale` 0.96, `button.noonPressScale` 0.98 + `noonPressOpacity` 0.95 + `noonPressDuration` 200 (ms), `pill.pressScale` 0.94, `searchBar.pressScale` 0.98, `tabBar.pressScale` 0.9, `quickAdd.pressScale` 0.9.

```ts
import { duration, easing, spring, tween } from '../../motion/presets';
<motion.div animate={{ opacity: 1 }} transition={tween('fast', 'standard')} />
<motion.span animate={{ scale: 1 }} transition={spring.bouncy} />
```

## 3. Screen transitions (`src/motion/transitions.ts`)

A `ScreenTransition` is `{ initial, animate, exit, under?, transition }`. `under` is applied to the screen below while this one is on top (only for `screen`/`modal` entries; sheets never move the screen below).

### Registered names

| Name | Where | Looks like | Timing |
|---|---|---|---|
| `push` | built-in | slides in from `x: '100%'`; below moves to `x: '-52.36%'` (Test01: 200 of 382), `brightness(0.92)` | Test01 spring (`handoff.spring`, ~1.3% settle, ≈ 0.55s) |
| `fade` | built-in | opacity 0 to 1 | `duration.base`, `easing.standard` |
| `fade-up` | built-in | opacity 0, `y: 20` to 0 | y on the Test01 spring, opacity 183ms `handoff.easeOut` |
| `modal` | built-in | slides up from `y: '100%'`; below `scale: 0.94, borderRadius: 24, brightness(0.85)` | Test01 spring |
| `zoom` | built-in | opacity 0 + `scale: 0.9` to 1 | `spring.gentle` |
| `sheet` | built-in | slides up from `y: '100%'`, nothing under | `spring.sheet` |
| `none` | built-in | no animation | `{ duration: 0 }` |
| `card-flip` | `src/motion/custom/index.ts` | `rotateY: 90` to 0, `transformPerspective: 1200`, exit `rotateY: -90`; under opacity 0.6 | `duration.slower` (0.547) `easing.inOut` |
| `scale-up` | `src/motion/custom/index.ts` | `scale: 0.85, borderRadius: 40` to 1/0; under `scale 0.96, brightness(0.9)` | `spring.gentle` |
| `slide-left` | `src/motion/custom/index.ts` | like `push`, under `x: '-52.36%'` ("the noon search push"); `search/search` and `search/suggestions` use it | `handoff.spring` (280.6 / 27.14 / mass 1) |
| `results-fade` | `src/motion/custom/index.ts` | search → `plp/listing` "in place": the layer appears at once (no layer fade, so the search bar drawn at the same spot on both screens never cross-fades); the PLP fades in only what sits under its bar (`belowBar` in `ListingScreen.tsx`). Preload the target's lazy chunk first (`nav.preload` / `preloadRoutes`, `src/kit/lazyScreen.ts`) or the hand-off shows an empty Suspense frame | enter instant + 0.3s `handoff.easeInOut` content fade; exit fades the layer 0.3s |
| `checkout-alpha` | `src/flows/checkout/transitions.ts` | opacity only (NoonPostOrderLoader to OrderConfirmationV3) | `duration.base` (0.189) S-curve |
| `noonone-overlay` | `src/flows/noonone/transitions.ts` | transparent, static layer; exit fades | 0.189 S-curve |
| `noonone-instant` | `src/flows/noonone/transitions.ts` | no entry animation; exit fades (`animations.push.enabled: false`) | 0 |
| `address-map` | `src/flows/address/transitions.ts` | opacity 0 + `y: -15` to 0 | y Test01 spring, opacity 183ms ease-out |
| `address-search` | `src/flows/address/transitions.ts` | opacity (FadeIn 150) | 0.189 S-curve |
| `address-success` | `src/flows/address/transitions.ts` | fades in; exits opacity 0 + `y: '-100%'` | y Test01 spring, opacity 0.189 S-curve |
| `mb-overlay` | `src/flows/membership/transitions.ts` | transparent static layer; `<VipOverlay>` animates scrim + sheet itself | 0.189 S-curve |
| `mb-modal` | `src/flows/membership/transitions.ts` | iOS modal slide up, nothing underneath moves | Test01 spring |

`getTransition(name)` silently falls back to `push` for unknown names; `listTransitions()` lists all keys.

**Reduced motion.** While motion is reduced the Navigator plays `reducedTransition(t)` (`src/motion/transitions.ts`) instead: every movement key (`x`, `y`, `scale`, `rotate*`, `transformPerspective`, …) is dropped from `initial` / `animate` / `exit` / `under`; opacity, `filter` and colours keep their timing. A transition that only moved (`push`, `modal`, `sheet`, `slide-left`, `mb-modal`, `card-flip` keeps its own fade) becomes a `duration.base` (0.189s) `easing.standard` cross-fade; `none` / `noonone-instant` stay instant. Sheets (`SheetLayer`) fade in place with their scrim (0.189s) instead of rising; grabber drag still works.

### How the Navigator picks one (`makeEntry` in `src/kit/Navigator.tsx`)

**Arming (2026-10-15):** a newly opened screen holds its transition's `initial` pose until it has painted twice (`armed` in the Navigator); then its animation and the covered screen's `under` parallax start together. Heavy screens spend their first frames on layout/paint/decode, and a clock started at mount made the first visible frame jump ~30% into the slide. Keep heavy screens' first render small too: the Storefront PDP defers everything below the fold (`BELOW_FOLD_AFTER_MS` in `src/flows/pdp/DetailScreen.tsx`), the PLP grows its grid in idle batches. Never read layout (`clientWidth`, `getBoundingClientRect`) in a mount `useLayoutEffect` of a pushed screen: it forces a synchronous layout of the whole page in the push frame (use a ResizeObserver).

```
presentation = opts.presentation ?? screen.presentation ?? 'screen'
transition   = opts.transition ?? screen.transition
             ?? (presentation === 'sheet' ? 'sheet' : presentation === 'modal' ? 'modal' : 'push')
```

| Call | Default transition / behaviour |
|---|---|
| `nav.push(route, params?, { transition?, presentation? })` | from the rule above |
| `nav.replace(route, params?, opts?)` | `'fade'` unless overridden; the replaced screen exits instantly (opacity 0, 0.12s) |
| `nav.sheet(route, params?)` | `push` with `presentation: 'sheet'`; no opts argument |
| `nav.back()` | top entry plays its own `exit`; with no history the logical parent (`screen.parent` / `flow.parent` / home) is inserted with `'none'` then popped, so the normal back animation plays |
| `nav.reset(route)` | `'fade'`, instant exit of the old stack |
| `nav.switchTab(tab)` | `'none'`, instant exit |
| `nav.popToRoot()` | normal exits |

The screen below gets `under` with the covering transition's timing; `shown` resets `x: 0, scale: 1, brightness(1), borderRadius: 0`.

### Per screen or per navigation

```ts
// per screen (ScreenDef.transition) — src/flows/cards/index.ts, src/flows/address/index.ts
{ id: 'success', title: 'Card saved', component: AddCardSuccessScreen, transition: 'fade' }
{ id: 'map', ..., presentation: 'modal', transition: 'address-map' }

// per navigation (NavigateOptions)
nav.push('checkout/placing', { fail }, { transition: 'none' });                    // src/flows/checkout/CheckoutScreen.tsx
nav.replace('checkout/confirmation', {}, { transition: 'checkout-alpha' });        // src/flows/checkout/PlacingScreen.tsx
nav.push('account/changeCountry', { country: id }, { presentation: 'modal', transition: 'fade' }); // src/flows/account/CountrySheet.tsx
nav.push(LANDING, params, animatePush ? undefined : { transition: 'noonone-instant' });          // src/flows/noonone/store.ts
```

### Registering a new one

Global ones go in `src/motion/custom/index.ts` (imported by `src/index.ts`). Flow-only ones go in `src/flows/<flow>/transitions.ts`, side-effect imported at the top of the flow's `index.ts` (`import './transitions';`) so the flow stays self-contained. Prefix flow names with the flow id.

```ts
// src/flows/<flow>/transitions.ts
import { registerTransition } from '../../motion/transitions';
import { easing } from '../../motion/presets';

registerTransition('<flow>-alpha', {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  // under: { x: '-28%' },   // optional: screen below while covered
  transition: { duration: 0.25, ease: easing.standard },
});
```

### Page loader (`pageLoader` prop, on in the dev preview)

`<NoonPrototype pageLoader>` (→ `<Navigator pageLoader>`) runs every **tab switch** (`nav.switchTab`, i.e. the tab bar) as the "Page Loader" project's flow, 1:1 (`noon-homepage/app.js`): **page → looping loader Lottie → page**. Push, back, replace, reset and sheets keep their own transitions. Code: `src/kit/pageLoader.tsx` (WAAPI helpers + the overlay), timings and curves in `pageLoader` (`src/motion/presets.ts`); the Lottie is `src/assets/lotties/page-loader.json` (750 × 1624 @ 60fps, 57-frame loop, fitted to the screen).

| t (ms) | What moves |
|---|---|
| 0 | leaving page body: fade 300 → 0, scale 1 → 0.96 over 420 (SOFT); the #F2F3F7 loader layer fades up over 240; the Lottie restarts at frame 0 and loops |
| 60 | Lottie art: fade 300 → 1, scale 0.96 → 1 over 520 (RISE) |
| 60 + 800 (hold) | the stack changes under the loader (instant); art: fade 280 → 0, scale → 0.96 over 420 (SOFT) |
| + 60 | loader layer lifts (fade 300); arriving page body: fade 320 from 0, scale 0.97 → 1 over 520 (RISE) |

SOFT = critically damped (response .36s), RISE = ζ .86 (response .34s, 0.5% overshoot), both CSS `linear()` samples; fades `cubic-bezier(.25,.1,.25,1)` in / `(.4,0,.6,1)` out, each starting from the element's current opacity. Tab root → tab root: a copy of the tab bar sits above the loader (its lens moves to the new tab), as in the reference where the bar never leaves. Another tab tapped on that bar while loading retargets: the latest wins and the loader holds 0.8s more. Only the screen body zooms; the tab bar stays put. Reduced motion: no transforms, fades ≤ 200ms, no delays, same hold. Haptic `soft` when a page lands. With the loader on, `usePageLoader()` is true and Cart / Categories skip their own first-load ProgressLoader (the blue sweep line above the tab bar), since the page loader already covered the wait; their pinned previews (`cart/loading`, `categories?state=loading`) still show it.

Overlay pattern (screen below stays visible, component draws its own scrim/sheet): `presentation: 'modal'` + a transparent static transition (`mb-overlay`, `noonone-overlay`); spread `overlayScreen` from `src/flows/membership/transitions.ts`.

## 4. Recipes (`src/motion/recipes.tsx`)

All import from `'../../motion/recipes'` (or the package root). The general recipes (`FadeIn` … `Float`) are for new/invented UI where no source timing exists; flows port exact source timings inline (see section 5). The handoff recipes (`BlurSwap`, `SkeletonReveal`, `SpringPager`) carry the Brand Widget PLP timings and are used by `src/flows/search` and `src/flows/plp`.

| Component | Props (defaults) | Motion |
|---|---|---|
| `FadeIn` | `delay = 0`, `y = 12`, `...HTMLMotionProps<'div'>` | opacity 0 + `y` to 0; `duration.medium`, `easing.out` |
| `Stagger` | `gap = 0.035`, `y = 16`, `max = 8`, `className`, `style` | wraps each child; first `max` rise `y`; spring 380/39; delay `min(i, max) * gap` (the PLP card rise) |
| `Reveal` | `y = 20` | `whileInView`, `viewport { once: true, amount: 0.3 }`; `duration.slow`, `easing.out` |
| `Pop` | `delay = 0` | `scale 0, opacity 0` to 1; `spring.bouncy`; inline-flex |
| `CountUp` | `to`, `from = 0`, `durationS = 0.9`, `format` (rounded `en-US`) | animates a motion value once in view; `easing.out` |
| `ShimmerText` | `base = palette.kitBlue66`, `highlight = palette.kitBlue91`, `durationS = 4` | gradient sweep clipped to text, infinite linear |
| `Confetti` | `fireKey` (change to fire), `count = 28`, `colors` (yellowColor, primaryBlue, pink600, greenOff, absoluteApricot) | pieces burst up then fall, 1.5s, cleared after 1.6s; absolute centred, z 999 |
| `Float` | `amplitude = 8`, `durationS = 3` | infinite y bob, easeInOut |
| `BlurSwap` | `swapKey` (key it by the value), `delay = 0`, `shift = 5`, `blur = 2`, `className`, `style` | in-place crossfade: old content lifts `shift`px, blurs `blur`px and fades out (0.16s `handoff.easeInOut`); new content rises in (0.26s `handoff.easeOut`, 40ms behind); `AnimatePresence mode="popLayout"`. Search rows while typing |
| `SkeletonReveal` | `skeleton`, `delay = 0`, `loading = false`, `animateIn = true`, `rise = 16`, `skeletonAfter = 0.353`, `style` | content rises `rise`px on `handoff.spring` with the `handoff.easeOut` fade over its own skeleton, which fades `skeletonAfter`s later (S-curve). `loading` dissolves the content back into the skeleton (0.18s); `animateIn={false}` renders settled. The skeleton unmounts once faded and remounts when `loading` turns on. PLP cards |
| `SpringPager` | `step` (px per page), `onPage(page, pages)`, `className`, `style`, `trackClassName`, `trackStyle`, `label` | horizontal pager: 1:1 drag axis-locked after 6px (`touch-action: pan-y`), iOS rubber band `c·(1 − 1/(x·0.55/c + 1))` past the ends, flick (≥ 220 px/s) pages one step, otherwise nearest; the last page is the track end; settles on `handoff.springs.pager` with the release velocity; wheel / trackpad 1:1 then pages; ← → when focused; a drag swallows the click under it. Brand widget rail |

Reduced motion: the declarative recipes (`FadeIn`, `Stagger`, `Reveal`, `Pop`, `Float`, `BlurSwap`, `SkeletonReveal`) need nothing: motion/react drops their movement and keeps the fades (`Float` stands still). The others handle it themselves: `CountUp` sets `to` at once, `ShimmerText` holds the plain `base` colour, `Confetti` doesn't fire, `SpringPager` settles without the spring (drag still 1:1). `useReduceMotion` is re-exported from `recipes.tsx` (and the package root).

```tsx
import { FadeIn, Stagger, Pop, CountUp, Confetti, Reveal, BlurSwap, SkeletonReveal, SpringPager, useReduceMotion } from '../../motion/recipes';
<BlurSwap swapKey={s.text} delay={i * 0.028}><SuggestionRow … /></BlurSwap>
<SkeletonReveal skeleton={<SkeletonCard />} delay={0.68 + i * 0.06}><ProductCard product={p} /></SkeletonReveal>
<SpringPager step={214} trackClassName={styles.track} onPage={(i, n) => setPage(i)}>{cards}</SpringPager>
<Stagger className={styles.grid}>{items.map((p) => <ProductCard key={p.id} product={p} />)}</Stagger>
<FadeIn delay={0.2}><Text variant="section">Saved</Text></FadeIn>
<Pop delay={0.1}><Icon name="check" /></Pop>
<span>{currency}<CountUp to={1299} /></span>
const [k, setK] = useState(0); <Confetti fireKey={k} />  // setK((n) => n + 1) to fire
```

## 5. Patterns from real flows

### Bottom sheets
- Register `presentation: 'sheet'` on the screen (`src/flows/plp/index.ts`, `src/flows/checkout/index.ts`, `src/flows/pdp/index.ts` `added`) and open with `nav.sheet('plp/filters', { facet })` (`src/flows/plp/ListingScreen.tsx`).
- The Navigator's `SheetLayer` does the motion: scrim fade 0.25s (tap dismisses), sheet `y: '100%'` to 0 with `spring.sheet`, drag from the grabber; dismiss when `offset.y > 120` or `velocity.y > 600`; `dragElastic { top: 0.05, bottom: 0.8 }`; max-height 88%, top radius `r24`. `entry.transition` is ignored for sheets.
- Swap sheet content: `nav.replace('pdp/added', params, { presentation: 'sheet' })` (`src/flows/pdp/VariantsSheet.tsx`).
- Close after a selection animates: `setTimeout(nav.back, 180)` (`src/flows/plp/SortSheet.tsx`).

### Address flow: settle → shimmer → reveal

`src/flows/address/SelectScreen.tsx` (`address/select` page and `address/selectSheet` bottom sheet), timing from Test01: the sheet / page rises and settles on the Test01 spring (`LOAD.settle` 0.5s), then the `ListingLoading` skeleton (`Skeleton look="band"`) fades in on the S-curve (`shimmerIn` 0.3s) and shimmers for `hold` (0.65s), then the content resolves component by component out of it — search field, header, each address card, 60ms apart (`handoff.stagger.in`) — fading in (183ms fast-start) while rising 16px on the spring, as the skeleton dissolves (189ms S-curve, 60ms behind). Skeleton and content share one grid cell (`.loadStack`), so nothing jumps. Gotcha: the floating sheet's `AnimatePresence initial={false}` suppresses the first-mount animation of everything inside it, so the revealed content sits in its own `AnimatePresence initial={revealing}`. The rest of the flow (floating sheet rise/height, scrim, tab slider and indicator, list items, nudge, delete modal, search screen, map pin/tooltip/pan, form header) runs on the Test01 spring and fades.

### Toasts

**Switched off in the dev preview** (`<NoonPrototype toasts={false}>` in `src/app/main.tsx`): `nav.toast()` is a no-op and the `Toast` host renders nothing while keeping its timer. A new hand-rolled toast must check `useToastsEnabled()` (from `src/kit/Navigator.tsx`) too.
- Plain message: `nav.toast(msg, { tone: 'success' | 'error', icon, action: { label, onPress }, duration })`. Default 2600ms, max 2 visible, enters `y: 40, scale: 0.96` with `spring.sheet`, `layout`; sits above the tab bar. Examples: `src/flows/checkout/ConfirmationScreen.tsx` (`tone: 'success'`), `src/flows/noonone/screens/OffersOverlayScreen.tsx` (`tone: 'error'`), `src/components/WishlistHeart/WishlistHeart.tsx` (icon).
- Custom-styled self-dismissing toast: `<Toast item duration onHide ...motionProps>`.

```tsx
// src/flows/cart/components/CartSnackBar.tsx — spring from below, 3s
<Toast item={product} duration={3000} onHide={onHide} layerClassName={styles.overlay} className={styles.wrapper}
  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '110%' }}
  transition={{ type: 'spring', damping: 16, stiffness: 120, mass: 0.7 }}>{(p) => ...}</Toast>
// src/flows/checkout/components/VoucherToast.tsx — fade 500ms linear, stays 2s
```

### Press feedback
- `<Pressable>` (`whileTap: { scale }`, `spring.press`, default 0.96; `scale` prop; `asDiv` for nesting). Example: `src/flows/home/HomeScreen.tsx` `<Pressable ... scale={0.98}>`, `src/flows/plp/SortSheet.tsx`.
- `<Button variant="noon*">` presses at scale 0.98 + opacity 0.95, 200ms (ghost/dotted: none).
- Small icon buttons: `whileTap={{ scale: 0.85 }}` (`src/flows/cart/components/QuantitySelector.tsx`, `WishlistHeart`).

### List stagger / entering rows
```tsx
// src/flows/plp/ListingScreen.tsx (values in src/flows/plp/tokens.ts timeline: cardsAt 0.68, cardRise 16, skeletonOutAfter 0.353, animateFirst 8)
<motion.div key={`${epoch}-${p.id}`} layout="position" transition={{ layout: { duration: 0.36, ease: [0.4, 0, 0.2, 1] } }}>
  <SkeletonReveal skeleton={<SkeletonCard />} animateIn={i < T.animateFirst} delay={T.cardsAt + i * handoff.stagger.in}><ProductCard product={p} /></SkeletonReveal>
</motion.div>
```
- Search page skeleton intro (first open, no query): the presearch layer fades in on the S-curve (300ms) as `Skeleton look="band"` blocks over every element below the search bar; at 0.48s the page resolves **component by component**, top → bottom, 120ms apart (`GroupReveal`, `src/flows/search/components/GroupReveal.tsx`): Recent Searches (header, Edit, every tile) · Trending searches (heading + every pill). Inside a component the elements follow each other by a minimal 25ms in reading order (`index`; a recent tile's image + label move as one), so Trending starts while the last recent tiles land. Each element is a soft, bounce-free crossfade: content fades in and comes into focus (480ms on `easing.ios`, blur 4px → 0, filter dropped afterwards) while it settles 6px on a critically damped spring (`appleSpring(0.55, 1)`), and its skeletons dissolve (440ms `easing.inOut`) from 40ms later, so the two overlap the whole way. The search bar stays live. Timings: `searchTokens.skeleton`. Gotcha: `<AnimatePresence initial={false}>` also suppresses the initial animation of every motion element inside it, so RecentSearches turns it on for the intro pass.
- Search suggestions: fixed slots driven by variants (`in` / `out` / `gone` / `fast`), see "Search → results handoff" below (`src/flows/search/SearchScreen.tsx`).
- PLP chips drop from `y: -20` over their own skeleton pill, delay `0.48 + i * 0.06`, `handoff.spring` + S-curve fade (`src/flows/plp/components/NavPills.tsx` `RevealChip`).
- Edit-mode wobble with `repeat: Infinity` (`src/flows/search/components/RecentSearches.tsx`).
- Generic stagger with no source timing: `Stagger` (35ms, spring 380 / 39, first 8).

### Search → results handoff (Brand Widget PLP)

Hand-off details (2026-10-15): the picked text fades in where it stays (`FillCopy`: opacity only, `SEARCH_FILL_FADE` 300ms `easing.out`; the input's padding is pinned to 1px 2px so the copy lands on its text in every engine); on a pick the rows fade out in place (`searchTokens.fastExit`: no travel, no stagger, 180ms) and the PLP push waits for max(rows out, fill fade). Flicker trap: `useFill` derives `filling` in render (a `useEffect` turned the copy on one frame late, so the full text flashed, vanished and faded in), and the leaving rows highlight the typed query (`typed` ref), not the picked one; `SearchInput committed` crossfades the clear (x) into the camera (one end-aligned grid slot, 200ms) so the PLP bar takes over pixel-identical; the PLP grid mounts `animateFirst` cards and adds `renderBatch` per idle slot from `cardsAt + 8 × stagger + settle` (rendering all results at once stalled the hand-off frame).

Source: github.com/saswata2002/Brand-Widget-PLP (`app.js`, sections "Home ⇄ Search", "Search suggestions", "Results", "Brand widget"). Built in `src/flows/search/SearchScreen.tsx` (+ `searchTokens`), `src/flows/plp/ListingScreen.tsx`, `src/flows/plp/components/BrandWidget.tsx`, `NavPills.tsx`, `MarketplaceStrip.tsx` (+ `plpTokens.timeline`, `swap`, `brandWidget`, `ticker`). Every animation starts from the element's current value, so any step can be interrupted.

| Moment | Motion |
|---|---|
| Push to search | `slide-left`: page in from the right on `handoff.spring`, the page under drifts `x: '-52%'` (200/382), no dimming |
| Presearch on push | rises 20px while fading in, 124ms after touch-up (`searchTokens.presearchPushDelay`) |
| First keystroke | presearch drops 20px, S-curve fade 189ms; 110ms later (`rowEnterDelay`) rows fall from `y: -20` TOP → BOTTOM 60ms apart, y on `handoff.spring`, opacity 183ms `handoff.easeOut` |
| Still typing | a burst of keys within 60ms (`settleMs`) lands as one change; a row whose suggestion changed crossfades in place (`BlurSwap`: lift 5px, blur 2px, 160ms out / 260ms in, 40ms lag), changed rows cascade 28ms apart; only the bold part moving updates in place; spare rows lift 10px and fade 200ms; new rows fall in after the ones already up |
| No match / field cleared | rows leave BOTTOM → TOP 40ms apart, lifting 20px on the spring with the S-curve fade; presearch comes back 40ms after the last row has left (`presearchGap`) |
| Fill arrow / pick | the field fills: what was typed holds, the rest fades in on the S-curve over 320ms (`SearchInput fill={{ from, key }}`) |
| Pick → results | rows leave fast: bottom → top 25ms apart, 130ms fade, 12px lift in 150ms (`fastExit`); the keyboard drops; 10ms after the last row is gone the PLP pushes with `results-fade` (300ms S-curve) and the search bar never moves (both screens draw `SearchInput` at `calc(inset + 4px)` / 16px) |
| PLP timeline (t = page appears) | +224ms bottom nav rises 88px on the spring · +480ms chips drop 20px, 60ms apart, their skeletons fading with them · +680ms cards rise 16px out of their skeletons 60ms apart (ease-out fade), each skeleton fades 353ms after its card · first 8 only |
| Brand panel reveal | when the on-screen cards have landed: the box jumps 0 → 459 and the grid slides from where it was on `handoff.spring` (a transform on an opaque grid, never a height animation on the cards); panel scales 0.9 → 1 and rises 20px on the same spring, fades in from 17ms (300ms `revealFade`); header rises 10px at 33ms (fade from 50ms); first 3 cards rise 16px + scale 0.97 → 1 + blur 4 → 0, 80ms + 40ms apart, on `springs.card`, fade 340ms `easing.ios` |
| Brand rail | `SpringPager` (step 214 = 204 card + 10 gap); "1 of 14" follows the page |
| View {brand} | panel 450 → 60 and box 459 → 75 on `springs.morph`, grid rides up; title glides +44 / −2.5 and shrinks 17 → 14px while crossfading into "{brand} selected" (160 / 200ms `handoff.io`); "1 of 14" fades 120ms; coin pops scale 0 → 1 on `springs.pop` at +150ms, its mark 60ms later; the tapped card shrinks to 0.92 toward the coin (220ms), the rest sink 10px / 0.96 (170ms); "Showing all …" rises 4px at +140ms, Clear slides 6px at +180ms |
| Grid swap (brand / filter) | cards dissolve into their skeletons (180ms), hold, and at 820ms the new list rises with the first load's stagger (`plpTokens.swap`) |
| Clear | the reverse: morph back to 450 / 459, coin shrinks to 0.4 (160ms ease-in), cards rise back in from 90ms |
| Back from results | `results-fade` out; the search rows fall back in (110ms) and the field is focused |
| Marketplace ticker | each tab's subtitle lines A → B → A tick up 20px every 7.2s (`times [0, .4, .48, .88, .96, 1]`, `[0.65, 0, 0.35, 1]`), 140ms apart per tab from 1.2s; the selected bar slides with `layoutId` |

The reference also runs haptics (iOS switch-tick / Vibration API) and drops blur filters on Android; the kit leaves both out.

### noon X Supermall choreographies (scene by scene)

Exact timelines from the spec (ms from the trigger). Reuse them as the template for any screen with the same moment.

**Home drop · top sheet** (tap Home): page `y 0 → 181` on `sampled.xmpDrop` 544 · corner masks ride along, corners `0 → 20` radius in 200 (`xmpRound`) · content lifts −30.9px inside · top wash scales Y 100 → 128.45% · top-sheet Lottie plays 3.5s · status bar inverts 300 (`ease.soft`) · `soft` haptic at 170. Return at 3333 (sheet frame 200): everything back on `springs.return` 540, corners flatten from +110 over 280 (`ease.standard`), `land` at +280. Header bolt 233ms after the return starts: label shifts 23.5px on `sampled.bolt` 667, bolt scales 0 → 1 100ms behind, `tick`. "190m away" pill (first return only, at +1392): width grows from a dot over the FANudge keyframes (rest at 1450), text fades in at +700 for 200 (`ease.textIn`), then the x-only nudge (560) with `pop`. Ambient ticker: one 34px row every 2.4s, 500 on `ease.sheet`.

**Search push** (tap search bar): `tap` · search page `x 375 → 0` on `handoff.spring` (≈540, rAF-driven, interruptible, edge swipe 24px drives it back) · home drifts to −196.3px (parallax 200/382) and stops rendering once covered · skeleton shimmer from 200 · content reveal from 400: 11 parts, `y 12 → 0` 480 + opacity 260 on `ease.soft`, 30ms apart · each skeleton fades 160ms after its part (200, `handoff.easeInOut`); typing early drops the skeleton at once.

**Suggestions** (first keystroke): search content `y 0 → 20` on the spring + fade 189 (`easeInOut`) · from 110: 5 rows fall `y −20 → 0` on the spring + opacity 183 (`easeOut`), 60ms apart top → bottom, `tick` · typing updates rows in place (cross-fade, 28ms apart) · no match → rows leave bottom → top, 40ms apart.

**PLP load** (tap a suggestion): `tap` · rows leave `y 0 → −12` 150 + fade 130 (`easeInOut`), 25ms apart bottom → top (done by 260) · PLP fades in at 260 for 300 (`easeInOut`), the search bar lifts 5px with it · shimmer from 380 · bottom nav rises 94px from 484 on the spring · chips fall in from 740, 60ms apart left → right, their skeletons fade with them · cards from 940: `y 16 → 0` on the spring + fade 183, 60ms apart in grid order, skeleton out 353ms after each card · "landed" ≈1663 (first 4 cards in) → `land`.

**Inline banner + pill** (on landed): the 78px space opens at once and the grid glides `−78 → 0` (FLIP, 560, `ease.soft`) · banner pill settles from `y −8`, scale 96%, 40ms later; fade 300 · `soft` at 340 · leaves at 3840: fade 220 (front-loaded), `y 0 → −8`, scale → 96%, grid glides up 520 · the "90 mins" filter pill grows from a dot (1153, halved overshoot) while the following chips slide along its right edge (8px gap) · label fades in +290 for 260 (`ease.textIn`) · `pop` at the stretch peak.

**Select / unselect filter** (tap the pill): `tap` · fill + stroke cross-fade 260 (`ease.soft`) · press dip 340 · cards fade out 180 (`easeInOut`) while skeletons fade in 183 and the shimmer restarts · one re-layout, then skeletons FLIP to their new slots 420 (`ease.soft`) · new cards arrive at 820 exactly as on load · `land`.

### Haptics

`haptic(kind)` from `src/motion/haptics.ts` (Android `navigator.vibrate`; iOS kinds listed for native shells). Haptics only accompany a visible change, never replace it.

| Kind | iOS | Android (ms) | Use for |
|---|---|---|---|
| `tap` | impact light | 12 | taps on tabs, search bar, rows, pills (on iPhone Safari it can only fire inside the touch) |
| `tick` | selection | 8 | rows arriving, a tab underline moving, an icon spinning in |
| `snap` | impact medium 0.8 | 20 | snapping to a detent / page |
| `edge` | impact rigid 0.6 | 15 | hitting a limit (stepper max, end of a rail) |
| `soft` | impact soft 0.5 | 10 | something settling: a drop reaching bottom, a banner in place |
| `land` | impact soft 0.4 | 10 | a list or card landing, a page returning home |
| `pop` | impact medium 0.7 | 18 | the peak of a stretch, a nudge, a badge appearing |
| `success` | notification success | 14 · 50 · 22 | order placed, payment done |
| `error` | notification error | 45 · 40 · 45 · 40 · 45 | failed payment, invalid code |

### Success / celebration Lotties
`<Lottie name | src loop={false} autoplay={true} speed={1} size style onComplete onLoad reducedMotionFrame="auto">`. Built-in names (`src/assets/lotties`): `atcCheck`, `boxAnim`, `favourite`, `orderConf`, `orderConfirmedCheck`, `reviewCheck`, `sliderArrow`, `starLoading`. Flow Lotties live in `src/assets/<flow>/*.lottie` and go in via `src`.

```tsx
// src/flows/checkout/PlacingScreen.tsx — loop loader, cross-fade to tick, navigate when tick ends
<motion.div animate={{ opacity: showTick ? 0 : 1 }} transition={{ duration: 0.5, ease: easing.inOut }}>
  <Lottie name="boxAnim" loop style={{ width: '100%', height: '100%' }} />
</motion.div>
{showTick && <Lottie name="orderConf" onComplete={() => nav.replace('checkout/confirmation', {}, { transition: 'checkout-alpha' })} />}
```
- `src/flows/pdp/AddedSheet.tsx`: `atcCheck` over the product image, row slides from x+150 (`pdpTokens.quickCart`).
- `src/flows/cards/AddCardSuccessScreen.tsx`: `src={cardsImages.saveCardLottie}`, `onComplete={finish}` goes back.
- `src/flows/returns/ReturnDetailsScreen.tsx`: `<Lottie name="orderConfirmedCheck" size={120} />`.
- Need segments, tinting, `layout` or the player instance: use `DotLottieReact` directly (`src/flows/checkout/components/SlideButton.tsx`, `src/flows/noonone/screens/FamilyPlansScreen.tsx`) and, if it autoplays, give it the kit's reduced-motion handling: `const rm = useLottieReducedMotion({ loop, onComplete, poster })` from `src/components/Lottie/Lottie.tsx`, then `autoplay={rm.autoplay}` and `rm.attach(d)` in `dotLottieRefCallback` (`LottieBox` in `src/flows/noonone/components/landing/modules.tsx`, `src/flows/account/ChangeLocaleScreen.tsx`, `src/flows/address/SuccessScreen.tsx`). Players you drive yourself (segments on a state change, scrubbed by a drag) instead jump to the resting frame under `useReduceMotion()` (both `FamilyPlansScreen`s).
- Hearts: every wishlist heart (`WishlistHeart`, `SkuCard`, Storefront PDP `SfHeader` / `SfRecommendations`) renders `LikeHeart`, which plays the `like` Lottie (Wishlist Revamp `Like_Lottie_2`, 63 frames @ 60fps) on favourite; un-favourite and reduced motion jump to the resting frame (0 outline / last filled). The canvas is 1.95× the heart size so the ripple spills past the circle.

### Loading states
- Skeleton under each card (`SkeletonReveal`), same footprint as the real card (`src/flows/plp/components/SkeletonCard.tsx`, `ListingScreen.tsx`); chip skeleton pills in `RevealChip`. `<Skeleton width height radius>` uses the global `nk-shimmer` 1.2s keyframe; also `src/flows/checkout/components/EarnCallout.tsx`.
- `<Spinner>` presets (doc comment in `src/components/Spinner/Spinner.tsx`): ring default 0.8s; `variant="ios"` (`src/flows/address/components/select.tsx`); inline cart `size={14} thickness={14 / 9} duration={0.7}` (`src/flows/cart/components/QuantitySelector.tsx`). In buttons use `<Button loading>`.
- Indeterminate bar: `initial={{ x: '-100%' }} animate={{ x: '100%' }}` 0.8s `repeat: Infinity` (`src/flows/cart/CartScreen.tsx` `CartLoading`).
- Shimmer sweeps on tags/cards: `src/flows/checkout/components/CheckoutTag.tsx` (`repeat: Infinity, repeatDelay: 1.5`), `src/flows/cards/components/PaymentCard.tsx`.

### Counters / steppers / badges
```tsx
// src/components/QuantityStepper/QuantityStepper.tsx (also cart QuantitySelector: y 8 to 0, exit y -8, 0.16s)
<AnimatePresence mode="popLayout" initial={false}>
  <motion.span key={value} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.12 }}>{value}</motion.span>
</AnimatePresence>
```
- Cart badge: the native UITabBarItem badge, no animation (`src/components/TabBar/TabBar.tsx`).
- `mode="popLayout"` for swaps is also used in `src/flows/wishlist/components/WishlistHeader.tsx`, `src/flows/cart/components/CartItem.tsx`, `src/flows/categories/components/CollapsibleBannerModule.tsx`.
- Free-delivery progress: spring width fill + a skewed shimmer sweep (`src/flows/cart/components/GroupProgressBar.tsx`, values in `cartTokens.progress`). Free-gift bar: width 0 → pct over 0.6s (`src/flows/cart/components/FreeGifts.tsx`).
- Error shake: `animate={{ x: [0, -6, 6, -4, 4, 0] }}` over 0.35s, keyed so it replays (`src/flows/cart/components/CouponInput.tsx`).

### Rotating strips and autoplay media
- Rotating promo strip with an "n/N" pager (Homepage 2025 cashback ticker): swap the message with `AnimatePresence mode="popLayout"` (`y` 8 → 0, exit −8, `tween('fast', 'out')`) on an interval kept in the flow's plain TS tokens; the active dot widens like `PageController` in `src/flows/pdp/components/storefront/SfGallery.tsx`.
- Sponsored video tile: native `<video muted autoPlay loop playsInline>`; swap the mute icon with `Pop`.

### Collapsibles and expanders
- Chevron `animate={{ rotate: open ? 180 : 0 }}` + `AnimatePresence initial={false}` around a `motion.div` going height 0 → `'auto'` with opacity, `overflow: hidden` (checkout lanes "Need it today?": `src/flows/checkout/components/CheckoutShipment.tsx`). Cart item rows enter and leave the same way in 0.3s (`src/flows/cart/components/CartGroup.tsx`, unavailable items in `InactiveGroup.tsx`). Never a CSS keyframe.
- Capped rich content with "View More" (PDP A+ block): animate height from the cap to `'auto'` with `tween('medium', 'out')` and fade the bottom gradient out.

### Tab switches / selection indicators
- Shared element: `layoutId` (`src/components/Segmented/Segmented.tsx`: `layoutId={\`seg-${id}\`}`, `duration.base`, `easing.out`; `src/flows/plp/SortSheet.tsx`: `layoutId="sort-radio"`).
- Sliding pill: `animate={{ x: selected * tabWidth }}` 0.3s `[0.215, 0.61, 0.355, 1]` (= `easing.out`) (`src/flows/address/components/select.tsx` `TabSwitcher`); pane slider `animate={{ x: -tab * TAB_PANE_WIDTH }}` (`src/flows/address/SelectScreen.tsx`); `src/flows/noonone/screens/PlanSelectScreen.tsx` (`initial={false}`, `easing.out`).
- Bottom tabs (`src/components/TabBar/TabBar.tsx`): `nav.switchTab()` swaps screens with no transition and, like bappzaar's native UITabBar, the bar just swaps the selected icon file and label colour — no indicator, no press scale, no pop.
- Icon tab strip over a rail (Homepage 2025 "Recommended for you"): underline as a `layoutId` with `duration.base` + `easing.out`; swap the rail with `AnimatePresence mode="wait"` (opacity, `duration.fast`) and re-enter the cards with `Stagger`. The strip sticks with CSS `position: sticky` inside `.nk-scroll`, no JS.
- Selection swaps (checkout payment rows, delivery-instruction cards) are instant fill / border changes with no layout animation; the credits `Switch` knob uses `spring.press` (`src/flows/checkout/components/PaymentMethods.tsx`).

### Floating buttons that fold on scroll
`NeedHelpButton` (home, account): a threshold boolean from `<Screen onScroll>` (`y > 24`) drives `collapsed`; the pill's width animates to `'auto'` / the 48 circle on `appleSpring(0.38, 0.9)` while the label leaves first (`duration.fast`, `easing.in`, opacity + x 8 + blur 3) and returns 80ms behind the width (`duration.base`, `easing.out`); the icon pops on `spring.bouncy` at every change (key it by a change counter so the first render doesn't animate). Anchor the dock on the edge it shrinks toward (`right`), pass it as `<Screen overlay>`.

### Headers that react to scroll
`<Screen onScroll={(y) => ...}>` gives the scroll offset.
```tsx
// src/flows/checkout/CheckoutScreen.tsx + components/CheckoutHeader.tsx — continuous, no re-render
const scrollY = useMotionValue(0);
<Screen header={<CheckoutHeader scrollY={scrollY} ... />} onScroll={(y) => scrollY.set(y)}>
const bg = useTransform(scrollY, [0, 50], [checkoutJs.headerFrom, checkoutJs.headerTo]);
const radius = useTransform(scrollY, [0, 50], [0, 12]);
<motion.div style={{ backgroundColor: bg }} />
```
- Threshold boolean: `src/flows/home/HomeScreen.tsx` (`setCollapsed(y >= 100)`, collapse `height: 0` 0.3s `easing.out`).
- Hide on scroll down / show on scroll up (bappzaar `ScrollVisibilityProvider` for the bottom tab bar + `HidableView` for a header block): `usePlpScrollStates(scrollRef, isTop)` in `src/flows/plp/scrollStates.ts` (`src/flows/plp/ListingScreen.tsx`). Pass `<Screen ref onScroll={states.onScroll}>`; it writes 0 → 1 motion values that CSS turns into transforms (`style={{ '--plp-tab-hide': states.tabHide }}` → `translateY(calc(var(--plp-tab-hide) * (tab bar + inset)))`; the header layer hangs `top: 100%` under the fixed bar with `overflow: hidden` and slides `-100%`). Tab bar 0.15s `duration.fast` ease-out [0, 0, 0.58, 1]; header 0.3s `duration.medium` RN `inOut(ease)`; thresholds in `plpTokens.scroll`, the mapping in `src/flows/plp/MAPPING.md`. Tab bar only (any screen with its own tab bar, e.g. the PDP): `useTabBarScrollHide(scrollRef, isTop)` from `src/kit/tabBarScroll.ts` (same controller and `tabBarScroll` values) → `{ tabHide, onScroll, reveal }`; a sticky footer that sits on the tab bar follows it (`src/flows/pdp/pdp.module.css` `.stickyBar`). PDP scroll mapping (gallery pin + shrink, header fade, back to top, accordion +120): `src/flows/pdp/MAPPING.md` → PDP scroll.
- Threshold from a motion value: `useMotionValueEvent(scrollY, 'change', ...)` (`src/flows/checkout/ConfirmationScreen.tsx`).
- Footer that appears once an in-page element scrolls away (PDP successor chin under the out-of-stock banner): watch the element with `useInView(ref, { root: scrollRef })`, or use `useMotionValueEvent(scrollY, 'change', …)` as `src/flows/pdp/DetailScreen.tsx` does for `showTop`; animate the footer with `AnimatePresence` + `y: '100%'` → 0 on `spring.sheet`.
- Own scroll container: `useScroll({ container: scrollRef })` + `useTransform(..., { clamp: true })` (`src/flows/noonone/screens/BundleScreen.tsx`); clamped maps in `src/flows/cards/components/Headers.tsx`.

### Full-screen timelines
Chain `setTimeout`s in one effect, clear them on unmount, then navigate (`src/flows/checkout/PlacingScreen.tsx`: messages at 900/1300ms, success, tick after 1500ms). Guard `onComplete` with a `done` ref so it navigates once.

## 6. Rules

- Entrances use the move spring and a fast-start fade; exits are shorter, use the S-curve and run bottom → top. A new beat starts when the previous one *visually lands* (use `supermall.settle(d)`), not when its spring is fully at rest.
- Skeletons fade **after** the content they cover has started (`reveal.skeletonLag`, `cards.skeletonLag`), never before, so nothing flashes empty.
- Lay out once, then animate transforms (FLIP) for anything that changes size or position in a list; never animate `top` / `height` of many items.
- Haptics: one per beat, from the table above, only alongside a visible change.
- Use `easing` / `duration` / `spring` / `tween` / `pressScale` from `presets.ts` for anything not ported from a source. Do not write a literal that equals a preset (`[0.215, 0.61, 0.355, 1]` is `easing.out`).
- Ported timings that differ from presets go in the flow's `tokens.ts` with a comment naming the bappzaar source, not inline magic numbers.
- No ad-hoc CSS `@keyframes` or CSS `transition` for things motion/react or a component already covers (Skeleton, Spinner, Toast, Pressable, Lottie). Existing exceptions are documented in MAPPING (`catLoaderSweep` in categories, `pdpAiShimmer` in pdp).
- Never animate screen entry inside a screen; set `ScreenDef.transition` or pass `{ transition }`. Register new transitions with `registerTransition`, flow-local in `src/flows/<flow>/transitions.ts`.
- Tappable things use `<Pressable>` / `<Button>` so press feel is shared; do not invent other scales without a source.
- Sheets are `presentation: 'sheet'` + `nav.sheet()`; do not build your own scrim/drag unless porting an overlay that needs it (`mb-overlay` / `noonone-overlay` pattern).
- Simple messages use `nav.toast()`; custom snackbars use `<Toast>`.
- Respect reduced motion (section 7): read it with `useReduceMotion()` (never motion's `useReducedMotion`, which ignores the `reducedMotion` prop); keep meaning in opacity / state, not only in movement; infinite loops (`repeat: Infinity`, looping Lotties) only for loaders / shimmers, and every `setInterval` autoplay, imperative `animate()` or rAF loop checks `useReduceMotion()`.
- Use `AnimatePresence initial={false}` for values that change after mount (counters, swaps) so the first render does not animate; key the animated child by the value.
- Stagger only the first visible items (PLP: 8) and keep stagger gaps 35-60ms.
- Search, suggestions, results and anything that should feel like them use `handoff` (one spring + the recorded fades) and its recipes; don't mix `easing.*` tweens into that choreography.
- Scroll-driven state (header collapse, floating pills) lives at the screen level; memoise the feed under it so a threshold flip re-renders only what depends on it (`HomeFeed`, `AccountBody`). Never promote many items to their own layers (`will-change` on every tile measured slower); `Screen`'s scroll content already has `contain: paint` + `isolation: isolate`. Below-the-fold images: `loading="lazy" decoding="async"`.
- Animate a list that pushes content down with a transform on an opaque layer (`BrandWidget` `pushGrid`), not a height animation that re-lays out the cards.
- Clean up timers and `animate()` controls in effect cleanups.

## 7. Reduced motion

One answer for the whole prototype: `<NoonPrototype reducedMotion>` (default `'user'` = the OS `prefers-reduced-motion`; `'always'`; `'never'`). It sets motion/react's `<MotionConfig reducedMotion>`, and while motion is reduced it marks its root `data-nk-motion="reduce"` (a `display: contents` wrapper). Read it anywhere with `useReduceMotion()` (`src/motion/reducedMotion.ts`, re-exported from `src/motion/recipes.tsx`); it returns `false` outside `<NoonPrototype>`, like motion/react. Do **not** use motion's `useReducedMotion()` (OS only, ignores the prop).

What each kind of motion does under reduce (verified in Chromium with `page.emulateMedia({ reducedMotion: 'reduce' })`, 2026-10-13):

| Kind | Under reduced motion | Where it is handled |
|---|---|---|
| Declarative `motion.*` (`animate`, variants, `layout`, `whileTap`) | movement (`x y z scale rotate* skew*`, `top left right bottom width height`, layout) is instant; opacity, colour, `filter`, `backgroundPosition`, `borderRadius` keep their timing, **including `repeat: Infinity` loops of those** | motion/react `MotionConfig` (motion-dom `positionalKeys`) |
| Screen transitions | movement dropped; slide-only transitions (`push`, `modal`, `slide-left`, `mb-modal`) become a 0.25s cross-fade; fades keep their timing; `none` stays instant | `reducedTransition()` in `src/motion/transitions.ts`, used by `src/kit/Navigator.tsx` |
| Sheets (`presentation: 'sheet'`) | fade in place with the scrim (0.25s `easing.standard`) instead of rising; drag-to-dismiss unchanged | `SheetLayer` in `src/kit/Navigator.tsx` |
| Toasts | appear without the rise / scale; fade on `spring.sheet` | `MotionConfig` |
| CSS `@keyframes` / `transition` | jump to their end state: `animation-duration` / `transition-duration` 0.01ms, 1 iteration, no delay (`transitionend` / `animationend` still fire, state-driven visibility still lands) | `[data-nk-motion='reduce']` rule in `src/foundations/global.css`; opt an element out with `.nk-motion-keep` |
| `<Skeleton>` | a still block in the base grey (`shimmerGray`), no sweep | `src/components/Skeleton/Skeleton.tsx` |
| `<Spinner>` | no rotation: the ring holds its arc, the iOS petals hold one frame of their fade; both pulse opacity 1 ↔ 0.45 (0.9s alternate) so loading still reads; `role="status"` + `aria-label` unchanged | `src/components/Spinner/Spinner.{tsx,module.css}` (`.nk-motion-keep`) |
| Other loaders | cart `ProgressLoader` bar holds in place and pulses opacity instead of sweeping; checkout / noon One `Reloader` draws nothing (no dot loaders; invisible tap-blocker only) | `src/flows/cart/CartScreen.tsx` `CartLoading`; `MotionConfig` |
| `<Lottie>` / `LottieBox` / `useLottieReducedMotion` | no autoplay. Holds one frame: `reducedMotionFrame` / `poster` (share 0–1), or `'auto'`: samples the last frame (one-shot) or the middle (loop) and a few earlier ones, and holds the one that shows the most (many one-shots end blank). A one-shot still calls `onComplete` after its normal length, so flows that navigate on completion keep their timing (checkout placing → confirmation verified: same 5s) | `src/components/Lottie/Lottie.tsx` |
| Lottie segments driven by state (family plans header) | jump to the resting frame | the two `FamilyPlansScreen.tsx` |
| Auto-advancing carousels, tickers, nudges, rotating stacks | stop: the first item stays; swiping / tapping still works | each component checks `useReduceMotion()` (list in motion-matrix.md) |
| Marquees / rAF loops / imperative `animate()` loops | stop (`EasyBannerScroller`, checkout confirmation `StackedImageCarousel`, slide-to-pay shimmer + 4s nudge, cart progress shimmer) | each component |
| Imperative `animate()` on a gesture / tap (pager settle, carousel snap, tab indicator) | lands at once (`duration: 0` or `mv.set`) | `SpringPager`, home `BannerCarousel`, plp `MarketplaceStrip`, noon One `Slider`; `scrollStates.ts` / `tabBarScroll.ts` already did |
| Scroll-linked motion (`useScroll` / `useTransform` headers, gallery pin) | unchanged: it follows the user's own scroll, not an animation | — |
| Odometers / count-ups / reveals | `CountUp` lands on `to`; checkout noon One CTA reveal is skipped (the settled CTA shows at once) | `recipes.tsx`; `src/flows/checkout/components/NoonOneSection.tsx` |
| Celebrations | `Confetti` doesn't fire; success Lotties hold their poster frame | `recipes.tsx`; `<Lottie>` |
| Autoplay video | doesn't autoplay (poster shows) | home `BrandAdModule`, noon One `npModules` video card |
| Haptics | unchanged (they are not motion; they already only accompany a visible change) | — |
| Countdown text (deal timers, OTP resend) | unchanged (state, not motion) | — |

Known gaps (outside the reduced-motion pass): `src/components/SearchBar/SearchBar.tsx` rotating placeholder words and `src/components/ProductBoxVertical` nudge ticker still auto-rotate (their y movement is dropped); `src/kit/tabBarScroll.ts` still reads motion's `useReducedMotion` (OS only); checkout `VoucherToast` confetti is a GIF.

### Motion checklist for a new screen

1. Entry is the Navigator's job: set `ScreenDef.transition` / `presentation` (or `{ transition }` on the call); the screen never animates its own entry. Sheets are `presentation: 'sheet'`.
2. Values come from `presets.ts` (or the flow's `tokens.ts` with a comment naming the bappzaar / Figma source); no literal that equals a preset.
3. Movement is `transform` / `opacity`; anything that grows or reorders uses FLIP or a transform on an opaque layer.
4. Every animation can be interrupted (motion values start from the current value); timers and `animate()` controls are cleaned up in effect cleanups.
5. Press feedback through `<Pressable>` / `<Button>`; a haptic only with a visible change (one per beat).
6. Reduced motion: anything motion/react can't reduce for you (`setInterval` autoplay, imperative `animate()`, rAF, looping opacity / background / filter, `<video autoPlay>`, direct `DotLottieReact`) checks `useReduceMotion()`; loaders keep communicating (pulse, held frame); a Lottie that ends blank gets a `reducedMotionFrame`.
7. Verify both ways: `page.emulateMedia({ reducedMotion: 'reduce' })` — nothing loops or auto-advances, content is visible, timed flows still finish — and `'no-preference'` — unchanged.
8. Add the screen's interactions to [motion-matrix.md](motion-matrix.md) with their source (`bappzaar` / `figma` / `kit` / `unverified`).
