import { AnimatePresence, motion } from 'motion/react';
import { startTransition, useEffect, useRef, useState } from 'react';
import { useDemoStore } from '../../kit/DemoStore';
import { useNav } from '../../kit/Navigator';
import { etaFor, productById, type Product } from '../../data';
import { EtaBadge } from '../EtaBadge/EtaBadge';
import { handoff, spring } from '../../motion/presets';
import { Icon } from '../Icon/Icon';
import { Price } from '../Price/Price';
import { ProductImage } from '../ProductImage/ProductImage';
import { RatingPill } from '../Rating/Rating';
import { CatalogTag, CouponTag } from '../Tag/Tag';
import { Text } from '../Text/Text';
import { WishlistHeart } from '../WishlistHeart/WishlistHeart';
import { quickAdd as t, radius, spacing, stepper as st } from '../../foundations/tokens';
import styles from './ProductCard.module.css';

/**
 * NoonProductBoxVertical — the PLP / carousel product card.
 * Anatomy: image (≈0.8 aspect, contain) · Best Seller tag top-left · heart top-right ·
 * quick-ATC bottom-right · title 14/500 2 lines · rating pill · price row · coupon · ETA badge (Origin `_ETA`,
 * `EtaBadge` + `etaFor(product)`; small in the carousel).
 */
export function ProductCard({
  product,
  onPress,
  quickAdd = true,
  compact,
  carousel,
  width,
}: {
  product: Product;
  onPress?: () => void;
  quickAdd?: boolean;
  /** carousel variant: no coupon / delivery rows */
  compact?: boolean;
  /**
   * bappzaar home productCarousel box (NoonProductCard isCarousel in NoonOptimizedProductCarousel): r8, no hairline, image
   * 138 × 169 at 390 (`round((w − 14) · 1.361)`) with an r8 overlay (carouselImage), 24 heart circle, "+" lifted 2
   * (imageBottomWrapperCarousel), info inset 4 + marginBottom 2, price marginTop 6 with a 16/700 sign (saleCurrency),
   * "n%" discount (hideOffText), the small ETA badge at 18h (was the express flag, NoonEstimatedDelivery isCarousel). Implies `compact`.
   */
  carousel?: boolean;
  width?: number | string;
}) {
  const nav = useNav();
  const eta = etaFor(product); // Origin _ETA from the express / supermall flags and the delivery line
  const open = onPress ?? (() => nav.push('pdp/detail', { productId: product.id }));
  return (
    <motion.article className={styles.card} data-carousel={carousel || undefined} style={{ width, flexShrink: width !== undefined ? 0 : undefined }} onClick={open} whileTap={{ scale: 0.98 }} transition={spring.press}>
      <div className={styles.media}>
        <ProductImage product={product} aspect={carousel && typeof width === 'number' ? width / Math.round((width - 14) * 1.361) : 0.8} radius={carousel ? radius.r8 : 0} />
        {product.tag && (
          <span className={styles.tag}>
            <CatalogTag>{product.tag}</CatalogTag>
          </span>
        )}
        <span className={styles.heart}>
          <WishlistHeart productId={product.id} box={carousel ? 24 : undefined} />
        </span>
        {quickAdd && (
          <span className={styles.quick}>
            <QuickAdd productId={product.id} />
          </span>
        )}
      </div>
      <div className={styles.info}>
        <Text variant="productTitle" color="textProduct" lines={2} style={{ marginInlineEnd: spacing.s4 }}>
          {product.title}
        </Text>
        <RatingPill rating={product.rating} count={product.ratingCount} />
        {carousel ? (
          <span className={styles.price}>
            <Price price={product.price} was={product.was} offSuffix={false} currencySize="sale" />
          </span>
        ) : (
          <Price price={product.price} was={product.was} />
        )}
        {!compact && !carousel && product.coupon && <CouponTag>{product.coupon}</CouponTag>}
      </div>
      {carousel && eta && (
        <div className={styles.delivery}>
          <EtaBadge {...eta} size="small" />
        </div>
      )}
      {!compact && !carousel && eta && (
        <div className={styles.delivery}>
          <EtaBadge {...eta} />
        </div>
      )}
    </motion.article>
  );
}

