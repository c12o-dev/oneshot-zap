// 依存なしでツールバー/拡張アイコン(赤い稲妻 zap)の PNG を生成する。
// 形は content script のボタンと同じ Lucide zap polygon。視認性重視で塗りつぶし＋赤。
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(resolve(root, "icons"), { recursive: true });

// --- 最小 PNG エンコーダ (RGBA, 8bit) ---
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
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Lucide zap polygon (24-grid)
const ZAP24 = [[13, 2], [3, 14], [12, 14], [11, 22], [21, 10], [12, 10]];
const RED = [244, 33, 46];

function drawIcon(size) {
  const SS = 4; // supersample で角をなめらかに
  const big = size * SS;
  const sc = (size / 24) * SS;
  const pts = ZAP24.map(([x, y]) => [x * sc, y * sc]);
  const inPoly = (x, y) => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const buf = Buffer.alloc(big * big * 4);
  for (let y = 0; y < big; y++)
    for (let x = 0; x < big; x++)
      if (inPoly(x + 0.5, y + 0.5)) {
        const i = (y * big + x) * 4;
        buf[i] = RED[0]; buf[i + 1] = RED[1]; buf[i + 2] = RED[2]; buf[i + 3] = 255;
      }
  // SSxSS box downsample
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < SS; dy++)
        for (let dx = 0; dx < SS; dx++) {
          const j = ((y * SS + dy) * big + (x * SS + dx)) * 4;
          r += buf[j]; g += buf[j + 1]; b += buf[j + 2]; a += buf[j + 3];
        }
      const k = (y * size + x) * 4, n = SS * SS;
      out[k] = r / n; out[k + 1] = g / n; out[k + 2] = b / n; out[k + 3] = a / n;
    }
  return out;
}

for (const size of [16, 48, 128]) {
  const p = encodePNG(size, drawIcon(size));
  writeFileSync(resolve(root, `icons/icon${size}.png`), p);
  console.log(`wrote icons/icon${size}.png (${p.length}b)`);
}
