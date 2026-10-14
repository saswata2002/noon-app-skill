# Assets reference

> System icons: `src/assets/icons/origin/` holds the 399 Origin Design System icons — use `<OriginIcon name>` and the catalogue in `references/icons.md`, not the files directly.

Sources: `src/assets/*` (22 folders, 839 files, ~8.7 MB), `src/components/{Icon,MaskIcon,Lottie,ProductImage,TabBar,Tag,SearchBar}`, `src/flows/*/assets.ts`, `src/foundations/global.css`, `src/data`, `scripts/optimize-assets.mjs`, `scripts/asset-budget.json`, `vite.config.ts`, `src/vite-env.d.ts`, CONTRIBUTING.md (Assets).

Component props live in `references/components.md` (sections Icon, MaskIcon, Lottie, ProductImage, MarketplaceTag and MarketplaceWordmark). This file says **which files exist and where they go**. Rule: search here (or `ls src/assets/<folder>`) before downloading anything; most noon glyphs, logos, payment marks and empty states are already in the repo.

## 1. Folder map

Paths are relative to `src/assets/`. "Used by" is from grepping imports; folders with no `src/assets` imports are `flows/orders`, `flows/plp`, `flows/search` (they use components only).

| Folder | Files (by type) | Used by | Contents and notable files |
|---|---|---|---|
| `account/` | 12 webp, 4 lottie | flows/account | Country flags `flag-{ae,bh,eg,kw,om,qa,sa}.webp`; social `{facebook,instagram,linkedin,twitter}.webp`; `note.webp`; locale-change lotties `noon-account-{language,country}-change-{en,ar}.lottie` |
| `address/` | 24 webp, 4 lottie | flows/address (via `flows/address/assets.ts`) | AddressV2/MapV2 glyphs (`addressV2-{home,office,other}-tag.webp`, `mapV2-pin-location-summary.webp`, `mapV2-current-location-crosshair.webp` …); empty states `addressV2-empty-latlng-addresses.webp`, `addressV2-empty-collection-addresses.webp`, `addressV2-collection-point-empty{1,2,3}.webp`; lotties `address-save-success`, `allow-location-access`, `location-error`, `current-location` |
| `brand/` | 2 webp, 1 png | not imported yet | `noon-logo.webp`, `noon-logo-ar.webp`, `noon-app-icon.png` (yellow noon wordmark / app icon) |
| `cards/` | 19 webp, 3 png, 1 lottie | flows/cards | Card-brand marks `payment-{mada-visa,mada-mastercard,card-mada,diners-club,discover,jcp,union-pay,jaywan,mada-light,visa-light,default-card}@3x.webp`; UI glyphs `payment-{back,camera,check,edit,lock,plus,trash,group-icon}@3x.webp`; `cardskin.png`, `cardskin2.png` (card art); empty state `payment-empty2.png`; `save-card-reveal.lottie` |
| `cart/` | 14 webp, 56 svg, 2 lottie, 1 png | flows/cart, flows/pdp | Root: NoonThemeManager SVGs read `?raw` by `flows/cart/components/CartIcon.tsx` (`checkbox-*`, `plus`, `minus`, `trash`, `wishlist`, `applied-coupon`, `discount-icon` …); `empty-generic.webp` (empty cart); `freebie.webp`, `warranty-badge-orange.webp`; lotties `atc-loader-animation`, `noon-bundle`. `figma/` (40 Figma exports): `logo-express.svg`, `pill-express.svg`, `logo-market-{store-icon,wordmark}.svg`, `logo-global-icon.svg`, `noon-one-logo-{base,text}.svg`, `waves-{express,global,market}.svg`, `warranty-*.svg`, `dotted-divider.svg`, `coupon-divider-dashed.png`, `coupon-percent-badge.svg`, `coupon-chevron.svg` (coupon ones not imported since the coupon block follows master) |
| `categories/` | 206 webp | flows/categories (`import.meta.glob`) | CMS creatives: 29 `cat-<slug>.webp` main banners, 175 `sub-<slug>-NN.webp` sub tiles, `ad-pre-search-banner.webp` (animated, allowlisted 430 KB), `empty-error@3x.webp` (generic error empty state) |
| `checkout/` | 34 webp, 39 svg, 6 png, 2 gif, 1 json | flows/checkout, address, pdp, returns | Payment rows `payment-{tabby,tamara,cod,noon-credit,card,card-fallback,brand-jaywan}.webp`, `payment-radio-{checked,unchecked}.webp`; delivery `delivery-*@3x.webp`; post-order `postorder-*.webp`; rewards/coupons `rewards-*`, `coupon.webp`, `coupon-error.webp`, `rewards-confetti.gif`; `arrow-to-checkmark-animation-en.json` (lottie JSON). `figma/`: `pay-{applepay,card,noonone-card,tabby,tamara}@3x.png`, `pay-cod.svg`, `noonone-logo-{a,b,c}.svg`, `supermall-{a,b}.svg`, `pill-express.svg`, `provider-{emkan,mokafaa,quara}.svg`, `new-badge-texture.gif`, `saved-card-art.png` |
| `deals/` | 3 webp, 1 gif | flows/deals | `hero-0{1,2}.webp`, `strip-01.webp`, `strip-02.gif` (CMS creatives) |
| `fonts/` | 4 otf + 2 woff2 | `foundations/global.css` | `Noontree-{Regular,Medium,SemiBold,Bold}.otf` (see section 5); `Lobster-Regular-latin.woff2`, `Tourney-Black-latin.woff2` (display faces) |
| `home/` | 69 webp | flows/home (`import.meta.glob`) | Live CMS home feed: `hero-01..03`, `banner-01..03`, `strip-01`, `tile-01..20` (labels baked in), `offer-01..10`, `spotlight-01..10`, `saving-01..23` (no 14); `home/bz/` (59 webp): creatives of the live app home payload for the bappzaar feed (`data.feed.ts`): `welcome-strip-01` (animated), `strip-slider-01..02`, `women-`/`men-`/`beauty-`/`home-kitchen-`/`electronics-`/`kids-`/`explore-01..07`, `midscroll-01..05`, `midscroll-header-01`, `emaar-01` |
| `icons/` | 52 svg, 5 webp | components/SearchBar, flows/account, checkout, home, pdp, returns | Search bar `noon-search-bar.webp`, `noon-search-bar-camera.webp`; home header `noon-delivery-home.webp`, `noon-chevron-down.webp`, `noon-wishlist-home-v2.webp`; account menu set `noon-account-*.svg` (49: orders, returns, addresses, saved-cards, noon-credits, wishlist, language, country, notifications, settings, sign-out, privacy/terms/warranty policies, edit-profile-*, face-id …); `discount.svg`, `location-pin.svg`, `order-copy-icon.svg` (not imported yet) |
| `lotties/` | 10 lottie | components/Lottie, flows/returns, flows/plp | Shared lotties registered by name (section 3); `filter-pill.lottie` + `filter-pill-selected.lottie` (stroke recoloured to primaryBlue) for the PLP Filter pill |
| `marketplace/` | 12 svg | components/Tag | Marketplace pill/wordmark layers: `pill-express.svg`, `pill-food.svg`, `supermall-{super,mall}.svg`, `market-{icon,text}.svg`, `global-content.svg`, `minutes-text.svg`, `logo-{noon,supermall,food,minutes}.svg`. Use via `MarketplaceTag` / `MarketplaceWordmark`, not as raw imgs |
| `membership/` | 21 webp, 14 svg, 6 lottie | flows/membership (via `assets.ts`), flows/account | VIP/noon One glyphs (`check-wavy.svg`, `plan-tab.svg`, `member-avatar.svg`, `whatsapp-white.webp`, `cart-freebie-gift.webp` …); lotties `vip-intro-animation{,-ar}`, `vip-landing-animation`, `vip-landing-cancelled-animation`, `vip-landing-success-animation-ar`, `vip-family-plans-header-ar` |
| `noonone/` | 14 webp, 2 lottie | flows/noonone, account, cart, checkout, pdp | `entry/noon-one.webp` (noon One logo mark, used in cart/checkout/pdp/noonone), `entry/noon-one-text.webp`, `entry/noon-one-day-tab.webp`, `entry/right-chevron.webp`, lotties `entry/noon-account-noon-one-logo.lottie`, `entry/checkout-noon-one-green-container.lottie`; `icons/` (`stc.webp`, `add-boku-otp.webp`, `check-circle.webp` …); `offers/` bank cards `enbd-card-no-name{,-sm}.webp`, `mashreq-card-no-name{,-sm}.webp` |
| `pdp/` | 31 webp | flows/pdp | `express-pdp-en.webp`, `rocket-pdp-en.webp` (delivery badges), `favourite.webp` / `favourite-active-v2.webp`, `ai-summary-sparkle.webp`, `reviews-verified-purchase.webp`, `noon-review-star-empty.webp`, `percent-badge.webp`, `seller-logo.webp`, `warranty.webp`, `returnable.webp` … |
| `plp/` | 14 webp, 14 svg, 1 png | flows/plp (`brands.ts`, `MarketplaceStrip`) | `fulfillment/noon-wide-assortment.png` (bappzaar noon fulfilment tab logo, mpcms); `navpills/`: bappzaar `sort-icon-v2`, `crossV2` (@3x webp; the chevron is `icons/noon-chevron-down.webp`) + the live navPills CMS icons `{deals,brand,price}-{active,inactive}.png`; `brands/`: brand widget flagship photos `{apple,samsung,google,xiaomi,honor,oneplus,huawei,motorola,nothing,oppo,vivo,tecno,realme,infinix}.webp` (300w), wordmarks `mark-*.svg`, selected-bar coin marks `coin-{apple,samsung,google,xiaomi}.svg` (from github.com/saswata2002/Brand-Widget-PLP) |
| `products/` | 18 webp | flows/pdp, `src/data/products/N70211564V` | product-page art that isn't one product's photo: `iphone-17-pro/`: `swatch-{silver,cosmic-orange,deep-blue}.webp`, `review-{1..5}.webp`, `nudge-*.webp`, `pay-{installments,noon-one-card,split}.webp`, and `card-n70211534v.webp` (shared by two iPhone variants). Phone and other product photos moved into `src/data/products/<id>/` |
| `returns/` | 30 svg, 7 webp, 1 lottie | flows/returns (via `assets.ts`), flows/cards | AFS icons `returns-*.svg`, `wc-radio-{checked,unchecked}.svg`; `empty-return-requests@3x.webp`, `slim-chevron-{left,right}@3x.webp`, `x-mark@3x.webp`, `returns-supermall-tag.svg`; `returns-processing-en.lottie` |
| `reviews/` | 11 webp, 2 lottie | flows/reviews (via `assets.ts`) | R&R 2.0 products (`product-case`, `iphone`, `pastorder-1..3`, `washer`), review photos `review-1/2`, `review-photo-1..3`; lotties `stars-loading`, `review-success` (pass via `src`) |
| `shared/` | 19 webp, 2 svg | components/SearchBar, flows/account, cards, cart, checkout, membership, noonone, pdp, returns | Cross-flow: `search-bar/back.webp` + `search-bar/clear-input.webp` (bappzaar back / clearInput, `SearchInput`, post-order header, PDP, membership search); `payment/apple-pay.webp`, `payment/card-{visa,mastercard,amex,mada}.webp`, `payment/brand-card-{visa,mastercard,amex}.webp`; `icons/checkbox-{checked,unchecked}.webp`, `icons/radio2-{checked,unchecked}.webp`, `icons/arrow-down.webp`, `icons/addr-{home,chevron}.svg`; `delivery/{work,other}.webp` (address tags); `addressV2-share-icon.webp`, `address-v2-delete.webp` (address + wishlist) |
| `wishlist/` | 16 webp, 1 svg, 1 lottie | flows/wishlist | bappzaar Wishlist V2 glyphs `noon-wishlist-v2-{wishlist-back-icon,plus-wishlist-collection,close-icon,stw-close,copy-icon,move-icon,arrow-right-option,loading-error}.webp`, `vertical-three-dot-menu-collection.webp`, `trash.webp`, `minus.webp`, `plus.svg`; images `noon-wishlist-v2-{wishlist-empty,wishlist-collection-overlay-background,empty-collection-placeholder}.webp`; lottie `noon-wishlist-v2-wishlist-empty-mobile.lottie` |
| `switcher/` | 18 png, 2 gif | flows/home, flows/noonone | Super-app switcher tiles: `noon`, `rocket`, `food`, `money`, `nooninstant`, `noonnownow`, `services` with `-compact`, `-selected`, `-compact-selected` variants |
| `tabbar/` | 12 webp + 2 svg | components/TabBar | `home`, `categories`, `cart`, `account` + `-selected` webp (imported); Deals = `deals-bag{,-selected}.svg` (Origin `M-Icon/Bottomnav-Icon/deals-bag`, imported, drawn at 28); `deals-box{,-selected}.webp` and `discount-badge{,-selected}.webp` (older deals icons, not imported) |
| `vip/` | 16 svg, 10 webp, 5 lottie, 1 png | flows/membership, flows/noonone | VIP glyphs (`gift.svg`, `star.svg`, `percent-badge.svg`, `reminder-bell.svg`, `radio-green-{selected,unselected}.svg`, `one-green-check.webp`, `one-trial-alert.webp` …); lotties `vip-family-plans-header`, `vip-accept-invite-header`, `vip-accept-invite-duo-header`, `vip-landing-success-animation`, `vip-loading-shimmer` |

