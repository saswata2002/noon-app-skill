import { Icon, MarketplaceTag, Pressable, ProductImage, Screen } from '../../components';
import { useNav } from '../../kit/Navigator';
import { duration, easing } from '../../motion/presets';
import { currency, IPHONE_17_PRO_ID, productById } from '../../data';
import { icons } from './assets';
import { AFSBackHeader } from './components/AFSBackHeader';
import { Tap } from './components/AFSButton';
import { Dashed } from './components/Dashed';
import { copy, isExpress, price2 } from './data';
import { itemStatusGradient, itemStatusText } from './tokens';
import styles from './history.module.css';

/** SD returnableList items (getReturnableList) — demo: delivered catalogue products */
const returnable = [
  { productId: 'p5', itemNr: 'NAEH40021571220-1', button: { status: 'returnable', colorCode: 'blue', desc: 'Return window closes on Oct 17', title: 'Return' } },
  { productId: IPHONE_17_PRO_ID, itemNr: 'NAEH40021602371-1', button: { status: 'returnable', colorCode: 'blue', desc: 'Return window closes on Oct 22', title: 'Return' } },
  { productId: 'p2', itemNr: 'NAEH40021559814-1', button: { status: 'returnable', colorCode: 'blue', desc: 'Return window closes on Oct 15', title: 'Return' } },
  { productId: 'p7', itemNr: 'NAEH40021544019-1', button: { status: 'not_returnable', colorCode: 'gray', desc: 'Return window closed on Oct 5', title: '' } },
];

/**
 * AFSReturnsReturnableListScreen (features/afs/returns/legacy/screens) — "Your recent purchases": status strip,
 * product row, "Return" button (→ submission), dashed separator, item number + flag. MAPPING.md §10.
 */
export function ReturnableListScreen({ params }: { params: { rootKey?: string } }) {
  const nav = useNav();
  return (
    <Screen background="bgSubtle" overlayHeader safeTop={false} header={<AFSBackHeader blur title={copy.returnableHeader} onBack={() => nav.back()} />} contentStyle={{ paddingBottom: 0 }}>
      <div className={styles.rlList}>
        {returnable.map((it) => {
          const p = productById(it.productId);
          const code = it.button.colorCode;
          return (
            <div key={it.itemNr} className={styles.itemWrap}>
              <Pressable asDiv className={styles.card} style={{ gap: 0 }} scale={1} whileTap={{ opacity: 0.2 }} transition={{ duration: duration.base, ease: easing.inOut }} onClick={() => nav.push('pdp/detail', { productId: p.id })}>
                <span className={styles.statusStrip} style={{ ['--strip' as string]: itemStatusGradient[code] ?? 'var(--nk-color-bg-info)' }}>
                  {/* SD returnItemButtonV2.iconUrl (18) → kit glyph */}
                  <Icon name="clock" size={18} strokeWidth={2.2} color={itemStatusText[code] ?? 'var(--nk-color-text-primary)'} />
                  <span className={styles.statusText} style={{ color: itemStatusText[code] ?? 'var(--nk-color-text-primary)' }}>
                    {it.button.desc}
                  </span>
                </span>
                <span className={styles.rlInfo}>
                  <span className={styles.rlRow}>
                    <span className={styles.imageBox}>
                      <ProductImage product={p} width={49} height={68} />
                    </span>
                    <span className={styles.texts}>
                      <span className={styles.rlTitle}>{p.title}</span>
                      <span className={styles.rlPrice}>
                        {currency}&nbsp;{price2(p.price)}
                      </span>
                      <span className={styles.rlStore}>
                        {copy.noonSoldBy} <span className={styles.rlStoreName}>{p.seller ?? 'noon'}</span>
                      </span>
                    </span>
                  </span>
                  {it.button.status === 'returnable' && (
                    <span onClick={(e) => e.stopPropagation()}>
                      <Tap className={styles.rlAction} onPress={() => nav.push('returns/submit', { productId: p.id, rootKey: params.rootKey })}>
                        <img src={icons.returnableItem} width={20} height={20} alt="" aria-hidden />
                        <span className={styles.trackText}>{it.button.title}</span>
                      </Tap>
                    </span>
                  )}
                  <Dashed />
                  <span className={styles.rlNrRow}>
                    <span className={styles.rlNr}>
                      {copy.noonItem} <span className={styles.rlNrBold}>{it.itemNr}</span>
                    </span>
                    {isExpress(p) && <MarketplaceTag kind="express" />}
                  </span>
                </span>
              </Pressable>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}
