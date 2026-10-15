import { motion, type Variants } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Pill, Screen, SEARCH_FILL_FADE, SearchInput, Text } from '../../components';
import { preloadRoutes } from '../../kit/lazyScreen';
import { useIsTop, useNav, useParams } from '../../kit/Navigator';
import { handoff } from '../../motion/presets';
import { BlurSwap } from '../../motion/recipes';
import { GroupReveal, type GroupIntro } from './components/GroupReveal';
import { RecentSearches } from './components/RecentSearches';
import { SuggestionRow } from './components/SuggestionRow';
import { recentSearches, suggest, trending, type Suggestion } from './data';
import { searchTokens as st } from './tokens';
import { ref } from '../../foundations/tokens';

type Phase = 'idle' | 'showing' | 'hiding' | 'leaving';
interface Rows {
  list: Suggestion[];
  /** per slot: entry delay for a row falling in / crossfade delay for a row whose suggestion changed */
  delay: number[];
  /** bumps when a slot appears again, so it shows its new content without a crossfade */
  epoch: number[];
}

const empty: Rows = { list: [], delay: [], epoch: Array(st.maxRows).fill(0) };
const listFor = (q: string): Suggestion[] => {
  const s = q.trim();
  if (!s) return [];
  const hit = suggest(s);
  return hit.length ? hit : [{ text: `Search for "${s}"`, category: undefined, product: undefined }];
};
const keyOf = (l: Suggestion[]) => l.map((s) => s.text).join('|');

/** One suggestion slot: in (falls 20px on the handoff spring), out (lifts 20px), gone (spare row), fast (exit into results). */
const slot: Variants = {
  in: (d: number) => ({ opacity: 1, y: 0, transition: { y: { ...handoff.spring, delay: d }, opacity: { duration: handoff.fade.out, ease: handoff.easeOut, delay: d } } }),
  out: (d: number) => ({
    opacity: 0,
    y: -handoff.travel,
    transition: { y: { ...handoff.spring, delay: d }, opacity: { duration: handoff.fade.io, ease: handoff.easeInOut, delay: d } },
    transitionEnd: { y: -handoff.travel },
  }),
  gone: (d: number) => ({ opacity: 0, y: -st.goneTravel, transition: { duration: st.goneFade, ease: handoff.easeInOut, delay: d }, transitionEnd: { y: -handoff.travel } }),
  fast: (d: number) => ({
    opacity: 0,
    y: -st.fastExit.travel,
    transition: { y: { duration: st.fastExit.move, ease: handoff.easeInOut, delay: d }, opacity: { duration: st.fastExit.fade, ease: handoff.easeInOut, delay: d } },
    transitionEnd: { y: -handoff.travel },
  }),
};

/** Presearch (recent + trending): rises 20px on push / when the field is cleared, sinks 20px on the first keystroke. */
const presearch: Variants = {
  /** first open: the skeleton layer fades in place on the S-curve (Brand Widget PLP), the elements then rise out of it */
  intro: { opacity: 1, y: 0, transition: { duration: st.skeleton.layer, ease: handoff.easeInOut } },
  in: (d: number) => ({ opacity: 1, y: 0, transition: { y: { ...handoff.spring, delay: d }, opacity: { duration: handoff.fade.out, ease: handoff.easeOut, delay: d } } }),
  out: { opacity: 0, y: handoff.travel, transition: { y: handoff.spring, opacity: { duration: handoff.fade.io, ease: handoff.easeInOut } } },
};

/**
 * NoonSearchScreen with the Brand Widget PLP handoff choreography:
 * · push → every element below the search bar starts as a skeleton (Brand Widget PLP band shimmer): the layer fades in,
 *   then the page resolves component by component, top → bottom (Recent Searches, then Trending searches), each
 *   component crossfading out of its skeletons as one unit
 * · presearch coming back later (field cleared) rises 20px while fading in
 * · first keystroke → presearch drops 20px and fades (S-curve); 110ms later the rows fall in TOP→BOTTOM,
 *   60ms apart, on the handoff spring with the ease-out fade
 * · still typing → rows update in place: a changed suggestion crossfades (BlurSwap, 28ms cascade), spare
 *   rows lift away, new ones fall in; a burst of keys within 60ms lands as one change
 * · field cleared → rows leave BOTTOM→TOP 40ms apart, presearch returns 40ms after the last one
 * · a pick → the field fills (typed part holds, the rest fades in), rows leave fast (25ms apart) and the
 *   PLP fades in over this page (`results-fade`), so the search bar never moves. Back plays it in reverse.
 */
