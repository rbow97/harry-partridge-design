import { atom } from "nanostores";

/**
 * The site's one audio graph, as a store rather than React context, because the nav,
 * the homepage and a project page are separate islands with no shared React tree.
 *
 * - $soundOn is the visitor's one setting, the Sound switch. It is true while they want
 *   sound, whatever is actually playing, so the switch always tells the truth and turning
 *   it off always silences everything.
 * - The ambient "voice from the yarn" (an <audio id="hp-ambient"> in the layout) plays while
 *   sound is on and nothing else has the floor. A spool or the homepage tape takes the floor
 *   with take(el) (ambient pauses), gives it back with release(el) (ambient resumes).
 * - Everything routes through one analyser, so getLevel() is the loudness of whatever is
 *   playing, for things like VoiceType.
 * There is no entry gate, so clicking the switch is the gesture that unlocks audio.
 */

export const $soundOn = atom(false);

let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let buffer: Uint8Array<ArrayBuffer> | null = null;
let level = 0;
let floor: HTMLMediaElement | null = null; // whoever has taken over from the ambient voice
let embedded = false; // a YouTube or Vimeo player has been started, so the ambient voice stays quiet on this page
const connected = new WeakSet<HTMLMediaElement>();

const ambient = () => (typeof document === "undefined" ? null : document.querySelector<HTMLAudioElement>("#hp-ambient"));

function connect(el: HTMLMediaElement) {
  if (!audioCtx) {
    const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
    audioCtx = new AC();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.connect(audioCtx.destination);
    buffer = new Uint8Array(new ArrayBuffer(analyser.fftSize));
  }
  audioCtx.resume();
  if (connected.has(el)) return;
  audioCtx.createMediaElementSource(el).connect(analyser!);
  connected.add(el);
}

function playAmbient() {
  const el = ambient();
  if (!el || floor || embedded) return;
  connect(el);
  el.play().catch(() => {});
}

export function toggle() {
  const next = !$soundOn.get();
  $soundOn.set(next);
  if (next) {
    // sound back on: whoever had the floor plays again, else the ambient voice
    if (floor) {
      connect(floor);
      floor.play().catch(() => {});
    } else playAmbient();
  } else {
    ambient()?.pause();
    floor?.pause();
  }
}

// a spool or the tape takes over from the ambient voice; it plays only if sound is on
export function take(el: HTMLMediaElement) {
  floor = el;
  ambient()?.pause();
  if (!$soundOn.get()) return;
  connect(el);
  el.play().catch(() => {});
}

export function release(el: HTMLMediaElement) {
  if (floor !== el) return;
  el.pause();
  floor = null;
  if ($soundOn.get()) playAmbient();
}

// an embedded video plays its own sound in an iframe we can't route, so everything else stops
// for the rest of the page. The switch keeps its state, since the visitor still wants sound
export function hush() {
  embedded = true;
  ambient()?.pause();
  floor?.pause();
}

// Read loudness lazily — callers poll this from their own rAF loop
export function getLevel() {
  if (!analyser || !buffer) return 0;
  analyser.getByteTimeDomainData(buffer);
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    const v = (buffer[i] - 128) / 128;
    sum += v * v;
  }
  const rms = Math.sqrt(sum / buffer.length);
  const target = Math.min(1, rms * 5);
  // fast attack, slow release
  level += (target - level) * (target > level ? 0.5 : 0.08);
  return level;
}
