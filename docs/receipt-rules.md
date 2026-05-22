# Receipt rules & payment security

ClarityRx POS follows PCI-aligned rules for card-present sales: integrated pinpad capture only, masked card data on receipts, and no sensitive card data in local logs.

## Receipt masking

Customer and merchant thermal copies may show **last four digits only**, grouped as:

```text
**** **** **** 1234
```

Implementation: `maskCardLast4()` and `formatCardReceiptLines()` in `src/lib/receipt/paymentReceiptRules.js`.

Example card block on an 80mm receipt:

```text
==========================================
PAYMENT
VISA **** **** **** 4242
AUTH A1B2C3
CHIP
TOTAL                                $12.50
==========================================
```

Loyalty program numbers may use a shorter mask (e.g. `********1234`) — that is separate from payment card masking.

## Never display or log

| Data | Receipts | Local activity log | Server `complete-sale` |
|------|----------|--------------------|-------------------------|
| CVV / CVC | Never | Never | Never |
| Full PAN | Never | Never | Never |
| Card expiry | Never | Never | Never |
| Last 4 + auth + brand + entry | Yes (masked PAN) | Last 4 masked only if needed | Yes (`cardPayment` subset) |

`logActivity` in `PosAppDataProvider` runs all `detail` objects through `redactSensitivePaymentFields()` before IndexedDB storage.

## Required features (POS till)

| Requirement | Where it lives |
|-------------|----------------|
| **Terminal pairing** | Manage → **Pinpad terminal mapping** (`PosManagePanel`); defaults in `resolveSecurelinkTerminalId()` (`src/lib/securelinkConfig.js`). Each till maps to a processor terminal id (`POS-01` …). |
| **Secure PIN pad** | Card debit/credit flows use Securelink pinpad APIs — `useSecurelinkPayment` → pharmacy API `/pos/securelink/*`. PAN/CVV never touch the browser. See [securelink-integration.md](./securelink-integration.md). |
| **Session timeout** | Idle lock via `AuthContext` (`sessionTimeoutMinutes` from `/auth/security-bootstrap`, overridable in session preferences). Workstation locks after idle threshold. |
| **Failed login lockout** | Enforced by the pharmacy **auth API** (rate limit / account lock). Till surfaces the server error on sign-in; configure lockout policy on the server, not in the POS bundle. |
| **Device authorization** | Every auth and POS request sends `X-ClarityRx-Device-Id`, `X-ClarityRx-Workstation-Id`, and workspace headers (`src/session/workspaceSession.ts`). Optional per-register till lock: `REACT_APP_POS_DEVICE_TILL` and Manage → **This workstation**. |

## Checkout data path

1. Pinpad returns approval with `last4`, `authCode`, `reference`, `cardBrand`, `entryMethod` only.
2. Till calls `sanitizeCardPaymentForStorage()` before attaching `cardPayment` to `complete-sale`.
3. Receipt print/reprint uses `formatCardReceiptLines()` — never raw gateway payloads.
4. Reports and reprint queue store invoice + totals; card lines are rendered at print time from stored `cardPayment` fields.

## References

- Thermal layout: `docs/receipts/clarityrx-pos-receipt-80mm.txt`
- Preview modal: `docs/receipts/clarityrx-pos-receipt-preview.html`
- Securelink: [securelink-integration.md](./securelink-integration.md)
