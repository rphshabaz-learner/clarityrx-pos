# Access logs (POS)

Workspace **Reporting & Analytics → Access logs** — a filtered view of sensitive workstation actions stored in local IndexedDB (`activities`, category `pos.access`).

## Tracked categories

| Category | When logged |
|----------|-------------|
| **Profile views** | A customer profile is selected in **Customers** (operator, customer id, Rx-linked flag). |
| **Refund overrides** | `logAccessRefundOverride()` after manager-approved refund (protected action `sales.refund_override`). Wire from return/refund UI when implemented. |
| **Voids** | Sale line removed, cart cleared, sale suspended. |
| **Discount overrides** | Manager line price override, line discount &gt; 0, cart discount on completed sale. |
| **Rx-linked transactions** | Rx pickup attached to till, Rx copay charge completed, Rx payment posted to Kroll. |

General POS events remain under **Audit logs**. Must-log compliance rows (price override, refund, void, till open, cash drop, login, etc.) use the immutable store — see [immutable-audit-log.md](./immutable-audit-log.md). Access logs use `src/lib/access/posAccessLog.js` (`logAccessEvent`, `classifyAccessLogActivity`, `filterAccessLogActivities`).

## Code

- UI: `src/components/pos/reports/ReportsAccessLogSection.jsx`
- Library: `src/lib/access/posAccessLog.js`
- Protected refund gate: `POS_PROTECTED_ACTIONS["sales.refund_override"]` in `src/lib/posPermissions.js`
