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
`}</style>
  );
}
