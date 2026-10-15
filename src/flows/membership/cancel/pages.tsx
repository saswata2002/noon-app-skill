import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import { HtmlText, MaskIcon, Spinner } from '../../../components';
import { ref } from '../../../foundations/tokens';
import { useNav } from '../../../kit/Navigator';
import { duration, easing, handoff } from '../../../motion/presets';
import { icons } from '../assets';
import { cardImage, t } from '../data';
import { DashedLine, VipButton } from '../components/primitives';
import { mb } from '../tokens';
import type { BenefitsPage as BenefitsData, CancelReason, LeaveFamilyPage, OfferPage, ReminderPage as ReminderData, ReviewPage, SurveyPage as SurveyData } from './cancelData';
import { sheet } from './parts';
import styles from './cancel.module.css';

const blueGrey = ref.color('textBody'); // VIPColors.blueGrey #343D54

/** BenefitsScreen — header (28 bold / b16), benefit tiles, unused benefits, contact support. */
export function BenefitsPage({ data, onCta }: { data: BenefitsData; onCta: (cta: string) => void }) {
  const nav = useNav();
  const small = data.benefits.length > 2;
  const iconW = small ? 44 : 56;
  return (
    <div className={styles.benefits}>
      <div className={styles.headerBlock}>
        <HtmlText value={data.title} stylesheet={sheet(mb.type('mbCTitle28'), blueGrey, { marginBottom: 4, display: 'block' })} />
        <HtmlText value={data.subTitle} stylesheet={sheet(mb.type('mbB16Regular'), blueGrey, { letterSpacing: mb.space('mbLs15'), display: 'block' })} />
      </div>
      <div className={styles.benefitsRow}>
        {data.benefits.map((b, i) => (
          <div key={i} className={styles.benefitCard}>
            <div className={small ? styles.benefitTextSmall : styles.benefitTextBig}>
              <span className={small ? styles.benefitTitleSmall : styles.benefitTitleBig}>{b.title}</span>
              <HtmlText value={b.description} stylesheet={small ? sheet(mb.type('mbB16Bold'), blueGrey, { letterSpacing: mb.space('mbLs15') }) : sheet(mb.type('mbCBig19'), blueGrey)} />
            </div>
            {b.iconUrl && <img className={styles.benefitIcon} src={b.iconUrl} alt="" width={iconW} height={iconW * ((b.iconRatio ?? 100) / 100)} />}
          </div>
        ))}
      </div>
      {data.unusedBenefits?.map((u, i) => (
        <div key={i} className={styles.unused}>
          {u.iconUrl && <img className={styles.unusedIcon} src={u.iconUrl} alt="" />}
          <div className={styles.unusedText}>
            <span className={styles.unusedTitle}>{u.title}</span>
            <span className={styles.unusedDesc}>{u.description}</span>
          </div>
          {u.button && (
            <VipButton className={styles.unusedButton} onPress={() => onCta(u.button!.cta)}>
              {u.button.text}
            </VipButton>
          )}
        </div>
      ))}
      <div
        className={styles.support}
        onClick={(e) => {
          // HtmlView onLinkPress → noon.HelpScreen overlay (SmartAssist ACCOUNT entry point)
          if ((e.target as HTMLElement).closest('a')) {
            e.preventDefault();
            nav.push('account/account');
          }
        }}
      >
        <HtmlText value={t('vip_one_cancel_support')} stylesheet={sheet(ref.type('text12MediumLh18'), blueGrey, { letterSpacing: mb.space('mbLs10') })} />
      </div>
    </div>
  );
}

