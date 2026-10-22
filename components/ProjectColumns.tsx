"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import type { ProjectGroup } from "@/lib/group-projects";
import CrossStitch from "./CrossStitch";
import Flock from "./Flock";

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
  // whether the last pointer on a statement word was a finger (see the word buttons)
  const touch = useRef(false);
  // on touch there is no mouseleave, so a tap anywhere outside the statement ends the mode
  useEffect(() => {
    if (!mode) return;
    const off = (e: PointerEvent) => {
      if (e.pointerType === "touch" && !statement.current?.contains(e.target as Node)) setMode(null);
    };
    document.addEventListener("pointerdown", off);
    return () => document.removeEventListener("pointerdown", off);
  }, [mode]);

  // The whole page (nav included) takes on the hovered word — see globals.css.
  // data-mode = the target look (colours transition to it).
  // data-anim = modes whose motion/textures are still on screen; a mode lingers here
  // for EXIT_MS after you leave so it can ease out instead of snapping off.
  const EXIT_MS = 650;
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
    <div className="hp-surface relative bg-paper text-ink pt-14 md:min-h-[100svh] flex flex-col">
      {/* living systems: the tray images take off as a flock */}
      <Flock active={mode === "living"} />
      {/* SVG filters for the materials mode (felt / fuzz) */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
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
                // touch: a tap fires emulated hover and focus before the click, which
                // would toggle the mode straight back off, so touch only listens to taps
                onPointerDown={(e) => (touch.current = e.pointerType === "touch")}
                onMouseEnter={() => !touch.current && setMode(m)}
                onMouseLeave={() => !touch.current && setMode(null)}
                onFocus={() => !touch.current && setMode(m)}
                onBlur={() => !touch.current && setMode(null)}
                onClick={() => setMode(mode === m ? null : m)}
                // hp-living: where the flock takes its bearings from (components/Flock.tsx)
                className={`focus-visible:outline-none ${m === "living" ? "hp-living inline-block whitespace-nowrap" : ""}`}
              >
                {/* underline drawn per word: inline-block letters don't inherit text-decoration */}
                <Letters text={label} start={count} wordClass="hp-kw border-b border-current" />
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
                      data-img="lead"
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
                      data-img="process"
                      className="hp-img absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
                    />
                  )}
                  </div>
                </div>
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
