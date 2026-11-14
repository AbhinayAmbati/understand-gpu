import CpuVsGpu from "@/components/CpuVsGpu";
import GpuAnatomy from "@/components/GpuAnatomy";
import GpuModelExplorer from "@/components/GpuModelExplorer";
import GraphicsPipeline from "@/components/GraphicsPipeline";
import Hero from "@/components/Hero";
import Roadmap from "@/components/Roadmap";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import TinyGpuSim from "@/components/TinyGpuSim";
import { Reveal } from "@/components/ui";

function Section({
  id,
  kicker,
  title,
  lead,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-12 py-16 sm:py-28">
      <Reveal stagger={0.08} className="mx-auto max-w-3xl text-center">
        <p className="text-[17px] font-semibold text-accent">{kicker}</p>
        <h2
          id={`${id}-title`}
          className="mt-2 text-[2.1rem] leading-[1.08] font-semibold tracking-[-0.028em] sm:text-[3.25rem]"
        >
          {title}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-[1.5] text-mute sm:text-[19px]">
          {lead}
        </p>
      </Reveal>
      <Reveal className="mt-10 sm:mt-14" delay={0.1}>
        {children}
      </Reveal>
    </section>
  );
}

export default function Home() {
  return (
    <div className="relative">
      <a
        href="#model"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <SiteHeader home />

      <main id="top" className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <Hero />

        <Section
          id="model"
          kicker="3D model"
          title="Take the card apart"
          lead="A graphics card you can turn, open up and explore. Click any part to fly to it, then open its page for the full explanation."
        >
          <GpuModelExplorer />
        </Section>

        <Section
          id="anatomy"
          kicker="How it connects"
          title="How the parts work together"
          lead="A simplified map of a graphics card. The dark rectangle in the middle is the GPU chip itself; everything around it exists to feed it data, power and cool air. Select a block to learn about it, or start the tour to follow one job through the whole card."
        >
          <GpuAnatomy />
        </Section>

        <Section
          id="parallel"
          kicker="Parallelism"
          title="Why many simple cores beat a few fast ones"
          lead="A CPU has a handful of very capable cores. A GPU has thousands of basic ones. Start the race to see what that means when the job is to colour every pixel of an image."
        >
          <CpuVsGpu />
        </Section>

        <Section
          id="core"
          kicker="Live simulator"
          title="Inside the compute cores"
          lead="A working simulation of a 4-core GPU. Every core runs the same program in lock-step, repeating three actions: fetch the next instruction, decode what it means, execute it. Press Step and watch the registers and memory change."
        >
          <TinyGpuSim />
        </Section>

        <Section
          id="pipeline"
          kicker="Graphics pipeline"
          title="How a frame is drawn"
          lead="For graphics, the cores and the fixed-function circuits work as a production line called the graphics pipeline. Here it is drawing a single triangle on a tiny 28×18-pixel screen."
        >
          <GraphicsPipeline />
        </Section>

        <Section
          id="build"
          kicker="Next steps"
          title="From understanding it to building one"
          lead="Everything on this page can be built at small scale by one person. The tiny GPU in section 3 is the realistic first target, and these are the steps to get there."
        >
          <Roadmap />
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
