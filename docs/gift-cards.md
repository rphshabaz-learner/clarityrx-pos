# Gift cards (POS)

Workspace tab **Gift Cards** — activation, reload, balance inquiry, and registry. Gift card tender on **Sales** redeems balance at checkout.

## Access

Roles with `pos.giftcards`: admin, pharmacist, relief pharmacist, store manager, technician, assistant, cashier.

## Permissions and manager override

Sensitive gift card operations are **per till**: activation and reload require either an elevated role (admin, store manager, pharmacist, relief pharmacist) or an active **Mgr override** session on the selected till (header bar, 5 minutes).

| Action | Override required for |
|--------|------------------------|
| Activation | Cashier, assistant, student, technician |
| Reload | Cashier, assistant, student, technician |
| Balance check / registry | No (read-only) |
| Sales redemption | Normal `pos.charge` / checkout flow |

Audit trail: each activation, reload, and redemption writes to the workstation **Audit logs** (Reports tab) with `tillNumber`, `operatorId`, `operatorRole`, and `managerOverride: true` when override was used. Card ledger entries on the card also store `managerOverride` on those transactions.

See `src/lib/posPermissions.js` for the shared action registry (price override, inventory adjust, etc.).

## Sections

| Section | Purpose |
|---------|---------|
| **Balance check** | Scan or enter `GC-####-####` to view balance, status, and recent ledger entries (no balance change) |
| **Activation** | Issue a new card with an opening balance; optional fixed card number or auto-issue; records tender collected |
| **Reload** | Add funds to an activated card; records tender collected |
| **Registry** | List all cards on this workstation with balance and status |

## Card numbers

Format: `GC-####-####` (e.g. `GC-1000-0001`). Barcode scans that resolve to 8+ digits are normalized automatically.

## Sales checkout

When **Gift Card** is the payment method (or a split line uses Gift Card):

1. Enter or scan the card number in the payment panel.
2. Balance is shown before **Charge**.
3. On charge, the redeem amount is deducted from the card ledger before the sale is completed.

Split payments: only the Gift Card portion is redeemed from the entered card.

## Demo seed cards

| Card | Status | Balance |
|------|--------|---------|
| GC-1000-0001 | active | $25.00 |
| GC-1000-0002 | inactive | $0.00 |
| GC-1000-0003 | active | $50.00 |

## Data storage

Gift cards are stored locally in IndexedDB (`pos_gift_cards`, DB version 14). Each card keeps up to 50 ledger transactions (activation, reload, redemption). Head-office / processor sync can be added via transmit API later.
