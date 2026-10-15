import { registerTransition } from '../../motion/transitions';
import { duration, easing, handoff } from '../../motion/presets';

/**
 * noon One overlays are `navigator.showOverlay` screens on master: the screen below stays visible and the overlay
 * draws its own backdrop + sheet (OverlayBottomSheet). In the kit they are `presentation: 'modal'` screens with this
 * transition: the stack layer itself is transparent and static, and <VipOverlay> animates the backdrop (350ms
 * inOut ease) and the sheet (spring mass 1 / stiffness 110 / damping 15) inside it.
 * Registered from this flow so it stays self-contained.
 */
const layer = { backgroundColor: 'transparent', boxShadow: 'none' };

registerTransition('mb-overlay', {
  initial: { ...layer, opacity: 1 },
  animate: { ...layer, opacity: 1 },
  // <VipOverlay> has already animated out when it calls nav.back(); this only covers a direct back()
  exit: { ...layer, opacity: 0 },
  transition: { duration: duration.base, ease: easing.standard }, // Test01 S-curve fade
});

/** VIPManageMembership is `showModal` (fullScreen) on master — iOS modal slide up, nothing underneath moves. */
registerTransition('mb-modal', {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: handoff.spring, // Test01 movement spring
});

/** Spread into an overlay ScreenDef: `{ id, title, component, ...overlayScreen }` (master: navigator.showOverlay). */
export const overlayScreen = { presentation: 'modal', transition: 'mb-overlay' } as const;
