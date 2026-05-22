#!/usr/bin/env node

const isProductionBuild =
  process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || process.env.CI === "true";

if (!isProductionBuild) {
  process.exit(0);
}

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  console.warn(
    "[clarityrx-pos] Warning: REACT_APP_API_BASE_URL is not set.\n" +
      "The deployed till will not reach the pharmacy API until you add it in Vercel:\n" +
      "  REACT_APP_API_BASE_URL=https://<your-clarityrx-app>.vercel.app/api\n" +
      "  REACT_APP_PACKAGING_SOCKET_URL=https://<your-clarityrx-app>.vercel.app\n" +
      "Use the main ClarityRx deployment (Express via api/index.js), not clarityrx-pos.vercel.app."
  );
  process.exit(0);
}

if (/clarityrx-pos\.vercel\.app/i.test(apiBaseUrl)) {
  console.error(
    `REACT_APP_API_BASE_URL must not point at the POS frontend (${apiBaseUrl}).\n` +
      "Use the main ClarityRx deployment where api/index.js serves Express."
  );
  process.exit(1);
}
