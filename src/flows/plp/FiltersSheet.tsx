import { AnimatePresence, motion } from 'motion/react';
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MarketplaceTag, OriginIcon, Pill, Pressable } from '../../components';
import { useNav, useParams } from '../../kit/Navigator';
import { useReduceMotion } from '../../motion/recipes';
import { duration, easing, handoff } from '../../motion/presets';
import globalLogo from '@assets/marketplace/global-content.svg';
import { applyFilters, countFilters, facets, priceBounds, priceRange, searchProducts, sortOptions, type Facet, type FacetId, type FacetOption, type Filters, type SortId } from './data';
import { plpStore } from './store';
import styles from './filters.module.css';

type GroupId = 'sort' | FacetId;

/** the search API returns facets for the query: options with at least one result (fulfilment cards always show) */
function facetsFor(query?: string): Facet[] {
  const base = searchProducts(query);
  return facets
    .map((f) => (f.kind === 'pills' || f.kind === 'cards' ? { ...f, options: f.options.filter((o) => base.some(o.test)) } : f))
    .filter((f) => f.kind === 'range' || f.options.length);
}

const SPY_LOCK_MS = 1200;

/** Utils.getSplitCategoryName: names over 10 characters with 2+ words break after the first word */
const splitName = (s: string) => {
  const words = s.split(' ');
  return s.length > 10 && words.length > 1 ? (
    <>
      {words[0]}
      <br />
      {words.slice(1).join(' ')}
    </>
  ) : (
    s
  );
};

/** NoonFiltersV2ApplyButtonText: the API's nbHitsText ("Show 4K+ results"); counts ≥ 1000 read as "4K+" */
const showText = (n: number) => (n >= 1000 ? `Show ${Math.floor(n / 1000)}K+ results` : `Show ${n} ${n === 1 ? 'result' : 'results'}`);

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** NoonFilterHighlightedText: the matched part at weight 700 */
function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? norm(text).indexOf(norm(q)) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <b>{text.slice(i, i + q.length)}</b>
      {text.slice(i + q.length)}
    </>
  );
}

/**
 * NoonFiltersScreenV2 + NoonFiltersV2 (bappzaar master), 1:1 with the live app (reference 2026-10-14, "phone" search):
 * floating sheet (OverlayBottomSheet isFloating), title, "Search across filters", a 25% sidebar (Sort By first) and ONE
 * scrolling list of every group — sticky grey headers, fulfilment cards, pills, rating cards, a price range. Tapping a
 * sidebar item scrolls to its group and flashes it; scrolling moves the active item (scroll-spy). Edits a draft; only
 * "Show N results" commits sort + filters to the PLP. Mapping: MAPPING.md → "Filters sheet".
 */
