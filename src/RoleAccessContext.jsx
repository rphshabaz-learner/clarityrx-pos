import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { canUseClinicalVerification, canVerifyPrescription } from "./lib/clinicalAccess";

export const ROLE_DEFINITIONS = {
  admin: {
    id: "admin",
    label: "Admin",
    shortLabel: "Admin",
    description: "Full system configuration, reporting, and workflow access.",
  },
  pharmacist: {
    id: "pharmacist",
    label: "Pharmacist",
    shortLabel: "Pharmacist",
    description: "Clinical workflow access without administrative system controls.",
  },
  technician: {
    id: "technician",
    label: "Technician",
    shortLabel: "Tech",
    description: "Operational workflow access for intake, entry, insurance follow-up, filling, and pickup support.",
  },
  cashier: {
    id: "cashier",
    label: "Cashier",
    shortLabel: "Cashier",
    description: "Point-of-sale access with limited operational and messaging visibility.",
  },
  assistant: {
    id: "assistant",
    label: "Pharmacy Assistant",
    shortLabel: "Asst",
    description: "Operational support without clinical verification or pharmacist approval actions.",
  },
  relief_pharmacist: {
    id: "relief_pharmacist",
    label: "Relief Pharmacist",
    shortLabel: "Relief",
    description: "Locum pharmacist with clinical verification and dispensing authority.",
  },
  store_manager: {
    id: "store_manager",
    label: "Store Manager",
    shortLabel: "Manager",
    description: "Store operations, reporting, and staff oversight without full system admin.",
  },
  student: {
    id: "student",
    label: "Student",
    shortLabel: "Student",
    description: "Supervised learning access — prepare and observe, no independent verification.",
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
  "screen.dashboard": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "cashier"],
  "screen.dataEntry": ["admin", "pharmacist", "relief_pharmacist", "technician", "assistant", "student"],
  "screen.rx": ["admin", "pharmacist", "relief_pharmacist", "technician", "assistant", "student"],
  "screen.verification": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student"],
  "screen.dispensing": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student"],
  "screen.incomingQueue": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student"],
  "screen.clinicalQueue": ["admin", "pharmacist", "relief_pharmacist"],
  "screen.fillingQueue": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student"],
  "screen.verificationQueue": ["admin", "pharmacist", "relief_pharmacist"],
  "screen.pickupQueue": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student"],
  "screen.problemResolutionQueue": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student"],
  "screen.clinicalVerification": ["admin", "pharmacist", "relief_pharmacist"],
  "screen.fillingProduction": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student"],
  "screen.pharmacistFinalCheck": ["admin", "pharmacist", "relief_pharmacist"],
  "screen.pickupDelivery": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student"],
  "screen.billing": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student"],
  "screen.packaging": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student"],
  "screen.consultation": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student"],
  "screen.labRequisition": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician"],
  "screen.patients": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student"],
  "screen.prescribers": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student"],
  "screen.inventory": ["admin", "pharmacist", "relief_pharmacist", "store_manager"],
  "screen.drugProfile": ["admin", "pharmacist", "relief_pharmacist"],
  "screen.pos": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student", "cashier"],
  "screen.billingInsurance": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student"],
  "screen.refills": ["admin", "pharmacist", "relief_pharmacist", "store_manager"],
  "screen.reports": ["admin", "pharmacist", "relief_pharmacist", "store_manager"],
  "screen.reportingAuditLogs": ["admin", "pharmacist", "relief_pharmacist", "store_manager"],
  "screen.messages": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "cashier"],
  "screen.settings": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant"],
  "screen.administration": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant"],
  "screen.admin": ["admin"],
  "settings.manage": ["admin", "store_manager"],
  "backup.manage": ["admin", "store_manager"],
  "roles.manage": ["admin"],
  "admin.console": ["admin"],
  /** Platform posture, backups, validation schedule, privacy breaches, HL7 queue management. */
  "compliance.review": ["admin", "pharmacist", "relief_pharmacist", "store_manager"],
  /** Patient consent + operational incident reporting (matches server RBAC for those routes). */
  "compliance.record": ["admin", "pharmacist", "relief_pharmacist", "technician", "assistant", "student"],
  /** PODSA §23 retention, legal hold placement, and authorized destruction. */
  "compliance.retention_manage": ["admin", "pharmacist"],
  /** BC PharmaNet protective word attach/remove at pharmacy (BC IMR s. 28 — pharmacist only). */
  "compliance.protective_word": ["admin", "pharmacist", "relief_pharmacist"],
  /** PharmaNet technical support access log (BC IMR s. 17). */
  "compliance.technical_support": ["admin", "pharmacist", "relief_pharmacist"],
  /** BC IMR Schedule 1 — claims adjudication (pharmacist / technician roles). */
  "pharmanet.schedule1_claims": ["admin", "pharmacist", "relief_pharmacist", "technician", "store_manager"],
  /** BC IMR Schedule 1 — medical history / patient profile (not cashier). */
  "pharmanet.schedule1_medical_history": [
    "admin",
    "pharmacist",
    "relief_pharmacist",
    "technician",
    "store_manager",
    "assistant",
    "student",
  ],
  "prescription.edit": ["admin", "pharmacist", "relief_pharmacist", "technician", "assistant", "student"],
  "prescription.upload": ["admin", "pharmacist", "relief_pharmacist", "technician", "assistant", "student"],
  "ocr.intake": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student"],
  "workflow.create": ["admin", "pharmacist", "relief_pharmacist", "technician", "assistant", "student"],
  "workflow.transition.basic": ["admin", "pharmacist", "relief_pharmacist", "technician", "assistant", "student"],
  "workflow.transition.verify": ["admin", "pharmacist", "relief_pharmacist"],
  "workflow.transition.pickup": ["admin", "pharmacist", "relief_pharmacist", "technician", "assistant", "student"],
  "workflow.alert.blocking": ["admin", "pharmacist", "relief_pharmacist"],
  "workflow.resume": ["admin", "pharmacist", "relief_pharmacist", "technician", "assistant", "student"],
  "reports.export": ["admin", "store_manager"],
  "pos.charge": ["admin", "pharmacist", "relief_pharmacist", "store_manager", "technician", "assistant", "student", "cashier"],
};