/**
 * The add-to-cart "+" look on its own (36×36 white, r8, hairline border, soft thumb shadow, 22px ink plus) with your own
 * `onPress`, for tiles that aren't catalog products (e.g. the home Fashion spotlight). Catalog products use `QuickAdd`.
 * `asDiv` for slots inside another button (a role="button" div, so buttons never nest).
 */
export function QuickAddButton({ onPress, label = 'Add to cart', asDiv }: { onPress: () => void; label?: string; asDiv?: boolean }) {
  const Tag = asDiv ? motion.div : motion.button;
  return (
    <Tag
      {...(asDiv ? { role: 'button', tabIndex: 0 } : { type: 'button' as const })}
      className={styles.quickBtn}
      whileTap={{ scale: t.pressScale }}
      transition={spring.bouncy}
      aria-label={label}
      onClick={(e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        onPress();
      }}
    >
      <Icon name="plus" size={t.iconSize} color={t.icon} />
    </Tag>
  );
}

/**
 * The "+" → stepper → count morph, Apple "snappy" style, built as a shared-element morph so nothing ever overlaps:
 * every piece is ONE element positioned from the shell's growing edge, and only moves / scales / recolours.
 *   "+"       stays put (18px from the edge in both looks): 22px ink → 16px white (a black and a white glyph in place)
 *   −/trash   sits where the stepper puts it (46–70px from the edge): the widening shell reveals it, the narrowing hides it
 *   count     slides from the stepper's centre into the badge and scales to the badge size; value changes roll like an
 *             odometer (old digit up and out, new one up from below, digits chained right → left)
 * Timing is the Test01 reference: the shell's width rides the Test01 spring (ζ .81, ~1.3% settle) while white crossfades
 * into blue on its 183ms fast-start fade; digits roll on the same spring.
 */
// timing: the Test01 motion reference (motion/presets.ts) — one spring for every movement, the fast-start fade-in
const morph = handoff.spring;
const roll = handoff.spring;
const colourFade = { duration: handoff.fade.out, ease: handoff.easeOut };
const fade = { duration: handoff.fade.out, ease: handoff.easeOut };
/** the cart store update lands once the shell has settled: it re-renders every card on the page (ms) */
const COMMIT_AFTER_MS = 360;
const BOX = st.iconSize + st.buttonPadding * 2; // a stepper button's 24px box
/** each piece's offset from the growing edge (its box's edge), in the add / stepper / count looks */
const AT = {
  plus: -(t.size / 2 - BOX / 2), // 6: centred in 36, and also where the stepper's + sits (paddingX 6)
  minus: -(t.expandedWidth - st.paddingX - BOX), // 46
  value: -(t.expandedWidth / 2 - BOX / 2), // 26: centred in 76
  badge: -(t.size / 2 - BOX / 2), // 6: centred in 36
};
const PLUS_REST = t.iconSize / st.iconSize; // 22 / 16: the resting "+" is the stepper's 16px glyph scaled up
const BADGE_SCALE = 13 / 16; // the badge count (13) vs the stepper value (16)

