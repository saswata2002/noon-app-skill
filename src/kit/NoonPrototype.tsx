import { MotionConfig } from 'motion/react';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { NoonThemeProvider } from '../foundations/ThemeProvider';
import type { TokenOverrides } from '../foundations/tokens';
import { DemoStoreProvider } from './DemoStore';
import { Navigator } from './Navigator';
import { PhoneFrame } from './PhoneFrame';
import { StatusBarCtx, type StatusBarTone } from './statusBar';
import { createRegistry } from './registry';
import type { FlowDef, Route, StackEntry } from './types';
import { REDUCED_MOTION_ATTR, useReduceMotion } from '../motion/reducedMotion';
import '../foundations/global.css';

export interface NoonPrototypeProps {
  /** flows to register — import only the ones your demo needs */
  flows: FlowDef[];
  /** e.g. 'home/home' or 'pdp/detail' */
  initialRoute?: Route;
  initialParams?: Record<string, unknown>;
  /** wrap in an iPhone frame (default true) */
  frame?: boolean;
  scale?: number;
  rtl?: boolean;
  /** global token overrides (rebrand / A-B a colour across every flow) */
  tokens?: TokenOverrides;
  emptyCart?: boolean;
  /**
   * Reduced motion (default `'user'`: follow the OS `prefers-reduced-motion` setting). `'always'` forces it on,
   * `'never'` always animates (e.g. a recorded demo). Drives motion/react's MotionConfig, the CSS rule in
   * global.css, Lottie / Spinner / Skeleton and every flow's autoplay (`useReduceMotion`, src/motion/reducedMotion.ts).
   */
  reducedMotion?: 'never' | 'always' | 'user';
  /**
   * Tab switches go page → looping loader Lottie (0.8s hold) → page, 1:1 with the "Page Loader" project
   * (kit/pageLoader.tsx, `pageLoader` in motion/presets.ts). Every other navigation keeps its own transition. Default false.
   */
  pageLoader?: boolean;
  /** false: no toasts or snackbars anywhere (`nav.toast()` is a no-op, `Toast` hosts draw nothing). Default true. */
  toasts?: boolean;
  onRouteChange?: (route: Route, stack: StackEntry[]) => void;
  /** imperatively reset from outside (playground) */
  resetSignal?: { route: Route; params?: Record<string, unknown>; nonce: number };
}

/**
 * Drop-in prototype player. In any React app:
 *
 *   import { NoonPrototype, homeFlow, plpFlow, pdpFlow, cartFlow } from '@noon/flow-kit';
 *   import '@noon/flow-kit/style.css';
 *   <NoonPrototype flows={[homeFlow, plpFlow, pdpFlow, cartFlow]} initialRoute="home/home" />
 */
export function NoonPrototype({ flows, initialRoute, initialParams, frame = true, scale = 1, rtl, tokens, emptyCart, reducedMotion = 'user', pageLoader, toasts, onRouteChange, resetSignal }: NoonPrototypeProps) {
  const registry = useMemo(() => createRegistry(flows), [flows]);
  const start = initialRoute ?? `${flows[0].id}/${flows[0].initial}`;
  const [screenTone, setScreenTone] = useState<StatusBarTone>('dark');
  const [topRoute, setTopRoute] = useState<Route>();
  // runtime overrides per route (useStatusBar); they only apply while that route is the top screen
  const [overrides, setOverrides] = useState<Record<string, StatusBarTone>>({});
  const setOverride = useCallback(
    (route: string, tone: StatusBarTone | undefined) =>
      setOverrides((o) => {
        if (o[route] === tone) return o;
        const next = { ...o };
        if (tone) next[route] = tone;
        else delete next[route];
        return next;
      }),
    [],
  );
  const statusBar = (topRoute && overrides[topRoute]) || screenTone;

  const onChange = useCallback(
    (stack: StackEntry[]) => {
      const top = [...stack].reverse().find((e) => e.presentation !== 'sheet') ?? stack.at(-1);
      if (top) {
        setScreenTone(registry.resolve(top.route)?.screen.statusBar ?? 'dark');
        setTopRoute(top.route);
        onRouteChange?.(stack.at(-1)!.route, stack);
      }
    },
    [registry, onRouteChange],
  );

  return (
    <NoonThemeProvider overrides={tokens} rtl={rtl}>
      <MotionConfig reducedMotion={reducedMotion}>
        <ReducedMotionScope>
          <DemoStoreProvider emptyCart={emptyCart}>
            <PhoneFrame frameless={!frame} scale={scale} statusBar={statusBar}>
              <StatusBarCtx.Provider value={setOverride}>
                <Navigator registry={registry} initialRoute={start} initialParams={initialParams} onChange={onChange} resetSignal={resetSignal} pageLoader={pageLoader} toasts={toasts} />
              </StatusBarCtx.Provider>
            </PhoneFrame>
          </DemoStoreProvider>
        </ReducedMotionScope>
      </MotionConfig>
    </NoonThemeProvider>
  );
}

/** Marks the tree with `data-nk-motion="reduce"` while motion is reduced (global.css neutralises CSS animations under it). Layout-neutral. */
function ReducedMotionScope({ children }: { children: ReactNode }) {
  const reduce = useReduceMotion();
  return (
    <div {...{ [REDUCED_MOTION_ATTR]: reduce ? 'reduce' : undefined }} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}
