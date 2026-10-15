import { motion, type HTMLMotionProps } from 'motion/react';
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { Lottie, Spinner } from '../../../components';
import { ref } from '../../../foundations/tokens';
import { duration, easing, handoff } from '../../../motion/presets';
import { lotties } from '../assets';
import { mb, membershipMotion as m } from '../tokens';
import { ChevronLeftRounded } from './icons';
import styles from './primitives.module.css';

/**
 * VIPButton — Pressable that scales 1 → 0.97 (withTiming 100ms in / 200ms out) and fires onPress after 200ms
 * (`setTimeout(onPress, 200)`). `loading` swaps the label for the white Loader.
 */
export function VipButton({
  onPress,
  disabled,
  loading,
  before,
  after,
  children,
  className,
  style,
  ...rest
}: { onPress?: () => void; loading?: boolean; before?: ReactNode; after?: ReactNode; children?: ReactNode } & Omit<HTMLMotionProps<'button'>, 'children' | 'onClick'>) {
  return (
    <motion.button
      type="button"
      className={[styles.vipButton, className].filter(Boolean).join(' ')}
      style={style}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: m.pressScale, transition: { duration: m.pressIn } }}
      transition={{ duration: m.pressOut }}
      onClick={() => {
        if (disabled || loading || !onPress) return;
        window.setTimeout(onPress, m.pressDelay);
      }}
      {...rest}
    >
      {!loading && before}
      {loading ? <Spinner size={20} color={ref.palette('white')} /> : children}
      {!loading && after}
    </motion.button>
  );
}

/**
 * VIPDashedBorder — rounded rects `strokeWidth` long every `strokeSpacing`, `strokeHeight` tall (rx = h/2).
 * Every master use on these screens is (5, 8, 1, surfaceMuted #EAECF0).
 */
export function DashedLine({ strokeWidth = 5, strokeSpacing = 8, strokeHeight = 1, color = ref.color('border'), style }: { strokeWidth?: number; strokeSpacing?: number; strokeHeight?: number; color?: string; style?: CSSProperties }) {
  const id = useId();
  return (
    <svg className={styles.dashed} height={strokeHeight} width="100%" style={style} aria-hidden>
      <defs>
        <pattern id={id} width={strokeSpacing} height={strokeHeight} patternUnits="userSpaceOnUse">
          <rect width={strokeWidth} height={strokeHeight} rx={strokeHeight / 2} fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height={strokeHeight} fill={`url(#${id})`} />
    </svg>
  );
}

/** Rounded back button used by every full-screen VIP page: 40×40 white circle, 1px surfaceTertiary border, chevron 9×18. */
export function VipBackButton({ onPress, className, style, label = 'Back' }: { onPress: () => void; className?: string; style?: CSSProperties; label?: string }) {
  return (
    <motion.button type="button" aria-label={label} className={[styles.back, className].filter(Boolean).join(' ')} style={style} whileTap={{ opacity: 0.2 }} onClick={onPress}>
      <ChevronLeftRounded className={styles.backIcon} />
    </motion.button>
  );
}

/** "→" chevron used on manage rows: chevron-left-rounded 7×12 rotated 180° (0° in RTL). */
export function RowChevron({ className }: { className?: string }) {
  return <ChevronLeftRounded width={7} height={12} className={[styles.rowChevron, className].filter(Boolean).join(' ')} />;
}

const memberColors = ['mbMember0', 'mbMember1', 'mbMember2', 'mbMember3', 'mbMember4'] as const;
/** VIPPlanMemberColors[index % 5] as a CSS var */
export const memberColor = (i: number) => mb.color(memberColors[i % memberColors.length]);

/** ManageFamilyMembersSection avatar: circle in VIPPlanMemberColors[i], 1.5px borderPrimary ring, white bold initial. */
export function MemberAvatar({ name, index, size = 40 }: { name: string; index: number; size?: number }) {
  const initial = name?.trim()?.[0]?.toUpperCase() || '?';
  return (
    <span className={styles.avatar} style={{ width: size, height: size, background: memberColor(index) }}>
      {initial}
    </span>
  );
}

