// scripts/make-icons.mjs
// Zero-dependency icon generator for Rasikh Guide. Draws a doorway glyph (an arched opening with a
// threshold) in petrol on sand and encodes PNGs with node:zlib. Run: node scripts/make-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PETROL = [0x0b, 0x6b, 0x78];
const SAND = [0xf6, 0xe7, 0xcd];
const SIZES = [16, 48, 128];

// ---- PNG encoding ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

// ---- glyph geometry in unit space (0..1) ----
function inArch(x, y, x0, x1, top, bottom) {
  // an arch: a rectangle whose top is a semicircle spanning x0..x1
  const r = (x1 - x0) / 2;
  const cx = (x0 + x1) / 2;
  if (y > bottom || x < x0 || x > x1) return false;
  if (y >= top + r) return true;
  const dx = x - cx;
  const dy = y - (top + r);
  return dx * dx + dy * dy <= r * r;
}
function roundedSquare(x, y, rad) {
  const cx = Math.min(Math.max(x, rad), 1 - rad);
  const cy = Math.min(Math.max(y, rad), 1 - rad);
  return (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad;
}
function sample(x, y) {
  if (!roundedSquare(x, y, 0.2)) return null; // transparent corner
  const outer = inArch(x, y, 0.27, 0.73, 0.16, 0.8);
  const inner = inArch(x, y, 0.38, 0.62, 0.3, 0.8);
  const threshold = y >= 0.82 && y <= 0.89 && x >= 0.18 && x <= 0.82;
  if ((outer && !inner) || threshold) return PETROL;
  return SAND;
}

export function render(size) {
  const ss = 4; // 4x4 supersampling
  const buf = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const c = sample((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size);
          if (c) {
            r += c[0]; g += c[1]; b += c[2]; a += 255;
          }
        }
      }
      const n = ss * ss;
      const o = (py * size + px) * 4;
      const cov = a / 255; // number of opaque samples
      buf[o] = cov ? Math.round(r / cov) : 0;
      buf[o + 1] = cov ? Math.round(g / cov) : 0;
      buf[o + 2] = cov ? Math.round(b / cov) : 0;
      buf[o + 3] = Math.round((cov / n) * 255);
    }
  }
  return buf;
}

const here = dirname(fileURLToPath(import.meta.url));
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const outDir = join(here, "..", "icons");
  mkdirSync(outDir, { recursive: true });
  for (const s of SIZES) {
    const png = encodePng(s, s, render(s));
    writeFileSync(join(outDir, `${s}.png`), png);
    console.log(`icons/${s}.png ${png.length} bytes`);
  }
}