/** ReminderScreen (trial, overlay) — header, current plan card + status tag, billing row, reminder card. */
export function ReminderPage({ data }: { data: ReminderData }) {
  const { plan, status, reminder } = data;
  return (
    <div className={styles.reminderPage}>
      <div className={styles.headerBlock}>
        <HtmlText value={data.title} stylesheet={sheet(mb.type('mbCTitle22'), blueGrey, { marginBottom: 4, letterSpacing: mb.space('mbCLs68'), display: 'block' })} />
        <HtmlText value={data.subTitle} stylesheet={sheet(mb.type('mbCSub14'), ref.color('textSecondary'), { letterSpacing: mb.space('mbCLs68'), display: 'block' })} />
      </div>
      {plan && (
        <div className={styles.rPlan}>
          <div className={styles.rTitleRow}>
            <div className={styles.rTitleInner}>
              <span className={styles.rCurrent}>{t('vip_current_plan')}</span>
              <span className={styles.rPlanTitle}>{plan.title}</span>
            </div>
            {status && (
              <div className={styles.rStatus} style={{ background: status.backgroundColor, borderColor: status.borderColor }}>
                <HtmlText value={status.text} stylesheet={{ p: { font: mb.type('mbCB12Semibold'), textAlign: 'center', display: 'block' }, highlight: { color: status.highlightColor } }} />
              </div>
            )}
          </div>
          <div className={styles.rBilling}>
            <div className={styles.rBillingRow}>
              <img src={icons.calendarCheck} alt="" />
              <HtmlText value={plan.billingInfo} stylesheet={{ p: { font: mb.type('mbCRegular12'), color: ref.color('textSecondary'), flex: 1 } }} />
            </div>
          </div>
        </div>
      )}
      <div className={styles.rReminder}>
        <div className={styles.rReminderHeader}>
          {reminder.iconUrl && <img src={reminder.iconUrl} alt="" />}
          <span className={styles.rReminderTitle}>{reminder.title}</span>
        </div>
        <div className={styles.rReminderDesc}>{reminder.description}</div>
      </div>
    </div>
  );
}

const TEXT_INPUT_HEIGHT = 80;

/** SurveyScreen — reasons radio list (radio2 icons, 3/5 dashed separators), collapsible required comment, tip. */
export function SurveyPage({ data, reasons, onChange }: { data: SurveyData; reasons: CancelReason[]; onChange: (reason: CancelReason | null, comment: string) => void }) {
  const [selected, setSelected] = useState<CancelReason | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const label = useMotionValue(0);
  const ly = useTransform(label, [0, 1], [TEXT_INPUT_HEIGHT / 2 - 8, 8]);
  const lx = useTransform(label, [0, 1], [12, 0]);
  const ls = useTransform(label, [0, 1], [1, 0.85]);

  useEffect(() => {
    onChange(selected, comment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, comment]);
  const animateTo = (v: number) => animate(label, v, handoff.spring);

  return (
    <div className={styles.survey} onPointerDown={(e) => !(e.target as HTMLElement).closest('textarea') && inputRef.current?.blur()}>
      <div className={styles.headerBlock}>
        <HtmlText value={data.title} stylesheet={sheet(mb.type('mbCTitle28'), blueGrey, { marginBottom: 6, display: 'block' })} />
        <HtmlText value={data.subTitle} stylesheet={sheet(mb.type('mbB16Regular'), blueGrey, { letterSpacing: mb.space('mbLs15'), display: 'block' })} />
      </div>
      <div className={styles.options}>
        {reasons.map((r, i) => {
          const on = selected?.reasonCode === r.reasonCode;
          const showComment = on && r.isCommentRequired;
          return (
            <div key={r.reasonCode}>
              <button type="button" className={styles.optionRow} onClick={() => setSelected(r)}>
                <span className={styles.optionText}>{r.text}</span>
                <img src={on ? icons.radio2Checked : icons.radio2Unchecked} alt="" />
              </button>
              <motion.div className={styles.commentsOuter} initial={false} animate={{ height: showComment ? 'auto' : 0, opacity: showComment ? 1 : 0 }} transition={{ height: handoff.spring, opacity: { duration: duration.medium, ease: showComment ? easing.out : easing.inOut } }}>
                <div className={[styles.comments, error ? styles.commentsError : ''].join(' ')}>
                  <motion.span className={styles.commentsLabel} style={{ y: ly, x: lx, scale: ls }}>
                    {t('vip_membership_cancellation_comment_placeholder')}
                  </motion.span>
                  <textarea
                    ref={inputRef}
                    className={styles.commentsInput}
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      setError(!e.target.value && focused ? t('vip_one_required_field') : '');
                    }}
                    onFocus={() => {
                      setFocused(true);
                      animateTo(1);
                    }}
                    onBlur={() => {
                      setFocused(false);
                      if (!comment) animateTo(0);
                      setError('');
                    }}
                    autoCapitalize="none"
                  />
                  {!!comment && (
                    <button
                      type="button"
                      className={styles.clearButton}
                      onClick={() => {
                        setComment('');
                        inputRef.current?.blur();
                        animateTo(0);
                      }}
                    >
                      <img src={icons.closeModal} alt="Clear" />
                    </button>
                  )}
                </div>
                {!!error && <div className={styles.errorText}>*{error}</div>}
              </motion.div>
              {i < reasons.length - 1 && <DashedLine color={ref.color('bgPage')} strokeWidth={3} strokeSpacing={5} />}
            </div>
          );
        })}
      </div>
      {data.tip && (
        <div className={styles.tip}>
          <HtmlText value={data.tip} stylesheet={sheet(ref.type('text14RegularLh20'), blueGrey, { letterSpacing: mb.space('mbLs10') })} />
        </div>
      )}
    </div>
  );
}

