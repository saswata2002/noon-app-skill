<!-- planned: src/flows/home/components/PromoTicker.tsx, src/flows/home/components/CategoryTile.tsx, src/flows/home/components/IconTabs.tsx, src/components/IconTabs, src/components/ProductCard/SkuCard.tsx, src/flows/home/components/ProductRail.tsx, src/flows/home/components/OfferTicket.tsx, src/flows/home/components/RecentCard.tsx, src/flows/home/components/BrandAdModule.tsx, src/flows/home/components/LaunchModule.tsx, src/flows/home/FIGMA-MAPPING.md, home/revamp -->
# Home page: Homepage Revamp 2025 (Figma) vs the kit

Design reference for building the noon home feed (and any campaign or landing page with the same module language) with the flow kit. Measurements are Figma points on a **375pt** frame. The kit device is **390pt** wide (`layout.deviceWidth`). Keep fixed card sizes as they are and let the extra 15pt show as more rail peek. Do not scale them.

## 1. Sources

| What | Value |
|---|---|
| File | `iRE9RwO94eMAyW3j3XKNXW` "Homepage Revamp 2025 \| noon" |
| Root node | `1337:7139` "Frame 2147226424" (375×4000). It is a wrapper around **one** screen, not a set of variants |
| Screen | `1337:5102` "Op 2 .2" (375×3550): the full scrolling home, from status bar to tab bar. It is the only frame, so there are no state variants (collapsed header, other tab selected, loading) |
| Screenshot | user-shared `images/3.png` (same screen as `1337:5102`). Section renders saved in the session scratchpad `figma/home/*.png` |

Section nodes, top to bottom. Feed y is measured inside the feed frame `1337:5104`, which starts at y=264:

| Node | Name in Figma | What it is | Frame y / size |
|---|---|---|---|
| `1337:5103` / `1337:6863` | Bars / Status Bar / iPhone / Light | status bar | 0 · 375×43 |
| `1337:6688` | Frame 2147226053 | header: gradient bg, address row + wishlist, search bar | 0 · 375×260 |
| `1337:6734` | switcher | experience switcher tiles (noon, supermall, noon food, 15 minutes, nownow, Namshi, Pay) | 52 · 547×76 (scrolls) |
| `1337:5131` | Frame 2147226013 | cashback ticket strip with "1/5" pager | feed 0 · 351×62 |
| `1337:5106` | Frame 2147226027 | welcome hero carousel (landscape banners, "Ad") | feed 82 · 330×150 cards |
| `1337:5151` | Frame 2147224478 › `Cat Grid` | "Shop by category", 2-row tile grid | feed 260 · 375×320 |
| `1337:5233` | Frame 2147226409 | "Recommended for you": icon tab strip + SKU rail | feed 608 · 375×426 |
| `1337:5485` | Frame 2147226378 | "Offers for you": ticket offer cards | feed 1062 · 375×207 |
| `1337:5572` | Frame 2147226405 | "Bestsellers": SKU rail | feed 1297 · 375×344 |
| `1337:5804` | Product Carousel | "Keep shopping for": recently viewed / collections rail | feed 1669 · 375×212 |
| `1337:6106` | Frame 2147225693 | "SUMMER ESSENTIALS": sponsored brand module (dark, video tile + SKU rail, "Ad") | feed 1909 · 375×418 |
| `1337:6349` | Frame 2147226407 | "Selling out fast": SKU rail (same as Bestsellers) | feed 2355 · 375×344 |
| `1337:6581` › `1337:6582` | Frame 1814108055 | "NEW LAUNCHES": dark launch module with CTA cards | feed 2727 · 351×420 |
| `1337:6800` › `1337:6801` | Bottom Nav | tab bar (Home, Categories, Deals, Account, Cart) + home bar | 3456 · 375×96 |

## 2. Screen anatomy

Global rhythm, measured: page background white. **Feed modules are 28pt apart.** Every gap between section frames is 28 (232→260, 580→608, 1034→1062 …). The header bottom edge sits 4pt above the first module. **Section titles sit at x=14** (`px 14`) and **content gutters are 12** (cards, rails, strips). The category grid alone uses 16. Every section title is **Figtree Bold 17/22, tracking −0.34, `#262A33`**.

### 2.1 Header (`1337:6688`, 260 tall incl. status bar)
- Background: soft **light-blue radial gradient** (stops `#D4EFF6` → `#DBE1F9` → `#EBF3F9` → transparent) on white, with faint star dots and a white radial fade at the bottom. **Bottom corners r12**, clipped. It is **not yellow**. The noon yellow only appears on the selected switcher tile.
- **Experience switcher** (`1337:6734`) at y=52, x=16, horizontal scroll, gap **6**. Tiles are **73×76**, **r15**, white at 95% opacity, shadow `0 2 4 rgba(0,0,0,.04)`. The selected tile (noon) is filled `#FEEE00` (`brand`). Logos are artwork: supermall wordmark, noon FOOD, "15 MINUTES" badge, nownow, Namshi + label, Pay + label. The text-labelled tiles (Namshi, Pay) use 13 Bold `#404553` and **r8**, a Figma inconsistency, so follow r15.
- **Address row** at y=144, x=19. Line 1: home icon 18 + "Home" **Figtree SemiBold 16/21** black + chevron 16. Line 2: address **Figtree Regular 14/18**, ellipsis at 280 wide. On the right, the **wishlist button** is a **36** white circle (r46) with a filled blue heart 18×16.
- **Search bar** at y=194, x=15/16: **343×48**, white, **1px `#E2E2E2`**, **r12**, padding 12 / 14, gap 12. Search icon 18 + placeholder **Figtree Medium 15/19** `#1F1D1D` "Search for “Maybelline”". Then a vertical divider 24 and the camera icon 20.
- No Supermall toggle row and no "Everything you need, fast" row: the switcher replaced them.

