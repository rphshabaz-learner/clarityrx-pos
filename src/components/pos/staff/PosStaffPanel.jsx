import React, { useMemo, useState } from "react";
import { useAuth } from "../../../AuthContext";
import {
  getRolesForPermission,
  ROLE_DEFINITIONS,
  ROLE_ORDER,
  POS_PERMISSION_DEFINITIONS,
  POS_RBAC_TIERS,
  useRoleAccess,
} from "../../../RoleAccessContext";
import { usePosTill } from "../../../context/PosTillContext";
import { useStaffManagement } from "../../../hooks/useStaffManagement";
import {
  MANAGER_OVERRIDE_ROLES,
  POS_PROTECTED_ACTIONS,
  filterOverrideAuditActivities,
  roleBypassesManagerOverride,
} from "../../../lib/posPermissions";
import { shiftStatusLabel } from "../../../lib/posShift";
import { todayBusinessDate } from "../../../lib/reporting/businessDate";
import { DataTable, SectionIntro, SubTabs, formatTs } from "../reports/ReportsShared";

const STAFF_SECTIONS = [
  { id: "staff", label: "Staff" },
  { id: "permissions", label: "Permissions" },
  { id: "roles", label: "Role access" },
  { id: "shifts", label: "Shift tracking" },
  { id: "overrides", label: "Override audit" },
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

function StaffOverviewSection({ user, activeRole, roleDefinition, shift, selectedTillNumber, managerOverrideActive }) {
  const bypassesOverride = roleBypassesManagerOverride(activeRole);
  return (
    <div>
      <SectionIntro
        title="Staff management"
        description="Signed-in till operator, active till, shift session, and manager override state for this workstation."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        <div className="crx-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Operator</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 6 }}>{user?.name || user?.username || "—"}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{user?.email || user?.id || ""}</div>
        </div>
        <div className="crx-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Role</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 6 }}>{roleDefinition?.label || activeRole}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{roleDefinition?.description}</div>
        </div>
        <div className="crx-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Till</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 6 }}>Till {selectedTillNumber}</div>
        </div>
        <div className="crx-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Shift</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 6 }}>{shift?.id || "No shift"}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{shiftStatusLabel(shift)}</div>
          {shift?.openedBy ? (
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Opened by {shift.openedBy}</div>
          ) : null}
        </div>
        <div className="crx-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
            Manager override
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 6, color: managerOverrideActive ? "#b45309" : "#111827" }}>
            {managerOverrideActive ? "Active (this till)" : bypassesOverride ? "Not required" : "Inactive"}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            {bypassesOverride
              ? "Your role can perform protected actions without a timed override."
              : "Use Mgr override in the header for price changes, gift card load, and similar actions."}
          </div>
        </div>
      </div>
    </div>
  );
}

