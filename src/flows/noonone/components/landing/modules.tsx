import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { animate, AnimatePresence, motion, useMotionValue, useMotionValueEvent } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import chevronDownM from '@assets/vip/chevron-down-m.svg';
import dots from '@assets/vip/dots.webp';
import switchesIcon from '@assets/vip/switches.svg';
import { HtmlText } from '../../../../components';
import { useLottieReducedMotion } from '../../../../components/Lottie/Lottie';
import type { Benefit, MpBenefit } from '../../data.landing';
import { landingTokens as T } from '../../tokens';
import { VIPButton } from '../VIPButton';
import { DashedLine } from './DashedLine';
import styles from './landing.module.css';
import { useReduceMotion } from '../../../../motion/reducedMotion';
import { easing } from '../../../../motion/presets';

/** DotLottie with RN LottieView `resizeMode` (contain | cover). */
export function LottieBox({ src, fit = 'contain', loop = false, onComplete, style, className }: { src: string; fit?: 'contain' | 'cover'; loop?: boolean; onComplete?: () => void; style?: CSSProperties; className?: string }) {
  // reduced motion: no autoplay; one-shots show their last frame and still complete on time, loops hold a frame
  const rm = useLottieReducedMotion({ loop, onComplete });
  return (
    <DotLottieReact
      className={className}
      src={src}
      autoplay={rm.autoplay}
      loop={loop}
      layout={{ fit, align: [0.5, 0.5] }}
      style={style}
      dotLottieRefCallback={(d) => {
        if (d && onComplete) d.addEventListener('complete', onComplete);
        rm.attach(d);
      }}
    />
  );
}

/**
 * ModuleWrapper (noon newUI: no inner padding, marginBottom 24) + ModuleHeader customTitleNode
 * (paddingHorizontal 15, marginBottom 12; VIP title row: 20px icons either side, 12/500 centred, marginBottom −8).
 */
