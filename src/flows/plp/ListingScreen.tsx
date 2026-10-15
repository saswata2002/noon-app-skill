import { motion } from 'motion/react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ProductBoxVertical, Screen, SearchInput, TabBar, Text } from '../../components';
import { useIsTop, useNav, useParams } from '../../kit/Navigator';
import { handoff } from '../../motion/presets';
import { SkeletonReveal } from '../../motion/recipes';
import { applyFilters, applySort, countFilters, searchProducts, sortOptions, type Filters } from './data';
import { MarketplaceStrip, type MarketplaceId } from './components/MarketplaceStrip';
import { CatalogListHeader } from './components/CatalogListHeader';
import { SkeletonCard } from './components/SkeletonCard';
import { usePlpScrollStates } from './scrollStates';
import { plpStore, usePlpStore } from './store';
import { plpTokens } from './tokens';
import styles from './plp.module.css';

const T = plpTokens.timeline;
const keyOf = (query: string, f: Filters) => `${query}|${JSON.stringify(f)}`;

/**
 * PLP (src/screens/ListingScreen → NoonCatalogList) on the Brand Widget PLP handoff (920:18788). It opens
 * "in place" from search (`results-fade`): the search bar sits where the search screen's does, so only
 * the page under it fades in. t = 0 is the page appearing:
 *   +224ms  bottom nav rises 88px on the handoff spring
 *   +480ms  chips drop 20px into place over their skeletons, 60ms apart
 *   +680ms  cards rise 16px out of their skeletons, 60ms apart; each skeleton fades 353ms after its card
 * Filter changes dissolve the cards back into skeletons and re-rise them (820ms); Sort reorders
 * with a layout animation. Header: search bar (tap = back to editing) · marketplace strip · pills.
 */
/** `results-fade` shows this layer at once; everything under the search bar fades in here instead (S-curve 300ms),
 *  so the bar — at the same spot as the search page's — stays put and never cross-fades with it. */
const belowBar = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: handoff.fade.reveal, ease: handoff.easeInOut } } as const;

// the grid re-renders when the screen is covered / uncovered (push, back); a card only when its product changes
const ProductBox = memo(ProductBoxVertical);

