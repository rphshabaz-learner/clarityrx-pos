import React, { useEffect, useMemo, useState } from "react";
import { usePosKeyboardShortcuts } from "../../hooks/usePosKeyboardShortcuts";
import { useAuth } from "../../AuthContext";
import { useRoleAccess } from "../../RoleAccessContext";
import { usePosTill } from "../../context/PosTillContext";
import { usePosHeaderStatus } from "../../hooks/usePosHeaderStatus";
import { deviceTillBindingLabel } from "../../lib/posDeviceTill";
import { POS_TILL_OPTIONS } from "../../lib/posTill";
import { logImmutableAudit } from "../../lib/audit/posImmutableAudit";
import { shiftStatusLabel } from "../../lib/posShift";
import { usePosWorkspaceData } from "../../hooks/usePosWorkspaceData";
import { resolveStoreDisplayName } from "../../lib/posStoreDisplay";
import { POS_FRONT_STORE_ITEMS } from "../../modules/pos/posCatalog";

function formatClock(now) {
  return now.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function StatusPill({ tone = "neutral", label, detail, title }) {
  const tones = {
    ok: { bg: "#14532d", border: "#166534", text: "#bbf7d0" },
    warn: { bg: "#9a3412", border: "#ea580c", text: "#ffedd5" },
    override: { bg: "#7f1d1d", border: "#b91c1c", text: "#fecaca" },
    rx: { bg: "#1e3a8a", border: "#2563eb", text: "#dbeafe" },
    neutral: { bg: "#1e293b", border: "#334155", text: "#cbd5e1" },
    error: { bg: "#7f1d1d", border: "#991b1b", text: "#fecaca" },
  };
  const palette = tones[tone] || tones.neutral;
  return (
    <div
      className="crx-pos-header__pill"
      title={title || detail || label}
      style={{ background: palette.bg, borderColor: palette.border, color: palette.text }}
    >
      <span className="crx-pos-header__pill-label">{label}</span>
      {detail ? <span className="crx-pos-header__pill-detail">{detail}</span> : null}
    </div>
  );
}

function QuickButton({ label, onClick, disabled, title, variant = "secondary", ariaLabel }) {
  return (
    <button
      type="button"
      className={variant === "primary" ? "btn-primary crx-pos-header__quick-btn" : "btn-secondary crx-pos-header__quick-btn"}
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      aria-label={ariaLabel || title || label}
    >
      {label}
    </button>
  );
}

export default function PosTopHeaderBar({ onNotify }) {
  const { user, logout } = useAuth();
  const { roleDefinition, hasPermission } = useRoleAccess();
  const {
    selectedTillNumber,
    setSelectedTillNumber,
    deviceTillBinding,
    deviceTillLocked,
    shift,
    openShift,
    closeShift,
    isShiftOpen,
    suspendedSale,
    lastCompletedSale,
    managerOverrideActive,
    activateManagerOverride,
    headerAlerts,
    pushHeaderAlert,
    dismissHeaderAlert,
    invokeTillAction,
  } = usePosTill();
  const { health, kroll, syncStatus } = usePosHeaderStatus();
  const { logActivity } = usePosWorkspaceData();

  const [now, setNow] = useState(() => new Date());
  const [customerQuery, setCustomerQuery] = useState("");
  const [showPriceCheck, setShowPriceCheck] = useState(false);
  const [priceCheckQuery, setPriceCheckQuery] = useState("");
  const [showManagerModal, setShowManagerModal] = useState(false);

  const storeName = useMemo(() => resolveStoreDisplayName(), []);
  const cashierName = user?.fullName || user?.username || "Cashier";
  const canCharge = hasPermission("pos.charge");
  const canManager =
    hasPermission("pos.charge") &&
    ["admin", "store_manager", "pharmacist", "relief_pharmacist"].includes(user?.role);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const priceCheckItem = useMemo(() => {
    const q = priceCheckQuery.trim().toLowerCase();
    if (!q) return null;
    return (
      POS_FRONT_STORE_ITEMS.find((item) =>
        [item.sku, item.barcode, item.name].some((value) => String(value).toLowerCase().includes(q))
      ) || null
    );
  }, [priceCheckQuery]);

  const krollTone = kroll.connected === true ? "ok" : kroll.connected === false ? "error" : "neutral";
  const showSyncStatus = syncStatus.label !== "Offline mode";

  const notify = (message, type = "info") => {
    if (onNotify) {
      onNotify(message, type);
      return;
    }
    pushHeaderAlert({ message, tone: type === "error" ? "error" : type === "warning" ? "warn" : "info" });
  };

  const handleCustomerLookup = () => {
    const query = customerQuery.trim();
    if (!query) return;
    const handled = invokeTillAction("customerLookup", query);
    if (handled === false) {
      notify("Customer lookup is not ready on this screen.", "warning");
    }
    setCustomerQuery("");
  };

  const handleManagerOverride = () => {
    if (!canManager) {
      notify("Manager role required for override.", "warning");
      return;
    }
    setShowManagerModal(true);
  };

  usePosKeyboardShortcuts({
    enabled: canManager,
    handlers: { managerOverride: handleManagerOverride },
  });

  const confirmManagerOverride = () => {
    activateManagerOverride(5);
    invokeTillAction("managerOverride");
    setShowManagerModal(false);
    notify("Manager override active for 5 minutes.", "success");
  };

  const handleReprint = () => {
    if (!lastCompletedSale) {
      notify("No recent sale to reprint.", "warning");
      return;
    }
    invokeTillAction("reprintReceipt", lastCompletedSale);
  };

  const handleCashDrop = () => {
    const raw = window.prompt("Cash drop amount ($):", "");
    if (raw == null) return;
    const amount = Number(String(raw).replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      notify("Enter a valid cash drop amount.", "warning");
      return;
    }
    const reason = window.prompt("Reason (optional):", "safe_drop") || "safe_drop";
    void logImmutableAudit(logActivity, {
      user: user?.id || user?.username,
      action: "cash_drop",
      terminal: selectedTillNumber,
      newValue: Number(amount.toFixed(2)),
      reason,
      detail: { shiftId: shift?.id || null },
    });
    notify(`Cash drop $${amount.toFixed(2)} recorded.`, "success");
  };

  return (
    <>
      <header className="crx-pos-header" role="banner">
        <div className="crx-pos-header__row crx-pos-header__row--primary">
          <div className="crx-pos-header__brand">
            <div className="crx-pos-header__brand-line">
              <img className="crx-pos-header__logo" src="/clarity-pos-icon.svg" alt="" aria-hidden="true" />
              <div className="crx-pos-header__title">Clarity POS</div>
            </div>
            <div className="crx-pos-header__identity">
              <span className="crx-pos-header__chip">
                <span className="crx-pos-header__chip-label">Cashier</span>
                {cashierName}
                {roleDefinition?.shortLabel ? ` · ${roleDefinition.shortLabel}` : ""}
                {!canCharge ? " · view only" : ""}
              </span>
              {deviceTillLocked ? (
                <span
                  className="crx-pos-header__chip crx-pos-header__chip--till"
                  title={`${deviceTillBindingLabel(deviceTillBinding)} — cashiers cannot change till on this device`}
                >
                  <span className="crx-pos-header__chip-label">Till</span>
                  <strong>{selectedTillNumber}</strong>
                </span>
              ) : (
                <label className="crx-pos-header__chip crx-pos-header__chip--till">
                  <span className="crx-pos-header__chip-label">Till</span>
                  <select
                    className="crx-pos-header__till-select"
                    value={selectedTillNumber}
                    onChange={(event) => setSelectedTillNumber(Number(event.target.value))}
                    aria-label="Select till number"
                  >
                    {POS_TILL_OPTIONS.map((tillNumber) => (
                      <option key={tillNumber} value={tillNumber}>
                        {tillNumber}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <span className="crx-pos-header__chip">
                <span className="crx-pos-header__chip-label">Store</span>
                {storeName}
              </span>
              <span className={`crx-pos-header__chip crx-pos-header__chip--shift${shift?.status === "open" ? " is-open" : ""}`}>
                <span className="crx-pos-header__chip-label">Shift</span>
                {shift?.id || "—"} · {shiftStatusLabel(shift)}
              </span>
            </div>
          </div>

          <div className="crx-pos-header__clock" aria-live="polite">
            {formatClock(now)}
          </div>

          <div className="crx-pos-header__status">
            {showSyncStatus ? (
              <StatusPill
                tone={syncStatus.tone === "ok" ? "ok" : syncStatus.tone === "warn" ? "warn" : "neutral"}
                label={syncStatus.label}
                detail={syncStatus.detail}
              />
            ) : null}
            <StatusPill
              tone={health.ok === false ? "error" : health.ok ? "ok" : "neutral"}
              label={health.ok === false ? "API offline" : "Transmit"}
              detail={health.ok === false ? "Check connection" : "Online"}
              title={health.message || undefined}
            />
            <StatusPill tone={kroll.connected === true ? "rx" : krollTone} label={kroll.label} detail={kroll.detail} />
            {managerOverrideActive ? <StatusPill tone="override" label="Mgr override" detail="Active" /> : null}
            {suspendedSale ? <StatusPill tone="warn" label="Suspended sale" detail="Resume · F5" /> : null}
          </div>
        </div>

        <div className="crx-pos-header__row crx-pos-header__row--secondary">
          <div className="crx-pos-header__lookup" role="search">
            <span className="crx-pos-header__lookup-label" id="pos-header-customer-lookup-label">
              Customer lookup
            </span>
            <input
              className="crx-pos-header__lookup-input"
              placeholder="Bag barcode, Rx #, or name"
              aria-labelledby="pos-header-customer-lookup-label"
              value={customerQuery}
              onChange={(event) => setCustomerQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCustomerLookup();
                }
              }}
            />
            <button type="button" className="btn-tone-rx crx-pos-header__lookup-btn" onClick={handleCustomerLookup}>
              Look up
            </button>
          </div>

          {headerAlerts.length > 0 ? (
            <div className="crx-pos-header__alerts" aria-live="polite">
              {headerAlerts.slice(0, 2).map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  className={`crx-pos-header__alert crx-pos-header__alert--${alert.tone || "info"}`}
                  onClick={() => dismissHeaderAlert(alert.id)}
                  title="Dismiss alert"
                >
                  {alert.message}
                </button>
              ))}
            </div>
          ) : null}

          <div className="crx-pos-header__quick">
            <QuickButton
              label="Suspend"
              title="Suspend current sale"
              onClick={() => invokeTillAction("suspendSale")}
              disabled={!canCharge}
            />
            <QuickButton
              label="Resume"
              title="Resume suspended sale"
              onClick={() => invokeTillAction("resumeSale")}
              disabled={!canCharge || !suspendedSale}
            />
            {isShiftOpen ? (
              <QuickButton
                label="Close shift"
                title={`Close cash drawer session on till ${selectedTillNumber}`}
                onClick={() => {
                  closeShift();
                  notify(`Till ${selectedTillNumber} shift closed.`, "success");
                }}
                disabled={!canCharge}
              />
            ) : (
              <QuickButton
                label="Open shift"
                title={`Open cash drawer session on till ${selectedTillNumber}`}
                onClick={() => {
                  openShift();
                  notify(`Till ${selectedTillNumber} shift opened.`, "success");
                }}
                disabled={!canCharge}
                variant="primary"
              />
            )}
            <QuickButton label="No sale" title="Open cash drawer without a sale" onClick={() => invokeTillAction("noSale")} />
            <QuickButton
              label="Cash drop"
              title="Record cash removed from drawer to safe"
              onClick={handleCashDrop}
              disabled={!canCharge}
            />
            {canManager ? (
              <QuickButton
                label="Drawer count"
                title="Record physical cash count for till variance warnings"
                onClick={() => invokeTillAction("recordDrawerCount")}
                disabled={!canCharge}
              />
            ) : null}
            <QuickButton label="Price check" onClick={() => setShowPriceCheck(true)} />
            <button
              type="button"
              className={`crx-pos-header__quick-btn crx-pos-header__quick-btn--override btn-secondary${managerOverrideActive ? " is-active" : ""}`}
              onClick={handleManagerOverride}
              disabled={!canManager}
              title="Manager override (F7)"
            >
              Mgr override
            </button>
            <QuickButton label="Reprint" onClick={handleReprint} disabled={!lastCompletedSale} />
            <button type="button" className="btn-secondary crx-pos-header__quick-btn" onClick={() => logout()}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {showPriceCheck ? (
        <div className="crx-pos-header__modal-backdrop" role="presentation" onClick={() => setShowPriceCheck(false)}>
          <div
            className="crx-pos-header__modal"
            role="dialog"
            aria-labelledby="price-check-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div id="price-check-title" style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
              Price check
            </div>
            <input
              className="crx-input"
              autoFocus
              placeholder="Scan or enter SKU / barcode"
              value={priceCheckQuery}
              onChange={(event) => setPriceCheckQuery(event.target.value)}
            />
            {priceCheckItem ? (
              <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700 }}>{priceCheckItem.name}</div>
                <div style={{ color: "#64748b", marginTop: 4 }}>{priceCheckItem.sku}</div>
                <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>${priceCheckItem.price.toFixed(2)}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>In stock: {priceCheckItem.stock}</div>
              </div>
            ) : priceCheckQuery.trim() ? (
              <div style={{ marginTop: 12, fontSize: 13, color: "#b91c1c" }}>No matching front-store item.</div>
            ) : null}
            <button type="button" className="btn-secondary" style={{ marginTop: 16, width: "100%" }} onClick={() => setShowPriceCheck(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}

      {showManagerModal ? (
        <div className="crx-pos-header__modal-backdrop" role="presentation" onClick={() => setShowManagerModal(false)}>
          <div
            className="crx-pos-header__modal"
            role="dialog"
            aria-labelledby="manager-override-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div id="manager-override-title" style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
              Manager override
            </div>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, marginBottom: 16 }}>
              Confirm manager approval for price changes, voids, or restricted actions on this till.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowManagerModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn-tone-override" style={{ flex: 1 }} onClick={confirmManagerOverride}>
                Approve override
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
