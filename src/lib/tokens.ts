/**
 * Design tokens for canvas code, read from the CSS custom properties in styles/tokens.css
 * so the canvases and the stylesheet can never disagree. Read on mount and again when the
 * mode changes: the var flips at once while the page's own colours ease over --dur-mode,
 * and every canvas here fades in rather than recolouring, so that gap never shows.
 */

type Token =
  | "--surface"
  | "--text"
  | "--text-muted"
  | "--accent"
  | "--rule"
  | "--rule-strong"
  | "--paper"
  | "--ink"
  | "--rust"
  | "--ember";

export function token(name: Token): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!v && import.meta.env.DEV) console.warn(`token ${name} is not defined`);
  return v;
}

/** a token with an alpha, for canvas fills: color-mix keeps whatever notation the token uses */
export const alpha = (name: Token, a: number) => `color-mix(in srgb, ${token(name)} ${Math.round(a * 100)}%, transparent)`;
