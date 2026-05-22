# Inventory maintenance (POS)

Front-shop inventory maintenance lives in the **Inventory** workspace tab. Product master data is stored locally in IndexedDB (`pos_front_store_products`) and synced to the sales till catalog. Stock variances post through the existing transmit route.

## Permissions

- `pos.inventory` — admin, pharmacist, relief pharmacist, store manager, technician, assistant

## Departments

Standard pharmacy retail categories:

| ID | Label |
|----|--------|
| `otc` | OTC |
| `cosmetics` | Cosmetics |
| `convenience` | Convenience |
| `seasonal` | Seasonal |
| `home_healthcare` | Home healthcare |
| `vitamins` | Vitamins |
| `snacks` | Snacks |
| `front_shop` | Front shop |

## Sections

| Section | Features |
|---------|----------|
| **Products** | Product search, SKU maintenance, UPC / alternate barcodes, cost & retail pricing, department & sub-category, vendor mapping, target margin % |
| **Counts** | Physical inventory count → `POST /pos/inventory/adjustments` with `reason: physical_count` |
| **Expiry** | Lot numbers, expiry dates, 90-day warning |
| **Cycle counts** | Blind/open sessions, variance review, `reason: cycle_count` |
| **Labels** | Shelf label queue, browser print |

## API (transmit)

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/pos/inventory/adjustments` | `{ sku, quantityDelta }` — used for counts and cycle counts |

Product CRUD sync to the pharmacy backend is not yet wired; master data is local-first until `/pos/inventory/products` routes exist.

## Storage

- **Front-shop products:** `pos_front_store_products` (IndexedDB v12+)
- **McKesson wholesale index:** `inventory_items` (purchasing only — do not merge)

Seed data is copied from `posCatalog.js` on first open of the Inventory tab.
