/** Normalize app / API role strings for clinical access checks. */
export function normalizeClinicalRole(role) {
  const value = String(role || "")
    .trim()
    .toLowerCase();
  if (value === "pharmacist") return "pharmacist";
  if (value === "relief_pharmacist") return "relief_pharmacist";
  if (value === "assistant") return "assistant";
  if (value === "technician") return "technician";
  if (value === "student") return "student";
  if (value === "cashier") return "cashier";
  if (value === "store_manager") return "store_manager";
  if (value === "admin") return "admin";
  return value;
}

/** Pharmacists, relief pharmacists, and admins may clinically verify prescriptions. */
export function canVerifyPrescription(user) {
  const role = normalizeClinicalRole(user?.role);
  return role === "pharmacist" || role === "relief_pharmacist" || role === "admin";
}

/** Assistants cannot use pharmacist verification controls. */
export function canUseClinicalVerification(user) {
  const role = normalizeClinicalRole(user?.role);
  return role !== "assistant" && role !== "student";
}

export function requiresSupervisingPharmacist(user) {
  const role = normalizeClinicalRole(user?.role);
  return role === "technician" || role === "assistant" || role === "student";
}

export function parseSupervisingPharmacistIds(user) {
  const raw = user?.supervisingPharmacists ?? user?.supervising_pharmacists;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function listSupervisingPharmacistLabels(user, pharmacistDirectory = []) {
  const ids = parseSupervisingPharmacistIds(user);
  if (!ids.length) return [];
  const byId = new Map(pharmacistDirectory.map((row) => [row.id, row]));
  return ids.map((id) => {
    const match = byId.get(id);
    return match?.fullName || match?.username || id;
  });
}
