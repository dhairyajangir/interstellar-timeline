# Two Clocks (local production build, branch feat/gargantua-fall, after fixes): jury score
Estimate, not affiliated with Awwwards. Independent critic: a new fresh subagent that saw only screenshots, measurements and the audit, never the earlier card. 3 pages (home, /time/, 404), 2026-10-21. The previous card is `scorecard-1.md`.

**The idea, as the critic read it:** Interstellar retold in story order as a split screen with two running clocks: Cooper's ship clock on black, Murph's Earth clock on tan. They drift apart as you scroll, so you feel the time dilation instead of being told about it.
**Critic overall: 7.35** (unchanged; 0.4 Design + 0.3 Usability + 0.2 Creativity + 0.1 Content, on the critic's strict scale)
**Jury estimate: about 8.5** (critic + 1.1, measured on two recent Sites of the Day; the gap on other sites is unmeasured, so treat this as optimistic)
**Band, from the estimate:** Site of the Day range (7.2 and up)

| Criterion | Score | Change | Evidence |
|---|---|---|---|
| Design (40%) | 7.5 | = | d-01 split poster; d-03 headline across the seam; d-06 "Eureka" over the toned farm photo. Not 8: empty band above the footer (d-07, 404 d-05), a dead right column (time d-04), a header band that stops at the seam (time d-03), a stray dark rectangle (m-05), both nav links underlined on return (d-92). |
| Usability (30%) | 6.5 | = | Clear nav; the phone clock bar works; clean reduced motion. Against: countdown `loaderMs` 2897 on desktop, 9199 on phone (home); throttled phone LCP 3.5 to 4.3 s; desktop `scrollFps` 32. |
| Creativity (20%) | 8 | = | The rails count 0 yr to Year 84 and Murph ≈ 94; the time-page slider drives the margin clocks; Morse "Eureka"; the 404 clocks read "lost". |
| Content (10%) | 8 | = | Copy with a voice; the stated or estimated ledger and the sourced table; credited images. |

| Developer | Score | Change | Evidence |
|---|---|---|---|
| Semantics/SEO | 8 | = | audit: 0 FAIL, 0 WARN; unique titles; one h1 per page; a real 404 |
| Animations/Transitions | 7 | = | Continuous disc transition with the rails kept (d-90-a, d-90-b); hover fill and underline; `noHoverChange` and `colorOnly` empty; idle motion. Against: scroll FPS, a stale underline in d-92, a headline rewrap in time d-90-b |
| Accessibility | 8 | = | 0 axe violations; skip link first; every focus ring visible; nothing moving under reduced motion. Leads: `contrastNeedsReview` 71/45/21 |
| WPO | 5 | = | Phone LCP 3512 / 4292 / 2880 ms; home phone CLS 0.071; loader 2.9 s desktop. JS 7 KB gz, 1.1 MB per page |
| Responsive | 8 | +1 | No overflow, no small targets, a composed phone layout (m-01, time m-04), headlines restack. Small blemishes: m-05 rectangle, the 404 CTA over the wireframe |
| Markup/Meta-data | 8 | = | audit: 0 FAIL. Caveat: 42 console errors per page, all `/_vercel/insights` and `/speed-insights` 404s |

## What changed between the two runs
- Fixed: the Miller readouts clear the wave on phones; phone headlines on /time and the 404 are poster sized; the Earth photo now carries the dust-to-space fade with no empty gradient; tighter NASA close and /time ledger; the Dust Bowl photo stays inside the content column; the 404 CTA sits on solid ground; rail and header ink uses geometry instead of hit-testing.
- Measured effect: phone scroll on home went from 28 to 46 fps (desktop 35 to 32, within this machine's run-to-run noise); Responsive went from 7 to 8.
- New in this run: 42 console errors per page. They come from Vercel Web Analytics and Speed Insights (commit 5151618, added outside this work), whose scripts only exist on Vercel, so they 404 on a local server. Home phone CLS 0.071 did not reproduce in three separate runs (one shift of 0.0001), so it looks like run-to-run variance.

## Fixes, most score first
1. [Usability, WPO] Loader: `loaderMs` 2897 desktop. Cap the countdown at about 1.2 s and never play it on the 404.
2. [WPO] Phone LCP: span.hero__two at 3512 ms, the /time h1 at 4292 ms. Keep the display text painted at first paint; consider subsetting the 88 KB Archivo file.
3. [WPO, Animations] Home phone CLS 0.071 and the hero lede rewrap on return (d-90-c, d-92): reveal with transform and clip only.
4. [Usability, Animations] Desktop scroll FPS 32 (worst frame 117 ms): pause the star field under opaque tan sections, and lower the cost of the scrubbed photos.
5. [Design] d-92: both nav links underlined after back navigation.
6. [Content] The Earth rail jumps between Year 45 and Year 26 with no cue on desktop; label the rewind at the tesseract.
7. [Design] Time d-03: the rail ticks stay white over tan, and the header band stops at the seam.
8. [Design] About 290 px of empty band above the footer (d-07, time d-07) and after the 404 CTA; the footer repeats the nav.
9. [Design, Responsive] m-05: a dark rectangle peeks out under the tesseract card.
10. [Accessibility] Grey mono captions on near-black (`contrastNeedsReview` 71).
11. [Usability] d-02: the launch block has no chapter number, and the Mann row butts into it.
12. [Markup] Load the Vercel scripts only in Vercel builds, so local previews stay clean.

## Measured
| | home | /time | 404 |
|---|---|---|---|
| Phone LCP (throttled) | 3512 ms | 4292 ms | 2880 ms |
| Phone CLS | 0.071 | 0 | 0 |
| Desktop LCP / CLS | 944 ms / 0 | 744 ms / 0 | 872 ms / 0 |
| Desktop loader | 2897 ms | 2553 ms | 2400 ms |
| Phone `loaderMs` (script start; phones show no countdown) | 9199 ms | 9125 ms | 7138 ms |
| Scroll FPS desktop / phone | 32 / 46 | 39 / 50 | 59 / 51 |
| Serious axe violations | 0 | 0 | 0 |
| Horizontal overflow | none | none | none |
| `noHoverChange` / `colorOnly` | 0 / 0 | 0 / 0 | 0 / 0 |
| Idle motion | yes | yes | yes |
| Console errors | 42 (Vercel scripts) | 42 | 29 |

Audit: 0 FAIL, 0 WARN. Heaviest page about 1.1 MB.

Not scored: anything stills can't show (how the motion feels, sound).
