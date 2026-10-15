import type { TokenOverrides } from '../../foundations/tokens';
import { duration as motionDuration } from '../../motion/presets';
import { homeEidFlowTokens } from './tokens.eid';
import { homeFeedFlowTokens } from './tokens.feed';
import { homeHeaderFlowTokens } from './tokens.header';
import { homeModulesFlowTokens } from './tokens.modules';
import { homeRailsFlowTokens } from './tokens.rails';
import { homeTabsFlowTokens } from './tokens.tabs';

/**
 * Home-only tokens. Anything here is applied only to Home screens (via flow.tokens),
 * and is also exported for direct use in this flow's components.
 * The header backgrounds are CMS-driven in the app — these are demo stand-ins.
 */
export const homeTokens = {
  headerBg: {
    noon: 'linear-gradient(180deg, #FEEE00 0%, #FFF7A6 70%, #FFFFFF 100%)',
    supermall: 'linear-gradient(180deg, #1D2539 0%, #3A2C6E 70%, #FFFFFF 100%)',
  },
  heroCardWidth: 244,
  heroCardHeight: 366,
  heroGap: 12,
  heroInterval: 4000,
  carouselCardWidth: 156, // screen ÷ 2.5
} as const;

/** ExperienceSwitcher constants (src/constants/ExperienceSwitcher.ts) at the 390pt demo width: item = 390 / 5. */
const switcherItem = 390 / 5;
export const switcherMetrics = {
  itemWidth: switcherItem,
  itemHeight: switcherItem,
  collapsedItemHeight: switcherItem / 2.2,
  itemPadding: 20,
  collapsedItemPadding: 12,
  itemRadius: 20, // useExperienceSwitcher: borderRadius interpolates with the tile height, 20 expanded → 12 collapsed
  collapsedItemRadius: 12,
  gap: 8,
  bottomMargin: 8,
  topOffset: 5, // homeSwitcherTopOffset: status bar + 5 (iOS)
  duration: motionDuration.medium, // Test01 medium, in step with the header fold
} as const;

/** Homepage Revamp 2025 values (Figma iRE9RwO94eMAyW3j3XKNXW · 1337:5102). */
export const home2025 = {
  moduleGap: 28, // every gap between feed modules
  titleInset: 14, // section titles sit at x=14
  gutter: 12, // rails, strips, cards
} as const;

const classicFlowTokens: TokenOverrides = {
  colors: { bgPage: '#FFFFFF' },
  // one-off type combos (token lint cleanup)
  type: {
    homeText11SemiboldLh1: { size: 11, line: '1', weight: 600 }, // DealTimer pill
    homeText14ExtraboldLh1: { size: 14, line: '1', weight: 800 }, // switch knob
  },
};

/** Groups merged one level deep, so each area file can add its own `colors` / `type` / … keys. */
function mergeTokens(...parts: TokenOverrides[]): TokenOverrides {
  const out: Record<string, Record<string, unknown>> = {};
  for (const part of parts) for (const [group, values] of Object.entries(part)) out[group] = { ...out[group], ...(values as Record<string, unknown>) };
  return out as TokenOverrides;
}

export const homeFlowTokens: TokenOverrides = mergeTokens(classicFlowTokens, homeHeaderFlowTokens, homeRailsFlowTokens, homeModulesFlowTokens, homeTabsFlowTokens, homeEidFlowTokens, homeFeedFlowTokens);
