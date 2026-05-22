import React, { useState } from "react";
import { todayBusinessDate } from "../../../lib/reporting/businessDate";
import { useReports } from "../../../hooks/useReports";
import ReportsAccessLogSection from "./ReportsAccessLogSection";
import ReportsAuditSection from "./ReportsAuditSection";
import ReportsImmutableAuditSection from "./ReportsImmutableAuditSection";
import ReportsCashSection from "./ReportsCashSection";
import ReportsCommonSection from "./ReportsCommonSection";
import ReportsInventorySection from "./ReportsInventorySection";
import ReportsOverviewSection from "./ReportsOverviewSection";
import ReportsSalesSection from "./ReportsSalesSection";

const REPORT_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "sales", label: "Sales" },
  { id: "cash", label: "Cash & till" },
  { id: "inventory", label: "Inventory" },
  { id: "common", label: "Common reports" },
  { id: "audit", label: "Audit logs" },
  { id: "mustlog", label: "Must-log audit" },
  { id: "access", label: "Access logs" },
];

function businessDateInputValue(businessDate) {
  const raw = String(businessDate || "");
  if (raw.length !== 8) return "";
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function businessDateFromInput(value) {
  if (!value) return todayBusinessDate();
  return value.replace(/-/g, "");
}

export default function PosReportsPanel({ onNotify }) {
  const [section, setSection] = useState("overview");
  const reports = useReports({ onNotify });

  if (reports.loading) {
    return (
      <div className="crx-card" style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        Loading reporting…
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Reporting &amp; analytics</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          Daily sales · till balancing · cash reconciliation · margins · departments · top items · dead stock ·
          shrinkage · hourly · employee tracking · audit logs · access logs · EOD · cashier audit · categories ·
          vendors ·
          valuation
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
            Business date
            <input
              className="crx-input"
              type="date"
              value={businessDateInputValue(reports.businessDate)}
              onChange={(e) => reports.setBusinessDate(businessDateFromInput(e.target.value))}
              style={{ display: "block", marginTop: 4, minWidth: 160 }}
            />
          </label>
          <button type="button" className="btn-secondary" onClick={() => reports.refresh()}>
            Refresh
          </button>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
            {reports.businessDateLabel} · {reports.sales.length} sales on file
          </span>
        </div>
      </div>

      <div className="crx-tabs" style={{ marginBottom: 16 }}>
        {REPORT_SECTIONS.map((row) => (
          <button
            key={row.id}
            type="button"
            className={`crx-tab${section === row.id ? " active" : ""}`}
            onClick={() => setSection(row.id)}
          >
            {row.label}
          </button>
        ))}
      </div>

      {section === "overview" ? <ReportsOverviewSection reports={reports} /> : null}
      {section === "sales" ? <ReportsSalesSection reports={reports} /> : null}
      {section === "cash" ? <ReportsCashSection reports={reports} /> : null}
      {section === "inventory" ? <ReportsInventorySection reports={reports} /> : null}
      {section === "common" ? <ReportsCommonSection reports={reports} /> : null}
      {section === "audit" ? <ReportsAuditSection activities={reports.activities} /> : null}
      {section === "mustlog" ? <ReportsImmutableAuditSection immutableAudit={reports.immutableAudit} /> : null}
      {section === "access" ? <ReportsAccessLogSection activities={reports.activities} /> : null}
    </div>
  );
}
