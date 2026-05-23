# NOVA POS

Standalone pharmacy front-store / OTC point-of-sale demo. This app is **not** part of the ClarityRx POS cashier build — it has its own dependencies, dev server, and deploy path.

## Prerequisites

- Node.js 20.x

## Quick start

```bash
cd nova
npm install
npm run dev
```

Opens at **http://localhost:3003** (port is freed automatically on each dev start).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 3003 (clears stale `.next` if needed) |
| `npm run dev:turbo` | Same, with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

Override the port: `PORT=3010 npm run dev`

## Routes

- `/login` — operator pick + PIN
- `/till` — till selection
- `/pos` — checkout (cart, scan, payments)
- `/admin` — mock admin + AI assistant

Data is in-memory mock catalog and transactions for demos; wire your API when integrating with a backend.

## Production

```bash
npm run build
npm run start
```

Deploy like any Next.js 15 app (Vercel, Docker, etc.). No dependency on the parent `clarityrx-pos` repo.