## 2. Using assets

### Import patterns

| Need | Pattern | Example |
|---|---|---|
| One file | Static ES import (Vite returns a hashed URL string; files under 4 KB are inlined as data URIs) | `import pin from '../../assets/address/mapV2-pin-location-summary.webp';` then `<img src={pin} />` |
| Flow asset table | Collect imports in `src/flows/<flow>/assets.ts` and export `icons` / `images` / `lotties` objects | `src/flows/address/assets.ts`, `src/flows/membership/assets.ts`, `src/flows/returns/assets.ts` (`lottieFiles`) |
| Many CMS images looked up by name | `import.meta.glob` eager | `src/flows/home/data.ts`: `import.meta.glob<string>('../../assets/home/*.webp', { eager: true, import: 'default' })`; same in `src/flows/categories/data.ts` (`asset(name)`) |
| Product photo | `card.webp` / `gallery-N.webp` next to the product's `product.ts` in `src/data/products/<id>/` (attached as `image` / `images`), rendered with `ProductImage` | `src/data/products/N70211593V/` |
| Shared lottie | `<Lottie name="…">` | `<Lottie name="atcCheck" size={64} />` |
| Flow lottie | Import the `.lottie` and pass `src` (`*.lottie` is in `vite.config.ts` `assetsInclude`, typed in `src/vite-env.d.ts`) | `<Lottie src={lotties.allowLocation} loop size={100} />` |
| Generic line icon | `<Icon name="…">` (lucide set) | `<Icon name="chevronRight" size={16} flipRtl />` |
| Tint a webp/svg silhouette | `MaskIcon` (CSS mask, 1x size props) | `<MaskIcon src={icons.chevronRightBlue} size={16} color="var(--nk-color-cta)" />` |
| SVG that paints with `currentColor` | `?raw` import + inline | `flows/cart/components/CartIcon.tsx` |
| CSS background | `url()` relative to the CSS module | `flows/cart/components/group.module.css`: `url('../../../assets/cart/figma/dotted-divider.svg')` |
| Marketplace pills / logos | `MarketplaceTag` / `MarketplaceWordmark` (never raw SVG imports) | `<MarketplaceTag kind="express" height={16} />` |

