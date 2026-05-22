import React from "react";

export default function PosGlobalStyles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; background: #f3f6fb; font-family: 'Plus Jakarta Sans', sans-serif; color: #111827; }
@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
.screen-enter { animation: fadeUp 0.28s ease; }
.crx-content { flex: 1; overflow-y: auto; padding: 28px; min-height: 0; }
.crx-content--cashier { display: flex; flex-direction: column; overflow: hidden; padding: 10px 14px 12px; }
.crx-content--cashier .crx-demographic-bar { margin-bottom: 8px; padding: 8px 12px; }
.crx-content--cashier .crx-tabs--large { flex-shrink: 0; margin-bottom: 10px; }
.crx-content--cashier .crx-cashier-register { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.crx-content--cashier .crx-manager-banner { flex-shrink: 0; margin-bottom: 8px; }
.crx-tabs--large { display: flex; flex-wrap: wrap; gap: 8px; border-bottom: none; margin-bottom: 14px; padding: 0; }
.crx-tabs--large .crx-tab--large { padding: 14px 20px; font-size: 15px; font-weight: 800; min-height: 52px; border-radius: 12px; border: 2px solid #e5e7eb; background: #fff; margin-bottom: 0; border-bottom-width: 2px; color: #64748b; }
.crx-tabs--large .crx-tab--large.active { color: #1447e6; background: #eff6ff; border-color: #1447e6; }
.crx-tabs--large .crx-tab--large:hover:not(.active) { color: #374151; background: #f8fafc; }
.crx-sales-options-modal { max-width: 480px; }
.crx-sales-options-modal__grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
.crx-sales-options-modal__field span { display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
.crx-sales-options-modal__pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.crx-card { background:#fff;border-radius:16px;border:1px solid #e5e7eb;box-shadow:0 8px 28px rgba(15,23,42,0.045); }
.crx-card-header { padding:18px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;gap:14px; }
.crx-card-title { font-size:14px;font-weight:800;color:#111827;letter-spacing:-0.01em; }
.crx-tabs { display:flex;gap:4px;border-bottom:1px solid #e5e7eb;margin-bottom:18px;padding:0 2px; }
.crx-tab { padding:11px 16px;font-size:13px;font-weight:700;color:#94a3b8;cursor:pointer;border:none;background:none;font-family:inherit;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all 0.13s;border-radius:10px 10px 0 0; }
.crx-tab.active { color:#1447e6;border-bottom-color:#1447e6; }
.crx-tab:hover:not(.active) { color:#374151; }
.btn-primary { background:#1447e6;color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.13s;display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:36px; }
.btn-primary:hover { background:#1035c9; }
.btn-primary:disabled { opacity:0.55;cursor:not-allowed; }
.btn-secondary { background:#fff;color:#374151;border:1px solid #dbe3ef;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.13s;display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:36px; }
.btn-secondary:hover { background:#f9fafb;border-color:#d1d5db; }
.crx-input { width:100%;border:1px solid #dbe3ef;border-radius:10px;padding:10px 12px;font-size:13px;font-family:inherit;color:#111827;background:#fff;outline:none;transition:all 0.15s; }
.crx-input:focus { border-color:#1447e6;box-shadow:0 0 0 3px rgba(20,71,230,0.08); }
.crx-select { width:100%;border:1px solid #dbe3ef;border-radius:10px;padding:10px 12px;font-size:13px;font-family:inherit;color:#111827;background:#fff;outline:none; }
.badge-green { display:inline-flex;align-items:center;font-size:11px;font-weight:600;background:#f0fdf4;color:#16a34a;border-radius:6px;padding:2px 8px; }
.badge-amber { display:inline-flex;align-items:center;font-size:11px;font-weight:600;background:#fffbeb;color:#d97706;border-radius:6px;padding:2px 8px; }
.badge-gray { display:inline-flex;align-items:center;font-size:11px;font-weight:600;background:#f3f4f6;color:#6b7280;border-radius:6px;padding:2px 8px; }
.pos-item { display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f3f4f6; }
.pay-opt { border:2px solid #e5e7eb;border-radius:10px;padding:12px;cursor:pointer;text-align:center;font-size:12px;font-weight:600;color:#6b7280;transition:all 0.13s;background:#fff; }
.pay-opt:hover { border-color:#1447e6;color:#1447e6; }
.pay-opt.active { border-color:#1447e6;color:#1447e6;background:#eff6ff; }
.crx-pos-app { min-height: 100vh; display: flex; flex-direction: column; background: #f8fafc; }
.crx-pos-app__main { flex: 1; min-height: 0; overflow: hidden; }
.crx-pos-header { background: #0f172a; color: #f8fafc; border-bottom: 1px solid #1e293b; display: flex; flex-direction: column; }
.crx-pos-header__row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; flex-wrap: wrap; }
.crx-pos-header__row--secondary { border-top: 1px solid #1e293b; padding-top: 8px; padding-bottom: 10px; }
.crx-pos-header__brand { flex: 1 1 320px; min-width: 0; }
.crx-pos-header__title { font-size: 16px; font-weight: 800; letter-spacing: -0.02em; }
.crx-pos-header__identity { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.crx-pos-header__chip { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #e2e8f0; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 4px 10px; }
.crx-pos-header__chip-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; }
.crx-pos-header__chip--shift.is-open { border-color: #166534; background: #14532d; }
.crx-pos-header__chip--till { padding-right: 4px; }
.crx-pos-header__till-select { background: transparent; border: none; color: #f8fafc; font-size: 12px; font-weight: 700; font-family: inherit; outline: none; cursor: pointer; }
.crx-pos-header__clock { font-size: 12px; font-weight: 600; color: #cbd5e1; font-variant-numeric: tabular-nums; white-space: nowrap; }
.crx-pos-header__status { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.crx-pos-header__pill { display: inline-flex; flex-direction: column; gap: 1px; border: 1px solid; border-radius: 8px; padding: 4px 10px; min-width: 88px; }
.crx-pos-header__pill-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; }
.crx-pos-header__pill-detail { font-size: 11px; font-weight: 600; opacity: 0.9; }
.crx-pos-header__lookup { display: flex; align-items: center; gap: 8px; flex: 1 1 280px; min-width: 200px; }
.crx-pos-header__lookup-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; white-space: nowrap; }
.crx-pos-header__lookup-input { flex: 1; min-width: 120px; border: 1px solid #334155; border-radius: 8px; padding: 8px 10px; font-size: 13px; font-family: inherit; color: #f8fafc; background: #1e293b; outline: none; }
.crx-pos-header__lookup-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.25); }
.crx-pos-header__lookup-btn { min-height: 36px; padding: 8px 12px; font-size: 12px; }
.crx-pos-header__pickups { position: relative; }
.crx-pos-header__pickup-btn { display: inline-flex; align-items: center; gap: 8px; border: 1px solid #334155; background: #1e293b; color: #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 12px; font-weight: 700; font-family: inherit; cursor: pointer; min-height: 36px; }
.crx-pos-header__pickup-btn.has-items { border-color: #166534; background: #14532d; color: #bbf7d0; }
.crx-pos-header__pickup-count { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; border-radius: 999px; background: rgba(15,23,42,0.35); font-size: 11px; font-weight: 800; }
.crx-pos-header__pickup-panel { position: absolute; top: calc(100% + 6px); left: 0; z-index: 40; width: min(320px, 90vw); background: #fff; color: #111827; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 12px 32px rgba(15,23,42,0.18); padding: 10px; }
.crx-pos-header__pickup-panel-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
.crx-pos-header__pickup-empty { font-size: 13px; color: #9ca3af; padding: 8px 4px; }
.crx-pos-header__pickup-row { display: flex; justify-content: space-between; width: 100%; text-align: left; border: 1px solid #e5e7eb; background: #f9fafb; border-radius: 8px; padding: 10px 12px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; margin-bottom: 6px; }
.crx-pos-header__pickup-row:hover { border-color: #1447e6; background: #eff6ff; }
.crx-pos-header__alerts { display: flex; gap: 6px; flex-wrap: wrap; }
.crx-pos-header__alert { border-radius: 8px; padding: 6px 10px; font-size: 11px; font-weight: 700; border: 1px solid; cursor: pointer; font-family: inherit; }
.crx-pos-header__alert--info { background: #1e3a5f; border-color: #2563eb; color: #bfdbfe; }
.crx-pos-header__alert--warn { background: #78350f; border-color: #d97706; color: #fde68a; }
.crx-pos-header__alert--error { background: #7f1d1d; border-color: #dc2626; color: #fecaca; }
.crx-pos-header__quick { display: flex; flex-wrap: wrap; gap: 6px; margin-left: auto; justify-content: flex-end; }
.crx-pos-header__quick-btn { min-height: 36px; padding: 7px 11px; font-size: 11px; white-space: nowrap; }
.crx-pos-header__modal-backdrop { position: fixed; inset: 0; z-index: 100; background: rgba(15,23,42,0.55); display: grid; place-items: center; padding: 24px; }
.crx-pos-header__modal { width: 100%; max-width: 400px; background: #fff; border-radius: 14px; padding: 20px; box-shadow: 0 20px 50px rgba(15,23,42,0.2); }
@media (pointer: coarse) {
  .crx-pos-header__quick-btn, .crx-pos-header__lookup-btn, .crx-pos-header__pickup-btn { min-height: 44px; font-size: 12px; }
  .crx-pos-header__lookup-input { min-height: 44px; font-size: 14px; }
}
.crx-pos-auth { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: linear-gradient(160deg, #ecfdf5 0%, #f8fafc 45%, #eff6ff 100%); }
.crx-pos-auth__brand { position: absolute; top: 24px; left: 24px; }
.crx-pos-auth__title { font-size: 22px; font-weight: 800; color: #0f172a; }
.crx-pos-auth__subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }

/* Touch-screen monitors: finger-sized targets, tap feedback, no hover-only UI */
html, .crx-pos-app, .crx-pos-auth { touch-action: manipulation; -webkit-text-size-adjust: 100%; }
.crx-pos-app, .crx-pos-auth { -webkit-tap-highlight-color: rgba(20, 71, 230, 0.12); }
.crx-tab:active:not(.active) { color: #374151; }
.btn-primary:active:not(:disabled) { background: #1035c9; }
.btn-secondary:active:not(:disabled) { background: #f9fafb; border-color: #d1d5db; }
.pay-opt:active { border-color: #1447e6; color: #1447e6; }
.crx-favorite-tile { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; background: #fff; cursor: pointer; text-align: center; transition: border-color 0.13s, box-shadow 0.13s; touch-action: manipulation; min-height: 120px; font-family: inherit; }
.crx-favorite-tile:hover, .crx-favorite-tile:active { border-color: #1447e6; box-shadow: 0 4px 12px rgba(20, 71, 230, 0.12); }
.crx-pickup-btn { text-align: left; cursor: pointer; border: 1px solid #bbf7d0; background: #f0fdf4; border-radius: 12px; padding: 14px; width: 100%; touch-action: manipulation; font-family: inherit; }
.crx-pickup-btn.selected { border: 2px solid #16a34a; background: #ecfdf5; }
.crx-pickup-btn:active { filter: brightness(0.97); }
.crx-demographic-chip { border: 1px solid #e5e7eb; background: #fff; color: #374151; border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; touch-action: manipulation; }
.crx-demographic-chip.active { border: 2px solid #1447e6; background: #eff6ff; color: #1447e6; }
.crx-demographic-chip:active { border-color: #1447e6; background: #eff6ff; }
.crx-qty-btn { min-width: 44px; min-height: 44px; padding: 0 !important; font-size: 18px; font-weight: 700; }
.crx-icon-btn { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 20px; min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; touch-action: manipulation; font-family: inherit; }
.crx-icon-btn:active { background: #f3f4f6; color: #6b7280; }
.crx-charge-btn { width: 100%; justify-content: center; padding: 13px; font-size: 15px; border-radius: 10px; min-height: 48px; }
.crx-sales-register { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.85fr); gap: 16px; align-items: start; }
.crx-cashier-register .crx-sales-register--fit { flex: 1; min-height: 0; height: 100%; }
.crx-sales-register--fit { flex: 1; min-height: 0; align-items: stretch; overflow: hidden; gap: 12px; }
.crx-sales-register--fit .crx-sales-register__left { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; gap: 10px; overflow: hidden; }
.crx-sales-register--fit .crx-sales-register__right { display: grid; grid-template-rows: auto minmax(0, 1fr); gap: 10px; overflow: hidden; }
.crx-sales-register--fit .crx-sales-register__right-scroll { min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; -webkit-overflow-scrolling: touch; }
.crx-sales-register__left, .crx-sales-register__right { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.crx-sales-cart--fill { min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
.crx-sales-cart--fill .crx-card-header { flex-shrink: 0; }
.crx-sales-cart__scroll { flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; }
.crx-sales-totals--compact { flex-shrink: 0; }
.crx-sales-totals--compact .crx-sales-totals__breakdown { margin-top: 0; }
.crx-sales-totals__actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.crx-sales-totals__badge { font-size: 11px; font-weight: 700; color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 4px 8px; }
.crx-sales-scan { padding: 14px 18px; }
.crx-sales-scan__row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.crx-sales-scan__label { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 6px; }
.crx-sales-scan__meta { display: flex; flex-wrap: wrap; gap: 10px 16px; margin-top: 10px; font-size: 12px; color: #6b7280; }
.crx-sales-scan__rx { color: #15803d; font-weight: 700; }
.crx-sales-scan__rx--idle { color: #94a3b8; font-weight: 600; }
.crx-sales-scan__services { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.crx-sales-cart__table { padding: 0 18px 12px; }
.crx-sales-cart__head, .crx-sales-cart__row { display: grid; grid-template-columns: minmax(0, 1fr) 132px 72px 64px 72px 44px; gap: 8px; align-items: center; padding: 10px 0; }
.crx-sales-cart__head { border-bottom: 1px solid #f3f4f6; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; }
.crx-sales-cart__row { border-bottom: 1px solid #f9fafb; }
.crx-sales-cart__name { font-size: 13px; font-weight: 600; color: #374151; }
.crx-sales-cart__sku { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.crx-sales-cart__qty { display: grid; grid-template-columns: 44px 52px 44px; gap: 4px; }
.crx-sales-cart__money { font-size: 13px; color: #6b7280; }
.crx-sales-cart__money--strong { font-weight: 700; color: #111827; }
.crx-sales-cart__price-input, .crx-sales-cart__disc-input { padding: 4px 6px; font-size: 12px; }
.crx-sales-cart__empty { padding: 24px; text-align: center; color: #9ca3af; font-size: 13px; }
.crx-sales-totals { padding: 16px 18px; }
.crx-sales-totals__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.crx-sales-totals__field span { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #9ca3af; margin-bottom: 6px; }
.crx-sales-totals__pair { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.crx-sales-totals__hint { display: block; margin-top: 4px; font-size: 11px; color: #15803d; font-weight: 600; }
.crx-sales-totals__exempt { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 13px; color: #374151; }
.crx-sales-totals__breakdown { margin-top: 14px; background: #f9fafb; border-radius: 10px; padding: 12px 14px; }
.crx-sales-totals__line { display: flex; justify-content: space-between; font-size: 13px; color: #6b7280; margin-bottom: 6px; }
.crx-sales-totals__grand { display: flex; justify-content: space-between; font-size: 20px; font-weight: 800; color: #111827; padding-top: 8px; margin-top: 4px; border-top: 1px solid #e5e7eb; }
.crx-sales-totals__grand span:last-child { color: #1447e6; }
.crx-sales-pay__body { padding: 14px 18px 18px; }
.crx-sales-pay__methods { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-bottom: 12px; }
.crx-sales-pay__method { min-height: 52px; font-size: 12px; }
.crx-sales-pay__banner { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; font-size: 13px; color: #92400e; }
.crx-sales-pay__securelink, .crx-sales-pay__status { border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; font-size: 13px; }
.crx-sales-pay__securelink { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }
.crx-sales-pay__status { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
.crx-sales-split { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; margin-bottom: 10px; }
.crx-sales-split__rows { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.crx-sales-split__row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.crx-sales-cash__quick { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.crx-sales-cash__change { display: flex; justify-content: space-between; margin-top: 8px; font-size: 13px; font-weight: 700; color: #166534; }
.crx-sales-hot__grid, .crx-sales-dept__items, .crx-sales-dept__browse { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 12px 18px 16px; }
.crx-sales-dept__shortcuts { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 18px 0; }
.crx-sales-dept__btn { border: 1px solid #e5e7eb; background: #fff; color: #374151; border-radius: 10px; padding: 10px 12px; font-size: 12px; font-weight: 700; font-family: inherit; cursor: pointer; touch-action: manipulation; min-height: 44px; }
.crx-sales-dept__btn.active { border-color: #1447e6; background: #eff6ff; color: #1447e6; }
.crx-sales-tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-height: 88px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; padding: 10px; cursor: pointer; font-family: inherit; touch-action: manipulation; transition: border-color 0.13s, box-shadow 0.13s; }
.crx-sales-tile:hover, .crx-sales-tile:active { border-color: #1447e6; box-shadow: 0 4px 12px rgba(20, 71, 230, 0.1); }
.crx-sales-tile__emoji { font-size: 22px; line-height: 1; }
.crx-sales-tile__label { font-size: 12px; font-weight: 700; color: #111827; text-align: center; line-height: 1.25; }
.crx-sales-tile__sublabel { font-size: 11px; color: #6b7280; }
.crx-sales-signature { width: 100%; border: 1px solid #dbe3ef; border-radius: 10px; touch-action: none; cursor: crosshair; }
@media (max-width: 1100px) {
  .crx-sales-register { grid-template-columns: 1fr; }
  .crx-sales-totals__grid { grid-template-columns: 1fr; }
  .crx-sales-scan__row { grid-template-columns: 1fr; }
}
@media (pointer: coarse) {
  .btn-primary, .btn-secondary { min-height: 44px; padding: 11px 18px; font-size: 14px; }
  .crx-tab { padding: 13px 18px; font-size: 14px; min-height: 44px; }
  .crx-tabs--large .crx-tab--large { min-height: 56px; padding: 16px 22px; font-size: 16px; }
  .pay-opt { min-height: 52px; padding: 14px; font-size: 13px; }
  .crx-input, .crx-select { min-height: 44px; font-size: 15px; padding: 11px 14px; }
  .crx-pos-app input[type="checkbox"], .crx-pos-auth input[type="checkbox"] { width: 22px; height: 22px; }
  .crx-demographic-chip { padding: 10px 16px; font-size: 13px; min-height: 44px; }
  .crx-pickup-btn { padding: 16px; min-height: 72px; }
  .crx-charge-btn { min-height: 56px; font-size: 16px; }
}
`}</style>
  );
}
