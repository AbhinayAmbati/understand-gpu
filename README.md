# GPU Explorer

An interactive, animated guide to how a GPU works, written for complete beginners.

- **Components** – clickable block diagram of a graphics card with a 9-step guided tour
- **CPU vs GPU** – a race showing why many simple cores beat a few fast ones
- **Inside a core** – a working 4-core GPU simulator (fetch, decode, execute)
- **Drawing a frame** – the graphics pipeline, animated stage by stage

Built with Next.js, React, Tailwind CSS and GSAP.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Structure

- `app/` – page, layout, design tokens (`globals.css`)
- `components/` – the interactive sections; `components/ui` holds shared primitives
- `lib/parts.ts` – component data and tour steps
- `lib/tinygpu.ts` – the tiny GPU simulator (pure functions)
