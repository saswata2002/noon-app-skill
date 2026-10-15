import { animate, AnimatePresence, motion, useMotionValue } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Screen } from '../../components';
import { useNav } from '../../kit/Navigator';
import type { ScreenProps } from '../../kit/types';
import { AnimatedListCard, type AnimatedListCardHandle } from './components/AnimatedListCard';
import { CardActionsOverlay, type EditAction } from './components/ActionsOverlay';
import { SectionTitle } from './components/Bits';
import { EmptyCards } from './components/EmptyCards';
import { PaymentScrollableHeader } from './components/Headers';
import { cardsIcons, manyCards, t, type SavedCard } from './data';
import { API_DELAY, cardsStore, useCards } from './store';
import { cardsEasing, cardsMetrics, cardsTimings } from './tokens';
import { formatMasked } from './utils';
import { duration, easing, handoff } from '../../motion/presets';
import s from './cards.module.css';

const ms = (n: number) => n / 1000;
const H = cardsMetrics.cardHeight;
const BOTTOM_OFFSET = cardsMetrics.actionsOverlayHeight + cardsMetrics.overlayBottomSpacing + 24;
const HEADER_SCROLL_FINAL = cardsMetrics.headerContentHeight;

export interface CardsParams {
  /** demo deep links: open the actions overlay for a card once the shimmer settles */
  select?: 'first-non-default' | string;
  action?: EditAction;
  /** demo routes: reseed the mock store (`empty` → no cards, `many` → 7 cards in two sections) */
  seed?: 'empty' | 'many';
}

interface Section {
  title: string;
  data: SavedCard[];
}

/** PaymentCardsV2Screen `sections` memo: >5 cards → Top cards / All other cards; the default card goes to the front of the stack. */
function buildSections(cards: SavedCard[]): Section[] {
  if (cards.length > 5) {
    const top = cards.slice(0, 4);
    if (top[0]?.isDefault) top.push(top.shift()!);
    return [
      { title: t.topCards, data: top },
      { title: t.allCards, data: cards.slice(4) },
    ];
  }
  const all = [...cards];
  if (all.length > 1 && all[0]?.isDefault) all.push(all.shift()!);
  return [
    { title: t.yourSavedCards, data: all },
    { title: '', data: [] },
  ];
}

/**
 * screens/PaymentCardsV2Screen — Wallet-style stacked saved cards.
 * Tap a card → it flies up, tilts, drops above the floating actions panel (PaymentCardActionsScreen overlay) and the list dims to 90% black.
 */
