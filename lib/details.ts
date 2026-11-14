import type { PartId } from "@/lib/parts";

export type Detail = {
  /** one-line summary shown on cards */
  tagline: string;
  /** what happens inside, in order */
  steps: { title: string; text: string }[];
  /** words a beginner will meet when reading more about this part */
  terms: { term: string; def: string }[];
  /** rough real-world figures */
  specs: { value: string; label: string }[];
  /** what would go wrong without it */
  without: string;
  /** the parts it exchanges data, power or heat with */
  connects: PartId[];
};

export const DETAILS: Record<PartId, Detail> = {
  host: {
    tagline: "Where every GPU job begins.",
    steps: [
      {
        title: "Your program decides what it needs",
        text: "A game works out where every object is this frame. An AI program works out which numbers need multiplying. This logic is full of decisions, which is what a CPU is good at.",
      },
      {
        title: "The driver translates",
        text: "The program speaks a standard language such as DirectX, Vulkan or CUDA. A piece of software called the driver, written by the GPU's maker, turns those requests into the exact commands this particular GPU understands.",
      },
      {
        title: "Commands and data are queued",
        text: "The driver writes the commands into a buffer in system RAM, alongside any data the GPU does not already have, such as a new texture.",
      },
      {
        title: "The batch is handed over",
        text: "When the buffer is ready, the driver tells the GPU to collect it. The CPU moves straight on to preparing the next frame while the GPU works on this one.",
      },
    ],
    terms: [
      {
        term: "Driver",
        def: "Software that translates between your programs and one specific model of hardware.",
      },
      {
        term: "Draw call",
        def: "One request from a program to draw a batch of triangles.",
      },
      {
        term: "Bottleneck",
        def: "When the CPU cannot prepare work as fast as the GPU can finish it, so the GPU waits.",
      },
    ],
    specs: [
      { value: "4–32", label: "cores in a typical CPU" },
      { value: "1,000s", label: "draw calls in one game frame" },
      { value: "16–64 GB", label: "system RAM in a typical PC" },
    ],
    without:
      "A GPU cannot start anything on its own. With no CPU to send it work, it would sit idle.",
    connects: ["pcie"],
  },
  pcie: {
    tagline: "The high-speed link to the rest of the computer.",
    steps: [
      {
        title: "Signals arrive on the gold contacts",
        text: "The row of gold fingers on the card's edge presses against matching contacts in the motherboard slot. Data crosses as tiny, very fast voltage changes.",
      },
      {
        title: "Lanes work side by side",
        text: "The connection is split into lanes, each a pair of wires in each direction. A graphics card uses 16 lanes at once, like a 16-lane road.",
      },
      {
        title: "Data is unpacked and checked",
        text: "Data travels in packets. The interface checks each packet for errors using a checksum and asks for a resend if one arrives damaged.",
      },
      {
        title: "Everything is passed inward",
        text: "Clean packets are handed to the command processor. Results that need to go back to the CPU travel out the same way.",
      },
    ],
    terms: [
      { term: "Lane", def: "One two-way data path. Slots are named by lane count: x1, x4, x16." },
      {
        term: "Generation",
        def: "The version of the PCIe standard. Each new generation roughly doubles the speed per lane.",
      },
      {
        term: "Gold fingers",
        def: "The plated contacts on the card edge. Gold is used because it does not corrode.",
      },
    ],
    specs: [
      { value: "16", label: "lanes used by a graphics card" },
      { value: "~32 GB/s", label: "PCIe 4.0 across 16 lanes" },
      { value: "75 W", label: "most power the slot itself can supply" },
    ],
    without:
      "The card would have no way to receive work or data. It is the only data connection to the computer.",
    connects: ["host", "cmd", "vrm"],
  },
  cmd: {
    tagline: "The front desk that reads incoming orders.",
    steps: [
      {
        title: "Commands wait in a queue",
        text: "Commands from the driver sit in a buffer in the order they must run. The command processor takes them one at a time.",
      },
      {
        title: "Each command is interpreted",
        text: "It works out what the command asks for: load this program into the cores, use this texture, draw these triangles, copy this block of memory.",
      },
      {
        title: "The chip's state is set up",
        text: "Before work can start, hundreds of internal settings must be right, such as which program the cores will run and where results should be written. The command processor sets them.",
      },
      {
        title: "Work is passed to the scheduler",
        text: "Once everything is prepared, it hands the job on to be divided up, and reads the next command.",
      },
    ],
    terms: [
      {
        term: "Command buffer",
        def: "A list of instructions for the GPU, prepared by the driver and executed in order.",
      },
      {
        term: "State",
        def: "The GPU's current settings: which program, which textures, where to write results.",
      },
      {
        term: "Shader",
        def: "A small program that the compute cores run, once per vertex or once per pixel.",
      },
    ],
    specs: [
      { value: "1,000s", label: "commands per frame" },
      { value: "60+", label: "frames of commands every second" },
      { value: "1", label: "queue, processed strictly in order" },
    ],
    without:
      "The cores would receive a stream of raw data with nothing to tell them what to do with it.",
    connects: ["pcie", "sched", "memctl"],
  },
  sched: {
    tagline: "The foreman that keeps every core busy.",
    steps: [
      {
        title: "One job becomes thousands of threads",
        text: "A job such as “colour two million pixels” is cut into two million tiny identical tasks, called threads. Each thread handles one pixel.",
      },
      {
        title: "Threads are bundled",
        text: "Threads are grouped into bundles of about 32. Every thread in a bundle runs the same instruction at the same moment, which lets them share one set of control circuits.",
      },
      {
        title: "Bundles are assigned to cores",
        text: "The scheduler gives each bundle to a group of cores that is free, and keeps a waiting list of bundles that are ready to run.",
      },
      {
        title: "Waiting is filled with other work",
        text: "When a bundle has to wait for data from memory, the scheduler swaps in another bundle straight away, so the cores are never left idle.",
      },
    ],
    terms: [
      { term: "Thread", def: "One copy of a program working on one piece of data." },
      {
        term: "Warp / wavefront",
        def: "A bundle of about 32 threads that execute in lock-step. Nvidia says warp; AMD says wavefront.",
      },
      {
        term: "Latency hiding",
        def: "Covering up slow memory fetches by running other work in the meantime.",
      },
    ],
    specs: [
      { value: "~32", label: "threads in one bundle" },
      { value: "millions", label: "threads created per frame" },
      { value: "0", label: "idle cores, when it does its job well" },
    ],
    without:
      "Most cores would sit waiting for memory most of the time, and the GPU's speed advantage would disappear.",
    connects: ["cmd", "cores"],
  },
  cores: {
    tagline: "Thousands of small processors doing the real work.",
    steps: [
      {
        title: "Fetch",
        text: "The core reads the next instruction of its program. All cores in a group read the same instruction, because they share one program counter.",
      },
      {
        title: "Decode",
        text: "Control circuits work out what the instruction means: which operation to perform, and which registers hold the inputs.",
      },
      {
        title: "Execute",
        text: "The arithmetic unit does the calculation, typically adding or multiplying decimal numbers. Each core does this on its own data, so thousands of results appear at once.",
      },
      {
        title: "Store, and repeat",
        text: "The result is written to a register or sent to memory. Then the cycle starts again, billions of times per second.",
      },
    ],
    terms: [
      {
        term: "Register",
        def: "A tiny, very fast storage slot inside a core that holds one number being worked on.",
      },
      {
        term: "ALU",
        def: "Arithmetic logic unit: the circuit inside a core that actually adds, multiplies and compares.",
      },
      {
        term: "SIMT",
        def: "Single instruction, multiple threads: many cores running the same instruction on different data.",
      },
    ],
    specs: [
      { value: "16,000+", label: "cores on a top consumer card" },
      { value: "billions", label: "of transistors on the chip" },
      { value: "trillions", label: "of calculations per second" },
    ],
    without: "There would be nothing to do the calculations. Every other part exists to serve the cores.",
    connects: ["sched", "cache", "raster"],
  },
  cache: {
    tagline: "A small, very fast memory right next to the cores.",
    steps: [
      {
        title: "A core asks for data",
        text: "Every request for data from memory goes to the cache first.",
      },
      {
        title: "Hit: the data is already here",
        text: "If the cache holds a copy, it is returned within a few clock ticks. This is called a hit.",
      },
      {
        title: "Miss: fetch it from VRAM",
        text: "If not, the request goes on to the memory controller and VRAM, which takes far longer. This is called a miss.",
      },
      {
        title: "Keep a copy for next time",
        text: "The fetched data, and the data stored next to it, is kept in the cache. Programs usually need neighbouring data next, so the following requests are hits.",
      },
    ],
    terms: [
      { term: "Hit / miss", def: "Whether the requested data was found in the cache or not." },
      {
        term: "L1, L2",
        def: "Levels of cache. L1 is the smallest and fastest, closest to the cores; L2 is larger and a little slower.",
      },
      {
        term: "Locality",
        def: "The tendency of programs to reuse the same data, or data stored nearby.",
      },
    ],
    specs: [
      { value: "a few ticks", label: "to answer a hit" },
      { value: "100s of ticks", label: "to answer a miss from VRAM" },
      { value: "MBs", label: "of cache, against GBs of VRAM" },
    ],
    without:
      "Every memory access would take the long trip to VRAM, and the cores would spend most of their time waiting.",
    connects: ["cores", "memctl"],
  },
  memctl: {
    tagline: "The traffic manager between the chip and its memory.",
    steps: [
      {
        title: "Requests pile up",
        text: "Thousands of cores, the display engine and the command processor all want to read or write memory at the same time.",
      },
      {
        title: "They are ordered and grouped",
        text: "The controller decides whose request goes first and groups requests for nearby addresses, so each trip to VRAM does as much as possible.",
      },
      {
        title: "Addresses become signals",
        text: "It converts each address into the precisely timed electrical signals the VRAM chips expect, across hundreds of wires at once.",
      },
      {
        title: "Data is returned to whoever asked",
        text: "Data coming back is checked and delivered to the right requester, usually by way of the cache.",
      },
    ],
    terms: [
      {
        term: "Bandwidth",
        def: "How much data can be moved per second. Often what limits a GPU at high resolutions.",
      },
      {
        term: "Memory bus",
        def: "The set of wires between the chip and the VRAM chips.",
      },
      {
        term: "Address",
        def: "The number that identifies one location in memory.",
      },
    ],
    specs: [
      { value: "100s of GB/s", label: "moved to and from VRAM" },
      { value: "100s", label: "of data wires to the VRAM chips" },
      { value: "1,000s", label: "of requests handled at once" },
    ],
    without:
      "Requests from different cores would collide, and data would be delivered to the wrong place or lost.",
    connects: ["cache", "vram", "display", "cmd"],
  },
  raster: {
    tagline: "Specialised circuits that turn triangles into pixels.",
    steps: [
      {
        title: "Triangles arrive in screen position",
        text: "The cores have already worked out where each corner of each triangle lands on the screen.",
      },
      {
        title: "Covered pixels are found",
        text: "For each triangle, the rasterizer tests which pixel centres lie inside it. Each covered pixel becomes a fragment that needs a colour.",
      },
      {
        title: "Hidden pixels are thrown away",
        text: "If something nearer has already been drawn at that pixel, the fragment is discarded before any more work is spent on it.",
      },
      {
        title: "Texture units supply colours",
        text: "When a fragment needs a colour from an image, a texture unit looks it up and blends neighbouring points so the surface looks smooth at any distance or angle.",
      },
    ],
    terms: [
      { term: "Fragment", def: "A candidate pixel produced by the rasterizer, before its final colour is known." },
      {
        term: "Depth test",
        def: "Comparing distances so that nearer objects correctly hide farther ones.",
      },
      {
        term: "Texture filtering",
        def: "Blending nearby points of an image so textures do not look blocky or shimmer.",
      },
    ],
    specs: [
      { value: "billions", label: "of pixels filled per second" },
      { value: "millions", label: "of triangles per frame" },
      { value: "1", label: "fixed job, done extremely fast" },
    ],
    without:
      "The general-purpose cores would have to do this work themselves, many times more slowly.",
    connects: ["cores", "memctl"],
  },
  display: {
    tagline: "Turns the finished image into a video signal.",
    steps: [
      {
        title: "Wait for a complete frame",
        text: "The display engine only shows frames that are finished. A half-drawn frame is never sent.",
      },
      {
        title: "Read the framebuffer in order",
        text: "It reads the image from VRAM row by row, top to bottom, at exactly the pace the monitor expects.",
      },
      {
        title: "Adjust for the screen",
        text: "It can scale the image, convert colours, and combine layers such as the mouse pointer on top of the picture.",
      },
      {
        title: "Encode and send",
        text: "The pixels are packed into the HDMI or DisplayPort format and driven out through the display outputs.",
      },
    ],
    terms: [
      { term: "Framebuffer", def: "The area of VRAM that holds the finished image." },
      { term: "Refresh rate", def: "How many times per second the monitor redraws, measured in hertz (Hz)." },
      {
        term: "V-sync",
        def: "Changing to a new frame only between screen refreshes, so the picture never tears.",
      },
    ],
    specs: [
      { value: "~500 million", label: "pixels per second for 4K at 60 Hz" },
      { value: "60–240 Hz", label: "common refresh rates" },
      { value: "2–4", label: "monitors driven at once" },
    ],
    without: "The image would be finished inside VRAM with no way to reach a screen.",
    connects: ["memctl", "ports"],
  },
  vram: {
    tagline: "The GPU's own large, fast memory.",
    steps: [
      {
        title: "Data is loaded in",
        text: "Before work starts, textures, 3D models or AI model weights are copied from the computer into VRAM, because the GPU can only work quickly on data it holds itself.",
      },
      {
        title: "Each bit is a stored charge",
        text: "Every bit is a tiny electrical charge in a cell. The charge leaks away, so the chips rewrite every cell many times a second to keep the data alive.",
      },
      {
        title: "Cores read and write constantly",
        text: "During a frame, the cores read input data and write results through the memory controller, moving hundreds of gigabytes per second.",
      },
      {
        title: "The finished frame waits here",
        text: "The completed image is stored in VRAM as the framebuffer until the display engine sends it to the monitor.",
      },
    ],
    terms: [
      { term: "GDDR", def: "The family of memory chips designed for graphics cards, tuned for moving lots of data fast." },
      {
        term: "Framebuffer",
        def: "The part of VRAM holding the image that is about to be shown.",
      },
      {
        term: "Out of memory",
        def: "When the data needed is larger than VRAM. The job fails, or slows badly while data is shuffled.",
      },
    ],
    specs: [
      { value: "8–32 GB", label: "on consumer cards" },
      { value: "100s of GB/s", label: "data moved to the chip" },
      { value: "6–12", label: "separate memory chips around the GPU" },
    ],
    without:
      "The cores would have nothing to work on and nowhere to put results. Too little VRAM is the most common hard limit people hit.",
    connects: ["memctl", "vrm"],
  },
  ports: {
    tagline: "The sockets that carry the picture to your monitor.",
    steps: [
      {
        title: "The signal arrives from the display engine",
        text: "Finished video data reaches the port as a stream of very fast electrical pulses.",
      },
      {
        title: "The port and monitor agree on a format",
        text: "When you plug in a cable, the monitor reports which resolutions and refresh rates it supports, and the two settle on one.",
      },
      {
        title: "Pixels travel down the cable",
        text: "The data is sent over several wire pairs at once, together with sound if the monitor has speakers.",
      },
    ],
    terms: [
      { term: "HDMI", def: "The connector common on TVs and many monitors." },
      { term: "DisplayPort", def: "The connector common on computer monitors, usually supporting the highest refresh rates." },
      {
        term: "I/O bracket",
        def: "The metal plate at the end of the card that holds the ports and fixes the card to the case.",
      },
    ],
    specs: [
      { value: "3–4", label: "ports on a typical card" },
      { value: "8K", label: "highest resolution one cable can carry" },
      { value: "0", label: "ports on many data-centre AI cards" },
    ],
    without:
      "Nothing for graphics would reach a screen. Cards used only for AI calculations often leave them out entirely.",
    connects: ["display"],
  },
  vrm: {
    tagline: "Turns 12 volts into the steady 1 volt the chip needs.",
    steps: [
      {
        title: "12 volts arrives",
        text: "Power comes from the computer's power supply through the slot and through extra cables plugged into the card.",
      },
      {
        title: "Switches chop it up",
        text: "Electronic switches turn the 12 volt supply on and off hundreds of thousands of times a second. The share of time they spend on sets the output voltage.",
      },
      {
        title: "Coils and capacitors smooth it",
        text: "Coils of wire (the grey cubes) and capacitors (the small cylinders) smooth the choppy output into a steady voltage of about 1 volt.",
      },
      {
        title: "Phases share the load",
        text: "No single converter could carry the full current, so many identical ones, called phases, take turns. A controller adjusts them within microseconds as the chip's demand changes.",
      },
    ],
    terms: [
      { term: "VRM", def: "Voltage regulator module: the circuitry that converts and steadies the power." },
      { term: "Phase", def: "One of several identical converters working in rotation to share the current." },
      {
        term: "Choke",
        def: "A coil of wire that resists sudden changes in current, used to smooth the output.",
      },
    ],
    specs: [
      { value: "12 V → ~1 V", label: "voltage conversion" },
      { value: "300–450 W", label: "drawn by a top card" },
      { value: "100s of amps", label: "delivered to the chip" },
    ],
    without:
      "12 volts applied directly would destroy the chip instantly. Unsteady power causes crashes and errors.",
    connects: ["pcie", "cores", "vram", "cooler"],
  },
  cooler: {
    tagline: "Carries heat away so the chip can keep working.",
    steps: [
      {
        title: "The chip turns electricity into heat",
        text: "Almost every watt the chip uses ends up as heat, concentrated in an area about the size of a postage stamp.",
      },
      {
        title: "A metal plate picks it up",
        text: "A flat copper plate presses against the chip, with a thin layer of thermal paste between them to fill microscopic gaps.",
      },
      {
        title: "Heat pipes spread it out",
        text: "Sealed copper pipes contain a liquid that boils at the hot end, travels as vapour to the cool end, condenses and flows back. This moves heat far faster than solid metal.",
      },
      {
        title: "Fins and fans release it",
        text: "The pipes run through a stack of thin aluminium fins with a very large total surface. Fans push air between the fins, and the air carries the heat away.",
      },
    ],
    terms: [
      { term: "Heatsink", def: "A block of metal fins that passes heat to the air." },
      {
        term: "Thermal throttling",
        def: "The chip slowing itself down on purpose when it gets too hot, to avoid damage.",
      },
      { term: "Thermal paste", def: "A paste that fills tiny gaps between chip and cooler so heat crosses easily." },
    ],
    specs: [
      { value: "300–450 W", label: "of heat to remove" },
      { value: "~85 °C", label: "typical safe limit for the chip" },
      { value: "2–3", label: "fans on most cards" },
    ],
    without:
      "The chip would overheat within seconds and shut down. With weak cooling it survives, but runs much slower.",
    connects: ["cores", "vram", "vrm"],
  },
};
