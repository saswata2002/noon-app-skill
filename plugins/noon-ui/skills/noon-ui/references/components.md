# Components reference

Every shared component lives in `src/components/<Name>/` and is re-exported from `src/components/index.ts`. Inside a flow, import from the barrel with a relative path: `import { Screen, Header, Button } from '../../components'` from `src/flows/<flow>/*.tsx`, `'../../../components'` from `src/flows/<flow>/components/*.tsx` (the flows use relative imports; the `@kit/*` alias exists in `tsconfig.json` but no flow uses it). Flow-only pieces go in `src/flows/<flow>/components/`. CONTRIBUTING.md says to "Reuse before you create", and that "A component used by two flows belongs in `src/components` (one folder, tokens only, doc comment naming its bappzaar/Figma source and variants). Flow-specific compositions stay in the flow." So run "Search before you create" (below) before you build anything, and move a component to `src/components` only once a second flow needs it and its API has been agreed ("Duplicates and promotion").

**API source of truth: [`references/component-api.generated.md`](references/component-api.generated.md)** (+ `.json`), generated from the TypeScript checker by `node scripts/component-api.mjs`: every exported component with its file, every prop (type, optional, default, JSDoc), its variants, and the index of flow-local components. This file is the hand-written guidance: when to use what, examples from real screens, gotchas. Its props tables are kept in step with the generated API by `npm run skill:check` (a documented prop that doesn't exist fails the check); when the two disagree, the generated file is right. "—" means no default (optional unless marked required).

## Pick the component

System icon from a noon / Figma design → `OriginIcon` (catalogue in `references/icons.md`); lucide `Icon` only for existing flows.


| Need | Use |
|---|---|
| Root of every screen (scroll, safe areas, page background, header/footer slots) | `Screen` |
| Top bar of a pushed screen (back button, title, right actions) | `Header` |
| 40px round icon button (back, close, cart, share) | `IconButton` (from `Header`) |
| Any text bound to the type scale and colour tokens | `Text` |
| Server HTML copy (`<b>`, `<highlight>`, `<steel>`, `<strike>` …) | `HtmlText` (or `Text html=` for simple trusted strings) |
| Primary / secondary CTA, kit-style | `Button` `variant="primary" \| "checkout" \| "dark" \| "outline" \| "secondary" …` |
| bappzaar NoonButton (r12, 16/600), incl. ghost text link and dotted-underline link | `Button` `variant="noon" \| "noonSecondary" \| "noonGhost" \| "noonGhostSecondary" \| "noonDotted"` |
| Anything else tappable (cards, rows, custom chips) | `Pressable` |
| Generic line icon by name | `Icon` |
| Recolourable bappzaar webp/svg glyph | `MaskIcon` |
| Home / categories search pill that opens search | `SearchBarButton` |
| Editable search field | `SearchInput` |
| PLP nav pill, filter chip, filter-sheet option, home tag chip | `Pill` (+ `PillRow` for a horizontal scroller) |
| Price with dirham sign, struck "was" price and "% OFF" | `Price` |
| Inline money amount (dirham sign + formatted number) | `Money` |
| Rating score pill on a product | `RatingPill` |
| Row of 5 stars (read-only or tappable) | `Stars` |
| Product picture (or emoji placeholder) | `ProductImage` |
| PLP / search results grid card (bappzaar 1:1, `isPLP`) | `ProductBoxVertical` |
| Wishlist grid card (bappzaar `isWishlist` compact view) | `ProductBoxVertical` with `wishlist` |
| Carousel / other product tile | `ProductCard` |
| Figma "SKU" rail card (134 wide, 134×174 image box, 1.2px blue "+", 15/20 price; Homepage 2025, Cart 2.0) | `SkuCard` (shared; `look="cart"` in cart carousels); don't use `ProductCard` for these rails |
| Quick add-to-cart "+" (the one look, every card) | `QuickAdd` (catalog product) / `QuickAddButton` (own `onPress`) |
| Wishlist heart toggle | `WishlistHeart` (own heart button: `LikeHeart`) |
| Quantity −/+ control | `QuantityStepper` |
| "Best Seller" corner tag | `CatalogTag` |
| Estimated-delivery badge on a product card (minutes, supermall, express today / tomorrow / dated, market, global) | `EtaBadge` with `etaFor(product)` or an `etaUseCases.*` preset (`src/data/eta.ts`) |
| noon express pill (outside the ETA slot: orders, returns, cart sheets) | `ExpressBadge` or `MarketplaceTag kind="express"` |
| Marketplace pill (supermall, market, global, food, minutes) | `MarketplaceTag` |
| Marketplace wordmark logo | `MarketplaceWordmark` |
| Coupon chip ("dashed green") | `CouponTag` |
| Status / highlight chip (success, warning, danger …) | `StatusChip` |
| Tiny label badge (sponsored "Ad", member) | `Badge` (Ad recipes under Tags) |
| White r16 section card with optional title row | `SectionCard` |
| Account-style settings row with icon + chevron | `ListRow` inside `ListGroup` |
| Solid hairline (horizontal or vertical) | `Divider` |
| Dashed CSS separator (account, orders) | `DashedDivider` |
| SVG dotted/dashed separator (address, account notifications) | `DottedDivider` |
| Sticky footer surface with top radius + shadow + bottom inset | `BottomBar` |
| Bottom sheet content (header, body, footer CTA) — default Origin layout | `SheetHeader`, `SheetBody`, `SheetFooter` (presentation `sheet`) |
| Floating "Need help?" pill that folds into its icon on scroll | `NeedHelpButton` (as `<Screen overlay>`) |
| Bottom tabs | `TabBar` (rendered by the Navigator; configure `tabBar` in `defineFlow`) |
| Loading placeholder blocks | `Skeleton` |
| Spinner (button loader, inline loader, iOS petals) | `Spinner` (or `Button loading`) |
| Lottie animation (ATC check, order confirmed, box) | `Lottie` |
| Two/three-option sliding toggle | `Segmented` |
| On/off toggle | `Switch` |
| Square check glyph inside a selectable row | `Checkbox` |
| Search pill, Homepage 2025 look (gray400 border, 15/18 Medium placeholder, Figma icons) | `SearchBarButton variant="2025"` |
| Plain toast message | `useNav().toast(message, opts)` (not a component) |
| Snackbar / toast message (default look) | `nav.toast(title, { type, subtitle, icon, action })` → `Snackbar` / `SnackbarStack` (Origin M-Toast) |
| Custom-styled self-dismissing toast / snackbar | `Toast` (host) |
| Cart shipment group (tinted header, wave, items, callouts, free-delivery progress) | flow-local `CartGroup` + `GroupProgressBar` (`src/flows/cart/components/`) |
| Checkout shipment card (items scroller, "Get it" wave footer, fulfilment pill, lanes expander) | flow-local `CheckoutShipment` (`src/flows/checkout/components/`) |
| Payment method rows, credits toggle, CVV, EMI strip | flow-local `PaymentMethods` (checkout); NEW badge = `NewBadge` from `src/flows/checkout/components/BurnSection.tsx` |
| Slide-to-pay | flow-local `SlideButton` (`src/flows/checkout/components/SlideButton.tsx`) |

---

## Screen

`src/components/Screen/Screen.tsx`. Every screen's root. Owns the scroll container (`.nk-scroll`), the top/bottom safe-area insets, the page background and fixed `header` / sticky `footer` slots. `forwardRef` to the scroll `div`.

| Prop | Type | Default |
|---|---|---|
| `header` | `ReactNode` | — |
| `footer` | `ReactNode` | — |
| `children` | `ReactNode` | — |
| `background` | `string` (colour token name like `'bgSurface'`, or any CSS colour / `var()`) | `'bgPage'` |
| `safeTop` | `boolean` (top inset padding on the scroll content) | `!header` |
| `overlayHeader` | `boolean` (header floats over content, e.g. PDP gallery) | — |
| `withTabBar` | `boolean` (bottom padding clears the tab bar) | — |
| `padded` | `boolean` (12px inline padding) | — |
| `gap` | `number` (makes content a flex column with this gap) | — |
| `onScroll` | `(y: number) => void` | — |
| `contentStyle` | `CSSProperties` (merged last into the scroll div) | — |
| `overlay` | `ReactNode` (floats over the content, above the footer, e.g. `NeedHelpButton`; the layer lets taps through) | — |
| `floatingFooter` | `boolean` (the footer floats over the content — the list scrolls behind it, NoonNativeStickyBar — and the content is padded by its height; for see-through footers such as `ActionBar surface="glass"`) | — |

```tsx
// src/flows/plp/ListingScreen.tsx
<Screen header={header} background="bgSurface" onScroll={(y) => setScrolled(y > 4)}>
  …
</Screen>

// src/flows/home/HomeScreen.tsx (tab root, header handles its own inset)
<Screen header={header} background="bgSurface" withTabBar onScroll={onScroll} safeTop={false}>
```

Gotchas:
- A token-name `background` is converted to `var(--nk-color-<kebab>)`; anything not matching `/^[a-z][a-zA-Z0-9]*$/` is used verbatim (`background="var(--nk-palette-anti-flash-white)"` in `checkout/ConfirmationScreen.tsx`).
- Bottom padding is automatic: 16px when there is a `footer`, tab bar height + inset + 16 with `withTabBar`, otherwise inset + 16. Override with `contentStyle={{ paddingBottom: 0 }}`.
- Never add your own `overflow: auto` wrapper or `env(safe-area-inset-*)` paddings; use `var(--nk-inset-top)` / `var(--nk-inset-bottom)` only inside custom headers/footers.
- With a custom header (not `Header`), set `safeTop={false}` and pad the header with `var(--nk-inset-top)` yourself; `Header` already includes it.
- `overlayHeader` positions the header absolutely; use with `safeTop={false}` for edge-to-edge media.

## Header and IconButton

`src/components/Header/Header.tsx`. `Header` is the top bar for pushed screens; it includes the top safe-area inset. The back button appears automatically when `nav.canGoBack`.

| Prop (`HeaderProps`) | Type | Default |
|---|---|---|
| `title` | `ReactNode` (string is styled 16/700 section, ellipsised) | — |
| `subtitle` | `ReactNode` | — |
| `back` | `boolean` | `nav.canGoBack` |
| `onBack` | `() => void` | `nav.back` |
| `right` | `ReactNode` | — |
| `align` | `'center' \| 'left'` | `'center'` |
| `variant` | `'surface' \| 'transparent' \| 'page'` | `'surface'` |
| `bordered` | `boolean` (1px bottom border) | — |
| `children` | `ReactNode` (rendered under the row, e.g. tabs/pills) | — |

`IconButton`: 40px round icon button (bappzaar NoonBackButton).

| Prop | Type | Default |
|---|---|---|
| `icon` | `IconName` (required) | — |
| `onPress` | `() => void` | — |
| `size` | `number` | `iconButton.size` token |
| `iconSize` | `number` | `iconButton.iconSize` token |
| `variant` | `'outline' \| 'glass' \| 'plain' \| 'subtle'` | `'outline'` |
| `badge` | `number` (count bubble, hidden at 0) | — |
| `label` | `string` (aria-label) | the icon name |

```tsx
// src/flows/orders/OrderCancelScreen.tsx
header={<Header title="Select items to cancel" variant="transparent" />}

// src/flows/account/DeletionScreen.tsx
header={<Header back={false} right={<IconButton icon="close" variant="plain" onPress={nav.back} label="Close" />} align="left" />}
```

Gotchas: `align="center"` reserves 88px per side so the title stays centred; with `align="left"` an empty side collapses. `back` and `chevronRight` icons flip in RTL automatically. Fully custom headers (PLP, orders) compose `IconButton` + `Pressable` themselves.

## Text

`src/components/Text/Text.tsx`. Typography primitive: `font: var(--nk-type-<variant>)`, `color: var(--nk-color-<color>)`.

| Prop | Type | Default |
|---|---|---|
| `variant` | `keyof typeof type` (tokens.ts type scale) | `'body'` |
| `color` | `keyof typeof colors` or any CSS colour string | `'textPrimary'` |
| `weight` | `400 \| 500 \| 600 \| 700 \| 800` | — |
| `size` | `number` (px font-size override) | — |
| `lines` | `number` (line clamp) | — |
| `align` | `CSSProperties['textAlign']` | — |
| `as` | `ElementType` | `'span'` |
| `strike` | `boolean` | — |
| `className`, `style` | | — |
| `children` | `ReactNode` | — |
| `html` | `string` (trusted HTML, rendered with `dangerouslySetInnerHTML`, replaces children) | — |

Named variants: `hero titleLarge title titleSmall heading section bodyLarge bodyMedium body bodyBold bodySemibold productTitle caption captionBold micro tab` plus the exact metrics `text<size><Weight>Lh<line>` (e.g. `text14SemiboldLh20`, `text13RegularLh1p35`). Colours: `textPrimary textStrong textBody textSecondary textTertiary textMuted textInverse textProduct brand primary link success danger …` (see `colors` in `src/foundations/tokens.ts`).

```tsx
// src/flows/home/HomeScreen.tsx
<Text variant="section" color="textStrong" style={{ padding: '0 16px' }}>…</Text>
// src/components/ProductCard/ProductCard.tsx
<Text variant="caption" color="textStrong" lines={1} html={product.delivery} />
```

Gotchas: `variant` is typed against the type scale, so a typo fails `tsc`. A colour that looks like a camelCase token name is always turned into `var(--nk-color-…)`, so pass raw colours as `var(--nk-palette-…)` strings. For server copy with custom tags use `HtmlText`.

## HtmlText

`src/components/HtmlText/HtmlText.tsx`. bappzaar `<HtmlView>`: renders server HTML with custom inline tags (`<b> <highlight> <green> <steel> <emerald> <strike> <big> <h4> <br/>` …); `<p>` wrappers are unwrapped when a `stylesheet` is given. Renders a `span`; returns `null` for empty `value`.

| Prop (`HtmlTextProps`) | Type | Default |
|---|---|---|
| `value` | `string \| null \| undefined` (required) | — |
| `stylesheet` | `HtmlStylesheet` = `Partial<Record<string, CSSProperties>>`; `p` styles the root | — |
| `base` | `boolean` (bappzaar base sheet: 13px `textLegacy` root + shared custom tags, zero specificity) | — |
| `lines` | `number` (clamp) | — |
| `className`, `style` | | — |

Two styling modes, as in the ported screens:

```tsx
// stylesheet mode — src/flows/checkout/PromiseInfoScreen.tsx
<HtmlText value={params.textContent} stylesheet={{ p: { display: 'block', marginBottom: 64, fontSize: 16, lineHeight: '22px', color: 'var(--nk-color-text-legacy)' } }} />

// className mode — src/flows/noonone/screens/BundleScreen.tsx
{!!plan.description && <HtmlText value={plan.description} className={styles.planDescription} />}
// target tags from the module: .planDescription :global(highlight) { … }
```

Gotchas: `<b>`/`<strong>` become an explicit 700 only in stylesheet mode. Without `stylesheet` the HTML is injected verbatim; tags only get styling from `base` or your `:global(tag)` rules. Numeric stylesheet values get `px` except unitless keys (`fontWeight`, `opacity`, `lineHeight`, `zIndex`, `flex*`, `order`).

## Button

`src/components/Button/Button.tsx` + `Button.module.css`. Central CTA built on `Pressable`. All values come from the `button` token group (`--nk-button-*`).

| Prop (`ButtonProps`, extends `PressableProps` minus `children`) | Type | Default |
|---|---|---|
| `variant` | `ButtonVariant` | `'primary'` |
| `size` | `'sm' \| 'md' \| 'lg'` (kit variants only) | `'md'` |
| `icon` / `iconRight` | `IconName` (kit variants only; right icon flips in RTL) | — |
| `block` | `boolean` (full width) | — |
| `loading` | `boolean` | — |
| `spinner` | `SpinnerProps` (loader overrides) | — |
| `titleCase` | `boolean` (NoonButton title-casing of a string label) | — |
| `before` / `after` | `ReactNode` (NoonButton `renderBefore` / `renderAfter`; noon variants only) | — |
| `dottedColor` | `string` (`noonDotted` line colour) | `newTextPrimary` token |
| `disabled` | `boolean` (sets `data-disabled`, disabled styles) | — |
| `scale` / `asDiv` | from `PressableProps` (press scale; render as a div inside another button) | — |
| plus every `Pressable` / motion button prop (`onClick`, `className`, `style`, `whileTap`, `transition` …) | | |

Variants:

| Kit variant | Look / typical use |
|---|---|
| `primary` | #3866DF fill: Add to cart, View cart |
| `checkout` | #0057FF: cart Checkout |
| `bright` | #0F7EFF: floating View cart |
| `dark` | #0E0E0E: Login, Continue shopping |
| `outline` | white + blue border: Buy now |
| `secondary` | white + #EAECF0 border: Cancel, Clear all |
| `soft` | #EBF4FF + blue text: wishlist ATC, View options |
| `danger` | #DE1C1C: Yes, sign out |
| `ghost` | text only |

| NoonButton preset | Look |
|---|---|
| `noon` | primary #0076FF / white, r12, padding 14/24, 16/600 |
| `noonSecondary` | white, #0076FF text + 1px border |
| `noonGhost` | transparent, no padding, #0076FF text |
| `noonGhostSecondary` | ghost with `newTextPrimary` text |
| `noonDotted` | no padding, `newTextPrimary` text over a round-dotted SVG underline |

```tsx
// src/flows/checkout/AlternatePhoneScreen.tsx
<Button variant="noon" titleCase disabled={isCtaDisabled || saving} loading={saving} onClick={onSubmitPress} style={{ width: '100%' }}
  spinner={{ size: 20, color: 'var(--nk-color-text-inverse)', track: 'var(--nk-palette-white-alpha40)' }}>
  …
</Button>

// src/flows/checkout/ProviderEarnHelpScreen.tsx
<Button variant="noonDotted" titleCase className={styles.termsLink}>Terms &amp; Conditions</Button>

// src/flows/account/SignedOutScreen.tsx
<Button variant="dark" size="lg" block onClick={() => nav.reset('account/account')}>…</Button>
```

Gotchas:
- Kit variants: `loading` replaces the label with a spinner. Noon variants: the label stays (hidden) and the loader is centred over it, so width never jumps; loader is white on `noon`, blue otherwise, size 24.
- `size`, `icon`, `iconRight` are ignored by `noon*` variants. Use `before` / `after` there.
- Noon preset rules have zero specificity, so a caller `className` can restyle padding, font, width. Press feel: opacity 0.95 + scale 0.98 over 200ms; none for ghost/dotted. Override with `whileTap` / `transition`.
- `toTitleCase` is exported too; skip `titleCase` for Arabic copy.
- Don't build a styled `<button>` for a CTA; pick a variant and adjust metrics via `className`.

## Pressable

`src/components/Pressable/Pressable.tsx`. Port of bappzaar AnimatedPressable: a `motion.button` that springs down on press (`spring.press`). Use for every tappable surface so the prototype shares one press feel. `forwardRef<HTMLButtonElement>`.

| Prop (`PressableProps`, extends `HTMLMotionProps<'button'>`) | Type | Default |
|---|---|---|
| `scale` | `number` (press scale) | `button.pressScale` (0.96) |
| `asDiv` | `boolean` (render `motion.div role="button"` for nesting inside another button) | — |
| `type` | button type | `'button'` |
| all motion/button props (`onClick`, `className`, `style`, `whileTap`, …) | | |

```tsx
// src/flows/plp/ListingScreen.tsx
<Pressable className={styles.searchPill} onClick={() => nav.push('search/search')} scale={0.98}>
  <Icon name="search" size={18} />
  <span className={styles.searchText}>{query}</span>
</Pressable>
```

Gotchas: button resets live in `global.css` under `:where(.nk-pressable)` (zero specificity), so your class wins. Use `scale={1}` for rows that shouldn't shrink. Never nest a `Pressable` button inside another button; use `asDiv`.

## Icon

`src/components/Icon/Icon.tsx`. Named icon set mapped to lucide-react. Flows reference icons by name only.

| Prop (`IconProps`) | Type | Default |
|---|---|---|
| `name` | `IconName` (required) | — |
| `size` | `number` | `20` |
| `color` | `string` | `'currentColor'` |
| `strokeWidth` | `number` | `2` |
| `fill` | `string` | `'none'` |
| `className`, `style` | | — |
| `flipRtl` | `boolean` (mirror in RTL) | — |

Names: `back arrowLeft chevronRight chevronDown chevronUp search camera mic heart share cart home categories account deals plus minus trash star close filter sort pin truck package packageCheck packageOpen returns card gift bell settings shield logout globe language check checkCircle info tag percent clock wallet edit copy upload arrowUp store zap lock chat help sparkles imagePlus flame trendingUp receipt file more calendar phone alert bookmark scan crown building box`.

```tsx
// src/flows/checkout/LearnMoreScreen.tsx
<Icon name={o.icon} size={20} color="var(--nk-color-text-body)" strokeWidth={1.75} className={styles.listIcon} />
```

Gotchas: need a new glyph? Add a key to `icons` in `Icon.tsx` (lucide or your own SVG component), don't import lucide directly in a flow. For real bappzaar artwork use `MaskIcon` or an `<img>`.

## OriginIcon

`src/components/Icon/OriginIcon.tsx` — noon system icons from the Origin Design System Figma (`wFRKiKskxZ4vjIHbDVvngJ` · `6170:153`, layers `M-Icon/System-Icon/<name>`), 399 SVGs in `src/assets/icons/origin/`. **Use it for every system icon in a Figma-based design**; the full catalogue (names, outline / filled pairs) is `references/icons.md`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `name` | `OriginIconName` (required) | — | typed union from `src/components/Icon/originIcons.ts` (generated); Figma `M-Icon/System-Icon/<name>` → `name="<name>"` |
| `filled` | `boolean` | `false` | uses `<name>-filled` when the pair exists (selected / active state) |
| `size` | `number` | `24` | drawn on a 24 grid; prefer 24 / 20 / 16 |
| `color` | `string` | `ref.color('textPrimary')` | any token (`ref.color(...)`, `var(--nk-*)`); tinted via CSS mask (`MaskIcon`) |
| `label` | `string` | — | accessible name; decorative (`aria-hidden`) without it |

```tsx
<OriginIcon name="cart-plus" />
<OriginIcon name="heart" filled={saved} color={saved ? ref.color('wishlist') : ref.color('textPrimary')} />
```

Gotchas: multicolour icons (`mobile-haptic`, `mobile-haptic-filled`) render as `<img>` and ignore `color`. Never edit an SVG to recolour it. Add or update icons with `npm run icons:import -- <exported folder>` (renames, regenerates the typed list and `references/icons.md`). Lucide `Icon` stays for existing flows.

## MaskIcon

<!-- external: Image -->
`src/components/MaskIcon/MaskIcon.tsx`. RN `<Image tintColor>` equivalent: a CSS-masked `span` so a webp/svg silhouette takes any colour.

| Prop | Type | Default |
|---|---|---|
| `src` | `string` (required) | — |
| `color` | `string` (required) | — |
| `size` | `number` (square) | — |
| `width` / `height` | `number` (override `size`; 1x sizes, assets are @3x) | — |
| `style`, `className` | | — |

```tsx
// src/flows/address/components/select.tsx
<MaskIcon src={icons.chevronRightBlue} size={16} color="var(--nk-color-cta)" />
```

## SearchBarButton and SearchInput

`src/components/SearchBar/SearchBar.tsx`. `SearchBarButton` is the home search pill (NoonSearchBarButton: 52h, r12, search + camera webps); it navigates, it doesn't type.

| `SearchBarButton` prop | Type | Default |
|---|---|---|
| `onPress` | `() => void` | — |
| `placeholder` | `string` | `'What are you looking for?'` |
| `rotatingWords` | `string[]` ("Search <word>" vertical ticker, 2.2s) | — |
| `rotatingPrefix` | `string` (the word before the ticker) | `'Search'` |
| `camera` | `boolean` | `true` |
| `height` | `number` | `searchBar.height` token |
| `variant` | `'default' \| '2025'` (`2025`: Homepage Revamp 2025 look — gray400 border, 15/18 Medium placeholder, 18 search icon, 24 divider, 20 camera) | `'default'` |
| `icons` | `{ search?: string; camera?: string; divider?: string }` (Figma artwork for the `2025` variant) | — |

`SearchInput` is the editable field (NoonSearchScreen).

| `SearchInput` prop | Type | Default |
|---|---|---|
| `value` | `string` (required) | — |
| `onChange` | `(v: string) => void` (required) | — |
| `onBack` | `() => void` (shows an arrow inside the field) | — |
| `autoFocus` | `boolean` | — |
| `placeholder` | `string` | `'What are you looking for?'` |
| `right` | `ReactNode` (shown when empty; default camera icon) | — |
| `onSubmit` | `(v: string) => void` (Enter) | — |
| `fill` | `{ from: number; key: number }` — the handoff "picked suggestion" fill: text before `from` holds, the rest fades in (320ms S-curve); change `key` to replay | — |
| `onFieldPress` | `() => void` — read-only field that acts as a button (the PLP bar: tap = back to editing); keeps the camera instead of the clear (x) | — |

```tsx
// src/flows/home/HomeScreen.tsx
<SearchBarButton rotatingWords={rotatingWords} onPress={() => nav.push('search/search')} />
// src/flows/deals/DealsScreen.tsx
<SearchBarButton height={44} onPress={() => nav.push('search/search')} />
// src/flows/search/SearchScreen.tsx
<SearchInput value={q} onChange={setQ} onBack={nav.back} autoFocus onSubmit={go} fill={fill} />
// src/flows/plp/ListingScreen.tsx — same spot as the search screen's bar, so the hand-off never moves it
<SearchInput value={query} onChange={() => undefined} onBack={nav.back} onFieldPress={editQuery} />
```

Homepage 2025 search: `variant="2025"` with `height={48}` (and the Figma `icons`), or override the `searchBar` tokens in the flow (`searchBar: { border: 'var(--nk-palette-gray400)', placeholderFont: 'var(--nk-type-text15-medium-lh18)' }`) rather than editing the defaults.

Gotcha: a clear (x) button replaces `right` whenever `value` is non-empty (unless `onFieldPress` is set). `src/flows/address/components/select.tsx` has its own `SearchInput` (with `disabled`, `style`); don't confuse the two.

## Pill and PillRow

`src/components/Pill/Pill.tsx`. PLP nav pill / filter chip / tag chip (`--nk-pill-*`). Selected: blue border + 600 weight.

| Prop | Type | Default |
|---|---|---|
| `children` | `ReactNode` (required) | — |
| `selected` | `boolean` | — |
| `onPress` | `() => void` | — |
| `icon` | `IconName` (leading) | — |
| `count` | `number` (blue count bubble, pops on change; hidden at 0) | — |
| `dropdown` | `boolean` (trailing chevron) | — |
| `removable` | `boolean` (close icon, only while `selected`) | — |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `variant` | `'nav'` (PLP pill) `\| 'tag'` (home tag chip, r32, 14px) `\| 'filter'` (filter-sheet option, r8, 2px border) | `'nav'` |

`PillRow`: horizontal scroller (`.nk-hscroll`) with the pill row gap. Props: `children: ReactNode`, `padding?: number` (inline padding, default `pill.rowPadding` token).

```tsx
// src/flows/plp/ListingScreen.tsx
<Pill icon="filter" selected={nFilters > 0} count={nFilters} onPress={() => nav.sheet('plp/filters')}>Filter</Pill>
<Pill dropdown selected={n > 0} count={n} onPress={() => nav.sheet('plp/filters', { facet: f.id })}>{f.label}</Pill>

// src/flows/orders/OrdersListScreen.tsx
<PillRow padding={10}>
  {orderFilters.map((f) => (
    <Pill key={f.id} icon={f.icon} selected={filter === f.id} onPress={() => setFilter(f.id)} size="lg">{f.label}</Pill>
  ))}
</PillRow>
```

Gotcha: `size` only changes the `nav` variant (`sm` height, `lg` height/padding/font); `tag` and `filter` ignore it.

## Price and Money

`Price` takes `offSuffix` (default `true`: "n% OFF"; `false`: "n%" as bappzaar carousels show it). `currencySize` is `'small'` (default, 0.7em semibold sign) or `'sale'` (sign at the sale-price size and weight, bappzaar `saleCurrency`).

`src/components/Price/Price.tsx`. PriceDiscounted: sale price with the dirham sign (`currency`, U+E001, drawn by Noontree), struck "was" price and computed "{n}% OFF".

| `Price` prop | Type | Default |
|---|---|---|
| `price` | `number` (required) | — |
| `was` | `number` (shown only if `> price`) | — |
| `size` | `'sm' \| 'md' \| 'lg'` (`md` = 16/700 card; `lg` = PDP 22/700) | `'md'` |
| `showCurrency` | `boolean` | `true` |
| `showDiscount` | `boolean` | `true` |
| `free` | `boolean` (renders green "FREE" instead of the price) | — |

`Money`: inline `currency + formatPrice(value)`, no-wrap. Props: `value: number` (required), `bold?: boolean`.

```tsx
// src/flows/pdp/components/RecoCard.tsx
<Price price={product.price} was={product.was} />
```

Gotchas: never write "AED" or a dollar sign; for custom price layouts use `currency` and `formatPrice` from `src/data`. The currency glyph is 0.7em of the sale font.

## RatingPill and Stars

`src/components/Rating/Rating.tsx`. Also exports `compact(n)` (1234 → `1.2K`).

| `RatingPill` prop | Type | Default |
|---|---|---|
| `rating` | `number` (required; star tinted by score: starLow / starMid / starGood / starGreat) | — |
| `count` | `number` (`sm`: "(1.2K)", `lg`: "1.2K ratings") | — |
| `size` | `'sm' \| 'lg'` (`lg` = 26h PDP pill) | `'sm'` |

| `Stars` prop | Type | Default |
|---|---|---|
| `value` | `number` (required, filled stars) | — |
| `size` | `number` | `16` |
| `onChange` | `(v: number) => void` (makes stars tappable) | — |

```tsx
// src/flows/pdp/components/RecoCard.tsx
{product.rating > 0 && <RatingPill rating={product.rating} count={product.ratingCount} />}
```

Gotcha: `src/flows/pdp/components/Stars.tsx` is a different, flow-local `Stars` (`rating`, `size: IconSize`, `max`); the shared one takes `value`.

## ProductImage

`src/components/ProductImage/ProductImage.tsx`. Product media: `product.image` (object-fit contain) or a tinted radial tile with the product emoji, plus the app's 2% black overlay.

| Prop | Type | Default |
|---|---|---|
| `product` | `Pick<Product, 'emoji' \| 'tint' \| 'image' \| 'title'>` (required) | — |
| `width` | `number \| string` | `'100%'` |
| `height` | `number \| string` (when set, `aspect` is ignored) | — |
| `aspect` | `number` (width / height; 0.8 PLP card, 1/1.2 PDP gallery) | — |
| `radius` | `number` | `0` |
| `emojiScale` | `number` | `0.42` |
| `style` | `CSSProperties` | — |
| `dim` | `boolean` (opacity 0.6, e.g. out of stock) | — |
| `fit` | `'contain' \| 'cover'` (object-fit of `product.image`, bappzaar `resizeMode`) | `'contain'` |

```tsx
// src/flows/cart/VariantsSheet.tsx
<ProductImage product={product} width={80} aspect={3 / 4} radius={10} />
// src/flows/cart/components/InactiveGroup.tsx
<ProductImage key={l.product.id} product={l.product} width={80} height={109} radius={6} />
```

Gotcha: always give it a width plus `height` or `aspect`, otherwise it has no height. Use it for every product picture instead of a bare `<img>`.

## ProductBoxVertical (PLP)

`src/components/ProductBoxVertical/ProductBoxVertical.tsx`. bappzaar `NoonProductBoxVertical` with `isPLP`, values resolved from its `styles.ts` + NoonTokens / NoonMetrics: white card, 0.5 lightGray hairline (drawn as an overlay so the image keeps the full width), r12, padding-bottom 10 · image box 177 × 241 at 390 (`aspect-ratio: 177 / 241`, contain, 2% black overlay; > 1 `product.images` → paged slider with the PillPager) · `CatalogTag` top-start · `WishlistHeart` 24 at 4 / 4 · `QuickAdd` 36 bottom-end · "{brand} {title}" 14/500 18 inkBlack, 2 lines · rating pill star-first (softGray r6) · price row (sale 16 bold neutralBlack, struck was 12 steelColor without currency, "n% OFF" 12/600 greenOff; PLP precision: ≥ 999.99 no decimals) · `NoonNudgeTag` ticker (13/16 slateBlueGray, enter 300 / hold 1000 / exit 450 ms) · coupon tag · express flag 60 × 18 + delivery 12/14 charcoalNavy in a 20-high row. No press feedback. In a 2-column grid the cell must stretch so both boxes in a row share the taller height (`.cell` in `src/flows/plp/plp.module.css`). `wishlist={{ topEnd, footer }}` is bappzaar's `isWishlist` compact view (Wishlist V2): no catalog tag, quick add, nudges or coupon; `topEnd` replaces the heart and `footer` renders as the bottomRow (mt 10, px 8, gap 8) under the ETA row (`src/flows/wishlist/components/WishlistProductBox.tsx`).

| Prop | Type | Default |
|---|---|---|
| `product` | `Product` (required) | — |
| `onPress` | `() => void` | push `pdp/detail` with `productId` |
| `quickAdd` | `boolean` (the 36 "+" quick add) | `true` |

## ProductCard and QuickAdd

`src/components/ProductCard/ProductCard.tsx`. NoonProductBoxVertical: image (0.8 aspect) · `CatalogTag` top-start · `WishlistHeart` top-end · `QuickAdd` bottom-end · title 14/500 2 lines · `RatingPill` · `Price` · `CouponTag` · `EtaBadge` (large; small in the `carousel` variant) from `etaFor(product)`.

| `ProductCard` prop | Type | Default |
|---|---|---|
| `product` | `Product` (required) | — |
| `onPress` | `() => void` | `nav.push('pdp/detail', { productId: product.id })` |
| `quickAdd` | `boolean` | `true` |
| `compact` | `boolean` (carousel: no coupon / delivery rows) | — |
| `width` | `number \| string` (fixed width, `flexShrink: 0`, for carousels) | — |
| `carousel` | `boolean` — bappzaar home `productCarousel` box (NoonProductCard): r8, no hairline, image `width × round((width − 14) · 1.361)` (138 × 169) with an r8 overlay, 24 heart circle, "+" at bottom 6, info inset 4 (+2 bottom), price 6 below the rating with a 16/700 dirham sign, express flag only (18h), discount "n%"; needs a numeric `width` | — |

`QuickAdd`: the kit's one add-to-cart "+" (36×36 white, r8, hairline border, thumb shadow, 22px ink plus) with the NoonProductBoxAddToCart flow as a **shared-element morph** (2026-10-15): one shell whose width springs 36 ⇄ 76 (Apple snappy, `appleSpring(0.3, 0.8)`, ~1% settle, growing towards the card's inner edge) while white crossfades into blue (160ms); inside, every piece is ONE element positioned from the growing edge, so nothing overlaps: the "+" never moves (18px from the edge in both looks) and only shrinks 22 → 16 and turns ink → white; the trash/minus is parked where the stepper puts it (46–70px) so the shell's clip reveals/hides it; the count rises in, slides between the stepper centre and the badge and scales to the badge size. Count changes roll like an odometer (`RollingCount`: old digit up and out, new one up from below; down when decreasing; digits chained right → left 35ms apart, then the trash ⇄ minus glyph). After 2.5s idle it narrows to the blue count badge (tap to reopen); trash at 1 morphs back to the white "+". The count shows optimistically and the cart store update is committed 360ms later as a transition (it re-renders every card), flushed on unmount. No snackbar (bappzaar `useCartActions`); products with sizes open `pdp/variants`. Props: `productId` (required). `QuickAddButton`: the same "+" look with your own `onPress` and a press bounce (non-catalog tiles; `asDiv` inside another button). Used by ProductCard, ProductBoxVertical, MegaDeals, RecoCard, SkuCard (home rails + cart carousels, anchored bottom-right) and the Storefront PDP recommendations; the cart's offers row fades a leaving card out and slides the row closed (`CartCarousel`). LTR geometry (offsets from the right edge).

