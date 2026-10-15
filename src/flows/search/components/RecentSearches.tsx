import { AnimatePresence, motion } from 'motion/react';
import { Icon, Pressable, Text } from '../../../components';
import { GroupReveal, type GroupIntro } from './GroupReveal';
import { searchTokens } from '../tokens';
import { ref } from '../../../foundations/tokens';
import { duration, easing, handoff } from '../../../motion/presets';

export interface RecentItem {
  id: string;
  label: string;
  emoji: string;
  tint: string;
}

/**
 * NoonRecentlySearchedModule: items = screen ÷ 5.2 wide, image h = w × 1.2, r = w ÷ 10.
 * Edit mode: items shift down 9px (200ms), delete badges fade in, items wobble ±2° at 3Hz with offset phases.
 */
export function RecentSearches({
  items,
  editing,
  onToggleEdit,
  onRemove,
  onPress,
  intro,
}: {
  items: RecentItem[];
  editing: boolean;
  onToggleEdit: () => void;
  onRemove: (id: string) => void;
  onPress: (label: string) => void;
  /** first-open skeleton intro: the whole component reveals as group 0; none = no skeleton */
  intro?: GroupIntro;
}) {
  const w = searchTokens.recentItemWidth;
  if (!items.length) return null;
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12, background: ref.color('bgSurface') }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <GroupReveal intro={intro} group={0} index={0} radius="var(--nk-radius-r4)">
          <Text variant="section" color="textStrong">
            Recent Searches
          </Text>
        </GroupReveal>
        <GroupReveal intro={intro} group={0} index={1} radius="var(--nk-radius-r4)">
          <Pressable onClick={onToggleEdit} style={{ font: ref.type('productTitle'), color: 'var(--nk-color-text-muted)' }}>
            {editing ? 'Done' : 'Edit'}
          </Pressable>
        </GroupReveal>
      </div>
      <div className="nk-hscroll" style={{ gap: 12, padding: '0 16px', minHeight: w * 1.2 + 50 }}>
        {/* intro: AnimatePresence initial={false} would also suppress the skeleton reveals inside the tiles, so it is on for
            that first pass and only the tiles' own pop-in is turned off */}
        <AnimatePresence initial={!!intro}>
          {items.map((it, i) => (
            <motion.div
              key={it.id}
              layout
              initial={intro ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: editing ? 9 : 0 }}
              exit={{ opacity: 0, scale: 0.6, transition: { duration: duration.base, ease: easing.inOut } }}
              transition={{ ...handoff.spring, opacity: { duration: duration.fast, ease: easing.out } }}
              style={{ position: 'relative', width: w, flexShrink: 0 }}
            >
              <motion.div
                animate={editing ? { rotate: [-2, 2, -2] } : { rotate: 0 }}
                transition={editing ? { duration: 1 / 3, repeat: Infinity, ease: 'easeInOut', delay: (i % 3) * 0.08 } : handoff.spring}
              >
                <Pressable onClick={() => (editing ? onRemove(it.id) : onPress(it.label))} style={{ display: 'flex', flexDirection: 'column', gap: 6, width: w }}>
                  <GroupReveal intro={intro} group={0} index={2 + i} radius={w / 10}>
                    <span
                      style={{
                        position: 'relative',
                        width: w,
                        height: w * 1.2,
                        borderRadius: w / 10,
                        background: `radial-gradient(120% 90% at 50% 35%, ${ref.palette('white')} 0%, ${it.tint} 70%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 34,
                        overflow: 'hidden',
                      }}
                    >
                      {it.emoji}
                      <span style={{ position: 'absolute', inset: 0, background: 'var(--nk-color-image-overlay)' }} />
                    </span>
                  </GroupReveal>
                  <GroupReveal intro={intro} group={0} index={2 + i} radius="var(--nk-radius-r4)">
                    <Text variant="body" color={ref.palette('newBlack')} lines={2} align="center">
                      {it.label}
                    </Text>
                  </GroupReveal>
                </Pressable>
              </motion.div>
              <AnimatePresence>
                {editing && (
                  <motion.button
                    type="button"
                    aria-label={`Remove ${it.label}`}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6, transition: { ...handoff.spring, opacity: { duration: duration.base, ease: easing.inOut } } }}
                    transition={{ ...handoff.spring, opacity: { duration: duration.fast, ease: easing.out } }}
                    onClick={() => onRemove(it.id)}
                    style={{
                      position: 'absolute',
                      top: -8,
                      insetInlineEnd: -6,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      border: 0,
                      background: ref.color('bgSurface'),
                      boxShadow: `0 1px 4px ${ref.palette('blackAlpha18')}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'var(--nk-color-text-muted)',
                    }}
                  >
                    <Icon name="close" size={12} strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
