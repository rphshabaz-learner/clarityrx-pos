/** @typedef {'loyalty' | 'marketing' | 'sms' | 'email' | 'eReceipts'} ConsentChannel */

export const CONSENT_CHANNEL = {
  LOYALTY: "loyalty",
  MARKETING: "marketing",
  SMS: "sms",
  EMAIL: "email",
  E_RECEIPTS: "eReceipts",
};

/** @type {ConsentChannel[]} */
export const CONSENT_CHANNELS = Object.values(CONSENT_CHANNEL);

export const DEFAULT_PRIVACY_NOTICE_VERSION = "2026-01";

export const CONSENT_CHANNEL_OPTIONS = [
  {
    id: CONSENT_CHANNEL.LOYALTY,
    label: "Loyalty program",
    description: "Earn and redeem points; link purchases to the loyalty account.",
  },
  {
    id: CONSENT_CHANNEL.MARKETING,
    label: "Marketing",
    description: "Promotional offers, flyers, and campaigns (not transactional notices).",
  },
  {
    id: CONSENT_CHANNEL.SMS,
    label: "SMS",
    description: "Text messages for receipts, pickup notices, or marketing where permitted.",
  },
  {
    id: CONSENT_CHANNEL.EMAIL,
    label: "Email",
    description: "Email for receipts, account notices, or marketing where permitted.",
  },
  {
    id: CONSENT_CHANNEL.E_RECEIPTS,
    label: "eReceipts",
    description: "Digital receipts instead of or in addition to printed copies.",
  },
];

export function emptyConsentRecord() {
  return {
    granted: false,
    at: null,
    privacyNoticeVersion: null,
    source: null,
  };
}

export function emptyCustomerConsent() {
  return {
    loyalty: emptyConsentRecord(),
    marketing: emptyConsentRecord(),
    sms: emptyConsentRecord(),
    email: emptyConsentRecord(),
    eReceipts: emptyConsentRecord(),
    updatedAt: null,
  };
}

/**
 * Merge legacy or partial consent objects onto the canonical shape.
 * @param {import('./customerTypes').CustomerRecord | Record<string, unknown> | null | undefined} customer
 */
export function normalizeCustomerConsent(customer) {
  const raw = customer?.consent && typeof customer.consent === "object" ? customer.consent : {};
  const consent = emptyCustomerConsent();

  for (const channel of CONSENT_CHANNELS) {
    const row = raw[channel];
    if (row == null) continue;
    if (typeof row === "boolean") {
      consent[channel] = {
        ...emptyConsentRecord(),
        granted: row,
        at: raw.at || null,
        privacyNoticeVersion: customer?.privacyNoticeVersion || null,
        source: raw.source || "legacy",
      };
      continue;
    }
    consent[channel] = {
      granted: row.granted === true,
      at: row.at || null,
      privacyNoticeVersion: row.privacyNoticeVersion || null,
      source: row.source || null,
    };
  }

  if (raw.updatedAt) consent.updatedAt = raw.updatedAt;
  return consent;
}

/**
 * @param {Record<string, unknown> | null | undefined} customer
 */
export function normalizeCustomerPrivacy(customer) {
  const consent = normalizeCustomerConsent(customer);
  const privacyNoticeVersion =
    typeof customer?.privacyNoticeVersion === "string" && customer.privacyNoticeVersion.trim()
      ? customer.privacyNoticeVersion.trim()
      : DEFAULT_PRIVACY_NOTICE_VERSION;
  return { consent, privacyNoticeVersion };
}

/**
 * @param {Record<string, unknown>} customer
 * @param {ConsentChannel} channel
 * @param {boolean} granted
 * @param {{ source?: string, privacyNoticeVersion?: string }} [meta]
 */
export function applyConsentChange(customer, channel, granted, meta = {}) {
  const { consent, privacyNoticeVersion } = normalizeCustomerPrivacy(customer);
  const stamp = new Date().toISOString();
  const version = meta.privacyNoticeVersion || privacyNoticeVersion;

  consent[channel] = {
    granted: Boolean(granted),
    at: stamp,
    privacyNoticeVersion: version,
    source: meta.source || "till",
  };
  consent.updatedAt = stamp;

  return {
    ...customer,
    consent,
    privacyNoticeVersion: version,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} customer
 * @param {ConsentChannel} channel
 */
export function customerHasConsent(customer, channel) {
  const { consent } = normalizeCustomerPrivacy(customer);
  return consent[channel]?.granted === true;
}

/**
 * @param {Record<string, unknown> | null | undefined} before
 * @param {Record<string, unknown> | null | undefined} after
 */
export function diffConsentChanges(before, after) {
  const prev = normalizeCustomerConsent(before);
  const next = normalizeCustomerConsent(after);
  return CONSENT_CHANNELS.filter((channel) => prev[channel].granted !== next[channel].granted).map(
    (channel) => ({
      channel,
      granted: next[channel].granted,
      at: next[channel].at,
    })
  );
}

export function consentStatusLabel(record) {
  if (!record?.at) return record?.granted ? "Granted" : "Not recorded";
  const date = formatConsentTimestamp(record.at);
  return record.granted ? `Granted · ${date}` : `Declined · ${date}`;
}

export function formatConsentTimestamp(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
