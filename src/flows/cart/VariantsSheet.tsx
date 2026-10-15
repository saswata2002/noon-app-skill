import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { ExpressBadge, ProductImage, Skeleton, Spinner } from '../../components';
import ratingStar from '@assets/cart/rating-star.svg?raw';
import { useDemoStore } from '../../kit/DemoStore';
import { useNav } from '../../kit/Navigator';
import type { ScreenProps } from '../../kit/types';
import { currency, formatPrice, productById } from '../../data';
import { tween } from '../../motion/presets';
import { VariantOptionChip } from './components/VariantOptionChip';
import { cartVariants } from './data.variants';
import styles from './variants.module.css';

/** strings: en.json sold_by / add_to_cart_button_title_case / update_item / confirm / selection_unavailable */
const s = { soldBy: 'Sold by', addToCart: 'Add to Cart', updateItem: 'Update Item', confirm: 'Confirm', unavailable: 'Selection Unavailable' };

/** NoonReviewUtil.noonReviewColorV2 */
const ratingColor = (v: number) => (v <= 1.9 ? 'var(--nk-color-star-low)' : v <= 2.9 ? 'var(--nk-color-star-mid)' : v <= 3.9 ? 'var(--nk-color-discount-bright)' : v <= 5 ? 'var(--nk-color-star-great)' : 'var(--nk-color-border)');

/**
 * NoonCartVariantsOverlayScreen — opened from an item's `variants_switch` callout.
 * FeedbackView loading → header (80px 3:4 image, name, price row, sold by + seller rating, express flag),
 * 90% separator, option groups (uppercase 12/500 title + chips), fixed attributes, sticky bottom bar:
 * same variant → Confirm (closes); different → Add to Cart (secondary, 42%) + Update Item (primary, 58%).
 */
export function VariantsSheet({ params }: ScreenProps<{ productId?: string }>) {
  const productId = params.productId ?? 'p6';
  const nav = useNav();
  const { cart, updateLine, addToCart } = useDemoStore();
  const product = productById(productId);
  const data = cartVariants[productId];
  const line = cart.find((l) => l.product.id === productId);
  const allOptions = useMemo(() => data?.groups.flatMap((g) => g.options) ?? [], [data]);
  const current = line?.variant ?? allOptions.find((o) => o.isAvailable)?.name;
  const [selected, setSelected] = useState(current);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // master fetches the catalog product (fetchProductBySKU) before rendering
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(id);
  }, []);

  const option = allOptions.find((o) => o.name === selected);
  const price = option?.price ?? product.price;
  const was = option?.was ?? product.was;
  const off = was && was > price ? Math.round(((was - price) / was) * 100) : 0;
  const changed = selected !== current;

  const finish = (fn: () => void) => {
    setBusy(true);
    setTimeout(() => {
      fn();
      nav.back();
    }, 500);
  };

  if (loading) {
    return (
      <div className={styles.root} style={{ minHeight: 280 }}>
        <div className={styles.header}>
          <Skeleton width={80} height={107} radius={10} />
          <div className={styles.info} style={{ gap: 8 }}>
            <Skeleton width="90%" height={14} />
            <Skeleton width="60%" height={14} />
            <Skeleton width={110} height={20} />
          </div>
        </div>
        <div className={styles.separator} />
        <div style={{ padding: '16px', display: 'flex', gap: 8 }}>
          <Skeleton width={70} height={40} radius={8} />
          <Skeleton width={70} height={40} radius={8} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.root} nk-content-in`}>
      <div className={styles.scroll}>
        <div className={styles.header}>
          <div className={styles.imageBox}>
            <ProductImage product={product} width={80} aspect={3 / 4} radius={10} />
            <span className={styles.imageOverlay} />
          </div>
          <div className={styles.info}>
            <div className={styles.name}>
              {product.brand} {product.title}
            </div>
            <div className={styles.priceRow}>
              <span className={styles.sale}>
                <span className={styles.saleCurrency}>{currency}</span> {formatPrice(price)}
              </span>
              {was && was > price && <span className={styles.was}>{formatPrice(was)}</span>}
              {off > 0 && <span className={styles.off}>{off}% OFF</span>}
            </div>
            <div className={data?.sellerRating ? styles.seller : `${styles.seller} ${styles.sellerNoRating}`}>
              <div className={styles.sellerRow}>
                <span className={styles.soldBy}>
                  {s.soldBy} <b>{product.seller ?? 'noon'}</b>
                </span>
                {data?.sellerRating && (
                  <span className={styles.ratingPill}>
                    <span className={styles.star} style={{ color: ratingColor(data.sellerRating.rating) }} dangerouslySetInnerHTML={{ __html: ratingStar.replace('<svg ', '<svg fill="currentColor" ') }} />
                    <span className={styles.ratingValue}>{data.sellerRating.rating}</span>
                    <span className={styles.ratingCount}>({data.sellerRating.count})</span>
                  </span>
                )}
              </div>
              {product.express && (
                <span className={styles.flag}>
                  <ExpressBadge height={18} />
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={styles.separator} />
        <div className={styles.variants}>
          {data?.groups.map((g) => (
            <div key={g.name} className={styles.group}>
              <div className={styles.groupTitle}>{g.name}</div>
              <div className={`${styles.hscroll} nk-hscroll`}>
                {g.options.map((o, i) => (
                  <VariantOptionChip
                    key={o.name}
                    name={o.name}
                    product={o.swatch ? product : undefined}
                    swatch={o.swatch}
                    isSelected={o.name === selected}
                    isDisabled={!o.isAvailable}
                    isFirst={i === 0}
                    isLast={i === g.options.length - 1}
                    onSelect={() => setSelected(o.name)}
                  />
                ))}
              </div>
            </div>
          ))}
          {!!data?.attributes.length && (
            <div className={styles.attributes}>
              {data.attributes.map((a) => (
                <div key={a.code}>
                  <div className={styles.groupTitle}>{a.name}</div>
                  <div className={styles.hscroll}>
                    <VariantOptionChip name={a.value} isSelected isDisabled={false} isFirst isLast={false} onSelect={() => {}} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={styles.bottomBar}>
        <AnimatePresence mode="wait" initial={false}>
          {changed && option?.isAvailable !== false ? (
            <motion.div key="switch" className={styles.buttons} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={tween('fast')}>
              <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} style={{ flex: 0.42 }} disabled={busy} onClick={() => finish(() => addToCart(productId, 1))}>
                {s.addToCart}
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} style={{ flex: 0.58 }} disabled={busy} onClick={() => finish(() => updateLine(productId, { variant: selected }))}>
                {busy ? <Spinner color="var(--nk-color-bg-surface)" track="var(--nk-palette-white-alpha40)" /> : s.updateItem}
              </button>
            </motion.div>
          ) : changed ? (
            <motion.div key="na" className={styles.buttons} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button type="button" className={`${styles.btn} ${styles.btnDisabled}`} style={{ flex: 1 }} disabled>
                {s.unavailable}
              </button>
            </motion.div>
          ) : (
            <motion.div key="confirm" className={styles.buttons} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={tween('fast')}>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} style={{ flex: 1 }} onClick={nav.back}>
                {s.confirm}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
