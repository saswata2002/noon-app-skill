import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNav, useToastsEnabled } from '../../kit/Navigator';
import type { ScreenProps } from '../../kit/types';
import { postorderIcons, supportEmail as defaultEmail, tp } from './data.postorder';
import styles from './postorder.module.css';

export interface NeedHelpParams {
  orderId?: string;
  supportEmail?: string;
}

/**
 * NoonCheckoutPaymentFailureNeedHelpOverlayScreen: title 24/700, description 16, Email + Order ID rows
 * (18/700 label, 16/700 #919191 value + accent copy icon). Tapping a value copies it and shows the
 * "Copied to clipboard" toast at the bottom of the overlay.
 */
export function PaymentFailureHelpScreen({ params }: ScreenProps<NeedHelpParams>) {
  useNav();
  const email = params.supportEmail ?? defaultEmail;
  const orderId = params.orderId || 'NAEH50088421';
  const [toast, setToast] = useState(0);
  const toastsOn = useToastsEnabled();

  const onCopy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    const id = Date.now();
    setToast(id);
    setTimeout(() => setToast((t) => (t === id ? 0 : t)), 2000);
  };

  const row = (label: string, value: string) => (
    <div className={styles.contactInfo}>
      <span className={styles.contactInfoTitle}>{label}</span>
      <button type="button" className={styles.contactInfoValueWrapper} onClick={() => onCopy(value)}>
        <span className={styles.contactInfoValueText}>{value}</span>
        <span className={styles.copyIcon} style={{ maskImage: `url("${postorderIcons.copy}")`, WebkitMaskImage: `url("${postorderIcons.copy}")` }} />
      </button>
    </div>
  );

  return (
    <div className={styles.helpOverlay}>
      <div className={styles.helpContainer}>
        <span className={styles.helpTitle}>{tp.noon_payment_failure_need_help_title}</span>
        <p className={styles.helpDescription}>{tp.noon_payment_failure_need_help_description}</p>
        {email && row(tp.noon_common_email, email)}
        {row(tp.noon_payment_failure_need_help_order_id, orderId)}
      </div>
      <AnimatePresence>
        {toastsOn && toast !== 0 && (
          <motion.div key={toast} className={styles.helpToast} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.25 }}>
            {tp.noon_gm_c_copied_clipboard}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
