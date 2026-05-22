/**
 * POS role tiers for cashier / supervisor / admin access.
 * Pharmacy clinical roles map into these tiers for till permissions.
 */

export const POS_TIER_CASHIER = "cashier";
export const POS_TIER_SUPERVISOR = "supervisor";
export const POS_TIER_ADMIN = "admin";

/** Roles that map to the supervisor till tier (voids, refunds, discounts). */
export const POS_SUPERVISOR_ROLES = [
  "supervisor",
  "admin",
  "store_manager",
  "pharmacist",
  "relief_pharmacist",
];

/** Roles that map to the admin till tier (configure, tax, security). */
export const POS_ADMIN_ROLES = ["admin"];

export const POS_RBAC_TIERS = [
  {
    id: POS_TIER_CASHIER,
    label: "Cashier",
    summary: "Sales only — ring items, take payment, attach customers and Rx pickups.",
    capabilities: ["Complete sales", "Scan & add items", "Customer / Rx lookup for sale"],
  },
  {
    id: POS_TIER_SUPERVISOR,
    label: "Supervisor",
    summary: "Everything cashiers can do, plus refunds, voids, and discounts.",
    capabilities: ["Refunds", "Voids (line & cart)", "Cart & line discounts", "Price override with manager session"],
  },
  {
    id: POS_TIER_ADMIN,
    label: "Admin",
    summary: "Full till configuration — store settings, tax, and security / privacy.",
    capabilities: ["Configurations (favorites, till, terminals)", "Tax settings", "Security & privacy retention"],
  },
];

export function posAccessTierForRole(role) {
  if (POS_ADMIN_ROLES.includes(role)) return POS_TIER_ADMIN;
  if (POS_SUPERVISOR_ROLES.includes(role)) return POS_TIER_SUPERVISOR;
  return POS_TIER_CASHIER;
}

export function posTierIncludesCapability(tier, capability) {
  const order = [POS_TIER_CASHIER, POS_TIER_SUPERVISOR, POS_TIER_ADMIN];
  const tierRank = {
    [POS_TIER_CASHIER]: 0,
    [POS_TIER_SUPERVISOR]: 1,
    [POS_TIER_ADMIN]: 2,
  };
  const required = {
    sales: POS_TIER_CASHIER,
    voids: POS_TIER_SUPERVISOR,
    refunds: POS_TIER_SUPERVISOR,
    discounts: POS_TIER_SUPERVISOR,
    configure: POS_TIER_ADMIN,
    tax: POS_TIER_ADMIN,
    security: POS_TIER_ADMIN,
  };
  const need = required[capability];
  if (!need) return false;
  return tierRank[tier] >= tierRank[need];
}
