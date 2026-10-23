import { useEffect, useRef } from "react";
import { token } from "@/lib/tokens";

/**
 * Re-sews the statement as cross-stitch (materials mode).
 * Each letter is rasterised from its real position on the page, sampled onto a
 * stitch grid, and drawn onto a canvas laid over the text.
 * The real text stays in the DOM (transparent) so it remains selectable/accessible.
 */
export default function CrossStitch({
  targetRef,
  active,
}: {
  targetRef: React.RefObject<HTMLElement | null>;
  active: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = targetRef.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const clear = () => ctx.clearRect(0, 0, cv.width, cv.height);
    if (!active) {
      // fade out (CSS opacity), then wipe once it's invisible
      const t = setTimeout(clear, 450);
      return () => clearTimeout(t);
    }

    const draw = () => {
      cancelAnimationFrame(raf);
      const box = el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const letters = Array.from(el.querySelectorAll<HTMLElement>(".hp-letter"));
      if (!letters.length) return;
      const cs = getComputedStyle(letters[0]);
      const fontSize = parseFloat(cs.fontSize);
      const cell = Math.max(3, Math.round(fontSize / 12));

      // the cloth runs a little past the text box so the last line's underline isn't clipped
      const height = box.height + cell * 2;
      cv.width = Math.round(box.width * dpr);
      cv.height = Math.round(height * dpr);
      cv.style.width = `${box.width}px`;
      cv.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      clear();

      // rasterise every letter where it actually sits
      const off = document.createElement("canvas");
      off.width = Math.ceil(box.width);
      off.height = Math.ceil(height);
      const o = off.getContext("2d", { willReadFrequently: true })!;
      // a heavier weight than the printed text: embroidery reads better with fuller strokes
      o.font = `${cs.fontStyle} 520 ${cs.fontSize} ${cs.fontFamily}`;
      // CSS centres the font's ascent and descent in each line, not the em square, so sit
      // the stitched glyphs on that same baseline or they float a pixel or two high
      o.textBaseline = "alphabetic";
      o.fillStyle = "#000";
      const { fontBoundingBoxAscent: ascent, fontBoundingBoxDescent: descent } = o.measureText("Hg");
      const rects = letters.map((l) => {
        const r = l.getBoundingClientRect();
        const x = r.left - box.left;
        const y = r.top - box.top;
        o.fillText(l.textContent ?? "", x, y + (r.height - (ascent + descent)) / 2 + ascent);
        return { x, y, w: r.width, h: r.height };
      });
      const px = o.getImageData(0, 0, off.width, off.height).data;
      // a cell gets a stitch when the letter covers enough of it
      const inked = (cx: number, cy: number) => {
        let hit = 0;
        let n = 0;
        for (let y = cy; y < cy + cell; y++) {
          for (let x = cx; x < cx + cell; x++) {
            if (x < 0 || y < 0 || x >= off.width || y >= off.height) continue;
            n++;
            if (px[(y * off.width + x) * 4 + 3] > 90) hit++;
          }
        }
        return n > 0 && hit / n > 0.4;
      };

      // Aida cloth: faint holes on the stitch grid
      ctx.fillStyle = "rgba(90, 60, 35, 0.16)";
      for (let y = 0; y < height; y += cell) {
        for (let x = 0; x < box.width; x += cell) ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
      }

      // stitches, collected letter by letter so they're sewn in reading order
      const stitches: [number, number][] = [];
      const seen = new Set<string>();
      for (const r of rects) {
        const x0 = Math.floor(r.x / cell) * cell;
        const y0 = Math.floor(r.y / cell) * cell;
        for (let y = y0; y < r.y + r.h; y += cell) {
          for (let x = x0; x < r.x + r.w; x += cell) {
            const key = `${x},${y}`;
            if (seen.has(key)) continue;
            if (inked(x, y)) {
              seen.add(key);
              stitches.push([x, y]);
            }
          }
        }
      }

      // running-stitch underline under the keywords
      const underlines = Array.from(el.querySelectorAll<HTMLElement>(".hp-kw")).map((w) => {
        const r = w.getBoundingClientRect();
        return { x: r.left - box.left, y: r.bottom - box.top + 2, w: r.width };
      });

      const thread = token("--accent");
      const sew = (x: number, y: number) => {
        const p = cell * 0.18;
        ctx.beginPath();
        ctx.moveTo(x + p, y + p);
        ctx.lineTo(x + cell - p, y + cell - p);
        ctx.moveTo(x + cell - p, y + p);
        ctx.lineTo(x + p, y + cell - p);
        ctx.stroke();
      };
      ctx.strokeStyle = thread;
      ctx.lineWidth = Math.max(1.1, cell * 0.26);
      ctx.lineCap = "round";

      // draw every stitch in one go: the letters switch to cross-stitch instantly
      let i = 0;
      const perFrame = stitches.length;
      const step = () => {
        const end = Math.min(stitches.length, i + perFrame);
        for (; i < end; i++) sew(stitches[i][0], stitches[i][1]);
        if (i < stitches.length) {
          raf = requestAnimationFrame(step);
        } else {
          ctx.setLineDash([cell * 0.9, cell * 0.6]);
          ctx.lineWidth = Math.max(1, cell * 0.22);
          for (const u of underlines) {
            ctx.beginPath();
            ctx.moveTo(u.x, u.y);
            ctx.lineTo(u.x + u.w, u.y);
            ctx.stroke();
          }
          ctx.setLineDash([]);
        }
      };
      step();
    };

    // wait a frame so the letters have settled before measuring
    raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(() => draw());
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [active, targetRef]);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 transition-opacity duration-300 motion-reduce:transition-none"
      style={{ opacity: active ? 1 : 0 }}
    />
  );
}
