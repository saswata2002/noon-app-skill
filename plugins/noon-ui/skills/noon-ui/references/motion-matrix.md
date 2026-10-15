# Motion matrix (per flow)

What actually moves in each registered flow (`src/flows/index.ts`, 18 flows), with the code that does it and the reference it came from. Companion to [motion.md](references/motion.md) (presets, transitions, recipes, rules, reduced motion). Built from the code on 2026-10-13: every `Code` cell was resolved with grep against the working tree; re-run the grep after edits, line numbers drift.

**Source labels.** `bappzaar` = the flow's MAPPING.md / FIGMA-MAPPING.md or a code / token comment names the bappzaar component and value (cited). `figma` = a Figma node or a named design / prototype reference (Homepage Revamp 2025, Cart 2.0, Checkout 2.0, Storefront PDP, Brand-Widget-PLP ProtoPie handoff, R&R 2.0 prototype) is cited. `kit` = a kit preset or convention with no outside reference (Pressable, Navigator sheet / push, `supermall.reveal` reuse). `unverified` = no authoritative reference found in the repo: the value may be right, but nothing proves it. Exceptions to motion.md's rules are listed only where a cited reference supports them.

**Reduced motion column.** `MC` = handled by motion/react `MotionConfig` (movement instant, fades kept). `Nav` = Navigator `reducedTransition` / sheet fade. `CSS` = `global.css` rule. `hook` = the component checks `useReduceMotion()`. `—` = nothing to reduce (scroll-linked or user-driven). Full rules: motion.md section 7.

**Shared values.** Pressable `whileTap` scale 0.96 (or `scale` prop) on `spring.press` 500/30/0.6. Navigator sheet: scrim 0.25s, panel `y 100% → 0` on `spring.sheet` 260/30/1, drag from the grabber, dismiss at offset > 120px or velocity > 600px/s, scrim tap. `push` 0.42s `easing.ios`, under `x −28%` + `brightness(0.92)`. `handoff.spring` 280.6/27.14/1. `supermall.reveal`: delay 0.4, `y 12 → 0` 0.48s + fade 0.26s on `ease.soft` [0.22,1,0.36,1], 30ms stagger.

Coverage: **in depth** home, search, plp, pdp, cart, checkout, noonone, orders. **Summarised** categories, deals, returns, reviews, account, wishlist, address, cards, membership.

## home (`home/home`, `home/classic`)

Rendered on `home/home`: HomeHeader, SnappedBannerCarousel, EidBanners, BannerScroller, ProductCarousel, EasyBannerScroller, MegaDeals, BannerCarousel. Not imported by any screen (dead, reduced-motion fixed anyway): PromoTicker, HeroBanners, BrandAdModule, DepartmentTabs, RecommendedRail.

| Interaction | Trigger | Motion (entry → exit · timing · easing / spring) | Gesture · interruption · dismissal | State | Reduced | Code | Source |
|---|---|---|---|---|---|---|---|
| Header top padding collapse | scroll y ≥ 100 | paddingTop shrinks · 0.3s · [0.5,1,0.89,1] | scroll back < 100 reverses; motion starts from current value | `collapsed` | MC | `home/components/HomeHeader.tsx:36` | bappzaar: FIGMA-MAPPING.md "NoonHomeToggle switcher top padding 300 ms Easing.out(quad)" |
| Address row fold | `collapsed` | height auto → 0 + opacity · 0.3s `easing.out` | as above | `collapsed` | MC (height instant, fade kept) | `home/components/HomeHeader.tsx:29` | bappzaar: react-native-collapsible 300ms easeOutCubic (comment) |
| Experience switcher tile shrink + logo swap | `collapsed` | height 78 → 35.45, radius 20 → 12; full logo scale 1 → 0 + fade, compact logo fades in · 0.3s [0.5,1,0.89,1] | as above | `expanded` | MC | `home/components/ExperienceSwitcher.tsx:40` | bappzaar: useExperienceSwitcher (tokens.ts radius 20 → 12); the 48px logo offset is unverified |
| Strip carousel auto-advance | every 3s while ≥ 50% in view | track `x → −index·step` · 0.45s `easing.out`; off-centre slides opacity 0.85 | drag pauses; release snaps by velocity ±200px/s or nearest; loop re-bases silently | `index` | hook: no autoplay, snaps land at once | `home/components/BannerCarousel.tsx:65` | bappzaar: FIGMA-MAPPING.md "3000 ms auto, 450 ms out-cubic, 0.85 fade, loop" (tokens.feed.ts NoonSlider); ±200px/s unverified |
| Eid hero autoplay | every 3s while ≥ 50% visible | native smooth `scrollTo` to the next card; CSS scroll-snap centre | first pointerdown / wheel stops it for good | `touched` | hook | `home/components/EidBanners.tsx:32` | bappzaar: FIGMA-MAPPING.md useNoonDynamicCarouselAutoScroll 3000 ms |
| Easy banner marquee | in view ≥ 20% | `scrollLeft += 10.42px/s`, wraps at one copy · linear rAF | pointer down pauses, up resumes | — | hook (stopped) | `home/components/EasyBannerScroller.tsx:46` | bappzaar: FIGMA-MAPPING.md "marquee 96 ms/px" |
| Product carousel rise | mount | first 8 cards `y 16 → 0` + fade, 35ms stagger · spring 380/39 | — | — | MC | `home/components/ProductCarousel.tsx:21` | kit (`Stagger` recipe) |
| Keep-shopping card press | tap | opacity 1 → 0.7 | release | — | MC (fade kept) | `home/components/ItemCarousel.tsx:21` | bappzaar: TouchableOpacity 0.7 (comment) |
| Banner / tile presses | tap | none (`scale={1}`) | — | push plp / pdp | — | `home/components/EidBanners.tsx:61` | bappzaar for Eid cards (FIGMA-MAPPING.md "press feedback none"); other tiles unverified |
| Header address / wishlist / switcher press | tap | scale 0.98 / 0.96 · `spring.press` | — | toast / push | MC | `home/components/HomeHeader.tsx:57` | kit |
| Search placeholder word ticker | every 2.2s | word `y 30 → 0` + fade, exit `y −30` · 0.45s `easing.backOut` | — | word index | **gap**: interval keeps rotating (y dropped by MC) | `components/SearchBar/SearchBar.tsx:48` | unverified |
| Mega deals countdown | every 1s | text tick, no animation | — | `now` | — (state) | `home/components/MegaDeals.tsx:33` | bappzaar: FIGMA-MAPPING.md countdown tab |
| Open PLP / PDP from a tile | tap | `push` | back | stack | Nav (cross-fade) | `motion/transitions.ts:20` | kit |
| Classic: hero autoplay | every 4s | smooth `scrollTo` next | touch pauses | — | hook | `home/components/HeroCarousel.tsx:22` | unverified ("as on the live noon home") |
| Classic: mode switch knob / header cross-fade | tap | knob `x 0 ↔ 24` spring 500/30; header opacity 0.2s | — | `mode` | MC | `home/ClassicHomeScreen.tsx:172` | unverified (stand-in for a Lottie switch) |

