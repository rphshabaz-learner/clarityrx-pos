# Multi-Till Readiness

This checklist tracks the remaining production work for running 10+ cashier tills at the same time.

## Implemented in POS frontend

- Active till selection supports tills 1-12.
- Device till binding can lock a workstation to a configured till.
- Register state is scoped per till, so switching tills does not overwrite another till's cart.
- Suspended sales are scoped per till.
- Cash drawer shifts are tracked per till.
- Completed sale snapshots include `tillNumber`, `shiftId`, and business date.
- Securelink terminal IDs resolve from the selected till.
- Inventory adjustments include `tillNumber` and `invoiceNumber`.
- Local reporting can aggregate sales by till.

## Backend requirements

- Persist `tillNumber` on every `/pos/complete-sale` transaction.
- Persist `shiftId` when supplied, or return the backend shift/session identifier.
- Guarantee invoice-number uniqueness under parallel sales from multiple tills.
- Return `invoiceNumber` in every successful complete-sale response.
- Validate the requested `tillNumber` is enabled for the pharmacy/site.
- Store card terminal ID and payment reference for card tenders.
- Include `tillNumber` in inventory adjustment audit rows.

## Device setup requirements

- Configure each physical workstation with a device till binding.
- Lock production till bindings so cashiers cannot accidentally switch stations.
- Map each till to a payment terminal, for example Till 1 -> POS-01 and Till 10 -> POS-10.
- Confirm each terminal mapping matches the acquirer/gateway configuration.

## Test matrix

- Complete concurrent sales from Till 1 through Till 12.
- Verify invoice numbers are unique and sequential according to the backend rule.
- Verify cash, debit, credit, gift card, split tender, and account charge all preserve `tillNumber`.
- Suspend and resume a sale on two different tills and confirm they do not cross over.
- Close cash drawers on at least three tills and verify per-till balancing.
- Confirm all-till reporting totals equal the sum of per-till totals.
- Confirm inventory decrements once per completed sale, even during parallel checkout.
