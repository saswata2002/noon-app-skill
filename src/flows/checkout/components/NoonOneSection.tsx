import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HtmlText, Switch, type HtmlStylesheet } from '../../../components';
import { useNav } from '../../../kit/Navigator';
import { useIsNoonOneMember } from '../../../kit/membership';
import { CURRENCY } from '../../noonone/data';
import { integratedNoonone as data } from '../../noonone/data.entry';
import { checkoutEnrollmentStore, useCheckoutEnrollment } from '../../noonone/components/entry/checkoutEnrollment';
import { entryTokens } from '../../noonone/tokens';
import { checkoutStore } from '../store';
import noonOneIcon from '@assets/noonone/entry/noon-one.webp';
import oneLozenge from '@assets/checkout/figma/noonone-logo-a.svg';
import oneWordmark from '@assets/checkout/figma/noonone-logo-b.svg';
import { taf } from '../data';
import { NoonOneCtaReveal } from './NoonOneCtaReveal';
import styles from './NoonOneSection.module.css';
import { useReduceMotion } from '../../../motion/reducedMotion';
import { duration, easing, handoff } from '../../../motion/presets';
import { haptic } from '../../../motion/haptics';

const { checkout: a } = entryTokens;
const green = { color: 'var(--nk-color-best-price-ink)' };
/** styles.ts titleStyle / subtitleStyle / ctaStyle */
const titleStyle: HtmlStylesheet = { green, medium: { fontSize: 14 } };
const subtitleStyle: HtmlStylesheet = { green, bluegray: { color: 'var(--nk-color-text-primary)' } };
const ctaStyle: HtmlStylesheet = { green };
/** CTA_REVEAL_LAYOUT_TIMEOUT */
const REVEAL_LAYOUT_TIMEOUT_MS = 1000;

/*
 * The toggle, smooth and natural (timing: the Test01 motion reference). The knob flips on the tap itself (the
 * enrolment is committed after the checkout update); then, together: the green blooms out behind the card, the CTA
 * strip collapses while the savings subtitle grows in (their heights crossfade on the Test01 spring, so the card glides
 * to its new height instead of popping), and the "First month FREE" nudge opens one stagger step later. No `layout`
 * scaling (it stretched the text); every gap travels with its element (animated margins), so nothing snaps.
 */
const grow = (gap: number, delay = 0) => ({
  initial: { height: 0, marginTop: 0, opacity: 0 },
  animate: {
    height: 'auto',
    marginTop: gap,
    opacity: 1,
    transition: {
      height: { ...handoff.spring, delay },
      marginTop: { ...handoff.spring, delay },
      opacity: { duration: handoff.fade.out, ease: handoff.easeOut, delay: delay + 0.06 },
    },
  },
  exit: {
    height: 0,
    marginTop: 0,
    opacity: 0,
    transition: { height: handoff.spring, marginTop: handoff.spring, opacity: { duration: handoff.fade.io * 0.7, ease: handoff.easeInOut } },
  },
});

/**
 * NoonCheckoutNoonOneSection (sectionsOrder `integrated_noonone`): white card with "Get FREE delivery with [one]" +
 * toggle (react-native-switch 16/34/20, grass700 / lightGreyColor), green CTA strip ("Save AED 15 on this order",
 * NoonOneCtaReveal lottie on first show). Toggling on (NoonCheckoutService.setOne → reloader) grows a radial green
 * gradient behind the card (scale 0 → 6, 600ms), swaps the CTA for the savings subtitle and reveals the white
 * discount nudge ("First month FREE, then AED 25/mo ›" → noon-one-all-plans). Hidden for members (server omits it).
 */

/**
 * `variant="banner"` = Figma "All flows" Banner/.base (127:44088): same toggle behaviour, Figma title copy
 * ("Get free delivery with" + the 35×24 "one" lozenge window), 12px top / 4px side padding, strip copy above.
 */
