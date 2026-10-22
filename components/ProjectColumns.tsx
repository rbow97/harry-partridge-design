"use client";

import Link from "next/link";
import React, { useState } from "react";
import type { ProjectGroup } from "@/lib/group-projects";

const THEMES = ["materials", "sound", "living systems"] as const;
type Theme = (typeof THEMES)[number];

const projectNo = (i: number) => `HP–${String(i + 1).padStart(3, "0")}`;
const letter = (j: number) => String.fromCharCode(65 + j);

/** Corner crop marks, like a technical drawing or specimen tray */
function CropMarks() {
  const mark = "absolute w-3 h-3 border-ink/50";
  return (
    <span aria-hidden="true">
      <span className={`${mark} top-3 left-3 border-t border-l`} />
      <span className={`${mark} top-3 right-3 border-t border-r`} />
      <span className={`${mark} bottom-3 left-3 border-b border-l`} />
      <span className={`${mark} bottom-3 right-3 border-b border-r`} />
    </span>
  );
}

/** A ruler along the bottom of the tray */
function Ruler() {
  return (
    <span aria-hidden="true" className="absolute left-6 right-6 bottom-6 h-2.5 flex items-end">
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
  const themesOf = (g: ProjectGroup) => new Set(g.records.flatMap((r) => r.themes ?? []));
  const hasThemes = groups.some((g) => themesOf(g).size > 0);
  const shown = active ? groups.filter((g) => themesOf(g).has(active)).length : groups.length;

  return (
    <div className="bg-paper text-ink pt-[72px] md:pt-[93px] md:min-h-[100svh] flex flex-col">
      {/* Statement */}
      <section className="px-5 md:px-10 py-7 md:py-8">
        <p className="font-sans text-[8vw] md:text-[3vw] leading-[1.05] tracking-tight max-w-[34ch]">
          I am a designer trained in art and engineering, building working objects from materials, sound and living
          systems.
        </p>
      </section>

      {/* Instrument panel */}
      {hasThemes && (
        <div
          role="group"
          aria-label="Filter projects by theme"
          className="border-y border-ink px-5 md:px-10 py-3 flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-[11px] uppercase tracking-wider"
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
              className={`group relative flex flex-col border-b border-r border-ink last:border-r-0 transition-opacity duration-300 ${
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
                  <div className="relative w-full max-h-full aspect-[4/3]">
                  {lead.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lead.image}
                      alt=""
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${
                        process ? "group-hover:opacity-0" : ""
                      }`}
                    />
                  )}
                  {process && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={process}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
                    />
                  )}
                  </div>
                </div>
                <Ruler />
              </div>

              {/* the label */}
              <div className="border-t border-ink p-4 md:p-5 md:h-[172px] md:overflow-hidden">
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