### 2.2 Cashback strip (`1337:5131`)
351×62, gutter 12, **r12**, white with a grey 8–10% radial tint and faint swooshes. Two **12pt notch circles** sit half off the left and right edges at mid-height (ticket shape). On the left, card artwork is rotated −46°. Centre text: "10% cashback" **Figtree Bold 20/24** `#262A33` over "on every E-Commerce spends" Figtree Medium 12/14. The right pager is "**1/5**" Figtree Bold 13 at `rgba(14,14,14,.79)` over **3 dots of 4pt, gap 6** (active dark). The strip is a rotating message ticker with 5 messages.

### 2.3 Hero carousel (`1337:5106`)
Horizontal rail, padding 12, **gap 9**. Cards are **330×150 landscape, r20**, so the next card peeks about 33pt. Card 1 is a full creative with a CMS gradient bg (`#FFF1D2` → `#FFFEF5`), product cut-outs, centre copy (Welcome! Earn / Noontree ExtraBold 36 "AED 50" / Cashback on your first order), and a yellow `#FEEE00` code chip 26h r6 with Figtree Bold 10 `#2D0802`. An **"Ad" badge** sits top-right at (301,8): `rgba(0,0,0,.16)`, r5, px4 py2, Noontree 10/11 white. A 6pt "*T&C Apply" footnote sits under the card. It is 20 below the cashback strip.

### 2.4 Shop by category (`1337:5151`)
Title (px 14), then `Cat Grid` with pt12 pb8. **Two rows** in one horizontal scroller, padding 16, **column gap 16, row gap 16**. Each tile is **92×128**: a 92×92 rounded light-grey bg (SVG) plus layered product cut-outs with soft drop shadows (the kit uses one baked image per tile). The label sits at y=96, **Noontree SemiBold 13/14 `#262A33`**, centred, 2 lines max. Optional red **"SALE" ribbon** at top-centre: gradient `#E11111` → `#FF5959`, bottom radii 5, Bold 11 white.

### 2.5 Recommended for you (`1337:5233`): tabs + rail
- Title (px 14), gap 8, then the **icon tab strip** ("Tab Bar", **`position: sticky; top: 0`** in Figma). pl12, pt6. Each tab is a column (28 icon over label), gap 4, padding 4 / 12 / 12, min-width 66.
  - Active: label **Noontree Bold 13/16 `#1155CB`** (`tabActive`). **3.2pt underline** `#1155CB` with top radii 4. Background gradient white → `#E0EFFF` (bottom glow). Width 72.
  - Inactive: label **Noontree Medium 13/16 `#344054`**, **1px bottom border `#EBECEF`** (the border runs under all tabs as a baseline).
  - Tabs: For you · Electronics · Beauty · Fashion · Home · … (scrolls).
- **SKU rail** under it: pt16, px12, **gap 12**, cards 134 wide. The Figma shows a rail, not a 2-column grid (anatomy in 2.6).

### 2.6 SKU card (Figma component "SKU", used in every product rail)
- Card: **134 wide**, white, r8, gap 4.
- Image box: **134×174, r10**, white with a `rgba(7,47,143,.04)` tint. Product image about 122 square (contain).
  - Heart: 16 icon in a 24 circle, `whiteAlpha20`, p4, at top 4 / right 4.
  - Quick add: 24 "+" in a white box with **1.2px `#0076FF`** border (`link`), **r8**, p4, at x94 y136 (bottom-right).
  - "Best Seller" tag at top-left: 20h, px6, **bottom-right radius 10**, fill `#084541` (variable `Emerald/900` = `#0A4F4A`), Noontree SemiBold 12/14 white.
  - Sponsored products get an **"Ad" tag** at bottom-left 6/6: `whiteAlpha80`, r4, px4 py2, Noontree 10/11 `#666D85`.
- Info block, p4, gap 8:
  - Title **Noontree Medium 14/18, tracking −0.14, `#212121`**, 2 lines (h36).
  - Rating pill: `#F2F8F8`, r4, px4 py2, star 12 + **SemiBold 12/14 `#0A4F4A`**.
  - Price row, gap 3: **Noontree Bold 15/20 `#0E0E0E`** with the dirham sign, struck "was" **Regular 12/14 `#848391`**, discount **SemiBold 12/14 `#008200`**.
  - Delivery row: truck 14 + "Free Delivery" Medium 12/14 `#666D85`.
  - Fulfilment pill: **"express | Today"** 97×16 (yellow express + black "Today" parallelogram), or plain "express".

