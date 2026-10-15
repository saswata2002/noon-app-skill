import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNav } from '../../../kit/Navigator';
import { duration, easing } from '../../../motion/presets';
import { countryFlags, languages, type LanguageId, type MenuItem } from '../data';
import { AccountIconImg } from '../icons';
import { useAccountState } from '../store';
import { accountTokens } from '../tokens';
import { AccountSection, AccountSectionItem } from './AccountSection';
import styles from '../inner.module.css';

/** Opens a menu row's target: a kit route (screen / sheet / modal) or a toast. */
export function useOpenMenuItem() {
  const nav = useNav();
  return (m: MenuItem) => {
    if (m.route) nav.push(m.route, {}, m.presentation ? { presentation: m.presentation } : undefined);
    else nav.toast(m.toast ?? m.title);
  };
}

/** A NoonAccountSection of NoonAccountSectionItems with 20×20 original icons. */
export function MenuGroup({ items, extra }: { items: MenuItem[]; extra?: ReactNode[] }) {
  const open = useOpenMenuItem();
  return (
    <AccountSection>
      {[
        ...items.map((m) => <AccountSectionItem key={m.id} before={<AccountIconImg name={m.icon} size={20} />} title={m.title} onPress={() => open(m)} />),
        ...(extra ?? []),
      ]}
    </AccountSection>
  );
}

/**
 * NoonAccountLanguageSwitcher: 126×40 pill, white 59×30 slider slides 250ms (Easing.out(cubic)),
 * then the full-screen change-language lottie opens as a fading modal.
 */
export function LanguageSwitcher() {
  const nav = useNav();
  const { language } = useAccountState();
  const [selected, setSelected] = useState<LanguageId>(language);
  const index = languages.findIndex((l) => l.id === selected);

  const onSelect = (id: LanguageId) => {
    if (id === selected) return;
    setSelected(id);
  };

  return (
    <div className={styles.lang}>
      <motion.span
        className={styles.langSlider}
        initial={false}
        animate={{ insetInlineStart: 4 + index * accountTokens.langItem }}
        transition={{ duration: duration.medium, ease: easing.out }}
        onAnimationComplete={() => {
          if (selected !== language) nav.push('account/changeLanguage', { language: selected }, { presentation: 'modal', transition: 'fade' });
        }}
      />
      {languages.map((l) => (
        <button key={l.id} type="button" className={styles.langOption} data-ar={l.id !== 'en'} data-active={selected === l.id} disabled={selected === l.id} onClick={() => onSelect(l.id)}>
          {l.label}
        </button>
      ))}
    </div>
  );
}

/** Language row (containerStyle paddingVertical 8) with the inline switcher. */
export function LanguageRow() {
  return <AccountSectionItem before={<AccountIconImg name="language" size={20} />} title="Language" after={<LanguageSwitcher />} rowStyle={{ paddingTop: 8, paddingBottom: 8 }} />;
}

/** Country row: flag (27×17) + noon chevron; opens the country selector bottom sheet. */
export function CountryRow() {
  const nav = useNav();
  const { country } = useAccountState();
  return (
    <AccountSectionItem
      before={<AccountIconImg name="country" size={20} />}
      title="Country"
      onPress={() => nav.sheet('account/country')}
      after={
        <>
          <img src={countryFlags[country]} alt={country} width={27} height={17} style={{ display: 'block' }} />
          <AccountIconImg name="chevron" flipRtl />
        </>
      }
    />
  );
}
