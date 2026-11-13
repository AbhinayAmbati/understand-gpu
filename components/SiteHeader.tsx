"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Icon } from "@/components/ui";

export const NAV = [
  { id: "anatomy", label: "Components" },
  { id: "parallel", label: "CPU vs GPU" },
  { id: "core", label: "Inside a core" },
  { id: "pipeline", label: "Drawing a frame" },
  { id: "build", label: "Build your own" },
];

export default function SiteHeader() {
  const root = useRef<HTMLElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const links = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // reading-progress bar + scroll spy
  useGSAP(() => {
    gsap.to(bar.current, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.4 },
    });
    ScrollTrigger.create({
      start: 8,
      end: "max",
      onToggle: (self) => setScrolled(self.isActive),
    });
    NAV.forEach((n) => {
      ScrollTrigger.create({
        trigger: `#${n.id}`,
        start: "top 45%",
        end: "bottom 45%",
        onToggle: (self) => {
          if (self.isActive) setActive(n.id);
        },
        onLeaveBack: () => {
          if (n.id === NAV[0].id) setActive(null);
        },
      });
    });
  });

  // slide the highlight pill to the active link
  useGSAP(
    () => {
      const el = active ? links.current[active] : null;
      if (!pill.current) return;
      if (!el) {
        gsap.to(pill.current, { autoAlpha: 0, duration: 0.2 });
        return;
      }
      gsap.to(pill.current, {
        x: el.offsetLeft,
        width: el.offsetWidth,
        autoAlpha: 1,
        duration: 0.45,
        ease: "power3.out",
      });
    },
    { dependencies: [active] },
  );

  return (
    <header
      ref={root}
      className={`sticky top-0 z-30 border-b backdrop-blur-xl transition-colors duration-300 ${
        scrolled || open ? "border-line bg-bg/80" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <a href="#top" className="group flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid h-6 w-6 grid-cols-2 gap-[3px] rounded-md bg-comp/15 p-[5px] ring-1 ring-comp/30 transition-transform duration-300 group-hover:rotate-90">
            <span className="rounded-[1.5px] bg-comp" />
            <span className="rounded-[1.5px] bg-comp/60" />
            <span className="rounded-[1.5px] bg-comp/60" />
            <span className="rounded-[1.5px] bg-comp" />
          </span>
          GPU Explorer
        </a>

        <nav aria-label="Sections" className="relative ml-auto hidden items-center md:flex">
          <span
            ref={pill}
            aria-hidden="true"
            className="invisible absolute top-1/2 left-0 h-8 -translate-y-1/2 rounded-full bg-panel3 ring-1 ring-linestrong"
          />
          {NAV.map((n) => (
            <a
              key={n.id}
              ref={(el) => {
                links.current[n.id] = el;
              }}
              href={`#${n.id}`}
              aria-current={active === n.id ? "true" : undefined}
              className={`relative z-10 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                active === n.id ? "text-ink" : "text-mute hover:text-ink"
              }`}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-line text-mute transition active:scale-95 md:hidden"
        >
          <Icon name={open ? "close" : "menu"} size={18} />
        </button>
      </div>

      {open && (
        <nav aria-label="Sections" className="pop-in border-t border-line px-4 py-2 md:hidden">
          {NAV.map((n, i) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm ${
                active === n.id ? "text-ink" : "text-mute"
              }`}
            >
              <span className="font-mono text-xs text-faint">0{i + 1}</span>
              {n.label}
            </a>
          ))}
        </nav>
      )}

      <div
        ref={bar}
        aria-hidden="true"
        className="absolute bottom-[-1px] left-0 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-comp via-mem to-io"
      />
    </header>
  );
}
