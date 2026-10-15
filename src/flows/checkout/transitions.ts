import { registerTransition } from '../../motion/transitions';
import { duration, easing } from '../../motion/presets';

/**
 * NoonPostOrderLoader → NoonOrderConfirmationV3Screen push: `animations.push.content.alpha 0 → 1, 250ms`
 * (no horizontal slide, nothing happens to the screen underneath).
 */
registerTransition('checkout-alpha', {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration.base, ease: easing.standard }, // Test01 S-curve fade
});
