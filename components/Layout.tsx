import Link from "next/link";
import type { ReactNode } from "react";
import SiteFooter from "@/components/SiteFooter";
import { Reveal } from "@/components/ui";
import { CHAPTERS, CHAPTER_BY_SLUG } from "@/lib/chapters";

/** Page width and side gutters, shared by every page so edges line up. */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1120px] px-5 sm:px-8 ${className}`}>{children}</div>;
}

/** Header, main area and footer for every page. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-68px)] flex-col">
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export type Crumb = { href?: string; label: string };

/** Title block at the top of a page: breadcrumb, eyebrow, heading, lead. */
export function PageIntro({
  crumbs,
  kicker,
  kickerColor,
  title,
  lead,
  children,
}: {
  crumbs?: Crumb[];
  kicker?: string;
  kickerColor?: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <Container className="pt-5 sm:pt-8">
      {crumbs && (
        <nav aria-label="Breadcrumb" className="text-[13px] text-mute">
          <ol className="flex flex-wrap items-center gap-1.5">
            {crumbs.map((c, i) => (
              <li key={c.label} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span aria-hidden="true" className="text-linestrong">
                    /
                  </span>
                )}
                {c.href ? (
                  <Link href={c.href} className="transition-colors hover:text-ink">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-ink">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <Reveal stagger={0.07} className="mx-auto max-w-3xl pt-6 pb-8 text-center sm:pt-8 sm:pb-12">
        {kicker && (
          <p className="text-[17px] font-semibold" style={{ color: kickerColor ?? "#0071e3" }}>
            {kicker}
          </p>
        )}
        <h1 className="mt-2 text-[2.125rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-[3.25rem]">
          {title}
        </h1>
        {lead && (
          <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-[1.55] text-pretty text-mute sm:text-[19px]">
            {lead}
          </p>
        )}
        {children}
      </Reveal>
    </Container>
  );
}

/** A full chapter page: intro, the interactive piece, and links to the neighbouring chapters. */
export function ChapterPage({ slug, children }: { slug: string; children: ReactNode }) {
  const chapter = CHAPTER_BY_SLUG[slug];
  const index = CHAPTERS.findIndex((c) => c.slug === slug);
  const prev = CHAPTERS[index - 1];
  const next = CHAPTERS[index + 1];
  return (
    <Shell>
      <PageIntro
        crumbs={[{ href: "/", label: "Home" }, { label: chapter.nav }]}
        kicker={`Chapter ${index + 1} · ${chapter.kicker}`}
        title={chapter.title}
        lead={chapter.lead}
      />
      <Container>
        <Reveal delay={0.1}>{children}</Reveal>
      </Container>
      <Container className="pt-16 pb-20 sm:pt-24 sm:pb-28">
        <PrevNext
          label="Chapters"
          prev={prev && { href: prev.href, title: prev.nav, meta: `Chapter ${index}` }}
          next={next && { href: next.href, title: next.nav, meta: `Chapter ${index + 2}` }}
          fallbackNext={{ href: "/components", title: "All components", meta: "Keep exploring" }}
        />
      </Container>
    </Shell>
  );
}

type Link_ = { href: string; title: string; meta: string };

export function PrevNext({
  label,
  prev,
  next,
  fallbackNext,
}: {
  label: string;
  prev?: Link_;
  next?: Link_;
  fallbackNext?: Link_;
}) {
  const after = next ?? fallbackNext;
  return (
    <nav aria-label={label} className="grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
      {prev ? (
        <Link
          href={prev.href}
          className="group rounded-2xl p-4 transition-colors hover:bg-panel focus-visible:bg-panel sm:-ml-4"
        >
          <span className="text-[13px] text-mute">‹ {prev.meta}</span>
          <span className="mt-1 block text-[19px] font-semibold tracking-tight">{prev.title}</span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {after && (
        <Link
          href={after.href}
          className="group rounded-2xl p-4 text-right transition-colors hover:bg-panel focus-visible:bg-panel sm:-mr-4"
        >
          <span className="text-[13px] text-mute">{after.meta} ›</span>
          <span className="mt-1 block text-[19px] font-semibold tracking-tight">{after.title}</span>
        </Link>
      )}
    </nav>
  );
}
