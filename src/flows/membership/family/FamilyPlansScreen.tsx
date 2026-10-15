import { DotLottieReact, type DotLottie } from '@lottiefiles/dotlottie-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { HtmlText, Screen, Skeleton } from '../../../components';
import { ref } from '../../../foundations/tokens';
import { useMembershipManage } from '../../../kit/membership';
import { useNav } from '../../../kit/Navigator';
import { icons, lotties } from '../assets';
import { VipBackButton, VipButton } from '../components/primitives';
import { ownerName, t } from '../data';
import { useEnsureMembership } from '../store';
import { mb } from '../tokens';
import { FaqGroup, FamilyBenefits, FamilySection, PlanMembers, ScrollEnter, Steps } from './components';
import { familyPlansError, familyPlansTouchpoint, type FamilyPlanOption } from './familyData';
import styles from './family.module.css';
import { useReduceMotion } from '../../../motion/reducedMotion';
import { duration, easing, spring } from '../../../motion/presets';

/** constants.ts: header Lottie (60fps) FAMILY_TO_DUO_END_FRAME = 1350ms, DUO_TO_FAMILY_END_FRAME = 2683ms */
const FAMILY_TO_DUO_END_FRAME = Math.round(1.35 * 60);
const DUO_TO_FAMILY_END_FRAME = Math.round(2.683 * 60);
/** PLAN_SELECTION_SPRING { damping: 12, stiffness: 107 } (ζ 0.58, a bounce) → the kit's bouncy spring */
const selectionSpring = spring.bouncy;
/** skeleton while getVIPTouchpoints('familyPlans') loads */
const LOAD_MS = 600;

const firstName = ownerName.split(' ')[0];

function Plan({ plan, selected, onSelect }: { plan: FamilyPlanOption; selected: boolean; onSelect: () => void }) {
  const p = selected ? 1 : 0;
  return (
    <button type="button" className={styles.planOuter} data-selected={selected || undefined} disabled={selected} onClick={onSelect}>
      <motion.span className={styles.planGlow} initial={false} animate={{ opacity: p }} transition={selectionSpring} />
      <div className={styles.planWrapper}>
        <motion.span className={styles.planBorderOn} initial={false} animate={{ opacity: p }} transition={selectionSpring} />
        <div className={styles.planContainer}>
          <div className={styles.planHeader}>
            <span className={styles.planMembersPill}>
              <PlanMembers names={[firstName]} size={28} overlap={13} max={plan.maxNumMembers} />
            </span>
            <div className={styles.planTitleRow}>
              <span className={styles.planName}>{plan.title}</span>
              <motion.img src={icons.mCheckbox} alt="" className={styles.planCheck} initial={false} animate={{ opacity: p, scale: selected ? 1 : 0.5 }} transition={selectionSpring} />
            </div>
            <span className={styles.planSubtitle}>{t('vip_plan_for_members', { count: plan.maxNumMembers })}</span>
          </div>
          <div className={styles.planPriceBox}>
            <motion.span className={styles.planPriceOn} initial={false} animate={{ opacity: p }} transition={selectionSpring} />
            <HtmlText value={plan.monthlyPrice} className={styles.planPrice} />
            <HtmlText value={plan.description} className={styles.planDescription} />
          </div>
        </div>
      </div>
    </button>
  );
}

function FamilyPlansSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skTitle}>
        <Skeleton width="72%" height={20} radius={10} />
        <Skeleton width="42%" height={16} radius={10} />
      </div>
      <div className={styles.skPlans}>
        {[0, 1].map((i) => (
          <div key={i} className={styles.skCard}>
            <Skeleton width={36} height={36} radius={18} />
            <Skeleton width="58%" height={14} radius={8} style={{ marginTop: 4 }} />
            <Skeleton width="78%" height={12} radius={8} />
            <div className={styles.skInner}>
              <Skeleton width="45%" height={12} radius={8} />
              <Skeleton width="72%" height={12} radius={8} />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.skSection}>
        <div className={styles.skCard}>
          <Skeleton width="55%" height={14} radius={8} />
          <div className={styles.skInner}>
            {['92%', '70%', '48%', '92%'].map((w, i) => (
              <Skeleton key={i} width={w} height={12} radius={8} />
            ))}
          </div>
        </div>
      </div>
      <div className={styles.skFooter}>
        <div className={styles.skButton}>
          <Skeleton width="36%" height={14} radius={8} style={{ background: mb.color('mbFamShimmer') }} />
        </div>
      </div>
    </div>
  );
}

