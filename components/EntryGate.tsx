"use client";

import { useEffect, useState } from "react";
import { useSound } from "./sound/SoundProvider";
import VoiceType from "./VoiceType";

export default function EntryGate() {
  const { choice, ready, enter } = useSound();
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const [skipped, setSkipped] = useState(false);

  // Choice restored from this session before the gate ever showed
  useEffect(() => {
    if (ready && choice && !leaving) setSkipped(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (choice) {
      setLeaving(true);
      const t = setTimeout(() => setGone(true), 900);
      return () => clearTimeout(t);
    }
  }, [choice]);

  if (!ready || gone || skipped) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
      className={`fixed inset-0 z-[60] bg-ink text-paper flex flex-col justify-end transition-opacity duration-700 motion-reduce:transition-none ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        src="/assets/harry-grad-movie.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="relative px-5 md:px-10 pb-12 md:pb-16 max-w-6xl">
        <p className="font-mono text-[11px] uppercase tracking-wider text-paper/70">
          Harry Partridge — Records of a practice
        </p>
        <h1 id="gate-title" className="mt-4 font-sans text-4xl md:text-7xl leading-[1] tracking-tight">
          <VoiceType text="Some of this work speaks. The voices are recorded in yarn." />
        </h1>
        <div className="mt-10 flex flex-wrap items-center gap-6 font-mono text-xs uppercase tracking-wider">
          <button
            autoFocus
            onClick={() => enter(true)}
            className="border border-paper rounded-full px-6 py-3 hover:bg-paper hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper"
          >
            Enter with sound
          </button>
          <button
            onClick={() => enter(false)}
            className="underline underline-offset-4 decoration-paper/40 hover:decoration-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper"
          >
            Enter quietly
          </button>
        </div>
      </div>
    </div>
  );
}
