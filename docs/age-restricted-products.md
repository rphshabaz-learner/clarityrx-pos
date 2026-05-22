# Age-restricted product compliance (POS)

Canadian pharmacy front shops often sell **nicotine**, **lottery**, **alcohol**, **cannabis**, and similar lines that require proof-of-age before sale. The till enforces verification per **restriction class** on each cart session.

## Restriction classes

| Class | Examples | Default minimum age |
|-------|----------|---------------------|
| `nicotine` | Cigarettes, nicotine gum, pouches | Store minimum (see Manage) |
| `vaping` | Disposable vapes, e-liquid | Store minimum |
| `lottery` | Lotto, scratch tickets | Store minimum |
| `alcohol` | Beer, wine, RTDs | Store minimum |
| `cannabis` | Cannabis accessories where permitted | Store minimum |
| `fireworks` | Seasonal fireworks SKUs | 18 (or store minimum if higher) |
| `energy_drink` | High-caffeine energy drinks where regulated | Store minimum |

Assign a class on each SKU under **Inventory → Products → Age restriction**, or set `ageRestrictionClass` on catalog seed rows. Category/name text can also hint the class (e.g. “Lottery”, “Nicotine”) when the field is unset.

## Till workflow

1. Cashier scans or adds an age-restricted SKU.
2. **Age verification** modal opens: enter customer **date of birth** (YYYY-MM-DD).
3. On success, the line is added and that class is marked verified for the current cart.
4. At **Charge**, the till blocks checkout if any restricted class on the cart is still unverified.
5. On completed sale, an immutable audit row is written (`controlled_item_sale`) and access logs record verification (`Reports → Access logs → Age verification`).

### Manager override

If DOB entry fails or ID cannot be scanned, activate **Mgr override** in the header, enter a **reason**, and approve. Override is logged to the access log and immutable audit.

## Configuration

**Manage → Age-restricted products** (admin):

- **Store minimum purchase age** — typically **19** in BC/ON-style provinces, **18** in AB/QC-style rules (set per store policy).
- **Enforce age verification** — disable only for demos/training.
- **Block self-checkout** — kiosk refuses restricted scans and cannot complete payment with restricted lines in cart.
- **Enabled classes** — turn off classes you do not sell (e.g. disable `cannabis` if not licensed).

## Self-checkout

When blocking is enabled, the kiosk shows: *“Age-restricted items must be sold at the staffed till.”* Staff complete verification on the main sales register.

## Reporting

Completed sale snapshots in IndexedDB include an `ageCompliance` summary (classes sold and verification metadata). Pair with **Access logs** and **Audit** filters for inspections.

## Code references

- `src/lib/compliance/ageRestrictedProducts.js` — classes, DOB math, cart checks
- `src/lib/compliance/posAgeComplianceConfig.js` — local workstation settings
- `src/hooks/useAgeRestrictedSale.js` — register integration
- `src/components/pos/sales/AgeVerificationModal.jsx` — cashier UI
