#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const isProductionBuild =
  process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || process.env.CI === "true";

function loadEnvFile(filename) {
  const filePath = path.join(__dirname, "..", filename);
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
  return true;
}

if (!isProductionBuild) {
  process.exit(0);
}

loadEnvFile(".env.production");

const transmitUrl =
  process.env.REACT_APP_POS_TRANSMIT_URL ||
  process.env.NEXT_PUBLIC_POS_TRANSMIT_URL ||
  process.env.REACT_APP_POS_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL;

if (!transmitUrl) {
  console.warn(
    "[clarityrx-pos] Warning: REACT_APP_POS_TRANSMIT_URL is not set.\n" +
      "Add it in Vercel or commit .env.production, then redeploy:\n" +
      "  REACT_APP_POS_TRANSMIT_URL=https://<your-clarityrx-app>.vercel.app/api\n" +
      "  REACT_APP_POS_AUTH_URL=https://<your-clarityrx-app>.vercel.app/api"
  );
  process.exit(0);
}

if (/clarityrx-pos\.vercel\.app/i.test(transmitUrl)) {
  console.error(
    `REACT_APP_POS_TRANSMIT_URL must not point at the POS frontend (${transmitUrl}).\n` +
      "Use the main ClarityRx deployment where api/index.js serves Express."
  );
  process.exit(1);
}

console.log(`[clarityrx-pos] Using POS transmit API: ${transmitUrl}`);
