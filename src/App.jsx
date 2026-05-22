import React, { Suspense, useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import AuthScreen from "./modules/AuthScreen";
import { RoleAccessProvider, useRoleAccess } from "./RoleAccessContext";
import { QueryProvider } from "./providers/QueryProvider";
import PosScreen from "./modules/pos/PosScreen";
import { PosAppDataProvider } from "./PosAppDataProvider";
import PosGlobalStyles from "./PosGlobalStyles";
import { resolvePharmacyAppUrl } from "./lib/pharmacyAppConfig";

function PosLoading({ label = "Loading POS…" }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        color: "#374151",
      }}
    >
      {label}
    </div>
  );
}

function PosShell() {
  const { isAuthenticated, loading, workstationLocked, unlockWorkstation, user, logout } = useAuth();
  const { canAccessScreen, hasPermission } = useRoleAccess();
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");

  if (loading) {
    return <PosLoading label="Loading secure session…" />;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (workstationLocked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          padding: 24,
        }}
      >
        <div className="crx-card" style={{ width: "100%", maxWidth: 420, padding: 28 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Workstation locked</div>
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 18 }}>
            Re-enter your password to continue the POS session for {user?.fullName || user?.username || "this user"}.
          </div>
          <input
            className="crx-input"
            type="password"
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
            placeholder="Password"
            autoFocus
          />
          {unlockError ? <div style={{ color: "#b91c1c", fontSize: 12, marginTop: 8 }}>{unlockError}</div> : null}
          <button
            type="button"
            className="btn-primary"
            style={{ width: "100%", marginTop: 16 }}
            onClick={async () => {
              try {
                setUnlockError("");
                await unlockWorkstation(unlockPassword);
                setUnlockPassword("");
              } catch (e) {
                setUnlockError(e.message || "Unable to unlock workstation.");
              }
            }}
          >
            Unlock workstation
          </button>
        </div>
      </div>
    );
  }

  if (!canAccessScreen("pos")) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div className="crx-card" style={{ maxWidth: 420, padding: 28, textAlign: "center" }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>POS access required</h2>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
            Your role ({user?.role || "unknown"}) does not include point-of-sale access.
          </p>
          <button type="button" className="btn-secondary" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="crx-pos-app">
      <header className="crx-pos-app__header">
        <div>
          <div className="crx-pos-app__title">ClarityRx POS</div>
          <div className="crx-pos-app__meta">
            {user?.fullName || user?.username}
            {!hasPermission("pos.charge") ? " · view only" : ""}
          </div>
        </div>
        <div className="crx-pos-app__actions">
          <a className="btn-secondary" href={resolvePharmacyAppUrl()} style={{ textDecoration: "none" }}>
            Pharmacy app
          </a>
          <button type="button" className="btn-secondary" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </header>
      <main className="crx-pos-app__main">
        <Suspense fallback={<PosLoading />}>
          <PosScreen />
        </Suspense>
      </main>
    </div>
  );
}

function PosAuthenticatedTree() {
  return (
    <RoleAccessProvider>
      <PosAppDataProvider>
        <PosShell />
      </PosAppDataProvider>
    </RoleAccessProvider>
  );
}

export default function App() {
  return (
    <>
      <PosGlobalStyles />
      <QueryProvider>
        <AuthProvider>
          <PosAuthenticatedTree />
        </AuthProvider>
      </QueryProvider>
    </>
  );
}
