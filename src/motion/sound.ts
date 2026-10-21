// The score: a slow pipe-organ pad, made here with Web Audio (no recording, nothing licensed).
// Each chapter has its own chord and the pad drifts between them as you read. On Miller's planet a
// clock ticks every 1.25 seconds, and every tick is a day on Earth (1 hour there = 7 years here).
// Off until the visitor turns it on; browsers only allow sound after a click or a key press.
import { gsap } from 'gsap';
import { onClocks } from './clocks';
import { onPage } from '../engine';

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);
// Hero and Earth, NASA, wormhole, Miller, Mann, Gargantua, Murph, Cooper Station.
const CHORDS = [
  [45, 52, 57, 60, 64], // A minor: the farm
  [41, 48, 57, 60, 64], // F major 7: the secret base
  [48, 55, 62, 64, 67], // C, open: the door near Saturn
  [45, 52, 59, 60, 64], // A minor, add 9: the water world
  [40, 47, 55, 59, 62], // E minor 7: the ice
  [38, 45, 50, 57, 60, 64], // D minor, low pedal: the black hole
  [41, 48, 53, 57, 60, 67], // F, add 9: Eureka
  [45, 52, 57, 61, 64, 69], // A major: home, at last
];
const LEVEL = 0.2;
const TICK = 1.25; // seconds per Earth day on Miller's planet

let ctx: AudioContext | null = null;
let master: GainNode, bus: GainNode;
let voices: { gain: GainNode; oscs: OscillatorNode[] }[] = [];
let chord = -1, chapter = 0, on = false, ticking = false, nextTick = 0;

function organ(c: AudioContext) {
  // Drawbars 16', 8', 4', 2 2/3', 2', 1 1/3': a church organ's even, breathy stack.
  const amps = [0, 0.6, 1, 0.45, 0.32, 0.2, 0.12, 0, 0.08];
  return c.createPeriodicWave(new Float32Array(amps.length), Float32Array.from(amps));
}

function hall(c: AudioContext) {
  // A cathedral-length tail: decaying stereo noise as the impulse response.
  const len = c.sampleRate * 6, ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3.2;
  }
  const conv = c.createConvolver();
  conv.buffer = ir;
  return conv;
}

function build() {
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0;
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 1900;
  bus = ctx.createGain();
  const wet = ctx.createGain(), dry = ctx.createGain(), verb = hall(ctx);
  wet.gain.value = 0.7; dry.gain.value = 0.45;
  bus.connect(lowpass);
  lowpass.connect(dry).connect(master);
  lowpass.connect(verb).connect(wet).connect(master);
  master.connect(ctx.destination);
  // A slow swell, like air moving through the pipes.
  const lfo = ctx.createOscillator(), depth = ctx.createGain();
  lfo.frequency.value = 0.07; depth.gain.value = 0.18;
  lfo.connect(depth).connect(bus.gain);
  lfo.start();
}

function play(index: number) {
  if (!ctx || index === chord) return;
  chord = index;
  const c = ctx, now = c.currentTime, wave = organ(c);
  for (const v of voices) {
    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setTargetAtTime(0, now, 1.6);
    v.oscs.forEach((o) => o.stop(now + 9));
  }
  const notes = CHORDS[Math.max(0, Math.min(CHORDS.length - 1, index))];
  voices = [{ gain: c.createGain(), oscs: [] }];
  const voice = voices[0];
  voice.gain.gain.value = 0;
  voice.gain.gain.setTargetAtTime(1 / notes.length, now, 2.2);
  voice.gain.connect(bus);
  for (const n of notes) for (const cents of [-4, 3]) {
    const o = c.createOscillator();
    o.setPeriodicWave(wave);
    o.frequency.value = midi(n);
    o.detune.value = cents;
    const g = c.createGain();
    g.gain.value = n < 44 ? 0.9 : 0.5; // the pedal note carries
    o.connect(g).connect(voice.gain);
    o.start(now);
    voice.oscs.push(o);
  }
}

// One tick: a dry, close click, like a watch held to the ear.
function tickAt(when: number) {
  const c = ctx!;
  const buf = c.createBuffer(1, c.sampleRate * 0.03, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 6;
  const src = c.createBufferSource(), band = c.createBiquadFilter(), g = c.createGain();
  src.buffer = buf;
  band.type = 'bandpass'; band.frequency.value = 3200; band.Q.value = 4;
  g.gain.value = 0.9;
  src.connect(band).connect(g).connect(master);
  src.start(when);
}
// Ticks are booked on the audio clock a moment ahead, checked from the one GSAP ticker.
gsap.ticker.add(() => {
  if (!ticking || !ctx) return;
  if (nextTick < ctx.currentTime) nextTick = ctx.currentTime + 0.05;
  while (nextTick < ctx.currentTime + 0.2) { tickAt(nextTick); nextTick += TICK; }
});
const setTicking = (yes: boolean) => { ticking = yes && on; };

function setOn(next: boolean) {
  on = next;
  try { sessionStorage.setItem('sound', on ? 'on' : 'off'); } catch { /* private mode: no memory */ }
  document.querySelectorAll<HTMLButtonElement>('[data-sound]').forEach((b) => b.setAttribute('aria-pressed', String(on)));
  document.documentElement.classList.toggle('sound-on', on);
  if (on) {
    if (!ctx) build();
    void ctx!.resume();
    play(chapter);
    master.gain.cancelScheduledValues(ctx!.currentTime);
    master.gain.setTargetAtTime(LEVEL, ctx!.currentTime, 1.2);
    setTicking(chapter === 3);
  } else if (ctx) {
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    setTicking(false);
  }
}

export function setupSound() {
  if (!('AudioContext' in window)) return;
  // Turned on earlier in this visit: pick up again on the first click or key, as browsers require.
  let wanted = false;
  try { wanted = sessionStorage.getItem('sound') === 'on'; } catch { /* ignore */ }
  if (wanted) {
    const resume = () => { if (!on) setOn(true); };
    addEventListener('pointerdown', resume, { once: true });
    addEventListener('keydown', resume, { once: true });
  }
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !on) return;
    master.gain.setTargetAtTime(document.hidden ? 0 : LEVEL, ctx.currentTime, 0.4);
  });

  onPage(() => {
    const buttons = document.querySelectorAll<HTMLButtonElement>('[data-sound]');
    const toggle = () => setOn(!on);
    buttons.forEach((b) => { b.hidden = false; b.setAttribute('aria-pressed', String(on)); b.addEventListener('click', toggle); });
    const off = onClocks((s) => {
      const next = Math.max(0, s.chapter);
      if (next === chapter) return;
      chapter = next;
      if (!on) return;
      play(chapter);
      setTicking(chapter === 3);
    });
    return () => { off(); buttons.forEach((b) => b.removeEventListener('click', toggle)); };
  });
}
