// Global motion for Two Clocks: runs once on the client, before the first page initializes.
import { gsap } from 'gsap';
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
