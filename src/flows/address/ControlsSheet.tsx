import { AnimatePresence, motion } from 'motion/react';
import { duration, easing, handoff } from '../../motion/presets';
import { Fragment, useState } from 'react';
import { useNav } from '../../kit/Navigator';
import type { ScreenProps } from '../../kit/types';
import { icons } from './assets';
import { Img } from './components/primitives';
import { singleLineAddress, t } from './data';
import { addressStore, useAddressStore } from './store';
import { DottedDivider } from '../../components';
import styles from './address.module.css';

export interface ControlsParams {
  id?: number;
}

/** timing: the Test01 motion reference */
const deleteSpring = handoff.spring;

/**
 * AddressV2AddressControlsScreen — Edit / Share / Verify / Delete. Delete cross-fades (250ms) to the
 * "Delete this address?" confirmation whose title block drops in from -100 and buttons rise from +100.
 * Delete is hidden for the selected (default) address, like isDeleteDisabled in SelectScreen.
 */
export function ControlsSheet({ params }: ScreenProps<ControlsParams>) {
  const nav = useNav();
  const addresses = useAddressStore((s) => s.addresses);
  const defaultId = useAddressStore((s) => s.defaultId);
  const address = addresses.find((a) => a.id === params.id) ?? addresses.find((a) => a.id !== defaultId) ?? addresses[0];
  const [mode, setMode] = useState<'controls' | 'delete'>('controls');
  if (!address) return null;

  const isDeleteDisabled = address.id === defaultId;

  const onEdit = () => {
    nav.back();
    setTimeout(() => nav.push('address/map', { flow: 'update', addressId: address.id }), 220);
  };

  const onDeleteConfirm = () => {
    nav.back();
    addressStore.setLoading(address.code);
    setTimeout(() => {
      addressStore.remove(address.id);
      addressStore.setLoading(null);
    }, 650);
  };

  const onVerify = () => {
    nav.back();
    setTimeout(() => {
      addressStore.verify(address.phone);
      nav.toast('Number verified (AddressPhoneVerificationV2Screen is not part of this prototype)');
    }, 300);
  };

  const actions = [
    { key: 'edit', icon: icons.editControl, text: t.edit, onPress: onEdit, show: true },
    { key: 'share', icon: icons.share, text: t.share, onPress: () => nav.toast('Opens the native share sheet with the address link'), show: address.isShareable },
    { key: 'verify', icon: icons.verifyControl, text: t.verify_number, onPress: onVerify, show: !address.isPhoneVerified && !!address.phone },
    { key: 'delete', icon: icons.deleteControl, text: t.delete, onPress: () => setMode('delete'), show: !isDeleteDisabled },
  ].filter((a) => a.show);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {mode === 'controls' ? (
        <motion.div key="controls" className={styles.controls} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: duration.base, ease: easing.inOut }}>
          {actions.map((a, i) => (
            <Fragment key={a.key}>
              {i > 0 && (
                <div className={styles.actionDivider}>
                  <DottedDivider />
                </div>
              )}
              <button type="button" className={styles.actionItem} onClick={a.onPress}>
                <span className={styles.buttonView}>
                  <Img src={a.icon} width={24} height={20} />
                  <span className={styles.actionText}>{a.text}</span>
                </span>
              </button>
            </Fragment>
          ))}
        </motion.div>
      ) : (
        <motion.div key="delete" className={styles.deleteModal} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: duration.medium, ease: easing.inOut }}>
          <motion.div initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100, transition: { duration: duration.base, ease: easing.in } }} transition={deleteSpring}>
            <div className={styles.deleteTitle}>{t.address_v2_delete_modal_title}</div>
            <div className={styles.deleteBox}>
              {address.area && <span className={styles.deleteArea}>{address.area}</span>}
              <span className={styles.deleteLine}>{singleLineAddress(address)}</span>
            </div>
          </motion.div>
          <motion.div className={styles.deleteButtons} initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100, transition: { duration: duration.base, ease: easing.in } }} transition={deleteSpring}>
            <button type="button" className={`${styles.deleteButton} ${styles.cancelButton}`} onClick={() => setMode('controls')}>
              {t.common_cancel}
            </button>
            <button type="button" className={`${styles.deleteButton} ${styles.confirmButton}`} onClick={onDeleteConfirm}>
              {t.yes}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
