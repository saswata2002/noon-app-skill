import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Icon, MaskIcon, Pressable, ProductImage, Screen } from '../../components';
import { useNav } from '../../kit/Navigator';
import { duration, easing } from '../../motion/presets';
import { icons, images } from './assets';
import { AFSButton, Tap } from './components/AFSButton';
import { ReturnsOverlay } from './components/ReturnsOverlay';
import { copy, resolveProduct, statusFilters, yearFilters } from './data';
import { ownKey } from './nav';
import { returnsStore, type ReturnRecord } from './store';
import { itemStatusGradient, itemStatusText, normalizeColorCode, returnsTokens } from './tokens';
import styles from './history.module.css';
import ov from './components/overlays/overlays.module.css';

/**
 * AFSReturnsHistoryListScreen (features/afs/returns/legacy/screens) — the live screen behind Account → Returns.
 * Header with expanding search (250 ms out-cubic), year picker + status chips, return cards with a status
 * gradient strip, "New return request" footer. MAPPING.md §9. `?empty=1` shows the empty view.
 */
export function ReturnsHistoryScreen({ params }: { params: { empty?: string } }) {
  const nav = useNav();
  const all = returnsStore.useReturns();
  const [yearIdx, setYearIdx] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [picker, setPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(t);
  }, [term]);

  const list = useMemo(() => {
    if (params.empty === '1' || params.empty === 'true') return [];
    let items = status ? all.filter((r) => r.status.group === status) : all;
    const q = debounced.trim().toLowerCase();
    if (q) items = items.filter((r) => resolveProduct(r.productId).title.toLowerCase().includes(q) || r.returnItemNr.toLowerCase().includes(q));
    return items;
  }, [all, status, debounced, params.empty]);

  const showReturnable = () => nav.push('returns/returnable', { rootKey: ownKey(nav) });
  const collapse = () => {
    inputRef.current?.blur();
    setTerm('');
    setExpanded(false);
  };
  const t = { duration: returnsTokens.searchDuration, ease: easing.out };

  const header = (
    <div className={styles.header}>
      <Pressable className={styles.circle} scale={0.96} onClick={() => (expanded ? collapse() : nav.back())} aria-label="Back">
        <MaskIcon src={icons.slimChevronLeft} size={20} color="var(--nk-color-text-primary)" className={styles.flipRtl} />
      </Pressable>
      <div className={styles.middle}>
        <motion.div className={styles.titleBox} animate={{ opacity: expanded ? 0 : 1, scale: expanded ? 0.9 : 1 }} transition={{ ...t, opacity: { ...t, duration: t.duration / 2, delay: 0 } }} style={{ pointerEvents: expanded ? 'none' : 'auto' }}>
          <span className={styles.title}>{copy.historyHeader}</span>
        </motion.div>
        <motion.div
          className={styles.searchBox}
          initial={false}
          animate={{ opacity: expanded ? 1 : 0, scaleX: expanded ? 1 : 0.7 }}
          transition={{ ...t, opacity: { ...t, duration: t.duration / 2, delay: expanded ? t.duration / 2 : 0 } }}
          style={{ pointerEvents: expanded ? 'auto' : 'none' }}
        >
          <MaskIcon src={icons.searchBar} size={16} color="var(--nk-color-text-primary)" />
          <input ref={inputRef} className={styles.searchInput} value={term} onChange={(e) => setTerm(e.target.value)} placeholder={copy.historySearchPlaceholder} />
          {term && (
            <button type="button" className={styles.clear} onClick={() => (setTerm(''), setDebounced(''))} aria-label="Clear">
              <MaskIcon src={icons.xMark} size={20} color="var(--nk-color-price-old)" />
            </button>
          )}
        </motion.div>
      </div>
      <motion.div className={styles.searchBtnWrap} initial={false} animate={{ width: expanded ? 0 : 40, opacity: expanded ? 0 : 1, marginInlineStart: expanded ? -6 : 0 }} transition={t}>
        <Pressable
          className={styles.circle}
          scale={0.96}
          onClick={() => {
            setExpanded(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          aria-label="Search"
        >
          <MaskIcon src={icons.searchBar} size={16} color="var(--nk-color-text-primary)" />
        </Pressable>
      </motion.div>
    </div>
  );

  const filters = (
    <div className={['nk-hscroll', styles.filters].join(' ')}>
      <Tap className={styles.picker} onPress={() => setPicker(true)}>
        <span className={styles.chipText}>{yearFilters[yearIdx].name}</span>
        <img src={icons.arrowDown} width={9} height={6} alt="" aria-hidden />
      </Tap>
      <div className={styles.chips}>
        {statusFilters.map(({ key, name }) => {
          const on = key === status;
          return (
            <Pressable key={key} className={[styles.chip, on && styles.chipOn].filter(Boolean).join(' ')} scale={1} onClick={() => setStatus(on ? null : key)}>
              <span className={styles.chipText}>{name}</span>
              {on && <img src={icons.xMark} width={16} height={16} alt="" aria-hidden className={styles.chipClose} />}
            </Pressable>
          );
        })}
      </div>
    </div>
  );

  const empty = list.length === 0;
  return (
    <>
      <Screen
        background="bgSubtle"
        safeTop={false}
        header={
          <>
            {header}
            {filters}
          </>
        }
        footer={
          <div className={styles.footer}>
            <AFSButton title={empty ? copy.createNewReturn : copy.newReturnRequest} onPress={showReturnable} />
          </div>
        }
        contentStyle={{ paddingBottom: 0 }}
      >
        {empty ? (
          <div className={styles.empty}>
            <img src={images.emptyReturnRequests} width={280} height={155} alt="" />
            <span className={styles.emptyTitle}>{copy.emptyTitle}</span>
            <span className={styles.emptyMessage}>{copy.emptyMessage}</span>
          </div>
        ) : (
          <div className={styles.list}>
            {list.map((r) => (
              <HistoryCard key={r.returnItemNr} record={r} onPress={() => nav.push('returns/details', { productId: r.productId, returnNr: r.returnItemNr, rootKey: ownKey(nav) })} onTrack={() => nav.toast(`${r.trackingAction?.title} — opens the refund tracking deep link`)} />
            ))}
          </div>
        )}
      </Screen>

      <YearPickerOverlay open={picker} onClosed={() => setPicker(false)} index={yearIdx} onDone={setYearIdx} />
    </>
  );
}

function HistoryCard({ record: r, onPress, onTrack }: { record: ReturnRecord; onPress: () => void; onTrack: () => void }) {
  const product = resolveProduct(r.productId);
  const code = normalizeColorCode(r.status.colorCode) ?? '';
  return (
    <div className={styles.itemWrap}>
      <Pressable className={styles.card} scale={1} whileTap={{ opacity: 0.2 }} transition={{ duration: duration.base, ease: easing.inOut }} onClick={onPress}>
        <span className={styles.statusStrip} style={{ '--strip': itemStatusGradient[code] ?? 'var(--nk-color-bg-subtle)' } as CSSProperties}>
          {/* SD status.iconV2 (svg) → kit glyph in the status colour */}
          <Icon name={r.status.icon} size={18} color={itemStatusText[code]} strokeWidth={2.2} />
          <span className={styles.statusText} style={{ color: itemStatusText[code] }}>
            {r.status.label}
          </span>
        </span>
        <span className={styles.info}>
          <span className={styles.infoRow}>
            <span className={styles.imageBox}>
              <ProductImage product={product} width={49} height={68} />
            </span>
            <span className={styles.texts}>
              <span className={styles.nr}>{`#${r.returnItemNr}`}</span>
              <span className={styles.itemTitle}>{product.title}</span>
            </span>
            <span className={styles.arrowWrap}>
              <span className={styles.arrow}>
                <img src={icons.slimChevronRight} width={20} height={20} alt="" aria-hidden className={styles.flipRtl} />
              </span>
            </span>
          </span>
          {r.trackingAction && (
            <span
              role="button"
              tabIndex={0}
              className={styles.trackAction}
              onClick={(e) => {
                e.stopPropagation();
                onTrack();
              }}
            >
              <img src={icons.feesRefundBlack} width={18} alt="" aria-hidden />
              <span className={styles.trackText}>{r.trackingAction.title}</span>
            </span>
          )}
        </span>
      </Pressable>
    </div>
  );
}

/** src/screens/PickerIOSScreen — value list + "DONE" (PrimaryButton, buttonStyle paleBlack r8) */
function YearPickerOverlay({ open, onClosed, index, onDone }: { open: boolean; onClosed: () => void; index: number; onDone: (i: number) => void }) {
  const [sel, setSel] = useState(index);
  useEffect(() => setSel(index), [index, open]);
  return (
    <ReturnsOverlay open={open} onClosed={onClosed} cardClassName={ov.cardWhite} contentClassName={ov.ypContent}>
      {(close) => (
        <>
          <div className={ov.ypList}>
            {yearFilters.map((y, i) => (
              <Pressable key={y.key} className={[ov.ypOption, i === sel && ov.ypOptionOn].filter(Boolean).join(' ')} scale={1} onClick={() => setSel(i)}>
                {y.name}
              </Pressable>
            ))}
          </div>
          <Pressable
            className={ov.ypDone}
            scale={0.98}
            onClick={() => {
              onDone(sel);
              close();
            }}
          >
            {copy.done}
          </Pressable>
        </>
      )}
    </ReturnsOverlay>
  );
}
