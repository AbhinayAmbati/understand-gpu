"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { CountUp, Icon, LinkButton } from "@/components/ui";

const STATS = [
  { value: 13, label: "components explained" },
  { value: 9, label: "steps in the guided tour" },
  { value: 4, label: "cores in the live simulator" },
  { value: 6, label: "pipeline stages animated" },
];

const GRID = 8;
const CELL = 22;
const GAP = 6;
const CHIP = GRID * CELL + (GRID - 1) * GAP; // 218
const ORIGIN = (420 - CHIP) / 2;

// copper traces leaving each side of the chip
const TRACES = Array.from({ length: 28 }, (_, i) => {
  const side = Math.floor(i / 7);
  const k = i % 7;
  const offset = ORIGIN + 16 + k * ((CHIP - 32) / 6);
  const inner = ORIGIN - 18;
  const outer = 18 + ((k * 13) % 30);
  const far = 420 - outer;
  const innerFar = 420 - inner;
  switch (side) {
    case 0:
      return `M${offset} ${inner} L${offset} ${outer}`;
    case 1:
      return `M${innerFar} ${offset} L${far} ${offset}`;
    case 2:
      return `M${offset} ${innerFar} L${offset} ${far}`;
    default:
      return `M${inner} ${offset} L${outer} ${offset}`;
  }
});

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      // entrance
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-eyebrow", { y: 12, autoAlpha: 0, duration: 0.5 })
        .from(".hero-line", { yPercent: 110, duration: 0.9, stagger: 0.09 }, "-=0.25")
        .from(".hero-copy", { y: 16, autoAlpha: 0, duration: 0.6 }, "-=0.5")
        .from(".hero-cta > *", { y: 12, autoAlpha: 0, duration: 0.5, stagger: 0.07 }, "-=0.4")
        .from(".hero-stat", { y: 16, autoAlpha: 0, duration: 0.5, stagger: 0.06 }, "-=0.3")
        .from(
          ".chip-wrap",
          { scale: 0.86, autoAlpha: 0, duration: 1.1, ease: "power2.out" },
          0.15,
        )
        .from(
          ".chip-trace",
          { strokeDashoffset: 1, duration: 0.9, stagger: { each: 0.02, from: "random" } },
          0.5,
        );

      // cores twinkle, signals pulse along traces, chip floats
      gsap.to(".chip-cell", {
        fillOpacity: 0.95,
        duration: 0.7,
        ease: "sine.inOut",
        stagger: { each: 0.045, from: "random", repeat: -1, yoyo: true, repeatDelay: 0.6 },
      });
      gsap.fromTo(
        ".chip-pulse",
        { strokeDashoffset: 0.3 },
        {
          strokeDashoffset: -1,
          duration: 1.6,
          ease: "none",
          repeat: -1,
          stagger: { each: 0.21, from: "random" },
        },
      );
      gsap.to(".chip-float", { y: -8, duration: 3.2, ease: "sine.inOut", repeat: -1, yoyo: true });

      // tilt toward the pointer
      const rx = gsap.quickTo(chip.current, "rotationX", { duration: 0.6, ease: "power3.out" });
      const ry = gsap.quickTo(chip.current, "rotationY", { duration: 0.6, ease: "power3.out" });
      const move = (e: PointerEvent) => {
        const r = root.current!.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 16);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
      };
      const leave = () => {
        rx(0);
        ry(0);
      };
      const el = root.current!;
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative pt-10 pb-6 sm:pt-16 lg:pt-20">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <p className="hero-eyebrow inline-flex items-center gap-2 rounded-full border border-line bg-panel2/60 py-1 pr-3 pl-2 text-xs text-mute">
            <span className="pulse-soft h-1.5 w-1.5 rounded-full bg-comp" />
            An animated guide for complete beginners
          </p>
          <h1 className="mt-5 text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.035em] sm:text-[3.4rem]">
            <span className="block overflow-hidden pb-1">
              <span className="hero-line block">How a GPU works,</span>
            </span>
            <span className="block overflow-hidden pb-2">
              <span className="hero-line block bg-gradient-to-r from-comp via-[#8fe9d0] to-mem bg-clip-text text-transparent">
                one component at a time
              </span>
            </span>
          </h1>
          <p className="hero-copy mt-5 max-w-xl text-[17px] leading-relaxed text-mute">
            A GPU is fast for one reason: it does the same simple calculation on thousands of
            pieces of data at once. Open one up, follow a job through it, and run a working
            miniature in your browser.
          </p>
          <div className="hero-cta mt-8 flex flex-wrap gap-3">
            <LinkButton href="#anatomy" variant="primary" className="group">
              Open the GPU
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                <Icon name="arrow" />
              </span>
            </LinkButton>
            <LinkButton href="#core">
              <Icon name="play" size={14} />
              Run the tiny GPU
            </LinkButton>
          </div>
        </div>

        {/* animated chip */}
        <div className="chip-wrap mx-auto w-full max-w-[340px] [perspective:900px] lg:max-w-none">
          <div ref={chip} className="[transform-style:preserve-3d]">
            <svg viewBox="0 0 420 420" className="chip-float block h-auto w-full" aria-hidden="true">
              <defs>
                <linearGradient id="chip-edge" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#5ee6a0" stopOpacity="0.9" />
                  <stop offset="0.5" stopColor="#2e3a4b" />
                  <stop offset="1" stopColor="#5ab8ff" stopOpacity="0.9" />
                </linearGradient>
                <radialGradient id="chip-glow">
                  <stop offset="0" stopColor="#5ee6a0" stopOpacity="0.22" />
                  <stop offset="1" stopColor="#5ee6a0" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="210" cy="210" r="205" fill="url(#chip-glow)" />
              <g fill="none" strokeLinecap="round">
                {TRACES.map((d, i) => (
                  <g key={i}>
                    <path
                      d={d}
                      className="chip-trace"
                      stroke="#2e3a4b"
                      strokeWidth="2"
                      pathLength={1}
                      strokeDasharray="1"
                    />
                    <path
                      d={d}
                      className="chip-pulse"
                      stroke={i % 3 === 0 ? "#5ab8ff" : "#5ee6a0"}
                      strokeWidth="2"
                      pathLength={1}
                      strokeDasharray="0.3 1"
                      strokeDashoffset="0.3"
                    />
                  </g>
                ))}
              </g>
              <rect
                x={ORIGIN - 18}
                y={ORIGIN - 18}
                width={CHIP + 36}
                height={CHIP + 36}
                rx="18"
                fill="#0b1016"
                stroke="url(#chip-edge)"
                strokeWidth="1.5"
              />
              {Array.from({ length: GRID * GRID }, (_, i) => (
                <rect
                  key={i}
                  className="chip-cell"
                  x={ORIGIN + (i % GRID) * (CELL + GAP)}
                  y={ORIGIN + Math.floor(i / GRID) * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  rx="4"
                  fill={(i * 7) % 5 === 0 ? "#5ab8ff" : "#5ee6a0"}
                  fillOpacity="0.14"
                />
              ))}
            </svg>
          </div>
        </div>
      </div>

      <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:mt-16 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="hero-stat bg-panel px-5 py-4">
            <dd className="text-2xl font-semibold tracking-tight">
              <CountUp value={s.value} />
            </dd>
            <dt className="mt-0.5 text-[13px] text-mute">{s.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
