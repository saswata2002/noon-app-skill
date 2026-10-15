import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import errorImage from '@assets/checkout/rewards-installation-slots-error.webp';
import { Button, DashedDivider, ProductImage, Spinner } from '../../components';
import { useNav } from '../../kit/Navigator';
import type { ScreenProps } from '../../kit/types';
import { RetryIcon } from './components/RewardsPrimitives';
import { defaultInstallationSlotId, findInstallationSlot, installationSlots, rt, type InstallationSlot } from './data.rewards';
import { checkoutStore, useCheckout } from './store';
import { useCheckoutTotals } from './totals';
import { duration, easing, handoff } from '../../motion/presets';
import styles from './installation.module.css';

export interface InstallationParams {
  shipmentId?: string;
  /** demo: getShipmentInstallationSlots fails → error card with Retry */
  fail?: boolean;
}

const CELL = 36;
const CELL_GAP = 8;
const FETCH_DELAY = 600;

interface Day {
  isoDate: string;
  weekdayInitial: string;
  dayOfMonthLabel: string;
  monthName: string;
  hasSlots: boolean;
}

/** NoonCheckoutInstallationUtils.buildCalendarDaysStrip */
function buildDays(): Day[] {
  const start = new Date(`${installationSlots.startDate}T00:00:00`);
  const end = new Date(`${installationSlots.endDate}T00:00:00`);
  const days: Day[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({
      isoDate,
      weekdayInitial: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
      dayOfMonthLabel: String(d.getDate()),
      monthName: d.toLocaleDateString('en-US', { month: 'long' }),
      hasSlots: (installationSlots.availableSlots[isoDate] ?? []).length > 0,
    });
  }
  return days;
}

/**
 * NoonCheckoutInstallationOverlayScreen (floating overlay, antiFlashWhite): "Select a slot", the item row,
 * schedule card with the month title, horizontally scrolling day strip (edge gradients fade in with scroll,
 * days without slots at 32%), dashed divider and time-slot pills; "Schedule" applies the slot.
 */