```tsx
// src/flows/home/HomeScreen.tsx (carousel)
<ProductCard key={p.id} product={p} compact width={homeTokens.carouselCardWidth} />
// src/flows/plp/ListingScreen.tsx (2-column grid)
<ProductCard product={p} />
// src/flows/pdp/components/RecoCard.tsx (custom card reusing the parts)
<WishlistHeart productId={product.id} />
<QuickAdd productId={product.id} />
```

Gotchas: `ProductCard` is the bappzaar NoonProductBoxVertical (0.8 image, 36 quick-add, 16/700 price). The 2025 Figma "SKU" card (home rails, cart carousels, PDP recommendations) has a different footprint; see `SkuCard` in the pick table. Data comes from `Product` in `src/data`; add products there rather than inlining objects. Cart and wishlist state flow through `useDemoStore()` automatically. The grid layout is the caller's (CSS grid in the flow module). RTL mirroring of tag/heart/quick positions is built in.

## SkuCard

`src/components/SkuCard/SkuCard.tsx` — the Figma "SKU" rail card (Homepage Revamp 2025 `1337:5579`, Cart 2.0 `10575:94182`). 134 wide; use it for every horizontal product rail in a Figma-based design, `ProductCard` for grids and the bappzaar ports.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `product` | `Product` (required) | — | from `src/data` |
| `look` | `'feed' \| 'cart'` | `'feed'` | `feed`: white + `skuMediaTint` image box, emerald Best Seller tag, flat rating pill, `skuDiscount`; `cart`: grey bordered box, catalog tag (cart carousels) |
| `badge` | `string \| null` | `product.tag` | top-left tag; `null` hides it |
| `sponsored` | `boolean` | `false` | "Ad" tag in the image box (`text10RegularLh11`) |
| `rating` | `boolean` | `true` | flat rating pill |
| `deliveryNote` | `string` | — | e.g. "Free Delivery" with the truck icon |
| `fulfilment` | `'express' \| 'expressToday' \| null` | `express` when the product is express | yellow pill / "express Today" |
| `imageSize` | `number` | `122` | product image inside the 134×174 box |
| `onPress` | `() => void` | push `pdp/detail` with `productId` | |

