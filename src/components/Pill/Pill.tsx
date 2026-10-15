import { motion } from 'motion/react';
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import { OriginIcon } from '../Icon/OriginIcon';
import type { OriginIconName } from '../Icon/originIcons';
import { Pressable } from '../Pressable/Pressable';
import { pill as t } from '../../foundations/tokens';
import { fieldMotion, spring } from '../../motion/presets';
import { useReduceMotion } from '../../motion/reducedMotion';
import styles from './Pill.module.css';

type PillVariant = 'nav' | 'tag' | 'filter' | 'fieldChip';

/**
 * PLP nav pill / filter chip / tag chip (NoonCatalogListNavPill redesign):
 * 30h, r20, 1px #EAECF0, 13/500 #475067 → selected #D6E9FF border, 13/600 #0F61FF.
 *
 * `variant="fieldChip"` is the opt-in Field DS M-FilterChip (`@field-ds/components` FilterChip/FilterChip.tsx, Figma
 * 1391:41, content="label"): 36h, r8, padding 8/10, A14 SemiBold, 16px Origin icons (leading `preferences`, trailing
 * `caret-down`), border/subtle. `selected` = Field "added": border/extrabold, "(count)" and a divider + × clear zone
 * that slides in from −12px; the × is its own target (`onClear`). Pressed bg surface/secondary; `disabled` bg
 * surface/secondary + text muted. The default ↔ added morph runs 320ms (colour easeInOut, width + slide loft).
 */
export function Pill({
  children,
  selected,
  onPress,
  icon,
  count,
  dropdown,
  removable,
  size = 'md',
  variant = 'nav',
  onClear,
  disabled,
  fieldIcon = 'preferences',
  fieldTrailingIcon = 'caret-down',
  clearLabel = 'Clear filters',
}: {
  children: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  /** number (nav/tag/filter: count bubble; fieldChip: "(n)") or a pre-formatted string; hidden when 0 / empty */
  count?: number | string;
  /** trailing chevron; fieldChip shows its caret unless `dropdown={false}` */
  dropdown?: boolean;
  removable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** nav = PLP pill, tag = home tag chip (r32, 14px), filter = filter-sheet option (r8, 2px border), fieldChip = Field M-FilterChip */
  variant?: PillVariant;
  /** fieldChip: the × clear target shown while `selected` (stops propagation, so `onPress` does not fire) */
  onClear?: () => void;
  /** fieldChip: surface/secondary bg, muted text, no presses */
  disabled?: boolean;
  /** fieldChip leading Origin icon (`null` hides it); ignored when `icon` is set */
  fieldIcon?: OriginIconName | null;
  /** fieldChip trailing Origin icon (`null` hides it) */
  fieldTrailingIcon?: OriginIconName | null;
  /** fieldChip: accessible name of the × */
  clearLabel?: string;
}) {
  if (variant === 'fieldChip') {
    return (
      <FieldChip
        selected={!!selected}
        disabled={!!disabled}
        onPress={onPress}
        onClear={onClear}
        icon={icon}
        fieldIcon={fieldIcon}
        trailingIcon={dropdown === false ? null : fieldTrailingIcon}
        count={count}
        clearLabel={clearLabel}
      >
        {children}
      </FieldChip>
    );
  }
  return (
    <Pressable className={`${styles.pill} ${styles[variant]} ${styles[size]}`} data-selected={selected || undefined} onClick={onPress} scale={t.pressScale}>
      {icon && <Icon name={icon} size={t.iconSize} />}
      <span>{children}</span>
      {!!count && (
        <motion.span key={count} className={styles.count} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={spring.bouncy}>
          {count}
        </motion.span>
      )}
      {dropdown && <Icon name="chevronDown" size={t.dropdownIconSize} />}
      {removable && selected && <Icon name="close" size={t.removeIconSize} />}
    </Pressable>
  );
}

/** Field FilterChip constants (FILTER_CHIP_COUNT_MAX_W / CLEAR_ZONE_W / CLEAR_TRANSLATE_FROM, ICON_SIZE). */
const FIELD_COUNT_MAX_W = 160;
const FIELD_CLEAR_ZONE_W = 40;
const FIELD_CLEAR_FROM = -12;
const FIELD_ICON = 16;

function FieldChip({
  children,
  selected,
  disabled,
  onPress,
  onClear,
  icon,
  fieldIcon,
  trailingIcon,
  count,
  clearLabel,
}: {
  children: ReactNode;
  selected: boolean;
  disabled: boolean;
  onPress?: () => void;
  onClear?: () => void;
  icon?: IconName;
  fieldIcon: OriginIconName | null;
  trailingIcon: OriginIconName | null;
  count?: number | string;
  clearLabel: string;
}) {
  const reduce = useReduceMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [rtl, setRtl] = useState(false);
  useLayoutEffect(() => {
    if (rootRef.current) setRtl(getComputedStyle(rootRef.current).direction === 'rtl');
  }, []);

  const added = selected && !disabled;
  const countText = typeof count === 'number' ? (count > 0 ? `(${count})` : '') : (count ?? '');
  const d = reduce ? 0 : fieldMotion.duration.xl;
  const fade = { duration: d, ease: fieldMotion.ease.easeInOut };
  const shape = { duration: d, ease: fieldMotion.ease.loft };

  return (
    <div
      ref={rootRef}
      className={styles.fieldChip}
      data-selected={added || undefined}
      data-disabled={disabled || undefined}
      style={{ '--nk-field-chip-duration': `${d}s` } as CSSProperties}
    >
      <Pressable
        className={styles.fieldBody}
        scale={1}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : onPress}
      >
        {icon ? (
          <Icon name={icon} size={FIELD_ICON} className={styles.fieldLead} />
        ) : (
          fieldIcon && <OriginIcon name={fieldIcon} size={FIELD_ICON} color="currentColor" className={styles.fieldLead} />
        )}
        <span>{children}</span>
        <motion.span
          className={styles.fieldCount}
          initial={false}
          animate={{ opacity: added ? 1 : 0, maxWidth: added ? FIELD_COUNT_MAX_W : 0, marginInlineStart: added ? 4 : 0 }}
          transition={{ opacity: fade, maxWidth: shape, marginInlineStart: shape }}
          aria-hidden={!added || undefined}
        >
          {countText}
        </motion.span>
        {trailingIcon && <OriginIcon name={trailingIcon} size={FIELD_ICON} color="currentColor" className={styles.fieldTrail} />}
      </Pressable>
      <motion.span
        className={styles.fieldClearZone}
        initial={false}
        animate={{ opacity: added ? 1 : 0, maxWidth: added ? FIELD_CLEAR_ZONE_W : 0, x: added ? 0 : FIELD_CLEAR_FROM * (rtl ? -1 : 1) }}
        transition={{ opacity: fade, maxWidth: shape, x: shape }}
        aria-hidden={!added || undefined}
      >
        <span className={styles.fieldDivider} />
        <Pressable
          className={styles.fieldClear}
          scale={1}
          disabled={!added}
          tabIndex={added ? undefined : -1}
          aria-label={clearLabel}
          onClick={(e) => {
            e.stopPropagation();
            (onClear ?? onPress)?.();
          }}
        >
          <OriginIcon name="cross" size={FIELD_ICON} color="currentColor" />
        </Pressable>
      </motion.span>
    </div>
  );
}

export function PillRow({ children, padding = t.rowPadding }: { children: ReactNode; padding?: number }) {
  return (
    <div className="nk-hscroll" style={{ gap: t.rowGap, paddingInline: padding, alignItems: 'center' }}>
      {children}
    </div>
  );
}
