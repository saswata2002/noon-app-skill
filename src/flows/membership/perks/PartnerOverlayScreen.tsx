import { motion } from 'motion/react';
import { HtmlText } from '../../../components';
import { useNav } from '../../../kit/Navigator';
import { useMembership } from '../../../kit/membership';
import { duration, easing } from '../../../motion/presets';
import chevronUp from '@assets/vip/chevron-up-rounded.svg';
import { cardImage, t } from '../data';
import { acquisitionRoute } from '../links';
import { useEnsureMembership } from '../store';
import { mb } from '../tokens';
import { PerkSheet, usePerkSheet } from './PerkSheet';
import { partnerPopup } from './perksData';
import styles from './perks.module.css';

/**
 * VIPPartnerOverlayScreen — src/components/Overlay (white, r16) with the server `specialPlanBanner` image (full width,
 * contain) and a button row (12 top padding + 1px #F0F1F4 top border, 16 sides, overlayBottomSpacing bottom):
 * '/create' = VIPSubscriptionButtonV2 (56h r16, white 18 bold; 48h + "Pay with" card row when a saved card exists),
 * '/plan-select' = server-coloured Button → VIPUtil.showPlanSelectV2 (acquisition).
 */
export function PartnerOverlayScreen({ params }: { params: { state?: string } }) {
  useEnsureMembership(params.state);
  return (
    <PerkSheet kind="overlay" className={styles.partnerSheet}>
      <PartnerContent />
    </PerkSheet>
  );
}

function PartnerContent() {
  const nav = useNav();
  const { close } = usePerkSheet();
  const card = useMembership((s) => s.paymentCard);
  const { plan, buttons } = partnerPopup;
  const showPayment = !!card;

  const subscribe = () => close(() => nav.push(acquisitionRoute(card ? 'payment' : 'landing'), { planCode: plan.id, source: '/cobrandPartnerPopup' }));

  return (
    <div className={styles.partnerContainer}>
      {/* specialPlanBanner — server image; token-coloured placeholder with the banner copy */}
      <div className={styles.partnerBanner}>
        <span className={styles.partnerBannerPartner}>{partnerPopup.partner} × noon One</span>
        <span className={styles.partnerBannerTitle}>{partnerPopup.bannerTitle}</span>
        <span className={styles.partnerBannerSub}>{partnerPopup.bannerSubtitle}</span>
        <span className={styles.partnerBannerNote}>{partnerPopup.bannerNote}</span>
      </div>
      <div className={styles.partnerButtons}>
        {buttons.map((b) =>
          b.cta === '/create' ? (
            <div key={b.cta} className={styles.subButtonRow}>
              {showPayment && (
                <motion.button type="button" className={styles.subPayRow} whileTap={{ opacity: 0.2 }} onClick={subscribe}>
                  <img className={styles.subPayCard} src={cardImage(card?.brand)} alt="" />
                  <span>
                    <span className={styles.subPayHeader}>
                      {t('vip_gc_pay_with')}
                      <img className={styles.subPayChevron} src={chevronUp} alt="" />
                    </span>
                    <span className={styles.subPayText}>
                      {'•'.repeat(4)}
                      {card?.last4}
                    </span>
                  </span>
                </motion.button>
              )}
              <motion.button
                type="button"
                className={styles.partnerButton}
                data-primary
                data-with-payment={showPayment || undefined}
                disabled={plan.isSubscribed}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: duration.base, ease: easing.inOut }}
                onClick={() => window.setTimeout(subscribe, 200)}
              >
                <HtmlText value={b.text} stylesheet={{ p: { font: mb.type('mbPerkButton18') }, s: { fontWeight: 400, textDecorationLine: 'line-through', fontSize: 16 } }} />
              </motion.button>
            </div>
          ) : (
            <motion.button
              key={b.cta}
              type="button"
              className={styles.partnerButton}
              style={{ background: b.color, borderColor: b.borderColor, color: b.textColor }}
              whileTap={{ opacity: 0.2 }}
              onClick={() => close(() => nav.push(acquisitionRoute('planSelect'), { preSelectedPlanCode: plan.id, source: '/cobrandPartnerPopup' }), false)}
            >
              {b.text}
            </motion.button>
          ),
        )}
      </div>
    </div>
  );
}
