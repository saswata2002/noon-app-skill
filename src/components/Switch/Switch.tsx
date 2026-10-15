import { motion, useReducedMotion, useSpring, useTransform, type Transition } from 'motion/react';
import { useEffect, type CSSProperties } from 'react';
import styles from './Switch.module.css';
import { field, ref } from '../../foundations/tokens';
import { duration, easing, fieldMotion, handoff } from '../../motion/presets';

export interface SwitchProps {
  value: boolean;
  /** omit when the switch sits inside another button (`as="span"`) */
  onChange?: (value: boolean) => void;
  label?: string;
  /** track width (default 37 = react-native-switch barHeight 20 × 1.85 + insets) */
  width?: number;
  /** track height (default 20) */
  height?: number;
  /** knob diameter (default 16) */
  knob?: number;
  /** knob inset from the track edge (default 2) */
  inset?: number;
  onColor?: string;
  offColor?: string;
  knobColor?: string;
  /** knob slide transition (motion) */
  transition?: Transition;
  /** track colour transition (CSS `transition` value) */
  colorTransition?: string;
  /** `span` = purely visual, for a switch inside a larger pressable row */
  as?: 'button' | 'span';
  className?: string;
  style?: CSSProperties;
  /** `'field'` = Field DS M-Toggle (sizes 16/20/24, spring + knob stretch, press scale, disabled look).
   *  Ignores width / height / knob / inset / colours / transitions. Omit for the bappzaar switch. */
  variant?: 'field';
  /** Field toggle height: 16 compact · 20 standard (default) · 24 prominent */
  size?: 16 | 20 | 24;
  /** blocks `onChange`; with `variant="field"` also the disabled colours */
  disabled?: boolean;
}

/**
 * Toggle switch: bappzaar `react-native-switch` / `components/PaymentSwitchV2`. Mirrors itself in RTL.
 *
 * Configurations in use (pass the props, values are 1:1 with the RN configs):
 *   - account (react-native-switch circle 16, bar 20, ×2.3, inset 2): defaults
 *     `onColor="var(--nk-color-text-primary)" offColor="#EAECF0"`
 *   - cards PaymentSwitchV2 md/dark: `width={34} onColor="#0E0E0E" offColor="#CCCCCC"`, 150ms easeInOutQuad
 *   - checkout credits (circle 15, ×2.5): `width={37.5} knob={15}`, `#0076FF` / `#CED1DA`, spring.press
 *
 * `variant="field"`: Field DS M-Toggle (`packages/components/src/Toggle/Toggle.tsx`). Sizes 16 (28×16, knob 12) ·
 * 20 (34×20, knob 16, default) · 24 (42×24, knob 20), inset 2, fully rounded. Track on surfaceSecondaryInverted
 * #1D2539, off surfaceMuted #EAECF0 (on = muted too when disabled); knob white (surfaceTertiary disabled). Knob slides on
 * `fieldMotion.spring.springLight` and stretches to ×1.3 width mid-slide; the track scales to 0.98 while pressed.
 * Reduced motion snaps.
 */
export function Switch(props: SwitchProps) {
  if (props.variant === 'field') return <FieldToggle {...props} />;
  return <ClassicSwitch {...props} />;
}

function ClassicSwitch({
  value,
  onChange,
  label,
  width = 37,
  height = 20,
  knob = 16,
  inset = 2,
  onColor = ref.color('textPrimary'),
  offColor = ref.color('border'),
  knobColor = ref.color('bgSurface'),
  transition = handoff.spring,
  colorTransition = `background-color ${duration.base}s cubic-bezier(${easing.inOut.join(', ')})`,
  as = 'button',
  className,
  style,
  disabled,
}: SwitchProps) {
  const track: CSSProperties = { width, height, borderRadius: height / 2, background: value ? onColor : offColor, transition: colorTransition, ...style };
  const handle = (
    <motion.span
      className={styles.knob}
      style={{ top: (height - knob) / 2, left: inset, width: knob, height: knob, background: knobColor }}
      initial={false}
      animate={{ x: value ? width - knob - inset * 2 : 0 }}
      transition={transition}
    />
  );
  const cls = [styles.track, className].filter(Boolean).join(' ');
  if (as === 'span') {
    return (
      <span className={cls} style={track} aria-hidden>
        {handle}
      </span>
    );
  }
  return (
    <button type="button" role="switch" aria-checked={value} aria-label={label} className={cls} style={track} disabled={disabled} onClick={() => onChange?.(!value)}>
      {handle}
    </button>
  );
}

const FIELD_TOGGLE = {
  16: { w: 28, h: 16, knob: 12 },
  20: { w: 34, h: 20, knob: 16 },
  24: { w: 42, h: 24, knob: 20 },
} as const;
const FIELD_INSET = 2;
/** Field THUMB_PEAK_W_MULT: the knob widens as it travels, then returns to a circle */
const FIELD_KNOB_STRETCH = 1.3;

function FieldToggle({ value, onChange, label, size = 20, disabled = false, as = 'button', className, style }: SwitchProps) {
  const cfg = FIELD_TOGGLE[size];
  const travel = cfg.w - FIELD_INSET * 2 - cfg.knob;
  const reduced = useReducedMotion();
  const progress = useSpring(value ? 1 : 0, fieldMotion.spring.springLight);
  useEffect(() => {
    if (reduced) progress.jump(value ? 1 : 0);
    else progress.set(value ? 1 : 0);
  }, [value, reduced, progress]);
  const x = useTransform(progress, (p: number) => p * travel);
  const width = useTransform(progress, [0, 0.5, 1], [cfg.knob, cfg.knob * FIELD_KNOB_STRETCH, cfg.knob], { clamp: true });
  const onOpacity = useTransform(progress, [0, 1], [0, 1], { clamp: true });

  const track: CSSProperties = { width: cfg.w, height: cfg.h, borderRadius: cfg.h / 2, background: field.surfaceMuted, ...style };
  const inner = (
    <span className={styles.fieldFlip} aria-hidden>
      {/* on colour fades in with the spring progress (Field interpolates the track colour) */}
      <motion.span className={styles.fieldOn} style={{ opacity: onOpacity, background: disabled ? field.surfaceMuted : field.surfaceSecondaryInverted }} />
      <motion.span
        className={styles.knob}
        style={{ top: FIELD_INSET, left: FIELD_INSET, height: cfg.knob, width, x, borderRadius: cfg.knob / 2, background: disabled ? field.surfaceTertiary : field.surfacePrimary, boxShadow: field.shadowSm }}
      />
    </span>
  );
  const cls = [styles.fieldTrack, className].filter(Boolean).join(' ');
  if (as === 'span') {
    return (
      <span className={cls} style={track} aria-hidden>
        {inner}
      </span>
    );
  }
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      disabled={disabled}
      className={cls}
      style={track}
      whileTap={disabled ? undefined : { scale: fieldMotion.pressScale }}
      transition={reduced ? { duration: 0 } : fieldMotion.spring.springLight}
      onClick={() => {
        if (!disabled) onChange?.(!value);
      }}
    >
      {inner}
    </motion.button>
  );
}
