// Renders the wormhole from real Hubble imagery (public domain), before grading:
//   node scripts/wormhole.mjs   (then scripts/grade.mjs picks up src/assets/raw/gen/*)
// - wormhole-sphere.png: the Hubble eXtreme Deep Field, bent around a sphere (point-lens deflection,
//   so stars near the rim smear into arcs and an Einstein ring), with a different galaxy seen
//   through the sphere: the far side, warm, squeezed toward the rim like a fisheye.
// - wormhole-tunnel.png: the same deep field pulled toward the centre (radial zoom blur), the
//   frame for falling through.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW = path.join(ROOT, 'src/assets/raw');
const OUT = path.join(RAW, 'gen');
const W = 1920, H = 1080;

const STOPS = {
  cold: ['#060708', '#3b3a37', '#ece7dc'],
  warm: ['#060708', '#7a5a33', '#c9b48f', '#fbf3e2'],
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lut = (stops) => {
  const c = stops.map(hex);
  return Array.from({ length: 256 }, (_, v) => {
    const t = (v / 255) * (c.length - 1), i = Math.min(c.length - 2, Math.floor(t)), f = t - i;
    return c[i].map((a, k) => a + (c[i + 1][k] - a) * f);
  });
};

// A toned source, as a sampler over [0,1]² with bilinear filtering and edge wrap.
async function source(file, tone, gamma = 1.1) {
  const { data, info } = await sharp(path.join(RAW, file)).grayscale().gamma(gamma).raw().toBuffer({ resolveWithObject: true });
  const map = lut(STOPS[tone]);
  const { width: w, height: h, channels: ch } = info;
  const at = (x, y) => data[((((y % h) + h) % h) * w + (((x % w) + w) % w)) * ch];
  return (u, v) => {
    const x = u * (w - 1), y = v * (h - 1), x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const g = (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy;
    return map[Math.max(0, Math.min(255, Math.round(g)))];
  };
}

function write(name, buf) {
  fs.mkdirSync(OUT, { recursive: true });
  return sharp(buf, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(OUT, name));
}

const sky = await source('pd/hubble-xdf.jpg', 'cold', 1.25);
const far = await source('pd/hubble-spiral.jpg', 'warm', 1.05);

// The sphere.
{
  const buf = Buffer.alloc(W * H * 3);
  const cx = W * 0.5, cy = H * 0.5, R = H * 0.34, thetaE = R * 1.05;
  const aspect = H / W;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
      let c;
      if (r > R) {
        // Outside: point-lens deflection, beta = theta - thetaE^2 / theta.
        const k = 1 - (thetaE * thetaE) / (r * r);
        const sx = cx + dx * k, sy = cy + dy * k;
        c = sky(0.5 + (sx - cx) / W * 0.9, 0.5 + (sy - cy) / H * 0.9 * (1 / aspect) * aspect);
        // Light piles up near the rim: brighten the Einstein ring.
        const ring = Math.exp(-(((r - R * 1.02) / (R * 0.018)) ** 2)) * 0.55 + Math.exp(-(((r - R * 1.08) / (R * 0.06)) ** 2)) * 0.12;
        c = c.map((v) => Math.min(255, v + ring * 150));
      } else {
        // Inside: the far galaxy, squeezed toward the rim (fisheye), plus a glassy edge.
        const q = r / R, f = Math.pow(q, 1.7) * 0.62;
        const a = Math.atan2(dy, dx) + q * 0.6; // a little twist toward the throat
        c = far(0.5 + Math.cos(a) * f * 0.62, 0.5 + Math.sin(a) * f * 0.62);
        const edge = Math.pow(q, 14) * 0.35;
        c = c.map((v, i) => Math.min(255, v * (1 - edge * 0.3) + edge * hex('#ece7dc')[i]));
      }
      buf.set(c.map(Math.round), (y * W + x) * 3);
    }
  }
  await write('wormhole-sphere.png', buf);
  console.log('wormhole-sphere.png');
}

// The tunnel: radial zoom blur of the deep field toward the centre.
{
  const buf = Buffer.alloc(W * H * 3);
  const N = 56;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W - 0.5, v = y / H - 0.5;
      const acc = [0, 0, 0];
      for (let i = 0; i < N; i++) {
        const j = (((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000 / 1000; // per-pixel jitter breaks up banding
        const s = 1 - ((i + j) / N) * 0.45 * Math.min(1, Math.hypot(u, v) * 2.2);
        const c = sky(0.5 + u * s * 0.7, 0.5 + v * s * 0.7);
        acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2];
      }
      const lift = 1.6, floor = 10; // streak brightness; keep the void black
      buf.set(acc.map((a) => Math.max(6, Math.min(255, Math.round((a / N - floor) * lift)))), (y * W + x) * 3);
    }
  }
  await write('wormhole-tunnel.png', buf);
  console.log('wormhole-tunnel.png');
}
