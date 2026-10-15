import { animate, motion, useMotionValue } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { HtmlText } from '../../../components';
import { ref } from '../../../foundations/tokens';
import { useNav } from '../../../kit/Navigator';
import { membershipManageActions } from '../../../kit/membership';
import { handoff } from '../../../motion/presets';
import closeModal from '@assets/membership/close-modal.webp';
import otpInfo from '@assets/membership/otp-info.webp';
import { icons } from '../assets';
import { capitalize, t } from '../data';
import { acquisitionRoute } from '../links';
import { useEnsureMembership } from '../store';
import { mb } from '../tokens';
import { PerkSheet, usePerkSheet } from './PerkSheet';
import { bankOffers, referralsOverlay, verifyReferralCode } from './perksData';
import styles from './perks.module.css';

type Params = { state?: string; preselectedIndex?: number; prefilledReferralCode?: string; showSwitcher?: boolean };

/**
 * VIPReferralsInputOverlayScreen — src/components/Overlay sheet (#F1F1F2, r16) with a 30px close circle, 30/bold
 * uppercase header, Bank offers / Voucher codes switcher (#0000003D track, white active pill, tabWidth 115), bank-offer
 * cards (325 wide) or the referral card (white r16 shadow2, -8 top) with code input → valid (#DFF1DA + check-circle) /
 * invalid (red border + cancellation-error) + message + optional info row; Continue enabled only for a valid code.
 * Container height animates minHeight (400 with switcher / 330) ↔ 500 (Animated.timing 250ms, delay 100, Easing.ease; here the Test01 spring, same delays).
 */
export function ReferralsInputOverlayScreen({ params }: { params: Params }) {
  useEnsureMembership(params.state);
  return (
    <PerkSheet
      kind="overlay"
      className={styles.refOverlaySheet}
      closeButton={(close) => (
        <button type="button" className={styles.refOverlayClose} onClick={close} aria-label="Close">
          <img src={closeModal} alt="" />
        </button>
      )}
    >
      <ReferralsInputContent params={params} />
    </PerkSheet>
  );
}

