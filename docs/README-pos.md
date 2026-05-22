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

## Touch-screen till

Use a touch-capable monitor or AIO PC. The POS layout uses finger-sized controls (44px+ targets), `touch-action: manipulation` to reduce tap delay, and active-state styling so buttons work without a mouse. Barcode scanners still work as keyboard input into scan/search fields.

## Receipt printing

Receipt design references live in `docs/receipts/`.

- `clarityrx-pos-receipt-80mm.txt` is a 42-character thermal receipt layout for 80mm POS printers.
- `clarityrx-pos-receipt-preview.html` is a ClarityRx POS receipt preview modal with print queue, reprint, audit, barcode, and QR sections.

## Architecture

- Entry: `src/apps/pos/PosApp.jsx`
- Till UI: `src/modules/pos/*` (shared with pharmacy repo)
- Pickup API: main server `/api/pos/*` via `src/services/posApi.js`
- Main pharmacy app: POS nav item opens the standalone POS URL in a new tab
