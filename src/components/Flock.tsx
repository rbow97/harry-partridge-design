import React, { useEffect, useRef } from "react";

/**
 * Flock (living systems mode): the specimen images dissolve into particles that
 * flock around the cursor as boids (separation, alignment, cohesion), and fly
 * home to re-form the images when you leave. A flock is a living system in the
 * plain sense: simple agents, emergent behaviour, nothing in charge.
 * Canvas 2D; shown while <html data-flock> is set, which is whenever the
 * particles are off their pixels.
 * Leaving for the sound mode, they land as records instead: each tray's flock
 * settles on the ring of its reel, the shape the photo is about to be cut to.
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
  // the reel each particle's tray becomes in the sound mode: centre, outer radius, hub radius
  rx: Float32Array;
  ry: Float32Array;
  rr: Float32Array;
  rh: Float32Array;
  // which tray each particle came from, and the trays, whose --reel angle (Tape.tsx) the landing turns with
  ti: Uint8Array;
  trays: HTMLElement[];
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

// The sound mode's reel, as the CSS cuts it (global.css): a circle at the photo's centre whose
// radius is min(50cqh, 37.5cqw) of the well, with a hub of 30% of that. On phones the well is only
// an inline-size container, so cqh falls back to the viewport, as it does in the CSS
function reelOf(f: HTMLElement, rect: DOMRect) {
  const well = f.parentElement;
  const w = well?.getBoundingClientRect() ?? rect;
  const tall = well && getComputedStyle(well).containerType === "size" ? w.height : innerHeight;
  const r = Math.min(0.5 * tall, 0.375 * w.width);
  return [rect.left + rect.width / 2, rect.top + rect.height / 2, r, 0.3 * r];
}

// sample every visible tray image, cover-fitted like the real one, into particles
async function sample(): Promise<Sim | null> {
  const frames = Array.from(document.querySelectorAll<HTMLElement>(".hp-frame"));
  const pts: number[] = []; // x, y, bucket
  const reels: number[] = []; // per particle: reel centre x, y, radius, hub radius
  const owner: number[] = []; // per particle: its tray's index in trays
  const trays: HTMLElement[] = [];
  const buckets = new Map<number, string>();
  for (const f of frames) {
    const img = f.querySelector<HTMLImageElement>('img[data-img="lead"]');
    const rect = frameRect(f);
    if (!img || rect.bottom < 0 || rect.top > innerHeight) continue;
    const pic = await load(img.src);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    const reel = reelOf(f, rect);
    const li = f.closest("li") as HTMLElement | null;
    if (li && !trays.includes(li)) trays.push(li);
    const t = li ? trays.indexOf(li) : 0;
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
        reels.push(...reel);
        owner.push(t);
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
    rx: new Float32Array(n),
    ry: new Float32Array(n),
    rr: new Float32Array(n),
    rh: new Float32Array(n),
    ti: Uint8Array.from(owner),
    trays,
    order: Int32Array.from(idx),
    colours,
    starts: Int32Array.from(starts),
  };
  for (let i = 0; i < n; i++) {
    sim.hx[i] = sim.px[i] = pts[i * 3];
    sim.hy[i] = sim.py[i] = pts[i * 3 + 1];
    sim.vx[i] = (Math.random() - 0.5) * 60;
    sim.vy[i] = (Math.random() - 0.5) * 60;
    sim.rx[i] = reels[i * 4];
    sim.ry[i] = reels[i * 4 + 1];
    sim.rr[i] = reels[i * 4 + 2];
    sim.rh[i] = reels[i * 4 + 3];
  }
  return sim;
}

export type Landing = "photo" | "reel";

// Where each particle lands. On a photo, its own pixel. On a reel, its own pixel if that's on the
// ring the reel keeps, and otherwise a spot on the ring in the direction it came from, spread so the
// ring fills evenly. So every tray's flock becomes a whole record, none of it lost to the cut
function targets(s: Sim, land: Landing) {
  const tx = Float32Array.from(s.hx);
  const ty = Float32Array.from(s.hy);
  if (land === "reel") {
    for (let i = 0; i < s.n; i++) {
      const dx = s.hx[i] - s.rx[i], dy = s.hy[i] - s.ry[i];
      const d = Math.hypot(dx, dy);
      const inner = s.rh[i] + 2, outer = s.rr[i] - 1.5;
      if (d > inner && d < outer) continue;
      const a = d ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
      const r = Math.sqrt(inner * inner + Math.random() * (outer * outer - inner * inner));
      tx[i] = s.rx[i] + Math.cos(a) * r;
      ty[i] = s.ry[i] + Math.sin(a) * r;
    }
  }
  return { tx, ty };
}

export default function Flock({ active, land = "photo" }: { active: boolean; land?: Landing }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sim = useRef<Sim | null>(null);
  const phase = useRef<"idle" | "flock" | "home" | "settle">("idle");
  // no window on the server: start at the origin and take the word's position when the mode opens
  const cursor = useRef<[number, number]>([0, 0]);
  const raf = useRef(0);
  const run = useRef(0); // bumps on every change, so a stale sample is thrown away
  // each particle's way home. A ref, because the loop that reads it may be one started by an
  // earlier run of the effect below, still going when the mode closes
  const homing = useRef({
    t: 0,
    delay: new Float32Array(0),
    stiff: new Float32Array(0),
    damp: new Float32Array(0),
    tx: new Float32Array(0),
    ty: new Float32Array(0),
  });
  // the landing asked for most recently. Switching mode mid-flight turns them toward the new one
  const landing = useRef<Landing>(land);
  useEffect(() => {
    landing.current = land;
    if ((phase.current === "home" || phase.current === "settle") && sim.current) Object.assign(homing.current, targets(sim.current, land));
  }, [land]);

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
      const way = { t: 0, delay: new Float32Array(n), stiff: new Float32Array(n), damp: new Float32Array(n), ...targets(sim.current!, landing.current) };
      for (let i = 0; i < n; i++) {
        way.delay[i] = Math.random() ** 2 * 0.7; // most leave at once, a few hang back
        way.stiff[i] = 22 + Math.random() * 40;
        // a little under critical damping for some, so they overshoot and settle
        way.damp[i] = 2 * Math.sqrt(way.stiff[i]) * (0.65 + Math.random() * 0.4);
      }
      homing.current = way;
    };
    // each tray's reel angle as Tape.tsx turns it, so a landing spot turns with its record. Off the
    // sound mode the angles ease back to 0 (upright), and the goals are just the photos' pixels
    // Each tray's turning speed comes along too, from the change since the last frame, so a
    // particle's damping works against its speed relative to the spot rather than to the page.
    // Otherwise a spring chasing a turning spot always trails it, and the flock never lands
    let lastAngles: number[] = [];
    const spins = (s: Sim, dt: number) => {
      const angles = s.trays.map((li) => ((parseFloat(li.style.getPropertyValue("--reel")) || 0) * Math.PI) / 180);
      const out = angles.map((a, t) => [Math.cos(a), Math.sin(a), lastAngles.length && dt ? (a - lastAngles[t]) / dt : 0]);
      lastAngles = angles;
      return out;
    };
    // the spot's own speed: its offset from the reel centre, turned a quarter, times the spin rate
    const pace = (s: Sim, i: number, cs: number[][], gx: number, gy: number): [number, number] => {
      const w = cs[s.ti[i]]?.[2] ?? 0;
      return [-(gy - s.ry[i]) * w, (gx - s.rx[i]) * w];
    };
    const goal = (s: Sim, i: number, cs: number[][], tx: Float32Array, ty: Float32Array): [number, number] => {
      const [c, sn] = cs[s.ti[i]] ?? [1, 0];
      const bx = tx[i] - s.rx[i], by = ty[i] - s.ry[i];
      return [s.rx[i] + bx * c - by * sn, s.ry[i] + bx * sn + by * c];
    };
    const home = (dt: number) => {
      const s = sim.current!;
      const way = homing.current;
      way.t += dt;
      const cs = spins(s, dt);
      if (way.t > HOME_MAX) {
        for (let i = 0; i < s.n; i++) [s.px[i], s.py[i]] = goal(s, i, cs, way.tx, way.ty);
        return true;
      }
      let landed = 0;
      const drift = Math.exp(-2 * dt);
      const tail = Math.min(1, Math.max(0, (way.t - (HOME_MAX - 0.5)) / 0.5)) ** 2;
      for (let i = 0; i < s.n; i++) {
        const [gx, gy] = goal(s, i, cs, way.tx, way.ty);
        if (way.t < way.delay[i]) {
          // still wheeling: coast on, slowing
          s.vx[i] *= drift;
          s.vy[i] *= drift;
        } else {
          const [ux, uy] = pace(s, i, cs, gx, gy);
          s.vx[i] += ((gx - s.px[i]) * way.stiff[i] - (s.vx[i] - ux) * way.damp[i]) * dt;
          s.vy[i] += ((gy - s.py[i]) * way.stiff[i] - (s.vy[i] - uy) * way.damp[i]) * dt;
        }
        s.px[i] += s.vx[i] * dt;
        s.py[i] += s.vy[i] * dt;
        // the last stragglers are eased in over the final half second, so the cut-off never shows
        if (tail > 0) {
          s.px[i] += (gx - s.px[i]) * tail;
          s.py[i] += (gy - s.py[i]) * tail;
        }
        // landed means in place, not still: on a turning reel a landed particle keeps moving
        if (Math.abs(gx - s.px[i]) < 3 && Math.abs(gy - s.py[i]) < 3) landed++;
      }
      // settle once nearly all are in. The last few finish on the settle's own pull, under the
      // photo fading in, rather than holding the whole flock out for them
      return landed >= s.n * 0.95;
    };

    // Settling: the flock has landed. The photo fades in beneath it (data-flock="settling" in
    // global.css) while the particles ride round with their reel and loosen, each drifting a
    // little off its spot, and the canvas fades out over them. Then they're gone
    const SETTLE = 1.1;
    const settle = (dt: number) => {
      const s = sim.current!;
      const way = homing.current;
      way.t += dt;
      const cs = spins(s, dt);
      const loose = Math.min(1, way.t / SETTLE);
      for (let i = 0; i < s.n; i++) {
        const [gx, gy] = goal(s, i, cs, way.tx, way.ty);
        const [ux, uy] = pace(s, i, cs, gx, gy);
        // a softening pull to the spot, riding round with it, and a wander that grows as they let go
        s.vx[i] += ((gx - s.px[i]) * 30 * (1 - loose) - (s.vx[i] - ux) * 4 + (Math.random() - 0.5) * 260 * loose) * dt;
        s.vy[i] += ((gy - s.py[i]) * 30 * (1 - loose) - (s.vy[i] - uy) * 4 + (Math.random() - 0.5) * 260 * loose) * dt;
        s.px[i] += s.vx[i] * dt;
        s.py[i] += s.vy[i] * dt;
      }
      return way.t > SETTLE;
    };

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      if (phase.current === "flock") flock(dt);
      else if (phase.current === "home" && home(dt)) {
        phase.current = "settle";
        homing.current.t = 0;
        document.documentElement.dataset.flock = "settling"; // the photos fade in beneath the landed flock
      } else if (phase.current === "settle" && settle(dt)) {
        phase.current = "idle";
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        delete document.documentElement.dataset.flock;
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
