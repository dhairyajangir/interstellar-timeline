# Two Clocks: Interstellar in the order it happens

An unofficial, scroll-driven timeline of *Interstellar* (2014). Two clocks run in the margins for the
whole page: Cooper's ship time on the left, Earth time (and Murph's age) on the right. Gravity decides
how fast each one runs.

Photographs are public-domain NASA and USDA images, toned by `scripts/grade.mjs`. Film stills (© Warner Bros. / Paramount), including Cooper and Murph, are marked `film: true` in `src/data/photos.ts`. The wormhole is ray traced through the film's own metric (`src/lib/wormhole.ts`, `scripts/wormhole.mts`, `src/motion/passage.ts`); `npm run grade` rebuilds its ray map, skies and stills (needs ffmpeg for the NASA EXR star maps). The score is an organ pad synthesized with Web Audio (`src/motion/sound.ts`), off until the visitor turns it on. Line art, the Endurance ring and the sky shader are drawn in code.

## Run

Requires Node 22.12 or later (Astro 6).

```bash
npm install
npm run dev -- --background # http://localhost:4321
npm run build      # static site in dist/
npm run preview    # serve the production build
```

## Where things live

- `src/data/site.ts`: every chapter, number and sentence. Estimates are marked `est: true`.
- `src/motion/clocks.ts`: the clock driver. Scroll position → both clocks, rails, page tone, sky shader.
- `src/motion/sky.ts`: the WebGL sky (stars, wormhole, Gargantua). Falls back to CSS when WebGL is
  slow, missing, or reduced motion is on.
- `src/motion/setup.ts`: loader, wormhole page transition, CTA fill, Miller's planet stage.
- `src/motion/passage.ts`: the live wormhole flight (WebGL2). `src/motion/sound.ts`: the score.
- `DESIGN.md`: concept, palette, type and layout decisions.

## Deployment

Vercel builds this project with `npm run build` and serves `dist/`.
The production domain is `https://interstellar-timeline.vercel.app`.

The GitHub repository is connected to Vercel. Pushes to `main` automatically build
and deploy the production site.

If the production domain changes, update `astro.config.mjs`, `src/data/site.ts` and
`public/robots.txt` together.
