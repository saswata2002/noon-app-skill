import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { DottedDivider, Pressable, Spinner, Switch } from '../../components';
import { useNav } from '../../kit/Navigator';
import { spring } from '../../motion/presets';
import { AccountSection, SheetBody, SheetButtons } from './components/AccountSection';
import { copy, languages, marketingPreferences, type LanguageId } from './data';
import { AccountIconImg } from './icons';
import { setAccountState, useAccountState } from './store';
import styles from './inner.module.css';

const n = copy.notifications;

/**
 * NoonAccountNotificationsSettings: loader (mocked 600ms) → push card (Open settings) + language TabSwitcher,
 * marketing preferences card with switches, Cancel / Save. Save persists to the flow store and dismisses.
 */
export function NotificationsSheet() {
  const nav = useNav();
  const state = useAccountState();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState<LanguageId>(state.notificationLanguage);
  const [values, setValues] = useState<Record<string, boolean>>(state.marketing);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const onSave = () => {
    setSaving(true);
    setTimeout(() => {
      setAccountState({ notificationLanguage: lang, marketing: values });
      nav.back();
    }, 500);
  };

  if (loading) {
    return (
      <SheetBody>
        <div className={styles.loader}>
          <Spinner size={28} thickness={3} track="var(--nk-color-border)" color="var(--nk-color-text-primary)" />
        </div>
      </SheetBody>
    );
  }

  const tabIndex = languages.findIndex((l) => l.id === lang);

  return (
    <SheetBody className="nk-content-in">
      <div className={styles.notifScroll}>
        <AccountSection dash="2,2" className={styles.notifCard}>
          <div className={styles.notifHeader}>
            <span className={styles.notifHeaderIcon}>
              <AccountIconImg name="notification" />
            </span>
            <span className={styles.notifHeaderText}>
              <span className={styles.notifTitle}>{n.pushTitle}</span>
              <span className={styles.notifSubtitle}>{n.pushSubtitle}</span>
            </span>
            <Pressable className={styles.openSettings} onClick={() => nav.toast('Opens iOS Settings › noon › Notifications')}>
              {n.openSettings}
            </Pressable>
          </div>
          <div>
            <div className={styles.notifHeader}>
              <span className={styles.notifHeaderIcon}>
                <AccountIconImg name="notificationLanguage" />
              </span>
              <span className={styles.notifHeaderText}>
                <span className={styles.notifTitle}>{n.languageTitle}</span>
                <span className={styles.notifSubtitle}>{n.languageSubtitle}</span>
              </span>
            </div>
            {/* TabSwitcher (isBottomSheet): #F2F3F7 pill, white indicator */}
            <div className={styles.tabSwitcher} role="tablist">
              <motion.span
                className={styles.tabIndicator}
                initial={false}
                animate={{ insetInlineStart: `calc(8px + ${tabIndex} * (100% - 16px) / 2)` }}
                transition={spring.gentle}
                style={{ width: 'calc((100% - 16px) / 2)' }}
              />
              {languages.map((l) => (
                <button key={l.id} type="button" role="tab" aria-selected={lang === l.id} className={styles.tab} data-active={lang === l.id} onClick={() => setLang(l.id)}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </AccountSection>

        <AccountSection dash="2,2" separator={false} className={styles.notifCard}>
          <div className={styles.notifHeader}>
            <span className={styles.notifHeaderIcon}>
              <AccountIconImg name="notificationPreferences" />
            </span>
            <span className={styles.notifHeaderText}>
              <span className={styles.notifTitle}>{n.marketingTitle}</span>
              <span className={styles.notifSubtitle}>{n.marketingSubtitle}</span>
            </span>
          </div>
          <div className={styles.prefsWrapper}>
            {marketingPreferences.map((pref, i) => (
              <div key={pref.code}>
                {i > 0 && <DottedDivider height={2} dash="2,2" cap="butt" centered />}
                <div className={styles.prefRow}>
                  <span className={styles.prefText}>{pref.text}</span>
                  <Switch value={!!values[pref.code]} label={pref.text} onChange={() => setValues((v) => ({ ...v, [pref.code]: !v[pref.code] }))} />
                </div>
              </div>
            ))}
          </div>
        </AccountSection>
      </div>
      <SheetButtons
        className={styles.notifButtons}
        cancelClass={styles.notifCancel}
        confirmClass={styles.notifSave}
        cancelLabel={copy.cancel}
        confirmLabel={copy.save}
        onCancel={nav.back}
        onConfirm={onSave}
        disabled={saving}
        loading={saving}
      />
    </SheetBody>
  );
}
