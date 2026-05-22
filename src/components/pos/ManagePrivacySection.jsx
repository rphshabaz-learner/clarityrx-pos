import React, { useState } from "react";
import {
  DEFAULT_POS_PRIVACY_CONFIG,
  runPosPrivacyRetentionPurge,
} from "../../lib/privacy/posPrivacyConfig";

export default function ManagePrivacySection({
  privacyConfig,
  canConfigure,
  onSavePrivacy,
  onNotify,
  logActivity,
}) {
  const [noticeVersion, setNoticeVersion] = useState(
    privacyConfig?.noticeVersion || DEFAULT_POS_PRIVACY_CONFIG.noticeVersion
  );
  const [noticeUrl, setNoticeUrl] = useState(privacyConfig?.noticeUrl || "");
  const [financialRetentionDays, setFinancialRetentionDays] = useState(
    privacyConfig?.financialRetentionDays ??
      privacyConfig?.localRetentionDays ??
      DEFAULT_POS_PRIVACY_CONFIG.financialRetentionDays
  );
  const [receiptArchiveRetentionDays, setReceiptArchiveRetentionDays] = useState(
    privacyConfig?.receiptArchiveRetentionDays ??
      DEFAULT_POS_PRIVACY_CONFIG.receiptArchiveRetentionDays
  );
  const [loyaltyInactiveRetentionDays, setLoyaltyInactiveRetentionDays] = useState(
    privacyConfig?.loyaltyInactiveRetentionDays ??
      DEFAULT_POS_PRIVACY_CONFIG.loyaltyInactiveRetentionDays
  );
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState(null);

  const buildConfigPayload = () => ({
    noticeVersion: noticeVersion.trim() || DEFAULT_POS_PRIVACY_CONFIG.noticeVersion,
    noticeUrl: noticeUrl.trim(),
    localRetentionDays: Math.max(0, Number(financialRetentionDays) || 0),
    financialRetentionDays: Math.max(0, Number(financialRetentionDays) || 0),
    receiptArchiveRetentionDays: Math.max(0, Number(receiptArchiveRetentionDays) || 0),
    loyaltyInactiveRetentionDays: Math.max(0, Number(loyaltyInactiveRetentionDays) || 0),
  });

  const handleSave = () => {
    const saved = onSavePrivacy?.(buildConfigPayload());
    onNotify?.("Privacy settings saved.", "success");
    logActivity?.("pos", "Privacy settings updated", {
      noticeVersion: saved?.noticeVersion,
      financialRetentionDays: saved?.financialRetentionDays,
      receiptArchiveRetentionDays: saved?.receiptArchiveRetentionDays,
      loyaltyInactiveRetentionDays: saved?.loyaltyInactiveRetentionDays,
    });
  };

  const handlePurge = async () => {
    const payload = buildConfigPayload();
    if (payload.financialRetentionDays <= 0) {
      onNotify?.("Set financial retention days above 0 before purging.", "error");
      return;
    }
    if (
      !window.confirm(
        `Run retention on this workstation?\n\n` +
          `• Delete completed sales and audit logs older than ${payload.financialRetentionDays} days\n` +
          `• Secure receipt detail on sales older than ${payload.receiptArchiveRetentionDays} days (totals kept)\n` +
          `• Purge inactive loyalty data dormant longer than ${payload.loyaltyInactiveRetentionDays} days\n\n` +
          `Customer profile shells are not deleted. Pharmacy server data is unchanged.`
      )
    ) {
      return;
    }
    setPurging(true);
    setPurgeResult(null);
    try {
      const result = await runPosPrivacyRetentionPurge(payload);
      setPurgeResult(result);
      logActivity?.("pos", "Local privacy retention purge", {
        salesRemoved: result.salesRemoved,
        activitiesRemoved: result.activitiesRemoved,
        receiptsSecured: result.receiptsSecured,
        loyaltyCustomersPurged: result.loyaltyCustomersPurged,
        financialRetentionDays: payload.financialRetentionDays,
      });
      onNotify?.(
        `Retention complete: ${result.salesRemoved} sale(s) removed, ${result.receiptsSecured} receipt(s) secured, ${result.loyaltyCustomersPurged} loyalty profile(s) purged.`,
        "success"
      );
    } catch (e) {
      onNotify?.(e.message || "Retention purge failed.", "error");
    } finally {
      setPurging(false);
    }
  };

  if (!canConfigure) {
    return (
      <div className="crx-card" style={{ padding: 18 }}>
        <div className="crx-card-title" style={{ marginBottom: 8 }}>
          Privacy (PIPEDA)
        </div>
        <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
          Store privacy notice version: <strong>{privacyConfig?.noticeVersion || "—"}</strong>. Contact a
          manager or pharmacist to change till privacy settings or run local retention.
        </p>
      </div>
    );
  }

  return (
    <div className="crx-card" style={{ padding: 18 }}>
      <div className="crx-card-title" style={{ marginBottom: 8 }}>
        Privacy (PIPEDA / provincial)
      </div>
      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 14px", lineHeight: 1.5 }}>
        Default privacy notice version for new consent records. Retention applies only to data in this browser —
        not customer master or invoices on the pharmacy server when transmit is enabled.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(140px, 1fr))", gap: 12, marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
          Notice version
          <input
            className="crx-input"
            value={noticeVersion}
            onChange={(e) => setNoticeVersion(e.target.value)}
            placeholder="2026-01"
            style={{ display: "block", marginTop: 6, width: "100%" }}
          />
        </label>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", gridColumn: "1 / -1" }}>
          Privacy notice URL (optional)
          <input
            className="crx-input"
            value={noticeUrl}
            onChange={(e) => setNoticeUrl(e.target.value)}
            placeholder="https://…"
            style={{ display: "block", marginTop: 6, width: "100%" }}
          />
        </label>
      </div>

      {noticeUrl.trim() ? (
        <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>
          Staff can link customers to:{" "}
          <a href={noticeUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0284c7" }}>
            {noticeUrl}
          </a>
        </p>
      ) : null}

      <div className="crx-card-title" style={{ fontSize: 13, marginBottom: 8 }}>
        Retention rules
      </div>
      <ul style={{ fontSize: 11, color: "#6b7280", margin: "0 0 12px", paddingLeft: 18, lineHeight: 1.5 }}>
        <li>Purge inactive loyalty data — points, history, and member IDs on dormant or inactive accounts</li>
        <li>Secure archived receipts — remove contact, line, and card detail; keep invoice totals for reports</li>
        <li>Retain financial records — delete local sales and audit rows only after the financial window</li>
      </ul>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(100px, 1fr))",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
          Financial records (days)
          <input
            className="crx-input"
            type="number"
            min={0}
            value={financialRetentionDays}
            onChange={(e) => setFinancialRetentionDays(e.target.value)}
            style={{ display: "block", marginTop: 6, width: "100%" }}
          />
        </label>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
          Receipt archive (days)
          <input
            className="crx-input"
            type="number"
            min={0}
            value={receiptArchiveRetentionDays}
            onChange={(e) => setReceiptArchiveRetentionDays(e.target.value)}
            style={{ display: "block", marginTop: 6, width: "100%" }}
          />
        </label>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
          Inactive loyalty (days)
          <input
            className="crx-input"
            type="number"
            min={0}
            value={loyaltyInactiveRetentionDays}
            onChange={(e) => setLoyaltyInactiveRetentionDays(e.target.value)}
            style={{ display: "block", marginTop: 6, width: "100%" }}
          />
        </label>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <button type="button" className="btn-primary" onClick={handleSave}>
          Save privacy settings
        </button>
        <button type="button" className="btn-secondary" disabled={purging} onClick={handlePurge}>
          {purging ? "Running…" : "Run retention rules"}
        </button>
      </div>

      {purgeResult && !purgeResult.skipped ? (
        <p style={{ fontSize: 11, color: "#059669", margin: 0 }}>
          Last run: {purgeResult.salesRemoved} sale(s) removed, {purgeResult.receiptsSecured} receipt(s)
          secured, {purgeResult.loyaltyCustomersPurged} loyalty profile(s) purged,{" "}
          {purgeResult.activitiesRemoved} audit row(s) removed.
        </p>
      ) : null}
    </div>
  );
}
