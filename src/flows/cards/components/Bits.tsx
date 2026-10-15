import { motion } from 'motion/react';
import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { acceptedBrands, brandIcons, cardsIcons } from '../data';
import { cardsSprings } from '../tokens';
import { getTypeFromNumber } from '../utils';
import { duration, easing, handoff } from '../../../motion/presets';
import { MaskIcon } from '../../../components';
import s from './components.module.css';

/** components/PaymentCardsSectionTitle — "Your saved cards" between two group-line glyphs. */
export function SectionTitle({ children, style }: { children: string; style?: CSSProperties }) {
  if (!children) return null;
  return (
    <div className={s.sectionTitle} style={style}>
      <img src={cardsIcons.group.src} width={cardsIcons.group.w} height={cardsIcons.group.h} alt="" />
      <span className={s.sectionTitleText}>{children}</span>
      <img src={cardsIcons.group.src} width={cardsIcons.group.w} height={cardsIcons.group.h} alt="" style={{ transform: 'scaleX(-1)' }} />
    </div>
  );
}

/** components/PaymentCardTypeLogo — live brand logo inside the card number field (height 32, nudged up 8). */
export function CardTypeLogo({ cardNumber }: { cardNumber: string }) {
  const type = useMemo(() => getTypeFromNumber(cardNumber), [cardNumber]);
  if (!type) return null;
  const icon = brandIcons[type];
  return (
    <motion.img
      key={type}
      className={s.typeLogo}
      src={icon.src}
      alt={type}
      style={{ width: icon.w }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ scale: handoff.spring, opacity: { duration: duration.fast, ease: easing.out } }}
    />
  );
}

/** components/PaymentCardBrands — accepted brands from noonConfig.cardBrandConfigs. */
export function CardBrands({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={[s.brands, className].filter(Boolean).join(' ')}>
      {acceptedBrands.map((b) => (
        <div key={b} className={[s.brandWrap, compact && s.brandWrapCompact].filter(Boolean).join(' ')}>
          <img src={brandIcons[b].src} alt={b} className={s.brandImg} />
        </div>
      ))}
    </div>
  );
}

const TINT = 'var(--nk-color-cards-tinted-icon)';

/** components/PaymentScanCardIcon (react-native-svg → inline svg) */
export function ScanCardIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id="scanCardGrad" x1="19.9889" y1="11.0144" x2="19.9889" y2="28.8437" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopOpacity={0.6} style={{ stopColor: TINT }} />
          <stop offset="1" stopOpacity={1} style={{ stopColor: TINT }} />
        </linearGradient>
      </defs>
      <g style={{ stroke: TINT }}>
        <path d="M2.99023 14.4384V9.8828C2.99023 8.53277 4.08465 7.43835 5.43468 7.43835H9.99023" strokeOpacity={0.5} strokeWidth="1.22222" strokeLinecap="round" />
        <path d="M29.9902 7.43835L34.5458 7.43835C35.8958 7.43835 36.9902 8.53277 36.9902 9.8828L36.9902 14.4384" strokeOpacity={0.5} strokeWidth="1.22222" strokeLinecap="round" />
        <path d="M2.99023 25.4384V29.9939C2.99023 31.3439 4.08465 32.4384 5.43468 32.4384H9.99023" strokeOpacity={0.5} strokeWidth="1.22222" strokeLinecap="round" />
        <path d="M29.9902 32.4384L34.5458 32.4384C35.8958 32.4384 36.9902 31.3439 36.9902 29.9939L36.9902 25.4384" strokeOpacity={0.5} strokeWidth="1.22222" strokeLinecap="round" />
      </g>
      <rect x="7.03247" y="11.0144" width="25.9129" height="17.8293" rx="2.80201" fill="url(#scanCardGrad)" />
      <rect x="10.304" y="17.6301" width="3.80452" height="3.01725" rx="0.700502" fill="white" fillOpacity={0.7} />
      <rect x="10.4733" y="22.5602" width="5.64336" height="2.10151" rx="0.700502" fill="white" fillOpacity={0.5} />
      <rect x="17.1674" y="22.5602" width="5.64336" height="2.10151" rx="0.700502" fill="white" fillOpacity={0.5} />
      <rect x="23.8615" y="22.5602" width="5.64336" height="2.10151" rx="0.700502" fill="white" fillOpacity={0.5} />
    </svg>
  );
}

