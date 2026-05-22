# PIPEDA / provincial privacy compliance (POS)

Canadian privacy law applies to personal information collected, used, or disclosed at the till. The POS is a **retail and pickup front-end**; authoritative pharmacy patient records usually live in Kroll / the main pharmacy workspace. This document maps **what the POS stores locally**, **which laws typically apply**, and **controls already in the app** versus **gaps to close before production**.

> This is operational guidance for developers and pharmacy IT — not legal advice. Confirm obligations with counsel for your province, corporate policy, and any PIPEDA / PHIPA assessments.

## Minimum data collection

The till follows **data minimization**: collect only what is needed to complete the transaction, comply with pharmacy operations, or meet a stated customer purpose (loyalty, charge account, Rx pickup).

### Necessary customer info

| Purpose | Typical fields | Do not collect at till |
|---------|----------------|-------------------------|
| Walk-in sale (no account) | None required | Full clinical history, insurance policy numbers unrelated to copay |
| Lookup / attach to till | Account #, display name, phone | Email, DOB, full address unless needed for that sale |
| Loyalty | Member ID, points balance | Marketing preferences without consent |
| Store charge / LTC | Billing account, facility contact | Extra contacts not on the invoice |
| Rx pickup | Bag barcode, pickup id, copay, patient name for queue | Diagnosis, full Rx image, clinical notes beyond cashier alerts |
| Senior / tax exempt | Verification flag, certificate # when exempt | DOB when senior discount not used |

