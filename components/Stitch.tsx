"use client";

import React, { useEffect, useRef } from "react";

/**
 * Stitch (materials mode). Two jobs on one canvas:
 * - cloth: while materials is on, the whole statement block is Aida cloth, its holes
 *   continuing the grid CrossStitch draws under the text.
 * - sewing: once the word has been clicked (pinned), the cursor sews. Across the block
 *   it lays crosses, each one five of the text's own stitches on the diagonals of a
 *   3x3 block of the text's grid, never over the letters or the underlined words. Along
 *   any rule on the page it lays running stitch.
 * Everything fades with the mode. Canvas 2D; hidden unless <html data-mode="materials">.
 */

const REACH = 14; // px either side of a rule where the needle catches it
const STEP = 9; // px from one running stitch to the next
const STITCH = 5.5; // px, a running stitch's length
const BLOCK = 3; // a stitch of yours is a cross made of the text's stitches: the diagonals of a 3x3 block
const THREAD = "#a4471f";
const HOLES = "rgba(90, 60, 35, 0.16)"; // the Aida cloth's holes, as in CrossStitch.tsx

type Seg = { x1: number; y1: number; x2: number; y2: number; flat: boolean };
type Hold = { seg: Seg; t: number }; // where the needle last was, along which rule
type Box = { left: number; top: number; right: number; bottom: number };
// the block, the text's own stitch grid (cell size and origin) to line up with, and the text's boxes to sew around
type Cloth = Box & { cell: number; ox: number; oy: number; textBox: Box; text: Box[] };
// what has been sewn, so it can be drawn again whenever the canvas is redrawn
type Sewn = { kind: "cross"; x: number; y: number; cell: number } | { kind: "run"; x: number; y: number; w: number; h: number };

function rules(): Seg[] {
  const out: Seg[] = [];
  document.querySelectorAll<HTMLElement>(".hp-rule").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;
    const cs = getComputedStyle(el);
    if (parseFloat(cs.borderTopWidth)) out.push({ x1: r.left, y1: r.top, x2: r.right, y2: r.top, flat: true });
    if (parseFloat(cs.borderBottomWidth)) out.push({ x1: r.left, y1: r.bottom, x2: r.right, y2: r.bottom, flat: true });
    if (parseFloat(cs.borderLeftWidth)) out.push({ x1: r.left, y1: r.top, x2: r.left, y2: r.bottom, flat: false });
    if (parseFloat(cs.borderRightWidth)) out.push({ x1: r.right, y1: r.top, x2: r.right, y2: r.bottom, flat: false });
  });
  return out;
}

// the cloth is the whole statement block, on the same grid as the embroidered text (see
// CrossStitch.tsx for the cell size); the letters and the underlined words are kept clear
function cloth(): Cloth | null {
  const p = document.querySelector<HTMLElement>(".hp-statement");
  const block = p?.closest("section");
  const letter = p?.querySelector<HTMLElement>(".hp-letter");
  if (!p || !block || !letter) return null;
  const r = block.getBoundingClientRect();
  const t = p.getBoundingClientRect();
  const cell = Math.max(3, Math.round(parseFloat(getComputedStyle(letter).fontSize) / 12));
  const pad = 2;
  const text = Array.from(p.querySelectorAll<HTMLElement>(".hp-letter, .hp-kw")).map((el) => {
    const b = el.getBoundingClientRect();
    return { left: b.left - pad, top: b.top - pad, right: b.right + pad, bottom: b.bottom + pad };
  });
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, cell, ox: t.left, oy: t.top, textBox: t, text };
}

const overlaps = (a: Box, b: Box) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

// the rule under the needle, if any, and how far along it the needle is
function catchRule(segs: Seg[], x: number, y: number): Hold | null {
  let best: Hold | null = null;
  let bestD = REACH;
  for (const seg of segs) {
    const d = seg.flat ? Math.abs(y - seg.y1) : Math.abs(x - seg.x1);
    const t = seg.flat ? x - seg.x1 : y - seg.y1;
    const len = seg.flat ? seg.x2 - seg.x1 : seg.y2 - seg.y1;
    if (d < bestD && t >= 0 && t <= len) {
      bestD = d;
      best = { seg, t };
    }
  }
  return best;
}