export function InstallationOverlayScreen({ params }: ScreenProps<InstallationParams>) {
  const nav = useNav();
  const { shipments } = useCheckoutTotals();
  const shipment = shipments.find((s) => s.id === params.shipmentId) ?? shipments[0];
  const line = shipment?.lines[0];
  const shipmentId = shipment?.id ?? params.shipmentId ?? 'shp-1';
  const currentSlotId = useCheckout((s) => s.slotByShipment[shipmentId]) ?? defaultInstallationSlotId;

  const days = useMemo(buildDays, []);
  const initial = findInstallationSlot(currentSlotId);
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [selected, setSelected] = useState<{ isoDate: string; slotId: number | null }>({
    isoDate: initial?.isoDate ?? days.find((d) => d.hasSlots)?.isoDate ?? days[0]?.isoDate ?? '',
    slotId: initial?.slotId ?? null,
  });
  const [fade, setFade] = useState({ start: 0, end: 1 });
  const stripRef = useRef<HTMLDivElement>(null);
  const failOnce = useRef(!!params.fail);

  const fetchSlots = (reloading = false) => {
    if (reloading) setIsReloading(true);
    else setIsLoading(true);
    setIsError(false);
    const id = setTimeout(() => {
      setIsLoading(false);
      setIsReloading(false);
      if (failOnce.current) {
        failOnce.current = false;
        setIsError(true);
      }
    }, FETCH_DELAY);
    return () => clearTimeout(id);
  };
  useEffect(() => fetchSlots(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // scroll the selected day into view (index - 3)
  useEffect(() => {
    if (isLoading || isError) return;
    const idx = days.findIndex((d) => d.isoDate === selected.isoDate);
    if (idx >= 3) stripRef.current?.scrollTo({ left: (idx - 3) * (CELL + CELL_GAP), behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isError]);

  const onStripScroll = () => {
    const el = stripRef.current;
    if (!el) return;
    const fromEnd = el.scrollWidth - (el.clientWidth + el.scrollLeft);
    setFade({ start: Math.min(1, Math.max(0, el.scrollLeft / 20)), end: el.scrollWidth <= el.clientWidth ? 0 : Math.min(1, Math.max(0, fromEnd / 20)) });
  };
  useEffect(onStripScroll, [isLoading, isError]);

  const slots: InstallationSlot[] = installationSlots.availableSlots[selected.isoDate] ?? [];
  const selectedDay = days.find((d) => d.isoDate === selected.isoDate) ?? days[0];
  const title = selectedDay ? `${selectedDay.monthName} ${selectedDay.isoDate.slice(0, 4)}` : '';
  const ctaDisabled = !selected.isoDate || selected.slotId == null;

  const onSchedule = () => {
    if (ctaDisabled) return;
    nav.back();
    if (selected.slotId === currentSlotId) return;
    const slotId = selected.slotId!;
    checkoutStore
      .update((s) => ({ slotByShipment: { ...s.slotByShipment, [shipmentId]: slotId } }))
      .then(() => nav.toast(rt.noon_checkout_installation_updated_toast_message));
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner color="var(--nk-color-link)" size={24} />
      </div>
    );
  }

  return (
    <div className={`${styles.container} nk-content-in`}>
      <span className={styles.title}>{rt.noon_checkout_installation_select_slot}</span>
      {line && (
        <div className={styles.item}>
          <span className={styles.itemImage}>
            <ProductImage product={line.product} width={34} height={44} radius={8} emojiScale={0.55} />
            <span className={styles.itemOverlay} />
          </span>
          <span className={styles.itemName}>{line.product.title}</span>
        </div>
      )}

      {isError || isReloading ? (
        <div className={styles.card}>
          <img src={errorImage} width={120} height={76} alt="" className={styles.errorImage} />
          <span className={styles.errorText}>{rt.noon_checkout_installation_error}</span>
          <button type="button" className={styles.retry} onClick={() => fetchSlots(true)}>
            <span className={styles.retryText}>{rt.noon_retry}</span>
            <RetryIcon color="var(--nk-color-brand-blue)" />
          </button>
        </div>
      ) : (
        <div className={styles.card}>
          <span className={styles.stripTitle}>{title}</span>
          <div className={styles.stripContainer}>
            <span className={`${styles.stripFade} ${styles.stripFadeStart}`} style={{ opacity: fade.start }} />
            <div ref={stripRef} className={styles.strip} onScroll={onStripScroll}>
              {days.map((d) => {
                const isSelected = d.isoDate === selected.isoDate;
                return (
                  <button
                    key={d.isoDate}
                    type="button"
                    className={`${styles.day} ${isSelected ? styles.daySelected : ''}`}
                    onClick={() => d.hasSlots && !isSelected && setSelected({ isoDate: d.isoDate, slotId: null })}
                  >
                    <span className={`${styles.dayWrapper} ${!isSelected && !d.hasSlots ? styles.dayFaded : ''}`}>
                      <span className={`${styles.dayText} ${isSelected ? styles.dayTextSelected : ''}`}>{d.weekdayInitial}</span>
                      <span className={`${styles.dayText} ${isSelected ? styles.dayTextSelected : ''}`}>{d.dayOfMonthLabel}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <span className={`${styles.stripFade} ${styles.stripFadeEnd}`} style={{ opacity: fade.end }} />
          </div>
          <DashedDivider color="var(--nk-palette-bright-grey-color)" inset={12} margin="16px 0 0" dash={3} />
          {slots.length > 0 && (
            <motion.div key={selected.isoDate} className={styles.slots} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ y: handoff.spring, opacity: { duration: duration.fast, ease: easing.out } }}>
              {slots.map((slot) => {
                const isSel = slot.slotId === selected.slotId;
                return (
                  <motion.button
                    key={slot.slotId}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    className={`${styles.slot} ${isSel ? styles.slotSelected : ''}`}
                    onClick={() => !isSel && setSelected((s) => ({ ...s, slotId: slot.slotId }))}
                  >
                    <span className={`${styles.slotLabel} ${isSel ? styles.slotLabelSelected : ''}`}>{slot.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </div>
      )}

      {!(isError || isReloading) && (
        <Button variant="noon" className={styles.cta} disabled={ctaDisabled} whileTap={{ scale: 0.98 }} transition={undefined} onClick={onSchedule}>
          {rt.noon_checkout_installation_schedule_cta}
        </Button>
      )}
      {isReloading && (
        <div className={styles.reloading}>
          <Spinner color="var(--nk-color-link)" size={24} />
        </div>
      )}
    </div>
  );
}
