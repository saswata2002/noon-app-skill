import { AnimatePresence, motion } from 'motion/react';
import { duration, easing, handoff } from '../../../motion/presets';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Lottie, MaskIcon, Pressable, Skeleton } from '../../../components';
import { icons, images, lotties } from '../assets';
import { t } from '../data';
import { addressMetrics } from '../tokens';
import { Img } from './primitives';
import styles from './map.module.css';
import { ref } from '../../../foundations/tokens';
import { palette } from '../../../foundations/palette';

/* ───────────────────────────── MapV2PinTooltip ───────────────────────────── */

/**
 * Pin + tooltip. Pin lifts -12px (150ms) while the map is moving and drops back when it settles.
 * Entering keyframe (MapCover.addressAnimation): scale .8/opacity 0 → 1.05 → 1 in 300ms.
 */
export function MapPin({ title, isError, isWarning, isMapDragging, pinScale }: { title: string; isError?: boolean; isWarning?: boolean; isMapDragging: boolean; pinScale: number }) {
  let tint = ref.color('bgSurface');
  if (isWarning) tint = 'var(--nk-color-addr-tooltip-warn-bg)';
  if (isError) tint = 'var(--nk-color-addr-tooltip-arrow-error)';
  return (
    <motion.div
      className={styles.pinAnchor}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: [0.8, 1.05, 1] }}
      transition={{ duration: duration.medium, times: [0, 0.6, 1], ease: easing.out }}
    >
      <motion.div className={styles.pinColumn} animate={{ scale: pinScale }} transition={handoff.spring} style={{ transformOrigin: '50% 100%' }}>
        {title ? (
          <motion.div key={title} className={styles.tooltipWrap} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ y: handoff.spring, opacity: { duration: handoff.fade.out, ease: handoff.easeOut } }}>
            <div className={styles.tooltip} data-error={!!isError} data-warning={!!isWarning}>
              <span className={styles.tooltipText}>{title}</span>
            </div>
            <MaskIcon src={icons.pinTooltipArrow} width={22} height={9} color={tint} className={styles.tooltipArrow} />
          </motion.div>
        ) : (
          <div className={styles.tooltipPlaceholder} />
        )}
        <motion.img
          src={icons.pin}
          alt=""
          draggable={false}
          className={styles.pin}
          style={{ width: addressMetrics.pinWidth, height: addressMetrics.pinHeight }}
          animate={{ y: isMapDragging ? addressMetrics.pinLift : 0 }}
          transition={handoff.spring}
        />
      </motion.div>
    </motion.div>
  );
}

/* ───────────────────────────── MapV2SearchButton ───────────────────────────── */

export function MapSearchButton({
  onBack,
  onPress,
  searchable,
  value,
  onChange,
  autoFocus,
  style,
}: {
  onBack?: () => void;
  onPress?: () => void;
  searchable?: boolean;
  value?: string;
  onChange?: (v: string) => void;
  autoFocus?: boolean;
  style?: CSSProperties;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, [autoFocus]);
  return (
    <div className={styles.searchButton} style={style}>
      {onBack && (
        <button type="button" className={styles.searchBack} onClick={onBack} aria-label="Back">
          <MaskIcon src={icons.chevronLeftBlack} width={24} height={24} color={ref.color('textInk')} />
        </button>
      )}
      <div className={styles.searchSub} onClick={onPress} role={searchable ? undefined : 'button'}>
        {searchable ? (
          <input ref={inputRef} className={styles.searchText} value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={t.address_v2_map_search_button} />
        ) : (
          <span className={`${styles.searchText} ${styles.searchTextStatic}`}>{t.address_v2_map_search_button}</span>
        )}
      </div>
      <span style={{ width: 24, display: 'flex', justifyContent: 'center' }}>
        <MaskIcon src={icons.locationSearch} width={14} height={14} color="var(--nk-color-text-muted)" />
      </span>
    </div>
  );
}

/* ───────────────────────────── AddressV2CurrentLocationButton ───────────────────────────── */

