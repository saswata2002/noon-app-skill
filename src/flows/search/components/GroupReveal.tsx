import { motion } from 'motion/react';
import { useState, type CSSProperties, type ReactNode, type Ref } from 'react';
import { Skeleton } from '../../../components';
import { handoff } from '../../../motion/presets';
import { searchTokens } from '../tokens';

/** The search page's skeleton intro: `shown` flips once for the whole page; `at(group)` is that component's delay (s). */
export interface GroupIntro {
  shown: boolean;
  at: (group: number) => number;
}

/**
 * One element of the search page's first-open skeleton (Skeleton look="band", the Brand Widget PLP skeleton) over its
 * own box. Everything in a component (`group`: Recent Searches, Trending searches) reveals together: the content fades
 * in (a minimal stagger in reading order) and comes into focus (blur → 0) while it settles a few px on a critically damped spring (no bounce),
 * and its skeleton dissolves underneath at the same moment (a crossfade, so nothing pops and there is no blank frame).
 * The skeleton leaves the DOM once it has faded. Without `intro` it renders the children as they are.
 */
export function GroupReveal({
  intro,
  group,
  index = 0,
  radius,
  children,
  style,
  ref,
}: {
  intro?: GroupIntro;
  group: number;
  /** reading-order position inside the component: adds `index × itemStagger` to the component's delay */
  index?: number;
  radius: number | string;
  children: ReactNode;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
}) {
  const k = searchTokens.skeleton;
  const [gone, setGone] = useState(!intro);
  if (!intro) return <>{children}</>;
  const { shown } = intro;
  const delay = shown ? intro.at(group) + index * k.itemStagger : 0;
  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      {!gone && (
        <motion.div
          aria-hidden
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: shown ? 0 : 1 }}
          transition={{ duration: k.skeletonFade, ease: handoff.easeInOut, delay: delay + k.skeletonLag }}
          onAnimationComplete={() => shown && setGone(true)}
        >
          <Skeleton look="band" height="100%" radius={radius} />
        </motion.div>
      )}
      <motion.div
        style={{ position: 'relative' }}
        initial={{ opacity: 0, y: k.rise, filter: `blur(${k.blur}px)` }}
        // the blur is dropped once it is in focus, so the settled page has no filter layers
        animate={shown ? { opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } } : { opacity: 0, y: k.rise, filter: `blur(${k.blur}px)` }}
        transition={{ y: { ...handoff.spring, delay }, opacity: { duration: k.contentFade, ease: handoff.easeOut, delay }, filter: { duration: k.contentFade, ease: handoff.easeOut, delay } }}
      >
        {children}
      </motion.div>
    </div>
  );
}
