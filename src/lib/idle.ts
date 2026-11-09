/**
 * Run some work once the browser is idle, for things worth doing ahead of a hover rather than
 * during it. Returns a cancel. Safari has no idle callback, so a short wait stands in.
 */
export function whenIdle(work: () => void, timeout = 2000): () => void {
  if ("requestIdleCallback" in window) {
    const id = requestIdleCallback(work, { timeout });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(work, 300);
  return () => clearTimeout(id);
}
