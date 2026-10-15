import { usePresence } from 'motion/react';
import { useLayoutEffect, useState, type RefObject } from 'react';
import { holdSearchHints } from '../components/SearchBar/SearchBar';
import type { NavApi } from './Navigator';
import { useReduceMotion } from '../motion/reducedMotion';

/**
 * Search bar → Search page, after the Sas-Motion recording "01_Seach Box (1X)" (Figma 232:24702): the tapped search bar
 * is the shared element, and it is one object the whole way.
 *
 * · Shape: the page's bar takes the tapped bar's exact box (height, width, offset, corners), so it never grows,
 *   shrinks or reshapes — not in flight, not on landing, not on the way back.
 * · Movement: the bar flies to the page's search slot on a near-critical spring (260 / 28.4 · ζ .88: ≈0.3% overshoot,
 *   settled ≈0.6s); back flies down on 240 / 27.3 (ζ .88).
 * · Contents move in lockstep with it, on the same spring and clock: the magnifier crossfades into the back chevron in
 *   place, the divider fades, and the text and the camera glide onto their spots in the page's bar. When the bar
 *   lands the flying copy is pixel-identical to the page's bar, so the handover is invisible (and the same on back).
 * · The rotating product word never changes in flight: every rotating hint holds (`holdSearchHints`) from the tap until
 *   the bar has settled, then the page's field rotates the same shared words; back holds them until the bar has landed
 *   on the home bar, which then carries on a full interval later.
 * · Around it: white rises over the page underneath (240ms S-curve) while it drifts up 0.41× the travel, and the content
 *   rides one frame behind the bar, fading in from 60ms (240ms). Back is sequenced so nothing overlaps: the content
 *   sinks 24px and is gone by 140ms, and the page underneath is revealed from 100ms (260ms), settling from 16px above.
 */

const OPEN = { stiffness: 260, damping: 28.4 };
const CLOSE = { stiffness: 240, damping: 27.3 };
const UNDER_DRIFT = 0.41;
/** fast but soft start for arriving content, and the S-curve for everything that dims */
const FADE = 'cubic-bezier(0.2, 0.6, 0.35, 1)';
const SWAP = 'cubic-bezier(0.4, 0, 0.2, 1)';
const T = {
  backdrop: { delay: 0, duration: 240, easing: SWAP },
  contentLag: 17,
  contentFade: { delay: 60, duration: 240, easing: FADE },
  back: {
    contentFade: { delay: 0, duration: 140, easing: SWAP },
    contentSink: { delay: 0, duration: 260, easing: SWAP, distance: 24 },
    backdrop: { delay: 100, duration: 260, easing: SWAP },
    /** the page underneath settles from this offset (it is hidden under white when it jumps there) */
    underFrom: 16,
  },
};

/** a mass-1 spring from rest as a CSS `linear()` easing + its settle time */
function springCurve({ stiffness: k, damping: c }: { stiffness: number; damping: number }) {
  const w = Math.sqrt(k);
  const z = c / (2 * w);
  const wd = w * Math.sqrt(1 - z * z);
  const x = (t: number) => 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  let end = 0.2;
  while (end < 2 && (Math.abs(1 - x(end)) > 0.001 || Math.abs(1 - x(end - 0.016)) > 0.001)) end += 0.008;
  const n = 48;
  const pts = Array.from({ length: n + 1 }, (_, i) => (i === n ? 1 : +x((end * i) / n).toFixed(4)));
  return { ms: Math.round(end * 1000), easing: `linear(${pts.join(', ')})` };
}
const openCurve = springCurve(OPEN);
const closeCurve = springCurve(CLOSE);

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}
export interface SearchHint {
  prefix?: string;
  words: string[];
}
interface Source {
  el: HTMLElement;
  box: Box;
  /** what it shows (`SearchBarButton` data-hint-*): the page's field shows the same, so the text never changes */
  hint?: SearchHint;
  at: number;
}
let pending: Source | null = null;

/** the element's layout box in viewport px (transforms about its centre ignored) */
function boxOf(el: HTMLElement): Box {
  const r = el.getBoundingClientRect();
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  return { left: r.left + r.width / 2 - width / 2, top: r.top + r.height / 2 - height / 2, width, height };
}

