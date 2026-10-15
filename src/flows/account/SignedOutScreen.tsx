import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Button, Screen } from '../../components';
import { useNav } from '../../kit/Navigator';
import { AccountFooter } from './components/AccountFooter';
import { CountryRow, LanguageRow, MenuGroup } from './components/MenuGroup';
import { signedOutSlides } from './data';
import { accountTokens } from './tokens';
import styles from './account.module.css';
import { ref } from '../../foundations/tokens';
import { palette } from '../../foundations/palette';
import { useReduceMotion } from '../../motion/reducedMotion';
import { duration, easing } from '../../motion/presets';

/** Signed-out Account: blue hero (320 + status bar) with swipeable frames + dots, black Login/Sign up CTA. */
export function SignedOutScreen() {
  const nav = useNav();
  const [i, setI] = useState(0);
  const reduce = useReduceMotion();
  useEffect(() => {
    // reduced motion: no auto-advance (still swipeable)
    if (reduce) return;
    const t = setInterval(() => setI((x) => (x + 1) % signedOutSlides.length), 3500);
    return () => clearInterval(t);
  }, [reduce]);
  const s = signedOutSlides[i];

  return (
    <Screen background="bgPage" withTabBar safeTop={false}>
      <motion.div
        className={styles.hero}
        style={{ height: `calc(${accountTokens.heroHeight}px + var(--nk-inset-top))`, background: accountTokens.heroBlue }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => Math.abs(info.offset.x) > 50 && setI((x) => (x + 1) % signedOutSlides.length)}
      >
        <span className={styles.heroBubble} style={{ width: 220, height: 220, top: 40, right: -60 }} />
        <span className={styles.heroBubble} style={{ width: 140, height: 140, bottom: 30, left: -40 }} />
        <AnimatePresence mode="wait">
          <motion.div key={s.id} className={styles.heroContent} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: duration.medium, ease: easing.inOut }}>
            <motion.span
              className={styles.heroEmoji}
              animate={{ y: [0, -10, 0], rotate: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {s.emoji}
            </motion.span>
            <span className={styles.heroTitle}>{s.title}</span>
            <span className={styles.heroSubtitle}>{s.subtitle}</span>
          </motion.div>
        </AnimatePresence>
        <div className={styles.dots}>
          {signedOutSlides.map((d, idx) => (
            <motion.span key={d.id} animate={{ width: idx === i ? 22 : 8, background: idx === i ? palette.slateGray : palette.lightGreyColor }} transition={{ duration: duration.medium, ease: easing.inOut }} style={{ height: 8, borderRadius: 4 }} />
          ))}
        </div>
      </motion.div>
      <div className={styles.page} style={{ gap: 16, paddingTop: 16 }}>
        <div style={{ margin: '0 15px' }}>
          <Button variant="dark" size="lg" block onClick={() => nav.reset('account/account')} style={{ minHeight: 60, borderRadius: 14, font: ref.type('text17SemiboldLh20') }}>
            Login/Sign up
          </Button>
        </div>
        <MenuGroup items={[]} extra={[<LanguageRow key="lang" />, <CountryRow key="country" />]} />
        <AccountFooter />
      </div>
    </Screen>
  );
}
