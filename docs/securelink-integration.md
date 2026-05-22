# Securelink — integrated debit & credit

ClarityRx POS can drive an integrated pinpad (Securelink-style flow used by Canadian pharmacy tills with Moneris, TD, Global Payments, or Chase). The till does **not** talk to the acquirer directly; the **ClarityRx API** owns merchant credentials and pinpad routing.

## Enable on the till

```bash
# .env or Vercel env
REACT_APP_SECURELINK_ENABLED=1
```

Optional local testing without backend routes:

```bash
REACT_APP_SECURELINK_MOCK=1
```

Mock mode auto-approves after ~1s (development only).

## Till setup

1. Open **Manage → Till options**.
2. Under **Pinpad terminal mapping**, set each till’s terminal ID (defaults use prefix `POS-`: till 1 → `POS-01`, till 10 → `POS-10`). Override any row when your processor uses non-standard ids.
3. Ensure each physical pinpad is registered to the matching terminal id in your processor portal.

## Checkout flow

1. Cashier selects **Debit** or **Credit Card**.
2. Tap **Charge** — demographic prompt still applies when enabled.
3. Till calls `POST /api/pos/securelink/initiate` with amount, till, terminal id, and card type.
4. UI polls `GET /api/pos/securelink/payments/:id` until `approved`, `declined`, `cancelled`, or timeout.
5. On approval, till calls `POST /api/pos/complete-sale` with `cardPayment` (reference, auth code, last4, brand, terminal).

Cash, Insurance, and Other skip Securelink.

## Backend contract (ClarityRx server)

Implement in the main [ClarityRx](https://github.com/rphshabaz-learner/Clarityrx) API:

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/pos/securelink/initiate` | Start pinpad sale |
| `GET` | `/pos/securelink/payments/:paymentId` | Poll status |
| `POST` | `/pos/securelink/payments/:paymentId/cancel` | Void in-flight attempt |

### Initiate body

```json
{
  "amountCents": 1250,
  "payMethod": "debit",
  "tillNumber": 3,
  "terminalId": "POS-03"
}
```

### Poll response states

- `pending` — waiting on customer / pinpad
- `approved` — include `reference`, `authCode`, `last4`, `cardBrand`, `entryMethod`
- `declined` | `cancelled` | `error` | `failed` — include `message`

### Complete-sale extension

Existing `POST /pos/complete-sale` body may include:

```json
{
  "cardPayment": {
    "reference": "…",
    "authCode": "…",
    "last4": "4242",
    "cardBrand": "Visa",
    "entryMethod": "chip",
    "terminalId": "POS-03"
  }
}
```

Store these fields on the sale record and print them on customer/merchant copies when **Print merchant copy for card payments** is enabled.

Receipts must show the masked PAN only (`**** **** **** 1234`) plus auth/brand/entry — never CVV, full PAN, or expiry. See [receipt-rules.md](./receipt-rules.md). The till sanitizes `cardPayment` via `sanitizeCardPaymentForStorage()` before `complete-sale`. Use `formatReceiptCardLines` from `src/lib/pci/cardDisplay.js` so customer copies never show a full PAN.

PCI scope and operational checklist: [pci-dss-payment-security.md](./pci-dss-payment-security.md).

## Processor notes

Securelink is a POSitec/Finestra product name for integrated card capture. Your acquirer integration (Moneris, TD, etc.) lives server-side; map their SDK or gateway to the routes above.
