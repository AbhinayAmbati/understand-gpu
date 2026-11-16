"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CHAPTERS } from "@/lib/chapters";
import { DETAILS } from "@/lib/details";
import { CATEGORY, PARTS, type Category } from "@/lib/parts";

type MenuId = "chapters" | "components";

const GROUPS: Category[] = ["comp", "ctrl", "mem", "io", "pwr", "cool"];

/* ---------- small icons ---------- */

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      aria-hidden="true"
      className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    >
      <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Logo() {
  return (
    <span className="grid h-[18px] w-[18px] grid-cols-2 gap-[2px] transition-transform duration-500 group-hover:rotate-90">
      <span className="rounded-[2px] bg-ink" />
      <span className="rounded-[2px] bg-ink/35" />
      <span className="rounded-[2px] bg-ink/35" />
      <span className="rounded-[2px] bg-ink" />
    </span>
  );
}

/* ---------- header ---------- */

export default function SiteHeader() {
  const pathname = usePathname();
  const [menu, setMenu] = useState<MenuId | null>(null);
  const [sheet, setSheet] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const inChapters = CHAPTERS.some((c) => pathname === c.href);
  const inComponents = pathname.startsWith("/components");
  const chapterIndex = CHAPTERS.findIndex((c) => c.href === pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close everything after navigating
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenu(null);
    setSheet(false);
  }, [pathname]);

  // Escape closes, a click outside closes
  useEffect(() => {
    if (!menu && !sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menu) bar.current?.querySelector<HTMLButtonElement>(`[data-menu="${menu}"]`)?.focus();
      setMenu(null);
      setSheet(false);
    };
    const onDown = (e: PointerEvent) => {
      if (menu && bar.current && !bar.current.contains(e.target as Node)) setMenu(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [menu, sheet]);

  // the page behind the mobile sheet should not scroll
  useEffect(() => {
    document.documentElement.style.overflow = sheet ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [sheet]);

  // hover opens a menu on devices with a mouse; a short delay stops it flickering
  const hoverOpen = useCallback((id: MenuId) => {
    window.clearTimeout(closeTimer.current);
    setMenu(id);
  }, []);
  const hoverClose = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMenu(null), 160);
  }, []);
  const pointerProps = (id: MenuId) => ({
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") hoverOpen(id);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") hoverClose();
    },
  });

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <div
        ref={bar}
        className={`relative mx-auto transition-[max-width] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          scrolled ? "max-w-[880px]" : "max-w-[1080px]"
        }`}
      >
        {/* the capsule */}
        <div
          className={`flex h-14 items-center gap-2 rounded-full border pr-2 pl-5 backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow] duration-300 ${
            scrolled || menu
              ? "border-black/[0.06] bg-white/80 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.18)]"
              : "border-transparent bg-white/55"
          }`}
        >
          <Link
            href="/"
            className="group -ml-1 flex items-center gap-2 rounded-full px-1 py-1 text-[15px] font-semibold tracking-tight"
          >
            <Logo />
            GPU Explorer
          </Link>

          {chapterIndex >= 0 && (
            <span className="ml-1 hidden rounded-full bg-black/[0.05] px-2.5 py-1 text-xs text-mute sm:inline-block lg:hidden">
              {chapterIndex + 1} / {CHAPTERS.length}
            </span>
          )}

          {/* desktop menus */}
          <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
            {(
              [
                ["chapters", "Chapters", inChapters],
                ["components", "Components", inComponents],
              ] as const
            ).map(([id, label, current]) => (
              <div key={id} {...pointerProps(id)}>
                <button
                  type="button"
                  data-menu={id}
                  aria-expanded={menu === id}
                  aria-controls={`menu-${id}`}
                  onClick={() => setMenu((m) => (m === id ? null : id))}
                  className={`relative flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] transition-colors ${
                    menu === id ? "bg-black/[0.06] text-ink" : current ? "text-ink" : "text-ink/70 hover:text-ink"
                  }`}
                >
                  {label}
                  <Chevron open={menu === id} />
                  {current && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent"
                    />
                  )}
                </button>
              </div>
            ))}
            <Link
              href="/model"
              aria-current={pathname === "/model" ? "page" : undefined}
              className="ml-2 inline-flex h-10 items-center rounded-full bg-ink px-5 text-[14px] text-white transition-[background-color,scale] duration-200 hover:bg-black active:scale-[0.97]"
            >
              Explore in 3D
            </Link>
          </nav>

          {/* mobile trigger */}
          <button
            type="button"
            aria-label={sheet ? "Close menu" : "Open menu"}
            aria-expanded={sheet}
            aria-controls="mobile-sheet"
            onClick={() => setSheet((o) => !o)}
            className="ml-auto grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-black/[0.05] active:scale-95 lg:hidden"
          >
            <span className="relative block h-3 w-[18px]" aria-hidden="true">
              <span
                className={`absolute left-0 h-[1.5px] w-full rounded bg-current transition-transform duration-300 ${
                  sheet ? "top-[5px] rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 h-[1.5px] w-full rounded bg-current transition-transform duration-300 ${
                  sheet ? "top-[5px] -rotate-45" : "top-[10px]"
                }`}
              />
            </span>
          </button>
        </div>

        {/* desktop dropdown panels */}
        <DropPanel id="chapters" open={menu === "chapters"} {...pointerProps("chapters")}>
          <div className="grid grid-cols-2 gap-1">
            {CHAPTERS.map((c, i) => {
              const here = pathname === c.href;
              return (
                <Link
                  key={c.slug}
                  href={c.href}
                  aria-current={here ? "page" : undefined}
                  className={`group flex gap-4 rounded-2xl p-4 transition-colors ${
                    here ? "bg-panel" : "hover:bg-panel"
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-[13px] transition-colors ${
                      here ? "bg-accent text-white" : "bg-panel3 text-ink group-hover:bg-white"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold tracking-tight">{c.nav}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-mute">{c.summary}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </DropPanel>

        <DropPanel id="components" open={menu === "components"} {...pointerProps("components")}>
          <div className="grid grid-cols-3 gap-x-6 gap-y-5 p-3">
            {GROUPS.map((cat) => (
              <div key={cat}>
                <p className="flex items-center gap-1.5 text-xs font-medium text-mute">
                  <span className="h-2 w-2 rounded-[3px]" style={{ background: CATEGORY[cat].color }} />
                  {CATEGORY[cat].label}
                </p>
                <ul className="mt-1.5">
                  {PARTS.filter((p) => p.cat === cat).map((p) => {
                    const here = pathname === `/components/${p.id}`;
                    return (
                      <li key={p.id}>
                        <Link
                          href={`/components/${p.id}`}
                          aria-current={here ? "page" : undefined}
                          title={DETAILS[p.id].tagline}
                          className={`-mx-2 block rounded-lg px-2 py-1.5 text-[14px] transition-colors ${
                            here ? "bg-panel font-semibold" : "hover:bg-panel"
                          }`}
                        >
                          {p.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-line px-3 pt-3">
            <span className="text-[13px] text-mute">Each part has its own page with a 3D view.</span>
            <Link href="/components" className="text-[13px] text-accent underline-offset-4 hover:underline">
              All components ›
            </Link>
          </div>
        </DropPanel>
      </div>

      {/* mobile sheet */}
      <div
        id="mobile-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        hidden={!sheet}
        className="fixed inset-x-3 top-[76px] bottom-3 z-40 overflow-y-auto overscroll-contain rounded-[28px] bg-white/95 p-5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.25),0_0_0_0.5px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden"
      >
        {sheet && (
          <div className="pop-in">
            <Link
              href="/model"
              className="flex h-12 items-center justify-center rounded-full bg-ink text-[16px] text-white active:scale-[0.98]"
            >
              Explore in 3D
            </Link>

            <SheetHeading>Chapters</SheetHeading>
            <ul>
              {CHAPTERS.map((c, i) => {
                const here = pathname === c.href;
                return (
                  <li key={c.slug}>
                    <Link
                      href={c.href}
                      aria-current={here ? "page" : undefined}
                      className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-[16px] ${
                        here ? "bg-panel font-semibold" : "active:bg-panel"
                      }`}
                    >
                      <span className="w-6 font-mono text-[13px] text-mute">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {c.nav}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <SheetHeading>Components</SheetHeading>
            <ul className="grid grid-cols-1 sm:grid-cols-2">
              {PARTS.map((p) => {
                const here = pathname === `/components/${p.id}`;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/components/${p.id}`}
                      aria-current={here ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] ${
                        here ? "bg-panel font-semibold" : "active:bg-panel"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 shrink-0 rounded-[3px]"
                        style={{ background: CATEGORY[p.cat].color }}
                      />
                      {p.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/components"
              className="mt-2 flex min-h-11 items-center px-3 text-[15px] text-accent"
            >
              All components by category ›
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function DropPanel({
  id,
  open,
  children,
  onPointerEnter,
  onPointerLeave,
}: {
  id: MenuId;
  open: boolean;
  children: ReactNode;
  onPointerEnter: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
}) {
  return (
    <div
      id={`menu-${id}`}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={`absolute top-full right-0 hidden pt-2 lg:block ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      // keep closed menus out of the tab order and away from screen readers
      inert={!open}
    >
      <div
        className={`w-[640px] origin-top-right rounded-[24px] bg-white/95 p-3 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.22),0_0_0_0.5px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-[opacity,transform] duration-200 ease-out ${
          open ? "translate-y-0 scale-100 opacity-100" : "-translate-y-1 scale-[0.98] opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function SheetHeading({ children }: { children: ReactNode }) {
  return <p className="mt-6 mb-1 px-3 text-xs font-medium tracking-wide text-mute uppercase">{children}</p>;
}
