"use client";

import { useEffect, useState } from "react";
import { Button, Icon, Segmented, Surface } from "@/components/ui";
import {
  NUM_CORES,
  PROGRAMS,
  REGION,
  REGION_SIZE,
  asm,
  initState,
  narrate,
  step,
  type Phase,
  type SimState,
} from "@/lib/tinygpu";

const CORE_COLORS = ["#1e9e57", "#0071e3", "#e06c00", "#8f4fd1"];
const PHASES: Phase[] = ["fetch", "decode", "execute"];
const DEFAULT_A = [3, 8, 1, 6];
const DEFAULT_B = [4, 2, 9, 5];
const LINE_H = 34;

const SPEEDS = [
  { value: 1800, label: "Slow" },
  { value: 1100, label: "Normal" },
  { value: 450, label: "Fast" },
];

export default function TinyGpuSim() {
  const [progIdx, setProgIdx] = useState(0);
  const [data, setData] = useState({ a: DEFAULT_A, b: DEFAULT_B });
  const [sim, setSim] = useState<SimState>(() => initState(DEFAULT_A, DEFAULT_B));
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1100);
  const program = PROGRAMS[progIdx];
  const playing = running && !sim.done;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setSim((s) => step(s, PROGRAMS[progIdx])), speed);
    return () => clearInterval(id);
  }, [playing, progIdx, speed]);

  const reset = (a = data.a, b = data.b) => {
    setRunning(false);
    setSim(initState(a, b));
  };

  const randomize = () => {
    const r = () => Array.from({ length: REGION_SIZE }, () => 1 + Math.floor(Math.random() * 9));
    const next = { a: r(), b: r() };
    setData(next);
    reset(next.a, next.b);
  };

  const phaseIdx = PHASES.indexOf(sim.phase);
  const totalSteps = program.code.length * 3 - 2;
  const stepsDone = sim.done ? totalSteps : sim.pc * 3 + phaseIdx;

  return (
    <Surface className="p-5 sm:p-8">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          onClick={() => {
            if (sim.done) setSim(initState(data.a, data.b));
            setRunning(!playing);
          }}
        >
          <Icon name={playing ? "pause" : "play"} size={14} />
          {playing ? "Pause" : sim.done ? "Run again" : "Run"}
        </Button>
        <Button
          disabled={sim.done}
          onClick={() => {
            setRunning(false);
            setSim((s) => step(s, program));
          }}
        >
          <Icon name="step" size={14} />
          Step
        </Button>
        <Button onClick={() => reset()}>
          <Icon name="reset" size={14} />
          Reset
        </Button>
        <Button onClick={randomize}>
          <Icon name="shuffle" size={14} />
          New numbers
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Segmented label="Speed" options={SPEEDS} value={speed} onChange={setSpeed} />
          <label className="sr-only" htmlFor="program-select">
            Program
          </label>
          <select
            id="program-select"
            value={progIdx}
            onChange={(e) => {
              setProgIdx(Number(e.target.value));
              reset();
            }}
            className="h-9 rounded-full border-0 bg-black/[0.06] px-3.5 text-[13px] text-ink transition hover:bg-black/[0.1]"
          >
            {PROGRAMS.map((p, i) => (
              <option key={p.name} value={i}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* run progress */}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-panel3">
          <div
            className="h-full origin-left rounded-full bg-accent transition-transform duration-300 ease-out"
            style={{ transform: `scaleX(${stepsDone / totalSteps})` }}
          />
        </div>
        <span className="font-mono text-xs text-faint tabular-nums">
          clock {stepsDone}/{totalSteps}
        </span>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* program */}
        <div>
          <h3 className="text-[13px] font-medium text-mute">
            Program · shared by all cores
          </h3>
          <p className="mt-1.5 font-mono text-sm text-ink">{program.goal}</p>

          <ol className="relative mt-2.5 overflow-hidden rounded-2xl bg-white font-mono text-[13px]">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 border-l-2 border-accent bg-accent/[0.08] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              style={{ height: LINE_H, transform: `translateY(${sim.pc * LINE_H}px)` }}
            />
            {program.code.map((ins, i) => {
              const here = i === sim.pc;
              return (
                <li
                  key={i}
                  aria-current={here ? "step" : undefined}
                  className={`relative flex items-center gap-3 px-3 whitespace-pre transition-colors duration-300 ${
                    here ? "text-ink" : i < sim.pc ? "text-faint" : "text-mute"
                  }`}
                  style={{ height: LINE_H }}
                >
                  <span className="w-3 text-right text-faint">{i}</span>
                  <span>{asm(ins)}</span>
                  {here && (
                    <span className="pop-in ml-auto rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      PC
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          {/* phase indicator */}
          <div className="relative mt-3 grid grid-cols-3 rounded-full bg-black/[0.06] p-0.5">
            <span
              aria-hidden="true"
              className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc((100%-4px)/3)] rounded-full bg-ink transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                sim.done ? "opacity-0" : ""
              }`}
              style={{ transform: `translateX(${phaseIdx * 100}%)` }}
            />
            {PHASES.map((p) => (
              <span
                key={p}
                className={`relative z-10 py-1.5 text-center text-[11px] font-semibold tracking-wider uppercase transition-colors duration-300 ${
                  sim.phase === p && !sim.done ? "text-white" : "text-mute"
                }`}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          {/* cores */}
          <h3 className="text-[13px] font-medium text-mute">
            {NUM_CORES} cores · 4 registers each (tiny scratch-pad memories)
          </h3>
          <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sim.regs.map((regs, c) => (
              <div
                key={c}
                className="rounded-2xl bg-white p-3.5 transition-shadow duration-300"
                style={{
                  boxShadow:
                    sim.phase === "execute" && !sim.done
                      ? `0 0 0 1.5px ${CORE_COLORS[c]}`
                      : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold" style={{ color: CORE_COLORS[c] }}>
                    Core {c}
                  </span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${playing ? "pulse-soft" : ""}`}
                    style={{ background: sim.done ? "#c7c7cc" : CORE_COLORS[c] }}
                  />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-xs">
                  {regs.map((v, r) => {
                    const wrote = sim.wroteReg[c] === r;
                    return (
                      <div
                        key={`${r}-${wrote ? sim.pc : "idle"}`}
                        className={`flex justify-between rounded-md px-1.5 py-1 tabular-nums ${
                          wrote ? "flash" : ""
                        }`}
                        style={{
                          background: wrote ? CORE_COLORS[c] : "#f5f5f7",
                          color: wrote ? "#fff" : undefined,
                        }}
                      >
                        <span className="opacity-55">R{r}</span>
                        <span className="font-semibold">{v}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* memory */}
          <h3 className="mt-5 text-[13px] font-medium text-mute">
            Memory · shared, like VRAM
          </h3>
          <div className="mt-2.5 grid gap-3 sm:grid-cols-3">
            {REGION.map((name, ri) => (
              <div key={name} className="rounded-2xl bg-white p-3.5">
                <div className="text-xs text-mute">
                  List <b className="font-semibold text-ink">{name}</b>
                  <span className="text-faint">{ri === 2 ? " · results" : " · input"}</span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {Array.from({ length: REGION_SIZE }, (_, i) => {
                    const addr = ri * REGION_SIZE + i;
                    const core = sim.memAccess.findIndex((m) => m?.addr === addr);
                    const hit = core >= 0;
                    return (
                      <div
                        key={`${addr}-${hit ? sim.pc : "idle"}`}
                        className={`rounded-md py-1.5 text-center font-mono ${hit ? "flash" : ""}`}
                        style={{
                          background: hit ? `${CORE_COLORS[core]}1a` : "#f5f5f7",
                          boxShadow: hit
                            ? `0 0 0 2px ${CORE_COLORS[core]}`
                            : "none",
                        }}
                      >
                        <div className="text-[10px] text-faint">
                          {name}[{i}]
                        </div>
                        <div className="text-sm font-semibold tabular-nums">{sim.mem[addr]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="mt-5 flex min-h-[76px] gap-3 rounded-2xl bg-white p-5"
        aria-live="polite"
      >
        <span
          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
            sim.done ? "bg-comp" : "pulse-soft bg-accent"
          }`}
        />
        <p key={`${sim.pc}-${sim.phase}-${sim.done}`} className="pop-in text-sm leading-relaxed">
          {narrate(sim, program)}
        </p>
      </div>
    </Surface>
  );
}
