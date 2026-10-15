import { motion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Skeleton } from '../../../components';
import { useNav } from '../../../kit/Navigator';
import chevronIcon from '@assets/checkout/figma/mini-chevron-right.svg';
import mokafaaLogo from '@assets/checkout/figma/provider-mokafaa.svg';
import quaraLogo from '@assets/checkout/figma/provider-quara.svg';
import emkanLogo from '@assets/checkout/figma/provider-emkan.svg';
import { tf } from '../data';
import { paymentFigmaIcons } from '../data.payment';
import { loyaltyProviders, voucherProviders, type BurnProvider } from '../data.rewards';
import { ensureProvidersLoading, useRewards } from '../store.rewards';
import { ProviderLogo } from './RewardsPrimitives';
import { duration, easing } from '../../../motion/presets';
import styles from './BurnSection.module.css';

/** Opens NoonProviderBurnOverlayScreen for a provider (onProviderCalloutPress). */
export function openProviderBurn(nav: ReturnType<typeof useNav>, provider: BurnProvider, isVouchersProvider: boolean) {
  nav.push('checkout/provider-burn', { code: provider.code, isVouchersProvider });
}

/** Figma "Redemption Programs images ATOM" tiles (45×45); providers without a Figma tile use the kit wordmark. */
function ProgramTile({ provider }: { provider: BurnProvider }) {
  if (provider.code === 'mokafaa')
    return (
      <span className={styles.tileMokafaa}>
        <img src={mokafaaLogo} width={36} height={14.8708} alt="Mokafaa" />
      </span>
    );
  if (provider.code === 'quara')
    return (
      <span className={styles.tileQuara}>
        <img src={quaraLogo} width={33.5531} height={5.57398} alt="QUARA" />
      </span>
    );
  if (provider.code === 'emkan')
    return (
      <span className={styles.tileEmkan}>
        <img src={emkanLogo} width={37.0739} height={10.9849} alt="Emkan" />
      </span>
    );
  return <ProviderLogo logo={provider.logo} variant="expanded" style={{ borderRadius: 'var(--nk-radius-r6)' }} />;
}

/** Figma red "NEW" badge (#FA0000 r12, px 6, 12/16.6 SemiBold white, 30% texture overlay) */
export function NewBadge({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className={styles.newBadge}>
        <span className={styles.newBadgeText}>{tf.newBadge}</span>
        <img className={styles.newBadgeTexture} src={paymentFigmaIcons.newBadgeTexture} alt="" />
      </span>
    </span>
  );
}

function Card({ provider, expanded, onPress }: { provider: BurnProvider; expanded?: boolean; onPress: () => void }): ReactNode {
  const isNew = provider.tag?.message.toUpperCase() === 'NEW';
  if (expanded) {
    return (
      <button type="button" className={styles.cardExpanded} onClick={onPress} disabled={provider.isDisabled}>
        <ProgramTile provider={provider} />
        <span className={styles.cardInfo}>
          <span className={styles.cardTitle}>{provider.title}</span>
          {provider.description ? <span className={styles.cardDescription}>{provider.description}</span> : null}
        </span>
        <img className={styles.cardChevron} src={chevronIcon} width={14} height={14} alt="" />
      </button>
    );
  }
  return (
    <button type="button" className={styles.card} onClick={onPress} disabled={provider.isDisabled} aria-label={provider.title}>
      <ProgramTile provider={provider} />
      {isNew && <NewBadge className={styles.cardBadge} />}
    </button>
  );
}

/**
 * Figma "🚧 Checkout 2.0" Credits & points (14288:184049) — top block of the payment card: "Points & Vouchers"
 * 16/20 Bold + "Need credits? Top up now!" 12/14 Medium; Loyalty programs carousel (gap 4): the first provider
 * as a 49px expanded card (tile + name + linked account + chevron), the rest as 49×49 tiles (NEW badge), then
 * the page dots (active 18×5 GrayA/1000, inactive 5×5 GrayA/400, both 72%). Tap → NoonProviderBurnOverlayScreen.
 * Skeleton while getProviderList is loading.
 */
export function BurnSection() {
  const nav = useNav();
  const loaded = useRewards((s) => s.providersLoaded);
  const scroller = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);
  useEffect(() => ensureProvidersLoading(), []);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => setPages(Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth - 0.05)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loaded]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setPage(max > 0 ? Math.round((el.scrollLeft / max) * (pages - 1)) : 0);
  };

  const header = (
    <div className={styles.head}>
      <span className={styles.title}>{tf.pointsTitle}</span>
      <span className={styles.subtitle}>{tf.pointsSubtitle}</span>
    </div>
  );

  if (!loaded) {
    return (
      <div className={styles.container}>
        {header}
        <div className={styles.programs}>
          <div className={styles.cards}>
            <Skeleton height={49} radius={8} style={{ flex: 1 }} />
            <Skeleton width={49} height={49} radius={8} />
            <Skeleton width={49} height={49} radius={8} />
          </div>
          <div className={styles.dots}>
            <span className={styles.dot} />
          </div>
        </div>
      </div>
    );
  }

  const [first, ...rest] = loyaltyProviders;
  return (
    <div className={styles.container}>
      {header}
      <div className={styles.programs}>
        <div ref={scroller} className={`nk-hscroll ${styles.cards}`} onScroll={onScroll}>
          {first && <Card provider={first} expanded onPress={() => openProviderBurn(nav, first, false)} />}
          {rest.map((p) => (
            <Card key={p.code} provider={p} onPress={() => openProviderBurn(nav, p, false)} />
          ))}
          {voucherProviders.map((p) => (
            <Card key={p.code} provider={p} onPress={() => openProviderBurn(nav, p, true)} />
          ))}
        </div>
        <div className={styles.dots} aria-hidden>
          {Array.from({ length: pages }, (_, i) => (
            <motion.span key={i} className={styles.dot} data-active={i === page || undefined} animate={{ width: i === page ? 18 : 5 }} transition={{ duration: duration.base, ease: easing.inOut }} />
          ))}
        </div>
      </div>
    </div>
  );
}
