import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Lottie, Screen } from '../../components';
import { useNav } from '../../kit/Navigator';
import type { ScreenProps } from '../../kit/types';
import { PaymentScreenHeader } from './components/Headers';
import { cardsImages, t } from './data';
import { useCards } from './store';
import { cardsMetrics } from './tokens';
import { formatIssuerName, formatMasked } from './utils';
import { duration, easing } from '../../motion/presets';
import s from './success.module.css';

/* screens/PaymentCardAdditionSuccessScreen/styles.ts → lottieLayout() for the 390 × 844 device */
const LOTTIE_W = 1125;
const LOTTIE_H = 2436;
const scale = Math.max(cardsMetrics.contentWidth / LOTTIE_W, 844 / LOTTIE_H);
const slotW = LOTTIE_W * scale * 0.735;
const layout = { width: LOTTIE_W * scale, height: LOTTIE_H * scale, slotW, slotH: slotW / cardsMetrics.cardAspect };

/**
 * screens/PaymentCardAdditionSuccessScreen — save_card "reveal" lottie with the card skin, swapped for the
 * card art + masked number at 1880ms; pops back to the list when the lottie finishes.
 */
export function AddCardSuccessScreen({ params }: ScreenProps<{ cardId?: string }>) {
  const nav = useNav();
  const cards = useCards();
  const card = cards.find((c) => c.id === params.cardId) ?? cards[0];
  const [showCardArt, setShowCardArt] = useState(false);
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    if (nav.canGoBack) nav.back();
    else nav.reset('cards/cards');
  }, [nav]);

  useEffect(() => {
    const id = setTimeout(() => setShowCardArt(true), 1880);
    return () => clearTimeout(id);
  }, []);

  const masked = card ? formatMasked(card.ccMasked) : '';
  return (
    <Screen background="bgSurface" safeTop={false} overlayHeader contentStyle={{ paddingBottom: 0, overflow: 'hidden' }}>
      <div className={s.root}>
        <div className={s.gradient} />
        <PaymentScreenHeader onBack={finish} />
        <div className={s.content}>
          <div className={s.cardWrap} style={{ width: layout.slotW, height: layout.slotH }}>
            <motion.div className={s.cardFill} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: duration.slower, ease: easing.out }}>
              <img className={s.cardImage} src={showCardArt ? (card?.cardArt?.url ?? cardsImages.defaultCard) : cardsImages.cardSkin} alt="" draggable={false} />
            </motion.div>
            {showCardArt && card && (
              <>
                <div className={s.cardTitle}>
                  <span className={s.cardTitleText}>{card.isDefault ? `${t.default}  |  ${masked}` : masked}</span>
                </div>
                {card.cardArt?.isDefault && card.cardIssuerName && <span className={s.cardIssuer}>{formatIssuerName(card.cardIssuerName)}</span>}
              </>
            )}
          </div>
          <Lottie src={cardsImages.saveCardLottie} loop={false} autoplay style={{ position: 'absolute', width: layout.width, height: layout.height, pointerEvents: 'none' }} onComplete={finish} />
        </div>
      </div>
    </Screen>
  );
}
