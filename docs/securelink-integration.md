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
2. Set **Securelink terminal prefix** (default `POS-`). Till 3 maps to `POS-03`.
3. Ensure the physical pinpad is registered to that terminal id in your processor portal.

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

## Processor notes

Securelink is a POSitec/Finestra product name for integrated card capture. Your acquirer integration (Moneris, TD, etc.) lives server-side; map their SDK or gateway to the routes above.
