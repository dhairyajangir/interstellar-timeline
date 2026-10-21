// The flight through the wormhole, live. Every pixel is a light ray traced backward through the
// film's own metric (src/lib/wormhole.ts): the ray map in lut.png says, for this camera position and
// this ray angle, which of the two skies the ray reaches and in which direction. Scroll moves the
// camera along the axis, so the sphere swells, the Milky Way bends round its rim (the Einstein ring),
// the far galaxy fills the view, and at the end the camera turns to see home inside a sphere.
// Needs WebGL2; without it (or under reduced motion) the page keeps the ray-traced stills.
import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isMobile } from '../engine';
import { FOV, PATCHES, flight, patchFrame, sAt, type Patch } from '../lib/wormhole';

const COLS = 768, ROWS = 192; // must match scripts/wormhole.mts

const fragment = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 color;
uniform sampler2D uLut, uNear, uFar, uSaturn, uGalaxy, uDeep;
uniform vec2 uRes;
uniform float uRow, uYaw, uPitch, uTan, uTime, uShift;
uniform vec3 uC[3], uR[3], uU[3];
uniform vec4 uP[3]; // tan(half width), aspect, side, gain
uniform vec3 uDisk; // Saturn's night side: centre and radius in the picture (see Patch.disk)
const float PI = 3.14159265;
const float PM = 4.0 * PI + 0.001;
const vec2 SIZE = vec2(${COLS}.0, ${ROWS}.0);

float lut(vec2 cr) {
  vec4 t = texelFetch(uLut, ivec2(cr), 0);
  return (t.r * 65280.0 + t.g * 255.0) / 65535.0 * 2.0 * PM - PM;
}
// Bilinear inside one side; nearest where the four rays split between the two skies.
float phiAt(vec2 cr) {
  vec2 c0 = min(floor(cr), SIZE - 2.0), f = cr - c0;
  float a = lut(c0), b = lut(c0 + vec2(1, 0)), c = lut(c0 + vec2(0, 1)), d = lut(c0 + vec2(1, 1));
  if ((a > 0.0 && b > 0.0 && c > 0.0 && d > 0.0) || (a < 0.0 && b < 0.0 && c < 0.0 && d < 0.0))
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  return f.y > 0.5 ? (f.x > 0.5 ? d : c) : (f.x > 0.5 ? b : a);
}
vec3 equirect(sampler2D t, vec3 dir, float side) {
  vec2 uv = vec2(0.5 - atan(dir.x, -side * dir.z) / (2.0 * PI), 0.5 - asin(clamp(dir.y, -1.0, 1.0)) / PI);
  vec2 dx = dFdx(uv), dy = dFdy(uv);
  dx.x -= round(dx.x); dy.x -= round(dy.x); // no seam where the longitude wraps
  return textureGrad(t, uv, dx, dy).rgb;
}
vec3 screen(vec3 a, vec3 b) { return 1.0 - (1.0 - a) * (1.0 - b); }
vec3 picture(sampler2D t, int i, vec3 dir, float side) {
  vec4 p = uP[i];
  float q = dot(dir, uC[i]);
  vec2 xy = vec2(dot(dir, uR[i]), dot(dir, uU[i]) * p.y) / (max(q, 1e-4) * p.x);
  vec2 uv = xy * vec2(0.5, -0.5) + 0.5;
  vec3 c = textureGrad(t, uv, dFdx(uv), dFdy(uv)).rgb;
  float inside = step(0.0, q) * step(abs(xy.x), 1.0) * step(abs(xy.y), 1.0) * step(0.5, p.z * side);
  return c * p.w * inside;
}
float disk(int i, vec3 dir, float side) {
  vec4 p = uP[i];
  float q = dot(dir, uC[i]);
  vec2 uv = vec2(dot(dir, uR[i]), dot(dir, uU[i]) * p.y) / (max(q, 1e-4) * p.x) * vec2(0.5, -0.5) + 0.5;
  float d = length((uv - uDisk.xy) * vec2(1.0, 1.0 / p.y));
  return clamp((uDisk.z - d) / (uDisk.z * 0.04), 0.0, 1.0) * step(0.0, q) * step(0.5, p.z * side);
}
void main() {
  // Lens shift: on wide screens the wormhole sits right of the text column.
  vec2 s = (vUv - vec2(0.5 + uShift, 0.5)) * 2.0 * uTan * vec2(uRes.x / uRes.y, 1.0);
  vec3 d = normalize(vec3(s, 1.0));
  float cp = cos(uPitch), sp = sin(uPitch);
  d = vec3(d.x, d.y * cp + d.z * sp, -d.y * sp + d.z * cp);
  float cy = cos(uYaw), sy = sin(uYaw);
  d = vec3(d.x * cy + d.z * sy, d.y, -d.x * sy + d.z * cy);

  float alpha = acos(clamp(d.z, -1.0, 1.0));
  float v = phiAt(vec2(alpha / PI * (SIZE.x - 1.0), uRow));
  float side = sign(v), phi = abs(v) - 0.001;
  vec2 e = length(d.xy) > 1e-6 ? normalize(d.xy) : vec2(1.0, 0.0);
  vec3 dir = vec3(e * sin(phi), -cos(phi));

  // Both skies are read every time: texture gradients need uniform control flow.
  vec3 nearSky = equirect(uNear, dir, -1.0), farSky = equirect(uFar, dir, 1.0);
  vec3 sky = side < 0.0 ? nearSky : farSky;
  sky *= 1.0 - disk(0, dir, side);
  sky = screen(sky, picture(uSaturn, 0, dir, side));
  sky = screen(sky, picture(uGalaxy, 1, dir, side));
  sky = screen(sky, picture(uDeep, 2, dir, side));

  // Lens and film: a soft vignette and a fine moving grain, like the photographed frames around it.
  vec2 q = vUv - 0.5;
  sky *= 1.0 - 0.55 * dot(q, q) * 1.6;
  float g = fract(sin(dot(gl_FragCoord.xy + uTime * 61.0, vec2(12.9898, 78.233))) * 43758.5453);
  sky += (g - 0.5) * 0.035;
  color = vec4(sky, 1.0);
}`;

const vertex = /* glsl */ `#version 300 es
in vec2 uv; in vec2 position; out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

