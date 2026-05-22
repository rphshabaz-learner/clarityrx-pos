import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { registerPasskey as registerPasskeyRequest, startPasskeyLogin } from "./lib/webauthnClient";
import { buildBackendHttpErrorMessage, fetchBackend, resolveApiBaseUrl } from "./lib/apiConfig";
import { buildSessionHeaders, resolveWorkspaceSession, sessionContextForAudit, updateWorkspaceSession } from "./session/workspaceSession";
import { getScopedJson, removeLegacyAuth, setScopedJson } from "./session/scopedStorage";
import {
  loadSessionPreferences,
  resolveEffectiveIdleTimeoutMinutes,
  saveSessionPreferences,
} from "./session/sessionPreferences";
import { enterpriseAuthStore } from "./stores/authStore";
import { workstationLockStore } from "./stores/workstationLockStore";

const AuthContext = createContext(null);
const STORAGE_KEY = "clarityrx-auth-v1";
const API_BASE = resolveApiBaseUrl();

async function requestJson(path, options = {}, accessToken = null) {
  const sessionContext = resolveWorkspaceSession();
  const headers = {
    "Content-Type": "application/json",
    ...buildSessionHeaders(sessionContext),
    ...(options.headers || {}),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const response = await fetchBackend(`${API_BASE}${path}`, {
    ...options,
    headers,
  }, API_BASE);
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  if (!response.ok) {
    const message = payload?.error || payload?.message || buildBackendHttpErrorMessage(API_BASE, response) || `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function loadStoredAuth() {
  if (typeof window === "undefined") {
    return { accessToken: "", refreshToken: "", user: null, sessionContext: resolveWorkspaceSession() };
  }
  const stored = getScopedJson(STORAGE_KEY, null);
  return {
    accessToken: stored?.accessToken || "",
    refreshToken: stored?.refreshToken || "",
    user: stored?.user || null,
    sessionContext: stored?.sessionContext || resolveWorkspaceSession(),
  };
}

export function AuthProvider({ children }) {
  const stored = loadStoredAuth();
  const [user, setUser] = useState(stored.user);
  const [accessToken, setAccessToken] = useState(stored.accessToken);
  const [refreshToken, setRefreshToken] = useState(stored.refreshToken);
  const [sessionContext, setSessionContext] = useState(stored.sessionContext || resolveWorkspaceSession());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingMfa, setPendingMfa] = useState(null);
  const [pendingMfaEnrollment, setPendingMfaEnrollment] = useState(null);
  const [securityConfig, setSecurityConfig] = useState({
    accessTokenTtlSec: 1800,
    refreshTokenTtlSec: 43200,
    sessionTimeoutMinutes: 15,
    supportedMfaMethods: ["totp", "recovery_code"],
  });
  const [sessionWarning, setSessionWarning] = useState(false);
  const [workstationLocked, setWorkstationLocked] = useState(false);
  const [sessionPreferences, setSessionPreferencesState] = useState(loadSessionPreferences);
  const lastActivityRef = useRef(Date.now());
  const lastTokenRefreshRef = useRef(0);
  const sessionEndedRef = useRef(false);

  const effectiveSessionTimeoutMinutes = useMemo(
    () => resolveEffectiveIdleTimeoutMinutes(sessionPreferences, securityConfig.sessionTimeoutMinutes),
    [securityConfig.sessionTimeoutMinutes, sessionPreferences]
  );

  const setSessionPreferences = useCallback((next) => {
    setSessionPreferencesState((prev) => {
      const merged = { ...prev, ...next };
      saveSessionPreferences(merged);
      return merged;
    });
    lastActivityRef.current = Date.now();
    setSessionWarning(false);
    sessionEndedRef.current = false;
  }, []);

  const persistAuthState = useCallback((next) => {
    if (typeof window === "undefined") return;
    if (!next?.accessToken || !next?.refreshToken || !next?.user) {
      setScopedJson(STORAGE_KEY, null, sessionContext);
      return;
    }
    const nextSessionContext = next.sessionContext || sessionContext;
    setScopedJson(
      STORAGE_KEY,
      {
        accessToken: next.accessToken,
        refreshToken: next.refreshToken,
        user: next.user,
        sessionContext: nextSessionContext,
      },
      nextSessionContext
    );
    removeLegacyAuth();
  }, [sessionContext]);

  const applyAuthPayload = useCallback(
    (payload) => {
      const nextSessionContext = updateWorkspaceSession({
        ...sessionContext,
        sessionId: payload.sessionId || payload.session?.id || sessionContext.sessionId,
      });
      setSessionContext(nextSessionContext);
      setUser(payload.user || null);
      setAccessToken(payload.accessToken || "");
      setRefreshToken(payload.refreshToken || "");
      enterpriseAuthStore.getState().setAuth({
        accessToken: payload.accessToken || "",
        refreshToken: payload.refreshToken || "",
        user: payload.user || null,
        sessionContext: nextSessionContext,
      });
      setSecurityConfig((prev) => ({
        ...prev,
        accessTokenTtlSec: payload.accessTokenExpiresIn || prev.accessTokenTtlSec,
        refreshTokenTtlSec: payload.refreshTokenExpiresIn || prev.refreshTokenTtlSec,
        sessionTimeoutMinutes: payload.sessionTimeoutMinutes || prev.sessionTimeoutMinutes,
      }));
      persistAuthState({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
        sessionContext: nextSessionContext,
      });
      setPendingMfa(null);
      setPendingMfaEnrollment(null);
      setError("");
      setSessionWarning(false);
      lastActivityRef.current = Date.now();
      sessionEndedRef.current = false;
    },
    [persistAuthState, sessionContext]
  );

  const clearAuthState = useCallback(() => {
    setUser(null);
    setAccessToken("");
    setRefreshToken("");
    setSessionContext(updateWorkspaceSession({ sessionId: null }));
    enterpriseAuthStore.getState().clearAuth();
    setPendingMfa(null);
    setPendingMfaEnrollment(null);
    setSessionWarning(false);
    setWorkstationLocked(false);
    persistAuthState(null);
  }, [persistAuthState]);

  const lockWorkstation = useCallback(async (reason = "manual") => {
    setWorkstationLocked(true);
    workstationLockStore.getState().lock(reason);
    try {
      if (accessToken) {
        await requestJson("/auth/sessions/current/lock", {
          method: "POST",
          body: JSON.stringify({ reason, sessionContext: sessionContextForAudit(sessionContext) }),
        }, accessToken);
      }
      await window.clarityRxElectron?.lockWorkstation?.(reason);
    } catch {
      // Local lock is still enforced if the server heartbeat is unavailable.
    }
  }, [accessToken, sessionContext]);

  const unlockWorkstation = useCallback(async (password) => {
    if (!user?.username || !sessionContext?.sessionId) {
      throw new Error("No locked session is available to unlock.");
    }
    await requestJson("/auth/sessions/unlock", {
      method: "POST",
      body: JSON.stringify({
        username: user.username,
        password,
        sessionId: sessionContext.sessionId,
        sessionContext: sessionContextForAudit(sessionContext),
      }),
    });
    workstationLockStore.getState().unlock();
    await window.clarityRxElectron?.unlockWorkstation?.();
    setWorkstationLocked(false);
    lastActivityRef.current = Date.now();
  }, [sessionContext, user]);

  const logout = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (accessToken) {
          await requestJson("/auth/logout", { method: "POST" }, accessToken);
        }
      } catch {
        // Ignore logout network failures during local session cleanup.
      } finally {
        clearAuthState();
        if (!silent) setError("");
      }
    },
    [accessToken, clearAuthState]
  );

  const refreshSession = useCallback(async () => {
    if (!refreshToken) return null;
    const payload = await requestJson("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken, sessionContext: sessionContextForAudit(sessionContext) }),
    });
    applyAuthPayload(payload);
    return payload;
  }, [applyAuthPayload, refreshToken, sessionContext]);

  const hydrateCurrentUser = useCallback(async () => {
    if (!accessToken) return null;
    const payload = await requestJson("/auth/me", {}, accessToken);
    setUser(payload.user || null);
    persistAuthState({
      accessToken,
      refreshToken,
      user: payload.user,
      sessionContext,
    });
    return payload.user;
  }, [accessToken, persistAuthState, refreshToken, sessionContext]);

  const login = useCallback(async (username, password) => {
    setError("");
    const payload = await requestJson("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, sessionContext: sessionContextForAudit(sessionContext) }),
    });
    if (payload.mfaEnrollmentRequired) {
      setPendingMfaEnrollment(payload);
      setPendingMfa(null);
      return { mfaEnrollmentRequired: true };
    }
    if (payload.mfaRequired) {
      setPendingMfa(payload);
      setPendingMfaEnrollment(null);
      return { mfaRequired: true };
    }
    applyAuthPayload(payload);
    return { mfaRequired: false, mfaEnrollmentRequired: false };
  }, [applyAuthPayload, sessionContext]);

  const loginWithPasskey = useCallback(
    async (username) => {
      setError("");
      const payload = await startPasskeyLogin(API_BASE, username);
      if (payload.mfaRequired) {
        setPendingMfa(payload);
        setPendingMfaEnrollment(null);
        return { mfaRequired: true };
      }
      applyAuthPayload(payload);
      return payload;
    },
    [applyAuthPayload]
  );

  const registerPasskey = useCallback(
    async (deviceLabel = "") => {
      if (!accessToken) {
        throw new Error("Sign in before registering a passkey.");
      }
      return registerPasskeyRequest(API_BASE, accessToken, deviceLabel);
    },
    [accessToken]
  );

  const normalizeMfaCode = (value) => String(value || "").trim().replace(/\s+/g, "");

  const submitMfa = useCallback(async (code) => {
    if (!pendingMfa?.preAuthToken) {
      throw new Error("MFA challenge is not active.");
    }
    const payload = await requestJson("/auth/login/mfa", {
      method: "POST",
      body: JSON.stringify({
        preAuthToken: pendingMfa.preAuthToken,
        code: normalizeMfaCode(code),
        sessionContext: sessionContextForAudit(sessionContext),
      }),
    });
    applyAuthPayload(payload);
  }, [applyAuthPayload, pendingMfa, sessionContext]);

  const beginMfaEnrollment = useCallback(async () => {
    if (accessToken) {
      return requestJson("/auth/mfa/enroll", { method: "POST" }, accessToken);
    }
    if (pendingMfaEnrollment?.preAuthToken) {
      return requestJson("/auth/mfa/enroll", {
        method: "POST",
        body: JSON.stringify({ preAuthToken: pendingMfaEnrollment.preAuthToken }),
      });
    }
    throw new Error("Sign in before enrolling in MFA.");
  }, [accessToken, pendingMfaEnrollment]);

  const verifyMfaEnrollment = useCallback(async (secret, code) => {
    const enrollmentBody = {
      secret,
      code: normalizeMfaCode(code),
      ...(pendingMfaEnrollment?.preAuthToken
        ? { preAuthToken: pendingMfaEnrollment.preAuthToken }
        : {}),
    };
    const payload = await requestJson(
      "/auth/mfa/verify-enrollment",
      {
        method: "POST",
        body: JSON.stringify(enrollmentBody),
      },
      accessToken || null
    );
    if (payload.accessToken) {
      applyAuthPayload(payload);
      setPendingMfaEnrollment(null);
      return payload;
    }
    await hydrateCurrentUser();
    return payload;
  }, [accessToken, applyAuthPayload, hydrateCurrentUser, pendingMfaEnrollment]);

  const disableMfa = useCallback(async (code) => {
    const payload = await requestJson(
      "/auth/mfa/disable",
      {
        method: "POST",
        body: JSON.stringify({ code: normalizeMfaCode(code) }),
      },
      accessToken
    );
    await hydrateCurrentUser();
    return payload;
  }, [accessToken, hydrateCurrentUser]);

  const listSessions = useCallback(async () => {
    return requestJson("/auth/sessions", {}, accessToken);
  }, [accessToken]);

  const logoutAllSessions = useCallback(async () => {
    return requestJson("/auth/logout-all", { method: "POST" }, accessToken);
  }, [accessToken]);

  // Run session restore once on mount. Do not depend on refreshSession/hydrateCurrentUser —
  // their identities change after tokens rotate, which would retrigger this effect and loop
  // refresh requests until the tab freezes or crashes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bootstrap = await requestJson("/auth/security-bootstrap");
        if (!cancelled) {
          setSecurityConfig((prev) => ({ ...prev, ...bootstrap }));
        }
      } catch {
        // Keep defaults when backend bootstrap is not available.
      }
      const initialRefresh = loadStoredAuth().refreshToken;
      try {
        if (initialRefresh) {
          const payload = await requestJson("/auth/refresh", {
            method: "POST",
            body: JSON.stringify({ refreshToken: initialRefresh }),
          });
          if (!cancelled) {
            applyAuthPayload(payload);
          }
        }
      } catch {
        if (!cancelled) {
          clearAuthState();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-time bootstrap + revive
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const refreshThrottleMs = Math.max(
      60 * 1000,
      Math.floor((Number(securityConfig.accessTokenTtlSec) || 1800) * 0.4) * 1000
    );
    const markActivity = () => {
      lastActivityRef.current = Date.now();
      if (sessionWarning) setSessionWarning(false);
      sessionEndedRef.current = false;
      if (
        sessionPreferences.extendSessionWhileActive &&
        refreshToken &&
        Date.now() - lastTokenRefreshRef.current >= refreshThrottleMs
      ) {
        lastTokenRefreshRef.current = Date.now();
        refreshSession().catch(() => {
          // Ignore background refresh failures; idle lock still applies.
        });
      }
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart", "pointerdown"];
    events.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));
    const onVisible = () => {
      if (document.visibilityState === "visible") markActivity();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, markActivity));
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [
    refreshSession,
    refreshToken,
    securityConfig.accessTokenTtlSec,
    sessionPreferences.extendSessionWhileActive,
    sessionWarning,
    user,
  ]);

  useEffect(() => {
    if (!user) return undefined;
    const timeoutMs = Math.max(1, effectiveSessionTimeoutMinutes) * 60 * 1000;
    const warningMs = Math.max(60 * 1000, timeoutMs - 60 * 1000);
    const id = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= warningMs && idleMs < timeoutMs) {
        setSessionWarning(true);
      }
      if (idleMs >= timeoutMs && !sessionEndedRef.current) {
        sessionEndedRef.current = true;
        lockWorkstation("idle-timeout");
      }
    }, 5000);
    return () => clearInterval(id);
  }, [effectiveSessionTimeoutMinutes, lockWorkstation, user]);

  const continueSession = useCallback(async () => {
    await refreshSession();
    workstationLockStore.getState().unlock();
    lastActivityRef.current = Date.now();
    setSessionWarning(false);
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      apiBaseUrl: API_BASE,
      accessToken,
      refreshToken,
      sessionContext,
      user,
      isAuthenticated: Boolean(user && accessToken),
      loading,
      error,
      pendingMfa,
      pendingMfaEnrollment,
      securityConfig,
      sessionPreferences,
      effectiveSessionTimeoutMinutes,
      setSessionPreferences,
      sessionWarning,
      workstationLocked,
      setError,
      login,
      loginWithPasskey,
      registerPasskey,
      submitMfa,
      logout,
      lockWorkstation,
      unlockWorkstation,
      refreshSession,
      continueSession,
      beginMfaEnrollment,
      verifyMfaEnrollment,
      disableMfa,
      listSessions,
      logoutAllSessions,
      hydrateCurrentUser,
      clearAuthState,
    }),
    [
      accessToken,
      beginMfaEnrollment,
      clearAuthState,
      continueSession,
      disableMfa,
      listSessions,
      lockWorkstation,
      error,
      loading,
      login,
      loginWithPasskey,
      registerPasskey,
      logout,
      unlockWorkstation,
      pendingMfa,
      pendingMfaEnrollment,
      refreshSession,
      refreshToken,
      sessionContext,
      logoutAllSessions,
      effectiveSessionTimeoutMinutes,
      securityConfig,
      sessionPreferences,
      setSessionPreferences,
      sessionWarning,
      workstationLocked,
      submitMfa,
      user,
      verifyMfaEnrollment,
      hydrateCurrentUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