Behaviour: "+" → `addToCart` + toast; heart → `toggleWishlist` + toast (solid pink when saved, small pop). Price 15/20 Bold (`text15BoldLh20`) with the dirham sign via `currency`; struck price and % off from `discountPct`. Used by `src/flows/home/components/{ProductRail,RecommendedRail,BrandAdModule}.tsx` and `src/flows/cart/components/CartCarousel.tsx` (`look="cart"`).

## LikeHeart

`src/components/WishlistHeart/LikeHeart.tsx`. The wishlist heart glyph every wishlist toggle uses (`WishlistHeart`, `SkuCard`, Storefront PDP header + recommendation cards): a `size` × `size` slot that plays the `like` Lottie when `on` turns true and rests on the outline / filled frame otherwise. Drop it in place of a heart icon inside your own button; the ripple overflows the slot.

| Prop | Type | Default |
|---|---|---|
| `on` | `boolean` (required): wishlisted | — |
| `size` | `number` (required): the heart icon size it replaces | — |

## WishlistHeart

`src/components/WishlistHeart/WishlistHeart.tsx`. NoonFavourite: heart in a white 70% circle; toggles DemoStore wishlist, plays the `like` Lottie on favourite, shows a toast.

| Prop | Type | Default |
|---|---|---|
| `productId` | `string` (required) | — |
| `size` | `number` (card variant: box = size + 4, icon = size − 6) | `24` |
| `box` | `number` (circle diameter of the card variant; bappzaar NoonFavourite wrapper is 24) | `size + 4` |
| `variant` | `'card' \| 'button'` (`button` = 40px bordered circle, 20px icon, ignores `size`) | `'card'` |
| `toast` | `boolean` ("Added to Wishlist" / "Removed from Wishlist") | `true` |

