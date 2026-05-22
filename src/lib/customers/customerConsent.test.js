import {
  applyConsentChange,
  CONSENT_CHANNEL,
  customerHasConsent,
  diffConsentChanges,
  emptyCustomerConsent,
  normalizeCustomerConsent,
  normalizeCustomerPrivacy,
} from "./customerConsent";

describe("customerConsent", () => {
  it("returns empty consent channels by default", () => {
    const consent = emptyCustomerConsent();
    expect(consent.loyalty.granted).toBe(false);
    expect(consent.eReceipts.granted).toBe(false);
  });

  it("normalizes legacy boolean consent flags", () => {
    const merged = normalizeCustomerConsent({
      consent: { loyalty: true, marketing: false, at: "2025-01-01T00:00:00.000Z" },
      privacyNoticeVersion: "2025-06",
    });
    expect(merged.loyalty.granted).toBe(true);
    expect(merged.loyalty.source).toBe("legacy");
    expect(merged.marketing.granted).toBe(false);
  });

  it("applies consent change with timestamp and notice version", () => {
    const base = { id: "c1", consent: emptyCustomerConsent(), privacyNoticeVersion: "2026-01" };
    const next = applyConsentChange(base, CONSENT_CHANNEL.SMS, true, { source: "till" });
    expect(customerHasConsent(next, CONSENT_CHANNEL.SMS)).toBe(true);
    expect(next.consent.sms.at).toBeTruthy();
    expect(next.consent.updatedAt).toBeTruthy();
  });

  it("diffs consent channel changes for audit", () => {
    const before = applyConsentChange({ consent: emptyCustomerConsent() }, CONSENT_CHANNEL.EMAIL, false);
    const after = applyConsentChange(before, CONSENT_CHANNEL.EMAIL, true);
    const changes = diffConsentChanges(before, after);
    expect(changes).toEqual([
      expect.objectContaining({ channel: CONSENT_CHANNEL.EMAIL, granted: true }),
    ]);
  });

  it("fills privacy notice version when missing", () => {
    const { privacyNoticeVersion } = normalizeCustomerPrivacy({ id: "c2" });
    expect(privacyNoticeVersion).toBe("2026-01");
  });
});
