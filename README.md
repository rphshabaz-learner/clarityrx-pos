# ClarityRx POS

Standalone cashier till for ClarityRx pharmacies. Runs **independently** of the pharmacy workspace; the backend receives **completed sales (transactions)** and **inventory adjustments** only.

**Repository:** https://github.com/rphshabaz-learner/clarityrx-pos

## Touch-screen monitors

The till UI is built for **touch displays** (USB/HDMI touch monitors, Windows touch PCs, kiosk browsers):

- Tap targets are at least **44×44 px** on coarse pointers (finger touch).
- Favorites, pickup queue, payment methods, and cart controls use **tap** feedback (not hover-only).
- Run in **Chrome or Edge** full screen on the till PC; pair with a USB barcode scanner for Rx bag and SKU entry.

## Prerequisites

- Node.js 20.x
- ClarityRx API running (`clarityrx/server` on port 4000)

## Quick start

```bash
npm install
cp .env.example .env
npm start
```

Opens at **http://localhost:3001**.

## Desktop app (macOS)

Install a **Desktop icon** that launches the till in Electron:

```bash
npm install
npm run desktop:install   # creates "ClarityRx POS.app" on your Desktop
```

Double-click **ClarityRx POS** on the Desktop. The first launch runs `npm install` if needed, starts the dev server on port 3001, and opens the Electron window.

To launch from the terminal without installing:

```bash
npm run desktop:pos
```

Scripts unset `ELECTRON_RUN_AS_NODE` so the real Electron window opens (some dev shells set that variable).

Regenerate the dock/Desktop icon assets after changing `desktop-shell/icons/icon-1024.png`:

```bash
npm run desktop:icon
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `REACT_APP_POS_AUTH_URL` | `http://localhost:4000/api` | Till operator sign-in (`/auth/*`) |
| `REACT_APP_POS_TRANSMIT_URL` | `http://localhost:4000/api` | Outbound sales + inventory (`/pos/*`) |
| `REACT_APP_API_BASE_URL` | (fallback) | Sets both URLs when `POS_*` are unset |
| `REACT_APP_POS_STORE_ID` | `default-store` | Store id on transmit requests |
| `REACT_APP_POS_PICKUP_SYNC` | (unset) | `1` = poll/Socket.IO pickup queue (optional) |
| `REACT_APP_POS_DEVICE_TILL` | (unset) | Till number (1–12) for this physical register |
| `REACT_APP_POS_DEVICE_TILL_LOCK` | (unset) | `1` = lock header till picker when `DEVICE_TILL` is set (default locked) |
| `REACT_APP_POS_PHARMACY_AUDIT` | (unset) | `1` = forward audit to pharmacy `/audit/events` |
| `REACT_APP_SECURELINK_ENABLED` | (unset) | `1` = integrated pinpad for Debit / Credit Card |
| `REACT_APP_SECURELINK_MOCK` | (unset) | `1` = mock pinpad approval (dev only) |

## Build

```bash
npm run build
```

Static output in `build/`.

## Deploy (Vercel)

This repo ships a **static CRA bundle only**. The Express API lives in the main [ClarityRx](https://github.com/rphshabaz-learner/Clarityrx) repo (`api/index.js` on Vercel).

This repo commits `.env.production` and `vercel.json` with the current ClarityRx API host. Update both when the pharmacy deployment URL changes, then redeploy.

You can override via the **clarityrx-pos** Vercel project env vars (then redeploy):

| Variable | Example | Notes |
|----------|---------|--------|
| `REACT_APP_API_BASE_URL` | `https://<clarityrx-app>.vercel.app/api` | Main pharmacy deployment with Express — **not** `https://clarityrx-pos.vercel.app/api` |
| `REACT_APP_PACKAGING_SOCKET_URL` | `https://<clarityrx-app>.vercel.app` | Socket.IO host (no `/api` suffix) |

If `REACT_APP_API_BASE_URL` is missing, the till incorrectly calls its own origin (`/api` on the static host). Vercel returns the SPA for GET and **HTTP 405** for POST.

Production builds log a warning when `REACT_APP_API_BASE_URL` is unset (`scripts/check-production-env.js`). The till will not work until you set it and redeploy.

## Pharmacy boundary

| Stays on the till (local) | Transmitted to pharmacy API |
|---------------------------|-----------------------------|
| Favorites, demographics, till layout | `POST /pos/complete-sale` (transaction) |
| Purchase orders, replenishment rules, RTV, damaged goods (IndexedDB) | `POST /pos/inventory/adjustments` (sales + **receiving**) |
| Activity log (IndexedDB) | `POST /pos/purchasing/*` (EDI submit, catalog/invoice download when backend routes exist) |
| Operator session | Rx bag lookup only when scanning (`/pos/pickups/lookup`) |

See [docs/purchasing-receiving.md](docs/purchasing-receiving.md) for wholesaler PO/receive workflows.

Clinical queues, patients, prescriptions, and pharmacy audit streams are **not** used by this app.

## NOVA POS (separate app)

**NOVA** is a standalone Next.js demo till in [`nova/`](nova/). It does not share the ClarityRx POS build, Electron launcher, or `REACT_APP_*` env from this repo.

```bash
cd nova && npm install && npm run dev
```

See [nova/README.md](nova/README.md).

## Related repos

- **ClarityRx** — main pharmacy workspace (separate UI; opens this till in a new tab)
- **clarityrx/pos-server** (optional) — dedicated transmit/auth service on port 4001
