import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Button, DashedDivider, Header, Icon, ProductImage, Pressable, Screen } from '../../components';
import { useNav } from '../../kit/Navigator';
import { currency, formatPrice } from '../../data';
import { cancelReasons, orderById } from './data';
import styles from './orders.module.css';
import { ref } from '../../foundations/tokens';
import { duration, easing, handoff } from '../../motion/presets';

/** O2DOrderCancelItemsScreen — checkbox cards that expand a reason picker; footer with refund banner. */
export function OrderCancelScreen({ params }: { params: { orderId?: string } }) {
  const nav = useNav();
  const order = orderById(params.orderId);
  const [selected, setSelected] = useState<Record<string, string | null>>({});
  const [showErrors, setShowErrors] = useState(false);
  const ids = Object.keys(selected);
  const refund = order.items.filter((i) => ids.includes(i.product.id)).reduce((n, i) => n + i.price * i.qty, 0);
  const missingReason = ids.some((id) => !selected[id]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = { ...s };
      if (id in n) delete n[id];
      else n[id] = null;
      return n;
    });

  const confirm = (all?: boolean) => {
    if (!all && missingReason) return setShowErrors(true);
    nav.toast(all ? 'All items cancelled' : `${ids.length} item${ids.length > 1 ? 's' : ''} cancelled`, { tone: 'success', icon: <Icon name="checkCircle" size={18} /> });
    nav.back();
  };

  return (
    <Screen
      background="bgSubtle"
      header={<Header title="Select items to cancel" variant="transparent" />}
      footer={
      <div className={styles.cancelFooter}>
        <AnimatePresence>
          {refund > 0 && (
            <motion.div className={styles.refundBanner} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
              <b>
                {currency} {formatPrice(refund)} refund
              </b>{' '}
              will be initiated to <span style={{ color: ref.color('textPrimary'), fontWeight: 600 }}>{order.paidWith}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className={styles.cancelBtns}>
          <Button variant="secondary" size="lg" style={{ flex: 1 }} onClick={() => confirm(true)}>
            Cancel all items
          </Button>
          <Button variant="checkout" size="lg" style={{ flex: 1 }} disabled={!ids.length} onClick={() => confirm()}>
            Cancel selected{ids.length ? ` (${ids.length})` : ''}
          </Button>
        </div>
      </div>
      }
      contentStyle={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 15px 24px' }}
    >
        {order.items.map((it) => {
          const on = it.product.id in selected;
          const reason = selected[it.product.id];
          const err = showErrors && on && !reason;
          return (
            <motion.div key={it.product.id} layout className={styles.cancelCard} style={{ outline: err ? `1px solid ${ref.color('danger')}` : undefined }}>
              <div className={styles.cancelRow} onClick={() => toggle(it.product.id)}>
                <ProductImage product={it.product} width={64} height={64} radius={8} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.cancelTitle}>{it.product.title}</div>
                  <div className={styles.cancelPrice}>
                    {currency} {formatPrice(it.price)}
                  </div>
                </div>
                <motion.span className={styles.checkbox} data-on={on || undefined} animate={{ scale: on ? [1, 1.15, 1] : 1 }} transition={{ duration: duration.medium, ease: easing.inOut }}>
                  {on && <Icon name="check" size={16} strokeWidth={3} />}
                </motion.span>
              </div>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={handoff.spring} style={{ overflow: 'hidden' }}>
                    <DashedDivider color={ref.color('border')} inset={0} margin="12px 0 0" />
                    <div className={styles.reasonHead}>
                      <span>
                        Why do you want to cancel this item? <span style={{ color: ref.color('danger') }}>*</span>
                      </span>
                      {!reason && <span className={styles.req}>Required</span>}
                    </div>
                    {cancelReasons.map((r) => (
                      <Pressable key={r} className={styles.reason} data-on={reason === r || undefined} scale={0.99} onClick={() => setSelected((s) => ({ ...s, [it.product.id]: r }))}>
                        <span className={styles.radio} data-on={reason === r || undefined} />
                        {r}
                      </Pressable>
                    ))}
                    {reason === 'Other' && <textarea className={styles.comment} placeholder="Tell us more (optional)" />}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
    </Screen>
  );
}
