#!/usr/bin/env node
/** Writes electron/path.txt when the binary exists but postinstall skipped it. */
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const electronDir = path.join(__dirname, "..", "node_modules", "electron");
const pathFile = path.join(electronDir, "path.txt");

function platformPath() {
  switch (process.env.npm_config_platform || os.platform()) {
    case "mas":
    case "darwin":
      return "Electron.app/Contents/MacOS/Electron";
    case "freebsd":
    case "openbsd":
    case "linux":
      return "electron";
    case "win32":
      return "electron.exe";
    default:
      return null;
  }
}

const rel = platformPath();
if (!rel) process.exit(0);

const binary = path.join(electronDir, "dist", rel);
const frameworks =
  process.platform === "darwin"
    ? path.join(electronDir, "dist", "Electron.app", "Contents", "Frameworks")
    : null;
if (!fs.existsSync(binary) || (frameworks && !fs.existsSync(frameworks))) {
  try {
    const { version } = JSON.parse(fs.readFileSync(path.join(electronDir, "package.json"), "utf8"));
    const arch = process.arch === "x64" && os.platform() === "darwin" ? "x64" : process.arch;
    const zipName = `electron-v${version}-darwin-${arch}.zip`;
    const cacheRoot = path.join(os.homedir(), "Library", "Caches", "electron");
    const zipPath = findZip(cacheRoot, zipName);
    if (zipPath) {
      fs.rmSync(path.join(electronDir, "dist"), { recursive: true, force: true });
      run("unzip", ["-q", zipPath, "-d", path.join(electronDir, "dist")]);
    }
  } catch {
    console.warn("[ensure-electron] Electron binary incomplete; run: npm rebuild electron");
    process.exit(0);
  }
}

function findZip(dir, name) {
  if (!fs.existsSync(dir)) return null;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const hit = findZip(full, name);
      if (hit) return hit;
    } else if (entry.name === name) {
      return full;
    }
  }
  return null;
}

if (!fs.existsSync(pathFile) || fs.readFileSync(pathFile, "utf8").trim() !== rel) {
  fs.writeFileSync(pathFile, rel, "utf8");
}
