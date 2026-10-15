import { AnimatePresence, motion } from 'motion/react';
import pasteIcon from '@assets/checkout/rewards-paste.svg';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import checkboxChecked from '@assets/shared/icons/checkbox-checked.webp';
import checkboxUnchecked from '@assets/shared/icons/checkbox-unchecked.webp';
import termsInfo from '@assets/checkout/rewards-terms-info.webp';
import { rt, type ProviderPage } from '../data.rewards';
import { Crescent, InfoEditButton, ProviderLogo } from './RewardsPrimitives';
import { Button, Spinner } from '../../../components';
import styles from './providerForm.module.css';
import { currency } from '../../../data';
import { spring } from '../../../motion/presets';

/**
 * marketplaces/noon/components/NoonCheckoutProvider/* — the pieces of the provider burn / earn overlays.
 */

/** NoonDynamicBackground: solid for 1 colour, gradient for more (default top → bottom). */
export function DynamicBackground({ colors, angle = 180, className, style, children }: { colors: string[]; angle?: number; className?: string; style?: CSSProperties; children?: ReactNode }) {
  const background = colors.length > 1 ? `linear-gradient(${angle}deg, ${colors.join(', ')})` : (colors[0] ?? 'var(--nk-color-bg-surface)');
  return (
    <div className={className} style={{ background, ...style }}>
      {children}
    </div>
  );
}

/** NoonCheckoutProviderHeader — only when the page has a header (title + optional CTA pill). */
export function ProviderHeader({ header, onCtaPress }: { header: ProviderPage['header']; onCtaPress?: () => void }) {
  if (!header?.title) return null;
  return (
    <DynamicBackground colors={header.background.colors} className={styles.header}>
      <div className={styles.headerRow}>
        <span className={styles.headerTitle}>{header.title}</span>
        {header.cta ? (
          <button type="button" className={styles.headerCta} onClick={onCtaPress}>
            {header.cta.text}
          </button>
        ) : null}
      </div>
    </DynamicBackground>
  );
}

/** NoonCheckoutProviderFormTitle — 130×58 logo, crescent arc under it for loyalty providers, 18/700 title. */
export function FormTitle({ title, logo, color, isVouchersProvider }: { title: string; logo: string; color: string; isVouchersProvider: boolean }) {
  return (
    <div className={`${styles.logoContainer} ${!isVouchersProvider ? styles.logoContainerLoyalty : ''}`}>
      <ProviderLogo logo={logo} variant="page" />
      {!isVouchersProvider && <Crescent color={color} style={{ position: 'absolute', top: 50, left: '50%', translate: '-50% 0' }} />}
      <span className={styles.titleText}>{title}</span>
    </div>
  );
}

/** icons.quaraPaste — assets/icons/quara-paste.svg (git copy) */
function PasteIcon() {
  return <img src={pasteIcon} width={20} height={20} alt="" />;
}

export interface FormValues {
  voucherCode: string;
  phone: string;
  dialCode: string;
}

/** FormFields/validate.ts — required voucher code; required numeric phone + dial code */
export function validateForm(values: FormValues, fields: ProviderPage['fields']) {
  const errors: Partial<Record<keyof FormValues, string>> = {};
  if (fields.voucher && !values.voucherCode.trim()) errors.voucherCode = 'Hold up, this field is required.';
  if (fields.phoneNumber) {
    if (!values.phone.trim()) errors.phone = 'Hold up, this field is required.';
    else if (!/^\d+$/.test(values.phone)) errors.phone = 'Oh no! Please enter a valid number.';
    if (!values.dialCode.trim()) errors.dialCode = 'Hold up, this field is required.';
  }
  return errors;
}