export default function Stitch({ cloth: on, sewing }: { cloth: boolean; sewing: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hold = useRef<Hold | null>(null);
  const sewn = useRef(0); // along the held rule, how far the stitching has reached
  const last = useRef<{ x: number; y: number } | null>(null); // the pointer's previous place on the cloth
  const crossed = useRef(new Set<string>()); // cloth blocks already stitched
  const work = useRef<Sewn[]>([]); // everything sewn this time

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    if (!on) {
      // the cloth and its stitches fade with the mode (CSS), then it's clean for next time
      const t = setTimeout(() => {
        ctx.clearRect(0, 0, el.width, el.height);
        crossed.current.clear();
        work.current = [];
      }, 700);
      hold.current = null;
      last.current = null;
      return () => clearTimeout(t);
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let segs = rules();
    let aida = cloth();

    // one of the text's stitches, exactly as CrossStitch sews them
    const sew = (x: number, y: number, cell: number) => {
      const p = cell * 0.18;
      ctx.beginPath();
      ctx.moveTo(x + p, y + p);
      ctx.lineTo(x + cell - p, y + cell - p);
      ctx.moveTo(x + cell - p, y + p);
      ctx.lineTo(x + p, y + cell - p);
      ctx.stroke();
    };
    const paint = (s: Sewn) => {
      ctx.fillStyle = THREAD;
      ctx.strokeStyle = THREAD;
      ctx.lineCap = "round";
      if (s.kind === "run") ctx.fillRect(s.x, s.y, s.w, s.h);
      else {
        ctx.lineWidth = Math.max(1.1, s.cell * 0.26);
        for (let i = 0; i < BLOCK; i++) {
          sew(s.x + i * s.cell, s.y + i * s.cell, s.cell);
          if (i !== BLOCK - 1 - i) sew(s.x + (BLOCK - 1 - i) * s.cell, s.y + i * s.cell, s.cell);
        }
      }
    };
    // the whole canvas: the cloth's holes over the block (CrossStitch draws them under the
    // text), then everything sewn so far
    const redraw = () => {
      const dpr = devicePixelRatio;
      el.width = innerWidth * dpr;
      el.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const c = aida;
      if (c) {
        ctx.fillStyle = HOLES;
        const x0 = c.ox - Math.ceil((c.ox - c.left) / c.cell) * c.cell;
        const y0 = c.oy - Math.ceil((c.oy - c.top) / c.cell) * c.cell;
        for (let y = y0; y < c.bottom; y += c.cell) {
          for (let x = x0; x < c.right; x += c.cell) {
            if (x >= c.textBox.left && x < c.textBox.right && y >= c.textBox.top && y < c.textBox.bottom) continue;
            ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
          }
        }
      }
      work.current.forEach(paint);
    };
    redraw();
    const remeasure = () => {
      segs = rules();
      aida = cloth();
      hold.current = null;
      last.current = null;
      redraw();
    };
    addEventListener("scroll", remeasure, { passive: true });
    addEventListener("resize", remeasure);
    if (!sewing) {
      return () => {
        removeEventListener("scroll", remeasure);
        removeEventListener("resize", remeasure);
      };
    }

    const add = (s: Sewn) => {
      work.current.push(s);
      paint(s);
    };
    const running = (seg: Seg, t: number) => {
      // a little unevenness, as if by hand
      const wobble = (Math.random() - 0.5) * 1.2;
      const len = STITCH + (Math.random() - 0.5) * 1.5;
      add(seg.flat ? { kind: "run", x: seg.x1 + t - len / 2, y: seg.y1 - 1 + wobble, w: len, h: 2 } : { kind: "run", x: seg.x1 - 1 + wobble, y: seg.y1 + t - len / 2, w: 2, h: len });
    };
    // a cross of yours on the block under the point, once per block, never over the text
    const cross = (x: number, y: number) => {
      const c = aida!;
      const size = c.cell * BLOCK;
      const bx = c.ox + Math.floor((x - c.ox) / size) * size;
      const by = c.oy + Math.floor((y - c.oy) / size) * size;
      const key = `${bx},${by}`;
      if (crossed.current.has(key)) return;
      const box = { left: bx, top: by, right: bx + size, bottom: by + size };
      if (box.top < c.top || box.bottom > c.bottom || c.text.some((t) => overlaps(box, t))) return;
      crossed.current.add(key);
      add({ kind: "cross", x: bx, y: by, cell: c.cell });
    };
    const onCloth = (x: number, y: number) => !!aida && x >= aida.left && x <= aida.right && y >= aida.top && y <= aida.bottom;

    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const x = e.clientX, y = e.clientY;
      if (onCloth(x, y)) {
        // stitch every block along the way, so a quick sweep doesn't leave gaps
        const from = last.current && onCloth(last.current.x, last.current.y) ? last.current : { x, y };
        const n = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / (aida!.cell * BLOCK * 0.7)));
        for (let i = 1; i <= n; i++) cross(from.x + ((x - from.x) * i) / n, from.y + ((y - from.y) * i) / n);
        last.current = { x, y };
        hold.current = null;
        return;
      }
      last.current = { x, y };
      const h = catchRule(segs, x, y);
      if (!h) {
        hold.current = null;
        return;
      }
      if (!hold.current || hold.current.seg !== h.seg) {
        hold.current = h;
        sewn.current = h.t;
        running(h.seg, h.t);
        return;
      }
      const dir = Math.sign(h.t - sewn.current);
      while (dir && Math.abs(h.t - sewn.current) >= STEP) {
        sewn.current += dir * STEP;
        running(h.seg, sewn.current);
      }
      hold.current = h;
    };
    addEventListener("pointermove", move);
    return () => {
      removeEventListener("pointermove", move);
      removeEventListener("scroll", remeasure);
      removeEventListener("resize", remeasure);
    };
  }, [on, sewing]);

  return <canvas ref={canvas} aria-hidden="true" className="hp-stitch" />;
}
