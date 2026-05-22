import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";
import {
  POS_ADMIN_ROLES,
  POS_RBAC_TIERS,
  POS_SUPERVISOR_ROLES,
  posAccessTierForRole,
} from "./lib/posRoleAccess";

/** POS till roles — independent of pharmacy clinical screens. */
export const ROLE_DEFINITIONS = {
  admin: {
    id: "admin",
    label: "Admin",
    shortLabel: "Admin",
    description: "Configurations, tax settings, and security.",
    accessTier: "admin",
  },
  supervisor: {
    id: "supervisor",
    label: "Supervisor",
    shortLabel: "Supervisor",
    description: "Refunds, voids, and discounts on the till.",
    accessTier: "supervisor",
  },
  pharmacist: {
    id: "pharmacist",
    label: "Pharmacist",
    shortLabel: "Pharmacist",
    description: "Supervisor-level till access (voids, refunds, discounts).",
    accessTier: "supervisor",
  },
  relief_pharmacist: {
    id: "relief_pharmacist",
    label: "Relief Pharmacist",
    shortLabel: "Relief",
    description: "Supervisor-level till access (voids, refunds, discounts).",
    accessTier: "supervisor",
  },
  store_manager: {
    id: "store_manager",
    label: "Store Manager",
    shortLabel: "Manager",
    description: "Supervisor-level till access (voids, refunds, discounts).",
    accessTier: "supervisor",
  },
  technician: {
    id: "technician",
    label: "Technician",
    shortLabel: "Tech",
    description: "Sales and inventory workflows.",
    accessTier: "cashier",
  },
  assistant: {
    id: "assistant",
    label: "Pharmacy Assistant",
    shortLabel: "Asst",
    description: "Sales and supporting workflows.",
    accessTier: "cashier",
  },
  student: {
    id: "student",
    label: "Student",
    shortLabel: "Student",
    description: "Sales only on the till.",
    accessTier: "cashier",
  },
  cashier: {
    id: "cashier",
    label: "Cashier",
    shortLabel: "Cashier",
    description: "Sales only on the till.",
    accessTier: "cashier",
  },
};

export const ROLE_ORDER = [
  "admin",
  "supervisor",
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
    "supervisor",
    "pharmacist",
    "relief_pharmacist",
    "store_manager",
    "technician",
    "assistant",
    "student",
    "cashier",
  ],
  /** Ring sales and complete payment. */
  "pos.charge": [
    "admin",
    "supervisor",
    "pharmacist",
    "relief_pharmacist",
    "store_manager",
    "technician",
    "assistant",
    "student",
    "cashier",
  ],
  "pos.voids": POS_SUPERVISOR_ROLES,
  "pos.refunds": POS_SUPERVISOR_ROLES,
  "pos.discounts": POS_SUPERVISOR_ROLES,
  "pos.configure": POS_ADMIN_ROLES,
  "pos.tax": POS_ADMIN_ROLES,
  "pos.security": POS_ADMIN_ROLES,
  "pos.purchasing": [
    "admin",
    "pharmacist",
    "relief_pharmacist",
    "store_manager",
    "technician",
    "assistant",
  ],
  "pos.inventory": [
    "admin",
    "pharmacist",
    "relief_pharmacist",
    "store_manager",
    "technician",
    "assistant",
  ],
  "pos.handheld": [
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
    "supervisor",
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
    "supervisor",
  ],
  "pos.rx": [
    "admin",
    "supervisor",
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
    "supervisor",
  ],
  "pos.giftcards": [
    "admin",
    "pharmacist",
    "relief_pharmacist",
    "store_manager",
    "technician",
    "assistant",
    "supervisor",
    "cashier",
  ],
};

/** Human-readable labels for the permissions matrix (Staff → Permissions). */
export const POS_PERMISSION_DEFINITIONS = [
  { id: "screen.pos", label: "POS workspace", group: "workspace" },
  { id: "pos.charge", label: "Sales (charge & tender)", group: "sales" },
  { id: "pos.voids", label: "Voids", group: "supervisor" },
  { id: "pos.refunds", label: "Refunds", group: "supervisor" },
  { id: "pos.discounts", label: "Discounts & price override", group: "supervisor" },
  { id: "pos.configure", label: "Configurations", group: "admin" },
  { id: "pos.tax", label: "Tax settings", group: "admin" },
  { id: "pos.security", label: "Security & privacy", group: "admin" },
  { id: "pos.purchasing", label: "Purchasing & receiving", group: "workspace" },
  { id: "pos.inventory", label: "Inventory maintenance", group: "workspace" },
  { id: "pos.handheld", label: "Handheld (mobile)", group: "workspace" },
  { id: "pos.promotions", label: "Promotions", group: "workspace" },
  { id: "pos.customers", label: "Customers", group: "workspace" },
  { id: "pos.reports", label: "Reporting, staff & audit", group: "workspace" },
  { id: "pos.rx", label: "Rx integration", group: "workspace" },
  { id: "pos.selfcheckout", label: "Self checkout", group: "workspace" },
  { id: "pos.giftcards", label: "Gift cards", group: "workspace" },
];

export { POS_RBAC_TIERS, posAccessTierForRole };

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
  const accessTier = posAccessTierForRole(activeRole);

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
      accessTier,
      roleDefinition: ROLE_DEFINITIONS[activeRole],
      roleDefinitions: ROLE_DEFINITIONS,
      roleOrder: ROLE_ORDER,
      hasPermission,
      canAccessScreen,
      setActiveRole,
      getDefaultScreenForRole,
      getAccessibleScreensForRole,
    }),
    [activeRole, accessTier, hasPermission, canAccessScreen, setActiveRole]
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
