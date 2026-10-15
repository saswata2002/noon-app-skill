import type { TokenOverrides } from '../../foundations/tokens';

/**
 * Search-only values (NoonSearchSuggestionRow, NoonRecentlySearchedModule, NoonSearchPushAnimation) and the
 * suggestion choreography of the Brand Widget PLP handoff (github.com/saswata2002/Brand-Widget-PLP, app.js
 * "Search suggestions — ProtoPie handoff motion"); the shared curves live in `handoff` (src/motion/presets.ts).
 */
export const searchTokens = {
  recentItemWidth: Math.round(390 / 5.2), // screen ÷ 5.2
  suggestionRowHeight: 44,
  maxRows: 8,
  /** the push brings presearch up 20px, 124ms after touch-up */
  presearchPushDelay: 0.124,
  /**
   * First open: every element below the search bar starts as a skeleton (Skeleton look="band", the Brand Widget PLP
   * skeleton). The skeleton layer fades in on the S-curve (`layer`); at `revealAt` the page resolves COMPONENT BY
   * COMPONENT, top → bottom, `groupStagger` apart: Recent Searches (header, Edit, tiles) · Trending searches (heading +
   * pills). A component crossfades as one unit, soft and bounce-free: its content comes into focus (fade `contentFade`
   * on the iOS deceleration curve, blur `blur`px → 0) while it settles `rise`px on a critically damped spring
   * (`settle`, response .55s), and its skeletons dissolve on a cubic in-out (`skeletonFade`) from `skeletonLag` later,
   * so the two overlap the whole way. Inside a component the elements follow each other by a minimal `itemStagger`
   * in reading order (a recent tile's image and label move as one).
   */
  // timing: Test01 (handoff) — content fades in on the fast-start curve (183ms) and settles on the Test01 spring; the
  // skeleton dissolves on the S-curve (189ms). Choreography (groups, stagger, rise, blur) as tuned.
  skeleton: { layer: 0.3, revealAt: 0.48, groupStagger: 0.12, itemStagger: 0.025, rise: 6, blur: 4, contentFade: 0.183, skeletonFade: 0.189, skeletonLag: 0.04 },
  /** field cleared: presearch comes back this long after the last row has left */
  presearchGap: 0.04,
  /** first keystroke with matches → rows start falling in */
  rowEnterDelay: 0.11,
  /** top → bottom in */
  rowStagger: 0.06,
  /** bottom → top out (no match / field cleared) */
  rowOutStagger: 0.04,
  /** a burst of keys within this lands as one change while the rows are up (ms) */
  settleMs: 60,
  /** rows whose suggestion changes crossfade (BlurSwap), cascading this far apart */
  crossfadeStep: 0.028,
  /** spare rows (fewer matches) lift 10px and fade */
  goneTravel: 10,
  goneFade: 0.2,
  /** the exit into results: the rows simply fade out in place (no travel, no stagger), then the PLP takes over */
  fastExit: { stagger: 0, fade: 0.189, move: 0.189, travel: 0 }, // Test01 S-curve fade
  pushSpring: { type: 'spring', stiffness: 280.6, damping: 27.14, mass: 1 },
} as const;

export const searchFlowTokens: TokenOverrides = {
  colors: { bgPage: '#FFFFFF' },
};
