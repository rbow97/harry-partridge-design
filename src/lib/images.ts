/**
 * Photos at the size they're shown, not the print-size originals. Sanity's CDN serves any width of
 * an image in the browser's best format (AVIF or WebP), so each <img> gets a srcset of widths and a
 * `sizes` saying how wide it shows, and the browser fetches the smallest one that stays sharp.
 * Standalone (no Sanity client), so the homepage island can use it too.
 */

/** the widths on offer: a phone at 1x up to a wide screen at 2x */
export const WIDTHS = [480, 720, 960, 1280, 1600, 2000];

const isSanity = (url: string) => {
  try {
    return new URL(url).hostname === "cdn.sanity.io";
  } catch {
    return false;
  }
};

/** one width of a Sanity image. fit=max never enlarges a small original. Anything not on Sanity's CDN is left as it is */
export function sized(url: string, width: number): string {
  if (!isSanity(url)) return url;
  const u = new URL(url);
  u.searchParams.set("w", String(width));
  u.searchParams.set("fit", "max");
  u.searchParams.set("auto", "format");
  return u.toString();
}

/** the original's size, read from its Sanity filename (…-2439x2499.jpg), for an aspect ratio before it loads */
export function dimensionsOf(url: string): { width: number; height: number } | null {
  const m = url.match(/-(\d+)x(\d+)\.[a-z]+(?:\?|$)/i);
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}

/**
 * The srcset for a Sanity image, or undefined for one that isn't on the CDN. It stops at the
 * original's own width (with the original as the last step), since fit=max won't make a small photo
 * bigger and a candidate claiming more pixels than it has throws off the browser's choice
 */
export function srcset(url: string, widths = WIDTHS) {
  if (!isSanity(url)) return undefined;
  const max = dimensionsOf(url)?.width ?? Infinity;
  const steps = widths.filter((w) => w < max);
  if (max !== Infinity && !widths.includes(max)) steps.push(max);
  return steps.map((w) => `${sized(url, w)} ${w}w`).join(", ");
}

/**
 * How wide each kind of photo shows, for `sizes`. A tray crops its photo to fill it (object-cover),
 * so a landscape photo in a tall tray shows wider than the tray: these allow for that
 */
export const SIZES = {
  tray: "(min-width: 768px) 45vw, 100vw",
  heroTray: "(min-width: 768px) 70vw, 100vw",
  work: "(min-width: 768px) 60vw, 100vw",
  development: "(min-width: 640px) 30vw, 100vw",
  portrait: "(min-width: 1024px) 34vw, (min-width: 768px) 42vw, 100vw",
  sheetTray: "(min-width: 1024px) 40vw, 100vw",
};
