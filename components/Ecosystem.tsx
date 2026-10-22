import React from "react";

/**
 * Line-drawn ecosystem shown in the "living systems" page mode.
 * Hidden by default; globals.css grows/draws/animates it when <html data-mode="living">.
 */

const STROKE = "#2f3a22";
const LEAF = "#7d8f3c";
const LEAF_LIGHT = "#a3b05a";
const RUST = "#a4471f";
const SHELL = "#c9a46a";

const d = (s: number) => ({ "--d": `${s}s` } as React.CSSProperties);
const line = { fill: "none", stroke: STROKE, strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };




/** A tree growing beside the statement, with birds crossing it */
function TreeSvg({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 -4 417 240" className={`eco pointer-events-none ${className}`}>
      {/* Rose's hand-drawn tree (public/images/tree.png), fading in with the scene.
          Its cut-off right edge sits flush with the edge of the screen. */}
      <image
        href="/images/tree.png"
        x={229}
        y={8}
        width={188}
        height={228}
        preserveAspectRatio="xMaxYMax meet"
      />
      {/* undergrowth */}
      <path
        className="eco-draw"
        pathLength={1}
        d="M230 236 q-2 -10 -6 -16 M236 236 q1 -12 5 -18 M380 236 q-2 -9 -6 -14 M386 236 q2 -11 6 -16 M396 236 q0 -8 3 -12"
        {...line}
        style={d(0.3)}
      />
      {/* bush */}
      {[
        [186, 222, 14, LEAF, 0.9],
        [202, 218, 17, LEAF_LIGHT, 1.0],
        [218, 224, 12, LEAF, 1.1],
      ].map(([cx, cy, r, fill, delay], i) => (
        <circle key={i} className="eco-pop" cx={cx} cy={cy} r={r} fill={fill as string} fillOpacity={0.9} stroke={STROKE} strokeWidth={1.1} style={d(delay as number)} />
      ))}
      {/* rabbit */}
      <g className="eco-hop" style={{ animationDuration: "3.4s" }}>
        <ellipse cx="364" cy="226" rx="13" ry="9" fill="#d9c9a3" stroke={STROKE} strokeWidth={1.2} />
        <circle cx="377" cy="218" r="6.5" fill="#d9c9a3" stroke={STROKE} strokeWidth={1.2} />
        <ellipse cx="375" cy="205" rx="2.6" ry="8" fill="#d9c9a3" stroke={STROKE} strokeWidth={1.1} transform="rotate(-12 375 205)" />
        <ellipse cx="381" cy="206" rx="2.6" ry="8" fill="#d9c9a3" stroke={STROKE} strokeWidth={1.1} transform="rotate(14 381 206)" />
        <circle cx="351" cy="224" r="3.5" fill="#f4f1ea" stroke={STROKE} strokeWidth={1} />
        <circle cx="379" cy="217" r="1" fill={STROKE} />
      </g>
      {/* birds */}
      <g className="eco-fly" style={{ "--fly": "14s" } as React.CSSProperties}>
        <path className="eco-flap" d="M0 40 q6 -6 12 0 q6 -6 12 0" {...line} />
      </g>
      <g className="eco-fly" style={{ "--fly": "19s", animationDelay: "-6s" } as React.CSSProperties}>
        <path className="eco-flap" d="M0 20 q5 -5 10 0 q5 -5 10 0" {...line} style={{ animationDelay: "-0.2s" }} />
      </g>
    </svg>
  );
}

function Grass() {
  let p = "";
  for (let x = 4; x < 200; x += 7) {
    const h = 7 + ((x * 13) % 11);
    p += ` M${x} 66 q-1 ${-h / 2} -3 ${-h} M${x + 2} 66 q1 ${-h / 2} 4 ${-h + 2}`;
  }
  return <path className="eco-draw" pathLength={1} d={p} {...line} strokeWidth={1.1} style={d(0.1)} />;
}

function Snail() {
  return (
    <g className="eco-crawl" style={{ "--crawl": "26s" } as React.CSSProperties}>
      <path d="M2 64 C10 64 26 64 34 64 C37 64 39 60 37 58" {...line} fill="#d9c9a3" />
      <path d="M33 59 L35 51 M35 59 L40 52" {...line} />
      <circle cx="16" cy="55" r="9" fill={SHELL} stroke={STROKE} strokeWidth={1.3} />
      <path d="M16 55 m-5 0 a5 5 0 1 1 5 5 a3 3 0 1 1 -3 -3" {...line} />
    </g>
  );
}

function Fern({ x }: { x: number }) {
  return (
    <g className="eco-grow" style={d(0.4)}>
      <path d={`M${x} 66 C${x} 50 ${x + 4} 38 ${x + 10} 28`} {...line} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <ellipse cx={x - 6 + i * 2} cy={58 - i * 9} rx="7" ry="3" fill={LEAF} stroke={STROKE} strokeWidth={1} transform={`rotate(-25 ${x - 6 + i * 2} ${58 - i * 9})`} />
          <ellipse cx={x + 8 + i * 2} cy={56 - i * 9} rx="7" ry="3" fill={LEAF_LIGHT} stroke={STROKE} strokeWidth={1} transform={`rotate(25 ${x + 8 + i * 2} ${56 - i * 9})`} />
        </g>
      ))}
    </g>
  );
}

