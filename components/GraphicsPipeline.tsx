"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Icon, Surface } from "@/components/ui";

const GW = 28;
const GH = 18;
const CELL = 20;

type Pt = { x: number; y: number };

// where the 3 corners start (the model as the artist made it) ...
const MODEL: Pt[] = [
  { x: 11.5, y: 11 },
  { x: 16.5, y: 11 },
  { x: 14, y: 6.5 },
];
// ... and where the vertex shader places them on screen
const SCREEN: Pt[] = [
  { x: 3.5, y: 15.5 },
  { x: 25, y: 12.5 },
  { x: 12, y: 1.5 },
];
const VERT_RGB = [
  [255, 90, 90],
  [90, 230, 140],
  [90, 150, 255],
];
const VERT_HEX = ["#ff5a5a", "#5ae68c", "#5a96ff"];

const STAGES = [
  {
    name: "Vertices",
    text: "A 3D object is stored as a list of corner points called vertices. This triangle is just three points, each with a position and a colour. Real scenes contain millions.",
  },
  {
    name: "Vertex shader",
    text: "A small program runs once per vertex, on many cores at once. It moves, rotates and scales each point from the model's own space to where it belongs on your screen.",
  },
  {
    name: "Assembly",
    text: "The points are joined into triangles. Triangles are used because any three points always form a flat surface, which keeps the maths simple.",
  },
  {
    name: "Rasterizer",
    text: "The screen is a grid of pixels. The rasterizer tests which pixel centres fall inside the triangle. Each covered pixel becomes a “fragment” that needs a colour.",
  },
  {
    name: "Fragment shader",
    text: "Another small program runs once per fragment, again on thousands of cores at once, and decides its final colour. Here it blends the three corner colours.",
  },
  {
    name: "Framebuffer",
    text: "The finished pixels are stored in VRAM as the framebuffer. The display engine sends it to your monitor, and the whole process starts again for the next frame.",
  },
];

const DURATION = [2200, 2600, 2200, 3200, 3200, 2600];
const HOLD = 900;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function edge(a: Pt, b: Pt, p: Pt) {
  return (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x);
}

