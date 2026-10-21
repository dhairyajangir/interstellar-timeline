// Interstellar's wormhole, from the metric DNEG and Kip Thorne used for the film:
// O. James, E. von Tunzelmann, P. Franklin, K. S. Thorne, "Visualizing Interstellar's Wormhole",
// Am. J. Phys. 83, 486 (2015), arXiv:1502.03809.
//
//   ds² = −dt² + dℓ² + r(ℓ)² (dθ² + sin²θ dφ²)
//   r(ℓ) = ρ                                   for |ℓ| ≤ a   (a short cylinder, the throat)
//   r(ℓ) = ρ + M [x atan x − ½ ln(1 + x²)]     for |ℓ| > a,  x = 2(|ℓ| − a) / (π M)
//
// Units: the throat radius ρ = 1. The film used 2a = 0.01ρ and a lensing width W = 0.05ρ,
// with W = 1.42953 M. ℓ < 0 is the Saturn side, ℓ > 0 the far galaxy.
//
// Light rays are null geodesics. By symmetry each ray stays in a plane through the wormhole's axis,
// so a ray is fixed by the camera's ℓ and the angle α between the ray and the +ℓ direction.
// With p_t = −1 the ray equations (paper, appendix) reduce to
//   dℓ/dt = p,  dφ/dt = b / r²,  dp/dt = b² r'(ℓ) / r³,   b = r(ℓc) sin α (conserved).
// We trace backward from the camera until the ray is far out on one side; the sky it sees is the
// direction it is heading there: φ∞ = φ + asin(b / r).

export type Wormhole = { a: number; M: number };
export const FILM: Wormhole = { a: 0.005, M: 0.05 / 1.42953 };

export function radius(l: number, w: Wormhole = FILM) {
  const d = Math.abs(l) - w.a;
  if (d <= 0) return 1;
  const x = (2 * d) / (Math.PI * w.M);
  return 1 + w.M * (x * Math.atan(x) - 0.5 * Math.log1p(x * x));
}

function slope(l: number, w: Wormhole) {
  const d = Math.abs(l) - w.a;
  if (d <= 0) return 0;
  return Math.sign(l) * (2 / Math.PI) * Math.atan((2 * d) / (Math.PI * w.M));
}

const FAR = 80; // ρ: far enough that the rest of the path is a straight line

/** Trace one ray. Returns the sky direction angle φ∞ (radians, ≥ 0) and the side it ends on. */
export function trace(lc: number, alpha: number, w: Wormhole = FILM): { phi: number; side: 1 | -1 } {
  const b = radius(lc, w) * Math.sin(alpha);
  const b2 = b * b;
  let l = lc, p = Math.cos(alpha), phi = 0;
  const f = (l: number, p: number) => {
    const r = radius(l, w);
    return [p, b / (r * r), (b2 * slope(l, w)) / (r * r * r)];
  };
  for (let i = 0; i < 6000; i++) {
    const r = radius(l, w);
    if (Math.abs(l) > FAR && p * l > 0) return { phi: phi + Math.asin(Math.min(1, b / r)), side: l > 0 ? 1 : -1 };
    // Small steps near the throat, where r bends over a length of about M; long ones far out.
    const h = 0.004 + 0.06 * Math.max(0, Math.abs(l) - 1) + 0.02 * Math.min(1, Math.abs(l));
    const [k1l, k1f, k1p] = f(l, p);
    const [k2l, k2f, k2p] = f(l + (h / 2) * k1l, p + (h / 2) * k1p);
    const [k3l, k3f, k3p] = f(l + (h / 2) * k2l, p + (h / 2) * k2p);
    const [k4l, k4f, k4p] = f(l + h * k3l, p + h * k3p);
    l += (h / 6) * (k1l + 2 * k2l + 2 * k3l + k4l);
    phi += (h / 6) * (k1f + 2 * k2f + 2 * k3f + k4f);
    p += (h / 6) * (k1p + 2 * k2p + 2 * k3p + k4p);
  }
  return { phi, side: l > 0 ? 1 : -1 }; // ponytail: a ray trapped at the throat's light sphere; rare, and invisible at this size
}

// The flight, as camera positions: rows of the lookup table, dense near the throat where the view
// changes fastest. s in [0, 1] → ℓ in [−L, L].
export const L = 9;
export const lAt = (s: number) => { const u = 2 * s - 1; return Math.sign(u) * L * u * u; };
export const sAt = (l: number) => (1 + Math.sign(l) * Math.sqrt(Math.abs(l) / L)) / 2;

