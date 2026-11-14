import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ComponentViewer from "@/components/ComponentViewer";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Reveal } from "@/components/ui";
import { DETAILS } from "@/lib/details";
import { CATEGORY, PARTS, PART_BY_ID, STEPS, type PartId } from "@/lib/parts";

export function generateStaticParams() {
  return PARTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/components/[id]">): Promise<Metadata> {
  const { id } = await params;
  const part = PART_BY_ID[id as PartId];
  if (!part) return { title: "Not found — GPU Explorer" };
  return {
    title: `${part.name} — GPU Explorer`,
    description: part.what,
  };
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.022em] sm:text-[2.5rem]">
      {children}
    </h2>
  );
}

export default async function ComponentPage({ params }: PageProps<"/components/[id]">) {
  const { id } = await params;
  const part = PART_BY_ID[id as PartId];
  if (!part) notFound();

  const detail = DETAILS[part.id];
  const color = CATEGORY[part.cat].color;
  const index = PARTS.findIndex((p) => p.id === part.id);
  const prev = PARTS[(index - 1 + PARTS.length) % PARTS.length];
  const next = PARTS[(index + 1) % PARTS.length];
  const journey = STEPS.map((s, i) => ({ ...s, n: i + 1 })).filter((s) =>
    s.parts.includes(part.id),
  );

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-20 sm:px-6 sm:pb-28">
        {/* title */}
        <Reveal stagger={0.08} className="mx-auto max-w-3xl pt-10 text-center sm:pt-14">
          <nav aria-label="Breadcrumb" className="text-[13px] text-mute">
            <Link href="/components" className="hover:text-ink">
              Components
            </Link>
            <span className="mx-1.5 text-linestrong">/</span>
            <span aria-current="page">{part.name}</span>
          </nav>
          <p className="mt-6 text-[17px] font-semibold" style={{ color }}>
            {CATEGORY[part.cat].label}
          </p>
          <h1 className="mt-2 text-[2.25rem] leading-[1.06] font-semibold tracking-[-0.03em] sm:text-[4rem]">
            {part.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[21px] leading-[1.35] font-medium tracking-tight text-mute sm:text-[26px]">
            {detail.tagline}
          </p>
        </Reveal>

        {/* 3D view */}
        <Reveal className="mt-10 sm:mt-14" delay={0.1}>
          <ComponentViewer id={part.id} />
          <p className="mt-3 text-center text-[13px] text-mute">
            The highlighted part is the {part.name.toLowerCase()}. Click any other part to open
            its page.
          </p>
        </Reveal>

        {/* what it is */}
        <section className="mx-auto mt-16 max-w-3xl sm:mt-24">
          <Reveal stagger={0.08}>
            <Heading>What it is</Heading>
            <p className="mt-5 text-[19px] leading-[1.5] text-ink/85">{part.what}</p>
            <p className="mt-4 text-[17px] leading-[1.6] text-mute">{part.how}</p>
          </Reveal>
        </section>

        {/* figures */}
        <Reveal stagger={0.08} className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-3">
          {detail.specs.map((s) => (
            <div key={s.label} className="surface p-7 text-center">
              <p className="text-[2rem] leading-tight font-semibold tracking-[-0.03em] sm:text-[2.5rem]">
                {s.value}
              </p>
              <p className="mt-1.5 text-[15px] text-mute">{s.label}</p>
            </div>
          ))}
        </Reveal>

        {/* how it works */}
        <section className="mx-auto mt-16 max-w-3xl sm:mt-24">
          <Reveal>
            <Heading>How it works, step by step</Heading>
          </Reveal>
          <Reveal stagger={0.1} className="mt-8">
            {detail.steps.map((s, i) => (
              <div key={s.title} className="relative flex gap-5 pb-9 last:pb-0">
                {i < detail.steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-10 bottom-1 left-[17px] w-px bg-line"
                  />
                )}
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[15px] font-semibold text-white"
                  style={{ background: color }}
                >
                  {i + 1}
                </span>
                <div className="pt-1">
                  <h3 className="text-[19px] font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-1.5 text-[17px] leading-[1.6] text-mute">{s.text}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </section>

        {/* analogy + without it */}
        <Reveal stagger={0.1} className="mt-16 grid gap-4 sm:mt-24 md:grid-cols-2">
          <div className="surface p-8 sm:p-10">
            <p className="text-[15px] font-medium text-mute">Think of it as</p>
            <p className="mt-3 text-[21px] leading-[1.35] font-semibold tracking-tight sm:text-[26px]">
              {part.analogy}
            </p>
          </div>
          <div className="surface p-8 sm:p-10">
            <p className="text-[15px] font-medium text-mute">Without it</p>
            <p className="mt-3 text-[21px] leading-[1.35] font-semibold tracking-tight sm:text-[26px]">
              {detail.without}
            </p>
          </div>
        </Reveal>

        {/* glossary */}
        <section className="mx-auto mt-16 max-w-3xl sm:mt-24">
          <Reveal>
            <Heading>Words worth knowing</Heading>
          </Reveal>
          <Reveal stagger={0.08}>
            <dl className="mt-6">
              {detail.terms.map((t) => (
                <div
                  key={t.term}
                  className="grid gap-1 border-b border-line py-5 sm:grid-cols-[200px_1fr] sm:gap-6"
                >
                  <dt className="text-[17px] font-semibold">{t.term}</dt>
                  <dd className="text-[17px] leading-[1.55] text-mute">{t.def}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>

        {/* where it appears in the tour */}
        {journey.length > 0 && (
          <section className="mx-auto mt-16 max-w-3xl sm:mt-24">
            <Reveal>
              <Heading>Its part in the journey</Heading>
              <p className="mt-4 text-[17px] leading-[1.6] text-mute">
                A job passes through the card in nine steps. The {part.name.toLowerCase()} takes
                part in {journey.length === 1 ? "this one" : `these ${journey.length}`}.
              </p>
            </Reveal>
            <Reveal stagger={0.08} className="mt-6 space-y-3">
              {journey.map((s) => (
                <div key={s.n} className="surface flex gap-4 p-6">
                  <span className="font-mono text-[13px] text-mute">
                    {String(s.n).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[17px] font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-mute">{s.text}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          </section>
        )}

        {/* related components */}
        <section className="mt-16 sm:mt-24">
          <Reveal className="text-center">
            <Heading>Works closely with</Heading>
          </Reveal>
          <Reveal
            stagger={0.07}
            className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {detail.connects.map((cid) => {
              const c = PART_BY_ID[cid];
              return (
                <Link
                  key={cid}
                  href={`/components/${cid}`}
                  className="surface group p-6 transition-transform duration-300 ease-out hover:-translate-y-1"
                >
                  <p
                    className="flex items-center gap-1.5 text-[13px] font-medium"
                    style={{ color: CATEGORY[c.cat].color }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: CATEGORY[c.cat].color }}
                    />
                    {CATEGORY[c.cat].label}
                  </p>
                  <h3 className="mt-1.5 text-[19px] font-semibold tracking-tight">{c.name}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-mute">
                    {DETAILS[cid].tagline}
                  </p>
                </Link>
              );
            })}
          </Reveal>
        </section>

        {/* previous / next */}
        <nav
          aria-label="More components"
          className="mt-16 grid gap-4 border-t border-line pt-8 sm:mt-24 sm:grid-cols-2"
        >
          <Link href={`/components/${prev.id}`} className="group rounded-2xl p-4 hover:bg-panel">
            <span className="text-[13px] text-mute">Previous</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[19px] font-semibold tracking-tight">
              <span className="transition-transform duration-200 group-hover:-translate-x-1">
                ‹
              </span>
              {prev.name}
            </span>
          </Link>
          <Link
            href={`/components/${next.id}`}
            className="group rounded-2xl p-4 hover:bg-panel sm:text-right"
          >
            <span className="text-[13px] text-mute">Next</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[19px] font-semibold tracking-tight sm:justify-end">
              {next.name}
              <span className="transition-transform duration-200 group-hover:translate-x-1">
                ›
              </span>
            </span>
          </Link>
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}