Locale variants: pick by direction at runtime, e.g. `document.documentElement.dir === 'rtl' ? lotties.familyPlansHeaderAr : lotties.familyPlansHeader` (`flows/membership/family/FamilyPlansScreen.tsx`).

### Where a new asset goes

- Used by one flow: `src/assets/<flow>/` (Figma exports in `src/assets/<flow>/figma/`).
- Used by two or more flows: `src/assets/shared/<kind>/` (`payment/`, `icons/`, `delivery/`). `assets:check` fails on byte-identical copies, so move a file to `shared/` instead of copying it.
- Shared lottie: `src/assets/lotties/` plus a key in the `lotties` map in `src/components/Lottie/Lottie.tsx`.
- Component-owned artwork: next to the component's folder (`tabbar/`, `marketplace/`, `icons/` for SearchBar).
- Product photos: in the product's own folder, `src/data/products/<id>/card.webp` (+ `gallery-N.webp`); `npm run assets:optimize` covers them. See `src/data/README.md`.

### Size and format

| Kind | Format | Size rule |
|---|---|---|
| Photos, banners, raster glyphs | webp (png only when the source is png card art) | ≈3× rendered CSS size. Caps: `maxEdge[path]` in `asset-budget.json` (3× the largest measured render), else width ≤ `defaultMaxWidth` 1200 |
| Line glyphs, logos, badges | svg | Keep `viewBox`; svgo keeps ids and dimensions |
| Animations | `.lottie` (dotLottie); lottie `.json` only if that is the source | Minified by the optimiser |
| Animated creatives | gif or animated webp | All frames kept |
| Fonts | otf | Never touched by the optimiser |