export function CurrentLocationButton({ onPress }: { onPress: () => void }) {
  return (
    <div className={styles.currentLocationContainer}>
      <Pressable className={styles.currentLocationButton} scale={0.97} onClick={onPress}>
        <span className={styles.currentLocationIcon}>
          <MaskIcon src={icons.crosshair} size={12} color="var(--nk-color-bg-inverse)" />
        </span>
        <span className={styles.currentLocationText}>{t.address_v2_use_current_location}</span>
      </Pressable>
    </div>
  );
}

/** Search-screen variant (isSearchScreen + isChevronForward). */
export function SearchCurrentLocationButton({ description, onPress, loading }: { description?: string; onPress: () => void; loading?: boolean }) {
  return (
    <button type="button" className={styles.searchLocateMe} onClick={onPress}>
      <span className={styles.searchLocateIcon}>
        <MaskIcon src={icons.crosshair} size={15} color="var(--nk-color-cta)" />
      </span>
      <span className={styles.searchLocateTexts}>
        {loading ? <Skeleton look="band" height={16} width="90%" /> : <span className={styles.searchLocateTitle}>{t.address_v2_use_search_current_location}</span>}
        {description && <span className={styles.searchLocateSub}>{description}</span>}
        {loading && <Skeleton look="band" height={16} width="90%" />}
      </span>
      <MaskIcon src={icons.chevronRightBlue} size={16} color="var(--nk-color-cta)" />
    </button>
  );
}

/** AddressV2LocateOnMapButton */
export function LocateOnMapButton({ onPress, style }: { onPress: () => void; style?: CSSProperties }) {
  return (
    <button type="button" className={styles.locateOnMap} style={style} onClick={onPress}>
      <span className={styles.locateOnMapRow}>
        <MaskIcon src={icons.locateOnMap} width={32} height={32} color="var(--nk-color-cta)" />
        <span className={styles.locateOnMapTextRow}>
          <span className={styles.locateOnMapText}>{t.address_v2_set_location_map}</span>
          <MaskIcon src={icons.chevronRightBlue} size={16} color="var(--nk-color-cta)" />
        </span>
      </span>
    </button>
  );
}

/* ───────────────────────────── LatLng location summary / loading / error ───────────────────────────── */

export function LocationSummary({ placeName, area, variant, onChangePress, style }: { placeName: string; area: string; variant: 'MAP' | 'SCANNED'; onChangePress?: () => void; style?: CSSProperties }) {
  const island = variant === 'SCANNED';
  return (
    <div className={styles.summary} data-variant={variant} style={style}>
      <div className={styles.summaryContent} data-padded={island} style={island ? { backgroundImage: `url(${images.pinIsland})` } : undefined}>
        <div className={styles.summaryLeft}>
          <Img src={icons.pin} width={24} height={24} />
          <div className={styles.summaryTexts}>
            <span className={styles.summaryTitle} data-variant={variant}>
              {placeName}
            </span>
            {area && (
              <span className={styles.summarySubtitle} data-variant={variant}>
                {area}
              </span>
            )}
          </div>
        </div>
        {onChangePress && (
          <button type="button" className={styles.changeButton} onClick={onChangePress}>
            {t.edit}
          </button>
        )}
      </div>
    </div>
  );
}

export function LocationLoading() {
  return (
    <div className={styles.loadingRow}>
      <div className={styles.loadingIcon}>
        <Img src={icons.pin} width={25} height={30} />
      </div>
      <div className={styles.loadingLines}>
        <Skeleton look="band" height={32} radius={8} />
        <Skeleton look="band" height={32} radius={8} />
      </div>
    </div>
  );
}

/** MapV2ScreenUnServiceableView */
export function UnserviceableView({ style }: { style?: CSSProperties }) {
  return (
    <div style={style}>
      <div className={styles.unserviceableRow}>
        <div className={styles.unserviceableIcon}>
          <Lottie src={lotties.locationError} loop size={32} />
        </div>
        <div className={styles.unserviceableTexts}>
          <span className={styles.unserviceableTitle}>{t.address_v2_unserviceable_title}</span>
          <span className={styles.unserviceableSub}>{t.address_v2_unserviceable_subtitle}</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── AddressV2FloatingOverlay ───────────────────────────── */

/** timing: the Test01 motion reference — fades on its S-curve, every movement on its spring */
const OPACITY_EASE = easing.inOut;
/** ThemeManager.metrics.screenHeight() on the 390 × 844 demo phone (slide-in start) */
const SCREEN_HEIGHT = 844;
const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: duration.base, ease: OPACITY_EASE } };

