import type { TokenOverrides } from '../../foundations/tokens';
import { handoff } from '../../motion/presets';

/**
 * Storefront PDP (Figma 2ldJbjmQq4RkhnrNFCfXQB · 3499:75115, in stock) — header 3499:75879, gallery 3499:75117,
 * Main-Info 3499:75133 and the sponsored row 3499:75228 (src/flows/pdp/components/storefront/Sf*).
 * Merged into pdpFlowTokens by the lead: keys are prefixed `pdpSfa`, so the vars become --nk-color-pdp-sfa-*,
 * --nk-type-pdp-sfa-*, --nk-layout-pdp-sfa-*. Only values with no central / pdp token live here.
 */
export const pdpSfAFlowTokens: TokenOverrides = {
  colors: {
    /** "low price" nudge icon (Figma #CC285C) */
    pdpSfaLowPrice: '#CC285C', // token-lint-ignore — flow token definition (Figma fill)
    /** "Lowest Price in 30 days" chip: gradient #F3F5FC → white (107%) */
    pdpSfaNudgeStart: '#F3F5FC', // token-lint-ignore — flow token definition (Figma fill)
    /** 360 button border: 🚧 border/secondary rgba(2,6,12,.15) (palette only has darkNavyAlpha10/20) */
    pdpSfaBorderNavy15: 'rgba(2, 6, 12, 0.15)', // token-lint-ignore — flow token definition (Figma stroke)
    /** "noon's exclusive" text fill: gradient #E2E2E2 → white (70%) → #EDEDED (108%) */
    pdpSfaExclusiveText: 'linear-gradient(90deg, #E2E2E2 0%, #FFFFFF 70%, #EDEDED 108%)', // token-lint-ignore — flow token definition (Figma text fill)
  },
  type: {
    /** rating pill: "4.6" / "(34244 reviews)" Noontree SemiBold 13/14 */
    pdpSfaText13SemiboldLh14: { size: 13, line: 14, weight: 600 },
    /** "Prepaid Only" Noontree Medium 13/14 */
    pdpSfaText13MediumLh14: { size: 13, line: 14, weight: 500 },
    /** "Mega Deal" SemiBold 13/17 */
    pdpSfaText13SemiboldLh17: { size: 13, line: 17, weight: 600 },
    /** Bestseller row "Bestseller #3 in" 14/19 */
    pdpSfaText14Lh19: { size: 14, line: 19, weight: 400 },
    /** Bestseller row category "Chargers" 14/600/19 */
    pdpSfaText14SemiboldLh19: { size: 14, line: 19, weight: 600 },
    /** sponsored row "Ad" tag 11/12 */
    pdpSfaText11Lh12: { size: 11, line: 12, weight: 400 },
  },
  layout: {
    /** header stack (3499:75881): 56 tall, 40px round icon buttons */
    pdpSfaHeaderStack: 56,
    pdpSfaIconButton: 40,
    /** gallery starts 40 below the frame top (status bar 47 → −7 against the kit inset) */
    pdpSfaGalleryInset: -7,
    /** "noon's exclusive" tag 114 × 24; footer row at y 456 of 512, items bottom-aligned to the 42px 360 button → 14 from the bottom */
    pdpSfaTagHeight: 24,
    pdpSfaFooterBottom: 14,
    /** dots indicator 20 from the bottom, 6px dots, 14px active, gap 6 */
    pdpSfaDotsBottom: 20,
    pdpSfaDot: 6,
    pdpSfaDotActive: 14,
    /** rating / prepaid pills 26h, inner 18h */
    pdpSfaPillHeight: 26,
    pdpSfaPillInner: 18,
    /** coupon chip 36h, bestseller row 36h */
    pdpSfaRowHeight: 36,
    /** sponsored row 35h (351 × 34.99), start block 236 wide (34px thumb + 8 + 175px title) */
    pdpSfaAdHeight: 35,
    pdpSfaAdThumb: 34,
    pdpSfaAdStart: 236,
    pdpSfaAdTitle: 175,
    pdpSfaAdTagHeight: 14,
  },
};

/** JS-only values (ratios, motion) for the Sf* components. */
export const pdpSfATokens = {
  /** product-image 375 × 512 */
  galleryRatio: 512 / 375,
  /** Carousel Indicator: 6 dots + 6 gap per slot, active 14 wide; max 5 slots visible */
  dots: { slot: 12, slotActive: 20, visible: 5, ms: 150 },
  /** gallery pager spring: the Test01 spring (was stiffness 300, damping 34) */
  pager: handoff.spring,
} as const;
