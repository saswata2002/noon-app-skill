import { motion } from 'motion/react';
import { useDemoStore } from '../../kit/DemoStore';
import { useNav } from '../../kit/Navigator';
import { currency, discountPct, formatPrice, type Product } from '../../data';
import { spring } from '../../motion/presets';
import { CatalogTag } from '../Tag/Tag';
import { ProductImage } from '../ProductImage/ProductImage';
import { LikeHeart } from '../WishlistHeart/LikeHeart';
import plusBlue from '@assets/shared/sku/plus-blue.svg';
import star from '@assets/shared/sku/star.svg';
import truck from '@assets/shared/sku/truck.svg';
import pillExpress from '@assets/shared/sku/pill-express.svg';
import pillExpressToday from '@assets/shared/sku/pill-express-today.svg';
import styles from './SkuCard.module.css';

export type SkuFulfilment = 'express' | 'expressToday';

export interface SkuCardProps {
  product: Product;
  /**
   * `feed` (default): Homepage Revamp 2025 "SKU" (iRE9RwO94eMAyW3j3XKNXW · 1337:5579): white + Blue-Gray 4% image box,
   * heart at 4/4, "+" at 94/136, emerald "Best Seller" tag, flat rating pill, `#008200` discount.
   * `cart`: Cart 2.0 "SKU" (BaWAAGW7zmdSTkXNXqPcAJ · 10575:94182): grey image box with a 1px border, heart at 3/3,
   * "+" at 95/135, catalog tag, Grass/700 discount — the carousels in the cart.
   */
  look?: 'feed' | 'cart';
  /** top-left tag; defaults to `product.tag`. `null` hides it. */
  badge?: string | null;
  /** sponsored product → "Ad" tag at the image box bottom-left */
  sponsored?: boolean;
  /** show the rating pill (needs `product.rating`) */
  rating?: boolean;
  /** delivery line under the price, e.g. "Free Delivery". Omitted → none. */
  deliveryNote?: string;
  /** fulfilment pill; defaults to `express` when `product.express`. `null` hides it. */
  fulfilment?: SkuFulfilment | null;
  /** product image box inside the 134×174 frame (Figma: 122, some cut-outs 142) */
  imageSize?: number;
  /** override the default press (PDP) */
  onPress?: () => void;
}

/**
 * SkuCard — the 134px product card of every noon product rail (Figma component "SKU", shared by the Homepage
 * Revamp 2025 rails and the Cart 2.0 carousels). Image box 134×174 r10 with the wishlist heart (24 circle,
 * white 20%), the blue "+" quick add (white, 1.2px `link`, r8, p4) and the tags; info p4 gap 8: title 14/18 500
 * (2 lines), rating pill, price 15/20 700 with the dirham sign + 12/14 strike + 12/14 600 "%", delivery line
 * and the express pill. Tap → PDP, "+" → add to cart, heart → wishlist (DemoStore).
 */
export function SkuCard({ product: p, look = 'feed', badge, sponsored, rating, deliveryNote, fulfilment, imageSize = 122, onPress }: SkuCardProps) {
  const nav = useNav();
  const { addToCart, toggleWishlist, isWishlisted } = useDemoStore();
  const pct = discountPct(p);
  const wished = isWishlisted(p.id);
  const tag = badge === undefined ? p.tag : badge;
  const pill = fulfilment === undefined ? (p.express ? 'express' : null) : fulfilment;
  const showRating = rating ?? look === 'feed';
  return (
    <motion.article className={styles.sku} data-look={look} whileTap={{ scale: 0.98 }} transition={spring.press} onClick={onPress ?? (() => nav.push('pdp/detail', { productId: p.id }))}>
      <div className={styles.media}>
        {p.image ? (
          <img src={p.image} alt={p.title} loading="lazy" decoding="async" className={styles.image} style={{ width: imageSize, height: imageSize }} />
        ) : (
          <ProductImage product={p} width={imageSize} height={imageSize} style={{ background: 'transparent' }} />
        )}
        {tag &&
          (look === 'cart' ? (
            <span className={styles.catalogTag}>
              <CatalogTag>{tag}</CatalogTag>
            </span>
          ) : (
            <span className={styles.badge}>{tag}</span>
          ))}
        {sponsored && <span className={styles.ad}>Ad</span>}
        <motion.button
          type="button"
          className={styles.heart}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wished}
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            const added = toggleWishlist(p.id);
            nav.toast(added ? 'Added to Wishlist' : 'Removed from Wishlist');
          }}
        >
          <LikeHeart on={wished} size={16} />
        </motion.button>
        <motion.button
          type="button"
          className={styles.add}
          whileTap={{ scale: 0.9 }}
          aria-label="Add to cart"
          onClick={(e) => {
            e.stopPropagation();
            addToCart(p.id); // no snackbar on a direct quick add (bappzaar useCartActions)
          }}
        >
          <img src={plusBlue} alt="" />
        </motion.button>
      </div>
      <div className={styles.info}>
        <div className={styles.titleBlock}>
          <span className={styles.title}>{p.title}</span>
          {showRating && p.rating > 0 && (
            <span className={styles.rating}>
              <span className={styles.star}>
                <img src={star} alt="" />
              </span>
              {p.rating.toFixed(1)}
            </span>
          )}
        </div>
        <div className={styles.priceBlock}>
          <span className={styles.priceRow}>
            <span className={styles.price}>{`${currency}${formatPrice(p.price)}`}</span>
            {p.was && p.was > p.price ? <span className={styles.was}>{formatPrice(p.was)}</span> : null}
            {pct > 0 ? <span className={styles.pct}>{`${pct}%`}</span> : null}
          </span>
          {deliveryNote && (
            <span className={styles.delivery}>
              <img src={truck} alt="" />
              {deliveryNote}
            </span>
          )}
        </div>
        {pill && <img src={pill === 'expressToday' ? pillExpressToday : pillExpress} alt={pill === 'expressToday' ? 'express Today' : 'express'} className={styles.pill} />}
      </div>
    </motion.article>
  );
}
