#!/usr/bin/env node
/**
 * Procedurally generates the Nova POS desktop icon source as a 1024x1024 PNG.
 * Uses only Node built-ins so npm run desktop:icon works without extra image deps.
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const ICONS_DIR = path.join(REPO, "desktop-shell", "icons");
const ICON_SOURCE = path.join(ICONS_DIR, "icon-1024.png");
const DESKTOP_PNG = path.join(REPO, "desktop-shell", "icon.png");

const W = 1024;
const H = 1024;
const data = new Uint8Array(W * H * 4);

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
function mix(a, b, t) { return a + (b - a) * t; }
function px(x, y, r, g, b, a = 255) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
  const i = (y * W + x) * 4;
  const aa = a / 255;
  data[i] = clamp(r * aa + data[i] * (1 - aa));
  data[i + 1] = clamp(g * aa + data[i + 1] * (1 - aa));
  data[i + 2] = clamp(b * aa + data[i + 2] * (1 - aa));
  data[i + 3] = 255;
}
function roundedRect(x, y, w, h, radius, color) {
  const [r, g, b, a = 255] = color;
  for (let yy = Math.floor(y); yy < y + h; yy++) {
    for (let xx = Math.floor(x); xx < x + w; xx++) {
      const dx = xx < x + radius ? x + radius - xx : xx > x + w - radius ? xx - (x + w - radius) : 0;
      const dy = yy < y + radius ? y + radius - yy : yy > y + h - radius ? yy - (y + h - radius) : 0;
      if (dx * dx + dy * dy <= radius * radius) px(xx, yy, r, g, b, a);
    }
  }
}
function line(x1, y1, x2, y2, width, color) {
  const [r, g, b, a = 255] = color;
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = mix(x1, x2, t), y = mix(y1, y2, t);
    for (let yy = -width; yy <= width; yy++) for (let xx = -width; xx <= width; xx++) {
      if (xx * xx + yy * yy <= width * width) px(x + xx, y + yy, r, g, b, a);
    }
  }
}
function poly(points, color) {
  const [r, g, b, a = 255] = color;
  const minY = Math.floor(Math.min(...points.map(p => p[1])));
  const maxY = Math.ceil(Math.max(...points.map(p => p[1])));
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [x1, y1] = points[i], [x2, y2] = points[j];
      if ((y1 > y) !== (y2 > y)) xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k < xs.length; k += 2) {
      for (let x = Math.floor(xs[k]); x <= Math.ceil(xs[k + 1]); x++) px(x, y, r, g, b, a);
    }
  }
}
function glow(cx, cy, radius, color, power = 2) {
  const [r, g, b, maxA] = color;
  for (let y = Math.floor(cy - radius); y <= cy + radius; y++) {
    for (let x = Math.floor(cx - radius); x <= cx + radius; x++) {
      const d = Math.hypot(x - cx, y - cy) / radius;
      if (d <= 1) px(x, y, r, g, b, maxA * Math.pow(1 - d, power));
    }
  }
}
function textPOS(x, y, s) {
  const c = [246, 250, 255, 255];
  const stroke = 18 * s, w = 78 * s, h = 102 * s, gap = 20 * s;
  // P
  roundedRect(x, y, stroke, h, 5 * s, c); roundedRect(x, y, w, stroke, 5 * s, c); roundedRect(x, y + 42 * s, w, stroke, 5 * s, c); roundedRect(x + w - stroke, y, stroke, 58 * s, 5 * s, c);
  x += w + gap;
  // O
  roundedRect(x, y, w, stroke, 5 * s, c); roundedRect(x, y + h - stroke, w, stroke, 5 * s, c); roundedRect(x, y, stroke, h, 5 * s, c); roundedRect(x + w - stroke, y, stroke, h, 5 * s, c);
  x += w + gap;
  // S
  roundedRect(x, y, w, stroke, 5 * s, c); roundedRect(x, y + 42 * s, w, stroke, 5 * s, c); roundedRect(x, y + h - stroke, w, stroke, 5 * s, c); roundedRect(x, y, stroke, 54 * s, 5 * s, c); roundedRect(x + w - stroke, y + 42 * s, stroke, 60 * s, 5 * s, c);
}
function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, payload) {
  const t = Buffer.from(type);
  const p = Buffer.from(payload);
  const out = Buffer.alloc(12 + p.length);
  out.writeUInt32BE(p.length, 0); t.copy(out, 4); p.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([t, p])), 8 + p.length);
  return out;
}
function encodePng() {
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    const row = y * (W * 4 + 1); raw[row] = 0;
    Buffer.from(data.buffer, y * W * 4, W * 4).copy(raw, row + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}
function drawIcon() {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = (x + y) / (W + H);
    px(x, y, mix(5, 8, t), mix(16, 48, t), mix(43, 115, t), 255);
  }
  glow(770, 240, 310, [0, 145, 255, 110], 2.3);
  roundedRect(52, 52, 920, 920, 118, [3, 19, 54, 118]);
  line(80, 86, 900, 78, 8, [71, 160, 255, 165]);
  line(86, 80, 76, 820, 5, [45, 175, 255, 125]);

  // Nova N mark
  poly([[285,245],[395,245],[395,585],[285,640]], [244,248,255,255]);
  poly([[405,245],[507,245],[725,585],[616,585]], [241,245,253,255]);
  poly([[635,245],[735,245],[735,585],[635,585]], [18,144,255,255]);
  poly([[285,245],[395,245],[728,585],[616,585]], [255,255,255,80]);

  // Starburst
  glow(750, 245, 130, [35, 183, 255, 200], 2.8);
  line(748, 110, 748, 355, 5, [229, 250, 255, 230]);
  line(620, 245, 885, 245, 5, [229, 250, 255, 230]);
  line(660, 155, 840, 335, 4, [160, 225, 255, 180]);
  line(840, 155, 660, 335, 4, [160, 225, 255, 180]);

  // Receipt
  roundedRect(430, 575, 170, 150, 22, [245, 248, 255, 255]);
  line(455, 620, 575, 620, 4, [163, 174, 199, 180]);
  line(455, 650, 545, 650, 4, [163, 174, 199, 180]);
  line(455, 680, 520, 680, 4, [163, 174, 199, 180]);

  // Terminal body and display
  poly([[250,720],[780,720],[835,860],[230,860]], [18,35,75,255]);
  poly([[300,648],[752,648],[803,782],[248,782]], [28,49,98,255]);
  poly([[335,668],[690,668],[720,750],[302,750]], [7,88,214,255]);
  textPOS(374, 686, 1.05);

  // Keypad
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) roundedRect(285 + c * 58, 790 + r * 44, 47, 27, 8, [75, 94, 138, 255]);
  roundedRect(562, 788, 52, 70, 9, [20, 143, 255, 255]);

  // Payment card
  roundedRect(735, 700, 168, 100, 13, [12, 103, 220, 255]);
  roundedRect(780, 733, 34, 28, 5, [237, 198, 111, 255]);
  line(842, 740, 860, 760, 3, [236, 248, 255, 230]);
  line(862, 730, 888, 770, 3, [236, 248, 255, 190]);
}
export function ensureNovaPosIconSource({ overwrite = true } = {}) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
  drawIcon();
  const png = encodePng();
  if (overwrite || !fs.existsSync(ICON_SOURCE)) fs.writeFileSync(ICON_SOURCE, png);
  if (overwrite || !fs.existsSync(DESKTOP_PNG)) fs.writeFileSync(DESKTOP_PNG, png);
  return { source: ICON_SOURCE, desktopPng: DESKTOP_PNG };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const written = ensureNovaPosIconSource({ overwrite: true });
  console.log(`Wrote Nova POS icon source: ${written.source}`);
  console.log(`Wrote Electron PNG icon: ${written.desktopPng}`);
}
