"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import type { ProjectGroup } from "@/lib/group-projects";
import { Habitat, Tree } from "./Ecosystem";
import CrossStitch from "./CrossStitch";
import Vine from "./Vine";

const THEMES = ["materials", "sound", "living systems"] as const;
type Theme = (typeof THEMES)[number];

type Mode = "materials" | "sound" | "living";

/** Split text into letters so the page modes can animate them (the sentence is read via aria-label) */
function Letters({ text, start, wordClass = "" }: { text: string; start: number; wordClass?: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((w, wi) =>
        /^\s+$/.test(w) ? (
          w
        ) : (
          <span key={wi} className={`inline-block whitespace-nowrap ${wordClass}`}>
            {Array.from(w).map((ch, ci) => {
              const i = start + text.split(/(\s+)/).slice(0, wi).join("").length + ci;
              return (
                <span
                  key={ci}
                  className="hp-letter relative inline-block"
                  data-ch={ch}
                  // --r / --y: a fixed, uneven tilt and offset per letter (used by the materials mode)
                  style={
                    {
                      "--i": i,
                      "--r": `${(((i * 37) % 7) - 3) * 2}deg`,
                      "--y": `${(((i * 53) % 5) - 2) * 0.04}em`,
                      "--s": `${0.025 + ((i * 37) % 5) * 0.01}em`,
                      "--sd": i % 2 ? 1 : -1,
                    } as React.CSSProperties
                  }
                >
                  {ch}
                </span>
              );
            })}
          </span>
        )
      )}
    </>
  );
}

// specimen names for the herbarium hover — placeholders, ask Harry
const SPECIMENS = ["Textilis loquens", "Aer sordidus", "Intelligentia viva", "Corium microbiale"];

const projectNo = (i: number) => `HP–${String(i + 1).padStart(3, "0")}`;
const letter = (j: number) => String.fromCharCode(65 + j);

/** Corner crop marks, like a technical drawing or specimen tray */
function CropMarks() {
  const mark = "absolute w-3 h-3 border-ink/50";
  return (
    <span aria-hidden="true">
      <span className={`hp-mark ${mark} top-3 left-3 border-t border-l`} />
      <span className={`hp-mark ${mark} top-3 right-3 border-t border-r`} />
      <span className={`hp-mark ${mark} bottom-3 left-3 border-b border-l`} />
      <span className={`hp-mark ${mark} bottom-3 right-3 border-b border-r`} />
    </span>
  );
}

/** A ruler along the bottom of the tray */
function Ruler() {
  return (
    <span aria-hidden="true" className="hp-ruler absolute left-6 right-6 bottom-6 h-2.5 flex items-end">
      <span
        className="w-full h-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, rgba(26,26,23,.55) 0 1px, transparent 1px 40px), repeating-linear-gradient(to right, rgba(26,26,23,.35) 0 1px, transparent 1px 8px)",
          backgroundSize: "100% 100%, 100% 45%",
          backgroundPosition: "bottom, bottom",
          backgroundRepeat: "no-repeat",
        }}
      />
    </span>
  );
}

