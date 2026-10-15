import { AnimatePresence, motion } from 'motion/react';
import { SkuCard } from '../../../components';
import { handoff } from '../../../motion/presets';
import type { Product } from '../../../data';
import styles from './sections.module.css';

/**
 * Figma "Product Carousel" (10575:94169 offers · 10575:94308 wishlist): white r16 card, "Cards Header"
 * (Label2/Bold 16/20 #0E0E0E + optional "Sponsored" 12/14 500 #959595), then a row of 134px SKU cards (gap 12) — the central `SkuCard` in its `cart` look (Figma "SKU" 10575:94182).
 * A card that leaves the list (the offers row drops products once they are in the cart) stays put while its "+" shows
 * the ✓, then fades and shrinks away and its neighbours slide over (no one-frame removal).
 */
// timing: Test01 — the leaving card fades on the S-curve (189ms), the row closes on the Test01 spring
const leave = { opacity: 0, scale: 0.92, transition: { delay: 0.55, duration: handoff.fade.io, ease: handoff.easeInOut } };
const slide = handoff.spring;
export function CartCarousel({ title, sponsored, items }: { title: string; sponsored?: string; items: Product[] }) {
  if (!items.length) return null;
  return (
    <section className={styles.carousel}>
      <div className={styles.cardsHeader}>
        <h3 className={styles.cardsTitle}>{title}</h3>
        {sponsored && <span className={styles.cardsSponsored}>{sponsored}</span>}
      </div>
      <div className={`nk-hscroll ${styles.carouselRow}`}>
        <AnimatePresence initial={false}>
          {items.map((p) => (
            <motion.div key={p.id} layout="position" exit={leave} transition={{ layout: slide }} style={{ flexShrink: 0 }}>
              <SkuCard product={p} look="cart" rating={false} imageSize={124} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
