# ClarityRx POS

Standalone cashier till for ClarityRx pharmacies. Connects to the [ClarityRx](https://github.com/rphshabaz-learner/Clarityrx) pharmacy API for authentication and Kroll pickup sales.

**Repository:** https://github.com/rphshabaz-learner/clarityrx-pos

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

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `REACT_APP_API_BASE_URL` | `http://localhost:4000/api` | Pharmacy backend (auth, POS routes) |
| `REACT_APP_PACKAGING_SOCKET_URL` | API host without `/api` | Realtime `posPickupQueueUpdated` events |
| `REACT_APP_PHARMACY_APP_URL` | `http://localhost:3000` | Link back to main pharmacy workspace |

## Build

```bash
npm run build
```

Static output in `build/`.

## Deploy (Vercel)

This repo ships a **static CRA bundle only**. The Express API lives in the main [ClarityRx](https://github.com/rphshabaz-learner/Clarityrx) repo (`api/index.js` on Vercel).

In the **clarityrx-pos** Vercel project, set build-time env vars (then redeploy):

| Variable | Example | Notes |
|----------|---------|--------|
| `REACT_APP_API_BASE_URL` | `https://<clarityrx-app>.vercel.app/api` | Main pharmacy deployment with Express — **not** `https://clarityrx-pos.vercel.app/api` |
| `REACT_APP_PACKAGING_SOCKET_URL` | `https://<clarityrx-app>.vercel.app` | Socket.IO host (no `/api` suffix) |

If `REACT_APP_API_BASE_URL` is missing, the till incorrectly calls its own origin (`/api` on the static host). Vercel returns the SPA for GET and **HTTP 405** for POST.

Production builds log a warning when `REACT_APP_API_BASE_URL` is unset (`scripts/check-production-env.js`). The till will not work until you set it and redeploy.

## Related repos

- **ClarityRx** — main pharmacy workspace; sidebar POS opens this app
- **clarityrx/pos-server** (optional) — payables microservice on port 4001
