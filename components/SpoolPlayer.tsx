"use client";

import { useEffect, useRef, useState } from "react";
import { useSound } from "./sound/SoundProvider";

/**
 * "Play a spool" — the site's signature interaction.
 * A yarn spool that turns while a voice recording plays,
 * with a single thread that winds out as progress.
 */
export default function SpoolPlayer({ src, label }: { src: string; label?: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const { connectElement, pauseAmbient } = useSound();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const onTime = () => setProgress(el.duration ? el.currentTime / el.duration : 0);
    const onEnd = () => setPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) {
      // route through the shared analyser so the title speaks too
      connectElement(el);
      pauseAmbient();
      el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="flex items-center gap-4 w-full">
      <audio ref={audio} src={src} preload="metadata" crossOrigin="anonymous" />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
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
        <span>{playing ? "Pause" : label ?? "Play a spool"}</span>
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
