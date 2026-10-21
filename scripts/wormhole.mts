// Interstellar's wormhole, ray traced with the film's own metric (src/lib/wormhole.ts).
//   node --experimental-strip-types scripts/wormhole.mts   (npm run grade runs it before grade.mjs)
// Writes, for the live flight (src/motion/passage.ts):
//   public/wormhole/lut.png      the ray map: camera position × ray angle → where on which sky it lands
//   public/wormhole/near.jpg     the Saturn side's sky: NASA's Deep Star Map of the Milky Way
//   public/wormhole/far.jpg      the far galaxy's sky: NASA's "elsewhere" star field
//   public/wormhole/{saturn,galaxy,deep}.jpg   real pictures pinned to those skies
// and the still frames for phones without WebGL2 and for reduced motion, through the same map:
//   src/assets/raw/gen/wh-*.png  (graded into public/img by grade.mjs)
// Sources (public domain): NASA SVS Deep Star Maps 2020 (svs.gsfc.nasa.gov/4851, /4856), converted
// from EXR with ffmpeg; Cassini (Saturn); Hubble (a dwarf galaxy, the Ultraviolet Ultra Deep Field).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { EPS, FOV, PATCHES, flight, lAt, lutRow, pack, patchFrame, sAt, type Patch } from '../src/lib/wormhole.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW = path.join(ROOT, 'src/assets/raw');
const GEN = path.join(RAW, 'gen');
const PUB = path.join(ROOT, 'public/wormhole');
fs.mkdirSync(GEN, { recursive: true });
fs.mkdirSync(PUB, { recursive: true });

// ── The ray map ──────────────────────────────────────────────────────────────────────────────────
const COLS = 768, ROWS = 192;
const lut = new Float32Array(COLS * ROWS);
const lutFile = path.join(GEN, `lut-${COLS}x${ROWS}.bin`);
if (fs.existsSync(lutFile)) lut.set(new Float32Array(fs.readFileSync(lutFile).buffer.slice(0)));
else {
  for (let r = 0; r < ROWS; r++) lut.set(lutRow(lAt(r / (ROWS - 1)), COLS), r * COLS);
  fs.writeFileSync(lutFile, Buffer.from(lut.buffer));
}
{
  const px = Buffer.alloc(COLS * ROWS * 4);
  for (let i = 0; i < lut.length; i++) { const u = pack(lut[i]); px[i * 4] = u >> 8; px[i * 4 + 1] = u & 255; px[i * 4 + 3] = 255; }
  await sharp(px, { raw: { width: COLS, height: ROWS, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(PUB, 'lut.png'));
  console.log('lut.png');
}

// ── Skies ────────────────────────────────────────────────────────────────────────────────────────
// Linear EXR → tone mapped 8-bit, pulled toward the film's cold silver (desaturated, slightly blue).
async function sky(exr: string, out: string, exposure: number) {
  const png = path.join(GEN, exr.replace('.exr', '.png'));
  if (!fs.existsSync(png)) execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(RAW, 'pd/sky', exr), '-pix_fmt', 'rgb48be', png]);
  const { data, info } = await sharp(png).toColourspace('rgb16').raw({ depth: 'ushort' }).toBuffer({ resolveWithObject: true });
  const src = new Uint16Array(data.buffer, data.byteOffset, data.length / 2);
  const n = info.width * info.height, rgb = Buffer.alloc(n * 3), tint = [0.95, 1, 1.07];
  for (let i = 0; i < n; i++) {
    const c = [0, 1, 2].map((k) => Math.max(0, src[i * info.channels + k] / 65535 - 0.0045) * exposure);
    const y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    for (let k = 0; k < 3; k++) {
      const v = (y + (c[k] - y) * 0.55) * tint[k];
      rgb[i * 3 + k] = Math.min(255, Math.round(255 * (v / (1 + v * 0.25)) ** (1 / 2.2)));
    }
  }
  await sharp(rgb, { raw: { width: info.width, height: info.height, channels: 3 } }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(PUB, out));
  console.log(out);
  return { w: info.width, h: info.height, rgb };
}
const near = await sky('starmap_2020_4k_gal.exr', 'near.jpg', 1.6);
const far = await sky('starmap_random_2020_4k.exr', 'far.jpg', 2.2);

// A picture for the sky: its own black lifted out and its edge feathered to nothing in an ellipse,
// so it lies on the stars instead of sitting on them as a rectangle.
async function patch(src: string, out: string, width: number, black: number, hard: number) {
  const { data, info } = await sharp(path.join(RAW, src)).resize({ width }).modulate({ saturation: 0.7 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const r = Math.hypot((x / info.width) * 2 - 1, (y / info.height) * 2 - 1);
    const t = Math.min(1, Math.max(0, (1 - r) / (1 - hard)));
    const m = t * t * (3 - 2 * t);
    for (let k = 0; k < 3; k++) {
      const i = (y * info.width + x) * 3 + k;
      data[i] = Math.round(Math.max(0, (data[i] - black) / (255 - black)) * 255 * m);
    }
  }
  const img = sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } });
  await img.jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(PUB, out));
  console.log(out);
  return { w: info.width, h: info.height, rgb: data };
}
const pics = {
  saturn: await patch('pd/saturn-backlit.jpg', 'saturn.jpg', 1600, 10, 0.7),
  galaxy: await patch('pd/hubble-spiral.jpg', 'galaxy.jpg', 1400, 26, 0.35),
  deep: await patch('pd/hubble-uvudf.jpg', 'deep.jpg', 1400, 14, 0.2),
};

