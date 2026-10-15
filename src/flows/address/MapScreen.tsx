import { animate, motion, useMotionValue, useMotionValueEvent } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lottie, Screen } from '../../components';
import { useIsTop, useNav } from '../../kit/Navigator';
import type { ScreenProps } from '../../kit/types';
import { duration, easing, handoff } from '../../motion/presets';
import { lotties } from './assets';
import { AddressDetailsForm, type AddressFormValues } from './components/form';
import { CurrentLocationButton, FloatingOverlay, LocationLoading, LocationSummary, MapPin, MapSearchButton, UnserviceableView } from './components/map';
import { distanceFromCurrent, reverseGeocode, WORLD, type PinDetails } from './components/mapWorld';
import { AddressToastHost, OverlayButton } from './components/primitives';
import { StreetMap } from './components/StreetMap';
import { CURRENT_LOCATION, places, singleLineAddress, t, userDialCode, userPhone, type MapPoint, type SavedAddress } from './data';
import { user } from '../../data';
import { addressStore, useAddressStore } from './store';
import { addressMetrics } from './tokens';
import styles from './components/map.module.css';
import { ref } from '../../foundations/tokens';

export interface MapParams {
  /** AddressMapScreenFlow */
  flow?: 'create' | 'update';
  /** address being edited (update flow) */
  addressId?: number;
  /** search result picked on the Select screen */
  placeId?: string;
  /** show the location-permission sheet if location is off (Add new address entry) */
  withLocationPrompt?: boolean;
  /** open with the address-details overlay already expanded (address/create, address/update routes) */
  expanded?: boolean;
}

const VW = 390;
const VH = 844;
const FAR_AWAY_DISTANCE_THRESHOLD = 0.2;
const DEFAULT_REGION: MapPoint = { x: 1080, y: 800 };

const distanceToText = (km: number) => (km < 1 ? `${(km * 1000).toFixed(0)} m` : `${Math.min(km, 999).toFixed(0)}${km > 999 ? '+' : ''} km`);

const detailsFromAddress = (a: SavedAddress): PinDetails => ({ placeName: a.placeName, area: a.area, propertyName: a.propertyName, streetName: a.streetName ?? '', isServiceable: true });

/**
 * AddressV2LatLngMapScreen + MapV2 (+ LatLngCreateScreen / LatLngUpdateV2Screen rendered in the footer overlay).
 * Drag the map: the pin lifts, the tooltip and summary clear, and on release the pin drops and the place
 * under the pin is "reverse-geocoded" from the local map.
 */