### 2.7 Offers for you (`1337:5485`)
Title (px 14), gap 13. Rail px12, gap 12. **Ticket cards, about 137×172**:
- Outer: white, **2.5px coloured border** (`#B73428`, `#15859B`, `#830034`), **r24**, p5.
- Inner panel: 122 wide, **r19**, campaign colour + artwork (card image, "DELIVERY DASH" logo, noon logo).
- Copy: title Figtree Bold 14/18 white (e.g. "10% Cashback", "Win AED 100"), sub Figtree Regular 11–12/12–14 `whiteAlpha70`.
- A **dashed divider** at y133, with **18pt notch circles** on both card edges at that line. Below it, CTA "Apply Now ›" / "Play Now ›" / "Try Now ›" in Figtree SemiBold 12 white with a 12 chevron.

### 2.8 Bestsellers (`1337:5572`) and Selling out fast (`1337:6349`)
Title row (22h, px 14), then the SKU rail (pt12, px12, gap 12, 134 cards). Same as 2.6, with no tabs.

### 2.9 Keep shopping for (`1337:5804`)
px12, title → rail gap 12, card gap 12. Three card variants are mixed in one rail:
- **Recently searched/viewed**: image box **114×130**, `#F9F9FB` (`bgSubtle`), 1px `#F1F7FD`, **r12**. Under it: search icon 14 + name **Noontree Medium 14/16** (`rgba(2,6,12,.92)`). Then the chip "**2 Viewed ▸**": `#F1F7FD` (`bgChip`), r4, pl4 pr2 py2, **Medium 12/16 `#0076FF`** (`link`), 12 chevron.
- **Recently viewed item**: 107×122 box with a "2 days ago" tag top-left (white or white 55%, **r10**, p4, SemiBold 10/12 black). Chip "10 Products" is white with **`#AF33D9`** (purple) text.
- **Collection**: 100×114 box `#EBEDFF`, 1px `rgba(26,26,26,.09)`, r12. Name **SemiBold 13/16**. Chip "2 Products" `#EEF5FD` Medium 11/14 `#0076FF`.

### 2.10 Sponsored brand module: "SUMMER ESSENTIALS" (`1337:6106`)
- Full-bleed **375×418**, dark (near-black to charcoal gradient, sampled), with "Ad" tags at the top-right corner.
- Header at x16 y24 (343×33): title **Noontree Bold 16, tracking +1, uppercase, white**, sub **Noontree Regular 12 `whiteAlpha80`**, brand logo 56×20 on the right.
- 24 below: a **video tile 134×308 r8** (autoplay, muted; a mute toggle 24 at bottom-right 8/8), then the SKU rail (white 134 cards, gap 12) scrolling to the right of it.

### 2.11 NEW LAUNCHES (`1337:6582`)
- Inset card **351×420**, margin 12, **`#121212`, r20**.
- Title at x16: "NEW **LAUNCHES**", Figtree Medium 20, tracking −0.5, white with the second word **`#E5FF43`** (lime). Sub "Now available on noon" 16 Thin `#ACACAC` (display font in Figma; use the kit font).
- Rail at x14 y44, gap 14 (clipped inside the card):
  - **Launch card 213×327**: white, 1px `#EBEBEB` (`brightGreyColor`), **r12**, p12. Image 187×187, title **Noontree SemiBold 16/21 `#101628`** (`textStrong`), body **Regular 14/18 `#262A33`**, gap 4. Then 8 gap and a **black button 189×48 r10**, "Shop Now" Figtree Medium 15/20 white.
  - Variants: **collection card 295×418** (2×2 image grid of 131.6 squares, r8, gap 8 · title 16/21 · sub 12.8/17.5 · button 260×48 r12 "Shop the collection") and a grey `#E9E9E9` hero-image card (271×272 image).

### 2.12 Bottom nav (`1337:6801`)
5 items, each 67 wide, gap 4. The row is 63 tall, then a 25 home bar. Each item has a **top indicator bar** (active **43×4** blue; inactive slots are white 56×4 with bottom radii 8), then 8 gap, a 32 icon, and the label **Figtree 12/20, tracking −0.16**. Active label is **Bold `#1155CB`** (`tabActive`). Inactive label is **Medium `#475067`** (`textMuted`). Icons: filled blue house (active), categories glyph, deals bag with %, account, cart.

### 2.13 Behaviour and states
The Figma is a single static frame. Only the sticky tab strip is specified in the file. The rest is noon app behaviour, inferred, and should be built as follows:
- **Collapsing header**: on scroll the switcher compacts and the address row collapses. The search bar stays pinned (existing `HomeScreen` pattern: `onScroll` ≥ 100).
- **Cashback pager**: auto-rotates 5 messages. "1/5" counts up and the active dot moves.
- **Hero**: snap carousel, auto-advance, paused on touch (existing `HeroCarousel`).
- **Tabs**: tapping a tab swaps the rail's products. The tab strip sticks under the pinned header while its rail is on screen.
- **Ads**: "Ad" badges on the hero and sponsored SKUs. The sponsored brand module is a whole-section ad.
- **Video tile**: autoplay muted, loop. The mute icon toggles sound.
- **SKU card**: tap opens the PDP, "+" quick-adds, the heart toggles the wishlist.

