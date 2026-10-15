import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import headerLottie from '@assets/vip/vip-family-plans-header.lottie';
import mCheckbox from '@assets/vip/m-checkbox.png';
import chevronDownM from '@assets/vip/chevron-down-m.svg';
import whatsapp from '@assets/vip/share.svg';
import { HtmlText, Screen } from '../../../components';
import { useNav } from '../../../kit/Navigator';
import { useIsNoonOneMember } from '../../../kit/membership';
import { user } from '../../../data';
import { familyPlansData } from '../data.plans';
import { noononeStore } from '../store';
import { ChevronLeftRounded, DashedBorder, PlanMembers, ScrollHeader, SubscriptionButton } from '../components/plans/parts';
import s from './FamilyPlansScreen.module.css';
import { useReduceMotion } from '../../../motion/reducedMotion';
import { duration, easing, handoff, spring } from '../../../motion/presets';

type FamilyPlan = (typeof familyPlansData.plans)[number];

/** constants.ts */
const FAMILY_TO_DUO_END_FRAME = Math.round((1350 / 1000) * 60);
const DUO_TO_FAMILY_END_FRAME = Math.round((2683 / 1000) * 60);
/** PLAN_SELECTION_SPRING { damping 12, stiffness 107 } (ζ 0.58, a bounce) → the kit's bouncy spring */
const SELECTION_SPRING = spring.bouncy;
/** VIPScrollEnterView: 480ms, offsetY 24, Easing.out(cubic) */
const enter = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.25 }, transition: { y: handoff.spring, opacity: { duration: duration.slower, ease: easing.out } } };

function PlanTile({ plan, selected, onSelect }: { plan: FamilyPlan; selected: boolean; onSelect: () => void }) {
  const p = useMotionValue(selected ? 1 : 0);
  useEffect(() => {
    const a = animate(p, selected ? 1 : 0, SELECTION_SPRING);
    return () => a.stop();
  }, [p, selected]);
  const border = useTransform(p, [0, 1], ['var(--nk-color-border)', 'var(--nk-color-success)']);
  const boxBg = useTransform(p, [0, 1], ['var(--nk-color-bg-subtle)', 'var(--nk-color-vip-success-surface)']);
  const shadow = useTransform(p, (v) => `0 2px 4px color-mix(in srgb, var(--nk-color-vip-success-glow) ${Math.round(Math.max(0, Math.min(1, v)) * 100)}%, transparent)`);
  const checkOpacity = useTransform(p, [0, 1], [0, 1]);
  const checkScale = useTransform(p, [0, 1], [0.5, 1]);
  return (
    <motion.div className={`${s.planOuter} ${selected ? s.planOuterSelected : ''}`} style={{ boxShadow: shadow }}>
      <motion.button type="button" className={`nk-pressable ${s.plan}`} style={{ borderColor: border }} disabled={selected} onClick={onSelect}>
        <div className={s.planContainer}>
          <div className={s.planHeader}>
            <div className={s.membersPill}>
              <PlanMembers members={[{ name: user.firstName }]} size={28} overlap={13} max={plan.maxNumMembers} />
            </div>
            <div className={s.titleRow}>
              <span className={`${s.planName} ${selected ? s.planNameSelected : ''}`}>{plan.title}</span>
              <motion.span className={s.check} style={{ opacity: checkOpacity, scale: checkScale }}>
                <img src={mCheckbox} alt="" />
              </motion.span>
            </div>
            <span className={s.membersSubtitle}>{`for ${plan.maxNumMembers} members`}</span>
          </div>
          <motion.div className={s.priceBox} style={{ background: boxBg }}>
            <HtmlText value={plan.monthlyPrice} className={s.price} stylesheet={{ small: { fontSize: 12, fontWeight: 500 } }} />
            <HtmlText value={plan.descriptionHtml} className={s.description} />
          </motion.div>
        </div>
      </motion.button>
    </motion.div>
  );
}

function Section({ icon, title, faq, children }: { icon?: string; title?: string; faq?: boolean; children: ReactNode }) {
  return (
    <motion.div className={`${s.section} ${faq ? s.sectionFaq : ''}`} {...enter}>
      <div className={s.sectionHeader}>
        {icon && <img className={s.sectionIcon} src={icon} alt="" />}
        {title && <span className={`${s.sectionHeaderText} ${faq ? s.sectionHeaderTextFaq : ''}`}>{title}</span>}
      </div>
      {children}
    </motion.div>
  );
}

