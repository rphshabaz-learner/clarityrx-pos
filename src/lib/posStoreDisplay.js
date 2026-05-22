import { resolveWorkspaceSession } from "../session/workspaceSession";

export function resolveStoreDisplayName() {
  const configured =
    process.env.REACT_APP_POS_STORE_NAME ||
    process.env.NEXT_PUBLIC_POS_STORE_NAME ||
    "";
  if (configured.trim()) {
    return configured.trim();
  }
  const { workspaceId } = resolveWorkspaceSession();
  if (!workspaceId || workspaceId === "default-store") {
    return "ClarityRx Store";
  }
  return workspaceId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function resolveStoreId() {
  return resolveWorkspaceSession().workspaceId;
}