## search (`search/search`, `search/suggestions`)

Authority for the whole flow: the ProtoPie handoff "noon X supermall" via github.com/saswata2002/Brand-Widget-PLP `app.js` (`presets.ts` `handoff`, `search/tokens.ts`). Labelled `figma: Brand-Widget-PLP`.

| Interaction | Trigger | Motion | Gesture · interruption · dismissal | State | Reduced | Code | Source |
|---|---|---|---|---|---|---|---|
| Push to search (`slide-left`) | tap search bar | `x 100% → 0`, page under `x −52%` · `handoff.spring` | back reverses; spring from current value | stack | Nav (cross-fade) | `motion/custom/index.ts:26` | figma: Brand-Widget-PLP ("handoff spring … drifts 200/382") |
| Presearch rises in | mount / field cleared | `y 20 → 0` + fade 0.183s `handoff.easeOut`, delay 0.124s (push) | variants retarget from current | `showPresearch` | MC | `search/SearchScreen.tsx:34` | figma: Brand-Widget-PLP (tokens.ts "124ms after touch-up") |
| Presearch sinks | first keystroke | `y 0 → 20` + fade 0.189s `handoff.easeInOut` | — | — | MC | `search/SearchScreen.tsx:43` | figma: Brand-Widget-PLP |
| Suggestion rows fall in | first match (+110ms) | `y −20 → 0` on `handoff.spring` + fade 0.183s, 60ms stagger top → bottom | next key clears the timeout | phase `showing` | MC | `search/SearchScreen.tsx:102` | figma: Brand-Widget-PLP |
| Changed row cross-fade (`BlurSwap`) | typing (60ms settle) | old lifts 5px + blur 2 + fade 0.16s; new rises 0.26s, 40ms behind; 28ms cascade | debounce restarts | `epoch` | MC (fade + blur kept) | `search/SearchScreen.tsx:198` | figma: Brand-Widget-PLP (cascade); shift / blur values kit `BlurSwap` defaults |
| Rows leave (no match / cleared) | empty | `y → −20` + fade 0.189s, 40ms stagger bottom → top | — | phase `hiding` | MC | `search/SearchScreen.tsx:35` | figma: Brand-Widget-PLP |
| Pick → fast exit → PLP (`results-fade`) | tap row / Enter | rows `y → −12` 0.15s + fade 0.13s, 25ms bottom → top; then push | not interruptible (setTimeout → push); input blocked | phase `leaving` | MC + Nav | `search/SearchScreen.tsx:142` | figma: Brand-Widget-PLP |
| Field fill | pick / fill arrow | untyped part fades in 0.32s `handoff.easeInOut` | new key restarts | `filling` | MC (fade) | `components/SearchBar/SearchBar.tsx:155` | figma: Brand-Widget-PLP |
| Recent searches edit mode | tap Edit / Done | items shift `y 9`, wobble ±2° at 3Hz (`repeat: Infinity`, phase-offset), delete badges fade / scale 0.6 → 1 0.2s | Done stops the wobble | `editing` | MC (wobble + shift instant, badge fade kept) | `search/components/RecentSearches.tsx:44` | bappzaar: NoonRecentlySearchedModule (comment: shift 9px 200ms, wobble ±2° 3Hz) |
| Recent item remove + reflow | tap ✕ | exit fade + scale 0.6 0.18s, siblings `layout` | — | `recents` | MC | `search/components/RecentSearches.tsx:38` | unverified |
| Row / pill press | tap | scale 0.98 / 0.96 · `spring.press` | — | — | MC | `search/components/SuggestionRow.tsx:22` | kit |

## plp (`plp/listing`, `plp/filters`, `plp/sort`)

Results timeline: Brand-Widget-PLP "Results (PLP 920:18788)" (`plp/tokens.ts`). Scroll states: `plp/MAPPING.md` (bappzaar master e3eb49a2aae). `BrandWidget.tsx` is not imported by `ListingScreen` (its rows in motion.md describe the reference).

