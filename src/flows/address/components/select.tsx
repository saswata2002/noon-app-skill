import { motion } from 'motion/react';
import { handoff } from '../../../motion/presets';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { DottedDivider, MaskIcon, Pressable, Skeleton, Spinner } from '../../../components';
import { icons } from '../assets';
import { addressTitle, fullPhone, singleLineAddress, t, type AddressTag, type Place, type SavedAddress } from '../data';
import { IconTap, Img } from './primitives';
import styles from './select.module.css';
import { ref } from '../../../foundations/tokens';

const tagIcon: Record<AddressTag, string> = { HOME: icons.homeTag, WORK: icons.officeTag, OTHER: icons.otherTag };

/** MapV2ScreenHeader as used by the SelectScreen Wrapper (back.webp tinted #262A33, title 18/600 black). */
export function SelectHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className={styles.header}>
      <button type="button" className={styles.headerBack} onClick={onBack} aria-label="Back">
        <MaskIcon src={icons.back} size={24} color={ref.palette('newBlack')} />
      </button>
      <div className={styles.headerMiddle}>
        <span className={styles.headerTitle}>{title}</span>
      </div>
    </div>
  );
}

/** TabSwitcher — pill track, white indicator slides 300ms Easing.out(cubic). */
export function TabSwitcher({ tabs, selected, onPress, tabWidth }: { tabs: string[]; selected: number; onPress: (i: number) => void; tabWidth: number }) {
  return (
    <div className={styles.tabs}>
      {tabs.map((tab, i) => (
        <button key={tab} type="button" className={styles.tab} onClick={() => onPress(i)}>
          <span className={styles.tabText} data-active={selected === i}>
            {tab}
          </span>
        </button>
      ))}
      <motion.div className={styles.tabIndicator} style={{ width: tabWidth }} animate={{ x: selected * tabWidth }} transition={handoff.spring} />
    </div>
  );
}

/** AddressV2SearchInput — 12px radius white field, 17px search icon. */
export function SearchInput({ value, onChange, disabled, style }: { value: string; onChange: (v: string) => void; disabled?: boolean; style?: CSSProperties }) {
  return (
    <label className={styles.searchInput} style={style}>
      <MaskIcon src={icons.locationSearch} size={17} color="var(--nk-color-text-muted)" style={{ marginInlineEnd: 2, position: 'relative', left: 8 }} />
      <input className={styles.searchInputField} value={value} onChange={(e) => onChange(e.target.value)} placeholder={t.address_v2_map_search_button} disabled={disabled} />
    </label>
  );
}

/** AddressV2AddAddressButton — accent icon + 15/600 text + blue chevron, press scale 0.97 spring 300/20/0.5. */
export function AddAddressButton({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <Pressable asDiv className={styles.addAddress} scale={0.97} transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.5 }} onClick={onPress}>
      <span className={styles.addAddressLeft}>
        <MaskIcon src={icons.addAddress} size={20} color="var(--nk-color-cta)" />
        <span className={styles.addAddressText}>{text}</span>
      </span>
      <MaskIcon src={icons.chevronRightBlue} size={16} color="var(--nk-color-cta)" />
    </Pressable>
  );
}

/** AddressV2LocationNudge */
export function LocationNudge({ onEnable }: { onEnable: () => void }) {
  return (
    <div className={styles.nudge}>
      <div className={styles.nudgeLeft}>
        <MaskIcon src={icons.currentLocationCrosshairV2} size={20} color="var(--nk-color-cta)" style={{ marginInlineStart: 5 }} />
        <div className={styles.nudgeText}>
          <span className={styles.nudgeTitle}>{t.address_v2_enable_location_title}</span>
          <span className={styles.nudgeSub}>{t.address_v2_enable_location_subtitle}</span>
        </div>
      </div>
      <Pressable className={styles.nudgeCta} onClick={onEnable}>
        {t.address_v2_enable_location_button_title}
      </Pressable>
    </div>
  );
}

/** Header block of the listing: [location nudge + dotted divider] + add new address, in a white 16-radius card. */
export function ListingHeader({ children }: { children: ReactNode }) {
  return <div className={styles.listingHeader}>{children}</div>;
}

/** AddressV2AddressesListingItem (lat/lng). */
export function AddressCard({
  address,
  isSelected,
  isFirst,
  isLoading,
  disabled,
  onPress,
  onThreeDots,
  onShare,
}: {
  address: SavedAddress;
  isSelected: boolean;
  isFirst: boolean;
  isLoading: boolean;
  disabled: boolean;
  onPress: () => void;
  onThreeDots: () => void;
  onShare: () => void;
}) {
  const title = addressTitle(address);
  const truncated = title.length > 25 ? `${title.slice(0, 25)}...` : title;
  const accent = isSelected ? 'var(--nk-color-link)' : 'var(--nk-color-text-secondary)';
  return (
    <div
      role="button"
      tabIndex={0}
      className={styles.card}
      data-first={isFirst}
      data-disabled={disabled}
      onClick={disabled ? undefined : onPress}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && onPress()}
    >
      <div className={styles.cardWrapper} data-selected={isSelected}>
        <div className={styles.cardHeader} data-selected={isSelected}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.tagPillOuter}>
              <span className={styles.tagPillInner} data-selected={isSelected}>
                <MaskIcon src={tagIcon[address.label]} size={20} color={accent} />
              </span>
            </span>
            <span className={styles.nickname}>{truncated}</span>
            {address.distance != null && (
              <span className={styles.distancePill}>
                <span className={styles.distancePillText} style={{ color: accent }}>
                  {address.distance}
                </span>
              </span>
            )}
          </div>
          <div className={styles.actionIcons}>
            {address.isShareable && (
              <IconTap label={t.share} onPress={onShare} disabled={disabled}>
                <Img src={icons.share} width={20} height={20} />
              </IconTap>
            )}
            <IconTap label="More" onPress={onThreeDots} disabled={disabled}>
              <Img src={icons.controls} width={20} height={20} />
            </IconTap>
          </div>
        </div>
        <div className={styles.cardBody}>
          <span className={styles.addressText}>{`${singleLineAddress(address)}, ${address.area || ''}`}</span>
          <div className={styles.cardDivider}>
            <DottedDivider />
          </div>
          <div className={styles.second}>
            <span className={styles.name}>{`${address.firstName} ${address.lastName}`}</span>
            <span className={styles.phoneContainer}>
              <span className={styles.comma}>, </span>
              <span className={styles.phone}>{fullPhone(address)}</span>
              {address.isPhoneVerified && <Img src={icons.verified} width={14} height={14} style={{ marginLeft: 4 }} />}
            </span>
          </div>
        </div>
      </div>
      {isLoading && (
        <div className={styles.cardCover}>
          <Spinner variant="ios" color="var(--nk-color-cta)" />
        </div>
      )}
    </div>
  );
}

