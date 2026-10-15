import { motion, useAnimationControls } from 'motion/react';
import { useState } from 'react';
import { Icon, ProductImage } from '../../components';
import { useDemoStore } from '../../kit/DemoStore';
import { useNav } from '../../kit/Navigator';
import type { ScreenProps } from '../../kit/types';
import { currency, formatPrice, productById } from '../../data';
import { easing } from '../../motion/presets';
import { Asset } from './components/Asset';
import { copy, discountPercent, pdpContent, showDiscount } from './data';
import styles from './pdp.module.css';

/**
 * NoonVariantsOverlayScreen: header (80px 3:4 image, brand + title 14/18 slateGray, PriceDiscounted 16/700,
 * delivery 32h) · 90% separator · NoonProductSizeVariantSelection (SIZE 12/500 tracking 1, NoonProductCartSelectionItem chips) ·
 * footer NoonOfferAddToCartQuantity: 48px QTY square + 48px "ADD TO CART" (r8, accentColor).
 * Behaviour (useVariantOverlay `shouldPreselectVariant: false`): opened from a product card's + (`variant_overlay_url`),
 * nothing is preselected; out-of-stock sizes show dashed and can't be tapped. ADD TO CART without a size turns the title
 * into "PLEASE SELECT THE SIZE" (errorMessageColor) and shakes the chips (NoonShakingWrapper: −10 10 −8 8 −5 5 0, 50ms
 * each); picking a size clears it. Success closes the sheet and shows the "Added to cart" snackbar (useCart).
 */
export function VariantsSheet({ params }: ScreenProps<{ productId: string; sizeMissing?: boolean }>) {
  const nav = useNav();
  const { addToCart } = useDemoStore();
  const product = productById(params.productId);
  const sizes = pdpContent(product).sizes?.options ?? (product.sizes ?? []).map((name) => ({ name, available: true }));
  const [size, setSize] = useState<number>(-1);
  const [warn, setWarn] = useState(!!params.sizeMissing);
  const [qty, setQty] = useState(1);
  const shake = useAnimationControls();
  // sizes of one product share its offer price
  const sale = product.price;
  const was = product.was;

  const add = () => {
    if (sizes.length > 0 && size < 0) {
      setWarn(true);
      shake.start({ x: [0, -10, 10, -8, 8, -5, 5, 0], transition: { duration: 0.35, ease: easing.inOut } });
      return;
    }
    addToCart(product.id, qty);
    nav.back();
    nav.toast(copy.addedToCart, { icon: <Icon name="checkCircle" size={20} />, tone: 'default' });
  };

  return (
    <div className={styles.variantsSheet}>
      <div className={styles.variantsScroll}>
        <div className={styles.variantsHeader}>
          <div className={styles.variantsImage}>
            <ProductImage product={product} width="100%" aspect={3 / 4} emojiScale={0.5} />
            <span className={styles.variantsImageOverlay} />
          </div>
          <div className={styles.variantsInfo}>
            <span className={styles.variantsName}>
              {product.brand} {product.title}
            </span>
            <span className={styles.variantsPrice}>
              <span className={styles.variantsSale}>
                <span className={styles.variantsCur}>{currency}&nbsp;</span>
                {formatPrice(sale)}
              </span>
              {was && showDiscount(was, sale) && (
                <span className={styles.variantsDiscountRow}>
                  <span className={styles.variantsWas}>{formatPrice(was)}</span>
                  <span className={styles.variantsOff}>{copy.off(discountPercent(was, sale))}</span>
                </span>
              )}
            </span>
            <span className={styles.variantsDelivery}>
              <Asset name="expressPdp" width="var(--nk-layout-pdp-express-w)" height="var(--nk-layout-pdp-express-h)" />
              <span dangerouslySetInnerHTML={{ __html: product.delivery }} />
            </span>
          </div>
        </div>
        <div className={styles.variantsSep} />
        {sizes.length > 0 && (
          <div className={styles.variantsBody}>
            <div className={styles.sizeSection}>
              <div className={styles.sizeSectionTitleRow}>
                <span className={styles.sizeSectionTitle} data-warning={warn || undefined}>
                  {warn ? copy.sizeMissing : copy.size}
                </span>
              </div>
              <motion.div className={styles.cartChips} animate={shake}>
                {sizes.map((s, i) => (
                  <button
                    key={s.name}
                    type="button"
                    className={styles.cartChip}
                    data-selected={i === size || undefined}
                    data-disabled={!s.available || undefined}
                    disabled={!s.available || i === size}
                    onClick={() => {
                      setSize(i);
                      setWarn(false);
                    }}
                  >
                    <span className={styles.cartChipText}>{s.name}</span>
                  </button>
                ))}
              </motion.div>
            </div>
          </div>
        )}
      </div>
      <div className={styles.variantsFooter}>
        <button type="button" className={styles.squareQty} onClick={() => setQty((q) => (q >= 5 ? 1 : q + 1))} aria-label={copy.quantity}>
          <span className={styles.squareQtyLabel}>{copy.qty}</span>
          <span className={styles.squareQtyValue}>{qty}</span>
        </button>
        <button type="button" className={styles.squareAtc} onClick={add}>
          {copy.addToCartCaps}
        </button>
      </div>
    </div>
  );
}
