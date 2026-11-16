import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageIntro, Shell } from "@/components/Layout";
import { Reveal } from "@/components/ui";
import { DETAILS } from "@/lib/details";
import { CATEGORY, PARTS, type Category } from "@/lib/parts";

export const metadata: Metadata = {
  title: "All components — GPU Explorer",
  description: "Every component of a graphics card, each with its own page and 3D view.",
};

const GROUP_INTRO: Record<Category, string> = {
  io: "How work gets in and the picture gets out.",
  ctrl: "The parts that decide what happens, and when.",
  comp: "Where the calculations are done.",
  mem: "Where data is kept, and how it is moved.",
  pwr: "What keeps the chip supplied.",
  cool: "What keeps the chip alive.",
};

const ORDER: Category[] = ["io", "ctrl", "comp", "mem", "pwr", "cool"];

export default function ComponentsIndex() {
  return (
    <Shell>
      <PageIntro
        crumbs={[{ href: "/", label: "Home" }, { label: "Components" }]}
        kicker="Components"
        title="Thirteen parts. One job."
        lead="Each component has its own page with a 3D view, a step-by-step explanation of what happens inside it, and the terms you will meet when you read further."
      />
      <Container className="pb-20 sm:pb-28">
        {ORDER.map((cat) => {
          const items = PARTS.filter((p) => p.cat === cat);
          const color = CATEGORY[cat].color;
          return (
            <section key={cat} className="mt-12 first:mt-0 sm:mt-16" aria-labelledby={`group-${cat}`}>
              <Reveal>
                <h2
                  id={`group-${cat}`}
                  className="flex items-center gap-2 text-[21px] font-semibold tracking-tight"
                >
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: color }} />
                  {CATEGORY[cat].label}
                </h2>
                <p className="mt-1 text-[15px] text-mute">{GROUP_INTRO[cat]}</p>
              </Reveal>
              <Reveal stagger={0.07} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                  <Link
                    key={p.id}
                    href={`/components/${p.id}`}
                    className="surface group flex flex-col p-7 transition-transform duration-300 ease-out hover:-translate-y-1"
                  >
                    <h3 className="text-[21px] font-semibold tracking-tight">{p.name}</h3>
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed text-mute">
                      {DETAILS[p.id].tagline}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1 text-[15px] text-accent">
                      Learn more
                      <span className="transition-transform duration-200 group-hover:translate-x-1">
                        ›
                      </span>
                    </span>
                  </Link>
                ))}
              </Reveal>
            </section>
          );
        })}
      </Container>
    </Shell>
  );
}
