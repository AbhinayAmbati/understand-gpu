"use client";

import { useRef, type ComponentProps, type ReactNode } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

/* ---------- icons ---------- */

const ICONS = {
  play: "M7 4.5v15l12-7.5z",
  pause: "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z",
  step: "M6 5v14l9-7zM16.5 5H19v14h-2.5z",
  reset: "M12 5a7 7 0 1 1-6.6 4.7l1.9.6A5 5 0 1 0 12 7v3L7.5 6 12 2z",
  prev: "M14.5 5.5 8 12l6.5 6.5 1.4-1.4L10.8 12l5.1-5.1z",
  next: "M9.5 5.5 16 12l-6.5 6.5-1.4-1.4 5.1-5.1-5.1-5.1z",
  shuffle:
    "M16 4l4 3.5L16 11V8.5h-1.6l-2 2.6-1.3-1.6 2.3-3h2.6zM4 6.5h3.6l7.8 10H16V14l4 3.5-4 3.5v-2.5h-1.6l-7.8-10H4zM4 16.5h2.6l2-2.6 1.3 1.6-2.3 3H4z",
  arrow: "M13 5.5 19.5 12 13 18.5l-1.4-1.4 4.1-4.1H4.5v-2h11.2l-4.1-4.1z",
  menu: "M4 7h16v2H4zM4 15h16v2H4z",
  close: "M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z",
} as const;

export function Icon({ name, size = 16 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/* ---------- button ---------- */

const BTN_BASE =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap " +
  "transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out " +
  "active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40";

const BTN_VARIANT = {
  primary:
    "bg-comp text-[#04130b] hover:bg-[#82f2b9] shadow-[0_0_0_1px_rgba(94,230,160,0.35),0_10px_28px_-10px_rgba(94,230,160,0.6)] hover:shadow-[0_0_0_1px_rgba(94,230,160,0.5),0_14px_32px_-10px_rgba(94,230,160,0.75)]",
  secondary:
    "border border-line bg-panel2/70 text-ink hover:border-linestrong hover:bg-panel3",
  ghost: "text-mute hover:bg-panel2 hover:text-ink",
};

const BTN_SIZE = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-5 text-sm",
};

type ButtonProps = {
  variant?: keyof typeof BTN_VARIANT;
  size?: keyof typeof BTN_SIZE;
} & ComponentProps<"button">;

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BTN_BASE} ${BTN_VARIANT[variant]} ${BTN_SIZE[size]} ${className}`}
      {...rest}
    />
  );
}

export function LinkButton({
  variant = "secondary",
  size = "lg",
  className = "",
  ...rest
}: { variant?: keyof typeof BTN_VARIANT; size?: keyof typeof BTN_SIZE } & ComponentProps<"a">) {
  return (
    <a className={`${BTN_BASE} ${BTN_VARIANT[variant]} ${BTN_SIZE[size]} ${className}`} {...rest} />
  );
}

/* ---------- segmented control with sliding thumb ---------- */

export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="relative grid h-9 rounded-lg border border-line bg-panel2/70 p-0.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="absolute top-0.5 bottom-0.5 left-0.5 rounded-md bg-panel3 shadow-[0_0_0_1px_var(--color-linestrong)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{
          width: `calc((100% - 4px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`relative z-10 rounded-md px-3 text-[13px] font-medium transition-colors ${
            o.value === value ? "text-ink" : "text-mute hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- surface card with pointer-following light ---------- */

export function Surface({ className = "", children, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={`surface ${className}`}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ---------- scroll reveal ---------- */

export function Reveal({
  children,
  className = "",
  stagger = 0,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** when set, animates direct children one after another */
  stagger?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      gsap.from(stagger ? Array.from(el.children) : el, {
        y: 28,
        autoAlpha: 0,
        duration: 0.8,
        delay,
        ease: "power3.out",
        stagger,
        clearProps: "transform,opacity,visibility",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* ---------- number that counts up when scrolled into view ---------- */

export function CountUp({ value, className = "" }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const n = { v: 0 };
      gsap.to(n, {
        v: value,
        duration: 1.4,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = String(Math.round(n.v));
        },
        scrollTrigger: { trigger: el, start: "top 95%", once: true },
      });
    },
    { dependencies: [value] },
  );
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {value}
    </span>
  );
}

/* ---------- small labelled stat ---------- */

export function Meter({
  label,
  value,
  fraction,
  color,
}: {
  label: string;
  value: string;
  fraction: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-mute">{label}</span>
        <span className="font-mono tabular-nums text-ink">{value}</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-panel3">
        <div
          className="h-full origin-left rounded-full transition-transform duration-200 ease-out"
          style={{ background: color, transform: `scaleX(${Math.min(1, fraction)})` }}
        />
      </div>
    </div>
  );
}