function Mushrooms({ x }: { x: number }) {
  return (
    <g>
      <g className="eco-grow" style={d(0.5)}>
        <path d={`M${x} 66 V52 M${x + 6} 66 V52`} {...line} />
        <path d={`M${x - 10} 53 Q${x + 3} 30 ${x + 16} 53 Z`} fill={RUST} stroke={STROKE} strokeWidth={1.2} />
        <circle cx={x} cy={45} r="1.6" fill="#f4f1ea" />
        <circle cx={x + 7} cy={42} r="1.3" fill="#f4f1ea" />
      </g>
      <g className="eco-grow" style={d(0.8)}>
        <path d={`M${x + 24} 66 V58`} {...line} />
        <path d={`M${x + 17} 59 Q${x + 24} 46 ${x + 31} 59 Z`} fill={SHELL} stroke={STROKE} strokeWidth={1.2} />
      </g>
    </g>
  );
}

function Ladybird() {
  return (
    <g className="eco-crawl" style={{ "--crawl": "34s", animationDelay: "-12s" } as React.CSSProperties}>
      <circle cx="12" cy="61" r="2.6" fill={STROKE} />
      <ellipse cx="5" cy="62" rx="6" ry="4.5" fill="#b5462e" stroke={STROKE} strokeWidth={1} />
      <path d="M5 57.5 V66.5" stroke={STROKE} strokeWidth={0.8} />
      <circle cx="2.5" cy="61" r="1" fill={STROKE} />
      <circle cx="7.5" cy="63" r="1" fill={STROKE} />
    </g>
  );
}

function Flower({ x, delay }: { x: number; delay: number }) {
  return (
    <g className="eco-grow" style={d(delay)}>
      <path d={`M${x} 66 C${x - 2} 54 ${x + 2} 44 ${x} 34`} {...line} />
      <ellipse cx={x + 6} cy={52} rx="6" ry="2.5" fill={LEAF} stroke={STROKE} strokeWidth={1} transform={`rotate(-30 ${x + 6} 52)`} />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={x} cy={27} rx="3.2" ry="6" fill="#e6c96a" stroke={STROKE} strokeWidth={1} transform={`rotate(${a} ${x} 33)`} />
      ))}
      <circle cx={x} cy={33} r="3" fill={RUST} stroke={STROKE} strokeWidth={1} />
    </g>
  );
}

function Butterfly() {
  return (
    <g className="eco-drift">
      <g className="eco-wing">
        <path d="M150 30 C140 18 128 22 132 32 C128 40 142 42 150 32" fill="#e8875e" stroke={STROKE} strokeWidth={1} />
        <path d="M150 30 C160 18 172 22 168 32 C172 40 158 42 150 32" fill="#e8875e" stroke={STROKE} strokeWidth={1} />
      </g>
      <path d="M150 24 V38" {...line} strokeWidth={1.6} />
    </g>
  );
}

function Sapling({ x }: { x: number }) {
  return (
    <g className="eco-grow" style={d(0.4)}>
      <path d={`M${x} 66 C${x + 1} 50 ${x - 1} 38 ${x} 22`} {...line} strokeWidth={1.8} />
      <circle cx={x - 8} cy={30} r="9" fill={LEAF} stroke={STROKE} strokeWidth={1.1} />
      <circle cx={x + 8} cy={26} r="10" fill={LEAF_LIGHT} stroke={STROKE} strokeWidth={1.1} />
      <circle cx={x} cy={16} r="9" fill={LEAF} stroke={STROKE} strokeWidth={1.1} />
    </g>
  );
}

function Bird() {
  return (
    <g className="eco-hop">
      <path d="M60 64 C58 54 66 48 74 50 C80 46 86 50 84 54 L90 55 L84 57 C82 62 72 66 60 64 Z" fill={SHELL} stroke={STROKE} strokeWidth={1.2} />
      <path d="M60 60 L50 56 M70 64 V68 M75 64 V68" {...line} />
      <circle cx="80" cy="52" r="1.2" fill={STROKE} />
    </g>
  );
}

/** A small habitat along the bottom of each project tray */
function HabitatSvg({ index }: { index: number }) {
  const kind = index % 4;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 70"
      preserveAspectRatio="xMidYMax meet"
      className="eco pointer-events-none absolute inset-x-6 bottom-8 h-[100px] w-[calc(100%-3rem)]"
    >
      <path className="eco-draw" pathLength={1} d="M0 66 H200" {...line} style={d(0)} />
      <Grass />
      {kind === 0 && (
        <>
          <Fern x={165} />
          <Snail />
        </>
      )}
      {kind === 1 && (
        <>
          <Mushrooms x={135} />
          <Ladybird />
        </>
      )}
      {kind === 2 && (
        <>
          <Flower x={38} delay={0.4} />
          <Flower x={162} delay={0.7} />
          <g transform="translate(-50 0)">
            <Butterfly />
          </g>
        </>
      )}
      {kind === 3 && (
        <>
          <Sapling x={160} />
          <Bird />
        </>
      )}
    </svg>
  );
}

// Static drawings: memoised so hovering (which re-renders the homepage) doesn't rebuild them
export const Tree = React.memo(TreeSvg);
export const Habitat = React.memo(HabitatSvg);
