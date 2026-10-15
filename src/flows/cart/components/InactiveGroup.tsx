import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { HtmlText, ProductImage, Spinner } from '../../../components';
import { useDemoStore, type CartLine } from '../../../kit/DemoStore';
import { useNav } from '../../../kit/Navigator';
import { duration, easing, handoff } from '../../../motion/presets';
import moveToWishlistIcon from '@assets/cart/move-to-wishlist.webp';
import trashNew from '@assets/cart/trash-new.svg?raw';
import copy from '@assets/cart/copy.svg?raw';
import chevronRight from '@assets/cart/chevron-right.svg?raw';
import infoIcon from '@assets/cart/info-circle-filled.webp';
import { inactiveCallout, inactiveHeader, t } from '../data';
import html from './html.module.css';
import styles from './inactive.module.css';

const raw = (svg: string, color: string, size: number) => ({ __html: svg.replace('<svg ', `<svg style="width:${size}px;height:${size}px;color:${color}" `) });

/**
 * NoonCartInactiveGroup (secondary_groups → inactive): 1px newBorderColor r12 box (margin 8 / 12 from the
 * screen), gradient header (icon 20, 16/700 title in titleColor, chevron toggle), items 80×109 r6 with the HTML
 * title, red reason callout, a trash button and the "Wishlist" / "Find Similar" buttons (min-height 32, r6, 12px).
 * Collapsed = a horizontal strip of images only. Images are NOT dimmed (NoonSalesImage isOverlay = faint black overlay, which ProductImage already draws).
 */
export function InactiveGroup({ onMovedToWishlist }: { onMovedToWishlist: (line: CartLine) => void }) {
  const { inactiveCart } = useDemoStore();
  const [collapsed, setCollapsed] = useState(inactiveHeader.isCollapsed);
  if (!inactiveCart.length) return null;
  const colors = inactiveHeader.colors;
  return (
    <div className={styles.container}>
      <div className={styles.header} style={{ background: colors.length > 1 ? `linear-gradient(180deg, ${colors.join(', ')})` : colors[0] }}>
        <span className={styles.headerContent}>
          <img src={infoIcon} alt="" className={styles.headerIcon} />
          <span className={styles.headerTitle} style={{ color: inactiveHeader.titleColor }}>
            {inactiveHeader.title}
          </span>
        </span>
        {(collapsed || inactiveHeader.shouldShowToggle) && (
          <button type="button" className={styles.chevron} onClick={() => setCollapsed((v) => !v)} aria-label={collapsed ? 'Expand' : 'Collapse'}>
            <span style={{ display: 'flex', transform: `rotate(${collapsed ? 90 : -90}deg)` }} dangerouslySetInnerHTML={{ __html: chevronRight.replace('<svg ', `<svg style="width:24px;height:24px;fill:${inactiveHeader.titleColor}" `) }} />
          </button>
        )}
      </div>
      <div className={styles.itemsWrapper}>
        {collapsed ? (
          <button type="button" className={styles.collapsed} onClick={() => setCollapsed(false)}>
            {inactiveCart.map((l) => (
              <ProductImage key={l.product.id} product={l.product} width={80} height={109} radius={6} />
            ))}
          </button>
        ) : (
          <div className={styles.items}>
            <AnimatePresence initial={false}>
              {inactiveCart.map((l, i) => (
                <motion.div key={l.product.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0, transition: { ...handoff.spring, opacity: { duration: duration.medium, ease: easing.inOut } } }} transition={{ ...handoff.spring, opacity: { duration: duration.medium, ease: easing.out } }} style={{ overflow: 'hidden' }}>
                  {i > 0 && <div className={styles.separator} />}
                  <InactiveItem line={l} onMovedToWishlist={onMovedToWishlist} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function InactiveItem({ line, onMovedToWishlist }: { line: CartLine; onMovedToWishlist: (line: CartLine) => void }) {
  const nav = useNav();
  const { removeInactive, moveToWishlist } = useDemoStore();
  const [deleting, setDeleting] = useState(false);
  const [wishing, setWishing] = useState(false);
  const p = line.product;
  return (
    <div className={styles.item} onClick={() => nav.push('pdp/detail', { productId: p.id })} role="link">
      <ProductImage product={p} width={80} height={109} radius={6} />
      <div className={styles.details}>
        <div className={styles.topSection}>
          <div className={styles.info}>
            <HtmlText base value={`<b>${p.brand}</b> ${p.title}`} lines={2} className={html.item} />
            <HtmlText base value={`<red>${inactiveCallout}</red>`} className={styles.reason} />
          </div>
          <button
            type="button"
            className={styles.deleteButton}
            onClick={(e) => {
              e.stopPropagation();
              setDeleting(true);
              window.setTimeout(() => removeInactive(p.id), 450);
            }}
            aria-label="Remove"
          >
            {deleting ? <Spinner size={14} thickness={14 / 9} duration={0.7} color="var(--nk-color-text-ink)" /> : <span dangerouslySetInnerHTML={raw(trashNew, 'var(--nk-color-text-ink)', 14)} style={{ display: 'flex' }} />}
          </button>
        </div>
        <div className={styles.buttons}>
          <button
            type="button"
            className={`${styles.button} ${styles.secondary}`}
            onClick={(e) => {
              e.stopPropagation();
              setWishing(true);
              window.setTimeout(() => {
                moveToWishlist(p.id);
                onMovedToWishlist(line);
              }, 550);
            }}
          >
            {wishing ? (
              <Spinner size={14} thickness={14 / 9} duration={0.7} color="var(--nk-color-text-ink)" />
            ) : (
              <>
                <img src={moveToWishlistIcon} alt="" className={styles.buttonIcon} />
                {t.wishlist}
              </>
            )}
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={(e) => {
              e.stopPropagation();
              nav.push('plp/listing');
            }}
          >
            <span dangerouslySetInnerHTML={raw(copy, 'var(--nk-color-bg-surface)', 17)} style={{ display: 'flex' }} />
            {t.findSimilar}
          </button>
        </div>
      </div>
    </div>
  );
}
