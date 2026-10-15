import { defineFlow } from '../../kit/registry';
import './transitions';
import { initialAddresses, singleLineAddress, t } from './data';
import { addressFlowTokens } from './tokens';
import { lazyScreen } from '../../kit/lazyScreen';

const ControlsSheet = lazyScreen(() => import('./ControlsSheet'), 'ControlsSheet');
const LocationAccessSheet = lazyScreen(() => import('./LocationAccessSheet'), 'LocationAccessSheet');
const MapScreen = lazyScreen(() => import('./MapScreen'), 'MapScreen');
const SearchScreen = lazyScreen(() => import('./SearchScreen'), 'SearchScreen');
const SelectScreen = lazyScreen(() => import('./SelectScreen'), 'SelectScreen');
const SuccessScreen = lazyScreen(() => import('./SuccessScreen'), 'SuccessScreen');

const SRC = 'src/screens/AddressV2';

export const addressFlow = defineFlow({
  id: 'address',
  title: 'Addresses',
  group: 'Profile',
  description:
    'AddressV2 address book from Account → Addresses (isBottomSheet false, doesChangeDefaultAddress true): saved addresses, set default, add via the map pin + details form, success animation, edit, delete, search and location permission.',
  initial: 'select',
  parent: 'account/account', // Back target when opened directly (no history)
  // opened from Account → Addresses: modals/sheets of this flow opened directly sit over the Account tab
  sheetBackdrop: 'account/account',
  tokens: addressFlowTokens,
  screens: [
    {
      id: 'select',
      title: 'Address Book',
      component: SelectScreen,
      presentation: 'modal',
      notes:
        'The page settles first, then the skeleton fades in and shimmers (650ms), then the search field, the header and each saved card resolve out of it top → bottom (default = blue header). Tap another card → loader + "Address updated" toast and it becomes the default; tap the default → "Address already selected". ⋯ opens Edit/Share/Verify/Delete. "Add new address" opens the map. Type in the search field to filter cards and get "Search results" (tap one to open the map there). Switch to Locker/ Pickup for the collection empty state. Param locationDenied: true shows the "Location not enabled" nudge.',
      source: `${SRC}/SelectScreen/{SelectScreen,Wrapper,styles}.ts(x), components/AddressV2/Select/**, components/AddressV2/Buttons/{AddAddress,LocationNudge}, components/AddressV2/Search/Input, components/TabSwitcher, components/MapV2/MapScreenHeader`,
    },
    {
      id: 'selectSheet',
      title: 'Address Book (bottom sheet)',
      component: SelectScreen,
      presentation: 'modal',
      // the overlay animates itself in and out (springs up, slides back down); the screen layer stays put
      transition: 'none',
      transparent: true,
      defaultParams: { isBottomSheet: true },
      parent: 'home/home',
      notes:
        'Home header address tap (NoonAddressSelector.changeAddress → AddressV2SelectScreen isBottomSheet). The tabs and saved addresses in the floating overlay over the page: it springs up and dims the page. Tap another address → loader, the sheet closes, then "Address updated"; tap the default → it closes with "Address already selected"; tap the dimmed page to close.',
      source: `${SRC}/SelectScreen/{SelectScreen,Wrapper,styles}.ts(x) (isBottomSheet), components/AddressV2/AddressFloatingOverlay (withSlideAnimation), marketplaces/noon/components/NoonAddressSelector (changeAddress)`,
    },
    {
      id: 'map',
      title: 'Map pin (add)',
      component: MapScreen,
      presentation: 'modal',
      transition: 'address-map',
      defaultParams: { flow: 'create' },
      notes:
        'Drag the map (with momentum): the pin lifts 12px, tooltip + summary clear and the CTA hides; on release the pin drops, the summary shimmers and the place under the pin appears ("Your order will be delivered here"). Drop it in the sea/marina/lakes for "Outside our service area :(". Far from the blue dot → yellow "Pin is … away" note. "Current location" recentres. Search bar → Search screen (map zooms 1.2, pin scales out). "Add address details" springs the overlay open with the form.',
      source: `${SRC}/LatLngMapScreen/LatLngMapScreen.tsx, components/MapV2/{Map,MapCover,MapPinTooltip,MapSearchButton,MapScreenUnServiceableView,MapKMLPolygons}, MapV2/MapFooter/LatLng/*, components/AddressV2/{AddressFloatingOverlay,Buttons/CurrentLocation,Buttons/AddressOverlayButton,LatLng/Location*}`,
    },
    {
      id: 'create',
      title: 'Address details (create)',
      component: MapScreen,
      presentation: 'modal',
      transition: 'address-map',
      defaultParams: { flow: 'create', placeId: 'marina-gate-2', expanded: true },
      notes:
        'LatLngCreateScreen inside the expanded map overlay: pin-island location card (Edit → back to the map), Home/Work/Other chips (field labels change per tag), floating-label inputs, collapsed receiver details (tap to expand). Save with empty required fields shows "This field is required"; a valid save closes the overlay with a zoom + fade and plays the success screen, then returns to the list with the new default address.',
      source: `${SRC}/LatLngCreateScreen/LatLngCreateScreen.tsx, components/AddressV2/LatLng/Form/**, components/AddressV2/Form/{DetailsContainer,Header,Footer,Input,TagSection,PropertyDetailsSection,CustomerSection}, components/AddressV2/AddressPhoneInput`,
    },
    {
      id: 'update',
      title: 'Address details (edit)',
      component: MapScreen,
      presentation: 'modal',
      transition: 'address-map',
      defaultParams: { flow: 'update', addressId: initialAddresses[1].id, expanded: true },
      notes: 'LatLngUpdateV2Screen: same form prefilled from the saved address (Work). Save → overlay closes, map dismisses and the list shows the "Address updated" toast.',
      source: `${SRC}/LatLngUpdateV2Screen/LatLngUpdateV2Screen.tsx (UI shared with LatLngCreateScreen)`,
    },
    {
      id: 'success',
      title: 'Address saved',
      component: SuccessScreen,
      transition: 'address-success',
      defaultParams: { line: `${singleLineAddress(initialAddresses[0])}, ${initialAddresses[0].area}` },
      notes: '2s save-success Lottie; title + address fade/slide in between 50–70% of the progress. In the flow it then adds the address and dismisses the map modal upwards.',
      source: `${SRC}/LatLngCreateSuccessScreen/{LatLngCreateSuccessScreen,styles}.ts(x)`,
    },
    {
      id: 'controls',
      title: 'Address controls',
      component: ControlsSheet,
      presentation: 'sheet', sheet: 'classic',
      defaultParams: { id: initialAddresses[2].id },
      notes: 'Edit → map in update flow. Share → native share (toast). Verify (unverified numbers only). Delete (hidden for the default address) cross-fades to "Delete this address?" → Yes removes the card with a loader.',
      source: `${SRC}/AddressControlsScreen/*, components/AddressV2/Screens/AddressControls/{Buttons/ActionControls,DeleteAddress}`,
    },
    {
      id: 'search',
      title: 'Search location',
      component: SearchScreen,
      presentation: 'modal',
      transition: 'address-search',
      notes: 'Autofocused search bar. Type e.g. "marina", "jlt", "tower" → results after the 500ms debounce (type "slow" to see the skeleton, gibberish for "Location not found"). Tap a result → back on the map with the pin moved there and the building outlined. "Use my current location" recentres the map.',
      source: `${SRC}/SearchScreen/{SearchScreen,styles}.ts(x), components/AddressV2/Search/Result/**, components/AddressV2/Buttons/{CurrentLocation,LocateOnMap}`,
    },
    {
      id: 'locationAccess',
      title: 'Location access',
      component: LocationAccessSheet,
      presentation: 'sheet', sheet: 'classic',
      notes: 'Shown by the map when "Add new address" is opened with location permission denied (try address/select with locationDenied: true). Allow access → map jumps to the blue dot; Search location → Search screen.',
      source: `${SRC}/LocationAccessScreen/{LocationAccessScreen,styles}.ts(x)`,
    },
    {
      id: 'locationOff',
      title: 'Address Book (location off)',
      component: SelectScreen,
      presentation: 'modal',
      defaultParams: { locationDenied: true },
      notes: 'Same list with device location denied: the "Location not enabled" nudge sits above "Add new address" (Enable grants it and the nudge collapses). "Add new address" then opens the map at the default Dubai region and, after 500ms, the Allow location access sheet.',
      source: `${SRC}/SelectScreen/SelectScreen.tsx (locationPermission PERMISSION_DENIED), components/AddressV2/Buttons/LocationNudge`,
    },
    {
      id: 'toast',
      title: 'Address toast',
      component: SelectScreen,
      defaultParams: { demoToast: t.address_v2_created_address_toast_message, skipLoading: true },
      notes: 'AddressToastScreen over the list: black pill, springs up from 50px, holds 3s, springs away. Fired by every add/update/default change in the flow.',
      source: `${SRC}/AddressToastScreen/{AddressToastScreen,styles}.ts(x), utils/Address/Utils.addressV2ShowToast`,
    },
  ],
});