/** components/PaymentTapCardIcon (react-native-svg → inline svg) */
export function TapCardIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id="tapCardGrad" x1="20" y1="8.57446" x2="20" y2="32.5745" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopOpacity={0.6} style={{ stopColor: TINT }} />
          <stop offset="1" stopOpacity={1} style={{ stopColor: TINT }} />
        </linearGradient>
      </defs>
      <rect x="3" y="8.57446" width="34" height="24" rx="3.52047" fill="url(#tapCardGrad)" />
      <path
        d="M27.1966 22.662C27.0971 23.0483 27.0214 23.3935 26.9024 23.7823C26.5372 24.9653 25.9979 26.0897 25.3015 27.1203C25.1691 27.317 24.8915 27.7372 24.7171 27.8728C24.5651 27.9891 24.3725 28.0414 24.1811 28.0186C23.979 27.9957 23.7891 27.8868 23.6644 27.7298C23.508 27.5298 23.4655 27.2657 23.5518 27.0283C23.6068 26.8768 23.8974 26.4976 24.0097 26.334C24.1396 26.1444 24.2625 25.9503 24.3783 25.7519C25.2204 24.3416 25.7376 22.7679 25.8936 21.141C26.0332 19.6414 25.8569 18.1298 25.3759 16.6997C25.0814 15.8323 24.6832 15.002 24.1897 14.2263C24.0731 14.0414 23.9509 13.8598 23.8235 13.6819C23.6293 13.407 23.4654 13.2658 23.5155 12.9046C23.543 12.7093 23.6494 12.5332 23.8109 12.4157C23.9801 12.2914 24.1867 12.2491 24.3941 12.2827C24.6579 12.3255 24.7984 12.4622 24.948 12.6641C26.6026 14.8977 27.4899 17.5579 27.4536 20.3224C27.4441 21.0534 27.3583 21.7399 27.2367 22.4612C27.2238 22.526 27.2076 22.5975 27.1966 22.662Z"
        fill="white"
      />
      <path
        d="M20.7987 14.0221C21.3368 13.9493 21.6075 14.4106 21.8697 14.7877C22.6569 15.9039 23.1937 17.1712 23.4444 18.5057C23.8826 20.969 23.3043 23.5021 21.837 25.5474C21.6015 25.8807 21.4208 26.1922 21.0033 26.2663C20.4071 26.336 19.9454 25.7713 20.2117 25.2256C20.3056 25.0332 20.5378 24.7691 20.67 24.578C22.3384 22.1913 22.5294 19.0976 21.1666 16.5311C20.9996 16.215 20.8133 15.909 20.6087 15.6148C20.4896 15.4466 20.3522 15.288 20.2415 15.1145C20.0995 14.8819 20.1095 14.5545 20.2722 14.3339C20.4128 14.1433 20.5696 14.0616 20.7987 14.0221Z"
        fill="white"
      />
      <path
        d="M17.3905 15.7587C17.881 15.7061 18.0803 15.973 18.3522 16.3178C18.9522 17.0673 19.3745 17.9382 19.5886 18.8674C19.9339 20.4626 19.6144 22.127 18.7012 23.4901C18.5201 23.7656 18.2139 24.1894 17.9563 24.3992C17.8739 24.4663 17.76 24.5049 17.6556 24.527C17.1273 24.6 16.685 24.2028 16.7673 23.6735C16.8098 23.3997 16.9893 23.2467 17.1589 23.0379C17.2714 22.8976 17.3757 22.751 17.4712 22.5989C18.5567 20.8858 18.4287 18.912 17.2204 17.3172C17.0729 17.1225 16.8268 16.9124 16.7763 16.6724C16.6824 16.2267 16.9374 15.8544 17.3905 15.7587Z"
        fill="white"
      />
      <path
        d="M14.0174 19.2233C13.7052 18.8225 13.2668 18.7171 13.3459 18.1545C13.372 17.9625 13.4763 17.7889 13.635 17.6735C13.8101 17.5436 13.9929 17.5069 14.2097 17.5313C14.5613 17.5709 15.0393 18.0702 15.2422 18.3353C15.733 18.9768 15.9551 19.7845 15.8295 20.5834C15.7017 21.3967 15.2491 22.096 14.5806 22.5922C14.3982 22.7275 14.2088 22.7889 13.9794 22.7559C13.7777 22.7281 13.5959 22.6216 13.4755 22.4604C13.3516 22.2961 13.315 22.1119 13.3439 21.9107C13.3964 21.5458 13.6418 21.4614 13.8648 21.231C14.3285 20.7519 14.4665 20.2116 14.2312 19.5863C14.1664 19.4438 14.1116 19.3481 14.0174 19.2233Z"
        fill="white"
      />
    </svg>
  );
}

/** components/PaymentCardAdditionOption — icon, title/subtitle, slim chevron; spring press 0.97. */
export function AdditionOption({ icon, title, subtitle, onPress, disabled }: { icon: ReactNode; title: string; subtitle?: string; onPress: () => void; disabled?: boolean }) {
  return (
    <motion.button type="button" className={s.option} disabled={disabled} whileTap={{ scale: 0.97 }} transition={cardsSprings.press} onClick={onPress}>
      <span className={s.optionLeading}>
        <span className={s.optionIcon}>{icon}</span>
      </span>
      <span className={s.optionContent}>
        <span className={s.optionTitle}>{title}</span>
        {subtitle && <span className={s.optionSubtitle}>{subtitle}</span>}
      </span>
      <span className={s.optionTrailing}>
        <img src={cardsIcons.chevronRight.src} width={20} height={20} alt="" />
      </span>
    </motion.button>
  );
}

/** components/PaymentScanOptionButton — 34pt translucent pill used in the form header (Scan / Tap). */
export function ScanOptionButton({ icon, title, onPress, disabled }: { icon: ReactNode; title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <motion.button type="button" className={s.scanOption} disabled={disabled} whileTap={{ scale: 0.96 }} transition={{ duration: 0 }} onClick={onPress}>
      <span className={s.scanOptionIcon}>{icon}</span>
      <span className={s.scanOptionText}>{title}</span>
    </motion.button>
  );
}

/** components/PaymentEnterManuallyField — faux input inside the "Enter details manually" card. */
export function EnterManuallyField({ text }: { text: string }) {
  return (
    <div className={s.enterManually}>
      <span className={s.enterManuallyText}>{text}</span>
    </div>
  );
}

/** lock + muted copy (ManualAddition message / form secure message) */
export function LockNote({ text, variant }: { text: string; variant: 'muted' | 'form' }) {
  return (
    <div className={variant === 'form' ? s.secureMessage : s.lockMessage}>
      {variant === 'form' ? (
        <img src={cardsIcons.lock.src} width={12} height={12} alt="" style={{ marginTop: 2, objectFit: 'contain' }} />
      ) : (
        <MaskIcon src={cardsIcons.lock.src} width={12} height={12} color="var(--nk-color-text-tertiary)" />
      )}
      <span className={variant === 'form' ? s.secureMessageText : s.lockMessageText}>{text}</span>
    </div>
  );
}