// ── Stills: the same shading as the shader, on the CPU ───────────────────────────────────────────
type Img = { w: number; h: number; rgb: Buffer };
function bilinear(img: Img, u: number, v: number, wrap: boolean) {
  const x = u * img.w - 0.5, y = Math.min(img.h - 1, Math.max(0, v * img.h - 0.5));
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const at = (xx: number, yy: number, k: number) => {
    xx = wrap ? ((xx % img.w) + img.w) % img.w : Math.min(img.w - 1, Math.max(0, xx));
    return img.rgb[(Math.min(img.h - 1, yy) * img.w + xx) * 3 + k];
  };
  return [0, 1, 2].map((k) => (at(x0, y0, k) * (1 - fx) + at(x0 + 1, y0, k) * fx) * (1 - fy) + (at(x0, y0 + 1, k) * (1 - fx) + at(x0 + 1, y0 + 1, k) * fx) * fy);
}
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: number[]) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
const frames = Object.entries(PATCHES).map(([k, p]: [string, Patch]) => ({ p, ...patchFrame(p), img: pics[k as keyof typeof pics] }));

function phiAt(col: number, row: number) {
  const c0 = Math.min(COLS - 2, Math.floor(col)), r0 = Math.min(ROWS - 2, Math.floor(row)), fc = col - c0, fr = row - r0;
  const v = [lut[r0 * COLS + c0], lut[r0 * COLS + c0 + 1], lut[(r0 + 1) * COLS + c0], lut[(r0 + 1) * COLS + c0 + 1]];
  if (v.every((x) => x > 0) || v.every((x) => x < 0)) return (v[0] * (1 - fc) + v[1] * fc) * (1 - fr) + (v[2] * (1 - fc) + v[3] * fc) * fr;
  return v[(fr > 0.5 ? 2 : 0) + (fc > 0.5 ? 1 : 0)];
}

function shade(d: number[], row: number) {
  const alpha = Math.acos(Math.max(-1, Math.min(1, d[2])));
  const s = phiAt((alpha / Math.PI) * (COLS - 1), row);
  const side = s > 0 ? 1 : -1, phi = Math.abs(s) - EPS;
  const el = Math.hypot(d[0], d[1]) || 1, ex = d[0] / el, ey = d[1] / el;
  const dir = [ex * Math.sin(phi), ey * Math.sin(phi), -Math.cos(phi)];
  const lon = Math.atan2(dir[0], -side * dir[2]), lat = Math.asin(Math.max(-1, Math.min(1, dir[1])));
  let c = bilinear(side < 0 ? near : far, 0.5 - lon / (2 * Math.PI), 0.5 - lat / Math.PI, true).map((v) => v / 255);
  for (const f of frames) {
    if (f.p.side !== side) continue;
    const q = dot(dir, f.c);
    if (q <= 0) continue;
    const x = dot(dir, f.right) / q / f.tan, y = (dot(dir, f.up) / q / f.tan) * f.p.aspect;
    if (Math.abs(x) >= 1 || Math.abs(y) >= 1) continue;
    const u = x * 0.5 + 0.5, v = 0.5 - y * 0.5;
    if (f.p.disk) {
      const [du, dv, r] = f.p.disk, dd = Math.hypot(u - du, (v - dv) / f.p.aspect);
      const hide = Math.min(1, Math.max(0, (r - dd) / (r * 0.04)));
      c = c.map((k) => k * (1 - hide));
    }
    const pc = bilinear(f.img, u, v, false);
    c = c.map((v, k) => 1 - (1 - v) * (1 - (pc[k] / 255) * f.p.gain));
  }
  return c;
}

async function still(name: string, p: number, W = 1600, H = 900) {
  const { l, yaw } = flight(p);
  const row = sAt(l) * (ROWS - 1), t = Math.tan(FOV / 2), cy = Math.cos(yaw), sy = Math.sin(yaw);
  const out = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const acc = [0, 0, 0];
    for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
      const cx = ((x + ox) / W - 0.5) * 2 * t * (W / H), cyy = (0.5 - (y + oy) / H) * 2 * t;
      const d0 = norm([cx, cyy, 1]);
      const d = [d0[0] * cy + d0[2] * sy, d0[1], -d0[0] * sy + d0[2] * cy];
      shade(d, row).forEach((v, k) => (acc[k] += v / 4));
    }
    for (let k = 0; k < 3; k++) out[(y * W + x) * 3 + k] = Math.min(255, Math.round(acc[k] * 255));
  }
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(GEN, `${name}.png`));
  console.log(`${name}.png  ℓ=${l.toFixed(2)} yaw=${yaw.toFixed(2)}`);
}
const only = process.argv[2];
for (const [name, p] of Object.entries({ 'wh-saturn': 0.02, 'wh-near': 0.42, 'wh-rim': 0.52, 'wh-far': 0.74, 'wh-home': 1 })) {
  if (!only || only === name) await still(name, p);
}
