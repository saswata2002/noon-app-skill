import { DotLottieReact, type DotLottie } from '@lottiefiles/dotlottie-react';
import { useEffect, useRef } from 'react';
import { lotties } from '../Lottie/Lottie';
import { useReduceMotion } from '../../motion/reducedMotion';

/**
 * The like Lottie (Wishlist Revamp `Like_Lottie_2`, 90 × 90, 63 frames @ 60fps): grey outline heart → pink fill with
 * a ripple, resting on the filled heart. At rest the heart is ≈44% of the canvas, so the canvas is drawn at
 * `LOTTIE_SCALE` × the heart size and the ripple spills past the slot.
 */
const LOTTIE_SCALE = 1.95;

/**
 * Drop-in wishlist heart glyph: a `size` × `size` slot (the old heart icon's box) that plays the like Lottie when `on`
 * turns true, and rests on frame 0 (outline) / the last frame (filled) otherwise. Un-favouriting and reduced motion
 * jump straight to the resting frame. Used by every wishlist heart: `WishlistHeart`, `SkuCard`, the Storefront PDP
 * header and recommendation cards.
 */
export function LikeHeart({ on, size }: { on: boolean; size: number }) {
  const reduce = useReduceMotion();
  const player = useRef<DotLottie | null>(null);
  const prevOn = useRef(on);
  const box = Math.round(size * LOTTIE_SCALE);

  // rest frame for a state (no animation): outline = 0, filled = last
  const rest = (d: DotLottie, filled: boolean) => {
    d.stop();
    d.setFrame(filled ? Math.max(0, d.totalFrames - 1) : 0);
  };

  useEffect(() => {
    const d = player.current;
    const was = prevOn.current;
    prevOn.current = on;
    if (!d?.isLoaded || was === on) return;
    if (on && !reduce) {
      d.stop();
      d.play();
    } else rest(d, on);
  }, [on, reduce]);

  return (
    <span aria-hidden style={{ position: 'relative', display: 'block', flexShrink: 0, width: size, height: size, pointerEvents: 'none' }}>
      <span style={{ position: 'absolute', left: '50%', top: '50%', width: box, height: box, marginLeft: -box / 2, marginTop: -box / 2 }}>
        <DotLottieReact
          src={lotties.like}
          autoplay={false}
          loop={false}
          style={{ width: box, height: box }}
          dotLottieRefCallback={(d) => {
            player.current = d;
            if (!d) return;
            const settle = () => rest(d, prevOn.current);
            if (d.isLoaded) settle();
            else d.addEventListener('load', settle);
          }}
        />
      </span>
    </span>
  );
}
