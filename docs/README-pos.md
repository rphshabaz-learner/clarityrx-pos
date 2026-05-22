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
| `REACT_APP_POS_INVOICE_SCOPE` | `global` or `per_till` — must match server `POS_INVOICE_NUMBER_SCOPE` |
| `REACT_APP_POS_PICKUP_SYNC` | `1` = optional pickup queue Socket.IO |
| `REACT_APP_POS_DEVICE_TILL` | Till number for this physical register (1–12). Baked into the build or launcher env. |
| `REACT_APP_POS_DEVICE_TILL_LOCK` | `1` (default when `DEVICE_TILL` is set) = hide header till picker on this device |

### Device till binding

Each physical till should keep a stable till number so invoice sequences, pinpad terminal IDs, shift cash, and register-local cart state stay aligned.

**Recommended for production registers:**

1. Set `REACT_APP_POS_DEVICE_TILL` per machine (or in the macOS Desktop launcher shell before `npm run desktop:pos`).
2. Leave lock enabled so cashiers cannot change till from the header dropdown.
3. In **Manage → Till options → This workstation**, managers can also assign and lock a till; Electron stores the value in encrypted local storage plus `localStorage`.

Load order: deployment env → workstation config (secure storage on Electron, then `localStorage`) → last session till picker.

## Desktop (Electron)

**Desktop shortcut (macOS):**

```bash
npm run desktop:install
```

Creates **ClarityRx POS.app** on your Desktop with the till icon.

**Launch from terminal:**

```bash
npm run desktop:pos
```

Starts the CRA dev server on port 3001 and loads it in the Electron shell (`window.clarityRxElectron` for workstation lock).

## Touch-screen till

Use a touch-capable monitor or AIO PC. The POS layout uses finger-sized controls (44px+ targets), `touch-action: manipulation` to reduce tap delay, and active-state styling so buttons work without a mouse. Barcode scanners still work as keyboard input into scan/search fields.

### UI color coding (cashier)

| Color | Meaning |
|-------|---------|
| Blue | Rx (pickup queue, bag scan, Kroll status) |
| Green | Payments (tender methods, Charge) |
| Orange | Warnings (demographic confirm, suspended sale, real-time compliance alerts) |
| Purple | Loyalty (customers tab, redemption lines) |
| Red | Controlled overrides (manager override banner and actions) |

Keyboard shortcuts on the sales register: **F1** scan, **F2** Rx bag, **F3** charge, **F4** suspend, **F5** resume; **F7** manager override in the header.

Real-time header warnings (refunds, voids, controlled items, session timeout, till variance, price override): [real-time-warnings.md](./real-time-warnings.md).

## Receipt printing

Receipt design references live in `docs/receipts/`.

- `clarityrx-pos-receipt-80mm.txt` is a 42-character thermal receipt layout for 80mm POS printers.
- `clarityrx-pos-receipt-preview.html` is a ClarityRx POS receipt preview modal with print queue, reprint, audit, barcode, and QR sections.
- Card masking, forbidden fields (CVV / full PAN / expiry in logs), and security controls: [receipt-rules.md](./receipt-rules.md).
- Canadian GST/HST/PST/QST by province, receipt tax breakdown, and refund reversal: [canadian-tax.md](./canadian-tax.md).

## Mobile handheld

Workspace tab **Handheld** — shelf lookup, stock checks, PO receiving by scan, and shelf price verification. Optimized for phones and wedge scanners. See [handheld.md](./handheld.md).

## Purchasing & receiving

Workspace tab **Purchasing** — POs, EDI submit, receive (inventory sync), replenishment, backorders, RTV, damaged goods. See [purchasing-receiving.md](./purchasing-receiving.md).

## Customer management

Workspace tab **Customers** — profiles, loyalty, store charge, LTC billing, purchase/points history, special pricing, senior discounts, tax exemption, Kroll/Rx link, pickup tracking, care homes. See [customer-management.md](./customer-management.md).

**Privacy:** PIPEDA and provincial rules apply to patient data, loyalty, profiles, Rx pickup, and purchase history on the till. See [privacy-compliance.md](./privacy-compliance.md).

