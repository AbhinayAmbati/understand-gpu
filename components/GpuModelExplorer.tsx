"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { Button, Icon } from "@/components/ui";
import { DETAILS } from "@/lib/details";
import { CATEGORY, PARTS, PART_BY_ID, type Category, type PartId } from "@/lib/parts";

const Gpu3D = dynamic(() => import("@/components/Gpu3D"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-mute">
      <span className="pulse-soft">Loading 3D model…</span>
    </div>
  ),
});

const GROUPS: Category[] = ["comp", "ctrl", "mem", "io", "pwr", "cool"];

export default function GpuModelExplorer() {
  const [selected, setSelected] = useState<PartId | null>(null);
  const [isolate, setIsolate] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const part = selected ? PART_BY_ID[selected] : null;
  const detail = selected ? DETAILS[selected] : null;
  const color = part ? CATEGORY[part.cat].color : "#0071e3";

  // the panel content eases in whenever it changes
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".panel-item", {
        y: 8,
        autoAlpha: 0,
        duration: 0.35,
        stagger: 0.035,
        ease: "power2.out",
        clearProps: "all",
      });
      panel.current?.scrollTo({ top: 0 });
    },
    { dependencies: [selected], scope: panel },
  );

  const choose = (id: PartId | null) => {
    setSelected(id);
    if (!id) setIsolate(false);
  };

  return (
    <div className="grid gap-4 lg:h-[620px] lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="surface h-[420px] sm:h-[540px] lg:h-full">
        <Gpu3D
          selected={selected}
          isolate={isolate}
          onSelect={choose}
          className="h-full rounded-[28px]"
        />
      </div>

      <aside
        ref={panel}
        aria-label="Parts"
        aria-live="polite"
        className="surface overflow-y-auto overscroll-contain p-6 sm:p-7 lg:h-full"
      >
        {part && detail ? (
          <div>
            <button
              type="button"
              onClick={() => choose(null)}
              className="panel-item -ml-2 inline-flex h-9 items-center gap-0.5 rounded-full px-2 text-[15px] text-accent transition hover:bg-black/[0.05]"
            >
              <Icon name="prev" size={18} />
              All parts
            </button>

            <p
              className="panel-item mt-5 flex items-center gap-1.5 text-[13px] font-medium"
              style={{ color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              {CATEGORY[part.cat].label}
            </p>
            <h2 className="panel-item mt-1.5 text-[26px] leading-tight font-semibold tracking-tight">
              {part.name}
            </h2>
            <p className="panel-item mt-2 text-[15px] leading-relaxed text-mute">{part.what}</p>

            <dl className="panel-item mt-5 grid grid-cols-2 gap-2">
              {detail.specs.slice(0, 2).map((s) => (
                <div key={s.label} className="rounded-2xl bg-white p-4">
                  <dd className="text-[19px] leading-tight font-semibold tracking-tight">{s.value}</dd>
                  <dt className="mt-1 text-xs leading-snug text-mute">{s.label}</dt>
                </div>
              ))}
            </dl>

            <div className="panel-item mt-5 flex flex-wrap gap-2">
              <Link
                href={`/components/${part.id}`}
                className="group inline-flex h-10 items-center gap-0.5 rounded-full bg-accent pr-3 pl-4 text-[15px] text-white transition hover:bg-[#0077ed] active:scale-[0.97]"
              >
                Full page
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                  <Icon name="next" size={18} />
                </span>
              </Link>
              <Button
                aria-pressed={isolate}
                onClick={() => setIsolate((v) => !v)}
                className="h-10! px-4! text-[15px]!"
              >
                {isolate ? "Show everything" : "Show only this"}
              </Button>
            </div>

            <h3 className="panel-item mt-7 text-[13px] font-medium text-mute">Think of it as</h3>
            <p className="panel-item mt-1.5 text-[15px] leading-relaxed">{part.analogy}</p>
          </div>
        ) : (
          <div>
            <h2 className="panel-item text-[26px] leading-tight font-semibold tracking-tight">
              Pick a part
            </h2>
            <p className="panel-item mt-2 text-[15px] leading-relaxed text-mute">
              Click it on the model or choose it below. The cooler is lifted off so you can see the
              chip; slide “Open up” to put the card back together.
            </p>
            {GROUPS.map((cat) => (
              <div key={cat} className="panel-item mt-6">
                <h3 className="flex items-center gap-1.5 text-[13px] font-medium text-mute">
                  <span
                    className="h-2 w-2 rounded-[3px]"
                    style={{ background: CATEGORY[cat].color }}
                  />
                  {CATEGORY[cat].label}
                </h3>
                <ul className="mt-1.5">
                  {PARTS.filter((p) => p.cat === cat).map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => choose(p.id)}
                        className="group -mx-3 flex min-h-11 w-[calc(100%+1.5rem)] items-center justify-between rounded-xl px-3 text-left text-[15px] transition-colors hover:bg-white"
                      >
                        {p.name}
                        <span
                          aria-hidden="true"
                          className="text-mute transition-transform duration-200 group-hover:translate-x-0.5"
                        >
                          ›
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
