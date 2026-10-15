import { motion } from 'motion/react';
import { handoff } from '../../motion/presets';
import { useEffect, useState } from 'react';
import { Screen } from '../../components';
import { useNav } from '../../kit/Navigator';
import { images } from './assets';
import { LocateOnMapButton, MapSearchButton, SearchCurrentLocationButton } from './components/map';
import { GradientTitle } from './components/primitives';
import { ListingEmpty, SearchResultLoading, SearchResultsCard } from './components/select';
import { CURRENT_LOCATION, places, t, type Place } from './data';
import { reverseGeocode } from './components/mapWorld';
import { addressStore, useAddressStore } from './store';
import styles from './address.module.css';

const LOADING_COUNT = 5;

/**
 * AddressV2SearchScreen — #F6F7F9 page, search bar (autofocus) with back, "Use my current location",
 * autocomplete results (debounce 500ms; skeleton only if the request takes > 1s) and "Select location on map".
 */
export function SearchScreen() {
  const nav = useNav();
  const locationGranted = useAddressStore((s) => s.locationGranted);
  const [text, setText] = useState('');
  const [results, setResults] = useState<Place[] | null>(null);
  const [fetching, setFetching] = useState(false);
  const current = reverseGeocode(CURRENT_LOCATION);

  useEffect(() => {
    if (!text) {
      setResults(null);
      setFetching(false);
      return;
    }
    const q = text.toLowerCase();
    const loadingTimer = setTimeout(() => setFetching(true), 1000);
    const timer = setTimeout(() => {
      clearTimeout(loadingTimer);
      // slow-network demo: type "slow" to see the skeleton
      const delay = q.includes('slow') ? 1600 : 0;
      setTimeout(() => {
        setResults(places.filter((p) => `${p.placeName} ${p.area}`.toLowerCase().includes(q.replace('slow', '').trim())));
        setFetching(false);
      }, delay);
      if (delay) setFetching(true);
    }, 500);
    return () => {
      clearTimeout(timer);
      clearTimeout(loadingTimer);
    };
  }, [text]);

  const onAddressPress = (p: Place) => {
    addressStore.selectSearchResult(p);
    nav.back();
  };

  const onLocateMe = () => {
    if (!locationGranted) {
      nav.sheet('address/locationAccess');
      return;
    }
    addressStore.requestLocate();
    nav.back();
  };

  return (
    <Screen background="addrFormHeader" safeTop={false} contentStyle={{ overflow: 'hidden', paddingBottom: 0 }}>
      <motion.div className={styles.search} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: handoff.fade.out, ease: handoff.easeOut }}>
        <MapSearchButton searchable autoFocus value={text} onChange={setText} onBack={nav.back} />
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ y: handoff.spring, opacity: { duration: handoff.fade.out, ease: handoff.easeOut } }}>
          <SearchCurrentLocationButton onPress={onLocateMe} description={locationGranted ? `${current.placeName} ${current.area}` : undefined} />
        </motion.div>
        <div className={`nk-scroll ${styles.searchScroll}`}>
          <div className={styles.searchScrollContent}>
            {results && results.length > 0 && <GradientTitle title={t.search_results} style={{ marginLeft: 4, marginTop: 2, marginBottom: 8 }} />}
            {fetching ? (
              Array.from({ length: LOADING_COUNT }).map((_, i) => <SearchResultLoading key={i} style={{ marginTop: 12 }} />)
            ) : results && results.length > 0 ? (
              <>
                <SearchResultsCard results={results} onPress={onAddressPress} />
                <LocateOnMapButton onPress={nav.back} style={{ margin: '12px 0' }} />
              </>
            ) : text && results && results.length === 0 ? (
              <div style={{ marginTop: 24 }}>
                <ListingEmpty icon={images.emptyLatLng} title={t.address_v2_empty_search_title} substring={t.address_v2_empty_search_subtitle} onButtonPress={nav.back} />
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </Screen>
  );
}
