import { motion } from 'motion/react';
import { useDemoStore } from '../../kit/DemoStore';
import { useNav } from '../../kit/Navigator';
import { Icon } from '../Icon/Icon';
import { ref } from '../../foundations/tokens';
import { LikeHeart } from './LikeHeart';

/**
 * NoonFavourite: heart in a white 70% circle. Favouriting plays the like Lottie from its first frame; un-favouriting
 * (or reduced motion) jumps straight to the resting frame (`LikeHeart`).
 */
export function WishlistHeart({ productId, size = 24, box: boxSize, variant = 'card', toast = true }: { productId: string; size?: number; /** circle diameter (card default `size + 4`); bappzaar NoonFavourite wrapper is 24 */ box?: number; variant?: 'card' | 'button'; toast?: boolean }) {
  const { isWishlisted, toggleWishlist } = useDemoStore();
  const nav = useNav();
  const on = isWishlisted(productId);
  const box = variant === 'button' ? 40 : (boxSize ?? size + 4);
  const heartSize = variant === 'button' ? 20 : size - 6;
  return (
    <motion.button
      type="button"
      aria-label={on ? 'Remove from wishlist' : 'Add to wishlist'}
      onClick={(e) => {
        e.stopPropagation();
        const added = toggleWishlist(productId);
        if (toast) nav.toast(added ? 'Added to Wishlist' : 'Removed from Wishlist', { icon: <Icon name="heart" size={18} fill={added ? ref.color('textInverse') : 'none'} /> });
      }}
      whileTap={{ scale: 0.85 }}
      style={{
        position: 'relative',
        width: box,
        height: box,
        borderRadius: '50%',
        border: variant === 'button' ? `1px solid ${ref.color('borderSubtle')}` : 0,
        background: variant === 'button' ? ref.palette('whiteAlpha60') : ref.palette('whiteAlpha70'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <LikeHeart on={on} size={heartSize} />
    </motion.button>
  );
}
