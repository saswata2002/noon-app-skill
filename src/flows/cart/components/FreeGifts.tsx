import { motion } from 'motion/react';
import { ProductImage } from '../../../components';
import { useNav } from '../../../kit/Navigator';
import { duration, easing } from '../../../motion/presets';
import { currency, formatPrice, type Product } from '../../../data';
import addPlus from '@assets/cart/figma/add-plus-16.svg';
import giftGreen from '@assets/cart/figma/gift-green.svg';
import lockBadge from '@assets/cart/figma/lock-badge-freebie.svg';
import { t } from '../data';
import styles from './sections.module.css';

/**
 * Figma "OOS style freebies" (11316:46017): 1px Border/secondary-alpha r16 card on a #F6FEFD → white wash;
 * header p12 (20px gift + 16/24 bold #101628); freebie row (pb 12, pt 4, 327 wide): 80×109 #F5F7FB r12 image
 * (40% opacity, 34px lock badge), details (title 14/18 500, FREE 14/18 bold Grass/700 + strike was price),
 * "<b>AED x</b> left to unlock" 14/14, 4px Grass/700 progress on Blue-Gray/300, and the 57×26 "+ Add".
 */
export function FreeGifts({ product, unlockAt, current }: { product: Product; unlockAt: number; current: number }) {
  const nav = useNav();
  const left = Math.max(0, unlockAt - current);
  const pct = Math.min(100, (current / unlockAt) * 100);
  return (
    <section className={styles.gifts}>
      <div className={styles.giftsHeader}>
        <img src={giftGreen} alt="" />
        <h3 className={styles.giftsTitle}>{t.freeGiftsTitle}</h3>
      </div>
      <div className={styles.giftsBody}>
        <div className={styles.freebie}>
          <div className={styles.freebieImage}>
            <ProductImage product={product} width={80} height={96} style={{ background: 'transparent', opacity: left > 0 ? 0.4 : 1 }} />
            {left > 0 && <img src={lockBadge} alt="" className={styles.freebieLock} />}
          </div>
          <div className={styles.freebieDetails}>
            <div className={styles.freebieTop}>
              <span className={styles.freebieTitle}>{`${product.brand} ${product.title}`}</span>
              <span className={styles.freebiePriceRow}>
                <span className={styles.freebieFree}>{t.free}</span>
                <span className={styles.freebieWas}>{`${currency}${formatPrice(product.was ?? product.price)}`}</span>
              </span>
            </div>
            <div className={styles.freebieProgressRow}>
              <div className={styles.freebieProgress}>
                <span className={styles.freebieLeft}>
                  <b>{`${currency}${formatPrice(left)}`}</b> {t.leftToUnlock}
                </span>
                <span className={styles.freebieTrack}>
                  <motion.span className={styles.freebieFill} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: duration.slower, ease: easing.out }} />
                </span>
              </div>
              <motion.button type="button" className={styles.addButton} whileTap={{ scale: 0.95 }} onClick={() => nav.push('plp/listing')}>
                <img src={addPlus} alt="" />
                <span>{t.add}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
