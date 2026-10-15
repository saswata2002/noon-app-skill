import { registerTransition } from '../../motion/transitions';
import { duration, easing } from '../../motion/presets';

/**
 * noon One overlays (navigator.showOverlay → VIP*OverlayScreen wrapped in VIPOverlayBottomSheet) draw their own
 * scrim + floating sheet over the screen below, which stays fully visible and untouched. The kit stack entry is made
 * transparent (no page background / push shadow) and the overlay component runs the real OverlayBottomSheet motion;
 * on exit the whole layer fades so a `nav.back()` from anywhere still closes it cleanly.
 */
registerTransition('noonone-overlay', {
  initial: { backgroundColor: 'transparent', boxShadow: 'none', opacity: 1 },
  animate: { backgroundColor: 'transparent', boxShadow: 'none', opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration.base, ease: easing.standard }, // Test01 S-curve fade
});

/** Pushes with `animations.push.enabled: false` (deep-link redirects, VIPUtil.showLandingWithRedirect animatePush=false). */
registerTransition('noonone-instant', {
  initial: {},
  animate: {},
  exit: { opacity: 0 },
  transition: { duration: 0 },
});