export function FiltersSheet() {
  const nav = useNav();
  const reduce = useReduceMotion();
  const { facet } = useParams<{ facet?: FacetId }>();
  const [draft, setDraft] = useState<Filters>(() => structuredClone(plpStore.get().filters));
  const [sort, setSort] = useState<SortId>(() => plpStore.get().sort);
  const [active, setActive] = useState<GroupId>(facet ?? 'delivery');
  const [flash, setFlash] = useState<{ id: GroupId; n: number } | null>(null);
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [spacer, setSpacer] = useState(100);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  const listRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);
  const sections = useRef<Partial<Record<GroupId, HTMLDivElement | null>>>({});
  const spyLock = useRef(0);
  const [visible] = useState(() => facetsFor(plpStore.get().query));
  // the range facet's min / max come with the query's results
  const [bounds] = useState(() => {
    const prices = searchProducts(plpStore.get().query).map((p) => p.price);
    return prices.length ? { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) } : priceBounds;
  });
  const groups: { id: GroupId; label: string }[] = useMemo(() => [{ id: 'sort', label: 'Sort By' }, ...visible.map((f) => ({ id: f.id, label: f.label }))], [visible]);

  // search input is debounced 150ms
  useEffect(() => {
    const t = window.setTimeout(() => setQ(input.trim()), 150);
    return () => clearTimeout(t);
  }, [input]);

  const results = useMemo(() => applyFilters(searchProducts(plpStore.get().query), draft), [draft]);
  const has = (id: GroupId) => (id === 'sort' ? sort !== 'recommended' : !!draft[id]?.length);

  const toggle = (f: FacetId, id: string) =>
    setDraft((d) => {
      const cur = d[f] ?? [];
      return { ...d, [f]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    });

  // gorhom snapPoints 85% of the space above the 36pt bottomInset, measured on the sheet layer (the real screen height)
  useLayoutEffect(() => {
    const layer = sheetRef.current?.closest('[data-sheet]')?.parentElement;
    if (layer) setHeight(Math.round((layer.clientHeight - 36) * 0.85));
  }, []);

  // opens on the given facet (the PLP's Deals / Brand / Price pills) or page index 1, without animation
  useLayoutEffect(() => {
    const list = listRef.current;
    const el = sections.current[facet ?? 'delivery'];
    if (list && el) list.scrollTop = el.offsetTop;
    const last = sections.current[groups[groups.length - 1].id];
    if (list && last) setSpacer(Math.max(100, list.clientHeight - last.offsetHeight));
  }, [facet, groups, height]);

  // keep the active sidebar row centred (scrollToIndex viewPosition 0.5). Scrolls the sidebar only: scrollIntoView also
  // scrolls every ancestor, and while the sheet is still rising that dragged the navigator root (and the PLP) up.
  useEffect(() => {
    const side = sideRef.current;
    const row = side?.querySelector<HTMLElement>('[data-active]');
    if (!side || !row) return;
    const top = row.getBoundingClientRect().top - side.getBoundingClientRect().top + side.scrollTop - (side.clientHeight - row.offsetHeight) / 2;
    side.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }, [active, reduce]);

  const jump = (id: GroupId) => {
    const list = listRef.current;
    const el = sections.current[id];
    if (!list || !el) return;
    spyLock.current = Date.now() + SPY_LOCK_MS;
    setActive(id);
    list.scrollTo({ top: el.offsetTop, behavior: reduce ? 'auto' : 'smooth' });
    setFlash((f) => ({ id, n: (f?.n ?? 0) + 1 }));
  };

  // scroll-spy: the first group still in view is active
  const onScroll = () => {
    const list = listRef.current;
    if (!list || Date.now() < spyLock.current || q) return;
    const top = list.scrollTop + 1;
    const first = groups.find((g) => {
      const el = sections.current[g.id];
      return el && el.offsetTop + el.offsetHeight > top;
    });
    if (first && first.id !== active) setActive(first.id);
  };

  // search across filters: a matching group name shows the whole group, otherwise only the matching options
  const matches = useMemo(() => {
    if (!q) return null;
    const n = norm(q);
    const out: { facet: Facet; options: FacetOption[] }[] = [];
    for (const f of visible) {
      if (f.kind === 'range') continue;
      if (norm(f.label).includes(n)) out.push({ facet: f, options: f.options });
      else {
        const opts = f.options.filter((o) => norm(o.label).includes(n));
        if (opts.length) out.push({ facet: f, options: opts });
      }
    }
    return out;
  }, [q, visible]);
  const matchCount = matches?.reduce((a, m) => a + m.options.length, 0) ?? 0;

  const exitSearch = () => {
    setInput('');
    setQ('');
    setSearching(false);
  };

  const apply = () => {
    plpStore.set({ filters: draft, sort });
    nav.back();
  };

  const searchActive = searching || !!input;

  return (
    <div ref={sheetRef} className={styles.sheet} style={height ? { height } : undefined}>
      <div className={styles.header}>
        <h2 className={styles.title}>Filters</h2>
      </div>
      <div className={styles.searchWrap} data-active={searchActive || undefined}>
        <label className={styles.search} data-active={searchActive || undefined}>
          {searchActive ? (
            <Pressable onClick={exitSearch} aria-label="Exit search" className={styles.searchIcon}>
              <OriginIcon name="arrow-left" size={19} color="var(--nk-color-text-secondary)" />
            </Pressable>
          ) : (
            <span className={styles.searchIcon}>
              <OriginIcon name="search" size={15} color="var(--nk-color-text-tertiary)" />
            </span>
          )}
          <input value={input} onChange={(e) => setInput(e.target.value)} onFocus={() => setSearching(true)} placeholder="Search across filters" aria-label="Search across filters" />
          {!!input && (
            <Pressable onClick={() => setInput('')} aria-label="Clear search" className={styles.searchIcon}>
              <OriginIcon name="cross-circle-filled" size={14} color="var(--nk-color-text-tertiary)" />
            </Pressable>
          )}
        </label>
      </div>

      <div className={styles.body}>
        <motion.nav
          ref={sideRef}
          className={`nk-scroll ${styles.sidebar}`}
          initial={false}
          animate={{ x: searchActive ? '-100%' : 0 }}
          transition={handoff.spring}
        >
          {groups.map((g) => (
            <Pressable key={g.id} scale={1} className={styles.side} data-active={g.id === active || undefined} onClick={() => jump(g.id)}>
              <span className={styles.sideLabel}>{splitName(g.label)}</span>
              {has(g.id) && <span className={styles.dot} aria-label="selected" />}
            </Pressable>
          ))}
        </motion.nav>

        <motion.div className={styles.content} initial={false} animate={{ marginInlineStart: searchActive ? '0%' : '25%' }} transition={handoff.spring}>
          {/* browse: every group in one list */}
          <div ref={listRef} className={`nk-scroll ${styles.list}`} onScroll={onScroll} hidden={!!matches}>
            {groups.map((g) => (
              <div key={g.id} ref={(el) => void (sections.current[g.id] = el)} className={styles.group}>
                {g.id === 'sort' ? (
                  <SortSection sort={sort} onSort={setSort} flash={flash?.id === 'sort' ? flash.n : 0} />
                ) : (
                  <FacetSection facet={visible.find((f) => f.id === g.id)!} draft={draft} onToggle={toggle} bounds={bounds} onRange={(v) => setDraft((d) => ({ ...d, price: v ? [v] : [] }))} flash={flash?.id === g.id ? flash.n : 0} />
                )}
              </div>
            ))}
            <div style={{ height: spacer }} aria-hidden />
          </div>

          {/* search across filters */}
          {matches && (
            <div className={`nk-scroll ${styles.list}`}>
              {matches.length ? (
                <>
                  <p className={styles.matchCount}>
                    {matchCount} {matchCount === 1 ? 'filter matches' : 'filters match'} “{q}”
                  </p>
                  {matches.map((m) => (
                    <div key={m.facet.id} className={styles.group}>
                      <GroupCard title={<Highlight text={m.facet.label} q={q} />}>
                        <Options facet={m.facet} options={m.options} draft={draft} onToggle={toggle} q={q} />
                      </GroupCard>
                    </div>
                  ))}
                </>
              ) : (
                <div className={styles.empty}>
                  <OriginIcon name="search" size={48} color="var(--nk-color-text-tertiary)" />
                  <p className={styles.emptyTitle}>We couldn’t find “{q}”</p>
                  <p className={styles.emptyText}>Try a different keyword or check your spelling.</p>
                </div>
              )}
              <AnimatePresence>
                {countFilters(draft) > 0 && (
                  <motion.div className={styles.clearSelectionRow} exit={{ opacity: 0, height: 0 }} transition={{ ...handoff.spring, opacity: { duration: duration.slow, ease: easing.out } }}>
                    <Pressable className={styles.clearSelection} onClick={() => setDraft({})}>
                      Clear selection
                    </Pressable>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      <div className={styles.footer}>
        {!searchActive && (
          <Pressable scale={1} className={styles.clear} onClick={() => (setDraft({}), setSort('recommended'))}>
            Clear All
          </Pressable>
        )}
        <Pressable scale={1} className={styles.show} data-full={searchActive || undefined} onClick={apply} disabled={!results.length}>
          {results.length ? showText(results.length) : 'No results available'}
        </Pressable>
      </div>
    </div>
  );
}

/** FilterHeader (sticky, top radii 16) + FilterContainer body (bottom radii 16); `flash` replays the jump highlight */
function GroupCard({ title, children, flash = 0 }: { title: ReactNode; children: ReactNode; flash?: number }) {
  const reduce = useReduceMotion();
  const bg = flash && !reduce ? { backgroundColor: ['var(--nk-palette-filter-container-background)', 'var(--nk-color-bg-info)', 'var(--nk-color-bg-info)', 'var(--nk-palette-filter-container-background)'] } : undefined;
  const t = { duration: 1.9, times: [0, 0.2 / 1.9, 0.7 / 1.9, 1], delay: 0.45, ease: easing.inOut };
  return (
    <>
      <div className={styles.groupHeaderWrap}>
        <motion.div key={`h${flash}`} className={styles.groupHeader} animate={bg} transition={t}>
          {title}
        </motion.div>
      </div>
      <motion.div key={`b${flash}`} className={styles.groupBody} animate={bg} transition={t}>
        {children}
      </motion.div>
    </>
  );
}

function FacetSection({ facet, draft, bounds, onToggle, onRange, flash }: { facet: Facet; draft: Filters; bounds: { min: number; max: number }; onToggle: (f: FacetId, id: string) => void; onRange: (v: string | null) => void; flash: number }) {
  return (
    <GroupCard title={facet.label} flash={flash}>
      {facet.kind === 'range' ? <PriceRange value={draft.price?.[0]} bounds={bounds} onChange={onRange} /> : <Options facet={facet} options={facet.options} draft={draft} onToggle={onToggle} />}
    </GroupCard>
  );
}

function Options({ facet, options, draft, onToggle, q = '' }: { facet: Facet; options: FacetOption[]; draft: Filters; onToggle: (f: FacetId, id: string) => void; q?: string }) {
  const on = (o: FacetOption) => !!draft[facet.id]?.includes(o.id);
  if (facet.kind === 'fulfillment')
    return (
      <div className={styles.fulfilList}>
        {options.map((o) => (
          <Pressable key={o.id} scale={1} className={styles.fulfil} data-selected={on(o) || undefined} onClick={() => onToggle(facet.id, o.id)}>
            <span className={styles.fulfilLogo} data-logo={o.logo}>
              <FulfilLogo logo={o.logo} />
            </span>
            <span className={styles.fulfilLabel}>
              <Highlight text={o.label} q={q} />
            </span>
          </Pressable>
        ))}
      </div>
    );
  if (facet.kind === 'cards')
    return (
      <div className={styles.cards}>
        {options.map((o) => (
          <Pressable key={o.id} scale={1} className={styles.card} data-selected={on(o) || undefined} onClick={() => onToggle(facet.id, o.id)}>
            <OriginIcon name="star-filled" size={20} color="var(--nk-color-star-great)" />
            <span>
              <Highlight text={o.label} q={q} />
            </span>
          </Pressable>
        ))}
      </div>
    );
  return (
    <div className={styles.pills}>
      {options.map((o) => (
        <Pill key={o.id} variant="filter" selected={on(o)} onPress={() => onToggle(facet.id, o.id)}>
          <Highlight text={o.label} q={q} />
        </Pill>
      ))}
    </div>
  );
}

/** FilterFulfillmentCard logo (70 × 20 image on the API's background colour) */
function FulfilLogo({ logo }: { logo?: FacetOption['logo'] }) {
  if (logo === 'global') return <img src={globalLogo} alt="Global" className={styles.globalLogo} />;
  if (logo === 'supermall' || logo === 'express') return <MarketplaceTag kind={logo} height={22} />;
  return null;
}

/** FilterSortSection: own grey card, "Sort by" header (selected label + chevron when collapsed), option pills */
function SortSection({ sort, onSort, flash }: { sort: SortId; onSort: (s: SortId) => void; flash: number }) {
  const [open, setOpen] = useState(true);
  const reduce = useReduceMotion();
  const label = sortOptions.find((o) => o.id === sort)!.label;
  return (
    <motion.div
      key={flash}
      className={styles.sortCard}
      animate={flash && !reduce ? { backgroundColor: ['var(--nk-palette-filter-container-background)', 'var(--nk-color-bg-info)', 'var(--nk-color-bg-info)', 'var(--nk-palette-filter-container-background)'] } : undefined}
      transition={{ duration: 1.9, times: [0, 0.2 / 1.9, 0.7 / 1.9, 1], delay: 0.45 }}
    >
      <Pressable scale={1} className={styles.sortHeader} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className={styles.sortTitle}>Sort by</span>
        {!open && <span className={styles.sortValue}>{label}</span>}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={handoff.spring} style={{ display: 'flex' }}>
          <OriginIcon name="chevron-down" size={16} color="var(--nk-color-text-body)" />
        </motion.span>
      </Pressable>
      {open && (
        <div className={styles.sortPills}>
          {sortOptions.map((o) => (
            <Pill key={o.id} variant="filter" selected={o.id === sort} onPress={() => onSort(o.id)}>
              {o.label}
            </Pill>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/** FilterRangeSlider + NoonDualThumbSlider: rail 4 (selected rail accent), 24px thumbs with a 3px blue ring, Min / Max inputs */
function PriceRange({ value, bounds, onChange }: { value?: string; bounds: { min: number; max: number }; onChange: (v: string | null) => void }) {
  const { min: lo, max: hi } = bounds;
  const r = priceRange(value) ?? { min: lo, max: hi };
  const set = (min: number, max: number) => onChange(min <= lo && max >= hi ? null : `${Math.max(lo, Math.min(min, max))}-${Math.min(hi, Math.max(min, max))}`);
  const pct = (n: number) => ((n - lo) / (hi - lo)) * 100;
  return (
    <div className={styles.range}>
      <div className={styles.slider}>
        <div className={styles.rail} />
        <div className={styles.railFill} style={{ insetInlineStart: `${pct(r.min)}%`, insetInlineEnd: `${100 - pct(r.max)}%` }} />
        <input type="range" aria-label="Minimum price" min={lo} max={hi} value={r.min} onChange={(e) => set(Math.min(Number(e.target.value), r.max), r.max)} />
        <input type="range" aria-label="Maximum price" min={lo} max={hi} value={r.max} onChange={(e) => set(r.min, Math.max(Number(e.target.value), r.min))} />
      </div>
      <div className={styles.rangeInputs}>
        {(
          [
            ['Min', r.min, (n: number) => set(n, r.max)],
            ['Max', r.max, (n: number) => set(r.min, n)],
          ] as const
        ).map(([l, v, fn]) => (
          <Fragment key={l}>
            <label className={styles.rangeField}>
              <span>{l}</span>
              <input inputMode="numeric" value={v} onChange={(e) => fn(Number(e.target.value.replace(/\D/g, '')) || 0)} />
            </label>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
