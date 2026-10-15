import type { CSSProperties } from 'react';
import { radius as r, ref } from '../../foundations/tokens';
import { useReduceMotion } from '../../motion/reducedMotion';
import styles from './Skeleton.module.css';

const base = ref.palette('shimmerGray');

/**
 * Shimmer block (NewLoadingState / ShimmerBackground). Reduced motion: a still block in the base grey, no sweep.
 * `look="band"`: the Brand Widget PLP skeleton (#F6F5FA, one 195px band at 17° every 1.867s), used by the search page.
 */
export function Skeleton({ width = '100%', height = 14, radius = r.r6, style, look = 'default' }: { width?: number | string; height?: number | string; radius?: number | string; style?: CSSProperties; look?: 'default' | 'band' }) {
  const reduce = useReduceMotion();
  if (look === 'band') return <span className={styles.band} style={{ width, height, borderRadius: radius, ...style }} />;
  if (reduce) return <span style={{ display: 'block', width, height, borderRadius: radius, background: base, ...style }} />;
  return (
    <span
      style={{
        display: 'block',
        width,
        height,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${base} 0px, ${ref.palette('skeletonGray')} 60px, ${base} 120px) ${base}`,
        backgroundSize: '400px 100%',
        animation: 'nk-shimmer 1.2s linear infinite',
        ...style,
      }}
    />
  );
}
