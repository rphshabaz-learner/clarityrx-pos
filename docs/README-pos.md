# ClarityRx POS (standalone app)

The POS till runs as a **separate frontend** from the main pharmacy workspace.

## Run locally

**Pharmacy app** (port 3000) and API (port 4000):

```bash
npm run start:cra   # or npm start (Next.js)
cd clarityrx/server && npm start
```

**POS app** (port 3001):

```bash
npm run start:pos
```

With Next.js dev server, POS is also available at `/pos` (e.g. `http://localhost:3000/pos`).

## Build

```bash
npm run build:pos
```

Output: `build-pos/` (CRA bundle with `REACT_APP_POS_APP=1`).

## Environment

| Variable | Purpose |
|----------|---------|
| `REACT_APP_POS_APP=1` | Select POS entry (set automatically by `start:pos` / `build:pos`) |
| `REACT_APP_POS_APP_URL` | URL of the POS app (main app opens this from the sidebar) |
| `REACT_APP_API_BASE_URL` | Pharmacy API (default `http://localhost:4000/api`) |
| `REACT_APP_POS_API_URL` | Optional dedicated POS microservice (`clarityrx/pos-server`) |

## Desktop (Electron)

```bash
npm run desktop:pos
```

Loads `http://localhost:3001` in the Electron shell.

## Architecture

- Entry: `src/apps/pos/PosApp.jsx`
- Till UI: `src/modules/pos/*` (shared with pharmacy repo)
- Pickup API: main server `/api/pos/*` via `src/services/posApi.js`
- Main pharmacy app: POS nav item opens the standalone POS URL in a new tab
