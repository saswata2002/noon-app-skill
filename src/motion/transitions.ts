import type { TargetAndTransition, Transition } from 'motion/react';
import { duration, easing, handoff, spring } from './presets';

/**
 * Screen transitions. A transition describes how a screen enters (initial → animate),
 * leaves (exit) and how the screen *underneath* reacts while it is covered (under).
 *
 * Add your own with `registerTransition('my-flip', {...})` from anywhere — e.g. in a
 * flow's index.ts — then use it with `nav.push('pdp/detail', params, { transition: 'my-flip' })`.
 */
export interface ScreenTransition {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
  /** applied to the screen below while this one is on top */
  under?: TargetAndTransition;
  transition: Transition;
  /** the stack layer paints no page background while it uses this transition (the screen draws and fades its own) */
  transparent?: boolean;
}

/** screen movement (push, modal): the Test01 spring (the recorded page push settles in ≈ 0.547s) */
const iosCurve: Transition = handoff.spring;
/** Test01 push parallax: the page underneath drifts 200 of the 382 the new one travels */
const UNDER_X = `${-(handoff.parallax * 100).toFixed(2)}%`;

const builtIn = {
  push: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    under: { x: UNDER_X, filter: 'brightness(0.92)' },
    transition: iosCurve,
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: duration.base, ease: easing.standard },
  },
  'fade-up': {
    // Test01 block: travels 20px on the spring while it fades in (ease-out 183ms)
    initial: { opacity: 0, y: handoff.travel },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: handoff.travel },
    transition: { y: handoff.spring, opacity: { duration: handoff.fade.out, ease: handoff.easeOut } },
  },
  modal: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    under: { scale: 0.94, borderRadius: 24, filter: 'brightness(0.85)' },
    transition: iosCurve,
  },
  zoom: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: spring.gentle,
  },
  sheet: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: spring.sheet,
  },
  none: {
    initial: {},
    animate: {},
    exit: {},
    transition: { duration: 0 },
  },
} satisfies Record<string, ScreenTransition>;

export type BuiltInTransition = keyof typeof builtIn;
// eslint-disable-next-line @typescript-eslint/ban-types
export type TransitionName = BuiltInTransition | (string & {});

const registry = new Map<string, ScreenTransition>(Object.entries(builtIn));

export function registerTransition(name: string, t: ScreenTransition) {
  registry.set(name, t);
}

export function getTransition(name: TransitionName): ScreenTransition {
  return registry.get(name) ?? builtIn.push;
}

export function listTransitions() {
  return [...registry.keys()];
}

/* ── Reduced motion ─────────────────────────────────────────────────────────────────────────────────── */

const MOVING = new Set(['x', 'y', 'z', 'scale', 'scaleX', 'scaleY', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'skew', 'skewX', 'skewY', 'transformPerspective', 'top', 'left', 'right', 'bottom', 'width', 'height']);
const still = (t: TargetAndTransition | undefined) => (t ? (Object.fromEntries(Object.entries(t).filter(([k]) => !MOVING.has(k))) as TargetAndTransition) : t);
const moves = (t: TargetAndTransition) => Object.keys(t).some((k) => MOVING.has(k));
const reducedCache = new WeakMap<ScreenTransition, ScreenTransition>();

/**
 * The reduced-motion version of a screen transition (used by the Navigator while motion is reduced): every movement
 * (slide, scale, flip) is dropped; opacity and colour/filter changes keep their timing. A transition that only moved
 * (`push`, `modal`, `slide-left`, `mb-modal`, …) becomes a `duration.base` cross-fade; `none` / instant ones stay instant.
 */
export function reducedTransition(t: ScreenTransition): ScreenTransition {
  const hit = reducedCache.get(t);
  if (hit) return hit;
  const fades = 'opacity' in t.initial || 'opacity' in t.exit;
  const out: ScreenTransition =
    !fades && (moves(t.initial) || moves(t.exit))
      ? { initial: { ...still(t.initial), opacity: 0 }, animate: { ...still(t.animate), opacity: 1 }, exit: { ...still(t.exit), opacity: 0 }, under: still(t.under), transition: { duration: duration.base, ease: easing.standard } }
      : { initial: still(t.initial)!, animate: still(t.animate)!, exit: still(t.exit)!, under: still(t.under), transition: t.transition };
  reducedCache.set(t, out);
  return out;
}
