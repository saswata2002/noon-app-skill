import { motion } from 'motion/react';
import { Button } from '../../../components';
import { useNav } from '../../../kit/Navigator';
import errorIcon from '@assets/checkout/rewards-coupon-error.svg';
import overridenIcon from '@assets/checkout/rewards-coupon-overriden.svg';
import successIcon from '@assets/checkout/rewards-coupon-success.svg';
import { couponFor, rt } from '../data.rewards';
import { useCheckout } from '../store';
import { useCheckoutTotals } from '../totals';
import section from './section.module.css';
import { duration, easing } from '../../../motion/presets';
import styles from './CouponStatus.module.css';

/** COUPON_GRADIENT_* (NoonTokens): error noonErrorSubtle → white, default noonSuccessSubtle → white, warning banner paleMint → white */
const GRADIENT = {
  invalid: 'linear-gradient(90deg, var(--nk-color-danger-surface), var(--nk-color-bg-surface))',
  valid: 'linear-gradient(90deg, var(--nk-color-success-surface), var(--nk-color-bg-surface))',
  warning: 'linear-gradient(90deg, var(--nk-color-success-surface), var(--nk-color-bg-surface))',
};

/**
 * NoonCheckoutCouponStatus (FeatureFlags.isCouponsOnCheckoutEnabled, `coupon_status` section):
 * 2px white frame around a r14 gradient card — status icon, title (deepGreen / dangerRed), message, and a
 * dotted "Change card" / "Add card" action when the coupon needs a different card. Fades in over 400ms.
 */
export function CouponStatus() {
  const nav = useNav();
  const code = useCheckout((s) => s.coupon);
  const { discount } = useCheckoutTotals();
  if (!code) return null;
  const coupon = couponFor(code, discount);
  const icon = coupon.state === 'invalid' ? errorIcon : coupon.state === 'warning' ? overridenIcon : successIcon;
  const message = coupon.state === 'invalid' ? coupon.error || coupon.message : coupon.message;

  return (
    <motion.div key={`${code}-${coupon.state}`} className={`${section.section} ${styles.cardBorder}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: duration.slow, ease: easing.out }}>
      <div className={styles.cardGradient} style={{ background: GRADIENT[coupon.state] }}>
        {coupon.state === 'warning' && (
          <div className={styles.overriddenBanner}>
            <span className={styles.overriddenBannerText}>{rt.noon_checkout_discount_applied}</span>
          </div>
        )}
        <div className={styles.row} role="alert" aria-live={coupon.state === 'invalid' ? 'assertive' : 'polite'}>
          <img src={icon} width={20} height={20} alt="" />
          <div className={styles.textContent}>
            {coupon.title ? <span className={`${styles.title} ${coupon.state === 'invalid' ? styles.titleInvalid : styles.titleValid}`}>{coupon.title}</span> : null}
            {message ? <span className={styles.message}>{message}</span> : null}
          </div>
          {coupon.action && (
            <Button variant="noonDotted" dottedColor="var(--nk-color-text-primary)" className={styles.action} onClick={() => nav.push(coupon.action === 'change_card' ? 'checkout/cards-select' : 'checkout/add-card')}>
              {coupon.action === 'change_card' ? rt.noon_checkout_change_card : rt.noon_checkout_add_card}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
