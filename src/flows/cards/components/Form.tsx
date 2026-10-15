import { motion } from 'motion/react';
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { t } from '../data';
import { getCardNumberError, getCVVError, getExpiryDateError, getNicknameError, normalizeCardNumber, normalizeExpiry } from '../utils';
import { CardBrands, CardTypeLogo, LockNote } from './Bits';
import { PaymentButtonV2 } from './primitives';
import { Switch } from '../../../components';
import s from './components.module.css';
import { ref as tokenRef } from '../../../foundations/tokens';
import { duration, easing } from '../../../motion/presets';

/* ── components/PaymentTextInputV2 ─────────────────────────────────────── */

const PADDING_H = 12;

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  label: string;
  value: string;
  error?: string;
  onChangeText: (next: string) => void;
  renderAfter?: ReactNode;
};

/** Floating-label filled input: label 13 → 11pt and −12pt in 60ms when focused or filled. */
export const PaymentTextInputV2 = forwardRef<HTMLInputElement, InputProps>(function PaymentTextInputV2({ label, value, error, onChangeText, renderAfter, onFocus, onBlur, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  const afterRef = useRef<HTMLDivElement>(null);
  const [padRight, setPadRight] = useState(PADDING_H);
  useLayoutEffect(() => {
    const w = afterRef.current?.offsetWidth ?? 0;
    setPadRight(w ? w + PADDING_H * 1.5 : PADDING_H);
  });
  const floating = focused || !!value;
  return (
    <div>
      <div className={s.inputWrap}>
        <input
          ref={ref}
          {...rest}
          className={[s.input, error && s.inputError].filter(Boolean).join(' ')}
          style={{ paddingRight: padRight }}
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {renderAfter && (
          <div ref={afterRef} className={s.inputAfter}>
            {renderAfter}
          </div>
        )}
        <div className={s.inputLabelWrap}>
          <motion.span className={s.inputLabel} initial={false} animate={{ fontSize: floating ? 11 : 13, y: floating ? -12 : 0 }} transition={{ duration: 0.06 }}>
            {label}
          </motion.span>
        </div>
      </div>
      {error && <div className={s.inputErrorText}>{error}</div>}
    </div>
  );
});

/* ── components/PaymentSwitchV2 (md, dark, reversed) ───────────────────── */

export function PaymentSwitchV2({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={s.switchRow}>
      <span className={s.switchLabel}>{label}</span>
      <Switch
        value={value}
        onChange={onChange}
        width={34}
        onColor={tokenRef.color('textInk')}
        offColor={tokenRef.palette('filterCheckboxBorder')}
        transition={{ duration: duration.base, ease: easing.inOut }}
        colorTransition={`background-color ${duration.base}s cubic-bezier(${easing.inOut.join(', ')})`}
      />
    </label>
  );
}

/* ── components/PaymentCardFormV2 ──────────────────────────────────────── */

export interface CardFormValues {
  card: string;
  expiry: string;
  cvv: string;
  nickname: string;
  isDefault: boolean;
}

export interface CardFormHandle {
  setScannedValues: (card?: string, expiry?: string) => void;
  focusFirstEmptyField: () => void;
  blurFields: () => void;
}

/** validatePaymentCard.ts (cardHolderName is config-driven and not required in the mocked config) */
function validate(v: CardFormValues) {
  const errors: Partial<Record<keyof CardFormValues, string>> = {};
  const card = getCardNumberError(v.card);
  if (card) errors.card = card;
  const expiry = getExpiryDateError(v.expiry);
  if (expiry) errors.expiry = expiry;
  const cvv = getCVVError(v.cvv, v.card);
  if (cvv) errors.cvv = cvv;
  const nickname = getNicknameError(v.nickname);
  if (nickname) errors.nickname = nickname;
  return errors;
}

const EMPTY: CardFormValues = { card: '', expiry: '', cvv: '', nickname: '', isDefault: true };
const VALIDATION_DEBOUNCE_MS = 300; // usePaymentDebouncedValidation

export const PaymentCardFormV2 = forwardRef<CardFormHandle, { isAdditionLoading: boolean; onSubmit: (v: CardFormValues) => void; defaultIsDefault?: boolean }>(function PaymentCardFormV2(
  { isAdditionLoading, onSubmit, defaultIsDefault = true },
  ref,
) {
  const [values, setValues] = useState<CardFormValues>({ ...EMPTY, isDefault: defaultIsDefault });
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CardFormValues, boolean>>>({});
  const cardRef = useRef<HTMLInputElement>(null);
  const expiryRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);

  // usePaymentDebouncedValidation: touch every non-empty field, then validate, 300ms after the last change
  useEffect(() => {
    const id = setTimeout(() => {
      setTouched((tc) => {
        const next = { ...tc };
        (Object.keys(values) as (keyof CardFormValues)[]).forEach((k) => {
          if (typeof values[k] === 'string' && values[k]) next[k] = true;
        });
        return next;
      });
      setErrors(validate(values));
    }, VALIDATION_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [values]);

  const set = <K extends keyof CardFormValues>(k: K, v: CardFormValues[K]) => setValues((p) => ({ ...p, [k]: v }));

  const focusFirstEmpty = (v: CardFormValues) => {
    if (!v.card) cardRef.current?.focus();
    else if (!v.expiry) expiryRef.current?.focus();
    else cvvRef.current?.focus();
  };

  useImperativeHandle(ref, () => ({
    setScannedValues: (card, expiry) => {
      const next = { ...values, cvv: '' };
      if (card) Object.assign(next, { ...EMPTY, isDefault: values.isDefault, card: normalizeCardNumber(card) });
      if (expiry) next.expiry = expiry;
      setValues(next);
      setTouched({ expiry: !!card, cvv: !!expiry });
      setTimeout(() => focusFirstEmpty(next), 0);
    },
    focusFirstEmptyField: () => focusFirstEmpty(values),
    blurFields: () => (document.activeElement as HTMLElement | null)?.blur?.(),
  }));

  const shown = (k: keyof CardFormValues) => (errors[k] && (touched[k] || !!values[k]) ? errors[k] : undefined);
  const hasValidCVV = !!values.cvv && !getCVVError(values.cvv, values.card);
  const enabled = !!values.card && !!values.expiry && hasValidCVV && Object.keys(validate(values)).length === 0 && Object.keys(errors).length === 0;

  return (
    <form
      className={s.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (enabled && !isAdditionLoading) onSubmit(values);
      }}
    >
      <PaymentTextInputV2
        ref={cardRef}
        label={t.cardNumber}
        inputMode="numeric"
        autoComplete="cc-number"
        maxLength={24}
        value={values.card}
        error={shown('card')}
        onChangeText={(n) => set('card', normalizeCardNumber(n))}
        onBlur={() => setTouched((tc) => ({ ...tc, card: true }))}
        renderAfter={<CardTypeLogo cardNumber={values.card} />}
        data-field="card"
      />
      <div className={s.formRow}>
        <div className={s.halfRow}>
          <PaymentTextInputV2
            ref={expiryRef}
            label={t.expiryDate}
            inputMode="numeric"
            autoComplete="cc-exp"
            maxLength={5}
            value={values.expiry}
            error={shown('expiry')}
            onChangeText={(n) => set('expiry', normalizeExpiry(values.expiry, n))}
            onBlur={() => setTouched((tc) => ({ ...tc, expiry: true }))}
            data-field="expiry"
          />
        </div>
        <div className={s.halfRow}>
          <PaymentTextInputV2
            ref={cvvRef}
            label={t.cvv}
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            maxLength={4}
            value={values.cvv}
            error={shown('cvv')}
            onChangeText={(n) => set('cvv', n.replace(/\D/g, ''))}
            onBlur={() => setTouched((tc) => ({ ...tc, cvv: true }))}
            data-field="cvv"
          />
        </div>
      </div>
      <PaymentTextInputV2 label={t.saveCardAs} maxLength={50} value={values.nickname} error={shown('nickname')} onChangeText={(n) => set('nickname', n)} data-field="nickname" />
      <div className={s.setAsDefault}>
        <PaymentSwitchV2 label={t.setDefault} value={values.isDefault} onChange={(v) => set('isDefault', v)} />
      </div>
      <PaymentButtonV2 title={t.saveButton} size="lg" variant="elevated" className={s.formButton} isLoading={isAdditionLoading} disabled={!enabled} onPress={() => onSubmit(values)} data-testid="save-card" />
      <LockNote variant="form" text={t.secureAddition} />
      <CardBrands compact className={s.formBrands} />
    </form>
  );
});