## 3. Figma variables / styles → kit tokens

Variables come from `get_variable_defs` on `1337:5102`. "Fill" rows are raw fills seen in `get_design_context`.

| Figma variable / fill | Value | Kit token | Note |
|---|---|---|---|
| `Light/Text/Primary`, `Colour/Text/text-primary` | `#262A33` | `--nk-palette-new-black` (no semantic) | section titles, category labels, body copy. Close to `textPrimary #1D2539` but not within tolerance. **Missing semantic**: propose `colors.textHeading` |
| `Blue-Gray/900` | `#1D2539` | `textPrimary` | |
| `Blue-Gray/1000` | `#101628` | `textStrong` | launch card title |
| `Blue-Gray/700` | `#475067` | `textMuted` | bottom-nav inactive label |
| `Blue-Gray/600` | `#666D85` | `textSecondary` | "Free Delivery", "Ad" text |
| `Blue-Gray/500` | `#989FB3` | `textTertiary` | |
| `Blue-Gray/400` | `#D0D4DD` | `borderStrong` | |
| `Blue-Gray/100` | `#F9F9FB` | `bgSubtle` | keep-shopping image box |
| `✅ Sementic/Text/primary-hover` | `#212121` | `textProduct` | SKU title |
| `✅ Sementic/Text/primary`, `Neutral/Black` | `#0E0E0E` | `textInk` | price |
| `UI / Black` | `#000000` | `--nk-palette-black` | address text, launch CTA bg (or `bgInverse #0E0E0E` by role) |
| `Primary. Colors/noon Black` | `#404553` | `textLegacy` | switcher labels |
| `Yellow/300 ◆` | `#FEEE00` | `brand` | selected switcher tile, promo code chip |
| `Blue/600` | `#0076FF` | `link` | quick-add border, "Viewed" chip text |
| `Blue/50` | `#EFF7FF` | `--nk-palette-alice-blue` | focus shadow |
| fill `#1155CB` | `#1155CB` | `tabActive` | active tab label + underline, bottom-nav active |
| fill `#F1F7FD` | `#F1F7FD` | `bgChip` | "Viewed" chip, keep-shopping border |
| `Emerald/900` | `#0A4F4A` | `bestSellerTag` | rating text. The Best Seller fill is `#084541` in the file: use `bestSellerTag` |
| `Green/800` | `#008200` | **missing** (closest `discount #0F8857`, `palette.darkGreen #006300`) | SKU "% off". Propose palette `kitGreen25` + flow alias, or adopt `discount` |
| fill `#848391` | `#848391` | `--nk-palette-gray` | struck price (kit `priceOld` is `#7E859B`) |
| fill `#F2F8F8` | `#F2F8F8` | **missing** (closest `bgPill #F7F8FA`) | rating pill bg. Flow token `homeRatingBg` |
| `Light/Support/Divider` | `#EBECEF` | `border` (`#EAECF0`, within 1–2 units) | tab baseline |
| fill `#E2E2E2` | `#E2E2E2` | `--nk-palette-gray400` (`#DFDFDF`, within 3) | search bar border. The kit `searchBar.border` is `borderInput #D7DAE3` |
| fill `#344054` | `#344054` | `textBody` (`#343D54`, within 3) | inactive tab label |
| fill `#EBEBEB` | `#EBEBEB` | `--nk-palette-bright-grey-color` | launch card border |
| `Purple/800` | `#AF33D9` | **missing** | "Products" chip text. Flow token |
| `Purple/100` / `Purple/50` | `#F9E9FE` / `#FDF6FF` | `--nk-palette-purple100` / missing | |
| `Alpha/GrayA/900` | `#0E0E0EC8` (≈ .79) | **missing** (alpha series has `primaryAlpha50`) | pager "1/5", hero copy. Flow token |
| `Alpha/GrayA/200` | `#0E0E0E0A` | `--nk-palette-primary-alpha4` | |
| `✅ border/primary-alpha` | `#1A1A1A17` | ≈ `--nk-palette-charcoal-navy-alpha8` | collection card border |
| `🚧 text/👀 primary` | `#02060CEB` | ≈ `textInk` | keep-shopping names |
| fill `whiteAlpha20/70/80/95` | | `--nk-palette-white-alpha20/70/80/95` | heart bg, sub copy, "Ad" bg, switcher tiles |
| fill `rgba(0,0,0,.16)` | | **missing** (`blackAlpha16`) | hero "Ad" badge bg |
| fill `#121212` | `#121212` | **missing** (closest `bgInverse #0E0E0E`) | NEW LAUNCHES card. Use `bgInverse` or a flow token |
| fill `#E5FF43` | `#E5FF43` | **missing** | campaign lime accent. Flow token (`homeLaunchAccent`) |
| fill `#E0EFFF` | `#E0EFFF` | **missing** (near `pillSelectedBorder #D6E9FF`) | active tab glow |
| `Light/Generic/Primary` | `#F15700` | not used on screen | |
| `Radius/4,6,8,10`, `Corner Radius/12`, `Radius/full` | 4 6 8 10 12 9999 | `r4 r6 r8 r10 r12 full` | |
| radii 15 / 19 / 5 / 46 | | **missing** (`r14`/`r16`, `r20`, `r4`/`r6`, `full`) | switcher r15 → flow token. Ticket inner r19 → `r20`. "Ad" r5 → `r4`. Wishlist → `full` |
| radii 20 / 24 | | `r20` / `r24` | hero, launch module / ticket outer |
| `Gap/0,2,4,6,8` | 0 2 4 6 8 | `s0 s2 s4 s6 s8` | |
| gaps 9 / 13 / 28 | | **missing** | hero gap 9 → `s8` (or flow); offers 13 → `s12`; **module gap 28 → missing** (`s24` / `s32`), add `homeModuleGap: 28` |
| `fontFamily/primary` = Noontree, `family/sans-serif` = Figtree | | `--nk-font-family` | the kit font stack is already Noontree → Figtree |
| `Primary/Label3/Medium` 14/18 500 −0.14 | | `productTitle` | SKU title |
| `Primary/Label4/Semibold` 12/14 600 −0.12 | | `text12SemiboldLh14` | rating, Best Seller, % off |
| `Primary/Label4/Medium` 12/14 500 | | `text12MediumLh14` | "Free Delivery" |
| `Primary/Body3/Medium` 12/16 500 | | `text12MediumLh16` | "Viewed" chip |
| `Primary/Label-3/Semi Bold` 13/16 600 −0.26 | | `text13SemiboldLh16` | collection name |
| `Primary/Label-5/Medium` 11/14 500 | | `micro` | "Products" chip |
| section title 17/22 700 | | **`heading`** | the kit home uses `section` (16/22) |
| tab label 13/16 500 / 700 | | `text13MediumLh16` / **missing** 700 13/16 | active → flow type `homeText13BoldLh16` |
| category label 13/14 600 | | **missing** | flow type `homeText13SemiboldLh14` (or snap `text13SemiboldLh16`) |
| price 15/20 700 | | **missing** | flow type `homeText15BoldLh20` (the cart flow has the same need in `SkuCard`) |
| search placeholder 15/19 500 | | **missing** (`text15MediumLh18`) | snap to `text15MediumLh18` |
| bottom-nav label 12/20 500 / 700 | | **missing** | the kit `tabBar.font` = `tab` 14/17 600 |
| cashback 20/24 700 | | `text20BoldLh24` | |
| address 16/21 600, 14/18 400 | | `text16SemiboldLh20` (snap), `body` | |
| launch title 16/21 600, body 14/18 400, CTA 15/20 500 | | `text16SemiboldLh20`, `body`, `bodyMedium` | |
| "Ad" 10/11 400 | | snap `text10MediumLh12` | |
| tag "2 days ago" 10/12 600 | | `text10SemiboldLh12` | |
| effect `focust-shadow/accent/sm` | 0 0 0 1 `#EFF7FF` | **missing** | ring on Best Seller tag. Ignore or use a flow shadow |
| switcher shadow `0 2 4 rgba(0,0,0,.04)` | | close to `shadow.card` (`0 1 2 .04`) | use `card` |