/**
 * VIPFamilyPlansScreen — deep link /noon-one-sharing. Header Lottie switches Family ⇄ Duo with the selected plan,
 * plan cards overlap it by 56px, then benefits / how it works / share / FAQ sections enter on scroll, sticky
 * "Upgrade for free" opens the FAMILY_PLAN review sheet (membership/familyReview).
 */
export function FamilyPlansScreen({ params }: { params: { state?: string } }) {
  useEnsureMembership(params.state);
  const nav = useNav();
  const m = useMembershipManage();
  const data = familyPlansTouchpoint;
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FamilyPlanOption>(() => data.plans.find((p) => p.isDefaultForCheckout) ?? data.plans[0]);
  const [scrollY, setScrollY] = useState(0);
  const lottie = useRef<DotLottie | null>(null);
  const prevDuo = useRef<boolean | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), LOAD_MS);
    return () => window.clearTimeout(id);
  }, []);

  const isDuo = selected.maxNumMembers === 2;
  const reduce = useReduceMotion();
  useEffect(() => {
    const a = lottie.current;
    if (!a) return;
    const prev = prevDuo.current;
    prevDuo.current = isDuo;
    if (prev === null) {
      if (isDuo) a.setFrame(FAMILY_TO_DUO_END_FRAME);
      return;
    }
    if (prev === isDuo) return;
    // reduced motion: jump to the plan's resting frame instead of playing the segment
    if (reduce) {
      a.setFrame(isDuo ? FAMILY_TO_DUO_END_FRAME : 0);
      return;
    }
    if (isDuo) a.setSegment(0, FAMILY_TO_DUO_END_FRAME);
    else a.setSegment(FAMILY_TO_DUO_END_FRAME, DUO_TO_FAMILY_END_FRAME);
    a.setFrame(isDuo ? 0 : FAMILY_TO_DUO_END_FRAME);
    a.play();
  }, [isDuo, reduce]);

  const back = () => (nav.canGoBack ? nav.back() : nav.reset('membership/manage'));

  // FamilyPlansErrorType — server blocks the page when the user already owns / belongs to a family plan
  const blocking = m.plan && m.plan.seats > 1 ? familyPlansError(m.role === 'member' ? 'member' : 'owner', m.ownerName) : null;
  if (blocking && !loading) {
    return (
      <Screen background="bgPage" safeTop={false}>
        <div className={styles.blocking}>
          <div className={styles.blockingContent}>
            <img src={icons.userGroup} alt="" className={styles.blockingImage} />
            <div className={styles.blockingCopy}>
              <span className={styles.blockingTitle}>{blocking.title}</span>
              <span className={styles.blockingDescription}>{blocking.description}</span>
            </div>
          </div>
          <VipButton className={styles.blockingButton} onPress={() => (nav.canGoBack ? nav.back() : nav.reset('membership/manage'))}>
            {blocking.button.text}
          </VipButton>
        </div>
      </Screen>
    );
  }

  const headerOpacity = Math.min(Math.max(scrollY / 60, 0), 1);
  const share = data.shareSection;

  return (
    <Screen
      background={`linear-gradient(${ref.palette('white')} 0%, ${ref.color('bgPage')} 50%)`}
      overlayHeader
      safeTop={false}
      onScroll={setScrollY}
      header={
        <div className={styles.header}>
          <span className={styles.headerBg} style={{ opacity: headerOpacity }} />
          <motion.div className={styles.headerRow} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: duration.medium, ease: easing.out }}>
            <VipBackButton onPress={back} />
            <span className={styles.headerTitle} style={{ opacity: headerOpacity }}>
              <HtmlText value={t('vip_try_family_for_free')} stylesheet={{ highlight: { color: ref.color('success') } }} />
            </span>
          </motion.div>
        </div>
      }
      footer={
        <div className={styles.sticky}>
          <VipButton className={styles.stickyButton} onPress={() => nav.push('membership/familyReview', { planCode: selected.planCode })}>
            <HtmlText value={selected.buttonText || t('vip_upgrade_for_free')} />
          </VipButton>
        </div>
      }
      contentStyle={{ paddingBottom: 0 }}
    >
      <div className={styles.hero}>
        <DotLottieReact
          src={document.documentElement.dir === 'rtl' ? lotties.familyPlansHeaderAr : lotties.familyPlansHeader}
          autoplay={false}
          loop={false}
          className={styles.heroLottie}
          dotLottieRefCallback={(d) => {
            lottie.current = d;
          }}
        />
      </div>
      <ScrollEnter>
        <div className={styles.plans}>
          {data.plans.map((p) => (
            <Plan key={p.planCode} plan={p} selected={p.planCode === selected.planCode} onSelect={() => setSelected(p)} />
          ))}
        </div>
      </ScrollEnter>
      <ScrollEnter>
        <FamilySection icon={data.benefitsSection.headerIcon} title={data.benefitsSection.headerText}>
          <FamilyBenefits benefits={data.benefitsSection.benefits} />
        </FamilySection>
      </ScrollEnter>
      <ScrollEnter>
        <FamilySection icon={data.stepsSection.headerIcon} title={data.stepsSection.headerText}>
          <Steps steps={data.stepsSection.steps} />
        </FamilySection>
      </ScrollEnter>
      <ScrollEnter>
        <FamilySection icon={share.headerIcon} title={share.headerText}>
          <div className={styles.share}>
            <div className={styles.shareTop}>
              <HtmlText value={share.text} className={styles.shareText} />
              <span className={styles.shareMembers}>
                <PlanMembers names={[firstName]} size={44} max={2} overlap={22} />
                <img src={share.iconUrl} alt="" className={styles.shareIcon} />
              </span>
            </div>
            <VipButton className={styles.shareButton} before={<img src={share.button.iconBeforeTextUrl} alt="" className={styles.shareButtonIcon} />} onPress={() => sharePlan(share.share, nav.toast)}>
              <span className={styles.shareButtonText}>{share.button.text}</span>
            </VipButton>
          </div>
        </FamilySection>
      </ScrollEnter>
      <ScrollEnter>
        <FamilySection icon={data.faqSection.headerIcon} title={data.faqSection.headerText} titleClassName={styles.faqSectionTitle} className={styles.faqSection}>
          <FaqGroup rows={data.faqSection.rows} />
        </FamilySection>
      </ScrollEnter>
      <ScrollEnter>
        <HtmlText value={data.footerNote} className={styles.footerNote} style={{ display: 'block' }} />
      </ScrollEnter>
      {loading && <FamilyPlansSkeleton />}
    </Screen>
  );
}

/**
 * react-native-share Share.open({ title, message, subject, url }). The prototype has no native share sheet, so it copies
 * "message url" to the clipboard and confirms with a toast (deterministic in demos / headless shots).
 */
export async function sharePlan(share: { title?: string; message?: string; subject?: string; url?: string }, toast: (m: string, o?: { tone?: 'success' }) => void) {
  try {
    await navigator.clipboard?.writeText(`${share.message ?? ''} ${share.url ?? ''}`.trim());
  } catch {
    // clipboard blocked — still a successful share for the demo
  }
  toast('Invite link copied', { tone: 'success' });
  return true;
}
