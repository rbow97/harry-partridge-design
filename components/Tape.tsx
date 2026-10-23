"use client";

import React, { useEffect, useRef } from "react";
import { useSound } from "./sound/SoundProvider";

/**
 * Tape (sound mode): the page becomes a tape machine. A recording runs while you
 * hover: the tray rulers become tape passing a head, with the signal printed on
 * it, the tray images spin as reels (CSS), a timecode counts, and the statement
 * is spoken, letter by letter, from the recording's loudness.
 *
 * The loudness comes from the file itself, decoded once into an envelope, so the
 * letters speak even for visitors who entered quietly. Visitors who entered with
 * sound hear the recording too. Canvas 2D; hidden unless <html data-anim~="sound">.
 */

const SPEED = 70; // px of tape per second
const BLOCK = 0.01; // s per envelope sample
const BAND = 14; // px, tape height
const AHEAD = 0.12; // s the second letter group lags the first, so adjacent letters stutter

function format(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const f = Math.floor((t % 1) * 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${f}`;
}

// decode the recording's audio track into a 100Hz loudness envelope
async function envelope(src: string): Promise<{ env: Float32Array; duration: number } | null> {
  try {
    const buf = await (await fetch(src)).arrayBuffer();
    const ac = new OfflineAudioContext(1, 1, 44100);
    const audio = await ac.decodeAudioData(buf);
    const data = audio.getChannelData(0);
    const per = Math.floor(audio.sampleRate * BLOCK);
    const n = Math.floor(data.length / per);
    const env = new Float32Array(n);
    let peak = 0;
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = i * per; j < (i + 1) * per; j++) sum += data[j] * data[j];
      env[i] = Math.sqrt(sum / per);
      peak = Math.max(peak, env[i]);
    }
    // speech rarely touches its own peak, so scale to a loud-but-common level and
    // lift the curve, or the letters barely move for most of the recording
    const sorted = Float32Array.from(env).sort();
    const loud = sorted[Math.floor(sorted.length * 0.95)] || peak || 1;
    for (let i = 0; i < n; i++) env[i] = Math.sqrt(Math.min(1, env[i] / loud));
    return { env, duration: audio.duration };
  } catch (e) {
    console.warn("tape: could not decode the recording, running a stand-in signal", e);
    return null;
  }
}

// a speech-shaped stand-in for when the file can't be decoded (no codec, offline)
function standIn(t: number) {
  const syllable = 0.5 + 0.5 * Math.sin(t * 9.7) * Math.sin(t * 3.1 + 1);
  const phrase = 0.55 + 0.45 * Math.sin(t * 0.7);
  const breath = Math.sin(t * 0.21) > -0.6 ? 1 : 0;
  return Math.max(0, syllable * phrase * breath);
}

export default function Tape({ active, src }: { active: boolean; src: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const sound = useSound();
  // read through a ref: pausing the ambient voice flips soundOn, and that must not restart the effect
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const tape = useRef<{ env: Float32Array; duration: number } | null | undefined>(undefined);
  const raf = useRef(0);
  const clock = useRef({ start: 0, offset: 0 }); // the silent clock: where the tape is when no audio plays
  const heard = useRef(false); // whether this hover is audible, decided when it starts

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    if (!active) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      audio.current?.pause();
      // the tape stops where it is, so the next hover carries on from there, and
      // the ambient voice comes back if the spool had taken its place
      if (heard.current && !soundRef.current.soundOn) soundRef.current.toggle();
      heard.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let gone = false;
    const level = (t: number) => {
      const s = tape.current;
      if (!s) return standIn(t);
      return s.env[Math.floor(((t % s.duration) + s.duration) % s.duration / BLOCK)] ?? 0;
    };
    const statement = document.querySelector<HTMLElement>(".hp-statement");
    const tc = document.querySelector<HTMLElement>(".hp-tc");
    let rulers = Array.from(document.querySelectorAll<HTMLElement>(".hp-ruler")).map((r) => r.getBoundingClientRect());
    const remeasure = () => (rulers = Array.from(document.querySelectorAll<HTMLElement>(".hp-ruler")).map((r) => r.getBoundingClientRect()));
    addEventListener("scroll", remeasure, { passive: true });

    const play = () => {
      const a = audio.current;
      // audible only while the site's sound is on (the nav toggle, or Enter with sound)
      heard.current = !!a && soundRef.current.soundOn;
      if (!a || !heard.current) return;
      // route through the shared analyser; the ambient voice gives way to the spool
      soundRef.current.connectElement(a);
      soundRef.current.pauseAmbient();
      a.currentTime = clock.current.offset % (a.duration || 1e9);
      a.play().catch(() => {
        heard.current = false;
      });
    };

    const draw = (now: number) => {
      const a = audio.current;
      const playing = !!a && !a.paused && !a.ended;
      const t = playing ? a.currentTime : clock.current.offset + (now - clock.current.start) / 1000;
      const lvl = level(t);
      statement?.style.setProperty("--lvl", lvl.toFixed(3));
      statement?.style.setProperty("--lvl2", level(t - AHEAD).toFixed(3));
      if (tc) tc.textContent = format(t);

      const dpr = devicePixelRatio;
      if (el.width !== innerWidth * dpr || el.height !== innerHeight * dpr) {
        el.width = innerWidth * dpr;
        el.height = innerHeight * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const r of rulers) {
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const x0 = r.left, w = r.width, y0 = r.bottom - BAND;
        ctx.fillStyle = "#26231f";
        ctx.fillRect(x0, y0, w, BAND);
        ctx.fillStyle = "rgba(244,241,234,0.28)";
        ctx.fillRect(x0, y0, w, 1);
        ctx.fillRect(x0, y0 + BAND - 1, w, 1);
        // the signal printed on the tape: left of the head has played, right is still to come
        ctx.fillStyle = "rgba(232,135,94,0.9)";
        const mid = y0 + BAND / 2;
        for (let x = 0; x < w; x += 1) {
          const h = level(t + (x - w / 2) / SPEED) * (BAND - 5);
          if (h > 0.3) ctx.fillRect(x0 + x, mid - h / 2, 1, h);
        }
        // the head
        ctx.fillStyle = "#f4f1ea";
        ctx.fillRect(x0 + w / 2 - 1, y0 - 2, 2, BAND + 4);
      }
      if (!gone) raf.current = requestAnimationFrame(draw);
    };

    const start = () => {
      clock.current.start = performance.now();
      play();
      raf.current = requestAnimationFrame(draw);
    };
    if (tape.current === undefined) {
      tape.current = null; // decoding: the stand-in runs meanwhile
      envelope(src).then((s) => {
        if (s) tape.current = s;
      });
    }
    start();

    return () => {
      gone = true;
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      removeEventListener("scroll", remeasure);
      // remember where the tape got to
      const a = audio.current;
      const playing = !!a && !a.paused;
      clock.current.offset = playing ? a.currentTime : clock.current.offset + (performance.now() - clock.current.start) / 1000;
    };
  }, [active, src]);

  return (
    <>
      <audio ref={audio} src={src} preload="none" crossOrigin="anonymous" />
      <canvas ref={canvas} aria-hidden="true" className="hp-tape" />
    </>
  );
}
