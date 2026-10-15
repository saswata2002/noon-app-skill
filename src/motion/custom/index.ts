import { registerTransition } from '../transitions';
import { duration, easing, handoff, spring } from '../presets';

/**
 * Put your own screen transitions here. They're registered on import (see src/index.ts)
 * and usable from any flow:  nav.push('pdp/detail', params, { transition: 'card-flip' })
 * or as a screen default:    { id: 'detail', transition: 'scale-up', ... }
 */

registerTransition('card-flip', {
  initial: { rotateY: 90, opacity: 0, transformPerspective: 1200 },
  animate: { rotateY: 0, opacity: 1 },
  exit: { rotateY: -90, opacity: 0 },
  under: { opacity: 0.6 },
  transition: { duration: duration.slower, ease: easing.inOut }, // Test01: spring-settle length on its S-curve
});

registerTransition('scale-up', {
  initial: { scale: 0.85, opacity: 0, borderRadius: 40 },
  animate: { scale: 1, opacity: 1, borderRadius: 0 },
  exit: { scale: 0.85, opacity: 0, borderRadius: 40 },
  under: { scale: 0.96, filter: 'brightness(0.9)' },
  transition: spring.gentle,
});

registerTransition('slide-left', {
  // the noon search push: handoff spring 280.6 / 27.14, underlying screen drifts 200/382 of the width
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  under: { x: `${-(handoff.parallax * 100).toFixed(2)}%` },
  transition: handoff.spring,
});

registerTransition('search-morph', {
  // search bar → search page (src/kit/searchMorph.ts): the layer itself never moves or fades; the page flies its
  // bar from the tapped one, fades its own background and content in, drifts the page underneath, and plays it all
  // in reverse on back while it holds its removal (usePresence)
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 1 },
  transition: { duration: 0 },
  transparent: true,
});

registerTransition('results-fade', {
  // search → results "in place": the PLP layer appears at once (no layer fade, so the search bar — drawn at the
  // same spot on both screens — never cross-fades with the one under it); the PLP fades in everything below its
  // bar itself (S-curve 300ms, ListingScreen `belowBar`). Back fades the whole layer out.
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: handoff.fade.reveal, ease: handoff.easeInOut },
});
