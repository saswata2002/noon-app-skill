import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { cartTokens } from '../tokens';
import { duration, easing } from '../../../motion/presets';
import minusIcon from '@assets/cart/figma/minus.svg';
import plusIcon from '@assets/cart/figma/plus.svg';
import trashIcon from '@assets/cart/figma/trash.svg';
import { Spinner } from '../../../components';
import styles from './item.module.css';

/**
 * NoonCartItemQuantitySelector, Figma "Stepper Button" (7280:20584): 92×38 white, 1px #EBEBEB, r8, 16px icons, 14/18 bold value. Minus becomes trash at quantityMin.
 * Local quantity updates instantly; the cart call is debounced 1200ms (then a loader shows while it commits).
 * Going below quantityMin removes the item.
 */
export function QuantitySelector({
  qty,
  min = 1,
  max,
  disabled,
  removeLoading,
  onCommit,
  onRemove,
  onPendingChange,
}: {
  qty: number;
  min?: number;
  max: number;
  disabled?: boolean;
  removeLoading?: boolean;
  onCommit: (qty: number) => void;
  onRemove: () => void;
  /** NoonCartItem disables the wishlist button while a change is pending */
  onPendingChange?: (pending: boolean) => void;
}) {
  const [local, setLocal] = useState(qty);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!loading) setLocal(qty);
  }, [qty, loading]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const change = (diff: number) => {
    if (disabled || loading || removeLoading) return;
    const next = local + diff;
    if (next > max) return;
    if (next < min) {
      window.clearTimeout(timer.current);
      onRemove();
      return;
    }
    setLocal(next);
    window.clearTimeout(timer.current);
    if (next === qty) {
      onPendingChange?.(false);
      return;
    }
    onPendingChange?.(true);
    timer.current = window.setTimeout(() => {
      setLoading(true);
      window.setTimeout(() => {
        onCommit(next);
        setLoading(false);
        onPendingChange?.(false);
      }, 350);
    }, cartTokens.qtyDebounceMs);
  };

  const busy = loading || removeLoading;
  return (
    <div className={styles.qtyHost} onClick={(e) => e.stopPropagation()}>
      <div className={styles.qty}>
        <motion.button type="button" className={styles.qtyBtn} whileTap={{ scale: 0.85 }} onClick={() => change(-1)} aria-label={local <= min ? 'Remove' : 'Decrease'} disabled={busy}>
          <img src={local <= min ? trashIcon : minusIcon} alt="" />
        </motion.button>
        <span className={styles.qtyNumber}>
          {busy ? (
            <Spinner size={14} thickness={14 / 9} duration={0.7} color="var(--nk-color-text-ink)" />
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={local} className={styles.qtyText} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: duration.base, ease: easing.inOut }}>
                {local}
              </motion.span>
            </AnimatePresence>
          )}
        </span>
        <motion.button type="button" className={`${styles.qtyBtn} ${local >= max ? styles.qtyBtnOff : ''}`} whileTap={{ scale: 0.85 }} onClick={() => change(1)} aria-label="Increase" disabled={busy}>
          <img src={plusIcon} alt="" />
        </motion.button>
      </div>
    </div>
  );
}
