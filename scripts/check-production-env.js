#!/usr/bin/env node

const isProductionBuild =
  process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || process.env.CI === "true";

if (!isProductionBuild) {
  process.exit(0);
}

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  console.error(
    "REACT_APP_API_BASE_URL is required for production builds.\n" +
      "Set it in Vercel (or .env.production) to the ClarityRx Express API, e.g. https://<your-clarityrx-app>.vercel.app/api\n" +
      "Do not use the clarityrx-pos static frontend URL — that host has no /api routes."
  );
  process.exit(1);
}

if (/clarityrx-pos\.vercel\.app/i.test(apiBaseUrl)) {
  console.error(
    `REACT_APP_API_BASE_URL must not point at the POS frontend (${apiBaseUrl}).\n` +
      "Use the main ClarityRx deployment where api/index.js serves Express."
  );
  process.exit(1);
}
