import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNav } from '../../kit/Navigator';
import type { ScreenProps } from '../../kit/types';
import type { PaymentCode } from './data';
import { mockPaymentError, postorderIcons, supportEmail as defaultEmail, tp } from './data.postorder';
import { duration, easing } from '../../motion/presets';
import styles from './postorder.module.css';
import { Button } from '../../components';

export interface PaymentFailureParams {
  paymentError?: typeof mockPaymentError;
  orderId?: string;
  supportEmail?: string;
  paymentMethodCode?: PaymentCode;
}

/** react-native-typewriter: fixed, typing 1, min/max delay 10–15ms per char, initialDelay 500ms */
function TypeWriter({ text, className }: { text: string; className: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const step = () => {
      i += 1;
      setN(i);
      if (i < text.length) t = setTimeout(step, 10 + Math.random() * 5);
    };
    t = setTimeout(step, 500);
    return () => clearTimeout(t);
  }, [text]);
  // `fixed`: lays out the full text up-front so the box doesn't grow while typing
  return (
    <span className={className}>
      {text.slice(0, n)}
      <span style={{ visibility: 'hidden' }}>{text.slice(n)}</span>
    </span>
  );
}

/**
 * NoonCheckoutPaymentFailureScreen (modal, shown when getOrderStatus returns FAILED with a paymentError):
 * illustration (server imgUrl), "Sorry, we are unable to process your payment", red error box, grey
 * instructions box typed out, and the CTA block fading in after 2s (500ms). CTA → getSession + dismissModal.
 */
export function PaymentFailureScreen({ params }: ScreenProps<PaymentFailureParams>) {
  const nav = useNav();
  const { imgUrl, error, instructions, ctaText, showNeedHelpText } = params.paymentError ?? mockPaymentError;
  const orderId = params.orderId ?? '';
  const supportEmail = params.supportEmail ?? defaultEmail;

  return (
    <div className={styles.failureContainer}>
      <div className={`nk-scroll ${styles.failureScroll}`}>
        <div className={styles.contentWrapper}>
          {imgUrl && <img src={imgUrl} className={styles.failureImg} alt="" />}
          <span className={styles.failureTitle}>{tp.noon_payment_failure_title}</span>
          {error && (
            <div className={`${styles.messageContainer} ${styles.errorMessageContainer}`}>
              <img src={postorderIcons.failureError} width={17} height={17} className={styles.messageIcon} alt="" />
              <span className={styles.messageText}>{error}</span>
            </div>
          )}
          {instructions && (
            <div className={`${styles.messageContainer} ${styles.infoMessageContainer}`}>
              <img src={postorderIcons.failureInstructions} width={17} height={17} className={styles.messageIcon} style={{ objectFit: 'contain' }} alt="" />
              <TypeWriter text={instructions} className={`${styles.messageText} ${styles.infoMessageText}`} />
            </div>
          )}
        </div>
      </div>

      <motion.div className={styles.ctaContainer} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: duration.slower, ease: easing.out }}>
        <Button variant="noon" block whileTap={undefined} onClick={() => nav.back()}>
          {ctaText}
        </Button>
        {showNeedHelpText && (
          <div className={styles.needHelpWrapper}>
            <span className={styles.needHelpText}>{`${tp.noon_payment_failure_need_help_text}  `}</span>
            <Button variant="noonDotted" titleCase dottedColor="var(--nk-color-link)" className={styles.needHelpButton} onClick={() => nav.push('checkout/payment-failure-help', { orderId, supportEmail })}>
              {tp.noon_payment_failure_need_help_button}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