export function CardsScreen({ params }: ScreenProps<CardsParams>) {
  const nav = useNav();
  const cards = useCards();
  const sections = useMemo(() => buildSections(cards), [cards]);
  const firstSectionTitle = sections[0]?.title ?? '';
  const firstSectionCount = sections[0]?.data.length ?? 0;

  useEffect(() => {
    if (params.seed === 'empty') cardsStore.reset([]);
    if (params.seed === 'many') cardsStore.reset(manyCards);
  }, [params.seed]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollY = useMotionValue(0);
  const overScroll = useMotionValue(0);
  const [topStackVisible, setTopStackVisible] = useState(true);

  /* ── usePaymentCardShimmer ── */
  const [isLoading, setIsLoading] = useState(true);
  const loaded = useRef(0);
  const startedAt = useRef(Date.now());
  const onCardLoad = useCallback(() => {
    loaded.current++;
    if (loaded.current >= cardsStore.get().cards.length) {
      const remaining = Math.max(0, cardsTimings.shimmerDelay - (Date.now() - startedAt.current));
      setTimeout(() => setIsLoading(false), remaining);
    }
  }, []);

  /* ── selection / overlay state ── */
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overlayCard, setOverlayCard] = useState<{ card: SavedCard; action: EditAction | null } | null>(null);
  const [selection, setSelection] = useState<{ moveUp: number; moveDown: number } | null>(null);
  const cardRefs = useRef(new Map<string, AnimatedListCardHandle>());
  const afterClose = useRef<(() => void) | null>(null);

  const onCardSelect = useCallback(
    (card: SavedCard, action: EditAction | null = null) => {
      const container = scrollRef.current;
      const el = cardRefs.current.get(card.id)?.el;
      if (!container || !el || activeId) return;
      const listHeight = container.clientHeight;
      const currentTop = el.getBoundingClientRect().top - container.getBoundingClientRect().top;
      const targetTopAtRest = listHeight - BOTTOM_OFFSET - H * ((1 + 0.9) / 2);
      setSelection({ moveUp: Math.max(-H, cardsMetrics.headerHeight - 10 - currentTop), moveDown: targetTopAtRest - currentTop });
      setTopStackVisible(container.scrollTop <= listHeight / 4);
      setActiveId(card.id);
      setOverlayCard({ card, action });
    },
    [activeId],
  );

  const closeOverlay = useCallback((then?: () => void) => {
    afterClose.current = then ?? null;
    setActiveId(null);
  }, []);

  // deep-link demo routes (cards/actions, cards/delete)
  const autoSelected = useRef(false);
  useEffect(() => {
    if (!params.select || isLoading || autoSelected.current) return;
    autoSelected.current = true;
    const id = setTimeout(() => {
      const list = cardsStore.get().cards;
      const card = params.select === 'first-non-default' ? list.find((c) => !c.isDefault) : list.find((c) => c.id === params.select);
      if (card) onCardSelect(card, params.action ?? null);
    }, 700);
    return () => clearTimeout(id);
  }, [params.select, params.action, isLoading, onCardSelect]);

  /* ── useAnimatedPaymentScrollStyle (web): header-snap, pull-to-fan over-scroll, wheel "throw" ── */
  const snapTimer = useRef<number>(0);
  const onScroll = (y: number) => {
    scrollY.set(y);
    window.clearTimeout(snapTimer.current);
    snapTimer.current = window.setTimeout(() => {
      if (y > 0 && y < HEADER_SCROLL_FINAL) scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 140);
  };

  const release = () => animate(overScroll, 0, { duration: ms(cardsTimings.overscrollRelease), ease: cardsEasing.outQuad });
  const throwing = useRef(false);
  const triggerThrow = (amount: number) => {
    if (throwing.current || activeId) return;
    throwing.current = true;
    animate(overScroll, amount, { duration: ms(cardsTimings.overscrollThrow) }).then(() => release().then(() => (throwing.current = false)));
  };

  const drag = useRef<{ y: number; active: boolean; moved: boolean } | null>(null);
  const onPointerDown = (e: ReactPointerEvent) => {
    if (activeId || (scrollRef.current?.scrollTop ?? 0) > 0) return;
    drag.current = { y: e.clientY, active: true, moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d?.active) return;
    const dy = e.clientY - d.y;
    if (dy > 4) d.moved = true;
    if (d.moved) overScroll.set(Math.max(0, dy));
  };
  const endDrag = () => {
    if (!drag.current) return;
    const moved = drag.current.moved;
    drag.current = moved ? { y: 0, active: false, moved: true } : null;
    if (moved) release();
  };

  const goToAddCard = () => nav.push('cards/add');

  /* ── actions (usePaymentEditActions) ── */
  const onSetDefault = (card: SavedCard) => {
    const masked = formatMasked(card.ccMasked);
    closeOverlay(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      nav.toast(t.cardSetAsDefault(masked));
    });
    setTimeout(() => cardsStore.setDefault(card.id), API_DELAY);
  };
  const onDelete = (card: SavedCard) => {
    const masked = formatMasked(card.ccMasked);
    closeOverlay(() => nav.toast(t.cardDeleted(masked)));
    setTimeout(() => cardsStore.remove(card.id), API_DELAY);
  };
  const onRename = (card: SavedCard, nickname: string) => cardsStore.rename(card.id, nickname);

  const dimmed = !!activeId;
  const showDelay = dimmed ? ms(cardsTimings.firstRound + cardsTimings.waitBetweenRounds) : 0;
  const bgTransition = { delay: showDelay, duration: ms(cardsTimings.secondRound), ease: cardsEasing.inOutQuad };

  if (cards.length === 0 && !overlayCard) {
    return (
      <Screen background="bgSurface" safeTop={false} contentStyle={{ paddingBottom: 0, display: 'flex', flexDirection: 'column' }}>
        <EmptyCards onBack={nav.back} onAddCard={goToAddCard} />
      </Screen>
    );
  }

  return (
    <>
      <Screen
        ref={scrollRef}
        background="bgSurface"
        safeTop={false}
        overlayHeader
        onScroll={onScroll}
        contentStyle={{ paddingBottom: 0, overflowY: dimmed ? 'hidden' : undefined }}
        header={
          <motion.div initial={false} animate={{ opacity: dimmed ? 0.1 : 1 }} transition={bgTransition} style={{ pointerEvents: dimmed ? 'none' : 'auto' }}>
            <PaymentScrollableHeader onBack={nav.back} scrollY={scrollY} action={{ title: t.addCard, icon: cardsIcons.plus, onPress: goToAddCard }} />
          </motion.div>
        }
      >
        <div
          className={s.list}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={(e) => {
            if (drag.current?.moved) {
              e.stopPropagation();
              drag.current = null;
            } else drag.current = null;
          }}
          onWheel={(e) => {
            if ((scrollRef.current?.scrollTop ?? 0) <= 0 && e.deltaY < -10) triggerThrow(120);
          }}
          data-testid="cards-list"
        >
          {sections.map((section) =>
            section.data.length === 0 && !section.title ? null : (
              <div key={section.title || 'empty'} className={s.section}>
                {section.title && (
                  <motion.div initial={false} animate={{ opacity: dimmed ? 0 : 1 }} transition={bgTransition}>
                    <SectionTitle>{section.title}</SectionTitle>
                  </motion.div>
                )}
                <AnimatePresence initial={false} mode="popLayout">
                  {section.data.map((card, index) => {
                    const isLast = index === section.data.length - 1;
                    return (
                      <motion.div
                        key={card.id}
                        layout="position"
                        className={s.cardSlot}
                        style={{ marginBottom: isLast ? cardsMetrics.sectionSpacing : cardsMetrics.cardOffset, zIndex: activeId === card.id ? 8 : 1 }}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -30, transition: { duration: duration.medium, ease: easing.inOut } }}
                        transition={handoff.spring}
                      >
                        <AnimatedListCard
                          ref={(h) => {
                            if (h) cardRefs.current.set(card.id, h);
                            else cardRefs.current.delete(card.id);
                          }}
                          card={card}
                          index={index}
                          isInFirstSection={section.title === firstSectionTitle}
                          isLastInSection={isLast}
                          firstSectionCount={firstSectionCount}
                          activeId={activeId}
                          selection={activeId === card.id ? selection : null}
                          overScroll={overScroll}
                          topStackVisible={topStackVisible}
                          isLoading={isLoading}
                          onLoad={onCardLoad}
                          onSelect={() => onCardSelect(card)}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ),
          )}
          {/* ListFooterComponent: usePaymentAnimatedBackgroundStyle — black 0 → 0.9 behind the selected card */}
          <motion.div className={s.backdrop} initial={false} animate={{ opacity: dimmed ? 1 : 0 }} transition={bgTransition} style={{ pointerEvents: 'none' }} />
        </div>
      </Screen>
      {overlayCard && (
        <CardActionsOverlay
          key={overlayCard.card.id}
          card={overlayCard.card}
          initialAction={overlayCard.action}
          open={!!activeId}
          onRequestClose={() => closeOverlay()}
          onClosed={() => {
            setOverlayCard(null);
            setSelection(null);
            afterClose.current?.();
            afterClose.current = null;
          }}
          onSetDefault={onSetDefault}
          onDelete={onDelete}
          onRename={onRename}
        />
      )}
    </>
  );
}