## 4. Design components → kit

| Figma component / pattern | Kit today | Status / proposal |
|---|---|---|
| Status bar | `PhoneFrame` + `--nk-inset-top` | central, nothing to do |
| Header shell (gradient, r12 bottom) | custom header in `src/flows/home/HomeScreen.tsx` (`.header`, `homeTokens.headerBg`) | flow-local. Add a `blue` header gradient + bottom radius |
| Experience switcher | `ExperienceSwitcher` `src/flows/home/components/ExperienceSwitcher.tsx` (+ `switcherMetrics`, `experiences` in `data.ts`) | flow-local, matches the concept. Retune metrics (73×76, r15, gap 6) and order |
| Address row + wishlist | inline in `HomeScreen.tsx` (`.addressRow`, `wishlistIcon` webp 40) | flow-local. Resize (16/21 label, 14/18 line, 36 circle) |
| Search bar with camera | `SearchBarButton` `src/components/SearchBar/SearchBar.tsx` | central. Use `height={48}`. Figma border/placeholder are lighter than `searchBar` tokens (see section 6) |
| Cashback ticket strip + "1/5" pager | none (closest: the vertical ticker inside `SearchBarButton rotatingWords`; dots: `PageController` local in `src/flows/pdp/components/storefront/SfGallery.tsx`) | **missing** → `PromoTicker` in `src/flows/home/components/PromoTicker.tsx` (ticket shape + counter + dots). Move the dots to central `PageDots` if a second flow needs them |
| Hero banner carousel | `HeroCarousel` `src/flows/home/components/HeroCarousel.tsx` (portrait 244×366) | flow-local. Needs a landscape mode (330×150, r20, gap 9) and an "Ad" `Badge` |
| "Ad" badge | `Badge` `src/components/Tag/Tag.tsx` (`bg`, `color`) | central. `<Badge bg="var(--nk-palette-white-alpha80)" color={ref.color('textSecondary')}>Ad</Badge>`. On the hero, a dark-alpha bg + white text |
| Category tile (92×128, label under, SALE ribbon) | `tileRows` images with baked labels in `HomeScreen.tsx` (87×121) | **missing as a component** → `CategoryTile` in `src/flows/home/components/CategoryTile.tsx` (92 square rounded bg, artwork inside, `Text` label 13/14 600, optional ribbon). Central later if the categories flow adopts it |
| Section title row | `Text variant="section"` inline (16/22) | central `Text`. Use `variant="heading"` (17/22 700) with `--nk-palette-new-black` |
| Icon tab strip (For you / Electronics …) | none. Closest: `Segmented` (pill thumb, `layoutId`), `Pill`/`PillRow` (chips) | **missing** → `IconTabs` in `src/flows/home/components/IconTabs.tsx` (28 icon + 13/16 label, `layoutId` underline 3, sticky). Promote to `src/components/IconTabs` if categories/deals reuse it |
| SKU card (134, image box 134×174) | `ProductCard` (0.8-aspect image, `QuickAdd` 36, card border, `Price` 16/700) does not match. `SkuCard` local in `src/flows/cart/components/CartCarousel.tsx` **is the same Figma "SKU" spec** (134×174 r10, heart 24, "+" 32 with 1.2px `link` border at 95/135, 15/20 price, 12/14 strike) | **promote**: move `SkuCard` to central `ProductCard variant="sku"` (or `src/components/ProductCard/SkuCard.tsx`). Wire `QuickAdd`/`WishlistHeart` behaviour, add `ad` and rating-pill-flat props. Used by home (4 rails) and cart |
| Rating pill (flat `#F2F8F8`) | `RatingPill` `src/components/Rating/Rating.tsx` | central. Visually different bg/colour: add `tone="flat"` or a flow override |
| Price row 15/20 + strike + % | `Price` `src/components/Price/Price.tsx` (`size` sm/md/lg; `md` = 16/700 with "% OFF" in `discountBright`) | central. Figma differs: 15/20 sale, strike `#848391`, "33%" (no "OFF") in `#008200`. Add `size="sku"` (or reuse the `SkuCard` price markup when promoting it) |
| express / express Today pill | `ExpressBadge`, `MarketplaceTag kind="express"` | central for "express". **"Today" suffix missing** → add `MarketplaceTag kind="expressToday"` from the Figma SVG |
| Product rail (title + SKU cards) | `CardRail` (images only), `Rail` in `src/flows/deals/DealsScreen.tsx`, `CartCarousel` | flow-local. Add `ProductRail` in `src/flows/home/components/ProductRail.tsx` (title, optional `IconTabs`, SKU rail) |
| Offer ticket card | `CardRail` with baked creatives (`offers` 147×192) | **missing** as live UI → `OfferTicket` in `src/flows/home/components/OfferTicket.tsx` (coloured 2.5 border r24, inner r19, `DashedDivider`, notches, CTA). Creatives may stay images |
| Keep-shopping card (Viewed / Products chips) | none | **missing** → `RecentCard` in `src/flows/home/components/RecentCard.tsx` (image box r12 `bgSubtle`, name row with search icon, chip `bgChip`/`link`) |
| Sponsored brand module (dark, video + rail) | none (closest: `AdBannerModule` `src/flows/categories/components/AdBannerModule.tsx`, image only) | **missing** → `BrandAdModule` in `src/flows/home/components/BrandAdModule.tsx` (`TokenScope` dark scope, `<video muted autoPlay loop playsInline>` tile 134×308 r8, SKU rail) |
| NEW LAUNCHES dark module + launch cards | none | **missing** → `LaunchModule` + `LaunchCard` in `src/flows/home/components/LaunchModule.tsx`. CTA = `Button variant="dark" size="lg" block` (kit `lg` is r12; Figma r10 on the 213 card, r12 on collection cards) |
| Black CTA "Shop Now" 48h | `Button variant="dark"` `src/components/Button/Button.tsx` | central |
| Dashed divider | `DashedDivider` / `DottedDivider` `src/components/Divider/Divider.tsx` | central |
| Bottom nav | `TabBar` `src/components/TabBar/TabBar.tsx` (rendered by Navigator) | central. Visual delta: top indicator bar, 12/20 labels, `textMuted` inactive (section 6) |
| Deal timer / Deals of the day | `DealTimer` `src/flows/home/components/DealTimer.tsx` | not in this Figma. Keep for campaign pages |