export default function ProjectColumns({ groups }: { groups: ProjectGroup[] }) {
  const [active, setActive] = useState<Theme | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const statement = useRef<HTMLParagraphElement>(null);

  // The whole page (nav included) takes on the hovered word — see globals.css.
  // data-mode = the target look (colours transition to it).
  // data-anim = modes whose motion/textures are still on screen; a mode lingers here
  // for EXIT_MS after you leave so it can ease out instead of snapping off.
  const EXIT_MS = 650;

  // Which "living systems" hover to show while we compare options: ?living=breathe | split | herbarium | eco
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("living");
    document.documentElement.dataset.living =
      v && ["inflate", "breathe", "split", "herbarium", "eco"].includes(v) ? v : "inflate";
  }, []);
  const [anims, setAnims] = useState<Mode[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const root = document.documentElement;
    if (mode) root.dataset.mode = mode;
    else delete root.dataset.mode;

    if (mode) {
      // re-entering while it eases out: cancel that exit (and forget it, so the
      // next exit gets a fresh timer instead of being skipped)
      clearTimeout(timers.current[mode]);
      delete timers.current[mode];
      setAnims((a) => (a.includes(mode) ? a : [...a, mode]));
    }
    for (const m of ["materials", "sound", "living"] as Mode[]) {
      if (m === mode || timers.current[m]) continue;
      timers.current[m] = setTimeout(() => {
        delete timers.current[m];
        setAnims((a) => a.filter((x) => x !== m));
      }, EXIT_MS);
    }
  }, [mode]);

  useEffect(() => {
    const root = document.documentElement;
    if (anims.length) root.dataset.anim = anims.join(" ");
    else delete root.dataset.anim;
  }, [anims]);

  useEffect(() => {
    const t = timers.current;
    return () => {
      Object.values(t).forEach(clearTimeout);
      delete document.documentElement.dataset.mode;
      delete document.documentElement.dataset.anim;
    };
  }, []);

  /* ---- Breathe (living systems): one breath curve drives the whole page ----
     Resting breathing is ~12–16 breaths/min with inhale:exhale around 1:2.
     Inhale is active (smooth swell); exhale is passive elastic recoil (falls
     fast, then slows), followed by a short pause before the next breath. */
  const page = useRef<HTMLDivElement>(null);
  const breath = useRef({ amp: 0, target: 0, raf: 0, t0: 0 });
  // inflate: the "living systems" letters fill with air like balloons
  const puffFat = useRef<SVGFEFuncAElement>(null);
  const puffBlur = useRef<SVGFEGaussianBlurElement>(null);
  const puffSpec = useRef<SVGFESpecularLightingElement>(null);
  const puffDiff = useRef<SVGFEDiffuseLightingElement>(null);


  useEffect(() => {
    const s = breath.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const variant = document.documentElement.dataset.living;
    const on = mode === "living" && (variant === "breathe" || variant === "inflate") && !reduce;
    s.target = on ? 1 : 0;
    if (!on || s.raf) return;

    /* A breath generator rather than a fixed loop:
       - every breath differs a little in depth and length, with a deeper "sigh"
         every few breaths (a metronome is what reads as mechanical)
       - the in-breath overshoots slightly, then settles — air snapping the balloon taut
       - the out-breath is elastic recoil: fast at first, tailing off, then a pause */
    type Breath = { start: number; inhale: number; exhale: number; pause: number; depth: number };
    const rnd = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
    let count = 0;
    const newBreath = (start: number): Breath => {
      count++;
      const sigh = count > 2 && count % rnd(4, 7) < 1;
      return {
        start,
        inhale: sigh ? rnd(2.1, 2.5) : rnd(1.35, 1.85),
        exhale: sigh ? rnd(3.0, 3.6) : rnd(2.2, 3.0),
        pause: rnd(0.25, 0.8),
        depth: sigh ? 1.12 : rnd(0.82, 1),
      };
    };
    let br = newBreath(0);
    const OVER = 1.07; // overshoot at the top of the in-breath
    const K = 3.4; // recoil
    const value = (t: number) => {
      while (t >= br.start + br.inhale + br.exhale + br.pause) br = newBreath(br.start + br.inhale + br.exhale + br.pause);
      const p = t - br.start;
      if (p < 0) return 0;
      if (p < br.inhale) {
        const u = p / br.inhale;
        const ease = 1 - Math.pow(1 - u, 3); // fast fill, then slowing
        return br.depth * OVER * ease;
      }
      if (p < br.inhale + br.exhale) {
        const u = (p - br.inhale) / br.exhale;
        // settle from the overshoot, then the main recoil
        const settle = (OVER - 1) * Math.exp(-14 * u);
        const recoil = (Math.exp(-K * u) - Math.exp(-K)) / (1 - Math.exp(-K));
        return br.depth * (recoil + settle);
      }
      return 0;
    };
    // the breath ripples along the word: each letter lags the one before it
    const LAG = 0.075;
    const letters = Array.from(page.current?.querySelectorAll<HTMLElement>(".hp-inflate .hp-letter") ?? []);
    // the balloon copy's letters also thicken individually (variable-font weight),
    // which is what makes the breath visibly travel along the word
    const balloon = Array.from(page.current?.querySelectorAll<HTMLElement>(".hp-balloon .hp-letter") ?? []);
    const nb = Math.max(1, balloon.length);
    // the balloon underlines breathe with the letters above them
    const lines = Array.from(page.current?.querySelectorAll<HTMLElement>(".hp-balloon .hp-bkw") ?? []);
    // other elements (project columns) breathe to the same generator with their own offsets;
    // sample it a little behind so the per-letter lags never run ahead of the generator
    const cols = Array.from(page.current?.querySelectorAll<HTMLElement>("ol > li") ?? []);
    const hist: number[] = [];
    const at = (t: number) => value(t);
    const loop = (now: number) => {
      if (!s.t0) s.t0 = now;
      s.amp += (s.target - s.amp) * 0.05; // ease in/out of the hover
      const t = (now - s.t0) / 1000;
      // keep a short history so lagged samples read from the past, not a regenerated future
      hist.push(at(t));
      if (hist.length > 120) hist.shift();
      const back = (secs: number) => hist[Math.max(0, hist.length - 1 - Math.round(secs * 60))] ?? 0;
      page.current?.style.setProperty("--b", (hist[hist.length - 1] * s.amp).toFixed(4));
      cols.forEach((c, i) => c.style.setProperty("--b", (back(i * 0.45) * s.amp).toFixed(4)));
      if (variant === "inflate") {
        // hovering inflates the letters; each breath puffs them up further.
        // shading follows the middle of the word; each letter's size follows its own lag
        const mid = back(LAG * nb * 0.5);
        // the shared shading only breathes a little; each letter carries its own breath
        const air = s.amp * (0.5 + 0.25 * Math.min(1.1, mid));
        letters.forEach((l, k) => l.style.setProperty("--lb", (s.amp * back((k % nb) * LAG)).toFixed(4)));
        balloon.forEach((l, k) => {
          const lb = s.amp * back(k * LAG);
          l.style.fontVariationSettings = `"wght" ${(420 + 200 * Math.min(1, lb)).toFixed(0)}, "wdth" 100`;
        });
        lines.forEach((w) => {
          const ls = Array.from(w.querySelectorAll<HTMLElement>(".hp-letter"));
          const mean = ls.reduce((a, l) => a + +l.style.getPropertyValue("--lb"), 0) / Math.max(1, ls.length);
          w.style.setProperty("--ub", mean.toFixed(4));
        });
        // lowering the threshold on a blurred copy fattens the letters continuously
        // (kept below 0 so empty space never picks up a faint fill)
        puffFat.current?.setAttribute("intercept", (-2.6 + 1.9 * Math.min(1, air)).toFixed(3));
        puffBlur.current?.setAttribute("stdDeviation", (1.6 + 2.4 * air).toFixed(2));
        puffSpec.current?.setAttribute("surfaceScale", (2 + 3 * air).toFixed(2));
        puffDiff.current?.setAttribute("surfaceScale", (2 + 3 * air).toFixed(2));
        page.current?.style.setProperty("--air", air.toFixed(4));
      }
      if (s.target === 0 && s.amp < 0.003) {
        page.current?.style.setProperty("--b", "0");
        cols.forEach((c) => c.style.setProperty("--b", "0"));
        page.current?.style.setProperty("--air", "0");
        letters.forEach((l) => l.style.setProperty("--lb", "0"));
        balloon.forEach((l) => l.style.removeProperty("font-variation-settings"));
        lines.forEach((w) => w.style.setProperty("--ub", "0"));
        s.raf = 0;
        s.t0 = 0;
        return;
      }
      s.raf = requestAnimationFrame(loop);
    };
    s.raf = requestAnimationFrame(loop);
  }, [mode]);

  useEffect(() => {
    const s = breath.current;
    return () => cancelAnimationFrame(s.raf);
  }, []);

  // Felt: tween the filters' displacement so the fuzz relaxes rather than snapping
  const felt = useRef<SVGFEDisplacementMapElement>(null);
  const fuzz = useRef<SVGFEDisplacementMapElement>(null);
  const feltAmount = useRef(0);
  useEffect(() => {
    const target = mode === "materials" ? 1 : 0;
    const from = feltAmount.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 450);
      const v = from + (target - from) * (1 - Math.pow(1 - t, 3));
      feltAmount.current = v;
      felt.current?.setAttribute("scale", String(2.5 * v));
      fuzz.current?.setAttribute("scale", String(10 * v));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  const sentence = [
    "I am a designer trained in art and engineering, building working objects from ",
    ["materials", "materials"],
    ", ",
    ["sound", "sound"],
    " and ",
    ["living systems", "living"],
    ".",
  ] as const;
  let count = 0;
  const themesOf = (g: ProjectGroup) => new Set(g.records.flatMap((r) => r.themes ?? []));
  const hasThemes = groups.some((g) => themesOf(g).size > 0);
  const shown = active ? groups.filter((g) => themesOf(g).has(active)).length : groups.length;

  return (
    <div ref={page} className="hp-breath hp-surface relative bg-paper text-ink pt-14 md:min-h-[100svh] flex flex-col">
      {/* SVG filters for the materials mode (felt / fuzz) */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        {/* inflate: letters become glossy balloons. Fatten the glyphs (dilate), blur
            them into a soft height map, then light that surface from the top-left */}
        <filter id="hp-puff" x="-15%" y="-40%" width="130%" height="180%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="soft" />
          <feComponentTransfer in="soft" result="fat">
            <feFuncA ref={puffFat} type="linear" slope="6" intercept="-2.6" />
          </feComponentTransfer>
          <feGaussianBlur ref={puffBlur} in="fat" stdDeviation="1.2" result="height" />
          <feDiffuseLighting
            ref={puffDiff}
            in="height"
            surfaceScale="2"
            diffuseConstant="0.75"
            lightingColor="#9bbb4a"
            result="diffuse"
          >
            <feDistantLight azimuth="235" elevation="65" />
          </feDiffuseLighting>
          <feSpecularLighting
            ref={puffSpec}
            in="height"
            surfaceScale="2"
            specularConstant="1.1"
            specularExponent="38"
            lightingColor="#fffbea"
            result="shine"
          >
            <feDistantLight azimuth="235" elevation="58" />
          </feSpecularLighting>
          {/* rubber colour: flat fill + soft shading, so the far side never goes muddy */}
          <feFlood floodColor="#6f8f2c" result="rubber" />
          <feComposite in="rubber" in2="diffuse" operator="arithmetic" k2="0.55" k3="0.6" result="shaded" />
          <feComposite in="shaded" in2="fat" operator="in" result="body" />
          <feComposite in="shine" in2="fat" operator="in" result="gloss" />
          <feComposite in="gloss" in2="body" operator="arithmetic" k2="1" k3="1" result="balloon" />
          {/* soft shadow underneath so it lifts off the paper */}
          <feGaussianBlur in="fat" stdDeviation="3" result="sb" />
          <feOffset in="sb" dy="4" result="so" />
          <feComponentTransfer in="so" result="shadow">
            <feFuncA type="linear" slope="0.25" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="balloon" />
          </feMerge>
        </filter>
        <filter id="hp-felt" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap ref={felt} in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="hp-fuzz" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" seed="8" result="n" />
          <feDisplacementMap ref={fuzz} in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* Statement */}
      <section className="relative px-5 md:px-10 py-7 md:py-8">
        <Tree className="hidden md:block absolute right-0 bottom-0 h-full w-auto" />
        <p
          ref={statement}
          aria-label="I am a designer trained in art and engineering, building working objects from materials, sound and living systems."
          className="hp-statement relative font-sans text-[8vw] md:text-[3vw] leading-[1.05] tracking-tight max-w-[34ch]">
          {sentence.map((part, k) => {
            if (typeof part === "string") {
              const el = <Letters key={k} text={part} start={count} />;
              count += part.length;
              return el;
            }
            const [label, m] = part;
            const el = (
              <button
                key={k}
                type="button"
                aria-pressed={mode === m}
                onMouseEnter={() => setMode(m)}
                onMouseLeave={() => setMode(null)}
                onFocus={() => setMode(m)}
                onBlur={() => setMode(null)}
                onClick={() => setMode(mode === m ? null : m)}
                style={{ "--i0": count, "--n": label.length } as React.CSSProperties}
                className={`focus-visible:outline-none ${m === "living" ? "hp-vine-host hp-inflate relative inline-block whitespace-nowrap" : ""}`}
              >
                {/* underline drawn per word: inline-block letters don't inherit text-decoration */}
                <Letters
                  text={label}
                  start={count}
                  wordClass="hp-kw border-b border-current"
                />
                {m === "living" && (
                  // balloon copy of the words: always filtered, cross-faded in over the
                  // printed letters so they turn into balloons rather than snapping
                  <span aria-hidden="true" className="hp-balloon">
                    <Letters text={label} start={count} wordClass="hp-bkw border-b border-current" />
                  </span>
                )}
                {m === "living" && <Vine />}
              </button>
            );
            count += label.length;
            return el;
          })}
          <CrossStitch targetRef={statement} active={mode === "materials"} />
        </p>
      </section>

      {/* Instrument panel */}
      {hasThemes && (
        <div
          role="group"
          aria-label="Filter projects by theme"
          className="hp-rule border-y border-ink px-5 md:px-10 py-3 flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-[11px] uppercase tracking-wider"
        >
          <span className="text-muted mr-2">Filter</span>
          {THEMES.map((t) => {
            const on = active === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => setActive(on ? null : t)}
                className={`flex items-center gap-2 border px-3 py-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rust ${
                  on ? "border-ink bg-ink text-paper" : "border-rule hover:border-ink"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-1.5 h-1.5 rounded-full ${on ? "bg-rust shadow-[0_0_6px_#A4471F]" : "bg-ink/25"}`}
                />
                {t}
              </button>
            );
          })}
          <span className="ml-auto text-muted" aria-live="polite">
            {active ? `${shown} of ${groups.length} projects` : `All ${groups.length} projects`}
          </span>
        </div>
      )}

      {/* Specimen drawer */}
      <ol
        className={`list-none md:flex-1 grid grid-cols-2 md:[grid-template-columns:repeat(var(--n),minmax(0,1fr))] ${
          hasThemes ? "" : "border-t border-ink"
        }`}
        style={{ "--n": groups.length } as React.CSSProperties}
      >
        {groups.map((g, i) => {
          const lead = g.records[0];
          const process = g.records[1]?.image;
          const dim = active !== null && !themesOf(g).has(active);
          return (
            <li
              key={g.title}
              className={`hp-rule group relative flex flex-col border-b border-r border-ink last:border-r-0 transition-opacity duration-300 ${
                dim ? "opacity-25" : "opacity-100"
              }`}
            >
              {/* the tray */}
              <div className="relative aspect-[4/5] md:aspect-auto md:flex-1 md:min-h-[260px]">
                <CropMarks />
                <span className="absolute top-5 left-7 font-mono text-[10px] uppercase tracking-wider">
                  <span className="text-rust">{projectNo(i)}</span>
                </span>
                {g.records.length > 1 && (
                  <span className="absolute top-5 right-7 font-mono text-[10px] uppercase tracking-wider text-muted">
                    {g.records.length} records
                  </span>
                )}
                <div className="absolute inset-x-6 top-10 bottom-11 md:inset-x-7 md:top-11 md:bottom-12 flex items-center justify-center">
                  <div className="hp-frame relative w-full max-h-full aspect-[4/3] overflow-hidden">
                  {lead.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lead.image}
                      alt=""
                      className={`hp-img absolute inset-0 w-full h-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${
                        process ? "group-hover:opacity-0" : ""
                      }`}
                    />
                  )}
                  {process && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={process}
                      alt=""
                      className="hp-img absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
                    />
                  )}
                  {/* herbarium sheet extras (living systems: herbarium) */}
                  <span aria-hidden="true" className="hp-tape" />
                  <span aria-hidden="true" className="hp-specimen">
                    <em>{SPECIMENS[i % SPECIMENS.length]}</em>
                    <span>Coll. H. Partridge · No. {i + 1}</span>
                  </span>
                  </div>
                </div>
                <Habitat index={i} />
                <Ruler />
              </div>

              {/* the label */}
              <div className="hp-rule border-t border-ink p-4 md:p-5 md:h-[172px] md:overflow-hidden">
                <h2 className="font-sans text-xl md:text-2xl leading-tight transition-colors group-hover:text-rust">
                  {/* stretched link: the whole cell opens the lead record */}
                  <Link
                    href={`/projects/${lead.slug}`}
                    className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:underline"
                  >
                    {g.title}
                  </Link>
                </h2>
                {!!lead.disciplines?.length && (
                  <p className="mt-2 font-mono text-[10px] md:text-[11px] uppercase tracking-wider text-muted">
                    {lead.disciplines.join(" / ")}
                  </p>
                )}
                {lead.summary && <p className="mt-2 font-sans italic text-sm md:text-base leading-snug line-clamp-2">{lead.summary}</p>}
                {g.records.length > 1 && (
                  <p className="relative z-10 mt-3 font-mono text-[10px] uppercase tracking-wider flex gap-3">
                    {g.records.map((r, j) => (
                      <Link key={r._id} href={`/projects/${r.slug}`} className="underline underline-offset-4 hover:text-rust">
                        Record {letter(j)}
                      </Link>
                    ))}
                  </p>
                )}
                {/* the thread winds out along the bottom edge */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 right-0 bottom-0 h-0.5 bg-rust origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
