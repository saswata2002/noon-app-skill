import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent, type ReactNode } from 'react';
import { easing, fieldMotion, handoff } from '../../motion/presets';
import { Pressable } from '../Pressable/Pressable';
import { OriginIcon } from '../Icon/OriginIcon';
import searchIcon from '@assets/icons/noon-search-bar.webp';
import cameraIcon from '@assets/icons/noon-search-bar-camera.webp';
// bappzaar NoonThemeManager.icons.back() / ThemeManager.icons.clearInput() (@3x)
import backIcon from '@assets/shared/search-bar/back.webp';
import clearIcon from '@assets/shared/search-bar/clear-input.webp';
import { field, searchBar as t } from '../../foundations/tokens';
import styles from './SearchBar.module.css';

/**
 * The rotating hint ("Search for “<word>”") is one shared value per word list: every bar showing that list shows the
 * same word (the home bar and the search page's field after the bar flies into it, src/kit/searchMorph.ts), and it
 * holds still while `holdSearchHints(true)` is on (a bar in flight); the next word comes a full interval after release.
 */
const HINT_INTERVAL = 2200;
const hintIndex = new Map<string, number>();
let hintHold = false;
const hintSubs = new Set<() => void>();
const hintSubscribe = (f: () => void) => {
  hintSubs.add(f);
  return () => hintSubs.delete(f);
};
const hintEmit = () => hintSubs.forEach((f) => f());
/** freeze every rotating search hint (on while a search bar flies between screens) */
export function holdSearchHints(on: boolean) {
  if (hintHold === on) return;
  hintHold = on;
  hintEmit();
}
/** the current word of a shared rotating hint; `active` bars advance it every HINT_INTERVAL unless held */
function useHintIndex(words: readonly string[] | undefined, active: boolean): number {
  const key = words?.join('\u0001') ?? '';
  const i = useSyncExternalStore(hintSubscribe, () => hintIndex.get(key) ?? 0);
  const held = useSyncExternalStore(hintSubscribe, () => hintHold);
  const n = words?.length ?? 0;
  useEffect(() => {
    if (n < 2 || !active || held) return;
    const t = window.setTimeout(() => {
      hintIndex.set(key, ((hintIndex.get(key) ?? 0) + 1) % n);
      hintEmit();
    }, HINT_INTERVAL);
    return () => window.clearTimeout(t);
  }, [key, n, i, active, held]);
  return n ? i % n : 0;
}

/** "<prefix> <word>" with the word on the vertical ticker (ease-out-back) */
function HintTicker({ prefix, words, index }: { prefix?: string; words: readonly string[]; index: number }) {
  return (
    <>
      {prefix ? <>{prefix}&nbsp;</> : null}
      <span className={styles.ticker}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={index}
            className={styles.word}
            initial={{ y: t.tickerHeight, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -t.tickerHeight, opacity: 0 }}
            transition={{ duration: 0.45, ease: easing.backOut }}
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  );
}

/**
 * Home search pill (NoonSearchBarButton): 52h, r12, 1px #D7DAE3, 20px search-bar.webp, 24px search-bar-camera.webp.
 * `rotatingWords` reproduces the "Search <word>" vertical ticker (30px rows, ease-out-back); `rotatingPrefix` changes "Search".
 *
 * `variant="2025"` (opt-in, Homepage Revamp 2025, Figma iRE9RwO94eMAyW3j3XKNXW · 1337:6727): lighter 1px gray400 border,
 * 15/18 Medium placeholder in textProduct, 18 search icon 4 from the text, 12 gaps to a 24 divider and a 20 camera.
 * Pass the Figma artwork through `icons` (search / camera / divider); defaults are unchanged.
 */
