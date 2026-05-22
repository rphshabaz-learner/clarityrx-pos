/** Supported wholesalers for POS purchasing & receiving. */
export const WHOLESALERS = [
  {
    id: "mckesson",
    label: "McKesson",
    shortLabel: "McKesson",
    supportsEdi: true,
    supportsCatalogDownload: true,
    supportsInvoiceDownload: true,
  },
  {
    id: "kohl_frisch",
    label: "Kohl & Frisch",
    shortLabel: "K&F",
    supportsEdi: true,
    supportsCatalogDownload: true,
    supportsInvoiceDownload: true,
  },
  {
    id: "imperial",
    label: "Imperial Distributors",
    shortLabel: "Imperial",
    supportsEdi: true,
    supportsCatalogDownload: true,
    supportsInvoiceDownload: true,
  },
  {
    id: "head_office",
    label: "Head office promotions",
    shortLabel: "HO Promo",
    supportsEdi: false,
    supportsCatalogDownload: true,
    supportsInvoiceDownload: false,
    isPromotionSource: true,
  },
];

export function getWholesaler(id) {
  return WHOLESALERS.find((row) => row.id === id) || null;
}

export function wholesalerLabel(id) {
  return getWholesaler(id)?.label || id || "Unknown";
}
