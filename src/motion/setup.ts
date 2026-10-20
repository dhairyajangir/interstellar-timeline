// Global motion for Two Clocks: runs once on the client, before the first page initializes.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ease, isMobile, isTouch, onPage, onScroll, prefersReducedMotion, setLoaderExit, setLoaderFormat, setTransition } from '../engine';
import { onClocks, startClocks } from './clocks';

export function setupMotion() {
  // Loader: a launch countdown. Its last frame is the hero's first: void left, dust right.
  setLoaderFormat((p) => `T−${String(Math.ceil(3 - (p / 100) * 3)).padStart(2, '0')}`);
  setLoaderExit((root) => gsap.timeline()
    .call(() => root.classList.add('is-exiting')) // the sky starts drawing underneath
    .to(root.querySelectorAll('[data-loader-out]'), { yPercent: -110, duration: 0.35, ease: ease.inOut, stagger: 0.03 })
    .to(root.querySelector('.loader__dust'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.45, ease: ease.inOut }, '<0.05')
    .to(root, { autoAlpha: 0, duration: 0.2, ease: 'none' }, '-=0.15'));

  // Page transition: the wormhole. The void opens from where you clicked and closes on the new page.
  let point = { x: innerWidth / 2, y: innerHeight / 2 };
  addEventListener('pointerdown', (e) => { point = { x: e.clientX, y: e.clientY }; }, { passive: true });
  setTransition({
    leave: (c) => gsap.timeline()
      .call(() => document.documentElement.classList.add('in-transit'))
      .set(c, { autoAlpha: 1 })
      .fromTo(c.querySelector('.curtain__panel'),
        { clipPath: `circle(0% at ${point.x}px ${point.y}px)` },
        { clipPath: `circle(150% at ${point.x}px ${point.y}px)`, duration: 0.85, ease: ease.inOut }),
    enter: (c) => gsap.timeline()
      .call(() => document.documentElement.classList.add('in-transit')) // the swap replaced <html> classes
      .to(c.querySelector('.curtain__panel'), { clipPath: 'circle(0% at 50% 50%)', duration: 0.85, ease: ease.inOut })
      .set(c, { autoAlpha: 0 })
      .call(() => document.documentElement.classList.remove('in-transit')),
  });

  startClocks();
  dilateIntro();
  frameStepsAside();
  imageMotion();
  buttonFill();
  millerStage();
}

// Hero words are visible from the first paint (they are the LCP) and settle from stretched to
// their resting width: time dilating back to normal.
function dilateIntro() {
  let navigated = false;
  document.addEventListener('astro:before-preparation', () => { navigated = true; });
  onPage(({ intro }) => {
    const els = document.querySelectorAll<HTMLElement>('[data-dilate]');
    const hidden = !!document.getElementById('loader') && !document.documentElement.classList.contains('no-loader');
    if (!els.length || prefersReducedMotion() || isMobile() || (!hidden && !navigated)) return; // only behind a loader or curtain
    const rest = getComputedStyle(els[0]).fontVariationSettings;
    gsap.set(els, { fontVariationSettings: '"wdth" 62' }); // narrower than rest: never grows past the first paint (LCP, CLS)
    intro.add(gsap.to(els, { fontVariationSettings: rest, duration: 1.6, ease: ease.out, stagger: 0.12 }), 0);
  });
}

// The ships and the watch move the way they do in the story. Idle loops run on the GSAP clock and
// pause off screen; scrubbed ones follow the reader. Nothing moves under reduced motion.
const MORSE_EUREKA = '. ..- .-. . -.- .-'; // dot: short pause before the next tick, dash: long

