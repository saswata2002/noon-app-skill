import { animate, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { t } from '../data';
import { cartTokens } from '../tokens';
import addPlus from '@assets/cart/figma/add-plus-16.svg';
import addPlusSupermall from '@assets/cart/figma/add-plus-supermall.svg';
import { HtmlText } from '../../../components';
import html from './html.module.css';
import styles from './group.module.css';
import { useReduceMotion } from '../../../motion/reducedMotion';
import { handoff } from '../../../motion/presets';

const P = cartTokens.progress;

/**
 * NoonCartGroupProgressBar, Figma "Progress bars" (e.g. 7484:49906): message 13/16 500 #101628 + 4px bar
 * (gap 8; track r6 / fill r2, colours per group) and the 57×26 "+ Add" button.
 * Bar slides in (translateY 20→0 after 1000ms, height after 1200ms), width springs (Test01 spring; was damping 16, stiffness 100)
 * on every change, and a skewed shimmer sweeps 7× (1800ms, inOut quad) the first time the group is seen.
 * "+ Add" (white, 1px rgba(14,14,14,.07), r6) opens the CMS page.
 */
export function GroupProgressBar({ message, current, threshold, shouldHide, showButton, onAdd, animateIn, trackColor, fillColor, addVariant, addBorder, addInk }: { message: string; current: number; threshold: number; shouldHide?: boolean; showButton: boolean; onAdd: () => void; animateIn: boolean; trackColor?: string; fillColor?: string; /** supermall "+ Add" (All flows 127:39717): 14px Persian-Blue plus, 13px label, pl 4 pr 8 */ addVariant?: 'supermall'; addBorder?: string; addInk?: string }) {
  const pct = current <= 0 ? 0 : Math.min((current / threshold) * 100, 100);
  const width = useSpring(0, { damping: handoff.spring.damping, stiffness: handoff.spring.stiffness, mass: handoff.spring.mass });
  const widthPct = useTransform(width, (v) => `${v}%`);
  const barRef = useRef<HTMLDivElement>(null);
  const shimmer = useMotionValue(0);
  const [barW, setBarW] = useState(0);
  const played = useRef(false);

  useEffect(() => {
    width.set(pct);
  }, [pct, width]);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBarW(el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const reduce = useReduceMotion();
  useEffect(() => {
    // reduced motion: no shimmer sweep over the bar
    if (!animateIn || played.current || shouldHide || reduce) return;
    played.current = true;
    const c = animate(shimmer, [0, 1], { duration: P.shimmerMs / 1000, ease: [0.455, 0.03, 0.515, 0.955], repeat: P.shimmerRepeat - 1, delay: P.delayMs / 1000 });
    return () => c.stop();
  }, [animateIn, shouldHide, shimmer, reduce]);

  const stripe = Math.min(P.shimmerMax, Math.max(P.shimmerMin, barW * P.shimmerRatio));
  const x = useTransform(shimmer, [0, 1], [-stripe, barW + stripe]);

  return (
    <div className={styles.progressWrapper}>
      <div className={styles.progressContent}>
        <HtmlText base value={message} className={html.progress} />
        <motion.div
          className={styles.progressTrack}
          style={{ background: trackColor }}
          initial={{ height: 0, y: P.hiddenTranslateY, marginTop: 0 }}
          animate={shouldHide ? { height: 0, y: P.hiddenTranslateY, marginTop: 0 } : { height: P.barHeight, y: 0, marginTop: P.visibleMarginTop }}
          transition={{
            height: { ...handoff.spring, delay: (P.delayMs + P.delayOffsetMs) / 1000 },
            y: { ...handoff.spring, delay: P.delayMs / 1000 },
            marginTop: { ...handoff.spring, delay: P.delayMs / 1000 },
          }}
        >
          <motion.div ref={barRef} className={styles.progressFill} style={{ width: widthPct, background: fillColor }}>
            <motion.span className={styles.shimmer} style={{ width: stripe, x, skewX: -18 }} />
          </motion.div>
        </motion.div>
      </div>
      {showButton && (
        <motion.button type="button" className={styles.progressButton} data-variant={addVariant} style={{ borderColor: addBorder, color: addInk }} whileTap={{ scale: 0.95 }} onClick={onAdd}>
          <img src={addVariant === 'supermall' ? addPlusSupermall : addPlus} alt="" />
          <span>{t.add}</span>
        </motion.button>
      )}
    </div>
  );
}
