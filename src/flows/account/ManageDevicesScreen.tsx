import { AnimatePresence, motion } from 'motion/react';
import { duration, easing, handoff } from '../../motion/presets';
import { Fragment, useEffect, useState } from 'react';
import { DottedDivider, Pressable, Screen, Spinner } from '../../components';
import { useNav } from '../../kit/Navigator';
import { copy, type Device } from './data';
import { AccountIconImg } from './icons';
import { useAccountState } from './store';
import styles from './inner.module.css';

const d = copy.devices;

/** API returns a device icon URL; mocked with simple line glyphs. */
function DeviceGlyph({ kind }: { kind: Device['kind'] }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (kind === 'laptop')
    return (
      <svg {...common} className={styles.deviceIcon}>
        <rect x="4" y="5" width="16" height="11" rx="1.5" />
        <path d="M2.5 19h19" />
      </svg>
    );
  if (kind === 'tablet')
    return (
      <svg {...common} className={styles.deviceIcon}>
        <rect x="5" y="2.5" width="14" height="19" rx="2" />
        <path d="M11 18.5h2" />
      </svg>
    );
  return (
    <svg {...common} className={styles.deviceIcon}>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11 18.5h2" />
    </svg>
  );
}

/** NoonSecurityDeviceItem: 24px icon, name 15/600, location + status 13 slateGray, outlined r20 "Sign out" pill. */
function DeviceItem({ device, onSignOut }: { device: Device; onSignOut: (d: Device) => void }) {
  const location = [device.city, device.country].filter(Boolean).join(', ');
  return (
    <div className={styles.deviceItem}>
      <DeviceGlyph kind={device.kind} />
      <div className={styles.deviceInfo}>
        <span className={styles.deviceName}>{device.deviceName}</span>
        {location && <span className={styles.deviceSub}>{location}</span>}
        {device.activityStatus && <span className={styles.deviceDate}>{device.activityStatus}</span>}
      </div>
      <Pressable className={styles.deviceSignOut} onClick={() => onSignOut(device)} scale={0.95}>
        <span>{d.signOut}</span>
      </Pressable>
    </div>
  );
}

/** NoonSecurityScreenHeader: white, statusbar + 12 padding, 36px round back icon, 16/bold title. */
export function SecurityScreenHeader({ title }: { title: string }) {
  const nav = useNav();
  return (
    <div className={styles.secHeader}>
      <Pressable onClick={nav.back} aria-label="Back" style={{ display: 'flex' }}>
        <AccountIconImg name="back" flipRtl />
      </Pressable>
      <span className={styles.secHeaderTitle}>{title}</span>
    </div>
  );
}

/**
 * NoonAccountSecuritySettingsManageAllDevicesScreen: "This device" card, "Other devices (n)" list with dashed dividers,
 * red "Sign out of all other devices" link. Each sign-out opens the shared confirmation sheet; removed rows fade out (300ms)
 * and the list re-flows (LinearTransition 300ms).
 */
export function ManageDevicesScreen() {
  const nav = useNav();
  const { devices } = useAccountState();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const current = devices.find((x) => x.currentDevice);
  const others = devices.filter((x) => !x.currentDevice);

  const onSignOut = (device: Device) =>
    nav.sheet('account/signOut', {
      kind: device.currentDevice ? 'current' : 'device',
      deviceId: device.id,
      title: d.signOutDeviceTitle(device.deviceName),
      description: d.signOutDeviceDescription,
    });

  return (
    <Screen header={<SecurityScreenHeader title={d.title} />} background="bgSubtle">
      {loading ? (
        <div className={styles.loader}>
          <Spinner size={28} thickness={3} track="var(--nk-color-border)" color="var(--nk-color-text-primary)" />
        </div>
      ) : (
        <div className={`${styles.devicesScreen} nk-content-in`}>
          {current && (
            <>
              <span className={styles.sectionLabel}>{d.thisDevice}</span>
              <div className={styles.deviceCard}>
                <DeviceItem device={current} onSignOut={onSignOut} />
              </div>
            </>
          )}
          <div className={styles.otherHeader}>
            <span className={styles.sectionLabel} style={{ margin: 0 }}>
              {others.length ? d.otherDevices(others.length) : d.otherDevicesTitle}
            </span>
          </div>
          <motion.div layout transition={handoff.spring} className={styles.deviceCard}>
            <AnimatePresence initial={false}>
              {others.map((dev, i) => (
                <motion.div key={dev.id} layout exit={{ opacity: 0, transition: { duration: duration.medium, ease: easing.inOut } }} transition={{ layout: handoff.spring }}>
                  <Fragment>
                    {i > 0 && <DottedDivider height={2} dash="4,4" cap="butt" width="93%" centered />}
                    <DeviceItem device={dev} onSignOut={onSignOut} />
                  </Fragment>
                </motion.div>
              ))}
            </AnimatePresence>
            {others.length === 0 && (
              <motion.div className={styles.emptyDevices} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AccountIconImg name="sessionEmpty" />
                <span className={styles.emptyDevicesTitle}>{d.noOtherDevices}</span>
              </motion.div>
            )}
          </motion.div>
          {others.length > 0 && (
            <Pressable
              className={styles.signOutAll}
              onClick={() => nav.sheet('account/signOut', { kind: 'all', title: d.signOutAllTitle, description: d.signOutAllDescription })}
            >
              {d.signOutAll}
            </Pressable>
          )}
        </div>
      )}
    </Screen>
  );
}
