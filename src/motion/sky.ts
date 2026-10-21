// The space behind the void sections: a star field, the wormhole (a sphere showing another sky)
// and Gargantua (a shadow with a photon ring and a thin disk). Positions come from DOM boxes, so
// the art scrolls with its chapter. uWarp streaks the stars where time is being stretched.
export const SKY = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime, uScrollY, uWarp;
uniform vec2 uResolution, uMouse;
uniform vec3 uDoor;   // wormhole: center x, y (px, top-left origin), radius (0 = hidden)
uniform vec3 uHole;   // Gargantua: same
uniform vec3 uStar, uDust;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float layer(vec2 p, float cells, float t) {
  vec2 g = p * cells;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash(id);
  vec2 o = vec2(hash(id + 3.7), hash(id + 9.1)) - 0.5;
  float d = length(f - o * 0.6);
  float tw = 0.6 + 0.4 * sin(t * (0.5 + h * 1.8) + h * 50.0);
  return step(0.87, h) * tw * smoothstep(0.07 + 0.08 * h, 0.0, d);
}

vec3 sky(vec2 px) {
  vec2 p = px / uResolution.y;
  vec2 m = (uMouse - 0.5) * vec2(1.0, -1.0);
  float s = layer(p + vec2(0.0, uScrollY / uResolution.y * 0.04) + m * 0.008, 64.0, uTime) * 0.7
          + layer(p + vec2(4.2, uScrollY / uResolution.y * 0.1) + m * 0.02, 24.0, uTime * 0.8);
  return uStar * s;
}

// Stars smeared away from the screen center: time being stretched.
vec3 field(vec2 px) {
  if (uWarp < 0.02) return sky(px);
  vec2 dir = normalize(px - uResolution * 0.5 + 0.001);
  vec3 c = vec3(0.0);
  for (int i = 0; i < 4; i++) c += sky(px - dir * float(i) * uWarp * 10.0);
  return c * 0.45;
}

void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  vec2 sp = px;
  vec3 col = vec3(0.0);
  float shadow = 0.0;

  // Gargantua: bend the sky around it, then draw the shadow, ring and disk on top.
  if (uHole.z > 1.0) {
    vec2 d = px - uHole.xy;
    float l = max(length(d), 1.0);
    float r = uHole.z;
    sp -= d / l * (r * r * 0.9) / l;
    vec2 q = d / r;
    float ring = smoothstep(0.05, 0.0, abs(l / r - 1.04)) * 0.9 + smoothstep(0.35, 0.0, abs(l / r - 1.1)) * 0.18;
    float disk = smoothstep(0.045, 0.0, abs(q.y + q.x * 0.04)) * smoothstep(1.02, 1.12, abs(q.x)) * smoothstep(3.2, 1.4, abs(q.x));
    float arc = smoothstep(0.08, 0.0, abs(length(q * vec2(1.0, 1.35)) - 1.22)) * step(q.y, 0.0) * 0.55;
    float doppler = 0.65 + 0.35 * clamp(-q.x * 0.5, -1.0, 1.0);
    vec3 glow = mix(uDust, uStar, 0.55) * (ring + (disk + arc) * doppler);
    shadow = smoothstep(1.0, 0.97, l / r);
    col += glow;
  }

  // The wormhole: a sphere that shows another sky, slightly warmer than ours.
  float inside = 0.0;
  if (uDoor.z > 1.0) {
    vec2 d = px - uDoor.xy;
    float l = max(length(d), 1.0);
    float r = uDoor.z;
    float k = l / r;
    inside = smoothstep(1.0, 0.985, k);
    vec2 other = uDoor.xy - d * (1.8 - k) + vec2(900.0, 400.0);
    vec3 there = sky(other) * mix(uStar, uDust, 0.6) * 1.8 + uDust * 0.13 * (1.0 - k * k) * (0.8 + 0.2 * sin(atan(d.y, d.x) * 3.0 + uTime * 0.3 + k * 6.0));
    float rim = smoothstep(0.06, 0.0, abs(k - 1.0)) * 0.55 + pow(clamp(k, 0.0, 1.0), 6.0) * 0.25 * inside;
    if (k > 1.0) sp -= d / l * (r * r * 0.45) / l;
    col += there * inside + uStar * rim * 0.6;
  }

  col += field(sp) * (1.0 - inside) * (1.0 - shadow);
  col *= 1.0 - shadow;
  col += vec3(0.043, 0.055, 0.071) * (1.0 - shadow); // the void ground, #0b0e12
  col += (hash(px + fract(uTime)) - 0.5) * 0.012;
  gl_FragColor = vec4(col, 1.0);
}`;
