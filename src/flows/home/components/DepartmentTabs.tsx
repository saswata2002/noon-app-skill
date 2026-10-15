import { AnimatePresence, motion } from 'motion/react';
import { useState, type CSSProperties } from 'react';
import { Pressable, QuickAddButton } from '../../../components';
import { useNav } from '../../../kit/Navigator';
import { currency } from '../../../data';
import { cmsWidgets, groceryTiles, homeTabs, sponsored, tabRails, tabStars, type Crop, type HomeTabId, type PromoItem, type TabTile } from '../data.tabs';
import { homeTabInk, homeTabThemes, homeTabsTokens as T, type TabTheme } from '../tokens.tabs';
import styles from './DepartmentTabs.module.css';

const gradient = ([a, b]: [string, string]) => `linear-gradient(180deg, ${a} 0%, ${b} 100%)`;
const ring = (top?: string): CSSProperties => ({ background: `linear-gradient(180deg, ${top} 0%, transparent 100%)` });

/**
 * Department tabs + tab CMS widget (ashbun/noon-app experiments/marketplace-switcher: TabLayout, TabContent,
 * AllCmsContent, GroceryGridContent, FashionSponsoredSection). Seven 76-wide tabs (All, Electronics NEW, Grocery,
 * Beauty, Fashion, Wellness, Home) over a band that re-skins per tab: its gradient cross-fades, the nav ink flips
 * light / dark, one indicator slides between tabs, the band springs to the new panel's height and the panels
 * cross-fade as absolute layers. All = sponsored CMS widgets, Electronics / Beauty = headline + sub-category rail,
 * Grocery = 4 × 2 essentials grid, Fashion = sponsored spotlight. Every tile and card opens a PLP.
 */