## Gift cards

Workspace tab **Gift Cards** — activation, reload, balance check, registry; gift card tender on Sales redeems at checkout. See [gift-cards.md](./gift-cards.md).

## Age-restricted products

Nicotine, lottery, alcohol, cannabis, and similar SKUs require DOB verification (or manager override) at scan and checkout. Configure classes and store minimum age under **Manage**; assign per SKU under **Inventory → Products**. See [age-restricted-products.md](./age-restricted-products.md).

## Staff management

Workspace tab **Staff** — permissions matrix, role access, shift tracking, manager override audit. See [staff-management.md](./staff-management.md).

## Rx integration

Workspace tab **Rx Integration** — Kroll connection, pickup sync, Rx payment posting, combined Rx + retail receipts, prescription status lookup, patient account charging, delivery/payment matching. See [rx-integration.md](./rx-integration.md).

## Self checkout

Workspace tab **Self Checkout** — customer-facing scan-and-pay kiosk, card payment on pinpad, receipt options (print / email / SMS / none), loyalty entry. See [self-checkout.md](./self-checkout.md).

## Securelink (integrated card)

When `REACT_APP_SECURELINK_ENABLED=1`, Debit and Credit Card charges use the pinpad before `complete-sale`. See [securelink-integration.md](./securelink-integration.md).

## Sales / Cash Register (main tab)

The **Sales** workspace tab (`till` id) is the core checkout screen:

| Area | Contents |
|------|----------|
| **Left** | Barcode/SKU scan, Rx bag scan, sale lines (qty, price, line discount), cart/coupon/loyalty discounts, running total |
| **Right** | Touch payment methods (cash, debit/credit, gift card, insurance), split payments, hot products (favorites), department shortcuts |

Patient/customer lookup and pickup queue live in the top header bar. **Manager override** (header, per till, 5 minutes) is required for some actions when the signed-in role is not manager/pharmacist-level — including line **price override** on Sales and **gift card activation/reload**. Override enablement and protected actions are logged to local audit (Reports → Audit logs). Card sales and totals over $25 prompt **signature capture** before charge.

**Payment security (PCI):** Integrated card capture via Securelink — no PAN on the till; tokenized `reference` / `authCode` and masked `last4` only. See [pci-dss-payment-security.md](./pci-dss-payment-security.md) and [securelink-integration.md](./securelink-integration.md).

Demo coupons: `SAVE10` (10% off OTC), `SAVE5` ($5 off). Loyalty redeems at 100 points = $1.

## Invoice numbering

Concurrent tills rely on the pharmacy API for atomic invoice sequences. See [invoice-numbering.md](./invoice-numbering.md).

Register-local browser state (cart, attached customer, suspended sale, favorites) is scoped per **workspace + window + till** so switching till numbers on one workstation does not overwrite another register’s in-progress sale. On locked devices the till number does not change in the header, which avoids accidental cross-till data bleed on a single PC.

### Cash shift modes

| Mode | Behaviour |
|------|-----------|
| **Auto** (default) | **Transaction till** when the header till picker is available (workstation not locked): each cash sale opens the drawer and starts/closes a shift for that sale. **Session till** when the till is locked to the device: manual Open/Close shift in the header. |
| **Session** | Cashier opens and closes shift manually; drawer opens on cash sales and No sale. |
| **Transaction** | Always per-sale shift + drawer on cash (even on locked registers). Configure in **Manage → Till options → Cash shift mode**. |

Drawer signal: browser event `clarityrx:cash-drawer-open` and Electron `openCashDrawer` when packaged.

## Architecture

- Entry: `src/index.js` → `App.jsx`
- Till UI: `src/modules/pos/*`, `src/components/pos/sales/PosSalesRegisterPanel.jsx`
- Auth: `REACT_APP_POS_AUTH_URL` → `AuthContext` (`/auth/*`)
- Pharmacy boundary: `REACT_APP_POS_TRANSMIT_URL` → `posApi.js` (sales + inventory only)
- Main pharmacy app: separate workspace; opens this till in a new tab