export const SCREEN_IDS = [
  "dashboard",
  "dataEntry",
  "rx",
  "verification",
  "dispensing",
  "incomingQueue",
  "clinicalQueue",
  "fillingQueue",
  "verificationQueue",
  "pickupQueue",
  "problemResolutionQueue",
  "clinicalVerification",
  "fillingProduction",
  "pharmacistFinalCheck",
  "pickupDelivery",
  "billing",
  "packaging",
  "consultation",
  "labRequisition",
  "patients",
  "prescribers",
  "inventory",
  "drugProfile",
  "pos",
  "billingInsurance",
  "refills",
  "reports",
  "reportingAuditLogs",
  "messages",
  "settings",
  "administration",
  "admin",
];

function loadStoredRole() {
  return "pharmacist";
}

const RoleAccessContext = createContext(null);

export function getRolesForPermission(permissionId) {
  return PERMISSIONS[permissionId] || [];
}

export function getAccessibleScreensForRole(role) {
  return SCREEN_IDS.filter((screenId) => getRolesForPermission(`screen.${screenId}`).includes(role));
}

export function getDefaultScreenForRole(role) {
  const screens = getAccessibleScreensForRole(role);
  return screens.includes("dashboard") ? "dashboard" : screens[0] || "dashboard";
}

export function RoleAccessProvider({ children }) {
  const { user } = useAuth();
  const activeRole = ROLE_DEFINITIONS[user?.role] ? user.role : loadStoredRole();

  const hasPermission = useCallback(
    (permissionId) => {
      return getRolesForPermission(permissionId).includes(activeRole);
    },
    [activeRole]
  );

  const clinicalUser = useMemo(() => ({ role: activeRole, supervisingPharmacists: user?.supervisingPharmacists }), [activeRole, user?.supervisingPharmacists]);

  const canVerifyRx = useMemo(
    () => hasPermission("workflow.transition.verify") && canVerifyPrescription(clinicalUser),
    [clinicalUser, hasPermission]
  );

  const canUseClinicalVerificationUi = useMemo(() => canUseClinicalVerification(clinicalUser), [clinicalUser]);

  const canAccessScreen = useCallback(
    (screenId) => {
      return hasPermission(`screen.${screenId}`);
    },
    [hasPermission]
  );

  const setActiveRole = useCallback(
    () => {
      // Roles are now issued by authenticated server claims and cannot be switched client-side.
    },
    []
  );

  const value = useMemo(
    () => ({
      activeRole,
      roleDefinition: ROLE_DEFINITIONS[activeRole],
      roleDefinitions: ROLE_DEFINITIONS,
      roleOrder: ROLE_ORDER,
      hasPermission,
      canVerifyPrescription: canVerifyRx,
      canUseClinicalVerification: canUseClinicalVerificationUi,
      supervisingPharmacists: user?.supervisingPharmacists || [],
      canAccessScreen,
      setActiveRole,
      getDefaultScreenForRole,
      getAccessibleScreensForRole,
    }),
    [activeRole, canUseClinicalVerificationUi, canVerifyRx, hasPermission, canAccessScreen, setActiveRole, user?.supervisingPharmacists]
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
