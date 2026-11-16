"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Icon } from "@/components/ui";
import { CHAPTERS } from "@/lib/chapters";

const ITEMS = [
  ...CHAPTERS.map((c) => ({ href: c.href, label: c.nav })),
  { href: "/components", label: "Components" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const pill = useRef<HTMLSpanElement>(null);
  const links = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const active =
    ITEMS.find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))?.href ?? null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close the mobile menu after navigating
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  // slide the highlight pill to the current page's link
  useGSAP(
    () => {
      const el = active ? links.current[active] : null;
      if (!pill.current) return;
      if (!el) {
        gsap.set(pill.current, { autoAlpha: 0 });
        return;
      }
      gsap.to(pill.current, {
        x: el.offsetLeft,
        width: el.offsetWidth,
        autoAlpha: 1,
        duration: 0.4,
        ease: "power3.out",
      });
    },
    { dependencies: [active] },
  );

  return (
    <header
      className={`sticky top-0 z-30 backdrop-blur-xl backdrop-saturate-150 transition-[background-color,box-shadow] duration-300 ${
        scrolled || open ? "bg-white/80 shadow-[0_1px_0_rgba(0,0,0,0.08)]" : "bg-white/0"
      }`}
    >
      <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center gap-6 px-5 sm:px-8">
        <Link
          href="/"
          className="group -ml-1 flex items-center gap-2 rounded-lg px-1 py-1 text-[15px] font-semibold tracking-tight"
        >
          <span className="grid h-[18px] w-[18px] grid-cols-2 gap-[2px] transition-transform duration-500 group-hover:rotate-90">
            <span className="rounded-[2px] bg-ink" />
            <span className="rounded-[2px] bg-ink/35" />
            <span className="rounded-[2px] bg-ink/35" />
            <span className="rounded-[2px] bg-ink" />
          </span>
          GPU Explorer
        </Link>

        <nav aria-label="Main" className="relative -mr-3 ml-auto hidden items-center lg:flex">
          <span
            ref={pill}
            aria-hidden="true"
            className="invisible absolute top-1/2 left-0 h-8 -translate-y-1/2 rounded-full bg-black/[0.06]"
          />
          {ITEMS.map((n) => (
            <Link
              key={n.href}
              ref={(el) => {
                links.current[n.href] = el;
              }}
              href={n.href}
              aria-current={active === n.href ? "page" : undefined}
              className={`relative z-10 rounded-full px-3 py-2 text-[13px] transition-colors ${
                active === n.href ? "text-ink" : "text-ink/65 hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
          className="-mr-2 ml-auto grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-black/[0.05] active:scale-95 lg:hidden"
        >
          <Icon name={open ? "close" : "menu"} size={20} />
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="pop-in lg:hidden">
          <ul className="mx-auto w-full max-w-[1120px] px-5 pb-4 sm:px-8">
            {ITEMS.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active === n.href ? "page" : undefined}
                  className={`flex min-h-12 items-center border-b border-line text-[17px] ${
                    active === n.href ? "font-semibold text-ink" : "text-ink/75"
                  }`}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
