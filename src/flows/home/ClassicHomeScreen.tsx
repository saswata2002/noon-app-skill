import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { ProductCard, Pressable, Screen, SearchBarButton, Text } from '../../components';
import { useIsTop, useNav } from '../../kit/Navigator';
import { openSearch } from '../../kit/searchMorph';
import { products, user } from '../../data';
import { duration as motionDuration, easing, handoff } from '../../motion/presets';
import chevronDownIcon from '@assets/icons/noon-chevron-down.webp';
import deliveryHomeIcon from '@assets/icons/noon-delivery-home.webp';
import wishlistIcon from '@assets/icons/noon-wishlist-home-v2.webp';
import { DealTimer } from './components/DealTimer';
import { ExperienceSwitcher } from './components/ExperienceSwitcher';
import { HeroCarousel } from './components/HeroCarousel';
import { banners, offers, promoStrip, rotatingWords, savingsRows, spotlight, tileRows, type FeedItem } from './data';
import { homeTokens, switcherMetrics } from './tokens';
import styles from './home.module.css';
import { ref } from '../../foundations/tokens';

type Mode = 'noon' | 'supermall';

/**
 * Home (NoonHomeScreen → NoonHomeToggle). Header = CMS background + address row + search pill + toggle row.
 * Marketplace switcher sits above it (ExperienceSwitcherProvider). Past 100px scroll the switcher compacts and the
 * address & toggle rows collapse (300ms). Feed modules below are CMS in the app;
 * here they mirror the live noon.com mobile home (hero, promo strip, tile rows, offers, spotlight, savings, banners)
 * using its CMS creatives, followed by a deals carousel and recommended grid for add-to-cart demos.
 */
