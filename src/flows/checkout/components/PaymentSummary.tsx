import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { currency } from '../../../data';
import divider from '@assets/checkout/figma/summary-divider.svg';
import savingsWave from '@assets/checkout/figma/savings-wave.svg';
import savingsWave351 from '@assets/checkout/figma/savings-wave-351.svg';
import noonOneA from '@assets/checkout/figma/noonone-logo-a.svg';
import noonOneB from '@assets/checkout/figma/noonone-logo-b.svg';
import noonOneC from '@assets/checkout/figma/noonone-logo-c.svg';
import { cashback, tf } from '../data';
import type { CheckoutTotals } from '../totals';
import { formatAmount } from '../utils';
import { duration, easing, handoff } from '../../../motion/presets';
import styles from './PaymentSummary.module.css';

const money = (n: number) => `${currency}${formatAmount(n)}`;
const layout = { ...handoff.spring, opacity: { duration: duration.medium, ease: easing.out } };

/**
 * Figma "Mini Badge" — a 28.35×19.44 window onto the 56.09×15.68 noon One logo (shifted −28.35 / +0.75 + pt 2.835),
 * which leaves the yellow "one" lozenge visible. The three logo groups keep their Figma insets.
 */
function NoonOneMiniBadge() {
  return (
    <span className={styles.miniBadge} role="img" aria-label="noon One">
      <span className={styles.miniBadgeLogo}>
        <img className={styles.logoA} src={noonOneA} width={27.0533} height={15.6812} alt="" />
        <img className={styles.logoB} src={noonOneB} width={18.2454} height={5.72784} alt="" />
        <img className={styles.logoC} src={noonOneC} width={27.2146} height={6.75146} alt="" />
      </span>
    </span>
  );
}

function Strip({ label, children, underline }: { label: string; children: ReactNode; underline?: boolean }) {
  return (
    <motion.div layout="position" transition={layout} className={styles.strip} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: duration.medium, ease: easing.inOut } }}>
      <span className={underline ? styles.labelUnderlined : styles.label}>{label}</span>
      <span className={styles.right}>{children}</span>
    </motion.div>
  );
}

/**
 * Figma "🚧 Checkout 2.0" Payment Summary (14288:184228): white card (r12 top / r16 bottom, 2px wider than the
 * other sections, pb 12 below) — "Payment summary" 16/24 Bold; strips (h28, gap 6): Subtotal (dotted underline,
 * struck MRP + value), Delivery fee ("Free with" + noon One mini badge + fee), the session's extra rows (add-ons,
 * points, credits, donation); dashed divider; Coupon discount; divider; Total 17/20 Bold; then the Emerald/100
 * savings strip under the wave (Coupon Cashback, noon One credit card cashback + note). Amounts are cart-driven.
 */
export function PaymentSummary({ totals, coupon, flush = false }: { totals: CheckoutTotals; coupon: string | null; /** Figma "All flows" 127:44358: same width as the other sections (351, no −2 bleed) + its 351 wave */ flush?: boolean }) {
  const mrp = totals.mrp;
  const extras: { label: string; value: string }[] = [];
  if (totals.addOns) extras.push({ label: 'Protection plans', value: money(totals.addOns) });
  if (totals.donation) extras.push({ label: 'Donation', value: money(totals.donation) });
  if (totals.burnAmount) extras.push({ label: 'Points redeemed', value: `– ${money(totals.burnAmount)}` });
  if (totals.creditsUsed) extras.push({ label: 'noon Credits', value: `– ${money(totals.creditsUsed)}` });
  const couponCashback = cashback.coupon(totals.subtotal, !!coupon);
  const cardCashback = cashback.noonOneCard(totals.orderPaymentAmount);

  return (
    <div className={flush ? `${styles.wrapper} ${styles.flush}` : styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.title}>{tf.paymentSummary}</span>
          </div>
          <div className={styles.breakdown}>
            <div className={styles.list}>
              <div className={styles.strips}>
                <AnimatePresence initial={false}>
                  <Strip key="subtotal" label={tf.subtotal} underline>
                    {mrp > totals.subtotal && <span className={styles.struck}>{`${tf.aedPrefix} ${formatAmount(mrp)}`}</span>}
                    <span className={styles.value}>{formatAmount(totals.subtotal)}</span>
                  </Strip>
                  <Strip key="delivery" label={tf.deliveryFee}>
                    {totals.shippingFee > 0 ? (
                      <>
                        <span className={styles.freeWith}>
                          <span className={styles.freeWithText}>{tf.freeWith}</span>
                          <NoonOneMiniBadge />
                        </span>
                        <span className={styles.value}>{money(totals.shippingFee)}</span>
                      </>
                    ) : (
                      <span className={styles.valueFree}>{tf.free}</span>
                    )}
                  </Strip>
                  {extras.map((e) => (
                    <Strip key={e.label} label={e.label}>
                      <span className={styles.value}>{e.value}</span>
                    </Strip>
                  ))}
                </AnimatePresence>
              </div>
              <img className={styles.divider} src={divider} width={328} height={1} alt="" />
            </div>
            {totals.discount > 0 && (
              <>
                <div className={styles.couponContainer}>
                  <div className={styles.strip}>
                    <span className={styles.label}>{tf.couponDiscount}</span>
                    <span className={styles.value}>{`– ${money(totals.discount)}`}</span>
                  </div>
                </div>
                <img className={styles.divider} src={divider} width={328} height={1} alt="" />
              </>
            )}
            <div className={styles.grandTotal}>
              <span className={styles.totalLabel}>{tf.total}</span>
              <span className={styles.totalValue}>{money(totals.orderPaymentAmount)}</span>
            </div>
          </div>
        </div>
        {(couponCashback > 0 || cardCashback > 0) && (
          <div className={styles.savings}>
            <img className={styles.savingsWave} src={flush ? savingsWave351 : savingsWave} width={flush ? 351 : 355} height={5} alt="" />
            <div className={styles.savingsContent}>
              {couponCashback > 0 && (
                <div className={styles.savingsRow}>
                  <span className={styles.savingsLabel}>{tf.couponCashback}</span>
                  <span className={styles.savingsValue}>{`${currency}${formatAmount(couponCashback, 0)}`}</span>
                </div>
              )}
              {cardCashback > 0 && (
                <div className={styles.savingsGroup}>
                  <div className={styles.savingsRow}>
                    <span className={styles.savingsLabel}>{tf.noonOneCardCashback}</span>
                    <span className={styles.savingsValue}>{`${currency}${formatAmount(cardCashback, Number.isInteger(cardCashback) ? 0 : 2)}`}</span>
                  </div>
                  <span className={styles.savingsInfo}>{tf.cashbackInfo}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