function ReferralsInputContent({ params }: { params: Params }) {
  const nav = useNav();
  const { close } = usePerkSheet();
  const offers = bankOffers;
  const shouldShowSwitcher = (params.showSwitcher ?? true) && offers.length > 0;
  const [selectedIndex, setSelectedIndex] = useState(offers.length ? (params.preselectedIndex ?? 0) : 1);
  const [code, setCode] = useState(params.prefilledReferralCode ?? '');
  const [status, setStatus] = useState<boolean | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const minHeight = shouldShowSwitcher ? 400 : 330;
  const anim = useMotionValue(selectedIndex === 0 ? 1 : 0);
  const height = useMotionValue(minHeight + anim.get() * (500 - minHeight));
  useEffect(() => anim.on('change', (v) => height.set(minHeight + v * (500 - minHeight))), [anim, height, minHeight]);
  const animateTo = (to: number, delay = 100) => animate(anim, to, { ...handoff.spring, delay: delay / 1000 });

  useEffect(() => {
    if (params.prefilledReferralCode) {
      const r = verifyReferralCode(params.prefilledReferralCode);
      setStatus(r.isValid);
      setMessage(r.message);
    }
  }, [params.prefilledReferralCode]);

  const switchTab = (i: number) => {
    setSelectedIndex(i);
    if (i === 0) animateTo(1);
    else if (!info) animateTo(0);
  };

  const applyCode = () => {
    if (!code) return;
    setLoading(true);
    // VIPService.verifyReferralCode (screenState RELOADING)
    window.setTimeout(() => {
      const r = verifyReferralCode(code);
      setStatus(r.isValid);
      setMessage(r.message);
      setInfo(r.info ?? '');
      setLoading(false);
      if (r.info) animateTo(1, 0);
    }, 600);
  };

  const edit = () => {
    if (info) animateTo(0, 200);
    setStatus(undefined);
    setMessage('');
    setInfo('');
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };
  const clear = () => {
    if (info) animateTo(0, 100);
    setStatus(undefined);
    setMessage('');
    setInfo('');
    setCode('');
  };

  const showLearnMore = (learnMore: string[]) =>
    nav.push('membership/info', {
      data: { infoList: { list: learnMore }, title: { text: t('vip_terms_and_conditions') }, buttons: [{ cta: '/ok', text: t('vip_got_it') }] },
    });

  const btn = referralsOverlay.button;
  return (
    <motion.div className={styles.refInContainer} style={{ height }}>
      <div className={styles.refInScroll}>
        <span className={styles.refInTitle}>{referralsOverlay.header}</span>
        {shouldShowSwitcher && (
          <div className={styles.refTabs}>
            {[capitalize(t('vip_bank_offers')), capitalize(t('vip_voucher_code'))].map((label, i) => (
              <button key={label} type="button" className={styles.refTab} data-active={selectedIndex === i || undefined} onClick={() => switchTab(i)}>
                {selectedIndex === i && <motion.span layoutId="mb-ref-tab" className={styles.refTabPill} transition={handoff.spring} />}
                <span className={styles.refTabText}>{label}</span>
              </button>
            ))}
          </div>
        )}
        {selectedIndex === 0 ? (
          <div className={`${styles.refSlider} nk-hscroll`} data-single={offers.length <= 1 || undefined}>
            {offers.map((o) => (
              <div key={o.planCode} className={styles.refOffer}>
                <div className={styles.refOfferInner}>
                  {/* offer.imgUrl (server banner, 325×166) — placeholder */}
                  <div className={styles.refOfferImage}>
                    <span className={styles.refOfferImageTitle}>{o.imgTitle}</span>
                    <span className={styles.refOfferImageSub}>{o.imgSubtitle}</span>
                  </div>
                  <div className={styles.refOfferDesc}>
                    <span
                      onClick={(e) => {
                        if ((e.target as HTMLElement).tagName === 'A') {
                          e.preventDefault();
                          showLearnMore(o.learnMore);
                        }
                      }}
                    >
                      <HtmlText
                        value={o.description}
                        className={styles.refOfferHtml}
                        stylesheet={{ p: { font: mb.type('mbRefOfferDesc'), color: ref.color('textLegacy'), textAlign: 'center' } }}
                      />
                    </span>
                    <motion.button
                      type="button"
                      className={styles.refOfferButton}
                      whileTap={{ opacity: 0.2 }}
                      onClick={() => close(() => nav.push(acquisitionRoute('payment'), { planCode: o.planCode, buttonTitle: o.buttonText, source: '/referrals' }))}
                    >
                      {o.activeButtonText}
                    </motion.button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className={styles.refInCardWrap}>
              <div className={styles.refInCard}>
                <span className={styles.refInSubtitle}>{referralsOverlay.subTitle}</span>
                {referralsOverlay.benefitsMessage && <span className={styles.refInBenefits}>{referralsOverlay.benefitsMessage}</span>}
                {status === undefined ? (
                  <div className={styles.refInput}>
                    <input
                      ref={inputRef}
                      className={styles.refInputField}
                      placeholder={t('vip_referral_placeholder')}
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && applyCode()}
                      autoCorrect="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                    />
                    <button type="button" className={styles.refInputApply} disabled={!code || loading} onClick={applyCode}>
                      {loading ? '…' : capitalize(t('vip_apply'))}
                    </button>
                  </div>
                ) : (
                  <div className={styles.refInput} data-status={status ? 'ok' : 'error'} onClick={edit} role="button" tabIndex={0}>
                    <span className={styles.refStatusRow}>
                      <span className={styles.refStatusCode}>{code}</span>
                      <img className={styles.refStatusIcon} src={status ? icons.checkCircleWebp : icons.cancellationError} alt="" />
                    </span>
                    <button
                      type="button"
                      className={styles.refClear}
                      onClick={(e) => {
                        e.stopPropagation();
                        clear();
                      }}
                      aria-label="Clear"
                    >
                      <img src={icons.clearInput} alt="" />
                    </button>
                  </div>
                )}
                {message && (
                  <span className={styles.refInMessage} data-status={status ? 'ok' : 'error'}>
                    {message}
                  </span>
                )}
                {info && (
                  <div className={styles.refInInfo}>
                    <img className={styles.refInInfoIcon} src={otpInfo} alt="" />
                    <span className={styles.refInInfoText}>{info}</span>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.refInButtonWrap}>
              <motion.button
                type="button"
                className={styles.refInButton}
                data-disabled={!status || undefined}
                style={status ? { background: btn.color, borderColor: btn.borderColor, color: btn.textColor } : undefined}
                disabled={!status}
                whileTap={status ? { opacity: 0.2 } : undefined}
                onClick={() => {
                  membershipManageActions.applyReferral(code);
                  close();
                }}
              >
                {btn.text}
              </motion.button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
