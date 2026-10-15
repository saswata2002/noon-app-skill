import { ProductImage, Toast } from '../../../components';
import type { Product } from '../../../data';
import { handoff } from '../../../motion/presets';
import { t } from '../data';
import styles from './snackbar.module.css';

/**
 * NoonSnackBar (wishlist_v2 move-to-wishlist): white r16 card (1px newBorderColor, padding 12, margin 12)
 * over a soft blue gradient; 36×48 product image in a #F2F3F7 r8 box, "Item moved to " + bold "Wishlist" (16px).
 * Slides in on the Test01 spring (was damping 16, stiffness 120, mass .7) and hides after 3s.
 */
export function CartSnackBar({ product, onHide, onPress }: { product: Product | null; onHide: () => void; onPress: () => void }) {
  return (
    <Toast
      item={product}
      duration={3000}
      onHide={onHide}
      layerClassName={styles.overlay}
      className={styles.wrapper}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '110%' }}
      transition={handoff.spring}
    >
      {(p) => (
        <>
          <span className={styles.gradient} />
          <button type="button" className={styles.container} onClick={onPress}>
            <span className={styles.imageContainer}>
              <span className={styles.imageInner}>
                <ProductImage product={p} width={36} height={48} radius={6} emojiScale={0.6} />
              </span>
            </span>
            <span className={styles.textContainer}>
              <span className={styles.title}>
                {t.movedToPrefix}
                <b>{t.wishlist}</b>
              </span>
            </span>
          </button>
        </>
      )}
    </Toast>
  );
}