### Naming conventions observed

- Keep the **source file name** (bappzaar or CDN) so it can be traced: `addressV2-home-tag.webp`, `noon-account-orders-center.svg`, `vip-landing-animation.lottie`. Names are kebab-case; bappzaar camelCase segments (`addressV2`, `mapV2`) are kept.
- `@3x` suffix when the file is the bappzaar @3x export (`payment-lock@3x.webp`); not required on new files.
- State suffixes: `-selected`, `-checked` / `-unchecked`, `-active`, `-compact`, `-disabled`.
- Locale suffixes: `-en` / `-ar` (`noon-account-language-change-ar.lottie`, `noon-logo-ar.webp`).
- Numbered CMS creatives: `<slot>-NN.webp` (`hero-01`, `tile-20`, `sub-beauty-03`), required by the `import.meta.glob` lookups.
- Downloaded duplicates of a name get a prefix: `wc-` for warranty-claims radios in `returns/`.

## 3. Catalogues

### Icon names (`src/components/Icon/Icon.tsx`, lucide-react)

| Group | Names |
|---|---|
| Navigation | `back arrowLeft arrowUp chevronRight chevronDown chevronUp close more` |
| Commerce | `cart heart share store tag percent deals gift receipt wallet card crown` |
| Tabs / app | `home categories account search camera mic scan bell settings help chat` |
| Actions | `plus minus trash edit copy upload filter sort bookmark imagePlus` |
| Delivery / orders | `truck package packageCheck packageOpen box returns pin clock calendar building phone` |
| Status | `check checkCircle info alert shield lock zap flame trendingUp sparkles star` |
| Locale / files | `globe language logout file` |

