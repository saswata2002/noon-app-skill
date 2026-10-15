import { animate, useMotionValue, useReducedMotion, type MotionValue } from 'motion/react';
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { duration, easing } from '../motion/presets';

/** ScrollVisibilityProvider constants (src/utils/BottomTabs/ScrollVisibilityProvider.ts) */
export interface TabBarScrollConfig {
  /** TOP_THRESHOLD: always shown at or above */
  top: number;
  /** TAB_HIDE_ACTIVATION_OFFSET: never hides above */
  activation: number;
  /** SCROLL_DEAD_ZONE */
  deadZone: number;
  /** TAB_HIDE_DISTANCE / TAB_SHOW_DISTANCE (continuous scroll) */
  hideAfter: number;
  showAfter: number;
  /** TAB_HIDE/SHOW_VELOCITY_Y, pt/ms, on drag end */
  flickVelocity: number;
  /** END_REACH_THRESHOLD */
  endReach: number;
  /** native hide/showTabBar curve (was 0.15s UIViewAnimationOptionCurveEaseOut [0, 0, 0.58, 1] → Test01 easing.out) */
  ease: [number, number, number, number];
}

/** bappzaar master values (same for every marketplace screen) */
export const tabBarScroll: TabBarScrollConfig = { top: 10, activation: 150, deadZone: 4, hideAfter: 64, showAfter: 24, flickVelocity: 2, endReach: 20, ease: easing.out };

type Scroll = { y: number; contentHeight: number; layoutHeight: number };

/**
 * bappzaar src/utils/BottomTabs/ScrollVisibilityProvider.ts, 1:1 (keyboard freeze and the idle auto-show, off on
 * master, left out). Used by every noon screen that registers a BottomTabScrollVisibilityProvider (PLP, PDP).
 * `onHide` / `onShow` drive the bar.
 */
export class TabBarScrollVisibility {
  hidden = false;
  private down = 0;
  private up = 0;
  private lastY = 0;
  private atEnd = false;
  constructor(private cfg: TabBarScrollConfig, private onHide: () => void, private onShow: () => void) {}

  private hide() {
    if (this.hidden || this.atEnd) return;
    this.hidden = true;
    this.onHide();
  }

  private show() {
    this.down = 0;
    this.up = 0;
    if (!this.hidden) return;
    this.hidden = false;
    this.onShow();
  }

  reveal() {
    this.show();
  }

  /** release(): state back to visible without calling onShow (the caller restores the bar) */
  release() {
    this.down = 0;
    this.up = 0;
    this.lastY = 0;
    this.atEnd = false;
    this.hidden = false;
  }

  onScroll({ y, contentHeight, layoutHeight }: Scroll) {
    const atBottom = contentHeight > 0 && layoutHeight > 0 && y + layoutHeight >= contentHeight - this.cfg.endReach;
    if (atBottom !== this.atEnd) this.atEnd = atBottom;

    if (y <= this.cfg.top || y < this.cfg.activation) {
      this.lastY = y;
      this.show();
      return;
    }
    const dy = y - this.lastY;
    if (Math.abs(dy) < this.cfg.deadZone) return;
    if (dy > 0) {
      this.up = 0;
      this.down += dy;
      if (!this.hidden && this.down >= this.cfg.hideAfter) this.hide();
    } else {
      this.down = 0;
      this.up += -dy;
      // autoShowOnReachEnd is off: the bounce at the end of the list doesn't bring the bar back
      if (this.hidden && this.up >= this.cfg.showAfter && !this.atEnd) this.show();
    }
    this.lastY = y;
  }

  /** a programmatic jump (e.g. keeping a row in place after content above it changed): new baseline, no hide / show */
  rebase(y: number) {
    this.lastY = y;
    this.down = 0;
    this.up = 0;
  }

  /** iOS onScrollEndDrag: velocity in px/ms, positive = scrolling down */
  onDragEnd(velocity: number) {
    if (velocity > this.cfg.flickVelocity) this.hide();
    else if (velocity < -this.cfg.flickVelocity && !this.atEnd) this.show();
  }
}

/**
 * Hook form for a screen with the tab bar: `tabHide` 0 (shown) → 1 (slid off), animated over duration.fast with the
 * native ease-out; feed `onScroll(y)` from `<Screen onScroll>` (writes a motion value, never re-renders). When the
 * screen is covered (`active` false) the provider is released and the bar restored without animation, as
 * navigationWrapper's push does.
 */
export function useTabBarScrollHide(scrollRef: RefObject<HTMLDivElement | null>, active: boolean, cfg: TabBarScrollConfig = tabBarScroll): { tabHide: MotionValue<number>; onScroll: (y: number) => void; reveal: () => void; rebase: (y: number) => void } {
  const reduce = useReducedMotion();
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;
  const tabHide = useMotionValue(0);
  const ctl = useRef<TabBarScrollVisibility | null>(null);
  if (!ctl.current) {
    const to = (v: number) => animate(tabHide, v, { duration: reduceRef.current ? 0 : duration.fast, ease: cfg.ease });
    ctl.current = new TabBarScrollVisibility(cfg, () => to(1), () => to(0));
  }

  // onScrollEndDrag velocity: the last ~60ms of samples when the finger lifts
  const samples = useRef<{ t: number; y: number }[]>([]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onEnd = () => {
      const now = performance.now();
      const recent = samples.current.filter((p) => now - p.t <= 60);
      if (recent.length < 2) return;
      const a = recent[0];
      const b = recent[recent.length - 1];
      if (b.t > a.t) ctl.current!.onDragEnd((b.y - a.y) / (b.t - a.t));
    };
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => el.removeEventListener('touchend', onEnd);
  }, [scrollRef]);

  useEffect(() => {
    if (active) return;
    ctl.current!.release();
    tabHide.jump(0);
  }, [active, tabHide]);

  const onScroll = useCallback(
    (y: number) => {
      const el = scrollRef.current;
      const now = performance.now();
      const s = samples.current;
      s.push({ t: now, y });
      while (s.length && now - s[0].t > 120) s.shift();
      ctl.current!.onScroll({ y, contentHeight: el?.scrollHeight ?? 0, layoutHeight: el?.clientHeight ?? 0 });
    },
    [scrollRef],
  );

  const reveal = useCallback(() => ctl.current!.reveal(), []);
  const rebase = useCallback((y: number) => ctl.current!.rebase(y), []);
  return { tabHide, onScroll, reveal, rebase };
}
