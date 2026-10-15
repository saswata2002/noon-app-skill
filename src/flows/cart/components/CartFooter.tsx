import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import type { CartLine, CartTotals } from '../../../kit/DemoStore';
import { currency, formatPrice } from '../../../data';
import { t } from '../data';
import { buildDynamicInvoice } from '../invoice';
import { cartTokens } from '../tokens';
import { duration, easing, handoff } from '../../../motion/presets';
import { NoonOneLogo } from './NoonOneLogo';
import savingsWave from '@assets/cart/footer/savings-wave.svg';
import { DynamicInvoice } from './DynamicInvoice';
import { CartGlassFooter } from './CartGlassFooter';
import styles from './footer.module.css';

const INV = cartTokens.invoice;

/**
 * NoonCartScreen sticky bar, styled to the Figma Cart Sticky footer (All flows Af34gfmhQ1D0wstXUEHSIF · 127:40209):
 * the "Color waves" savings tab ("₫10 saved!" + noon One) overlapping the footer by 16,
 * the invoice sheet that slides from behind the footer (translateY 400 → 12, 300ms; backdrop 0 → .5 in 200ms;
 * swipe down > 50px closes), and the footer (r12 top, nudges on the left toggle the invoice, Checkout CTA).
 */
type CartFooterProps = { totals: CartTotals; cart: CartLine[]; isTabRoot: boolean; disabled?: boolean; onCheckout: () => void; onHeightChange?: (h: number) => void };

/** The Cart tab gets the floating Liquid Glass card (CartGlassFooter); a pushed cart keeps the bappzaar footer. */
export function CartFooter({ isTabRoot, ...props }: CartFooterProps) {
  return isTabRoot ? <CartGlassFooter {...props} /> : <ClassicCartFooter {...props} isTabRoot={false} />;
}

function ClassicCartFooter({ totals, cart, isTabRoot, disabled, onCheckout, onHeightChange }: CartFooterProps) {
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);
  const savingsRef = useRef<HTMLDivElement>(null);
  const drag = useDragControls();

  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      // the savings tab shows 32 of its 48 above the footer
      const tab = savingsRef.current ? savingsRef.current.offsetHeight - 16 : 0;
      onHeightChange?.(tab + (footerRef.current?.offsetHeight ?? 0));
    });
    if (footerRef.current) ro.observe(footerRef.current);
    if (savingsRef.current) ro.observe(savingsRef.current);
    return () => ro.disconnect();
  }, [onHeightChange]);

  const press = () => {
    if (disabled || locked) return;
    setLocked(true);
    onCheckout();
    window.setTimeout(() => setLocked(false), 1750);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 50) setOpen(false);
  };

  const sections = buildDynamicInvoice(totals, cart);


  return (
    <div className={styles.stickyBar} data-tab={isTabRoot || undefined}>
      {/* backdrop (zIndex 2 under the sticky bar) */}
      <AnimatePresence>
        {open && <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0, transition: { duration: duration.base, ease: easing.inOut } }} transition={{ duration: duration.fast, ease: easing.out }} onClick={() => setOpen(false)} />}
      </AnimatePresence>

      {/* footer savings — Figma "Color waves 🌊" (All flows 127:40210): 239 × 48 wave, "₫10 saved!" + noon One logo */}
      <AnimatePresence>
        {totals.totalSavings > 0 && (
          <motion.div
            ref={savingsRef}
            className={styles.savings}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: open ? 0 : 1 }}
            exit={{ y: 20, opacity: 0, transition: { y: handoff.spring, opacity: { duration: duration.medium, ease: easing.inOut } } }}
            transition={{ y: handoff.spring, opacity: { duration: duration.medium, ease: easing.out } }}
          >
            <img src={savingsWave} alt="" width={239} height={48} className={styles.savingsWave} />
            <span className={styles.savingsLabel}>
              <span className={styles.savingsText}>
                <b>
                  {currency}
                  {formatPrice(totals.totalSavings)}
                </b>{' '}
                saved!
              </span>
              <NoonOneLogo />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* invoice — anchored to the footer top, slides from behind it */}
      <div className={styles.invoiceAnchor}>
        <motion.div
          className={styles.invoice}
          initial={false}
          animate={{ y: open ? INV.openTranslateY : INV.closedTranslateY + 200, visibility: open ? 'visible' : 'hidden' }}
          transition={{ y: handoff.spring, visibility: { delay: open ? 0 : 0.4 } }}
          drag="y"
          dragControls={drag}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={onDragEnd}
          onPointerDown={(e) => drag.start(e)}
        >
          <div className={styles.invoiceScroll}>
            <DynamicInvoice sections={sections} />
          </div>
        </motion.div>
      </div>

      <motion.div ref={footerRef} className={styles.footer} data-open={open || undefined}>
        <div className={styles.footerContent}>
          <button type="button" className={styles.nudges} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            <span className={styles.totalLabel}>{t.total}</span>
            <span className={styles.totalPrice}>{`${currency} ${totals.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
          </button>
          <motion.button type="button" className={`${styles.cta} ${disabled ? styles.ctaDisabled : ''}`} whileTap={{ opacity: 0.6 }} onClick={press} disabled={disabled}>
            {t.checkout}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
