import type { CSSProperties, ReactNode } from 'react';
import { layout } from '../foundations/tokens';
import styles from './PhoneFrame.module.css';

/**
 * iPhone-sized screen (390×844): square corners, no bezel, no island, no status bar or home indicator. The safe-area
 * insets (--nk-inset-top / --nk-inset-bottom) are kept so screens lay out as on a device. `statusBar` and `time` are
 * accepted for API compatibility but draw nothing. `frameless` renders the bare viewport.
 */
export function PhoneFrame({ children, frameless, scale = 1 }: { children: ReactNode; statusBar?: 'dark' | 'light'; frameless?: boolean; scale?: number; time?: string }) {
  const vars = {
    '--nk-inset-top': `${layout.statusBar}px`,
    '--nk-inset-bottom': `${layout.homeIndicator}px`,
    width: layout.deviceWidth,
    height: layout.deviceHeight,
  } as CSSProperties;
  return (
    <div className={frameless ? styles.frameless : styles.device} style={{ transform: scale !== 1 ? `scale(${scale})` : undefined }}>
      <div className={styles.viewport} style={vars}>
        {children}
      </div>
    </div>
  );
}