export function NoonOneSection({ variant = 'master' }: { variant?: 'master' | 'banner' }) {
  const banner = variant === 'banner';
  const nav = useNav();
  const member = useIsNoonOneMember();
  const enrolled = useCheckoutEnrollment((s) => s.enrolled);
  // reduced motion: skip the CTA reveal (odometer + squeeze); the settled CTA shows at once
  const reduce = useReduceMotion();
  const [revealing, setRevealing] = useState(!enrolled && !!data.animation && !reduce);
  // NoonOneCtaReveal: measure the card and the CTA strip once, then the reveal runs its own timeline
  const cardRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [geom, setGeom] = useState<{ card: { w: number; h: number }; cta: { x: number; y: number; w: number; h: number } } | null>(null);
  useLayoutEffect(() => {
    const card = cardRef.current;
    const cta = ctaRef.current;
    if (!revealing || !card || !cta || geom) return;
    const c = card.getBoundingClientRect();
    const r = cta.getBoundingClientRect();
    setGeom({ card: { w: c.width, h: c.height }, cta: { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height } });
  }, [revealing, geom]);
  // CTA_REVEAL_LAYOUT_TIMEOUT: if the card never measures, uncover it (the reveal owns its own load / end timing)
  useEffect(() => {
    if (!revealing || geom) return;
    const id = setTimeout(() => setRevealing(false), REVEAL_LAYOUT_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [revealing, geom]);

  // the switch answers the tap at once; the store follows once the checkout update has run
  const [on, setOn] = useState(enrolled);
  const pending = useRef(false);
  useEffect(() => {
    if (!pending.current) setOn(enrolled);
  }, [enrolled]);

  if (member) return null;

  const toggle = () => {
    const next = !on;
    setOn(next);
    haptic('tap');
    pending.current = true;
    checkoutStore
      .update({})
      .then(() => checkoutEnrollmentStore.patch({ enrolled: next }))
      .finally(() => {
        pending.current = false;
      });
  };
  const radius = on ? 'var(--nk-radius-chk-noon-one-on)' : 'var(--nk-radius-chk-noon-one)';
  const gap = banner ? 12 : 14; // .container gap (master 14 / banner 12), now a margin that collapses with the strip

  return (
    <motion.div
      className={banner ? `${styles.outer} ${styles.banner}` : styles.outer}
      initial={false}
      animate={{ borderRadius: radius, padding: on ? '2px 2px 0px' : '0px 0px 0px' }}
      transition={{ borderRadius: { duration: duration.medium, ease: easing.inOut }, padding: handoff.spring }}
    >
      {/* the green blooms out from the card's centre (and folds back in when switched off) */}
      <motion.div
        className={styles.gradient}
        initial={false}
        animate={{ scale: on ? a.gradientScale : 0, opacity: on ? 1 : 0 }}
        transition={
          on
            ? { scale: { duration: duration.slower, ease: easing.out }, opacity: { duration: duration.medium, ease: easing.out } }
            : { scale: { duration: duration.slow, ease: easing.inOut }, opacity: { duration: duration.slow, ease: easing.inOut } }
        }
      />
      <motion.div ref={cardRef} className={styles.card}>
        <motion.div className={styles.container} initial={false} animate={{ paddingTop: on ? 10 : gap }} transition={handoff.spring}>
          <div className={styles.info}>
            <button type="button" className={`nk-pressable ${styles.toggle}`} onClick={toggle} aria-pressed={on}>
              <span className={styles.titleRow}>
                <HtmlText base value={banner ? taf.noonOneTitle : data.title} stylesheet={titleStyle} className={styles.titleText} />
                {banner ? (
                  <span className={styles.lozenge} role="img" aria-label="noon One">
                    <img className={styles.lozengeA} src={oneLozenge} width={33.3991} height={19.3594} alt="" />
                    <img className={styles.lozengeB} src={oneWordmark} width={22.5252} height={7.07141} alt="" />
                  </span>
                ) : (
                  <img className={styles.icon} src={noonOneIcon} alt="noon One" />
                )}
              </span>
              <Switch as="span" value={on} width={34} height={20} knob={16} inset={2} onColor="var(--nk-color-best-price-ink)" offColor="var(--nk-color-border)" />
            </button>
            <AnimatePresence initial={false}>
              {on && (
                <motion.div key="sub" className={styles.grow} {...grow(4)}>
                  <div className={styles.subtitle}>
                    <HtmlText base value={data.subtitle} stylesheet={subtitleStyle} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence initial={false}>
            {!on && (
              <motion.div key="cta" ref={ctaRef} className={`${styles.cta} ${styles.grow}`} {...grow(gap)}>
                <div className={styles.ctaPad}>
                  {/* the strip carries the CTA copy the reveal settles into ("Save Đ 15 on this order") — no separate banner line */}
                  {/* hidden while the reveal plays: its settled text lands exactly here and hands over in one frame */}
                  <span style={{ display: 'block', visibility: revealing && geom ? 'hidden' : 'visible' }}>
                    <HtmlText base value={data.cta} stylesheet={ctaStyle} className={banner ? styles.bannerCta : undefined} />
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <AnimatePresence>
          {revealing && !on && geom && data.animation && (
            <motion.div key="reveal" className={styles.revealHost}>
              <NoonOneCtaReveal card={geom.card} cta={geom.cta} animation={data.animation} onDone={() => setRevealing(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence initial={false}>
        {on && (
          <motion.div key="nudge" className={styles.grow} {...grow(0, handoff.stagger.in)}>
            <button type="button" className={`nk-pressable ${styles.nudge}`} onClick={() => nav.push('noonone/plans', { source: '/checkout' })}>
              <span className={styles.nudgeText}>
                <span className={styles.nudgeStrong}>{data.discountNudge}</span>
                {/* !planDiscountPercentage && planTrialValid → noon_checkout_noon_one_plan_amount */}
                {!data.planDiscountPercentage && <span className={styles.nudgePlan}>{`, then ${CURRENCY} ${data.planAmount}/mo`}</span>}
              </span>
              {/* NoonIcons.chevronThick (chevron-thick.svg) inline: a tiny SVG is inlined by Vite as an unquoted data URL, which breaks CSS masks */}
              <svg className={styles.chevron} width={12} height={12} viewBox="0 0 17 16" fill="var(--nk-color-text-inverse)" stroke="var(--nk-color-text-inverse)" aria-hidden>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9.20985 8.70574C9.60038 8.31522 9.60038 7.68205 9.20985 7.29153L6.06807 4.14975C5.83376 3.91543 5.83376 3.53553 6.06807 3.30122C6.30238 3.0669 6.68228 3.0669 6.9166 3.30122L10.9069 7.29153C11.2974 7.68205 11.2974 8.31522 10.9069 8.70574L6.9166 12.696C6.68228 12.9304 6.30238 12.9304 6.06807 12.696C5.83376 12.4617 5.83376 12.0818 6.06807 11.8475L9.20985 8.70574Z"
                />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
