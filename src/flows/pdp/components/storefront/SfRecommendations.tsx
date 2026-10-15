import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import etaExpressToday from '@assets/pdp/new-pdp/eta-express-today.svg';
import { LikeHeart, OriginIcon, ProductImage, QuickAdd, type OriginIconName } from '../../../../components';
import { useDemoStore } from '../../../../kit/DemoStore';
import { useNav } from '../../../../kit/Navigator';
import { currency, discountPct, formatPrice, type Product, type ProductNudge } from '../../../../data';
import { spring } from '../../../../motion/presets';
import { copy } from '../../data';
import { pdpTokens } from '../../tokens';
import { Card } from '../Sections';
import styles from './SfRecommendations.module.css';
import { useReduceMotion } from '../../../../motion/reducedMotion';

/** Nudge kind → Origin icon + tint (Figma "Nudges - HP": solid/arrow-down-circle, solid/truck, solid/bolt, solid/shopping-cart, solid/check-badge). */
const nudgeIcon: Record<ProductNudge['kind'], { name: OriginIconName; color: string }> = {
  lowestPrice: { name: 'arrow-down-circle-filled', color: 'var(--nk-color-danger)' },
  freeDelivery: { name: 'truck-filled', color: 'var(--nk-palette-emerald-green)' },
  sellingFast: { name: 'flash-thunder', color: 'var(--nk-color-pdp-npe-nudge-urgent)' },
  lowStock: { name: 'flash-thunder', color: 'var(--nk-color-pdp-npe-nudge-urgent)' },
  soldRecently: { name: 'cart-check-filled', color: 'var(--nk-palette-emerald-green)' },
  rank: { name: 'verified-filled', color: 'var(--nk-palette-emerald-green)' },
  info: { name: 'info-circle-filled', color: 'var(--nk-color-text-muted)' },
};

/**
 * Product rail, two looks (New PDP, All flows Af34gfmhQ1D0wstXUEHSIF · 64:5571):
 * - `card` (default; "Products related to this" 89:62855, Storefront 3499:75876 / 3499:75877): white r16 card, p12,
 *   15/700 title (px2), cards 134 wide 12 apart from pt16, scrolling to the card edge.
 * - `bleed` ("More from Apple" 89:62853 / "Customer also viewed" 89:62854): a full-width white band, py12, title 14 from
 *   the screen edge, cards from 12 scrolling to the screen edge. Consecutive bleed rails join into one band 12 apart.
 * `sponsored` adds the "Ad" tag the Figma shows on every card. bappzaar: NoonRecommendations (same_brand "More from
 * {{brandName}}", other_brands "Customers Also Viewed", sponsored "Products related to this").
 */
export function SfRecommendations({ title, items, sponsored, variant = 'card' }: { title: string; items: Product[]; sponsored?: boolean; variant?: 'card' | 'bleed' }) {
  if (items.length === 0) return null;
  const rail = (
    <>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.list}>
        {items.map((p) => (
          <SfRecoCard key={p.id} product={p} sponsored={sponsored} />
        ))}
      </div>
    </>
  );
  if (variant === 'bleed') return <section className={styles.bleed}>{rail}</section>;
  return <Card>{rail}</Card>;
}

/**
 * Figma "Product card" (134, 0.5px Blue-Gray/200, r10): 3:4 image box (2% tint, image 87.5% tall) with Best Seller tag,
 * wishlist (16 heart in a 24 white-20% circle, 6/6), "Ad" (bottom-left) and quick add (24 plus, white, 1.2px border, r8,
 * bottom-right) · info p 6 6 8 gap 8: 13/17 title, rating pill (12 star + score + count), price row, nudge flipper, ETA pill.
 * Tap → PDP, heart → wishlist, "+" → add to cart (DemoStore).
 */
