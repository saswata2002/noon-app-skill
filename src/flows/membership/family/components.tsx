import { motion } from 'motion/react';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { HtmlText, type HtmlStylesheet } from '../../../components';
import { ref } from '../../../foundations/tokens';
import { duration, easing, handoff } from '../../../motion/presets';
import { icons } from '../assets';
import { cardImage, t } from '../data';
import { ChevronLeftRounded } from '../components/icons';
import { DashedLine, memberColor, VipButton } from '../components/primitives';
import { mb } from '../tokens';
import type { MembershipState } from '../../../kit/membership';
import styles from './family.module.css';

/**
 * VIPPlanMembers — `max` seat circles overlapping by `overlap`: filled seats are VIPPlanMemberColors[i] with a
 * white 1.6 ring and the bold initial (size / 2), empty seats are surfaceMuted with a 10×10 / 1.5 textMuted plus.
 * Container: surfaceTertiary pill (1px surfaceTertiary border, radius 40).
 */
export function PlanMembers({ names, size = 28, overlap = 10, max = 5, emptyBg, className }: { names: string[]; size?: number; overlap?: number; max?: number; emptyBg?: string; className?: string }) {
  const stroke = 1.6;
  const outer = size + stroke;
  return (
    <span className={[styles.members, className].filter(Boolean).join(' ')}>
      {Array.from({ length: max }, (_, i) => {
        const name = names[i];
        const ring: CSSProperties = { width: outer, height: outer, borderWidth: stroke, marginInlineStart: i === 0 ? 0 : -overlap, zIndex: max - i };
        return name ? (
          <span key={i} className={styles.memberRing} style={ring}>
            <span className={styles.memberFill} style={{ background: memberColor(i), fontSize: size / 2 }}>
              {name.trim()[0]?.toUpperCase() || ' '}
            </span>
          </span>
        ) : (
          <span key={i} className={styles.memberRing} style={ring}>
            <span className={styles.memberFill} style={{ background: emptyBg ?? ref.color('border') }}>
              <span className={styles.plus} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** VIPFamilyPlansScreen Section — white card (radius 16, 4px white border), header row icon 24 + b16 bold blueGrey */
export function FamilySection({ icon, title, titleClassName, className, children }: { icon?: string; title?: string; titleClassName?: string; className?: string; children?: ReactNode }) {
  return (
    <section className={[styles.section, className].filter(Boolean).join(' ')}>
      <div className={styles.sectionHeader}>
        {icon && <img src={icon} alt="" className={styles.sectionIcon} />}
        {title && <span className={[styles.sectionTitle, titleClassName].filter(Boolean).join(' ')}>{title}</span>}
      </div>
      {children}
    </section>
  );
}

/** VIPScrollEnterView — fade + rise 24px over 480ms (Easing.out(cubic)) the first time 25% of it is visible */
export function ScrollEnter({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ y: { ...handoff.spring, delay: delay / 1000 }, opacity: { duration: duration.slower, ease: easing.out, delay: delay / 1000 } }}
    >
      {children}
    </motion.div>
  );
}

/** VIPBenefitsModule (hideModuleWrapper = family variant) */
export function FamilyBenefits({ benefits }: { benefits: { title: string; description: string; iconUrl?: string }[] }) {
  return (
    <div className={styles.benefits}>
      {benefits.map((b, i) => (
        <div key={i}>
          <div className={styles.benefitRow}>
            <div className={styles.benefitText}>
              <span className={styles.benefitTitle}>{b.title}</span>
              <span className={styles.benefitDescription}>{b.description}</span>
            </div>
            {b.iconUrl && <img src={b.iconUrl} alt="" className={styles.benefitIcon} />}
          </div>
          {i < benefits.length - 1 && (
            <div className={styles.benefitDash}>
              <DashedLine strokeWidth={2} strokeSpacing={5} color={mb.color('mbFamDash')} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** VIPFamilyPlansScreen Steps — numbered rows, white rail (24 wide, radius 12) with 3 down-chevrons per segment */
export function Steps({ steps }: { steps: { title: string; description: string }[] }) {
  return (
    <div className={styles.steps}>
      {steps.map((s, i) => (
        <div key={i} className={styles.step}>
          <div className={styles.stepNumberColumn}>
            {steps.length > 1 && (
              <span className={styles.stepRail} data-first={i === 0 || undefined} data-last={i === steps.length - 1 || undefined}>
                {i < steps.length - 1 && (
                  <span className={styles.stepChevrons}>
                    {[0, 1, 2].map((c) => (
                      <ChevronLeftRounded key={c} width={5} height={9} stroke={mb.color('mbStepsLine')} className={styles.stepChevron} />
                    ))}
                  </span>
                )}
              </span>
            )}
            <span className={styles.stepNumber}>{i + 1}</span>
          </div>
          <div className={styles.stepContent}>
            <span className={styles.stepTitle}>{s.title}</span>
            <span className={styles.stepDescription}>{s.description}</span>
            {i < steps.length - 1 && (
              <div className={styles.stepDash}>
                <DashedLine strokeWidth={2} strokeSpacing={6} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** VIPExpandableTextModule variant 'grouped' — one surfaceGrey card, dashed #EBEBEB dividers, rows start collapsed */
export function FaqGroup({ rows }: { rows: { header: string; body: string }[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  return (
    <div className={styles.faqRows}>
      {rows.map((r, i) => (
        <div key={i}>
          <motion.button type="button" className={styles.faqRow} whileTap={{ scale: 0.99 }} onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}>
            <span className={styles.faqHeaderRow}>
              <span className={styles.faqHeader}>{r.header}</span>
              <motion.img src={icons.chevronDownM} alt="" className={styles.faqChevron} animate={{ rotate: open[i] ? -180 : 0 }} transition={{ duration: duration.medium, ease: easing.out }} />
            </span>
            <motion.span
              className={styles.faqBodyWrap}
              initial={false}
              animate={{ height: open[i] ? 'auto' : 0, opacity: open[i] ? 1 : 0 }}
              transition={{ height: handoff.spring, opacity: { duration: duration.medium, ease: easing.inOut } }}
            >
              <span className={styles.faqLine} />
              <span className={styles.faqBody}>{r.body}</span>
            </motion.span>
          </motion.button>
          {i < rows.length - 1 && <DashedLine strokeWidth={3} strokeSpacing={6} color={mb.color('mbFamFaqDash')} />}
        </div>
      ))}
    </div>
  );
}

/** VIPPlanDetailsPopup Reminder */
export function Reminder({ reminder }: { reminder: { title: string; description: string; iconUrl?: string } }) {
  return (
    <div className={styles.reminder}>
      <div className={styles.reminderHeader}>
        {reminder.iconUrl && <img src={reminder.iconUrl} alt="" className={styles.reminderIcon} />}
        <span className={styles.reminderTitle}>{reminder.title}</span>
      </div>
      <span className={styles.reminderDescription}>{reminder.description}</span>
    </div>
  );
}

const buttonSheet: HtmlStylesheet = { s: { fontWeight: 400, textDecorationLine: 'line-through' } };

/**
 * VIPSubscriptionButtonV2 with showPayment — "Pay with ⌄ / •••• 4521" row (card 44×40) + the CTA (flex 1). Row gap 20.
 */
export function SubscriptionButton({
  title,
  card,
  loading,
  onPress,
  onPaymentPress,
  className,
}: {
  title: string;
  card?: MembershipState['paymentCard'];
  loading?: boolean;
  onPress: () => void;
  onPaymentPress?: () => void;
  className?: string;
}) {
  return (
    <div className={styles.subscription}>
      {card && (
        <motion.button type="button" className={styles.payRow} whileTap={{ opacity: 0.2 }} onClick={onPaymentPress}>
          <img src={cardImage(card.brand)} alt="" className={styles.payCard} />
          <span>
            <span className={styles.payHeader}>
              <span className={styles.payLabel}>{t('vip_gc_pay_with')}</span>
              <img src={icons.chevronUpRounded} alt="" className={styles.payChevron} />
            </span>
            <span className={styles.payNumber}>
              {'•'.repeat(4)}
              {card.last4}
            </span>
          </span>
        </motion.button>
      )}
      <VipButton className={[styles.subscriptionButton, card ? styles.subscriptionButtonWithPayment : '', className].filter(Boolean).join(' ')} loading={loading} onPress={onPress}>
        <HtmlText value={title} stylesheet={buttonSheet} />
      </VipButton>
    </div>
  );
}
