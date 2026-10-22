"use client";

import React, { useEffect, useRef } from "react";
import { useSound } from "./sound/SoundProvider";

/**
 * Type that speaks: Instrument Sans' variable axes (weight, width)
 * follow the loudness of whatever is playing, letter by letter.
 * Static when quiet or when the visitor prefers reduced motion.
 */
type Props = {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  baseWeight?: number;
  range?: number;
};

export default function VoiceType({ text, as = "span", className, baseWeight = 400, range = 300 }: Props) {
  const { getLevel } = useSound();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !root.current) return;
    const letters = Array.from(root.current.querySelectorAll<HTMLSpanElement>("[data-l]"));
    let raf = 0;
    const tick = (t: number) => {
      const lvl = getLevel();
      letters.forEach((el, i) => {
        const wave = 0.55 + 0.45 * Math.sin(t / 220 + i * 0.6);
        const v = lvl * wave;
        const wght = Math.round(baseWeight + v * range);
        const wdth = Math.round(100 - v * 25); // louder = more condensed
        el.style.fontVariationSettings = `"wght" ${wght}, "wdth" ${wdth}`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getLevel, baseWeight, range, text]);

  const Tag = as as any;
  const words = text.split(" ");
  return (
    <Tag ref={root} className={className} aria-label={text}>
      {words.map((w, wi) => (
        <span key={wi} aria-hidden="true" className="inline-block whitespace-nowrap">
          {Array.from(w).map((ch, ci) => (
            <span
              key={ci}
              data-l
              className="inline-block"
              style={{ fontVariationSettings: `"wght" ${baseWeight}, "wdth" 100` }}
            >
              {ch}
            </span>
          ))}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </Tag>
  );
}