| Interaction | Trigger | Motion | Gesture · interruption · dismissal | State | Reduced | Code | Source |
|---|---|---|---|---|---|---|---|
| Page arrives in place (`results-fade`) | push from search | layer opacity stays 1; below-bar content fades 0 → 1 0.3s `handoff.easeInOut`; back fades the layer | — | — | Nav (fades kept) | `plp/ListingScreen.tsx:31` | figma: Brand-Widget-PLP 920:18788 |
| Bottom nav rises | mount | `y 88 → 0` on `handoff.spring`, delay 0.224s | — | — | MC | `plp/ListingScreen.tsx:132` | figma: Brand-Widget-PLP (88px; `supermall.page.navRise` says 94) |
| Chip reveal | mount | chip `y −20 → 0` on the spring + fade 0.189s; its skeleton pill fades; delay 0.48 + i·0.06 | — | — | MC | `plp/components/NavPills.tsx:23` | figma: Brand-Widget-PLP |
| Cards rise out of skeletons | mount (first 8) | `y 16 → 0` spring + fade 0.183s; skeleton fades 0.353s later; delay 0.68 + i·0.06 | — | — | MC + Skeleton still | `plp/ListingScreen.tsx:159` | figma: Brand-Widget-PLP |
| Filter change: grid swap | filters / query change | cards fade 0.18s into skeletons; at 0.82s grid re-keys and rises again | 820ms timeout restarts on each change | `reloading`, `epoch` | MC | `plp/ListingScreen.tsx:72` | figma: Brand-Widget-PLP + noon X Supermall spec (`supermall.swap`) |
| Sort reorder | sort change | FLIP `layout="position"` 0.36s [0.4,0,0.2,1] | layout from current | `sort` | MC | `plp/ListingScreen.tsx:154` | unverified (curve = `supermall.ease.standard`, 0.36s uncited) |
| Tab bar scroll-hide | down 64px past y 150 / up 24px or y ≤ 10 / flick ±2px/ms | `--plp-tab-hide` 0 ↔ 1 → translateY · 0.15s [0,0,0.58,1] | `animate()` from current | `tabHide` | hook (duration 0; reads OS-only `useReducedMotion` in kit `tabBarScroll`, `useReduceMotion` here) | `plp/scrollStates.ts:79` | bappzaar: MAPPING.md ScrollVisibilityProvider (RNN hideTabBar 0.15s CurveEaseOut) |
| Hidable header | scroll past header height | `--plp-header-hide` → translateY(−100%) · 0.3s RN inOut(ease) | from current | `headerHide` | hook | `plp/scrollStates.ts:83` | bappzaar: MAPPING.md HidableView Animated.timing 300ms |
| Marketplace indicator | tab change | indicator x / width · 0.2s inOut(quad) (first placement instant) | from current | `active` | hook (instant) | `plp/components/MarketplaceStrip.tsx:59` | bappzaar: useNoonFulfillmentTabsIndicator withTiming 200ms |
| Filter pill attention (once) | 2 rAF + 1.1s after mount | blue border segment runs round 4.5s [0.16,1,0.3,1]; pill scale 1 → 1.04 → 1; icon Lottie plays | plays once | — | hook (skipped, Lottie too) | `plp/components/CatalogNavPill.tsx:182` | bappzaar: FILTER_PILL_ANIMATION_DURATION 4500, withDelay(396, 440/633ms) (comment); the extra 900ms delay is a kit addition |
| Nav pill press | tap | no scale; haptic `snap` | — | opens sheet | — | `plp/components/CatalogNavPill.tsx:119` | bappzaar: HapticsView IMPACT_HEAVY |
| Filters / Sort sheet | `nav.sheet` | Navigator sheet | grabber drag, scrim tap | stack | Nav (fade in place, verified) | `plp/index.ts:31` | kit |
| Filters facet switch | tap facet | in `x 12 → 0` + fade, out `x → −8`, 0.18s, mode `wait` | waits for exit | `active` | MC | `plp/FiltersSheet.tsx:61` | unverified |
| Sort radio + close | pick | `layoutId="sort-radio"` slides; `setTimeout(nav.back, 180)` | not interruptible | `sort` | MC | `plp/SortSheet.tsx:30` | unverified |
| Card nudge ticker (ProductBoxVertical) | interval | nudge text rotates | — | — | **gap** (component outside this pass) | `components/ProductBoxVertical/ProductBoxVertical.tsx:176` | unverified |

## pdp (`pdp/detail` Storefront, `pdp/variants`, `pdp/added`)