**POS behavior:** Cashier roles see a reduced profile editor (name, phone, account #). Email, address, and date of birth are limited to pharmacist, store manager, and admin roles (`src/lib/privacy/dataMinimization.js`). Notes and alerts may contain health hints — use alert severity only when staff must see it at the till.

### Necessary payment info

| Channel | Collected by till | Never collected or stored by till |
|---------|-------------------|-----------------------------------|
| Cash | Tender amount, change | — |
| Debit / credit (Securelink) | `last4`, brand, `authCode`, `reference`, `entryMethod`, `terminalId` | Full PAN, CVV/CVC, PIN, track data, expiry used for storage |
| Gift card (store issued) | Card number (store identifier), ledger balance | Not payment-card PAN — still protect per store policy |

Card metadata is sanitized on complete-sale and audit via `sanitizeCardPaymentForStorage` in `src/lib/receipt/paymentReceiptRules.js`. Local reporting snapshots omit `cardPayment`. See [pci-dss-payment-security.md](./pci-dss-payment-security.md).

## Law stack (summary)

| Layer | Typical scope for this app |
|-------|----------------------------|
| **PIPEDA** (federal) | Customer profiles, loyalty, purchase history, marketing contact info, and other personal information in the course of commercial activity — when the organization is not substantially regulated by provincial private-sector law. |
| **Provincial private-sector acts** | e.g. Quebec *Law 25*, BC *PIPA*, Alberta *PIPA* — may apply instead of or alongside PIPEDA for retail customer data depending on jurisdiction and organization type. |
| **Provincial health privacy** | **Patient identifiers**, prescription status, pickup queues, and Rx payment context are often **health information** governed by statutes such as Ontario **PHIPA**, BC **FIPPA** / health-specific rules, Alberta **HIA**, etc., when collected in a pharmacy setting. Treat Rx-linked POS data as **higher sensitivity** than generic retail loyalty data. |

Pharmacies should maintain a **privacy impact assessment** that names the controlling statute per data type and documents subprocessors (payment terminal, transmit API, Kroll, email/SMS receipt vendors).

## Data categories handled by the POS

### Patient data

**Examples in app:** Kroll patient ID on customer `rxProfile`, patient name on pickup rows and Rx status lookup, Rx numbers, copay amounts, care-home / LTC facility billing contacts.

**Storage:** IndexedDB `pos_customers` (profile link), Rx integration cache / transmit responses, completed sale snapshots (`pickupId`, `rxCopay`), optional pickup Socket.IO feed.

**Compliance notes:**

- Limit display to roles that need it (`pos.customers`, Rx workspace). Cashiers may need bag scan / copay totals without full clinical charts.
- Do not log full patient names or Rx numbers in **local audit** detail unless required; prefer opaque IDs (`customerId`, `pickupId`, `krollPatientId` hash).
- Sync and retention should follow **health record** policy on the pharmacy server, not unbounded till disk.

### Loyalty accounts

**Examples in app:** `loyalty.memberId`, points balance, tier, earn/redeem history on the customer record.

**Storage:** `pos_customers` — see [customer-management.md](./customer-management.md).

**Compliance notes:**

- Loyalty is **commercial** personal information under PIPEDA-style principles: identify purpose, limit collection, allow access/correction, secure storage.
- Redemption and balance changes should be traceable (points history + sale transmit).

### Customer profiles

**Examples in app:** Name, phone, email, address, date of birth, account number, notes/alerts (may include allergies), tax-exempt certificate, senior discount verification.

**Storage:** `pos_customers`; header lookup searches account #, name, phone, Kroll ID, bag barcode.

**Compliance notes:**

- **Notes & alerts** may contain sensitive health hints (e.g. allergy). Treat alert severity `alert` like PHI for display and logging.
- Profile **delete** is a protected action (`customers.delete` — manager override for non-manager roles). There is no built-in “right to erasure” workflow or server-side propagation yet.

### Prescription pickup

**Examples in app:** Pickup queue (barcode, status, Rx count, patient name, copay), attach-to-till from Customers or Sales bag scan, Rx payment posting queue.

**Storage:** Customer-embedded `pickups[]`, `usePosPickups` / transmit API, sale snapshot `pickupId`.

**Compliance notes:**

- Pickup screens are visible on the sales floor — use **minimum necessary** fields on customer-facing displays (self-checkout should not show other patients’ queues).
- Real-time sync (`REACT_APP_POS_PICKUP_SYNC`) increases disclosure surface; secure transport and authenticate the packaging bridge.

### Purchase history

**Examples in app:** Per-customer `purchaseHistory[]`, completed sales in IndexedDB for Reports, transmit payload on `complete-sale`.

**Storage:** Customer record + local reporting store; authoritative invoices on pharmacy API when transmit is enabled.

**Compliance notes:**

- Tie retention to **financial record** requirements vs. **marketing** use; do not reuse purchase history for unrelated purposes without consent where required.
- Reports aggregate by cashier/shift — avoid exporting customer-level detail to shared drives without access controls.

## PIPEDA fair information principles → POS mapping

| Principle | Current POS support | Gaps / recommendations |
|-----------|---------------------|-------------------------|
| Accountability | Role-based permissions (`pos.customers`, etc.); optional durable audit transmit (`REACT_APP` pharmacy audit flag) | Privacy officer, breach process, and vendor DPAs are organizational — document in runbooks |
| Identifying purposes | Implicit (loyalty, charge account, Rx pickup) | Surface short purpose text in customer enrollment UI; privacy notice link |
| Consent | `consent` on customer record (loyalty, marketing, SMS, email, eReceipts) with per-channel timestamps; **Customers → Privacy & consent** | Audit: `Customer consent updated` in Reports → Audit |
| Limiting collection | Cashiers/students: profiles hide email, address, DOB (`dataMinimization.js`) | Extend masking to purchase history export if added |
| Limiting use/disclosure | Transmit only via configured POS API | Review audit/log payloads for oversharing |
| Accuracy | Staff can edit profiles; save logs `pos.customers.save` | Sync corrections to head office / Kroll when linked |
| Safeguards | Local IndexedDB; HTTPS transmit; manager override for sensitive actions | Disk encryption, workstation lock, session timeout, encrypt backups |
| Openness | Manage → Privacy: notice version + optional URL | Post notice on pharmacy website / intranet |
| Individual access | Access request note on customer **Privacy & consent** tab | Formal fulfillment via pharmacy portal / head office |
| Challenging compliance | Reports → **Access logs** and Audit; customer view/save/consent events ([access-logs.md](./access-logs.md)) | Rx lookup audit without PHI in detail |

## Technical controls in this repo

| Control | Location |
|---------|----------|
| Role gates | `RoleAccessContext.jsx` — `pos.customers` and related permissions |
| Manager override | `posPermissions.js`, header override (~5 min) for price override, gift cards, customer delete |
| Protected action audit | `logProtectedPosAction`, Reports → Audit logs |
| Customer delete gate | `POS_PROTECTED_ACTIONS["customers.delete"]` |
| Clinical verification (workspace, not till) | `clinicalAccess.js` |
| Device till binding | `posDeviceTill.js` — limits cross-till data bleed for register state |
| Outbound boundary | `apiConfig.js` — sales and inventory transmit to pharmacy API |
| Consent channels | `customerConsent.js`, Customers → **Privacy & consent** |
| Profile minimization | `dataMinimization.js` — email/address/DOB hidden for cashiers |
| Store privacy settings | Manage → **Privacy (PIPEDA)** — `posPrivacyConfig.js` |
| Local retention rules | `retentionRules.js` — financial purge, receipt archive, inactive loyalty (`runPosPrivacyRetentionPurge`) |

## IndexedDB and retention

Customer and sale data persist in the browser **per workstation** (`clarityIndexedDb.js`, DB version documented in [customer-management.md](./customer-management.md)). For compliance:

- Treat till storage as **cache**, not system of record, when transmit is live.
- Configure **retention rules** in Manage → Privacy (manager/pharmacist): financial records, receipt archive, and inactive loyalty windows (`src/lib/privacy/retentionRules.js`).
- Clear IndexedDB when reassigning hardware to another store.

### Retention rules (local till)

| Rule | Default (days) | Behavior |
|------|----------------|----------|
| **Retain financial records** | 2555 (~7 years) | Deletes completed sales and audit activities older than the window. Keeps invoice totals, tax, tender, and shift metadata until then. |
| **Secure archived receipts** | 90 | On older sales, strips receipt contact, line detail, card blocks, and signatures; sets `receiptArchived`. Financial totals remain for Reports. |
| **Purge inactive loyalty data** | 730 (2 years) | Clears points, history, and member ID on loyalty accounts that are **Inactive** or have no activity since the cutoff. Profile shell and Rx/charge data stay. |

Run **Run retention rules** after saving settings. Server-side master data and transmitted invoices are not changed by this job.

## Self-checkout and third parties

Self-checkout ([self-checkout.md](./self-checkout.md)) may capture loyalty identifiers and send receipts by email/SMS. Each channel needs:

- Consent or implied consent per policy
- Vendor subprocessors under contract
- Minimal display of other customers’ information on shared kiosks

Card data flows through the payment integration ([securelink-integration.md](./securelink-integration.md)) — PCI DSS applies in addition to privacy law.

## Remaining engineering backlog

1. **Server-side** access/erasure and Kroll sync when customer master is not IndexedDB-only.
2. **Rx lookup audit** without patient name in log detail.
3. **Self-checkout** consent before marketing SMS/email receipts.
4. **Export** customer purchase history with role gate and audit event.

## Related docs

- [customer-management.md](./customer-management.md) — customer tabs and fields
- [rx-integration.md](./rx-integration.md) — Kroll, pickup sync, Rx payments
- [staff-management.md](./staff-management.md) — till roles
- [README-pos.md](./README-pos.md) — environment and audit overview
