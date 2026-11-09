/**
 * The trays' reels in the sound mode. Tape.tsx turns them and Flock.tsx lands on them, so the
 * angle is kept here in memory rather than read back out of the page each frame.
 *
 * The angle goes to the page as --reel on the tray's photo, the only thing that reads it.
 * It's registered with inherits: false (global.css), so a turn restyles that one image
 * instead of the whole tray.
 */

const angles = new WeakMap<Element, number>();

/** a tray's reel angle in degrees, 0 when upright or never turned */
export const reelAngle = (tray: Element) => angles.get(tray) ?? 0;

/** turn a tray's reel to an angle in degrees. A tray off screen keeps its angle here but isn't
 *  restyled, and catches up the frame it scrolls back into view */
export function setReel(tray: HTMLElement, deg: number, shown = true) {
  angles.set(tray, deg);
  if (shown) tray.querySelector<HTMLElement>(".hp-img")?.style.setProperty("--reel", `${deg.toFixed(2)}deg`);
}
