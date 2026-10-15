import { motion } from 'motion/react';
import { useEffect, useLayoutEffect, useState } from 'react';
import { HtmlText, Screen, Skeleton } from '../../../components';
import { membershipActions, membershipStore, useMembershipManage } from '../../../kit/membership';
import { useNav } from '../../../kit/Navigator';
import { duration, easing } from '../../../motion/presets';
import { MemberHexagon, VipBackButton, VipButton } from '../components/primitives';
import { applyDemo, ownerName } from '../data';
import { useEnsureMembership } from '../store';
import { mb } from '../tokens';
import { sharePlan } from './FamilyPlansScreen';
import { inviteContacts, shareInviteTouchpoint } from './familyData';
import styles from './family.module.css';

/** titleTextStyle: <highlight>/<b> successLight, h24 weight 800 */
const titleSheet = { highlight: { font: 'var(--nk-type-mb-fam-h24-heavy)', color: 'var(--nk-color-success)' }, b: { font: 'var(--nk-type-mb-fam-h24-heavy)', color: 'var(--nk-color-success)' } };

/** runAfterInteractions + getVIPTouchpoints('shareInvite') */
const LOAD_MS = 500;

/** seed a family owner when opened directly without one */
export function useEnsureFamilyOwner(state?: string) {
  useEnsureMembership(state);
  useLayoutEffect(() => {
    const s = membershipStore.get();
    if (!state && !(s.role === 'owner' && (s.plan?.seats ?? 1) > 1)) applyDemo('familyOwner');
  }, [state]);
}

function InviteSkeleton() {
  return (
    <div className={styles.inviteSkeleton}>
      <div className={styles.inviteSkContent}>
        <Skeleton width={252} height={306} radius={24} />
        <Skeleton width="78%" height={28} radius={8} style={{ marginTop: 40 }} />
        <Skeleton width="52%" height={28} radius={8} style={{ marginTop: 10 }} />
        <div className={styles.inviteSkBenefits}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: 'contents' }}>
              {i > 0 && <span className={styles.inviteSkDivider} />}
              <div className={styles.inviteSkBenefit}>
                <Skeleton width={40} height={40} radius={8} />
                <Skeleton width="90%" height={12} radius={6} />
                <Skeleton width="70%" height={12} radius={6} style={{ marginTop: 6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.inviteSkFooter}>
        <Skeleton height={52} radius={12} />
      </div>
    </div>
  );
}

/**
 * VIPSharePlanInviteScreen — /noon-one-share-invite. Pressable hero card (scale .97) and the sticky "Share Invite"
 * both open the share sheet; on completion the next invitee is added to the plan (kit stand-in for an accepted invite).
 */
export function SharePlanInviteScreen({ params }: { params: { state?: string } }) {
  useEnsureFamilyOwner(params.state);
  const nav = useNav();
  const m = useMembershipManage();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), LOAD_MS);
    return () => window.clearTimeout(id);
  }, []);

  const seatsLeft = Math.max((m.plan?.seats ?? 5) - 1 - m.family.length, 0);
  const data = shareInviteTouchpoint(seatsLeft);

  const shareInvite = async () => {
    const done = await sharePlan(data.share, seatsLeft > 0 ? () => undefined : nav.toast);
    if (!done || seatsLeft <= 0) return;
    const taken = new Set(membershipStore.get().family.map((f) => f.name));
    const contact = inviteContacts.find((c) => !taken.has(c.name));
    if (!contact) return;
    membershipActions.inviteMember({ id: `INV${Date.now().toString(36).toUpperCase()}`, ...contact });
    nav.toast(`Invite sent to ${contact.name.split(' ')[0]}`, { tone: 'success' });
  };

  const back = () => (nav.canGoBack ? nav.back() : nav.reset('membership/manage'));
  const names = [ownerName, ...m.family.map((f) => f.name)];

  return (
    <Screen
      background="bgSubtle"
      overlayHeader
      safeTop={false}
      contentStyle={{ paddingBottom: 0 }}
      header={
        <div className={styles.inviteHeader}>
          <span className={styles.inviteHeaderBg} />
          <div className={styles.inviteHeaderRow}>
            <VipBackButton onPress={back} className={styles.inviteBack} />
          </div>
        </div>
      }
    >
      <div className={styles.inviteBody}>
        <div className={styles.inviteContent}>
          <motion.button
            type="button"
            className={styles.heroButton}
            whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
            transition={{ duration: duration.base, ease: easing.inOut }}
            onClick={() => window.setTimeout(shareInvite, 200)}
          >
            {/* heroImageUrl (server illustration: logo + people + badge) — composed from kit pieces */}
            <span className={styles.heroCard}>
              <span className={styles.heroLogo}>
                noon <b>One</b>
              </span>
              <span className={styles.heroHexes}>
                {Array.from({ length: m.plan?.seats ?? 5 }, (_, i) =>
                  names[i] ? (
                    <MemberHexagon key={i} initial={names[i]} width={44} height={43} />
                  ) : (
                    <MemberHexagon key={i} initial="+" width={44} height={43} background={mb.color('mbLightGreen')} color={mb.color('mbFamPayLabel')} />
                  ),
                )}
              </span>
              <span className={styles.heroBadge}>{`${m.plan?.seats ?? 5} seats · Family plan`}</span>
            </span>
          </motion.button>
          <HtmlText value={data.title} className={styles.inviteTitle} style={{ display: 'block' }} stylesheet={titleSheet} />
          <div className={styles.inviteBenefits}>
            {data.benefits.map((b, i) => (
              <div key={b.text} style={{ display: 'contents' }}>
                {i > 0 && <span className={styles.fadedLine} />}
                <div className={styles.inviteBenefit}>
                  <img src={b.iconUrl} alt="" />
                  <span>{b.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.inviteFooter}>
          <VipButton className={styles.inviteButton} before={<img src={data.button.iconBeforeTextUrl} alt="" className={styles.inviteButtonIcon} />} onPress={shareInvite}>
            {data.button.text}
          </VipButton>
        </div>
      </div>
      {loading && <InviteSkeleton />}
    </Screen>
  );
}
