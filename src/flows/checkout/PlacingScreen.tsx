import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Lottie } from '../../components';
import { useDemoStore } from '../../kit/DemoStore';
import { useNav } from '../../kit/Navigator';
import type { ScreenProps } from '../../kit/types';
import { duration, easing, handoff } from '../../motion/presets';
import { getPaymentFlowType, mockPaymentError, postOrderMessage, supportEmail, tp } from './data.postorder';
import { useCheckout } from './store';
import styles from './placing.module.css';

export interface PlacingParams {
  /** demo: the order-status call returns FAILED + paymentError → NoonCheckoutPaymentFailureScreen */
  fail?: boolean;
}

/** Easing.inOut(Easing.cubic) / Easing.out(Easing.cubic) */
const inOutCubic = easing.inOut;
const outCubic = easing.out;

/**
 * NoonPostOrderLoader (rendered by NoonCheckoutScreen as `renderCustomReLoader` while RELOADING_POST_ORDER):
 * white full-screen card entering with SlideInDown (400ms, out cubic), looping box Lottie and the
 * useNoonPostOrderMessage copy. Demo timeline mirrors placeOrder → getOrderStatus → completePaymentIntent:
 * order created → msg 2 (BNPL / bank flows), payment redirect → msg 3 after 800ms, then success.
 * Success: after 1500ms the processing Lottie fades 1→0 (500ms inOut cubic) while the tick Lottie fades in,
 * the status text fades out (300ms) and "Yay! Your order has been placed!" fades in 500ms later (250ms out cubic).
 * When the tick Lottie finishes → push NoonOrderConfirmationV3Screen (alpha 250ms).
 */
export function PlacingScreen({ params }: ScreenProps<PlacingParams>) {
  const nav = useNav();
  const { clearCart } = useDemoStore();
  const lastOrder = useCheckout((s) => s.lastOrder);
  const paymentCode = lastOrder?.paymentCode;
  const flow = getPaymentFlowType(paymentCode);

  const [msgIndex, setMsgIndex] = useState<0 | 1 | 2>(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const [showProcessing, setShowProcessing] = useState(true);
  const [tickTextVisible, setTickTextVisible] = useState(false);
  const done = useRef(false);

  // placeOrder → getOrderStatus timeline
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const redirects = flow !== 'OTHER'; // card / BNPL go through completePaymentIntent → redirect
    at(900, () => setMsgIndex(1)); // onPostOrderDisplayMsg2 (placeOrderV2 resolved)
    if (redirects) at(1300, () => setMsgIndex(2)); // onPostOrderDisplayMsg3 (500 + 800ms)
    const resolveAt = redirects ? 2600 : 1800;
    if (params.fail) {
      // FAILED + paymentError → setScreenState(SUCCESS) (loader goes away) + showModal(NoonCheckoutPaymentFailureScreen)
      at(resolveAt, () =>
        nav.replace(
          'checkout/payment-failure',
          { paymentError: mockPaymentError, orderId: lastOrder?.orderId ?? '', supportEmail, paymentMethodCode: paymentCode },
          { presentation: 'modal', transition: 'modal' },
        ),
      );
    } else {
      at(resolveAt, () => {
        setIsSuccess(true); // placeOrderSuccess → dispatch(getCartData) (cart is now empty)
        clearCart();
      });
    }
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // isSuccess → 1500ms → tick
  useEffect(() => {
    if (!isSuccess) return;
    const t1 = setTimeout(() => setShowTick(true), 1500);
    return () => clearTimeout(t1);
  }, [isSuccess]);

  const onTickFinish = () => {
    if (done.current) return;
    done.current = true;
    nav.replace('checkout/confirmation', {}, { transition: 'checkout-alpha' });
  };

  return (
    <motion.div className={styles.container} initial={{ y: '100%' }} animate={{ y: 0 }} transition={handoff.spring}>
      <div className={styles.animationContainer}>
        {showProcessing && (
          <motion.div
            className={styles.animationWrapper}
            animate={{ opacity: showTick ? 0 : 1 }}
            transition={{ duration: duration.slower, ease: inOutCubic }}
            onAnimationComplete={() => {
              if (!showTick) return;
              setShowProcessing(false);
              setTimeout(() => setTickTextVisible(true), 500);
            }}
          >
            <Lottie name="boxAnim" loop style={{ width: '100%', height: '100%' }} />
          </motion.div>
        )}

        {showTick && (
          <motion.div className={styles.animationWrapper} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: duration.slower, ease: inOutCubic }}>
            <Lottie name="orderConf" style={{ width: '100%', height: '100%' }} onComplete={onTickFinish} />
          </motion.div>
        )}

        {showTick ? (
          <motion.div className={styles.tickTextContainer} initial={{ opacity: 0 }} animate={{ opacity: tickTextVisible ? 1 : 0 }} transition={{ duration: duration.medium, ease: outCubic }}>
            <p className={`${styles.statusHeader} ${styles.reducedWidth}`}>{tp.noon_order_confirmation_title}</p>
          </motion.div>
        ) : (
          <div className={styles.textContainer}>
            <p className={styles.statusHeader}>{postOrderMessage(paymentCode, msgIndex)}</p>
          </div>
        )}
      </div>
      {!isSuccess && <div className={styles.overlay} />}
    </motion.div>
  );
}
