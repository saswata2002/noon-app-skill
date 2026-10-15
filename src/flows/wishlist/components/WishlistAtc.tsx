import { AnimatePresence, motion } from 'motion/react';
import { MaskIcon, Pressable } from '../../../components';
import { useDemoStore } from '../../../kit/DemoStore';
import { palette } from '../../../foundations/palette';
import minusIcon from '@assets/wishlist/minus.webp';
import plusIcon from '@assets/wishlist/plus.svg';
import trashIcon from '@assets/wishlist/trash.webp';
import { copy } from '../data';
import { wishlistTokens } from '../tokens';
import { duration, easing, handoff } from '../../../motion/presets';
import styles from '../wishlist.module.css';

const MAX_QTY = 10;

/**
 * NoonProductBoxWishlistAddToCart (V2): soft "+ Add to cart" (h 38) that becomes the soft stepper (h 36, 1.2px paleAzure):
 * trash at qty 1 / minus above, the quantity 18/500 zooming per value (ZoomIn 120 / ZoomOut 80), "+".
 * FadeIn (Test01 fade-in, was 140) / FadeOut 90 between the two; layout on the Test01 spring (was LinearTransition spring mass 1, damping 16, stiffness 180).
 */
export function WishlistAtc({ productId }: { productId: string }) {
  const { cart, addToCart, setQty, removeFromCart } = useDemoStore();
  const qty = cart.find((l) => l.product.id === productId)?.qty ?? 0;
  const a = wishlistTokens.atc;
  const fade = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: duration.fast, ease: easing.out } }, exit: { opacity: 0, transition: { duration: a.fadeOut } } };
  return (
    <motion.div className={styles.atcWrap} layout transition={handoff.spring}>
      <AnimatePresence mode="popLayout" initial={false}>
        {qty > 0 ? (
          <motion.div key="quantity-selector" className={styles.stepper} layout transition={handoff.spring} {...fade}>
            <Pressable className={styles.stepperButton} onClick={() => (qty === 1 ? removeFromCart(productId) : setQty(productId, qty - 1))} aria-label={qty === 1 ? 'Remove' : 'Decrease quantity'}>
              <MaskIcon src={qty === 1 ? trashIcon : minusIcon} size={16} color={palette.primaryBlue} />
            </Pressable>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={qty}
                className={styles.qty}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, transition: { duration: 0.12 } }}
                exit={{ scale: 0, opacity: 0, transition: { duration: 0.08 } }}
              >
                {qty}
              </motion.span>
            </AnimatePresence>
            <Pressable className={styles.stepperButton} onClick={() => setQty(productId, qty + 1)} disabled={qty >= MAX_QTY} aria-label="Increase quantity">
              <MaskIcon src={plusIcon} size={14} color={palette.primaryBlue} />
            </Pressable>
          </motion.div>
        ) : (
          <motion.div key="add-to-cart" className={styles.atcWrap} layout transition={handoff.spring} {...fade}>
            {/* no toast: the floating View Cart pill is the feedback, as in the app */}
            <Pressable className={styles.atc} onClick={() => addToCart(productId)}>
              <MaskIcon src={plusIcon} size={14} color={palette.primaryBlue} />
              {copy.addToCart}
            </Pressable>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