function imageMotion() {
  onPage(() => {
    if (prefersReducedMotion()) return;
    const whileVisible = (el: Element, anim: gsap.core.Animation) => {
      anim.pause();
      ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? anim.play() : anim.pause()) });
    };

    // The Endurance turns to make its own gravity.
    document.querySelectorAll<HTMLElement>('[data-spin]').forEach((el) => {
      whileVisible(el, gsap.to(el, { rotate: 360, duration: parseFloat(el.dataset.spin || '90'), ease: 'none', repeat: -1 }));
    });

    // Approaching Saturn, the ring drifts into the sphere and shrinks away.
    const ring = document.querySelector<HTMLElement>('[data-approach]');
    const door = document.querySelector<HTMLElement>('[data-lens="door"]');
    if (ring && door) {
      const to = () => {
        const a = ring.getBoundingClientRect(), b = door.getBoundingClientRect();
        return { x: b.left + b.width / 2 - (a.left + a.width / 2), y: b.top + b.height / 2 - (a.top + a.height / 2) };
      };
      gsap.timeline({ scrollTrigger: { trigger: ring.parentElement, start: 'top 60%', end: 'bottom 40%', scrub: 1, invalidateOnRefresh: true } })
        .fromTo(ring, { x: 0, y: 0, scale: 1, rotate: 0 }, { x: () => to().x, y: () => to().y, scale: 0.15, rotate: 140, ease: 'power2.in' })
        .to(ring, { autoAlpha: 0, duration: 0.15 }, 0.85);
    }

    // Docking: the Ranger turns to match the tumbling ship while you read about it.
    document.querySelectorAll<HTMLElement>('[data-spin-scrub]').forEach((el) => {
      gsap.fromTo(el, { rotate: -9 }, { rotate: 9, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    fallSequence();

    // Murph's watch: the second hand ticks EUREKA, a short wait for a dot and a long one for a dash.
    const hand = document.querySelector<SVGElement>('[data-morse-hand]');
    if (hand) {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6 });
      let angle = 0;
      for (const ch of MORSE_EUREKA) {
        if (ch === ' ') { tl.to({}, { duration: 0.6 }); continue; }
        angle += 6;
        tl.to(hand, { rotate: angle, svgOrigin: '50 50', duration: 0.12, ease: 'back.out(3)' });
        tl.to({}, { duration: ch === '.' ? 0.22 : 0.7 });
      }
      whileVisible(hand, tl);
    }
  });
}

// Falling into Gargantua. One scrubbed timeline over the chapter: each real frame takes over from
// the last by pushing through it (the old one swells and burns out, the new one settles in from
// stretched), ending in the tesseract, whose nested copies then zoom forever at rest.
// The handover to the tesseract sits at 40% of the chapter, where the Earth clock starts to rewind.
function fallSequence() {
  const stage = document.querySelector<HTMLElement>('[data-fall]');
  if (!stage) return;
  const L = (k: string) => stage.querySelector<HTMLElement>(`[data-fall-layer="${k}"]`)!;
  const [approach, disk, horizon, ring, tess] = ['approach', 'disk', 'horizon', 'ring', 'tess'].map(L);
  const label = stage.querySelector<HTMLElement>('[data-fall-label]');
  const credit = stage.querySelector<HTMLElement>('[data-fall-credit]');
  const layers = [approach, disk, horizon, ring, tess];
  const HANDOVERS = [0.13, 0.24, 0.33, 0.39]; // progress where each frame takes over, matching the timeline below

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: stage.closest('section'), start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true,
      onUpdate: (s) => {
        // The caption names the frame on screen and credits it (read from the scroll, not the lagging scrub).
        const top = layers[HANDOVERS.filter((h) => s.progress >= h).length];
        if (label && label.textContent !== top.dataset.caption) label.textContent = top.dataset.caption!;
        if (credit && credit.textContent !== top.dataset.credit) credit.textContent = top.dataset.credit!;
        stage.classList.toggle('is-inside', s.progress > 0.4);
      },
    },
  });
  // 0 → 0.14: the approach, Gargantua growing in the window.
  tl.fromTo(approach, { scale: 0.85 }, { scale: 2.4, duration: 0.18 }, 0)
    .to(approach, { autoAlpha: 0, duration: 0.05 }, 0.13)
    // 0.12 → 0.24: through the disk, light smeared into bands.
    .fromTo(disk, { autoAlpha: 0, scale: 1.4, yPercent: 12 }, { autoAlpha: 1, scale: 1, yPercent: 0, duration: 0.08 }, 0.12)
    .to(disk, { scale: 1.6, yPercent: -18, duration: 0.1 }, 0.2)
    .to(disk, { autoAlpha: 0, duration: 0.04 }, 0.24)
    // 0.24 → 0.33: the sky folds into a bowl over the horizon.
    .fromTo(horizon, { autoAlpha: 0, scale: 1.3, rotate: -4 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.07 }, 0.24)
    .to(horizon, { scale: 1.35, yPercent: 10, duration: 0.08 }, 0.3)
    .to(horizon, { autoAlpha: 0, duration: 0.03 }, 0.33)
    // 0.33 → 0.4: past the horizon, the ring pulls away and everything goes dark.
    .fromTo(ring, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1.15, duration: 0.04 }, 0.33)
    .to(ring, { scale: 2.6, autoAlpha: 0, duration: 0.05 }, 0.36)
    // 0.4 → 1: the tesseract opens out of the dark.
    .fromTo(tess, { autoAlpha: 0, scale: 0.6, clipPath: 'inset(45% 45% 45% 45%)' }, { autoAlpha: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.1 }, 0.4)
    .to(tess, { scale: 1.12, duration: 0.5 }, 0.5);

  // At rest inside, the corridor keeps falling: zoom by one nesting step and loop seamlessly.
  const zoom = stage.querySelector<HTMLElement>('[data-tess]');
  if (zoom) {
    const loop = gsap.fromTo(zoom, { scale: 1 }, { scale: 1 / 0.55, duration: 9, ease: 'none', repeat: -1, paused: true });
    ScrollTrigger.create({ trigger: stage.closest('section'), start: '40% top', end: 'bottom top', onToggle: (s) => (s.isActive ? loop.play() : loop.pause()) });
  }
}

