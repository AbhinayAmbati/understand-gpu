"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { Button, Icon, Surface } from "@/components/ui";
import { DETAILS } from "@/lib/details";
import { CATEGORY, PARTS, PART_BY_ID, type PartId } from "@/lib/parts";

const Gpu3D = dynamic(() => import("@/components/Gpu3D"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-mute">
      <span className="pulse-soft">Loading 3D model…</span>
    </div>
  ),
});

export default function GpuModelExplorer() {
  const [selected, setSelected] = useState<PartId | null>(null);
  const [isolate, setIsolate] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const part = selected ? PART_BY_ID[selected] : null;
  const detail = selected ? DETAILS[selected] : null;
  const color = part ? CATEGORY[part.cat].color : "#0071e3";

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".model-item", {
        y: 10,
        autoAlpha: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: "power2.out",
        clearProps: "all",
      });
    },
    { dependencies: [selected], scope: panel },
  );

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Surface className="h-[420px] sm:h-[560px]">
          <Gpu3D
            selected={selected}
            isolate={isolate}
            onSelect={setSelected}
            className="h-full rounded-[28px]"
          />
        </Surface>

        <Surface className="p-6 sm:p-7">
          <div ref={panel} aria-live="polite">
            {part && detail ? (
              <>
                <p
                  className="model-item flex items-center gap-1.5 text-[13px] font-medium"
                  style={{ color }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                  {CATEGORY[part.cat].label}
                </p>
                <h3 className="model-item mt-2 text-2xl font-semibold tracking-tight">
                  {part.name}
                </h3>
                <p className="model-item mt-2 text-[15px] leading-relaxed text-mute">
                  {part.what}
                </p>

                <dl className="model-item mt-5 grid grid-cols-2 gap-2">
                  {detail.specs.slice(0, 2).map((s) => (
                    <div key={s.label} className="rounded-2xl bg-white p-3.5">
                      <dd className="text-lg font-semibold tracking-tight">{s.value}</dd>
                      <dt className="mt-0.5 text-xs leading-snug text-mute">{s.label}</dt>
                    </div>
                  ))}
                </dl>

                <div className="model-item mt-5 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/components/${part.id}`}
                    className="group inline-flex h-9 items-center gap-1 rounded-full bg-accent px-4 text-sm text-white transition hover:bg-[#0077ed] active:scale-[0.97]"
                  >
                    Read the full page
                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                      <Icon name="next" size={16} />
                    </span>
                  </Link>
                  <Button aria-pressed={isolate} onClick={() => setIsolate((v) => !v)}>
                    {isolate ? "Show all parts" : "Isolate"}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setIsolate(false);
                  }}
                  className="model-item mt-4 text-[13px] text-accent underline-offset-4 hover:underline"
                >
                  Back to the whole card
                </button>
              </>
            ) : (
              <>
                <p className="model-item text-[13px] font-medium text-mute">The whole card</p>
                <h3 className="model-item mt-2 text-2xl font-semibold tracking-tight">
                  Pick a part to look closer
                </h3>
                <p className="model-item mt-2 text-[15px] leading-relaxed text-mute">
                  The cooler is lifted off so you can see the chip underneath. Drag to turn the
                  card, slide “Open up” to put it back together, and click any part to fly to it.
                </p>
                <ul className="model-item mt-5 space-y-2 text-sm text-mute">
                  <li className="flex gap-2.5">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    The coloured blocks in the middle are the regions of the GPU chip.
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    The dark chips beside it are the VRAM.
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    The blue board in front is the rest of the computer.
                  </li>
                </ul>
              </>
            )}
          </div>
        </Surface>
      </div>

      {/* every part as a button, for keyboard and touch */}
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {PARTS.map((p) => {
          const on = selected === p.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={on}
              onClick={() => setSelected(on ? null : p.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition active:scale-95 ${
                on ? "bg-ink text-white" : "bg-panel text-ink hover:bg-panel3"
              }`}
            >
              <span
                className="h-2 w-2 rounded-[3px]"
                style={{ background: CATEGORY[p.cat].color }}
              />
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
