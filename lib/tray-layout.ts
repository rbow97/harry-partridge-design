/**
 * Which columns each specimen tray spans, on a 12-column grid, so no row is ever
 * left part-filled. Four trays across normally. Whatever doesn't divide by four
 * comes first and wider, albumcolors style: one leftover is a full-width tray,
 * two are half-width, three are a third each.
 */
export const COLUMNS = 12;
export const PER_ROW = 4;

export type Tray = { span: number; rowEnd: boolean };

export function trayLayout(n: number): Tray[] {
  const lead = n % PER_ROW; // the trays in the wider first row (0 when rows divide exactly)
  return Array.from({ length: n }, (_, i) => {
    const span = i < lead ? COLUMNS / lead : COLUMNS / PER_ROW;
    const rowEnd = i < lead ? i === lead - 1 : (i - lead) % PER_ROW === PER_ROW - 1 || i === n - 1;
    return { span, rowEnd };
  });
}

export const PEEK = 72; // px of the next row left showing under the hero, so there's clearly more

/** CSS height for a tray: enough for a normal tray's 4:3 frame to fill its column, taller
 *  for wider trays, and a full-width hero (a record sheet, its label beside the photo) fills
 *  the first screen exactly with a peek of the row beneath. --drawer-top is the drawer's
 *  offset from the page top, measured in ProjectColumns, since the statement's height
 *  depends on the viewport */
export const trayHeight = (span: number) =>
  span === COLUMNS
    ? `clamp(360px, calc(100svh - var(--drawer-top, 300px) - ${PEEK}px), 900px)`
    : `${320 + (span - COLUMNS / PER_ROW) * 42}px`;
