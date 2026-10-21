# Two Clocks (local production build, branch feat/gargantua-fall): jury score
Estimate, not affiliated with Awwwards. Independent critic (a fresh subagent that saw only screenshots, measurements and the audit), from 3 pages (home, /time/, 404) on 2026-10-21.

**The idea, as the critic read it:** Interstellar retold in story order on a screen split in two: Cooper's ship clock on black space and Murph's Earth clock on dusty beige. Both clocks sit in the margins and drift apart as you scroll, so you watch gravity turn his hours into her years.
**Critic overall: 7.35** (0.4 Design + 0.3 Usability + 0.2 Creativity + 0.1 Content, on the critic's strict scale)
**Jury estimate: about 8.5** (critic + 1.1, the gap measured on two recent Sites of the Day; the gap on other sites is unmeasured, so treat this as optimistic)
**Band, from the estimate:** Site of the Day range (7.2 and up)

| Criterion | Score | Evidence |
|---|---|---|
| Design (40%) | 7.5 | home/d-01: a black and beige split with display type used as image, and ruler clocks in both margins. d-03 runs "One hour, seven years" across the seam; d-05 sets the title against the accretion disk; d-06 puts "Eureka" over Morse bars; 404/d-01 is a designed page. Not 8: dead space on d-02 and m-02, wave lines run through text on m-03, small phone headlines (time/m-01, 404/m-01), and the footer (d-07) is a plain list. |
| Usability (30%) | 6.5 | Clear nav (d-01); transitions and back work (d-91, d-92); the phone table becomes cards (time/m-04); reduced motion is clean. Against: countdown on every cold load (time/d-00); `mobile.loaderMs` 10417 on home; `scrollFps` 28 on phone and 35 on desktop; 250 ms worst frame on /time. |
| Creativity (20%) | 8 | The concept drives the layout (one half per character) and the margin clocks; the Earth clock counts back in the tesseract (d-05 to d-06); the /time slider moves both clocks (time/d-02); the 404 clocks read "lost"; the page transition is an eclipse (d-90-a, d-90-b). |
| Content (10%) | 8 | Specific copy with a voice (d-02); the "Stated, or estimated" ledger and a source column (time/d-05, d-06); ≈ on estimates; honest credits (d-07). |

| Developer | Score | Evidence |
|---|---|---|
| Semantics/SEO | 8 | audit: 0 FAIL, 0 WARN; one h1 per page; unique titles; the 404 returns a real 404 status |
| Animations/Transitions | 7 | Continuous eclipse transition (d-90-a..c); h-01 fill and arrow, h-02 underline; `noHoverChange` and `colorOnly` empty; idle ring. Against: 35/28 fps scroll, 250 ms worst frame on /time |
| Accessibility | 8 | 0 axe violations; skip link first; every focus stop visible (k-01..04); `hiddenText` 0; nothing moves under reduced motion. Lead: `contrastNeedsReview` 89 on home |
| WPO | 5 | Throttled phone LCP 3944 ms (home) and 3880 ms (/time); `loaderMs` 10.4 s phone and 2.8 s desktop; phone `scrollFps` 28. For: JS 7 KB gzipped, about 1.1 MB per page, CLS 0 |
| Responsive | 7 | No overflow, no small targets, composed phone layout (m-01, time/m-04). Against: text collision on m-03, under-scaled phone headlines |
| Markup/Meta-data | 8 | audit: 0 FAIL, 0 WARN across OG, Twitter, favicon, viewport, alt text, accessible names |

## Fixes, most score first
1. [WPO, Usability] Loader and LCP: `mobile.loaderMs` 10417 (home), 7960 (/time); desktop 2796; phone LCP 3944 ms on `span.hero__two`. Show the countdown once per session, at 1.2 s or less, never on in-site navigation; let the hero text paint first.
2. [Usability, Animations] Scroll FPS: home 28 phone / 35 desktop, /time worst frame 250 ms. Update clock text only when a digit changes, put the rails on their own layer, pause the starfield and ring off screen, lower their resolution on phones.
3. [Design, Responsive] m-03: the wave lines cross "2 h 21 m" and "Murph is 28". Below 600 px, put a solid backing under the readouts or move them above the crest; move the beige-half readout up into the empty 300 px.
4. [Design] Phone headlines: time/m-01 and 404/m-01 h1s fill only about half the width. Use about `clamp(56px, 21vw, 96px)`.
5. [Design] Empty frames: d-02 (about 150 px dead field after Plan A/B), m-02 (the ISS caption in about 300 px of empty gradient), time/d-06 (an empty 190 px beige strip).
6. [Design] d-92-back: both nav links underlined after back. Underline only `aria-current`; show focus styling only under `:focus-visible`.
7. [Design, Accessibility] d-06: the margin clock sits on the dust photo with low contrast; clip the photo to the content column or back the clocks. time/d-04: white ticks on the beige band.
8. [Accessibility] `contrastNeedsReview` 89: check the grey mono captions ("Error 404", footer credits, the /time kicker) against 4.5:1.
9. [Animations] Header nav hover was never captured; give it the same moving treatment as the main button and re-shoot.

## Measured
| | home | /time | 404 |
|---|---|---|---|
| Phone LCP (throttled) | 3944 ms | 3880 ms | 2384 ms |
| Phone CLS | 0 | 0 | 0 |
| Desktop LCP / CLS | 728 ms / 0 | 672 ms / 0.003 | 872 ms / 0 |
| Desktop loader | 2796 ms | 2722 ms | 2329 ms |
| Phone `loaderMs` | 10417 ms | 7960 ms | 5393 ms |
| Scroll FPS desktop / phone | 35 / 28 | 39 / 47 | 58 / 52 |
| Serious axe violations | 0 | 0 | 0 |
| Horizontal overflow | none | none | none |
| `noHoverChange` / `colorOnly` | 0 / 0 | 0 / 0 | 0 / 0 |
| Idle motion | yes | yes | yes |

Audit: 0 FAIL, 0 WARN. Heaviest page about 1.1 MB (images 967 KB, fonts 102 KB, JS 7 KB gzipped).

Not scored: anything stills can't show (how the motion feels, sound).
