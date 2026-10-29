import React, { useEffect, useRef, useState } from "react";
import type { ProjectGroup } from "@/lib/group-projects";
import { recordLabel } from "@/types/Project";
import CropMarks from "./CropMarks";
import { COLUMNS, trayHeight, trayLayout } from "@/lib/tray-layout";
import CrossStitch from "./CrossStitch";
import Flock from "./Flock";
import Stitch from "./Stitch";
import Tape from "./Tape";

import { FALLBACK, MODE_DESCRIPTIONS, type Mode, type SentencePart } from "@/lib/site";
import { SIZES, sized, srcset } from "@/lib/images";

/** Split text into letters so the page modes can animate them. The letter spans are hidden
 *  from assistive tech and the text is repeated once, visually hidden, so it reads as words */
function Letters({ text, start, wordClass = "" }: { text: string; start: number; wordClass?: string }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      {text.split(/(\s+)/).map((w, wi) =>
        /^\s+$/.test(w) ? (
          w
        ) : (
          <span key={wi} aria-hidden="true" className={`inline-block whitespace-nowrap ${wordClass}`}>
            {Array.from(w).map((ch, ci) => {
              const i = start + text.split(/(\s+)/).slice(0, wi).join("").length + ci;
              return (
                <span
                  key={ci}
                  className="hp-letter relative inline-block"
                  // --i: the letter's index in the sentence, for staggered transitions
                  style={{ "--i": i } as React.CSSProperties}
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

// statement and ambient come from Site settings in Studio, falling back to what the site shipped with (lib/site.ts)
export default function ProjectColumns({
  groups,
  statement: sentence = FALLBACK.statement,
  ambient = FALLBACK.ambient,
}: {
  groups: ProjectGroup[];
  statement?: SentencePart[];
  ambient?: string;
}) {
  const [mode, setMode] = useState<Mode | null>(null);
  // Hover intent, both ways. A word takes over only once the pointer rests on it, so brushing past
  // one on the way somewhere else doesn't flash the whole page into its mode. Leaving waits a
  // moment too, so moving word to word goes straight across instead of easing back to paper
  // in the gap. Keyboard focus is a clear intent, so it switches at once
  const leaving = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const entering = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const enter = (m: Mode, now = false) => {
    clearTimeout(leaving.current);
    clearTimeout(entering.current);
    if (now) setMode(m);
    else entering.current = setTimeout(() => setMode(m), 110);
  };
  const leave = () => {
    clearTimeout(entering.current);
    clearTimeout(leaving.current);
    leaving.current = setTimeout(() => setMode(null), 160);
  };
  const statement = useRef<HTMLHeadingElement>(null);
  // whether the last pointer on a statement word was a finger (see the word buttons)
  const touch = useRef(false);
  // a click pins a mode, so the cursor can leave the word and roam the page in it (the
  // flock follows the cursor, the needle stitches where it goes). A tap does the same.
  // Clicking the word again, clicking anywhere that isn't one of the three words, or
  // Escape releases it
  const [pinned, setPinned] = useState<Mode | null>(null);
  // what a pinned mode does, read out by screen readers: the change is all visual, and a pressed
  // button alone doesn't say what happened to the page. Announced on pin and release only, so
  // passing over the words with a pointer stays quiet
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    setAnnouncement(pinned ? MODE_DESCRIPTIONS[pinned] : announcement ? "Mode off." : "");
  }, [pinned]);
  useEffect(() => {
    if (!mode) return;
    const off = (e: PointerEvent) => {
      // the words themselves handle their own clicks, and the bar's controls shouldn't release a pin
      if ((e.target as Element | null)?.closest?.(".hp-statement button, header")) return;
      if (pinned || e.pointerType === "touch") {
        setPinned(null);
        setMode(null);
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPinned(null);
        setMode(null);
      }
    };
    document.addEventListener("pointerdown", off);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", off);
      document.removeEventListener("keydown", esc);
    };
  }, [mode, pinned]);

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

  // Felt: tween the photo fuzz's displacement so it relaxes rather than snapping
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
      fuzz.current?.setAttribute("scale", String(10 * v));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  let count = 0;
  const trays = trayLayout(groups.length);

  // where the drawer starts on the page, for the hero tray's height (see lib/tray-layout.ts)
  const drawer = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const ol = drawer.current;
    if (!ol) return;
    const measure = () => ol.style.setProperty("--drawer-top", `${Math.round(ol.getBoundingClientRect().top + window.scrollY)}px`);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="hp-surface relative bg-paper text-ink pt-14 md:min-h-[100svh] flex flex-col">
      {/* living systems: the tray images take off as a flock */}
      {/* leaving the flock for sound, it lands on the reels rather than the photos */}
      <Flock active={mode === "living"} land={mode === "sound" ? "reel" : "photo"} />
      {/* materials: the header is cloth; once the word is clicked (pinned), the cursor sews it and the rules */}
      <Stitch cloth={mode === "materials"} sewing={mode === "materials" && pinned === "materials"} />
      {/* sound: the page runs a recording like a tape machine */}
      <Tape
        active={mode === "sound"}
        audible={pinned === "sound"}
        // the recording the sound hover runs: the first record with a spool, else the ambient voice
        src={groups.flatMap((g) => g.records).find((r) => r.audio)?.audio ?? ambient}
      />
      {/* SVG filters for the materials mode (felt / fuzz) */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <filter id="hp-fuzz" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" seed="8" result="n" />
          <feDisplacementMap ref={fuzz} in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* Statement */}
      {/* inset to the photo edge in the trays below (their wells are inset-x-6 / md:inset-x-7) */}
      <section className="relative px-6 md:px-7 py-7 md:py-8">
        {/* the statement is the page's heading; phones centre it, from md it sits on the shared left edge */}
        <h1
          ref={statement}
          className="hp-statement relative font-sans font-normal text-display leading-[1.05] tracking-tight max-w-[34ch] text-center md:text-left mx-auto md:mx-0 m-0">
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
                aria-pressed={pinned === m}
                aria-describedby="hp-mode-hint"
                // touch: a tap fires emulated hover and focus before the click, which
                // would toggle the mode straight back off, so touch only listens to taps
                onPointerDown={(e) => (touch.current = e.pointerType === "touch")}
                // hover is the word alone; to keep a mode on while the cursor roams, click (pin)
                onMouseEnter={() => !touch.current && !pinned && enter(m)}
                onMouseLeave={() => !touch.current && !pinned && leave()}
                onFocus={() => !touch.current && !pinned && enter(m, true)}
                onBlur={() => !touch.current && !pinned && leave()}
                onClick={() => {
                  clearTimeout(leaving.current);
                  clearTimeout(entering.current);
                  const release = pinned === m;
                  setPinned(release ? null : m);
                  setMode(release ? null : m);
                }}
                // hp-living: where the flock takes its bearings from (components/Flock.tsx)
                // a clean name for the button: its letters are spans, and the sentence's own
                // letters are hidden from readers in favour of plain text (see Letters)
                aria-label={label}
                // the focus ring is the accent and offset, so it shows in every mode, including
                // materials where the letters themselves go transparent
                className={`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${
                  m === "living" ? "hp-living inline-block whitespace-nowrap" : ""
                }`}
              >
                {/* underline drawn per word: inline-block letters don't inherit text-decoration */}
                <Letters text={label} start={count} wordClass="hp-kw border-b border-current" />
              </button>
            );
            count += label.length;
            return el;
          })}
          <CrossStitch targetRef={statement} active={mode === "materials"} />
        </h1>
        {/* sound: the tape's timecode, a readout in the corner of the statement (written per frame in Tape.tsx) */}
        <span
          aria-hidden="true"
          className="hp-tc absolute right-6 md:right-7 bottom-3 font-mono text-label uppercase tracking-wider tabular-nums"
        >
          00:00.0
        </span>
        {/* the words are buttons: this says what they do, and the live region says what just happened */}
        <p id="hp-mode-hint" className="sr-only">
          Shows the site in this mode. Press to keep it on, press again to turn it off.
        </p>
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </section>

      {/* Specimen drawer: four trays across on a 12-column grid, and every row is full
          because the trays that don't divide by four come first and wider (lib/tray-layout.ts) */}
      {/* phones: one specimen per row, its photo running edge to edge between the rules */}
      <ol ref={drawer} className="list-none md:flex-1 grid grid-cols-1 md:grid-cols-12 border-t border-ink">
        {groups.map((g, i) => {
          const lead = g.records[0];
          const { span, rowEnd } = trays[i];
          // a full-width tray is laid out as a record sheet: photo on the left, label beside it
          const sheet = span === COLUMNS;
          return (
            <li
              key={g.title}
              data-sheet={sheet || undefined}
              style={{ "--span": span, "--tray": trayHeight(span) } as React.CSSProperties}
              className={`hp-tray hp-rule group relative flex flex-col border-b md:border-r border-ink [&:has(a:focus-visible)]:outline [&:has(a:focus-visible)]:outline-2 [&:has(a:focus-visible)]:-outline-offset-2 [&:has(a:focus-visible)]:outline-accent ${
                rowEnd ? "md:border-r-0" : ""
              } ${sheet ? "md:flex-row" : ""}`}
            >
              {/* the tray */}
              <div className={`relative pt-12 pb-12 md:p-0 md:min-h-[var(--tray)] ${sheet ? "md:w-2/3" : "md:flex-1"}`}>
                <CropMarks />
                {/* the development records live at the end of the project's page, so the tray only says they're there */}
                {g.records.length > 1 && (
                  <span className="hp-tag absolute top-5 right-7 font-mono text-label uppercase tracking-wider text-muted">
                    + {g.records.length === 2 ? recordLabel(g.records[1]) : `${g.records.length - 1} records`}
                  </span>
                )}
                {/* hp-well: a size container, so the reel clip can be sized from the frame's real dimensions */}
                <div
                  // on phones the well is in flow and full width, so the 4:3 frame fills the tray wall to wall
                  className={`hp-well relative md:absolute md:inset-x-7 md:top-11 md:bottom-12 flex items-center ${
                    sheet ? "justify-start" : "justify-center"
                  }`}
                >
                  <div className="hp-frame relative w-full max-h-full aspect-[4/3] overflow-hidden">
                  {lead.image && (
                    <img
                      src={sized(lead.image, 960)}
                      srcSet={srcset(lead.image)}
                      // a tray crops its photo to fill it, so ask for the width it shows at, not the tray's
                      sizes={sheet ? SIZES.heroTray : SIZES.tray}
                      // the first row is on screen at once, the rest load as they're scrolled to
                      loading={i < 4 ? "eager" : "lazy"}
                      decoding="async"
                      alt=""
                      data-img="lead"
                      className="hp-img absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  </div>
                </div>
                <Ruler />
              </div>

              {/* the label: under the tray, or beside it on a sheet, where it has room to say more */}
              <div
                className={`hp-rule border-t border-ink p-4 md:p-5 ${
                  sheet ? "md:w-1/3 md:border-t-0 md:border-l md:p-8 md:flex md:flex-col md:justify-end" : "md:h-[10.75rem] md:overflow-hidden"
                }`}
              >
                <h2 className={`font-sans leading-tight transition-colors group-hover:text-accent text-lead`}>
                  {/* stretched link: the whole cell opens the lead record */}
                  <a
                    href={`/projects/${lead.slug}`}
                    // the link is the whole cell, so the cell shows the focus ring (see the li)
                    className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:underline"
                  >
                    {g.title}
                  </a>
                </h2>
                {!!lead.disciplines?.length && (
                  <p className="mt-2 font-mono text-label uppercase tracking-wider text-muted">
                    {lead.disciplines.join(" / ")}
                  </p>
                )}
                {lead.summary && (
                  <p className={`mt-2 font-sans italic leading-snug ${sheet ? "md:mt-4 text-body max-w-[36ch]" : "text-small line-clamp-2"}`}>
                    {lead.summary}
                  </p>
                )}
                {/* the thread winds out along the bottom edge */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 right-0 bottom-0 h-0.5 bg-accent origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
