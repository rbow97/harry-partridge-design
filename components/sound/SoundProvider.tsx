"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";

/**
 * One shared audio graph for the whole site.
 * - soundOn is the visitor's one setting, the Sound switch. It is true while they want
 *   sound, whatever is actually playing, so the switch always tells the truth and turning
 *   it off always silences everything.
 * - The ambient "voice from the yarn" plays while sound is on and nothing else has the
 *   floor. A spool or the homepage tape takes the floor with `take(el)` (ambient pauses),
 *   gives it back with `release(el)` (ambient resumes if sound is still on).
 * - Everything routes through one analyser, so getLevel() is the loudness of whatever is
 *   playing, for things like VoiceType.
 * There is no entry gate, so clicking the switch is the gesture that unlocks audio.
 */

const AMBIENT_SRC = "/assets/harry-grad-movie.mp4"; // placeholder until Harry supplies a clip

type SoundCtx = {
  soundOn: boolean;
  toggle: () => void;
  take: (el: HTMLMediaElement) => void;
  release: (el: HTMLMediaElement) => void;
  getLevel: () => number;
};

const Ctx = createContext<SoundCtx | null>(null);

export function useSound() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSound must be used inside <SoundProvider>");
  return ctx;
}

export default function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundOn, setSoundOn] = useState(false);
  const on = useRef(false); // soundOn for callbacks that run outside a render

  const ambient = useRef<HTMLAudioElement>(null);
  const floor = useRef<HTMLMediaElement | null>(null); // whoever has taken over from the ambient voice
  const audioCtx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const connected = useRef(new WeakSet<HTMLMediaElement>());
  const buffer = useRef<Uint8Array | null>(null);
  const level = useRef(0);

  const connect = useCallback((el: HTMLMediaElement) => {
    if (!audioCtx.current) {
      const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
      audioCtx.current = new AC();
      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 1024;
      analyser.current.connect(audioCtx.current.destination);
      buffer.current = new Uint8Array(analyser.current.fftSize);
    }
    audioCtx.current.resume();
    if (connected.current.has(el)) return;
    audioCtx.current.createMediaElementSource(el).connect(analyser.current!);
    connected.current.add(el);
  }, []);

  const playAmbient = useCallback(() => {
    const el = ambient.current;
    if (!el || floor.current) return;
    connect(el);
    el.play().catch(() => {});
  }, [connect]);

  const toggle = useCallback(() => {
    const next = !on.current;
    on.current = next;
    setSoundOn(next);
    if (next) {
      // sound back on: whoever had the floor plays again, else the ambient voice
      if (floor.current) {
        connect(floor.current);
        floor.current.play().catch(() => {});
      } else playAmbient();
    } else {
      ambient.current?.pause();
      floor.current?.pause();
    }
  }, [connect, playAmbient]);

  // a spool or the tape takes over from the ambient voice; it plays only if sound is on
  const take = useCallback(
    (el: HTMLMediaElement) => {
      floor.current = el;
      ambient.current?.pause();
      if (!on.current) return;
      connect(el);
      el.play().catch(() => {});
    },
    [connect]
  );
  const release = useCallback(
    (el: HTMLMediaElement) => {
      if (floor.current !== el) return;
      el.pause();
      floor.current = null;
      if (on.current) playAmbient();
    },
    [playAmbient]
  );

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
    <Ctx.Provider value={{ soundOn, toggle, take, release, getLevel }}>
      {/* the ambient voice loops under the site while sound is on and nothing else is playing */}
      <audio ref={ambient} src={AMBIENT_SRC} preload="none" loop />
      {children}
    </Ctx.Provider>
  );
}