export function SearchBarButton({
  onPress,
  placeholder = 'What are you looking for?',
  rotatingWords,
  rotatingPrefix = 'Search',
  camera = true,
  height = t.height,
  variant = 'default',
  icons,
  tickerActive = true,
}: {
  /** gets the click, so a caller can hand the bar element on (`openSearch(nav, e.currentTarget)` morphs it into the search page) */
  onPress?: (e: MouseEvent<HTMLElement>) => void;
  placeholder?: string;
  rotatingWords?: string[];
  rotatingPrefix?: string;
  camera?: boolean;
  height?: number;
  variant?: 'default' | '2025';
  icons?: { search?: string; camera?: string; divider?: string };
  /** advance the rotating words (pass false while the bar's screen is covered, e.g. `useIsTop()`) */
  tickerActive?: boolean;
}) {
  const v2025 = variant === '2025';
  // NoonSearchBarButton: 20 × 20 search-bar.webp, 24 × 24 search-bar-camera.webp. The 2025 variant keeps those
  // sizes when it shows the bappzaar artwork; Figma artwork passed through `icons` renders at the Figma 18 / 20.
  const iconSize = v2025 && icons?.search ? 18 : t.iconSize;
  const cameraSize = v2025 && icons?.camera ? 20 : t.cameraSize;
  const i = useHintIndex(rotatingWords, tickerActive);

  return (
    <Pressable
      className={`${styles.bar}${v2025 ? ` ${styles.v2025}` : ''}`}
      style={{ height }}
      onClick={onPress}
      scale={t.pressScale}
      // what the bar shows, for a search page it flies into (src/kit/searchMorph.ts)
      data-hint-prefix={rotatingWords?.length ? rotatingPrefix : ''}
      data-hint-words={JSON.stringify(rotatingWords?.length ? rotatingWords : [placeholder])}
    >
      <span className={styles.lead}>
      <img src={icons?.search ?? searchIcon} alt="" width={iconSize} height={iconSize} />
      <span className={styles.placeholder}>
        {rotatingWords?.length ? <HintTicker prefix={rotatingPrefix} words={rotatingWords} index={i} /> : placeholder}
      </span>
      </span>
      {camera && (
        <>
          {icons?.divider ? (
            <span className={styles.dividerArt}>
              <img src={icons.divider} alt="" width={24} height={1} />
            </span>
          ) : (
            <span className={styles.divider} />
          )}
          <img src={icons?.camera ?? cameraIcon} alt="" width={cameraSize} height={cameraSize} />
        </>
      )}
    </Pressable>
  );
}

/**
 * Editable search field (NoonSearchScreen): 52h, r12, 1px #DFDFDF, back icon inside.
 * `fill` plays the "picked suggestion" fill: the text before `from` holds, the rest fades in where it will stay
 * (opacity only, 300ms ease-out; re-run it by changing `key`). `onFieldPress` makes the field a read-only button
 * (the PLP's search bar: tapping it goes back to editing) and keeps the camera instead of the clear (x).
 */
export interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  onBack?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  right?: ReactNode;
  onSubmit?: (v: string) => void;
  onFieldPress?: () => void;
  fill?: { from: number; key: number };
  /**
   * The query is being submitted (a suggestion was picked): the clear (x) crossfades into the camera the results bar
   * shows, so the PLP's identical bar takes over without the icon popping. Default look only.
   */
  committed?: boolean;
  /**
   * Default look: a rotating hint in place of `placeholder` while the field is empty — the same shared words as the
   * SearchBarButton it came from (`SearchBarButton` `rotatingWords`), drawn in its type (`--nk-search-hint-*`).
   */
  hint?: { prefix?: string; words: readonly string[] };
  /** advance the hint's words (default true) */
  hintActive?: boolean;
  /** `field`: Field DS M-SearchBar look (opt-in); `default` (NoonSearchScreen) is unchanged */
  variant?: 'default' | 'field';
  /** field variant: `H48` (padding 12, 24 icons, B14 Medium, default) · `H44` (padding 10 / 12, 20 icons, B12 Medium) */
  fieldSize?: 'H48' | 'H44';
  /** field variant: Sm elevation shadow */
  elevation?: boolean;
  /** field variant: leading icon; default Origin `search` (or a back arrow with `onBack`); `null` removes it */
  iconLeft?: ReactNode | null;
  /** field variant: first trailing icon (default: `right`; the clear (x) replaces it while typing unless set) */
  iconRight?: ReactNode;
  /** field variant: second trailing icon, after a 1 × 24 borderSubtle divider */
  iconRightTwo?: ReactNode;
}

