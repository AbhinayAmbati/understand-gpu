"use client";

import { useCallback, useRef, useState } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { Button, Icon, Surface } from "@/components/ui";
import {
  CATEGORY,
  PARTS,
  PART_BY_ID,
  STEPS,
  type Category,
  type Part,
  type PartId,
} from "@/lib/parts";

const VB_W = 1000;
const VB_H = 530;
const CORE_COLS = 6;
const CORE_ROWS = 5;
const STEP_SECONDS = 4.5;

function labelPos(part: Part) {
  const top = part.id === "cores" || part.id === "vram";
  return {
    x: part.id === "cooler" ? part.x + 300 : part.x + part.w / 2,
    y: top ? part.y + 19 : part.y + part.h / 2 - ((part.label.length - 1) * 15) / 2 + 4,
  };
}

function PartBox({
  part,
  selected,
  active,
  dim,
  busy,
  onSelect,
  onHover,
}: {
  part: Part;
  selected: boolean;
  active: boolean;
  dim: boolean;
  busy: boolean;
  onSelect: (id: PartId) => void;
  onHover: (id: PartId | null) => void;
}) {
  const color = CATEGORY[part.cat].color;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${part.name}. ${CATEGORY[part.cat].label}.`}
      aria-pressed={selected}
      onClick={() => onSelect(part.id)}
      onPointerEnter={() => onHover(part.id)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onHover(part.id)}
      onBlur={() => onHover(null)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(part.id);
        }
      }}
      className="part cursor-pointer outline-none"
      opacity={dim ? 0.22 : 1}
    >
      <rect
        className="part-body"
        x={part.x}
        y={part.y}
        width={part.w}
        height={part.h}
        rx={9}
        fill={color}
        fillOpacity={active ? 0.24 : selected ? 0.18 : 0.08}
        stroke={color}
        strokeOpacity={selected || active ? 1 : 0.65}
        strokeWidth={active ? 2 : 1.2}
      />
      {selected && (
        <rect
          key={part.id}
          className="select-ring"
          x={part.x - 5}
          y={part.y - 5}
          width={part.w + 10}
          height={part.h + 10}
          rx={13}
          fill="none"
          stroke={color}
          strokeWidth={2}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      )}

      {part.id === "cores" &&
        Array.from({ length: CORE_COLS * CORE_ROWS }, (_, i) => (
          <rect
            key={i}
            x={part.x + 12.5 + (i % CORE_COLS) * 25}
            y={part.y + 29 + Math.floor(i / CORE_COLS) * 25}
            width={20}
            height={20}
            rx={4}
            fill={color}
            fillOpacity={0.3}
            stroke={color}
            strokeOpacity={0.5}
            strokeWidth={0.8}
            className={busy ? "core-busy" : undefined}
            style={busy ? { animationDelay: `${((i * 37) % 30) / 33}s` } : undefined}
          />
        ))}

      {part.id === "vram" &&
        [0, 1, 2, 3].map((i) => {
          const x = part.x + 14 + (i % 2) * 67;
          const y = part.y + 35 + Math.floor(i / 2) * 78;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={55}
                height={62}
                rx={5}
                fill={color}
                fillOpacity={0.2}
                stroke={color}
                strokeOpacity={0.6}
              />
              {[0, 1, 2].map((r) => (
                <rect
                  key={r}
                  x={x + 9}
                  y={y + 12 + r * 14}
                  width={37}
                  height={6}
                  rx={2}
                  fill={color}
                  fillOpacity={0.35}
                />
              ))}
            </g>
          );
        })}

      {part.id === "cooler" &&
        [600, 700].map((fx) => (
          <g key={fx} transform={`translate(${fx} ${part.y + 45})`}>
            <circle r={34} fill="none" stroke={color} strokeOpacity={0.6} />
            <g className="fan-spin">
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <path
                  key={a}
                  d="M0 -4 C 10 -14, 22 -18, 28 -8 C 20 -8, 10 -4, 0 4 Z"
                  fill={color}
                  fillOpacity={0.55}
                  transform={`rotate(${a})`}
                />
              ))}
            </g>
            <circle r={5} fill={color} />
          </g>
        ))}

      {part.id === "pcie" &&
        Array.from({ length: 9 }, (_, i) => (
          <rect
            key={i}
            x={part.x + 9 + i * 8.4}
            y={part.y + part.h - 16}
            width={4.5}
            height={12}
            rx={1}
            fill={color}
            fillOpacity={0.6}
          />
        ))}
    </g>
  );
}

export default function GpuAnatomy() {
  const [selected, setSelected] = useState<PartId>("cores");
  const [hovered, setHovered] = useState<PartId | null>(null);
  const [filter, setFilter] = useState<Category | null>(null);
  const [step, setStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const svg = useRef<SVGSVGElement>(null);
  const panel = useRef<HTMLElement>(null);
  const tour = useRef<HTMLDivElement>(null);

  const current = step === null ? null : STEPS[step];
  const part = PART_BY_ID[selected];
  const partColor = CATEGORY[part.cat].color;
  const hoverPart = hovered ? PART_BY_ID[hovered] : null;

  const advance = useCallback(
    () => setStep((s) => ((s ?? -1) + 1) % STEPS.length),
    [],
  );

  const go = (delta: number) => {
    setPlaying(false);
    setStep((s) =>
      s === null ? (delta > 0 ? 0 : STEPS.length - 1) : (s + delta + STEPS.length) % STEPS.length,
    );
  };

  // data packets travel along the active route
  useGSAP(
    () => {
      if (!current?.path) return;
      const route = svg.current?.querySelector<SVGPathElement>(".route");
      if (!route) return;
      gsap.fromTo(
        route,
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 0.7, ease: "power2.out" },
      );
      if (prefersReducedMotion()) return;
      gsap.utils.toArray<SVGCircleElement>(".packet").forEach((dot, i, all) => {
        gsap
          .fromTo(
            dot,
            { autoAlpha: 1 },
            {
              autoAlpha: 1,
              motionPath: { path: route, align: route, alignOrigin: [0.5, 0.5] },
              duration: 1.9,
              ease: "none",
              repeat: -1,
            },
          )
          .progress(i / all.length);
      });
    },
    { dependencies: [step], scope: svg, revertOnUpdate: true },
  );

  // tour timer: the progress segment fills, then the tour moves on
  useGSAP(
    () => {
      const fill = tour.current?.querySelector<HTMLElement>(".seg-current");
      if (!fill) return;
      if (!playing) {
        gsap.set(fill, { scaleX: 1 });
        return;
      }
      gsap.fromTo(
        fill,
        { scaleX: 0 },
        { scaleX: 1, duration: STEP_SECONDS, ease: "none", onComplete: advance },
      );
      gsap.from(".step-copy", { y: 8, autoAlpha: 0, duration: 0.4, ease: "power2.out" });
    },
    { dependencies: [step, playing], scope: tour, revertOnUpdate: true },
  );

  // detail panel content eases in whenever the selection changes
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".detail-item", {
        y: 10,
        autoAlpha: 0,
        duration: 0.4,
        stagger: 0.045,
        ease: "power2.out",
        clearProps: "all",
      });
    },
    { dependencies: [selected], scope: panel },
  );

  return (
    <div
      className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      <div className="min-w-0">
        <Surface className="overflow-hidden">
          {/* category filter */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-4 py-3">
            <span className="mr-1 text-xs text-faint">Highlight</span>
            {(Object.keys(CATEGORY) as Category[]).map((c) => {
              const on = filter === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(on ? null : c)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition active:scale-95 ${
                    on
                      ? "border-linestrong bg-panel3 text-ink"
                      : "border-transparent text-mute hover:bg-panel2 hover:text-ink"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-[3px]"
                    style={{ background: CATEGORY[c].color }}
                  />
                  {CATEGORY[c].label}
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto p-2 sm:p-3">
            <div className="relative min-w-[640px]">
              <svg
                ref={svg}
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="block h-auto w-full"
                role="group"
                aria-label="Block diagram of a graphics card. Select a block to read about it."
              >
                <defs>
                  <pattern id="pcb-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="#1b3a30" />
                  </pattern>
                  <filter id="packet-glow" x="-200%" y="-200%" width="500%" height="500%">
                    <feGaussianBlur stdDeviation="4" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* circuit board */}
                <rect x={185} y={30} width={795} height={480} rx={16} fill="#08130f" />
                <rect
                  x={185}
                  y={30}
                  width={795}
                  height={480}
                  rx={16}
                  fill="url(#pcb-dots)"
                  stroke="#1c4335"
                  strokeWidth={1.5}
                />
                <text
                  x={202}
                  y={53}
                  fontSize={10.5}
                  letterSpacing={1.2}
                  fill="#4d8f79"
                  className="font-mono"
                >
                  GRAPHICS CARD · CIRCUIT BOARD
                </text>

                {/* the chip */}
                <rect
                  x={325}
                  y={60}
                  width={455}
                  height={285}
                  rx={12}
                  fill="#0b1017"
                  stroke="#34425a"
                  strokeWidth={1.5}
                />
                <text
                  x={340}
                  y={81}
                  fontSize={10.5}
                  letterSpacing={1.2}
                  fill="#93a0b3"
                  className="font-mono"
                >
                  GPU CHIP
                </text>

                {/* static wiring */}
                <g stroke="#2e3a4b" strokeWidth={1.5} fill="none">
                  {STEPS.filter((s) => s.path).map((s) => (
                    <path key={s.title} d={s.path} />
                  ))}
                  <path d="M350 400 L350 345" strokeDasharray="3 5" />
                  <path d="M650 400 L650 345" strokeDasharray="3 5" />
                </g>

                {PARTS.map((p) => (
                  <PartBox
                    key={p.id}
                    part={p}
                    selected={selected === p.id}
                    active={!!current?.parts.includes(p.id)}
                    dim={
                      (!!current && !current.parts.includes(p.id)) ||
                      (!!filter && p.cat !== filter)
                    }
                    busy={p.id === "cores" && !!current?.parts.includes("cores")}
                    onSelect={setSelected}
                    onHover={setHovered}
                  />
                ))}

                {/* data moving along the active route */}
                {current?.path && (
                  <g key={step} pointerEvents="none">
                    <path
                      className="route"
                      d={current.path}
                      fill="none"
                      stroke={current.color}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray={1}
                    />
                    {[0, 1, 2].map((i) => (
                      <circle
                        key={i}
                        className="packet"
                        r={5}
                        fill="#fff"
                        stroke={current.color}
                        strokeWidth={2.5}
                        filter="url(#packet-glow)"
                        visibility="hidden"
                      />
                    ))}
                  </g>
                )}

                {current?.parts.includes("vrm") && (
                  <g pointerEvents="none" fill="none" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M350 400 L350 345" stroke="#ff8370" className="pulse-soft" />
                    <path d="M650 345 L650 400" stroke="#4fd6d6" className="pulse-soft" />
                  </g>
                )}

                {/* labels sit above the packets so they stay readable */}
                <g pointerEvents="none">
                  {PARTS.map((p) => {
                    const pos = labelPos(p);
                    const dim =
                      (!!current && !current.parts.includes(p.id)) ||
                      (!!filter && p.cat !== filter);
                    return p.label.map((line, i) => (
                      <text
                        key={p.id + line}
                        x={pos.x}
                        y={pos.y + i * 15}
                        textAnchor="middle"
                        fontSize={12.5}
                        fontWeight={600}
                        fill="#eef2f7"
                        stroke="#0b1017"
                        strokeWidth={3}
                        strokeOpacity={0.55}
                        paintOrder="stroke"
                        opacity={dim ? 0.3 : 1}
                        className="select-none transition-opacity duration-300"
                      >
                        {line}
                      </text>
                    ));
                  })}
                </g>
              </svg>

              {/* hover tooltip */}
              {hoverPart && (
                <div
                  key={hoverPart.id}
                  role="presentation"
                  className="pop-in pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-linestrong bg-panel3/95 px-3 py-2 shadow-xl backdrop-blur"
                  style={{
                    left: `${((hoverPart.x + hoverPart.w / 2) / VB_W) * 100}%`,
                    top: `calc(${(hoverPart.y / VB_H) * 100}% - 8px)`,
                  }}
                >
                  <p className="flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap">
                    <span
                      className="h-2 w-2 rounded-[3px]"
                      style={{ background: CATEGORY[hoverPart.cat].color }}
                    />
                    {hoverPart.name}
                  </p>
                  <p className="mt-0.5 text-[11px] whitespace-nowrap text-mute">
                    {CATEGORY[hoverPart.cat].label} · click for details
                  </p>
                </div>
              )}
            </div>
          </div>
        </Surface>

        {/* guided tour */}
        <Surface className="mt-4 p-4 sm:p-5">
          <div ref={tour}>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  if (step === null) setStep(0);
                  setPlaying((p) => !p);
                }}
              >
                <Icon name={playing ? "pause" : "play"} size={14} />
                {playing ? "Pause tour" : step === null ? "Start the tour" : "Resume tour"}
              </Button>
              <Button aria-label="Previous step" onClick={() => go(-1)} className="w-9 px-0">
                <Icon name="prev" size={20} />
              </Button>
              <Button aria-label="Next step" onClick={() => go(1)} className="w-9 px-0">
                <Icon name="next" size={20} />
              </Button>
              <span className="ml-auto hidden items-center gap-1.5 text-xs text-faint sm:flex">
                <kbd className="rounded border border-line bg-panel2 px-1.5 py-0.5 font-mono text-[11px]">
                  ←
                </kbd>
                <kbd className="rounded border border-line bg-panel2 px-1.5 py-0.5 font-mono text-[11px]">
                  →
                </kbd>
                to step
              </span>
            </div>

            {/* segmented progress */}
            <div className="mt-4 flex gap-1.5">
              {STEPS.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  aria-current={step === i ? "step" : undefined}
                  onClick={() => {
                    setPlaying(false);
                    setStep(i);
                  }}
                  className="group flex-1 py-2"
                >
                  <span className="block h-1 overflow-hidden rounded-full bg-panel3 transition-[height] group-hover:h-1.5">
                    <span
                      className={`block h-full origin-left rounded-full ${
                        step === i ? "seg-current" : ""
                      }`}
                      style={{
                        background: s.color,
                        transform:
                          step !== null && i < step ? "scaleX(1)" : step === i ? undefined : "scaleX(0)",
                      }}
                    />
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-2 min-h-[84px]" aria-live="polite">
              {current ? (
                <div key={step} className="step-copy">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <span
                      className="grid h-5 min-w-5 place-items-center rounded-full px-1 font-mono text-[11px] text-black"
                      style={{ background: current.color }}
                    >
                      {step! + 1}
                    </span>
                    {current.title}
                    <span className="font-normal text-faint">of {STEPS.length}</span>
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-mute">{current.text}</p>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-mute">
                  Select any block to read what it does. Or start the tour to follow one job
                  through the card, from the CPU&apos;s order to the picture on your screen.
                </p>
              )}
            </div>
          </div>
        </Surface>
      </div>

      {/* detail panel */}
      <aside ref={panel} className="lg:sticky lg:top-20 lg:self-start" aria-live="polite">
        <Surface className="overflow-hidden">
          <div
            className="h-1 transition-colors duration-300"
            style={{ background: partColor }}
          />
          <div className="p-5">
            <span
              className="detail-item inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
              style={{ color: partColor, borderColor: `${partColor}55`, background: `${partColor}14` }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: partColor }} />
              {CATEGORY[part.cat].label}
            </span>
            <h3 className="detail-item mt-3 text-xl font-semibold tracking-tight">{part.name}</h3>
            <p className="detail-item mt-2 text-sm leading-relaxed text-ink/90">{part.what}</p>

            <h4 className="detail-item mt-5 text-[11px] font-semibold tracking-[0.12em] text-faint uppercase">
              How it works
            </h4>
            <p className="detail-item mt-1.5 text-sm leading-relaxed text-mute">{part.how}</p>

            <h4 className="detail-item mt-5 text-[11px] font-semibold tracking-[0.12em] text-faint uppercase">
              Think of it as
            </h4>
            <p className="detail-item mt-1.5 text-sm leading-relaxed text-mute">{part.analogy}</p>

            <div className="detail-item mt-5 rounded-xl border border-line bg-panel2 p-3.5 text-sm leading-relaxed">
              <span className="font-semibold" style={{ color: partColor }}>
                Scale{" "}
              </span>
              <span className="text-ink/90">{part.fact}</span>
            </div>
          </div>
        </Surface>
      </aside>
    </div>
  );
}