export function ModuleBox({ title, iconUrl, children }: { title?: string; iconUrl?: string; children: ReactNode }) {
  return (
    <div className={styles.module}>
      {title && (
        <div className={styles.moduleHeader}>
          <div className={styles.moduleTitleRow}>
            {iconUrl && <img className={styles.moduleTitleIcon} src={iconUrl} alt="" />}
            <span className={styles.moduleTitle}>{title}</span>
            {iconUrl && <img className={styles.moduleTitleIcon} style={{ transform: 'rotate(180deg)' }} src={iconUrl} alt="" />}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/** VIPBenefitsModule (landing variant, hideModuleWrapper false) */
export function BenefitsModule({ title, benefits }: { title?: string; benefits: Benefit[] }) {
  return (
    <ModuleBox title={title}>
      <div className={styles.benefits}>
        {benefits.map((b, i) => (
          <div key={i} className={styles.benefit}>
            <div className={styles.benefitText}>
              <span className={styles.benefitTitle}>{b.title}</span>
              <span className={styles.benefitDesc}>{b.description}</span>
              {b.buttonText && <VIPButton className={styles.benefitButton} textClassName={styles.benefitButtonText} title={b.buttonText} disabled={!b.cta} />}
            </div>
            {b.mpIcons?.length ? (
              <div className={styles.mpIcons}>
                {b.mpIcons.map((src, k) => (
                  <img key={k} className={styles.mpIcon} src={src} alt="" />
                ))}
              </div>
            ) : b.iconUrl ? (
              <img className={styles.benefitIcon} src={b.iconUrl} alt="" />
            ) : null}
            {i < benefits.length - 1 && <DashedLine className={styles.benefitDash} strokeWidth={2} strokeSpacing={5} strokeHeight={1} color="var(--nk-color-vip-ink15)" />}
          </div>
        ))}
      </div>
    </ModuleBox>
  );
}

/** VIPGuideStepsModule */
export function GuideStepsModule({ title, stepUnit, rows }: { title?: string; stepUnit: string; rows: { stepValue: string; stepTitle: string; stepSubtitle?: string }[] }) {
  return (
    <ModuleBox title={title}>
      <div className={styles.steps}>
        {rows.map((r, i) => (
          <div key={i} className={styles.stepRow}>
            <div className={styles.step}>
              <span className={styles.stepUnit}>{stepUnit}</span>
              <span className={styles.stepValue}>{r.stepValue}</span>
            </div>
            <div className={styles.stepDetails}>
              <div className={styles.stepTitle}>{r.stepTitle}</div>
              {r.stepSubtitle && <div className={styles.stepSubtitle}>{r.stepSubtitle}</div>}
            </div>
          </div>
        ))}
      </div>
    </ModuleBox>
  );
}

const lerp = (v: number, a: number, b: number) => a + (b - a) * v;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * VIPSlider (features/vip/components/VIPSlider): infinite ring, centre slide scale 1, neighbours scale .5 pushed out by
 * (w − w·s)/2; labels stacked vertically and cross-faded over ±h/3. 400ms ease-in-out per step, autoplay 3.5s, swipe ≥ 20px.
 */
export function Slider({
  views,
  labels,
  autoplay = true,
  offset,
  labelHeight,
  labelsClassName,
  labelClassName,
}: {
  views: ReactNode[];
  labels: ReactNode[];
  autoplay?: boolean;
  /** x offset (px) of a slide `u` slides from the centre (default VIPSlider: u·w ± (w − w·s)/2) */
  offset?: (u: number) => number;
  labelHeight?: number;
  labelsClassName?: string;
  labelClassName?: string;
}) {
  const { slideWidth: w, scale: s, ms, ease, autoplayMs, swipeThreshold } = T.slider;
  const h = labelHeight ?? T.slider.labelHeight;
  const n = views.length;
  const pos = useMotionValue<number>(0);
  const [p, setP] = useState(0);
  const [tick, setTick] = useState(0);
  const target = useRef(0);
  const startX = useRef<number | null>(null);
  useMotionValueEvent(pos, 'change', setP);

  const reduce = useReduceMotion();
  const go = (dir: 1 | -1) => {
    target.current += dir;
    // reduced motion: swipes land at once
    animate(pos, target.current, { duration: reduce ? 0 : ms / 1000, ease });
    setTick((t) => t + 1);
  };

  useEffect(() => {
    // reduced motion: no autoplay (still swipeable)
    if (!autoplay || n < 2 || reduce) return;
    const id = setInterval(() => go(1), autoplayMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, n, tick, reduce]);

  const tf = -(w - w * s) / 2;
  const base = Math.round(p);
  const ks = [-3, -2, -1, 0, 1, 2, 3];
  const mod = (i: number) => ((i % n) + n) % n;

  return (
    <div
      className={styles.slider}
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current === null || n < 2) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) >= swipeThreshold) go(dx > 0 ? -1 : 1);
      }}
    >
      <div className={styles.slides}>
        {ks.map((k) => {
          const i = base + k;
          const d = (i - p) * w;
          const t = clamp01(Math.abs(d) / w);
          const scale = lerp(t, 1, s);
          const x = offset ? offset(i - p) : d + Math.sign(d) * lerp(t, 0, -tf);
          return (
            <div key={i} className={styles.slide} style={{ transform: `translateX(${x}px) scale(${scale})` }}>
              {views[mod(i)]}
            </div>
          );
        })}
      </div>
      <div className={[styles.labels, labelsClassName].filter(Boolean).join(' ')}>
        {[-1, 0, 1].map((k) => {
          const i = base + k;
          const d = (i - p) * h;
          return (
            <div key={i} className={[styles.label, labelClassName].filter(Boolean).join(' ')} style={{ transform: `translateY(${d}px)`, opacity: clamp01(1 - Math.abs(d) / (h / 3)) }}>
              {labels[mod(i)]}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** VIPMarketplaceBenefitsCarouselModule (default ModuleWrapper, no header) */
export function MpBenefitsCarousel({ items }: { items: MpBenefit[] }) {
  return (
    <ModuleBox>
      <div className={styles.mpCarousel}>
        <Slider
          views={items.map((m) => (
            <img className={styles.slideIcon} src={m.iconUrl} alt="" draggable={false} />
          ))}
          labels={items.map((m) => (
            <>
              <span className={styles.labelTitle}>{m.title}</span>
              <span className={styles.labelSubtitle}>{m.subtitle}</span>
            </>
          ))}
        />
      </div>
    </ModuleBox>
  );
}

/** VIPBannerModule — single banner (width screen − 32, height = width × ratio / 100), lottie when lottieUrl */
export function BannerModule({ lottieUrl, ratio = 100, title }: { lottieUrl: string; ratio?: number; title?: string }) {
  return (
    <ModuleBox>
      {title && <div className={styles.bannersTitle}>{title}</div>}
      <div className={styles.banners}>
        <LottieBox src={lottieUrl} loop={false} style={{ width: 'calc(100% - 32px)', aspectRatio: `${100 / ratio}` }} />
      </div>
    </ModuleBox>
  );
}

/** VIPPlanMembers (default variant): stroke 1.6, overlap, empty seats with a 10 × 1.5 plus */
export function PlanMembers({ members, size = 28, overlap = 10, max = 5, style }: { members: { name: string }[]; size?: number; overlap?: number; max?: number; style?: CSSProperties }) {
  const stroke = T.memberStroke;
  const outer = size + stroke;
  const inner = size - stroke;
  return (
    <div className={styles.members} style={style}>
      {Array.from({ length: max }, (_, i) => {
        const m = members[i];
        return (
          <div
            key={i}
            className={styles.memberRing}
            style={{ width: outer, height: outer, borderRadius: outer / 2, borderWidth: stroke, marginInlineStart: i === 0 ? 0 : -overlap, zIndex: max - i }}
          >
            <div
              className={[styles.memberFill, !m && styles.memberEmptyFill].filter(Boolean).join(' ')}
              style={{ width: inner, height: inner, borderRadius: inner / 2, background: m ? T.memberColors[i % T.memberColors.length] : undefined }}
            >
              {m ? (
                <span className={styles.memberText} style={{ font: size >= 32 ? 'var(--nk-type-vip-member-initial16)' : 'var(--nk-type-vip-member-initial14)' }}>
                  {m.name.trim()[0]?.toUpperCase() ?? ' '}
                </span>
              ) : (
                <span className={styles.plus} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** VIPFamilyPlanModule (subtitle present → members under the title) */
export function FamilyPlanModule({
  title,
  subtitle,
  members,
  maxNumMembers,
  tags,
  buttonText,
  onPress,
}: {
  title: string;
  subtitle?: string;
  members: { name: string }[];
  maxNumMembers: number;
  tags?: { text: string; textColor: string; backgroundColors: string[] }[];
  buttonText: string;
  onPress: () => void;
}) {
  const membersNode = (
    <div className={styles.familyMembersBox}>
      <PlanMembers members={members} size={32} overlap={10} max={maxNumMembers} />
    </div>
  );
  return (
    <ModuleBox>
      <div className={styles.family}>
        <div className={styles.familyContent}>
          {!subtitle && membersNode}
          <div className={styles.familyTitles}>
            <span className={styles.familyTitle}>{title}</span>
            {subtitle && <span className={styles.familySubtitle}>{subtitle}</span>}
          </div>
          {subtitle && membersNode}
          {!!tags?.length && (
            <div className={styles.familyTags}>
              {tags.map((t, i) => (
                <span key={i} className={styles.familyTag} style={{ color: t.textColor, background: `linear-gradient(90deg, ${t.backgroundColors.join(', ')})` }}>
                  {t.text}
                </span>
              ))}
            </div>
          )}
        </div>
        <VIPButton className={styles.familyButton} textClassName={styles.familyButtonText} title={buttonText} onPress={onPress} />
      </div>
    </ModuleBox>
  );
}

/** VIPExpandableTextModule variant "grouped" (landing FAQ): rows start collapsed, 300ms expand, chevron −180°. */
export function FaqModule({ title, rows }: { title?: string; rows: { header: string; body: string }[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const { ms, chevronEase, layoutEase } = T.expand;
  return (
    <ModuleBox>
      <div className={styles.faq}>
        {title && (
          <div className={styles.faqTitleRow}>
            <span className={styles.faqTitle}>{title}</span>
          </div>
        )}
        <div className={styles.faqRows}>
          {rows.map((r, i) => (
            <div key={i}>
              <motion.button type="button" className={`nk-pressable ${styles.faqRow}`} whileTap={{ scale: 0.99 }} onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}>
                <div className={styles.faqRowContent}>
                  <div className={styles.faqHeaderRow}>
                    <span className={styles.faqHeader}>{r.header}</span>
                    <motion.span className={styles.faqChevron} animate={{ rotate: open[i] ? -180 : 0 }} transition={{ duration: ms / 1000, ease: chevronEase }}>
                      <img src={chevronDownM} alt="" />
                    </motion.span>
                  </div>
                  <AnimatePresence initial={false}>
                    {open[i] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: ms / 1000, ease: layoutEase }}
                        style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 'var(--nk-space-s8)' }}
                      >
                        <div className={styles.faqSep} />
                        <div className={styles.faqBody}>{r.body}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
              {i < rows.length - 1 && <DashedLine strokeWidth={3} strokeSpacing={6} strokeHeight={1} color="var(--nk-palette-bright-grey-color)" />}
            </div>
          ))}
        </div>
      </div>
    </ModuleBox>
  );
}

/** VIPStatusIndicator: dot (12 × scale) + pulsing radial ring (36 × scale), 91-frame loop. size 18 → scale .5. */
export function StatusIndicator({ size = 18, color = 'var(--nk-color-success)' }: { size?: number; color?: string }) {
  const k = size / 36;
  const box = 36 * 2 * k;
  const st = T.status;
  const total = st.totalMs;
  const id = useRef(`vipst${Math.random().toString(36).slice(2, 8)}`).current;
  // reduced motion: the ring holds at rest instead of pulsing (MotionConfig would keep the opacity loop)
  const reduce = useReduceMotion();
  return (
    <div className={styles.statusWrap} style={{ width: box, height: box }}>
      <motion.div
        className={styles.statusLayer}
        animate={reduce ? undefined : { scale: [0, st.maxScale, st.maxScale], opacity: [1, 1, 0, 0] }}
        transition={{
          scale: { duration: total / 1000, times: [0, st.scaleEndMs / total, 1], ease: [st.scaleEase, 'linear'], repeat: Infinity },
          opacity: { duration: total / 1000, times: [0, st.opacityStartMs / total, st.opacityEndMs / total, 1], ease: 'easeInOut', repeat: Infinity },
        }}
      >
        <svg width={36 * k} height={36 * k} viewBox="0 0 24 24">
          <defs>
            <radialGradient id={id} cx="50%" cy="50%" r="50%">
              <stop offset="0.37" style={{ stopColor: color }} />
              <stop offset="0.685" style={{ stopColor: 'var(--nk-color-vip-status-mid)' }} />
              <stop offset="1" style={{ stopColor: 'var(--nk-palette-white)' }} />
            </radialGradient>
          </defs>
          <circle cx={12} cy={12} r={11.5} fill={`url(#${id})`} fillOpacity={0.3} style={{ stroke: color }} strokeOpacity={0.4} strokeWidth={1} />
        </svg>
      </motion.div>
      <div className={styles.statusLayer}>
        <svg width={12 * k} height={12 * k} viewBox="0 0 12 12">
          <circle cx={6} cy={6} r={6} style={{ fill: color }} />
        </svg>
      </div>
    </div>
  );
}

/** VIPMembershipOverviewModule — header lottie, name + message, current plan (status tag, title, members, billing), footer row. */
export function MembershipOverviewModule({
  lottieUrl,
  title,
  subtitle,
  plan,
  footerText,
  onManage,
}: {
  lottieUrl?: string;
  title: string;
  subtitle: string;
  plan?: { title: string; statusHtml?: string; statusColor?: string; billingHtml?: string; members?: { name: string }[]; maxNumMembers?: number };
  footerText?: string;
  onManage: () => void;
}) {
  return (
    <ModuleBox>
      <div className={styles.overview}>
        <div className={styles.overviewAnim} style={{ height: T.overviewAnimHeight }}>
          {lottieUrl && <LottieBox src={lottieUrl} style={{ width: '100%', height: '100%' }} />}
        </div>
        <span className={styles.overviewTitle}>{title}</span>
        <span className={styles.overviewSubtitle}>{subtitle}</span>
        {(plan || footerText) && (
          <div className={styles.plans}>
            {plan && (
              <motion.button type="button" className={`nk-pressable ${styles.plan}`} onClick={onManage}>
                <div className={styles.planTitleRow}>
                  <div className={styles.planTitleInner}>
                    {plan.statusHtml && (
                      <div className={styles.statusTag}>
                        <HtmlText value={plan.statusHtml} className={styles.statusText} stylesheet={{ highlight: { color: plan.statusColor } }} />
                        <span className={styles.statusIndicator}>
                          <StatusIndicator size={18} color={plan.statusColor} />
                        </span>
                      </div>
                    )}
                    <span className={styles.planTitle}>{plan.title}</span>
                  </div>
                  {!!plan.maxNumMembers && plan.maxNumMembers > 1 && (
                    <div className={styles.planMembersBox}>
                      <PlanMembers members={plan.members ?? []} size={28} overlap={8} max={plan.maxNumMembers} style={{ padding: 'var(--nk-space-s4)' }} />
                    </div>
                  )}
                </div>
                {plan.billingHtml && (
                  <>
                    <div className={styles.billingBorder}>
                      <DashedLine strokeWidth={4} strokeSpacing={8} strokeHeight={1} color="var(--nk-color-border)" />
                    </div>
                    <div className={styles.billing}>
                      <div className={styles.billingRow}>
                        <HtmlText value={plan.billingHtml} className={styles.billingText} />
                      </div>
                    </div>
                  </>
                )}
              </motion.button>
            )}
            {footerText && (
              <div className={styles.footer}>
                <div className={styles.footerRow}>
                  <HtmlText value={footerText} className={styles.footerText} />
                  <motion.button type="button" className={`nk-pressable ${styles.switches}`} whileTap={{ opacity: 0.7 }} onClick={onManage} aria-label="Manage membership">
                    <img src={switchesIcon} alt="" />
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ModuleBox>
  );
}

/** VIPSavingsOverviewModule (V1 — live: isVIPSavingsWidgetV2Enabled() is false without the flag), customerState 'new' variant. */
export function SavingsOverviewModule({
  title,
  savingsText,
  multiplier = '',
  subtitle,
  customerState = 'new',
  totalSavings,
  bare,
}: {
  title: string;
  savingsText: string;
  multiplier?: string;
  subtitle?: string;
  /** savingsData.customerState: 'new' → centred potential card (member landing); anything else → overview card */
  customerState?: string;
  /** overview: Price before savingsText when set */
  totalSavings?: string;
  /** no ModuleWrapper margin (the non-member column spaces its modules) */
  bare?: boolean;
}) {
  const [before, after] = savingsText.split('{multiplier}');
  const target = Number.parseInt(multiplier, 10) || 0;
  const mv = useMotionValue<number>(0);
  const [v, setV] = useState(0);
  useMotionValueEvent(mv, 'change', (x) => setV(Math.round(x)));
  useEffect(() => {
    // VIPAnimatedDigits sourceValue 0 → targetValue, duration 1200, precision 0
    const a = animate(mv, target, { duration: 1.2, ease: easing.out });
    return () => a.stop();
  }, [mv, target]);
  if (customerState !== 'new') {
    // non-'new' branch: title b14, savingsText as-is (h28/800) or totalSavings + b16 medium text, mint subtitle strip
    const card = (
      <div className={styles.savings}>
        <div className={styles.savingsOverview}>
          <span className={styles.savingsOverviewTitle}>{title}</span>
          <div className={styles.savingsOverviewAmountRow}>
            {totalSavings != null ? (
              <>
                <span className={styles.savingsOverviewAmount}>{totalSavings}</span>
                <span className={styles.savingsOverviewTextBox}>
                  <span className={styles.savingsOverviewText}>{savingsText}</span>
                </span>
              </>
            ) : (
              <span className={styles.savingsOverviewAmount}>{savingsText}</span>
            )}
          </div>
          {subtitle && (
            <div className={styles.savingsOverviewSubtitleBox}>
              <span className={styles.savingsOverviewSubtitle}>{subtitle}</span>
            </div>
          )}
        </div>
      </div>
    );
    return bare ? card : <ModuleBox>{card}</ModuleBox>;
  }
  return (
    <ModuleBox>
      <div className={styles.savings}>
        <img className={styles.dotsLeft} src={dots} alt="" />
        <img className={styles.dotsRight} src={dots} alt="" />
        <div className={styles.savingsCentered}>
          <span className={styles.savingsTitle}>{title}</span>
          <div className={styles.savingsAmountRow}>
            {before && <span className={styles.savingsAmount}>{before}</span>}
            <span className={styles.savingsAmount}>{v}</span>
            {after && <span className={styles.savingsAmount}>{after}</span>}
          </div>
          {subtitle && <span className={styles.savingsSubtitle}>{subtitle}</span>}
        </div>
      </div>
    </ModuleBox>
  );
}
