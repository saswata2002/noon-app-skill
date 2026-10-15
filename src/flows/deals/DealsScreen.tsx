import { Icon, Pressable, ProductCard, Screen, SearchBarButton, Text } from '../../components';
import { useNav } from '../../kit/Navigator';
import { openSearch } from '../../kit/searchMorph';
import { products } from '../../data';
import { savingsRows, tileRows } from '../home/data';
import homeStyles from '../home/home.module.css';
import { gridTitle, heroes, rails, strips } from './data';
import { dealsTokens } from './tokens';
import styles from './deals.module.css';

const rotate = <T,>(list: T[], by: number) => [...list.slice(by), ...list.slice(0, by)];

/**
 * Deals tab (NoonDynamicTabScreen → DynamicLoaderScreen at whoami tabConfig.dynamicTab.linkUrl).
 * The page is CMS; this mirrors the live /noon-deals-ae stack: cashback strips, hero banners, category
 * tiles, deal rails, savings rail and the "Today's Offers & Deals" listing.
 */
export function DealsScreen() {
  const nav = useNav();
  const toPlp = (query: string) => nav.push('plp/listing', { query });

  const header = (
    <div className={styles.header}>
      <SearchBarButton onPress={(e) => openSearch(nav, e.currentTarget)} />
    </div>
  );

  return (
    <Screen header={header} background="bgSurface" withTabBar>
      <div className={styles.feed}>
        <div className={`${styles.strips} nk-hscroll`}>
          {strips.map((s) => (
            <Pressable key={s.image} className={styles.strip} style={{ aspectRatio: dealsTokens.stripRatio }} onClick={() => toPlp(s.query)} scale={0.98}>
              <img src={s.image} alt="" />
            </Pressable>
          ))}
        </div>

        <div className={`${styles.heroes} nk-hscroll`}>
          {heroes.map((h) => (
            <Pressable key={h.image} className={styles.hero} style={{ width: dealsTokens.heroWidth, height: dealsTokens.heroHeight }} onClick={() => toPlp(h.query)} scale={0.98}>
              <img src={h.image} alt="" />
            </Pressable>
          ))}
        </div>

        <div className={`${homeStyles.tileRows} nk-hscroll`}>
          {tileRows.map((row, r) => (
            <div key={r} className={homeStyles.tileRow}>
              {row.map((t) => (
                <Pressable key={t.image} className={homeStyles.tile} onClick={() => toPlp(t.query)} aria-label={t.query}>
                  <img src={t.image} alt="" />
                </Pressable>
              ))}
            </div>
          ))}
        </div>

        {rails.slice(0, 2).map((rail) => (
          <Rail key={rail.title} title={rail.title} offset={rail.offset} />
        ))}

        <section className={styles.module}>
          <div className={styles.moduleHeader}>
            <Text variant="section" color="textStrong">
              Maximize your savings
            </Text>
          </div>
          <div className="nk-hscroll" style={{ gap: 10, padding: '0 16px' }}>
            {savingsRows[0].map((t) => (
              <Pressable key={t.image} className={homeStyles.card} style={{ width: 102, height: 193 }} onClick={() => toPlp('Savings')}>
                <img src={t.image} alt="" />
              </Pressable>
            ))}
          </div>
        </section>

        {rails.slice(2).map((rail) => (
          <Rail key={rail.title} title={rail.title} offset={rail.offset} />
        ))}

        <section className={styles.module}>
          <div className={styles.moduleHeader}>
            <Text variant="section" color="textStrong">
              {gridTitle}
            </Text>
          </div>
          <div className={styles.grid}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </div>
    </Screen>
  );
}

function Rail({ title, offset }: { title: string; offset: number }) {
  const nav = useNav();
  return (
    <section className={styles.module}>
      <div className={styles.moduleHeader}>
        <Text variant="section" color="textStrong">
          {title}
        </Text>
        <Pressable className={styles.viewAll} onClick={() => nav.push('plp/listing', { query: title })}>
          View All
          <Icon name="chevronRight" size={14} strokeWidth={2.4} flipRtl />
        </Pressable>
      </div>
      <div className="nk-hscroll" style={{ gap: 8, padding: '0 16px' }}>
        {rotate(products, offset).slice(0, 6).map((p) => (
          <ProductCard key={p.id} product={p} compact width={dealsTokens.railCardWidth} />
        ))}
      </div>
    </section>
  );
}
