import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';
import {
  createContext,
  memo,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { getTransition as getTransitionRaw, reducedTransition, type TransitionName } from '../motion/transitions';
import { duration, easing, handoff, pageLoader as pl, spring } from '../motion/presets';
import { haptic } from '../motion/haptics';
import { useReduceMotion } from '../motion/reducedMotion';
import { TokenScope } from '../foundations/ThemeProvider';
import { TabBar } from '../components/TabBar/TabBar';
import { SnackbarStack } from '../components/Snackbar/Snackbar';
import { preloadScreens } from './lazyScreen';
import { resolveSheet, SheetCtx } from './sheet';
import { enterPage, leavePage, PageLoader, type PageLoaderHandle } from './pageLoader';
import type { Registry } from './registry';
import type { NavigateOptions, Route, ScreenProps, StackEntry, TabId, ToastOptions } from './types';
import type { TokenOverrides } from '../foundations/tokens';
import styles from './Navigator.module.css';

interface Toast extends ToastOptions {
  id: number;
  message: string;
}

export interface NavApi {
  /** open a screen on top of the stack. `route` = 'flow/screen' | 'screen' (same flow) | 'flow' */
  push: (route: Route, params?: Record<string, unknown>, opts?: NavigateOptions) => void;
  replace: (route: Route, params?: Record<string, unknown>, opts?: NavigateOptions) => void;
  /** open a screen as a bottom sheet */
  sheet: (route: Route, params?: Record<string, unknown>) => void;
  back: () => void;
  popToRoot: () => void;
  /** wipe the stack and start from `route` (used by tab bar + playground) */
  reset: (route: Route, params?: Record<string, unknown>) => void;
  switchTab: (tab: TabId) => void;
  toast: (message: string, opts?: ToastOptions) => void;
  /** fetch the code of screens this one is about to open (full 'flow/screen' routes), so they open without an empty frame */
  preload: (...routes: Route[]) => void;
  canGoBack: boolean;
  /** route + params of the screen this hook is called from */
  route: Route;
  params: Record<string, unknown>;
  flowId: string;
  /** true when this screen is the bottom of the stack (i.e. a tab root showing the tab bar) */
  isRoot: boolean;
  stack: StackEntry[];
}

type NavActions = Pick<NavApi, 'push' | 'replace' | 'sheet' | 'back' | 'popToRoot' | 'reset' | 'switchTab' | 'toast' | 'preload'>;

/** The stack lives outside React state so a screen only re-renders on navigation when it reads `stack` / `canGoBack` / `isRoot`. */
interface StackStore {
  get: () => StackEntry[];
  set: (next: StackEntry[] | ((s: StackEntry[]) => StackEntry[])) => void;
  subscribe: (listener: () => void) => () => void;
}
function createStackStore(initial: StackEntry[]): StackStore {
  let stack = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => stack,
    set: (next) => {
      const value = typeof next === 'function' ? next(stack) : next;
      if (value === stack) return;
      stack = value;
      listeners.forEach((l) => l());
    },
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

// a stable value: navigating never re-renders a screen through this context
const NavCtx = createContext<{ actions: NavActions; store: StackStore; canGoBack: (s: StackEntry[]) => boolean; registry: Registry; pageLoader: boolean; toasts: boolean } | null>(
  null,
);
const EntryCtx = createContext<StackEntry | null>(null);

export const TAB_ROUTES: Record<TabId, Route> = {
  home: 'home/home',
  categories: 'categories/categories',
  deals: 'deals/deals',
  account: 'account/account',
  cart: 'cart/cart',
};

let keySeq = 0;
const nextKey = () => `e${++keySeq}`;

export function useNav(): NavApi {
  const nav = useContext(NavCtx);
  const entry = useContext(EntryCtx);
  if (!nav) throw new Error('useNav must be used inside <NoonPrototype>');
  const { store } = nav;
  // A component re-renders on navigation only if its last render read `stack`, `canGoBack` or `isRoot`: screens that
  // only push / back / toast keep their tree when something is pushed over them. Reads in handlers and effects get the
  // live stack without subscribing.
  const reads = useRef(false);
  const rendering = useRef(true);
  rendering.current = true;
  reads.current = false;
  useLayoutEffect(() => {
    rendering.current = false;
  });
  const subscribe = useCallback((cb: () => void) => store.subscribe(() => reads.current && cb()), [store]);
  useSyncExternalStore(subscribe, store.get);
  const stack = () => {
    if (rendering.current) reads.current = true;
    return store.get();
  };
  return {
    ...nav.actions,
    route: entry?.route ?? '',
    params: entry?.params ?? {},
    flowId: entry?.route.split('/')[0] ?? '',
    get stack() {
      return stack();
    },
    get canGoBack() {
      return nav.canGoBack(stack());
    },
    get isRoot() {
      return !!entry && stack()[0]?.key === entry.key;
    },
  };
}

/**
 * True while this screen is the top of the stack. Re-renders only when that flips (not on every push / back), and a
 * screen that is animating out keeps its last value instead of re-rendering mid-exit.
 */
export function useIsTop(): boolean {
  const nav = useContext(NavCtx);
  const entry = useContext(EntryCtx);
  if (!nav) throw new Error('useIsTop must be used inside <NoonPrototype>');
  const last = useRef(true);
  const get = () => {
    const s = nav.store.get();
    if (entry && s.some((e) => e.key === entry.key)) last.current = s.at(-1)?.key === entry.key;
    return last.current;
  };
  return useSyncExternalStore(nav.store.subscribe, get);
}

/**
 * True when the Navigator runs the page loader (`pageLoader`). Screens whose own first-load state would show right after
 * it (the bappzaar ProgressLoader sweep line above the tab bar on Cart / Categories) skip that state, since the page
 * loader already covered the wait.
 */
export function usePageLoader(): boolean {
  return useContext(NavCtx)?.pageLoader ?? false;
}

/**
 * False when the Navigator runs with `toasts={false}`: `nav.toast()` shows nothing and the self-dismissing `Toast`
 * host (voucher / address toasts, the cart snackbar) renders nothing while keeping its timer, so flows that wait for a
 * toast to finish behave the same. True outside a Navigator.
 */
export function useToastsEnabled(): boolean {
  return useContext(NavCtx)?.toasts ?? true;
}

/** Typed params helper: `const { productId } = useParams<{ productId: string }>()` */
export function useParams<P>() {
  return useNav().params as P;
}

interface NavigatorProps {
  registry: Registry;
  initialRoute: Route;
  initialParams?: Record<string, unknown>;
  onChange?: (stack: StackEntry[]) => void;
  /** change this to force-reset the navigator from outside (playground sidebar) */
  resetSignal?: { route: Route; params?: Record<string, unknown>; nonce: number };
  overlay?: ReactNode;
  /**
   * Tab switches go page → loader → page (kit/pageLoader.tsx, 1:1 with the "Page Loader" project): the page zooms out
   * under a #F2F3F7 layer, the looping loader Lottie holds `pageLoader.hold` (0.8s), then the new tab's page scales in.
   * Every other navigation (push, back, replace, reset, sheets) keeps its own transition. Off by default.
   */
  pageLoader?: boolean;
  /** false: no toasts or snackbars anywhere (`nav.toast()` is a no-op, `Toast` hosts draw nothing). Default true. */
  toasts?: boolean;
}

export function Navigator({ registry, initialRoute, initialParams, onChange, resetSignal, overlay, pageLoader = false, toasts: toastsOn = true }: NavigatorProps) {
  const makeEntry = useCallback(
    (route: Route, params: Record<string, unknown> = {}, opts: NavigateOptions = {}, currentFlow?: string): StackEntry | null => {
      const resolved = registry.resolve(route, currentFlow);
      if (!resolved) {
        console.warn(
          `[noon-flow-kit] Unknown route "${route}". Registered:`,
          registry.all().map((r) => r.route),
        );
        return null;
      }
      const presentation = opts.presentation ?? resolved.screen.presentation ?? 'screen';
      const transition: TransitionName = opts.transition ?? resolved.screen.transition ?? (presentation === 'sheet' ? 'sheet' : presentation === 'modal' ? 'modal' : 'push');
      return {
        key: nextKey(),
        route: resolved.route,
        params: { ...(resolved.screen.defaultParams ?? {}), ...params },
        presentation,
        transition,
      };
    },
    [registry],
  );

  /** A fresh stack for `route`. Sheets/modals get their flow's backing screen underneath (or `flow.sheetBackdrop`). */
  const rootStack = useCallback(
    (route: Route, params: Record<string, unknown> = {}, transition: TransitionName): StackEntry[] => {
      const e = makeEntry(route, params, { transition });
      if (!e) return [];
      if (e.presentation === 'screen') return [e];
      const flow = registry.resolve(e.route)!.flow;
      const backing = makeEntry(flow.sheetBackdrop ?? `${flow.id}/${flow.initial}`, params, { transition });
      return backing && backing.presentation === 'screen' && backing.route !== e.route ? [backing, e] : [{ ...e, presentation: 'screen' }];
    },
    [makeEntry, registry],
  );

  const [store] = useState(() => createStackStore(rootStack(initialRoute, initialParams, 'none')));
  const stack = useSyncExternalStore(store.subscribe, store.get);
  const setStack = store.set;
  const [instantExit, setInstantExit] = useState(false);
  /*
   * A newly opened screen holds its starting pose until it has painted twice, then its transition (and the covered
   * screen's `under` parallax) start together. A heavy screen (the storefront PDP) spends its first frames on layout,
   * paint and image decode; starting the clock at mount made the first visible frame jump ~30% into the slide.
   */
  const [armed, setArmed] = useState<ReadonlySet<string>>(() => new Set(store.get().map((e) => e.key)));
  useLayoutEffect(() => {
    const pending = stack.filter((e) => !armed.has(e.key)).map((e) => e.key);
    if (!pending.length) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setArmed((a) => new Set([...a, ...pending])));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [stack, armed]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const stackRef = useMemo(
    () => ({
      get current() {
        return store.get();
      },
    }),
    [store],
  );

  useEffect(() => onChange?.(stack), [stack, onChange]);
  // after the first screen is up, fetch the other lazy screens in idle time so pushes don't wait on a download
  useEffect(() => preloadScreens(), []);

  const currentFlow = useCallback(() => stackRef.current.at(-1)?.route.split('/')[0], [stackRef]);

  /* ── Page loader on tab switches: page → loader (hold) → page ──────────────────────────────────────────────────
     The stack changes only while the loader covers the screen (instant, no screen transition); the leaving page's body
     zooms out before, the arriving page's body scales in after. Another tab while loading retargets: the latest one
     wins and the loader holds `pl.hold` more. Refs only, so the nav actions stay stable. */
  const rootRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<PageLoaderHandle>(null);
  const loading = useRef<{ commit: () => void; timer: ReturnType<typeof setTimeout>; barTab?: TabId } | null>(null);
  const enterPending = useRef(false);
  const reduceRef = useRef(false);
  const topScreen = () => [...stackRef.current].reverse().find((e) => e.presentation !== 'sheet');
  const tabOf = (route: Route) => {
    const r = registry.resolve(route);
    return r?.flow.tabBar?.screens.includes(r.screen.id) ? { tab: r.flow.tabBar.tab, variant: r.flow.tabBar.variant } : undefined;
  };
  const bodyOf = (key: string) => rootRef.current?.querySelector(`[data-key="${key}"] > .${styles.screenBody}`) ?? null;
  const enterTop = () => {
    enterPending.current = false;
    const top = topScreen();
    const body = top && bodyOf(top.key);
    if (body) enterPage(body, pl.land, reduceRef.current);
  };
  const land = () => {
    const cur = loading.current;
    if (!cur) return;
    loading.current = null;
    enterPending.current = true;
    cur.commit(); // → the layout effect below scales the new page in
    requestAnimationFrame(() => enterPending.current && enterTop()); // the commit changed nothing (retargeted back)
    loaderRef.current?.hide();
    haptic('soft'); // the new page lands
  };
  const viaLoader = (commit: () => void, target?: Route) => {
    if (!pageLoader) return commit();
    // fetch the arriving screen's code now, so it is ready under the loader
    if (target) (registry.resolve(target)?.screen.component as { preload?: () => Promise<unknown> } | undefined)?.preload?.().catch(() => undefined);
    const to = target ? tabOf(target) : undefined;
    const cur = loading.current;
    if (cur) {
      clearTimeout(cur.timer);
      cur.commit = commit;
      cur.timer = setTimeout(land, pl.hold);
      if (cur.barTab && to) {
        loaderRef.current?.setBar({ from: cur.barTab, to: to.tab, variant: to.variant });
        cur.barTab = to.tab;
      }
      return;
    }
    const s = stackRef.current;
    const top = topScreen();
    const from = top && s[0]?.key === top.key ? tabOf(top.route) : undefined;
    // the leaving page (and any sheet over it) zooms out and dissolves
    if (top) {
      const body = bodyOf(top.key);
      if (body) leavePage(body, reduceRef.current);
      for (const e of s.slice(s.indexOf(top) + 1)) {
        const layer = rootRef.current?.querySelector(`[data-key="${e.key}"]`);
        if (layer) leavePage(layer, reduceRef.current);
      }
    }
    const barTab = from && to ? to.tab : undefined;
    loading.current = { commit, timer: setTimeout(land, pl.artIn + pl.hold), barTab };
    loaderRef.current?.show();
    loaderRef.current?.setBar(from && to ? { from: from.tab, to: to.tab, variant: to.variant } : null);
  };
  const via = useRef(viaLoader);
  via.current = viaLoader;
  useEffect(() => () => clearTimeout(loading.current?.timer), []);

  const push = useCallback<NavApi['push']>(
    (route, params, opts) => {
      const e = makeEntry(route, params, opts, currentFlow());
      if (e) {
        setInstantExit(false);
        setStack((s) => [...s, e]);
      }
    },
    [makeEntry, currentFlow, setStack],
  );
  const replace = useCallback<NavApi['replace']>(
    (route, params, opts) => {
      const e = makeEntry(route, params, { transition: 'fade', ...opts }, currentFlow());
      if (e) {
        setInstantExit(true);
        setStack((s) => [...s.slice(0, -1), e]);
      }
    },
    [makeEntry, currentFlow, setStack],
  );
  const preload = useCallback<NavApi['preload']>(
    (...routes) => {
      for (const r of routes) (registry.resolve(r)?.screen.component as { preload?: () => Promise<unknown> } | undefined)?.preload?.().catch(() => undefined);
    },
    [registry],
  );
  const sheet = useCallback<NavApi['sheet']>((route, params) => push(route, params, { presentation: 'sheet' }), [push]);
  /** Logical parent for a screen opened with no history (direct URL / sidebar / reload): screen.parent → flow.parent → home; tab roots have none. */
  const parentOf = useCallback(
    (route: Route): Route | undefined => {
      const r = registry.resolve(route);
      if (!r) return undefined;
      const isTabRoot = r.flow.tabBar?.screens.includes(r.screen.id);
      const parent = r.screen.parent ?? r.flow.parent ?? (isTabRoot ? undefined : 'home/home');
      return parent && registry.resolve(parent)?.route !== r.route ? parent : undefined;
    },
    [registry],
  );
  const back = useCallback(() => {
    setInstantExit(false);
    const s = stackRef.current;
    if (s.length > 1) {
      setStack(s.slice(0, -1));
      return;
    }
    // Nothing to pop: slide the logical parent in underneath, then pop so the normal back transition plays.
    const top = s[0];
    const parent = top && parentOf(top.route);
    const below = parent && makeEntry(parent, {}, { transition: 'none' });
    if (!top || !below) return;
    setStack([below, top]);
    requestAnimationFrame(() => setStack([below]));
  }, [makeEntry, parentOf, stackRef, setStack]);
  const popToRoot = useCallback(() => {
    setInstantExit(false);
    setStack((s) => s.slice(0, 1));
  }, [setStack]);
  const reset = useCallback<NavApi['reset']>(
    (route, params) => {
      const next = rootStack(route, params, 'fade');
      if (next.length) {
        setInstantExit(true);
        setStack(next);
      }
    },
    [rootStack, setStack],
  );
  const switchTab = useCallback(
    (tab: TabId) => {
      const target = TAB_ROUTES[tab];
      const there = () => stackRef.current.length === 1 && stackRef.current[0].route === target;
      // while loading, a tap on the loader's tab bar retargets (even back to the page being left)
      if (there() && !(pageLoader && loading.current)) return;
      const e = makeEntry(target, {}, { transition: 'none' });
      if (!e) return;
      const commit = () => {
        if (there()) return; // retargeted back to where we were: the page just scales back in
        setInstantExit(true);
        setStack([e]);
      };
      if (pageLoader) return via.current(commit, target);
      commit();
    },
    [makeEntry, stackRef, setStack, pageLoader],
  );

  const toast = useCallback<NavApi['toast']>(
    (message, opts = {}) => {
      if (!toastsOn) return; // toasts switched off
      const id = Date.now() + Math.random();
      // keep at most 3 queued: the newest shows in front, the stack card signals the rest
      setToasts((t) => [...t.slice(-2), { id, message, ...opts }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.duration ?? 2600);
    },
    [toastsOn],
  );

  useEffect(() => {
    if (resetSignal) reset(resetSignal.route, resetSignal.params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal?.nonce]);

  // reduced motion: screens cross-fade instead of sliding / scaling (motion/react would only make the movement instant)
  const reduce = useReduceMotion();
  reduceRef.current = reduce;
  // page loader: the stack just changed under the loader → the new top page scales in
  useLayoutEffect(() => {
    if (enterPending.current) enterTop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stack]);
  const getTransition = (name: TransitionName) => (reduce ? reducedTransition(getTransitionRaw(name)) : getTransitionRaw(name));

  const nav = useMemo(
    () => ({
      actions: { push, replace, sheet, back, popToRoot, reset, switchTab, toast, preload },
      store,
      canGoBack: (s: StackEntry[]) => s.length > 1 || !!(s[0] && parentOf(s[0].route)),
      registry,
      pageLoader,
      toasts: toastsOn,
    }),
    [push, replace, sheet, back, popToRoot, reset, switchTab, toast, preload, store, parentOf, registry, pageLoader, toastsOn],
  );

  // for each screen entry, find the next *screen/modal* entry above it — that one's `under` styles apply
  const coveredBy = (i: number) => {
    for (let j = i + 1; j < stack.length; j++) if (stack[j].presentation !== 'sheet') return stack[j];
    return undefined;
  };

  const front = toasts[toasts.length - 1];
  return (
    <NavCtx.Provider value={nav}>
      <div ref={rootRef} className={styles.root}>
        <AnimatePresence initial={false} custom={instantExit}>
          {stack.map((entry, i) => {
            const resolved = registry.resolve(entry.route)!;
            const Screen = resolved.screen.component;
            const t = getTransition(entry.transition);
            const isTop = i === stack.length - 1;
            const content = <ScreenHost entry={entry} Screen={Screen} tokens={resolved.flow.tokens} />;

            if (entry.presentation === 'sheet') {
              return (
                <SheetLayer key={entry.key} dataKey={entry.key} options={resolveSheet(resolved.screen.sheet)} onDismiss={back} isTop={isTop} zIndex={i} reduce={reduce}>
                  {content}
                </SheetLayer>
              );
            }

            const cover = coveredBy(i);
            // the screen below starts its parallax only once the one on top is armed (they move as one)
            const under = cover && armed.has(cover.key) ? getTransition(cover.transition).under : undefined;
            const holding = !armed.has(entry.key);
            const tab = i === 0 && resolved.flow.tabBar?.screens.includes(resolved.screen.id) ? resolved.flow.tabBar.tab : undefined;

            return (
              <motion.div
                key={entry.key}
                className={styles.screen}
                custom={instantExit}
                variants={{
                  initial: t.initial,
                  shown: { ...t.animate, x: (t.animate as { x?: number }).x ?? 0, scale: 1, filter: 'brightness(1)', borderRadius: 0 },
                  covered: { ...(under ?? {}), transition: cover ? getTransition(cover.transition).transition : t.transition },
                  exit: (instant: boolean) => (instant ? { opacity: 0, transition: { duration: 0.12 } } : { ...t.exit, transition: t.transition }),
                }}
                initial="initial"
                animate={holding ? 'initial' : under ? 'covered' : 'shown'}
                exit="exit"
                transition={t.transition}
                style={{ zIndex: i, pointerEvents: isTop ? 'auto' : 'none', background: resolved.screen.transparent || t.transparent ? 'transparent' : undefined }}
                // a covered screen is out of the tab order and the accessibility tree (the sheet / screen on top is modal)
                inert={!isTop}
                data-route={entry.route}
                data-key={entry.key}
              >
                <div className={styles.screenBody}>{content}</div>
                {tab && <TabBar active={tab} variant={resolved.flow.tabBar?.variant} autoHide={resolved.flow.tabBar?.scrollHide ?? true} covered={!isTop} />}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {pageLoader && <PageLoader ref={loaderRef} reduce={reduce} />}

        {/* Origin M-Toast; two or more queued → M-Stacked Toast (newest in front, the next one peeking behind) */}
        <div className={styles.toastLayer}>
          <AnimatePresence initial={false}>
            {front && (
              <motion.div
                key={front.id}
                className={styles.toastSlot}
                initial={{ y: 40, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={spring.sheet}
              >
                <SnackbarStack
                  count={toasts.length}
                  type={front.type ?? (front.tone === 'success' ? 'success' : front.tone === 'error' ? 'error' : 'dark')}
                  title={front.message}
                  subtitle={front.subtitle}
                  onSubtitlePress={front.onSubtitlePress}
                  asset={front.icon}
                  action={front.action}
                  onClose={() => setToasts((t) => t.filter((x) => x.id !== front.id))}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {overlay}
      </div>
    </NavCtx.Provider>
  );
}

/**
 * One stack entry's screen. Memoised on the (stable) entry, so a push, back or toast only renders the screen that
 * changes; the ones underneath keep their tree unless they read the stack through useNav().
 */
const ScreenHost = memo(function ScreenHost({ entry, Screen, tokens }: { entry: StackEntry; Screen: ComponentType<ScreenProps<any>>; tokens?: TokenOverrides }) {
  return (
    <EntryCtx.Provider value={entry}>
      <TokenScope overrides={tokens}>
        {/* screens load on demand (lazyScreen); the rest are preloaded in idle time after the first paint */}
        <Suspense fallback={null}>
          <Screen params={entry.params} />
        </Suspense>
      </TokenScope>
    </EntryCtx.Provider>
  );
});

function SheetLayer({
  children,
  options,
  onDismiss,
  isTop,
  zIndex,
  reduce,
  dataKey,
}: {
  children: ReactNode;
  options: ReturnType<typeof resolveSheet>;
  onDismiss: () => void;
  isTop: boolean;
  zIndex: number;
  reduce: boolean;
  dataKey: string;
}) {
  const drag = useDragControls();
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onDismiss();
  };
  const { layout } = options;
  const ctx = useMemo(() => ({ layout, grabber: options.grabber, dismiss: onDismiss }), [layout, options.grabber, onDismiss]);
  const cls = {
    origin: { scrim: styles.originScrim, column: styles.originColumn, zone: styles.originGrabberZone, bar: styles.originGrabber },
    floating: { scrim: styles.floatingScrim, column: styles.floatingColumn, zone: styles.floatingHandleZone, bar: styles.floatingHandle },
    classic: { scrim: styles.scrim, column: styles.sheet, zone: styles.grabberZone, bar: styles.grabber },
  }[layout];
  /*
   * Sheets rise only once their content is there, and glide when it changes size (audit 2026-10-15):
   *  · arming: the scrim dims at once, the column waits off-screen until its content has real height (a lazy screen's
   *    Suspense resolved: taller than the grabber alone) and has painted twice, then rises (fallback 800ms) — it used to
   *    rise as a 50px sliver and snap to full height half a second later
   *  · height changes after that (a loading state turning into content, an expanding section) are FLIPped: the column
   *    is bottom-anchored, so when it grows by Δ its top jumps up Δ — a plain wrapper is offset by Δ in the same paint
   *    (inline transform from the ResizeObserver callback) and springs back to 0 on the Test01 spring (WAAPI), so the
   *    top edge glides to the new height (a translate: the content never stretches). The wrapper is a plain div on
   *    purpose: as a motion component it joined the column's drag projection and got moved with it.
   */
  const columnRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  /** true once the column is up: only then is a height change a visible jump worth gliding */
  const shownRef = useRef(false);
  useEffect(() => {
    shownRef.current = ready;
  }, [ready]);
  useLayoutEffect(() => {
    const el = columnRef.current;
    if (!el) return;
    let armed = false;
    let r1 = 0;
    let r2 = 0;
    let lastH = 0;
    const arm = () => {
      if (armed) return;
      armed = true;
      r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setReady(true));
      });
    };
    const fallback = window.setTimeout(arm, 800);
    const ro = new ResizeObserver(() => {
      const h = el.offsetHeight;
      if (!armed && h > SHEET_ARM_MIN_H) arm();
      const wrap = flipRef.current;
      if (shownRef.current && lastH && wrap && Math.abs(h - lastH) > 2 && !reduce) {
        // keep the top edge where it was (this paint), then let it travel to the new height
        const now = new DOMMatrix(getComputedStyle(wrap).transform === 'none' ? undefined : getComputedStyle(wrap).transform).m42;
        const from = now + (h - lastH);
        wrap.getAnimations().forEach((a) => a.cancel());
        wrap.style.transform = `translateY(${from}px)`;
        const anim = wrap.animate([{ transform: `translateY(${from}px)` }, { transform: 'none' }], { duration: SHEET_FLIP_MS, easing: SHEET_FLIP_EASE });
        anim.onfinish = () => {
          wrap.style.transform = '';
        };
      }
      lastH = h;
    });
    ro.observe(el);
    if (el.offsetHeight > SHEET_ARM_MIN_H) arm();
    return () => {
      ro.disconnect();
      window.clearTimeout(fallback);
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [reduce]);
  const grabber = options.grabber && (
    // floating: OverlayBottomSheet renderHandle — a Pressable that also closes on tap
    <div className={cls.zone} onPointerDown={(e) => drag.start(e)} onClick={layout === 'floating' ? onDismiss : undefined}>
      <div className={cls.bar} />
    </div>
  );
  return (
    <motion.div className={styles.sheetLayer} style={{ pointerEvents: isTop ? 'auto' : 'none', zIndex }} initial="hidden" animate="shown" exit="hidden" data-key={dataKey}>
      <motion.div
        className={cls.scrim}
        variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}
        transition={{ duration: layout === 'floating' ? duration.slow : duration.medium, ease: easing.inOut }}
        onClick={options.dismissible ? onDismiss : undefined}
      />
      <div ref={flipRef} className={styles.sheetFlip}>
        <motion.div
          ref={columnRef}
          className={cls.column}
          initial="hidden"
          animate={ready ? 'shown' : 'hidden'}
          exit="hidden"
          // reduced motion: the sheet fades in place with its scrim instead of rising (dragging still works)
          variants={reduce ? { hidden: { opacity: 0 }, shown: { opacity: 1 } } : { hidden: { y: '100%' }, shown: { y: 0 } }}
          transition={reduce ? { duration: duration.base, ease: easing.standard } : spring.sheet}
          drag={options.grabber ? 'y' : false}
          dragControls={drag}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.05, bottom: 0.8 }}
          onDragEnd={onDragEnd}
          data-sheet={layout}
          // classic: the column is the sheet, so `surface` fills it (grabber zone included)
          style={
            layout === 'classic' && options.surface
              ? { background: options.surface }
              : layout === 'floating'
                ? // per-screen floating geometry (e.g. a gorhom `detached` sheet: inset 8, bottom 36)
                  ({
                    ...(options.inset != null && { '--nk-sheet-floating-inset': `${options.inset}px` }),
                    ...(options.bottomGap != null && { '--nk-sheet-floating-bottom-gap': `${options.bottomGap}px` }),
                  } as CSSProperties)
                : undefined
          }
        >
          <SheetCtx.Provider value={ctx}>
            {layout === 'origin' ? (
              <>
                {grabber}
                {/* Origin M-BottomSheet: grabber + home-indicator gap sit outside the sheet body; the body holds only the
                  Header / Body / Footer slots (<SheetHeader> <SheetBody> <SheetFooter>) */}
                <div className={styles.originSheet} style={options.surface ? { background: options.surface } : undefined}>
                  {children}
                </div>
              </>
            ) : layout === 'floating' ? (
              <div className={styles.floatingSheet} style={options.surface ? { background: options.surface } : undefined}>
                {grabber}
                <div className={`nk-scroll ${styles.floatingChildren}`}>{children}</div>
              </div>
            ) : (
              <>
                {grabber}
                {children}
              </>
            )}
          </SheetCtx.Provider>
        </motion.div>
      </div>
    </motion.div>
  );
}

/** a sheet column with only its grabber / padding (lazy content not rendered yet) stays below this */
const SHEET_ARM_MIN_H = 90;
/** the Test01 spring (280.6 / 27.14 / 1) as a CSS linear() over its settle, for the sheet FLIP */
const SHEET_FLIP_MS = 560;
const SHEET_FLIP_EASE = (() => {
  const { stiffness: k, damping: c } = handoff.spring;
  const w = Math.sqrt(k),
    z = c / (2 * w),
    wd = w * Math.sqrt(1 - z * z);
  const pts = Array.from({ length: 41 }, (_, i) => {
    const t = (SHEET_FLIP_MS / 1000) * (i / 40);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  });
  pts[40] = 1;
  return `linear(${pts.map((v) => +v.toFixed(4)).join(', ')})`;
})();