/** NoonCheckoutProviderFormFields — voucher code (with paste) and/or phone number with the dial code prefix. */
export function FormFields({ values, onChange, error, disabled, page, color }: { values: FormValues; onChange: (field: keyof FormValues, v: string) => void; error?: string; disabled?: boolean; page: ProviderPage; color: string }) {
  const [focused, setFocused] = useState<string | null>(null);
  const voucher = page.fields.voucher;
  const phone = page.fields.phoneNumber;

  const onPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.length <= 20) onChange('voucherCode', text.trim());
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className={styles.formContainer}>
      {voucher && (
        <>
          <label className={styles.field}>
            <span className={styles.label}>{rt.noon_voucher_code}</span>
            <span className={styles.inputWrap}>
              <input
                className={styles.input}
                style={focused === 'voucherCode' ? { borderColor: color } : undefined}
                value={values.voucherCode}
                placeholder={voucher.placeholder || rt.noon_enter_voucher_code}
                maxLength={voucher.maxLength ?? 30}
                disabled={disabled}
                onFocus={() => setFocused('voucherCode')}
                onBlur={() => setFocused(null)}
                onChange={(e) => onChange('voucherCode', e.target.value.toUpperCase())}
              />
              <button type="button" className={styles.paste} onClick={onPaste} aria-label="Paste">
                <PasteIcon />
              </button>
            </span>
          </label>
          <div className={styles.separator} />
        </>
      )}
      {phone && (
        <label className={styles.field}>
          <span className={styles.label}>{rt.noon_primary_phone_number}</span>
          <span className={styles.inputWrap}>
            <span className={styles.dialCode}>+{phone.countryCode ?? values.dialCode.replace('+', '')}</span>
            <input
              className={`${styles.input} ${styles.phoneInput}`}
              style={focused === 'phone' ? { borderColor: color } : undefined}
              value={values.phone}
              placeholder={phone.placeholder || rt.noon_primary_phone_number}
              maxLength={10}
              inputMode="tel"
              disabled={disabled}
              onFocus={() => setFocused('phone')}
              onBlur={() => setFocused(null)}
              onChange={(e) => onChange('phone', e.target.value.replace(/[^\d]/g, ''))}
            />
          </span>
        </label>
      )}
      <span className={styles.errorText}>{error}</span>
    </div>
  );
}

/**
 * FormikSubmitButton / Button with isLoading: NoonButton metrics with the provider's colours (customBackgroundColor),
 * padding 14/16; disabled → disabledBackgroundColor + disabledTextColor.
 */
export function SubmitButton({ text, bg, textColor, disabled, loading, onPress, minHeight = 48, inset = true }: { text: string; bg: string; textColor: string; disabled?: boolean; loading?: boolean; onPress: () => void; minHeight?: number; inset?: boolean }) {
  const off = disabled && !loading;
  return (
    <Button
      variant="noon"
      className={styles.submit}
      style={{ minHeight, ...(inset ? null : { width: '100%', margin: 0 }), ...(off ? null : { background: bg, color: textColor }) }}
      disabled={off}
      loading={loading}
      spinner={{ size: 20, color: 'var(--nk-color-text-inverse)' }}
      onClick={onPress}
      whileTap={{ scale: 0.98 }}
      transition={undefined}
    >
      {text}
    </Button>
  );
}

/** NoonCheckoutProviderAmountTicket — voucher amount ticket: 75px logo stub with notches + dashed seam, amount, edit pill. */
export function AmountTicket({ logo, amount, currency, voucherCode, onEdit, notchColor, color }: { logo: string; amount: string; currency: string; voucherCode: string; onEdit: () => void; notchColor: string; color: string }) {
  return (
    <div className={styles.ticket}>
      <div className={styles.ticketLeft}>
        <ProviderLogo logo={logo} variant="rounded" style={{ width: 40, height: 40, borderRadius: 20, fontSize: 16 }} />
        <span className={styles.ticketNotchTop} style={{ background: notchColor }} />
        <span className={styles.ticketNotchBottom} style={{ background: notchColor }} />
        <span className={styles.ticketDashes}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={styles.ticketDash} />
          ))}
        </span>
      </div>
      <div className={styles.ticketRight}>
        <div className={styles.ticketAmount}>
          <span className={styles.ticketCurrency}>{currency}</span>
          <span className={styles.ticketAmountText}>{amount}</span>
        </div>
        <InfoEditButton text={voucherCode} onPress={onEdit} color={color} style={{ position: 'relative', bottom: 5 }} />
      </div>
    </div>
  );
}

