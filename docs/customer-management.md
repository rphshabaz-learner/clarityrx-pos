# Customer management (POS)

Workspace tab **Customers** — profiles, loyalty, store charge, LTC billing, pricing, tax exemption, Rx links, and pickup tracking.

## Access

Roles with `pos.customers`: admin, pharmacist, relief pharmacist, store manager, technician, assistant, cashier.

## Sections

| Section | Features |
|---------|----------|
| **Profiles** | Account #, type, contact info, status, attach to till (email/address/DOB for manager/pharmacist roles only) |
| **Privacy & consent** | Loyalty, marketing, SMS, email, eReceipt consent with timestamps; privacy notice version; access request log |
| **Privacy & consent** | Loyalty, marketing, SMS, email, and eReceipt consent with date and privacy-notice version |
| **Loyalty & billing** | Loyalty member ID, points, tier; store charge limit/balance; LTC billing account |
| **Points history** | Earn, redeem, adjustments |
| **Purchases** | Linked invoice history |
| **Special pricing** | Per-SKU contract prices; verified senior discount % |
| **Notes & tax** | Cashier alerts (allergy, delivery); tax-exempt certificate |
| **Rx & pickups** | Kroll patient ID link; bag barcode pickup status; care home / group home facility fields |

## Pharmacy workflows

- **Rx profile**: Store `krollPatientId` and link timestamp on the customer record.
- **Pickup tracking**: Bag barcode, Rx numbers, status (`in_prep` / `ready` / `picked_up`), copay. Ready pickups can be **attached to till** from this tab or via header bag scan.
- **Care homes / LTC**: Facility name, beds, contacts; LTC invoice cycle and billing account on loyalty/billing section.

## Header customer lookup

Search in the top bar matches customer account #, name, phone, Kroll ID, or bag barcode. When found, opens the **Customers** tab and selects the profile. Otherwise falls back to inventory search or Rx bag scan on **Sales**.

## Data storage

Customer records are stored locally in IndexedDB (`pos_customers`, DB version 11). Seed data is created on first open. Production sync with Kroll / head office can be added via transmit API later.

## Privacy (PIPEDA / provincial)

Profiles, loyalty, purchase history, Rx links, and pickup data can contain **personal information** and, where health-related, **health information** under provincial pharmacy privacy law. See [privacy-compliance.md](./privacy-compliance.md) for minimum data collection rules, a data-category map, current POS controls, and recommended gaps.

## Till attachment

**Attach to till** applies account context on **Sales**:

- Tax exempt flag when configured
- Senior discount % when verified
- Loyalty points balance prefilled for redemption
- First alert-severity note shown in the header alert strip
