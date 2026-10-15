import { motion } from 'motion/react';
import { maskSrc } from '../components/maskSrc';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HtmlText, MaskIcon } from '../../../components';
import { useNav } from '../../../kit/Navigator';
import checkCircle from '@assets/vip/check-circle.svg';
import { VIPButton } from '../components/VIPButton';
import { VIPOverlay, useVipOverlay } from '../components/VIPOverlay';
import { InlinePopup } from '../components/offers/InlinePopup';
import { ChevronLeft, VIPWave } from '../components/offers/Primitives';
import { bankOffers, verifyCode, voucherPlans, vouchers, type VipVoucher } from '../data.offers';
import type { VipPlan } from '../data';
import { noononeStore } from '../store';
import { offersTokens as T } from '../tokens';
import { layout } from '../../../foundations/tokens';
import { handoff } from '../../../motion/presets';
import styles from './OffersOverlayScreen.module.css';

type Params = { tab?: 'vouchers' | 'bank'; code?: string; allowSwitching?: boolean; empty?: boolean };

/** VIPOffersTabType: VOUCHERS 0, BANK_OFFERS 1 */
const TABS = ['Voucher codes', 'Bank offers'] as const; // vip_voucher_code, vip_bank_offers

const planKey = (p: VipPlan) => (Object.keys(voucherPlans) as (keyof typeof voucherPlans)[]).find((k) => voucherPlans[k].planCode === p.planCode);

