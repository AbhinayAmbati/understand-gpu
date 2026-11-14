export type PartId =
  | "host"
  | "pcie"
  | "cmd"
  | "sched"
  | "cores"
  | "cache"
  | "memctl"
  | "raster"
  | "display"
  | "vram"
  | "ports"
  | "vrm"
  | "cooler";

export type Category = "ctrl" | "comp" | "mem" | "io" | "pwr" | "cool";

export const CATEGORY: Record<Category, { color: string; label: string }> = {
  ctrl: { color: "#e06c00", label: "Control" },
  comp: { color: "#1e9e57", label: "Compute" },
  mem: { color: "#0071e3", label: "Memory" },
  io: { color: "#8f4fd1", label: "Input / output" },
  pwr: { color: "#e3342f", label: "Power" },
  cool: { color: "#0b93a6", label: "Cooling" },
};

export type Part = {
  id: PartId;
  name: string;
  label: string[];
  cat: Category;
  x: number;
  y: number;
  w: number;
  h: number;
  what: string;
  how: string;
  analogy: string;
  fact: string;
};

export const PARTS: Part[] = [
  {
    id: "host",
    name: "CPU and system RAM",
    label: ["CPU +", "System RAM"],
    cat: "io",
    x: 16,
    y: 140,
    w: 130,
    h: 130,
    what: "The rest of the computer. It is not part of the GPU, but every job starts here.",
    how: "Your game or AI program runs on the CPU. When it needs heavy parallel math, a piece of software called the driver packs the work into commands and data, and sends them to the GPU.",
    analogy: "The customer who walks into a factory with an order.",
    fact: "A CPU has roughly 4–32 big cores. It is the boss; the GPU is the workforce.",
  },
  {
    id: "pcie",
    name: "PCIe interface",
    label: ["PCIe", "Interface"],
    cat: "io",
    x: 200,
    y: 150,
    w: 90,
    h: 110,
    what: "The connector and circuitry that link the graphics card to the motherboard.",
    how: "Commands, textures and model data arrive here as high-speed electrical signals across up to 16 lanes. The interface checks them for errors and passes them into the chip.",
    analogy: "The factory's loading dock: everything coming in or going out passes through it.",
    fact: "A PCIe 4.0 x16 slot moves roughly 32 GB of data per second.",
  },
  {
    id: "cmd",
    name: "Command processor",
    label: ["Command", "Processor"],
    cat: "ctrl",
    x: 345,
    y: 95,
    w: 110,
    h: 70,
    what: "The front desk of the chip. It reads the list of commands the CPU sent.",
    how: "It takes commands such as “draw these 3,000 triangles” or “multiply these two matrices” out of a queue, works out which parts of the chip each one needs, and sets those parts up.",
    analogy: "The office clerk who reads each order and writes job tickets for the shop floor.",
    fact: "A single game frame can contain thousands of separate commands.",
  },
  {
    id: "sched",
    name: "Scheduler",
    label: ["Scheduler"],
    cat: "ctrl",
    x: 345,
    y: 185,
    w: 110,
    h: 70,
    what: "The unit that hands out work to the compute cores.",
    how: "It cuts a big job into thousands of small identical pieces called threads, bundles them into groups, and assigns each group to a free core. When a core has to wait for memory, the scheduler gives it another group so it never sits idle.",
    analogy: "The foreman who makes sure every worker always has something to do.",
    fact: "Threads run in bundles of about 32 that all execute the same instruction together.",
  },
  {
    id: "cores",
    name: "Compute cores",
    label: ["Compute Cores"],
    cat: "comp",
    x: 475,
    y: 95,
    w: 170,
    h: 160,
    what: "The heart of the GPU: thousands of small, simple processors.",
    how: "Each core runs a tiny program (called a shader or kernel) made of basic steps: fetch an instruction, decode it, do the arithmetic, store the result. One core alone is slower than a CPU core, but thousands of them run the same program on different data at the same time.",
    analogy: "A hall with thousands of workers each doing the same simple task on a different item.",
    fact: "A high-end GPU has well over 10,000 of these cores. This diagram shows 30.",
  },
  {
    id: "cache",
    name: "Cache",
    label: ["Cache"],
    cat: "mem",
    x: 660,
    y: 95,
    w: 100,
    h: 70,
    what: "A small, extremely fast memory sitting right next to the cores.",
    how: "Fetching data from VRAM takes hundreds of clock ticks. The cache keeps copies of recently used data, so when a core asks for the same or nearby data again the answer arrives in a few ticks.",
    analogy: "The tools on your workbench, compared with the tools in the warehouse.",
    fact: "Cache is a few megabytes; VRAM is thousands of times larger but much slower to reach.",
  },
  {
    id: "memctl",
    name: "Memory controller",
    label: ["Memory", "Controller"],
    cat: "mem",
    x: 660,
    y: 185,
    w: 100,
    h: 70,
    what: "The traffic manager between the chip and the VRAM chips.",
    how: "Thousands of cores want to read and write memory at once. The controller queues their requests, turns each address into the right electrical signals for the VRAM chips, and returns the data to whoever asked.",
    analogy: "The warehouse manager who takes requests and sends forklifts to the right shelf.",
    fact: "It moves hundreds of gigabytes per second between the chip and VRAM.",
  },
  {
    id: "raster",
    name: "Rasterizer and texture units",
    label: ["Rasterizer + Texture Units"],
    cat: "comp",
    x: 345,
    y: 275,
    w: 200,
    h: 50,
    what: "Specialised circuits that only do graphics jobs, and do them very fast.",
    how: "The rasterizer works out which screen pixels a triangle covers. Texture units look up colours from images and blend neighbouring points so surfaces look smooth. Because these circuits do one fixed job, they are far quicker than a general-purpose core.",
    analogy: "A stamping machine: it can do only one thing, but nothing does that thing faster.",
    fact: "A modern GPU can fill billions of pixels every second.",
  },
  {
    id: "display",
    name: "Display engine",
    label: ["Display Engine"],
    cat: "io",
    x: 560,
    y: 275,
    w: 200,
    h: 50,
    what: "The circuit that turns the finished picture into a video signal.",
    how: "It reads the finished image (the framebuffer) out of VRAM, row by row, at exactly the pace the monitor expects, and encodes it as an HDMI or DisplayPort signal.",
    analogy: "The projectionist who plays the finished film at exactly the right speed.",
    fact: "For a 4K screen at 60 Hz it sends about 500 million pixels every second.",
  },
  {
    id: "vram",
    name: "VRAM (video memory)",
    label: ["VRAM"],
    cat: "mem",
    x: 815,
    y: 60,
    w: 150,
    h: 200,
    what: "The GPU's own large memory, in separate chips soldered around the main chip.",
    how: "It holds everything the cores work on: textures, 3D models, AI model weights, and the framebuffer (the image being drawn). It is tuned to deliver a huge volume of data per second to many cores at once.",
    analogy: "The factory warehouse: raw materials come out of it and finished goods go back in.",
    fact: "Consumer cards carry roughly 8–32 GB of VRAM.",
  },
  {
    id: "ports",
    name: "Display outputs",
    label: ["Display", "Outputs"],
    cat: "io",
    x: 815,
    y: 285,
    w: 150,
    h: 90,
    what: "The HDMI and DisplayPort sockets on the back of the card.",
    how: "They carry the video signal from the display engine down the cable to your monitor. GPUs used only for AI in data centres often have no display outputs at all.",
    analogy: "The factory's shipping door.",
    fact: "One DisplayPort cable can carry an 8K picture.",
  },
  {
    id: "vrm",
    name: "Power delivery (VRM)",
    label: ["Power Delivery (VRM)"],
    cat: "pwr",
    x: 200,
    y: 400,
    w: 300,
    h: 90,
    what: "A row of small power converters that feed the chip.",
    how: "The power supply provides 12 volts, but the chip's transistors run at about 1 volt and need a very large, very steady current. The voltage regulator modules step the voltage down and react within microseconds when the chip's demand changes.",
    analogy: "The factory's own substation, turning grid power into what the machines need.",
    fact: "A top card draws 300–450 watts, which is hundreds of amps at about 1 volt.",
  },
  {
    id: "cooler",
    name: "Cooling",
    label: ["Heatsink + Fans"],
    cat: "cool",
    x: 530,
    y: 400,
    w: 435,
    h: 90,
    what: "The heatsink, heat pipes and fans that cover most of the card.",
    how: "Almost all the electricity the chip uses turns into heat. Copper pipes carry that heat from the chip to a large block of aluminium fins, and the fans blow air across the fins to remove it. If cooling falls behind, the chip slows itself down to stay safe.",
    analogy: "The factory's ventilation system.",
    fact: "Most of the size and weight of a graphics card is the cooler, not the electronics.",
  },
];

