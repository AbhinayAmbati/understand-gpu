"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { Button, Icon, Meter, Segmented, Surface } from "@/components/ui";

const W = 32;
const H = 20;
const TOTAL = W * H;
const CPU_CORES = 4;
const GPU_TICKS = 2; // a GPU core needs twice as long per pixel
const TICK_MS = 45;
const CPU_TICKS = TOTAL / CPU_CORES;

const CORE_OPTIONS = [
  { value: 16, label: "16" },
  { value: 64, label: "64" },
  { value: 160, label: "160" },
];

/** Each pixel needs real arithmetic: a small Mandelbrot calculation. */
function pixelColor(i: number): string {
  const cr = -2.2 + ((i % W) / W) * 3.2;
  const ci = -1.0 + (Math.floor(i / W) / H) * 2.0;
  let x = 0;
  let y = 0;
  let n = 0;
  while (n < 40 && x * x + y * y < 4) {
    const t = x * x - y * y + cr;
    y = 2 * x * y + ci;
    x = t;
    n++;
  }
  if (n === 40) return "#1d1d1f";
  return `hsl(${200 - n * 9} 85% ${28 + n * 2.2}%)`;
}

function Grid({
  colors,
  done,
  batch,
  running,
  accent,
}: {
  colors: string[];
  done: number;
  batch: number;
  running: boolean;
  accent: string;
}) {
  return (
    <div
      className="grid aspect-[32/20] w-full gap-px overflow-hidden rounded-2xl bg-white p-2"
      style={{ gridTemplateColumns: `repeat(${W}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {colors.map((c, i) => {
        const working = running && i >= done && i < done + batch;
        return (
          <div
            key={i}
            className="rounded-[1.5px] transition-colors duration-300"
            style={{
              background: working ? accent : i < done ? c : "#e8e8ed",
            }}
          />
        );
      })}
    </div>
  );
}

export default function CpuVsGpu() {
  const colors = useMemo(() => Array.from({ length: TOTAL }, (_, i) => pixelColor(i)), []);
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(false);
  const [gpuCores, setGpuCores] = useState(64);
  const result = useRef<HTMLDivElement>(null);

  const gpuTicks = Math.ceil(TOTAL / gpuCores) * GPU_TICKS;
  const cpuDone = Math.min(TOTAL, tick * CPU_CORES);
  const gpuDone = Math.min(TOTAL, Math.floor(tick / GPU_TICKS) * gpuCores);
  const finished = cpuDone >= TOTAL;
  const active = running && !finished;
  const speedup = CPU_TICKS / gpuTicks;

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, [active]);

  // result card: slide in and count the speed-up
  useGSAP(
    () => {
      if (!finished || prefersReducedMotion()) return;
      gsap.from(result.current, { y: 14, autoAlpha: 0, duration: 0.5, ease: "power3.out" });
      const el = result.current?.querySelector<HTMLElement>(".speedup");
      if (!el) return;
      const n = { v: 1 };
      gsap.to(n, {
        v: speedup,
        duration: 0.9,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = `${Number.isInteger(speedup) ? Math.round(n.v) : n.v.toFixed(1)}×`;
        },
      });
    },
    { dependencies: [finished] },
  );

  const reset = () => {
    setRunning(false);
    setTick(0);
  };

  return (
    <Surface className="p-5 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          onClick={() => {
            if (finished) setTick(0);
            setRunning(!active);
          }}
        >
          <Icon name={active ? "pause" : "play"} size={14} />
          {active ? "Pause" : finished ? "Race again" : tick > 0 ? "Resume" : "Start the race"}
        </Button>
        <Button onClick={reset}>
          <Icon name="reset" size={14} />
          Reset
        </Button>
        <div className="ml-auto flex items-center gap-2.5">
          <span className="text-[13px] text-mute">GPU cores</span>
          <Segmented
            label="Number of GPU cores"
            options={CORE_OPTIONS}
            value={gpuCores}
            onChange={(v) => {
              setGpuCores(v);
              reset();
            }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="grid grid-cols-2 gap-0.5">
              {Array.from({ length: 4 }, (_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-[2px] bg-ctrl ${active ? "pulse-soft" : ""}`}
                />
              ))}
            </span>
            <h3 className="font-semibold tracking-tight">CPU</h3>
            <span className="text-sm text-mute">4 powerful cores</span>
          </div>
          <Grid colors={colors} done={cpuDone} batch={CPU_CORES} running={active} accent="#e06c00" />
          <div className="mt-3 grid grid-cols-2 gap-4">
            <Meter
              label="Pixels done"
              value={`${cpuDone} / ${TOTAL}`}
              fraction={cpuDone / TOTAL}
              color="#e06c00"
            />
            <Meter
              label="Time used"
              value={`${Math.min(tick, CPU_TICKS)} units`}
              fraction={Math.min(tick, CPU_TICKS) / CPU_TICKS}
              color="#e06c00"
            />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-mute">
            Each core is very fast, but there are only four. They work through the picture four
            pixels at a time.
          </p>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="grid grid-cols-4 gap-0.5">
              {Array.from({ length: 8 }, (_, i) => (
                <span
                  key={i}
                  className={`h-[3px] w-[3px] rounded-[1px] bg-accent ${
                    active && gpuDone < TOTAL ? "pulse-soft" : ""
                  }`}
                />
              ))}
            </span>
            <h3 className="font-semibold tracking-tight">GPU</h3>
            <span className="text-sm text-mute">{gpuCores} simple cores</span>
          </div>
          <Grid
            colors={colors}
            done={gpuDone}
            batch={gpuCores}
            running={active && gpuDone < TOTAL}
            accent="#0071e3"
          />
          <div className="mt-3 grid grid-cols-2 gap-4">
            <Meter
              label="Pixels done"
              value={`${gpuDone} / ${TOTAL}`}
              fraction={gpuDone / TOTAL}
              color="#0071e3"
            />
            <Meter
              label="Time used"
              value={`${Math.min(tick, gpuTicks)} units`}
              fraction={Math.min(tick, gpuTicks) / CPU_TICKS}
              color="#0071e3"
            />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-mute">
            Each core takes twice as long per pixel, but {gpuCores} of them work at once, so{" "}
            {gpuCores} pixels finish together.
          </p>
        </div>
      </div>

      <div className="mt-5 min-h-[76px]" aria-live="polite">
        {finished ? (
          <div
            ref={result}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl bg-white p-5"
          >
            <span className="speedup text-5xl font-semibold tracking-tight text-ink tabular-nums">
              {Number.isInteger(speedup) ? speedup : speedup.toFixed(1)}×
            </span>
            <p className="max-w-xl text-sm leading-relaxed text-mute">
              <b className="font-semibold text-ink">The GPU finished {speedup}× sooner</b> ({gpuTicks}{" "}
              time units against {CPU_TICKS}), even though each of its cores is half as fast. Change
              the core count above and race again.
            </p>
          </div>
        ) : (
          <p className="rounded-2xl bg-white p-5 text-sm leading-relaxed text-mute">
            <b className="font-semibold text-ink">The catch:</b> this only works when a job splits
            into many independent, identical pieces, like pixels or the numbers in a matrix. Where
            each step depends on the one before, a CPU is still faster. That is why computers have
            both.
          </p>
        )}
      </div>
    </Surface>
  );
}
