// The driver: one variable (where you are in the story) → both clocks, the rails, the page tone,
// the sky shader and the Miller stage. Everything that carries the concept reads from here.
//
// Markup it reads:
//   [data-chapter="i"]        a chapter section (index into `chapters`)
//   [data-clock-span]         optional: the part of a chapter the clocks run across
//                             ("sticky" = a sticky track; progress over its scroll length)
//   [data-tone="void|dust|split"]  what is under the header and rails while this section is in view
//   [data-lens="door|hole"]   boxes the sky shader draws the wormhole / Gargantua into
//   [data-clock="ship|earth|murph|earth-label"], [data-ticks="ship|earth"]  the readouts
//   [data-clocks="lost"]      the 404: clocks read as lost
import { gsap } from 'gsap';
import { onPage, onScroll, setBackground, prefersReducedMotion } from '../engine';
import { chapters, palette } from '../data/site';
import { SKY } from './sky';

type Override = { earth: number; ship: number; rate: number; est?: boolean } | null;

const MIN_PER_YEAR = 525960;
const TICK_PX_PER_YEAR = 600; // ruler travel per year of clock time
const IDLE_PX_PER_S = 7; // ship ruler drift at rest; Earth drifts at this × its rate
const MAX_IDLE_RATE = 36; // clamp the visible Earth idle speed (Miller is 61,320×)