export const PART_BY_ID = Object.fromEntries(PARTS.map((p) => [p.id, p])) as Record<PartId, Part>;

export type Step = {
  title: string;
  text: string;
  parts: PartId[];
  path?: string;
  color: string;
};

export const STEPS: Step[] = [
  {
    title: "The CPU sends an order",
    text: "Your program runs on the CPU. It packs up commands (“draw this scene”) and data, and sends them across the PCIe connection to the graphics card.",
    parts: ["host", "pcie"],
    path: "M146 205 L200 205",
    color: "#8f4fd1",
  },
  {
    title: "Commands are read",
    text: "The command processor takes each command from the queue and works out which parts of the chip it needs.",
    parts: ["pcie", "cmd"],
    path: "M290 205 L318 205 L318 130 L345 130",
    color: "#e06c00",
  },
  {
    title: "Work is split into pieces",
    text: "The scheduler cuts the job into thousands of small identical tasks and hands them to free compute cores.",
    parts: ["cmd", "sched", "cores"],
    path: "M400 130 L400 220 L465 220 L465 175 L475 175",
    color: "#e06c00",
  },
  {
    title: "Data is fetched from memory",
    text: "The cores need their input data. The memory controller fetches it from VRAM, and the cache keeps a copy close by for next time.",
    parts: ["vram", "memctl", "cache", "cores"],
    path: "M815 160 L795 160 L795 220 L710 220 L710 130 L645 130",
    color: "#0071e3",
  },
  {
    title: "All cores compute at once",
    text: "Every core runs the same small program on its own piece of data, all at the same time. This is where the GPU gets its speed.",
    parts: ["cores"],
    color: "#1e9e57",
  },
  {
    title: "Triangles become pixels",
    text: "For graphics, the rasterizer works out which pixels each triangle covers, and texture units look up the colours for those pixels.",
    parts: ["cores", "raster"],
    path: "M560 255 L560 265 L445 265 L445 275",
    color: "#1e9e57",
  },
  {
    title: "Results are written back",
    text: "Finished pixels (or finished numbers, for AI) travel back through the memory controller and are stored in VRAM. For graphics, this stored image is called the framebuffer.",
    parts: ["cores", "cache", "memctl", "vram"],
    path: "M645 130 L710 130 L710 220 L795 220 L795 160 L815 160",
    color: "#0071e3",
  },
  {
    title: "The picture goes to the screen",
    text: "The display engine reads the framebuffer out of VRAM and sends it through the display outputs to your monitor, 60 or more times every second.",
    parts: ["vram", "memctl", "display", "ports"],
    path: "M815 200 L795 200 L795 220 L710 220 L710 300 L795 300 L795 330 L815 330",
    color: "#8f4fd1",
  },
  {
    title: "Meanwhile: power in, heat out",
    text: "The whole time, the power stage feeds the chip hundreds of amps, and the cooler carries away the heat that work produces.",
    parts: ["vrm", "cooler"],
    color: "#e3342f",
  },
];
