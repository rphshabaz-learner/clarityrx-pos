# Canadian provincial tax (GST / HST / PST / QST)

ClarityRx POS applies **province-dependent** tax at the till, prints an **audit-ready tax breakdown** on receipts, and stores component amounts on each completed sale for reporting.

## Configuration

**Manage → Till options → Canadian tax**

| Setting | Purpose |
|--------|---------|
| **Province** | Selects GST-only, HST, GST+PST, or GST+QST regime |
| **GST/HST business number (BN)** | Printed on receipts (CRA registration) |
| **Shelf pricing** | **Exclusive** — tax added at till; **Inclusive** — shelf prices include tax |
| **Receipt store / address / phone** | Header on thermal receipts |

Storage: `src/lib/tax/posTaxConfig.js` (`clarityrx-pos-tax-v1`).

## Tax regimes (by province)

| Provinces | Components |
|-----------|------------|
| AB, NT, NU, YT | GST 5% |
| BC, MB | GST 5% + PST 7% |
| SK | GST 5% + PST 6% |
| ON | HST 13% |
| NB, NL, PE | HST 15% |
| NS | HST 14% |
| QC | GST 5% + QST 9.975% (QST on price + GST) |

Implementation: `src/lib/tax/canadianProvincialTax.js`.

## Register behaviour

- **Tax exempt** (till checkbox or customer certificate) — all components zero; receipt shows `TAX STATUS: EXEMPT`.
- **Line classes** (optional on cart lines): `standard`, `exempt`, `zero` — for mixed baskets.
- **Discounts / loyalty** — tax is calculated on the post-discount taxable subtotal, allocated across lines proportionally.

## Receipt requirements

Thermal layout (`src/lib/receipt/saleReceiptFormat.js` and `docs/receipts/clarityrx-pos-receipt-80mm.txt`) includes:

- **Business number (BN)** when configured
- **Taxes charged** — GST, HST, PST, and/or QST lines
- **Transaction date and time**
- **Itemized purchases** (SKU/name, qty, line total)
- Invoice #, till, shift, cashier, province

## Refunds

`computeRefundTaxReversal()` in `canadianProvincialTax.js` reverses tax **proportionally** from the original sale’s stored `taxBreakdown` (for partial refunds). Persist refunds with `transactionType: "refund"` and negative component amounts on the receipt.

## Audit records

Each completed sale snapshot (`buildCompletedSaleSnapshot`) stores:

- `taxBreakdown` — `{ GST, HST, PST, QST, totalTax, provinceCode, pricingMode, components[] }`
- `businessNumber`, `provinceCode`, `transactionType`
- `chargedAt` / `businessDate` for reporting

Daily aggregates expose `taxComponents` via `aggregateTaxComponents()` in `src/lib/reporting/reportAggregates.js`.

## Transmit API

`completePosSale` includes `provinceCode`, `businessNumber`, `taxPricingMode`, and `taxBreakdown` for pharmacy back-end audit sync.