| Interaction | Trigger | Motion | Gesture · interruption · dismissal | State | Reduced | Code | Source |
|---|---|---|---|---|---|---|---|
| Header solid background | scrollY > 100 | opacity 0 ↔ 1 · 200ms [0.42,0,0.58,1]; 1px border via CSS 200ms | from current | `solid` | MC + CSS | `pdp/components/storefront/SfHeader.tsx:36` | bappzaar: NoonScreenWithDrawBehindHeader.animateHeaderBackground 200ms inOut(ease) (tokens.ts, MAPPING.md); border timing unverified |
| Expandable search pill | header turns solid | width 40 ↔ full on spring 400/30; label fade + `x −4` 0.2s | folds back at top | `expanded` | MC | `pdp/components/storefront/SfHeader.tsx:75` | bappzaar: NoonExpandableSearch SPRING_CONFIG; label timing unverified |
| Gallery pin + shrink | scroll | scale [1.1, 1, .95, .9, .9] over [−50, 0, h/4, h/2, h] | follows scroll | — | — (scroll-linked) | `pdp/components/storefront/SfGallery.tsx:47` | bappzaar: MAPPING.md NoonProductUtil.scaleGallery / translateYGallery |
| Gallery swipe pager | drag x / dot tap | track `x → −i·w` spring 300/34; dots 150ms ease-out | drag elastic 0.15, page at > 18% w or > 400px/s; animate from current | `i` | **partial**: drag 1:1; the settle spring is imperative and still animates | `pdp/components/storefront/SfGallery.tsx:56` | kit (spring "same values as Gallery.tsx"); dots bappzaar MAPPING.md 150ms ease-out |
| Deal nudge ticker | ≥ 2 nudges | `y +20 → 0` in 400ms, hold 1s, out `→ −20` 550ms, linear | interval | `idx` | hook (first nudge stays) | `pdp/components/storefront/SfMainInfo.tsx:236` | bappzaar: NoonProductInfo nudge ticker / NoonNudgeTag (tokens.ts) |
| Reco card nudge flipper | ≥ 2 nudges | `y ±18` 300 / 1000 / 450ms | interval | `i` | hook | `pdp/components/storefront/SfRecommendations.tsx:143` | bappzaar: NoonNudgeTag carousel (tokens.ts `nudge.card`) |
| Warranty USP ticker | every 2.5s | `y 8 → 0 / −8` + fade · 150ms `easing.out`, popLayout | interval | `i` | hook | `pdp/components/storefront/SfExtendedWarranty.tsx:71` | figma: Storefront "USPs animation_final" (FIGMA-MAPPING.md, 2.5s) |
| Product Overview accordion | tap | chevron 0 ↔ 180°, body height 0 ↔ auto + fade · 150ms `easing.out`; page scrolls +120 over 150ms | tap again | `open` | MC (height instant) | `pdp/components/storefront/SfProductDetails.tsx:18` | bappzaar: MAPPING.md NoonAccordion 150ms; `scrollAfterAccordionOpen` +120 / 150ms; the fade is a kit addition |
| AI overview title shimmer | mount | background-position band, 2s ease-in-out infinite (CSS) | — | — | CSS (+ own media query) | `pdp/components/storefront/SfProductDetails.module.css:58` | figma: New PDP 84:8031 (FIGMA-MAPPING.md) |
| A+ features View more | tap | height 610 ↔ auto + gradient fade · 0.3s `easing.out` | View less | `open` | MC | `pdp/components/storefront/SfProductFeatures.tsx:63` | kit (Figma 3499:75700 gives the cap + fade only) |
| Add to cart → loader → Added sheet | tap ATC | label hidden, looping loader Lottie 700ms, then `nav.sheet('pdp/added')` | repeat taps blocked | cart | Lottie held frame + Nav | `pdp/components/storefront/SfAtcBar.tsx:101` | bappzaar: MAPPING.md addToCartAnimation loader; 700ms is demo latency |
| "Added in your cart" strip + count | inCart > 0 | height 0 → auto `spring.gentle`; count scale 1.4 → 1 `spring.bouncy` | — | — | MC | `pdp/components/storefront/SfAtcBar.tsx:71` | kit |
| Back to top | scrollY > device height | mounts / unmounts with no transition | tap → smooth scroll to 0 | `showTop` | CSS (`scroll-behavior`) | `pdp/components/storefront/SfAtcBar.tsx:59` | bappzaar: MAPPING.md "mounts and unmounts with no transition" |
| Sticky bar follows tab-bar hide | scroll down 64 / up 24 | translateY by tab height · 0.15s [0,0,0.58,1] | from current | `tabHide` | hook (kit `tabBarScroll`, OS-only) | `pdp/pdp.module.css:24` | bappzaar: MAPPING.md BottomTabScrollVisibilityProvider |
| Added sheet quick-cart row | sheet mount | row `x 150 → 0` 500ms delay 750; text `x 500 → 0` + fade 700ms delay 500 · [0.4,0,0.2,1]; `atcCheck` Lottie | sheet drag | — | MC + Lottie held | `pdp/AddedSheet.tsx:25` | bappzaar: NoonQuickCartScreen (tokens.ts; kit runs the delays at ×0.5 on purpose) |
| Size-missing shake | ATC without size | x [0,−10,10,−8,8,−5,5,0] 350ms | restarts | `warn` | MC (shake dropped; the warning text carries it) | `pdp/VariantsSheet.tsx:37` | bappzaar: MAPPING.md NoonShakingWrapper |
| Variants / Added sheets | `nav.sheet` | Navigator sheet | grabber drag | — | Nav | `pdp/index.ts:42` | kit |

## cart (`cart/cart` + sheets)

| Interaction | Trigger | Motion | Gesture · interruption · dismissal | State | Reduced | Code | Source |
|---|---|---|---|---|---|---|---|
| Header scroll morph | scroll 0–60 | bg page → white, radius 0 → 12, drop gradient, corner overlay 0–12 | follows scroll | — | — | `cart/components/CartHeader.tsx:19` | bappzaar: NoonSalesAnimatedHeader + figma: Cart 2.0 "Nav Header" 10575:94722; 0–12 overlay is a kit tweak |
| Loading bar | screen appear (450ms) | bar `x −100% → 100%`, 800ms loop [0.25,0.1,0.25,1] | unmounts | `loading` | hook (bar holds, opacity pulse) | `cart/CartScreen.tsx:155` | bappzaar: ProgressLoader 800ms loop (comment) |
| Free-delivery progress bar | group first seen / subtotal change | track `y 20 → 0` after 1s, height after 1.2s (300ms); width on spring 100/16; skewed shimmer 1.8s × 7 inOut(quad) | spring retargets | pct | MC + hook (no shimmer) | `cart/components/GroupProgressBar.tsx:47` | bappzaar: NoonCartGroupProgressBar (tokens.ts, comment) |
| Item add / remove | line change (remove after 450ms) | height 0 ↔ auto + fade 0.3s, `layout="position"` | — | lines | MC | `cart/components/CartGroup.tsx:57` | unverified |
| Quantity stepper | tap − / + | value `y 8 → 0 / −8` + fade 160ms popLayout; buttons scale 0.85; commit after 1.2s debounce + 350ms loader | debounce restarts each tap | qty | MC + Spinner pulse | `cart/components/QuantitySelector.tsx:82` | bappzaar for the debounce (tokens.ts `qtyDebounceMs`); roll unverified |
| Lowest-price USP ticker | ≥ 2 USPs, every 3s | `y 20 → 0` in 400ms, out `→ −20` 550ms | interval | `i` | hook | `cart/components/CartItem.tsx:299` | bappzaar: NoonSalesUSPs enter 400 / exit 550, offset 20 (comment) |
| Move to wishlist snackbar | heart (550ms spinner) | `y 100% → 0`, exit 110% · spring 120/16/0.7; 3s | auto hide | item moved | MC (fades in place) | `cart/components/CartSnackBar.tsx:22` | bappzaar: NoonSnackBar (comment) |
| Coupon invalid shake / applied | apply | x [0,−6,6,−4,4,0] 350ms; icon scale spring 400/18; feedback height 250ms | key remount | coupon | MC | `cart/components/CouponInput.tsx:63` | unverified |
| Cobrand cards auto-advance | > 1 card, every 3s | smooth `scrollTo` next page, silent re-base | any user input stops it for good | index | hook | `cart/components/CobrandCards.tsx:44` | bappzaar: FIGMA-MAPPING.md NoonCartCobrandCards 3000ms |
| Invoice sheet | tap Total | `y 600 → 12` 300ms [0.25,0.1,0.25,1]; backdrop 0 → 0.5 in 200ms | drag y (elastic 0.6), > 50px or backdrop tap closes | `open` | MC (appears in place, backdrop fade kept) | `cart/components/CartFooter.tsx:91` | bappzaar: FIGMA-MAPPING.md NoonCartScreen 300ms / 0.5 / 200ms / > 50 |
| Savings tab / dynamic invoice | savings > 0 / totals change | `y 20 → 0` + fade 0.3s; rows `layout` 0.3s | — | — | MC | `cart/components/DynamicInvoice.tsx:17` | invoice: bappzaar NoonDynamicInvoice 300ms (comment); savings tab unverified |
| Cart sheets (variants, customize, discount, bundles, updates) | `nav.sheet` | Navigator sheet; updates rows stagger 80ms, bundles 50ms + looping bundle Lottie | grabber drag | — | Nav + Lottie held | `cart/index.ts:50` | kit; staggers unverified |