// The header slides away while reading down and returns on the way up.
function frameStepsAside() {
  let last = 0;
  onScroll(({ y }) => {
    if (Math.abs(y - last) < 4) return;
    document.documentElement.classList.toggle('frame-away', y > 160 && y > last);
    document.documentElement.classList.toggle('is-scrolled', y > 40);
    last = y;
  });
}

// CTAs: the other world floods in from the side the pointer entered.
function buttonFill() {
  onPage(() => {
    if (isTouch() || prefersReducedMotion()) return;
    const off: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>('[data-fill]').forEach((btn) => {
      const fill = btn.querySelector<HTMLElement>('.btn__fill');
      if (!fill) return;
      const at = (e: PointerEvent) => { const r = btn.getBoundingClientRect(); return `${e.clientX - r.left}px ${e.clientY - r.top}px`; };
      let closed = true;
      const open = (o: string) => {
        if (closed) gsap.set(fill, { clipPath: `circle(0% at ${o})` });
        closed = false;
        btn.classList.add('is-filled');
        gsap.to(fill, { clipPath: `circle(150% at ${o})`, duration: 0.6, ease: ease.soft, overwrite: true });
      };
      const close = (o: string) => {
        btn.classList.remove('is-filled');
        gsap.to(fill, { clipPath: `circle(0% at ${o})`, duration: 0.5, ease: ease.soft, overwrite: true, onComplete: () => { closed = true; } });
      };
      const enter = (e: PointerEvent) => open(at(e));
      const leave = (e: PointerEvent) => close(at(e));
      const focus = () => btn.matches(':focus-visible') && open('50% 50%');
      const blur = () => close('50% 50%');
      btn.addEventListener('pointerenter', enter); btn.addEventListener('pointerleave', leave);
      btn.addEventListener('focus', focus); btn.addEventListener('blur', blur);
      off.push(() => {
        btn.removeEventListener('pointerenter', enter); btn.removeEventListener('pointerleave', leave);
        btn.removeEventListener('focus', focus); btn.removeEventListener('blur', blur);
      });
    });
    return () => off.forEach((f) => f());
  });
}

// Miller's planet: the dial crawls, the year counter races, the wave stands up.
function millerStage() {
  onPage(() => {
    const stage = document.querySelector<HTMLElement>('[data-miller]');
    if (!stage) return;
    const hand = stage.querySelectorAll<HTMLElement>('[data-hand]');
    const hours = stage.querySelector<HTMLElement>('[data-stage="hours"]');
    const year = stage.querySelector<HTMLElement>('[data-stage="year"]');
    const age = stage.querySelector<HTMLElement>('[data-stage="age"]');
    const waves = stage.querySelectorAll<HTMLElement>('[data-wave]');
    const reduced = prefersReducedMotion();
    const set = (el: HTMLElement | null, t: string) => { if (el && el.textContent !== t) el.textContent = t; };
    return onClocks((s) => {
      if (s.chapter < 2 || s.chapter > 5) return; // far from Miller: nothing to move
      if (s.chapter < 3) { s = { ...s, ship: 2, earth: 2, progress: 0 }; }
      else if (s.chapter > 3) { s = { ...s, progress: 1 }; }
      const h = (s.ship - 2) * 8766;
      const mins = Math.round(h * 60);
      set(hours, `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')} m`);
      set(year, `Year ${Math.floor(s.earth)}`);
      set(age, `Murph is ${Math.floor(10 + s.earth)}`);
      // Minute hand: one turn per hour. Hour hand: one turn per 12 hours.
      hand.forEach((el) => gsap.set(el, { rotate: (el.dataset.hand === 'min' ? 360 : 30) * h }));
      if (reduced) return;
      const p = s.progress;
      const rise = gsap.utils.clamp(0, 1, (p - 0.35) / 0.4) - gsap.utils.clamp(0, 1, (p - 0.86) / 0.14);
      waves.forEach((el) => gsap.set(el, { yPercent: 100 - rise * 100 }));
    });
  });
}
