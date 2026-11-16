"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import Link from "next/link";
import { Icon } from "@/components/ui";


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
    <div ref={root} className="relative pt-12 pb-4 text-center sm:pt-20">
      <p className="hero-eyebrow text-[17px] font-semibold text-accent sm:text-[19px]">
        GPU Explorer
      </p>
      <h1 className="mx-auto mt-2 max-w-4xl text-[2.25rem] leading-[1.06] font-semibold tracking-[-0.03em] sm:text-[4.5rem]">
        <span className="block overflow-hidden pb-1">
          <span className="hero-line block">How a GPU works.</span>
        </span>
        <span className="block overflow-hidden pb-2">
          <span className="hero-line block text-mute">One component at a time.</span>
        </span>
      </h1>
      <p className="hero-copy mx-auto mt-5 max-w-2xl text-[19px] leading-[1.45] text-mute sm:text-[21px]">
        A GPU is fast for one reason: it does the same simple calculation on thousands of pieces
        of data at once. Open one up, follow a job through it, and run a working miniature in
        your browser.
      </p>
      <div className="hero-cta mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <Link
          href="/model"
          className="inline-flex h-11 items-center rounded-full bg-accent px-[22px] text-[17px] text-white transition-[background-color,scale] duration-200 hover:bg-[#0077ed] active:scale-[0.97]"
        >
          Explore in 3D
        </Link>
        <Link
          href="/how-it-works"
          className="group inline-flex h-11 items-center gap-1 text-[17px] text-accent underline-offset-4 hover:underline"
        >
          Start the guided tour
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            <Icon name="next" size={18} />
          </span>
        </Link>
      </div>

      {/* animated chip */}
      <div className="chip-wrap mx-auto mt-10 w-full max-w-[300px] [perspective:900px] sm:mt-14 sm:max-w-[400px]">
        <div ref={chip} className="[transform-style:preserve-3d]">
          <svg
            viewBox="0 0 420 420"
            className="chip-float block h-auto w-full drop-shadow-[0_34px_38px_rgba(0,0,0,0.2)]"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="chip-body" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#3a3a3c" />
                <stop offset="1" stopColor="#111113" />
              </linearGradient>
            </defs>
            <g fill="none" strokeLinecap="round">
              {TRACES.map((d, i) => (
                <g key={i}>
                  <path
                    d={d}
                    className="chip-trace"
                    stroke="#d2d2d7"
                    strokeWidth="2.5"
                    pathLength={1}
                    strokeDasharray="1"
                  />
                  <path
                    d={d}
                    className="chip-pulse"
                    stroke="#0071e3"
                    strokeWidth="2.5"
                    pathLength={1}
                    strokeDasharray="0.3 1"
                    strokeDashoffset="0.3"
                  />
                </g>
              ))}
            </g>
            <rect
              x={ORIGIN - 20}
              y={ORIGIN - 20}
              width={CHIP + 40}
              height={CHIP + 40}
              rx="30"
              fill="url(#chip-body)"
            />
            {Array.from({ length: GRID * GRID }, (_, i) => (
              <rect
                key={i}
                className="chip-cell"
                x={ORIGIN + (i % GRID) * (CELL + GAP)}
                y={ORIGIN + Math.floor(i / GRID) * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx="5"
                fill={(i * 7) % 5 === 0 ? "#2997ff" : "#ffffff"}
                fillOpacity="0.12"
              />
            ))}
          </svg>
        </div>
      </div>

    </div>
  );
}