Add a glyph: add a key to `icons` in `Icon.tsx` (a lucide icon or your own SVG component); never import `lucide-react` in a flow. For real noon artwork (account menu, payment, AFS) use the files in `icons/`, `returns/`, `shared/` with `<img>` or `MaskIcon`.

### Lotties

Registered names (`lotties` in `src/components/Lottie/Lottie.tsx`, all in `src/assets/lotties/`):

| Name | File | Used in |
|---|---|---|
| `atcCheck` | `atc-check.lottie` | `flows/pdp/AddedSheet.tsx` (added-to-cart tick) |
| `boxAnim` | `box-anim.lottie` | `flows/checkout/PlacingScreen.tsx` (placing order, loop) |
| `favourite` | `favouriteAnimatedV2.lottie` | unused, available (bappzaar wishlist heart burst; superseded by `like`) |
| `like` | `like-heart.lottie` | `components/WishlistHeart/LikeHeart.tsx` → every wishlist heart (Wishlist Revamp like: outline → pink fill + ripple) |
| `orderConf` | `order-conf-lottie.lottie` | `flows/checkout/PlacingScreen.tsx`, `flows/returns/ReturnDetailsScreen.tsx` |
| `orderConfirmedCheck` | `order-confirmed-checkmark.lottie` | `flows/returns/ReturnDetailsScreen.tsx` (also imported directly in `flows/returns/assets.ts`) |
| `reviewCheck` | `noon-review-check-mark-animation.lottie` | unused, available |
| `sliderArrow` | `slider-arrow-animation-en.lottie` | unused, available (slide-to-pay arrow) |
| `starLoading` | `star-loading.lottie` | unused, available (star loader) |

