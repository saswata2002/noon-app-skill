import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { duration, handoff } from '../../motion/presets';
import { DottedDivider, Screen } from '../../components';
import { useNav } from '../../kit/Navigator';
import type { ScreenProps } from '../../kit/types';
import { icons, images } from './assets';
import { AddressToastHost, GradientTitle } from './components/primitives';
import { FloatingOverlay } from './components/map';
import {
  AddAddressButton,
  AddressCard,
  ListingEmpty,
  ListingHeader,
  ListingLoading,
  LocationNudge,
  SearchInput,
  SearchResultLoading,
  SearchResultsCard,
  SelectHeader,
  TabSwitcher,
} from './components/select';
import { addressTitle, places, singleLineAddress, t, type Place } from './data';
import { addressStore, useAddressStore } from './store';
import { addressMetrics } from './tokens';
import styles from './address.module.css';

export interface SelectParams {
  /** start on the Locker/ Pickup tab */
  tab?: number;
  /** demo: simulate denied location permission (shows the "Location not enabled" nudge) */
  locationDenied?: boolean;
  /** demo: show an AddressToastScreen message on mount */
  demoToast?: string;
  /** skip the initial skeleton */
  skipLoading?: boolean;
  /** home / global entry (NoonAddressSelector.changeAddress): the list in AddressV2FloatingOverlay over the current page */
  isBottomSheet?: boolean;
}

const TAB_PANE_WIDTH = 390;
/** getTabWidth(isBottomSheet): screenWidth − AddressOverlayStylings.EDGE_SPACING · 2 */
const SHEET_PANE_WIDTH = 390 - 12 * 2;
/** TabSwitcher isBottomSheet: (screenWidth − 40) / tabs − 12 */
const SHEET_TAB_WIDTH = (390 - 40) / 2 - 12;

/**
 * AddressV2SelectScreen. Account entry (isBottomSheet false, doesChangeDefaultAddress true): header "Address Book",
 * tab switcher, search field, add-new button, saved address cards. Home entry (`isBottomSheet`, `address/selectSheet`):
 * the same tabs and list inside AddressV2FloatingOverlay (withSlideAnimation, expanded) over the page; a new default
 * address closes it (closeBottomSheet: dismissModal alpha 1 → 0, 200 ms) and then shows the toast.
 */
/**
 * The loading choreography (timing: the Test01 motion reference). The sheet / page first rises and settles on its spring
 * (≈ 0.55s; `settle`), then the skeleton fades in on the S-curve (`shimmerIn`) and shimmers while the list "loads"
 * (`hold`), then the content resolves component by component out of it — search field, header, each card, `step`
 * apart — fading in (183ms fast-start) as it rises `rise`px on the spring, while the skeleton dissolves under it
 * (189ms S-curve, `outLag` behind). Skeleton and content share one grid cell, so nothing jumps.
 */
const LOAD = { settle: 0.5, shimmerIn: 0.3, hold: 0.65, step: handoff.stagger.in, rise: 16, outLag: 0.06, settleOut: 0.7 };
type LoadPhase = 'arrive' | 'shimmer' | 'reveal' | 'done';

