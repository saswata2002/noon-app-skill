import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState, type InputHTMLAttributes } from 'react';
import { useNav } from '../../kit/Navigator';
import { duration, easing, handoff } from '../../motion/presets';
import type { CardType, CheckoutCard } from './data';
import { acceptedBrands, paymentIcons, tp } from './data.payment';
import { checkoutStore } from './store';
import { detectBrand, digits, normalizeCardNumber, normalizeExpiry, validate, type AddCardValues } from './validate';
import { Spinner } from '../../components';
import styles from './payment.module.css';

type FieldId = 'card' | 'expiry' | 'cvv' | 'nickname';

/**
 * NoonCheckoutAddPaymentCardScreen (BottomSheet, snap 70% / 80% with keyboard) — the V1 add-card overlay that
 * PaymentNavigation.goToCardAdditionScreen falls back to when FeatureFlags.isPaymentV2Enabled() is off
 * (the payment_v3 experiment routes to features/payment PaymentCardManualAdditionScreen instead — see the cards flow).
 * Formik + validate.ts: validateOnMount (submit disabled until valid), field errors show after blur, the
 * nickname error shows while typing. Submit → createPaymentCard → onCreateCardSuccess(card, cvv) →
 * confirmPaymentMethod(CC, card, cvv) and the sheet closes.
 */
export function AddPaymentCardScreen() {
  const nav = useNav();
  const [values, setValues] = useState<AddCardValues>({ card: '', expiry: '', cvv: '', nickname: '', rememberCard: true });
  const [touched, setTouched] = useState<Partial<Record<FieldId, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const errors = useMemo(() => validate(values), [values]);
  const isValid = Object.keys(errors).length === 0;

  const set = (id: keyof AddCardValues, v: string | boolean) => setValues((s) => ({ ...s, [id]: v }));
  const isErrorVisible = (id: FieldId, validateOnChange = false) => (validateOnChange ? !!errors[id] && !!values[id] : !!errors[id] && !!touched[id]);

  function onSubmit() {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      const brand = detectBrand(values.card);
      const card: CheckoutCard = {
        id: Date.now(),
        type: (brand?.type ?? 'VISA') as CardType,
        mask: digits(values.card).slice(-4),
        expiry: values.expiry,
        nickname: values.nickname.trim() || null,
        infoMessage: null,
      };
      checkoutStore.addCard(card, values.cvv);
      nav.back();
    }, 900);
  }

  function field(
    id: FieldId,
    label: string,
    opts: { placeholder: string; required?: boolean; optional?: boolean; validateOnChange?: boolean; normalize?: (cur: string, next: string) => string; hint?: string } & Pick<
      InputHTMLAttributes<HTMLInputElement>,
      'inputMode' | 'maxLength' | 'autoComplete' | 'type'
    >,
  ) {
    const { placeholder, required, optional, validateOnChange, normalize, hint, ...input } = opts;
    const showError = isErrorVisible(id, validateOnChange);
    return (
      <div className={styles.rowItem}>
        <label className={styles.inputLabel}>
          {label}
          {optional && <span className={styles.optional}>{` (${tp.optional})`}</span>}
          {required && <span className={styles.required}> *</span>}
        </label>
        <input
          className={`${styles.input} ${showError ? styles.inputError : ''}`}
          value={values[id]}
          placeholder={placeholder}
          onChange={(e) => set(id, normalize ? normalize(values[id], e.target.value) : e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, [id]: true }))}
          {...input}
        />
        {/* errorContainerStyle (minHeight 28) — nickname collapses to 0 without an error and shows the hint instead */}
        <div className={hint && !errors[id] ? styles.emptyErrorContainer : styles.errorContainer}>
          <AnimatePresence initial={false}>
            {showError && (
              <motion.div className={styles.errorInfo} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ y: handoff.spring, opacity: { duration: duration.fast, ease: easing.out } }}>
                <img src={paymentIcons.infoCircleRed} width={16} height={17} alt="" />
                <span className={styles.errorText}>{errors[id]}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {hint && !errors[id] && <span className={styles.hint}>{hint}</span>}
      </div>
    );
  }

  return (
    <div className={styles.sheet} style={{ height: 'calc(0.7 * 844px)' }}>
      <div className={styles.addTitleWrapper}>
        <span className={styles.addTitle}>{tp.noon_checkout_add_new_card}</span>
      </div>

      <div className={styles.scroll}>
        <div className={styles.acceptedCards}>
          {acceptedBrands.map((b) => (
            <img key={b.id} className={styles.acceptedCard} src={b.src} alt={b.id} />
          ))}
        </div>

        <div className={styles.form}>
          <div className={styles.row}>
            {field('card', tp.noon_enter_card_number, { placeholder: tp.noon_card_placeholder, required: true, normalize: (_c, n) => normalizeCardNumber(n), maxLength: 24, inputMode: 'numeric', autoComplete: 'cc-number' })}
          </div>
          <div className={styles.row}>
            {field('expiry', tp.noon_expiry, { placeholder: tp.noon_expiry_date_placeholder, required: true, normalize: normalizeExpiry, maxLength: 5, inputMode: 'numeric', autoComplete: 'cc-exp' })}
            <div className={styles.rowSpacer} />
            {field('cvv', tp.noon_cvv, { placeholder: tp.noon_cvv_placeholder, required: true, normalize: (_c, n) => digits(n), maxLength: 4, inputMode: 'numeric', autoComplete: 'cc-csc', type: 'password' })}
          </div>
          <div className={styles.row}>
            {field('nickname', tp.noon_enter_card_title, { placeholder: tp.noon_card_title_placeholder, optional: true, validateOnChange: true, maxLength: 50, hint: tp.noon_card_title_hint_text })}
          </div>
        </div>

        <div className={styles.rememberCard}>
          <div className={styles.checkbox}>
            <button type="button" className={styles.checkboxContainer} onClick={() => set('rememberCard', !values.rememberCard)}>
              <img src={values.rememberCard ? paymentIcons.checkboxChecked : paymentIcons.checkboxUnchecked} width={15} height={15} alt="" />
              <span className={styles.checkboxLabel}>{tp.noon_remember_payment_card_title}</span>
            </button>
            <span className={styles.checkboxSubtext}>{tp.noon_remember_payment_card_description}</span>
          </div>
        </div>
      </div>

      <div className={styles.buttonWrapper}>
        <motion.button type="button" className={`${styles.submit} ${!isValid ? styles.submitDisabled : ''}`} disabled={!isValid} onClick={onSubmit} whileTap={isValid ? { scale: 0.98 } : undefined}>
          {submitting ? <Spinner color="var(--nk-color-text-inverse)" track="var(--nk-palette-white-alpha40)" /> : tp.noon_add_card}
        </motion.button>
      </div>
    </div>
  );
}
