import { motion } from 'motion/react';
import { duration, easing, handoff } from '../../../motion/presets';
import { Lottie, Pressable } from '../../../components';
import { useIsNoonOneMember, useMembership, useMembershipEligibility } from '../../../kit/membership';
import { currency } from '../../../data';
import noonOneLogo from '@assets/noonone/entry/noon-account-noon-one-logo.lottie';
import noonAccountChevron from '@assets/icons/noon-account-chevron.svg';
import { useNav } from '../../../kit/Navigator';
import { user } from '../../../data';
import { useAccountState } from '../store';
import { accountTokens } from '../tokens';
import { EditRing } from './EditRing';
import styles from '../account.module.css';

/** NoonAccountNoonOne* SPRING_CONFIG (now the Test01 spring) after withDelay; opacity fades in on the Test01 ease-out */
const slide = (delay: number, x = -20) => ({
  initial: { x, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { x: { ...handoff.spring, delay }, opacity: { duration: duration.medium, ease: easing.out, delay } },
});

/** Profile header card + noon One strip (NoonAccountProfileHeader / NoonAccountNoonOne). */
export function ProfileCard({ noonOne: noonOneProp }: { noonOne?: boolean }) {
  const nav = useNav();
  // NoonAccountProfileHeader: loyalty.isNoonOneSubscribed → paleYellow→amber(.3) avatar with cocoaBrown initials
  const member = useIsNoonOneMember();
  const noonOne = noonOneProp ?? member;
  const { profile, profileCompletion: completion } = useAccountState();
  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`;
  const { avatar } = accountTokens;

  return (
    <div className={styles.profileCard}>
      {/* the whole header is a plain RN Pressable (no press visual) → openEditProfile */}
      <Pressable asDiv className={styles.profileRow} scale={1} onClick={() => nav.push('account/editProfile')}>
        <span className={`${styles.avatar} ${noonOne ? styles.avatarNoonOne : ''}`} style={noonOne ? { background: avatar.noonOneGradient, color: avatar.noonOneInk } : undefined}>
          {noonOne ? initials : initials.toUpperCase()}
        </span>
        <span className={styles.profileText}>
          <span className={styles.profileName}>Hala {profile.firstName}</span>
          <span className={styles.profileEmail}>{user.email}</span>
        </span>
        <EditRing percent={completion} onPress={() => nav.push('account/editProfile')} />
      </Pressable>

      <NoonOneStrip />
    </div>
  );
}

/**
 * NoonAccountNoonOne → NoonAccountNoonOneSubscribed | NoonAccountNoonOneNotSubscribed over NoonAccountNoonOneLayout:
 * logo lottie (48×36, plays once), title block slides in from −20 (500ms delay), CTA text −15 (500ms) and chevron −15
 * (530ms). Switches on loyalty.isNoonOneSubscribed (kit: membership store).
 */
function NoonOneStrip() {
  const nav = useNav();
  const member = useIsNoonOneMember();
  const savings = useMembership((s) => s.savings);
  const trialEligible = useMembershipEligibility((s) => s.trialEligible);
  const rtl = typeof document !== 'undefined' && document.querySelector('[dir="rtl"]') ? -1 : 1;
  const dx = (d: number) => d * rtl;

  // master: both variants push noon.VIPLandingScreen (source /account); the kit sends members to the management flow
  const onPress = () => (member ? nav.push('membership/manage') : nav.push('noonone/landing', { source: '/account' }));

  return (
    <Pressable key={member ? 'member' : 'guest'} className={styles.noonOne} scale={1} onClick={onPress}>
      <span className={styles.noonOneGlow} />
      <span className={styles.noonOneLogo}>
        <Lottie src={noonOneLogo} style={{ width: '100%', height: '100%' }} />
      </span>
      <motion.span className={styles.noonOneText} {...slide(0.5, dx(-20))}>
        {member ? (
          // savingsState 'high' → <Price isCompact/> + account_noon_one_savings_title, else account_noon_one_no_savings_title
          savings > 0 ? (
            <span className={styles.noonOneSavedTitle}>
              <span>{`${currency} ${Math.round(savings)}`}</span>
              <span>saved & still going!</span>
            </span>
          ) : (
            <span className={styles.noonOneSavedTitle}>Free delivery, yours to enjoy!</span>
          )
        ) : (
          <span className={styles.noonOneTitle}>Unlimited free delivery</span>
        )}
      </motion.span>
      <span className={styles.noonOneAfter}>
        {!member && (
          <motion.span className={styles.noonOneCta} {...slide(0.5, dx(-15))}>
            {trialEligible ? 'Start Trial' : 'Join Now'}
          </motion.span>
        )}
        <motion.span className={styles.noonOneChevron} {...slide(member ? 0.5 : 0.53, dx(-15))}>
          <img src={noonAccountChevron} width={6} height={11} alt="" />
        </motion.span>
      </span>
    </Pressable>
  );
}
