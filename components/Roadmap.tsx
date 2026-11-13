"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { Surface } from "@/components/ui";

const ROADMAP = [
  {
    title: "Logic gates",
    text: "Learn AND, OR, NOT, adders and registers. Everything in section 3 is built from these.",
    tag: "Foundations",
  },
  {
    title: "One core",
    text: "Describe the fetch, decode and execute steps in Verilog and test them in a free simulator.",
    tag: "Simulation",
  },
  {
    title: "Many cores",
    text: "Copy the core, add a scheduler and shared memory. That is the tiny GPU from section 3.",
    tag: "Simulation",
  },
  {
    title: "Real hardware",
    text: "Load the design onto an FPGA board, then optionally have it made as a real chip.",
    tag: "Hardware",
  },
];

export default function Roadmap() {
  const root = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
      });
      tl.from(".road-line", { scaleX: 0, duration: 1.2, ease: "power2.inOut" })
        .from(
          ".road-dot",
          { scale: 0, duration: 0.4, ease: "back.out(2.5)", stagger: 0.22 },
          0.1,
        )
        .from(
          ".road-card",
          { y: 24, autoAlpha: 0, duration: 0.6, ease: "power3.out", stagger: 0.22 },
          0.15,
        );
    },
    { scope: root },
  );

  return (
    <ol ref={root} className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:pt-8">
      <span
        aria-hidden="true"
        className="road-line absolute top-[7px] right-[12.5%] left-[12.5%] hidden h-px origin-left bg-gradient-to-r from-comp via-mem to-io lg:block"
      />
      {ROADMAP.map((r, i) => (
        <li key={r.title} className="relative">
          <span
            aria-hidden="true"
            className="road-dot absolute -top-8 left-1/2 hidden h-[15px] w-[15px] -translate-x-1/2 rounded-full border-2 border-bg bg-comp ring-1 ring-comp/50 lg:block"
          />
          <Surface className="road-card h-full p-5 transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-comp">Step {i + 1}</span>
              <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-faint">
                {r.tag}
              </span>
            </div>
            <h3 className="mt-3 font-semibold tracking-tight">{r.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mute">{r.text}</p>
          </Surface>
        </li>
      ))}
    </ol>
  );
}