/** the count as an odometer: a changed digit rolls (up when it grows, down when it shrinks), chained right → left */
function RollingCount({ value }: { value: number }) {
  const prev = useRef(value);
  const dir = value >= prev.current ? 1 : -1;
  useEffect(() => {
    prev.current = value;
  }, [value]);
  const digits = String(value).split('');
  return (
    <span className={styles.roll} aria-label={String(value)}>
      <AnimatePresence initial={false} mode="popLayout" custom={dir}>
        {digits.map((d, i) => {
          const fromRight = digits.length - 1 - i;
          return (
            <motion.span
              key={`${fromRight}-${d}`}
              className={styles.rollDigit}
              custom={dir}
              variants={{
                from: (k: number) => ({ y: k > 0 ? '100%' : '-100%', opacity: 0 }),
                at: { y: '0%', opacity: 1, transition: { y: { ...roll, delay: fromRight * 0.035 }, opacity: { ...fade, delay: fromRight * 0.035 } } },
                gone: (k: number) => ({ y: k > 0 ? '-100%' : '100%', opacity: 0, transition: { y: roll, opacity: fade } }),
              }}
              initial="from"
              animate="at"
              exit="gone"
            >
              {d}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </span>
  );
}

/**
 * NoonProductBoxAddToCart as one morphing shape: 36×36 white "+" → (tap) adds 1 and the shell stretches to the 76×36
 * #3866DF stepper (growing towards the card's inner edge) → after 2.5s idle it narrows back to 36 as a blue count badge
 * (tap it to reopen the stepper); trash at 1 morphs it back to the white "+". The count shows at once and the cart store
 * update is committed once the morph has settled (flushed on unmount). A product with sizes (`variant_overlay_url`)
 * opens the variants sheet instead (useCart → showVariantsFlyout), which adds and shows the snackbar itself.
 */
export function QuickAdd({ productId }: { productId: string }) {
  const { cart, addToCart, setQty } = useDemoStore();
  const nav = useNav();
  const stored = cart.find((l) => l.product.id === productId)?.qty ?? 0;
  const [optimistic, setOptimistic] = useState<number | null>(null);
  const qty = optimistic ?? stored;
  useEffect(() => {
    if (optimistic !== null && optimistic === stored) setOptimistic(null);
  }, [optimistic, stored]);
  const storedRef = useRef(stored);
  storedRef.current = stored;
  const commitT = useRef<number>(undefined);
  const pending = useRef<(() => void) | null>(null);
  const commit = (v: number) => {
    setOptimistic(v);
    window.clearTimeout(commitT.current);
    pending.current = () => {
      pending.current = null;
      if (storedRef.current === 0 && v > 0) addToCart(productId, v);
      else setQty(productId, v);
    };
    commitT.current = window.setTimeout(() => startTransition(() => pending.current?.()), COMMIT_AFTER_MS);
  };
  const [expanded, setExpanded] = useState(false);
  const timer = useRef<number>(undefined);
  // leaving before the commit landed (tab switch, card removed) still records the change
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(commitT.current);
      pending.current?.();
    },
    [],
  );
  const bump = () => {
    window.clearTimeout(timer.current);
    setExpanded(true);
    timer.current = window.setTimeout(() => setExpanded(false), 2500);
  };
  const state = qty > 0 ? (expanded ? 'stepper' : 'count') : 'add';
  const stepper = state === 'stepper';
  const open = () => {
    if (!qty && hasSizeOverlay(productId)) return nav.sheet('pdp/variants', { productId });
    // useCartActions: a direct quick add shows no snackbar (only the variants flyout's success does — pdp/variants)
    if (!qty) commit(1);
    bump();
  };
  const change = (v: number) => (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    commit(v);
    if (v > 0) bump();
  };
  const move = { x: morph, scale: morph, opacity: fade };
  // the chain: digits roll right → left 35ms apart, then the trash/minus glyph
  const lastQty = useRef(qty);
  const rollDir = qty >= lastQty.current ? 1 : -1;
  useEffect(() => {
    lastQty.current = qty;
  }, [qty]);
  const chainDelay = String(Math.max(qty, 1)).length * 0.035;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <motion.div
        className={styles.quickShell}
        role={stepper ? 'group' : 'button'}
        tabIndex={stepper ? undefined : 0}
        aria-label={stepper ? 'Quantity' : 'Add to cart'}
        initial={false}
        animate={{ width: stepper ? t.expandedWidth : t.size }}
        whileTap={stepper ? undefined : { scale: 0.92 }}
        transition={{ width: morph, scale: { type: 'spring', stiffness: 700, damping: 38, mass: 0.5 } }}
        onClick={stepper ? undefined : open}
      >
        {/* white "+" surface (border + shadow) and the blue fill over it: the colour morph is their crossfade */}
        <motion.span className={styles.quickSurface} initial={false} animate={{ opacity: state === 'add' ? 1 : 0 }} transition={colourFade} aria-hidden />
        <motion.span className={styles.quickFill} initial={false} animate={{ opacity: state === 'add' ? 0 : 1 }} transition={colourFade} aria-hidden />
        <span className={styles.quickClip}>
          {/* − / trash: parked where the stepper puts it; the shell's clip reveals and hides it */}
          <motion.button
            type="button"
            className={styles.quickPiece}
            aria-label="Decrease"
            tabIndex={stepper ? 0 : -1}
            style={{ pointerEvents: stepper ? 'auto' : 'none' }}
            initial={false}
            animate={{ x: AT.minus, opacity: stepper ? 1 : 0 }}
            transition={move}
            onClick={change(qty - 1)}
          >
            {/* trash ⇄ minus rolls like the digits, last in the chain (up when the count grows, down when it shrinks) */}
            <AnimatePresence initial={false} mode="popLayout" custom={rollDir}>
              <motion.span
                key={qty <= 1 ? 'trash' : 'minus'}
                className={styles.quickGlyph}
                custom={rollDir}
                variants={{
                  from: (k: number) => ({ y: k > 0 ? '100%' : '-100%', opacity: 0 }),
                  at: { y: '0%', opacity: 1, transition: { y: { ...roll, delay: chainDelay }, opacity: { ...fade, delay: chainDelay } } },
                  gone: (k: number) => ({ y: k > 0 ? '-100%' : '100%', opacity: 0, transition: { y: roll, opacity: fade } }),
                }}
                initial="from"
                animate="at"
                exit="gone"
              >
                <Icon name={qty <= 1 ? 'trash' : 'minus'} size={st.iconSize} color="var(--nk-quick-add-count-fg)" />
              </motion.span>
            </AnimatePresence>
          </motion.button>
          {/* the count: rises in with the stepper, slides into the badge and back */}
          <motion.span
            className={`${styles.quickPiece} ${styles.qty}`}
            initial={false}
            animate={state === 'add' ? { x: AT.value, y: 8, scale: 1, opacity: 0 } : { x: stepper ? AT.value : AT.badge, y: 0, scale: stepper ? 1 : BADGE_SCALE, opacity: 1 }}
            transition={{ ...move, y: morph }}
            aria-live="polite"
          >
            <RollingCount value={Math.max(qty, 1)} />
          </motion.span>
          {/* "+": the same glyph in every look; it only shrinks and turns from ink to white */}
          <motion.button
            type="button"
            className={styles.quickPiece}
            aria-label="Increase"
            tabIndex={stepper ? 0 : -1}
            style={{ pointerEvents: stepper ? 'auto' : 'none' }}
            initial={false}
            animate={{ x: AT.plus, scale: state === 'add' ? PLUS_REST : 1, opacity: state === 'count' ? 0 : qty >= 10 && stepper ? st.disabledOpacity : 1 }}
            transition={move}
            onClick={qty < 10 ? change(qty + 1) : undefined}
          >
            <motion.span className={styles.quickGlyph} initial={false} animate={{ opacity: state === 'add' ? 1 : 0 }} transition={colourFade}>
              <Icon name="plus" size={st.iconSize} color={t.icon} />
            </motion.span>
            <motion.span className={styles.quickGlyph} initial={false} animate={{ opacity: state === 'add' ? 0 : 1 }} transition={colourFade}>
              <Icon name="plus" size={st.iconSize} color="var(--nk-quick-add-count-fg)" />
            </motion.span>
          </motion.button>
        </span>
      </motion.div>
    </div>
  );
}

/** Fashion products pick a size first (bappzaar product boxes carry `variant_overlay_url`). */
const hasSizeOverlay = (id: string) => {
  const p = productById(id);
  return p.category === 'Fashion' && !!p.sizes?.length;
};
