import { motion } from 'motion/react';
import { cardsIcons, cardsImages, t } from '../data';
import { PaymentScreenHeader } from './Headers';
import { PaymentButtonV2 } from './primitives';
import { duration, easing } from '../../../motion/presets';
import s from './components.module.css';

/** components/PaymentEmptyCardsScreen — rendered by the list's FeedbackView when `cards.length === 0`. */
export function EmptyCards({ onBack, onAddCard }: { onBack: () => void; onAddCard: () => void }) {
  return (
    <motion.div className={s.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: duration.medium, ease: easing.out }}>
      <div className={s.emptyHeader}>
        <PaymentScreenHeader onBack={onBack} />
      </div>
      <div className={s.emptyContent}>
        <img className={s.emptyImage} src={cardsImages.emptyCards} alt="" />
        <div className={s.emptyTexts}>
          <span className={s.emptyTitle}>{t.noCardsTitle}</span>
          <span className={s.emptyMessage}>{t.noCardsMessage}</span>
        </div>
        <div className={s.emptyButton}>
          <PaymentButtonV2 icon={cardsIcons.plus} title={t.addCard} size="md" onPress={onAddCard} data-testid="empty-add-card" />
        </div>
      </div>
    </motion.div>
  );
}
