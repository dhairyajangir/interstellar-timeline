// Grades every source image into the site's two worlds and writes web-ready WebP files.
//   node scripts/grade.mjs
// Sources: src/assets/raw/pd (public domain: NASA, NOAA, Library of Congress)
//          src/assets/raw/film (film stills supplied by the site owner, © the studios)
// Output:  public/img/<name>-<width>.webp, plus src/data/images.json (sizes for width/height attrs)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/img');

// Grades: luminance → a gradient between palette stops (tokens.css). Grain hides soft sources.
const GRADES = {
  void: ['#060708', '#3b3a37', '#ece7dc'],          // silver on space black
  dust: ['#17130e', '#6e5d44', '#e8d9bb'],          // soot to pale dust, reads on the dust ground
  fire: ['#060708', '#7a5a33', '#c9b48f', '#fbf3e2'], // Gargantua's light: black, ember, dust, white
};

// name: [source, grade, widths, options]
const JOBS = {
  'saturn-backlit': ['pd/saturn-backlit.jpg', 'void', [1600, 900]],
  'saturn-night': ['pd/saturn-night.jpg', 'void', [1600, 900]],
  blackhole: ['pd/blackhole.jpg', 'fire', [1024, 640], { crop: { left: 0, top: 232, width: 1024, height: 560 } }],
  colony: ['pd/colony.jpg', 'dust', [1600, 900], { gamma: 1 }],
  'earth-limb': ['pd/earth-limb.jpg', 'void', [1600, 900]],
  antarctic: ['pd/antarctic.jpg', 'void', [1600, 900], { contrast: 1.15 }],
  'dust-storm': ['pd/dust-cimarron.jpg', 'dust', [1200, 700], { contrast: 1.1, crop: { left: 230, top: 190, width: 1460, height: 1500 } }],
  'dust-town': ['pd/dust-dallas.jpg', 'dust', [1600, 900], { crop: { left: 12, top: 30, width: 1880, height: 1390 } }],
  'plunge-flyby': ['pd/plunge-flyby.jpg', 'fire', [1920, 960], { crop: { left: 0, top: 0, width: 3840, height: 1700 } }],
  'plunge-horizon': ['pd/plunge-horizon.jpg', 'fire', [1920, 960]],
  'plunge-ring': ['pd/plunge-ring.jpg', 'fire', [1920, 960], { crop: { left: 1024, top: 0, width: 6144, height: 3456 } }],
  ranger: ['film/ranger-docking.png', 'void', [597]],
  tesseract: ['film/tesseract-set.jpg', 'fire', [1280, 800], { crop: { left: 0, top: 0, width: 1280, height: 620 }, contrast: 1.1 }],
  'tars-miller': ['film/tars-miller.png', 'void', [588]],
  'gargantua-film': ['film/gargantua-tall.png', 'fire', [411]],
  watch: ['film/watch.png', 'dust', [200], { crop: { left: 110, top: 168, width: 200, height: 166 }, normalise: true }],
};

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function lut(stops) {
  const c = stops.map(hex);
  return Array.from({ length: 256 }, (_, v) => {
    const t = (v / 255) * (c.length - 1);
    const i = Math.min(c.length - 2, Math.floor(t));
    const f = t - i;
    return c[i].map((a, k) => Math.round(a + (c[i + 1][k] - a) * f));
  });
}

// Deterministic grain so rebuilds are byte-stable.
function grain(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 10;
}

fs.mkdirSync(OUT, { recursive: true });
const sizes = {};
for (const [name, [src, grade, widths, opt = {}]] of Object.entries(JOBS)) {
  let img = sharp(path.join(ROOT, 'src/assets/raw', src));
  if (opt.crop) img = img.extract(opt.crop);
  if (opt.normalise) img = img.normalise();
  const { data, info } = await img
    .grayscale()
    .linear(opt.contrast ?? 1, -(128 * ((opt.contrast ?? 1) - 1)))
    .gamma(opt.gamma ?? 1.1)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const map = lut(GRADES[grade]);
  const rgb = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < info.width * info.height; i++) {
    const v = Math.max(0, Math.min(255, Math.round(data[i * info.channels] + grain(i))));
    rgb.set(map[v], i * 3);
  }
  const graded = sharp(rgb, { raw: { width: info.width, height: info.height, channels: 3 } });
  for (const w of widths) {
    const width = Math.min(w, info.width);
    const file = path.join(OUT, `${name}-${width}.webp`);
    await graded.clone().resize({ width }).webp({ quality: 74 }).toFile(file);
  }
  sizes[name] = { w: info.width, h: info.height, widths: widths.map((w) => Math.min(w, info.width)) };
  console.log(`${name}: ${info.width}x${info.height} → ${sizes[name].widths.join(', ')}`);
}
fs.writeFileSync(path.join(ROOT, 'src/data/images.json'), JSON.stringify(sizes, null, 2) + '\n');
