# Mobile handheld (POS)

The **Handheld** workspace tab provides scan-first workflows for phones and wireless barcode scanners (keyboard-wedge input). Layout is capped at 480px width with large tap targets.

## Permissions

- `pos.handheld` — admin, pharmacist, relief pharmacist, store manager, technician, assistant
- **Receiving** also requires `pos.purchasing` (same roles)

Cashiers do not receive handheld access by default.

## Tasks

| Task | What it does | Backend |
|------|----------------|---------|
| **Shelf inventory** | Scan SKU/UPC → on-hand, department, retail | Local front-shop catalog (`pos_front_store_products`) |
| **Stock check** | Scan → enter physical count → post variance | `POST /pos/inventory/adjustments` (`reason: physical_count`) |
| **Receiving** | Select PO → scan lines (+1 per scan) or edit qty → confirm | `POST /pos/inventory/adjustments` (`reason: purchase_receive`) + PO update |
| **Price verification** | Scan → enter shelf tag price → match/mismatch vs system retail | Read-only compare (no price change on handheld) |

## Hardware

- Any device that runs the POS web app in a mobile browser
- Bluetooth/USB scanners that type into the focused scan field followed by Enter
- Same touch guidelines as the till UI (`pointer: coarse` styles)

## Related

- Full inventory maintenance (products, cycle counts, labels): see [inventory-maintenance.md](./inventory-maintenance.md) — desktop-oriented panel, same product store
- Desktop receiving: [purchasing-receiving.md](./purchasing-receiving.md)
