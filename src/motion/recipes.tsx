import { AnimatePresence, animate, motion, useInView, useMotionValue, useTransform, type AnimationPlaybackControls, type HTMLMotionProps } from 'motion/react';
import { Children, useEffect, useRef, useState, type CSSProperties, type Key, type ReactNode } from 'react';
import { duration, easing, handoff, spring } from './presets';
import { palette } from '../foundations/palette';
import { useReduceMotion } from './reducedMotion';

export { useReduceMotion } from './reducedMotion';

/**
 * Drop-in animation recipes for prototypes. Wrap any element:
 *   <FadeIn delay={0.2}>…</FadeIn>   <Stagger>{items}</Stagger>   <CountUp to={1299} />
 * All timings come from ./presets so the whole kit shares one motion language.
 *
 * Reduced motion (`useReduceMotion`, set by `<NoonPrototype reducedMotion>`): motion/react already drops transform /
 * layout movement for the declarative recipes (fades stay). The imperative or looping ones handle it here:
 * CountUp lands on `to`, ShimmerText holds still, Confetti doesn't fire, SpringPager settles without the spring.
 */

export function FadeIn({ children, delay = 0, y = 12, ...rest }: { children: ReactNode; delay?: number; y?: number } & HTMLMotionProps<'div'>) {
  return (
    <motion.div initial={{ opacity: 0, y }} animate={{ opacity: 1, y: 0 }} transition={{ duration: duration.medium, ease: easing.out, delay }} {...rest}>
      {children}
    </motion.div>
  );
}

/** Staggers children in, Test01 style: rise 16px on the Test01 spring, 60ms apart, fast-start fade-in (183ms). */
export function Stagger({ children, gap = handoff.stagger.in, y = 16, max = 8, className, style }: { children: ReactNode; gap?: number; y?: number; max?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={style}>
      {Children.map(children, (c, i) => (
        <motion.div initial={i < max ? { opacity: 0, y } : false} animate={{ opacity: 1, y: 0 }} transition={{ y: { ...handoff.spring, delay: Math.min(i, max) * gap }, opacity: { duration: handoff.fade.out, ease: handoff.easeOut, delay: Math.min(i, max) * gap } }}>
          {c}
        </motion.div>
      ))}
    </div>
  );
}

/** Reveal when scrolled into view. */
export function Reveal({ children, y = 20 }: { children: ReactNode; y?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: duration.slow, ease: easing.out }}>
      {children}
    </motion.div>
  );
}

/** Bouncy pop-in (badges, success ticks). */
export function Pop({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring.bouncy, delay }} style={{ display: 'inline-flex' }}>
      {children}
    </motion.div>
  );
}

/** Animated number (prices, savings, counters). */
export function CountUp({ to, from = 0, durationS = 0.9, format = (n: number) => Math.round(n).toLocaleString('en-US') }: { to: number; from?: number; durationS?: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(from);
  const text = useTransform(mv, format);
  const reduce = useReduceMotion();
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      mv.set(to);
      return;
    }
    const c = animate(mv, to, { duration: durationS, ease: easing.out });
    return () => c.stop();
  }, [inView, to, durationS, mv, reduce]);
  return <motion.span ref={ref}>{text}</motion.span>;
}

/** Text shimmer sweep (checkout "Slide to Order" label, AI summary titles). */
export function ShimmerText({ children, base = palette.kitBlue66, highlight = palette.kitBlue91, durationS = 4 }: { children: ReactNode; base?: string; highlight?: string; durationS?: number }) {
  const reduce = useReduceMotion();
  return (
    <motion.span
      style={{
        backgroundImage: `linear-gradient(90deg, ${base} 30%, ${highlight} 50%, ${base} 70%)`,
        backgroundSize: '300% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        // reduced motion: hold the band off the text (plain `base` colour)
        ...(reduce ? { backgroundPosition: '100% 0' } : null),
      }}
      animate={reduce ? undefined : { backgroundPosition: ['100% 0', '0% 0'] }}
      transition={{ duration: durationS, repeat: Infinity, ease: 'linear' }}
    >
      {children}
    </motion.span>
  );
}

/** Confetti burst — trigger by changing `fireKey`. */
export function Confetti({ fireKey, count = 28, colors = [palette.yellowColor, palette.primaryBlue, palette.pink600, palette.greenOff, palette.absoluteApricot] }: { fireKey: number | string; count?: number; colors?: string[] }) {
  const [pieces, setPieces] = useState<{ id: string; x: number; y: number; r: number; c: string }[]>([]);
  const reduce = useReduceMotion();
  useEffect(() => {
    // reduced motion: no burst (the pieces would only sit and fade); the success state carries the meaning
    if (!fireKey || reduce) return;
    setPieces(
      Array.from({ length: count }, (_, i) => ({
        id: `${fireKey}-${i}`,
        x: (Math.random() - 0.5) * 320,
        y: -120 - Math.random() * 220,
        r: Math.random() * 540 - 270,
        c: colors[i % colors.length],
      })),
    );
    const t = setTimeout(() => setPieces([]), 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireKey]);
  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%', pointerEvents: 'none', zIndex: 999 }}>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 420], rotate: p.r, opacity: [1, 1, 0] }}
          transition={{ duration: 1.5, ease: 'easeOut', times: [0, 0.35, 1] }}
          style={{ position: 'absolute', width: 8, height: 12, borderRadius: 2, background: p.c }}
        />
      ))}
    </div>
  );
}