function PermissionsMatrixSection() {
  return (
    <div>
      <SectionIntro
        title="Permissions"
        description="Which POS till roles can access each workspace capability. Permissions come from the signed-in pharmacy user role."
      />
      <div style={{ overflowX: "auto", marginBottom: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              <th style={{ padding: "10px 12px", minWidth: 160 }}>Permission</th>
              {ROLE_ORDER.map((roleId) => (
                <th key={roleId} style={{ padding: "10px 8px", textAlign: "center", fontSize: 11 }}>
                  {ROLE_DEFINITIONS[roleId]?.shortLabel || roleId}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {POS_PERMISSION_DEFINITIONS.map((perm) => {
              const allowed = getRolesForPermission(perm.id);
              return (
                <tr key={perm.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{perm.label}</td>
                  {ROLE_ORDER.map((roleId) => (
                    <td key={roleId} style={{ padding: "10px 8px", textAlign: "center" }}>
                      {allowed.includes(roleId) ? (
                        <span style={{ color: "#047857", fontWeight: 800 }} aria-label="Allowed">
                          ✓
                        </span>
                      ) : (
                        <span style={{ color: "#d1d5db" }} aria-label="Denied">
                          —
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <SectionIntro
        title="Protected actions (manager override)"
        description="These actions also require an active manager override on the till unless the operator role is manager or pharmacist level."
      />
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
        {Object.entries(POS_PROTECTED_ACTIONS).map(([key, action]) => (
          <li key={key}>
            <strong>{action.label}</strong> — needs <code style={{ fontSize: 11 }}>{action.permission}</code>
            {MANAGER_OVERRIDE_ROLES.length ? (
              <span style={{ color: "#6b7280" }}>
                {" "}
                (bypass roles: {MANAGER_OVERRIDE_ROLES.map((r) => ROLE_DEFINITIONS[r]?.shortLabel || r).join(", ")})
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleAccessSection({ activeRole }) {
  return (
    <div>
      <SectionIntro
        title="Role-based access"
        description="Three till tiers — Cashier (sales), Supervisor (refunds, voids, discounts), Admin (configurations, tax, security). Pharmacy roles map into these tiers."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {POS_RBAC_TIERS.map((tier) => (
          <div key={tier.id} className="crx-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{tier.label}</div>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "6px 0 10px" }}>{tier.summary}</p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
              {tier.capabilities.map((cap) => (
                <li key={cap}>{cap}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <SectionIntro
        title="Signed-in role"
        description="POS till roles from the pharmacy user account. Your active role is highlighted."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ROLE_ORDER.map((roleId) => {
          const def = ROLE_DEFINITIONS[roleId];
          const isActive = roleId === activeRole;
          return (
            <div
              key={roleId}
              className="crx-card"
              style={{
                padding: 14,
                border: isActive ? "2px solid #2563eb" : undefined,
                background: isActive ? "#eff6ff" : undefined,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>{def.label}</span>
                {isActive ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#1d4ed8",
                      background: "#dbeafe",
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
                  >
                    Signed in
                  </span>
                ) : null}
              </div>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "6px 0 0" }}>{def.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShiftTrackingSection({ tillShifts, businessDateLabel }) {
  return (
    <div>
      <SectionIntro
        title="Shift tracking"
        description="Cash drawer sessions recorded on this workstation (open/close per till). Shown for the selected business date."
      />
      <DataTable
        columns={[
          { key: "id", label: "Shift ID" },
          { key: "tillNumber", label: "Till", render: (row) => `Till ${row.tillNumber}` },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <span style={{ fontWeight: 700, color: row.status === "open" ? "#047857" : "#6b7280" }}>
                {row.status === "open" ? "Open" : "Closed"}
              </span>
            ),
          },
          { key: "openedAt", label: "Opened", render: (row) => formatTs(row.openedAt) },
          { key: "openedBy", label: "Opened by", render: (row) => row.openedBy || "—" },
          { key: "closedAt", label: "Closed", render: (row) => (row.closedAt ? formatTs(row.closedAt) : "—") },
          { key: "closedBy", label: "Closed by", render: (row) => row.closedBy || "—" },
        ]}
        rows={tillShifts}
        emptyMessage={`No till shifts recorded for ${businessDateLabel}.`}
      />
    </div>
  );
}

function OverrideAuditSection({ activities }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () => filterOverrideAuditActivities(activities, { query, limit: 150 }),
    [activities, query]
  );

  return (
    <div>
      <SectionIntro
        title="Override audit logs"
        description="Local trail of manager override enablement and protected actions that ran under override on this workstation."
      />
      <input
        className="crx-input"
        type="search"
        placeholder="Search override events…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 320 }}
      />
      <DataTable
        columns={[
          { key: "ts", label: "Time", render: (row) => formatTs(row.ts) },
          { key: "message", label: "Event" },
          {
            key: "detail",
            label: "Detail",
            render: (row) => {
              const d = row.detail;
              if (!d || typeof d !== "object") return "—";
              const parts = [
                d.action ? `action: ${d.action}` : null,
                d.tillNumber != null ? `till ${d.tillNumber}` : null,
                d.operatorRole ? `role: ${d.operatorRole}` : null,
                d.managerOverride ? "override used" : null,
              ].filter(Boolean);
              const text = parts.length ? parts.join(" · ") : JSON.stringify(d);
              return text.length > 100 ? `${text.slice(0, 100)}…` : text;
            },
          },
        ]}
        rows={rows}
        emptyMessage="No manager override events match your filters."
      />
    </div>
  );
}

export default function PosStaffPanel({ onNotify }) {
  const [section, setSection] = useState("staff");
  const { user } = useAuth();
  const { activeRole, roleDefinition } = useRoleAccess();
  const { selectedTillNumber, shift, managerOverrideActive } = usePosTill();
  const staff = useStaffManagement({ onNotify });

  if (staff.loading) {
    return (
      <div className="crx-card" style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        Loading staff management…
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Staff management</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          Permissions · role access · shift tracking · manager override audit
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
            Business date (shifts)
            <input
              className="crx-input"
              type="date"
              value={businessDateInputValue(staff.businessDate)}
              onChange={(e) => staff.setBusinessDate(businessDateFromInput(e.target.value))}
              style={{ display: "block", marginTop: 4, minWidth: 160 }}
            />
          </label>
          <button type="button" className="btn-secondary" onClick={() => staff.refresh()}>
            Refresh audit
          </button>
        </div>
      </div>

      <SubTabs tabs={STAFF_SECTIONS} active={section} onChange={setSection} />

      {section === "staff" ? (
        <StaffOverviewSection
          user={user}
          activeRole={activeRole}
          roleDefinition={roleDefinition}
          shift={shift}
          selectedTillNumber={selectedTillNumber}
          managerOverrideActive={managerOverrideActive}
        />
      ) : null}
      {section === "permissions" ? <PermissionsMatrixSection /> : null}
      {section === "roles" ? <RoleAccessSection activeRole={activeRole} /> : null}
      {section === "shifts" ? (
        <ShiftTrackingSection tillShifts={staff.tillShifts} businessDateLabel={staff.businessDateLabel} />
      ) : null}
      {section === "overrides" ? <OverrideAuditSection activities={staff.activities} /> : null}
    </div>
  );
}
