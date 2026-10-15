import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { HtmlText, Pressable, Screen } from '../../../components';
import { useNav } from '../../../kit/Navigator';
import { useMembershipManage } from '../../../kit/membership';
import { handoff } from '../../../motion/presets';
import arrowDown from '@assets/shared/icons/arrow-down.webp';
import arrowUp from '@assets/membership/arrow-up.webp';
import back from '@assets/membership/back.webp';
import { icons } from '../assets';
import { capitalize, t } from '../data';
import { VipButton } from '../components/primitives';
import { acquisitionRoute } from '../links';
import { useEnsureMembership } from '../store';
import { bannerFor, buildAvailablePlans, type AvailablePlan } from './plansData';
import styles from './plans.module.css';

const IMAGE_W = 390 - 36; // screenWidth - 36

/**
 * VIPPlanSelect — collapsible plan banner (server `bannerConfig.imageUrl`; drawn here as a plan card at the same
 * ratio). Height animates collapsed ↔ full over 500ms Easing.exp; tick / radio + "CURRENT ACTIVATED PLAN" tag + arrow
 * float 24px from the top.
 */
function PlanBanner({ plan, selected, showSelection, onSelect }: { plan: AvailablePlan; selected: boolean; showSelection: boolean; onSelect: () => void }) {
  const h = Math.round((plan.bannerConfig.aspectRatio / 100) * IMAGE_W);
  let collapsed = Math.floor(h * (showSelection ? plan.bannerConfig.collapsedPct : 1));
  if (plan.isSubscribed) collapsed += 26;
  const b = bannerFor(plan.planCode);
  return (
    <div className={styles.bannerContainer} data-border={showSelection || undefined}>
      <motion.div
        style={{ width: IMAGE_W, overflow: 'hidden' }}
        initial={false}
        animate={{ maxHeight: plan.isSubscribed ? collapsed : selected ? h + (plan.isSubscribed ? 26 : 0) : collapsed }}
        transition={handoff.spring}
      >
        <Pressable scale={1} className={styles.bannerPress} disabled={selected} onClick={onSelect}>
          {showSelection && (
            <div className={styles.bannerSelection}>
              <img src={selected ? icons.tick : icons.menuRadioUncheck} width={18} height={18} alt="" />
              {plan.isSubscribed && <span className={styles.bannerActivated}>{t('vip_current_activated_plan').toUpperCase()}</span>}
              <img className={styles.bannerArrow} src={selected && !plan.isSubscribed ? arrowUp : arrowDown} alt="" />
            </div>
          )}
          <div className={styles.bannerImage} style={{ width: IMAGE_W, height: h, marginTop: plan.isSubscribed ? 26 : 0 }}>
            <span className={styles.bannerLogo}>{t('vip_noon_one')}</span>
            <span className={styles.bannerTitle}>{b.title}</span>
            <span className={styles.bannerPrice}>{b.price}</span>
            <div className={styles.bannerBenefits}>
              {b.benefits.map((x, i) => (
                <HtmlText key={i} value={x.title} />
              ))}
            </div>
          </div>
        </Pressable>
      </motion.div>
    </div>
  );
}

/**
 * VIPChangePlanScreen (legacy; reached from VIPCancelMembershipScreen V1 via VIPUtil.showChangePlan) — availablePlans
 * touchpoint: subscribed plan first, "Other available plans", note, disclaimer strip, sticky footer with the
 * subscribe button (/create), "Cancel membership" (/cancel) and the referral prompt.
 */
export function ChangePlanScreen({ params }: { params: { state?: string; headerTitle?: string; isModal?: boolean } }) {
  useEnsureMembership(params.state);
  const nav = useNav();
  const s = useMembershipManage();
  const data = useMemo(() => buildAvailablePlans(s), [s]);
  const [selected, setSelected] = useState<string>(data.plans.find((p) => p.isSubscribed)?.planCode ?? data.plans[0].planCode);
  const sel = data.plans.find((p) => p.planCode === selected)!;
  const [subscribed, ...others] = data.plans;
  const showSelection = data.plans.length > 1;
  const title = capitalize(params.headerTitle ?? (showSelection ? t('vip_choose_your_plan') : t('vip_explore_benefits')));
  const footerNote = sel.footerNote ?? '';

  const header = (
    <div className={styles.cpHeaderWrap}>
      <div className={styles.cpHeader}>
        <span className={styles.cpHeaderTitle}>{title}</span>
        {params.isModal ? (
          <button type="button" className={styles.cpClose} onClick={nav.back} aria-label="Close">
            <img src={icons.closeModal} width={15} height={15} alt="" />
          </button>
        ) : (
          <button type="button" className={styles.cpBack} onClick={nav.back} aria-label="Back">
            <img src={back} height={22} alt="" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Screen
      header={header}
      background="bgSurface"
      footer={
        <div className={styles.cpFooterWrap}>
          {selected !== s.plan?.id && (
            <div className={styles.cpDisclaimer}>
              <span>{data.disclaimer}</span>
            </div>
          )}
          <div className={styles.cpFooter}>
            {data.buttons.map((b) =>
              b.cta === '/create' ? (
                <div key={b.cta} className={styles.subButtonRow}>
                  <VipButton
                    className={styles.cpSubscribe}
                    disabled={sel.isSubscribed}
                    onPress={() => nav.push(acquisitionRoute('payment'), { planCode: selected, source: '/manageMembership' })}
                  >
                    {sel.isSubscribed ? sel.buttonText : sel.buttonText || b.text}
                  </VipButton>
                </div>
              ) : (
                <Pressable
                  key={b.cta}
                  scale={1}
                  className={styles.cpCancel}
                  style={{ background: b.color, borderColor: b.borderColor, color: b.textColor }}
                  onClick={() =>
                    nav.push('membership/info', {
                      isPopup: true,
                      data: { body: { text: `<p>${t('vip_cancel_subscription_confirmation')}</p>` }, buttons: [{ text: t('vip_alert_ok'), cta: '/cancel-membership' }, { text: t('vip_alert_cancel'), cta: '/ok' }] },
                    })
                  }
                >
                  {b.text}
                </Pressable>
              ),
            )}
            {footerNote && <span className={styles.cpFooterNote}>{footerNote}</span>}
            {s.referralCode ? (
              <div className={styles.cpReferralApplied}>
                <span className={styles.cpReferralCode}>{s.referralCode}</span>
                <img src={icons.checkCircleWebp} alt="" />
                <button type="button" className={styles.cpReferralEdit} onClick={() => nav.push('membership/referralsInput', { prefilledReferralCode: s.referralCode })}>
                  {t('vip_edit')}
                </button>
              </div>
            ) : (
              <button type="button" className={styles.cpReferralPrompt} onClick={() => nav.push('membership/referralsInput')}>
                {data.referralPrompt}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className={styles.cpList}>
        {subscribed && (
          <>
            <PlanBanner plan={subscribed} selected={selected === subscribed.planCode} showSelection={showSelection} onSelect={() => setSelected(subscribed.planCode)} />
            {others.length > 0 && <span className={styles.cpOtherPlans}>{t('vip_other_plans')}</span>}
          </>
        )}
        {others.map((p) => (
          <PlanBanner key={p.planCode} plan={p} selected={selected === p.planCode} showSelection={showSelection} onSelect={() => setSelected(p.planCode)} />
        ))}
        {data.note && <span className={styles.cpNote}>{data.note}</span>}
      </div>
    </Screen>
  );
}
