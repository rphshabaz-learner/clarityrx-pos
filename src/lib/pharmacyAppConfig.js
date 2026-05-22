/** Optional deep-link to main pharmacy UI — not used by the till runtime. */
const LOCAL_PHARMACY_APP_URL = "http://localhost:3000";

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

export function resolvePharmacyAppUrl() {
  const configured = process.env.REACT_APP_PHARMACY_APP_URL;
  if (configured) {
    return trimTrailingSlash(configured);
  }
  return LOCAL_PHARMACY_APP_URL;
}