Flow lotties (pass via `src`):

| File | Used in |
|---|---|
| `address/{address-save-success,allow-location-access,location-error,current-location}.lottie` | flows/address (`assets.ts` `lotties`) |
| `account/noon-account-{language,country}-change-{en,ar}.lottie` | `flows/account/ChangeLocaleScreen.tsx` |
| `cards/save-card-reveal.lottie` | `flows/cards/data.ts` |
| `cart/atc-loader-animation.lottie` | `flows/cart/CustomizeSheet.tsx`, `flows/pdp/components/SfAtcBar.tsx` |
| `cart/noon-bundle.lottie` | `flows/cart/VirtualBundlesSheet.tsx` |
| `noonone/entry/noon-account-noon-one-logo.lottie` | `flows/account/components/ProfileCard.tsx` |
| `noonone/entry/checkout-noon-one-green-container.lottie` | `flows/checkout/components/NoonOneSection.tsx` |
| `returns/returns-processing-en.lottie` | flows/returns (`assets.ts` `lottieFiles`) |
| `membership/vip-*.lottie`, `vip/vip-*.lottie` | flows/membership (`assets.ts` `lotties`), flows/noonone screens |
| `checkout/arrow-to-checkmark-animation-en.json` | lottie JSON, checkout |

### Logos, badges and payment marks

