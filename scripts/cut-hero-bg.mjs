// Make the hero sign's black background transparent so the plaque sits directly
// on the page (no black "block" framing it). Edge flood-fill only: removes black
// pixels CONNECTED to the border, leaving the dark-wood interior + letter shadows
// intact. Writes a transparent PNG.
import sharp from "sharp";

const SRC = "images from Ryan/hero.png";
const OUT = process.argv[2] || "/tmp/hero_cut.png";
const T = Number(process.argv[3] ?? 16); // luminance <= T counts as background black

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const lum = (i) => Math.max(data[i], data[i + 1], data[i + 2]);

const bg = new Uint8Array(W * H); // 1 = background (to be cleared)
const stack = [];
const push = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const p = y * W + x;
  if (bg[p]) return;
  if (lum(p * C) > T) return;
  bg[p] = 1;
  stack.push(p);
};
for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
while (stack.length) {
  const p = stack.pop();
  const x = p % W, y = (p / W) | 0;
  push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
}

let cleared = 0;
for (let p = 0; p < W * H; p++) if (bg[p]) { data[p * C + 3] = 0; cleared++; }

await sharp(data, { raw: { width: W, height: H, channels: C } }).png().toFile(OUT);
console.log(`T=${T}: cleared ${cleared} px (${((cleared / (W * H)) * 100).toFixed(1)}%) -> ${OUT}`);
