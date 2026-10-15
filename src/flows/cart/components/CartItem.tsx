import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { HtmlText, ProductImage, Spinner } from '../../../components';
import { cartAddOns, FOUPON_VALUE, type CartGroupType, type CartLine } from '../../../kit/DemoStore';
import { useDemoStore } from '../../../kit/DemoStore';
import { useNav } from '../../../kit/Navigator';
import { currency, discountPct, formatPrice } from '../../../data';
import { duration, easing, handoff } from '../../../motion/presets';
import checkedGreen from '@assets/cart/checkbox-checked-green.webp';
import uncheckedGreen from '@assets/cart/checkbox-unchecked-green.webp';
import arrowDownCircle from '@assets/cart/figma/arrow-down-circle.svg';
import checkboxChecked from '@assets/cart/figma/checkbox-checked.svg';
import etaFlash from '@assets/cart/figma/eta-flash.svg';
import ewShield from '@assets/cart/figma/ew-shield.svg';
import warrantyCreative from '@assets/cart/figma/warranty-creative.svg';
import wishlistIcon from '@assets/cart/figma/wishlist.svg';
import xMark from '@assets/cart/figma/x-mark.svg';
import { cartItemExtras, fouponImage, itemPoints, t, type CalloutAction, type CartItemExtras } from '../data';
import { groupTheme } from '../tokens';
import { CartIcon } from './CartIcon';
import { DiscountTags } from './DiscountTags';
import html from './html.module.css';
import { ItemPoint } from './ItemPoint';
import { QuantitySelector } from './QuantitySelector';
import { SalesCallout } from './SalesCallout';
import styles from './item.module.css';
import { useReduceMotion } from '../../../motion/reducedMotion';

export function getExtras(line: CartLine): CartItemExtras {
  const e = cartItemExtras[line.product.id];
  if (e) return e;
  // items added from other flows get the server's default delivery pill
  return { deliveryInfo: { icon: line.product.express ? 'express' : null, message: line.product.delivery.replace('<b>', '<highlight>').replace('</b>', '</highlight>') } };
}

/**
 * NoonCartItem, restyled to Figma Cart 2.0 "Cart item" (Component 120, e.g. I10575:94083 / 10575:94114):
 * row (gap 12) of the 104px image column — #F9F9FB r12 144px image box (p8) with the M-Checkbox at 8/8 and the
 * stepper overlapping its bottom by 16px — and the item data column (gap 16):
 *   primary (title 14/18 500 + 32px wishlist button, subtitle chips) · secondary (price row, ETA block) ·
 *   tertiary (coupons bar, "Lowest price" urgency pill, item points, notes).
 * Below: extended-warranty row / added protection card, foupon.
 */
