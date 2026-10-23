"use client";

import { useEffect, useRef, useState } from "react";
import { useSound } from "./sound/SoundProvider";

/**
 * "Play a spool" — the site's signature interaction.
 * A yarn spool that turns while a voice recording plays, with a single thread that
 * winds out as progress. Playing takes the floor from the ambient voice; if the site's
 * sound is off, pressing play turns it on, since the press is an explicit ask for audio.
 */
export default function SpoolPlayer({ src, label }: { src: string; label?: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const { soundOn, toggle, take, release } = useSound();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    // the element is the truth: it may be paused by the switch or ended on its own
    const onTime = () => setProgress(el.duration ? el.currentTime / el.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => release(el);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnd);
      release(el);
    };
  }, [release]);

  const press = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) {
      if (!soundOn) toggle();
      take(el);
    } else {
      release(el);
    }
  };

  return (
    <div className="flex items-center gap-4 w-full">
      <audio ref={audio} src={src} preload="metadata" crossOrigin="anonymous" />
      <button
        type="button"
        onClick={press}
        aria-label={playing ? "Pause the spool" : label ?? "Play a spool"}
        className="group flex items-center gap-3 shrink-0 font-mono text-xs uppercase tracking-wider text-ink hover:text-rust focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust"
      >
        <svg
          viewBox="0 0 40 40"
          aria-hidden="true"
          className={`w-10 h-10 motion-safe:transition-transform ${
            playing ? "motion-safe:animate-[spin_4s_linear_infinite]" : ""
          }`}
        >
          <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeWidth="1" />
          {[15, 12, 9].map((r) => (
            <circle key={r} cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
          ))}
          <circle cx="20" cy="20" r="3" fill="currentColor" />
          <line x1="20" y1="1" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span aria-hidden="true">{playing ? "Pause" : label ?? "Play a spool"}</span>
      </button>
      {/* the thread */}
      <div className="relative flex-1 h-px bg-rule" aria-hidden="true">
        <div
          className="absolute inset-y-0 left-0 bg-rust"
          style={{ width: `${progress * 100}%`, height: 2, top: -0.5 }}
        />
      </div>
    </div>
  );
}
