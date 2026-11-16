/** The guided chapters of the site, in reading order. */
export type Chapter = {
  slug: string;
  href: string;
  /** short name for navigation */
  nav: string;
  kicker: string;
  title: string;
  lead: string;
  /** one line for cards on the home page */
  summary: string;
};

export const CHAPTERS: Chapter[] = [
  {
    slug: "model",
    href: "/model",
    nav: "3D model",
    kicker: "3D model",
    title: "Take the card apart",
    lead: "A graphics card you can turn, open up and explore. Pick any part to fly to it, then open its page for the full explanation.",
    summary: "Turn, open up and explore a graphics card part by part.",
  },
  {
    slug: "how-it-works",
    href: "/how-it-works",
    nav: "How it works",
    kicker: "How it works",
    title: "How the parts work together",
    lead: "A map of the card. The dark rectangle in the middle is the GPU chip; everything around it feeds it data, power and cool air. Start the tour to follow one job from start to finish.",
    summary: "Follow one job through the card in nine animated steps.",
  },
  {
    slug: "parallel",
    href: "/parallel",
    nav: "CPU vs GPU",
    kicker: "Parallelism",
    title: "Why many simple cores beat a few fast ones",
    lead: "A CPU has a handful of very capable cores. A GPU has thousands of basic ones. Race them to see what that means when the job is to colour every pixel of an image.",
    summary: "Race 4 fast cores against up to 160 simple ones.",
  },
  {
    slug: "core",
    href: "/core",
    nav: "Inside a core",
    kicker: "Live simulator",
    title: "Inside the compute cores",
    lead: "A working 4-core GPU. Every core runs the same program in lock-step: fetch the next instruction, decode it, execute it. Press Step and watch the registers and memory change.",
    summary: "Run a working 4-core GPU, one clock tick at a time.",
  },
  {
    slug: "pipeline",
    href: "/pipeline",
    nav: "Drawing a frame",
    kicker: "Graphics pipeline",
    title: "How a frame is drawn",
    lead: "For graphics, the cores and fixed-function circuits work as a production line called the graphics pipeline. Here it draws one triangle on a tiny 28×18-pixel screen.",
    summary: "Watch three points become a coloured triangle.",
  },
  {
    slug: "build",
    href: "/build",
    nav: "Build your own",
    kicker: "Next steps",
    title: "From understanding it to building one",
    lead: "Everything in this guide can be built at small scale by one person. The tiny GPU from “Inside a core” is the realistic first target, and these are the steps to get there.",
    summary: "The four steps from logic gates to real hardware.",
  },
];

export const CHAPTER_BY_SLUG = Object.fromEntries(CHAPTERS.map((c) => [c.slug, c])) as Record<
  string,
  Chapter
>;
