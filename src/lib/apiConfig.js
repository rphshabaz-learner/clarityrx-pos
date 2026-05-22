const LOCAL_API_BASE_URL = "http://localhost:4000/api";

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function isLocalHostname(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function normalizeApiBaseUrl(value) {
  return trimTrailingSlash(value);
}

export function resolveApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL;
  if (configured) {
    return normalizeApiBaseUrl(configured);
  }

  if (typeof window !== "undefined" && window.location && !isLocalHostname(window.location.hostname)) {
    return normalizeApiBaseUrl(`${window.location.origin}/api`);
  }

  return LOCAL_API_BASE_URL;
}

export function resolvePackagingApiBaseUrl() {
  return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_PACKAGING_API_URL || process.env.REACT_APP_PACKAGING_API_URL || resolveApiBaseUrl());
}

export function resolvePackagingSocketUrl(packagingApiBaseUrl = resolvePackagingApiBaseUrl()) {
  const configured = process.env.NEXT_PUBLIC_PACKAGING_SOCKET_URL || process.env.REACT_APP_PACKAGING_SOCKET_URL;
  if (configured) {
    return normalizeApiBaseUrl(configured);
  }
  return normalizeApiBaseUrl(packagingApiBaseUrl.replace(/\/api$/, ""));
}

export function buildBackendConnectionMessage(apiBaseUrl) {
  const target = apiBaseUrl || "the configured API";
  const productionLocalhost =
    typeof window !== "undefined" &&
    window.location &&
    !isLocalHostname(window.location.hostname) &&
    /(^https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(target);

  if (productionLocalhost) {
    return `Cannot reach the ClarityRx backend at ${target}. This deployed page is configured to use localhost, which points to the viewer's device. Set REACT_APP_API_BASE_URL to the deployed backend API URL.`;
  }

  return `Cannot reach the ClarityRx backend at ${target}. Start the backend server or set REACT_APP_API_BASE_URL to the deployed backend API URL.`;
}

export function buildBackendHttpErrorMessage(apiBaseUrl, response) {
  const status = Number(response?.status);
  if (status !== 404 && status !== 405) {
    return "";
  }

  const target = apiBaseUrl || "the configured API";
  return `The ClarityRx backend at ${target} returned HTTP ${status}. Verify REACT_APP_API_BASE_URL points to the deployed Express API, not the static frontend URL.`;
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