export function DepartmentTabs({ active: controlled, onChange }: { active?: HomeTabId; onChange?: (id: HomeTabId) => void } = {}) {
  // controlled by HomeScreen so the header re-skins with the band; uncontrolled works on its own
  const [own, setOwn] = useState<HomeTabId>('all');
  const active = controlled ?? own;
  const setActive = (id: HomeTabId) => (onChange ? onChange(id) : setOwn(id));
  const theme = homeTabThemes[active];
  const ink = homeTabInk[theme.ink];
  const index = homeTabs.findIndex((t) => t.id === active);
  const panelH = T.panelH[theme.content];

  return (
    <motion.section className={styles.band} aria-label="Shop departments" initial={false} animate={{ height: T.navH + panelH }} transition={T.resize}>
      {/* a gradient can't be animated, so each skin is its own layer and they cross-fade */}
      <AnimatePresence initial={false}>
        <motion.span key={active} aria-hidden className={styles.bg} style={{ backgroundImage: gradient(theme.layout) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={T.fade} />
      </AnimatePresence>

      <div className={`nk-hscroll ${styles.nav}`} role="tablist">
        <div className={styles.navRow}>
          {homeTabs.map((tab) => {
            const on = tab.id === active;
            return (
              <Pressable
                key={tab.id}
                role="tab"
                aria-selected={on}
                className={styles.tab}
                scale={0.94}
                style={{ borderBottomColor: ink.rule }}
                onClick={() => setActive(tab.id)}
              >
                {'isNew' in tab && tab.isNew && <span className={styles.newBadge}>NEW</span>}
                <span className={styles.tabInner}>
                  <span className={styles.tabIcon}>
                    <img
                      src={on && 'activeIcon' in tab ? tab.activeIcon : tab.icon}
                      alt=""
                      width={tab.size}
                      height={tab.size}
                      // the icons are black line art: flip them on dark skins
                      style={{ filter: theme.ink === 'light' ? 'invert(1)' : undefined, opacity: theme.ink === 'light' && !on ? 0.6 : 1 }}
                    />
                  </span>
                  <span className={styles.tabLabel} data-active={on || undefined} style={{ color: on ? ink.active : ink.idle }}>
                    {tab.label}
                  </span>
                </span>
              </Pressable>
            );
          })}
          {/* one indicator for the whole rail: it slides instead of re-mounting per tab */}
          <motion.span aria-hidden className={styles.indicator} initial={false} animate={{ x: index * T.tabW, backgroundColor: ink.active }} transition={T.control} />
        </div>
      </div>

      <div className={styles.panel} role="tabpanel" style={{ height: panelH }}>
        <AnimatePresence initial={false}>
          <motion.div key={active} className={styles.layer} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={T.fade}>
            <Panel id={active} theme={theme} />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function Panel({ id, theme }: { id: HomeTabId; theme: TabTheme }) {
  if (theme.content === 'cms') return <CmsWidgets />;
  if (theme.content === 'sponsored') return <Sponsored />;
  if (theme.content === 'grocery') return <GroceryGrid theme={theme} />;
  const rail = tabRails[id];
  if (!rail) return null;
  return (
    <>
      <Headline text={rail.headline} star={rail.star} color={theme.headlineColor} />
      <div className={`nk-hscroll ${styles.rail}`}>
        <div className={styles.railRow}>
          {rail.tiles.map((t) => (
            <Tile key={t.id} tile={t} theme={theme} />
          ))}
        </div>
      </div>
    </>
  );
}

function Headline({ text, star, color }: { text: string; star: string; color?: string }) {
  return (
    <>
      <img className={styles.star} src={star} alt="" style={{ left: 16.59 }} />
      <img className={styles.star} src={star} alt="" style={{ left: 319.09 }} />
      <p className={styles.headline} style={{ color }}>
        {text}
      </p>
    </>
  );
}

function TileLabel({ lines, top = 10, leading = 16, color }: { lines: string[]; top?: number; leading?: number; color?: string }) {
  return (
    <span className={styles.tileLabel} style={{ top, lineHeight: `${leading}px`, color }}>
      {lines.map((l) => (
        <span key={l}>{l}</span>
      ))}
    </span>
  );
}

function Tile({ tile, theme }: { tile: TabTile; theme: TabTheme }) {
  const nav = useNav();
  return (
    <Pressable className={styles.tile} scale={0.96} aria-label={tile.label.join(' ')} style={{ backgroundImage: theme.tileFill }} onClick={() => nav.push('plp/listing', { query: tile.query })}>
      {/* pre-composed strip: already carries the tile fill and the theme gradient */}
      {tile.band && <img className={styles.band2} src={tile.band} alt="" style={{ top: tile.bandTop, height: T.tile.h - (tile.bandTop ?? 0) }} />}
      {tile.cut && tile.box && (
        <span className={styles.clip} style={{ left: tile.box.x, top: tile.box.y, width: tile.box.w, height: tile.box.h }}>
          <img src={tile.cut} alt="" style={tile.img ? { left: tile.img.x, top: tile.img.y, width: tile.img.w, height: tile.img.h } : { left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </span>
      )}
      <TileLabel lines={tile.label} top={tile.labelTop} leading={tile.leading} color={theme.tileLabel} />
      <span aria-hidden className={styles.ring} style={ring(theme.tileStroke)} />
    </Pressable>
  );
}

function CropImg({ c }: { c: Crop }) {
  if (c.rotateIn)
    return (
      <span className={styles.rot} style={c.rotateIn}>
        <span style={c.frame}>
          <img src={c.src} alt="" style={c.image} />
        </span>
      </span>
    );
  return (
    <span className={`${styles.clip} ${c.blur ? styles.blur : ''}`} style={c.frame}>
      <img src={c.src} alt="" style={c.image} />
    </span>
  );
}

function GroceryGrid({ theme }: { theme: TabTheme }) {
  const nav = useNav();
  return (
    <>
      <Headline text="Grocery Essentials" star={tabStars.grocery} color={theme.headlineColor} />
      <div className={styles.grid}>
        {groceryTiles.map((t) => (
          <Pressable key={t.id} className={styles.tile} scale={0.96} aria-label={t.label.join(' ')} style={{ backgroundImage: theme.tileFill }} onClick={() => nav.push('plp/listing', { query: t.query })}>
            <TileLabel lines={t.label} leading={t.leading} color={theme.tileLabel} />
            {t.wrap ? (
              <span className={styles.clip} style={t.wrap}>
                {t.crops.map((c, i) => (
                  <CropImg key={i} c={c} />
                ))}
              </span>
            ) : (
              t.crops.map((c, i) => <CropImg key={i} c={c} />)
            )}
            <span aria-hidden className={styles.ring} style={ring(theme.tileStroke)} />
          </Pressable>
        ))}
      </div>
    </>
  );
}

function Promo({ item, badge, fit = 'cover', details, query }: { item: PromoItem; badge: string; fit?: 'cover' | 'contain'; details?: boolean; query: string }) {
  const nav = useNav();
  return (
    <Pressable className={styles.promo} scale={0.96} aria-label={item.title ?? item.badge} onClick={() => nav.push('plp/listing', { query })}>
      <span className={styles.promoImg}>
        <img src={item.image} alt="" style={{ objectFit: fit }} />
        <span className={styles.notch} style={{ background: badge }}>
          {item.badge}
        </span>
      </span>
      {details && (
        <>
          <span className={styles.promoTitle}>{item.title}</span>
          <span className={styles.promoPrice}>
            <b>
              {currency}
              {item.price}
            </b>
            <s>{item.was}</s>
          </span>
        </>
      )}
    </Pressable>
  );
}

function CmsWidgets() {
  const nav = useNav();
  const { hero, whoop, nike, ajmal } = cmsWidgets;
  return (
    <div className="nk-hscroll" style={{ height: '100%' }}>
      <div className={styles.cms}>
        <Pressable className={styles.card} scale={0.98} aria-label={hero.alt} onClick={() => nav.push('plp/listing', { query: hero.query })}>
          <img className={styles.cover} src={hero.image} alt="" />
          <span className={styles.ad} style={{ right: 8, top: 8 }}>
            Ad
          </span>
          <Pressable
            asDiv
            className={styles.pause}
            aria-label="Pause sponsored video"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={hero.pause} alt="" width={20} height={20} />
          </Pressable>
        </Pressable>

        <article className={`${styles.card} ${styles.cardPad}`}>
          <Pressable className={styles.banner} scale={0.98} aria-label={whoop.alt} onClick={() => nav.push('plp/listing', { query: whoop.query })}>
            <span style={{ position: 'absolute', left: 0, top: -0.86, width: 216, height: 97.46, overflow: 'hidden' }}>
              <img src={whoop.banner} alt="" style={{ left: -9.88, top: -212.71, width: 247.11, height: 535.71, objectFit: 'cover' }} />
            </span>
          </Pressable>
          <div className={styles.promoGrid} data-fill>
            {whoop.items.map((p) => (
              <Promo key={p.id} item={p} badge={whoop.badge} query={whoop.query} />
            ))}
          </div>
        </article>

        <article className={`${styles.card} ${styles.cardPad}`}>
          <Pressable className={`${styles.banner} ${styles.bannerFill}`} scale={0.98} aria-label={nike.alt} onClick={() => nav.push('plp/listing', { query: nike.query })}>
            <img src={nike.banner} alt="" style={{ left: '50%', top: '50%', width: 193, height: 193, transform: 'translate(-50%, -50%)', objectFit: 'cover' }} />
          </Pressable>
          <div className={styles.promoGrid}>
            {nike.items.map((p) => (
              <Promo key={p.id} item={p} badge={nike.badge} query={nike.query} details />
            ))}
          </div>
          <span className={styles.ad} style={{ right: 11, top: 11 }}>
            Ad
          </span>
        </article>

        <article className={`${styles.card} ${styles.cardPad} ${styles.ajmal}`}>
          <Pressable className={styles.banner} scale={0.98} aria-label={ajmal.alt} style={{ borderRadius: 12 }} onClick={() => nav.push('plp/listing', { query: ajmal.query })}>
            <img src={ajmal.banner} alt="" style={{ left: '50%', top: '50%', width: 188, height: 94, transform: 'translate(-50%, -50%)', objectFit: 'cover' }} />
          </Pressable>
          <div className={styles.promoGrid} data-fill>
            {ajmal.items.map((p) => (
              <Promo key={p.id} item={p} badge={ajmal.badge} fit="contain" query={ajmal.query} />
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

function Sponsored() {
  const nav = useNav();
  return (
    <section aria-label={`${sponsored.brand}, sponsored`} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className={styles.spotHead}>
        <span className={styles.spotLogo}>
          <img src={sponsored.logo} alt={sponsored.brand} />
        </span>
        <h2 className={styles.spotTitle}>{sponsored.headline}</h2>
      </div>
      <div className={`nk-hscroll ${styles.spotRail}`}>
        <div className={styles.spotRow}>
          {sponsored.items.map((p) => (
            <Pressable key={p.id} className={styles.spot} scale={0.97} aria-label={p.title} onClick={() => nav.push('plp/listing', { query: p.title })}>
              <span className={styles.spotMedia}>
                <img src={p.image} alt="" style={p.box} />
                <span className={styles.spotHeart}>
                  <img src={sponsored.heart} alt="" width={16} height={16} />
                </span>
                {/* the kit's one add-to-cart "+" (QuickAddButton; a div, it sits inside the tile's button) */}
                <span className={styles.spotAtc}>
                  <QuickAddButton asDiv onPress={() => nav.toast('Added to cart')} />
                </span>
                <span className={styles.spotAd}>Ad</span>
              </span>
              <span className={styles.spotBody}>
                <span className={styles.spotName}>{p.title}</span>
                <img src={sponsored.divider} alt="" style={{ width: '100%', height: 1 }} />
                <span className={styles.spotPrice}>
                  <b>
                    {currency}
                    {p.price}
                  </b>
                  <s>
                    {currency}
                    {p.was}
                  </s>
                  <em>{p.off}</em>
                </span>
              </span>
            </Pressable>
          ))}
        </div>
      </div>
    </section>
  );
}