/** VIPCouponShape mask (r14, side cut-outs r12 at mid height) as an SVG <clipPath>. */
function CouponClip({ id, width, height }: { id: string; width: number; height: number }) {
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
          <rect x={0} y={0} width={width} height={height} rx={14} fill="white" />
          <circle cx={0} cy={height / 2} r={12} fill="black" />
          <circle cx={width} cy={height / 2} r={12} fill="black" />
        </mask>
      </defs>
    </svg>
  );
}

/** VIPWave — quadratic wave, `cycles` humps, 12px tall. */
function Wave({ color, width, cycles = 36, height = 12 }: { color: string; width: number; cycles?: number; height?: number }) {
  const cy = height / 2;
  const cw = width / cycles;
  let d = `M0 ${cy}`;
  for (let i = 0; i < cycles; i++) {
    const end = (i + 1) * cw;
    d += i === 0 ? ` Q${cw / 2} 0 ${end} ${cy}` : ` T${end} ${cy}`;
  }
  d += ` L${width} ${height} L0 ${height} Z`;
  return (
    <svg className={styles.wave} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={d} fill={color} />
    </svg>
  );
}

const fmtTimer = (diff: number) => {
  if (diff <= 0) return '00:00:00';
  const days = Math.floor(diff / 864e5);
  if (days >= 1) return `${days} ${t('vip_days', { count: days })}`;
  const h = Math.floor((diff % 864e5) / 36e5);
  const m = Math.floor((diff % 36e5) / 6e4);
  const s = Math.floor((diff % 6e4) / 1e3);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
};

