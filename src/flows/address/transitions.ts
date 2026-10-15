import { registerTransition } from '../../motion/transitions';
import { duration, easing, handoff } from '../../motion/presets';

/**
 * Address modal animations from src/constants/AddressConstants.ts.
 * Registered from this flow (instead of src/motion/custom) so the flow stays self-contained.
 */

// AddressModalNavigationOptions.ANIMATED — alpha 0→1 (350ms) + translationY -15→0 (300ms), accelerateDecelerate
registerTransition('address-map', {
  initial: { opacity: 0, y: -15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
  transition: { y: handoff.spring, opacity: { duration: handoff.fade.out, ease: handoff.easeOut } }, // Test01: spring + ease-out fade
});

// SearchScreen: modal with animations disabled + FadeIn(150) on the content
registerTransition('address-search', {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration.base, ease: easing.standard }, // Test01 S-curve fade
});

// AddressCreateSuccessScreenPushAnimations (alpha 0→1, 300ms) / DismissModalAnimations (alpha 1→0 + translationY → -screenHeight, 400ms)
registerTransition('address-success', {
  initial: { opacity: 0 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '-100%' },
  transition: { y: handoff.spring, opacity: { duration: duration.base, ease: easing.standard } }, // Test01
});
