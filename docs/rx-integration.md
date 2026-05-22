# Rx integration (POS workspace tab)

The **Rx Integration** tab is the pharmacy differentiator on the till: Kroll bridge health, pickup sync, Rx payment write-back, combined receipts, status lookup, patient account charging, and delivery/payment matching.

## Workspace tab

| Section | Purpose |
|---------|---------|
| **Kroll** | Connection status from `GET /pos/health` (`kroll.connected`, message, last sync) |
| **Pickup sync** | Ready bag queue from `GET /pos/pickups` (+ optional Socket.IO when `REACT_APP_POS_PICKUP_SYNC=1`). **Attach to till** opens Sales with copay on the ticket |
| **Rx payments** | Queue of copay/pickup payments after charge; post via `POST /pos/rx/post-payment` |
| **Receipts** | Local combined sales (OTC lines + `rxCopay` / `pickupId`) for reprint reference |
| **Status lookup** | `GET /pos/rx/lookup?query=` when online; falls back to local `rx_work_items` cache |
| **Account charge** | Customers with Kroll ID or store charge balance — attach to till for billing |
| **Delivery match** | Log delivery refs against bag barcodes / POS invoices (local KV until head-office sync) |

## Sales register (unchanged flow)

- Rx bag scan on **Sales** still calls `lookupPosPickup` and adds copay to total.
- **Charge** sends `pickupId`, `rxCopay` on `POST /pos/complete-sale`.
- After a successful charge with Rx copay or pickup, a row is added to the local payment queue for Kroll posting.

## Permissions

`pos.rx` — admin, pharmacist, relief pharmacist, store manager, technician, assistant, cashier.

## Environment

| Variable | Purpose |
|----------|---------|
| `REACT_APP_POS_KROLL_ENABLED=1` | Show Kroll as enabled until health reports connection |
| `REACT_APP_POS_PICKUP_SYNC=1` | Live pickup queue over Socket.IO |
| `REACT_APP_POS_TRANSMIT_URL` | Base URL for `/pos/health`, `/pos/pickups`, `/pos/rx/*` |

## Receipt layout

Combined receipts use separate **RX ITEMS** and **FRONT STORE ITEMS** blocks — see `docs/receipts/clarityrx-pos-receipt-80mm.txt`.

## Transmit API (pharmacy backend)

Expected endpoints (implement on transmit service):

- `GET /pos/health` — include `kroll: { connected, message, lastSync }`
- `GET /pos/pickups`, `GET /pos/pickups/lookup?barcode=`, `POST /pos/pickups/sync`
- `GET /pos/rx/lookup?query=`
- `POST /pos/rx/post-payment`

Until those exist, the tab still works with local demo Rx rows, customer pickups, and queued payment rows.
