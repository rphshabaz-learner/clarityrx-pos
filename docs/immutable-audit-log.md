# Immutable audit log (POS)

Append-only **must-log** events on this workstation, stored in IndexedDB (`immutable_audit`) and mirrored to activities (`pos.audit`) for Reporting.

## Schema (each row)

| Field | Description |
|-------|-------------|
| `user` | Operator id or username |
| `action` | Must-log action id (see below) |
| `timestamp` | Unix ms |
| `terminal` | Till / terminal number |
| `old_value` | Prior value (serialized) |
| `new_value` | New value (serialized) |
| `reason` | Free-text or coded reason |
| `detail` | Extra context (no card PAN/CVV) |

Rows are never updated in place; retention purge deletes by age only (Manage → Privacy).

## Must-log actions

| Action | When logged |
|--------|-------------|
| `price_override` | Manager line price change (`sales.price_override`) |
| `refund` | Standard refund (`logAccessRefund`) |
| `refund_override` | Manager-approved refund |
| `void` | Line void, cart clear, suspend |
| `sale_deleted` | Local completed sale removed (retention purge) |
| `manager_override` | Header Mgr override enabled |
| `controlled_item_sale` | Completed sale includes product with `controlled: true` |
| `till_open` | New shift opened on a till |
| `cash_drop` | Header **Cash drop** (amount + reason) |
| `user_login` | Successful sign-in |
| `user_logout` | Sign out |

## UI

**Reporting & Analytics → Must-log audit** — filter by action and search user/reason/values.

General POS chatter remains under **Audit logs**; sensitive categorized events also appear under **Access logs**.

## Code

- Library: `src/lib/audit/posImmutableAudit.js`
- IndexedDB: `immutableAuditAppend`, `immutableAuditList`, `purgeImmutableAuditBefore` in `src/lib/clarityIndexedDb.js`
- UI: `src/components/pos/reports/ReportsImmutableAuditSection.jsx`
