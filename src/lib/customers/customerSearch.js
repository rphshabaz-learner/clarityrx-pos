import { customerDisplayName } from "./customerTypes";

function norm(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function searchPosCustomers(customers, query) {
  const q = norm(query);
  if (!q) return [];
  return customers.filter((row) => {
    const profile = row.profile || {};
    const haystack = [
      row.accountNumber,
      row.id,
      customerDisplayName(row),
      profile.firstName,
      profile.lastName,
      profile.phone,
      profile.email,
      row.loyalty?.memberId,
      row.rxProfile?.krollPatientId,
      row.facility?.name,
      ...(row.pickups || []).map((p) => p.bagBarcode),
      ...(row.pickups || []).flatMap((p) => p.rxNumbers || []),
    ]
      .filter(Boolean)
      .map(norm);
    return haystack.some((part) => part.includes(q));
  });
}
