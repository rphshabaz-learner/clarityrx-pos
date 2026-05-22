const LOCAL_POS_TRANSMIT_API_URL = "http://localhost:4000/api";
const LOCAL_POS_AUTH_API_URL = "http://localhost:4000/api";
const RUNTIME_API_BASE_URL_KEY = "clarityrx-pos-api-base-url";
const RUNTIME_PACKAGING_SOCKET_URL_KEY = "clarityrx-pos-packaging-socket-url";

function readConfiguredUrl(...candidates) {
  for (const value of candidates) {
    if (value) {
      return normalizeApiBaseUrl(value);
    }
  }
  return "";
}

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function isLocalHostname(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function normalizeApiBaseUrl(value) {
  return trimTrailingSlash(value);
}

function readSearchParam(name) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
}

function readRuntimeOverride(key) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(key) || "";
}

export function getRuntimeApiBaseUrlOverride() {
  return normalizeApiBaseUrl(readRuntimeOverride(RUNTIME_API_BASE_URL_KEY));
}

export function getRuntimePackagingSocketUrlOverride() {
  return normalizeApiBaseUrl(readRuntimeOverride(RUNTIME_PACKAGING_SOCKET_URL_KEY));
}

export function saveRuntimeBackendConfig({ apiBaseUrl, packagingSocketUrl }) {
  if (typeof window === "undefined") return;
  const normalizedApiBaseUrl = normalizeApiBaseUrl(apiBaseUrl);
  const normalizedSocketUrl = normalizeApiBaseUrl(packagingSocketUrl);
  if (normalizedApiBaseUrl) {
    window.localStorage.setItem(RUNTIME_API_BASE_URL_KEY, normalizedApiBaseUrl);
  } else {
    window.localStorage.removeItem(RUNTIME_API_BASE_URL_KEY);
  }
  if (normalizedSocketUrl) {
    window.localStorage.setItem(RUNTIME_PACKAGING_SOCKET_URL_KEY, normalizedSocketUrl);
  } else {
    window.localStorage.removeItem(RUNTIME_PACKAGING_SOCKET_URL_KEY);
  }
}

export function clearRuntimeBackendConfig() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RUNTIME_API_BASE_URL_KEY);
  window.localStorage.removeItem(RUNTIME_PACKAGING_SOCKET_URL_KEY);
}

function allowsSameOriginApiFallback() {
  return process.env.REACT_APP_SAME_ORIGIN_API === "1" || process.env.NEXT_PUBLIC_SAME_ORIGIN_API === "1";
}

/**
 * POS operator sign-in (local till session). Not used for pharmacy workspace data.
 */
export function resolvePosAuthApiBaseUrl() {
  const configured = readConfiguredUrl(
    readSearchParam("posAuthUrl"),
    process.env.NEXT_PUBLIC_POS_AUTH_URL,
    process.env.REACT_APP_POS_AUTH_URL,
    readSearchParam("apiBaseUrl"),
    readSearchParam("api"),
    getRuntimeApiBaseUrlOverride(),
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.REACT_APP_API_BASE_URL
  );
  if (configured) {
    return configured;
  }

  if (
    allowsSameOriginApiFallback() &&
    typeof window !== "undefined" &&
    window.location &&
    !isLocalHostname(window.location.hostname)
  ) {
    return normalizeApiBaseUrl(`${window.location.origin}/api`);
  }

  return LOCAL_POS_AUTH_API_URL;
}

/**
 * Outbound boundary to pharmacy: sales transactions and inventory adjustments only.
 */
export function resolvePosTransmitApiBaseUrl() {
  const configured = readConfiguredUrl(
    readSearchParam("posTransmitUrl"),
    readSearchParam("posApiUrl"),
    process.env.NEXT_PUBLIC_POS_TRANSMIT_URL,
    process.env.REACT_APP_POS_TRANSMIT_URL,
    process.env.NEXT_PUBLIC_POS_API_URL,
    process.env.REACT_APP_POS_API_URL,
    readSearchParam("apiBaseUrl"),
    readSearchParam("api"),
    getRuntimeApiBaseUrlOverride(),
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.REACT_APP_API_BASE_URL
  );
  if (configured) {
    return configured;
  }

  if (
    allowsSameOriginApiFallback() &&
    typeof window !== "undefined" &&
    window.location &&
    !isLocalHostname(window.location.hostname)
  ) {
    return normalizeApiBaseUrl(`${window.location.origin}/api`);
  }

  return LOCAL_POS_TRANSMIT_API_URL;
}

