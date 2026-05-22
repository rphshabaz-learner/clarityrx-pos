import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { buildBackendHttpErrorMessage, fetchBackend } from "./apiConfig";

function parseJsonResponse(response, apiBaseUrl) {
  return response.text().then((text) => {
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { error: text };
    }
    if (!response.ok) {
      const message =
        (payload && typeof payload === "object" && (payload.error || payload.message)) ||
        buildBackendHttpErrorMessage(apiBaseUrl, response) ||
        `Request failed with HTTP ${response.status}`;
      throw new Error(message);
    }
    return payload;
  });
}

/** WebAuthn API present and page is a secure context (HTTPS or localhost). */
export function isPasskeySupported() {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    Boolean(window.isSecureContext)
  );
}

/**
 * Probe platform biometrics and return human-readable status for UI.
 * UI should always render the biometrics section using this — do not hide when platform is false.
 */
export async function getPasskeyCapability() {
  const webAuthn = typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined";
  const secureContext = typeof window !== "undefined" && Boolean(window.isSecureContext);

  let platformAuthenticator = null;
  if (
    webAuthn &&
    secureContext &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
  ) {
    try {
      platformAuthenticator = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      platformAuthenticator = false;
    }
  }

  const canUsePasskeys = webAuthn && secureContext;
  let statusLabel = "Unavailable";
  let statusDetail = "Passkeys cannot be used in this environment.";

  if (!webAuthn) {
    statusDetail = "This browser does not expose WebAuthn. Use Chrome, Safari, or Edge on a desktop or mobile device.";
  } else if (!secureContext) {
    statusDetail =
      "Passkeys require HTTPS or localhost. Open http://localhost:3000 (not http://127.0.0.1 or a LAN IP unless HTTPS).";
  } else if (platformAuthenticator === true) {
    statusLabel = "Platform biometrics available";
    statusDetail = "Touch ID, Windows Hello, or an equivalent platform authenticator was detected.";
  } else if (platformAuthenticator === false) {
    statusLabel = "WebAuthn ready (no platform sensor)";
    statusDetail =
      "Built-in fingerprint/Face ID was not detected. You can still try a USB security key or phone passkey when registering.";
  } else {
    statusLabel = "WebAuthn ready";
    statusDetail = "Complete registration to store a passkey for faster sign-in.";
  }

  return {
    webAuthn,
    secureContext,
    platformAuthenticator,
    canUsePasskeys,
    statusLabel,
    statusDetail,
  };
}

export async function startPasskeyLogin(apiBaseUrl, username) {
  const options = await fetchBackend(`${apiBaseUrl}/auth/fingerprint/login/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  }, apiBaseUrl).then((response) => parseJsonResponse(response, apiBaseUrl));

  const credential = await startAuthentication({ optionsJSON: options });
  return fetchBackend(`${apiBaseUrl}/auth/fingerprint/login/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, credential }),
  }, apiBaseUrl).then((response) => parseJsonResponse(response, apiBaseUrl));
}

export async function registerPasskey(apiBaseUrl, accessToken, deviceLabel = "") {
  const options = await fetchBackend(`${apiBaseUrl}/auth/fingerprint/register/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ deviceLabel }),
  }, apiBaseUrl).then((response) => parseJsonResponse(response, apiBaseUrl));

  const credential = await startRegistration({ optionsJSON: options });
  return fetchBackend(`${apiBaseUrl}/auth/fingerprint/register/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ credential, deviceLabel }),
  }, apiBaseUrl).then((response) => parseJsonResponse(response, apiBaseUrl));
}

export async function listPasskeys(apiBaseUrl, accessToken) {
  return fetchBackend(`${apiBaseUrl}/auth/fingerprint/credentials`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }, apiBaseUrl).then((response) => parseJsonResponse(response, apiBaseUrl));
}

export async function removePasskey(apiBaseUrl, accessToken, credentialRowId) {
  return fetchBackend(`${apiBaseUrl}/auth/fingerprint/credentials/${credentialRowId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  }, apiBaseUrl).then((response) => parseJsonResponse(response, apiBaseUrl));
}
