# Two Clocks: Interstellar in order

## Phase 0: Brief

- **Subject:** the story of *Interstellar* (2014, Christopher Nolan), told in the order events happen.
- **Audience:** people who saw the film once and lost track of who is how old when; students of the
  physics; fans who want the ages side by side.
- **Job:** make the timeline legible, and make time dilation felt, not just stated.
- **Assets:** none. No film stills, no logos, no posters. Every visual is original CSS, SVG or WebGL.
  Copy is written fresh; no dialogue is quoted beyond single words (STAY, Eureka) that are plot facts.
- **Language:** English.
- **Assumptions (marked in `src/data/site.ts`):**
  - Murph is 10 at launch (widely stated; the film shows her as a child of about that age).
  - Durations the film never states (Saturn to Mann, time inside the tesseract) are estimates and are
    labelled with "about" or "≈" on screen and in the source table.
  - Cooper's age at launch is not given. To turn "124 years old" into Earth time we assume about 40,
    which gives ≈ 84 Earth years and Murph ≈ 94. The `/time/` page shows that arithmetic.
  - Production URL `https://interstellar-timeline.example` is a placeholder.

## Phase 1: Concepts

| | A. Two clocks (formal, from the film's own rule) | B. The bookshelf (material: the tesseract) | C. Gravity sets the page (physics as layout) |
|---|---|---|---|
| Idea | The site keeps two clocks for the whole scroll: Cooper's on the left rail, Earth's (Murph's) on the right. Scrolling advances the story; gravity decides how fast each rail runs. | The site is Murph's bookshelf seen from behind; every chapter is a book that falls when you reach it. | Section height is proportional to the time Earth spends on it, so Miller's planet is 23 screens long. |
| Anchor | The plot hinges on two people aging at different rates (1 hour = 7 years). | The ghost is Cooper behind the shelf. | Same dilation fact. |
| Signature | Miller's planet: three ship hours crawl on the left while the right rail spins through 23 years and Murph grows up in numbers. In the tesseract the Earth clock runs backwards. | Books tumbling out to spell STAY. | A huge, mostly empty page. |
| Screenshot | The split frame at Miller's: "1 hour = 7 years" between a nearly still dial and a blurred year counter. | Shelf from behind. | Ruler of empty space. |
| O / F / Fe / P | 4 / 5 / 4 / 1 | 4 / 4 / 2 / 2 | 3 / 4 / 3 / 2 (punishes readers) |

**Pick A.** It is the film's own rule turned into the interface, it answers the brief's "how time passes
differently" in every frame, and it is buildable well. Steal from B for the tesseract chapter (bookshelf
lines in perspective) and for the 404 (a gap on the shelf). Steal C's honesty: the rails' speed is
literally the dilation ratio.

### Concept card

```
Idea:        Two clocks run down the page: Cooper's ship time on the left, Earth time on the right.
Metaphor:    a mission clock with two readouts that disagree, and a gravity well that pulls them apart.
Signature:   Miller's planet. A pinned stage where a 3-hour ship dial barely moves while the Earth
             counter races 23 years and Murph's age climbs from 12 to 35. Recipe: sticky stage +
             driver module (patterns.md 1 and 2).
Emotion:     quiet dread, then awe. The first 3 seconds: two zeros side by side, dust on one half,
             black on the other.
Motion verb: dilate. Things stretch along time: type widens on the Archivo wdth axis, rails slip at
             the local rate of time, fills spread slowly like dust over a floor.
Screenshot:  the Miller frame: "1 hour" on the void side, "7 years" on the dust side.
```

## Phase 2: Art direction

### Palette (from the two worlds, not from a trend)

| Role | Hex | Source |
|---|---|---|
| `void` (space ground) | `#060708` | the black around Saturn |
| `star` (ink on void) | `#ece7dc` | warm starlight, not blue-white |
| `dust` (Earth ground, Murph's accent) | `#c9b48f` | dried corn dust on a windowsill |
| `soot` (ink on dust) | `#17130e` | farmhouse soot |
| `muted` (secondary on void) | `#958f84` | AA 6.1:1 on void |
| `line` | `rgb(236 231 220 / 0.14)` | hairlines |

Dust is the only accent and it means Earth. On space chapters dust appears only as Murph's rail.
Background follows the story through one variable (`--ground`/`--ink` on `<html>` set by the driver):
Earth chapters are dust, space chapters are void. Pure black + one accent is a known AI tell; here the
accent is the other half of the concept, so it stays, used as a field, not a highlight.

### Type

- **Archivo** (Google, OFL), variable `wdth 62..125`, `wght 100..900`: display and text. The width axis
  carries the motion verb: display type widens as gravity strengthens (condensed on Earth, expanded at
  Gargantua). Display tracking -0.04em, leading 0.86.
- **IBM Plex Mono** (Google, OFL) 400/500: only the two clocks and their labels. Tabular figures.
- Scale: tokens `--t-mega … --t-xs` (fluid). Body 17 px / 1.55.

### Grid & rhythm

12 columns, gutter = outer margin. Two fixed rails occupy the outer margins on desktop
(Cooper left, Earth right); content hangs from columns 2, 5 and 8. Phones: rails collapse into a
two-cell clock bar at the top; content on a 4-column grid. Section rhythm varies: hero full viewport,
farm airy, NASA tight, wormhole full-bleed, Miller pinned (220svh), Mann statement, Gargantua pinned,
Murph poster, station finale.

### Shape

Radius 0 everywhere except true circles (planets, dials, wormhole). Hairlines 1 px.

### Motion language

- Eases: engine `out` (expo.out) for reveals, `inOut` for the wormhole transition, `soft` for UI.
- Durations: reveals 1.1 to 1.3 s, hovers 0.35 to 0.5 s, transition 0.9 s each way.
- Dilate in practice: nav and links widen (wdth 100 → 125) on hover with an underline that draws; the
  CTA fills with dust from the pointer side; display headings set their width from the driver.
- **Idle:** the rails never stop. At rest each tick ruler keeps slipping at its chapter's real rate
  ratio (clamped for comfort), so at Miller's planet the Earth rail keeps racing while you read. Off
  under reduced motion. The GL star field also drifts slowly.

### Composition plan

```
HERO (split poster)                FARM (asymmetric pair)          NASA (index list / data)
|void      ||dust        |        |  [dust field art 7c] | text 4c|  | 12 Lazarus | 3 signals   |
| 0h 00m   ||  Year 0    |        |  corn rows, ghost    |        |  | Miller ... Edmunds ... Mann
|  ONE TRIP. TWO CLOCKS. |        |  dust lines          |        |  | Plan A / Plan B two-col   |
| Cooper   ||  Murph 10  |
WORMHOLE (full-bleed GL sphere)    MILLER (pinned sticky stage)    MANN (statement)
|      ( lens )          |        | dial    1 hour | 7 years ctr|  | big paragraph 9c, ice     |
| 2 years to Saturn      |        |  ~~~~ wave rising ~~~~~~~~ |  |
GARGANTUA (sticky narrative)       MURPH (poster)                  STATION (footer finale)
| shelf lines 3D | text  |        |     EUREKA (dust)          |  | ages side by side, table  |
| earth clock reverses   |        |                            |  | footer links, colophon    |
```

### Genericness test

- A generic model would put a starfield hero with centered white serif and a blue nebula gradient.
  Changed: the hero is a hard split between dust and void with two clocks; no nebula, no blue.
- A generic timeline is a vertical line with dots on alternating sides. Changed: the "line" is two
  rails running at different speeds; there are no dots.
- Generic display font would be a wide sci-fi face (Orbitron family). Changed: Archivo, whose width
  axis is driven by gravity, condensed at the farm.

## Pages

- `/` the timeline, eight chapters.
- `/time/` how the clocks drift: the dilation explained, ages side by side, stated versus estimated.
- `/404` "a gap on the shelf": the page fell behind the bookshelf.

## Build decisions made during QA

- **Idle motion:** the rails' rulers keep slipping at their chapter's rate while the visitor is
  still (Earth races at Miller's planet, runs backwards in the tesseract). The GL star field
  twinkles. Both stop under reduced motion.
- **Ink follows the world under it:** header and rail parts check what is actually beneath them
  (`data-ink` in `clocks.ts`), so a label straddling dust and void never disappears.
- **GL governor:** the sky starts after the intro, times its first frame, halves resolution if slow
  and falls back to the CSS star field if still slow. Software renderers (headless QA) get the
  fallback; GPUs get the shader.
- **Phones:** no loader and no scroll reveals. Content paints with the HTML; the signature
  (Miller stage, clocks, wormhole transition) stays.
- **Hero intro:** the hero words are visible from the first paint (they are the LCP) and widen
  from wdth 62 to their rest width 72 as the loader leaves: time dilating back to normal.
- **Page transition:** the wormhole iris; the clock rails sit above it, so both clocks keep
  running while you travel between pages.
- **Prefetch off:** Astro's prefetch-all cost seconds of main thread on slow phones; the
  transition already overlaps the fetch.

## Imagery pass (real photographs and film stills)

- **Sources:** public-domain photographs (NASA Cassini, Goddard's black-hole simulation, NASA Ames
  1976 colony study, ISS Earth limb, Antarctica; Arthur Rothstein's 1936 Dust Bowl photograph; a
  USDA Dust Bowl photograph) plus owner-supplied film stills (Ranger docking, TARS on Miller's
  planet, Gargantua, the watch). Fan renders, fan builds and the watermarked stock photo were left
  out. Credits sit under each photo and in the footer.
- **Grade:** `scripts/grade.mjs` maps every image into the two worlds (void: black to starlight;
  dust: soot to pale dust; fire for Gargantua) with fixed grain, so photographs from 1936, 1976
  and 2019 read as one series. Re-run it after changing sources.
- **Motion verb on photos:** frames dilate open from their centre line while the image settles
  from stretched to rest (`data-reveal="dilate"`), then drift inside the frame on scroll.
- **Story motion:** the code-drawn Endurance ring turns in the hero (idle) and falls into the
  wormhole sphere (scrub); the Ranger still turns as you read about the docking; Goddard's black
  hole swells as you fall toward it; Murph's watch hand ticks EUREKA in Morse (idle, on screen only).
- **Removing film stills:** delete their entries in `src/data/photos.ts` and the `film` jobs in
  `scripts/grade.mjs`; the layout keeps working without them.

## The fall (Gargantua, chapter 06)

- A full-bleed sticky stage under the chapter text, scrubbed by scroll: Goddard's 2019 black hole
  (approach), then three frames from NASA Goddard's 2024 plunge simulation (through the disk, the
  sky folding over the horizon, the photon ring past the horizon), then the tesseract.
- Each frame takes over by pushing through the last: the old one swells and burns out, the new
  one settles in from stretched. The handover to the tesseract sits at 40% of the chapter, the
  same point where the Earth clock starts to rewind.
- The tesseract is the production still of the set, nested five times inside itself; at rest the
  nest zooms by one step and loops, so the corridor never ends (idle motion, on screen only).
- A caption names the frame and credits it. Phones hide the caption (credits stay in the footer)
  and put paragraphs on dark plates. Reduced motion shows the frames one after another.