function Steps({ steps }: { steps: { title: string; description: string }[] }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [tops, setTops] = useState<number[]>([]);
  useEffect(() => {
    setTops(refs.current.map((el) => el?.offsetTop ?? 0));
  }, [steps.length]);
  const lineTop = tops[0] ?? 0;
  const lineH = tops.length === steps.length ? Math.max(0, tops[steps.length - 1] - lineTop + 24) : 0;
  return (
    <div className={s.steps}>
      {lineH > 0 && (
        <div className={s.stepsLine} style={{ top: lineTop, height: lineH }}>
          {steps.slice(0, -1).map((_, i) => (
            <div key={i} className={s.stepsSegment} style={{ height: tops[i + 1] - tops[i] }}>
              <div className={s.stepsChevrons}>
                {[0, 1, 2].map((j) => (
                  <span key={j} className={s.stepsChevron}>
                    <ChevronLeftRounded width={5} height={9} />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {steps.map((st, i) => (
        <div key={i} ref={(el) => {
            refs.current[i] = el;
          }} className={s.step}>
          <div className={s.stepNumberColumn}>
            <span className={s.stepNumber}>{i + 1}</span>
          </div>
          <div className={s.stepContent}>
            <span className={s.stepTitle}>{st.title}</span>
            <span className={s.stepDesc}>{st.description}</span>
            {i < steps.length - 1 && <DashedBorder className={s.stepDash} strokeWidth={2} strokeSpacing={6} strokeHeight={1} color="var(--nk-color-border)" />}
          </div>
        </div>
      ))}
    </div>
  );
}

function Faq({ rows }: { rows: { header: string; body: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className={s.faqRows}>
      {rows.map((r, i) => (
        <div key={i}>
          <button type="button" className={`nk-pressable ${s.faqRow}`} onClick={() => setOpen(open === i ? null : i)}>
            <div className={s.faqRowContent}>
              <div className={s.faqHeaderRow}>
                <span className={s.faqHeader}>{r.header}</span>
                {/* AnimatedExpandableChevron: 300ms Easing.out(cubic), 0° collapsed → 180° */}
                <motion.span className={s.faqChevron} animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: duration.medium, ease: easing.out }}>
                  <img src={chevronDownM} width={16} height={16} alt="" />
                </motion.span>
              </div>
              {open === i && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: duration.medium, ease: easing.out }}>
                  <div className={s.faqSep} />
                  <span className={s.faqBody}>{r.body}</span>
                </motion.div>
              )}
            </div>
          </button>
          {i < rows.length - 1 && <DashedBorder strokeWidth={3} strokeSpacing={6} strokeHeight={1} color="var(--nk-color-border)" />}
        </div>
      ))}
    </div>
  );
}

/**
 * features/vip/screens/VIPFamilyPlansScreen (deeplink /noon-one-sharing, VIPFamilyPlanModule / VIPMembershipOverviewModule
 * "Try family free"). Header lottie (family ↔ duo segments), Duo / Family plan tiles (selection spring), benefits,
 * how-it-works steps, share invite, FAQ, footer note and sticky VIPSubscriptionButtonV2 → family review sheet
 * (`noonone/planDetails` variant family). Member management (who's in the plan) lives in the `membership` flow.
 */
export function FamilyPlansScreen() {
  const nav = useNav();
  const member = useIsNoonOneMember();
  const d = familyPlansData;
  const [code, setCode] = useState((d.plans.find((p) => 'isDefaultForCheckout' in p && p.isDefaultForCheckout) ?? d.plans[0]).planCode);
  const plan = d.plans.find((p) => p.planCode === code)!;
  const isDuo = plan.maxNumMembers === 2;

  const scrollY = useMotionValue(0);
  const headerOpacity = useTransform(scrollY, [0, 60], [0, 1]);

  // syncHeaderLottie: family = frame 0; → duo plays 0→81; → family plays 81→161
  const lottie = useRef<{ setSegment: (a: number, b: number) => void; setFrame: (f: number) => void; play: () => void; isLoaded: boolean; addEventListener: (e: string, cb: () => void) => void } | null>(null);
  const prevDuo = useRef<boolean | null>(null);
  const reduce = useReduceMotion();
  useEffect(() => {
    const l = lottie.current;
    if (!l || !l.isLoaded) return;
    // reduced motion: jump to the plan's resting frame instead of playing the segment
    if (prevDuo.current === null || prevDuo.current === isDuo || reduce) {
      prevDuo.current = isDuo;
      l.setFrame(isDuo ? FAMILY_TO_DUO_END_FRAME : 0);
      return;
    }
    prevDuo.current = isDuo;
    if (isDuo) l.setSegment(0, FAMILY_TO_DUO_END_FRAME);
    else l.setSegment(FAMILY_TO_DUO_END_FRAME, DUO_TO_FAMILY_END_FRAME);
    l.play();
  }, [isDuo, reduce]);

  const onCta = () => {
    noononeStore.patch({ selectedPlan: plan, trialGuideShown: true });
    nav.push('noonone/planDetails', { planCode: plan.planCode, variant: 'family' });
  };

  const footer = (
    <div className={s.footer}>
      <SubscriptionButton title={plan.buttonText} onPress={onCta} className={s.sticky} textClassName={s.stickyText} />
    </div>
  );

  return (
    <Screen
      /* LinearGradient white → surfaceTertiary, locations [0, .5] */
      background="linear-gradient(180deg, var(--nk-palette-white) 0%, var(--nk-color-bg-page) 50%)"
      overlayHeader
      safeTop={false}
      header={
        <ScrollHeader
          title={<HtmlText value="Try family <highlight>free</highlight>" className={s.headerTitleText} />}
          opacity={headerOpacity}
        />
      }
      footer={footer}
      onScroll={(y) => scrollY.set(y)}
      contentStyle={{ paddingBottom: 0 }}
    >
      <div className={s.scroll}>
        <div className={s.heroWrap}>
          <DotLottieReact
            src={headerLottie}
            autoplay={false}
            loop={false}
            style={{ width: '100%', aspectRatio: '1 / 1' }}
            dotLottieRefCallback={(dl) => {
              lottie.current = dl as unknown as typeof lottie.current;
              dl?.addEventListener('load', () => {
                prevDuo.current = isDuo;
                dl.setFrame(isDuo ? FAMILY_TO_DUO_END_FRAME : 0);
              });
            }}
          />
        </div>
        <motion.div className={s.plans} {...enter} transition={{ ...enter.transition, delay: 0.2 }}>
          {d.plans.map((p) => (
            <PlanTile key={p.planCode} plan={p} selected={p.planCode === code} onSelect={() => setCode(p.planCode)} />
          ))}
        </motion.div>
        <Section icon={d.benefitsSection.headerIcon} title={d.benefitsSection.headerText}>
          <div className={s.benefits}>
            {d.benefitsSection.benefits.map((b, i) => (
              <div key={i}>
                <div className={s.benefit}>
                  <div className={s.benefitText}>
                    <span className={s.benefitTitle}>{b.title}</span>
                    <span className={s.benefitDesc}>{b.description}</span>
                  </div>
                  <img className={s.benefitIcon} src={b.iconUrl} alt="" />
                </div>
                {i < d.benefitsSection.benefits.length - 1 && <DashedBorder className={s.benefitDash} strokeWidth={2} strokeSpacing={5} strokeHeight={1} color="var(--nk-color-vip-dash15)" />}
              </div>
            ))}
          </div>
        </Section>
        <Section icon={d.stepsSection.headerIcon} title={d.stepsSection.headerText}>
          <Steps steps={d.stepsSection.steps} />
        </Section>
        <Section icon={d.shareSection.headerIcon} title={d.shareSection.headerText}>
          <div className={s.share}>
            <div className={s.shareTextRow}>
              <HtmlText value={d.shareSection.text} className={s.shareText} />
              <div className={s.shareMembers}>
                <PlanMembers members={[{ name: user.firstName }]} size={44} max={2} overlap={22} />
              </div>
            </div>
            <motion.button
              type="button"
              className={`nk-pressable ${s.shareButton}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => (member ? nav.push('membership/manage') : nav.toast('Invite link copied'))}
            >
              <img src={whatsapp} width={20} height={20} alt="" />
              <span className={s.shareButtonText}>{d.shareSection.button.title}</span>
            </motion.button>
          </div>
        </Section>
        <Section title={d.faqSection.headerText} faq>
          <Faq rows={d.faqSection.rows} />
        </Section>
        <motion.div {...enter}>
          <HtmlText value={d.footerNote} className={s.footerNote} />
        </motion.div>
      </div>
    </Screen>
  );
}
