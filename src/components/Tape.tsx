import React, { useEffect, useRef } from "react";
import { release, take } from "@/stores/sound";

/**
 * Tape (sound mode): the page becomes a tape machine. A recording runs while you
 * hover: the tray rulers become tape passing a head with the signal printed on it,
 * the tray images turn as reels, and a timecode counts.
 *
 * The signal comes from the file itself, decoded once into a loudness envelope, so
 * the tape shows it with the site's sound off. With sound on (the nav switch) the
 * recording plays too. Canvas 2D; hidden unless <html data-mode="sound">.
 */

const SPEED = 70; // px of tape per second
const BLOCK = 0.01; // s per envelope sample
const BAND = 14; // px, tape height

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

// the trays, and turning their reels: --reel is read by the .hp-img transform
const trays = () => Array.from(document.querySelectorAll<HTMLElement>("ol > li"));
const turn = (angles: number[]) => trays().forEach((li, i) => li.style.setProperty("--reel", `${(angles[i] ?? 0).toFixed(2)}deg`));
// how open each reel is (--open in global.css), set here only on the way out of the mode
const open = (v: number | null) =>
  trays().forEach((li) => (v === null ? li.style.removeProperty("--open") : li.style.setProperty("--open", v.toFixed(3))));
// each reel's speed in deg/s: slow, a turn every 18 to 27 seconds, neighbours the other way
const speed = (i: number) => ((i % 2 ? -1 : 1) * 360) / (18 + i * 3);

export default function Tape({ active, audible, src }: { active: boolean; audible: boolean; src: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const tape = useRef<{ env: Float32Array; duration: number } | null | undefined>(undefined);
  const raf = useRef(0);
  const clock = useRef({ start: 0, offset: 0 }); // the silent clock: where the tape is when no audio plays
  // the reels' angles, kept between hovers so a reel never jumps; written to --reel on each tray
  const reels = useRef<number[]>([]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    // held for the cleanup, which runs after the refs may have moved on
    const spool = audio.current;
    const clk = clock.current;
    if (!el || !ctx) return;
    if (!active) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      // the tape stops where it is, so the next hover carries on from there, and gives
      // the floor back to the ambient voice
      if (spool) release(spool);
      // Out of the mode in three moves, each starting from rest so none jolts. Each record coasts to
      // a stop wherever it gets to, slowing evenly from its playing speed. Still a record, it turns
      // back upright, the short way. Only then does it open out into its photo. --open is held at 0
      // from here, before the mode leaves <html>, so the photo doesn't pop open on the frame between
      const from = reels.current.slice();
      if (!from.some((a) => a !== 0) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        reels.current = reels.current.map(() => 0);
        turn(reels.current);
        open(null);
        return;
      }
      open(0);
      const STOP = 700; // ms coasting to rest
      const TURN = 1000; // ms turning back upright
      const OPEN = 1000; // ms opening into the photo
      const v0 = from.map((_, i) => speed(i));
      const rest = from.map((a, i) => a + (v0[i] * STOP) / 2000); // an even slowdown covers half the distance
      const up = rest.map((a) => Math.round(a / 360) * 360);
      const t0 = performance.now();
      const step = (now: number) => {
        const t = now - t0;
        if (t < STOP) {
          const u = t / STOP;
          reels.current = from.map((a, i) => a + v0[i] * (STOP / 1000) * (u - (u * u) / 2));
          open(0);
        } else if (t < STOP + TURN) {
          const u = (t - STOP) / TURN;
          const level = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
          reels.current = rest.map((a, i) => a + (up[i] - a) * level);
          open(0);
        } else {
          const u = Math.min(1, (t - STOP - TURN) / OPEN);
          reels.current = up.slice();
          open(1 - (1 - u) ** 3);
        }
        turn(reels.current);
        if (t < STOP + TURN + OPEN) raf.current = requestAnimationFrame(step);
        else {
          reels.current = reels.current.map(() => 0);
          turn(reels.current);
          open(null);
          raf.current = 0;
        }
      };
      raf.current = requestAnimationFrame(step);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let gone = false;
    const level = (t: number) => {
      const s = tape.current;
      if (!s) return standIn(t);
      return s.env[Math.floor(((t % s.duration) + s.duration) % s.duration / BLOCK)] ?? 0;
    };
    const tc = document.querySelector<HTMLElement>(".hp-tc");
    let rulers = Array.from(document.querySelectorAll<HTMLElement>(".hp-ruler")).map((r) => r.getBoundingClientRect());
    const remeasure = () => (rulers = Array.from(document.querySelectorAll<HTMLElement>(".hp-ruler")).map((r) => r.getBoundingClientRect()));
    addEventListener("scroll", remeasure, { passive: true });

    // the recording is only heard once the word is pinned by a click or tap: hovering, and
    // Tabbing onto the word, run the tape silently. The provider decides whether sound is on
    const play = () => {
      const a = audio.current;
      if (!a || !audible) return;
      a.currentTime = clock.current.offset % (a.duration || 1e9);
      take(a);
    };

    // back in the mode mid-way out: hand --open back to the CSS, which eases it shut. On the next
    // frame, once <html> carries the mode again, so it closes rather than flicking open first
    requestAnimationFrame(() => open(null));

    let lastFrame = performance.now();
    const draw = (now: number) => {
      const a = audio.current;
      const playing = !!a && !a.paused && !a.ended;
      const t = playing ? a.currentTime : clock.current.offset + (now - clock.current.start) / 1000;
      // each reel at its own speed, neighbours the other way
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      const n = trays().length;
      if (reels.current.length !== n) reels.current = Array.from({ length: n }, (_, i) => reels.current[i] ?? 0);
      reels.current = reels.current.map((ang, i) => ang + speed(i) * dt);
      turn(reels.current);
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
      cancelAnimationFrame(raf.current); // a settle still running from the last exit
      clock.current.start = performance.now();
      lastFrame = clock.current.start;
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
      const playing = !!spool && !spool.paused;
      clk.offset = playing ? spool.currentTime : clk.offset + (performance.now() - clk.start) / 1000;
    };
  }, [active, audible, src]);

  return (
    <>
      <audio ref={audio} src={src} preload="none" crossOrigin="anonymous" />
      <canvas ref={canvas} aria-hidden="true" className="hp-tape" />
    </>
  );
}