| Mark | Path(s) | Notes |
|---|---|---|
| noon wordmark / app icon | `brand/noon-logo.webp`, `brand/noon-logo-ar.webp`, `brand/noon-app-icon.png` | Not yet imported anywhere |
| noon / supermall / food / minutes wordmarks | `marketplace/logo-{noon,supermall,food,minutes}.svg` | Use `MarketplaceWordmark` |
| express / supermall / market / global / food / minutes pills | `marketplace/*.svg` | Use `MarketplaceTag` |
| express (Figma cart/checkout) | `cart/figma/logo-express.svg`, `cart/figma/pill-express.svg`, `checkout/figma/pill-express.svg`, `cart/figma/waves-express.svg` | Flow-local Figma exports |
| supermall (Figma checkout) | `checkout/figma/supermall-{a,b}.svg`, `returns/returns-supermall-tag.svg` | |
| market / global | `cart/figma/logo-market-{store-icon,wordmark}.svg`, `cart/figma/logo-global-icon.svg`, `cart/figma/waves-{market,global}.svg` | |
| express / rocket delivery badges (PDP) | `pdp/express-pdp-en.webp`, `pdp/rocket-pdp-en.webp` | |
| noon One | `noonone/entry/noon-one.webp` (mark), `noonone/entry/noon-one-text.webp`, `cart/figma/noon-one-logo-{base,text}.svg`, `checkout/figma/noonone-logo-{a,b,c}.svg`, lottie `noonone/entry/noon-account-noon-one-logo.lottie` | `noon-one.webp` is the cross-flow one |
| Apple Pay | `shared/payment/apple-pay.webp`, `checkout/figma/pay-applepay@3x.png` | |
| tabby | `checkout/payment-tabby.webp`, `checkout/figma/pay-tabby@3x.png` | `payment-tabby.webp` also used by pdp |
| tamara | `checkout/payment-tamara.webp`, `checkout/figma/pay-tamara@3x.png` | `payment-tamara.webp` also used by pdp |
| Cash on delivery | `checkout/payment-cod.webp`, `checkout/figma/pay-cod.svg` | |
| noon credits | `checkout/payment-noon-credit.webp` | checkout, returns |
| Visa / Mastercard / Amex / mada | `shared/payment/card-{visa,mastercard,amex,mada}.webp` (row icons), `shared/payment/brand-card-{visa,mastercard,amex}.webp` (brand on card art) | Shared: reuse these |
| mada co-brands, Diners, Discover, JCB, UnionPay, Jaywan | `cards/payment-{mada-visa,mada-mastercard,card-mada,mada-light,visa-light,diners-club,discover,jcp,union-pay,jaywan}@3x.webp`, `checkout/payment-brand-jaywan.webp` | |
| Generic card | `checkout/payment-card.webp`, `checkout/payment-card-fallback.webp`, `cards/payment-default-card@3x.webp`, `checkout/figma/pay-card@3x.png`, `checkout/figma/saved-card-art.png`, `cards/cardskin{,2}.png` | |
| noon One credit card | `checkout/figma/pay-noonone-card@3x.png`, `products/iphone-17-pro/pay-noon-one-card.webp` | |
| Bank offer cards | `noonone/offers/{enbd,mashreq}-card-no-name{,-sm}.webp` | |
| BNPL / financing providers | `checkout/figma/provider-{emkan,mokafaa,quara}.svg` | |
| STC | `noonone/icons/stc.webp` | |
| Super-app verticals | `switcher/{noon,rocket,food,money,nooninstant,noonnownow,services}*` | |
| Country flags | `account/flag-{ae,sa,eg,kw,bh,om,qa}.webp` | |
| Social | `account/{facebook,instagram,linkedin,twitter}.webp`, `membership/whatsapp-white.webp` | |

### Empty states and illustrations

`cart/empty-generic.webp` (cart), `categories/empty-error@3x.webp` (error/retry), `returns/empty-return-requests@3x.webp`, `cards/payment-empty2.png` (no saved cards), `address/addressV2-empty-latlng-addresses.webp`, `address/addressV2-empty-collection-addresses.webp`, `address/addressV2-collection-point-empty{1,2,3}.webp`, `icons/noon-account-session-control-empty.svg`, `vip/one-trial-alert.webp`.

### Common controls (reuse before adding)

Checkbox: `shared/icons/checkbox-{checked,unchecked}.webp`, `cart/checkbox-{checked,unchecked}.svg`, `checkout/delivery-checkbox-{checked,unchecked}.svg`. Radio: `shared/icons/radio2-{checked,unchecked}.webp`, `checkout/payment-radio-{checked,unchecked}.webp`, `vip/radio-{checked,unchecked}-black.svg`. Chevrons: `returns/slim-chevron-{left,right}@3x.webp`, `checkout/delivery-chevron-right-blue@3x.webp`, `icons/noon-account-chevron.svg`, `icons/noon-chevron-down.webp`. Tab bar icons: `tabbar/*` (owned by `TabBar`). For plain UI glyphs prefer the `Icon` component or the `Checkbox` / `Switch` components.

## 4. Workflow for a new asset

1. **Search first**: `ls src/assets/*/ | grep -i <word>` or `find src/assets -iname '*<word>*'`. Reuse; if another flow already has it, move it to `src/assets/shared/` and update both imports.
2. **Get the original**, in this order:
   - bappzaar master, read-only: `git -C ~/bappzaar show origin/master:<path> > src/assets/<flow>/<name>` from `marketplaces/noon/theme/assets/` or `src/theme/assets/{icons,images}/` (take the `@3x` file). Never check out or modify bappzaar.
   - noon CDN: `f.nooncdn.com` (product images `?width=800` gallery / `320` cards, CMS `f.nooncdn.com/mpcms/…`, AFS icons) or `a.nooncdn.com` (static). Download with `curl -o`; convert to webp.
   - Figma: export or `download_assets` at 3x and save the file. Never hotlink temporary Figma asset URLs (they expire).