export function CartItem({ line, group, onMovedToWishlist, onRemoveStart }: { line: CartLine; group?: CartGroupType; onMovedToWishlist: (line: CartLine) => void; onRemoveStart?: () => void }) {
  const nav = useNav();
  const { setQty, removeFromCart, moveToWishlist, updateLine } = useDemoStore();
  const p = line.product;
  const extras = getExtras(line);
  const theme = groupTheme[group ?? 'marketplace'];
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistDisabled, setWishlistDisabled] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [fouponLoading, setFouponLoading] = useState(false);
  const [ewLoading, setEwLoading] = useState(false);
  const [selected, setSelected] = useState(true);

  const onRemove = () => {
    setRemoveLoading(true);
    onRemoveStart?.();
    window.setTimeout(() => removeFromCart(p.id), 450);
  };

  const onWishlist = () => {
    if (wishlistDisabled || removeLoading || wishlistLoading) return;
    setWishlistLoading(true);
    window.setTimeout(() => {
      moveToWishlist(p.id);
      onMovedToWishlist(line);
    }, 550);
  };

  const onAction = (action: CalloutAction) => {
    switch (action) {
      case 'variants_switch':
        nav.sheet('cart/variants', { productId: p.id });
        break;
      case 'vbundle':
        nav.sheet('cart/bundles', { productId: p.id });
        break;
      case 'ew':
        setEwLoading(true);
        window.setTimeout(() => {
          updateLine(p.id, { warranty: 'ew1' });
          setEwLoading(false);
        }, 600);
        break;
      case 'remove_ew':
        updateLine(p.id, { warranty: null });
        break;
      default:
        nav.toast('Opens CMS page');
    }
  };

  const toggleFoupon = () => {
    setFouponLoading(true);
    window.setTimeout(() => {
      updateLine(p.id, { foupon: !line.foupon });
      setFouponLoading(false);
    }, 500);
  };

  const max = extras.quantityMax ?? 10;
  const disabled = wishlistLoading;
  const warranty = line.warranty ? cartAddOns[line.warranty] : null;
  const pct = discountPct(p);
  const ewCallout = extras.bottomCallouts?.[0];

  return (
    <div className={styles.card}>
      <div className={styles.container} onClick={() => !disabled && nav.push('pdp/detail', { productId: p.id })} role="link">
        <div className={styles.imageColumn}>
          <div className={styles.imageBox}>
            <ProductImage product={p} width={88} height={128} style={{ background: 'transparent' }} />
            <button
              type="button"
              className={styles.checkbox}
              aria-pressed={selected}
              aria-label="Select item"
              onClick={(e) => {
                e.stopPropagation();
                setSelected((v) => !v);
              }}
            >
              {selected ? <img src={checkboxChecked} alt="" /> : <span className={styles.checkboxOff} />}
            </button>
            {extras.catalogTag && <span className={styles.sideTag}>{extras.catalogTag}</span>}
          </div>
          <QuantitySelector qty={line.qty} max={max} disabled={disabled} removeLoading={removeLoading} onCommit={(q) => setQty(p.id, q)} onRemove={onRemove} onPendingChange={setWishlistDisabled} />
        </div>
        <div className={styles.data}>
          <div className={styles.blockTop}>
            <div className={styles.primaryInfo}>
              <div className={styles.titleRow}>
                <span className={styles.title}>{`${p.brand} ${p.title}`}</span>
                <motion.button
                  type="button"
                  className={styles.wishlistButton}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onWishlist();
                  }}
                  disabled={wishlistDisabled || removeLoading || wishlistLoading}
                  aria-label="Move to wishlist"
                >
                  {wishlistLoading ? <Spinner size={16} thickness={16 / 9} duration={0.7} color="var(--nk-color-text-primary)" /> : <img src={wishlistIcon} alt="" />}
                </motion.button>
              </div>
              {!!line.customization?.length && (
                <button
                  type="button"
                  className={styles.customization}
                  onClick={(e) => {
                    e.stopPropagation();
                    nav.sheet('cart/customize', { productId: p.id });
                  }}
                >
                  <span className={styles.customizationAnswers}>
                    <span className={styles.customizationLabel}>{t.text}: </span>
                    {line.customization.map((a) => a.answer).join(', ')}
                  </span>
                  <span className={styles.customizationEdit}>{t.edit}</span>
                </button>
              )}
              {!!extras.callouts?.length && (
                <div className={styles.callouts}>
                  {extras.callouts.map((c) => (
                    <SalesCallout
                      key={c.message}
                      entry={{ ...c, background: null, message: c.message.replace('{variant}', line.variant ?? p.sizes?.[0] ?? 'Default') }}
                      sheet="itemCallout"
                      lines={1}
                      onAction={onAction}
                      className={c.button?.action === 'variants_switch' ? styles.variantChip : styles.subtitleChip}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className={styles.secondaryInfo}>
              <div className={styles.priceRow}>
                <span className={styles.price}>{`${currency}${formatPrice(p.price)}`}</span>
                {(p.was && p.was > p.price) || pct > 0 ? (
                  <span className={styles.priceDiscount}>
                    {p.was && p.was > p.price ? <span className={styles.priceOld}>{`${currency}${formatPrice(p.was)}`}</span> : null}
                    {pct > 0 ? <span className={styles.pricePct}>{`${pct}% OFF`}</span> : null}
                  </span>
                ) : null}
              </div>
              {extras.deliveryInfo && (
                <div className={styles.eta}>
                  <span className={styles.etaPill} style={{ background: `linear-gradient(90deg, ${theme.eta}, var(--nk-color-bg-surface))`, color: theme.etaInk }} data-ink={theme.etaInk ? '' : undefined}>
                    {extras.deliveryInfo.icon === 'flash' && <img src={etaFlash} alt="" className={styles.etaIcon} />}
                    <HtmlText base value={extras.deliveryInfo.message} className={html.eta} />
                  </span>
                  {extras.deliveryInfo.expiryMessage && (
                    <span className={styles.etaExpiry}>
                      <HtmlText base value={extras.deliveryInfo.expiryMessage} className={html.etaExpiry} />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {(!!extras.discountTags?.length || !!extras.urgency || !!extras.usps?.length || !!extras.points?.length || !!extras.specifications?.length || !!extras.notes?.length) && (
            <div className={styles.tertiaryInfo}>
              <DiscountTags tags={extras.discountTags} onOpen={(tag) => nav.sheet('cart/discount', { productId: p.id, tagId: tag.id })} />
              {extras.urgency && (
                <span className={styles.urgency}>
                  <img src={arrowDownCircle} alt="" />
                  <span className={styles.urgencyText}>{extras.urgency}</span>
                </span>
              )}
              {!!extras.usps?.length && <Usps usps={extras.usps} />}
              {(!!extras.points?.length || !!extras.specifications?.length) && (
                <div className={styles.points}>
                  {extras.points?.map((k) => <ItemPoint key={k} kind={k} label={itemPoints[k]} />)}
                  {extras.specifications?.map((s) => <ItemPoint key={s} label={s} />)}
                </div>
              )}
              {!!extras.notes?.length &&
                extras.notes.map((n) => (
                  <span key={n} className={styles.note}>
                    <HtmlText base value={n} className={html.notes} />
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>
      {(warranty || ewCallout) && (
        <AnimatePresence initial={false} mode="popLayout">
          {warranty ? (
            <motion.div key="ew" className={styles.warranty} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8, transition: { y: handoff.spring, opacity: { duration: duration.medium, ease: easing.inOut } } }} transition={{ y: handoff.spring, opacity: { duration: duration.medium, ease: easing.out } }}>
              <button type="button" className={styles.warrantyRemove} onClick={() => onAction('remove_ew')} aria-label="Remove warranty">
                <img src={xMark} alt="" />
              </button>
              <img src={warrantyCreative} alt="" className={styles.warrantyImg} />
              <span className={styles.warrantyDesc}>
                <span className={styles.warrantyName}>noon Protect</span>
                <span className={styles.warrantyRow}>
                  <span className={styles.warrantyTitle}>{warranty.label}</span>
                  <span className={styles.warrantyPrice}>{`${currency}${formatPrice(warranty.price)}`}</span>
                </span>
              </span>
            </motion.div>
          ) : (
            <motion.div key="bc" className={styles.ewWrap} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button
                type="button"
                className={styles.ewRow}
                onClick={(e) => {
                  e.stopPropagation();
                  if (ewCallout!.button) onAction(ewCallout!.button.action);
                }}
              >
                <span className={styles.ewIcon}>
                  <img src={ewShield} alt="" />
                </span>
                <span className={styles.ewText}>
                  <HtmlText base value={ewCallout!.message} lines={1} className={html.ew} />
                  {ewCallout!.button?.message && <span className={styles.ewCta}>{ewCallout!.button.message}</span>}
                </span>
              </button>
              {ewLoading && (
                <span className={styles.fouponLoading}>
                  <Spinner size={14} thickness={14 / 9} duration={0.7} color="var(--nk-color-text-ink)" />
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
      {extras.foupon && (
        <div className={styles.fouponWrap}>
          <button type="button" className={styles.foupon} onClick={toggleFoupon} disabled={fouponLoading}>
            <img src={fouponImage} alt="" className={styles.fouponIcon} />
            <img src={line.foupon ? checkedGreen : uncheckedGreen} alt="" className={styles.fouponCheck} />
            <HtmlText base value={line.foupon ? extras.foupon.appliedMessage : extras.foupon.message.replace('15', String(FOUPON_VALUE))} className={html.foupon} />
          </button>
          {fouponLoading && (
            <span className={styles.fouponLoading}>
              <Spinner size={14} thickness={14 / 9} duration={0.7} color="var(--nk-color-text-ink)" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** NoonSalesUSPs: one USP at a time sliding up (enter 400ms / exit 550ms, offset 20), in the Figma "USPs Urgency" pill. */
function Usps({ usps }: { usps: string[] }) {
  const [i, setI] = useState(0);
  const reduce = useReduceMotion();
  useEffect(() => {
    // reduced motion: the first USP stays (no auto-rotation)
    if (usps.length < 2 || reduce) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % usps.length), 3000);
    return () => window.clearInterval(id);
  }, [usps.length, reduce]);
  return (
    <div className={styles.usps}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={i}
          className={styles.usp}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { duration: 0.4 } }}
          exit={{ y: -20, opacity: 0, transition: { duration: 0.55 } }}
        >
          <CartIcon name="greenCheck" size={16} color="var(--nk-color-cart-emerald)" />
          <HtmlText base value={usps[i]} lines={1} className={html.urgency} />
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
