import Link from "next/link";
import Hero from "@/components/Hero";
import { Container, Shell } from "@/components/Layout";
import { Reveal } from "@/components/ui";
import { CHAPTERS } from "@/lib/chapters";
import { DETAILS } from "@/lib/details";
import { CATEGORY, PARTS } from "@/lib/parts";

function SectionHeading({ kicker, title, lead }: { kicker: string; title: string; lead: string }) {
  return (
    <Reveal stagger={0.07} className="mx-auto max-w-2xl text-center">
      <p className="text-[17px] font-semibold text-accent">{kicker}</p>
      <h2 className="mt-2 text-[2rem] leading-[1.1] font-semibold tracking-[-0.028em] text-balance sm:text-[2.75rem]">
        {title}
      </h2>
      <p className="mt-4 text-[17px] leading-[1.55] text-pretty text-mute">{lead}</p>
    </Reveal>
  );
}

export default function Home() {
  return (
    <Shell>
      <Container>
        <Hero />
      </Container>

      <Container className="pt-20 sm:pt-28">
        <SectionHeading
          kicker="The guide"
          title="Six short chapters"
          lead="Each chapter is one page with one thing to try. Read them in order, or jump to whichever looks interesting."
        />
        <Reveal stagger={0.06} className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {CHAPTERS.map((c, i) => (
            <Link
              key={c.slug}
              href={c.href}
              className="surface group flex min-h-[200px] flex-col p-7 transition-transform duration-300 ease-out hover:-translate-y-1"
            >
              <span className="font-mono text-[13px] text-mute">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 text-[21px] font-semibold tracking-tight">{c.nav}</h3>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-mute">{c.summary}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-[15px] text-accent">
                Open chapter
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                  ›
                </span>
              </span>
            </Link>
          ))}
        </Reveal>
      </Container>

      <Container className="pt-20 pb-20 sm:pt-28 sm:pb-28">
        <SectionHeading
          kicker="Components"
          title="Every part has its own page"
          lead="A 3D view, what happens inside it step by step, the numbers that matter, and the words you will meet when you read further."
        />
        <Reveal stagger={0.03} className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {PARTS.map((p) => (
            <Link
              key={p.id}
              href={`/components/${p.id}`}
              className="group flex items-center gap-4 rounded-2xl bg-panel px-5 py-4 transition-colors hover:bg-panel3"
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ background: CATEGORY[p.cat].color }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{p.name}</span>
                <span className="block truncate text-[13px] text-mute">{DETAILS[p.id].tagline}</span>
              </span>
              <span
                aria-hidden="true"
                className="text-mute transition-transform duration-200 group-hover:translate-x-1"
              >
                ›
              </span>
            </Link>
          ))}
        </Reveal>
        <p className="mt-8 text-center">
          <Link href="/components" className="text-[17px] text-accent underline-offset-4 hover:underline">
            See all components by category ›
          </Link>
        </p>
      </Container>
    </Shell>
  );
}