/** @deprecated Use resolvePosTransmitApiBaseUrl */
export function resolveApiBaseUrl() {
  return resolvePosTransmitApiBaseUrl();
}

export function isPosPickupSyncEnabled() {
  return process.env.REACT_APP_POS_PICKUP_SYNC === "1" || process.env.NEXT_PUBLIC_POS_PICKUP_SYNC === "1";
}

export function isPosPharmacyAuditEnabled() {
  return process.env.REACT_APP_POS_PHARMACY_AUDIT === "1" || process.env.NEXT_PUBLIC_POS_PHARMACY_AUDIT === "1";
}

export function resolvePackagingApiBaseUrl() {
  return normalizeApiBaseUrl(
    process.env.NEXT_PUBLIC_PACKAGING_API_URL ||
      process.env.REACT_APP_PACKAGING_API_URL ||
      resolvePosTransmitApiBaseUrl()
  );
}

export function resolvePackagingSocketUrl(packagingApiBaseUrl = resolvePackagingApiBaseUrl()) {
  const configured =
    readSearchParam("packagingSocketUrl") ||
    readSearchParam("socket") ||
    getRuntimePackagingSocketUrlOverride() ||
    process.env.NEXT_PUBLIC_PACKAGING_SOCKET_URL ||
    process.env.REACT_APP_PACKAGING_SOCKET_URL;
  if (configured) {
    return normalizeApiBaseUrl(configured);
  }
  return normalizeApiBaseUrl(packagingApiBaseUrl.replace(/\/api$/, ""));
}

function looksLikeVercelDeploymentProtection(response) {
  const status = Number(response?.status);
  if (status !== 401 && status !== 403) {
    return false;
  }
  const contentType = String(response?.headers?.get?.("content-type") || "");
  return contentType.includes("text/html");
}

export function buildBackendConnectionMessage(apiBaseUrl) {
  const target = apiBaseUrl || "the configured API";
  const productionLocalhost =
    typeof window !== "undefined" &&
    window.location &&
    !isLocalHostname(window.location.hostname) &&
    /(^https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(target);

  if (productionLocalhost) {
    return `Cannot reach the POS API at ${target}. This deployed page is configured to use localhost, which points to the viewer's device. Set REACT_APP_POS_TRANSMIT_URL (or REACT_APP_API_BASE_URL) to the deployed POS/pharmacy transmit API URL.`;
  }

  if (/vercel\.app/i.test(target)) {
    return `Cannot reach the POS API at ${target}. If that host is the main ClarityRx Vercel deployment, open Vercel → ClarityRx project → Settings → Deployment Protection and allow public access to Production (or use the stable production URL without protection). For local work, run the API in ../Clarityrx/clarityrx/server and set REACT_APP_POS_TRANSMIT_URL=http://localhost:4000/api.`;
  }

  return `Cannot reach the POS API at ${target}. Start the transmit API or set REACT_APP_POS_TRANSMIT_URL to the deployed API URL.`;
}

function responseLooksLikeStaticFrontend(response) {
  const contentType = String(response?.headers?.get?.("content-type") || "");
  return contentType.includes("text/html");
}

export function buildBackendHttpErrorMessage(apiBaseUrl, response) {
  const status = Number(response?.status);
  const target = apiBaseUrl || "the configured API";

  if (looksLikeVercelDeploymentProtection(response)) {
    return `The POS API at ${target} returned HTTP ${status} (Vercel Deployment Protection). Disable protection on the main ClarityRx Production deployment, or point REACT_APP_POS_TRANSMIT_URL at a publicly reachable API host.`;
  }

  const staticFrontend = responseLooksLikeStaticFrontend(response);
  if (!staticFrontend && status !== 404 && status !== 405) {
    return "";
  }

  return `The POS API at ${target} returned HTTP ${status || "a non-API response"}. Verify REACT_APP_POS_TRANSMIT_URL points to the deployed Express API, not the static frontend URL.`;
}

export function createBackendConnectionError(apiBaseUrl, cause) {
  const error = new Error(buildBackendConnectionMessage(apiBaseUrl));
  error.cause = cause;
  return error;
}

export async function fetchBackend(url, init, apiBaseUrl) {
  try {
    return await fetch(url, init);
  } catch (cause) {
    throw createBackendConnectionError(apiBaseUrl, cause);
  }
}
