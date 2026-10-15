import type { TokenOverrides } from '../../foundations/tokens';
import { appleSpring, duration, easing } from '../../motion/presets';

/**
 * Department tabs + tab CMS widget (ashbun/noon-app `experiments/marketplace-switcher` TabLayout / TabContent /
 * tabThemes, Figma "Sponsored real estate on app"). Colours were linear-fitted off the Figma renders there; each
 * tab re-skins the band under the header with its own vertical gradient. Literals live here by design.
 */

/** Tile surfaces: light = white 0.35 → 0.50, dark = white 0.10 flat; strokes are 0.5px inside rings fading to transparent. */
const light = { tileFill: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.5) 100%)', tileStroke: 'rgba(255,255,255,0.56)' };
const dark = { tileFill: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) 100%)', tileStroke: 'rgba(255,255,255,0.448)' };

export type TabContentKind = 'cms' | 'tiles' | 'grocery' | 'sponsored' | 'none';
export interface TabTheme {
  /** the sticky header's vertical gradient (noon-app `header`); it hands over to `layout[0]` at the band */
  header: [string, string];
  /** the band's vertical gradient, top → bottom */
  layout: [string, string];
  /** address row ink in the header (default dark) */
  addressInk?: 'dark' | 'light';
  /** device status-bar ink over the header (default dark) */
  statusInk?: 'dark' | 'light';
  /** nav ink: dark (black labels) or light (white labels, inverted icons) */
  ink: 'dark' | 'light';
  content: TabContentKind;
  headlineColor?: string;
  tileLabel?: string;
  tileFill?: string;
  tileStroke?: string;
}

const blue: TabTheme = { header: ['#D8EFFF', '#D8F5FF'], layout: ['#D9F5FE', '#8BDEF9'], ink: 'dark', content: 'none', headlineColor: '#027096', tileLabel: '#043F52', ...light };

export const homeTabThemes: Record<string, TabTheme> = {
  all: { ...blue, content: 'cms' },
  electronics: { header: ['#200A39', '#270F48'], addressInk: 'light', statusInk: 'light', layout: ['#29104A', '#5A348D'], ink: 'light', content: 'tiles', headlineColor: '#FFFFFF', tileLabel: 'rgba(255,255,255,0.88)', ...dark },
  grocery: { header: ['#ACF5C4', '#C5F5D5'], layout: ['#C4F4D4', '#7DE19F'], ink: 'dark', content: 'grocery', headlineColor: '#2B612E', tileLabel: '#043F52', ...light },
  beauty: { header: ['#FFC4E8', '#FFD1ED'], layout: ['#FFD0ED', '#FFBEE6'], ink: 'dark', content: 'tiles', headlineColor: '#B04D8B', tileLabel: '#0E0E0E', ...light },
  fashion: { header: ['#5A94D6', '#1C5597'], addressInk: 'light', layout: ['#1C5597', '#0A3970'], ink: 'light', content: 'sponsored' },
  // not designed yet in Figma: skinned, no content
  wellness: blue,
  home: blue,
};

export const homeTabInk = {
  dark: { active: '#0E0E0E', idle: 'rgba(14,14,14,0.57)', rule: 'rgba(14,14,14,0.04)' },
  light: { active: '#FFFFFF', idle: 'rgba(255,255,255,0.6)', rule: 'rgba(255,255,255,0.12)' },
};

export const homeTabsTokens = {
  /** every tab is 76 wide, so the indicator rests at index × 76 */
  tabW: 76,
  navH: 56,
  /** content panel height per kind (tab band = nav + panel) */
  panelH: { cms: 348, tiles: 200, grocery: 308, sponsored: 347, none: 200 } as Record<TabContentKind, number>,
  tile: { w: 84, h: 100, radius: 16, gap: 12, inset: 16 },
  /** noon-app sheetMotion: fade (was 0.22s iOS curve → Test01 duration.medium, easing.ios), control spring 0.3s / bounce 0.15 */
  fade: { duration: duration.medium, ease: easing.ios },
  control: appleSpring(0.3, 0.85),
  /** the band grows / shrinks to the next panel's height */
  resize: { duration: duration.medium, ease: easing.out },
};

export const homeTabsFlowTokens: TokenOverrides = {
  colors: {
    homeTabNewBadge: '#F43333', // NEW badge on a tab
    homeTabCmsBorder: '#F2F3F7', // CMS widget card border / promo tile fill
    homeTabAjmalBg: '#0C0C04', // Ajmal widget fill
    homeTabBadgeBrown: '#A5622B', // WHOOP "Flash Deal" notch
    homeTabBadgeBlue: '#0580AB', // Nike "Eid offer" notch
    homeTabBadgeRed: '#D92626', // Ajmal "Flash Deal" notch
    homeTabSponsoredBorder: '#F9F9FB', // fashion sponsored card border / media fill
    homeTabSponsoredTitle: '#212121',
    homeTabAdBg: 'rgba(255, 255, 255, 0.8)', // "Ad" tag
    homeTabPauseBg: 'rgba(0, 0, 0, 0.65)', // video pause button
  },
  type: {
    homeTabLabel: { size: 11, line: 14, weight: 500 }, // tab label (active 600)
    homeTabLabelActive: { size: 11, line: 14, weight: 600 },
    homeTabNew: { size: 8, line: 8, weight: 700 },
    homeTabTile: { size: 12, line: 16, weight: 600 }, // sub-category tile label (leading per tile)
    homeTabBadge: { size: 10, line: 14, weight: 700 }, // promo notch
    homeTabAd: { size: 10, line: 11, weight: 400 },
    homeTabPromoTitle: { size: 11, line: 14, weight: 400 },
    homeTabPromoPrice: { size: 11, line: 14, weight: 700 },
    homeTabSponsoredPrice: { size: 16, line: 20, weight: 700 },
  },
};