## 5. Motion and interaction cues

| Cue (design / app behaviour) | Express it with |
|---|---|
| Header collapse on scroll (switcher compacts, address row folds, search stays) | existing pattern in `HomeScreen.tsx`: `<Screen onScroll>` threshold (`y >= 100`) + `motion.div animate={{ height: 0, opacity: 0 }}` with `duration.medium` + `easing.out`. Switcher uses `switcherMetrics.duration` 0.3 |
| Cashback pager auto-rotation ("1/5", dots) | `AnimatePresence mode="popLayout"` swapping the message (`y` 8 → 0, exit −8, `tween('fast', 'out')`), dot width animated like `PageController` (150ms ease-out). Interval in plain TS (`homeTokens`), not in `TokenOverrides` |
| Hero snap + auto-advance, pause on touch | `HeroCarousel` (`scroll-snap-type: x mandatory`, `homeTokens.heroInterval` 4000) |
| Press on tiles, banners, cards | `Pressable scale={0.98}` (wide creatives), `motion.article whileTap={{ scale: 0.98 }}` + `spring.press` (cards) |
| Tab switch (Recommended) | underline as a shared element: `layoutId="home-tab"` with `duration.base` + `easing.out` (as `Segmented`). Rail swap with `AnimatePresence mode="wait"` (opacity, `duration.fast`), then `Stagger` (35ms, spring 380/39) for the new cards |
| Sticky tab strip | CSS `position: sticky; top: <pinned header height>` inside the `.nk-scroll` container. No JS |
| Module entry as the feed scrolls | `Reveal` (whileInView, once, `duration.slow`) per module, or `Stagger` on rail cards (first 8) |
| Quick add "+" → stepper → count | `QuickAdd` (`spring.bouncy` / `spring.gentle`, toast) |
| Wishlist heart | `WishlistHeart` (`like` Lottie) |
| Video tile autoplay / mute | native `<video muted autoPlay loop playsInline>`. Mute icon swap via `AnimatePresence` + `Pop` |
| Bottom tab press / switch | `TabBar` (`tabBar.pressScale` 0.9, `nav.switchTab`, no transition) |
| Navigation out (tile → PLP, card → PDP, search → search) | Navigator default `push`. Search may use `slide-left` (the noon search push) |