export default function GraphicsPipeline() {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0); // may exceed 1 while holding
  const [playing, setPlaying] = useState(true);

  // pixels covered by the triangle, in scan order, with their blended colour
  const fragments = useMemo(() => {
    const [a, b, c] = SCREEN;
    const area = edge(a, b, c);
    const out: { x: number; y: number; color: string }[] = [];
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        const p = { x: x + 0.5, y: y + 0.5 };
        const w0 = edge(b, c, p) / area;
        const w1 = edge(c, a, p) / area;
        const w2 = edge(a, b, p) / area;
        if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
          const ch = (k: number) =>
            Math.round(w0 * VERT_RGB[0][k] + w1 * VERT_RGB[1][k] + w2 * VERT_RGB[2][k]);
          out.push({ x, y, color: `rgb(${ch(0)},${ch(1)},${ch(2)})` });
        }
      }
    }
    return out;
  }, []);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      // the frame timestamp can be earlier than the time this effect started,
      // and a background tab can produce a huge gap: keep the step in range
      const dt = Math.min(100, Math.max(0, now - last));
      last = now;
      setProgress((p) => p + dt / DURATION[stage]);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [playing, stage]);

  // move on once the stage has finished and been held for a moment
  const limit = 1 + HOLD / DURATION[stage];
  useEffect(() => {
    if (playing && progress >= limit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStage((s) => (s + 1) % STAGES.length);
      setProgress(0);
    }
  }, [playing, progress, limit]);

  const t = Math.min(1, Math.max(0, progress));
  const pick = (i: number) => {
    setStage(i);
    setProgress(playing ? 0 : 1);
  };

  const moveT = stage === 0 ? 0 : stage === 1 ? ease(t) : 1;
  const pts = MODEL.map((m, i) => ({
    x: lerp(m.x, SCREEN[i].x, moveT) * CELL,
    y: lerp(m.y, SCREEN[i].y, moveT) * CELL,
  }));
  const triPath = `M${pts[0].x} ${pts[0].y} L${pts[1].x} ${pts[1].y} L${pts[2].x} ${pts[2].y} Z`;

  const showGrid = stage >= 3;
  const gridOpacity = stage === 3 ? Math.min(1, t * 4) : stage === 5 ? 1 - t : stage === 4 ? 1 : 0;
  const coveredCount =
    stage === 3 ? Math.floor(t * fragments.length) : stage > 3 ? fragments.length : 0;
  const shadedCount =
    stage === 4 ? Math.floor(t * fragments.length) : stage > 4 ? fragments.length : 0;
  const outlineOpacity = stage === 2 ? 1 : stage === 3 ? 0.9 : stage === 4 ? 0.4 : 0;
  const dotsOpacity = stage <= 3 ? 1 : stage === 4 ? 1 - t : 0;

  return (
    <Surface className="p-5 sm:p-8">
      {/* stage stepper */}
      <div className="flex flex-wrap items-center gap-2">
        <ol className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {STAGES.map((s, i) => {
            const on = stage === i;
            return (
              <li key={s.name}>
                <button
                  type="button"
                  aria-current={on ? "step" : undefined}
                  onClick={() => pick(i)}
                  className={`relative flex h-9 items-center gap-2 overflow-hidden rounded-full border px-3.5 text-[13px] transition active:scale-[0.97] ${
                    on
                      ? "border-transparent bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                      : "border-transparent text-mute hover:bg-black/[0.05] hover:text-ink"
                  }`}
                >
                  {on && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-full origin-left bg-accent/10"
                      style={{ transform: `scaleX(${t})` }}
                    />
                  )}
                  <span
                    className={`relative grid h-4.5 w-4.5 place-items-center rounded-full font-mono text-[10px] ${
                      on ? "bg-accent text-white" : i < stage ? "bg-ink text-white" : "bg-panel3 text-mute"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="relative">{s.name}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <Button onClick={() => setPlaying((p) => !p)}>
          <Icon name={playing ? "pause" : "play"} size={14} />
          {playing ? "Pause" : "Play"}
        </Button>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <svg
          viewBox={`0 0 ${GW * CELL} ${GH * CELL}`}
          className="block h-auto w-full rounded-[20px] bg-[#000000]"
          role="img"
          aria-label={`Graphics pipeline stage ${stage + 1}: ${STAGES[stage].name}`}
        >
          {/* pixel grid */}
          {showGrid && (
            <g opacity={gridOpacity} stroke="#1c2738" strokeWidth={1}>
              {Array.from({ length: GW + 1 }, (_, i) => (
                <line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={GH * CELL} />
              ))}
              {Array.from({ length: GH + 1 }, (_, i) => (
                <line key={`h${i}`} x1={0} y1={i * CELL} x2={GW * CELL} y2={i * CELL} />
              ))}
            </g>
          )}

          {/* fragments */}
          {fragments.slice(0, coveredCount).map((f, i) => (
            <rect
              key={`${f.x}-${f.y}`}
              x={f.x * CELL + 1}
              y={f.y * CELL + 1}
              width={CELL - (stage === 5 ? lerp(2, 0, t) : 2)}
              height={CELL - (stage === 5 ? lerp(2, 0, t) : 2)}
              fill={i < shadedCount ? f.color : "#3b4a63"}
            />
          ))}

          {/* scanning line while rasterizing / shading */}
          {(stage === 3 || stage === 4) && t < 1 && fragments.length > 0 && (
            <rect
              x={0}
              y={
                fragments[
                  Math.max(
                    0,
                    Math.min(fragments.length - 1, stage === 3 ? coveredCount : shadedCount),
                  )
                ].y * CELL
              }
              width={GW * CELL}
              height={CELL}
              fill={stage === 3 ? "#ffffff" : "#2997ff"}
              opacity={0.12}
            />
          )}

          {/* triangle outline */}
          <path
            d={triPath}
            fill="none"
            stroke="#e7eef7"
            strokeWidth={2}
            strokeLinejoin="round"
            opacity={outlineOpacity}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={stage === 2 ? 1 - t : 0}
          />

          {/* vertices */}
          <g opacity={dotsOpacity}>
            {pts.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={7} fill={VERT_HEX[i]} stroke="#05080d" strokeWidth={2} />
                {stage <= 2 && (
                  <text
                    x={p.x + (i === 1 ? 12 : i === 0 ? -12 : 0)}
                    y={p.y + (i === 2 ? -14 : 22)}
                    textAnchor={i === 1 ? "start" : i === 0 ? "end" : "middle"}
                    fontSize={12}
                    fill="#8d9db4"
                    className="font-mono"
                  >
                    v{i} ({(p.x / CELL).toFixed(1)}, {(p.y / CELL).toFixed(1)})
                  </text>
                )}
              </g>
            ))}
          </g>

          {stage === 5 && t > 0.5 && (
            <text
              x={GW * CELL - 12}
              y={GH * CELL - 12}
              textAnchor="end"
              fontSize={13}
              fill="#8d9db4"
              className="font-mono"
              opacity={(t - 0.5) * 2}
            >
              frame complete → monitor
            </text>
          )}
        </svg>

        <div>
          <div key={stage} className="pop-in" aria-live="polite">
            <p className="text-[13px] font-medium text-mute">
              Stage {stage + 1} of {STAGES.length}
            </p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight">{STAGES[stage].name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mute">{STAGES[stage].text}</p>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-2 font-mono text-xs">
            {[
              ["vertices", "3"],
              ["screen", `${GW}×${GH}`],
              ["pixels found", String(coveredCount)],
              ["pixels coloured", String(shadedCount)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white p-3.5">
                <dt className="text-faint">{k}</dt>
                <dd className="mt-0.5 text-base font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>

          <label className="mt-5 block">
            <span className="flex justify-between text-xs text-faint">
              <span>Scrub this stage</span>
              <span className="font-mono tabular-nums">{Math.round(t * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(t * 1000)}
              onChange={(e) => {
                setPlaying(false);
                setProgress(Number(e.target.value) / 1000);
              }}
              className="mt-2 w-full"
              style={{
                background: `linear-gradient(to right, #0071e3 ${t * 100}%, #e8e8ed ${t * 100}%)`,
              }}
            />
          </label>
        </div>
      </div>
    </Surface>
  );
}