/** Gentle infinite float (empty states, mascots). */
export function Float({ children, amplitude = 8, durationS = 3 }: { children: ReactNode; amplitude?: number; durationS?: number }) {
  return (
    <motion.div animate={{ y: [0, -amplitude, 0] }} transition={{ duration: durationS, repeat: Infinity, ease: 'easeInOut' }}>
      {children}
    </motion.div>
  );
}

/* ── Handoff recipes (noon search → PLP, github.com/saswata2002/Brand-Widget-PLP) ───────────────────── */

/**
 * Crossfade a value in place: the old content lifts `shift`px, blurs and fades out on the handoff S-curve
 * (160ms); the new one rises into place on the ease-out (260ms, 40ms behind). Key it by the value.
 * Used by search suggestion rows while typing.
 */
export function BlurSwap({ swapKey, children, delay = 0, shift = 5, blur = 2, className, style }: { swapKey: Key; children: ReactNode; delay?: number; shift?: number; blur?: number; className?: string; style?: CSSProperties }) {
  return (
    <span className={className} style={{ position: 'relative', display: 'block', minWidth: 0, ...style }}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={swapKey}
          style={{ display: 'block', minWidth: 0 }}
          initial={{ opacity: 0, y: shift, filter: `blur(${blur}px)` }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.26, ease: handoff.easeOut, delay: delay + 0.04 } }}
          exit={{ opacity: 0, y: -shift, filter: `blur(${blur}px)`, transition: { duration: 0.16, ease: handoff.easeInOut, delay } }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * Content rising out of its own skeleton (PLP cards): the content rises `rise`px on the handoff spring with
 * the ease-out fade, and the skeleton under it fades `skeletonAfter`s later on the S-curve. `loading`
 * dissolves the content back into the skeleton (180ms) — flip it off again to replay the rise.
 * `animateIn={false}` renders settled (below-the-fold items).
 */
export function SkeletonReveal({ skeleton, children, delay = 0, loading = false, animateIn = true, rise = 16, skeletonAfter = 0.353, style }: { skeleton: ReactNode; children: ReactNode; delay?: number; loading?: boolean; animateIn?: boolean; rise?: number; skeletonAfter?: number; style?: CSSProperties }) {
  // the skeleton leaves the DOM once it has faded out (a grid otherwise keeps an invisible copy of every card) and
  // comes back, fading in, when `loading` turns on again
  const [gone, setGone] = useState(!animateIn && !loading);
  const hidden = useRef(gone);
  if (loading && gone) setGone(false);
  if (gone) hidden.current = true;
  return (
    <div style={{ position: 'relative', ...style }}>
      {!gone && (
        <motion.div
          aria-hidden
          style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
          initial={{ opacity: animateIn && !hidden.current ? 1 : 0 }}
          animate={{ opacity: loading ? 1 : 0 }}
          transition={loading ? { duration: handoff.fade.out, ease: handoff.easeOut } : { duration: handoff.fade.io, ease: handoff.easeInOut, delay: animateIn ? delay + skeletonAfter : 0 }}
          onAnimationComplete={() => !loading && setGone(true)}
        >
          {skeleton}
        </motion.div>
      )}
      <motion.div
        style={{ position: 'relative' }}
        initial={animateIn ? { opacity: 0, y: rise } : false}
        animate={{ opacity: loading ? 0 : 1, y: 0 }}
        transition={loading ? { opacity: { duration: 0.18, ease: handoff.easeInOut } } : { y: { ...handoff.spring, delay }, opacity: { duration: handoff.fade.out, ease: handoff.easeOut, delay } }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Snappy horizontal pager with a slight elastic (the PLP brand rail):
 * · drag follows the finger 1:1, axis-locked after 6px (vertical scrolls pass through: touch-action pan-y)
 * · past either end it rubber-bands with iOS's curve c·(1 − 1/(x·0.55/c + 1))
 * · release pages ONE step in the flick direction (≥ 220 px/s), otherwise to the nearest page; the last
 *   page is the track's end, not a card edge
 * · settles on `handoff.springs.pager` seeded with the release velocity; a new touch catches it mid-flight
 * · trackpad / wheel swipes move 1:1 and page once the gesture pauses; ← → page when focused
 * A drag never fires the click underneath it.
 */
export function SpringPager({ children, step, onPage, className, style, trackClassName, trackStyle, label }: { children: ReactNode; step: number; onPage?: (page: number, pages: number) => void; className?: string; style?: CSSProperties; trackClassName?: string; trackStyle?: CSSProperties; label?: string }) {
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const tx = useTransform(x, (v) => -v);
  // a ref: the wheel listener below keeps the first render's closures
  const reduce = useRef(false);
  reduce.current = useReduceMotion();
  const s = useRef({ page: 0, anim: null as AnimationPlaybackControls | null, drag: null as null | { id: number; x0: number; y0: number; s0: number; lock: 'x' | 'y' | null; page: number; samples: [number, number][]; moved: boolean } });

  const view = () => railRef.current?.clientWidth ?? 0;
  const max = () => Math.max(0, (trackRef.current?.scrollWidth ?? 0) - view());
  const pages = () => {
    const m = max();
    const out: number[] = [];
    for (let p = 0; p < m - 24; p += step) out.push(p);
    out.push(m);
    return out;
  };
  const rubber = (o: number) => {
    const c = view() || 1;
    return c * (1 - 1 / ((Math.abs(o) * 0.55) / c + 1)) * Math.sign(o);
  };
  const setPage = (i: number) => {
    if (i !== s.current.page) {
      s.current.page = i;
      onPage?.(i, pages().length);
    }
  };
  const settle = (target: number, velocity = 0) => {
    s.current.anim?.stop();
    // reduced motion: land on the page at once (the drag itself still follows the finger)
    if (reduce.current) {
      s.current.anim = null;
      x.set(target);
      return;
    }
    s.current.anim = animate(x, target, { ...handoff.springs.pager, velocity });
  };
  const snap = (vel: number) => {
    const P = pages();
    const cur = x.get();
    let i = P.reduce((b, p, k) => (Math.abs(p - cur) < Math.abs(P[b] - cur) ? k : b), 0);
    if (Math.abs(vel) >= 220) i = Math.max(0, Math.min(P.length - 1, (s.current.drag?.page ?? s.current.page) + Math.sign(vel)));
    setPage(i);
    settle(P[i], vel);
  };

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let wv = 0;
    let last = 0;
    let t: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (e: WheelEvent) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!d) return;
      e.preventDefault();
      s.current.anim?.stop();
      const now = performance.now();
      wv = (d / Math.max(8, now - last)) * 1000;
      last = now;
      const m = max();
      const cur = x.get();
      x.set(Math.max(-view() * 0.25, Math.min(m + view() * 0.25, cur + d * (cur < 0 || cur > m ? 0.35 : 1))));
      clearTimeout(t);
      t = setTimeout(() => snap(Math.abs(wv) > 600 ? Math.sign(wv) * 400 : 0), 90);
    };
    rail.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      rail.removeEventListener('wheel', onWheel);
      clearTimeout(t);
      s.current.anim?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div
      ref={railRef}
      className={className}
      tabIndex={0}
      role="region"
      aria-label={label}
      style={{ overflow: 'hidden', touchAction: 'pan-y', userSelect: 'none', cursor: 'grab', outline: 'none', ...style }}
      // the track moves by transform only: undo the browser scrolling the clip (focus / scroll-into-view of a card)
      onScroll={(e) => {
        e.currentTarget.scrollLeft = 0;
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        s.current.anim?.stop();
        s.current.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, s0: x.get(), lock: null, page: s.current.page, samples: [[e.timeStamp, e.clientX]], moved: false };
      }}
      onPointerMove={(e) => {
        const d = s.current.drag;
        if (!d || e.pointerId !== d.id) return;
        const dx = e.clientX - d.x0;
        const dy = e.clientY - d.y0;
        if (!d.lock) {
          if (Math.hypot(dx, dy) < 6) return;
          d.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
          if (d.lock === 'y') {
            s.current.drag = null;
            return;
          }
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        d.moved = true;
        const raw = d.s0 - dx;
        const m = max();
        x.set(raw < 0 ? rubber(raw) : raw > m ? m + rubber(raw - m) : raw);
        d.samples.push([e.timeStamp, e.clientX]);
        if (d.samples.length > 6) d.samples.shift();
      }}
      onPointerUp={(e) => {
        const d = s.current.drag;
        if (!d || e.pointerId !== d.id) return;
        if (!d.moved) {
          s.current.drag = null;
          return;
        }
        // release velocity from the last ~80ms of samples (px/s, in track direction)
        const S = d.samples;
        const now = S[S.length - 1];
        const a = S.find((p) => now[0] - p[0] <= 80) ?? S[0];
        const vel = now[0] > a[0] ? -((now[1] - a[1]) / (now[0] - a[0])) * 1000 : 0;
        snap(Math.max(-4000, Math.min(4000, vel)));
        s.current.drag = null;
        const swallow = (ce: Event) => {
          ce.stopPropagation();
          ce.preventDefault();
        };
        e.currentTarget.addEventListener('click', swallow, { capture: true, once: true });
        const el = e.currentTarget;
        setTimeout(() => el.removeEventListener('click', swallow, { capture: true }), 0);
      }}
      onPointerCancel={() => {
        if (s.current.drag?.moved) snap(0);
        s.current.drag = null;
      }}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const P = pages();
        const i = Math.max(0, Math.min(P.length - 1, s.current.page + (e.key === 'ArrowRight' ? 1 : -1)));
        setPage(i);
        settle(P[i]);
      }}
    >
      <motion.div ref={trackRef} className={trackClassName} style={{ display: 'flex', width: 'max-content', x: tx, ...trackStyle }}>
        {children}
      </motion.div>
    </div>
  );
}
