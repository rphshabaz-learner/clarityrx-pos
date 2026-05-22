export function searchFrontStoreProducts(products, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return products;
  const tokens = q.split(/\s+/).filter(Boolean);
  return products
    .map((row) => {
      const hay = [
        row.sku,
        row.name,
        row.upc,
        row.category,
        row.departmentId,
        ...(row.barcodes || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      let score = 0;
      for (const token of tokens) {
        if (row.sku?.toLowerCase() === token) score += 50;
        else if (row.upc?.toLowerCase() === token) score += 40;
        else if (row.sku?.toLowerCase().startsWith(token)) score += 30;
        else if (hay.includes(token)) score += 10;
      }
      return { row, score };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((hit) => hit.row);
}
