/**
 * FeedbackView RELOADING without the loader (user request 2026-10-15: no dot loaders anywhere): the pulsing blue dot and
 * the white 60% wash are gone; while `visible` an invisible layer still swallows taps on the screen underneath, so
 * nothing can be pressed mid-update.
 */
export function Reloader({ visible, fixed }: { visible: boolean; fixed?: boolean }) {
  if (!visible) return null;
  return <div aria-busy="true" style={{ position: fixed ? 'fixed' : 'absolute', inset: 0, zIndex: 50 }} />;
}
