import { motion } from 'motion/react';
import type { DynamicInvoiceSection } from '../invoice';
import { HtmlText } from '../../../components';
import { handoff } from '../../../motion/presets';
import html from './html.module.css';
import styles from './invoice.module.css';

/**
 * NoonDynamicInvoice: sections (paddingVertical 15, first has no top / last no bottom padding) split by a
 * 2px #D0D4DD 5/4 dashed line; entries are title (15 slate600) ↔ amount (15/500 charcoalNavy) rows 8px apart.
 * `isSpecial` sections sit on emerald100 under the scalloped NoonDynamicInvoiceWave. Layout animates on the Test01 spring.
 */
export function DynamicInvoice({ sections, part }: { sections: DynamicInvoiceSection[]; /** render only the white sections or only the green special one (the Cart-tab card animates them apart) */ part?: 'normal' | 'special' }) {
  const normal = part === 'special' ? [] : sections.filter((s) => !s.isSpecial);
  const special = part === 'normal' ? [] : sections.filter((s) => s.isSpecial);
  return (
    <div className={styles.container}>
      <motion.div layout transition={handoff.spring} className={styles.invoice}>
        {normal.length > 0 && (
        <div className={styles.invoiceContent}>
          {normal.map((s, i) => (
            <motion.div key={i} layout="position" className={styles.sectionWrapper} transition={handoff.spring}>
              <div className={styles.section}>
                {s.title && (
                  <div className={styles.sectionHeader}>
                    <HtmlText base value={s.title} className={html.invoiceTitle} />
                  </div>
                )}
                {s.entries.map((e, j) => (
                  <div key={e.title + j} className={styles.entry}>
                    <div className={styles.entryRow}>
                      <span className={styles.entryLeft}>
                        <HtmlText base value={e.title} className={html.invoiceText} />
                      </span>
                      <span className={styles.entryRight}>
                        <HtmlText base value={e.amount} className={html.invoiceAmount} />
                      </span>
                    </div>
                    {e.subtitle && <HtmlText base value={e.subtitle} className={`${html.invoiceSubtitle} ${styles.entrySubtitle}`} />}
                  </div>
                ))}
              </div>
              {i < normal.length - 1 && <div className={styles.dashed} />}
            </motion.div>
          ))}
        </div>
        )}
        {special.map((s, i) => (
          <div key={`sp${i}`} className={styles.special}>
            <div className={styles.wave} />
            <div className={styles.sectionWrapper}>
              <div className={styles.specialSection}>
                {s.entries.map((e, j) => (
                  <div key={j} className={styles.entryRow}>
                    <span className={styles.entryLeft}>
                      <HtmlText base value={e.title} className={html.invoiceText} />
                    </span>
                    {e.amount && <HtmlText base value={e.amount} className={html.invoiceAmount} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
