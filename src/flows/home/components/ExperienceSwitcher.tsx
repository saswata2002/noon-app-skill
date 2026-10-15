import { motion } from 'motion/react';
import { Pressable } from '../../../components';
import { useNav } from '../../../kit/Navigator';
import { experiences, type Experience } from '../data';
import { switcherMetrics } from '../tokens';
import { easing } from '../../../motion/presets';
import styles from '../home.module.css';

const { itemWidth, itemHeight, collapsedItemHeight, itemPadding, collapsedItemPadding, itemRadius, collapsedItemRadius, duration } = switcherMetrics;
const transition = { duration, ease: easing.out } as const; // Easing.out(Easing.quad) → Test01 ease-out

/**
 * ExperienceSwitcher (src/components/ExperienceSwitcher + ExperienceSwitcherItem + useExperienceSwitcher).
 * Horizontal row of marketplace tiles above the home header. Expanded: square tiles with the full logo.
 * Collapsed (scrolled ≥100): tiles shrink to width/2.2 with the compact logo, radius 20 → 12 (bappzaar useExperienceSwitcher).
 */
export function ExperienceSwitcher({ expanded, selected = 'noon' }: { expanded: boolean; selected?: string }) {
  return (
    <div className={`${styles.switcher} nk-hscroll`}>
      {experiences.map((e) => (
        <SwitcherItem key={e.key} experience={e} expanded={expanded} isSelected={e.key === selected} />
      ))}
    </div>
  );
}

function SwitcherItem({ experience: e, expanded, isSelected }: { experience: Experience; expanded: boolean; isSelected: boolean }) {
  const nav = useNav();
  const logo = isSelected ? e.selectedImage : e.image;
  const compact = isSelected ? e.selectedImageCompact : e.imageCompact;
  return (
    <Pressable
      className={styles.switcherItem}
      onClick={() => !isSelected && nav.toast(`Switch to ${e.name}`)}
      aria-label={e.name}
      aria-current={isSelected || undefined}
      style={{ width: itemWidth, minHeight: collapsedItemHeight }}
    >
      <motion.div
        initial={false}
        animate={{ height: expanded ? itemHeight : collapsedItemHeight, borderRadius: expanded ? itemRadius : collapsedItemRadius }}
        transition={transition}
        className={styles.switcherItemInner}
        style={isSelected ? { background: e.bkgColor } : undefined}
      >
        <motion.div className={styles.switcherTitle} initial={false} animate={{ opacity: expanded ? 0 : 1, marginTop: expanded ? 48 : 0 }} transition={transition}>
          <img src={compact} alt="" style={{ width: itemWidth - collapsedItemPadding, height: collapsedItemHeight - collapsedItemPadding }} />
        </motion.div>
        <motion.div className={styles.switcherLogo} initial={false} animate={{ scale: expanded ? 1 : 0, opacity: expanded ? 1 : 0 }} transition={transition}>
          <img src={logo} alt="" style={{ width: itemWidth - itemPadding, height: itemHeight - itemPadding }} />
        </motion.div>
      </motion.div>
    </Pressable>
  );
}