## checkout (`checkout/checkout` → placing → confirmation, 16 sheets)

| Interaction | Trigger | Motion | Gesture · interruption · dismissal | State | Reduced | Code | Source |
|---|---|---|---|---|---|---|---|
| Header scroll morph | scroll 0–60 | bg antiFlashWhite → white, radius 0 → 12, gradient 50–60, overlay 0–8 | follows scroll | — | — | `checkout/components/CheckoutHeader.tsx:51` | bappzaar: MAPPING.md HEADER_ANIMATION_COLORS over 0 → 50; overlay 0–8 kit tweak |
| Reloader (invisible) | every `set*` | no visual (dot + white wash removed 2026-10-15, user: no dot loaders); an invisible layer blocks taps while `reloading` | unmounts | `reloading` | — | `checkout/components/Reloader.tsx` | was bappzaar FeedbackView spinkit Pulse 37 |
| Need-today lanes expander | tap | chevron 0 ↔ 180°, lanes height + fade 300ms | tap | `open` | MC | `checkout/components/CheckoutShipment.tsx:176` | bappzaar: ANIMATION_DURATION 300 (comment, MAPPING.md) |
| noon One toggle | tap | radial gradient scale 0 → 6 600ms; subtitle / CTA / nudge fade + `y −8` 300ms; `layout` | toggle off | `enrolled` | MC | `checkout/components/NoonOneSection.tsx:76` | bappzaar: NoonCheckoutNoonOneSection (comment; noonone/tokens.ts `{ ms: 300, gradientMs: 600, gradientScale: 6 }`) |
| noon One CTA reveal (first show) | Lottie loaded (skip after 1.5s) | one 2850ms clock: odometer, squeeze / expand, suffix fade, block settle, pulse 1 → 1.01 → 1 | `run.stop()` on unmount | `revealing` | hook: skipped, settled CTA at once (verified) | `checkout/components/NoonOneCtaReveal.tsx:162` | bappzaar: NoonOneCtaReveal (bappzaar master, comment) |
| Payment tag shimmer | mount | 15px band `x 0 → w+15` 800ms, delay 1.5s, repeat ∞ (repeatDelay 1.5s), inOut(quad) | — | — | MC (band parked off the tag) | `checkout/components/CheckoutTag.tsx:28` | bappzaar: MAPPING.md withRepeat(withDelay(1500, withTiming(w+15, 800))) |
| Payment rows / credits strip | tap / toggle | press scale 0.985; strips height + fade 200ms `easing.out` | — | method | MC | `checkout/components/PaymentMethods.tsx:27` | press kit; strip unverified (layout figma Checkout 2.0 14288:184061) |
| Slide to pay: drag + release | pan the thumb | x follows finger; label clip wipe; arrow Lottie scrubbed; complete > 85% (or > 65% at > 500px/s): x → max 200ms / inertia; cancel x → 0 500ms | `x.stop()` on pan start | placeOrder | — (user-driven) | `checkout/components/SlideButton.tsx:155` | bappzaar: MAPPING.md NoonCheckoutSlideButton thresholds .85 / .65 / 500, lottie .62 |
| Slide to pay: idle nudge + label shimmer | enabled | nudge x [cur,7,0,7,0] 1.2s every 4s; shimmer 4s linear loop | stops after done | — | hook (both off) | `checkout/components/SlideButton.tsx:108` | bappzaar: "pulse 7px ×2 every 4s", "shimmer every 4s" (comment) |
| Placing screen | slide complete (`transition: 'none'`) | card `y 100% → 0` 400ms `easing.out`; messages at 900 / 1300ms; box Lottie cross-fades to tick (500ms) | setTimeout chain, cleared on unmount | success / fail | MC + Lottie held; `onComplete` on time (verified: confirmation at ≈5s both ways) | `checkout/PlacingScreen.tsx:47` | bappzaar: NoonPostOrderLoader SlideInDown 400ms (comment) |
| → Confirmation (`checkout-alpha`) | tick Lottie `onComplete` | opacity 0 → 1 0.25s `easing.standard` | — | — | Nav (fade kept) | `checkout/transitions.ts:8` | bappzaar: `animations.push.content.alpha 0 → 1, 250ms` |
| Confirmation content + header | mount / scroll | content `y 100% → 0` 600ms `easing.out`; header bg + title fade 100ms at threshold | — | `headerShown` | MC | `checkout/ConfirmationScreen.tsx:107` | bappzaar: NoonOrderConfirmationV3Screen SlideInDown 600ms (comment) |
| Confirmation stacked images | > 1 item | rAF loop: front card slides back (300ms) every 2.3s, offset 14 / scale −.09 / opacity −.1 | — | — | hook (holds first card) | `checkout/ConfirmationScreen.tsx:206` | bappzaar: NoonStackedImageCarousel slide 300 / idle 2000 (comment) |
| Payment failure | fail | `modal` + typewriter 10–15ms/char after 500ms; CTA fade after 2s | setTimeout chain | — | Nav; typing unchanged (text, not movement) | `checkout/PaymentFailureScreen.tsx:26` | bappzaar: react-native-typewriter (comment); CTA fade unverified |
| Voucher toast | redeem | fade 500ms linear, stays 2s; confetti GIF behind | auto | — | MC (fade); **gap**: GIF still plays | `checkout/components/VoucherToast.tsx:27` | bappzaar: bappzaar Toast with toastDuration 2000, fade 500ms (comment) |
| OTP boxes | type / error | digit scale 0.6 → 1 spring 500/25; error shake 350ms | — | — | MC | `checkout/components/ProviderForm.tsx:250` | unverified |
| Checkout sheets (16) | `presentation: 'sheet'` | Navigator sheet | grabber drag | — | Nav | `checkout/index.ts:54` | kit |