3. **Place** it per section 2, keeping the source name.
4. `npm run assets:optimize` (or `node scripts/optimize-assets.mjs src/assets/<flow>` for one folder; `--dry` to preview). Re-encodes in place in the same format and name, resizes to the cap, PSNR-gated (≥ 37 dB).
5. `npm run assets:check`; must report 0 problems.
6. Over 800 KB and cannot shrink (e.g. an animated banner): add `"src/assets/<path>": "<reason>"` to `allow` in `scripts/asset-budget.json`. Intentional byte-identical copies (rare): add a `duplicates` group with `files` and `reason`. Never touch `skip` without a reason.
7. Optional: with `npm run dev` running, `npm run assets:measure` crawls every route and records measured caps into `maxEdge`; then rerun `assets:optimize`.
8. Note the source path (bappzaar path or CDN URL) in a comment at the import site or the flow's `MAPPING.md`.

## 5. Fonts and prices

| Item | Detail |
|---|---|
| Noontree | `src/assets/fonts/Noontree-{Regular,Medium,SemiBold,Bold}.otf`, `@font-face` in `src/foundations/global.css` (weights 400, 500, 600, 700–900, `font-display: swap`) |
| Stacks | `fontFamily.primary` = `'Noontree', 'Figtree', -apple-system, …`; `fontFamily.rtl` = `'Cairo', 'Noontree', 'Figtree', sans-serif` (`src/foundations/tokens.ts`). Figtree and Cairo (400/600/700) load from Google Fonts in `index.html` |
| Using fonts | Never set `font-family` in a flow; use `<Text variant>` or `var(--nk-type-*)`, which resolve to `var(--nk-font-family)` (switches to the RTL stack when `rtl`) |
| Dirham sign | `currency` from `src/data` = `''` (private-use glyph drawn by Noontree; SAR would be U+E000). In RTL, Cairo lacks the glyph and falls back to Noontree in the stack |
| Rendering prices | `<Price price was size>` (currency at 0.7em, semibold) or `<Money value>`; text: `` `${currency} ${formatPrice(n)}` ``. Never type "AED", never use an image for the sign |

## 6. Validation

| Command | Checks |
|---|---|
| `npm run assets:check` | Fails: any file over `failKB` (800) not in `allow`; byte-identical duplicates not in `duplicates`. Warns: over `warnKB` (300); raster above its size cap |
| `npm run assets:optimize -- --dry` | What the optimiser would change |
| `npm run verify` | typecheck, token lint, `assets:check`, lib build |
| `npm run typecheck` | Wrong import paths, missing `.lottie` module typing |
| `node scripts/shot.mjs <route> /tmp/x.png` | Visual check (dev server running) |

Common faults:

| Fault | Fix |
|---|---|
| `FAIL duplicate content: a, b` | Keep one copy in `src/assets/shared/` and import it from both flows |
| `FAIL … > 800 KB` | Resize to ≈3× display, convert to webp, rerun optimiser; allowlist with a reason only if unavoidable |
| `warn … above its size cap` | Run `npm run assets:optimize`; it keeps the original when a smaller re-encode is not smaller (warning may remain) |
| Image blank in prod / broken after a while | A hotlinked Figma or CDN URL in code; download the file into `src/assets` |
| Lottie collapses to 0×0 | Give `size` or `style` width/height |
| `MaskIcon` shows a solid square | The source has an opaque background; use a transparent webp/svg silhouette |
| `MaskIcon` sized wrong | Props are 1x points; the asset is @3x |
| `ProductImage` has no height | Pass `height` or `aspect` |
| Glob lookup returns `undefined` | File name does not match the `<slot>-NN.webp` key built in `data.ts` |
| Price shows a tofu box | Text not in a Noontree stack (custom `font-family`); use tokens |
| Recolouring a raster by duplicating it in another colour | Use `MaskIcon` with a token colour instead |
