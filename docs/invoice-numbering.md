# POS invoice numbering

Invoice numbers are assigned by the **pharmacy transmit API** when the till calls `POST /pos/complete-sale`. They must stay unique when many tills charge at the same time.

## Server (ClarityRx API)

Implementation: `clarityrx/server/lib/posInvoiceNumber.js`

| Setting | Env | Values |
|---------|-----|--------|
| Scope | `POS_INVOICE_NUMBER_SCOPE` | `global` (default) or `per_till` |

### Formats

| Scope | Example | Meaning |
|-------|---------|---------|
| **global** | `POS-000042` | One sequence for the whole store |
| **per_till** | `POS-T03-000042` | Separate sequence per till (03 = till 3) |

Allocation uses an atomic SQLite counter (`pos_invoice_sequences`) inside the same transaction as the sale insert. If a rare `UNIQUE` collision still occurs, `complete-sale` retries up to five times.

**Do not** use `COUNT(*) + 1` for invoice numbers — concurrent tills can receive the same value.

### Upgrade

Restart the pharmacy API after deploy so `migratePosInvoiceSequenceSchema()` runs. Existing `sales.invoice_number` values are used to seed counters so numbering continues without gaps.

## Till app (this repo)

The till stores the API’s `invoiceNumber` on each completed sale in IndexedDB. Before saving locally, `appendCompletedSale` checks for duplicates:

| Env | Purpose |
|-----|---------|
| `REACT_APP_POS_INVOICE_SCOPE` | Must match server scope for local duplicate detection (`global` or `per_till`) |

If the API returns a duplicate (misconfiguration or offline replay), the till shows an error instead of corrupting reports.

## Operations checklist

1. Set `POS_INVOICE_NUMBER_SCOPE` on the **server** to match store policy (most pharmacies use **global**).
2. Set `REACT_APP_POS_INVOICE_SCOPE` on each till to the same value.
3. After deploy, run one test charge per till and confirm invoice numbers increment correctly.
