import { DotLottieReact, type DotLottie } from '@lottiefiles/dotlottie-react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import loaderJson from '@assets/lotties/page-loader.json?url';
import { TabBar } from '../components/TabBar/TabBar';
import { pageLoader as pl } from '../motion/presets';
import type { TabId } from './types';
import styles from './Navigator.module.css';

/**
 * The page loader 1:1 with the "Page Loader" project (`noon-homepage/app.js`): opacity + transform WAAPI animations on
 * the reference's own curves (`pageLoader` in motion/presets.ts). Every helper starts its fade from the element's
 * current opacity and cancels what was running, so an interrupt never jumps.
 */

type Step = [Keyframe[], KeyframeAnimationOptions & { duration: number }];

/** play several animations on one element (opacity and transform on their own curves), cancelling what was running.
 *  fill 'both' holds the first frame during a delay. Reduced motion: transforms stay put, fades are short, no delay. */
export function play(el: Element, steps: Step[], reduce: boolean): Animation[] {
  el.getAnimations().forEach((a) => a.cancel());
  return steps.map(([kf, o]) =>
    reduce
      ? el.animate(kf.map((k) => ('transform' in k ? { transform: 'none' } : k)), { fill: 'both', ...o, duration: Math.min(o.duration, pl.reducedMax), delay: 0 })
      : el.animate(kf, { fill: 'both', ...o }),
  );
}
export const done = (anims: Animation[]) => Promise.all(anims.map((a) => a.finished));
const opacityOf = (el: Element) => +getComputedStyle(el).opacity;
const fade = (el: Element, to: number, ms: number, delay = 0): Step => [[{ opacity: opacityOf(el) }, { opacity: to }], { duration: ms, delay, easing: to ? pl.fadeIn : pl.fadeOut }];

/** the leaving page: fades 300 while it zooms out 100% → 96% (SOFT 420) */
export const leavePage = (el: Element, reduce: boolean) =>
  play(el, [fade(el, 0, pl.leave.fade), [[{ transform: getComputedStyle(el).transform }, { transform: `scale(${pl.leave.scale})` }], { duration: pl.leave.zoom, easing: pl.soft }]], reduce);

/** the arriving page: fades 320 while it scales in 97% → 100% (RISE 520), `delay` after the loader starts lifting. A page
 *  that was left earlier fades from where it is (0); a freshly mounted one from 0 (the reference keeps idle pages at 0) */
export const enterPage = (el: Element, delay: number, reduce: boolean) => {
  const from = el.getAnimations().length ? opacityOf(el) : 0;
  return play(el, [[[{ opacity: from }, { opacity: 1 }], { duration: pl.enter.fade, delay, easing: pl.fadeIn }], [[{ transform: `scale(${pl.enter.from})` }, { transform: 'none' }], { duration: pl.enter.rise, delay, easing: pl.rise }]], reduce);
};

export interface PageLoaderHandle {
  /** loader up: the #F2F3F7 layer fades over the receding page, then the looping Lottie rises in from frame 0 */
  show: () => void;
  /** loader off: the art zooms out and fades, the layer lifts `land` later; the Lottie stops once it has faded */
  hide: () => void;
  /** the tab bar drawn above the loader while it switches between two tab roots (the reference's bar never leaves) */
  setBar: (bar: { from: TabId; to: TabId; variant?: 'classic' | 'field' } | null) => void;
}

/**
 * The loader layer: above every screen and sheet, under the toasts. Always mounted (painted at opacity 0, the Lottie
 * loaded), so a page change never waits on a first raster or a download. Swallows taps while it is up.
 */
export const PageLoader = forwardRef<PageLoaderHandle, { reduce: boolean }>(function PageLoader({ reduce }, ref) {
  const layer = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const player = useRef<DotLottie | null>(null);
  const up = useRef(false);
  const [bar, setBarState] = useState<{ active: TabId; variant?: 'classic' | 'field' } | null>(null);

  useImperativeHandle(ref, () => ({
    show: () => {
      const l = layer.current, a = art.current;
      if (!l || !a) return;
      up.current = true;
      l.dataset.live = 'true';
      play(l, [fade(l, 1, pl.layer.in)], reduce);
      play(a, [fade(a, 1, pl.art.inFade, pl.artIn), [[{ transform: `scale(${pl.art.from})` }, { transform: 'none' }], { duration: pl.art.rise, delay: pl.artIn, easing: pl.rise }]], reduce);
      const d = player.current;
      if (d) {
        d.stop();
        d.play();
      }
    },
    hide: () => {
      const l = layer.current, a = art.current;
      if (!l || !a) return;
      up.current = false;
      play(a, [fade(a, 0, pl.art.outFade), [[{ transform: 'none' }, { transform: `scale(${pl.art.to})` }], { duration: pl.art.zoom, easing: pl.soft }]], reduce);
      done(play(l, [fade(l, 0, pl.layer.out, pl.land)], reduce))
        .then(() => {
          if (up.current) return; // a new page change started while it was lifting
          delete l.dataset.live;
          player.current?.stop();
          setBarState(null);
        })
        .catch(() => undefined);
    },
    setBar: (b) => {
      if (!b) return setBarState(null);
      // mount on the tab being left, then move to the new one so the lens travels like a tap on the real bar
      setBarState({ active: b.from, variant: b.variant });
      requestAnimationFrame(() => setBarState((s) => (s ? { ...s, active: b.to } : s)));
    },
  }));

  return (
    <>
      <div ref={layer} className={styles.loadview} aria-hidden>
        <div ref={art} className={styles.loadArt}>
          <DotLottieReact
            src={loaderJson}
            loop
            autoplay={false}
            // the 750 × 1624 comp fitted to the whole screen, centred (reference: xMidYMid meet)
            layout={{ fit: 'contain', align: [0.5, 0.5] }}
            style={{ width: '100%', height: '100%' }}
            dotLottieRefCallback={(d) => {
              player.current = d;
            }}
          />
        </div>
      </div>
      {bar && (
        <div className={styles.loadBar}>
          <TabBar active={bar.active} variant={bar.variant} autoHide={false} />
        </div>
      )}
    </>
  );
});