export function SelectScreen({ params }: ScreenProps<SelectParams>) {
  const nav = useNav();
  const addresses = useAddressStore((s) => s.addresses);
  const defaultId = useAddressStore((s) => s.defaultId);
  const loadingCode = useAddressStore((s) => s.loadingCode);
  const locationGranted = useAddressStore((s) => s.locationGranted);

  const [tab, setTab] = useState(params.tab ?? 0);
  const [phase, setPhase] = useState<LoadPhase>(params.skipLoading ? 'done' : 'arrive');
  const isLoading = phase === 'arrive' || phase === 'shimmer';
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // initial fetch (AddressService.getAddressesV2), staged: settle → shimmer → reveal → done
  useEffect(() => {
    if (phase === 'done') return;
    const [next, after] = ({ arrive: ['shimmer', LOAD.settle], shimmer: ['reveal', LOAD.shimmerIn + LOAD.hold], reveal: ['done', LOAD.settleOut] } as const)[phase];
    const timer = setTimeout(() => setPhase(next), after * 1000);
    return () => clearTimeout(timer);
  }, [phase]);
  const revealing = phase === 'reveal';
  /** one component of the reveal: fades in and rises out of the skeleton, `i` steps into the cascade */
  const reveal = (i: number) =>
    revealing
      ? {
          initial: { opacity: 0, y: LOAD.rise },
          animate: { opacity: 1, y: 0 },
          transition: { y: { ...handoff.spring, delay: i * LOAD.step }, opacity: { duration: handoff.fade.out, ease: handoff.easeOut, delay: i * LOAD.step } },
        }
      : {};
  /** the skeleton (fades in once the sheet has settled, dissolves as the content resolves) stacked with the content */
  const stack = (content: ReactNode) => (
    <div className={styles.loadStack}>
      {phase !== 'done' && (
        <motion.div
          className={styles.loadLayer}
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'shimmer' ? 1 : 0 }}
          transition={phase === 'shimmer' ? { duration: LOAD.shimmerIn, ease: handoff.easeInOut } : { duration: handoff.fade.io, ease: handoff.easeInOut, delay: LOAD.outLag }}
        >
          <ListingLoading />
        </motion.div>
      )}
      {/* its own presence boundary: the floating sheet's AnimatePresence initial={false} would otherwise suppress the
          reveal of every piece mounted inside it */}
      <AnimatePresence initial={revealing}>
        {!isLoading && (
          <motion.div key="content" className={styles.loadContent}>
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  useEffect(() => {
    if (params.locationDenied) addressStore.setLocationGranted(false);
  }, [params.locationDenied]);

  useEffect(() => {
    if (!params.demoToast) return;
    const timer = setTimeout(() => addressStore.toast(params.demoToast!), 500);
    return () => clearTimeout(timer);
  }, [params.demoToast]);

  // debounce(500) autocomplete
  useEffect(() => {
    if (!query) {
      setDebounced('');
      setIsSearchLoading(false);
      return;
    }
    setIsSearchLoading(true);
    const timer = setTimeout(() => {
      setDebounced(query);
      setIsSearchLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // sortAddresses: selected address first (done on fetch only)
  const sortedRef = useRef<number[] | null>(null);
  if (sortedRef.current === null) sortedRef.current = [defaultId];
  const sorted = useMemo(() => {
    const first = sortedRef.current?.[0];
    const item = addresses.find((a) => a.id === first);
    return item ? [item, ...addresses.filter((a) => a.id !== first)] : addresses;
  }, [addresses]);

  const filtered = useMemo(() => {
    if (!query) return sorted;
    const q = query.toLowerCase();
    return sorted.filter((a) => `${singleLineAddress(a)} ${a.placeName} ${a.area} ${addressTitle(a)} ${a.nickname ?? ''}`.toLowerCase().includes(q));
  }, [sorted, query]);

  const searchResults = useMemo(() => {
    if (!debounced) return [];
    const q = debounced.toLowerCase();
    const hits = places.filter((p) => `${p.placeName} ${p.area}`.toLowerCase().includes(q));
    return hits.length ? hits : places.slice(0, 4).map((p) => ({ ...p }));
  }, [debounced]);

  const busy = !!loadingCode;
  const isBottomSheet = !!params.isBottomSheet;
  const paneWidth = isBottomSheet ? SHEET_PANE_WIDTH : TAB_PANE_WIDTH;
  // closeBottomSheet → toast on the page below (the sheet's toast host leaves with it)
  const closeWithToast = (message: string) => {
    nav.back();
    setTimeout(() => nav.toast(message), 220);
  };

  const openMap = (params: Record<string, unknown>) => nav.push('address/map', params);

  const onAddressPress = (id: number, code: string) => {
    if (id === defaultId) {
      if (isBottomSheet) return closeWithToast(t.address_v2_selected_address_toast_message);
      addressStore.toast(t.address_v2_selected_address_toast_message);
      return;
    }
    // setAddressAsDefault → AddressService.setDefaultAddressV2 → toast
    addressStore.setLoading(code);
    setTimeout(() => {
      addressStore.setDefault(id);
      addressStore.setLoading(null);
      if (isBottomSheet) return closeWithToast(t.address_v2_changed_default_address_toast_message);
      addressStore.toast(t.address_v2_changed_default_address_toast_message);
    }, 700);
  };

  const onSearchResultPress = (place: Place) => openMap({ flow: 'create', placeId: place.id });

  const renderLatLngPane = () => {
    const showEmpty = addresses.length === 0 && !query;
    return stack(
      <div className={`nk-scroll ${styles.pane}`}>
        <div className={isBottomSheet ? styles.paneInnerSheet : styles.paneInner}>
          <motion.div {...reveal(0)}>
            <SearchInput value={query} onChange={setQuery} disabled={busy} style={{ margin: '0 11px 6px' }} />
          </motion.div>
          <div className={styles.listContent}>
            {!query && (
              <motion.div {...reveal(1)}>
                <ListingHeader>
                  <AnimatePresence initial={false}>
                    {!locationGranted && (
                      <motion.div
                        key="nudge"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ height: handoff.spring, opacity: { duration: duration.base, ease: handoff.easeInOut } }}
                        style={{ overflow: 'hidden' }}
                      >
                        <LocationNudge onEnable={() => addressStore.setLocationGranted(true)} />
                        <DottedDivider />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AddAddressButton text={t.address_v2_add_new_latlng_address} onPress={() => openMap({ flow: 'create', withLocationPrompt: true })} />
                </ListingHeader>
              </motion.div>
            )}
            {showEmpty ? (
              <motion.div {...reveal(2)}>
                <ListingEmpty icon={images.emptyLatLng} title={t.address_v2_empty_latlng_saved_addresses_title} substring={t.address_v2_empty_latlng_saved_addresses_subtitle} />
              </motion.div>
            ) : (
              <>
                {query && <div style={{ height: 12 }} />}
                {/* initial on during the reveal: the cards cascade in after the header (each `step` later) */}
                <AnimatePresence initial={revealing}>
                  {filtered.map((a, i) => (
                    <motion.div
                      key={a.id}
                      layout="position"
                      initial={{ opacity: 0, y: revealing ? LOAD.rise : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, transition: { duration: duration.base, ease: handoff.easeInOut } }}
                      transition={{
                        y: { ...handoff.spring, delay: revealing ? (2 + i) * LOAD.step : 0 },
                        opacity: { duration: handoff.fade.out, ease: handoff.easeOut, delay: revealing ? (2 + i) * LOAD.step : 0 },
                        layout: handoff.spring,
                      }}
                    >
                      <AddressCard
                        address={a}
                        isFirst={i === 0}
                        isSelected={a.id === defaultId}
                        isLoading={loadingCode === a.code}
                        disabled={busy}
                        onPress={() => onAddressPress(a.id, a.code)}
                        onThreeDots={() => nav.sheet('address/controls', { id: a.id })}
                        onShare={() => nav.toast('Opens the native share sheet with the address link')}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {query && isSearchLoading && (
                  <div>
                    <GradientTitle title={t.search_results} style={{ marginTop: filtered.length ? 10 : 0, paddingBottom: 10, marginLeft: 4 }} />
                    {[0, 1, 2].map((i) => (
                      <SearchResultLoading key={i} style={{ marginTop: 12 }} />
                    ))}
                  </div>
                )}
                {query && !isSearchLoading && searchResults.length > 0 && (
                  <div>
                    <GradientTitle title={t.search_results} style={{ marginTop: filtered.length ? 10 : 0, paddingBottom: 10, marginLeft: 4 }} />
                    <SearchResultsCard results={searchResults} onPress={onSearchResultPress} style={{ padding: 8 }} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>,
    );
  };

  const renderCollectionPane = () => {
    return stack(
      <div className={`nk-scroll ${styles.pane}`}>
        <div className={isBottomSheet ? styles.paneInnerSheet : styles.paneInner}>
          <motion.div {...reveal(0)}>
            <SearchInput value="" onChange={() => undefined} style={{ margin: '0 11px 6px' }} />
          </motion.div>
          <motion.div className={styles.collectionHeader} {...reveal(1)}>
            <ListingHeader>
              <AddAddressButton text={t.address_v2_add_new_collection_address} onPress={() => nav.toast('Collection-point map is not part of this prototype')} />
            </ListingHeader>
          </motion.div>
          <motion.div {...reveal(2)}>
            <ListingEmpty
              icon={images.emptyCollection}
              title={t.address_v2_empty_collection_saved_addresses_title}
              substrings={[
                { icon: icons.collectionEmpty1, text: t.address_v2_empty_collection_saved_addresses_subtitle1 },
                { icon: icons.collectionEmpty2, text: t.address_v2_empty_collection_saved_addresses_subtitle2 },
                { icon: icons.collectionEmpty3, text: t.address_v2_empty_collection_saved_addresses_subtitle3 },
              ]}
            />
          </motion.div>
        </div>
      </div>,
    );
  };

  const tabsAndPanes = (
    <>
      <div className={styles.tabSwitcherContainer}>
        <TabSwitcher
          tabs={[t.address_v2_latlng_tab_title, t.address_v2_collection_tab_title]}
          selected={tab}
          onPress={(i) => !isLoading && setTab(i)}
          tabWidth={isBottomSheet ? SHEET_TAB_WIDTH : addressMetrics.tabWidth}
        />
      </div>
      <motion.div className={styles.slider} style={{ width: paneWidth * 2 }} animate={{ x: -tab * paneWidth }} transition={handoff.spring}>
        <div className={styles.tabContent} style={{ width: paneWidth }}>
          {renderLatLngPane()}
        </div>
        <div className={styles.tabContent} style={{ width: paneWidth }}>
          {renderCollectionPane()}
        </div>
      </motion.div>
    </>
  );

  if (isBottomSheet) {
    return (
      <Screen background="var(--nk-palette-black-alpha0)" safeTop={false} contentStyle={{ overflow: 'hidden', paddingBottom: 0 }}>
        <FloatingOverlay expanded slideIn onOverlayClose={nav.back} expandedContent={<div className={styles.sheetBody}>{tabsAndPanes}</div>} />
      </Screen>
    );
  }

  return (
    <Screen
      background="addrPage"
      header={
        <div className={styles.selectTop}>
          <SelectHeader title={t.address_v2_account_list_title} onBack={nav.back} />
          <div className={styles.tabSwitcherContainer}>
            <TabSwitcher
              tabs={[t.address_v2_latlng_tab_title, t.address_v2_collection_tab_title]}
              selected={tab}
              onPress={(i) => !isLoading && setTab(i)}
              tabWidth={addressMetrics.tabWidth}
            />
          </div>
        </div>
      }
      contentStyle={{ overflow: 'hidden', paddingBottom: 0 }}
    >
      <motion.div className={styles.slider} animate={{ x: -tab * TAB_PANE_WIDTH }} transition={handoff.spring}>
        <div className={styles.tabContent}>{renderLatLngPane()}</div>
        <div className={styles.tabContent}>{renderCollectionPane()}</div>
      </motion.div>
      <AddressToastHost />
    </Screen>
  );
}
