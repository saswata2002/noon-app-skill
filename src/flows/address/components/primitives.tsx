import type { CSSProperties, ReactNode } from 'react';
import { handoff } from '../../../motion/presets';
import { Pressable, Spinner, Toast } from '../../../components';
import { addressStore, useAddressStore } from '../store';
import styles from './primitives.module.css';
import { ref } from '../../../foundations/tokens';

/** Plain `<Image resizeMode="contain">`. */
export function Img({ src, width, height, style, className }: { src: string; width?: number; height?: number; style?: CSSProperties; className?: string }) {
  return <img alt="" src={src} width={width} height={height} className={className} style={{ objectFit: 'contain', flexShrink: 0, display: 'block', ...style }} draggable={false} />;
}

/**
 * AddressV2OverlayButton — 56px accent CTA, radius 12, press scale 0.96 (spring 300/20/0.5),
 * grey ($grayColor) when disabled, white loader while submitting.
 */
export function OverlayButton({ title, onPress, disabled, loading, style }: { title: string; onPress?: () => void; disabled?: boolean; loading?: boolean; style?: CSSProperties }) {
  return (
    <Pressable
      className={styles.overlayButton}
      data-disabled={disabled || loading ? 'true' : undefined}
      scale={disabled || loading ? 1 : 0.96}
      transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.5 }}
      onClick={disabled || loading ? undefined : onPress}
      style={style}
    >
      {loading ? <Spinner variant="ios" color={ref.color('textInverse')} /> : <span className={styles.overlayButtonText}>{title}</span>}
    </Pressable>
  );
}

/** MapV2GradientTitle — section caption in noonGrey1. */
export function GradientTitle({ title, style }: { title: string; style?: CSSProperties }) {
  return (
    <div className={styles.gradientTitle} style={style}>
      {title}
    </div>
  );
}

/** Inline hit-slop button used for small icon actions. */
export function IconTap({ children, onPress, label, disabled }: { children: ReactNode; onPress: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={styles.iconTap}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onPress();
      }}
    >
      {children}
    </button>
  );
}

const TOAST_DURATION = 3000;

/**
 * AddressToastScreen — black pill at safeAreaBottom + 40 (+16 wrapper padding), springs up from 50px,
 * holds 3s, springs back down. Rendered by each address screen; driven by `addressStore.toast()`.
 */
export function AddressToastHost() {
  const toast = useAddressStore((s) => s.toast);
  return (
    <Toast
      item={toast}
      duration={TOAST_DURATION + 400}
      onHide={(t) => addressStore.clearToast(t.id)}
      layerClassName={styles.toastRoot}
      className={styles.toastWrapper}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ y: handoff.spring, opacity: { duration: handoff.fade.out, ease: handoff.easeOut } }}
    >
      {(t) => <div className={styles.toast}>{t.message}</div>}
    </Toast>
  );
}
