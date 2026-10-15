import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useToastsEnabled } from '../../kit/Navigator';

export interface ToastProps<T> extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** the toast being shown (null = hidden). A new item (by key) restarts the timer and re-animates. */
  item: T | null | undefined;
  /** key of an item (default `item.id`) */
  itemKey?: (item: T) => string | number;
  /** ms from appearing until `onHide(item)` is called */
  duration: number;
  onHide: (item: T) => void;
  /** optional always-mounted positioning layer around the animated toast */
  layerClassName?: string;
  children: (item: T) => ReactNode;
}

/**
 * Self-dismissing toast / snackbar host (bappzaar `src/components/Toast`, `NoonSnackBar`, `AddressToastScreen`):
 * mounts `item` with AnimatePresence, calls `onHide(item)` after `duration`, and animates out when the item clears.
 * The look and motion come from the caller (className + initial/animate/exit/transition), e.g.
 *   - checkout voucher toast: fade 500ms linear, 2.5s
 *   - address toast: spring up from y 50, 3.4s
 *   - cart move-to-wishlist snackbar: spring from y 100%, 3s
 * For a plain message toast use `useNav().toast(message)` instead. With the Navigator's `toasts={false}` it draws
 * nothing but keeps its timer (`onHide` still fires after `duration`), so the caller's flow is unchanged.
 */
export function Toast<T>({ item, itemKey = (i) => (i as { id: string | number }).id, duration, onHide, layerClassName, children, ...motionProps }: ToastProps<T>) {
  const hide = useRef(onHide);
  hide.current = onHide;
  const enabled = useToastsEnabled();
  useEffect(() => {
    if (!item) return;
    const timer = window.setTimeout(() => hide.current(item), duration);
    return () => window.clearTimeout(timer);
  }, [item, duration]);
  if (!enabled) return null;
  const content = (
    <AnimatePresence>
      {item && (
        <motion.div key={itemKey(item)} {...motionProps}>
          {children(item)}
        </motion.div>
      )}
    </AnimatePresence>
  );
  return layerClassName ? <div className={layerClassName}>{content}</div> : content;
}
