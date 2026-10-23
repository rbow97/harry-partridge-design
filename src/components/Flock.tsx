import React, { useEffect, useRef } from "react";

/**
 * Flock (living systems mode): the specimen images dissolve into particles that
 * flock around the cursor as boids (separation, alignment, cohesion), and fly
 * home to re-form the images when you leave. A flock is a living system in the
 * plain sense: simple agents, emergent behaviour, nothing in charge.
 * Canvas 2D; shown while <html data-flock> is set, which is whenever the
 * particles are off their pixels.
 */

const STEP = 10; // px between sampled particles
const SIZE = 2.8; // px, drawn as squares
const PERCEPTION = 48; // px a boid can see
const SEPARATION = 22; // px a boid wants clear around it
const MAX_SPEED = 260;
const MIN_SPEED = 90;
const NEIGHBOURS = 10; // cap per boid, keeps the frame cheap at thousands of boids
const WEIGHT = { sep: 2.4, ali: 1.0, coh: 0.5, cursor: 0.4, noise: 0.35 };
// the cursor pulls gently from far off and pushes back up close, so the flock wheels
// around it in a loose cloud rather than packing into a ball
const ORBIT = 260;

type Sim = {
  n: number;
  px: Float32Array;
  py: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  hx: Float32Array;
  hy: Float32Array;
  // particles sorted by colour so each colour is one fill call
  order: Int32Array;
  colours: string[];
  starts: Int32Array;
};

// a small copy of the image is plenty at one particle per 10px, and the originals are print size
function load(src: string) {
  return new Promise<HTMLImageElement | null>((res) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => res(null);
    try {
      const u = new URL(src);
      if (u.hostname === "cdn.sanity.io") {
        u.searchParams.set("w", "600");
        u.searchParams.set("auto", "format");
      }
      img.src = u.toString();
    } catch {
      img.src = src;
    }
  });
}

// Where a tray's photo sits while the flock is out. On a pointer device it's the whole tray (the
// living mode keeps the photos at full size), measured from the tray itself rather than the frame,
// which may still be easing back out from a hover. Touch keeps the framed photo, so measure that
function frameRect(f: HTMLElement): DOMRect {
  const tray = f.closest(".hp-tray")?.firstElementChild;
  if (getComputedStyle(f).position !== "absolute" || !tray) return f.getBoundingClientRect();
  return tray.getBoundingClientRect();
}

// sample every visible tray image, cover-fitted like the real one, into particles
async function sample(): Promise<Sim | null> {
  const frames = Array.from(document.querySelectorAll<HTMLElement>(".hp-frame"));
  const pts: number[] = []; // x, y, bucket
  const buckets = new Map<number, string>();
  for (const f of frames) {
    const img = f.querySelector<HTMLImageElement>('img[data-img="lead"]');
    const rect = frameRect(f);
    if (!img || rect.bottom < 0 || rect.top > innerHeight) continue;
    const pic = await load(img.src);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    let data: Uint8ClampedArray | null = null;
    if (pic) {
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const c = off.getContext("2d");
      const s = Math.max(w / pic.naturalWidth, h / pic.naturalHeight);
      c?.drawImage(pic, (w - pic.naturalWidth * s) / 2, (h - pic.naturalHeight * s) / 2, pic.naturalWidth * s, pic.naturalHeight * s);
      try {
        data = c?.getImageData(0, 0, w, h).data ?? null;
      } catch {
        data = null; // tainted canvas: fall back to ink
      }
    }
    for (let y = STEP / 2; y < h; y += STEP) {
      for (let x = STEP / 2; x < w; x += STEP) {
        const i = (Math.floor(y) * w + Math.floor(x)) * 4;
        const r = data ? data[i] : 26;
        const g = data ? data[i + 1] : 26;
        const b = data ? data[i + 2] : 23;
        // 4 bits per channel is plenty at this size and keeps the fill calls down
        const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
        if (!buckets.has(key)) buckets.set(key, `rgb(${(r >> 4) * 17},${(g >> 4) * 17},${(b >> 4) * 17})`);
        pts.push(rect.left + x, rect.top + y, key);
      }
    }
  }
  const n = pts.length / 3;
  if (!n) return null;
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => pts[a * 3 + 2] - pts[b * 3 + 2]);
  const colours: string[] = [];
  const starts: number[] = [];
  let last = -1;
  idx.forEach((p, k) => {
    const key = pts[p * 3 + 2];
    if (key !== last) {
      colours.push(buckets.get(key)!);
      starts.push(k);
      last = key;
    }
  });
  starts.push(n);
  const sim: Sim = {
    n,
    px: new Float32Array(n),
    py: new Float32Array(n),
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    hx: new Float32Array(n),
    hy: new Float32Array(n),
    order: Int32Array.from(idx),
    colours,
    starts: Int32Array.from(starts),
  };
  for (let i = 0; i < n; i++) {
    sim.hx[i] = sim.px[i] = pts[i * 3];
    sim.hy[i] = sim.py[i] = pts[i * 3 + 1];
    sim.vx[i] = (Math.random() - 0.5) * 60;
    sim.vy[i] = (Math.random() - 0.5) * 60;
  }
  return sim;
}

