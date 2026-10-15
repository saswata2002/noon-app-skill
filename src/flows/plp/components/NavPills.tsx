import { motion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import { Skeleton } from '../../../components';
import { handoff } from '../../../motion/presets';
import { plpTokens } from '../tokens';

/**
 * PLP chip reveal (Brand Widget PLP handoff): each chip drops 20px into place over its own skeleton pill,
 * 480ms after the page appears + index × 60ms, on the handoff spring with the S-curve fade; the skeleton
 * fades out with it. `skeleton={false}` for separators.
 */
export function RevealChip({ index, children, skeleton = true }: { index: number; children: ReactNode; skeleton?: boolean }) {
  const { chipsAt, chipDrop } = plpTokens.timeline;
  const delay = chipsAt + index * handoff.stagger.in;
  const fade = { duration: handoff.fade.io, ease: handoff.easeInOut, delay };
  return (
    <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      {skeleton && (
        <motion.span aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={fade}>
          {/* the search page's shimmer (band: #F6F5FA, 195px band at 17°, 1.867s, first pass 120ms in) */}
          <Skeleton look="band" height="100%" radius="var(--nk-pill-nav-radius)" style={{ width: '100%', '--nk-skeleton-at': '0.12s' } as CSSProperties} />
        </motion.span>
      )}
      <motion.span style={{ display: 'inline-flex' }} initial={{ y: -chipDrop, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ y: { ...handoff.spring, delay }, opacity: fade }}>
        {children}
      </motion.span>
    </span>
  );
}
