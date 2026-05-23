import React from "react";

export default function PosGlobalStyles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
:root {
  --crx-rx: #1d4ed8;
  --crx-rx-bg: #eff6ff;
  --crx-rx-border: #93c5fd;
  --crx-pay: #15803d;
  --crx-pay-bg: #ecfdf5;
  --crx-pay-border: #86efac;
  --crx-warn: #c2410c;
  --crx-warn-bg: #fff7ed;
  --crx-warn-border: #fdba74;
  --crx-loyalty: #7c3aed;
  --crx-loyalty-bg: #f5f3ff;
  --crx-loyalty-border: #c4b5fd;
  --crx-override: #b91c1c;
  --crx-override-bg: #fef2f2;
  --crx-override-border: #fca5a5;
  --crx-ink: #0f172a;
  --crx-ink-muted: #475569;
  --crx-surface: #ffffff;
  --crx-surface-muted: #f1f5f9;
  --crx-focus-ring: rgba(29, 78, 216, 0.2);
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; background: #f3f6fb; font-family: 'Plus Jakarta Sans', sans-serif; color: var(--crx-ink); }
@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
.screen-enter { animation: fadeUp 0.28s ease; }
.crx-content { flex: 1; overflow-y: auto; padding: 28px; min-height: 0; }
.crx-content--cashier { display: flex; flex-direction: column; overflow: hidden; padding: 10px 14px 12px; }
.crx-content--cashier .crx-demographic-bar { margin-bottom: 8px; padding: 8px 12px; }
.crx-content--cashier .crx-tabs--large { flex-shrink: 0; margin-bottom: 10px; }
.crx-content--cashier .crx-cashier-register { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.crx-content--cashier .crx-manager-banner { flex-shrink: 0; margin-bottom: 8px; }
.crx-manager-banner { padding: 12px 16px; border-radius: 12px; background: var(--crx-override-bg); border: 2px solid var(--crx-override-border); font-size: 14px; font-weight: 800; color: var(--crx-override); }
.crx-kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 1.4em; padding: 2px 6px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; font-size: 10px; font-weight: 800; font-family: inherit; color: #334155; letter-spacing: 0.02em; }
.crx-shortcuts-hint { display: flex; flex-wrap: wrap; gap: 6px 12px; font-size: 11px; font-weight: 600; color: var(--crx-ink-muted); padding: 8px 18px 0; }
.crx-tone-rx .crx-card-title, .crx-tone-rx .crx-sales-scan__label { color: var(--crx-rx); }
.crx-tone-pay .crx-card-title { color: var(--crx-pay); }
.crx-tone-loyalty .crx-card-title, .crx-sales-options-modal__field--loyalty span { color: var(--crx-loyalty); }
.crx-field-rx .crx-sales-scan__label { color: var(--crx-rx); }
.crx-field-rx .crx-input:focus { border-color: var(--crx-rx); box-shadow: 0 0 0 3px var(--crx-focus-ring); }
.crx-field-loyalty .crx-input:focus { border-color: var(--crx-loyalty); box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15); }
.crx-tab--tone-rx.active, .crx-tabs--large .crx-tab--large.crx-tab--tone-rx.active { color: var(--crx-rx); background: var(--crx-rx-bg); border-color: var(--crx-rx); }
.crx-tab--tone-pay.active, .crx-tabs--large .crx-tab--large.crx-tab--tone-pay.active { color: var(--crx-pay); background: var(--crx-pay-bg); border-color: var(--crx-pay); }
.crx-tab--tone-loyalty.active, .crx-tabs--large .crx-tab--large.crx-tab--tone-loyalty.active { color: var(--crx-loyalty); background: var(--crx-loyalty-bg); border-color: var(--crx-loyalty); }
.btn-tone-rx { background: var(--crx-rx); color: #fff; border: none; border-radius: 10px; padding: 9px 16px; font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer; min-height: 36px; }
.btn-tone-rx:hover { background: #1e40af; }
.btn-tone-pay { background: var(--crx-pay); color: #fff; border: none; border-radius: 10px; padding: 9px 16px; font-size: 13px; font-weight: 800; font-family: inherit; cursor: pointer; min-height: 36px; }
.btn-tone-pay:hover { background: #166534; }
.btn-tone-override { background: var(--crx-override); color: #fff; border: none; border-radius: 10px; padding: 9px 16px; font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer; min-height: 36px; }
.btn-tone-override:hover { background: #991b1b; }
.badge-purple { display: inline-flex; align-items: center; font-size: 11px; font-weight: 700; background: var(--crx-loyalty-bg); color: var(--crx-loyalty); border: 1px solid var(--crx-loyalty-border); border-radius: 6px; padding: 2px 8px; }
.crx-sales-totals__line--loyalty span { color: var(--crx-loyalty); font-weight: 700; }
.crx-sales-cart__row--override .crx-sales-cart__price-input { border-color: var(--crx-override); background: var(--crx-override-bg); }
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
.pay-opt { border:2px solid #e5e7eb;border-radius:12px;padding:12px;cursor:pointer;text-align:center;font-size:13px;font-weight:700;color:#475569;transition:all 0.13s;background:#fff; touch-action: manipulation; }
.pay-opt:hover { border-color:var(--crx-pay);color:var(--crx-pay); }
.pay-opt.active { border-color:var(--crx-pay);color:var(--crx-pay);background:var(--crx-pay-bg); }
.pay-opt:active { border-color:var(--crx-pay);color:var(--crx-pay); }
.crx-pos-app { min-height: 100vh; display: flex; flex-direction: column; background: #f8fafc; }
.crx-pos-app__main { flex: 1; min-height: 0; overflow: hidden; }
.crx-pos-header { background: #0f172a; color: #f8fafc; border-bottom: 1px solid #1e293b; display: flex; flex-direction: column; }
.crx-pos-header__row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; flex-wrap: wrap; }
.crx-pos-header__row--secondary { align-items: flex-start; border-top: 1px solid #1e293b; padding-top: 10px; padding-bottom: 12px; }
.crx-pos-header__brand { flex: 1 1 320px; min-width: 0; }
.crx-pos-header__brand-line { display: flex; align-items: center; gap: 9px; min-width: 0; }
.crx-pos-header__logo { width: 28px; height: 28px; border-radius: 9px; flex: 0 0 auto; box-shadow: 0 8px 18px rgba(15, 23, 42, 0.24); }
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
.crx-pos-header__lookup { display: grid; grid-template-columns: auto minmax(180px, 1fr) auto; align-items: center; gap: 8px; flex: 1 1 420px; min-width: min(100%, 300px); }
.crx-pos-header__lookup-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; white-space: nowrap; }
.crx-pos-header__lookup-input { width: 100%; min-width: 0; border: 1px solid #334155; border-radius: 8px; padding: 8px 10px; font-size: 13px; font-family: inherit; color: #f8fafc; background: #1e293b; outline: none; }
.crx-pos-header__lookup-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.25); }
.crx-pos-header__lookup-btn { min-height: 36px; padding: 8px 12px; font-size: 12px; white-space: nowrap; }
.crx-pos-header__alerts { display: flex; gap: 6px; flex-wrap: wrap; }
.crx-pos-header__alert { border-radius: 8px; padding: 6px 10px; font-size: 11px; font-weight: 700; border: 1px solid; cursor: pointer; font-family: inherit; }
.crx-pos-header__alert--info { background: #1e3a5f; border-color: #2563eb; color: #bfdbfe; }
.crx-pos-header__alert--warn { background: #9a3412; border-color: var(--crx-warn-border); color: #ffedd5; }
.crx-pos-header__quick-btn--override { border-color: var(--crx-override-border) !important; color: var(--crx-override) !important; }
.crx-pos-header__quick-btn--override.is-active { background: var(--crx-override) !important; color: #fff !important; border-color: var(--crx-override) !important; }
.crx-pos-header__alert--error { background: #7f1d1d; border-color: #dc2626; color: #fecaca; }
.crx-pos-header__quick { display: flex; flex-wrap: wrap; gap: 8px; margin-left: auto; justify-content: flex-end; max-width: 100%; }
.crx-pos-header__quick-btn { min-height: 38px; padding: 8px 12px; font-size: 11px; white-space: nowrap; }
@media (max-width: 760px) {
  .crx-pos-header__row { padding-inline: 14px; }
  .crx-pos-header__clock { margin-left: auto; }
  .crx-pos-header__status { width: 100%; }
  .crx-pos-header__lookup { flex-basis: 100%; grid-template-columns: minmax(0, 1fr) auto; }
  .crx-pos-header__lookup-label { grid-column: 1 / -1; }
  .crx-pos-header__quick { width: 100%; margin-left: 0; justify-content: flex-start; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .crx-pos-header__quick-btn { width: 100%; padding-inline: 8px; }
}
@media (max-width: 480px) {
  .crx-pos-header__quick { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.crx-pos-header__modal-backdrop { position: fixed; inset: 0; z-index: 100; background: rgba(15,23,42,0.55); display: grid; place-items: center; padding: 24px; }
.crx-pos-header__modal { width: 100%; max-width: 400px; background: #fff; border-radius: 14px; padding: 20px; box-shadow: 0 20px 50px rgba(15,23,42,0.2); }
@media (pointer: coarse) {
  .crx-pos-header__quick-btn, .crx-pos-header__lookup-btn { min-height: 44px; font-size: 12px; }
  .crx-pos-header__lookup-input { min-height: 44px; font-size: 14px; }
}
.crx-pos-auth { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: linear-gradient(160deg, #ecfdf5 0%, #f8fafc 45%, #eff6ff 100%); }
.crx-pos-auth__brand { position: absolute; top: 24px; left: 24px; }
.crx-pos-auth__title { font-size: 22px; font-weight: 800; color: #0f172a; }
.crx-pos-auth__subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
.auth-login-logo { width: 42px; height: 42px; border-radius: 12px; flex: 0 0 auto; box-shadow: 0 16px 30px rgba(15, 23, 42, 0.16); }

/* Touch-screen monitors: finger-sized targets, tap feedback, no hover-only UI */
html, .crx-pos-app, .crx-pos-auth { touch-action: manipulation; -webkit-text-size-adjust: 100%; }
.crx-pos-app, .crx-pos-auth { -webkit-tap-highlight-color: rgba(20, 71, 230, 0.12); }
.crx-tab:active:not(.active) { color: #374151; }
.btn-primary:active:not(:disabled) { background: #1035c9; }
.btn-secondary:active:not(:disabled) { background: #f9fafb; border-color: #d1d5db; }
.pay-opt:active { border-color: var(--crx-pay); color: var(--crx-pay); }
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
.crx-sales-scan--rx { border-left: 4px solid var(--crx-rx); }
.crx-sales-scan__rx { color: var(--crx-rx); font-weight: 800; }
.crx-sales-scan__rx--idle { color: #64748b; font-weight: 600; }
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
.crx-sales-totals__grand span:last-child { color: var(--crx-pay); }
.crx-charge-btn { background: var(--crx-pay) !important; }
.crx-charge-btn:hover { background: #166534 !important; }
.crx-charge-btn:active:not(:disabled) { background: #14532d !important; }
.crx-sales-pay__body { padding: 14px 18px 18px; }
.crx-sales-pay__methods { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-bottom: 12px; }
.crx-sales-pay__method { min-height: 52px; font-size: 12px; }
.crx-sales-pay--panel { border-top: 3px solid var(--crx-pay); }
.crx-sales-pay__banner { background: var(--crx-warn-bg); border: 2px solid var(--crx-warn-border); border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; font-size: 14px; font-weight: 700; color: var(--crx-warn); }
.crx-sales-pay__securelink, .crx-sales-pay__status { border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; font-size: 13px; font-weight: 600; }
.crx-sales-pay__securelink { background: var(--crx-rx-bg); border: 1px solid var(--crx-rx-border); color: var(--crx-rx); }
.crx-sales-pay__status { background: var(--crx-pay-bg); border: 1px solid var(--crx-pay-border); color: var(--crx-pay); }
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
/* Mobile handheld — phone-sized layout, scan-first tasks */
.crx-handheld { max-width: 480px; margin: 0 auto; width: 100%; }
.crx-handheld__task-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.crx-handheld__task { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; min-height: 120px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 14px; background: #fff; cursor: pointer; font-family: inherit; text-align: left; touch-action: manipulation; transition: border-color 0.13s, box-shadow 0.13s; }
.crx-handheld__task:active { border-color: #1447e6; box-shadow: 0 4px 12px rgba(20, 71, 230, 0.12); }
.crx-handheld__task-emoji { font-size: 28px; line-height: 1; }
.crx-handheld__task-label { font-size: 14px; font-weight: 800; color: #111827; }
.crx-handheld__task-desc { font-size: 11px; color: #6b7280; line-height: 1.4; }
.crx-handheld__back { background: none; border: none; color: #2563eb; font-size: 14px; font-weight: 700; padding: 8px 0 12px; cursor: pointer; font-family: inherit; min-height: 44px; touch-action: manipulation; }
.crx-handheld__scan { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
.crx-handheld__scan-input { min-height: 52px !important; font-size: 16px !important; }
.crx-handheld__scan-btn { min-height: 48px; width: 100%; }
.crx-handheld__product-card { padding: 16px; margin-top: 12px; }
.crx-handheld__product-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 14px; }
.crx-handheld__stat { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 8px; background: #f9fafb; }
.crx-handheld__stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #9ca3af; }
.crx-handheld__stat-value { font-size: 14px; font-weight: 800; color: #111827; margin-top: 4px; word-break: break-word; }
@media (max-width: 1100px) {
  .crx-sales-register { grid-template-columns: 1fr; }
  .crx-sales-totals__grid { grid-template-columns: 1fr; }
  .crx-sales-scan__row { grid-template-columns: 1fr; }
}
/* ——— Accessibility modes (classes on <html>) ——— */
.crx-skip-link {
  position: absolute; left: -9999px; top: auto; width: 1px; height: 1px; overflow: hidden;
  z-index: 10000; padding: 12px 18px; font-size: 14px; font-weight: 800; font-family: inherit;
  background: #1447e6; color: #fff; border-radius: 10px; text-decoration: none;
}
.crx-skip-link:focus {
  left: 12px; top: 12px; width: auto; height: auto; outline: 3px solid #fbbf24; outline-offset: 2px;
}
.crx-sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
html.crx-a11y-keyboard-nav *:focus-visible {
  outline: 3px solid #2563eb !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 1px #fff, 0 0 0 4px rgba(37, 99, 235, 0.35) !important;
}
html.crx-a11y-keyboard-nav .crx-tab:focus-visible,
html.crx-a11y-keyboard-nav .crx-tab--large:focus-visible {
  border-color: #2563eb;
}
html.crx-a11y-large-font {
  --crx-a11y-font-scale: 1.18;
}
html.crx-a11y-large-font .crx-pos-app,
html.crx-a11y-large-font .crx-pos-auth {
  font-size: calc(14px * var(--crx-a11y-font-scale));
}
html.crx-a11y-large-font .btn-primary,
html.crx-a11y-large-font .btn-secondary,
html.crx-a11y-large-font .btn-tone-rx,
html.crx-a11y-large-font .btn-tone-pay,
html.crx-a11y-large-font .btn-tone-override {
  font-size: calc(13px * var(--crx-a11y-font-scale));
  min-height: calc(36px * var(--crx-a11y-font-scale));
}
html.crx-a11y-large-font .crx-input,
html.crx-a11y-large-font .crx-select {
  font-size: calc(13px * var(--crx-a11y-font-scale));
  min-height: calc(40px * var(--crx-a11y-font-scale));
}
html.crx-a11y-large-font .crx-tab,
html.crx-a11y-large-font .crx-tabs--large .crx-tab--large {
  font-size: calc(13px * var(--crx-a11y-font-scale));
}
html.crx-a11y-large-font .crx-tabs--large .crx-tab--large {
  min-height: calc(52px * var(--crx-a11y-font-scale));
  font-size: calc(15px * var(--crx-a11y-font-scale));
}
html.crx-a11y-large-font .crx-card-title { font-size: calc(14px * var(--crx-a11y-font-scale)); }
html.crx-a11y-large-font .crx-sales-totals__grand { font-size: calc(20px * var(--crx-a11y-font-scale)); }
html.crx-a11y-large-font .crx-pos-header__title { font-size: calc(16px * var(--crx-a11y-font-scale)); }
html.crx-a11y-large-font .crx-charge-btn { font-size: calc(15px * var(--crx-a11y-font-scale)); min-height: calc(48px * var(--crx-a11y-font-scale)); }
html.crx-a11y-high-contrast {
  --crx-ink: #000000;
  --crx-ink-muted: #1a1a1a;
  --crx-surface: #ffffff;
  --crx-surface-muted: #e8e8e8;
  --crx-rx: #0000aa;
  --crx-rx-bg: #e8ecff;
  --crx-rx-border: #0000aa;
  --crx-pay: #006600;
  --crx-pay-bg: #e6ffe6;
  --crx-pay-border: #006600;
  --crx-warn: #8a2a00;
  --crx-warn-bg: #fff0e6;
  --crx-warn-border: #8a2a00;
  --crx-loyalty: #4a0080;
  --crx-loyalty-bg: #f3e8ff;
  --crx-loyalty-border: #4a0080;
  --crx-override: #8b0000;
  --crx-override-bg: #ffe6e6;
  --crx-override-border: #8b0000;
  --crx-focus-ring: rgba(0, 0, 170, 0.45);
}
html.crx-a11y-high-contrast,
html.crx-a11y-high-contrast .crx-pos-app {
  background: #ffffff;
  color: #000000;
}
html.crx-a11y-high-contrast .crx-card {
  border: 2px solid #000000;
  box-shadow: none;
}
html.crx-a11y-high-contrast .crx-input,
html.crx-a11y-high-contrast .crx-select {
  border: 2px solid #000000;
  color: #000000;
}
html.crx-a11y-high-contrast .crx-tab {
  color: #1a1a1a;
  border-bottom-color: transparent;
}
html.crx-a11y-high-contrast .crx-tab.active {
  color: #0000aa;
  border-bottom-color: #0000aa;
  font-weight: 800;
}
html.crx-a11y-high-contrast .btn-secondary {
  border: 2px solid #000000;
  color: #000000;
}
html.crx-a11y-high-contrast .crx-pos-header {
  border-bottom: 3px solid #ffffff;
}
html.crx-a11y-touch-targets .crx-pos-app button:not(.crx-sr-only),
html.crx-a11y-touch-targets .crx-pos-app [role="tab"],
html.crx-a11y-touch-targets .crx-pos-app .pay-opt,
html.crx-a11y-touch-targets .crx-pos-app .crx-sales-tile,
html.crx-a11y-touch-targets .crx-pos-app .crx-demographic-chip,
html.crx-a11y-touch-targets .crx-pos-app .crx-handheld__task {
  min-height: 48px;
  min-width: 48px;
}
html.crx-a11y-touch-targets .crx-pos-app .crx-qty-btn,
html.crx-a11y-touch-targets .crx-pos-app .crx-icon-btn {
  min-width: 48px;
  min-height: 48px;
}
html.crx-a11y-touch-targets .crx-pos-app .crx-tabs--large .crx-tab--large {
  min-height: 56px;
  padding: 16px 22px;
}
html.crx-a11y-touch-targets .crx-pos-app input[type="checkbox"] {
  width: 24px;
  height: 24px;
}
html.crx-a11y-screen-reader .screen-enter,
html[data-crx-reduced-motion="true"] .screen-enter {
  animation: none;
}
@media (prefers-reduced-motion: reduce) {
  .screen-enter { animation: none; }
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
  .crx-charge-btn { min-height: 56px; font-size: 17px; font-weight: 800; }
  .crx-sales-pay__method { min-height: 56px; font-size: 14px; }
}
`}</style>
  );
}
