import type { TokenOverrides } from '../../foundations/tokens';
import { easing, handoff } from '../../motion/presets';

/**
 * Saved cards (payment V2) tokens — features/payment/theme/{PaymentColors,PaymentMetrics}.ts and the
 * per-component styles.ts files on bappzaar origin/master. Values that already exist as kit tokens are
 * referenced through CSS vars in the modules; only payment-specific values live here.
 *
 * Exposed to CSS as --nk-color-cards-* (see `cardsFlowTokens`).
 */
export const cardsColors = {
  darkNavy: '#02060C', // PaymentColors.darkNavy — header icons, outline button text
  newBlack: '#262A33', // PaymentColors.newBlack — action button labels
  cardBackground: '#C1C1C1', // PaymentColors.cardBackground — card art placeholder / inner shadow
  tintedIcon: '#2A8DFF', // PaymentColors.tintedIconColor(noon)
  inputBg: '#F5F7FA', // PaymentTextInputV2 input
  inputBorder: '#F9F9FB',
  inputText: '#101628',
  inputError: '#F43333',
  disabledBg: '#0E0E0E0A', // PaymentColors.disabledBackgroundColor
  disabledText: '#0E0E0E3F', // PaymentColors.disabledTextColor
  switchOff: '#CCCCCC', // PaymentSwitchV2 off track
  lightSilver: '#F2F2F2', // success gradient start
  scanButtonBg: 'rgba(255, 255, 255, 0.64)', // PaymentScanOptionButton
  red: 'rgba(250, 0, 0, 1)', // PaymentColors.redColor — nickname error
  headerBtnDarkBg: 'rgba(0, 0, 0, 0.6)', // PaymentScreenHeaderButton transparent
  headerBtnDarkBorder: 'rgba(235, 235, 235, 0.4)', // brightGreyColor(0.4)
  cardTitleBg: 'rgba(0, 0, 0, 0.6)', // PaymentAnimatedListCard title chip
  cardTitleBorder: 'rgba(255, 255, 255, 0.16)',
  cardSelectedBorder: 'rgba(255, 255, 255, 0.28)',
  successTitleBg: 'rgba(0, 0, 0, 0.5)', // PaymentCardAdditionSuccessScreen title chip
  listScrim: 'rgba(0, 0, 0, 0.9)', // usePaymentAnimatedBackgroundStyle final colour
  dashedBorder: '#EAECE0', // NoonTokens.colors.dashedBorderDefault (NoonDashedBorder between scan options)
} as const;

/** PaymentMetrics + PaymentAnimationConfig, resolved for the kit's 390 × 844 device (status bar 54, home indicator 34). */
export const cardsMetrics = {
  contentWidth: 390,
  statusBar: 54,
  safeBottom: 34,
  cardAspect: 853 / 538, // CARD_ASPECT_RATIO
  cardHorizontalMargin: 40,
  cardOffsetMultiplier: -0.7,
  headerContentHeight: 68, // HEADER_CONTENT_HEIGHT
  headerButtonSize: 36,
  sectionTitleHeight: 36,
  sectionSpacing: 34,
  actionsOverlayHeight: 170,
  editNicknameOverlayHeight: 134,
  edgeSpacing: 12,
  scanOptionsTitleHeight: 40,
  get cardWidth() {
    return this.contentWidth - this.cardHorizontalMargin; // 350
  },
  get cardHeight() {
    return this.cardWidth / this.cardAspect; // ≈ 220.75
  },
  get cardOffset() {
    return this.cardHeight * this.cardOffsetMultiplier; // ≈ -154.5 (stacked overlap)
  },
  get headerHeight() {
    return this.statusBar + this.headerContentHeight; // 122
  },
  get overlayBottomSpacing() {
    return this.safeBottom === 0 ? 18 : this.safeBottom + 8; // 42
  },
  get manualEntryHeight() {
    return this.scanOptionsTitleHeight + this.edgeSpacing * 2 + 48; // 112
  },
};

/** PaymentAnimationTimings (ms). */
export const cardsTimings = {
  overscrollRelease: 400,
  overscrollThrow: 100,
  firstRound: 160,
  waitBetweenRounds: 40,
  secondRound: 170,
  get full() {
    return this.firstRound + this.waitBetweenRounds + this.secondRound; // 370
  },
  actions: 200,
  shimmerDelay: 1000,
  bounceStagger: 120,
  shimmerFade: 100,
};

/** the reanimated curves (inOut / out quad) mapped onto the app-wide Test01 curves so the cards flow moves like the rest */
export const cardsEasing = {
  inOutQuad: easing.inOut,
  outQuad: easing.out,
  inQuad: easing.in,
  outEase: easing.inOut,
};

/** withSpring configs used across the payment feature. */
export const cardsSprings = {
  press: { type: 'spring', stiffness: 300, damping: 20, mass: 0.5 } as const, // PaymentButtonV2 / AdditionOption
  form: handoff.spring, // ManualAddition calculateAnimationTimingFunction (300/28, ζ 0.81) → the Test01 spring
};

export const cardsFlowTokens: TokenOverrides = {
  colors: {
    ...Object.fromEntries(Object.entries(cardsColors).map(([k, v]) => [`cards${k[0].toUpperCase()}${k.slice(1)}`, v])),
  },
  // one-off type combos (token lint cleanup)
  type: {
    cardsText12LightLh18: { size: 12, line: 18, weight: 300 },
    cardsText16RegularLh24: { size: 16, line: 24, weight: 400 },
    cardsText30ExtraboldLh38: { size: 30, line: 38, weight: 800 },
    cardsText15RegularLh24: { size: 15, line: 24, weight: 400 },
  },
};
