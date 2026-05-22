# Real-time warnings (POS)

Orange header alerts on the till surface compliance and operational risks while the cashier is working. Warnings use stable IDs so they update in place and clear automatically when the condition goes away.

## Examples

| Warning | When it appears |
|---------|-----------------|
| Refund exceeds manager threshold | Refund total in the lookback window (access + immutable audit) meets or exceeds the configured $ threshold |
| Multiple voids detected | Void count on this till in the lookback window reaches the configured limit |
| Controlled product requires pharmacist | Cart contains a controlled line and the signed-in role is not pharmacist / relief pharmacist (unless manager override is active) |
| Session timeout approaching | `AuthContext` idle warning fires one minute before workstation lock |
| Till variance detected | A drawer count was recorded (header **Drawer count**) and differs from opening float + expected cash sales by at least the configured $ amount |
| Price override outside allowed range | A cart line price differs from catalog by more than allowed % down/up without supervisor rights or manager override |

## Header UI

- Up to two alerts show in `PosTopHeaderBar` (`aria-live="polite"`).
- Tap an alert to dismiss it; the evaluator may re-push it on the next cycle if the condition still applies.
- **Drawer count** (supervisor roles) stores the physical count per till in `localStorage` for variance checks.

## Configuration

Thresholds live in `src/lib/warnings/posWarningConfig.js` (defaults below). Persist overrides with `savePosWarningConfig` / `localStorage` key `clarityrx-pos-warning-config-v1`.

| Setting | Default |
|---------|---------|
| `refundManagerThreshold` | $50 |
| `refundLookbackMinutes` | 60 |
| `voidCountThreshold` | 3 |
| `voidLookbackMinutes` | 30 |
| `priceOverrideMaxPercentDown` | 20% |
| `priceOverrideMaxPercentUp` | 50% |
| `tillVarianceThreshold` | $5 |

## Code

- Evaluator: `src/lib/warnings/posRealTimeWarnings.js`
- Hook (polls activities, audit, sales every 20s): `src/hooks/usePosRealTimeWarnings.js`
- Wired in: `src/modules/pos/PosScreen.jsx` → `PosTillContext.pushHeaderAlert`