const HEXAGON_PATH =
  'M15 1.05664C16.0256 1.05664 16.9964 1.3274 18.1514 1.85059C19.3014 2.37156 20.651 3.1512 22.4307 4.17871L22.8096 4.39648C24.5895 5.42412 25.9396 6.20392 26.9658 6.93945C27.9962 7.678 28.7157 8.38335 29.2285 9.27148C29.7413 10.1597 29.9928 11.1357 30.1172 12.3975C30.241 13.6539 30.2402 15.2125 30.2402 17.2676V17.7051C30.2402 19.7601 30.241 21.3187 30.1172 22.5752C29.9928 23.837 29.7413 24.813 29.2285 25.7012C28.7158 26.5893 27.9962 27.2947 26.9658 28.0332C25.9396 28.7687 24.5895 29.5485 22.8096 30.5762L22.4307 30.7939C20.651 31.8215 19.3014 32.6011 18.1514 33.1221C16.9964 33.6453 16.0256 33.916 15 33.916C13.9744 33.916 13.0036 33.6453 11.8486 33.1221C10.6986 32.6011 9.34904 31.8215 7.56934 30.7939L7.19043 30.5762C5.41051 29.5485 4.06044 28.7687 3.03418 28.0332C2.00377 27.2947 1.28425 26.5893 0.771484 25.7012C0.258687 24.813 0.0071924 23.837 -0.117188 22.5752C-0.241027 21.3187 -0.240234 19.7601 -0.240234 17.7051V17.2676C-0.240234 15.2125 -0.241037 13.6539 -0.117188 12.3975C0.00719442 11.1357 0.25867 10.1597 0.771484 9.27148C1.28426 8.38335 2.00376 7.678 3.03418 6.93945C4.06044 6.20392 5.41051 5.42412 7.19043 4.39648L7.56934 4.17871C9.34904 3.1512 10.6986 2.37156 11.8486 1.85059C13.0036 1.3274 13.9744 1.05664 15 1.05664Z';

/** VIPMemberInitialHexagon — 64×62 default, fill #FED2D2, text #C45C5C, white 0.8 stroke, font = width / 2.3. */
export function MemberHexagon({
  initial,
  width = 64,
  height = 62,
  background = mb.color('mbHexagonBg'),
  color = mb.color('mbHexagonText'),
  border = ref.palette('white'),
  borderWidth = 0.8,
  style,
}: {
  initial: string;
  width?: number;
  height?: number;
  background?: string;
  color?: string;
  border?: string;
  borderWidth?: number;
  style?: CSSProperties;
}) {
  const letter = (initial || '').trim().charAt(0).toUpperCase();
  return (
    <span className={styles.hexagon} style={{ width, height, ...style }}>
      <svg width={width} height={height} viewBox="0 0 30 35" aria-hidden>
        <path d={HEXAGON_PATH} fill={background} stroke={border} strokeWidth={borderWidth} vectorEffect="non-scaling-stroke" />
      </svg>
      <span className={styles.hexagonText} style={{ color, fontSize: width / 2.3 }}>
        {letter}
      </span>
    </span>
  );
}

const SUCCESS_MS = 4000;
const FADE_OUT_MS = Math.round(duration.slower * 1000); // the layer fade (Test01 slower)
const FADE_OUT_DELAY = 200;

/**
 * VIPTransitionAnim (success) — full-screen vip-landing-success-animation Lottie over the page; at 70% / 72.5% of 4s the
 * title (24/800, -0.4) and subtitle (15/500, -0.14) fade in while rising 60px (450ms, Easing.out(sin)); then the
 * whole layer fades out (500ms, delay 200) and the page content springs back (stiffness 80) via `onContentReturn`.
 */
export function SuccessAnim({ title, subtitle, rtl, onContentReturn, onComplete }: { title?: string; subtitle?: string; rtl?: boolean; onContentReturn?: () => void; onComplete: () => void }) {
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setFading(true);
      onContentReturn?.();
    }, SUCCESS_MS + FADE_OUT_DELAY);
    const t2 = window.setTimeout(onComplete, SUCCESS_MS + FADE_OUT_DELAY + FADE_OUT_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // title / subtitle rise on the Test01 spring and fade in on its ease-out
  const rise = (delay: number) => ({ y: { ...handoff.spring, delay }, opacity: { duration: duration.slow, ease: easing.out, delay } });
  return (
    <motion.div className={styles.anim} initial={{ opacity: 1 }} animate={{ opacity: fading ? 0 : 1 }} transition={{ duration: duration.slower, ease: easing.inOut }}>
      <Lottie src={rtl ? lotties.landingSuccessAnimationAr : lotties.landingSuccessAnimation} style={{ width: '100%', height: '100%' }} />
      {(title || subtitle) && (
        <div className={styles.animText}>
          {title && (
            <motion.span className={styles.animTitle} initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -60 }} transition={rise((SUCCESS_MS * 0.7) / 1000)}>
              {title}
            </motion.span>
          )}
          {subtitle && (
            <motion.span className={styles.animSubtitle} initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -60 }} transition={rise((SUCCESS_MS * 0.725) / 1000)}>
              {subtitle}
            </motion.span>
          )}
        </div>
      )}
    </motion.div>
  );
}