## 6. Delta vs current implementation (`src/flows/home/*`)

Already matching:
- The screen skeleton: `<Screen header background="bgSurface" withTabBar safeTop={false} onScroll>` with a custom header, collapsing rows past 100px, `ExperienceSwitcher` above the address row, a wishlist button, `SearchBarButton` with camera, the tab bar from `defineFlow({ tabBar })`.
- `HeroCarousel` snap + auto-advance + pause on touch. The two-row horizontal category scroller. An "Offers for you" rail. Recommended products with `ProductCard`, `QuickAdd`, `WishlistHeart`, `CatalogTag`, `RatingPill`, `Price`, `ExpressBadge`.
- `bgPage` white (`homeFlowTokens`).

Differs or missing (file → change):
1. `src/flows/home/tokens.ts` `homeTokens.headerBg`: noon header is yellow → add the light-blue radial (`#D4EFF6`/`#DBE1F9`/`#EBF3F9`) as `headerBg.noon2025`. `.header` in `home.module.css` needs `border-radius: 0 0 var(--nk-radius-r12) var(--nk-radius-r12)`.
2. `switcherMetrics`: `itemWidth/itemHeight` 78 → **73×76**, `gap` 8 → **6**, radius 20 → **15** (the switcher passes `borderRadius: 20` in `ExperienceSwitcher.tsx`). Make the selected tile `brand` yellow with the `card` shadow. Order: noon, supermall, Food, Minutes, nownow, Namshi, Pay (`experiences` in `data.ts`).
3. `HomeScreen.tsx` header: **remove the toggle row + `ModeSwitch`** for the 2025 variant (keep behind a prop for the Supermall demo). Address: `.addressLabel` `titleSmall` → `text16SemiboldLh20`, `.addressLine2` `bodyLarge`/28 → `body`, wishlist 40 webp → 36 white circle (`full`).
4. Search: `SearchBarButton height={48}`. The Figma border `#E2E2E2` and placeholder 15/19 are lighter and smaller than the `searchBar` tokens (`borderInput`, `text17MediumLh30`). Either add `searchBar` variant tokens (`borderLight: gray400`, `placeholderFontSm: text15MediumLh18`) or override them in `homeFlowTokens` (`searchBar: { border: 'var(--nk-palette-gray400)', placeholderFont: 'var(--nk-type-text15-medium-lh18)' }`).
5. **Add the cashback strip** (`PromoTicker`) after the header, replacing `promoStrip` (`strip-01.webp`, 363/91 aspect).
6. `HeroCarousel`: add `variant="landscape"` → `heroCardWidth 330`, `heroCardHeight 150`, `heroGap 9`, radius 20, left-aligned with `padding-inline: 12` (not centred). Add an "Ad" `Badge` slot.
7. Category tiles: `.tile` 87×121 baked images → `CategoryTile` 92×128 with a live `Text` label (13/14 600 `new-black`), `gap 16`, `.tileRows` padding 16 (already 16), row gap 14 → 16.
8. Section titles: every `Text variant="section"` (16/22, `textStrong`) → `variant="heading"` (17/22) with colour `var(--nk-palette-new-black)`, padding `0 14px`. `.module` gap 12 → 8–12.
9. `.feed` gap **20 → 28** (`homeModuleGap`). Content gutter 12 for rails (`CardRail` uses 16 today).
10. Recommended: the 2-column `ProductCard` grid → **`IconTabs` + 134px SKU rail**. Keep a grid only below the fold as an endless "More for you". Remove the `whileInView` inline spring and use `Stagger`.
11. Product card: `ProductCard` (0.8 image, 36 quick-add, 16/700 price, card border) does not match the SKU spec. Promote `SkuCard` (`src/flows/cart/components/CartCarousel.tsx`) to central and use it in home rails.
12. "Offers for you": baked 147×192 images → `OfferTicket` live cards (about 137×172), gap 12, px 12.
13. Remove modules that are not in the 2025 design from the default order: "In the spotlight", "Maximize your savings" (2 rows), the banners rail (357×147), the yellow "Deals of the day" card. Keep them in `data.ts` as optional campaign modules.
14. Add missing modules: Bestsellers rail, Keep shopping for (`RecentCard`), Summer Essentials (`BrandAdModule`), Selling out fast rail, NEW LAUNCHES (`LaunchModule`).
15. `src/components/TabBar` (central, affects every tab flow, so change it deliberately, behind a token): the Figma has a **top indicator bar (43×4 `tabActive`)**, labels **12/20** (active 700, inactive 500 `textMuted`). The kit has no indicator, `tab` 14/17 600 and `tabInactive #404553`. Propose `tabBar.indicatorWidth 43`, `indicatorHeight 4`, `font`, `fg: textMuted` behind a `tabBar.style: '2025'` override, rather than changing the defaults.
16. `src/flows/home/index.ts` `notes`/`source`: once rebuilt, set `source` to `Figma iRE9RwO94eMAyW3j3XKNXW 1337:5102` and write `src/flows/home/FIGMA-MAPPING.md` from sections 3–4 of this file.

