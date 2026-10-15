import { motion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { HtmlText, Screen } from '../../../components';
import { useNav } from '../../../kit/Navigator';
import greenCheck from '@assets/vip/one-green-check.webp';
import { VIPButton } from '../components/VIPButton';
import { SubscribeButton } from '../components/offers/SubscribeButton';
import { ChevronLeft } from '../components/offers/Primitives';
import { partnerCampaigns } from '../data.offers';
import { completeSubscription, noononeStore, useNoonone } from '../store';
import { handoff } from '../../../motion/presets';
import { offersTokens as T } from '../tokens';
import styles from './OffersV2Screen.module.css';

type Params = { campaignCode?: string; voucherCode?: string };

/**
 * VIPOffersV2Screen — partner offer page (VIPUtil.showPartnerOffer; /noon-one-partner-offer?campaignCode=, /noon-one-stc,
 * landing flyout with campaignCode). Floating back button + "Exclusive offer" header fading in over 20px of scroll,
 * CMS VIP_PARTNER_OFFER_PLAN_MODULE (partner art, "code applied" header, message, green CTA, explore plans, footer note),
 * payment terms card and a sticky footer CTA that slides away while the module CTA is on screen
 * (VIPModuleRenderer shouldHideStickyButton → VIPEventEmitter.vipHideButton).
 */
export function OffersV2Screen({ params }: { params: Params }) {
  const nav = useNav();
  const campaign = partnerCampaigns[params.campaignCode ?? 'enbd'] ?? partnerCampaigns.enbd;
  const { plan, buttonSection, showPlansButton, animationUrl, ratio, heroColor } = campaign;
  const voucherCode = params.voucherCode ?? campaign.voucherCode;
  const payment = useNoonone((s) => s.paymentMethod);
  const [loading, setLoading] = useState(false);
  const [hideSticky, setHideSticky] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const moduleCta = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const headerOpacity = useTransform(scrollY, [0, T.headerFade], [0, 1], { clamp: true });

  useEffect(() => {
    const el = moduleCta.current;
    const root = scrollRef.current;
    if (!el || !root) return;
    const io = new IntersectionObserver(([e]) => setHideSticky(e.isIntersecting), { root, threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /** activateOffer → useVIPQuickPayment.handlePayment (saved card) → createSubscription; success → pop + landing animation */
  const activate = () => {
    noononeStore.patch({ voucherCode, selectedPlan: plan });
    if (!payment) {
      nav.push('noonone/payment', { planCode: plan.planCode, voucherCode });
      return;
    }
    setLoading(true);
    setTimeout(() => completeSubscription(nav, plan), T.apiMs);
  };

  const header = (
    <div className={styles.headerWrapper}>
      <motion.div className={styles.headerBg} style={{ opacity: headerOpacity }} />
      <div className={styles.header}>
        <button type="button" className={`nk-pressable ${styles.backButton}`} onClick={nav.back} aria-label="Back">
          <span className={styles.backIcon}>
            <ChevronLeft width={9} height={18} />
          </span>
        </button>
        <motion.span className={styles.headerTitle} style={{ opacity: headerOpacity }}>
          Exclusive offer
        </motion.span>
      </div>
    </div>
  );

  return (
    <div className={styles.root}>
    <Screen background="var(--nk-palette-border-primary)" safeTop={false} ref={scrollRef} overlayHeader header={header} contentStyle={{ paddingBottom: 0 }}>
      <div className={styles.list}>
        <div className={styles.topSpacer} />
        {/* VIPPartnerOfferPlanModule */}
        <div className={styles.module}>
          <div className={styles.hero} data-tone={heroColor} style={{ aspectRatio: `100 / ${ratio}` }}>
            <img className={styles.heroImage} src={animationUrl} alt="" />
          </div>
          <div ref={moduleCta} className={[styles.buttonContainer, buttonSection.headerText && styles.buttonContainerWithHeader].filter(Boolean).join(' ')}>
            {!!buttonSection.headerText && (
              <div className={styles.buttonHeader}>
                <img className={styles.buttonHeaderIcon} src={greenCheck} alt="" />
                <span className={styles.buttonHeaderText}>{buttonSection.headerText.replace('{voucher_code}', voucherCode ?? '')}</span>
              </div>
            )}
            <div className={[styles.buttonContent, buttonSection.headerText && styles.buttonContentWithHeader].filter(Boolean).join(' ')}>
              {!!buttonSection.message && (
                <div className={styles.messageRow}>
                  <span className={styles.messageText}>{buttonSection.message}</span>
                </div>
              )}
              <SubscribeButton title={buttonSection.button.title} className={styles.moduleButton} textClassName={styles.moduleButtonText} loading={loading} onPress={activate} />
              {showPlansButton && (
                <VIPButton
                  className={[styles.moduleButton, styles.hollowButton].filter(Boolean).join(' ')}
                  textClassName={[styles.moduleButtonText, styles.hollowButtonText].join(' ')}
                  title="Explore other plans"
                  onPress={() => nav.push('noonone/plans', { source: '/offers' })}
                />
              )}
              {!!buttonSection.footerNote && <span className={styles.footerNote}>{buttonSection.footerNote}</span>}
            </div>
          </div>
        </div>
        <div className={styles.termsCard}>
          <HtmlText value={plan.paymentTerms} className={styles.terms} />
        </div>
        <div className={styles.footerSpace} />
      </div>
    </Screen>
      <motion.div
        className={styles.stickyFooter}
        initial={false}
        animate={{ y: hideSticky ? '110%' : 0 }}
        transition={handoff.spring}
      >
        <SubscribeButton
          title={campaign.stickyButtonText}
          className={[styles.stickyButton, payment && styles.stickyButtonWithPayment].filter(Boolean).join(' ')}
          textClassName={styles.stickyButtonText}
          loading={loading}
          payment={payment}
          onPaymentPress={() => nav.push('noonone/payment', { planCode: plan.planCode, voucherCode })}
          onPress={activate}
        />
      </motion.div>
    </div>
  );
}
