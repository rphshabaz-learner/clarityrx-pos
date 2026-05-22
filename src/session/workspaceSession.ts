export type WorkspaceSessionContext = {
  workspaceId: string;
  windowId: string;
  deviceId: string;
  workstationId: string;
  sessionId: string | null;
  deviceLabel: string;
  launchedAt: string;
  electron: boolean;
};

type ElectronSessionBridge = {
  getSessionContext?: () => Partial<WorkspaceSessionContext> | Promise<Partial<WorkspaceSessionContext>>;
  lockWorkstation?: (reason?: string) => Promise<void>;
  unlockWorkstation?: () => Promise<void>;
  secureStorage?: {
    get?: (key: string) => Promise<string | null>;
    set?: (key: string, value: string) => Promise<void>;
    remove?: (key: string) => Promise<void>;
  };
};

declare global {
  interface Window {
    clarityRxElectron?: ElectronSessionBridge;
    __CLARITYRX_SESSION__?: WorkspaceSessionContext;
  }
}

const DEFAULT_WORKSPACE_ID = "default-workspace";
const DEFAULT_DEVICE_LABEL = "Browser workstation";

function readSearchParam(name: string): string {
  if (typeof window === "undefined") return "";
  try {
    return new URLSearchParams(window.location.search).get(name) || "";
  } catch {
    return "";
  }
}

function readStoredId(key: string, prefix: string): string {
  if (typeof window === "undefined") return `${prefix}-server`;
  const existing = window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
  if (existing) return existing;
  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(key, generated);
  return generated;
}

function readWindowId(): string {
  if (typeof window === "undefined") return "window-server";
  const fromQuery = readSearchParam("windowId");
  if (fromQuery) {
    window.sessionStorage.setItem("clarityrx-window-id", fromQuery);
    return fromQuery;
  }
  const existing = window.sessionStorage.getItem("clarityrx-window-id");
  if (existing) return existing;
  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `window-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem("clarityrx-window-id", generated);
  return generated;
}

export function resolveWorkspaceSession(overrides: Partial<WorkspaceSessionContext> = {}): WorkspaceSessionContext {
  if (typeof window !== "undefined" && window.__CLARITYRX_SESSION__) {
    return { ...window.__CLARITYRX_SESSION__, ...overrides };
  }

  const workspaceId =
    overrides.workspaceId ||
    readSearchParam("workspaceId") ||
    (typeof window !== "undefined" ? window.localStorage.getItem("clarityrx-workspace-id") || "" : "") ||
    DEFAULT_WORKSPACE_ID;
  const context: WorkspaceSessionContext = {
    workspaceId,
    windowId: overrides.windowId || readWindowId(),
    deviceId: overrides.deviceId || readStoredId("clarityrx-device-id", "device"),
    workstationId: overrides.workstationId || readStoredId("clarityrx-workstation-id", "workstation"),
    sessionId: overrides.sessionId || null,
    deviceLabel: overrides.deviceLabel || DEFAULT_DEVICE_LABEL,
    launchedAt: overrides.launchedAt || new Date().toISOString(),
    electron: Boolean(overrides.electron || (typeof window !== "undefined" && window.clarityRxElectron)),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem("clarityrx-workspace-id", context.workspaceId);
    window.__CLARITYRX_SESSION__ = context;
  }

  return context;
}

export function updateWorkspaceSession(patch: Partial<WorkspaceSessionContext>): WorkspaceSessionContext {
  const next = resolveWorkspaceSession(patch);
  if (typeof window !== "undefined") {
    window.__CLARITYRX_SESSION__ = next;
  }
  return next;
}

export function buildSessionHeaders(context = resolveWorkspaceSession()): Record<string, string> {
  return {
    "X-ClarityRx-Workspace-Id": context.workspaceId,
    "X-ClarityRx-Window-Id": context.windowId,
    "X-ClarityRx-Device-Id": context.deviceId,
    "X-ClarityRx-Workstation-Id": context.workstationId,
  };
}

export function sessionContextForAudit(context = resolveWorkspaceSession()) {
  return {
    workspaceId: context.workspaceId,
    windowId: context.windowId,
    deviceId: context.deviceId,
    workstationId: context.workstationId,
    sessionId: context.sessionId,
    deviceLabel: context.deviceLabel,
    electron: context.electron,
  };
}
