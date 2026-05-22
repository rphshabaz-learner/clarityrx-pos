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

function allowsSameOriginApiFallback() {
  return process.env.REACT_APP_SAME_ORIGIN_API === "1" || process.env.NEXT_PUBLIC_SAME_ORIGIN_API === "1";
}

export function resolveApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL;
  if (configured) {
    return normalizeApiBaseUrl(configured);
  }

  if (
    allowsSameOriginApiFallback() &&
    typeof window !== "undefined" &&
    window.location &&
    !isLocalHostname(window.location.hostname)
  ) {
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
    return `Cannot reach the ClarityRx backend at ${target}. This deployed page is configured to use localhost, which points to the viewer's device. Set REACT_APP_API_BASE_URL to the deployed backend API URL.`;
  }

  if (/vercel\.app/i.test(target)) {
    return `Cannot reach the ClarityRx backend at ${target}. If that host is the main ClarityRx Vercel deployment, open Vercel → ClarityRx project → Settings → Deployment Protection and allow public access to Production (or use the stable production URL without protection). For local work, run the API in ../Clarityrx/clarityrx/server and set REACT_APP_API_BASE_URL=http://localhost:4000/api.`;
  }

  return `Cannot reach the ClarityRx backend at ${target}. Start the backend server or set REACT_APP_API_BASE_URL to the deployed backend API URL.`;
}

function responseLooksLikeStaticFrontend(response) {
  const contentType = String(response?.headers?.get?.("content-type") || "");
  return contentType.includes("text/html");
}

export function buildBackendHttpErrorMessage(apiBaseUrl, response) {
  const status = Number(response?.status);
  const target = apiBaseUrl || "the configured API";

  if (looksLikeVercelDeploymentProtection(response)) {
    return `The ClarityRx backend at ${target} returned HTTP ${status} (Vercel Deployment Protection). Disable protection on the main ClarityRx Production deployment, or point REACT_APP_API_BASE_URL at a publicly reachable API host.`;
  }

  const staticFrontend = responseLooksLikeStaticFrontend(response);
  if (!staticFrontend && status !== 404 && status !== 405) {
    return "";
  }

  return `The ClarityRx backend at ${target} returned HTTP ${status || "a non-API response"}. Verify REACT_APP_API_BASE_URL points to the deployed Express API, not the static frontend URL.`;
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