## noonone (landing, plans, payment, offers, overlays)

| Interaction | Trigger | Motion | Gesture · interruption · dismissal | State | Reduced | Code | Source |
|---|---|---|---|---|---|---|---|
| `noonone-overlay` stack layer | modal push | transparent static layer; exit fade 0.2s | `nav.back()` | — | Nav | `noonone/transitions.ts:9` | kit (adapter for RNN showOverlay, MAPPING.md) |
| VIPOverlay scrim + sheet | mount / close | scrim 0 → 1 350ms [0.42,0,0.58,1]; sheet `y 300 → 0` spring 110/15/1; close 350ms | handle drag (elastic bottom 1), close past min(h·0.5, 250) or 2000px/s; scrim tap | pop | **partial**: imperative `animate()` still slides | `noonone/components/VIPOverlay.tsx:52` | bappzaar: MAPPING.md withTiming 350 inOut(ease) / withSpring 110/15 from 300 |
| VIPButton press | tap | scale 0.97, 100ms in / 200ms out; onPress after 200ms | — | delayed callback | MC | `noonone/components/VIPButton.tsx:35` | bappzaar: MAPPING.md |
| Legacy overlays (payment, entry) | mount / close | scrim 250ms; `y 300 → 0` spring 230.2/22 | close / scrim | `nav.back()` | **partial** (imperative) | `noonone/components/payment/LegacyOverlay.tsx:29` | bappzaar: MAPPING.md tension 40 / friction 7 → 230.2 / 22 |
| Landing header fade / sticky footer | scroll 0–20 / mount | header opacity 0 → 1; footer `y h+12 → 0` 300ms Easing.ease | — | `hideContent` | — / MC | `noonone/screens/LandingScreen.tsx:187` | bappzaar: MAPPING.md scrollY [0,20]; translateY h+12 300ms |
| Landing skeleton | load (600ms demo) | looping shimmer Lottie (cover) | removed on load | `loading` | hook (`LottieBox`: held frame) | `noonone/screens/LandingScreen.tsx:213` | bappzaar: MAPPING.md VIPSkeletonLoader |
| Success TransitionAnim | `pendingSuccess` | full-screen Lottie; title / subtitle fade + `y −60` 450ms at 2.8 / 2.9s; layer fades 500ms; content springs back 80/10 | Lottie complete or 4.7s fallback | success → null | `LottieBox` held frame + `onComplete` on time; **partial**: content spring is imperative | `noonone/components/landing/TransitionAnim.tsx:23` | bappzaar: MAPPING.md VIPTransitionAnim |
| VIPSlider (benefits / savings) | autoplay 3.5s / swipe ≥ 20px | `pos ±1`, slides translateX + scale 1 ↔ 0.5, labels cross-fade · 400ms [0.42,0,0.58,1] | each step restarts the interval | — | hook (no autoplay, swipes land at once) | `noonone/components/landing/modules.tsx:154` | bappzaar: MAPPING.md VIPSlider; non-member look figma 24:2628 |
| Savings count-up | mount | number 0 → target 1.2s easeOut | cleanup stops | — | **gap**: imperative count-up still runs | `noonone/components/landing/modules.tsx:512` | bappzaar: VIPAnimatedDigits 1200 (comment); MAPPING.md records the digit roll → count-up deviation |
| VIPStatusIndicator pulse | mount | ring scale 0 → 1.25 + opacity 1 → 0, 1516.7ms loop | — | — | hook (ring at rest) | `noonone/components/landing/modules.tsx:381` | bappzaar: tokens.ts "91 frames @60fps loop" |
| FAQ expand | tap | chevron 0 ↔ ±180°, body height + fade 300ms | — | `open[i]` | MC | `noonone/components/landing/modules.tsx:339` | bappzaar: MAPPING.md; np look figma 24:2636 |
| Video carousel | selected slide | selected video plays (muted loop), others pause | scroll-snap | selected | hook (no autoplay, poster) | `noonone/components/landing/npModules.tsx:227` | bappzaar: MAPPING.md VIPVideoCarouselModule |
| Plan-select tier pill | tap | `x → tier·tabWidth` 500ms `easing.out` | — | tier | MC | `noonone/screens/PlanSelectScreen.tsx:130` | bappzaar: SegmentedControlTabSwitcher 500ms out(cubic) (comment) |
| Savings tag shimmer | mount | white bar `left −20% → 120%` 1.2s linear, delay 1.5s, repeat ∞ | — | — | MC (`left` is positional in motion-dom: parked) | `noonone/components/plans/PlanCard.tsx:23` | PlanCard bappzaar (VIPQuickPlanSelectV3Screen, comment); PlanOption copy unverified |
| Family plan selection + header Lottie | tap Duo / Family | tile progress spring 107/12; header Lottie segment 0 → 81 / 81 → 161 | new segment replaces | `isDuo` | hook (jumps to resting frame); tile spring imperative (**partial**) | `noonone/screens/FamilyPlansScreen.tsx:181` | bappzaar: PLAN_SELECTION_SPRING, syncHeaderLottie (comments) |
| Offers popup / label / lists | valid code / focus | popup like VIPOverlay, auto-close 2s; label float 200ms; list heights 250 / 500ms | — | — | MC / **partial** (popup imperative) | `noonone/components/offers/InlinePopup.tsx:19` | bappzaar: tokens.ts SUCCESS_POPUP_AUTO_ADVANCE_MS, label 200ms, list timings |
| Payment header + Reloader | scroll / pay | header bg over 0–30px; reloader: no visual (invisible tap-blocker, dot removed 2026-10-15) | — | `reloading` | — | `noonone/components/payment/Reloader.tsx` | header bappzaar MAPPING.md interpolateColor [0,30]; Reloader visual bappzaar, timings unverified |
| Bundle modal | push | kit `sheet` transition (`y 100% → 0`, `spring.sheet`) | back | — | Nav | `noonone/screens.offers.ts:60` | kit |