/** NoonCheckoutProviderAmountEntry — pill input with the currency, red outer ring when out of range. */
export function AmountEntry({ amount, setAmount, currency, disabled, color, min, max, isOutOfRange }: { amount: string; setAmount: (v: string) => void; currency: string; disabled?: boolean; color: string; min: number; max: number; isOutOfRange: boolean }) {
  const [focused, setFocused] = useState(false);
  const maxLength = max ? String(max).length + 3 : 11;
  return (
    <div className={styles.amountContainer}>
      <div className={`${styles.amountOuter} ${isOutOfRange ? styles.amountOuterError : ''}`}>
        <div className={styles.amountWrap} style={focused ? { borderColor: color } : undefined}>
          <span className={styles.amountCurrency} style={{ color }}>
            {currency}
          </span>
          <input
            className={styles.amountInput}
            inputMode="decimal"
            value={amount}
            maxLength={maxLength}
            disabled={disabled}
            autoFocus
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
          />
        </div>
      </div>
      {isOutOfRange && <span className={styles.amountError}>{rt.noon_provider_amount_out_of_range(`${currency} ${min.toFixed(2)}`, `${currency} ${max.toFixed(2)}`)}</span>}
    </div>
  );
}

/** NoonCheckoutProviderAvailableBalance — checkbox + "Available {provider} balance" + price */
export function AvailableBalance({ checked, onToggle, providerName, balance, disabled }: { checked: boolean; onToggle: () => void; providerName: string; balance: string; disabled?: boolean }) {
  return (
    <button type="button" className={styles.balance} onClick={onToggle} disabled={disabled}>
      <img src={checked ? checkboxChecked : checkboxUnchecked} width={18} height={18} alt="" />
      <span className={styles.balanceLabel}>{rt.provider_available_amount(providerName)}</span>
      <span className={styles.balanceText}>{currency}&nbsp;{Number(balance).toFixed(2)}</span>
    </button>
  );
}

/** NoonCheckoutProviderVerifyOtp — segmented 44×44 boxes (r12, gray400 / theme colour when focused / red on error), timer + Resend OTP. */
export function VerifyOtp({ value, onChange, length, color, error, timer, otpMessage, onResend, autoFocus, disabled }: { value: string; onChange: (v: string) => void; length: number; color: string; error: string | null; timer: number; otpMessage: string | null; onResend: () => void; autoFocus: boolean; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  const mmss = `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`;
  const isError = !!error;
  return (
    <>
      <div className={styles.otp} onClick={() => ref.current?.focus()}>
        {Array.from({ length }).map((_, i) => {
          const isBoxFocused = focused && (i === value.length || (value.length === length && i === length - 1));
          return (
            <motion.span
              key={i}
              className={styles.otpBox}
              animate={isError ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                borderColor: isError ? 'var(--nk-palette-deep-red-color)' : isBoxFocused ? color : 'var(--nk-palette-gray400)',
                borderWidth: isBoxFocused && !isError ? 1.2 : 1,
              }}
            >
              <AnimatePresence>
                {value[i] && (
                  <motion.span key={value[i] + i} className={styles.otpText} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring.bouncy}>
                    {value[i]}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.span>
          );
        })}
        <input
          ref={ref}
          className={styles.otpHidden}
          value={value}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
        />
      </div>
      <div className={styles.otpInfo}>
        {error && <span className={styles.otpError}>{error}</span>}
        <div className={styles.timer}>
          {otpMessage ? (
            <span className={styles.otpMessage}>{otpMessage}</span>
          ) : (
            <>
              {timer > 0 && <span className={styles.timerText}>{mmss}</span>}
              <button type="button" className={styles.resend} disabled={timer > 0} onClick={onResend} style={{ color, opacity: timer > 0 ? 0.4 : 1 }}>
                {rt.noon_otp_form_resend_code}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/** termsInfo tinted with the provider colour + 12px note */
export function TermsNote({ text, color }: { text: string; color: string }) {
  return (
    <div className={styles.noteFooter}>
      <span className={styles.noteIcon} style={{ background: color, WebkitMaskImage: `url(${termsInfo})`, maskImage: `url(${termsInfo})` }} />
      <span className={styles.noteText}>{text}</span>
    </div>
  );
}

/** NoonCheckoutProviderOtpLoading — white 60% veil with a spinner */
export function OtpLoading({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;
  return (
    <div className={styles.otpLoading}>
      <Spinner color="var(--nk-color-chk-otp-loader)" />
    </div>
  );
}
