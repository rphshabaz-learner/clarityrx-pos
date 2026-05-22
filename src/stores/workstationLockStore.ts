import { create } from "zustand";

type WorkstationLockState = {
  locked: boolean;
  lockedAt: string | null;
  reason: string | null;
  warning: boolean;
  setWarning: (warning: boolean) => void;
  lock: (reason: string) => void;
  unlock: () => void;
};

export const useWorkstationLockStore = create<WorkstationLockState>((set) => ({
  locked: false,
  lockedAt: null,
  reason: null,
  warning: false,
  setWarning: (warning) => set({ warning }),
  lock: (reason) => set({ locked: true, lockedAt: new Date().toISOString(), reason, warning: false }),
  unlock: () => set({ locked: false, lockedAt: null, reason: null, warning: false }),
}));

export const workstationLockStore = useWorkstationLockStore;
