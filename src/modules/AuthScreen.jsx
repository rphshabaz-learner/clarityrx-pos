import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  User,
  Loader2,
  Pill,
  Fingerprint,
  Wifi,
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
        className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
        onClick={() => setOpen(true)}
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" />
        Backend online
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Wifi className="h-4 w-4 text-cyan-700" />
            Backend connection
          </div>
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
          className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          value={apiInput}
          onChange={(e) => setApiInput(e.target.value)}
          placeholder="http://localhost:4000/api"
        />
      </label>

      <label className="block text-xs font-semibold text-slate-600">
        Socket URL
        <input
          className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          value={socketInput}
          onChange={(e) => setSocketInput(e.target.value)}
          placeholder="http://localhost:4000"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="h-9 rounded-lg bg-cyan-700 px-3 text-xs font-bold text-white hover:bg-cyan-800"
          onClick={saveAndReload}
        >
          Save and reload
        </button>
        <button
          type="button"
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-100"
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
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-100"
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
  const [showPassword, setShowPassword] = useState(false);
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
      : "Welcome back";

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
    return "Sign in to open your register.";
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
    <div className="min-h-dvh bg-[#eef4f7] text-slate-950">
      <div className="min-h-dvh bg-[linear-gradient(130deg,rgba(35,137,167,0.16),transparent_34%),linear-gradient(315deg,rgba(255,255,255,0),rgba(224,233,240,0.9))]">
        <header className="auth-login-header flex flex-col gap-5 px-5 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-700 to-emerald-400 text-white shadow-lg shadow-cyan-700/20">
              <Pill className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold leading-tight tracking-normal text-slate-950">
                ClarityRx POS
              </h1>
              <p className="text-sm text-slate-600">Pickup and front-store checkout</p>
            </div>
          </div>
          {!pendingMfa && !pendingMfaEnrollment ? (
            <BackendConfigPanel apiBaseUrl={apiBaseUrl} error={error} />
          ) : null}
        </header>

        <main className="auth-login-main mx-auto grid grid-cols-1 items-center gap-9 pb-12 pt-2">
          <section
            className="auth-login-card order-1 rounded-lg border border-slate-200/90 bg-white/95 p-6 shadow-2xl shadow-slate-700/10 backdrop-blur"
            aria-labelledby="auth-title"
          >
            <div className="mb-7">
              <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-normal text-cyan-800">
                <ShieldCheck className="h-4 w-4" />
                Staff access
              </div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="auth-title" className="auth-panel-title font-extrabold tracking-normal text-slate-950">
                    {panelTitle}
                  </h2>
                  <p className="mt-2 text-base text-slate-600">{panelSubtitle}</p>
                </div>
                {isDev ? (
                  <span className="rounded-md border border-amber-200 bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                    DEV
                  </span>
                ) : null}
              </div>
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
                  <label className="text-sm font-bold text-slate-700" htmlFor="auth-username">
                    Username
                  </label>
                  <div className="relative mt-2">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="auth-username"
                      type="text"
                      placeholder="Enter username"
                      autoComplete="username"
                      className="h-13 min-h-13 w-full rounded-lg border border-slate-300 bg-slate-50/70 px-4 py-3 pl-12 text-slate-950 outline-none transition focus:border-cyan-700 focus:bg-white focus:ring-4 focus:ring-cyan-700/15"
                      value={credentials.username}
                      onChange={(e) =>
                        setCredentials((prev) => ({ ...prev, username: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700" htmlFor="auth-password">
                    Password
                  </label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      className="h-13 min-h-13 w-full rounded-lg border border-slate-300 bg-slate-50/70 px-12 py-3 pl-12 text-slate-950 outline-none transition focus:border-cyan-700 focus:bg-white focus:ring-4 focus:ring-cyan-700/15"
                      value={credentials.password}
                      onChange={(e) =>
                        setCredentials((prev) => ({ ...prev, password: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-200/70 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-700"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <ErrorBanner message={error} />

                <button
                  type="submit"
                  disabled={busy}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-cyan-600 to-cyan-800 font-extrabold text-white shadow-lg shadow-cyan-700/20 transition hover:from-cyan-700 hover:to-cyan-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-5 w-5" />
                    </>
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
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan-700 font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enabling MFA...
                    </>
                  ) : (
                    "Enable MFA and continue"
                  )}
                </button>
                {helperText ? (
                  <p className="text-xs leading-relaxed text-slate-500">{helperText}</p>
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
                  <label className="text-sm font-bold text-slate-700" htmlFor="auth-mfa-code">
                    Google Authenticator or recovery code
                  </label>
                  <input
                    id="auth-mfa-code"
                    className="mt-2 h-12 w-full rounded-lg border border-slate-300 px-4 outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/15"
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
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan-700 font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify MFA"
                  )}
                </button>
                {helperText ? (
                  <p className="text-xs leading-relaxed text-slate-500">{helperText}</p>
                ) : null}
              </form>
            )}

            {showPasskeySection ? (
              <div className="auth-passkey-section mt-6 space-y-3">
                <div className="auth-login-divider flex items-center text-center text-xs font-extrabold uppercase tracking-normal text-slate-400">
                  <div className="flex-1 border-b border-slate-200" />
                  <span className="px-3">Or continue with</span>
                  <div className="flex-1 border-b border-slate-200" />
                </div>

                {passkeyCapability && !passkeyCapability.canUsePasskeys ? (
                  <p className="text-xs font-medium text-amber-700">{passkeyCapability.statusLabel}</p>
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
                  className="flex h-13 min-h-13 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Fingerprint className="h-4 w-4" />
                  {busy ? "Waiting for device..." : "Sign in with passkey"}
                </button>
                <div className="auth-login-status flex flex-col items-start gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    Secure encrypted session
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Activity className="h-4 w-4" />
                    {biometricLabel}
                  </span>
                </div>
              </div>
            ) : null}

            {showPasskeySection && isDev ? (
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="mb-1 font-semibold text-slate-700">Demo access</div>
                <div className="space-y-1 text-slate-500">
                  <div>Admin: admin / Admin123!</div>
                  <div>Pharmacist: pharmacist / Pharm123!</div>
                </div>
              </div>
            ) : null}
          </section>

        </main>
      </div>
    </div>
  );
}
