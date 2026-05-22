# Purchasing & receiving (POS)

The **Purchasing** workspace tab supports wholesaler ordering and receiving from the till. Data is stored locally in IndexedDB; EDI and catalog/invoice downloads call the pharmacy transmit API when routes exist.

## Wholesalers

| ID | Label | EDI submit | Catalog | Invoices |
|----|-------|------------|---------|----------|
| `mckesson` | McKesson | Yes | Yes | Yes |
| `kohl_frisch` | Kohl & Frisch | Yes | Yes | Yes |
| `imperial` | Imperial Distributors | Yes | Yes | Yes |
| `head_office` | Head office promotions | No | Yes | No |

## Features

- **Purchase orders** — Draft, line entry, catalog search (local McKesson/inventory index), EDI submit.
- **Receiving** — Receive against submitted/partial POs; posts stock via `POST /pos/inventory/adjustments` (positive `quantityDelta`).
- **Automatic replenishment** — Min/max rules; build draft PO when on-hand ≤ minimum.
- **Backorder tracking** — Derived from ordered − received on open POs.
- **Cost updates** — Unit cost captured at receive time on each line.
- **RTV** — Return-to-vendor drafts and EDI submit.
- **Damaged goods** — Log, disposition (return / destroy / credit), resolve.

## Transmit API (pharmacy backend)

Implement on the main ClarityRx API (same host as `REACT_APP_POS_TRANSMIT_URL`):

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/pos/purchasing/orders/submit` | EDI/API PO submit |
| `POST` | `/pos/purchasing/catalog/download` | Pull wholesaler catalog |
| `POST` | `/pos/purchasing/invoices/download` | Pull open invoices |
| `POST` | `/pos/purchasing/returns/submit` | RTV EDI submit |

If a route is missing (404/405/501), the POS falls back to a **local stub** (queued locally; user sees an info message).

## Inventory sync on receive

Each received line with `qtyThisPass > 0` becomes:

```json
{
  "sku": "<line sku>",
  "quantityDelta": <qty received this pass>,
  "tillNumber": <active till>,
  "purchaseOrderNumber": "<PO number>",
  "invoiceNumber": "<optional>",
  "reason": "purchase_receive"
}
```

## Roles

`pos.purchasing` — admin, pharmacist, relief pharmacist, store manager, technician, assistant (not cashier/student).

## Local storage

IndexedDB (`clarityrx-local-v1`, version 9):

- `purchase_orders`
- `replenishment_rules`
- `vendor_returns`
- `damaged_goods`
- `inventory_items` (catalog search for McKesson-style imports)
