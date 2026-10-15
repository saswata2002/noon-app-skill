import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode, RefObject } from 'react';
import { Switch } from '../../../components';
import { useNav } from '../../../kit/Navigator';
import { duration, easing, handoff, spring } from '../../../motion/presets';
import { currency } from '../../../data';
import { cashback, tf, type CheckoutCard } from '../data';
import { formatAmount } from '../utils';
import {
  DEFAULT_CARD_SECTION,
  cvvLength,
  emiPlansFor,
  formatShort,
  noonOneCardUpsell,
  paymentFigmaIcons,
  paymentIcons,
  paymentMethods,
  paymentSectionTitle,
  type CardSection,
  type GenericMethod,
} from '../data.payment';
import { checkoutStore, useCheckout } from '../store';
import { useCheckoutTotals } from '../totals';
import { NewBadge } from './BurnSection';
import styles from './PaymentMethods.module.css';

const fade = { height: handoff.spring, opacity: { duration: duration.fast, ease: easing.out } };

/** Figma "Hidden digit" ×4 + last four */
function MaskedNumber({ mask }: { mask: string }) {
  return (
    <span className={styles.number}>
      <span className={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={styles.dot} />
        ))}
      </span>
      <span className={styles.mask}>{mask}</span>
    </span>
  );
}

/**
 * Figma "🚧 Checkout 2.0" Payment Options Container (14288:184061) — "Pay With" 16/20 Bold, the noon credits
 * "Credits states" (29.6×16 toggle, "Use my … noon credits", remaining line), then the method list (gap 8):
 * Cards MOLECULE rows (Blue-Gray/100 r12 h54, 38×24 brand logo, name 14/18 SemiBold + second line 12/14) with
 * the red NEW badge; the active method gets Accent/50 + 1px Accent/600. The Debit/Credit Card section shows
 * Add/Change, the selected saved card (art, name | •••• last4, "Installments Available …", CVV field) and, under
 * it, the EMI strip ("Select an installment starting …" → EMI plans). noon One Credit Card upsell row follows.
 */
