"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * One shared audio graph for the whole site.
 * - An ambient "voice from the yarn" that plays after Enter with sound
 * - Any other <audio> (e.g. a project's spool) can connect to the same analyser
 * - getLevel() returns a smoothed 0–1 loudness for things like VoiceType
 */

const AMBIENT_SRC = "/assets/harry-grad-movie.mp4"; // placeholder until Harry supplies a clip
const STORAGE_KEY = "hp-entry";

type Choice = "sound" | "quiet" | null;

type SoundCtx = {
  choice: Choice;
  ready: boolean;
  soundOn: boolean;
  enter: (withSound: boolean) => void;
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
  const [choice, setChoice] = useState<Choice>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [ready, setReady] = useState(false);

  const ambient = useRef<HTMLAudioElement>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const connected = useRef(new WeakSet<HTMLMediaElement>());
  const buffer = useRef<Uint8Array | null>(null);
  const level = useRef(0);

  // Remember the entry choice for this browser session only
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY) as Choice;
      // Already entered this session: skip the gate. Audio can't auto-resume
      // without a gesture, so sound starts off and the toggle brings it back.
      if (saved === "quiet" || saved === "sound") setChoice(saved);
    } catch {}
    setReady(true);
  }, []);

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

  const enter = useCallback(
    (withSound: boolean) => {
      const c: Choice = withSound ? "sound" : "quiet";
      setChoice(c);
      try {
        sessionStorage.setItem(STORAGE_KEY, c);
      } catch {}
      if (withSound && ambient.current) {
        connectElement(ambient.current);
        ambient.current.play().catch(() => {});
        setSoundOn(true);
      }
    },
    [connectElement]
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
    <Ctx.Provider value={{ choice, ready, soundOn, enter, toggle, getLevel, connectElement, pauseAmbient }}>
      <audio ref={ambient} src={AMBIENT_SRC} preload="none" onEnded={() => setSoundOn(false)} />
      {children}
    </Ctx.Provider>
  );
}
