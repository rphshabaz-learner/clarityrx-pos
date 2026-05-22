import React, { useEffect, useState } from "react";
import {
  applyConsentChange,
  CONSENT_CHANNEL_OPTIONS,
  consentStatusLabel,
  DEFAULT_PRIVACY_NOTICE_VERSION,
  normalizeCustomerPrivacy,
} from "../../../lib/customers/customerConsent";
import { loadPosPrivacyConfig } from "../../../lib/privacy/posPrivacyConfig";
import { CustomerListSidebar, EmptyState, FieldLabel, SectionIntro } from "./CustomersShared";

const storePrivacy = loadPosPrivacyConfig();

export default function CustomersConsentSection({
  filteredCustomers,
  selectedCustomer,
  selectedCustomerId,
  setSelectedCustomerId,
  listQuery,
  setListQuery,
  busy,
  onCreateCustomer,
  onSaveCustomer,
}) {
  const privacy = selectedCustomer ? normalizeCustomerPrivacy(selectedCustomer) : null;
  const [accessRequestNote, setAccessRequestNote] = useState("");

  useEffect(() => {
    setAccessRequestNote(selectedCustomer?.accessRequest?.note || "");
  }, [selectedCustomer?.id, selectedCustomer?.accessRequest?.note]);

  const effectiveNoticeVersion =
    privacy?.privacyNoticeVersion || storePrivacy.noticeVersion || DEFAULT_PRIVACY_NOTICE_VERSION;

  const setConsent = (channel, granted) => {
    if (!selectedCustomer) return;
    onSaveCustomer(
      applyConsentChange(selectedCustomer, channel, granted, {
        source: "till",
        privacyNoticeVersion: effectiveNoticeVersion,
      })
    );
  };

  const setPrivacyNoticeVersion = (version) => {
    if (!selectedCustomer) return;
    onSaveCustomer({
      ...selectedCustomer,
      privacyNoticeVersion: version.trim() || DEFAULT_PRIVACY_NOTICE_VERSION,
    });
  };

  return (
    <div>
      <SectionIntro
        title="Privacy & consent"
        description="Record loyalty, marketing, SMS, email, and eReceipt preferences with timestamps for PIPEDA / provincial privacy audits. Obtain consent before using contact details for non-transactional purposes."
      />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) minmax(0, 2fr)", gap: 16 }}>
        <CustomerListSidebar
          customers={filteredCustomers}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          listQuery={listQuery}
          setListQuery={setListQuery}
          onCreate={onCreateCustomer}
          busy={busy}
        />
        <div className="crx-card" style={{ padding: 16 }}>
          {!selectedCustomer || !privacy ? (
            <EmptyState message="Select a customer to manage consent." />
          ) : (
            <>
              <div style={{ marginBottom: 16, padding: 12, background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
                <div style={{ fontSize: 12, color: "#0369a1", lineHeight: 1.5 }}>
                  Check each box only after the customer agrees on the current privacy notice. Unchecking records a
                  decline with today&apos;s date. See docs/privacy-compliance.md for retention and marketing rules.
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <FieldLabel>Privacy notice version</FieldLabel>
                <input
                  className="crx-input"
                  value={privacy.privacyNoticeVersion}
                  onChange={(e) => setPrivacyNoticeVersion(e.target.value)}
                  placeholder={storePrivacy.noticeVersion || DEFAULT_PRIVACY_NOTICE_VERSION}
                  style={{ marginTop: 6, maxWidth: 200 }}
                />
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                  Store default: {storePrivacy.noticeVersion || DEFAULT_PRIVACY_NOTICE_VERSION}. Stored on each
                  consent change.
                  {storePrivacy.noticeUrl ? (
                    <>
                      {" "}
                      <a href={storePrivacy.noticeUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0284c7" }}>
                        View notice
                      </a>
                    </>
                  ) : null}
                </p>
              </div>

              <div style={{ marginBottom: 20, padding: 12, background: "#f9fafb", borderRadius: 8 }}>
                <FieldLabel>Access request (PIPEDA)</FieldLabel>
                <textarea
                  className="crx-input"
                  rows={2}
                  value={accessRequestNote}
                  onChange={(e) => setAccessRequestNote(e.target.value)}
                  placeholder="Customer asked for a copy of their information — log date and next step."
                  style={{ width: "100%", marginTop: 6, resize: "vertical" }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginTop: 8, fontSize: 12 }}
                  disabled={busy}
                  onClick={() => {
                    const note = accessRequestNote.trim();
                    onSaveCustomer({
                      ...selectedCustomer,
                      accessRequest: {
                        note: accessRequestNote,
                        at: note ? new Date().toISOString() : null,
                      },
                    });
                  }}
                >
                  Save access request note
                </button>
                {selectedCustomer.accessRequest?.at ? (
                  <p style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                    Logged: {consentStatusLabel({ granted: true, at: selectedCustomer.accessRequest.at })}
                  </p>
                ) : null}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {CONSENT_CHANNEL_OPTIONS.map((row) => {
                  const record = privacy.consent[row.id];
                  const granted = record?.granted === true;
                  return (
                    <div
                      key={row.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: 14,
                        background: granted ? "#f0fdf4" : "#fafafa",
                      }}
                    >
                      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={granted}
                          disabled={busy}
                          onChange={(e) => setConsent(row.id, e.target.checked)}
                          style={{ marginTop: 3 }}
                        />
                        <span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{row.label}</span>
                          <span style={{ display: "block", fontSize: 12, color: "#6b7280", marginTop: 4, lineHeight: 1.45 }}>
                            {row.description}
                          </span>
                        </span>
                      </label>
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 10, marginLeft: 26 }}>
                        {consentStatusLabel(record)}
                        {record?.privacyNoticeVersion ? (
                          <span> · Notice {record.privacyNoticeVersion}</span>
                        ) : null}
                        {record?.source ? <span> · via {record.source}</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {privacy.consent.updatedAt ? (
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 16 }}>
                  Last consent update: {consentStatusLabel({ granted: true, at: privacy.consent.updatedAt })}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