## orders (`orders/list`, `orders/tracking`, `orders/updates`, `orders/cancel`)

List / tracking visuals follow a PDS web reference (pds-noon-as.vercel.app, MAPPING.md); PDS is not an authority label here, so those rows are `unverified (PDS ref)`.

| Interaction | Trigger | Motion | Gesture · interruption · dismissal | State | Reduced | Code | Source |
|---|---|---|---|---|---|---|---|
| Page content reveal | mount after push | `supermall.reveal` (rows rise 12px, 30ms stagger); off after the first filter swap | — | — | MC | `orders/motion.ts:7` | kit (MAPPING.md "supermall.reveal") |
| Pinned list header backdrop | scroll | white opacity 0 → 1 and radius 0 → 10 over 0–16px, shadow over 0–20px | follows scroll | — | — | `orders/OrdersListScreen.tsx:25` | bappzaar: MAPPING.md useO2DOrdersListingAnimation (note: the PDS table in the same file says "no scroll reaction") |
| Filter swap | chip tap | keyed list cross-fade 0.189s `handoff.easeInOut`, popLayout | keyed | filter | MC | `orders/OrdersListScreen.tsx:84` | kit |
| Chip / tile press dip | tap | `supermall.press` scale [1, .96, 1] 0.34s | — | — | MC | `orders/motion.ts:19` | kit (MAPPING.md) |
| Image stack ring | V2–V4, every 1.9s | cards x / scale / opacity to the next ring slot on `supermall.springs.return` | each tick retargets | `shift` | hook (holds, as V1) | `orders/components/ImageStack.tsx:42` | unverified (PDS ref "700 ms critically damped"; the kit spring settles ≈0.54s) |
| Stepper fill + step pops | mount | track scaleX 0 → 1 0.9s `ease.soft` delay 0.49s; done discs scale 0.86 → 1 `spring.bouncy` as the fill passes | — | — | MC | `orders/components/Stepper.tsx:38` | kit (MAPPING.md) |
| Heat window pill (V2–V4) | mount | pill grows from a dot (appleSpring 0.42/0.78) at 1.1s; letters blur 6 → 0 + `y 3`, 18ms apart; advice line at 2.5s | — | — | MC (movement dropped, fades + blur kept) | `orders/components/WindowPill.tsx:36` | unverified (PDS ref, MAPPING.md) |
| Delivery PIN tiles | mount | `y −10 → 0` on `handoff.spring` + fade 0.183s, 60ms apart from 0.4s | — | — | MC | `orders/components/PinTiles.tsx:15` | kit (MAPPING.md) |
| Star rating → review | tap star | scale [1, 1.25, 1] `spring.bouncy`, haptic `tick`, push review after 220ms | — | rating | MC | `orders/components/StarRating.tsx:41` | kit (MAPPING.md); 220ms from reviews `tokens.motion.ts` |
| All updates sheet | tap | Navigator sheet | grabber drag | — | Nav | `orders/OrderTrackingScreen.tsx:217` | behaviour bappzaar (NoonOrderDeliveryProgressOverlay); motion kit |
| Cancel: refund banner / reason expand / checkbox | select | banner `y 8` + fade (defaults); reason height spring 200/20; checkbox scale [1, 1.15, 1] 0.25s; cards `layout` | — | selection | MC | `orders/OrderCancelScreen.tsx:82` | unverified |

## Summarised flows