/** how long the picked suggestion's text takes to fade in (s); the search page hands over to results only after it */
export const SEARCH_FILL_FADE = 0.276; // Test01 long fade-in

/** the handoff "picked suggestion" fill, shared by both SearchInput looks */
function useFill(value: string, fill?: { from: number; key: number }) {
  // derived in render, not set in an effect: the new value and the fill copy land in the SAME paint (an effect turned
  // the copy on one frame late, so the full text flashed at full ink, vanished and then faded in: the flicker)
  const [doneKey, setDoneKey] = useState<number>();
  const filling = !!fill && fill.key !== doneKey && fill.from < value.length;
  useEffect(() => {
    if (!fill) return;
    const key = fill.key;
    const t = setTimeout(() => setDoneKey(key), SEARCH_FILL_FADE * 1000 + 60); // the fade + a frame of slack (also when the tab is in the background)
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fill?.key]);
  return filling;
}

function FillCopy({ value, fill }: { value: string; fill: { from: number; key: number } }) {
  return (
    <span className={styles.fillCopy} aria-hidden>
      <span>{value.slice(0, fill.from)}</span>
      {/* the picked text fades in where it will stay: opacity only, no movement */}
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: SEARCH_FILL_FADE, ease: handoff.easeOut }}>
        {value.slice(fill.from)}
      </motion.span>
    </span>
  );
}

/**
 * Editable search field. Default: NoonSearchScreen (52h, r12, back icon inside). `variant="field"` (opt-in): Field DS
 * M-SearchBar (`@field-ds/components` SearchBar/SearchBar.tsx, Figma 892:244) — H48 (padding 12, 24px icons, B14
 * Medium) or H44 (padding 10 / 12, 20px icons, B12 Medium), surfacePrimary, 1px borderSubtle, r12, gap 8, optional Sm
 * `elevation`, Origin `search` icon (Field tertiary → primary once focused or typed), `iconRight` + `iconRightTwo`
 * after a 1 × 24 divider, auto clear (x) while typing, placeholder Field textPrimary at rest / textTertiary focused,
 * press scale .98 over 160ms. `fill`, `onFieldPress`, `onBack`, `onSubmit` work in both looks.
 */
export function SearchInput(props: SearchInputProps) {
  return props.variant === 'field' ? <FieldSearchInput {...props} /> : <KitSearchInput {...props} />;
}

function KitSearchInput({
  value,
  onChange,
  onBack,
  autoFocus,
  placeholder = 'What are you looking for?',
  right,
  onSubmit,
  onFieldPress,
  fill,
  committed,
  hint,
  hintActive = true,
}: SearchInputProps) {
  const filling = useFill(value, fill);
  const hintAt = useHintIndex(hint?.words, hintActive && !value);
  const hintText = hint ? `${hint.prefix ? `${hint.prefix} ` : ''}${hint.words[hintAt] ?? ''}` : undefined;
  const showClear = !!value && !onFieldPress && !committed;
  return (
    <div className={`${styles.bar} ${styles.input}`}>
      {onBack && (
        <Pressable onClick={onBack} aria-label="Back" style={{ display: 'flex' }}>
          {/* NoonSearchBarBackButton: back.webp at 20 × 20 */}
          <img src={backIcon} alt="" width={20} height={20} className={styles.flipRtl} />
        </Pressable>
      )}
      <span className={styles.fieldWrap}>
        <input
          className={styles.field}
          value={value}
          placeholder={hint ? '' : placeholder}
          aria-label={hintText}
          autoFocus={autoFocus}
          readOnly={!!onFieldPress}
          onClick={onFieldPress}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit?.(value)}
          style={filling ? { color: 'transparent' } : undefined}
        />
        {filling && fill && <FillCopy value={value} fill={fill} />}
        {hint && !value && (
          <span className={styles.hintOverlay} aria-hidden>
            <HintTicker prefix={hint.prefix} words={hint.words} index={hintAt} />
          </span>
        )}
      </span>
      {/* clear (x) ⇄ camera share one end-aligned slot and crossfade, so swapping them never moves either */}
      <span className={styles.trail}>
        <AnimatePresence initial={false}>
          {showClear ? (
            <motion.span key="clear" className={styles.trailItem} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: handoff.fade.out, ease: handoff.easeOut }}>
              <Pressable onClick={() => onChange('')} aria-label="Clear" style={{ display: 'flex' }}>
                {/* NoonSearchBar clearIcon: clear-input.webp at its 18 × 18 size */}
                <img src={clearIcon} alt="" width={18} height={18} />
              </Pressable>
            </motion.span>
          ) : (
            <motion.span key="camera" className={styles.trailItem} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: handoff.fade.out, ease: handoff.easeOut }}>
              {/* NoonSearchBarImageSearchButton: search-bar-camera.webp at 24 × 24 */}
              {right ?? <img src={cameraIcon} alt="" width={24} height={24} />}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </div>
  );
}