// Lookup table, one row per camera position, one column per α in [0, π].
// Each value is side × (φ∞ + EPS): the sign carries the side, so one channel holds both.
export const EPS = 1e-3;
export const PHI_MAX = 4 * Math.PI; // rays that wind round the throat twice are far below a pixel
export function lutRow(lc: number, cols: number, w: Wormhole = FILM) {
  const row = new Float32Array(cols);
  for (let i = 0; i < cols; i++) {
    const { phi, side } = trace(lc, (i / (cols - 1)) * Math.PI, w);
    row[i] = side * (Math.min(phi, PHI_MAX) + EPS);
  }
  return row;
}

// 16 bits per value, packed into the red and green bytes of an RGBA texel for an 8-bit texture.
export const pack = (v: number) => Math.round(((v + PHI_MAX + EPS) / (2 * (PHI_MAX + EPS))) * 65535);
export const unpack = (u: number) => (u / 65535) * 2 * (PHI_MAX + EPS) - (PHI_MAX + EPS);

// ── The shot ─────────────────────────────────────────────────────────────────────────────────────
// Shared by the live shader (src/motion/passage.ts) and the still frames (scripts/wormhole.mts), so
// both show the same sky. Directions are on the two celestial spheres, in the camera's frame at the
// start: x right, y up, z forward (toward the wormhole). The far side's forward is −z.

export const FOV = (60 * Math.PI) / 180; // vertical

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const toward = (from: number, to: number, t: number) => from * (to / from) ** t; // even in log distance

/** Scroll progress → camera ℓ and yaw (radians; π looks back the way it came). */
export function flight(p: number) {
  if (p < 0.5) return { l: -toward(9, 1.25, p / 0.5), yaw: 0 }; // Saturn, then the sphere swells
  if (p < 0.62) return { l: -1.25 + 2.5 * ease((p - 0.5) / 0.12), yaw: 0 }; // through the throat
  if (p < 0.8) return { l: toward(1.25, 4, (p - 0.62) / 0.18), yaw: 0 }; // out into the far galaxy
  const t = clamp01((p - 0.8) / 0.2);
  return { l: 4 - 0.8 * t, yaw: Math.PI * ease(t) }; // turn round: home is a sphere now
}

// Pictures pinned to the celestial spheres: lon is to the right, lat up, size is the angular width.
// disk: an opaque circle in the picture (centre u, v and radius, in picture widths) that hides the
// stars behind it, Saturn's night side; everything else in a picture is light added to the sky.
export type Patch = { lon: number; lat: number; width: number; aspect: number; side: 1 | -1; gain: number; disk?: [number, number, number] };
export const PATCHES = {
  saturn: { lon: 0.36, lat: -0.06, width: 0.7, aspect: 1920 / 746, side: -1, gain: 1.15, disk: [0.5, 0.53, 0.079] },
  galaxy: { lon: 0.18, lat: 0.14, width: 1.1, aspect: 1920 / 1673, side: 1, gain: 1.3 },
  deep: { lon: -0.3, lat: -0.1, width: 1.8, aspect: 1920 / 1753, side: 1, gain: 0.7 },
} satisfies Record<string, Patch>;

/** A direction on one celestial sphere (unit vector, start frame). */
export function skyDir(lon: number, lat: number, side: 1 | -1): [number, number, number] {
  return [Math.sin(lon) * Math.cos(lat), Math.sin(lat), -side * Math.cos(lon) * Math.cos(lat)];
}

/** A patch's centre, right and up vectors on its sky, and the tangent of its half width. */
export function patchFrame(p: Patch) {
  const c = skyDir(p.lon, p.lat, p.side);
  const ul = Math.hypot(-c[0] * c[1], 1 - c[1] * c[1], -c[2] * c[1]);
  const up = [(-c[0] * c[1]) / ul, (1 - c[1] * c[1]) / ul, (-c[2] * c[1]) / ul];
  // On the far side forward is −z, so right = up × c there and c × up here; both read as screen right.
  const right = [up[1] * c[2] - up[2] * c[1], up[2] * c[0] - up[0] * c[2], up[0] * c[1] - up[1] * c[0]].map((v) => v * p.side);
  return { c, up, right, tan: Math.tan(p.width / 2) };
}