| Flow | Main motion (code) | Source | Reduced motion |
|---|---|---|---|
| categories | collapsible banner rows: height 300ms inOut(quad), tile scaleY 1.02 + `y 15`, sub-banners `x ∓25` + fade, popLayout (`categories/components/CollapsibleBannerModule.tsx:115`); CSS progress loader `catLoaderSweep` 800ms infinite (`categories/categories.module.css:192`) | bappzaar: MAPPING.md CollapsibleBannerModule, ProgressLoader | MC; loader via CSS rule (ends parked — **gap**: no pulse, the 700ms demo load still communicates via layout) |
| deals | Pressable presses (0.98 / 0.96) and CSS `scroll-snap` strips (`deals/deals.module.css:3`) | press kit; snap unverified | — |
| returns | bottom overlay `y 110% → 0` spring 15/110, close 350ms, drag > 250px / 2000px/s (`returns/components/ReturnsOverlay.tsx:54`); success header reveal 500ms (`returns/ReturnDetailsScreen.tsx:66`); section enter spring 14/180/0.8; photo guide auto-advance 3s / depth carousel 2s (`returns/components/sections/PhotoGuide.tsx:20`) | bappzaar: MAPPING.md (AFS) | MC; photo guide **hook**; header reveal imperative (**partial**); processing Lottie held |
| reviews | swipe deck: drag x, throw past 90px / 500px/s on `spring.gentle` (`reviews/DeckScreen.tsx:95`); in-screen sheet `spring.sheet` (.5 / .14); star pops `spring.bouncy`; morphing header over scroll; AI loader bloom 1.1s; mock keyboard 340ms `easing.ios`; crafting sweep `repeat: Infinity` (`reviews/components/DraftCard.tsx:29`) | figma: R&R 2.0 prototype repo `vbirla789/R-R-2.0-with-checkbox@ab185b3` + Figma KzR8dy12uT8CtgBRHHY6Qx (MAPPING.md) | already config-aware (`useReducedMotionConfig` in Rate / AiLoader / Submitted, `useReduceMotion` in NewReview); sweep MC |
| account | section stagger spring 120/15 (kit addition, MAPPING.md); edit ring timeline 8 imperative `animate()` (`account/components/EditRing.tsx:54`, bappzaar MAPPING.md); noon One strip spring 160/14/0.8; signed-out hero 3.5s auto-advance + emoji float (`account/SignedOutScreen.tsx:22`, unverified); locale change Lottie (`account/ChangeLocaleScreen.tsx:25`) | bappzaar for Account top + ring (master ba159e20381); others per code comments or unverified | signed-out **hook**; locale Lotties held (language pinned at 0.2 = "Hala", country `'auto'`), finish on time; edit ring imperative (**partial**) |
| wishlist | grid enter `Stagger` values 380/39, remove fade + scale 0.9 (`wishlist/WishlistScreen.tsx:65`); View Cart pill spring 120/16/0.7; empty-state floating hearts infinite (`wishlist/components/EmptyState.tsx:31`) | bappzaar (flow-wide: NoonWishlistV2* styles); hearts unverified stand-in for `noonWishlistV2EmptyLottie` | MC; hearts **hook** (still) |
| address | modal transitions `address-map` 330ms / `address-search` 150ms / `address-success` (`address/transitions.ts:10`); map pan drag + recenter `animate()` 450ms; pin lift; overlay sheet height spring 300/28; success timeline 2s (`address/SuccessScreen.tsx:37`) | bappzaar: AddressConstants.ts / AddressV2* (code comments; no MAPPING.md); map sheet / delete confirm unverified | Nav; success text fades without the rise, Lottie held, still navigates at 2s; recenter imperative (**partial**); looping location Lotties held |
| cards | card lift phase 370ms inOut(quad) (`cards/components/AnimatedListCard.tsx:82`); actions panel; overscroll stretch; loading bounce; add-card form spring 300/28; payment card shimmer `x` repeat ∞ (`cards/components/PaymentCard.tsx:29`) | bappzaar (flow-wide `features/payment` on origin/master, tokens.ts); list enter / delete unverified | shimmer MC; many imperative `animate()` (**partial**); success Lottie held |
| membership | VipOverlay sheet spring 110/15, backdrop 350ms, drag close (`membership/components/VipOverlay.tsx:69`); `mb-modal` 0.42s; success Lottie + text; family plan select + header Lottie segments (`membership/family/FamilyPlansScreen.tsx:134`); perk sheet; savings shimmer `left` loop | bappzaar: MAPPING.md (`features/vip/**`), perks/MAPPING.md; referral tab pill unverified | Nav; family Lottie **hook** (resting frame); overlays imperative (**partial**); shimmer MC (parked) |

## Source label counts (rows above)

Each row is counted once, by the first label in its Source cell (mixed rows such as "bappzaar for the debounce; roll unverified" count as their first label; the parts are spelled out in the cell).

| | bappzaar | figma | kit | unverified | rows |
|---|---|---|---|---|---|
| home | 9 | 0 | 3 | 3 | 15 |
| search | 1 | 8 | 1 | 1 | 11 |
| plp | 5 | 5 | 1 | 4 | 15 |
| pdp | 11 | 2 | 4 | 0 | 17 |
| cart | 9 | 0 | 1 | 2 | 12 |
| checkout | 14 | 0 | 2 | 1 | 17 |
| noonone | 16 | 0 | 2 | 0 | 18 |
| orders | 2 | 0 | 6 | 3 | 11 |
| summarised (the other nine) | 7 | 1 | 1 | 0 | 9 |
| **total** | **74** | **16** | **21** | **14** | **125** |

`unverified` as the main source: home search-placeholder ticker, classic hero autoplay, classic mode knob; search recent-item remove; plp sort reorder, facet switch, sort radio, card nudge ticker; cart item add / remove, coupon shake; checkout OTP boxes; orders image stack, heat pill, cancel screen. Many more cells carry an `unverified` part (a duration or easing with no citation) next to a cited behaviour.

## Remaining gaps

- Imperative `animate()` on overlays and timelines (noon One VIPOverlay / LegacyOverlay / InlinePopup / TransitionAnim content spring / savings count-up; membership VipOverlay / PerkSheet; account EditRing; returns header reveal; address recenter; cards; PDP gallery settle) still animates under reduced motion. They are short, user-triggered or one-off; give each a `reduce ? { duration: 0 } : …` when the flow is next touched.
- Outside this pass: `src/components/SearchBar` rotating words, `src/components/ProductBoxVertical` nudge ticker, `src/kit/tabBarScroll.ts` (OS-only `useReducedMotion`), checkout `VoucherToast` confetti GIF, categories CSS loader (parks instead of pulsing).
- `unverified` rows have no authoritative reference in the repo; check them against bappzaar master (`git -C ~/bappzaar show origin/master:<path>`) or Figma before treating them as the noon motion.
