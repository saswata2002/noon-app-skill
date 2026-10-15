import { LayoutGroup, motion } from 'motion/react';
import { Fragment } from 'react';
import { HtmlText, type HtmlStylesheet } from '../../../components';
import section from './section.module.css';
import { duration, easing, handoff } from '../../../motion/presets';
import styles from './DynamicInvoice.module.css';

/** NoonDynamicInvoiceType (subset used by checkout) */
export interface InvoiceEntry {
  title: string;
  amount: string;
  subtitle?: string;
}
export interface InvoiceSection {
  title?: string;
  entries: InvoiceEntry[];
  isSpecial?: boolean;
}

const invoiceText: HtmlStylesheet = {
  p: { fontSize: 'var(--nk-font-size-body-medium)', lineHeight: '20px', color: 'var(--nk-color-chk-invoice-text)' },
  highlight: { color: 'var(--nk-color-chk-invoice-highlight)', fontWeight: 'var(--nk-font-weight-bold)' },
  h4: { color: 'var(--nk-color-text-strong)', fontSize: 'var(--nk-font-size-title-small)', lineHeight: '24px' },
  steel: { color: 'var(--nk-color-chk-invoice-text)' },
};
/** no h4 in master's amount sheet → HtmlView base h4 (fontSize 18) inherits p's charcoalNavy / 500; `<b>` in the copy makes it bold */
const invoiceAmount: HtmlStylesheet = {
  p: { fontSize: 'var(--nk-font-size-body-medium)', lineHeight: '20px', color: 'var(--nk-color-text-strong)', fontWeight: 'var(--nk-font-weight-medium)' },
  highlight: { color: 'var(--nk-color-chk-invoice-highlight)', fontWeight: 'var(--nk-font-weight-bold)' },
  h4: { fontSize: 'var(--nk-font-size-title-small)', lineHeight: '24px' },
  steel: { color: 'var(--nk-color-chk-invoice-steel)' },
};
/** p sets only the colour; size/weight come from the server markup (`<h4><b>…</b></h4>`) */
const invoiceTitle: HtmlStylesheet = {
  p: { color: 'var(--nk-color-text-primary)', fontSize: 'var(--nk-font-size-body-compact)' },
  h4: { fontSize: 'var(--nk-font-size-title-small)', lineHeight: '24px' },
  highlight: { color: 'var(--nk-color-chk-invoice-highlight)', fontWeight: 'var(--nk-font-weight-bold)' },
  steel: { color: 'var(--nk-color-chk-invoice-steel)' },
};
const invoiceSubtitle: HtmlStylesheet = {
  p: { fontSize: 'var(--nk-font-size-caption)', lineHeight: '14px', color: 'var(--nk-color-chk-invoice-text)' },
  highlight: { color: 'var(--nk-color-chk-invoice-highlight)' },
};

const layout = handoff.spring; // LinearTransition.duration(300) → Test01 movement spring
const entryFade = { ...handoff.spring, opacity: { duration: duration.medium, ease: easing.out } };

/**
 * NoonDynamicInvoice in the checkout "invoice" section: white r16 card (sectionsContainer), paddingVertical 16,
 * sections with 15 margin, entries 15px slate600 / amounts 15/500 charcoalNavy, dashed #D0D4DD separators,
 * special (savings) sections on $emerald100 under the white wave. Height animates (300ms) as rows come and go.
 */
export function DynamicInvoice({ sections }: { sections: InvoiceSection[] }) {
  const normal = sections.filter((s) => !s.isSpecial);
  const special = sections.filter((s) => s.isSpecial);

  const renderSection = (s: InvoiceSection, i: number, count: number) => (
    <motion.div key={`${s.title ?? ''}-${i}`} layout="position" transition={layout} className={styles.sectionWrapper}>
      <div className={styles.section} data-first={i === 0 || undefined} data-last={i === count - 1 || undefined}>
        {s.title && (
          <div className={styles.sectionHeader}>
            <HtmlText value={s.title} stylesheet={invoiceTitle} />
          </div>
        )}
        {s.entries.map((e, j) => (
          <motion.div key={e.title} layout="position" transition={entryFade} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.entry} data-first={j === 0 || undefined}>
            <div className={styles.entryRow}>
              <span className={styles.entryLeft}>
                <HtmlText value={e.title} stylesheet={invoiceText} />
              </span>
              <span className={styles.entryRight}>
                <HtmlText value={e.amount} stylesheet={invoiceAmount} />
              </span>
            </div>
            {e.subtitle && <HtmlText value={e.subtitle} stylesheet={invoiceSubtitle} className={styles.subtitle} />}
          </motion.div>
        ))}
      </div>
      {i < count - 1 && <div className={styles.dash} />}
    </motion.div>
  );

  return (
    <div className={`${section.section} ${styles.wrapper}`}>
      <LayoutGroup>
        <motion.div layout transition={layout} className={styles.card} data-special={special.length > 0 || undefined}>
          <div className={styles.invoiceContainer}>{normal.map((s, i) => renderSection(s, i, normal.length))}</div>
          {special.map((s, i) => (
            <Fragment key={`special-${i}`}>
              <div className={styles.special}>
                <div className={styles.wave} />
                {renderSection(s, 0, 1)}
              </div>
            </Fragment>
          ))}
        </motion.div>
      </LayoutGroup>
    </div>
  );
}
