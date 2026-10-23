"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";

/**
 * One shared audio graph for the whole site.
 * - An ambient "voice from the yarn" behind the nav's Sound switch (off until clicked:
 *   there is no entry gate, so the switch is the gesture that unlocks audio)
 * - Any other <audio> (a project's spool, the homepage tape) can connect to the same analyser
 * - getLevel() returns a smoothed 0–1 loudness for things like VoiceType
 */

const AMBIENT_SRC = "/assets/harry-grad-movie.mp4"; // placeholder until Harry supplies a clip

type SoundCtx = {
  soundOn: boolean;
  toggle: () => void;
  getLevel: () => number;
  connectElement: (el: HTMLMediaElement) => void;
  pauseAmbient: () => void;
};

const Ctx = createContext<SoundCtx | null>(null);

export function useSound() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSound must be used inside <SoundProvider>");
  return ctx;
}

export default function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundOn, setSoundOn] = useState(false);

  const ambient = useRef<HTMLAudioElement>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const connected = useRef(new WeakSet<HTMLMediaElement>());
  const buffer = useRef<Uint8Array | null>(null);
  const level = useRef(0);

  const ensureGraph = useCallback(() => {
    if (!audioCtx.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx.current = new AC();
      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 1024;
      analyser.current.connect(audioCtx.current.destination);
      buffer.current = new Uint8Array(analyser.current.fftSize);
    }
    audioCtx.current.resume();
  }, []);

  const connectElement = useCallback(
    (el: HTMLMediaElement) => {
      ensureGraph();
      if (connected.current.has(el)) return;
      const src = audioCtx.current!.createMediaElementSource(el);
      src.connect(analyser.current!);
      connected.current.add(el);
    },
    [ensureGraph]
  );

  const toggle = useCallback(() => {
    const el = ambient.current;
    if (!el) return;
    if (el.paused) {
      connectElement(el);
      el.play().catch(() => {});
      setSoundOn(true);
    } else {
      el.pause();
      setSoundOn(false);
    }
  }, [connectElement]);

  const pauseAmbient = useCallback(() => {
    ambient.current?.pause();
    setSoundOn(false);
  }, []);

  // Read loudness lazily — callers poll this from their own rAF loop
  const getLevel = useCallback(() => {
    const a = analyser.current;
    const buf = buffer.current;
    if (!a || !buf) return 0;
    a.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / buf.length);
    const target = Math.min(1, rms * 5);
    // fast attack, slow release
    level.current += (target - level.current) * (target > level.current ? 0.5 : 0.08);
    return level.current;
  }, []);

  return (
    <Ctx.Provider value={{ soundOn, toggle, getLevel, connectElement, pauseAmbient }}>
      <audio ref={ambient} src={AMBIENT_SRC} preload="none" onEnded={() => setSoundOn(false)} />
      {children}
    </Ctx.Provider>
  );
}