function hintOf(bar: HTMLElement): SearchHint | undefined {
  try {
    const words = JSON.parse(bar.dataset.hintWords ?? 'null') as string[] | null;
    return words?.length ? { prefix: bar.dataset.hintPrefix || undefined, words } : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Open the search page from a tapped search bar with the shared-bar morph. Pass the bar element (a
 * `SearchBarButton`'s click `currentTarget`); without one it is the normal push.
 */
export function openSearch(nav: Pick<NavApi, 'push'>, bar?: Element | null) {
  if (bar instanceof HTMLElement) {
    // the word on the bar stays put from the tap until the bar has settled
    holdSearchHints(true);
    pending = { el: bar, box: boxOf(bar), hint: hintOf(bar), at: performance.now() };
    nav.push('search/search', undefined, { transition: 'search-morph' });
  } else nav.push('search/search');
}

/** a frozen copy of the source bar that looks the same anywhere (its computed styles inlined: the flow's tokens differ) */
function cloneBar(src: HTMLElement): HTMLElement {
  const copy = src.cloneNode(true) as HTMLElement;
  // motion is never copied; the root's own placement is set by the caller
  const skip = /^(transition|animation|will-change)/;
  const skipRoot = /^(transform|translate|scale|rotate|position|inset|top|left|right|bottom|margin|opacity)/;
  const walk = (a: Element, b: Element, root: boolean) => {
    const cs = getComputedStyle(a);
    const style = (b as HTMLElement).style;
    for (let i = 0; i < cs.length; i++) {
      const p = cs[i];
      if (!skip.test(p) && !(root && skipRoot.test(p))) style.setProperty(p, cs.getPropertyValue(p));
    }
    for (let i = 0; i < a.children.length; i++) walk(a.children[i], b.children[i], false);
  };
  walk(src, copy, true);
  // cloneNode keeps the inline style motion wrote (a press scale): the copy is always at the bar's true size
  for (const p of ['transform', 'scale', 'translate', 'rotate', 'opacity', 'will-change']) copy.style.removeProperty(p);
  // a ticker caught mid-change holds two words: keep the arriving one, at rest
  const words = copy.querySelectorAll<HTMLElement>('[class*=_word_]');
  words.forEach((w, i) => {
    if (i < words.length - 1) w.remove();
    else for (const p of ['transform', 'opacity']) w.style.setProperty(p, p === 'opacity' ? '1' : 'none');
  });
  copy.removeAttribute('id');
  copy.setAttribute('aria-hidden', 'true');
  copy.setAttribute('tabindex', '-1');
  copy.style.pointerEvents = 'none';
  return copy;
}

/** the painted box of an element's text (not its line box) */
function textBox(el: Element): DOMRect {
  const r = document.createRange();
  r.selectNodeContents(el);
  return r.getBoundingClientRect();
}

/** the copy's parts and where each must end up to be the page's bar */
interface Parts {
  text: HTMLElement | null;
  camera: HTMLElement | null;
  lead: HTMLElement | null;
  divider: Element | null;
  chevron: HTMLElement | null;
  textTo: string;
  cameraTo: string;
}

export interface SearchMorphRefs {
  /** wraps the page's search bar (moves) */
  bar: RefObject<HTMLElement | null>;
  /** the page header (its own white background fades with the page's) */
  header: RefObject<HTMLElement | null>;
  /** the Screen scroll content (everything below the bar; its parent is the Screen root with the page background) */
  content: RefObject<HTMLElement | null>;
}

/**
 * Runs the morph on a search page that was opened with `openSearch`, and its reverse when the page leaves (it holds
 * the page until the bar has landed). `active` while the page arrived by the morph (render the content without its own
 * entrance fade then); `hint` is what the tapped bar showed, for the page's field (`SearchInput hint`); `settled`
 * turns true once the bar has landed (rotate the hint from then on).
 */
export function useSearchMorph(refs: SearchMorphRefs): { active: boolean; hint?: SearchHint; settled: boolean } {
  const reduce = useReduceMotion();
  // read (not consumed) in render, so a double render can't lose it; consumed in the layout effect
  const [source] = useState(() => (pending && performance.now() - pending.at < 4000 ? pending : null));
  const [settled, setSettled] = useState(!source);
  const [isPresent, safeToRemove] = usePresence();
  // page: the page's own layers (dropped once settled) · hold: the page underneath (drifted, source bar hidden) until back
  const [state] = useState(() => ({ page: [] as Animation[], hold: [] as Animation[], clone: null as HTMLElement | null, parts: null as Parts | null, delta: 0, opened: false }));

  useLayoutEffect(() => {
    if (pending === source) pending = null;
    const bar = refs.bar.current;
    const header = refs.header.current;
    const content = refs.content.current;
    const root = content?.parentElement;
    if (!source || !bar || !header || !content || !root || !isPresent || state.opened) {
      if (!source) holdSearchHints(false);
      return;
    }
    state.opened = true;
    // the page's bar takes the tapped bar's box (height, width, offset, corners): the shape never changes
    const bar0 = bar.firstElementChild instanceof HTMLElement ? bar.firstElementChild : bar;
    Object.assign(bar0.style, { height: `${source.box.height}px`, width: `${source.box.width}px`, borderRadius: getComputedStyle(source.el).borderRadius, boxSizing: 'border-box' });
    bar0.style.marginLeft = `${(source.box.left - bar0.getBoundingClientRect().left).toFixed(2)}px`;
    const to = boxOf(bar);
    const delta = source.box.top + source.box.height / 2 - (to.top + to.height / 2);
    state.delta = delta;
    const under = source.el.closest<HTMLElement>('[data-key]')?.firstElementChild as HTMLElement | null;
    const white = getComputedStyle(root).backgroundColor;
    const clear = white.replace(/rgba?\(([^,]+),([^,]+),([^,)]+).*$/, 'rgba($1,$2,$3, 0)');

    // the copy of the tapped bar, exactly over the page's bar (the same box)
    const clone = cloneBar(source.el);
    const dstBox = boxOf(bar0);
    Object.assign(clone.style, { position: 'absolute', margin: '0', zIndex: '1', boxSizing: 'border-box', left: `${dstBox.left - to.left}px`, top: `${dstBox.top - to.top}px`, width: `${dstBox.width}px`, height: `${dstBox.height}px` });
    bar.style.position = 'relative';
    bar.appendChild(clone);
    state.clone = clone;

    // the page's hint wears the tapped bar's type, so the text is the same object before and after
    const text = clone.querySelector<HTMLElement>('[class*=_placeholder_]');
    if (text) {
      const ts = getComputedStyle(text);
      bar.style.setProperty('--nk-search-hint-font', `${ts.fontWeight} ${ts.fontSize} / ${ts.lineHeight} ${ts.fontFamily}`);
      bar.style.setProperty('--nk-search-hint-tracking', ts.letterSpacing);
      bar.style.setProperty('--nk-search-hint-color', ts.color);
      const ticker = text.querySelector('[class*=_ticker_]');
      if (ticker) bar.style.setProperty('--nk-search-hint-ticker-height', getComputedStyle(ticker).height);
    }
    // where each part of the copy has to be to look exactly like the page's bar
    const overlay = bar0.querySelector('[class*=_hintOverlay_]');
    const realCamera = bar0.querySelector<HTMLElement>('[class*=_trail_] img');
    const realBack = bar0.querySelector<HTMLImageElement>('[aria-label=Back] img');
    const camera = (clone.lastElementChild instanceof HTMLImageElement ? clone.lastElementChild : null) as HTMLElement | null;
    const lead = clone.querySelector<HTMLElement>('[class*=_lead_] > img');
    const shift = (a: DOMRect, b: DOMRect) => `translate(${(b.left - a.left).toFixed(2)}px, ${(b.top + b.height / 2 - (a.top + a.height / 2)).toFixed(2)}px)`;
    let chevron: HTMLElement | null = null;
    if (realBack) {
      // the page's back chevron, drawn inside the copy at its own spot
      chevron = realBack.cloneNode() as HTMLElement;
      const rb = realBack.getBoundingClientRect();
      const cb = clone.getBoundingClientRect();
      Object.assign(chevron.style, { position: 'absolute', margin: '0', left: `${rb.left - cb.left - clone.clientLeft}px`, top: `${rb.top - cb.top - clone.clientTop}px`, width: `${rb.width}px`, height: `${rb.height}px`, opacity: '0' });
      chevron.removeAttribute('class');
      clone.appendChild(chevron);
    }
    const parts: Parts = {
      text,
      camera,
      lead,
      divider: clone.querySelector('[class*=_dividerArt_], [class*=_divider_]'),
      chevron,
      textTo: text && overlay ? shift(textBox(text), textBox(overlay)) : 'none',
      cameraTo: camera && realCamera ? shift(camera.getBoundingClientRect(), realCamera.getBoundingClientRect()) : 'none',
    };
    state.parts = parts;

    const page = (el: Element, kf: Keyframe[], o: KeyframeAnimationOptions) => state.page.push(el.animate(kf, { fill: 'both', ...o }));
    const hold = (el: Element, kf: Keyframe[], o: KeyframeAnimationOptions) => state.hold.push(el.animate(kf, { fill: 'both', ...o }));
    const flight = { duration: openCurve.ms, easing: openCurve.easing };
    if (reduce) {
      page(clone, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: FADE });
      page(content, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: FADE });
    } else {
      // the source bar hides at once: the flying copy is the one on screen
      hold(source.el, [{ opacity: 0 }, { opacity: 0 }], { duration: 1 });
      if (under) hold(under, [{ transform: 'none' }, { transform: `translateY(${-delta * UNDER_DRIFT}px)` }], flight);
      page(bar, [{ transform: `translateY(${delta}px)` }, { transform: 'none' }], flight);
      // the contents become the page's bar on the bar's own clock
      morphParts(parts, 'toPage', flight, page);
      page(content, [{ transform: `translateY(${delta}px)` }, { transform: 'none' }], { ...flight, delay: T.contentLag });
      page(content, [{ opacity: 0 }, { opacity: 1 }], T.contentFade);
      for (const el of [root, header]) page(el, [{ backgroundColor: clear }, { backgroundColor: white }], T.backdrop);
    }
    // hold the first pose and start the clock two frames later: the page's mount work (effects, preloads) lands in the
    // frames right after its first paint, and a clock running through that stall would open ~40% of the way in
    const all = [...state.page, ...state.hold];
    all.forEach((a) => a.pause());
    // (a back before then cancels them: a cancelled animation is idle, not paused, so it stays off)
    requestAnimationFrame(() => requestAnimationFrame(() => all.forEach((a) => a.playState === 'paused' && a.play())));
    // landed: the copy is now identical to the page's bar, so it hides without a visible change; the hint rotates
    const opened = state.page;
    Promise.all(opened.map((a) => a.finished)).then(
      () => {
        clone.style.opacity = '0';
        opened.forEach((a) => a.cancel());
        state.page = state.page.filter((a) => !opened.includes(a));
        holdSearchHints(false);
        setSettled(true);
      },
      () => undefined,
    );
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent]);

  // the reverse, then let the navigator remove the page
  useLayoutEffect(() => {
    if (isPresent) return;
    const bar = refs.bar.current;
    const header = refs.header.current;
    const content = refs.content.current;
    const root = content?.parentElement;
    const homeLayer = source?.el.closest<HTMLElement>('[data-key]');
    const finish = () => {
      // hide the page before its layers drop back to their own styles, so the frame before removal shows nothing
      if (root) root.style.visibility = 'hidden';
      [...state.page, ...state.hold].forEach((a) => a.cancel());
      state.page = [];
      state.hold = [];
      state.clone?.remove();
      holdSearchHints(false);
      safeToRemove?.();
    };
    // a plain back to the page the bar came from (not a reset / tab switch that removes it too)
    const backToSource = source && state.opened && bar && header && content && root && homeLayer?.isConnected && homeLayer.style.pointerEvents === 'auto';
    if (!backToSource || reduce || !state.clone || !state.parts) {
      finish();
      return;
    }
    // the word stays put until the bar has landed on the home bar (which shows the same shared word)
    holdSearchHints(true);
    const clone = state.clone;
    const parts = state.parts;
    const delta = state.delta;
    const under = homeLayer.firstElementChild as HTMLElement | null;
    const white = getComputedStyle(root).backgroundColor;
    const clear = white.replace(/rgba?\(([^,]+),([^,]+),([^,)]+).*$/, 'rgba($1,$2,$3, 0)');
    // the copy shows the word the page's field shows now
    const word = clone.querySelector('[class*=_word_]');
    const shown = [...bar.querySelectorAll('[class*=_hintOverlay_] [class*=_word_]')].at(-1)?.textContent;
    if (word && shown) word.textContent = shown;
    const now = (el: Element, prop: 'transform' | 'opacity') => getComputedStyle(el)[prop];
    const run: Animation[] = [];
    const add = (el: Element, kf: Keyframe[], o: KeyframeAnimationOptions) => run.push(el.animate(kf, { fill: 'both', ...o }));
    // start every layer from where it is (a back mid-open reverses from there)
    const from = { bar: now(bar, 'transform'), content: now(content, 'transform'), contentO: now(content, 'opacity'), under: under ? now(under, 'transform') : 'none', rootBg: getComputedStyle(root).backgroundColor };
    const midOpen = state.page.length > 0;
    const partsFrom = midOpen ? readParts(parts) : null;
    // the source bar stays hidden until the copy has landed on it
    const keep = state.hold.filter((a) => a.effect instanceof KeyframeEffect && a.effect.target === source.el);
    state.hold.filter((a) => !keep.includes(a)).forEach((a) => a.cancel());
    state.page.forEach((a) => a.cancel());
    state.hold = keep;
    state.page = run;
    const flight = { duration: closeCurve.ms, easing: closeCurve.easing };
    add(bar, [{ transform: from.bar }, { transform: `translateY(${delta}px)` }], flight);
    // the copy takes over from the page's bar (identical, so nothing changes on screen) and becomes the home bar again
    // on the bar's clock
    add(clone, [{ opacity: 1 }, { opacity: 1 }], flight);
    morphParts(parts, 'toSource', flight, add, partsFrom);
    // the content only sinks a little and is gone before the page underneath shows, so the two never overlap
    const { distance, ...sink } = T.back.contentSink;
    add(content, [{ transform: from.content }, { transform: `translateY(${distance}px)` }], sink);
    add(content, [{ opacity: from.contentO }, { opacity: 0 }], T.back.contentFade);
    for (const el of [root, header]) add(el, [{ backgroundColor: white }, { backgroundColor: clear }], T.back.backdrop);
    // the page underneath is still under white here: it moves to a short offset and settles from there as it shows
    // (a back mid-open, before the white is up, keeps where it is)
    if (under) {
      const opaque = (+from.rootBg.replace(/^.*,\s*([\d.]+)\)$/, '$1') || 1) > 0.9;
      add(under, [{ transform: opaque ? `translateY(${-T.back.underFrom}px)` : from.under }, { transform: 'none' }], { ...flight, delay: T.back.backdrop.delay });
    }
    // the bar has landed on its spot: show the real one and remove the page
    Promise.all(run.map((a) => a.finished)).then(finish, finish);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent]);

  return { active: !!source, hint: source?.hint, settled };
}