## 7. Build guidance (home and campaign landing pages)

**Shell.** `<Screen header={header} background="bgSurface" withTabBar safeTop={false} onScroll={…}>`. The header is custom, never `<Header>`. Build it in this order:
1. Gradient bg with an r12 bottom.
2. `ExperienceSwitcher`.
3. Address row + 36 wishlist circle.
4. `SearchBarButton height={48}` with camera.

Collapse rows 2 and 3 past 100px. The search bar stays pinned.

**Feed rules.**
- Flex column, **gap 28** between modules.
- Every module = optional title row (`Text variant="heading"`, colour `new-black`, `padding: 0 14px`) + content.
- Rails use `.nk-hscroll` with `padding: 0 12px` and fixed-width items.
- Category grid gutter 16.
- Dark modules are full-bleed (brand ad) or inset 12 with r20 (launches), and render inside a `TokenScope` that flips text colours.

**Module catalogue.** Use these names in the screen plan:

| Module | Content | Size / rule |
|---|---|---|
| `PromoTicker` | 1 ticket strip, 2–5 rotating messages, "n/N" + dots | 351×62 r12, gutter 12 |
| `HeroBanners` | landscape creatives, snap, auto 4s, "Ad" badge on sponsored | 330×150 r20, gap 9 |
| `CategoryGrid` | 2 rows × 8–12 `CategoryTile`, optional SALE ribbon | 92×128, gap 16 |
| `ProductRail` | title + SKU cards (6–10), optional `IconTabs` above (max one tabbed rail per page) | 134 cards, gap 12 |
| `OfferTickets` | 3–6 `OfferTicket` | ~137×172, gap 12 |
| `KeepShopping` | recently searched / viewed / collections (`RecentCard`) | 100–114 wide, gap 12 |
| `BrandAdModule` | sponsored: brand header + video/hero tile + SKU rail | full-bleed 375×418, dark |
| `LaunchModule` | dark inset card, 2-tone title, `LaunchCard`s with black CTA | 351×420 r20, cards 213×327 |
| (campaign extras, from the current flow) | `DealTimer` deal card, `CardRail` creatives (spotlight, banners) | use on campaign/deals pages, not the default home |

**Ordering rules** (follow the Figma order unless the request says otherwise):
1. Utility strip → hero → categories (navigation first).
2. The personalised tabbed rail ("Recommended for you") is the first product module.
3. Then offers.
4. Then rails, alternating: rail (Bestsellers) → personal (Keep shopping for) → **sponsored module** → rail (Selling out fast) → editorial dark module (New launches).
5. Never put two dark modules or two sponsored modules next to each other. Put at least one light rail between them.
6. At most 1 tabbed rail, 1 brand ad and 1 launch module per screen.
7. Ads always carry an "Ad" `Badge`. Sponsored SKUs carry an "Ad" tag in the image box.
8. End with the tab bar (the Navigator renders it). For an endless feed, a 2-column `ProductCard` grid may follow the last module.

**Campaign / landing page variant.** Use the same feed language, but as a pushed screen (`Header` with back + search, no switcher or address).
- Hero = one full-width campaign banner.
- Then `PromoTicker` (campaign perks) → `CategoryGrid` (campaign categories) → `ProductRail`s with `IconTabs` by category → `OfferTickets` → an optional `DealTimer` deal rail.
- Theme the header gradient and accents via flow tokens (`<flow>HeaderBg`, `<flow>Accent`), never raw hex in CSS.

**Data.**
- Modules come from `data.ts` as an ordered array: `{ type: 'productRail', title, tabs?, items }` …, rendered through a `switch` (the cart flow's `SECTIONS` pattern), so order changes stay data-only.
- Products come from `src/data`, prices from `Price` / `currency`, creatives from `src/assets/home/`.
- Every tile → `nav.push('plp/listing', { query })`, every SKU → PDP (default `onPress`), search → `search/search`, wishlist → `wishlist/wishlist`.

**Verify.** Screenshot `home/home` and compare with `1337:5102` module by module, against the 28 gap, the 12 gutters, 134 SKU cards and 17/22 titles.
