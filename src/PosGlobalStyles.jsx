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
.crx-pos-app__header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 20px; background: #0f172a; color: #f8fafc; border-bottom: 1px solid #1e293b; }
.crx-pos-app__title { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
.crx-pos-app__meta { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.crx-pos-app__actions { display: flex; align-items: center; gap: 8px; }
.crx-pos-app__main { flex: 1; min-height: 0; overflow: hidden; }
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
@media (pointer: coarse) {
  .btn-primary, .btn-secondary { min-height: 44px; padding: 11px 18px; font-size: 14px; }
  .crx-tab { padding: 13px 18px; font-size: 14px; min-height: 44px; }
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
