import { animate, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Screen } from '../../components';
import { useIsTop, useNav } from '../../kit/Navigator';
import { useTabBarScrollHide } from '../../kit/tabBarScroll';
import type { ScreenProps } from '../../kit/types';
import { categoryPath, isInCategory } from '../../data';
import { fbtFor, productById, products, type Product } from '../../data';
import type { VariantSelection } from './components/Variants';
import { SfAdditionalInfo } from './components/storefront/SfAdditionalInfo';
import { SfAtcBar } from './components/storefront/SfAtcBar';
import { SfBundleCard } from './components/storefront/SfBundleCard';
import { SfBestsellerRow } from './components/storefront/SfBestsellerRow';
import { SfDeliveryCard, deliveryVariants, type DeliveryVariant } from './components/storefront/SfDeliveryCard';
import { SfExtendedWarranty } from './components/storefront/SfExtendedWarranty';
import { SfFbtCard } from './components/storefront/SfFbtCard';
import { SfFreeGifts } from './components/storefront/SfFreeGifts';
import { SfGallery } from './components/storefront/SfGallery';
import { SfHeader } from './components/storefront/SfHeader';
import { SfMainInfo } from './components/storefront/SfMainInfo';
import { SfNewerModelCard } from './components/storefront/SfNewerModelCard';
import { SfPaymentOffers } from './components/storefront/SfPaymentOffers';
import { SfProductDetails } from './components/storefront/SfProductDetails';
import { SfProductFeatures } from './components/storefront/SfProductFeatures';
import { SfRecommendations } from './components/storefront/SfRecommendations';
import { SfReviewsCard } from './components/storefront/SfReviewsCard';
import { SfSellerCard } from './components/storefront/SfSellerCard';
import { SfSponsoredBrandCard } from './components/storefront/SfSponsoredBrandCard';
import { SfSponsoredRow } from './components/storefront/SfSponsoredRow';
import { SfTrustCard } from './components/storefront/SfTrustCard';
import { SfVariantsCard } from './components/storefront/SfVariantsCard';
import { copy, pdpContent, type PdpContent } from './data';
import { freebiesFor } from './data.npB';
import { railCopy } from './data.npE';
import { pdpTokens } from './tokens';
import styles from './pdp.module.css';

/**
 * Product detail page — New PDP (Figma Af34gfmhQ1D0wstXUEHSIF · 64:5571), built on the Storefront PDP
 * (2ldJbjmQq4RkhnrNFCfXQB · 3499:75115, in stock), over the
 * NoonProductDetails (bappzaar master) behaviour: same data, sheets, variant switching in place (first in-stock size
 * preselected, options refetch under a loader), add to cart → `pdp/added`, wishlist / share, accordions, reviews. Section order follows New PDP (All flows
 * Af34gfmhQ1D0wstXUEHSIF · 64:5571): gallery → main info → bundle → sponsored row → delivery → newer model → free gifts →
 * variants → payment offers → trust markers → product overview → additional information → bestseller → seller →
 * A+ features → sponsored brand → extended warranty → FBT → reviews → "More from {brand}" / "Customers Also Viewed"
 * (full-bleed) → "Products related to this"; footer = QTY + Buy now + Add to cart over the tab bar.
 * The header fades to white after 100px. Components: src/flows/pdp/components/storefront (FIGMA-MAPPING.md).
 */
/** NoonProductDetails.scrollAfterAccordionOpen: current offset + 120 over 150ms (Animated.timing default ease). */
const ACCORDION_SCROLL = { by: 120, ms: 150 };
function scrollBy(el: HTMLDivElement | null, { by, ms }: typeof ACCORDION_SCROLL) {
  if (!el) return;
  const from = el.scrollTop;
  const to = Math.min(from + by, el.scrollHeight - el.clientHeight);
  animate(from, to, { duration: ms / 1000, ease: 'easeInOut', onUpdate: (v) => (el.scrollTop = v) });
}

/** Mock CatalogService.getProductBySKU latency for an option tap (the options loader shows meanwhile). */
const OPTION_RELOAD_MS = 600;
/** below-the-fold sections join once the push has fully settled (armed after 2 frames + the 420ms iOS push + its tail) + an idle slot */
const BELOW_FOLD_AFTER_MS = 640;