export default function Flock({ active }: { active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sim = useRef<Sim | null>(null);
  const phase = useRef<"idle" | "flock" | "home">("idle");
  // no window on the server: start at the origin and take the word's position when the mode opens
  const cursor = useRef<[number, number]>([0, 0]);
  const raf = useRef(0);
  const run = useRef(0); // bumps on every change, so a stale sample is thrown away
  // each particle's way home. A ref, because the loop that reads it may be one started by an
  // earlier run of the effect below, still going when the mode closes
  const homing = useRef({ t: 0, delay: new Float32Array(0), stiff: new Float32Array(0), damp: new Float32Array(0) });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const me = ++run.current;
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;

    const draw = () => {
      const s = sim.current;
      if (!s) return;
      const dpr = devicePixelRatio;
      if (el.width !== innerWidth * dpr || el.height !== innerHeight * dpr) {
        el.width = innerWidth * dpr;
        el.height = innerHeight * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let b = 0; b < s.colours.length; b++) {
        ctx.fillStyle = s.colours[b];
        ctx.beginPath();
        for (let k = s.starts[b]; k < s.starts[b + 1]; k++) {
          const i = s.order[k];
          ctx.rect(s.px[i] - SIZE / 2, s.py[i] - SIZE / 2, SIZE, SIZE);
        }
        ctx.fill();
      }
    };

    // boids on a spatial grid: each boid only looks at the cells around it
    const cols = Math.ceil(innerWidth / PERCEPTION) + 2;
    const rows = Math.ceil(innerHeight / PERCEPTION) + 2;
    let head = new Int32Array(cols * rows);
    let next = new Int32Array(0);
    const flock = (dt: number) => {
      const s = sim.current!;
      if (next.length !== s.n) next = new Int32Array(s.n);
      head.fill(-1);
      for (let i = 0; i < s.n; i++) {
        const cx = Math.min(cols - 1, Math.max(0, Math.floor(s.px[i] / PERCEPTION) + 1));
        const cy = Math.min(rows - 1, Math.max(0, Math.floor(s.py[i] / PERCEPTION) + 1));
        const c = cy * cols + cx;
        next[i] = head[c];
        head[c] = i;
      }
      const [mx, my] = cursor.current;
      for (let i = 0; i < s.n; i++) {
        let sx = 0, sy = 0, ax = 0, ay = 0, cxs = 0, cys = 0, count = 0;
        const cx = Math.min(cols - 1, Math.max(0, Math.floor(s.px[i] / PERCEPTION) + 1));
        const cy = Math.min(rows - 1, Math.max(0, Math.floor(s.py[i] / PERCEPTION) + 1));
        for (let oy = -1; oy <= 1 && count < NEIGHBOURS; oy++) {
          for (let ox = -1; ox <= 1 && count < NEIGHBOURS; ox++) {
            const yy = cy + oy, xx = cx + ox;
            if (yy < 0 || yy >= rows || xx < 0 || xx >= cols) continue;
            for (let j = head[yy * cols + xx]; j !== -1 && count < NEIGHBOURS; j = next[j]) {
              if (j === i) continue;
              const dx = s.px[j] - s.px[i], dy = s.py[j] - s.py[i];
              const d2 = dx * dx + dy * dy;
              if (d2 > PERCEPTION * PERCEPTION || d2 === 0) continue;
              const d = Math.sqrt(d2);
              if (d < SEPARATION) {
                sx -= dx / d * (1 - d / SEPARATION);
                sy -= dy / d * (1 - d / SEPARATION);
              }
              ax += s.vx[j];
              ay += s.vy[j];
              cxs += dx;
              cys += dy;
              count++;
            }
          }
        }
        let fx = sx * WEIGHT.sep * 100, fy = sy * WEIGHT.sep * 100;
        if (count) {
          fx += (ax / count - s.vx[i]) * WEIGHT.ali + (cxs / count) * WEIGHT.coh * 2;
          fy += (ay / count - s.vy[i]) * WEIGHT.ali + (cys / count) * WEIGHT.coh * 2;
        }
        // the cursor: drawn toward it from a distance, nudged off it up close, so they wheel around it
        const tx = mx - s.px[i], ty = my - s.py[i];
        const td = Math.hypot(tx, ty) || 1;
        const pull = td > ORBIT ? Math.min(1, (td - ORBIT) / 250) : td < ORBIT / 3 ? -0.8 : 0;
        fx += (tx / td) * pull * WEIGHT.cursor * 120;
        fy += (ty / td) * pull * WEIGHT.cursor * 120;
        fx += (Math.random() - 0.5) * WEIGHT.noise * 200;
        fy += (Math.random() - 0.5) * WEIGHT.noise * 200;
        // stay on the page
        const m = 30;
        if (s.px[i] < m) fx += (m - s.px[i]) * 8;
        if (s.px[i] > innerWidth - m) fx -= (s.px[i] - innerWidth + m) * 8;
        if (s.py[i] < m + 56) fy += (m + 56 - s.py[i]) * 8;
        if (s.py[i] > innerHeight - m) fy -= (s.py[i] - innerHeight + m) * 8;

        s.vx[i] += fx * dt * 3;
        s.vy[i] += fy * dt * 3;
        const sp = Math.hypot(s.vx[i], s.vy[i]) || 1;
        const clamped = Math.min(MAX_SPEED, Math.max(MIN_SPEED, sp));
        s.vx[i] *= clamped / sp;
        s.vy[i] *= clamped / sp;
        s.px[i] += s.vx[i] * dt;
        s.py[i] += s.vy[i] * dt;
      }
    };

    // fly home, each in its own time: a staggered start, a spring of its own, and the speed it had
    // in the flock carried in, so they stream back in curves and settle one by one, the way birds
    // come in to roost, rather than all sliding home together. Settled when everyone is within a
    // pixel and still, and never longer than HOME_MAX, when any stragglers are set down
    const HOME_MAX = 3;
    const setOff = () => {
      const n = sim.current!.n;
      const way = { t: 0, delay: new Float32Array(n), stiff: new Float32Array(n), damp: new Float32Array(n) };
      for (let i = 0; i < n; i++) {
        way.delay[i] = Math.random() ** 2 * 0.7; // most leave at once, a few hang back
        way.stiff[i] = 14 + Math.random() * 34;
        // a little under critical damping for some, so they overshoot and settle
        way.damp[i] = 2 * Math.sqrt(way.stiff[i]) * (0.65 + Math.random() * 0.4);
      }
      homing.current = way;
    };
    const home = (dt: number) => {
      const s = sim.current!;
      const way = homing.current;
      way.t += dt;
      if (way.t > HOME_MAX) {
        s.px.set(s.hx);
        s.py.set(s.hy);
        return true;
      }
      let far = 0;
      const drift = Math.exp(-2 * dt);
      const tail = Math.min(1, Math.max(0, (way.t - (HOME_MAX - 0.5)) / 0.5)) ** 2;
      for (let i = 0; i < s.n; i++) {
        if (way.t < way.delay[i]) {
          // still wheeling: coast on, slowing
          s.vx[i] *= drift;
          s.vy[i] *= drift;
        } else {
          s.vx[i] += ((s.hx[i] - s.px[i]) * way.stiff[i] - s.vx[i] * way.damp[i]) * dt;
          s.vy[i] += ((s.hy[i] - s.py[i]) * way.stiff[i] - s.vy[i] * way.damp[i]) * dt;
        }
        s.px[i] += s.vx[i] * dt;
        s.py[i] += s.vy[i] * dt;
        // the last stragglers are eased in over the final half second, so the cut-off never shows
        if (tail > 0) {
          s.px[i] += (s.hx[i] - s.px[i]) * tail;
          s.py[i] += (s.hy[i] - s.py[i]) * tail;
          s.vx[i] *= 1 - tail;
          s.vy[i] *= 1 - tail;
        }
        far = Math.max(far, Math.abs(s.hx[i] - s.px[i]), Math.abs(s.hy[i] - s.py[i]), Math.abs(s.vx[i]) * 0.05, Math.abs(s.vy[i]) * 0.05);
      }
      return far < 0.6;
    };

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      if (phase.current === "flock") flock(dt);
      else if (phase.current === "home" && home(dt)) {
        phase.current = "idle";
        draw();
        delete document.documentElement.dataset.flock; // the images fade back in over the landed flock
        raf.current = 0;
        return;
      }
      draw();
      raf.current = requestAnimationFrame(loop);
    };
    const start = () => {
      last = performance.now();
      if (!raf.current) raf.current = requestAnimationFrame(loop);
    };

    if (active) {
      // until the mouse moves, the cursor is wherever the word is (hover or focus got us here)
      const w = document.querySelector(".hp-living")?.getBoundingClientRect();
      if (w) cursor.current = [w.left + w.width / 2, w.top + w.height / 2];
      const onMove = (e: PointerEvent) => (cursor.current = [e.clientX, e.clientY]);
      addEventListener("pointermove", onMove);
      // first hover samples the trays; re-entering while they fly home just turns them round
      (sim.current && phase.current !== "idle" ? Promise.resolve(sim.current) : sample()).then((s) => {
        if (me !== run.current || !s) return;
        sim.current = s;
        phase.current = "flock";
        draw();
        document.documentElement.dataset.flock = "on";
        start();
      });
      return () => removeEventListener("pointermove", onMove);
    }
    if (phase.current === "flock") {
      phase.current = "home";
      setOff();
      start();
    }
  }, [active]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return <canvas ref={canvas} aria-hidden="true" className="hp-flock" />;
}
