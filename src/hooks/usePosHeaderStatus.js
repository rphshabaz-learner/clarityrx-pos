import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { fetchPosHealth } from "../services/posApi";
import { isPosPickupSyncEnabled } from "../lib/apiConfig";
import { usePosPickups } from "./usePosPickups";

const HEALTH_POLL_MS = 30_000;

function normalizeKrollStatus(healthPayload) {
  const kroll = healthPayload?.kroll;
  if (kroll && typeof kroll === "object") {
    return {
      connected: Boolean(kroll.connected ?? kroll.ok),
      label: kroll.connected ? "Kroll connected" : "Kroll offline",
      detail: kroll.message || kroll.lastSync || "",
    };
  }
  const enabled =
    process.env.REACT_APP_POS_KROLL_ENABLED === "1" || process.env.NEXT_PUBLIC_POS_KROLL_ENABLED === "1";
  if (!enabled) {
    return { connected: null, label: "Kroll n/a", detail: "Not configured on this till" };
  }
  return { connected: false, label: "Kroll pending", detail: "Awaiting health signal" };
}

export function usePosHeaderStatus() {
  const { accessToken } = useAuth();
  const { pickups, isLoading: pickupsLoading, error: pickupError, reload: reloadPickups } = usePosPickups();
  const [health, setHealth] = useState({ ok: null, message: "", checkedAt: null });
  const [kroll, setKroll] = useState(normalizeKrollStatus(null));

  const refreshHealth = useCallback(async () => {
    if (!accessToken) {
      setHealth({ ok: null, message: "Signed out", checkedAt: Date.now() });
      return;
    }
    try {
      const payload = await fetchPosHealth(accessToken);
      setHealth({
        ok: Boolean(payload?.ok ?? true),
        message: payload?.message || "Transmit API online",
        checkedAt: Date.now(),
      });
      setKroll(normalizeKrollStatus(payload));
    } catch (cause) {
      setHealth({
        ok: false,
        message: cause?.message || "Transmit API unreachable",
        checkedAt: Date.now(),
      });
      setKroll(normalizeKrollStatus(null));
    }
  }, [accessToken]);

  useEffect(() => {
    void refreshHealth();
    const timer = setInterval(() => {
      void refreshHealth();
    }, HEALTH_POLL_MS);
    return () => clearInterval(timer);
  }, [refreshHealth]);

  const pickupSyncOn = isPosPickupSyncEnabled();
  const readyPickups = pickups.filter((row) => row?.status !== "picked_up");
  const syncStatus = pickupSyncOn
    ? pickupError
      ? { tone: "warn", label: "Pickup sync issue", detail: pickupError }
      : pickupsLoading
        ? { tone: "neutral", label: "Syncing pickups", detail: "" }
        : { tone: "ok", label: "Pickup sync live", detail: `${readyPickups.length} ready` }
    : health.ok === false
      ? { tone: "warn", label: "Offline mode", detail: health.message }
      : { tone: "ok", label: "Sync ready", detail: health.message };

  return {
    health,
    kroll,
    syncStatus,
    pickups: readyPickups,
    pickupTotal: readyPickups.length,
    pickupSyncOn,
    reloadPickups,
    refreshHealth,
  };
}
