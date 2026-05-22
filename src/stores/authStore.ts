import { create } from "zustand";
import type { WorkspaceSessionContext } from "../session/workspaceSession";
import { resolveWorkspaceSession } from "../session/workspaceSession";

export type AuthUser = {
  id: string;
  username: string;
  fullName?: string;
  role: string;
  licenseNumber?: string;
  mfaEnabled?: boolean;
};

type AuthStoreState = {
  user: AuthUser | null;
  accessToken: string;
  refreshToken: string;
  sessionContext: WorkspaceSessionContext;
  locked: boolean;
  setAuth: (payload: Partial<AuthStoreState>) => void;
  setLocked: (locked: boolean) => void;
  clearAuth: () => void;
};

export const useEnterpriseAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  accessToken: "",
  refreshToken: "",
  sessionContext: resolveWorkspaceSession(),
  locked: false,
  setAuth: (payload) =>
    set((state) => ({
      ...state,
      ...payload,
      sessionContext: payload.sessionContext || state.sessionContext,
    })),
  setLocked: (locked) => set({ locked }),
  clearAuth: () =>
    set((state) => ({
      user: null,
      accessToken: "",
      refreshToken: "",
      locked: false,
      sessionContext: { ...state.sessionContext, sessionId: null },
    })),
}));

export const enterpriseAuthStore = useEnterpriseAuthStore;
