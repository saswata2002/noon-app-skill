import { motion } from 'motion/react';
import { Pressable, SearchBarButton } from '../../../components';
import { useIsTop, useNav } from '../../../kit/Navigator';
import { openSearch } from '../../../kit/searchMorph';
import { easing, tween } from '../../../motion/presets';
import stars from '@assets/home/2025/header/stars.svg';
import glow from '@assets/home/2025/header/bg-glow.svg';
import swoosh from '@assets/home/2025/header/bg-swoosh.svg';
import dividerLine from '@assets/home/2025/header/divider.svg';
// bappzaar NoonAddressSelector / NoonHomeToggle artwork (same files as ClassicHomeScreen)
import chevronDownIcon from '@assets/icons/noon-chevron-down.webp';
import deliveryHomeIcon from '@assets/icons/noon-delivery-home.webp';
import wishlistIcon from '@assets/icons/noon-wishlist-home-v2.webp';
import { addressRow, searchBrands, searchPrefix } from '../data.header';
import { switcherMetrics } from '../tokens';
import { ExperienceSwitcher } from './ExperienceSwitcher';
import styles from './HomeHeader.module.css';

/**
 * Homepage Revamp 2025 header (Figma 1337:6688): light-blue radial gradient with a cyan glow, a white swoosh and
 * star dots, r12 bottom corners. Rows: experience switcher → address (bappzaar NoonAddressSelector + wishlist button, 1:1) → search
 * (the "All flows" Eid frame's festive teal + lantern background is not used, by request). bappzaar builds the same rows
 * in NoonHomeToggle (NoonAddressSelector, NoonSearchBarButton) under the ExperienceSwitcher.
 * The experience switcher is the existing app one (`ExperienceSwitcher`, `switcherMetrics`), unchanged — same
 * absolute placement, header padding and collapse as ClassicHomeScreen; it is not restyled to the Figma tiles.
 * Past 100px of scroll (`collapsed`) the switcher compacts and the address row folds away; the search bar stays.
 */
export function HomeHeader({ collapsed }: { collapsed: boolean }) {
  const nav = useNav();
  const isTop = useIsTop();
  const fold = tween('medium', 'out'); // bappzaar: react-native-collapsible 300ms easeOutCubic
  const { itemHeight, collapsedItemHeight, bottomMargin, topOffset, duration } = switcherMetrics;
  return (
    <motion.header
      className={styles.header}
      initial={false}
      animate={{ paddingTop: `calc(var(--nk-inset-top) + ${topOffset + (collapsed ? collapsedItemHeight : itemHeight) + bottomMargin}px)` }}
      transition={{ duration, ease: easing.out }}
    >
      <div className={styles.decor} aria-hidden>
        <div className={styles.glowBox}>
          <div className={styles.glowShape}>
            <div className={styles.glowPad}>
              <img src={glow} alt="" />
            </div>
          </div>
        </div>
        <div className={styles.swoosh}>
          <img src={swoosh} alt="" />
        </div>
        <img className={styles.stars} src={stars} alt="" />
      </div>
      <div className={styles.fade} aria-hidden />
      <ExperienceSwitcher expanded={!collapsed} />

      <div className={styles.content}>
        <motion.div initial={false} animate={collapsed ? { height: 0, opacity: 0 } : { height: 'auto', opacity: 1 }} transition={fold} style={{ overflow: 'hidden' }}>
          <div className={styles.addressRow}>
            <Pressable className={styles.address} onClick={() => nav.push('address/selectSheet')} scale={0.98}>
              <span className={styles.addressLine1}>
                <img src={deliveryHomeIcon} alt="" className={styles.addressIcon} />
                <span className={styles.addressLabel}>{addressRow.label}</span>
                <img src={chevronDownIcon} alt="" className={styles.chevron} />
              </span>
              <span className={styles.addressLine2}>
                <span>{addressRow.line}</span>
              </span>
            </Pressable>
            <Pressable className={styles.wishlistButton} onClick={() => nav.push('wishlist/wishlist')} aria-label="Wishlist">
              <img src={wishlistIcon} alt="" width={40} height={40} />
            </Pressable>
          </div>
        </motion.div>
        <div className={styles.searchRow}>
          <SearchBarButton
            variant="2025"
            height={48}
            // bappzaar NoonSearchBarButton artwork (search-bar.webp, search-bar-camera.webp — the SearchBarButton defaults); Figma divider line
            icons={{ divider: dividerLine }}
            rotatingPrefix={searchPrefix}
            rotatingWords={searchBrands}
            onPress={(e) => openSearch(nav, e.currentTarget)}
            // the word holds while another screen covers home (the search page carries the same shared words)
            tickerActive={isTop}
          />
        </div>
      </div>
    </motion.header>
  );
}
