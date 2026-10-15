import { useEffect, useRef, useState } from 'react';
import { Pressable } from '../../../components';
import { heroSlides } from '../data';
import { homeTokens } from '../tokens';
import styles from '../home.module.css';
import { useReduceMotion } from '../../../motion/reducedMotion';
import { useIsTop } from '../../../kit/Navigator';

const { heroCardWidth: W, heroCardHeight: H, heroGap: GAP, heroInterval } = homeTokens;

/**
 * Hero carousel as on the live noon home: portrait cards (244×366), centred with neighbours peeking,
 * snap scrolling, auto-advance every 4s (paused while the user is touching it, and while another screen covers it: it
 * restarts with a full interval on return, so it never slides during the transition back).
 */
export function HeroCarousel({ onPress }: { onPress?: (query: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [held, setHeld] = useState(false);
  const reduce = useReduceMotion();
  const isTop = useIsTop();

  useEffect(() => {
    // no auto-advance under reduced motion (still swipeable), nor while covered
    if (held || reduce || !isTop) return;
    const t = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / (W + GAP)) + 1) % heroSlides.length;
      el.scrollTo({ left: next * (W + GAP), behavior: 'smooth' });
    }, heroInterval);
    return () => clearInterval(t);
  }, [held, reduce, isTop]);

  return (
    <div className={styles.heroWrap}>
      <div
        ref={ref}
        className={`${styles.hero} nk-hscroll`}
        style={{ gap: GAP, paddingInline: `calc((100% - ${W}px) / 2)` }}
        onPointerDown={() => setHeld(true)}
        onPointerUp={() => setHeld(false)}
        onPointerLeave={() => setHeld(false)}
      >
        {heroSlides.map((s) => (
          <Pressable key={s.image} className={styles.heroCard} style={{ width: W, height: H }} onClick={() => onPress?.(s.query)} scale={0.98}>
            <img src={s.image} alt="" draggable={false} />
          </Pressable>
        ))}
      </div>
    </div>
  );
}
