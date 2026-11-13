import CpuVsGpu from "@/components/CpuVsGpu";
import GpuAnatomy from "@/components/GpuAnatomy";
import GraphicsPipeline from "@/components/GraphicsPipeline";
import Hero from "@/components/Hero";
import Roadmap from "@/components/Roadmap";
import SiteHeader from "@/components/SiteHeader";
import TinyGpuSim from "@/components/TinyGpuSim";
import { Reveal } from "@/components/ui";

function Section({
  id,
  num,
  kicker,
  title,
  lead,
  children,
}: {
  id: string;
  num: number;
  kicker: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 py-14 sm:py-20">
      <Reveal stagger={0.08}>
        <p className="flex items-center gap-3 font-mono text-xs tracking-[0.14em] text-comp uppercase">
          <span className="text-faint">0{num}</span>
          <span className="h-px w-8 bg-linestrong" />
          {kicker}
        </p>
        <h2
          id={`${id}-title`}
          className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.025em] sm:text-4xl"
        >
          {title}
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-mute sm:text-base">{lead}</p>
      </Reveal>
      <Reveal className="mt-8 sm:mt-10" delay={0.1}>
        {children}
      </Reveal>
    </section>
  );
}

export default function Home() {
  return (
    <div className="relative">
      <div className="backdrop" aria-hidden="true" />
      <a
        href="#anatomy"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-comp focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-black"
      >
        Skip to content
      </a>
      <SiteHeader />

      <main id="top" className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Hero />

        <Section
          id="anatomy"
          num={1}
          kicker="Components"
          title="The components of a graphics card"
          lead="A simplified map of a graphics card. The dark rectangle in the middle is the GPU chip itself; everything around it exists to feed it data, power and cool air. Select a block to learn about it, or start the tour to follow one job through the whole card."
        >
          <GpuAnatomy />
        </Section>

        <Section
          id="parallel"
          num={2}
          kicker="Parallelism"
          title="Why many simple cores beat a few fast ones"
          lead="A CPU has a handful of very capable cores. A GPU has thousands of basic ones. Start the race to see what that means when the job is to colour every pixel of an image."
        >
          <CpuVsGpu />
        </Section>

        <Section
          id="core"
          num={3}
          kicker="Live simulator"
          title="Inside the compute cores"
          lead="A working simulation of a 4-core GPU. Every core runs the same program in lock-step, repeating three actions: fetch the next instruction, decode what it means, execute it. Press Step and watch the registers and memory change."
        >
          <TinyGpuSim />
        </Section>

        <Section
          id="pipeline"
          num={4}
          kicker="Graphics pipeline"
          title="How a frame is drawn"
          lead="For graphics, the cores and the fixed-function circuits work as a production line called the graphics pipeline. Here it is drawing a single triangle on a tiny 28×18-pixel screen."
        >
          <GraphicsPipeline />
        </Section>

        <Section
          id="build"
          num={5}
          kicker="Next steps"
          title="From understanding it to building one"
          lead="Everything on this page can be built at small scale by one person. The tiny GPU in section 3 is the realistic first target, and these are the steps to get there."
        >
          <Roadmap />
        </Section>
      </main>

      <footer className="relative border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-[13px] text-faint sm:px-6">
          <span className="font-medium text-mute">GPU Explorer</span>
          <span>Diagrams are simplified for learning; real chips have many more parts.</span>
        </div>
      </footer>
    </div>
  );
}
