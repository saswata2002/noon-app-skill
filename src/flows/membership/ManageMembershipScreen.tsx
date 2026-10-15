import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Screen } from '../../components';
import { spring } from '../../motion/presets';
import { useNav } from '../../kit/Navigator';
import { membershipActions, membershipStore, useMembershipManage, membershipManageActions } from '../../kit/membership';
import { cardImage, capitalize, t } from './data';
import { FamilyMembersSection } from './components/FamilyMembersSection';
import { ManagePlan } from './components/ManagePlan';
import { DashedLine, RowChevron, SuccessAnim, VipBackButton, VipButton } from './components/primitives';
import { acquisitionRoute, hasAcquisition } from './links';
import { buildManageData, type VipButton as VipButtonData } from './manageData';
import { membershipEvents, membershipUi, useEnsureMembership } from './store';
import styles from './manage.module.css';

/**
 * VIPManageMembershipV3Screen (live when FeatureFlags vip_cancel_v2 + vip_upgrade_v2). Opened with showModal
 * (fullScreen) from the account noon One card. Plans card (current + upcoming plan, plan CTA row), family members
 * (owner of a family plan), leave-family row (member), payment method + update/invoice rows, cancel row.
 */
export function ManageMembershipScreen({ params }: { params: { state?: string } }) {
  useEnsureMembership(params.state);
  const nav = useNav();
  const m = useMembershipManage();
  const celebrate = membershipUi.useStore((s) => s.celebrate);
  const notice = membershipUi.useStore((s) => s.notice);
  const [scrolled, setScrolled] = useState(0);
  const [contentHidden, setContentHidden] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // initialPlanCode (loyalty.membership.planCode at mount) — "Current plan" vs "Upgraded plan" tag
  const initialPlanCode = useRef(m.status !== 'none' ? m.plan?.id : undefined);
  if (initialPlanCode.current === undefined && m.status !== 'none' && m.plan) initialPlanCode.current = m.plan.id;

  const data = useMemo(() => (m.plan && m.status !== 'none' ? buildManageData(m) : undefined), [m]);

  // VIPEventEmitter.onVipMembershipChanged(showAnimation) → VIPTransitionAnim; content parks 200px down, opacity 0
  useEffect(() => {
    if (!celebrate) return;
    scrollRef.current?.scrollTo({ top: 0 });
    setContentHidden(true);
  }, [celebrate]);
  // vipMembershipCancelled / payment changed → toast (master reloads touchpoints; VIPToast on landing)
  useEffect(() => {
    if (!notice) return;
    nav.toast(notice.subtitle ? `${notice.title} ${notice.subtitle}` : notice.title, { tone: 'success' });
    membershipEvents.consumeNotice();
    scrollRef.current?.scrollTo({ top: 0 });
  }, [notice, nav]);

  // left the family plan / membership ended with no plan → master's manage has nothing to show; go to the noon One landing
  useEffect(() => {
    if (membershipStore.get().status === 'none') nav.replace(acquisitionRoute('landing'));
  }, [m.status, nav]);

  if (!data) return <Screen background="bgPage" />;
  const { currentPlan, upgradePlan, buttons, familyMembersSection } = data;
  const showFamily = !!familyMembersSection;

  const handleButtonPress = (action: string) => {
    switch (action) {
      case '/update-payment':
        nav.push(acquisitionRoute('payment'), {
          planCode: currentPlan.planCode,
          isUpdatePayment: true,
          source: '/manageMembership',
        });
        break;
      case '/create':
      case '/plan-upgrade':
        nav.push('membership/upgrade', { source: '/manageMembership' });
        break;
      case '/cancel-upgrade':
        // Plan.handlePayment → cancelScheduledUpgrade (VIPService.cancelSubscription({ isCancelUpgrade: true }))
        membershipManageActions.cancelUpgrade();
        membershipEvents.notify('Plan change cancelled.', `You'll stay on ${currentPlan.title}.`);
        break;
      case '/pdf-link':
        nav.push('membership/invoice');
        break;
      case '/cancel-free-upgrade':
        nav.push('membership/cancel', { mode: 'cancelUpgrade' });
        break;
      case '/cancel':
        nav.push('membership/cancel', { mode: 'cancel' });
        break;
      case '/leave-family':
        nav.push('membership/cancel', { mode: 'leave' });
        break;
      default:
        break;
    }
  };

  const onPlanCta = (cta: string) => {
    if (cta === '/reactivate') {
      // VIPSubscriptionButtonV2 → VIPPaymentV2Screen; without the acquisition payment screen, reactivate in place
      if (hasAcquisition('payment'))
        nav.push(acquisitionRoute('payment'), {
          planCode: currentPlan.planCode,
          source: '/manageMembership',
        });
      else {
        membershipActions.reactivate();
        membershipEvents.membershipChanged('Welcome back!', 'Your noon One membership is active again');
      }
    }
  };

  // planButton: /cancel-free-upgrade (unless an upgrade is scheduled) → /cancel-upgrade → /plan-upgrade
  const find = (cta: string) => buttons.find((b) => b.cta === cta);
  const planButton: VipButtonData | undefined =
    find('/cancel-free-upgrade') && upgradePlan?.cta !== '/cancelUpgrade'
      ? find('/cancel-free-upgrade')
      : upgradePlan?.cta === '/cancelUpgrade'
        ? { cta: '/cancel-upgrade', text: upgradePlan.buttonText }
        : find('/plan-upgrade');
  // _.orderBy(['/update-payment', '/pdf-link'], 'cta', 'desc')
  const paymentButtons = buttons.filter((b) => b.cta === '/update-payment' || b.cta === '/pdf-link').sort((a, b) => b.cta.localeCompare(a.cta));
  const cancelButton = find('/cancel');
  const leaveFamilyButton = !showFamily ? find('/leave-family') : undefined;
  const showPaymentInfo = !!find('/update-payment') && !!m.paymentCard;

  const back = () => (nav.canGoBack ? nav.back() : nav.reset('account/account'));

  const header = (
    <div className={styles.headerWrapper}>
      <div className={styles.headerBg} style={{ opacity: Math.min(Math.max(scrolled, 0), 1) }} />
      <div className={styles.header}>
        <VipBackButton onPress={back} />
        <span className={styles.headerTitle}>{data.headerTitle}</span>
      </div>
    </div>
  );

  const actionRow = (b: VipButtonData, single: boolean) => (
    <VipButton key={b.cta} className={styles.button} data-single={single || undefined} onPress={() => handleButtonPress(b.cta)} after={<RowChevron />}>
      <span className={styles.buttonText}>{capitalize(b.text)}</span>
    </VipButton>
  );

  const navRow = (b: VipButtonData, subtitle?: string) => (
    <motion.button type="button" className={styles.cancelButton} whileTap={{ opacity: 0.2 }} onClick={() => handleButtonPress(b.cta)}>
      <span className={styles.cancelContent}>
        <span className={styles.cancelText}>{b.cta === '/leave-family' ? b.text || b.title : capitalize(b.text)}</span>
        <span className={styles.cancelSubtitle}>{subtitle}</span>
      </span>
      <RowChevron className={styles.cancelChevron} />
    </motion.button>
  );

  return (
    <>
      <Screen
        ref={scrollRef}
        background="bgPage"
        overlayHeader
        header={header}
        onScroll={setScrolled}
        contentStyle={{
          paddingTop: 'calc(var(--nk-inset-top) + 60px)',
          paddingBottom: 54,
        }}
      >
        <motion.div
          initial={false}
          animate={contentHidden ? { y: 200, opacity: 0 } : { y: 0, opacity: 1 }}
          transition={contentHidden ? { duration: 0 } : spring.bouncy}
        >
          <div className={styles.topSection}>
            <div className={styles.plansContainer}>
              <ManagePlan
                plan={currentPlan}
                isCurrent
                tagText={initialPlanCode.current === currentPlan.planCode ? t('vip_current_plan') : t('vip_upgraded_plan')}
                showBenefits={!upgradePlan}
                hasUpcomingPlan={!!upgradePlan?.isUpcoming}
                onCta={onPlanCta}
              />
              {upgradePlan && <ManagePlan plan={upgradePlan} onCta={onPlanCta} />}
              {planButton && <div className={styles.buttonsContainer}>{actionRow(planButton, true)}</div>}
            </div>
          </div>

          {showFamily && (
            <FamilyMembersSection
              ownerName={data.ownerName}
              members={currentPlan.activeMembers ?? []}
              section={familyMembersSection}
              maxNumMembers={currentPlan.maxNumMembers}
              isRemoveCtaVisible={currentPlan.isRemoveCtaVisible}
              onRemoveMember={(member) => nav.push('membership/removeMember', { memberId: member.id })}
              onAddMember={() =>
                nav.push('membership/shareInvite', {
                  source: '/manageMembership',
                })
              }
            />
          )}

          {leaveFamilyButton && navRow(leaveFamilyButton, leaveFamilyButton.subtitle)}

          {paymentButtons.length > 0 && (
            <div className={styles.paymentButtonsContainer}>
              {showPaymentInfo && (
                <div className={styles.paymentInfo}>
                  <img className={styles.paymentMethodImage} src={cardImage(m.paymentCard?.brand)} alt="" />
                  <div className={styles.paymentInfoColumn}>
                    <span className={styles.paymentInfoText}>{t('vip_payment_method')}</span>
                    <span className={styles.paymentMethodNumber}>{`•••• ${m.paymentCard?.last4}`}</span>
                  </div>
                </div>
              )}
              <div className={styles.buttonsContainer}>
                <div className={paymentButtons.length > 1 ? styles.stackedButtonsInner : undefined}>
                  {paymentButtons.map((b, i) => (
                    <div key={b.cta}>
                      {actionRow(b, paymentButtons.length === 1)}
                      {i < paymentButtons.length - 1 && (
                        <div className={styles.buttonSeparatorDashed}>
                          <DashedLine />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!leaveFamilyButton && cancelButton && navRow(cancelButton, m.status === 'trial' ? t('vip_cancel_notice_trial') : t('vip_cancel_notice_paid'))}
        </motion.div>
      </Screen>
      {celebrate && (
        <SuccessAnim
          key={celebrate.key}
          title={celebrate.title}
          subtitle={celebrate.subtitle}
          onComplete={() => {
            membershipEvents.consumeCelebrate();
            setContentHidden(false);
          }}
        />
      )}
    </>
  );
}
