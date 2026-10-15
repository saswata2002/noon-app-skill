import { animate, motion, useMotionValue } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import shimmerLottie from '@assets/vip/vip-loading-shimmer.lottie';
import greenCheck from '@assets/vip/one-green-check.webp';
import { Screen } from '../../../components';
import { membershipStore, noonOneJourneyActions, useIsNoonOneMember, useMembership, useMembershipEligibility } from '../../../kit/membership';
import { useIsTop, useNav, useToastsEnabled } from '../../../kit/Navigator';
import { CURRENCY, defaultPlan, findPlan, successMessage, toMembershipPlan, withEligibility } from '../data';
import {
  benefitsModule,
  faqModule,
  fmtDate,
  landingCopy,
  membershipOverview,
  npLanding,
  savingsModule,
} from '../data.landing';
import { completeSubscription, noononeStore, useNoonone } from '../store';
import { landingTokens as T } from '../tokens';
import { LandingHeader } from '../components/landing/LandingHeader';
import { BenefitsModule, FaqModule, LottieBox, MembershipOverviewModule, SavingsOverviewModule } from '../components/landing/modules';
import { NpModuleRenderer, NpStickyFooter } from '../components/landing/npModules';
import { TransitionAnim } from '../components/landing/TransitionAnim';
import styles from '../components/landing/landing.module.css';

interface LandingParams {
  source?: string;
  /** VIPUtil.showLandingWithRedirect: a redirect screen is pushed on top — render the blank loader, no skeleton */
  redirecting?: boolean;
  /** `noonone/success` playground entry */
  demo?: 'success';
  /** VIPEventEmitter.onVipSetReminder → reminder toast */
  reminder?: boolean;
}

/**
 * features/vip/screens/VIPLandingScreen — CMS landing (VIP modules) with a fading header, sticky "/create" CTA +
 * "View all plans", payment terms, VIPSkeletonLoader while touchpoints load, and VIPTransitionAnim success after
 * subscribing (then the member landing: bgImg + membership overview + savings).
 */
