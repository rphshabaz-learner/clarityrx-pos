import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";

/** POS till roles — independent of pharmacy clinical screens. */
export const ROLE_DEFINITIONS = {
  admin: {
    id: "admin",
    label: "Admin",
    shortLabel: "Admin",
    description: "Full POS till access including charge.",
  },
  pharmacist: {
    id: "pharmacist",
    label: "Pharmacist",
    shortLabel: "Pharmacist",
    description: "POS till access including charge.",
  },
  relief_pharmacist: {
    id: "relief_pharmacist",
    label: "Relief Pharmacist",
    shortLabel: "Relief",
    description: "POS till access including charge.",
  },
  store_manager: {
    id: "store_manager",
    label: "Store Manager",
    shortLabel: "Manager",
    description: "POS till access including charge.",
  },
  technician: {
    id: "technician",
    label: "Technician",
    shortLabel: "Tech",
    description: "POS till access including charge.",
  },
  assistant: {
    id: "assistant",
    label: "Pharmacy Assistant",
    shortLabel: "Asst",
    description: "POS till access including charge.",
  },
  student: {
    id: "student",
    label: "Student",
    shortLabel: "Student",
    description: "POS till access including charge.",
  },
  cashier: {
    id: "cashier",
    label: "Cashier",
    shortLabel: "Cashier",
    description: "Point-of-sale access.",
  },
};

export const ROLE_ORDER = [
  "admin",
  "pharmacist",
  "relief_pharmacist",
  "store_manager",
  "technician",
  "assistant",
  "student",
  "cashier",
];

const PERMISSIONS = {
  "screen.pos": [
    "admin",
    "pharmacist",
    "relief_pharmacist",
    "store_manager",
    "technician",
    "assistant",
    "student",
    "cashier",
  ],
  "pos.charge": [
    "admin",
    "pharmacist",
    "relief_pharmacist",
    "store_manager",
    "technician",
    "assistant",
    "student",
    "cashier",
  ],
  "pos.purchasing": [
    "admin",
    "pharmacist",
    "relief_pharmacist",
    "store_manager",
    "technician",
    "assistant",
  ],
  "pos.promotions": [
    "admin",
    "pharmacist",
    "relief_pharmacist",
    "store_manager",
    "technician",
    "assistant",
  ],
  "pos.customers": [
    "admin",
    "pharmacist",
    "relief_pharmacist",
    "store_manager",
    "technician",
    "assistant",
    "cashier",
  ],
  "pos.reports": [
    "admin",
    "pharmacist",
    "relief_pharmacist",
    "store_manager",
  ],
  "pos.rx": [
    "admin",
    "pharmacist",
    "relief_pharmacist",
    "store_manager",
    "technician",
    "assistant",
    "cashier",
  ],
  "pos.selfcheckout": [
    "admin",
    "pharmacist",
    "relief_pharmacist",
    "store_manager",
    "technician",
    "assistant",
    "cashier",
  ],
};

export const SCREEN_IDS = ["pos"];

export function getRolesForPermission(permissionId) {
  return PERMISSIONS[permissionId] || [];
}

export function getAccessibleScreensForRole(role) {
  return SCREEN_IDS.filter((screenId) => getRolesForPermission(`screen.${screenId}`).includes(role));
}

export function getDefaultScreenForRole(role) {
  const screens = getAccessibleScreensForRole(role);
  return screens[0] || "pos";
}

const RoleAccessContext = createContext(null);

export function RoleAccessProvider({ children }) {
  const { user } = useAuth();
  const activeRole = ROLE_DEFINITIONS[user?.role] ? user.role : "cashier";

  const hasPermission = useCallback(
    (permissionId) => getRolesForPermission(permissionId).includes(activeRole),
    [activeRole]
  );

  const canAccessScreen = useCallback(
    (screenId) => hasPermission(`screen.${screenId}`),
    [hasPermission]
  );

  const setActiveRole = useCallback(() => {}, []);

  const value = useMemo(
    () => ({
      activeRole,
      roleDefinition: ROLE_DEFINITIONS[activeRole],
      roleDefinitions: ROLE_DEFINITIONS,
      roleOrder: ROLE_ORDER,
      hasPermission,
      canAccessScreen,
      setActiveRole,
      getDefaultScreenForRole,
      getAccessibleScreensForRole,
    }),
    [activeRole, hasPermission, canAccessScreen, setActiveRole]
  );

  return <RoleAccessContext.Provider value={value}>{children}</RoleAccessContext.Provider>;
}

export function useRoleAccess() {
  const ctx = useContext(RoleAccessContext);
  if (!ctx) {
    throw new Error("useRoleAccess must be used within RoleAccessProvider");
  }
  return ctx;
}