export function SearchScreen() {
  const nav = useNav();
  const params = useParams<{ q?: string }>();
  const [q, setQ] = useState(params.q ?? '');
  const [fill, setFill] = useState<{ from: number; key: number }>();
  const [recents, setRecents] = useState(recentSearches);
  const [editing, setEditing] = useState(false);
  const [phase, setPhaseState] = useState<Phase>('idle');
  const [rows, setRows] = useState<Rows>(empty);
  const [presearchDelay, setPresearchDelay] = useState(params.q ? 0 : st.presearchPushDelay);
  // first open (no query): the skeleton intro. At revealAt the page resolves component by component:
  // group 0 Recent Searches (header, Edit, tiles) · group 1 Trending searches (heading + every pill)
  const [intro] = useState(!params.q);
  const [introIn, setIntroIn] = useState(intro);
  const [introShown, setIntroShown] = useState(false);
  useEffect(() => {
    if (!intro) return;
    const t = setTimeout(() => setIntroShown(true), st.skeleton.revealAt * 1000);
    return () => clearTimeout(t);
  }, [intro]);
  const groupIntro: GroupIntro | undefined = intro ? { shown: introShown, at: (group) => group * st.skeleton.groupStagger } : undefined;
  const phaseRef = useRef<Phase>('idle');
  const rowsRef = useRef(rows);
  const hideEnd = useRef(0);
  const headerRef = useRef<HTMLDivElement>(null);
  /** what was typed when a suggestion was picked: the leaving rows keep highlighting it (not the picked text) */
  const typed = useRef(q);
  /** what each slot last showed, so a leaving row keeps its content while it animates out */
  const lastShown = useRef<(Suggestion | undefined)[]>([]);
  rowsRef.current = rows;
  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  };

  /** put `list` in the slots: new rows fall in after the ones already up, changed rows crossfade */
  const commit = useCallback((list: Suggestion[], fromHidden: boolean) => {
    const prev = rowsRef.current;
    const up = fromHidden ? 0 : prev.list.length;
    let fresh = 0;
    let changed = 0;
    setRows({
      list,
      delay: list.map((s, i) => (i >= up ? fresh++ * st.rowStagger : prev.list[i]?.text !== s.text ? changed++ * st.crossfadeStep : 0)),
      epoch: prev.epoch.map((e, i) => (i >= up && i < list.length ? e + 1 : e)),
    });
  }, []);

  // the suggestion state machine, run on every keystroke
  const update = useCallback(
    (value: string) => {
      if (phaseRef.current === 'leaving') return () => undefined;
      const list = listFor(value);
      let t: ReturnType<typeof setTimeout> | undefined;
      if (list.length) {
        if (phaseRef.current === 'showing') {
          if (keyOf(list) !== keyOf(rowsRef.current.list)) t = setTimeout(() => commit(list, false), st.settleMs);
        } else {
          t = setTimeout(() => {
            commit(list, true);
            setPhase('showing');
          }, st.rowEnterDelay * 1000);
        }
      } else if (phaseRef.current === 'showing') {
        const n = rowsRef.current.list.length;
        hideEnd.current = performance.now() + ((n - 1) * st.rowOutStagger + handoff.fade.io) * 1000;
        setPhase('hiding');
      }
      if (!value.trim()) setPresearchDelay(Math.max(0, hideEnd.current - performance.now()) / 1000 + st.presearchGap);
      return () => clearTimeout(t);
    },
    [commit],
  );
  useEffect(() => update(q), [q, update]);
  // the results page and the PDP are lazy chunks: fetch them now so the in-place hand-off never shows an empty frame
  useEffect(
    () =>
      preloadRoutes(
        () => import('../plp/ListingScreen'),
        () => import('../pdp/DetailScreen'),
      ),
    [],
  );

  // back from results: the rows spring back in and the field is editable again
  const isTop = useIsTop();
  useEffect(() => {
    if (!isTop || phaseRef.current !== 'leaving') return;
    setPhase('idle');
    headerRef.current?.querySelector('input')?.focus({ preventScroll: true });
    return update(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTop]);

  const fillFrom = (text: string) => (text.toLowerCase().startsWith(q.toLowerCase()) ? q.length : 0);
  const go = (text: string) => {
    const query = text.trim();
    if (!query || phaseRef.current === 'leaving') return;
    typed.current = q;
    setFill({ from: fillFrom(query), key: Date.now() });
    setQ(query);
    const up = phaseRef.current === 'showing' ? rowsRef.current.list.length : 0;
    setPhase('leaving');
    (document.activeElement as HTMLElement | null)?.blur(); // the keyboard drops as the rows leave
    // the rows finish leaving first (nothing overlaps), then the PLP layer fades in
    const rowsOut = up ? (up - 1) * st.fastExit.stagger + st.fastExit.move : !q.trim() ? handoff.fade.io : 0;
    // hand over once the rows have faded AND the picked text has fully faded in (the PLP's bar shows it at full ink)
    const ms = Math.max(rowsOut, fillFrom(query) < query.length ? SEARCH_FILL_FADE : 0);
    setTimeout(() => nav.push('plp/listing', { query }, { transition: 'results-fade' }), ms * 1000 + 10);
  };

  const n = rows.list.length;
  const stateOf = (i: number) => {
    if (phase === 'showing') return i < n ? 'in' : 'gone';
    if (phase === 'hiding') return 'out';
    if (phase === 'leaving') return 'fast';
    return 'out';
  };
  const delayOf = (i: number) => {
    if (phase === 'showing') return i < n ? rows.delay[i] : (i - n) * st.crossfadeStep;
    if (phase === 'hiding') return Math.max(0, n - 1 - i) * st.rowOutStagger;
    if (phase === 'leaving') return Math.max(0, n - 1 - i) * st.fastExit.stagger;
    return 0;
  };
  const showPresearch = !q.trim() && phase !== 'leaving';
  // once presearch has left (first keystroke), it comes back with the normal rise
  useEffect(() => {
    if (!showPresearch) setIntroIn(false);
  }, [showPresearch]);
  const trendingGroup = recents.length ? 1 : 0; // the component after Recent Searches

  const header = (
    <div ref={headerRef} style={{ background: ref.color('bgSurface'), padding: 'calc(var(--nk-inset-top) + 4px) 16px 12px' }}>
      <SearchInput value={q} onChange={setQ} onBack={nav.back} autoFocus onSubmit={go} fill={fill} committed={phase === 'leaving'} />
    </div>
  );

  return (
    <Screen header={header} background="bgSurface">
      <div style={{ position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0, y: intro ? 0 : handoff.travel }}
          animate={showPresearch ? (introIn ? 'intro' : 'in') : 'out'}
          custom={presearchDelay}
          variants={presearch}
          // the first shimmer pass once the skeleton layer is showing (reference: 120ms after it appears)
          style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 8, pointerEvents: showPresearch ? 'auto' : 'none', '--nk-skeleton-at': '0.12s' } as CSSProperties}
        >
          <RecentSearches
            items={recents}
            editing={editing}
            onToggleEdit={() => setEditing((e) => !e)}
            onRemove={(id) => setRecents((r) => r.filter((x) => x.id !== id))}
            onPress={go}
            intro={groupIntro}
          />
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <GroupReveal intro={groupIntro} group={trendingGroup} radius="var(--nk-radius-r4)" style={{ alignSelf: 'flex-start', margin: '0 16px' }}>
              <Text variant="section" color="textStrong" style={groupIntro ? undefined : { padding: '0 16px' }}>
                Trending searches
              </Text>
            </GroupReveal>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 16px' }}>
              {trending.map((t, j) => (
                // every pill resolves with its component (Trending searches)
                <GroupReveal key={t} intro={groupIntro} group={trendingGroup} index={1 + j} radius="var(--nk-radius-full)">
                  <Pill variant="tag" icon="trendingUp" onPress={() => go(t)}>
                    {t}
                  </Pill>
                </GroupReveal>
              ))}
            </div>
          </section>
        </motion.div>

        <div role="listbox" aria-label="Suggestions" style={{ position: 'absolute', inset: '0 0 auto', padding: '4px 12px', pointerEvents: phase === 'showing' ? 'auto' : 'none' }}>
          {Array.from({ length: st.maxRows }, (_, i) => {
            if (rows.list[i]) lastShown.current[i] = rows.list[i];
            const s = rows.list[i] ?? lastShown.current[i];
            return (
              <motion.div
                key={i}
                role="option"
                initial={{ opacity: 0, y: -handoff.travel }}
                animate={stateOf(i)}
                custom={delayOf(i)}
                variants={slot}
                style={{ marginBottom: 8, visibility: s ? 'visible' : 'hidden' }}
              >
                {s && (
                  <BlurSwap key={rows.epoch[i]} swapKey={s.text} delay={rows.delay[i] ?? 0}>
                    <SuggestionRow
                      text={s.text}
                      query={s.text.startsWith('Search for "') ? '' : phase === 'leaving' ? typed.current : q}
                      product={s.product}
                      category={s.category}
                      onPress={() => go(s.text.startsWith('Search for "') ? q : s.text)}
                      onFill={() => {
                        setFill({ from: fillFrom(s.text), key: Date.now() });
                        setQ(s.text + ' ');
                      }}
                    />
                  </BlurSwap>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}