export function LandingScreen() {
  const nav = useNav();
  const params = nav.params as LandingParams;
  // `success` demo entry: subscribe the demo user before the first render (so nothing non-member mounts and aborts its
  // lottie fetch), then play the success animation like a real createSubscription
  useState(() => {
    if (params.demo !== 'success') return;
    const pm = noononeStore.get().paymentMethod;
    const card = pm?.type === 'card' ? { brand: pm.card.ccType, last4: pm.card.last4 } : undefined;
    if (!isNoonOneMemberNow()) noonOneJourneyActions.subscribe(toMembershipPlan(defaultPlan), { trial: true, card });
    noononeStore.patch({ pendingSuccess: successMessage(defaultPlan) });
  });
  const isMember = useIsNoonOneMember();
  const membership = useMembership();
  const trialEligible = useMembershipEligibility((s) => s.trialEligible);
  const { trialGuideShown, paymentMethod, pendingSuccess } = useNoonone();
  const plan = withEligibility(findPlan(defaultPlan.planCode), trialEligible);

  const [loading, setLoading] = useState(() => !noononeStore.get().pendingSuccess);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<{ title: string; subtitle: string } | null>(null);
  const [toast, setToast] = useState(!!params.reminder);
  const toastsOn = useToastsEnabled();
  const [stickyHeight, setStickyHeight] = useState(200);
  const stickyRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollY = useMotionValue<number>(0);
  /** contentAnim: 1 while the success animation plays (content pushed down 200 & hidden), springs back to 0 */
  const contentAnim = useMotionValue<number>(0);
  const contentY = useMotionValue<number>(0);
  const contentOpacity = useMotionValue<number>(1);
  const isTop = useIsTop();

  // VIPService.getVIPTouchpoints('landingV2') under the VIPSkeletonLoader lottie
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), T.loadingMs);
    return () => clearTimeout(id);
  }, []);

  // VIPEventEmitter.onVipMembershipChanged(title, msg, showAnimation) → VIPTransitionAnim success
  useEffect(() => {
    if (!pendingSuccess || !isTop) return;
    noononeStore.patch({ pendingSuccess: undefined });
    setLoading(false);
    setPaying(false);
    scrollRef.current?.scrollTo({ top: 0 });
    contentAnim.set(1);
    setSuccess(pendingSuccess);
  }, [pendingSuccess, isTop, contentAnim]);

  useEffect(
    () =>
      contentAnim.on('change', (v) => {
        contentY.set(v * T.transition.contentOffset);
        contentOpacity.set(1 - v);
      }),
    [contentAnim, contentY, contentOpacity],
  );

  useLayoutEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStickyHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  });

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(false), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const onCreate = () => {
    if (!trialGuideShown) {
      // useVIPQuickPayment trial guide → VIPPopupUtil.showPlanDetailDialog (planDetails overlay)
      noononeStore.patch({ trialGuideShown: true, selectedPlan: plan });
      nav.push('noonone/planDetails', { planCode: plan.planCode });
      return;
    }
    // handlePayment(): quick subscribe with the saved payment method
    setPaying(true);
    setTimeout(() => completeSubscription(nav, plan), T.quickPayMs);
  };

  const showFooter = !isMember;
  const showPayment = trialGuideShown && !!paymentMethod;
  const hideContent = !!success;

  const memberPlan = membership.plan;
  const trial = membership.status === 'trial';
  const overviewPlan = memberPlan
    ? {
        title: memberPlan.name,
        statusHtml: trial ? membershipOverview.status.trial : membershipOverview.status.active,
        statusColor: membershipOverview.status.highlightColor,
        billingHtml: trial
          ? `<p>Free until <b>${fmtDate(membership.renewsOn)}</b>, then ${CURRENCY} ${memberPlan.price}/${memberPlan.period === 'yearly' ? 'year' : 'month'}</p>`
          : `<p>Renews on <b>${fmtDate(membership.renewsOn)}</b> · ${CURRENCY} ${memberPlan.price}/${memberPlan.period === 'yearly' ? 'year' : 'month'}</p>`,
        members: [{ name: membershipOverview.name }, ...membership.family.filter((f) => f.status === 'joined')],
        maxNumMembers: memberPlan.seats,
      }
    : undefined;

  return (
    <div className={styles.container}>
      <motion.div className={styles.animated} style={{ y: contentY, opacity: contentOpacity }}>
        <Screen
          ref={scrollRef}
          background={isMember ? 'bgPage' : 'vipNpPage'}
          safeTop={false}
          overlayHeader
          header={<LandingHeader scrollY={scrollY} onBack={() => nav.back()} variant={isMember ? undefined : 'np'} />}
          onScroll={(y) => scrollY.set(y)}
          contentStyle={{ paddingBottom: `${stickyHeight + 26}px` }}
        >
          {isMember ? (
            <>
              {/* showImageBg: first module is VIP_MEMBERSHIP_OVERVIEW_MODULE → bgImg (scrolls 1:1 for 300px), no spacer */}
              <div className={styles.bgImage} />
              <div style={{ position: 'relative', paddingTop: 'calc(var(--nk-inset-top) + var(--nk-layout-vip-header-row) + var(--nk-space-s24))' }}>
                <MembershipOverviewModule
                  lottieUrl={membershipOverview.lottieUrl}
                  title={membershipOverview.name}
                  subtitle={membershipOverview.message}
                  plan={overviewPlan}
                  footerText={landingCopy.manageYourMembership}
                  onManage={() => nav.push('membership/manage')}
                />
                <SavingsOverviewModule title={savingsModule.title} savingsText={savingsModule.savingsText} multiplier={savingsModule.savingsMultiplier} subtitle={savingsModule.subtitle} />
                <BenefitsModule title={benefitsModule.moduleHeader.title} benefits={benefitsModule.benefits} />
                <FaqModule title={faqModule.title} rows={faqModule.rows} />
              </div>
            </>
          ) : (
            // non-member: prod landing (Figma Af34gfmhQ1D0wstXUEHSIF · 24:2604) as an ordered landingV2 module list
            <NpModuleRenderer modules={npLanding.modules} onCreate={onCreate} />
          )}
        </Screen>
      </motion.div>

      {showFooter && !loading && (
        <motion.div
          ref={stickyRef}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10 }}
          initial={{ y: `calc(100% + ${T.sticky.extra}px)` }}
          animate={{ y: hideContent ? `calc(100% + ${T.sticky.extra}px)` : 0 }}
          transition={{ duration: T.sticky.ms / 1000, ease: T.sticky.ease }}
        >
          <NpStickyFooter
            subscription={{
              title: plan.isTrialValid ? npLanding.buttonText : plan.buttonText,
              showPayment,
              payment: paymentMethod,
              isLoading: paying,
              onPress: onCreate,
              onPaymentPress: () => nav.push('noonone/payment', { planCode: plan.planCode, source: '/noonone' }),
            }}
            flyout={npLanding.flyout}
            onFlyout={() => nav.push('noonone/plans', { source: '/noon-one-landingV2' })}
            viewPlansTitle={npLanding.viewPlans.title}
            onViewPlans={() => nav.push('noonone/plans', { source: '/noon-one-landingV2' })}
          />
        </motion.div>
      )}

      {toastsOn && toast && (
        <motion.div className={styles.toast} initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <img className={styles.toastIcon} src={greenCheck} alt="" />
          <span className={styles.toastText}>{landingCopy.reminderSet}</span>
        </motion.div>
      )}

      {loading && !success && <div className={styles.skeleton}>{!params.redirecting && <LottieBox src={shimmerLottie} fit="cover" loop className={styles.fill} />}</div>}

      {success && (
        <TransitionAnim
          message={success}
          onComplete={() => {
            animate(contentAnim, 0, T.transition.contentSpring);
            setSuccess(null);
          }}
        />
      )}
    </div>
  );
}

const isNoonOneMemberNow = () => {
  const s = membershipStore.get().status;
  return s === 'active' || s === 'trial';
};
