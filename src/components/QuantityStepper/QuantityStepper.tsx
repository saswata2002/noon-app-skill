import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '../Icon/Icon';
import { Pressable } from '../Pressable/Pressable';
import { stepper as t } from '../../foundations/tokens';

/**
 * Quantity steppers used across the app.
 *  - `cart`  : NoonCartItemQuantitySelector — 92×36 white, 1px #DADCE3, r8, trash at qty 1
 *  - `filled`: NoonProductBoxAddToCart expanded — #3866DF, white icons, 16/700
 *  - `soft`  : wishlist ATC stepper — #EBF4FF, 1.2px #BDDBFF, #0F61FF
 * Values: `stepper` token group (src/foundations/tokens.ts).
 */
export function QuantityStepper({ value, onChange, max = 10, variant = 'cart', width, surface = true }: { value: number; onChange: (v: number) => void; max?: number; variant?: 'cart' | 'filled' | 'soft'; width?: number | string; /** false: no background or border (the host draws them, e.g. QuickAdd's morphing shell) */ surface?: boolean }) {
  const v = {
    cart: { bg: t.cartBg, border: t.cartBorder, color: t.cartFg, text: t.cartValueFg, w: t.cartWidth, font: t.cartFont },
    filled: { bg: t.filledBg, border: t.filledBorder, color: t.filledFg, text: t.filledValueFg, w: t.filledWidth, font: t.filledFont },
    soft: { bg: t.softBg, border: t.softBorder, color: t.softFg, text: t.softValueFg, w: t.softWidth, font: t.softFont },
  }[variant];
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: width ?? v.w,
        height: t.height,
        borderRadius: t.radius,
        background: surface ? v.bg : 'transparent',
        border: surface ? v.border : 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${t.paddingX}px`,
        color: v.color,
      }}
    >
      <Pressable onClick={() => onChange(value - 1)} aria-label="Decrease" style={{ display: 'flex', padding: t.buttonPadding, color: 'inherit' }}>
        <Icon name={value <= 1 ? 'trash' : 'minus'} size={t.iconSize} />
      </Pressable>
      <span style={{ position: 'relative', overflow: 'hidden', height: t.valueHeight, minWidth: t.valueMinWidth, textAlign: 'center', font: v.font, color: v.text }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={value} style={{ display: 'block' }} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.12 }}>
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
      <Pressable onClick={() => value < max && onChange(value + 1)} aria-label="Increase" style={{ display: 'flex', padding: t.buttonPadding, color: 'inherit', opacity: value >= max ? t.disabledOpacity : 1 }}>
        <Icon name="plus" size={t.iconSize} />
      </Pressable>
    </div>
  );
}
