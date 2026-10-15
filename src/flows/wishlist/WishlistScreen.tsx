import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { Screen } from '../../components';
import { useDemoStore } from '../../kit/DemoStore';
import type { ScreenProps } from '../../kit/types';
import { productById } from '../../data';
import { duration, easing } from '../../motion/presets';
import { CollectionTile } from './components/CollectionTile';
import { EmptyState, EmptyWishlist } from './components/EmptyState';
import { NoCollectionWidget } from './components/NoCollectionWidget';
import { ViewCartPill } from './components/ViewCartPill';
import { WishlistHeader } from './components/WishlistHeader';
import { WishlistProductBox } from './components/WishlistProductBox';
import { collections as demoCollections, copy } from './data';
import { wishlistTokens } from './tokens';
import styles from './wishlist.module.css';

/**
 * NoonWishlistV2Screen: header (title swap on scroll) · collections row (or the no-collection widget) · "All Saved Items"
 * 2-column grid of wishlist product boxes · floating View Cart pill. `collections: 'none'` shows the widget.
 */
export function WishlistScreen({ params }: ScreenProps<{ collections?: 'none' }>) {
  const { wishlist, cart } = useDemoStore();
  const listHeaderRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  // useState(false) on the screen: dismissing hides the widget until the screen is left
  const [noCollectionDismissed, setNoCollectionDismissed] = useState(false);
  const collections = params.collections === 'none' ? [] : demoCollections;

  const items = wishlist.map(productById);

  const onScroll = (y: number) => {
    const h = headingRef.current;
    const header = listHeaderRef.current;
    if (!h || !header) return;
    // onAllSavedItemsTitleLayout: y + height inside the list header (its marginTop 16 is not counted)
    const bottom = h.getBoundingClientRect().bottom - header.getBoundingClientRect().top;
    const o = wishlistTokens.titleSwitchOffset;
    setProgress(Math.min(1, Math.max(0, (y - (bottom - o)) / (2 * o))));
  };

  if (!items.length && !collections.length) {
    return (
      <div className={styles.stage}>
        <EmptyWishlist />
        <ViewCartPill />
      </div>
    );
  }

  return (
    // wrapper so the floating pill is positioned against the viewport, not the scroll content
    <div className={styles.stage}>
      <Screen header={<WishlistHeader progress={progress} />} background="bgSurface" onScroll={onScroll} contentStyle={{ paddingBottom: 'var(--nk-inset-bottom)' }}>
        <div ref={listHeaderRef} className={styles.listHeader}>
          {collections.length ? (
            <div className={`nk-hscroll ${styles.collections}`}>
              {collections.map((c) => (
                <CollectionTile key={c.id} name={c.name} items={c.items} />
              ))}
            </div>
          ) : (
            !noCollectionDismissed && <NoCollectionWidget onDismiss={() => setNoCollectionDismissed(true)} />
          )}
          <div ref={headingRef}>
            <h3 className={styles.sectionTitle}>{copy.allSavedItems}</h3>
          </div>
        </div>
        <div className={styles.grid} data-pill={cart.length ? '' : undefined}>
          <AnimatePresence initial={false}>
            {items.map((p) => (
              <motion.div key={p.id} layout className={styles.cell} exit={{ opacity: 0, transition: { duration: duration.base, ease: easing.inOut } }}>
                <WishlistProductBox product={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {/* ListEmptyComponent: collections but no saved items */}
        {!items.length && <EmptyState />}
      </Screen>
      <ViewCartPill />
    </div>
  );
}