/** DiscountOfferScreen + VIPTimedExclusiveOfferModule (coupon-masked card, dashed price box, wave, countdown). */
export function DiscountOfferPage({ data }: { data: OfferPage }) {
  const { timedPlanData } = data;
  const { plan, timer } = timedPlanData;
  const [endTime, setEndTime] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 358, h: 244 });
  const id = useId().replace(/:/g, '');

  // VIPService.startPlanTimer(planCode) → { endTime } (demo: 23h 59m from now)
  useEffect(() => {
    const tm = setTimeout(() => setEndTime(Date.now() + (23 * 3600 + 59 * 60 + 41) * 1000), 400);
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(tm);
      clearInterval(iv);
    };
  }, []);
  useEffect(() => {
    if (wrap.current) setSize({ w: wrap.current.offsetWidth, h: wrap.current.offsetHeight });
  }, []);

  return (
    <div className={styles.offer}>
      <div className={styles.offerHeader}>
        <HtmlText value={data.title} stylesheet={sheet(mb.type('mbCTitle30'), blueGrey, { marginBottom: 4, letterSpacing: mb.space('mbCLs68'), display: 'block' })} />
        <HtmlText value={data.subTitle} stylesheet={sheet(mb.type('mbCSub17'), ref.color('textSecondary'), { letterSpacing: mb.space('mbCLs68'), display: 'block' })} />
      </div>
      <div className={styles.coupon} ref={wrap} style={{ mask: `url(#${id})`, WebkitMask: `url(#${id})` }}>
        <CouponClip id={id} width={size.w} height={size.h} />
        <div className={styles.couponInner}>
          <div className={styles.planInfo}>
            {timedPlanData.headerIconUrl && <img src={timedPlanData.headerIconUrl} alt="" width={37} height={21} style={{ marginBottom: 8 }} />}
            <span className={styles.offerHeaderText}>{timedPlanData.headerText}</span>
            <div className={styles.priceBox}>
              <span className={styles.priceText}>{plan.monthlyPrice.replace(/<br>|<\/?b>/g, '')}</span>
            </div>
            <HtmlText value={plan.description} stylesheet={{ p: { font: ref.type('text12RegularLh18'), letterSpacing: mb.space('mbLs10'), color: ref.color('textSecondary'), textAlign: 'center' } }} />
          </div>
          <Wave color={timer?.backgroundColor ?? ref.palette('blueGray50')} width={size.w} />
          <div className={styles.timer} style={{ background: timer?.backgroundColor ?? ref.palette('blueGray50') }}>
            {endTime ? (
              <>
                <MaskIcon src={icons.stopwatch} size={16} color={timer?.textColor ?? ref.palette('black')} />
                <span className={styles.timerText} style={{ color: timer?.textColor }}>
                  {t('vip_one_expires_in', { duration: fmtTimer(endTime - now) })}
                </span>
              </>
            ) : (
              <Spinner size={16} color={timer?.textColor} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** VIPReviewCancelUpgradeScreen — title, info card (subTitle html), divider, [Pay with card] + confirm button. */
export function ReviewPageView({ data, buttonText, loading, onConfirm, onChangePayment, card }: { data: ReviewPage; buttonText?: string; loading?: boolean; onConfirm: () => void; onChangePayment?: () => void; card?: { brand: 'visa' | 'mastercard' | 'amex' | 'mada'; last4: string } }) {
  const textColor = data.textColor ?? ref.color('textMuted');
  const confirm = buttonText || data.buttons?.[0]?.text || 'Confirm';
  return (
    <div className={styles.review}>
      {data.title && <span className={styles.reviewTitle} style={{ color: data.titleColor ?? ref.color('textPrimary') }}>{data.title}</span>}
      <div className={styles.reviewBody}>
        {data.subTitle && (
          <div className={styles.infoCard} style={{ background: data.backgroundColor ?? ref.color('bgSubtle') }}>
            <HtmlText value={data.subTitle} stylesheet={{ p: { font: ref.type('text12RegularLh18'), letterSpacing: mb.space('mbLs10'), color: textColor }, b: { color: textColor }, span: { color: textColor } }} />
          </div>
        )}
        <div className={styles.reviewFooter}>
          <div className={styles.divider} />
          <div className={styles.actionRow}>
            {card && (
              <button type="button" className={styles.payRow} disabled={!onChangePayment || loading} onClick={onChangePayment}>
                <span className={styles.payIcon}>
                  <img src={cardImage(card.brand)} alt="" />
                </span>
                <span className={styles.payCopy}>
                  <span className={styles.payHeader}>
                    {t('vip_gc_pay_with')}
                    {onChangePayment && <img src={icons.chevronUpRounded} alt="" />}
                  </span>
                  <span className={styles.payText}>
                    {'•'.repeat(4)}
                    {card.last4}
                  </span>
                </span>
              </button>
            )}
            <VipButton className={styles.confirmButton} loading={loading} disabled={loading} onPress={onConfirm}>
              {confirm}
            </VipButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/** VIPLeaveFamilyPlanOverlayScreen — 56px header icon, h18 bold title, b14 medium description (centred). */
export function LeaveFamilyView({ data }: { data: LeaveFamilyPage }) {
  return (
    <div className={styles.leave}>
      <div className={styles.leaveCard}>
        {data.headerIconUrl && <img className={styles.leaveIcon} src={data.headerIconUrl} alt="" />}
        <div className={styles.leaveText}>
          {data.title && <span className={styles.leaveTitle}>{data.title}</span>}
          {data.subTitle && <span className={styles.leaveDesc}>{data.subTitle}</span>}
        </div>
      </div>
    </div>
  );
}
