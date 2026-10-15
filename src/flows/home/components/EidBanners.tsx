import { useReduceMotion } from '../../../motion/reducedMotion';
import { useEffect, useRef, useState } from 'react';
import { Badge, OriginIcon, Pressable } from '../../../components';
import { ref as tok } from '../../../foundations/tokens';
import { useIsTop, useNav } from '../../../kit/Navigator';
import { currency, formatPrice } from '../../../data';
import { eidAdBanner, eidSlides, type EidSlide } from '../data.eid';
import { homeEidCarousel as C } from '../tokens.eid';
import styles from './EidBanners.module.css';

const adBadge = { bg: tok.palette('whiteAlpha80'), color: tok.color('textSecondary') };

/**
 * Hero Section Widgets carousel (Figma Af34gfmhQ1D0wstXUEHSIF · 89:34722 creatives), sized like bappzaar's
 * NoonDynamicCarouselModule with the live home CMS layout (numPerView 1.4, gap 15, ratio 150 → 263.67 × 395.67 r16
 * cards, 15 apart with a 15 gutter; the Figma's 220×330 / 12 was the hook's 1.7 default), each card snaps to the centre (`snapToOffsets`;
 * the first sits at the gutter), auto-advance every 3s while on screen, stopped for good by the first touch
 * (useNoonDynamicCarouselAutoScroll). No autoplay under reduced motion, nor while another screen covers home (it
 * restarts with a full interval on return, so it never slides during the transition back). Kinds: full-bleed hero creative (image or video,
 * "Ad" top-right, pause / play action bottom-left) and brand banner (header creative + product tiles).
 */
export function EidBanners() {
  const railRef = useRef<HTMLDivElement>(null);
  const [touched, setTouched] = useState(false);
  const reduced = useReduceMotion();
  const isTop = useIsTop();

  useEffect(() => {
    const el = railRef.current;
    if (!el || touched || reduced || !isTop || eidSlides.length < 2) return;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    const t = window.setInterval(() => {
      if (!visible) return;
      const cards = Array.from(el.children) as HTMLElement[];
      const centre = el.scrollLeft + el.clientWidth / 2;
      const current = cards.reduce((best, c, i) => (Math.abs(c.offsetLeft + c.offsetWidth / 2 - centre) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - centre) ? i : best), 0);
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      const next = atEnd ? 0 : (current + 1) % cards.length;
      const card = cards[next];
      el.scrollTo({ left: next === 0 ? 0 : card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2, behavior: 'smooth' });
    }, C.interval);
    return () => {
      window.clearInterval(t);
      io.disconnect();
    };
  }, [touched, reduced, isTop]);

  return (
    <div ref={railRef} className={`${styles.rail} nk-hscroll`} onPointerDown={() => setTouched(true)} onWheel={() => setTouched(true)} aria-label="Eid offers" role="region">
      {eidSlides.map((s) => (s.kind === 'hero' ? <HeroCard key={s.id} slide={s} /> : <BrandCard key={s.id} slide={s} />))}
    </div>
  );
}

/** I89:34732 — full-bleed creative; a video banner gets the "Video actions" pause / play pill (NoonDynamicCarouselMedia). */
function HeroCard({ slide: s }: { slide: Extract<EidSlide, { kind: 'hero' }> }) {
  const nav = useNav();
  const [paused, setPaused] = useState(false);
  return (
    <div className={styles.card} data-kind="hero">
      <Pressable className={styles.cover} scale={1} aria-label={s.alt} onClick={() => nav.push('plp/listing', { query: s.query })}>
        <img src={s.image} alt="" draggable={false} />
      </Pressable>
      {s.ad && (
        <Badge {...adBadge} style={{ position: 'absolute', right: 8, top: 8, font: tok.type('text10RegularLh11') }}>
          Ad
        </Badge>
      )}
      {s.video && (
        <Pressable className={styles.videoAction} scale={0.92} aria-label={paused ? 'Play video' : 'Pause video'} aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          <OriginIcon name={paused ? 'play-circle' : 'pause-circle'} size={20} color={tok.color('textInverse')} />
        </Pressable>
      )}
    </div>
  );
}

/** I89:34742 / I89:34751 — brand banner: header creative over 2 detailed tiles (one row) or 4 image-only tiles. */
function BrandCard({ slide: s }: { slide: Extract<EidSlide, { kind: 'brand' }> }) {
  const nav = useNav();
  // Figma crops are for the 204-wide slot of a 220 card; the live CMS card is wider (p8 each side), so scale them
  const k = (C.cardWidth - 16) / 204;
  const open = () => nav.push('plp/listing', { query: s.query });
  return (
    <article className={styles.card} data-kind="brand" data-tone={s.tone} aria-label={s.alt}>
      <Pressable className={styles.banner} scale={1} aria-label={s.alt} onClick={open}>
        <img src={s.banner.image} alt="" draggable={false} style={{ left: s.banner.left * k, top: s.banner.top * k, width: s.banner.width * k, height: s.banner.height * k }} />
      </Pressable>
      <div className={styles.tiles}>
        {s.tiles.map((t) => (
          <Pressable key={t.id} className={styles.tile} scale={1} aria-label={t.title ?? `${s.alt}, ${t.tag}`} onClick={open}>
            <span className={styles.tileImage}>
              <img src={t.image} alt="" draggable={false} />
              <span className={styles.notch} style={{ background: s.tagBg }}>
                {t.tag}
              </span>
            </span>
            {t.title && (
              <span className={styles.tileMeta}>
                <span className={styles.tileTitle}>{t.title}</span>
                {t.price !== undefined && (
                  <span className={styles.tilePrice}>
                    <b>
                      {currency} {formatPrice(t.price)}
                    </b>
                    {t.was !== undefined && t.was > t.price && <s>{formatPrice(t.was)}</s>}
                  </span>
                )}
              </span>
            )}
          </Pressable>
        ))}
      </div>
      {s.ad && (
        <Badge {...adBadge} style={{ position: 'absolute', right: 12, top: 12, font: tok.type('text10RegularLh11') }}>
          Ad
        </Badge>
      )}
    </article>
  );
}

/**
 * 89:34782 — full-width ad banner (bappzaar AdBannerModule → BannerModule): one creative at the CMS ratio, 351×88 r16
 * with a 12 gutter (Figma; bappzaar pads 15 and rounds 20). The Soundcore creative carries its own "Ad" mark.
 */
export function EidAdBanner() {
  const nav = useNav();
  const b = eidAdBanner;
  return (
    <div className={styles.adWrap}>
      <Pressable className={styles.ad} scale={1} aria-label={b.alt} onClick={() => nav.push('plp/listing', { query: b.query })}>
        <img src={b.image} alt="" draggable={false} style={b.crop} />
      </Pressable>
    </div>
  );
}
