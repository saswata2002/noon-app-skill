import { motion } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { LikeHeart, OriginIcon, Pressable } from '../../../../components';
import { useDemoStore } from '../../../../kit/DemoStore';
import { useNav } from '../../../../kit/Navigator';
import type { Product } from '../../../../data';
import { copy } from '../../data';
import { pdpTokens } from '../../tokens';
import { pdpSfAFlowTokens } from '../../tokens.sfA';

/** the round icon button the search folds into (Figma Icon Button 40) */
const collapsedW = Number((pdpSfAFlowTokens.layout as Record<string, number>).pdpSfaIconButton);
import styles from './SfHeader.module.css';

const ink = 'var(--nk-color-text-ink)';

/**
 * Storefront PDP header (Figma 2ldJbjmQq4RkhnrNFCfXQB · 3499:75879): white → transparent gradient (white to 40%),
 * header stack 56 (padding 8·12, gap 8) with four 40px round icon buttons (white 90%, 1px blue-gray/200):
 * back on the start side; search · wishlist · share on the end side. Replaces PdpHeader: same props, and the
 * background still fades to solid white (200ms, pdpTokens.headerEase) once the page scrolls past the gallery top.
 * Search keeps bappzaar's NoonExpandableSearch: when the header turns solid, the 40px search button springs open
 * (pdpTokens.searchSpring 400 / 30 / 1) to fill the space up to the wishlist button and shows "Search" (14/600
 * blue-gray/900); scrolling back up folds it into the round button again.
 */
export function SfHeader({ product, solid }: { product: Product; solid: boolean }) {
  const nav = useNav();
  return (
    <div className={styles.header} data-solid={solid || undefined}>
      <motion.span
        className={styles.solidBg}
        aria-hidden
        initial={false}
        animate={{ opacity: solid ? 1 : 0 }}
        transition={{ duration: pdpTokens.headerFadeMs / 1000, ease: pdpTokens.headerEase }}
      />
      <div className={styles.stack}>
        <Pressable className={styles.iconBtn} onClick={nav.back} aria-label="Back">
          <OriginIcon name="chevron-left" size={20} color={ink} />
        </Pressable>
        <div className={styles.end}>
          <ExpandableSearch expanded={solid} onPress={() => nav.push('search/search')} />
          <HeaderHeart productId={product.id} />
          <Pressable className={styles.iconBtn} aria-label="Share" onClick={() => nav.toast(copy.linkCopied, { icon: <OriginIcon name="copy" size={18} color="var(--nk-color-text-inverse)" /> })}>
            <OriginIcon name="upload" size={20} color={ink} />
          </Pressable>
        </div>
      </div>
    </div>
  );
}

/** NoonExpandableSearch in the Storefront skin: the round icon button ⇄ a full-width pill with the "Search" label. */
function ExpandableSearch({ expanded, onPress }: { expanded: boolean; onPress: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(0);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFull(el.clientWidth));
    ro.observe(el);
    setFull(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={wrapRef} className={styles.searchWrap}>
      <motion.button
        type="button"
        className={`nk-pressable ${styles.iconBtn} ${styles.search}`}
        onClick={onPress}
        aria-label={copy.search}
        initial={false}
        animate={{ width: expanded && full ? full : collapsedW }}
        transition={{ type: 'spring', ...pdpTokens.searchSpring }}
        whileTap={{ opacity: 0.8 }}
      >
        <OriginIcon name="search" size={20} color={ink} />
        <motion.span className={styles.searchText} initial={false} animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -4 }} transition={{ duration: expanded ? 0.2 : 0.1, delay: expanded ? 0.06 : 0 }}>
          {copy.search}
        </motion.span>
      </motion.button>
    </div>
  );
}

/** Wishlist button: plays the like Lottie (`LikeHeart`) on favourite, toggles useDemoStore().wishlist + toast. */
function HeaderHeart({ productId }: { productId: string }) {
  const { isWishlisted, toggleWishlist } = useDemoStore();
  const nav = useNav();
  const on = isWishlisted(productId);
  return (
    <Pressable
      className={styles.iconBtn}
      aria-label={on ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={on}
      onClick={() => {
        const added = toggleWishlist(productId);
        nav.toast(added ? copy.addedToWishlist : copy.removedFromWishlist);
      }}
    >
      <LikeHeart on={on} size={20} />
    </Pressable>
  );
}
