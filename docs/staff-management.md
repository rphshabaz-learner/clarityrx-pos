# Staff management (POS)

Workspace tab **Staff** — role-based access tiers, permissions matrix, till shift tracking, and manager override audit (requires `pos.reports`: admin, pharmacist, relief pharmacist, store manager, supervisor).

## Role-based access

| Tier | Who | Till capabilities |
|------|-----|-------------------|
| **Cashier** | `cashier`, `student`, `technician`, `assistant` | Sales only — scan, tender, customers/Rx for sale |
| **Supervisor** | `supervisor`, `store_manager`, `pharmacist`, `relief_pharmacist` | Refunds, voids, discounts (and price override without timed override) |
| **Admin** | `admin` | Configurations, tax settings, security & privacy |

Permissions are enforced in the sales register (void line/cart, discounts) and on **Manage** (till options, favorites, Canadian tax, privacy retention).

Cashiers without supervisor rights may still use **Mgr override** in the header for a timed exception on that till.

## Sections

| Section | Purpose |
|---------|---------|
| **Staff** | Signed-in operator, active role, till, current shift, manager override state |
| **Permissions** | Role × permission matrix plus protected actions that need override |
| **Role access** | RBAC tiers and all POS till roles; highlights your signed-in role |
| **Shift tracking** | Till shifts for the selected business date (open/close, opened by / closed by) |
| **Override audit** | Local audit rows where `managerOverride` was used or override was enabled |

## Related behavior (not on this tab)

- **Open / close shift** — header bar on the active till (`src/lib/posShift.js`, `PosTillContext`)
- **Mgr override** — 5-minute session on the selected till; header button (`PosTopHeaderBar`)
- **Full audit trail** — Reports → Audit logs (all POS categories)
- **Access logs** — Reports → Access logs ([access-logs.md](./access-logs.md))

## Code

- UI: `src/components/pos/staff/PosStaffPanel.jsx`
- Tiers: `src/lib/posRoleAccess.js`
- Roles & permissions: `src/RoleAccessContext.jsx`
- Override gates & audit helpers: `src/lib/posPermissions.js`
- Shifts: `src/lib/posShift.js`
