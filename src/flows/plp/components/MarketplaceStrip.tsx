import { animate, motion, useMotionValue } from 'motion/react';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { MarketplaceTag, Pressable } from '../../../components';
import { haptic } from '../../../motion/haptics';
import { handoff } from '../../../motion/presets';
import noonLogo from '@assets/plp/fulfillment/noon-wide-assortment.png';
import { plpTokens } from '../tokens';
import styles from '../plp.module.css';
import { useReduceMotion } from '../../../motion/reducedMotion';

export type MarketplaceId = keyof typeof plpTokens.marketplaces;

/**
 * The tabs NoonCatalogList.renderFulfillmentTabs() builds: the default noon tab (fixed mpcms logo, 105 × 24,
 * "Wide assortment", black indicator) followed by the API's `fulfillment` facet rows. The facet only comes back
 * with the app's tabbed-fulfilment experiment on, so its `image_url` logos can't be fetched: the kit's marketplace
 * pills stand in at the 70 × 20 logo size, names are the facet-style labels below, and the indicator falls back to
 * black as in the app when a row has no `hex_code` / `background_color`.
 */
const tabs: { id: MarketplaceId; name: string; logo: ReactNode }[] = [
  { id: 'noon', name: 'Wide assortment', logo: <img src={noonLogo} alt="" width={105} height={24} className={styles.ftLogoImg} /> },
  { id: 'supermall', name: plpTokens.marketplaces.supermall.a, logo: <MarketplaceTag kind="supermall" height={20} /> },
  { id: 'express', name: plpTokens.marketplaces.express.a, logo: <MarketplaceTag kind="express" height={20} /> },
  { id: 'global', name: plpTokens.marketplaces.global.a, logo: <MarketplaceTag kind="global" height={20} /> },
  { id: 'minutes', name: plpTokens.marketplaces.minutes.a, logo: <MarketplaceTag kind="minutes" height={20} /> },
];

/** NoonFulfillmentTabs SCROLL_SPACING: a tab that is cut off scrolls fully into view with 60px to spare */
const SCROLL_SPACING = 60;

/**
 * NoonFulfillmentTabs (bappzaar marketplaces/noon/components/NoonFulfillmentTabs), 1:1: white strip, paddingTop 8;
 * horizontal row of 110-wide tabs, gap 12, padding 0 16, min height 55, centred; each tab = 24-high logo slot + 12 / 17
 * black name (1 line), gap 2. The selected tab has a 3px r2 indicator at the strip bottom that slides to the new tab
 * (useNoonFulfillmentTabsIndicator: withTiming 200ms, placed without animation the first time). Tapping another tab
 * gives a light haptic, scrolls it into view and calls `onSelect`; tapping the selected one does nothing.
 */
export function MarketplaceStrip({ active, onSelect }: { active: MarketplaceId; onSelect: (id: MarketplaceId) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const tabEls = useRef<(HTMLButtonElement | null)[]>([]);
  const x = useMotionValue(0);
  const width = useMotionValue(0);
  const placed = useRef(false);
  // reduced motion: the indicator jumps to the tab
  const reduce = useReduceMotion();
  const selected = tabs.findIndex((t) => t.id === active);

  useLayoutEffect(() => {
    const el = tabEls.current[selected];
    if (!el) return;
    const nextX = el.offsetLeft;
    const nextW = el.offsetWidth;
    if (!placed.current) {
      x.set(nextX);
      width.set(nextW);
      placed.current = true;
      return;
    }
    // the indicator moves on the Test01 spring (was reanimated withTiming default: 200ms, Easing.inOut(Easing.quad))
    const opts = reduce ? { duration: 0 } : handoff.spring;
    animate(x, nextX, opts);
    animate(width, nextW, opts);
  }, [selected, x, width, reduce]);

  const scrollToTab = (el: HTMLElement) => {
    const sc = scroller.current;
    if (!sc) return;
    const left = sc.scrollLeft;
    const view = sc.clientWidth;
    let next: number | undefined;
    if (el.offsetLeft < left) next = el.offsetLeft - SCROLL_SPACING;
    else if (el.offsetLeft + el.offsetWidth > left + view) next = el.offsetLeft + el.offsetWidth - view + SCROLL_SPACING;
    if (next === undefined) return;
    sc.scrollTo({ left: Math.min(Math.max(next, 0), Math.max(sc.scrollWidth - view, 0)), behavior: 'smooth' });
  };

  return (
    <div className={styles.ft} data-testid="fulfillment_tabs">
      <nav ref={scroller} className={`nk-hscroll ${styles.ftRow}`} aria-label="Marketplaces">
        {tabs.map((tab, i) => (
          <Pressable
            key={tab.id}
            ref={(el: HTMLButtonElement | null) => {
              tabEls.current[i] = el;
            }}
            className={styles.ftTab}
            scale={1}
            data-testid={`${tab.id}_fulfillment_filter`}
            aria-current={i === selected || undefined}
            aria-label={tab.name}
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              if (i === selected) return;
              haptic('tap');
              scrollToTab(e.currentTarget);
              onSelect(tab.id);
            }}
          >
            <span className={styles.ftLogo}>{tab.logo}</span>
            <span className={styles.ftName}>{tab.name}</span>
          </Pressable>
        ))}
        {selected >= 0 && <motion.i className={styles.ftIndicator} style={{ x, width }} aria-hidden />}
      </nav>
    </div>
  );
}