function FieldSearchInput({
  value,
  onChange,
  onBack,
  autoFocus,
  placeholder = 'What are you looking for?',
  right,
  onSubmit,
  onFieldPress,
  fill,
  fieldSize = 'H48',
  elevation,
  iconLeft,
  iconRight,
  iconRightTwo,
}: SearchInputProps) {
  const filling = useFill(value, fill);
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const icon = fieldSize === 'H44' ? 20 : 24;
  const active = focused || !!value;
  const lead =
    iconLeft === null ? null : iconLeft !== undefined ? (
      iconLeft
    ) : onBack ? (
      <Pressable onClick={onBack} aria-label="Back" style={{ display: 'flex' }}>
        <OriginIcon name="arrow-left" size={icon} color={field.textPrimary} className={styles.flipRtl} />
      </Pressable>
    ) : (
      <OriginIcon name="search" size={icon} color={active ? field.textPrimary : field.textTertiary} />
    );
  const showClear = iconRight === undefined && !!value && !onFieldPress;
  const trail = showClear ? (
    <Pressable
      onClick={() => {
        onChange('');
        inputRef.current?.focus();
      }}
      aria-label="Clear search"
      style={{ display: 'flex' }}
    >
      <OriginIcon name="cross" size={icon} color={field.textTertiary} />
    </Pressable>
  ) : (
    iconRight ?? right
  );
  const slot = { width: icon, height: icon };
  return (
    <motion.div
      className={`${styles.fieldBar}${elevation ? ` ${styles.fieldElevated}` : ''}`}
      data-size={fieldSize}
      data-focused={focused || undefined}
      whileTap={{ scale: fieldMotion.pressScale }}
      transition={{ duration: fieldMotion.duration.sm, ease: fieldMotion.ease.standard }}
      onClick={() => inputRef.current?.focus()}
    >
      {lead != null && (
        <span className={styles.fieldSlot} style={slot}>
          {lead}
        </span>
      )}
      <span className={styles.fieldWrap}>
        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          className={`${styles.field} ${styles.fieldInput}`}
          value={value}
          placeholder={placeholder}
          aria-label={placeholder}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect="off"
          readOnly={!!onFieldPress}
          onClick={onFieldPress}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit?.(value)}
          style={filling ? { color: 'transparent' } : undefined}
        />
        {filling && fill && <FillCopy value={value} fill={fill} />}
      </span>
      {trail != null && (
        <span className={styles.fieldSlot} style={slot}>
          {trail}
        </span>
      )}
      {iconRightTwo != null && (
        <>
          <span className={styles.fieldDivider} />
          <span className={styles.fieldSlot} style={slot}>
            {iconRightTwo}
          </span>
        </>
      )}
    </motion.div>
  );
}
