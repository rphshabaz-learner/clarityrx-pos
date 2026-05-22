# PCI DSS — payment security (POS)

ClarityRx POS handles **card-present** (debit, credit, tap/chip on pinpad) and **card-not-present** flows only through integrated capture — the till never types or stores a full primary account number (PAN).

**Minimum payment data:** After pinpad approval the till keeps only auth/reference, last four digits, card brand, entry method, and terminal id — see `sanitizeCardPaymentForStorage` in `src/lib/receipt/paymentReceiptRules.js`. Customer PII minimization is in [privacy-compliance.md](./privacy-compliance.md#minimum-data-collection).

This document maps common pharmacy POS PCI expectations to what the **POS app**, **ClarityRx API**, and **payment processor / pinpad** each must provide.

## In scope

| Channel | How ClarityRx POS handles it |
|---------|------------------------------|
| Credit / debit at register | Securelink pinpad via API (`Debit`, `Credit Card`) |
| Tap / chip / swipe | Encrypted on terminal; till receives tokenized result (`reference`, `authCode`, `last4`, `entryMethod`) |
| Self-checkout kiosk | Same Securelink path when enabled |
| Online / MOTO | **Out of POS app scope** — must use a PCI-validated hosted gateway; do not post PAN into POS APIs |

## POS requirements matrix

| Requirement | POS app | API / server | Processor / pinpad |
|-------------|---------|--------------|-------------------|
| **No full card storage** | Does not collect PAN; local sale snapshots omit `cardPayment`; charge audit logs omit PAN/CVV/track | Persist only `last4`, brand, auth/reference, terminal id — never PAN or magnetic stripe | PAN only inside certified terminal / HSM |
| **Tokenized payments** | Sends amount + terminal id to initiate; stores returned `reference` / `authCode` on complete-sale | Maps Securelink/acquirer tokens; no PAN in DB | Issues approval tokens |
| **Encrypted terminals** | N/A (hardware) | TLS to API | P2PE / E2EE on device |
| **End-to-end encryption** | Till never sees clear PAN | Credentials and acquirer keys server-side only | E2EE from reader to processor |
| **Role-based access** | `RoleAccessContext` permissions; manager override for protected actions | Enforce same roles on `/pos/*` and `/auth/*` | Terminal logon per store policy |
| **Audit logging** | IndexedDB **Activities** + Reports → Audit logs; protected actions via `posPermissions.js` | Central audit for complete-sale, Securelink lifecycle, auth events | Processor transaction log |
| **Auto logout** | Idle workstation lock (`AuthContext`, default 15 min); kiosk idle reset via `idleTimeoutSec` in Self-checkout → Payment | `sessionTimeoutMinutes` from security bootstrap | Staff session policy per store |
| **Secure receipt masking** | Use `src/lib/pci/cardDisplay.js` for receipt lines; merchant copy optional via Manage → Till | Receipt PDF/print service must mask PAN on customer copy | EMV receipts from pinpad follow acquirer rules |

## What the till stores after a card sale

On approval, the till calls `POST /pos/complete-sale` with **non-sensitive** card metadata only:

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

Local reporting snapshot (`buildCompletedSaleSnapshot`) intentionally **does not** include `cardPayment` — only pay method and totals.

## Role-based access (POS)

- Permissions: `src/RoleAccessContext.jsx` (`pos.charge`, `pos.reports`, `pos.giftcards`, etc.).
- **Manager override** (5 minutes, per till): price override, gift card activate/reload, and other `POS_PROTECTED_ACTIONS` in `src/lib/posPermissions.js`.
- Override and sensitive actions write to audit with `tillNumber`, `operatorId`, `operatorRole`, `managerOverride`.

See [staff-management.md](./staff-management.md).

## Audit logging

- **Where:** Reports → **Audit logs** (`ReportsAuditSection`), backed by IndexedDB `activities` store.
- **What to log for payments:** sale completed (amount, method, invoice — not PAN), receipt reprint, manager override, gift card ledger, failed pinpad (message only).
- **What not to log:** full PAN, CVV, PIN, track data, or magnetic-stripe equivalent.

Gift card numbers are store-issued identifiers, not payment cards — still treat as sensitive in policy.

## Auto logout / session lock

- Staff POS: idle timer locks workstation (`lockWorkstation("idle-timeout")`); unlock requires re-auth.
- Preferences: `src/session/sessionPreferences.ts` (5–60 minutes, capped by server max).
- Self-checkout: **Manage → Self-checkout → Payment** sets `idleTimeoutSec` (default 120s); active kiosk sessions end after idle with audit log.

## Receipt masking

Use helpers in `src/lib/pci/cardDisplay.js`:

- **Customer copy:** masked account line (e.g. `CARD  ****4242`), auth/reference only as required by acquirer.
- **Merchant copy:** optional extra fields when **Print merchant copy for card payments** is enabled (`PosManagePanel` / `posFavorites.js`).
- Never print: full PAN, CVV, PIN, or track data.

Receipt layout reference: `docs/receipts/`.

## Securelink (integrated pinpad)

Enable with `REACT_APP_SECURELINK_ENABLED=1`. Card data capture stays on the pinpad; see [securelink-integration.md](./securelink-integration.md).

Development mock (`REACT_APP_SECURELINK_MOCK=1`) must **never** be used in production.

## Deployment checklist

1. **Production:** Securelink on, mock off, HTTPS to API, device till binding per register.
2. **Pinpad:** One terminal id per till (Manage → Pinpad terminal mapping).
3. **Sessions:** Enforce shortest practical idle timeout for shared registers.
4. **Receipts:** Customer copy masked; merchant copy policy documented at store.
5. **API:** SAQ scope validated with QSA — POS app alone does not make the merchant compliant.
6. **Online payments:** Separate PCI scope (hosted fields / redirect), not this till bundle.

## Card payment audit events

Register and kiosk card flows log to **Audit logs** via `src/lib/pci/cardPaymentAudit.js` (sanitized — no PAN/CVV):

- Card payment initiated / approved / declined / cancelled / timed out / failed
- Self-checkout session ended (idle)

Search Audit logs for `Card payment` or `idle`.

## Known gaps (POS app)

| Item | Status |
|------|--------|
| Live thermal receipt renderer | Reprint queues audit + toast; use `formatCardReceiptLines` from `paymentReceiptRules.js` when print pipeline is connected |
| Card-specific audit category filter | Use Audit logs search; optional dedicated “Card payments” filter later |

## Related docs

- [securelink-integration.md](./securelink-integration.md)
- [staff-management.md](./staff-management.md)
- [README-pos.md](./README-pos.md)