type Add = (el: Element, kf: Keyframe[], o: KeyframeAnimationOptions) => void;
interface PartsPose {
  text: string;
  camera: string;
  lead: string;
  divider: string;
  chevron: string;
}
const sourcePose = (): PartsPose => ({ text: 'none', camera: 'none', lead: '1', divider: '1', chevron: '0' });
const pagePose = (p: Parts): PartsPose => ({ text: p.textTo, camera: p.cameraTo, lead: '0', divider: '0', chevron: '1' });
function readParts(p: Parts): PartsPose {
  const cs = (el: Element | null, prop: 'transform' | 'opacity', dflt: string) => (el ? getComputedStyle(el)[prop] : dflt);
  return { text: cs(p.text, 'transform', 'none'), camera: cs(p.camera, 'transform', 'none'), lead: cs(p.lead, 'opacity', '1'), divider: cs(p.divider, 'opacity', '1'), chevron: cs(p.chevron, 'opacity', '0') };
}
/** every part of the copy between the tapped bar's look and the page bar's, on one clock */
function morphParts(p: Parts, dir: 'toPage' | 'toSource', timing: KeyframeAnimationOptions, add: Add, from?: PartsPose | null) {
  const a = from ?? (dir === 'toPage' ? sourcePose() : pagePose(p));
  const b = dir === 'toPage' ? pagePose(p) : sourcePose();
  if (p.text) add(p.text, [{ transform: a.text }, { transform: b.text }], timing);
  if (p.camera) add(p.camera, [{ transform: a.camera }, { transform: b.camera }], timing);
  if (p.lead) add(p.lead, [{ opacity: a.lead }, { opacity: b.lead }], timing);
  if (p.divider) add(p.divider, [{ opacity: a.divider }, { opacity: b.divider }], timing);
  if (p.chevron) add(p.chevron, [{ opacity: a.chevron }, { opacity: b.chevron }], timing);
}
