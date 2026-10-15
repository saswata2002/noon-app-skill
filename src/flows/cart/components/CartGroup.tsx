import { AnimatePresence, motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { HtmlText } from '../../../components';
import type { CartGroupType, CartLine } from '../../../kit/DemoStore';
import { useNav } from '../../../kit/Navigator';
import { currency, formatPrice } from '../../../data';
import { duration, easing, handoff } from '../../../motion/presets';
import clockIcon from '@assets/cart/figma/clock.svg';
import logoExpress from '@assets/cart/figma/logo-express.svg';
import globalIcon from '@assets/cart/figma/logo-global-icon.svg';
import marketIcon from '@assets/cart/figma/logo-market-store-icon.svg';
import marketWordmark from '@assets/cart/figma/logo-market-wordmark.svg';
import supermallSuper from '@assets/cart/figma/logo-supermall-super.svg';
import supermallMall from '@assets/cart/figma/logo-supermall-mall.svg';
import wavesSupermall from '@assets/cart/figma/waves-supermall.svg';
import wavesExpress from '@assets/cart/figma/waves-express.svg';
import wavesGlobal from '@assets/cart/figma/waves-global.svg';
import wavesMarket from '@assets/cart/figma/waves-market.svg';
import { groupCallouts, progressMessage } from '../data';
import { cartTokens, groupTheme } from '../tokens';
import { CartItem } from './CartItem';
import { GroupProgressBar } from './GroupProgressBar';
import { NoonOneNudge } from './NoonOneNudge';
import html from './html.module.css';
import styles from './group.module.css';

const WAVES: Record<CartGroupType, string> = { supermall: wavesSupermall, express: wavesExpress, xborder: wavesGlobal, marketplace: wavesMarket };

/**
 * NoonCartGroup, restyled to Figma Cart 2.0 marketplace groups (Express 10575:94104, Global 10575:94090,
 * market 10575:94119; supermall from All flows Af34gfmhQ1D0wstXUEHSIF · 127:39689): tinted "Glass effect Container" (r16, 1px #F9F9FB, pt 8, gap 6) with the colour-waves
 * tab + marketplace logo, a white r16 "items" card with the group border colour (pt 12, gap 16, dotted
 * dividers), the stacked rows (delivery callout, noon One nudge), and the "Progress bars" footer tucked 24px
 * under the card (gradient, pt 36 / pb 16).
 */
export function CartGroup({ type, lines, subtotal, onMovedToWishlist }: { type: CartGroupType; lines: CartLine[]; subtotal: number; onMovedToWishlist: (line: CartLine) => void }) {
  const nav = useNav();
  const theme = groupTheme[type];
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.3 });
  const remaining = Math.max(0, cartTokens.freeDeliveryThreshold - subtotal);
  if (!lines.length) return null;
  return (
    <div className={styles.group} ref={ref}>
      <div className={styles.glass} style={{ background: theme.glass }}>
        <img src={WAVES[type]} alt="" className={styles.waves} />
        <div className={styles.fulfilment}>
          <GroupLogo type={type} />
        </div>
        <div className={styles.items} style={{ borderColor: theme.border }}>
          <AnimatePresence initial={false}>
            {lines.map((line, i) => (
              <motion.div
                key={line.product.id}
                layout="position"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, transition: { ...handoff.spring, opacity: { duration: duration.medium, ease: easing.inOut } } }}
                transition={{ ...handoff.spring, opacity: { duration: duration.medium, ease: easing.out } }}
                className={styles.itemWrap}
              >
                <CartItem line={line} group={type} onMovedToWishlist={onMovedToWishlist} />
                {i < lines.length - 1 && <div className={styles.divider} />}
              </motion.div>
            ))}
          </AnimatePresence>
          <div className={styles.stacks}>
            <div className={styles.stack}>
              <img src={clockIcon} alt="" className={styles.stackIcon} />
              <HtmlText base value={groupCallouts[type]} lines={1} className={html.groupCallout} />
            </div>
            <NoonOneNudge className={styles.stack} />
          </div>
        </div>
      </div>
      <div className={styles.progressBars} style={{ background: theme.progressBg }}>
        <GroupProgressBar
          message={progressMessage(remaining, currency, formatPrice, type)}
          current={subtotal}
          threshold={cartTokens.freeDeliveryThreshold}
          showButton={remaining > 0}
          onAdd={() => nav.push('plp/listing')}
          animateIn={seen}
          trackColor={theme.track}
          fillColor={theme.fill}
          addVariant={type === 'supermall' ? 'supermall' : undefined}
          addBorder={theme.addBorder}
          addInk={theme.addInk}
        />
      </div>
    </div>
  );
}

/** Figma "fulfilment type" logos: supermall wordmark · express wordmark · Global icon + Figtree wordmark · market store icon + wordmark. */
function GroupLogo({ type }: { type: CartGroupType }) {
  if (type === 'supermall')
    // All flows 127:39696: 76×18, "super" at 0/4.12 and "mall" at 44.82/0 (Figma layer boxes)
    return (
      <span className={styles.logoSupermall} role="img" aria-label="supermall">
        <img src={supermallSuper} alt="" className={styles.logoSupermallSuper} />
        <img src={supermallMall} alt="" className={styles.logoSupermallMall} />
      </span>
    );
  if (type === 'express')
    return (
      <span className={styles.logoExpress}>
        <img src={logoExpress} alt="express" />
      </span>
    );
  if (type === 'xborder')
    return (
      <span className={styles.logoGlobal}>
        <span className={styles.logoGlobalInner}>
          <img src={globalIcon} alt="" />
          <span className={styles.logoGlobalText}>Global</span>
        </span>
      </span>
    );
  return (
    <span className={styles.logoMarket}>
      <span className={styles.logoMarketIcon}>
        <img src={marketIcon} alt="" />
      </span>
      <img src={marketWordmark} alt="market" />
    </span>
  );
}
