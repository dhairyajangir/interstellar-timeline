// One shared OGL canvas with a fullscreen shader layer (webgl.md "Fullscreen layer").
// This site has no image planes, so the DOM-plane half of the module is left out; mountGL and
// unmountGL stay as no-ops so the engine core keeps its contract.
// Disabled under reduced motion, without WebGL, or with Save-Data; CSS fallbacks then paint the sky.
import { Renderer, Camera, Transform, Program, Mesh, Vec2, Triangle } from 'ogl';
import { gsap } from 'gsap';
import { scrollState } from '../scroll';
import { isMobile, prefersReducedMotion } from '../env';

let renderer: Renderer | null = null;
let camera: Camera;
let vw = 0, vh = 0, velocity = 0;
let bg: { scene: Transform; program: Program } | null = null;
const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

export function glSupported() {
  if (prefersReducedMotion() || isMobile()) return false; // phones: CSS sky, spare the battery and the frame rate
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return false;
  try { return !!document.createElement('canvas').getContext('webgl'); } catch { return false; }
}

export function initGL() {
  if (renderer || !glSupported()) return;
  // ponytail: DPR capped at 1.5 for a full-screen fragment shader; raise to 2 if it looks soft.
  renderer = new Renderer({ dpr: Math.min(devicePixelRatio, 1.5), alpha: false, antialias: false });
  const gl = renderer.gl;
  gl.canvas.classList.add('gl-canvas');
  gl.canvas.setAttribute('aria-hidden', 'true');
  (document.getElementById('gl') || document.body).appendChild(gl.canvas);
  camera = new Camera(gl);
  resize();
  addEventListener('resize', resize);
  addEventListener('pointermove', (e) => { mouse.tx = e.clientX / vw; mouse.ty = 1 - e.clientY / vh; }, { passive: true });
  gsap.ticker.add(render);
  if (pending) { const p = pending; pending = null; build(p.fragment, p.uniforms); }
}

// The sky can be registered before GL starts (GL starts after the intro, so it never delays it).
let pending: { fragment: string; uniforms: Record<string, { value: unknown }> } | null = null;

/**
 * Fullscreen shader layer. Built-in uniforms: uTime (s), uResolution (px), uScroll (0..1),
 * uScrollY (px), uVelocity (smoothed), uMouse (0..1, smoothed). Varying: vUv.
 * Returns the Program (tween its uniforms), or null when GL is off.
 */
export function setBackground(fragment: string, uniforms: Record<string, { value: unknown }> = {}) {
  if (!glSupported()) return null;
  if (renderer) build(fragment, uniforms);
  else pending = { fragment, uniforms };
  return uniforms; // the same objects the program reads, so callers can write them before GL starts
}

function build(fragment: string, uniforms: Record<string, { value: unknown }>) {
  const gl = renderer!.gl;
  const program = new Program(gl, {
    vertex: `attribute vec2 uv; attribute vec2 position; varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`,
    fragment,
    uniforms: {
      uTime: { value: 0 }, uResolution: { value: new Vec2(vw, vh) }, uScroll: { value: 0 }, uScrollY: { value: 0 },
      uVelocity: { value: 0 }, uMouse: { value: new Vec2(0.5, 0.5) }, ...uniforms,
    },
    depthTest: false,
    depthWrite: false,
  });
  const scene = new Transform();
  new Mesh(gl, { geometry: new Triangle(gl), program }).setParent(scene);
  bg = { scene, program };
}
export function clearBackground() { bg = null; }
export function mountGL(_root?: ParentNode) {}
export function unmountGL() {}
export function hideGL(_duration = 0.6) {}

function resize() {
  if (!renderer) return;
  vw = innerWidth; vh = innerHeight;
  renderer.setSize(vw, vh);
}

// Frame governor: a full-screen shader must never cost the page its frame rate. After the loader,
// sample frame intervals; if the median is slower than ~30 fps, halve the resolution, and if it is
// still slow, switch GL off and let the CSS sky take over (same as reduced motion / no WebGL).
const SLOW_MS = 34;
const SAMPLE = 12;
// First frame: time one synchronous draw. A software renderer shows up here immediately.
let probed = false;
function probe(t: number) {
  probed = true;
  const t0 = performance.now();
  draw(t);
  renderer!.gl.finish();
  const cost = performance.now() - t0;
  if (cost > 40) return killGL();
  if (cost > 12) { dpr = 0.5; renderer!.dpr = dpr; resize(); }
  renderer!.gl.canvas.classList.add('is-live');
  document.documentElement.classList.add('gl-on');
}
let samples: number[] = [];
let lastT = 0;
let dpr = 0;
function govern(now: number) {
  if (lastT) samples.push(now - lastT);
  lastT = now;
  if (samples.length < SAMPLE) return;
  const median = samples.sort((a, b) => a - b)[SAMPLE >> 1];
  samples = [];
  if (median < SLOW_MS || !renderer) return;
  if (dpr > 0.5) { dpr = 0.5; renderer.dpr = dpr; resize(); return; }
  killGL();
}
function killGL() {
  gsap.ticker.remove(render);
  removeEventListener('resize', resize);
  renderer?.gl.getExtension('WEBGL_lose_context')?.loseContext();
  renderer?.gl.canvas.remove();
  renderer = null;
  bg = null;
  document.documentElement.classList.remove('gl-on');
}

// The loader covers the screen: no point drawing the sky under it.
function loaderCovers() {
  const l = document.getElementById('loader');
  return !!l && !l.hidden && !l.classList.contains('is-exiting');
}

function render(t: number) {
  if (!renderer || !bg || document.hidden) { lastT = 0; return; }
  if (loaderCovers()) return;
  if (!dpr) dpr = renderer.dpr;
  govern(performance.now());
  if (!renderer) return;
  if (!probed) return probe(t);
  draw(t);
}

function draw(t: number) {
  if (!renderer || !bg) return;
  const target = Math.max(-40, Math.min(40, scrollState().velocity));
  velocity += (target - velocity) * 0.12;
  mouse.x += (mouse.tx - mouse.x) * 0.08;
  mouse.y += (mouse.ty - mouse.y) * 0.08;
  const u = bg.program.uniforms;
  const s = scrollState();
  u.uTime.value = t; u.uResolution.value.set(vw, vh); u.uScroll.value = s.progress; u.uScrollY.value = s.y;
  u.uVelocity.value = velocity; u.uMouse.value.set(mouse.x, mouse.y);
  renderer.render({ scene: bg.scene, camera });
}