export function PaymentMethods({ cvvInputRef }: { cvvInputRef?: RefObject<HTMLInputElement | null> }) {
  const nav = useNav();
  const { paymentCode, cards, selectedCardId, cardSectionCode, emiPlanId, cvv, useCredits } = useCheckout((s) => s);
  const totals = useCheckoutTotals();

  // ccDefaultSectionSelectedCard: isSelected || lastSelected || isDefault || first
  const defaultCard: CheckoutCard | undefined = cards.find((c) => c.id === selectedCardId) ?? cards.find((c) => c.isDefault) ?? cards[0];
  const { plans: emiPlans } = emiPlansFor(defaultCard, totals.orderPaymentAmount);
  const selectedEmiPlan = emiPlans.find((p) => p.id === emiPlanId);
  const fromPerMonth = `${currency}${formatShort(totals.orderPaymentAmount / 12)}${tf.perMonth}`;

  const isSectionActive = (s: CardSection) => paymentCode === 'cc_noonpay' && (cardSectionCode ?? DEFAULT_CARD_SECTION) === s.code;

  function onCardSectionPress(s: CardSection) {
    if (s.sectionType === 'default') {
      if (!cards.length) nav.push('checkout/add-card');
      else checkoutStore.selectPayment('cc_noonpay', defaultCard?.id ?? null, null);
    } else {
      nav.push('checkout/special-emis', { sectionCode: s.code });
    }
  }

  function renderCredits() {
    if (totals.walletAmount <= 0) return null;
    return (
      <div className={styles.credits}>
        <button type="button" className={styles.creditsRow} onClick={() => checkoutStore.update((s) => ({ useCredits: !s.useCredits }))} role="switch" aria-checked={useCredits}>
          <Switch as="span" value={useCredits} width={29.6} height={16} knob={12.8} inset={1.6} onColor="var(--nk-color-cta)" offColor="var(--nk-palette-noon-grey3)" transition={spring.press} />
          <span className={styles.creditsText}>
            {tf.useCredits} {currency}
            {formatAmount(totals.walletAmount)} {tf.noonCredits}
          </span>
        </button>
        <AnimatePresence initial={false}>
          {useCredits && (
            <motion.span key={totals.isCreditsSufficient ? 'ok' : 'no'} className={styles.creditsRemaining} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={fade}>
              {totals.isCreditsSufficient ? (
                tf.creditsSufficient
              ) : (
                <>
                  {tf.coverRemaining}{' '}
                  <b className={styles.creditsRemainingValue}>
                    {currency}
                    {formatAmount(totals.orderPaymentAmount)}
                  </b>
                </>
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    );
  }

  function row({ key, icon, name, message, selected, disabled, onPress, isNew, end, tone }: { key: string; icon: string; name: string; message?: ReactNode; selected: boolean; disabled?: boolean; onPress?: () => void; isNew?: boolean; end?: ReactNode; tone?: 'noonOne' }) {
    return (
      <motion.div
        key={key}
        role="button"
        tabIndex={disabled || !onPress ? -1 : 0}
        className={[styles.row, selected && styles.rowSelected, disabled && styles.rowDisabled, tone === 'noonOne' && styles.rowNoonOne].filter(Boolean).join(' ')}
        onClick={disabled || selected ? undefined : onPress}
        whileTap={disabled || selected || !onPress ? undefined : { scale: 0.985 }}
        transition={spring.press}
        aria-pressed={selected}
      >
        <img className={styles.logo} src={icon} width={38} height={24} alt="" />
        <span className={styles.info}>
          <span className={styles.name}>{name}</span>
          {message ? <span className={tone === 'noonOne' ? styles.messagePositive : styles.message}>{message}</span> : null}
        </span>
        {end}
        {isNew && <NewBadge className={styles.rowBadge} />}
      </motion.div>
    );
  }

  function renderGeneric(m: GenericMethod) {
    const selected = paymentCode === m.code && !(useCredits && totals.isCreditsSufficient);
    return row({
      key: m.code,
      icon: paymentFigmaIcons.method[m.code],
      name: m.name,
      message: m.message?.(totals.orderPaymentAmount),
      selected,
      disabled: m.disabled,
      isNew: m.isNew,
      onPress: () => checkoutStore.selectPayment(m.code),
    });
  }

  function renderSavedCard(card: CheckoutCard, selected: boolean) {
    const art = paymentFigmaIcons.savedCard[card.type] ?? paymentIcons.card[card.type] ?? paymentIcons.cardFallback;
    const title = card.nickname || (card.holder ? `${card.holder}’s card` : card.type);
    return (
      <div className={styles.saved}>
        <span className={styles.savedDetails}>
          <span className={styles.cardArt}>
            <img src={art} alt={card.type} />
          </span>
          <span className={styles.info}>
            <span className={styles.savedTitleRow}>
              <span className={styles.savedTitle}>{title}</span>
              <span className={styles.pipe}>|</span>
              <MaskedNumber mask={card.mask} />
            </span>
            {emiPlans.length > 0 && (
              <span className={styles.message}>
                {tf.installmentsAvailable} {fromPerMonth}
              </span>
            )}
          </span>
        </span>
        {selected && (
          <input
            ref={cvvInputRef}
            className={styles.cvv}
            value={cvv}
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={tf.cvv}
            aria-label={tf.cvv}
            maxLength={cvvLength(card.type)}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => checkoutStore.setCvv(e.target.value.replace(/\D/g, ''))}
          />
        )}
      </div>
    );
  }

  function renderCardSection(s: CardSection) {
    const selected = isSectionActive(s) && !(useCredits && totals.isCreditsSufficient);
    const showEmi = selected && !!defaultCard && emiPlans.length > 0;
    return (
      <div key={s.code} className={styles.ccWrap}>
        <motion.div
          role="button"
          tabIndex={selected ? -1 : 0}
          className={`${styles.cc} ${selected ? styles.ccSelected : ''}`}
          onClick={selected ? undefined : () => onCardSectionPress(s)}
          whileTap={selected ? undefined : { scale: 0.985 }}
          transition={spring.press}
          aria-pressed={selected}
        >
          <div className={styles.ccTitleRow}>
            <span className={styles.ccTitle}>
              <img className={styles.logo} src={paymentFigmaIcons.method.cc_noonpay} width={38} height={24} alt="" />
              <span className={styles.name}>{s.name}</span>
            </span>
            <button
              type="button"
              className={styles.addChange}
              onClick={(e) => {
                e.stopPropagation();
                nav.push(cards.length ? 'checkout/cards-select' : 'checkout/add-card');
              }}
            >
              {cards.length ? tf.addChange : tf.addNew}
            </button>
          </div>
          {defaultCard && <div className={styles.ccActive}>{renderSavedCard(defaultCard, selected)}</div>}
        </motion.div>
        <AnimatePresence initial={false}>
          {showEmi && (
            <motion.button
              key="emi"
              type="button"
              className={styles.emi}
              onClick={() => nav.push('checkout/emi-plans')}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={fade}
            >
              <span className={styles.emiText}>{selectedEmiPlan ? tf.selectedPlan(selectedEmiPlan.installment, selectedEmiPlan.tenure) : `${tf.selectInstallment} ${fromPerMonth}`}</span>
              <img className={styles.emiChevron} src={paymentFigmaIcons.emiChevron} width={14} height={14} alt="" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  }

  function renderNoonOneUpsell() {
    return row({
      key: 'noon-one-card',
      icon: paymentFigmaIcons.noonOneCard,
      name: noonOneCardUpsell.title,
      message: `${noonOneCardUpsell.extra} ${currency}${formatShort(cashback.noonOneCard(totals.orderPaymentAmount))} ${noonOneCardUpsell.cashback}`,
      selected: false,
      tone: 'noonOne',
      onPress: () => nav.toast('Opens the noon One Credit Card application (not part of this prototype)'),
      end: <span className={styles.applyNow}>{noonOneCardUpsell.cta}</span>,
    });
  }

  const visible = paymentMethods.filter((m) => !(m.kind === 'card_section' && m.hidden));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>{paymentSectionTitle}</span>
        {renderCredits()}
      </div>
      <div className={styles.methods}>
        {visible.map((m) =>
          m.kind === 'card_section' ? (
            m.sectionType === 'default' ? (
              [renderCardSection(m), renderNoonOneUpsell()]
            ) : (
              renderCardSection(m)
            )
          ) : (
            renderGeneric(m)
          ),
        )}
      </div>
    </div>
  );
}
