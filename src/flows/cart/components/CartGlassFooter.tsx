import { AnimatePresence, motion, useReducedMotion, type Transition } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import type { CartLine, CartTotals } from '../../../kit/DemoStore';
import { currency, formatPrice } from '../../../data';
import { GlassFade, HtmlText, Pressable } from '../../../components';
import { t } from '../data';
import { buildDynamicInvoice } from '../invoice';
import { duration, easing, handoff } from '../../../motion/presets';
import { NoonOneLogo } from './NoonOneLogo';
import savingsWave from '@assets/cart/footer/savings-wave.svg';
import { DynamicInvoice } from './DynamicInvoice';
import base from './footer.module.css';
import html from './html.module.css';
import styles from './glassFooter.module.css';

/** the savings tab: 239 wide, 32 of its 48 show above the card */
const TAB_W = 239;
const TAB_H = 32;
/** the open "You're saving" panel: 15 + 20 + 15 (NoonDynamicInvoice special section) */
const PANEL_H = 50;

/**
 * Cart-tab sticky footer on Liquid Glass (bappzaar liquid-upgrade NoonCartScreen `isLiquidGlass`): a floating glass card
 * as wide as the tab bar with the savings tab on its top-left. Tapping Total opens the order summary as one continuous
 * motion — the savings tab and the "You're saving" panel occupy the same spot, so ONE green surface grows from the tab
 * into the full-width panel (width / height / position on one critically damped spring; its wave outline hands over to
 * a flat fill; the label cross-fades instead of stretching) while the card's top edge rises behind it to reveal the
 * summary, which settles in a beat later. The card turns from glass to white and the page dims alongside. Closing plays
 * it in reverse: the summary folds first, then the panel shrinks back into the tab.
 */
export function CartGlassFooter({ totals, cart, disabled, onCheckout, onHeightChange }: { totals: CartTotals; cart: CartLine[]; disabled?: boolean; onCheckout: () => void; onHeightChange?: (h: number) => void }) {
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [cardW, setCardW] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;
  const reduce = useReducedMotion();
  const hasSavings = totals.totalSavings > 0;
  const sections = buildDynamicInvoice(totals, cart);
  const special = sections.find((s) => s.isSpecial)?.entries[0];

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setCardW(el.clientWidth);
      // the list pads for the closed footer (the open summary sits over the dimmed page)
      if (!openRef.current) onHeightChange?.((hasSavings ? TAB_H : 0) + el.offsetHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeightChange, hasSavings]);

  const press = () => {
    if (disabled || locked) return;
    setLocked(true);
    onCheckout();
    window.setTimeout(() => setLocked(false), 1750);
  };

  // one spring for every piece of geometry (the Test01 spring, ζ 0.81, settles in ~0.55s); fades are short tweens on top
  const spring: Transition = reduce ? { duration: 0 } : handoff.spring;
  const fade = (d: number, delay = 0): Transition => (reduce ? { duration: 0 } : { duration: d, delay, ease: easing.inOut });
  const geometry = open ? spring : { ...spring, delay: reduce ? 0 : 0.08 }; // closing: the summary folds first

  return (
    <div className={`${base.stickyBar} ${styles.bar}`} data-tab="" data-glass-footer="">
      <GlassFade className={base.fade} />
      <AnimatePresence>
        {open && <motion.div className={base.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} transition={fade(duration.base)} onClick={() => setOpen(false)} />}
      </AnimatePresence>

      <div ref={cardRef} className={styles.card} data-open={open || undefined}>
        {hasSavings && <motion.span className={styles.fillet} initial={false} animate={{ opacity: open ? 0 : 1 }} transition={open ? fade(0.08) : fade(0.12, 0.2)} aria-hidden />}
        {/* the order summary: the card's top edge rises to reveal it */}
        <motion.div className={styles.summary} initial={false} animate={{ height: open ? 'auto' : 0 }} transition={open ? { ...spring, delay: reduce ? 0 : 0.06 } : spring} aria-hidden={!open}>
          <motion.div initial={false} animate={{ opacity: open ? 1 : 0, y: open ? 0 : 10 }} transition={open ? { y: { ...spring, delay: reduce ? 0 : 0.14 }, opacity: fade(duration.medium, 0.14) } : { y: spring, opacity: fade(0.12) }}>
            <div className={styles.summaryInner}>
              <DynamicInvoice sections={sections} part="normal" />
            </div>
          </motion.div>
        </motion.div>

        {/* the savings tab ⇄ "You're saving" panel: one green surface */}
        {hasSavings && (
          <motion.div
            className={styles.green}
            initial={false}
            animate={{ width: open ? cardW || '100%' : TAB_W, height: open ? PANEL_H : TAB_H, marginTop: open ? 0 : -TAB_H }}
            transition={geometry}
          >
            {/* closed: the "Color waves" tab outline (top 32 of the 48 wave) */}
            <motion.img src={savingsWave} alt="" width={TAB_W} height={48} className={styles.wave} initial={false} animate={{ opacity: open ? 0 : 1 }} transition={open ? fade(duration.base) : fade(duration.fast, 0.14)} />
            {/* open: the flat emerald panel with the scalloped top edge of the summary above it */}
            <motion.span className={styles.fill} initial={false} animate={{ opacity: open ? 1 : 0 }} transition={open ? fade(duration.fast) : fade(duration.base, 0.12)} />
            <motion.span className={styles.scallops} initial={false} animate={{ opacity: open ? 1 : 0 }} transition={open ? fade(duration.fast, 0.2) : fade(0.1)} />

            <motion.span className={styles.tabLabel} initial={false} animate={{ opacity: open ? 0 : 1 }} transition={open ? fade(0.12) : fade(duration.fast, 0.16)} aria-hidden={open}>
              <span className={base.savingsText}>
                <b>
                  {currency}
                  {formatPrice(totals.totalSavings)}
                </b>{' '}
                saved!
              </span>
              <NoonOneLogo />
            </motion.span>
            {special && (
              <motion.span className={styles.panelLabel} initial={false} animate={{ opacity: open ? 1 : 0, y: open ? 0 : 6 }} transition={open ? { y: { ...spring, delay: reduce ? 0 : 0.14 }, opacity: fade(duration.fast, 0.14) } : { y: spring, opacity: fade(0.12, 0.08) }} aria-hidden={!open}>
                <HtmlText base value={special.title} className={html.invoiceText} />
              </motion.span>
            )}
          </motion.div>
        )}

        <div className={`${base.footerContent} ${styles.content}`}>
          <Pressable scale={1} className={base.nudges} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            <span className={base.totalLabel}>{t.total}</span>
            <span className={base.totalPrice}>{`${currency} ${totals.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
          </Pressable>
          <Pressable scale={1} className={`${base.cta} ${disabled ? base.ctaDisabled : ''}`} whileTap={{ opacity: 0.6 }} onClick={press} disabled={disabled}>
            {t.checkout}
          </Pressable>
        </div>
      </div>
    </div>
  );
}
