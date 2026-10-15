import { Skeleton } from '../../../components';
import type { CSSProperties } from 'react';
import { ref } from '../../../foundations/tokens';

/**
 * NoonPLPSkeleton card: same footprint as ProductCard so the swap doesn't jump. Blocks use the search page's shimmer
 * (`Skeleton look="band"`: #F6F5FA, one 195px band at 17° every 1.867s, first pass 120ms in).
 */
export function SkeletonCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderRadius: 12, overflow: 'hidden', border: `0.5px solid ${ref.palette('lightGray')}`, paddingBottom: 10, '--nk-skeleton-at': '0.12s' } as CSSProperties}>
      <Skeleton look="band" height={undefined as unknown as number} radius={0} style={{ aspectRatio: '0.8', height: 'auto' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 8px' }}>
        <Skeleton look="band" height={12} />
        <Skeleton look="band" height={12} width="70%" />
        <Skeleton look="band" height={18} width={60} />
        <Skeleton look="band" height={16} width="50%" />
      </div>
    </div>
  );
}