export function ClassicHomeScreen() {
  const nav = useNav();
  const isTop = useIsTop();
  const [mode, setMode] = useState<Mode>('noon');
  const [collapsed, setCollapsed] = useState(false);
  const dark = mode === 'supermall';

  // ScrollPositionProvider: switcher (and address/toggle rows) expand only while within 100px of the top.
  const onScroll = (y: number) => setCollapsed(y >= 100);
  const { itemHeight, collapsedItemHeight, bottomMargin, topOffset, duration } = switcherMetrics;

  const collapse = {
    initial: false,
    animate: collapsed ? { height: 0, opacity: 0 } : { height: 'auto', opacity: 1 },
    transition: { duration: motionDuration.medium, ease: easing.out },
    style: { overflow: 'hidden' },
  } as const;

  const header = (
    <motion.div
      className={styles.header}
      initial={false}
      animate={{ paddingTop: `calc(var(--nk-inset-top) + ${topOffset + (collapsed ? collapsedItemHeight : itemHeight) + bottomMargin}px)` }}
      transition={{ duration, ease: easing.out }}
    >
      <AnimatePresence initial={false}>
        <motion.div key={mode} className={styles.headerBg} style={{ background: homeTokens.headerBg[mode] }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: motionDuration.base, ease: easing.inOut }} />
      </AnimatePresence>
      <ExperienceSwitcher expanded={!collapsed} />
      <div className={styles.headerContent} style={{ color: dark ? ref.color('textInverse') : undefined }}>
        <motion.div {...collapse}>
          <div className={styles.addressRow}>
            <Pressable className={styles.address} onClick={() => nav.push('address/selectSheet')} scale={0.98}>
              <span className={styles.addressLine1}>
                <img src={deliveryHomeIcon} alt="" className={styles.addressIcon} data-dark={dark || undefined} />
                <span className={styles.addressLabel}>{user.address.label}</span>
                <img src={chevronDownIcon} alt="" className={styles.addressChevron} data-dark={dark || undefined} />
              </span>
              <span className={styles.addressLine2} style={{ color: dark ? ref.palette('whiteAlpha80') : undefined }}>
                {user.address.line}
              </span>
            </Pressable>
            <Pressable className={styles.wishlistButton} onClick={() => nav.push('wishlist/wishlist')} aria-label="Wishlist">
              <img src={wishlistIcon} alt="" width={40} height={40} />
            </Pressable>
          </div>
        </motion.div>
        <div className={styles.searchRow}>
          <SearchBarButton rotatingWords={rotatingWords} onPress={(e) => openSearch(nav, e.currentTarget)} tickerActive={isTop} />
        </div>
        <motion.div {...collapse}>
          <div className={styles.toggleRow}>
            <Text variant="heading" color={dark ? 'textInverse' : 'textPrimary'}>
              {dark ? 'Supermall · luxury & premium' : 'Everything you need, fast'}
            </Text>
            <ModeSwitch value={mode} onChange={setMode} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <Screen header={header} background="bgSurface" withTabBar onScroll={onScroll} safeTop={false}>
      <div className={styles.feed}>
        <HeroCarousel onPress={(q) => nav.push('plp/listing', { query: q })} />

        <Pressable className={styles.strip} onClick={() => nav.push('plp/listing', { query: promoStrip.query })} scale={0.98}>
          <img src={promoStrip.image} alt="" />
        </Pressable>

        <div className={`${styles.tileRows} nk-hscroll`}>
          {tileRows.map((row, r) => (
            <div key={r} className={styles.tileRow}>
              {row.map((t) => (
                <Pressable key={t.image} className={styles.tile} onClick={() => nav.push('plp/listing', { query: t.query })} aria-label={t.query}>
                  <img src={t.image} alt="" />
                </Pressable>
              ))}
            </div>
          ))}
        </div>

        <CardRail title="Offers for you" items={offers} width={147} height={192} />
        <CardRail title="In the spotlight" items={spotlight} width={147} height={205} />
        <section className={styles.module}>
          <Text variant="section" color="textStrong" style={{ padding: '0 16px' }}>
            Maximize your savings
          </Text>
          <div className={`${styles.tileRows} nk-hscroll`}>
            {savingsRows.map((row, r) => (
              <div key={r} className={styles.tileRow} style={{ gap: 10 }}>
                {row.map((t) => (
                  <Pressable key={t.image} className={styles.card} style={{ width: 102, height: 193 }} onClick={() => nav.push('plp/listing', { query: t.query })}>
                    <img src={t.image} alt="" />
                  </Pressable>
                ))}
              </div>
            ))}
          </div>
        </section>
        <CardRail items={banners} width={357} height={147} gap={15} />

        <section className={styles.dealCard}>
          <div className={styles.moduleHeader}>
            <div>
              <Text variant="bodyMedium" weight={700} color="textStrong">
                Deals of the <span style={{ color: 'var(--nk-color-link)' }}>day</span>
              </Text>
              <div style={{ marginTop: 4 }}>
                <DealTimer left="23% left" />
              </div>
            </div>
            <Pressable onClick={() => nav.push('plp/listing', { query: 'Deals' })} style={{ font: ref.type('text14BoldLh1'), color: 'var(--nk-color-primary)' }}>
              View all
            </Pressable>
          </div>
          <div className="nk-hscroll" style={{ gap: 8, padding: '0 12px 12px' }}>
            {products.slice(0, 6).map((p) => (
              <ProductCard key={p.id} product={p} compact width={homeTokens.carouselCardWidth} />
            ))}
          </div>
        </section>

        <section className={styles.module}>
          <Text variant="section" color="textStrong" style={{ padding: '0 12px' }}>
            Recommended for you
          </Text>
          <div className={styles.grid}>
            {products.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...handoff.spring, delay: (i % 2) * 0.035 }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </Screen>
  );
}

/** Stand-in for the 56×32 Lottie switch. */
function ModeSwitch({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  const on = value === 'supermall';
  return (
    <button type="button" aria-label="Toggle Supermall" onClick={() => onChange(on ? 'noon' : 'supermall')} className={styles.switch} data-on={on || undefined}>
      <motion.span className={styles.knob} animate={{ x: on ? 24 : 0 }} transition={handoff.spring}>
        {on ? '✦' : 'n'}
      </motion.span>
    </button>
  );
}

/** Horizontal rail of CMS creatives (offers, spotlight, banners). */
function CardRail({ title, items, width, height, gap = 10 }: { title?: string; items: FeedItem[]; width: number; height: number; gap?: number }) {
  const nav = useNav();
  return (
    <section className={styles.module}>
      {title && (
        <Text variant="section" color="textStrong" style={{ padding: '0 16px' }}>
          {title}
        </Text>
      )}
      <div className="nk-hscroll" style={{ gap, padding: '0 16px' }}>
        {items.map((t) => (
          <Pressable key={t.image} className={styles.card} style={{ width, height }} onClick={() => nav.push('plp/listing', { query: t.query })}>
            <img src={t.image} alt="" />
          </Pressable>
        ))}
      </div>
    </section>
  );
}