/** NoonProductUtil.getVariant: keep the previously selected size when the new SKU has it, else the first in stock. */
function initialSelection(content: PdpContent, prev?: { name?: string }): VariantSelection {
  const sizes = content.sizes?.options ?? [];
  const keep = prev?.name ? sizes.findIndex((o) => o.name === prev.name && o.available) : -1;
  const first = sizes.findIndex((o) => o.available);
  return keep >= 0 ? { size: keep } : first >= 0 ? { size: first } : {};
}

export function DetailScreen({ params }: ScreenProps<{ productId: string; delivery?: DeliveryVariant }>) {
  const nav = useNav();
  // bappzaar onSelectOption refetches the SKU and updates this same page in place (no navigation, scroll kept)
  const [productId, setProductId] = useState(params.productId);
  useEffect(() => setProductId(params.productId), [params.productId]);
  const product = productById(productId);
  const content = useMemo(() => pdpContent(product), [product]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  // First screen only (gallery, main info, bundle, sponsored row, delivery) mounts with the push; the ~20 sections below
  // the fold join in an idle slot once the slide has settled (mounting them all in the tap frame stalled ~200ms, so the
  // push's first visible frame was already half way in). Jumping to reviews mounts them at once.
  const [full, setFull] = useState(false);
  useEffect(() => {
    if (full) return;
    let idle = 0;
    const t = window.setTimeout(() => {
      idle = window.requestIdleCallback ? window.requestIdleCallback(() => setFull(true), { timeout: 400 }) : window.setTimeout(() => setFull(true), 16);
    }, BELOW_FOLD_AFTER_MS);
    return () => {
      window.clearTimeout(t);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [full]);
  const toReviews = () => {
    if (!full) setFull(true);
    requestAnimationFrame(() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const { scrollY } = useScroll({ container: scrollRef });
  const [solid, setSolid] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [selection, setSelection] = useState<VariantSelection>(() => initialSelection(content));
  const [optionsLoading, setOptionsLoading] = useState(false);
  // BottomTabScrollVisibilityProvider (NoonProductDetails onScroll / onScrollEndDrag): the tab bar hides on scroll down
  // and the sticky bar follows it down
  const isTop = useIsTop();
  const tabs = useTabBarScrollHide(scrollRef, isTop);
  // In-place SKU switch keeps the variant picker where the finger is: the sections above it differ in height between
  // SKUs (bundle, sponsored, delivery, gifts), so the page would otherwise jump. Record its screen top before the
  // switch and correct the scroll after the new SKU has laid out (RN keeps the tapped row in view the same way).
  const variantsRef = useRef<HTMLDivElement>(null);
  const anchorTop = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = variantsRef.current;
    const scroller = scrollRef.current;
    if (anchorTop.current == null || !el || !scroller) return;
    const delta = el.getBoundingClientRect().top - anchorTop.current;
    anchorTop.current = null;
    if (!delta) return;
    scroller.scrollTop += delta;
    tabs.rebase(scroller.scrollTop); // not a user scroll: the tab bar / sticky bar stay as they are
  }, [productId]);
  const reloadTimer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(reloadTimer.current), []);

  // NoonNativeStickyBar (QTY · Buy now · Add to cart) floats over the list; measured for the list's bottom padding
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerH, setFooterH] = useState(0);
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFooterH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useMotionValueEvent(scrollY, 'change', (v) => {
    setSolid(v > pdpTokens.headerChangeAfter - pdpTokens.headerInnerHeight);
    setShowTop(v > pdpTokens.backToTopAfter);
  });

  const { sameBrand, others } = recommendations(product);
  // The selected SKU's own price (an option with a price is its own SKU in master, so the price block follows it)
  const shown = useMemo(() => {
    for (const g of content.groups) {
      const o = g.options[g.selected ?? selection[g.name] ?? 0];
      if (!o?.productId && o?.salePrice != null) return { ...product, price: o.salePrice, was: o.price && o.price > o.salePrice ? o.price : undefined };
    }
    return product;
  }, [content, product, selection]);
  const related = [...others, ...sameBrand].filter((p) => p.category === product.category).slice(0, 12);

  return (
    <Screen
      ref={scrollRef}
      header={<SfHeader product={product} solid={solid} />}
      overlayHeader
      background={solid ? 'bgSurface' : 'bgPage'}
      safeTop={false}
      // ScreenView bottomOffset: the list scrolls under the floating sticky bar
      contentStyle={{ paddingBottom: footerH }}
      onScroll={tabs.onScroll}
      overlay={
        <motion.div ref={footerRef} className={styles.stickyBar} style={{ '--pdp-tab-hide': tabs.tabHide } as never}>
          <SfAtcBar
            product={product}
            showBackToTop={showTop}
            onBackToTop={() => {
              tabs.reveal();
              scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </motion.div>
      }
    >
      <div className={styles.list}>
        <SfGallery product={product} scrollY={scrollY} />
        {/* bottomWrapper (marginTop −20) + galleryBottomBackground: the page slides up over the pinned gallery as one
            opaque sheet from the gallery's bottom edge, so the image never shows between the cards */}
        <div className={styles.rest}>
          <SfMainInfo product={shown} content={content} onReviews={toReviews} />
          <SfBundleCard product={product} content={content} />
          <SfSponsoredRow product={product} content={content} />
          <SfDeliveryCard content={content} variant={deliveryVariants.includes(params.delivery as DeliveryVariant) ? params.delivery : undefined} />
          {full && (
            <>
              <SfNewerModelCard product={product} />
              <SfFreeGifts items={freebiesFor(product)} />
              <div ref={variantsRef}>
                <SfVariantsCard
                  product={product}
                  content={content}
                  selection={selection}
                  loading={optionsLoading}
                  onSelect={(g, i) => {
                    // NoonSizeVariantSelection → onSelectVariant: local switch, no fetch
                    if (g === 'size') return setSelection((s) => ({ ...s, size: i }));
                    // NoonOptionsSelection → onSelectOption: fetch the option's SKU (loader over the options), then update in place
                    if (optionsLoading) return;
                    const opt = content.groups.find((x) => x.name === g)?.options[i];
                    const prevSize = selection.size != null ? content.sizes?.options[selection.size] : undefined;
                    setOptionsLoading(true);
                    reloadTimer.current = window.setTimeout(() => {
                      setOptionsLoading(false);
                      if (opt?.productId && opt.productId !== product.id) {
                        anchorTop.current = variantsRef.current?.getBoundingClientRect().top ?? null;
                        setProductId(opt.productId);
                        setSelection(initialSelection(pdpContent(productById(opt.productId)), prevSize));
                      } else setSelection((s) => ({ ...s, [g]: i }));
                    }, OPTION_RELOAD_MS);
                  }}
                  onSizeGuide={() => nav.toast(copy.sizeGuide)}
                  onLearnMore={() => nav.toast(copy.learnMore)}
                />
              </div>
              <SfPaymentOffers content={content} />
              <SfTrustCard content={content} />
              <SfProductDetails content={content} product={product} onAccordionOpen={() => scrollBy(scrollRef.current, ACCORDION_SCROLL)} />
              <SfAdditionalInfo content={content} />
              <SfBestsellerRow content={content} />
              <SfSellerCard content={content} onOffers={() => nav.toast(copy.moreOffers)} />
              <SfProductFeatures content={content} product={product} />
              <SfSponsoredBrandCard product={product} />
              <SfExtendedWarranty content={content} price={product.price} />
              <SfFbtCard key={product.id} ids={content.fbt} />
              <div ref={reviewsRef}>
                <SfReviewsCard product={product} content={content} />
              </div>
              <SfRecommendations variant="bleed" title={copy.moreFrom(product.brand)} items={sameBrand.slice(0, 12)} sponsored />
              <SfRecommendations variant="bleed" title={copy.customersAlsoViewed} items={others.slice(0, 8)} sponsored />
              <SfRecommendations title={railCopy.relatedSponsored} items={related.length ? related : others.slice(8, 20)} sponsored />
            </>
          )}
        </div>
      </div>
    </Screen>
  );
}

/**
 * Carousels. Live products (product.sku): "More from {brand}" = live products of the same brand (pdp/carousels
 * same_brand, live order, FBT accessories excluded); "Customers Also Viewed" = other brands in the same level-2
 * category (Mobiles & Accessories → smartphones + cases, like other_brands). Mock products keep brand/category matching.
 */
function recommendations(product: Product) {
  const fbt = new Set(Object.values(fbtFor).flat());
  if (product.sku) {
    const live = products.filter((p) => p.sku && p.id !== product.id && !fbt.has(p.id));
    const branch = categoryPath(product.categoryId)[1]?.id;
    return {
      sameBrand: live.filter((p) => p.brand === product.brand),
      others: live.filter((p) => p.brand !== product.brand && (!branch || isInCategory(p.categoryId, branch))),
    };
  }
  const sameBrand = products.filter((p) => !p.sku && p.id !== product.id && (p.brand === product.brand || p.category === product.category));
  return { sameBrand, others: products.filter((p) => !p.sku && p.id !== product.id && !sameBrand.includes(p)) };
}
