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
| `REACT_APP_POS_AUTH_URL` | Till operator sign-in (`/auth/*`) |
| `REACT_APP_POS_TRANSMIT_URL` | Sales + inventory transmit (`/pos/*`) |
| `REACT_APP_API_BASE_URL` | Fallback when `POS_*` URLs are unset |
| `REACT_APP_POS_STORE_ID` | Store id on transmit requests |
| `REACT_APP_POS_PICKUP_SYNC` | `1` = optional pickup queue Socket.IO |

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

## Purchasing & receiving

Workspace tab **Purchasing** — POs, EDI submit, receive (inventory sync), replenishment, backorders, RTV, damaged goods. See [purchasing-receiving.md](./purchasing-receiving.md).

## Customer management

Workspace tab **Customers** — profiles, loyalty, store charge, LTC billing, purchase/points history, special pricing, senior discounts, tax exemption, Kroll/Rx link, pickup tracking, care homes. See [customer-management.md](./customer-management.md).

## Securelink (integrated card)

When `REACT_APP_SECURELINK_ENABLED=1`, Debit and Credit Card charges use the pinpad before `complete-sale`. See [securelink-integration.md](./securelink-integration.md).

## Sales / Cash Register (main tab)

The **Sales** workspace tab (`till` id) is the core checkout screen:

| Area | Contents |
|------|----------|
| **Left** | Barcode/SKU scan, Rx bag scan, sale lines (qty, price, line discount), cart/coupon/loyalty discounts, running total |
| **Right** | Touch payment methods (cash, debit/credit, gift card, insurance), split payments, hot products (favorites), department shortcuts |

Patient/customer lookup and pickup queue live in the top header bar. Manager override (header) enables per-line **price override**. Card sales and totals over $25 prompt **signature capture** before charge.

Demo coupons: `SAVE10` (10% off OTC), `SAVE5` ($5 off). Loyalty redeems at 100 points = $1.

## Architecture

- Entry: `src/index.js` → `App.jsx`
- Till UI: `src/modules/pos/*`, `src/components/pos/sales/PosSalesRegisterPanel.jsx`
- Auth: `REACT_APP_POS_AUTH_URL` → `AuthContext` (`/auth/*`)
- Pharmacy boundary: `REACT_APP_POS_TRANSMIT_URL` → `posApi.js` (sales + inventory only)
- Main pharmacy app: separate workspace; opens this till in a new tab
