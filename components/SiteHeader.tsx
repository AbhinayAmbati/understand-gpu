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
      className={`sticky top-0 z-30 backdrop-blur-xl backdrop-saturate-150 transition-[background-color,box-shadow] duration-300 ${
        scrolled || open
          ? "bg-white/80 shadow-[0_1px_0_rgba(0,0,0,0.08)]"
          : "bg-white/0"
      }`}
    >
      <div className="mx-auto flex h-12 max-w-[1024px] items-center gap-6 px-5 sm:px-6">
        <a
          href="#top"
          className="group flex items-center gap-2 text-[15px] font-semibold tracking-tight"
        >
          <span className="grid h-[18px] w-[18px] grid-cols-2 gap-[2px] transition-transform duration-500 group-hover:rotate-90">
            <span className="rounded-[2px] bg-ink" />
            <span className="rounded-[2px] bg-ink/35" />
            <span className="rounded-[2px] bg-ink/35" />
            <span className="rounded-[2px] bg-ink" />
          </span>
          GPU Explorer
        </a>

        <nav aria-label="Sections" className="relative ml-auto hidden items-center md:flex">
          <span
            ref={pill}
            aria-hidden="true"
            className="invisible absolute top-1/2 left-0 h-7 -translate-y-1/2 rounded-full bg-black/[0.06]"
          />
          {NAV.map((n) => (
            <a
              key={n.id}
              ref={(el) => {
                links.current[n.id] = el;
              }}
              href={`#${n.id}`}
              aria-current={active === n.id ? "true" : undefined}
              className={`relative z-10 rounded-full px-3 py-1.5 text-xs transition-colors ${
                active === n.id ? "text-ink" : "text-ink/70 hover:text-ink"
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
          className="ml-auto grid h-9 w-9 place-items-center rounded-full text-ink transition active:scale-95 md:hidden"
        >
          <Icon name={open ? "close" : "menu"} size={18} />
        </button>
      </div>

      {open && (
        <nav aria-label="Sections" className="pop-in px-5 pt-1 pb-4 md:hidden">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={() => setOpen(false)}
              className={`block border-b border-line py-3 text-[17px] ${
                active === n.id ? "text-ink" : "text-mute"
              }`}
            >
              {n.label}
            </a>
          ))}
        </nav>
      )}

      <div
        ref={bar}
        aria-hidden="true"
        className="absolute bottom-[-1px] left-0 h-px w-full origin-left scale-x-0 bg-accent"
      />
    </header>
  );
}