const hex = (h: string) => {
  const n = parseInt(h.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const pad = (n: number, w: number) => String(n).padStart(w, '0');

export type ClockState = {
  earth: number; ship: number; rate: number; est: boolean;
  anyYear: boolean; warp: number; chapter: number; progress: number;
};
const state: ClockState = { earth: 0, ship: 0, rate: 1, est: false, anyYear: false, warp: 0, chapter: -1, progress: 0 };
const listeners = new Set<(s: ClockState) => void>();
/** Page modules (the Miller stage) subscribe to the same state the rails show. */
export const onClocks = (fn: (s: ClockState) => void) => { listeners.add(fn); fn(state); return () => listeners.delete(fn); };

let override: Override = null;
/** The /time/ page drives the clocks from its slider; null returns control to scroll. */
export function setClockOverride(o: Override) { override = o; read(); }

let sections: HTMLElement[] = [];
let door: HTMLElement | null = null;
let hole: HTMLElement | null = null;
let lost = false;
let out: Record<string, HTMLElement[]> = {};
const ticks = { ship: [] as HTMLElement[], earth: [] as HTMLElement[] };

// Where in its chapter the reader is: 0 when the section (or its clock span) starts, 1 at its end.
function progressOf(sec: HTMLElement, probe: number) {
  const span = sec.querySelector<HTMLElement>('[data-clock-span]') ?? sec;
  const r = span.getBoundingClientRect();
  if (span.dataset.clockSpan === 'sticky') return clamp01(-r.top / Math.max(1, r.height - innerHeight));
  return clamp01((probe - r.top) / Math.max(1, r.height));
}

function read() {
  const probe = innerHeight * 0.5;
  let i = -1;
  let p = 0;
  for (const sec of sections) {
    const r = sec.getBoundingClientRect();
    if (r.top <= probe) { i = +sec.dataset.chapter!; p = progressOf(sec, probe); }
  }
  state.chapter = i;
  state.progress = p;
  if (override) {
    Object.assign(state, { earth: override.earth, ship: override.ship, rate: override.rate, est: !!override.est, anyYear: false });
  } else if (i < 0) {
    Object.assign(state, { earth: 0, ship: 0, rate: 1, est: false, anyYear: false });
  } else {
    const c = chapters[i];
    state.rate = c.rate;
    state.est = !!c.to.est;
    state.anyYear = false;
    if (c.id === 'gargantua') {
      // First the slingshot (51 years at home), then the tesseract: any year of Murph's room.
      if (p < 0.4) {
        const t = smooth(p / 0.4);
        state.earth = lerp(c.from.earth, c.from.earth + 51, t);
        state.ship = c.from.ship;
        state.rate = MAX_IDLE_RATE;
      } else {
        state.anyYear = true;
        state.earth = lerp(0, c.to.earth, smooth((p - 0.4) / 0.6));
        state.ship = c.to.ship;
      }
    } else {
      const t = c.id === 'miller' ? p : smooth(p);
      state.earth = lerp(c.from.earth, c.to.earth, t);
      state.ship = lerp(c.from.ship, c.to.ship, t);
    }
  }
  state.warp = override ? 0.25 : i >= 0 ? ({ miller: 0.9, gargantua: p < 0.4 ? 1 : 0.35 } as Record<string, number>)[chapters[i].id] ?? 0 : 0;
  render();
  toneDirty = true; // hit-testing is batched in the ticker, not run per scroll event
  listeners.forEach((fn) => fn(state));
}

function shipText(years: number) {
  let m = Math.round(years * MIN_PER_YEAR);
  const y = Math.floor(m / MIN_PER_YEAR); m -= y * MIN_PER_YEAR;
  const d = Math.floor(m / 1440); m -= d * 1440;
  const h = Math.floor(m / 60); m -= h * 60;
  return `${y} yr ${pad(d, 3)} d\n${pad(h, 2)} h ${pad(m, 2)} m`;
}
function earthText(years: number) {
  const y = Math.floor(years);
  const mo = Math.floor((years - y) * 12);
  return `Year ${y}\n${pad(mo, 2)} mo`;
}

function set(key: string, text: string) {
  for (const el of out[key] ?? []) if (el.textContent !== text) el.textContent = text;
}

function render() {
  const approx = state.est ? '≈ ' : '';
  if (lost) {
    set('ship', 'lost'); set('earth', 'lost'); set('murph', 'Murph, somewhere'); set('earth-label', 'Earth clock');
    return;
  }
  set('ship', shipText(state.ship));
  set('earth', approx + earthText(state.earth));
  set('murph', `Murph ${approx}${Math.floor(10 + state.earth)}`);
  set('earth-label', state.anyYear ? 'Murph’s room, any year' : 'Earth clock');
  document.documentElement.classList.toggle('any-year', state.anyYear);
  // The rail portrait: Murph grows up while Cooper doesn't. The film recasts her as a scientist in her thirties.
  document.documentElement.classList.toggle('murph-grown', 10 + state.earth >= 30);
}

// Header and rail parts ([data-ink]) take their ink from whatever world is actually under them.
// Plain geometry, not hit-testing (elementsFromPoint forced a layout every few frames and cost
// most of the scroll budget): the last [data-tone] box in document order containing the part's
// centre wins, so nested halves and photos beat their section; 'split' means the void half.
let inks: { el: HTMLElement; x: number; y: number }[] = [];
let toned: HTMLElement[] = [];
function measureInks() {
  inks = [...document.querySelectorAll<HTMLElement>('[data-ink]')].flatMap((el) => {
    const r = el.getBoundingClientRect();
    return r.width ? [{ el, x: r.left + r.width / 2, y: r.top + r.height / 2 }] : [];
  });
}
function tone() {
  const boxes = toned.map((el) => [el.dataset.tone, el.getBoundingClientRect()] as const);
  for (const { el, x, y } of inks) {
    let t = 'void';
    for (const [tn, r] of boxes) if (x >= r.left && x < r.right && y >= r.top && y < r.bottom) t = tn === 'dust' ? 'dust' : 'void';
    if (el.dataset.on !== t) el.dataset.on = t;
  }
  const frame = document.querySelector<HTMLElement>('.frame');
  const side = (sel: string) => (frame?.querySelector<HTMLElement>(sel)?.dataset.on === 'dust' ? 'var(--dust)' : 'var(--void)');
  frame?.style.setProperty('--g-l', side('.frame__name'));
  frame?.style.setProperty('--g-r', side('.frame__nav'));
}

// The rails never stop: each ruler keeps slipping at its clock's local rate.
const idle = { ship: 0, earth: 0 };
const drawn = { ship: NaN, earth: NaN };
let toneDirty = true;
let frame = 0;
function tick(_t: number, dt: number) {
  if (toneDirty && ++frame % 4 === 0) { toneDirty = false; tone(); }
  if (!prefersReducedMotion()) {
    const s = dt / 1000;
    idle.ship += s * IDLE_PX_PER_S;
    idle.earth += s * IDLE_PX_PER_S * Math.max(-MAX_IDLE_RATE / 4, Math.min(MAX_IDLE_RATE, state.rate));
  }
  const loader = document.getElementById('loader');
  if (loader && !loader.hidden && !loader.classList.contains('is-exiting')) return;
  // Write only when the ruler moved a whole pixel: at rest that is a few frames a second.
  const shipY = Math.round(state.ship * TICK_PX_PER_YEAR + idle.ship) % 96;
  const earthY = Math.round(state.earth * TICK_PX_PER_YEAR + idle.earth) % 96;
  if (shipY !== drawn.ship) { drawn.ship = shipY; for (const el of ticks.ship) el.style.transform = `translate(0, ${-((shipY + 96) % 96)}px)`; }
  if (earthY !== drawn.earth) { drawn.earth = earthY; for (const el of ticks.earth) el.style.transform = `translate(0, ${-((earthY + 96) % 96)}px)`; }
  if (program && document.documentElement.classList.contains('gl-on')) {
    warp += (state.warp - warp) * 0.06;
    program.uWarp.value = warp;
    lensTo(door, program.uDoor.value as number[]);
    lensTo(hole, program.uHole.value as number[]);
  }
}

let program: ReturnType<typeof setBackground> = null;
let warp = 0;
function lensTo(el: HTMLElement | null, v: number[]) {
  if (!el) { v[2] = 0; return; }
  const r = el.getBoundingClientRect();
  const visible = r.bottom > -r.height && r.top < innerHeight + r.height;
  v[0] = r.left + r.width / 2;
  v[1] = r.top + r.height / 2;
  v[2] = visible ? (r.width / 2) * parseFloat(el.dataset.lensScale || '1') : 0;
}

export function startClocks() {
  program = setBackground(SKY, {
    uWarp: { value: 0 },
    uDoor: { value: [0, 0, 0] },
    uHole: { value: [0, 0, 0] },
    uStar: { value: hex(palette.star) },
    uDust: { value: hex(palette.dust) },
  });
  // Rails persist across pages (transition:persist), so collect readouts on every page.
  onScroll(read);
  addEventListener('resize', () => { measureInks(); read(); });
  gsap.ticker.add(tick);
  onPage(() => {
    sections = [...document.querySelectorAll<HTMLElement>('[data-chapter]')];
    door = document.querySelector('[data-lens="door"]');
    hole = document.querySelector('[data-lens="hole"]');
    lost = !!document.querySelector('[data-clocks="lost"]');
    toned = [...document.querySelectorAll<HTMLElement>('[data-tone]')];
    measureInks();
    out = {};
    document.querySelectorAll<HTMLElement>('[data-clock]').forEach((el) => (out[el.dataset.clock!] ??= []).push(el));
    ticks.ship = [...document.querySelectorAll<HTMLElement>('[data-ticks="ship"]')];
    ticks.earth = [...document.querySelectorAll<HTMLElement>('[data-ticks="earth"]')];
    read();
    return () => { override = null; sections = []; toned = []; door = hole = null; };
  });
}
