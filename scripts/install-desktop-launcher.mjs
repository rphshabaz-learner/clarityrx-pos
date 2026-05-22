#!/usr/bin/env node
/**
 * Installs a macOS Desktop launcher (.app) for ClarityRx POS.
 * Double-click opens the Electron till (starts dev server if needed).
 */
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const APP_NAME = "ClarityRx POS";
const ICON_ICNS = path.join(REPO_ROOT, "desktop-shell", "icon.icns");
const ICON_PNG = path.join(REPO_ROOT, "desktop-shell", "icon.png");

function desktopDir() {
  return path.join(os.homedir(), "Desktop");
}

function escapePlist(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function installMacApp(targetPath) {
  const contents = path.join(targetPath, "Contents");
  const macos = path.join(contents, "MacOS");
  const resources = path.join(contents, "Resources");
  fs.rmSync(targetPath, { recursive: true, force: true });
  fs.mkdirSync(macos, { recursive: true });
  fs.mkdirSync(resources, { recursive: true });

  const launcher = path.join(macos, "ClarityRx POS");
  const shell = `#!/bin/bash
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
unset ELECTRON_RUN_AS_NODE
# Per-register till (uncomment and set for this Mac):
# export REACT_APP_POS_DEVICE_TILL=1
# export REACT_APP_POS_DEVICE_TILL_LOCK=1
cd ${JSON.stringify(REPO_ROOT)}
if [[ ! -d node_modules/electron ]]; then
  osascript -e 'display notification "Installing dependencies…" with title "ClarityRx POS"'
  npm install
fi
npm run desktop:pos
`;
  fs.writeFileSync(launcher, shell, { mode: 0o755 });

  const iconSrc = fs.existsSync(ICON_ICNS) ? ICON_ICNS : ICON_PNG;
  if (fs.existsSync(iconSrc)) {
    fs.copyFileSync(iconSrc, path.join(resources, "app.icns"));
  }

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>ClarityRx POS</string>
  <key>CFBundleIconFile</key>
  <string>app</string>
  <key>CFBundleIdentifier</key>
  <string>com.clarityrx.pos.desktop</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${escapePlist(APP_NAME)}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>CFBundleVersion</key>
  <string>0.1.0</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
`;
  fs.writeFileSync(path.join(contents, "Info.plist"), plist);

  try {
    execSync(`xattr -cr ${JSON.stringify(targetPath)}`, { stdio: "ignore" });
  } catch {
    // optional
  }
}

function main() {
  if (process.platform !== "darwin") {
    console.error("Desktop launcher install is supported on macOS only.");
    process.exit(1);
  }
  if (!fs.existsSync(ICON_PNG) && !fs.existsSync(ICON_ICNS)) {
    console.error("Missing desktop-shell/icon.png — run: npm run desktop:icon");
    process.exit(1);
  }

  const target = path.join(desktopDir(), `${APP_NAME}.app`);
  installMacApp(target);
  console.log(`Installed: ${target}`);
  console.log("Double-click the Desktop icon to open the till.");
}

main();