export function MapScreen({ params }: ScreenProps<MapParams>) {
  const nav = useNav();
  const flow = params.flow ?? (params.addressId ? 'update' : 'create');
  const addresses = useAddressStore((s) => s.addresses);
  const locationGranted = useAddressStore((s) => s.locationGranted);
  const locateRequest = useAddressStore((s) => s.locateRequest);
  const editing = useMemo(() => (flow === 'update' ? (addresses.find((a) => a.id === params.addressId) ?? addresses[0]) : undefined), [flow, params.addressId, addresses]);
  const startPlace = params.placeId ? places.find((p) => p.id === params.placeId) : undefined;

  const start: MapPoint = editing?.location ?? startPlace ?? (locationGranted ? CURRENT_LOCATION : DEFAULT_REGION);
  const x = useMotionValue(VW / 2 - start.x);
  const y = useMotionValue(VH / 2 - start.y);

  const initialDetails: PinDetails | null = editing
    ? detailsFromAddress(editing)
    : startPlace
      ? { placeName: startPlace.placeName, area: startPlace.area, propertyName: startPlace.propertyName, streetName: startPlace.streetName, isServiceable: true, placeId: startPlace.id }
      : null;

  const [details, setDetails] = useState<PinDetails | null>(initialDetails);
  const [fetching, setFetching] = useState(!initialDetails);
  const [moving, setMoving] = useState(false);
  const [highlight, setHighlight] = useState<{ id?: string; key: number }>({ id: startPlace?.id, key: 0 });
  const [overlayOpen, setOverlayOpen] = useState(!!params.expanded);
  const [zoomSearch, setZoomSearch] = useState(false);
  const [closing, setClosing] = useState(false);
  const [hideMapComponents, setHideMapComponents] = useState(false);
  const [center, setCenter] = useState<MapPoint>(start);

  const movingRef = useRef(false);
  const pointerDown = useRef(false);
  const skipFetch = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fetchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const getCenter = useCallback((): MapPoint => ({ x: VW / 2 - x.get(), y: VH / 2 - y.get() }), [x, y]);

  const fetchDetails = useCallback(() => {
    clearTimeout(fetchTimer.current);
    setFetching(true);
    fetchTimer.current = setTimeout(() => {
      const p = getCenter();
      setCenter(p);
      setDetails(reverseGeocode(p));
      setFetching(false);
    }, 550);
  }, [getCenter]);

  // initial reverse geocode (create flow without a preset place)
  useEffect(() => {
    if (!initialDetails) fetchDetails();
    return () => {
      clearTimeout(fetchTimer.current);
      clearTimeout(settleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settle = useCallback(() => {
    if (pointerDown.current) {
      settleTimer.current = setTimeout(settle, 120);
      return;
    }
    movingRef.current = false;
    setMoving(false);
    setCenter(getCenter());
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    fetchDetails();
  }, [fetchDetails, getCenter]);

  // onRegionChange + debounce → isMapDragging
  const onRegionChange = useCallback(() => {
    if (!movingRef.current) {
      movingRef.current = true;
      setMoving(true);
      clearTimeout(fetchTimer.current);
      if (!skipFetch.current) setHighlight((h) => ({ id: undefined, key: h.key }));
    }
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(settle, 260);
  }, [settle]);
  useMotionValueEvent(x, 'change', onRegionChange);
  useMotionValueEvent(y, 'change', onRegionChange);

  /** movePin → mapRef.animateToRegion */
  const movePin = useCallback(
    (p: MapPoint, skipDetailsFetch: boolean) => {
      skipFetch.current = skipDetailsFetch;
      const opts = handoff.spring; // Test01 movement spring
      animate(x, VW / 2 - p.x, opts);
      animate(y, VH / 2 - p.y, opts);
    },
    [x, y],
  );

  // SearchScreen → onSelectAddress
  const isTop = useIsTop();
  useEffect(() => {
    if (!isTop) return;
    setZoomSearch(false); // startZoomOutAnimation
    const sel = addressStore.consumeSearchSelection();
    if (sel) {
      const p = sel.place;
      setDetails({ placeName: p.placeName, area: p.area, propertyName: p.propertyName, streetName: p.streetName, isServiceable: true, placeId: p.id });
      setFetching(false);
      setHighlight((h) => ({ id: p.id, key: h.key + 1 }));
      movePin(p, true);
    }
  }, [isTop, movePin]);

  // LocationAccess "Allow access" / search "Use my current location"
  const lastLocate = useRef(locateRequest);
  useEffect(() => {
    if (locateRequest === lastLocate.current) return;
    lastLocate.current = locateRequest;
    movePin(CURRENT_LOCATION, false);
  }, [locateRequest, movePin]);

  // withLocationPrompt → AddressV2LocationAccessScreen after 500ms when permission is denied
  useEffect(() => {
    if (!params.withLocationPrompt || addressStore.get().locationGranted) return;
    const timer = setTimeout(() => nav.sheet('address/locationAccess'), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openSearch = () => {
    setZoomSearch(true); // startZoomInAnimation
    setTimeout(() => nav.push('address/search'), 150);
  };

  const onLocateMePress = () => {
    if (!addressStore.get().locationGranted) {
      nav.sheet('address/locationAccess');
      return;
    }
    movePin(CURRENT_LOCATION, false);
  };

  const loading = fetching || moving;
  const serviceable = details?.isServiceable ?? true;
  const farAway = locationGranted ? distanceFromCurrent(center) : 0;
  const showFarNote = farAway > FAR_AWAY_DISTANCE_THRESHOLD && serviceable && !loading && !!details;

  let tooltip = '';
  if (!loading && details) tooltip = serviceable ? t.address_v2_map_pin_success_title : t.address_v2_map_pin_unserviceable_title;

  const confirmTitle = flow === 'update' ? t.address_v2_edit_address_details : t.address_v2_add_address_details;

  const mapScale = overlayOpen || hideMapComponents ? addressMetrics.mapZoomOverlay : zoomSearch ? addressMetrics.mapZoomSearch : 1;
  const mapScaleTransition = zoomSearch && !overlayOpen ? { duration: duration.fast, ease: easing.in } : { duration: duration.base, ease: easing.inOut, delay: overlayOpen ? 0.05 : 0 };

  const formInitialValues: AddressFormValues = editing
    ? {
        firstName: editing.firstName,
        lastName: editing.lastName,
        phoneNumber: editing.phone,
        dialCode: editing.dialCode,
        apartmentNumber: editing.unitIdentifier,
        buildingName: editing.propertyName || details?.propertyName || '',
        streetName: editing.streetName || details?.streetName || '',
        directions: editing.directions ?? '',
        nickname: editing.nickname ?? '',
        tag: editing.label,
      }
    : {
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: userPhone,
        dialCode: userDialCode,
        apartmentNumber: '',
        buildingName: details?.propertyName ?? '',
        streetName: details?.streetName ?? '',
        directions: '',
        nickname: '',
        tag: 'HOME',
      };

  const onSubmit = async (v: AddressFormValues) => {
    await new Promise((r) => setTimeout(r, 900)); // AddressService.createLatLngAddress / updateLatLngAddressV2
    const base: SavedAddress = {
      id: editing?.id ?? addressStore.nextId(),
      code: editing?.code ?? `AE-NEW-${Date.now()}`,
      label: v.tag,
      nickname: v.nickname.trim() || undefined,
      unitIdentifier: v.apartmentNumber.trim(),
      propertyName: v.buildingName.trim(),
      streetName: v.streetName.trim() || undefined,
      directions: v.directions.trim() || undefined,
      placeName: details?.placeName ?? '',
      area: details?.area ?? '',
      location: getCenter(),
      distance: locationGranted
        ? editing && Math.hypot(editing.location.x - getCenter().x, editing.location.y - getCenter().y) < 4
          ? editing.distance
          : (places.find((pl) => pl.id === details?.placeId)?.distanceText ?? distanceToText(Math.max(0.01, distanceFromCurrent(getCenter()))))
        : null,
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      dialCode: v.dialCode,
      phone: v.phoneNumber.replace(/\s/g, ''),
      isPhoneVerified: editing ? editing.isPhoneVerified && editing.phone === v.phoneNumber : v.phoneNumber === userPhone,
      isShareable: true,
    };
    if (editing) {
      // onAddressV2Update → closeBottomSheet + dismissModal, SelectScreen shows "Address updated"
      setOverlayOpen(false);
      addressStore.update(base);
      addressStore.toast(t.address_v2_updated_address_toast_message);
      nav.back();
      return;
    }
    // onAddressCreate (optInCreateAnimation) → close overlay with zoom + fade → success screen
    setClosing(true);
    await new Promise((r) => setTimeout(r, 350));
    setHideMapComponents(true);
    nav.push('address/success', { address: base, line: `${singleLineAddress(base)}, ${base.area}` });
  };

  const collapsedContent = (
    <div className={styles.footerContent}>
      <div className={styles.footerTop} data-bordered={showFarNote}>
        {loading ? (
          <LocationLoading />
        ) : !details ? null : !serviceable ? (
          <UnserviceableView style={{ padding: 8, background: ref.palette('antiFlashWhite'), borderRadius: 16 }} />
        ) : (
          <LocationSummary variant="MAP" placeName={details.placeName} area={details.area} style={showFarNote ? { borderRadius: 16, background: ref.color('bgSurface'), padding: 8 } : { background: ref.color('bgSurface') }} />
        )}
        {showFarNote && <div className={styles.distanceNote}>{t.address_v2_current_location_distance_note(distanceToText(farAway))}</div>}
      </div>
    </div>
  );

  const fixedAction = !loading ? (
    !serviceable ? (
      <OverlayButton title={t.address_v2_search_address} onPress={openSearch} />
    ) : (
      <OverlayButton title={overlayOpen ? t.save : confirmTitle} disabled={!details} onPress={() => setOverlayOpen(true)} />
    )
  ) : null;

  return (
    <Screen background="addrMapBg" safeTop={false} contentStyle={{ overflow: 'hidden', paddingBottom: 0 }}>
      <div className={styles.viewport}>
        <motion.div className={styles.scaler} animate={{ scale: mapScale }} transition={mapScaleTransition}>
          <motion.div
            className={styles.world}
            style={{ x, y, width: WORLD, height: WORLD }}
            drag={!overlayOpen && !closing}
            dragConstraints={{ left: VW / 2 - WORLD + 60, right: VW / 2 - 60, top: VH / 2 - WORLD + 60, bottom: VH / 2 - 60 }}
            dragElastic={0.08}
            dragTransition={{ power: 0.25, timeConstant: 220 }}
            onPointerDown={() => {
              pointerDown.current = true;
            }}
            onPointerUp={() => {
              pointerDown.current = false;
            }}
            onPointerCancel={() => {
              pointerDown.current = false;
            }}
            onDragEnd={() => {
              pointerDown.current = false;
            }}
          >
            <StreetMap highlightPlaceId={hideMapComponents ? undefined : highlight.id} highlightKey={highlight.key} />
            {locationGranted && !hideMapComponents && (
              <div className={styles.userLocation} style={{ left: CURRENT_LOCATION.x - 50, top: CURRENT_LOCATION.y - 60 }}>
                <Lottie src={lotties.currentLocation} loop style={{ width: 100, height: 120 }} />
              </div>
            )}
          </motion.div>
        </motion.div>

        {!hideMapComponents && (
          <>
            <div className={styles.mapHeader}>
              <MapSearchButton onBack={nav.back} onPress={openSearch} />
            </div>
            <MapPin title={tooltip} isError={!serviceable && !loading} isMapDragging={moving} pinScale={zoomSearch ? 0 : 1} />
            <FloatingOverlay
              expanded={overlayOpen}
              closing={closing}
              onOverlayClose={() => setOverlayOpen(false)}
              topContent={!loading ? <CurrentLocationButton onPress={onLocateMePress} /> : null}
              collapsedContent={collapsedContent}
              fixedAction={fixedAction}
              expandedContent={
                details ? (
                  <AddressDetailsForm
                    key={`${details.placeName}-${editing?.id ?? 'new'}`}
                    initialValues={formInitialValues}
                    placeName={details.placeName}
                    area={details.area}
                    onClose={() => setOverlayOpen(false)}
                    onChangeLocation={() => setOverlayOpen(false)}
                    onSubmit={onSubmit}
                  />
                ) : null
              }
            />
          </>
        )}
      </div>
      <AddressToastHost />
    </Screen>
  );
}