export function SfRecoCard({ product: p, sponsored }: { product: Product; sponsored?: boolean }) {
  const nav = useNav();
  const { toggleWishlist, isWishlisted } = useDemoStore();
  const wished = isWishlisted(p.id);
  const pct = discountPct(p);
  const name = p.brand && p.brand !== 'Generic' && !p.title.startsWith(p.brand) ? `${p.brand} ${p.title}` : p.title;
  const nudges = p.nudges?.length ? p.nudges : p.freeDelivery ? [{ kind: 'freeDelivery' as const, text: 'Free delivery' }] : [];
  const dots = Math.min(p.images?.length ?? 0, 4);
  return (
    <motion.article className={styles.card} whileTap={{ scale: 0.98 }} transition={spring.press} onClick={() => nav.push('pdp/detail', { productId: p.id })}>
      <div className={styles.media}>
        {/* Figma "Ar34Images": square image 6.25% from top / bottom of the 3:4 box, centred (sides clip) */}
        <ProductImage product={p} width="var(--nk-layout-pdp-sfe-reco-image)" height="var(--nk-layout-pdp-sfe-reco-image)" style={{ background: 'transparent' }} />
        {dots > 1 && (
          <span className={styles.dots} aria-hidden>
            {Array.from({ length: dots }).map((_, i) => (
              <span key={i} className={styles.dot} data-i={i} />
            ))}
          </span>
        )}
        {p.tag && <span className={styles.tag}>{p.tag}</span>}
        {sponsored && <span className={styles.ad}>Ad</span>}
        <motion.button
          type="button"
          className={styles.heart}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wished}
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            const added = toggleWishlist(p.id);
            nav.toast(added ? copy.addedToWishlist : copy.removedFromWishlist);
          }}
        >
          <LikeHeart on={wished} size={16} />
        </motion.button>
        {/* the kit's one add-to-cart "+" (QuickAdd), same bottom-right anchor */}
        <span className={styles.add}>
          <QuickAdd productId={p.id} />
        </span>
      </div>
      <div className={styles.info}>
        <div className={styles.nameBlock}>
          <span className={styles.name}>{name}</span>
          {p.rating > 0 && (
            <span className={styles.rating}>
              <OriginIcon name="star-filled" size={12} color="var(--nk-color-best-seller-tag)" />
              <span className={styles.ratingScore}>{p.rating.toFixed(1)}</span>
              {p.ratingCount > 0 && <span className={styles.ratingCount}>{`(${p.ratingCount})`}</span>}
            </span>
          )}
        </div>
        <div className={styles.priceBlock}>
          <span className={styles.priceRow}>
            <span className={styles.price}>{`${currency}${formatPrice(p.price)}`}</span>
            {p.was && p.was > p.price ? <span className={styles.was}>{formatPrice(p.was)}</span> : null}
            {pct > 0 ? <span className={styles.pct}>{`${pct}%`}</span> : null}
          </span>
          {nudges.length > 0 && <SfNudges nudges={nudges} />}
        </div>
        {p.express && <img src={etaExpressToday} alt="express Today" className={styles.eta} />}
      </div>
    </motion.article>
  );
}

/** "Nudge Flipper": 16h, one nudge at a time (14 icon + 12/16 text), NoonNudgeTag carousel timings (pdpTokens.nudge.card). */
function SfNudges({ nudges }: { nudges: ProductNudge[] }) {
  const { card } = pdpTokens.nudge;
  const [i, setI] = useState(0);
  const reduce = useReduceMotion();
  useEffect(() => {
    // reduced motion: the first nudge stays (no auto-rotation)
    if (nudges.length < 2 || reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % nudges.length), card.enterMs + card.holdMs + card.exitMs);
    return () => clearInterval(t);
  }, [nudges.length, card.enterMs, card.holdMs, card.exitMs, reduce]);
  const n = nudges[i % nudges.length];
  const icon = nudgeIcon[n.kind];
  return (
    <div className={styles.nudge}>
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={i}
          className={styles.nudgeItem}
          initial={{ y: card.offset }}
          animate={{ y: 0, transition: { duration: card.enterMs / 1000, ease: 'linear' } }}
          exit={{ y: -card.offset, transition: { duration: card.exitMs / 1000, ease: 'linear' } }}
        >
          <OriginIcon name={icon.name} size={14} color={icon.color} />
          <span className={styles.nudgeText}>{n.text}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
