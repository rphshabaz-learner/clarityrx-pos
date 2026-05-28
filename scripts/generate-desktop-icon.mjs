#!/usr/bin/env node
/**
 * Builds desktop-shell/icon.png and icon.icns from the branded Nova POS icon.
 * On macOS this also creates desktop-shell/icon.icns for the dock/desktop launcher.
 */
import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ensureNovaPosIconSource } from "./write-nova-pos-icon.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const ICONS_DIR = path.join(REPO, "desktop-shell", "icons");
const SRC = path.join(ICONS_DIR, "icon-1024.png");
const ICONSET = path.join(ICONS_DIR, "icon.iconset");
const ICNS = path.join(REPO, "desktop-shell", "icon.icns");
const PNG = path.join(REPO, "desktop-shell", "icon.png");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function buildIconset() {
  ensureNovaPosIconSource({ overwrite: true });

  if (!fs.existsSync(SRC)) {
    console.error(`Missing ${SRC}. Nova POS icon source could not be generated.`);
    process.exit(1);
  }

  fs.rmSync(ICONSET, { recursive: true, force: true });
  fs.mkdirSync(ICONSET, { recursive: true });
  const sizes = [
    ["icon_16x16.png", 16],
    ["icon_16x16@2x.png", 32],
    ["icon_32x32.png", 32],
    ["icon_32x32@2x.png", 64],
    ["icon_128x128.png", 128],
    ["icon_128x128@2x.png", 256],
    ["icon_256x256.png", 256],
    ["icon_256x256@2x.png", 512],
    ["icon_512x512.png", 512],
    ["icon_512x512@2x.png", 1024],
  ];
  for (const [name, px] of sizes) {
    run("sips", ["-z", String(px), String(px), SRC, "--out", path.join(ICONSET, name)]);
  }
  try {
    execSync(`xattr -cr ${JSON.stringify(ICONSET)}`, { stdio: "ignore" });
  } catch {
    // optional
  }
  run("iconutil", ["-c", "icns", ICONSET, "-o", ICNS]);
  fs.copyFileSync(SRC, PNG);
  console.log(`Wrote ${ICNS} and ${PNG}`);
}

if (process.platform === "darwin") {
  buildIconset();
} else {
  ensureNovaPosIconSource({ overwrite: true });
  console.log("icon.icns requires macOS iconutil; copied Nova POS PNG only.");
}