Gotcha: it calls `stopPropagation`, so it is safe inside a pressable card.

## QuantityStepper

`src/components/QuantityStepper/QuantityStepper.tsx`. −/value/+ control (`stepper` tokens). The minus becomes a trash icon at 1; plus dims at `max`.

| Prop | Type | Default |
|---|---|---|
| `value` | `number` (required) | — |
| `onChange` | `(v: number) => void` (required; called with `value - 1` even at 1, so handle 0 = remove) | — |
| `max` | `number` | `10` |
| `variant` | `'cart'` (92×36 white, grey border) `\| 'filled'` (#3866DF, white) `\| 'soft'` (#EBF4FF, blue) | `'cart'` |
| `width` | `number \| string` | variant width token |

```tsx
// src/flows/wishlist/components/WishlistAtc.tsx
<QuantityStepper variant="soft" value={qty} width="100%" onChange={(v) => setQty(productId, v)} />
```

Gotcha: the cart flow uses its own `src/flows/cart/components/QuantitySelector.tsx` (bappzaar cart selector); use the shared stepper elsewhere.

## Tags: CatalogTag, ExpressBadge, CouponTag, StatusChip, Badge

`src/components/Tag/Tag.tsx`.

| Component | Props (type, default) | What |
|---|---|---|
| `CatalogTag` | `children: ReactNode` (req), `bg?: string` (`bestSellerTag`), `color?: string` (`textInverse`) | "Best Seller": 20h, bottom-end radius 10, 12/600 |
| `ExpressBadge` | `height?: number` (`18`) | `MarketplaceTag kind="express"` |
| `CouponTag` | `children: ReactNode` (req) | 24h r4 dashed green coupon chip with tag icon, ellipsised |
| `StatusChip` | `tone?: Tone` (`'neutral'`), `icon?: IconName`, `children: ReactNode` (req), `style?` | Gradient-tint status chip, 13/600 |
| `Badge` | `children: ReactNode` (req), `bg?: string` (`whiteAlpha70`), `color?: string` (`textMuted`), `style?` | Small 10/500 label |

`Tone` = `'success' | 'neutral' | 'info' | 'warning' | 'danger' | 'plain'`.

```tsx
// src/flows/cart/components/CartCarousel.tsx
<CatalogTag>{p.tag}</CatalogTag>
// src/flows/cart/VirtualBundlesSheet.tsx
{item.deliveryInfo.icon === 'express' && <ExpressBadge height={16} />}
// src/flows/orders/OrdersListScreen.tsx
<StatusChip tone="success" icon="returns">…</StatusChip>
<StatusChip tone="neutral" icon="lock">…</StatusChip>
```

Sponsored "Ad" label, by context (every sponsored element carries one):
- On a product image (Homepage 2025 SKU card): `<Badge bg="var(--nk-palette-white-alpha80)" color={ref.color('textSecondary')}>Ad</Badge>`.
- On a dark hero banner: a dark-alpha bg with white text (the Figma `rgba(0,0,0,.16)` has no token; add a flow token).
- On white PDP cards and rows (Storefront PDP): `bg="var(--nk-palette-border-color)"`, `color={ref.color('priceOld')}`.

Gotcha: `src/flows/noonone/components/plans/PlanCard.tsx` defines a local `Badge` (`html`, `selected`); the shared `Badge` takes children.

## EtaBadge

`src/components/EtaBadge/EtaBadge.tsx`. Origin Design System `_ETA` (Figma `wFRKiKskxZ4vjIHbDVvngJ · 2673:2414`): the estimated-delivery badge on product cards. Tokens: `eta` group (`--nk-eta-*`). Artwork: `src/assets/shared/eta/` (Figma export, unedited); icons `flash-thunder`, `caret-right`, `home-filled` through `OriginIcon`.

| Prop | Values | Notes |
|---|---|---|
| `type` | `minutes` · `supermall` · `expressToday` · `expressTomorrow` · `express` · `market` · `global` | the delivery mode |
| `size` | `large` (default) · `small` | large on primary product cards, small in compact grids, rails and chips |
| `label` | e.g. `Get in`, `Get by` | large only; customisable text |
| `value` | e.g. `15 Mins`, `11 Sep`, `11-23 Sep` | large only; customisable text |

Copy and use cases live in `src/data/eta.ts`: `etaCopy` (fixed words), `etaUseCases` (one preset per Figma variant: `quickCommerce`, `supermall`, `sameDay`, `nextDay`, `expressDated`, `market`, `global`, each with a `…Compact` small twin) and `etaFor(product, size?)`, which derives the badge from `express` / `supermall` and the `delivery` line (`null` when there is no promise).

```tsx
<EtaBadge {...etaFor(product)} />                              // product card
<EtaBadge {...etaUseCases.quickCommerce} value="20 Mins" />     // preset + custom text
<EtaBadge type="global" label="Get by" value="11-23 Sep" />
```

Used by `ProductCard` (large; small in `carousel`) and `ProductBoxVertical` (large). `ExpressBadge` stays for express flags outside the ETA slot (orders, returns, cart sheets).

## MarketplaceTag and MarketplaceWordmark

`src/components/Tag/MarketplaceTag.tsx`. Figma MarketplaceTagsPills (60×18, fully rounded) composed from real SVG layers.

| Component | Props | Default |
|---|---|---|
| `MarketplaceTag` | `kind: MarketplacePill` (req) = `'express' \| 'supermall' \| 'market' \| 'global' \| 'food' \| 'minutes'`; `height?: number` (scales the artwork); `style?` | `height = 18` |
| `MarketplaceWordmark` | `kind: MarketplaceLogo` (req) = `'supermall' \| 'food' \| 'minutes' \| 'noon'`; `height?: number`; `style?` | `height = 12` |

```tsx
// src/flows/plp/ListingScreen.tsx (inside a Pill)
<MarketplaceTag kind="express" height={16} />
// src/flows/checkout/components/CheckoutShipment.tsx
<MarketplaceTag kind="global" height={20} />
// src/flows/orders/components/StatusTag.tsx
<MarketplaceWordmark kind="supermall" height={12} />
```

Gotcha: never redraw the express/supermall pill with text and a background; the artwork is the source of truth. Layer geometry literals in this file are a documented token exception. Checkout 2.0 uses a 63×20 r4.185 supermall / express pill that `MarketplaceTag` doesn't have; it is flow-local in `src/flows/checkout/components/CheckoutShipment.tsx`.

## SectionCard

`src/components/SectionCard/SectionCard.tsx`. NoonSectionCard: white, r16, padding 12, margin `0 12px 12px`, flex column, optional title row (string title = 16/700 `section` in `textStrong`).

| Prop | Type | Default |
|---|---|---|
| `title` | `ReactNode` | — |
| `right` | `ReactNode` (end of the title row) | — |
| `children` | `ReactNode` | — |
| `padding` | `number \| string` | `spacing.s12` |
| `gap` | `number` | `spacing.s12` |
| `margin` | `number \| string` | `` `0 ${spacing.s12}px ${spacing.s12}px` `` |
| `radius` | `number` | `r.r16` |
| `style` | `CSSProperties` | — |
| `onClick` | `() => void` (adds pointer cursor) | — |

```tsx
<SectionCard title="Delivery address" right={<Button variant="noonGhost" onClick={change}>Change</Button>}>
  …
</SectionCard>
```

Gotcha: no flow currently imports the shared one. `account/EditProfileScreen.tsx` has a local `SectionCard` (adds `subtitle`) and `pdp/components/Sections.tsx` a local `Card`. For new screens use the shared `SectionCard` and pass `margin`/`padding` rather than writing another.

## ListRow and ListGroup

`src/components/ListRow/ListRow.tsx`. NoonAccountSectionItem: padding 18/16, 20px icon, 15/500 title, optional 13/400 subtitle, chevron.

| `ListRow` prop | Type | Default |
|---|---|---|
| `title` | `ReactNode` (required) | — |
| `icon` | `IconName` | — |
| `iconNode` | `ReactNode` (replaces `icon`, e.g. a `MaskIcon`) | — |
| `subtitle` | `ReactNode` | — |
| `right` | `ReactNode` (before the chevron, e.g. a value or `Switch as="span"`) | — |
| `chevron` | `boolean` | `true` |
| `onPress` | `() => void` (without it the row is a non-pressing div) | — |
| `danger` | `boolean` (danger colour, e.g. Sign out) | — |
| `paddingY` | `number` | `spacing.s18` |

`ListGroup`: white r14 card that separates rows with `DashedDivider`. Props: `children: ReactNode[] | ReactNode`, `margin?: string | number` (default `` `0 ${spacing.s15}px` ``). Falsy children are skipped.

```tsx
<ListGroup>
  <ListRow icon="package" title="Orders" onPress={() => nav.push('orders/list')} />
  <ListRow icon="returns" title="Returns" onPress={() => nav.push('returns/history')} />
  <ListRow icon="logout" title="Sign out" danger chevron={false} onPress={signOut} />
</ListGroup>
```

Gotcha: no flow imports these yet (account uses `src/flows/account/components/MenuGroup.tsx`); they are the generic version for new settings-style screens.

## Divider, DashedDivider, DottedDivider

`src/components/Divider/Divider.tsx`.

| Component | Props (type, default) |
|---|---|
| `Divider` (solid 1px) | `color?: string` (`borderSubtle`), `margin?: number \| string` (`0`), `vertical?: boolean`, `length?: number \| string` (`'100%'`, vertical only) |
| `DashedDivider` (CSS gradient, dash 4/4) | `color?: string` (`borderSubtle`), `inset?: string \| number` (`'3.5%'`, inline margin), `margin?: number \| string` (`0`, block margin), `dash?: number` (`4`) |
| `DottedDivider` (SVG line) | `color?: string` (`antiFlashWhite` palette), `dash?: string` (`'2, 2'`), `cap?: 'round' \| 'butt'` (`'round'`), `height?: number` (`1`), `width?: string \| number` (`'100%'`), `centered?: boolean`, `style?` |

```tsx
// src/flows/plp/ListingScreen.tsx
<Divider vertical length={24} margin="0 8px" color={plpTokens.pillDivider} />
// src/flows/orders/OrdersListScreen.tsx
<DashedDivider color={ref.color('border')} inset={12} margin="12px 0 0" />
// src/flows/address/SelectScreen.tsx (AddressDottedDivider)
<DottedDivider />
// src/flows/account/NotificationsSheet.tsx (NoonAccountDivider)
<DottedDivider height={2} dash="2,2" cap="butt" centered />
```

Gotchas: `DashedDivider` defaults to a 3.5% inline inset; pass `inset={0}` for full width. Never use `<hr>` or a CSS `border-bottom: dashed` for these.

## BottomBar

`src/components/BottomBar/BottomBar.tsx`. Sticky footer surface (PDP ATC bar, cart checkout): white, top radius 16, `bottomBar` shadow, bottom padding = `--nk-inset-bottom` + 8, column flex.

| Prop | Type | Default |
|---|---|---|
| `children` | `ReactNode` (required) | — |
| `above` | `ReactNode` (rendered above the bar inside the same relative wrapper, e.g. a nudge) | — |
| `radius` | `number` | `r.r16` |
| `gap` | `number` | `spacing.s8` |
| `padding` | `string` | `` `${spacing.s8}px ${spacing.s16}px` `` |

```tsx
<Screen header={<Header title="Review" />} footer={
  <BottomBar>
    <Button variant="noon" block onClick={next}>Continue</Button>
  </BottomBar>
}>
```

Gotcha: pass it to `Screen footer`; it already includes the bottom safe area. Existing flows build their own footers (`cart/components/CartFooter.tsx`, checkout), so check those first when matching a specific bappzaar footer.

## BottomSheet slots: SheetHeader, SheetBody, SheetFooter

`src/components/BottomSheet/BottomSheet.tsx`. **The default bottom sheet**: Origin Design System M-BottomSheet (Figma `wFRKiKskxZ4vjIHbDVvngJ · 3207:15`). The navigator draws the chrome for a `presentation: 'sheet'` screen: scrim, grabber above the sheet, 12px floating inset, r16 corners, max 680. The screen renders these slots, in this order. Recipe and rules: `references/screen-recipes.md` §6.

| Component | Props | Notes |
|---|---|---|
| `SheetHeader` | `title?`, `subtitle?`, `leading?`, `trailing?`, `align?: 'start' \| 'center'`, `onClose?`, `children?` (custom content) | 48 high, 12px sides. Shows the close X (44×44) **only** when the screen sets `sheet: { grabber: false }`. With a grabber there is never a close button |
| `SheetBody` | `inset?` (default true: 12px sides), `className?`, `style?` | Any content. Scrolls (`nk-scroll`) once the sheet reaches 680 |
| `SheetFooter` | `primary?`, `secondary?` (`{ label, onPress, disabled?, loading?, icon?, iconRight? }`), `top?`, `bottom?`, `children?` | M-StackedActionBar: 12px padding, 12 gap. Primary is `Button variant="bright" size="lg"` (H52, r12); secondary is white with a `#D6E9FF` border and `#0F61FF` text |

`useSheet()` (`src/kit/sheet.ts`) returns `{ layout, grabber, dismiss }` inside a sheet, or `null` when the screen isn't presented as one.

## NeedHelpButton

`src/components/NeedHelpButton/NeedHelpButton.tsx` — floating help pill (Accounts Figma `4NvyqO60K7Xn4gRJrkWmzQ` · `8924:67388`): white, 2px `--nk-palette-light-blue` ring, full radius, `shadow.floating`, 20px `OriginIcon name="message"` in `--nk-color-brand-blue` + "Need help?" in `text16SemiboldLh20`. Tokens: `needHelp` group (`--nk-need-help-*`). Render it through `Screen`'s `overlay` slot so it floats above the content.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `collapsed` | `boolean` (required) | — | folds into the 48px icon circle anchored to the right edge |
| `onPress` | `() => void` (required) | — | |
| `label` | `string` | `'Need help?'` | |
| `aboveTabBar` | `boolean` | `true` | sits `needHelp.inset` above the tab bar; `false` = above the home indicator |

Motion: the width springs between the pill and the circle (`appleSpring(0.38, 0.9)`); the label fades + blurs out first (`duration.fast`, `easing.in`) and comes back 80ms behind the width (`duration.base`, `easing.out`); the icon pops (`spring.bouncy`) on every change; the button pops in on mount (`spring.bouncy`, delay 0.35).

```tsx
// src/flows/account/AccountScreen.tsx, src/flows/home/HomeScreen.tsx
const [scrolled, setScrolled] = useState(false);
<Screen withTabBar onScroll={(y) => setScrolled(y > 24)} overlay={<NeedHelpButton collapsed={scrolled} onPress={openHelp} />}>
```

## TabBar

`src/components/TabBar/TabBar.tsx`. Bottom tabs Home · Categories · Deals · Account · Cart with the app's tab webps, cart count badge from `useDemoStore().cartCount`, `nav.switchTab` on press.

| Prop | Type | Default |
|---|---|---|
| `active` | `TabId` (required) | — |
| `variant` | unset = **Liquid Glass** · `'classic'` (opaque pre-iOS-26 bar) · `'field'` (Field M-Bottomnav) | glass |
| `autoHide` | glass: hide on scroll, following the vertical scroll of the `<Screen>` it sits in | `false` (the navigator sets it on tab roots) |
| `covered` | autoHide: the screen is covered → release, bar restored | — |

You don't render it yourself: `src/kit/Navigator.tsx` renders it for the root screen of a flow whose `defineFlow` has `tabBar: { tab, screens, variant?, scrollHide? }`, e.g. `src/flows/home/index.ts`: `tabBar: { tab: 'home', screens: ['home'] }`. On that screen pass `withTabBar` to `Screen`.

**Liquid Glass (default)** — icons in `--nk-tab-bar-glass-icon` (#1D2539) in both states (the tab webps as `MaskIcon` masks; the filled shape marks the selection); cart badge #1D2539 with a 1.5px white ring (`glassBadgeBg` / `glassBadgeBorder`) — bappzaar `noon/ios/liquid-upgrade` (iOS 26; `UIDesignRequiresCompatibility` false): the same native UITabBar, which iOS 26 draws as a floating glass platter. 62 high, 21 from the sides, its bottom 13 below the home-indicator inset (platter + gap = `layout.tabBar` + inset, so every screen's reserved bottom space still fits); backdrop blur + saturate over a translucent white tint, a specular rim and sheen; icons only at 7/8 of the classic size, no labels (the tab name is the aria-label); the selected tab sits in a lens capsule that swells under the finger (1.08). Switching tabs replicates the iOS 26 selection: each tab root draws its own bar, and the new bar starts the lens on the tab it was tapped from, slides it over on a slightly underdamped spring (`glassLensStiffness` 320 / `glassLensDamping` 26) with a droplet stretch (scaleX +0.14 per tab travelled, max +0.4; scaleY −0.1; 0.42s), clipped to the platter so the overshoot squashes into the rim, while the icon tints cross-fade (0.2s). Reduced motion: no slide, instant tint. Content scrolls behind it. Hide on scroll (`tabBar.scrollHide`, default true; categories off) = ScrollVisibilityProvider 1:1 (`src/kit/tabBarScroll.ts`: shown at the top / above 150, hides after 64 down, returns after 24 up); the bar publishes `--nk-tab-hide` (0 → 1) on the screen so docked footers follow it (`ActionBar aboveTabBar`, cart sticky bar). Docked content sits `--nk-tab-bar-floating-gap` (10, FLOATING_BOTTOM_GAP) above the bar. Glass falls back to near-opaque white without `backdrop-filter` or with reduced transparency. Demo: `fieldds/glass`.

Gotchas:
- Tab labels and icons are fixed in `TabBar.tsx` (dynamic tab falls back to "Deals").
- The platter geometry and material are UIKit's, not in bappzaar (iOS draws them); the values here approximate the iOS 26 tab bar. A screen that hides the bar itself (PLP `--plp-tab-hide`, PDP `--pdp-tab-hide`) renders `<TabBar>` without `autoHide`.
- `variant="classic"` is bappzaar master's native bar 1:1 (NoonApp.getTab / getTabOptions → react-native-navigation UITabBar): 49pt row, opaque white, shadow 0 −3 4 at 0.08, no indicator; icons at native size (32, deals 25) with iconInsets top 3; labels semibold 14 in both states, `charcoalGreyColor` #404553 → `sapphire` #1155CB; cart badge = the native badge, an 18-high `accentColor` capsule with 13pt white system text (no ring) at the icon's top-right. Tabs switch instantly. The 2025 Figma nav (43×4 indicator, 12/20 labels) is not used.
- `.bar` / the glass dock are `position: absolute; bottom: 0`. To show it under a pushed screen's footer (Figma PDP), wrap `<TabBar active="home" />` in a `position: relative` box of height `calc(var(--nk-layout-tab-bar) + var(--nk-inset-bottom))`.

## Skeleton

`src/components/Skeleton/Skeleton.tsx`. Shimmer block (`nk-shimmer` keyframes in `global.css`). `look="band"` is the Brand Widget PLP skeleton 1:1 (`Skeleton.module.css`): #F6F5FA (`skeletonBase`) with one 195px white band leaning 17°, sweeping −200 → 640px every 1.867s, first pass at `--nk-skeleton-at` (default 0.12s); the search page's intro, the PLP's card (`SkeletonCard`) and chip (`RevealChip`) skeletons and the address flow's loading states (Address Book listing, search results, map locate rows: `src/flows/address/components/select.tsx`, `map.tsx`) use it. Pair it with `SkeletonReveal` (skeleton = `<Skeleton look="band" height="100%" radius=… />` over each element's own box).

| Prop | Type | Default |
|---|---|---|
| `width` | `number \| string` | `'100%'` |
| `height` | `number \| string` | `14` |
| `radius` | `number \| string` | `r.r6` |
| `look` | `'default' \| 'band'` | `'default'` |
| `style` | `CSSProperties` | — |

```tsx
// src/flows/plp/components/SkeletonCard.tsx (same footprint as ProductCard)
<Skeleton radius={0} style={{ aspectRatio: '0.8', height: 'auto' }} />
<Skeleton height={12} width="70%" />
// src/flows/checkout/components/BurnSection.tsx
<Skeleton width={49} height={49} radius={8} />
```

Gotcha: build loading states with the same footprint as the loaded content so the swap doesn't jump.

## Spinner

`src/components/Spinner/Spinner.tsx`. Ring (bappzaar Loader / ActivityIndicator) or 8-petal iOS indicator. `role="status"`.

| Prop (`SpinnerProps`) | Type | Default |
|---|---|---|
| `variant` | `'ring' \| 'ios'` | `'ring'` |
| `size` | `number` | `20` |
| `color` | `string` (arc / petal colour) | `'currentColor'` |
| `track` | `string` (ring only; rest of the ring, arc on top) | — |
| `thickness` | `number` (ring only) | `2` |
| `gap` | `'top' \| 'right'` (ring without track: transparent side) | `'top'` |
| `duration` | `number` (seconds per turn) | `0.8` |
| `className`, `style` | | — |
| `label` | `string` (aria-label) | `'Loading'` |

```tsx
// src/flows/address/components/select.tsx
<Spinner variant="ios" color="var(--nk-color-cta)" />
// src/flows/cart/components/CartItem.tsx
<Spinner size={14} thickness={14 / 9} duration={0.7} color="var(--nk-color-text-ink)" />
// src/flows/cards/components/primitives.tsx
<Spinner color={ref.color('textInverse')} gap="right" duration={0.75} />
```

Gotcha: inside a CTA use `Button loading` (+ `spinner` overrides) instead of placing a Spinner by hand. Pass colours as `var(--nk-…)`, not hex.

## Lottie

`src/components/Lottie/Lottie.tsx`. dotLottie player. Built-in names (`lotties`, type `LottieName`): `atcCheck boxAnim favourite orderConf orderConfirmedCheck reviewCheck sliderArrow starLoading`.

| Prop | Type | Default |
|---|---|---|
| `name` | `LottieName` | — |
| `src` | `string` (imported `.lottie` file; wins over `name`) | — |
| `loop` | `boolean` | `false` |
| `autoplay` | `boolean` | `true` |
| `size` | `number` (square width/height) | — |
| `style` | `CSSProperties` | — |
| `speed` | `number` | `1` |
| `onComplete` | `() => void` (a non-looping play ended) | — |
| `onLoad` | `() => void` (animation data loaded; autoplay starts then) | — |
| `reducedMotionFrame` | `number` (0–1) or `'auto'` (frame held under reduced motion; `'auto'` picks the most complete non-blank frame) | `'auto'` |

```tsx
// src/flows/checkout/PlacingScreen.tsx
<Lottie name="boxAnim" loop style={{ width: '100%', height: '100%' }} />
<Lottie name="orderConf" style={{ width: '100%', height: '100%' }} onComplete={onTickFinish} />
// src/flows/pdp/AddedSheet.tsx
<Lottie name="atcCheck" style={{ width: '100%', height: '100%' }} />
```

Gotcha: give it a size (`size` or `style` width/height), otherwise it collapses. Flow-specific lotties go in `src/assets/<flow>/` and are passed via `src`; shared ones are added to `src/assets/lotties` and the `lotties` map.

## Segmented

`src/components/Segmented/Segmented.tsx`. Language-toggle style segmented control: `bgSubtle` pill, white sliding thumb (`layoutId`, 250ms ease-out).

| Prop | Type | Default |
|---|---|---|
| `options` | `{ value: T; label: string }[]` (required) | — |
| `value` | `T extends string` (required) | — |
| `onChange` | `(v: T) => void` (required) | — |
| `width` | `number` | — |

```tsx
<Segmented options={[{ value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }]} value={lang} onChange={setLang} width={126} />
```

Gotcha: not used by any flow yet. Selected label is 12/600, unselected 14/500 (as in the source).

## Switch

`src/components/Switch/Switch.tsx`. Toggle (react-native-switch / PaymentSwitchV2); mirrors in RTL.

| Prop (`SwitchProps`) | Type | Default |
|---|---|---|
| `value` | `boolean` (required) | — |
| `onChange` | `(value: boolean) => void` (omit with `as="span"`) | — |
| `label` | `string` (aria-label) | — |
| `width` | `number` | `37` |
| `height` | `number` | `20` |
| `knob` | `number` | `16` |
| `inset` | `number` | `2` |
| `onColor` | `string` | `ref.color('textPrimary')` |
| `offColor` | `string` | `ref.color('border')` |
| `knobColor` | `string` | `ref.color('bgSurface')` |
| `transition` | motion `Transition` (knob slide) | `{ duration: 0.2, ease: easing.out }` |
| `colorTransition` | `string` (CSS transition) | `'background-color 0.2s'` |
| `as` | `'button' \| 'span'` (`span` = visual only, inside a pressable row) | `'button'` |
| `className`, `style` | | — |

```tsx
// src/flows/account/NotificationsSheet.tsx
<Switch value={!!values[pref.code]} label={pref.text} onChange={() => setValues((v) => ({ ...v, [pref.code]: !v[pref.code] }))} />
// src/flows/checkout/components/PaymentMethods.tsx (row owns the tap)
<Switch as="span" value={useCredits} width={29.6} height={16} knob={12.8} inset={1.6} onColor="var(--nk-color-cta)" offColor="var(--nk-palette-noon-grey3)" transition={spring.press} />
```

## Checkbox

`src/components/Checkbox/Checkbox.tsx`. Squircle checkbox glyph (bappzaar `NoonIcons.squareCheckboxSVG`). Purely visual, `aria-hidden`: wrap it in the `Pressable` row that owns the toggle.

| Prop | Type | Default |
|---|---|---|
| `checked` | `boolean` (required) | — |
| `color` | `string` | `'currentColor'` |
| `size` | `number` | `20` |

```tsx
<Pressable className={styles.row} onClick={() => setOn(!on)} scale={1} role="checkbox" aria-checked={on}>
  <Checkbox checked={on} color={on ? 'var(--nk-color-cta)' : 'var(--nk-color-border-strong)'} />
  <Text variant="body">Leave at the door</Text>
</Pressable>
```

## Snackbar and SnackbarStack

`src/components/Snackbar/Snackbar.tsx`. **The default snackbar**: Origin Design System M-Toast (Figma `wFRKiKskxZ4vjIHbDVvngJ · 4227:76702`) and M-Stacked Toast (`4229:76747`). `nav.toast` renders it, so most screens never import it.

| Prop | Type | Notes |
|---|---|---|
| `type` | `'dark' \| 'light' \| 'error' \| 'success'` | default `dark` (#1D2539). Use `error` / `success` only for that status; `dark` / `light` for neutral info |
| `title` | `ReactNode` (required) | B14/SemiBold, one line, truncates |
| `subtitle` | `ReactNode` | B12/Regular, one line; with `onSubtitlePress` it gets a 16px chevron and becomes a link |
| `asset` | `ReactNode` | leading icon / avatar, 20–40 box |
| `action` | `{ label, onPress }` | trailing button: white-16% p8 r8 (Light: 32h white, `#EAECF0` border) |
| `SnackbarStack` `count` | `number` | `count >= 2` draws the back card peeking 12px above, 12px narrower each side |

Metrics: 351 wide (300–440), r14, 1px `rgba(255,255,255,0.08)` border (Light: `#F2F3F7`), drop-shadow `0 12 14 rgba(11,12,14,0.1)`, content padding 12 and gap 8. Tokens: `--nk-snackbar-*`.

```tsx
nav.toast('Invoice downloaded', { type: 'success' });
nav.toast('Added to wishlist', { subtitle: 'View wishlist', onSubtitlePress: () => nav.push('wishlist/wishlist'), action: { label: 'Undo', onPress: undo } });
```

`nav.toast` queues up to 3 messages. The newest shows in front; while two or more are active it renders as `SnackbarStack`, and it collapses back to one `Snackbar` as they expire. `tone` (`default` / `success` / `error`) still works as an alias of `type`.

## Toast (host)

`src/components/Toast/Toast.tsx`. Self-dismissing toast/snackbar host: mounts `item` in `AnimatePresence`, calls `onHide(item)` after `duration`, animates out when the item clears. Look and motion come from the caller.

| Prop (`ToastProps<T>`, extends `HTMLMotionProps<'div'>` minus `children`) | Type | Default |
|---|---|---|
| `item` | `T \| null \| undefined` (required; null = hidden, new key restarts timer) | — |
| `itemKey` | `(item: T) => string \| number` | `item.id` |
| `duration` | `number` ms (required) | — |
| `onHide` | `(item: T) => void` (required; clear the item here) | — |
| `layerClassName` | `string` (always-mounted positioning wrapper) | — |
| `children` | `(item: T) => ReactNode` (required, render function) | — |
| plus motion props (`className`, `initial`, `animate`, `exit`, `transition`, `role` …) on the animated div | | |

```tsx
// src/flows/cart/components/CartSnackBar.tsx
<Toast item={product} duration={3000} onHide={onHide} layerClassName={styles.overlay} className={styles.wrapper}
  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '110%' }}
  transition={{ type: 'spring', damping: 16, stiffness: 120, mass: 0.7 }}>
  {(p) => <button type="button" className={styles.container} onClick={onPress}>…</button>}
</Toast>
```

Gotchas: for a plain message use `nav.toast(title, { type, subtitle, onSubtitlePress, icon, action, duration })` (Origin M-Toast, see Snackbar above), as `WishlistHeart` and `pdp/variants` do. Use the `Toast` host only for bespoke toasts (checkout `VoucherToast.tsx`, address `primitives.tsx`, cart snackbar). Items without an `id` need `itemKey`.

---

## Field Design System (Origin, coded)

[Field Design System](https://github.com/ayaneshu/field-design-system) is the coded Origin DS (`M-*` components). The
kit carries it as **opt-in variants** on the existing components plus five new components; the default look of every
existing component is unchanged, so ported screens stay 1:1. Use the Field pieces for new Origin-era screens (design-rules
§0). Mapping, token notes and gaps: [`references/field-ds.md`](references/field-ds.md). Gallery: route `fieldds/gallery`. Colours are the
`field` token group (`var(--nk-field-<key>)`, `field.<key>`); type `fieldB14Medium` … (`var(--nk-type-field-b14-medium)`,
letter-spacing `var(--nk-field-tracking-b)`); motion `fieldMotion` (`src/motion/presets.ts`).

| Field (M-*) | Kit |
|---|---|
| PrimaryButton · SecondaryButton · SecondaryNeutralButton · NeutralButton · TextButton · NeutralTextButton · RoundButton | `Button variant="fieldPrimary" \| "fieldSecondary" \| "fieldSecondaryNeutral" \| "fieldNeutral" \| "fieldText" \| "fieldNeutralText" \| "fieldRound"` + `fieldSize="H56" \| "H52" \| "H48" \| "H40" \| "H36" \| "H32" \| "A14" \| "A12"` |
| IconButton | `IconButton variant="fieldDefault" \| "fieldGhost" \| "fieldAction"`, `size={40 \| 36}`, `disabled` |
| PageHeader (title, title-center) | `Header variant="field"` (+ `image`) |
| ActionBar | `ActionBar` (new); `SheetFooter layout tone leading` |
| BottomSheet | the navigator's Origin sheet + `SheetHeader` / `SheetBody` / `SheetFooter` (already) |
| Toast | `nav.toast(title, { action: 'close' })` → `Snackbar action="close" onClose` |
| BottomNav | `TabBar variant="field"` (flow `tabBar: { …, variant: 'field' }`) |
| Checkbox · Radio | `Checkbox variant="field" onChange` · `Radio` (new) |
| Toggle (on/off) | `Switch variant="field" size={16 \| 20 \| 24}` |
| Switch (2–4 options) | `Segmented variant="field" size={40 \| 48}` |
| FilterChip | `Pill variant="fieldChip"` (+ `onClear`, `disabled`, `fieldIcon`, `fieldTrailingIcon`) |
| InfoBanner | `StatusChip variant="field" size shape` (tones + `supermall`, `purple`) |
| RatingInput | `Stars variant="field" onChange size={20 \| 28 \| 32} clearable` |
| InputText · InputTextarea | `TextField` · `TextArea` (new) |
| SearchBar | `SearchInput variant="field" fieldSize="H48" \| "H44" elevation iconLeft iconRight iconRightTwo` |
| ListItem | `ListRow variant="field" size leading titleSlot trailing` |
| Accordion | `Accordion` (new) |
| Divider | `Divider emphasis="low" \| "high"`, `DashedDivider emphasis gap` |

Gotcha: Field's names differ from the kit's. Field **Switch** is the kit `Segmented`, Field **Toggle** is the kit
`Switch`, Field **FilterChip** is `Pill`, **InfoBanner** is `StatusChip`, **ListItem** is `ListRow`.

```tsx
<Button variant="fieldPrimary" fieldSize="H52" block loading={busy}>Continue</Button>
<Switch variant="field" value={on} onChange={setOn} label="Notifications" />
<Pill variant="fieldChip" selected={n > 0} count={n} onPress={open} onClear={clearAll}>Filter</Pill>
<StatusChip variant="field" tone="supermall" size="large">supermall</StatusChip>
<Screen footer={<ActionBar layout="split" tone="neutral" secondary={{ label: 'Reset', onPress: reset }} primary={{ label: 'Apply', onPress: apply }} />}>
```

## GlassFade and the shared glass

`src/components/Glass/`. **One Liquid Glass material** for every floating element: `Glass.module.css` `.glass` (tint, `backdrop-filter`, rim, shadow, highlight, sheen; reduced-transparency / no-backdrop fallback) — compose it in CSS (`composes: glass from '…/components/Glass/Glass.module.css'`) and add the geometry. Used by the glass `TabBar`, the PDP sticky card (`SfAtcBar`) and `ActionBar surface="glass"`; controls on the glass use `--nk-tab-bar-glass-inner-fill` (whiteAlpha40) instead of white. Don't hand-roll another glass.

`GlassFade` (`className?`, `style?`): the layer under floating glass containers — a progressive blur (four masked backdrop blurs, 1 → 8px, stronger towards the bottom) under a transparent → white gradient (`fadeFrom` → `fadeMid` → `fadeTo`), so content scrolling under the glass blends in. Absolute at the bottom of its positioned parent; set `top` / `height` (`--nk-tab-bar-fade-extend`, 48, above the container). The glass `TabBar` brings one; a sticky footer that brings its own marks itself `data-glass-footer` and the tab bar's fade hides (one fade per screen).

```tsx
<div className={styles.sticky} data-glass-footer="">
  <GlassFade className={styles.fade} /> {/* .fade { top: calc(-1 * var(--nk-tab-bar-fade-extend)); } */}
  <div className={styles.card}>…</div>
</div>
```

## Radio

`src/components/Radio/Radio.tsx`. Field M-Radio: off = white disc + 1px `border/medium` ring, on = `text-n-icon/action`
#0F61FF disc with a white tick drawn in (select 220ms, recede 180ms, tick after 120ms); about 44px touch target.

| Prop | Type | Default |
|---|---|---|
| `checked` | `boolean` (required) | — |
| `onChange` | `(checked: true) => void`; fires only when an unselected radio is tapped. Omit → a visual span inside your own pressable row | — |
| `size` | `16 \| 20 \| 24` | `24` |
| `disabled` | `boolean` | `false` |
| `label` | `string` (aria-label) | — |

```tsx
<Radio checked={plan === 'fast'} onChange={() => setPlan('fast')} label="Fast delivery" size={20} />
```

## ActionBar

`src/components/ActionBar/ActionBar.tsx`. Field M-ActionBar: the footer of a screen or sheet. White, padding 12, bottom
inset below it.

| Prop | Type | Default |
|---|---|---|
| `layout` | `'single' \| 'stacked' \| 'split' \| 'leadingTrailing'` (stacked gap 12; split flex 1 gap 12; leadingTrailing = `leading` slot + primary at H48, gap 8; others H52) | `'single'` |
| `tone` | `'action'` (fieldPrimary / fieldSecondary) `\| 'neutral'` (fieldNeutral / fieldSecondaryNeutral) | `'action'` |
| `primary` · `secondary` | `{ label, onPress, disabled?, loading?, icon?, iconRight? }` | — |
| `top` | `ReactNode` above the buttons (single / stacked) | — |
| `leading` | `ReactNode` (leadingTrailing; in split it replaces the secondary) | — |
| `inset` | `boolean` (adds `var(--nk-inset-bottom)`) | `true` |

```tsx
<ActionBar layout="leadingTrailing" leading={<Money value={249} bold />} primary={{ label: 'Add to cart', onPress: add }} />
```

| `surface` | `'solid'` · `'glass'` (liquid-upgrade embedded sticky bar: clear glass, r24, running on behind the bottom tab) | `'solid'` |
| `aboveTabBar` | dock the content 10 above the glass tab bar and follow it while it hides on scroll | — |

`SheetFooter` takes the same `layout` / `tone` / `leading` (opt-in; without them it renders as before). A glass footer needs content behind it: put it in `<Screen floatingFooter footer={…}>` (the footer floats over the content, which is padded by its height).

## Accordion

`src/components/Accordion/Accordion.tsx`. Field M-Accordion: r12 card; header min 44, padding 12, #F9F9FB, B14
SemiBold title, optional leading icon, 20px chevron turning 180°; body #F9F9FB padding 12 under a 1px gap; height +
opacity 320ms open / 260ms close (`fieldMotion.ease.standard`).

| Prop | Type | Default |
|---|---|---|
| `title` | `ReactNode` (required) | — |
| `children` | `ReactNode` (a string renders as B14 Regular) | — |
| `expanded` · `onExpandedChange` | controlled | — |
| `defaultExpanded` | `boolean` | `false` |
| `iconLeft` | `OriginIconName \| ReactNode` | — |

```tsx
<Accordion title="Specifications" iconLeft="info-circle" defaultExpanded>Water resistant to 50m.</Accordion>
```

## TextField

`src/components/TextField/TextField.tsx`. Field M-InputText: 48h (inline label 56), r12, 1px border (`border/primary`
→ `border/medium` on focus, 160ms; error `border/error_bold`), padding 0 16, B14 Medium text, 20px slots. Ref → `<input>`.
`FieldLabel` and `FieldHelper` (`TextField/parts.tsx`) are the shared label and helper rows of TextField and TextArea;
internal, not exported from the package.

| Prop | Type | Default |
|---|---|---|
| `value` · `defaultValue` · `onChange` | `string` · `string` · `(value: string) => void` | — · `''` · — |
| `label` · `labelMode` · `required` | `ReactNode` · `'external' \| 'inline' \| 'none'` · `boolean` | — · `'external'` · — |
| `placeholder` · `helperText` | `string` · `ReactNode` | — |
| `error` | `boolean \| string` (a string replaces the helper) | `false` |
| `maxLength` · `showCounter` | `number` · `boolean` | — |
| `leftSlot` · `rightSlot` | `ReactNode` (20×20) | — |
| `disabled` · `readOnly` | `boolean` | `false` |
| `type` · `inputMode` · `autoComplete` · `autoFocus` · `name` · `id` · `onSubmit` | input attributes; `onSubmit(value)` on Enter | `type="text"` |

```tsx
<TextField label="Email" required value={email} onChange={setEmail} error={bad && 'Enter a valid email'} helperText="We'll send the receipt here" />
```

## TextArea

`src/components/TextArea/TextArea.tsx`. Field M-InputTextarea: min 180h, r12, padding 16/14, same label, helper,
error and disabled states as `TextField`; grows to `maxHeight`, then scrolls; counter "n/max". Ref → `<textarea>`.
Props: `value`, `defaultValue`, `onChange(value)`, `label`, `required`, `placeholder`, `helperText`, `error`,
`disabled`, `readOnly`, `maxLength`, `showCounter`, `minHeight` (180), `maxHeight`, `rows` (6), `autoFocus`, `name`, `id`.

```tsx
<TextArea label="Delivery note" maxLength={200} showCounter value={note} onChange={setNote} />
```

---

## Search before you create

Before you write any new component (shared or flow-local), search for one that already does the job. Run all three; it takes seconds:

```bash
# 1. the API: every shared component + the flow-local index (names, files, props)
rg -n "<Name>|<keyword>" .claude/skills/noon-ui/references/component-api.generated.md
# 2. the code: exported and local components with that name or role, shared and in every flow
rg -n "export (function|const) <Name>|function <Name>\b" src/components src/flows
rg -n -i "<keyword>" src/flows/*/components --glob "*.tsx" -l     # e.g. stepper, chip, banner, progress
# 3. look-alikes already flagged
node scripts/check-duplicates.mjs src/flows/<flow>
```

Then decide, in this order:

1. **A shared component fits** (same role; differences are props, a `className` or a flow token override) → use it. Don't wrap it in a flow-local copy to change a colour.
2. **A shared component almost fits** (one missing prop / variant used by the source design) → use it and report the missing prop; adding it to `src/components` is a separate, backward-compatible change (new optional prop, default = current behaviour).
3. **A flow-local component in another flow fits** → don't copy it. Import it only if the flows are siblings in the same area (membership ↔ noonone); otherwise build yours flow-local and note it as a promotion candidate (below).
4. **Nothing fits** → don't invent a look. Pills, chips, tabs, toggles, badges, buttons, cards, rows and sheets always come from the existing design languages (`references/design-rules.md` §0). Name the closest existing component and what differs, and ask. Build a new one (flow-local in `src/flows/<flow>/components/`, then "Building a new component") only when the user explicitly asks for it, or confirms after you ask. A flow-local composition of existing pieces (a section, a card body) needs no ask.

Say which of the four you chose, and why, in the plan (SKILL.md workflow step 5).

## Duplicates and promotion

`node scripts/check-duplicates.mjs` (`--all`, `--json`, or a path) reports likely duplicates: flow-local components whose name or props match a shared or another flow's component, identical / near-identical CSS-module rule blocks across flows, and inline SVG paths repeated in several files. It is a report only: it never edits or moves code, and nothing is promoted automatically.

The rule: **evaluate intended reuse and the API first, then promote.** A pair the script flags is a question, not a fix:

- Same role and the same source component (bappzaar / Figma) in two flows → promotion candidate: design one API (props named for the role, defaults = the more common use, variants for the real differences), move it to `src/components/<Name>/` with a doc comment, migrate both callers, `visual:snap` before/after. One PR per promotion.
- Same name, different job (address `SearchInput` vs the shared one, pdp `Stars`, noonone `Badge`) → keep local; rename only if the clash confuses readers, and mention it in the gotcha of the shared component here.
- Identical CSS blocks → reuse the component that owns the look; if the block is just a layout idiom (row with gap, absolute fill), leave it.
- Repeated SVG paths → an `OriginIcon`, an asset + `MaskIcon`, or one flow-local icon component.

Current top candidates (from the report): `DashedLine` (membership `components/primitives.tsx`, noonone `components/landing/DashedLine.tsx`, identical props), `PlanMembers` and `SubscriptionButton` (membership and noonone, both ports of noon One), `PaymentCard` (cards vs checkout) and `AddressCard` (address vs checkout, different jobs), `DynamicInvoice` (cart vs checkout), and the account-local `SectionCard` (should use the shared one with `margin` / `padding`).

## Building a new component

Only after "Search before you create". Start flow-local; promote when a second flow needs it (see "Duplicates and promotion").

1. **Location.** Flow-only: `src/flows/<flow>/components/<Name>.tsx` (+ a CSS module). Shared: `src/components/<Name>/<Name>.tsx` + `<Name>.module.css`, one folder per component (related exports may share the file, like `Header` + `IconButton`).
2. **Doc comment** on the export naming the bappzaar component / Figma node it ports and its variants and key metrics, e.g. `/** NoonSectionCard: white, r16, padding 12, margin 0 12 12, optional 16/700 title row. */`.
3. **Tokens only.** CSS: `var(--nk-color-*)` (semantic first), `var(--nk-palette-*)`, `var(--nk-type-*)` (font shorthand), `var(--nk-space-*)`, `var(--nk-radius-*)`, component groups (`--nk-button-*`, `--nk-pill-*` …), insets `var(--nk-inset-top|bottom)`. TS: `ref.color()`, `ref.palette()`, `ref.type()`, `ref.space()`, `ref.shadow()`, `spacing.*`, `radius.*` from `src/foundations/tokens.ts`. Find the token for a literal in `scripts/token-map.json`. A value with no token: add it to the flow's `tokens.ts`, or append a global one to `foundations/palette.ts` / `tokens.ts` under its bappzaar/Figma name; never rename or remove tokens.
4. **Lint.** `npm run lint:tokens` fails on any raw hex / rgb(a) / hsl(a) / font-shorthand literal in `src/components` (comments and `token-lint-ignore` lines are skipped). Mark true geometry only: `// token-lint-ignore — <reason>`.
5. **Build on the primitives.** Tappable = `Pressable` or `Button`; text = `Text` or token fonts; icons = `Icon` / `MaskIcon`; motion values from `src/motion/presets.ts`. Use logical properties or `[dir='rtl']` rules for RTL, `flipRtl` on directional icons. Low-specificity selectors (`:where()`) when callers must be able to restyle.
6. **Export.** Add `export * from './<Name>/<Name>';` to `src/components/index.ts`. Keep existing exports and prop names backward compatible (the package re-exports `./components` from `src/index.ts`).
7. **Changelog.** Add a line under `## [Unreleased]` in `CHANGELOG.md` for the new component or any user-visible change.
8. **Verify.** `npm run verify` (typecheck app + lib, token lint, lib build), `npm run check:routes` with `npm run dev` running, and for changes to an existing shared component `npm run visual:snap` before/after + `visual:diff`.
