import React, { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Lock,
  User,
  Loader2,
  Pill,
  ScanLine,
  ClipboardList,
  Fingerprint,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import {
  clearRuntimeBackendConfig,
  getRuntimeApiBaseUrlOverride,
  getRuntimePackagingSocketUrlOverride,
  saveRuntimeBackendConfig,
} from "../lib/apiConfig";
import { getPasskeyCapability } from "../lib/webauthnClient";
import MfaEnrollmentPanel from "../components/security/MfaEnrollmentPanel";

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <p
      className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2"
      role="alert"
    >
      {message}
    </p>
  );
}

function BackendConfigPanel({ apiBaseUrl, error }) {
  const [open, setOpen] = useState(() => Boolean(error && /Cannot reach|Deployment Protection|HTTP 40/i.test(error)));
  const [apiInput, setApiInput] = useState(() => getRuntimeApiBaseUrlOverride() || apiBaseUrl || "");
  const [socketInput, setSocketInput] = useState(() => getRuntimePackagingSocketUrlOverride());
  const hasRuntimeOverride = Boolean(getRuntimeApiBaseUrlOverride() || getRuntimePackagingSocketUrlOverride());

  const saveAndReload = () => {
    saveRuntimeBackendConfig({
      apiBaseUrl: apiInput.trim(),
      packagingSocketUrl: socketInput.trim(),
    });
    window.location.reload();
  };

  const clearAndReload = () => {
    clearRuntimeBackendConfig();
    window.location.reload();
  };

  if (!open) {
    return (
      <button
        type="button"
        className="text-xs font-semibold text-cyan-700 hover:text-cyan-800"
        onClick={() => setOpen(true)}
      >
        Backend connection
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-800">Backend connection</div>
          <div className="text-xs text-slate-500 mt-1">Current API: {apiBaseUrl}</div>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-slate-500 hover:text-slate-700"
          onClick={() => setOpen(false)}
        >
          Hide
        </button>
      </div>

      <label className="block text-xs font-semibold text-slate-600">
        API base URL
        <input
          className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          value={apiInput}
          onChange={(e) => setApiInput(e.target.value)}
          placeholder="http://localhost:4000/api"
        />
      </label>

      <label className="block text-xs font-semibold text-slate-600">
        Socket URL
        <input
          className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          value={socketInput}
          onChange={(e) => setSocketInput(e.target.value)}
          placeholder="http://localhost:4000"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="h-9 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold"
          onClick={saveAndReload}
        >
          Save and reload
        </button>
        <button
          type="button"
          className="h-9 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100"
          onClick={() => {
            setApiInput("http://localhost:4000/api");
            setSocketInput("http://localhost:4000");
          }}
        >
          Use local
        </button>
        {hasRuntimeOverride ? (
          <button
            type="button"
            className="h-9 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100"
            onClick={clearAndReload}
          >
            Clear override
          </button>
        ) : null}
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        For Vercel, use the main ClarityRx backend URL ending in /api. Protected preview URLs will not accept POS login requests.
      </p>
    </div>
  );
}

export default function AuthScreen() {
  const {
    login,
    loginWithPasskey,
    submitMfa,
    pendingMfa,
    pendingMfaEnrollment,
    beginMfaEnrollment,
    verifyMfaEnrollment,
    securityConfig,
    apiBaseUrl,
    error,
    setError,
  } = useAuth();

  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [mfaCode, setMfaCode] = useState("");
  const [mfaBundle, setMfaBundle] = useState(null);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [passkeyCapability, setPasskeyCapability] = useState(null);

  const isDev = process.env.NODE_ENV !== "production";
  const enforcePrivilegedMfa = securityConfig?.mfaPolicy?.enforcePrivileged === true;

  const panelTitle = pendingMfaEnrollment
    ? "MFA Enrollment"
    : pendingMfa
      ? "MFA Verification"
      : "Welcome Back";

  const panelSubtitle = useMemo(() => {
    if (pendingMfaEnrollment) {
      if (enforcePrivilegedMfa) {
        return "Privileged accounts must enroll MFA before accessing ClarityRx.";
      }
      return "Set up Google Authenticator to add an extra sign-in step.";
    }
    if (pendingMfa) {
      return "Enter your authenticator code or a recovery code to continue.";
    }
    return "Sign in to continue to ClarityRx";
  }, [pendingMfa, pendingMfaEnrollment, enforcePrivilegedMfa]);

  const helperText = useMemo(() => {
    if (pendingMfaEnrollment) {
      if (enforcePrivilegedMfa) {
        return "Scan the QR code with Google Authenticator, then verify.";
      }
      return "Scan the QR code, then enter the 6-digit code.";
    }
    if (pendingMfa) {
      return "Open Google Authenticator and enter the 6-digit code for ClarityRx, or use a recovery code.";
    }
    return null;
  }, [pendingMfa, pendingMfaEnrollment, enforcePrivilegedMfa]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const capability = await getPasskeyCapability();
      if (!cancelled) setPasskeyCapability(capability);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pendingMfaEnrollment) {
      setMfaBundle(null);
      setRecoveryCodes([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const bundle = await beginMfaEnrollment();
        if (!cancelled) setMfaBundle(bundle);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [beginMfaEnrollment, pendingMfaEnrollment, setError]);

  const showPasskeySection = !pendingMfa && !pendingMfaEnrollment;
  const passkeyReady =
    passkeyCapability?.canUsePasskeys && credentials.username.trim().length > 0;
  const biometricLabel =
    passkeyCapability?.canUsePasskeys
      ? "Platform biometrics available"
      : passkeyCapability?.statusLabel || "Checking biometric availability…";

  return (
    <div className="min-h-dvh w-full bg-slate-100 flex flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 lg:min-h-dvh bg-gradient-to-br from-cyan-700 to-teal-800 text-white p-14 flex-col justify-between relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-72 h-72 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Pill className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-tight">ClarityRx</h1>
              <p className="text-cyan-100">Modern Pharmacy Workflow Platform</p>
            </div>
          </div>

          <div className="space-y-6 mt-16">
            <div className="flex gap-4">
              <ScanLine className="w-6 h-6 mt-1 text-cyan-200 shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">OCR Prescription Intake</h3>
                <p className="text-cyan-100 text-sm">
                  Scan, upload, and auto-fill patient workflows instantly.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <ClipboardList className="w-6 h-6 mt-1 text-cyan-200 shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Queue-Based Workflow</h3>
                <p className="text-cyan-100 text-sm">
                  Built for pharmacists, assistants, and tech delegation.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <ShieldCheck className="w-6 h-6 mt-1 text-cyan-200 shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Secure Session Isolation</h3>
                <p className="text-cyan-100 text-sm">
                  Multi-session secure pharmacy environment support.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-cyan-100 border-t border-white/20 pt-6">
          HIPAA / PIPEDA Ready • Role-Based Access • Audit Logging
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex min-h-0 items-center justify-center p-6 py-10 overflow-y-auto lg:min-h-dvh">
        <div className="w-full max-w-md my-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 w-full">
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4 lg:hidden">
                <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">ClarityRx</span>
              </div>

              <h2 className="text-3xl font-bold text-slate-900">{panelTitle}</h2>
              <p className="text-slate-500 mt-2">{panelSubtitle}</p>

              {isDev ? (
                <span className="inline-block mt-3 px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
                  DEV
                </span>
              ) : null}
            </div>

            {!pendingMfa && !pendingMfaEnrollment ? (
              <form
                className="space-y-5"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setBusy(true);
                  setError("");
                  try {
                    await login(credentials.username, credentials.password);
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="auth-username">
                    Username
                  </label>
                  <div className="mt-2 relative">
                    <User className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                    <input
                      id="auth-username"
                      type="text"
                      placeholder="Enter username"
                      autoComplete="username"
                      className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={credentials.username}
                      onChange={(e) =>
                        setCredentials((prev) => ({ ...prev, username: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="auth-password">
                    Password
                  </label>
                  <div className="mt-2 relative">
                    <Lock className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                    <input
                      id="auth-password"
                      type="password"
                      placeholder="Enter password"
                      autoComplete="current-password"
                      className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={credentials.password}
                      onChange={(e) =>
                        setCredentials((prev) => ({ ...prev, password: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <ErrorBanner message={error} />
                <BackendConfigPanel apiBaseUrl={apiBaseUrl} error={error} />

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-12 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            ) : pendingMfaEnrollment ? (
              <form
                className="space-y-5"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!mfaBundle?.secret) return;
                  setBusy(true);
                  setError("");
                  try {
                    const payload = await verifyMfaEnrollment(mfaBundle.secret, mfaCode);
                    setRecoveryCodes(payload.recoveryCodes || []);
                    setMfaCode("");
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <MfaEnrollmentPanel
                  mfaBundle={mfaBundle}
                  code={mfaCode}
                  onCodeChange={setMfaCode}
                  recoveryCodes={recoveryCodes}
                />
                <ErrorBanner message={error} />
                <button
                  type="submit"
                  disabled={busy || !mfaBundle?.secret || !mfaCode.trim()}
                  className="w-full h-12 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enabling MFA...
                    </>
                  ) : (
                    "Enable MFA and continue"
                  )}
                </button>
                {helperText ? (
                  <p className="text-xs text-slate-500 leading-relaxed">{helperText}</p>
                ) : null}
              </form>
            ) : (
              <form
                className="space-y-5"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setBusy(true);
                  setError("");
                  try {
                    await submitMfa(mfaCode);
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="auth-mfa-code">
                    Google Authenticator or recovery code
                  </label>
                  <input
                    id="auth-mfa-code"
                    className="mt-2 w-full h-12 px-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code or recovery code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                  />
                </div>
                <ErrorBanner message={error} />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-12 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify MFA"
                  )}
                </button>
                {helperText ? (
                  <p className="text-xs text-slate-500 leading-relaxed">{helperText}</p>
                ) : null}
              </form>
            )}

            {showPasskeySection ? (
              <div className="mt-6 space-y-3">
                <div className="flex items-center text-center text-slate-400 text-xs uppercase tracking-wide">
                  <div className="flex-1 border-b border-slate-200" />
                  <span className="px-2">Or continue with</span>
                  <div className="flex-1 border-b border-slate-200" />
                </div>

                {passkeyCapability && !passkeyCapability.canUsePasskeys ? (
                  <p className="text-xs text-amber-700 font-medium">{passkeyCapability.statusLabel}</p>
                ) : null}

                <button
                  type="button"
                  disabled={busy || !passkeyReady}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      await loginWithPasskey(credentials.username.trim());
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="w-full h-12 rounded-xl text-slate-900 font-semibold flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Fingerprint className="w-4 h-4" />
                  {busy ? "Waiting for device…" : "Sign in with Passkey"}
                </button>
                <p className="text-center text-xs text-slate-400">{biometricLabel}</p>
              </div>
            ) : null}

            {showPasskeySection && isDev ? (
              <div className="mt-6 space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
                  <div className="font-semibold text-slate-700 mb-1">Demo Access</div>
                  <div className="text-slate-500 space-y-1">
                    <div>Admin: admin / Admin123!</div>
                    <div>Pharmacist: pharmacist / Pharm123!</div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4" />
                  Secure encrypted session
                </div>
              </div>
            ) : showPasskeySection ? (
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4" />
                Secure encrypted session
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