function load(gl: Renderer['gl'], src: string, data: boolean) {
  const texture = new Texture(gl, data
    ? { generateMipmaps: false, minFilter: gl.NEAREST, magFilter: gl.NEAREST, flipY: false, premultiplyAlpha: false }
    : { generateMipmaps: true, minFilter: gl.LINEAR_MIPMAP_LINEAR, flipY: false, wrapS: src.includes('/near') || src.includes('/far') ? gl.REPEAT : gl.CLAMP_TO_EDGE, anisotropy: 4 });
  return new Promise<Texture>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { texture.image = img; resolve(texture); };
    img.onerror = () => reject(new Error(`wormhole: could not load ${src}`));
    img.src = src;
  });
}

/** Starts the live flight in the passage stage. Returns a cleanup, or null when it can't run here. */
export function wormholeFlight(stage: HTMLElement, onProgress: (p: number) => void): (() => void) | null {
  const canvas = stage.querySelector<HTMLCanvasElement>('[data-wh-gl]');
  const section = stage.closest('section');
  if (!canvas || !section) return null;
  let renderer: Renderer;
  try {
    // Keep resolution soft on phones to hold the frame rate; raise it on fast GPUs.
    renderer = new Renderer({ canvas, webgl: 2, dpr: Math.min(devicePixelRatio, isMobile() ? 0.75 : 1.25), alpha: false, antialias: false });
  } catch { return null; }
  const gl = renderer.gl;
  if (!renderer.isWebgl2) return null;
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE); // the ray map is data, not colour

  const frames = Object.values(PATCHES).map((p: Patch) => ({ p, ...patchFrame(p) }));
  const flat = (f: (x: (typeof frames)[number]) => number[]) => frames.flatMap(f);
  const uniforms = {
    uRes: { value: [1, 1] }, uRow: { value: 0 }, uYaw: { value: 0 }, uPitch: { value: 0 }, uTan: { value: Math.tan(FOV / 2) }, uTime: { value: 0 }, uShift: { value: 0 },
    uC: { value: flat((f) => f.c) }, uR: { value: flat((f) => f.right) }, uU: { value: flat((f) => f.up) },
    uP: { value: flat((f) => [f.tan, f.p.aspect, f.p.side, f.p.gain]) },
    uDisk: { value: PATCHES.saturn.disk },
    uLut: { value: null as Texture | null }, uNear: { value: null as Texture | null }, uFar: { value: null as Texture | null },
    uSaturn: { value: null as Texture | null }, uGalaxy: { value: null as Texture | null }, uDeep: { value: null as Texture | null },
  };
  const program = new Program(gl, { vertex, fragment, uniforms, depthTest: false, depthWrite: false });
  if (!gl.getProgramParameter(program.program, gl.LINK_STATUS)) { gl.getExtension('WEBGL_lose_context')?.loseContext(); return null; }
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  const resize = () => {
    const r = stage.getBoundingClientRect();
    renderer.setSize(r.width, r.height);
    uniforms.uRes.value = [r.width, r.height];
    uniforms.uShift.value = isMobile() ? 0 : 0.14;
  };
  resize();
  addEventListener('resize', resize);

  // Scroll sets where the camera is going; the frame eases toward it, so the motion is continuous.
  let target = 0, progress = 0, ready = false, active = false, dirty = true;
  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e: PointerEvent) => { look.tx = (e.clientX / innerWidth - 0.5) * 0.05; look.ty = (e.clientY / innerHeight - 0.5) * -0.035; };
  addEventListener('pointermove', onMove, { passive: true });

  const st = ScrollTrigger.create({
    trigger: section, start: 'top top', end: 'bottom bottom', invalidateOnRefresh: true,
    onUpdate: (s) => { target = s.progress; onProgress(s.progress); },
  });
  const seen = ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: (s) => { active = s.isActive; } });

  // Textures load once the reader is within a screen or two of the chapter.
  const fetchAll = ScrollTrigger.create({
    trigger: section, start: 'top bottom+=150%', once: true,
    onEnter: () => {
      const names = ['lut.png', 'near.jpg', 'far.jpg', 'saturn.jpg', 'galaxy.jpg', 'deep.jpg'];
      Promise.all(names.map((n, i) => load(gl, `/wormhole/${n}`, i === 0)))
        .then(([lut, near, far, saturn, galaxy, deep]) => {
          uniforms.uLut.value = lut; uniforms.uNear.value = near; uniforms.uFar.value = far;
          uniforms.uSaturn.value = saturn; uniforms.uGalaxy.value = galaxy; uniforms.uDeep.value = deep;
          ready = true; dirty = true;
        })
        .catch(() => { /* the stills stay up */ });
    },
  });

  const tick = (time: number, deltaMs: number) => {
    if (!ready || !active) return;
    // Ease toward the scroll at the same speed whatever the frame rate (0.12 per 60 Hz frame).
    const k = 1 - 0.88 ** (Math.min(deltaMs, 250) / 16.7);
    const dp = target - progress;
    progress += Math.abs(dp) < 1e-4 ? dp : dp * k;
    look.x += (look.tx - look.x) * k * 0.5; look.y += (look.ty - look.y) * k * 0.5;
    // At rest the ship still drifts a little, so the stars near the ring keep sliding round it.
    const drift = Math.sin(time * 0.35) * 0.012;
    const { l, yaw } = flight(progress);
    uniforms.uRow.value = sAt(l) * (ROWS - 1);
    uniforms.uYaw.value = yaw + look.x + drift;
    uniforms.uPitch.value = look.y + Math.cos(time * 0.27) * 0.006;
    uniforms.uTime.value = time;
    renderer.render({ scene: mesh });
    if (dirty) { dirty = false; stage.classList.add('is-live'); }
  };
  gsap.ticker.add(tick);

  return () => {
    gsap.ticker.remove(tick);
    removeEventListener('resize', resize);
    removeEventListener('pointermove', onMove);
    st.kill(); seen.kill(); fetchAll.kill();
    stage.classList.remove('is-live');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