/** AddressV2LatLngAddressesListingEmpty */
export function ListingEmpty({ icon, title, substring, substrings, onButtonPress }: { icon: string; title: string; substring?: string; substrings?: { icon: string; text: string }[]; onButtonPress?: () => void }) {
  return (
    <div className={styles.empty}>
      <Img src={icon} width={230} height={175} />
      <div className={styles.emptyInfo}>
        <span className={styles.emptyTitle}>{title}</span>
        {substring && <span className={styles.emptySub}>{substring}</span>}
        {substrings && (
          <div className={styles.emptySubs}>
            {substrings.map((s) => (
              <div key={s.text} className={styles.emptySubItem}>
                <Img src={s.icon} width={16} height={16} />
                <span className={styles.emptySubText}>{s.text}</span>
              </div>
            ))}
          </div>
        )}
        {onButtonPress && (
          <Pressable className={styles.emptyButton} onClick={onButtonPress}>
            {t.address_v2_empty_button_text}
          </Pressable>
        )}
      </div>
    </div>
  );
}

/** AddressV2AddressesListingLoading — search field + add button + 5 card skeletons. */
export function ListingLoading() {
  return (
    <div className={styles.loading}>
      <div className={styles.loadingInput}>
        <Skeleton look="band" width={17} height={17} radius={4} />
        <Skeleton look="band" height={14} radius={4} style={{ flex: 1, marginInlineStart: 20 }} />
      </div>
      <div className={styles.loadingAdd}>
        <span className={styles.loadingAddLeft}>
          <Skeleton look="band" width={20} height={20} radius={4} />
          <Skeleton look="band" width={200} height={14} radius={4} style={{ marginInlineStart: 17 }} />
        </span>
        <Skeleton look="band" width={16} height={16} radius={4} />
      </div>
      <div className={styles.loadingCards}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.loadingCard}>
            <div className={styles.loadingCardHeader}>
              <Skeleton look="band" width={40} height={40} radius={8} style={{ marginInlineEnd: 12 }} />
              <Skeleton look="band" height={20} radius={10} style={{ flex: 1, marginInlineEnd: 8 }} />
              <Skeleton look="band" width={60} height={20} radius={10} />
            </div>
            <div style={{ marginTop: 8 }}>
              <Skeleton look="band" height={16} radius={8} style={{ marginBottom: 8 }} />
              <div className={styles.loadingCardDivider} />
              <div style={{ display: 'flex' }}>
                <Skeleton look="band" width={120} height={16} radius={8} style={{ marginInlineEnd: 8 }} />
                <Skeleton look="band" width={100} height={16} radius={8} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** AddressV2SearchResult */
export function SearchResult({ place, onPress, loading, disabled }: { place: Place; onPress: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <button type="button" className={styles.result} disabled={disabled} onClick={onPress}>
      <span className={styles.resultRow}>
        <span className={styles.resultText}>
          <span className={styles.resultPrimary}>{place.placeName}</span>
          <span className={styles.resultSecondary}>{place.area}</span>
        </span>
        {place.distanceText && <span className={styles.resultDistance}>{t.address_v2_distance_text(place.distanceText)}</span>}
      </span>
      {loading && (
        <span className={styles.resultCover}>
          <Spinner variant="ios" color="var(--nk-color-cta)" />
        </span>
      )}
    </button>
  );
}

/** AddressV2SearchResultLoading — 50px circle + two 20px lines. */
export function SearchResultLoading({ style }: { style?: CSSProperties }) {
  return (
    <div className={styles.resultLoading} style={style}>
      <Skeleton look="band" width={50} height={50} radius={25} style={{ marginInlineEnd: 10, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <Skeleton look="band" height={20} radius={8} />
        <div style={{ height: 10 }} />
        <Skeleton look="band" height={20} radius={8} />
      </div>
    </div>
  );
}

/** White 16-radius card of search results with dotted separators (Listing search section / ResultScrollView). */
export function SearchResultsCard({ results, onPress, style }: { results: Place[]; onPress: (p: Place) => void; style?: CSSProperties }) {
  const [pressed, setPressed] = useState<string | null>(null);
  return (
    <div className={styles.resultsCard} style={style}>
      {results.map((p, i) => (
        <div key={p.id}>
          <SearchResult
            place={p}
            loading={pressed === p.id}
            disabled={!!pressed}
            onPress={() => {
              setPressed(p.id);
              setTimeout(() => {
                setPressed(null);
                onPress(p);
              }, 450);
            }}
          />
          {i < results.length - 1 && (
            <div className={styles.resultsSeparator}>
              <DottedDivider />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
