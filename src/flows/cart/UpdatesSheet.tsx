import { motion } from 'motion/react';
import { HtmlText, ProductImage } from '../../components';
import { currency, formatPrice, productById } from '../../data';
import { duration, easing, handoff } from '../../motion/presets';
import { cartUpdates, t } from './data';
import styles from './updates.module.css';

/** noon-en.json noon_updates (plural) */
const updatesLabel = (n: number) => `${n} ${n === 1 ? 'Update' : 'Updates'}`;

/**
 * NoonCartUpdatesOverlayScreen — opened from the "Your cart’s been updated · Tap to review" banner.
 * Header "Cart Updates (n Updates)" with bottom border; each update: 64×80 image (8% overlay, ×qty badge),
 * brand 12 steel, 2-line title, price, then amber message boxes (#F3AC30 at 4% / 20% border).
 */
export function UpdatesSheet() {
  const count = cartUpdates.reduce((n, u) => n + (u.messages?.length || 0), 0);
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>{t.cartUpdatesTitle}</span>
        <span className={styles.headerCount}>({updatesLabel(count)})</span>
      </div>
      <div className={styles.list}>
        {cartUpdates.map((u, i) => {
          const p = productById(u.productId);
          return (
            <motion.div
              key={u.productId}
              className={styles.update}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ y: { ...handoff.spring, delay: 0.08 * i }, opacity: { duration: duration.medium, ease: easing.out, delay: 0.08 * i } }}
            >
              <div className={styles.wrapper}>
                <div className={styles.imageBox}>
                  <ProductImage product={p} width={64} height={80} emojiScale={0.5} />
                  <span className={styles.imageOverlay} />
                  {u.quantity > 1 && <span className={styles.qty}>x{u.quantity}</span>}
                </div>
                <div className={styles.content}>
                  <HtmlText base value={p.brand} style={{ fontSize: 12, color: 'var(--nk-color-cart-steel)' }} />
                  <HtmlText base value={p.title} lines={2} style={{ marginTop: 4 }} />
                  <HtmlText base value={`<b>${currency} ${formatPrice(p.price)}</b>`} style={{ marginTop: 8 }} />
                </div>
              </div>
              {!!u.messages?.length && (
                <div className={styles.messages}>
                  {u.messages.map((m, j) => (
                    <div key={j} className={styles.message}>
                      <HtmlText base value={m} style={{ color: 'var(--nk-palette-kit-amber33)' }} />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