export function ListingScreen() {
  const nav = useNav();
  const { query = 'Best sellers' } = useParams<{ query?: string }>();
  const store = usePlpStore();
  // the store still holds the previous listing's sort / filters until the reset below: render as reset
  const ready = useRef(false);
  const { sort, filters } = ready.current ? store : { sort: 'recommended' as const, filters: {} as Filters };
  const scroller = useRef<HTMLDivElement>(null);
  // bappzaar scroll states (MAPPING.md → "PLP scroll states"): tab bar slides off on scroll down, the strip + pills slide up
  const isTop = useIsTop();
  const scroll = usePlpScrollStates(scroller, isTop);
  const [searching, setSearching] = useState(true);
  // fetch the Filters / Sort sheets now: a lazy sheet opened cold rises empty, then its content pops in mid-spring
  // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  useEffect(() => nav.preload('plp/filters', 'plp/sort'), []);

  useEffect(() => {
    plpStore.reset();
    plpStore.set({ query });
    ready.current = true;
    setSearching(true);
    const a = setTimeout(() => setSearching(false), T.cardsAt * 1000);
    return () => clearTimeout(a);
  }, [query]);

  const list = useMemo(() => applySort(applyFilters(searchProducts(query), filters), sort), [query, filters, sort]);

  // what the grid shows: a sort change reorders in place, a filter change swaps through the skeletons
  const [shown, setShown] = useState({ list, key: keyOf(query, filters), epoch: 0 });
  const [reloading, setReloading] = useState(false);
  const latest = useRef(list);
  latest.current = list;
  useEffect(() => {
    const key = keyOf(query, filters);
    if (key === shown.key) {
      setShown((s) => ({ ...s, list }));
      return;
    }
    setReloading(true);
    const t = setTimeout(() => {
      setShown((s) => ({ list: latest.current, key, epoch: s.epoch + 1 }));
      setReloading(false);
    }, plpTokens.swap.revealAt * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  // the grid mounts only the on-screen cards; the rest join below the fold in idle-time batches once those have landed
  // (per epoch, so a filter swap starts small again)
  const [grow, setGrow] = useState<{ epoch: number; n: number }>({ epoch: 0, n: T.animateFirst });
  const limit = grow.epoch === shown.epoch ? grow.n : T.animateFirst;
  useEffect(() => {
    if (limit >= shown.list.length) return;
    const start = limit === T.animateFirst ? ((shown.epoch === 0 ? T.cardsAt : 0) + T.animateFirst * handoff.stagger.in + T.settle) * 1000 : 0;
    const epoch = shown.epoch;
    let idle = 0;
    const t = setTimeout(() => {
      const next = () => setGrow({ epoch, n: limit + T.renderBatch });
      idle = window.requestIdleCallback ? window.requestIdleCallback(next, { timeout: 500 }) : window.setTimeout(next, 16);
    }, start);
    return () => {
      clearTimeout(t);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
    };
  }, [limit, shown.epoch, shown.list.length]);

  // filter / sort apply: the list restarts at the top, the bar shows, the header snaps back (onContentResetToTop + dataChange)
  const resetKey = `${keyOf(query, filters)}|${sort}`;
  const lastReset = useRef(resetKey);
  useEffect(() => {
    if (lastReset.current === resetKey) return;
    lastReset.current = resetKey;
    scroll.resetToTop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const nFilters = countFilters(filters);
  // getCustomNavPills: `${sort_by} : ${name.replace(':', '')}`
  const sortLabel = sort === 'recommended' ? 'Sort' : `Sort by : ${sortOptions.find((s) => s.id === sort)!.label.replace(':', '')}`;
  const express = !!filters.delivery?.includes('express');
  const setExpress = (on: boolean) => plpStore.set({ filters: { ...filters, delivery: on ? ['express'] : [] } });

  // tapping the bar goes back to editing: pop to the search page it came from, or open one on this query
  const editQuery = () => {
    const at = nav.stack.map((e) => e.route).lastIndexOf(nav.route);
    if (nav.stack[at - 1]?.route.startsWith('search/')) nav.back();
    else nav.push('search/search', { q: query });
  };
  const onMarketplace = (id: MarketplaceId) => {
    if (id === 'noon' || id === 'express') setExpress(id === 'express');
    else nav.toast(`${plpTokens.marketplaces[id].a} — not in this demo`);
  };

  const header = (
    <div className={styles.header}>
      <div className={styles.barBlock}>
        <div className={styles.barRow}>
          <SearchInput value={query} onChange={() => undefined} onBack={nav.back} onFieldPress={editQuery} />
        </div>
      </div>
      {/* HidableView: hangs under the search bar over the list, clipped as it slides up */}
      <div className={styles.hidable}>
        <motion.div ref={scroll.headerRef} className={styles.hidableInner} style={{ '--plp-header-hide': scroll.headerHide } as never} {...belowBar}>
        <MarketplaceStrip active={express ? 'express' : 'noon'} onSelect={onMarketplace} />
        <CatalogListHeader
          sortLabel={sortLabel}
          sorted={sort !== 'recommended'}
          nFilters={nFilters}
          filters={filters}
          results={searchProducts(query)}
          onFilter={() => nav.sheet('plp/filters')}
          onSort={() => nav.sheet('plp/sort')}
          onFacet={(facet) => nav.sheet('plp/filters', { facet })}
          onQuick={(facet, id) => {
            const cur = filters[facet] ?? [];
            plpStore.set({ filters: { ...filters, [facet]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] } });
          }}
        />
        </motion.div>
      </div>
    </div>
  );

  const footer = (
    <motion.div className={styles.navDock} initial={{ y: T.navRise }} animate={{ y: 0 }} transition={{ ...handoff.spring, delay: T.navAt }}>
      <motion.div className={styles.navHide} style={{ '--plp-tab-hide': scroll.tabHide } as never}>
        <TabBar active="home" />
      </motion.div>
    </motion.div>
  );

  const first = shown.epoch === 0;
  return (
    <Screen ref={scroller} header={header} footer={footer} background="bgSurface" onScroll={scroll.onScroll}>
      <div style={{ height: scroll.headerHeight }} aria-hidden />
      <motion.div {...belowBar}>
        <div className={styles.meta}>
          <Text variant="caption" color="textSecondary">
            {searching ? 'Searching…' : `${list.length} results for`} <b style={{ color: 'var(--nk-color-text-primary)' }}>“{query}”</b>
          </Text>
        </div>
        <>
          <div className={styles.grid}>
            {shown.list.slice(0, limit).map((p, i) => {
              const rises = i < T.animateFirst;
              return (
                <motion.div key={`${shown.epoch}-${p.id}`} className={styles.cell} layout="position" transition={{ layout: handoff.spring }}>
                  <SkeletonReveal
                    skeleton={<SkeletonCard />}
                    animateIn={rises}
                    loading={reloading && rises}
                    delay={(first ? T.cardsAt : 0) + i * handoff.stagger.in}
                    rise={T.cardRise}
                    skeletonAfter={T.skeletonOutAfter}
                  >
                    <ProductBox product={p} />
                  </SkeletonReveal>
                </motion.div>
              );
            })}
          </div>
          {!reloading && shown.list.length === 0 && (
            <div className={styles.empty}>
              <span style={{ fontSize: 48 }}>🔍</span>
              <Text variant="section">No results match your filters</Text>
              <Pressable onClick={() => plpStore.set({ filters: {} })} style={{ color: 'var(--nk-color-brand-blue)', font: 'var(--nk-type-body-semibold)' }}>
                Clear all filters
              </Pressable>
            </div>
          )}
        </>
        <div className={styles.tabSpace} />
      </motion.div>
    </Screen>
  );
}
