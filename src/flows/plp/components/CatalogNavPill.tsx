import { DotLottieReact, type DotLottie } from '@lottiefiles/dotlottie-react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useReduceMotion } from '../../../motion/reducedMotion';
import { forwardRef, useImperativeHandle, useRef, type ReactNode } from 'react';
import { haptic } from '../../../motion/haptics';
import { easing } from '../../../motion/presets';
import filterPillLottie from '@assets/lotties/filter-pill.lottie';
// the same Lottie with its stroke recoloured #475067 → #0F61FF (bappzaar FILTER_PILL_SELECTED_COLOR_FILTERS)
import filterPillLottieSelected from '@assets/lotties/filter-pill-selected.lottie';
import sortIcon from '@assets/plp/navpills/sort-icon-v2.webp';
import chevronDown from '@assets/icons/noon-chevron-down.webp';
import crossV2 from '@assets/plp/navpills/crossV2.webp';
import styles from './catalogNavPill.module.css';

/**
 * NoonCatalogListNavPill (bappzaar marketplaces/noon/components/NoonCatalogListNavPill, pill redesign), 1:1.
 * Kinds, all 30 high, r20, 1px border, 13 / 500 text:
 *   action  Filter / Sort (custom_filter / custom_sort): px 11, gap 6, 16 icon tinted blueGray700; selected → paleBlue
 *           border, 13 / 600 primaryBlue text + icon, Filter adds a 20 primaryBlue count bubble.
 *   facet   Deals / Brand / Price (filter: facets): px 11, gap 6, lightGrey border, 16 CMS icon, thin chevron 10 after;
 *           selected → paleBlue border, pr 5, primaryBlue text / icon / chevron, count bubble after the chevron.
 *   plain   brand / category quick pills: px 10, gap 6, slateBlueGray text; selected → r19 lavender border, pr 8,
 *           primaryBlue 13 / 600 text + 13 × 13 thin ✕.
 * Every press gives the heavy-impact haptic (HapticsView).
 */
export type NavPillKind = 'filter' | 'sort' | 'facet' | 'plain';

const tintBlue = 'var(--nk-palette-primary-blue)';
const tintIdle = 'var(--nk-palette-blue-gray700)';

/** a tinted bitmap icon (RN `tintColor`): the image as a mask over the tint colour */
function Tinted({ src, size, color, w, h }: { src: string; size?: number; color: string; w?: number; h?: number }) {
  const width = w ?? size;
  const height = h ?? size;
  return <span aria-hidden className={styles.tinted} style={{ width, height, background: color, WebkitMaskImage: `url(${src})`, maskImage: `url(${src})` }} />;
}

export interface CatalogNavPillHandle {
  /** the idle Filter pill's one-time attention animation (NoonFilterPillAnimation pulse + the filter-pill Lottie; no border stroke) */
  play: () => boolean;
}

export const CatalogNavPill = forwardRef<
  CatalogNavPillHandle,
  {
    kind: NavPillKind;
    label: ReactNode;
    selected?: boolean;
    count?: number;
    /** facet pills: CMS icon_active / icon_inactive */
    icon?: { active: string; inactive: string };
    onPress: () => void;
  }
>(function CatalogNavPill({ kind, label, selected = false, count = 0, icon, onPress }, ref) {
  const isAction = kind === 'filter' || kind === 'sort';
  const on = selected || count > 0;
  const idleFilter = kind === 'filter' && !on;
  const lottie = useRef<DotLottie | null>(null);
  const attn = useRef<FilterPillAttentionHandle>(null);
  const reduce = useReduceMotion();

  useImperativeHandle(ref, () => ({
    play: () => {
      // reduced motion: no attention pass (pulse or icon Lottie)
      if (!idleFilter || !attn.current || reduce) return false;
      attn.current.play();
      lottie.current?.play();
      return true;
    },
  }));

  const cls = [styles.pill, isAction && styles.action, kind === 'facet' && styles.facet, kind === 'plain' && styles.plain, on && styles.selected, idleFilter && styles.idleFilter]
    .filter(Boolean)
    .join(' ');

  const before =
    kind === 'filter' ? (
      <span className={styles.lottie}>
        <DotLottieReact
          key={on ? 'on' : 'idle'}
          src={on ? filterPillLottieSelected : filterPillLottie}
          autoplay={false}
          loop={false}
          speed={FILTER_PILL_LOTTIE_SPEED}
          dotLottieRefCallback={(d) => {
            lottie.current = d;
          }}
          style={{ width: 19, height: 19 }}
        />
      </span>
    ) : kind === 'sort' ? (
      <Tinted src={sortIcon} size={16} color={on ? tintBlue : tintIdle} />
    ) : kind === 'facet' && icon ? (
      on ? (
        <Tinted src={icon.active} size={16} color={tintBlue} />
      ) : (
        <img src={icon.inactive} alt="" width={16} height={16} className={styles.icon} />
      )
    ) : null;

  const after =
    kind === 'filter' ? (
      count > 0 ? (
        <span className={styles.bubble}>{count}</span>
      ) : null
    ) : kind === 'facet' ? (
      <>
        {on ? <Tinted src={chevronDown} w={10} h={10} color={tintBlue} /> : <img src={chevronDown} alt="" width={10} height={10} className={styles.icon} />}
        {count > 0 && <span className={styles.bubble}>{count}</span>}
      </>
    ) : kind === 'plain' && on ? (
      <Tinted src={crossV2} size={13} color={tintBlue} />
    ) : null;

  const pill = (
    <button
      type="button"
      className={cls}
      onClick={() => {
        haptic('snap'); // HapticsView IMPACT_HEAVY → closest kit kind
        onPress();
      }}
      aria-pressed={on || undefined}
    >
      {before}
      <span className={styles.text}>{label}</span>
      {after}
    </button>
  );
  return idleFilter ? <FilterPillAttention ref={attn}>{pill}</FilterPillAttention> : pill;
});

/* ── NoonFilterPillAnimation: 75 × 30 idle Filter pill — pulse + glass only, no travelling border stroke ─────── */
const DURATION = 4.5; // FILTER_PILL_ANIMATION_DURATION 4500
export const FILTER_PILL_LOTTIE_SPEED = 2 / DURATION;

interface FilterPillAttentionHandle {
  play: () => void;
}

const FilterPillAttention = forwardRef<FilterPillAttentionHandle, { children: ReactNode }>(function FilterPillAttention({ children }, ref) {
  const reduce = useReduceMotion();
  const attention = useMotionValue(0);
  const scale = useTransform(attention, (a) => 1 + a * 0.04);

  useImperativeHandle(ref, () => ({
    play: () => {
      if (reduce) return;
      // withDelay(396, sequence(440ms out-cubic → 1, 633ms in-out-cubic → 0))
      animate(attention, [0, 0, 1, 0], {
        duration: 0.396 + 0.44 + 0.633,
        times: [0, 0.396 / 1.469, (0.396 + 0.44) / 1.469, 1],
        ease: ['linear', easing.out, easing.inOut],
      });
    },
  }));

  return (
    <motion.span className={styles.attn} style={{ scale }}>
      {/* back: white pill, its 16-blur shadow and the glass gradient fade in with the pulse */}
      <span className={styles.back} aria-hidden>
        <motion.span className={styles.backShadow} style={{ opacity: attention }} />
        <span className={styles.backFill} />
        <motion.span className={styles.backGlass} style={{ opacity: attention }} />
      </span>
      {children}
    </motion.span>
  );
});