/**
 * Floating card 12px from the edges, radius 16, sitting on the home-indicator inset. Collapsed it shows the
 * location summary + fixed CTA; expanded it dims the map (rgba(0,0,0,.8)) and springs to the form height
 * (LinearTransition.springify mass 1 / stiffness 300 / damping 28). Fixed CTA fades out 700ms after expanding.
 */
export function FloatingOverlay({
  expanded,
  topContent,
  collapsedContent,
  expandedContent,
  fixedAction,
  onOverlayClose,
  closing,
  collapsedBg = palette.white, // animated (motion) → raw value
  expandedBg = palette.secondaryBackgroundColor,
  slideIn = false,
}: {
  expanded: boolean;
  topContent?: ReactNode;
  collapsedContent?: ReactNode;
  expandedContent?: ReactNode;
  fixedAction?: ReactNode;
  onOverlayClose?: () => void;
  /** closeWithZoomInAndFade (after a successful save) */
  closing?: boolean;
  collapsedBg?: string;
  expandedBg?: string;
  /** withSlideAnimation: the card springs up from below the screen (mass 0.75, stiffness 420, damping 30) and the scrim fades in */
  slideIn?: boolean;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const [fixedShown, setFixedShown] = useState(!!fixedAction);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    setHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  const hasFixedAction = !!fixedAction;
  useEffect(() => {
    if (!hasFixedAction) {
      setFixedShown(false);
      return;
    }
    if (expanded) {
      const timer = setTimeout(() => setFixedShown(false), 700);
      return () => clearTimeout(timer);
    }
    setFixedShown(true);
  }, [expanded, hasFixedAction]);

  const bg = expanded ? expandedBg : collapsedBg;

  return (
    <motion.div
      className={styles.overlay}
      animate={closing ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: duration.slow, ease: OPACITY_EASE }}
    >
      <motion.div
        className={styles.scrim}
        style={{ pointerEvents: expanded ? 'auto' : 'none' }}
        initial={slideIn ? { backgroundColor: palette.blackAlpha0 } : false}
        animate={{ backgroundColor: expanded ? palette.blackAlpha80 : palette.blackAlpha0 }}
        exit={slideIn ? { backgroundColor: palette.blackAlpha0 } : undefined}
        transition={{ duration: duration.medium, ease: OPACITY_EASE }}
        onClick={expanded ? onOverlayClose : undefined}
      />
      <AnimatePresence>
        {!expanded && topContent && (
          <motion.div key="top" className={styles.topContent} {...fade}>
            {topContent}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        className={styles.container}
        initial={slideIn ? { y: SCREEN_HEIGHT } : false}
        animate={{
          y: 0,
          height,
          backgroundColor: bg,
          ...(closing ? { scaleY: 1.35, marginLeft: 0, marginRight: 0 } : { scaleY: 1 }),
        }}
        // slideIn: leaves the way it came in (back down below the screen) when the screen is popped
        exit={slideIn ? { y: SCREEN_HEIGHT } : undefined}
        style={{ transformOrigin: 'bottom' }}
        transition={{
          height: handoff.spring,
          y: handoff.spring,
          backgroundColor: { duration: duration.medium, ease: OPACITY_EASE },
          scaleY: { duration: duration.slow, ease: OPACITY_EASE },
          marginLeft: { duration: duration.slow, ease: OPACITY_EASE },
          marginRight: { duration: duration.slow, ease: OPACITY_EASE },
        }}
      >
        <div ref={innerRef} className={styles.inner}>
          <AnimatePresence initial={false} mode="popLayout">
            {expanded ? (
              <motion.div key="expanded" className={styles.expanded} {...fade}>
                {expandedContent}
              </motion.div>
            ) : (
              <motion.div key="collapsed" {...fade} initial={false}>
                {collapsedContent}
                {fixedShown && <div style={{ height: addressMetrics.fixedActionHeight }} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <AnimatePresence>
        {fixedShown && fixedAction && (
          <motion.div key="fixed" className={styles.fixedAction} {...fade} style={{ backgroundColor: bg }}>
            {fixedAction}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
