# Self checkout (POS workspace tab)

The **Self Checkout** tab provides a customer-facing kiosk flow and staff configuration for scan-and-pay, card payment, receipt delivery, and loyalty lookup.

## Workspace sections

| Section | Purpose |
|---------|---------|
| **Scan-and-pay** | Run the kiosk session: scan barcodes/SKU, review cart, checkout |
| **Payment** | Kiosk till number, pinpad terminal ID, customer payment prompt |
| **Receipt options** | Default and offered receipt methods (print, email, SMS, none); session history |
| **Loyalty entry** | Kiosk loyalty prompt, skip option, redeem cap; test customer lookup |

## Kiosk flow

1. **Scan** — barcode scanner or keyboard entry adds front-store catalog lines (same inventory as Sales).
2. **Loyalty** (optional) — phone or member ID matches local customer profiles; redeems points at 100 pts = $1.
3. **Payment** — Debit or Credit Card; Securelink pinpad when `REACT_APP_SECURELINK_ENABLED=1`.
4. **Receipt** — customer selects print, email, text, or no receipt.
5. **Complete** — `POST /pos/complete-sale`, inventory transmit, local completed-sale row (`channel: self_checkout`).

## Permissions

`pos.selfcheckout` — admin, pharmacist, relief pharmacist, store manager, technician, assistant, cashier.

## Environment

| Variable | Purpose |
|----------|---------|
| `REACT_APP_POS_SELF_CHECKOUT=1` | Enable kiosk at store (default on unless `0` / `false`) |
| `REACT_APP_POS_SELF_CHECKOUT_TILL=99` | Dedicated till number for kiosk sales |
| `REACT_APP_SECURELINK_ENABLED=1` | Customer card payment on pinpad |
| `REACT_APP_POS_TRANSMIT_URL` | Complete-sale and inventory transmit |

## Receipt printing

Thermal layout references: `docs/receipts/`. Kiosk **print** queues the same receipt pipeline as staff reprint (local audit + toast).

## Data

- Settings: IndexedDB KV `pos_self_checkout_config`
- Session log: KV `pos_self_checkout_sessions` (last 80 completions)
- Sales: `pos_completed_sales` with `channel: self_checkout` and `receiptDelivery`