/** VIPOffersOverlayScreen › Voucher */
function Voucher({ voucher, applied, onApply }: { voucher: VipVoucher; applied: boolean; onApply: () => void }) {
  const [collapsed, setCollapsed] = useState(true);
  const { title, description, voucherCode, iconUrl, activeButtonText, disabledButtonText, details } = voucher;
  return (
    <div className={styles.voucher}>
      <div className={styles.voucherInfo}>
        <span className={styles.voucherImageBox}>
          <img className={styles.voucherImage} src={iconUrl} alt="" />
        </span>
        <div className={styles.voucherText}>
          <span className={styles.voucherTitle}>{title}</span>
          <span className={styles.voucherDescription}>{description}</span>
          {(voucherCode || details?.length) && (
            <div className={styles.voucherCodeRow}>
              {voucherCode && (
                <span className={styles.voucherCodeChip}>
                  <span className={styles.voucherCode}>{voucherCode}</span>
                </span>
              )}
              {!!details?.length && (
                <button type="button" className={`nk-pressable ${styles.voucherDetailsLink}`} onClick={() => setCollapsed(!collapsed)}>
                  {collapsed ? 'read more' : 'read less'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {/* react-native-collapsible: 300ms */}
      <motion.div initial={false} animate={{ height: collapsed ? 0 : 'auto' }} transition={handoff.spring} style={{ overflow: 'hidden' }}>
        <div className={styles.voucherDetails}>
          {details?.map((d, i) => (
            <div key={i} className={styles.voucherDetailRow}>
              <span className={styles.voucherDetailPoint}>•</span>
              <span className={styles.voucherDetailText}>{d}</span>
            </div>
          ))}
        </div>
      </motion.div>
      <div className={styles.wave}>
        <VIPWave color={applied ? 'var(--nk-color-vip-of-voucher-applied)' : 'var(--nk-color-vip-of-voucher-bg)'} width={layout.deviceWidth - T.wave.inset} height={T.wave.height} cycles={T.wave.cycles} />
      </div>
      <div className={[styles.voucherButtonBox, applied && styles.voucherButtonBoxApplied].filter(Boolean).join(' ')}>
        <VIPButton
          className={[styles.voucherButton, applied && styles.voucherButtonApplied].filter(Boolean).join(' ')}
          textClassName={applied ? styles.voucherButtonTextApplied : styles.voucherButtonText}
          title={applied ? disabledButtonText : activeButtonText}
          disabled={applied}
          onPress={onApply}
          renderBefore={applied ? <MaskIcon src={maskSrc(checkCircle)} size={18} color="var(--nk-color-best-price-ink)" /> : undefined}
        />
      </div>
    </div>
  );
}

function Content({ params, layer }: { params: Params; layer: HTMLDivElement | null }) {
  const nav = useNav();
  const { close } = useVipOverlay();
  const tabs = useMemo(() => (params.empty ? [[], []] : [vouchers, bankOffers]) as VipVoucher[][], [params.empty]);
  const allowSwitching = params.allowSwitching ?? true;
  const [index, setIndex] = useState(params.tab === 'bank' ? 1 : 0);
  const [code, setCode] = useState(params.code ?? '');
  const [focused, setFocused] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [applied, setApplied] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ message: string; plan: VipPlan; code?: string } | null>(null);
  const [popupClosing, setPopupClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const lengths = tabs.map((t) => t.length);
  const maxItems = Math.max(...lengths);
  const showSwitcher = !lengths.some((l) => l === 0) && allowSwitching;
  const contentHeight = T.listHeights[Math.min(maxItems, 3)];
  const current = tabs[index];
  const labelUp = focused || !!code;
  const showRedeem = focused || !!code || maxItems === 0;

  // getPageData: if the preselected tab is empty but the other has offers, switch
  useEffect(() => {
    if (tabs[index].length === 0 && tabs[1 - index].length > 0 && allowSwitching) setIndex(1 - index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showPopup = (message: string, plan: VipPlan, voucherCode?: string) => {
    setPopupClosing(false);
    setPopup({ message, plan, code: voucherCode });
  };

  const applyCode = (c = code) => {
    inputRef.current?.blur();
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      const r = verifyCode(c);
      if (r.isValid && r.plan) showPopup(r.message, r.plan, c.trim().toUpperCase());
      else nav.toast(r.message, { tone: 'error' });
    }, T.verifyMs);
  };

  // prefilledReferralCode → animate label + applyCode
  useEffect(() => {
    if (params.code) applyCode(params.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SuccessPopupContent: auto-advance after 2s
  useEffect(() => {
    if (!popup || popupClosing) return;
    const t = setTimeout(() => setPopupClosing(true), T.successPopupMs);
    return () => clearTimeout(t);
  }, [popup, popupClosing]);

  const onPopupClosed = () => {
    const p = popup;
    setPopup(null);
    setApplied(null);
    if (!p) return;
    noononeStore.patch({ voucherCode: p.code, selectedPlan: p.plan });
    // offersOverlayRef.close() + onDismiss → showConfirmOfferOverlay(plan, voucherCode)
    close(() => nav.push('noonone/confirmVoucher', { offer: planKey(p.plan), code: p.code }));
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          {focused && (
            <button type="button" className={`nk-pressable ${styles.backButton}`} onMouseDown={(e) => e.preventDefault()} onClick={() => inputRef.current?.blur()}>
              <span className={styles.backIcon}>
                <ChevronLeft width={7} height={14} />
              </span>
            </button>
          )}
          <span className={styles.headerTitle}>noon One offers</span>
        </div>

        {showSwitcher && (
          <div className={styles.tabSwitcher}>
            <div className={styles.tabs}>
              {TABS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  className={styles.tab}
                  onClick={() => {
                    setIndex(i);
                    setApplied(null);
                  }}
                >
                  {i === index && <motion.span layoutId="vip-offers-tab" className={styles.activeTab} transition={handoff.spring} />}
                  <span className={i === index ? styles.activeTabText : styles.tabText}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className={styles.inputBox}>
            <motion.span
              className={styles.inputLabel}
              initial={false}
              animate={labelUp ? { y: -12, x: 2, scale: 0.85 } : { y: 0, x: 12, scale: 1 }}
              transition={handoff.spring}
            >
              Have a coupon code?
            </motion.span>
            <input
              ref={inputRef}
              className={styles.codeInput}
              value={code}
              autoCorrect="off"
              autoCapitalize="characters"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && code && applyCode()}
            />
            {!!code && (
              <button type="button" className={`nk-pressable ${styles.clear}`} onMouseDown={(e) => e.preventDefault()} onClick={() => setCode('')}>
                CLEAR
              </button>
            )}
          </div>
          <motion.div
            className={styles.redeemBox}
            initial={false}
            animate={{ height: showRedeem ? T.redeemHeight : 0 }}
            transition={{ ...handoff.spring, delay: T.listMs.delay / 1000 }}
          >
            <VIPButton
              className={[styles.redeem, !code && styles.redeemDisabled].filter(Boolean).join(' ')}
              textClassName={code ? styles.redeemText : styles.redeemTextDisabled}
              title="Redeem now"
              disabled={!code}
              isLoading={verifying}
              onMouseDown={(e) => e.preventDefault()}
              onPress={() => applyCode()}
            />
          </motion.div>
        </div>

        {current.length > 0 && (
          <motion.div
            initial={false}
            animate={{ height: focused ? 0 : contentHeight + 20 }}
            transition={{ ...handoff.spring, delay: T.listMs.delay / 1000 }}
            style={{ overflow: 'hidden' }}
          >
            <span className={styles.availableOffers}>Available offers</span>
            <div className={`nk-scroll ${styles.list}`} style={{ height: contentHeight }}>
              <div className={styles.listContent}>
                {current.map((v, i) => (
                  <Voucher
                    key={`${index}-${i}`}
                    voucher={v}
                    applied={applied === v.planCode}
                    onApply={() => {
                      setApplied(v.planCode);
                      showPopup(v.appliedDescription, v.plan, v.voucherCode);
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        {maxItems === 0 && <div className={styles.emptyBottom} />}
      </div>

      {popup &&
        layer &&
        createPortal(
        <div className={styles.popupLayer}>
          <InlinePopup className={styles.popupCard} closing={popupClosing} onClosed={onPopupClosed} onScrimPress={() => setPopupClosing(true)}>
            <div className={styles.popupContent}>
              <MaskIcon src={maskSrc(checkCircle)} size={36} color="var(--nk-color-brand-blue)" />
              <span className={styles.popupTitle}>Offer applied</span>
              <HtmlText value={popup.message} className={styles.popupBody} />
              <span className={styles.separator} />
              <VIPButton className={styles.popupButton} textClassName={styles.popupButtonText} title="Yay, thanks!" onPress={() => setPopupClosing(true)} />
            </div>
          </InlinePopup>
        </div>,
          layer,
        )}
    </>
  );
}

/**
 * VIPOffersOverlayScreen (VIPUtil.showReferralsInputOverlay — CMS /noon-one-vouchers, /noon-one-bank-offers, landing
 * ?referral= deep link). Voucher / bank-offer tabs, floating-label code input with Redeem, offer cards with wave CTA,
 * success popup (auto-advances after 2s) → VIPConfirmVoucherPlanScreen.
 */
export function OffersOverlayScreen({ params }: { params: Params }) {
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);
  return (
    <>
      <VIPOverlay sheetClassName={styles.sheet}>
        <Content params={params} layer={layer} />
      </VIPOverlay>
      <div ref={setLayer} className={styles.portal} />
    </>
  );
}
