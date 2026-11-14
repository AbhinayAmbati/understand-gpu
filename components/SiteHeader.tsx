"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Icon } from "@/components/ui";

/** sections of the home page, in order */
export const SECTIONS = [
  { id: "model", label: "3D model" },
  { id: "anatomy", label: "How it connects" },
  { id: "parallel", label: "CPU vs GPU" },
  { id: "core", label: "Inside a core" },
  { id: "pipeline", label: "Drawing a frame" },
  { id: "build", label: "Build your own" },
];

type Item = { key: string; href: string; label: string };

const HOME_ITEMS: Item[] = [
  ...SECTIONS.map((s) => ({ key: s.id, href: `#${s.id}`, label: s.label })),
  { key: "components", href: "/components", label: "Components" },
];

const SUB_ITEMS: Item[] = [
  { key: "home", href: "/", label: "Overview" },
  { key: "model", href: "/#model", label: "3D model" },
  { key: "components", href: "/components", label: "Components" },
];

export default function SiteHeader({ home = false }: { home?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const links = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [spy, setSpy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const items = home ? HOME_ITEMS : SUB_ITEMS;
  const active = home ? spy : "components";

  // reading-progress bar, and on the home page a scroll spy
  useGSAP(
    () => {
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
      if (!home) return;
      SECTIONS.forEach((n) => {
        if (!document.getElementById(n.id)) return;
        ScrollTrigger.create({
          trigger: `#${n.id}`,
          start: "top 45%",
          end: "bottom 45%",
          onToggle: (self) => {
            if (self.isActive) setSpy(n.id);
          },
          onLeaveBack: () => {
            if (n.id === SECTIONS[0].id) setSpy(null);
          },
        });
      });
    },
    { dependencies: [home] },
  );

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

  const linkClass = (key: string) =>
    `relative z-10 rounded-full px-3 py-1.5 text-xs transition-colors ${
      active === key ? "text-ink" : "text-ink/70 hover:text-ink"
    }`;

  return (
    <header
      ref={root}
      className={`sticky top-0 z-30 backdrop-blur-xl backdrop-saturate-150 transition-[background-color,box-shadow] duration-300 ${
        scrolled || open ? "bg-white/80 shadow-[0_1px_0_rgba(0,0,0,0.08)]" : "bg-white/0"
      }`}
    >
      <div className="mx-auto flex h-12 max-w-[1100px] items-center gap-6 px-5 sm:px-6">
        <Link
          href={home ? "#top" : "/"}
          className="group flex items-center gap-2 text-[15px] font-semibold tracking-tight"
        >
          <span className="grid h-[18px] w-[18px] grid-cols-2 gap-[2px] transition-transform duration-500 group-hover:rotate-90">
            <span className="rounded-[2px] bg-ink" />
            <span className="rounded-[2px] bg-ink/35" />
            <span className="rounded-[2px] bg-ink/35" />
            <span className="rounded-[2px] bg-ink" />
          </span>
          GPU Explorer
        </Link>

        <nav aria-label="Main" className="relative ml-auto hidden items-center lg:flex">
          <span
            ref={pill}
            aria-hidden="true"
            className="invisible absolute top-1/2 left-0 h-7 -translate-y-1/2 rounded-full bg-black/[0.06]"
          />
          {items.map((n) => (
            <Link
              key={n.key}
              ref={(el) => {
                links.current[n.key] = el;
              }}
              href={n.href}
              aria-current={active === n.key ? "true" : undefined}
              className={linkClass(n.key)}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="ml-auto grid h-9 w-9 place-items-center rounded-full text-ink transition active:scale-95 lg:hidden"
        >
          <Icon name={open ? "close" : "menu"} size={18} />
        </button>
      </div>

      {open && (
        <nav aria-label="Main" className="pop-in px-5 pt-1 pb-4 lg:hidden">
          {items.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`block border-b border-line py-3 text-[17px] ${
                active === n.key ? "text-ink" : "text-mute"
              }`}
            >
              {n.label}
            </Link>
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
