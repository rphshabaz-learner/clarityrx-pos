#!/usr/bin/env node
/**
 * Reliable NOVA dev launcher: frees port 3003 and clears a stale .next cache.
 */
import { spawn } from "child_process";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 3003);

function killPort() {
  try {
    const out = execSync(`lsof -ti:${PORT}`, { encoding: "utf8" }).trim();
    if (!out) return;
    for (const pid of out.split("\n")) {
      if (pid) process.kill(Number(pid), "SIGKILL");
    }
    console.log(`[nova:dev] Freed port ${PORT}`);
  } catch {
    /* not in use */
  }
}

function cleanNext() {
  const nextDir = path.join(ROOT, ".next");
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("[nova:dev] Cleared .next cache");
  }
}

function main() {
  killPort();
  cleanNext();

  const useTurbopack = process.env.NOVA_TURBOPACK === "1";
  const args = ["next", "dev", "-p", String(PORT)];
  if (useTurbopack) args.splice(2, 0, "--turbopack");

  console.log(`[nova:dev] Starting http://localhost:${PORT}`);
  const child = spawn("npx", args, {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env },
    shell: process.platform === "win32",
  });

  child.on("exit", (code) => process.exit(code ?? 0));
  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
}

main();
