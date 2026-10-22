"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * A vine that grows along the underline of "living systems" and curls up
 * around the letters (living systems mode). Drawn to the word's measured size,
 * so it fits at any screen width. Hidden unless <html data-mode="living">.
 */

const STEM = "#4f6b2a";
const LEAVES = ["#7d8f3c", "#a3b05a", "#5f7230"];

type Shape = {
  w: number;
  h: number;
  stem: string;
  tendrils: { d: string; delay: number }[];
  leaves: { x: number; y: number; r: number; fill: string; delay: number }[];
};

function build(w: number, h: number): Shape {
  const base = h - 1; // where the underline sits
  const GROW = 1.1; // seconds for the stem to reach the end of the word
  const at = (x: number) => (x / w) * GROW;

  // stem: a gentle wave along the underline
  let stem = `M0 ${base}`;
  const step = 22;
  for (let x = step; x <= w + step / 2; x += step) {
    const y = base + (Math.round(x / step) % 2 ? -3 : 2);
    stem += ` Q${(x - step / 2).toFixed(1)} ${y} ${Math.min(x, w).toFixed(1)} ${base}`;
  }

  // tendrils: climb from the stem and coil into a spiral beside a letter
  const tendrils: Shape["tendrils"] = [];
  const count = Math.max(2, Math.round(w / 90));
  for (let i = 0; i < count; i++) {
    const x0 = w * ((i + 0.6) / (count + 0.2));
    const dir = i % 2 ? -1 : 1;
    const r = h * (0.16 + (i % 3) * 0.03);
    const cx = x0 + dir * r * 0.6;
    const cy = base - h * (0.45 + (i % 2) * 0.15);
    const pts: string[] = [`M${x0.toFixed(1)} ${base}`];
    // stem up to the coil
    pts.push(`Q${(x0 - dir * r * 0.4).toFixed(1)} ${(base - h * 0.2).toFixed(1)} ${(cx - dir * r).toFixed(1)} ${cy.toFixed(1)}`);
    // coil: ~1.6 turns, tightening
    const turns = 1.6;
    const n = 36;
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const a = Math.PI + dir * t * turns * 2 * Math.PI;
      const rr = r * (1 - t * 0.8);
      pts.push(`L${(cx + Math.cos(a) * rr * dir).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`);
    }
    tendrils.push({ d: pts.join(" "), delay: at(x0) });
  }

  // leaves alternate along the stem
  const leaves: Shape["leaves"] = [];
  for (let x = 14, i = 0; x < w - 6; x += 26, i++) {
    const up = i % 2 === 0;
    leaves.push({
      x,
      y: base + (up ? -5 : 4),
      r: up ? -35 : 35,
      fill: LEAVES[i % LEAVES.length],
      delay: at(x) + 0.1,
    });
  }
  return { w, h, stem, tendrils, leaves };
}

export default function Vine() {
  const svg = useRef<SVGSVGElement>(null);
  const [shape, setShape] = useState<Shape | null>(null);

  useEffect(() => {
    const host = svg.current?.parentElement;
    if (!host) return;
    const measure = () => {
      const r = host.getBoundingClientRect();
      if (r.width && r.height) setShape(build(r.width, r.height));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  const unit = shape ? Math.max(5, shape.h * 0.11) : 6;

  return (
    <svg
      ref={svg}
      aria-hidden="true"
      className="hp-vine pointer-events-none absolute left-0 top-0 overflow-visible"
      width={shape?.w ?? 0}
      height={shape?.h ?? 0}
    >
      {shape && (
        <>
          <path
            className="hp-vine-draw"
            pathLength={1}
            d={shape.stem}
            fill="none"
            stroke={STEM}
            strokeWidth={2.2}
            strokeLinecap="round"
            style={{ "--d": "0s", "--dur": "1.1s" } as React.CSSProperties}
          />
          {shape.tendrils.map((t, i) => (
            <path
              key={i}
              className="hp-vine-draw"
              pathLength={1}
              d={t.d}
              fill="none"
              stroke={STEM}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ "--d": `${t.delay}s`, "--dur": "0.8s" } as React.CSSProperties}
            />
          ))}
          {shape.leaves.map((l, i) => (
            // the wrapper does the pop-in; the ellipse keeps its own rotation
            <g key={i} className="hp-vine-leaf" style={{ "--d": `${l.delay}s` } as React.CSSProperties}>
              <ellipse
                cx={l.x}
                cy={l.y}
                rx={unit}
                ry={unit * 0.45}
                fill={l.fill}
                stroke={STEM}
                strokeWidth={0.8}
                transform={`rotate(${l.r} ${l.x} ${l.y})`}
              />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}
